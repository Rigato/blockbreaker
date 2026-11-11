# Build e release — Bricklike

## Comandos

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

## Conteúdo esperado do ZIP (0.4.0)

```text
index.html
playgama-bridge-config.json
playgama-bridge.js
favicon.svg
assets/...                 # JS/CSS/fontes
bad-decision-games/...     # logo WebP/PNG
how-to-play/...            # 5 screenshots 780x468
licenses/...
```

Regras verificadas por `scripts/package.mjs`:

- `index.html` e o config do Bridge na raiz;
- assets com caminhos relativos (`./assets/...`, `./favicon.svg`);
- nenhum `src="/..."`, `href="/..."`, `url(/...)` ou import absoluto;
- nenhuma URL externa no conteúdo do jogo. A exceção é o CDN do Bridge
  (`https://bridge.playgama.com`). O fallback local (`./playgama-bridge.js`) é
  permitido. O runtime vendorizado `playgama-bridge.js` não é escaneado;
- `https://phaser.io` e namespaces `www.w3.org` são strings não-request e estão
  na allowlist do validador.

## Configuração do Bridge

`public/playgama-bridge-config.json` é copiado para `dist/` e para a raiz do
ZIP. `node scripts/validate-bridge-config.mjs` confere o schema do Bridge 2.4.1:

- sem loading screen/logo do Bridge e sem analytics;
- `game.adaptToSafeArea: true`;
- interstitial com `minimumDelayBetweenInterstitial: 60` e
  `initialInterstitialDelay: 0`;
- `placementFallback` definido; sem banners;
- `platforms.mock` sem logo/analytics;
- nenhuma URL externa no config.

O jogo pede interstitials em pausas naturais e não implementa frequência própria
além da cadência de ondas; o Bridge aplica o mínimo de 60 s. Em Basic Launch do
CrazyGames os ads ficam desligados e o fluxo retorna `skipped`/`failed` sem
bloquear a navegação.

## Ads sem portal (QA)

O build web normal roda em modo mock (itch.io, GameFlare, GitHub Pages), então
**não há ads reais**. Use os flags debug-only:

- `?debug=1&adMock=show` — interstitial de 1,4 s retorna `shown`;
- `?debug=1&adMock=fail` — interstitial retorna `failed`;
- `?debug=1&adMock=rewarded` — rewarded revive retorna `rewarded`;
- `?debug=1&adMock=rewarded-fail` — rewarded revive retorna `failed`.

O proxy é debug-only: storage, lifecycle, mensagens e config continuam reais. O
painel de debug mostra suporte a `interstitial / rewarded`. Ads reais exigem
Playgama ou CrazyGames.

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
  config do Bridge, build, package e E2E; sobe `dist/` e o ZIP.
- `.github/workflows/deploy.yml`: publica `dist/` no GitHub Pages para review;
  não é canal de submissão.
- `.github/workflows/release.yml`: em tag `v*` roda a bateria, empacota e cria
  um GitHub Release com `blockbreaker-web.zip` e `manifest.json`.

## Checklist de build e portal

- [ ] `unzip -l` mostra `index.html` e `playgama-bridge-config.json` na raiz.
- [ ] Abrir o build em subpasta sem 404 e com paths relativos.
- [ ] Network sem requests externas além do CDN do Bridge/fallback local.
- [ ] Mock/adblock: com SDK bloqueado, o jogo cai no `FallbackAdapter` e abre.
- [ ] Rede lenta: boot não passa de 10 s; storage tem timeout e cai em memória.
- [ ] `game_ready` enviado uma vez só depois do menu interativo.
- [ ] `level_started`, `level_paused`, `level_resumed`, `level_completed` e
      `level_failed` chegam ao Bridge nos momentos certos.
- [ ] Storage via Bridge (`bb.save`/`bb.settings`), sem `localStorage` direto;
      reload preserva progresso e `?resetSave=1` limpa.
- [ ] Ads: interstitials a cada 3/4 ondas e na saída dos results; `failed`/
      `skipped`/timeout de 15 s retomam o jogo; rewarded revive só em `rewarded`.
- [ ] Áudio mutado em ads/background; `AUDIO_STATE_CHANGED` aplicado no boot.
- [ ] Relógio da run não conta pause, level-up, ads ou revive offer.
- [ ] Responsivo de 320 px ao desktop, sem scrollbar; toque, mouse e teclado.
- [ ] Rotação preserva progresso (pausa + overlay).
- [ ] ZIP ≤ 250 MB, ≤ 1.500 arquivos, paths ≤ 240 caracteres.
- [ ] Sem logo do Bridge no mock; modo mock sem analytics.
- [ ] Screenshots/capas/vídeos conferidos contra o build atual.

## Pacote atual

Referência de 2026-11-10, versão **0.4.0**:

| Item | Valor |
|---|---|
| ZIP | `release/blockbreaker-web.zip` |
| Tamanho | 1.514.701 bytes (~1.479 KiB) |
| Arquivos | 20 |
| SHA-256 | `af3e55e847cacf7e8828ad7b0de8eb65e87b0c1a07613ebf93dc50bdb299f793` |
| Raiz | `index.html` + `playgama-bridge-config.json` |
| Conteúdo | 5 HowTo, 2 logos, JS/CSS/fontes, licenças, Bridge |

O hash muda a cada build; confirme o valor em `release/manifest.json` antes de
qualquer upload.

## Release por tag — somente após aprovação humana

**Não crie tag ou release sem decisão explícita.** A submissão em itch.io,
GameFlare, Playgama e CrazyGames é manual e feita pelo responsável.

Pré-requisitos:

1. CI verde no commit que receberá a tag; o `release.yml` não roda E2E.
2. `npm run package` local limpo, com `unzip -t` OK.
3. `package.json` e `release/manifest.json` na mesma versão da tag.

Comandos exatos, quando aprovado:

```bash
git switch main
git pull --ff-only
git status                      # deve estar limpo

git tag -a v0.4.0 -m "Bricklike v0.4.0"
git push origin v0.4.0
```

Conferência:

```bash
gh run list --workflow Release --limit 1
gh release view v0.4.0 --json name,assets,url
```

Fallback manual **somente** se o workflow falhar e o build local estiver
validado:

```bash
npm run build && npm run package
gh release create v0.4.0 \
  release/blockbreaker-web.zip release/manifest.json \
  --title "Bricklike v0.4.0" \
  --generate-notes
```

Não rode o fallback junto com o workflow para não duplicar a release.

## Fora do escopo

Submissão a portais, capas, vídeo, descrição e release pública de loja continuam
manuais. O build técnico e o ZIP são gerados por este runbook; nenhum portal é
publicado automaticamente.
