# Handoff — Bricklike v0.5.1

**Fonte única de onboarding para a próxima sessão.**  
**Data:** 2026-11-11  
**Branch:** `main`  
**Versão do package:** `0.5.1`  
**Build:** publicado no itch.io e no sandbox da Playgama; CrazyGames em review  
**Publicado em portal:** `0.5.1` no itch.io e no sandbox da Playgama; `0.5.1` submetida ao CrazyGames  
**Review build:** <https://rigato.github.io/blockbreaker/> (reflete o último push;
a 0.5.1 só aparece depois do push)  
**Debug build:** <https://rigato.github.io/blockbreaker/?debug=1>  
**Repositório:** <https://github.com/Rigato/blockbreaker>  
**Pasta local:** `/mnt/SSD-Secundario/Nextcloud/5-GameProjects/4-Blockbreaker-roguelite`

> Este documento substitui o handoff da v0.5.0 como fonte atual. O handoff
> anterior fica como histórico em `docs/handoff-v0.5.0.md`. O GDD
> (`docs/GDD_Bricklike.md`, v1.6) continua sendo a fonte de design; o gap
> analysis (`docs/gdd-gap-analysis.md`) mostra o que falta.

---

## 1. Snapshot

| Item | Valor |
|---|---|
| Branch de desenvolvimento | `main` |
| Versão em desenvolvimento | `0.5.1` |
| Versão publicada | `0.5.1` (itch.io + Playgama sandbox); CrazyGames submetida em review |
| Build 0.5.1 | publicado no itch.io/Playgama; submetido ao CrazyGames em 2026-11-11 |
| Tag / GitHub Release | nenhuma para 0.2.x, 0.3.x, 0.4.0, 0.5.0 ou 0.5.1 |
| Portais | itch.io 0.5.1; Playgama 0.5.1 sandbox; CrazyGames 0.3.0/0.4.0 reprovadas e 0.5.1 em review; GameFlare bloqueado |
| Node | 22.12+ (CI usa Node 24) |
| Stack | Phaser 3.90, TypeScript estrito, Vite 8, Vitest, Playwright, Playgama Bridge 2.4.1 + adapter nativo do CrazyGames |
| ZIP local | `release/blockbreaker-web.zip` — 0.5.1, 20 arquivos, 1.508.491 bytes |
| SHA-256 atual do ZIP | `f63d19341492aaa3b2378d262baac87f103e71daf00ec674972e531f832209ce` |

O hash pode mudar no build final; confirme em `release/manifest.json` antes de
qualquer upload. O GitHub Pages acompanha a `main` e já serve a 0.5.1.

---

## 2. O que existe

### Tutorial (rework da 0.5.1)

- **Fase 0 “Tutorial”**, id `tutorial`, exibida como card próprio antes das seis
  fases da campanha.
- **2 ondas**: `tutw1` **First Steps** e `tutw2` **Spark Practice**.
- **8 blocos na onda 1 e 8 na onda 2**, total **16 blocos**, **32 XP** e
  **2 level ups**. A onda 1 é só `stone` (HP 2); a onda 2 introduz um bloco
  explosivo entre os stones.
- O primeiro level up vem após **4 blocos destruídos** (8 XP). O segundo fecha a
  conta das duas ondas. A fase é rápida de propósito.
- Em save novo, **level 1 fica bloqueado** atrás do tutorial: `unlockedPhase`
  vai de **0 a 6**, com **0 = tutorial**.
- Save antigo com `unlockedPhase >= 1` continua funcionando e não é forçado a
  repetir o tutorial. Saves antigos com clears registrados inferem o unlock.
- **“Skip tutorial”** conclui o tutorial imediatamente e libera o level 1.
- **Sem ads no tutorial.**
- O tutorial não conta como fase da campanha para `campaignComplete`; o Endless
  continua exigindo a fase 6 concluída.

### Coach marks do tutorial (modais pausados)

Os coach marks agora são **modais pausados**, com botão **Got it** e
**Skip tutorial**, em **5 etapas**. O jogo fica pausado enquanto o modal está
aberto, o relógio da run não conta e o áudio fica suspenso.

| # | Etapa | Posição | Abre quando | Got it leva a |
|---:|---|---|---|---|
| 1 | Mover/lançar | inferior, perto do paddle | início do tutorial | retomar o jogo |
| 2 | XP/perk | superior, perto do HUD | primeiro level up | abrir os cards de perk |
| 3 | Blocos especiais | centro | início da onda 2 | retomar o jogo |
| 4 | Chefes | centro | onda 2 limpa | passo Endless |
| 5 | Endless | centro | logo após o passo de chefes | results do tutorial |

O avanço é por gatilho, não por tempo: cada modal espera o **Got it** (ou o
**Skip tutorial**, que conclui a fase). O tutorial não usa mais painel
contextual não bloqueante.

### Campanha

- **6 fases, 20 ondas**: Crystal Grove, Ruined Halls, Arcane Depths,
  Frostbound Spire, Emberforge e Void Threshold.
- Ondas por fase: **2 / 3 / 3 / 3 / 4 / 5** (a fase 1 foi encurtada para 2).
- Com o tutorial, o seletor mostra **7 cards / 22 ondas**.
- **9 tipos de bloco**, **7 elementos de fase**, **3 chefes** e **19 perks**.
- Totais validados com tutorial: **743 blocos**, **1.809 XP**.
- Campanha pura: **727 blocos**, **1.777 XP**.
- Tutorial: **16 blocos**, **32 XP**, **2 level ups**.

| Fase | Ondas | Blocos | XP |
|---|---:|---:|---:|
| Tutorial | 2 | 16 | 32 |
| 1 — Crystal Grove | 2 | 54 | 76 |
| 2 — Ruined Halls | 3 | 90 | 212 |
| 3 — Arcane Depths | 3 | 94 | 262 |
| 4 — Frostbound Spire | 3 | 103 | 229 |
| 5 — Emberforge | 4 | 136 | 348 |
| 6 — Void Threshold | 5 | 250 | 650 |
| **Total** | **22** | **743** | **1.809** |

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
- **Rodapé do menu**: How to Play, Settings, About Us e a versão.
- **Aviso de storage**: quando o diagnóstico da plataforma é memória/fallback,
  o menu mostra um aviso discreto **“Progress may not be saved”**. Clicar abre
  um popup explicando que progresso e settings podem ser perdidos ao fechar a
  página.
- **Side art desktop:** `src/assets/desktop-side-art.svg` + CSS preenchem as
  laterais do jogo portrait quando o viewport está em **landscape/aspect >= 1**
  (ex.: 606×297, 907×510, 1920×1080). No mobile portrait (ex.: 390×844) nada
  muda. O interior do jogo não foi alterado por essa camada; o jogo continua
  **portrait no desktop**. A legibilidade desktop ainda precisa ser validada no
  QA real e não está garantida.

### Controles touch

- O drag relativo continua **1:1 no centro** do campo.
- Na **zona externa de 22%** de cada lado, o ganho cresce progressivamente até
  **2,2×**, para o paddle alcançar a borda antes do dedo e evitar o gesto de
  borda do navegador.
- **Ganho por deslocamento longo:** movimentos curtos ficam 1:1/precisos; um
  swipe longo chega a **2,2×** e permite atravessar o campo sem levantar o dedo.
  O ganho cresce com o deslocamento a partir de um pequeno limiar e satura no
  máximo.
- O **limite de velocidade do paddle não mudou**; os ganhos ampliam o
  deslocamento do alvo por toque, não a velocidade da simulação.
- Mouse continua **absoluto**; teclado continua igual.
- Edge assist e travel gain valem para toque/pen, não para mouse.

### Laser

- O Prism Laser exige **lançamento explícito da bola na onda**. Não basta
  existir uma bola solta criada por debug ou multiball.
- Ao resetar/carregar a onda, o laser fica bloqueado até o jogador lançar.
- Depois do lançamento, continua exigindo pelo menos uma bola solta; Sticky
  Paddle pode bloquear de novo.
- O HUD mostra **“Launch the ball first”** quando o bloqueio é a falta de
  lançamento; `noLaser` mostra o motivo da regra.

### Ads (política mantida da 0.5.1)

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
- **CrazyGames sem Playgama:** o novo `src/platform/CrazyGamesAdapter.ts`
  detecta host `crazygames.com`/subdomínios e `1001juegos.com`, carrega
  **somente** o SDK nativo `https://sdk.crazygames.com/crazygames-sdk-v3.js` e
  **não carrega** `playgama-bridge.js` nesse host.
- **Demais portais:** em Playgama, itch.io e GameFlare o runtime local
  `public/playgama-bridge.js` é carregado dinamicamente. Não há CDN da Playgama
  no boot. A mesma build serve todos os portais.
- O validador de pacote permite `sdk.crazygames.com` porque é o SDK do próprio
  portal.
- O adapter do CrazyGames cobre storage, ads, pausa/áudio e
  `gameplayStart`/`gameplayStop`, com timeout e fallback.
- Sem `localStorage` direto no jogo, sem analytics externo, sem banners.

---

## 3. O que está fora de escopo

- Metaprogressão permanente e desbloqueios entre runs.
- Leaderboards, conquistas, tarefas diárias e ranking global.
- Outros usos de rewarded ads além do revive.
- Localização (UI e metadata em inglês).
- Landscape jogável; mobile landscape apenas pausa e pede portrait.
- **Moldura/letterbox desktop dedicada:** o shell portrait centralizado é
  intencional. A 0.5.1 adiciona **side art** como camada de apresentação nas
  laterais, sem alterar o interior do jogo; isso não é um modo landscape nem
  resolve a legibilidade desktop por si só.
- Editor de fases ou pipeline procedural fora do Endless.
- Backend, contas e cloud save.
- Full Launch do CrazyGames e novos portais (Poki, GameDistribution, Famobi).

---

## 4. Arquitetura

### 4.1 Módulos

| Área | Arquivos | Responsabilidade |
|---|---|---|
| Boot | `src/main.ts`, `src/boot/**`, `src/platform/CrazyGamesAdapter.ts` | query flags, detecção de host, adapter nativo do CrazyGames, Bridge local, fallback, UI |
| Orquestração | `src/game/Game.ts`, `contracts.ts`, `config.ts`, `events.ts`, `adSchedule.ts` | menu/run, tutorial, campanha × Endless, ads, save, HUD |
| Simulação | `src/sim/**` | `World` fixed-step 120 Hz, colisão, blocos, elementos, chefes e laser |
| Layout | `src/sim/layout.ts` | `computeFieldScale` |
| Conteúdo | `src/content/**` | tutorial, fases, ondas, Endless, blocos, perks, endings, validador |
| Progressão | `src/progression/**` | XP, perks, modificadores, save e estatísticas |
| Render | `src/render/**` | Phaser scene, temas, blocos, elementos, chefes, partículas |
| UI DOM | `src/ui/**` | menu, HUD/tutorial modal, level-up, pause, results, phase select, dialogs, debug |
| Estilos | `src/styles/**`, `src/style.css`, `src/assets/desktop-side-art.svg` | phase select, HUD compacto, menu footer, HowTo/About, tutorial, revive, side art desktop |
| Input | `src/input/Input.ts`, `src/input/touchAssist.ts` | toque, mouse, teclado, foco, edge assist e travel gain |
| Áudio | `src/audio/**` | WebAudio sintetizado, lifecycle, mutes |
| Plataforma | `src/platform/**` | Bridge/fallback, adapter CrazyGames, storage, ads e save reset |
| i18n | `src/i18n/**` | strings em inglês |
| Testes | `tests/**`, `tests/e2e/**` | Vitest e Playwright |
| Scripts | `scripts/**` | conteúdo, Bridge, package, QA e perf smoke |
| Assets de loja | `store/**` | capas, screenshots, vídeos |
| Assets do jogo | `public/**` | HowTo, logo do estúdio, licenças, Bridge config/runtime |

### 4.2 Fluxo

```text
main.ts
  → bridgeBoot
      → host CrazyGames/1001juegos? → CrazyGamesAdapter (SDK nativo)
      → demais hosts? → carrega ./playgama-bridge.js → BridgeAdapter
      → falha/timeout? → FallbackAdapter local
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

- **Tutorial:** `startPhase('tutorial')` → `openTutorialStep('move')` → `tutw1`;
  o primeiro level up abre o coach mark `levelup`, a segunda onda abre
  `specials`; ao limpar a onda 2, abrem `bosses` e depois `endless`;
  `finishPhase(true)` grava clears e libera `unlockedPhase = 1`.
  `skipTutorial()` conclui a fase sem esperar as ondas.
- **Coach mark:** `openTutorialStep` muda `phase` para `tutorial`, zera o clock,
  suspende o áudio e emite o snapshot do modal. `acknowledgeTutorial()` retoma
  o jogo, abre o level-up ou avança para o próximo passo, conforme a etapa.
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
- **Side art:** `#desktop-side-art` é uma camada fixa fora do shell; o CSS a
  exibe somente em `min-aspect-ratio: 1/1`. Ela não entra no canvas nem no
  layout da simulação.

---

## 5. Invariantes

1. **Plataforma:** nenhum `if (platform === ...)` no gameplay; tudo via
   `PlatformService`. A detecção de host fica no boot e escolhe o adapter.
2. **Storage:** nenhum `localStorage` direto; sempre via `StorageService`.
3. **Simulação:** passo fixo de 120 Hz; colisão circular/AABB com swept
   collision e micro-passos para segmentos.
4. **Laser:** exige lançamento explícito na onda **e** pelo menos uma bola solta;
   bolas de debug/multiball não substituem o lançamento; `noLaser` bloqueia a
   onda inteira.
5. **Touch:** 1:1 no centro; ganho progressivo até 2,2× na zona externa de 22%;
   travel gain até 2,2× em swipes longos; mouse absoluto; limite de velocidade
   do paddle inalterado.
6. **Tutorial modal:** com um coach mark aberto, `phase = 'tutorial'`, o relógio
   da run não avança e o áudio fica suspenso; só **Got it** ou **Skip tutorial**
   saem do modal.
7. **Multiball:** slots rearmados por onda; primeira bola manual e extras em
   sequência, teto de 8 bolas.
8. **Contadores de explosão:** `Explosive Core` (8) e `Bomb Ball` (12) usam
   contadores próprios, resetados ao adquirir o perk.
9. **Save:** schema v1; `unlockedPhase` 0..6; `campaignComplete`, `endless` e
   estatísticas do tutorial são extensões compatíveis.
10. **Conteúdo:** toda onda da campanha e do tutorial passa pelo validador;
    Endless tem gerador determinístico e testes próprios.
11. **Ads:** tutorial sem ads; campanha só em onda múltipla de 3 com próxima
    onda; Endless a cada 4; exits com cooldown de 60 s; rewarded revive 1×/run;
    recompensa só em `rewarded`; `failed`/`skipped` são caminho normal.
12. **Debug:** `?debug=1` é só QA; nunca divulgar URL com debug. O handle
    `window.__bricklike` só existe em debug.
13. **Nome:** jogo e loja **Bricklike**; slug técnico `blockbreaker`.
14. **Relógio:** `phaseElapsedMs` só avança com `phase === 'playing'`.
15. **Side art:** camada de apresentação fora do shell, ativa só em
    landscape/aspect >= 1; não altera input, canvas ou layout interno.

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

Resultados de referência da 0.5.1:

| Gate | Resultado |
|---|---|
| `npm run typecheck` | ✅ sem erros |
| `npm test` | ✅ **329 testes** em **29 arquivos** |
| `npm run validate:content` | ✅ **7 níveis, 22 ondas, 743 blocos, 1.809 XP** |
| Bridge config | ✅ schema 2.4.1, sem logo/analytics, sem URLs externas |
| `npm run build` | ✅ bundle Phaser/Vite |
| `npm run package` | ✅ ZIP 0.5.1, **20 arquivos**, **1.508.491 bytes**, SHA-256 `f63d19341492aaa3b2378d262baac87f103e71daf00ec674972e531f832209ce` |
| `npm run test:e2e` | ✅ **31 testes** em **9 spec files** |
| CI + Deploy | pendente de push da 0.5.1 |

Cobertura E2E atual: boot/menu, controles, pause, settings, How to Play/About,
level-up, vitória/unlock, Endless bloqueado/desbloqueado, AdMock
`show`/`fail`, rewarded revive/recusa, ads de pause/results, relógio pausado,
side art desktop, CDN bloqueado, layout 320/390/430/1440 + landscape,
chefe/desafio, Multiball, tutorial (gate/skip/coach marks) e storage fallback.

`npm run qa:runs` continua sendo um baseline automatizado da **fase 1** com
projéteis de debug; não é playtest humano nem cobre 4–6/Endless.

---

## 7. Portais e publicação

| Portal | Versão | Status | Observação |
|---|---|---|---|
| itch.io | **0.5.1** | **publicado** | atualização manual; `0.1.0-mvp` histórica |
| Playgama | **0.5.1** | **sandbox** | milestones pendentes antes da publicação |
| CrazyGames Basic | 0.3.0 e 0.4.0 reprovadas / 0.5.1 | **em review** | submissão nova em 2026-11-11; aguardando resultado |
| GameFlare | 0.5.1 (não publicada) | **bloqueado** | sem resposta do suporte sobre login |

- **CrazyGames — preview 0.5.1 medido:** em **907×510** (iframe
  **606×297**) o shell ficou **167×297**; em **1920×1080** ficou **442×786**.
  O boot caiu para **~340 ms**, o Network mostrou apenas **`sdk.crazygames.com`**
  (nenhum request Playgama) e a **side art** apareceu nas laterais. O shell
  portrait não cresceu; a legibilidade desktop segue como risco. O
  `BannerError` ainda aparece no console, agora comprovadamente do SDK do
  CrazyGames, não da Playgama. Ver
  [`docs/release/crazygames-review.md`](release/crazygames-review.md) e
  [`docs/research/crazygames-feedback.md`](research/crazygames-feedback.md).
- **Playgama sandbox (amostra pequena):** 17/100 qualifying plays; avg play time
  **5:42** contra meta **5:00**; ad shows/play **1,70** contra meta **0,30**;
  116 launches, 31 plays, 5m45s e 3/2 likes. A amostra é pequena demais para
  concluir qualidade ou retenção; use os números como sinal, não veredito.
- **GameFlare:** conta criada, acesso bloqueado; suporte acionado e sem
  resposta. Não criar conta duplicada sem orientação.
- **Orientação no portal:** o formulário do CrazyGames só oferece **Mobile
  orientation**; não há campo de orientação desktop. A orientação mobile está
  **PORTRAIT**, que é o correto. O portal assume **landscape no PC**; a página de
  preview ainda exibe “Landscape / Portrait” de forma genérica. Não é possível
  declarar portrait para desktop no formulário.
- **Formulário CrazyGames:** a opção de save aparecia como **LocalStorage**, com
  aviso de que o Automatic Progress Save não funciona em iframe. Como o adapter
  usa o **Data Module** do SDK, a opção correta é “Yes, using the Data Module”.
  O checkbox “supports CrazyGames muting audio through SDK” também deve ser
  marcado; o adapter implementa o listener de áudio.
- **Assets de loja:** capas, screenshots, vídeos e How to Play foram gerados na
  sessão paralela; revisão humana pendente antes de qualquer submissão.
- O ZIP 0.5.1 foi publicado no itch.io e no sandbox da Playgama; a submissão ao
  CrazyGames está em review. Nenhuma tag ou GitHub Release foi criada.

---

## 8. Riscos e pendências

| Área | Estado | Risco / ação |
|---|---|---|
| Teste humano da 0.5.1 | pendente | validar tutorial de 16 blocos/32 XP, fluxo dos 5 modais, skip, travel gain, side art, save antigo e ads |
| CrazyGames | 0.5.1 submetida em 2026-11-11 | aguardando review; motivo das reprovações anteriores segue genérico |
| Apresentação desktop | side art adicionada; shell portrait intencional | risco residual de legibilidade em iframe desktop; medir 606×297, 907×510 e 1920×1080 no QA real |
| Adapter CrazyGames | implementado com timeout/fallback | validar no Preview que não há request a `bridge.playgama.com` nem a `api.playgama.com` |
| Balance 4–6 | validado estruturalmente | falta playtest humano de timers, HP e densidade |
| Balance Endless | gerador/testes verdes | ondas 15–30+ e chefes precisam de playtest |
| Ads reais | política nova implementada | falta medir fill/limites e a cadência na Playgama/CrazyGames |
| Revive rewarded | implementado/testado | validar UX e frequência em portal real |
| Performance real | documentação e script prontos | resultados pendentes; medir 4 GB/Chromebook e iframes |
| Boot / Bridge | adapter nativo no CrazyGames; Bridge local nos demais | validar boot com SDK bloqueado e fallback |
| Store assets | gerados na sessão paralela | revisão humana pendente antes da submissão da 0.5.1 |
| Save real | v1 compatível; parse testado | testar save antigo no navegador antes do upload |
| Playgama | sandbox 0.4.0 | amostra pequena; acompanhar milestones após a 0.5.1 |
| GameFlare | acesso bloqueado | sem resposta do suporte; não criar conta duplicada |
| Tag/Release | nenhuma | só depois de aprovação humana |
| P0/P1 | nenhum conhecido nos gates | reportar imediatamente se aparecer em teste manual |

---

## 9. Próximos passos para a nova sessão

1. **Teste manual da 0.5.1** em build da `main`: tutorial completo (8+8 blocos,
   32 XP, 2 level ups, primeiro perk após 4 blocos), os cinco modais com
   **Got it** e **Skip tutorial**, onda 1 só stone, onda 2 com especial,
   travel gain no celular, side art em 606×297/907×510/1920×1080 e ausência de
   side art em 390×844, laser bloqueado até o lançamento, ads mock
   (`show`/`fail`/`rewarded`), save antigo e aviso de storage em fallback.
2. **Validar o adapter CrazyGames** no Preview: Network sem
   `bridge.playgama.com`/`api.playgama.com`, SDK nativo carregado do
   `sdk.crazygames.com`, boot com SDK bloqueado caindo no fallback.
3. **Medir performance** com [`docs/qa/performance-testing.md`](qa/performance-testing.md)
   e [`scripts/perf-smoke.mjs`](../scripts/perf-smoke.mjs). Não há resultado de
   performance da 0.5.1 ainda.
4. **Revisar store assets** (screenshots do tutorial e da fase 1, capas/vídeos,
   How to Play) gerados na sessão paralela a partir da 0.5.1. Não reutilizar os assets da 0.4.0 na
   submissão.
5. **Push da `main`** e conferir CI/Pages; o GitHub Pages só passa a mostrar a
   0.5.1 depois do push.
6. **Publicar a 0.5.1** manualmente no itch.io e no sandbox da Playgama após o
   teste humano; conferir o hash do ZIP antes de cada upload.
7. **CrazyGames:** pedir detalhes pelo suporte usando o rascunho de
   [`docs/research/crazygames-feedback.md`](research/crazygames-feedback.md),
   depois reenviar a 0.5.1 como nova submissão, com assets e mensagem de
   mudanças.
8. **GameFlare:** follow-up único no suporte; não criar conta duplicada.
9. **Só depois de aprovação humana** criar a tag `v0.5.1` e o GitHub Release.
10. Decidir o próximo ciclo: retenção/metaprogressão, mais conteúdo, ou
    localização/landscape.

---

## 10. Referências

### Essenciais

- [`docs/GDD_Bricklike.md`](GDD_Bricklike.md) — fonte de design v1.6.
- [`docs/gdd-gap-analysis.md`](gdd-gap-analysis.md) — implementado × pendente.
- [`docs/spec-tecnica-publicacao.md`](spec-tecnica-publicacao.md) — guia único
  de publicação: estratégia, portais, arquitetura, ads, save, QA e release. O
  antigo plano de baixa fricção está arquivado em
  [`old/plans/plano-baixa-fricao.md`](old/plans/plano-baixa-fricao.md).
- [`docs/build-release.md`](build-release.md) — build, ZIP, CI e runbook.
- [`docs/release/portal-metadata.md`](release/portal-metadata.md) — textos em
  inglês.
- [`docs/release/submission-checklist.md`](release/submission-checklist.md) —
  checklist manual.
- [`docs/release/status.md`](release/status.md) — status/URLs de publicação.
- [`docs/release/crazygames-review.md`](release/crazygames-review.md) —
  diagnóstico, reprovações, preview medido e plano.
- [`docs/research/crazygames-feedback.md`](research/crazygames-feedback.md) —
  canais, QA tool e rascunho de suporte.
- [`docs/qa/playtest-kit.md`](qa/playtest-kit.md) — protocolo de playtest.
- [`docs/qa/performance-testing.md`](qa/performance-testing.md) — protocolo de
  performance.
- [`scripts/perf-smoke.mjs`](../scripts/perf-smoke.mjs) — smoke de performance.

### Arquivo histórico

- `docs/handoff-v0.5.1.md` — onboarding anterior, mantido como histórico.
- `docs/handoff-v0.4.0.md` — onboarding da 0.4.0.
- `docs/old/handoffs/` — handoffs anteriores.
- `docs/old/plans/` — planos MVP, v0.2.0, Endless e revisão visual v0.4.0.
- `docs/old/qa/` — relatórios M6, device matrix, performance e run-log.
- `docs/old/release/` — G7 e validação técnica do MVP.

### Código

- `src/game/Game.ts` — fluxo de jogo, tutorial, coach marks, ads e revive.
- `src/game/adSchedule.ts` — cadência de interstitials.
- `src/game/contracts.ts` — contratos de UI, tutorial, save, ads e plataforma.
- `src/sim/World.ts` — simulação, blocos, elementos, chefes e gate do laser.
- `src/input/touchAssist.ts` — edge assist e travel gain do toque.
- `src/content/phases.ts` — tutorial, campanha e validador.
- `src/content/waves.ts` — ondas do tutorial (8+8 blocos) e da campanha.
- `src/content/endless.ts` — gerador Endless.
- `src/progression/Save.ts` — save v1, `unlockedPhase` 0..6, settings e stats.
- `src/ui/Hud.ts` — coach marks modais, HUD e aviso do laser.
- `src/ui/Menu.ts` — aviso de storage e rodapé.
- `src/platform/CrazyGamesAdapter.ts` — detecção de host e SDK nativo.
- `src/boot/bridgeBoot.ts` — seleção entre adapter CrazyGames, Bridge local e
  fallback.
- `src/assets/desktop-side-art.svg` + `src/style.css` — side art desktop.
