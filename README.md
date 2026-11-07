# Block Breaker Roguelite

Portrait HTML5 block breaker with roguelite progression. The repository is in the
**M1 — Playable core** stage: one test wave is playable with paddle, ball,
blocks, pause, defeat and wave-complete states. XP, perks, phase content and
final presentation arrive in later milestones.

**Live review build:** <https://rigato.github.io/blockbreaker/>  
**Debug build:** <https://rigato.github.io/blockbreaker/?debug=1>

## Stack

- [Phaser 3.90](https://phaser.io/) for scenes, rendering and input
- TypeScript (strict) + [Vite 8](https://vite.dev/)
- [Vitest](https://vitest.dev/) for simulation, collision and progression tests
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

## M1 — Playable core

- Fixed 120 Hz simulation, swept circle-vs-AABB collisions and anti-stall.
- Paddle, launch, multiple balls (up to 8), blocks with 1–3 HP, projectiles and
  wave-clear/defeat outcomes.
- Touch relative drag, mouse absolute movement, arrows/A-D with acceleration,
  Space to launch and P to pause.
- Minimal DOM HUD with wave, active balls, remaining blocks, score and pause.
- Pause, wave-cleared and defeat overlays with immediate restart.
- Two provisional test waves (`First Light` and `Dense Hall`) used only for M1
  QA; the real phase content arrives in M3.
- Portrait stage centered on desktop with a decorative frame, safe-area padding
  and no page scrollbar.

### Controls

| Action | Touch | Desktop |
|---|---|---|
| Move paddle | Relative 1:1 drag | Mouse absolute / arrows / A-D |
| Launch | Tap the field | Click / Space |
| Pause | Pause button | Pause button / P |
| Restart | Overlay button | Overlay button |

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
save reset, live feel tuning (ball speed, paddle width/speed, ball radius, bounce
angle, fixed step), test-wave selection, add ball and test projectile.
`?resetSave=1` resets storage on boot. The full debug panel collapses to a
compact FPS/platform strip while playing.

## Project structure

```text
src/
  boot/bridgeBoot.ts       Bridge timeout + fallback selection
  game/                    Game orchestration, contracts, events and config
  sim/                     Pure fixed-step simulation and collision
  input/                   Touch, mouse and keyboard input
  platform/                PlatformService + Bridge/Fallback adapters
  render/                  Phaser scene and placeholder field rendering
  ui/                      Menu shell, HUD, overlays and debug panel
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
