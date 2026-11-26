# Spec de assets de store — Bricklike

Documento vivo. Portais cobertos: **Playgama, Y8.com, Lagged, itch.io, CrazyGames, Kongregate**. Y8 é a plataforma nova; Playgama já tem assets publicados. O jogo é **portrait no mobile** e usa **shell portrait no desktop**, então os formatos landscape precisam acomodar o jogo por composição, não por esticamento. Build local atual: **0.8.0**; o conjunto **Y8 em `store/y8/` foi gerado da 0.8.0**. As capas, screenshots e previews antigos de `store/covers/`, `store/screenshots/` e `store/video/` ainda vêm da **0.6.1** e precisam de regeneração/revisão humana antes de outros uploads. Revalidar as regras de cada portal na data do upload.

Legenda da matriz: **D** = reuso direto · **C** = reuso com crop/recorte/recomposição · **E** = asset específico (novo) · **?** = confirmar no portal (dimensão ou necessidade não documentada neste repositório).

## 1. Famílias e dimensões

| Família | Dimensão | Estado hoje | Natureza | Uso documentado |
|---|---|---|---|---|
| Capa / key art | 1920×1080 (16:9) | Existe (`cover-landscape-1920x1080.png`) | key art | CrazyGames, itch.io 16:9, Y8 Landscape Promo |
| Capa / key art | 1080×1920 (9:16) | Existe (`cover-portrait-1080x1920.png`) | key art | Playgama, Y8 Portrait Promo |
| Capa / key art | 800×1200 (2:3) | Existe (`cover-portrait-800x1200.png`) | key art | CrazyGames, itch.io 2:3 |
| Capa / key art | 800×800 (1:1) | Existe (`cover-square-800x800.png`) | key art | CrazyGames |
| Capa / key art | 760×570 (4:3) | Existe em `store/y8/game-card/` | card promocional com still real | Y8 Game Card Promo |
| Screenshot | 390×844 (~9:19.5) | Existem 9 | still real | Playgama / itch.io (tamanho exigido: confirmar); base para recortes |
| Screenshot | 760×570 (4:3) | Existem 6 em `store/y8/standard/` | still real | Y8 Standard Screenshot |
| Screenshot | 1280×720 (16:9) | Existem 6 em `store/y8/widescreen/` | still real | Y8 Widescreen Screenshot |
| Screenshot | 1920×1080 (16:9) | Existem 2 em `store/y8/landscape-promo/` | still real | Y8 Landscape Promo (com a key art) |
| Screenshot | 1080×1920 (9:16) | Existem 2 em `store/y8/portrait-promo/` | still real | Y8 Portrait Promo (com a key art) |
| Vídeo | 1920×1080 (16:9) | Existe (`bricklike-preview.mp4`), **editado** | preview com cortes | CrazyGames |
| Vídeo | 1080×1620 (2:3) | Existe (`bricklike-preview-portrait.mp4`), **editado** | preview com cortes | CrazyGames |
| Vídeo | 1280×720 (16:9) | Existe em `store/y8/video/` | gameplay contínuo | Y8 Gameplay Video |

Atenção às proporções: **760×570 é 4:3**, não 16:9. Redimensionar a capa 1920×1080 para 760×570 distorce; é preciso recompor ou recortar a key art. 800×1200 é 2:3 e 1080×1920 é 9:16 — não são o mesmo formato.

## 2. Matriz de reutilização

| Família / dimensão | Playgama | Y8 | Lagged | itch.io | CrazyGames | Kongregate |
|---|---|---|---|---|---|---|
| Capa 1920×1080 | ? | **D** — Landscape Promo | ? | **D** — capa 16:9 | **D** — capa obrigatória | ? |
| Capa 1080×1920 | **D** — capa portrait | **D** — Portrait Promo | ? | **C** — 9:16 → 2:3 (confirmar) | **C** — portal pede 800×1200 | ? |
| Capa 800×1200 | ? | **C** — fonte opcional p/ 9:16 | ? | **D** — capa 2:3 | **D** — capa obrigatória | ? |
| Capa 800×800 | ? | ? | ? | ? | **D** — capa obrigatória | ? |
| Capa 760×570 | ? | **E** — Game Card Promo | ? | ? | ? | ? |
| Screenshot 390×844 | **D** — 9 imagens (tamanho: confirmar) | **C** — base p/ 760×570 e 1280×720 | ? (exige screenshot: confirmar) | **D** — 9 imagens (tamanho: confirmar) | ? (não documentado como upload) | **D** — exige screenshots (tamanho: confirmar) |
| Screenshot 760×570 | ? | **E** — Standard (≤6) | ? | ? | ? | ? |
| Screenshot 1280×720 | ? | **E** — Widescreen (≤6) | ? | ? | ? | ? |
| Screenshot 1920×1080 | ? | **C** — compõe Landscape Promo | ? | ? | ? (capa 1920×1080 ≠ screenshot) | ? |
| Screenshot 1080×1920 | ? | **C** — compõe Portrait Promo | ? | ? | ? | ? |
| Vídeo preview 1920×1080 | ? | **E** — não serve (trailer com cortes) | ? | ? | **D** — preview video | ? |
| Vídeo preview 1080×1620 | ? | **E** — não serve (2:3 e editado) | ? | ? | **D** — preview portrait | ? |
| Vídeo gameplay contínuo 1280×720 | ? | **E** — obrigatório | ? | ? | ? | ? |

Notas: `?` não autoriza presumir que o portal não exige o asset — confirma no painel do portal. Y8 aceita **JPG ou PNG** nos stills/promos; os demais formatos de arquivo só são "confirmar" quando não há registro neste repositório. O ZIP é **bridge** para Playgama/Y8/Lagged/itch.io e **clean** para CrazyGames/Kongregate (ver `docs/spec_tecnica_portais_web.md` e `docs/build-release.md`).

## 3. Y8.com — requisitos e natureza dos assets

Os limites abaixo são os fornecidos para o Y8 e devem ser usados exatamente.

| Categoria Y8 | Dimensão | Limite | Natureza | Origem / ação |
|---|---|---|---|---|
| Standard Screenshot | 760×570 | até 6, JPG/PNG, máx 2 MB | **still real de gameplay** | novo: captura do build, sem debug |
| Widescreen Screenshot | 1280×720 | até 6, JPG/PNG, máx 5 MB | **still real de gameplay** | novo: captura do build, sem debug |
| Landscape Promo | 1920×1080 | até 3, JPG/PNG, máx 5 MB | promo / key art | 1 key art + 2 stills em `store/y8/landscape-promo/` |
| Portrait Promo | 1080×1920 (9:16) | até 3, JPG/PNG, máx 5 MB | promo / key art | 1 key art + 2 stills em `store/y8/portrait-promo/` |
| Game Card Promo | 760×570 | até 3, JPG/PNG, máx 2 MB | promo com still real | 3 cards em `store/y8/game-card/` |
| Gameplay Video | 16:9, mín 1280×720 | mín 15 s, MP4/MOV, máx 50 MB | **clipe contínuo de gameplay, sem cortes**; trailers/promos não são aceitos | `store/y8/video/bricklike-gameplay-y8-1280x720.mp4` |

- **Stills reais** = HUD, blocos, paddle, bola e UI do jogo visíveis, sem título promocional. **Promos** podem ser key art com **BRICKLIKE** ou still real com tratamento de capa; o conjunto Y8 usa 1 key art + 2 stills em cada formato promo.
- Standard Screenshot e Game Card Promo compartilham **760×570**, mas são categorias distintas: o Standard é still puro; o Game Card é still + título/tratamento promocional. Manter arquivos e nomes separados.
- O enquadramento 16:9 com jogo portrait resulta no shell portrait com arte lateral procedural. **Confirmar no portal** se esse enquadramento é aceito como gameplay contínuo.

### Conjunto Y8 gerado (0.8.0)

| Categoria | Pasta | Arquivos |
|---|---|---|
| Standard Screenshot 760×570 | `store/y8/standard/` | 6 (menu, phase select, gameplay, laser/multiball, boss, level-up) |
| Widescreen Screenshot 1280×720 | `store/y8/widescreen/` | 6 (mesmas cenas) |
| Landscape Promo 1920×1080 | `store/y8/landscape-promo/` | 3 (key art + gameplay + boss) |
| Portrait Promo 1080×1920 | `store/y8/portrait-promo/` | 3 (key art + gameplay + boss) |
| Game Card Promo 760×570 | `store/y8/game-card/` | 3 (gameplay, laser, boss com título) |
| Gameplay Video | `store/y8/video/` | 1 MP4 1280×720, 29,97 s, H.264, ~1,25 MB |

Detalhes e comandos de regeneração: [`store/y8/README.md`](../store/y8/README.md).

### Preview editado × vídeo contínuo exigido

| Preview existente (`store/video/`) | Gameplay Video exigido pelo Y8 |
|---|---|
| Editado: menu → mapa → tutorial → gameplay → level-up → boss → **capa final com logo BRICKLIKE** | Clipe contínuo de gameplay, **sem cortes** |
| Transições entre cenas; beam do laser segurado ~0,9 s para leitura | Sem intervenção, sem cena promocional e sem fecho com capa |
| 1920×1080 e 1080×1620 (2:3) | 16:9, mínimo 1280×720 |
| 19,1 s, H.264, silencioso | Mínimo 15 s, MP4/MOV, máx 50 MB |
| Feito para CrazyGames | Específico do Y8 — **os previews atuais não são aceitos** |

## 4. Playgama

- **Já existe:** capa portrait **1080×1920**; 9 screenshots **390×844**; ZIP **bridge** `release/blockbreaker-web.zip` (Bridge 2.4.4 local + `playgama-bridge-config.json` na raiz); jogo aceito e publicado.
- **Reuso do Y8:** a key art 1080×1920 e os stills 1080×1920 de `store/y8/portrait-promo/` são candidatos à capa/screenshots do Playgama; confirmar no portal as dimensões exigidas de screenshots.
- **Falta / validar:** regenerar capa e screenshots a partir da **0.8.0** (os atuais são da 0.6.1); revisão humana; confirmar se há requisito de vídeo; enviar o ZIP **bridge**, nunca o clean. A `0.8.0` (Bridge 2.4.4) é a linha atual; a `0.7.2` continua como build anterior e a `0.7.1` falhou na auto-certificação por SDK 2.4.1.

## 5. CrazyGames — Basic Launch

- **Três capas obrigatórias:** `1920×1080`, `800×1200`, `800×800` — existem, sem bordas, selos ou screenshot puro. A `1920×1080` pode reutilizar a key art de `store/y8/landscape-promo/01-key-art-1920x1080.png`; as `800×1200` e `800×800` continuam as da 0.6.1 e precisam de regeneração/revisão antes do upload.
- **Preview video:** `bricklike-preview.mp4` (1920×1080) e `bricklike-preview-portrait.mp4` (1080×1620), 15–20 s; são previews editados (não o gameplay contínuo do Y8); revalidar as regras atuais na data do upload.
- **ZIP:** desde a **0.8.0** o arquivo enviado é o **clean** (`release/blockbreaker-web-clean.zip`): sem Playgama Bridge, sem SDK nativo do CrazyGames e sem ads. **Nunca enviar o bridge ao CrazyGames.** Submissão é Basic Launch, não Full Launch.
- Conferir os iframes 907×510, 1216×684, 1280×720 e 1920×1080; o shell portrait é intencional, sem letterbox. Descrição em inglês com ≥100 palavras.

## 6. itch.io / Lagged / Kongregate

| Portal | O que a spec documenta | Ainda confirmar |
|---|---|---|
| **itch.io** | ZIP bridge (`mock`); capa **16:9 ou 2:3**; screenshots; descrição e controles; **Mobile Friendly** ligado. `0.6.1` publicada. | Dimensões exigidas de screenshots; se há vídeo; se 1080×1920 (9:16) é aceito como capa. |
| **Lagged** | ZIP bridge; SDK encapsulado na Bridge; exige **AdSense Publisher ID** no cadastro. | Todos os requisitos de capa, screenshots e vídeo — a spec técnica não os detalha. |
| **Kongregate** | ZIP clean; aprovação prévia de conta dev; proíbe SDKs de ads terceiros e contas próprias; exige **screenshots, instruções, classificação etária voluntária e declaração de uso de IA**. | Dimensões/quantidade de screenshots; capa e vídeo. |

## 7. Regras de produção

- **Cor/formato:** sRGB, 8 bits, sem transparência no arquivo final. Y8 aceita JPG ou PNG; manter PNG como padrão, usar JPG se o PNG estourar o teto de bytes.
- **Sem moldura de navegador**, DevTools, cursor, UI/contadores de debug, logos de loja ou material de terceiro. Capa nunca é screenshot puro. O logo do estúdio fica no diálogo About Us do build, não na key art.
- **Texto apenas em inglês.** Nas capas/key art, o único texto é **BRICKLIKE**, na fonte **Silkscreen Bold** (`src/assets/fonts/Silkscreen-Bold.ttf`, embutida em base64 nas fontes SVG).
- **Arte consistente:** paleta teal/violeta, tiles quadrados de cristal, paddle ciano, bolas com trail. Reutilizar as **mesmas cenas** entre formatos — recortar/recompor a partir da mesma origem, nunca criar uma cena diferente por portal.
- **Nomes:** `<tipo>-<descritor>-<LxA>.<ext>` em kebab-case, caracteres latinos sem acento. Ex.: `cover-landscape-1920x1080.png`, `01-menu-390x844.png`, `bricklike-preview.mp4`. Para Y8: `store/y8/<categoria>/<NN>-<scene>-<LxA>.png` e `store/y8/video/bricklike-gameplay-y8-1280x720.mp4`.
- **Limites de bytes:** respeitar os valores da tabela §3, com folga abaixo do teto; conferir `stat -c %s` e as dimensões reais antes do upload.
- **PNG vs JPG:** PNG para key art e screenshots com HUD/texto (sem perda); JPG apenas nos promos/screenshots do Y8 quando necessário para caber no limite, reexportado em sRGB sem alpha, com conferência de artefatos ao redor do texto Silkscreen.

## 8. QA e regeneração

- [ ] Build **0.8.0**: `npm run build` + `npm run package`; conferir hashes nos manifestos. O conjunto `store/y8/` já é 0.8.0; capas/screenshots/previews antigos são 0.6.1 → regenerar antes de reutilizar nos outros portais.
- [ ] Capas: `node store/covers/generate-covers.mjs` (4 SVGs + 4 PNGs nas dimensões exatas + contact sheet).
- [ ] Screenshots: `npx vite preview --port 4180 --strictPort` + `node store/screenshots/capture-screenshots.mjs --url=http://localhost:4180` (9 stills 390×844).
- [ ] Previews: `node store/video/capture-preview.mjs` (dois vídeos editados, para CrazyGames).
- [ ] Y8: `npx vite preview --port 4180 --strictPort` + `node store/y8/capture-y8.mjs` (ou `--only=stills|promos|cards|video`).
- [ ] **Sem debug:** nenhum asset com `?debug=1`, `?resetSave=1`, painel, cursor, contador ou `data-debug`; a captura oculta o painel antes do still/frame.
- [ ] Conferir por categoria: dimensão exata, proporção, extensão (JPG/PNG/MP4/MOV) e tamanho em bytes.
- [ ] Revisão humana: título BRICKLIKE, inglês, sem logos de loja, HUD legível no shell portrait em 16:9, nenhuma capa com borda ou selo.
- [ ] Revalidar as regras dos portais na data do upload.

## 9. Inventário atual e gap do Y8

| Conjunto | Caminho | O que existe |
|---|---|---|
| Capas | `store/covers/` | 4 PNGs (1920×1080, 800×1200, 1080×1920, 800×800) + 4 SVGs + contact sheet 1608×674 — 0.6.1 |
| Screenshots | `store/screenshots/` | 9 PNGs 390×844; scripts `capture-screenshots.mjs` e `capture-how-to-play.mjs` |
| How to Play | `public/how-to-play/` | 5 PNGs 780×468 |
| Vídeos | `store/video/` | 2 previews editados (1920×1080 e 1080×1620, 19,1 s) + `capture-preview.mjs` |
| Banners Vibe Toplist | `store/vibetoplist/` | 5 PNGs 728×90 + preview — não é asset dos portais desta spec |
| Y8 (0.8.0) | `store/y8/` | 6 standard, 6 widescreen, 3 landscape promo, 3 portrait promo, 3 game cards, 1 vídeo contínuo + `capture-y8.mjs` |
| ZIPs | `release/` | bridge e clean da 0.8.0 |

Há um PNG avulso em `store/covers/` fora do padrão de nomes; não faz parte do conjunto de capas.

| Necessário para Y8 | Situação |
|---|---|
| Standard Screenshot 760×570 (≤6, ≤2 MB) | **Gerado** em `store/y8/standard/` (6) |
| Widescreen Screenshot 1280×720 (≤6, ≤5 MB) | **Gerado** em `store/y8/widescreen/` (6) |
| Landscape Promo 1920×1080 (≤3, ≤5 MB) | **Gerado** em `store/y8/landscape-promo/` (3) |
| Portrait Promo 1080×1920 (≤3, ≤5 MB) | **Gerado** em `store/y8/portrait-promo/` (3) |
| Game Card Promo 760×570 (≤3, ≤2 MB) | **Gerado** em `store/y8/game-card/` (3) |
| Gameplay Video 1280×720 16:9, contínuo, ≥15 s, MP4/MOV, ≤50 MB | **Gerado** em `store/y8/video/` (29,97 s, ~1,25 MB) |
| Pasta `store/y8/` + `capture-y8.mjs` | **Feito** |
