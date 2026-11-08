# Relatório M6 — QA, performance e balanceamento (rascunho)

Status: **rascunho**. Este documento não aprova o gate G6. Playtest humano,
devices reais e medição de FPS em hardware continuam pendentes.

Data da rodada local: 2026-11-08
Build: `0.1.0-m5.2` (branch `agent/s7/m6-qa`)
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
| E2E | `npm run test:e2e` | ✅ 16 testes, ~1.9 min |

E2E cobre: boot/menu, ausência de chamadas a `api.playgama.com`, controles
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

## 5. Recomendação provisória

Tecnicamente, o build passou nos checks automatizados e no smoke E2E, incluindo
save/reload, ads mock e CDN bloqueado. Isso sustenta seguir para o playtest, não
para publicar.

**Não declarar G6 aprovado** antes de:

1. executar o playtest de 5 pessoas × 3 runs (`docs/qa/playtest-kit.md`);
2. validar a matriz em devices reais (principalmente Safari/iOS e Android
   médio/low-end);
3. medir FPS/memória em hardware real por 10 min, incluindo 8 bolas +
   partículas e background/rotação;
4. abrir o ZIP em subpasta e revalidar o checklist §5.5 no portal/mock.

## 6. Pendências humanas

- Playtest e agregação das métricas de diversão/ritmo/variedade.
- iPhone recente e antigo (Safari), Android médio/low-end, Chromebook 4 GB.
- Firefox/Safari desktop (compatibilidade básica).
- Áudio, safe area, DPR e background em devices reais.
- Sessão de 10 min sem crash em hardware real.
- Julgamento de go/no-go pelo owner do projeto.
