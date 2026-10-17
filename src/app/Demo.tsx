'use client';
// Parte interactiva del demo: la semana y el zoom comparten el lead seleccionado (tocar un punto abre su zoom).
import { useState } from 'react';
import { TryIt } from './TryIt.tsx';
import type { WeekMetrics } from '../engine/week-metrics.ts';
import { Week, type WeekData } from './Week.tsx';
import { Zoom } from './Zoom.tsx';

export function Demo({ week, metrics }: { week: WeekData; metrics: WeekMetrics }) {
  const [selected, setSelected] = useState<string | null>(null);
  function select(id: string) {
    setSelected(id);
    document.getElementById('zoom-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  return (
    <>
      <Week data={week} metrics={metrics} onSelect={select} />
      <Zoom selectedId={selected} />
      <TryIt />
    </>
  );
}
