# Block Breaker Roguelite

Portrait HTML5 block breaker with roguelite progression. The repository is in the
**M2 — XP, level up and perks** stage: a full three-wave provisional run has XP,
level-up choices, ten perks and the M1 playable core. The final three-phase
content and save system arrive in M3.

**Live review build:** <https://rigato.github.io/blockbreaker/>  
**Debug build:** <https://rigato.github.io/blockbreaker/?debug=1>

## Stack

- [Phaser 3.90](https://phaser.io/) for scenes, rendering and input
- TypeScript (strict) + [Vite 8](https://vite.dev/)
- [Vitest](https://vitest.dev/) for simulation, progression and offer tests
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

## M2 — Progression

- XP per destroyed block (`XP = max HP`), curve `20 + 10 × (level − 1)`,
  overflow and a queued multi-level-up flow.
- Automatic pause on level up, three distinct perk cards, selection by tap/click
  or keys 1/2/3, no reroll.
- Ten perks: Multiball, Wide Paddle, Power Ball, Quick Study, Arcane Turret,
  Giant Ball, Sticky Paddle, Safety Net, Prism Laser and Explosive Core.
- Multipliers and effects are derived from perks and applied live; the debug
  panel can force individual perks and grant XP.
- Contextual laser button plus E on desktop; sticky release by tap/timer;
  Safety Net protects the last ball and reloads each wave.
- Three provisional waves with rising ball speed: **First Light** (520),
  **Dense Hall** (560) and **Obsidian Gate** (600), reaching 4+ level ups.
- HUD XP bar, acquired-perks list and live run score; wave-clear, run-complete
  and defeat dialogs with immediate progress/restart.
- Paddle base width reduced to **100** units; Wide Paddle adds 12% per level.

### Controls

| Action | Touch | Desktop |
|---|---|---|
| Move paddle | Relative 1:1 drag | Mouse absolute / arrows / A-D |
| Launch | Tap the field | Click / Space |
| Pause | Pause button | Pause button / P |
| Laser | Laser button | Laser button / E |
| Perk choice | Tap a card | Click a card / 1-2-3 |

## Platform boot

- Bridge CDN script first in `<head>`, local file fallback, 10 s initialization
  timeout and an in-memory fallback adapter.
- The Bridge loading screen is disabled in `playgama-bridge-config.json`
  (`loadingScreenType: "none"`) so no Bridge branding is shown; the game uses
  its own boot screen and progress bar.
- `game_ready` is sent only after the menu is rendered and interactive.
- No direct `localStorage` access in game code; storage always goes through
  `PlatformService`.

### Debug

Open `?debug=1` for FPS, platform, Bridge/storage source, canvas and stage sizes,
save reset, live feel tuning, test-wave selection, force-perk, add-XP, add-ball
and test projectile. `?resetSave=1` resets storage on boot. The full panel
collapses to a compact FPS/platform strip while playing.

## Project structure

```text
src/
  boot/bridgeBoot.ts       Bridge timeout + fallback selection
  content/perks.ts         M2 perk catalog
  game/                    Game orchestration, contracts, events and config
  sim/                     Pure fixed-step simulation and collision
  progression/             XP curve, offers and derived run modifiers
  input/                   Touch, mouse and keyboard input
  platform/                PlatformService + Bridge/Fallback adapters
  render/                  Phaser scene and placeholder field rendering
  ui/                      Menu, HUD, level-up, overlays and debug panel
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
