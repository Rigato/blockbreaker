# docs — índice

Ponto de entrada para a próxima sessão. Os documentos abaixo são a fonte atual;
o histórico fica em `docs/old/` e no handoff arquivado da v0.4.0.

## Comece por aqui

1. **[Handoff v0.5.0](handoff-v0.5.0.md)** — estado do jogo, tutorial,
   arquitetura, invariantes, gates, portais, riscos e próximos passos.
2. **[GDD](GDD_Bricklike.md)** — design vigente (v1.5).
3. **[GAP do GDD](gdd-gap-analysis.md)** — implementado × pendente.
4. **[Spec técnica de publicação](spec-tecnica-publicacao.md)** — requisitos de
   itch.io, GameFlare, Playgama e CrazyGames.
5. **[Plano de baixa fricção](plano-baixa-fricao.md)** — estratégia de
   distribuição e expectativa de receita.

## Operação e release

- [Build e release](build-release.md) — comandos, ZIP, Bridge, ads QA e tag.
- [Metadata de portal](release/portal-metadata.md) — textos em inglês.
- [Checklist de submissão](release/submission-checklist.md) — passo a passo.
- [Status de publicação](release/status.md) — versões, portais e pendências.
- [Diagnóstico CrazyGames](release/crazygames-review.md) — duas reprovações da
  0.4.0, decisão sobre desktop e plano da 0.5.0.
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
- Assets de loja: `../store/` — **ainda são os da 0.4.0** e precisam ser
  regerados antes da submissão da 0.5.0.

## Histórico

- [Handoff v0.4.0](handoff-v0.4.0.md) — onboarding anterior, mantido como
  referência histórica.
- [Arquivo `old/`](old/README.md) — handoffs, planos, QA e release do MVP.
  Não usar como fonte atual.
