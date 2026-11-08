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

O build usa `base: './'`, então deve funcionar em qualquer subpasta. Use uma
pasta descartável dentro do worktree (`.qa/`), removida antes do commit:

```bash
rm -rf .qa
mkdir -p .qa/sub
unzip -q release/blockbreaker-web.zip -d .qa/sub
cd .qa
python3 -m http.server 4181 --bind 127.0.0.1
```

Abra `http://127.0.0.1:4181/sub/` e confirme que o menu carrega, os assets
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

## Validação do pacote de release (M7)

Executado no worktree `m7-s6` a partir de `c0d8928`, com build limpo:

```bash
rm -rf dist release
npm run build
npm run package
unzip -t release/blockbreaker-web.zip
```

Resultado em 2026-11-08:

| Item | Valor |
|---|---|
| ZIP | `release/blockbreaker-web.zip` |
| Tamanho | 502.321 bytes (490,5 KiB / 0,48 MiB) |
| Conteúdo descompactado | 1.859.569 bytes (1,77 MiB) |
| Arquivos | 13 |
| Maior path | 38 caracteres (`assets/Silkscreen-Regular-W9-u5Upq.ttf`) |
| SHA-256 | `cd809581e656337f28c8ef8a8c5a646f5054b0733ae5b35a3cca0f79ed74188e` |
| `unzip -t` | “No errors detected in compressed data” |
| Raiz do ZIP | `index.html` + `playgama-bridge-config.json` presentes |

Todos os limites ficam muito abaixo do teto: 13/1.000 arquivos, 0,48/250 MiB,
38/240 caracteres. O `scripts/package.mjs` também confirmou ausência de paths
absolutos e de URLs externas fora da allowlist (`bridge.playgama.com`,
`www.w3.org`, `phaser.io`).

### Teste em subpasta do ZIP (M7)

O ZIP foi extraído em `.qa/sub/` (somente os bytes do pacote, sem `dist/`) e
servido em `http://127.0.0.1:4181/sub/`:

```bash
rm -rf .qa && mkdir -p .qa/sub
unzip -q release/blockbreaker-web.zip -d .qa/sub
cd .qa && python3 -m http.server 4181 --bind 127.0.0.1
```

- Menu carrega com título **Bricklike**; `Play` inicia o HUD e o canvas.
- Todas as respostas foram 2xx; nenhum 404 e nenhum request com falha.
- Hosts observados: `127.0.0.1` e `bridge.playgama.com` (CDN do Bridge). Nenhum
  outro host externo, nenhum request para `api.playgama.com`.
- Console e `pageerror` limpos no cenário com CDN disponível.
- Com `bridge.playgama.com` bloqueado, o fallback local `./playgama-bridge.js`
  é servido, o jogo entra em modo `mock`, abre o menu e inicia a partida.
- Com o CDN bloqueado, o save (`bb.save`) foi gravado e, após reload, a fase 2
  permaneceu desbloqueada. Os únicos erros de console são os dois
  `Failed to load resource: net::ERR_FAILED` esperados do CDN bloqueado; não há
  `pageerror`.

O relatório completo, com comandos e evidências, está em
[`docs/release/technical-validation.md`](release/technical-validation.md).

## Release por tag — somente após o G7

**Não execute estes comandos antes da aprovação explícita do G7.** A submissão
em itch.io, GameFlare, Playgama e CrazyGames é **manual** e continua sendo feita
pelo responsável do projeto; o workflow apenas publica o ZIP e o manifesto como
artefatos de release.

Pré-requisitos:

1. CI verde no commit que receberá a tag (`ci.yml`); o `release.yml` não roda
   E2E, então o smoke E2E deve ter passado no mesmo commit.
2. `npm run package` local limpo, com `unzip -t` OK.
3. `package.json` e `release/manifest.json` com a mesma versão da tag. A versão
   atual do pacote é `0.1.0-m6.1`; a tag planejada é `v0.1.0-mvp`, portanto o
   bump de versão precisa ser decidido antes da tag.

Comandos exatos:

```bash
# 1. A partir de main já aprovada e sincronizada
git switch main
git pull --ff-only
git status                      # deve estar limpo

# 2. Tag anotada (dispara .github/workflows/release.yml no push)
git tag -a v0.1.0-mvp -m "Bricklike v0.1.0-mvp"
git push origin v0.1.0-mvp
```

O workflow `Release` roda typecheck, testes, validação de conteúdo, validação do
config do Bridge, build e package; depois cria automaticamente o GitHub Release
`Bricklike v0.1.0-mvp` com `blockbreaker-web.zip` e `manifest.json`.

Conferência:

```bash
gh run list --workflow Release --limit 1
gh release view v0.1.0-mvp --json name,assets,url
```

Fallback manual **somente** se o workflow falhar depois de o build ter passado
localmente (não rode junto com o passo automático, para não duplicar a release):

```bash
npm run build && npm run package
gh release create v0.1.0-mvp \
  release/blockbreaker-web.zip release/manifest.json \
  --title "Bricklike v0.1.0-mvp" \
  --generate-notes
```

O `release.yml` usa `permissions: contents: write`, `concurrency` sem cancelar
release em andamento e `softprops/action-gh-release@v2` com
`fail_on_unmatched_files: true`. Para o escopo do MVP não é necessária
alteração no workflow.

## Checklist final de release (M7)

- [x] `npm run build` e `npm run package` limpos no worktree.
- [x] `index.html` e `playgama-bridge-config.json` na raiz do ZIP.
- [x] `unzip -t` sem erros.
- [x] 13 arquivos, 0,48 MiB, maior path com 38 caracteres.
- [x] Sem paths absolutos e sem URLs externas fora da allowlist.
- [x] ZIP extraído em subpasta abre, inicia e carrega assets sem 404.
- [x] Somente `bridge.playgama.com` como host externo no boot.
- [x] CDN do Bridge bloqueado: fallback local, modo mock e save/reload OK.
- [x] `npm run test:e2e` — 16 testes passando.
- [x] `release.yml` revisado: tag `v*`, nome Bricklike, dois anexos,
      `contents: write`.
- [ ] Bump de versão alinhado à tag (decisão do agente principal antes do G7).
- [ ] Tag, push e GitHub Release executados **somente após o G7**.
- [ ] Upload/submissão nos portais feito manualmente pelo responsável.

## Fora do escopo deste milestone

A submissão a portais, capas, vídeo, descrição e criação da release pública de
loja continuam **manuais** e dependem do G7. Este trabalho entrega build, ZIP,
config, CI e release técnica por tag; não publica em nenhum portal e não cria
tag, push nem GitHub Release.
