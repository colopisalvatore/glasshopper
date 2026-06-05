// Inline-SVG icon set for the Grid template.
// All glyphs share a 24x24 viewBox, use `currentColor`, and inherit stroke
// width from CSS so they stay crisp at any tile size. No icon dependency.

import type { CSSProperties, JSX } from 'react';

export type IconName =
  | 'light'
  | 'switch'
  | 'fan'
  | 'door-open'
  | 'door-closed'
  | 'motion'
  | 'thermometer'
  | 'humidity'
  | 'power'
  | 'plug'
  | 'window'
  | 'lock'
  | 'unlock'
  | 'climate'
  | 'media'
  | 'cover'
  | 'unknown';

interface IconProps {
  readonly name: IconName;
  readonly className?: string;
  readonly style?: CSSProperties;
}

/**
 * Stroke-based glyphs (no fill) keep the Material feel light. Every path is
 * authored on a 24-grid so weights line up across the set.
 */
const PATHS: Record<IconName, JSX.Element> = {
  light: (
    <>
      <path d="M9 18h6" />
      <path d="M10 21h4" />
      <path d="M12 3a6 6 0 0 0-4 10.5c.6.6 1 1.3 1 2.2V16h6v-.3c0-.9.4-1.6 1-2.2A6 6 0 0 0 12 3Z" />
    </>
  ),
  switch: (
    <>
      <rect x="3" y="8" width="18" height="8" rx="4" />
      <circle cx="16" cy="12" r="2.4" />
    </>
  ),
  fan: (
    <>
      <circle cx="12" cy="12" r="1.6" />
      <path d="M12 10.4c0-3 .6-5.4 2.2-5.4 1.7 0 2.4 2.2 1 4.5-.7 1.2-2 1.9-3.2 2.1" />
      <path d="M13.6 12c2.6 1.5 4.4 3.2 3.6 4.6-.9 1.5-3.1 1-4.4-1.3-.7-1.2-.7-2.6-.4-3.8" />
      <path d="M10.4 12c-2.6-1.5-4.4-3.2-3.6-4.6.9-1.5 3.1-1 4.4 1.3.7 1.2.7 2.6.4 3.8" />
    </>
  ),
  'door-open': (
    <>
      <path d="M4 21h16" />
      <path d="M14 21V4l-9 2v15" />
      <path d="M14 6l5-1v16" />
      <path d="M11.5 12v2" />
    </>
  ),
  'door-closed': (
    <>
      <path d="M4 21h16" />
      <path d="M6 21V4h12v17" />
      <path d="M14.5 12v2" />
    </>
  ),
  motion: (
    <>
      <circle cx="12" cy="4.5" r="1.6" />
      <path d="M9 9l3-1 3 2 2 2" />
      <path d="M12 8v5l-2 6" />
      <path d="M12 13l3 6" />
      <path d="M6 11l3-1" />
    </>
  ),
  thermometer: (
    <>
      <path d="M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0Z" />
      <path d="M12 9v7" />
    </>
  ),
  humidity: (
    <>
      <path d="M12 3.5C9 8 6.5 11 6.5 14.2a5.5 5.5 0 0 0 11 0C17.5 11 15 8 12 3.5Z" />
      <path d="M9.5 14.5a2.5 2.5 0 0 0 2.5 2.5" />
    </>
  ),
  power: (
    <>
      <path d="M12 3v8" />
      <path d="M7 6.3a8 8 0 1 0 10 0" />
    </>
  ),
  plug: (
    <>
      <path d="M9 3v5" />
      <path d="M15 3v5" />
      <path d="M7 8h10v3a5 5 0 0 1-10 0V8Z" />
      <path d="M12 16v5" />
    </>
  ),
  window: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="1.5" />
      <path d="M12 4v16" />
      <path d="M4 12h16" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      <circle cx="12" cy="15.5" r="1.2" />
    </>
  ),
  unlock: (
    <>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 7.5-1.9" />
      <circle cx="12" cy="15.5" r="1.2" />
    </>
  ),
  climate: (
    <>
      <rect x="3" y="6" width="18" height="9" rx="2.5" />
      <path d="M7 19h.01M11 19h.01M15 19h.01" />
      <path d="M7 10.5h6" />
    </>
  ),
  media: (
    <>
      <rect x="3" y="5" width="18" height="12" rx="2" />
      <path d="M10 8.5l4.5 2.5L10 13.5z" />
      <path d="M8 21h8" />
    </>
  ),
  cover: (
    <>
      <rect x="4" y="4" width="16" height="4" rx="1" />
      <path d="M6 8v6M10 8v6M14 8v6M18 8v6" />
      <path d="M5 14h14" />
    </>
  ),
  unknown: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 0 1 4.4 1.6c0 1.7-2.4 2-2.4 3.4" />
      <path d="M12 17.5h.01" />
    </>
  ),
};

export function GridIcon({ name, className, style }: IconProps): JSX.Element {
  return (
    <svg
      className={className}
      style={style}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}
