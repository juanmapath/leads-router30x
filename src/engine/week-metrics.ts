// Una sola fuente para las cifras de la semana: portada, semana, guion y playbook leen de aquí (docs/ux-negocio.md §1).
// Primero personas, después dólares, y dólares conservadores: el pipeline cuenta solo precios públicos;
// los planes corporativos (ticket a medida) se cuentan como oportunidades, no como dólares.
import { SCENARIOS, WEEKS_PER_MONTH, type Scenario } from './impact.ts';
import { PROGRAMS, programName } from './programs.ts';
import type { ProgramId } from './types.ts';
import type { WeekRow } from './week.ts';

export interface WeekMetrics {
  n: number;
  /** La regla los descarta: ven "gracias" o abandonaron sin acción. */
  discarded: number;
  /** Descartados que Jev manda al área de empresas. */
  b2b: number;
  /** Descartados que reciben una oferta concreta (agenda ya u otro programa). No incluye b2b. */
  offers: number;
  /** b2b + offers: descartados con un siguiente paso comercial. */
  rescued: number;
  /** Abandonos que pasan a contacto (una persona o el agente de voz): ninguno se pierde. */
  abandonRescue: number;
  /** De esos, los que reciben llamada inmediata del agente de voz. */
  abandonVoice: number;
  /** La regla los manda a un closer y Jev pide que una persona los revise antes. */
  doubtfulInterviews: number;
  toPerson: number;
  nurturing: number;
  byAction: Record<WeekRow['action'], number>;
  /** Fracción de los n que recibe su siguiente paso sin intervención humana (needsHuman = false). */
  autoNextStep: number;
  /** USD por semana: ofertas a descartados × precio público de su programa (sin corporativos ni programas sin precio). */
  listPipelineWeek: number;
  /** Ofertas cuyo programa no tiene precio público (no suman dólares). */
  offersWithoutPrice: number;
  /** Pipeline de lista por lead: lo que la regla manda a entrevista vs. lo que Jev enruta a un programa (precios públicos). */
  pipelinePerLead: { rule: number; jev: number };
  /** Ventas por mes si se cierra esa fracción del pipeline de lista rescatado (supuesto). */
  monthly: Record<Scenario, number>;
  byProgram: Array<{ program: ProgramId; name: string; leads: number; priceUsd?: number; pipelineWeek: number }>;
  costUsd: number;
  msMean: number;
}

const price = (p: ProgramId) => (PROGRAMS as Record<string, { priceUsd?: number }>)[p]?.priceUsd;

export function weekMetrics(rows: WeekRow[]): WeekMetrics {
  const n = rows.length;
  const discardedRows = rows.filter((r) => r.legacy !== 'entrevista');
  const offerRows = discardedRows.filter((r) => r.action === 'agenda_ya' || r.action === 'otro_programa');
  const count = (f: (r: WeekRow) => boolean, xs = rows) => xs.filter(f).length;
  const byAction = { agenda_ya: 0, otro_programa: 0, empresas: 0, cola_humana: 0, nurturing: 0 } as Record<WeekRow['action'], number>;
  for (const r of rows) byAction[r.action]++;

  const byProgramMap = new Map<ProgramId, number>();
  for (const r of offerRows) byProgramMap.set(r.program, (byProgramMap.get(r.program) ?? 0) + 1);
  const byProgram = [...byProgramMap].map(([program, leads]) => ({ program, name: programName(program), leads, priceUsd: price(program), pipelineWeek: leads * (price(program) ?? 0) }))
    .sort((a, b) => b.pipelineWeek - a.pipelineWeek || b.leads - a.leads);
  const listPipelineWeek = byProgram.reduce((a, p) => a + p.pipelineWeek, 0);

  const ruleRows = rows.filter((r) => r.legacy === 'entrevista');
  const jevRows = rows.filter((r) => r.action === 'agenda_ya' || r.action === 'otro_programa');
  const sumPrice = (xs: WeekRow[], p: (r: WeekRow) => ProgramId) => xs.reduce((a, r) => a + (price(p(r)) ?? 0), 0);

  const b2b = count((r) => r.action === 'empresas', discardedRows);
  return {
    n,
    discarded: discardedRows.length,
    b2b,
    offers: offerRows.length,
    rescued: b2b + offerRows.length,
    abandonRescue: count((r) => r.legacy === 'abandono' && r.action !== 'nurturing'),
    abandonVoice: count((r) => r.legacy === 'abandono' && r.channel === 'llamada_ia'),
    doubtfulInterviews: count((r) => r.legacy === 'entrevista' && r.action === 'cola_humana'),
    toPerson: byAction.cola_humana,
    nurturing: byAction.nurturing,
    byAction,
    autoNextStep: n ? count((r) => !r.needsHuman) / n : 0,
    listPipelineWeek,
    offersWithoutPrice: byProgram.filter((p) => !p.priceUsd).reduce((a, p) => a + p.leads, 0),
    // La regla actual solo vende la Inmersión a quien entrevista.
    pipelinePerLead: { rule: n ? sumPrice(ruleRows, () => 'inmersion') / n : 0, jev: n ? sumPrice(jevRows, (r) => r.program) / n : 0 },
    monthly: Object.fromEntries((Object.keys(SCENARIOS) as Scenario[]).map((k) => [k, listPipelineWeek * SCENARIOS[k] * WEEKS_PER_MONTH])) as Record<Scenario, number>,
    byProgram,
    costUsd: rows.reduce((a, r) => a + r.costUsd, 0),
    msMean: n ? Math.round(rows.reduce((a, r) => a + r.ms, 0) / n) : 0,
  };
}
