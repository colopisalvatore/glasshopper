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
 * Height behaviour (landscape tablet / desktop) — pick ONE per template so the
 * dashboard fills the fixed screen instead of top-packing with dead space:
 *   stage="spread"  → distribute regions across the full height.
 *   stage="center"  → center the content block vertically.
 *   (or) add the class `gh-fill` to one child region so it grows to absorb the
 *        slack; on a .gh-grid it also stretches the tiles.
 *   railFill        → distribute the rail's items across its height.
 *
 * Behaviour comes from shell.css — keep it CSS-driven so every template stays
 * identical in format.
 */
export function AppShell({
  topbar,
  rail,
  children,
  stage,
  railFill,
}: {
  topbar?: ReactNode;
  rail?: ReactNode;
  children: ReactNode;
  stage?: 'spread' | 'center';
  railFill?: boolean;
}) {
  return (
    <div className="gh-app">
      {topbar && <header className="gh-app__topbar">{topbar}</header>}
      <div className="gh-app__body">
        <main className={`gh-app__stage${stage ? ` gh-app__stage--${stage}` : ''}`}>
          {children}
        </main>
        {rail && (
          <aside className={`gh-app__rail${railFill ? ' gh-app__rail--fill' : ''}`}>{rail}</aside>
        )}
      </div>
    </div>
  );
}
