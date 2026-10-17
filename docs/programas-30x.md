# Catálogo de 30X para Jev (revisado en 30x.com el 16 oct. 2026, 23:45 y 00:05)

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

## Catálogo oficial del "Diagnóstico 30X" (30x.com/diagnostico-30x)
30X ya tiene un recomendador de programas (hecho para Colombia Tech Week & Fest). Su código público trae el **catálogo oficial: 17 programas en 7 categorías, con un id y una descripción corta escrita por 30X**. Usarlo como base de `programs.ts` (con sus ids) hace la solución más fácil de adoptar: hablamos su mismo idioma.

| id 30X | Programa | Categoría | Descripción oficial |
| --- | --- | --- | --- |
| inmersion | Inmersión Ejecutiva Presencial | Presencial | Tres días presenciales de estrategia, networking de alto nivel y sesiones privadas con mentores. |
| ai_exec | AI for Executives | Inteligencia Artificial | Gobierna la IA como líder: criterio y decisiones a nivel ejecutivo. |
| ai_dev | AI for Developers | Inteligencia Artificial | Construye agentes de IA con código. La ruta técnica y aplicada. |
| ops_ai | Operaciones con AI | Inteligencia Artificial | El playbook de operaciones con IA de tu compañía, paso a paso. |
| second_brain | Second Brain | Inteligencia Artificial | El sistema operativo personal para pensar, decidir y construir con IA. |
| sales_machine | Sales Machine | Ventas | El playbook B2B completo para vender y cerrar más. |
| ai_sales | AI Sales | Ventas | Automatiza y potencia tu operación de ventas B2B con IA. |
| linkedin_sales | LinkedIn Sales | Ventas | Construye autoridad y pipeline B2B vendiendo desde LinkedIn. |
| growth_rockstar | Growth Rockstar | Growth | Construye tu motor de crecimiento desde los fundamentos. |
| advanced_strategy | Advanced Strategy | Growth | Liderazgo ejecutivo de growth para escalar con visión estratégica. |
| xtreme_growth | Xtreme Growth | Growth | Escalamiento agresivo de tu empresa apalancado en IA. |
| ig_tiktok | Instagram & TikTok | Growth | Deja de solo estar en redes: empieza a vender desde ellas. |
| fundraising | Fundraising School | Startups | Cierra tu ronda de inversión en 5 semanas. |
| product_rockstar | Product Rockstar | Startups | Lidera roadmaps de producto que mueven el negocio. |
| corporativos | Planes Corporativos | Empresas | Ecosistema de IA y programa corporativo B2B para tu empresa. |
| multipliers | Multipliers | Empresas | Los pilares para escalar tu empresa de forma sostenible. |
| next | 30X Next | Jóvenes | IA y emprendimiento para jóvenes de 13 a 18 años. |

Además, en el menú de 30x.com: **Raise Your Round** (fundraising avanzado: preparar una ronda real). No está en el diagnóstico.

**Decisiones para el router:**
- Incluir los 16 programas para adultos + Raise Your Round. **Excluir 30X Next** (menores de edad): si un lead habla de un hijo adolescente, va a una persona.
- Hoy `programs.ts` solo tiene 8: faltan Operaciones con AI, Second Brain, LinkedIn Sales, Advanced Strategy, Xtreme Growth, Instagram & TikTok, Product Rockstar, Multipliers y Raise Your Round.
- **Dos preguntas en la misma llamada:** `categoria` (Presencial, IA, Ventas, Growth, Startups, Empresas, ninguna) y `programa` (17 + otro). El código revisa que coincidan. Si la categoría es clara pero el programa no, se ofrecen los programas de esa categoría y decide el vendedor. Es la misma estructura que usa el diagnóstico de 30X.
- Descripción de cada opción: la oficial de 30X + para quién es + señales de encaje + para quién no (ver ejemplo arriba).

## Cómo decide hoy el diagnóstico (para comparar)
Árbol fijo de 6 pasos: perfil (founder, ejecutivo, corporativo, padre de adolescente) → etapa (idea, MVP, arrancando, creciendo, consolidada) → meta a 12 meses → prioridad (ventas, IA, growth, inversión/producto, networking) → **la persona elige el programa** dentro de la categoría → formato. El programa principal es literalmente el que la persona eligió; el complementario sale de reglas if/else (p. ej. meta "inversión" → Fundraising). Pide nombre, correo y WhatsApp antes de empezar y manda el resultado a un webhook.
**Lectura para el pitch:** 30X ya sabe que necesita recomendar programas, pero hoy el "recomendador" le pide a la persona que se clasifique sola. Jev lo hace a partir de lo que la persona ya escribió (cargo, empresa, razón o desafío, contenido que la trajo), sin 6 preguntas extra.
