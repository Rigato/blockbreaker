# GDD Bricklike

**Nome oficial:** Bricklike. O repositório, o pacote e os identificadores
técnicos continuam `blockbreaker` para preservar URLs e builds.
**Documento de design para orientar a campanha e as próximas fases do jogo**  
**Versão:** 1.5  
**Data:** 2026-11-11  
**Status:** v0.5.0 em main, validada e aguardando teste humano; itch.io e Playgama seguem com a 0.4.0; CrazyGames/GameFlare pendentes  
**Plataforma-alvo:** Web HTML5, orientação portrait

## Resumo do projeto

Um block breaker arcade clássico, em formato portrait, com progressão roguelite. O jogador move o rebatedor, controla a trajetória das bolinhas e destrói formações de blocos. Blocos concedem XP; ao subir de nível, a partida pausa e apresenta três perks aleatórios para escolher um. As combinações mudam a run e criam alta rejogabilidade em sessões curtas.

A campanha atual tem **6 fases e 20 ondas**, **9 tipos de bloco**, **7 elementos de fase**, **3 chefes** e **19 perks**. Com o **tutorial** da v0.5.0, o seletor mostra **7 cards e 22 ondas** no total. A v0.3.0 adicionou o **modo Endless**: uma fase infinita com ondas procedurais, progressão de dificuldade e chefes recorrentes, sem alterar a campanha. A v0.4.0 adicionou a revisão visual/menu, o HUD compacto, How to Play/About Us, settings completos e o sistema de ads com rewarded revive. A v0.5.0 adiciona o **tutorial jogável e pulável**, o **edge assist do toque**, o **gate explícito do laser** e uma **nova política de ads**; a build está em `main`, aguardando teste humano. A `0.4.0` segue publicada no itch.io e no sandbox da Playgama; `0.1.0-mvp` é histórica.

### Como ler os status

- **Confirmado:** escolha expressa pelo jogador ou consolidada no design.
- **v0.5.0:** implementado e validado no ciclo atual (tutorial, controles touch e política de ads).
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
9. Sobreviver às ondas com **desafio** (`timeLimit`, `noLaser`) e concluir a fase; as fases 4–6 terminam em chefe e a fase 6 fecha a campanha.

**Derrota:** nenhuma bolinha permanece ativa em jogo, ou o tempo de uma onda com `timeLimit` chega a zero.  
**Vitória de fase:** limpar todas as ondas previstas, incluindo o chefe quando a onda o define.  
**Tutorial:** 2 ondas, 48 blocos e 55 XP; concluir ou pular libera o level 1 em save novo.  
**Campanha:** 6 fases, com ondas por fase 2/3/3/3/4/5 (total 20). Com o tutorial, são 7 cards e 22 ondas.

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

### Menu, seleção de fases e configurações (v0.5.0)

- **Menu:** dois caminhos principais — **Campaign** e **Endless** — sem o texto
  de MVP `XP · Perks · Levels` e sem o rodapé de controles. O rodapé mostra
  **How to Play**, **Settings**, **About Us** e a versão.
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
- **Seleção de fases:** tela cheia com cards temáticos por fase (ícone, accent,
  tagline, features, chefe, dificuldade e melhores resultados). Com o tutorial,
  são 7 cards; fases 4–6 destacam o chefe.
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
- **Coach marks do tutorial:** painel contextual com cinco passos — mover/lançar,
  XP/perk, blocos especiais, chefes e Endless — e botão **Skip tutorial**.

## 3. Regras de gameplay confirmadas

### Controles e trajetória

- Orientação portrait; controle principal por toque e deslize horizontal para mover o rebatedor.
- Também há mouse absoluto e teclado (setas/A-D) no desktop.
- **Toque:** o drag é relativo e 1:1 no centro do campo. Nos **22% externos** de cada lado, o ganho cresce progressivamente até **2,2×** para o paddle alcançar a borda antes do dedo e evitar o gesto de borda do navegador. O limite de velocidade do paddle não muda.
- **Mouse e teclado:** mouse continua absoluto; teclado continua igual.
- **Tutorial:** o primeiro acesso abre uma run guiada e pulável, com coach marks de movimento/lançamento, XP/perk, blocos especiais, chefes e Endless. O **How to Play** no menu complementa, mas não substitui o tutorial.
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

### Ondas, XP e perks

- A próxima onda começa somente quando todos os blocos da onda atual forem destruídos; em ondas com chefe, o chefe também precisa cair.
- Cada bloco destruído concede XP. A curva atual é `8 / 20 / 26 / 33 / 39 / 46…` (base `20 + 10 × (level − 1)`, multiplicador global de 0,65 e desconto de primeiro nível).
- Ao preencher a barra de XP, a partida pausa automaticamente; três opções aleatórias de perk aparecem e o jogador escolhe uma.
- O catálogo usa um modelo híbrido: alguns perks podem ser escolhidos repetidamente e evoluem por níveis; outros são únicos. Limites variam por perk.
- **Regras de onda:**
  - `timeLimit`: a onda tem contagem regressiva; se o tempo zerar antes da limpeza, a run termina em derrota. O HUD mostra o tempo restante.
  - `noLaser`: o Prism Laser fica desabilitado apenas naquela onda; o perk continua adquirido para as ondas seguintes.
- Ofertas são três cards distintos, sem reroll; um perk interno de fallback (**Arcane Insight**, +XP) preenche a oferta quando faltam opções elegíveis.

### Ataques do rebatedor

- Perks podem conceder ataques automáticos, como disparos periódicos, laser e projéteis, e ataques manuais acionados pelo jogador.
- Controles de habilidade aparecem de forma contextual, somente quando um perk exigir esse comando, para manter a interface inicial limpa.
- Poderes do rebatedor e propriedades da bolinha são sistemas separados. O jogador explicitamente não quer poderes ativáveis disparados pelas bolinhas.

## 4. Blocos, elementos e desenho das fases

### Blocos

A campanha usa 9 tipos. `behavior` dirige a simulação e o renderer; `hp`, `score` e a arte continuam sendo a fonte de verdade. A resistência é comunicada por cor, material, pips de HP e estado visual, sem depender exclusivamente da cor.

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
| 0 | Tutorial | 2 | 520 / 560 | tutorial | mover, lançar, XP/perk e bloco explosivo |
| 1 | Crystal Grove | 2 | 572 / 616 | crystal | base |
| 2 | Ruined Halls | 3 | 616 / 660 / 704 | ruins | stone/obsidian |
| 3 | Arcane Depths | 3 | 638 / 682 / 726 | arcane | densidade |
| 4 | Frostbound Spire | 3 | 660 / 682 / 704 | frost | moving, explosive, regenerative, wall, deflector, Frost Sentinel |
| 5 | Emberforge | 4 | 682 / 704 / 726 / 748 | forge | multiplier, linked, portal, gate, mover, rotor, Ember Warden |
| 6 | Void Threshold | 5 | 704 / 726 / 748 / 770 / 780 | void | generator e todos os especiais, rotor, mover, Void Herald |

- Com o tutorial: **7 cards**, **22 ondas**, **775 blocos**, **1.832 XP** no conteúdo validado.
- Campanha pura: **6 fases**, **20 ondas**, **727 blocos**, **1.777 XP**.
- Blocos por fase (sem tutorial): 54 / 90 / 94 / 103 / 136 / 250.
- XP por fase (sem tutorial): 76 / 212 / 262 / 229 / 348 / 650.
- Tutorial: 48 blocos, 55 XP, 3 level ups.
- Cada fase termina em results; a vitória desbloqueia a fase seguinte.
- A fase 6 termina com o Void Herald e um encerramento de campanha.
- A fase 6 inclui uma onda alta (12 linhas esparsas) para exercitar o zoom de layout.
- A dificuldade (HP médio × densidade) não regride entre ondas e fases; o validador permite tolerância de 5% e exclui ondas de chefe do ritmo por densidade.

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
| Entre fases | Progressão sequencial: vencer uma fase desbloqueia a próxima. O tutorial libera o level 1; as fases 4–6 desbloqueiam em sequência, de 4 para 5 e de 5 para 6. |
| Tutorial | Em save novo, `unlockedPhase = 0` (tutorial). Concluir ou pular grava o clear do tutorial e libera o level 1. Save antigo com `unlockedPhase >= 1` continua sem repetir. |
| Ao perder | Reiniciar a fase perdida imediatamente, sem limite de tentativas; fases já desbloqueadas permanecem disponíveis. |
| Second Chance | Revive a run uma vez por run, com uma bola. É um perk único; não é uma vida extra por bolinha. Pode coexistir com o rewarded revive (dois revives por run, um de cada). |
| Modo Endless | Run infinita separada da campanha. O save v1 guarda `endless` com `bestWave`, `bestScore` e `runs`; não altera `unlockedPhase`. |
| Salvamento | Save schema v1 (`bb.save`), com `unlockedPhase` de 0 a 6 (0 = tutorial) e estatísticas por fase. Não retomar uma run interrompida; sair do jogo perde a run ativa. |
| Compatibilidade | Saves antigos continuam válidos; `unlockedPhase` é limitado a 0..6 e campos malformados caem em defaults. Saves antigos com clears inferem o unlock. |
| Metaprogressão | Fora do escopo da v0.5.0. Desbloqueios permanentes de conteúdo e melhorias de atributos ficam para uma fase futura. |
| Competição | Estatísticas pessoais e recordes por fase; rankings globais e conquistas continuam fora do escopo. |

- Save v1 mantém `phases` por `phaseId` com `bestTimeMs`, `bestScore`, `attempts`, `clears` e `bestLevel`; o tutorial usa `phaseId = 'tutorial'`.
- O mesmo save mantém `endless` com `bestWave`, `bestScore` e `runs`; é opcional no parse e saves antigos recebem zeros.
- `campaignComplete` marca a conclusão da fase 6 e libera o Endless; o tutorial não conta para essa flag. Saves antigos com `clears > 0` na fase 6 são migrados como completos.
- Settings v1 mantém `sound`, `music` e `screenShake`.
- Se o storage cair em memória/fallback, o menu mostra o aviso **“Progress may not be saved”** e explica que progresso/settings podem ser perdidos ao fechar a página.
- A run ativa não é salva.

## 6. Direção visual e sonora

- Arte 2D em pixel art colorida, com blocos temáticos que representam materiais e estruturas, em vez de formas geométricas genéricas.
- **6 temas procedurais:** Crystal Grove, Ruined Halls, Arcane Depths, Frostbound Spire, Emberforge e Void Threshold, com backdrops, silhuetas, parallax, frames e acentos próprios.
- **Arte procedural dos novos blocos e elementos:** os 9 blocos têm assinatura visual própria; paredes, obstáculos, defletores, portais, movers, rotores e gates são desenhados pelo renderer.
- **Chefes procedurais:** Frost Sentinel, Ember Warden e Void Herald, com shards e feedback de dano/fase.
- A leitura não depende só de cor: facetas, material, pips de HP e cracks.
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
| Save | v1 mantido; `unlockedPhase` 1..6 (a 0.5.0 amplia para 0..6) |
| Correção | Laser só dispara com pelo menos uma bola solta (regra ampliada na 0.5.0) |

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
| Ads | Interstitial a cada 3 ondas (campanha), a cada 4 (Endless) e na saída dos results; rewarded revive 1x por run (política substituída na 0.5.0) |
| Save | `campaignComplete` e migração de saves antigos |
| Assets | 8 screenshots de loja, capas e vídeos de 18,1 s atualizados |

### O que entrou na v0.5.0

| Item | Entrega |
|---|---|
| Tutorial | Fase 0 `tutorial`, 2 ondas (`tutw1`, `tutw2`), 48 blocos, 55 XP e 3 level ups; gate do level 1 em save novo |
| Campanha | 6 fases e 20 ondas (2/3/3/3/4/5); com tutorial, 7 cards e 22 ondas |
| Totais | 775 blocos e 1.832 XP com tutorial; 727 blocos e 1.777 XP na campanha pura |
| Skip e coach marks | “Skip tutorial” conclui e libera o level 1; coach marks de mover/lançar, XP/perk, blocos especiais, chefes e Endless |
| Controles touch | Drag relativo 1:1 no centro; ganho progressivo até 2,2× na zona externa de 22%; velocidade do paddle inalterada |
| Laser | Exige lançamento explícito na onda; reset bloqueia até o jogador lançar; HUD “Launch the ball first” |
| Ads | Campanha só com próxima onda e onda múltipla de 3; Endless a cada 4; tutorial sem ads; exits com cooldown de 60 s |
| Revives | Second Chance + rewarded revive podem coexistir; rewarded continua 1x por run |
| Storage | Aviso “Progress may not be saved” + popup quando o storage é memória/fallback |
| Save | `unlockedPhase` 0..6; saves antigos com `>= 1` continuam válidos |
| Gates | 289 testes em 28 arquivos; 29 E2E em 9 spec files; ZIP 0.5.0 local, 20 arquivos |

### O que continua fora

- Metaprogressão permanente, leaderboards e conquistas.
- Mundos sci-fi/industrial, localização e landscape jogável.
- **Moldura/letterbox desktop:** decisão do dono é não fazer nesta linha; o shell portrait centralizado é intencional.
- Editor de fases e pipeline procedural.
- Backend, contas e cloud save.
- Full Launch e submission automática em portais.

## 8. Distribuição, tecnologia e monetização

### Distribuição

- Portais pretendidos: **itch.io, GameFlare, Playgama e CrazyGames**.
- **Um build, 6 fases:** o mesmo HTML5/ZIP serve os quatro portais, com a Playgama Bridge como camada de integração. O Bridge é **local** no boot (`./playgama-bridge.js`), sem request ao CDN da Playgama.
- O **itch.io recebeu a `0.4.0`** manualmente; `0.1.0-mvp` é histórica.
- A **0.5.0 é a linha atual de desenvolvimento**, mas está em **`main`** para teste e ainda não foi publicada em portal. itch.io e sandbox da Playgama seguem com a **0.4.0**.
- **Playgama:** build 0.4.0 em sandbox, com milestones pendentes; amostra pequena de stats, sem conclusão de qualidade/retenção.
- **CrazyGames:** a 0.3.0 e a 0.4.0 foram reprovadas com a mesma mensagem genérica. A 0.5.0 é a próxima tentativa, após teste humano e assets novos. Decisão: **não fazer moldura/letterbox desktop**.
- **GameFlare:** conta criada, acesso bloqueado; suporte acionado.
- Os portais restantes continuam com submissão **manual**; revalidar requisitos na data.
- **Assets de loja:** capas, screenshots e vídeos ainda são os da 0.4.0 e precisam ser regerados antes da submissão da 0.5.0.

### Stack de desenvolvimento

- HTML5 confirmado.
- **Phaser 3.90, TypeScript estrito, Vite 8 e Git.**
- Vitest para simulação, progressão, conteúdo e save; Playwright para E2E.
- Playgama Bridge 2.4.1 para plataforma, storage e anúncios.

### Monetização

- Jogo totalmente gratuito; receita somente de publicidade.
- Modelo escolhido: anúncios convencionais conforme cada portal e anúncios recompensados opcionais que concedem uma vantagem ao jogador.
- **Interstitials em pausas naturais (política 0.5.0):**
  - campanha: somente quando há próxima onda e a onda limpa é múltipla de 3 — na prática, fase 5 após a onda 3 e fase 6 após a onda 3; nunca no fim da fase;
  - Endless: a cada 4 ondas;
  - tutorial: nenhum ad;
  - saída dos results (Next/Retry/Menu): se não houve outro interstitial nos últimos 60 s; após rewarded revive, o ad dos results ainda pode aparecer na segunda morte;
  - saída pelo menu do pause: suprimida se houve interstitial **ou** rewarded revive nos últimos 60 s.
- **Rewarded revive:** ao ser derrotado, o jogador pode assistir um ad uma vez por
  run para continuar com uma bola nova. O caminho sem ad continua existindo: a
  run termina normalmente e o jogador pode tentar de novo.
- **Second Chance + rewarded revive** coexistem de propósito: são dois revives por run, um de cada mecânica.
- Sem compras, microtransações, cosméticos pagos ou opção paga para remover anúncios.
- Respeitar a disponibilidade e as regras de cada portal; não inserir anúncios forçados durante a ação do block breaker.

## 9. Backlog futuro

Itens já implementados na v0.2.0 (blocos especiais, elementos, chefes, mais perks, estruturas de fase, encerramentos e zoom) saíram deste backlog. O **modo Endless** entrou no escopo da **v0.3.0** com fase infinita, progressão, chefes recorrentes e recordes no save. A **v0.4.0** fechou a lacuna de apresentação/UX e implementou interstitials e rewarded revive. A **v0.5.0** adicionou tutorial in-game, controles touch com edge assist, gate do laser, política de ads mais conservadora e aviso de storage; a build está em `main`, aguardando teste humano.

- Leaderboard específico do modo Endless (o ranking global continua fora).
- Metaprogressão permanente com desbloqueios de conteúdo, sem bônus permanentes de atributos iniciais.
- Outros usos de rewarded ads (bônus, rerolls) após definir benefícios e limites para preservar o equilíbrio.
- Rankings globais e conquistas, condicionados aos recursos dos portais.
- Mundos temáticos sci-fi/futurista e industrial/pós-apocalíptico.
- Localização para outros idiomas.
- Modo landscape jogável.
- Editor de fases ou pipeline procedural.
- Backend, contas e cloud save.
- Full Launch do CrazyGames e novos portais (Poki, GameDistribution, Famobi).

## 10. Pendências e validação de consistência

| Tema | Pendência / observação |
|---|---|
| Conteúdo | A campanha de 6 fases / 20 ondas está fechada; com o tutorial, são 7 cards / 22 ondas. Não há novas fases da campanha nesta versão. O Endless é gerado proceduralmente. |
| Tutorial | Implementado com 2 ondas, 48 blocos, 55 XP e 3 level ups; skip e coach marks cobertos por testes. Falta validar compreensão em teste humano. |
| Endless | Uma fase infinita implementada; balanceamento das ondas altas e dos chefes ainda depende de playtest humano. |
| Ondas | Distribuição decidida: tutorial 2; campanha 2/3/3/3/4/5. A fase 1 encurtada e as ondas 4–6 estão implementadas e validadas. |
| Perks | Catálogo fechado em 19 perks, com níveis, pré-requisitos e fallback interno. Balanceamento fino ainda depende de playtest humano. |
| Chefes | Três chefes definidos (Frost Sentinel, Ember Warden, Void Herald) com HP, padrão, shards e corrosão. Ajuste de dificuldade segue aberto para playtest. |
| Regras de onda | `timeLimit` e `noLaser` implementados nas ondas definidas. Novas combinações de desafio ficam para o futuro. |
| Zoom | Escala 0,68–1,0 implementada e validada no conteúdo. Testar legibilidade em telas pequenas reais. |
| Balanceamento | Ainda depende de playtest humano; o bot de QA não substitui jogador. |
| Rewarded ads | Revive uma vez por run implementado; outros usos ficam para o futuro. |
| Metaprogressão | Fora do escopo; decidir se a próxima fase é conteúdo, meta ou plataforma. |
| Localização | Fora do escopo; o catálogo de strings precisa ser separado por locale antes. |
| Performance real | Protocolo e script prontos (`docs/qa/performance-testing.md`, `scripts/perf-smoke.mjs`); resultados da 0.5.0 pendentes. |
| Distribuição | itch.io e Playgama sandbox com `0.4.0`; 0.5.0 em main; CrazyGames 0.3.0 e 0.4.0 reprovadas; GameFlare bloqueado. |
| Apresentação desktop | HUD compacto implementado; **decisão: não fazer moldura/letterbox desktop** nesta linha. Risco residual de iframe desktop. |
| Ads | Política 0.5.0 implementada e testada com mock; acompanhar fill/limites reais na Playgama e CrazyGames. |
| Store assets | Capas, screenshots e vídeos ainda são da 0.4.0; regerar antes da submissão da 0.5.0. |
| Áudio | Novos elementos e chefes usam SFX existentes; mixagem final ainda pode ser refinada. |

### Checklist de coerência

- A vida compartilhada significa que uma bolinha pode cair sem terminar a run se outra continuar ativa; a derrota ocorre quando todas caem.
- Perks de bola são passivos/automáticos; perks de ataque pertencem ao rebatedor e podem ser automáticos ou manuais.
- O level up pausa o jogo para a escolha de um entre três perks; as ondas só avançam após todos os blocos (e o chefe, quando houver) serem destruídos.
- O tutorial libera o level 1 em save novo; skip conclui a fase; save antigo com `unlockedPhase >= 1` não repete.
- O laser exige lançamento explícito na onda e pelo menos uma bola solta; reset, Sticky e a bola inicial presa bloqueiam o disparo.
- O toque é relativo 1:1 no centro, com ganho até 2,2× na zona externa de 22%; mouse é absoluto e a velocidade do paddle não mudou.
- O zoom é escala de layout, não de câmera; o input não muda.
- Metaprogressão desbloqueia conteúdo, não bônus permanentes de atributos. A run ativa não é salva.
- O Endless é uma run separada: não desbloqueia fases, não substitui a campanha e mantém seus próprios recordes no save.
- A monetização é somente publicidade; o rewarded revive é opcional e tem caminho sem ad; tutorial não tem ads.
- O build `0.1.0-mvp` é histórico; a `0.4.0` está publicada no itch.io e no sandbox da Playgama; a `0.5.0` está em `main` e ainda não publicada.

---

## Histórico de versões

| Versão | Data | Mudanças |
|---|---|---|
| `1.0` | 2026-11-07 | GDD do MVP: 3 fases × 3 ondas, 3 blocos, 11 perks, sem chefes. |
| `1.1` | 2026-11-08 | v0.2.0-dev: campanha de 6 fases / 21 ondas, 9 blocos, 7 elementos, 3 chefes, 19 perks, desafios, zoom de layout, encerramentos e save 1..6. |
| `1.2` | 2026-11-09 | v0.3.0-dev: modo Endless com fase infinita, velocidade 660→1100, linhas 4→12, chefes a cada 5 ondas, save `endless` e results próprios. |
| `1.3` | 2026-11-10 | v0.4.0-dev: revisão visual dos blocos, menu Campaign/Endless, fundo animado, seleção de fases temática, settings de som/música/shake, Endless desbloqueado ao concluir a campanha, HUD compacto, How to Play, About Us, interstitials a cada 3/4 ondas, rewarded revive 1x por run e save `campaignComplete`. |
| `1.4` | 2026-11-10 | Fechamento da v0.4.0: status, escopo, distribuição, ads e pendências atualizados para a nova sessão; GDD consolidado como fonte de design. |
| `1.5` | 2026-11-11 | v0.5.0: tutorial jogável/pulável com 2 ondas e gate do level 1; campanha em 20 ondas (2/3/3/3/4/5); 775/1.832 com tutorial; edge assist do toque; gate explícito do laser; nova política de ads; aviso de storage; segunda reprovação da CrazyGames e decisão de não fazer moldura desktop. |
| `0.1.0-mvp` | 2026-11-08 | Build publicado no itch.io; ZIP congelado. |
| `0.2.0-dev` | 2026-11-08 | Expansão da campanha em desenvolvimento; ainda não publicada nos portais. |
| `0.3.0-dev` | 2026-11-09 | Modo Endless em desenvolvimento; campanha e build publicado permanecem intactos. |
| `0.4.0-dev` | 2026-11-10 | Revisão visual/menu, HUD compacto, How to Play/About, ads com rewarded revive, docs reorganizados. |
| `0.5.0-dev` | 2026-11-11 | Tutorial, campanha de 20 ondas, edge assist, gate do laser, política de ads e aviso de storage; build em main aguardando teste humano. |

Este GDD separa as decisões confirmadas do recorte da versão atual, do backlog futuro e das pendências de design. Use a seção de pendências para fechar parâmetros e critérios de aceite antes de transformar o escopo em tarefas de implementação.
