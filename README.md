# Bricklike

Portrait HTML5 block breaker with roguelite progression. The repository, package,
live URL and ZIP keep the technical slug `blockbreaker`. The current development
line is **v0.3.0 — Endless mode**: an infinite run with procedural waves on top
of the **v0.2.0 campaign** — **6 phases, 21 waves**, **9 block types**, **7 phase
elements**, **3 bosses**, **19 perks**, dynamic layout zoom and per-phase
endings. The M0–M7 history below remains valid and the `0.1.0-mvp` build is still
the frozen package published on itch.io.

The v0.3.0 work is implemented on `main`; there is no public v0.3.0 release or
portal upload yet. The v0.1.0-mvp ZIP on itch.io is **frozen** and is not
replaced by this branch. The GitHub Pages review build tracks the branch.

**Live review build:** <https://rigato.github.io/blockbreaker/>  
**Debug build:** <https://rigato.github.io/blockbreaker/?debug=1>

## v0.4.0-dev — first impression pass

- **New block art:** polished arcade tiles with saturated materials, deeper
  bevels, softer shadows and clearer HP/crack feedback, designed to match the
  store covers and remain readable at mobile size.
- **New title screen:** animated bouncing-ball attract background, Campaign and
  Endless mode cards, progress nodes and a Settings entry point. The old
  `XP · Perks · Levels` and controls footer are gone.
- **Campaign level select:** full-screen themed cards for the six phases, with
  per-phase icons, accents, taglines, content highlights, boss badges, best
  scores and lock states.
- **Endless unlock:** Endless stays locked until the campaign is completed; the
  card looks disabled and opens an explanation dialog when tapped.
- **Settings:** Sound, Music and Screen shake toggles in the menu and pause,
  persisted through `bb.settings` with backward-compatible defaults.
- **How to Play:** a five-page menu dialog with real screenshots and short
  explanations of the loop, controls, perks, bosses and Endless.
- **About Us:** a menu footer dialog with the Bad Decision Games logo and a
  short studio note.
- **Compact HUD:** below 440px shell width the HUD switches to a two-row layout
  with icon stats and 11–13px values, keeping 907×510 and 800×450 iframes legible.
- **Save:** `campaignComplete` marks the phase-6 clear and migrates old saves
  that already have a phase-6 clear.
- **Store assets:** eight updated screenshots, regenerated covers and fresh
  18.1 s landscape/portrait preview videos.
- **Menu backdrop:** the static phase-1 wave is no longer used behind the title
  screen; a presentation-only Phaser layer draws the bouncing balls.

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
npm run test:e2e  # Playwright smoke/layout/endless/campaign (build first)
npm run qa:runs -- --runs=10   # automated baseline, not human playtest
npm run preview   # serves dist/ locally
```

## v0.3.0 — Endless mode

Development line: `main`. Not published to any portal yet; the `0.1.0-mvp` ZIP
on itch.io stays frozen.

- **Endless button** in the main menu, separate from Play and Levels.
- **Infinite run:** no victory condition; the run ends when every ball is lost.
  Waves are generated procedurally from the run seed.
- **Speed ramp:** starts at **660**, gains **+14 per wave** and caps at **1100**.
  It passes **780 on wave 10** (786) and reaches the cap on **wave 32**.
- **Rows** grow from **4 to 12**; density rises from about 55% to 92%.
- **Progressive content:** `moving` (wave 4), `explosive` (5), `regenerative`
  (7), `multiplier` (9), `linked` (11) and `generator` (13). Elements enter as
  `wall` (2), `deflector` (4), `portal` (6), `mover` (8), `gate` (10) and
  `rotor` (12); wave 14+ combines all seven.
- **Bosses every 5 waves**, alternating Frost Sentinel, Ember Warden and Void
  Herald patterns, with HP `40 + wave × 6`.
- **XP and perks** use the same curve as Levels and persist between waves.
  Second Chance still revives once per run.
- **Results** show Wave, Best wave, score, level and perks, with **no Next
  button**. Retry starts a new Endless run and Menu returns to the menu.
- **Save:** `endless: { bestWave, bestScore, runs }` inside the v1 `bb.save`;
  old saves parse to zeroed stats.
- Endless **does not unlock campaign phases** and does not change campaign
  balance.
- `npm run test:e2e` covers the Endless flow (menu → wave 1 → next waves →
  defeat → results/save) alongside the campaign suite.

## v0.2.0 — campaign expansion

Development branch: `feat/v0.2.0`. Not published to any portal yet; the
`0.1.0-mvp` ZIP on itch.io stays frozen.

- **Campaign:** 6 phases with waves per phase **3 / 3 / 3 / 3 / 4 / 5 = 21**.
  Phases 4–6 are **Frostbound Spire** (3), **Emberforge** (4) and
  **Void Threshold** (5). Validated content: **759 blocks**, **1.831 XP**.
- **9 block types:** crystal, stone, obsidian plus explosive, regenerative,
  moving, multiplier, generator and linked. Each special block has simulation
  behaviour, not just different HP.
- **7 phase elements:** wall, obstacle, deflector, portal, mover, rotor and gate,
  with collision and procedural art.
- **3 bosses:** Frost Sentinel (phase 4), Ember Warden (phase 5) and Void Herald
  (phase 6). Boss waves only clear when the blocks **and** the boss are down.
  Boss shards apply paddle **corrosion** (−6% width per stack, max 3, until the
  end of the wave).
- **Wave challenges:** `timeLimit` on `p4w2`, `p5w3` and `p6w2`; `noLaser` on
  `p5w2` and `p6w4`. A failed time limit ends the run; `noLaser` disables only
  that wave.
- **19 perks:** the original 11 plus Critical Strike, Laser Focus, Overcharge,
  Combo Master, Second Chance, Bomb Ball, Boss Bane and Swift Ball. Builds have
  intended synergies (laser, damage, XP/score, defence, explosions).
- **Second Chance:** one revive per run with a fresh ball. It consumes a single
  charge and does not create per-ball lives.
- **Dynamic layout zoom:** tall waves scale blocks, elements and bosses between
  **0.68 and 1.0**; the paddle, ball and input mapping keep their normal size.
  This is a layout scale, not a camera zoom.
- **Endings:** per-phase epilogues, **S/A/B** rank, a campaign finale after
  Void Herald and a defeat epilogue. Shown on the results screen.
- **Save:** schema v1 is unchanged; `unlockedPhase` now spans **1..6** and
  phases 4–6 unlock sequentially. Old saves remain valid.
- **Laser rule:** Prism Laser only fires while at least one ball is loose. The
  initial stuck ball and Sticky Paddle block it, and the HUD shows why.

## M7 — release and publication package

- `store/covers/` has the required cover sizes (1920×1080, 800×1200, 800×800)
  plus the Playgama portrait **1080×1920**, a contact sheet and editable SVG
  sources. Visual language is consistent; the only text is **BRICKLIKE**.
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
  and size report, and the M6 report.
- No P0/P1 was found by the automated suite. G6 was approved on 2026-11-08 after
  the owner completed the human playtest, real-device matrix and 10-minute
  hardware session. No M6 tuning was applied without human data; the detailed
  human evidence remains with the owner.

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
  returns to the canvas after Campaign, level select, pause resume and perk choice.
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
| Laser | Laser button (needs a loose ball) | Laser button / Space / E (needs a loose ball) |
| Perk choice | Tap a card | Click a card / 1-2-3 |
| Menu / modes | Campaign card → level select; Endless card (after campaign); Settings | Campaign card → level select; Endless card (after campaign); Settings |
| Rotate device | Portrait only (landscape guard) | — |

The Prism Laser is disabled while every ball is stuck (opening serve or Sticky
Paddle). Sticky releases on tap or automatically after 2.5 s.

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
  content/                 Phase/wave/element/boss/perk definitions
  content/endings.ts       Per-phase epilogues, ranks and campaign finale
  content/endless.ts       Endless wave generator, speed ramp and bosses
  assets/fonts/            Bundled Silkscreen OFL font files
  game/                    Game orchestration, contracts, events and config
  sim/                     Pure fixed-step simulation, collision and layout scale
  sim/layout.ts            computeFieldScale (0.68–1.0 layout zoom)
  progression/             XP curve, perks, level save/stats and run modifiers
  input/                   Touch, mouse and keyboard input
  platform/                PlatformService + Bridge/Fallback adapters
  render/                  Themes, block/element/boss art, effects and scene
  render/elementArt.ts     Walls, obstacles, deflectors, portals, movers, rotors, gates
  render/bossArt.ts        Frost Sentinel, Ember Warden, Void Herald and shards
  ui/                      Menu, HUD, level-up, overlays, orientation and debug
  ui/HowToPlayDialog.ts    Five-page screenshot walkthrough
  ui/AboutDialog.ts        Bad Decision Games studio dialog
  styles/                  Phase select, HUD compact, dialogs and menu footer CSS
  i18n/                    English strings
tests/                     Unit tests + tests/e2e Playwright
scripts/                   Content validator, Bridge config validator and packager
docs/                      GDD, spec, build/release, plan and docs/qa reports
public/                    Bridge config, favicon, licenses, how-to-play shots and studio logo
release/                   Generated ZIP + manifest (not committed)
```

## Docs

- [GDD](docs/GDD_Bricklike.md)
- [Technical publishing spec](docs/spec-tecnica-publicacao.md)
- [Low-friction publishing plan](docs/plano-baixa-fricao.md)
- [MVP implementation plan](docs/plano-implementacao-mvp.md)
- [v0.2.0 campaign expansion plan](docs/plano-v0.2.0.md)
- [Endless mode plan](docs/plano-endless.md)
- [v0.4.0 visual/menu plan](docs/plano-v0.4.0-menu-visual.md)
- [GDD × current state gap analysis](docs/gdd-gap-analysis.md)
- [CrazyGames rejection review](docs/release/crazygames-review.md)
- [Current handoff — v0.3.0](docs/handoff-v0.3.0.md)
- [Post-MVP handoff — historical](docs/handoff-proxima-fase.md)

## Deployment

Every push to `main` runs typecheck, tests, content validation, Bridge config
validation, build and package in CI; the ZIP is uploaded as an artifact. The
`deploy` workflow publishes `dist/` to GitHub Pages for review. A `v*` tag runs
`.github/workflows/release.yml` and creates a GitHub Release with the web ZIP
and manifest. The tag/Release wait for G7, and portal submission is manual.
