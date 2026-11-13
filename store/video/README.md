# Preview videos — Bricklike v0.6.1

Gerados a partir do build de produção `0.6.1` e das capas atuais, com gameplay
real e sem áudio.

## Arquivos

| Arquivo | Especificação | Uso |
|---|---|---|
| `bricklike-preview.mp4` | 1920×1080 (16:9), 19,1 s, H.264, ~2,6 MB | CrazyGames landscape / portais |
| `bricklike-preview-portrait.mp4` | 1080×1620 (2:3), 19,1 s, H.264, ~4,5 MB | CrazyGames portrait / mobile |

## Conteúdo

- Menu atual com a campanha em progresso e o card de progressão do Workshop
  (42 Sparks, 13/22 desbloqueados, 9 left e barra de progresso).
- Seletor de campanha com os sete cards (tutorial + seis fases) e scroll real.
- Tutorial com o coach mark “Move & Launch” e o lançamento da bola.
- Gameplay com multiball, Prism Laser e o HUD atual.
- Level-up com três cards.
- Frost Sentinel com HP reduzido, fase 2 e shards.
- Fecho na capa correspondente, com o logo **BRICKLIKE**.

- Sem áudio, sem cursor, sem UI de debug e sem telas pretas.
- O gameplay portrait é composto sobre a capa desfocada; HUD e paddle não são
  cortados.
- O beam do laser é mantido por ~0,9 s durante o preview para leitura; o efeito
  e o gameplay são os do build.

## Requisitos atendidos

- Duração 15–20 s (19,1 s).
- Landscape 1080p 16:9 e portrait 1080×1620.
- Tamanho máximo de 50 MB.
- H.264, yuv420p, 30 fps, faststart.
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
3. grava menu, seletor, tutorial, gameplay, level-up e boss;
4. compõe os dois formatos com `ffmpeg` usando a capa correspondente como
   backdrop e o gameplay portrait como card central;
5. concatena os trechos e finaliza na capa estática.

Requisitos: `ffmpeg` no PATH e Chromium do Playwright instalado.

## Limitações

- Os vídeos são silenciosos (o Playwright não captura áudio).
- A run é assistida por controles de debug ocultos para chegar aos estados
  desejados; o visual é gameplay real do build.
- Se as capas forem refinadas, regrave os vídeos para manter a consistência.
- Revalide os requisitos do portal na data da submissão.
