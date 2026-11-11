# Publicação de jogos HTML5 — guia técnico e estratégico

**Escopo:** itch.io, GameFlare, Playgama e CrazyGames. **Um build HTML5, um ZIP,
quatro portais.** Este guia cobre estratégia, arquitetura, requisitos, ads, save,
metadata, QA e release. Regras comerciais aparecem só quando mudam uma decisão
técnica ou a ordem de entrada.

**Como usar:** §0–§1 decidem a estratégia; §2–§4 implementam; §5–§9 validam e
publicam; §10 é o checklist; §11 são anti-padrões; §12 é o case study.

> **Base:** aprendizados do Bricklike até 2026-11-11. Estado na data: 0.5.1 no
> itch.io e no sandbox da Playgama; CrazyGames em review; GameFlare bloqueado por
> acesso à conta; nenhuma tag ou GitHub Release.
>
> Este arquivo consolida o antigo `spec-tecnica-publicacao.md` e o
> `plano-baixa-fricao.md`. O plano original está em
> [`old/plans/plano-baixa-fricao.md`](old/plans/plano-baixa-fricao.md).

---

## 0. Resumo executivo

| Decisão | Padrão | Por quê |
|---|---|---|
| Build | Um ZIP para todos os portais | Cada variante é manutenção e divergência |
| Arquitetura | `PlatformService` + adapter por host | Gameplay não conhece portal |
| Runtime | Bridge local fora do CrazyGames; SDK nativo nele | Zero request à Playgama no boot |
| Ordem | itch.io → GameFlare → Playgama → CrazyGames Basic | Publica rápido e deixa o portal mais exigente por último |
| Ads | Só via SDK, em pausa natural, com caminho sem ad | Adblock e fill baixo são normais |
| Save | Storage do SDK, com fallback e aviso | `localStorage` direto quebra em iframe |
| Review | Corrigir o jogo, não só o formulário | Rejeição genérica raramente tem uma causa |
| Release | Tag só após teste humano e aprovação | Reenvio e tag não são a mesma coisa |

**Não negociáveis:** `index.html` na raiz do ZIP; caminhos relativos; zero
recursos externos além do SDK do portal; storage via SDK; ads apenas via SDK;
recompensa só em `rewarded`; `game_ready` no primeiro frame jogável; pause/mute
de áudio; inglês como padrão e fallback; sem login obrigatório.

---

## 1. Estratégia de distribuição

### 1.1 Por que esses quatro

| Portal | Papel | Barreira | Modelo (na data) |
|---|---|---|---|
| **itch.io** | Publicar hoje e aprender sem gatekeeper | Sem SDK/QA/review; ZIP HTML5 | você define a fatia do itch.io (default 10%); piso US$ 5 |
| **GameFlare** | Primeiro dinheiro com pouca fricção | HTML5 puro; conta pode travar | 85% site próprio / 50% publisher; piso € 50 |
| **Playgama** | Alcance e rede de parceiros | Bridge obrigatório; review e sandbox | 70% até US$ 1k / 80% até US$ 3k / 90% acima; piso US$ 100 |
| **CrazyGames** | Teste de retenção em audiência grande | QA de qualidade e, depois, Full Launch | Basic sem receita; Full conforme contrato |

O itch.io é o único canal sem intermediário: o link existe no mesmo dia e o
feedback vem do jogador. O GameFlare é o primeiro revenue share com barreira
baixa, mas a conta pode ser o caminho crítico — verifique o acesso **antes** de
contar com ele. A Playgama distribui o mesmo build para o portal e para **100+
parceiros**, mas exige Bridge. O CrazyGames Basic é um teste de retenção gratuito
antes do Full Launch.

O Bridge é open source (LGPL-3.0) e cobre 25+ plataformas. A Playgama também é
distribuidora e autora de guias comparativos: leia o contrato, não só o blog.

### 1.2 Ordem de execução

| Passo | Ação | Gate |
|---|---|---|
| 0 | Criar e verificar contas | Acesso funcionando; sem conta duplicada |
| 1 | Fechar arquitetura e contrato (§2) | Build roda em mock, fallback e portal |
| 2 | Publicar no itch.io | ZIP abre em iframe; save funciona |
| 3 | Publicar no GameFlare | Mesmo ZIP/hash |
| 4 | Playgama sandbox | Bridge, `game_ready`, ads e save válidos |
| 5 | CrazyGames Basic | QA sem erro bloqueante; assets/form corretos |
| 6 | Full Launch / novos portais | Métricas do Basic e SDK completo |

O CrazyGames é o gargalo; os outros aceitam o build em minutos ou horas. Se o
Basic reprovar, a causa mais comum é apresentação, onboarding ou fluxo de ads.
Trate `failed`/`skipped` como caminho normal desde o primeiro dia.

### 1.3 Expectativa de receita

eCPM web Tier-3 é **US$ 1–3** (Brasil/Índia) contra **US$ 15–28** nos EUA.
Depois de um split de 50%, o tráfego Tier-3 rende ~**US$ 0,50–1,50 por mil
impressões**. No itch.io, 80% dos jogos pagos ficam em **US$ 0–50/mês**; a
maioria não passa de **US$ 100 na vida**.

Não trate os primeiros meses como problema de distribuição. As saídas mais
saudáveis são vender o jogo (itch.io: fatia 0–100%, piso US$ 5) ou usar o portal
como topo de funil para o seu produto/Steam. Otimize retenção antes de receita.

### 1.4 O que adiar

| Portal | Modelo (na data) | Por quê |
|---|---|---|
| **GameDistribution** | 33% da net revenue; € 100; até 60 dias | Exige build sempre idêntico ao mais recente em qualquer plataforma (cláusula 2.6.4); amarra a pipeline |
| **Famobi** | € 250; 45 dias | Fatura/TIN/VAT e fricção administrativa |
| **Addicting Games** | Sem compensação | Termos dizem que submissão não gera pagamento nem revenue share sem acordo escrito |
| **Discord Premium Apps** | US$ 100 + US$ 25 | Só EUA, Reino Unido ou UE |
| **Poki** | 100% (exclusivo) / 50%; exclusividade 5 anos (7 na página “Bonus Level”) | Inclui web, Discord e YouTube Playables; só depois de provar retenção |

Termos comerciais mudam; revalide na data do upload.

### 1.5 Regras de ouro

1. **Um build, um ZIP.** Variante de portal nasce de configuração de runtime.
2. **Portal é distribuição, não produto.** O jogo se sustenta sem o tráfego dele.
3. **Meça antes de monetizar.** Jogo que não segura 3 minutos não melhora com
   mais interstitials.

---

## 2. Arquitetura de build único

### 2.1 Camada de plataforma

O jogo conversa com uma interface estável (`PlatformService`) que expõe storage,
ads, lifecycle, idioma, pause e áudio. O **boot** detecta o host e escolhe o
adapter; o gameplay nunca pergunta “qual é o portal?”.

```text
main
  → boot
      → host CrazyGames?       → CrazyGamesAdapter (SDK nativo)
      → outro host?            → ./playgama-bridge.js → BridgeAdapter
      → falha, timeout, mock?  → FallbackAdapter (memória/localStorage)
  → jogo
```

- **Nenhum `if (platform === ...)` no gameplay.** Condicional de host só no boot.
- **Sempre existe fallback.** SDK bloqueado, script lento ou host desconhecido
  não pode impedir o jogo de abrir.
- **O contrato é o mesmo em todo lugar.** O jogo não sabe se o storage é
  `sdk.data`, storage da Playgama ou `localStorage`.
- **O adapter é testável sozinho.** Contrato + testes evitam regressão quando o
  SDK muda.

### 2.2 Runtime por portal

| Portal | Runtime | Storage | Ads | `game_ready` |
|---|---|---|---|---|
| itch.io | Bridge local → mock | `localStorage` (fallback) | Não | No-op |
| GameFlare | Bridge local → mock | `localStorage` (fallback) | Não (portal serve ao redor) | No-op |
| Playgama | Bridge local → nativo | Storage da conta | Sim, via Bridge | **Obrigatório** |
| CrazyGames | Adapter nativo | `sdk.data` (Data Module) | Basic off / Full SDK | No-op |
| GitHub Pages | Bridge local → mock | `localStorage` | Não | No-op |

O Bridge tem adapter nativo para CrazyGames e o mesmo build funcionaria por ele.
A 0.5.1 falou **direto** com o SDK para eliminar o runtime da Playgama no boot.
O custo é manter o adapter e seus testes; se isso não compensar, use o Bridge em
todos os portais e aceite o request adicional.

### 2.3 Contrato de código

**Init com timeout.** A promise do SDK pode nunca resolver (script bloqueado por
adblocker). Corra contra um timeout e entre no jogo de qualquer forma.

```javascript
await Promise.race([
  platform.initialize(),
  new Promise((resolve) => setTimeout(resolve, 10000)),
])
```

**Storage.** Use o serviço de storage, nunca `localStorage` direto. No Bridge,
`set` recebe arrays de mesmo tamanho; objeto não funciona. Chave ausente em
`get` retorna `null` — sempre tenha default.

```javascript
const [level, coins] = await platform.storage.get(['level', 'coins'])
await platform.storage.set(['level', 'coins'], [3, 120])
```

**Ads.** Verifique suporte antes de mostrar UI. Existe caminho sem ad para todo
conteúdo; recompensa só em `rewarded`, nunca em `closed`; `failed` e `adError`
significam “sem ad” e o jogo continua.

**Lifecycle.** `game_ready` **uma vez**, no primeiro frame jogável e interativo —
nunca durante o loading. Emita `level_started/paused/resumed/completed/failed`
nos momentos reais. Se o portal tiver loading start/stop, use.

**Pause e áudio.** Assine pause e mute; a plataforma dispara ao trocar de aba,
minimizar, abrir ad ou usar o mute do portal. Mute em ads/background e restaure
só após gesto (`touchend`/`click`) — no iOS o `AudioContext` fica `suspended`.

**Idioma.** Use o idioma da plataforma quando existir; fallback inglês. Não
dependa do idioma do browser em portal que define o idioma do usuário.

### 2.4 Bridge: local, CDN ou híbrido

| Forma | Tamanho/requests | Quando usar |
|---|---|---|
| CDN | ~116 KB + chunk por plataforma; 1+ request | Padrão da Playgama; o build dela pode reescrever a tag |
| **Local** | ~300 KB no ZIP; **zero requests** | **Recomendado** fora do CrazyGames |
| CDN + fallback | ~116 KB + ~300 KB; 1 request | Se quiser os dois e aceitar a complexidade |

Vendorize o runtime local e copie para a raiz do `dist/`, ao lado do
`index.html`. No modo CDN, o chunk da plataforma só é baixado quando ela é
detectada; no mock, nenhum chunk é buscado. Em Vite, use `base: './'`.

### 2.5 `playgama-bridge-config.json`

Fica **ao lado do `index.html`**. Sem ele, `placementFallback` fica vazio.

```json
{
  "showFullLoadingLogo": false,
  "showLoadingText": true,
  "sendAnalyticsEvents": false,
  "game": { "adaptToSafeArea": true },
  "advertisement": {
    "minimumDelayBetweenInterstitial": 60,
    "initialInterstitialDelay": 0,
    "interstitial": { "placementFallback": "level_completed" },
    "rewarded": { "placementFallback": "extra_life" }
  }
}
```

| Chave | Motivo |
|---|---|
| `showFullLoadingLogo: false` | A tela branded da Playgama aparece em todas as plataformas, inclusive itch.io/GameFlare |
| `showLoadingText: true` | Mantém progresso legível sem logo alheio |
| `sendAnalyticsEvents: false` | Por padrão envia a `api.playgama.com` em qualquer portal; `false` desliga em todas **exceto Playgama** |
| `game.adaptToSafeArea: true` | Notch e barra de gestos |
| `minimumDelayBetweenInterstitial: 60` | Cooldown mínimo entre interstitials |
| `initialInterstitialDelay: 0` | O default é **30 s**; nessa janela todo `showInterstitial()` falha |

**Override por plataforma:** `platforms` faz deep merge pelo ID detectado.
itch.io e GameFlare caem em `mock`:

```json
{ "platforms": { "mock": { "sendAnalyticsEvents": false, "showFullLoadingLogo": false } } }
```

IDs úteis: `playgama`, `crazy_games`, `mock`. Valide o schema da versão usada no
CI.

### 2.6 Adapter nativo do CrazyGames

| Contrato do jogo | SDK do CrazyGames |
|---|---|
| `gameplayStart` / `gameplayStop` | `sdk.game.gameplayStart()` / `gameplayStop()` |
| loading start/stop | `sdk.game.loadingStart()` / `loadingStop()` |
| `happytime` | `sdk.game.happytime()` |
| storage `get` / `set` | `sdk.data.getItem()` / `setItem()` |
| mute do portal | listener de áudio do SDK |
| `game_ready` | sem equivalente; no-op |

- **Sitelock não vem de graça.** O Bridge não implementa whitelist de origens.
  Se houver sitelock próprio, inclua todas as origens do CrazyGames, inclusive
  apps iOS/Android; a lista muda.
- **Basic Launch sem ads.** O SDK pode logar `[BannerError] bannersDisabled`;
  é ruído do portal, não erro do jogo.
- **SDK bloqueado.** Trate timeout e caia no fallback: o jogo abre sem ads e sem
  save de conta.
- **Custo.** Você assume contrato e testes do adapter; o Bridge nativo é a
  alternativa.

---

## 3. Requisitos universais do build

| Item | Exigência |
|---|---|
| Formato | HTML5 puro; sem wrapper nativo, plugin ou Flash |
| Entry point | `index.html` na **raiz** do ZIP |
| Caminhos | **Relativos** em todos os assets |
| Recursos externos | **Zero** para o jogo, exceto o SDK do portal; fonte, textura, áudio, WASM, lib e dado vão no ZIP |
| Threading | Export **single-threaded**; `SharedArrayBuffer` exige COOP/COEP e o iframe não é seu |
| Analytics | Nada de GA4 ou rede externa; use o módulo do Bridge ou o dashboard do portal |
| Persistência | Só via storage do SDK; nunca `localStorage` direto |
| Áudio | Mutado em ads/background; restaurado após gesto; ogg/mp3, nunca wav |
| Responsividade | Sem scrollbar, corte ou sobreposição; pop-up com fechar; campo até a borda; aspect ratio ≤ 1:2 |
| Toque | Gestos no mobile; mouse/teclado no desktop; sem player do sistema; sem aviso de WebGL na abertura |
| Rotação | Progresso preservado ao mudar a orientação |
| Login | Não exigir registro ou autorização externa para abrir |
| Idioma | **Inglês** como padrão e fallback; outros idiomas declarados, todos traduzidos |
| Ads | Só via SDK do portal; pausar gameplay e mutar áudio durante o ad |
| Assets | Comprimir texturas/áudio; essencial no primeiro frame, resto em background |
| Nome | Idêntico em todos os idiomas e metadados |

**Playgama (reprovação automática):** Bridge não integrado · `game_ready` não
enviado · progresso não salvo via SDK · ad que interrompe gameplay, não pausa som
ou não entrega a recompensa · crash/freeze · interface cortada · analytics
externo · nome divergente · cópia de jogo do catálogo · violação de copyright.

**CrazyGames (qualidade):** onboarding in-game curto, pulável e visual ·
legibilidade em DPR 1 nos iframes 16:9 e no mobile · estética consistente ·
objetivos/controles claros · originalidade e facilidade de atualizar · áudio
coerente.

**Geral:** jogo genérico, capa que não corresponde ao jogo, tutorial só no menu,
HUD ilegível no desktop e build que não roda em Chromebook 4 GB pesam mais que a
densidade de ads.

**IA generativa:** aceita para história, lógica e matemática. **Não** aceita jogo
100% IA sem refino humano substancial dos visuais; esses títulos performam mais
de 2x pior.

---

## 4. Portais

### 4.1 Limites

| | itch.io | GameFlare | Playgama | CrazyGames |
|---|---|---|---|---|
| Total | ≤ 500 MB extraído | — | ≤ 300 MB compactado | ≤ 250 MB |
| Arquivos | ≤ 1.000 | — | — | ≤ 1.500 |
| Arquivo individual | ≤ 200 MB | — | — | — |
| Caminho + nome | ≤ 240 caracteres | — | — | — |
| Download inicial | — | — | — | ≤ 50 MB (≤ 20 MB mobile home) |
| Formato | `.zip` | ZIP ou link | ZIP | ZIP |
| Nomes | case-sensitive, UTF-8 | — | **latinos apenas** | — |

No CrazyGames, o download inicial vai do load até o primeiro `gameplayStart`.
Com Bridge, vai até o `GAMEPLAY_STARTED`; envie no momento certo, não no boot.

**Benchmark de engenharia:** ~5 MB no primeiro load e ~8 MB no total (referência
do Poki) é um alvo melhor que o teto dos portais, mesmo quando eles aceitam mais.
Se vier de Unity/Godot, exporte WASM single-threaded e otimize o primeiro load.

### 4.2 itch.io

- Sem SDK/QA/review; publicação imediata.
- Recursos externos só por HTTPS; o build é servido em subdiretório do CDN.
- Embed: *click to play* é o default; ative **Mobile Friendly** para fullscreen
  no celular.
- HTML5 em iframe só aceita **doação**; para vender, “Kind of Game” =
  Downloadable.
- Sem ads: não chame `showInterstitial()`; o estado vai a `FAILED` e o jogo
  segue.

### 4.3 GameFlare

- Sem SDK obrigatório; o SDK é apenas sitelock, opcional.
- Sem ads internos; o GameFlare serve ao redor do jogo.
- Backend próprio (multiplayer) precisa de HTTPS.
- Conta/acesso podem ser o bloqueio real; resolva antes. Não crie conta duplicada
  sem orientação do suporte.

### 4.4 Playgama

Bridge obrigatório; review em ~24h (não garantido). Sandbox → catálogo exige
milestones de retenção/qualidade: sessão média, conclusão, uso do Bridge,
estabilidade e qualidade percebida.

- **Interstitial em pausa natural** é obrigatório para qualificar na revenue
  share.
- `game_ready` é obrigatório para moderação.
- Módulos opcionais: rewarded, banners, adblock detection, pagamentos,
  leaderboards, achievements, daily rewards, social, remote config, analytics.
- Engines com pacote oficial: JS Core, Unity, Construct 3, GDevelop, Godot
  3.x/4.x, GameMaker, Defold, Cocos Creator, Scratch.
- Navegadores: Chrome, Firefox, Opera, Safari e Edge; confirme mínimos no upload.

**Parceiros** — o build sai no playgama.com e na rede:

| Parceiro | Requisito |
|---|---|
| MSN | < 50 MB; landscape ou landscape+portrait |
| VK | Russo default, interface traduzida, safe zones, > 10 min |
| Yandex / Playhop | Suportar russo |
| Facebook | ≤ 200 MB, ≤ 500 arquivos, Brotli/Gzip, loading < 3 s; Unity: Decompression Fallback `off` |
| GameDistribution | Sem links de saída, hospedado internamente, sem sangue explícito |

**Sandbox não é veredito.** Amostra pequena oscila; use como sinal e meça de
novo após mudanças grandes.

### 4.5 CrazyGames

| | Basic Launch | Full Launch |
|---|---|---|
| SDK | Opcional | Obrigatório |
| Ads | Desligados | Via SDK, sem rede externa |
| Receita | Zero | Contrato comercial |
| Duração | ≥ 7 dias e ≥ 500 plays; sem 500, encerra aos 21 dias | Contínuo |
| Entrada | Menu permitido | Gameplay direto ou ≤ 1 clique |
| Progresso | Local (SDK opcional) | Vinculado à conta CrazyGames |

**Ads:** pausar o jogo e bloquear a UI até `adFinished`/`adError`; mutar quando o
ad começa a tocar, não no request; `adError` é normal e o jogo continua; só em
pausa natural; sem cadeia/interrupção; rewarded só com recompensa real; a
frequência de midgame é da plataforma (máx. 1 a cada 3 min).

**Compatibilidade:** Chrome/Edge (Safari pode ser desabilitado se falhar);
Chromebook 4 GB; mouse/teclado/toque; landscape no desktop, portrait se mobile
friendly; Unity desabilitado no iOS por padrão; DPR = 1 em iOS/Android de baixa
memória; safe area; física consistente em 144/165 Hz; sem aviso de WebGL; sem
limite por URL; inglês obrigatório; PEGI 12/13+.

**Formulário:** só existe **Mobile orientation**; portrait marca **PORTRAIT**,
desktop é landscape por premissa. Save = **“Yes, using the Data Module from the
CrazyGames SDK”**, não LocalStorage. Marque o suporte a mute via SDK.

**Assets:** 3 capas — 1920×1080, 800×1200 e 800×800 — com visual consistente;
sem bordas, texto além do título, “New”/“Play now”, ícones/logos, terceiros ou
pixelização; não use screenshot puro. Vídeo de preview, título, controles e
descrição ≥ 100 palavras.

**Review:** a mensagem costuma ser genérica. O QA tool/Preview é ambiente de
teste, **não** apelação. Peça detalhes no Support do Developer Portal ou
`technical-support@crazygames.com`, com título, game/submission ID, build, data e
e-mail. Reenvio é **nova submissão**, com melhorias claras; não reenvie o mesmo
build.

---

## 5. Orientação, layout e legibilidade

**Orientação mobile e container desktop são coisas diferentes.**

- **Mobile:** o formulário do CrazyGames permite declarar `PORTRAIT` ou
  `LANDSCAPE`; um jogo portrait marca `PORTRAIT`.
- **Desktop:** não existe campo de orientação. O portal exibe o jogo em iframe
  landscape 16:9 e assume PC landscape. A página de preview mostra
  “Landscape / Portrait” como exibição genérica, não configuração.
- **Portrait em iframe landscape:** o jogo vira uma faixa estreita. Bricklike
  0.5.1: em 907×510, iframe 606×297 e shell 167×297; em 1920×1080, iframe
  1476×786 e shell 442×786.
- **Side art não resolve.** Ela preenche as laterais e melhora a apresentação,
  mas não aumenta o shell nem a área jogável.

Decida no começo:

1. **Portrait-first, desktop secundário:** aceite o shell estreito, mas garanta
   HUD legível em DPR 1 nos tamanhos 907×510, 800×450, 1216×684, 1280×720 e
   1920×1080.
2. **Desktop é importante:** projete um modo landscape jogável ou um shell
   desktop com área ampliada. Retrofit é caro.
3. **Nunca dependa de “o portal vai ajustar”.**

Também valem safe area, rotação com progresso preservado, sem scrollbar/corte e
todo pop-up com fechar.

---

## 6. Ads

### 6.1 Princípios

- **Só via SDK do portal.** Nada de rede de terceiros, nem para testar.
- **Pausa natural:** transição de level, fim de onda, morte, retorno ao menu.
- **Caminho sem ad** para todo conteúdo com rewarded.
- **Recompensa só em `rewarded`**, nunca em `closed`.
- **Falha é normal:** `failed`, `skipped`, `adError` e timeout = “sem ad”.
- **Pause e mute** durante o ad.
- **Frequência conservadora:** a plataforma controla o midgame; não empilhe.

### 6.2 Cadência de referência (Bricklike 0.5.1)

| Momento | Regra |
|---|---|
| Tutorial | Sem ads |
| Campanha | Só com próxima onda e onda limpa múltipla de 3 |
| Endless | A cada 4 ondas |
| Saída de results/pause | Cooldown de 60 s; suprimido após rewarded revive |
| Rewarded revive | 1×/run, só na oferta |
| Cooldown global | `minimumDelayBetweenInterstitial: 60`; `initialInterstitialDelay: 0` |

É um exemplo conservador, não uma obrigação. A regra universal é pausa natural,
sem cadeia, sem bloquear e com alternativa.

### 6.3 Implementação e QA

- `AdOverlay` bloqueia botões/input; spinner até `adFinished`/`adError`; timeout
  de ~15 s.
- Estados: `shown`, `skipped`, `failed`, `rewarded`; trate todos.
- No Basic Launch os ads estão off: o fluxo pode voltar `failed`/`skipped`.
- QA sem portal: `?debug=1&adMock=show`, `fail`, `rewarded`, `rewarded-fail`.
  O proxy é debug-only; storage/lifecycle/config continuam reais.
- Nunca divulgue URL com `debug=1`.

---

## 7. Save e progresso

- **Uma abstração só:** `StorageService`; o jogo nunca chama `localStorage`.
- **Bridge:** `get([keys])`/`set([keys],[values])`, arrays de mesmo tamanho;
  chave ausente = `null`. **CrazyGames:** `sdk.data` (Data Module).
- **Formulário:** “Yes, using the Data Module”, não LocalStorage. “Progress may
  not be saved” no QA pode ser falha do `getItem`, não do save de produção.
- **Schema versionado:** campos novos compatíveis; progresso com faixa e clamp;
  save antigo não quebra.
- **Default seguro:** sem save começa do zero; corrompido descarta e avisa.
- **Fallback visível:** storage falhou/timeout → memória + aviso com pop-up.
- **Reset explícito:** flag de QA (ex.: `?resetSave=1`) ou opção de menu.
- **Privacidade:** sem PII; storage do portal é para progresso/settings.

Teste reload, nova sessão, rotação, minimizar, abrir ad, save antigo/corrompido,
storage bloqueado e reset.

---

## 8. Metadata e assets

- **Tudo nasce do build atual.** Capas, screenshots, vídeo e How to Play de
  versão antiga são erro comum e visível.
- **CrazyGames:** 3 capas (1920×1080, 800×1200, 800×800), vídeo, descrição ≥ 100
  palavras, controles e título.
- **Capa:** sem bordas, texto além do título, “New”/“Play now”, ícones/logos,
  terceiros ou pixelização; não use screenshot puro.
- **Consistência capa ↔ jogo:** capa lisa/gradiente + jogo pixelado parece
  “outro jogo”.
- **Screenshots** mostram o jogo real, HUD legível e momentos que vendem a
  fantasia (tutorial, level-up, chefe, Endless).
- **How to Play** com imagens atuais; onboarding principal in-game.
- **Idioma:** UI e metadata em inglês; outros só se completos; nome do app
  idêntico.
- **Organização:** `store/` para capas/screenshots/vídeo; pasta de assets do jogo
  para How to Play; manifest com versão, tamanho e SHA-256.

---

## 9. QA, build e release

### 9.1 Gates

Exemplo de sequência; adapte os scripts ao projeto:

```bash
npm ci
npm run typecheck
npm test
npm run validate:content
node scripts/validate-bridge-config.mjs
npm run build
npm run package
npm run test:e2e
```

Referência Bricklike 0.5.1: **329 testes**/29 arquivos; **31 E2E**/9 specs; **7
níveis, 22 ondas, 743 blocos, 1.809 XP**.

### 9.2 Matriz de teste

| Área | O que testar |
|---|---|
| Desktop | Chrome/Edge em 907×510, 800×450, 1216×684, 1280×720, 1920×1080; DPR 1 |
| Mobile | iPhone Safari, Android Chrome; 320×568, 390×844, 800×450; toque/safe area |
| Hardware baixo | Chromebook 4 GB; heap/GC; load com cache frio |
| Mock | itch.io/GameFlare: save persiste, rewarded não trava, sem logo/analytics |
| Adblock/rede | SDK bloqueado, offline, lento, timeout: jogo abre e não congela |
| Ciclo de vida | trocar aba, minimizar, abrir ad, voltar; áudio muta/restaura |
| Rotação/save | progresso preservado; reload, save antigo/corrompido, reset |
| Ads | show/fail/rewarded/rewarded-fail; UI bloqueada; recompensa só em `rewarded` |
| Conteúdo | tutorial completo e skip; campanha; Endless; chefe; level-up |
| Console/Network | sem 404/erro bloqueante; sem request à Playgama fora da Playgama |

Sirva por HTTP local (nunca `file://`, que quebra WebGL/fetch). Teste o ZIP em
subpasta com `python3 -m http.server` e abra `/sub/`.

### 9.3 Empacotamento

O `dist/` contém `index.html`, config do Bridge e runtime local na raiz. O ZIP
contém o **conteúdo** de `dist/`, não a pasta `dist/`. O manifest registra nome,
versão, data, tamanho, **SHA-256**, contagem de arquivos, maior caminho e paths.

O validador falha se `index.html`/config não estiverem na raiz; houver path
absoluto ou import absoluto; houver URL externa não permitida; ou passar dos
limites adotados (ex.: 1.000 arquivos, 250 MB, 240 caracteres). Rode `unzip -l`,
`unzip -t` e confira o hash no manifest.

### 9.4 Preview, submissão e release

**Preview:** iframe/shell reais; boot/load; console; Network só com o SDK do
portal; storage e aviso de fallback; orientação; ads do Basic; HUD legível; capa
coerente.

**Submissão:** manual, mesmo ZIP/hash; formulário com Data Module, mute via SDK e
orientação mobile; mensagem de reenvio com mudanças concretas; review pode levar
dias; não abra tickets duplicados nem reenvie o mesmo build. Se reprovar, peça
requisitos específicos, corrija, teste e reenvie como **nova submissão**.

**Release:** só após teste humano, CI verde e aprovação:

```bash
git tag -a vX.Y.Z -m "Nome vX.Y.Z"
git push origin vX.Y.Z
```

O workflow empacota e publica ZIP + manifest; não rode o fallback manual junto.
GitHub Pages é review, não canal de submissão. Nunca tagueie antes da aprovação.

---

## 10. Checklist mestre

**Estratégia e contas**
- [ ] Contas verificadas (itch, GameFlare, Playgama, CrazyGames).
- [ ] Ordem, assets e textos prontos para o primeiro envio.
- [ ] Expectativa de receita realista; retenção antes de monetização.

**Arquitetura**
- [ ] `PlatformService` com storage, ads, lifecycle, idioma, pause e áudio.
- [ ] Boot escolhe adapter por host; fallback para mock/memória.
- [ ] Sem `if (platform === ...)` no gameplay; sem `localStorage` direto.
- [ ] Init com timeout; SDK bloqueado não impede o jogo de abrir.
- [ ] `game_ready` uma vez no primeiro frame jogável; eventos de level corretos.
- [ ] Pause/mute assinados; `AudioContext.resume()` no gesto.

**Build**
- [ ] `index.html` e config do Bridge na raiz do ZIP.
- [ ] Caminhos relativos; zero recursos externos além do SDK do portal.
- [ ] Single-threaded; sem GA4; sem request à Playgama fora da Playgama.
- [ ] Runtime local vendorizado; config validado no CI.
- [ ] Áudio ogg/mp3; texturas comprimidas; carregamento progressivo.
- [ ] ZIP ≤ 250 MB (CrazyGames) / ≤ 300 MB (Playgama); ≤ 1.000 arquivos
      (itch; CrazyGames permite 1.500); paths ≤ 240 caracteres.
- [ ] Manifest com versão, tamanho e SHA-256; `unzip -t` OK.

**Jogo e UI**
- [ ] Tutorial in-game curto, pulável, visual, sem ads.
- [ ] Caminho sem ad para todo conteúdo com rewarded.
- [ ] Ads em pausa natural; sem cadeia; `failed`/`skipped` não bloqueiam.
- [ ] Save via SDK; default, schema, migração, reset e fallback com aviso.
- [ ] HUD legível em DPR 1 e nos iframes 907×510/800×450/1216×684/1280×720/1920×1080.
- [ ] Sem scrollbar/corte/sobreposição; pop-up com fechar; safe area.
- [ ] Rotação preserva progresso; toque, mouse e teclado funcionam.
- [ ] Inglês completo; outros idiomas só se traduzidos; nome idêntico.

**Portal e assets**
- [ ] 3 capas do CrazyGames + vídeo + descrição ≥ 100 palavras + controles.
- [ ] Capas sem texto além do título, logos/bordas/terceiros; consistentes com o jogo.
- [ ] Screenshots, vídeo e How to Play do build atual.
- [ ] Formulário: Data Module, mute via SDK, mobile orientation correta.
- [ ] Preview QA medido; Network e console auditados.
- [ ] Teste em mock, adblock, hardware baixo e subpasta.
- [ ] Revisão humana concluída; CI verde; versão/hash registrados.
- [ ] Tag/release só após aprovação.

---

## 11. Anti-padrões

| Sintoma | Causa provável | Correção |
|---|---|---|
| Trava no loading | `initialize()` nunca resolve; SDK bloqueado | `Promise.race` com timeout; entrar de qualquer forma |
| Rewarded não faz nada | Sem caminho sem ad; suporte não verificado | Checar `isRewardedSupported`; oferecer equivalente |
| Congela ao passar de level | Código espera ad no Basic Launch, onde ads estão off | Tratar `failed`/`skipped`/`adError` como “sem ad” |
| Primeiro interstitial nunca aparece | `initialInterstitialDelay` default 30 s | `initialInterstitialDelay: 0` |
| Logo do Bridge no itch.io | Loading branded em todas as plataformas | `showFullLoadingLogo: false` + `showLoadingText: true` |
| Eventos em `api.playgama.com` fora da Playgama | Analytics interno ligado | `sendAnalyticsEvents: false` + override `mock` |
| Download inicial medido errado | Medição vai até `gameplayStart`, não até o bundle | Enviar `GAMEPLAY_STARTED` no momento certo |
| Save não persiste | `localStorage` direto ou formulário em LocalStorage | Storage do SDK + Data Module |
| Portal não carrega o ZIP | `index.html` aninhado em subpasta | `index.html` na raiz |
| Assets 404 | Paths absolutos | Converter para relativos |
| Jogo não abre | Boot/Bridge não inicializado | Init com timeout e fallback |
| Reprovado na Playgama | `game_ready` ausente ou save fora do SDK | Enviar no frame jogável; storage do SDK |
| Rejeitado sem motivo claro | Onboarding, legibilidade, consistência ou ads | Corrigir o jogo; pedir detalhes; reenviar com mudanças |
| Sem som no iOS | `AudioContext` suspended | `resume()` em `touchend`/`click` |
| Áudio em background | Sem listener de pause | Assinar pause + audio state |
| Crash em iOS | DPR/alocação excessiva | DPR 1 do portal; reduzir memória |
| Desabilitado no Safari/Chromebook | Não roda nos alvos | Testar Chrome/Edge e 4 GB RAM |
| Rejeitado por “AI-generated” | 100% IA sem refino visual | Refinar arte manualmente |
| Side art não resolve desktop | Shell portrait continua estreito | Layout desktop real ou aceitar o risco |
| Reenvio repetido sem mudança | Mesmo build, mesma mensagem | Nova submissão com melhorias concretas |
| Tag antes da aprovação | Processo invertido | Tag só após teste humano e aprovação |

---

## 12. Case study — Bricklike 0.5.1

**Contexto:** block breaker portrait, Phaser 3 + TypeScript + Vite; 7 níveis/22
ondas, Endless, tutorial in-game, ads e save. Um build para quatro portais.

**Linha do tempo:** `0.3.0` e `0.4.0` reprovadas no CrazyGames com a mesma
mensagem genérica; `0.5.1` submetida em 2026-11-11 e em review; itch.io e sandbox
da Playgama com a `0.5.1`; GameFlare bloqueado; nenhuma tag/release.

**O que a 0.5.1 mudou:** tutorial curto e pulável (8+8 blocos, 32 XP, 2 level
ups, primeiro perk após 4 blocos; 5 modais com “Got it”/“Skip”); edge assist e
swipe longo; gate do laser; side art fora do shell; adapter nativo do CrazyGames;
ads conservadores; aviso de storage.

**Medições:** as do §5. Boot **~340 ms** (antes ~9 s); Network só com
`sdk.crazygames.com`, nenhum request Playgama; `[BannerError] bannersDisabled`
continua e é ruído do SDK do CrazyGames no Basic Launch; “Progress may not be
saved” no QA por falha do `getItem`, não do save de produção.

**Gates/pacote:** 329 unitários/29 arquivos; 31 E2E/9 specs; 7 níveis, 22 ondas,
743 blocos, 1.809 XP; ZIP com 20 arquivos e 1.508.491 bytes; SHA-256
`f63d19341492aaa3b2378d262baac87f103e71daf00ec674972e531f832209ce`.

**Playgama sandbox (amostra pequena):** 17/100 qualifying plays; avg play time
5:42 contra meta 5:00; ad shows/play 1,70 contra meta 0,30; 116 launches, 31
plays, 5m45s e 3/2 likes. Amostra pequena demais para veredito; o excesso de ads
por play é sinal de alerta, não prova.

**Lições:**

1. **Orientação mobile é configurável; desktop não.** O formulário só tem
   `PORTRAIT`/`LANDSCAPE` mobile; o PC é landscape por premissa.
2. **Side art é apresentação, não layout.** Não aumenta o shell portrait; se o
   desktop importa, o layout precisa ser repensado.
3. **Tirar a Playgama do CrazyGames tem ganho real:** boot de ~9 s para ~340 ms e
   Network limpo; o custo é manter o adapter nativo.
4. **`BannerError` não era da Playgama:** com o SDK nativo, o aviso continuou.
5. **O formulário importa:** Data Module (não LocalStorage) e mute via SDK
   precisam refletir o código.
6. **Assets antigos queimam credibilidade:** capas/screenshots/vídeo da versão
   anterior ampliam a rejeição genérica.
7. **Rejeição genérica não se resolve só com ads:** onboarding, legibilidade,
   consistência e retenção pesam mais; peça detalhes e reenvie com mudanças.
8. **Não tagueie antes da aprovação:** a 0.5.1 ficou em main/review, sem tag.

**Para um novo projeto:** decida orientação/layout desktop na primeira semana;
verifique contas no dia 1 (especialmente GameFlare); gere assets do build
candidato; teste storage/ads no portal real cedo; meça retenção antes de
aumentar ads.

---

## 13. Referências

**Playgama:** [índice](https://wiki.playgama.com/playgama/llms.txt) ·
[API do Bridge](https://wiki.playgama.com/playgama/bridge-sdk/api.md) ·
[código](https://github.com/Playgama/bridge) ·
[developers](https://playgama.com/developers)

**CrazyGames:** [docs](https://docs.crazygames.com/) ·
[requisitos](https://docs.crazygames.com/requirements/intro/) ·
[gameplay](https://docs.crazygames.com/requirements/gameplay/) ·
[qualidade](https://docs.crazygames.com/requirements/quality/) ·
[técnico](https://docs.crazygames.com/requirements/technical/) ·
[SDK/preview](https://docs.crazygames.com/sdk/intro/) ·
[FAQ](https://docs.crazygames.com/faq/) ·
[métricas](https://docs.crazygames.com/resources/basic-launch-metrics/)

**itch.io:** [HTML5](https://itch.io/docs/creators/html5) ·
[pagamentos](https://itch.io/docs/creators/payments)

**GameFlare:** [developers](https://distribution.gameflare.com/developers/)

**Portais adiados:** [Poki](https://developers.poki.com/guide/revenue-deal-types) ·
[GameDistribution](https://static.gamedistribution.com/terms/developer.html) ·
[Famobi](https://accounts.famobi.com/developer-license-agreement.html) ·
[Addicting](https://www.addictinggames.com/about/user-submission-agreement) ·
[Discord](https://support-dev.discord.com/hc/en-us/articles/17299902720919-Premium-Apps-Payout)

**Bricklike:** [`handoff-v0.5.1.md`](handoff-v0.5.1.md) ·
[`release/status.md`](release/status.md) ·
[`release/crazygames-review.md`](release/crazygames-review.md) ·
[`research/crazygames-feedback.md`](research/crazygames-feedback.md) ·
[`build-release.md`](build-release.md)
