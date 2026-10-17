// Panel "por qué confiar" (docs/historial/ui-plan.md, sección 4): números del set de prueba v3 (nunca usado para ajustar),
// calibración, errores que terminan en una persona y Jev frente a un LLM general. Componente de servidor.
import baseline from '../../data/baseline-llm.json';
import testReport from '../../data/eval-report-test.json';
import { monthlyRunCost } from '../engine/impact.ts';
import { Calibration } from './Calibration.tsx';

const pct = (v: number | null) => `${Math.round((v ?? 0) * 100)} %`;
const usd = (v: number, d = 2) => `USD ${v.toLocaleString('es-CO', { minimumFractionDigits: d, maximumFractionDigits: d })}`;
const CI_URL = 'https://github.com/juanmapath/leads-router30x/actions';

export function Trust() {
  const r = testReport;
  const b = baseline;
  const sucios = r.n - r.porTipo.arquetipo.n;
  // Calibración: acierto con ≥ 90 % de confianza frente a < 60 % (tramos agregados).
  const hi = r.calibracion.find((c) => c.tramo.startsWith('90'))!;
  const low = r.calibracion.filter((c) => c.tramo.startsWith('0') || c.tramo.startsWith('50'));
  const lowN = low.reduce((a, c) => a + c.n, 0);
  const lowOk = low.reduce((a, c) => a + (c.acierto ?? 0) * c.n, 0);
  const n = b.n;
  const jevOk = Math.round(b.aciertoAccion.jev * n);
  const llmOk = Math.round(b.aciertoAccion.llm * n);
  const costX = Math.round(b.costoPor1000Usd.llm / b.costoPor1000Usd.jev);
  const speedX = Math.round(b.latenciaMs.llm.media / b.latenciaMs.jev.media);
  const p95X = Math.round((b.latenciaMs.llm.p95 ?? 0) / (b.latenciaMs.jev.p95 ?? 1));
  // Operación: 250 leads/semana (30X reporta 200–300) × (1 + 2 señales nuevas en promedio).
  const jevMonth = monthlyRunCost(250, 2, b.costoPor1000Usd.jev / 1000);
  const llmMonth = monthlyRunCost(250, 2, b.costoPor1000Usd.llm / 1000);

  return (
    <section className="block" aria-labelledby="confiar">
      <div className="block-head">
        <h2 id="confiar">Por qué confiar</h2>
        <p className="thesis">
          Un LLM general elige casi el mismo programa que Jev. La diferencia es que Jev decide <strong>~{speedX}× más rápido</strong>, cuesta <strong>~{costX}× menos</strong> y <strong>sabe cuándo no sabe</strong>: sus probabilidades calibradas marcan exactamente cuándo pasarle el caso a una persona.
        </p>
        <p className="muted">
          Medido en {r.n} leads de prueba que nunca usamos para ajustar umbrales ni preguntas; {sucios} son casos &ldquo;sucios&rdquo;: formularios contradictorios,
          respuestas de relleno, contenido que no cuadra, leads que solo dejaron una pregunta en Luma e intentos de manipular la decisión.
        </p>
      </div>

      <div className="tiles">
        <div className="tile"><span className="value">{pct(r.precision.accion)}</span><span className="label">acción correcta ({pct(r.porTipo.arquetipo.accion)} en perfiles típicos)</span></div>
        <div className="tile"><span className="value">{r.errores.caros}</span><span className="label">entrevistas mal agendadas (errores caros) · la regla actual agenda a {r.regla.entrevistaIndebida} que no calificaban</span></div>
        <div className="tile"><span className="value">{pct(r.errores.pctEnPersona)}</span><span className="label">de las dudas termina frente a una persona ({r.errores.terminanEnPersona} de {r.errores.total})</span></div>
        <div className="tile"><span className="value">{r.latenciaMs.media} ms</span><span className="label">por decisión, en promedio · {usd(r.costo.por1000Usd)} por 1.000</span></div>
      </div>

      <div className="grid-2" style={{ marginTop: 16 }}>
        <div className="card" style={{ display: 'grid', gap: 10, alignContent: 'start' }}>
          <h3>Cuando duda, se equivoca — y por eso esos casos van a una persona</h3>
          <p className="muted" style={{ fontSize: 14 }}>
            Con 90 % o más de confianza en el programa acierta <strong>{pct(hi.acierto)}</strong> ({hi.n} leads); por debajo de 60 % acierta{' '}
            <strong>{pct(lowN ? lowOk / lowN : 0)}</strong> ({lowN} leads). Por eso, bajo 60 % nunca actúa solo.
          </p>
          <Calibration buckets={r.calibracion} />
          <p className="faint">Los tramos intermedios tienen pocos casos; lo que sostenemos es la diferencia entre los extremos.</p>
        </div>

        <div className="card" style={{ display: 'grid', gap: 10, alignContent: 'start' }}>
          <h3>Jev frente a un LLM general</h3>
          <p className="muted" style={{ fontSize: 14 }}>
            Los mismos {n} leads de prueba, las mismas preguntas y los mismos umbrales, frente a Claude Sonnet 5.5 con salida estructurada.
          </p>
          <table>
            <thead><tr><th></th><th className="num">Jev</th><th className="num">LLM general</th></tr></thead>
            <tbody>
              <tr><td>Acción correcta</td><td className="num">{jevOk} de {n}</td><td className="num">{llmOk} de {n}</td></tr>
              <tr><td>Entrevistas mal agendadas</td><td className="num">{b.erroresCaros.jev}</td><td className="num">{b.erroresCaros.llm}</td></tr>
              <tr><td>Latencia media / 5 % más lento</td><td className="num">{b.latenciaMs.jev.media} / {b.latenciaMs.jev.p95} ms</td><td className="num">{b.latenciaMs.llm.media.toLocaleString('es-CO')} / {(b.latenciaMs.llm.p95 ?? 0).toLocaleString('es-CO')} ms</td></tr>
              <tr><td>Costo por 1.000 decisiones</td><td className="num">{usd(b.costoPor1000Usd.jev)}</td><td className="num">{usd(b.costoPor1000Usd.llm)}</td></tr>
            </tbody>
          </table>
          <p className="muted" style={{ fontSize: 14 }}>
            ~{costX}× más barato y ~{speedX}× más rápido ({p95X}× en el 5 % más lento). No es solo por ahorrar ({usd(llmMonth, 0)} al mes frente a {usd(jevMonth)}): es lo que permite <strong>decidir dentro del formulario</strong>, antes de que la persona cierre la pestaña, y <strong>recalcular con cada señal nueva</strong>.
          </p>
          <p className="faint">Jev no conversa ni escribe: elige entre opciones cerradas que pasan por umbrales en código. El LLM queda para redactar los mensajes de quienes ventas sí contacta.</p>
        </div>
      </div>

      <p className="faint" style={{ marginTop: 16 }}>
        Verificador en cada push: el <a href={CI_URL}>CI</a> falla si la acción baja de 76 % en el set de prueba o si aparece una sola entrevista mal agendada (error caro).
        Datos 100 % sintéticos; las tasas de cierre de la semana son supuestos.
      </p>
    </section>
  );
}

