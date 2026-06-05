import { config } from '../config';
import { Eye } from './Eye';

export function Nav() {
  return (
    <nav className="nav">
      <a href="/" className="nav__brand" aria-label="Glasshopper home">
        <span className="nav__mark" aria-hidden>
          <Eye size={26} />
        </span>
        <span>{config.brand}</span>
      </a>
      <div className="nav__links">
        <a href={config.docs}>Docs</a>
        <a href={`${config.docs}/hooks/useEntity`}>Hooks</a>
        <a href={`${config.docs}/templates/`}>Templates</a>
        <a href={config.repo} className="nav__github">
          <Github />
          <span>GitHub</span>
        </a>
      </div>
    </nav>
  );
}

function Github() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.09 3.29 9.4 7.86 10.93.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.2 1.77 1.2 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.74-1.55-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.2-3.1-.12-.3-.52-1.48.11-3.08 0 0 .98-.31 3.2 1.18a11.1 11.1 0 0 1 5.83 0c2.21-1.5 3.18-1.18 3.18-1.18.63 1.6.23 2.78.12 3.08.75.81 1.2 1.84 1.2 3.1 0 4.43-2.7 5.4-5.27 5.69.42.36.78 1.06.78 2.15v3.19c0 .31.21.67.79.55C20.21 21.4 23.5 17.09 23.5 12 23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  );
}
