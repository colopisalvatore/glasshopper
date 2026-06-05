import { useId, useMemo, type ReactNode } from 'react';

/**
 * Sparkline — an animated, area-filled inline SVG trend line.
 *
 * Pure presentational. Takes already-fetched history points and renders a
 * crisp path that draws itself in on mount (respecting reduced motion via the
 * stylesheet). No external charting library: the geometry is computed here.
 */

export type Point = { t: number; v: number };

type SparklineProps = {
  points: Point[];
  /** Pixel width of the drawing surface. Height follows from aspect. */
  width?: number;
  height?: number;
  /** Stroke + fill hue. Defaults to the app accent. */
  stroke?: string;
  /** Render the soft area fill below the line. */
  fill?: boolean;
  /** Accessible label; the chart itself is aria-hidden when omitted. */
  label?: string;
};

/** Min / max of the value axis with a small headroom so peaks do not clip. */
function extent(points: Point[]): [number, number] {
  let lo = Infinity;
  let hi = -Infinity;
  for (const p of points) {
    if (p.v < lo) lo = p.v;
    if (p.v > hi) hi = p.v;
  }
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) return [0, 1];
  if (lo === hi) return [lo - 1, hi + 1];
  const pad = (hi - lo) * 0.12;
  return [lo - pad, hi + pad];
}

type Geometry = {
  line: string;
  area: string;
  last: { x: number; y: number } | null;
  length: number;
};

function buildGeometry(
  points: Point[],
  width: number,
  height: number,
): Geometry {
  if (points.length === 0) {
    return { line: '', area: '', last: null, length: 0 };
  }

  const t0 = points[0].t;
  const t1 = points[points.length - 1].t;
  const span = t1 - t0 || 1;
  const [lo, hi] = extent(points);
  const range = hi - lo || 1;

  // Inset by stroke radius so the line never gets clipped at the edges.
  const padY = 3;
  const usableH = height - padY * 2;

  const xs: number[] = [];
  const ys: number[] = [];
  for (const p of points) {
    xs.push(((p.t - t0) / span) * width);
    ys.push(padY + (1 - (p.v - lo) / range) * usableH);
  }

  // Catmull-Rom -> cubic bezier for a smooth, non-overshooting curve.
  let line = `M ${xs[0].toFixed(2)} ${ys[0].toFixed(2)}`;
  let length = 0;
  for (let i = 0; i < xs.length - 1; i++) {
    const x0 = xs[Math.max(0, i - 1)];
    const y0 = ys[Math.max(0, i - 1)];
    const x1 = xs[i];
    const y1 = ys[i];
    const x2 = xs[i + 1];
    const y2 = ys[i + 1];
    const x3 = xs[Math.min(xs.length - 1, i + 2)];
    const y3 = ys[Math.min(ys.length - 1, i + 2)];

    const c1x = x1 + (x2 - x0) / 6;
    const c1y = y1 + (y2 - y0) / 6;
    const c2x = x2 - (x3 - x1) / 6;
    const c2y = y2 - (y3 - y1) / 6;

    line += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${x2.toFixed(2)} ${y2.toFixed(2)}`;
    length += Math.hypot(x2 - x1, y2 - y1);
  }

  const area =
    `${line} L ${xs[xs.length - 1].toFixed(2)} ${height} ` +
    `L ${xs[0].toFixed(2)} ${height} Z`;

  return {
    line,
    area,
    last: { x: xs[xs.length - 1], y: ys[ys.length - 1] },
    // pad the dash length so the draw-in fully clears the path
    length: Math.max(length * 1.15, width),
  };
}

export function Sparkline({
  points,
  width = 220,
  height = 56,
  stroke = 'var(--accent)',
  fill = true,
  label,
}: SparklineProps): ReactNode {
  const rawId = useId();
  const gradId = `spark-fill-${rawId.replace(/[:]/g, '')}`;
  const geo = useMemo(
    () => buildGeometry(points, width, height),
    [points, width, height],
  );

  if (!geo.last) {
    return (
      <svg
        className="spark spark--empty"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={label ? `${label}: no data` : undefined}
        aria-hidden={label ? undefined : true}
      >
        <line
          x1={0}
          y1={height / 2}
          x2={width}
          y2={height / 2}
          className="spark-baseline"
          strokeDasharray="2 5"
        />
      </svg>
    );
  }

  return (
    <svg
      className="spark"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity={0.28} />
          <stop offset="100%" stopColor={stroke} stopOpacity={0} />
        </linearGradient>
      </defs>
      {fill && <path className="spark-area" d={geo.area} fill={`url(#${gradId})`} />}
      <path
        className="spark-line"
        d={geo.line}
        fill="none"
        stroke={stroke}
        style={{
          strokeDasharray: geo.length,
          strokeDashoffset: geo.length,
        }}
      />
      <circle
        className="spark-head"
        cx={geo.last.x}
        cy={geo.last.y}
        r={2.6}
        fill={stroke}
      />
      <circle
        className="spark-head-halo"
        cx={geo.last.x}
        cy={geo.last.y}
        r={2.6}
        fill="none"
        stroke={stroke}
      />
    </svg>
  );
}
