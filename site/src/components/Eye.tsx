export function Eye({ size = 28 }: { size?: number }) {
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
        <linearGradient id="glasshopperPanel" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1a1a24" />
          <stop offset="1" stopColor="#0d0d12" />
        </linearGradient>
        <linearGradient id="glasshopperIris" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a78bfa" />
          <stop offset="0.5" stopColor="#60a5fa" />
          <stop offset="1" stopColor="#34d399" />
        </linearGradient>
        <radialGradient id="glasshopperPupil" cx="0.5" cy="0.4" r="0.5">
          <stop offset="0" stopColor="#fef3c7" stopOpacity="0.95" />
          <stop offset="0.5" stopColor="#60a5fa" stopOpacity="0.6" />
          <stop offset="1" stopColor="#0d0d12" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Panel / dashboard tile */}
      <rect
        x="2"
        y="2"
        width="24"
        height="24"
        rx="6"
        fill="url(#glasshopperPanel)"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth="1"
      />

      {/* Iris ring */}
      <circle
        cx="14"
        cy="14"
        r="7"
        fill="none"
        stroke="url(#glasshopperIris)"
        strokeWidth="2"
      />

      {/* Inner pupil / glow */}
      <circle cx="14" cy="14" r="5.5" fill="url(#glasshopperPupil)" />

      {/* Highlight */}
      <circle cx="12" cy="12" r="1.4" fill="#ffffff" opacity="0.85" />
    </svg>
  );
}
