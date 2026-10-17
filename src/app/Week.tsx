'use client';
// Portada + "La semana de 30X" (docs/ux-negocio.md §2–3). Se renderiza en el servidor con el resultado final:
// cifras de weekMetrics (una sola fuente), nunca "…" ni ceros. "Repetir la semana" lleva los 300 puntos a las
// columnas de la regla y los hace viajar a las de Jev, escalonados según la latencia grabada de cada llamada.
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
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
  { key: 'nurturing', label: 'Seguir nutriendo' },
] as const;
const WITH_PROGRAM: Action[] = ['agenda_ya', 'otro_programa', 'empresas'];
const FEATURED = 'gerente_equipo_multinacional';
const RUN_MS = 3600;
const MOVE_MS = 700;

const SCENARIO_LABEL: Record<Scenario, string> = {
  pesimista: 'Pesimista',
  viable: 'Viable',
  optimista: 'Optimista',
};

// Franja "dónde vive Jev" (4 nodos; vertical en móvil).
const FLOW = (ms: number) => [
  { title: 'El lead envía el formulario de siempre', body: 'El mismo formulario de 30X; nada cambia para quien aplica.' },
  { title: `Jev decide en ~${ms} ms`, body: 'Antes de que cargue la página final: al terminar, el formulario redirige a una URL que llama a Jev (supuesto A). Un LLM general de 1,7–3 s no cabe ahí.', jev: true },
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
      g.idx.forEach((i, k) => { pos[i] = { x: c * colW + (k % per) * step, y: 52 + Math.floor(k / per) * step }; });
      maxRows = Math.max(maxRows, Math.ceil(g.idx.length / per));
    });
    return { pos, labels, height: 52 + maxRows * step };
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

export function Week({ data, metrics: m, onSelect }: { data: WeekData; metrics: WeekMetrics; onSelect: (id: string) => void }) {
  // En reposo se ve el resultado final (también en el HTML del servidor); "Repetir la semana" anima desde la regla.
  const [phase, setPhase] = useState<'antes' | 'corriendo' | 'listo'>('listo');
  const [elapsed, setElapsed] = useState(RUN_MS);
  const [scenario, setScenario] = useState<Scenario>('pesimista');
  const [width, setWidth] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const timer = useRef<number | undefined>(undefined);

  useLayoutEffect(() => {
    if (!box.current) return;
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

  /** Vuelve a la regla y repite la semana. Con movimiento reducido no hay viaje: muestra el resultado. */
  function replay() {
    window.clearTimeout(timer.current);
    if (reducedMotion()) return finish();
    setPhase('antes');
    setElapsed(0);
    timer.current = window.setTimeout(run, MOVE_MS + 250); // el ojo ve las 3 columnas grises antes del vuelo
  }

  function toggleBeforeAfter() {
    if (phase === 'corriendo') return;
    if (phase === 'listo') { setPhase('antes'); setElapsed(0); return; }
    if (reducedMotion()) finish(); else run();
  }

  // Durante el viaje, las cifras son las de los leads ya decididos; en reposo, las finales (las del servidor).
  const launched = phase === 'corriendo' ? rows.filter((_, i) => delays[i] <= elapsed - MOVE_MS / 2) : phase === 'listo' ? rows : [];
  const live = phase === 'listo' ? m : weekMetrics(launched);
  const featured = rows.findIndex((r) => r.archetype === FEATURED);

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
        <p className="faint">Respaldo (supuesto B): si el formulario no puede redirigir, Jev actúa por webhook en menos de 1 s; la página final no cambia, pero el primer contacto (agente de voz, WhatsApp o AE de empresas) sale en el primer minuto.</p>
        <p className="faint">En el piloto, Jev corre en modo sombra: decide y registra en HubSpot, pero no cambia lo que ve el lead.</p>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <a className="btn" href="#semana">Ver la semana de 30X →</a>
          <span className="faint">Datos sintéticos · decisiones de Jev grabadas de llamadas reales · prueba en vivo más abajo</span>
        </div>
      </section>

      <section className="block" aria-labelledby="semana">
        <div className="week-bar">
          <div className="block-head" style={{ marginBottom: 0 }}>
            <h2 id="semana">La semana de 30X</h2>
            <p className="muted">
              {moved
                ? `Los ${m.n} leads de una semana, decididos por Jev en una sola llamada cada uno. Los puntos azules son personas que la regla descartaba y reciben un siguiente paso comercial.`
                : `Así reparte hoy la regla de puntos a los ${m.n} leads: más de 6 de 10 pasa a entrevista; el resto ve "gracias" o abandonó el formulario.`}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn-ghost" onClick={toggleBeforeAfter} disabled={phase === 'corriendo'}>
              {phase === 'antes' ? 'Ver con Jev' : 'Ver antes (regla actual)'}
            </button>
            <button className="btn-ghost" onClick={replay} disabled={phase === 'corriendo'}>
              {phase === 'corriendo' ? `Decidiendo ${m.n} leads…` : '↻ Repetir la semana'}
            </button>
          </div>
        </div>

        <div className="tiles counters big" aria-live="polite" style={{ marginTop: 16 }}>
          <div className="tile"><span className="value">{live.b2b}</span><span className="label">oportunidades de empresa que la regla descartó</span></div>
          <div className="tile"><span className="value">{live.offers}</span><span className="label">personas descartadas que reciben la oferta de un programa de 30X</span></div>
          <div className="tile"><span className="value">{live.doubtfulInterviews}</span><span className="label">entrevistas protegidas: la regla las mandaba a un closer; Jev pide revisarlas antes</span></div>
        </div>

        <p className="ops-row">
          <span><strong className="num">{Math.round(m.autoNextStep * 100)} %</strong> recibe su siguiente paso sin intervención humana</span>
          <span><strong className="num">{m.abandonRescue}</strong> abandonos pasan a contacto ({m.abandonVoice} con llamada inmediata del agente de voz)</span>
          <span><strong className="num">{m.nurturing}</strong> siguen en nurturing</span>
          <span><strong className="num">{m.toPerson}</strong> revisa una persona</span>
        </p>

        <div className="card" style={{ marginTop: 12 }}>
          <div ref={box} className="dots" style={{ height: current?.height ?? 320 }}>
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
            {current && featured >= 0 && current.pos[featured] && (
              <button className="featured-tag" style={{ transform: `translate(${current.pos[featured].x + 12}px, ${current.pos[featured].y - 6}px)` }} onClick={() => onSelect(rows[featured].id)}>
                mira este →
              </button>
            )}
          </div>
          <div className="dots-legend">
            <span className="faint">Toca cualquier punto para inspeccionar ese lead abajo.</span>
            {moved && (
              <div className="legend-items">
                <span className="legend-item"><span className="legend-swatch" style={{ background: 'var(--jev)' }} />Descartado que recibe siguiente paso ({m.rescued})</span>
                <span className="legend-item"><span className="legend-swatch" style={{ background: 'var(--human)' }} />Lo revisa una persona ({m.toPerson})</span>
                <span className="legend-item"><span className="legend-swatch" style={{ background: 'var(--text-3)', opacity: 0.65 }} />Ya iba a entrevista o queda en nurturing</span>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gap: 16, marginTop: 16 }}>
          <p className="result-line">
            Decidir los {m.n} costó <strong>USD {fmt(m.costUsd, 2)}</strong> ({m.msMean} ms por lead). Pipeline de lista rescatado: del orden de <strong>USD {about(m.listPipelineWeek)}</strong> por semana, más {m.b2b} oportunidades de empresa.
          </p>
          <div className="card hero">
            <span className="faint">Ingreso incremental por mes si el equipo cierra una fracción de lo rescatado (supuesto)</span>
            <div className="scenario">
              <div role="radiogroup" aria-label="Escenario de tasa de cierre" className="segmented">
                {(Object.keys(SCENARIOS) as Scenario[]).map((k) => (
                  <button key={k} role="radio" aria-checked={scenario === k} className={scenario === k ? 'on' : ''} onClick={() => setScenario(k)}>
                    {SCENARIO_LABEL[k]}
                  </button>
                ))}
              </div>
            </div>
            <span className="value">del orden de USD {about(m.monthly[scenario])} / mes</span>
            <p className="muted">
              Cierre {SCENARIO_LABEL[scenario].toLowerCase()}: {pctTxt(SCENARIOS[scenario].otro_programa)} de las ofertas de otro programa y {pctTxt(SCENARIOS[scenario].empresas)} de las oportunidades de empresa.
              Ticket realizado: {pctTxt(REALIZED_SHARE)} del precio público; plan corporativo USD {fmt(CORPORATE_TICKET_USD)}. Las {m.offersWithoutPrice} ofertas de programas sin precio publicado no suman dólares.
            </p>
            <details>
              <summary>Desglose por programa</summary>
              <table>
                <thead><tr><th>Programa</th><th className="num">Personas</th><th className="num">Precio de lista</th><th className="num">Pipeline / semana</th></tr></thead>
                <tbody>
                  {m.byProgram.map((p) => (
                    <tr key={p.program}>
                      <td>{p.name}</td>
                      <td className="num">{p.leads}</td>
                      <td className="num">{p.priceUsd ? `USD ${fmt(p.priceUsd)}` : 'sin precio público'}</td>
                      <td className="num">{p.priceUsd ? `USD ${fmt(p.pipelineWeek)}` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
            <p className="faint">Todo es supuesto, conservador a propósito: no tenemos datos internos de 30X. Mezcla sintética de {m.n} leads por semana; en el piloto se mide con los leads reales. <a href={SUPUESTOS_URL} onClick={() => document.querySelector<HTMLDetailsElement>('#supuestos details')?.setAttribute('open', '')}>Ver los supuestos</a>.</p>
          </div>
        </div>
      </section>
    </>
  );
}
