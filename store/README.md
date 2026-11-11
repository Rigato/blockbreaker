# Store assets — Bricklike v0.5.0

Assets de loja regenerados a partir do build de produção `0.5.0`. Todos são
drafts para revisão humana; a submissão nos portais continua manual.

## Capas — `store/covers/`

| Arquivo | Dimensão | Uso |
|---|---|---|
| `cover-landscape-1920x1080.png` | 1920×1080 | capa 16:9 / CrazyGames / itch.io |
| `cover-portrait-800x1200.png` | 800×1200 | capa 2:3 / CrazyGames |
| `cover-portrait-1080x1920.png` | 1080×1920 | capa portrait / Playgama |
| `cover-square-800x800.png` | 800×800 | capa 1:1 |
| `cover-contact-sheet.png` | 1608×674 | revisão interna |
| `cover-*.svg` | vetor | fonte editável |

Regras atendidas: mesma linguagem visual nas quatro proporções, título
**BRICKLIKE** como único texto, sem bordas, sem logos de loja e sem screenshot
puro. A arte usa os tiles quadrados, o paddle, as bolas com trail e a paleta
teal/violeta do build atual. Veja `covers/README.md`.

## Screenshots — `store/screenshots/`

Oito capturas reais do build de produção em 390×844:

| Arquivo | Cena |
|---|---|
| `01-menu-390x844.png` | menu inicial com o tutorial como passo atual e os 7 nós da campanha |
| `02-gameplay-early-390x844.png` | tutorial jogável com coach mark e bola em jogo |
| `03-gameplay-laser-multiball-390x844.png` | Prism Laser + Multiball |
| `04-levelup-three-cards-390x844.png` | level-up com três cards |
| `05-results-victory-390x844.png` | vitória / results |
| `06-special-blocks-390x844.png` | fase 6 com todos os blocos especiais |
| `07-boss-frost-sentinel-390x844.png` | Frost Sentinel em fase 2, com shards |
| `08-endless-wave-1-390x844.png` | modo Endless |

## How to Play — `public/how-to-play/`

Cinco recortes 5:3 em **780×468**, gerados do mesmo build:

`move-launch.png`, `level-up.png`, `specials.png`, `boss.png` e `endless.png`.

## Marca do estúdio — `public/bad-decision-games/`

- `logo.webp` — logomarca transparente otimizada para o diálogo **About Us**.
- `logo.png` — fallback PNG transparente.
- Fontes originais em `docs/bad-decision-games-logo/`.

## Vídeo — `store/video/`

- `bricklike-preview.mp4`: 1920×1080 (16:9), 19,1 s, H.264, silencioso.
- `bricklike-preview-portrait.mp4`: 1080×1620 (2:3), 19,1 s, H.264, silencioso.

Os dois mostram menu, seletor de 7 cards, tutorial, gameplay com laser e
multiball, level-up e Frost Sentinel. Terminam na capa correspondente, com o
logo **BRICKLIKE**. Veja `video/README.md`.

## Uso por portal

- **itch.io:** ZIP HTML5, capa 16:9 ou 2:3, screenshots, descrição e controles.
- **GameFlare:** ZIP/link, capa e screenshots, descrição e categoria.
- **Playgama:** ZIP, capa portrait 1080×1920, screenshots, descrição; Bridge já
  integrado.
- **CrazyGames Basic:** ZIP, três capas, preview video e descrição ≥ 100
  palavras. Não usar Full Launch.

Os textos estão em `docs/release/portal-metadata.md`; o checklist manual está em
`docs/release/submission-checklist.md`.
