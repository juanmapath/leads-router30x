'use client';
// Barras horizontales de una sola serie, con etiqueta directa y tooltip al pasar el cursor o enfocar.
import { useEffect, useState } from 'react';

export interface BarDatum { label: string; value: number }

export function Bars({ data, max, color }: { data: BarDatum[]; max: number; color: string }) {
  const [grown, setGrown] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  useEffect(() => { const t = setTimeout(() => setGrown(true), 30); return () => clearTimeout(t); }, []);

  return (
    <div className="bars" role="list">
      {data.map((d, i) => {
        const pct = max ? (d.value / max) * 100 : 0;
        return (
          <div
            key={d.label} className="bar-row" role="listitem" tabIndex={0}
            aria-label={`${d.label}: ${d.value} de ${max}`}
            onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(i)} onBlur={() => setHover(null)}
          >
            <span>{d.label}</span>
            <span className="bar-track">
              <span className="bar-fill" style={{ width: grown ? `${Math.max(pct, d.value ? 1 : 0)}%` : 0, background: color, transitionDelay: `${i * 120}ms` }} />
              {hover === i && <span className="tooltip" style={{ left: `${Math.max(pct / 2, 8)}%`, top: -4 }}>{d.value} leads · {Math.round(pct)} % de {max}</span>}
            </span>
            <span className="count">{d.value}</span>
          </div>
        );
      })}
    </div>
  );
}
