# Jev Lead Router · 30X

**Reto JEV en 30X · Hackathon 30X (oct. 2026)**

30X recibe cientos de leads por semana y hoy los califica con una suma fija de puntos: más de 6 sobre 10 pasa a entrevista; el resto recibe un "gracias" y sale del embudo. Jev Lead Router reemplaza esa suma por decisiones calibradas de **Jev** (TypeSafe AI): en una sola llamada de milisegundos decide si la persona está lista, qué programa de 30X le encaja, si es una venta a empresa y por qué canal contactarla. Los umbrales en código eligen la acción y los casos dudosos pasan a una persona.

> Estado: en construcción durante el hackathon. Datos 100 % sintéticos; ninguna persona real.

## Cómo correrlo

Requisitos: Node 20.6 o superior.

```bash
npm install
cp .env.example .env.local      # en PowerShell: copy .env.example .env.local
# pon tu AI_GATEWAY_API_KEY de Vercel AI Gateway en .env.local
npm test                         # verificador determinístico (sin red)
npm run ping                     # primera llamada real a Jev
npm run eval                     # 100 leads etiquetados: precisión, calibración, costo
npm run dev                      # http://localhost:3000
```

## Estructura

- `src/engine/` — motor de decisión, sin interfaz: regla actual de 30X (`legacy.ts`), estado del lead (`state.ts`), preguntas tipadas (`questions.ts`), umbrales (`decide.ts`), cliente de Jev con grabar/reproducir (`jev-client.ts`).
- `src/app/` — interfaz y API (`/api/decide`) en Next.js.
- `data/` — 300 leads sintéticos, 100 etiquetados y las grabaciones de Jev.
- `scripts/` — generador de datos, prueba de Jev y evaluación.
- `tests/` — verificador que corre en CI en cada push.
