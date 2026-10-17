# Jev Lead Router · 30X

**Reto JEV en 30X · Hackathon 30X (oct. 2026)** · Demo: [leads-router30x.vercel.app](https://leads-router30x.vercel.app/) · Playbook: [`docs/playbook.md`](docs/playbook.md) · Supuestos: [`docs/supuestos.md`](docs/supuestos.md)

**Cada semana, el formulario de 30X descarta en automático a 195 de 250 personas. Entre ellas, 10 empresas que venían a formar a su equipo.**

Hoy una suma fija de puntos decide: más de 6 sobre 10 pasa a entrevista; el resto ve "Gracias por tu aplicación" y sale del embudo. Esa barra servía para un solo producto de USD 6.000; con 17 programas y clientes corporativos ya no. Jev Lead Router reemplaza la suma por decisiones calibradas de **Jev** (TypeSafe AI): en una sola llamada responde 9 preguntas tipadas por lead (si está listo, qué programa le encaja, si es una venta a empresa, por qué canal contactarlo…), los umbrales en código eligen la acción y los casos dudosos pasan a una persona.

**Por qué importan los milisegundos:** Jev decide en ~250 ms, antes de que cargue la página final del formulario (supuesto A: redirección al terminar). Así la persona ve un calendario, la oferta de su programa o una página de seguimiento en vez de "gracias". Un LLM general tarda 1,7–3 s y no cabe ahí. Si el formulario no puede redirigir (supuesto B), Jev actúa por webhook y el primer contacto sale en el primer minuto.

## La semana del demo (250 leads sintéticos)

| En personas | |
|---|---|
| Descartados por la regla ("gracias" o abandono) | **195** |
| Oportunidades de empresa entre los descartados | **10** |
| Descartados que reciben la oferta de un programa de 30X | **66** |
| Entrevistas protegidas (la regla las mandaba a un closer; Jev pide revisarlas) | **5** |
| Siguen en nurturing / los revisa una persona | 65 / 59 |
| Reciben su siguiente paso sin intervención humana | **76 %** |

Decidir la semana entera cuesta **USD 0,03** (~260 ms por lead). Con supuestos conservadores, el ingreso incremental es **del orden de USD 13.000 al mes** (pesimista; viable del orden de USD 27.000).

**Todos los números de negocio son supuestos** (no tuvimos datos internos de 30X): volumen, mezcla de la semana (45 % baja intención, 20 % Inmersión, 23 % otro programa, 4 % empresas, 8 % abandonos), ticket realizado (85 % del precio público; plan corporativo USD 7.500) y tasas de cierre por escenario están en [`docs/supuestos.md`](docs/supuestos.md). Un test aplica la prueba de cordura: el pesimista no pasa del 10 % ni el viable del 25 % de unas ventas estimadas de ~USD 150.000 al mes. En el piloto (una semana en modo sombra) se reemplazan por datos reales.

**Calidad (set de prueba v3: 127 leads nunca usados para ajustar, la mitad sucios):** acción correcta 83,5 %, programa 86,3 %, **0 entrevistas mal agendadas**. Detalle en [`docs/resultados-eval.md`](docs/resultados-eval.md).

> Datos 100 % sintéticos; ninguna persona real. Correos `@ejemplo.test`.

## Cómo correrlo

Requisitos: Node 20.6 o superior.

```bash
npm install
cp .env.example .env.local      # en PowerShell: copy .env.example .env.local
# pon tu AI_GATEWAY_API_KEY de Vercel AI Gateway en .env.local (solo para llamadas en vivo)
npm test                         # verificador determinístico (sin red)
npm run eval:gate                # puerta de CI: set de prueba desde grabaciones
npm run build                    # precalcula la semana (falla si falta una grabación)
npm run dev                      # http://localhost:3000
```

## Estructura

- `src/engine/` — motor de decisión, sin interfaz: regla actual de 30X (`legacy.ts`), estado del lead (`state.ts`), preguntas tipadas (`questions.ts`), umbrales y reglas (`decide.ts`), cliente de Jev con grabar/reproducir (`jev-client.ts`), cifras de la semana (`week-metrics.ts`), dólares con supuestos (`impact.ts`) y plantillas fijas de la capa de acción (`actions.ts`).
- `src/app/` — interfaz y API (`/api/decide`) en Next.js. Portada, semana y capa de acción se renderizan en el servidor.
- `data/` — leads sintéticos (`leads.json`: demo y ajuste), semana del demo (`week-leads.json` + `week-mix.json`), sets de prueba y grabaciones de Jev.
- `scripts/` — generadores de datos, grabación, evaluación y semana precalculada.
- `tests/` — verificador que corre en CI en cada push.
