# Build e release

## Comandos

```bash
npm ci
npm run typecheck
npm test
npm run validate:content
node scripts/validate-bridge-config.mjs
npm run build
npm run package
```

`npm run build` gera `dist/` com `index.html`, `playgama-bridge-config.json` e o
runtime `playgama-bridge.js` na raiz. `npm run package` apaga `release/` e cria:

- `release/blockbreaker-web.zip` — conteúdo de `dist/` na raiz (sem a pasta
  `dist/`), pronto para upload em portal;
- `release/manifest.json` — nome, versão, data, tamanho do ZIP, SHA-256,
  contagem de arquivos, maior caminho e lista de paths.

O script usa `zip`/`unzip` do sistema. Ele falha com código 1 e mensagem clara
se `dist/` não existir, se `index.html` ou `playgama-bridge-config.json`
estiverem fora da raiz, se houver path absoluto, URL externa não permitida,
mais de 1.000 arquivos, mais de 250 MB ou caminho acima de 240 caracteres.

## Conteúdo esperado do ZIP

```text
index.html
playgama-bridge-config.json
playgama-bridge.js
favicon.svg
assets/...
licenses/...
```

Regras verificadas por `scripts/package.mjs`:

- `index.html` e o config do Bridge na raiz;
- assets com caminhos relativos (`./assets/...`, `./favicon.svg`);
- nenhum `src="/..."`, `href="/..."`, `url(/...)` ou import absoluto;
- nenhuma URL externa no conteúdo do jogo. A exceção é o CDN do Bridge
  (`https://bridge.playgama.com`). O fallback local (`./playgama-bridge.js`) é
  permitido. O runtime vendorizado `playgama-bridge.js` não é escaneado: ele
  contém endpoints internos de todos os portais suportados pelo SDK;
- `https://phaser.io` (banner de versão do engine) e namespaces `www.w3.org`
  são strings não-request e estão na allowlist do validador.

## Configuração do Bridge

`public/playgama-bridge-config.json` é copiado para `dist/` e para a raiz do
ZIP. `node scripts/validate-bridge-config.mjs` confere o schema lido pelo
Bridge 2.4.1 instalado:

- sem loading screen do Bridge (`loadingScreenType: "none"`), sem logo
  (`showFullLoadingLogo: false`) e sem analytics (`sendAnalyticsEvents: false`);
- `game.adaptToSafeArea: true`;
- interstitial com `minimumDelayBetweenInterstitial` e
  `initialInterstitialDelay` numéricos e `placementFallback`;
- `interstitial.autoShow`/`rewarded.autoShow` vazios (ads só na saída dos
  results);
- `platforms.mock` sem logo/analytics;
- nenhum banner, rewarded UI ou URL externa no config.

O jogo não implementa frequência própria de ads; o Bridge controla o intervalo
mínimo. Em Basic Launch do CrazyGames os ads ficam desligados e o fluxo de
`showInterstitial` retorna `skipped`/`failed` sem bloquear a navegação.

## Ads sem portal (QA)

Para validar a UI e o fluxo do interstitial sem subir para a Playgama:

- `?debug=1&adMock=show` — simula um anúncio de 1,4 s e retorna `shown`;
- `?debug=1&adMock=fail` — simula falha após 0,7 s e retorna `failed`.

O proxy é debug-only: storage, lifecycle, mensagens e config continuam reais. O
anúncio real e o Bridge DevTools exigem um ambiente/portal da Playgama.

## Teste em subpasta

O build usa `base: './'`, então deve funcionar em qualquer subpasta:

```bash
rm -rf /tmp/opencode/m5-subfolder
mkdir -p /tmp/opencode/m5-subfolder/sub
cp -r dist/. /tmp/opencode/m5-subfolder/sub/
cd /tmp/opencode/m5-subfolder
python3 -m http.server 8765
```

Abra `http://localhost:8765/sub/` e confirme que o menu carrega, os assets
aparecem no Network e não há erro de path 404. Também é possível validar o ZIP
sem extrair:

```bash
unzip -l release/blockbreaker-web.zip
unzip -t release/blockbreaker-web.zip
```

## CI e release

- `.github/workflows/ci.yml`: em push/PR roda typecheck, tests, conteúdo,
  config do Bridge, build e package; sobe `dist/` (`blockbreaker-dist`) e o ZIP
  (`blockbreaker-web`).
- `.github/workflows/release.yml`: em tag `v*` roda a mesma bateria, empacota e
  cria um GitHub Release com `blockbreaker-web.zip` e `manifest.json`.
- `.github/workflows/deploy.yml`: continua publicando `dist/` no GitHub Pages
  para review; não é um canal de submissão.

## Checklist de build e portal (§5.5)

- [ ] `unzip -l` mostra `index.html` e `playgama-bridge-config.json` na raiz.
- [ ] Abrir o build em subpasta (teste acima) sem 404 e com paths relativos.
- [ ] Network sem requests externas além do CDN do Bridge/fallback local.
- [ ] Mock/adblock: com SDK bloqueado, o jogo cai no `FallbackAdapter` e abre.
- [ ] Rede lenta: boot não passa de 10 s; storage tem timeout de 3 s e cai em
      memória.
- [ ] `game_ready` enviado uma vez só depois do menu interativo.
- [ ] `level_started`, `level_paused`, `level_resumed`, `level_completed` e
      `level_failed` chegam ao Bridge nos momentos certos.
- [ ] Storage via Bridge (`bb.save`/`bb.settings`), sem `localStorage` direto;
      reload preserva progresso e `?resetSave=1` limpa.
- [ ] Ads: interstitial só na saída dos results; `closed`/`failed`/timeout de
      15 s retomam o jogo; unsupported retorna `skipped`.
- [ ] Áudio mutado em ads/background; `AUDIO_STATE_CHANGED` aplicado no boot.
- [ ] Responsivo de 320 px ao desktop, sem scrollbar; toque, mouse e teclado.
- [ ] Rotação preserva progresso (pausa + overlay).
- [ ] ZIP ≤ 250 MB, ≤ 1.000 arquivos, paths ≤ 240 caracteres.
- [ ] Sem logo do Bridge no mock; modo mock sem analytics.

## Fora do escopo deste milestone

A submissão a portais, capas, vídeo, descrição e criação da release pública de
loja são do **M7**. Este trabalho entrega build, ZIP, config, CI e release
técnica por tag; não publica em nenhum portal.
