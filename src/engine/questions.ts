// Esquema de preguntas tipadas para Jev (ver PRD, sección "Esquema de preguntas").
// Preguntas simples; la combinación y los umbrales viven en decide.ts.

export type QuestionDef =
  | { key: string; type: 'boolean'; instructions: string }
  | { key: string; type: 'choice'; instructions: string; options: Record<string, string> }
  | { key: string; type: 'score'; instructions: string; levels: string[] };

export const QUESTIONS: QuestionDef[] = [
  {
    key: 'ready',
    type: 'boolean',
    instructions:
      '¿Esta persona está lista para una conversación comercial con 30X esta semana? Sí solo si muestra interés claro y tiene capacidad de decidir o pagar un programa.',
  },
  {
    key: 'program',
    type: 'choice',
    instructions: '¿Qué programa de 30X le encaja mejor hoy a esta persona, según su cargo, su empresa, su presupuesto y sus intereses?',
    options: {
      inmersivo: 'Inmersivo presencial de 3 días (USD 6.000): founders, CEOs y C-level con empresa en crecimiento y presupuesto',
      ai_executives: 'AI for Executives (online): ejecutivos que lideran la adopción de IA en su empresa',
      ai_developers: 'AI for Developers (online, USD 2.000): perfiles técnicos que quieren construir agentes con código',
      ai_sales: 'AI Sales (online): founders y vendedores que quieren vender más con IA',
      sales_machine: 'Sales Machine (online, USD 1.990): founders B2B que necesitan un proceso comercial',
      growth_rockstar: 'Growth Rockstar (online): CMO, VP de marketing, head of growth y equipos de marketing y growth que quieren crecer con IA',
      fundraising: 'Fundraising School (online): founders preparando una ronda de inversión',
      corporativo: 'Plan corporativo: una empresa que quiere formar a un equipo',
      ninguno: 'Ninguno por ahora: no encaja o no tiene interés real',
      otro: 'Otro: no es claro, mejor que decida una persona',
    },
  },
  {
    key: 'team',
    type: 'boolean',
    instructions: '¿Es una oportunidad para formar a un equipo de varias personas de la misma empresa (venta a empresa), no solo a una persona?',
  },
  {
    key: 'coherent',
    type: 'boolean',
    instructions:
      '¿Las respuestas del formulario son coherentes entre sí y creíbles? Sí solo si el cargo escrito corresponde al cargo elegido, la facturación y la inversión cuadran con el perfil y no hay respuestas de relleno o en broma. Si no llenó el formulario, responde no.',
  },
  {
    key: 'maturity',
    type: 'score',
    instructions: '¿Qué tan madura está la empresa de esta persona en la adopción de inteligencia artificial?',
    levels: ['baja', 'media', 'alta'],
  },
  {
    key: 'objection',
    type: 'choice',
    instructions: '¿Cuál es la objeción más probable de esta persona para comprar un programa de 30X?',
    options: {
      precio: 'Precio o presupuesto',
      tiempo: 'Falta de tiempo',
      decisor: 'No es quien decide la compra',
      relevancia: 'No ve claro que le sirva',
      ninguna: 'Ninguna clara',
      otra: 'Otra',
    },
  },
  {
    key: 'channel',
    type: 'choice',
    instructions: '¿Por qué canal conviene hacer el primer contacto con esta persona?',
    options: {
      llamada_ia: 'Llamada inmediata con agente de voz (está caliente y dejó su teléfono)',
      whatsapp: 'Mensaje de WhatsApp',
      vendedor: 'Un vendedor humano (cuenta grande o caso delicado)',
      contenido: 'Solo contenido y nurturing por ahora',
    },
  },
];

/** Guardrail que se evalúa sobre el mensaje antes de enviarlo (no sobre el lead). */
export const GUARDRAIL: QuestionDef = {
  key: 'safe',
  type: 'boolean',
  instructions:
    '¿Este mensaje es seguro para enviarlo a un prospecto de 30X: no promete descuentos ni resultados garantizados, no inventa precios ni programas, y tiene un tono respetuoso?',
};
