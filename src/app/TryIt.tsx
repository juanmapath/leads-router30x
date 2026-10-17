'use client';
// "Pruébalo tú" (docs/ui-plan.md, sección 3): el jurado escribe la razón o desafío y Jev decide en vivo.
// Los ejemplos están pregrabados como respaldo; lo escrito a mano va en vivo, con límite de llamadas.
import { useState } from 'react';
import { MAX_FREE_TEXT } from '../engine/state.ts';
import { TRY_EXAMPLES } from '../engine/try.ts';
import { JevCard, type JevResult } from './JevCard.tsx';

const ROLES = [['', 'Cargo (opcional)'], ['founder_ceo', 'Socio, fundador o CEO'], ['c_level', 'Director, VP o C-level'], ['gerente', 'Gerente'], ['coordinador', 'Coordinador'], ['analista', 'Analista']];
const SEATS = [['', 'Cupos (opcional)'], ['solo', 'Solo yo'], ['2_4', '2 a 4 personas'], ['5_mas', '5 o más']];

export function TryIt() {
  const [reason, setReason] = useState('');
  const [role, setRole] = useState('');
  const [seats, setSeats] = useState('');
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<JevResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function send(text = reason, r = role, s = seats) {
    setBusy(true);
    setError(null);
    const resp = await fetch('/api/try', { method: 'POST', body: JSON.stringify({ reason: text, role: r || undefined, seats: s || undefined }) }).catch(() => null);
    const body = resp ? await resp.json().catch(() => ({})) : {};
    setBusy(false);
    if (!resp || !resp.ok) { setError(body.error ?? 'No se pudo decidir. En producción, este lead pasaría a una persona.'); setRes(null); return; }
    setRes(body);
  }

  return (
    <section className="block" aria-labelledby="pruebalo">
      <div className="block-head">
        <h2 id="pruebalo">Escribe un lead. Jev decide en vivo.</h2>
        <p className="muted">Es el campo &ldquo;razón o desafío&rdquo; que el formulario de 30X ya pide y que hoy ninguna regla lee.</p>
      </div>
      <div className="grid-2">
        <div className="card" style={{ display: 'grid', gap: 10, alignContent: 'start' }}>
          <label htmlFor="reason" className="faint">¿Cuál es la razón o desafío por la que aplicaste?</label>
          <textarea id="reason" className="textarea" rows={4} maxLength={MAX_FREE_TEXT} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ej.: Tengo una agencia de 12 personas y quiero vender más con IA." />
          <div className="try-row">
            <select className="select" aria-label="Cargo" value={role} onChange={(e) => setRole(e.target.value)}>{ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
            <select className="select" aria-label="Cupos" value={seats} onChange={(e) => setSeats(e.target.value)}>{SEATS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
          </div>
          <div className="try-row">
            <span className="faint num">{reason.length}/{MAX_FREE_TEXT}</span>
            <button className="btn" onClick={() => send()} disabled={busy || !reason.trim()}>{busy ? 'Decidiendo…' : 'Decidir con Jev'}</button>
          </div>
          <span className="faint">O prueba un ejemplo:</span>
          <div className="chips">
            {TRY_EXAMPLES.map((e) => (
              <button key={e.label} className="chip-btn" onClick={() => { setReason(e.reason); setRole(''); setSeats(''); send(e.reason, '', ''); }}>{e.label}</button>
            ))}
          </div>
          <p className="faint">Sin nombre ni correo: Jev solo lee lo que escribes. Máximo 30 pruebas en vivo por hora.</p>
        </div>
        <div className="card" aria-live="polite">
          {error && <p>{error}</p>}
          {!error && !res && <p className="muted">Aquí aparece la decisión de Jev, con sus probabilidades y los umbrales.</p>}
          {res && <JevCard result={res} />}
        </div>
      </div>
    </section>
  );
}
