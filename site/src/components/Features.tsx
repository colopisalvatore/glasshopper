const FEATURES = [
  {
    title: 'Native HA panels',
    body: 'Each dashboard lives in HA’s sidebar like a built-in. HACS-installable, configured from the UI. No panel_iframe YAML.',
    icon: <PanelIcon />,
  },
  {
    title: 'Zero-auth bridge',
    body: 'In panel mode the bundle inherits the WebSocket your HA frontend already has open. No tokens. No CORS. No reverse-proxy gymnastics.',
    icon: <KeyIcon />,
  },
  {
    title: 'Five hooks',
    body: 'useEntity. useService. useHistory. useArea. useTheme. The entire API surface fits on one screen.',
    icon: <HookIcon />,
  },
  {
    title: 'Multi-dashboard',
    body: 'One install, many panels. Each with its own slug, sidebar icon, and admin gate. One bundle, many faces.',
    icon: <GridIcon />,
  },
  {
    title: 'Kiosk-ready',
    body: 'Every dashboard has a /custom-dashboard/<slug>/ URL. Public-mode toggle for wall tablets. PWA-installable from iOS.',
    icon: <TabletIcon />,
  },
  {
    title: 'Template ecosystem',
    body: 'Ship your dashboard as a zip. Users install via a single service call. Free or paid — your choice.',
    icon: <BoxIcon />,
  },
];

export function Features() {
  return (
    <section className="features">
      <header className="section__header">
        <span className="section__eyebrow">Why Scry</span>
        <h2 className="section__title">Six reasons it sticks.</h2>
      </header>
      <div className="features__grid">
        {FEATURES.map((f) => (
          <article key={f.title} className="feat">
            <div className="feat__icon">{f.icon}</div>
            <h3 className="feat__title">{f.title}</h3>
            <p className="feat__body">{f.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function PanelIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M3 9h18M9 9v12" />
    </svg>
  );
}
function KeyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="8" cy="15" r="4" />
      <path d="m10.8 12.2 7.7-7.7M16 7l2 2" />
    </svg>
  );
}
function HookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M12 4v6a4 4 0 1 1-4 4" />
    </svg>
  );
}
function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}
function TabletIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M11 18h2" />
    </svg>
  );
}
function BoxIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M21 8 12 3 3 8m18 0v8l-9 5-9-5V8m18 0-9 5M3 8l9 5" />
    </svg>
  );
}
