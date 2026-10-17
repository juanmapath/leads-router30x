// Cifra de negocio: cuánto vale al mes lo que la regla actual descarta y Jev enruta a un programa.
// Todos los números de negocio salen de docs/supuestos.md (sin datos internos de 30X) y se muestran como supuestos.
import { PROGRAMS } from './programs.ts';
import type { Action, ProgramId } from './types.ts';

export const WEEKS_PER_MONTH = 4.33;

/** Ticket realizado = 85 % del precio público (descuentos, reservas y planes de pago). */
export const REALIZED_SHARE = 0.85;
/** Plan corporativo: 5 cupos × USD 1.500. */
export const CORPORATE_TICKET_USD = 7_500;
/** Ventas mensuales estimadas de 30X (1.000 alumnos × USD 1.800 / 12). Solo para la prueba de cordura. */
export const MONTHLY_SALES_30X_USD = 150_000;
/** Prueba de cordura: ingreso incremental mensual como fracción máxima de las ventas mensuales estimadas. */
export const SANITY_MAX = { pesimista: 0.1, viable: 0.25 } as const;

/** Precio público del programa, si existe. */
export function listPrice(p: ProgramId): number | undefined {
  return (PROGRAMS as Record<string, { priceUsd?: number }>)[p]?.priceUsd;
}

/** Ticket realizado por programa; sin precio público (y sin supuesto en docs/supuestos.md) no suma dólares. */
export function realizedTicket(p: ProgramId): number | undefined {
  if (p === 'corporativos') return CORPORATE_TICKET_USD;
  const price = listPrice(p);
  return price ? price * REALIZED_SHARE : undefined;
}

/** Tasa de cierre por acción sobre lo que Jev rescata (de docs/supuestos.md). Pesimista por defecto. */
export const SCENARIOS = {
  pesimista: { otro_programa: 0.015, empresas: 0.03 },
  viable: { otro_programa: 0.03, empresas: 0.06 },
  optimista: { otro_programa: 0.05, empresas: 0.1 },
} as const;
export type Scenario = keyof typeof SCENARIOS;
type RatedAction = keyof (typeof SCENARIOS)['pesimista'];

export interface RecoveredLead { action: Action; program: ProgramId }

const rated = (a: Action): a is RatedAction => a === 'otro_programa' || a === 'empresas';

/**
 * Ingreso incremental por mes y escenario a partir de los leads de una semana que la regla descartó.
 * Solo cuentan las acciones con tasa en los supuestos (otro programa y empresas) y programas con ticket.
 */
export function monthlyImpact(discarded: RecoveredLead[]): Record<Scenario, number> {
  const out = {} as Record<Scenario, number>;
  for (const k of Object.keys(SCENARIOS) as Scenario[]) {
    out[k] = discarded.reduce((a, r) => (rated(r.action) ? a + (realizedTicket(r.program) ?? 0) * SCENARIOS[k][r.action] : a), 0) * WEEKS_PER_MONTH;
  }
  return out;
}

/** Costo mensual de decidir: leads por semana × (1 + señales nuevas promedio) × costo por decisión. */
export function monthlyRunCost(leadsPerWeek: number, signalsPerLead: number, costPerDecisionUsd: number) {
  return leadsPerWeek * (1 + signalsPerLead) * costPerDecisionUsd * WEEKS_PER_MONTH;
}
