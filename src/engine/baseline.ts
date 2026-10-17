// Latencia del LLM general de la línea base (data/baseline-llm.json), para no escribirla a mano en la página.
import baseline from '../../data/baseline-llm.json' with { type: 'json' };

const { media, p95 } = baseline.latenciaMs.llm;

/** "~2,1 s" (media del LLM general). */
export const LLM_MEAN = `~${(media / 1000).toLocaleString('es-CO', { maximumFractionDigits: 1 })} s`;
/** "más de 5 s" (5 % más lento del LLM general). */
export const LLM_P95 = `más de ${Math.floor(p95 / 1000)} s`;
/** "~2,1 s de media (más de 5 s en el 5 % más lento)". */
export const LLM_LATENCY = `${LLM_MEAN} de media (${LLM_P95} en el 5 % más lento)`;
