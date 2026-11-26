# GDD Bricklike

**Nome oficial:** Bricklike. O repositório, o pacote e os identificadores
técnicos continuam `blockbreaker` para preservar URLs e builds.
**Documento de design para orientar a campanha e as próximas fases do jogo**  
**Versão:** 1.14  
**Data:** 2026-11-26  
**Status:** linha **0.7.2** local na `main`: Mundos II/III, save v3, tutorial simplificado, pierce, Bridge 2.4.4 e correção do ímã do último bloco. Jogo aceito na Playgama; build em auto-certificação. Sem tag/release.  
**Plataforma-alvo:** Web HTML5, orientação portrait

## Resumo do projeto

Um block breaker arcade clássico, em formato portrait, com progressão roguelite. O jogador move o rebatedor, controla a trajetória das bolinhas e destrói formações de blocos. Blocos concedem XP; ao subir de nível, a partida pausa e apresenta três perks aleatórios para escolher um. As combinações mudam a run e criam alta rejogabilidade em sessões curtas.

A campanha atual tem **3 mundos, 18 fases e 69 ondas** de campanha (mais o tutorial: **19 fases e 71 ondas**), **17 tipos de bloco**, **10 elementos de fase**, **9 chefes** e **22 perks**. A v0.3.0 adicionou o **modo Endless**: uma fase infinita com ondas procedurais, progressão de dificuldade e chefes recorrentes, sem alterar a campanha. A v0.4.0 adicionou a revisão visual/menu, o HUD compacto, How to Play/About Us, settings completos e o sistema de ads com rewarded revive. A v0.5.1 adicionou o **tutorial jogável e pulável**, o **edge assist do toque**, o **gate explícito do laser** e uma **nova política de ads**. A v0.6.0 adicionou a **metaprogressão horizontal**: 10 perks iniciais, 9 unlocks compráveis com **Sparks**, **Workshop** no menu, **save v2** e quatro perks reworkadas — **Momentum**, **Bombardier**, **Boss Slayer** e **Hot Streak**. A v0.6.1 adiciona o **Tier 4** — **Overkill**, **Shield Bash** e **Conductor** —, reequilibra a **economia de Sparks** (fórmula por onda, marcos de combo, clear/first clear e teto de 250) e promove o **Workshop** a card de progressão com contagem e barra. A `0.6.1` foi publicada no itch.io e no sandbox da Playgama em 2026-11-12, após testes básicos; a `0.5.1` é a build anterior e `0.1.0-mvp` é histórica. A **linha 0.7** (fechada como **0.7.1**) adiciona os Mundos **II · Neon Lattice** e **III · Rustwake**, save v3, 9 chefes, blocos/elementos novos, kit físico de belt/rail/gust e debug de ondas; está implementada localmente, sem publicação. Em 2026-11-23 o **tutorial foi simplificado**: 2 ondas, 12 blocos, 15 XP, uma perk e dois coach marks, com botões e texto maiores, paddle 2× e ímã no último bloco. No mesmo dia, **Giant Ball** passou a +40% de raio por nível e a bola ganhou uma rampa de cor por dano (branco → amarelo → laranja → vermelho → roxo). Em 2026-11-24 entrou o **pierce**: um hit direto da bola que destrói o bloco com pelo menos 1 de dano excedente atravessa em vez de quicar. A linha foi fechada como **0.7.1** local, sem publicação. Em 2026-11-26 o jogo foi **aceito e publicado no catálogo da Playgama**; a auto-certificação da atualização para a 0.7.1 reprovou o Bridge 2.4.1. A **0.7.2** atualiza o SDK para **2.4.4** e corrige o **ímã do último bloco** do tutorial, que podia deixar a bola em órbita sem atingir o alvo.

### Como ler os status

- **Confirmado:** escolha expressa pelo jogador ou consolidada no design.
- **v0.7.0-dev:** implementado localmente (Mundos II/III, save v3, kit físico, mapas por mundo e debug de ondas); não publicado.
- **v0.7.1:** linha fechada localmente em 2026-11-24; adiciona tutorial simplificado/assistido, Giant Ball maior, cor da bola por dano e pierce. Não publicada.
- **v0.7.2:** patch de 2026-11-26; Playgama Bridge **2.4.4**, correção do ímã do último bloco e bump de versão. Jogo aceito na Playgama; build em auto-certificação. Sem tag/release.
- **v0.6.1:** implementado e validado no ciclo anterior (Tier 4, economia de Sparks, feedback de HUD e card do Workshop).
- **v0.6.0:** implementado e validado no ciclo anterior (perks reworkadas, primeira economia de Sparks, Workshop e save v2).
- **v0.5.1:** implementado e validado no ciclo anterior (tutorial, controles touch e política de ads).
- **v0.4.0:** implementado e validado no ciclo anterior (apresentação, ads e UX).
- **v0.3.0:** implementado e validado na expansão anterior (modo Endless).
- **v0.2.0:** implementado e validado na expansão da campanha.
- **MVP:** recorte original de `0.1.0-mvp`.
- **Futuro:** ideia aceita como possibilidade, sem compromisso de implementação.
- **Em aberto:** parâmetro ou regra que ainda precisa de decisão ou teste.

## 1. Visão e pilares

### High concept

Block breaker arcade clássico com elementos roguelite: destruir blocos rende XP, e cada evolução oferece uma escolha de perk que transforma a partida.

### Pilares confirmados

- Sensação e controles de um block breaker clássico.
- Evolução perceptível ao longo das ondas e das fases.
- Alta rejogabilidade por meio de combinações diferentes de perks a cada run.
- **Builds com sinergias e chefes:** as escolhas de perk se combinam em arquétipos reconhecíveis, e cada fase nova termina em um chefe que testa a build.
- Habilidade manual no início da run e sensação crescente de poder conforme as sinergias de perks se acumulam.
- Sessões rápidas e fáceis de reiniciar; a referência é uma run curta por fase.

## 2. Loop principal

1. No primeiro acesso, jogar o **Tutorial** curto e pulável: mover, lançar, quebrar blocos e ver o primeiro level up.
2. Mover o rebatedor horizontalmente para posicionar a rebatida.
3. Controlar ângulo e trajetória para conduzir as bolinhas por corredores e aberturas entre os blocos.
4. Quebrar blocos comuns e **blocos especiais** (explosivo, regenerativo, móvel, multiplicador, gerador e ligado), usando o comportamento de cada um a favor da run.
5. Interagir com os **elementos da fase** — paredes, obstáculos, defletores, portais, mecanismos móveis, rotores e portões temporizados.
6. Receber XP por blocos destruídos e preencher a barra de nível.
7. Ao subir de nível, pausar a partida e escolher um entre três perks aleatórios.
8. Retomar a onda com a nova combinação de habilidades; limpar todos os blocos — e o **chefe**, quando houver — para iniciar a próxima onda.
9. Sobreviver às ondas com **desafio** (`timeLimit`, `noLaser`, `noMultiball`, `gust`) e concluir a fase; as fases finais de cada mundo terminam em chefe e a fase 18 fecha a campanha.
10. Acumular **Sparks** ao concluir ondas, chefes e fases; no menu, gastar Sparks no **Workshop** para desbloquear novas perks para as próximas runs.

**Derrota:** nenhuma bolinha permanece ativa em jogo, ou o tempo de uma onda com `timeLimit` chega a zero.  
**Vitória de fase:** limpar todas as ondas previstas, incluindo o chefe quando a onda o define.  
**Tutorial:** 2 ondas, 12 blocos e 15 XP; o primeiro perk chega após 3 dos 4 blocos da primeira onda (75%) e concluir ou pular libera o level 1 em save novo. O paddle do tutorial é 2× mais largo e, quando resta um bloco, a bola é levemente puxada para ele.  
**Campanha:** 3 mundos de 6 fases. Mundo I 20 ondas, Mundo II 22, Mundo III 27 (69 no total); com o tutorial, 19 fases e 71 ondas.

### Modo Endless (v0.3.0)

- **Acesso:** botão **Endless** no menu principal, separado de Campaign e da seleção de fases.
- **Estrutura:** uma run única em uma fase infinita (`endless`), sem vitória; a run termina quando todas as bolas caem.
- **Velocidade:** base **660**, **+14 por onda**, teto **1100**. A velocidade passa de **780 na onda 10** (786) e satura em **1100 na onda 32**.
- **Linhas:** começam em **4** e crescem até **12**; a densidade sobe de ~55% para ~92%.
- **Blocos especiais:** introdução gradual — `moving` (onda 4), `explosive` (5), `regenerative` (7), `multiplier` (9), `linked` (11) e `generator` (13).
- **Elementos:** `wall` (2), `deflector` (4), `portal` (6), `mover` (8), `gate` (10) e `rotor` (12); a partir da onda 14 a geração combina os **7** tipos.
- **Chefes:** a cada **5 ondas**, alternando os padrões sentinel/warden/void (Frost Sentinel, Ember Warden e Void Herald), com HP **`40 + wave × 6`**.
- **XP e perks:** a mesma curva da campanha; os perks persistem entre ondas. **Second Chance** continua valendo uma vez por run e pode coexistir com o rewarded revive.
- **Results:** mostram **Wave**, **Best wave**, score, level e perks; **sem botão Next**. Retry recomeça uma run Endless e Menu volta ao menu.
- **Save:** `endless: { bestWave, bestScore, runs }` dentro de `bb.save` v1; saves antigos caem em zeros.
- **Progressão:** o Endless **não desbloqueia fases da campanha**; os recordes são apenas pessoais.
- **Desbloqueio (v0.4.0):** o Endless só é liberado depois que a campanha
  inteira (fase 6) for concluída. O botão fica visivelmente bloqueado e, ao ser
  tocado, abre um diálogo explicando o requisito.

### Menu, seleção de fases e configurações (v0.5.1; Workshop na v0.6.1)

- **Menu:** dois caminhos principais — **Campaign** e **Endless** — sem o texto
  de MVP `XP · Perks · Levels` e sem o rodapé de controles. O rodapé mostra
  **How to Play**, **Settings**, **About Us** e a versão.
- **Workshop (v0.6.1):** card de progressão no menu com ícone, saldo de
  **Sparks**, badge **Ready** quando há uma perk comprável, contagem
  `X / 22 unlocked`, `N left` e barra de progresso; abre um diálogo com **12
  cards em quatro tiers**, custo, descrição e estado
  (`owned`/`affordable`/`locked`).
- **Campaign:** card principal com progresso, fase atual, nós de progresso e CTA
  `Continue`/`Start campaign`. Abre a seleção de fases.
- **Tutorial:** card próprio antes das seis fases, com badge “Start here”. Em
  save novo, o level 1 fica bloqueado até concluir ou pular o tutorial.
- **Endless:** card secundário com recorde de onda e runs; bloqueado até o fim
  da campanha.
- **Aviso de storage:** se o diagnóstico da plataforma cai em memória/fallback,
  o menu mostra **“Progress may not be saved”**; o clique abre um popup
  explicando que progresso e settings podem ser perdidos ao fechar a página.
- **Fundo do menu:** camada Phaser de apresentação com bolinhas luminosas
  quicando, trilhas curtas e partículas discretas. A onda 1 da fase 1 não é
  mais usada como fundo. Respeita reduced motion.
- **Seleção de fases:** um mapa-trilha por mundo, com nós temáticos, bottom
  sheet, parallax e pílulas I/II/III. O Mundo I tem tutorial + 6 fases; os
  Mundos II/III têm 6 fases cada; fases finais destacam o chefe.
- **Settings:** diálogo com **Sound**, **Music** e **Screen shake**,
  persistidos em `bb.settings`. O pause oferece os mesmos três controles.
- **How to Play:** diálogo de cinco páginas com screenshots reais e textos
  curtos sobre movimento/lançamento, XP/perks, builds, chefes e Endless.
- **About Us:** diálogo no rodapé com a logomarca **Bad Decision Games** e o
  texto de apresentação do estúdio.
- **HUD compacto:** abaixo de 440 px de shell, o HUD troca rótulos por ícones e
  usa valores de 11–13 px; legível em iframes 907×510/800×450.
- **Blocos:** direção visual “arcade tile” — corpo saturado, bisel, sombra,
  brilho, materiais distintos e leitura em 46 px, alinhada às capas.
- **Coach marks do tutorial:** dois passos — mover/lançar e blocos especiais —
  com texto de 15–17 px, botão primário **Continue** e **Skip tutorial** em
  contraste alto. Chefes e Endless saíram do tutorial e ficam no How to Play.

## 3. Regras de gameplay confirmadas

### Controles e trajetória

- Orientação portrait; controle principal por toque e deslize horizontal para mover o rebatedor.
- Também há mouse absoluto e teclado (setas/A-D) no desktop.
- **Toque:** o drag é relativo e 1:1 no centro do campo. Nos **22% externos** de cada lado, o ganho cresce progressivamente até **2,2×** para o paddle alcançar a borda antes do dedo e evitar o gesto de borda do navegador. O limite de velocidade do paddle não muda.
- **Mouse e teclado:** mouse continua absoluto; teclado continua igual.
- **Tutorial:** o primeiro acesso abre uma run guiada, curta e pulável. São dois coach marks pausados com **Continue** (mover/lançar e blocos especiais). A primeira onda tem 4 blocos de 1 HP quatro linhas abaixo do topo e o primeiro perk chega ao destruir 3 (75%); a segunda combina blocos de 1 HP, de 2 HP e um explosivo. O paddle é **2× mais largo** e, quando resta um bloco, a bola é levemente puxada para ele, com anel e tether visuais. Chefes e Endless ficam no **How to Play**, que complementa mas não substitui o tutorial.
- **Zoom de layout:** formações altas reduzem a escala do campo (blocos, elementos e chefe) para manter tudo visível entre o HUD e o paddle. Não é zoom de câmera: o paddle, a bola e o mapeamento de input não mudam.
- **Sticky Paddle:** prende a bola ao rebatedor e solta com tap/toque; há soltura automática de segurança após 2,5 s.
- **Prism Laser:** exige **lançamento explícito da bola na onda** e pelo menos uma bola solta (`!ball.stuck`). Bolas criadas por debug ou multiball não substituem o lançamento. Ao resetar a onda, o laser fica bloqueado até o jogador lançar; o HUD mostra **“Launch the ball first”**. Sticky pode bloquear de novo depois do lançamento.

### Bolinhas, vidas e falha

- A run tem uma vida compartilhada: perder uma bolinha não encerra a partida enquanto outra estiver ativa; perder todas encerra a run.
- Perks e elementos da fase podem criar bolinhas simultâneas. A multiplicação aumenta o poder de destruição e a carga de controle.
- Perks podem salvar uma bolinha ou prevenir/reverter uma derrota. Não há vidas separadas por bolinha.
- **Second Chance** revive a run uma vez por run, com uma bola nova presa ao paddle.
- Alguns perks alteram propriedades físicas das bolinhas. Perks de bolinha são passivos ou automáticos; poderes ativáveis pertencem ao rebatedor.
- **Velocidade no Endless:** as regras de laser (bola solta, dano e cooldown) são as mesmas da campanha, mas a velocidade da bola começa em **660**, sobe **14 por onda** e satura em **1100**. O limite de **780** vale apenas para a campanha.

### Pierce (v0.7.1)

- **Regra:** se um hit **direto da bola** destrói o bloco com **pelo menos 1 de dano excedente** (`dano − HP atual ≥ 1`), a bola atravessa sem quicar. Se o dano for igual ou menor que a vida, ela destrói e quica normalmente.
- Exemplos: 2 de dano contra 1 HP atravessa; 2 contra 2 destrói e quica; 3 contra 2 atravessa. Dano fracionário (Momentum) só atravessa se o excedente chegar a 1 inteiro.
- **Escopo:** vale apenas para a bola. Laser, projéteis, explosões, links e Shield Bash não atravessam; chefes e elementos não são perfurados. Blocos `phased` blindados continuam bloqueando sem dano.
- **Overkill:** continua usando o mesmo excesso para o splash nos quatro vizinhos. Os dois efeitos coexistem e ficam em observação no playtest; se ficar dominante, a alternativa é separar pierce e splash.
- **Feedback:** evento `block:pierced`, SFX próprio (zip curto), anel/partículas na cor do dano e a bola continua na mesma linha. A rampa de cor da bola comunica o potencial de pierce.

### Ondas, XP e perks

- A próxima onda começa somente quando todos os blocos da onda atual forem destruídos; em ondas com chefe, o chefe também precisa cair.
- Cada bloco destruído concede XP. A curva atual é `8 / 20 / 26 / 33 / 39 / 46…` (base `20 + 10 × (level − 1)`, multiplicador global de 0,65 e desconto de primeiro nível).
- Ao preencher a barra de XP, a partida pausa automaticamente; três opções aleatórias de perk aparecem e o jogador escolhe uma.
- O catálogo usa um modelo híbrido: alguns perks podem ser escolhidos repetidamente e evoluem por níveis; outros são únicos. Limites variam por perk.
- **Pool da run (v0.6.1):** as ofertas consideram apenas as **10 perks iniciais** e as perks já compradas no Workshop; perks bloqueadas nunca aparecem. Conductor exige Prism Laser.
- **Regras de onda:**
  - `timeLimit`: a onda tem contagem regressiva; se o tempo zerar antes da limpeza, a run termina em derrota. O HUD mostra o tempo restante.
  - `noLaser`: o Prism Laser fica desabilitado apenas naquela onda; o perk continua adquirido para as ondas seguintes.
  - `noMultiball`: a onda permite apenas uma bola; perks de multiball não criam extras.
  - `gust`: rajadas laterais em ciclo; a aceleração é normalizada para preservar a velocidade da bola.
- Ofertas são três cards distintos, sem reroll; um perk interno de fallback (**Arcane Insight**, +XP) preenche a oferta quando faltam opções elegíveis.

### Ataques do rebatedor

- Perks podem conceder ataques automáticos, como disparos periódicos, laser e projéteis, e ataques manuais acionados pelo jogador.
- Controles de habilidade aparecem de forma contextual, somente quando um perk exigir esse comando, para manter a interface inicial limpa.
- Poderes do rebatedor e propriedades da bolinha são sistemas separados. O jogador explicitamente não quer poderes ativáveis disparados pelas bolinhas.

## 4. Blocos, elementos e desenho das fases

### Blocos

O Mundo I usa 9 tipos; a campanha completa usa **17**. `behavior` dirige a
simulação e o renderer; `hp`, `score` e a arte continuam sendo a fonte de
verdade. A resistência é comunicada por cor, material, pips de HP e estado
visual, sem depender exclusivamente da cor. Os 8 tipos dos Mundos II/III estão
detalhados na seção “Campanha multi-mundo”.

| id | char | HP | Score | Comportamento |
|---|---|---:|---:|---|
| `crystal` | `1` | 1 | 10 | `none` — bloco básico |
| `stone` | `2` | 2 | 20 | `none` — resistência intermediária |
| `obsidian` | `3` | 3 | 30 | `none` — resistência alta, com runas |
| `explosive` | `e` | 2 | 25 | `explosive` — ao ser destruído, causa 2 de dano a blocos a até 1 célula (inclui diagonais), com profundidade máxima 3 |
| `regenerative` | `r` | 3 | 30 | `regenerative` — recupera 1 HP a cada 3,5 s até o máximo; o timer reinicia ao levar dano |
| `moving` | `m` | 2 | 20 | `moving` — oscila horizontalmente ±0,22 célula, período de 2,4 s; a colisão usa o AABB atual |
| `multiplier` | `x` | 1 | 30 | `multiplier` — ao ser destruído, ativa `xpFactor = 2` e `scoreFactor = 2` por 6 s |
| `generator` | `g` | 3 | 40 | `generator` — a cada 5 s cria um `crystal` em célula vazia adjacente, até 3 gerações |
| `linked` | `l` | 2 | 20 | `linked` — blocos conectados ortogonalmente formam grupo; dano em um membro propaga 1 de dano aos demais (com guarda de recursão) |

- XP por bloco = HP máximo.
- A introdução é gradual: as fases 1–3 usam só os três blocos básicos; a fase 4 introduz `moving`, `explosive` e `regenerative`; a fase 5, `multiplier` e `linked`; a fase 6 combina todos e adiciona `generator`.

### Elementos de fase

São 7 tipos, definidos como união discriminada de `LevelElement`, todos em coordenadas de célula e com a mesma escala do campo.

| kind | Comportamento | Campos principais |
|---|---|---|
| `wall` | parede indestrutível, AABB; bloqueia bola, projéteis e laser | `col`, `row`, `widthCells`, `heightCells` |
| `obstacle` | obstáculo indestrutível, arte distinta da parede; mesmo bloqueio | idem |
| `deflector` | segmento diagonal que reflete a bola com a normal do segmento | `angleDeg` |
| `portal` | par de portais; teleporta a bola preservando a velocidade | `pairId` |
| `mover` | AABB oscilante horizontal ou vertical | `axis`, `rangeCells`, `periodMs`, `phaseMs` |
| `rotor` | segmento girando em torno do centro | `lengthCells`, `periodMs`, `phaseMs` |
| `gate` | parede que abre e fecha em ciclo; só colide quando fechada | `closedMs`, `openMs`, `phaseMs` |

Regras:

- `wall` e `obstacle` colidem com bola, projéteis e laser.
- Laser e projéteis são bloqueados por `wall`/`obstacle`; portais não os afetam.
- `deflector` e `rotor` refletem a bola com a normal do segmento.
- `portal` tem cooldown de 300 ms por bola para evitar loop.
- `mover` e `gate` usam AABB; `gate` só colide quando fechado.
- `rotor` usa micro-passos de no máximo 8 px para não atravessar.

### Chefes

`WaveDef.boss` define o chefe da onda. O chefe é uma entidade grande, com HP próprio, movimento horizontal e ataques periódicos. A onda só limpa quando todos os blocos **e** o chefe estiverem destruídos.

| Fase | Chefe | HP | Padrão | Shards por ataque | Intervalo base |
|---|---|---:|---|---:|---:|
| 4 | Frost Sentinel | 60 | move devagar | 1 | 5,0 s |
| 5 | Ember Warden | 80 | move médio | 2 | 4,5 s |
| 6 | Void Herald | 100 | move rápido | 3 | 4,0 s |

Regras:

- Bola, laser, projétil, explosão e bomba causam dano ao chefe.
- O chefe tem 3 fases internas: acima de 66% de HP, entre 66% e 33% e abaixo de 33%. O intervalo entre ataques cai 15% a cada fase; a quantidade de shards é fixa pelo padrão do chefe.
- Shards descem lentamente; ao acertar o paddle, aplicam **corrosão**: −6% de largura do paddle por stack, até 3 stacks, válido até o fim da onda.
- O chefe pisca, recua levemente e emite evento ao levar dano.
- A morte do chefe dispara explosão, áudio e o encerramento da fase.

### Desafios de onda

| Onda | Fase | Regra |
|---|---|---|
| `p4w2` | Frostbound Spire | `timeLimit` 65 s |
| `p5w2` | Emberforge | `noLaser` |
| `p5w3` | Emberforge | `timeLimit` 60 s |
| `p6w2` | Void Threshold | `timeLimit` 75 s |
| `p6w4` | Void Threshold | `noLaser` |

### Campanha

| # | Nome | Ondas | Velocidades de bola | Tema | Novidade |
|---|---|---:|---|---|---|
| 0 | Tutorial | 2 | 520 / 560 | tutorial | mover, lançar, primeira perk e bloco explosivo |
| 1 | Crystal Grove | 2 | 572 / 616 | crystal | base |
| 2 | Ruined Halls | 3 | 616 / 660 / 704 | ruins | stone/obsidian |
| 3 | Arcane Depths | 3 | 638 / 682 / 726 | arcane | densidade |
| 4 | Frostbound Spire | 3 | 660 / 682 / 704 | frost | moving, explosive, regenerative, wall, deflector, Frost Sentinel |
| 5 | Emberforge | 4 | 682 / 704 / 726 / 748 | forge | multiplier, linked, portal, gate, mover, rotor, Ember Warden |
| 6 | Void Threshold | 5 | 704 / 726 / 748 / 770 / 780 | void | generator e todos os especiais, rotor, mover, Void Herald |

- Com o tutorial: **19 fases**, **71 ondas**, **2.781 blocos**, **9.392 XP** no conteúdo validado.
- Campanha pura: **18 fases**, **69 ondas**; Mundo I 727 blocos / 1.777 XP.
- Blocos por fase (sem tutorial): 54 / 90 / 94 / 103 / 136 / 250.
- XP por fase (sem tutorial): 76 / 212 / 262 / 229 / 348 / 650.
- Tutorial: 12 blocos, 15 XP, 1 level up (4 blocos de 1 HP na primeira onda; 8 blocos na segunda).
- Cada fase termina em results; a vitória desbloqueia a fase seguinte.
- A fase 6 termina com o Void Herald e fecha o Mundo I; a fase 18 termina com o Last Engine e fecha a campanha.
- A fase 6 inclui uma onda alta (12 linhas esparsas) para exercitar o zoom de layout.
- A dificuldade (HP médio × densidade) não regride entre ondas e fases; o validador permite tolerância de 5% e exclui ondas de chefe do ritmo por densidade.

### Campanha multi-mundo (v0.7.0)

A campanha passa a ter **três mundos de seis fases**, com o tutorial apenas no
Mundo I. A progressão é contínua por `unlockedPhase` (0..18):

| Mundo | Fases | Ondas | Velocidades | Chefes |
|---|---|---:|---|---|
| I · Crystal Vale | 1–6 | 20 | 616–780 | Frost Sentinel, Ember Warden, Void Herald |
| II · Neon Lattice | 7–12 | 22 | 640–896 | Nullframe Warden, Maglev Dreadnought, Lattice Hierophant |
| III · Rustwake | 13–18 | 27 | 700–920 | Boiler Matron, The Riveter, The Last Engine |

- As velocidades têm **overlap** entre mundos: o Mundo II abre em 640, abaixo
  do fim do Mundo I; o Mundo III abre em 700, abaixo do fim do Mundo II.
- O teto por mundo é **780 / 900 / 920**; rails podem elevar a velocidade em
  jogo até o **hard cap de 1.100**.
- O clear da fase 6 abre o Mundo II e o clear da fase 12 abre o Mundo III.
- O primeiro clear da fase final de cada mundo paga **+30 Sparks**.
- Totais validados: **19 fases, 71 ondas, 2.781 blocos, 9.392 XP**.
- Save **v3**; `campaignComplete` continua significando “Mundo I concluído” e
  libera o Endless. O clear dos Mundos II/III é derivado de `phases`.

#### Blocos e elementos dos mundos novos

- Blocos: `alloy` (HP 4), `bastion` (HP 5), `entangled`, `relay`, `phased`,
  `plated`, `fused`, `splitting`.
- Elementos: `press` (AABB vertical), `belt` (gira o vetor preservando o
  módulo) e `rail` (acelera até o hard cap).
- Regras: `noMultiball` (uma bola) e `gust` (aceleração lateral normalizada
  para preservar a velocidade).
- Chefes novos usam os padrões `spread`, `charger`, `aimed`, `matron`,
  `riveter` e `engine`, reutilizando a entidade de chefe existente.

#### Mapas de seleção por mundo

Cada mundo tem seu próprio mapa-trilha em `390×900`, com quatro camadas
parallax (0.6/0.8/1.0/1.15) e paleta própria. O header traz as pílulas
`I / II / III`; tutorial e nó ∞ existem apenas no Mundo I. Em `?debug=1`, todas
as fases e mundos aparecem desbloqueados e o sheet permite escolher a onda
inicial.

### Zoom dinâmico do campo

Não é zoom de câmera (isso quebraria o mapeamento de input). É uma **escala do layout** de blocos, elementos e chefe, com o paddle e a bola no tamanho normal.

- `computeFieldScale(rows, columns, extraRows)` em `src/sim/layout.ts`.
- Altura de referência: 1280 unidades (mínimo do mundo).
- Escala = `clamp(available / rawHeight, 0.68, 1)`.
- Layout centralizado horizontalmente quando a escala é menor que 1.
- Aplicada no `loadWave`; não muda com resize.
- Exposta como `World.fieldScale` para debug e para o renderer.
- A validação de conteúdo usa a mesma função para calcular `gridBottom`.

## 5. Progressão e persistência

| Momento | Decisão confirmada |
|---|---|
| Dentro da run | Perks e níveis formam uma build temporária. A derrota descarta a run. |
| Entre fases | Progressão sequencial: vencer uma fase desbloqueia a próxima. O tutorial libera o level 1; a fase 6 libera o Mundo II e a fase 12 libera o Mundo III. |
| Tutorial | Em save novo, `unlockedPhase = 0` (tutorial). Concluir ou pular grava o clear do tutorial e libera o level 1. Save antigo com `unlockedPhase >= 1` continua sem repetir. |
| Ao perder | Reiniciar a fase perdida imediatamente, sem limite de tentativas; fases já desbloqueadas permanecem disponíveis. |
| Second Chance | Revive a run uma vez por run, com uma bola. É um perk único; não é uma vida extra por bolinha. Pode coexistir com o rewarded revive (dois revives por run, um de cada). |
| Modo Endless | Run infinita separada da campanha. O save v3 guarda `endless` com `bestWave`, `bestScore` e `runs`; não altera `unlockedPhase`. |
| Salvamento | Save schema v3 (`bb.save`), com `unlockedPhase` de 0 a 18 (0 = tutorial; 1–6 Mundo I, 7–12 Mundo II, 13–18 Mundo III), estatísticas por fase e `meta: { sparks, unlocks }`. Não retomar uma run interrompida; sair do jogo perde a run ativa. |
| Compatibilidade | Saves v1 e v2 continuam válidos e migram para v3; `sparks = 0`/`unlocks = []` quando ausentes; `unlockedPhase` é limitado a 0..18 e campos malformados caem em defaults. |
| Metaprogressão | **Horizontal (v0.6.1):** Sparks desbloqueiam perks no Workshop; não há bônus permanentes de atributos nem poder pago. |
| Competição | Estatísticas pessoais e recordes por fase; rankings globais e conquistas continuam fora do escopo. |

- Save v2 mantém `phases` por `phaseId` com `bestTimeMs`, `bestScore`, `attempts`, `clears` e `bestLevel`; o tutorial usa `phaseId = 'tutorial'`.
- O mesmo save mantém `endless` com `bestWave`, `bestScore` e `runs`; é opcional no parse e saves antigos recebem zeros.
- `campaignComplete` marca a conclusão da fase 6 e libera o Endless; o tutorial não conta para essa flag. Saves antigos com `clears > 0` na fase 6 são migrados como completos.
- `meta.sparks` é um inteiro não negativo; `meta.unlocks` guarda apenas IDs válidos de perks compradas, sem duplicatas. As 10 perks iniciais são implícitas.
- Settings v1 mantém `sound`, `music` e `screenShake`.
- Se o storage cair em memória/fallback, o menu mostra o aviso **“Progress may not be saved”** e explica que progresso/settings podem ser perdidos ao fechar a página.
- A run ativa não é salva.

### 5.1 Perks reworkadas (v0.6.0)

| ID | Nome | Tipo | Efeito |
|---|---|---|---|
| `momentum` | Momentum | repetível, máx. 3 | +1% de dano e +2% de XP por hit consecutivo em bloco; caps de +5/+10/+15% de dano e +10/+20/+30% de XP; reseta no toque do paddle. |
| `bombardier` | Bombardier | único | A cada 12 blocos destruídos, arma a próxima batida em bloco para uma explosão 3×3 (2 de dano no centro, 1 ao redor). |
| `boss_slayer` | Boss Slayer | único | A cada 10 blocos destruídos, o próximo acerto no chefe causa +3 de dano; o contador zera depois do acerto. |
| `hot_streak` | Hot Streak | repetível, máx. 2 | Após 5 hits consecutivos, +1/+2 de dano por 3 s; cada novo hit renova o timer; não altera a velocidade. |

Na 0.6.0, as quatro substituíram Combo Master, Bomb Ball, Boss Bane e Swift
Ball, e o catálogo ficou em 19 perks. A 0.6.1 mantém as quatro e adiciona as
três perks Tier 4, levando o catálogo a **22 perks**. Explosive Core (8 blocos)
e Bombardier (12 blocos) continuam com contadores separados.

### 5.2 Tier 4 (v0.6.1)

| ID | Nome | Tipo | Custo | Efeito |
|---|---|---|---:|---|
| `overkill` | Overkill | único | 100 | Dano excedente de um hit direto que destrói um bloco vira splash de até **2** nos quatro blocos ortogonalmente adjacentes. O splash não dispara Overkill de novo; explosões, dano de link e Shield Bash não propagam Overkill. |
| `shield_bash` | Shield Bash | único | 110 | A cada **8 acertos no paddle**, uma onda de choque causa **1** de dano nas **duas linhas mais baixas** do campo; o contador zera no disparo e ao resetar a run/perk. A onda não dispara Overkill. |
| `conductor` | Conductor | único, requer `prism_laser` | 120 | Cada alvo do Prism Laser tenta encadear **uma vez** para um bloco ortogonalmente adjacente que o feixe ainda não atingiu, causando `max(1, round(level × 0.5))` de dano (1/1/2 nos níveis 1/2/3). Sem o perk, o laser não encadeia. |

Com as três, o catálogo vai a **22 perks**: 10 iniciais e **12 bloqueadas**
(9 da 0.6.0 + 3 Tier 4). O Workshop passa a mostrar **quatro tiers**.

### 5.3 Metaprogressão e Workshop (v0.6.1)

- **Pool inicial:** 10 perks — Multiball, Wide Paddle, Power Ball, Quick Study,
  Arcane Turret, Giant Ball, Safety Net, Prism Laser, Foresight e Critical
  Strike. Os níveis máximos somam 24.
- **Unlocks atuais:** 12 perks bloqueadas, em quatro tiers:

| Tier | Perk | Custo em Sparks |
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
| 4 | Overkill | 100 |
| 4 | Shield Bash | 110 |
| 4 | Conductor | 120 |

#### Economia de Sparks

| Evento | Recompensa |
|---|---:|
| Onda concluída | `1 + floor(blocos destruídos na onda / 12)` |
| Combo de 5, 10 e 15 acertos na onda | +1 cada; máximo +3 por onda, uma vez por marco |
| Chefe derrotado | +3 |
| Conclusão de fase | +6 (sempre) |
| Primeira conclusão da fase | +6 extra (12 no total) |
| Teto por run | **250** (proteção de segurança) |

- Campanha e Endless usam as mesmas recompensas por evento; o Endless não tem
  fórmula plana própria.
- **Anti-farm:** onda, combo e chefe são reivindicados por tentativa de onda.
  Reiniciar uma onda já premiada na mesma run suprime essas recompensas na nova
  tentativa; a conclusão de fase continua pagando +6.
- O teto de 250 é proteção, não o valor normal: uma campanha completa rende
  ~169 Sparks antes dos bônus de bloco e combo.
- **Workshop:** card no menu com ícone, saldo, badge **Ready**, contagem
  `X / 22 unlocked`, `N left` e barra de progresso; diálogo por tier com nome,
  descrição, custo e estado; compra determinística que debita Sparks, persiste
  o unlock, emite `meta:changed` e atualiza menu/diálogo.
- **Ofertas:** filtram perks bloqueadas; a perk comprada entra na pool das
  próximas runs. O fallback `Arcane Insight` continua como válvula.
- **HUD:** chip de Sparks da run, com pulso e toast `+N Sparks · <motivo>`.
- **Results:** mostram `+X Sparks · total Y` e a quebra por fonte
  (`Waves`, `Bosses`, `Clear`, `First clear`, `Combo`).
- **Sem poder permanente:** o meta desbloqueia conteúdo, não atributos; não há
  ads, loot box, compra de vantagem ou refund nesta versão.

## 6. Direção visual e sonora

- Arte 2D em pixel art colorida, com blocos temáticos que representam materiais e estruturas, em vez de formas geométricas genéricas.
- **6 temas procedurais:** Crystal Grove, Ruined Halls, Arcane Depths, Frostbound Spire, Emberforge e Void Threshold, com backdrops, silhuetas, parallax, frames e acentos próprios.
- **Arte procedural dos novos blocos e elementos:** os 17 blocos têm assinatura visual própria; paredes, obstáculos, defletores, portais, movers, rotores, gates, presses, belts e rails são desenhados pelo renderer.
- **Chefes procedurais:** Frost Sentinel, Ember Warden e Void Herald no Mundo I; Nullframe Warden, Maglev Dreadnought e Lattice Hierophant no Mundo II; Boiler Matron, The Riveter e The Last Engine no Mundo III, com shards e feedback de dano/fase.
- A leitura não depende só de cor: facetas, material, pips de HP e cracks.
- **Bola por dano:** a cor-base acompanha o dano (branco → amarelo → laranja → vermelho → roxo), com glow e rastro na mesma cor. Buffs temporários não mudam a cor.
- **Giant Ball:** +40% de raio por nível, máximo 2 (+80%).
- **Ímã do último bloco:** no tutorial, um anel dourado no bloco e um tether até a bola indicam a assistência; a virada preserva a velocidade.
- A direção sonora continua música eletrônica acelerada, com SFX sintetizados em WebAudio e sem samples licenciados.
- Reduced motion e budgets de partículas/trails continuam respeitados.

## 7. Escopo da versão

### O que entrou na v0.2.0

| Item | Entrega |
|---|---|
| Campanha | 6 fases, ondas 3/3/3/3/4/5, total 21 |
| Blocos | 9 tipos, incluindo 6 especiais com comportamento próprio |
| Elementos | 7 tipos, com colisão e render |
| Chefes | 3, um por fase nova, com shards e corrosão |
| Desafios | `timeLimit` e `noLaser` em ondas selecionadas |
| Zoom | Escala de layout 0,68–1,0, sem alterar input |
| Perks | 19 no catálogo, com níveis e sinergias |
| Encerramentos | Epílogo por fase, rank S/A/B, final de campanha e derrota |
| Save | v1 mantido; `unlockedPhase` 1..6 (a 0.5.1 amplia para 0..6) |
| Correção | Laser só dispara com pelo menos uma bola solta (regra ampliada na 0.5.1) |

### O que entrou na v0.3.0

| Item | Entrega |
|---|---|
| Modo Endless | Fase infinita com ondas procedurais e fim quando todas as bolas caem |
| Progressão | Velocidade 660→1100, linhas 4→12, blocos e elementos graduais |
| Chefes | Um a cada 5 ondas, alternando sentinel/warden/void; HP `40 + wave × 6` |
| Save | `endless: { bestWave, bestScore, runs }` no schema v1 |
| UI | Botão Endless no menu, HUD sem denominador e results sem Next |
| Escopo | Campanha intacta; Endless não desbloqueia fases |

### O que entrou na v0.4.0

| Item | Entrega |
|---|---|
| Blocos | Redesign “arcade tile” com variação determinística, materiais, HP pips e cracks |
| Menu | Campaign/Endless, fundo animado de bolinhas, progresso e rodapé com How to Play/Settings/About |
| Seleção de fases | Tela cheia com ícones, accents, taglines, features, chefes e estatísticas |
| HUD | Modo compacto ≤440 px com ícones e valores de 11–13 px |
| Settings | Sound, Music e Screen shake no menu e pause; save compatível |
| Endless | Desbloqueio ao concluir a campanha, com diálogo explicativo |
| How to Play | 5 páginas com screenshots localizados 5:3 |
| About Us | Logomarca Bad Decision Games + texto do estúdio |
| Ads | Interstitial a cada 3 ondas (campanha), a cada 4 (Endless) e na saída dos results; rewarded revive 1x por run (política substituída na 0.5.1) |
| Save | `campaignComplete` e migração de saves antigos |
| Assets | 8 screenshots de loja, capas e vídeos de 18,1 s atualizados |

### O que entrou na v0.5.1

| Item | Entrega |
|---|---|
| Tutorial | Fase 0 `tutorial`, 2 ondas (`tutw1`, `tutw2`), 16 blocos, 32 XP e 2 level ups; gate do level 1 em save novo |
| Campanha | 6 fases e 20 ondas (2/3/3/3/4/5); com tutorial, 7 cards e 22 ondas |
| Totais | 743 blocos e 1.809 XP com tutorial; 727 blocos e 1.777 XP na campanha pura |
| Skip e coach marks | “Skip tutorial” conclui e libera o level 1; 5 modais pausados com **Got it**, em posições diferentes |
| Side art desktop | Camada de arte nas laterais em viewports landscape (aspect ≥ 1); mobile portrait inalterado; o campo continua portrait |
| CrazyGames | Adapter nativo do SDK CrazyGames, sem Playgama no host do portal; mesma build |
| Controles touch | Drag relativo 1:1 no centro; ganho por deslocamento longo e edge assist até 2,2×; velocidade do paddle inalterada |
| Laser | Exige lançamento explícito na onda; reset bloqueia até o jogador lançar; HUD “Launch the ball first” |
| Ads | Campanha só com próxima onda e onda múltipla de 3; Endless a cada 4; tutorial sem ads; exits com cooldown de 60 s |
| Revives | Second Chance + rewarded revive podem coexistir; rewarded continua 1x por run |
| Storage | Aviso “Progress may not be saved” + popup quando o storage é memória/fallback |
| Save | `unlockedPhase` 0..6; saves antigos com `>= 1` continuam válidos |
| Gates | 329 testes em 29 arquivos; 31 E2E em 9 spec files; ZIP 0.5.1 local, 20 arquivos |
| Assets | 4 capas, 8 screenshots, 2 vídeos de 19,1 s e 5 imagens How to Play 780×468 regenerados a partir da 0.5.1; revisão humana pendente |

### O que entrou na v0.6.0

| Item | Entrega |
|---|---|
| Perks reworkadas | Momentum, Bombardier, Boss Slayer e Hot Streak substituem Combo Master, Bomb Ball, Boss Bane e Swift Ball |
| Pool inicial | 10 perks iniciais; 9 perks bloqueadas naquela versão |
| Metaprogressão | Sparks persistidos e 9 unlocks em três tiers (12–75 Sparks) |
| Workshop | Strip no menu, cards por tier, compra, estados e feedback de erro |
| Ofertas | Filtram perks bloqueadas; compradas entram na pool das próximas runs |
| Results | Mostram Sparks ganhos e total |
| Save | Schema v2 com `meta`; migração v1→v2 sem perder progresso |
| Economia | +1/onda, +3/chefe e +5 na primeira conclusão de fase; teto de 30 por run; sem ads/loot box |
| Gates | 375 testes em 31 arquivos; 36 E2E em 10 spec files; ZIP 0.6.0 local, 20 arquivos |
| Publicação | 0.6.1 publicada no itch.io/Playgama em 2026-11-12; sem tag/release |

### O que entrou na v0.6.1

| Item | Entrega |
|---|---|
| Tier 4 | Overkill (100), Shield Bash (110) e Conductor (120); catálogo com 22 perks e 12 unlocks em quatro tiers |
| Economia | Onda `1 + floor(blocos/12)`, combo +1 em 5/10/15 (máx. +3), chefe +3, clear +6 e first clear +6 extra; teto de 250 |
| Anti-farm | Onda/combo/chefe pagam no máximo uma vez por onda por run; retry é suprimido |
| Feedback | Chip e toast de Sparks no HUD; results com total e breakdown por fonte |
| Workshop | Card de progressão com ícone, saldo, badge, `X / 22 unlocked`, `N left` e barra |
| Save | Schema v2 inalterado; nenhuma migração nova |
| Gates | 396 testes em 32 arquivos; 37 E2E em 10 spec files; ZIP 0.6.1 local, 20 arquivos |
| Publicação | 0.6.1 publicada no itch.io/Playgama em 2026-11-12; sem tag/release |

### O que entrou na v0.7.0-dev

| Item | Entrega |
|---|---|
| Mundos | II · Neon Lattice (6 fases / 22 ondas) e III · Rustwake (6 fases / 27 ondas) |
| Totais | 19 fases, 71 ondas, 2.785 blocos, 9.409 XP |
| Blocos | 8 novos: alloy, bastion, entangled, relay, phased, plated, fused e splitting |
| Elementos | press, belt e rail |
| Regras | noMultiball e gust |
| Chefes | 6 novos, três por mundo, com padrões spread/charger/aimed/matron/riveter/engine |
| Save | v3, `unlockedPhase` 0..18, migração v1/v2→v3 |
| Velocidade | overlap entre mundos e teto por mundo 780/900/920; hard cap 1.100 para rails |
| Mapas | um mapa-trilha por mundo, pílulas I/II/III no header |
| Debug | todas as fases desbloqueadas em `?debug=1` e seletor de onda no sheet |
| Economia | +30 Sparks no primeiro clear de cada mundo |
| Gates | 419 unit, 43 E2E, validação de conteúdo verde |

### O que entrou na v0.7.1

| Item | Entrega |
|---|---|
| Tutorial | Onda 1 com 4 blocos de 1 HP quatro linhas abaixo; primeira perk em 3 kills; onda 2 com 1 HP, 2 HP e explosivo |
| Barra do tutorial | XP de level 1 = 3; curva normal depois |
| Assistências | Paddle 2× e ímã do último bloco (anel/tether, velocidade preservada) |
| Coach marks | 2 passos legíveis, **Continue** e **Skip tutorial** em contraste alto |
| Giant Ball | +40% de raio por nível, máx. 2 (+80%) |
| Feedback de dano | Bola branco → amarelo → laranja → vermelho → roxo, com glow/rastro |
| Pierce | Hit direto com excesso ≥ 1 atravessa; igual/menor quica; só bola |
| Feedback de pierce | Evento, SFX, anel/partículas na cor do dano |
| Save | v3 inalterado |
| Gates | 428 unit / 35 arquivos; 43 E2E / 12 specs; 2.781 blocos / 9.392 XP |
| Publicação | Nenhuma; linha local, sem tag/release |

### O que continua fora

- Bônus permanentes de atributos, leaderboards e conquistas.
- Cosméticos, desafios com recompensa e reroll de oferta.
- Mundo IV, localização e landscape jogável.
- **Moldura/letterbox desktop:** decisão do dono é não fazer nesta linha; o shell portrait centralizado é intencional.
- Editor de fases e pipeline procedural.
- Backend, contas e cloud save.
- Full Launch e submission automática em portais.

## 8. Distribuição, tecnologia e monetização

### Distribuição

- Portais pretendidos: **itch.io, GameFlare, Playgama e CrazyGames**.
- **Um build, 3 mundos:** o mesmo HTML5/ZIP serve os quatro portais, com a Playgama Bridge como camada de integração. O Bridge é **local** no boot (`./playgama-bridge.js`), sem request ao CDN da Playgama.
- O **itch.io recebeu a `0.6.1`** manualmente em 2026-11-12; `0.1.0-mvp` é histórica.
- A **0.7.2 é a linha atual** e está implementada localmente; o jogo foi aceito e publicado na Playgama, com a `0.7.1` em auto-certificação.
- **Playgama:** jogo aceito; a `0.7.1` foi reprovada na auto-certificação por usar Bridge 2.4.1. A `0.7.2` usa 2.4.4 e precisa de upload manual.
- **CrazyGames:** a 0.3.0 e a 0.4.0 foram reprovadas com a mesma mensagem genérica; a 0.5.1 foi submetida em 2026-11-11. A submissão está **pausada até 2026-11-26**. Decisão: **não fazer moldura/letterbox desktop**.
- **GameFlare:** conta criada, acesso bloqueado; suporte acionado e sem resposta.
- Os portais restantes continuam com submissão **manual**; revalidar requisitos na data.
- **Assets de loja:** capas, 9 screenshots, 2 vídeos e 5 painéis How to Play regenerados a partir da 0.6.1; revisão humana pendente antes de reutilizar em portal.

### Stack de desenvolvimento

- HTML5 confirmado.
- **Phaser 3.90, TypeScript estrito, Vite 8 e Git.**
- Vitest para simulação, progressão, conteúdo e save; Playwright para E2E.
- Playgama Bridge 2.4.4 para plataforma, storage e anúncios.

### Monetização

- Jogo totalmente gratuito; receita somente de publicidade.
- Modelo escolhido: anúncios convencionais conforme cada portal e anúncios recompensados opcionais que concedem uma vantagem ao jogador.
- **Interstitials em pausas naturais (política 0.5.1, mantida na 0.6.1):**
  - campanha: somente quando há próxima onda e a onda limpa é múltipla de 3 — em qualquer mundo, nunca no fim da fase; o tutorial não tem ads;
  - Endless: a cada 4 ondas;
  - tutorial: nenhum ad;
  - saída dos results (Next/Retry/Menu): se não houve outro interstitial nos últimos 60 s; após rewarded revive, o ad dos results ainda pode aparecer na segunda morte;
  - saída pelo menu do pause: suprimida se houve interstitial **ou** rewarded revive nos últimos 60 s.
- **Rewarded revive:** ao ser derrotado, o jogador pode assistir um ad uma vez por
  run para continuar com uma bola nova. O caminho sem ad continua existindo: a
  run termina normalmente e o jogador pode tentar de novo.
- **Second Chance + rewarded revive** coexistem de propósito: são dois revives por run, um de cada mecânica.
- **Sparks não são vendidos nem vêm de ads:** a metaprogressão é ganha apenas jogando; não há loot box, compra de vantagem ou refund.
- Sem compras, microtransações, cosméticos pagos ou opção paga para remover anúncios.
- Respeitar a disponibilidade e as regras de cada portal; não inserir anúncios forçados durante a ação do block breaker.

## 9. Backlog futuro

Itens já implementados na v0.2.0 (blocos especiais, elementos, chefes, mais perks, estruturas de fase, encerramentos e zoom) saíram deste backlog. O **modo Endless** entrou no escopo da **v0.3.0** com fase infinita, progressão, chefes recorrentes e recordes no save. A **v0.4.0** fechou a lacuna de apresentação/UX e implementou interstitials e rewarded revive. A **v0.5.1** adicionou tutorial in-game, controles touch com edge assist, gate do laser, política de ads mais conservadora e aviso de storage. A **v0.6.0** entregou as perks reworkadas, a primeira camada de metaprogressão horizontal (Sparks + Workshop) e o save v2. A **v0.6.1** completou o Tier 4, reequilibrou a economia de Sparks, adicionou feedback de HUD/results e promoveu o Workshop a card; a build foi publicada no itch.io/Playgama em 2026-11-12, após testes básicos.

- Leaderboard específico do modo Endless (o ranking global continua fora).
- Expansão da metaprogressão: cosméticos, desafios com recompensa e reroll de oferta.
- Outros usos de rewarded ads (bônus, rerolls) após definir benefícios e limites para preservar o equilíbrio.
- Rankings globais e conquistas, condicionados aos recursos dos portais.
- Mundo IV e expansões temáticas além de Neon Lattice/Rustwake.
- Localização para outros idiomas.
- Modo landscape jogável.
- Editor de fases ou pipeline procedural.
- Backend, contas e cloud save.
- Full Launch do CrazyGames e novos portais (Poki, GameDistribution, Famobi).

## 10. Pendências e validação de consistência

| Tema | Pendência / observação |
|---|---|
| Conteúdo | A campanha de 3 mundos / 18 fases / 69 ondas está fechada; com o tutorial, são 19 fases / 71 ondas. O Endless é gerado proceduralmente. |
| Tutorial | Implementado com 2 ondas, 12 blocos, 15 XP, 1 level up e 2 coach marks; skip e textos grandes cobertos por testes. Falta validar compreensão e tempo até a primeira perk em teste humano. |
| Endless | Uma fase infinita implementada; balanceamento das ondas altas e dos chefes ainda depende de playtest humano. |
| Ondas | Distribuição decidida: tutorial 2; campanha 2/3/3/3/4/5. A fase 1 encurtada e as ondas 4–6 estão implementadas e validadas. |
| Perks | Catálogo fechado em 22 perks, com níveis, pré-requisitos e fallback interno; Momentum, Bombardier, Boss Slayer e Hot Streak foram reworkadas na 0.6.0, e Overkill, Shield Bash e Conductor entraram na 0.6.1. Balanceamento fino ainda depende de playtest humano. |
| Metaprogressão | Implementada na 0.6.1: 10 starters, 12 unlocks em quatro tiers, Sparks e Workshop. Falta calibrar economia e tempo até o primeiro unlock em playtest. |
| Save v2 | Implementado com `meta: { sparks, unlocks }` e inalterado na 0.6.1; migração v1→v2 coberta por testes. Falta validar save antigo real no navegador. |
| Workshop | Implementado com card de progressão, quatro tiers, 12 cards, custos, compra, persistência, contagem e barra; E2E e layout 320/390 cobertos. Falta teste em iframe de portal. |
| Chefes | Três chefes definidos (Frost Sentinel, Ember Warden, Void Herald) com HP, padrão, shards e corrosão. Ajuste de dificuldade segue aberto para playtest. |
| Regras de onda | `timeLimit`, `noLaser`, `noMultiball` e `gust` implementados nas ondas definidas. Novas regras ficam para o futuro. |
| Zoom | Escala 0,68–1,0 implementada e validada no conteúdo. Testar legibilidade em telas pequenas reais. |
| Balanceamento | Ainda depende de playtest humano; o bot de QA não substitui jogador. |
| Rewarded ads | Revive uma vez por run implementado; outros usos ficam para o futuro. |
| Próximo ciclo | Decidir entre conteúdo (novo mundo), retenção (cosméticos/desafios/reroll) ou plataforma (localização/landscape). |
| Localização | Fora do escopo; o catálogo de strings precisa ser separado por locale antes. |
| Performance real | Protocolo e script prontos (`docs/qa/performance-testing.md`, `scripts/perf-smoke.mjs`); resultados da 0.6.1 pendentes. |
| Distribuição | itch.io e Playgama sandbox com `0.6.1`; CrazyGames pausado até 2026-11-26; GameFlare bloqueado. |
| Apresentação desktop | Side art adicionada em landscape; o campo continua portrait e sem moldura. Risco residual de legibilidade em iframe desktop. |
| Ads | Política 0.5.1 mantida na 0.6.1 e testada com mock; acompanhar fill/limites reais na Playgama e CrazyGames. |
| Store assets | Capas, 9 screenshots, 2 vídeos e 5 painéis How to Play regenerados da 0.6.1; revisão humana pendente. |
| Áudio | Novos elementos e chefes usam SFX existentes; mixagem final ainda pode ser refinada. |

### Checklist de coerência

- A vida compartilhada significa que uma bolinha pode cair sem terminar a run se outra continuar ativa; a derrota ocorre quando todas caem.
- Perks de bola são passivos/automáticos; perks de ataque pertencem ao rebatedor e podem ser automáticos ou manuais.
- O level up pausa o jogo para a escolha de um entre três perks; as ondas só avançam após todos os blocos (e o chefe, quando houver) serem destruídos.
- O tutorial libera o level 1 em save novo; skip conclui a fase; save antigo com `unlockedPhase >= 1` não repete.
- O laser exige lançamento explícito na onda e pelo menos uma bola solta; reset, Sticky e a bola inicial presa bloqueiam o disparo.
- O toque é relativo 1:1 no centro, com ganho até 2,2× na zona externa de 22%; mouse é absoluto e a velocidade do paddle não mudou.
- O zoom é escala de layout, não de câmera; o input não muda.
- Metaprogressão desbloqueia perks, não bônus permanentes de atributos; são 10 starters + 12 unlocks = 22 perks, as starters são implícitas e as compradas ficam no save v2. A run ativa não é salva.
- O Endless é uma run separada: não desbloqueia fases, não substitui a campanha e mantém seus próprios recordes no save.
- A monetização é somente publicidade; o rewarded revive é opcional e tem caminho sem ad; tutorial não tem ads.
- O build `0.1.0-mvp` é histórico; a `0.6.1` está publicada no itch.io e no sandbox da Playgama; a `0.5.1` é a build anterior.

---

## Histórico de versões

| Versão | Data | Mudanças |
|---|---|---|
| `1.0` | 2026-11-07 | GDD do MVP: 3 fases × 3 ondas, 3 blocos, 11 perks, sem chefes. |
| `1.1` | 2026-11-08 | v0.2.0-dev: campanha de 6 fases / 21 ondas, 9 blocos, 7 elementos, 3 chefes, 19 perks, desafios, zoom de layout, encerramentos e save 1..6. |
| `1.2` | 2026-11-09 | v0.3.0-dev: modo Endless com fase infinita, velocidade 660→1100, linhas 4→12, chefes a cada 5 ondas, save `endless` e results próprios. |
| `1.3` | 2026-11-10 | v0.4.0-dev: revisão visual dos blocos, menu Campaign/Endless, fundo animado, seleção de fases temática, settings de som/música/shake, Endless desbloqueado ao concluir a campanha, HUD compacto, How to Play, About Us, interstitials a cada 3/4 ondas, rewarded revive 1x por run e save `campaignComplete`. |
| `1.4` | 2026-11-10 | Fechamento da v0.4.0: status, escopo, distribuição, ads e pendências atualizados para a nova sessão; GDD consolidado como fonte de design. |
| `1.6` | 2026-11-11 | v0.5.1: tutorial jogável/pulável com 2 ondas e gate do level 1; campanha em 20 ondas (2/3/3/3/4/5); 743/1.809 com tutorial; edge assist do toque; gate explícito do laser; nova política de ads; aviso de storage; segunda reprovação da CrazyGames e decisão de não fazer moldura desktop. |
| `1.7` | 2026-11-12 | v0.6.0 local: perks Momentum, Bombardier, Boss Slayer e Hot Streak; 10 starters e 9 unlocks; Sparks e Workshop; save v2 com migração; ofertas filtradas; gates com 375 testes e 36 E2E. Build não publicada; 0.5.1 segue no itch.io/Playgama; CrazyGames pausado até 2026-11-26. |
| `1.8` | 2026-11-12 | v0.6.1 publicada no itch.io/Playgama: Tier 4 com Overkill, Shield Bash e Conductor; catálogo em 22 perks e 12 unlocks em quatro tiers; economia por onda, combo, clear/first clear, teto 250 e anti-farm; chip/toast no HUD; results com breakdown; Workshop como card com contagem e progresso; gates com 396 testes e 37 E2E. Testes básicos ok; sem tag/release. |
| `1.9` | 2026-11-16 | v0.7.0-dev local: Mundos II (Neon Lattice) e III (Rustwake), 18 fases/71 ondas, 8 blocos e 3 elementos novos, 6 chefes, save v3, overlap de velocidade entre mundos, hard cap 1.100 para rails, mapas por mundo com pílulas I/II/III e debug de ondas. Gates com 419 unit e 43 E2E; não publicada, sem tag/release. |
| `1.10` | 2026-11-23 | Tutorial simplificado: 2 ondas, 12 blocos, 15 XP e 1 level up; primeira perk em 3 de 4 blocos de 1 HP; segunda onda com 1 HP, 2 HP e explosivo; 2 coach marks com texto maior, **Continue** e **Skip tutorial** em contraste alto. Chefes/Endless saem do tutorial. Totais: 2.781 blocos / 9.392 XP. Gates com 420 unit e 43 E2E. |
| `1.11` | 2026-11-23 | Onda 1 do tutorial desce 4 linhas; paddle do tutorial 2×; Giant Ball +40%/nível (máx. +80%); bola colorida por dano (branco→amarelo→laranja→vermelho→roxo) com rastro; ímã do último bloco no tutorial com anel/tether, preservando a velocidade. Gates com 424 unit e 43 E2E. |
| `1.12` | 2026-11-24 | Pierce: hit direto da bola com pelo menos 1 de dano excedente destrói e atravessa sem quicar; igual ou menor quica. Só bola; chefes/elementos/ferramentas ficam de fora. Overkill continua com o mesmo excesso. Evento/SFX/FX próprios. Gates com 428 unit e 43 E2E. |
| `1.13` | 2026-11-24 | Fechamento da linha **0.7.1** local: GDD consolidado, escopo da versão e handoff novo para mudanças profundas (densidade, progressão, público). Sem publicação/tag/release. |
| `1.14` | 2026-11-26 | **0.7.2**: Playgama Bridge 2.4.4, runtime vendorizado e correção do ímã do último bloco (taxa de giro adaptativa). Jogo aceito na Playgama; build em auto-certificação. Sem tag/release. |
| `0.1.0-mvp` | 2026-11-08 | Build publicado no itch.io; ZIP congelado. |
| `0.2.0-dev` | 2026-11-08 | Expansão da campanha em desenvolvimento; ainda não publicada nos portais. |
| `0.3.0-dev` | 2026-11-09 | Modo Endless em desenvolvimento; campanha e build publicado permanecem intactos. |
| `0.4.0-dev` | 2026-11-10 | Revisão visual/menu, HUD compacto, How to Play/About, ads com rewarded revive, docs reorganizados. |
| `0.5.1-dev` | 2026-11-11 | Tutorial, campanha de 20 ondas, edge assist, gate do laser, política de ads e aviso de storage; build publicada no itch.io/Playgama. |
| `0.6.0-dev` | 2026-11-12 | Perks reworkadas, 10 starters/9 unlocks, Sparks, Workshop, save v2 e ofertas filtradas; build local, sem tag/release. |
| `0.6.1-dev` | 2026-11-12 | Tier 4 (Overkill, Shield Bash, Conductor), economia de Sparks reformulada, chip/toast no HUD, results com breakdown e Workshop como card; build local, sem tag/release. |

Este GDD separa as decisões confirmadas do recorte da versão atual, do backlog futuro e das pendências de design. Use a seção de pendências para fechar parâmetros e critérios de aceite antes de transformar o escopo em tarefas de implementação.
