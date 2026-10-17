// Graba la respuesta de Jev para cada lead que aún no tiene grabación, para que el demo
// en Vercel (modo replay, sin clave) responda los 300 leads sin red.
// Uso: npm run record
import { existsSync } from 'node:fs';
import leads from '../data/leads.json' with { type: 'json' };
import { askJev, recordingPath } from '../src/engine/jev-client.ts';
import { buildState } from '../src/engine/state.ts';
import type { Lead } from '../src/engine/types.ts';

process.env.JEV_MODE = 'record';
const missing = (leads as Lead[]).filter((l) => !existsSync(recordingPath(buildState(l))));
console.log(`${leads.length} leads, ${missing.length} sin grabación`);
let cost = 0;
for (const [i, lead] of missing.entries()) {
  cost += (await askJev(buildState(lead))).costUsd;
  process.stdout.write(`\r${i + 1}/${missing.length}`);
}
console.log(`\nListo. Costo aprox.: USD ${cost.toFixed(4)}`);
