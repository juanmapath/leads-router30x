'use client';
// "Pruébalo tú" (docs/historial/ui-plan.md, sección 3): el jurado escribe la razón o desafío y Jev decide en vivo.
// Los ejemplos están pregrabados como respaldo; lo escrito a mano va en vivo, con límite de llamadas.
import { useState } from 'react';
import { MAX_FREE_TEXT } from '../engine/state.ts';
import { TRY_EXAMPLES } from '../engine/try.ts';
import { ActionPreview } from './ActionPreview.tsx';
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
        <span className="eyebrow"><span className="eyebrow-dot" />Prueba interactiva en vivo</span>
        <h2 id="pruebalo">Escribe un lead. Jev decide en vivo.</h2>
        <p className="muted">Es el campo &ldquo;razón o desafío&rdquo; que el formulario de 30X ya pide y que hoy ninguna regla lee.</p>
      </div>
      <div className="step-grid-3">
        <div className="card" style={{ display: 'grid', gap: 10, alignContent: 'start' }}>
          <div className="step-head">
            <span className="step-badge step-legacy">1 · Escribe o elige un caso</span>
            <span className="faint num">{reason.length}/{MAX_FREE_TEXT}</span>
          </div>
          <label htmlFor="reason" className="faint">¿Cuál es la razón o desafío por la que aplicaste?</label>
          <textarea id="reason" className="textarea" rows={3} maxLength={MAX_FREE_TEXT} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ej.: Tengo una agencia de 12 personas y quiero vender más con IA." />
          <div className="try-row">
            <select className="select" aria-label="Cargo" value={role} onChange={(e) => setRole(e.target.value)}>{ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
            <select className="select" aria-label="Cupos" value={seats} onChange={(e) => setSeats(e.target.value)}>{SEATS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
          </div>
          <button className="btn" style={{ width: '100%', justifyContent: 'center' }} onClick={() => send()} disabled={busy || !reason.trim()}>
            {busy ? 'Decidiendo…' : 'Decidir con Jev →'}
          </button>
          <span className="faint">👆 O prueba un ejemplo en un clic:</span>
          <div className="chips">
            {TRY_EXAMPLES.map((e) => (
              <button key={e.label} className={`chip-btn${reason === e.reason ? ' on' : ''}`} onClick={() => { setReason(e.reason); setRole(''); setSeats(''); send(e.reason, '', ''); }}>{e.label}</button>
            ))}
          </div>
          <p className="faint">Sin nombre ni correo: Jev solo lee lo que escribes. Máximo 30 pruebas en vivo por hora.</p>
        </div>

        <div className="card card-jev" aria-live="polite" style={{ display: 'grid', gap: 10, alignContent: 'start' }}>
          <div className="step-head">
            <span className="step-badge step-jev">2 · Decisión de Jev</span>
          </div>
          {error && <p>{error}</p>}
          {!error && !res && (
            <div className="empty-step">
              <p className="muted">Escribe un desafío o haz clic en uno de los 3 ejemplos de la izquierda para ver la decisión de Jev, sus probabilidades y umbrales.</p>
            </div>
          )}
          {res && <JevCard result={res} />}
        </div>

        <div className="card action-col-jev" aria-live="polite" style={{ display: 'grid', gap: 10, alignContent: 'start' }}>
          {res ? (
            <ActionPreview result={res} stepLabel="3 · En el milisegundo siguiente" />
          ) : (
            <>
              <div className="step-head">
                <span className="step-badge step-brand">3 · En el milisegundo siguiente</span>
                <span className="mock-badge static">maqueta</span>
              </div>
              <div className="empty-step">
                <p className="muted">Aquí verás al instante qué pantalla recibe el lead y qué propiedades se escriben para el equipo en HubSpot.</p>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

