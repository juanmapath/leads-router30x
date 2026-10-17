// Verificador determinístico. Corre sin red: node --experimental-strip-types --test tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { legacyRoute, legacyScore } from '../src/engine/legacy.ts';
import { decide } from '../src/engine/decide.ts';
import { normalize, toSdkQuestions } from '../src/engine/jev.ts';
import { buildState } from '../src/engine/state.ts';
import type { JevAnswers, Lead } from '../src/engine/types.ts';

const leads: Lead[] = JSON.parse(readFileSync('data/leads.json', 'utf8'));

test('la regla de puntos replica la lógica pública de 30X', () => {
  assert.equal(legacyScore({ name: '', email: '', whatsappCountry: '', role: 'founder_ceo', revenue: 'mas_5m', investment: 'listo', decider: 'solo' }).score, 10);
  assert.equal(legacyScore({ name: '', email: '', whatsappCountry: '', role: 'gerente', revenue: 'mas_5m', investment: 'imposible', decider: 'otro' }).score, 2);
  // Borde: 6 puntos no pasa (la regla es "mayor que 6").
  const six: Lead = { ...leads[0], partial: false, form: { ...leads[0].form, role: 'founder_ceo', revenue: '200k_500k', investment: 'imposible', decider: 'solo' } };
  assert.equal(legacyRoute(six).score, 6);
  assert.equal(legacyRoute(six).route, 'gracias');
  const seven: Lead = { ...six, form: { ...six.form, role: 'c_level', investment: 'plan_pagos', decider: 'compartido', revenue: '1m_5m' } };
  assert.equal(legacyRoute(seven).score, 7);
  assert.equal(legacyRoute(seven).route, 'entrevista');
});

const base: JevAnswers = {
  ready: { value: true, p: 0.9 },
  program: { value: 'inmersivo', p: 0.85 },
  team: { value: false, p: 0.1 },
  maturity: { value: 'media', p: 0.6 },
  objection: { value: 'ninguna', p: 0.5 },
  channel: { value: 'llamada_ia', p: 0.8 },
};

test('umbrales: cada probabilidad va a la acción correcta', () => {
  assert.equal(decide(base).action, 'agenda_ya');
  assert.equal(decide({ ...base, team: { value: true, p: 0.86 } }).action, 'empresas');
  assert.equal(decide({ ...base, team: { value: true, p: 0.7 } }).action, 'agenda_ya');
  assert.equal(decide({ ...base, ready: { value: false, p: 0.3 } }).action, 'nurturing');
  assert.equal(decide({ ...base, ready: { value: true, p: 0.65 }, program: { value: 'ai_sales', p: 0.8 } }).action, 'otro_programa');
  assert.equal(decide({ ...base, ready: { value: true, p: 0.65 } }).action, 'cola_humana');
  assert.equal(decide({ ...base, program: { value: 'otro', p: 0.9 } }).action, 'cola_humana');
});

test('la zona dudosa siempre pasa por una persona', () => {
  for (let p = 0; p <= 1.0001; p += 0.05) {
    for (const prog of ['inmersivo', 'ai_sales', 'otro', 'ninguno'] as const) {
      const d = decide({ ...base, ready: { value: p >= 0.5, p }, program: { value: prog, p: 0.6 } });
      if (d.action === 'agenda_ya' || d.action === 'otro_programa') assert.fail(`programa poco claro no debe actuar solo (p=${p}, ${prog})`);
    }
  }
});

test('normalize entiende varias formas de respuesta', () => {
  const a = normalize({ answers: {
    ready: { value: true, probability: 0.82 },
    program: { value: 'ai_sales', probability: 0.71 },
    team: { value: false, probability: 0.9 },
    maturity: { value: 'alta', probability: 0.6 },
    objection: { probabilities: { precio: 0.7, tiempo: 0.3 } },
    channel: { answer: 'whatsapp', confidence: 0.66 },
  } });
  assert.equal(a.ready.p, 0.82);
  assert.ok(Math.abs(a.team.p - 0.1) < 1e-9); // P(sí) = 1 - 0.9
  assert.equal(a.objection.value, 'precio');
  assert.equal(a.channel.value, 'whatsapp');
});

test('estado: corto, en español y sin datos de contacto', () => {
  for (const l of leads) {
    const s = buildState(l);
    assert.ok(s.length < 2000, `${l.id} demasiado largo`);
    assert.ok(!s.includes(l.form.email), `${l.id} expone el correo`);
    assert.ok(!s.includes(l.form.name), `${l.id} expone el nombre`);
  }
  assert.equal(Object.keys(toSdkQuestions()).length, 6);
});

test('datos: la regla actual descarta a muchos leads que sí tienen un programa', () => {
  const evalSet: Record<string, { action: string }> = JSON.parse(readFileSync('data/eval-set.json', 'utf8'));
  const lost = leads.slice(0, 100).filter((l) => legacyRoute(l).route !== 'entrevista' && evalSet[l.id].action !== 'nurturing');
  assert.ok(lost.length > 30, `esperábamos >30 recuperables, hay ${lost.length}`);
});
