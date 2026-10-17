// Genera la semana del demo (data/week-leads.json) con la mezcla explícita de data/week-mix.json y otra semilla.
// No toca data/leads.json: sus primeros 100 son el set de ajuste. Ningún lead de la semana repite el estado
// de un lead de prueba (v1, v2 o v3): si coincide, se vuelve a sortear.
// Uso: npm run gen:week
import { readFileSync, writeFileSync } from 'node:fs';
import { buildState } from '../src/engine/state.ts';
import type { Lead } from '../src/engine/types.ts';
import { generateMix } from './synthetic.ts';

interface Mix { semilla: number; prefijo: string; grupos: Array<{ grupo: string; pct: number; arquetipos: Record<string, number> }> }
const mix: Mix = JSON.parse(readFileSync('data/week-mix.json', 'utf8'));

const testStates = new Set(
  ['data/test-set-v1.json', 'data/test-set-v2.json', 'data/test-set.json']
    .flatMap((f) => (JSON.parse(readFileSync(f, 'utf8')) as { leads: Lead[] }).leads.map(buildState)),
);
const counts = Object.assign({}, ...mix.grupos.map((g) => g.arquetipos)) as Record<string, number>;
const { leads, expected, rerolls } = generateMix(mix.semilla, counts, mix.prefijo, (l) => testStates.has(buildState(l)));

writeFileSync('data/week-leads.json', JSON.stringify({ leads, expected }, null, 2));
console.log(`${leads.length} leads → data/week-leads.json (${rerolls} re-sorteados por coincidir con un set de prueba)`);
for (const g of mix.grupos) console.log(`  ${g.grupo}: ${Object.values(g.arquetipos).reduce((a, b) => a + b, 0)} (${g.pct} %)`);
