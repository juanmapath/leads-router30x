'use client';
// Portada + "La semana de 30X" (docs/ui-plan.md, secciones 0 y 1). 300 puntos, uno por lead: antes del clic
// están en las columnas de la regla de puntos; al clic viajan a las columnas de Jev, escalonados según la
// latencia grabada de cada llamada (comprimida a ~4 s), mientras suben decisiones, costo y ms.
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { SCENARIOS, TICKETS, WEEKS_PER_MONTH, type Scenario } from '../engine/impact.ts';
import type { Action, ProgramId } from '../engine/types.ts';

interface Row { id: string; archetype?: string; legacy: 'entrevista' | 'gracias' | 'abandono'; action: Action; program: ProgramId; ms: number; costUsd: number }
interface WeekData { n: number; costUsd: number; msMean: number; rows: Row[] }

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

const fmt = (v: number, d = 0) => v.toLocaleString('es-CO', { minimumFractionDigits: d, maximumFractionDigits: d });

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

export function Week({ onSelect }: { onSelect: (id: string) => void }) {
  const [data, setData] = useState<WeekData | null>(null);
  const [error, setError] = useState(false);
  const [phase, setPhase] = useState<'antes' | 'corriendo' | 'listo'>('antes');
  const [elapsed, setElapsed] = useState(0);
  const [scenario, setScenario] = useState<Scenario>('viable');
  const [width, setWidth] = useState(0);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/week').then((r) => (r.ok ? r.json() : Promise.reject())).then(setData).catch(() => setError(true));
  }, []);
  useLayoutEffect(() => {
    if (!box.current) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.floor(e.contentRect.width)));
    ro.observe(box.current);
    return () => ro.disconnect();
  }, [data]);

  // Orden estable: por columna de la regla y, dentro, por id. Retraso de cada punto según su latencia grabada.
  const rows = useMemo(() => [...(data?.rows ?? [])].sort((a, b) => a.legacy.localeCompare(b.legacy) || a.id.localeCompare(b.id)), [data]);
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

  function run() {
    document.getElementById('semana')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setElapsed(RUN_MS); setPhase('listo'); return; }
    setPhase('corriendo');
    const t0 = performance.now();
    const tick = (t: number) => {
      const e = t - t0;
      setElapsed(Math.min(e, RUN_MS));
      if (e < RUN_MS) requestAnimationFrame(tick); else setPhase('listo');
    };
    requestAnimationFrame(tick);
  }

  // Contadores: lo decidido hasta ahora (puntos que ya salieron).
  const launched = rows.filter((_, i) => delays[i] <= elapsed - MOVE_MS / 2);
  const decided = phase === 'listo' ? rows.length : launched.length;
  const costSoFar = (phase === 'listo' ? rows : launched).reduce((a, r) => a + r.costUsd, 0);
  const msSoFar = (phase === 'listo' ? rows : launched).reduce((a, r) => a + r.ms, 0) / Math.max(1, (phase === 'listo' ? rows : launched).length);

  const n = rows.length || 300;
  const gracias = rows.filter((r) => r.legacy === 'gracias').length;
  const abandono = rows.filter((r) => r.legacy === 'abandono').length;
  const discarded = rows.filter((r) => r.legacy !== 'entrevista');
  const rescued = discarded.filter((r) => WITH_PROGRAM.includes(r.action));
  // Pipeline semanal que la regla descarta: SOLO precios públicos (dato). Lo demás se cuenta aparte.
  const priced = rescued.filter((r) => TICKETS[r.program] && !TICKETS[r.program].supuesto);
  const pipeline = priced.reduce((a, r) => a + TICKETS[r.program].usd, 0);
  const sinPrecio = rescued.length - priced.length;
  const monthly = pipeline * SCENARIOS[scenario] * WEEKS_PER_MONTH;
  const featured = rows.findIndex((r) => r.archetype === FEATURED);

  return (
    <>
      <section className="block cover" aria-labelledby="portada">
        <p className="faint">Jev Lead Router · para 30X</p>
        <h1 id="portada">
          Cada semana, la regla de puntos de 30X le dice &ldquo;gracias&rdquo; a <span className="num">{data ? gracias : '…'}</span> de <span className="num">{n}</span> personas.
        </h1>
        <p className="lead">Jev Lead Router decide en milisegundos qué hacer con cada una. Los casos dudosos siempre pasan a una persona.</p>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="btn" onClick={run} disabled={!data || phase !== 'antes'}>
            {data ? (phase === 'antes' ? 'Pasar la semana por Jev' : phase === 'corriendo' ? 'Decidiendo…' : 'Semana decidida') : error ? 'No se pudo cargar la semana' : 'Cargando la semana…'}
          </button>
          <span className="faint">Datos sintéticos · decisiones de Jev grabadas de llamadas reales · prueba en vivo más abajo</span>
        </div>
      </section>

      <section className="block" aria-labelledby="semana">
        <div className="block-head">
          <h2 id="semana">La semana de 30X</h2>
          <p className="muted">
            {moved ? 'Jev decidió cada lead en una llamada. Los puntos azules son los que la regla había descartado.' : `Así reparte hoy la regla de puntos a los ${n} leads de una semana: más de 6 de 10 pasa a entrevista; el resto ve "gracias" (${abandono} abandonaron el formulario).`}
          </p>
        </div>

        <div className="tiles counters" aria-live="polite">
          <div className="tile"><span className="value">{fmt(decided)}</span><span className="label">decisiones de Jev</span></div>
          <div className="tile"><span className="value">USD {fmt(costSoFar, 4)}</span><span className="label">costo acumulado</span></div>
          <div className="tile"><span className="value">{decided ? fmt(msSoFar) : 0} ms</span><span className="label">por decisión, en promedio</span></div>
        </div>

        <div className="card" style={{ marginTop: 12 }}>
          <div ref={box} className="dots" style={{ height: current?.height ?? 320 }}>
            {current?.labels.map((l) => (
              <div key={l.label} className="dots-label" style={{ left: l.x, top: l.y, width: l.w }}>
                <span>{l.label}</span> <strong className="num">{moved && phase === 'corriendo' ? '' : l.count}</strong>
              </div>
            ))}
            {current && rows.map((r, i) => {
              const p = current.pos[i];
              if (!p) return null;
              const rescuedDot = moved && r.legacy !== 'entrevista';
              return (
                <span
                  key={r.id}
                  className={`dot${rescuedDot ? ' dot-jev' : moved ? ' dot-kept' : ''}${i === featured ? ' dot-featured' : ''}`}
                  style={{ transform: `translate(${p.x}px, ${p.y}px)`, transitionDelay: moved && phase === 'corriendo' ? `${delays[i]}ms` : '0ms' }}
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
          <p className="faint" style={{ marginTop: 8 }}>Toca cualquier punto para ver ese lead de cerca.</p>
        </div>

        {phase === 'listo' && (
          <div style={{ display: 'grid', gap: 16, marginTop: 16 }}>
            <p className="result-line">
              La regla le dijo &ldquo;gracias&rdquo; o dejó ir a <strong>{discarded.length}</strong>. <strong>{rescued.length}</strong> tenían un programa de 30X.
              Decidir toda la semana costó <strong>USD {fmt(data?.costUsd ?? 0, 3)}</strong> y cada decisión tardó <strong>{data?.msMean} ms</strong> en promedio.
            </p>
            <div className="card hero">
              <span className="faint">Pipeline semanal que la regla descarta (precios públicos de los programas que Jev sugiere)</span>
              <span className="value">USD {fmt(pipeline)}</span>
              <p className="muted">{priced.length} leads con programa de precio público{sinPrecio ? `; otros ${sinPrecio} van a planes corporativos o programas sin precio publicado y no se suman` : ''}.</p>
              <div className="scenario">
                <span className="faint">Ventas por mes si cierra (supuesto):</span>
                <div role="radiogroup" aria-label="Escenario de tasa de cierre" className="segmented">
                  {(Object.keys(SCENARIOS) as Scenario[]).map((k) => (
                    <button key={k} role="radio" aria-checked={scenario === k} className={scenario === k ? 'on' : ''} onClick={() => setScenario(k)}>
                      {k} · {Math.round(SCENARIOS[k] * 100)} %
                    </button>
                  ))}
                </div>
                <strong className="num">USD {fmt(monthly)} / mes</strong>
              </div>
              <p className="faint">Tasa de cierre supuesta: no tenemos el dato de 30X. Semana sintética de {n} leads (30X reporta 200–300 por semana). &ldquo;Que la regla descarta&rdquo;: en el formulario de AI Sales los puntajes bajos van a revisión manual.</p>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
