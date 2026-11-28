# Handoff — Bricklike v0.8.1

**Fonte de onboarding para a próxima sessão.**
**Data:** 2026-11-28
**Branch:** `main`
**Versão do package:** `0.8.1`
**Build:** `0.8.1` local (patch de ads); `0.8.0` publicado no itch.io e na Playgama
**Base publicada:** `0.8.0` no itch.io e na Playgama (catálogo); Y8 com a `0.8.0` em análise; CrazyGames recusou a `0.8.0` clean
**Repositório:** <https://github.com/Rigato/blockbreaker>
**Pasta local:** `/mnt/SSD-Secundario/Nextcloud/5-GameProjects/4-Blockbreaker-roguelite`

> Este documento substitui o [`handoff-v0.8.0.md`](old/handoffs/handoff-v0.8.0.md).
> O GDD v1.16, o [`design/overhaul-direcoes.md`](design/overhaul-direcoes.md) e a
> [`proposta de perks`](design/perks-rework-v0.7.md) seguem como fontes de
> design. A spec de publicação vigente é a
> [`spec_tecnica_portais_web.md`](spec_tecnica_portais_web.md).

---

## 1. Snapshot

| Item | Valor |
|---|---|
| Branch | `main` |
| Versão local | `0.8.1` |
| Versão publicada | `0.8.0` no itch.io e na Playgama (catálogo, fora do sandbox) |
| Y8 | `0.8.0` enviada; aguardando resposta |
| CrazyGames | `0.8.0` clean enviada e recusada, sem motivo específico |
| Mundos | I · Crystal Vale; II · Neon Lattice; III · Rustwake |
| Campanha | 18 fases + tutorial; 69 ondas de campanha / 71 com tutorial |
| Blocos | 17 tipos |
| Elementos | 10 tipos |
| Chefes | 9 (3 por mundo) |
| Perks | 22 |
| Save | v3; `unlockedPhase` 0..18 |
| Endless | abre no clear da fase 6 |
| SDK bridge | Playgama Bridge **2.4.4**; runtime vendorizado local |
| Builds | `dist/` + `blockbreaker-web.zip` (bridge); `dist-clean/` + `blockbreaker-web-clean.zip` (clean) |
| Publicação | `0.8.1` local, não enviada aos portais; sem tag/release |
| Store Y8 | conjunto `store/y8/` da 0.8.0; jogo enviado, aguardando resposta |

---

## 2. O que mudou na 0.8.1

### 2.1 Causa raiz do rewarded revive quebrado

- O `BridgeAdapter` armava um timeout de **15 s a partir do pedido** do rewarded.
  Um criativo real de 15–30 s (mais o carregamento) fazia a promise resolver
  `failed` **enquanto o anúncio ainda estava aberto**; o listener era removido e
  o `rewarded`/`closed` posterior era ignorado.
- O `Game` recebia `failed`, chamava `finishPhase(false)` e mostrava apenas
  Retry/Menu. O botão Menu então pedia um interstitial porque o caminho de
  results só consultava `lastInterstitialAt`, nunca `lastRewardedAt`.
- Havia ainda o risco de ordem `closed → rewarded`: o adaptador resolvia
  `closed` e removia o listener antes do reward.

### 2.2 Correção aplicada

- **`src/platform/BridgeAdapter.ts`**
  - 15 s para o anúncio **abrir**; depois de `opened`, timeout de segurança de
    **180 s**. Um rewarded de 30 s não vira falha.
  - Janela de **500 ms** após `closed` para aceitar `rewarded` atrasado; o
    adaptador também consulta `advertisement.rewardedState` antes de decidir.
  - Lock `adInFlight`: uma segunda chamada de interstitial/rewarded enquanto
    outra está em andamento retorna `skipped`.
- **`src/ui/AdOverlay.ts`**
  - O safety local subiu de 16 s para **300 s**; o overlay nunca some no meio de
    um anúncio longo (o `Game` continua sendo o dono do ciclo).
- **`src/game/Game.ts`**
  - `lastAdFinishedAt` único: todo anúncio concluído (interstitial ou rewarded)
    inicia um cooldown de **60 s**. Wave, results exit, pause exit e a oferta de
    revive por rewarded consultam o mesmo gate.
  - O cooldown começa no **fim** do anúncio, não no pedido.
  - `handleDefeat` não abre a oferta de rewarded se outro anúncio terminou nos
    últimos 60 s; nesse caso a run vai direto para results. É deliberado: evita
    corrente de ads.
- **`src/platform/CrazyGamesAdapter.ts`**
  - `adStarted` re-arma um timeout de 180 s; lock de anúncio em andamento.
  - O `clean` continua sem ads.
- **Testes**
  - Unitários: anúncio aberto por >15 s, `closed → rewarded`, `closed` sem
    reward, timeout sem evento, lock de concorrência e watchdog do CrazyGames.
  - E2E: Menu após rewarded não toca outro ad; Menu após rewarded falho não
    toca outro ad; results normal ainda toca interstitial.

### 2.3 Política de ads resultante

1. Rewarded só paga no estado `rewarded`; `closed` sem `rewarded` não paga.
2. Nenhum ad começa enquanto outro está aberto.
3. Depois de qualquer ad terminar, nenhum outro começa por 60 s.
4. A oferta de revive pode ser suprimida se outro ad acabou de rodar; o caminho
   sem anúncio continua existindo.
5. O clean não tem ads nem revive por anúncio.

---

## 3. O que a 0.8.0 estabeleceu

- Dois targets: `dist/` (**bridge**, Playgama 2.4.4 local) e `dist-clean/`
  (**clean**, sem Playgama, sem SDK do CrazyGames e sem ads).
- Boot por alias `@boot-target` em `src/boot/platformBoot.ts`.
- Clean com `CleanAdapter` + `BrowserStorage` (fallback para memória) e pausa
  por `visibilitychange`/`blur`/`focus`.
- `npm run package` gera dois ZIPs + manifestos separados.
- Conjunto de store Y8 0.8.0 em `store/y8/`.

---

## 4. Arquitetura tocada nesta linha

| Área | Arquivos |
|---|---|
| Ads / Bridge | `src/platform/BridgeAdapter.ts` |
| Ads / CrazyGames | `src/platform/CrazyGamesAdapter.ts` |
| Gate de ads | `src/game/Game.ts` |
| Overlay de ad | `src/ui/AdOverlay.ts` |
| Testes unitários | `tests/bridgeAdapter.test.ts`, `tests/platform.test.ts`, `tests/crazyGamesAdapter.test.ts` |
| E2E | `tests/e2e/ads.spec.ts`, `tests/e2e/revive.spec.ts` |
| Spec | `docs/spec_tecnica_portais_web.md` §2.1 |
| GDD | `docs/GDD_Bricklike.md` §7/§8/§10 |
| Release | `docs/release/status.md`, `portal-metadata.md`, `submission-checklist.md` |

---

## 5. Invariantes

1. **Plataforma:** nenhum `if (platform === ...)` no gameplay; tudo via
   `PlatformService`.
2. **Storage:** nenhum `localStorage` direto no gameplay; só em
   `src/storage/BrowserStorage.ts`.
3. **Build:** `dist/` é bridge; `dist-clean/` é clean. O clean não pode conter
   Playgama nem SDK/strings do CrazyGames.
4. **Portal:** bridge para Playgama/Y8/Lagged/itch.io; clean para CrazyGames
   Basic/Kongregate. **Nunca** enviar o bridge ao CrazyGames.
5. **Simulação:** 120 Hz.
6. **Save:** v3; `unlockedPhase` 0..18; a run ativa não é salva.
7. **Pierce:** hit direto da bola com `dano − HP atual ≥ 1` atravessa; só bola.
8. **Tutorial:** `tutorialFirstLevelXp = 3`; paddle 2×; ímã do último bloco.
9. **Ads:** a recompensa só existe em `rewarded`; 15 s para abrir, 180 s aberto;
   janela de 500 ms para `closed → rewarded`; cooldown único de 60 s; lock de
   anúncio em andamento; clean sem ads.
10. **Debug:** `?debug=1` desbloqueia tudo; nunca divulgar a URL com debug.

---

## 6. Gates de referência (2026-11-28)

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
| `npm test` | ✅ 447 testes / 37 arquivos |
| `npm run validate:content` | ✅ 19 fases / 71 ondas / 2.781 blocos / 9.392 XP |
| Bridge config | ✅ schema 2.4.4, sem URLs externas |
| `npm run build` | ✅ `dist/` + `dist-clean/` |
| `npm run test:e2e` | ✅ 48 testes (bridge + mobile + clean) |
| `npm run package` | ✅ bridge 20 arquivos; clean 17 arquivos |

Pacote local da 0.8.1:

| Item | Bridge | Clean |
|---|---|---|
| ZIP | `release/blockbreaker-web.zip` | `release/blockbreaker-web-clean.zip` |
| Arquivos | 20 | 17 |
| Tamanho | 1.546.174 bytes (~1.510 KiB) | 1.431.541 bytes (~1.398 KiB) |
| SHA-256 | `0923f8eb0b9b77d1d6fcf6d8ea1888894361f791fe9f3ee346eba27917a07365` | `890e5419142d5f17ca34a1d3b15f293497bf3544f8f6616216a9e38b9fc9b6f7` |

> O hash muda a cada rebuild; confirme nos manifestos.

---

## 7. Como testar os ads

1. **Mock local:**
   ```bash
   npm run build:bridge
   npm run preview
   ```
   Abra `http://localhost:4173/?debug=1&adMock=rewarded` e force uma derrota.
   - Watch: o overlay do anúncio aparece; ao voltar, a run continua com uma bola.
   - Depois do revive, force outra derrota e clique Menu: **nenhum** ad novo.
   - `?adMock=rewarded-fail`: o revive não é concedido; clique Menu e confirme
     que nenhum ad encadeia.
   - `?adMock=show`: uma derrota normal deve mostrar o interstitial ao sair dos
     results (desde que nenhum ad tenha rodado nos últimos 60 s).
2. **Playgama:** subir o bridge `0.8.1` e repetir o teste com um rewarded real;
   confirmar no console a sequência `opened → rewarded → closed` e que o botão
   Watch concede a bola. Se não conceder, capturar a sequência de estados e o
   `advertisement.rewardedState` antes de qualquer mudança.
3. **Clean:** `?debug=1` em 4174; não deve existir botão de revive por anúncio
   nem requests a Playgama/CrazyGames.

---

## 8. Riscos e pendências

| Área | Estado | Ação |
|---|---|---|
| 0.8.1 nos portais | local; não enviada | subir o bridge 0.8.1 no itch.io e na Playgama e validar o rewarded real |
| Playgama | 0.8.0 no catálogo | se o 0.8.1 ainda falhar, capturar estados do portal; o fallback é mapear explicitamente o placement `revive`/`extra_life` no config |
| Y8 | 0.8.0 em análise | aguardar; não reenviar |
| CrazyGames | 0.8.0 clean recusada | pedir o requisito exato ao suporte; não reenviar a mesma build |
| Store antiga | capas/screenshots/previews 0.6.1 | regenerar/revisar para 0.8.1 antes de atualizar páginas |
| Clean em iframe | localStorage funciona no preview | testar no QA do portal; fallback de memória já existe |
| Tag/release | nenhuma | só após aprovação explícita |

---

## 9. Próximos passos imediatos

1. Publicar o bridge `0.8.1` no **itch.io** e na **Playgama**; repetir o teste
   humano do rewarded revive e do Menu pós-rewarded.
2. Acompanhar o **Y8** e responder ao portal se pedirem ajustes.
3. Pedir feedback específico à **CrazyGames** antes de qualquer novo envio.
4. Regenerar os assets de loja antigos para a 0.8.1.
5. Só depois de tudo verde: avaliar tag/release com aprovação explícita.

---

## 10. Não fazer sem aprovação explícita

- Alterar schema de save, `PlatformService`, catálogo de perks ou economia.
- Publicar em portal, criar tag ou release.
- Mudar o modelo de progressão (implica save v4).
- Regerar ou substituir assets de loja sem revisão humana.
- Enviar o ZIP **bridge** ao CrazyGames ou o **clean** à Playgama/Y8/Lagged/itch.

---

## 11. Referências

- [GDD v1.16](GDD_Bricklike.md)
- [Spec de publicação](spec_tecnica_portais_web.md)
- [Status de publicação](release/status.md)
- [Metadata de portal](release/portal-metadata.md)
- [Overhaul — direções](design/overhaul-direcoes.md)
- [Handoff anterior — v0.8.0](old/handoffs/handoff-v0.8.0.md)
