# Block Breaker Roguelite

Portrait HTML5 block breaker with roguelite progression. The repository is in the
**M3 — phases, waves, progression and persistence** stage: three phases with
three handcrafted waves each, phase unlocking, best score/time tracking, a versioned
save and the M2 XP/perk core. The content starts at Crystal Grove and ends at the
Arcane Depths.

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
npm run validate:content
npm run build
npm run preview   # serves dist/ locally
```

## M3 — Phases, progression and persistence

- Three phases with three waves each: **Crystal Grove** (520/560/600),
  **Ruined Halls** (560/600/640) and **Arcane Depths** (580/620/660).
- ASCII-authored layouts with crystal (1 HP), stone (2 HP) and obsidian (3 HP)
  blocks; corridors and gaps keep every wave clearable.
- Phase select with locks, best score/time, attempts and clears; victory unlocks
  the next phase and the menu Play button starts the most advanced unlocked one.
- Results screen with score, time, bests, level and acquired perks; Retry,
  Next Phase and Menu actions.
- Versioned save (`bb.save`) and settings (`bb.settings`) through the platform
  storage adapter: safe parsing, defaults and no direct `localStorage` use.
- Waves advance automatically **1.2 s** after a clear, with no intermediate
  popup. Results appear only at the end of a phase.
- Initial launch receives a seeded 2.5–5° side bias so a perfectly straight tap
  cannot clear a column. Prism Laser hits only the first block in its beam.
- `npm run validate:content` checks the nine waves (ids, legend, grid width,
  paddle zone, speeds and difficulty curve) and fails CI on invalid content.

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
- HUD XP bar, acquired-perks list and live run score; phase results with
  immediate retry.
- Paddle base width reduced to **100** units; Wide Paddle adds 12% per level.

### Controls

| Action | Touch | Desktop |
|---|---|---|
| Move paddle | Relative 1:1 drag | Mouse absolute / arrows / A-D |
| Launch | Tap the field | Click / Space |
| Pause | Pause button | Pause button / P |
| Laser | Laser button | Laser button / E |
| Perk choice | Tap a card | Click a card / 1-2-3 |
| Menu / phases | Results → Menu | Results → Menu |

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
save reset, live feel tuning, phase/wave info, force-perk, add-XP, add-ball and
test projectile. `?resetSave=1` resets storage on boot. The full panel collapses
to a compact FPS/platform strip while playing.

## Project structure

```text
src/
  boot/bridgeBoot.ts       Bridge timeout + fallback selection
  content/                 Phase/wave definitions, validator and M2 perk catalog
  game/                    Game orchestration, contracts, events and config
  sim/                     Pure fixed-step simulation and collision
  progression/             XP curve, perks, phase save/stats and run modifiers
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

Every push to `main` runs typecheck, tests, content validation and build in CI.
The `deploy` workflow publishes `dist/` to GitHub Pages using the GitHub Actions
source.
