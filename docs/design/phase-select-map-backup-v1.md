# Backup — Rework do seletor de fases: mapa-trilha (Direção A)

**Data:** 2026-11-14 · **Status:** mockup refinado aprovado em tela ("melhorou bastante");
variante com parallax em avaliação. **Nada foi implementado no jogo.**

Este arquivo preserva o estado da ideia antes do refino de parallax, para poder
ser restaurado ou reconstruído depois.

## Decisões de design (8, todas respondidas)

1. Mapa **maior que a viewport, com scroll interno** (não tela única).
2. Detalhes da fase em **bottom sheet** ao tocar no nó.
3. **Rank S/A/B** como selo nos nós, derivado de `bestScore` (sem mudar save).
4. Fases bloqueadas com **nome visível esmaecido** (não `???`).
5. Slot do **Mundo II selado** já visível no trilho de mundos.
6. **Endless** = nó ∞ no mapa + card do menu mantido.
7. **Sem list view** (a11y) por enquanto.
8. **Spec em `docs/` antes de implementar.**

## Direção de arte escolhida

Três opções foram produzidas por subagentes:

- **A — Paisagem ilustrada em camadas** ✔ escolhida — pintura vertical contínua
  do Vale; trilha fisicamente terraplenada na paisagem; medalhões encaixados.
- B — Neon arcade / painel de energia (não escolhida).
- C — Prisma facetado / mosaico de gemas (não escolhida).

Exigência explícita do usuário: **polish alto** — "muito mais bonito que o mockup
inicial; bastante esforço e cuidado; adicionar efeitos".

## Especificação do mockup refinado (v1, pré-parallax)

Canvas: viewBox `0 0 390 900`, portrait; header e bottom sheet são HTML/CSS por
cima do SVG, com `backdrop-filter` (orçamento: 2 filtros).

### Zonas (faixas Y do SVG)

| Zona | Y | Gradiente (topo → base) |
|---|---|---|
| Void Threshold | 40–240 | `#12072E` → `#2A1047` |
| Emberforge | 240–390 | `#4A1708` → `#3A1408` |
| Frostbound Spire | 390–520 | `#0B2B4A` → `#0A2540` |
| Arcane Depths | 520–650 | `#1C0D33` → `#1E1038` |
| Ruined Halls | 650–720 | `#2A1A0E` → `#33200F` |
| Crystal Grove + tutorial | 720–900 | `#0A2530` → `#06222C` |

Base do mapa `#070B16`. Elipses de glow radial por zona (violeta/laranja/ciano/
roxo/âmbar/verde-água, opacidade .16–.38).

### Nós (centro, raio visual)

| Fase | Coord | Forma/estado |
|---|---|---|
| Tutorial | (55, 782) | medalhão quadrado, concluído, check (sem rank) |
| P1 Crystal Grove | (135, 745) | medalhão, concluído, rank **B** |
| P2 Ruined Halls | (290, 680) | medalhão, concluído, rank **A** |
| P3 Arcane Depths | (160, 580) | **ATUAL** — halo pulsante + selo `NOW` |
| P4 Frostbound Spire | (88, 460) | hexágono de chefe, bloqueado (cadeado) |
| P5 Emberforge | (285, 310) | hexágono de chefe, bloqueado |
| P6 Void Threshold | (170, 150) | hexágono de chefe, bloqueado; node sela o portal |
| Endless | (330, 100) | anel tracejado violeta `∞`, ramo tracejado após P6 |

Ranks: S `#FFD479`, A `#B6F7FF`, B `#9AA7B5`. Rim de chefe `#FF7A5C`.
Accents: crystal `#7EF9FF`, ruins `#FFD27A`, arcane `#FF5FD2`, frost `#D6F7FF`,
forge `#FFD08A`, void `#E5B8FF`.

### Trilha

- Sombra escavada (stroke `#04070D` α.5, 42px) → casing `#22303C` 26px → leito
  `#0B141C` 18px.
- **Concluída** (T→P1→P2→P3): gradiente `#E8A94B → #FFC96B → #FFE9B8`, 16px,
  glow `#FFC96B` 26px e **fluxo animado** (`stroke-dasharray 12 30`, loop).
- **Bloqueada** (P3→P6): `#2A3A48` tracejado `7 11`, 16px.
- **Ramo Endless:** `#2A3A48` tracejado `4 9`, 12px.

### Efeitos (polish v1)

Raios de luz diagonais (2), névoas por zona com deriva lenta (6), grão de filme
(`feTurbulence`, overlay .05), estrelas cintilando no void (14), brasas subindo
na forge (7), flocos de neve no frost (8), faíscas/twinkles por zona, portal do
Void com horizonte + anel giratório tracejado + arco superior, relevo temático
(cristais, colunas+arco, agulha de gelo, chaminés com veios de lava), placas de
rótulo com fundo `rgba(6,10,20,.78)` e contraste AA.

### Motion e performance

- Animações: `twinkle`, `halo` (nó atual), `flow` (trilha), `fog` (deriva),
  `ember` (sobe), `snowf` (cai), `spin` (anéis), `beamA` (raios).
- Tudo desligado em `prefers-reduced-motion: reduce`.
- Blur/filtros com orçamento; ideia de modo `data-lowfx` (reduz grão, névoas,
  partículas) para iframes fracos.

### Header / Sheet (HTML)

- Header: back + kicker `CAMPAIGN` + pílula `I · CRYSTAL VALE` (cristal) +
  pílula `II` tracejada (selada) + `3 / 7` com 7 segmentos (3 dourados, atual
  ciano pulsante).
- Sheet: hairline com accent da zona, handle, `ARCANE DEPTHS`, tagline, chips
  (`Density`, `Waves 3`, `Best 12,340`, `Best time 01:48`, `3 tries · not
  cleared`) e CTA **PLAY** preenchido com glow.

### Esforço estimado (v1)

**5–6 dias** (arte/estrutura 3–4, nós/sheet 1, motion+perf 1).

## Ideia em avaliação (refino solicitado)

**Parallax de rolagem com 2–3 níveis de profundidade** — elementos distantes,
médios e próximos em velocidades diferentes durante o scroll interno do mapa.
Este backup é o estado anterior a esse refino.

## Nota sobre o markup

O HTML completo do mockup refinado (v1) está no histórico da sessão
`ses_e25707825ffejMAXHZE0Y72MEE` de 2026-11-14; esta especificação basta para
reconstruí-lo.
