# Store screenshots — Bricklike v0.5.0

Capturas reais do build de produção, em 390×844 (portrait móvel).

| Arquivo | Cena |
|---|---|
| `01-menu-390x844.png` | menu inicial com o tutorial como passo atual e 7 nós de campanha |
| `02-gameplay-early-390x844.png` | tutorial jogável com coach mark “Break & level up” |
| `03-gameplay-laser-multiball-390x844.png` | Prism Laser + Multiball |
| `04-levelup-three-cards-390x844.png` | level-up com três cards |
| `05-results-victory-390x844.png` | vitória / results |
| `06-special-blocks-390x844.png` | fase 6 com todos os blocos especiais |
| `07-boss-frost-sentinel-390x844.png` | Frost Sentinel em fase 2, com shards |
| `08-endless-wave-1-390x844.png` | modo Endless |

## Como foram capturadas

```bash
npm run build
npx vite preview --port 4180 --strictPort
node store/screenshots/capture-screenshots.mjs --url=http://localhost:4180
```

O script usa o build de produção e o Chromium do Playwright. O painel de debug é
ocultado e o atributo `data-debug` é removido antes de cada captura, portanto
nenhum controle, contador ou texto de debug aparece nas imagens. Estados como
tutorial, level-up, blocos especiais, chefe e Endless usam os comandos
determinísticos de debug do próprio build; o beam do laser é mantido por alguns
segundos apenas para o still, sem alterar o gameplay.

As imagens do diálogo **How to Play** usam as mesmas cenas (tutorial, level-up,
fase 6, Frost Sentinel e Endless), mas são recortes 5:3 próprios em
`public/how-to-play/`. Não há DevTools, moldura de navegador ou screenshot
fabricado. Se o build mudar, rode os scripts novamente para manter as imagens
fiéis.

## How to Play (5:3)

```bash
node store/screenshots/capture-how-to-play.mjs --url=http://localhost:4180
```

Gera os cinco PNGs em `public/how-to-play/` com 780×468 (crop real 390×234 em
deviceScaleFactor 2): `move-launch.png`, `level-up.png`, `specials.png`,
`boss.png` e `endless.png`.
