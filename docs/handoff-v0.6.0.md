# Handoff — Bricklike v0.6.0

**Fonte única de onboarding para a próxima sessão.**  
**Data:** 2026-11-12  
**Branch:** `main`  
**Versão do package:** `0.6.0`  
**Build:** local, **não publicado e não submetido**  
**Publicado em portal:** `0.5.1` no itch.io e no sandbox da Playgama  
**Tag / GitHub Release:** nenhuma para `0.6.0`; nenhuma tag ou release foi criada  
**Review build:** <https://rigato.github.io/blockbreaker/> (acompanha a `main`; a
0.6.0 já aparece após o push de 2026-11-12)  
**Debug build:** <https://rigato.github.io/blockbreaker/?debug=1>  
**Repositório:** <https://github.com/Rigato/blockbreaker>  
**Pasta local:** `/mnt/SSD-Secundario/Nextcloud/5-GameProjects/4-Blockbreaker-roguelite`

> Este documento substitui o handoff da v0.5.1 como fonte atual. O
> [`handoff-v0.5.1.md`](handoff-v0.5.1.md) fica como histórico da build
> publicada. O GDD (`docs/GDD_Bricklike.md`, v1.7) é a fonte de design; o gap
> analysis (`docs/gdd-gap-analysis.md`) mostra implementado × pendente.

---

## 1. Snapshot

| Item | Valor |
|---|---|
| Branch de desenvolvimento | `main` |
| Versão em desenvolvimento | `0.6.0` |
| Versão publicada | `0.5.1` (itch.io + sandbox da Playgama) |
| Build 0.6.0 | local, sem upload, sem tag e sem GitHub Release |
| Tag / GitHub Release | nenhuma para 0.2.x, 0.3.x, 0.4.0, 0.5.x ou 0.6.0 |
| Portais | itch.io 0.5.1; Playgama 0.5.1 sandbox; CrazyGames pausado até 2026-11-26; GameFlare bloqueado |
| Node | 22.12+ (CI usa Node 24) |
| Stack | Phaser 3.90, TypeScript estrito, Vite 8, Vitest, Playwright, Playgama Bridge 2.4.1 + adapter nativo do CrazyGames |
| ZIP local | `release/blockbreaker-web.zip` — 0.6.0, 20 arquivos, 1.513.834 bytes |
| SHA-256 do ZIP | `1fed8ff154821c209713b64635ab5660845994b6ec1146efdc1a71bab83bcedd` |

O hash pode mudar em um rebuild; confirme em `release/manifest.json` antes de
qualquer upload. A `0.6.0` não foi publicada em nenhum portal.

---

## 2. O que mudou na 0.6.0

### 2.1 Perks reworkadas

Quatro perks ganharam identidade própria; nenhuma perk foi removida do catálogo.

| ID | Nome | Tipo | Comportamento |
|---|---|---|---|
| `momentum` | Momentum | repetível, máx. 3 | Hits consecutivos em blocos dão +1% de dano e +2% de XP por hit; caps de +5/+10/+15% de dano e +10/+20/+30% de XP. Reseta quando a bola toca o paddle. |
| `bombardier` | Bombardier | único | A cada 12 blocos destruídos, arma a próxima batida em bloco para explodir uma área 3×3 (2 de dano no centro, 1 ao redor). A carga é consumida no hit. |
| `boss_slayer` | Boss Slayer | único | A cada 10 blocos destruídos, o próximo acerto no chefe causa +3 de dano. O contador zera depois do acerto. |
| `hot_streak` | Hot Streak | repetível, máx. 2 | Após 5 hits consecutivos em blocos, ganha +1/+2 de dano por 3 s; cada novo hit renova o timer. Não altera a velocidade permanentemente. |

Explosive Core continua com contador próprio (8 blocos), separado de
Bombardier (12). Os testes de cada rework estão em
`tests/perkReworks.test.ts`.

### 2.2 Metaprogressão horizontal

- **10 perks iniciais:** Multiball, Wide Paddle, Power Ball, Quick Study,
  Arcane Turret, Giant Ball, Safety Net, Prism Laser, Foresight e Critical
  Strike.
- **9 unlocks atuais**, agrupados por tier e custo:

| Tier | Perk | Custo |
|---:|---|---:|
| 1 | Second Chance | 12 |
| 1 | Explosive Core | 15 |
| 1 | Sticky Paddle | 18 |
| 2 | Momentum | 35 |
| 2 | Bombardier | 40 |
| 2 | Boss Slayer | 45 |
| 3 | Laser Focus | 65 |
| 3 | Overcharge | 65 |
| 3 | Hot Streak | 75 |

- **Sparks:** +1 por onda concluída, +3 por chefe derrotado e +5 na primeira
  conclusão de uma fase; teto de **30 por run**. No Endless: +1 por onda
  alcançada e +3 a cada 5 ondas, também com teto 30.
- **Sem bônus permanentes de atributos:** o meta desbloqueia perks; não há
  “+10% de dano para sempre”.
- **Sem ads, loot box ou compra de vantagem:** Sparks vêm apenas de jogar.
- **Ofertas filtradas:** o level-up só oferece perks iniciais ou já compradas.
  Perks bloqueadas continuam fora da pool; o fallback `Arcane Insight` segue
  como válvula.

### 2.3 Workshop

- Strip **Workshop** no menu, com saldo de Sparks e badge quando há algo
  comprável.
- Diálogo com cards por tier, estado `owned`/`affordable`/`locked`, custo,
  descrição, saldo insuficiente e feedback de compra.
- Compra determinística: debita Sparks, grava o unlock, persiste no save e
  emite `meta:changed`; o menu e o diálogo atualizam sem recarregar.
- Results mostram **“+X Sparks · total Y”**.
- Acessível por teclado, com foco preso no diálogo e fechamento por Escape.

### 2.4 Save v2

```text
SaveV2 {
  version: 2
  unlockedPhase: 0..6
  phases: Record<string, PhaseStats>
  endless: { bestWave, bestScore, runs }
  campaignComplete: boolean
  meta: {
    sparks: number
    unlocks: string[]
  }
  updatedAt: number
}
```

- Saves v1 abrem e migram para v2 com `sparks = 0` e `unlocks = []`, preservando
  `unlockedPhase`, `phases`, `endless` e `campaignComplete`.
- As 10 perks iniciais são implícitas; o save grava apenas as compradas.
- Save corrompido ou versão desconhecida cai em default seguro.
- Continua sem salvar a run ativa.

---

## 3. Arquitetura

### 3.1 Módulos novos ou alterados

| Área | Arquivos | Responsabilidade |
|---|---|---|
| Conteúdo meta | `src/content/meta.ts` | `STARTER_PERK_IDS`, `META_UNLOCKS`, custos/tiers e helpers de unlock |
| Progressão meta | `src/progression/meta.ts` | compra pura, sanitização, cálculo de Sparks e `MetaState` |
| Save | `src/progression/Save.ts` | `SaveV2`, migração v1→v2, persistência de `meta` |
| Ofertas | `src/progression/RunState.ts`, `src/progression/offers.ts` | pool filtrada pelas perks desbloqueadas |
| UI | `src/ui/WorkshopDialog.ts`, `src/ui/Menu.ts`, `src/ui/Overlay.ts`, `src/styles/workshop.css` | strip, diálogo, results e saldo |
| Orquestração | `src/game/Game.ts`, `src/game/contracts.ts` | `getMetaState`, `purchasePerkUnlock`, acúmulo/persistência de Sparks, `meta:changed` |
| i18n | `src/i18n/en.ts` | strings do Workshop e dos results |

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
`levelup:offered`, `ad:state`, `save:reset` e `meta:changed`.

### 3.3 Fluxos do meta

- **Fim de fase/Endless:** `finishPhase`/`finishEndless` calculam Sparks,
  atualizam `save.meta`, persistem e preenchem `PhaseResult.sparksEarned` e
  `sparksTotal`.
- **Workshop:** `UIRoot` abre o diálogo; `WorkshopDialog.open` lê
  `getMetaState()`; a compra chama `purchasePerkUnlock(id)`; em sucesso o jogo
  persiste o save e emite `meta:changed`.
- **Ofertas:** `RunState` recebe os IDs desbloqueados no início da run e nunca
  oferece uma perk bloqueada.
- **Debug:** `?debug=1` adiciona **Add Sparks +20**, exclusivo de QA.

---

## 4. Invariantes

1. **Plataforma:** nenhum `if (platform === ...)` no gameplay; tudo via
   `PlatformService`.
2. **Storage:** nenhum `localStorage` direto; sempre via `StorageService`.
3. **Simulação:** passo fixo de 120 Hz; colisão circular/AABB com swept
   collision e micro-passos.
4. **Save:** schema v2; `unlockedPhase` 0..6; `meta` sanitizado; v1 migra sem
   perder progresso; a run ativa não é salva.
5. **Meta:** desbloqueia conteúdo, não atributos permanentes; compras são
   determinísticas e não há refund nesta versão.
6. **Perks iniciais:** as 10 starters são implícitas e não precisam estar em
   `meta.unlocks`.
7. **Ofertas:** nunca incluem perk bloqueada; fallback só quando faltam opções.
8. **Sparks:** teto de 30 por run; sem ads, loot box ou compra de vantagem.
9. **Laser:** exige lançamento explícito na onda e ao menos uma bola solta;
   `noLaser` bloqueia a onda inteira.
10. **Tutorial:** coach marks pausam o jogo; só **Got it** ou **Skip tutorial**
    saem do modal.
11. **Ads:** tutorial sem ads; campanha só com próxima onda e múltiplo de 3;
    Endless a cada 4; exits com cooldown de 60 s; rewarded revive 1×/run.
12. **Debug:** `?debug=1` é só QA; nunca divulgar URL com debug.
13. **Nome:** jogo e loja **Bricklike**; slug técnico `blockbreaker`.
14. **Workshop:** a UI não inventa estado; lê `GameCommands`/`HudSnapshot`.

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

Resultados de referência da 0.6.0 (2026-11-12):

| Gate | Resultado |
|---|---|
| `npm run typecheck` | ✅ sem erros |
| `npm test` | ✅ **375 testes** em **31 arquivos** |
| `npm run validate:content` | ✅ **7 níveis, 22 ondas, 743 blocos, 1.809 XP** |
| Bridge config | ✅ schema 2.4.1, sem logo/analytics, sem URLs externas |
| `npm run build` | ✅ bundle Phaser/Vite |
| `npm run test:e2e` | ✅ **36 testes** em **10 spec files** |
| `npm run package` | ✅ ZIP 0.6.0, **20 arquivos**, **1.513.834 bytes**, SHA-256 `1fed8ff154821c209713b64635ab5660845994b6ec1146efdc1a71bab83bcedd` |

### 5.1 Manifesto do ZIP

- 20 arquivos; 1.513.834 bytes comprimidos; 3.055.341 bytes descomprimidos.
- Raiz: `index.html`, `playgama-bridge-config.json`, `playgama-bridge.js`,
  `favicon.svg`.
- `assets/`: `Game-TLcMbiI_.js`, `index-REZljkjI.js`, `index-C63t2-_X.css`,
  `Silkscreen-Bold-BHMh3gvp.ttf`, `Silkscreen-Regular-W9-u5Upq.ttf`,
  `.gitkeep`.
- `bad-decision-games/`: `logo.png`, `logo.webp`.
- `how-to-play/`: 5 screenshots (`boss`, `endless`, `level-up`, `move-launch`,
  `specials`).
- `licenses/`: Phaser, Playgama Bridge e Silkscreen OFL.
- Maior caminho: 38 caracteres; nenhum path absoluto ou URL externa no jogo.

Cobertura E2E: boot/menu, controles, pause, settings, How to Play/About,
level-up, vitória/unlock, Endless bloqueado/desbloqueado, AdMock
`show`/`fail`, rewarded revive/recusa, ads de pause/results, relógio pausado,
side art desktop, CDN bloqueado, layout 320/390/430/1440 + landscape,
chefe/desafio, Multiball, tutorial e Workshop (abrir, comprar, persistir após
reload e results com Sparks).

`npm run qa:runs` continua sendo um baseline automatizado da fase 1, não um
playtest humano da 0.6.0.

---

## 6. Portais e publicação

| Portal | Versão | Status | Observação |
|---|---|---|---|
| itch.io | **0.5.1** | **publicado** | a 0.6.0 é local; atualização manual futura |
| Playgama | **0.5.1** | **sandbox** | milestones pendentes; a 0.6.0 não foi enviada |
| CrazyGames Basic | 0.5.1 | **pausado** | submissão pausada/bloqueada até **2026-11-26** |
| GameFlare | 0.5.1 (não publicada) | **bloqueado** | conta sem acesso; suporte sem resposta |

- **0.6.0 é local e não publicada.** Não há upload, tag ou GitHub Release.
- **0.5.1 continua sendo a versão publicada** no itch.io e no sandbox da
  Playgama.
- **CrazyGames:** a 0.3.0 e a 0.4.0 foram reprovadas; a 0.5.1 foi submetida em
  2026-11-11. A conta/portal está **pausado até 2026-11-26**; não reenviar antes
  dessa data.
- **GameFlare:** conta criada, acesso bloqueado; não criar conta duplicada.
- O GitHub Pages acompanha a `main` e já serve a 0.6.0; CI e Deploy ficaram
  verdes no commit `59103a4` (CI 43291233343; Deploy 43291233520).
- **Assets de loja:** continuam os da 0.5.1. Revisão humana e eventual
  regeneração para a 0.6.0 seguem pendentes antes de qualquer upload.

---

## 7. Como testar Sparks e Workshop

1. Abra `?debug=1` e use **Add Sparks +20** no painel de debug.
2. Abra **Workshop** no menu: confira tiers, custos, saldo e badge.
3. Compre uma perk Tier 1 (por exemplo, Second Chance, 12 Sparks): o saldo cai,
   o card vira **Owned** e a compra persiste após reload.
4. Jogue uma fase ou uma run Endless até o fim: os results mostram
   `+X Sparks · total Y`.
5. Em uma run nova, force level-ups e confirme que a perk comprada pode
   aparecer, enquanto as ainda bloqueadas não aparecem.
6. Para migração, carregue um save v1 antigo: o jogo deve abrir com
   `sparks = 0`, `unlocks = []` e o progresso de campanha intacto.
7. Em `?debug=1&adMock=...`, confirme que ads e rewarded revive continuam
   funcionando sem alterar o meta.

---

## 8. Riscos e pendências

| Área | Estado | Risco / ação |
|---|---|---|
| Teste humano da 0.6.0 | pendente | validar Workshop, economia, reworks e save v1→v2 no navegador |
| Economia de Sparks | implementada e testada | calibrar tempo até o primeiro unlock e o teto de 30 com playtest |
| Balance das perks reworkadas | testes verdes | Momentum/Bombardier/Boss Slayer/Hot Streak ainda precisam de sensação humana |
| Save v2 | migração coberta por testes | testar save real antigo no navegador antes de publicar |
| Workshop | E2E e layout 320/390 verdes | validar em iframe de portal e em desktop |
| CrazyGames | pausado até 2026-11-26 | não reenviar; retomar só depois da data e de teste humano |
| GameFlare | bloqueado | follow-up único no suporte; não criar conta duplicada |
| Assets de loja | da 0.5.1 | regenerar/revisar se a 0.6.0 for publicada |
| Distribuição | 0.5.1 publicada; 0.6.0 local | nenhum portal recebeu a 0.6.0 |
| Tag/Release | nenhuma | só criar depois de aprovação humana explícita |
| P0/P1 | nenhum conhecido nos gates | reportar imediatamente se aparecer em teste manual |

---

## 9. Próximos passos

1. **Teste manual da 0.6.0** em build da `main`: Workshop, compra, reload,
   results com Sparks, migração de save v1 e as quatro perks reworkadas.
2. **Playtest de economia:** medir Sparks por run, tempo até o primeiro unlock
   e se o teto de 30 está adequado.
3. **Validar o save v1→v2** em um navegador real, com save de campanha e
   Endless já preenchido.
4. **Revisar assets de loja** antes de qualquer publicação da 0.6.0; os atuais
   são da 0.5.1.
5. **Push da `main`** e conferência de CI/Pages, se o coordenador aprovar.
6. **CrazyGames:** aguardar 2026-11-26 e só então decidir o reenvio.
7. **GameFlare:** follow-up único no suporte; não criar conta duplicada.
8. **Publicação da 0.6.0:** manual, somente após teste humano e aprovação.
9. **Tag/release:** somente após aprovação humana explícita; nenhuma foi criada.
10. **Próximo ciclo:** decidir entre conteúdo (novo mundo/Tier 4), retenção
    (cosméticos/desafios/reroll) ou plataforma (localização/landscape).

---

## 10. Referências

### Essenciais

- [`docs/GDD_Bricklike.md`](GDD_Bricklike.md) — fonte de design v1.7.
- [`docs/gdd-gap-analysis.md`](gdd-gap-analysis.md) — implementado × pendente.
- [`docs/perks-e-metaprogressao.md`](perks-e-metaprogressao.md) — desenho do
  catálogo e da metaprogressão.
- [`docs/plano-v0.6.0-metaprogressao.md`](plano-v0.6.0-metaprogressao.md) —
  plano por fases e critérios de aceite.
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

- [`docs/handoff-v0.5.1.md`](handoff-v0.5.1.md) — onboarding da build publicada.
- `docs/handoff-v0.4.0.md` — onboarding da 0.4.0.
- `docs/old/handoffs/` — handoffs anteriores.
- `docs/old/plans/` — planos MVP, v0.2.0, Endless e revisão visual v0.4.0.
- `docs/old/qa/` — relatórios M6, device matrix, performance e run-log.
- `docs/old/release/` — G7 e validação técnica do MVP.

### Código

- `src/game/Game.ts` — fluxo de jogo, Sparks, compra, ads e revive.
- `src/game/contracts.ts` — contratos de save v2, meta, UI, ads e plataforma.
- `src/content/meta.ts` — starters, tiers, custos e helpers de unlock.
- `src/progression/meta.ts` — compra, sanitização, Sparks e `MetaState`.
- `src/progression/Save.ts` — save v2, migração v1→v2 e persistência.
- `src/progression/RunState.ts` — pool de perks e ofertas filtradas.
- `src/ui/WorkshopDialog.ts` — diálogo de compra e foco.
- `src/ui/Menu.ts` — strip do Workshop, Sparks e badge.
- `src/ui/Overlay.ts` — results com Sparks.
- `src/sim/World.ts` — efeitos de Momentum, Bombardier, Boss Slayer e Hot
  Streak.
- `src/content/perks.ts` — catálogo fixo de 19 perks.
