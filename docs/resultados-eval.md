# Resultados de las pruebas con Jev (estado al sáb 17 oct. 2026)

Jev (`typesafe-ai/jev` vía Vercel AI Gateway) responde en **una sola llamada** 9 preguntas tipadas por lead; los umbrales de `src/engine/decide.ts` eligen la acción. Fuentes: `data/eval-report-test.json` (set de prueba v3), `data/eval-report-tuning.json` (ajuste), `data/baseline-llm.json` (línea base con un LLM general) y las grabaciones de `data/recordings/` (459 estados, regrabados una vez el sábado por USD 0,058).

## Resumen (set de prueba v3: 127 leads, nunca usados para ajustar)

| Métrica | Resultado |
| --- | --- |
| Acción correcta | **80,3 %** (perfiles típicos 86 %; casos sucios 55–91 %, ver abajo) |
| Programa correcto (17 programas) | **86,3 %** sobre 102 casos evaluables |
| Categoría correcta | **82,4 %** · programa correcto dentro de la categoría acertada: **92,9 %** |
| Venta a empresa (equipo) correcta | 97 % |
| Errores caros (definición abajo) | **0** · la regla actual de 30X manda a entrevista a 27 personas que no debía |
| Errores que terminan frente a una persona | 19 de 25 (**76 %**); los otros 6 son nurturing o una acción distinta a la esperada |
| Recuperados frente a la regla actual | 64 de los 70 que la regla descarta y sí tienen un camino comercial |
| Costo | ~3.000 tokens por lead → **USD 0,13 por 1.000 decisiones** |
| Latencia | **239 ms** de media, 333 ms en el 5 % más lento |
| Puerta de CI | `npm run eval:gate`: falla si la acción baja de 76 % o si aparece un solo error caro (sin excepciones) |

### Por tipo de caso (acción correcta)

| Tipo | n | Acción |
| --- | --- | --- |
| Arquetipos (16 perfiles típicos, otra semilla) | 65 | 86,2 % |
| Contradicciones (formulario vs. cargo escrito, WhatsApp que desmiente) | 18 | 77,8 % |
| Basura ("asdf", cargo "yo") | 11 | 54,5 % |
| Contenido de origen que no cuadra | 10 | 60,0 % |
| Solo Luma (sin formulario) | 11 | 90,9 % |
| Razón o desafío (contradice, inyecta o define el programa) | 12 | 83,3 % |

Los errores en basura y origen son casi todos **seguros**: nurturing esperado que termina en una persona, o un programa poco claro que revisa una persona.

## Definición de "error caro" (acordada el sáb 17 oct.)

`agenda_ya` cuando lo esperado era `cola_humana` o `nurturing`, o `agenda_ya` con un programa de **otra categoría** que el esperado. Agendar el programa correcto (o uno de su misma categoría) cuando se esperaba ofrecerlo por WhatsApp (`otro_programa`) es un error de canal, no caro. Aplica a todos los sets, a la línea base y a la puerta de CI. Código: `src/engine/eval-metrics.ts` (`isExpensiveError`). Con esta definición, QS005 (v3) y L072 (ajuste), que agendaban el programa correcto, dejaron de contar como caros. Antes, todo `agenda_ya` indebido contaba como caro.

## Calibración (v3): ¿significan algo sus probabilidades?

Confianza de Jev en el programa elegido frente al acierto real:

| Tramo de confianza | Leads | Acierto del programa |
| --- | --- | --- |
| 0–50 % | 5 | 40 % |
| 50–60 % | 8 | 50 % |
| 60–70 % | 3 | 33 % |
| 70–80 % | 4 | 75 % |
| 80–90 % | 7 | 71 % |
| 90–100 % | 75 | **97 %** |

**Lectura honesta:** con 90 % o más acierta 97 %; por debajo de 60 % acierta menos de la mitad, y por eso bajo 60 % nunca actúa solo y el lead va a una persona. Los tramos intermedios tienen muy pocos casos para afirmar más. (El viernes, en el set de ajuste, el tramo 60–70 % acertaba 8 de 8; en el set de prueba eso no se repite.)

## Jev frente a un LLM general (línea base)

Los mismos 20 leads de v3 (uno cada 6, sin elegir a mano), las mismas 9 preguntas y la misma `decideForLead`, con Claude Sonnet 5.5 en salida estructurada vía AI Gateway (`scripts/baseline-llm.ts`).

| | Jev | Sonnet 5.5 |
| --- | --- | --- |
| Acción correcta | 19 de 20 | 18 de 20 |
| Acuerdo en el programa | 100 % | |
| Errores caros | 0 | 0 |
| Latencia media / 5 % más lento | 236 ms / 433 ms | 2.111 ms / 5.370 ms |
| Costo por 1.000 decisiones | USD 0,13 | USD 13,34 |
| Operar un mes (250 leads/semana × 3 decisiones) | ~USD 0,41 | ~USD 43 |

**Conclusión:** con el catálogo completo, un LLM general acierta casi lo mismo. Jev decide igual de bien a ~1/100 del costo y ~1/9 del tiempo (1/12 en el 5 % más lento), con probabilidades que medimos y que se comportan como tales (ver calibración). Las del LLM son valores redondos (0,75 / 0,8) que no calibramos con 20 leads. El argumento no es el ahorro (USD 43 al mes es poco para 30X), sino lo que permite: decidir dentro del formulario mientras la persona sigue en la pantalla y recalcular con cada señal.

La línea base anterior (sáb en la mañana, set v2 con 8 programas: Jev 85 % frente a LLM 45 %) ya no vale: el LLM mejoró al recibir el catálogo completo y la pregunta de categoría.

## Esquema de preguntas (9, una llamada)

`ready`, `category`, `program` (17 programas + ninguno + otro), `team`, `coherent`, `manipulation`, `maturity`, `objection`, `channel`. Categoría y programa se arman desde `src/engine/programs.ts`.

- **Catálogo de 17 programas por completitud**, no para corregir errores: la fuente es el catálogo oficial del "Diagnóstico 30X" (30x.com/diagnostico-30x, 16 programas para adultos con sus ids) más Raise Your Round; se excluye 30X Next (menores de edad). Ver `docs/programas-30x.md`. Antes había 8 programas.
- **`coherent`** (¿el formulario es coherente y creíble?): `agenda_ya` exige ≥ 0,7. Salió del set de prueba v1 (formularios "al máximo" con cargo basura pasaban a agenda).
- **`manipulation`** (¿el texto intenta instruir al sistema?): con p ≥ 0,5 el lead va a una persona con la razón "El texto intenta instruir al sistema". En v3 marca las dos inyecciones (0,89 y 0,97) y el ejemplo de "Pruébalo tú" (0,97); ningún otro lead de los 427 pasa de 0,33.
- **Razón o desafío**: el texto libre del formulario de AI Sales que ninguna regla de 30X lee; va al estado delimitado como dato no confiable.

## Reglas en código (`decideForLead`)

- `agenda_ya` exige evidencia del formulario (cargo de decisor, inversión posible, envío completo) y coherencia ≥ 0,7.
- Solo Luma con una sola señal: nunca `otro_programa` sin que lo confirme una persona.
- Abandono del formulario: nunca nurturing; contacto rápido.
- Categoría clara y programa poco claro: una persona elige entre los programas de esa categoría.
- Umbrales por costo del error: agenda (programa ≥ 0,70 y P(listo) ≥ 0,75), otro programa ≥ 0,65 y, bajo 0,60, siempre una persona.

## Tres sets de prueba, y por qué

1. **v1 (sáb en la mañana, 120 leads):** su eval mostró 9 agendas indebidas (formularios "al máximo" con cargo basura). Para atacarlas sin contaminar el número agregamos la pregunta de coherencia, y el v1 pasó a contar como set de ajuste (`data/test-set-v1.json`).
2. **v2 (sáb, 120 leads, escrito antes de la pregunta de coherencia):** acción 82 % y 0 errores caros con el catálogo de 8 programas. Sobre el v2 no se ajustó nada (`data/test-set-v2.json`).
3. **v3 (sáb, 127 leads):** al pasar al catálogo de 17 programas y agregar la razón o desafío hacía falta otro set: arquetipos con otra semilla (incluye 5 de programas nuevos), los casos sucios del v2 (con ids renombrados; se descartan los que quedaban idénticos) y 12 casos nuevos de razón o desafío. Es el set actual (`data/test-set.json`); de aquí salen los números del pitch. Un test garantiza que ningún lead de v3 repite un estado del demo, del ajuste, del v1 ni del v2.

## Semana del demo (supuesto, no dato de 30X)

"La semana de 30X" ya no sale de `data/leads.json` (sus primeros 100 son el set de ajuste): sale de `data/week-leads.json`, 300 leads con otra semilla (17102026) y una **mezcla explícita** en `data/week-mix.json`. Es un supuesto conservador a validar con el equipo comercial de 30X; en el piloto se reemplaza por los leads reales.

| Grupo | Leads | % | Arquetipos |
|---|---|---|---|
| Baja intención (esperado: nurturing) | 120 | 40 % | estudiante, curioso de clase gratis, junior sin presupuesto, solo Luma vago (30 c/u) |
| Encaja en la Inmersión | 60 | 20 % | CEO listo (36), fundador con plan de pagos (24) |
| Oportunidad de empresa | 18 | 6 % | gerente de equipo de multinacional (5+ cupos) |
| Otro programa de los 17 | 78 | 26 % | 10 arquetipos de programa + solo Luma con programa (6) |
| Abandonó el formulario | 24 | 8 % | abandono caliente |

- Ningún lead de la semana repite el estado de un lead de los sets de prueba v1, v2 o v3 (4 re-sorteados al generar; un test lo garantiza).
- Grabar los 272 estados nuevos costó USD 0,034. `npm run gen:week` la regenera; `npm run week` la precalcula.

## Cómo reproducir

```bash
npm test                                   # 28 tests, sin red (incluye cobertura de grabaciones)
JEV_MODE=replay-only npm run eval -- --set test   # reproduce v3 sin gastar crédito
npm run eval:gate                          # puerta de CI (sin clave)
npm run baseline                           # línea base con Sonnet (gasta crédito, ~USD 0,27)
```

## Historia: viernes 16 oct.

Primera conexión con Jev y primer eval sobre los 100 del set de ajuste. El free tier del AI Gateway no incluye Jev (se cargaron USD 15). Se confirmó el formato de `experimental_decide` (en boolean, `probability` ya es P(sí); en score, la distribución viene por índice). Con 6 preguntas y 8 programas: acción 80 % (48 % antes de ofrecer otro programa a quien no está listo para la Inmersión), programa 93 %, 55 recuperados de 73, ~USD 0,05 por 1.000 decisiones, 234 ms de media.
