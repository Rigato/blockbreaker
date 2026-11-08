# Preview video — Bricklike

## Resultado

- `bricklike-preview.mp4`
- 1280×720, 42 s, H.264, ~1,8 MB
- Gameplay portrait real (390×844) centralizado sobre a arte de capa desfocada
- Sem UI de debug, sem DevTools
- **Sem áudio** — o Playwright não captura áudio

## Como regravar

```bash
npm run build
npx vite preview --port 4180 --strictPort
node store/video/capture-preview.mjs --url=http://localhost:4180 --seconds=42
```

`--seconds` aceita de 30 a 60. O script:

1. abre o build de produção em 390×844;
2. esconde o painel de debug e remove `data-debug` (HUD normal visível);
3. joga uma run assistida por ~42 s, concedendo Multiball, Prism Laser e Wide
   Paddle, movendo o paddle, disparando laser e escolhendo perks;
4. grava o WebM via Playwright;
5. compõe o MP4 com `ffmpeg` (backdrop desfocado + card portrait com borda).

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
