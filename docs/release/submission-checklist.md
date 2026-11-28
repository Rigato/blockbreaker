# Submission checklist — Bricklike

**Versão publicada:** `0.8.0` no **itch.io** e na **Playgama** (catálogo, fora do sandbox).  
**Linha local:** `0.8.1` (2026-11-28), patch de ads; bridge × clean; não enviada aos portais; sem tag/release.
**Build anterior:** `0.8.0` (bridge × clean, publicada no itch.io/Playgama).
**Y8:** `0.8.0` enviada; aguardando resposta do portal.
**CrazyGames:** `0.8.0` **clean** enviada e recusada, sem motivo específico; pedir feedback antes de reenviar.
**Status global:** `0.8.0` publicada no itch.io/Playgama, em análise no Y8 e recusada na CrazyGames; `0.8.1` local corrige o rewarded revive e o encadeamento de ads; assets de loja antigos ainda são da 0.6.1. Nenhuma tag ou GitHub Release foi criada.  
**Quem submete:** o usuário, manualmente, em cada portal.

Revalidar as regras de cada portal **na data da submissão**; elas mudam com
frequência. O checklist registra o pacote atual e o aprendizado das submissões
(Playgama sandbox, CrazyGames com 0.3.0 e 0.4.0 reprovadas, 0.5.1 submetida e
GameFlare bloqueado por acesso).

## Pré-requisitos comuns

- [ ] Teste humano final da 0.8.1 concluído: bridge nos portais Playgama/Y8/
      Lagged/itch e clean no CrazyGames Basic/Kongregate.
- [ ] Rewarded real na Playgama: assistir ao ad, confirmar o revive; depois
      forçar outra derrota e clicar Menu — nenhum ad novo em 60 s.
- [ ] ZIP final 0.8.1 gerado pelo pipeline de release. **Bridge:**
      `index.html` + `playgama-bridge-config.json` + Bridge local. **Clean:**
      `index.html` apenas, sem runtime/config da Playgama nem SDK do
      CrazyGames. Confirme os dois ZIPs e manifestos.
- [ ] Clean em aba anônima: sem requests a `playgama-bridge.js`,
      `sdk.crazygames.com` ou hosts externos; save/settings persistem.
- [ ] ZIP aberto em aba anônima, servido em subpasta, sem 404 e sem requests
      externas no boot. **Pendente de revisão humana.**
- [ ] Título, descrição curta, descrição longa e controles revisados em
      `docs/release/portal-metadata.md` para 3 mundos/18 fases (19 com tutorial)
      e 69 ondas (71 com tutorial). **Pendente de revisão humana.**
- [ ] Capas revisadas e aprovadas em `store/covers/`. **Regeneradas da 0.6.1;
      revisão humana pendente.**
- [x] Screenshots, capas e vídeos **da 0.6.1** (tutorial, campanha, controles
      touch, 7 cards, Frost Sentinel e Endless). **Revisão humana pendente.**
- [x] How to Play (5 páginas, 780×468) da 0.5.1; About Us (logomarca Bad
      Decision Games) revisado na 0.4.0. **Revisão humana pendente.**
- [ ] Nome **Bricklike** consistente em todos os portais. **Pendente de revisão
      humana.**
- [x] Leitura em **907×510**, **1216×684**, **1280×720**, **800×450** e
      **1920×1080** além de 320×568 e 390×844 (HUD compacto ≤440 px).
- [x] Tutorial in-game pulável com gate do level 1, coach marks e skip.
- [ ] Menu leva ao gameplay em Campaign → card → Play (2 cliques). Para o Full
      Launch da CrazyGames seria necessário 1 clique/entrada direta.
      **Pendente de decisão.**
- [x] Gates da 0.8.1: 447 testes unitários em 37 arquivos; 48 E2E (bridge +
      mobile + clean); conteúdo com 19 níveis/71 ondas/2.781 blocos/9.392 XP.

## Assets compartilhados

| Asset | Caminho | Spec | Status |
|---|---|---|---|
| Capa 16:9 | `store/covers/cover-landscape-1920x1080.png` | 1920×1080 PNG | 0.6.1; revisão humana |
| Capa 2:3 | `store/covers/cover-portrait-800x1200.png` | 800×1200 PNG | 0.6.1; revisão humana |
| Capa portrait Playgama | `store/covers/cover-portrait-1080x1920.png` | 1080×1920 PNG | 0.6.1; revisão humana |
| Capa 1:1 | `store/covers/cover-square-800x800.png` | 800×800 PNG | 0.6.1; revisão humana |
| Contact sheet | `store/covers/cover-contact-sheet.png` | 1608×674, revisão interna | 0.6.1; revisão humana |
| Menu | `store/screenshots/01-menu-390x844.png` | 390×844 PNG | 0.5.1; tutorial + 7 nós |
| Tutorial / gameplay inicial | `store/screenshots/02-gameplay-early-390x844.png` | 390×844 PNG | 0.5.1; coach mark |
| Laser + multiball | `store/screenshots/03-gameplay-laser-multiball-390x844.png` | 390×844 PNG | 0.5.1 |
| Level-up | `store/screenshots/04-levelup-three-cards-390x844.png` | 390×844 PNG | 0.5.1 |
| Victory/results | `store/screenshots/05-results-victory-390x844.png` | 390×844 PNG | 0.5.1 |
| Special blocks | `store/screenshots/06-special-blocks-390x844.png` | 390×844 PNG | 0.5.1 |
| Boss | `store/screenshots/07-boss-frost-sentinel-390x844.png` | 390×844 PNG | 0.5.1 |
| Endless | `store/screenshots/08-endless-wave-1-390x844.png` | 390×844 PNG | 0.5.1 |
| How to Play | `public/how-to-play/*.png` | 780×468 PNG ×5 | 0.6.1; revisão humana |
| Logo do estúdio | `public/bad-decision-games/logo.webp` + `.png` | 600×307 | ok |
| Preview landscape | `store/video/bricklike-preview.mp4` | 1920×1080, 19,1 s, H.264 | 0.6.1; revisão humana |
| Preview portrait | `store/video/bricklike-preview-portrait.mp4` | 1080×1620, 19,1 s, H.264 | 0.6.1; revisão humana |

## itch.io

| Item | Requisito / campo | Status |
|---|---|---|
| Conta e projeto | Projeto HTML5 criado pelo usuário | pendente de revisão humana |
| Versão publicada | `0.8.0` atualizada manualmente | 0.8.0 publicado em 2026-11-27 |
| Upload 0.8.0 | ZIP bridge final + metadata revisada | publicado; assets antigos ainda da 0.6.1 |
| Embed | Mobile Friendly ligado; fullscreen; click-to-play | publicado |
| Título | Bricklike | publicado |
| Descrição | Curta + longa em inglês, 3 mundos/18 fases (19 com tutorial) e 69 ondas (71 com tutorial) | publicada; texto novo em `portal-metadata.md` |
| Controles | Campo de controles preenchido, incluindo touch | publicado; texto novo em `portal-metadata.md` |
| Tags | arcade, brick-breaker, roguelite, pixel-art, html5, mobile | publicado |
| Preço | Free + doação opcional; sem venda no embed HTML5 | publicado |
| Capa | 16:9 ou 2:3 aprovada | 0.6.1; revisão humana |
| Screenshots | 9 imagens, incluindo Workshop/Tier 4 | 0.6.1; revisão humana |
| Ads | Nenhum ad interno no itch.io; não prometer ads na página | publicado |
| Publicação | Usuário clica em publicar após aprovação | 0.8.0 publicado |

## GameFlare

| Item | Requisito / campo | Status |
|---|---|---|
| Conta e projeto | Projeto criado pelo usuário | bloqueado por acesso |
| Upload | ZIP HTML5 ou link do build | pendente de desbloqueio; 0.8.0 não enviada |
| SDK | SDK opcional do GameFlare não é necessário | pendente de revisão humana |
| Título | Bricklike | pendente de revisão humana |
| Descrição | Curta + longa em inglês | pendente de revisão humana |
| Categoria | Arcade | pendente de revisão humana |
| Controles | Campo de controles preenchido | pendente de revisão humana |
| Tags | arcade, block breaker, roguelite, pixel art, html5 | pendente de revisão humana |
| Ads | Sem ads dentro do jogo; ads do portal ficam fora do jogo | pendente de revisão humana |
| Assets | Capa e screenshots aprovadas | 0.6.1; revisão humana |
| Publicação | Usuário envia para revisão após resolver o acesso | pendente |

## Playgama

| Item | Requisito / campo | Status |
|---|---|---|
| Conta e projeto | Projeto criado pelo usuário no Playgama | pendente de revisão humana |
| Versão publicada | `0.8.0` bridge no catálogo, fora do sandbox | publicado em 2026-11-27 |
| Upload | ZIP com `index.html`, config e Bridge 2.4.4 local na raiz | `0.8.0` publicado |
| Bridge | Config validado; sem logo/analytics; safe area ligada | ok nos gates |
| Eventos | `game_ready`, `level_started/paused/resumed/completed/failed` | pendente de revisão humana |
| Storage | `bb.save` v3 e `bb.settings` via Bridge; reload preserva | pendente de revisão humana |
| Aviso de storage | “Progress may not be saved” em memória/fallback | pendente de teste manual |
| Interstitial | Tutorial sem ads; campanha só com próxima onda e múltiplo de 3; Endless a cada 4; exits com cooldown de 60 s | implementado; validar no portal |
| Rewarded | Revive opcional 1x por run; recompensa só no estado `rewarded`; Second Chance coexiste | implementado; validar no portal |
| Áudio | Mudo durante ads/background; retoma após gesto | pendente de revisão humana |
| Título | Bricklike | pendente de revisão humana |
| Descrição | Curta + longa em inglês, Tier 4 + economia + Workshop + 20 ondas | pendente de revisão humana |
| Orientação | Portrait | pendente de revisão humana |
| Assets | Capa portrait **1080×1920** e screenshots aprovadas | 0.6.1; revisão humana |
| Review | Acompanhar a review do portal (~24 h) | pendente de revisão humana |
| Publicação | `0.8.0` publicada; próximas atualizações passam por auto-certificação | publicado em 2026-11-27 |

**Amostra do sandbox (0.4.0, pequena):** 17/100 qualifying plays; avg play time
5:42 vs meta 5:00; ad shows/play 1,70 vs meta 0,30; 116 launches, 31 plays,
5m45s, 3/2 likes. Não concluir qualidade/retenção com essa amostra.

## Y8.com

**Status em 2026-11-27:** `0.8.0` enviada; aguardando resposta do portal.

- [ ] ZIP **bridge** `release/blockbreaker-web.zip` (Y8 SDK encapsulado na Bridge).
- [ ] Standard Screenshot: 6 em `store/y8/standard/` (760×570, ≤2 MB).
- [ ] Widescreen Screenshot: 6 em `store/y8/widescreen/` (1280×720, ≤5 MB).
- [ ] Landscape Promo: 3 em `store/y8/landscape-promo/` (1920×1080, ≤5 MB).
- [ ] Portrait Promo: 3 em `store/y8/portrait-promo/` (1080×1920, ≤5 MB).
- [ ] Game Card Promo: 3 em `store/y8/game-card/` (760×570, ≤2 MB).
- [ ] Gameplay Video: `store/y8/video/bricklike-gameplay-y8-1280x720.mp4`
      (30 s contínuos, 1280×720, H.264, ~1,25 MB). **Não** use o preview
      editado de `store/video/`.
- [ ] Título/descrição/controles em inglês; confirmar os campos do painel Y8.
- [ ] Revalidar as dimensões e limites na data do upload.
- [ ] Spec de assets: [`docs/store-assets-spec.md`](../store-assets-spec.md).

## CrazyGames — Basic Launch

| Item | Requisito / campo | Status |
|---|---|---|
| Conta e projeto | Projeto criado pelo usuário | pendente de revisão humana |
| Tipo de submissão | **Basic Launch**, não Full Launch | pendente de revisão humana |
| Histórico | 0.3.0, 0.4.0, 0.5.1 e 0.8.0 reprovadas; a 0.8.0 não trouxe motivo específico | registrado |
| 0.8.0 clean | Sem Playgama Bridge nem SDK nativo do CG; browser storage; sem ads | enviada e recusada em 2026-11-27 |
| Feedback | Pedir ao Support/technical-support o requisito exato que falhou na 0.8.0 | pendente |
| Upload | `release/blockbreaker-web-clean.zip` | enviado; aguardando feedback |
| Capa 16:9 | 1920×1080, sem bordas/texto extra/logos | 0.6.1; revisão humana |
| Capa 2:3 | 800×1200, mesma linguagem visual | 0.6.1; revisão humana |
| Capa 1:1 | 800×800, mesma linguagem visual | 0.6.1; revisão humana |
| Preview video | MP4 15–20 s, gameplay real, 1920×1080 + 1080×1620 | 0.6.1; revisão humana |
| Descrição | Inglês, ≥ 100 palavras, 3 mundos/18 fases (19 com tutorial) e 69 ondas (71 com tutorial) | atualizada em `portal-metadata.md`; publicar |
| Controles | Campo de controles preenchido | atualizado em `portal-metadata.md`; publicar |
| Título | Bricklike | pendente de revisão humana |
| Ads | Desligados no Basic; jogo não trava esperando ad | implementado |
| Inglês | UI e metadata em inglês | ok |
| Mobile | Portrait mobile-friendly; testar em Chromebook/Android | pendente de teste humano |
| Desktop | HUD legível em 907×510 e 1920×1080; shell portrait intencional, sem letterbox | pendente de revisão humana |
| Onboarding | Tutorial in-game pulável + coach marks; caminho de skip | implementado; validar |
| Consistência | Capa, screenshots e blocos usam a mesma linguagem visual | 0.6.1; revisão humana |
| Qualidade | Sem artefatos, texto cortado, controles ambíguos ou áudio estourado | pendente de teste humano |
| Revalidação | Conferir regras atuais do Basic Launch | pendente de revisão humana |
| Full Launch | Fora do escopo deste ciclo | pendente de decisão |
| Publicação | Basic Launch não aprovado; pedir feedback antes de nova submissão | recusado em 2026-11-27 |

## Reenvio ao CrazyGames

Antes de reenviar, ler `docs/release/crazygames-review.md` e
`docs/research/crazygames-feedback.md`. A `0.8.0` clean foi recusada em
**2026-11-27**, sem motivo específico. Abrir um ticket no
Support/technical-support citando a submissão da 0.8.0 e pedir o requisito exato
que falhou. A mensagem deve listar:

- perks reworkadas: Momentum, Bombardier, Boss Slayer e Hot Streak;
- Tier 4: Overkill, Shield Bash e Conductor;
- 10 starters, 12 unlocks em quatro tiers, economia de Sparks e Workshop;
- save v3 com migração v1/v2→v3 e ofertas filtradas;
- tutorial in-game pulável com coach marks e gate do level 1;
- controles touch com edge assist e gate explícito do laser;
- bridge mantém a política de ads da 0.5.1 (o clean não exibe ads);
- campanha de 18 fases + tutorial, 71 ondas e 2.781 blocos;
- 447 testes unitários e 48 E2E verdes;
- ZIP **clean** sem Playgama Bridge nem SDK nativo do CrazyGames.

**Ainda pendente:** obter o motivo específico da recusa, testar em humano e
revisar capas/screenshots/vídeo antes de qualquer novo envio da `0.8.0` clean.

## Sequência manual — estado em 2026-11-28

1. [x] Testar a 0.8.0 manualmente, publicar no itch.io e na Playgama e enviar
   ao Y8.
2. [ ] Subir o bridge `0.8.1` no itch.io e na Playgama.
3. [ ] Testar o rewarded real na Playgama: revive concedido e nenhum ad novo no
   Menu após o rewarded (60 s).
4. [ ] Revisar screenshots, capas e vídeos para a 0.8.1 (os atuais são da 0.6.1).
5. [ ] Publicar no GameFlare, se o acesso for desbloqueado.
6. [ ] CrazyGames: obter o motivo específico da recusa da `0.8.0` clean e decidir
   se há uma nova tentativa.
7. [ ] Registrar URLs, datas e status de cada portal.
8. [ ] Acompanhar o Basic Launch por 7 dias ou 500 plays antes de discutir Full
   Launch.
9. [ ] Só criar tag/release depois de aprovação humana.

**Nenhum passo desta sequência foi executado automaticamente.**
