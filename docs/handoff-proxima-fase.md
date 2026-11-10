# Handoff — Bricklike pós-MVP

> **Documento histórico.** Este handoff cobre o pós-MVP e as primeiras
> atualizações de 0.2.0/0.3.0. Para onboarding atual, use
> [`handoff-v0.3.0.md`](handoff-v0.3.0.md). Mantido apenas como registro.

**Documento de transferência para planejar a próxima fase de desenvolvimento**  
**Data:** 2026-11-09  
**Versão do jogo:** `0.3.0-dev` (build publicado: `0.1.0-mvp`)  
**Repositório:** <https://github.com/Rigato/blockbreaker>  
**Pasta local:** `/mnt/SSD-Secundario/Nextcloud/5-GameProjects/4-Blockbreaker-roguelite`  
**Build de review:** <https://rigato.github.io/blockbreaker/>  
**Debug build:** <https://rigato.github.io/blockbreaker/?debug=1>

> **Atualização v0.3.0 — Endless (2026-11-09):** o jogo ganhou um **modo Endless**
> separado da campanha: uma fase infinita com ondas procedurais, velocidade
> **660→1100**, linhas **4→12**, blocos/elementos graduais e chefes a cada 5
> ondas. Perks e XP seguem a curva do modo Levels; Second Chance vale uma vez por
> run. O save v1 ganhou `endless: { bestWave, bestScore, runs }` (saves antigos
> caem em zeros) e os results mostram Wave/Best wave/score/level/perks, sem Next.
> A campanha e o build `0.1.0-mvp` do itch.io permanecem intactos.
>
> **Atualização v0.2.0 (2026-11-08):** a campanha passou de 3 fases × 3 ondas
> para **6 fases e 21 ondas** (3/3/3/3/4/5), com **9 blocos**, **7 elementos**,
> **3 chefes**, **19 perks**, regras de onda (`timeLimit`, `noLaser`), zoom de
> layout (0,68–1,0), encerramentos/rank e `MAX_PHASE = 6`. O save continua v1 e
> aceita saves antigos. O build **`0.1.0-mvp` publicado no itch.io permanece
> congelado**; a v0.2.0 é desenvolvimento e ainda não foi enviada aos portais.
>
> **Estado dos gates:** G6 aprovado pelo owner em 2026-11-08. A v0.3.0 tem
> typecheck, 252 testes, build e E2E de Endless/campanha verdes; `validate:content`
> continua verde. O G7 original (pacote `0.1.0-mvp`) continua **pendente** para os
> portais que ainda não receberam o build; não há tag, GitHub Release nem
> submissão nova. A E5 (docs/release) da v0.3.0 foi concluída localmente; falta
> apenas a publicação manual.

---

## 0. TL;DR

O Bricklike é um block breaker HTML5 portrait com progressão roguelite. A versão
atual de desenvolvimento tem **6 fases, 21 ondas, 9 tipos de bloco, 7 elementos
de fase, 3 chefes e 19 perks**, mais o **modo Endless** (fase infinita), save
entre sessões, encerramentos por fase e integração com a Playgama Bridge. O
conteúdo da campanha é validado (759 blocos, 1.831 XP) e a automação cobre
simulação, progressão, conteúdo, save, layout, Endless e E2E.

O que existe hoje:

- build único para itch.io, GameFlare, Playgama e CrazyGames Basic;
- campanha de 6 fases com ondas 3/3/3/3/4/5;
- modo **Endless**: run infinita, velocidade 660→1100 e chefes a cada 5 ondas;
- 9 blocos (3 básicos + 6 especiais), 7 elementos e 3 chefes;
- 19 perks, Second Chance e sinergias de build;
- desafios de onda, zoom de layout e endings com rank S/A/B;
- 252 testes unitários e E2E de Endless/campanha;
- save v1 com `unlockedPhase` 1..6, `endless` e compatibilidade com saves antigos;
- pacote de loja `0.1.0-mvp` com capas, screenshots, vídeo e metadata;
- G6 aprovado; G7 original pendente; v0.2.0/v0.3.0 não publicadas.

O que a próxima fase precisa decidir:

1. **Publicar a v0.3.0 e coletar dados reais** depois do QA final, ou
2. investir em metaprogressão/plataforma antes de novo lançamento.

A recomendação é concluir o QA da v0.3.0, atualizar o pacote de loja e então
escolher a próxima frente com base em retenção, playtime, reviews e feedback dos
jogadores. O histórico M0–M7 abaixo descreve o **MVP original** e continua válido
como referência; números de 3 fases/9 ondas/11 perks pertencem a esse recorte.

---

## 1. Snapshot do estado atual

| Item | Valor |
|---|---|
| Branch de desenvolvimento | `main` |
| Branch publicada | `main` / build `0.1.0-mvp` no itch.io |
| Commit de referência (MVP) | `3e663c1` (`docs(qa): record G6 approval`) |
| Versão em desenvolvimento | `0.3.0-dev` |
| Versão publicada | `0.1.0-mvp` |
| Campanha | 6 fases; ondas 3/3/3/3/4/5 = 21; 759 blocos; 1.831 XP |
| Endless | fase infinita; velocidade 660→1100; linhas 4→12; chefe a cada 5 ondas |
| Conteúdo | 9 blocos, 7 elementos, 3 chefes, 19 perks |
| Gate atual | G6 aprovado; G7 original pendente; E5 da v0.3.0 concluída localmente |
| Tag | `v0.1.0-mvp` planejada, **não criada**; `v0.2.0`/`v0.3.0` não criadas |
| GitHub Release | **não criada** |
| Portais | itch.io com `0.1.0-mvp`; demais **sem submissão** |
| CI | checks + E2E + deploy verdes |
| Live Pages | <https://rigato.github.io/blockbreaker/> |
| ZIP congelado | `release/blockbreaker-web.zip` (`0.1.0-mvp`) |
| SHA-256 do ZIP 0.1.0 | `e35893177fb7df1a34397a65e913927017816f4265043419551b19d6ff5dbd23` |
| Tamanho do ZIP 0.1.0 | 502.321 bytes / 490,5 KiB |
| Arquivos no ZIP 0.1.0 | 13 |
| Maior path | 38 caracteres |
| Node | 22.12+ (CI usa Node 24) |
| Dependências principais | Phaser 3.90.0, Bridge 2.4.1, TypeScript 7.0.2, Vite 8.3.6, Vitest 5.1.0, Playwright 1.65.0 |

### O que “pronto” significa aqui

- **M0–M6 concluídos** e aprovados nos gates correspondentes.
- **M7 concluído como pacote** do MVP: assets, metadata, checklist e validação.
- **G7 é o gate de publicação**: revisão humana dos assets e decisão de publicar.
- **M8–M12 da v0.2.0 concluídos** com os gates técnicos verdes; a publicação
  da v0.2.0 ainda depende de decisão humana.
- **Endless da v0.3.0 implementado** (E1–E5 concluídos localmente); a publicação
  ainda depende de decisão humana.
- A tag e o GitHub Release do MVP só devem ser criados **depois do G7**.
- O upload nos portais é feito manualmente pelo owner.
- O ZIP `0.1.0-mvp` do itch.io permanece congelado e não é substituído pela
  branch de desenvolvimento.

---

## 2. Visão do produto em uma página

**High concept:** block breaker arcade clássico, em portrait, com progressão
roguelite. O jogador rebate a bola, destrói blocos, ganha XP, escolhe um entre
três perks e sente a build mudar durante uma run curta.

**Loop principal:**

`rebater → mirar → quebrar blocos → ganhar XP → escolher perk → sentir a build mudar → limpar a fase`

**Pilares:**

- sensação e controles de block breaker clássico;
- evolução perceptível ao longo das ondas e dos levels;
- alta rejogabilidade por combinações de perks;
- habilidade manual no início e sensação crescente de poder;
- sessões curtas e fáceis de reiniciar;
- fantasia acessível com cristais, ruínas e magia.

**Público/forma:** single player, HTML5, portrait, inglês, gratuito. O MVP foi
desenhado para desktop e mobile, com toque, mouse e teclado.

**O que o MVP deliberadamente não é:** campanha longa, vários mundos, chefes,
metaprogressão profunda, rankings, conquistas, multiplayer, backend, editor de
fases, landscape jogável ou localização.

---

## 3. O que foi entregue, milestone por milestone

### M0 — Fundação

- Scaffold Vite + TypeScript estrito + Phaser 3.90.
- Contratos compartilhados, configuração de tuning, shell HTML, boot do Bridge,
  CI e GitHub Pages.
- Base para build único e deploy contínuo.

### M1 — Núcleo jogável

- Simulação determinística em passo fixo de **120 Hz**.
- Colisão círculo vs AABB com swept collision e testes de alta velocidade.
- Paddle, bola, blocos, perda de bola, vitória/derrota, ondas e input touch/mouse.
- Debug panel para tuning ao vivo.
- Física e feel validados no G1.

### M2 — XP, level up e perks

- XP por bloco (`XP = HP máximo do bloco`), curva com overflow e fila de níveis.
- Pausa automática no level up, três cards, escolha por toque/click/1-2-3.
- Catálogo de perks e modificadores derivados aplicados em tempo real.
- HUD de XP, perks adquiridos, score e level.
- Perks iniciais: atributos, bola, paddle, defesa e ataques automáticos/manuais.

### M3 — Levels, progressão e persistência

- **3 levels × 3 waves** com layouts ASCII autorais.
- **Crystal Grove**, **Ruined Halls** e **Arcane Depths**.
- Três tipos de bloco: crystal (1 HP), stone (2 HP), obsidian (3 HP).
- Level Select com locks, best score/time, attempts e clears.
- Save versionado `bb.save` e settings `bb.settings` via platform storage.
- Sem salvar run ativa; sair perde a run.
- Validador de conteúdo no CI.

### M4 — Apresentação, feedback e mobile polish

- Arte procedural em pixel art, sem assets externos.
- Temas por level com backdrops, silhuetas, parallax e frames.
- Blocos com facetas, cracks e HP pips; leitura validada em grayscale.
- Partículas com budget de **120 partículas** e **48 trails**.
- SFX sintetizados em WebAudio; sem samples licenciados.
- Pause completo, rotação com overlay “Rotate to portrait”, safe area, reduced
  motion e layout de 320 px ao desktop.
- Fonte Silkscreen OFL empacotada.

### M4.1 — Tuning de feel

- Level up pausa imediatamente, com flash/pulso da barra de XP.
- Prism Laser repetível até nível 3: nível L causa L de dano aos primeiros L+2
  blocos.
- Paddle max speed **2808**.
- Velocidades de bola: **572/616/660**, **616/660/704**, **638/682/726**.
- Curva de XP reduzida em 35%, primeiro nível em **8 XP**; depois 20/26/33/39…
- Multiball extra respawna após **10 s** (pausa-aware, um por vez).
- Novo perk **Foresight** com predição curta da trajetória.

### M5 — Bridge, build e distribuição

- `PlatformService` única: Bridge nativo + fallback local.
- Boot com timeout de 10 s; storage com timeout de 3 s e fallback em memória.
- `game_ready` enviado uma vez após o menu interativo.
- Eventos de lifecycle: `level_started`, `level_paused`, `level_resumed`,
  `level_completed`, `level_failed`.
- Interstitial somente na saída dos results (Next/Retry), com mute, overlay
  bloqueante e continuidade em `closed`/`failed`/timeout de 15 s.
- Sem analytics externo, sem banners, sem rewarded ads.
- `playgama-bridge-config.json` validado contra o schema do Bridge 2.4.1.
- `npm run package` gera ZIP com raiz correta, paths relativos e limites de
  portal; CI publica artifacts; workflow de tag cria GitHub Release.
- Validado em subpasta, mock, CDN bloqueado e anúncio com falha.

### M5.1 / M5.2 — Review polish

- Terminologia **Levels** em toda a UI.
- Primeiro perk mais rápido (8 XP).
- **V** lança; **Space/E** disparam o Prism Laser; **P** pausa.
- Foco retorna ao canvas depois de Play, Level Select, pause e perk.
- SFX metálico distinto para bloco com HP restante.
- Arte de blocos refinada com cantos stepped, materiais e gemas de HP.
- Correção final de input: Space não lança mais; V lança/solta sticky.

### M6 — QA, performance e balanceamento

- Playwright E2E: 16 testes, cobrindo boot, controles, pause, som persistido,
  level up, vitória/unlock/reload, AdMock `show`/`fail`, CDN bloqueado e layout
  320/390/430/1440 + landscape mobile.
- CI rodando E2E em job separado com Chromium.
- Baseline automatizado de **10 runs**: 10/10 Victory, 3 ondas, score 1.600,
  nível 6, **5 level ups/run**, 49,9–60,1 s.
- Matriz de devices, playtest kit, run log e relatório de performance.
- Nenhum P0/P1 na automação.
- **G6 aprovado em 2026-11-08** após playtest humano, devices reais e sessão de
  10 min conduzidos pelo owner. A evidência humana detalhada não está versionada
  no repositório; ver §9.
- Nenhum tuning de balance foi aplicado sem dados humanos.

### M7 — Release e pacote de publicação

- Tag planejada: `v0.1.0-mvp`; **não criada**.
- ZIP final validado; subpasta, mock, CDN bloqueado e save/reload testados.
- Três capas nos tamanhos exigidos, com SVG editável.
- Cinco screenshots reais do build.
- Preview MP4 de 30,6 s, 1280×720, silencioso.
- Metadata em inglês, descrições por portal, controles e tags.
- Checklist de submissão por portal e status log.
- **G7 pendente**; nenhum upload em portal.

### M8–M12 — v0.2.0 (campanha)

- Simulação v2: 9 blocos, 7 elementos, chefes/shards, regras de onda e revive.
- Conteúdo v2: 3 fases novas com 3/4/5 ondas, temas `frost`, `forge` e `void`.
- Chefes: Frost Sentinel (60 HP), Ember Warden (80) e Void Herald (100).
- Progressão: 8 perks novos (total 19), Second Chance e sinergias.
- Apresentação: arte dos blocos/elementos/chefes, HUD de chefe/desafio/combo,
  phase select com 6 cards e results com ending/rank.
- Integração: `Game.ts`, save com `MAX_PHASE = 6`, endings e E2E atualizado.
- Gates técnicos verdes: typecheck, 229 testes, `validate:content`, build,
  package e 16 E2E.
- **Ainda não publicado**: itch.io continua com `0.1.0-mvp` congelado.

---

## 4. Conteúdo e tuning do MVP (histórico)

> Esta seção descreve o recorte `0.1.0-mvp`. O estado atual da campanha está no
> resumo abaixo; os detalhes de 3 fases/9 ondas/11 perks são históricos.

| Item | MVP `0.1.0-mvp` | v0.2.0-dev |
|---|---|---|
| Fases | 3 | 6 |
| Ondas | 9 (3 por fase) | 21 (3/3/3/3/4/5) |
| Blocos | 3 | 9 |
| Elementos | 0 | 7 |
| Chefes | 0 | 3 |
| Perks | 11 | 19 |
| Save | `unlockedPhase` 1..3 | `unlockedPhase` 1..6 |
| Zoom | estático | layout 0,68–1,0 |
| Endings | results simples | epílogo + rank S/A/B |

### 4.1 Levels e ondas

| Level | Nome | Ondas | Velocidades de bola |
|---|---|---|---|
| 1 | Crystal Grove | First Light, Glimmer Path, Crystal Crown | 572 / 616 / 660 |
| 2 | Ruined Halls | Broken Colonnade, Collapsed Vault, Hall of Echoes | 616 / 660 / 704 |
| 3 | Arcane Depths | Whispering Runes, Deep Sanctum, Arcane Heart | 638 / 682 / 726 |

- Total: **9 ondas**, **3 waves por level**.
- A onda só avança após limpar todos os blocos; a próxima começa 1,2 s depois.
- Sem chefe, sem obstáculos móveis, sem blocos especiais.
- Cada level termina em results; vitória desbloqueia o próximo level.

### 4.2 Blocos

| Tipo | HP | Score | Papel |
|---|---:|---:|---|
| Crystal | 1 | 10 | bloco básico, leitura rápida |
| Stone | 2 | 20 | resistência intermediária |
| Obsidian | 3 | 30 | resistência alta, runas |

- XP por bloco = HP máximo.
- A leitura não depende só de cor: facetas, material, pips de HP e cracks.
- `assets/` do jogo é procedural; não há sprites externos.

### 4.3 Perks

| Perk | Tipo | Max | Efeito |
|---|---|---:|---|
| Multiball | repetível | 3 | adiciona uma bola extra imediatamente |
| Wide Paddle | repetível | 3 | +12% de largura por nível |
| Power Ball | repetível | 3 | +1 de dano por nível |
| Quick Study | repetível | 2 | +20% de XP por nível |
| Arcane Turret | repetível | 3 | dispara projétil automático; acelera por nível |
| Giant Ball | repetível | 2 | +15% de raio por nível |
| Sticky Paddle | único | 1 | gruda a bola; solta com tap |
| Safety Net | único | 1 | salva a última bola uma vez por onda |
| Prism Laser | repetível | 3 | laser de coluna; nível L = L dano aos primeiros L+2 blocos |
| Foresight | único | 1 | linha pontilhada curta prevendo a trajetória |
| Explosive Core | único | 1 | a cada 8 blocos destruídos, pequena explosão |

- Há também um perk interno de fallback, **Arcane Insight** (+XP), usado apenas
  quando faltam opções elegíveis; ele não aparece no catálogo normal.
- Ofertas são três cards distintos, sem reroll; a distribuição foi verificada
  como uniforme em 20 mil runs simuladas.
- Não foi aplicado anti-repeat de perk.

### 4.4 XP e progressão

- Curva base: `20 + 10 × (level − 1)`.
- Multiplicador global de **0,65** (−35%) e desconto de primeiro nível.
- Custo efetivo: **8 / 20 / 26 / 33 / 39 / 46…**
- Level up pausa a simulação e mostra três cards.
- Multiball extra respawna após 10 s; máximo de **8 bolas**.
- Sem metaprogressão, moeda, loja, reroll ou upgrade permanente.

### 4.5 Constantes de feel

| Constante | Valor |
|---|---|
| Passo fixo | 120 Hz |
| Paddle max speed | 2808 |
| Paddle base width | 100 |
| Bola base | raio 9, velocidade 520 |
| Bola por onda | +40 de velocidade |
| Bola max speed | 780 |
| Max balls | 8 |
| Multiball respawn | 10 s |
| Laser cooldown | 8 s |
| Laser targets | 3 + 1 por nível |
| Partículas | budget 120 |
| Ball trails | budget 48 |
| XP base | 20 |
| XP step | 10 |
| XP multiplier | 0,65 |

### 4.6 Controles

| Ação | Toque | Desktop |
|---|---|---|
| Mover paddle | arrastar 1:1 | mouse absoluto / setas / A-D |
| Lançar | tap no campo | click / **V** |
| Pausar | botão de pause | botão / **P** |
| Laser | botão contextual | botão / **Space** / **E** |
| Escolher perk | tap no card | click / **1-2-3** |
| Menu/Levels | pause → menu, results → menu | pause → menu, results → menu |
| Rotação | portrait only; landscape pausa e pede para girar | — |

---

## 5. Arquitetura e mapa do código

### 5.1 Stack

- Phaser 3.90 para cena, render e input.
- TypeScript estrito + Vite 8.
- Vitest para simulação, progressão, ofertas, save, conteúdo e layout.
- Playwright 1.65 para E2E.
- Playgama Bridge 2.4.1 para plataforma.
- Sem backend, sem banco, sem analytics de produto.

### 5.2 Módulos principais

| Área | Arquivos | Responsabilidade |
|---|---|---|
| Boot | `src/main.ts`, `src/boot/**` | boot, Bridge, fallback, query flags |
| Game | `src/game/Game.ts`, `contracts.ts`, `config.ts`, `events.ts` | orquestração, fases, contratos, tuning |
| Simulação | `src/sim/**` | mundo, colisão, passo fixo, RNG, blocos |
| Progressão | `src/progression/**` | XP, perks, save, run state |
| Conteúdo | `src/content/**` | waves, phases, blocos, perks, validação |
| Render | `src/render/**` | tema, arte de bloco, partículas, cena, trajetória |
| UI | `src/ui/**` | menu, HUD, level up, pause, results, level select, debug |
| Input | `src/input/**` | toque, mouse, teclado |
| Áudio | `src/audio/**` | WebAudio, SFX, voz, lifecycle |
| Plataforma | `src/platform/**` | Bridge/fallback, storage, ads, save reset |
| i18n | `src/i18n/en.ts` | todas as strings em inglês |
| Scripts | `scripts/**` | validação de conteúdo, config do Bridge, package, QA runs |
| E2E | `tests/e2e/**` | smoke, layout, helpers |
| Docs | `docs/**` | GDD, plano, spec, QA, release, handoff |

### 5.3 Fluxo de dados

```text
main.ts
  → bridgeBoot (PlatformService + fallback)
  → Game (estado de fase, run, UI, save)
      → World (simulação fixed-step)
      → GameScene (render Phaser)
      → UIRoot (DOM overlays)
      → RunState / Save (XP, perks, progresso)
      → PlatformService (storage, ads, lifecycle)
```

### 5.4 Contratos congelados

- Nenhum código de gameplay pode ramificar por plataforma; tudo passa por
  `PlatformService`.
- Nenhum `localStorage` direto; storage sempre via `StorageService`.
- Tipos de plataforma: `PlatformSource = 'bridge' | 'fallback'`.
- Storage: arrays de chaves/valores de mesmo tamanho.
- Ads: `InterstitialResult = 'shown' | 'skipped' | 'failed'`.
- Mensagens: `game_ready`, `level_started`, `level_paused`, `level_resumed`,
  `level_completed`, `level_failed`.
- Save versionado em `bb.save` e `bb.settings`, schema v1.
- A run ativa não é salva.

### 5.5 Save

`bb.save`:

```text
version: 1
unlockedPhase: 1..6
phases: {
  [phaseId]: {
    bestTimeMs, bestScore, attempts, clears, bestLevel
  }
}
updatedAt
```

`bb.settings`:

```text
version: 1
sound: boolean
```

- Parse seguro: JSON inválido, versão futura ou campos malformados caem em
  defaults; nunca lança.
- `?resetSave=1` limpa o storage no boot.
- `?debug=1` abre o painel de QA; nunca é necessário para jogar.

### 5.6 Build e empacotamento

- `npm run build` gera `dist/`.
- `npm run package` gera `release/blockbreaker-web.zip` + `manifest.json`.
- O ZIP tem `index.html`, `playgama-bridge-config.json`, `playgama-bridge.js`,
  `favicon.svg`, `assets/` e `licenses/` na raiz.
- `scripts/package.mjs` valida:
  - raiz do ZIP;
  - paths relativos;
  - URLs externas permitidas;
  - ≤ 1.000 arquivos;
  - ≤ 250 MB;
  - paths ≤ 240 caracteres.
- `base: './'` permite servir em subpasta.
- Release por tag `v*` no GitHub Actions.

### 5.7 Comandos de desenvolvimento

```bash
npm ci
npm run dev
npm run typecheck
npm test
npm run validate:content
node scripts/validate-bridge-config.mjs
npm run build
npm run package
npm run test:e2e
npm run qa:runs -- --runs=10
npm run preview
```

### 5.8 URLs de QA

- `?debug=1` — painel de debug, tuning, force perk, add XP, add ball, force
  defeat/victory.
- `?resetSave=1` — limpa save/settings.
- `?debug=1&adMock=show` — simula interstitial bem-sucedido.
- `?debug=1&adMock=fail` — simula falha de interstitial.

---

## 6. Qualidade e evidências

### 6.1 Testes e checks

| Camada | Resultado |
|---|---|
| Typecheck | ✅ |
| Unitários | ✅ 229 testes |
| Conteúdo | ✅ 6 fases, 21 ondas, 759 blocos, 1.831 XP |
| Config do Bridge | ✅ schema 2.4.1 |
| Build | ✅ |
| Package | ✅ `0.1.0-mvp` 490,5 KiB, 13 arquivos |
| E2E | ✅ 16 testes Playwright |
| CI | ✅ checks + E2E + deploy |
| Subpasta | ✅ ZIP extraído e servido sem 404 |
| Mock/CDN bloqueado | ✅ fallback local e save/reload |
| AdMock | ✅ show/fail sem travar |

### 6.2 Baseline automatizado

`npm run qa:runs -- --runs=10`:

- 10/10 Victory na fase 1;
- 3 ondas;
- score 1.600;
- nível 6;
- 5 level ups por run;
- duração 49,9–60,1 s;
- 0 mortes/retries no bot;
- perks variados (Power Ball, Safety Net, Prism Laser, Foresight, Arcane Turret,
  Giant Ball, Multiball, Wide Paddle, Quick Study, Explosive Core, Sticky
  Paddle).

**Importante:** é um bot com projéteis de debug, não playtest humano. A duração
abaixo de 2 min e a vitória 100% refletem o bot, não o jogador. Serve para
regressão de duração/nível/ofertas.

### 6.3 G6

- Aprovado pelo owner em **2026-11-08**.
- O owner confirmou playtest humano, matriz de devices reais e sessão de 10 min.
- Nenhum tuning de balance foi aplicado sem dados humanos.
- A evidência humana detalhada (CSV, notas, devices, FPS/memória) **não está
  versionada no repo**. Isso é uma pendência de documentação, não de código.

### 6.4 Performance

- Stress headless com 8 bolas: ~28–32 fps sob SwiftShader.
- Idle headless: ~33–46 fps.
- **Não é métrica de device real.** A medição de hardware real foi conduzida
  pelo owner e aprovada no G6; os números não estão no repositório.
- O build usa DPR controlado, partículas pooled e sem assets externos.
- CrazyGames pode forçar DPR=1 em iOS/Android low-end; o jogo já lida com resize.

### 6.5 Riscos de teste conhecidos

- E2E roda apenas Chromium; Safari/Firefox reais não estão na automação.
- O CI de release (`release.yml`) não roda E2E; o commit da tag deve ter CI
  verde e E2E aprovado.
- Testes de toque multi-dedo, pointercancel e long press são manuais.
- Screenshots/vídeo usam debug oculto para estados determinísticos; o visual é
  real, mas não é uma sessão humana espontânea.

---

## 7. Release e distribuição

### 7.1 Pacote de M7

| Asset | Caminho | Spec |
|---|---|---|
| ZIP | `release/blockbreaker-web.zip` | 13 arquivos, 490,5 KiB |
| Manifest | `release/manifest.json` | versão, SHA, tamanho, paths |
| Capa 16:9 | `store/covers/cover-landscape-1920x1080.png` | 1920×1080 |
| Capa 2:3 | `store/covers/cover-portrait-800x1200.png` | 800×1200 |
| Capa 1:1 | `store/covers/cover-square-800x800.png` | 800×800 |
| Contact sheet | `store/covers/cover-contact-sheet.png` | revisão rápida |
| Screenshots | `store/screenshots/*.png` | 5 imagens 390×844 |
| Vídeo | `store/video/bricklike-preview.mp4` | 1280×720, 30,6 s, silencioso |
| Metadata | `docs/release/portal-metadata.md` | inglês, por portal |
| Checklist | `docs/release/submission-checklist.md` | manual, por portal |
| Revisão G7 | `docs/release/g7-review.md` | inventário e review |
| Status pós-launch | `docs/release/status.md` | tabela de URLs/status |
| Validação técnica | `docs/release/technical-validation.md` | ZIP, subpasta, E2E |

### 7.2 G7 — o que falta

1. Revisar as três capas e o contact sheet.
2. Revisar os cinco screenshots.
3. Assistir ao vídeo de 30,6 s; decidir se a ausência de áudio é aceitável.
4. Aprovar os textos em inglês e os controles.
5. Baixar o ZIP e abrir em aba anônima/subpasta.
6. Confirmar a sequência de submissão e quem submete.
7. Aprovar o G7.

### 7.3 O que acontece depois do G7

Somente após a aprovação:

```bash
git tag -a v0.1.0-mvp -m "Bricklike v0.1.0-mvp"
git push origin v0.1.0-mvp
```

O workflow `.github/workflows/release.yml` cria o GitHub Release com
`blockbreaker-web.zip` e `manifest.json`.

Depois, **manualmente**, o owner:

1. publica no **itch.io** (HTML5 ZIP, Mobile Friendly, doação, sem ads);
2. publica no **GameFlare** (ZIP/link, sem SDK obrigatório, sem ads internos);
3. submete à **Playgama** (Bridge, config, `game_ready`, storage, interstitial;
   review ~24 h);
4. submete ao **CrazyGames Basic Launch** (mesmo ZIP, três capas, vídeo,
   descrição ≥ 100 palavras, ads desligados; não Full Launch);
5. registra URLs/datas em `docs/release/status.md`.

### 7.4 Regras de portal a revalidar na data do upload

- itch.io: HTML5 em iframe só aceita doação; Mobile Friendly; sem ads.
- GameFlare: sem SDK obrigatório; sem ads internos.
- Playgama: Bridge obrigatório; `game_ready`; storage via SDK; interstitial em
  pausa natural; sem analytics externo.
- CrazyGames Basic: SDK via Bridge; ads desligados; 3 capas; vídeo; descrição
  ≥ 100 palavras; 7 dias/500 plays; Full Launch fora do MVP.

### 7.5 Pós-launch

- Acompanhar CrazyGames Basic por **7 dias ou 500 plays**.
- Coletar feedback, reviews, playtime e retenção dos dashboards dos portais.
- Não iniciar Full Launch, Poki, GameDistribution ou Famobi neste MVP.
- Só considerar Full Launch depois dos thresholds e de uma rodada específica de
  SDK/QA.

---

## 8. Decisões congeladas e restrições

Estas decisões não devem ser revertidas sem uma decisão explícita de nova fase:

- **Nome oficial:** Bricklike.
- **Slug técnico:** `blockbreaker` (repo, pacote, URL, ZIP). Não usar como nome
  de loja.
- **Formato:** HTML5 portrait, um único build para os quatro portais.
- **Orientação:** mobile landscape apenas pausa e pede portrait; não é jogável.
- **Idioma:** interface e metadata em inglês; sem localização no MVP.
- **Controles:** V lança/solta sticky; Space/E laser; P pausa; click/tap lança.
- **Terminologia:** **Levels**, não “Phases”, na UI.
- **Plataforma:** tudo via Playgama Bridge; sem `if (platform === ...)`.
- **Storage:** apenas via Bridge; sem `localStorage` direto.
- **Ads:** somente interstitial na saída dos results; sem rewarded, banners ou
  frequência própria.
- **Analytics:** desligado; sem GA4 ou rede externa.
- **Save:** schema v1; `unlockedPhase` 1..6; run ativa não é salva.
- **Conteúdo:** 6 fases, ondas 3/3/3/3/4/5, 9 blocos, 7 elementos, 3 chefes e
  19 perks na v0.2.0. O recorte `0.1.0-mvp` (3 × 3, 3 blocos, 11 perks, sem
  chefe) permanece congelado no itch.io.
- **Build:** paths relativos, sem recursos externos além do CDN do Bridge com
  fallback local.
- **Escopo:** sem backend, sem contas, sem ranking global, sem conquistas, sem
  metaprogressão.
- **Publicação:** manual pelo owner; nenhum agente submete portal.

---

## 9. Limitações, riscos e dívida técnica

| Área | Estado atual | Risco | Ação sugerida na próxima fase |
|---|---|---|---|
| Evidência G6 | aprovada pelo owner, mas CSV/notas/devices não versionados | perda de contexto e impossibilidade de auditar o gate | arquivar CSV, notas e resultados de hardware em `docs/qa/` |
| Arte de capa | drafts vetoriais de alta qualidade | portal pode rejeitar ou performar pior | refino humano/artista; testar capas |
| Vídeo | silencioso, 30,6 s, debug oculto | pode ser menos convincente | gravar versão com áudio/uma run humana, se necessário |
| Screenshots | debug oculto para estados determinísticos | podem parecer “encenados” | capturar uma run humana real se o portal exigir |
| Analytics | nenhum dado de produto | decisões da fase 2 sem retenção/playtime próprios | decidir analytics privacy-friendly ou usar só dashboards dos portais |
| i18n | um único `en.ts` | adicionar idiomas exige refactor | separar catálogo/locale antes de localizar |
| Testes | E2E só Chromium | Safari/Firefox podem regredir | matriz real + smoke manual por release |
| Release | `release.yml` não roda E2E | tag pode apontar para commit não testado em browser | rodar E2E no commit da tag ou incluir no workflow |
| Performance | números reais fora do repo | regressão em low-end não detectável | criar baseline de hardware e budget de FPS/memória |
| Conteúdo | 21 ondas, 9 blocos, 7 elementos, 3 chefes, 19 perks | variedade razoável, mas sem dados de retenção da campanha | playtest e dados reais antes de nova expansão |
| Metaprogressão | inexistente | baixa retenção de longo prazo | decidir se fase 2 é conteúdo ou meta |
| Backend | inexistente | sem ranking, conta, sync | manter fora até haver necessidade |
| Sitelock | não implementado | cópia em sites não autorizados | avaliar só se distribuição exigir |
| `assets/.gitkeep` | arquivo vazio no ZIP | cosmético | remover em limpeza futura |
| Debug em produção | flags `?debug=1` | exposição de tuning/força de resultado | manter gated; nunca divulgada nas URLs de portal |
| Dependências | Phaser 3.90/Bridge 2.4.1 pinadas | upgrade pode quebrar APIs | avaliar upgrade só em milestone técnico |

---

## 10. O que a próxima fase precisa decidir

Antes de abrir tarefas, responder:

1. **Objetivo principal da fase 2:** validar audiência, aumentar retenção,
   monetizar, expandir conteúdo ou entrar em mais plataformas?
2. **Publicar primeiro?** A recomendação é fechar G7 e lançar nos quatro portais
   antes de investir em conteúdo novo.
3. **Qual sinal decide sucesso?** 500 plays no CrazyGames Basic, playtime,
   retenção D1/D7, reviews, pedidos de novos levels, receita?
4. **Conteúdo ou plataforma?** Mais levels/perks ou landscape/idiomas/Full
   Launch?
5. **Arte:** manter pixel art procedural ou contratar/refinar arte final?
6. **Metaprogressão:** desbloqueios, leaderboards e conquistas entram agora?
7. **Analytics:** usar apenas dashboards dos portais ou adicionar telemetria
   privacy-friendly?
8. **Monetização:** continuar só interstitial ou preparar rewarded/Full Launch?
9. **Equipe/processo:** usar subagentes, worktrees e gates como no MVP?
10. **Prazo/orçamento:** qual é o limite para a fase 2?

---

## 11. Opções de próxima fase

### Opção A — Launch-first (recomendada)

**Objetivo:** colocar o MVP no ar e coletar dados antes de expandir.

**Escopo:**

- fechar G7 (revisão de capas/vídeo/textos/ZIP);
- criar tag `v0.1.0-mvp` e GitHub Release;
- publicar manualmente em itch.io, GameFlare, Playgama e CrazyGames Basic;
- registrar URLs/status;
- acompanhar 7 dias/500 plays;
- corrigir apenas P0/P1 e bugs de portal;
- decidir a fase 2 com dados.

**Dependências:** revisão humana, contas nos portais, regras atuais.  
**Esforço:** S (dias, não semanas), dominado pela review dos portais.  
**Saída:** jogo publicado, baseline real de audiência e lista de correções.

### Opção B — Content expansion

**Objetivo:** aumentar variedade e retenção com mais conteúdo.

**Escopo possível:**

- 2–3 novos levels ou um novo mundo temático;
- 6–10 novos perks e mais sinergias;
- 2–4 novos tipos de bloco (explosivo, regenerativo, móvel, gerador);
- novas estruturas de onda (tempo, meta parcial, ondas sobrepostas);
- um chefe ou evento de fim de mundo;
- mais variação de áudio/visual por tema.

**Dependências:** arte, level design, balanceamento, validação de conteúdo,
playtest.  
**Esforço:** M–L (semanas).  
**Risco:** conteúdo sem retenção validada; balancear sem dados humanos.

### Opção C — Platform expansion

**Objetivo:** ampliar distribuição e formatos.

**Escopo possível:**

- Full Launch do CrazyGames (Data/User, direct-to-gameplay, SDK QA);
- modo landscape jogável;
- localização russa (VK/Yandex) ou outros idiomas;
- Poki/GameDistribution/Famobi (avaliar contratos e exclusividade);
- builds/portal-specific metadata;
- sitelock e whitelists.

**Dependências:** regras de portal, QA real, localização, layout, contratos.  
**Esforço:** M–L.  
**Risco:** aumento de manutenção e complexidade de release; só faz sentido
depois de retenção validada.

### Opção D — Meta e live ops

**Objetivo:** retenção de longo prazo e monetização.

**Escopo possível:**

- metaprogressão com desbloqueios de conteúdo (sem bônus permanentes de
  atributos, conforme GDD);
- leaderboards, conquistas, tarefas diárias;
- rewarded ads com vantagens específicas;
- eventos/sazonalidade;
- conta/cloud save (se portal exigir).

**Dependências:** APIs dos portais, economia, analytics, backend (se houver).  
**Esforço:** M–L.  
**Risco:** complexidade e custo antes de provar retenção.

### Opção E — Productization / polish

**Objetivo:** elevar percepção de qualidade e conversão de loja.

**Escopo possível:**

- arte final de capa e ícones;
- música e mixagem;
- polimento de UI/UX e acessibilidade;
- screenshots/vídeo com runs humanas;
- página de loja, textos e SEO;
- acessibilidade (contraste, reduced motion, remapeamento de teclas).

**Dependências:** artista/áudio/design humano.  
**Esforço:** S–M.  
**Risco:** retrabalho se a direção visual mudar.

### Sequência recomendada

1. **Fechar G7 e publicar** (Opção A).
2. Coletar 7 dias/500 plays e feedback.
3. **Corrigir P0/P1 e polir o que os dados mostrarem** (Opção E parcial).
4. Decidir entre **conteúdo** (B) e **plataforma** (C) com base em retenção.
5. Só depois considerar **metaprogressão/monetização** (D) e Full Launch.

### Plano sugerido 30/60/90 a partir do G7

**Dias 0–7 — colocar no ar**

- aprovar G7 e congelar o pacote `0.1.0-mvp`;
- criar tag e GitHub Release;
- publicar manualmente nos quatro portais;
- preencher `docs/release/status.md`;
- confirmar que o ZIP/hash é o mesmo em todos os uploads.

**Dias 7–30 — medir e estabilizar**

- acompanhar CrazyGames Basic (7 dias/500 plays) e dashboards dos portais;
- registrar reviews, playtime, retenção e bugs;
- corrigir somente P0/P1 ou bloqueios de portal;
- arquivar a evidência humana do G6;
- decidir a métrica de sucesso da fase 2.

**Dias 30–90 — expandir com foco**

- escolher **uma** frente principal: conteúdo (B), plataforma (C) ou polish (E);
- escrever escopo congelado e critérios de sucesso;
- rodar playtest antes de tuning de gameplay;
- só considerar Full Launch/metaprogressão (D) depois dos dados.

---

## 12. Backlog priorizado sugerido

Itens já entregues na v0.2.0 (campanha de 6 fases, blocos especiais, elementos,
chefes, 19 perks, desafios, zoom, endings) saíram deste backlog. O **modo
Endless** entrou na v0.3.0 com fase infinita, progressão, chefes recorrentes e
recordes no save; leaderboard de Endless, dificuldade selecionável e
metaprogressão continuam fora.

### P0 — fechar a v0.2.0

- [ ] Playtest humano da campanha e ajuste de balanceamento com dados reais.
- [ ] Revisar o pacote de loja para a v0.2.0 (capas, screenshots, vídeo, textos).
- [ ] Gerar e validar o ZIP `0.2.0` em subpasta.
- [ ] Decidir se a v0.2.0 substitui o `0.1.0-mvp` no itch.io ou entra como build
      separado; manter o ZIP publicado congelado até a decisão.
- [ ] Atualizar `docs/release/status.md` e a metadata por portal.
- [ ] Arquivar a evidência humana do G6 e o baseline de performance real.

### P1 — depois do lançamento da v0.2.0

- [ ] Corrigir bugs de portal/feedback real.
- [ ] Definir métrica de sucesso da próxima fase.
- [ ] Analytics privacy-friendly ou uso exclusivo dos dashboards dos portais.
- [ ] Criar baseline de performance em hardware real.
- [ ] Melhorar arte de capa/vídeo com assets finais ou runs humanas.

### P2 — depois de retenção/dados

- [ ] Metaprogressão com desbloqueios de conteúdo, sem bônus permanentes.
- [ ] Rewarded ads com vantagens específicas.
- [ ] Leaderboards e conquistas, conforme APIs dos portais.
- [ ] Leaderboard específico do modo Endless (fora da v0.3.0).
- [ ] Dificuldade selecionável (fora da v0.3.0).
- [ ] Localização para outros idiomas e landscape jogável.
- [ ] Full Launch do CrazyGames.
- [ ] Poki/GameDistribution/Famobi (avaliar contratos).
- [ ] Backend/cloud save, se necessário.

---

## 13. Riscos da próxima fase

| Risco | Impacto | Mitigação |
|---|---|---|
| Publicar sem G7 | alto | gate explícito; revisão humana de assets |
| Portal rejeitar capa/vídeo | médio | refino humano; revalidar regras na data |
| Retenção baixa | alto | launch-first; medir 7 dias/500 plays |
| Conteúdo sem demanda | alto | só expandir após dados |
| Balanceamento sem dados | alto | playtest humano; não tunar no escuro |
| Performance low-end | médio | baseline de hardware; budget de partículas |
| Complexidade de Full Launch | médio | manter Basic até 500 plays |
| Localização/landscape | médio | só se parceiros justificarem |
| Dependência de Bridge/CDN | médio | fallback local já validado |
| Regras de portal mudarem | médio | revalidar antes de cada upload |
| Save quebrar em update | médio | versionar schema e migrar com defaults |
| Escopo crescer | alto | congelar fase 2 em um objetivo |
| Receita de ads baixa | alto | expectativa realista; portal como funil |
| Arte 100% IA | médio | refino humano obrigatório |

---

## 14. Onboarding técnico para a próxima fase

### 14.1 Abrir o projeto

```bash
cd /mnt/SSD-Secundario/Nextcloud/5-GameProjects/4-Blockbreaker-roguelite
npm ci
npm run dev
```

O `node_modules` não fica versionado nem é mantido na pasta para evitar sync
pesado no Nextcloud. Rode `npm ci` ao começar.

### 14.2 Validar antes de mexer

```bash
npm run typecheck
npm test
npm run validate:content
node scripts/validate-bridge-config.mjs
npm run build
npm run package
npm run test:e2e
```

### 14.3 Onde mexer

- **Gameplay/tuning:** `src/game/config.ts`, `src/sim/**`, `src/progression/**`.
- **Conteúdo:** `src/content/waves.ts`, `phases.ts`, `blocks.ts`, `perks.ts`.
- **UI:** `src/ui/**`, `src/style.css`, `src/i18n/en.ts`.
- **Arte/áudio:** `src/render/**`, `src/audio/**`.
- **Plataforma:** `src/platform/**`, `src/boot/**`,
  `public/playgama-bridge-config.json`.
- **Build/release:** `scripts/package.mjs`, `.github/workflows/**`.
- **Testes:** `tests/**`, `tests/e2e/**`.
- **Docs:** `docs/**`, `store/**`.

### 14.4 Convenções de trabalho

- Trabalhar na pasta do projeto, não em `/tmp`.
- Se usar subagentes, criar worktrees dentro de `.worktrees/` (ignorado pelo
  git) e removê-las ao final; nunca deixar `node_modules` ou artefatos
  temporários na pasta sincronizada.
- Subagentes não fazem merge/push na `main`.
- Commits pequenos e gates explícitos.
- Não tunar balance sem dados humanos.
- Não submeter portal automaticamente; publicação é manual.

### 14.5 Definition of Done sugerida para a fase 2

- Objetivo da fase escrito e aprovado.
- Escopo congelado com lista de fora de escopo.
- Critérios de sucesso mensuráveis.
- Testes automatizados atualizados.
- Playtest humano quando a mudança for de gameplay.
- Build/ZIP validado em subpasta.
- Documentação de release/status atualizada.
- Nenhum P0/P1 aberto.

---

## 15. Perguntas para o owner

1. O objetivo da fase 2 é **publicar/validar**, **aumentar retenção**,
   **monetizar** ou **expandir plataforma**?
2. Você quer lançar o MVP nos quatro portais antes de investir em conteúdo?
3. Qual métrica vai decidir o sucesso: 500 plays, playtime, retenção, reviews,
   receita ou conclusão de levels?
4. Conteúdo novo (levels/perks/blocos) ou plataforma (landscape, idiomas, Full
   Launch) tem prioridade?
5. A arte de capa/vídeo atual está aprovada ou precisa de refino humano?
6. O vídeo silencioso é aceitável para os portais?
7. Quer analytics de produto ou basta usar os dashboards dos portais?
8. Metaprogressão/leaderboards/conquistas entram na fase 2 ou ficam para depois?
9. Qual é o prazo/orçamento da fase 2?
10. Quem são os playtesters/artista/áudio disponíveis para a próxima fase?

---

## 16. Referências

### Produto e design

- `docs/GDD_Bricklike.md` — visão, pilares, loop, escopo, backlog futuro.
- `docs/plano-implementacao-mvp.md` — plano M0–M7, gates, riscos, DoD.
- `docs/plano-baixa-fricao.md` — estratégia de distribuição e expectativa de
  receita.

### Distribuição

- `docs/spec-tecnica-publicacao.md` — requisitos técnicos dos portais.
- `docs/build-release.md` — build, ZIP, checklist e runbook de tag.
- `docs/release/README.md` — índice do pacote de release.
- `docs/release/portal-metadata.md` — textos em inglês por portal.
- `docs/release/submission-checklist.md` — checklist manual por portal.
- `docs/release/technical-validation.md` — evidências do ZIP/build.
- `docs/release/g7-review.md` — inventário e review G7.
- `docs/release/status.md` — status/URLs pós-upload.

### QA

- `docs/qa/m6-report.md` — relatório M6 e decisão G6.
- `docs/qa/device-matrix.md` — matriz de devices/navegadores.
- `docs/qa/performance.md` — tamanho e stress headless.
- `docs/qa/playtest-kit.md` — protocolo de playtest humano.
- `docs/qa/run-log.csv` — baseline automatizado de 10 runs.
- `docs/qa/run-log-template.csv` — template de runs humanas.

### Assets

- `store/README.md` — índice de assets de loja.
- `store/covers/README.md` — capas e regeneração.
- `store/screenshots/README.md` — screenshots.
- `store/video/README.md` — vídeo e limitações.

### Código

- `README.md` — visão geral, stack, run, estrutura e deployment.
- `src/game/config.ts` — tuning congelado.
- `src/game/contracts.ts` — contratos de plataforma, save e gameplay.
- `src/content/**` — conteúdo e validação.
- `src/platform/**` — Bridge/fallback, storage, ads.
- `tests/**` e `tests/e2e/**` — testes.

---

## Apêndice A — Histórico de gates

| Gate | Milestone | Decisão |
|---|---|---|
| G0 | M0 Fundação | stack e fundação aprovadas |
| G1 | M1 Núcleo | core jogável aprovado |
| G2 | M2 Perks | progressão aprovada |
| G3 | M3 Levels/save | run completa e dificuldade aprovadas |
| G4 | M4 Apresentação | apresentação aprovada |
| G4.1 | tuning | feel final ajustado |
| G5 | M5 Distribuição | build pronto para portal |
| G6 | M6 QA/balance | **aprovado em 2026-11-08** |
| G7 | M7 Publicação | **pendente** |

## Apêndice B — O que não foi feito no MVP (por escopo)

> Recorte original `0.1.0-mvp`. A v0.2.0 entregou campanha de 6 fases, 3 chefes,
> blocos especiais, elementos e 19 perks; os itens abaixo continuam fora apenas
> quando indicado no backlog da §12.

- Campanha completa, vários mundos e chefes.
- Catálogo grande de blocos/perks e blocos especiais.
- Metaprogressão, moeda, loja, rebatedores/bolas desbloqueáveis.
- Rankings globais, conquistas, leaderboards, tarefas e login.
- Rewarded ads, banners, pagamentos e cosméticos.
- Full Launch do CrazyGames.
- Localização em outros idiomas.
- Modo landscape jogável.
- Editor de fases ou pipeline procedural.
- Analytics de produto, backend e cloud save.
- Sitelock próprio.
- Submissão automática em portais.

## Apêndice C — Arquivos gerados que não são versionados

- `dist/` — build atual (ignorado pelo git).
- `release/blockbreaker-web.zip` — ZIP final (ignorado).
- `release/manifest.json` — manifesto do ZIP (ignorado).
- `node_modules/` — dependências (não manter no Nextcloud).
- `playwright-report/`, `test-results/`, `*.tsbuildinfo` — artefatos de teste.

---

**Fim do handoff.**  
Para começar a próxima fase, a primeira decisão é: **fechar G7 e publicar
primeiro** ou **investir em conteúdo/plataforma antes do lançamento**. A
recomendação é publicar primeiro e usar os dados dos portais para escolher o
próximo investimento.
