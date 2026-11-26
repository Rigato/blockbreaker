# Banners — Vibe Toplist (728×90)

Cinco opções de banner horizontal no formato exigido pelo
[vibetoplist.com](https://vibetoplist.com): **728×90 px**, PNG, sRGB, opaco.
Feitos com a arte, a fonte e a paleta do próprio jogo — sem screenshot puro e
sem texto pequeno dependente de leitura em tamanho real.

O banner é um draft para revisão humana. A submissão e a escolha da opção
continuam manuais.

## Arquivos

| Arquivo | Conceito | Gancho | CTA |
|---|---|---|---|
| `bricklike-vibetoplist-01-neon-hero-728x90.png` | Hero de marca: logo grande + parede de blocos sendo rompida | `ROGUELITE BRICK-BREAKER` | `PLAY FREE` (ciano) |
| `bricklike-vibetoplist-02-one-more-run-728x90.png` | Loop viciante: combo, laser e multiball | `ONE MORE RUN.` / `EVERY RUN IS DIFFERENT` | `PLAY FREE` (dourado) |
| `bricklike-vibetoplist-03-choose-your-power-728x90.png` | Escolha de perks: duas cartas + `LEVEL UP` | `CHOOSE YOUR POWER.` / `22 PERKS · ENDLESS COMBOS` | `PLAY FREE` (ciano) |
| `bricklike-vibetoplist-04-break-the-frost-728x90.png` | Chefão: Frost Sentinel com barra de vida | `BREAK THE FROST` / `9 BOSSES · 3 WORLDS` | `PLAY FREE` (dourado) |
| `bricklike-vibetoplist-05-browser-instant-728x90.png` | Browser real com o jogo + “sem download” | `NO DOWNLOAD. JUST PLAY.` / `FREE / BROWSER / MOBILE` | `PLAY FREE` (ciano) |

`preview-all-five.png` é uma folha de contato para revisão (2×), não para
upload.

## Especificação

- **Dimensão:** 728×90 px exatos, 1× (sem downscale).
- **Formato:** PNG 8-bit sRGB, fundo opaco.
- **Margem segura:** conteúdo crítico dentro de ~22 px das laterais; a CTA fica
  sempre em `x=596..706`.
- **Tipografia:** Silkscreen (títulos, CTA) e Noto Sans (microcopy). O texto
  principal fica entre 8 e 44 px; detalhes de HUD e das cartas são menores por
  design.
- **Paleta:** teal/ciano `#7ef9ff`–`#38cfe8`, violeta `#7a4cc0`, magenta
  `#ff2fd0`, dourado `#ffe59a`, fundo `#02060d`–`#061923`, tirados das capas e
  do HUD atuais.
- **Copy:** em inglês; sem promessa que o jogo não cumpra.

## Números usados

Do GDD v0.7.2 / estado atual da `main`:

- 3 mundos, 18 fases de campanha (19 com o tutorial).
- 9 chefes.
- 22 perks.
- Grátis, browser e mobile-friendly; sem download.

## Sugestão de uso

- **01** como padrão de marca no leaderboard.
- **02** em contexto de social/energia, ou rotacionado com o 01.
- **03** em atualização de perks/builds.
- **04** em atualização de chefes/mundos.
- **05** em placements de browser/mobile e para público que ainda não conhece
  o jogo.

## Regenerar

```bash
node store/vibetoplist/source/render.mjs
```

O script usa Playwright/Chromium (dependência de desenvolvimento do projeto),
renderiza cada HTML em 728×90 e sobrescreve os cinco PNGs. As fontes
Silkscreen estão em `source/fonts/`; o screenshot usado no banner 05 vem de
`public/how-to-play/specials.png`.

Os HTML/CSS em `source/` são editáveis. Se mudar texto, mantenha o palco em
728×90, rode o script e confira as dimensões com `identify`.

## Origem visual

- Fonte Silkscreen: `src/assets/fonts/`.
- Paleta, blocos, paddle, bola e brilho: `store/covers/` e HUD do build.
- Recorte de gameplay do banner 05: `public/how-to-play/specials.png`.
- Nenhum asset externo, stock ou logo de portal foi usado.
