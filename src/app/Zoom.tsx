'use client';
// Un lead de cerca (docs/historial/ui-plan.md, sección 2): la regla de puntos de 30X frente a Jev para el mismo lead.
import { useEffect, useState } from 'react';
import leads from '../../data/leads.json';
import weekLeads from '../../data/week-leads.json';
import { FEATURED_ARCHETYPES, SIM_KEYS, SIM_SIGNALS, type SimKey } from '../engine/simulator.ts';
import type { Lead } from '../engine/types.ts';
import { ActionPreview } from './ActionPreview.tsx';
import { JevCard, type JevResult } from './JevCard.tsx';

const ROUTE_LABEL: Record<string, string> = { entrevista: 'Entrevista', gracias: '"Gracias por tu aplicación"', abandono: 'Abandonó (sin acción)' };
const POINTS_LABEL: Record<string, string> = { cargo: 'Cargo', facturacion: 'Facturación', inversion: 'Inversión USD 6.000', decisor: '¿Decide solo?' };
const ARCHETYPE_LABEL: Record<string, string> = {
  gerente_equipo_multinacional: 'Gerente en multinacional (5+ cupos)',
  solo_luma: 'Solo dejó pregunta en Luma',
  abandono_caliente: 'Abandonó a mitad del formulario',
  gerente_comercial: 'Gerente comercial (otro programa)',
  ceo_listo: 'CEO listo para Inmersión',
};

interface ZoomResult extends JevResult { legacy: { score: number; route: string; breakdown: Record<string, number> }; lead: { id: string; archetype?: string } }

export function Zoom({ selectedId }: { selectedId?: string | null }) {
  // Destacados (con el simulador pregrabado) de data/leads.json; el selector explora la semana del demo.
  const all = leads as Lead[];
  const week = weekLeads.leads as Lead[];
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
      <div className="week-bar" style={{ marginBottom: 10 }}>
        <div className="block-head" style={{ marginBottom: 0 }}>
          <span className="eyebrow"><span className="eyebrow-dot" />Inspección lead por lead</span>
          <h2 id="zoom">Un lead de cerca</h2>
          <p className="muted">La misma persona, paso a paso: la suma fija de puntos de hoy, la decisión calibrada de Jev y lo que se dispara al instante.</p>
        </div>
      </div>

      <div className="zoom-controls">
        <div className="archetypes" role="group" aria-label="Casos representativos">
          {featured.map((l) => (
            <button
              key={l.id}
              className={`chip-btn${l.id === id ? ' on' : ''}`}
              aria-pressed={l.id === id}
              onClick={() => load(l.id)}
            >
              {ARCHETYPE_LABEL[l.archetype ?? ''] ?? l.archetype?.replaceAll('_', ' ')}
            </button>
          ))}
        </div>
        <select id="lead-select" aria-label="Explorar los leads de la semana" className="select zoom-select" value={id} onChange={(e) => load(e.target.value)}>
          {[...featured, ...week].map((l) => <option key={l.id} value={l.id}>{l.id} · {ARCHETYPE_LABEL[l.archetype ?? ''] ?? l.archetype?.replaceAll('_', ' ')} · {l.country}</option>)}
        </select>
      </div>

      {error && <p className="card" style={{ marginTop: 12 }}>{error} En producción, este lead pasaría a una persona.</p>}
      {res && (
        <div className="step-grid-3" style={{ marginTop: 12 }}>
          <div className="card legacy-card action-col-legacy">
            <div className="step-head">
              <span className="step-badge step-legacy">1 · Regla actual</span>
              <span className={`status-tag ${res.legacy.route === 'entrevista' ? 'tag-good' : 'tag-critical'}`}>
                {res.legacy.score}/10 pts
              </span>
            </div>
            <table>
              <tbody>
                {Object.entries(res.legacy.breakdown).map(([k, v]) => (
                  <tr key={k}><td>{POINTS_LABEL[k] ?? k}</td><td className="num">{v}</td></tr>
                ))}
              </tbody>
            </table>
            <p className="legacy-score">
              <span className="num">{res.legacy.score}/10</span> → <span className={res.legacy.route !== 'entrevista' ? 'legacy-discarded' : ''}>{ROUTE_LABEL[res.legacy.route]}</span>
            </p>
            <p className="faint">Más de 6 puntos pasa a entrevista; con 6 o menos ve &ldquo;gracias&rdquo; y sale sin agenda.</p>
          </div>

          <div className="card card-jev" style={{ display: 'grid', gap: 10, alignContent: 'start' }}>
            <div className="step-head">
              <span className="step-badge step-jev">2 · Decisión de Jev</span>
            </div>
            <div className="sim">
              <span className="faint">Simula una señal nueva (recalcula al instante):</span>
              <div className="chips">
                {SIM_KEYS.map((k) => (
                  <button key={k} className={`chip-btn${sim.includes(k) ? ' on' : ''}`} aria-pressed={sim.includes(k)} onClick={() => toggle(k)}>
                    {sim.includes(k) ? '✓ ' : '+ '}{SIM_SIGNALS[k].label}
                  </button>
                ))}
              </div>
              {!isFeatured && <span className="faint">En este lead la señal se decide en vivo.</span>}
            </div>
            <JevCard result={res} prev={sim.length ? base : null} />
          </div>

          <div className="card action-col-jev">
            <ActionPreview result={res} prev={sim.length ? base : null} stepLabel="3 · En el milisegundo siguiente" />
          </div>
        </div>
      )}
    </section>
  );
}


