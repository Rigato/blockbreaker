# Status de publicação — Bricklike

Versão atual: **`0.4.0`**  
Publicada manualmente em: **itch.io** e **Playgama (sandbox)**  
Atualizado em: 2026-11-10  
Responsável pela submissão: **usuário (manual)**

Este arquivo é o registro de publicação. O `0.1.0-mvp` foi a primeira versão
publicada no itch.io; ele foi substituído manualmente pela `0.4.0`. A `0.4.0`
também está no sandbox da Playgama. Nenhuma tag ou GitHub Release foi criada.

## Estado em 2026-11-10

- **itch.io:** `0.4.0` publicada manualmente. A `0.1.0-mvp` fica apenas como
  histórico.
- **Playgama:** `0.4.0` no **sandbox**; precisa cumprir milestones de
  retenção/qualidade antes da publicação no catálogo.
- **CrazyGames:** a `0.3.0` foi **reprovada** por “abaixo dos padrões de
  qualidade”. A `0.4.0` ainda **não foi submetida**. Pelo FAQ, jogo rejeitado
  deve ser reenviado como **nova submissão** (não como update); updates só se
  aplicam a jogo já publicado. Diagnóstico em
  [`crazygames-review.md`](crazygames-review.md).
- **GameFlare:** conta criada, mas acesso bloqueado; suporte acionado em
  2026-11-10 e **sem resposta**. A `0.4.0` não foi publicada lá.

## P0/P1 entregue na 0.4.0

- Blocos redesenhados, menu Campaign/Endless, seleção de fases temática.
- HUD compacto e legível em 907×510, 800×450, 1216×684, 1280×720 e 1920×1080.
- **How to Play** com 5 páginas e screenshots localizados 5:3.
- **About Us** com a logomarca Bad Decision Games.
- Ads: interstitial a cada 3 ondas na campanha, a cada 4 no Endless, na saída
  dos results (Next/Retry/Menu) e rewarded revive 1x por run.
- Settings de som, música e screen shake; save `campaignComplete`.
- 8 screenshots de loja, capas e vídeos de 18,1 s atualizados.
- 280 testes unitários e 24 testes E2E verdes.

## Modo Endless

- Run infinita separada da campanha, com velocidade 660→1100, linhas 4→12 e
  chefes a cada 5 ondas.
- Save v1 guarda `endless: { bestWave, bestScore, runs }`.
- Desbloqueado ao concluir a campanha (fase 6).
- Publicado na `0.4.0` do itch.io e no sandbox da Playgama.

## Portais

| Portal | Versão | Status | URL pública | Data | Observação |
|---|---|---|---|---|---|
| itch.io | **0.4.0** | **publicado** | — | 2026-11-10 | atualização manual; `0.1.0-mvp` histórica |
| Playgama | **0.4.0** | **sandbox** | — | 2026-11-10 | milestones de retenção/qualidade pendentes |
| CrazyGames Basic | 0.3.0 (rejeitada) / 0.4.0 pronta | **não submetida** | — | — | reenviar como **nova submissão** após revisão humana |
| GameFlare | 0.4.0 pronta | **bloqueado** | — | — | sem resposta do suporte sobre login |

### CrazyGames — como reenviar

Fonte: <https://docs.crazygames.com/faq/> (2026-11-10).

- **Jogo rejeitado:** reenviar como **nova submissão** (“submit as a new
  submission”), com melhorias claras. Não é o fluxo de “update” de jogo já
  publicado.
- **Jogo já publicado:** atualizar pelo Developer Portal, enviando os arquivos
  novos para aprovação.
- Portanto, para a `0.4.0`: usar **Submit a game** novamente, com a build,
  metadata, 3 capas e vídeo atuais. Se o portal bloquear por já existir um
  registro, abrir suporte em <https://developer.crazygames.com/support>.
- Não criar conta duplicada sem orientação do suporte.

## Checklist rápido pós-upload

- [x] ZIP 0.4.0 é o mesmo no itch.io e na Playgama.
- [x] Título **Bricklike** consistente.
- [x] Descrição, controles e tags revisados.
- [x] Capas e vídeos atualizados.
- [ ] Reenviar à CrazyGames como nova submissão.
- [ ] Resolver GameFlare com o suporte.
- [ ] Acompanhar milestones da Playgama.
- [ ] Nenhum portal recebeu URL com `?debug=1` ou `?resetSave=1`.
- [ ] Teste em 907×510 e 1920×1080 além do mobile.
- [ ] Revive rewarded e interstitials testados em ambiente real de portal.

## Acompanhamento pós-launch

- Registrar plays/feedback aos 7 dias.
- CrazyGames Basic: avaliar 7 dias/500 plays se for aprovado.
- Não iniciar Full Launch, Poki, GameDistribution ou Famobi sem decisão.
- Revalidar regras dos portais antes de cada novo upload.
