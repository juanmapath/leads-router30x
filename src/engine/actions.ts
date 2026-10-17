// Capa de acción (docs/historial/ux-negocio.md §4): qué ve el lead, qué mensaje recibe y qué le llega al equipo después
// de la decisión. Plantillas FIJAS por acción, programa y canal: nada generado por LLM (redacción con IA = fase 2).
// Regla: "Lo revisa una persona" nunca muestra una oferta; muestra "un asesor te escribe hoy".
import { CATEGORIES, PROGRAMS, programCategory, programName } from './programs.ts';
import type { Action, Channel, Decision, JevAnswers, ProgramId } from './types.ts';

export interface LeadView {
  /** calendario = agenda una llamada · oferta = programa concreto · seguimiento = mantener en contacto · asesor = lo revisa una persona. */
  kind: 'calendario' | 'oferta' | 'seguimiento' | 'asesor';
  title: string;
  body: string;
  cta?: string;
}
export interface FollowUp { channel: Channel; from: string; when: string; text: string }
export interface TeamView { assignee: string; review: boolean; properties: Array<[string, string]> }
export interface ActionPlan { lead: LeadView; followUp: FollowUp; team: TeamView }

type CatalogId = keyof typeof PROGRAMS;
const inCatalog = (p: ProgramId): p is CatalogId => p in PROGRAMS;
const ACTION_LABEL: Record<Action, string> = {
  agenda_ya: 'Agenda ya', otro_programa: 'Otro programa', empresas: 'Área de empresas', nurturing: 'Mantener en contacto', cola_humana: 'Lo revisa una persona',
};
const CHANNEL_LABEL: Record<Channel, string> = { llamada_ia: 'Llamada con agente de voz', whatsapp: 'WhatsApp', vendedor: 'Vendedor', contenido: 'Contenido por correo' };
const pct = (p: number) => `${Math.round(p * 100)} %`;

/** Lo que ve el lead en la página final, en vez de "Gracias por tu aplicación". */
function leadView(action: Action, program: ProgramId): LeadView {
  if (action === 'empresas') {
    return { kind: 'calendario', title: 'Agenda una llamada con el área de empresas de 30X', body: 'Cuéntanos cuántas personas de tu equipo quieres formar y armamos un plan corporativo a la medida.', cta: 'Ver horarios' };
  }
  if (action === 'agenda_ya' && inCatalog(program)) {
    return { kind: 'calendario', title: `Agenda tu llamada sobre ${PROGRAMS[program].name}`, body: 'Elige un horario de 20 minutos. Hablamos de tu empresa y de la próxima edición.', cta: 'Ver horarios' };
  }
  if (action === 'otro_programa' && inCatalog(program)) {
    const p = PROGRAMS[program];
    return { kind: 'oferta', title: `Por lo que nos contaste, ${p.name} encaja mejor contigo`, body: `${p.official} Formato: ${p.format}.`, cta: 'Ver el programa' };
  }
  if (action === 'nurturing') {
    const cat = programCategory(program);
    return {
      kind: 'seguimiento', title: 'Gracias por tu aplicación: te dejamos por dónde empezar',
      body: cat ? `Te enviaremos clases y recursos de ${CATEGORIES[cat].name} para que avances a tu ritmo.` : 'Te enviaremos las próximas clases gratis y recursos para que avances a tu ritmo.',
      cta: 'Ver las próximas clases gratis',
    };
  }
  // cola_humana, o una acción sin programa del catálogo: nunca una oferta.
  return { kind: 'asesor', title: 'Recibimos tu aplicación', body: 'Un asesor te escribe hoy para entender qué necesitas.' };
}

/** Primer contacto, por canal. Empresas: siempre WhatsApp del AE de empresas a los 2 minutos (el AE queda asignado). */
function followUp(action: Action, program: ProgramId, jevChannel: Channel): FollowUp {
  const channel: Channel = action === 'empresas' ? 'whatsapp' : jevChannel;
  const name = inCatalog(program) ? PROGRAMS[program].name : undefined;
  const offer = action !== 'cola_humana' && name !== undefined;
  const from = action === 'empresas' ? 'AE de empresas de 30X' : channel === 'llamada_ia' ? 'Agente de voz de 30X' : channel === 'vendedor' ? 'Asesor de 30X' : 'Equipo de 30X';
  const why = action === 'empresas'
    ? 'vi que quieres formar a tu equipo. ¿Te queda bien una llamada esta semana para ver cuántos cupos necesitas?'
    : action === 'agenda_ya' && offer ? `vi tu aplicación a ${name}. ¿Agendamos 20 minutos para conocer tu empresa?`
    : action === 'otro_programa' && offer ? `por lo que nos contaste, ${name} encaja con lo que buscas. ¿Te mando el temario y las fechas?`
    : action === 'nurturing' ? 'gracias por tu interés. Te iremos enviando clases y recursos para que avances a tu ritmo.'
    : 'recibimos tu aplicación. Te escribo hoy para entender qué necesitas.';
  const when = channel === 'llamada_ia' ? 'en el primer minuto' : channel === 'whatsapp' ? 'a los 2 minutos' : channel === 'vendedor' ? 'hoy' : 'hoy, por correo';
  return { channel, from, when, text: `Hola, soy del equipo de 30X: ${why}` };
}

/** A quién se asigna en el CRM. */
function assignee(action: Action, program: ProgramId): string {
  if (action === 'empresas') return 'AE de empresas';
  if (action === 'agenda_ya') return inCatalog(program) ? `Closer de ${PROGRAMS[program].name}` : 'SDR (cola de revisión)';
  if (action === 'otro_programa') { const c = programCategory(program); return c ? `Equipo de ${CATEGORIES[c].name}` : 'SDR (cola de revisión)'; }
  if (action === 'nurturing') return 'Automatización de marketing';
  return 'SDR (cola de revisión)';
}

/** Plan completo de acción para una decisión. `answers` agrega las probabilidades de Jev a las propiedades del CRM. */
export function actionPlan(d: Pick<Decision, 'action' | 'program' | 'channel' | 'needsHuman'>, answers?: JevAnswers): ActionPlan {
  const lead = leadView(d.action, d.program);
  const review = d.needsHuman || lead.kind === 'asesor';
  const properties: Array<[string, string]> = [
    ['jev_accion', ACTION_LABEL[d.action]],
    ['jev_programa', programName(d.program)],
  ];
  if (answers) {
    if (answers.category) properties.push(['jev_categoria', answers.category.value === 'ninguna' ? 'Ninguna' : CATEGORIES[answers.category.value].name]);
    properties.push(['jev_p_listo', pct(answers.ready.p)], ['jev_p_empresa', pct(answers.team.p)], ['jev_objecion', answers.objection.value]);
  }
  properties.push(['jev_canal', CHANNEL_LABEL[d.channel]], ['jev_revisar', review ? 'sí' : 'no']);
  return { lead, followUp: followUp(d.action, d.program, d.channel), team: { assignee: assignee(d.action, d.program), review, properties } };
}
