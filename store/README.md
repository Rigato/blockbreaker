# Store assets — Bricklike

Assets de loja da versão `0.1.0-mvp`. Todos são drafts para revisão humana; a
submissão nos portais é manual.

## Capas — `store/covers/`

| Arquivo | Dimensão | Uso |
|---|---|---|
| `cover-landscape-1920x1080.png` | 1920×1080 | capa 16:9 / CrazyGames / itch.io |
| `cover-portrait-800x1200.png` | 800×1200 | capa 2:3 |
| `cover-square-800x800.png` | 800×800 | capa 1:1 |
| `cover-contact-sheet.png` | 1608×674 | revisão interna |
| `cover-*.svg` | vetor | fonte editável |

Regras: mesmo visual nas três proporções, título **BRICKLIKE** como único texto,
sem bordas, sem logos de loja e sem screenshot puro. Veja `covers/README.md`.

## Screenshots — `store/screenshots/`

Cinco capturas reais do build de produção em 390×844: menu, gameplay inicial,
laser + multiball, level-up e results. Veja `screenshots/README.md`.

## Vídeo — `store/video/`

- `bricklike-preview.mp4`: 1920×1080 (16:9), 18,3 s, H.264, silencioso.
- `bricklike-preview-portrait.mp4`: 1080×1620 (2:3), 18,3 s, H.264, silencioso.

Os dois abrem com a capa estática e mostram menu, gameplay com laser/multiball,
level-up e results da mesma run. Veja `video/README.md`.

## Uso por portal

- **itch.io:** ZIP HTML5, capa 16:9 ou 2:3, screenshots, descrição e controles.
- **GameFlare:** ZIP/link, capa e screenshots, descrição e categoria.
- **Playgama:** ZIP, capa, screenshots, descrição; Bridge já integrado.
- **CrazyGames Basic:** ZIP, três capas, preview video e descrição ≥ 100
  palavras. Não usar Full Launch.

Os textos estão em `docs/release/portal-metadata.md`; o checklist manual está em
`docs/release/submission-checklist.md`.
