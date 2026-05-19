import { config } from '../config';

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer__row">
        <div className="footer__brand">
          <strong>{config.brand}</strong>
          <span>React dashboards for Home Assistant.</span>
        </div>
        <nav className="footer__cols">
          <div>
            <h4>Product</h4>
            <a href={config.docs}>Docs</a>
            <a href={`${config.docs}/templates/`}>Templates</a>
            <a href={`${config.docs}/templates/jarvis`}>Jarvis premium</a>
          </div>
          <div>
            <h4>Project</h4>
            <a href={config.repo}>GitHub</a>
            <a href={`${config.repo}/issues`}>Issues</a>
            <a href={`${config.repo}/discussions`}>Discussions</a>
          </div>
          <div>
            <h4>Legal</h4>
            <a href={`${config.repo}/blob/main/LICENSE`}>Apache 2.0</a>
            <a href={`${config.repo}/blob/main/SECURITY.md`}>Security</a>
          </div>
        </nav>
      </div>
      <p className="footer__meta">
        © {new Date().getFullYear()} · Built with care by Salvatore Colopi · Not affiliated
        with Home Assistant or Nabu Casa.
      </p>
    </footer>
  );
}
