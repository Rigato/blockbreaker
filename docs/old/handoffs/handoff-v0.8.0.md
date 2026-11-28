# Handoff — Bricklike v0.8.0

> **Histórico:** substituído pelo [`handoff-v0.8.1.md`](../../handoff-v0.8.1.md).

**Fonte de onboarding para a próxima sessão.**
**Data:** 2026-11-27
**Branch:** `main`
**Commit:** `7975178 docs(store): add Y8 asset set and store spec`
**Commit do build split:** `00eeb90 feat(build): add bridge and clean portal targets`
**Versão do package:** `0.8.0`
**Build:** `0.8.0` publicado; sem tag/release — bridge × clean
**Base publicada:** `0.8.0` no itch.io e na Playgama (catálogo, fora do sandbox); Y8 em análise; CrazyGames recusou a clean
**Repositório:** <https://github.com/Rigato/blockbreaker>
**Pasta local:** `/mnt/SSD-Secundario/Nextcloud/5-GameProjects/4-Blockbreaker-roguelite`

> Este documento substitui o [`handoff-v0.7.2.md`](old/handoffs/handoff-v0.7.2.md)
> como fonte atual. O GDD v1.15, o
> [`design/overhaul-direcoes.md`](design/overhaul-direcoes.md) e a
> [`proposta de perks`](design/perks-rework-v0.7.md) seguem como fontes de
> design. A spec de publicação vigente é a
> [`spec_tecnica_portais_web.md`](spec_tecnica_portais_web.md); o guia anterior
> está em [`old/spec-tecnica-publicacao.md`](old/spec-tecnica-publicacao.md).

---

## 1. Snapshot

| Item | Valor |
|---|---|
| Branch | `main` |
| Versão local | `0.8.0` |
| Versão publicada | `0.8.0` no itch.io e na Playgama (catálogo, fora do sandbox) |
| Y8 | `0.8.0` enviada; aguardando resposta |
| CrazyGames | `0.8.0` clean enviada e recusada, sem motivo específico |
| Mundos | I · Crystal Vale; II · Neon Lattice; III · Rustwake |
| Campanha | 18 fases + tutorial; 69 ondas de campanha / 71 com tutorial |
| Tutorial | 2 ondas, 12 blocos, 15 XP, 1 level up, 2 coach marks, paddle 2× e ímã |
| Blocos | 17 tipos (9 originais + 8 novos) |
| Elementos | 10 tipos (7 originais + press, belt, rail) |
| Chefes | 9 (3 por mundo) |
| Perks | 22 (inalteradas nesta linha) |
| Save | v3; `unlockedPhase` 0..18 |
| Endless | continua abrindo no clear da fase 6 |
| Pierce | regra base, excedente ≥ 1, só bola |
| SDK bridge | Playgama Bridge **2.4.4**; runtime vendorizado local |
| SDK clean | nenhum (sem Playgama, sem SDK nativo do CrazyGames) |
| Builds | `dist/` + `blockbreaker-web.zip` (bridge); `dist-clean/` + `blockbreaker-web-clean.zip` (clean) |
| Publicação | `0.8.0` publicada no itch.io/Playgama; Y8 em análise; CrazyGames recusou a clean; nenhuma tag/release |
| Store Y8 | conjunto 0.8.0 em `store/y8/`; upload do jogo enviado, aguardando resposta |

---

## 2. O que mudou na 0.8.0

### 2.1 Dois targets de build

- `npm run build` roda `tsc -b` e dois builds Vite:
  - **bridge** → `dist/`, com o runtime/config da Playgama;
  - **clean** → `dist-clean/`, sem Playgama, sem SDK do CrazyGames e sem ads.
- `npm run package` gera:
  - `release/blockbreaker-web.zip` + `release/manifest.json` (bridge);
  - `release/blockbreaker-web-clean.zip` + `release/manifest-clean.json` (clean).
- Comandos por target: `build:bridge`, `build:clean`, `package:bridge`,
  `package:clean`, `preview:clean`.
- O GitHub Pages continua publicando `dist/` (**bridge**). O `npm run preview`
  continua servindo o bridge em 4173.

### 2.2 Boot por alias, não por runtime

- `@boot-target` é resolvido no build (`vite.config.ts` + `tsconfig.paths`):
  - `src/boot/platformBootBridge.ts` no bridge;
  - `src/boot/platformBootClean.ts` no clean.
- `src/boot/platformBoot.ts` é a entrada estável usada por `src/main.ts`.
- O clean não contém o loader `playgama-bridge.js`, o adapter nativo do
  CrazyGames nem as strings/SDKs correspondentes. A garantia é por grafo de
  módulos, não apenas por dead-code elimination.
- `src/boot/bootTypes.ts` define `BootResult` com `buildTarget`,
  `storagePersistent` e `storageLabel`. `PlatformService` **não foi alterado**
  (decisão 2B): o clean reporta `source: 'fallback'` e
  `storageKind: 'bridge'`/`'memory'` para compatibilidade; a UI usa os campos do
  boot para o aviso de storage e o painel de debug mostra `localStorage`.

### 2.3 Clean platform

- `src/platform/CleanAdapter.ts`: `id = 'clean'`, sem ads, `sendMessage`
  no-op, pausa por `visibilitychange` + `blur`/`focus`.
- `src/storage/BrowserStorage.ts`: `localStorage` com `try/catch`; se falhar,
  degrada para memória na sessão. É o único módulo com acesso direto a browser
  storage; o resto usa `StorageService`.
- O clean não tem botão de revive por anúncio; `isRewardedSupported = false`,
  `showInterstitial`/`showRewarded` retornam `skipped`.
- O save/settings continuam `bb.save`/`bb.settings`, schema v3, sem migração
  nova.

### 2.4 Empacotamento e validação

- `scripts/build.mjs` orquestra os dois builds e remove do `dist-clean`:
  `playgama-bridge.js`, `playgama-bridge-config.json` e
  `licenses/playgama-bridge-LICENSE.txt`.
- `scripts/package.mjs` valida por target:
  - bridge: exige o config da Playgama e usa a allowlist atual;
  - clean: exige só `index.html`, proíbe arquivos/termos `playgama`,
    `sdk.crazygames.com`, `crazygames.com` e `1001juegos.com`, e aplica os
    limites do CrazyGames Basic.
- `tests/platform.test.ts` mantém a proibição de storage direto em
  `src/platform`/`src/boot`; `tests/browserStorage.test.ts` confina o acesso
  real a `src/storage/BrowserStorage.ts`.

### 2.5 Testes

- `npm test`: **440 testes / 37 arquivos**.
- `npm run test:e2e`: **46 testes** (bridge desktop + mobile + clean).
- O projeto Playwright `chromium-clean` roda em 4174 e verifica:
  nenhuma request a Playgama/CrazyGames, nenhuma request externa, save/settings
  persistindo após reload, aviso de storage escondido, `clean`/`localStorage`
  no debug e gameplay sem erro.
- O mock de rewarded em debug passou de 1,2 s para 2,4 s para estabilizar a
  asserção do overlay sob workers paralelos.

### 2.6 Store e documentação

- `store/y8/` foi gerado da 0.8.0:
  - 6 Standard 760×570;
  - 6 Widescreen 1280×720;
  - 3 Landscape Promo 1920×1080 (1 key art + 2 stills);
  - 3 Portrait Promo 1080×1920 (1 key art + 2 stills);
  - 3 Game Cards 760×570 (still + título);
  - 1 vídeo contínuo 1280×720, 29,97 s, H.264, ~1,2 MB.
- O preview antigo `store/video/bricklike-preview.mp4` é **editado, com cortes
  e capa final**; o Y8 exige gameplay contínuo e não aceita trailer. O vídeo do
  Y8 é `store/y8/video/bricklike-gameplay-y8-1280x720.mp4`.
- `docs/store-assets-spec.md` é a spec viva de assets por portal, com matriz de
  reutilização. O guia de implementação do split está em
  `docs/build-bridge-clean-playbook.md`.
- A spec de publicação antiga foi movida para
  `docs/old/spec-tecnica-publicacao.md`; a vigente é
  `docs/spec_tecnica_portais_web.md`.

### 2.7 Versão

- `package.json`, `package-lock.json` e o rodapé do menu estão em `0.8.0`.
- Nenhuma tag, release ou publicação nova foi criada.

---

## 3. Arquitetura de arquivos

| Área | Arquivos |
|---|---|
| Mundos | `src/content/worlds.ts` |
| Fases | `src/content/phases.ts` |
| Ondas W2/W3 | `src/content/wavesWorld2.ts`, `src/content/wavesWorld3.ts` |
| Blocos | `src/sim/blocks.ts`, `src/content/blocks.ts`, `src/render/blockArt.ts` |
| Elementos | `src/content/types.ts`, `src/sim/World.ts`, `src/render/elementArt.ts` |
| Chefes | `src/content/types.ts`, `src/sim/World.ts`, `src/render/bossArt.ts` |
| Ímã do tutorial | `src/sim/World.ts`, `src/game/config.ts`, `src/render/GameScene.ts` |
| Pierce | `src/sim/World.ts`, `src/render/GameScene.ts`, `src/audio/AudioService.ts` |
| Cor da bola | `src/render/themes.ts`, `src/render/GameScene.ts` |
| Tutorial | `src/content/waves.ts`, `src/game/Game.ts`, `src/ui/Hud.ts`, `src/style.css` |
| Progressão | `src/progression/xp.ts`, `RunState.ts`, `src/game/contracts.ts` |
| Save | `src/progression/Save.ts`, `src/game/contracts.ts` |
| Fluxo | `src/game/Game.ts` |
| Mapas | `src/ui/map/types.ts`, `world1.ts`, `world2.ts`, `world3.ts` |
| Seletor | `src/ui/PhaseSelect.ts`, `src/styles/phase-select.css` |
| Menu/HUD/Results | `src/ui/Menu.ts`, `src/ui/Hud.ts`, `src/ui/Overlay.ts` |
| Bridge/platform | `src/platform/BridgeAdapter.ts`, `bridgeGlobal.ts`, `CrazyGamesAdapter.ts` |
| Boot | `src/boot/platformBoot.ts`, `platformBootBridge.ts`, `platformBootClean.ts`, `bootTypes.ts` |
| Clean storage | `src/platform/CleanAdapter.ts`, `src/storage/BrowserStorage.ts` |
| Debug | `src/ui/DebugPanel.ts`, `src/ui/PhaseSelect.ts`, `src/platform/MockAds.ts` |
| Build | `vite.config.ts`, `tsconfig.json`, `scripts/build.mjs` |
| Pacote | `scripts/package.mjs`, `package.json` |
| Testes clean | `tests/browserStorage.test.ts`, `tests/cleanAdapter.test.ts`, `tests/e2e/clean.spec.ts`, `playwright.config.ts` |
| Store | `store/y8/`, `docs/store-assets-spec.md` |
| Docs de build | `docs/build-release.md`, `docs/build-bridge-clean-playbook.md` |

---

## 4. Invariantes

1. **Plataforma:** nenhum `if (platform === ...)` no gameplay; tudo via
   `PlatformService`. O `PlatformService` não muda entre bridge e clean.
2. **Storage:** nenhum `localStorage` direto no gameplay; sempre via
   `StorageService`. O acesso direto é permitido apenas em
   `src/storage/BrowserStorage.ts`.
3. **Build:** `dist/` é o bridge; `dist-clean/` é o clean. O clean não pode
   conter runtime/config da Playgama nem SDK/strings do CrazyGames.
4. **Portal:** bridge para Playgama/Y8/Lagged/itch.io; clean para CrazyGames
   Basic/Kongregate. **Nunca** enviar o bridge ao CrazyGames.
5. **Simulação:** 120 Hz; colisão circular/AABB com swept collision.
6. **Save:** v3; `unlockedPhase` 0..18; v1/v2 migram; a run ativa não é salva.
7. **Mundos:** mundo é conteúdo (`worlds.ts`), não campo de save.
8. **Velocidade:** overlap entre mundos; teto de autoria por mundo; hard cap de
   1.100 para boosts em jogo.
9. **Física:** reflexões preservam o módulo; belt preserva o módulo; gust
   normaliza; rail pode subir até o hard cap.
10. **Pierce:** hit direto da bola com `dano − HP atual ≥ 1` atravessa; igual ou
    menor quica. Ferramentas, chefe e elementos não perfuram; `phased` blindado
    bloqueia.
11. **Plated:** dano de ferramenta −1 (mínimo 1); dano direto de bola é cheio.
12. **Phased:** armado ignora dano; exposto recebe dano normal.
13. **Relay:** enquanto houver relay vivo, gates/movers/rotors/presses funcionam;
    ao destruir o último, os elementos desligam na onda.
14. **Tutorial:** `tutorialFirstLevelXp = 3`; paddle 2×; ímã do último bloco
    com giro adaptativo de 3,5→20 rad/s; 2 coach marks.
15. **Cores da bola:** dano-base 1–5+ → branco/amarelo/laranja/vermelho/roxo.
16. **Mapas:** um mapa por mundo; tutorial e ∞ só no Mundo I.
17. **Debug:** `?debug=1` desbloqueia tudo e permite escolher onda; nunca
    divulgar a URL com debug.
18. **Economia:** sem ads/loot box/compra de vantagem; +30 no primeiro clear de
    mundo; teto de 250 por run.
19. **Bridge:** Playgama Bridge **2.4.4**, runtime local
    (`./playgama-bridge.js`), sem request ao CDN da Playgama. A
    auto-certificação da Playgama é obrigatória por atualização.
20. **Clean:** sem SDK, sem ads, browser storage com fallback para memória;
    pausa por `visibilitychange`/`blur`/`focus`; `game_ready` é no-op.
21. **Nome:** jogo e loja **Bricklike**; slug técnico `blockbreaker`.
22. **Store:** o preview editado não substitui o vídeo contínuo do Y8; os
    assets antigos de `store/covers`, `store/screenshots` e `store/video` são
    da 0.6.1 e precisam de regeneração/revisão.

---

## 5. Gates de referência (2026-11-27)

```bash
npm run typecheck
npm test
npm run validate:content
node scripts/validate-bridge-config.mjs
npm run build
npm run test:e2e
npm run package
```

| Gate | Resultado |
|---|---|
| `npm run typecheck` | ✅ |
| `npm test` | ✅ 440 testes / 37 arquivos |
| `npm run validate:content` | ✅ 19 fases / 71 ondas / 2.781 blocos / 9.392 XP |
| Bridge config | ✅ schema 2.4.4, sem URLs externas |
| `npm run build` | ✅ `dist/` + `dist-clean/` |
| `npm run test:e2e` | ✅ 46 testes (bridge + mobile + clean) |
| `npm run package` | ✅ bridge 20 arquivos; clean 17 arquivos |

Pacote 0.8.0:

| Item | Bridge | Clean |
|---|---|---|
| ZIP | `release/blockbreaker-web.zip` | `release/blockbreaker-web-clean.zip` |
| Arquivos | 20 | 17 |
| Tamanho | 1.545.986 bytes (~1.510 KiB) | 1.431.534 bytes (~1.398 KiB) |
| SHA-256 | `ee17abbaf000a9872dd157ddbd51c6e2abc1f960d0ece9199608fbbcfe781b2f` | `918759c7809178aa511907cc6a611b6e666843dd583a723ee3893cac62450287` |

> O hash muda a cada rebuild por causa dos timestamps; confirme sempre nos
> manifestos. Nenhuma tag/release foi criada.

---

## 6. Como testar

1. **Bridge (Playgama/Y8/Lagged/itch):**
   ```bash
   npm run build:bridge
   npm run preview
   ```
   Abra `http://localhost:4173/?debug=1`; confirme Bridge 2.4.4, storage
   `bridge`, ads e `game_ready` no painel de debug.
2. **Clean (CrazyGames/Kongregate):**
   ```bash
   npm run build:clean
   npm run preview:clean -- --port 4174
   ```
   Abra `http://localhost:4174/?debug=1`; confirme `clean · fallback`,
   storage `localStorage`, ads `— / —`, sem aviso de storage, sem requests a
   `playgama-bridge.js`/`sdk.crazygames.com`. Teste:
   - settings/save persistem após reload;
   - `?resetSave=1` limpa;
   - pausa ao trocar de aba/janela;
   - nenhum botão de anúncio/revive por anúncio.
3. **CrazyGames Basic:** envie **somente**
   `release/blockbreaker-web-clean.zip`; Mobile orientation **PORTRAIT**;
   Basic Launch; sem SDK/ads. Reenvio da 0.8.0 clean é o próximo passo.
4. **Y8.com:** use o conjunto `store/y8/` (6 standard, 6 widescreen, 3
   landscape promo, 3 portrait promo, 3 game cards) e o vídeo contínuo
   `store/y8/video/bricklike-gameplay-y8-1280x720.mp4`. O preview editado **não**
   serve. Upload do ZIP **bridge**.
5. **Playgama:** envie o **bridge** `release/blockbreaker-web.zip` e rode a
   auto-certificação; confirme Bridge 2.4.4.
6. **itch.io:** bridge, Mobile Friendly; confirmar os assets 0.8.0 antes de
   trocar os da 0.6.1.
7. **Lagged/Kongregate:** confirmar os requisitos de store antes de montar os
   assets; Kongregate usa o clean.

---

## 7. Riscos e pendências desta linha

| Área | Estado | Ação |
|---|---|---|
| Playgama | `0.8.0` publicada no catálogo, fora do sandbox | manter o bridge e repetir a auto-certificação em cada atualização |
| CrazyGames | `0.8.0` clean enviada e recusada, sem motivo específico | pedir o requisito exato ao suporte; não reenviar a mesma build |
| Y8 | `0.8.0` enviada; aguardando resposta | não reenviar enquanto estiver em análise; confirmar o shell portrait no vídeo contínuo |
| Lagged | requisitos de store não documentados | confirmar no painel antes de gerar assets |
| Kongregate | clean; requisitos não documentados | confirmar conta/aprovação, screenshots e vídeo |
| Store antiga | capas/screenshots/previews 0.6.1 | regenerar/revisar para 0.8.0 antes de reutilizar |
| Clean em iframe | localStorage funciona no preview | testar no QA do portal; se bloquear, o fallback de memória mostra o aviso |
| Ads no clean | desligados por design | não prometer revive por anúncio no CrazyGames/Kongregate |
| Publicação | `0.8.0` no itch.io/Playgama; Y8 em análise; CrazyGames recusada | manter as páginas e a metadata em sincronia com a 0.8.0 |
| Tag/release | nenhuma | só após aprovação explícita |

---

## 8. Próximos passos imediatos

1. Atualizar a metadata de itch.io/Playgama com a nova descrição e controles
   desta sessão; o Y8 e a CrazyGames usam a mesma copy.
2. Pedir ao suporte da **CrazyGames** o requisito exato que falhou na `0.8.0`
   clean e registrar a resposta antes de qualquer novo envio.
3. Aguardar a resposta do **Y8** e, se aprovado, publicar a `0.8.0`.
4. Confirmar os requisitos de store de **Lagged** e **Kongregate** e montar os
   assets específicos.
5. Regenerar capas, screenshots 390×844 e previews para 0.8.0 antes de atualizar
   as páginas que ainda usam assets da 0.6.1.
6. Só depois de tudo verde: avaliar tag/release com aprovação explícita.

O backlog profundo de densidade, progressão, público, pierce e perks está em
[`design/overhaul-direcoes.md`](design/overhaul-direcoes.md) e
[`design/perks-rework-v0.7.md`](design/perks-rework-v0.7.md). Nada disso começa
sem decisão explícita do dono.

---

## 9. Não fazer sem aprovação explícita

- Alterar schema de save, `PlatformService`, catálogo de perks ou economia.
- Publicar em portal, criar tag ou release.
- Mudar de modelo de progressão (implica save v4).
- Regerar ou substituir assets de loja sem revisão humana.
- Enviar o ZIP **bridge** ao CrazyGames ou o **clean** à Playgama/Y8/Lagged/itch.
