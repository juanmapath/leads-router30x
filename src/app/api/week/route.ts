import { NextResponse } from 'next/server';
import leads from '../../../../data/leads.json';
import { replayJev } from '../../../engine/jev-client.ts';
import { decideForLead } from '../../../engine/decide.ts';
import { monthlyImpact } from '../../../engine/impact.ts';
import { legacyRoute } from '../../../engine/legacy.ts';
import { buildState } from '../../../engine/state.ts';
import type { Lead } from '../../../engine/types.ts';

export const runtime = 'nodejs';

// GET → "La semana de 30X": los 300 leads de una semana sintética por la regla actual y por Jev.
// Solo grabaciones (nunca llama en vivo): es la apertura del demo y debe responder igual siempre.
export async function GET() {
  const rows = [];
  for (const lead of leads as Lead[]) {
    const state = buildState(lead);
    const legacy = legacyRoute(lead).route;
    const call = replayJev(state);
    if (!call) {
      rows.push({ id: lead.id, legacy, action: 'cola_humana' as const, program: 'otro' as const, ms: 0, costUsd: 0 });
      continue;
    }
    const d = decideForLead(lead, call.answers);
    rows.push({ id: lead.id, legacy, action: d.action, program: d.program, ms: call.ms, costUsd: call.costUsd });
  }
  const discarded = rows.filter((r) => r.legacy !== 'entrevista');
  return NextResponse.json({
    n: rows.length,
    costUsd: rows.reduce((a, r) => a + r.costUsd, 0),
    msMean: Math.round(rows.reduce((a, r) => a + r.ms, 0) / rows.length),
    impact: monthlyImpact(discarded),
    rows: rows.map(({ id, legacy, action, program }) => ({ id, legacy, action, program })),
  });
}
