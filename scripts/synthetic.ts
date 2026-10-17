// Arquetipos y generador de leads sintéticos. Determinístico: misma semilla, mismos datos.
// Ningún dato es de una persona real. Lo usan generate-leads.ts (demo + ajuste) y generate-test-set.ts (prueba).

import type { Expected, Lead } from '../src/engine/types.ts';

let seed = 30_2026;
/** Reinicia el generador pseudoaleatorio (otra semilla = otros leads con los mismos arquetipos). */
export const reseed = (s: number) => { seed = s; };
export const rand = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
export const pick = <T>(xs: T[]): T => xs[Math.floor(rand() * xs.length)];
export function weighted<T>(items: Array<[T, number]>): T {
  const total = items.reduce((a, [, w]) => a + w, 0);
  let r = rand() * total;
  for (const [it, w] of items) if ((r -= w) <= 0) return it;
  return items[items.length - 1][0];
}

export const FIRST = ['Mariana', 'Andrés', 'Camila', 'Santiago', 'Valentina', 'Mateo', 'Daniela', 'Sebastián', 'Laura', 'Felipe', 'Isabella', 'Diego', 'Paula', 'Tomás', 'Natalia', 'Javier', 'Lucía', 'Ricardo', 'Sofía', 'Alejandro', 'Gabriela', 'Martín', 'Carolina', 'Esteban'];
export const LAST = ['G.', 'R.', 'M.', 'P.', 'L.', 'V.', 'S.', 'C.', 'T.', 'H.'];
export const COUNTRY: Array<[string, number]> = [['Colombia', 35], ['México', 25], ['Venezuela', 12], ['Chile', 10], ['Perú', 10], ['Argentina', 8]];
export const EDITION: Record<string, string> = {
  Colombia: 'Bogotá · 26-28 Oct · 2026', México: 'CDMX · 24-26 Nov · 2026', Venezuela: 'Caracas · 21-23 Oct · 2026',
  Chile: 'Miami · 19-21 Nov · 2026', Perú: 'CDMX · 24-26 Nov · 2026', Argentina: 'Miami · 19-21 Nov · 2026',
};
export const CHANNEL: Array<[Lead['channel'], number]> = [['linkedin', 35], ['instagram', 25], ['meta_ads', 12], ['youtube', 10], ['luma', 10], ['google_ads', 8]];
export const COMPANY_SUFFIX = ['Logística', 'Foods', 'Fintech', 'Salud', 'Retail', 'Tech', 'Seguros', 'Energía', 'Agro', 'Educación'];
export const COMPANY_PREFIX = ['Andina', 'Nova', 'Cumbre', 'Pacífico', 'Altavista', 'Brío', 'Ceiba', 'Delta', 'Faro', 'Lumen'];
const LUMA = ['Live Mentoring: De crecer a escalar', 'Clase gratis: IA para tu equipo comercial', 'Clase gratis: cómo levantar tu primera ronda', 'Masterclass: agentes de IA para tu operación'];

interface Archetype {
  id: string;
  weight: number;
  build: () => { form: Partial<Lead['form']>; partial?: boolean; noForm?: boolean; content: string; luma?: [string, string]; expected: Expected };
}

// reason = "¿Cuál es la razón o desafío por la que aplicaste?" (texto libre que el formulario de AI Sales ya pide).
const ARCHETYPES: Archetype[] = [
  { id: 'ceo_listo', weight: 15, build: () => ({
    form: { role: 'founder_ceo', roleText: pick(['CEO y cofundador', 'Fundadora', 'CEO']), revenue: pick(['1m_5m', 'mas_5m'] as const), investment: 'listo', decider: 'solo', seats: 'solo',
      reason: pick(['Queremos expandirnos a otro país el próximo año y necesito ordenar el equipo directivo.', 'Crecimos rápido y ya no puedo estar en todo; quiero aprender a delegar y escalar.', 'Busco red con otros CEOs y una estrategia para duplicar la empresa.']) },
    content: 'Inmersivo 30X: escala tu empresa con los fundadores de Rappi',
    expected: { action: 'agenda_ya', program: 'inmersion', team: false } }) },
  { id: 'founder_plan_pagos', weight: 10, build: () => ({
    form: { role: 'founder_ceo', roleText: 'Fundador', revenue: '200k_500k', investment: 'plan_pagos', decider: 'solo', seats: 'solo',
      reason: pick(['Sigo metido en la operación diaria y quiero empezar a dirigir.', 'Quiero estructurar la empresa para pasar de 300 mil a un millón de dólares.']) },
    content: 'Qué cambia cuando dejas de ejecutar y empiezas a dirigir',
    expected: { action: 'agenda_ya', program: 'inmersion', team: false } }) },
  { id: 'gerente_equipo_multinacional', weight: 12, build: () => ({
    form: { role: 'gerente', roleText: pick(['Gerente de Innovación', 'Gerente de Transformación Digital', 'Head of People']), revenue: 'mas_5m', investment: 'imposible', decider: 'otro', seats: '5_mas',
      reason: pick(['Nos pidieron capacitar al equipo en IA este año.', 'Busco un programa de IA para 30 personas de mi área.']) },
    content: 'Cómo implementar IA en una empresa de 500 personas',
    luma: ['Masterclass: agentes de IA para tu operación', '¿Cómo capacito a 30 personas de mi área en IA sin frenar la operación?'],
    expected: { action: 'empresas', program: 'corporativos', team: true } }) },
  { id: 'gerente_comercial', weight: 12, build: () => ({
    form: { role: 'gerente', roleText: pick(['Gerente Comercial', 'Gerente de Ventas', 'Head of Sales']), revenue: pick(['1m_5m', '500k_1m'] as const), investment: 'plan_pagos', decider: 'compartido', seats: 'solo',
      reason: pick(['Mi equipo de ventas no da abasto con los leads y quiero automatizar el seguimiento.', 'Queremos usar IA para calificar y contactar leads más rápido.']) },
    content: 'Experto en VENTAS con IA revela su sistema completo',
    luma: ['Clase gratis: IA para tu equipo comercial', '¿Cómo uso agentes de voz para contactar leads en 5 minutos?'],
    expected: { action: 'otro_programa', program: 'ai_sales', team: false } }) },
  { id: 'founder_pequeno_ventas', weight: 12, build: () => ({
    form: { role: 'founder_ceo', roleText: 'Fundadora de agencia B2B', revenue: 'menos_200k', investment: 'imposible', decider: 'solo', seats: 'solo',
      reason: pick(['No tengo un proceso de ventas: todo depende de mí y de referidos.', 'Quiero conseguir clientes B2B de forma predecible.']) },
    content: 'Cómo armar un proceso de ventas B2B desde cero',
    expected: { action: 'otro_programa', program: 'sales_machine', team: false } }) },
  { id: 'perfil_tecnico', weight: 8, build: () => ({
    form: { role: pick(['analista', 'coordinador'] as const), roleText: pick(['Tech Lead', 'Desarrollador senior', 'Ingeniero de datos']), revenue: '500k_1m', investment: 'imposible', decider: 'otro', seats: 'solo',
      reason: pick(['Quiero construir agentes con Python para mi empresa.', 'Quiero pasar de usar ChatGPT a programar agentes.']) },
    content: 'De developer a builder: agentes con código',
    expected: { action: 'otro_programa', program: 'ai_dev', team: false } }) },
  { id: 'abandono_caliente', weight: 8, build: () => ({
    form: {}, partial: true,
    content: 'Inmersivo 30X: escala tu empresa con los fundadores de Rappi',
    luma: ['Live Mentoring: De crecer a escalar', 'Ya facturamos 2M al año, ¿qué tengo que tener listo para expandirme a México?'],
    expected: { action: 'cola_humana', program: 'inmersion', team: false } }) },
  { id: 'estudiante', weight: 8, build: () => ({
    form: { role: 'analista', roleText: pick(['Estudiante de administración', 'Practicante', 'Recién graduado']), revenue: 'menos_200k', investment: 'imposible', decider: 'otro', seats: 'solo',
      reason: pick(['Quiero aprender de IA para mi carrera.', 'Me gustaría emprender algún día.']) },
    content: 'Qué es la IA y cómo va a cambiar tu carrera',
    expected: { action: 'nurturing', program: 'ninguno', team: false } }) },
  { id: 'founder_ronda', weight: 7, build: () => ({
    form: { role: 'founder_ceo', roleText: 'Cofundador de startup', revenue: '200k_500k', investment: 'imposible', decider: 'solo', seats: 'solo',
      reason: pick(['Vamos a levantar una pre-seed en los próximos meses.', 'Necesito preparar el pitch para inversionistas.']) },
    content: 'Cómo levantar tu ronda pre-seed en Latinoamérica',
    luma: ['Clase gratis: cómo levantar tu primera ronda', 'Estamos por salir a levantar 500k, ¿cómo armo el data room?'],
    expected: { action: 'otro_programa', program: 'fundraising', team: false } }) },
  { id: 'cmo_growth', weight: 8, build: () => ({
    form: { role: 'c_level', roleText: pick(['CMO', 'VP de Marketing', 'Head of Growth']), revenue: '500k_1m', investment: 'imposible', decider: 'compartido', seats: 'solo',
      reason: pick(['Necesitamos más leads sin subir el presupuesto de pauta.', 'Nuestro CAC subió mucho y quiero bajarlo.']) },
    content: 'Growth con IA: cómo duplicar leads con el mismo presupuesto',
    expected: { action: 'otro_programa', program: 'growth_rockstar', team: false } }) },
  // Arquetipos de programas del catálogo completo (sáb 17 oct).
  { id: 'gerente_operaciones', weight: 5, build: () => ({
    form: { role: 'gerente', roleText: pick(['Gerente de Operaciones', 'Jefe de Logística', 'Gerente de Back Office']), revenue: '1m_5m', investment: 'plan_pagos', decider: 'compartido', seats: 'solo',
      reason: pick(['Queremos automatizar procesos repetitivos de bodega y facturación.', 'La operación crece y los procesos manuales ya no dan.']) },
    content: 'Agentes de IA para tu operación: menos tareas manuales',
    expected: { action: 'otro_programa', program: 'ops_ai', team: false } }) },
  { id: 'consultor_linkedin', weight: 5, build: () => ({
    form: { role: 'founder_ceo', roleText: pick(['Consultor independiente B2B', 'Fundadora de consultora de RRHH']), revenue: 'menos_200k', investment: 'plan_pagos', decider: 'solo', seats: 'solo',
      reason: pick(['Vendo consultoría a empresas y quiero conseguir clientes con mi contenido en LinkedIn.', 'Publico en LinkedIn pero no me llegan clientes.']) },
    content: 'Cómo conseguir clientes B2B desde LinkedIn',
    expected: { action: 'otro_programa', program: 'linkedin_sales', team: false } }) },
  { id: 'marca_redes', weight: 5, build: () => ({
    form: { role: 'founder_ceo', roleText: pick(['Dueña de marca de ropa', 'Fundador de e-commerce de cosmética']), revenue: '200k_500k', investment: 'imposible', decider: 'solo', seats: 'solo',
      reason: pick(['Tenemos 20 mil seguidores pero casi no vendemos por redes.', 'Quiero vender por TikTok e Instagram sin depender de la pauta.']) },
    content: 'Cómo vender por Instagram y TikTok sin pauta',
    expected: { action: 'otro_programa', program: 'ig_tiktok', team: false } }) },
  { id: 'product_manager', weight: 5, build: () => ({
    form: { role: 'gerente', roleText: pick(['Product Manager', 'Head of Product']), revenue: '1m_5m', investment: 'imposible', decider: 'otro', seats: 'solo',
      reason: pick(['Me cuesta priorizar el roadmap con tantas solicitudes de ventas.', 'Quiero que el equipo de producto mida impacto en el negocio, no solo entregas.']) },
    content: 'Roadmaps de producto que mueven el negocio',
    expected: { action: 'otro_programa', program: 'product_rockstar', team: false } }) },
  { id: 'director_growth', weight: 5, build: () => ({
    form: { role: 'c_level', roleText: pick(['Director de Growth', 'VP de Growth']), revenue: 'mas_5m', investment: 'plan_pagos', decider: 'compartido', seats: 'solo',
      reason: pick(['Dirijo un equipo de 12 personas de growth y necesito una estrategia para entrar a tres países.', 'Lidero growth y quiero pasar de ejecutar campañas a definir la estrategia de la empresa.']) },
    content: 'Liderar growth en una empresa que escala',
    expected: { action: 'otro_programa', program: 'advanced_strategy', team: false } }) },
  // Solo Luma: se inscribió a una clase gratis (nombre, correo y pregunta opcional) y nunca llenó el formulario.
  // Con una sola pregunta escrita no se actúa solo: si apunta a un programa lo confirma una persona; si es vaga, nurturing.
  { id: 'solo_luma', weight: 8, build: () => {
    const [event, question, expected] = pick<[string, string, Expected]>([
      ['Clase gratis: cómo levantar tu primera ronda', 'Estamos por levantar nuestra pre-seed, ¿qué métricas piden los fondos?', { action: 'cola_humana', program: 'fundraising', team: false }],
      ['Clase gratis: IA para tu equipo comercial', 'Tengo una agencia y quiero que la IA me ayude a hacer seguimiento a los prospectos, ¿por dónde empiezo?', { action: 'cola_humana', program: 'ai_sales', team: false }],
      ['Live Mentoring: De crecer a escalar', '¿Cuándo es la próxima clase gratis?', { action: 'nurturing', program: 'ninguno', team: false }],
      ['Masterclass: agentes de IA para tu operación', 'Me encantó, ¿dónde veo la grabación?', { action: 'nurturing', program: 'ninguno', team: false }],
    ]);
    return { form: {}, noForm: true, content: event, luma: [event, question], expected };
  } },
];

// Arquetipos solo de la semana del demo (data/week-leads.json): baja intención y "solo Luma" separado en vago y
// con programa. No entran en ARCHETYPES para no cambiar data/leads.json ni los sets de prueba.
const LOW = 'Qué es la IA y cómo va a cambiar tu carrera';
export const WEEK_ARCHETYPES: Archetype[] = [
  { id: 'curioso_clase_gratis', weight: 0, build: () => {
    const event = pick(LUMA);
    return {
      form: { role: pick(['coordinador', 'analista'] as const), roleText: pick(['Asistente administrativa', 'Coordinador de eventos', 'Analista de compras']), revenue: pick(['menos_200k', '200k_500k'] as const), investment: 'imposible', decider: 'otro', seats: 'solo',
        reason: pick(['Vi la clase gratis y quiero seguir aprendiendo.', 'Me gustan sus videos, quería ver de qué se trata.', 'Curiosidad, vi el anuncio.']) },
      content: event,
      luma: [event, pick(['¿Van a hacer más clases gratis?', '¿Me pueden compartir las diapositivas?'])],
      expected: { action: 'nurturing', program: 'ninguno', team: false },
    };
  } },
  { id: 'junior_sin_presupuesto', weight: 0, build: () => ({
    form: { role: pick(['analista', 'coordinador'] as const), roleText: pick(['Analista junior de marketing', 'Asistente comercial', 'Diseñadora freelance', 'Community manager']), revenue: 'menos_200k', investment: 'imposible', decider: 'otro', seats: 'solo',
      reason: pick(['Quiero aprender a usar IA en mi trabajo.', 'Busco mejorar mi perfil para conseguir un mejor empleo.', 'Me interesa la IA pero ahora no tengo presupuesto.']) },
    content: pick([LOW, 'Experto en VENTAS con IA revela su sistema completo']),
    expected: { action: 'nurturing', program: 'ninguno', team: false } }) },
  { id: 'solo_luma_vago', weight: 0, build: () => {
    const event = pick(LUMA);
    const question = pick(['¿Cuándo es la próxima clase gratis?', 'Me encantó, ¿dónde veo la grabación?', '¿La clase queda grabada?', 'Gracias, muy buena clase.', '¿Me pueden enviar las diapositivas?']);
    return { form: {}, noForm: true, content: event, luma: [event, question], expected: { action: 'nurturing', program: 'ninguno', team: false } };
  } },
  { id: 'solo_luma_programa', weight: 0, build: () => {
    const [event, question, expected] = pick<[string, string, Expected]>([
      ['Clase gratis: cómo levantar tu primera ronda', 'Estamos por levantar nuestra pre-seed, ¿qué métricas piden los fondos?', { action: 'cola_humana', program: 'fundraising', team: false }],
      ['Clase gratis: IA para tu equipo comercial', 'Tengo una agencia y quiero que la IA me ayude a hacer seguimiento a los prospectos, ¿por dónde empiezo?', { action: 'cola_humana', program: 'ai_sales', team: false }],
      ['Masterclass: agentes de IA para tu operación', 'Tenemos 40 personas en bodega con procesos manuales, ¿qué se puede automatizar primero?', { action: 'cola_humana', program: 'ops_ai', team: false }],
    ]);
    return { form: {}, noForm: true, content: event, luma: [event, question], expected };
  } },
];

/** Arma un lead con el arquetipo dado (consume el generador en el mismo orden de siempre). */
function makeLead(a: Archetype, i: number, prefix: string): { lead: Lead; expected: Expected } {
  const b = a.build();
  const country = weighted(COUNTRY);
  const channel = b.noForm ? 'luma' : b.luma && rand() < 0.4 ? 'luma' : weighted(CHANNEL);
  const name = `${pick(FIRST)} ${pick(LAST)}`;
  const id = `${prefix}${String(i + 1).padStart(3, '0')}`;
  const company = `${pick(COMPANY_PREFIX)} ${pick(COMPANY_SUFFIX)}`;
  const lead: Lead = {
    id,
    country,
    channel,
    utm: { source: channel, medium: channel.endsWith('ads') ? 'paid' : 'organic', campaign: 'inmersivo_30x', content: `pieza_${Math.floor(rand() * 40) + 1}` },
    sourceContent: b.content,
    form: {
      name,
      email: `${name.split(' ')[0].toLowerCase()}.${id.toLowerCase()}@ejemplo.test`,
      whatsappCountry: country,
      ...(b.partial || b.noForm ? {} : { company, edition: EDITION[country] }),
      ...b.form,
    } as Lead['form'],
    partial: Boolean(b.partial),
    signals: b.luma ? [{ type: 'luma_event', at: '2026-10-14T19:00:00-05:00', text: `${b.luma[0]}. Pregunta que dejó: ${b.luma[1]}` }] : [],
    archetype: a.id,
  };
  return { lead, expected: b.expected };
}

/** Genera n leads con la semilla dada. Devuelve los leads y lo esperado por id. */
export function generate(s: number, n: number, prefix = 'L'): { leads: Lead[]; expected: Record<string, Expected> } {
  reseed(s);
  const leads: Lead[] = [];
  const expected: Record<string, Expected> = {};
  for (let i = 0; i < n; i++) {
    const a = weighted(ARCHETYPES.map((x) => [x, x.weight] as [Archetype, number]));
    const { lead, expected: e } = makeLead(a, i, prefix);
    leads.push(lead);
    expected[lead.id] = e;
  }
  return { leads, expected };
}

/**
 * Genera una semana con una mezcla exacta: `counts` = cuántos leads de cada arquetipo (de ARCHETYPES o WEEK_ARCHETYPES),
 * en orden aleatorio. `taken(lead)` = true si el lead repite uno ya visto (p. ej. de un set de prueba): se vuelve a sortear.
 */
export function generateMix(s: number, counts: Record<string, number>, prefix: string, taken: (l: Lead) => boolean = () => false) {
  reseed(s);
  const byId = new Map([...ARCHETYPES, ...WEEK_ARCHETYPES].map((a) => [a.id, a]));
  const order: Archetype[] = [];
  for (const [id, k] of Object.entries(counts)) {
    const a = byId.get(id);
    if (!a) throw new Error(`Arquetipo desconocido en la mezcla: ${id}`);
    for (let j = 0; j < k; j++) order.push(a);
  }
  for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  const leads: Lead[] = [];
  const expected: Record<string, Expected> = {};
  let rerolls = 0;
  for (const [i, a] of order.entries()) {
    let r = makeLead(a, i, prefix);
    for (let t = 0; taken(r.lead); t++) {
      if (t >= 50) throw new Error(`No se pudo generar un ${a.id} que no repita un lead ya visto`);
      r = makeLead(a, i, prefix);
      rerolls++;
    }
    leads.push(r.lead);
    expected[r.lead.id] = r.expected;
  }
  return { leads, expected, rerolls };
}
