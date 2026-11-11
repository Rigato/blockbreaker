# Playgama — políticas de teste e leitura dos números do sandbox

**Data da pesquisa:** 2026-11-11  
**URL pública analisada:** `https://playgama.ai/play/lfochrk2kg3wex`  
**Escopo:** pesquisa de termos/robots e análise dos números fornecidos pelo dono.
A URL do jogo **não foi aberta para jogar, scrapear ou gerar eventos**; nenhum
play, like ou evento foi gerado por este trabalho.

> **Resposta curta:** testar a URL pública **manualmente**, no navegador, é o uso
> normal e permitido do Sandbox. **Automação e scraping devem ser evitados:** os
> Sandbox Terms proíbem explicitamente “bots, scripts or other automated means to
> play games or interact with the Sandbox”, além de copiar/scrapear conteúdo e
> sobrecarregar o serviço. Para teste automatizado, use o build local
> (`npm run preview`) ou um preview privado — nunca a URL pública.

---

## 1. O que é o Sandbox da Playgama

- O Sandbox (`https://playgama.ai/play`) é um espaço público de testes para
  jogos independentes, muitas vezes feitos com IA. Os jogos são publicados
  **sem revisão manual**; a Playgama usa checagens automatizadas, que não pegam
  tudo. Fonte: <https://playgama.ai/termsofuse> (Sandbox Terms, §2).
- A página é pública: “A published sandbox is playable by anyone with the link”
  (<https://wiki.playgama.com/playgama/mcp/tools>).
- O uso é para **fins pessoais e não comerciais**: “You may play Sandbox games in
  your browser for your own personal, non-commercial use.” (Sandbox Terms, §8).
- Pode haver ads da Playgama; não há compras no Sandbox; a progressão pode ser
  perdida a qualquer momento (Sandbox Terms, §4 e §2).
- A idade mínima declarada é **18 anos** ou a maioridade local (Sandbox Terms,
  §1). Isso é relevante para quem for testar.

### 1.1 Teste manual é seguro?

**Sim, para o uso pretendido:** abrir a URL no Chrome/Edge/Firefox, jogar com
mouse/toque, ouvir o áudio, observar o boot e o comportamento dos ads é
exatamente o que o Sandbox existe para permitir. Não é necessário login para
jogar; login só é necessário para likes, comentários e save (Sandbox Terms, §3).

Cuidados normais:

- Não clique repetidamente em like/dislike nem tente “subir” estatísticas; isso
  é manipulação proibida (§5).
- Não use VPN/proxy para simular dezenas de países ou gerar plays.
- Não baixe/copie o build, não tente burlar proteções, não sobrecarregue a página.
- Se o jogo pedir dinheiro, cartão, senha ou dados pessoais, **não forneça**;
  reporte pelo botão “Report” (§4 e §6).
- Se você for menor de 18, os termos dizem que o Sandbox não é para você.

---

## 2. Automação e scraping: o que os termos dizem

### 2.1 Sandbox Terms (o texto mais específico)

A seção **“5. Rules for players”** de <https://playgama.ai/termsofuse> diz que o
usuário não pode:

> “cheat, or use bots, scripts or other automated means to play games or
> interact with the Sandbox;”  
> “artificially inflate or manipulate likes, dislikes, plays or other
> statistics;”  
> “hack, reverse engineer, overload or otherwise interfere with the Sandbox or
> any game, or try to bypass its security or technical restrictions;”  
> “copy, scrape or redistribute games or other Sandbox content;”

Isso cobre, de forma direta:

- Playwright/Puppeteer/Selenium abrindo a URL pública para “jogar” ou medir;
- Lighthouse/axe/CI acessando a URL pública;
- scripts de coleta de HTML, screenshots em massa, métricas ou ads;
- load tests, crawlers, spiders, scrapers;
- automação de likes, plays, comentários ou tempo de sessão.

**Conclusão:** não automatize a URL pública. Nem um “smoke test” rápido. Use o
build local para isso. Se precisar de teste automatizado no ambiente da
Playgama, peça autorização explícita ao suporte
(`support@playgama.com`) ou use um preview privado fornecido pelo Portal.

### 2.2 User Terms (playgama.com)

A Chapter 1 (User Terms) também proíbe, na §6.1, “any copying of the Service's
information, including using automatic and other software tools to gain access
to data... without the prior written permission of the Company”. Ou seja, mesmo
que robots.txt permita uma URL, os termos podem proibir a automação.

Fonte: <https://playgama.com/termsofuse> (Chapter 1, última atualização
07.10.2026).

### 2.3 Partner Terms (se você for parceiro/desenvolvedor)

A Chapter 2 (Partners Terms, última atualização 28.01.2026) proíbe usar “bots,
automated scripts, or fraudulent techniques to generate artificial impressions,
conversions, clicks or plays” e manipular métricas. Também proíbe “interrupt or
attempt to interrupt the proper operation” dos jogos.

Fonte: <https://playgama.com/termsofuse> (Chapter 2, §6.1).

---

## 3. Robots.txt: o que ele permite (e o que não permite)

### 3.1 `https://playgama.ai/robots.txt`

O arquivo contém **apenas comentários** sobre “content signals” (search,
ai-input, ai-train), sem nenhuma diretiva `User-agent`/`Disallow`. Ou seja: pelo
protocolo robots, não há uma proibição de crawling nesse domínio. Mas isso **não
autoriza automação**: os Sandbox Terms proíbem bots/scripts para jogar ou
interagir, e robots.txt não substitui um contrato.

### 3.2 `https://playgama.com/robots.txt`

O domínio principal tem regras:

```text
User-agent: *
Disallow: /api/
Disallow: /vcq2/
Disallow: /blog/author/
Disallow: /ad-tester.html

Sitemap: https://playgama.com/sitemaps/v1/sitemap-index.xml
Sitemap: https://playgama.com/blog/sitemap_index.xml
Sitemap: https://wiki.playgama.com/playgama/sitemap-pages.xml
```

O caminho `/play` **não** está na lista de `Disallow`; porém, de novo, isso não
significa que automação de jogo seja permitida. As rotas `/api/`, `/vcq2/`,
`/blog/author/` e `/ad-tester.html` devem ser evitadas por qualquer crawler.

### 3.3 Resumo prático

| Ação | Pode? | Por quê |
|---|---|---|
| Abrir a URL pública no navegador e jogar manualmente | **Sim** | Uso pessoal/não comercial previsto nos Sandbox Terms |
| Testar no seu build local (`npm run preview`) com Playwright | **Sim** | Não é o Sandbox público |
| Lighthouse/axe/CI contra a URL pública | **Não** | “automated means to play/interact” |
| Script para medir FPS, ads ou requests na URL pública | **Não** | Mesma restrição; além de “overload/interfere” |
| Scrapear HTML, screenshots em massa, copiar assets | **Não** | “copy, scrape or redistribute” |
| Automatizar likes/plays/comentários | **Não** | Manipulação de estatísticas |
| Pedir ao suporte para automatizar um teste | **Depende** | Só com autorização explícita |

---

## 4. Leitura dos números do sandbox

Números fornecidos pelo dono (janela e definições não informadas):

| Métrica | Valor | Alvo informado | Leitura |
|---|---:|---:|---|
| Qualifying plays | 17/100 | 100 | 17% do alvo; ainda faltam ~83 plays qualificadas |
| Avg play time | 5:42 | 5:00 | +14% acima do alvo |
| Ad shows/play | 1,70 | 0,30 | ~5,7× o alvo |
| Launches | 116 | — | amostra pequena |
| Plays | 31 | — | 26,7% dos launches |
| Avg play time (geral) | 5:45 | — | consistente com 5:42 |
| Likes / dislikes | 3 / 2 | — | 5 avaliações; sinal fraquíssimo |

### 4.1 O que é sinal bom

- **Tempo médio acima do alvo.** 5:42 vs 5:00 sugere que quem começa a jogar
  fica tempo suficiente para ver o loop. O 5:45 geral bate com o 5:42, então não
  parece um outlier de uma única sessão.
- **Quem vira “play” engaja.** 31 plays com média de 5:45 é um sinal positivo de
  primeira sessão; não é comum um jogo totalmente quebrado segurar esse tempo.
- **3 likes > 2 dislikes.** É levemente positivo, mas ver §4.2.

### 4.2 O que ainda é amostra pequena ou sinal de atenção

- **17/100 qualifying plays.** Se o alvo é 100, o sandbox está a ~6× do
  necessário (100/17 ≈ 5,9). Com n=100 tentativas, o intervalo de confiança de
  95% para 17% é aproximadamente **11%–26%** (Wilson). Não dá para chamar de
  “taxa estável” ainda.
- **116 launches → 31 plays (26,7%).** Cerca de **73% dos launches não chegaram
  a um play**. Isso pode ser boot, primeira impressão, definição de “play”
  (sessão ≥30 s), reloads, testes do próprio time ou tráfego de bots. É o funil
  mais importante a investigar. O IC95% de 31/116 é ~**19,5%–35,4%**.
- **31 plays ainda é pouco.** Para uma leitura minimamente estável de conversão
  e retenção, 100+ plays qualificadas é o próprio alvo do sandbox. Evite concluir
  “o jogo retém” ou “o jogo não retém” com 31.
- **Ad shows/play 1,70 vs 0,30.** É ~5,7× o alvo. Com sessão média de 5:42, isso
  dá **um ad a cada ~3,35 min** (5,7 min ÷ 1,7 ads). A Playgama recomenda intervalos de
  **120–240 s** entre interstitials e diz que o Bridge controla o pacing; então
  1,70 pode estar “dentro do normal da plataforma” e ainda assim acima do alvo
  do catálogo. O número pode estar inflado por poucas sessões longas, revive,
  retry ou chamadas duplicadas. Audite a distribuição, não só a média.
- **3 likes / 2 dislikes.** 60% de avaliações positivas, mas com n=5 o IC95% vai
  de ~**23% a 88%**. Não é evidência de nada. O net +1 é irrelevante
  estatisticamente.
- **Sem dados de retenção.** O sandbox mostra playtime e ads, mas o dono não
  forneceu D1/D7, conclusão de tutorial, onda alcançada ou distribuição de
  sessões. Sem isso, não há como separar “jogo bom, pouca gente” de “jogo com
  problema de primeira sessão”.

### 4.3 O que não concluir

- **Não** conclua que a qualidade do jogo é baixa por causa de 17/100: o próprio
  alvo é 100 e a amostra é pequena.
- **Não** conclua que 5:42 prova retenção: é média de sessão, não retorno no dia
  seguinte; e só conta quem ficou.
- **Não** conclua que 1,70 ads/play é “ganância” sem ver a distribuição: pode ser
  um efeito de poucas sessões ou de ads em resultados/retry.
- **Não** compare 31 plays com 100 qualifying plays como se fossem a mesma
  métrica; confirme as definições no dashboard (play ≥30 s? qualifying play é
  outro threshold? a janela é a mesma?).

### 4.4 Próximos passos para transformar isso em decisão

1. **Deixar o sandbox rodar até 100+ qualifying plays**, sem mudar o build no
   meio, para ter uma amostra melhor. Anotar a data de início e a fonte do
   tráfego (orgânico, boost, share).
2. **Pedir ao dashboard/MCP a distribuição**, não só a média: mediana, p25/p75,
   histograma de duração, ads por sessão, sessões com 0 ads.
3. **Instrumentar o primeiro minuto** com eventos do Bridge:
   `game_ready`, menu → play, primeiro input, primeira quebra, tutorial
   concluído, onda 1 concluída, primeiro level-up, primeiro ad, saída.
4. **Auditar ads:** conferir se `showInterstitial()` é chamado só em pausas
   naturais (fim de onda, results, retry), se não há chamada duplicada e se o
   revive rewarded não está inflando a contagem. Comparar com
   <https://wiki.playgama.com/playgama/guides/monetization/best-practices>.
5. **Melhorar o funil de launch → play:** boot <5 s, menu com CTA direto,
   onboarding visual na primeira onda, controle óbvio em 5 s. O gap de 73% é
   mais acionável que a média de playtime.
6. **Rodar 2–3 variações** (ex.: CTA direto vs seleção de fase; tutorial
   in-game vs modal) e comparar com amostra suficiente; não declarar vencedor
   com 30 plays.

---

## 5. Resumo executivo

- **Teste manual da URL pública:** seguro e previsto; use navegador normal, sem
  automação, sem manipular likes/plays.
- **Automação/scraping:** proibidos pelos Sandbox Terms (§5), independentemente
  do robots.txt. Use o build local para Playwright/Lighthouse.
- **Números:** o melhor sinal é o playtime (5:42 > 5:00). O maior alerta é o
  funil (31/116 = 26,7% de launches viram play; 17/100 qualifying) e o ad load
  (1,70 vs 0,30). Likes e retenção ainda são amostra pequena demais.
- **Decisão:** não reescrever o jogo com base nesses 31 plays; coletar 100+
  qualifying plays, instrumentar o primeiro minuto e auditar os ads.

---

## 6. Fontes

Acessadas em 2026-11-11.

| Fonte | Uso |
|---|---|
| <https://playgama.ai/termsofuse> | Sandbox Terms: idade, uso pessoal, regras §5 (bots/scripts/scraping), ads, report |
| <https://playgama.com/termsofuse> | User Terms §6.1 (ferramentas automáticas) e Partners Terms §6.1 (bots/métricas) |
| <https://playgama.ai/robots.txt> | Sem diretivas; apenas comentários de content signals |
| <https://playgama.com/robots.txt> | Disallow `/api/`, `/vcq2/`, `/blog/author/`, `/ad-tester.html`; sitemaps |
| <https://wiki.playgama.com/playgama/mcp/tools> | “A published sandbox is playable by anyone with the link” |
| <https://wiki.playgama.com/playgama/guides/monetization/best-practices> | Interstitials em pausas naturais; intervalo típico 120–240 s; não adicionar timers próprios |
| <https://wiki.playgama.com/playgama/guides/performance-and-optimization> | Metas de boot <5 s, 60 FPS estável, memória <300–500 MB |
| <https://80.lv/articles/playgama-sandbox-creates-a-faster-route-from-prototype-to-players> | Contexto do Sandbox: métricas de retenção, playtime, tutorial, drop-off |
| <https://www.youtube.com/watch?v=jDg8qLku4W4> | Exemplo de dashboard: 100 qualifying plays, alvo de ~5 min de playtime |

**Nota:** a URL do jogo não foi aberta para jogar nem para coletar conteúdo. A
análise usa apenas os números fornecidos pelo dono e as políticas públicas acima.
