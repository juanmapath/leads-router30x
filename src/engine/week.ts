// "La semana de 30X": los leads de una semana sintética por la regla actual y por Jev, desde grabaciones.
// Si falta una grabación, falla: nunca la convierte en silencio en "cola humana" (se vería como 300 casos a persona).
import { decideForLead } from './decide.ts';
import { monthlyImpact } from './impact.ts';
import type { JevCall } from './jev-client.ts';
import { legacyRoute } from './legacy.ts';
import { buildState } from './state.ts';
import type { Action, Decision, Lead, ProgramId } from './types.ts';

export interface WeekRow { id: string; archetype?: string; legacy: 'entrevista' | 'gracias' | 'abandono'; action: Action; program: ProgramId; channel: Decision['channel']; needsHuman: boolean; ms: number; costUsd: number }

export function buildWeek(leads: Lead[], replay: (state: string) => JevCall | null) {
  const rows: WeekRow[] = [];
  const missing: string[] = [];
  for (const lead of leads) {
    const call = replay(buildState(lead));
    if (!call) { missing.push(lead.id); continue; }
    const d = decideForLead(lead, call.answers);
    rows.push({ id: lead.id, archetype: lead.archetype, legacy: legacyRoute(lead).route, action: d.action, program: d.program, channel: d.channel, needsHuman: d.needsHuman, ms: call.ms, costUsd: call.costUsd });
  }
  if (missing.length) throw new Error(`Faltan ${missing.length} grabaciones (${missing.slice(0, 5).join(', ')}…): corre npm run record.`);
  return {
    n: rows.length,
    costUsd: rows.reduce((a, r) => a + r.costUsd, 0),
    msMean: Math.round(rows.reduce((a, r) => a + r.ms, 0) / rows.length),
    impact: monthlyImpact(rows.filter((r) => r.legacy !== 'entrevista')),
    rows,
  };
}
