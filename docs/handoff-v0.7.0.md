# Handoff — Bricklike v0.7.0-dev

**Fonte de onboarding para a próxima sessão.**
**Data:** 2026-11-16
**Branch:** `main` (alterações locais)
**Versão do package:** `0.7.0`
**Build:** local; **não publicada**, sem tag/release
**Base publicada:** `0.6.1` no itch.io e no sandbox da Playgama
**Repositório:** <https://github.com/Rigato/blockbreaker>
**Pasta local:** `/mnt/SSD-Secundario/Nextcloud/5-GameProjects/4-Blockbreaker-roguelite`

> Este documento substitui o `handoff-v0.6.1.md` como fonte atual. O handoff
> anterior fica como histórico. O GDD v1.9 e
> [`design/worlds-II-III-implementation.md`](design/worlds-II-III-implementation.md)
> são as fontes de design desta linha.

---

## 1. Snapshot

| Item | Valor |
|---|---|
| Branch | `main` |
| Versão local | `0.7.0` |
| Versão publicada | `0.6.1` (itch.io + Playgama sandbox) |
| Mundos | I · Crystal Vale; II · Neon Lattice; III · Rustwake |
| Campanha | 18 fases + tutorial; 69 ondas de campanha / 71 com tutorial |
| Blocos | 17 tipos (9 originais + 8 novos) |
| Elementos | 10 tipos (7 originais + press, belt, rail) |
| Chefes | 9 (3 por mundo) |
| Perks | 22 (inalteradas nesta linha) |
| Save | v3; `unlockedPhase` 0..18 |
| Endless | continua abrindo no clear da fase 6 |
| Publicação | **não publicada**; nenhuma tag/release |

---

## 2. O que mudou

### 2.1 Arquitetura multi-mundo

- `src/content/worlds.ts` define `WORLDS` (w1/w2/w3), índices, nomes, acentos e
  tetos de velocidade.
- `PHASES` agora tem 19 entradas: tutorial + 18 fases. Cada fase tem `worldId`
  e `localIndex`.
- `CAMPAIGN_PHASE_COUNT` = 18; `MAX_PHASE` = 18.
- `PhaseSelectInfo` ganhou `worldId`, `worldName`, `worldNumeral`,
  `worldPhaseIndex`, `worldPhaseCount`, `isWorldFinal`, `worldUnlocked`,
  `worldCleared` e `waveNames`.
- Tema, rank e nó usam o índice local; `index` continua global.

### 2.2 Save v3

- `SaveV3` com `version: 3`; `parseSave` aceita v1, v2 e v3.
- v2→v3 é só bump de versão; v1 continua ganhando `meta` padrão.
- `campaignComplete` continua significando **Mundo I concluído** (fase 6) e
  libera o Endless.
- O clear dos Mundos II/III é derivado de `phases` por `phaseId`.
- `applyPhaseResult` abre a próxima fase; clear da fase 6 → 7; clear da 12 → 13.

### 2.3 Conteúdo

- Mundo II: 6 fases / 22 ondas; blocos `alloy`, `bastion`, `entangled`, `relay`,
  `phased`; elementos `rail`; regras de desafio existentes.
- Mundo III: 6 fases / 27 ondas; blocos `plated`, `fused`, `splitting`;
  elementos `press`, `belt`; regra `gust`; `noMultiball` em ondas selecionadas.
- Chefes: Nullframe Warden, Maglev Dreadnought, Lattice Hierophant, Boiler
  Matron, The Riveter e The Last Engine.
- Totais validados: **19 fases, 71 ondas, 2.785 blocos, 9.409 XP**.

### 2.4 Velocidade e física

- Overlap intencional entre mundos:
  - Mundo I: 616–780.
  - Mundo II: 640–896.
  - Mundo III: 700–920.
- Teto de autoria por mundo em `WORLDS.speedMax`; o validador usa esse teto.
- `GAME_CONFIG.ball.hardMaxSpeed = 1100` limita boosts em jogo (rails).
- `belt` gira o vetor preservando o módulo.
- `rail` acelera na direção do trilho até o hard cap.
- `gust` aplica aceleração lateral normalizada para preservar a velocidade.
- `press` é um AABB vertical com telegrafo; sólido ao descer.

### 2.5 Mapas

- `src/ui/map/types.ts` define `MapDef`.
- `WORLD1_MAP`, `WORLD2_MAP`, `WORLD3_MAP` compartilham viewBox 390×900, quatro
  camadas parallax e paleta própria.
- Header com pílulas I/II/III; em ≤430 px só os numerais.
- Tutorial e nó ∞ apenas no Mundo I.
- Mundos II/III têm portal de chegada decorativo.

### 2.6 Debug

- `main.ts` passa `options.debug` ao jogo.
- `?debug=1` desbloqueia todas as fases e mundos na seleção.
- O sheet do mapa mostra `Start wave` e inicia a fase na onda escolhida.
- `startPhase(phaseId, startWaveIndex)` é o caminho único; `debugStartWave`
  delega para ele.
- O painel de debug fica atrás do mapa para não interceptar as pílulas.

### 2.7 Economia

- Primeiro clear da fase final de cada mundo paga **+30 Sparks**.
- Fórmula por onda/combo/chefe/clear e teto de 250 por run permanecem.
- Tier 5/6 e consumíveis **não** foram implementados; ficam para o rework de
  perks/economia.

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
| Save | `src/progression/Save.ts`, `src/game/contracts.ts` |
| Fluxo | `src/game/Game.ts` |
| Mapas | `src/ui/map/types.ts`, `world1.ts`, `world2.ts`, `world3.ts` |
| Seletor | `src/ui/PhaseSelect.ts`, `src/styles/phase-select.css` |
| Menu/HUD/Results | `src/ui/Menu.ts`, `src/ui/Hud.ts`, `src/ui/Overlay.ts` |
| Debug | `src/ui/DebugPanel.ts`, `src/ui/PhaseSelect.ts` |

---

## 4. Invariantes

1. **Plataforma:** nenhum `if (platform === ...)` no gameplay; tudo via
   `PlatformService`.
2. **Storage:** nenhum `localStorage` direto; sempre via `StorageService`.
3. **Simulação:** 120 Hz; colisão circular/AABB com swept collision.
4. **Save:** v3; `unlockedPhase` 0..18; v1/v2 migram; a run ativa não é salva.
5. **Mundos:** mundo é conteúdo (`worlds.ts`), não campo de save.
6. **Velocidade:** overlap entre mundos; teto de autoria por mundo; hard cap de
   1.100 para boosts em jogo.
7. **Física:** reflexões preservam o módulo; belt preserva o módulo; gust
   normaliza para preservar a velocidade; rail pode subir até o hard cap.
8. **Plated:** dano de ferramenta −1 (mínimo 1); dano direto de bola é cheio.
9. **Phased:** armado ignora dano; exposto recebe dano normal.
10. **Relay:** enquanto houver relay vivo, gates/movers/rotors/presses funcionam;
    ao destruir o último, os elementos desligam na onda.
11. **Mapas:** um mapa por mundo; tutorial e ∞ só no Mundo I.
12. **Debug:** `?debug=1` desbloqueia tudo e permite escolher onda; nunca
    divulgar a URL com debug.
13. **Economia:** sem ads/loot box/compra de vantagem; +30 no primeiro clear de
    mundo; teto de 250 por run.
14. **Nome:** jogo e loja **Bricklike**; slug técnico `blockbreaker`.

---

## 5. Gates de referência (2026-11-16)

```bash
npm run typecheck
npm test
npm run validate:content
node scripts/validate-bridge-config.mjs
npm run build
npm run test:e2e
```

| Gate | Resultado |
|---|---|
| `npm run typecheck` | ✅ |
| `npm test` | ✅ 419 testes / 34 arquivos |
| `npm run validate:content` | ✅ 19 fases / 71 ondas / 2.785 blocos / 9.409 XP |
| Bridge config | ✅ schema 2.4.1, sem URLs externas |
| `npm run build` | ✅ bundle Vite |
| `npm run test:e2e` | ✅ 43 testes / 12 spec files |
| `npm run package` | não executado localmente; CI gerou artifact web ZIP, sem publicação |

> O `package` local não foi rodado porque esta linha não foi publicada. O CI
> empacota o build e sobe o artifact, mas não publica em portal. Nenhuma
> tag/release foi criada.

---

## 6. Como testar

1. Abra `?debug=1&resetSave=1`.
2. No menu, abra **Campaign**. As pílulas I/II/III devem estar todas ativas.
3. Troque para o Mundo II e III; confira 6 nós em cada mapa.
4. Selecione uma fase e escolha a onda inicial no seletor `Start wave`.
5. Teste:
   - `rail` no Mundo II: a bola deve acelerar além da velocidade da onda.
   - `belt` no Mundo III: a direção muda, a velocidade não.
   - `gust`: a bola curva, a velocidade não.
   - `press`: a prensa desce e volta, sólida.
   - `phased`: a bola ricocheteia sem dano enquanto o anel estiver ativo.
   - `plated`: laser/torreta/explosão causam 1 a menos; bola causa dano cheio.
   - `relay`: destruir o último relay desliga os elementos.
6. Chegue ao chefe de cada mundo e confira padrão/nome/HP.
7. Em save não-debug, confirme que II/III ficam selados até os clears 6/12.
8. Confira que o save existente v2 abre com `version: 3` e mantém progresso.

---

## 7. Riscos e pendências

| Área | Estado | Ação |
|---|---|---|
| Playtest humano | não feito | testar 69 ondas de campanha, 9 chefes, belt/rail/gust e platinas |
| Balance W2/W3 | validado por conteúdo | calibrar HP, XP e duração com playtest |
| Velocidade 896/920 | implementada | testar legibilidade em 320 px e hardware baixo |
| Hard cap 1.100 | implementado | validar rails em ondas densas e com multiball |
| Save v3 | testes verdes | testar save real v1/v2 no navegador |
| Mapas W2/W3 | E2E verde | validar arte/parallax em iframe de portal |
| Perks | 22 atuais | rework de perks é fluxo separado; não implementado aqui |
| Tier 5/6 e consumíveis | fora desta linha | dependem do rework de economia |
| Publicação | não feita | só após teste humano e aprovação explícita |
| Tag/release | nenhuma | só após aprovação explícita |
| Assets de loja | não regenerados para 0.7.0 | atualizar antes de publicar |

---

## 8. Próximos passos

1. Playtest manual da v0.7.0-dev: Mundo II inteiro, depois Mundo III.
2. Medir tempo de run, Sparks por mundo, TTK dos 6 chefes e legibilidade a 320 px.
3. Validar belt/rail/gust em multiball e com `timeLimit`.
4. Testar migração real de save v1/v2→v3 e o debug de ondas.
5. Rodar `npm run package` apenas quando houver decisão de release.
6. Atualizar assets de loja e screenshots antes de qualquer publicação.
7. Integrar o rework de perks (fluxo separado) e, depois, Tier 5/6/consumíveis.
