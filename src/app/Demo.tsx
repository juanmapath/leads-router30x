'use client';
// Parte interactiva del demo: la semana y el zoom comparten el lead seleccionado (tocar un punto abre su zoom).
import { useState, type ReactNode } from 'react';
import { TryIt } from './TryIt.tsx';
import type { WeekMetrics } from '../engine/week-metrics.ts';
import { Week, type WeekData } from './Week.tsx';
import { Zoom } from './Zoom.tsx';

export function Demo({ week, metrics, children }: { week: WeekData; metrics: WeekMetrics; children?: ReactNode }) {
  const [selected, setSelected] = useState<string | null>(null);
  function select(id: string) {
    setSelected(id);
    document.getElementById('zoom-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  return (
    <>
      <Week data={week} metrics={metrics} onSelect={select} />
      {children /* capa de acción, renderizada en el servidor */}
      <Zoom selectedId={selected} />
      <TryIt />
    </>
  );
}
