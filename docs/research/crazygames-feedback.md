# CrazyGames — como obter feedback específico e o que provavelmente reprovou

**Data da pesquisa:** 2026-11-11  
**Builds reprovadas:** `0.3.0` e `0.4.0` (conforme informado pelo dono)  
**Mensagem recebida:** rejeição genérica por “abaixo dos padrões de qualidade”,
sem detalhamento.  
**Escopo:** pesquisa documental e auditoria do repositório. Nenhum código-fonte
foi alterado e nenhuma submissão foi feita. A árvore de trabalho estava em
movimento; os achados “repo” refletem `src/`/`dist/` no momento da pesquisa —
revalide no build que for submetido.

> **Conclusão curta:** a CrazyGames não publica um canal de “apelação” com
> relatório detalhado. O canal correto é o **Support do Developer Portal**
> (`https://developer.crazygames.com/support`) ou o e-mail
> **technical-support@crazygames.com**. O “QA tool” é o ambiente de
> **Preview** do Portal: ele roda o jogo como no site, testa o iframe e o SDK,
> mas **não substitui a revisão humana nem explica sozinho uma reprovação**.
> Para um block breaker portrait, os riscos mais objetivos são a
> **apresentação/legibilidade no iframe desktop**, a **originalidade percebida**
> e a **retenção**. O onboarding que dependia do menu foi atacado na 0.5.0 com
> tutorial in-game pulável. No build `0.5.0` o Bridge passou a
> ser local-only, removendo o CDN da Playgama do caminho de boot; o único script
> externo restante é o SDK nativo do CrazyGames, carregado no host do portal.

---

## 1. O que se sabe oficialmente sobre a review

### 1.1 Duas etapas diferentes

A documentação oficial separa o processo em duas etapas:

| Etapa | O que é | Como termina |
|---|---|---|
| **Initial QA check** | Revisão humana do build antes de qualquer publicação. A equipe joga a submissão e verifica funcionamento, requisitos e qualidade. | Aprovado → entra em **Basic Launch**; reprovado → e-mail genérico, sem métricas. |
| **Basic Launch** | Soft launch de 7 a 21 dias, com audiência limitada. Métricas reais de playtime, retenção e conversão. | KPIs fortes → convite para Full Launch; alguns fracos → novo período/ajustes; maioria fraca → nova submissão como jogo novo. |
| **Full Launch** | Release global, SDK completo e monetização. | Nova revisão de QA. |

Fontes: <https://docs.crazygames.com/>,
<https://docs.crazygames.com/faq/> e
<https://docs.crazygames.com/resources/basic-launch-metrics/>.

**Como saber em qual etapa a `0.4.0` foi reprovada:**

- Se o jogo **nunca ficou visível** e o dashboard **não tem plays/período de
  Basic Launch**, a reprovação é da **QA inicial**.
- Se houve 7–21 dias no ar, 500+ plays e o e-mail fala de performance/métricas,
  é **Basic Launch**.
- A mensagem “the overall quality of the game does not yet meet the expectations
  of our platform” é relatada por desenvolvedores como a resposta padrão da
  **QA inicial**; a reprovação de Basic Launch costuma vir acompanhada dos
  números do período. Ainda assim, peça confirmação ao suporte (modelo na §4).

### 1.2 A CrazyGames promete “constructive feedback”, mas não detalha

O FAQ oficial diz que, “upon review, we of course make sure that we share
constructive feedback to help you reach the needed standards”. Na prática, vários
desenvolvedores relatam receber apenas a frase genérica, sem lista de requisitos
ou screenshots:

- <https://www.reddit.com/r/Unity3D/comments/1uyxikq/why_does_crazy_games_keep_rejecting_my_game/>
- <https://www.reddit.com/r/WebGames/comments/1sdxado/crazygames_rejected_my_game_with_no_feedback_what/>
- <https://www.reddit.com/r/gamedev/comments/1xlco7n/has_anyone_been_rejected_by_crazygames_or_poki/>
- <https://www.trustpilot.com/review/crazygames.com> (relatos de 2026 sobre
  feedback vago)

Isso não é uma garantia de que o suporte dará detalhes. É uma razão para pedir
de forma específica, educada e com o jogo/ID corretos — e para ter um plano B de
autoavaliação.

### 1.3 Reenvio só com melhoria clara

O FAQ oficial é explícito:

- Pode reenviar depois de rejeitado, **mas apenas se houver melhorias claras**.
- Reenviar o mesmo jogo com mudanças pequenas “most likely” terá o mesmo
  resultado.
- Jogos aceitos costumam ter **objetivo claro, gameplay suave e polido e
  onboarding rápido**.
- A `0.3.0` nunca foi publicada; portanto o reenvio é **nova submissão**, não
  “update” de jogo publicado.

Fonte: <https://docs.crazygames.com/faq/> (pergunta “Can I submit a game again
after it was rejected?”).

Isso importa: a `0.3.0 → 0.4.0` foi uma overhaul visual/menu e **também foi
reprovada**. A próxima tentativa precisa mudar algo mais central do que arte de
bloco e telas de menu.

---

## 2. Canais corretos (em ordem)

### 2.1 Support do Developer Portal — canal principal

1. Acesse <https://developer.crazygames.com/> e faça login.
2. Abra <https://developer.crazygames.com/support> (ou **Support** no menu do
   Portal).
3. Escolha a categoria de submissão/review (se existir) e envie a mensagem da §4.
4. Inclua: título, **game ID/submission ID**, build, data da submissão, e-mail
   usado na conta e link de preview (se houver).

O link de Support é o indicado no rodapé da documentação oficial
(<https://docs.crazygames.com/faq/#contact>).

### 2.2 E-mail técnico

O Developer Terms & Conditions publica
**technical-support@crazygames.com** como contato de suporte:

- <https://files.crazygames.com/documents/developer_terms_20250818.pdf> (§5.8)

Use o mesmo texto do Portal, com o assunto:
`Review feedback request — Bricklike (build 0.4.0)`.

Não use `developer-relations@` para isso: esse endereço é para questões
contratuais/terminação, não para QA.

### 2.3 Responder ao e-mail de rejeição

Se o e-mail de rejeição tiver resposta habilitada, responder nele é o caminho
mais rastreável (mantém o thread e o ID da submissão). Se não tiver, use o
Support do Portal citando o ID.

### 2.4 Discord — só comunidade, não é o canal de review

A CrazyGames tem Discord oficial
(<https://discord.com/servers/crazygames-1110572076517044354>), mas ele é
voltado à comunidade. Não trate o Discord como canal formal de review nem como
garantia de resposta da equipe de QA. Pode servir para pedir uma segunda opinião
de outros devs, não para contestar a decisão.

### 2.5 O que evitar

- Criar conta duplicada para “tentar de novo” sem resposta.
- Reenviar o mesmo build ou só com mudanças cosméticas.
- Abrir vários tickets iguais em sequência.
- Pedir “o algoritmo” ou “a nota”; peça requisitos e evidências.
- Discutir a decisão em público antes de esgotar o suporte.

---

## 3. QA tool / Preview: o que é, como acessar e o que valida

### 3.1 Como acessar

1. Faça login em <https://developer.crazygames.com/>.
2. Vá em **Submit a game** / **Games** e crie (ou abra) o draft do jogo.
3. Preencha nome, engine (**HTML5** ou **externally hosted/iframe**) e a URL
   (`http://localhost:4173` para teste local) ou faça upload do ZIP.
4. Clique em **Preview**. O jogo abre no ambiente de QA em
   `crazygames.com/preview`, com o SDK da plataforma disponível.

Fontes: <https://docs.crazygames.com/requirements/intro/> (seção “Quality
Assurance Tool”), <https://docs.crazygames.com/sdk/intro/> (seção “Development &
Testing”) e o tutorial de terceiros da Wonderland Engine
(<https://wonderlandengine.com/tutorials/upsdk-crazygames/>), que descreve o
fluxo “Submit a game → Preview”.

### 3.2 O que o Preview valida

A documentação oficial diz que o Preview permite:

- rodar o jogo “as it would on CrazyGames”;
- **checar se o jogo atende aos requisitos**;
- testar as features de SDK implementadas e receber feedback delas.

Na prática, é um **ambiente de execução e fumaça**, não um relatório de review.
Ele ajuda a verificar:

- carregamento dentro do iframe e em diferentes tamanhos de tela;
- erros de console, requests quebrados, tela preta, áudio;
- comportamento do SDK: `game_ready`, `gameplay_start/stop`, ads mockados,
  banners, user/data, storage, pause/mute;
- se o jogo não depende de recursos externos ou de um SDK que não existe no
  ambiente da CrazyGames;
- tempo até o menu/gameplay e o layout portrait em desktop.

**O que ele não faz (pelo que é público):** não dá nota, não lista “você falhou
no requisito X”, não avalia diversão, originalidade, áudio ou qualidade de
onboarding, e não aprova a submissão. A decisão continua humana. Não há
documentação pública de um “score” automático do QA tool.

### 3.3 O que testar no Preview antes de reenviar

Checklist mínimo:

- [ ] Abrir em **907×510**, **1216×684**, **1280×720**, **1920×1080**,
      **800×450** e **390×844**, com **DPR 1**.
- [ ] Conferir se o HUD, textos, botões e cards são legíveis sem zoom.
- [ ] Ver se o jogo não parece “um celular perdido” no desktop: moldura,
      fundo lateral, HUD maior ou layout desktop intencional.
- [ ] Fazer o caminho real: menu → Campaign → fase → play. Contar cliques e
      segundos até o primeiro lançamento.
- [ ] Testar o jogo com a rede bloqueada para `bridge.playgama.com` e para
      qualquer domínio externo; ver se o boot não trava e se não há ads.
- [ ] Confirmar que **não há ads externos** (Playgama ou outros) no ambiente
      CrazyGames; Basic Launch permite SDK opcional, mas **não permite ads
      externos**.
- [ ] Confirmar que não há logo/link/cross-promotion da Playgama ou de outro
      portal.
- [ ] Ver console: sem erros, sem 404, sem requests externos inesperados.
- [ ] Testar áudio: mute ao abrir ad/pause, retomada após gesto, volume
      consistente.
- [ ] Testar save/restart e `game_ready` no momento certo.
- [ ] Testar fullscreen do portal; **não** ter botão próprio de fullscreen.
- [ ] Conferir capa, screenshots e vídeo contra o build atual.

---

## 4. Rascunho de mensagem de suporte (inglês)

Use exatamente o que souber; substitua os campos entre `[ ]`. Mantenha curto.

**Assunto:** `Review feedback request — Bricklike (build 0.4.0)`

```text
Hi CrazyGames team,

I'm the developer of Bricklike (game ID: [ID]; submission ID: [ID if any]).
Build 0.4.0 was submitted on [date] and rejected with the message that the game
is "below the quality standards", without further detail. Build 0.3.0 had been
rejected earlier for the same reason.

I'm not disputing the decision. I want to make sure the next submission is a
real improvement rather than another guess. Could you please confirm:

1. Was this rejection from the initial QA check, or did it happen after a Basic
   Launch period? From the dashboard, the game does not appear to have entered
   Basic Launch (no metrics/period), so I assume it was the initial QA check —
   please confirm. If it was Basic Launch, could you share the KPI breakdown
   (average playtime, D1 retention, conversion)?
2. Which specific requirement(s) failed? For example: desktop/iframe
   readability at 907x510, onboarding/first-click flow, originality, audio,
   load/performance, mobile controls, or metadata/cover mismatch.
3. Do you have any QA notes, screenshots, timestamps, or a checklist you can
   share for this submission?
4. What are the 2–3 highest-impact changes you would need to see before a
   resubmission?

I can provide a fresh preview build, a short gameplay video, and a checklist of
the changes since 0.4.0. If there is a better channel for review feedback,
please point me to it.

Thank you,
[Name]
[Studio]
[Email used on the account]
[Preview URL, if available]
```

**Versão ainda mais curta (se o formulário tiver limite):**

```text
Hi CrazyGames team,

Bricklike (game ID [ID]), build 0.4.0, was rejected for "below quality
standards" with no details. Was this the initial QA check or Basic Launch?
Which specific requirements failed, and do you have QA notes or screenshots?
What 2–3 changes would you need to see before a resubmission?

I'm not disputing the decision — I want to fix the right things. A fresh
preview build and video are available on request.

Thanks,
[Name] — [Studio]
```

**Dicas de envio:**

- Não anexe ZIP grande no primeiro contato; ofereça o link.
- Se o formulário pedir categoria, use “Submission / Review feedback” ou
  “Developer support”.
- Guarde o ID e a data; se responderem com template, agradeça e peça apenas
  **um** exemplo concreto (“could you point to one screen or requirement?”).
- Se não houver resposta em alguns dias úteis, faça **um** follow-up no mesmo
  thread; não abra tickets duplicados.

---

## 5. Causas prováveis de reprovação (com confiança e evidência)

A ordem abaixo é uma hipótese de trabalho baseada nos requisitos oficiais e no
build atual — não um veredito da CrazyGames. Itens marcados “repo” foram
observados no código/dist desta cópia.

### 5.1 Apresentação e legibilidade no iframe desktop — **alta confiança**

**Evidência oficial:** “Readable Content” exige texto/imagens legíveis em
`devicePixelRatio: 1`, nos iframes 16:9 listados (907×510, 1216×684,
1280×720, 1920×1080 etc.) e em mobile. “The display layout [should be]
comfortable and intuitive.” Portrait é aceito, mas com black bars ou background
images nas laterais; não é desculpa para uma faixa minúscula.

**Evidência do build:** o shell é
`width: min(100vw, calc(100dvh * 9 / 16), 540px)`. Em 907×510, a largura é
`510 * 9/16 = 286,9 px` — só **31,6%** da largura do iframe. Em 1920×1080, o
cap de 540 px deixa **690 px de preto de cada lado** (28% de largura útil). O HUD
usa `cqw`; com 287 px de container, 1 `cqw` = 2,87 px, e rótulos pequenos podem
cair para 6–8 px. O `crazygames-review.md` marcava “ajustar o shell desktop
(moldura/letterbox intencional)” como P0; em 2026-11-11 o dono decidiu **não
fazer essa moldura** nesta linha.

**Por que isso continua sendo risco:** o revisor vê primeiro a página desktop; se
o jogo é uma tira estreita com HUD pequeno, a impressão pode ser “não otimizado
para web/desktop” mesmo que o mobile esteja bom. É o achado mais objetivo da
auditoria anterior, mas a decisão de produto foi mantê-lo.

**O que fazer (dentro da decisão):** testar o HUD compacto em DPR 1 nos seis
tamanhos, garantir legibilidade dos textos e usar o Preview para ver se o shell
portrait parece intencional. Moldura/letterbox dedicada está fora de escopo.

### 5.2 Onboarding e caminho até o gameplay — **alta confiança**

**Evidência oficial:** o onboarding ideal acontece **dentro do gameplay**, é
pulável, usa mais visuais do que texto, e ensina só o core. Para Full Launch, o
jogo deve cair direto no gameplay ou no máximo **1 clique**. A review de Basic
Launch também valoriza “quick onboarding” e “clear goal”.

**Evidência do build 0.4.0:** o jogador caía no menu; para jogar fazia
**Campaign → card da fase** (**2 cliques no total**). O “How to Play” era um
modal de 5 páginas no menu, baseado em texto/screenshots, não um tutorial
jogável.

**O que a 0.5.0 mudou:** primeira run guiada e pulável, com tutorial na fase 0 e
cinco coach marks contextuais (mover/lançar, XP/perk, blocos especiais, chefes e Endless); o card
do tutorial aparece antes das seis fases. O skip conclui e libera o level 1.

**Por que isso ainda importa:** o revisor pode pular o tutorial e voltar a ver
só o menu; testar os dois caminhos no Preview e garantir que a promessa
(quebrar, multiball, perk, boss) aparece nos primeiros segundos.

**O que ainda pode melhorar:** CTA principal direto para a fase 1/tutorial em 1
clique; objetivo e recompensa visíveis na tela de fase.

### 5.3 Originalidade percebida e coerência capa ↔ jogo — **alta/média**

**Evidência oficial:** “Originality: game names, assets, and overall content
should exhibit originality”; o FAQ lista “unoriginal content (e.g. clones or
asset flips)” como motivo de reprovação. O jogo não pode ser facilmente
confundido com outro, e nome/imagens da CrazyGames devem refletir o que o
jogador vai experimentar.

**Risco:** “block breaker” é um gênero muito saturado. Se o reviewer vê mais um
Breakout com arte pixel e um nome genérico, ele pode concluir “generic” sem
chegar ao diferencial roguelite (perks, bosses, endless). Se a capa é vetorial
lisa e o jogo é pixel art escuro, a incoerência piora a percepção.

**O que fazer:** liderar a primeira impressão com o diferencial (roguelite,
perks, bosses, endless) no vídeo, nas 3 capas, nos screenshots e nos primeiros
10 s; garantir que a capa pareça o mesmo jogo; evitar nome/ícone que lembre
outro título.

### 5.4 Playgama Bridge e ads — risco reduzido no build 0.5.0

**Evidência oficial:** no Basic Implementation, “CrazyGames monetization is
disabled” e **“No external ads”**. O jogo não pode exibir ads de outra rede nem
cross-promotion.

**Estado do build 0.5.0:** o Vite passou a usar `playgamaBridge({ mode: 'local' })`.
O `index.html` carrega apenas `./playgama-bridge.js` do próprio ZIP; não há mais
request ao CDN da Playgama no boot. No CrazyGames, o adapter nativo do Bridge
detecta o portal e usa o SDK do próprio CrazyGames; a configuração mantém
`sendAnalyticsEvents: false` e não há banners/logo da Playgama. O único script
externo restante é o SDK do CrazyGames, carregado pelo adapter quando o host é
do portal — que é o comportamento esperado.

**O que ainda validar no Preview:** nenhum request a `api.playgama.com` ou
`bridge.playgama.com`; nenhum logo/link da Playgama; nenhum ad de rede externa;
boot rápido mesmo com a rede bloqueada. O timeout de 10 s continua como rede de
segurança.

### 5.5 Áudio e “game feel” — **média**

**Evidência oficial:** áudio de alta qualidade, níveis consistentes, música que
complementa o visual. O review interno já aponta loop ambiente curto e
repetitivo.

**Risco:** não costuma ser motivo isolado, mas contribui para a impressão de
“prototype” em uma sessão curta. Efeitos de quebra, combo, laser e level-up
precisam ser satisfatórios e não cansativos.

**O que fazer:** 2–3 camadas de música/variação, mixagem de SFX, toggle de
música separado (já existe), testar em fones e alto-falante.

### 5.6 Performance e carregamento — **baixa para o jogo, média para o boot**

**Evidência do build:** o jogo é leve: ZIP ~1,5 MB, build ~3,0 MB, heap JS
~20–30 MB no baseline headless. A CrazyGames exige funcionar bem em Chromebook
de 4 GB, mas um canvas 2D/WebGL desse tamanho não deve ser o gargalo.

**Onde ainda pode doer:** o SDK nativo do CrazyGames (script externo do próprio
portal), muitos assets sem cache no primeiro load, DPR alto em telas 4K,
WebGL/SwiftShader em ambiente de QA e erros de console/404. A doc oficial fala
em “load quickly” e “≤ 20 s até o gameplay” para arquivos externos. O Bridge da
Playgama não está mais no caminho crítico.

**O que fazer:** medir com `docs/qa/performance-testing.md`; se o jogo passar
folgado, não gaste o próximo ciclo em micro-otimização — o problema é
apresentação/onboarding/originalidade.

### 5.7 Metadata, capas e vídeo — **média**

**Evidência oficial:** capas em 3 tamanhos, sem texto além do título, sem logos
ou material de terceiros; descrição e controles; vídeo de preview; a arte deve
refletir o jogo. O FAQ exige inglês.

**Risco:** capa/screenshot de uma versão antiga, vídeo que não mostra o loop
real, descrição com features que não existem, ou arte da capa que parece outro
jogo. Isso é barato de corrigir e afeta a primeira impressão da review.

**O que fazer:** regenerar tudo a partir do build `0.4.0`/próximo, revisar
contraste e texto, garantir 3 tamanhos, vídeo de 15–30 s mostrando menu →
gameplay → perk → boss/endless.

### 5.8 Problemas técnicos e de compliance — **média**

- Botão próprio de fullscreen (proibido; o portal fornece).
- Links de cross-promotion, App Store, Steam ou outros jogos no menu.
- Conteúdo acima de PEGI 12 ou direcionado a crianças.
- Texto em inglês ausente, ambíguo ou com tradução ruim.
- Erros de console, 404, assets com caminho absoluto, requests externos.
- SDK/eventos no momento errado; áudio que continua durante ad/pause.
- Save quebrado ou progresso perdido.

**O que fazer:** rodar o checklist do Preview e uma sessão manual em janela
anônima, com console aberto, em desktop e mobile.

### 5.9 Controles mobile — **baixa/média**

**Evidência oficial:** o jogo deve ter controles intuitivos por dispositivo;
portrait é aceito, especialmente se mobile-friendly. A CrazyGames recomenda usar
o `systemInfo` do SDK em vez de detectar touch por `ontouchstart`, porque laptops
com tela touch existem.

**Risco:** o controle é drag/tap, o que é adequado para block breaker. Os
problemas típicos são o paddle ficar sob o dedo, área de toque pequena, safe area
do app, double-tap zoom/seleção e ausência de feedback ao arrastar. Em 390×844 e
800×450, testar com o dedo (ou emulação touch) e confirmar que o jogo não exige
precisão de 1 px.

**O que fazer:** testar em Android/iPhone reais, com o jogo dentro do app da
CrazyGames se possível; garantir `touch-action: none`, `user-select: none`, safe
area e paddle acima do dedo. Não é a causa mais provável, mas é barato validar.

### 5.10 Retenção/profundidade — **só se foi Basic Launch**

Se a rejeição for de Basic Launch, a causa provável não é “arte”: é KPI. A
própria doc diz que avg playtime, D1 e conversão são comparados com benchmarks;
jogos com a maioria abaixo do benchmark não avançam. Nesse caso, o suporte deve
mostrar os números, e o plano precisa ser retenção (metaprogressão, daily,
leaderboard, mais conteúdo), não só polimento visual.

---

## 6. Plano de ação sugerido (próximo ciclo)

### P0 — antes de qualquer reenvio

1. **Ter um pacote CrazyGames limpo:** sem script/ads/branding da Playgama; sem
   requests externos; boot rápido mesmo com rede bloqueada.
2. **Redesenhar a apresentação desktop:** moldura intencional, HUD legível em
   907×510/1920×1080, DPR 1; não parecer um telefone no meio do preto.
3. **Onboarding no gameplay:** primeira run guiada, pulável, visual, e CTA do
   menu direto para a fase 1 (1 clique).
4. **Reforçar o diferencial:** perks, bosses, endless e “roguelite” visíveis nos
   primeiros 10 s, na capa, no vídeo e na descrição.
5. **Regenerar capas/screenshots/vídeo** do build novo, coerentes entre si.
6. **Rodar o Preview** nos seis tamanhos e com o Bridge bloqueado; console
   limpo, sem ads externos.

### P1 — se quiser aumentar a chance

- Aumentar variedade/mixagem do áudio.
- Metaprogressão leve, conquistas, daily/leaderboard.
- Localização PT-BR/ES (inglês obrigatório; traduções precisam ser boas).
- Sessão de playtest com 5 pessoas externas (ver
  `docs/qa/playtest-kit.md`).

### P2 — depois de entrar

- Full Launch: SDK CrazyGames, 1 clique/direto ao gameplay, save na conta,
  rewarded/interstitial dentro das regras, analytics.
- A/B test de capas e vídeo.

---

## 7. O que **não** fazer

- Reenviar `0.4.0` com pequenas mudanças e esperar resultado diferente.
- Integrar o SDK da CrazyGames só para “passar no QA” sem cumprir os requisitos
  de Full Launch.
- Copiar um block breaker popular ou usar assets de terceiros.
- Colocar ads de outro portal no build da CrazyGames.
- Pedir feedback de forma genérica (“what’s wrong?”) sem jogo/ID/build.
- Criar múltiplas contas ou tickets.

---

## 8. Fontes principais

Acessadas em 2026-11-11.

| Fonte | Uso |
|---|---|
| <https://docs.crazygames.com/> | Processo Basic/Full Launch, 7–21 dias, 500 plays, critérios de progressão |
| <https://docs.crazygames.com/faq/> | QA inicial vs Basic Launch, feedback construtivo, reenvio, preview, contato |
| <https://docs.crazygames.com/requirements/intro/> | Tabela de requisitos, QA tool, SDK opcional no Basic |
| <https://docs.crazygames.com/requirements/gameplay/> | Readable Content, iframes 907×510 etc., originalidade, fullscreen, PEGI 12 |
| <https://docs.crazygames.com/requirements/quality/> | Onboarding, estética, áudio, originalidade, UI |
| <https://docs.crazygames.com/requirements/technical/> | Chromebook 4 GB, Chrome/Edge, mobile, limites de tamanho, SDK |
| <https://docs.crazygames.com/resources/basic-launch-metrics/> | Avg playtime, D1, conversão, benchmarks |
| <https://docs.crazygames.com/sdk/intro/> | Preview/QA environment em `crazygames.com/preview` |
| <https://files.crazygames.com/documents/developer_terms_20250818.pdf> | `technical-support@crazygames.com` (§5.8) |
| <https://wonderlandengine.com/tutorials/upsdk-crazygames/> | Fluxo “Submit a game → Preview” (terceiro) |
| <https://www.reddit.com/r/Unity3D/comments/1uyxikq/why_does_crazy_games_keep_rejecting_my_game/> | Relato da mensagem genérica |
| <https://www.reddit.com/r/gamedev/comments/1xlco7n/has_anyone_been_rejected_by_crazygames_or_poki/> | Relato de rejeição de uma linha |
| <https://www.trustpilot.com/review/crazygames.com> | Relatos de feedback vago (2026) |

**Nota de método:** o Developer Portal exige login e não foi acessado por este
agente. As instruções de Preview/Support vêm da documentação pública e de
tutoriais de terceiros; a existência de um relatório detalhado de QA **não** é
documentada publicamente. Trate o QA tool como ambiente de teste, não como
canal de apelação.
