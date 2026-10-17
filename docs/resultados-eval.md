# Resultados de las pruebas con Jev (vie 16 oct. 2026)

Primera conexión real a Jev (`typesafe-ai/jev` vía Vercel AI Gateway) y primera evaluación sobre los 100 leads sintéticos etiquetados. Commit: `0ac4652`. Fuente de los números: `data/eval-report.json` y las grabaciones de `data/recordings/`.

## Resumen

| Métrica | Resultado |
| --- | --- |
| Acción correcta (eval de 100) | **80 %** (antes del ajuste de `decide.ts`: 48 %) |
| Programa correcto (respuesta de Jev) | **93 %** |
| Venta a empresa correcta (respuesta de Jev) | **100 %** |
| Leads recuperados frente a la regla actual | **55 de 73** que la regla descarta y sí tienen un programa (antes del ajuste: 23) |
| Errores que terminan en una persona (error seguro) | 19 de 20 |
| Costo | ~1.250 tokens por lead → **USD 0,00005 por decisión, ~USD 0,05 por 1.000** |
| Latencia (6 preguntas, una llamada) | **234 ms** de media, 347 ms p95 |

La regla actual de 30X (suma de puntos > 6) manda a entrevista a 20 de los 100 leads; los otros 80 ven "Gracias por tu aplicación". De esos 80, 73 tenían un camino comercial (otro programa, plan corporativo o revisión humana).

## 1. Acceso a Jev

- El **free tier** del AI Gateway (USD 5/mes) **no incluye Jev** ni sus versiones fijadas (`jev-1.13.0`, `jev-1.14.0`): responde "Free tier users do not have access to this model".
- Se cargaron USD 15 de crédito pagado en Vercel. Todo el eval costó menos de un centavo.
- Precio publicado en el catálogo: USD 0,042 por millón de tokens de entrada; la salida no se cobra.

## 2. Formato real de la respuesta (`experimental_decide`, ai 7)

Ping con el lead `gerente_equipo_multinacional` (la regla actual le da 2 puntos → "gracias"):

| Pregunta | Respuesta cruda | Lectura |
| --- | --- | --- |
| `ready` (boolean) | `{ probability: 0.14 }` | P(sí) = 14 % |
| `program` (choice) | `{ choice: "corporativo", probabilities: { corporativo: 0.77, ai_executives: 0.23, … } }` | Plan corporativo, 77 % |
| `team` (boolean) | `{ probability: 0.91 }` | P(sí) = 91 % |
| `maturity` (score) | `{ score: 0.95, probabilities: { "0": 0.13, "1": 0.79, "2": 0.08 } }` | media, 79 % |
| `objection` (choice) | `precio` 0,53 / `decisor` 0,47 | precio, 53 % |
| `channel` (choice) | `vendedor` 0,54 | vendedor, 54 % |

Decisión: **empresas** (área corporativa), en 363 ms. `rounding`: 2 decimales; `warnings`: ninguno.

Cambios que esto exigió en `src/engine/jev.ts`:
- En boolean, `probability` **ya es P(sí)**: el `normalize` inicial lo invertía cuando no venía un `value`.
- En score, `score` es la posición del nivel (0–2), no una probabilidad: se toma el nivel más probable de la distribución.
- Sin distribución, la confianza de un choice se toma como 0 (lo conservador: va a persona).
- Si Jev se niega (`refusal`) o falta la respuesta en `ready`, `program` o `team`, el lead va a cola humana. Hay test.

## 3. Resultados por arquetipo

| Arquetipo | n | Regla actual → entrevista | Acción esperada | Aciertos | Lo que hizo el motor | P(listo) | Confianza en programa |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ceo_listo | 13 | 13 | agenda_ya | 13/13 | agenda_ya 13 | 0,82–0,88 | 1,00 |
| founder_plan_pagos | 7 | 7 | agenda_ya | 5/7 | agenda_ya 5, cola_humana 2 | 0,78–0,84 | 1,00 |
| gerente_equipo_multinacional | 15 | 0 | empresas | 15/15 | empresas 15 | 0,12–0,14 | 0,70–0,88 |
| founder_pequeno_ventas | 14 | 0 | otro_programa (Sales Machine) | 14/14 | otro_programa 14 | 0,27–0,33 | 0,93–0,97 |
| founder_ronda | 14 | 0 | otro_programa (Fundraising) | 14/14 | otro_programa 14 | 0,34–0,41 | 0,96–0,99 |
| perfil_tecnico | 6 | 0 | otro_programa (AI for Developers) | 4/6 | otro_programa 4, cola_humana 2 | 0,08–0,09 | 0,47–0,84 |
| gerente_comercial | 8 | 0 | otro_programa (AI Sales) | 0/8 | cola_humana 8 | 0,33–0,40 | 0,61–0,68 |
| cmo_growth | 7 | 0 | otro_programa (Growth Rockstar) | 0/7 | cola_humana 7 | 0,15–0,18 | 0,47–0,56 |
| abandono_caliente | 9 | 0 | cola_humana | 8/9 | cola_humana 8, nurturing 1 | 0,47–0,57 | 0,98–1,00 |
| estudiante | 7 | 0 | nurturing | 7/7 | nurturing 7 | 0,06–0,07 | 0,72–0,87 |

## 4. Calibración (confianza en el programa vs. acierto)

| Tramo de confianza | Leads | Acierto del programa |
| --- | --- | --- |
| 0–50 % | 3 | 33 % |
| 50–60 % | 6 | 17 % |
| 60–70 % | 8 | 100 % |
| 70–80 % | 10 | 100 % |
| 80–90 % | 16 | 100 % |
| 90–100 % | 57 | 100 % |

Las probabilidades de Jev se comportan como deben: con 60 % o más de confianza acierta siempre; por debajo de 60 % casi nunca. Eso valida usar un umbral para decidir cuándo actúa solo y cuándo pasa a una persona.

## 5. Ajuste en `decide.ts` tras el eval

**Problema (acción 48 %):** `ready` pregunta si la persona está lista para la conversación comercial, que en la práctica es la del Inmersivo. Un founder pequeño con Sales Machine claro (programa al 95 %) tiene `ready` bajo (≈ 0,3) y el motor lo mandaba a nurturing. 32 de los 52 errores eran eso.

**Cambio:** si el programa es claro (≥ 0,7) y no es el Inmersivo, se ofrece ese programa aunque `ready` sea bajo. Nurturing queda para quien no tiene programa (`ninguno`) o no está listo para el suyo. Primero se escribió el test (falló), luego el cambio (pasa). El test de "la zona dudosa siempre pasa por una persona" no se tocó.

**Resultado:** acción 48 % → 80 %; recuperados 23 → 55.

## 6. Errores que quedan (20) y decisiones pendientes

| Caso | Errores | Causa | Opción |
| --- | --- | --- | --- |
| gerente_comercial → cola humana | 8 | Jev acierta AI Sales, pero con 0,61–0,68 de confianza, bajo el umbral de programa (0,7) | Bajar `program` a 0,6 lo recuperaría (la calibración 60–70 % acierta 8/8), pero se cruzaría con el test de zona dudosa, que usa 0,6. Decisión de producto. |
| cmo_growth → cola humana | 7 | Jev elige AI for Executives (~0,5) en vez de Growth Rockstar | Revisar la descripción de Growth Rockstar en la pregunta o las señales del estado. Hoy el error es seguro: decide una persona. |
| founder_plan_pagos → cola humana | 2 | `ready` de 0,78–0,79, apenas bajo `readyHigh` (0,8) | El siguiente grupo (abandono caliente) llega a 0,57 como máximo; bajar `readyHigh` a ~0,75 dejaría margen. |
| perfil_tecnico → cola humana | 2 | Confianza en AI for Developers de 0,47–0,57 | Error seguro; sin cambio por ahora. |
| abandono_caliente → nurturing | 1 | `ready` 0,47, justo bajo `readyLow` (0,5) | Es el único error que **no** pasa por una persona. Vigilar. |

**Cuidado con el sobreajuste:** los leads son sintéticos y salen de 10 arquetipos. Los umbrales deben moverse solo con margen claro en la calibración, no para exprimir este set.

## Cómo reproducir

```bash
npm test                      # 8 tests, sin red
JEV_MODE=replay npm run eval  # reproduce las grabaciones, sin gastar crédito (PowerShell: $env:JEV_MODE='replay'; npm run eval)
npm run eval                  # vuelve a llamar a Jev (record) y regraba
npm run ping                  # un lead, respuesta cruda en data/recordings/_ping.json
```
