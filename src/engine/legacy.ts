import type { FormAnswers, Lead } from './types.ts';

// Réplica de la lógica pública del formulario de 30X
// (form.30x.com/to/inmersivo-presencial-30x, visto el 16 oct. 2026):
// suma fija de puntos; > 6 agenda entrevista; el resto ve "gracias" y sale del flujo.

const ROLE_POINTS = { founder_ceo: 1, c_level: 1, gerente: 0, coordinador: 0, analista: 0 } as const;
const REVENUE_POINTS = { mas_5m: 2, '1m_5m': 2, '500k_1m': 2, '200k_500k': 2, menos_200k: 0 } as const;
const INVESTMENT_POINTS = { listo: 4, plan_pagos: 2, imposible: 0 } as const;
const DECIDER_POINTS = { solo: 3, compartido: 2, otro: 0 } as const;

export type LegacyRoute = 'entrevista' | 'gracias' | 'abandono';
export type LegacyTag = 'High' | 'Mid' | 'Low';

export interface LegacyResult {
  score: number;
  tag: LegacyTag;
  route: LegacyRoute;
  breakdown: Record<string, number>;
}

export function legacyScore(form: FormAnswers): { score: number; breakdown: Record<string, number> } {
  const breakdown = {
    cargo: form.role ? ROLE_POINTS[form.role] : 0,
    facturacion: form.revenue ? REVENUE_POINTS[form.revenue] : 0,
    inversion: form.investment ? INVESTMENT_POINTS[form.investment] : 0,
    decisor: form.decider ? DECIDER_POINTS[form.decider] : 0,
  };
  const score = Object.values(breakdown).reduce((a, b) => a + b, 0);
  return { score, breakdown };
}

export function legacyTag(score: number): LegacyTag {
  if (score >= 7) return 'High';
  if (score >= 5) return 'Mid';
  return 'Low';
}

export function legacyRoute(lead: Lead): LegacyResult {
  const { score, breakdown } = legacyScore(lead.form);
  const tag = legacyTag(score);
  if (lead.partial) return { score, tag, route: 'abandono', breakdown };
  return { score, tag, route: score > 6 ? 'entrevista' : 'gracias', breakdown };
}
