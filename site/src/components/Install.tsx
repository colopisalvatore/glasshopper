import { config } from '../config';

const STEPS = [
  {
    n: '01',
    title: 'Install via HACS',
    body: 'Add as custom repository, click download, restart HA.',
  },
  {
    n: '02',
    title: 'Add the integration',
    body: 'Settings → Devices → Add Integration → Glasshopper. Pick a template + slug.',
  },
  {
    n: '03',
    title: 'Open the sidebar',
    body: 'Your panel is live, inheriting the same session as the rest of HA.',
  },
];

export function Install() {
  return (
    <section className="install">
      <header className="section__header">
        <span className="section__eyebrow">Three steps</span>
        <h2 className="section__title">From zero to panel in under five minutes.</h2>
      </header>
      <ol className="install__list">
        {STEPS.map((s) => (
          <li key={s.n} className="install__step">
            <span className="install__n">{s.n}</span>
            <div>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="install__cta">
        <a className="btn btn--primary" href={`${config.docs}/guide/install-hacs`}>
          Full install guide
        </a>
        <a className="btn btn--secondary" href={config.repo}>
          ★ Star on GitHub
        </a>
      </div>
    </section>
  );
}
