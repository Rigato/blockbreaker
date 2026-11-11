# Submission checklist — Bricklike

**Versão em desenvolvimento:** `0.5.0` (em main para teste; sem upload).  
**Build publicado:** `0.4.0` no itch.io e no sandbox da Playgama.  
**Status global:** pendente de teste humano, push e assets da 0.5.0.  
**Quem submete:** o usuário, manualmente, em cada portal. Nenhum upload, tag ou
release pública da 0.5.0 foi feito por este trabalho.

Revalidar as regras de cada portal **na data da submissão**; elas mudam com
frequência. O checklist registra o pacote atual e o aprendizado das submissões
(Playgama sandbox, CrazyGames com 0.3.0 e 0.4.0 reprovadas, GameFlare bloqueado
por acesso).

## Pré-requisitos comuns

- [ ] Teste humano da 0.5.0 concluído: tutorial completo, skip, coach marks,
      fase 1 com 2 ondas, edge assist no celular, laser bloqueado até o
      lançamento, ads mock, save antigo e aviso de storage. **Pendente.**
- [ ] ZIP final 0.5.0 gerado pelo pipeline de release, com `index.html` e
      `playgama-bridge-config.json` na raiz e Bridge local
      (`./playgama-bridge.js`, sem request ao CDN da Playgama). **Pendente de
      teste final.**
- [ ] ZIP aberto em aba anônima, servido em subpasta, sem 404 e sem requests
      externas no boot. **Pendente de revisão humana.**
- [ ] Título, descrição curta, descrição longa e controles revisados em
      `docs/release/portal-metadata.md` para tutorial + 6 níveis/20 ondas
      (22 com tutorial). **Pendente de revisão humana.**
- [ ] Três capas revisadas e aprovadas em `store/covers/`. **Pendente; assets
      atuais são os da 0.4.0.**
- [ ] Screenshots, capas e vídeos **regerados a partir da 0.5.0** (tutorial,
      fase 1 com 2 ondas, controles touch). **Pendente; nada foi atualizado
      nesta rodada.**
- [x] How to Play (5 páginas) e About Us (logomarca Bad Decision Games)
      revisados na 0.4.0; revalidar se o tutorial mudou a primeira impressão.
- [ ] Nome **Bricklike** consistente em todos os portais. **Pendente de revisão
      humana.**
- [x] Leitura em **907×510**, **1216×684**, **1280×720**, **800×450** e
      **1920×1080** além de 320×568 e 390×844 (HUD compacto ≤440 px).
- [x] Tutorial in-game pulável com gate do level 1, coach marks e skip.
- [ ] Menu leva ao gameplay em Campaign → card → Play (2 cliques). Para o Full
      Launch da CrazyGames seria necessário 1 clique/entrada direta.
      **Pendente de decisão.**
- [x] Gates: 289 testes unitários em 28 arquivos; 29 E2E em 9 spec files;
      conteúdo com 7 níveis/22 ondas/775 blocos/1.832 XP.

## Assets compartilhados

| Asset | Caminho | Spec | Status |
|---|---|---|---|
| Capa 16:9 | `store/covers/cover-landscape-1920x1080.png` | 1920×1080 PNG | 0.4.0; regerar para 0.5.0 |
| Capa 2:3 | `store/covers/cover-portrait-800x1200.png` | 800×1200 PNG | 0.4.0; regerar para 0.5.0 |
| Capa portrait Playgama | `store/covers/cover-portrait-1080x1920.png` | 1080×1920 PNG | 0.4.0; regerar para 0.5.0 |
| Capa 1:1 | `store/covers/cover-square-800x800.png` | 800×800 PNG | 0.4.0; regerar para 0.5.0 |
| Contact sheet | `store/covers/cover-contact-sheet.png` | revisão interna | 0.4.0; regerar |
| Menu | `store/screenshots/01-menu-390x844.png` | 390×844 PNG | 0.4.0; regerar (novo card de tutorial) |
| Gameplay inicial | `store/screenshots/02-gameplay-early-390x844.png` | 390×844 PNG | 0.4.0; regerar |
| Laser + multiball | `store/screenshots/03-gameplay-laser-multiball-390x844.png` | 390×844 PNG | 0.4.0; regerar |
| Level-up | `store/screenshots/04-levelup-three-cards-390x844.png` | 390×844 PNG | 0.4.0; regerar |
| Victory/results | `store/screenshots/05-results-victory-390x844.png` | 390×844 PNG | 0.4.0; regerar |
| Special blocks | `store/screenshots/06-special-blocks-390x844.png` | 390×844 PNG | 0.4.0; regerar |
| Boss | `store/screenshots/07-boss-frost-sentinel-390x844.png` | 390×844 PNG | 0.4.0; regerar |
| Endless | `store/screenshots/08-endless-wave-1-390x844.png` | 390×844 PNG | 0.4.0; regerar |
| Tutorial / coach mark | novo screenshot sugerido | 390×844 PNG | **pendente; não existe** |
| How to Play | `public/how-to-play/*.png` | 390×844 PNG ×5 | 0.4.0; revisar |
| Logo do estúdio | `public/bad-decision-games/logo.webp` + `.png` | 600×307 | ok |
| Preview landscape | `store/video/bricklike-preview.mp4` | 1920×1080, 18,1 s, H.264 | 0.4.0; regerar para 0.5.0 |
| Preview portrait | `store/video/bricklike-preview-portrait.mp4` | 1080×1620, 18,1 s, H.264 | 0.4.0; regerar para 0.5.0 |

## itch.io

| Item | Requisito / campo | Status |
|---|---|---|
| Conta e projeto | Projeto HTML5 criado pelo usuário | pendente de revisão humana |
| Versão publicada | `0.4.0` atualizada manualmente; 0.5.0 local | 0.4.0 publicado |
| Upload 0.5.0 | ZIP HTML5 final + assets novos | pendente de teste humano |
| Embed | Mobile Friendly ligado; fullscreen; click-to-play | pendente de revisão humana |
| Título | Bricklike | pendente de revisão humana |
| Descrição | Curta + longa em inglês, tutorial + 20 ondas | pendente de revisão humana |
| Controles | Campo de controles preenchido, incluindo touch | pendente de revisão humana |
| Tags | arcade, brick-breaker, roguelite, pixel-art, html5, mobile | pendente de revisão humana |
| Preço | Free + doação opcional; sem venda no embed HTML5 | pendente de revisão humana |
| Capa | 16:9 ou 2:3 aprovada | pendente; asset 0.4.0 |
| Screenshots | 8 imagens + tutorial | pendente; assets 0.4.0 |
| Ads | Nenhum ad interno no itch.io; não prometer ads na página | pendente de revisão humana |
| Publicação | Usuário clica em publicar após aprovação | pendente |

## GameFlare

| Item | Requisito / campo | Status |
|---|---|---|
| Conta e projeto | Projeto criado pelo usuário | bloqueado por acesso |
| Upload | ZIP HTML5 ou link do build | pendente de desbloqueio |
| SDK | SDK opcional do GameFlare não é necessário | pendente de revisão humana |
| Título | Bricklike | pendente de revisão humana |
| Descrição | Curta + longa em inglês | pendente de revisão humana |
| Categoria | Arcade | pendente de revisão humana |
| Controles | Campo de controles preenchido | pendente de revisão humana |
| Tags | arcade, block breaker, roguelite, pixel art, html5 | pendente de revisão humana |
| Ads | Sem ads dentro do jogo; ads do portal ficam fora do jogo | pendente de revisão humana |
| Assets | Capa e screenshots aprovadas | pendente; assets 0.4.0 |
| Publicação | Usuário envia para revisão após resolver o acesso | pendente |

## Playgama

| Item | Requisito / campo | Status |
|---|---|---|
| Conta e projeto | Projeto criado pelo usuário no Playgama | pendente de revisão humana |
| Versão no sandbox | `0.4.0` enviada manualmente; 0.5.0 local | 0.4.0 sandbox |
| Upload | ZIP com `index.html`, config e Bridge local na raiz | pendente de teste humano |
| Bridge | Config validado; sem logo/analytics; safe area ligada | ok nos gates |
| Eventos | `game_ready`, `level_started/paused/resumed/completed/failed` | pendente de revisão humana |
| Storage | `bb.save` e `bb.settings` via Bridge; reload preserva | pendente de revisão humana |
| Aviso de storage | “Progress may not be saved” em memória/fallback | pendente de teste manual |
| Interstitial | Tutorial sem ads; campanha só com próxima onda e múltiplo de 3; Endless a cada 4; exits com cooldown de 60 s | implementado; validar no portal |
| Rewarded | Revive opcional 1x por run; recompensa só no estado `rewarded`; Second Chance coexiste | implementado; validar no portal |
| Áudio | Mudo durante ads/background; retoma após gesto | pendente de revisão humana |
| Título | Bricklike | pendente de revisão humana |
| Descrição | Curta + longa em inglês, tutorial + 20 ondas | pendente de revisão humana |
| Orientação | Portrait | pendente de revisão humana |
| Assets | Capa portrait **1080×1920** e screenshots aprovadas | pendente; assets 0.4.0 |
| Review | Acompanhar a review do portal (~24 h) | pendente de revisão humana |
| Publicação | Usuário submete e acompanha o status | pendente |

**Amostra do sandbox (0.4.0, pequena):** 17/100 qualifying plays; avg play time
5:42 vs meta 5:00; ad shows/play 1,70 vs meta 0,30; 116 launches, 31 plays,
5m45s, 3/2 likes. Não concluir qualidade/retenção com essa amostra.

## CrazyGames — Basic Launch

| Item | Requisito / campo | Status |
|---|---|---|
| Conta e projeto | Projeto criado pelo usuário | pendente de revisão humana |
| Tipo de submissão | **Basic Launch**, não Full Launch | pendente de revisão humana |
| Histórico | 0.3.0 e 0.4.0 reprovadas com a mesma mensagem genérica | registrado |
| Fluxo de reenvio | **Nova submissão** (não update); 0.5.0 é a próxima tentativa | pendente |
| Feedback | Pedir detalhes no Support/technical-support antes de reenviar | pendente |
| Upload | ZIP HTML5 final da 0.5.0 | pendente de teste humano |
| Capa 16:9 | 1920×1080, sem bordas/texto extra/logos | pendente; asset 0.4.0 |
| Capa 2:3 | 800×1200, mesma linguagem visual | pendente; asset 0.4.0 |
| Capa 1:1 | 800×800, mesma linguagem visual | pendente; asset 0.4.0 |
| Preview video | MP4 15–20 s, gameplay real, 1920×1080 + 1080×1620 | pendente; asset 0.4.0 |
| Descrição | Inglês, ≥ 100 palavras, tutorial + 6 níveis/20 ondas | pendente de revisão humana |
| Controles | Campo de controles preenchido | pendente de revisão humana |
| Título | Bricklike | pendente de revisão humana |
| Ads | Desligados no Basic; jogo não trava esperando ad | implementado |
| Inglês | UI e metadata em inglês | ok |
| Mobile | Portrait mobile-friendly; testar em Chromebook/Android | pendente de teste humano |
| Desktop | HUD legível em 907×510 e 1920×1080; shell portrait intencional, sem letterbox | pendente de revisão humana |
| Onboarding | Tutorial in-game pulável + coach marks; caminho de skip | implementado; validar |
| Consistência | Capa, screenshots e blocos usam a mesma linguagem visual | pendente; assets 0.4.0 |
| Qualidade | Sem artefatos, texto cortado, controles ambíguos ou áudio estourado | pendente de teste humano |
| Revalidação | Conferir regras atuais do Basic Launch | pendente de revisão humana |
| Full Launch | Fora do escopo deste ciclo | pendente de decisão |
| Publicação | Usuário submete e acompanha 7 dias/500 plays se aprovado | pendente |

## Reenvio ao CrazyGames

Antes de reenviar, ler `docs/release/crazygames-review.md` e
`docs/research/crazygames-feedback.md`. A 0.4.0 foi recusada de novo com a mesma
mensagem genérica; o FAQ só aceita reenvio se houver melhoria clara. A mensagem
deve listar:

- tutorial in-game pulável com coach marks e gate do level 1;
- controles touch com edge assist e gate explícito do laser;
- nova política de ads (tutorial sem ads; campanha só em onda múltipla de 3 com
  próxima onda; exits com cooldown de 60 s);
- aviso de storage em fallback/memória;
- campanha de 20 ondas (22 com tutorial) e 7 cards;
- 289 testes unitários e 29 E2E verdes;
- assets regenerados a partir da 0.5.0 (quando prontos).

**Ainda pendente:** pedir detalhes no Support, testar em humano e regerar
capas/screenshots/vídeo.

## Sequência manual acordada

1. Testar a 0.5.0 manualmente e validar o ZIP final.
2. Regerar screenshots, capas e vídeos a partir da 0.5.0.
3. Publicar no itch.io.
4. Publicar no GameFlare, se o acesso for desbloqueado.
5. Submeter ao Playgama.
6. Pedir feedback à CrazyGames e submeter a 0.5.0 como Basic Launch.
7. Registrar URLs, datas e status de cada portal.
8. Acompanhar o Basic Launch por 7 dias ou 500 plays antes de discutir Full
   Launch.
9. Só criar tag/release depois de aprovação humana.

**Nenhum passo desta sequência foi executado automaticamente.**
