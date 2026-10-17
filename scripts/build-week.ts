// Precalcula "La semana de 30X" desde las grabaciones → data/week.json (corre antes de cada build).
// Falla si falta una grabación: así un despliegue sin regrabar no llega a producción.
// Uso: npm run week
import { writeFileSync } from 'node:fs';
import leads from '../data/leads.json' with { type: 'json' };
import { replayJev } from '../src/engine/jev-client.ts';
import type { Lead } from '../src/engine/types.ts';
import { buildWeek } from '../src/engine/week.ts';

const week = buildWeek(leads as Lead[], (state) => replayJev(state));
writeFileSync('data/week.json', JSON.stringify(week));
console.log(`data/week.json: ${week.n} leads, USD ${week.costUsd.toFixed(4)}, ${week.msMean} ms por lead`);
