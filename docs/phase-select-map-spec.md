# Spec — Rework do seletor de fases: mapa-trilha (Direção A + parallax)

**Status:** implementada em 2026-11-14; bateria de gates completa verde
(typecheck, 397 unit, validate:content, bridge, build, 41 e2e, package).
**Pré-requisito:** [`design/phase-select-map-backup-v1.md`](design/phase-select-map-backup-v1.md)
(estado pré-parallax) e a decisão de seguir para implementação.
**Escopo:** apenas `src/ui/PhaseSelect.ts` + CSS da tela (+ testes). Nenhum
código de gameplay, save, plataforma ou economia muda.

---

## 1. Resumo

Substituir a lista corrida de cards da seleção de fases por um **mapa vertical
do mundo 1** ("Vale em Camadas"): paisagem ilustrada em SVG, maior que a
viewport, com **scroll interno** e **parallax de 4 camadas**. Os 7 nós
(tutorial + 6 fases) ficam encaixados na paisagem, ligados por uma trilha
terraplenada; detalhes da fase em **bottom sheet** ao tocar num nó.

Decisões do usuário (todas confirmadas):

1. Mapa maior que a viewport, scroll interno.
2. Detalhes em bottom sheet ao tocar no nó.
3. Rank S/A/B como selo nos nós (derivado de `bestScore`, sem mudar save).
4. Fases bloqueadas: nome visível esmaecido.
5. Slot do Mundo II selado visível no trilho de mundos.
6. Endless = nó ∞ no mapa + card do menu mantido.
7. Sem list view (a11y) por enquanto.
8. Arte: Direção A "Paisagem ilustrada em camadas" + **parallax** aprovado.

## 2. Invariantes respeitadas

- UI lê `PhaseSelectInfo[]` e fala via `onStart(phaseId)` / `onBack()` —
  **nenhum campo novo em `PhaseSelectInfo`, nenhum comando novo**.
- Sem mudança de save schema v2, sem `localStorage` direto, sem `if (platform)`.
- Rank derivado de `bestScore` com limiares existentes em
  `src/content/endings.ts` (`victoryRank` ou equivalente exportado) —
  **não persistido**.
- `?debug=1` inalterado. Strings de UI em inglês.
- Alvos de toque ≥ 44 px; contraste AA em todo texto (placa atrás).
- `prefers-reduced-motion`: parallax e todas as animações desligados.
- Orçamento iframe fraco: transforms no compositor, ≤ 2 `backdrop-filter`
  (header + sheet), `feGaussianBlur` só em elementos estáticos pontuais,
  modo `data-lowfx` remove grão/névoas/partículas.

## 3. Layout da tela

```
┌─────────────────────────────────────┐
│ ← CAMPAIGN  [I · CRYSTAL VALE][II]  │ header fixo (HTML, blur 6px)
│                          3 / 7 ▮▮▮▯▯ │ segmentos de progresso
│  ┌ scroller interno ──────────────┐ │
│  │   SVG do mapa (390×900)        │ │ rolagem vertical, sem scroll da página
│  │   nós posicionados em %        │ │
│  └────────────────────────────────┘ │
│  [↓ role o mapa]                    │ hint pill
│  ▔▔ bottom sheet ▔▔ [PLAY]          │ sheet fixo (blur 8px), accent da zona
└─────────────────────────────────────┘
```

- Viewport portrait 320–430 px; iframe 800×450 mantém o shell portrait.
- Scroll abre centralizado no **nó atual** (`findCurrent` existente), clampado.
- Header: back + `CAMPAIGN` + pílula do mundo + slot `II` selado (tracejado,
  popover "Sealed — finish the campaign") + `N / M` + segmentos.
- Bottom sheet ao tocar nó selecionável: nome, tagline, chips de features,
  boss, best score/time, attempts/clears, rank (se houver), CTA **PLAY**.
  Fecha com swipe down, Esc ou back. Nó atual é foco inicial.
- Foco: nó selecionável mais próximo do atual → sheet → back (trap mantido).

## 4. Parallax (aprovado)

4 camadas absolutas, mesma cena dividida por profundidade; o scroll aplica
`transform: translateY(-scrollTop × f)` em cada camada (rAF, passive listener):

| Camada | Fator | Conteúdo |
|---|---:|---|
| Fundo | 0.6× | base, bandas de zona, glows, silhuetas, estrelas, raios, rótulos de zona |
| Médio | 0.8× | relevo temático (cristais, colunas, agulha, chaminés+veios, runas), névoas, partículas (brasas/neve/faíscas/motes) |
| Próximo | 1.0× | terreno, trilha, **todos os nós**, portal do void, spire principal, rótulos de fase |
| Frontal | 1.15× | pólen/po (bokeh suave), transparente |
| Fixo (0×) | — | grão de filme + vinheta (overlay da câmera) |

- Escopo do mapa: viewBox `0 0 390 900`; camada frontal `0 0 390 1060`
  (precisa cobrir a viewport em 1.15× no fim do scroll).
- Nós e rótulos **sempre** na camada 1.0× (nunca desalinizar do nó atual).
- `prefers-reduced-motion` → todos os fatores = 1.0 (rolagem plana).

## 5. Posições dos nós (viewBox 390×900)

| Fase | Coord | Forma/estado |
|---|---|---|
| Tutorial | (55, 782) | medalhão quadrado, concluído, check, sem rank |
| P1 Crystal Grove | (135, 745) | medalhão, rank B |
| P2 Ruined Halls | (290, 680) | medalhão, rank A |
| P3 Arcane Depths | (160, 580) | ATUAL — halo pulsante + selo `NOW` |
| P4 Frostbound Spire | (88, 460) | hexágono chefe, bloqueado |
| P5 Emberforge | (285, 310) | hexágono chefe, bloqueado |
| P6 Void Threshold | (170, 150) | hexágono chefe, bloqueado; senta no portal |
| Endless | (330, 100) | anel tracejado ∞; ramo tracejado após P6 |

Trilha: sombra escavada `#04070D` 42px → casing `#22303C` 26px → leito
`#0B141C` 18px; concluída `#E8A94B→#FFC96B→#FFE9B8` 16px + glow + dash flow
animada; bloqueada `#2A3A48` tracejado `7 11`; ramo ∞ tracejado `4 9`.

## 6. Zonas e paleta

Ver backup v1 para a tabela completa de zonas (faixas Y + gradientes) e
accents por tema. Acentos de estado: bloqueado texto `#93A3B2`; concluído
`#FFD479`; rank S `#FFD479` / A `#B6F7FF` / B `#9AA7B5`; chefe rim `#FF7A5C`;
atual = accent da zona (`#FF5FD2` em Arcane).

## 7. Componentes e arquivos

| Arquivo | Mudança |
|---|---|
| `src/ui/PhaseSelect.ts` | reescrita interna: scroller, camadas, nós, sheet; **API pública idêntica** (`open/refresh/close/dispose/isOpen/selection`) |
| `src/styles/phase-select.css` | novo layout (mapa, camadas, nós, sheet) |
| `src/ui/map/world1.ts` (novo, opcional) | geometria: coords dos nós, caminhos, fatores de parallax |
| `src/content/endings.ts` | exportar limiar de rank (só leitura) |
| `tests/phaseSelect*.test.ts` | adaptar seletores `.phase-card` → nós; novo teste de rank derivado |
| e2e `phase-select` specs | atualizar seletores; gate 320/390/430 + 800×450 |

Endless: nó ∞ lê o mesmo `endlessUnlocked` já passado à tela; clique abre o
mesmo diálogo de bloqueio existente. Card do menu **permanece**.

Mundos futuros: mesma estrutura; novo arquivo de geometria + paleta por mundo.
Não adicionar `worldId` ao save.

## 8. Gates antes de considerar pronto

```bash
npm ci
npm run typecheck
npm test
npm run validate:content
node scripts/validate-bridge-config.mjs
npm run build
npm run test:e2e
npm run package   # só se pedir para publicar
```

Critérios de aceite visuais:

1. Mapa rola sob header/sheet; scroll abre no nó atual.
2. Parallax visível ao rolar; desligado sob reduced motion.
3. 7 nós + slot II + ∞; estados bloqueado/atual/concluído/chefe corretos.
4. Sheet mostra todos os dados do card antigo + rank derivado.
5. Verde em 320×568, 390×844, 430×932, 800×450 (shell portrait).
6. Nenhum teste existente quebrado fora da seleção de fases.

## 9. Fora de escopo (desta vez)

- Salvar rank no save · list view de a11y · remover card do Endless do menu ·
  mundo 2 real · qualquer publicação/tag/release.

## 10. Contrato DOM (binding entre implementação e testes)

Fluxo: **toque num nó → abre/atualiza o sheet → PLAY no sheet inicia a fase.**
Nó bloqueado continua `disabled` (nome visível esmaecido).

Estrutura mínima (classes e atributos são contrato — testes/scripts dependem):

```html
<section class="phase-select" hidden>
  <div class="phase-select__panel" role="dialog" aria-modal="true" aria-labelledby="phase-select-title">
    <header class="phase-select__head">
      <div class="phase-select__top">
        <button class="phase-select__back">…</button>
        <span class="phase-select__kicker">Campaign</span>
        <span class="phase-select__world">I · CRYSTAL VALE</span>
        <button class="phase-select__world-locked" aria-expanded="false">II</button>
        <div class="phase-select__progress">
          <span class="phase-select__progress-label">…</span>
          <div class="phase-select__track"><i class="phase-select__seg is-clear"></i>…</div>
        </div>
      </div>
      <h2 class="phase-select__title" id="phase-select-title">…</h2>
      <div class="phase-select__world-pop" hidden>Sealed — finish the campaign</div>
    </header>
    <div class="phase-select__scroller">          <!-- scroll interno do mapa -->
      <div class="phase-map">
        <div class="phase-map__layer phase-map__layer--far"  data-depth="0.6">…svg…</div>
        <div class="phase-map__layer phase-map__layer--mid"  data-depth="0.8">…svg…</div>
        <div class="phase-map__layer phase-map__layer--near" data-depth="1">
          …svg (bandas de zona, portal, spire, trilha)…
          <button class="phase-node" data-phase-id="tutorial" data-phase-index="0"
                  data-theme="crystal" style="--x:14.1%;--y:86.9%">…</button>
          <!-- + phase-1..phase-6; nó ∞: .phase-node.phase-node--endless,
               SEM data-phase-id e SEM data-phase-index (o e2e conta 7 nos) -->
        </div>
        <div class="phase-map__layer phase-map__layer--front" data-depth="1.15">…svg…</div>
      </div>
    </div>
    <div class="phase-select__fx">…grain + vignette (fixos, 0×)…</div>
    <aside class="phase-sheet">                  <!-- visível quando há seleção -->
      <div class="phase-sheet__handle"></div>
      <div class="phase-sheet__name">…</div>
      <div class="phase-sheet__tagline">…</div>
      <div class="phase-sheet__chips"><span class="phase-sheet__chip">…</span></div>
      <button class="phase-sheet__play">Play</button>
    </aside>
    <p class="phase-select__empty" hidden>…</p>
  </div>
</section>
```

Regras do contrato:

- Estados do nó: `is-locked` (+ `disabled`), `is-current`, `is-clear`,
  `is-boss`, `is-selected`; sigilo `.phase-node__sigil`; selo `.phase-node__rank`
  (letra S/A/B) ou `.phase-node__check` quando concluído sem rank.
- `aria-label` do nó segue o padrão atual:
  `Name · Phase N · Play` / `Name · Phase N · Locked`.
- **Rank derivado:** exportar `victoryRank(phaseIndex, score)` de
  `src/content/endings.ts` e usá-lo nos nós com `clears > 0` +
  `bestScore != null` + `index > 0`. Tutorial: só check, sem rank.
- **Endless:** `PhaseSelectOptions` ganha `onEndless: () => void` e
  `isEndlessUnlocked: () => boolean`; UIRoot passa `handleEndless` (já trata o
  diálogo de bloqueio) e `() => lastSnapshot.endlessUnlocked`. Clique no nó ∞
  → `onEndless()`. A API de ciclo de vida permanece
  `open(info, selected)` / `refresh(info, selected)` / `close/dispose/isOpen/selection`.
- **Slot II selado:** popover inline dentro do painel (fecha em clique fora;
  Esc fecha o popover antes de sair da tela).
- Parallax: no scroll do `.phase-select__scroller`, em rAF,
  `transform = translateY(scrollTop × (1 − depth))` por camada; camada `near`
  não recebe transform. `prefers-reduced-motion` → sem transform (scroll plano).
- Scroll inicial centraliza o nó selecionado/atual (instantâneo, sem smooth).
- Fundo/bandas de zona vivem na camada `near` (alinhadas aos nós); `far` leva
  silhuetas, estrelas, raios e rótulos de zona; `mid` relevo/névoas/partículas;
  `front` bokeh (viewBox mais alto, ex. 390×1060, para cobrir 1.15×).
- Hook `data-lowfx` no document element esconde grão/névoas/partículas.
- Zona de toque do nó ≥ 44 px; header e sheet usam `backdrop-filter` (≤ 2).
- Overlays `.phase-select__fx` e sheet: `pointer-events: none` no fx (só o
  conteúdo interativo do sheet recebe toque) — o e2e clica em nós que podem
  estar sob o overlay; hit-test nunca pode ser bloqueado por camada decorativa.
- `.phase-sheet__play` tem texto exatamente `Play` (`en.play`); ao `open()` o
  sheet já vem visível com a fase atual selecionada (o e2e depende disso).

### 10.1 Arquivo de referência da arte

- `docs/design/phase-select-map-mockup.html` — **mockup aprovado** (fonte da
  arte: SVGs das 4 camadas, paleta, animações). Extrair daqui para o código.
