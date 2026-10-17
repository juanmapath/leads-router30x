// Graba la respuesta de Jev para todo lo que el demo y los evals necesitan y aún no tiene grabación:
// los 300 leads del demo (incluye los 100 de ajuste), el set de prueba (v3; v1 y v2 quedan como histórico) y las combinaciones del simulador
// para los leads destacados. Así el demo en Vercel (modo replay) responde sin red.
// Uso: npm run record            (solo graba lo que falta)
//      npm run record -- --dry   (cuenta lo que falta y estima el costo, sin llamar a Jev)
//      npm run record -- --prune (además borra grabaciones que ya no corresponden a ningún estado)
import { existsSync, readdirSync, readFileSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import leads from '../data/leads.json' with { type: 'json' };
import { askJev, recordingPath } from '../src/engine/jev-client.ts';
import { featuredLeads, simCombos, simSignals } from '../src/engine/simulator.ts';
import { buildState } from '../src/engine/state.ts';
import type { Lead } from '../src/engine/types.ts';

process.env.JEV_MODE = 'record';
const testLeads = ['data/test-set.json'].flatMap((f) => (JSON.parse(readFileSync(f, 'utf8')) as { leads: Lead[] }).leads);

const states = new Set<string>();
for (const l of leads as Lead[]) states.add(buildState(l));
for (const l of testLeads) states.add(buildState(l));
for (const l of featuredLeads(leads as Lead[])) {
  for (const combo of simCombos()) states.add(buildState({ ...l, signals: [...l.signals, ...simSignals(combo)] }));
}

const missing = [...states].filter((s) => !existsSync(recordingPath(s)));
const estTokens = missing.reduce((a, s) => a + Math.ceil(s.length / 4) + 900, 0); // ~900 tokens de preguntas
console.log(`${states.size} estados, ${missing.length} sin grabación (~${estTokens.toLocaleString('es')} tokens, ~USD ${((estTokens / 1e6) * 0.042).toFixed(4)})`);

if (!process.argv.includes('--dry')) {
  let cost = 0;
  for (const [i, state] of missing.entries()) {
    cost += (await askJev(state)).costUsd;
    process.stdout.write(`\r${i + 1}/${missing.length}`);
  }
  console.log(`\nListo. Costo real: USD ${cost.toFixed(4)}`);
}

if (process.argv.includes('--prune')) {
  const keep = new Set([...states].map((s) => path.basename(recordingPath(s))));
  const dir = path.dirname(recordingPath(''));
  const stale = readdirSync(dir).filter((f) => f.endsWith('.json') && !f.startsWith('_') && !keep.has(f));
  for (const f of stale) unlinkSync(path.join(dir, f));
  console.log(`Borradas ${stale.length} grabaciones viejas.`);
}
