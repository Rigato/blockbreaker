# Caminho de baixa fricção para começar a publicar jogos web

**Resumo executivo do relatório completo** (`final_turn_001.md`, 115 fontes) — focado no que importa para *começar*, não em maximizar receita.

> **Atualização 2026-11-11:** o plano original foi executado. itch.io está com a
> `0.4.0`; a Playgama está em sandbox com a `0.4.0`; a CrazyGames reprovou o
> Basic Launch com a `0.3.0` e rejeitou a `0.4.0` novamente com a mesma mensagem
> genérica; a GameFlare segue bloqueada por acesso à conta. A `0.5.1` está
> **local**, validada e aguardando teste humano/push: traz tutorial in-game,
> controles touch com edge assist, gate do laser e uma política de ads mais
> conservadora. Nada da `0.5.1` foi publicado. Ver
> `docs/handoff-v0.5.1.md`.

---

## A resposta em uma linha

**itch.io + GameFlare + Playgama, com um único build HTML5.** Todo o resto entra depois.

---

## Por que esses três

### itch.io — friction zero real

Sem SDK, sem QA, sem review, publicação imediata, HTML5 em ZIP. Você posta hoje e o link existe hoje. Todo o tráfego que vier é seu, 100% da receita é sua (você define a fatia do itch.io, default 10%), payout mínimo de US$ 5. O único custo é o de distribuição, que é zero.

É o canal onde você aprende o que importa sem gateway de ninguém no meio.

### GameFlare — o primeiro dinheiro, com a menor barreira

Aceita HTML5 puro, sem SDK obrigatório, aprovação permissiva, e paga 85% do que o jogo gera nos sites do GameFlare (50% quando o jogo roda em sites de publishers). Mínimo de € 50 — a barreira de entrada mais baixa de toda a lista de plataformas com ad revenue share.

### Playgama — o gancho é o custo marginal, não o percentual

O percentual escalonado (70% até US$ 1.000 / 80% até US$ 3.000 / 90% acima) é atrativo, mas o que realmente muda o jogo é o **custo marginal**: você sobe um build, recebe feedback em 24 horas, e ele sai no portal deles (10.000+ jogos) e em 100+ plataformas parceiras — incluindo MSN e YouTube Playables.

Para rodar no sistema deles você integra a **Playgama Bridge**, que é open source (LGPL-3.0) e resolve 25+ plataformas numa integração só, com plugins para Unity, Construct 3, Godot, GameMaker, Defold, GDevelop, Cocos, Scratch e JS puro.

Ressalva honesta: a Playgama é ela própria uma distribuidora do ecossistema e a autora dos guias comparativos que a colocam em posição favorável. Leia o contrato, não o blog.

---

## O plano mínimo

| Passo | O quê | Por quê |
|---|---|---|
| 1 | Build HTML5 único, leve, mobile-first, zero requisição externa | Serve para todos os canais ao mesmo tempo |
| 2 | itch.io (iframe, sem ads) | Publica em minutos, é seu funil de verdade |
| 3 | GameFlare | Primeiros dólares, fricção quase nula |
| 4 | Playgama + Bridge | Distribuição em massa sem exclusividade |
| 5 | CrazyGames Basic Launch | 7–21 dias sem receita, mas com jogadores reais testando o jogo antes de você investir em SDK e QA |

**Por que o passo 5 fica na posição que fica:** o Basic Launch é um teste de retenção de graça. O período só encerra quando o jogo está no ar há pelo menos 7 dias **e** acumula pelo menos 500 plays — os dois thresholds precisam ser cumpridos, e se os 500 plays não vierem o período encerra automaticamente aos 21 dias. Se o jogo não segura 3+ minutos de playtime médio e 25%+ das sessões acima de 3 minutos, você descobre isso antes de perder duas semanas de integração. Passando disso, o Full Launch exige SDK e QA de verdade.

---

## O que adiar (e por quê)

- **GameDistribution** — 33% da Net Revenue é o contrato mais claro do setor, mas paga em até 60 dias depois do relatório mensal e tem a cláusula 2.6.4: o build publicado tem que ser **sempre idêntico** ao mais recente publicado em qualquer outra plataforma. Isso amarra sua pipeline de release. Bom quando você tiver volume, não pra começar.
- **Famobi** — fatura, TIN ou VAT obrigatório, € 250 de piso, 45 dias de pagamento. Fricção administrativa que você não precisa agora.
- **Addicting Games** — os termos de submissão (modificados em 19/02/2026) são literais: submissão não gera pagamento nem revenue sharing sem acordo escrito.
- **Discord (Premium Apps)** — só para devs baseados nos EUA, Reino Unido ou União Europeia. Fora dessas regiões o recurso simplesmente não está disponível.
- **Poki (exclusividade web)** — o prazo é de 5 anos nas páginas de termos e 7 anos na página "Bonus Level" (conflito real do próprio fornecedor), cobrindo navegador aberto, Discord e YouTube Playables. Só faz sentido depois que o web fit test já provou retenção. Antes disso, você estaria pagando com opcionalidade para aprender o que seus próprios dados de teste dizem de graça.

---

## A calibragem honesta

**Brasil e Índia pagam o mesmo eCPM de US$ 1–3 (Tier-3) que os EUA pagam de US$ 15–28.** Depois de um split de 50%, o traffic brasileiro rende cerca de US$ 0,50 a US$ 1,50 por mil impressões. No itch.io, 80% dos jogos pagos ficam entre US$ 0 e US$ 50 por mês, e a maioria não passa de US$ 100 na vida inteira.

Ou seja: **expectativa realista de receita nos primeiros meses é perto de zero**, e qualquer plano que trate isso como "problema de distribuição" está errado. O problema é que ad revenue em web tier-3 é economicamente marginal.

Duas saídas mais sanas do que procurar portal melhor:

1. **Vender o jogo** — itch.io permite venda com fatia entre 0% e 100% e piso de US$ 5.
2. **Usar o canal como funil** — o tráfego do portal vira topo de funil para o seu produto ou para o Steam, não fonte de renda.

Detalhe que muda o cálculo: no itch.io, jogo HTML5 em iframe só aceita **doações**. Para vender, o "Kind of Game" precisa ser "Downloadable".

---

## A dica mais barata do relatório

**Um build só, três canais, um fim de semana.** Cada SDK a mais é uma semana de manutenção que você não tem.

E sobre a engine: o build precisa ser HTML5 limpo e mobile-first. Se você vier de Unity, exporte com WASM e otimize — o orçamento de download inicial do Poki (referência de engenharia: até 5 MB no primeiro carregamento, 8 MB no total) é o retrato do que o hardware de jogador real aguenta. Em compensação, GameFlare e itch.io aceitam o que for, sem SDK obrigatório.

---

## Fontes

O relatório completo com 115 referências numeradas está em `final_turn_001.md`, no mesmo diretório. As fontes-chave deste resumo:

- Playgama for Developers e Payments FAQ (split escalonado, feedback em 24h, payout ≥US$ 100) — https://playgama.com/developers · https://wiki.playgama.com/playgama/faq/payments-and-statistics
- What is Playgama Bridge — https://playgama.com/blog/business-faqs/what-is-playgama-bridge-and-what-does/
- itch.io Docs (open revenue sharing, payout US$ 5, HTML5 só aceita doação) — https://itch.io/docs/creators/payments · https://itch.io/docs/creators/html5
- Earn Money with your Game — GameFlare (85%/50%, € 50, PayPal/TransferWise) — https://distribution.gameflare.com/developers/
- CrazyGames Documentation (Basic Launch 7–21 dias, thresholds de 500 plays + 7 dias) — https://docs.crazygames.com/
- Developer Game License Agreement — GameDistribution (33%, € 100 em 60 dias, cláusula 2.6.4) — https://static.gamedistribution.com/terms/developer.html
- Developer License Agreement — Famobi (€ 250, 45 dias, fatura + TIN) — https://accounts.famobi.com/developer-license-agreement.html
- Addicting Games User Submission Agreement ("No Compensation") — https://www.addictinggames.com/about/user-submission-agreement
- Premium Apps Payout — Discord (restrição US/UK/EU, US$ 100 + US$ 25) — https://support-dev.discord.com/hc/en-us/articles/17299902720919-Premium-Apps-Payout
- How we partner with you — Poki (exclusividade 5 anos, split 100%/50%) — https://developers.poki.com/guide/revenue-deal-types
- Cinevva, Web Game Monetization 2026 (eCPM Tier-3 US$ 1–3, mediana itch.io, Monkey Mart/Level Devil/Stickman Hook) — https://app.cinevva.com/guides/web-game-monetization
- PortalReady (comparativo de payouts e thresholds) — https://portalready.world/portals/portal-payouts-compared/
