const HOOKS = [
  { sig: "useEntity('light.kitchen')", desc: 'Live state + attributes. Re-renders on change.' },
  { sig: "useService('light', 'turn_on')", desc: 'A typed caller for any HA service.' },
  { sig: "useHistory('sensor.temp', 24)", desc: 'Time-series, ready to chart.' },
  { sig: "useArea('living_room')", desc: 'Every entity and device in an area.' },
  { sig: 'useTheme()', desc: 'HA theme tokens, light/dark aware.' },
];

const POINTS = [
  {
    title: 'Native HA panels',
    body: 'Each dashboard sits in the sidebar like a built-in. HACS-installable, configured from the UI. No panel_iframe YAML.',
  },
  {
    title: 'Zero-auth bridge',
    body: 'In panel mode the bundle inherits the WebSocket your HA frontend already holds open. No tokens. No CORS. No reverse proxy.',
  },
  {
    title: 'Multi-dashboard',
    body: 'One install, many panels. Each with its own slug, sidebar icon, and admin gate. One bundle, many faces.',
  },
  {
    title: 'Kiosk-ready',
    body: 'Every dashboard gets a /custom-dashboard/<slug>/ URL. Public-mode toggle for wall tablets. PWA-installable on iOS.',
  },
  {
    title: 'Template ecosystem',
    body: 'Ship your dashboard as a zip. Users install it with a single service call. Free or paid, your call.',
  },
];

export function Features() {
  return (
    <section className="features">
      <header className="section__header">
        <span className="section__eyebrow">Why Glasshopper</span>
        <h2 className="section__title">The whole API fits on one screen.</h2>
      </header>

      <div className="features__bento">
        <article className="hooks-panel">
          <header className="hooks-panel__head">
            <span className="hooks-panel__kicker">Five hooks</span>
            <p className="hooks-panel__lead">
              No store to wire, no client to configure. Import a hook, read your
              home.
            </p>
          </header>
          <ul className="hooks-panel__list">
            {HOOKS.map((h) => (
              <li key={h.sig} className="hooks-panel__item">
                <code className="hooks-panel__sig">{h.sig}</code>
                <span className="hooks-panel__desc">{h.desc}</span>
              </li>
            ))}
          </ul>
        </article>

        <ul className="points">
          {POINTS.map((p) => (
            <li key={p.title} className="points__item">
              <span className="points__mark" aria-hidden />
              <div>
                <h3 className="points__title">{p.title}</h3>
                <p className="points__body">{p.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
