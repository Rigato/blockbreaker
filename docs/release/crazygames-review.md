# CrazyGames — diagnóstico da reprovação e plano de melhoria

**Data:** 2026-11-10  
**Build avaliado:** v0.3.0 (Endless), submetido como CrazyGames Basic Launch  
**Build atual para reenvio:** v0.4.0 (revisão visual/menu, HUD, How to Play/About e ads)  
**Resultado:** reprovado por “abaixo dos padrões de qualidade do portal”, sem
detalhamento.

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

**Correções:**

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

Hoje o jogador cai em um menu com três botões e uma nota de controles pequena.
Não há tutorial dentro do gameplay, nem feedback visual de “o que fazer agora”.
A fase 1 é fácil, mas o jogador precisa descobrir sozinho arrastar, lançar,
laser e perks.

**Correções:**

- Primeira run com onboarding curto e pulável: “Drag to move”, “Tap to launch”,
  “Break all blocks”.
- Destaque o primeiro bloco, a primeira bola e o primeiro level-up com setas/
  pulses.
- No menu, CTA principal leva à campanha em **1 clique**; a seleção de fases é
  opcional.
- Mostrar objetivo e recompensa na tela de fase (“Clear 3 waves”, “Boss at the
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
6. [x] Onboarding visual via **How to Play** no menu (substitui o tutorial
      in-game; o jogador pode abrir a qualquer momento).
7. [ ] Ajustar o shell desktop (moldura/letterbox intencional, não faixa perdida).
8. [x] Regerar screenshots, capas e vídeos com o novo visual.
9. [x] Revisar a descrição e o vídeo de preview (metadata atualizada e vídeo
      regravado com o novo menu).
10. [x] Testar 907×510, 800×450, 320×568 e 390×844 (e a matriz E2E).
11. [x] Adicionar **About Us** com a logomarca Bad Decision Games e o texto do
      estúdio.

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

- [ ] Build 0.4.x com o novo visual e HUD legível.
- [ ] Testar no iframe 907×510 e 1920×1080, não só no celular.
- [ ] Onboarding visível na primeira run.
- [ ] Menu em 1 clique para o gameplay.
- [ ] Screenshots/capas coerentes com o jogo.
- [ ] Descrição com ≥ 100 palavras e controles.
- [ ] Sem erros no console, sem 404, sem assets externos.
- [ ] Áudio mutado em background/ads.
- [ ] Save via SDK e `game_ready` no momento certo.
- [ ] Reenviar com a mensagem: “Visual overhaul, desktop readability, in-game
      onboarding, new campaign/endless structure”. O FAQ permite reenvio após
      melhorias claras.

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
progresso salvo. O novo menu e o onboarding devem ajudar diretamente.

## 6. GameFlare

Problema atual é acesso à conta, não build. Enquanto o suporte responde:

- manter o ZIP e o hash registrados;
- validar o build em modo mock (sem SDK/ads);
- preparar a mesma metadata usada nos outros portais;
- não criar conta duplicada sem orientação do suporte.

## 7. Resultado do P0 (2026-11-10)

- Blocos, menu, seleção de fases, settings e desbloqueio do Endless concluídos.
- HUD compacto validado em 907×510, 800×450, 1216×684, 1280×720 e 1920×1080,
  sem sobrepor a primeira linha de blocos.
- **How to Play** com 5 páginas e **About Us** com a logomarca Bad Decision
  Games concluídos.
- Ads ampliados: interstitial a cada 3 ondas na campanha, a cada 4 no Endless,
  saída dos results por Next/Retry/Menu e rewarded revive 1x por run.
- 8 screenshots de loja, capas e vídeos de 18,1 s regerados.
- Metadata atualizada; 280 testes unitários e 24 E2E verdes.
- Restante para o próximo ciclo: moldura/letterbox desktop dedicada,
  metaprogressão, conquistas/desafios e localização.

## 8. Como reenviar a 0.4.0

Fonte: FAQ oficial da CrazyGames (2026-11-10).

- A `0.3.0` foi rejeitada antes de ser publicada, então **não existe um jogo
  publicado para “atualizar”**. O reenvio deve ser feito como **nova submissão**
  (“submit as a new submission”), com melhorias claras.
- O fluxo de **update** do Developer Portal vale para jogo já publicado; não é o
  caso.
- No Developer Portal, usar **Submit a game** com a build `0.4.0`, metadata,
  3 capas e vídeo atuais.
- Se o portal impedir por já existir um registro da `0.3.0`, abrir
  <https://developer.crazygames.com/support> e pedir orientação. Não criar conta
  duplicada sem resposta.
- A mensagem de reenvio deve listar: novo visual de blocos/menu, HUD legível,
  How to Play/About, seleção de fases, ads/rewarded revive e screenshots/assets
  atualizados.


