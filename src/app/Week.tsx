'use client';
// Portada + "La semana de 30X" (docs/historial/ux-negocio.md §2–3). Arranca en 'antes' (contadores en 0 y 250 puntos
// en las 3 columnas grises de la regla) para que al oprimir el botón principal ocurra el momento WOW en vivo.
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import weekLeads from '../../data/week-leads.json';
import { LLM_LATENCY } from '../engine/baseline.ts';
import { CORPORATE_TICKET_USD, REALIZED_SHARE, SCENARIOS, type Scenario } from '../engine/impact.ts';
import type { Action } from '../engine/types.ts';
import { weekMetrics, type WeekMetrics } from '../engine/week-metrics.ts';
import type { WeekRow } from '../engine/week.ts';

type Row = WeekRow;
export interface WeekData { n: number; costUsd: number; msMean: number; rows: Row[] }

const LEGACY_COLS = [
  { key: 'entrevista', label: 'Entrevista' },
  { key: 'gracias', label: '"Gracias por tu aplicación"' },
  { key: 'abandono', label: 'Abandonó (sin acción)' },
] as const;
const JEV_COLS = [
  { key: 'agenda_ya', label: 'Agenda ya' },
  { key: 'otro_programa', label: 'Otro programa' },
  { key: 'empresas', label: 'Área de empresas' },
  { key: 'cola_humana', label: 'Lo revisa una persona' },
  { key: 'nurturing', label: 'Mantener en contacto' },
] as const;
const WITH_PROGRAM: Action[] = ['agenda_ya', 'otro_programa', 'empresas'];
const FEATURED = 'gerente_equipo_multinacional';
const RUN_MS = 3400;
const MOVE_MS = 680;

const SCENARIO_LABEL: Record<Scenario, string> = {
  pesimista: 'Pesimista',
  viable: 'Viable',
  optimista: 'Optimista',
};

// Franja "dónde vive Jev" (4 nodos; vertical en móvil).
const FLOW = (ms: number) => [
  { title: 'El lead envía el formulario de siempre', body: 'El mismo formulario de 30X; nada cambia para quien aplica.' },
  { title: `Jev decide en ~${ms} ms`, body: `Antes de que cargue la página final: al terminar, el formulario redirige a una URL que llama a Jev (supuesto A). Un LLM general tarda ${LLM_LATENCY}: no cabe ahí.`, jev: true },
  { title: 'Lo que ve el lead', body: 'Calendario, la oferta de su programa o una página de seguimiento, en vez de "gracias".' },
  { title: 'Lo que recibe el equipo', body: 'Propiedades en HubSpot, llamada del agente de voz (Dapta) o WhatsApp.' },
];

const fmt = (v: number, d = 0) => v.toLocaleString('es-CO', { minimumFractionDigits: d, maximumFractionDigits: d });
/** Dólares de negocio: orden de magnitud (2 cifras significativas), nunca decimales. */
const about = (v: number) => { const step = 10 ** Math.max(0, Math.floor(Math.log10(Math.max(1, v))) - 1); return fmt(Math.round(v / step) * step); };
const pctTxt = (r: number) => `${fmt(r * 100, r * 100 % 1 ? 1 : 0)} %`;
const SUPUESTOS_URL = '#supuestos';

type Pos = { x: number; y: number };
interface Layout { pos: Pos[]; labels: Array<{ x: number; y: number; w: number; label: string; count: number }>; height: number }

/** Coloca los puntos en columnas (escritorio) o en filas (móvil). */
function layout(rows: Row[], cols: ReadonlyArray<{ key: string; label: string }>, keyOf: (r: Row) => string, width: number): Layout {
  const mobile = width < 640;
  const D = mobile ? 7 : 8, G = mobile ? 3 : 4, step = D + G;
  const groups = cols.map((c) => ({ ...c, idx: [] as number[] }));
  rows.forEach((r, i) => groups.find((g) => g.key === keyOf(r))?.idx.push(i));
  const pos: Pos[] = new Array(rows.length);
  const labels: Layout['labels'] = [];
  if (!mobile) {
    const colW = width / cols.length;
    const per = Math.max(1, Math.floor((colW - 16 + G) / step));
    let maxRows = 0;
    groups.forEach((g, c) => {
      labels.push({ x: c * colW, y: 0, w: colW - 8, label: g.label, count: g.idx.length });
      g.idx.forEach((i, k) => { pos[i] = { x: c * colW + (k % per) * step, y: 44 + Math.floor(k / per) * step }; });
      maxRows = Math.max(maxRows, Math.ceil(g.idx.length / per));
    });
    return { pos, labels, height: 44 + maxRows * step };
  }
  const per = Math.max(1, Math.floor((width + G) / step));
  let y = 0;
  for (const g of groups) {
    labels.push({ x: 0, y, w: width, label: g.label, count: g.idx.length });
    y += 24;
    g.idx.forEach((i, k) => { pos[i] = { x: (k % per) * step, y: y + Math.floor(k / per) * step }; });
    y += Math.max(1, Math.ceil(g.idx.length / per)) * step + 14;
  }
  return { pos, labels, height: y };
}

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function CursorIcon() {
  return (
    <svg className="cursor-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.5.5 0 0 0 .35-.85L6.35 2.85a.5.5 0 0 0-.85.36Z" />
    </svg>
  );
}

export function downloadSyntheticLeads() {
  const blob = new Blob([JSON.stringify(weekLeads, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'leads-sinteticos-semana-30x.json';
  a.click();
  URL.revokeObjectURL(url);
}

export function Week({ data, metrics: m, onSelect }: { data: WeekData; metrics: WeekMetrics; onSelect: (id: string) => void }) {
  // Al cargar la página empieza en 'antes' (contadores en 0 y puntos en las 3 columnas de la regla) para provocar el WOW al hacer clic.
  const [phase, setPhase] = useState<'antes' | 'corriendo' | 'listo'>('antes');
  const [elapsed, setElapsed] = useState(0);
  const [scenario, setScenario] = useState<Scenario>('pesimista');
  const [showData, setShowData] = useState(false);
  const [width, setWidth] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const timer = useRef<number | undefined>(undefined);

  useLayoutEffect(() => {
    if (!box.current) return;
    setWidth(Math.floor(box.current.clientWidth));
    const ro = new ResizeObserver(([e]) => setWidth(Math.floor(e.contentRect.width)));
    ro.observe(box.current);
    return () => ro.disconnect();
  }, []);

  // Orden estable: por columna de la regla y, dentro, por id. Retraso de cada punto según su latencia grabada.
  const rows = useMemo(() => [...data.rows].sort((a, b) => a.legacy.localeCompare(b.legacy) || a.id.localeCompare(b.id)), [data]);
  const delays = useMemo(() => {
    const order = rows.map((r, i) => [r.ms, i] as const).sort((a, b) => a[0] - b[0]);
    const d = new Array(rows.length).fill(0);
    order.forEach(([, i], rank) => { d[i] = (rank / Math.max(1, rows.length - 1)) * (RUN_MS - MOVE_MS); });
    return d as number[];
  }, [rows]);

  const before = useMemo(() => (width ? layout(rows, LEGACY_COLS, (r) => r.legacy, width) : null), [rows, width]);
  const after = useMemo(() => (width ? layout(rows, JEV_COLS, (r) => r.action, width) : null), [rows, width]);
  const moved = phase !== 'antes';
  const current = moved ? after : before;

  function finish() { setPhase('listo'); setElapsed(RUN_MS); }

  function run() {
    if (reducedMotion()) return finish();
    setElapsed(0);
    setPhase('corriendo');
    const t0 = performance.now();
    const tick = (t: number) => {
      const e = t - t0;
      setElapsed(Math.min(e, RUN_MS));
      if (e < RUN_MS) requestAnimationFrame(tick); else setPhase('listo');
    };
    requestAnimationFrame(tick);
  }

  /** Desde la portada: baja a la sección completa (no al título) y arranca solo cuando el scroll terminó. */
  function runFromCover() {
    window.clearTimeout(timer.current);
    if (phase !== 'antes') { setPhase('antes'); setElapsed(0); }
    const section = document.getElementById('semana')?.closest('section');
    if (!section) return run();
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      window.removeEventListener('scrollend', start);
      timer.current = window.setTimeout(run, 250);
    };
    window.addEventListener('scrollend', start, { once: true });
    timer.current = window.setTimeout(start, 1100); // respaldo si el navegador no emite scrollend
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /** Vuelve a la regla (contadores en 0); el botón principal reaparece y arranca la animación de inmediato. */
  function reset() {
    if (phase === 'corriendo') return;
    window.clearTimeout(timer.current);
    setPhase('antes');
    setElapsed(0);
  }

  // En 'antes' todo está en 0; durante el viaje suben las cifras de los leads ya decididos; en 'listo' quedan las finales.
  const launched = phase === 'corriendo' ? rows.filter((_, i) => delays[i] <= elapsed - MOVE_MS / 2) : phase === 'listo' ? rows : [];
  const live = phase === 'listo' ? m : weekMetrics(launched);
  const featured = rows.findIndex((r) => r.archetype === FEATURED);
  const sampleLeads = (weekLeads.leads ?? []).slice(0, 6);

  return (
    <>
      <section className="block cover" aria-labelledby="portada">
        <span className="eyebrow"><span className="eyebrow-dot" />Jev Lead Router · para 30X</span>
        <h1 id="portada">
          Cada semana, el formulario de 30X descarta en automático a <span className="num highlight">{m.discarded}</span> de <span className="num">{m.n}</span> personas.
          Entre ellas, <span className="num highlight">{m.b2b} empresas</span> que venían a formar a su equipo.
        </h1>
        <p className="lead">
          Con un solo producto de USD 6.000, una barra de 7 puntos funcionaba. Con 17 programas y clientes corporativos, subirla quema oportunidades y bajarla llena la agenda de los closers de curiosos. Jev no pone una barra: decide qué hacer con cada lead.
        </p>
        <ol className="flow" aria-label="Dónde vive Jev">
          {FLOW(m.msMean).map((f, i) => (
            <li key={f.title} className={`flow-node${f.jev ? ' flow-jev' : ''}`}>
              <span className="flow-step num">{i + 1}</span>
              <strong>{f.title}</strong>
              <span className="faint">{f.body}</span>
            </li>
          ))}
        </ol>
        <p className="faint">Respaldo (supuesto B): si el formulario no puede redirigir, Jev actúa por webhook en menos de 1 s; la página final no cambia, pero el primer contacto (agente de voz, WhatsApp o AE de empresas) sale en el primer minuto. En el piloto corre en modo sombra.</p>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-cta-pulse" onClick={runFromCover}>
            <CursorIcon /> Clasificar los leads de una semana con Jev →
          </button>
          <button className="btn-ghost" onClick={() => setShowData((v) => !v)}>
            {showData ? 'Ocultar muestra de datos' : `👁 Ver datos sintéticos (${m.n})`}
          </button>
          <button className="btn-ghost" onClick={downloadSyntheticLeads}>
            ⬇ Descargar JSON
          </button>
        </div>
        {showData && (
          <div className="card data-drawer">
            <div className="week-bar" style={{ marginBottom: 8 }}>
              <div>
                <strong>Muestra de `data/week-leads.json` ({m.n} leads 100 % sintéticos)</strong>
                <p className="faint">Correos `@ejemplo.test`, sin datos reales. Incluye respuestas del formulario, señales de Luma/WhatsApp y envíos parciales.</p>
              </div>
              <button className="btn-ghost" onClick={downloadSyntheticLeads}>⬇ Descargar los {m.n} leads (.json)</button>
            </div>
            <pre className="state" style={{ maxHeight: 190, overflow: 'auto', margin: 0 }}>{JSON.stringify(sampleLeads, null, 2)}</pre>
          </div>
        )}
      </section>

      <section className="block" aria-labelledby="semana">
        <div className="week-bar">
          <div className="block-head" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h2 id="semana">La semana de 30X</h2>
              <span className={`status-pill ${phase === 'antes' ? 'status-before' : 'status-after'}`}>
                {phase === 'antes' ? 'Estado actual: Regla de puntos (sin Jev)' : phase === 'corriendo' ? 'Jev decidiendo en paralelo…' : 'Con Jev Lead Router activo'}
              </span>
            </div>
            <p className="muted">
              {moved
                ? `Los ${m.n} leads decididos por Jev en una sola llamada cada uno (~${m.msMean} ms). Los puntos lima son personas que la regla descartaba y ahora reciben un siguiente paso comercial.`
                : `Así reparte hoy la regla de puntos a los ${m.n} leads: más de 6 de 10 pasa a entrevista; el resto (${m.discarded}) ve "gracias" o abandonó el formulario.`}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {phase === 'antes' ? (
              <button className="btn btn-cta-pulse" onClick={run}>
                <CursorIcon /> Pasar los {m.n} leads por Jev
              </button>
            ) : (
              <button className="btn-ghost" onClick={reset} disabled={phase === 'corriendo'}>
                {phase === 'corriendo' ? `Decidiendo ${m.n} leads…` : '↺ Reiniciar'}
              </button>
            )}
            <button className="btn-ghost" onClick={downloadSyntheticLeads} title={`Descargar los ${m.n} leads sintéticos en JSON`}>
              ⬇ Datos sintéticos ({m.n})
            </button>
          </div>
        </div>

        <div className="tiles counters big" aria-live="polite" style={{ marginTop: 12 }}>
          <div className={`tile ${moved ? 'tile-brand' : 'tile-zero'}`}>
            <span className="value">{live.b2b}</span>
            <span className="label">oportunidades de empresa rescatadas por Jev</span>
          </div>
          <div className={`tile ${moved ? 'tile-jev' : 'tile-zero'}`}>
            <span className="value">{live.offers}</span>
            <span className="label">personas descartadas que reciben oferta de otro programa</span>
          </div>
          <div className={`tile ${moved ? 'tile-good' : 'tile-zero'}`}>
            <span className="value">{live.doubtfulInterviews}</span>
            <span className="label">entrevistas dudosas filtradas antes de quitar tiempo a un closer</span>
          </div>
        </div>

        <p className="ops-row">
          <span><strong className="num">{moved ? Math.round(live.autoNextStep * 100) : 0} %</strong> recibe su siguiente paso sin intervención humana</span>
          <span><strong className="num">{live.abandonRescue}</strong> abandonos pasan a contacto ({live.abandonVoice} con llamada inmediata del agente de voz)</span>
          <span><strong className="num">{live.nurturing}</strong> se mantienen en contacto (les enviamos contenido de su tema)</span>
          <span><strong className="num">{live.toPerson}</strong> revisa una persona</span>
        </p>

        <div className="card" style={{ marginTop: 10 }}>
          <div ref={box} className="dots" style={{ height: current?.height ?? 260 }}>
            {current?.labels.map((l) => (
              <div key={l.label} className="dots-label" style={{ left: l.x, top: l.y, width: l.w }}>
                <span>{l.label}</span> <strong className="num">{phase === 'corriendo' ? '' : l.count}</strong>
              </div>
            ))}
            {current && rows.map((r, i) => {
              const p = current.pos[i];
              if (!p) return null;
              const rescuedWithProgram = moved && r.legacy !== 'entrevista' && WITH_PROGRAM.includes(r.action);
              const goesToHuman = moved && r.action === 'cola_humana';
              const dotClass = rescuedWithProgram ? ' dot-jev' : goesToHuman ? ' dot-human' : moved ? ' dot-kept' : '';
              return (
                <span
                  key={r.id}
                  className={`dot${dotClass}${i === featured ? ' dot-featured' : ''}`}
                  style={{ transform: `translate(${p.x}px, ${p.y}px)`, transitionDelay: phase === 'corriendo' ? `${delays[i]}ms` : '0ms' }}
                  title={`${r.id}: ${moved ? JEV_COLS.find((c) => c.key === r.action)?.label : LEGACY_COLS.find((c) => c.key === r.legacy)?.label}`}
                  onClick={() => onSelect(r.id)}
                />
              );
            })}
            {phase === 'listo' && current && featured >= 0 && current.pos[featured] && (
              <button className="featured-tag" style={{ transform: `translate(${current.pos[featured].x + 12}px, ${current.pos[featured].y - 6}px)` }} onClick={() => onSelect(rows[featured].id)}>
                mira este →
              </button>
            )}
          </div>
          <div className="dots-legend">
            <span className="faint">
              {phase === 'antes'
                ? '👆 Oprime «Pasar los 250 leads por Jev» arriba para ver cómo se reclasifica la semana en milisegundos, o toca cualquier punto.'
                : 'Toca cualquier punto para inspeccionar ese lead de cerca.'}
            </span>
            {moved && (
              <div className="legend-items">
                <span className="legend-item"><span className="legend-swatch" style={{ background: 'var(--jev)' }} />Descartado que recibe siguiente paso ({m.rescued})</span>
                <span className="legend-item"><span className="legend-swatch" style={{ background: 'var(--human)' }} />Lo revisa una persona ({m.toPerson})</span>
                <span className="legend-item"><span className="legend-swatch" style={{ background: 'var(--text-3)', opacity: 0.65 }} />Ya iba a entrevista o se mantiene en contacto</span>
              </div>
            )}
          </div>
        </div>

        <div className="week-bottom-grid" style={{ marginTop: 12 }}>
          <div className="card hero">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span className="faint">Ingreso incremental por mes si el equipo cierra una fracción de lo rescatado (supuesto)</span>
              <div role="radiogroup" aria-label="Escenario de tasa de cierre" className="segmented">
                {(Object.keys(SCENARIOS) as Scenario[]).map((k) => (
                  <button key={k} role="radio" aria-checked={scenario === k} className={scenario === k ? 'on' : ''} onClick={() => setScenario(k)}>
                    {SCENARIO_LABEL[k]}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' }}>
              <span className="value">{moved ? `del orden de USD ${about(m.monthly[scenario])} / mes` : 'USD 0 / mes (sin Jev)'}</span>
              <span className="muted" style={{ fontSize: 14 }}>
                {moved
                  ? `Decidir los ${m.n} costó USD ${fmt(m.costUsd, 2)} (${m.msMean} ms/lead) · Pipeline semanal rescatado: ~USD ${about(m.listPipelineWeek)} + ${m.b2b} empresas`
                  : 'Oprime «Pasar los 250 leads por Jev» para calcular el pipeline rescatado.'}
              </span>
            </div>
            <p className="faint">
              Cierre {SCENARIO_LABEL[scenario].toLowerCase()}: {pctTxt(SCENARIOS[scenario].otro_programa)} en otro programa y {pctTxt(SCENARIOS[scenario].empresas)} en empresas (ticket realizado {pctTxt(REALIZED_SHARE)}; corporativo USD {fmt(CORPORATE_TICKET_USD)}).{' '}
              <a href={SUPUESTOS_URL} onClick={() => document.querySelector<HTMLDetailsElement>('#supuestos details')?.setAttribute('open', '')}>Ver supuestos y desglose</a>.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

