# Relatório M6 — QA, performance e balanceamento

Status: **G6 aprovado pelo owner em 2026-11-08**. A validação humana,
real-device e a sessão de performance foram conduzidas pelo owner e confirmadas
no gate. Este documento mantém os resultados automatizados; os dados humanos
detalhados não foram inventados nem agregados aqui.

Data da rodada local: 2026-11-08
Build: `0.1.0-m6.1` (renomeado para Bricklike; sem mudança de gameplay)
Ambiente: Linux, Node 24.20.0, Chromium 158 headless (SwiftShader), build de
produção servida por `vite preview`.

## 1. Checks automatizados

| Check | Comando | Resultado |
|---|---|---|
| Typecheck | `npm run typecheck` | ✅ |
| Unitários | `npm test` | ✅ |
| Conteúdo | `npm run validate:content` | ✅ |
| Build | `npm run build` | ✅ |
| Pacote/ZIP | `npm run package` | ✅ 490.5 KiB, 13 arquivos |
| E2E | `npm run test:e2e` | ✅ 16 testes, ~49 s local; CI verde (run 42506004562) |

O E2E usa os botões debug **Force defeat/Force victory** para resultados determinísticos; eles não existem fora de `?debug=1`. A limpeza real da fase 1 (três ondas) é coberta pelos 10 runs do baseline. O teste cobre: boot/menu, ausência de chamadas a `api.playgama.com`, controles
(Space não lança / V lança), pause/resume, som persistido, Level Up com 3 cards e
escolha por teclado, vitória da fase 1, summary, Next level, fase 2 após reload,
Level Select com fase 2 desbloqueada, AdMock `show`/`fail`, CDN bloqueado com
fallback local e matriz de layout 320×568, 390×844, 430×932, 1440×900, além de
mobile landscape 844×390 com pausa e overlay de rotação.

## 2. Matriz e performance

- Matriz: ver `docs/qa/device-matrix.md`. Somente Chromium emulado foi executado.
- Performance/tamanho: ver `docs/qa/performance.md`. ZIP de 490,5 KiB, 13
  arquivos; stress headless com 8 bolas ficou em ~28–32 fps sob SwiftShader,
  contra ~33–46 fps idle no mesmo ambiente. **Não é métrica de device real.**
- Nenhum Safari, Firefox, iPhone, Android ou Chromebook físicos nesta rodada.

## 3. Baseline automatizado de runs

- Script: `npm run qa:runs -- --runs=10`.
- Dados: `docs/qa/run-log.csv`.
- Resultado desta rodada: **10/10 Victory**, fase 1, 3 ondas, score 1.600, nível 6,
  **5 level ups por run**, duração 49,9–60,1 s (média ~56,6 s), 0 mortes/retries
  no bot. Perks escolhidos variaram entre Power Ball, Safety Net, Prism Laser,
  Foresight, Arcane Turret, Giant Ball, Multiball, Wide Paddle, Quick Study,
  Explosive Core e Sticky Paddle.
- Natureza: bot com projéteis de debug, **não é playtest humano**. A duração
  abaixo de 2 min e a vitória 100% refletem o bot mirando por coluna, não o
  jogador. Serve para detectar regressão de duração, nível e ofertas entre
  builds.
- Metas do §1.2 (2–5 min, 3–5 level ups, variedade de perks, diversão) **não
  podem ser aprovadas** só com este baseline.

## 4. P0/P1 encontrados

Nenhum P0/P1 observado na automação desta rodada (crash, fluxo quebrado, save
perdido, layout cortado). Observações sem severidade de bloqueio:

- Nenhuma.
- Riscos não cobertos pela automação seguem na seção 6.

## 5. Decisão do gate

**G6 aprovado em 2026-11-08.** O owner confirmou a conclusão do playtest
humano, da matriz de devices reais e da sessão de performance, e autorizou o
início do M7. Nenhum tuning de balance foi aplicado depois do G6.

A evidência humana detalhada (CSV/notas, devices, FPS/memória) fica com o owner
e não foi reconstruída neste relatório. Os resultados automatizados acima
continuam válidos como baseline de regressão; eles não substituem o playtest.

## 6. Pendências humanas residuais

- Registrar/arquivar as notas e o CSV do playtest humano, se ainda não estiverem
  no repositório.
- Manter a matriz real e a medição de hardware como evidência do G6.
- Revalidar as regras de portal na data de cada submissão (M7).
