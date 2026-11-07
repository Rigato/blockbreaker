# Plano de implementação — MVP Block Breaker Roguelite

**Repositório:** <https://github.com/Rigato/blockbreaker>  
**Documento de design:** `GDD_Block_Breaker_Roguelite.md` (v1.0, 7 nov 2026)  
**Restrições de distribuição:** `spec-tecnica-publicacao.md` e `plano-baixa-fricao.md`  
**Data do plano:** 7 de novembro de 2026  
**Estado do repositório:** vazio na data do plano; o M0 cria o scaffold.  
**Status:** planejamento concluído; **nenhuma linha de código de jogo foi implementada**.

> **Regra de leitura:** o GDD é a especificação de gameplay. Os documentos de distribuição são a especificação de build, plataforma e publicação. Quando houver conflito, o GDD vence em design e os documentos de distribuição vencem em restrições de portal. Parâmetros ainda abertos no GDD recebem uma **proposta inicial** neste plano e são validados nos gates.

---

## 0. Como este plano funciona

O trabalho é dividido em oito milestones (`M0`–`M7`). Cada milestone termina em um **gate de revisão** com:

1. um artefato testável (build no GitHub Pages, ZIP ou vídeo curto);
2. um roteiro de teste objetivo;
3. uma decisão explícita sua: **aprovar, ajustar ou parar**.

**Nenhum milestone seguinte começa sem aprovação explícita do gate anterior.** O `main` é sempre a vitrine de revisão; trabalho de subagente fica em branch/worktree até a integração.

O plano também define:

- o recorte fechado do MVP e uma válvula de escopo para não estourar;
- a arquitetura técnica e os contratos que permitem paralelizar subagentes;
- a divisão de trabalho entre subagentes, todos com **DeepSeek V4.1 Flash, esforço `low`**;
- a estratégia de build único e distribuição web desde o primeiro commit.

### Resumo executivo

| Item | Decisão |
|---|---|
| Recorte | 3 fases × 3 ondas; 10 perks; blocos de 1–3 HP; sem chefe |
| Stack | Phaser 3.90 + TypeScript estrito + Vite 8; física própria a 120 Hz |
| Distribuição | Um ZIP; Bridge; itch.io → GameFlare → Playgama → CrazyGames Basic |
| Milestones | M0 fundação → M1 core → M2 perks → M3 fases/save → M4 apresentação → M5 Bridge/build → M6 QA → M7 release |
| Gates | G0–G7; nenhum milestone avança sem seu OK |
| Subagentes | 9 papéis (S0–S8), todos com DeepSeek V4.1 Flash, esforço `low` |
| Primeiro passo | Aprovar o plano e iniciar M0 com o subagente `foundation` |

---

## 1. Objetivo e critérios de sucesso

### 1.1 Objetivo do MVP

Provar, em uma build HTML5 portrait, que o ciclo **rebater → mirar → quebrar blocos → ganhar XP → escolher perk → sentir a build mudar** é divertido o suficiente para justificar expansão de conteúdo.

O MVP não precisa provar campanha longa, chefes, catálogo grande de blocos ou metaprogressão profunda. Precisa provar o loop principal e a distribuição em um único build.

### 1.2 Critérios de sucesso

| Dimensão | Critério | Como medir |
|---|---|---|
| Diversão | 4 de 5 playtesters completam a fase 1 em até 3 tentativas e aceitam jogar de novo | Sessão observada de 20–30 min, 5 pessoas |
| Ritmo | Run de 2–5 min; 3–5 level ups por run | Telemetria local de teste + cronômetro |
| Variedade | Pelo menos 3 arquétipos de perk escolhidos entre os playtesters; nenhum perk dominante em mais de 70% das ofertas em que apareceu | Registro de escolhas |
| Técnico | 60 fps em Android médio, iPhone recente e Chromebook 4 GB; sem crash em rotação, background, adblock e anúncio | Matriz de testes do §8 |
| Distribuição | Checklist do §5.5 passa; ZIP único abre em subpasta, em modo mock e com SDK bloqueado | Build de release |
| Escopo | Nenhuma funcionalidade fora do §2.1–§2.3 | Revisão de backlog |

### 1.3 Fora do escopo do MVP

- Campanha completa, vários mundos, chefes, desafios e encerramentos variados.
- Catálogo grande de blocos, blocos móveis/regenerativos/geradores e obstáculos de fase.
- Metaprogressão com moeda, loja, novos rebatedores ou melhorias permanentes de atributos.
- Rankings globais, conquistas, leaderboards, tarefas, login e conta.
- Rewarded ads, banners, pagamentos, cosméticos e qualquer monetização além do interstitial.
- Full Launch do CrazyGames; o MVP trabalha com Basic Launch.
- Localização em vários idiomas; a interface do jogo é **100% em inglês**.
- Editor de fases, pista procedural e ferramentas de conteúdo fora do código.
- Zoom dinâmico de gameplay; o MVP usa fit-to-viewport (o campo inteiro sempre visível). Zoom com limite mínimo/máximo fica para depois do G1.
- Modo landscape jogável; mobile landscape apenas pausa e pede para girar.

---

## 2. Recorte funcional do MVP

### 2.1 Loop principal

1. Tela inicial com **Play** e seleção de fase desbloqueada.
2. A run começa com uma bolinha presa ao rebatedor; toque/clique/espaço lança.
3. Jogador move o rebatedor por toque/deslize, mouse ou teclado.
4. Bolinha quica em paredes, rebatedor e blocos; cada impacto causa dano.
5. Bloco destruído concede XP e pontuação.
6. Ao encher a barra de XP, a simulação pausa e mostra **3 perks aleatórios**; o jogador escolhe 1.
7. A onda termina quando todos os blocos destrutíveis somem; a próxima onda começa após uma transição curta.
8. Se todas as bolinhas caírem, a run termina em derrota; se o jogador tiver `Safety Net`, a última bolinha pode ser salva.
9. Limpar a última onda da fase conclui a run, salva estatísticas e desbloqueia a próxima fase.
10. Derrota permite **Retry** imediato; vitória permite **Next Phase**, **Retry** ou **Menu**.

### 2.2 Conteúdo inicial

**Fases:** 3 fases × 3 ondas (9 ondas no total), sem chefe.

| Fase | Tema provisório | Curva | Desbloqueio |
|---|---|---|---|
| 1 | Crystal Grove | Blocos 1–2 HP, bolinha mais lenta | Disponível desde o início |
| 2 | Ruined Halls | Blocos 1–3 HP, mais densidade | Limpar a fase 1 |
| 3 | Arcane Depths | Blocos 2–3 HP, padrões mais fechados | Limpar a fase 2 |

**Blocos:** três resistências, comunicadas por cor **e** estado visual (rachaduras, borda, pips), nunca só por cor.

| Tipo | HP | Leitura visual | XP |
|---|---:|---|---:|
| Crystal | 1 | Brilho claro, sem rachadura | 1 |
| Stone | 2 | Rachadura média, borda espessa | 2 |
| Obsidian | 3 | Borda dupla, runas, rachadura forte | 3 |

**Perks iniciais (10):** mistura de repetíveis e únicos, cobrindo atributos, bolinha, rebatedor, defesa e ataque.

| ID | Nome (en) | Tipo | Máx. | Efeito inicial |
|---|---|---|---:|---|
| `multiball` | Multiball | Repetível | 3 | +1 bolinha por nível |
| `wide_paddle` | Wide Paddle | Repetível | 3 | +12% de largura do rebatedor por nível |
| `power_ball` | Power Ball | Repetível | 3 | +1 de dano por nível |
| `quick_study` | Quick Study | Repetível | 2 | +20% de XP por nível |
| `auto_turret` | Arcane Turret | Repetível | 3 | Projétil automático a cada 3,2 s; −0,4 s por nível |
| `giant_ball` | Giant Ball | Repetível | 2 | +15% de raio por nível |
| `sticky_paddle` | Sticky Paddle | Único | 1 | Prende a bolinha; solta com toque ou após 2,5 s |
| `safety_net` | Safety Net | Único | 1 | 1 salvamento por onda; recarrega ao iniciar onda |
| `prism_laser` | Prism Laser | Único | 1 | Ataque manual; feixe vertical; cooldown 8 s; botão contextual |
| `explosive_core` | Explosive Core | Único | 1 | A cada 8 blocos destruídos, explosão em raio de 1 célula |

> O catálogo é curto de propósito. Raridade, reroll, sinergias explícitas e perks únicos adicionais ficam para depois do gate G2.

### 2.3 Telas e estados

| Tela/estado | Conteúdo mínimo |
|---|---|
| Boot/Loading | Barra de progresso própria; sem logo do Bridge; entra no menu quando o primeiro frame interativo estiver pronto |
| Menu | Título, **Play**, **Phases**, som on/off, melhor tempo/score |
| Phase Select | 3 cards, cadeado nas bloqueadas, melhor resultado, voltar |
| Game | HUD de fase/onda, XP/nível, bolinhas ativas, perks adquiridos, pausa |
| Level Up | Overlay com 3 cards, descrição, nível atual/máx., escolha por toque ou 1/2/3 |
| Pause | Retomar, reiniciar, som, sair para o menu |
| Results | Vitória/derrota, fase, tempo, score, melhor, nível, perks; Retry/Next/Menu |
| Orientation | Em mobile landscape, pausa e overlay “Rotate to portrait”; retoma ao voltar |

### 2.4 Persistência

Salvar apenas o que o GDD permite:

- maior fase desbloqueada;
- melhor tempo, melhor score, tentativas e clears por fase;
- configurações (som);
- versão do schema.

**Não salvar run ativa.** Sair do jogo perde a run. Não há moeda, loja ou melhoria permanente.

### 2.5 Válvula de escopo

Se um milestone estourar, cortar nesta ordem, sem mexer no loop:

1. **M3:** reduzir de 3 para 2 fases (6 ondas); a fase 3 vira backlog. O desbloqueio entre fases continua testado.
2. **M4:** manter arte placeholder e SFX; cortar música e partículas secundárias.
3. **M5:** publicar primeiro em itch.io, GameFlare e Playgama; CrazyGames Basic Launch fica para a rodada seguinte.
4. **M7:** adiar capa/vídeo de portal; o build e a submissão técnica continuam.

Qualquer corte precisa ser registrado no gate e aprovado por você.

---

## 3. Decisões e parâmetros propostos

Estes valores fecham as pendências do GDD para permitir implementação. Todos ficam em `src/game/config.ts` ou em dados de conteúdo, ajustáveis no painel de debug e nos gates.

| Tema | Decisão proposta | Ajustar em |
|---|---|---|
| Engine | Phaser 3.90.0 para cenas/render/input/áudio; física própria | G0 |
| Linguagem/build | TypeScript 7 estrito + Vite 8; sem framework de UI | G0 |
| Resolução lógica | Largura fixa de 720 unidades; altura 1280–1440 (aspecto 9:16 a 9:20); clamp em 1:2 | G1 |
| Orientação | Portrait; desktop com moldura portrait centralizada; mobile landscape pausa com overlay | G1 |
| Passo de simulação | Fixo em 120 Hz, acumulador, máximo de 5 passos por frame | G1 |
| Rebatedor | 120 unidades de largura, 18 de altura, velocidade máxima 2600 u/s | G1 |
| Controle touch | Arrasto relativo 1:1, sem teleporte; alvo inicial sob o dedo | G1 |
| Controle desktop | Mouse absoluto; setas/A-D com aceleração; espaço lança; P pausa | G1 |
| Bolinha | Raio 9; velocidade base 520 u/s; +40 por onda; teto 700 | G1 |
| Lançamento | Ângulo inicial entre −50° e +50° conforme posição do rebatedor | G1 |
| Rebote no rebatedor | Ângulo máximo de 60° em relação à vertical; influência leve da velocidade do rebatedor | G1 |
| Blocos | 1–3 HP; XP = HP máximo; grid ASCII por onda | G3 |
| XP | `xpToNext(level) = 20 + 10 × (level − 1)`; overflow carrega | G2 |
| Level up | Pausa imediata; 3 opções distintas; sem reroll; fila se subir 2 níveis | G2 |
| Perks | 10 iniciais; pesos iguais; máximo por perk; sem duplicata na mesma oferta | G2 |
| Sticky | Solta com toque/clique/espaço ou automaticamente após 2,5 s | G2 |
| Safety Net | 1 carga por onda; salva a última bolinha | G2 |
| Laser manual | Botão contextual no canto inferior direito; cooldown 8 s; tecla E no desktop | G2 |
| Turret | Projétil automático; 3,2 s; dano 1; reduz 0,4 s por nível | G2 |
| Limite de bolas | 8 simultâneas | G1 |
| Ondas | 3 por fase; próxima só após limpar todos os blocos | G3 |
| Fases | 3; desbloqueio sequencial; sem chefe | G3 |
| Run alvo | 2–5 min por fase; 3–5 level ups | G3 |
| Score | 10 × HP destruído + 100 por onda + 500 por fase | G3 |
| Save | Fases desbloqueadas + estatísticas + som; sem run ativa | G3 |
| Anúncios | Apenas interstitial no fim de run/transição natural; sem rewarded no MVP | G5 |
| Analytics | Nenhum analytics externo; `sendAnalyticsEvents: false` | G5 |
| Idioma | Interface 100% inglesa; `platform.language` lido, fallback `en` | G5 |
| Arte | Pixel art provisória, tema fantasia; assets de portal com refino humano | G4 |
| Áudio | SFX curtos + loop opcional; ogg/mp3; sem faixa licenciada de terceiros | G4 |
| Build | ZIP único, `index.html` na raiz, caminhos relativos, sem fonte/recurso externo | G5 |
| Deploy de review | GitHub Pages a cada merge na `main`; release em tag | G0 |
| Navegadores | Chrome/Edge desktop, Safari iOS, Chrome Android, Chromium OS 4 GB | G6 |

---

## 4. Arquitetura técnica

### 4.1 Stack

| Pacote | Versão de referência | Papel |
|---|---|---|
| `phaser` | 3.90.x | Cenas, render, input, áudio e loop de render |
| `typescript` | 7.x (ou 5.9 LTS se houver atrito) | Tipagem estrita |
| `vite` | 8.x | Dev server, build e plugin do Bridge |
| `vitest` | 5.x | Testes unitários da simulação e progressão |
| `@playgama/bridge` | 2.4.x | Storage, ads, lifecycle e plataforma |
| `tsx` | 4.x (dev) | Executar scripts TypeScript de validação/empacotamento |
| `playwright` | 1.65.x (dev) | Smoke test do build em browser headless |

Versões exatas ficam travadas no `package-lock.json` no M0. **Não atualizar Phaser, Vite ou Bridge no meio do MVP**; qualquer upgrade é uma tarefa separada com regressão completa.

### 4.2 Princípios

1. **Simulação pura, sem Phaser.** `src/sim` não importa Phaser. Recebe estado + input + `dt`, devolve estado. Isso permite testes determinísticos, headless e tuning fora da renderização.
2. **Dados, não código, para conteúdo.** Ondas, fases, blocos e perks são objetos tipados; o código não tem `if (fase === 2)`.
3. **Zero branch de plataforma no jogo.** Todo acesso a storage, ads e lifecycle passa por `PlatformService`. Nenhum `if (platform === ...)` em código de gameplay.
4. **UI em DOM, jogo em canvas.** HUD, menus e overlays são DOM/CSS; o canvas Phaser cuida do campo, bolinhas, blocos e partículas. Isso melhora texto, acessibilidade, safe area e responsividade.
5. **Save versionado e serializado em string.** O Bridge storage recebe arrays de mesmo tamanho; objetos são serializados em JSON.
6. **RNG determinístico por run.** Ofertas de perk e partículas usam seed; testes conseguem reproduzir resultados.
7. **Inglês centralizado.** Todas as strings de UI ficam em `src/i18n/en.ts`; nada hardcoded em componentes.

Fluxo por frame:

```text
Input (touch/mouse/keyboard)
        ↓
Simulation 120 Hz (paddle, balls, blocks, projectiles, XP)
        ↓
RunState + eventos tipados
        ↓
Phaser render (canvas) + DOM UI (HUD/overlays)
        ↓
PlatformService (Bridge): lifecycle, storage, ads, pause/audio
```

### 4.3 Estrutura de arquivos

```text
/
├── README.md
├── .gitignore
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── public/
│   ├── playgama-bridge-config.json
│   ├── assets/                  # sprites, tiles, fontes, áudio
│   └── favicon.svg
├── src/
│   ├── main.ts                  # boot do Bridge + import dinâmico do jogo
│   ├── style.css
│   ├── boot/
│   │   └── bridgeBoot.ts        # timeout, fallback, game_ready
│   ├── game/
│   │   ├── Game.ts              # orquestração, cenas, resize
│   │   ├── config.ts            # defaults de tuning
│   │   ├── contracts.ts         # tipos compartilhados e congelados
│   │   └── events.ts            # EventBus tipado
│   ├── sim/
│   │   ├── World.ts             # estado, step fixo
│   │   ├── Paddle.ts
│   │   ├── Ball.ts
│   │   ├── Blocks.ts
│   │   ├── Projectiles.ts
│   │   ├── collision.ts         # circle vs AABB varrido
│   │   ├── spawn.ts             # bolas, projéteis, explosões
│   │   └── antiStall.ts
│   ├── input/
│   │   └── Input.ts             # touch, mouse, teclado
│   ├── content/
│   │   ├── types.ts             # WaveDef, PhaseDef, BlockDef, PerkDef
│   │   ├── blocks.ts
│   │   ├── waves.ts             # 9 layouts ASCII
│   │   ├── phases.ts
│   │   ├── perks.ts             # catálogo de perks (dados)
│   │   └── validate.ts
│   ├── progression/
│   │   ├── RunState.ts
│   │   ├── Xp.ts
│   │   ├── PerkSystem.ts
│   │   └── offers.ts
│   ├── platform/
│   │   ├── PlatformService.ts   # interface
│   │   ├── BridgeAdapter.ts
│   │   ├── FallbackAdapter.ts
│   │   ├── Storage.ts
│   │   ├── Ads.ts
│   │   └── Lifecycle.ts
│   ├── ui/
│   │   ├── UIRoot.ts
│   │   ├── Hud.ts
│   │   ├── LevelUpOverlay.ts
│   │   ├── PauseOverlay.ts
│   │   ├── ResultsOverlay.ts
│   │   ├── PhaseSelect.ts
│   │   └── DebugPanel.ts
│   ├── render/
│   │   ├── GameScene.ts
│   │   ├── BlockView.ts
│   │   ├── BallView.ts
│   │   ├── PaddleView.ts
│   │   └── Particles.ts
│   ├── audio/
│   │   └── Audio.ts
│   └── i18n/
│       └── en.ts
├── tests/
│   ├── collision.test.ts
│   ├── progression.test.ts
│   ├── offers.test.ts
│   ├── save.test.ts
│   ├── content.test.ts
│   └── e2e/
│       └── smoke.spec.ts
├── scripts/
│   ├── validate-content.ts
│   ├── package.mjs
│   └── smoke.mjs
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── deploy.yml
│       └── release.yml
├── docs/
│   ├── GDD_Block_Breaker_Roguelite.md
│   ├── spec-tecnica-publicacao.md
│   ├── plano-baixa-fricao.md
│   └── plano-implementacao-mvp.md
└── store/                        # fora do ZIP do jogo
    ├── covers/
    ├── screenshots/
    └── metadata/
```

> No workspace atual os documentos estão em `Docs/` (maiúsculo). No primeiro commit do repo, padronizar `docs/` em minúsculo e manter o conteúdo.

### 4.4 Loop e física

**Fixed step:** `dt = 1/120 s`; acumulador; se o frame atrasar, no máximo 5 passos; o restante é descartado para não “teleportar”. Pausa zera o acumulador.

**Coordenadas:** largura lógica 720; altura dinâmica; `y` cresce para baixo (padrão Phaser). O rebatedor fica em `y = worldHeight − 120`; a zona de perda é abaixo de `worldHeight + 40`.

**Bolinha:**
- círculo com posição, velocidade e raio;
- velocidade constante normalizada; sem gravidade;
- dano base 1, modificado por perks;
- flags `stuck`, `lastBlockHit`, `spawnGrace` (0,4 s para não colidir com o rebatedor ao nascer).

**Colisão varrida (swept circle vs AABB):**
- calcular o tempo de impacto mais cedo entre paredes, rebatedor, blocos e projéteis;
- resolver o primeiro impacto, refletir a velocidade e repetir com o tempo restante;
- máximo de 4 impactos por passo para evitar loop;
- “nudge” de 0,01 unidade para fora da superfície;
- cooldown de 50 ms por bloco para não contar o mesmo bloco duas vezes no mesmo passo;
- testes obrigatórios: alta velocidade, quina, duas bolas no mesmo bloco, rebote no rebatedor, túnel através de bloco fino.

**Rebatedor:**
- AABB com cantos arredondados visuais; colisão trata como AABB;
- ao rebater, o ponto de contato define o ângulo: `offset = (ball.x − paddle.x) / (paddle.width / 2)`, clampado em [−1, 1];
- ângulo final = `offset × 60°` em relação à vertical; nunca deixa a bolinha descer;
- soma no máximo 15% da velocidade horizontal do rebatedor;
- normaliza a velocidade para a velocidade da onda.

**Blocos:**
- grid carregado de `rows: string[]`; cada caractere aponta para um tipo no `legend`;
- tamanho de célula calculado pela largura e número de colunas; gap visual de 4 unidades;
- HP, flash de impacto, rachadura por nível e destruição;
- grid estático com lookup por índice; sem física de corpo por bloco.

**Múltiplas bolas:**
- array com limite 8;
- cada bola é independente;
- spawn de `Multiball` com ângulos ±18°, ±36° etc., a partir do rebatedor;
- se o número de bolas cair para 1, não há penalidade; a run só termina quando o array fica vazio.

**Anti-stall:**
- se uma bola não atinge bloco nem rebatedor por 6 s, aplicar nudge de 4°;
- se ficar quase horizontal por 3 s, aumentar o ângulo vertical;
- se ficar presa acima de blocos, teleportar suavemente para o centro acima do rebatedor após 8 s (com aviso visual);
- tudo registrado em debug.

### 4.5 Conteúdo

Formato de onda:

```ts
type WaveDef = {
  id: string;
  name: string;
  rows: string[];                 // mesma largura em todas as linhas
  legend: Record<string, BlockTypeId>;
  ballSpeed: number;
  rewardXpBonus?: number;
};
```

Exemplo:

```ts
{
  id: 'p1w1',
  name: 'First Light',
  rows: [
    '..111..',
    '.12221.',
    '1123211',
  ],
  legend: { '1': 'crystal', '2': 'stone', '3': 'obsidian' },
  ballSpeed: 520,
}
```

Validação (`npm run validate:content`):
- todas as linhas têm o mesmo comprimento;
- todo caractere existe no legend;
- pelo menos um bloco destrutível por onda;
- nenhum bloco na zona do rebatedor;
- toda fase tem exatamente 3 ondas;
- ids únicos;
- fase 2/3 não referencia onda de outra fase;
- dificuldade (HP médio e densidade) cresce de forma monotônica, com tolerância.

### 4.6 Progressão e perks

**`RunState`** guarda fase, onda, score, tempo, XP, nível, level ups pendentes, bolas, perks escolhidos e estatísticas.

**Modificadores derivados:** `RunModifiers` é recalculado a partir dos perks a cada escolha. O código de física lê multiplicadores/flags; nunca altera os valores-base.

```ts
type RunModifiers = {
  paddleWidthMultiplier: number;
  ballRadiusMultiplier: number;
  ballDamage: number;
  xpMultiplier: number;
  maxBalls: number;
  turretInterval: number | null;
  stickyPaddle: boolean;
  laserCooldown: number | null;
  safetyNetCharges: number;
  explosiveEvery: number | null;
};
```

**Ofertas:**
- 3 perks distintos, sorteados por peso;
- excluir perks no nível máximo;
- se houver menos de 3 elegíveis, completar com um perk repetível de XP sem máximo (fallback interno, fora do catálogo normal);
- seed da run registrada em debug;
- sem reroll no MVP.

**Level up:**
- XP excedente carrega;
- se dois níveis enchem no mesmo frame, enfileirar;
- escolher um perk aplica imediatamente, fecha o overlay e retoma;
- `Multiball` aplicado durante a pausa só spawna ao retomar;
- `Wide Paddle` mantém o rebatedor dentro dos limites;
- `Safety Net` recarrega no início de cada onda;
- `Prism Laser` só mostra o botão se o perk foi escolhido; cooldown radial; tecla E no desktop;
- `Explosive Core` conta blocos destruídos e explode em raio de 1 célula.

### 4.7 UI e responsividade

- `#app` fixo, `overflow: hidden`, `height: 100dvh` com fallback para `100vh`.
- Canvas absoluto; UI overlay `pointer-events: none`, botões com `pointer-events: auto`.
- Safe area com `env(safe-area-inset-*)`; não duplicar padding se o Bridge já ajustar o canvas.
- Largura lógica 720; altura calculada pelo aspecto; clamp 1280–1440. Se a tela for mais alta que 1:2, letterbox decorativo; se mais larga, moldura portrait centralizada no desktop.
- Escala de UI independente do canvas; texto DOM nítido; alvos de toque ≥ 44 px.
- `touch-action: none` no campo; `touch-action: manipulation` nos botões.
- Rotação: recalcular layout; se mobile landscape, pausar e mostrar overlay; estado preservado; retomar ao voltar para portrait.
- Sem scrollbar, sem elemento cortado, sem pop-up sem fechar.
- Pausa automática em `visibilitychange`, `blur` e evento de pause do Bridge.
- DPR limitado a 2; pixel art com `pixelArt: true` e `roundPixels: true`; testar DPR=1 forçado.
- Primeiro toque/clique desbloqueia o áudio (iOS).

### 4.8 Áudio

- `AudioService` com buses `master`, `sfx`, `music`; `unlock()` no primeiro gesto.
- SFX mínimos: rebote no rebatedor, impacto em bloco, quebra, perda de bola, level up, vitória, derrota.
- Música: loop opcional de 60–90 s; se entrar, ogg/mp3 comprimido e carregado depois do menu.
- Mutar durante pause, background, anúncio e `platform.isAudioEnabled === false`.
- Restaurar somente depois de gesto do jogador quando o iOS suspender o `AudioContext`.
- Sem arquivos `.wav`; sem faixa licenciada de terceiros; placeholder original.

### 4.9 Plataforma e Bridge

**Boot:**

```text
index.html
  → script do Bridge (primeiro script do head, síncrono; CDN com fallback local)
  → bridgeBoot.ts: Promise.race([bridge.initialize(), timeout(10s)])
  → import dinâmico de src/main.ts
  → carrega save (com timeout e fallback em memória)
  → menu interativo
  → platform.sendMessage('game_ready')
```

- Se o Bridge não existir ou não inicializar, usar `FallbackAdapter` (no-op + storage em memória). **Nunca** usar `localStorage` direto no código do jogo.
- `game_ready` só depois do menu renderizado e interativo; nunca durante loading.
- `level_started` ao iniciar a run; `level_paused`/`level_resumed` em pause, level up e retomada; `level_completed`/`level_failed` ao entrar em results.
- O Bridge mapeia essas mensagens para `gameplayStart`/`gameplayStop` do CrazyGames; **não chamar SDK nativo**.
- `platform.isAudioEnabled` no boot; assinar `AUDIO_STATE_CHANGED` e `PAUSE_STATE_CHANGED`.
- `platform.language` lido uma vez; interface só `en` por enquanto; fallback `en`.
- Nenhum `if (platform === ...)` no jogo. Diagnóstico de `platform.id` apenas no painel de debug.

**Storage:**

```ts
interface StorageService {
  get(keys: string[]): Promise<(string | null)[]>;
  set(keys: string[], values: string[]): Promise<void>;
}
```

- Uma chave principal `bb.save` com JSON string; uma chave `bb.settings` para som.
- Arrays de mesmo tamanho; defaults para `null`; timeout de 3 s; fallback em memória.
- Um `get` no boot; `set` só em mudança significativa (fim de fase, unlock, settings).

**Ads:**

```ts
interface AdsService {
  isInterstitialSupported: boolean;
  showInterstitial(placement: string): Promise<'shown' | 'skipped' | 'failed'>;
}
```

- Apenas interstitial no MVP; sem rewarded UI.
- Chamar uma vez na transição de saída dos results (Next/Retry), nunca durante a ação.
- Pausar simulação e mutar áudio antes; retomar em `closed`, `failed` ou timeout de 15 s.
- `failed`/`adError` significam “sem ad”: o jogo continua.
- Não implementar frequência própria; o Bridge controla `minimumDelayBetweenInterstitial`.
- Em Basic Launch do CrazyGames, ads estão desligados; o fluxo precisa funcionar sem eles.

### 4.10 Persistência

```ts
type SaveV1 = {
  version: 1;
  unlockedPhase: number;          // 1..3
  phases: Record<string, {
    bestTimeMs: number | null;
    bestScore: number | null;
    attempts: number;
    clears: number;
    bestLevel: number;
  }>;
  updatedAt: number;
};
```

- Parse seguro: JSON inválido, versão desconhecida ou campo faltando → defaults.
- `version` permite migração futura; não migrar nada no MVP.
- Reset de save acessível por `?debug=1` (botão) e `?resetSave=1`; nunca exposto na UI normal.
- Testar: primeiro boot sem save, save corrompido, save de versão futura, reload após limpar cache, modo mock.

### 4.11 Build, CI e deploy

**Scripts:**

```json
{
  "dev": "vite",
  "build": "tsc -b && vite build",
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "validate:content": "tsx scripts/validate-content.ts",
  "package": "node scripts/package.mjs",
  "preview": "vite preview --host"
}
```

**`vite.config.ts`:** `base: './'`; plugin `playgamaBridge()` (CDN + fallback local); sem source maps em produção; target `es2020`; assets em `assets/` relativos.

**`scripts/package.mjs`:**
- apagar `release/` anterior;
- zipar o conteúdo de `dist/` com `index.html` na raiz;
- validar: `index.html` na raiz, `playgama-bridge-config.json` ao lado, nenhum path absoluto, nenhum `http://`/`https://` externo além do Bridge, caminhos ≤ 240 caracteres, contagem ≤ 1.000 arquivos (limite itch.io; o teto CrazyGames é 1.500) e tamanho ≤ 250 MB;
- gerar `release/blockbreaker-web.zip` e um `manifest.json` com tamanho/hash.

**GitHub Actions:**
- `ci.yml` em PR/push: `npm ci`, typecheck, test, validate content, build, package; upload do ZIP como artifact.
- `deploy.yml` em `main`: build + deploy no GitHub Pages. Pages configurado com source **GitHub Actions**.
- `release.yml` em tag `v*`: build, package, criar GitHub Release e anexar o ZIP.
- URL de review: `https://rigato.github.io/blockbreaker/`.
- Worktrees em `/tmp/opencode/blockbreaker-*` para não sincronizar `node_modules`/`dist` pelo Nextcloud.

---

## 5. Estratégia de distribuição

### 5.1 Um build, um ZIP, quatro portais

O build é **único**. Nada de builds condicionais por portal. O Bridge detecta a plataforma e o jogo chama sempre a mesma API. itch.io e GameFlare caem no mock; Playgama e CrazyGames usam adapters nativos.

### 5.2 Configuração do Bridge

`public/playgama-bridge-config.json`, copiado para a raiz do ZIP:

```json
{
  "showFullLoadingLogo": false,
  "showLoadingText": true,
  "sendAnalyticsEvents": false,
  "game": { "adaptToSafeArea": true },
  "advertisement": {
    "minimumDelayBetweenInterstitial": 60,
    "initialInterstitialDelay": 0,
    "interstitial": { "placementFallback": "phase_completed" },
    "rewarded": { "placementFallback": "extra_life" }
  },
  "platforms": {
    "mock": {
      "sendAnalyticsEvents": false,
      "showFullLoadingLogo": false
    }
  }
}
```

> O schema do Bridge muda entre versões. Este arquivo é a base do spec; no M0/M5 validar contra a versão 2.4.x instalada e ajustar chaves obsoletas (`placements`, `initialInterstitialDelay`, etc.) sem mudar o comportamento. O config final precisa passar no build check da Playgama.

### 5.3 Ciclo de vida e áudio

| Momento | Chamada | Observação |
|---|---|---|
| Menu pronto e interativo | `sendMessage('game_ready')` | Uma vez; nunca no loading |
| Início da run | `sendMessage('level_started', { world, level })` | Fase/onda |
| Pause manual, level up, orientation overlay | `sendMessage('level_paused')` | Pausar simulação e áudio |
| Retomada | `sendMessage('level_resumed')` | Só depois de gesto, se iOS |
| Vitória | `sendMessage('level_completed')` | Antes de results |
| Derrota | `sendMessage('level_failed')` | Antes de results |
| Background/aba inativa | `PAUSE_STATE_CHANGED` | Pausar, mutar, parar timers |
| Áudio da plataforma | `AUDIO_STATE_CHANGED` + `isAudioEnabled` | Estado inicial aplicado no boot |

Não usar `in_game_loading_*` no MVP: todos os assets são pré-carregados e não há loading entre fases. Se entrar loading assíncrono, usar as mensagens.

### 5.4 Anúncios

- **MVP:** interstitial apenas. Nenhum botão de rewarded, banner ou anúncio de terceiros.
- Chamada única na transição de saída dos results (`next`/`retry`); o Bridge decide se mostra, espera ou ignora.
- Antes: pausar simulação, mutar áudio, bloquear interação com spinner.
- Depois: `closed`, `failed` ou timeout → retomar. Nunca travar esperando.
- `isInterstitialSupported` falso (itch.io/GameFlare/Basic Launch) → pular sem UI quebrada.
- Rewarded fica como extensão documentada; quando entrar, recompensa só no estado `rewarded` e sempre com caminho sem ad.

### 5.5 Checklist de build e portal

| Requisito | Como o plano atende | Verificação |
|---|---|---|
| `index.html` na raiz do ZIP | `scripts/package.mjs` zipa `dist/` | `unzip -l` |
| Caminhos relativos | `base: './'`; assets importados | Abrir em subpasta |
| Zero recurso externo | Tudo em `public/assets`; exceção: Bridge CDN com fallback local | Network tab |
| Single-threaded | Sem workers/SharedArrayBuffer | Build + runtime |
| Sem GA4/analytics externo | Nenhuma lib; `sendAnalyticsEvents: false` | Network tab |
| Storage via Bridge | `StorageService`; sem `localStorage` direto | Grep + teste mock |
| Áudio mutado em ads/background | `AudioService` + eventos do Bridge | Teste manual |
| Responsivo, sem scrollbar | CSS + layout dinâmico + safe area | 320 px a desktop |
| Toque, mouse e teclado | `InputService` | Matriz de devices |
| Rotação preserva progresso | Pausa + overlay + state preservado | Girar device |
| Inglês padrão/fallback | `en.ts`; `platform.language` lido | Inspeção |
| Ads só via SDK | `AdsService` | Código + teste |
| Áudio ogg/mp3 | Pipeline de assets | Inspeção |
| Carregar essencial primeiro | Preload pequeno + loading bar | Cold cache |
| `game_ready` correto | Após menu interativo | Bridge DevTools |
| Progresso salvo | `bb.save` no fim de fase | Reload |
| Sem logo do Bridge no itch/GameFlare | `showFullLoadingLogo: false` | Screenshot |
| Sem requests para `api.playgama.com` fora da Playgama | Config false | Network tab |
| Sem player do sistema e sem aviso de WebGL na abertura | Canvas próprio; sem modal técnico | Teste manual |
| Sem limitação por URL / login obrigatório | Fases liberadas in-game; nenhuma conta | Teste manual |
| ZIP ≤ 250 MB, ≤ 1.000 arquivos, paths ≤ 240 caracteres | Orçamento real << 20 MB | Script |
| Capas/vídeo/descrição | `store/` + M7 | Checklist de submissão |

### 5.6 Ordem de publicação

1. **Build + Pages + checklist interno.** ZIP validado; smoke test no build servido em subpasta.
2. **itch.io.** HTML5 ZIP, **Mobile Friendly** ligado, iframe, modelo de doação; sem ads.
3. **GameFlare.** ZIP/link; sem SDK obrigatório; sem ads internos.
4. **Playgama.** Bridge obrigatório, config, `game_ready`, storage, interstitial; review ~24 h.
5. **CrazyGames Basic Launch.** Mesmo ZIP; SDK via Bridge; ads desligados; 3 capas + preview video + descrição ≥ 100 palavras.
6. **Full Launch do CrazyGames:** somente depois de passar no Basic Launch e com uma rodada específica (direto no gameplay, Data/User, QA). Fora do MVP.

Revalidar os requisitos de cada portal **na data da submissão**; as regras mudam.

**Limite consciente do portrait:** o MVP atende itch.io, GameFlare, Playgama e CrazyGames Basic, mas não toda a rede de parceiros da Playgama. MSN exige landscape ou landscape+portrait; VK exige russo como padrão e mais de 10 min de gameplay. Esses canais ficam fora do MVP. Se a distribuição em parceiros for prioridade depois do G6, o próximo passo é um modo landscape e localização russa — não uma decisão deste MVP.

### 5.7 Assets de portal

- 3 capas: 1920×1080 (16:9), 800×1200 (2:3), 800×800 (1:1), visual consistente.
- Sem bordas, sem texto além do título, sem logos de loja, sem screenshot puro, sem pixelização ruim.
- Preview video de 30–60 s com gameplay real.
- Descrição em inglês ≥ 100 palavras + instruções de controle.
- Título consistente em todos os portais.
- **Refino humano obrigatório** nos visuais de portal. O spec alerta que jogos 100% gerados por IA sem retrabalho são rejeitados ou performam pior; a arte placeholder do MVP não é a arte de capa.

### 5.8 O que fica para depois do MVP

- Rewarded ads, banners e qualquer outra monetização.
- Sitelock próprio (o Bridge não implementa whitelist; se entrar, exigirá whitelist das origens do CrazyGames).
- Leaderboards, achievements, tasks, daily rewards, notificações e social.
- Analytics de produto; no MVP, apenas métricas locais de playtest.
- Full Launch do CrazyGames e submissão a Poki/GameDistribution/Famobi.

---

## 6. Divisão entre subagentes

### 6.1 Modelo operacional

- **Agente principal (integrador):** define contratos, revisa código, roda gates, faz merge na `main`, conduz tuning e conversa com você. Não é um subagente.
- **Subagentes:** recebem tarefas pequenas, com escopo de arquivos e critérios de aceite fechados. Entregam branch/worktree + handoff; **não fazem merge nem push na `main`**.
- **Branch por tarefa:** `agent/<id>/<milestone>-<slug>`; worktree em `/tmp/opencode/blockbreaker-<slug>` (via `git worktree add` ou ferramenta de worktree do harness). Nunca trabalhar direto na cópia sincronizada pelo Nextcloud.
- **Integração:** squash merge na `main` após CI verde e revisão do agente principal. O gate é seu.
- **Paralelismo máximo:** 3 subagentes ao mesmo tempo, e apenas quando os contratos e ownership já estiverem congelados.
- **Conflito de arquivo:** se dois subagentes precisam do mesmo arquivo, o agente principal divide a tarefa ou congela o contrato antes.

### 6.2 Modelo e esforço

**Todos os subagentes abaixo usam exatamente:**

- **Modelo:** DeepSeek V4.1 Flash
- **Provider/model ID:** `opencode-go/deepseek-v4.1-flash`
- **Esforço:** `low`
- **Notação de invocação:** `opencode-go/deepseek-v4.1-flash#low`

Não há variação de modelo ou esforço por milestone. O esforço `low` é compensado por tarefas estreitas, contratos explícitos, testes e critérios de aceite. Se um subagente não convergir em duas tentativas, o agente principal **reduz o escopo** e reescreve a tarefa; não aumenta o esforço sem sua aprovação.

### 6.3 Subagentes previstos

| ID | Subagente | Responsabilidade | Entregáveis principais | Ownership | Modelo / esforço | Depende de |
|---|---|---|---|---|---|---|
| **S0** | `foundation` | Bootstrap do repositório, tooling, contratos, shell HTML mínimo, boot do Bridge e CI/Pages | Scaffold Vite/TS/Phaser; `contracts.ts`; `config.ts`; `index.html`; shell DOM; workflows; primeiro deploy | `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.ts`, `src/boot/**`, `src/game/contracts.ts`, `src/game/config.ts`, `src/game/events.ts`, `public/playgama-bridge-config.json` (inicial), `.github/workflows/ci.yml`, `.github/workflows/deploy.yml` | DeepSeek V4.1 Flash · `low` | — |
| **S1** | `physics-core` | Simulação, colisões, input, loop jogável, câmera/fit do campo | `sim/`, `input/`, `GameScene`, testes de física, painel de tuning | `src/sim/**`, `src/input/**`, `src/game/Game.ts`, `src/render/GameScene.ts`, `tests/collision.test.ts` | DeepSeek V4.1 Flash · `low` | S0 |
| **S2** | `progression` | XP, nível, perks, modificadores, ofertas, fluxo de run/save | `progression/`, `perks.ts`, `RunState`, testes de ofertas/stacking, schema de save | `src/progression/**`, `src/content/perks.ts`, `tests/progression.test.ts`, `tests/offers.test.ts`, `tests/save.test.ts` | DeepSeek V4.1 Flash · `low` | S0, S1 |
| **S3** | `content` | Fases, ondas, tipos de bloco, layout ASCII, validadores de conteúdo | 9 ondas, 3 fases, `validate-content.ts`, relatório de dificuldade | `src/content/types.ts`, `src/content/waves.ts`, `src/content/phases.ts`, `src/content/blocks.ts`, `scripts/validate-content.ts`, `tests/content.test.ts` | DeepSeek V4.1 Flash · `low` | S0 |
| **S4** | `ui-ux` | HUD, menu, phase select, level up, pause, results, CSS responsivo e safe area | DOM UI completa, overlays, estados de foco, layout 320 px–desktop | `src/ui/**`, `src/style.css`, `src/i18n/en.ts` | DeepSeek V4.1 Flash · `low` | S0; contratos de S1/S2 |
| **S5** | `presentation` | Arte placeholder, partículas, feedback visual, SFX, pooling visual | Sprites/tiles, atlas, partículas, SFX, orçamento de performance | `public/assets/**`, `src/render/**` (exceto `GameScene.ts`), `src/audio/**` | DeepSeek V4.1 Flash · `low` | S1, S4 |
| **S6** | `platform` | Bridge, storage, ads, lifecycle, build/ZIP, checklist de portal | `PlatformService`, adapters, config, `package.mjs`, `release.yml`, testes mock/adblock | `src/platform/**`, `src/boot/**`, `public/playgama-bridge-config.json`, `scripts/package.mjs`, `.github/workflows/release.yml` | DeepSeek V4.1 Flash · `low` | S0; save de S2 |
| **S7** | `qa-balance` | Testes E2E, matriz de devices, tuning, relatórios de bug e balanceamento | Playwright smoke, scripts de QA, relatórios de 10 runs, patches de tuning | `tests/e2e/**`, `scripts/smoke.mjs`, `docs/qa/**` | DeepSeek V4.1 Flash · `low` | M5 |
| **S8** | `release` | Release, capas, screenshots, descrição/controles e checklist de submissão | Pacote de release coordenado com S6; 3 capas; preview video; metadata; checklist preenchido | `store/**`, `docs/release/**` | DeepSeek V4.1 Flash · `low` | M6 |

**Leitura da tabela:** `ownership` é uma fronteira rígida. O subagente não altera arquivos fora dela; se precisar, pede ao agente principal, que ajusta o contrato ou divide a tarefa. `GameScene.ts` é de S1; S5 trabalha em `render/` sem tocar na cena. `perks.ts` é de S2; S3 não edita perks. O `index.html` é entregue por S0 apenas com o shell (`#app`); S4 cria o DOM dentro de `src/ui/**` e não edita o HTML. O boot do Bridge é entregue por S0 em `src/boot/**`; S0 também entrega um stub de `PlatformService` para o boot, e S6 assume `src/platform/**`, `src/boot/**` e o config final a partir do M5. S3 pode ser dividido em três tarefas (uma fase cada) mantendo o mesmo modelo e esforço. Da mesma forma, S0 pode ser fatiado em scaffold/CI e shell/boot, S1 em simulação/colisão e input/debug, e S5 em arte/partículas e áudio; o modelo e o esforço continuam os mesmos.

### 6.4 Contrato de tarefa (prompt padrão)

Todo subagente recebe um prompt neste formato:

```text
Você é o subagente <ID>, rodando com DeepSeek V4.1 Flash, esforço low.

Repositório: https://github.com/Rigato/blockbreaker
Leia primeiro: docs/GDD_Block_Breaker_Roguelite.md,
docs/spec-tecnica-publicacao.md, docs/plano-implementacao-mvp.md.
Milestone: <Mx> — <nome>
Branch/worktree: <branch> em /tmp/opencode/<slug>

Objetivo (uma frase):
<resultado observável>

Escopo permitido:
- <arquivos/pastas>

Fora de escopo:
- <lista>

Contrato congelado:
- Tipos/interfaces que você pode importar, mas não alterar: <...>
- Eventos: <...>
- Comandos: npm run typecheck, npm test, npm run build

Critérios de aceite:
- <comando> passa
- <teste manual> passa
- <métrica> atende

Entrega:
- Commits pequenos na branch.
- Handoff no PR com: o que mudou, como testar, testes executados,
  riscos, arquivos tocados e screenshots/vídeo se for visual.

Regras:
- Não faça merge nem push na main.
- Não altere arquivos fora do ownership.
- Não adicione dependência sem aprovação.
- Não invente regra de jogo; consulte o GDD ou pergunte.
- Se não convergir em 2 tentativas, pare e reporte o bloqueio.
```

### 6.5 Handoff obrigatório

Cada entrega deve incluir:

```markdown
## Entrega
- Branch / commits:
- Objetivo:
- O que mudou:
- Como testar:
- Testes executados:
- Métricas (se aplicável):
- Riscos / pendências:
- Arquivos tocados:
```

O agente principal só abre o gate quando o handoff estiver completo e o CI verde.

### 6.6 Paralelismo por milestone

| Milestone | Subagentes em paralelo | Observação |
|---|---|---|
| M0 | S0 | Fundação sozinha; contratos congelados ao final |
| M1 | S1 + S4 (shell de HUD) | S4 começa só com contratos de estado prontos |
| M2 | S2 + S4 (level up) | S1 entra apenas para hooks de física |
| M3 | S3 + S2 (save/flow) + S4 (phase select/results) | Máximo de 3; ownership separado |
| M4 | S5 + S4 | S1 apoia performance/colisão se necessário |
| M5 | S6 | Plataforma sozinha; S4 ajusta pause/ad UI |
| M6 | S7 + donos de correções | Correções sequenciais por prioridade |
| M7 | S8 + S6 | S6 cuida do ZIP/tag; S8 dos assets |

### 6.7 O que não delegar

- Decisão de game design e balanceamento final.
- Aprovação de gate e publicação.
- Merge na `main` e resolução de conflito entre subagentes.
- Revisão crítica de segurança, licenças e direitos autorais.
- Arte final de capa e identidade visual; subagente pode preparar rascunho, mas o refino é humano.

---

## 7. Milestones e gates

### Visão geral dos gates

| Gate | Milestone | O que você testa | Decisão |
|---|---|---|---|
| **G0** | M0 — Fundação | Pages, canvas portrait, boot do Bridge, fallback com CDN bloqueado | Aprovar stack e fundação |
| **G1** | M1 — Núcleo jogável | Rebater, mirar, quebrar, perder, limpar onda | O core é promissor? |
| **G2** | M2 — XP e perks | Level up, 3 escolhas, efeitos visíveis, 3 runs | A progressão é divertida? |
| **G3** | M3 — Fases e save | Run completa, desbloqueio, reload, derrota/retry | Run e dificuldade estão certas? |
| **G4** | M4 — Apresentação | Devices reais, leitura visual, áudio, responsividade | A apresentação basta para o MVP? |
| **G5** | M5 — Distribuição | ZIP, mock, adblock, checklist, ads | O build está pronto para portal? |
| **G6** | M6 — QA e balance | Matriz de QA, 10 runs, playtest, performance | Go/no-go para publicar? |
| **G7** | M7 — Publicação | ZIP final, capas, vídeo, descrição, submissão | Publicar agora ou segurar? |

**Regra:** o gate é uma conversa, não um checklist automático. Se você reprovar, o milestone continua aberto e o próximo não começa.

---

### M0 — Fundação, contratos e pipeline

**Objetivo:** ter um esqueleto que roda no navegador, faz deploy no Pages e prova o boot do Bridge com e sem CDN.

**Entregáveis:**
- Repositório clonado/inicializado, `main` com primeiro commit, `README.md`, `.gitignore` e docs.
- Vite + TypeScript estrito + Phaser 3.90 + Vitest; scripts de typecheck/test/build; pelo menos um teste de fumaça para o CI não ficar vazio.
- Estrutura de pastas do §4.3 e contratos compartilhados (`contracts.ts`, `events.ts`, `config.ts`).
- Shell mínimo: canvas portrait, moldura no desktop, safe area, sem scrollbar (a UI final entra no M4).
- Boot do Bridge com timeout de 10 s, fallback local/in-memory e `game_ready` após menu placeholder.
- `playgama-bridge-config.json` inicial.
- CI e deploy no GitHub Pages; `?debug=1` com FPS e plataforma detectada.
- Teste manual: bloquear CDN do Bridge e confirmar que o jogo ainda entra.

**Subagente:** S0 `foundation`.

**Critérios de aceite:**
- `npm ci`, `npm run typecheck`, `npm test`, `npm run build` verdes.
- Pages responde 200 em desktop e mobile; console sem erro/404.
- Canvas preenche portrait em 320×568, 390×844, 430×932 e desktop; sem scrollbar/corte.
- Bridge mock inicializa; com `bridge.playgama.com` e `sdk.crazygames.com` bloqueados, o jogo entra em ≤ 10 s.
- Nenhuma request para `api.playgama.com`; nenhum logo do Bridge na tela.
- `?debug=1` mostra FPS, plataforma, tamanho do canvas e botão de reset de save.

**Ponto de revisão G0:**
1. Abra a URL do Pages no desktop e no celular.
2. Confirme o layout portrait, safe area e ausência de scroll.
3. Abra o DevTools → Network: só assets locais e, no máximo, o Bridge.
4. Bloqueie `bridge.playgama.com` e `sdk.crazygames.com`, recarregue e confirme o boot.
5. Abra `?debug=1`; confirme `platform.id === 'mock'` e storage em memória.
6. Decida: Phaser 3.90, estrutura de pastas, moldura visual e se o pipeline está aprovado.

**Gate G0:** build e deploy estáveis; você aprova stack e fundação. **Não avançar para M1 sem aprovação.**

**Estimativa:** 0,5–1 dia.

---

### M1 — Núcleo jogável (o gate mais importante)

**Objetivo:** provar a sensação de rebater, mirar, quebrar e perder antes de investir em perks e conteúdo.

**Entregáveis:**
- Simulação fixa de 120 Hz com paddle, bolinha, paredes, blocos e projéteis.
- Colisão varrida circle vs AABB, sem tunneling; rebote angular no rebatedor.
- Lançamento inicial, múltiplas bolas (até 8), perda de bola, derrota, limpeza de onda.
- Input touch (arrasto relativo), mouse (absoluto) e teclado (setas/A-D, espaço, P).
- HUD mínimo: onda, bolinhas, pausa, dica de controle.
- Painel `?debug=1` para velocidade, largura/velocidade do rebatedor, raio, ângulo máximo, passo e wave de teste.
- Testes unitários de colisão e anti-stall.

**Subagentes:** S1 `physics-core`; S4 `ui-ux` apenas para o shell de HUD.

**Critérios de aceite:**
- Uma onda completa jogável em iPhone, Android e desktop.
- Nenhum tunneling com a bolinha a 1,5× a velocidade máxima; testes cobrem quina, bloco fino e duas bolas.
- Paddle responde sem atraso perceptível; lançamento e pausa funcionam.
- Perder todas as bolas mostra derrota; limpar a onda mostra transição.
- 60 fps no render; console sem erro.
- Debug permite reproduzir uma onda e ajustar o feel sem rebuild.

**Ponto de revisão G1:**
1. Jogue a onda de teste no celular e no desktop.
2. Teste arrasto curto, arrasto longo e mudança de direção; veja se o paddle “gruda” no dedo.
3. Teste o rebote nas bordas do paddle; veja se dá para mirar corredores.
4. Aumente a velocidade no debug até 1,5× e confirme que não atravessa blocos.
5. Teste perder todas as bolas, limpar a onda, pausar, trocar de aba e girar.
6. Anote 3–5 valores que precisam mudar (velocidade, largura, ângulo, raio, altura do campo).

**Gate G1:** você considera o core **promissor** e os controles utilizáveis. Se o feel falhar, **não adicionar perks para compensar**; iterar física/input dentro do M1.

**Estimativa:** 2–3 dias.

---

### M2 — XP, level up e perks

**Objetivo:** provar que a escolha de perk muda a run e cria vontade de escolher outra combinação.

**Entregáveis:**
- XP por bloco, curva, overflow, fila de level ups.
- Pausa automática, overlay com 3 cards, escolha por toque/1-2-3.
- Catálogo de 10 perks do §2.2, com níveis, pesos e elegibilidade.
- Efeitos: multiball, paddle largo, dano, XP, turret, sticky, safety net, laser manual, bola grande, explosive core.
- HUD de perks adquiridos e botão contextual do laser.
- Testes de ofertas (sem duplicata, sem maxado, determinístico), stacking e overflow.

**Subagentes:** S2 `progression`; S4 `ui-ux` para o overlay; S1 para hooks de física.

**Critérios de aceite:**
- 3 runs em um conjunto provisório de 3 ondas de teste (o conteúdo final entra no M3); 4+ level ups por run; cada run termina com combinações diferentes.
- Nenhuma oferta repete perk ou oferece perk no máximo.
- Cada perk tem efeito observável; sticky solta por toque e por timeout.
- Laser só aparece quando adquirido; cooldown e tecla E funcionam.
- Safety net salva a última bolinha; carga recarrega na onda seguinte.
- Nenhum softlock ao subir 2 níveis no mesmo frame.

**Ponto de revisão G2:**
1. Jogue 3 runs escolhendo perks diferentes.
2. Verifique se os 3 cards são legíveis, distintos e cabem em 320 px.
3. Force cada perk pelo debug e confirme o efeito.
4. Teste sticky (toque e timeout), safety net, multiball e laser.
5. Teste subir 2 níveis no mesmo frame e escolher em sequência.
6. Decida: catálogo, pesos, curva de XP, método de soltura do sticky e se a progressão é divertida.

**Gate G2:** as escolhas parecem importar e a progressão dá vontade de repetir. Se não, iterar M2 antes de conteúdo.

**Estimativa:** 2–3 dias.

---

### M3 — Fases, ondas, progressão e persistência

**Objetivo:** fechar o ciclo completo de uma run e a progressão sequencial entre fases.

**Entregáveis:**
- 3 fases × 3 ondas com layouts ASCII, HP 1–3 e curva de dificuldade.
- Phase select, desbloqueio sequencial, results, retry, next phase e menu.
- Score, tempo, stats por fase e melhor resultado.
- Save `bb.save` via `PlatformService` (mock/dev no M3; integração final do Bridge no M5), defaults, parse seguro e reset de debug.
- Testes de conteúdo, save e fluxo de run.

**Subagentes:** S3 `content`; S2 `progression` (fluxo/save); S4 `ui-ux` (phase select/results).

**Critérios de aceite:**
- Fase 1 completável em 2–5 min; 3–5 level ups.
- Limpar fase 1 desbloqueia fase 2; fase 2 desbloqueia fase 3.
- Reload preserva unlocks, melhores tempos/scores e som.
- Derrota permite retry; não salva run ativa.
- Save corrompido/ausente cai em defaults sem crash.
- `npm run validate:content` passa; todas as fases são clearable.

**Ponto de revisão G3:**
1. Comece com save limpo; jogue a fase 1 inteira.
2. Confirme o desbloqueio da fase 2 e o resultado.
3. Recarregue a página; confirme persistência.
4. Jogue a fase 2, perca de propósito, retry; confirme stats e ausência de run salva.
5. Jogue a fase 3; confirme dificuldade e duração.
6. Decida: 3 fases ou 2; ondas por fase; curva; escopo do save.

**Gate G3:** a run completa funciona e o ritmo está aceitável. Se o conteúdo estiver fraco, iterar M3; se o tempo estourar, aplicar a válvula de escopo para 2 fases.

**Estimativa:** 2–3 dias.

---

### M4 — Apresentação, feedback e mobile polish

**Objetivo:** transformar o protótipo jogável em um MVP apresentável, legível e estável em devices reais.

**Entregáveis:**
- Pixel art provisória de fantasia: fundo, blocos (3 HP), paddle, bola, partículas, UI skin.
- Feedback: flash de impacto, rachaduras, quebra, shake leve, trail, level up, onda limpa.
- SFX e loop opcional; mute/pause; iOS unlock.
- Responsividade: 320 px, safe areas, notch, rotação, landscape overlay.
- Performance: pooling, atlas, DPR, orçamento de partículas.
- Fonte pixel bundlada (OFL) ou fallback de sistema; sem fonte externa.

**Subagentes:** S5 `presentation`; S4 `ui-ux`; S1 apoio de performance.

**Critérios de aceite:**
- HP de bloco legível sem cor (teste em grayscale).
- Nenhum elemento cortado/sobreposto em 320×568, 390×844, 430×932 e desktop.
- Áudio muta em background/ad e volta após gesto; sem som no background.
- Rotação preserva estado; landscape mobile pausa com overlay.
- 60 fps em Android médio/iPhone; sem crescimento de memória em 10 min.
- Assets totais << 20 MB; sem `.wav`; sem recurso externo.

**Ponto de revisão G4:**
1. Teste em iPhone Safari e Android Chrome reais.
2. Olhe safe areas, notch, botões e texto.
3. Tire screenshot em grayscale e confirme leitura dos blocos.
4. Teste som, background, troca de aba, rotação e retorno.
5. Teste em notebook/Chromebook 4 GB; veja FPS e memória.
6. Decida: arte/áudio placeholder bastam para o MVP? Investir mais ou seguir?

**Gate G4:** a apresentação é suficiente para validar o jogo com jogadores reais. Se não, iterar M4; cortar música/partículas se necessário.

**Estimativa:** 2 dias.

---

### M5 — Bridge, build e prontidão de distribuição

**Objetivo:** provar que o mesmo build funciona nos quatro cenários de plataforma, incluindo os modos degradados.

**Entregáveis:**
- `PlatformService` final: Bridge + fallback, storage, ads, lifecycle, pause/audio.
- Config final validada; `game_ready` e mensagens de nível.
- Interstitial na transição de saída dos results (Next/Retry); tratamento de `failed`/timeout; sem rewarded UI.
- `scripts/package.mjs` + ZIP; CI artifact; release workflow.
- Checklist do §5.5 preenchido; testes mock/adblock/network.
- README de build e publicação.

**Subagente:** S6 `platform`; S4 ajusta UI de pause/ad.

**Critérios de aceite:**
- ZIP com `index.html` na raiz, config ao lado, caminhos relativos, ≤ 250 MB/1.000 arquivos e paths ≤ 240 caracteres.
- Servido em subpasta, abre sem 404; console limpo.
- Modo mock: save persiste, sem ads, sem logo do Bridge.
- CDN do Bridge bloqueado: boot em ≤ 10 s, jogo jogável, save em memória.
- `game_ready` uma vez; `level_*` nos momentos certos; sem analytics externo.
- Interstitial falha sem travar; jogo continua.
- Nenhum `localStorage` direto; nenhum `if (platform === ...)`.

**Ponto de revisão G5:**
1. Baixe o ZIP do artifact; sirva em `http://localhost:8080/subpasta/`.
2. Rode o checklist do §5.5 item por item.
3. Teste modo mock, adblock e rede lenta.
4. Abra o Bridge DevTools; confirme `game_ready` e mensagens.
5. Confira Network: nenhuma request para `api.playgama.com`.
6. Decida: build pronto para portal? Corrigir ou seguir.

**Gate G5:** checklist passa e você aprova o build. **Não submeter a portal ainda**; a submissão é o M7.

**Estimativa:** 1,5–2 dias.

---

### M6 — QA, performance e balanceamento

**Objetivo:** reduzir risco técnico e validar as métricas de diversão antes de investir em publicação.

**Entregáveis:**
- Smoke E2E Playwright do build; testes de save, rotação e fluxo.
- Matriz de devices/navegadores do §8.3.
- 10 runs instrumentadas: duração, level ups, perks, mortes, retries.
- Playtest com 5 pessoas; relatório de funil e comentários.
- Correções de bugs P0/P1; tuning de XP, HP, velocidade, paddle e ondas.
- Relatório de performance e tamanho.

**Subagentes:** S7 `qa-balance`; S1/S2/S3/S4 para correções conforme ownership.

**Critérios de aceite:**
- Nenhum P0/P1 aberto.
- 60 fps nos dispositivos-alvo; sem crash em 10 min de sessão.
- Métricas dentro do §1.2 ou desvio justificado.
- Checklist de distribuição revalidado.
- Relatório final com recomendação go/no-go.

**Ponto de revisão G6:**
1. Jogue 3 runs em device real, sem instrução.
2. Observe se entende o controle, se escolhe perks com critério e se quer repetir.
3. Rode a matriz de QA e veja os relatórios.
4. Compare métricas com §1.2; veja variedade de perks e duração.
5. Decida: **go** para publicação, **iterate** (qual dimensão) ou **stop**.

**Gate G6:** decisão go/no-go. Se for iterate, o plano define qual milestone reabrir; se for stop, o MVP fica congelado como protótipo.

**Estimativa:** 2–3 dias.

---

### M7 — Release e pacote de publicação

**Objetivo:** transformar o build aprovado em um pacote publicável e iniciar a sequência de portais.

**Entregáveis:**
- Tag `v0.1.0-mvp`; GitHub Release com ZIP.
- ZIP final validado; Pages atualizado.
- 3 capas, screenshots, preview video, descrição ≥ 100 palavras, instruções de controle.
- Checklist de submissão preenchido; sequência itch.io → GameFlare → Playgama → CrazyGames Basic.
- Registro de status/URLs e próximos passos pós-launch.

**Subagentes:** S8 `release`; S6 `platform` para ZIP/tag.

**Critérios de aceite:**
- Assets nos tamanhos e regras do §5.7; texto só o título; sem logos.
- ZIP baixa, abre e joga em navegador limpo.
- Metadata em inglês; nome consistente.
- Você aprova cada texto/asset antes de submeter.
- CrazyGames entra como **Basic Launch**, não Full.

**Ponto de revisão G7:**
1. Revise capas, vídeo, descrição e controles.
2. Baixe o ZIP e rode em uma aba anônima.
3. Confirme a sequência de submissão e quem submete.
4. Decida: publicar agora ou segurar para ajuste.

**Gate G7:** publicação aprovada. Depois do Basic Launch, acompanhar 7 dias/500 plays antes de considerar Full Launch.

**Estimativa:** 1 dia + review.

**Estimativa total:** 13–19 dias de trabalho de implementação, sem contar o tempo dos seus gates e revisões. Com 2–3 subagentes em paralelo nos trechos indicados, o calendário pode ser menor; o gargalo real são os gates G1, G2 e G6, que dependem de teste humano.

---

## 8. Plano de testes

### 8.1 Automatizados

| Área | Testes |
|---|---|
| Colisão | Círculo vs AABB, alta velocidade, quina, bloco fino, duas bolas, paddle, rebote angular, sem tunneling |
| Simulação | Determinismo com seed, passo fixo, pausa/retomada, limite de bolas, anti-stall |
| Progressão | Curva de XP, overflow, fila de níveis, stacking, modificadores |
| Ofertas | 3 distintas, sem maxado, elegibilidade, determinismo, fallback |
| Save | Defaults, parse inválido, versão futura, arrays de mesmo tamanho, reset |
| Conteúdo | Grid válido, ids únicos, 3 ondas/fase, curva de HP, clearability |
| E2E | Build servido, menu, play, input, level up, results, reload, sem console error |

Comandos: `npm run typecheck`, `npm test`, `npm run validate:content`, `npm run build`, `npm run package`.

### 8.2 Manual por milestone

- **M1:** feel, controle, colisão, perda, clear.
- **M2:** escolhas, efeitos, sticky, laser, safety net, fila.
- **M3:** run completa, unlock, reload, retry, stats.
- **M4:** devices, safe area, rotação, áudio, leitura visual.
- **M5:** mock, adblock, ZIP, network, lifecycle.
- **M6:** matriz completa + playtest.

### 8.3 Matriz de devices/navegadores

| Dispositivo | Navegador | O que testar |
|---|---|---|
| iPhone recente | Safari | Safe area, áudio, DPR, rotação, background |
| iPhone antigo/baixa memória | Safari | Memória, FPS, carregamento |
| Android médio | Chrome | Touch, FPS, rotação |
| Android low-end | Chrome | FPS, DPR=1, memória |
| Desktop | Chrome/Edge | Mouse/teclado, resize, 144 Hz |
| Chromebook 4 GB | Chrome | FPS, memória, carregamento |
| Desktop | Firefox/Safari | Compatibilidade básica |
| Build em subpasta | Chrome | Paths relativos, save, mock |

### 8.4 Cenários de falha

- Bridge CDN bloqueado; SDK do CrazyGames bloqueado; ambos bloqueados.
- `initialize()` pendurado; storage pendurado; ad `failed`/timeout.
- Save corrompido, save de versão futura, primeiro boot sem save.
- Aba em background, minimizar, trocar orientação, voltar.
- Rede lenta/cold cache; arquivo 404 simulado; WebGL indisponível.
- Long press, toque saindo da tela, pointercancel, dois dedos.
- 10 min de sessão; 8 bolas + partículas + explosões.

### 8.5 Playtest e métricas

Protocolo: 5 pessoas, 3 runs cada, 20–30 min, sem explicar controles além do hint na tela. Registrar:

- tempo até o primeiro lançamento;
- duração da run, ondas limpas, level ups;
- perks oferecidos/escolhidos;
- mortes, retries, intenção de jogar de novo;
- comentários sobre controle, mira, clareza e sensação de poder.

Metas do §1.2. Se falhar em “diversão” ou “ritmo”, reabrir M1/M2, não M4.

---

## 9. Riscos e mitigações

| Risco | Impacto | Mitigação |
|---|---|---|
| Core não é divertido | Alto | Gate G1 antes de perks/conteúdo; tuning no debug; iterar física/input |
| Tunneling/colisão instável | Alto | Passo fixo 120 Hz + swept collision + testes de alta velocidade |
| Perks quebram a run/softlock | Alto | Modificadores derivados; máximos; validação de ofertas; debug force; testes |
| Escopo crescer | Alto | Congelar §2; válvula de escopo; backlog explícito |
| Bridge trava no boot | Alto | Timeout 10 s; fallback local; adapter in-memory; teste com adblock |
| Ad bloqueia o jogo | Alto | `failed` = sem ad; timeout; nunca await infinito; testar Basic Launch |
| Rejeição de portal | Alto | Checklist desde M0; inglês; storage; config; sem requests externos |
| Performance em mobile | Médio | Pooling, atlas, DPR, orçamento de partículas, teste em 4 GB |
| Save perdido/corrompido | Médio | JSON versionado, defaults, parse seguro, teste mock |
| Áudio no iOS/background | Médio | Unlock por gesto; eventos de pause/audio; teste Safari |
| Rotação/safe area | Médio | Layout dinâmico, overlay, matriz de devices |
| Subagente low effort divergir | Médio | Tarefa estreita, contrato, ownership, 2 tentativas, handoff |
| Arte de portal rejeitada | Médio | Placeholder no MVP; refino humano; sem material de terceiros |
| Portrait limita parceiros da Playgama | Médio | Fora do MVP; decidir modo landscape/localização só depois do G6 |
| Phaser 3/4 ou API drift | Baixo | Pin 3.90; lockfile; sem upgrade no MVP |
| Paths quebram no portal | Baixo | `base: './'`; teste em subpasta; checklist |
| Tempo de conteúdo estourar | Médio | 2 fases fallback; fase 3 backlog |

---

## 10. Definition of Done do MVP

| Item do GDD | Verificação |
|---|---|
| Build HTML5 portrait em desktop e mobile | Pages + devices; touch, mouse e teclado |
| Loop de block breaker completo | M1: rebater, colidir, quebrar, cair, vencer, perder |
| Fase/run curta com ondas finitas | 3 fases × 3 ondas; run 2–5 min; sem chefe |
| Próxima onda só após limpar blocos | Transição testada em M1/M3 |
| XP por bloco e level up | Curva, pausa, 3 opções, escolha, retomada |
| Perks de tipos diferentes | 10 perks; atributos, bolinha, rebatedor, defesa e ataque |
| Ataque automático e manual | Turret automático; laser manual contextual |
| Feedback e UI essenciais | Onda, XP/nível, perks, bolinhas, pausa, vitória/derrota |
| Fantasia provisória legível | Pixel art placeholder; HP por cor + estado |
| Persistência entre fases | Unlock, stats, settings; sem run ativa |
| Bridge integrado | `game_ready`, storage, pause/audio, ads, config |
| Build único para 4 portais | ZIP, paths relativos, sem recurso externo, mock testado |
| Inglês padrão/fallback | UI 100% en; `platform.language` lido |
| Sem crashes nos cenários críticos | Rotação, background, adblock, ad, long press, retorno |
| Performance | 60 fps nos devices-alvo; sem P0/P1 |
| Critérios de diversão | §1.2 atingidos ou desvio aprovado no G6 |
| Pacote de publicação | M7: capas, vídeo, descrição, checklist |

---

## 11. Decisões que você toma nos gates

| Gate | Decisões |
|---|---|
| G0 | Phaser 3.90 vs 4.x; estrutura de pastas; moldura visual; pipeline Pages |
| G1 | Controle touch (relativo vs absoluto); velocidade/ângulo/raio; tamanho do paddle; core promissor? |
| G2 | Catálogo/pesos; curva de XP; sticky (toque + timeout); laser/turret; progressão divertida? |
| G3 | 3 vs 2 fases; 3 ondas; dificuldade; escopo do save; duração |
| G4 | Nível de arte/áudio; placeholder basta?; cortar música/partículas? |
| G5 | Build pronto para portal?; escopo de ads; corrigir o quê? |
| G6 | Go/no-go; se iterate, qual milestone; se stop, congelar |
| G7 | Publicar agora?; assets; sequência de submissão |

---

## 12. Próximo passo

1. **Aprovar este plano** ou pedir ajustes de escopo, fases, perks, stack ou divisão de subagentes.
2. Com aprovação, iniciar **M0 — Fundação** com o subagente `foundation` (DeepSeek V4.1 Flash, esforço `low`).
3. O M0 termina no gate **G0**, com URL do Pages e build testável. Nenhum código de M1 começa antes do seu OK.

**Este documento não autoriza o início da implementação.** A implementação começa somente após sua aprovação explícita.
