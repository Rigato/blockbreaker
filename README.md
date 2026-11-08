# Bricklike

Portrait HTML5 block breaker with roguelite progression. The repository, package,
live URL and ZIP keep the technical slug `blockbreaker`. G6 is approved. The
repository is in the **M7 — release and publication package** stage: the full
three-level game, QA evidence and technical release are complete, and the store
package (covers, screenshots, preview video, English metadata and submission
checklist) is ready for human review. Portal submission is manual and remains
with the user; G7 is **not** approved yet.

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
node scripts/validate-bridge-config.mjs
npm run build
npm run package   # release/blockbreaker-web.zip + manifest
npm run test:e2e  # Playwright smoke/layout (build first)
npm run qa:runs -- --runs=10   # automated baseline, not human playtest
npm run preview   # serves dist/ locally
```

## M7 — release and publication package

- `store/covers/` has the three required cover sizes (1920×1080, 800×1200,
  800×800), a contact sheet and editable SVG sources. Visual language is
  consistent across all three; the only text is **BRICKLIKE**.
- `store/screenshots/` has five real production-build captures at 390×844:
  menu, opening gameplay, laser + multiball, level-up and victory. Debug chrome
  is hidden in every shot.
- `store/video/bricklike-preview.mp4` is a 30,6 s, 1280×720 gameplay preview with
  the portrait run composed over the game's cover art. It is silent; the capture
  script and limitations are documented in `store/video/README.md`.
- `docs/release/portal-metadata.md` contains English title, short and long
  descriptions (≥ 100 words), controls, tags and portal-specific drafts for
  itch.io, GameFlare, Playgama and CrazyGames Basic.
- `docs/release/submission-checklist.md` lists every manual field, asset and
  step per portal, all marked **pending human review**.
- `docs/release/g7-review.md` inventories the package and defines the review
  checklist. The package is versioned `0.1.0-mvp`; **G7 has not been approved**,
  no tag, GitHub Release or portal upload was created by this milestone, and the
  user performs all submissions.

## M6 — QA, performance and balance

- Playwright E2E (`tests/e2e`) covers boot/menu, Space vs V controls, pause,
  sound persistence, level up, phase-1 victory/unlock/reload, AdMock
  show/fail, CDN fallback and layout at 320/390/430/1440 + mobile landscape.
- CI runs the E2E suite in a separate job with Chromium.
- `npm run qa:runs -- --runs=10` produces `docs/qa/run-log.csv`: an automated
  debug-projectile baseline for duration/levels/perks regression, explicitly
  **not** a human playtest.
- `docs/qa/` contains the device matrix, 10-run log, playtest kit, performance
  and size report, and the M6 report draft.
- No P0/P1 was found by the automated suite. Human playtest (5 people × 3 runs),
  real iOS/Android/Chromebook devices and a 10-minute hardware session are still
  required for G6. No M6 tuning was applied without human data.

## M5 — Bridge, build and distribution readiness

- Final `PlatformService`: Bridge + fallback, storage with timeout/degradation,
  pause/audio lifecycle and ads. No direct `localStorage`, no analytics.
- `game_ready` once after the menu is interactive; `level_started`,
  `level_paused`, `level_resumed`, `level_completed` and `level_failed` sent to
  the platform at the correct moments.
- **Interstitial only on Results exit** (Next/Retry): the game pauses and hard
  mutes audio, shows a blocking loading overlay, and continues on
  `closed`/`failed`/15 s timeout. No rewarded UI, banners or own frequency logic.
- Validated Bridge 2.4.1 config: no Bridge loading logo, no analytics,
  safe-area adaptation and interstitial placement.
- `npm run package` builds `release/blockbreaker-web.zip` with `index.html` at
  the root, relative paths, manifest with SHA-256 and portal limits enforced
  (≤ 1.000 files, ≤ 250 MB, paths ≤ 240 chars).
- CI uploads `dist` and the ZIP; a `v*` tag workflow creates a GitHub Release
  with the ZIP and manifest. GitHub Pages remains the review build.
- Tested in a subfolder, with the Bridge CDN blocked/fallback, mock/no-ads,
  failed/timed-out interstitial and no external requests to `api.playgama.com`.
- See [docs/build-release.md](docs/build-release.md) for the build, ZIP and
  portal checklist.

### M5.1 — review polish

- UI terminology uses **Levels** throughout (menu, HUD, select, results).
- The first perk arrives faster: the first level costs **8 XP**, then the curve
  continues at 20/26/33/39…
- Launching with **V** (or tap/click) works on the first shot: gameplay focus
  returns to the canvas after Play, Level select, pause resume and perk choice.
  **Space** and **E** fire the Prism Laser during gameplay, even when a HUD
  button still owns focus.
- Hitting a multi-HP block without breaking it plays a distinct, quieter
  metallic ricochet instead of the break crack.
- Block art was refined with stepped pixel corners, richer crystal/stone/
  obsidian materials, phase-accent rim lights and gem-like HP pips.

## M4 — Presentation, feedback and mobile polish

- Three procedural pixel-art level themes: **Crystal Grove**, **Ruined Halls**
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
- XP curve reduced by **35%**, with a faster first level: **8/20/26/33/39/46…**,
  yielding roughly 5/6/7 level ups across the three levels. The first perk is
  intentionally quick.
- Lost Multiball extras respawn after a **10 s** pause-aware cooldown, one at a
  time; the HUD shows the countdown and the timer resets per wave/level.
- New unique perk **Foresight**: a subtle dotted line predicts each ball’s short
  path with wall reflections.

## M3 — Levels, progression and persistence

- Three levels with three waves each: **Crystal Grove** (572/616/660),
  **Ruined Halls** (616/660/704) and **Arcane Depths** (638/682/726).
- ASCII-authored layouts with crystal (1 HP), stone (2 HP) and obsidian (3 HP)
  blocks; corridors and gaps keep every wave clearable.
- Level select with locks, best score/time, attempts and clears; victory unlocks
  the next level and the menu Play button starts the most advanced unlocked one.
- Results screen with score, time, bests, level and acquired perks; Retry,
  Next Level and Menu actions.
- Versioned save (`bb.save`) and settings (`bb.settings`) through the platform
  storage adapter: safe parsing, defaults and no direct `localStorage` use.
- Waves advance automatically **1.2 s** after a clear, with no intermediate
  popup. Results appear only at the end of a level.
- Initial launch receives a seeded 2.5–5° side bias so a perfectly straight tap
  cannot clear a column.
- `npm run validate:content` checks the nine waves (ids, legend, grid width,
  paddle zone, speeds and difficulty curve) and fails CI on invalid content.

## M2 — Progression

- XP per destroyed block (`XP = max HP`), base curve `20 + 10 × (level − 1)`
  with the G4.1 **−35%** multiplier and first-level discount (8/20/26/33/39…),
  overflow and a queued multi-level-up flow.
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
  score; level results with immediate retry.
- Paddle base width reduced to **100** units; Wide Paddle adds 12% per level.

### Controls

| Action | Touch | Desktop |
|---|---|---|
| Move paddle | Relative 1:1 drag | Mouse absolute / arrows / A-D |
| Launch | Tap the field | Click / V |
| Pause | Pause button → Resume/Restart/Sound/Menu | Pause button / P → Resume/Restart/Sound/Menu |
| Laser | Laser button | Laser button / Space / E |
| Perk choice | Tap a card | Click a card / 1-2-3 |
| Menu / levels | Pause → Menu, Results → Menu | Pause → Menu, Results → Menu |
| Rotate device | Portrait only (landscape guard) | — |

## Platform boot

- Bridge CDN script first in `<head>`, local file fallback, 10 s initialization
  timeout and an in-memory fallback adapter.
- The Bridge loading screen is disabled in `playgama-bridge-config.json`
  (`loadingScreenType: "none"`) so no Bridge branding is shown; the game uses
  its own boot screen and progress bar.
- `game_ready` is sent only after the menu is rendered and interactive.
- Ads are interstitial-only on the Results exit; unsupported platforms skip
  without UI breakage. The player setting and platform audio state both mute
  the audio service.
- No direct `localStorage` access in game code; storage always goes through
  `PlatformService`.

### Debug

Open `?debug=1` for FPS, platform, Bridge/storage source, canvas and stage sizes,
save reset, live feel tuning, level/wave info, force-perk, add-XP, add-ball,
test projectile and debug-only Force defeat/victory shortcuts. `?resetSave=1` resets storage on boot. The full panel collapses
to a compact FPS/platform strip while playing. For audio QA,
`document.documentElement.dataset.audioState` reports
`locked`/`running`/`suspended`/`muted`/`background`.

For the results interstitial without a portal, use **`?debug=1&adMock=show`**
to simulate a 1.4 s successful ad (spinner, mute, continuation) or
**`?debug=1&adMock=fail`** to simulate a failed ad. This flag never runs outside
debug.

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
  content/                 Level/wave definitions, validator and M2 perk catalog
  assets/fonts/            Bundled Silkscreen OFL font files
  game/                    Game orchestration, contracts, events and config
  sim/                     Pure fixed-step simulation and collision
  progression/             XP curve, perks, level save/stats and run modifiers
  input/                   Touch, mouse and keyboard input
  platform/                PlatformService + Bridge/Fallback adapters
  render/                  Level themes, pixel block art, pooled effects and scene
  ui/                      Menu, HUD, level-up, overlays, orientation and debug
  i18n/                    English strings
tests/                     Unit tests + tests/e2e Playwright
scripts/                   Content validator, Bridge config validator and packager
docs/                      GDD, spec, build/release, plan and docs/qa reports
public/                    Bridge config, favicon, licenses and static assets
release/                   Generated ZIP + manifest (not committed)
```

## Docs

- [GDD](docs/GDD_Bricklike.md)
- [Technical publishing spec](docs/spec-tecnica-publicacao.md)
- [Low-friction publishing plan](docs/plano-baixa-fricao.md)
- [MVP implementation plan](docs/plano-implementacao-mvp.md)

## Deployment

Every push to `main` runs typecheck, tests, content validation, Bridge config
validation, build and package in CI; the ZIP is uploaded as an artifact. The
`deploy` workflow publishes `dist/` to GitHub Pages for review. A `v*` tag runs
`.github/workflows/release.yml` and creates a GitHub Release with the web ZIP
and manifest. Portal submission is M7.
