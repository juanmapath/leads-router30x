# Plan UX v2: hablar en el idioma de 30X sin perder credibilidad

Origen: revisión externa del demo (sáb 17 oct, 10:00) y nuestra respuesta (10:20). Este plan manda sobre `docs/ui-plan.md` donde choquen.

## Qué tomamos y qué no de la revisión

**Tomamos:**
- "Le dice 'gracias'" suena amable → el titular dice **"descarta en automático"** (formulario del Inmersivo).
- Los "…" y contadores en 0 antes de hidratar son un bug → render en servidor con los totales.
- Falta la **capa de acción**: qué ve el lead y qué recibe el equipo después de la decisión. Es la pregunta "¿se rompe con mi equipo?" y lo que el brief pide ("cómo se ve funcionando").
- No se entiende **dónde vive Jev** → franja de arquitectura en la portada.

**No tomamos:**
- *"Los ms y el costo son métricas de vanidad."* Para este reto no: la pregunta del reto es literalmente "miles de veces al día, en milisegundos y por fracciones de centavo", y el jurado es el CTO evaluando viabilidad y costo de modelos. No se esconden: **se conectan con el negocio.** Los ~300 ms son lo que permite decidir *entre* el envío del formulario y la página final (un LLM de 1,7–3 s no cabe ahí). El costo se muestra como ROI: "USD 0,04 para decidir toda la semana" junto a lo que se rescata.
- *"Máquina de imprimir ingresos" con dólares gigantes.* Con la semana sintética actual, el pipeline de lista da ~USD 500.000 por semana (viable ~USD 114.000/mes). El CTO conoce las ventas reales de 30X: si la cifra es inverosímil, perdemos todo lo honesto que construimos (set sucio, calibración, puerta del CI). **Primero personas, después dólares, y dólares conservadores.**

## 0 · Antes de la UI: una semana realista (bloquea lo demás; mezcla y volumen en `docs/supuestos.md`)
Hallazgos en `data/week.json` hoy:
- 167 de 218 descartados (77 %) tienen programa: optimista.
- **Cero leads en nurturing.** Los 16 estudiantes van a "Lo revisa una persona" (10) o a "Otro programa" (6), y los 16 "solo Luma" a una persona. Contradice nuestro propio dolor ("bajar la barra llena la agenda de curiosos") y le carga 73 casos por semana (24 %) al SDR.

Trabajo:
- [ ] **Archivo separado para la semana del demo:** `data/week-leads.json` (no tocar `data/leads.json`: sus primeros 100 son el set de ajuste y los sets de prueba lo usan para su chequeo de fugas). `scripts/build-week.ts` lee el archivo nuevo.
- [ ] **Mezcla explícita y conservadora** en `data/week-mix.json` (de `docs/supuestos.md`, 250 leads), p. ej.:
  - ~45 % baja intención: estudiantes, curiosos de clase gratis, perfiles junior o independientes sin presupuesto, "solo Luma" vagos → esperado nurturing;
  - ~20 % encaja en la Inmersión (CEO listo, founder con plan de pagos);
  - ~4 % oportunidades de empresa;
  - ~23 % otro programa (repartido entre los 17);
  - ~8 % abandonos.
  Arquetipos nuevos si hacen falta ("curioso de clase gratis", "junior sin presupuesto"), con otra semilla. Chequeo de fugas contra todos los sets de prueba.
- [ ] **Diagnóstico, no ajuste:** explica por qué los estudiantes no llegan a nurturing con el catálogo de 17 (¿Jev ve un programa barato como Second Brain? ¿`ninguno` con baja confianza?). Repórtalo con 3 ejemplos y una propuesta. **No cambies umbrales ni preguntas sin aprobación**: si hay que tocar el motor, se mide en el set de prueba v3 y pasa por la puerta.
- [ ] Regrabar solo los estados nuevos (~USD 0,04), `build-week`, test de cobertura en verde.
- [ ] Documentar la mezcla y sus supuestos en `docs/resultados-eval.md` ("semana del demo").

## 1 · Una sola fuente para las cifras
- `src/engine/week-metrics.ts`: función pura `weekMetrics(rows)` con:
  - personas: `discarded` (gracias + abandono), `b2b` (empresas), `rescued` (descartados que reciben oferta: agenda_ya / otro_programa / empresas), `abandonRescue`, `doubtfulInterviews` (la regla los manda a entrevista y Jev a revisión), `toPerson`, `nurturing`;
  - `autoNextStep`: % de los 300 que reciben su siguiente paso sin intervención humana (conecta con la meta pública de 30X: 50 % de las ventas con IA);
  - dinero: `listPipelineWeek` (rescatados × precio público de su programa; corporativo con ticket supuesto marcado), `pipelinePerLead` regla vs. con Jev, escenarios de cierre;
  - operación: `costUsd`, `msMean`.
- Tests: cuadra con `data/week.json`; las columnas suman 300; nada cuenta dos veces.
- Portada, semana, guion y playbook leen de aquí.

## 2 · Portada (0:00–0:15)
- **H1:** "Cada semana, el formulario de 30X descarta en automático a **{discarded}** de {n} personas. Entre ellas, **{b2b} empresas** que venían a formar a su equipo."
  (Las empresas son el titular más defendible: la regla no puede verlas por construcción, porque quien llena el formulario no es CEO ni paga de su bolsillo.)
- **Bajada (dolor):** "Con un solo producto de USD 6.000, una barra de 7 puntos funcionaba. Con 17 programas y clientes corporativos, subirla quema oportunidades y bajarla llena la agenda de los closers de curiosos. Jev no pone una barra: decide qué hacer con cada lead."
- **Franja "dónde vive Jev"** (4 nodos; vertical en móvil):
  1. El lead envía el formulario de siempre
  2. **Jev decide en ~{msMean} ms**, antes de que cargue la página final (redirección al terminar el formulario → endpoint de Jev; supuesto A de `docs/supuestos.md`, con respaldo por webhook)
  3. **Lo que ve el lead:** calendario, oferta de su programa o página de seguimiento, en vez de "gracias"
  4. **Lo que recibe el equipo:** propiedades en HubSpot, llamada del agente de voz (Dapta) o WhatsApp
  Nota: "En el piloto, Jev corre en modo sombra: decide y registra, pero no cambia lo que ve el lead."
- Botón **Ver la semana de 30X**; se mantiene "datos sintéticos · grabaciones de llamadas reales".
- Todo renderizado en servidor: cero "…", cero contadores en 0.

## 3 · La semana (0:15–0:45)
- En reposo muestra el resultado final; "Repetir la semana" anima desde 0; `prefers-reduced-motion` sin viaje.
- **Tres contadores grandes, en personas:**
  1. **{b2b} oportunidades de empresa** que la regla descartó
  2. **{rescued} personas con una oferta** de otro programa de 30X
  3. **{doubtfulInterviews} entrevistas protegidas**: la regla las mandaba a un closer; Jev pide revisarlas antes
- **Fila de operación:** {autoNextStep} % recibe su siguiente paso sin intervención humana · {abandonRescue} abandonos contactados en minutos · {nurturing} siguen en nurturing · {toPerson} revisa una persona.
- **ROI en una línea:** "Decidir los {n} costó **USD {costUsd}** ({msMean} ms por lead). Pipeline de lista rescatado: **USD {listPipelineWeek}** por semana."
- **Escenarios:** selector con **pesimista por defecto** → ventas por mes, marcado como supuesto, con el desglose por programa plegado y la advertencia "mezcla sintética; en el piloto se mide con los leads reales".
- Prueba de cordura antes de publicar: si la cifra pesimista mensual parece grande para el tamaño de 30X (equipo de 10–12 personas), se baja la mezcla, no se esconde el supuesto.

## 4 · Qué pasa en el milisegundo siguiente — capa de acción (0:45–1:20)
Sección nueva después de la semana. Titular: **"Lo que cambia para el lead y para el equipo."** **Un solo caso, muy bien hecho:** el gerente de innovación de multinacional con 5+ cupos (regla 2/10).

Tres columnas:
- **Hoy, lo que ve el lead:** maqueta de teléfono con la página genérica "Gracias por tu aplicación". Fin.
- **Con Jev, en ~300 ms:** maqueta con "Agenda una llamada con el área de empresas" (calendario) y, debajo, el WhatsApp que recibe a los +2 min del AE de empresas. Línea pequeña: "Esto solo es posible porque la decisión llega antes que la página: un LLM general tarda 1,7–3 s."
- **Lo que recibe el equipo:** tarjeta tipo CRM con las propiedades que escribe Jev (acción, programa, categoría, probabilidades, objeción probable, canal, revisar sí/no) y a quién se asigna.

Reglas:
- Mensajes = **plantillas fijas por acción y programa** en `src/engine/actions.ts`, con test de que toda combinación posible tiene una. Nada generado por LLM (redacción con IA = fase 2).
- Maquetas genéricas, marcadas "maqueta": sin identidad visual de 30X, sin teléfonos reales.
- "Lo revisa una persona" nunca muestra oferta: muestra "un asesor te escribe hoy".
- P2: el mismo componente debajo de la tarjeta de Jev en el zoom y en "Pruébalo tú" (con antes → después del simulador).

## 5 · Orden de la página y guion
0. Portada: empresas descartadas + dolor + dónde vive Jev (0:00–0:15)
1. La semana: personas, operación, ROI (0:15–0:45)
2. Capa de acción: un caso (0:45–1:20)
3. Pruébalo tú en vivo (1:20–1:50)
4. Por qué confiar: calibración, Jev vs LLM, costo y velocidad (1:50–2:25)
5. Cómo lo adopta 30X: franja de arquitectura + modo sombra + el pedido (2:25–3:00)
El zoom queda en la página para el jurado, fuera del guion.
Actualizar `docs/guion-pitch.md` y `docs/playbook.md` con el titular, las métricas en personas, el % con siguiente paso automático y la idea de los 300 ms.

## Prioridades
- **P0:** semana realista (sección 0) · `week-metrics.ts` · titular, bajada y render en servidor · contadores en personas + ROI.
- **P1:** capa de acción (un caso) · franja "dónde vive Jev" · guion y playbook al día.
- **P2:** capa de acción en zoom y "Pruébalo tú" · dos casos más.

## Supuestos (sin mentoría)
No hubo validación con 30X: todos los números de negocio salen de `docs/supuestos.md` (volumen, mezcla, tasas de cierre, ticket, prueba de cordura y dónde vive Jev) y se muestran como supuestos. La mezcla de la sección 0 es la de ese archivo (45 / 20 / 23 / 4 / 8 %) y la semana es de 250 leads.

## Cómo se verifica
- [ ] `curl` de la página sin JS: titular y contadores con números; nada de "…" ni "0".
- [ ] Cifras de portada, semana, guion y playbook salen de `weekMetrics` y coinciden.
- [ ] La semana tiene nurturing > 0 y la mezcla está documentada como supuesto.
- [ ] Toda acción posible tiene plantilla (test).
- [ ] Prueba de 5 segundos con alguien que no conoce el proyecto, desde el celular: ¿qué pierde 30X hoy y dónde se conecta Jev?
- [ ] 1440 px y 390 px; claro y oscuro; `prefers-reduced-motion`; `npm test && npm run build`; push y revisión en Vercel.
