const TEMPLATES = [
  {
    name: 'Minimal',
    tier: 'free',
    blurb: 'Empty scaffold with the five hooks wired. Start here, build anything.',
    accent: '#60a5fa',
  },
  {
    name: 'Jarvis',
    tier: 'premium',
    blurb: 'iOS-Home-inspired premium dashboard. Multi-room, energy, weather. Designed for wall tablets.',
    accent: '#a78bfa',
  },
  {
    name: 'Your template',
    tier: 'community',
    blurb: 'Ship your own bundle as a zip — distribute free or sell premium. Tessera handles install + multi-dashboard.',
    accent: '#34d399',
  },
];

export function Templates() {
  return (
    <section className="templates">
      <header className="section__header">
        <span className="section__eyebrow">Templates</span>
        <h2 className="section__title">One platform, many dashboards.</h2>
        <p className="section__sub">
          Templates are built React bundles served by the integration. Pick a
          starter, install a community template, or ship your own.
        </p>
      </header>
      <div className="templates__grid">
        {TEMPLATES.map((t) => (
          <article key={t.name} className="tpl" style={{ ['--accent' as string]: t.accent }}>
            <div className="tpl__preview">
              <span className="tpl__badge">{t.tier}</span>
            </div>
            <h3 className="tpl__title">{t.name}</h3>
            <p className="tpl__blurb">{t.blurb}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
