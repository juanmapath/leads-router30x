// Señales del simulador del demo. Textos fijos y orden canónico: la misma combinación produce siempre
// el mismo estado (y la misma grabación), sin importar en qué orden se hagan clic.
import type { Lead, Signal } from './types.ts';

export const SIM_SIGNALS = {
  luma: { label: 'Fue a una clase de Luma', signal: { type: 'luma_event', at: '2026-10-17T19:00:00-05:00', text: 'Live Mentoring: De crecer a escalar. Asistió a la clase en vivo.' } },
  whatsapp: { label: 'Respondió el WhatsApp', signal: { type: 'whatsapp_reply', at: '2026-10-17T19:30:00-05:00', text: 'Sí, me interesa. ¿Cuándo podemos hablar?' } },
  abandono: { label: 'Abandonó el formulario', signal: { type: 'form_abandoned', at: '2026-10-17T20:00:00-05:00' } },
} satisfies Record<string, { label: string; signal: Signal }>;

export type SimKey = keyof typeof SIM_SIGNALS;
export const SIM_KEYS = Object.keys(SIM_SIGNALS) as SimKey[];

/** Señales de la combinación, en orden canónico. Ignora claves desconocidas. */
export function simSignals(keys: unknown): Signal[] {
  const set = new Set(Array.isArray(keys) ? keys : []);
  return SIM_KEYS.filter((k) => set.has(k)).map((k) => SIM_SIGNALS[k].signal);
}

/** Todas las combinaciones no vacías de señales (para pregrabarlas). */
export function simCombos(): SimKey[][] {
  const out: SimKey[][] = [];
  for (let mask = 1; mask < 1 << SIM_KEYS.length; mask++) out.push(SIM_KEYS.filter((_, i) => mask & (1 << i)));
  return out;
}

/** Arquetipos que el demo muestra con el simulador (el primero de cada uno en data/leads.json). */
export const FEATURED_ARCHETYPES = ['gerente_equipo_multinacional', 'solo_luma', 'abandono_caliente', 'gerente_comercial', 'ceo_listo'];

export function featuredLeads(leads: Lead[]): Lead[] {
  return FEATURED_ARCHETYPES.map((a) => leads.find((l) => l.archetype === a)).filter((l): l is Lead => !!l);
}
