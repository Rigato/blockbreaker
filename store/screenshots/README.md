# Store screenshots — Bricklike

Capturas reais do build de produção, em 390×844 (portrait móvel).

| Arquivo | Cena |
|---|---|
| `01-menu-390x844.png` | menu inicial (Campaign / Endless / Settings) |
| `02-gameplay-early-390x844.png` | gameplay inicial com HUD e hint de lançamento |
| `03-gameplay-laser-multiball-390x844.png` | Prism Laser + Multiball |
| `04-levelup-three-cards-390x844.png` | level-up com três cards |
| `05-results-victory-390x844.png` | vitória / results |
| `06-special-blocks-390x844.png` | fase 6 com blocos especiais |
| `07-boss-frost-sentinel-390x844.png` | chefe Frost Sentinel |
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
level-up e vitória usam os comandos determinísticos de debug do próprio build.

As imagens 06–08 também são usadas pelo diálogo **How to Play** em
`public/how-to-play/`. Não há DevTools, moldura de navegador ou screenshot
fabricado. Se o build mudar, rode o script novamente para manter as imagens
fiéis.
