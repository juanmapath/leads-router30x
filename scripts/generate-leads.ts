// Genera 300 leads sintéticos (una semana típica de 30X) y un set de evaluación de 100.
// Determinístico: misma semilla, mismos datos. Ningún dato es de una persona real.
// Uso: npm run gen

import { writeFileSync, mkdirSync } from 'node:fs';
import type { Expected, Lead } from '../src/engine/types.ts';

let seed = 30_2026;
const rand = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const pick = <T>(xs: T[]): T => xs[Math.floor(rand() * xs.length)];
function weighted<T>(items: Array<[T, number]>): T {
  const total = items.reduce((a, [, w]) => a + w, 0);
  let r = rand() * total;
  for (const [it, w] of items) if ((r -= w) <= 0) return it;
  return items[items.length - 1][0];
}

const FIRST = ['Mariana', 'Andrés', 'Camila', 'Santiago', 'Valentina', 'Mateo', 'Daniela', 'Sebastián', 'Laura', 'Felipe', 'Isabella', 'Diego', 'Paula', 'Tomás', 'Natalia', 'Javier', 'Lucía', 'Ricardo', 'Sofía', 'Alejandro', 'Gabriela', 'Martín', 'Carolina', 'Esteban'];
const LAST = ['G.', 'R.', 'M.', 'P.', 'L.', 'V.', 'S.', 'C.', 'T.', 'H.'];
const COUNTRY: Array<[string, number]> = [['Colombia', 35], ['México', 25], ['Venezuela', 12], ['Chile', 10], ['Perú', 10], ['Argentina', 8]];
const EDITION: Record<string, string> = {
  Colombia: 'Bogotá · 26-28 Oct · 2026', México: 'CDMX · 24-26 Nov · 2026', Venezuela: 'Caracas · 21-23 Oct · 2026',
  Chile: 'Miami · 19-21 Nov · 2026', Perú: 'CDMX · 24-26 Nov · 2026', Argentina: 'Miami · 19-21 Nov · 2026',
};
const CHANNEL: Array<[Lead['channel'], number]> = [['linkedin', 35], ['instagram', 25], ['meta_ads', 12], ['youtube', 10], ['luma', 10], ['google_ads', 8]];
const COMPANY_SUFFIX = ['Logística', 'Foods', 'Fintech', 'Salud', 'Retail', 'Tech', 'Seguros', 'Energía', 'Agro', 'Educación'];
const COMPANY_PREFIX = ['Andina', 'Nova', 'Cumbre', 'Pacífico', 'Altavista', 'Brío', 'Ceiba', 'Delta', 'Faro', 'Lumen'];
const LUMA = ['Live Mentoring: De crecer a escalar', 'Clase gratis: IA para tu equipo comercial', 'Clase gratis: cómo levantar tu primera ronda', 'Masterclass: agentes de IA para tu operación'];

interface Archetype {
  id: string;
  weight: number;
  build: () => { form: Partial<Lead['form']>; partial?: boolean; content: string; luma?: [string, string]; expected: Expected };
}

const ARCHETYPES: Archetype[] = [
  { id: 'ceo_listo', weight: 15, build: () => ({
    form: { role: 'founder_ceo', roleText: pick(['CEO y cofundador', 'Fundadora', 'CEO']), revenue: pick(['1m_5m', 'mas_5m'] as const), investment: 'listo', decider: 'solo', seats: 'solo' },
    content: 'Inmersivo 30X: escala tu empresa con los fundadores de Rappi',
    expected: { action: 'agenda_ya', program: 'inmersivo', team: false } }) },
  { id: 'founder_plan_pagos', weight: 10, build: () => ({
    form: { role: 'founder_ceo', roleText: 'Fundador', revenue: '200k_500k', investment: 'plan_pagos', decider: 'solo', seats: 'solo' },
    content: 'Qué cambia cuando dejas de ejecutar y empiezas a dirigir',
    expected: { action: 'agenda_ya', program: 'inmersivo', team: false } }) },
  { id: 'gerente_equipo_multinacional', weight: 12, build: () => ({
    form: { role: 'gerente', roleText: pick(['Gerente de Innovación', 'Gerente de Transformación Digital', 'Head of People']), revenue: 'mas_5m', investment: 'imposible', decider: 'otro', seats: '5_mas' },
    content: 'Cómo implementar IA en una empresa de 500 personas',
    luma: ['Masterclass: agentes de IA para tu operación', '¿Cómo capacito a 30 personas de mi área en IA sin frenar la operación?'],
    expected: { action: 'empresas', program: 'corporativo', team: true } }) },
  { id: 'gerente_comercial', weight: 12, build: () => ({
    form: { role: 'gerente', roleText: pick(['Gerente Comercial', 'Gerente de Ventas', 'Head of Sales']), revenue: pick(['1m_5m', '500k_1m'] as const), investment: 'plan_pagos', decider: 'compartido', seats: 'solo' },
    content: 'Experto en VENTAS con IA revela su sistema completo',
    luma: ['Clase gratis: IA para tu equipo comercial', '¿Cómo uso agentes de voz para contactar leads en 5 minutos?'],
    expected: { action: 'otro_programa', program: 'ai_sales', team: false } }) },
  { id: 'founder_pequeno_ventas', weight: 12, build: () => ({
    form: { role: 'founder_ceo', roleText: 'Fundadora de agencia B2B', revenue: 'menos_200k', investment: 'imposible', decider: 'solo', seats: 'solo' },
    content: 'Cómo armar un proceso de ventas B2B desde cero',
    expected: { action: 'otro_programa', program: 'sales_machine', team: false } }) },
  { id: 'perfil_tecnico', weight: 8, build: () => ({
    form: { role: pick(['analista', 'coordinador'] as const), roleText: pick(['Tech Lead', 'Desarrollador senior', 'Ingeniero de datos']), revenue: '500k_1m', investment: 'imposible', decider: 'otro', seats: 'solo' },
    content: 'De developer a builder: agentes con código',
    expected: { action: 'otro_programa', program: 'ai_developers', team: false } }) },
  { id: 'abandono_caliente', weight: 8, build: () => ({
    form: {}, partial: true,
    content: 'Inmersivo 30X: escala tu empresa con los fundadores de Rappi',
    luma: ['Live Mentoring: De crecer a escalar', 'Ya facturamos 2M al año, ¿qué tengo que tener listo para expandirme a México?'],
    expected: { action: 'cola_humana', program: 'inmersivo', team: false } }) },
  { id: 'estudiante', weight: 8, build: () => ({
    form: { role: 'analista', roleText: pick(['Estudiante de administración', 'Practicante', 'Recién graduado']), revenue: 'menos_200k', investment: 'imposible', decider: 'otro', seats: 'solo' },
    content: 'Qué es la IA y cómo va a cambiar tu carrera',
    expected: { action: 'nurturing', program: 'ninguno', team: false } }) },
  { id: 'founder_ronda', weight: 7, build: () => ({
    form: { role: 'founder_ceo', roleText: 'Cofundador de startup', revenue: '200k_500k', investment: 'imposible', decider: 'solo', seats: 'solo' },
    content: 'Cómo levantar tu ronda pre-seed en Latinoamérica',
    luma: ['Clase gratis: cómo levantar tu primera ronda', 'Estamos por salir a levantar 500k, ¿cómo armo el data room?'],
    expected: { action: 'otro_programa', program: 'fundraising', team: false } }) },
  { id: 'cmo_growth', weight: 8, build: () => ({
    form: { role: 'c_level', roleText: pick(['CMO', 'VP de Marketing', 'Head of Growth']), revenue: '500k_1m', investment: 'imposible', decider: 'compartido', seats: 'solo' },
    content: 'Growth con IA: cómo duplicar leads con el mismo presupuesto',
    expected: { action: 'otro_programa', program: 'growth_rockstar', team: false } }) },
];

const leads: Lead[] = [];
const expected: Record<string, Expected> = {};

for (let i = 0; i < 300; i++) {
  const a = weighted(ARCHETYPES.map((x) => [x, x.weight] as [Archetype, number]));
  const b = a.build();
  const country = weighted(COUNTRY);
  const channel = b.luma && rand() < 0.4 ? 'luma' : weighted(CHANNEL);
  const name = `${pick(FIRST)} ${pick(LAST)}`;
  const id = `L${String(i + 1).padStart(3, '0')}`;
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
      ...(b.partial ? {} : { company, edition: EDITION[country] }),
      ...b.form,
    } as Lead['form'],
    partial: Boolean(b.partial),
    signals: b.luma ? [{ type: 'luma_event', at: '2026-10-14T19:00:00-05:00', text: `${b.luma[0]}. Pregunta que dejó: ${b.luma[1]}` }] : [],
    archetype: a.id,
  };
  leads.push(lead);
  expected[id] = b.expected;
}

mkdirSync('data', { recursive: true });
writeFileSync('data/leads.json', JSON.stringify(leads, null, 2));
writeFileSync('data/eval-set.json', JSON.stringify(Object.fromEntries(leads.slice(0, 100).map((l) => [l.id, expected[l.id]])), null, 2));

const counts: Record<string, number> = {};
for (const l of leads) counts[l.archetype!] = (counts[l.archetype!] ?? 0) + 1;
console.log(`300 leads → data/leads.json · 100 etiquetados → data/eval-set.json`);
console.log(counts);
