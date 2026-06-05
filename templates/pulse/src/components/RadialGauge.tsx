import { useId, type ReactNode } from 'react';

/**
 * RadialGauge — a 270 degree arc gauge for a single bounded reading.
 *
 * The track is a faint full sweep; the value arc fills from the start. A short
 * tick sits at the current value. Built from one stroked path with dash math,
 * no library. Meaning is doubled by the centered numeric readout, never color
 * alone.
 */

type RadialGaugeProps = {
  value: number | null;
  min: number;
  max: number;
  unit?: string;
  /** Short caption under the value (e.g. the band: "Good"). */
  caption?: string;
  size?: number;
  stroke?: string;
  label: string;
};

const SWEEP = 270; // degrees of arc
const START = 135; // start angle, leaving a gap at the bottom

function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const rad = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

/** SVG arc path from startDeg sweeping `sweep` degrees clockwise. */
function arcPath(cx: number, cy: number, r: number, startDeg: number, sweep: number): string {
  const [x0, y0] = polar(cx, cy, r, startDeg);
  const [x1, y1] = polar(cx, cy, r, startDeg + sweep);
  const large = sweep > 180 ? 1 : 0;
  return `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
}

export function RadialGauge({
  value,
  min,
  max,
  unit,
  caption,
  size = 168,
  stroke = 'var(--accent)',
  label,
}: RadialGaugeProps): ReactNode {
  const rawId = useId();
  const trackId = `gauge-track-${rawId.replace(/[:]/g, '')}`;

  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 16;
  const sw = 9;

  const range = max - min || 1;
  const ratio =
    value === null ? 0 : Math.max(0, Math.min(1, (value - min) / range));

  // Full track circumference for the 270deg arc.
  const arcLen = (2 * Math.PI * r * SWEEP) / 360;
  const valueDeg = START + ratio * SWEEP;
  const [tx, ty] = polar(cx, cy, r, valueDeg);

  const display =
    value === null
      ? '--'
      : Math.abs(value) >= 100
        ? Math.round(value).toString()
        : (Math.round(value * 10) / 10).toString();

  return (
    <svg
      className="gauge"
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={
        value === null
          ? `${label}: unavailable`
          : `${label}: ${display}${unit ? ' ' + unit : ''}${caption ? ', ' + caption : ''}`
      }
    >
      <path
        id={trackId}
        className="gauge-track"
        d={arcPath(cx, cy, r, START, SWEEP)}
        fill="none"
        strokeWidth={sw}
        strokeLinecap="round"
      />
      {value !== null && (
        <path
          className="gauge-value"
          d={arcPath(cx, cy, r, START, SWEEP)}
          fill="none"
          stroke={stroke}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeDasharray={arcLen}
          strokeDashoffset={arcLen * (1 - ratio)}
        />
      )}
      {value !== null && (
        <circle className="gauge-knob" cx={tx} cy={ty} r={3.4} fill={stroke} />
      )}
      <text className="gauge-num" x={cx} y={cy - 2} textAnchor="middle">
        {display}
        {unit && value !== null && <tspan className="gauge-unit"> {unit}</tspan>}
      </text>
      {caption && (
        <text className="gauge-cap" x={cx} y={cy + 18} textAnchor="middle">
          {caption}
        </text>
      )}
    </svg>
  );
}
