import type { ReactNode } from 'react';

/**
 * AppShell — the standard Glasshopper layout every template uses.
 *
 * Regions:
 *   topbar  — fixed strip (greeting, status, clock). Optional.
 *   children — the stage (main content; scrolls on landscape tablet/desktop).
 *   rail    — optional side column (scenes, now-playing, energy). Sits beside
 *             the stage on landscape ≥840px, stacks below it on phone/portrait.
 *
 * Behaviour comes entirely from shell.css — keep it CSS-driven so every
 * template stays identical in format.
 */
export function AppShell({
  topbar,
  rail,
  children,
}: {
  topbar?: ReactNode;
  rail?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="gh-app">
      {topbar && <header className="gh-app__topbar">{topbar}</header>}
      <div className="gh-app__body">
        <main className="gh-app__stage">{children}</main>
        {rail && <aside className="gh-app__rail">{rail}</aside>}
      </div>
    </div>
  );
}
