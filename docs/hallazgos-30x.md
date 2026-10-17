# Hallazgos sobre 30X (fuentes públicas)

## Empresa
Escuela de negocios / educación ejecutiva para founders, CEOs y ejecutivos de Latinoamérica. CEO y cofundador: Andrés Bilbao (ex-Rappi). +3.100 alumnos (web) / +4.000 (kickoff). Equipo interno de 10–12 personas. CTO: Diogenes Moreira. Sales Director: Danilo Ortega. Contratando un SDR y un AI Builder.

Catálogo (~17 ofertas, ver `src/engine/programs.ts`): Inmersivo presencial 3 días (USD 6.000; Miami USD 10.000), AI for Executives, AI for Developers (USD 2.000), Operaciones con AI, Second Brain, Sales Machine (USD 1.990), AI Sales, LinkedIn Sales, Growth Rockstar, Advanced Strategy, Xtreme Growth, Instagram & TikTok, Product Rockstar, Fundraising School, Multipliers, Planes corporativos, IA para Jóvenes.

Embudo: contenido (Instagram, TikTok, LinkedIn, YouTube) + pauta Meta/Google → clases y mentorías gratis en Luma (piden solo nombre y correo + pregunta opcional) → formulario de aplicación (form.30x.com) → entrevista → venta. CRM: HubSpot. Ventas con IA: Dapta.

## Cifras (podcast de 30X con Nicolás Rojas, CEO de Dapta)
- ~200–300 leads por semana llenan el formulario (programa más vendido).
- Hoy ~10 % de las ventas son de punta a punta con IA; meta pública: **50 %**.
- Contactabilidad: humanos ~15 %; con IA ≥ 30 %; inbound contactado al instante 60–70 %.
- Speed-to-lead: 2 llamadas apenas llega, WhatsApp a los 5 min, 2 intentos más a las 4–5 p. m.
- Modelo: la IA califica, el humano cierra; si quien agenda no califica, se cancela la reunión.
- "La gente pone cualquier cosa en el formulario": quedó como tarea mejorar las preguntas de calificación.

## Cómo califica hoy (formulario público del Inmersivo, visto el 16 oct. 2026)
URL: https://form.30x.com/to/inmersivo-presencial-30x (form builder propio, conectado a HubSpot; guarda envíos parciales; campos ocultos: utm_*, fbclid, gclid, ad_id, campaign_id, hsa_*).
| Pregunta | Puntos |
| --- | --- |
| Cargo | Socio/Fundador/CEO = 1 · Director/VP/C-Level = 1 · Gerente intermedio, Coordinador, Analista = 0 |
| Facturación anual | ≥ USD 200k = 2 (todos los rangos iguales) · < 200k = 0 |
| Inversión USD 6.000 | Lista = 4 · Plan de pagos = 2 · Imposible = 0 |
| ¿Decide solo? | Sí = 3 · Con alguien = 2 · Otra persona = 0 |
Puntaje > 6 → agenda entrevista. ≤ 6 → "Gracias por tu aplicación" (fin). Etiquetas: High ≥ 7, Mid 5–6, Low ≤ 4. Pregunta de cupos: solo yo / 2–4 / 5+ (5+ → llamada con área de empresas).

**Por qué importa:** confirma las "reglas fijas" del brief. Quien saca ≤ 6 sale del embudo aunque encaje en un programa más barato o en un plan corporativo. La regla ignora señales disponibles (contenido de origen, país, empresa, envíos parciales, eventos de Luma, pregunta libre).

**Hipótesis sin confirmar (no afirmar en el pitch):** el botón "Reservar mi lugar" de la landing no lleva los UTM en el HTML; podría perderse la atribución entre landing y formulario. Preguntar a 30X.
**Tono para el pitch:** "analizamos su embudo público", no "miramos su código".

## Preguntas abiertas para mentorías
- Sandra Carrillo (head of community): ¿qué pasa hoy con quien saca ≤ 6? ¿% contactado en < 5 min? ¿qué cifra reporta ventas a Andrés? ¿mezcla de canales (Andrés dice que la mayoría viene de LinkedIn)?
- Alfredo Hernández (desarrollador de 30X, dio la demo de Jev): umbrales que usa, manejo de "otro" y calibración en choice, cómo se conectaría con HubSpot y Dapta.
