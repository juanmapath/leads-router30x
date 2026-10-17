import { CATEGORIES, programCategory, programName, programsIn, type CategoryId } from './programs.ts';
import type { Decision, JevAnswers, Lead, ProgramId } from './types.ts';

// Umbrales por costo del error (decisión de producto, ver docs/playbook.md), no ajustados al set de prueba.
// Agendar a quien no debe es el error caro (tiempo de vendedor); ofrecer un programa online por WhatsApp
// es barato. Con programa < 0,6 nunca se actúa solo. La calibración del eval confirma que hay margen.
export const THRESHOLDS = {
  team: 0.75, // P(sí es venta a empresa) para ir al área de empresas
  readyHigh: 0.75, // P(listo) para agendar ya
  readyLow: 0.5, // por debajo: nurturing
  programAgenda: 0.7, // confianza mínima en el programa para agendar ya (error caro)
  programOther: 0.65, // confianza mínima para ofrecer otro programa (error barato)
  programMin: 0.6, // por debajo, siempre una persona (también para nurturing)
  channel: 0.6, // si el canal es menos seguro, se usa el canal por defecto de la acción
  coherent: 0.7, // P(formulario coherente y creíble) para agendar ya
  category: 0.65, // categoría clara: se exige que el programa sea de esa categoría
};

const UNCLEAR: ProgramId[] = ['ninguno', 'otro'];

const pct = (p: number) => `${Math.round(p * 100)} %`;

/**
 * Convierte las respuestas de Jev en una acción. Determinístico: mismas respuestas, misma acción.
 * Nota: ready.p y team.p son la probabilidad de "sí".
 */
export function decide(a: JevAnswers, t = THRESHOLDS): Decision {
  const reasons: string[] = [];
  // Categoría y programa van en la misma llamada (como el Diagnóstico 30X). Si la categoría es clara,
  // el programa tiene que pertenecer a ella; si no coinciden, el programa cuenta como poco claro.
  const category = a.category && a.category.value !== 'ninguna' && a.category.p >= t.category ? (a.category.value as CategoryId) : undefined;
  const programCat = programCategory(a.program.value);
  const mismatch = category !== undefined && programCat !== undefined && programCat !== category;
  const unclear = UNCLEAR.includes(a.program.value) || mismatch;
  const programClear = a.program.p >= t.programOther && !unclear;

  if (a.team.value && a.team.p >= t.team) {
    reasons.push(`Oportunidad de equipo con ${pct(a.team.p)} de probabilidad.`);
    return { action: 'empresas', program: 'corporativos', channel: 'vendedor', needsHuman: false, reasons };
  }
  if (mismatch) reasons.push(`La categoría (${CATEGORIES[category].name}) y el programa (${programName(a.program.value)}) no coinciden.`);

  const readyYes = a.ready.p;
  reasons.push(`Listo para hablar con ventas: ${pct(readyYes)}.`);
  reasons.push(
    programClear
      ? `Programa sugerido: ${programName(a.program.value)} (${pct(a.program.p)}).`
      : `Programa poco claro (${programName(a.program.value)}, ${pct(a.program.p)}).`,
  );

  const channelFor = (fallback: Decision['channel']) => (a.channel.p >= t.channel ? a.channel.value : fallback);

  if (readyYes >= t.readyHigh && a.program.p >= t.programAgenda && !unclear) {
    return { action: 'agenda_ya', program: a.program.value, channel: channelFor('llamada_ia'), needsHuman: false, reasons };
  }

  // `ready` mide la conversación comercial de la Inmersión: un programa claro distinto se ofrece igual.
  if (programClear && a.program.value !== 'inmersion') {
    reasons.push(`Le encaja otro programa, no la Inmersión: se le ofrece ${programName(a.program.value)}.`);
    if (a.objection.value === 'precio') reasons.push('Objeción probable: precio. Ofrecer plan de pagos.');
    return { action: 'otro_programa', program: a.program.value, channel: channelFor('whatsapp'), needsHuman: false, reasons };
  }

  const sinPrograma = a.program.value === 'ninguno' && a.program.p >= t.programMin;
  if (readyYes < t.readyLow && (programClear || sinPrograma)) {
    reasons.push('No está listo hoy: se nutre con contenido del programa que le encaja.');
    return { action: 'nurturing', program: a.program.value, channel: 'contenido', needsHuman: false, reasons };
  }

  if (category && !programClear) {
    reasons.push(`Jev ve la categoría ${CATEGORIES[category].name}, no el programa: el vendedor elige entre ${programsIn(category).map(programName).join(', ')}.`);
    return { action: 'cola_humana', program: a.program.value, channel: 'vendedor', needsHuman: true, reasons, category };
  }
  reasons.push('Caso dudoso: lo revisa una persona.');
  return { action: 'cola_humana', program: a.program.value, channel: 'vendedor', needsHuman: true, reasons };
}

/**
 * Decisión para un lead concreto: los umbrales de decide() más las reglas de código que dependen
 * de lo que sabemos del lead (no de Jev). Es la que usan la API, el eval y el demo.
 */
export function decideForLead(lead: Lead, a: JevAnswers, t = THRESHOLDS): Decision {
  const d = decide(a, t);

  // Agendar ya exige evidencia del formulario. El texto libre (cargo escrito, Luma, WhatsApp,
  // perfil) es dato no confiable: por sí solo nunca lleva a agenda_ya, diga lo que diga Jev.
  if (d.action === 'agenda_ya' && !formSupportsAgenda(lead)) {
    return {
      ...d, action: 'cola_humana', channel: 'vendedor', needsHuman: true,
      reasons: [...d.reasons, 'Jev lo ve listo, pero el formulario no lo respalda (cargo, inversión o envío incompleto): lo revisa una persona.'],
    };
  }

  // Abandonó el formulario: es la señal más caliente que tenemos. Nunca se nutre en silencio:
  // contacto rápido (llamada con agente de voz) y lo sigue una persona.
  const abandoned = lead.partial || lead.signals.some((s) => s.type === 'form_abandoned');
  if (d.action === 'nurturing' && abandoned) {
    return {
      ...d, action: 'cola_humana', channel: 'llamada_ia', needsHuman: true,
      reasons: [...d.reasons, 'Empezó a aplicar y abandonó el formulario: contacto rápido, no nurturing.'],
    };
  }

  // Sin formulario y con una sola señal (p. ej. solo la pregunta de Luma), un texto escrito no basta
  // para ofrecer un programa sin que lo mire una persona. Con una segunda señal, sí.
  if (d.action === 'otro_programa' && !hasForm(lead) && lead.signals.length < 2) {
    return {
      ...d, action: 'cola_humana', channel: 'vendedor', needsHuman: true,
      reasons: [...d.reasons, 'Solo tenemos un texto escrito por el lead, sin formulario: una persona confirma antes de ofrecer el programa.'],
    };
  }
  // Agendar ya también exige que Jev vea el formulario coherente y creíble (cargo escrito vs. elegido,
  // facturación e inversión que cuadran, nada de respuestas de relleno).
  if (d.action === 'agenda_ya' && a.coherent && a.coherent.p < t.coherent) {
    return {
      ...d, action: 'cola_humana', channel: 'vendedor', needsHuman: true,
      reasons: [...d.reasons, `El formulario no parece coherente (${pct(a.coherent.p)}): una persona lo confirma antes de agendar.`],
    };
  }
  return d;
}

/** Respondió al menos una pregunta de calificación del formulario. */
export function hasForm(lead: Lead): boolean {
  const f = lead.form;
  return Boolean(f.role || f.revenue || f.investment || f.decider);
}

/** Cargo de decisor elegido en el formulario, inversión posible y envío completo. */
export function formSupportsAgenda(lead: Lead): boolean {
  const f = lead.form;
  return !lead.partial
    && (f.role === 'founder_ceo' || f.role === 'c_level')
    && (f.investment === 'listo' || f.investment === 'plan_pagos');
}
