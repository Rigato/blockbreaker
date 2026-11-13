# Store screenshots — Bricklike v0.6.1

Nove capturas reais do build de produção, em 390×844 (portrait móvel).

| Arquivo | Cena |
|---|---|
| `01-menu-390x844.png` | menu com a campanha em progresso e o card do Workshop (42 Sparks, 13/22, barra) |
| `02-gameplay-early-390x844.png` | gameplay inicial da fase 1 (phase 1 early gameplay), com HUD, blocos, bola e paddle |
| `03-gameplay-laser-multiball-390x844.png` | Prism Laser + Multiball |
| `04-levelup-three-cards-390x844.png` | level-up com três cards |
| `05-results-victory-390x844.png` | vitória / results |
| `06-special-blocks-390x844.png` | fase 6 com todos os blocos especiais |
| `07-boss-frost-sentinel-390x844.png` | Frost Sentinel em fase 2, com shards |
| `08-endless-wave-1-390x844.png` | modo Endless |
| `09-workshop-tier4-390x844.png` | Workshop com o título do Tier 4 no topo: Overkill, Shield Bash e Conductor |

## Como foram capturadas

```bash
npm run build
npx vite preview --port 4180 --strictPort
node store/screenshots/capture-screenshots.mjs --url=http://localhost:4180
```

O script usa o build de produção e o Chromium do Playwright. O painel de debug é
ocultado e o atributo `data-debug` é removido antes de cada captura, portanto
nenhum controle, contador ou texto de debug aparece nas imagens. O menu e as
cenas de progresso usam um save v2 com campanha avançada e
`meta: { sparks: 42, unlocks: ['second_chance', 'explosive_core', 'sticky_paddle'] }`,
para o card do Workshop mostrar saldo, contagem `13 / 22`, `9 left` e a barra de
progresso. A segunda captura usa o mesmo save v2 para começar a fase 1 direto,
sem coach mark de tutorial.

Estados como fase 1 inicial, level-up, blocos especiais, chefe e Endless usam os
comandos determinísticos de debug do próprio build; o beam do laser é mantido
por alguns segundos apenas para o still, sem alterar o gameplay. A nona captura
abre o Workshop pelo card do menu e rola `.workshop__list` até deixar o título
do Tier 4 no topo da área visível, com Overkill, Shield Bash e Conductor
inteiros. Como o Tier 4 é o último conteúdo da lista, o script adiciona um
espaçador temporário no fim dela para permitir esse alinhamento; os cards e o
cabeçalho fixo do Workshop não são alterados.

As imagens do diálogo **How to Play** usam recortes 5:3 próprios em
`public/how-to-play/` (move & launch, level-up, fase 6, Frost Sentinel e
Endless), gerados do mesmo build `0.6.1`. Não há DevTools, moldura
de navegador ou screenshot fabricado. Se o build mudar, rode os scripts
novamente para manter as imagens fiéis.

## How to Play (5:3)

```bash
node store/screenshots/capture-how-to-play.mjs --url=http://localhost:4180
```

Gera os cinco PNGs em `public/how-to-play/` com 780×468 (crop real 390×234 em
deviceScaleFactor 2): `move-launch.png`, `level-up.png`, `specials.png`,
`boss.png` e `endless.png`.
