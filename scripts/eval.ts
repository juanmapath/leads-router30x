// Corre el set de 100 leads etiquetados por Jev (grabando las respuestas) y mide:
// precisión, calibración, leads recuperados frente a la regla actual, costo y latencia.
// Uso: npm run eval   (JEV_MODE=record por defecto en local)
import { writeFileSync } from 'node:fs';
import leads from '../data/leads.json' with { type: 'json' };
import evalSet from '../data/eval-set.json' with { type: 'json' };
import { askJev } from '../src/engine/jev-client.ts';
import { buildState } from '../src/engine/state.ts';
import { decideForLead } from '../src/engine/decide.ts';
import { legacyRoute } from '../src/engine/legacy.ts';
import type { Expected, Lead } from '../src/engine/types.ts';

const expected = evalSet as Record<string, Expected>;
const set = (leads as Lead[]).filter((l) => expected[l.id]);
const rows: any[] = [];

for (const [i, lead] of set.entries()) {
  const call = await askJev(buildState(lead));
  const d = decideForLead(lead, call.answers);
  const exp = expected[lead.id];
  rows.push({
    id: lead.id, archetype: lead.archetype, expected: exp, decision: d, answers: call.answers,
    legacy: legacyRoute(lead).route, ms: call.ms, costUsd: call.costUsd, source: call.source,
    actionOk: d.action === exp.action, programOk: call.answers.program.value === exp.program, teamOk: call.answers.team.value === exp.team,
  });
  process.stdout.write(`\r${i + 1}/${set.length} ${call.source}   `);
}

const n = rows.length;
const rate = (f: (r: any) => boolean) => rows.filter(f).length / n;
// Calibración: por tramo de probabilidad del programa elegido, ¿qué tanto acierta?
const buckets = [0.5, 0.6, 0.7, 0.8, 0.9, 1.01].map((hi, i, arr) => {
  const lo = i === 0 ? 0 : arr[i - 1];
  const inB = rows.filter((r) => r.answers.program.p >= lo && r.answers.program.p < hi);
  return { tramo: `${Math.round(lo * 100)}–${Math.min(100, Math.round(hi * 100))} %`, n: inB.length, acierto: inB.length ? inB.filter((r) => r.programOk).length / inB.length : null };
});
const recovered = rows.filter((r) => r.legacy !== 'entrevista' && r.expected.action !== 'nurturing' && r.actionOk).length;
const lostByLegacy = rows.filter((r) => r.legacy !== 'entrevista' && r.expected.action !== 'nurturing').length;

const report = {
  n,
  precision: { accion: rate((r) => r.actionOk), programa: rate((r) => r.programOk), empresa: rate((r) => r.teamOk) },
  calibracion: buckets,
  recuperados: { recuperados: recovered, descartadosPorLaRegla: lostByLegacy },
  costo: { porDecisionUsd: rows.reduce((a, r) => a + r.costUsd, 0) / n, por1000Usd: (rows.reduce((a, r) => a + r.costUsd, 0) / n) * 1000 },
  // ms medidos en la llamada en vivo (también quedan en la grabación, así que replay los reporta igual).
  latenciaMs: { media: Math.round(rows.reduce((a, r) => a + r.ms, 0) / n), p95: [...rows.map((r) => r.ms)].sort((a, b) => a - b)[Math.floor(n * 0.95)] },
  errores: rows.filter((r) => !r.actionOk).map((r) => ({ id: r.id, arquetipo: r.archetype, esperado: r.expected.action, obtuvo: r.decision.action, programa: r.answers.program })),
};
writeFileSync('data/eval-report.json', JSON.stringify(report, null, 2));
console.log('\n' + JSON.stringify({ ...report, errores: report.errores.length }, null, 2));
