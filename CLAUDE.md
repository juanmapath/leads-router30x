# Jev Lead Router · 30X — contexto para Claude Code

Proyecto del **Hackathon 30X** (16–18 oct. 2026), reto **"JEV en 30X"**, área **comercial**.
Equipo: Juan Manuel (producto, decisiones, pitch) + Claude (código, datos, tests, docs). Responde en español.

## Qué estamos construyendo
30X (escuela de negocios para founders y ejecutivos LatAm) califica sus leads con una **suma fija de puntos** en su formulario público: más de 6/10 pasa a entrevista; el resto ve "Gracias por tu aplicación" y sale del embudo. **Jev Lead Router** reemplaza esa suma por decisiones calibradas de **Jev** (modelo de clasificación de TypeSafe AI): en una sola llamada de milisegundos responde 6 preguntas tipadas por lead; umbrales en código eligen la acción (agenda ya, otro programa, área de empresas, nurturing, cola humana). Un LLM solo redactaría mensajes. Cada señal nueva recalcula.

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
npm run eval      # 100 etiquetados por Jev → data/eval-report.json (precisión, calibración, costo, latencia)
npm run dev       # http://localhost:3000
```
Requiere `.env.local` con `AI_GATEWAY_API_KEY` (Vercel AI Gateway). **Nunca** commitear `.env.local` ni pegar la clave en código, logs o README.

## Arquitectura (una sola app Next.js, un repo)
- `src/engine/` — lógica pura, testeable sin UI:
  - `types.ts` tipos · `programs.ts` catálogo real de 30X
  - `legacy.ts` **réplica exacta** de la regla pública de 30X (ver docs/hallazgos-30x.md). No cambiar sin actualizar tests.
  - `state.ts` convierte un lead en texto en español para Jev. Sin nombre ni correo. Los números van ya interpretados en palabras (Jev no hace aritmética).
  - `questions.ts` 6 preguntas tipadas (+ guardrail de mensajes).
  - `jev.ts` adapta preguntas al AI SDK y **normaliza** la respuesta cruda (formato aún no confirmado: ajustar aquí tras `npm run ping`). `ready.p` y `team.p` = probabilidad de "sí".
  - `decide.ts` umbrales → acción. Determinístico. Umbrales en `THRESHOLDS`; se ajustan con la calibración de `npm run eval`, no a ojo.
  - `jev-client.ts` llamada vía `experimental_evaluate` del paquete `ai`, modelo `typesafe-ai/jev`, con **grabar/reproducir** (`JEV_MODE` = live | record | replay; local: record; Vercel: replay) y reintentos ante 429.
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
- Free tier del AI Gateway tiene límites estrictos (429): una llamada por lead con las 6 preguntas, grabar y reutilizar. **No comprar créditos** (se pierde el crédito gratis de USD 5/mes).

## Estado (vie 16 oct, noche)
Hecho: motor, regla actual replicada, 300 leads + 100 etiquetados, verificador (8 tests), CI, página mínima.
Jev conectado (crédito pagado en el AI Gateway: el free tier no incluye `typesafe-ai/jev`). `jev.ts` usa `experimental_decide` y el formato real
(boolean.probability = P(sí); choice con distribución; score por índice; `refusal` → cola humana). Ping y eval grabados en `data/recordings/`.
Eval (100): acción 80 %, programa 93 %, empresa 100 %; recupera 55 de 73 que la regla actual descarta; ~USD 0,05 por 1.000 decisiones; 234 ms media.
Cambio en `decide.ts` tras el eval: programa claro distinto al Inmersivo → `otro_programa` aunque `ready` sea bajo (`ready` mide el Inmersivo).
Pendiente: decidir umbrales (`readyHigh` 0,8 deja fuera founders con plan de pagos en 0,79; `program` 0,7 manda gerente_comercial 0,61–0,68 a persona),
CMO → Jev elige AI for Executives en vez de Growth Rockstar, push a GitHub, deploy en Vercel. Luego ver `docs/plan.md`.
