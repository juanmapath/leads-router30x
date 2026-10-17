import type { ProgramId } from './types.ts';

// Catálogo real de 30X (30x.com/programas, oct. 2026). Precios solo donde son públicos.
export const PROGRAMS: Record<Exclude<ProgramId, 'ninguno' | 'otro'>, { name: string; priceUsd?: number; format: string; forWho: string }> = {
  inmersivo: { name: 'Inmersivo presencial 30X', priceUsd: 6000, format: '3 días presencial', forWho: 'Founders, CEOs y C-level con empresa en crecimiento y presupuesto' },
  ai_executives: { name: 'AI for Executives', format: 'Online', forWho: 'Ejecutivos que deben gobernar la adopción de IA en su empresa' },
  ai_developers: { name: 'AI for Developers', priceUsd: 2000, format: 'Online, 8 sesiones', forWho: 'Personas técnicas o líderes que quieren construir agentes con código' },
  ai_sales: { name: 'AI Sales', format: 'Online, 4 semanas', forWho: 'Founders y vendedores que quieren vender más con IA sin contratar más' },
  sales_machine: { name: 'Sales Machine', priceUsd: 1990, format: 'Online', forWho: 'Founders B2B que necesitan un proceso comercial completo' },
  growth_rockstar: { name: 'Growth Rockstar', format: 'Online', forWho: 'Equipos de marketing y growth' },
  fundraising: { name: 'Fundraising School', format: 'Online, 5 semanas', forWho: 'Founders pre-seed y seed preparando una ronda' },
  corporativo: { name: 'Planes corporativos', format: 'A medida', forWho: 'Empresas que quieren formar a un equipo' },
};

export const PROGRAM_IDS = Object.keys(PROGRAMS) as Array<keyof typeof PROGRAMS>;

export function programName(id: ProgramId): string {
  if (id === 'ninguno') return 'Ninguno por ahora';
  if (id === 'otro') return 'Otro (decide el vendedor)';
  return PROGRAMS[id].name;
}
