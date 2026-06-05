import { useState } from 'react';
import { config } from '../config';

const STEPS = [
  {
    n: '01',
    title: 'Install via HACS',
    body: 'Add as a custom repository, click download, restart Home Assistant.',
  },
  {
    n: '02',
    title: 'Add the integration',
    body: 'Settings → Devices → Add Integration → Glasshopper. Pick a template and a slug.',
  },
  {
    n: '03',
    title: 'Open the sidebar',
    body: 'Your panel is live, on the same session as the rest of HA.',
  },
];

export function Install() {
  return (
    <section className="install">
      <header className="section__header">
        <span className="section__eyebrow">Three steps</span>
        <h2 className="section__title">From zero to panel in under five minutes.</h2>
      </header>

      <CommandBlock text={config.cli} />

      <ol className="install__steps">
        {STEPS.map((s) => (
          <li key={s.n} className="install__step">
            <span className="install__n">{s.n}</span>
            <div className="install__stepbody">
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
        <a className="btn btn--ghost" href={config.repo}>
          <Star /> Star on GitHub
        </a>
      </div>
    </section>
  );
}

function CommandBlock({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="install__cmd">
      <span className="install__prompt" aria-hidden>$</span>
      <code className="install__code">{text}</code>
      <button
        type="button"
        className="install__copy"
        aria-label={`Copy command: ${text}`}
        onClick={() => {
          void navigator.clipboard?.writeText(text);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1600);
        }}
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
      <span className="sr-only" role="status">
        {copied ? 'Copied to clipboard' : ''}
      </span>
    </div>
  );
}

function Star() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="m12 2 2.9 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 7.1-1.01L12 2Z" />
    </svg>
  );
}
