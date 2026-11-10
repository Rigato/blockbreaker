# Submission checklist — Bricklike

**Versão de desenvolvimento:** `0.3.x` + revisão visual/menu (v0.4.0-dev).  
**Build publicado:** `0.1.0-mvp` no itch.io (congelado).  
**Status global:** pendente de revisão humana.  
**Quem submete:** o usuário, manualmente, em cada portal. Nenhum upload, tag ou
release pública foi feito por este trabalho.

Revalidar as regras de cada portal **na data da submissão**; elas mudam com
frequência. O checklist abaixo registra o pacote atual e o aprendizado da
primeira rodada de submissões (Playgama sandbox, CrazyGames reprovado,
GameFlare bloqueado por acesso).

## Pré-requisitos comuns

- [ ] ZIP final gerado pelo pipeline de release (S6/build), com `index.html` e
      `playgama-bridge-config.json` na raiz. **Pendente de revisão humana.**
- [ ] ZIP aberto em aba anônima, servido em subpasta, sem 404 e sem requests
      externas além do Bridge/fallback. **Pendente de revisão humana.**
- [ ] Título, descrição curta, descrição longa e controles revisados em
      `docs/release/portal-metadata.md`. **Pendente de revisão humana.**
- [ ] Três capas revisadas e aprovadas em `store/covers/`. **Pendente de revisão
      humana.**
- [ ] Screenshots atualizados com o novo visual (menu, blocos, chefes, Endless).
      **Pendente de revisão humana.**
- [ ] Previews de 18,3 s revisados em `store/video/bricklike-preview.mp4`
      (1920×1080) e `store/video/bricklike-preview-portrait.mp4` (1080×1620).
      **Pendente de revisão humana.**
- [ ] Nome **Bricklike** consistente em todos os portais. **Pendente de revisão
      humana.**
- [ ] Testar leitura em **907×510**, **1216×684**, **1280×720** e **1920×1080**
      além de 320×568 e 390×844. **Pendente de revisão humana.**
- [ ] Onboarding curto na primeira run, visual e pulável. **Pendente de revisão
      humana.**
- [ ] Menu leva ao gameplay em 1 clique (Campaign → seleção → Play). **Pendente
      de revisão humana.**


## Assets compartilhados

| Asset | Caminho | Spec | Status |
|---|---|---|---|
| Capa 16:9 | `store/covers/cover-landscape-1920x1080.png` | 1920×1080 PNG | pendente de revisão humana |
| Capa 2:3 | `store/covers/cover-portrait-800x1200.png` | 800×1200 PNG | pendente de revisão humana |
| Capa portrait Playgama | `store/covers/cover-portrait-1080x1920.png` | 1080×1920 PNG | pendente de revisão humana |
| Capa 1:1 | `store/covers/cover-square-800x800.png` | 800×800 PNG | pendente de revisão humana |
| Contact sheet | `store/covers/cover-contact-sheet.png` | revisão interna | pendente de revisão humana |
| Menu | `store/screenshots/01-menu-390x844.png` | 390×844 PNG | pendente de revisão humana |
| Gameplay inicial | `store/screenshots/02-gameplay-early-390x844.png` | 390×844 PNG | pendente de revisão humana |
| Laser + multiball | `store/screenshots/03-gameplay-laser-multiball-390x844.png` | 390×844 PNG | pendente de revisão humana |
| Level-up | `store/screenshots/04-levelup-three-cards-390x844.png` | 390×844 PNG | pendente de revisão humana |
| Victory/results | `store/screenshots/05-results-victory-390x844.png` | 390×844 PNG | pendente de revisão humana |
| Preview landscape | `store/video/bricklike-preview.mp4` | 1920×1080, 18,3 s, H.264 | pendente de revisão humana |
| Preview portrait | `store/video/bricklike-preview-portrait.mp4` | 1080×1620, 18,3 s, H.264 | pendente de revisão humana |

## itch.io

| Item | Requisito / campo | Status |
|---|---|---|
| Conta e projeto | Projeto HTML5 criado pelo usuário | pendente de revisão humana |
| Upload | ZIP HTML5 final | pendente de revisão humana |
| Embed | Mobile Friendly ligado; fullscreen; click-to-play | pendente de revisão humana |
| Título | Bricklike | pendente de revisão humana |
| Descrição | Curta + longa em inglês | pendente de revisão humana |
| Controles | Campo de controles preenchido | pendente de revisão humana |
| Tags | arcade, brick-breaker, roguelite, pixel-art, html5, mobile | pendente de revisão humana |
| Preço | Free + doação opcional; sem venda no embed HTML5 | pendente de revisão humana |
| Capa | 16:9 ou 2:3 aprovada | pendente de revisão humana |
| Screenshots | 5 imagens aprovadas | pendente de revisão humana |
| Ads | Nenhum ad interno; não prometer ads no itch.io | pendente de revisão humana |
| Publicação | Usuário clica em publicar | pendente de revisão humana |

## GameFlare

| Item | Requisito / campo | Status |
|---|---|---|
| Conta e projeto | Projeto criado pelo usuário | pendente de revisão humana |
| Upload | ZIP HTML5 ou link do build | pendente de revisão humana |
| SDK | SDK opcional do GameFlare não é necessário | pendente de revisão humana |
| Título | Bricklike | pendente de revisão humana |
| Descrição | Curta + longa em inglês | pendente de revisão humana |
| Categoria | Arcade | pendente de revisão humana |
| Controles | Campo de controles preenchido | pendente de revisão humana |
| Tags | arcade, block breaker, roguelite, pixel art, html5 | pendente de revisão humana |
| Ads | Sem ads dentro do jogo; ads do portal ficam fora do jogo | pendente de revisão humana |
| Assets | Capa e screenshots aprovadas | pendente de revisão humana |
| Publicação | Usuário envia para revisão | pendente de revisão humana |

## Playgama

| Item | Requisito / campo | Status |
|---|---|---|
| Conta e projeto | Projeto criado pelo usuário no Playgama | pendente de revisão humana |
| Upload | ZIP com `index.html` e `playgama-bridge-config.json` na raiz | pendente de revisão humana |
| Bridge | Config validado; sem logo/analytics; safe area ligada | pendente de revisão humana |
| Eventos | `game_ready`, `level_started/paused/resumed/completed/failed` | pendente de revisão humana |
| Storage | `bb.save` e `bb.settings` via Bridge; reload preserva | pendente de revisão humana |
| Interstitial | Solicitado ao sair dos results; `failed`/`skipped` não bloqueia | pendente de revisão humana |
| Áudio | Mudo durante ads/background; retoma após gesto | pendente de revisão humana |
| Título | Bricklike | pendente de revisão humana |
| Descrição | Curta + longa em inglês | pendente de revisão humana |
| Orientação | Portrait | pendente de revisão humana |
| Assets | Capa portrait **1080×1920** (`cover-portrait-1080x1920.png`) e screenshots aprovadas | pendente de revisão humana |
| Review | Acompanhar a review do portal (~24 h) | pendente de revisão humana |
| Publicação | Usuário submete e acompanha o status | pendente de revisão humana |

## CrazyGames — Basic Launch

| Item | Requisito / campo | Status |
|---|---|---|
| Conta e projeto | Projeto criado pelo usuário | pendente de revisão humana |
| Tipo de submissão | **Basic Launch**, não Full Launch | pendente de revisão humana |
| Upload | ZIP HTML5 final | pendente de revisão humana |
| Capa 16:9 | 1920×1080, sem bordas/texto extra/logos | pendente de revisão humana |
| Capa 2:3 | 800×1200, mesma linguagem visual | pendente de revisão humana |
| Capa 1:1 | 800×800, mesma linguagem visual | pendente de revisão humana |
| Preview video | MP4 15–20 s, gameplay real, 1920×1080 + 1080×1620 | pendente de revisão humana |
| Descrição | Inglês, ≥ 100 palavras | pendente de revisão humana |
| Controles | Campo de controles preenchido | pendente de revisão humana |
| Título | Bricklike | pendente de revisão humana |
| Ads | Desligados no Basic; jogo não trava esperando ad | pendente de revisão humana |
| Inglês | UI e metadata em inglês | pendente de revisão humana |
| Mobile | Portrait mobile-friendly; testar em Chromebook/Android | pendente de revisão humana |
| Desktop | HUD legível em 907×510 e 1920×1080; fundo intencional | pendente de revisão humana |
| Onboarding | Primeiros 30 s explicam mover, lançar e quebrar | pendente de revisão humana |
| Consistência | Capa, screenshots e blocos usam a mesma linguagem visual | pendente de revisão humana |
| Qualidade | Sem artefatos, texto cortado, controles ambíguos ou áudio estourado | pendente de revisão humana |
| Revalidação | Conferir regras atuais do Basic Launch | pendente de revisão humana |
| Full Launch | Fora do escopo deste MVP | pendente de revisão humana |
| Publicação | Usuário submete e acompanha 7 dias/500 plays | pendente de revisão humana |

## Reenvio ao CrazyGames

Antes de reenviar, ler `docs/release/crazygames-review.md`. O FAQ do portal só
aceita reenvio se houver melhoria clara. A mensagem deve listar:

- novo visual dos blocos e do menu;
- legibilidade desktop e HUD revisado;
- onboarding in-game;
- seleção de fases e modo Endless;
- settings de som/música/screen shake;
- screenshots, capa e descrição atualizados.


## Sequência manual acordada

1. Validar o ZIP e os assets com o agente principal/review G7.
2. Publicar no itch.io.
3. Publicar no GameFlare.
4. Submeter ao Playgama.
5. Submeter ao CrazyGames como Basic Launch.
6. Registrar URLs, datas e status de cada portal.
7. Acompanhar o Basic Launch por 7 dias ou 500 plays antes de discutir Full
   Launch.

**Nenhum passo desta sequência foi executado automaticamente.**
