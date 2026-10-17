import week from '../../data/week.json';
import mix from '../../data/week-mix.json';
import { weekMetrics } from '../engine/week-metrics.ts';
import type { WeekRow } from '../engine/week.ts';
import { Adopt } from './Adopt.tsx';
import { Demo } from './Demo.tsx';
import { Presenter } from './Presenter.tsx';
import { Supuestos } from './Supuestos.tsx';
import { Trust } from './Trust.tsx';

// La semana viene precalculada en el build (scripts/build-week.ts): portada y semana se renderizan en el servidor.
// La sección "Lo que cambia para el lead y para el equipo" (ActionLayer) queda fuera de la página; la capa de acción se ve en "Pruébalo tú".
export default function Home() {
  const data = { n: week.n, costUsd: week.costUsd, msMean: week.msMean, rows: week.rows as WeekRow[] };
  const m = weekMetrics(data.rows);
  return (
    <main>
      <Demo week={data} metrics={m} />
      <Trust />
      <Adopt />
      <Supuestos m={m} mix={mix.grupos} />
      <Presenter />
    </main>
  );
}
