# Overhaul — direções discutidas e próximos passos

**Status:** documento de trabalho; tutorial e pierce implementados; densidade,
progressão e público seguem em aberto.
**Data:** 2026-11-23 · **Atualizado:** 2026-11-24
**Base:** `0.7.2` local, 18 fases + tutorial, save v3, 22 perks.
**Objetivo:** registrar as conversas de overhaul para não perdê-las e permitir
decidir uma frente por vez.

---

## 1. O que já foi feito — tutorial (2026-11-23)

- `tutw1`: 4 blocos de 1 HP; destruir 3 (75%) enche a barra de tutorial e abre
  a primeira escolha de perk.
- `tutw2`: 5 blocos de 1 HP, 2 de 2 HP e 1 explosivo.
- `GAME_CONFIG.progression.tutorialFirstLevelXp = 3`. A curva normal
  (8/20/26) volta a valer depois do level 2.
- Coach marks reduzidos de 5 para 2: mover/lançar e blocos especiais. O
  level-up overlay ensina a perk; chefes/Endless saíram do tutorial.
- Texto 15–17 px, botão **Continue** e **Skip tutorial** em contraste alto,
  alvos de 44 px.
- Onda 1 desceu quatro linhas; o paddle do tutorial é **2× mais largo**.
- Quando resta um bloco, a bola é levemente girada na direção dele sem mudar a
  velocidade, com anel dourado e tether. A regra é um `RunModifiers`
  (`lastBlockMagnetTurnRate`) e pode virar perk depois.
- **2026-11-26:** corrigida a órbita estável em que a bola circulava o último
  bloco sem acertar. A taxa de giro cresce de 3,5 até 20 rad/s conforme a bola
  se aproxima; há teste de regressão e fuzz de 500 cenários.
- Totais: 12 blocos, 15 XP, 1 level up; totais do conteúdo: 2.781 blocos /
  9.392 XP.
- Gates: 428 unitários / 35 arquivos; 43 E2E / 12 specs; validação de conteúdo
  verde.

### 1.1 Feedback visual de dano (2026-11-23)

- Giant Ball: **+40% de raio por nível**, máximo 2 (+80%).
- Bola: branco (dano 1) → amarelo (2) → laranja (3) → vermelho (4) → roxo
  (5+), com glow e rastro na mesma cor. Buffs temporários não trocam a cor.
- A rampa fica em `BALL_DAMAGE_COLORS` / `ballColorForDamage`.

**Decisão registrada:** o tutorial não volta ao modelo antigo. A primeira onda
não é dimensionada pela curva de XP da campanha; o tutorial tem barra e ritmo
próprios.

**Pendência de assets:** as imagens do How to Play e os screenshots de loja
ainda mostram o tutorial antigo; regenerar antes de publicar.

---

## 2. Pierce — implementado (2026-11-24)

**Status:** implementado como regra base.

**Regra:** hit direto da bola que destrói o bloco com **excesso ≥ 1** atravessa
sem quicar; dano igual ou menor quica. Exemplos: 2×1 atravessa; 2×2 destrói e
quica; 3×2 atravessa; dano fracionário só atravessa se o excedente chegar a 1
inteiro.

**Escopo:** só bola. Laser, projétil, explosão, link e Shield Bash não
perfuram; chefe e elementos também não. `phased` blindado continua bloqueando.

**Implementação:** `World.handleBlockHit` retorna `pierced`; `moveBallAabb`
pula reflexo e separação e segue o sweep. Evento `block:pierced`, SFX `pierce`
e anel/partículas na cor do dano. Testes em `tests/pierce.test.ts`.

**Overkill:** continua usando o mesmo excesso para splash; os dois coexistem.
Fica em observação no playtest: se pierce + Overkill dominar, separar o splash
para o caso em que a bola quica (ou limitar o splash).

**Ainda em aberto (playtest):**

- Excesso mínimo 1 já entrou; avaliar se 2 é melhor para o late game.
- Sem decay por enquanto; testar perda de 1 de dano por bloco atravessado.
- Limite de perfurações por rally, se a bola ficar “sumida” em ondas densas.
- Impacto em combo/Momentum/Hot Streak, XP, level-ups, Sparks e duração das
  ondas.
- Como explicar no How to Play e se vale um indicador de “pierce pronto”.

**Padrão de conteúdo que combina:** “cascalho” de 1 HP na frente e âncoras de
4–5 HP atrás. O cascalho vira espetáculo; as âncoras seguram a bola.

---

## 3. Tamanho dos blocos e densidade

**Status:** não iniciado. Hoje **todas as fases usam 8 colunas**; o
`fieldScale` só encolhe formações altas (fase 6, 12 linhas, escala 0,88). O
“zoom out progressivo” do GDD nunca foi implementado como progressão.

**Conta de legibilidade (escala 1):**

| Colunas | Célula lógica | 390 px | 320 px |
|---:|---:|---:|---:|
| 8 (hoje) | 90 | ~49 px | ~40 px |
| 9 | 80 | ~43 px | ~36 px |
| 10 | 72 | ~39 px | ~32 px |
| 12 | 60 | ~32 px | ~27 px |

O GDD usa 46 px como referência de leitura. A 390 px, 10 colunas já ficam abaixo
disso; a 320 px, até as 8 colunas estão no limite.

**Distinção importante:** zoom out não aumenta a área jogável; só coloca mais
conteúdo no mesmo shell portrait. “Mais espaço” seria outro layout (campo mais
alto/largo, menos HUD, shell maior), não zoom.

**Recomendação registrada:** testar primeiro densidade com 8 colunas (8×10,
8×12); depois 9 colunas no Mundo III; 10–12 só se o público desktop for
prioritário ou depois de playtest em 320 px.

---

## 4. Progressão de fases e mundos

**Status:** não iniciado. O que é “load-bearing” é o **modelo ordinal**, não o
conteúdo: `unlockedPhase` 0..18 e estatísticas por `phase-N`.

| Operação | Save | Custo |
|---|---|---|
| Reescrever ondas/temas mantendo os 18 slots | nenhum | baixo |
| Adicionar fase no fim / Mundo IV | aditivo (`MAX_PHASE`) | baixo |
| Reordenar, remover ou inserir fase no meio | remapear ids/ordinal | médio |
| Mudar de 3×6 para 4×5 ou 3×7 | reindex total | alto |
| Mundos selecionáveis / mapa ramificado | save v4 + UI | alto |
| Run contínua entre fases | fluxo + talvez save v4 | muito alto |

**Janela:** a `0.7.2` não foi publicada; só existem saves v1/v2 reais da
`0.6.1`. Se a progressão mudar de modelo, este é o momento mais barato para um
save v4 — migrar v1/v2 direto e não carregar uma população v3.

**Modelos possíveis:** linear reescrito; linear reindexado; mundos
selecionáveis; mapa ramificado; run contínua. O modelo precisa ser decidido
antes de autorar conteúdo em massa.

**Preservação do progresso antigo:** mapear ids para os novos nós; preservar só
o nível de mundo e resetar nós; resetar a campanha mantendo Sparks/unlocks/
Endless; ou criar um “Campaign Remastered” ao lado do atual.

**Validador:** ele assume dificuldade não-regressiva dentro do mundo (tolerância
de 5%, chefes excluídos). Uma progressão com respiros deliberados exige ajustar
essa regra.

---

## 5. Público, dificuldade e “mais ação”

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

---

## 6. Onde as frentes se cruzam

- Densidade ↔ pierce ↔ TTK ↔ XP/economia.
- Mais blocos ↔ mais XP ↔ mais level-ups ↔ mais pausas.
- Tutorial ↔ primeira perk ↔ HP dos blocos.
- Progressão ↔ save ↔ custo de autoria de conteúdo.
- Público mais velho ↔ tamanho do bloco ↔ densidade.

---

## 7. Ordem sugerida

1. Tutorial e pierce estão implementados; medir os dois em playtest.
2. Decidir o spine de progressão no papel; se mudar, planejar save v4 antes de
   publicar a 0.7.1.
3. Testar densidade (8×10/8×12; depois 9 colunas) com o pierce já ativo.
4. Só então autorar conteúdo em massa.
5. Reavaliar layout desktop se o público-alvo justificar.

---

## 8. Referências

- [GDD](../GDD_Bricklike.md)
- [Handoff v0.7.2](../handoff-v0.7.2.md)
- [Perks — proposta de rework](../design/perks-rework-v0.7.md)
- [Spec de publicação](../spec-tecnica-publicacao.md)
