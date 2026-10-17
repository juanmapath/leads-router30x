import { NextResponse } from 'next/server';
import { decideForLead } from '../../../engine/decide.ts';
import { askJev, hasRecording } from '../../../engine/jev-client.ts';
import { buildState } from '../../../engine/state.ts';
import { buildTryLead } from '../../../engine/try.ts';
import { clientIp, liveLimiter } from '../live-limiter.ts';

export const runtime = 'nodejs';

// POST { reason, role?, seats? } → "Pruébalo tú": arma un lead sin nombre ni correo (el cliente nunca manda un
// estado), valida longitud y, si no hay grabación, llama a Jev en vivo con el límite de llamadas.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const lead = buildTryLead(body);
  if (!lead) return NextResponse.json({ error: 'Escribe entre 1 y 300 caracteres.' }, { status: 400 });
  const state = buildState(lead);

  if (!hasRecording(state)) {
    const gate = liveLimiter.check(clientIp(req));
    if (!gate.ok) {
      return NextResponse.json(
        { error: 'Se alcanzó el límite de pruebas en vivo. En producción, este lead pasaría a una persona.', retryAfterSec: gate.retryAfterSec },
        { status: 429, headers: { 'Retry-After': String(gate.retryAfterSec) } },
      );
    }
  }
  try {
    const call = await askJev(state);
    return NextResponse.json({ state, jev: { answers: call.answers, ms: call.ms, costUsd: call.costUsd, source: call.source }, decision: decideForLead(lead, call.answers) });
  } catch (err) {
    console.error('Jev falló', err);
    return NextResponse.json({ error: 'Jev no respondió. En producción, este lead pasaría a una persona.' }, { status: 502 });
  }
}
