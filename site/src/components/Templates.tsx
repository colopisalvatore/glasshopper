import { config } from '../config';

const SIDE = [
  {
    name: 'Minimal',
    tier: 'free',
    blurb: 'Empty scaffold with the five hooks wired. Start here, build anything.',
  },
  {
    name: 'Your template',
    tier: 'community',
    blurb: 'Ship your own bundle as a zip. Distribute free or sell premium; Glasshopper handles install and multi-dashboard.',
  },
];

export function Templates() {
  return (
    <section className="templates">
      <header className="section__header">
        <span className="section__eyebrow">Templates</span>
        <h2 className="section__title">One platform, many dashboards.</h2>
        <p className="section__sub">
          Templates are built React bundles the integration serves. Pick a
          starter, install a community template, or ship your own.
        </p>
      </header>

      <div className="templates__layout">
        <article className="tpl-feature">
          <div className="tpl-feature__preview" aria-hidden>
            <div className="tplp">
              <div className="tplp__hero">
                <span className="tplp__k">Good evening</span>
                <span className="tplp__big">22.4°</span>
                <span className="tplp__sub">Living room · humidity 44%</span>
              </div>
              <div className="tplp__col">
                <span className="tplp__cell tplp__cell--on">Lounge</span>
                <span className="tplp__cell">Studio</span>
                <span className="tplp__cell">Hallway</span>
              </div>
              <div className="tplp__bar">
                <span className="tplp__barfill" />
              </div>
            </div>
          </div>
          <div className="tpl-feature__body">
            <span className="tpl__badge tpl__badge--premium">Premium</span>
            <h3 className="tpl-feature__title">Jarvis</h3>
            <p className="tpl-feature__blurb">
              An iOS-Home-inspired dashboard. Multi-room control, live energy,
              ambient weather, tuned for a wall tablet at two metres.
            </p>
            <a
              className="tpl-feature__link"
              href={config.premiumUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              View Jarvis
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>
        </article>

        <ul className="tpl-side">
          {SIDE.map((t) => (
            <li key={t.name} className="tpl-side__item">
              <div className="tpl-side__head">
                <h3 className="tpl-side__name">{t.name}</h3>
                <span className="tpl__badge">{t.tier}</span>
              </div>
              <p className="tpl-side__blurb">{t.blurb}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
