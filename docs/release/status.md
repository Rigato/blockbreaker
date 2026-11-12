# Status de publicação — Bricklike

Versão publicada: **`0.5.1`** no **itch.io** e no **sandbox da Playgama**  
Versão em desenvolvimento: **`0.6.1`**, local e **não publicada**  
CrazyGames: **`0.5.1` submetida** em 2026-11-11; submissão **pausada até 2026-11-26**  
Atualizado em: 2026-11-12  
Responsável pela submissão: **usuário (manual)**

Este arquivo é o registro de publicação. O `0.1.0-mvp` foi a primeira versão
publicada no itch.io; ele foi substituído manualmente pela `0.5.1`. A `0.5.1`
também está no sandbox da Playgama e foi submetida ao CrazyGames em 2026-11-11.
A `0.6.1` está na linha atual de desenvolvimento, é **local e não foi enviada a
nenhum portal**. Nenhuma tag ou GitHub Release foi criada.

## Estado em 2026-11-12

- **itch.io:** `0.5.1` publicada manualmente. A `0.6.1` é local; a
  `0.1.0-mvp` fica apenas como histórico.
- **Playgama:** `0.5.1` no **sandbox**; precisa cumprir milestones de
  retenção/qualidade antes da publicação no catálogo. A `0.6.1` não foi enviada.
- **CrazyGames:** a `0.3.0` foi **reprovada** por “abaixo dos padrões de
  qualidade”. A `0.4.0` foi reenviada como nova submissão e **reprovada de novo
  com a mesma mensagem genérica**, sem detalhamento. A `0.5.1` foi submetida em
  2026-11-11; a submissão está **pausada/bloqueada até 2026-11-26**. Diagnóstico
  e canais de suporte em [`crazygames-review.md`](crazygames-review.md) e
  [`../research/crazygames-feedback.md`](../research/crazygames-feedback.md).
- **Orientação:** o formulário do CrazyGames só permite configurar **Mobile
  orientation**; o Bricklike está como **PORTRAIT**. O desktop é assumido
  landscape pelo portal. Não existe campo para declarar portrait no PC.
- **GameFlare:** conta criada, mas acesso bloqueado; suporte acionado e **sem
  resposta**. A `0.5.1` não foi publicada lá e a `0.6.1` não foi enviada.
- **GitHub Pages:** acompanha a `main`; a `0.6.1` aparece no build de review
  após o push desta fase.
- **ZIP 0.6.1:** local, 20 arquivos, 1.517.380 bytes (~1.482 KiB), SHA-256
  `b8ded968506b34c221f0ebb5744ad0d301208838c44617689df3c1bf438bbdbd`
  (pode mudar no build final; confirme em `release/manifest.json`).

## O que a 0.6.1 entrega

- **Tier 4:** Overkill (100 Sparks), Shield Bash (110) e Conductor (120,
  requer Prism Laser) levam o catálogo a **22 perks**: 10 starters e 12
  unlocks em quatro tiers.
- **Overkill:** o dano excedente de um hit direto vira splash de até 2 nos
  quatro vizinhos ortogonais; não encadeia e não nasce de explosão/link.
- **Shield Bash:** a cada 8 acertos no paddle, 1 de dano nas duas linhas mais
  baixas; a onda não dispara Overkill.
- **Conductor:** cada alvo do laser encadeia uma vez para um vizinho ainda não
  atingido, com 50% do dano (mínimo 1).
- **Economia de Sparks:** onda `1 + floor(blocos/12)`, combo +1 em 5/10/15
  (máx. +3 por onda), chefe +3, clear +6 e first clear +6 extra; teto de
  **250 por run**.
- **Anti-farm:** onda/combo/chefe pagam no máximo uma vez por onda por run;
  reiniciar uma onda já premiada suprime essas recompensas na tentativa nova.
- **HUD:** chip de Sparks da run com pulso e toast `+N Sparks · motivo`.
- **Results:** `+X Sparks · total Y` com breakdown por waves, bosses, clear,
  first clear e combo.
- **Workshop:** card de progressão com ícone, saldo, badge **Ready**,
  `X / 22 unlocked`, `N left` e barra; diálogo com quatro tiers e 12 cards.
- **Save v2 inalterado:** nenhum campo novo; ofertas continuam filtrando perks
  bloqueadas; sem bônus permanentes, ads por Sparks, loot box ou compra de
  vantagem.
- **Gates:** 396 testes em 32 arquivos; 37 E2E em 10 spec files; ZIP 0.6.1 com
  20 arquivos e 1.517.380 bytes.

### O que a 0.6.0 entregou (build anterior)

- **Perks reworkadas:** Momentum, Bombardier, Boss Slayer e Hot Streak
  substituem Combo Master, Bomb Ball, Boss Bane e Swift Ball.
- **Pool inicial de 10 perks:** Multiball, Wide Paddle, Power Ball, Quick Study,
  Arcane Turret, Giant Ball, Safety Net, Prism Laser, Foresight e Critical
  Strike.
- **9 unlocks:** Second Chance (12), Explosive Core (15), Sticky Paddle (18),
  Momentum (35), Bombardier (40), Boss Slayer (45), Laser Focus (65),
  Overcharge (65) e Hot Streak (75).
- **Sparks:** +1 por onda, +3 por chefe e +5 na primeira conclusão de fase,
  com teto de 30 por run; Endless com +1 por onda e +3 a cada 5 ondas.
- **Workshop:** strip no menu, cards por tier, compra, saldo, badge e feedback;
  a compra persiste e atualiza o menu.
- **Save v2:** `meta: { sparks, unlocks }`; saves v1 migram sem perder
  progresso de campanha ou Endless.
- **Ofertas:** perks bloqueadas nunca aparecem; as compradas entram na pool.
- **Results:** `+X Sparks · total Y`.
- **Sem poder permanente:** o meta desbloqueia perks, não atributos; sem ads,
  loot box ou compra de vantagem.

### O que a 0.5.1 entrega (build publicada)

- **Tutorial** jogável e pulável: fase 0 `tutorial`, 2 ondas (`tutw1`,
  `tutw2`), 16 blocos, 32 XP e 2 level ups.
- **Gate do level 1** em save novo (`unlockedPhase` 0..6; 0 = tutorial);
  saves antigos com `unlockedPhase >= 1` continuam válidos.
- **Campanha** com 6 fases e **20 ondas** (2/3/3/3/4/5); com tutorial, **7 cards
  e 22 ondas**. Totais: **743 blocos / 1.809 XP**; campanha pura: **727 / 1.777**.
- **Controles touch** com drag relativo 1:1 e ganho até 2,2×; **laser** com
  lançamento explícito; **ads** com a política de 60 s; **side art** desktop.
- A `0.5.1` continua sendo a build publicada; a `0.6.0` e a `0.6.1` ainda não a
  substituíram.

## Gates da 0.6.1

| Gate | Resultado |
|---|---|
| `npm run typecheck` | ✅ sem erros |
| `npm test` | ✅ 396 testes em 32 arquivos |
| `npm run validate:content` | ✅ 7 níveis, 22 ondas, 743 blocos, 1.809 XP |
| Bridge config | ✅ schema 2.4.1, sem logo/analytics, sem URLs externas |
| `npm run test:e2e` | ✅ 37 testes em 10 spec files |
| `npm run build` | ✅ |
| `npm run package` | ✅ 20 arquivos, 1.517.380 bytes, SHA acima |

Gates históricos da 0.6.0: 375 testes em 31 arquivos, 36 E2E em 10 spec files e
ZIP de 20 arquivos/1.513.834 bytes
(`1fed8ff154821c209713b64635ab5660845994b6ec1146efdc1a71bab83bcedd`).
Gates históricos da 0.5.1: 329 testes em 29 arquivos, 31 E2E em 9 spec files e
ZIP de 20 arquivos/1.508.491 bytes
(`f63d19341492aaa3b2378d262baac87f103e71daf00ec674972e531f832209ce`).

## Playgama sandbox — amostra pequena

Números do sandbox da 0.4.0, registrados sem conclusão de qualidade/retenção:

- **17/100 qualifying plays**.
- Avg play time **5:42** contra meta **5:00**.
- Ad shows/play **1,70** contra meta **0,30**.
- **116 launches**, **31 plays**, **5m45s**, **3/2 likes**.

A amostra é pequena demais para concluir qualidade ou retenção. A política de
ads da 0.5.1 deve ser medida novamente depois da publicação; a 0.6.1 ainda não
foi publicada.

## Modo Endless

- Run infinita separada da campanha, com velocidade 660→1100, linhas 4→12 e
  chefes a cada 5 ondas.
- Save v2 guarda `endless: { bestWave, bestScore, runs }`.
- Desbloqueado ao concluir a campanha (fase 6); o tutorial não conta.
- Publicado na `0.4.0` do itch.io e no sandbox da Playgama; permanece na `0.5.1`.

## Portais

| Portal | Versão | Status | URL pública | Data | Observação |
|---|---|---|---|---|---|
| itch.io | **0.5.1** | **publicado** | — | 2026-11-11 | atualização manual; `0.1.0-mvp` histórica; 0.6.1 local |
| Playgama | **0.5.1** | **sandbox** | — | 2026-11-11 | milestones pendentes; amostra pequena; 0.6.1 não enviada |
| CrazyGames Basic | 0.5.1 | **pausado** | — | 2026-11-11 | submissão pausada/bloqueada até 2026-11-26 |
| GameFlare | 0.5.1 (não publicada) | **bloqueado** | — | — | sem resposta do suporte sobre login; 0.6.1 não enviada |

### CrazyGames — como pedir detalhes e reenviar

Fonte: <https://docs.crazygames.com/faq/> e
[`../research/crazygames-feedback.md`](../research/crazygames-feedback.md).

- A `0.4.0` foi reenviada como **nova submissão** e recusada novamente com a
  mesma mensagem genérica. Não há relatório público de QA; o caminho é o
  **Support do Developer Portal** (<https://developer.crazygames.com/support>)
  ou **technical-support@crazygames.com**.
- A `0.5.1` foi submetida em 2026-11-11. A submissão está pausada até
  **2026-11-26**; não reenviar antes dessa data.
- O dono decidiu **não fazer moldura/letterbox desktop**. A próxima tentativa
  deve usar teste humano e assets atualizados.
- Não criar conta duplicada nem abrir tickets repetidos.

## Checklist rápido pós-0.6.1

- [ ] Teste humano da 0.6.1 concluído (Tier 4, economia, anti-farm, card do
      Workshop, HUD/results, save v1→v2, ads mock, layout de portal).
- [ ] ZIP 0.6.1 conferido contra `release/manifest.json` e hash registrado.
- [ ] Assets de loja revisados/regenerados para a 0.6.1, se houver publicação.
- [ ] Título **Bricklike** consistente.
- [ ] Descrição, controles e tags revisados para Tier 4 + economia de Sparks +
      Workshop.
- [ ] Publicar 0.6.1 manualmente no itch.io e no sandbox da Playgama, após
      aprovação.
- [ ] CrazyGames: aguardar 2026-11-26 e decidir o reenvio.
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
