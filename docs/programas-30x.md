# Catálogo de 30X para Jev (revisado en 30x.com el 16 oct. 2026, 23:45)

Fuente única para `src/engine/programs.ts`: la pregunta `program` de Jev debe armarse desde ahí (hoy está duplicada en `questions.ts`).
Jev solo sabe lo que va en cada llamada: estas descripciones son su único contexto sobre los programas.

| Programa | Precio público | Formato / próxima edición | Cómo se compra (CTA de la landing) |
| --- | --- | --- | --- |
| Inmersivo presencial | USD 6.000 (Miami USD 10.000) | 3 días presencial · Caracas 21–23 oct, Bogotá 26–28 oct, Miami 19–21 nov, CDMX 24–26 nov | Formulario con puntaje `form.30x.com/to/inmersivo-presencial-30x` |
| AI for Executives | USD 2.000 (reserva USD 500 reembolsable) | 8 semanas, sesiones en vivo | Checkout directo `checkout.30x.com/checkout/executives` (sin calificación) |
| AI for Developers | USD 1.500 (la versión en inglés dice 2.000) | 12 sesiones de 2 h · inicia 9 nov, lun y mié 7–9 p. m. COT | No se detectó formulario |
| AI Sales | USD 1.950 | Online, 4 semanas | Formulario con puntaje `form.30x.com/to/ai-sales-30x` |
| Sales Machine | USD 1.950 (antes 1.990) | Online | **Mismo formulario de AI Sales** |
| Growth Rockstar | USD 1.295 | Online | **Mismo formulario de AI Sales** |
| Advanced Strategy | USD 2.500 | Online | **Mismo formulario de AI Sales** |
| Xtreme Growth | USD 1.450 | Online | **Mismo formulario de AI Sales** |
| LinkedIn Sales | USD 1.950 | 4 semanas, 12 sesiones · inicia 17 nov | No se detectó formulario |
| Operaciones con AI | USD 1.800 (reserva USD 400) | 4 semanas online · inicia 10 nov | No se detectó formulario |
| Instagram & TikTok | USD 2.000 | Inicia 9 nov, 2 días/semana 1–3 p. m. COT | No se detectó formulario |
| Fundraising Fundamentals | USD 1.200 | Cupos limitados | Formulario aparte `go.30x.com/aplicacion-fs-cohort5-30x` (no revisado) |
| Multipliers | USD 1.000 | 12 meses de acompañamiento | Checkout directo |
| Product Rockstar, Second Brain | No publicado | — | — |
| Planes corporativos | A medida | — | Área de empresas |

## Qué debe llevar cada opción en la pregunta de Jev (40–60 palabras)
Para quién es (cargo y etapa de empresa), qué problema resuelve, precio y formato, señales de que encaja (temas, palabras en la "razón o desafío"), y para quién **no** es. Ejemplo:

> **Growth Rockstar** (online, USD 1.295): para CMOs, VPs y heads de marketing o growth, y equipos de marketing que deben generar más demanda con el mismo presupuesto (adquisición, embudo, retención). Encaja si habla de leads, pauta, CAC o crecimiento. No es para quien busca gobernar la adopción de IA en toda la empresa (eso es AI for Executives).

Reglas: el **código** filtra antes los programas sin cohorte abierta (Jev no compara fechas). Medir el cambio en el set de prueba, no en el de ajuste. Costo extra: ~700 tokens por llamada (≈ USD 0,00003), sin impacto.
