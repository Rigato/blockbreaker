# Handoff — Bricklike v0.6.1

**Fonte única de onboarding para a próxima sessão.**  
**Data:** 2026-11-12  
**Branch:** `main`  
**Versão do package:** `0.6.1`  
**Build:** publicada no itch.io e no sandbox da Playgama; testes básicos ok  
**Publicado em portal:** `0.6.1` no itch.io e no sandbox da Playgama  
**Tag / GitHub Release:** nenhuma para `0.6.1`; nenhuma tag ou release foi criada  
**Review build:** <https://rigato.github.io/blockbreaker/> (acompanha a `main`;
a `0.6.1` aparece após o push desta fase)  
**Debug build:** <https://rigato.github.io/blockbreaker/?debug=1>  
**Repositório:** <https://github.com/Rigato/blockbreaker>  
**Pasta local:** `/mnt/SSD-Secundario/Nextcloud/5-GameProjects/4-Blockbreaker-roguelite`

> Este documento substitui o handoff da v0.6.0 como fonte atual. O
> [`handoff-v0.6.0.md`](handoff-v0.6.0.md) fica como histórico da build anterior.
> O GDD (`docs/GDD_Bricklike.md`, v1.8) é a fonte de design; o gap analysis
> (`docs/gdd-gap-analysis.md`) mostra implementado × pendente.

---

## 1. Snapshot

| Item | Valor |
|---|---|
| Branch de desenvolvimento | `main` |
| Versão em desenvolvimento | `0.6.1` |
| Versão publicada | `0.6.1` (itch.io + sandbox da Playgama) |
| Build 0.6.1 | publicada em 2026-11-12; sem tag e sem GitHub Release |
| Tag / GitHub Release | nenhuma para 0.2.x, 0.3.x, 0.4.0, 0.5.x, 0.6.0 ou 0.6.1 |
| Portais | itch.io 0.6.1; Playgama 0.6.1 sandbox; CrazyGames pausado até 2026-11-26; GameFlare bloqueado |
| Node | 22.12+ (CI usa Node 24) |
| Stack | Phaser 3.90, TypeScript estrito, Vite 8, Vitest, Playwright, Playgama Bridge 2.4.1 + adapter nativo do CrazyGames |
| ZIP local | `release/blockbreaker-web.zip` — 0.6.1, 20 arquivos, 1.514.492 bytes |
| SHA-256 do ZIP | `3f3c409845aaa090ccada04435c47298db0e994ec76821b7f59e741009ee49f8` |

O hash pode mudar em um rebuild; confirme em `release/manifest.json` antes de
qualquer upload. A `0.6.1` foi publicada no itch.io e no sandbox da Playgama
em 2026-11-12, após testes básicos do responsável.

---

## 2. O que mudou na 0.6.1

### 2.1 Tier 4 — três perks novas

O catálogo passa de 19 para **22 perks**; o Workshop passa de três para
**quatro tiers** e de 9 para **12 unlocks**. Nenhuma perk foi removida.

| ID | Nome | Tipo | Custo | Comportamento |
|---|---|---|---:|---|
| `overkill` | Overkill | único | 100 | Quando um hit direto destrói um bloco, o dano excedente vira splash de até **2** nos quatro blocos ortogonalmente adjacentes. O splash não dispara Overkill de novo; explosões, dano de link e Shield Bash não propagam Overkill. |
| `shield_bash` | Shield Bash | único | 110 | A cada **8 acertos no paddle**, uma onda de choque causa **1** de dano nas **duas linhas mais baixas** do campo; o contador zera no disparo e ao resetar a run/perk. A onda não dispara Overkill. |
| `conductor` | Conductor | único, requer `prism_laser` | 120 | Cada alvo do Prism Laser tenta encadear **uma vez** para um bloco ortogonalmente adjacente que o feixe ainda não atingiu, causando `max(1, round(level × 0.5))` de dano (1/1/2 nos níveis 1/2/3). Sem o perk, o laser não encadeia. |

Tuning em `src/game/config.ts`: `overkillMaxSplash: 2`, `shieldBashEvery: 8`,
`shieldBashDamage: 1`, `shieldBashRows: 2`, `conductorChainFactor: 0.5`.
Cobertura principal em `tests/tier4Perks.test.ts`.

### 2.2 Economia de Sparks reformulada

| Evento | Recompensa |
|---|---:|
| Onda concluída | `1 + floor(blocos destruídos na onda / 12)` |
| Combo de 5, 10 e 15 acertos na onda | +1 cada; máximo +3 por onda, uma vez por marco |
| Chefe derrotado | +3 |
| Conclusão de fase | +6 (sempre) |
| Primeira conclusão da fase | +6 extra (12 no total) |
| Teto por run | **250** (proteção de segurança) |

- Campanha e Endless usam as mesmas recompensas por evento; o Endless não tem
  mais fórmula plana própria.
- **Anti-farm:** recompensas de onda, combo e chefe são reivindicadas por
  tentativa de onda. Reiniciar uma onda já premiada na mesma run suprime essas
  recompensas na nova tentativa; a conclusão de fase continua pagando +6.
- O teto de 250 é proteção, não o valor normal: uma campanha completa rende
  ~169 Sparks antes dos bônus de bloco e combo.
- Sem ads, loot box, compra de vantagem ou bônus permanentes de atributos.

### 2.3 Feedback de Sparks

- **HUD:** chip de Sparks da run (oculto em zero), com pulso e toast
  `+N Sparks · <motivo>` ao ganhar; o toast é `role="status"` e some sozinho.
- **Results:** linha `+X Sparks · total Y` e quebra por fonte
  (`Waves`, `Bosses`, `Clear`, `First clear`, `Combo`), com o marcador
  `phase clear included` quando a conclusão entrou no total.
- Strings em `src/i18n/en.ts`; HUD em `src/ui/Hud.ts`; results em
  `src/ui/Overlay.ts`.

### 2.4 Workshop promovido a card de progressão

- O strip do menu virou um **card** com ícone próprio, título/subtítulo, saldo
  de Sparks, badge **Ready** quando há compra possível, contagem
  `X / 22 unlocked`, `N left` e barra de progresso.
- Em save novo o card mostra `10 / 22`, `12 left` e 45,45% de progresso; ao
  comprar a primeira perk vira `11 / 22`, `11 left`.
- O diálogo continua com cards por tier e estados
  `owned`/`affordable`/`locked`; agora lista 12 cards em quatro tiers.
- A UI lê `HudSnapshot`/`GameCommands`; a compra persiste no save v2 e emite
  `meta:changed`, atualizando card e diálogo sem reload.

### 2.5 Testes e layout

- 21 testes unitários novos desde a 0.6.0 (375 → **396**), incluindo
  `tests/tier4Perks.test.ts` e a nova economia em `tests/meta.test.ts`.
- E2E cobre quatro tiers, 12 cards, contagem `10 / 22`, compra/reload, chip e
  toast em 320 px, results com breakdown e anti-farm de retry.
- Gate de layout do card e do diálogo em 320×568 e 390×844 segue verde.

---

## 3. Arquitetura

### 3.1 Módulos novos ou alterados na 0.6.1

| Área | Arquivos | Responsabilidade |
|---|---|---|
| Conteúdo | `src/content/perks.ts`, `src/content/meta.ts` | três perks Tier 4, custos 100/110/120, 12 unlocks |
| Tuning | `src/game/config.ts` | splash, frequência/linhas do Shield Bash e fator do Conductor |
| Simulação | `src/sim/World.ts` | Overkill, onda do Shield Bash e encadeamento do laser |
| Progressão | `src/progression/RunState.ts` | modifiers das três perks e pré-requisito do Conductor |
| Economia | `src/progression/meta.ts` | fórmula por onda, marcos, clear, first clear, teto 250 e claims por onda |
| Orquestração | `src/game/Game.ts`, `src/game/contracts.ts`, `src/game/events.ts` | concessão por evento, anti-farm, breakdown e evento `sparks:earned` |
| UI | `src/ui/Hud.ts`, `src/ui/Overlay.ts`, `src/ui/Menu.ts`, `src/styles/menu-footer.css`, `src/styles/workshop.css` | chip/toast, breakdown, card com contagem/progresso |
| i18n | `src/i18n/en.ts` | textos de Tier 4, HUD e breakdown |

### 3.2 Fluxo

```text
main.ts
  → bridgeBoot
      → host CrazyGames/1001juegos? → CrazyGamesAdapter (SDK nativo)
      → demais hosts? → ./playgama-bridge.js → BridgeAdapter
      → falha/timeout? → FallbackAdapter local
  → BlockBreakerGame
      → RunState.startRun(seed, unlockedPerkIds)
      → World / GameScene / UIRoot / Hud / Overlay
      → SaveRepository (bb.save v2 / bb.settings)
      → PlatformService
```

A UI fala com o jogo por `GameCommands`; o jogo emite `hud:changed`,
`levelup:offered`, `ad:state`, `save:reset`, `meta:changed` e `sparks:earned`.

### 3.3 Fluxos do meta e dos Sparks

- **Onda:** `finishWave` paga `sparksForWave(blocos, 0)`; os marcos de combo são
  pagos ao vivo por `combo:changed`, uma vez por marco por tentativa.
- **Chefe:** `boss:defeated` paga +3, sujeito ao claim da onda.
- **Fase:** `finishPhase` paga +6 de clear e +6 extra na primeira conclusão;
  depois grava `sparksEarned`, `sparksBreakdown` e `sparksTotal`.
- **Anti-farm:** `RunSparkWaveClaims` marca a onda no primeiro pagamento e
  bloqueia onda/combo/chefe quando a mesma onda é recarregada na run.
- **Workshop:** `WorkshopDialog` lê `getMetaState()`; a compra chama
  `purchasePerkUnlock(id)`; o jogo persiste e emite `meta:changed`.
- **Ofertas:** `RunState` recebe os IDs desbloqueados no início da run e nunca
  oferece perk bloqueada; Conductor exige Prism Laser.
- **Debug:** `?debug=1` adiciona **Add Sparks +20** e **Force perk**, inclusive
  Tier 4, exclusivos de QA.

---

## 4. Invariantes

1. **Plataforma:** nenhum `if (platform === ...)` no gameplay; tudo via
   `PlatformService`.
2. **Storage:** nenhum `localStorage` direto; sempre via `StorageService`.
3. **Simulação:** passo fixo de 120 Hz; colisão circular/AABB com swept
   collision e micro-passos.
4. **Save:** schema v2 **inalterado**; `unlockedPhase` 0..6; `meta` sanitizado;
   v1 migra sem perder progresso; a run ativa não é salva.
5. **Catálogo:** **10 starters + 12 unlocks = 22 perks**; as starters são
   implícitas e o save grava apenas as compradas.
6. **Meta:** desbloqueia conteúdo, não atributos permanentes; compras são
   determinísticas e não há refund nesta versão.
7. **Ofertas:** nunca incluem perk bloqueada; fallback `Arcane Insight` só
   quando faltam opções; Conductor exige Prism Laser.
8. **Sparks:** teto de 250 por run; sem ads, loot box ou compra de vantagem;
   onda/combo/chefe pagam no máximo uma vez por onda por run.
9. **Tier 4:** Overkill só nasce de dano direto e não encadeia; Shield Bash não
   dispara Overkill; Conductor encadeia no máximo uma vez por alvo.
10. **Laser:** exige lançamento explícito na onda e ao menos uma bola solta;
    `noLaser` bloqueia a onda inteira.
11. **Tutorial:** coach marks pausam o jogo; só **Got it** ou **Skip tutorial**
    saem do modal.
12. **Ads:** tutorial sem ads; campanha só com próxima onda e múltiplo de 3;
    Endless a cada 4; exits com cooldown de 60 s; rewarded revive 1×/run.
13. **Debug:** `?debug=1` é só QA; nunca divulgar URL com debug.
14. **Nome:** jogo e loja **Bricklike**; slug técnico `blockbreaker`.
15. **Workshop:** a UI não inventa estado; lê `GameCommands`/`HudSnapshot`.

---

## 5. Gates e package

Executar a partir da raiz:

```bash
npm ci
npm run typecheck
npm test
npm run validate:content
node scripts/validate-bridge-config.mjs
npm run build
npm run test:e2e
npm run package
```

Resultados de referência da 0.6.1 (2026-11-12):

| Gate | Resultado |
|---|---|
| `npm run typecheck` | ✅ sem erros |
| `npm test` | ✅ **396 testes** em **32 arquivos** |
| `npm run validate:content` | ✅ **7 níveis, 22 ondas, 743 blocos, 1.809 XP** |
| Bridge config | ✅ schema 2.4.1, sem logo/analytics, sem URLs externas |
| `npm run build` | ✅ bundle Phaser/Vite (83 módulos) |
| `npm run test:e2e` | ✅ **37 testes** em **10 spec files** |
| `npm run package` | ✅ ZIP 0.6.1, **20 arquivos**, **1.514.492 bytes**, SHA-256 `3f3c409845aaa090ccada04435c47298db0e994ec76821b7f59e741009ee49f8` |

### 5.1 Manifesto do ZIP

- 20 arquivos; 1.514.492 bytes comprimidos; 3.068.148 bytes descomprimidos;
  maior caminho com 38 caracteres.
- Raiz: `index.html`, `playgama-bridge-config.json`, `playgama-bridge.js`,
  `favicon.svg`.
- `assets/`: `Game-N3olQShx.js`, `index-CfeGvdml.js`, `index-BVe7B3B7.css`,
  `Silkscreen-Bold-BHMh3gvp.ttf`, `Silkscreen-Regular-W9-u5Upq.ttf`,
  `.gitkeep`.
- `bad-decision-games/`: `logo.png`, `logo.webp`.
- `how-to-play/`: 5 screenshots (`boss`, `endless`, `level-up`, `move-launch`,
  `specials`).
- `licenses/`: Phaser, Playgama Bridge e Silkscreen OFL.
- Nenhum path absoluto ou URL externa no jogo.

Cobertura E2E: boot/menu, controles, pause, settings, How to Play/About,
level-up, vitória/unlock, Endless bloqueado/desbloqueado, AdMock
`show`/`fail`, rewarded revive/recusa, ads de pause/results, relógio pausado,
side art desktop, CDN bloqueado, layout 320/390/430/1440 + landscape,
chefe/desafio, Multiball, tutorial, Workshop (quatro tiers, 12 cards, compra,
persistência, card `10 / 22`, chip/toast em 320 px, results com breakdown e
anti-farm de retry).

`npm run qa:runs` continua sendo um baseline automatizado da fase 1, não um
playtest humano da 0.6.1.

---

## 6. Portais e publicação

| Portal | Versão | Status | Observação |
|---|---|---|---|
| itch.io | **0.6.1** | **publicado** | atualização manual em 2026-11-12; testes básicos ok |
| Playgama | **0.6.1** | **sandbox** | milestones pendentes; medir retenção/ads da nova build |
| CrazyGames Basic | 0.5.1 | **pausado** | submissão pausada/bloqueada até **2026-11-26** |
| GameFlare | 0.6.1 (não publicada) | **bloqueado** | conta sem acesso; suporte sem resposta |

- **0.6.1 está publicada** no itch.io e no sandbox da Playgama desde
  2026-11-12; o responsável fez testes básicos e considerou tudo ok.
- **0.5.1 é a build anterior.** Não há tag ou GitHub Release.
- **CrazyGames:** a 0.3.0 e a 0.4.0 foram reprovadas; a 0.5.1 foi submetida em
  2026-11-11. A conta/portal está **pausado até 2026-11-26**; não reenviar antes
  dessa data.
- **GameFlare:** conta criada, acesso bloqueado; não criar conta duplicada.
- **GitHub Pages:** acompanha a `main`; a 0.6.1 aparece no build de review
  após o push desta fase.
- **Assets de loja:** capas, 9 screenshots, 2 vídeos e 5 painéis How to Play
  regenerados a partir da 0.6.1; revisão humana pendente antes de reutilizar.

---

## 7. Como testar Sparks, Workshop e Tier 4

1. Abra `?debug=1` e use **Add Sparks +20** no painel de debug; repita até ter
   saldo para um Tier 4.
2. Volte ao menu: o card **Workshop** deve mostrar saldo, `X / 22 unlocked`,
   `N left` e a barra de progresso; o badge **Ready** aparece quando há compra.
3. Abra o Workshop: confira **quatro tiers** e **12 cards**, incluindo
   Overkill (100), Shield Bash (110) e Conductor (120).
4. Compre uma perk Tier 1 (Second Chance, 12) e confirme saldo, estado
   **Owned**, contagem `11 / 22` e persistência após reload.
5. Jogue uma onda: o chip de Sparks aparece no HUD e cada ganho mostra o toast
   `+N Sparks · <motivo>`.
6. Reinicie a mesma onda já premiada na mesma run: onda/combo/chefe não devem
   pagar de novo; a conclusão de fase ainda paga +6.
7. Termine a fase: os results mostram `+X Sparks · total Y` e o breakdown
   (`Waves`, `Bosses`, `Clear`, `First clear`, `Combo`).
8. Em uma run nova, use **Force perk** para testar:
   - **Overkill:** bata com dano excedente em um bloco e veja splash nos quatro
     vizinhos ortogonais;
   - **Shield Bash:** conte 8 acertos no paddle e veja a onda nas duas linhas
     mais baixas;
   - **Conductor:** compre/force Prism Laser + Conductor, lance a bola e dispare
     o laser; um alvo deve encadear uma vez para um vizinho.
9. Confirme que uma perk Tier 4 comprada pode aparecer nas ofertas e que as
   ainda bloqueadas continuam fora da pool.
10. Em `?debug=1&adMock=...`, confirme que ads e rewarded revive continuam
    funcionando sem alterar o meta.

---

## 8. Riscos e pendências

| Área | Estado | Risco / ação |
|---|---|---|
| Teste humano da 0.6.1 | básico concluído | aprofundar Tier 4, economia e anti-farm em playtest |
| Economia de Sparks | implementada e testada | calibrar tempo até o primeiro unlock e o teto de 250 com playtest |
| Tier 4 | testes verdes | Overkill/Shield Bash/Conductor ainda precisam de sensação humana; Conductor depende de Prism Laser |
| Anti-farm | coberto por teste | validar retry de onda em sessão real, incluindo pause/ads |
| Save v2 | inalterado | schema não mudou nesta versão; testar save real antigo antes de publicar |
| Workshop card | E2E e layout 320/390 verdes | validar em iframe de portal e em desktop |
| CrazyGames | pausado até 2026-11-26 | não reenviar; retomar só depois da data e de teste humano |
| GameFlare | bloqueado | follow-up único no suporte; não criar conta duplicada |
| Assets de loja | regenerados da 0.6.1 | revisar antes de reutilizar em portal |
| Distribuição | 0.6.1 publicada no itch.io/Playgama | CrazyGames/GameFlare seguem pendentes |
| Tag/Release | nenhuma | só criar depois de aprovação humana explícita |
| P0/P1 | nenhum conhecido nos gates | reportar imediatamente se aparecer em teste manual |

---

## 9. Próximos passos

1. **Teste manual da 0.6.1** em build da `main`: Tier 4, economia, card do
   Workshop, HUD, results e anti-farm.
2. **Playtest de economia:** medir Sparks por run, tempo até o primeiro unlock
   e se o teto de 250 está adequado.
3. **Balance das três perks Tier 4** em runs reais, incluindo a sinergia
   Conductor + Prism Laser.
4. **Validar o card do Workshop** em iframe de portal e em desktop.
5. **Revisar assets de loja** antes de qualquer publicação da 0.6.1; os atuais
   são da 0.5.1.
6. **Push da `main`** e conferência de CI/Pages, se o coordenador aprovar.
7. **CrazyGames:** aguardar 2026-11-26 e só então decidir o reenvio.
8. **GameFlare:** follow-up único no suporte; não criar conta duplicada.
9. **Publicação da 0.6.1:** manual, somente após teste humano e aprovação.
10. **Tag/release:** somente após aprovação humana explícita; nenhuma foi
    criada.

---

## 10. Referências

### Essenciais

- [`docs/GDD_Bricklike.md`](GDD_Bricklike.md) — fonte de design v1.8.
- [`docs/gdd-gap-analysis.md`](gdd-gap-analysis.md) — implementado × pendente.
- [`docs/perks-e-metaprogressao.md`](perks-e-metaprogressao.md) — catálogo,
  economia e Tier 4.
- [`docs/plano-v0.6.0-metaprogressao.md`](plano-v0.6.0-metaprogressao.md) —
  plano histórico da metaprogressão.
- [`docs/spec-tecnica-publicacao.md`](spec-tecnica-publicacao.md) — guia de
  publicação, arquitetura, ads, save e QA.
- [`docs/build-release.md`](build-release.md) — build, ZIP, CI e runbook.
- [`docs/release/status.md`](release/status.md) — status/URLs de publicação.
- [`docs/release/submission-checklist.md`](release/submission-checklist.md) —
  checklist manual.
- [`docs/qa/playtest-kit.md`](qa/playtest-kit.md) — protocolo de playtest.
- [`docs/qa/performance-testing.md`](qa/performance-testing.md) — protocolo de
  performance.

### Histórico

- [`docs/handoff-v0.6.0.md`](handoff-v0.6.0.md) — onboarding da build anterior.
- [`docs/handoff-v0.5.1.md`](handoff-v0.5.1.md) — onboarding da build publicada.
- `docs/handoff-v0.4.0.md` — onboarding da 0.4.0.
- `docs/old/handoffs/` — handoffs anteriores.
- `docs/old/plans/` — planos MVP, v0.2.0, Endless e revisão visual v0.4.0.
- `docs/old/qa/` — relatórios M6, device matrix, performance e run-log.
- `docs/old/release/` — G7 e validação técnica do MVP.

### Código

- `src/game/Game.ts` — fluxo de jogo, Sparks, anti-farm, compra, ads e revive.
- `src/game/contracts.ts` — contratos de save v2, meta, UI, ads e plataforma.
- `src/content/meta.ts` — starters, 12 unlocks, tiers, custos e helpers.
- `src/progression/meta.ts` — compra, sanitização, economia e `MetaState`.
- `src/progression/Save.ts` — save v2, migração v1→v2 e persistência.
- `src/progression/RunState.ts` — pool de perks, ofertas e modifiers Tier 4.
- `src/sim/World.ts` — Overkill, Shield Bash, Conductor e demais efeitos.
- `src/ui/Hud.ts` — chip e toast de Sparks.
- `src/ui/Overlay.ts` — results com Sparks e breakdown.
- `src/ui/WorkshopDialog.ts` — diálogo de compra e foco.
- `src/ui/Menu.ts` — card do Workshop, contagem, progresso e badge.
- `src/content/perks.ts` — catálogo fixo de 22 perks.
