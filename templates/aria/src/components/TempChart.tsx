import { useId, useMemo } from 'react';

/* ------------------------------------------------------------------ */
/*  TempChart — a calm inline-SVG area/line sparkline of temperature.  */
/*  No deps. Smooth catmull-rom path, soft fill, last-point marker.    */
/* ------------------------------------------------------------------ */

export type Point = { t: number; v: number };

type Props = {
  data: Point[];
};

const W = 320;
const H = 120;
const PAD_X = 6;
const PAD_TOP = 14;
const PAD_BOT = 18;

/** Build a smooth path (Catmull-Rom -> cubic Bezier) through points. */
function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;

  let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;

    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
}

export function TempChart({ data }: Props) {
  const gradientId = useId();
  const clipId = useId();

  const model = useMemo(() => {
    const values = data.map((d) => d.v);
    const times = data.map((d) => d.t);
    let min = Math.min(...values);
    let max = Math.max(...values);
    // Pad the range so a flat line still reads as a gentle band.
    if (max - min < 0.5) {
      min -= 1;
      max += 1;
    } else {
      const pad = (max - min) * 0.15;
      min -= pad;
      max += pad;
    }
    const tMin = Math.min(...times);
    const tMax = Math.max(...times);
    const tSpan = tMax - tMin || 1;
    const vSpan = max - min || 1;

    const plotW = W - PAD_X * 2;
    const plotH = H - PAD_TOP - PAD_BOT;

    const pts = data.map((d) => ({
      x: PAD_X + ((d.t - tMin) / tSpan) * plotW,
      y: PAD_TOP + (1 - (d.v - min) / vSpan) * plotH,
    }));

    const line = smoothPath(pts);
    const last = pts[pts.length - 1];
    const area =
      line +
      ` L ${last.x.toFixed(2)} ${(H - PAD_BOT).toFixed(2)}` +
      ` L ${pts[0].x.toFixed(2)} ${(H - PAD_BOT).toFixed(2)} Z`;

    // Midpoint hour tick label positions (start / mid / end).
    const ticks = [0, Math.floor(data.length / 2), data.length - 1].map((i) => {
      const d = data[i];
      const x = PAD_X + ((d.t - tMin) / tSpan) * plotW;
      const label = new Date(d.t).toLocaleTimeString(undefined, {
        hour: 'numeric',
      });
      return { x, label };
    });

    return { line, area, last, ticks };
  }, [data]);

  return (
    <svg
      className="tempchart"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      role="img"
      aria-label="Temperature trend over the last 24 hours"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" className="tempchart__grad-top" />
          <stop offset="100%" className="tempchart__grad-bot" />
        </linearGradient>
        <clipPath id={clipId}>
          <rect x="0" y="0" width={W} height={H - PAD_BOT + 2} />
        </clipPath>
      </defs>

      <g clipPath={`url(#${clipId})`}>
        <path d={model.area} fill={`url(#${gradientId})`} className="tempchart__area" />
        <path d={model.line} className="tempchart__line" />
      </g>

      <g className="tempchart__marker">
        <circle cx={model.last.x} cy={model.last.y} r="4.5" className="tempchart__dot-halo" />
        <circle cx={model.last.x} cy={model.last.y} r="2.5" className="tempchart__dot" />
      </g>

      <g className="tempchart__axis">
        {model.ticks.map((t, i) => (
          <text
            key={i}
            x={Math.max(PAD_X + 8, Math.min(W - PAD_X - 8, t.x))}
            y={H - 4}
            textAnchor={i === 0 ? 'start' : i === model.ticks.length - 1 ? 'end' : 'middle'}
          >
            {t.label}
          </text>
        ))}
      </g>
    </svg>
  );
}
