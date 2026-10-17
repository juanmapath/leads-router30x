// Cliente de Jev vía Vercel AI Gateway, con grabar/reproducir.
// JEV_MODE=live   → siempre llama a Jev.
// JEV_MODE=record → llama a Jev y guarda la respuesta en data/recordings (default en local).
// JEV_MODE=replay → usa la grabación si existe; si no, llama en vivo (default en Vercel).
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { experimental_decide as decideWithJev } from 'ai';
import { QUESTIONS, type QuestionDef } from './questions.ts';
import { normalize, toSdkQuestions } from './jev.ts';
import type { JevAnswers } from './types.ts';

export const JEV_MODEL = 'typesafe-ai/jev';
const PRICE_PER_MTOK = 0.042; // USD por millón de tokens de entrada; la salida es gratis
const DIR = path.join(process.cwd(), 'data', 'recordings');

export interface JevCall {
  answers: JevAnswers;
  raw: unknown;
  ms: number;
  inputTokens: number;
  costUsd: number;
  source: 'live' | 'replay';
}

function keyFor(state: string, questions: QuestionDef[]) {
  return createHash('sha256').update(JSON.stringify({ state, questions })).digest('hex').slice(0, 16);
}

function mode(): 'live' | 'record' | 'replay' {
  const m = process.env.JEV_MODE;
  if (m === 'live' || m === 'record' || m === 'replay') return m;
  return process.env.VERCEL ? 'replay' : 'record';
}

/** Ruta de la grabación para un estado (exista o no). */
export function recordingPath(state: string, questions: QuestionDef[] = QUESTIONS) {
  return path.join(DIR, `${keyFor(state, questions)}.json`);
}

export async function askJev(state: string, questions: QuestionDef[] = QUESTIONS): Promise<JevCall> {
  const file = recordingPath(state, questions);
  const m = mode();

  if (m === 'replay' && existsSync(file)) {
    const rec = JSON.parse(readFileSync(file, 'utf8'));
    return { ...rec, answers: normalize(rec.raw), source: 'replay' };
  }

  const t0 = Date.now();
  const raw = await withRetry(() =>
    decideWithJev({ model: JEV_MODEL, state, questions: toSdkQuestions(questions), maxRetries: 0 }),
  );
  const ms = Date.now() - t0;
  const inputTokens = raw.usage.inputTokens ?? Math.ceil((state.length + JSON.stringify(questions).length) / 4);
  const call = { raw, ms, inputTokens, costUsd: (inputTokens / 1_000_000) * PRICE_PER_MTOK };

  if (m === 'record') {
    mkdirSync(DIR, { recursive: true });
    writeFileSync(file, JSON.stringify({ state, ...call }, null, 2));
  }
  return { ...call, answers: normalize(raw), source: 'live' };
}

async function withRetry<T>(fn: () => Promise<T>, tries = 5): Promise<T> {
  let wait = 2000;
  for (let i = 0; ; i++) {
    try {
      return await fn();
    } catch (err) {
      const msg = String((err as Error)?.message ?? err);
      const rateLimited = msg.includes('429') || /rate/i.test(msg);
      if (!rateLimited || i >= tries - 1) throw err;
      await new Promise((r) => setTimeout(r, wait));
      wait *= 2;
    }
  }
}
