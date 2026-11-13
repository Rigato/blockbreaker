# Store covers — Bricklike v0.6.1

Arte de capa original gerada para o build `0.6.1`, pendente de revisão humana.

## Arquivos finais

| Arquivo | Tamanho | Uso |
|---|---|---|
| `cover-landscape-1920x1080.png` | 1920×1080 (16:9) | capa landscape obrigatória |
| `cover-portrait-800x1200.png` | 800×1200 (2:3) | capa portrait CrazyGames |
| `cover-portrait-1080x1920.png` | 1080×1920 (9:16) | capa portrait Playgama |
| `cover-square-800x800.png` | 800×800 (1:1) | capa quadrada obrigatória |
| `cover-contact-sheet.png` | 1608×674 | revisão interna |

## Regras atendidas

- Mesma linguagem visual nas quatro proporções: paleta teal/violeta, tiles
  quadrados de cristal, blocos especiais, paddle com caps de cristal, bolas com
  trail e glow arcade.
- Título **BRICKLIKE** na fonte Silkscreen; nenhum outro texto de capa.
- Sem bordas, sem logos de loja, sem screenshot puro, sem material de terceiro.
- PNG 8-bit sRGB, sem transparência.
- A composição é key art vetorial; não é uma captura de tela.

## Fontes e regeneração

Os SVG em `cover-*.svg` contêm a fonte Silkscreen embutida em base64 e podem ser
editados no Inkscape ou em qualquer editor vetorial. `generate-covers.mjs`
regenera os SVGs, rasteriza os PNGs com o Chromium do Playwright nas dimensões
exatas e monta o contact sheet:

```bash
node store/covers/generate-covers.mjs
```

O script lê `src/assets/fonts/Silkscreen-Bold.ttf` e não adiciona dependências.
