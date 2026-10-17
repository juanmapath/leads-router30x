// Panel "por qué confiar": números del set de prueba (nunca usado para ajustar), calibración,
// errores que terminan en una persona y Jev frente a un LLM general. Componente de servidor.
import baseline from '../../data/baseline-llm.json';
import testReport from '../../data/eval-report-test.json';
import { monthlyRunCost } from '../engine/impact.ts';
import { Calibration } from './Calibration.tsx';

const pct = (v: number | null) => `${Math.round((v ?? 0) * 100)} %`;
const usd = (v: number, d = 2) => `USD ${v.toLocaleString('es-CO', { minimumFractionDigits: d, maximumFractionDigits: d })}`;

export function Trust() {
  const r = testReport;
  const sucios = r.n - r.porTipo.arquetipo.n;
  const b = baseline;
  // Operación: 250 leads/semana (30X reporta 200–300) × (1 + 2 señales nuevas en promedio).
  const jevMonth = monthlyRunCost(250, 2, r.costo.porDecisionUsd);
  const llmMonth = monthlyRunCost(250, 2, b.costoPor1000Usd.llm / 1000);

  return (
    <section className="block" aria-labelledby="confiar">
      <div className="block-head">
        <h2 id="confiar">Por qué confiar</h2>
        <p className="muted">
          Medido en {r.n} leads de prueba que nunca usamos para ajustar umbrales ni preguntas, {sucios} de ellos &ldquo;sucios&rdquo;:
          formularios contradictorios, respuestas basura, contenido que no cuadra y leads que solo dejaron una pregunta en Luma.
        </p>
      </div>

      <div className="tiles">
        <div className="tile"><span className="value">{pct(r.precision.accion)}</span><span className="label">acción correcta ({pct(r.porTipo.arquetipo.accion)} en perfiles típicos)</span></div>
        <div className="tile"><span className="value">{pct(r.precision.programa)}</span><span className="label">programa correcto</span></div>
        <div className="tile">
          <span className="value">{r.errores.caros}</span>
          <span className="label">mandados a agendar sin deberlo · la regla actual: {r.regla.entrevistaIndebida}</span>
        </div>
        <div className="tile">
          <span className="value">{pct(r.errores.pctEnPersona)}</span>
          <span className="label">de los errores termina frente a una persona ({r.errores.terminanEnPersona} de {r.errores.total})</span>
        </div>
      </div>

      <div className="grid-2" style={{ marginTop: 16 }}>
        <div className="card" style={{ display: 'grid', gap: 10, alignContent: 'start' }}>
          <h3>Sus probabilidades significan algo</h3>
          <p className="muted" style={{ fontSize: 14 }}>
            Cuando Jev dice estar seguro, acierta. Por eso los umbrales viven en código: bajo 60 % de confianza nunca actúa solo y el lead pasa a una persona.
          </p>
          <Calibration buckets={r.calibracion} />
        </div>

        <div className="card" style={{ display: 'grid', gap: 10, alignContent: 'start' }}>
          <h3>Jev frente a un LLM general</h3>
          <p className="muted" style={{ fontSize: 14 }}>
            Mismos {b.n} leads de prueba, mismas 7 preguntas y mismas reglas de decisión, con Claude Sonnet 5.5 en salida estructurada.
          </p>
          <table>
            <thead><tr><th></th><th className="num">Jev</th><th className="num">LLM general</th></tr></thead>
            <tbody>
              <tr><td>Costo por 1.000 decisiones</td><td className="num">{usd(b.costoPor1000Usd.jev, 3)}</td><td className="num">{usd(b.costoPor1000Usd.llm)}</td></tr>
              <tr><td>Latencia media</td><td className="num">{b.latenciaMs.jev.media} ms</td><td className="num">{b.latenciaMs.llm.media.toLocaleString('es-CO')} ms</td></tr>
              <tr><td>Acción correcta</td><td className="num">{pct(b.aciertoAccion.jev)}</td><td className="num">{pct(b.aciertoAccion.llm)}</td></tr>
              <tr><td>Agendados sin deberlo</td><td className="num">{b.erroresCaros.jev}</td><td className="num">{b.erroresCaros.llm}</td></tr>
              <tr><td>Operar un mes*</td><td className="num">{usd(jevMonth)}</td><td className="num">{usd(llmMonth)}</td></tr>
            </tbody>
          </table>
          <p className="faint">
            El LLM elige casi el mismo programa (acuerdo {pct(b.acuerdoPrograma)}), pero declara probabilidades redondas que no se comportan como tales:
            con los mismos umbrales manda muchos más casos a revisión. *250 leads por semana × 3 decisiones (llegada + 2 señales nuevas).
          </p>
        </div>
      </div>
    </section>
  );
}
