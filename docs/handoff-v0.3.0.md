# Handoff atual — Bricklike v0.3.0

**Fonte única de onboarding para a próxima fase.**  
**Data:** 2026-11-10  
**Branch:** `main`  
**Commit base:** `f8a6c75` (este handoff entra em um commit posterior)  
**Versão do package:** `0.3.0`  
**Build publicado:** `0.1.0-mvp` no itch.io (congelado)  
**Repositório:** <https://github.com/Rigato/blockbreaker>  
**Pasta local:** `/mnt/SSD-Secundario/Nextcloud/5-GameProjects/4-Blockbreaker-roguelite`  
**Review build:** <https://rigato.github.io/blockbreaker/>  
**Debug build:** <https://rigato.github.io/blockbreaker/?debug=1>

> Este documento substitui `docs/handoff-proxima-fase.md` como onboarding.
> O handoff antigo continua no repositório como histórico do pós-MVP.
> O GDD (`docs/GDD_Bricklike.md`) permanece a fonte de design; não repita o GDD
> inteiro aqui.

---

## 1. Snapshot

| Item | Valor |
|---|---|
| Branch de desenvolvimento | `main` |
| Commit de referência | `f8a6c75` |
| Versão em desenvolvimento | `0.3.0` |
| Versão publicada | `0.1.0-mvp` (itch.io, congelada) |
| Tag / GitHub Release | nenhuma para 0.2.0 ou 0.3.0 |
| Portais | itch.io publicado; GameFlare, Playgama e CrazyGames Basic pendentes |
| Node | 22.12+ (CI usa Node 24) |
| Stack | Phaser 3.90, TypeScript 7, Vite 8, Vitest 5, Playwright 1.65, Playgama Bridge 2.4.1 |
| ZIP local | `release/blockbreaker-web.zip` — 0.3.0, 13 arquivos, ~522,8 KiB |
| SHA-256 do ZIP 0.3.0 | `05f6bf911e0f27c35a689c5f727dd8547f87054b178d5aecf08169d43cf9cfd1` |

O GitHub Pages acompanha a `main`; todo push roda CI e deploy. O ZIP do itch.io
não é alterado por pushes.

---

## 2. O que existe

### Campanha

- **6 fases, 21 ondas**: Crystal Grove, Ruined Halls, Arcane Depths,
  Frostbound Spire, Emberforge e Void Threshold.
- Ondas por fase: **3 / 3 / 3 / 3 / 4 / 5**.
- Conteúdo validado: **759 blocos**, **1.831 XP**.
- **9 tipos de bloco**: crystal, stone, obsidian, explosive, regenerative,
  moving, multiplier, generator e linked.
- **7 elementos de fase**: wall, obstacle, deflector, portal, mover, rotor e gate.
- **3 chefes**: Frost Sentinel, Ember Warden e Void Herald, nas últimas ondas das
  fases 4–6; shards aplicam corrosão no paddle.
- **Desafios por onda**: `timeLimit` e `noLaser`.
- **Zoom de layout**: escala 0,68–1,0 para formações altas; não altera o input.
- **19 perks**, incluindo Prism Laser, Multiball, Second Chance, Bomb Ball,
  Critical Strike, Combo Master e Boss Bane.
- **Encerramentos**: epílogo por fase, rank S/A/B e final de campanha na fase 6.

### Endless

- Botão **Endless** no menu, separado de Campaign e Settings; bloqueado até a
  campanha ser concluída.
- Fase infinita, sem vitória; termina quando todas as bolas caem.
- Velocidade **660 + 14/onda**, teto **1100** (passa de 780 na onda 10).
- Linhas **4 → 12**; densidade e variedade crescem por onda.
- Blocos especiais entram gradualmente; elementos entram a partir da onda 2.
- Chefe a cada **5 ondas** (sentinel/warden/void alternando), HP `40 + wave×6`.
- Save próprio: `endless: { bestWave, bestScore, runs }`.
- Results mostram Wave, Best wave, score, level e perks; sem botão Next.
- Endless **não desbloqueia fases** da campanha.

### Save e plataforma

- Save versionado `bb.save` (v1), settings `bb.settings` (sound, music,
  screenShake).
- `unlockedPhase` 1..6 e `campaignComplete`; run ativa não é salva.
- Saves antigos continuam válidos; `endless` ausente cai em zeros.
- Playgama Bridge 2.4.1 com fallback local, timeout de 10 s, storage com fallback
  em memória, pause/áudio e interstitial apenas na saída dos results.
- Sem `localStorage` direto no jogo, sem analytics externo, sem banners ou
  rewarded ads.

---

## 3. O que está fora de escopo

- Metaprogressão e desbloqueios permanentes entre runs.
- Rewarded ads, banners e monetização além do interstitial.
- Leaderboards, conquistas, tarefas diárias e ranking global.
- Localização (UI e metadata em inglês).
- Landscape jogável; mobile landscape apenas pausa e pede portrait.
- Full Launch do CrazyGames, Poki, GameDistribution ou Famobi.
- Backend, contas, cloud save e sitelock próprio.
- Editor de fases ou pipeline procedural fora do Endless.

---

## 4. Arquitetura

### 4.1 Módulos

| Área | Arquivos | Responsabilidade |
|---|---|---|
| Boot | `src/main.ts`, `src/boot/**` | leitura de query flags, Bridge, fallback, montagem da UI |
| Orquestração | `src/game/Game.ts`, `contracts.ts`, `config.ts`, `events.ts` | fluxo de menu/run, campanha × Endless, ads, save, HUD |
| Simulação | `src/sim/**` | `World` fixed-step 120 Hz, colisão, blocos, elementos, chefes, RNG |
| Layout | `src/sim/layout.ts` | `computeFieldScale` para o zoom de layout |
| Conteúdo | `src/content/**` | fases, ondas, Endless, blocos, perks, endings e validador |
| Progressão | `src/progression/**` | XP, perks, modificadores, save e estatísticas |
| Render | `src/render/**` | Phaser scene, temas, blocos, elementos, chefes, partículas |
| UI DOM | `src/ui/**` | menu, HUD, level-up, pause, results, level select, debug, ads |
| Input | `src/input/Input.ts` | toque, mouse, teclado e foco |
| Áudio | `src/audio/**` | WebAudio sintetizado, lifecycle e mutes |
| Plataforma | `src/platform/**` | Bridge/fallback, storage, ads, save reset |
| i18n | `src/i18n/en.ts` | todas as strings de UI |
| Testes | `tests/**`, `tests/e2e/**` | unitários Vitest e Playwright |
| Scripts | `scripts/**` | validação de conteúdo, Bridge, package e QA runs |
| Assets de loja | `store/**` | capas, screenshots, vídeos e metadata |

### 4.2 Fluxo

```text
main.ts
  → bridgeBoot (PlatformService + fallback)
  → BlockBreakerGame (campanha/Endless, save, ads, HUD)
      → World (simulação fixed-step)
      → GameScene (render Phaser)
      → UIRoot / Hud / Menu / Overlay / PhaseSelect
      → RunState (XP, perks, modificadores)
      → SaveRepository (bb.save / bb.settings via StorageService)
      → PlatformService (storage, lifecycle, interstitial)
```

A UI fala com o jogo por `GameCommands`; o jogo emite snapshots em
`gameEvents` (`hud:changed`, `levelup:offered`, `ad:state`, `save:reset`).

### 4.3 Fluxos importantes

- **Campanha:** `startPhase` → `loadPhaseWave` → `World.reset`; ao limpar a onda,
  `finishWave` agenda a próxima; ao limpar a fase, `finishPhase` grava stats.
- **Endless:** `startEndless` → `loadEndlessWave(1)`; `nextWave` gera a próxima
  onda; na derrota, `finishEndless` grava bestWave/bestScore/runs.
- **Results:** campanha pode ter Next; Endless e fase 6 não têm Next.
- **Interstitial:** somente ao sair dos results (Next/Retry/Menu), com mute,
  overlay bloqueante e continuidade em `failed`/`skipped`/timeout.

---

## 5. Invariantes

Estas regras não devem ser quebradas sem uma decisão explícita:

1. **Plataforma:** nenhum `if (platform === ...)` no gameplay; tudo via
   `PlatformService`.
2. **Storage:** nenhum `localStorage` direto; sempre via `StorageService`.
3. **Simulação:** passo fixo de 120 Hz; colisão circular/AABB com swept collision
   e micro-passos para segmentos.
4. **Laser:** Prism Laser só dispara com **pelo menos uma bola solta**
   (`!ball.stuck`). Bola inicial e Sticky presa bloqueiam; `noLaser` bloqueia a
   onda inteira. O HUD mostra o motivo.
5. **Multiball:** o número de bolas extras é rearmado **no início de cada onda**;
   a primeira bola é lançada pelo jogador e as extras saem automaticamente em
   sequência (uma a cada ~220 ms), respeitando o teto de 8 bolas.
6. **Contadores de explosão:** `Explosive Core` (8 blocos) e `Bomb Ball` (12)
   usam contadores próprios, resetados ao adquirir o perk. Kills anteriores não
   contam.
7. **Save:** schema v1; `MAX_PHASE = 6`; `endless` é uma extensão compatível.
   Saves antigos nunca lançam; defaults seguros.
8. **Conteúdo:** toda onda da campanha passa pelo validador; o Endless tem
   gerador determinístico e testes próprios.
9. **Ads:** somente interstitial na saída dos results; sem rewarded, banners ou
   frequência própria. `failed` e `skipped` são caminho normal.
10. **Debug:** `?debug=1` é apenas para QA. Nunca divulgar URL com debug nos
    portais. O handle `window.__bricklike` só existe em debug.
11. **Nome:** jogo e loja **Bricklike**; slug técnico `blockbreaker` em repo,
    package, URL e ZIP.

---

## 6. Gates e comandos

Executar a partir da raiz:

```bash
npm ci
npm run typecheck
npm test
npm run validate:content
node scripts/validate-bridge-config.mjs
npm run build
npm run package
npm run test:e2e
```

Resultados esperados na referência atual:

| Gate | Resultado |
|---|---|
| `npm run typecheck` | ✅ sem erros |
| `npm test` | ✅ **263 testes** em 26 arquivos |
| `npm run validate:content` | ✅ 6 fases, 21 ondas, 759 blocos, 1.831 XP |
| Bridge config | ✅ schema 2.4.1, sem URLs externas/ads indevidos |
| `npm run build` | ✅ bundle Phaser/Vite |
| `npm run package` | ✅ ZIP 0.3.0, 13 arquivos, ~522,8 KiB |
| `npm run test:e2e` | ✅ **20 testes** (5 spec files) |
| CI + Deploy | ✅ verdes no commit `f8a6c75` |

Cobertura E2E atual: boot/menu, controles, pause, settings, level-up, vitória/unlock,
Endless bloqueado/desbloqueado, AdMock `show`/`fail`, CDN bloqueado, layout
320/390/430/1440 + landscape mobile, runtime de chefe/desafio e Multiball entre
ondas.

`npm run qa:runs` continua sendo um baseline automatizado da **fase 1** com
projéteis de debug; não é playtest humano nem cobre balance das fases 4–6 ou do
Endless.

---

## 7. Riscos e pendências

| Área | Estado | Risco / ação |
|---|---|---|
| Balance da campanha 4–6 | validado estruturalmente | falta playtest humano de timers, HP de chefes e densidade |
| Balance do Endless | gerador e testes verdes | ondas altas (15–30+) e chefes precisam de playtest |
| QA de alto nível | `qa:runs` só fase 1 | criar baseline para 4–6 e Endless se necessário |
| Screenshots | capturas antigas do MVP | atualizar para mostrar 6 fases, chefes e Endless |
| Metadata de loja | textos majoritariamente do MVP | atualizar descrições/tags para 0.3.0 antes de submeter |
| Assets de portal | capas e vídeos novos | revisão humana antes de upload |
| Performance real | sem baseline novo | medir bosses/elementos/partículas em low-end |
| Save real | v1 compatível | testar save antigo no navegador antes do upload |
| Publicação | manual | nenhum agente submete portal; não criar tag/release sem decisão |
| P0/P1 | nenhum conhecido | reportar imediatamente se aparecer em playtest |

---

## 8. Publicação

| Portal | Status | Observação |
|---|---|---|
| itch.io | **publicado `0.1.0-mvp`** | ZIP congelado; não substituir por engano |
| GameFlare | conta com problema de acesso | suporte acionado; aguardando resposta |
| Playgama | **em sandbox** | milestones pendentes antes da publicação |
| CrazyGames Basic | **reprovado** | “below quality standards”; ver `docs/release/crazygames-review.md` |

Assets prontos:

- Capas: `store/covers/cover-landscape-1920x1080.png`,
  `cover-portrait-800x1200.png`, `cover-portrait-1080x1920.png` (Playgama) e
  `cover-square-800x800.png`.
- Vídeos: `store/video/bricklike-preview.mp4` (1920×1080, 18,3 s) e
  `store/video/bricklike-preview-portrait.mp4` (1080×1620, 18,3 s), sem áudio,
  abrindo com a capa.
- Metadata: `docs/release/portal-metadata.md`.
- Checklist: `docs/release/submission-checklist.md`.
- Status: `docs/release/status.md`.

O upload e a tag `v0.3.0` são **manuais** e dependem de aprovação humana. O ZIP
0.3.0 local tem SHA-256
`05f6bf911e0f27c35a689c5f727dd8547f87054b178d5aecf08169d43cf9cfd1`;
confirme o hash antes de cada upload.

---

## 9. Próximos passos

1. **Playtest humano** das fases 4–6 e do Endless (ondas 5, 10, 15, 20+).
2. Ajustar **timers** (`p4w2`, `p5w3`, `p6w2`), **HP dos chefes**, densidade e
   velocidade do Endless com base no playtest.
3. Atualizar **screenshots e metadata** para a 0.3.0, incluindo Endless e chefes.
4. Revalidar o ZIP 0.3.0 em subpasta, modo mock, CDN bloqueado e interstitial.
5. Submeter manualmente na Playgama, CrazyGames Basic e GameFlare; registrar URLs
   em `docs/release/status.md`.
6. Só depois de aprovação humana criar tag `v0.3.0` e GitHub Release.
7. Decidir a próxima fase (metaprogressão, conteúdo, plataforma) com dados reais.

---

## 10. Referências

### Produto e design

- `docs/GDD_Bricklike.md` — GDD vigente (v1.2, inclui Endless).
- `docs/plano-endless.md` — plano e decisões do modo Endless.
- `docs/plano-v0.2.0.md` — plano da campanha de 6 fases.
- `docs/plano-implementacao-mvp.md` — histórico M0–M7.
- `docs/plano-baixa-fricao.md` — estratégia de distribuição.

### Distribuição e assets

- `docs/spec-tecnica-publicacao.md` — requisitos dos portais.
- `docs/build-release.md` — build, ZIP e runbook de tag.
- `docs/release/README.md` — índice do pacote.
- `docs/release/portal-metadata.md` — textos em inglês.
- `docs/release/submission-checklist.md` — checklist manual.
- `docs/release/status.md` — status/URLs de publicação.
- `store/README.md` — índice de assets de loja.
- `store/covers/README.md` — capas e regeneração.
- `store/video/README.md` — vídeos landscape/portrait e regeneração.

### QA

- `docs/qa/m6-report.md` — relatório M6 e G6.
- `docs/qa/device-matrix.md` — matriz de devices.
- `docs/qa/performance.md` — tamanho e stress headless.
- `docs/qa/playtest-kit.md` — protocolo de playtest.
- `docs/qa/run-log.csv` — baseline automatizado da fase 1.

### Código

- `src/game/Game.ts` — fluxo de jogo campanha/Endless.
- `src/game/contracts.ts` — contratos de UI, save, plataforma e resultados.
- `src/sim/World.ts` — simulação, blocos, elementos, chefes e laser.
- `src/content/endless.ts` — gerador do modo Endless.
- `src/content/phases.ts` — conteúdo da campanha e validador.
- `src/progression/Save.ts` — save v1 e estatísticas do Endless.
- `src/platform/**` — Bridge/fallback, storage e ads.
