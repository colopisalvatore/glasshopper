import { config } from '../config';

export function Hero() {
  return (
    <section className="hero">
      <span className="hero__eyebrow">
        <span className="hero__pulse" />
        v0.2 · Open source · Apache-2.0
      </span>
      <h1 className="hero__title">
        Light up your
        <br />
        <em>home</em>, in React.
      </h1>
      <p className="hero__sub">{config.description}</p>
      <div className="hero__ctas">
        <a className="btn btn--primary" href={`${config.docs}/guide/quickstart`}>
          Get started
          <Arrow />
        </a>
        <button
          className="btn btn--secondary btn--copy"
          type="button"
          onClick={() => void navigator.clipboard?.writeText(config.cli)}
        >
          <code>{config.cli}</code>
        </button>
      </div>
    </section>
  );
}

function Arrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 12h14m-6-6 6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
