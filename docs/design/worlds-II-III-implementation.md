# Mundos II e III — especificação implementada (v0.7.0-dev)

**Status:** implementado na `main` local; não publicado, sem tag e sem release.
**Data:** 2026-11-16
**Base:** v0.6.1 → v0.7.0-dev
**Escopo:** arquitetura multi-mundo, save v3, dois mundos novos, física nova,
chefes, mapas de seleção, debug de ondas e testes.

---

## 1. Decisões fechadas

| Tema | Decisão |
|---|---|
| Mundos | Dois mundos novos em sequência: **II · Neon Lattice** e **III · Rustwake** |
| Fases | 6 fases por mundo, 18 fases de campanha + tutorial |
| Ondas | Mundo II: 22 (3/3/3/4/4/5); Mundo III: 27 (4/4/4/5/5/5) |
| Chefes | 3 por mundo, 9 no total |
| Save | v3; `unlockedPhase` 0..18; mundo é conteúdo, não campo de save |
| Endless | Continua abrindo no clear da fase 6 (Mundo I) e nunca é revogado |
| Velocidade | Overlap entre mundos; teto por mundo 780 / 900 / 920; hard cap 1.100 para rails |
| Física | Kit físico aprovado: belt, rail e gust, com contratos explícitos |
| Debug | `?debug=1` desbloqueia todas as fases e mostra seletor de onda no sheet |
| Economia | +30 Sparks no primeiro clear de um mundo; Tier 5/6 ficam para o rework de perks |
| Nomes | `Neon Lattice` e `Rustwake` aprovados |

---

## 2. Conteúdo

### 2.1 Totais validados

```text
19 fases (tutorial + 18)
71 ondas
2.781 blocos
9.392 XP
```

O validador confirma 8 colunas, no máximo 12 linhas, 1–16 level ups por fase
(1 no tutorial, 2–16 na campanha), curva intra-mundo monotônica e nenhum grid
na zona do paddle.

### 2.2 Mundo II — Neon Lattice

| Fase | Ondas | Velocidades | Novidade | Chefe |
|---|---:|---|---|---|
| Splashdown Docks | 3 | 640 / 668 / 696 | alloy, bastion, rail teaser | — |
| Signal Yard | 3 | 704 / 724 / 744 | entangled | Nullframe Warden (`spread`) |
| Maglev Spine | 3 | 752 / 768 / 784 | rail, moving | — |
| Relay Grid | 4 | 800 / 816 / 832 / 848 | relay | Maglev Dreadnought (`charger`) |
| Hardlight Weave | 4 | 808 / 824 / 840 / 856 | phased | — |
| The Lattice Core | 5 | 864 / 872 / 880 / 888 / 896 | duel sem blocos | Lattice Hierophant (`aimed`) |

O Mundo II abre mais lento que o fim do Mundo I (640 < 780) e termina em 896.
Esse overlap é intencional: o pico de dificuldade é retomado por HP e mecânica,
não por velocidade imediata.

### 2.3 Mundo III — Rustwake

| Fase | Ondas | Velocidades | Novidade | Chefe |
|---|---:|---|---|---|
| Slag Yard | 4 | 700 / 720 / 740 / 760 | plated, press | — |
| Rustline Depot | 4 | 770 / 785 / 800 / 815 | belt, rail | — |
| Ash Foundry | 4 | 790 / 805 / 820 / 835 | fused, gust | — |
| Boilerworks | 5 | 810 / 825 / 840 / 850 / 860 | splitting, noMultiball | Boiler Matron (`matron`) |
| Crown Stack | 5 | 830 / 845 / 860 / 875 / 890 | press + belt + gust | The Riveter (`riveter`) |
| Sunder Core | 5 | 850 / 870 / 890 / 905 / 920 | combinação total | The Last Engine (`engine`) |

O Mundo III abre em 700, abaixo do fim do Mundo II (896), e fecha em 920.

### 2.4 Blocos novos

| Char | Tipo | HP | Comportamento |
|---|---|---:|---|
| `a` | `alloy` | 4 | passivo, casco de liga |
| `b` | `bastion` | 5 | passivo, casco pesado |
| `n` | `entangled` | 3 | par espelha 1 de dano, sem recursão |
| `y` | `relay` | 2 | mantém gates/movers/rotors/presses ligados |
| `p` | `phased` | 3 | alterna armado (imune) e exposto |
| `t` | `plated` | 4 | dano de ferramenta −1, mínimo 1 |
| `f` | `fused` | 3 | grupo propaga 1 de dano, sem recursão |
| `s` | `splitting` | 2 | gera até 2 cristais, uma geração |

### 2.5 Elementos novos

| Tipo | Comportamento |
|---|---|
| `press` | AABB vertical com ciclo e telegrafo; sólido ao descer |
| `belt` | gira o vetor da bola preservando o módulo |
| `rail` | acelera a bola na direção do trilho até o hard cap de 1.100 |

### 2.6 Regras novas

- `noMultiball`: teto de uma bola na onda.
- `gust`: aceleração lateral em ciclo, normalizada para preservar a velocidade.

### 2.7 Chefes

| Mundo | Fase | Chefe | Padrão | HP |
|---|---|---:|---|---:|
| II | 2 | Nullframe Warden | `spread` | 150 |
| II | 4 | Maglev Dreadnought | `charger` | 190 |
| II | 6 | Lattice Hierophant | `aimed` | 240 |
| III | 4 | Boiler Matron | `matron` | 140 |
| III | 5 | The Riveter | `riveter` | 175 |
| III | 6 | The Last Engine | `engine` | 210 |

Padrões novos reutilizam a entidade de chefe existente. `spread` usa leque
lateral, `charger` acelera a investida, `aimed` calcula a posição do paddle e
`engine` dispara quatro shards. Nenhum exige múltiplas hitboxes independentes.

---

## 3. Save e progressão

- `SaveV3` (`version: 3`), com `unlockedPhase` 0..18.
- Índices: tutorial 0; Mundo I 1..6; Mundo II 7..12; Mundo III 13..18.
- `parseSave` aceita v1, v2 e v3; v2→v3 só muda a versão.
- `campaignComplete` continua significando **Mundo I concluído** e libera o
  Endless. O clear dos Mundos II/III é derivado de `phases` por `phaseId`.
- `applyPhaseResult` abre a fase seguinte; o clear da fase 6 abre o Mundo II e o
  clear da fase 12 abre o Mundo III.
- O primeiro clear da fase final de cada mundo paga **+30 Sparks**.
- Fases são identificadas por `phaseId`; tema, rank e nó do mapa usam o índice
  local da fase, não o índice global.

---

## 4. Mapas de seleção

- Um mapa por mundo; o header tem três pílulas `I / II / III`.
- `WORLD1_MAP`, `WORLD2_MAP` e `WORLD3_MAP` compartilham a interface `MapDef`.
- ViewBox 390×900, quatro camadas com fatores 0.6 / 0.8 / 1.0 / 1.15 e camada
  fixa de grão/vinheta.
- Tutorial e nó ∞ existem apenas no Mundo I.
- Mundos II/III têm portal de chegada decorativo e seis nós.
- Em ≤430 px as pílulas mostram apenas os numerais; o nome do mundo ativo fica
  no sheet e no `aria-label`.
- O sheet mostra o seletor de onda em `?debug=1`.

### 4.1 Coordenadas

Mundo II: `(70,800) (284,726) (126,634) (272,526) (118,408) (224,282)`.

Mundo III: `(66,806) (298,708) (118,596) (300,480) (112,346) (262,168)`.

---

## 5. Debug

- `main.ts` passa `options.debug` ao `BlockBreakerGame`.
- Em debug, `getPhaseSelectInfo()` marca todas as fases e mundos como
  desbloqueados.
- O sheet do mapa exibe `Start wave` com um `<select>` de ondas.
- `startPhase(phaseId, startWaveIndex)` carrega a onda escolhida.
- `debugStartWave` passa a delegar para o mesmo caminho.
- O painel de debug continua com Add XP, Force perk, Add Sparks, tuning e ações
  de vitória/derrota.

---

## 6. Testes e gates

| Gate | Resultado |
|---|---|
| `npm run typecheck` | verde |
| `npm test` | 428 testes / 35 arquivos |
| `npm run validate:content` | 19 fases, 71 ondas, 2.781 blocos, 9.392 XP |
| `node scripts/validate-bridge-config.mjs` | verde |
| `npm run build` | verde |
| `npm run test:e2e` | 43 testes / 12 spec files |
| `npm run package` | não executado localmente; CI gerou artifact web ZIP, sem publicação |

Cobertura nova principal:

- `tests/worldMechanics.test.ts` — blocos e elementos novos, bosses.
- `tests/worlds.test.ts` — mundos, índices, save v3 e desbloqueio.
- `tests/e2e/phaseSelect.spec.ts` — pílulas I/II/III, mundos selados e seletor
  de onda em debug.

---

## 7. Fora desta entrega

- Publicação, tag, release e assets de loja.
- Tier 5/6 e consumíveis; ficam para o rework de perks/economia.
- Mundo IV, localização, landscape jogável e editor de fases.
- Save em nuvem, leaderboards e conquistas.
