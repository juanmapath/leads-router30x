'use client';
// Un lead de cerca (docs/ui-plan.md, sección 2): la regla de puntos de 30X frente a Jev para el mismo lead.
import { useEffect, useState } from 'react';
import leads from '../../data/leads.json';
import { FEATURED_ARCHETYPES, SIM_KEYS, SIM_SIGNALS, type SimKey } from '../engine/simulator.ts';
import type { Lead } from '../engine/types.ts';
import { JevCard, type JevResult } from './JevCard.tsx';

const ROUTE_LABEL: Record<string, string> = { entrevista: 'Entrevista', gracias: '"Gracias por tu aplicación"', abandono: 'Abandonó (sin acción)' };
const POINTS_LABEL: Record<string, string> = { cargo: 'Cargo', facturacion: 'Facturación', inversion: 'Inversión USD 6.000', decisor: '¿Decide solo?' };

interface ZoomResult extends JevResult { legacy: { score: number; route: string; breakdown: Record<string, number> }; lead: { id: string; archetype?: string } }

export function Zoom({ selectedId }: { selectedId?: string | null }) {
  const all = leads as Lead[];
  const defaultId = all.find((l) => l.archetype === 'gerente_equipo_multinacional')?.id ?? all[0].id;
  const [id, setId] = useState(defaultId);
  const [res, setRes] = useState<ZoomResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sim, setSim] = useState<SimKey[]>([]);
  const [base, setBase] = useState<ZoomResult | null>(null);

  async function decide(leadId: string, simulate: SimKey[]) {
    const r = await fetch('/api/decide', { method: 'POST', body: JSON.stringify({ id: leadId, simulate }) }).catch(() => null);
    const body = r ? await r.json().catch(() => ({})) : {};
    if (!r || !r.ok) { setError(body.error ?? 'No se pudo decidir este lead.'); return null; }
    return body as ZoomResult;
  }

  async function load(leadId: string) {
    setId(leadId);
    setError(null);
    setSim([]);
    const body = await decide(leadId, []);
    setRes(body);
    setBase(body);
  }

  // Simulador de señales: misma persona, una señal nueva → Jev recalcula (antes → después).
  async function toggle(k: SimKey) {
    const next = sim.includes(k) ? sim.filter((x) => x !== k) : [...sim, k];
    setSim(next);
    setError(null);
    const body = next.length ? await decide(id, next) : base;
    if (body) setRes(body);
  }

  const featured = FEATURED_ARCHETYPES.map((a) => all.find((l) => l.archetype === a)).filter((l): l is Lead => !!l);
  const isFeatured = featured.some((l) => l.id === id);

  useEffect(() => { load(selectedId ?? defaultId); }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section className="block" aria-labelledby="zoom" id="zoom-section">
      <div className="block-head">
        <h2 id="zoom">Un lead de cerca</h2>
        <p className="muted">La misma persona, dos decisiones: la suma de puntos de hoy y Jev.</p>
      </div>
      <label className="faint" htmlFor="lead-select">Lead</label>
      <select id="lead-select" className="select" value={id} onChange={(e) => load(e.target.value)}>
        {all.map((l) => <option key={l.id} value={l.id}>{l.id} · {l.archetype?.replaceAll('_', ' ')} · {l.country}</option>)}
      </select>

      {error && <p className="card" style={{ marginTop: 12 }}>{error} En producción, este lead pasaría a una persona.</p>}
      {res && (
        <div className="grid-2" style={{ marginTop: 12 }}>
          <div className="card legacy-card">
            <span className="faint">Regla actual (suma de puntos del formulario)</span>
            <table>
              <tbody>
                {Object.entries(res.legacy.breakdown).map(([k, v]) => (
                  <tr key={k}><td>{POINTS_LABEL[k] ?? k}</td><td className="num">{v}</td></tr>
                ))}
              </tbody>
            </table>
            <p className="legacy-score"><span className="num">{res.legacy.score}/10</span> → {ROUTE_LABEL[res.legacy.route]}</p>
            <p className="faint">Más de 6 puntos pasa a entrevista; el resto ve &ldquo;gracias&rdquo;.</p>
          </div>
          <div className="card" style={{ display: 'grid', gap: 12, alignContent: 'start' }}>
            <div className="sim">
              <span className="faint">Llega una señal nueva y Jev recalcula:</span>
              <div className="chips">
                {SIM_KEYS.map((k) => (
                  <button key={k} className={`chip-btn${sim.includes(k) ? ' on' : ''}`} aria-pressed={sim.includes(k)} onClick={() => toggle(k)}>
                    {sim.includes(k) ? '✓ ' : '+ '}{SIM_SIGNALS[k].label}
                  </button>
                ))}
              </div>
              {!isFeatured && <span className="faint">En este lead la señal se decide en vivo. Pregrabados: {featured.map((l) => l.id).join(', ')}.</span>}
            </div>
            <JevCard result={res} prev={sim.length ? base : null} />
          </div>
        </div>
      )}
    </section>
  );
}
