# Contexto del reto: JEV en 30X

## Brief (resumen fiel)
**Pregunta:** ¿Qué decisiones de 30X podría tomar JEV miles de veces al día, en milisegundos y por fracciones de centavo, y cómo se ve eso funcionando? Área a elegir: comercial, media o tech. Tipo: explorar una oportunidad.

**Qué es JEV:** primer modelo público de TypeSafe AI. No conversa ni escribe: decide. Recibe un estado (perfil, post, correo, fila de datos) y un set de preguntas tipadas; devuelve todas las respuestas en una pasada, cada una con probabilidad calibrada.
- Choice: elige entre opciones (hasta 255), con probabilidad por opción.
- Score: escala ordenada con nivel de confianza.
- Booleano (Noul en la API de TypeSafe; `boolean` en el AI SDK): sí/no con probabilidad.
- "System One" (Kahneman): Jev decide rápido; un LLM redacta, explica o razona.
- 70–500 ms, USD 0,042 por millón de tokens de entrada, salida gratis, 32k tokens de contexto.
- Límites: puede equivocarse con confianza; no cuenta, no hace aritmética ni compara fechas (eso va en el código); rinde mejor con preguntas simples combinadas en código. Buen diseño: opción "otro", umbrales de confianza, camino a una persona.

**Ideas que le interesan a 30X:** clusterización dinámica (segmento que se recalcula al inscribirse en Luma), calificación de contenido, alertas de riesgo de abandono en programas, guardrails para agentes internos.
**No entra:** clones de personas de 30X; suponer que 30X vende algo que no vende.
**Entregable:** playbook (máx. 5 páginas u 8 slides) + prototipo funcional con repo público, que corra fuera de los sistemas de 30X.
**Restricción:** nada de datos personales reales.

## Reglas del hackathon
Equipos de 1 a 5, un proyecto por equipo, sin extensiones. Entrega domingo 18 antes de 11:59 a. m.: video pitch ≤ 3 min, demo desplegado, repo público coherente con el demo. Domingo tarde: 10 finalistas por reto (anuncio ~6 p. m.), demo en vivo al jurado de cada empresa. Ganadores el miércoles. Premio: USD 500 por reto; el mejor proyecto global gana cupos en programas 30X. Extra: "construye en público" en Instagram (reels/carruseles, no stories) → grupo de WhatsApp "construye en público".

## Evaluación
30 % impacto en el reto · 20 % innovación (más allá de lo obvio, IA con intención) · 20 % viabilidad técnica (funciona, el código lo respalda) · 20 % viabilidad de implementación (¿la empresa lo puede adoptar con sus restricciones reales? stack, costo de modelos) · 10 % presentación.

## Lo que aprendimos en las charlas de preparación (aplicar)
- Resolver el problema estratégico, no el requerimiento; ligarlo a la cifra que la empresa reporta.
- Diseñar hacia atrás desde el demo de 3 min; lo que no sale en el demo no existe.
- Un dolor resuelto muy bien > muchas features. Momento "wow" en el primer minuto.
- Verificador antes que código; tests específicos, no "200 OK". Los agentes no editan el verificador.
- Hacerlo implementable: secretos fuera del repo, manejo de errores, observabilidad, **costo de operación**, datos sintéticos realistas, validar entradas contra prompt injection.
- Deploy en Vercel desde el día uno; video de respaldo; probar en móvil y otro dispositivo.
- Pitch para quien decide: problema con cifra → solución en acción → impacto → qué pedimos (piloto concreto). Sin "la novela".
- README: primero lo que le importa a la empresa, luego arquitectura y cómo correrlo.
