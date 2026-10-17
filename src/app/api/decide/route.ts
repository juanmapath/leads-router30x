import { NextResponse } from 'next/server';
import leads from '../../../../data/leads.json';
import { askJev } from '../../../engine/jev-client.ts';
import { buildState } from '../../../engine/state.ts';
import { decide } from '../../../engine/decide.ts';
import { legacyRoute } from '../../../engine/legacy.ts';
import type { Lead, Signal } from '../../../engine/types.ts';

export const runtime = 'nodejs';

// POST { id, extraSignals? } → la regla actual y la decisión de Jev, lado a lado.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { id?: string; extraSignals?: Signal[] };
  const base = (leads as Lead[]).find((l) => l.id === body.id);
  if (!base) return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 });

  const extra = Array.isArray(body.extraSignals) ? body.extraSignals.slice(0, 5) : [];
  const lead: Lead = { ...base, signals: [...base.signals, ...extra] };
  const state = buildState(lead);

  try {
    const call = await askJev(state);
    return NextResponse.json({
      lead: { id: lead.id, archetype: lead.archetype, country: lead.country, channel: lead.channel },
      state,
      legacy: legacyRoute(lead),
      jev: { answers: call.answers, ms: call.ms, costUsd: call.costUsd, source: call.source },
      decision: decide(call.answers),
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
