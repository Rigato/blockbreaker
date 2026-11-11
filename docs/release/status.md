# Status de publicação — Bricklike

Versão publicada: **`0.5.1`** no **itch.io** e no **sandbox da Playgama**  
CrazyGames: **`0.5.1` submetida** em 2026-11-11; aguardando review  
Atualizado em: 2026-11-11  
Responsável pela submissão: **usuário (manual)**

Este arquivo é o registro de publicação. O `0.1.0-mvp` foi a primeira versão
publicada no itch.io; ele foi substituído manualmente pela `0.5.1`. A `0.5.1`
também está no sandbox da Playgama e foi submetida ao CrazyGames em 2026-11-11.
Nenhuma tag ou GitHub Release foi criada.

## Estado em 2026-11-11

- **itch.io:** `0.5.1` publicada manualmente. A `0.1.0-mvp` fica apenas como
  histórico.
- **Playgama:** `0.5.1` no **sandbox**; precisa cumprir milestones de
  retenção/qualidade antes da publicação no catálogo.
- **CrazyGames:** a `0.3.0` foi **reprovada** por “abaixo dos padrões de
  qualidade”. A `0.4.0` foi reenviada como nova submissão e **reprovada de novo
  com a mesma mensagem genérica**, sem detalhamento. A `0.5.1` foi submetida em
  2026-11-11 e está **aguardando review**; diagnóstico e
  canais de suporte em [`crazygames-review.md`](crazygames-review.md) e
  [`../research/crazygames-feedback.md`](../research/crazygames-feedback.md).
- **Orientação:** o formulário do CrazyGames só permite configurar **Mobile
  orientation**; o Bricklike está como **PORTRAIT**. O desktop é assumido
  landscape pelo portal. Não existe campo para declarar portrait no PC.
- **GameFlare:** conta criada, mas acesso bloqueado; suporte acionado e **sem
  resposta**. A `0.5.1` não foi publicada lá.
- **GitHub Pages:** acompanha a `main`; a `0.5.1` já aparece no build de review.
- **ZIP 0.5.1:** local, 20 arquivos, 1.508.491 bytes (~1.481 KiB), SHA-256
  atual `f63d19341492aaa3b2378d262baac87f103e71daf00ec674972e531f832209ce`
  (pode mudar no build final).

## O que a 0.5.1 entrega

- **Tutorial** jogável e pulável: fase 0 `tutorial`, 2 ondas (`tutw1`,
  `tutw2`), 16 blocos, 32 XP e 2 level ups.
- **Gate do level 1** em save novo (`unlockedPhase` 0..6; 0 = tutorial);
  saves antigos com `unlockedPhase >= 1` continuam válidos.
- **Skip tutorial** conclui a fase e libera o level 1; coach marks de
  mover/lançar, XP/perk, blocos especiais, chefes e Endless.
- **Campanha** com 6 fases e **20 ondas** (2/3/3/3/4/5); com tutorial, **7 cards
  e 22 ondas**. Totais: **743 blocos / 1.809 XP**; campanha pura: **727 / 1.777**.
- **Controles touch** com drag relativo 1:1 no centro e ganho progressivo até
  2,2× na zona externa de 22%; mouse absoluto e teclado inalterados; limite de
  velocidade do paddle igual.
- **Laser** exige lançamento explícito na onda; reset bloqueia até o jogador
  lançar; HUD mostra “Launch the ball first”.
- **Ads** novas: tutorial sem ads; campanha só com próxima onda e múltiplo de 3
  (fase 5 após onda 3, fase 6 após onda 3); Endless a cada 4; exits com cooldown
  de 60 s; rewarded revive 1x/run; Second Chance + rewarded coexistem.
- **Aviso de storage** “Progress may not be saved” quando o diagnóstico cai em
  memória/fallback.
- **Bridge local** no boot (`./playgama-bridge.js`), sem request ao CDN da
  Playgama; o adapter nativo do CrazyGames ainda carrega o SDK do portal quando
  detecta o host.

## Gates da 0.5.1

| Gate | Resultado |
|---|---|
| `npm run typecheck` | ✅ sem erros |
| `npm test` | ✅ 329 testes em 29 arquivos |
| `npm run validate:content` | ✅ 7 níveis, 22 ondas, 743 blocos, 1.809 XP |
| Bridge config | ✅ schema 2.4.1, sem logo/analytics, sem URLs externas |
| `npm run test:e2e` | ✅ 31 testes em 9 spec files |
| `npm run build` | ✅ |
| `npm run package` | ✅ 20 arquivos, 1.508.491 bytes, SHA acima |
| CI + Deploy | pendente de push |

## Playgama sandbox — amostra pequena

Números do sandbox da 0.4.0, registrados sem conclusão de qualidade/retenção:

- **17/100 qualifying plays**.
- Avg play time **5:42** contra meta **5:00**.
- Ad shows/play **1,70** contra meta **0,30**.
- **116 launches**, **31 plays**, **5m45s**, **3/2 likes**.

A amostra é pequena demais para concluir qualidade ou retenção. A política de
ads da 0.5.1 deve ser medida novamente depois da publicação.

## Modo Endless

- Run infinita separada da campanha, com velocidade 660→1100, linhas 4→12 e
  chefes a cada 5 ondas.
- Save v1 guarda `endless: { bestWave, bestScore, runs }`.
- Desbloqueado ao concluir a campanha (fase 6); o tutorial não conta.
- Publicado na `0.4.0` do itch.io e no sandbox da Playgama.

## Portais

| Portal | Versão | Status | URL pública | Data | Observação |
|---|---|---|---|---|---|
| itch.io | **0.5.1** | **publicado** | — | 2026-11-11 | atualização manual; `0.1.0-mvp` histórica |
| Playgama | **0.5.1** | **sandbox** | — | 2026-11-11 | milestones pendentes; amostra pequena |
| CrazyGames Basic | 0.3.0 e 0.4.0 (reprovadas) / 0.5.1 | **submetida** | — | 2026-11-11 | aguardando review; reenvio como nova submissão |
| GameFlare | 0.5.1 (não publicada) | **bloqueado** | — | — | sem resposta do suporte sobre login |

### CrazyGames — como pedir detalhes e reenviar

Fonte: <https://docs.crazygames.com/faq/> e
[`../research/crazygames-feedback.md`](../research/crazygames-feedback.md).

- A `0.4.0` foi reenviada como **nova submissão** e recusada novamente com a
  mesma mensagem genérica. Não há relatório público de QA; o caminho é o
  **Support do Developer Portal** (<https://developer.crazygames.com/support>)
  ou **technical-support@crazygames.com**.
- Pedir confirmação se a reprovação foi da **QA inicial** ou de um **Basic
  Launch**, e quais requisitos falharam; incluir game ID/submission ID, build e
  data.
- O dono decidiu **não fazer moldura/letterbox desktop**. A próxima tentativa é
  a `0.5.1`, com tutorial in-game, controles mobile e política de ads.
- Só reenviar depois de teste humano e de regerar capas, screenshots e vídeo a
  partir da 0.5.1. Os assets foram gerados na sessão paralela; revisão humana pendente.
- Não criar conta duplicada nem abrir tickets repetidos.

## Checklist rápido pós-upload

- [ ] Teste humano da 0.5.1 concluído (tutorial/skip, edge assist, laser, ads
      mock, save antigo, aviso de storage).
- [ ] ZIP 0.5.1 conferido contra `release/manifest.json` e hash registrado.
- [ ] Screenshots/capas/vídeos da 0.5.1 revisados e aprovados.
- [ ] Título **Bricklike** consistente.
- [ ] Descrição, controles e tags revisados para tutorial + 20 ondas.
- [x] Publicar 0.5.1 no itch.io e no sandbox da Playgama.
- [x] Reenviar a 0.5.1 ao CrazyGames como nova submissão.
- [ ] Acompanhar o review da 0.5.1 no CrazyGames.
- [ ] Resolver GameFlare com o suporte.
- [ ] Acompanhar milestones da Playgama com amostra maior.
- [ ] Nenhum portal recebeu URL com `?debug=1` ou `?resetSave=1`.
- [ ] Testar 907×510 e 1920×1080 além do mobile.
- [ ] Revive rewarded e interstitials testados em ambiente real de portal.

## Acompanhamento pós-launch

- Registrar plays/feedback aos 7 dias.
- CrazyGames Basic: avaliar 7 dias/500 plays se for aprovado.
- Não iniciar Full Launch, Poki, GameDistribution ou Famobi sem decisão.
- Revalidar regras dos portais antes de cada novo upload.
- Só criar tag/release depois de aprovação humana.
