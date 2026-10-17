// Supuestos de negocio (docs/supuestos.md), plegados al final de la página. Sin datos internos de 30X:
// todo número en dólares del demo sale de aquí, y cada supuesto dice cómo se valida en la semana en modo sombra.
import { CORPORATE_TICKET_USD, MONTHLY_SALES_30X_USD, REALIZED_SHARE, SANITY_MAX, SCENARIOS, type Scenario } from '../engine/impact.ts';
import type { WeekMetrics } from '../engine/week-metrics.ts';

export const SUPUESTOS_DOC = 'https://github.com/juanmapath/leads-router30x/blob/master/docs/supuestos.md';
const fmt = (v: number) => v.toLocaleString('es-CO', { maximumFractionDigits: 1 });
const LABEL: Record<Scenario, string> = { pesimista: 'Pesimista', viable: 'Viable', optimista: 'Optimista' };

export function Supuestos({ m, mix }: { m: WeekMetrics; mix: Array<{ nombre: string; pct: number }> }) {
  return (
    <section className="block supuestos" id="supuestos" aria-labelledby="supuestos-h">
      <details>
        <summary><h2 id="supuestos-h">Supuestos</h2> <span className="faint">sin datos internos de 30X · conservadores a propósito</span></summary>
        <div className="supuestos-body">
          <p className="muted">No pudimos validar con 30X. Estos son nuestros supuestos; la página, el guion y el playbook usan estos números y ningún otro.</p>

          <h3>Volumen y tamaño de 30X</h3>
          <table>
            <tbody>
              <tr><td>Leads por semana del formulario</td><td className="num">{m.n}</td><td className="faint">Punto medio de los 200–300 que se dijeron en el podcast con Dapta</td></tr>
              <tr><td>Ventas mensuales estimadas de 30X</td><td className="num">~USD {fmt(MONTHLY_SALES_30X_USD)}</td><td className="faint">~1.000 alumnos al año × ~USD 1.800 / 12. Solo para la prueba de cordura</td></tr>
              <tr><td>Ticket realizado por programa</td><td className="num">{fmt(REALIZED_SHARE * 100)} % del precio público</td><td className="faint">Descuentos, reservas y planes de pago</td></tr>
              <tr><td>Ticket de un plan corporativo</td><td className="num">USD {fmt(CORPORATE_TICKET_USD)}</td><td className="faint">5 cupos × USD 1.500</td></tr>
            </tbody>
          </table>

          <h3>Mezcla de una semana</h3>
          <table>
            <tbody>{mix.map((g) => <tr key={g.nombre}><td>{g.nombre}</td><td className="num">{g.pct} %</td></tr>)}</tbody>
          </table>

          <h3>Tasas de cierre sobre lo que Jev rescata</h3>
          <table>
            <thead><tr><th>Acción</th>{(Object.keys(SCENARIOS) as Scenario[]).map((k) => <th key={k} className="num">{LABEL[k]}</th>)}</tr></thead>
            <tbody>
              <tr><td>Otro programa (oferta por WhatsApp)</td>{(Object.keys(SCENARIOS) as Scenario[]).map((k) => <td key={k} className="num">{fmt(SCENARIOS[k].otro_programa * 100)} %</td>)}</tr>
              <tr><td>Área de empresas</td>{(Object.keys(SCENARIOS) as Scenario[]).map((k) => <td key={k} className="num">{fmt(SCENARIOS[k].empresas * 100)} %</td>)}</tr>
            </tbody>
          </table>
          <p className="faint">
            Prueba de cordura (un test la corre en cada push): pesimista ≤ {SANITY_MAX.pesimista * 100} % y viable ≤ {SANITY_MAX.viable * 100} % de las ventas mensuales estimadas.
            Con la semana del demo: pesimista del orden de USD {fmt(Math.round(m.monthly.pesimista / 1000) * 1000)} y viable del orden de USD {fmt(Math.round(m.monthly.viable / 1000) * 1000)} al mes.
          </p>

          <h3>Dónde vive Jev</h3>
          <ul className="muted">
            <li><strong>Supuesto A (preferido):</strong> el formulario redirige al terminar a una URL que llama a Jev (~{m.msMean} ms) y lleva al calendario, a la oferta o al seguimiento. Aquí los ms importan: un LLM de 1,7–3 s no cabe antes de que cargue la página.</li>
            <li><strong>Supuesto B (respaldo):</strong> Jev actúa por webhook en menos de 1 s; la página final no cambia, pero el primer contacto sale en el primer minuto.</li>
          </ul>

          <h3>Cómo se valida en la semana en modo sombra</h3>
          <p className="muted">Jev decide y registra en HubSpot sin cambiar lo que ve el lead. Se mide: la mezcla real (proporción por acción), la tasa de cierre de los rescatados que el equipo contacte, cuántos &ldquo;gracias&rdquo; de hoy reciben algún contacto, si el formulario puede redirigir y el tiempo al primer contacto.</p>
          <p className="faint"><a href={SUPUESTOS_DOC} target="_blank" rel="noreferrer">docs/supuestos.md en el repo</a></p>
        </div>
      </details>
    </section>
  );
}
