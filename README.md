# Block Breaker Roguelite

Portrait HTML5 block breaker with roguelite progression. This repository is in the
**M0 — Foundation** stage: the playable game arrives in M1. The goal of M0 is a
stable shell, frozen contracts and a proven Bridge boot path.

**Live review build:** <https://rigato.github.io/blockbreaker/>

## Stack

- [Phaser 3.90](https://phaser.io/) for scenes, rendering and input
- TypeScript (strict) + [Vite 8](https://vite.dev/)
- [Vitest](https://vitest.dev/) for unit tests
- [Playgama Bridge 2.4](https://github.com/Playgama/bridge) for platform services
- One build for itch.io, GameFlare, Playgama and CrazyGames Basic Launch

## Run locally

Requirements: Node.js 22.12+ (CI uses Node 24) and npm.

```bash
npm ci
npm run dev       # http://localhost:5173
```

Validation commands:

```bash
npm run typecheck
npm test
npm run build
npm run preview   # serves dist/ locally
```

## M0 shell

- Portrait stage centered on desktop with a decorative frame, safe-area padding
  and no page scrollbar.
- Minimal DOM menu placeholder and a Phaser canvas that fills the stage.
- Bridge boot: CDN script first in `<head>`, local file fallback, 10 s
  initialization timeout and an in-memory fallback adapter.
- The Bridge loading screen is disabled in `playgama-bridge-config.json`
  (`loadingScreenType: "none"`) so no Bridge branding is shown; the game uses
  its own boot screen and progress bar.
- `game_ready` is sent only after the placeholder menu is rendered and
  interactive.
- No direct `localStorage` access in game code; storage always goes through
  `PlatformService`.
- No Bridge branding or loading logo is displayed.

### Debug

Open `?debug=1` for FPS, detected platform, Bridge/storage source, canvas and
viewport sizes, and a save reset button. `?resetSave=1` resets storage on boot.

## Project structure

```text
src/
  boot/bridgeBoot.ts       Bridge timeout + fallback selection
  game/                    Game orchestration and frozen contracts
  platform/                PlatformService + Bridge/Fallback adapters
  render/                  Phaser scene
  ui/                      M0 menu shell + debug panel
  i18n/                    English strings
tests/                     Unit tests
docs/                      GDD, technical spec and implementation plan
public/                    Bridge config, favicon and static assets
```

## Docs

- [GDD](docs/GDD_Block_Breaker_Roguelite.md)
- [Technical publishing spec](docs/spec-tecnica-publicacao.md)
- [Low-friction publishing plan](docs/plano-baixa-fricao.md)
- [MVP implementation plan](docs/plano-implementacao-mvp.md)

## Deployment

Every push to `main` runs typecheck, tests and build in CI. The `deploy`
workflow publishes `dist/` to GitHub Pages using the GitHub Actions source.
