# Build e release — Bricklike

## Targets

| Target | Destino | SDK | Saída |
|---|---|---|---|
| `bridge` | Playgama, Y8, Lagged, itch.io (`mock`) | Playgama Bridge 2.4.4 | `dist/` + `release/blockbreaker-web.zip` |
| `clean` | CrazyGames Basic, Kongregate | Nenhum | `dist-clean/` + `release/blockbreaker-web-clean.zip` |

O `bridge` continua sendo o build padrão do GitHub Pages e do `npm run preview`.
O clean é o único que deve ser enviado ao CrazyGames Basic. O guia de
implementação e as armadilhas estão em
[`build-bridge-clean-playbook.md`](build-bridge-clean-playbook.md).

## Comandos

```bash
npm ci
npm run typecheck
npm test
npm run validate:content
node scripts/validate-bridge-config.mjs
npm run build            # dist/ + dist-clean/
npm run package          # dois ZIPs + manifestos
npm run test:e2e         # bridge 4173 + mobile + clean 4174
```

Comandos por target:

```bash
npm run build:bridge
npm run build:clean
npm run package:bridge
npm run package:clean
npm run preview          # dist/ (bridge)
npm run preview:clean    # dist-clean/
```

`npm run build` roda `tsc -b` uma vez e dois builds Vite. O target é resolvido
em tempo de build (`@boot-target`), não em runtime. `npm run package` apaga
`release/` apenas quando gera os dois targets; `package:bridge`/`package:clean`
preservam o artefato do outro target.

## O que cada ZIP leva

### Bridge (`release/blockbreaker-web.zip`)

```text
index.html
playgama-bridge-config.json
playgama-bridge.js
favicon.svg
assets/...                 # JS/CSS/fontes
bad-decision-games/...     # logo WebP/PNG
how-to-play/...            # 5 screenshots 780x468
licenses/...               # Phaser, Silkscreen, Playgama Bridge
```

- `index.html` e o config do Bridge na raiz;
- runtime da Playgama vendorizado em `playgama-bridge.js`;
- URLs externas permitidas: `sdk.crazygames.com` (adapter nativo no host do
  portal), `bridge.playgama.com` (vendor), `phaser.io` e `www.w3.org`
  (strings não-request);
- o runtime vendorizado não é escaneado pelo validador de URLs.

### Clean (`release/blockbreaker-web-clean.zip`)

```text
index.html
favicon.svg
assets/...                 # JS/CSS/fontes
bad-decision-games/...
how-to-play/...
licenses/phaser-LICENSE.md
licenses/silkscreen-OFL.txt
```

- **sem** `playgama-bridge.js`, `playgama-bridge-config.json` ou licença da
  Playgama;
- **sem** `sdk.crazygames.com`, `crazygames.com` ou `1001juegos.com` em
  qualquer arquivo de texto;
- **sem** botões de anúncio; o fluxo de ads retorna `skipped`;
- save/settings via browser storage, com fallback para memória e aviso somente
  quando o storage não persiste;
- limites do CrazyGames Basic: alvo ≤ 20 MB, teto 50 MB, ≤ 1.500 arquivos,
  paths ≤ 240 caracteres.

`scripts/package.mjs` valida os dois targets de forma independente: o bridge
exige o config e usa a allowlist da Playgama/CrazyGames; o clean proíbe os
termos e arquivos da Playgama/CrazyGames e usa apenas `www.w3.org`/`phaser.io`
como strings não-request permitidas.

## Configuração do Bridge

`public/playgama-bridge-config.json` é copiado para `dist/` e para a raiz do ZIP
bridge. `node scripts/validate-bridge-config.mjs` confere o schema do Bridge
2.4.4:

- sem loading screen/logo do Bridge e sem analytics;
- `game.adaptToSafeArea: true`;
- interstitial com `minimumDelayBetweenInterstitial: 60` e
  `initialInterstitialDelay: 0`;
- `placementFallback` definido; sem banners;
- `platforms.mock` sem logo/analytics;
- nenhuma URL externa no config.

O jogo pede interstitials em pausas naturais: na campanha, somente quando há
próxima onda e a onda limpa é múltipla de 3; no Endless, a cada 4 ondas; o
tutorial não tem ads. **Todo ad concluído inicia um cooldown único de 60 s**:
results, pause, wave e rewarded compartilham o mesmo gate, então um Menu logo
após um rewarded não toca outro anúncio. Um rewarded só abre com 15 s de espera
e pode ficar até 180 s na tela sem virar falha. O Bridge também aplica o mínimo
de 60 s entre interstitials. No clean não há SDK nem ads: o fluxo retorna
`skipped` sem bloquear a navegação. O revive por anúncio não aparece no clean.

## Ads sem portal (QA)

O build bridge roda em modo mock fora de portal, então **não há ads reais**. Use
os flags debug-only:

- `?debug=1&adMock=show` — interstitial de 1,4 s retorna `shown`;
- `?debug=1&adMock=fail` — interstitial retorna `failed`;
- `?debug=1&adMock=rewarded` — rewarded revive retorna `rewarded`;
- `?debug=1&adMock=rewarded-fail` — rewarded revive retorna `failed`.

O proxy é debug-only: storage, lifecycle, mensagens e config continuam reais. O
mock é curto (1,4 s/2,4 s); o caso de rewarded aberto por >15 s é coberto pelos
testes unitários do adapter, não pelo mock. O painel de debug mostra suporte a
`interstitial / rewarded`. Ads reais exigem Playgama ou CrazyGames (Full Launch).

## Teste em subpasta

O build usa `base: './'`, então funciona em qualquer subpasta. Use uma pasta
descartável dentro do worktree (`.qa/`), removida antes do commit:

```bash
rm -rf .qa
mkdir -p .qa/sub
unzip -q release/blockbreaker-web-clean.zip -d .qa/sub
cd .qa
python3 -m http.server 4181 --bind 127.0.0.1
```

Abra `http://127.0.0.1:4181/sub/`. Repita com `blockbreaker-web.zip` quando
quiser conferir o bridge. Para validar sem extrair:

```bash
unzip -l release/blockbreaker-web-clean.zip
unzip -t release/blockbreaker-web-clean.zip
unzip -p release/blockbreaker-web-clean.zip assets/index-*.js | grep -iE 'playgama|crazy'
```

O último comando deve sair vazio.

## CI e release

- `.github/workflows/ci.yml`: em push/PR roda typecheck, tests, conteúdo,
  config do Bridge, build, package e E2E; sobe `dist/`, `dist-clean/` e os dois
  ZIPs/manifestos.
- `.github/workflows/deploy.yml`: publica `dist/` (**bridge**) no GitHub Pages
  para review; não é canal de submissão.
- `.github/workflows/release.yml`: em tag `v*` roda a bateria, empacota e cria
  um GitHub Release com `blockbreaker-web.zip`, `manifest.json`,
  `blockbreaker-web-clean.zip` e `manifest-clean.json`.

## Checklist de build e portal

Comum:

- [ ] `npm run build` gerou `dist/` e `dist-clean/`.
- [ ] `npm run package` gerou os dois ZIPs e os dois manifestos.
- [ ] `unzip -t` OK nos dois ZIPs.
- [ ] Abrir cada build em subpasta sem 404 e com paths relativos.
- [ ] Sem scrollbar; toque, mouse e teclado; rotação preserva progresso.
- [ ] ZIPs ≤ 250 MB (bridge) / ≤ 50 MB (clean), ≤ 1.500 arquivos, paths ≤ 240.

Bridge:

- [ ] `unzip -l` mostra `index.html` e `playgama-bridge-config.json` na raiz.
- [ ] Network sem requests externas; o Bridge é local e não há chamada ao CDN
      da Playgama no boot. No host CrazyGames, o adapter nativo carrega o SDK
      do próprio portal.
- [ ] Mock/adblock: com SDK bloqueado, o jogo cai no `FallbackAdapter` e abre.
- [ ] Rede lenta: boot não passa de 10 s; storage tem timeout e cai em memória.
- [ ] Aviso “Progress may not be saved” aparece e abre o popup quando o storage
      é memória/fallback.
- [ ] `game_ready` enviado uma vez só depois do menu interativo.
- [ ] `level_started`, `level_paused`, `level_resumed`, `level_completed` e
      `level_failed` chegam ao Bridge nos momentos certos.
- [ ] Storage via Bridge (`bb.save`/`bb.settings`), sem acesso direto do
      gameplay; reload preserva progresso e `?resetSave=1` limpa.
- [ ] Ads: tutorial sem ads; campanha só em onda múltipla de 3 com próxima onda;
      Endless a cada 4; cooldown único de 60 s após qualquer ad; `failed`/
      `skipped`/timeout de abertura (15 s) retomam o jogo; rewarded só em
      `rewarded` e aberto pode durar até 180 s; Menu após rewarded não toca
      outro ad.

Clean:

- [ ] `unzip -Z1` não mostra `playgama`/`crazy`; o JS/CSS/HTML também não.
- [ ] Network sem requests a `playgama-bridge.js`, `sdk.crazygames.com` ou
      qualquer host externo.
- [ ] Settings e save persistem após reload; `?resetSave=1` limpa.
- [ ] Aviso “Progress may not be saved” fica escondido quando o storage persiste.
- [ ] Nenhum botão de anúncio/revive por anúncio aparece.
- [ ] Pausa ao trocar de aba/janela (visibilitychange/blur).
- [ ] `?debug=1` mostra `clean`, `localStorage`, `no SDK` e `— / —` em ads.

Conteúdo/economia (ambos):

- [ ] Save antigo com `unlockedPhase >= 1` não repete o tutorial; save novo
      começa em 0 e o skip libera o level 1.
- [ ] Save v1 migra para v2 com `sparks = 0` e `unlocks = []`, preservando
      campanha e Endless; a run ativa não é salva.
- [ ] Workshop abre pelo menu, mostra card com `X / 22`, `N left` e barra,
      lista quatro tiers/12 cards, compra com saldo, persiste após reload e
      mostra a perk comprada como owned; results mostram `+X Sparks · total Y`
      com breakdown por fonte.
- [ ] Tier 4 comprável e funcional: Overkill espalha o excedente, Shield Bash
      dispara a cada 8 acertos e Conductor encadeia o laser uma vez.
- [ ] Economia: onda `1 + floor(blocos/12)`, combo 5/10/15, chefe +3, clear +6,
      first clear +12 e teto 250; retry de onda premiada não paga de novo.
- [ ] Ofertas nunca incluem perk bloqueada; a comprada entra na pool; Conductor
      exige Prism Laser.
- [ ] Laser bloqueado até o lançamento explícito da bola; HUD mostra
      “Launch the ball first”.
- [ ] Edge assist do toque ativo no celular; mouse continua absoluto.
- [ ] Áudio mutado em ads/background; `AUDIO_STATE_CHANGED` aplicado no boot.
- [ ] Relógio da run não conta pause, level-up, ads ou revive offer.

## Pacote atual

Referência de 2026-11-28, versão **0.8.1** (patch de ads, local), com a
**0.8.0** publicada no **itch.io** e na **Playgama**; Y8 em análise; CrazyGames
recusou a clean. Sem tag ou GitHub Release. Confirme sempre o hash no manifesto
antes de qualquer upload.

| Item | Bridge | Clean |
|---|---|---|
| ZIP | `release/blockbreaker-web.zip` | `release/blockbreaker-web-clean.zip` |
| Arquivos | 20 | 17 |
| Tamanho | 1.546.174 bytes (~1.510 KiB) | 1.431.541 bytes (~1.398 KiB) |
| SHA-256 | `0923f8eb0b9b77d1d6fcf6d8ea1888894361f791fe9f3ee346eba27917a07365` | `890e5419142d5f17ca34a1d3b15f293497bf3544f8f6616216a9e38b9fc9b6f7` |
| Raiz | `index.html` + config | `index.html` |
| Conteúdo | Bridge 2.4.4 local | sem SDK, sem ads |

## Release por tag — somente após aprovação humana

**Não crie tag ou release sem decisão explícita.** A `0.8.1` é o patch local
de ads; a `0.8.0` está publicada no itch.io e na Playgama, mas ainda não foi
tagueada. O Y8 está em análise e a CrazyGames recusou a clean. A submissão em
itch.io, Playgama, Y8, Lagged, Kongregate e CrazyGames é manual e feita pelo
responsável.

Pré-requisitos:

1. Teste humano da 0.8.0 concluído e CI verde no commit que receberá a tag; o
   `release.yml` não roda E2E.
2. `npm run package` local limpo, com `unzip -t` OK nos dois ZIPs.
3. `package.json` e os dois manifestos na mesma versão da tag.

Comandos exatos, quando aprovado:

```bash
git switch main
git pull --ff-only
git status                      # deve estar limpo

git tag -a v0.8.0 -m "Bricklike v0.8.0"
git push origin v0.8.0
```

Conferência:

```bash
gh run list --workflow Release --limit 1
gh release view v0.8.0 --json name,assets,url
```

Fallback manual **somente** se o workflow falhar e o build local estiver
validado:

```bash
npm run build && npm run package
gh release create v0.8.0 \
  release/blockbreaker-web.zip release/manifest.json \
  release/blockbreaker-web-clean.zip release/manifest-clean.json \
  --title "Bricklike v0.8.0" \
  --generate-notes
```

Não rode o fallback junto com o workflow para não duplicar a release.

## Fora do escopo

Submissão a portais, capas, vídeo, descrição e release pública de loja continuam
manuais. O build técnico e os ZIPs são gerados por este runbook; nenhum portal é
publicado automaticamente.
