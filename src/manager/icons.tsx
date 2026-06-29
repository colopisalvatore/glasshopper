import type { SVGProps } from 'react';

/**
 * Inline SVG icons for the Manager — Lucide-style: 24px viewBox, no fill,
 * currentColor stroke, round caps/joins. Kept inline (no runtime dep) so the
 * admin panel stays a single small bundle and every glyph inherits ink/accent
 * from CSS. No emoji anywhere in the UI (brand: precise, developer-grade).
 */

export type IconName =
  | 'dashboard'
  | 'store'
  | 'layers'
  | 'plus'
  | 'pencil'
  | 'trash'
  | 'open'
  | 'upload'
  | 'link'
  | 'check'
  | 'alert'
  | 'globe'
  | 'shield'
  | 'x'
  | 'spinner';

const PATHS: Record<IconName, JSX.Element> = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="9" rx="1.4" />
      <rect x="14" y="3" width="7" height="5" rx="1.4" />
      <rect x="14" y="12" width="7" height="9" rx="1.4" />
      <rect x="3" y="16" width="7" height="5" rx="1.4" />
    </>
  ),
  store: (
    <>
      <path d="M3 9.5 4.2 4.6A1.5 1.5 0 0 1 5.66 3.5h12.68a1.5 1.5 0 0 1 1.46 1.1L21 9.5" />
      <path d="M4 9.5v9.5a1.5 1.5 0 0 0 1.5 1.5h13a1.5 1.5 0 0 0 1.5-1.5V9.5" />
      <path d="M3 9.5a2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 4 0" />
      <path d="M9 20.5v-5h6v5" />
    </>
  ),
  layers: (
    <>
      <path d="M12 3 21 7.5 12 12 3 7.5 12 3Z" />
      <path d="M3 12.5 12 17l9-4.5" />
      <path d="M3 16.8 12 21.3l9-4.5" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14M5 12h14" />
    </>
  ),
  pencil: (
    <>
      <path d="M16.5 4.5a2.12 2.12 0 0 1 3 3L8 19l-4 1 1-4 11.5-11.5Z" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16" />
      <path d="M9 7V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v2" />
      <path d="M6 7v12.5A1.5 1.5 0 0 0 7.5 21h9a1.5 1.5 0 0 0 1.5-1.5V7" />
      <path d="M10 11v6M14 11v6" />
    </>
  ),
  open: (
    <>
      <path d="M14 4h6v6" />
      <path d="M20 4 10 14" />
      <path d="M19 13v5.5A1.5 1.5 0 0 1 17.5 20H5.5A1.5 1.5 0 0 1 4 18.5v-12A1.5 1.5 0 0 1 5.5 5H11" />
    </>
  ),
  upload: (
    <>
      <path d="M4 15v3.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V15" />
      <path d="M12 16V4" />
      <path d="M7.5 8.5 12 4l4.5 4.5" />
    </>
  ),
  link: (
    <>
      <path d="M10 13a3.5 3.5 0 0 0 5 0l3-3a3.5 3.5 0 0 0-5-5l-1.5 1.5" />
      <path d="M14 11a3.5 3.5 0 0 0-5 0l-3 3a3.5 3.5 0 0 0 5 5l1.5-1.5" />
    </>
  ),
  check: (
    <>
      <path d="M5 12.5 10 17.5 19.5 7" />
    </>
  ),
  alert: (
    <>
      <path d="M12 3.5 22 20H2L12 3.5Z" />
      <path d="M12 9.5v5" />
      <path d="M12 17.5h.01" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18Z" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 19 6v5c0 4.5-3 7.8-7 9.5-4-1.7-7-5-7-9.5V6l7-3Z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  x: (
    <>
      <path d="M6 6 18 18M18 6 6 18" />
    </>
  ),
  spinner: (
    <>
      <path d="M12 3a9 9 0 1 0 9 9" />
    </>
  ),
};

export function Icon({
  name,
  size = 18,
  ...props
}: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable={false}
      {...props}
    >
      {PATHS[name]}
    </svg>
  );
}

/**
 * Brand mark: a clean glass "pane" with a green hop arc and the hopper at its
 * apex. Abstract on purpose, the brand keeps the literal grasshopper out of the
 * UI (no mascot, no emoji). Colors come from CSS so it tracks the theme.
 */
export function BrandMark({ size = 26, ...props }: { size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      className="mgr-mark"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      focusable={false}
      {...props}
    >
      <rect className="mgr-mark__pane" x="2.5" y="2.5" width="19" height="19" rx="5.5" />
      <path className="mgr-mark__edge" d="M6 7.2Q8.2 5.2 12 5.2" strokeLinecap="round" />
      <path className="mgr-mark__hop" d="M5.6 17.4Q12 4.6 18.4 17.4" strokeLinecap="round" />
      <circle className="mgr-mark__dot" cx="12" cy="10.4" r="1.7" />
    </svg>
  );
}
