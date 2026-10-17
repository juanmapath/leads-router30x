'use client';
// Zoom a un lead: la regla actual frente a Jev para el mismo lead. (Rediseño pendiente: paso siguiente de la UI.)
import { useState } from 'react';
import leads from '../../data/leads.json';
import type { Lead } from '../engine/types.ts';

const ACTION_LABEL: Record<string, string> = {
  agenda_ya: 'Agenda ya',
  otro_programa: 'Ofrecer otro programa',
  empresas: 'Área de empresas',
  nurturing: 'Nurturing',
  cola_humana: 'Cola humana',
};

export function Zoom() {
  const all = leads as Lead[];
  const [id, setId] = useState(all.find((l) => l.archetype === 'gerente_equipo_multinacional')?.id ?? all[0].id);
  const [res, setRes] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    setRes(null);
    const r = await fetch('/api/decide', { method: 'POST', body: JSON.stringify({ id }) });
    setRes(await r.json());
    setBusy(false);
  }

  return (
    <section className="block" aria-labelledby="zoom">
      <div className="block-head">
        <h2 id="zoom">Un lead de cerca</h2>
        <p className="muted">La regla de puntos actual frente a Jev, para el mismo lead.</p>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <select value={id} onChange={(e) => setId(e.target.value)} style={{ padding: 10, flex: 1, minWidth: 0, font: 'inherit', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}>
          {all.map((l) => (
            <option key={l.id} value={l.id}>
              {l.id} · {l.archetype} · {l.country}
            </option>
          ))}
        </select>
        <button onClick={run} disabled={busy} className="btn">
          {busy ? 'Decidiendo…' : 'Decidir'}
        </button>
      </div>
      {res && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginTop: 24 }}>
          <section className="card" style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
            <h2 style={{ fontSize: 16 }}>Regla actual</h2>
            <p style={{ fontSize: 32, margin: 0 }}>{res.legacy?.score}/10</p>
            <p>→ {res.legacy?.route === 'entrevista' ? 'Entrevista' : res.legacy?.route === 'abandono' ? 'Abandonó (sin acción)' : '"Gracias por tu aplicación"'}</p>
          </section>
          <section className="card" style={{ border: '2px solid var(--jev)', borderRadius: 8, padding: 16 }}>
            <h2 style={{ fontSize: 16 }}>Jev</h2>
            {res.error ? (
              <p>{res.error}</p>
            ) : (
              <>
                <p style={{ fontSize: 24, margin: 0 }}>{ACTION_LABEL[res.decision.action]}</p>
                <ul>{res.decision.reasons.map((r: string) => <li key={r}>{r}</li>)}</ul>
                <p style={{ color: 'var(--text-2)', fontSize: 13 }}>
                  {res.jev.ms} ms · USD {res.jev.costUsd.toFixed(6)} · {res.jev.source}
                </p>
              </>
            )}
          </section>
        </div>
      )}
      {res?.state && (
        <details style={{ marginTop: 16, color: 'var(--text-2)' }}>
          <summary>Estado que recibió Jev</summary>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{res.state}</pre>
        </details>
      )}
    </section>
  );
}
