'use client';
// Calibración: por tramo de confianza de Jev en el programa, qué fracción acertó (set de prueba).
import { useState } from 'react';

export interface Bucket { tramo: string; n: number; acierto: number | null }

const W = 560, H = 240, PAD = { l: 40, r: 8, t: 16, b: 44 };

export function Calibration({ buckets }: { buckets: Bucket[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const iw = W - PAD.l - PAD.r, ih = H - PAD.t - PAD.b;
  const bw = iw / buckets.length;
  const y = (v: number) => PAD.t + ih * (1 - v);

  return (
    <figure style={{ margin: 0, position: 'relative' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Acierto del programa por tramo de confianza de Jev">
        {[0, 0.5, 1].map((g) => (
          <g key={g}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(g)} y2={y(g)} stroke="var(--border)" />
            <text x={PAD.l - 6} y={y(g) + 4} textAnchor="end" fontSize="12" fill="var(--text-3)">{g * 100} %</text>
          </g>
        ))}
        {buckets.map((b, i) => {
          const x = PAD.l + i * bw + 6;
          const w = bw - 12;
          const v = b.acierto ?? 0;
          const top = y(v);
          const h = PAD.t + ih - top;
          return (
            <g key={b.tramo} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} tabIndex={0}
               onFocus={() => setHover(i)} onBlur={() => setHover(null)} style={{ outline: 'none' }}>
              <rect x={PAD.l + i * bw} y={PAD.t} width={bw} height={ih} fill="transparent" />
              {h > 0 && (
                <path d={`M${x},${PAD.t + ih} V${top + 4} q0,-4 4,-4 h${w - 8} q4,0 4,4 V${PAD.t + ih} Z`} fill="var(--jev)" opacity={hover === null || hover === i ? 1 : 0.55} />
              )}
              {b.acierto !== null && <text x={x + w / 2} y={top - 6} textAnchor="middle" fontSize="12" fill="var(--text-2)">{Math.round(v * 100)} %</text>}
              <text x={x + w / 2} y={H - 26} textAnchor="middle" fontSize="12" fill="var(--text-2)">{b.tramo.replace(/\s*%$/, '')}</text>
              <text x={x + w / 2} y={H - 10} textAnchor="middle" fontSize="11" fill="var(--text-3)">n={b.n}</text>
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <span className="tooltip" style={{ left: `${((PAD.l + (hover + 0.5) * bw) / W) * 100}%`, top: `${(y(buckets[hover].acierto ?? 0) / H) * 100}%` }}>
          Confianza {buckets[hover].tramo}: acertó {buckets[hover].acierto === null ? '—' : `${Math.round((buckets[hover].acierto ?? 0) * 100)} %`} de {buckets[hover].n}
        </span>
      )}
      <figcaption className="faint">Confianza de Jev en el programa (%) · acierto real en el set de prueba</figcaption>
    </figure>
  );
}
