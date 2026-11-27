# Handoff — Bricklike v0.7.1

> **Histórico:** substituído pelo [`handoff-v0.7.2.md`](handoff-v0.7.2.md)
> em 2026-11-26.

**Fonte de onboarding para a próxima sessão.**
**Data:** 2026-11-24
**Branch:** `main`
**Versão do package:** `0.7.1`
**Build:** local; **não publicada**, sem tag/release
**Base publicada:** `0.6.1` no itch.io e no sandbox da Playgama
**Repositório:** <https://github.com/Rigato/blockbreaker>
**Pasta local:** `/mnt/SSD-Secundario/Nextcloud/5-GameProjects/4-Blockbreaker-roguelite`

> Este documento substitui o `handoff-v0.7.0.md` como fonte atual; o anterior
> fica em [`old/handoffs/`](old/handoffs/). O GDD v1.13 e
> [`design/worlds-II-III-implementation.md`](design/worlds-II-III-implementation.md)
> são as fontes de design desta linha. O backlog completo para as mudanças
> profundas está na seção 9.

---

## 1. Snapshot

| Item | Valor |
|---|---|
| Branch | `main` |
| Versão local | `0.7.1` |
| Versão publicada | `0.6.1` (itch.io + Playgama sandbox) |
| Mundos | I · Crystal Vale; II · Neon Lattice; III · Rustwake |
| Campanha | 18 fases + tutorial; 69 ondas de campanha / 71 com tutorial |
| Tutorial | 2 ondas, 12 blocos, 15 XP, 1 level up, 2 coach marks, paddle 2× e ímã |
| Blocos | 17 tipos (9 originais + 8 novos) |
| Elementos | 10 tipos (7 originais + press, belt, rail) |
| Chefes | 9 (3 por mundo) |
| Perks | 22 (inalteradas nesta linha) |
| Save | v3; `unlockedPhase` 0..18 |
| Endless | continua abrindo no clear da fase 6 |
| Pierce | regra base, excedente ≥ 1, só bola |
| Publicação | **não publicada**; nenhuma tag/release |

---

## 2. O que mudou nesta linha

### 2.1 Arquitetura multi-mundo

- `src/content/worlds.ts` define `WORLDS` (w1/w2/w3), índices, nomes, acentos e
  tetos de velocidade.
- `PHASES` tem 19 entradas: tutorial + 18 fases. Cada fase tem `worldId` e
  `localIndex`.
- `CAMPAIGN_PHASE_COUNT` = 18; `MAX_PHASE` = 18.
- `PhaseSelectInfo` ganhou `worldId`, `worldName`, `worldNumeral`,
  `worldPhaseIndex`, `worldPhaseCount`, `isWorldFinal`, `worldUnlocked`,
  `worldCleared` e `waveNames`.
- Tema, rank e nó usam o índice local; `index` continua global.

### 2.2 Save v3

- `SaveV3` com `version: 3`; `parseSave` aceita v1, v2 e v3.
- v2→v3 é só bump de versão; v1 continua ganhando `meta` padrão.
- `campaignComplete` continua significando **Mundo I concluído** (fase 6) e
  libera o Endless.
- O clear dos Mundos II/III é derivado de `phases` por `phaseId`.
- `applyPhaseResult` abre a próxima fase; clear da fase 6 → 7; clear da 12 → 13.
- A run ativa não é salva.

### 2.3 Conteúdo

- Mundo II: 6 fases / 22 ondas; blocos `alloy`, `bastion`, `entangled`, `relay`,
  `phased`; elemento `rail`.
- Mundo III: 6 fases / 27 ondas; blocos `plated`, `fused`, `splitting`;
  elementos `press`, `belt`; regra `gust`; `noMultiball` em ondas selecionadas.
- Chefes: Nullframe Warden, Maglev Dreadnought, Lattice Hierophant, Boiler
  Matron, The Riveter e The Last Engine.
- Totais validados: **19 fases, 71 ondas, 2.781 blocos, 9.392 XP**.

### 2.4 Velocidade e física

- Overlap intencional entre mundos: Mundo I 616–780, Mundo II 640–896,
  Mundo III 700–920.
- Teto de autoria por mundo em `WORLDS.speedMax`; o validador usa esse teto.
- `GAME_CONFIG.ball.hardMaxSpeed = 1100` limita boosts em jogo (rails).
- `belt` gira o vetor preservando o módulo; `rail` acelera até o hard cap;
  `gust` normaliza para preservar a velocidade; `press` é AABB vertical com
  telegrafo.

### 2.5 Mapas

- `src/ui/map/types.ts` define `MapDef`.
- `WORLD1_MAP`, `WORLD2_MAP`, `WORLD3_MAP` compartilham viewBox 390×900, quatro
  camadas parallax e paleta própria.
- Header com pílulas I/II/III; em ≤430 px só os numerais.
- Tutorial e nó ∞ apenas no Mundo I; Mundos II/III têm portal decorativo.

### 2.6 Debug

- `main.ts` passa `options.debug` ao jogo.
- `?debug=1` desbloqueia todas as fases e mundos na seleção.
- O sheet do mapa mostra `Start wave` e inicia a fase na onda escolhida.
- `startPhase(phaseId, startWaveIndex)` é o caminho único; `debugStartWave`
  delega para ele.
- O painel de debug fica atrás do mapa para não interceptar as pílulas.

### 2.7 Economia

- Primeiro clear da fase final de cada mundo paga **+30 Sparks**.
- Fórmula por onda/combo/chefe/clear e teto de 250 por run permanecem.
- Tier 5/6 e consumíveis **não** foram implementados; ficam para o rework de
  perks/economia.

### 2.8 Tutorial simplificado e assistido (2026-11-23)

- `tutw1`: 4 blocos de 1 HP, quatro linhas abaixo do topo; destruir 3 (75%)
  enche a barra do tutorial e abre a primeira escolha de perk.
- `tutw2`: 5 blocos de 1 HP, 2 de 2 HP e 1 explosivo.
- `GAME_CONFIG.progression.tutorialFirstLevelXp = 3`; a curva normal (8/20/26)
  volta depois do level 2. `RunState.startRun` aceita `firstLevelXp`.
- Paddle do tutorial **2× mais largo** (`GAME_CONFIG.tutorial`).
- Quando resta um bloco, a bola é girada na direção dele a **3,5 rad/s** sem
  mudar a velocidade (`lastBlockMagnetTurnRate`); a UI desenha anel e tether.
  A regra vive em `RunModifiers`, pronta para virar perk.
- Coach marks reduzidos de 5 para 2 (mover/lançar e blocos especiais); o
  level-up overlay ensina a perk sem um coach mark extra. Chefes/Endless ficam
  no How to Play.
- Texto do tutorial em 15–17 px, **Continue** primário e **Skip tutorial** em
  contraste alto, ambos com 44 px de toque.
- Totais: 12 blocos, 15 XP, 1 level up; o validador permite 1 level up só no
  tutorial.

### 2.9 Feedback visual de dano (2026-11-23)

- Giant Ball passou de +15% para **+40% de raio por nível** (máx. 2, +80%).
- A bola usa uma rampa fixa por dano-base: branco (1) → amarelo (2) → laranja
  (3) → vermelho (4) → roxo (5+). Glow e rastro usam a mesma cor; buffs
  temporários não trocam a cor.
- `BALL_DAMAGE_COLORS` / `ballColorForDamage` ficam em `render/themes.ts`.

### 2.10 Pierce (2026-11-24)

- Regra base: hit **direto da bola** que destrói o bloco com **excedente ≥ 1**
  atravessa sem quicar; dano igual ou menor quica.
- Exemplos: 2×1 atravessa; 3×2 atravessa; 2×2 destrói e quica; 1×1 destrói e
  quica. Dano fracionário (Momentum) só atravessa com 1 inteiro de excedente.
- `World.handleBlockHit` retorna `pierced`; `moveBallAabb` pula reflexo e
  separação quando a bola passa. O sweep continua no mesmo passo.
- Só bola: laser, projétil, explosão, link e Shield Bash não perfuram; chefe e
  elementos também não. `phased` blindado continua bloqueando.
- Overkill continua usando o mesmo excesso para splash; os dois coexistem e
  ficam em observação.
- Feedback: evento `block:pierced`, SFX `pierce`, anel/partículas na cor do
  dano. Testes em `tests/pierce.test.ts` cobrem 2×1, 3×2, 2×2 e 1×1.

---

## 3. Arquitetura de arquivos

| Área | Arquivos |
|---|---|
| Mundos | `src/content/worlds.ts` |
| Fases | `src/content/phases.ts` |
| Ondas W2/W3 | `src/content/wavesWorld2.ts`, `src/content/wavesWorld3.ts` |
| Blocos | `src/sim/blocks.ts`, `src/content/blocks.ts`, `src/render/blockArt.ts` |
| Elementos | `src/content/types.ts`, `src/sim/World.ts`, `src/render/elementArt.ts` |
| Chefes | `src/content/types.ts`, `src/sim/World.ts`, `src/render/bossArt.ts` |
| Pierce | `src/sim/World.ts`, `src/render/GameScene.ts`, `src/audio/AudioService.ts` |
| Cor da bola | `src/render/themes.ts`, `src/render/GameScene.ts` |
| Tutorial | `src/content/waves.ts`, `src/game/Game.ts`, `src/ui/Hud.ts`, `src/style.css` |
| Progressão | `src/progression/xp.ts`, `RunState.ts`, `src/game/contracts.ts` |
| Save | `src/progression/Save.ts`, `src/game/contracts.ts` |
| Fluxo | `src/game/Game.ts` |
| Mapas | `src/ui/map/types.ts`, `world1.ts`, `world2.ts`, `world3.ts` |
| Seletor | `src/ui/PhaseSelect.ts`, `src/styles/phase-select.css` |
| Menu/HUD/Results | `src/ui/Menu.ts`, `src/ui/Hud.ts`, `src/ui/Overlay.ts` |
| Debug | `src/ui/DebugPanel.ts`, `src/ui/PhaseSelect.ts` |

---

## 4. Invariantes

1. **Plataforma:** nenhum `if (platform === ...)` no gameplay; tudo via
   `PlatformService`.
2. **Storage:** nenhum `localStorage` direto; sempre via `StorageService`.
3. **Simulação:** 120 Hz; colisão circular/AABB com swept collision.
4. **Save:** v3; `unlockedPhase` 0..18; v1/v2 migram; a run ativa não é salva.
5. **Mundos:** mundo é conteúdo (`worlds.ts`), não campo de save.
6. **Velocidade:** overlap entre mundos; teto de autoria por mundo; hard cap de
   1.100 para boosts em jogo.
7. **Física:** reflexões preservam o módulo; belt preserva o módulo; gust
   normaliza; rail pode subir até o hard cap.
8. **Pierce:** hit direto da bola com `dano − HP atual ≥ 1` atravessa; igual ou
   menor quica. Ferramentas, chefe e elementos não perfuram; `phased` blindado
   bloqueia.
9. **Plated:** dano de ferramenta −1 (mínimo 1); dano direto de bola é cheio.
10. **Phased:** armado ignora dano; exposto recebe dano normal.
11. **Relay:** enquanto houver relay vivo, gates/movers/rotors/presses funcionam;
    ao destruir o último, os elementos desligam na onda.
12. **Tutorial:** `tutorialFirstLevelXp = 3`; paddle 2×; ímã do último bloco;
    2 coach marks.
13. **Cores da bola:** dano-base 1–5+ → branco/amarelo/laranja/vermelho/roxo.
14. **Mapas:** um mapa por mundo; tutorial e ∞ só no Mundo I.
15. **Debug:** `?debug=1` desbloqueia tudo e permite escolher onda; nunca
    divulgar a URL com debug.
16. **Economia:** sem ads/loot box/compra de vantagem; +30 no primeiro clear de
    mundo; teto de 250 por run.
17. **Nome:** jogo e loja **Bricklike**; slug técnico `blockbreaker`.

---

## 5. Gates de referência (2026-11-24)

```bash
npm run typecheck
npm test
npm run validate:content
node scripts/validate-bridge-config.mjs
npm run build
npm run test:e2e
npm run package
```

| Gate | Resultado |
|---|---|
| `npm run typecheck` | ✅ |
| `npm test` | ✅ 428 testes / 35 arquivos |
| `npm run validate:content` | ✅ 19 fases / 71 ondas / 2.781 blocos / 9.392 XP |
| Bridge config | ✅ schema 2.4.1, sem URLs externas |
| `npm run build` | ✅ bundle Vite |
| `npm run test:e2e` | ✅ 43 testes / 12 spec files |
| `npm run package` | ✅ 20 arquivos; 1.542.118 bytes; SHA-256 `d54afb8584e450b9a2b5e5de06c010b1dcf1a3d4cc1c88e98a59e27918a534c6` |

> O E2E pode reutilizar a porta 4173 ocupada por outro projeto. Para isolar,
> rode o preview em 4174 e use uma config temporária com `baseURL` 4174.
> Nenhuma tag/release foi criada.

---

## 6. Como testar

1. Abra `?debug=1&resetSave=1`.
2. No menu, abra **Campaign**. As pílulas I/II/III devem estar todas ativas.
3. Com save novo, jogue o tutorial:
   - 4 blocos de 1 HP quatro linhas abaixo;
   - paddle 2×;
   - primeira perk após 3 blocos;
   - explosivo na onda 2;
   - deixe um bloco vivo para ver o anel/ímã;
   - skip visível e confortável em 320 px.
4. Troque para o Mundo II e III; confira 6 nós em cada mapa.
5. Selecione uma fase e escolha a onda inicial no seletor `Start wave`.
6. Teste:
   - `rail` no Mundo II: a bola acelera além da velocidade da onda.
   - `belt` no Mundo III: a direção muda, a velocidade não.
   - `gust`: a bola curva, a velocidade não.
   - `press`: a prensa desce e volta, sólida.
   - `phased`: a bola ricocheteia sem dano enquanto o anel estiver ativo.
   - `plated`: laser/torreta/explosão causam 1 a menos; bola causa dano cheio.
   - `relay`: destruir o último relay desliga os elementos.
   - pierce: com Power Ball, a bola atravessa blocos de 1 HP sem quicar;
     contra 2 HP com 2 de dano, destrói e quica.
   - cores: dano 2 amarelo, 3 laranja, 4 vermelho; roxo fica para 5+.
7. Chegue ao chefe de cada mundo e confira padrão/nome/HP.
8. Em save não-debug, confirme que II/III ficam selados até os clears 6/12.
9. Confira que o save existente v2 abre com `version: 3` e mantém progresso.

---

## 7. Riscos e pendências desta linha

| Área | Estado | Ação |
|---|---|---|
| Playtest humano | não feito | testar 69 ondas, 9 chefes, belt/rail/gust e platinas |
| Tutorial novo | 2 ondas / 15 XP / 1 perk / paddle 2× / ímã | medir tempo até a primeira perk, skip, leitura em 320 px e se o ímã resolve o último bloco |
| Pierce | regra base + FX/SFX | testar Power Ball 1–3, Overkill junto, multiball e ondas densas; medir TTK e legibilidade |
| Balance W2/W3 | validado por conteúdo | calibrar HP, XP e duração com playtest |
| Velocidade 896/920 | implementada | testar legibilidade em 320 px e hardware baixo |
| Hard cap 1.100 | implementado | validar rails em ondas densas e com multiball |
| Save v3 | testes verdes | testar save real v1/v2 no navegador |
| Mapas W2/W3 | E2E verde | validar arte/parallax em iframe de portal |
| Perks | 22 atuais | rework de perks é fluxo separado; proposta de 26 perks não implementada |
| Tier 5/6 e consumíveis | fora desta linha | dependem do rework de economia |
| Publicação | não feita | só após teste humano e aprovação explícita |
| Tag/release | nenhuma | só após aprovação explícita |
| Assets de loja | desatualizados | regenerar capas, screenshots e How to Play antes de publicar |

---

## 8. Próximos passos imediatos

1. Playtest do tutorial: tempo até a primeira perk, leitura, skip e 320 px.
2. Playtest do pierce: Power Ball 1–3, Overkill junto, multiball, ondas densas.
3. Playtest da v0.7.1: Mundo II inteiro, depois Mundo III.
4. Medir tempo de run, Sparks por mundo, TTK dos chefes e legibilidade a 320 px.
5. Validar belt/rail/gust em multiball e com `timeLimit`.
6. Testar migração real de save v1/v2→v3 no navegador.
7. Decidir a próxima frente estrutural (seção 9): densidade ou progressão.

---

## 9. Backlog e decisões para as mudanças profundas

Esta seção consolida tudo o que foi discutido e ainda não foi implementado.
Nada aqui deve começar sem uma decisão explícita do dono.

### 9.1 Tamanho dos blocos, densidade e “zoom out”

**Estado:** não iniciado. Hoje todas as fases usam **8 colunas**; o
`fieldScale` só encolhe formações altas (fase 6, 12 linhas, escala 0,88). O
“zoom out progressivo” do GDD nunca foi implementado como progressão.

**Conta de legibilidade (escala 1):**

| Colunas | Célula lógica | 390 px | 320 px |
|---:|---:|---:|---:|
| 8 (hoje) | 90 | ~49 px | ~40 px |
| 9 | 80 | ~43 px | ~36 px |
| 10 | 72 | ~39 px | ~32 px |
| 12 | 60 | ~32 px | ~27 px |

O GDD usa 46 px como referência. A 390 px, 10 colunas já ficam abaixo; a
320 px, até 8 colunas estão no limite.

**Distinção:** zoom out não aumenta a área jogável; só coloca mais conteúdo no
mesmo shell portrait. “Mais espaço” seria outro layout (campo mais alto/largo,
menos HUD, shell maior), não zoom.

**Recomendação registrada:** testar densidade com 8 colunas primeiro (8×10,
8×12); depois 9 colunas no Mundo III; 10–12 só se o público desktop for
prioritário ou depois de playtest em 320 px. O público mais velho torna a
legibilidade o critério principal.

### 9.2 Modelo de progressão e save v4

**Estado:** não iniciado. O que é load-bearing é o **modelo ordinal**:
`unlockedPhase` 0..18 e estatísticas por `phase-N`.

| Operação | Save | Custo |
|---|---|---|
| Reescrever ondas/temas mantendo os 18 slots | nenhum | baixo |
| Adicionar fase no fim / Mundo IV | aditivo (`MAX_PHASE`) | baixo |
| Reordenar, remover ou inserir fase no meio | remapear ids/ordinal | médio |
| Mudar de 3×6 para 4×5 ou 3×7 | reindex total | alto |
| Mundos selecionáveis / mapa ramificado | save v4 + UI | alto |
| Run contínua entre fases | fluxo + talvez save v4 | muito alto |

**Janela:** a 0.7.1 não foi publicada; só existem saves v1/v2 reais da 0.6.1.
Se a progressão mudar de modelo, este é o momento mais barato para um save v4 —
migrar v1/v2 direto, sem carregar uma população v3.

**Modelos possíveis:** linear reescrito; linear reindexado; mundos
selecionáveis; mapa ramificado; run contínua. O modelo precisa ser decidido
antes de autorar conteúdo em massa.

**Preservação do progresso antigo:** mapear ids para os novos nós; preservar só
o nível de mundo e resetar nós; resetar a campanha mantendo Sparks/unlocks/
Endless; ou criar um “Campaign Remastered” ao lado do atual.

**Validador:** assume dificuldade não-regressiva dentro do mundo (tolerância de
5%, chefes excluídos). Uma progressão com respiros deliberados exige ajustar
essa regra.

### 9.3 Público, dificuldade e “mais ação”

**Público-alvo em discussão:** pessoas mais velhas que jogaram block breaker
clássico. Implicações: clareza, texto grande, física previsível, menos ruído
visual, sessões curtas, respeito ao tempo.

**Princípio:** mais ação sem mais dificuldade = aumentar **poder e feedback**,
não **ameaça**.

- Poder: pierce, explosões, cadeias, combos, multiball, laser.
- Ameaça: velocidade, HP, densidade, timers, shards/corrosão, regras
  restritivas.

**Tensão:** bloco menor cabe mais, mas prejudica leitura. O mesmo movimento que
dá “mais jogo” tira legibilidade do público mais velho.

**Desktop:** o shell portrait em iframe 16:9 pode ficar estreito (167–442 px em
exemplos de 907×510/1920×1080). A decisão de não fazer layout desktop foi
tomada antes; se esse público for prioritário, vale reabrir.

**Métricas de playtest:** tempo até a primeira perk, duração de onda, taxa de
skip, mortes por run, leitura de HP dos blocos, intenção de repetir.

### 9.4 Ajustes possíveis do pierce

Implementado como regra base com excesso ≥ 1, sem decay e sem limite por
rally. Em observação:

- excesso mínimo 2 no late game, se a bola atravessar demais;
- perder 1 de dano por bloco atravessado na mesma passada;
- limite de perfurações por rally;
- Overkill junto: hoje os dois usam o mesmo excesso. Se dominar, separar o
  splash para quando a bola quica ou limitar o splash;
- impacto em combo/Momentum/Hot Streak, XP, level-ups, Sparks e duração;
- explicar no How to Play e avaliar um indicador de “pierce pronto”;
- padrão de conteúdo ideal: “cascalho” de 1 HP na frente e âncoras de 4–5 HP
  atrás.

### 9.5 Perks, economia e metaprogressão

- A proposta de rework tem **26 perks**, 8 starters + 18 unlocks, 4 adições,
  2 substituições e 12 tunes; **nada implementado**.
- O Giant Ball atual foi para **+40%/nível** (máx. +80%); a recomendação de
  +12% da proposta é anterior e precisa ser reavaliada.
- Catálogo, economia e schema de save exigem aprovação explícita.
- Tier 5/6 e consumíveis continuam fora; dependem do rework de economia.
- Cosméticos, desafios com recompensa e reroll de oferta continuam no backlog.

### 9.6 Outros itens fora desta linha

- Mundo IV e expansões temáticas.
- Localização; o catálogo de strings precisa ser separado por locale antes.
- Landscape jogável; hoje só portrait + guarda de rotação.
- Rankings globais, conquistas e leaderboard do Endless.
- Backend, contas e cloud save.
- Distribuição: itch.io e Playgama sandbox seguem na **0.6.1**; CrazyGames
  está pausado até **2026-11-26** (revalidar requisitos na data) e GameFlare
  segue bloqueado. Full Launch, Poki, GameDistribution, Famobi e novos portais
  continuam fora.
- Regenerar capas, screenshots, vídeos e imagens do How to Play a partir da
  0.7.1; os atuais são de versões anteriores.

### 9.7 Ordem sugerida para a próxima sessão

1. Medir tutorial e pierce em playtest.
2. Decidir o spine de progressão no papel; se mudar, planejar save v4 antes de
   publicar a 0.7.1.
3. Testar densidade com 8×10/8×12; depois 9 colunas.
4. Só então autorar conteúdo em massa.
5. Reavaliar layout desktop se o público-alvo justificar.
6. Integrar o rework de perks/economia em fluxo separado.

### 9.8 Não fazer sem aprovação explícita

- Alterar schema de save, `PlatformService`, catálogo de perks ou economia.
- Publicar em portal, criar tag ou release.
- Mudar de modelo de progressão (implica save v4).
- Regerar ou substituir assets de loja sem revisão humana.
