# Contributing

Thanks for considering a contribution. This document covers the basics — file an issue first if you're unsure whether a change fits the project scope.

## Ground rules

- **Open an issue before large PRs.** Saves us both time if the direction is wrong.
- **One change per PR.** A bug fix and a refactor in the same PR makes review harder.
- **Keep the scaffold minimal.** Demos and brand-specific UI belong in `examples/`, not `src/`.
- **Don't add dependencies casually.** Each new dep is something everyone consuming the scaffold will install. Open an issue first.

## Dev setup

```bash
npm install
cp .env.example .env.local        # set VITE_HA_URL
npm run dev                       # standalone mode (long-lived token via ?token=...)
npm run sync                      # build + copy bundle into custom_components/ha_react_ui/frontend/
npm run typecheck
```

Test the integration locally by copying the repo into your HA config dir, or by mounting it as a volume in HA's Docker container.

## Commit style

[Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`. Keep the subject under 70 characters. Body explains *why* if it isn't obvious.

## Code style

- TypeScript strict mode is on — keep it on.
- No `any`. Use `unknown` and narrow.
- Hooks are pure functions returning data — side effects belong in `lib/`.
- Python integration follows [HA development guidelines](https://developers.home-assistant.io/). Run `python -m ruff check` if you have it.

## Reviewing PRs

Maintainers will review within 7 days. If a PR sits longer, ping the issue — sometimes notifications get lost.

## Releases

Releases follow [SemVer](https://semver.org/). Breaking changes bump the major. Use the `CHANGELOG.md` (Keep a Changelog format) — every PR that adds visible behavior should add a line under `## [Unreleased]`.

## Code of Conduct

By contributing you agree to abide by the [Code of Conduct](./CODE_OF_CONDUCT.md).
