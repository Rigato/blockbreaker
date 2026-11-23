# Perks — proposta de rework e expansão (v0.7)

**Status:** proposta de design. Nada implementado.
**Data:** 2026-11-16

> **Nota (2026-11-23):** o Giant Ball atual passou a **+40% de raio por
> nível** (máx. +80%) e a bola ganhou cor por dano. A recomendação de +12%
> abaixo é anterior a esse tune e deve ser reavaliada antes de implementar.
**Base:** v0.6.1 — 22 perks, 10 starters + 12 unlocks, economia de Sparks
com teto de 250/run.
**Escopo:** catálogo de perks, split starter/locked, Workshop, pré-requisitos e
regras de oferta. **Não** inclui novo mundo, novo bloco, novo chefe ou mudança
de schema de save.
**Aprovação:** qualquer mudança de catálogo, economia ou save exige aprovação
explícita do dono antes de implementação.

> Documento produzido a partir de quatro análises independentes (auditoria do
> catálogo, novas perks, metaprogressão/economia e sinergias/balance). As
> divergências foram resolvidas aqui; ideias descartadas ficam no apêndice A
> para não se perderem.

---

## 1. Resumo executivo

O catálogo atual tem 22 perks, mas poucas decisões reais. Os três problemas
estruturais são:

1. **Defesa dominada.** `safety_net` salva a última bola **uma vez por onda**
   (até ~20 saves numa campanha) e é starter; `second_chance` revive **uma vez
   por run** e custa 12 Sparks. A perk paga é matematicamente pior que a
   gratuita.
2. **Dano achatado.** Com `power_ball` nível 3 o dano base vai a 4 contra blocos
   de 1–3 HP. Os três tipos básicos de bloco perdem a identidade, e `overkill`
   vira win-more de uma perk só.
3. **Famílias desequilibradas.** Laser tem 4 perks (uma delas, `laser_focus`,
   é basicamente um nível extra de `prism_laser`); explosão tem 3 sobrepostas;
   combo tem 2; boss tem 1 e ela é inútil em 17 das 20 ondas.

**Proposta em uma linha:** reduzir o pool inicial de 10 para **8 starters**,
levar o catálogo a **26 perks** com **4 adições** e **2 substituições**, e
ajustar 18 perks para que cada família tenha uma raiz gratuita, um payoff
comprável e um capstone de Tier 4.

| Métrica | Hoje (0.6.1) | Proposta |
|---|---:|---:|
| Perks no catálogo | 22 | **26** |
| Starters | 10 | **8** |
| Unlocks | 12 | **18** |
| Custo total dos unlocks | 700 | **937** |
| Chance de um perk específico numa oferta de 3 (pool inicial) | 30,0% | **37,5%** |
| Níveis máximos somados | 43 | **46** |
| Tier 4 | 3 | **3** (mesmos preços) |

As cinco mudanças de maior impacto:

1. **`safety_net`** passa a salvar **1× por fase**, não 1× por onda.
2. **`power_ball`** para no nível 2 (dano 3), preservando o HP dos blocos.
3. **`second_chance` → Last Stand** e **`laser_focus` → Heavy Ball**: duas
   perks que hoje são clones/stat-sticks viram mecânicas com decisão.
4. **`boss_slayer` → Bossbane**: dano de boss que também serve em blocos de
   3 HP, em vez de carta morta fora das três ondas de chefe.
5. **`shield_bash`** atinge as **duas linhas mais baixas que ainda têm blocos**,
   não as duas linhas fixas do campo (que costumam estar vazias).

---

## 2. Diagnóstico

### 2.1 Números que explicam o problema

- Uma campanha completa dá ~22 level-ups. Com 3 cartas por oferta, a chance de
  um perk específico aparecer é `3 / N`, onde `N` é o pool desbloqueado.
  Hoje, com 10 starters, é **30%**; com 8, sobe para **37,5%**. Em 22 level-ups,
  um starter aparece ~8,3 vezes em vez de 6,6 — a diferença entre levar duas
  linhas a nível alto e espalhar cinco perks rasas.
- `power_ball` nível 1 já dobra o dano (1 → 2); nível 3 quadruplica (1 → 4).
  Um bloco `obsidian` de 3 HP, que deveria exigir três acertos, morre em um.
  `critical_strike` nível 3 vale +24% de dano esperado, ou seja, +0,96/hit com
  dano 4 — menos que os +3 de `power_ball` nível 3.
- `safety_net` tem até 20 cargas por campanha (uma por onda). `second_chance`
  tem 1. O jogador que compra a segunda está pagando por uma fração da primeira.
- `bombardier` (2 de dano no centro, 1 no anel, a cada 12 kills) entrega ~0,8 de
  dano efetivo por kill em board denso; `explosive_core` (2 de dano em área, a
  cada 8 kills) entrega ~2,0. O primeiro é estritamente pior na prática.
- `shield_bash` mira as duas linhas mais baixas do **campo**. No meio de uma
  onda, essas linhas frequentemente já estão vazias; a onda de choque acerta o
  nada.
- XP pode empilhar `quick_study` (+40%) × `momentum` (+30%) × bloco
  multiplicador (2×) = **3,64×**. Cada level-up é uma entrega inteira de poder;
  esse é o vetor de power creep mais perigoso do jogo, mais que qualquer dano.

### 2.2 Mapa de arquétipos atual

| Arquétipo | Peças atuais | Suficiente? | Problema |
|---|---|---|---|
| Laser / precisão | `prism_laser`, `laser_focus`, `overcharge`, `conductor` | Profundo, mas raso | 4 perks, mas 2 são stat-sticks; falta um payoff de alvo único |
| Demolição / AoE | `explosive_core`, `bombardier`, `overkill` | Sim, mas redundante | `bombardier` é clone fraco; `overkill` depende de `power_ball` |
| Tempo / combo | `momentum`, `hot_streak` | Não | Duas perks, ambas de dano; sem glue de paddle |
| Controle | `wide_paddle`, `giant_ball`, `sticky_paddle`, `foresight` | Sim | Não converte posicionamento em dano |
| Defesa | `safety_net`, `second_chance`, `shield_bash` | Não | Duas vidas extras concorrentes; a paga é pior |
| Economia / tabuleiro | `quick_study` | Não | XP é só um multiplicador; não interage com blocos especiais |
| Boss | `boss_slayer` | Não | 3 ondas de 20; carta morta no resto |

**Conclusão:** só Demolição e Controle são perseguíveis de propósito. Laser é
um sorteio profundo; Tempo é o default passivo; Defesa é uma pilha de vidas
extras; Boss é uma carta situacional.

---

## 3. Princípios da proposta

1. **Uma regra de vida extra.** O jogo já tem `safety_net`, `second_chance` e o
   rewarded revive. Três fontes de "não perdi" é demais. `second_chance` deixa
   de ser revive e vira uma janela de recuperação (Last Stand).
2. **Cada família tem raiz, payoff e capstone.** A raiz é starter ou T1
   barato; o payoff é T2/T3; o capstone é T4.
3. **Dano em escalas de tempo diferentes.** Flat (`power_ball`), aleatório
   (`critical_strike`), janela de rally (`hot_streak`), scaling de onda
   (`momentum`), alvo único (`siege_ball`), área (`overkill`). Nenhuma deve ser
   "a mesma coisa com outro nome".
4. **Posicionamento de paddle é uma alavanca de skill.** O centro da paddle e o
   timing de soltura precisam render algo além de sobrevivência.
5. **Ofertas precisam continuar relevantes.** 26 perks no papel, mas o pool
   elegível por level-up é menor (maxeados e pré-requisitos saem). O tamanho do
   pool inicial é a primeira alavanca, não um sistema de pesos.
6. **Mobile first.** Nada de mira precisa, dois dedos simultâneos ou toque
   rápido. Verbo ativo novo só se couber no polegar.
7. **Nada de mecânica impossível.** "Bloco que toca a paddle" não existe no
   jogo: blocos são estáticos (exceto `moving`, que oscila na horizontal). Ideias
   que dependiam disso foram descartadas no apêndice A.

---

## 4. Auditoria dos 22 perks

Nota de 1 a 5 = saúde de design (clareza + espaço de decisão + papel único).
Veredito: **KEEP** (mantém), **TUNE** (números), **REWORK** (comportamento),
**REPLACE** (vira outra perk).

| Perk | Nota | Problema | Veredito | Mudança proposta |
|---|---:|---|---|---|
| `multiball` | 3 | Multiplica todo dano; 3 bolas em portrait viram caos | TUNE | Máx. 2 |
| `wide_paddle` | 4 | Stat puro, mas é a alavanca certa no mobile | KEEP | +12%/nível, máx. 3 |
| `power_ball` | 3 | Achata o HP dos blocos | TUNE | +1/nível, máx. 2 (dano 3) |
| `quick_study` | 2 | Snowball de XP invisível | TUNE | +12%/nível, máx. 2 |
| `auto_turret` | 3 | Passivo sem agência; DPS concorrente com dano | TUNE | 5,0/4,2/3,4 s; mira no bloco de maior HP; vira unlock T2 |
| `giant_ball` | 3 | Redundante com `wide_paddle` | KEEP | +12%/nível, máx. 2 |
| `sticky_paddle` | 4 | Melhor verbo ativo; risco de "segurar para sempre" | TUNE | Soltar concede +1 dano no próximo hit; continua T1 |
| `safety_net` | 4 | ~20 saves/run; anula `second_chance` | TUNE | 1 save por **fase**, não por onda |
| `prism_laser` | 3 | Verbo ativo bom, mas arrasta 3 dependentes | KEEP | Continua starter; família fica com 3 peças |
| `foresight` | 4 | Onboarding excelente; inútil para veterano | KEEP | Continua starter |
| `explosive_core` | 3 | Feedback fraco; quase duplicata de `bombardier` | TUNE | A cada 8 kills, 2 de dano, com glow "armed"; T1 15 |
| `critical_strike` | 3 | RNG invisível; fraco no early | TUNE | 10%/nível, ×2, flash distinto; vira unlock T1 15 |
| `laser_focus` | 2 | +1 alvo é um nível de `prism_laser`, não um perk de 65 | REPLACE | **Heavy Ball** (T3 60) |
| `overcharge` | 2 | Stat de cooldown invisível | TUNE | −15%/nível, máx. 2, custo 55 |
| `momentum` | 3 | Reset no toque da paddle mata o combo em ~3 hits | REWORK | Mantém +1% dano / +2% XP por hit e caps +5/10/15% e +10/20/30%; reseta após 4 s sem hit ou ao perder bola; T2 35 |
| `second_chance` | 1 | Dominado por `safety_net` | REPLACE | **Last Stand** (T1 12) |
| `bombardier` | 3 | Mesma fantasia do `explosive_core`; anel de 1 é fraco | TUNE | A cada 10 kills; centro 3, anel 2; T2 40 |
| `boss_slayer` | 2 | Só 3 ondas de boss; carta morta nas outras 17 | REWORK | **Bossbane**: +3/+5 vs boss e +1/+2 vs blocos de 3 HP; T2 45 |
| `hot_streak` | 3 | Janela de 3 s ≈ sempre ligado; decisão zero | TUNE | +1/+2 dano por **5 s**; T3 70 |
| `overkill` | 2 | Depende de excesso; win-more de `power_ball` | REWORK | Splash 1 sempre; 2 se o excesso for ≥2; T4 100 |
| `shield_bash` | 2 | Mira linhas fixas que costumam estar vazias | REWORK | A cada 8 paddle hits, 1 dano nas **2 linhas mais baixas ocupadas**; T4 110 |
| `conductor` | 3 | 4º perk de laser; corrente invisível | TUNE | 60% do dano, 1 salto; T4 120 |

**Resumo:** 4 mantidas (`wide_paddle`, `giant_ball`, `prism_laser`,
`foresight`), 12 ajustadas, 4 reworks e 2 substituições. Nenhuma remoção
definitiva: as duas substituídas mantêm o slot e viram outra fantasia.

---

## 5. Reworks detalhados

### 5.1 `safety_net` — 1 save por fase

**Hoje:** salva a última bola uma vez por onda e recarrega na onda seguinte.
**Proposta:** cargas recarregam no início da **fase**, não da onda.

- Uma fase tem 2–5 ondas. O jogador continua tendo perdão, mas não 20 saves por
  campanha.
- `setSafetyCharges` passa a ser chamado no início da fase (ou a carga é
  consumida e só reposta quando `phaseId` muda).
- HUD: o ícone da rede só aparece quando há carga; ao gastar, some até a próxima
  fase.

**Por quê:** libera `second_chance` para virar outra mecânica e devolve peso à
decisão de arriscar a bola.

### 5.2 `power_ball` — máx. 2

**Hoje:** +1 dano por nível, máx. 3 (dano 4).
**Proposta:** +1 por nível, máx. 2 (dano 3).

- Blocos de 3 HP voltam a exigir três acertos no dano 1, dois no dano 2 e um no
  dano 3.
- Chefes de 60/80/100 HP levam 20/27/34 hits no dano 3; com turret, laser e
  explosões, o TTK fica em 12–20 s, compatível com o design.
- Se o playtest mostrar chefe lento demais, o ajuste é no HP do chefe ou no dano
  das fontes secundárias — **não** em devolver o nível 3.

### 5.3 `quick_study` — +12%, máx. 2

**Hoje:** +20% por nível, máx. 2 (+40%).
**Proposta:** +12% por nível, máx. 2 (+24%).

- Reduz o snowball de XP sem remover a fantasy de economia.
- Se `quick_study` + `momentum` + bloco multiplicador passar de 3× no playtest,
  converter os bônus de XP de perks para **aditivos** com cap de +80%.

### 5.4 `second_chance` → **Last Stand** (`last_stand`)

**Hoje:** revive uma vez por run com uma bola.
**Proposta:** deixa de ser revive.

> **Last Stand** — unique, máx. 1, T1 12.
> *After losing a ball, time slows for 3 seconds and your next block hit deals
> +2 damage.*

- Dispara ao perder uma bola **quando ainda há outra em jogo**; não salva a
  última bola (isso é `safety_net`).
- Slow-mo de 15–20% por 3 s, com vinheta e tag `LAST STAND` no HUD.
- O próximo hit em bloco (não chefe) causa +2.
- Não empilha: se perder outra bola durante a janela, só renova o timer.

**Por quê:** mantém a fantasy de clutch, cria uma decisão ("aproveitar a janela
para limpar a linha de baixo") e não compete com `safety_net`.

### 5.5 `laser_focus` → **Heavy Ball** (`heavy_ball`)

**Hoje:** +1 alvo de laser e +12% de largura por nível, requer `prism_laser`.
**Proposta:** vira uma perk de controle/risco.

> **Heavy Ball** — repeatable, máx. 2, T3 60.
> *Slows the ball by 10% per level but adds +1 damage per level.*

- Nível 1: −10% velocidade, +1 dano. Nível 2: −20%, +2.
- Não afeta a velocidade do paddle nem o cooldown do laser.
- Feedback: trail mais curto e "squash" no impacto; som mais grave.

**Por quê:** dá uma resposta à curva de velocidade do Endless e cria a decisão
"lento e brutal vs rápido e ágil", que hoje não existe. A família laser fica
com 3 peças (raiz, cooldown, capstone), o que é suficiente.

### 5.6 `momentum` — scaling de rally

> **Momentum** — repeatable, máx. 3, T2 35.
> *Consecutive block hits add +1% damage and +2% XP, up to +5/10/15% damage and
> +10/20/30% XP. Resets after 4 seconds without a block hit or when a ball is
> lost.*

- O reset deixa de ser o toque na paddle (que matava o combo a cada ~3 hits) e
  passa a ser **tempo sem acertar bloco** ou **perder bola**. Os números por hit
  e os caps continuam os atuais: o ganho é de uptime, não de teto.
- Isso o diferencia de `hot_streak`: Momentum é scaling lento de onda;
  Hot Streak é burst de 5 hits.
- Feedback: número de combo na bola/paddle cresce; ao resetar, um "pop" seco.

### 5.7 `boss_slayer` → **Bossbane** (`bossbane`)

> **Bossbane** — repeatable, máx. 2, T2 45.
> *Your ball deals +3 damage to bosses (+5 at level 2). Against blocks with 3+
> max HP, it deals +1 (+2 at level 2).*

- Deixa de ser "+3 no próximo acerto depois de 10 kills" e vira um bônus
  passivo contra alvos duros.
- Funciona em `obsidian` (3 HP) e em blocos de chefe, então não é carta morta
  nas 17 ondas sem chefe.
- O bônus não se aplica a dano de explosão, laser ou turret — só à bola.

### 5.8 `overkill` — splash sempre ligado

> **Overkill** — unique, máx. 1, T4 100.
> *Blocks destroyed by a direct hit splash 1 damage to orthogonally adjacent
> blocks. If the hit exceeded the block's HP by 2 or more, the splash is 2.*

- Antes, sem `power_ball` maxado, o excesso era 0 e a perk não fazia nada.
- Agora o splash base é 1; o dano alto aumenta para 2.
- Continua sem encadear Overkill e sem disparar por explosão, link ou Shield
  Bash (invariante atual).

### 5.9 `shield_bash` — linhas ocupadas

> **Shield Bash** — unique, máx. 1, T4 110.
> *Every 8 paddle hits, a shockwave deals 1 damage to the lowest 2 rows that
> still contain blocks.*

- Muda o alvo de "linhas 1 e 2 do campo" para "as duas linhas mais baixas com
  blocos". A onda nunca acerta o vazio.
- Continua sem disparar Overkill.
- Se o playtest mostrar que 110 Sparks ainda é caro, o ajuste é 6 hits ou 2 de
  dano — não os dois.

### 5.10 `bombardier` — anel útil

> **Bombardier** — unique, máx. 1, T2 40.
> *Every 10 destroyed blocks arms the next block hit to detonate a 3x3
> explosion (3 damage center, 2 around).*

- O anel de 2 finalmente mata blocos de 2 HP, que é o caso comum.
- Continua separado do contador de `explosive_core` (8 kills).
- Feedback: a paddle/bola ganha um brilho laranja enquanto a carga está armada.

### 5.11 `hot_streak` — janela de 5 s

> **Hot Streak** — repeatable, máx. 2, T3 70.
> *After 5 consecutive block hits, gain +1 damage per level for 5 seconds; each
> new hit refreshes the timer.*

- 3 s é curto demais para o jogador perceber a janela; 5 s dá tempo de usar.
- Continua sendo burst, não scaling: se a bola ficar 5 s sem acertar bloco, cai.
- O dano é flat, não multiplica crítico.
- **Guardrail:** se o uptime passar de 80% no playtest, reduzir a janela para
  2,5 s ou consumir o bônus no próximo hit — não aumentar o dano.

### 5.12 Ajustes menores

| Perk | Ajuste |
|---|---|
| `multiball` | Máx. 2. A segunda bola entra com 80% do dano (se o motor permitir; caso contrário, só o cap). |
| `auto_turret` | 5,0 / 4,2 / 3,4 s; mira no bloco de maior HP. Vira unlock T2 32. |
| `critical_strike` | 10%/nível, máx. 3 (30%); crítico = ×2 com flash e som próprios. Vira unlock T1 15. |
| `giant_ball` | +12%/nível, máx. 2; continua starter. |
| `sticky_paddle` | Soltar com tap concede +1 dano no próximo hit; continua T1 18. |
| `overcharge` | −15%/nível, máx. 2; custo 55. |
| `conductor` | 60% do dano do laser, mínimo 1; 1 salto por alvo. |
| `explosive_core` | A cada 8 kills, 2 de dano; glow "armed" 0,5 s antes. |

### 5.13 Guardrails de dano e economia

Estes limites não são perks; são válvulas para o caso de o playtest mostrar
combinações fora da curva.

| Guardrail | Número | Alvo |
|---|---|---|
| Dano por hit no chefe | ≤15% do HP máximo (9 / 12 / 15) | Impede one-shot por `heavy_ball` + `siege_ball` + `sweet_spot` |
| Dano por segundo no chefe | ≤25% do HP máximo | Contém `overkill` + explosões no mesmo burst |
| Blocos destruídos por cadeia de explosão | ≤12 | Evita cascata infinita em `linked`/`generator` |
| Shards por explosão | ≤4, 1 por direção | Orçamento de partículas |
| `transmute` procs | ≤1 por segundo | Loop com `generator` |
| XP de perks | Aditivo, cap +80%, se o total passar de 3× | `quick_study` + `momentum` + multiplicador |

---

## 6. Novas perks

Quatro adições (`sweet_spot`, `siege_ball`, `shrapnel`, `transmute`). As duas
substituições (`last_stand` e `heavy_ball`) já estão na seção 5; estas quatro
completam famílias que hoje não têm payoff.

### 6.1 **Sweet Spot** (`sweet_spot`) — T2 35

> *Bounces from the center third of the paddle grant +1 damage per level for 2.5
> seconds.*

- **Tipo:** repeatable, máx. 2.
- **Família:** Tempo / controle.
- **Comportamento:** o rebote no terço central da paddle ativa um buff de dano
  por 2,5 s; novos rebotes renovam o timer, não empilham. Nível 1: +1; nível 2:
  +2.
- **Por quê:** converte posicionamento em dano. É a peça que falta para Controle
  deixar de ser só sobrevivência.
- **Sinergias:** `wide_paddle` (centro maior), `giant_ball` (rebote mais
  estável), `foresight` (prever onde pegar), `siege_ball` (acertar o mesmo
  alvo).
- **Feedback:** o terço central da paddle brilha; o número do próximo hit fica
  dourado.
- **Risco:** com `wide_paddle` nível 3 o centro fica fácil; isso é sinergia
  intencional, mas monitorar o uptime (meta: <70% do tempo).
- **Complexidade:** LOW (flag no rebote + timer).

### 6.2 **Siege Ball** (`siege_ball`) — T2 45

> *Consecutive hits on the same target build +15% damage per level, up to 3
> stacks; stacks fade after 2 seconds without hitting that target.*

- **Tipo:** repeatable, máx. 2.
- **Família:** Warden (alvo único).
- **Comportamento:** cada hit no mesmo bloco/chefe adiciona 1 stack; 3 stacks
  máximo. Nível 1: +15% por stack (+45%); nível 2: +20% (+60%). Dano de link,
  explosão ou laser não conta como hit para stacks. Arredondar o dano final
  para cima, com mínimo 1.
- **Por quê:** dá à família de boss uma peça que também serve em `obsidian` e
  `stone`, e cria a decisão "insistir no mesmo alvo vs espalhar dano".
- **Sinergias:** `bossbane`, `sweet_spot`, `heavy_ball`, `foresight`.
- **Feedback:** chevrons âmbar sobre o alvo; o número cresce a cada stack.
- **Risco:** chefe com fases que trocam de alvo reseta os stacks — é
  intencional. Não aplicar a blocos `linked` como se fossem o mesmo alvo.
- **Complexidade:** LOW (contador por alvo + timer).

### 6.3 **Shrapnel** (`shrapnel`) — T3 60

> *Explosions fire a shard in each orthogonal direction, dealing 1 damage to the
> first block hit.*

- **Tipo:** unique, máx. 1.
- **Família:** Demolição.
- **Comportamento:** cada explosão (bloco explosivo, `explosive_core`,
  `bombardier`; `overkill` não conta) dispara 4 shards ortogonais que viajam até
  o primeiro bloco/chefe e causam 1. Paredes e obstáculos bloqueiam os shards.
  Cap: 1 shard por direção por explosão; cooldown interno de 100 ms entre
  explosões.
- **Por quê:** explosão já cobre 1 célula em todas as direções; Shrapnel estende
  o dano por corredores e dá à demolição uma resposta contra colunas altas e
  chefes alinhados.
- **Sinergias:** `explosive_core`, `bombardier`, `transmute`, `overkill`.
- **Feedback:** 4 riscos de luz saindo do epicentro, com som de estilhaço.
- **Risco:** board denso + `transmute` pode gerar muitas explosões; o cap de
  100 ms e o limite de 4 shards por explosão seguram o orçamento de partículas.
- **Complexidade:** MEDIUM (reusa o projétil da turret).

### 6.4 **Transmute** (`transmute`) — T3 70

> *Destroying a special block turns up to 2 adjacent crystal blocks into
> explosive blocks.*

- **Tipo:** unique, máx. 1.
- **Família:** Salvage / tabuleiro.
- **Comportamento:** ao destruir um bloco especial (`explosive`, `regenerative`,
  `moving`, `multiplier`, `generator`, `linked`), até 2 blocos `crystal`
  ortogonalmente adjacentes viram `explosive`. Cooldown interno de 1 s; não
  transforma blocos que já são especiais; não dispara em blocos criados por
  `generator` no mesmo frame.
- **Por quê:** é a única perk que muda o tabuleiro de forma planejável. Dá
  propósito a `generator`, `linked` e `multiplier` além do dano direto, e abre
  uma build de demolição que o jogador constrói.
- **Sinergias:** `explosive_core`, `shrapnel`, `bombardier`, `overkill`.
- **Feedback:** os cristais viram âmbar com uma onda de calor; som de
  transmutação.
- **Risco:** `generator` + `transmute` pode criar loop; o cooldown de 1 s e o
  limite de 2 cristais por evento seguram. Não afetar blocos de chefe.
- **Complexidade:** MEDIUM (troca de tipo de bloco + validação de célula).

> **Nota:** `transmute` é a única adição que depende de blocos especiais, que só
> aparecem a partir da fase 4. Como é T3, o jogador já os viu quando a compra
> fizer sentido. No Endless, aparecem a partir da onda 4.

---

## 7. Novo split starter / locked

### 7.1 Starters — 8

| Perk | Família | Máx. | Por que fica no dia 1 |
|---|---|---:|---|
| `multiball` | Cobertura | 2 | Ensina a ler múltiplas bolas; assinatura visual. |
| `wide_paddle` | Controle | 3 | Alavanca de controle nº 1 no mobile. |
| `power_ball` | Dano | 2 | Ensina que blocos têm HP; dano base confiável. |
| `quick_study` | Economia | 2 | Ensina o ritmo de level-up. |
| `giant_ball` | Controle | 2 | Hitbox e ângulos; segunda alavanca de controle. |
| `safety_net` | Aegis | 1 | Perdão inicial, agora 1×/fase. |
| `prism_laser` | Prism | 3 | Verbo ativo e raiz da família laser. |
| `foresight` | Controle | 1 | Alfabetização de trajetória; ajuda o onboarding. |

**Por que 8 e não 10:** com 3 cartas por oferta, 8 starters dão 37,5% de chance
por perk (vs. 30%). O jogador vê menos "sopa" e consegue levar duas linhas a
nível alto. Os dois starters rebaixados (`auto_turret` e `critical_strike`) viram
compras T1/T2 baratas, o que também encurta o primeiro unlock.

**Por que não 7:** `foresight` e `prism_laser` são as duas perks que mais ajudam
o jogador novo a entender o jogo (trajetória e verbo ativo). Cortar uma delas
empobrece a primeira run mais do que ganha em foco.

### 7.2 Locked — 18

| Tier | Perk | Custo | Máx. | Família | Por que é compra |
|---:|---|---:|---:|---|---|
| 1 | `last_stand` | 12 | 1 | Aegis | Clutch após perder bola; não é vida extra. |
| 1 | `critical_strike` | 15 | 3 | Dano | Primeiro dano "flashy"; barato. |
| 1 | `explosive_core` | 15 | 1 | Demolição | AoE automática; abre a build de demolição. |
| 1 | `sticky_paddle` | 18 | 1 | Controle | Verbo ativo avançado; primeiro "wow". |
| 2 | `auto_turret` | 32 | 3 | Dano | DPS passivo para quem divide atenção. |
| 2 | `sweet_spot` | 35 | 2 | Tempo | Recompensa posicionamento no centro. |
| 2 | `momentum` | 35 | 3 | Tempo | Escala de rally; perk de skill. |
| 2 | `bombardier` | 40 | 1 | Demolição | AoE com carga guardada. |
| 2 | `bossbane` | 45 | 2 | Warden | Tech de boss útil fora de boss. |
| 2 | `siege_ball` | 45 | 2 | Warden | Dano em alvo único; boss/obsidian. |
| 3 | `overcharge` | 55 | 2 | Prism | Payoff de cooldown do laser. |
| 3 | `shrapnel` | 60 | 1 | Demolição | Explosões viram corredores de dano. |
| 3 | `heavy_ball` | 60 | 2 | Controle | Trade-off velocidade/dano. |
| 3 | `hot_streak` | 70 | 2 | Tempo | Burst de combo. |
| 3 | `transmute` | 70 | 1 | Salvage | Manipulação de tabuleiro. |
| 4 | `overkill` | 100 | 1 | Demolição | Splash em cadeia; capstone. |
| 4 | `shield_bash` | 110 | 1 | Aegis | Paddle vira fonte de dano. |
| 4 | `conductor` | 120 | 1 | Prism | Capstone do laser. |

**Totais:** 8 starters + 18 unlocks = **26 perks**.
**Custo total:** T1 60 + T2 232 + T3 315 + T4 330 = **937 Sparks**.
**Níveis máximos:** 16 (starters) + 30 (locked) = **46**.
**Workshop:** 4 tiers, 18 cards; o card do menu mostra `8 / 26` no save novo e
`18 left`.

### 7.3 Leitura da curva

| Run | O que o jogador vê | Sparks esperados |
|---|---|---:|
| 1 (fase 1 completa) | 8 starters, 16 níveis possíveis; 1 T1 comprável | ~24 |
| 2 (fases 1–2) | 1–2 T1; começa a escolher família | ~54 |
| 3 (fases 1–3) | 2–3 T1; primeiro T2 no fim | ~84 |
| 4–5 | T2/T3; build reconhecível | ~140–190 |
| Campanha completa | ~211; T3/T4 no alcance | ~211 |

- **Primeiro unlock:** fim da fase 1 (~24 Sparks) já paga `last_stand` (12),
  `critical_strike` (15) ou `explosive_core` (15).
- **Primeiro T2:** depois de ~2 fases (~54), com `auto_turret` (32) ou
  `sweet_spot`/`momentum` (35).
- **Coleção completa:** ~4,5 campanhas completas ou ~7–8 runs curtas. O teto de
  250/run não é atingido numa campanha normal (~211).

### 7.4 Pré-requisitos

- Só a família laser tem pré-requisito: `overcharge` e `conductor` exigem
  `prism_laser`.
- Como `prism_laser` é starter, o pré-requisito **nunca** cria oferta morta.
- Regra nova: pré-requisito só pode apontar para starter ou para perk já
  comprada. Se um dia houver cadeia entre duas locked, o card da dependente
  mostra "Requires X" com botão direto para X; a dependente fica visível, mas
  **nunca entra em oferta** antes do pré-requisito.
- `transmute`, `shrapnel`, `siege_ball`, `sweet_spot` e `heavy_ball` não têm
  pré-requisito.

---

## 8. Ofertas e diluição

### 8.1 O problema

Com 26 perks e ~10 relevantes (não maxeadas, pré-requisitos ok), a chance de
três cartas inúteis numa oferta é:

`C(16,3) / C(26,3) = 560 / 2600 ≈ 21,5%`

Ou seja, quase 1 em 5 level-ups é lixo. Isso piora a sensação de progressão mais
que qualquer número de dano.

### 8.2 Regras recomendadas (fase 2, não v0.7)

1. **Nunca oferecer perk maxeada** (já existe).
2. **No máximo 1 stat-stick por oferta.** Contam como stat-stick: `power_ball`,
   `critical_strike`, `momentum`, `quick_study`, `giant_ball`, `wide_paddle`.
3. **Pelo menos 1 carta da família dominante** do jogador (a que tem mais
   níveis investidos; empate pelo maior custo). Se não houver carta elegível,
   relaxar para a segunda família.
4. **Nunca 3 cartas da mesma família.**

Efeito esperado: a oferta com 0 cartas relevantes cai de ~21,5% para <10%; a
oferta "power_ball + critical_strike + momentum" deixa de existir.

**Não implementar agora:** pesos por raridade, reroll, ban de perk ou oferta
garantida de keystone. Primeiro medir com as 4 regras acima.

---

## 9. Mapa de arquétipos da proposta

| Arquétipo | Fantasia | Raiz (dia 1) | Payoffs comprados | Capstone |
|---|---|---|---|---|
| **Prism** | Dano cirúrgico em coluna | `prism_laser` | `overcharge` | `conductor` |
| **Demolição** | Limpar o board em cascata | — (T1) | `explosive_core`, `bombardier`, `shrapnel`, `transmute` | `overkill` |
| **Tempo** | Não deixar a bola cair; snowball | — (T2) | `momentum`, `sweet_spot` | `hot_streak` |
| **Controle** | Dominar geometria e posição | `wide_paddle`, `giant_ball`, `foresight` | `sticky_paddle`, `heavy_ball` | — |
| **Aegis** | Sobreviver e virar o jogo | `safety_net` | `last_stand` | `shield_bash` |
| **Warden** | Tech de alvo único | — (T2) | `bossbane`, `siege_ball` | — |
| **Salvage** | Economia e tabuleiro | `quick_study` | `transmute` | — |

**Leitura:** quatro arquétipos têm raiz no dia 1 (Prism, Controle, Aegis e
Salvage); Demolição, Tempo e Warden são as aspirações de T1/T2. `multiball`,
`power_ball`, `auto_turret` e `critical_strike` formam o eixo transversal de
dano/cobertura. Nenhuma família tem mais de 5 peças, e nenhuma tem só
stat-sticks.

---

## 10. Impacto na economia e no Workshop

- **Custo total:** 700 → 937 Sparks. O aumento vem de 4 adições (210) e de duas
  promoções a T2/T1 (47), compensado por reduções de preço em `overcharge`,
  `hot_streak` e `heavy_ball` (−20).
- **Sparks por campanha:** ~211 com a fórmula atual (média de 36 blocos/onda e
  um marco de combo por onda). O teto de 250 continua sendo proteção, não meta.
- **Anti-farm:** mantém onda/combo/chefe 1× por onda por run; clear de fase
  continua pagando +6.
- **Endless:** paga os mesmos eventos; 15 ondas ~96 Sparks, 30 ondas ~198.
  Não é um loop degenerado hoje, mas monitorar. Se necessário, aplicar 0,7× nos
  eventos de Endless e devolver 30% para ondas abaixo do recorde — **não** fazer
  isso sem medir.
- **Workshop:** o card do menu passa a `8 / 26` e `18 left`; o diálogo tem 18
  cards em quatro tiers. Adicionar **tag de família** em cada card e um selo
  **Recommended** nos três T1 mais baratos (`last_stand`, `critical_strike`,
  `explosive_core`), sem bundle e sem desconto.
- **Save:** nenhum schema novo. Se as substituições usarem IDs novos
  (`last_stand`, `heavy_ball`), adicionar um mapa de migração de valor
  `second_chance → last_stand` e `laser_focus → heavy_ball` em `sanitizeMeta`,
  mantendo os IDs antigos como alias por uma versão. Isso **não** muda o schema
  v2, mas muda o conteúdo do save; requer aprovação.

---

## 11. Riscos

| Risco | Mitigação |
|---|---|
| **Primeira run pobre** com 8 starters e `power_ball` máx. 2 | `safety_net` 1×/fase + `foresight` + `giant_ball`; medir conclusão da fase 1 |
| **Diluição** com 26 perks | Pool inicial 8; remoção de maxeados; 4 regras de oferta na fase 2 |
| **Grind** após a 4ª run | T2 baratos (32–45) mantêm ~1 compra/run; custo total 937 |
| **Power creep de T4** | Preços 100–120; caps de splash/chain; T4 não aparece antes de ~run 8 |
| **`safety_net` fraca demais** após 1×/fase | Se a fase 1 ficar <60% de conclusão, voltar para 1× a cada 2 ondas |
| **`Last Stand` parece vida extra** | Texto "after losing a ball" + tag no HUD; não salva a última bola |
| **`Heavy Ball` deixa o jogo lento** | Cap de −20%; não afeta paddle nem laser; medir tempo de onda |
| **`Transmute` gera loop com `generator`** | Cooldown 1 s; só `crystal`; não afeta blocos de chefe |
| **Migração de save** | Alias map + teste de save antigo; sem mudar schema v2 |
| **Jogador não entende locked** | Tag de família, "Requires X", descrição completa e selo Recommended |
| **Perk comprada fica sem efeito** (pré-requisito) | Regra: pré-requisito só aponta para starter ou já comprada |

---

## 12. Roadmap de implementação

### Fase 1 — Catálogo e tuning (sem comportamento novo)

- `src/content/perks.ts`: descrições, `maxLevel`, `requires`.
- `src/content/meta.ts`: novo split, tiers, custos, ordem.
- `src/game/config.ts`: constantes novas (`sweetSpotDamage`, `siegeBallStep`,
  `heavyBallSlow`, `shrapnelDamage`, `transmuteMaxTargets`, etc.).
- `src/game/contracts.ts`: campos de `RunModifiers` para as novas perks.
- `src/i18n/en.ts`: textos de Workshop, card e HUD.

### Fase 2 — Reworks

- `safety_net` por fase; `power_ball` máx. 2; `quick_study` +12%; `momentum`
  reset por tempo; `bossbane`; `overkill`; `shield_bash`; `bombardier`;
  `hot_streak`; `auto_turret`; `critical_strike`.
- Testes unitários por perk em `tests/perks.test.ts` / `tests/tier4Perks.test.ts`.

### Fase 3 — Novas perks

- `sweet_spot`, `siege_ball`, `shrapnel`, `transmute` em `World.ts`,
  `RunState.ts` e `contracts.ts`.
- Testes de comportamento e de cap (shrapnel 4 direções, transmute 2 cristais,
  siege stacks, sweet spot uptime).

### Fase 4 — Workshop e migração

- `WorkshopDialog` com 18 cards, tags de família, `8 / 26`, `18 left`.
- Alias map de save (`second_chance → last_stand`, `laser_focus → heavy_ball`),
  se aprovado.
- E2E de compra, persistência, reload, contagem e layout 320/390.

### Fase 5 — Ofertas (opcional)

- Tags de família/role no catálogo.
- Regras 1–4 em `RunState.takeOffers()`.
- Teste de distribuição de ofertas (1000 seeds) e de "0 cartas relevantes".

### Fase 6 — Gates e playtest

- Bateria completa do AGENTS.md: `typecheck`, `test`,
  `validate:content`, `validate-bridge-config`, `build`, `test:e2e`,
  `package`.
- Playtest com as métricas da seção 13.

---

## 13. Métricas e critérios de aceite do próximo playtest

| Métrica | Meta |
|---|---|
| Sparks medianos na fase 1 / campanha | ≥24 / ≥190 |
| % de jogadores com ≥1 unlock após a fase 1 | ≥90% |
| Tempo mediano até o 1º unlock | ≤12 min |
| Pick rate máximo de qualquer perk | ≤35% |
| Pick rate mínimo (perks elegíveis) | ≥3% |
| Ofertas com 0 cartas relevantes | ≤10% |
| Runs com ≥1 perk T3 (jogadores com 5+ runs) | ≥60% |
| Runs até a coleção completa (mediana) | 5–8 |
| Conclusão da fase 1 em jogadores novos | ≥60% |
| Uptime do `sweet_spot` | ≤70% |
| Tempo de onda densa com `heavy_ball` 2 vs. sem | ≤1,25× |

**Critério de bloqueio:** se o tempo até o primeiro unlock passar de 15 min ou a
coleção passar de 9 runs, cortar 15% dos custos de T3/T4 antes de mexer na
fórmula de Sparks.

---

## 14. Decisões pendentes (para o dono)

1. **Split 8/18:** aprovar o rebaixamento de `auto_turret` (T2 32) e
   `critical_strike` (T1 15) e a manutenção de `foresight`, `giant_ball` e
   `prism_laser` como starters?
2. **Substituições:** aprovar `second_chance → last_stand` e
   `laser_focus → heavy_ball`? Usar IDs novos com alias map ou manter os IDs
   antigos com nome/behavior novos?
3. **`safety_net`:** 1×/fase é o corte certo, ou preferir 1× a cada 2 ondas?
4. **`power_ball` máx. 2:** aprovar o nerf? Se não, `overkill` precisa de outro
   desenho para não ser win-more.
5. **Custo total 937:** aprovar os novos preços (T1 12–18, T2 32–45, T3 55–70,
   T4 100–120)?
6. **Novas perks:** aprovar as 4 adições (`sweet_spot`, `siege_ball`,
   `shrapnel`, `transmute`) ou reduzir a 2 para diminuir o escopo?
7. **Ofertas:** implementar as 4 regras na v0.7 ou deixar para a v0.8?
8. **Playtest:** aprovar as metas da seção 13 como critério de aceite?

---

## Apêndice A — Ideias consideradas e descartadas

| Ideia | Por que não entra agora |
|---|---|
| Refraction Chain (laser fork) | Aumentaria a família laser para 4 de novo; já vamos substituir `laser_focus` para enxugar. |
| Photon Reservoir (cargas de laser) | Mesmo motivo; dependente de uma família que queremos simplificar. |
| Charge Lance (segurar e soltar) | HIGH complexity e input de precisão; reservar para uma futura build de laser. |
| Fuse Cutter (bombas a cada 6 kills) | Redundante com `explosive_core` (8 kills) e `bombardier` (10 kills). |
| Chain Reaction (explosões acordam explosivos) | O jogo **já** encadeia blocos explosivos com profundidade 3; a ideia não adiciona nada. |
| Metronome (cada 6º paddle hit) | Concorre com `shield_bash` pelo mesmo contador e pelo mesmo espaço de feedback. |
| Overflow (combo >20 vira dano guardado) | Sobreposto a `momentum`/`hot_streak`; o terceiro perk de combo pode esperar. |
| Tempo Debt (combo decai 2× e paga 2×) | Interessante, mas exige UI de decay e tuning fino; reservar. |
| Ballast Anchor (ancorar a paddle) | Input de arrastar para baixo + cargas; HIGH complexity no mobile. |
| Gravity Well (ímã no terço inferior) | Reduz expressão de skill; o jogo já tem `foresight` e `giant_ball` para controle. |
| Bulwark Plating (bloco que toca a paddle leva dano) | **Impossível:** blocos não caem nem tocam a paddle. |
| Undertow (slow-mo após perder bola) | Sobreposto a `last_stand`/`safety_net`. |
| Prospector (multiplicador rende mais) | Blocos `multiplier` só aparecem na fase 5/Endless 9+; carta morta no early. |
| Weakpoint Analyst (centro da paddle marca alvo) | Fundido em `siege_ball` + `sweet_spot` para não ter dois perks de centro. |
| Executioner (executar alvos com pouco HP) | Sobreposto a `overkill` e `shrapnel`; a família demolição já tem 5 peças. |
| Split Shot / Echo Ball | Aumentariam a família de cobertura; `multiball` já cobre o eixo. |

## Apêndice B — Contas usadas

- **Chance por oferta:** `3 / N`, com `N` = perks elegíveis no pool.
- **Diluição:** `C(N - R, 3) / C(N, 3)`, com `N` = 26 e `R` = 10 relevantes.
- **Sparks por onda:** `1 + floor(blocos / 12)`; combo 5/10/15 = +1 cada;
  chefe +3; clear +6; first clear +6.
- **Sparks por campanha:** ~211 (20 ondas, ~36 blocos/onda, 1 marco de combo por
  onda, 3 chefes, 6 clears).
- **Dano esperado (atual):** `power_ball` 2/3/4; crítico 1,08/1,16/1,24×;
  `hot_streak` +1/+2; `momentum` +10/20/30%. **Proposta:** `power_ball` 2/3;
  `siege_ball` +45/60% no alvo; `sweet_spot` +1/+2; `heavy_ball` +1/+2.
- **Custo total:** 60 (T1) + 232 (T2) + 315 (T3) + 330 (T4) = 937.
