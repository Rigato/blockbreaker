# Portal metadata — Bricklike

Draft de metadata em inglês para revisão humana antes de qualquer submissão.
A submissão é **manual**, feita pelo usuário. Nada aqui foi enviado a portal.

## Identidade

- **Title:** Bricklike
- **Technical slug / package:** `blockbreaker` (não usar como título de loja)
- **Genre:** Arcade / Brick Breaker
- **Subgenre:** Roguelite progression
- **Orientation:** Portrait
- **Players:** Single player
- **Platform:** HTML5 (browser; desktop and mobile)
- **Language:** English (UI and metadata)
- **Price:** Free
- **Business model:** No purchases. Interstitial ads at natural breaks where the hosting portal provides them (never in the tutorial) and an optional one-per-run rewarded revive; no ads on itch.io or GameFlare.

## Short description

> A portrait block breaker with roguelite perks. Learn the ropes in a short
> playable tutorial, smash themed bricks, build game-changing synergies, beat
> three bosses and survive Endless mode.

_(≈190 characters.)_

## Long description (≥ 100 words)

> Bricklike is a portrait block breaker that mixes arcade brick-smashing with
> short roguelite runs. A short playable tutorial teaches you to move, launch,
> break blocks and choose your first perk; it can be skipped at any time. Then
> comes a six-level campaign with 20 hand-authored waves — 22 waves in total
> including the tutorial: Crystal Grove, Ruined Halls, Arcane Depths, Frostbound
> Spire, Emberforge and Void Threshold.
>
> Every destroyed block earns XP. When you level up, the action pauses and you
> choose one of three random perks. Stack Multiball, widen the paddle, add
> damage, summon an Arcane Turret or fire the Prism Laser to build a different
> run each time. Special blocks explode, regenerate, move, multiply XP, link
> together or spawn new bricks, and the later levels add walls, deflectors,
> portals, moving mechanisms, rotors and timed gates.
>
> The last three levels end in boss fights against the Frost Sentinel, Ember
> Warden and Void Herald. Clear the campaign to unlock Endless mode, an infinite
> run with escalating speed, procedural waves and a boss every five waves.
>
> Runs last a few minutes and progress is saved between sessions on the device.
> Play with touch, mouse or keyboard. No account, download or install is
> required — the game runs directly in the browser.

_(≈220 words.)_

## Controls

**Touch**
- Drag horizontally to move the paddle. The drag is 1:1 in the centre and
  gently accelerates near the side edges so the paddle can reach the wall
  without triggering the browser's edge gesture.
- Tap to launch the ball.
- Tap a perk card to choose it.
- Use the on-screen Prism Laser button when the perk is active and a ball has
  been launched.
- Tap the pause button for settings, restart or menu.

**Mouse**
- Move the mouse horizontally to move the paddle.
- Click to launch the ball.
- Click a perk card to choose it.
- Click the pause button for settings, restart or menu.

**Keyboard**
- `←` / `→`: move the paddle.
- `V`: launch the ball.
- `Space` / `E`: fire the Prism Laser when the perk is active.
- `P`: pause or resume.
- `1` / `2` / `3`: choose a perk card.

## Tags

`arcade`, `block breaker`, `brick breaker`, `roguelite`, `pixel art`,
`html5`, `mobile`, `single player`, `short session`, `perks`, `bosses`,
`endless`

## itch.io

**Title:** Bricklike

**Short description:** Use the short description above.

**Long description:** Use the long description above.

**Project kind:** HTML5

**Release status:** Released

**Pricing:** Free, with an optional donation.

**Embed options:**
- Enable **Mobile Friendly**.
- Enable fullscreen.
- Keep the default click-to-play embed.

**Controls field:** Use the Controls section above.

**Tags:** `arcade`, `brick-breaker`, `roguelite`, `pixel-art`, `html5`,
`mobile`, `singleplayer`, `short`

**Made with:** Phaser

**Notes for the submitter:**
- Upload the final HTML5 ZIP produced by the build/release pipeline.
- Do not promise ads, achievements, leaderboards or cloud saves.
- The game is free; itch.io HTML5 pages support donations only, not paid sales.

## GameFlare

**Title:** Bricklike

**Short description:** Use the short description above.

**Long description:** Use the long description above.

**Category / genre:** Arcade

**Controls:** Use the Controls section above.

**Tags:** `arcade`, `block breaker`, `roguelite`, `pixel art`, `html5`,
`mobile`, `single player`, `bosses`, `endless`

**Notes for the submitter:**
- GameFlare does not require its optional SDK for this build.
- There are no ads inside the game on GameFlare.
- Upload the same HTML5 ZIP used for itch.io, or use the portal link flow.
- Do not describe GameFlare network ads as part of the game.

## Playgama

**Title:** Bricklike

**Short description:** Use the short description above.

**Long description:** Use the long description above.

**Genre / category:** Arcade

**Orientation:** Portrait

**Controls:** Use the Controls section above.

**Tags:** `arcade`, `block breaker`, `roguelite`, `pixel art`, `html5`,
`portrait`, `mobile`, `bosses`, `endless`

**Notes for the submitter:**
- Upload the ZIP that contains the Playgama Bridge config and the local
  `playgama-bridge.js` at the root.
- `game_ready` is sent once after the menu becomes interactive.
- **Ads:** the tutorial has no ads. Campaign wave interstitials only run when a
  next wave exists and the cleared wave is a multiple of 3 (in practice, level 5
  after wave 3 and level 6 after wave 3); never at the end of a level. Endless
  runs an interstitial every 4 waves. Leaving Results (Next/Retry/Menu) may show
  one if no interstitial ran in the last 60 seconds; a pause-menu exit is also
  suppressed after a rewarded revive in the last 60 seconds. A rewarded revive is
  offered once per run and only pays out on the `rewarded` state. Second Chance
  and the rewarded revive may coexist by design (two revives per run, one each).
- Storage and audio lifecycle go through the Bridge; no analytics are enabled.
- Review the final Bridge behavior in the Playgama environment before submitting.
- The sandbox requires milestones; track session length, wave completion and
  retention before promoting to the public catalog.

## CrazyGames — Basic Launch

**Title:** Bricklike

**Short description:** Use the short description above.

**Long description:** Use the long description above (≥ 100 words).

**Genre:** Arcade

**Controls:** Use the Controls section above.

**Tags:** `arcade`, `block breaker`, `roguelite`, `pixel art`, `html5`,
`mobile`, `single player`, `portrait`, `bosses`, `endless`

**Submission type:** Basic Launch only. Do **not** submit as Full Launch.

**Notes for the submitter:**
- Basic Launch uses the same HTML5 ZIP; ads are disabled on the CrazyGames side.
  The build detects the CrazyGames host and uses the native SDK adapter, without
  loading the Playgama runtime. The build must not wait for an ad that will not
  arrive; every ad path treats `failed`/`skipped` as success.
- **Ads policy:** the tutorial has no ads; campaign interstitials only when a
  next wave exists and the cleared wave is a multiple of 3; never at the end of a
  level; Endless every 4 waves; Results exits respect a 60-second cooldown. A
  pause-menu exit is suppressed after a rewarded revive in the last 60 seconds.
  The rewarded revive is once per run.
- Upload all three covers and the preview video.
- English metadata is mandatory.
- **Re-test the iframe sizes 907×510, 1216×684, 1280×720 and 1920×1080** before
  resubmitting; the portrait frame must remain readable. The portrait shell is
  intentional; landscape desktop viewports get procedural side art, not a
  letterbox shell.
- The 0.4.0 submission was rejected again with the same generic message. The
  0.5.1 was submitted on 2026-11-11 and is under review.
- **Screenshots, covers and the preview video were regenerated from the 0.5.1
  build** (tutorial, level 1 with two waves, touch controls). They still need
  human review before submitting; do not claim they are published.
- Full Launch requirements (Data/User modules, direct-to-gameplay landing,
  account-linked progress) are **out of scope** for this milestone.
- Re-check CrazyGames' current Basic Launch rules on the submission date.

## Copy rules

- Keep the name **Bricklike** exactly the same on every portal.
- Do not mention features that do not exist in the build.
- Do not claim rankings, achievements, multiplayer, cloud sync, controller
  support, additional worlds or a level editor.
- Do not use the technical name `blockbreaker` as player-facing marketing copy.
- Keep the description, screenshots and covers in sync with the current build.
- The store covers, screenshots and videos were regenerated from the **0.5.1**
  build and are pending human review. Review them against the final build before
  submitting.
- Do not promise ads on itch.io or GameFlare: those portals do not serve the
  in-game interstitials used on Playgama/CrazyGames.
- Do not claim CrazyGames approved the 0.5.1; it is under review. The 0.5.1 is
  live on itch.io and in the
  Playgama sandbox.
