# G7 review — pacote de publicação

**Versão:** `0.1.0-mvp` (tag planejada `v0.1.0-mvp`, ainda não criada).  
**Status:** pronto para revisão humana. **G7 NÃO está aprovado.**  
Este documento inventaria o que foi preparado, o que precisa de revisão e o que
ainda depende do usuário ou do agente principal.

## Inventário de assets

### Capas — `store/covers/`

| Arquivo | Dimensão | Formato | Observação |
|---|---|---|---|
| `cover-landscape-1920x1080.png` | 1920×1080 | PNG 8-bit | 16:9, CrazyGames/itch |
| `cover-portrait-800x1200.png` | 800×1200 | PNG 8-bit | 2:3 |
| `cover-square-800x800.png` | 800×800 | PNG 8-bit | 1:1 |
| `cover-contact-sheet.png` | 1608×674 | PNG 8-bit | revisão interna das três |
| `cover-*.svg` | vetor | SVG | fontes editáveis, Silkscreen embutida |
| `generate-covers.mjs` | script | Node | regenera SVGs e PNGs |

As três capas usam a mesma paleta, os mesmos blocos de cristal, paddle, bola,
glow e a fonte Silkscreen. O único texto é **BRICKLIKE**. Não há bordas, logos
de loja ou screenshots.

### Screenshots — `store/screenshots/`

| Arquivo | Estado capturado |
|---|---|
| `01-menu-390x844.png` | menu inicial limpo |
| `02-gameplay-early-390x844.png` | gameplay inicial, HUD e formação intacta |
| `03-gameplay-laser-multiball-390x844.png` | Prism Laser ativo e três bolas |
| `04-levelup-three-cards-390x844.png` | level-up com três cards |
| `05-results-victory-390x844.png` | tela de vitória/results |

Capturados do build de produção (`vite build` + `vite preview`) em 390×844,
sem painel de debug, sem DevTools e sem texto de debug. Para chegar aos estados
determinísticos, os scripts usam os controles de debug do próprio build, mas
removem `data-debug` e escondem o painel antes de cada captura. Veja
`store/screenshots/capture-screenshots.mjs`.

### Vídeo — `store/video/`

| Arquivo | Spec |
|---|---|
| `bricklike-preview.mp4` | 1280×720, 30,6 s, H.264, ~1,6 MB, sem áudio |
| `capture-preview.mjs` | grava gameplay real e compõe o MP4 com ffmpeg |

O vídeo é montado em quatro trechos reais do build — menu, gameplay, level-up e
results da mesma run — centralizados sobre a arte de capa desfocada. O painel de
debug fica oculto. O áudio não é capturado pelo Playwright; o MP4 é silencioso.

### Metadata — `docs/release/portal-metadata.md`

Título, descrição curta, descrição longa em inglês (≥ 100 palavras), controles,
tags, gênero e textos específicos para itch.io, GameFlare, Playgama e
CrazyGames Basic.

### Checklist — `docs/release/submission-checklist.md`

Checklist por portal, com requisitos, campos, assets, passos manuais e status
“pendente de revisão humana”. Deixa explícito que o usuário faz a submissão.

## O que o usuário deve revisar

1. **Capas:** aprovar composição, legibilidade do título, consistência entre
   16:9, 2:3 e 1:1 e ausência de texto/logos indevidos.
2. **Screenshots:** confirmar que representam o jogo e que não há UI de debug.
3. **Vídeo:** assistir aos 30,6 s, confirmar que o gameplay é legível no player do
   portal e que a ausência de áudio é aceitável.
4. **Descrição:** validar o inglês e remover qualquer promessa que não exista no
   build.
5. **Controles:** confirmar os atalhos de teclado e o texto de toque.
6. **ZIP:** baixar o artefato final do pipeline, abrir em aba anônima e jogar.
7. **Sequência:** confirmar itch.io → GameFlare → Playgama → CrazyGames Basic e
   quem faz cada upload.
8. **Regras atuais:** revalidar os requisitos de cada portal na data da
   submissão.

## Pendências

- Revisão humana das capas e do vídeo. O refino final de arte é humano,
  conforme §5.7 do plano.
- Aprovação dos textos em inglês.
- Tag e GitHub Release ficam **retidos até o G7**; o agente principal executa a
  tag somente após a aprovação.
- Teste do vídeo e dos assets nos players reais dos portais.
- Revalidação das regras de CrazyGames Basic, Playgama, itch.io e GameFlare.
- O vídeo é silencioso; se o portal exigir áudio, regravar com captura de áudio.
- Screenshots e vídeo usam estados forçados por debug (oculto) para garantir
  cenas determinísticas; isso deve ser considerado na revisão editorial.

## Recomendação

**Recomendar review G7, sem declarar aprovação.** O pacote está completo e
tecnicamente consistente, mas capas, vídeo, descrição e controles exigem
aprovação humana antes de qualquer submissão. O G7 só deve ser considerado
aprovado depois que o usuário revisar os assets, validar o ZIP e confirmar a
sequência de publicação.
