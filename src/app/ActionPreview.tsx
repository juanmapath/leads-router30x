// Capa de acción compacta (docs/historial/ux-negocio.md §4, P2): debajo de la tarjeta de Jev en el zoom y en "Pruébalo tú".
// Mismas plantillas fijas de src/engine/actions.ts. Con el simulador muestra antes → después.
import { actionPlan } from '../engine/actions.ts';
import { ACTION_LABEL, type JevResult } from './JevCard.tsx';

export function ActionPreview({ result, prev }: { result: JevResult; prev?: JevResult | null }) {
  const plan = actionPlan(result.decision, result.jev.answers);
  const before = prev ? actionPlan(prev.decision, prev.jev.answers) : null;
  const changed = before && prev!.decision.action !== result.decision.action;
  const keep = new Set(['jev_accion', 'jev_programa', 'jev_canal', 'jev_revisar']);
  return (
    <div className="action-preview" aria-live="polite">
      <div className="action-preview-head">
        <h3>Lo que pasa en el milisegundo siguiente</h3>
        <span className="mock-badge static">maqueta</span>
      </div>
      {changed && (
        <p className="faint">
          Antes de la señal: <span className="was">{ACTION_LABEL[prev!.decision.action]} · &ldquo;{before!.lead.title}&rdquo;</span> → ahora: <strong>{ACTION_LABEL[result.decision.action]}</strong>
        </p>
      )}
      <div className="action-preview-grid">
        <div className="mock-mini">
          <span className="faint">Lo que ve el lead</span>
          <strong>{plan.lead.title}</strong>
          <span className="muted">{plan.lead.body}</span>
          {plan.lead.cta && <span className="mock-cta">{plan.lead.cta}</span>}
          <p className="mock-bubble"><span className="faint">{plan.followUp.from} · {plan.followUp.when}</span><br />{plan.followUp.text}</p>
        </div>
        <div className="mock-mini">
          <span className="faint">Lo que recibe el equipo</span>
          <strong>Asignado a {plan.team.assignee}</strong>
          <dl className="crm-props">
            {plan.team.properties.filter(([k]) => keep.has(k)).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
          </dl>
        </div>
      </div>
    </div>
  );
}
