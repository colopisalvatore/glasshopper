import { useState } from 'react';
import { config } from '../config';

export function Hero() {
  return (
    <section className="hero">
      <span className="hero__eyebrow">
        <span className="hero__pulse" aria-hidden />
        v0.x · Open source · Apache-2.0
      </span>

      <h1 className="hero__title">
        Glass panels for your smart home.{' '}
        <span className="hero__accent">In React.</span>
      </h1>

      <p className="hero__sub">{config.description}</p>

      <div className="hero__ctas">
        <a className="btn btn--primary" href={`${config.docs}/guide/quickstart`}>
          Get started
          <Arrow />
        </a>
        <CopyButton text={config.cli} />
      </div>

      <GlassPane />
    </section>
  );
}

function GlassPane() {
  return (
    <div className="hero__glass" aria-hidden>
      {/* Single ambient light source: the only bloom on the page. */}
      <span className="hero__bloom" />

      {/* The dashboard behind the glass, warped by the refraction filter. */}
      <div className="hero__dash">
        <div className="ghd">
          <div className="ghd__weather">
            <span className="ghd__label">Living room</span>
            <span className="ghd__temp">21°</span>
            <span className="ghd__meta">Clear · feels 20°</span>
            <div className="ghd__forecast">
              <i /><i /><i /><i /><i />
            </div>
          </div>
          <div className="ghd__tile ghd__tile--on">
            <span className="ghd__dot" />
            <span className="ghd__tlabel">Kitchen</span>
            <span className="ghd__tval">On</span>
          </div>
          <div className="ghd__tile">
            <span className="ghd__tlabel">Office</span>
            <span className="ghd__tval">Off</span>
          </div>
          <div className="ghd__tile ghd__tile--wide">
            <span className="ghd__tlabel">Power now</span>
            <span className="ghd__tval">320 W</span>
            <svg className="ghd__spark" viewBox="0 0 120 28" preserveAspectRatio="none">
              <path
                d="M0 20 L12 18 L24 21 L36 12 L48 15 L60 7 L72 14 L84 9 L96 17 L108 11 L120 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* The pane itself: frosted edge, specular streak, lit hairline. */}
      <div className="hero__pane">
        <span className="hero__chip">
          <span className="hero__chipdot" /> live panel
        </span>
        <span className="hero__streak" />
      </div>

      {/* Refraction filter, applied to .hero__dash via CSS. */}
      <svg className="hero__defs" width="0" height="0">
        <filter id="gh-refract" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.011 0.017"
            numOctaves="2"
            seed="7"
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="16"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </svg>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="btn btn--ghost btn--copy"
      aria-label={`Copy install command: ${text}`}
      onClick={() => {
        void navigator.clipboard?.writeText(text);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
      }}
    >
      <span className="btn__prompt" aria-hidden>$</span>
      <code>{text}</code>
      <span className="btn__copyicon" aria-hidden>{copied ? <Check /> : <Clip />}</span>
      <span className="sr-only" role="status">
        {copied ? 'Copied to clipboard' : ''}
      </span>
    </button>
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

function Clip() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function Check() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
