# Plan hasta la entrega

## Viernes noche
- [x] PRD y diagnóstico
- [x] Repo, motor, regla actual, datos sintéticos, verificador, CI
- [ ] `npm install` y `npm run ping`; ajustar `src/engine/jev.ts` (formato de preguntas y `normalize`) al formato real
- [ ] Repo público en GitHub + deploy en Vercel con `AI_GATEWAY_API_KEY`

## Sábado mañana
- [ ] `npm run eval` (grabando) → revisar errores por arquetipo; ajustar estado/preguntas, no los tests
- [ ] Gráfica de calibración → fijar `THRESHOLDS` con datos
- [ ] Revisar a mano las etiquetas de `data/eval-set.json` (vienen del arquetipo)
- [ ] Mentoría con Sandra Carrillo (cifras reales)

## Sábado tarde
- [ ] UI final: comparador lado a lado (regla vs Jev), simulador de señales (Luma, WhatsApp, abandono) que recalcula en vivo, bandeja del vendedor, cola humana
- [ ] Panel de métricas: precisión, calibración, leads recuperados, costo por 1.000 decisiones, latencia (Jev vs LLM)
- [ ] Guardrail de mensajes (Sonnet redacta, Jev revisa) — solo si sobra tiempo
- [ ] Mentoría con Alfredo (Jev)

## Sábado noche (congelar features a medianoche)
- [ ] `docs/playbook.md` (≤ 5 páginas): decisiones, preguntas, umbrales, quién opera, cómo se mide, costo mensual estimado a 300 leads/semana
- [ ] Grabar todas las respuestas usadas en el demo (modo replay en Vercel)

## Domingo
- [ ] README final, prueba en otro dispositivo y móvil, verificador en verde
- [ ] Ensayar el guion de 3 min (ver PRD) ×3; grabar video + video de respaldo
- [ ] Entregar antes de las 11:30 a. m.
- [ ] Después de entregar: revocar la clave del AI Gateway

## Guion del demo (resumen)
1. 0:00 Problema con cifra (200–300 leads/semana, meta 50 % ventas con IA, regla de puntos).
2. 0:25 Wow: gerente de multinacional → regla 2/10 "gracias"; Jev → equipo para 10 personas (área de empresas) en ~200 ms.
3. 1:10 Señal nueva (clase de Luma) → recalcula en vivo.
4. 1:45 Por qué confiar: precisión, calibración, recuperados, costo y latencia.
5. 2:20 Implementación: playbook, costo mensual, "pedimos una semana de piloto con su formulario y HubSpot".
