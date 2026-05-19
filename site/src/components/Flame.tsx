export function Flame({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="stokeFlame" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fcd34d" />
          <stop offset="0.45" stopColor="#fb923c" />
          <stop offset="1" stopColor="#ef4444" />
        </linearGradient>
        <linearGradient id="stokeGlow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fef3c7" stopOpacity="0.9" />
          <stop offset="1" stopColor="#fbbf24" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="stokeStick" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a78bfa" />
          <stop offset="1" stopColor="#60a5fa" />
        </linearGradient>
      </defs>

      {/* Outer glow */}
      <ellipse cx="14" cy="11" rx="9" ry="11" fill="url(#stokeGlow)" />

      {/* Flame body */}
      <path
        d="M14 3.2c0 0 5.2 4.4 5.2 9.4a5.2 5.2 0 1 1-10.4 0c0-2 1-3.6 1.6-4.6 0 1.4.6 2.2 1.4 2.2 1.4 0 1-3.2 2.2-7Z"
        fill="url(#stokeFlame)"
      />

      {/* Inner hot core */}
      <path
        d="M14 11.5c0 0 2.4 1.6 2.4 4a2.4 2.4 0 1 1-4.8 0c0-1 .6-1.8 1-2.4 0 .8.2 1.2.6 1.2.8 0 .8-1 .8-2.8Z"
        fill="#fef3c7"
        opacity="0.85"
      />

      {/* Candle stem */}
      <rect x="13" y="19" width="2" height="6" rx="1" fill="url(#stokeStick)" />
    </svg>
  );
}
