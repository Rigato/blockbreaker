# CrazyGames — diagnóstico da reprovação e plano de melhoria

**Data:** 2026-11-11  
**Builds avaliados:** v0.3.0 (Endless) e v0.4.0 (revisão visual/menu, HUD,
How to Play/About e ads), ambos submetidos como CrazyGames Basic Launch  
**Build candidato:** v0.5.1 (tutorial in-game, controles mobile, side art e
adapter nativo), submetida em 2026-11-11; submissão pausada até 2026-11-26  
**Resultado:** as duas builds foram reprovadas por “abaixo dos padrões de
qualidade do portal”, com a mesma mensagem genérica, sem detalhamento.

> **Atualização 2026-11-12:** a submissão da 0.5.1 está **pausada até
> 2026-11-26**. A `0.6.0` é local e não foi submetida. Este documento permanece
> como diagnóstico histórico da 0.5.1.

## 0. Atualização 2026-11-11 — segunda reprovação da 0.4.0

- A `0.4.0` foi reenviada como **nova submissão** e **reprovada novamente** com
  a mesma mensagem genérica. Não veio lista de requisitos, screenshot, nota nem
  confirmação de etapa (QA inicial × Basic Launch).
- O dono decidiu **não fazer moldura/letterbox desktop**. O shell portrait
  centralizado é intencional; a legibilidade desktop continua apoiada no HUD
  compacto. O risco de apresentação em iframe desktop permanece registrado, mas
  não será resolvido por letterbox nesta linha.
- A próxima tentativa é a **0.5.1**, que muda o que a 0.4.0 não mudou:
  - **tutorial in-game** pulável, com coach marks, em vez de onboarding só no
    menu;
  - **controles touch** com edge assist para o paddle alcançar as bordas sem o
    gesto de borda do navegador;
  - **gate explícito do laser** e HUD mais claro;
  - **política de ads mais conservadora** (tutorial sem ads; campanha só com
    próxima onda e múltiplo de 3; exits com cooldown de 60 s);
  - **aviso de storage** em fallback/memória;
  - **side art** em viewports desktop landscape, sem alterar o mobile portrait;
  - **adapter nativo do CrazyGames**, sem carregar a Playgama no host do portal;
  - campanha ajustada para 20 ondas e fase 1 com 2 ondas.
- A 0.5.1 foi **submetida em 2026-11-11**; a submissão está pausada até
  2026-11-26. Capas, screenshots e vídeos atuais são os da 0.4.0 e não devem ser
  reutilizados.
- Para pedir detalhes, use o Support do Developer Portal ou o e-mail técnico e o
  rascunho de mensagem de
  [`docs/research/crazygames-feedback.md`](../research/crazygames-feedback.md).
  O QA tool/Preview é ambiente de teste, não canal de apelação.
- Não reenviar a 0.5.1 antes de o teste humano e a regeneração de assets
  terminarem; a CrazyGames só aceita reenvio com melhoria clara.

## 0.1 Preview QA da 0.4.0 (medição de 2026-11-11)

O preview de QA da 0.4.0 foi aberto com o build antigo (21 ondas, v0.4.0):

- Em 907×510, o iframe do jogo tinha **606×297** e o shell portrait **167×297**.
- Em 1920×1080, o iframe tinha **1476×786** e o shell **442×786**.
- O sidebar mostrou **Total size 2,9 MB** e **Load time ~9 s**.
- O Network carregava `bridge.playgama.com/v2/stable/playgama-bridge.js` e
  `.../platform-bridges/crazygames.js`; não havia rede de ads externa.
- O console mostrava `PlaygamaBridge v2.4.1 initialized` e um
  `[BannerError] bannersDisabled - Message: Ads are not allowed in basic launch flow`.
- A aba **Warnings** estava vazia; o **Log** só tinha eventos de SDK.
- A metadata da página aparecia como **Orientation: Landscape / Portrait**, embora
  o jogo seja portrait-only. Confirmar o campo no formulário/suporte.

A 0.5.1 remove o Playgama do host CrazyGames (adapter nativo direto) e adiciona
side art em viewports landscape, mas **não aumenta o campo portrait** nem garante
aprovação. O QA real deve ser refeito com a 0.5.1.

## 0.2 Preview QA da 0.5.1 (medição de 2026-11-11)

O preview novo (`6c47b8b1...`) carregou a 0.5.1:

- Em 907×510, o iframe continuou **606×297** e o shell **167×297**.
- Em 1920×1080, o iframe **1476×786** e o shell **442×786**.
- A **side art** apareceu nas laterais (display `block`) em ambos.
- O boot caiu para **~340 ms** (era ~9 s na 0.4.0).
- Network: apenas **`sdk.crazygames.com`**; **nenhum** request `playgama`.
- O `[BannerError] bannersDisabled` **continua**, agora sem Playgama no build:
  é ruído do SDK do CrazyGames, não uma chamada da Playgama.
- O preview mostrou **“Progress may not be saved”** porque o `getItem` do SDK
  falhou no ambiente de QA; em produção, o form deve usar o **Data Module**, não
  LocalStorage.
- A página continua exibindo **Orientation: Landscape / Portrait**. O formulário
  só tem **Mobile orientation**, marcada como **PORTRAIT**. Não existe campo de
  orientação para desktop: o PC é assumido landscape pelo portal.

Conclusão: a questão de orientação está fechada — mobile portrait está correto e
não há como declarar portrait para desktop. A side art é a aposta de apresentação;
o shell portrait continua pequeno em 907×510, então a legibilidade desktop ainda
é o risco principal.

## 1. O que o portal exige publicamente

Fontes consultadas em 2026-11-10:

- <https://docs.crazygames.com/requirements/quality/>
- <https://docs.crazygames.com/requirements/gameplay/>
- <https://docs.crazygames.com/requirements/intro>
- <https://docs.crazygames.com/faq/>

Pontos que mais pesam na avaliação:

1. **Onboarding:** o jogador deve entender o jogo e os controles rápido; o
   onboarding ideal acontece dentro do gameplay, é pulável e usa mais visuais do
   que texto.
2. **Legibilidade:** texto e imagens precisam ser legíveis em `devicePixelRatio:
   1`, em iframes 16:9 específicos (907×510, 1216×684, 1280×720, 1920×1080) e em
   mobile (800×450).
3. **Estética:** gráficos de alta qualidade, resolução consistente, sem
   artefatos; áudio consistente; estilo visual coerente do começo ao fim.
4. **Clareza:** objetivos visíveis, controles intuitivos e linguagem correta.
5. **Full Launch:** cair direto no gameplay ou no máximo 1 clique.
6. **Originalidade e manutenção:** o jogo não pode parecer genérico nem
   confundir-se com outro; deve ser fácil adicionar conteúdo e receber updates.

## 2. Diagnóstico do Bricklike

### 2.1 Problema mais provável: apresentação desktop

O jogo é portrait 9:16. Em um iframe desktop de **907×510**, o shell fica com
**287 px de largura** (altura 510). O HUD usa `clamp()` com `cqw`, então rótulos
como `LEVEL`, `BALLS`, `BLOCKS`, `TIME`, `SCORE` caem para ~6–8 px. Nas capturas
feitas em 907×510 e 1920×1080, o jogo é uma faixa estreita cercada por preto.

Isso atende “portrait aceito se mobile-friendly”, mas não atende bem
“Readable Content” nem “display layout comfortable” em desktop. É o achado mais
objetivo e o que mais explica uma reprovação genérica de qualidade.

> **Decisão de 2026-11-11:** o dono optou por **não fazer moldura/letterbox
> desktop** nesta linha. O shell portrait centralizado permanece; o HUD compacto
> é a mitigação. O risco residual deve ser considerado em qualquer nova
> reprovação e reavaliado com o feedback do suporte.

**Correções consideradas (não todas executadas):**

- Aumentar o teto do shell (ex.: 540 → 640/720 px) e usar a altura disponível.
- Criar um **modo desktop** com moldura lateral decorativa, HUD maior e área de
  jogo centralizada — sem mudar a simulação.
- Reduzir a densidade do HUD: menos rótulos, fonte mínima maior, ícones no lugar
  de texto.
- Testar 907×510, 1216×684, 1280×720 e 1920×1080, além de 390×844 e 800×450.
- Considerar um layout landscape jogável no futuro; no mínimo, não parecer um
  celular perdido no meio da tela.

### 2.2 Consistência visual entre capa e jogo

As capas usam blocos lisos, arredondados, com gradiente e brilho. O jogo usa
blocos pixelados, escuros, com ícones repetidos. O avaliador vê a capa primeiro e
depois uma arte diferente. Os requisitos pedem estilo coerente e alta qualidade.

**Correções:**

- Redesenhar os blocos para o mesmo vocabulário das capas (corpo saturado,
  bisel, brilho, sombra, materiais distintos, poucos detalhes).
- Regerar screenshots e capas a partir do novo visual.
- Garantir que a capa não pareça “outro jogo”.

### 2.3 Primeira impressão e onboarding

Na 0.4.0, o jogador caía em um menu e o onboarding dependia do **How to Play**,
um modal de cinco páginas. A fase 1 era fácil, mas o jogador ainda precisava
descobrir sozinho arrastar, lançar, laser e perks.

**O que a 0.5.1 mudou:** tutorial in-game curto e pulável, com cinco coach marks
(mover/lançar, XP/perk, blocos especiais, chefes e Endless), card próprio antes das seis fases e
gate do level 1 em save novo. O menu continua com How to Play como referência.

**O que ainda pode pesar:** o avaliador precisa jogar o tutorial para ver a
promessa; se ele pular direto, a primeira impressão volta a depender do menu.
Testar o caminho “Skip tutorial” e o caminho completo no Preview.

**Correções adicionais consideradas:** CTA principal levando direto à campanha
em 1 clique e objetivo/recompensa na tela de fase (“Clear 2 waves”, “Boss at the
end”).

### 2.4 Retenção e profundidade percebida

O jogo tem 6 fases e Endless, mas não tem metaprogressão, conquistas, desafios
diários, leaderboard ou recompensas entre runs. Para um portal que avalia
retenção, isso o coloca na prateleira dos “block breakers genéricos”.

**Correções de maior impacto:**

- Metaprogressão leve: moedas por run, skins de bola/paddle, melhorias pequenas
  e permanentes.
- Conquistas e desafios diários/semanais.
- Leaderboard do Endless (mesmo que local no Basic).
- Eventos e modificadores semanais.
- Mais um modo (“Boss Rush”, “Daily Challenge”).
- Rewarded revive opcional: uma vez por run para continuar após a derrota.

### 2.5 Áudio e feedback

O áudio é sintetizado e funcional, mas o loop ambiente é curto e repetitivo. O
portal valoriza áudio consistente e música que complementa o visual.

**Correções:**

- Aumentar a variação do loop (2–3 camadas, progressão) ou trilha por tema.
- Mixagem: SFX de quebra mais “gratificante”, camadas de combo.
- Toggle de música separado (já implementado neste ciclo).

### 2.6 Metadata e assets de portal

- Capas: 3 tamanhos obrigatórios, sem texto além do título, sem logos, sem
  material de terceiros. A capa atual é limpa, mas o estilo não bate com o jogo.
- Descrição ≥ 100 palavras, instruções de controle e vídeo de preview.
- O spec interno diz “sem visual pixellado” nas capas; as capas atuais são
  vetoriais lisas, então estão ok nesse ponto — o problema é a divergência com o
  in-game.

## 3. Lista priorizada de melhorias

### P0 — antes de reenviar

1. [x] Redesenhar os blocos (coerência com capa/UI).
2. [x] Refazer o menu: Campaign/Endless, fundo animado, sem textos de MVP.
3. [x] Seleção de fases visual com identidade por fase.
4. [x] Settings com som, música e screen shake.
5. [x] Aumentar legibilidade do HUD em 907×510, 800×450, 1216×684,
      1280×720 e 1920×1080 (HUD compacto com ícones e valores maiores).
6. [x] Onboarding jogável na primeira run: tutorial in-game pulável, card
      próprio antes das seis fases, coach marks e gate do level 1 (0.5.1).
7. [—] Ajustar o shell desktop (moldura/letterbox intencional). **Decisão:
      não fazer nesta linha**; risco residual registrado.
8. [ ] Regerar screenshots, capas e vídeos a partir da **0.5.1**. Os assets
      atuais são os da 0.4.0 e ainda não foram atualizados.
9. [ ] Revisar a descrição e o vídeo de preview para tutorial + 6 níveis/20
      ondas; o vídeo atual é o da 0.4.0.
10. [x] Testar 907×510, 800×450, 320×568 e 390×844 (e a matriz E2E).
11. [x] Adicionar **About Us** com a logomarca Bad Decision Games e o texto do
      estúdio.
12. [x] Controles touch com edge assist, gate do laser, política de ads e aviso
      de storage (0.5.1).

### P1 — próxima atualização

11. [ ] Metaprogressão leve (moedas, skins, upgrades pequenos).
12. [ ] Conquistas locais + tela de progresso.
13. [ ] Desafio diário/semanal.
14. [ ] Leaderboard local/global do Endless.
15. [ ] Mais variação de música e mixagem.
16. [x] Tela de “How to Play” no menu (neste ciclo).
17. [ ] Acessibilidade: remapeamento, tamanho de texto, contraste.
18. [ ] Localização PT-BR/ES (se o portal exigir mercado).
19. [ ] Suporte landscape jogável.
20. [x] Rewarded revive opcional, uma vez por run.

### P2 — conteúdo e retenção

21. [ ] Boss Rush.
22. [ ] Modificadores semanais.
23. [ ] Skins de tema para blocos/paddle.
24. [ ] Mais fases ou campanha 2.
25. [ ] Cross-promo interno (quando houver outro jogo).
26. [ ] Telemetria via Bridge (quando permitido).

## 4. Checklist de reenvio

- [ ] Build **0.5.1** local testada por humano, com o tutorial completo e o skip.
- [ ] Testar no iframe 907×510 e 1920×1080, não só no celular; o shell portrait
      centralizado é decisão de produto, não um bug pendente.
- [ ] Onboarding visível na primeira run; conferir os cinco coach marks.
- [ ] Menu leva ao gameplay em Campaign → card → Play (2 cliques); o tutorial é
      o caminho de entrada em save novo.
- [ ] Screenshots/capas/vídeos **regerados a partir da 0.5.1**; os atuais são da
      0.4.0.
- [ ] Descrição com ≥ 100 palavras, tutorial + 6 níveis/20 ondas e controles.
- [ ] Sem erros no console, sem 404, sem requests externos no boot.
- [ ] Áudio mutado em background/ads.
- [ ] Save via SDK e `game_ready` no momento certo.
- [ ] Ads: tutorial sem ads; campanha só em onda múltipla de 3 com próxima onda;
      exits com cooldown de 60 s; `failed`/`skipped` não bloqueiam.
- [ ] Reenviar com a mensagem: “Playable in-game tutorial with skip, mobile touch
      edge assist, explicit laser launch, revised ad cadence and storage
      warning”. O FAQ permite reenvio após melhorias claras.

## 5. Playgama (sandbox)

O sandbox exige milestones antes da publicação. Os milestones não são públicos
em detalhe, mas o padrão da indústria e o próprio material da Playgama apontam
para:

- retenção (sessão média, D1);
- conclusão de nível/tutorial;
- uso do Bridge (storage, ads, lifecycle);
- estabilidade e tempo de carga;
- qualidade percebida (mesmos pontos acima).

Ações: medir sessões no dashboard, reduzir atrito do primeiro minuto, garantir
`game_ready`/`level_started` corretos, interstitial só em pausa natural e
progresso salvo. O tutorial in-game da 0.5.1 deve ajudar diretamente.

**Amostra do sandbox (0.4.0, pequena):** 17/100 qualifying plays; avg play time
5:42 contra meta 5:00; ad shows/play 1,70 contra meta 0,30; 116 launches, 31
plays, 5m45s, 3/2 likes. Não concluir qualidade/retenção com essa amostra; medir
de novo depois da 0.5.1.

## 6. GameFlare

Problema atual é acesso à conta, não build. Enquanto o suporte responde:

- manter o ZIP e o hash registrados;
- validar o build em modo mock (sem SDK/ads);
- preparar a mesma metadata usada nos outros portais;
- não criar conta duplicada sem orientação do suporte.

## 7. Resultado do P0 e segunda reprovação (2026-11-11)

- Blocos, menu, seleção de fases, settings e desbloqueio do Endless concluídos
  na 0.4.0.
- HUD compacto validado em 907×510, 800×450, 1216×684, 1280×720 e 1920×1080,
  sem sobrepor a primeira linha de blocos.
- **How to Play** com 5 páginas e **About Us** com a logomarca Bad Decision
  Games concluídos.
- A 0.4.0 ampliou os ads (interstitial a cada 3 ondas na campanha, a cada 4 no
  Endless, saída dos results e rewarded revive 1x por run), mas **foi reprovada
  de novo** com a mesma mensagem genérica.
- 8 screenshots, capas e vídeos de 18,1 s foram regerados para a 0.4.0; **não
  servem como assets da 0.5.1**.
- 280 testes unitários e 24 E2E verdes na 0.4.0; a 0.5.1 tem 329 unitários e 31
  E2E.
- Decisão para o próximo ciclo: **não fazer moldura/letterbox desktop**.
  Restam tutorial in-game (feito), controles mobile (feito), política de ads
  (feita), teste humano e assets novos.

## 8. Como pedir detalhes e reenviar a 0.5.1

Fonte: FAQ oficial da CrazyGames, Developer Portal e
[`docs/research/crazygames-feedback.md`](../research/crazygames-feedback.md)
(2026-11-11).

- A `0.3.0` e a `0.4.0` foram rejeitadas antes de qualquer publicação; **não
  existe um jogo publicado para “atualizar”**. O reenvio é sempre **nova
  submissão** (“submit as a new submission”), com melhorias claras.
- Antes de reenviar, pedir detalhes pelo **Support do Developer Portal**
  (<https://developer.crazygames.com/support>) ou por
  **technical-support@crazygames.com**. Incluir título, game ID/submission ID,
  build, data e e-mail da conta. Perguntar:
  1. a reprovação foi da **QA inicial** ou de um **Basic Launch**?
  2. quais requisitos específicos falharam (iframe desktop, onboarding,
     originalidade, áudio, performance, controles mobile, metadata)?
  3. há notas de QA, screenshots ou checklist da submissão?
  4. quais 2–3 mudanças teriam mais impacto no reenvio?
- Usar o rascunho em inglês do research doc; não abrir tickets duplicados nem
  criar conta nova.
- Se o portal impedir por já existir um registro, pedir orientação no mesmo
  canal.
- A mensagem de reenvio da 0.5.1 deve listar: tutorial in-game pulável com coach
  marks, gate do level 1, edge assist touch, gate explícito do laser, nova
  política de ads, aviso de storage, campanha de 20 ondas e 329/31 testes.
- Só depois de teste humano e assets da 0.5.1; não reutilizar capas,
  screenshots ou vídeo da 0.4.0.


