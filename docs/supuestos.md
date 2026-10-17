# Supuestos de negocio (sin datos internos de 30X)

No pudimos validar con 30X (los enlaces de mentoría no funcionaron). Estos son **nuestros supuestos, conservadores a propósito**. Cada uno dice de dónde sale y cómo se valida en la semana en modo sombra. La página, el guion y el playbook los muestran como supuestos y usan **estos** números, no otros.

## Volumen y tamaño de 30X
| Supuesto | Valor | De dónde sale |
| --- | --- | --- |
| Leads por semana del formulario | **250** | Punto medio de los 200–300 que se dijeron en el podcast con Dapta |
| Alumnos por año | ~1.000 | Web: +3.100 alumnos ejecutivos; kickoff: +4.000 formados, en ~3–4 años |
| Ticket realizado promedio | ~USD 1.800 | Mezcla de precios públicos (USD 1.000–6.000), con descuentos y planes de pago |
| **Ventas mensuales estimadas de 30X** | **~USD 150.000** | 1.000 alumnos × USD 1.800 / 12. Solo sirve como prueba de cordura |
| Ticket realizado por programa | **85 % del precio público** | Descuentos, reservas y planes de pago |
| Ticket de un plan corporativo | **USD 7.500** | 5 cupos × USD 1.500 |

## Mezcla de una semana (para `data/week-mix.json`)
| Grupo | % | Acción esperada |
| --- | --- | --- |
| Baja intención: estudiantes, curiosos de clase gratis, junior o independientes sin presupuesto, "solo Luma" vago | **45 %** | Nurturing (o una persona si es ambiguo) |
| Encaja en la Inmersión: CEO o founder con presupuesto y decisión | **20 %** | Agenda ya |
| Otro de los 17 programas | **23 %** | Otro programa |
| Viene por su empresa (equipo, 5+ cupos) | **4 %** | Área de empresas |
| Abandonó el formulario | **8 %** | Contacto rápido / una persona |

Por qué así: los formularios de 30X piden poco; el embudo empieza en clases gratis de Luma (atraen curiosos) y Nicolás Rojas dijo que "mucha gente pone cualquier cosa en el formulario". Preferimos subestimar las oportunidades.

## Tasas de cierre sobre lo que Jev rescata (escenarios)
| Acción | Pesimista | Viable | Optimista |
| --- | --- | --- | --- |
| Otro programa (oferta por WhatsApp a quien la regla descartó) | 1,5 % | 3 % | 5 % |
| Área de empresas (oportunidad de equipo) | 3 % | 6 % | 10 % |

Referencia: en embudos de aplicación de alto ticket, la solicitud cierra ~5–10 %; aquí son leads que la regla descartó, así que van muy por debajo. **Pesimista por defecto** en la página.

## Prueba de cordura (obligatoria antes de publicar cualquier cifra en dólares)
- Ingreso incremental mensual **pesimista ≤ 10 %** de las ventas mensuales estimadas (≤ ~USD 15.000).
- **Viable ≤ 25 %** (≤ ~USD 37.500).
- Si no se cumple, se corrige la mezcla o la tasa (y se documenta), nunca se esconde.
- Orden de magnitud esperado con estos supuestos: ~USD 15.000–35.000 al mes. Se dice como "del orden de", no con decimales.

## Dónde vive Jev
- **Supuesto A (preferido):** el formulario permite redirigir al terminar a una URL con el id de la respuesta (Typeform lo permite en sus pantallas finales). La URL llama a Jev (~300 ms) y redirige al calendario, a la oferta o a la página de seguimiento. **Aquí los ms importan:** un LLM de 1,7–3 s no cabe antes de que cargue la página.
- **Supuesto B (respaldo):** si no se puede redirigir, Jev actúa por webhook en < 1 s: la página final no cambia, pero el primer contacto (llamada del agente de voz, WhatsApp o AE de empresas) sale en el primer minuto.
- En ambos casos el piloto empieza **en modo sombra**: Jev decide y registra en HubSpot, sin cambiar nada de lo que ve el lead.

## Cómo se valida en la semana en modo sombra
Mezcla real (proporción por acción) · tasa de cierre de los rescatados que el equipo contacte · cuántos "gracias" de hoy reciben algún contacto · si el formulario puede redirigir · tiempo al primer contacto.
