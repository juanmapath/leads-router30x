// Tipos compartidos del motor de decisión. Sin dependencias externas.

export type Role =
  | 'founder_ceo'
  | 'c_level'
  | 'gerente'
  | 'coordinador'
  | 'analista';

export type Revenue = 'mas_5m' | '1m_5m' | '500k_1m' | '200k_500k' | 'menos_200k';
export type Investment = 'listo' | 'plan_pagos' | 'imposible';
export type Decider = 'solo' | 'compartido' | 'otro';
export type Seats = 'solo' | '2_4' | '5_mas';

/** Respuestas del formulario público de 30X (form.30x.com). Campos ausentes = no respondió. */
export interface FormAnswers {
  name: string;
  email: string;
  whatsappCountry: string;
  company?: string;
  role?: Role;
  /** "¿Cuál es la razón o desafío por la que aplicaste?" (texto libre del formulario; dato no confiable). */
  reason?: string;
  /** Cargo como lo escribiría la persona (texto libre), si lo tenemos. */
  roleText?: string;
  revenue?: Revenue;
  investment?: Investment;
  decider?: Decider;
  seats?: Seats;
  edition?: string;
}

export interface Utm {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
}

export interface Signal {
  type: 'luma_event' | 'whatsapp_reply' | 'email_open' | 'form_abandoned' | 'video_watched';
  at: string; // ISO
  text?: string;
}

export interface Lead {
  id: string;
  country: string;
  channel: 'linkedin' | 'instagram' | 'youtube' | 'meta_ads' | 'google_ads' | 'luma' | 'web';
  utm: Utm;
  /** Título de la pieza de contenido que lo trajo, si se conoce. */
  sourceContent?: string;
  form: FormAnswers;
  /** true si dejó el formulario a mitad (envío parcial). */
  partial: boolean;
  signals: Signal[];
  /** Arquetipo con el que se generó (solo para datos sintéticos y evaluación). */
  archetype?: string;
}

/** Ids oficiales del catálogo de 30X (Diagnóstico 30X) + Raise Your Round. Ver programs.ts. */
export type ProgramId =
  | 'inmersion'
  | 'ai_exec'
  | 'ai_dev'
  | 'ops_ai'
  | 'second_brain'
  | 'sales_machine'
  | 'ai_sales'
  | 'linkedin_sales'
  | 'growth_rockstar'
  | 'advanced_strategy'
  | 'xtreme_growth'
  | 'ig_tiktok'
  | 'fundraising'
  | 'raise_your_round'
  | 'product_rockstar'
  | 'corporativos'
  | 'multipliers'
  | 'ninguno'
  | 'otro';

export type CategoryAnswer = 'presencial' | 'ia' | 'ventas' | 'growth' | 'startups' | 'empresas' | 'ninguna';

export type Channel = 'llamada_ia' | 'whatsapp' | 'vendedor' | 'contenido';
export type Objection = 'precio' | 'tiempo' | 'decisor' | 'relevancia' | 'ninguna' | 'otra';
export type Maturity = 'baja' | 'media' | 'alta';

/** Respuestas normalizadas de Jev: cada una con su probabilidad (0–1). */
export interface JevAnswers {
  ready: { value: boolean; p: number };
  program: { value: ProgramId; p: number; dist?: Record<string, number> };
  team: { value: boolean; p: number };
  maturity: { value: Maturity; p: number };
  objection: { value: Objection; p: number };
  channel: { value: Channel; p: number };
  /** Categoría del catálogo (misma estructura que el Diagnóstico 30X). Siempre presente en respuestas reales; opcional en pruebas. */
  category?: { value: CategoryAnswer; p: number };
  /** P(el formulario es coherente y creíble). Siempre presente en respuestas reales (normalize); opcional en pruebas. */
  coherent?: { value: boolean; p: number };
}

export type Action =
  | 'agenda_ya'
  | 'otro_programa'
  | 'empresas'
  | 'nurturing'
  | 'cola_humana';

export interface Decision {
  action: Action;
  program: ProgramId;
  channel: Channel;
  needsHuman: boolean;
  reasons: string[];
  /** Categoría clara cuando el programa no lo es: el vendedor elige entre sus programas. */
  category?: CategoryAnswer;
}

export interface Expected {
  action: Action;
  program: ProgramId;
  team: boolean;
}
