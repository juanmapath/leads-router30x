// Primera llamada real a Jev con un lead sintético. Imprime y guarda la respuesta cruda.
// Uso (PowerShell, en la carpeta del repo):  npm run ping
import { writeFileSync, mkdirSync } from 'node:fs';
import { experimental_evaluate as evaluate } from 'ai';
import { buildState } from '../src/engine/state.ts';
import { toSdkQuestions, normalize } from '../src/engine/jev.ts';
import { decide } from '../src/engine/decide.ts';
import { legacyRoute } from '../src/engine/legacy.ts';
import leads from '../data/leads.json' with { type: 'json' };
import type { Lead } from '../src/engine/types.ts';

if (!process.env.AI_GATEWAY_API_KEY) {
  console.error('Falta AI_GATEWAY_API_KEY. Ponla en .env.local (ver .env.example).');
  process.exit(1);
}

const lead = (leads as Lead[]).find((l) => l.archetype === 'gerente_equipo_multinacional')!;
const state = buildState(lead);
const report: Record<string, unknown> = { lead: lead.id, archetype: lead.archetype, state };

console.log('Estado que recibe Jev:\n' + state + '\n');

// 1) Prueba mínima: una sola pregunta sí/no.
try {
  const t0 = Date.now();
  const r = await (evaluate as any)({ model: 'typesafe-ai/jev', state, questions: { team: { type: 'boolean', instructions: '¿Es una oportunidad para formar a un equipo de varias personas?' } } });
  report.minimal = { ok: true, ms: Date.now() - t0, raw: r };
  console.log('✔ prueba mínima', Date.now() - t0, 'ms');
} catch (e: any) {
  report.minimal = { ok: false, error: String(e?.message ?? e), data: e?.responseBody ?? e?.data };
  console.log('✘ prueba mínima:', e?.message ?? e);
}

// 2) Las 6 preguntas del PRD en una sola llamada.
try {
  const t0 = Date.now();
  const raw = await (evaluate as any)({ model: 'typesafe-ai/jev', state, questions: toSdkQuestions() });
  const answers = normalize(raw);
  report.full = { ok: true, ms: Date.now() - t0, raw, answers, decision: decide(answers), legacy: legacyRoute(lead) };
  console.log('✔ 6 preguntas', Date.now() - t0, 'ms');
  console.log(JSON.stringify({ answers, decision: decide(answers), legacy: legacyRoute(lead) }, null, 2));
} catch (e: any) {
  report.full = { ok: false, error: String(e?.message ?? e), data: e?.responseBody ?? e?.data };
  console.log('✘ 6 preguntas:', e?.message ?? e);
}

mkdirSync('data/recordings', { recursive: true });
writeFileSync('data/recordings/_ping.json', JSON.stringify(report, null, 2));
console.log('\nGuardado en data/recordings/_ping.json');
