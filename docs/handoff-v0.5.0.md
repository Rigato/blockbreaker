# Handoff — Bricklike v0.5.0

**Fonte única de onboarding para a próxima sessão.**  
**Data:** 2026-11-11  
**Branch:** `main`  
**Versão do package:** `0.5.0`  
**Build:** main para teste manual; ainda não publicado em portal  
**Publicado em portal:** `0.4.0` no itch.io e no sandbox da Playgama  
**Review build:** <https://rigato.github.io/blockbreaker/> (reflete o último push;
a 0.5.0 só aparece depois do push)  
**Debug build:** <https://rigato.github.io/blockbreaker/?debug=1>  
**Repositório:** <https://github.com/Rigato/blockbreaker>  
**Pasta local:** `/mnt/SSD-Secundario/Nextcloud/5-GameProjects/4-Blockbreaker-roguelite`

> Este documento substitui o handoff da v0.4.0 como fonte atual. O handoff
> anterior fica como histórico em `docs/handoff-v0.4.0.md`. O GDD
> (`docs/GDD_Bricklike.md`, v1.5) continua sendo a fonte de design; o gap
> analysis (`docs/gdd-gap-analysis.md`) mostra o que falta.

---

## 1. Snapshot

| Item | Valor |
|---|---|
| Branch de desenvolvimento | `main` |
| Versão em desenvolvimento | `0.5.0` |
| Versão publicada | `0.4.0` (itch.io + Playgama sandbox) |
| Build 0.5.0 | em `main` para teste; sem upload, tag ou GitHub Release |
| Tag / GitHub Release | nenhuma para 0.2.x, 0.3.x, 0.4.0 ou 0.5.0 |
| Portais | itch.io 0.4.0; Playgama 0.4.0 em sandbox; CrazyGames 0.3.0 e 0.4.0 reprovadas; GameFlare bloqueado |
| Node | 22.12+ (CI usa Node 24) |
| Stack | Phaser 3.90, TypeScript estrito, Vite 8, Vitest, Playwright, Playgama Bridge 2.4.1 |
| ZIP local | `release/blockbreaker-web.zip` — 0.5.0, 20 arquivos, 1.517.039 bytes (~1.481 KiB) |
| SHA-256 atual do ZIP | `010bcfc3f9b09cbef5ff20c8d8e4c1fb8a56b0ad8c4ce460530819d7f879c32b` |

O hash pode mudar no build final; confirme em `release/manifest.json` antes de
qualquer upload. O GitHub Pages acompanha a `main`; enquanto a 0.5.0 não for
enviada, a revisão pública continua sendo o último build publicado.

---

## 2. O que existe

### Tutorial (novo na 0.5.0)

- **Fase 0 “Tutorial”**, id `tutorial`, exibida como card próprio antes das seis
  fases da campanha.
- **2 ondas**: `tutw1` **First Steps** e `tutw2` **Spark Practice**.
- **48 blocos**, **55 XP** e **3 level ups** no total.
- Em save novo, **level 1 fica bloqueado** atrás do tutorial: `unlockedPhase`
  agora vai de **0 a 6**, com **0 = tutorial**.
- Save antigo com `unlockedPhase >= 1` continua funcionando e não é forçado a
  repetir o tutorial. Saves antigos com clears registrados inferem o unlock.
- **“Skip tutorial”** conclui o tutorial imediatamente e libera o level 1.
- **Coach marks contextuais** durante a run: mover/lançar, XP/perk, blocos especiais, chefes e
  Endless. O resultado do tutorial ensina que chefes guardam as últimas ondas
  e que limpar as seis fases libera o Endless.
- **Sem ads no tutorial.**
- O tutorial não conta como fase da campanha para `campaignComplete`; o Endless
  continua exigindo a fase 6 concluída.

### Campanha

- **6 fases, 20 ondas**: Crystal Grove, Ruined Halls, Arcane Depths,
  Frostbound Spire, Emberforge e Void Threshold.
- Ondas por fase: **2 / 3 / 3 / 3 / 4 / 5** (a fase 1 foi encurtada para 2).
- Com o tutorial, o seletor mostra **7 cards / 22 ondas**.
- **9 tipos de bloco**, **7 elementos de fase**, **3 chefes** e **19 perks**.
- Totais validados com tutorial: **775 blocos**, **1.832 XP**.
- Campanha pura: **727 blocos**, **1.777 XP**.

| Fase | Ondas | Blocos | XP |
|---|---:|---:|---:|
| Tutorial | 2 | 48 | 55 |
| 1 — Crystal Grove | 2 | 54 | 76 |
| 2 — Ruined Halls | 3 | 90 | 212 |
| 3 — Arcane Depths | 3 | 94 | 262 |
| 4 — Frostbound Spire | 3 | 103 | 229 |
| 5 — Emberforge | 4 | 136 | 348 |
| 6 — Void Threshold | 5 | 250 | 650 |
| **Total** | **22** | **775** | **1.832** |

- Chefes: Frost Sentinel, Ember Warden e Void Herald, com shards e corrosão no
  paddle.
- **Desafios por onda**: `timeLimit` e `noLaser`.
- **Zoom de layout** 0,68–1,0; não altera input.
- **Encerramentos**: epílogo por fase, rank S/A/B, final de campanha e epílogo
  curto do tutorial.

### Endless

- Run infinita; termina quando todas as bolas caem.
- Velocidade **660 + 14/onda**, teto **1100**; linhas **4→12**.
- Blocos e elementos entram gradualmente; chefe a cada **5 ondas**.
- Save próprio: `endless: { bestWave, bestScore, runs }`.
- **Desbloqueado somente após concluir a campanha** (fase 6), com diálogo
  explicativo quando bloqueado.
- Não desbloqueia fases da campanha.

### Apresentação e UX

- Visual de blocos “arcade tile” e menu Campaign/Endless da 0.4.0 mantidos.
- **Seleção de fases** em tela cheia, agora com o card do tutorial e 7 cards.
- **HUD compacto** abaixo de 440 px, legível em 907×510/800×450.
- **How to Play** com 5 páginas e **About Us** com a logomarca Bad Decision
  Games.
- **Settings**: Sound, Music e Screen shake no menu e no pause, persistidos.
- **Rodapé do menu**: How to Play, Settings, About Us e a versão. Não é mais
  “só Settings e versão”.
- **Aviso de storage**: quando o diagnóstico da plataforma é memória/fallback,
  o menu mostra um aviso discreto **“Progress may not be saved”**. Clicar abre
  um popup explicando que progresso e settings podem ser perdidos ao fechar a
  página.

### Controles touch

- O drag relativo continua **1:1 no centro** do campo.
- Na **zona externa de 22%** de cada lado, o ganho cresce progressivamente até
  **2,2×**, para o paddle alcançar a borda antes do dedo e evitar o gesto de
  borda do navegador.
- O **limite de velocidade do paddle não mudou**; o edge assist amplia o
  deslocamento do alvo por toque, não a velocidade da simulação.
- Mouse continua **absoluto**; teclado continua igual.
- Edge assist vale para toque/pen, não para mouse.

### Laser

- O Prism Laser agora exige **lançamento explícito da bola na onda**. Não basta
  existir uma bola solta criada por debug ou multiball.
- Ao resetar/carregar a onda, o laser fica bloqueado até o jogador lançar.
- Depois do lançamento, continua exigindo pelo menos uma bola solta; Sticky
  Paddle pode bloquear de novo.
- O HUD mostra **“Launch the ball first”** quando o bloqueio é a falta de
  lançamento; `noLaser` mostra o motivo da regra.

### Ads (política da 0.5.0)

- **Campanha:** interstitial de onda somente quando **há próxima onda** e a onda
  limpa é **múltipla de 3**. Na prática: **fase 5 após a onda 3** e **fase 6
  após a onda 3**. Nunca no fim da fase.
- **Endless:** a cada **4 ondas**.
- **Tutorial:** nenhum ad.
- **Saída dos results (Next/Retry/Menu):** interstitial se não houve outro
  interstitial nos últimos **60 s**. Depois de um rewarded revive, o ad dos
  results ainda pode aparecer na segunda morte.
- **Saída pelo menu do pause:** também pode mostrar interstitial, mas é
  suprimido se houve **interstitial OU rewarded revive** nos últimos 60 s.
- **Rewarded revive:** continua **1× por run**, só recompensa no estado
  `rewarded`; recusa/falha segue sem ad.
- **Second Chance + rewarded revive coexistem de propósito**: são dois revives
  por run, um de cada mecânica (quando o perk está adquirido).

### Save e plataforma

- Save versionado `bb.save` (v1), settings `bb.settings`.
- `unlockedPhase` 0..6 (0 = tutorial), `campaignComplete` e estatísticas por
  fase; a run ativa não é salva.
- Settings v1: `sound`, `music`, `screenShake`.
- Saves antigos continuam válidos; campos ausentes caem em defaults.
- Playgama Bridge 2.4.1 com fallback local, timeout de 10 s, storage com fallback
  em memória, pause/áudio e interstitials/rewarded.
- **Bridge local no boot:** o Vite usa `playgamaBridge({ mode: 'local' })` e o
  `index.html` carrega apenas `./playgama-bridge.js`. Não há request ao CDN
  `bridge.playgama.com` no boot. O adapter nativo do CrazyGames ainda carrega o
  SDK do próprio portal quando detecta o host.
- Sem `localStorage` direto no jogo, sem analytics externo, sem banners.

---

## 3. O que está fora de escopo

- Metaprogressão permanente e desbloqueios entre runs.
- Leaderboards, conquistas, tarefas diárias e ranking global.
- Outros usos de rewarded ads além do revive.
- Localização (UI e metadata em inglês).
- Landscape jogável; mobile landscape apenas pausa e pede portrait.
- **Moldura/letterbox desktop dedicada: decisão do dono é não fazer nesta
  linha.** O shell portrait centralizado é intencional; a legibilidade desktop
  continua apoiada no HUD compacto. O risco de apresentação em iframe desktop
  permanece e deve ser reavaliado com o feedback da CrazyGames.
- Editor de fases ou pipeline procedural fora do Endless.
- Backend, contas e cloud save.
- Full Launch do CrazyGames e novos portais (Poki, GameDistribution, Famobi).

---

## 4. Arquitetura

### 4.1 Módulos

| Área | Arquivos | Responsabilidade |
|---|---|---|
| Boot | `src/main.ts`, `src/boot/**` | query flags, Bridge local, fallback, UI |
| Orquestração | `src/game/Game.ts`, `contracts.ts`, `config.ts`, `events.ts`, `adSchedule.ts` | menu/run, tutorial, campanha × Endless, ads, save, HUD |
| Simulação | `src/sim/**` | `World` fixed-step 120 Hz, colisão, blocos, elementos, chefes e laser |
| Layout | `src/sim/layout.ts` | `computeFieldScale` |
| Conteúdo | `src/content/**` | tutorial, fases, ondas, Endless, blocos, perks, endings, validador |
| Progressão | `src/progression/**` | XP, perks, modificadores, save e estatísticas |
| Render | `src/render/**` | Phaser scene, temas, blocos, elementos, chefes, partículas |
| UI DOM | `src/ui/**` | menu, HUD/tutorial panel, level-up, pause, results, phase select, dialogs, debug |
| Estilos | `src/styles/**` | phase select, HUD compacto, menu footer, HowTo/About, tutorial, revive |
| Input | `src/input/Input.ts`, `src/input/touchAssist.ts` | toque, mouse, teclado, foco e edge assist |
| Áudio | `src/audio/**` | WebAudio sintetizado, lifecycle, mutes |
| Plataforma | `src/platform/**` | Bridge/fallback, storage, ads e save reset |
| i18n | `src/i18n/**` | strings em inglês |
| Testes | `tests/**`, `tests/e2e/**` | Vitest e Playwright |
| Scripts | `scripts/**` | conteúdo, Bridge, package, QA e perf smoke |
| Assets de loja | `store/**` | capas, screenshots, vídeos |
| Assets do jogo | `public/**` | HowTo, logo do estúdio, licenças, Bridge config |

### 4.2 Fluxo

```text
main.ts
  → bridgeBoot (PlatformService + fallback local)
  → BlockBreakerGame (tutorial/campanha/Endless, save, ads, HUD)
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

- **Tutorial:** `startPhase('tutorial')` → `tutorialStep = 'move'` →
  `tutw1`; o primeiro level up avança para `levelup`, a segunda onda para
  `specials`; `finishPhase(true)` grava clears e libera `unlockedPhase = 1`.
  `skipTutorial()` conclui a fase sem esperar as ondas.
- **Campanha:** `startPhase` → `loadPhaseWave` → `World.reset`; ao limpar a
  onda, `finishWave` agenda a próxima e decide o interstitial com
  `shouldShowWaveInterstitial`. No fim da fase, vai a results sem ad de onda.
- **Endless:** `startEndless` → `loadEndlessWave(1)`; `nextWave` gera a próxima;
  interstitial a cada 4ª onda; derrota grava bestWave/bestScore/runs.
- **Results:** campanha pode ter Next; Endless e fase 6 não têm Next; tutorial
  tem conclusão própria e leva ao level 1.
- **Ads:** wave interstitial em pausa natural; exit ad nos results/pause com
  cooldown de 60 s; rewarded revive só no `revive-offer`; `AdOverlay` bloqueia a
  UI e muta o áudio.
- **Revive:** derrota → Second Chance (se houver) → oferta rewarded (1×/run) →
  retomada ou results. Os dois revives coexistem por design.

---

## 5. Invariantes

1. **Plataforma:** nenhum `if (platform === ...)` no gameplay; tudo via
   `PlatformService`.
2. **Storage:** nenhum `localStorage` direto; sempre via `StorageService`.
3. **Simulação:** passo fixo de 120 Hz; colisão circular/AABB com swept
   collision e micro-passos para segmentos.
4. **Laser:** exige lançamento explícito na onda **e** pelo menos uma bola solta;
   bolas de debug/multiball não substituem o lançamento; `noLaser` bloqueia a
   onda inteira.
5. **Edge assist:** toque/pen apenas; 1:1 no centro, ganho progressivo até 2,2×
   na zona externa de 22%; mouse absoluto; limite de velocidade do paddle
   inalterado.
6. **Multiball:** slots rearmados por onda; primeira bola manual e extras em
   sequência, teto de 8 bolas.
7. **Contadores de explosão:** `Explosive Core` (8) e `Bomb Ball` (12) usam
   contadores próprios, resetados ao adquirir o perk.
8. **Save:** schema v1; `unlockedPhase` 0..6; `campaignComplete`, `endless` e
   estatísticas do tutorial são extensões compatíveis.
9. **Conteúdo:** toda onda da campanha e do tutorial passa pelo validador;
   Endless tem gerador determinístico e testes próprios.
10. **Ads:** tutorial sem ads; campanha só em onda múltipla de 3 com próxima
    onda; Endless a cada 4; exits com cooldown de 60 s; rewarded revive 1×/run;
    recompensa só em `rewarded`; `failed`/`skipped` são caminho normal.
11. **Debug:** `?debug=1` é só QA; nunca divulgar URL com debug. O handle
    `window.__bricklike` só existe em debug.
12. **Nome:** jogo e loja **Bricklike**; slug técnico `blockbreaker`.
13. **Relógio:** `phaseElapsedMs` só avança com `phase === 'playing'`.

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

Resultados de referência da 0.5.0:

| Gate | Resultado |
|---|---|
| `npm run typecheck` | ✅ sem erros |
| `npm test` | ✅ **289 testes** em **28 arquivos** |
| `npm run validate:content` | ✅ **7 níveis, 22 ondas, 775 blocos, 1.832 XP** |
| Bridge config | ✅ schema 2.4.1, sem logo/analytics, sem URLs externas |
| `npm run build` | ✅ bundle Phaser/Vite |
| `npm run package` | ✅ ZIP 0.5.0, **20 arquivos**, **1.517.039 bytes** (~1.481 KiB), SHA-256 atual `010bcfc3f9b09cbef5ff20c8d8e4c1fb8a56b0ad8c4ce460530819d7f879c32b` |
| `npm run test:e2e` | ✅ **29 testes** em **9 spec files** |
| CI + Deploy | pendente de push da 0.5.0 |

Cobertura E2E atual: boot/menu, controles, pause, settings, How to Play/About,
level-up, vitória/unlock, Endless bloqueado/desbloqueado, AdMock
`show`/`fail`, rewarded revive/recusa, ads de pause/results, relógio pausado,
CDN bloqueado, layout 320/390/430/1440 + landscape, chefe/desafio, Multiball,
tutorial (gate/skip/coach mark) e storage fallback.

`npm run qa:runs` continua sendo um baseline automatizado da **fase 1** com
projéteis de debug; não é playtest humano nem cobre 4–6/Endless.

---

## 7. Portais e publicação

| Portal | Versão | Status | Observação |
|---|---|---|---|
| itch.io | **0.4.0** | **publicado** | atualização manual; `0.1.0-mvp` histórica |
| Playgama | **0.4.0** | **sandbox** | milestones pendentes antes da publicação |
| CrazyGames Basic | 0.3.0 e 0.4.0 | **reprovadas** | 0.4.0 reenviada e recusada de novo com a mesma mensagem genérica; 0.5.0 é a próxima tentativa |
| GameFlare | 0.4.0 (não publicada) | **bloqueado** | sem resposta do suporte sobre login |

- **CrazyGames:** a 0.3.0 foi reprovada e a 0.4.0 foi reenviada, mas recebeu a
  mesma reprovação genérica, sem detalhamento. O dono decidiu **não fazer
  moldura/letterbox desktop**. A próxima tentativa é a **0.5.0**, com tutorial
  in-game, controles mobile e política de ads; ainda depende de teste humano e
  de assets atualizados. Canais e rascunho de suporte:
  [`docs/research/crazygames-feedback.md`](research/crazygames-feedback.md).
- **Playgama sandbox (amostra pequena):** 17/100 qualifying plays; avg play time
  **5:42** contra meta **5:00**; ad shows/play **1,70** contra meta **0,30**;
  116 launches, 31 plays, 5m45s e 3/2 likes. A amostra é pequena demais para
  concluir qualidade ou retenção; use os números como sinal, não veredito.
- **GameFlare:** conta criada, acesso bloqueado; suporte acionado e sem
  resposta. Não criar conta duplicada sem orientação.
- **Assets de loja:** capas, screenshots e vídeos continuam sendo os da
  **0.4.0**. Precisam ser regerados a partir da 0.5.0 (tutorial, fase 1 com 2
  ondas, controles touch) **antes** de qualquer submissão da 0.5.0. Nada foi
  atualizado nesta rodada.
- O ZIP 0.5.0 é **local**. Nenhum upload, tag ou GitHub Release foi feito.

---

## 8. Riscos e pendências

| Área | Estado | Risco / ação |
|---|---|---|
| Teste humano da 0.5.0 | pendente | validar tutorial/skip, edge assist, gate do laser, save antigo e ads |
| CrazyGames | 0.4.0 reprovada de novo | motivo genérico; pedir detalhes pelo suporte e reenviar a 0.5.0 após o teste humano |
| Apresentação desktop | shell portrait intencional | sem moldura/letterbox por decisão; risco residual de legibilidade em iframe desktop |
| Balance 4–6 | validado estruturalmente | falta playtest humano de timers, HP e densidade |
| Balance Endless | gerador/testes verdes | ondas 15–30+ e chefes precisam de playtest |
| Ads reais | política nova implementada | falta medir fill/limites e a nova cadência na Playgama/CrazyGames |
| Revive rewarded | implementado/testado | validar UX e frequência em portal real |
| Performance real | documentação e script prontos | resultados pendentes; medir 4 GB/Chromebook e iframes |
| Boot / Bridge | local, sem CDN Playgama | sem request externo no boot; no CrazyGames o adapter nativo carrega o SDK do portal quando detecta o host |
| Store assets | 0.4.0 | regerar antes da submissão da 0.5.0 |
| Save real | v1 compatível; parse testado | testar save antigo no navegador antes do upload |
| Playgama | sandbox 0.4.0 | amostra pequena; acompanhar milestones após a 0.5.0 |
| GameFlare | acesso bloqueado | sem resposta do suporte; não criar conta duplicada |
| Tag/Release | nenhuma | só depois de aprovação humana |
| P0/P1 | nenhum conhecido nos gates | reportar imediatamente se aparecer em teste manual |

---

## 9. Próximos passos para a nova sessão

1. **Teste manual da 0.5.0** em build da `main`: tutorial completo, skip, os cinco
   coach marks, fase 1 com 2 ondas, edge assist no celular, laser bloqueado até
   o lançamento, ads mock (`show`/`fail`/`rewarded`), save antigo e aviso de
   storage em fallback.
2. **Medir performance** com [`docs/qa/performance-testing.md`](qa/performance-testing.md)
   e [`scripts/perf-smoke.mjs`](../scripts/perf-smoke.mjs). Não há resultado de
   performance da 0.5.0 ainda; a expectativa é que performance não seja a causa
   da reprovação, mas isso precisa ser medido.
3. **Regerar store assets** (screenshots do tutorial e da fase 1, capas/vídeos
   se o visual mudou) a partir da 0.5.0. Não reutilizar os assets da 0.4.0 na
   submissão.
4. **Push da `main`** e conferir CI/Pages; o GitHub Pages só passa a mostrar a
   0.5.0 depois do push.
5. **Publicar a 0.5.0** manualmente no itch.io e no sandbox da Playgama após o
   teste humano; conferir o hash do ZIP antes de cada upload.
6. **CrazyGames:** pedir detalhes pelo suporte usando o rascunho de
   `docs/research/crazygames-feedback.md`, depois reenviar a 0.5.0 como nova
   submissão, com assets e mensagem de mudanças.
7. **GameFlare:** follow-up único no suporte; não criar conta duplicada.
8. **Só depois de aprovação humana** criar a tag `v0.5.0` e o GitHub Release.
9. Decidir o próximo ciclo: retenção/metaprogressão, mais conteúdo, ou
   localização/landscape.

---

## 10. Referências

### Essenciais

- [`docs/GDD_Bricklike.md`](GDD_Bricklike.md) — fonte de design v1.5.
- [`docs/gdd-gap-analysis.md`](gdd-gap-analysis.md) — implementado × pendente.
- [`docs/spec-tecnica-publicacao.md`](spec-tecnica-publicacao.md) — guia único
  de publicação (absorveu o antigo plano de baixa fricção).
- [`docs/old/plans/plano-baixa-fricao.md`](old/plans/plano-baixa-fricao.md) —
  plano histórico arquivado.
- [`docs/build-release.md`](build-release.md) — build, ZIP, CI e runbook.
- [`docs/release/portal-metadata.md`](release/portal-metadata.md) — textos em
  inglês.
- [`docs/release/submission-checklist.md`](release/submission-checklist.md) —
  checklist manual.
- [`docs/release/status.md`](release/status.md) — status/URLs de publicação.
- [`docs/release/crazygames-review.md`](release/crazygames-review.md) —
  diagnóstico, segunda reprovação e plano.
- [`docs/research/crazygames-feedback.md`](research/crazygames-feedback.md) —
  canais, QA tool e rascunho de suporte.
- [`docs/qa/playtest-kit.md`](qa/playtest-kit.md) — protocolo de playtest.
- [`docs/qa/performance-testing.md`](qa/performance-testing.md) — protocolo de
  performance.
- [`scripts/perf-smoke.mjs`](../scripts/perf-smoke.mjs) — smoke de performance.

### Arquivo histórico

- `docs/handoff-v0.4.0.md` — onboarding anterior, mantido como histórico.
- `docs/old/handoffs/` — handoffs anteriores.
- `docs/old/plans/` — planos MVP, v0.2.0, Endless e revisão visual v0.4.0.
- `docs/old/qa/` — relatórios M6, device matrix, performance e run-log.
- `docs/old/release/` — G7 e validação técnica do MVP.

### Código

- `src/game/Game.ts` — fluxo de jogo, tutorial, ads e revive.
- `src/game/adSchedule.ts` — cadência de interstitials.
- `src/game/contracts.ts` — contratos de UI, tutorial, save, ads e plataforma.
- `src/sim/World.ts` — simulação, blocos, elementos, chefes e gate do laser.
- `src/input/touchAssist.ts` — edge assist do toque.
- `src/content/phases.ts` — tutorial, campanha e validador.
- `src/content/waves.ts` — ondas do tutorial e da campanha.
- `src/content/endless.ts` — gerador Endless.
- `src/progression/Save.ts` — save v1, `unlockedPhase` 0..6, settings e stats.
- `src/ui/Hud.ts` — coach marks do tutorial, HUD e aviso do laser.
- `src/ui/Menu.ts` — aviso de storage e rodapé.
- `src/platform/**` — Bridge/fallback, storage, interstitial e rewarded.
