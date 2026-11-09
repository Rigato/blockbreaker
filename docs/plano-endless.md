# Plano — Modo Endless (v0.3.0)

**Data:** 2026-11-09  
**Versão-alvo:** `0.3.0`  
**Base:** `main` em `8622c2a` (v0.2.0 + debug next wave)  
**Objetivo:** adicionar um modo de jogo separado, com uma única fase infinita e ondas progressivamente mais difíceis.

---

## 0. Resumo

O modo **Endless** é uma run única, sem vitória, com ondas geradas proceduralmente. A
dificuldade cresce em velocidade da bola, densidade, resistência, blocos especiais,
elementos de fase e chefes recorrentes. A velocidade da bola pode passar de **780**
(limite do modo Levels) e chega no máximo a **1100**.

O modo não altera a campanha de 6 fases. O menu ganha um botão **Endless**; o
resultado final mostra onda alcançada, melhor onda e score, com estatísticas
persistidas no save.

---

## 1. Regras do modo

| Item | Decisão |
|---|---|
| Estrutura | 1 run, 1 “fase” infinita; cada onda é gerada ao iniciar |
| Vitória | não existe; a run termina quando todas as bolas caem |
| Velocidade base | 660, +14 por onda, teto **1100** |
| Linhas do grid | começa em 4, +1 a cada 2 ondas, teto 12 |
| Densidade | cresce de ~55% para ~92% |
| Blocos | introdução gradual: moving (4), explosive (5), regenerative (7), multiplier (9), linked (11), generator (13) |
| Elementos | wall (2), deflector (4), portal (6), mover (8), gate (10), rotor (12); depois alternam |
| Chefes | a cada 5 ondas; HP e velocidade escalam; padrões sentinel/warden/void alternam |
| XP/perks | mesma curva do modo Levels; a run mantém perks entre ondas |
| Revive | Second Chance continua valendo uma vez por run |
| Resultado | derrota; mostra Wave alcançada, Best wave, score, level e perks |
| Save | `bb.save` ganha `endless: { bestWave, bestScore, runs }`; schema v1 compatível |
| Ads | mesmo interstitial na saída dos results (Retry/Menu) |
| Plataforma | `level_started` no início; `level_failed` no fim, com `world: "endless"` |

---

## 2. Geração de ondas

Novo módulo `src/content/endless.ts`:

```ts
export const ENDLESS_PHASE: PhaseDef;
export const ENDLESS_BASE_SPEED = 660;
export const ENDLESS_SPEED_STEP = 14;
export const ENDLESS_MAX_SPEED = 1100;
export const ENDLESS_MAX_ROWS = 12;

export function endlessBallSpeed(wave: number): number;
export function endlessBoss(wave: number): BossDef | null;
export function endlessWave(wave: number, seed: number): WaveDef;
export function endlessEnding(wave: number, score: number): EndingSummary;
```

### 2.1 Algoritmo

- 8 colunas fixas, `CONTENT_LEGEND` compartilhado.
- `rows = min(12, 4 + floor((wave - 1) / 2))`.
- Ondas 1–3 usam templates fixos e legíveis (adaptados de `p1w1`–`p1w3`).
- Ondas 4+ usam RNG determinístico (`createRng(seed ^ wave)`):
  - densidade = `min(0.92, 0.55 + wave * 0.015)`;
  - cada célula recebe bloco ou `.`;
  - a última linha é reservada para elementos quando a onda tem elemento;
  - ondas com chefe reservam as duas primeiras linhas para o chefe.
- Tipos:
  - base: crystal/stone/obsidian conforme a onda;
  - especiais entram nos thresholds acima e ocupam ~6–12% das células.
- Elementos:
  - um conjunto por onda, em `row = rows - 1`, sem sobrepor blocos;
  - ids únicos `endless-w<wave>-<kind>`;
  - portais em pares.
- Chefe:
  - onda `wave % 5 === 0`;
  - `hp = 40 + wave * 6`;
  - `attackMs = max(2200, 5000 - floor(wave / 5) * 300)`;
  - `moveSpeed = 90 + floor(wave / 5) * 15`;
  - `widthCells` 3 (sentinel/void) ou 4 (warden), `heightCells` 2, `row` 0.
- Nome da onda: `Wave N` ou o nome do chefe.
- `intro`: “Endless mode: survive as long as you can.” na onda 1; chefe tem intro própria.

### 2.2 Progressão esperada

| Onda | Velocidade | Linhas | Chefe |
|---:|---:|---:|---|
| 1 | 660 | 4 | — |
| 5 | 716 | 6 | Frost Sentinel |
| 10 | 786 | 8 | Ember Warden |
| 15 | 856 | 11 | Void Herald |
| 20 | 926 | 12 | Frost Sentinel |
| 30 | 1066 | 12 | Void Herald |
| 32+ | 1100 | 12 | ciclo |

A velocidade **passa de 780 na onda 10** e satura em 1100 na onda 32.

---

## 3. Arquitetura

### 3.1 Contratos e save

`src/game/contracts.ts`:

- `EndlessStats { bestWave, bestScore, runs }`.
- `SaveV1.endless: EndlessStats`.
- `PhaseResult` ganha `endless?: boolean; waveReached?: number; bestWave?: number`.
- `HudSnapshot` ganha `endless?: boolean; endlessBestWave?: number; endlessBestScore?: number`.
- `GameCommands.startEndless(): void`.
- `GameCommands.getEndlessStats(): EndlessStats`.

`src/progression/Save.ts`:

- `createDefaultSave` inclui `endless`.
- `parseSave` sanitiza `endless` (save antigo → zeros).
- `getEndlessStats(save)`.
- `applyEndlessResult(save, wave, score, now)` atualiza bestWave/bestScore/runs e `updatedAt`.

### 3.2 Game

`src/game/Game.ts` ganha:

```ts
private mode: 'campaign' | 'endless' = 'campaign';
private currentWaveDef: WaveDef | null = null;
```

- `startEndless()`: run nova, `ENDLESS_PHASE`, onda 1, seed, reset de timers, `level_started`.
- `loadEndlessWave(n)`: gera `endlessWave(n, seed)`, carrega no `World`, aplica mods, safety, intro.
- `nextWave()`: em endless incrementa e gera; em campanha mantém o fluxo atual.
- `finishWave()`: em endless agenda a próxima onda; em campanha mantém vitória de fase.
- `finishEndless()`: grava stats, monta `PhaseResult` (`endless: true`, `waveReached`, `bestWave`), toca defeat, envia `level_failed`.
- `restartPhase()`/`restartWave()`: endless recomeça a run/onda.
- `tryRevive()` continua funcionando.
- `buildHud()`: `endless`, `waveCount: 0`, `waveIndex` = onda atual, `phaseName: 'Endless'`, best stats.
- `debugNextWave()` continua avançando ondas no endless.
- `debugVictory()` no endless encerra a run como derrota (QA).

### 3.3 UI

- `Menu`: botão **Endless** (`#endless-button`) e best wave opcional.
- `UIRoot`: handler `startEndless`.
- `Hud`: quando `snapshot.endless`, mostra `Endless · Wave N` (sem denominador).
- `Overlay`: results endless mostra `Endless · Wave N`, “Best wave: N”, sem Next; kicker “Endless run”.
- `i18n`: `endless`, `endlessBest`, `resultEndless`, `overlayBestWave`.
- `style.css`: botão/nota no menu, linha de best wave.

### 3.4 Tema

Reutilizar o tema `phase-6` (Void Threshold) para o canvas do Endless, via
`scene.setPhase('phase-6', 5)`. A UI identifica o modo como “Endless”.

---

## 4. Milestones e subagentes

### E1 — Contratos, save e estatísticas (S1) — ✅ concluído

Status: concluído em 2026-11-09.

Arquivos: `src/game/contracts.ts`, `src/progression/Save.ts`, `tests/save.test.ts`.

- Tipos, defaults, parse, `getEndlessStats`, `applyEndlessResult`.
- Testes de save antigo, merge e best wave/score.

### E2 — Gerador endless (S2) — ✅ concluído

Status: concluído em 2026-11-09.

Arquivos: `src/content/endless.ts`, `tests/endless.test.ts`.

- `ENDLESS_PHASE`, velocidades, chefes, gerador, ending.
- Testes: determinismo, progressão de velocidade, linhas, tipos, elementos, chefes, clearability no `World`.
- Gate: `npm test` e `npm run typecheck`.

### E3 — Integração no Game + E2E (S3) — ✅ concluído

Status: concluído em 2026-11-09.

Arquivos: `src/game/Game.ts`, `tests/e2e/endless.spec.ts`, `tests/e2e/helpers.ts` (se necessário).

- `startEndless`, modo, ondas, results, save, restart, revive, debug next wave.
- E2E: menu → Endless → wave 1 → next wave 2× → force defeat → results e save.
- Gate: typecheck, testes, build, E2E.

### E4 — UI e apresentação (S4) — ✅ concluído

Status: concluído em 2026-11-09.

Arquivos: `src/ui/Menu.ts`, `src/ui/UIRoot.ts`, `src/ui/Hud.ts`, `src/ui/Overlay.ts`, `src/i18n/en.ts`, `src/style.css`.

- Botão Endless, HUD, results, best wave, strings, CSS responsivo.
- Gate: build, layout 320/390/430, E2E.

### E5 — Docs e release (S5 + principal) — ✅ concluído

Arquivos: `docs/GDD_Bricklike.md`, `README.md`, `docs/handoff-proxima-fase.md`, `docs/plano-endless.md`, `package.json`.

- Documentação do modo, regras, save e limites.
- Bump `0.3.0`, build e package.
- Todos os gates locais executados.

### Status em 2026-11-09

| Gate local | Resultado |
|---|---|
| `npm run typecheck` | ✅ |
| `npm test` | ✅ 252 testes |
| `npm run validate:content` | ✅ campanha intacta |
| `npm run build` | ✅ |
| `npm run package` | ✅ ZIP `0.3.0` |
| `npm run test:e2e` | ✅ 18 testes (Endless, campanha, smoke e layout) |

E1–E5 concluídos. Não há gate G8; o release continua usando os gates definidos
neste plano. O modo está implementado em `main`; a publicação nos portais segue
manual.

---

## 5. Critérios de aceite

- [x] Menu com botão Endless funcional.
- [x] Run endless começa na onda 1 e avança indefinidamente.
- [x] Velocidade cresce e ultrapassa 780; teto 1100.
- [x] Linhas crescem até 12; blocos/elementos/chefes aparecem gradualmente.
- [x] Chefes a cada 5 ondas com HP escalando.
- [x] Derrota grava bestWave/bestScore/runs e mostra results.
- [x] Retry recomeça uma run endless; Menu volta ao menu.
- [x] Save antigo continua válido.
- [x] HUD mostra `Endless · Wave N` sem denominador.
- [x] 320 px sem overflow; E2E verdes.
- [x] GDD/README atualizados.
- [x] `npm run package` gera ZIP 0.3.0.

## 6. Fora de escopo

- Leaderboard global de endless.
- Metaprogressão ou upgrades permanentes entre runs.
- Editor de ondas.
- Dificuldade selecionável.
- Rewarded ads.

## 7. Riscos

| Risco | Mitigação |
|---|---|
| Ondas impossíveis por excesso de densidade | templates iniciais + validação no `World` + teste de clearability |
| Velocidade > 780 causar tunneling | simulação já usa swept collision; testar onda 30 |
| Grid de 12 linhas + elementos encostar no paddle | `computeFieldScale` e validação de layout |
| Save antigo quebrar | `endless` opcional com default no parse |
| UI de results confundir campanha com endless | campos `endless` explícitos e testes |
