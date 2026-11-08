# Store covers — Bricklike

Draft de arte de capa para revisão e refino do agente principal.

## Arquivos finais

| Arquivo | Tamanho | Uso |
|---|---|---|
| `cover-landscape-1920x1080.png` | 1920×1080 (16:9) | capa landscape obrigatória |
| `cover-portrait-800x1200.png` | 800×1200 (2:3) | capa portrait obrigatória |
| `cover-square-800x800.png` | 800×800 (1:1) | capa quadrada obrigatória |
| `cover-contact-sheet.png` | 1608×674 | revisão interna das três |

## Regras atendidas

- Visual consistente entre as três proporções: mesma paleta, blocos de cristal,
  paddle, bola com trail, glow arcade e fundo teal/violeta.
- Título **BRICKLIKE** na fonte Silkscreen; nenhum outro texto.
- Sem bordas, sem logos de loja, sem screenshot puro, sem material de terceiro.
- Elementos originais, inspirados na linguagem visual do jogo.
- PNG 8-bit sRGB, sem transparência.

## Fontes e regeneração

Os SVG em `cover-*.svg` contêm a fonte Silkscreen embutida em base64 e podem ser
editados no Inkscape ou em qualquer editor vetorial. `generate-covers.mjs`
regenera os três SVGs e rasteriza os PNGs com o Chromium do Playwright, nas
dimensões exatas:

```bash
node store/covers/generate-covers.mjs
```

O script lê `src/assets/fonts/Silkscreen-Bold.ttf` e não adiciona dependências.

## Nota para o refino

Este é um draft de alta qualidade, não a arte final aprovada. O agente principal
pode refinar facetas dos blocos, composição, profundidade e glow mantendo a
consistência entre as três capas. Qualquer texto novo além de **BRICKLIKE** deve
ser evitado nas capas de portal.
