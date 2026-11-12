# Submission checklist — Bricklike

**Versão em desenvolvimento:** `0.6.1` (**local; não publicada e não submetida**).  
**Versão publicada:** `0.5.1` no itch.io e no sandbox da Playgama.  
**CrazyGames:** `0.5.1` submetida em 2026-11-11; submissão pausada até 2026-11-26.  
**Status global:** 0.6.1 local; assets de loja ainda os da 0.5.1; revisão humana
pendente. Nenhuma tag ou GitHub Release foi criada.  
**Quem submete:** o usuário, manualmente, em cada portal.

Revalidar as regras de cada portal **na data da submissão**; elas mudam com
frequência. O checklist registra o pacote atual e o aprendizado das submissões
(Playgama sandbox, CrazyGames com 0.3.0 e 0.4.0 reprovadas, 0.5.1 submetida e
GameFlare bloqueado por acesso).

## Pré-requisitos comuns

- [ ] Teste humano da 0.6.1 concluído: Tier 4, economia/anti-farm, card do
      Workshop, HUD/results, migração de save v1→v2, tutorial, ads mock e
      layout de portal. **Pendente.**
- [ ] ZIP final 0.6.1 gerado pelo pipeline de release, com `index.html` e
      `playgama-bridge-config.json` na raiz e Bridge local
      (`./playgama-bridge.js`, sem request ao CDN da Playgama). **Gerado:
      20 arquivos, 1.517.384 bytes, SHA-256
      `e9aaa4ad57032279377f7f78f0f1f6c458de760a5e49aaa7ea7d6ff486bb170a`;
      falta teste final.**
- [ ] ZIP aberto em aba anônima, servido em subpasta, sem 404 e sem requests
      externas no boot. **Pendente de revisão humana.**
- [ ] Título, descrição curta, descrição longa e controles revisados em
      `docs/release/portal-metadata.md` para Tier 4 + economia de Sparks +
      Workshop + 6 níveis/20 ondas (22 com tutorial).
      **Pendente de revisão humana.**
- [ ] Capas revisadas e aprovadas em `store/covers/`. **Pendente; capas atuais
      são da 0.5.1.**
- [x] Screenshots, capas e vídeos **da 0.5.1** (tutorial, fase 1 com 2 ondas,
      controles touch, 7 cards, Frost Sentinel e Endless). **Revisão humana
      pendente; regeneração para a 0.6.1 ainda não feita.**
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
- [x] Gates da 0.6.1: 396 testes unitários em 32 arquivos; 37 E2E em 10 spec
      files; conteúdo com 7 níveis/22 ondas/743 blocos/1.809 XP.

## Assets compartilhados

| Asset | Caminho | Spec | Status |
|---|---|---|---|
| Capa 16:9 | `store/covers/cover-landscape-1920x1080.png` | 1920×1080 PNG | 0.5.1; revisão humana |
| Capa 2:3 | `store/covers/cover-portrait-800x1200.png` | 800×1200 PNG | 0.5.1; revisão humana |
| Capa portrait Playgama | `store/covers/cover-portrait-1080x1920.png` | 1080×1920 PNG | 0.5.1; revisão humana |
| Capa 1:1 | `store/covers/cover-square-800x800.png` | 800×800 PNG | 0.5.1; revisão humana |
| Contact sheet | `store/covers/cover-contact-sheet.png` | 1608×674, revisão interna | 0.5.1; revisão humana |
| Menu | `store/screenshots/01-menu-390x844.png` | 390×844 PNG | 0.5.1; tutorial + 7 nós |
| Tutorial / gameplay inicial | `store/screenshots/02-gameplay-early-390x844.png` | 390×844 PNG | 0.5.1; coach mark |
| Laser + multiball | `store/screenshots/03-gameplay-laser-multiball-390x844.png` | 390×844 PNG | 0.5.1 |
| Level-up | `store/screenshots/04-levelup-three-cards-390x844.png` | 390×844 PNG | 0.5.1 |
| Victory/results | `store/screenshots/05-results-victory-390x844.png` | 390×844 PNG | 0.5.1 |
| Special blocks | `store/screenshots/06-special-blocks-390x844.png` | 390×844 PNG | 0.5.1 |
| Boss | `store/screenshots/07-boss-frost-sentinel-390x844.png` | 390×844 PNG | 0.5.1 |
| Endless | `store/screenshots/08-endless-wave-1-390x844.png` | 390×844 PNG | 0.5.1 |
| How to Play | `public/how-to-play/*.png` | 780×468 PNG ×5 | 0.5.1; revisão humana |
| Logo do estúdio | `public/bad-decision-games/logo.webp` + `.png` | 600×307 | ok |
| Preview landscape | `store/video/bricklike-preview.mp4` | 1920×1080, 19,1 s, H.264 | 0.5.1; revisão humana |
| Preview portrait | `store/video/bricklike-preview-portrait.mp4` | 1080×1620, 19,1 s, H.264 | 0.5.1; revisão humana |

## itch.io

| Item | Requisito / campo | Status |
|---|---|---|
| Conta e projeto | Projeto HTML5 criado pelo usuário | pendente de revisão humana |
| Versão publicada | `0.5.1` atualizada manualmente; `0.6.1` local | 0.5.1 publicado |
| Upload 0.6.1 | ZIP HTML5 final + assets revisados | pendente de teste humano |
| Embed | Mobile Friendly ligado; fullscreen; click-to-play | pendente de revisão humana |
| Título | Bricklike | pendente de revisão humana |
| Descrição | Curta + longa em inglês, Tier 4 + economia + Workshop + 20 ondas | pendente de revisão humana |
| Controles | Campo de controles preenchido, incluindo touch | pendente de revisão humana |
| Tags | arcade, brick-breaker, roguelite, pixel-art, html5, mobile | pendente de revisão humana |
| Preço | Free + doação opcional; sem venda no embed HTML5 | pendente de revisão humana |
| Capa | 16:9 ou 2:3 aprovada | 0.5.1; revisão humana |
| Screenshots | 8 imagens + tutorial | 0.5.1; revisão humana |
| Ads | Nenhum ad interno no itch.io; não prometer ads na página | pendente de revisão humana |
| Publicação | Usuário clica em publicar após aprovação | 0.6.1 pendente |

## GameFlare

| Item | Requisito / campo | Status |
|---|---|---|
| Conta e projeto | Projeto criado pelo usuário | bloqueado por acesso |
| Upload | ZIP HTML5 ou link do build | pendente de desbloqueio; 0.6.1 não enviada |
| SDK | SDK opcional do GameFlare não é necessário | pendente de revisão humana |
| Título | Bricklike | pendente de revisão humana |
| Descrição | Curta + longa em inglês | pendente de revisão humana |
| Categoria | Arcade | pendente de revisão humana |
| Controles | Campo de controles preenchido | pendente de revisão humana |
| Tags | arcade, block breaker, roguelite, pixel art, html5 | pendente de revisão humana |
| Ads | Sem ads dentro do jogo; ads do portal ficam fora do jogo | pendente de revisão humana |
| Assets | Capa e screenshots aprovadas | 0.5.1; revisão humana |
| Publicação | Usuário envia para revisão após resolver o acesso | pendente |

## Playgama

| Item | Requisito / campo | Status |
|---|---|---|
| Conta e projeto | Projeto criado pelo usuário no Playgama | pendente de revisão humana |
| Versão no sandbox | `0.5.1` enviada manualmente; `0.6.1` local | 0.5.1 sandbox |
| Upload | ZIP com `index.html`, config e Bridge local na raiz | pendente de teste humano |
| Bridge | Config validado; sem logo/analytics; safe area ligada | ok nos gates |
| Eventos | `game_ready`, `level_started/paused/resumed/completed/failed` | pendente de revisão humana |
| Storage | `bb.save` v2 e `bb.settings` via Bridge; reload preserva | pendente de revisão humana |
| Aviso de storage | “Progress may not be saved” em memória/fallback | pendente de teste manual |
| Interstitial | Tutorial sem ads; campanha só com próxima onda e múltiplo de 3; Endless a cada 4; exits com cooldown de 60 s | implementado; validar no portal |
| Rewarded | Revive opcional 1x por run; recompensa só no estado `rewarded`; Second Chance coexiste | implementado; validar no portal |
| Áudio | Mudo durante ads/background; retoma após gesto | pendente de revisão humana |
| Título | Bricklike | pendente de revisão humana |
| Descrição | Curta + longa em inglês, Tier 4 + economia + Workshop + 20 ondas | pendente de revisão humana |
| Orientação | Portrait | pendente de revisão humana |
| Assets | Capa portrait **1080×1920** e screenshots aprovadas | 0.5.1; revisão humana |
| Review | Acompanhar a review do portal (~24 h) | pendente de revisão humana |
| Publicação | Usuário submete e acompanha o status | 0.6.1 pendente |

**Amostra do sandbox (0.4.0, pequena):** 17/100 qualifying plays; avg play time
5:42 vs meta 5:00; ad shows/play 1,70 vs meta 0,30; 116 launches, 31 plays,
5m45s, 3/2 likes. Não concluir qualidade/retenção com essa amostra.

## CrazyGames — Basic Launch

| Item | Requisito / campo | Status |
|---|---|---|
| Conta e projeto | Projeto criado pelo usuário | pendente de revisão humana |
| Tipo de submissão | **Basic Launch**, não Full Launch | pendente de revisão humana |
| Histórico | 0.3.0 e 0.4.0 reprovadas com a mesma mensagem genérica | registrado |
| 0.5.1 | Submetida em 2026-11-11 | submissão pausada até 2026-11-26 |
| 0.6.1 | Ainda não submetida; local | pendente de teste humano |
| Feedback | Pedir detalhes no Support/technical-support após 2026-11-26 | pendente |
| Upload | ZIP HTML5 final da 0.6.1 | pendente de teste humano |
| Capa 16:9 | 1920×1080, sem bordas/texto extra/logos | 0.5.1; revisão humana |
| Capa 2:3 | 800×1200, mesma linguagem visual | 0.5.1; revisão humana |
| Capa 1:1 | 800×800, mesma linguagem visual | 0.5.1; revisão humana |
| Preview video | MP4 15–20 s, gameplay real, 1920×1080 + 1080×1620 | 0.5.1; revisão humana |
| Descrição | Inglês, ≥ 100 palavras, Tier 4 + economia + Workshop + 20 ondas | pendente de revisão humana |
| Controles | Campo de controles preenchido | pendente de revisão humana |
| Título | Bricklike | pendente de revisão humana |
| Ads | Desligados no Basic; jogo não trava esperando ad | implementado |
| Inglês | UI e metadata em inglês | ok |
| Mobile | Portrait mobile-friendly; testar em Chromebook/Android | pendente de teste humano |
| Desktop | HUD legível em 907×510 e 1920×1080; shell portrait intencional, sem letterbox | pendente de revisão humana |
| Onboarding | Tutorial in-game pulável + coach marks; caminho de skip | implementado; validar |
| Consistência | Capa, screenshots e blocos usam a mesma linguagem visual | 0.5.1; revisão humana |
| Qualidade | Sem artefatos, texto cortado, controles ambíguos ou áudio estourado | pendente de teste humano |
| Revalidação | Conferir regras atuais do Basic Launch | pendente de revisão humana |
| Full Launch | Fora do escopo deste ciclo | pendente de decisão |
| Publicação | Usuário submete e acompanha 7 dias/500 plays se aprovado | pendente |

## Reenvio ao CrazyGames

Antes de reenviar, ler `docs/release/crazygames-review.md` e
`docs/research/crazygames-feedback.md`. A 0.4.0 foi recusada de novo com a mesma
mensagem genérica; o FAQ só aceita reenvio se houver melhoria clara. A
submissão está pausada até **2026-11-26**. A mensagem deve listar:

- perks reworkadas: Momentum, Bombardier, Boss Slayer e Hot Streak;
- Tier 4: Overkill, Shield Bash e Conductor;
- 10 starters, 12 unlocks em quatro tiers, economia de Sparks e Workshop;
- save v2 com migração v1→v2 e ofertas filtradas;
- tutorial in-game pulável com coach marks e gate do level 1;
- controles touch com edge assist e gate explícito do laser;
- política de ads mantida da 0.5.1;
- campanha de 20 ondas (22 com tutorial) e 7 cards;
- 396 testes unitários e 37 E2E verdes;
- assets revisados/regenerados para a 0.6.1.

**Ainda pendente:** aguardar 2026-11-26, testar em humano e revisar
capas/screenshots/vídeo.

## Sequência manual acordada

1. Testar a 0.6.1 manualmente e validar o ZIP final.
2. Revisar/regenerar screenshots, capas e vídeos para a 0.6.1.
3. Publicar a 0.6.1 no itch.io, se aprovada.
4. Publicar no GameFlare, se o acesso for desbloqueado.
5. Submeter ao Playgama.
6. Após 2026-11-26, pedir feedback à CrazyGames e decidir o reenvio da 0.6.1.
7. Registrar URLs, datas e status de cada portal.
8. Acompanhar o Basic Launch por 7 dias ou 500 plays antes de discutir Full
   Launch.
9. Só criar tag/release depois de aprovação humana.

**Nenhum passo desta sequência foi executado automaticamente.**
