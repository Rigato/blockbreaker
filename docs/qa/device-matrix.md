# Matriz de devices e navegadores — M6

Status desta rodada: **emulação Chromium via Playwright**, build local servida por
`vite preview` em `http://127.0.0.1:4173`. Nenhum device físico, Safari real ou
Firefox foi executado pela automação. **G6 foi aprovado em 2026-11-08** após a
validação real conduzida pelo owner; as linhas “pendentes” abaixo se referem
apenas à cobertura automatizada e não ao gate, cuja evidência humana fica com o
owner.

Legenda:

- **Automatizado (Chromium)** — coberto por `tests/e2e/layout.spec.ts` e/ou
  `tests/e2e/smoke.spec.ts`.
- **Pendente (device real)** — exige hardware/navegador real e julgamento humano.

| Dispositivo | Navegador | O que testar | Cobertura nesta rodada | Resultado / pendência |
|---|---|---|---|---|
| iPhone recente | Safari | Safe area, áudio, DPR, rotação, background | Não executado | **Pendente em device real** |
| iPhone antigo/baixa memória | Safari | Memória, FPS, carregamento | Não executado | **Pendente em device real** |
| Android médio | Chrome | Touch, FPS, rotação | Layout 390×844 touch + smoke de boot/controles/ads em Chromium emulado | Layout/controles automatizados; **FPS e device real pendentes** |
| Android low-end | Chrome | FPS, DPR=1, memória | Layout 320×568 em Chromium emulado | Layout automatizado; **FPS/memória em hardware real pendentes** |
| Desktop | Chrome/Edge | Mouse/teclado, resize, 144 Hz | Layout 1280×800 e 1440×900; smoke completo, input, pause, ads, CDN | **Automatizado (Chromium)**; 144 Hz real pendente |
| Chromebook 4 GB | Chrome | FPS, memória, carregamento | Não executado | **Pendente em device real** |
| Desktop | Firefox/Safari | Compatibilidade básica | Não executado | **Pendente**; não inferir suporte |
| Build em subpasta | Chrome | Paths relativos, save, mock | `npm run package` valida caminhos relativos e raiz do ZIP | Empacotamento validado; **abertura manual em subpasta pendente** |
| Mobile landscape | Chrome/Safari | Overlay “Rotate to portrait”, run pausa/retoma | 844×390 touch emulado em Chromium | **Automatizado (Chromium)**; Safari/iOS real pendente |

## O que a automação cobre

- `320×568`, `390×844`, `430×932` e `1440×900`: menu, Level Select, gameplay,
  pause, Level Up e Results sem scroll/corte.
- Mobile landscape 844×390 com `hasTouch`/`isMobile`: overlay de rotação, pausa
  automática e retomada ao voltar para portrait.
- Boot, menu, controles (Space vs. V), pause/resume, som persistido, Level Up,
  vitória/desbloqueio, Next level, reload, AdMock `show`/`fail` e CDN bloqueado.
- Projeto `chromium-mobile` (390×844 touch) repete boot, controles e AdMock.

## Limites explícitos

- Chromium headless usa SwiftShader: FPS medido ali **não** representa GPU real.
- Safe area de notch, áudio em iOS, memória de aba em background e DPR de devices
  físicos não são validados por emulação.
- Safari/Firefox não foram executados. Não registrar “passou” sem teste real.
- Toque multi-dedo, pointercancel e long press não têm teste automatizado nesta
  rodada; entram no playtest/roteiro manual.

## Como reproduzir

```bash
npm ci
npx playwright install --with-deps chromium
npm run build
npm run test:e2e
```

Relatório HTML local: `playwright-report/index.html` (ignorado pelo git).
