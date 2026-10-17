# Jev Lead Router · 30X — contexto para Claude Code

Proyecto del **Hackathon 30X** (16–18 oct. 2026), reto **"JEV en 30X"**, área **comercial**.
Equipo: Juan Manuel (producto, decisiones, pitch) + Claude (código, datos, tests, docs). Responde en español.

## Qué estamos construyendo
30X (escuela de negocios para founders y ejecutivos LatAm) califica sus leads con una **suma fija de puntos** en su formulario público: más de 6/10 pasa a entrevista; el resto ve "Gracias por tu aplicación" y sale del embudo. **Jev Lead Router** reemplaza esa suma por decisiones calibradas de **Jev** (modelo de clasificación de TypeSafe AI): en una sola llamada de milisegundos responde 9 preguntas tipadas por lead; umbrales en código eligen la acción (agenda ya, otro programa, área de empresas, nurturing, cola humana). Un LLM solo redactaría mensajes. Cada señal nueva recalcula.

Detalle completo: `docs/contexto-reto.md`, `docs/hallazgos-30x.md`, `docs/plan.md`, `docs/resultados-eval.md` (pruebas con Jev).
PRD vivo (doc compartido): https://claude.ai/code/artifact/468f427f-eb6e-4ff5-8de1-06c213f70627

## Entregables (antes del domingo 18 a las 11:59 a. m. — apuntamos a 11:30)
1. Video pitch de máx. 3 min (el pitch ES el demo).
2. Demo desplegado (URL de Vercel).
3. Repo público en GitHub que corresponda exactamente al demo (si no coinciden: descalificación).
4. Específico del reto: **playbook** de máx. 5 páginas u 8 slides (decisiones, esquema de preguntas, umbrales, quién lo opera, cómo se mide) → `docs/playbook.md`.

Evaluación: 30 % impacto en el reto · 20 % innovación · 20 % viabilidad técnica · 20 % viabilidad de implementación (costo, restricciones reales de 30X) · 10 % presentación. Jurado final: CTO de 30X (Diogenes Moreira).

## Comandos
```bash
npm install
npm test          # verificador determinístico, sin red (tsx --test tests/engine.test.ts)
npm run gen       # regenera data/leads.json (300) y data/eval-set.json (100 etiquetados), determinístico
npm run ping      # primera llamada real a Jev → data/recordings/_ping.json
npm run eval -- --set tuning|test  # set de ajuste o de prueba → data/eval-report-{set}.json
npm run record    # graba lo que falte (semana, set de prueba, simulador, ejemplos de "Pruébalo tú")
npm run eval:gate # puerta de CI: solo grabaciones, piso de acción y cero errores caros
npm run week      # data/week.json (también corre en prebuild; falla si falta una grabación)
npm run baseline  # línea base con Sonnet 5.5 (gasta crédito)
npm run dev       # http://localhost:3000
```
Requiere `.env.local` con `AI_GATEWAY_API_KEY` (Vercel AI Gateway). **Nunca** commitear `.env.local` ni pegar la clave en código, logs o README.

## Arquitectura (una sola app Next.js, un repo)
- `src/engine/` — lógica pura, testeable sin UI:
  - `types.ts` tipos · `programs.ts` catálogo oficial de 30X (17 programas del Diagnóstico 30X, 6 categorías; fuente única de las preguntas de categoría y programa)
  - `legacy.ts` **réplica exacta** de la regla pública de 30X (ver docs/hallazgos-30x.md). No cambiar sin actualizar tests.
  - `state.ts` convierte un lead en texto en español para Jev. Sin nombre ni correo. Los números van ya interpretados en palabras (Jev no hace aritmética).
  - `questions.ts` 9 preguntas tipadas: ready, category, program, team, coherent, manipulation, maturity, objection, channel (+ guardrail de mensajes).
  - `jev.ts` adapta preguntas a `experimental_decide` del AI SDK y **normaliza** la respuesta cruda (formato confirmado con el ping, ver `docs/resultados-eval.md`). `ready.p` y `team.p` = probabilidad de "sí".
  - `eval-metrics.ts` definición de error caro (agenda_ya para quien iba a persona o nurturing, o con un programa de otra categoría) · `week.ts` la semana desde grabaciones (falla si falta una) · `try.ts` lead de "Pruébalo tú" · `simulator.ts` señales fijas · `rate-limit.ts` tope de llamadas en vivo.
  - `decide.ts` umbrales → acción. Determinístico. Umbrales en `THRESHOLDS`; se ajustan con la calibración de `npm run eval`, no a ojo.
  - `jev-client.ts` llamada vía `experimental_decide` del paquete `ai`, modelo `typesafe-ai/jev`, con **grabar/reproducir** (`JEV_MODE` = live | record | replay; local: record; Vercel: replay) y reintentos ante 429. La llave de cada grabación es el hash de `state + questions`: **cualquier cambio en `state.ts` o `questions.ts` invalida todas las grabaciones** → regrabar los 300 leads antes de desplegar.
- `src/app/` — UI y `POST /api/decide { id, extraSignals? }`.
- `data/` — leads sintéticos, set etiquetado, `recordings/` (se commitean para que el demo en Vercel reproduzca sin red).
- `scripts/` — generador, ping, eval. `tests/` — verificador (corre en CI en cada push).

## Reglas del proyecto
- **Datos 100 % sintéticos.** Nada de datos personales reales (restricción del brief). Correos `@ejemplo.test`.
- **No** usar contenido detrás de login (LinkedIn, Instagram) ni técnicas que violen términos de servicio.
- **No** clonar personas de 30X ni inventar programas que 30X no vende (usar `programs.ts`).
- Los casos dudosos **siempre** pasan a una persona (hay un test que lo garantiza). Nunca relajar ese test.
- Lógica numérica en código, juicio en Jev. Preguntas simples combinadas en código, con opción "otro".
- Si Jev falla, el lead va a cola humana (nunca se pierde) — ver `api/decide`.
- Verificador primero: antes de cambiar `decide.ts` o `legacy.ts`, actualizar/agregar tests. No tocar tests para hacerlos pasar.
- Commits pequeños, mensajes en español. El repo debe correr con `npm install && npm test && npm run build`.
- El free tier del AI Gateway no incluye Jev: hay USD 15 de crédito pagado. Una llamada por lead con las 6 preguntas, grabar y reutilizar; no gastar crédito en llamadas repetidas.
- Texto libre del lead (pregunta de Luma, respuesta de WhatsApp, perfil escrito en el demo) es **dato no confiable**: va delimitado en el estado y nunca puede subir la acción a `agenda_ya` por sí solo. `/api/decide` acepta solo tipos de señal conocidos y texto de máx. 300 caracteres.
- Los números del pitch salen del **set de prueba** (otra semilla + casos sucios), nunca del set con el que se ajustaron los umbrales.

## Estado (sáb 17 oct, mañana)
Hecho y desplegado (CI verde, demo en https://leads-router30x.vercel.app/, repo juanmapath/leads-router30x): motor con 9 preguntas y catálogo de 17 programas,
reglas en código (agenda exige formulario y coherencia; solo Luma; abandonos; manipulación → persona), set de prueba v3 (127 leads, otra semilla + casos sucios),
puerta de eval en CI (piso 76 %, cero errores caros), cobertura de grabaciones en CI, semana precalculada, límite de llamadas en vivo.
Set de prueba v3 (números del pitch): acción 83,5 % (con la regla de frío evidente), programa 86,3 %, categoría 82,4 %, 0 errores caros, 62 % de los errores en una persona; ~USD 0,13 por 1.000; 239 ms.
Línea base (20 leads): Jev 19/20, Sonnet 5.5 18/20; Jev ~100× más barato y ~9× más rápido. Detalle: `docs/resultados-eval.md`.
Siguiente: UI en el orden P0 → P1 → P2 de `docs/ui-plan.md`; luego playbook, README, video y entrega.
