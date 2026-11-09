# Preview videos — Bricklike

Gerados a partir do build de produção, com gameplay real e sem áudio.

## Arquivos

| Arquivo | Especificação | Uso |
|---|---|---|
| `bricklike-preview.mp4` | 1920×1080 (16:9), 18,3 s, H.264, ~2,0 MB | CrazyGames landscape / portais |
| `bricklike-preview-portrait.mp4` | 1080×1620 (2:3), 18,3 s, H.264, ~3,2 MB | CrazyGames portrait / mobile |

- Abertura com a capa estática correspondente (landscape ou portrait).
- Menu, gameplay com Prism Laser/multiball/combo, level-up com três cards e
  results da mesma run.
- Sem áudio, sem cursor, sem UI de debug e sem barras pretas.
- O gameplay portrait é composto sobre a capa desfocada; o HUD e o paddle não
  são cortados.

## Requisitos CrazyGames atendidos

- Duração 15–20 s (18,3 s).
- Landscape 1080p 16:9 e portrait 1080p 2:3.
- Tamanho máximo de 50 MB.
- Capa estática como primeiro frame.
- Sem transição de logo, texto promocional ou som.

## Como regravar

```bash
npm run build
npx vite preview --port 4180 --strictPort
node store/video/capture-preview.mjs                 # gera os dois
node store/video/capture-preview.mjs --format=portrait
node store/video/capture-preview.mjs --format=landscape
```

O script:

1. abre o build de produção em 390×844;
2. esconde o debug, o cursor e remove `data-debug`;
3. grava menu, gameplay assistido, level-up e results da mesma run;
4. compõe os dois formatos com `ffmpeg` usando a capa correspondente como
   backdrop e o gameplay portrait como card central;
5. abre com a capa estática, concatena os trechos e aplica fade out no final.

Requisitos: `ffmpeg` no PATH e Chromium do Playwright instalado.

## Limitações

- Os vídeos são silenciosos (o Playwright não captura áudio).
- A run é assistida por controles de debug ocultos para chegar aos estados
  desejados; o visual é gameplay real do build.
- Se as capas forem refinadas, regrave os vídeos para manter a consistência.
- Revalide os requisitos do portal na data da submissão.
