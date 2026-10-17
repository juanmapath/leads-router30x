import { NextResponse } from 'next/server';
import leads from '../../../../data/leads.json';
import weekLeads from '../../../../data/week-leads.json';
import { askJev, hasRecording } from '../../../engine/jev-client.ts';
import { buildState } from '../../../engine/state.ts';
import { decideForLead } from '../../../engine/decide.ts';
import { legacyRoute } from '../../../engine/legacy.ts';
import { simSignals } from '../../../engine/simulator.ts';
import { clientIp, liveLimiter } from '../live-limiter.ts';
import type { Lead, Signal } from '../../../engine/types.ts';

export const runtime = 'nodejs';

// Señales que llegan del cliente: solo tipos conocidos, texto corto y como máximo 5.
// Evita estados enormes (costo) y reduce la superficie de prompt injection.
const SIGNAL_TYPES: Signal['type'][] = ['luma_event', 'whatsapp_reply', 'email_open', 'form_abandoned', 'video_watched'];
const MAX_TEXT = 300;

function sanitizeSignals(raw: unknown): Signal[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((s): s is Signal => !!s && typeof s === 'object' && SIGNAL_TYPES.includes((s as Signal).type))
    .slice(0, 5)
    .map((s) => ({
      type: s.type,
      at: typeof s.at === 'string' ? s.at.slice(0, 40) : new Date().toISOString(),
      ...(typeof s.text === 'string' ? { text: s.text.replace(/\s+/g, ' ').trim().slice(0, MAX_TEXT) } : {}),
    }));
}

// POST { id, simulate?, extraSignals? } → la regla actual y la decisión de Jev, lado a lado.
// simulate: claves del simulador del demo (textos fijos, pregrabados); extraSignals: señales libres.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { id?: string; simulate?: unknown; extraSignals?: Signal[] };
  // Leads del zoom (L###, con el simulador pregrabado) y de la semana del demo (W###).
  const base = (leads as Lead[]).find((l) => l.id === body.id) ?? (weekLeads.leads as Lead[]).find((l) => l.id === body.id);
  if (!base) return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 });

  const extra = sanitizeSignals(body.extraSignals);
  const lead: Lead = { ...base, signals: [...base.signals, ...simSignals(body.simulate), ...extra].slice(0, 8) };
  const state = buildState(lead);

  if (!hasRecording(state)) {
    const gate = liveLimiter.check(clientIp(req));
    if (!gate.ok) {
      return NextResponse.json(
        { error: 'Se alcanzó el límite de pruebas en vivo con Jev. Intenta más tarde; en producción el lead pasaría a la cola humana.', retryAfterSec: gate.retryAfterSec, legacy: legacyRoute(lead), state },
        { status: 429, headers: { 'Retry-After': String(gate.retryAfterSec) } },
      );
    }
  }

  try {
    const call = await askJev(state);
    return NextResponse.json({
      lead: { id: lead.id, archetype: lead.archetype, country: lead.country, channel: lead.channel },
      state,
      legacy: legacyRoute(lead),
      jev: { answers: call.answers, ms: call.ms, costUsd: call.costUsd, source: call.source },
      decision: decideForLead(lead, call.answers),
    });
  } catch (err) {
    console.error('Jev falló', err);
    // Manejo de errores: si Jev falla, el lead va a una persona; nunca se pierde.
    return NextResponse.json(
      { error: 'Jev no respondió; el lead pasa a la cola humana.', legacy: legacyRoute(lead), state },
      { status: 502 },
    );
  }
}
