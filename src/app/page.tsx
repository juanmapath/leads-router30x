import week from '../../data/week.json';
import { weekMetrics } from '../engine/week-metrics.ts';
import type { WeekRow } from '../engine/week.ts';
import { Adopt } from './Adopt.tsx';
import { Demo } from './Demo.tsx';
import { Presenter } from './Presenter.tsx';
import { Trust } from './Trust.tsx';

// La semana viene precalculada en el build (scripts/build-week.ts): portada y semana se renderizan en el servidor.
export default function Home() {
  const data = { n: week.n, costUsd: week.costUsd, msMean: week.msMean, rows: week.rows as WeekRow[] };
  return (
    <main>
      <Demo week={data} metrics={weekMetrics(data.rows)} />
      <Trust />
      <Adopt />
      <Presenter />
    </main>
  );
}
