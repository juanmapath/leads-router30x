'use client';
// Parte interactiva del demo: la semana y el zoom comparten el lead seleccionado (tocar un punto abre su zoom).
import { useState } from 'react';
import { Week } from './Week.tsx';
import { Zoom } from './Zoom.tsx';

export function Demo() {
  const [selected, setSelected] = useState<string | null>(null);
  function select(id: string) {
    setSelected(id);
    document.getElementById('zoom')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  return (
    <>
      <Week onSelect={select} />
      <Zoom selectedId={selected} />
    </>
  );
}
