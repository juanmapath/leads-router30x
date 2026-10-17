'use client';
// Versión mínima del comparador (viernes). El diseño final llega el sábado.
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

export default function Home() {
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
    <main style={{ maxWidth: 960, margin: '0 auto', padding: 24 }}>
      <h1 style={{ fontSize: 28, marginBottom: 4 }}>Jev Lead Router · 30X</h1>
      <p style={{ color: '#a1a1aa', marginTop: 0 }}>La regla de puntos actual frente a Jev, para el mismo lead.</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <select value={id} onChange={(e) => setId(e.target.value)} style={{ padding: 8, flex: 1, minWidth: 240 }}>
          {all.map((l) => (
            <option key={l.id} value={l.id}>
              {l.id} · {l.archetype} · {l.country}
            </option>
          ))}
        </select>
        <button onClick={run} disabled={busy} style={{ padding: '8px 16px', background: '#eeff8d', border: 0, fontWeight: 600 }}>
          {busy ? 'Decidiendo…' : 'Decidir'}
        </button>
      </div>
      {res && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginTop: 24 }}>
          <section style={{ border: '1px solid #3f3f46', borderRadius: 8, padding: 16 }}>
            <h2 style={{ fontSize: 16 }}>Regla actual</h2>
            <p style={{ fontSize: 32, margin: 0 }}>{res.legacy?.score}/10</p>
            <p>→ {res.legacy?.route === 'entrevista' ? 'Entrevista' : res.legacy?.route === 'abandono' ? 'Abandonó (sin acción)' : '"Gracias por tu aplicación"'}</p>
          </section>
          <section style={{ border: '2px solid #eeff8d', borderRadius: 8, padding: 16 }}>
            <h2 style={{ fontSize: 16 }}>Jev</h2>
            {res.error ? (
              <p>{res.error}</p>
            ) : (
              <>
                <p style={{ fontSize: 24, margin: 0 }}>{ACTION_LABEL[res.decision.action]}</p>
                <ul>{res.decision.reasons.map((r: string) => <li key={r}>{r}</li>)}</ul>
                <p style={{ color: '#a1a1aa', fontSize: 13 }}>
                  {res.jev.ms} ms · USD {res.jev.costUsd.toFixed(6)} · {res.jev.source}
                </p>
              </>
            )}
          </section>
        </div>
      )}
      {res?.state && (
        <details style={{ marginTop: 16, color: '#a1a1aa' }}>
          <summary>Estado que recibió Jev</summary>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{res.state}</pre>
        </details>
      )}
    </main>
  );
}
