// Capa de acción compacta (docs/historial/ux-negocio.md §4, P2): al lado derecho de la tarjeta de Jev en el zoom y en "Pruébalo tú".
// Mismas plantillas fijas de src/engine/actions.ts. Con el simulador muestra antes → después.
import { actionPlan } from '../engine/actions.ts';
import { ACTION_LABEL, type JevResult } from './JevCard.tsx';

export function ActionPreview({ result, prev, stepLabel = '3 · En el milisegundo siguiente' }: { result: JevResult; prev?: JevResult | null; stepLabel?: string }) {
  const plan = actionPlan(result.decision, result.jev.answers);
  const before = prev ? actionPlan(prev.decision, prev.jev.answers) : null;
  const changed = before && prev!.decision.action !== result.decision.action;
  const keep = new Set(['jev_accion', 'jev_programa', 'jev_canal', 'jev_revisar']);
  return (
    <div className="action-preview" aria-live="polite">
      <div className="step-head">
        <span className="step-badge step-brand">{stepLabel}</span>
        <span className="mock-badge static">maqueta</span>
      </div>
      {changed && (
        <p className="faint change-banner">
          Antes: <span className="was">{ACTION_LABEL[prev!.decision.action]}</span> → Ahora: <strong>{ACTION_LABEL[result.decision.action]}</strong>
        </p>
      )}
      <div className="action-preview-stack">
        <div className="mock-mini mock-mini-lead">
          <span className="step-sub">Lo que ve el lead en pantalla</span>
          <strong>{plan.lead.title}</strong>
          <span className="muted" style={{ fontSize: 13 }}>{plan.lead.body}</span>
          {plan.lead.cta && <span className="mock-cta">{plan.lead.cta}</span>}
          <p className="mock-bubble"><span className="faint">{plan.followUp.from} · {plan.followUp.when}</span><br />{plan.followUp.text}</p>
        </div>
        <div className="mock-mini mock-mini-crm">
          <span className="step-sub">Lo que recibe el equipo en HubSpot</span>
          <strong>Asignado a {plan.team.assignee}</strong>
          <dl className="crm-props">
            {plan.team.properties.filter(([k]) => keep.has(k)).map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd className={k === 'jev_accion' ? 'prop-highlight' : ''}>{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}

