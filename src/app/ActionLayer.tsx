// Capa de acción (docs/historial/ux-negocio.md §4): un solo caso, el gerente de innovación de una multinacional con 5+ cupos.
// Server component: la decisión sale de la grabación real de Jev y las plantillas fijas de src/engine/actions.ts.
// Maquetas genéricas, marcadas "maqueta": sin identidad visual de 30X ni teléfonos reales.
import type { ReactNode } from 'react';
import type { ActionPlan } from '../engine/actions.ts';
import { LLM_LATENCY } from '../engine/baseline.ts';

export interface ActionCase {
  roleText: string;
  legacyScore: number;
  ms: number;
  plan: ActionPlan;
}

const SLOTS = ['mar 10:00', 'mar 15:30', 'mié 9:00', 'jue 11:00'];

function Phone({ children, label, tone }: { children: ReactNode; label: string; tone?: 'legacy' | 'jev' }) {
  return (
    <figure className={`phone${tone ? ` phone-${tone}` : ''}`} aria-label={label}>
      <span className="mock-badge">maqueta</span>
      <div className="phone-screen">{children}</div>
    </figure>
  );
}

export function ActionLayer({ c }: { c: ActionCase }) {
  const { lead, followUp, team } = c.plan;
  return (
    <section className="block" aria-labelledby="accion">
      <div className="block-head action-head">
        <span className="eyebrow"><span className="eyebrow-dot" />Experiencia del lead y del equipo</span>
        <h2 id="accion">Lo que cambia para el lead y para el equipo</h2>
        <p className="muted">
          Caso real de la semana: <strong>{c.roleText}</strong> de una multinacional que quiere formar a 5 o más personas.
          La regla de puntos le da <strong className="num badge-legacy">{c.legacyScore}/10</strong> porque no es CEO ni paga de su bolsillo.
        </p>
      </div>
      <div className="action-grid">
        <div className="card action-col action-col-legacy">
          <div className="step-head">
            <span className="step-badge step-legacy">1 · Hoy, lo que ve el lead</span>
            <span className="status-tag tag-critical">Oportunidad descartada</span>
          </div>
          <Phone label="Maqueta: página final genérica de agradecimiento" tone="legacy">
            <div className="mock-page mock-thanks">
              <span className="thanks-icon" aria-hidden="true">✕</span>
              <strong>Gracias por tu aplicación</strong>
              <span>Revisaremos tu perfil.</span>
            </div>
          </Phone>
          <p className="faint" style={{ textAlign: 'center' }}>Fin del embudo. Nadie de 30X lo contacta.</p>
        </div>

        <div className="card action-col action-col-jev">
          <div className="step-head">
            <span className="step-badge step-brand">2 · Con Jev, en ~{c.ms} ms</span>
            <span className="status-tag tag-brand">Antes de cargar la página</span>
          </div>
          <Phone label={`Maqueta: ${lead.title}`} tone="jev">
            <div className="mock-page">
              <strong>{lead.title}</strong>
              <span>{lead.body}</span>
              {lead.kind === 'calendario' && (
                <div className="mock-slots">{SLOTS.map((s, i) => <span key={s} className={`mock-slot${i === 0 ? ' mock-slot-active' : ''}`}>{s}</span>)}</div>
              )}
              {lead.cta && <span className="mock-cta">{lead.cta}</span>}
            </div>
            <div className="mock-chat">
              <span className="faint">{followUp.from} · {followUp.when}</span>
              <p className="mock-bubble">{followUp.text}</p>
            </div>
          </Phone>
          <p className="faint">La decisión llega antes que la página (un LLM general tarda {LLM_LATENCY}). Si no se redirige, el mensaje sale igual en el primer minuto.</p>
        </div>

        <div className="card action-col action-col-crm">
          <div className="step-head">
            <span className="step-badge step-jev">3 · Lo que recibe el equipo</span>
            <span className="mock-badge static">maqueta CRM</span>
          </div>
          <div className="crm" aria-label="Maqueta: ficha del lead en el CRM">
            <div className="crm-head">
              <span className="faint">Asignado en automático a</span>
              <strong className="crm-assignee">{team.assignee}</strong>
            </div>
            <dl className="crm-props">
              {team.properties.map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd className={`num${k === 'jev_accion' || k === 'jev_programa' ? ' prop-highlight' : ''}`}>{v}</dd>
                </div>
              ))}
            </dl>
            <p className="faint">Propiedades que Jev escribe en HubSpot. En el piloto (modo sombra) solo se registran.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

