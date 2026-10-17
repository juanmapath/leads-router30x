// Cómo lo adopta 30X (docs/ui-plan.md, sección 5): quién lo opera, cuánto cuesta, cómo se mide y el pedido.
import baseline from '../../data/baseline-llm.json';
import { monthlyRunCost } from '../engine/impact.ts';

const REPO = 'https://github.com/juanmapath/leads-router30x';
const usd = (v: number, d = 2) => `USD ${v.toLocaleString('es-CO', { minimumFractionDigits: d, maximumFractionDigits: d })}`;

export function Adopt() {
  // 250 leads por semana (30X reporta 200–300) × 3 decisiones (llegada + 2 señales nuevas).
  const jevMonth = monthlyRunCost(250, 2, baseline.costoPor1000Usd.jev / 1000);
  const llmMonth = monthlyRunCost(250, 2, baseline.costoPor1000Usd.llm / 1000);
  return (
    <section className="block" aria-labelledby="adopcion">
      <div className="block-head">
        <h2 id="adopcion">Cómo lo adopta 30X</h2>
        <p className="muted">Sin cambiar el formulario ni el CRM: Jev escribe su decisión donde el equipo ya trabaja.</p>
      </div>
      <div className="adopt">
        <div className="card">
          <h3>Quién lo opera</h3>
          <ul className="reasons">
            <li>El SDR trabaja la cola &ldquo;Lo revisa una persona&rdquo;.</li>
            <li>Jev escribe acción, programa y probabilidades como propiedades en HubSpot.</li>
            <li>&ldquo;Agenda ya&rdquo; dispara la llamada inmediata del agente de voz (Dapta); &ldquo;Otro programa&rdquo; va por WhatsApp.</li>
            <li>Los umbrales son perillas del negocio: más conservador con la Inmersión es subir un número, sin reescribir instrucciones.</li>
          </ul>
        </div>
        <div className="card">
          <h3>Cuánto cuesta</h3>
          <p className="adopt-num num">{usd(jevMonth)} <span className="faint">al mes con Jev</span></p>
          <p className="muted">{usd(llmMonth, 0)} con un LLM general, por 250 leads a la semana y 3 decisiones por lead (llegada y 2 señales nuevas).</p>
        </div>
        <div className="card">
          <h3>Cómo se mide</h3>
          <ul className="reasons">
            <li>% de leads contactados en menos de 5 minutos.</li>
            <li>Reuniones canceladas por mala calificación.</li>
            <li>Ventas de programas distintos a la Inmersión desde leads que la regla descartaba.</li>
            <li>Cada decisión queda guardada con sus probabilidades por pregunta: se audita después.</li>
          </ul>
        </div>
      </div>
      <div className="card ask">
        <p className="ask-text">Pedimos <strong>una semana en modo sombra</strong> con su formulario y HubSpot: Jev decide pero no actúa; al final comparamos sus decisiones con lo que hizo el equipo.</p>
        <p className="faint"><a href={REPO}>Repositorio y verificador</a> · <a href={`${REPO}/blob/master/docs/resultados-eval.md`}>Resultados del eval</a></p>
      </div>
    </section>
  );
}
