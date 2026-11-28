# Spec Técnica de Publicação Web — 6 Portais (Engine-Agnóstica)

Escopo: **Playgama, Y8.com, Lagged.com, itch.io, CrazyGames, Kongregate**. Um único código-fonte, 2 ZIPs HTML5 via flag de build (`bridge` vs `clean`). Independe de engine (JS/Phaser, Three.js, Godot, Unity WebGL, Construct etc.). Regras comerciais/payout ficam fora desta spec.

## 1. Mapa de Builds (1 código → 2 ZIPs)

| Artefato | Target de build | Camada SDK | Destino |
|---|---|---|---|
| `dist-bridge.zip` | `bridge` | [Playgama Bridge v2.4.4](https://github.com/playgama/bridge) (pacote local/plugin oficial da engine) | Playgama, Y8.com, Lagged.com, itch.io (`mock`) |
| `dist-clean.zip` | `clean` | Nenhum (zero scripts/configs externos) | CrazyGames (Basic Launch), Kongregate |

> **CrazyGames Full Launch:** só integrar o [CrazyGames SDK v3](https://docs.crazygames.com/sdk/html5-v3/intro/) se o jogo passar no QA + KPIs do Basic Launch.

### Como gerar os 2 ZIPs sem bifurcar o projeto
- **Projetos web JS/TS (ex.: Vite + Phaser/Three.js):** usar uma flag de ambiente (`BUILD_TARGET=bridge|clean`) para incluir `@playgama/bridge` em `mode: 'local'` apenas no `dist-bridge.zip` e excluir `playgama-bridge-config.json` do `dist-clean.zip`; definir `base: './'` para caminhos relativos.
- **Engines (Unity, Godot, Construct, GameMaker etc.):** usar o pacote oficial da [Playgama Bridge](https://github.com/playgama/bridge) controlado por um símbolo/flag de compilação (`USE_BRIDGE`) para exportar `dist-bridge.zip` (com Bridge) e `dist-clean.zip` (sem Bridge nem config).

### `playgama-bridge-config.json` (raiz do `dist-bridge.zip` apenas)

Fica ao lado do `index.html` ([Config Docs](https://wiki.playgama.com/playgama/bridge-sdk/config)):

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

- `showFullLoadingLogo: false` + `showLoadingText: true`: remove logo da Playgama em outros portais mantendo progresso legível.
- `sendAnalyticsEvents: false`: bloqueia telemetria para `api.playgama.com` fora da Playgama (na Playgama segue ativo).
- `initialInterstitialDelay: 0`: anula o default de 30s ([Changelog](https://wiki.playgama.com/playgama/bridge-sdk/changelog)) para não perder o primeiro interstitial em fases curtas.

## 2. Contrato Único de Plataforma (`PlatformAdapter`)

A lógica do jogo **nunca** chama o SDK da Bridge, `localStorage` ou `if (platform === ...)` diretamente. Toda interação passa por uma única camada (`PlatformAdapter`) com dois modos: `bridge` (delega à Playgama Bridge) e `clean` (no-op seguro + `localStorage`).

| Método / Evento | Comportamento em `bridge` | Comportamento em `clean` | Regra inviolável |
|---|---|---|---|
| `init()` | `Promise.race([bridge.initialize(), timeout(10s)])` | Resolve imediato; `lang = navigator.language` | Timeout obrigatório: adblockers podem travar `initialize()` indefinidamente. |
| `onPauseChange(cb)` | Assina `visibilitychange`, `blur`/`focus`, `bridge.game` (`visibility_state_changed`) e ads (`opened`→pause, `closed`/`failed`→resume) | Assina `visibilitychange` e `blur`/`focus` | Mutar áudio e pausar gameplay imediatamente em background ou durante ads. |
| `sendGameReady()` | `bridge.platform.sendMessage('game_ready')` (1x) | No-op | Chamar **só** no primeiro frame jogável aceitando input (nunca no loading). |
| `gameplayStart()` / `Stop()` | `sendMessage('gameplay_started' / 'gameplay_stopped')` | No-op | Marcar início e pausa/fim real de gameplay. |
| `save(keys, vals)` / `load(keys)` | `bridge.storage.set(keys, vals)` / `get(keys)` | `localStorage` com `try/catch` | `keys` e `vals` **devem ser arrays de mesmo tamanho** (objetos falham na Bridge); chave ausente retorna `null` (sempre aplicar default). |
| `canShowRewarded()` | `Boolean(bridge.advertisement.isRewardedSupported)` | `false` | Ocultar botões de rewarded se `false`; todo conteúdo precisa ter caminho sem anúncio. |
| `showInterstitial(onDone)` | Exibe ad; trata `closed` e `failed` chamando `onDone()` | Chama `onDone()` imediato | `failed`/`adError` = "sem ad"; nunca travar transição de fase. |
| `showRewarded(onReward, onDone)` | Só entrega recompensa se estado `rewarded` disparar; finaliza em `closed`/`failed`; timeout de abertura de 15 s e de anúncio aberto de 180 s | Chama `onDone()` imediato | Nunca premiar no estado `closed` sem `rewarded`. |

### 2.1 Ciclo de vida de anúncios (v0.8.1)

- **Rewarded:** a recompensa só é entregue no estado `rewarded`. `closed` sem `rewarded` não paga; o estado `opened` não pode ser tratado como falha.
- **Timeout:** 15 s para o anúncio abrir; depois de `opened`, o timeout de segurança sobe para **180 s**. Um rewarded de 30 s não pode resolver `failed` enquanto ainda está na tela.
- **Ordem dos eventos:** alguns SDKs emitem `closed` antes de `rewarded`. O adaptador mantém uma janela de **500 ms** após `closed` e consulta `bridge.advertisement.rewardedState` antes de decidir; se `rewarded` chegar nessa janela, a recompensa é paga.
- **Cooldown único:** todo anúncio concluído (interstitial ou rewarded) grava `lastAdFinishedAt`. Nenhum outro anúncio começa nos **60 s** seguintes — vale para wave interstitial, results exit, pause exit e a oferta de revive por rewarded. `adBusy` continua sendo o lock de sobreposição.
- **Overlay:** o `AdOverlay` tem safety de 300 s, acima do maior timeout de anúncio; ele só some quando o `Game` emite `ad:state finished`.
- **Testes obrigatórios:** `opened → rewarded`, `opened → closed → rewarded` (janela de graça), `opened → closed` sem reward, anúncio aberto por >15 s, timeout sem evento, e E2E de Menu após rewarded sem segundo ad.

## 3. Requisitos Universais do Build HTML5

- **ZIP & Paths:** `index.html` na raiz; todos os caminhos relativos (`./`); nomes de arquivos apenas com caracteres latinos sem acento.
- **Zero rede externa:** sem Google Fonts, CDNs, GA4 ou APIs externas; tudo empacotado no ZIP (exceto chunk do próprio portal quando detectado em runtime).
- **Single-threaded:** export sem `SharedArrayBuffer` (iframes não garantem COOP/COEP; padrão no Godot 4.3+).
- **Áudio iOS:** destravar `AudioContext` (`resume()`) no primeiro gesto do usuário (`pointerdown`/`touchend`/`click`).
- **UI & Proibições:** **sem botão próprio de fullscreen** (proibido no [CrazyGames](https://docs.crazygames.com/requirements/gameplay/)); **sem links externos** (redes sociais, site, outros portais); todo pop-up com botão fechar; sem login obrigatório; sem notificação de WebGL na abertura; sem player de mídia do sistema.
- **Layout & Mobile:** canvas responsivo sem scrollbars (`overflow: hidden`); suportar aspect ratio até 1:2 e safe area (notch); preservar progresso ao rotacionar; sem crash em long press; suportar mouse/teclado e toque (sem depender de hover).
- **Performance & Engines:** áudio `.ogg`/`.mp3` (nunca `.wav`); texturas comprimidas; física baseada em `delta time` (consistente em 60/144/165 Hz); rodar em Chromebook 4 GB RAM, Chrome, Edge e Safari; evitar DPR > 2 (CrazyGames força DPR=1 em mobile low-memory e desabilita Unity no iOS por padrão).
- **Idioma:** inglês obrigatório como padrão e fallback; idiomas extras declarados devem estar 100% traduzidos e manter o mesmo nome do app.

## 4. Limites e Regras Específicas por Portal

| Portal | ZIP | Limites técnicos | Regras críticas de aprovação |
|---|---|---|---|
| **Playgama** | `dist-bridge` | ≤ 300 MB compactado; nomes latinos | Bridge + `game_ready` + save via SDK + ≥1 interstitial em pausa natural obrigatórios; review 3–5 dias úteis ([Moderation](https://wiki.playgama.com/playgama/faq/game-moderation)). Parceiro MSN exige `< 50 MB` e landscape ([Platform Reqs](https://wiki.playgama.com/playgama/game-requirements/platform-specific-requirements)). Rejeita arte 100% IA sem refino humano. |
| **Y8.com** | `dist-bridge` | Web leve | SDK Y8 encapsulado na Bridge ([Y8 Portal](https://developer.y8.com/)). Rejeições repetidas geram cooldown progressivo (6h→12h→24h→2d→5d). |
| **Lagged.com** | `dist-bridge` | Web leve | SDK Lagged encapsulado na Bridge; exige AdSense Publisher ID no cadastro ([lagged.dev](https://lagged.dev/signup)). |
| **itch.io** | `dist-bridge` (`mock`) | ≤ 500 MB extraído; ≤ 1.000 arq.; ≤ 200 MB/arq.; path ≤ 240 chars | Ativar **Mobile Friendly** no painel; HTML5 iframe só aceita doações ([itch.io HTML5](https://itch.io/docs/creators/html5)). |
| **CrazyGames** | `dist-clean` (Basic) | ≤ 250 MB total; ≤ 1.500 arq.; **≤ 50 MB** inicial (**≤ 20 MB** home mobile — sem SDK vale para o ZIP inteiro) | QA manual (Step A) antes do Basic Launch (7–21d / ≥500 plays; 4 KPIs incluindo **CTR da capa** desde 23/11/2026) ([Basic Launch](https://docs.crazygames.com/resources/basic-launch-metrics/)). Reenvios seguidos sem correção geram suspensão ([Gameplay](https://docs.crazygames.com/requirements/gameplay/)). Exige PEGI 12/13+, 3 capas (`1920×1080`, `800×1200`, `800×800` sem bordas/selos/screenshot puro), preview video e descrição ≥100 palavras. **Full Launch:** entrada no gameplay em ≤1 clique, bloquear UI no request do ad, mutar quando ad começa, não criar timer de midgame (plataforma limita 1/3min) ([Ads](https://docs.crazygames.com/requirements/ads/)). |
| **Kongregate** | `dist-clean` | Web leve | Requer aprovação prévia de conta dev; proíbe SDKs de ads terceiros e contas próprias ([Submission](https://blog.kongregate.com/hc/en-us/articles/44205164389005-SUBMISSION-How-do-I-submit-a-game-to-Kongregate-It-s-Easy)); exige screenshots, instruções, classificação etária voluntária e declaração de uso de IA. |

## 5. Checklist Rápido Pré-Upload

- [ ] Servido via servidor HTTP local (nunca `file://`): console sem erros, Network sem 404 e sem chamadas externas.
- [ ] `dist-bridge.zip`: `index.html` e `playgama-bridge-config.json` na raiz; modo `mock` sem logo Playgama; adblocker não trava `init()`; zero requests para `api.playgama.com` fora da Playgama.
- [ ] `dist-clean.zip`: zero arquivos/menções da Bridge; ZIP ≤ 20 MB (alvo) / ≤ 50 MB (teto); zero botões de ad visíveis.
- [ ] Testado em mobile (iOS Safari + Android): áudio após 1º toque, mute em background/ad, rotação preserva estado, sem scrollbar.

## 6. Referências para Consulta de Agentes

- **Playgama Bridge (Markdown para agentes):** https://wiki.playgama.com/playgama/llms.txt · https://wiki.playgama.com/playgama/bridge-sdk/api.md · https://github.com/playgama/bridge
- **Portais:** [Playgama Wiki](https://wiki.playgama.com/playgama/faq/game-moderation) · [Y8](https://developer.y8.com/) · [Lagged](https://lagged.dev/signup) · [itch.io](https://itch.io/docs/creators/html5) · [CrazyGames](https://docs.crazygames.com/requirements/technical/) · [Kongregate](https://blog.kongregate.com/hc/en-us/articles/44205164389005-SUBMISSION-How-do-I-submit-a-game-to-Kongregate-It-s-Easy)

## 7. Implementação

- [Build bridge × clean — playbook](build-bridge-clean-playbook.md): alias de
  boot, storage do clean, validação do ZIP, testes e armadilhas práticas.