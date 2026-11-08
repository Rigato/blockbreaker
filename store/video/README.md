# Preview video — Bricklike

## Resultado

- `bricklike-preview.mp4`
- 1280×720, **30,6 s**, H.264, ~1,6 MB
- Gameplay portrait real (390×844) centralizado sobre a arte de capa desfocada
- Sem UI de debug, sem DevTools
- **Sem áudio** — o Playwright não captura áudio

O vídeo é montado em quatro trechos reais do build:

1. menu/título;
2. run ativa com movimento do paddle, Prism Laser, projéteis e multiball;
3. level-up com três cards;
4. vitória/results da mesma run do trecho 2 (score/tempo coerentes).

## Como regravar

```bash
npm run build
npx vite preview --port 4180 --strictPort
node store/video/capture-preview.mjs --url=http://localhost:4180
```

O script:

1. abre o build de produção em 390×844;
2. esconde o painel de debug e remove `data-debug` (HUD normal visível);
3. grava quatro clipes via Playwright: menu, gameplay assistido, level-up e
   results da mesma run;
4. compõe cada clipe em 1280×720 com `ffmpeg` (backdrop desfocado + card
   portrait com borda);
5. concatena os trechos e aplica fade in/out.

Requisitos: `ffmpeg` no PATH e Chromium do Playwright instalado.

## Limitações

- O vídeo é silencioso. Para uma versão com áudio, é necessário capturar a
  saída de áudio do navegador em outra ferramenta e mixar com o MP4.
- A run é assistida pelos controles de debug ocultos para manter o gameplay
  contínuo e chegar aos estados desejados. O resultado visual é gameplay real do
  build, não uma animação.
- O backdrop usa a capa landscape como base; se a capa for refinada, regrave o
  vídeo para manter a consistência.
- Revalidar duração e formato nas regras do portal na data da submissão.
