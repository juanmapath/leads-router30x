'use client';
// Apertura del demo: "La semana de 30X". Los 300 leads de una semana sintética por la regla actual y por Jev.
import { useEffect, useState } from 'react';
import { SCENARIOS, TICKETS, WEEKS_PER_MONTH } from '../engine/impact.ts';
import { programName } from '../engine/programs.ts';
import type { Action, ProgramId } from '../engine/types.ts';
import { Bars, type BarDatum } from './Bars.tsx';

interface WeekData {
  n: number;
  costUsd: number;
  msMean: number;
  impact: Record<keyof typeof SCENARIOS, number>;
  rows: Array<{ id: string; legacy: 'entrevista' | 'gracias' | 'abandono'; action: Action; program: ProgramId }>;
}

const usd = (v: number, d = 0) => `USD ${v.toLocaleString('es-CO', { minimumFractionDigits: d, maximumFractionDigits: d })}`;
const WITH_PROGRAM: Action[] = ['agenda_ya', 'otro_programa', 'empresas'];

export function Week() {
  const [data, setData] = useState<WeekData | null>(null);
  const [error, setError] = useState(false);
  const [ran, setRan] = useState(false);

  useEffect(() => {
    fetch('/api/week').then((r) => (r.ok ? r.json() : Promise.reject())).then(setData).catch(() => setError(true));
  }, []);

  const count = (f: (r: WeekData['rows'][number]) => boolean) => data?.rows.filter(f).length ?? 0;
  const n = data?.n ?? 300;
  const discarded = count((r) => r.legacy !== 'entrevista');
  const rescued = count((r) => r.legacy !== 'entrevista' && WITH_PROGRAM.includes(r.action));
  const toPerson = count((r) => r.legacy !== 'entrevista' && r.action === 'cola_humana');

  const legacyBars: BarDatum[] = [
    { label: 'Entrevista', value: count((r) => r.legacy === 'entrevista') },
    { label: '"Gracias por tu aplicación"', value: count((r) => r.legacy === 'gracias') },
    { label: 'Abandonó (sin acción)', value: count((r) => r.legacy === 'abandono') },
  ];
  const jevBars: BarDatum[] = [
    { label: 'Agenda ya', value: count((r) => r.action === 'agenda_ya') },
    { label: 'Otro programa', value: count((r) => r.action === 'otro_programa') },
    { label: 'Área de empresas', value: count((r) => r.action === 'empresas') },
    { label: 'Lo revisa una persona', value: count((r) => r.action === 'cola_humana') },
    { label: 'Nurturing', value: count((r) => r.action === 'nurturing') },
  ];

  // Desglose de la cifra viable por programa (para que el supuesto más pesado quede a la vista).
  const byProgram = new Map<string, number>();
  for (const r of data?.rows ?? []) {
    if (r.legacy === 'entrevista' || !WITH_PROGRAM.includes(r.action) || !TICKETS[r.program]) continue;
    byProgram.set(r.program, (byProgram.get(r.program) ?? 0) + 1);
  }

  return (
    <section className="block" aria-labelledby="semana">
      <div className="block-head">
        <h2 id="semana">La semana de 30X</h2>
        <p className="muted">
          {n} personas llenaron el formulario esta semana. Hoy, una suma fija de puntos decide: más de 6 de 10 pasa a entrevista;
          el resto ve &ldquo;Gracias por tu aplicación&rdquo; y sale del embudo.
        </p>
      </div>

      {!ran && (
        <div className="card" style={{ display: 'grid', gap: 12, justifyItems: 'start' }}>
          <p>
            La regla actual descarta a <strong className="num">{data ? discarded : '…'}</strong> de {n}. ¿Cuántos tenían un programa de 30X para ellos?
          </p>
          <button className="btn" onClick={() => setRan(true)} disabled={!data}>
            {data ? 'Pasar la semana por Jev' : error ? 'No se pudo cargar la semana' : 'Cargando la semana…'}
          </button>
        </div>
      )}

      {ran && data && (
        <div style={{ display: 'grid', gap: 16 }}>
          <div className="card hero">
            <span className="faint">Ventas que hoy se pierden, por mes · escenario viable (supuestos)</span>
            <span className="value">{usd(data.impact.viable)}</span>
            <p className="muted">
              {rescued} de los {discarded} descartados tenían un programa según Jev × {Math.round(SCENARIOS.viable * 100)} % de cierre × precio del programa × {WEEKS_PER_MONTH.toLocaleString('es-CO')} semanas.
              Rango: {usd(data.impact.pesimista)} a {usd(data.impact.optimista)}.
            </p>
            <details>
              <summary>Ver supuestos y desglose</summary>
              <table>
                <thead><tr><th>Programa</th><th className="num">Leads/semana</th><th className="num">Ticket</th></tr></thead>
                <tbody>
                  {[...byProgram.entries()].sort((a, b) => b[1] * TICKETS[b[0]].usd - a[1] * TICKETS[a[0]].usd).map(([p, k]) => (
                    <tr key={p}>
                      <td>{programName(p as ProgramId)}</td>
                      <td className="num">{k}</td>
                      <td className="num">{usd(TICKETS[p].usd)}{TICKETS[p].supuesto ? ' (supuesto)' : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="faint" style={{ marginTop: 8 }}>
                Tasa de cierre supuesta: {Object.entries(SCENARIOS).map(([k, v]) => `${k} ${Math.round(v * 100)} %`).join(' · ')}. Semana sintética de {n} leads
                (30X reporta 200–300 por semana); la mezcla de perfiles es sintética. Se ajusta con la tasa de cierre real de 30X.
              </p>
            </details>
          </div>

          <div className="grid-2">
            <div className="card" style={{ display: 'grid', gap: 12 }}>
              <h3>Regla actual (suma de puntos)</h3>
              <Bars data={legacyBars} max={n} color="var(--legacy)" />
            </div>
            <div className="card" style={{ display: 'grid', gap: 12 }}>
              <h3>Jev (una llamada por lead)</h3>
              <Bars data={jevBars} max={n} color="var(--jev)" />
            </div>
          </div>

          <div className="tiles">
            <div className="tile"><span className="value">{discarded}</span><span className="label">personas a las que la regla dijo &ldquo;gracias&rdquo; o dejó ir</span></div>
            <div className="tile"><span className="value">{rescued}</span><span className="label">de ellas tenían un programa según Jev</span></div>
            <div className="tile"><span className="value">{toPerson}</span><span className="label">casos dudosos que ahora revisa una persona</span></div>
            <div className="tile"><span className="value">{usd(data.costUsd, 3)}</span><span className="label">costó decidir toda la semana · {data.msMean} ms por lead</span></div>
          </div>
        </div>
      )}
    </section>
  );
}
