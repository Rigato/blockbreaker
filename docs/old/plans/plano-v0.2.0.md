# Plano de implementação — Bricklike v0.2.0

**Data:** 2026-11-08  
**Versão-alvo:** `0.2.0`  
**Base:** `0.1.0-mvp` (commit `a8b750b`)  
**Objetivo:** expandir o MVP publicado em itch.io sem quebrar o build `0.1.0-mvp`.

---

## 0. Resumo executivo

A v0.2.0 transforma o MVP de 3 fases × 3 ondas em uma campanha de **6 fases e 21 ondas**,
com **9 tipos de bloco**, **7 elementos de fase**, **3 chefes**, **desafios por onda**,
**zoom dinâmico do campo**, **19 perks** e **encerramentos variados**.

O build `0.1.0-mvp` fica congelado para os portais. Todo o trabalho acontece em
`feat/v0.2.0`, e o GitHub Pages continua servindo o build de review.

### Decisões principais

| Tema | Decisão |
|---|---|
| Campanha | 6 fases; ondas por fase: 3, 3, 3, 3, 4, 5 |
| Fases novas | 4 = Frostbound Spire (3 ondas), 5 = Emberforge (4), 6 = Void Threshold (5) |
| Blocos | 3 atuais + 6 especiais (explosivo, regenerativo, móvel, multiplicador, gerador, ligado) |
| Elementos | parede, obstáculo, defletor, portal, mecanismo móvel, rotor, portal temporizado |
| Chefes | 1 por fase nova, na última onda de cada fase |
| Desafios | limite de tempo e “sem laser” em ondas selecionadas |
| Zoom | escala dinâmica do campo (0,68–1,0), não zoom de câmera |
| Perks | 11 atuais + 8 novos = 19, com níveis e sinergias |
| Save | schema v1 mantido; `unlockedPhase` passa a 1..6 |
| Idioma | inglês na UI; documentação em português |

### Fora de escopo nesta versão

- Metaprogressão permanente, rewarded ads, leaderboards e conquistas.
- Localização, landscape jogável e Full Launch.
- Editor de fases.
- Backend, contas e cloud save.

---

## 1. Correção obrigatória: Prism Laser e Sticky Paddle

**Problema:** no início da onda (ou após uma onda limpa), a bola começa presa ao
paddle, mas `World.fireLaser()` permite disparar o Prism. O mesmo vale para uma
bola presa pelo Sticky Paddle.

**Regra nova:** o laser só pode ser disparado se **pelo menos uma bola estiver
desgrudada** do paddle (`!ball.stuck`).

Implementação:

- `World.laserReady` inclui `this.balls.some((ball) => !ball.stuck)`.
- `World.fireLaser()` retorna `false` se não houver bola desgrudada.
- `HudSnapshot.laser.ready` reflete a regra; o botão contextual fica desabilitado.
- Sticky: enquanto a única bola estiver presa (sticky ou inicial), o laser não dispara.
- Testes:
  - bola inicial presa → `fireLaser()` falso e cooldown intacto;
  - bola sticky presa → falso;
  - após lançar → verdadeiro;
  - duas bolas, uma presa e outra solta → verdadeiro.

---

## 2. Modelo de conteúdo v2

### 2.1 Blocos

`src/sim/blocks.ts` passa a ter 9 tipos. O campo `behavior` dirige a simulação e
o renderer; `hp`, `score` e `color` continuam sendo a fonte de verdade.

| id | char | HP | Score | Behavior |
|---|---|---:|---:|---|
| `crystal` | `1` | 1 | 10 | `none` |
| `stone` | `2` | 2 | 20 | `none` |
| `obsidian` | `3` | 3 | 30 | `none` |
| `explosive` | `e` | 2 | 25 | `explosive` |
| `regenerative` | `r` | 3 | 30 | `regenerative` |
| `moving` | `m` | 2 | 20 | `moving` |
| `multiplier` | `x` | 1 | 30 | `multiplier` |
| `generator` | `g` | 3 | 40 | `generator` |
| `linked` | `l` | 2 | 20 | `linked` |

Comportamentos:

- **Explosivo:** ao ser destruído, causa 2 de dano em todos os blocos a até 1
  célula (inclui diagonais). Não dispara em cadeia infinita: profundidade máxima 3.
- **Regenerativo:** a cada 3,5 s, recupera 1 HP até o máximo, se estiver danificado.
  O timer reinicia ao levar dano.
- **Móvel:** oscila horizontalmente ±0,22 célula, período de 2,4 s. A posição é
  atualizada no passo fixo e a colisão usa o AABB atual.
- **Multiplicador:** ao ser destruído, ativa `xpFactor = 2` e `scoreFactor = 2`
  por 6 s. O estado aparece no HUD e expira com evento próprio.
- **Gerador:** a cada 5 s, cria um bloco `crystal` em uma célula vazia adjacente
  (até 3 gerações). Para de gerar quando destruído.
- **Ligado:** blocos `linked` conectados ortogonalmente formam um grupo. Dano em
  um membro propaga 1 de dano aos demais membros do grupo (guarda de recursão).

### 2.2 Elementos de fase

`src/content/types.ts` define uma união discriminada `LevelElement`. Todos usam
coordenadas de célula e o mesmo `fieldScale` dos blocos.

| kind | Comportamento | Campos |
|---|---|---|
| `wall` | parede indestrutível, AABB | `col`, `row`, `widthCells`, `heightCells` |
| `obstacle` | obstáculo indestrutível, arte diferente | idem |
| `deflector` | segmento diagonal que reflete a bola | `angleDeg` |
| `portal` | par de portais; teleporta preservando velocidade | `pairId` |
| `mover` | AABB oscilante horizontal/vertical | `axis`, `rangeCells`, `periodMs`, `phaseMs` |
| `rotor` | segmento(s) girando em torno do centro | `lengthCells`, `periodMs`, `phaseMs` |
| `gate` | parede que abre/fecha em ciclo | `closedMs`, `openMs`, `phaseMs` |

Regras:

- `wall` e `obstacle` colidem com bola, projéteis e laser.
- Laser e projéteis são bloqueados por `wall`/`obstacle`; portais não os afetam.
- `deflector` e `rotor` refletem a bola com a normal do segmento.
- `portal` tem cooldown de 300 ms por bola para evitar loop.
- `mover` e `gate` usam AABB; `gate` só colide quando fechado.
- `rotor` usa micro-passos de no máximo 8 px para não atravessar.

### 2.3 Chefes

`WaveDef.boss?: BossDef` define o chefe da onda. O chefe é uma entidade grande,
com HP, movimento horizontal e ataques periódicos.

| Fase | Chefe | HP | Padrão |
|---|---|---:|---|
| 4 | Frost Sentinel | 60 | move devagar; dispara 1 shard a cada 5 s |
| 5 | Ember Warden | 80 | move médio; dispara 2 shards a cada 4,5 s |
| 6 | Void Herald | 100 | move rápido; dispara 3 shards a cada 4 s; muda de padrão a 50% |

Regras:

- A onda só limpa quando todos os blocos e o chefe estiverem destruídos.
- Bola, laser, projétil, explosão e bomba causam dano ao chefe.
- Shards do chefe descem lentamente; ao acertar o paddle, aplicam **corrosão**:
  −6% de largura do paddle até o fim da onda, máximo 3 stacks.
- O chefe pisca, recua levemente e emite evento ao levar dano.
- A morte do chefe dispara explosão, áudio e o encerramento da fase.

### 2.4 Regras de onda / desafios

`WaveDef.rules?: readonly WaveRule[]`:

- `{ kind: 'timeLimit', ms }`: se o tempo chegar a zero antes de limpar, a run
  termina em derrota. O HUD mostra contagem regressiva.
- `{ kind: 'noLaser' }`: o laser fica desabilitado na onda; o botão mostra
  “Disabled” e o perk continua adquirido para ondas seguintes.

Distribuição inicial:

| Onda | Regra |
|---|---|
| `p4w2` | `timeLimit` 50 s |
| `p5w2` | `noLaser` |
| `p5w3` | `timeLimit` 60 s |
| `p6w2` | `timeLimit` 75 s |
| `p6w4` | `noLaser` |

### 2.5 Zoom dinâmico do campo

Não é zoom de câmera (isso quebraria o mapeamento de input). É uma **escala do
layout** de blocos, elementos e chefe, com o paddle e a bola no tamanho normal.

- `computeFieldScale(rows, columns, extraRows)` em `src/sim/layout.ts`.
- Altura de referência: 1280 unidades (mínimo do mundo).
- Escala = `clamp(available / rawHeight, 0.68, 1)`.
- Layout centralizado horizontalmente quando a escala é menor que 1.
- Aplicada no `loadWave`; não muda com resize.
- Exposta como `World.fieldScale` para debug e para o renderer.
- A validação de conteúdo usa a mesma função para calcular `gridBottom`.

---

## 3. Campanha v0.2.0

### 3.1 Fases

| # | Nome | Ondas | Velocidades | Tema | Novidade |
|---|---|---:|---|---|---|
| 1 | Crystal Grove | 3 | 572/616/660 | crystal | base |
| 2 | Ruined Halls | 3 | 616/660/704 | ruins | stone/obsidian |
| 3 | Arcane Depths | 3 | 638/682/726 | arcane | densidade |
| 4 | Frostbound Spire | 3 | 660/682/704 | frost | moving, wall, deflector, chefe |
| 5 | Emberforge | 4 | 682/704/726/748 | forge | explosive, portal, gate, multiplier, chefe |
| 6 | Void Threshold | 5 | 704/726/748/770/780 | void | linked, generator, rotor, mover, chefe final |

- A fase 6 termina com o Void Herald e um encerramento de campanha.
- A fase 6 inclui uma onda alta (12 linhas esparsas) para exercitar o zoom.
- A dificuldade (HP médio × densidade) nunca regride; o validador permite
  tolerância de 5%.

### 3.2 Encerramentos

`src/content/endings.ts` define epílogos por fase e por resultado:

- Vitória em fase normal: texto curto temático.
- Vitória em fase com chefe: epílogo do chefe + rank (`S`, `A`, `B`).
- Vitória na fase 6: encerramento de campanha + rank final.
- Derrota: texto de “a torre reclama a run”.

`PhaseResult.ending?: { id, title, body, rank } | null` é preenchido pelo jogo e
renderizado na tela de results.

---

## 4. Perks v0.2.0

Além dos 11 atuais, entram 8 perks. Todos usam o modelo repetível/único e níveis
individuais.

| id | Nome | Tipo | Max | Efeito |
|---|---|---|---:|---|
| `critical_strike` | Critical Strike | repetível | 3 | +8% de chance de crítico por nível; crítico causa dano ×2 |
| `laser_focus` | Laser Focus | repetível | 3 | +1 alvo de laser e +12% de largura do feixe por nível |
| `overcharge` | Overcharge | repetível | 3 | −12% de cooldown do laser por nível (mínimo 60%) |
| `combo_master` | Combo Master | repetível | 3 | +5% de score/XP por bloco consecutivo sem tocar no paddle; cap +15% |
| `second_chance` | Second Chance | único | 1 | revive uma vez por run com uma bola |
| `bomb_ball` | Bomb Ball | único | 1 | a cada 12 blocos destruídos, solta uma bomba no último bloco (raio 1, 2 de dano) |
| `boss_bane` | Boss Bane | repetível | 2 | +1 de dano contra chefes por nível |
| `swift_ball` | Swift Ball | repetível | 2 | +6% de velocidade da bola e +10% de score por nível |

Sinergias pretendidas:

- **Laser build:** Prism Laser + Laser Focus + Overcharge.
- **Dano:** Power Ball + Critical Strike + Boss Bane.
- **XP/score:** Quick Study + Combo Master + Swift Ball.
- **Defesa:** Safety Net + Second Chance.
- **Explosão:** Explosive Core + Bomb Ball + blocos explosivos.

`RunModifiers` ganha os campos:

```ts
critChance: number;
critMultiplier: number;
laserTargetBonus: number;
laserWidthMultiplier: number;
laserCooldownMultiplier: number;
comboStep: number;
comboMax: number;
reviveCharges: number;
bombEvery: number | null;
bossDamageBonus: number;
ballSpeedMultiplier: number;
scoreMultiplier: number;
```

---

## 5. Arquitetura e arquivos

### 5.1 Contratos

`src/content/types.ts`:

```ts
export interface WaveDef {
  id: string;
  name: string;
  rows: readonly string[];
  legend: Readonly<Record<string, BlockTypeId>>;
  ballSpeed: number;
  elements?: readonly LevelElement[];
  boss?: BossDef;
  rules?: readonly WaveRule[];
  intro?: string;
}
```

`src/sim/layout.ts`: `computeFieldScale`, constantes de layout.

`src/sim/World.ts`:

- blocos com `motion`, `regen`, `generator`, `linkGroup`;
- `elements: readonly RuntimeElement[]`;
- `boss: Boss | null`;
- `fieldScale`;
- `multiplierState`;
- `ruleState`;
- `combo`;
- `revive()` para o Second Chance;
- colisão de segmento, portal, mover, rotor, gate;
- laser bloqueado por elemento e pela regra `noLaser`.

### 5.2 Render

- `src/render/blockArt.ts`: 6 novas assinaturas visuais.
- `src/render/elementArt.ts`: paredes, obstáculos, defletores, portais, movers, rotores, gates.
- `src/render/bossArt.ts`: 3 chefes procedurais + shards.
- `src/render/GameScene.ts`: desenha elementos, chefe, shards, multiplicador e combo.

### 5.3 UI

- `HudSnapshot` ganha `boss`, `rule`, `multiplier`, `combo`, `waveIntro`.
- HUD: barra de chefe, chip de desafio, chip de multiplicador, combo, intro de onda.
- `PhaseSelect`: 6 cards, lista com scroll, badge de chefe.
- `Overlay`: seção de encerramento/rank, botão “Next level” só quando existe.
- `i18n/en.ts`: novas strings.
- `style.css`: boss bar, chips, ending, scroll.

### 5.4 Save

- `MAX_PHASE` passa de 3 para 6.
- Schema v1 mantido; saves antigos continuam válidos.
- Teste de migração: save com `unlockedPhase: 3` abre fases 1–3 e mantém 4–6 bloqueadas.

---

## 6. Milestones

### M8 — Fundação de simulação

- [x] Tipos de bloco e legenda v2.
- [x] `WaveDef` v2 com elementos, chefe, regras e intro.
- [x] `RunModifiers` v2 e `HudSnapshot` v2.
- [x] `computeFieldScale` e zoom de layout.
- [x] Blocos especiais no `World`.
- [x] Elementos e colisão no `World`.
- [x] Chefe e shards no `World`.
- [x] Correção do laser/Sticky.
- [x] Testes unitários de simulação.

**Gate:** `npm run typecheck` e `npm test` verdes (testes antigos atualizados).

### M9 — Conteúdo e temas

- [x] 3 fases novas com 3/4/5 ondas.
- [x] 3 temas novos (`frost`, `forge`, `void`).
- [x] Chefes nas últimas ondas das fases 4–6.
- [x] Regras de desafio nas ondas definidas.
- [x] Validador v2 (6 fases, ondas variáveis, elementos, chefes, escala).
- [x] `validate:content` verde.

**Gate:** todas as ondas carregam no `World` e podem ser limpas.

### M10 — Progressão e perks

- [x] 8 perks novos no catálogo.
- [x] `RunModifiers` derivados no `RunState`.
- [x] Ofertas continuam distintas e uniformes.
- [x] Second Chance integrado ao fluxo de derrota.
- [x] Testes de perks e ofertas.

**Gate:** `npm test` verde; debug panel lista os 19 perks.

### M11 — Apresentação e UX

- [x] Arte procedural dos 9 blocos.
- [x] Arte dos 7 elementos.
- [x] Arte dos 3 chefes + shards.
- [x] HUD com chefe, desafio, multiplicador, combo e intro.
- [x] Phase select com 6 cards e scroll.
- [x] Results com encerramento/rank.
- [x] Strings e CSS.

**Gate:** build visual em 390×844 sem overflow; reduced motion respeitado.

### M12 — Integração, QA e documentação

- [x] `Game.ts` integra tudo (blocos, elementos, chefe, regras, revive, endings).
- [x] Save com 6 fases.
- [x] E2E atualizado.
- [x] GDD atualizado para v1.1.
- [x] README e handoff atualizados.
- [x] `npm run package` com novo ZIP.

**Gate:** typecheck, test, validate:content, build, package, E2E.

### M13 — Release 0.2.0

- [ ] `package.json` em `0.2.0`.
- [ ] Notas de release.
- [ ] Tag `v0.2.0` somente após aprovação humana.

---

## 6.1 Status em 2026-11-08

**M8–M12 concluídos.** Validação observada:

| Gate técnico | Resultado |
|---|---|
| `npm run typecheck` | ✅ |
| `npm test` | ✅ 229 testes |
| `npm run validate:content` | ✅ 6 fases, 21 ondas, 759 blocos, 1.831 XP |
| `npm run build` | ✅ |
| `npm run package` | ✅ |
| `npm run test:e2e` | ✅ 16 testes |

- Conteúdo validado: ondas 3/3/3/3/4/5, 9 blocos, 7 elementos, 3 chefes.
- O build `0.1.0-mvp` do itch.io permanece congelado.
- **M13 continua pendente**: versão do `package.json`, notas de release e tag
  aguardam aprovação humana. Não há gate G8 definido neste plano.

---

## 7. Estratégia de subagentes

Modelo: `opencode-go/deepseek-v4.1-flash#low`.

Regras:

1. Cada subagente recebe **um escopo de arquivos** e não edita fora dele.
2. Subagentes não fazem merge, push, tag ou release.
3. O agente principal revisa, integra e corrige.
4. Trabalho em série quando o escopo compartilha arquivos; em paralelo quando
   os arquivos são disjuntos.
5. Cada tarefa termina com um relatório curto: arquivos alterados, comandos
   executados e pendências.

### Ordem de execução

```text
S1  Contratos e config (M8.1)
      ↓
S2  World/simulação (M8.2)
      ↓
S3  Conteúdo/temas (M9)          S4  Perks/progressão (M10)
      ↓                              ↓
S5  Render (M11.1)               S6  UI (M11.2)
      ↓                              ↓
S7  Integração Game/save/endings (M12)
      ↓
S8  Documentação (M12)
      ↓
S9  QA e correções
```

S3/S4 e S5/S6 podem rodar em paralelo porque têm arquivos disjuntos, desde que
S1/S2 já tenham congelado os contratos.

### Mapa de arquivos por subagente

| Subagente | Arquivos |
|---|---|
| S1 | `src/sim/blocks.ts`, `src/content/types.ts`, `src/content/blocks.ts`, `src/sim/testWaves.ts`, `src/sim/layout.ts`, `src/game/contracts.ts`, `src/game/config.ts` |
| S2 | `src/sim/World.ts`, `src/sim/collision.ts`, `tests/sim*.test.ts`, `tests/laserGate.test.ts`, `tests/zoom.test.ts` |
| S3 | `src/content/waves.ts`, `src/content/phases.ts`, `src/render/themes.ts`, `tests/content.test.ts`, `scripts/validate-content.ts` |
| S4 | `src/content/perks.ts`, `src/progression/RunState.ts`, `tests/progression.test.ts`, `tests/offers.test.ts` |
| S5 | `src/render/blockArt.ts`, `src/render/elementArt.ts`, `src/render/bossArt.ts`, `src/render/GameScene.ts`, `src/render/effects.ts`, `tests/render.test.ts` |
| S6 | `src/ui/Hud.ts`, `src/ui/PhaseSelect.ts`, `src/ui/Overlay.ts`, `src/ui/DebugPanel.ts`, `src/ui/UIRoot.ts`, `src/i18n/en.ts`, `src/style.css` |
| S7 | `src/game/Game.ts`, `src/progression/Save.ts`, `src/content/endings.ts`, `tests/save.test.ts`, `tests/e2e/*` |
| S8 | `docs/GDD_Bricklike.md`, `README.md`, `docs/handoff-proxima-fase.md` |

---

## 8. Critérios de aceite

### Funcionais

- [ ] 6 fases, 21 ondas, 3 chefes.
- [ ] Todos os 9 blocos aparecem em conteúdo e têm comportamento testado.
- [ ] Todos os 7 elementos aparecem em conteúdo e têm colisão testada.
- [ ] Prism Laser não dispara com a única bola presa (inicial ou sticky).
- [ ] Zoom reduz o campo em ondas altas, sem afetar o input.
- [ ] 19 perks elegíveis, com níveis e ofertas distintas.
- [ ] Fases 4–6 desbloqueiam em sequência.
- [ ] Results mostram encerramento/rank; fase 6 tem final de campanha.
- [ ] Save antigo continua válido.

### Técnicos

- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] `npm run validate:content`
- [ ] `node scripts/validate-bridge-config.mjs`
- [ ] `npm run build`
- [ ] `npm run package`
- [ ] `npm run test:e2e`
- [ ] Zero P0/P1.

### UX

- [ ] 320×568, 390×844, 430×932 e desktop sem scroll ou corte.
- [ ] HUD de chefe legível e não sobreposto.
- [ ] Pause/level up não conflitam com desafio de tempo.
- [ ] Reduced motion respeitado.
- [ ] Áudio de chefe/portal/gate sem estourar o budget.

---

## 9. Riscos

| Risco | Impacto | Mitigação |
|---|---|---|
| Simulação de elementos ficar instável | alto | micro-passos, testes de colisão, limites de velocidade |
| Conteúdo novo não ser limpável | alto | validador + simulação automática de clear |
| Chefe trivial ou injusto | médio | playtest e tuning por fase |
| Zoom quebrar input | alto | escala de layout, não câmera |
| UI de 6 fases estourar em 320 px | médio | lista com scroll e cards compactos |
| Save antigo quebrar | alto | schema v1 + teste de migração |
| 19 perks desbalancearem ofertas | médio | simulação de 20 mil runs + playtest |
| Subagentes conflitarem | médio | escopos disjuntos e integração pelo agente principal |

---

## 10. Definition of Done

- Plano aprovado e versionado.
- M8–M12 concluídos com gates verdes.
- GDD v1.1 atualizado com todos os sistemas e números.
- README atualizado com a campanha de 6 fases.
- ZIP `0.2.0` validado em subpasta.
- Nenhum P0/P1 aberto.
- Build `0.1.0-mvp` do itch.io intocado.
