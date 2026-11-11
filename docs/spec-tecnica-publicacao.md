# Especificação técnica de publicação — portais web

Escopo: **itch.io, GameFlare, Playgama e CrazyGames**. Um único build HTML5, um único ZIP, quatro portais. As regras abaixo são as que afetam a implementação; regras de negócio (payout, revenue share, review comercial) não são objeto deste documento.

> **Estado do build em 2026-11-11:** versão `0.5.1` publicada no itch.io e no sandbox da Playgama; submetida ao
> CrazyGames em 2026-11-11 e aguardando review. Nenhuma tag ou GitHub Release
> foi criada. O jogo tem tutorial in-game sem ads, campanha com 20 ondas e
> interstitials apenas quando há próxima onda e a onda limpa é múltipla de 3
> (na prática, fase 5 após a onda 3 e fase 6 após a onda 3), Endless a cada 4
> ondas e exits com cooldown de 60 s; o rewarded revive é oferecido uma vez por
> run. CrazyGames reprovou a `0.3.0` e novamente a `0.4.0` com a mesma mensagem
> genérica; a `0.5.1` foi submetida e está em review. GameFlare está bloqueado por
> acesso à conta. Ver `docs/handoff-v0.5.1.md` e `docs/release/status.md`.

---

## 0. Ordem de execução

1. Build HTML5 com a **Playgama Bridge** integrada — camada de abstração única (§1).
2. Valida o checklist (§5).
3. Empacota o ZIP e sobe no itch.io, no GameFlare e no Playgama Developer Console (mesmo arquivo).
4. Sobe no CrazyGames em **Basic Launch** (mesmo arquivo).
5. Só depois de passar no Basic Launch: configura o Full Launch (§3.4).

---

## 1. Bridge — arquitetura e contrato

### 1.1 Por que o Bridge

O Bridge detecta a plataforma em runtime pelo hostname (`src/platformDetectors.ts`) e conhece 25 plataformas. **itch.io e GameFlare não estão na lista** — quando nenhum detector casa, o Bridge roda em **mock platform**, devolvendo defaults seguros em vez de lançar erro.

Consequência: **o código de jogo não tem nenhuma linha de `if (platform === ...)`**. As chamadas são idênticas em todo lugar.

### 1.2 Comportamento por plataforma

| | itch.io | GameFlare | Playgama | CrazyGames |
|---|---|---|---|---|
| Estado do Bridge | mock | mock | nativo | nativo |
| ID detectado | `mock` | `mock` | `playgama` | `crazy_games` |
| Storage do progresso | `localStorage` (fallback automático) | `localStorage` | storage da conta | `sdk.data` |
| `isInterstitialSupported` | `false` | `false` | `true` | `true` |
| `isRewardedSupported` | `false` | `false` | `true` | `true` |
| Ads dentro do jogo | não — modelo é doação | não — o GameFlare serve ads ao redor do jogo | sim, via Bridge | Basic: desligados · Full: via SDK |
| `sendMessage('game_ready')` | no-op | no-op | **obrigatório** (moderação) | no-op |
| `platform.language` | idioma do browser | idioma do browser | idioma do usuário no portal | idioma do portal |
| Analytics interno | off | off | **on** | off |

O mock implementa o contrato completo do `PlatformBridgeBase`: `initialize()` resolve, `isPlatformStorageAvailable` é `false` (o Storage cai para `localStorage` sozinho), `sendMessage` resolve sem efeito, `platformLanguage` cai para `navigator.language`.

### 1.3 Contrato de código

**Inicialização** — a promise pode **não resolver**: o adapter nativo do CrazyGames carrega o script do SDK via `addJavaScript()` encadeando `.then()` sem `.catch()`. Se o script for bloqueado (adblocker em `sdk.crazygames.com` é comum), ela fica pendurada indefinidamente. Com o Bridge local da 0.5.1, a Playgama não faz request ao CDN no boot. Use timeout e entre no jogo de qualquer forma.

```javascript
await Promise.race([
  bridge.initialize(),
  new Promise((resolve) => setTimeout(resolve, 10000)),
])
const lang = bridge.platform.language
```

**Save** — assinatura `set(key, value)`. Com arrays, chave e valor são arrays de mesmo tamanho; objeto não funciona. Key ausente no `get()` retorna `null` — sempre tenha default. Nunca use `localStorage` direto.

```javascript
const [level, coins] = await bridge.storage.get(['level', 'coins'])
await bridge.storage.set(['level', 'coins'], [3, 120])
```

**Ads** — sempre verifique suporte antes de exibir UI:

```javascript
if (bridge.advertisement.isRewardedSupported) { /* botão "assistir ao ad" */ }
else { /* equivalente sem ad */ }
```

Três regras não negociáveis:
- **Existe um caminho sem ad para todo conteúdo.** "Assistir ao ad" nunca pode ser a única forma de destravar — no itch.io e no GameFlare não há ad, adblocker bloqueia na Playgama, o fill falha, o jogador fecha antes.
- **Recompensa só no estado `rewarded`**, nunca em `closed`. Conceder em `closed` deixa o jogador fechar o ad sem assistir.
- **`FAILED` e `adError` significam "sem ad"** — o jogo continua. Nunca trave esperando o ad terminar.

**Lifecycle** — `bridge.platform.sendMessage('game_ready')` só quando o primeiro frame jogável estiver pronto e o jogador puder interagir. Nunca enquanto a tela de loading estiver visível.

**Pause e áudio** — assine os eventos de pause e de estado de áudio. A plataforma dispara quando o jogador troca de aba, minimiza o browser ou abre um ad. Jogo que continua tocando som em background reprova.

### 1.4 Instalação

| Forma | Tamanho | Requisições externas | Quando usar |
|---|---|---|---|
| CDN — `<script src="https://bridge.playgama.com/v2/stable/playgama-bridge.js">` | 116 KB | bundle + 1 chunk por plataforma detectada | Padrão na Playgama; a ferramenta de build dela reescreve a tag |
| Local — `playgama-bridge.js` do pacote npm ao lado do `index.html` | 307 KB | 0 | itch.io/GameFlare sem dependência de rede |
| CDN + fallback local — plugin Vite, modo `cdn` | 116 KB + 307 KB no ZIP | 1, com fallback | Recomendado para build único |
| **Local — `./playgama-bridge.js`** | 372 KB no ZIP | **0** | **Build atual da 0.5.1**: carregado dinamicamente fora do CrazyGames; nenhum request ao CDN da Playgama no boot |

A 0.5.1 escolhe o runtime pelo host: CrazyGames usa o adapter nativo direto e não carrega a Playgama; os demais portais carregam o Bridge local. O adapter nativo do CrazyGames pode carregar o
SDK do próprio portal quando detecta o host (`sdk.crazygames.com`), mas isso é
uma dependência da plataforma de destino, não do CDN da Playgama. Em itch.io,
GameFlare e GitHub Pages o boot não faz request ao `bridge.playgama.com`.

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import { playgamaBridge } from '@playgama/bridge/vite'

export default defineConfig({
  base: './',
  plugins: [playgamaBridge()],   // ou playgamaBridge({ mode: 'local' })
})
```

O chunk da plataforma só é baixado quando a plataforma é detectada — no mock, nenhum chunk é buscado.

### 1.5 `playgama-bridge-config.json`

Fica **ao lado do `index.html`** (o Bridge busca `./playgama-bridge-config.json` relativo à página). Sem ele, o `placementFallback` fica vazio.

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
| `showFullLoadingLogo: false` | A tela de loading do Bridge é branded Playgama e aparece em **todas** as plataformas — inclusive itch.io e GameFlare, onde seria marketing de terceiro sobre o teu jogo |
| `showLoadingText: true` | `showFullLoadingLogo: false` sozinho deixa a tela sem texto; a combinação dá progresso legível sem logo alheio |
| `sendAnalyticsEvents: false` | Ver abaixo |
| `game.adaptToSafeArea: true` | Notch e barra de gestos no mobile |
| `initialInterstitialDelay: 0` | O default é **30 s** — durante essa janela todo `showInterstitial()` falha. Com `level_completed` em 20 s, o primeiro ad nunca sairia |

**`sendAnalyticsEvents`:** por padrão o analytics interno envia eventos para `api.playgama.com` de **qualquer** plataforma. A chave `false` desliga em todas **exceto a Playgama** — o Bridge isenta a Playgama de propósito. No CrazyGames fica desligado; para dados de engajamento lá, use o dashboard do próprio CrazyGames.

**Alternativa:** `disableLoadingLogo: true` remove a tela inteira, mas perde a barra de progresso — o jogo precisa ter a sua.

**Overrides por plataforma:** o bloco `platforms` faz deep merge por ID detectado. itch.io e GameFlare caem ambas em `mock`:

```json
{ "platforms": { "mock": { "sendAnalyticsEvents": false, "showFullLoadingLogo": false } } }
```

IDs úteis: `playgama`, `crazy_games`, `mock`. `forciblySetPlatformId` é campo local-only — nunca sobrescrito por config remoto.

### 1.6 Bridge no CrazyGames

O Bridge **tem adapter nativo**: carrega `https://sdk.crazygames.com/crazygames-sdk-v3.js` e mapeia as mensagens do Bridge para o SDK deles.

| Mensagem do Bridge | Chamada no SDK do CrazyGames |
|---|---|
| `GAMEPLAY_STARTED`, `LEVEL_STARTED`, `LEVEL_RESUMED` | `sdk.game.gameplayStart()` |
| `GAMEPLAY_STOPPED`, `LEVEL_PAUSED`, `LEVEL_COMPLETED`, `LEVEL_FAILED` | `sdk.game.gameplayStop()` |
| `IN_GAME_LOADING_STARTED` / `IN_GAME_LOADING_STOPPED` | `sdk.game.loadingStart()` / `loadingStop()` |
| `PLAYER_GOT_ACHIEVEMENT` | `sdk.game.happytime()` |
| `bridge.storage.set()` / `get()` | `sdk.data.setItem()` / `getItem()` |

Ou seja: **o mesmo build serve ao Full Launch sem integração manual do CrazyGames SDK.** `game_ready` não é mapeado — cai no `sendMessage` base, sem efeito.

**Sitelock:** o Bridge **não implementa** whitelist de origens. Se o build faz sitelock próprio, é preciso whitelistar todas as origens do CrazyGames, incluindo as dos apps iOS e Android. Passo manual; a lista de origens muda.

---

## 2. Requisitos do build

Valem para os quatro portais. Violar qualquer um reprova em todo mundo.

| Item | Exigência |
|---|---|
| Formato | HTML5 puro no browser. Sem wrapper nativo, plugin ou Flash |
| Entry point | `index.html` na **raiz** do ZIP |
| Caminhos | **Relativos** em todos os assets — cada portal serve do próprio domínio/subpath |
| Recursos externos | **Zero** para o jogo, exceto o SDK do próprio portal. Fonte, textura, áudio, WASM, lib e dado vão dentro do ZIP. Fora do CrazyGames o Bridge local é usado; no CrazyGames, o SDK nativo do portal é a única dependência externa |
| Threading | Export **single-threaded**. `SharedArrayBuffer` exige headers COOP/COEP nos embeddings e o dev não controla o iframe do portal. Em Godot 4.3+ já é o default |
| Analytics | Nada de GA4 ou equivalente — as requisições podem ser bloqueadas. Use o módulo `analytics` do Bridge (≥ 2.3.0) |
| Persistência | Só via `bridge.storage`. Nunca `localStorage` direto |
| Áudio | Mutado durante ads e ao ir pra background; restaurado só após gesto (`touchend`/`click`) — obrigatório em iOS, onde o `AudioContext` fica `suspended` |
| Responsividade | Sem scrollbar de browser, sem elemento cortado ou sobreposto, sem distorção em rotação, todo pop-up com fechar. Campo de jogo estica até a borda; aspect ratio ≤ 1:2 |
| Toque | Totalmente por gestos (acelerômetro pode complementar). Teclado ou mouse no desktop. Sem player do sistema, sem notificação de WebGL na abertura |
| Rotação | Progresso preservado ao mudar orientação de tela |
| Login | Não pode exigir registro ou autorização de serviço externo para abrir o jogo |
| Localização | **Inglês obrigatório** como idioma padrão e fallback. Outros idiomas declarados precisam estar traduzidos e seguir o idioma da plataforma |
| Ads | Só via SDK do portal. Sem rede de terceiros. Pausar gameplay e mutar áudio durante o ad |
| Assets | Áudio em ogg/mp3 (nunca wav). Comprimir texturas e áudio; carregar só o essencial no primeiro frame, o resto em background |

**Rejeição automática na Playgama:** Bridge não integrado · `game_ready` não enviado · progresso não salvo via SDK · ad que interrompe gameplay, não pausa som ou não entrega a recompensa prometida · crash ou freeze · interface cortada · analytics externo · nome do app divergente entre idiomas · cópia de outro jogo do catálogo · violação de copyright (nomes, logos, música).

**IA generativa:** aceita para história, lógica e matemática de jogo. **Não** aceita jogo 100% IA sem refino humano substancial dos visuais — e esses títulos performam mais de 2x pior nas métricas.

---

## 3. Limites e regras por portal

### 3.1 Tabela de limites

| | itch.io | GameFlare | Playgama | CrazyGames |
|---|---|---|---|---|
| Total | ≤ 500 MB extraído | — | ≤ 300 MB compactado | ≤ 250 MB |
| Arquivos | ≤ 1.000 | — | — | ≤ 1.500 |
| Arquivo individual | ≤ 200 MB | — | — | — |
| Caminho + nome | ≤ 240 caracteres | — | — | — |
| Download inicial | — | — | — | ≤ 50 MB (≤ 20 MB p/ home mobile) |
| Formato do pacote | só `.zip` | arquivos do jogo ou link | ZIP | ZIP |
| Nomes | case-sensitive, UTF-8 | — | **caracteres latinos apenas** | — |

O download inicial do CrazyGames é medido do início do load até o primeiro `GameplayStart`. **Com o Bridge no build isso muda**: a medição passa a ser até o `GAMEPLAY_STARTED` em vez do total do bundle — envie a mensagem no momento certo.

### 3.2 itch.io

- Recursos externos só por **HTTPS**; o build é servido em subdiretório do CDN deles
- Embed: *click to play* é o default; ative **Mobile Friendly** (no celular força fullscreen e tira a UI do portal de cima do jogo)
- HTML5 em iframe só aceita **doação**; para vender, "Kind of Game" = Downloadable
- Sem ads: não chame `showInterstitial()` — o estado vai a `FAILED` e o jogo segue, mas não há ganho

### 3.3 GameFlare

- Sem SDK obrigatório. O SDK do GameFlare é apenas sitelock, opcional
- Sem ads internos — quem serve anúncio é o GameFlare, ao redor do jogo
- Se houver backend próprio (multiplayer), tem que suportar **HTTPS**

### 3.4 Playgama

Bridge obrigatório; review em ~24h. Além do §1:

- Interstitial em pausa natural é obrigatório para qualificar na revenue share
- Módulos recomendados: rewarded, banners, adblock detection, pagamentos (catálogo único cross-platform), leaderboards, achievements, tasks, daily rewards, notifications, social, cross-promo, player, device, remote config, clipboard, analytics
- Engines com pacote oficial: JS Core (qualquer engine web), Unity, Construct 3, GDevelop, Godot 3.x/4.x, GameMaker, Defold, Cocos Creator, Scratch
- Browsers: Chrome, Firefox, Opera, Safari, Edge. Windows Vista+, macOS 10.6+, Android 5.0+, iOS 9.0+

**Parceiros** — o build sai no playgama.com **e** na rede de parceiros:

| Parceiro | Requisito que afeta o build |
|---|---|
| MSN | < 50 MB; landscape ou landscape+portrait |
| VK | Russo como idioma default, interface inteira traduzida, safe zones no mobile, > 10 min de gameplay |
| Yandex / Playhop | Suportar russo |
| Facebook | ≤ 200 MB, ≤ 500 arquivos, Decompression Fallback `off` no Unity, Brotli/Gzip, loading < 3 s |
| GameDistribution | Sem links de saída (inclui analytics e redes sociais), hospedado internamente, sem sangue explícito |

### 3.5 CrazyGames

**Basic Launch** — SDK opcional, ads desligados, zero revenue share, sem setup de KPI. Dura enquanto o jogo estiver no ar há ≥ 7 dias **e** ≥ 500 plays; se não chegar a 500 plays, encerra aos 21 dias.

O Bricklike teve a `0.3.0` e a `0.4.0` reprovadas na revisão inicial com a
mensagem genérica de qualidade, sem detalhamento. A `0.4.0` foi reenviada como
nova submissão e recusada de novo. Para a `0.5.1`, o dono decidiu **não fazer
moldura/letterbox desktop**; a aposta é tutorial in-game, controles mobile e
política de ads mais conservadora, ainda dependente de teste humano. O roteiro
de suporte e os canais estão em
[`docs/research/crazygames-feedback.md`](research/crazygames-feedback.md).

Com o Bridge no build, **o SDK fica integrado de qualquer jeito**: o adapter detecta `crazygames.` e chama `gameplayStart()` mesmo no Basic Launch. Os ads desligados podem reprovar o fluxo de interstitial se o jogo **travar esperando** o ad — trate `FAILED` desde o dia 1.

**Full Launch** — além do Basic:

- Gameplay start/stop e load start/stop
- Módulo Data para salvar progresso; User para conta e avatar (opcional)
- Ads só via SDK do CrazyGames, sem ads externos, funciona com adblock
- Aterrissar direto no gameplay, sem menu inicial
- Progresso vinculado à conta CrazyGames

**Comportamento de ads** (regras rígidas):

- **Pausar o jogo** durante o video ad: desabilitar botões ou spinner bloqueando interação. O request não é instantâneo — bloquear a UI até `adFinished` ou `adError`
- **Mutar o áudio** quando o ad começa a tocar, não no request
- **`adError`**: o request pode não ser preenchido (timing, adblock, demanda). O jogo continua
- Só em pausa natural: transição de level, troca de mapa, morte. Nunca em botão de navegação
- Sem ads encadeados, interrompidos ou antes de o jogador ter jogado o suficiente
- Rewarded só onde há recompensa real
- Frequência de midgame é controlada pela plataforma (máx. 1 a cada 3 min) — não implementar intervalo próprio

**Compatibilidade:**

- Chrome e Edge. Jogo que não funciona bem no Safari é **desabilitado** nele
- Parte significativa da audiência usa Chromebook — jogo que não roda bem em **Chromium OS com 4 GB de RAM** é desabilitado
- Mouse, teclado e toque. Landscape no desktop; portrait aceito se mobile-friendly
- **Unity é desabilitado no iOS** por padrão (crash por falta de memória)
- CrazyGames controla o device pixel ratio: **DPR = 1** em iOS e Android de baixa memória
- Safe area padding para notch nos apps iOS/Android em fullscreen
- Física consistente entre refresh rates (144 Hz, 165 Hz)
- Sem notificação de WebGL na abertura; sem limitação por URL
- **Inglês obrigatório**. PEGI 12/13+

**Assets e metadata:**

- **3 capas obrigatórias**: landscape 16:9 (1920×1080), portrait 2:3 (800×1200), square 1:1 (800×800), visual consistente entre as três
- Restrições de capa: sem bordas, sem texto além do título (nada de "New", "Play now"), sem ícones ou logos de loja, sem visual pixellado, sem material de terceiro. Não usar screenshot puro
- **Preview video** no envio
- No submission: título, capa 16:9, instruções de controle, descrição com ≥ 100 palavras

---

## 4. Ordem de validação

O CrazyGames Basic Launch é o gargalo do plano — os demais portais aceitam o build em minutos. Se o Basic Launch reprovar, a causa quase sempre é o fluxo de ads: o jogo esperando um ad que não vem. Trate `FAILED` como caminho normal desde o primeiro dia.

---

## 5. Checklist de verificação

**Build**
- [ ] `index.html` na raiz do ZIP; zero paths absolutos; zero recursos externos (o build 0.5.1 usa o Bridge local; o adapter do CrazyGames carrega o SDK do portal apenas no host dele)
- [ ] Export single-threaded; sem GA4 em nenhuma biblioteca
- [ ] `playgama-bridge-config.json` ao lado do `index.html`, com os ajustes de §1.5
- [ ] Bridge carregado localmente (`./playgama-bridge.js`); `initialize()` com timeout; nenhum request ao CDN da Playgama no boot
- [ ] Nenhum `if (platform === ...)` no código; nenhum `localStorage` direto
- [ ] `bridge.storage.set()` com arrays de mesmo tamanho
- [ ] `game_ready` só no primeiro frame jogável; eventos de pause e áudio assinados
- [ ] Caminho sem ad para todo conteúdo que usa rewarded; recompensa só no estado `rewarded`
- [ ] Tutorial sem ads; campanha só com próxima onda e onda múltipla de 3; exits com cooldown de 60 s
- [ ] `GAMEPLAY_STARTED` enviado quando o jogador entra em estado jogável
- [ ] Progresso sobrevive à rotação; sem scrollbar, sem elemento cortado
- [ ] Sem crash em: rotação, long press, minimizar browser, abrir ad, voltar de outra aba
- [ ] Sem player do sistema, sem notificação de WebGL, sem limitação por URL
- [ ] Interface 100% em inglês; outros idiomas declarados, todos traduzidos; nome do app idêntico em todos

**Tamanho**
- [ ] Download inicial ≤ 20 MB (alvo) / ≤ 50 MB (teto CrazyGames)
- [ ] Total ≤ 250 MB (CrazyGames) e ≤ 300 MB (Playgama); ≤ 1.500 arquivos
- [ ] Áudio em ogg/mp3; texturas comprimidas

**Teste**
- [ ] Servir a pasta localmente (nunca `file://` — quebra WebGL e fetch); console sem 404 nem erro
- [ ] Áudio funciona após o primeiro gesto; save/load funciona; canvas redimensiona
- [ ] Testar em iPhone (Safari), Android e notebook low-memory; load time com cache frio
- [ ] **Testar em modo mock** — que é o estado real no itch.io e no GameFlare: save persiste, botão de rewarded não trava
- [ ] **Testar com adblocker** — o SDK do portal pode ficar pendurado; o jogo precisa entrar mesmo assim
- [ ] Aba Network: nenhum request ao CDN da Playgama no boot; nenhum evento para `api.playgama.com` fora da Playgama
- [ ] A tela de loading não exibe logo do Bridge no itch.io/GameFlare

**Assets de portal**
- [ ] 3 capas no tamanho correto + preview video (CrazyGames)
- [ ] Descrição com ≥ 100 palavras + instruções de controle

---

## 6. Armadilhas

| Sintoma | Causa | Correção |
|---|---|---|
| Jogo trava na tela de loading | `initialize()` nunca resolve — script do SDK bloqueado por adblocker | `Promise.race` com timeout; entrar de qualquer forma (§1.3) |
| Botão de "assistir ao ad" não faz nada | Recompensa só no estado `rewarded`; no itch.io/GameFlare não há ad | Caminho sem ad; nunca usar rewarded como única forma de destravar |
| Jogo congela ao passar de level | Código espera o ad terminar; no Basic Launch do CrazyGames os ads não vêm | Tratar `FAILED` e `adError` como "sem ad" e seguir |
| Primeiro interstitial nunca aparece | `initialInterstitialDelay` default é 30 s | `initialInterstitialDelay: 0` no config |
| Logo do Bridge aparece no itch.io | Tela de loading branded em todas as plataformas | `showFullLoadingLogo: false` + `showLoadingText: true` |
| Jogadores do itch.io aparecem em `api.playgama.com` | Analytics interno ligado por padrão | `sendAnalyticsEvents: false` |
| Download inicial do CrazyGames medido errado | Com Bridge, a medição vai até o `GameplayStart`, não o total do bundle | Enviar `GAMEPLAY_STARTED` no momento certo |
| Save não persiste | `localStorage` direto em vez do módulo de Storage | Sempre via `bridge.storage` |
| Portal não carrega o ZIP | `index.html` aninhado em subpasta | `index.html` na raiz |
| Assets 404 no portal | Paths absolutos | Converter para relativos |
| Jogo não abre | Sem `game_ready` / Bridge não inicializado | Inicializar e esperar antes de tudo |
| Rejeitado sem motivo claro | Progresso não salvo via SDK, ou ads sem pause/sound | Seguir os passos obrigatórios |
| Sem som no iOS | `AudioContext` suspended | `resume()` dentro de `touchend`/`click` |
| Áudio continua em background | Sem assinar evento de pause | Assinar pause + audio state |
| Crash em iOS | DPR nativo alto | CrazyGames gerencia DPR=1; evitar alocação excessiva |
| Jogo desabilitado no Safari/Chromium | Não roda nos navegadores-alvo | Testar em Chrome/Edge; performance em 4 GB RAM |
| Rejeitado por "AI-generated" | 100% IA sem refino humano nos visuais | Refinar arte manualmente |

---

## 7. Referências de API

A documentação completa do Bridge está em **https://wiki.playgama.com/playgama/llms.txt** (índice) e **https://wiki.playgama.com/playgama/bridge-sdk/api.md** (API). Página por página, acrescente `.md` à URL. O código-fonte, para conferir comportamento: **https://github.com/Playgama/bridge**.
