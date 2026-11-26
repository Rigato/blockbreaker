# Y8.com store assets — Bricklike 0.8.0

Conjunto gerado do build de produção **0.8.0** para o upload no Y8.com.
Todas as capturas são reais, sem painel/contadores de debug; o vídeo é um
clipe contínuo de gameplay, sem cortes.

## Requisitos Y8

| Categoria | Dimensão | Limite | Pasta |
|---|---|---|---|
| Standard Screenshot | 760×570 | até 6, JPG/PNG, ≤2 MB | `standard/` |
| Widescreen Screenshot | 1280×720 | até 6, JPG/PNG, ≤5 MB | `widescreen/` |
| Landscape Promo | 1920×1080 | até 3, JPG/PNG, ≤5 MB | `landscape-promo/` |
| Portrait Promo | 1080×1920 | até 3, JPG/PNG, ≤5 MB | `portrait-promo/` |
| Game Card Promo | 760×570 | até 3, JPG/PNG, ≤2 MB | `game-card/` |
| Gameplay Video | 16:9, ≥1280×720 | ≥15 s, MP4/MOV, ≤50 MB, sem cortes | `video/` |

## Conteúdo

### Standard — 6 × 760×570

1. `01-menu` — menu com campanha em progresso e card do Workshop.
2. `02-phase-select` — mapa da campanha com a ficha de fase aberta.
3. `03-gameplay` — fase 1, bola lançada, campo e paddle.
4. `04-laser-multiball` — Prism Laser + Multiball.
5. `05-boss` — Frost Sentinel danificado, fase 2.
6. `06-levelup` — três cards de level-up.

### Widescreen — 6 × 1280×720

As mesmas seis cenas, no enquadramento 16:9 com a arte lateral procedural do
desktop. Reutilize o mesmo conjunto de cenas para manter consistência.

### Landscape Promo — 3 × 1920×1080

1. `01-key-art` — capa/key art existente.
2. `02-gameplay` — still real da fase 1.
3. `03-boss` — still real do Frost Sentinel.

### Portrait Promo — 3 × 1080×1920

1. `01-key-art` — capa portrait existente.
2. `02-gameplay` — gameplay full-bleed.
3. `03-boss` — Frost Sentinel full-bleed.

### Game Card Promo — 3 × 760×570

Cards promocionais com still real + título BRICKLIKE: gameplay, laser/multiball
e boss. São **promos**, não substituem os Standard Screenshots.

### Gameplay Video

`video/bricklike-gameplay-y8-1280x720.mp4`

- 1280×720, 16:9, 29,97 s, H.264/yuv420p, 30 fps, ~1,25 MB.
- Captura contínua de gameplay; sem cortes, sem menu, sem capa final.
- Silencioso (o Playwright não captura áudio do jogo).
- **Não** use `store/video/bricklike-preview.mp4`: ele é um preview editado com
  cortes e fecho de capa, e o Y8 rejeita trailers.

## Como regenerar

```bash
npm run build
npx vite preview --port 4180 --strictPort

node store/y8/capture-y8.mjs                 # tudo
node store/y8/capture-y8.mjs --only=stills   # standard + widescreen
node store/y8/capture-y8.mjs --only=promos   # landscape + portrait
node store/y8/capture-y8.mjs --only=cards    # game cards
node store/y8/capture-y8.mjs --only=video    # vídeo contínuo
```

O script usa um save v3 de campanha avançada (Workshop com 42 Sparks e
13/22), esconde o painel de debug e remove `data-debug` antes de cada captura.
O vídeo grava ~32 s e é cortado para 30 s no início do gameplay com `ffmpeg`;
não há cortes internos.

## Reuso em outras plataformas

- **1920×1080 key art/stills** — candidatos a capa 16:9 do CrazyGames/itch.io.
- **1080×1920 key art/stills** — candidatos à capa/screenshots do Playgama.
- **760×570 e 1280×720 stills** — reutilizáveis em Lagged/Kongregate **se** o
  portal aceitar essas dimensões; confirmar no painel.
- **Vídeo contínuo** — específico do Y8; o CrazyGames usa os previews editados
  de `store/video/`.
- O Y8 não pede ZIP; o upload do jogo continua separado.

## Conferência rápida

```bash
find store/y8 -type f -iname '*.png' -print0 | xargs -0 identify -format '%f %wx%h %b\n'
ffprobe -v error -show_entries format=duration,size:stream=width,height \
  -of default=noprint_wrappers=1 store/y8/video/bricklike-gameplay-y8-1280x720.mp4
```
