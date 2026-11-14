# Plano de implementação — v0.6.0 Perks + Metaprogressão

**Base:** `docs/perks-e-metaprogressao.md`  
**Modelo dos subagentes:** `opencode-go/deepseek-v4.1-flash#max`  
**Estratégia:** fases pequenas, cada uma com gates verdes e commit próprio.

## 0. Resultado esperado

Ao final da v0.6.0:

- 10 perks iniciais e 9 perks atuais bloqueadas (12 com as 3 novas no Tier 4).
- 4 perks reworkadas: Momentum, Bombardier, Boss Slayer, Hot Streak.
- Sparks ganhos ao final de runs e persistidos no save v2.
- Workshop no menu para comprar unlocks de perks.
- Ofertas de level-up filtram perks bloqueadas.
- Save v1 migra para v2 sem perder progresso.
- Testes unitários, E2E, typecheck e build verdes.

## 1. Fases

### Fase A — Catálogo e reworks

**Objetivo:** trocar as 4 perks fracas/redundantes por versões com identidade,
sem meta ainda.

Arquivos principais:
- `src/content/perks.ts`
- `src/game/config.ts`
- `src/game/contracts.ts` (novos campos de `RunModifiers`, se necessário)
- `src/progression/RunState.ts`
- `src/sim/World.ts`
- `tests/progression.test.ts`, `tests/offers.test.ts`, `tests/sim.test.ts`

Entregas:
1. Renomear IDs:
   - `combo_master` → `momentum`
   - `bomb_ball` → `bombardier`
   - `boss_bane` → `boss_slayer`
   - `swift_ball` → `hot_streak`
2. Atualizar nomes/descrições em inglês.
3. Momentum:
   - modificadores de dano/XP por combo;
   - reset no toque do paddle (comportamento atual de combo).
4. Bombardier:
   - contador de 12 blocos;
   - arma a próxima batida;
   - explosão 3×3 no próximo hit;
   - consumir carga.
5. Boss Slayer:
   - contador de 10 blocos;
   - próximo hit no chefe +3 dano;
   - consumir carga.
6. Hot Streak:
   - após 5 hits de combo, +1/+2 dano por 3 s;
   - renovar em cada hit;
   - sem alterar velocidade permanentemente.
7. Testes específicos para cada rework.
8. Rodar `npm run typecheck`, `npm test`, `npm run build`.

**Não fazer nesta fase:** meta, save v2, UI, novas perks.

### Fase B — Save v2, Sparks e unlocks

**Objetivo:** persistir economia e filtrar perks por desbloqueio.

Arquivos principais:
- `src/game/contracts.ts`
- `src/progression/Save.ts`
- `src/progression/meta.ts` (novo)
- `src/progression/RunState.ts`
- `src/game/Game.ts`
- `src/game/config.ts`
- `tests/save.test.ts`, `tests/offers.test.ts`, `tests/meta.test.ts` (novo)

Entregas:
1. `MetaProgress { sparks, unlocks }`.
2. `SaveV2` com `version: 2` e `meta`.
3. `parseSave` aceita v1 e v2; v1 migra com `sparks=0`, `unlocks=[]`.
4. `createDefaultSave` v2.
5. `src/content/meta.ts`:
   - `STARTER_PERK_IDS` (10);
   - `META_UNLOCKS` (9 atuais + 3 novas planejadas com `enabled: false` se ainda
     não existirem no catálogo);
   - custos e tiers do desenho.
6. `src/progression/meta.ts`:
   - `isPerkUnlocked(meta, id)`;
   - `purchaseUnlock(meta, id)` puro, com erros `unknown|owned|insufficient`;
   - `sparksForCampaign({ waves, bosses, firstClear })`;
   - `sparksForEndless({ wave })`;
   - `sanitizeMeta`.
7. `RunState.startRun(seed, unlockedPerkIds?)`; default = todas (compatibilidade
   com testes). Ofertas filtram pelo conjunto.
8. Game:
   - passa unlocks para o RunState no início da run;
   - acumula Sparks na run;
   - grava Sparks no save ao final de fase/Endless;
   - expõe `getMetaState()` e `purchasePerkUnlock(id)`;
   - emite `meta:changed`;
   - adiciona `sparks` e `workshopReady` ao `HudSnapshot`.
9. Testes de migração, compra, saldo insuficiente, owned, filtragem de ofertas e
   persistência.

**Não fazer nesta fase:** UI do Workshop, CSS, E2E.

### Fase C — Workshop, menu e results

**Objetivo:** dar visibilidade e uso ao meta.

Arquivos principais:
- `src/ui/WorkshopDialog.ts` (novo)
- `src/ui/Menu.ts`
- `src/ui/UIRoot.ts`
- `src/ui/Overlay.ts`
- `src/ui/DebugPanel.ts` (se necessário)
- `src/i18n/en.ts`
- `src/style.css`
- `tests/e2e/*.spec.ts`

Entregas:
1. Strip/botão **Workshop** no menu com Sparks e badge de afford.
2. `WorkshopDialog`:
   - cards por tier;
   - estado locked/owned/affordable;
   - botão Buy;
   - feedback de erro;
   - fecha e volta ao menu.
3. Results: “Sparks +X” e total.
4. `UIRoot` integra o diálogo e fecha os outros overlays.
5. Strings em inglês.
6. CSS responsivo no shell portrait.
7. E2E:
   - abrir Workshop;
   - comprar com saldo (debug);
   - persistir após reload;
   - mostrar perk comprada como owned;
   - voltar ao menu.

### Fase D — Conteúdo futuro

- Overkill, Shield Bash, Conductor.
- Cosméticos.
- Desafios com recompensa.
- Reroll de oferta.
- Codex completo.
- Novo mundo como content sink.

Não implementar nesta rodada.

## 2. Interfaces propostas

```ts
export interface MetaProgress {
  sparks: number;
  unlocks: string[];
}

export interface MetaUnlockView {
  id: string;
  name: string;
  description: string;
  cost: number;
  tier: number;
  unlocked: boolean;
  affordable: boolean;
  available: boolean;
}

export interface MetaState {
  sparks: number;
  unlocks: readonly MetaUnlockView[];
}

export type MetaPurchaseError = 'unknown' | 'owned' | 'insufficient';

export interface MetaPurchaseResult {
  ok: boolean;
  error?: MetaPurchaseError;
  meta: MetaState;
}
```

`GameCommands` ganha:

```ts
getMetaState(): MetaState;
purchasePerkUnlock(id: string): MetaPurchaseResult;
```

`HudSnapshot` ganha (opcionais para compatibilidade):

```ts
sparks?: number;
workshopReady?: boolean;
```

`GameEventMap` ganha:

```ts
'meta:changed': MetaState;
```

## 3. Regras de implementação

- Não usar `localStorage` direto.
- Não adicionar dependências.
- Não alterar a simulação além do necessário para os reworks.
- Manter IDs novos apenas no catálogo; saves não guardam perks da run.
- Toda função de save/meta deve ser pura e testável.
- UI não inventa estado: recebe de `GameCommands`/`HudSnapshot`.
- Textos de UI em inglês; docs em português.
- Commits pequenos por fase.

## 4. Gates

```bash
npm run typecheck
npm test
npm run validate:content
node scripts/validate-bridge-config.mjs
npm run build
npm run package
npm run test:e2e
```

Referência atual: 329 testes/29 arquivos; 31 E2E/9 specs. Atualizar os números
no handoff/status ao final.

## 5. Critérios de aceite

### Fase A
- [ ] 4 perks renomeadas e funcionalmente distintas.
- [ ] Nenhum teste antigo referenciando IDs removidos.
- [ ] Momentum, Bombardier, Boss Slayer e Hot Streak têm testes próprios.
- [ ] Typecheck, testes e build verdes.

### Fase B
- [ ] Save v1 abre e migra para v2 sem perder progresso.
- [ ] Save v2 default tem `sparks=0`, `unlocks=[]`.
- [ ] Compra debita Sparks e persiste.
- [ ] Saldo insuficiente e owned não alteram o save.
- [ ] Ofertas nunca incluem perk bloqueada.
- [ ] Starter de 10 funciona; fallback só no fim de run longa.
- [ ] Sparks de campanha/Endless respeitam o teto de 30.
- [ ] Typecheck e testes verdes.

### Fase C
- [ ] Workshop abre pelo menu e mostra tiers/custos.
- [ ] Compra atualiza saldo, owned e badge.
- [ ] Reload preserva unlock.
- [ ] Results mostra Sparks ganhos.
- [ ] Layout 320/390 e desktop sem corte.
- [ ] E2E verde.

## 6. Riscos e mitigação

| Risco | Mitigação |
|---|---|
| Rework de Bombardier/Hot Streak mexer demais no World | implementar com flags e testes isolados; sem refatorar o combate |
| Save v2 quebrar testes antigos | manter parser tolerante e atualizar fixtures |
| UI do Workshop não caber em 167 px | cards empilhados, fonte mínima, scroll interno |
| Economia mal calibrada | custos do desenho + teto 30; medir e ajustar |
| Primeira run pobre | 10 starters + Foresight + Safety Net |
| Conflito entre subagentes | fases sequenciais; cada uma começa com worktree limpo |

## 7. Subagentes

| Agente | Fase | Escopo | Modelo |
|---|---|---|---|
| A | A | Catálogo + 4 reworks + testes | `opencode-go/deepseek-v4.1-flash#max` |
| B | B | Save v2 + Sparks + unlocks + Game | `opencode-go/deepseek-v4.1-flash#max` |
| C | C | Workshop + menu + results + E2E | `opencode-go/deepseek-v4.1-flash#max` |
| D | D | QA final, gates, correções e docs | `opencode-go/deepseek-v4.1-flash#max` |

Cada subagente deve:
1. Ler este plano e o desenho.
2. Trabalhar apenas na fase atribuída.
3. Rodar os gates da fase.
4. Não commitar sem o coordenador revisar.
5. Reportar arquivos alterados, testes e riscos.

## 8. Ordem de commits

1. `docs: add perk and metaprogression design`
2. `feat(perks): rework momentum, bombardier, boss slayer and hot streak`
3. `feat(meta): add sparks, save v2 and perk unlocks`
4. `feat(ui): add workshop and spark rewards`
5. `test: cover meta progression end to end`
6. `docs: update GDD, handoff and status for v0.6.0`

## 9. Fora de escopo

- Novo mundo.
- Cosméticos, desafios, reroll, codex completo.
- Leaderboards/conquistas.
- Alterações de ads ou portais.
- Publicação automática.
