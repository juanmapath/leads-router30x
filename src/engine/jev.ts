import type { Experimental_DecisionQuestion } from 'ai';
import { QUESTIONS, type QuestionDef } from './questions.ts';
import type { JevAnswers } from './types.ts';

/**
 * Traduce nuestras preguntas al formato de `experimental_decide` del AI SDK (ai 7).
 * Boolean: solo instrucciones. Choice: opciones en `criteria` (nombre → descripción).
 * Score: niveles ordenados en `criteria`, indexados desde cero.
 */
export function toSdkQuestions(questions: QuestionDef[] = QUESTIONS): Record<string, Experimental_DecisionQuestion> {
  const out: Record<string, Experimental_DecisionQuestion> = {};
  for (const q of questions) {
    if (q.type === 'boolean') out[q.key] = { type: 'boolean', instructions: q.instructions };
    else if (q.type === 'choice') out[q.key] = { type: 'choice', instructions: q.instructions, criteria: q.options };
    else out[q.key] = { type: 'score', instructions: q.instructions, criteria: q.levels };
  }
  return out;
}

// Respuesta cruda por pregunta, tal como la devuelve el SDK (ver DecisionModelV4Answer).
// `refusal`: Jev declinó responder esa pregunta.
type RawAnswer =
  | { type: 'boolean'; probability: number }
  | { type: 'choice'; choice: string; probabilities?: Record<string, number> }
  | { type: 'score'; score: number; probabilities?: Record<string, number> }
  | { type: 'refusal' };

const isNum = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);

/** Lee una respuesta y la valida; cualquier cosa inesperada cuenta como negativa. */
function read(raw: unknown): RawAnswer {
  const r = (raw ?? {}) as Record<string, unknown>;
  if (r.type === 'boolean' && isNum(r.probability)) return r as RawAnswer;
  if (r.type === 'choice' && typeof r.choice === 'string') return r as RawAnswer;
  if (r.type === 'score' && isNum(r.score)) return r as RawAnswer;
  return { type: 'refusal' };
}

/** `probability` ya es P(sí): se usa tal cual, sin invertir. */
function yes(a: RawAnswer): { value: boolean; p: number } | undefined {
  return a.type === 'boolean' ? { value: a.probability >= 0.5, p: a.probability } : undefined;
}

/** Sin distribución no hay confianza conocida: p = 0 (lo conservador, manda a persona). */
function choice<T extends string>(a: RawAnswer, fallback: T): { value: T; p: number } {
  if (a.type !== 'choice') return { value: fallback, p: 0 };
  return { value: a.choice as T, p: a.probabilities?.[a.choice] ?? 0 };
}

/** Score: nivel más probable si hay distribución; si no, el nivel más cercano a la posición. */
function level<T extends string>(a: RawAnswer, levels: readonly T[], fallback: T): { value: T; p: number } {
  if (a.type !== 'score') return { value: fallback, p: 0 };
  const entries = Object.entries(a.probabilities ?? {}).filter(([, v]) => isNum(v));
  if (entries.length) {
    const [k, p] = entries.sort((x, y) => y[1] - x[1])[0];
    return { value: levels[Number(k)] ?? fallback, p };
  }
  const i = Math.min(levels.length - 1, Math.max(0, Math.round(a.score)));
  return { value: levels[i], p: Math.max(0, 1 - Math.abs(a.score - i)) };
}

const MATURITY = ['baja', 'media', 'alta'] as const;

/**
 * Normaliza el resultado de `experimental_decide` a JevAnswers.
 * Si Jev se niega (o falta) en ready, program o team, el programa queda en "otro" con p = 0:
 * decide() lo manda a cola humana.
 */
export function normalize(result: unknown): JevAnswers {
  const answers = ((result ?? {}) as { answers?: Record<string, unknown> }).answers ?? {};
  const get = (k: string) => read(answers[k]);

  const ready = yes(get('ready'));
  const team = yes(get('team'));
  const rawProgram = get('program');
  let program: JevAnswers['program'] = choice<JevAnswers['program']['value']>(rawProgram, 'otro');
  if (rawProgram.type === 'choice' && rawProgram.probabilities) program.dist = rawProgram.probabilities;
  if (!ready || !team || rawProgram.type === 'refusal') program = { value: 'otro', p: 0 };

  return {
    ready: ready ?? { value: false, p: 0.5 },
    program,
    team: team ?? { value: false, p: 0 },
    maturity: level(get('maturity'), MATURITY, 'media'),
    objection: choice<JevAnswers['objection']['value']>(get('objection'), 'otra'),
    channel: choice<JevAnswers['channel']['value']>(get('channel'), 'vendedor'),
    // Sin respuesta de coherencia no se agenda solo: p = 0.
    coherent: yes(get('coherent')) ?? { value: false, p: 0 },
  };
}
