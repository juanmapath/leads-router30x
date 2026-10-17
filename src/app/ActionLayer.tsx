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

function Phone({ children, label }: { children: ReactNode; label: string }) {
  return (
    <figure className="phone" aria-label={label}>
      <span className="mock-badge">maqueta</span>
      <div className="phone-screen">{children}</div>
    </figure>
  );
}

export function ActionLayer({ c }: { c: ActionCase }) {
  const { lead, followUp, team } = c.plan;
  return (
    <section className="block" aria-labelledby="accion">
      <div className="block-head">
        <h2 id="accion">Lo que cambia para el lead y para el equipo</h2>
        <p className="muted">
          Un caso de la semana: {c.roleText} de una multinacional que quiere formar a 5 o más personas.
          La regla de puntos le da <strong className="num">{c.legacyScore}/10</strong>: no es CEO ni paga de su bolsillo.
        </p>
      </div>
      <div className="action-grid">
        <div className="action-col">
          <h3>Hoy, lo que ve el lead</h3>
          <Phone label="Maqueta: página final genérica de agradecimiento">
            <div className="mock-page mock-thanks">
              <strong>Gracias por tu aplicación</strong>
              <span>Revisaremos tu perfil.</span>
            </div>
          </Phone>
          <p className="faint">Fin. Nadie de 30X lo contacta.</p>
        </div>

        <div className="action-col">
          <h3>Con Jev, en ~{c.ms} ms</h3>
          <Phone label={`Maqueta: ${lead.title}`}>
            <div className="mock-page">
              <strong>{lead.title}</strong>
              <span>{lead.body}</span>
              {lead.kind === 'calendario' && (
                <div className="mock-slots">{SLOTS.map((s) => <span key={s} className="mock-slot">{s}</span>)}</div>
              )}
              {lead.cta && <span className="mock-cta">{lead.cta}</span>}
            </div>
            <div className="mock-chat">
              <span className="faint">{followUp.from} · {followUp.when}</span>
              <p className="mock-bubble">{followUp.text}</p>
            </div>
          </Phone>
          <p className="faint">Esto solo es posible porque la decisión llega antes que la página: un LLM general tarda {LLM_LATENCY} (supuesto A; si no se puede redirigir, el mensaje sale igual en el primer minuto).</p>
        </div>

        <div className="action-col">
          <h3>Lo que recibe el equipo</h3>
          <div className="card crm" aria-label="Maqueta: ficha del lead en el CRM">
            <span className="mock-badge">maqueta</span>
            <div className="crm-head"><span className="faint">Asignado a</span><strong>{team.assignee}</strong></div>
            <dl className="crm-props">
              {team.properties.map(([k, v]) => (
                <div key={k}><dt>{k}</dt><dd className="num">{v}</dd></div>
              ))}
            </dl>
            <p className="faint">Propiedades que Jev escribe en HubSpot. En el piloto (modo sombra) solo se registran.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
