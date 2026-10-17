'use client';
// Tarjeta de la decisión de Jev: acción, programa y categoría, barras de probabilidad con la marca de su umbral
// (el verificador a la vista), razones en lenguaje de vendedor y de dónde salió la respuesta (grabación o en vivo).
import { THRESHOLDS } from '../engine/decide.ts';
import { CATEGORIES, programCategory, programName, type CategoryId } from '../engine/programs.ts';
import type { Decision, JevAnswers, ProgramId } from '../engine/types.ts';

export const ACTION_LABEL: Record<string, string> = {
  agenda_ya: 'Agenda ya',
  otro_programa: 'Otro programa',
  empresas: 'Área de empresas',
  cola_humana: 'Lo revisa una persona',
  nurturing: 'Seguir nutriendo',
};

export interface JevResult { decision: Decision; jev: { answers: JevAnswers; ms: number; costUsd: number; source: 'live' | 'replay' }; state?: string }

const pct = (p: number) => `${Math.round(p * 100)} %`;

function ProbBar({ label, p, threshold, note }: { label: string; p: number; threshold: number; note: string }) {
  return (
    <div className="prob">
      <div className="prob-head"><span>{label}</span><strong className="num">{pct(p)}</strong></div>
      <div className="prob-track" role="img" aria-label={`${label}: ${pct(p)}; umbral ${pct(threshold)}`}>
        <span className="prob-fill" style={{ width: `${Math.max(1, p * 100)}%` }} />
        <span className="prob-mark" style={{ left: `${threshold * 100}%` }} title={note} />
      </div>
      <span className="prob-note">{note}</span>
    </div>
  );
}

export function JevCard({ result, prev }: { result: JevResult; prev?: JevResult | null }) {
  const { decision: d, jev } = result;
  const a = jev.answers;
  const top = Object.entries(a.program.dist ?? { [a.program.value]: a.program.p })
    .filter(([k]) => k !== 'otro' && k !== 'ninguno').sort((x, y) => y[1] - x[1]).slice(0, 3);
  // La categoría se muestra cuando coincide con el programa decidido, o cuando es lo único claro (decide el vendedor).
  const catId = a.category && a.category.value !== 'ninguna' ? (a.category.value as CategoryId) : null;
  const category = catId && (d.category === catId || programCategory(d.program as ProgramId) === catId) ? CATEGORIES[catId].name : null;
  const changed = prev && prev.decision.action !== d.action;

  return (
    <div className="jev-card">
      <div className="jev-head">
        <span className="faint">Jev</span>
        <span className={`chip${jev.source === 'live' ? ' chip-live' : ''}`}>
          {jev.source === 'live' ? 'EN VIVO' : 'grabación'} · {jev.ms} ms · USD {jev.costUsd.toFixed(5).replace('.', ',')}
        </span>
      </div>
      <p className="jev-action">
        {changed && <span className="was">{ACTION_LABEL[prev!.decision.action]} → </span>}
        {ACTION_LABEL[d.action]}
      </p>
      <p className="muted">
        {programName(d.program as ProgramId)}
        {category ? ` · categoría ${category} (${pct(a.category!.p)})` : ''}
      </p>

      <div className="probs">
        <ProbBar label="Listo para hablar con ventas" p={a.ready.p} threshold={THRESHOLDS.readyHigh} note="Bajo esta línea no se agenda ya." />
        <ProbBar label="Es para un equipo (venta a empresa)" p={a.team.p} threshold={THRESHOLDS.team} note="Desde esta línea va al área de empresas." />
        {a.coherent && a.ready.p >= THRESHOLDS.readyHigh * 0.8 && <ProbBar label="Formulario coherente y creíble" p={a.coherent.p} threshold={THRESHOLDS.coherent} note="Bajo esta línea, agendar lo decide una persona." />}
        {a.manipulation && a.manipulation.p >= 0.4 && <ProbBar label="El texto intenta instruir al sistema" p={a.manipulation.p} threshold={THRESHOLDS.manipulation} note="Desde esta línea, decide una persona." />}
        {top.map(([k, p]) => (
          <ProbBar key={k} label={`Programa: ${programName(k as ProgramId)}`} p={p} threshold={THRESHOLDS.programOther} note="Bajo esta línea, el programa lo confirma una persona." />
        ))}
      </div>

      <ul className="reasons">{d.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
      {result.state && (
        <details>
          <summary>Lo que leyó Jev (sin nombre ni correo)</summary>
          <pre className="state">{result.state}</pre>
        </details>
      )}
    </div>
  );
}
