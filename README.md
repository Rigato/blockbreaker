# Block Breaker Roguelite

Portrait HTML5 block breaker with roguelite progression. The repository is in the
**M4 — presentation, feedback and mobile polish** stage: procedural pixel-art
phase backdrops, distinct block materials, pooled particles and screen feedback,
synthesized WebAudio SFX/ambience, bundled pixel font, mobile orientation guard
and the complete M3 phase/save flow.

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

## M4 — Presentation, feedback and mobile polish

- Three procedural pixel-art phase themes: **Crystal Grove**, **Ruined Halls**
  and **Arcane Depths**, with layered backdrops, silhouettes, parallax motes and
  themed frames. No external art or runtime downloads.
- Blocks read by material as well as colour: crystal facets, stone masonry,
  obsidian runes, 1–3 HP pips and deterministic damage cracks. Verified in
  grayscale.
- Pooled feedback with a hard budget of **120 particles** and **48 ball trails**:
  hit sparks, break bursts, explosion rings, laser muzzle flash, wave-clear
  sweep, subtle camera shake and ball impact pulses.
- Original synthesized WebAudio SFX for paddle, block hit/break, lost ball,
  laser, explosion, safety net, wave clear, level up, victory and defeat, plus a
  quiet ambient loop. No audio files or licensed samples.
- Audio unlocks on the first gesture (iOS-safe), mutes on pause/level up,
  background and platform audio changes, and resumes only after a gesture.
- Complete pause menu with **Resume**, **Restart Wave**, **Sound** and **Menu**.
- Touch landscape shows a **Rotate to portrait** guard, auto-pauses a live run
  and resumes only when portrait returns. Desktop and fine-pointer notebooks
  keep the normal layout.
- Bundled **Silkscreen** OFL pixel font for display, buttons and numbers; system
  sans for body copy. UI skin adds scanlines, frame ornaments and reduced-motion
  support.
- Responsive and scroll-free at 320×568, 390×844, 430×932 and desktop, with
  safe-area handling for notch devices.

### G4.1 — gameplay tuning and feel

- Level up now pauses immediately and flashes/pulses the XP bar before the perk
  popup appears (~450 ms), making the level gain readable.
- **Prism Laser** is repeatable up to level 3: level L deals L damage to the
  first **L+2** blocks in its column (1/3, 2/4, 3/5).
- Paddle max speed increased from 2600 to **2808** (+8%).
- Ball speeds increased by **10%**: 572/616/660, 616/660/704 and 638/682/726.
- XP curve reduced by **35%**: 13/20/26/33/39/46…, yielding roughly 4/6/7 level
  ups across the three phases.
- Lost Multiball extras respawn after a **10 s** pause-aware cooldown, one at a
  time; the HUD shows the countdown and the timer resets per wave/phase.
- New unique perk **Foresight**: a subtle dotted line predicts each ball’s short
  path with wall reflections.

## M3 — Phases, progression and persistence

- Three phases with three waves each: **Crystal Grove** (572/616/660),
  **Ruined Halls** (616/660/704) and **Arcane Depths** (638/682/726).
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
  cannot clear a column.
- `npm run validate:content` checks the nine waves (ids, legend, grid width,
  paddle zone, speeds and difficulty curve) and fails CI on invalid content.

## M2 — Progression

- XP per destroyed block (`XP = max HP`), base curve `20 + 10 × (level − 1)`
  with the G4.1 **−35%** multiplier (13/20/26/33/39…), overflow and a queued
  multi-level-up flow.
- Automatic pause on level up, XP-bar flash, three distinct perk cards,
  selection by tap/click or keys 1/2/3, no reroll.
- Eleven perks: Multiball, Wide Paddle, Power Ball, Quick Study, Arcane Turret,
  Giant Ball, Sticky Paddle, Safety Net, Prism Laser (3 levels), Foresight and
  Explosive Core.
- Multipliers and effects are derived from perks and applied live; the debug
  panel can force individual perks and grant XP.
- Contextual laser button plus E on desktop; sticky release by tap/timer;
  Safety Net protects the last ball and reloads each wave.
- HUD XP bar, acquired-perks list, Multiball respawn countdown and live run
  score; phase results with immediate retry.
- Paddle base width reduced to **100** units; Wide Paddle adds 12% per level.

### Controls

| Action | Touch | Desktop |
|---|---|---|
| Move paddle | Relative 1:1 drag | Mouse absolute / arrows / A-D |
| Launch | Tap the field | Click / Space |
| Pause | Pause button → Resume/Restart/Sound/Menu | Pause button / P → Resume/Restart/Sound/Menu |
| Laser | Laser button | Laser button / E |
| Perk choice | Tap a card | Click a card / 1-2-3 |
| Menu / phases | Pause → Menu, Results → Menu | Pause → Menu, Results → Menu |
| Rotate device | Portrait only (landscape guard) | — |

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
to a compact FPS/platform strip while playing. For audio QA,
`document.documentElement.dataset.audioState` reports
`locked`/`running`/`suspended`/`muted`/`background`.

## Assets and licenses

- All in-game art, particles and audio are generated procedurally at runtime;
  the build ships no third-party sprites, samples or music.
- **Silkscreen** font: OFL, license at
  [public/licenses/silkscreen-OFL.txt](public/licenses/silkscreen-OFL.txt).
- Phaser and Playgama Bridge licenses live under `public/licenses/`.

## Project structure

```text
src/
  boot/bridgeBoot.ts       Bridge timeout + fallback selection
  audio/                   Synthesized WebAudio service, voice budget and lifecycle
  content/                 Phase/wave definitions, validator and M2 perk catalog
  assets/fonts/            Bundled Silkscreen OFL font files
  game/                    Game orchestration, contracts, events and config
  sim/                     Pure fixed-step simulation and collision
  progression/             XP curve, perks, phase save/stats and run modifiers
  input/                   Touch, mouse and keyboard input
  platform/                PlatformService + Bridge/Fallback adapters
  render/                  Phase themes, pixel block art, pooled effects and scene
  ui/                      Menu, HUD, level-up, overlays, orientation and debug
  i18n/                    English strings
tests/                     Unit tests
docs/                      GDD, technical spec and implementation plan
public/                    Bridge config, favicon, licenses and static assets
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
