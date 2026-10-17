// Genera 300 leads sintéticos (una semana típica de 30X) y un set de ajuste de 100.
// Determinístico: misma semilla, mismos datos. Ningún dato es de una persona real.
// Uso: npm run gen

import { writeFileSync, mkdirSync } from 'node:fs';
import { generate } from './synthetic.ts';

const { leads, expected } = generate(30_2026, 300);

mkdirSync('data', { recursive: true });
writeFileSync('data/leads.json', JSON.stringify(leads, null, 2));
writeFileSync('data/eval-set.json', JSON.stringify(Object.fromEntries(leads.slice(0, 100).map((l) => [l.id, expected[l.id]])), null, 2));

const counts: Record<string, number> = {};
for (const l of leads) counts[l.archetype!] = (counts[l.archetype!] ?? 0) + 1;
console.log(`300 leads → data/leads.json · 100 etiquetados → data/eval-set.json`);
console.log(counts);
