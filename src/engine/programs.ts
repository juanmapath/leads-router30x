// Catálogo oficial de 30X: los ids, nombres, categorías y descripciones cortas del "Diagnóstico 30X"
// (30x.com/diagnostico-30x), más Raise Your Round (menú de 30x.com). Precios y formato de las landings
// (revisadas el 16 oct. 2026). Ver docs/programas-30x.md.
// Fuente única: las preguntas `category` y `program` de Jev se arman desde aquí (questions.ts).
// Excluido a propósito: 30X Next (13 a 18 años). Un lead que habla de un hijo adolescente va a una persona.
import type { ProgramId } from './types.ts';

export type CategoryId = 'presencial' | 'ia' | 'ventas' | 'growth' | 'startups' | 'empresas';

export const CATEGORIES: Record<CategoryId, { name: string; forJev: string }> = {
  presencial: { name: 'Presencial', forJev: 'Presencial: experiencia de 3 días para founders, CEOs y C-level con empresa en crecimiento y presupuesto.' },
  ia: { name: 'Inteligencia Artificial', forJev: 'Inteligencia Artificial: adoptar, gobernar o construir con IA (ejecutivos, técnicos, operaciones, productividad personal).' },
  ventas: { name: 'Ventas', forJev: 'Ventas: proceso comercial B2B, ventas con IA o vender desde LinkedIn.' },
  growth: { name: 'Growth', forJev: 'Growth: marketing, adquisición, redes sociales y estrategia de crecimiento.' },
  startups: { name: 'Startups', forJev: 'Startups: levantar inversión o liderar producto en una startup.' },
  empresas: { name: 'Empresas', forJev: 'Empresas: formar a un equipo de la misma empresa o escalar la empresa de forma sostenible con acompañamiento largo.' },
};

export interface Program {
  name: string;
  category: CategoryId;
  /** Descripción oficial de 30X (Diagnóstico 30X). */
  official: string;
  priceUsd?: number;
  format: string;
  /** Lo que lee Jev: oficial + para quién + señales de encaje + para quién no (40–60 palabras). */
  forJev: string;
}

export const PROGRAMS: Record<Exclude<ProgramId, 'ninguno' | 'otro'>, Program> = {
  inmersion: {
    name: 'Inmersión Ejecutiva Presencial', category: 'presencial', priceUsd: 6000, format: '3 días presencial (Caracas, Bogotá, Miami, CDMX)',
    official: 'Tres días presenciales de estrategia, networking de alto nivel y sesiones privadas con mentores.',
    forJev: 'Inmersión Ejecutiva Presencial (3 días, USD 6.000): tres días de estrategia, networking de alto nivel y mentores. Para founders, CEOs y C-level de empresas que ya facturan y quieren escalar, con presupuesto y poder de decisión. Encaja si habla de escalar, expandirse, dirigir o delegar. No es para quien no decide ni puede invertir.',
  },
  ai_exec: {
    name: 'AI for Executives', category: 'ia', priceUsd: 2000, format: '8 semanas, sesiones en vivo',
    official: 'Gobierna la IA como líder: criterio y decisiones a nivel ejecutivo.',
    forJev: 'AI for Executives (8 semanas en vivo, USD 2.000): gobierna la IA como líder, con criterio y decisiones a nivel ejecutivo. Para directores y gerentes que deben liderar la adopción de IA en su área o empresa. Encaja si habla de estrategia de IA, transformación o decidir en qué invertir. No es para perfiles técnicos que quieren programar.',
  },
  ai_dev: {
    name: 'AI for Developers', category: 'ia', priceUsd: 1500, format: '12 sesiones de 2 h',
    official: 'Construye agentes de IA con código. La ruta técnica y aplicada.',
    forJev: 'AI for Developers (12 sesiones, USD 1.500): construye agentes de IA con código; la ruta técnica y aplicada. Para desarrolladores, tech leads e ingenieros de datos. Encaja si habla de Python, APIs, LangChain, agentes o automatizar con código. No es para ejecutivos sin perfil técnico ni para quien busca vender más.',
  },
  ops_ai: {
    name: 'Operaciones con AI', category: 'ia', priceUsd: 1800, format: '4 semanas online',
    official: 'El playbook de operaciones con IA de tu compañía, paso a paso.',
    forJev: 'Operaciones con AI (4 semanas online, USD 1.800): el playbook de operaciones con IA de la compañía, paso a paso. Para gerentes y líderes de operaciones, logística, back office o servicio. Encaja si habla de procesos, eficiencia, automatizar tareas repetitivas o bodegas. No es para quien busca vender más ni para desarrolladores.',
  },
  second_brain: {
    name: 'Second Brain', category: 'ia', format: 'Online',
    official: 'El sistema operativo personal para pensar, decidir y construir con IA.',
    forJev: 'Second Brain (online): el sistema operativo personal para pensar, decidir y construir con IA. Para profesionales que quieren ser más productivos y organizar su conocimiento con IA. Encaja si habla de productividad personal, notas, organizarse o aprender a usar IA en su día a día. No es para transformar una empresa ni un equipo.',
  },
  sales_machine: {
    name: 'Sales Machine', category: 'ventas', priceUsd: 1950, format: 'Online',
    official: 'El playbook B2B completo para vender y cerrar más.',
    forJev: 'Sales Machine (online, USD 1.950): el playbook B2B completo para vender y cerrar más. Para founders y líderes de empresas B2B pequeñas que aún no tienen un proceso comercial. Encaja si habla de armar el proceso de ventas desde cero, prospectar o cerrar clientes. No es para equipos que ya venden bien y quieren IA (eso es AI Sales).',
  },
  ai_sales: {
    name: 'AI Sales', category: 'ventas', priceUsd: 1950, format: 'Online, 4 semanas',
    official: 'Automatiza y potencia tu operación de ventas B2B con IA.',
    forJev: 'AI Sales (4 semanas online, USD 1.950): automatiza y potencia la operación de ventas B2B con IA. Para gerentes comerciales, heads of sales y founders con equipo de ventas. Encaja si habla de agentes de voz, calificar leads, seguimiento automático o vender más sin contratar. No es para quien todavía no tiene proceso comercial (eso es Sales Machine).',
  },
  linkedin_sales: {
    name: 'LinkedIn Sales', category: 'ventas', priceUsd: 1950, format: '4 semanas, 12 sesiones',
    official: 'Construye autoridad y pipeline B2B vendiendo desde LinkedIn.',
    forJev: 'LinkedIn Sales (4 semanas, USD 1.950): construye autoridad y pipeline B2B vendiendo desde LinkedIn. Para consultores, founders y vendedores B2B que venden su experiencia. Encaja si habla de LinkedIn, marca personal, contenido para atraer clientes o social selling. No es para marcas de consumo que venden en Instagram o TikTok.',
  },
  growth_rockstar: {
    name: 'Growth Rockstar', category: 'growth', priceUsd: 1295, format: 'Online',
    official: 'Construye tu motor de crecimiento desde los fundamentos.',
    forJev: 'Growth Rockstar (online, USD 1.295): construye el motor de crecimiento desde los fundamentos. Para CMOs, VPs y heads de marketing o growth, y equipos de marketing que deben generar más demanda con el mismo presupuesto. Encaja si habla de leads, pauta, CAC, embudo o retención. No es para quien busca gobernar la IA en toda la empresa.',
  },
  advanced_strategy: {
    name: 'Advanced Strategy', category: 'growth', priceUsd: 2500, format: 'Online',
    official: 'Liderazgo ejecutivo de growth para escalar con visión estratégica.',
    forJev: 'Advanced Strategy (online, USD 2.500): liderazgo ejecutivo de growth para escalar con visión estratégica. Para líderes de growth o marketing con experiencia que dirigen equipos y definen la estrategia. Encaja si habla de estrategia, liderar el equipo de growth o escalar a nuevos mercados. No es para quien aprende los fundamentos (eso es Growth Rockstar).',
  },
  xtreme_growth: {
    name: 'Xtreme Growth', category: 'growth', priceUsd: 1450, format: 'Online',
    official: 'Escalamiento agresivo de tu empresa apalancado en IA.',
    forJev: 'Xtreme Growth (online, USD 1.450): escalamiento agresivo de la empresa apalancado en IA. Para founders de empresas que ya venden y quieren crecer rápido con IA y experimentación. Encaja si habla de crecer 2x o 3x, hackear el crecimiento o escalar con IA. No es para empresas sin producto validado ni para equipos grandes de marketing.',
  },
  ig_tiktok: {
    name: 'Instagram & TikTok', category: 'growth', priceUsd: 2000, format: '2 días por semana',
    official: 'Deja de solo estar en redes: empieza a vender desde ellas.',
    forJev: 'Instagram & TikTok (USD 2.000): deja de solo estar en redes y empieza a vender desde ellas. Para dueños de marcas de consumo, e-commerce, creadores y emprendedores que venden a personas. Encaja si habla de Instagram, TikTok, contenido, seguidores o vender por redes. No es para ventas B2B a empresas (eso es LinkedIn Sales).',
  },
  fundraising: {
    name: 'Fundraising School', category: 'startups', priceUsd: 1200, format: '5 semanas',
    official: 'Cierra tu ronda de inversión en 5 semanas.',
    forJev: 'Fundraising School (5 semanas, USD 1.200): cierra la ronda de inversión en 5 semanas. Para founders de startups pre-seed y seed que van a levantar capital. Encaja si habla de ronda, inversionistas, fondos, valoración, pitch o data room. No es para empresas tradicionales sin intención de levantar inversión.',
  },
  raise_your_round: {
    name: 'Raise Your Round', category: 'startups', format: 'Online',
    official: 'Fundraising avanzado: preparar y ejecutar una ronda real.',
    forJev: 'Raise Your Round (online): fundraising avanzado para preparar y ejecutar una ronda real. Para founders con tracción que ya levantaron antes o salen a una serie A. Encaja si habla de serie A, term sheet, negociación con fondos líderes o una ronda en curso. No es para quien apenas empieza a pensar en inversión (eso es Fundraising School).',
  },
  product_rockstar: {
    name: 'Product Rockstar', category: 'startups', format: 'Online',
    official: 'Lidera roadmaps de producto que mueven el negocio.',
    forJev: 'Product Rockstar (online): lidera roadmaps de producto que mueven el negocio. Para product managers, heads of product y founders que lideran el producto. Encaja si habla de roadmap, priorizar, discovery, métricas de producto o equipos de producto. No es para quien busca vender, levantar capital o programar agentes.',
  },
  corporativos: {
    name: 'Planes Corporativos', category: 'empresas', format: 'A medida',
    official: 'Ecosistema de IA y programa corporativo B2B para tu empresa.',
    forJev: 'Planes Corporativos (a medida): ecosistema de IA y programa corporativo B2B para la empresa. Para gerentes de RRHH, innovación o transformación y directivos que quieren formar a un equipo de varias personas. Encaja si habla de capacitar a su equipo, área o empresa. No es para una sola persona que se inscribe por su cuenta.',
  },
  multipliers: {
    name: 'Multipliers', category: 'empresas', priceUsd: 1000, format: '12 meses de acompañamiento',
    official: 'Los pilares para escalar tu empresa de forma sostenible.',
    forJev: 'Multipliers (12 meses, USD 1.000): los pilares para escalar la empresa de forma sostenible, con acompañamiento largo. Para dueños de pymes y empresas tradicionales que quieren ordenar finanzas, equipo y procesos para crecer. Encaja si habla de ordenar la empresa, crecer sin caos o acompañamiento de un año. No es para startups que buscan inversión.',
  },
};

export const PROGRAM_IDS = Object.keys(PROGRAMS) as Array<keyof typeof PROGRAMS>;
export const CATEGORY_IDS = Object.keys(CATEGORIES) as CategoryId[];

export function programName(id: ProgramId): string {
  if (id === 'ninguno') return 'Ninguno por ahora';
  if (id === 'otro') return 'Otro (decide el vendedor)';
  return PROGRAMS[id].name;
}

/** Categoría de un programa (undefined para 'ninguno' u 'otro'). */
export function programCategory(id: ProgramId): CategoryId | undefined {
  return id === 'ninguno' || id === 'otro' ? undefined : PROGRAMS[id].category;
}

/** Programas de una categoría (para que el vendedor elija cuando Jev ve la categoría pero no el programa). */
export function programsIn(category: CategoryId) {
  return PROGRAM_IDS.filter((id) => PROGRAMS[id].category === category);
}
