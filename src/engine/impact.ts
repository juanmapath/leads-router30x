// Cifra de negocio: cuánto vale al mes lo que la regla actual descarta y Jev enruta a un programa.
// TODO lo que no sale de los datos es un SUPUESTO y se muestra como tal (se refina con 30X: tasa de cierre real).
import { PROGRAMS } from './programs.ts';
import type { Action, ProgramId } from './types.ts';

export const WEEKS_PER_MONTH = 4.33;

/** Ticket por programa: precio público cuando existe; si no, supuesto marcado. */
export const TICKETS: Record<string, { usd: number; supuesto: boolean }> = Object.fromEntries(
  (Object.keys(PROGRAMS) as Array<keyof typeof PROGRAMS>).map((id) => {
    const price = PROGRAMS[id].priceUsd;
    if (price) return [id, { usd: price, supuesto: false }];
    if (id === 'corporativos') return [id, { usd: 12_000, supuesto: true }]; // p. ej. 6 cupos × USD 2.000
    return [id, { usd: 1_000, supuesto: true }]; // programas online sin precio público
  }),
);

/** Tasa de cierre sobre leads recuperados (supuesto: no tenemos el dato de 30X). */
export const SCENARIOS = { pesimista: 0.02, viable: 0.05, optimista: 0.1 } as const;
export type Scenario = keyof typeof SCENARIOS;

export interface RecoveredLead { action: Action; program: ProgramId }

/** Leads que la regla descartó y Jev envió a un programa (agenda, otro programa o empresas). */
export function isRecoveredWithProgram(r: RecoveredLead) {
  return (r.action === 'agenda_ya' || r.action === 'otro_programa' || r.action === 'empresas') && !!TICKETS[r.program];
}

/** USD por mes por escenario, a partir de una semana de leads recuperados con programa. */
export function monthlyImpact(recovered: RecoveredLead[]): Record<Scenario, number> {
  const weeklyPipeline = recovered.filter(isRecoveredWithProgram).reduce((a, r) => a + TICKETS[r.program].usd, 0);
  const out = {} as Record<Scenario, number>;
  for (const [k, rate] of Object.entries(SCENARIOS) as Array<[Scenario, number]>) out[k] = weeklyPipeline * rate * WEEKS_PER_MONTH;
  return out;
}

/** Costo mensual de decidir: leads por semana × (1 + señales nuevas promedio) × costo por decisión. */
export function monthlyRunCost(leadsPerWeek: number, signalsPerLead: number, costPerDecisionUsd: number) {
  return leadsPerWeek * (1 + signalsPerLead) * costPerDecisionUsd * WEEKS_PER_MONTH;
}
