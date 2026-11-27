> **Arquivado em 2026-11-27.** Documento histórico; links relativos foram
> preservados como no original e podem não resolver nesta pasta. Handoff atual:
> [`handoff-v0.8.0.md`](../../handoff-v0.8.0.md).

# Handoff — Bricklike v0.7.2

**Fonte de onboarding para a próxima sessão.**
**Data:** 2026-11-26
**Branch:** `main`
**Versão do package:** `0.7.2`
**Build:** local; **não publicada**, sem tag/release — Bridge 2.4.4
**Base publicada:** `0.6.1` no itch.io; jogo **aceito e publicado na Playgama**
**Repositório:** <https://github.com/Rigato/blockbreaker>
**Pasta local:** `/mnt/SSD-Secundario/Nextcloud/5-GameProjects/4-Blockbreaker-roguelite`

> Este documento substitui o `handoff-v0.7.1.md` como fonte então vigente; o
> anterior fica em [`handoff-v0.7.1.md`](handoff-v0.7.1.md). O GDD v1.14, o
> [`design/overhaul-direcoes.md`](../../design/overhaul-direcoes.md) e a
> [`proposta de perks`](../../design/perks-rework-v0.7.md) seguem como fontes
> de design.

---

## 1. Snapshot

| Item | Valor |
|---|---|
| Branch | `main` |
| Versão local | `0.7.2` |
| Versão publicada | `0.6.1` no itch.io; Playgama com o jogo aceito e a `0.7.1` em auto-certificação |
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
| SDK | Playgama Bridge **2.4.4**; runtime vendorizado local |
| Publicação | **não publicada**; nenhuma tag/release |

---

## 2. O que mudou na 0.7.2

### 2.1 Playgama Bridge 2.4.4

- A auto-certificação da Playgama reprovou a `0.7.1`: o jogo inicializava com
  **2.4.1** e a plataforma exige **2.4.4**.
- `@playgama/bridge` foi atualizado para `2.4.4` (dependência exata) e o runtime
  vendorizado `public/playgama-bridge.js` foi substituído pelo bundle novo.
- A superfície usada pelo jogo não teve quebra: `PlaygamaBridge.d.ts`,
  `PlatformModule`, `StorageModule` e anúncios continuam compatíveis. As
  mudanças de tipos são aditivas (`storage.flush`, `playerId`,
  `platform.setLoadingProgress`).
- `scripts/validate-bridge-config.mjs` continua aceitando a linha 2.4.x e
  valida os mesmos campos de config; roda agora contra 2.4.4 e **falha se o
  runtime vendorizado não for idêntico ao instalado**.
- Mocks de `tests/platform.test.ts` e `tests/bridgeAdapter.test.ts` reportam
  `2.4.4`. Um teste unitário exige que `public/playgama-bridge.js` seja
  byte-a-byte o bundle instalado, e o E2E `CDN blocked` verifica
  `window.bridge.version === '2.4.4'` no navegador.
- O ZIP carrega `playgama-bridge.js` 2.4.4 na raiz; o QA da Playgama deve
  inicializar o SDK nessa versão.

### 2.2 Ímã do último bloco — órbita estável

**Sintoma:** nas duas ondas do tutorial, quando restava um bloco, a bola podia
ficar orbitando sem nunca atingi-lo.

**Causa:** a taxa de giro era fixa (3,5 rad/s). A curvatura resultante tem raio
`v / ω`; quando esse raio coincide com a distância ao bloco, a bola descreve uma
órbita estável. Reproduzido em simulação: 17 de 20 combinações de velocidade
(500–900) e raio (120–320) não destruíam o bloco em 20 s.

**Correção:** a taxa de giro cresce de 3,5 até **20 rad/s** conforme a bola se
aproxima, dentro de uma zona de influência de 4× a maior dimensão do bloco. O
giro continua preservando o módulo da velocidade; não há teleporte nem mudança
brusca de direção. Perto do alvo a curva fecha e a órbita decai em acerto.

**Cobertura:**

- `tests/worldMechanics.test.ts` ganhou dois casos de órbita estável
  (500 px/s e 900 px/s) que agora destroem o bloco em menos de 3 s.
- Fuzz local de 500 cenários aleatórios (posição, ângulo e velocidade
  450–1.100): nenhuma órbita restante; todas as bolas vivas destruíram o bloco
  em até 10 s.
- O teste antigo de “girar sem mudar a velocidade” continua passando.

**Escopo:** a regra só existe onde `lastBlockMagnetTurnRate > 0` — hoje, o
tutorial. O teto vive em `GAME_CONFIG.tutorial.lastBlockMagnetMaxTurnRate`,
pronto para virar perk.

### 2.3 Versão

- `package.json`, `package-lock.json` e o rodapé do menu passam a `0.7.2`.
- Nenhuma tag, release ou publicação foi criada.

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
| Plataforma | `src/platform/BridgeAdapter.ts`, `src/platform/bridgeGlobal.ts` |
| Bridge vendorizado | `public/playgama-bridge.js`, `public/playgama-bridge-config.json` |
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
   normaliza; rail pode subir até o hard cap.
8. **Pierce:** hit direto da bola com `dano − HP atual ≥ 1` atravessa; igual ou
   menor quica. Ferramentas, chefe e elementos não perfuram; `phased` blindado
   bloqueia.
9. **Plated:** dano de ferramenta −1 (mínimo 1); dano direto de bola é cheio.
10. **Phased:** armado ignora dano; exposto recebe dano normal.
11. **Relay:** enquanto houver relay vivo, gates/movers/rotors/presses funcionam;
    ao destruir o último, os elementos desligam na onda.
12. **Tutorial:** `tutorialFirstLevelXp = 3`; paddle 2×; ímã do último bloco
    com giro adaptativo de 3,5→20 rad/s; 2 coach marks.
13. **Cores da bola:** dano-base 1–5+ → branco/amarelo/laranja/vermelho/roxo.
14. **Mapas:** um mapa por mundo; tutorial e ∞ só no Mundo I.
15. **Debug:** `?debug=1` desbloqueia tudo e permite escolher onda; nunca
    divulgar a URL com debug.
16. **Economia:** sem ads/loot box/compra de vantagem; +30 no primeiro clear de
    mundo; teto de 250 por run.
17. **Bridge:** Playgama Bridge **2.4.4**, runtime local
    (`./playgama-bridge.js`), sem request ao CDN da Playgama. A
    auto-certificação da Playgama é obrigatória por atualização.
18. **Nome:** jogo e loja **Bricklike**; slug técnico `blockbreaker`.

---

## 5. Gates de referência (2026-11-26)

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
| `npm test` | ✅ 431 testes / 35 arquivos |
| `npm run validate:content` | ✅ 19 fases / 71 ondas / 2.781 blocos / 9.392 XP |
| Bridge config | ✅ schema 2.4.4, sem URLs externas |
| `npm run build` | ✅ bundle Vite |
| `npm run test:e2e` | ✅ 43 testes / 12 spec files |
| `npm run package` | ✅ 20 arquivos; 1.545.956 bytes; SHA-256 `aa5d2af25e690b42d681f8c5938572550626ef8adc7897734970925ba23791d3` |

> O E2E pode reutilizar a porta 4173 ocupada por outro projeto. Para isolar,
> rode o preview em 4174 e use uma config temporária com `baseURL` 4174.
> Nenhuma tag/release foi criada.

---

## 6. Como testar

1. Abra `?debug=1&resetSave=1`.
2. Jogue o tutorial inteiro em 320 px e 390 px:
   - a bola deve atingir o último bloco nas duas ondas em poucos segundos;
   - o anel/tether deve continuar visíveis;
   - o giro não pode parecer um teleporte nem mudar a velocidade;
   - confira paddle 2×, 15 XP e a primeira perk.
3. Suba o ZIP `release/blockbreaker-web.zip` na Playgama e rode a
   auto-certificação:
   - o passo “Build Startup” deve inicializar **Bridge 2.4.4**;
   - não deve haver request ao CDN da Playgama;
   - confira o menu em 320 px e o boot em iframe.
4. Teste belt/rail/gust, phased/plated/relay e pierce em sessões curtas.
5. Em save não-debug, confirme que II/III ficam selados até os clears 6/12.
6. Confira que o save v1/v2 migra para v3 sem perder progresso.

---

## 7. Riscos e pendências desta linha

| Área | Estado | Ação |
|---|---|---|
| Playgama | jogo aceito; `0.7.1` reprovada por SDK | subir a `0.7.2` e repetir a auto-certificação |
| Ímã do tutorial | corrigido e testado em simulação | validar em celular real nas duas ondas |
| Tutorial novo | 2 ondas / 15 XP / 1 perk / paddle 2× / ímã | medir tempo até a primeira perk, skip e leitura em 320 px |
| Pierce | regra base + FX/SFX | testar Power Ball 1–3, Overkill junto, multiball e ondas densas |
| Balance W2/W3 | validado por conteúdo | calibrar HP, XP e duração com playtest |
| Velocidade 896/920 | implementada | testar legibilidade em 320 px e hardware baixo |
| Save v3 | testes verdes | testar save real v1/v2 no navegador |
| Assets de loja | desatualizados | regenerar capas, screenshots e How to Play antes de publicar |
| Publicação | `0.7.2` local | só após teste humano e aprovação explícita |
| Tag/release | nenhuma | só após aprovação explícita |

---

## 8. Próximos passos imediatos

1. Subir a `0.7.2` na Playgama e passar a auto-certificação com o Bridge 2.4.4.
2. Playtest do tutorial no celular: ímã, primeira perk, skip e 320 px.
3. Playtest do pierce e de belt/rail/gust.
4. Medir tempo de run, Sparks por mundo, TTK dos chefes e legibilidade.
5. Decidir a próxima frente estrutural: densidade ou progressão/save v4.
6. Reavaliar o rework de perks/economia em fluxo separado.

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
