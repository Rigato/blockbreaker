# Performance e tamanho — M6

> **G6 aprovado em 2026-11-08.** O owner confirmou a sessão de 10 min e a medição
> em hardware real. Este relatório mantém o baseline headless; os números de
> hardware real ficam arquivados com o owner.

## Build e ZIP

Rodada local em 2026-11-08, `npm run build && npm run package`:

| Métrica | Valor |
|---|---|
| ZIP de release | **490.5 KiB** (502.235 bytes) |
| Conteúdo descompactado | 1.859.075 bytes |
| Arquivos no ZIP | 13 |
| Maior caminho | 38 caracteres |
| SHA-256 (exemplo da rodada) | `d270652f6481ea79e92dbecfadf56e9c75dcd0e6bbbcf58d78f0a9a794105d6d` |
| Chunk principal do jogo | `assets/Game-*.js` ≈ 1.29 MB (≈345 kB gzip, informado pelo build) |
| Runtime do Bridge vendorizado | `playgama-bridge.js` 380 KB |
| Fontes | Silkscreen Regular/Bold ≈ 63 KB somadas |
| CSS | 44 KB (8.7 KB gzip) |

O manifest completo fica em `release/manifest.json` (ignorado pelo git). O script
`npm run package` valida raiz do ZIP, caminhos relativos, ausência de URLs
externas não permitidas, contagem de arquivos e tamanho.

## Stress curto (headless)

Método: build de produção em `vite preview`, viewport 390×844, Chromium headless
com SwiftShader. O debug foi usado para chegar a **8 bolas** (limite do jogo) e
disparar projéteis para gerar mortes de blocos/partículas. Amostras de FPS a cada
500 ms por 5 s; memória JS via `performance.memory`/CDP. Também foi medido um
controle **idle** (1 bola parada no paddle) para separar o custo do stress do
limite do ambiente headless.

| Cenário | FPS amostrado (10 amostras de 500 ms) | `performance.memory` | CDP `JSHeapUsedSize` |
|---|---|---|---|
| Idle, 1 bola parada | 46, 41, 41, 38, 38, 35, 35, 33 | ~33,1 MB | — |
| Stress, 8 bolas + projéteis/partículas | 32, 32, 31, 31, 30, 30, 29, 28, 28, 28 | ~31,2 MB | ~17,2 MB |

Observações:

- O ambiente headless já roda abaixo de 60 fps mesmo idle; a queda no stress
  (~32 → 28) é pequena e o heap não cresceu durante a amostra.
- `performance.memory` e `JSHeapUsedSize` medem coisas diferentes e não batem;
  registrar ambos evita tratar o número como absoluto.
- Não houve crash, tela preta ou erro de console durante o stress curto.

### Leitura

- O FPS headless é limitado por SwiftShader e pelo ambiente de CI; **não é**
  evidência de 60 fps em Android médio, iPhone ou Chromebook.
- A memória JS não inclui GPU/WebGL e varia com o browser; serve só como ordem de
  grandeza para detectar vazamentos óbvios entre builds.
- Para o critério do §1.2 é obrigatório medir em devices reais, incluindo 10 min
  de sessão, background, rotação, 8 bolas + partículas e anúncio.

## Como repetir

```bash
npm run build
npm run preview -- --port 4173 --strictPort
# em outro terminal, com a build servida:
# abrir http://127.0.0.1:4173/?debug=1
# Add ball ×8, disparar projéteis, observar FPS no painel Debug
```

Em CI, o smoke E2E roda no mesmo Chromium headless; ele valida fluxo, não FPS.
