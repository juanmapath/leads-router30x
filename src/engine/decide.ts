import { programName } from './programs.ts';
import type { Decision, JevAnswers, ProgramId } from './types.ts';

// Umbrales. Se ajustan con la gráfica de calibración (scripts/eval.ts), no a ojo.
export const THRESHOLDS = {
  team: 0.75, // P(sí es venta a empresa) para ir al área de empresas
  readyHigh: 0.8, // P(listo) para agendar ya
  readyLow: 0.5, // por debajo: nurturing
  program: 0.7, // confianza mínima en el programa sugerido
  channel: 0.6, // si el canal es menos seguro, se usa el canal por defecto de la acción
};

const UNCLEAR: ProgramId[] = ['ninguno', 'otro'];

const pct = (p: number) => `${Math.round(p * 100)} %`;

/**
 * Convierte las respuestas de Jev en una acción. Determinístico: mismas respuestas, misma acción.
 * Nota: ready.p y team.p son la probabilidad de "sí".
 */
export function decide(a: JevAnswers, t = THRESHOLDS): Decision {
  const reasons: string[] = [];
  const programClear = a.program.p >= t.program && !UNCLEAR.includes(a.program.value);

  if (a.team.value && a.team.p >= t.team) {
    reasons.push(`Oportunidad de equipo con ${pct(a.team.p)} de probabilidad.`);
    return { action: 'empresas', program: 'corporativo', channel: 'vendedor', needsHuman: false, reasons };
  }

  const readyYes = a.ready.p;
  reasons.push(`Listo para hablar con ventas: ${pct(readyYes)}.`);
  reasons.push(
    programClear
      ? `Programa sugerido: ${programName(a.program.value)} (${pct(a.program.p)}).`
      : `Programa poco claro (${programName(a.program.value)}, ${pct(a.program.p)}).`,
  );

  const channelFor = (fallback: Decision['channel']) => (a.channel.p >= t.channel ? a.channel.value : fallback);

  if (readyYes >= t.readyHigh && programClear) {
    return { action: 'agenda_ya', program: a.program.value, channel: channelFor('llamada_ia'), needsHuman: false, reasons };
  }

  // `ready` mide la conversación comercial del Inmersivo: un programa claro distinto se ofrece igual.
  if (programClear && a.program.value !== 'inmersivo') {
    reasons.push(`Le encaja otro programa, no el Inmersivo: se le ofrece ${programName(a.program.value)}.`);
    if (a.objection.value === 'precio') reasons.push('Objeción probable: precio. Ofrecer plan de pagos.');
    return { action: 'otro_programa', program: a.program.value, channel: channelFor('whatsapp'), needsHuman: false, reasons };
  }

  if (readyYes < t.readyLow && (programClear || a.program.value === 'ninguno')) {
    reasons.push('No está listo hoy: se nutre con contenido del programa que le encaja.');
    return { action: 'nurturing', program: a.program.value, channel: 'contenido', needsHuman: false, reasons };
  }

  reasons.push('Caso dudoso: lo revisa una persona.');
  return { action: 'cola_humana', program: a.program.value, channel: 'vendedor', needsHuman: true, reasons };
}
