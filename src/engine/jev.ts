import { QUESTIONS, type QuestionDef } from './questions.ts';
import type { JevAnswers } from './types.ts';

/**
 * Traduce nuestras preguntas al formato del AI SDK (experimental_evaluate).
 * Booleans: { type: 'boolean', instructions }. Choice/score: opciones en `criteria`.
 * Si el formato real difiere, se ajusta solo aquí (scripts/jev-ping.mjs lo verifica).
 */
export function toSdkQuestions(questions: QuestionDef[] = QUESTIONS): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const q of questions) {
    if (q.type === 'boolean') out[q.key] = { type: 'boolean', instructions: q.instructions };
    else if (q.type === 'choice')
      out[q.key] = {
        type: 'choice',
        instructions: q.instructions,
        criteria: Object.fromEntries(Object.entries(q.options).map(([k, v]) => [k, v])),
      };
    else out[q.key] = { type: 'score', instructions: q.instructions, criteria: q.levels };
  }
  return out;
}

type Raw = Record<string, unknown>;

/** Lee una probabilidad de un objeto de respuesta, sin importar el nombre del campo. */
function num(x: unknown): number | undefined {
  return typeof x === 'number' && Number.isFinite(x) ? x : undefined;
}

function readAnswer(raw: unknown): { value: unknown; p: number; dist?: Record<string, number> } {
  if (raw === null || typeof raw !== 'object') return { value: raw, p: 0 };
  const r = raw as Raw;
  const value = r.value ?? r.answer ?? r.choice ?? r.label ?? r.result;
  const p = num(r.probability) ?? num(r.p) ?? num(r.confidence) ?? num(r.score);
  const distRaw = (r.probabilities ?? r.distribution ?? r.scores) as Raw | undefined;
  let dist: Record<string, number> | undefined;
  if (distRaw && typeof distRaw === 'object') {
    dist = Object.fromEntries(Object.entries(distRaw).filter(([, v]) => typeof v === 'number')) as Record<string, number>;
  }
  let best = value;
  let bestP = p;
  if (dist && Object.keys(dist).length) {
    const [k, v] = Object.entries(dist).sort((x, y) => y[1] - x[1])[0];
    if (best === undefined) best = k;
    if (bestP === undefined) bestP = v;
  }
  return { value: best, p: bestP ?? 0, dist };
}

/** Para booleans devolvemos P(sí), aunque el modelo informe la probabilidad de su respuesta. */
function yesProb(a: { value: unknown; p: number; dist?: Record<string, number> }): { value: boolean; p: number } {
  if (a.dist && typeof a.dist.true === 'number') return { value: a.dist.true >= 0.5, p: a.dist.true };
  const v = a.value === true || a.value === 'true' || a.value === 'yes' || a.value === 'sí';
  return { value: v, p: v ? a.p : 1 - a.p };
}

/** Normaliza el resultado crudo del SDK a JevAnswers. */
export function normalize(result: unknown): JevAnswers {
  const r = (result ?? {}) as Raw;
  const answers = (r.answers ?? r.results ?? r) as Raw;
  const get = (k: string) => readAnswer(answers[k]);
  const program = get('program');
  return {
    ready: yesProb(get('ready')),
    program: { value: (program.value as JevAnswers['program']['value']) ?? 'otro', p: program.p, dist: program.dist },
    team: yesProb(get('team')),
    maturity: { value: (get('maturity').value as JevAnswers['maturity']['value']) ?? 'media', p: get('maturity').p },
    objection: { value: (get('objection').value as JevAnswers['objection']['value']) ?? 'otra', p: get('objection').p },
    channel: { value: (get('channel').value as JevAnswers['channel']['value']) ?? 'vendedor', p: get('channel').p },
  };
}
