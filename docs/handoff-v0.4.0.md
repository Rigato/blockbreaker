# Handoff — Bricklike v0.4.0

> **Arquivo histórico.** A fonte atual é
> [`handoff-v0.5.0.md`](handoff-v0.5.0.md). Este documento descreve a 0.4.0,
> publicada no itch.io e no sandbox da Playgama; não use os números de testes,
> ads ou conteúdo daqui como estado atual.

**Fonte única de onboarding para a próxima sessão.**  
**Data:** 2026-11-10  
**Branch:** `main`  
**Versão do package:** `0.4.0`  
**Build publicado:** `0.4.0` no itch.io e no sandbox da Playgama (manual)  
**Review build:** <https://rigato.github.io/blockbreaker/>  
**Debug build:** <https://rigato.github.io/blockbreaker/?debug=1>  
**Repositório:** <https://github.com/Rigato/blockbreaker>  
**Pasta local:** `/mnt/SSD-Secundario/Nextcloud/5-GameProjects/4-Blockbreaker-roguelite`

> Este documento substitui os handoffs anteriores, arquivados em
> `docs/old/handoffs/`. O GDD (`docs/GDD_Bricklike.md`) continua sendo a fonte
> de design; o gap analysis (`docs/gdd-gap-analysis.md`) mostra o que falta.

---

## 1. Snapshot

| Item | Valor |
|---|---|
| Branch de desenvolvimento | `main` |
| Versão em desenvolvimento | `0.4.0` |
| Versão publicada | `0.4.0` (itch.io + Playgama sandbox) |
| Tag / GitHub Release | nenhuma para 0.2.x, 0.3.x ou 0.4.0 |
| Portais | itch.io publicado; Playgama em sandbox; CrazyGames reprovado; GameFlare com acesso bloqueado |
| Node | 22.12+ (CI usa Node 24) |
| Stack | Phaser 3.90, TypeScript 7, Vite 8, Vitest 5, Playwright 1.65, Playgama Bridge 2.4.1 |
| ZIP local | `release/blockbreaker-web.zip` — 0.4.0, 20 arquivos, ~1.479 KiB |
| SHA-256 do ZIP 0.4.0 | `af3e55e847cacf7e8828ad7b0de8eb65e87b0c1a07613ebf93dc50bdb299f793` |

O GitHub Pages acompanha a `main`; todo push roda CI e deploy. O ZIP do itch.io
não é alterado por pushes.

---

## 2. O que existe

### Campanha

- **6 fases, 21 ondas**: Crystal Grove, Ruined Halls, Arcane Depths,
  Frostbound Spire, Emberforge e Void Threshold.
- Ondas por fase: **3 / 3 / 3 / 3 / 4 / 5**.
- Conteúdo validado: **759 blocos**, **1.831 XP**.
- **9 tipos de bloco**, **7 elementos de fase**, **3 chefes** e **19 perks**.
- Chefes: Frost Sentinel, Ember Warden e Void Herald, com shards e corrosão no
  paddle.
- **Desafios por onda**: `timeLimit` e `noLaser`.
- **Zoom de layout** 0,68–1,0; não altera input.
- **Encerramentos**: epílogo por fase, rank S/A/B e final de campanha.

### Endless

- Run infinita; termina quando todas as bolas caem.
- Velocidade **660 + 14/onda**, teto **1100**; linhas **4→12**.
- Blocos e elementos entram gradualmente; chefe a cada **5 ondas**.
- Save próprio: `endless: { bestWave, bestScore, runs }`.
- **Desbloqueado somente após concluir a campanha** (fase 6), com diálogo
  explicativo quando bloqueado.
- Não desbloqueia fases da campanha.

### Apresentação e UX (v0.4.0)

- **Blocos** redesenhados como “arcade tiles”: materiais distintos, bisel,
  sombra, rim light, variação determinística, HP pips e cracks.
- **Menu** Campaign/Endless, fundo animado de bolinhas, progresso, Settings,
  How to Play e About Us no rodapé. Removidos textos de MVP.
- **Seleção de fases** em tela cheia, com ícones, accents, taglines, features,
  chefes, dificuldade e melhores resultados.
- **HUD compacto** abaixo de 440 px: ícones, valores 11–13 px e uma linha de
  wave; legível em 907×510/800×450.
- **How to Play**: 5 páginas com screenshots localizados 5:3.
- **About Us**: logomarca Bad Decision Games + texto do estúdio.
- **Settings**: Sound, Music e Screen shake no menu e no pause, persistidos.
- **Ads**:
  - interstitial após cada **3ª onda** da campanha (por fase, inclusive fim de
    fase);
  - interstitial após cada **4ª onda** do Endless;
  - interstitial ao sair dos results por **Next/Retry/Menu**;
  - **rewarded revive** uma vez por run ao ser derrotado, com caminho sem ad;
  - recompensa só no estado `rewarded`; falha/recusa encerra a run.
- **Relógio da run** não conta pause, escolha de perk, ads, revive offer ou
  results.

### Save e plataforma

- Save versionado `bb.save` (v1), settings `bb.settings`.
- `unlockedPhase` 1..6 e `campaignComplete`; run ativa não é salva.
- Settings v1: `sound`, `music`, `screenShake`.
- Saves antigos continuam válidos; campos ausentes caem em defaults.
- Playgama Bridge 2.4.1 com fallback local, timeout de 10 s, storage com fallback
  em memória, pause/áudio e interstitials/rewarded.
- Sem `localStorage` direto no jogo, sem analytics externo, sem banners.

---

## 3. O que está fora de escopo

- Metaprogressão permanente e desbloqueios entre runs.
- Leaderboards, conquistas, tarefas diárias e ranking global.
- Outros usos de rewarded ads além do revive.
- Localização (UI e metadata em inglês).
- Landscape jogável; mobile landscape apenas pausa e pede portrait.
- Moldura/letterbox desktop dedicada (recomendada, não implementada).
- Editor de fases ou pipeline procedural fora do Endless.
- Backend, contas e cloud save.
- Full Launch do CrazyGames e novos portais (Poki, GameDistribution, Famobi).

---

## 4. Arquitetura

### 4.1 Módulos

| Área | Arquivos | Responsabilidade |
|---|---|---|
| Boot | `src/main.ts`, `src/boot/**` | query flags, Bridge, fallback, UI |
| Orquestração | `src/game/Game.ts`, `contracts.ts`, `config.ts`, `events.ts`, `adSchedule.ts` | menu/run, campanha × Endless, ads, save, HUD |
| Simulação | `src/sim/**` | `World` fixed-step 120 Hz, colisão, blocos, elementos, chefes |
| Layout | `src/sim/layout.ts` | `computeFieldScale` |
| Conteúdo | `src/content/**` | fases, ondas, Endless, blocos, perks, endings, validador |
| Progressão | `src/progression/**` | XP, perks, modificadores, save e estatísticas |
| Render | `src/render/**` | Phaser scene, temas, blocos, elementos, chefes, partículas |
| UI DOM | `src/ui/**` | menu, HUD, level-up, pause, results, phase select, dialogs, debug |
| Estilos | `src/styles/**` | phase select, HUD compacto, menu footer, HowTo/About, revive |
| Input | `src/input/Input.ts` | toque, mouse, teclado e foco |
| Áudio | `src/audio/**` | WebAudio sintetizado, lifecycle, mutes |
| Plataforma | `src/platform/**` | Bridge/fallback, storage, ads e save reset |
| i18n | `src/i18n/**` | strings em inglês |
| Testes | `tests/**`, `tests/e2e/**` | Vitest e Playwright |
| Scripts | `scripts/**` | conteúdo, Bridge, package e QA |
| Assets de loja | `store/**` | capas, screenshots, vídeos |
| Assets do jogo | `public/**` | HowTo, logo do estúdio, licenças, Bridge config |

### 4.2 Fluxo

```text
main.ts
  → bridgeBoot (PlatformService + fallback)
  → BlockBreakerGame (campanha/Endless, save, ads, HUD)
      → World (simulação fixed-step)
      → GameScene (render Phaser)
      → UIRoot / Hud / Menu / Overlay / PhaseSelect / dialogs
      → RunState (XP, perks, modificadores)
      → SaveRepository (bb.save / bb.settings via StorageService)
      → PlatformService (storage, lifecycle, interstitial, rewarded)
```

A UI fala com o jogo por `GameCommands`; o jogo emite snapshots em
`gameEvents` (`hud:changed`, `levelup:offered`, `ad:state`, `save:reset`).

### 4.3 Fluxos importantes

- **Campanha:** `startPhase` → `loadPhaseWave` → `World.reset`; ao limpar a onda,
  `finishWave` agenda a próxima, mostra interstitial a cada 3ª onda e, no fim da
  fase, vai a results.
- **Endless:** `startEndless` → `loadEndlessWave(1)`; `nextWave` gera a próxima;
  interstitial a cada 4ª onda; derrota grava bestWave/bestScore/runs.
- **Results:** campanha pode ter Next; Endless e fase 6 não têm Next.
- **Ads:** interstitials em pausas naturais; rewarded revive só no `revive-offer`;
  `AdOverlay` bloqueia a UI e muta o áudio.
- **Revive:** derrota → Second Chance (se houver) → oferta rewarded (1x/run) →
  retomada ou results.

---

## 5. Invariantes

1. **Plataforma:** nenhum `if (platform === ...)` no gameplay; tudo via
   `PlatformService`.
2. **Storage:** nenhum `localStorage` direto; sempre via `StorageService`.
3. **Simulação:** passo fixo de 120 Hz; colisão circular/AABB com swept
   collision e micro-passos para segmentos.
4. **Laser:** Prism Laser só dispara com pelo menos uma bola solta (`!stuck`);
   `noLaser` bloqueia a onda inteira.
5. **Multiball:** slots rearmados por onda; primeira bola manual e extras em
   sequência, teto de 8 bolas.
6. **Contadores de explosão:** `Explosive Core` (8) e `Bomb Ball` (12) usam
   contadores próprios, resetados ao adquirir o perk.
7. **Save:** schema v1; `MAX_PHASE = 6`; `campaignComplete` e `endless` são
   extensões compatíveis.
8. **Conteúdo:** toda onda da campanha passa pelo validador; Endless tem
   gerador determinístico e testes próprios.
9. **Ads:** interstitial a cada 3 ondas (campanha), 4 (Endless) e na saída dos
   results; rewarded revive 1x/run; recompensa só em `rewarded`; `failed` e
   `skipped` são caminho normal.
10. **Debug:** `?debug=1` é só QA; nunca divulgar URL com debug. O handle
    `window.__bricklike` só existe em debug.
11. **Nome:** jogo e loja **Bricklike**; slug técnico `blockbreaker`.
12. **Relógio:** `phaseElapsedMs` só avança com `phase === 'playing'`.

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
| `npm test` | ✅ **280 testes** em 27 arquivos |
| `npm run validate:content` | ✅ 6 fases, 21 ondas, 759 blocos, 1.831 XP |
| Bridge config | ✅ schema 2.4.1, sem URLs externas/ads indevidos |
| `npm run build` | ✅ bundle Phaser/Vite |
| `npm run package` | ✅ ZIP 0.4.0, 20 arquivos, ~1.479 KiB |
| `npm run test:e2e` | ✅ **24 testes** (8 spec files) |
| CI + Deploy | ✅ verdes no commit de referência |

Cobertura E2E: boot/menu, controles, pause, settings, How to Play/About,
level-up, vitória/unlock, Endless bloqueado/desbloqueado, AdMock
`show`/`fail`, rewarded revive/recusa, ad na saída dos results, relógio pausado,
CDN bloqueado, layout 320/390/430/1440 + landscape, chefe/desafio e Multiball.

`npm run qa:runs` continua sendo um baseline automatizado da **fase 1** com
projéteis de debug; não é playtest humano nem cobre 4–6/Endless.

---

## 7. Riscos e pendências

| Área | Estado | Risco / ação |
|---|---|---|
| Balance 4–6 | validado estruturalmente | falta playtest humano de timers, HP e densidade |
| Balance Endless | gerador/testes verdes | ondas 15–30+ e chefes precisam de playtest |
| Ads reais | implementado e mockado | falta medir fill/limites na Playgama/CrazyGames; 60 s mínimo do Bridge |
| Revive rewarded | implementado/testado | validar UX e frequência em portal real |
| Desktop 1366×768+ | HUD legível | falta moldura/letterbox dedicada; shell ainda é 9:16 centralizado |
| Performance real | sem baseline novo | medir 4 GB RAM/Chromebook e bosses/partículas |
| Save real | v1 compatível | testar save antigo no navegador antes de upload |
| GameFlare | acesso bloqueado | sem resposta do suporte; não criar conta duplicada |
| Playgama | sandbox 0.4.0 | cumprir milestones de retenção/qualidade |
| CrazyGames | 0.3.0 reprovada | reenviar a 0.4.0 como **nova submissão**; se bloquear, abrir suporte |
| Screenshots/vídeos | atualizados | conferir se o portal aceita os assets atuais |
| P0/P1 | nenhum conhecido | reportar imediatamente se aparecer em playtest |

---

## 8. Publicação

| Portal | Versão | Status | Observação |
|---|---|---|---|
| itch.io | **0.4.0** | **publicado** | atualização manual; `0.1.0-mvp` histórica |
| Playgama | **0.4.0** | **sandbox** | milestones pendentes antes da publicação |
| CrazyGames Basic | 0.3.0 e 0.4.0 rejeitadas / 0.5.0 local | **não submetida** | a 0.4.0 foi reenviada e recusada de novo com a mesma mensagem genérica; 0.5.0 é a próxima tentativa |
| GameFlare | 0.4.0 (não publicada) | **bloqueado** | sem resposta do suporte sobre login |

Assets prontos:

- Capas: `store/covers/cover-landscape-1920x1080.png`,
  `cover-portrait-800x1200.png`, `cover-portrait-1080x1920.png` (Playgama) e
  `cover-square-800x800.png`.
- Screenshots: 8 imagens em `store/screenshots/`.
- Vídeos: `store/video/bricklike-preview.mp4` (1920×1080, 18,1 s) e
  `store/video/bricklike-preview-portrait.mp4` (1080×1620, 18,1 s).
- Metadata: `docs/release/portal-metadata.md`.
- Checklist: `docs/release/submission-checklist.md`.
- Status: `docs/release/status.md`.
- Diagnóstico CrazyGames: `docs/release/crazygames-review.md`.

O upload e a tag são **manuais**. O ZIP 0.4.0 local tem SHA-256
`af3e55e847cacf7e8828ad7b0de8eb65e87b0c1a07613ebf93dc50bdb299f793`;
confirme o hash antes de cada upload.

---

## 9. Próximos passos para a nova sessão

1. **Playtest humano** das fases 4–6 e do Endless (ondas 5, 10, 15, 20+).
2. Ajustar timers (`p4w2`, `p5w3`, `p6w2`), HP dos chefes, densidade e
   velocidade do Endless com dados reais.
3. Avaliar **moldura/letterbox desktop** e legibilidade em 1366×768/1920×1080.
4. Medir **ads reais** na Playgama/CrazyGames (fill, skip, revive) e ajustar
   cadência se necessário.
5. Atualizar screenshots/vídeos se o visual mudar novamente.
6. Resolver GameFlare com o suporte; acompanhar milestones da Playgama.
7. Reenviar à CrazyGames como **nova submissão** (jogo rejeitado não usa o fluxo
   de update); se o portal bloquear, abrir suporte.
8. Decidir o próximo ciclo: metaprogressão/conquistas, mais conteúdo, ou
   localização/landscape.
9. Só depois de aprovação humana criar tag `v0.4.0` e GitHub Release.

---

## 10. Referências

### Essenciais (em uso)

- `docs/GDD_Bricklike.md` — fonte de design v1.4.
- `docs/gdd-gap-analysis.md` — implementado × pendente.
- `docs/spec-tecnica-publicacao.md` — requisitos dos portais.
- `docs/plano-baixa-fricao.md` — estratégia de distribuição.
- `docs/build-release.md` — build, ZIP, CI e runbook de release.
- `docs/release/portal-metadata.md` — textos em inglês.
- `docs/release/submission-checklist.md` — checklist manual.
- `docs/release/status.md` — status/URLs de publicação.
- `docs/release/crazygames-review.md` — diagnóstico e P0.
- `docs/release/README.md` — índice do pacote.
- `docs/qa/playtest-kit.md` — protocolo de playtest.
- `docs/qa/run-log-template.csv` — planilha de runs.

### Arquivo histórico

- `docs/old/handoffs/` — handoffs anteriores.
- `docs/old/plans/` — planos MVP, v0.2.0, Endless e revisão visual v0.4.0.
- `docs/old/qa/` — relatórios M6, device matrix, performance e run-log.
- `docs/old/release/` — G7 e validação técnica do MVP.

### Código

- `src/game/Game.ts` — fluxo de jogo, ads e revive.
- `src/game/adSchedule.ts` — cadência de interstitials.
- `src/game/contracts.ts` — contratos de UI, save, ads e plataforma.
- `src/sim/World.ts` — simulação, blocos, elementos, chefes e laser.
- `src/content/endless.ts` — gerador Endless.
- `src/content/phases.ts` — campanha e validador.
- `src/progression/Save.ts` — save v1, settings e estatísticas.
- `src/platform/**` — Bridge/fallback, storage, interstitial e rewarded.
