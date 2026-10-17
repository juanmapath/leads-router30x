// Corre un set etiquetado por Jev y mide: precisión, calibración, errores que terminan en una persona,
// errores caros (agenda_ya indebido), leads recuperados frente a la regla actual, costo y latencia.
// Uso: npm run eval -- --set tuning   (100 de ajuste; con estos se eligieron preguntas y reglas)
//      npm run eval -- --set test     (set de prueba v3: de aquí salen los números del pitch)
// Por defecto JEV_MODE=record en local (graba lo que falte); JEV_MODE=replay no gasta crédito.
import { readFileSync, writeFileSync } from 'node:fs';
import leads from '../data/leads.json' with { type: 'json' };
import evalSet from '../data/eval-set.json' with { type: 'json' };
import { askJev } from '../src/engine/jev-client.ts';
import { buildState } from '../src/engine/state.ts';
import { decideForLead } from '../src/engine/decide.ts';
import { legacyRoute } from '../src/engine/legacy.ts';
import type { Expected, Lead } from '../src/engine/types.ts';

const arg = (name: string) => { const i = process.argv.indexOf(name); return i >= 0 ? process.argv[i + 1] : undefined; };
const setName = arg('--set') ?? 'tuning';
if (!['tuning', 'test'].includes(setName)) throw new Error('--set debe ser tuning o test');

// --gate: puerta de CI. Solo grabaciones (nunca llama a Jev ni necesita clave); falla si la acción baja del piso
// o si hay un solo error caro, sin excepciones por id. Piso = acción medida en el set de prueba v3 (81,1 %) menos 5 puntos.
const gate = process.argv.includes('--gate');
const FLOOR = Number(arg('--floor') ?? 0.76);
if (gate) process.env.JEV_MODE = 'replay-only';

type Exp = Expected & { kind?: string; note?: string };
let set: Lead[];
let expected: Record<string, Exp>;
if (setName !== 'tuning') {
  // Set de prueba v3. Los v1 y v2 (data/test-set-v1.json, -v2.json) y sus reportes quedan como histórico.
  const t = JSON.parse(readFileSync('data/test-set.json', 'utf8')) as { leads: Lead[]; expected: Record<string, Exp> };
  set = t.leads;
  expected = t.expected;
} else {
  expected = evalSet as Record<string, Exp>;
  set = (leads as Lead[]).filter((l) => expected[l.id]);
}

const rows: any[] = [];
for (const [i, lead] of set.entries()) {
  const call = await askJev(buildState(lead));
  const d = decideForLead(lead, call.answers);
  const exp = expected[lead.id];
  rows.push({
    id: lead.id, archetype: lead.archetype, kind: exp.kind ?? 'arquetipo', expected: exp, decision: d, answers: call.answers,
    legacy: legacyRoute(lead).route, ms: call.ms, costUsd: call.costUsd, source: call.source,
    actionOk: d.action === exp.action,
    // program 'otro' en lo esperado = caso ambiguo, no evaluable para el programa.
    programOk: exp.program === 'otro' ? null : call.answers.program.value === exp.program,
    teamOk: call.answers.team.value === exp.team,
  });
  process.stdout.write(`\r${i + 1}/${set.length} ${call.source}   `);
}

const n = rows.length;
const share = (xs: any[], f: (r: any) => boolean) => (xs.length ? xs.filter(f).length / xs.length : null);
const programRows = rows.filter((r) => r.programOk !== null);
const errors = rows.filter((r) => !r.actionOk);
// Error caro: Jev manda a agendar ya a alguien que no debía (le quita tiempo a un vendedor).
const expensive = errors.filter((r) => r.decision.action === 'agenda_ya');
// Error seguro: el lead termina frente a una persona (cola humana o área de empresas, que es un vendedor).
const toPerson = errors.filter((r) => r.decision.needsHuman || r.decision.action === 'empresas');

const buckets = [0.5, 0.6, 0.7, 0.8, 0.9, 1.01].map((hi, i, arr) => {
  const lo = i === 0 ? 0 : arr[i - 1];
  const inB = programRows.filter((r) => r.answers.program.p >= lo && r.answers.program.p < hi);
  return { tramo: `${Math.round(lo * 100)}–${Math.min(100, Math.round(hi * 100))} %`, n: inB.length, acierto: share(inB, (r) => r.programOk) };
});
const lostByLegacy = rows.filter((r) => r.legacy !== 'entrevista' && r.expected.action !== 'nurturing');
const kinds = [...new Set(rows.map((r) => r.kind))];
const msSorted = rows.map((r) => r.ms).sort((a, b) => a - b);
const totalCost = rows.reduce((a, r) => a + r.costUsd, 0);

const report = {
  set: setName,
  n,
  precision: { accion: share(rows, (r) => r.actionOk), programa: share(programRows, (r) => r.programOk), programaEvaluables: programRows.length, empresa: share(rows, (r) => r.teamOk) },
  errores: { total: errors.length, terminanEnPersona: toPerson.length, pctEnPersona: share(errors, (r) => toPerson.includes(r)), caros: expensive.length },
  porTipo: Object.fromEntries(kinds.map((k) => { const xs = rows.filter((r) => r.kind === k); return [k, { n: xs.length, accion: share(xs, (r) => r.actionOk), caros: xs.filter((r) => expensive.includes(r)).length }]; })),
  calibracion: buckets,
  recuperados: { recuperados: lostByLegacy.filter((r) => r.actionOk).length, descartadosPorLaRegla: lostByLegacy.length },
  regla: { entrevista: rows.filter((r) => r.legacy === 'entrevista').length, entrevistaIndebida: rows.filter((r) => r.legacy === 'entrevista' && r.expected.action !== 'agenda_ya').length },
  costo: { porDecisionUsd: totalCost / n, por1000Usd: (totalCost / n) * 1000 },
  // ms medidos en la llamada en vivo (quedan en la grabación, así que replay los reporta igual).
  latenciaMs: { media: Math.round(msSorted.reduce((a, b) => a + b, 0) / n), p95: msSorted[Math.floor(n * 0.95)] },
  fuentes: { replay: rows.filter((r) => r.source === 'replay').length, live: rows.filter((r) => r.source === 'live').length },
  detalleErrores: errors.map((r) => ({ id: r.id, tipo: r.kind, arquetipo: r.archetype, nota: r.expected.note, esperado: r.expected.action, obtuvo: r.decision.action, listo: r.answers.ready.p, programa: r.answers.program, equipo: r.answers.team.p })),
};
if (gate) {
  const accion = report.precision.accion ?? 0;
  console.log(`\nPuerta (${setName}): acción ${(accion * 100).toFixed(1)} % (piso ${(FLOOR * 100).toFixed(0)} %), errores caros ${expensive.length} (máx. 0)`);
  if (accion < FLOOR || expensive.length > 0) {
    for (const r of expensive) console.error(`Error caro: ${r.id} (${r.expected.note ?? r.archetype}) esperado ${r.expected.action}, obtuvo agenda_ya`);
    process.exit(1);
  }
} else {
  writeFileSync(`data/eval-report-${setName}.json`, JSON.stringify(report, null, 2));
  console.log('\n' + JSON.stringify({ ...report, calibracion: undefined, detalleErrores: report.detalleErrores.length }, null, 2));
}
