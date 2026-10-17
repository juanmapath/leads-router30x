import leads from '../../data/leads.json';
import week from '../../data/week.json';
import mix from '../../data/week-mix.json';
import { actionPlan } from '../engine/actions.ts';
import { decideForLead } from '../engine/decide.ts';
import { replayJev } from '../engine/jev-client.ts';
import { legacyRoute } from '../engine/legacy.ts';
import { buildState } from '../engine/state.ts';
import type { Lead } from '../engine/types.ts';
import { weekMetrics } from '../engine/week-metrics.ts';
import type { WeekRow } from '../engine/week.ts';
import { ActionLayer, type ActionCase } from './ActionLayer.tsx';
import { Adopt } from './Adopt.tsx';
import { Demo } from './Demo.tsx';
import { Presenter } from './Presenter.tsx';
import { Supuestos } from './Supuestos.tsx';
import { Trust } from './Trust.tsx';

/** El caso de la capa de acción: gerente de innovación de una multinacional con 5+ cupos, desde su grabación real. */
function actionCase(): ActionCase {
  const lead = (leads as Lead[]).find((l) => l.archetype === 'gerente_equipo_multinacional' && l.form.roleText === 'Gerente de Innovación');
  if (!lead) throw new Error('Falta el caso de la capa de acción en data/leads.json');
  const call = replayJev(buildState(lead));
  if (!call) throw new Error(`Falta la grabación de ${lead.id}: corre npm run record`);
  const d = decideForLead(lead, call.answers);
  return { roleText: lead.form.roleText!, legacyScore: legacyRoute(lead).score, ms: call.ms, plan: actionPlan(d, call.answers) };
}

// La semana viene precalculada en el build (scripts/build-week.ts): portada, semana y capa de acción se renderizan en el servidor.
export default function Home() {
  const data = { n: week.n, costUsd: week.costUsd, msMean: week.msMean, rows: week.rows as WeekRow[] };
  const m = weekMetrics(data.rows);
  return (
    <main>
      <Demo week={data} metrics={m}>
        <ActionLayer c={actionCase()} />
      </Demo>
      <Trust />
      <Adopt />
      <Supuestos m={m} mix={mix.grupos} />
      <Presenter />
    </main>
  );
}
