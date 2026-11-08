# Validação técnica de release — M7

Data: 2026-11-08
Branch: `agent/s6/m7-platform`
Base: `c0d8928` (`feat(brand): rename the game to Bricklike`)
Worktree: `.worktrees/m7-s6`

Escopo: validar a engenharia de release do build aprovado no G6 e preparar o
runbook de tag/GitHub Release. **Nenhuma tag, push ou release foi criada**, e
nenhum portal recebeu upload. A submissão é manual e só ocorre após o G7.

## Ambiente

- Node.js com `node_modules` do worktree (sem dependências novas).
- Vite 8.3.6, Phaser 3.90.0, Bridge 2.4.1.
- `zip`/`unzip` do sistema.
- Playwright/Chromium já em cache (`chromium-1254`).
- Servidor local: `python3 -m http.server` em `127.0.0.1:4181`.
- Nenhum arquivo temporário em `/tmp`; o teste usou `.qa/` dentro do worktree.

## Comandos executados

```bash
rm -rf dist release
npm run build
npm run package
unzip -l release/blockbreaker-web.zip
unzip -t release/blockbreaker-web.zip

rm -rf .qa && mkdir -p .qa/sub
unzip -q release/blockbreaker-web.zip -d .qa/sub
cd .qa && python3 -m http.server 4181 --bind 127.0.0.1

npm run test:e2e
```

O probe de subpasta foi um script descartável em `.qa/probe.mjs`, usando
`chromium` do `@playwright/test`, removido antes do commit.

## Resultado do build e do pacote

```text
[package] OK
  zip:          release/blockbreaker-web.zip
  files:        13
  size:         490.5 KiB (502321 bytes)
  paths <=      240 chars
  sha256:       cd809581e656337f28c8ef8a8c5a646f5054b0733ae5b35a3cca0f79ed74188e
  root entries: index.html, playgama-bridge-config.json
```

| Métrica | Resultado | Limite | Status |
|---|---|---|---|
| Tamanho do ZIP | 502.321 bytes (0,48 MiB) | 250 MiB (CrazyGames) / 300 MiB (Playgama) | OK |
| Tamanho descompactado | 1.859.569 bytes (1,77 MiB) | 500 MiB (itch.io) | OK |
| Arquivos | 13 | 1.000 (portal) / 1.500 (CrazyGames) | OK |
| Maior path | 38 chars | 240 chars | OK |
| `unzip -t` | sem erros | — | OK |
| `index.html` na raiz | sim | obrigatório | OK |
| `playgama-bridge-config.json` na raiz | sim | obrigatório | OK |

Conteúdo do ZIP:

```text
assets/.gitkeep
assets/Game-CxPDSN89.js
assets/Silkscreen-Bold-BHMh3gvp.ttf
assets/Silkscreen-Regular-W9-u5Upq.ttf
assets/index-B1r3TE0M.css
assets/index-DhEy1d-J.js
favicon.svg
index.html
licenses/phaser-LICENSE.md
licenses/playgama-bridge-LICENSE.txt
licenses/silkscreen-OFL.txt
playgama-bridge-config.json
playgama-bridge.js
```

O `assets/.gitkeep` vazio vem de `public/assets/` e é inofensivo (0 bytes). Pode
ser removido em um milestone futuro se o pacote precisar ficar estritamente sem
arquivos vazios; não é bloqueio de portal.

## Caminhos e URLs externas

- `scripts/package.mjs` falha se `index.html` ou o config não estiverem na raiz,
  se houver path absoluto, `..`, backslash, URL externa fora da allowlist, mais
  de 1.000 arquivos, mais de 250 MiB ou path acima de 240 caracteres. Rodou sem
  issues.
- Grep manual no conteúdo extraído (`*.html`, `*.css`, `*.json`, excluindo o
  runtime vendorizado `playgama-bridge.js`) encontrou apenas:
  `https://bridge.playgama.com/v2/stable/playgama-bridge.js` em `index.html`.
- O runtime `playgama-bridge.js` é vendorizado e contém endpoints internos dos
  portais suportados; ele é explicitamente ignorado pelo validador.

## Teste em subpasta (ZIP real)

ZIP extraído em `.qa/sub/` e servido em `http://127.0.0.1:4181/sub/`.

Cenário com CDN do Bridge disponível:

```json
{
  "title": "Bricklike",
  "canvasVisible": true,
  "hosts": ["127.0.0.1", "bridge.playgama.com"],
  "externalRequests": [],
  "badResponses": [],
  "failedRequests": [],
  "consoleErrors": [],
  "pageErrors": []
}
```

- `Play` abriu o HUD e o canvas.
- Todos os assets responderam 200 (CSS, JS do jogo, JS do Phaser, fontes,
  config e bridge local no cenário bloqueado).
- Nenhum request para `api.playgama.com` ou qualquer host além do CDN do Bridge.

Cenário com `bridge.playgama.com` bloqueado (`route.abort()`):

```json
{
  "platform": "mock · bridge",
  "savePresent": true,
  "phase2EnabledAfterReload": true,
  "bridgeBlocked": true,
  "pageErrors": [],
  "badResponses": []
}
```

- O fallback local `./playgama-bridge.js` foi servido (200) e o Bridge entrou em
  modo `mock`, como esperado em itch.io/GameFlare.
- `Force victory` → `Next level` gravou `bb.save` com `unlockedPhase: 2`.
- Após reload sem `?resetSave=1`, a fase 2 apareceu habilitada.
- Dois erros de console `Failed to load resource: net::ERR_FAILED` são o efeito
  esperado do CDN bloqueado; não houve `pageerror`. O teste E2E do repositório
  já documenta esse comportamento.

## Testes automatizados

`npm run test:e2e` no worktree:

```text
Running 16 tests using 3 workers
...
16 passed (1.1m)
```

Cobertura relevante para release:

- boot do menu, `Play` e ausência de requests para `api.playgama.com`;
- controles, pause/resume e persistência de configuração após reload;
- level up, vitória de fase e desbloqueio da fase 2 entre reloads;
- ad mock `show` e `fail` na saída dos results;
- CDN do Bridge bloqueado com fallback local;
- matriz de layout 320×568, 390×844, 430×932, 1440×900 e guarda de landscape.

O E2E roda contra `vite preview` na raiz (`base: './'`); o teste em subpasta
com o ZIP extraído foi feito separadamente e é a evidência específica de M7.

## Revisão de `.github/workflows/release.yml`

| Item | Estado |
|---|---|
| Trigger | `push` de tags `v*` | OK |
| Nome da release | `Bricklike ${{ github.ref_name }}` | OK |
| Anexos | `release/blockbreaker-web.zip`, `release/manifest.json` | OK |
| `fail_on_unmatched_files` | `true` | OK |
| Permissões | `contents: write` | OK |
| Concorrência | grupo por ref, sem cancelar release em andamento | OK |
| Timeout | 20 minutos | OK |
| Bateria antes de publicar | typecheck, test, validate:content, bridge config, build, package | OK |
| Upload de artifact do ZIP | `blockbreaker-web`, retenção 30 dias | OK |

As actions usadas existem e estão disponíveis: `actions/checkout@v7`,
`actions/setup-node@v7`, `actions/upload-artifact@v7` e
`softprops/action-gh-release@v2`.

**Nenhuma correção foi necessária no workflow.** Observação de processo: o
`release.yml` não roda E2E; o commit tagueado deve ter CI verde e o E2E deve ter
passado no mesmo commit. O workflow também não faz bump de versão.

### Runbook (executar somente após G7)

```bash
git switch main
git pull --ff-only
git status                      # limpo

git tag -a v0.1.0-mvp -m "Bricklike v0.1.0-mvp"
git push origin v0.1.0-mvp
```

O push da tag dispara o workflow, que cria o GitHub Release com os dois anexos.
Conferir:

```bash
gh run list --workflow Release --limit 1
gh release view v0.1.0-mvp --json name,assets,url
```

Fallback manual, somente se o workflow falhar e o build local estiver validado:

```bash
npm run build && npm run package
gh release create v0.1.0-mvp \
  release/blockbreaker-web.zip release/manifest.json \
  --title "Bricklike v0.1.0-mvp" \
  --generate-notes
```

Não executar o fallback junto com o workflow para não duplicar a release.

## Riscos e pendências

1. **Versão divergente (bloqueio antes da tag).** `package.json` está em
   `0.1.0-m6.1`, então `manifest.json` sai com essa versão, enquanto a tag
   planejada é `v0.1.0-mvp`. O agente principal precisa decidir: bumpar
   `package.json` para `0.1.0-mvp` antes do package, ou taguear
   `v0.1.0-m6.1`. O escopo do S6 proíbe alterar versão.
2. **E2E fora do release.yml.** O workflow de release não instala Playwright nem
   roda E2E. Pré-requisito: CI verde no commit da tag. Rodar `npm run test:e2e`
   localmente no commit exato da tag se houver qualquer alteração desde o
   último CI.
3. **Submissão manual.** itch.io, GameFlare, Playgama e CrazyGames Basic Launch
   são uploads manuais do responsável, com os textos/capas/vídeo do S8. O ZIP
   validado aqui é o mesmo arquivo para os quatro portais.
4. **CDN do Bridge.** O build depende de `bridge.playgama.com` no boot e cai no
   runtime local se o CDN falhar. O fallback foi validado, mas o primeiro boot
   em rede lenta continua sujeito à latência do CDN; o timeout de inicialização
   do Bridge cobre a degradação.
5. **`assets/.gitkeep` vazio.** Cosmético, sem impacto em limites ou portais.
6. **`?debug=1` e `?resetSave=1`.** São parâmetros de QA; a URL enviada aos
   portais deve ser a raiz, sem query. O código não expõe debug por padrão.

## Conclusão

O pacote está tecnicamente pronto para publicação: ZIP íntegro, na estrutura
exigida, com caminhos relativos, sem dependências externas além do CDN do
Bridge e com fallback local funcional. A tag e o GitHub Release ficam
**retidos até o G7** e dependem da decisão de versão acima.
