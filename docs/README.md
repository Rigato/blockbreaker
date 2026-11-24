# docs — índice

Ponto de entrada para a próxima sessão. Apenas os documentos **atuais** ficam na
raiz de `docs/`; todo o histórico está em [`old/`](old/README.md) e não deve ser
usado como fonte de decisão.

## Comece por aqui

1. **[Handoff v0.7.1](handoff-v0.7.1.md)** — estado atual do jogo, arquitetura,
   invariantes, gates, riscos e o backlog completo para as mudanças profundas
   (densidade, progressão, público, perks).
2. **[GDD](GDD_Bricklike.md)** — design vigente (v1.13).
3. **[GAP do GDD](gdd-gap-analysis.md)** — implementado × pendente na `main`.
4. **[Mundos II/III — implementação](design/worlds-II-III-implementation.md)** —
   escopo, conteúdo, save v3, mapas e debug da linha 0.7.
5. **[Guia único de publicação](spec-tecnica-publicacao.md)** — estratégia,
   arquitetura de build único, requisitos de itch.io, GameFlare, Playgama e
   CrazyGames, ads, save, metadata, QA e release.
6. **[Perks e metaprogressão](perks-e-metaprogressao.md)** — catálogo de 22
   perks, Tier 4, economia de Sparks e meta horizontal.
7. **[Proposta — rework e expansão de perks](design/perks-rework-v0.7.md)** —
   26 perks, 8 starters + 18 unlocks, 4 adições, 2 substituições e 12 tunes;
   **proposta, nada implementado**.
8. **[Spec — mapa de seleção de fases](phase-select-map-spec.md)** — rework do
   mapa + parallax e expansão multi-mundo; **implementado**, gates verdes.
   Backup do estado anterior em [`design/phase-select-map-backup-v1.md`](design/phase-select-map-backup-v1.md).
9. **[Overhaul — direções e próximos passos](design/overhaul-direcoes.md)** —
   tutorial novo implementado; pierce, densidade, progressão e público
   registrados para decisão. Nada além do tutorial está implementado.

## Operação e release

- [Build e release](build-release.md) — comandos, ZIP, Bridge, ads QA e tag.
- [Metadata de portal](release/portal-metadata.md) — textos em inglês.
- [Checklist de submissão](release/submission-checklist.md) — passo a passo.
- [Status de publicação](release/status.md) — versões, portais e pendências.
- [Diagnóstico CrazyGames](release/crazygames-review.md) — reprovações, pausa
  até 2026-11-26 e decisão sobre desktop.
- [Índice do pacote de release](release/README.md).

## QA

- [Playtest kit](qa/playtest-kit.md) — protocolo para tutorial, campanha 1–6 e
  Endless.
- [Template de run](qa/run-log-template.csv).
- [Teste de performance em hardware baixo](qa/performance-testing.md) — Chrome/Edge,
  Chromebook 4 GB, iframes, CPU 4×/6×, heap/GC, Lighthouse e critérios.
- [Script de smoke de performance](../scripts/perf-smoke.mjs) — Playwright + CDP
  opcional, sem alterar `package.json`.

## Research

- [Feedback da CrazyGames](research/crazygames-feedback.md) — canais, QA tool,
  causas prováveis e rascunho de suporte em inglês.
- [Políticas e métricas da Playgama](research/playgama-policy-and-metrics.md) —
  teste manual × automação/scraping e leitura do sandbox.

## Assets

- `bad-decision-games-logo/` — fontes originais da logomarca do estúdio.
- Assets usados pelo jogo: `../public/bad-decision-games/` e
  `../public/how-to-play/`.
- Assets de loja: `../store/` — regenerados da 0.6.1; revisão humana pendente
  antes de qualquer upload.

## Histórico

Todo o material abaixo é histórico e não substitui os documentos acima.

- [Índice do arquivo](old/README.md).
- `old/handoffs/` — handoffs v0.3.0, v0.4.0, v0.5.0, v0.5.1 e v0.6.0.
- `old/plans/` — planos MVP, v0.2.0, Endless, revisão visual v0.4.0,
  metaprogressão v0.6.0 e plano de baixa fricção (absorvido pelo guia único).
- `old/qa/` — relatórios de QA, device matrix, performance e baseline do MVP.
- `old/release/` — revisão G7 e validação técnica do pacote `0.1.0-mvp`.
