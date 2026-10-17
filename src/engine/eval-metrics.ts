// Métricas del eval compartidas por scripts/eval.ts (todos los sets, y la puerta de CI) y scripts/baseline-llm.ts.
import { programCategory } from './programs.ts';
import type { Action, CategoryAnswer, Expected, ProgramId } from './types.ts';

/**
 * Error caro (definición acordada el sáb 17 oct, ver docs/resultados-eval.md): agenda_ya cuando lo esperado era
 * cola_humana o nurturing, o agenda_ya con un programa de otra categoría que el esperado. Agendar el programa
 * correcto (o uno de su misma categoría) cuando se esperaba ofrecerlo por WhatsApp es un error de canal, no caro.
 */
export function isExpensiveError(expected: Expected, decision: { action: Action; program: ProgramId }): boolean {
  if (decision.action !== 'agenda_ya' || expected.action === 'agenda_ya') return false;
  if (expected.action === 'cola_humana' || expected.action === 'nurturing') return true;
  const expectedCat = programCategory(expected.program);
  return expectedCat !== undefined && programCategory(decision.program) !== expectedCat;
}

/** Categoría esperada a partir del programa esperado; null si el caso no es evaluable ('otro'). */
export function expectedCategory(program: ProgramId): CategoryAnswer | null {
  if (program === 'otro') return null;
  if (program === 'ninguno') return 'ninguna';
  return programCategory(program) ?? null;
}
