# Teste de performance em hardware baixo — Bricklike

**Data:** 2026-11-11  
**Build de referência:** build atual em `dist/` (o `package.json` estava em
`0.5.0` durante esta pesquisa; confirme a versão antes de registrar).  
**Objetivo:** provar (ou descartar) que o jogo roda bem em um Chromebook de
4 GB, em iframes desktop e em mobile, com DPR 1, antes de reenviar a portais.

> **Leitura curta:** o Bricklike é leve (ZIP ~1,5 MB, build ~3,0 MB, heap JS
> ~20–30 MB no baseline). Performance **provavelmente não é a causa** da
> reprovação na CrazyGames, mas a plataforma exige Chromebook 4 GB e iframes
> pequenos; medir é barato e evita chutar. Use este documento para produzir uma
> tabela de evidências, não para “passar” no teste com um número isolado.

---

## 0. O que medir (e o que não medir)

| Medida | Para quê | Instrumento |
|---|---|---|
| **Boot** até o menu interativo | primeira impressão, conversão | console `[boot] menu ready in … ms`, Performance panel, Lighthouse |
| **FPS médio** e **frame time p95** | fluidez percebida | FPS meter, rAF sampler, Performance panel |
| **1% low** (p99 do frame time) | stutter/engasgo | rAF sampler |
| **Long tasks** (>50 ms) | travadas de JS/GC | Performance panel, `PerformanceObserver` |
| **Heap JS** antes/depois de GC | vazamento/consumo | Memory panel, `performance.memory`, CDP |
| **Erros de console/404/requests externos** | build quebrado, dependência de rede | Console/Network |
| **Tempo de resposta ao primeiro input** | controle “mole” | observação manual/Performance |

**Não** use FPS de headless/SwiftShader como aprovação. **Não** use um único
número de FPS sem p95/1% low. **Não** compare máquinas diferentes sem registrar
CPU/RAM/GPU/refresh rate.

---

## 1. Pré-requisitos

- Node.js `>=22.12.0` (o `package.json` exige).
- Chrome ou Edge atualizados (o jogo é testado nesses dois; Safari fica
  desabilitado se não funcionar).
- Host com pelo menos 8 GB de RAM livre; feche abas/apps pesados.
- Notebook na tomada, plano de energia “alto desempenho”, economia de bateria
  desligada.
- 30–45 minutos para a matriz completa (build + 6 viewports + 5 min de sessão
  longa); uma rodada rápida de um viewport leva ~5 min.

```bash
cd /caminho/do/4-Blockbreaker-roguelite
npm ci
npm run build
npm run preview -- --port 4173 --strictPort
```

Abra `http://127.0.0.1:4173/` no Chrome/Edge. Use `?debug=1&resetSave=1` apenas
para os cenários de stress com o painel de debug; para o baseline “jogo limpo”,
use a URL sem query.

> **Não use `npm run dev` para performance.** O Vite dev serve módulos separados,
> com HMR e sem minificação; os números não representam o build de produção.
> `npm run preview` serve o `dist/` gerado por `npm run build`.

---

## 2. Ambiente limpo e perfil separado

### 2.1 Por que um perfil separado

Extensões, temas, outras abas e cache antigo mudam o resultado. Crie um perfil
descartável só para o teste:

**Linux**

```bash
mkdir -p /tmp/bricklike-perf-profile
google-chrome \
  --user-data-dir=/tmp/bricklike-perf-profile \
  --no-first-run --no-default-browser-check \
  --disable-extensions \
  --force-device-scale-factor=1 \
  --enable-precise-memory-info \
  --js-flags="--max-old-space-size=2048 --enable-precise-memory-info --expose-gc" \
  http://127.0.0.1:4173/
```

**Windows (cmd)**

```bat
"%ProgramFiles%\Google\Chrome\Application\chrome.exe" ^
  --user-data-dir="%TEMP%\bricklike-perf-profile" ^
  --no-first-run --no-default-browser-check ^
  --disable-extensions ^
  --force-device-scale-factor=1 ^
  --enable-precise-memory-info ^
  --js-flags="--max-old-space-size=2048 --enable-precise-memory-info --expose-gc" ^
  http://127.0.0.1:4173/
```

**Edge:** troque o executável por `msedge` (Linux) ou
`"%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"` (Windows).

**PowerShell:** troque as quebras de linha `^` por crase (`` ` ``) ou rode o
comando em uma linha só.

### 2.2 O que `--max-old-space-size` faz — e o que não faz

- Ele limita o **old space do V8** (heap JS), não a RAM do sistema, a GPU ou o
  processo inteiro do navegador.
- `2048` (2 GB) é um limite conservador para simular um aparelho apertado;
  `1024` é mais extremo; **abaixo de ~512 o navegador pode falhar ao abrir
  páginas** ou o próprio jogo pode não bootar. Não use 256.
- O limite é por processo/renderer; o navegador pode usar mais memória total.
- Use sempre um `--user-data-dir` separado: assim você não altera o seu perfil
  normal nem perde sessões.
- `--enable-precise-memory-info` deixa `performance.memory` menos arredondado;
  `--expose-gc` permite chamar `gc()` no console.
- `--force-device-scale-factor=1` garante DPR 1. Se você usa monitor HiDPI sem
  esse flag, o jogo pode renderizar em DPR 2 e o teste não vale como “DPR 1”.

### 2.3 Emular Chromebook 4 GB sem um Chromebook

Não existe um “emulador de 4 GB” no DevTools. A aproximação prática é:

1. **CPU throttling 4×** (mais próximo de um Celeron/ARM de entrada) e, no
   cenário severo, **6×**.
2. **Heap limitado** com `--max-old-space-size=2048` (ou 1024 no cenário
   severo).
3. **Rede Slow 4G** no boot (400 ms latency, ~400 kbps).
4. **DPR 1** e viewport pequeno.
5. Se possível, um **Chromebook real** ou um notebook com 4 GB e CPU de entrada;
   esse é o único teste que a CrazyGames considera de verdade.

Registre sempre “aproximado por CPU 4×/heap 2 GB”, não “testado em Chromebook”.

---

## 3. DevTools: DPR 1, viewports e iframes

### 3.1 DPR 1 e viewport exato

1. Abra o DevTools (F12) e destaque-o em janela separada (⋮ → Dock side →
   undock), para o viewport não ser reduzido pelo painel.
2. Ative o **Device Toolbar** (`Ctrl+Shift+M` / `Cmd+Shift+M`).
3. Em **Dimensions**, escolha **Responsive** e digite a largura/altura exatas.
4. Em **DPR**, escolha **1** (não “Device pixel ratio” automático).
5. Confirme no console: `window.innerWidth`, `window.innerHeight`,
   `window.devicePixelRatio` (deve ser 1).
6. Dê reload completo (`Ctrl+Shift+R`) depois de mudar o tamanho.

Tamanhos obrigatórios:

| Contexto | Viewport | DPR |
|---|---|---|
| Desktop não-fullscreen | `907×510` | 1 |
| Desktop não-fullscreen | `1216×684` | 1 |
| Desktop fullscreen | `1280×720` | 1 |
| Desktop fullscreen | `1920×1080` | 1 |
| Mobile | `800×450` | 1 |
| Mobile portrait | `390×844` | 1 |

A CrazyGames também lista `1077×606`, `821×462`, `1366×768`, `1536×864` e
`1080×607`; se sobrar tempo, rode esses também.

### 3.2 Iframe de verdade (recomendado)

O jogo é embedado em iframe no portal. Para medir o iframe exato, crie um arquivo
temporário **fora do repositório** (ex.: `/tmp/bricklike-frame.html` no Linux,
`%TEMP%\bricklike-frame.html` no Windows):

```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      html, body { margin: 0; background: #111; }
      body { display: flex; align-items: center; justify-content: center; min-height: 100vh; }
      iframe { width: 907px; height: 510px; border: 0; background: #05070f; }
    </style>
  </head>
  <body>
    <iframe
      src="http://127.0.0.1:4173/?debug=1&amp;resetSave=1"
      allow="autoplay; fullscreen"
    ></iframe>
  </body>
</html>
```

Troque `width`/`height` para cada tamanho. Abra o arquivo no Chrome
(`file:///tmp/bricklike-frame.html`) e use o DevTools. Se o `file://` for
bloqueado no seu Chrome, sirva a pasta temporária:

```bash
python3 -m http.server 8000 --directory /tmp
# abra http://127.0.0.1:8000/bricklike-frame.html
```

No DevTools:

- **Elements** → selecione o `iframe` → no console, escolha o contexto do frame
  no dropdown (top → `127.0.0.1:4173`).
- **Performance** grava todos os frames; o frame do jogo aparece na track
  “Frames”.
- Para 1920×1080, se a tela não couber, use o script da §6 (Playwright) ou o
  Device Toolbar em 1920×1080; o importante é o viewport interno, não a janela.

**Atalho:** para uma checagem rápida de layout, o Device Toolbar no tamanho
exato já é suficiente, porque o jogo usa `100vw/100dvh`. O iframe de verdade
também testa embed, CSP, `X-Frame-Options` e o comportamento do Portal.

---

## 4. Roteiro de medição

### 4.1 Boot (cold)

1. DevTools → **Network** → marque **Disable cache**.
2. Se quiser simular 4G: Network → **Slow 4G** (ou Custom: 400 ms, 400 kbps).
3. Performance → **Record** → reload (`Ctrl+Shift+R`) → pare quando o menu
   aparecer.
4. Leia no console: `[boot] menu ready in X ms — platform=…`.
5. Anote também o **FCP/LCP** na track “Timings” e o tempo até o botão
   **Campaign** ficar clicável.
6. Repita 3× e use a **mediana**; a primeira execução compila shaders/cache.

**Meta:** boot local ≤ 2,5–3 s; Slow 4G ≤ 10 s; nunca > 15 s. A doc da
CrazyGames fala em ≤ 20 s para arquivos externos e “top performers” < 10 s; a
Playgama recomenda < 5 s (nunca > 10 s).

### 4.2 Gameplay — baseline e stress

**Baseline (jogo limpo):**

1. Abra `http://127.0.0.1:4173/` (sem `debug`).
2. Jogue 60 s normais: menu → Campaign → fase 1, arraste, lance, quebre blocos.
3. Grave 60 s no Performance panel com **Memory** marcado.
4. Anote FPS médio, p95, long tasks e heap.

**Stress (pior caso plausível):**

1. Abra `http://127.0.0.1:4173/?debug=1&resetSave=1`.
2. Entre em Campaign → fase 1.
3. No painel Debug, clique **Add ball** 7× (até 8 bolas).
4. Clique **Fire projectile** a cada ~300 ms (ou segure a tecla de tiro, se
   houver) por 60 s.
5. Resolva os cards de level-up (1/2/3) quando aparecerem.
6. Grave 60 s. Esse é o cenário que mais estressa partículas/colisões.

**Sessão longa (vazamento):**

1. Jogue 5 min no cenário de stress.
2. Force GC (lixeira do Memory panel ou `gc()`).
3. Anote o heap; jogue mais 5 min; force GC; compare.
4. Um crescimento monotônico > 30 MB é sinal de vazamento; oscilação de 5–15 MB
   é normal.

### 4.3 FPS e frame time no DevTools

- **FPS meter:** `Ctrl+Shift+P` → “Show frames per second (FPS) meter”. É
  instantâneo; use para ver quedas, não como média.
- **Performance panel:** grave 60 s e leia:
  - **Frames**: altura das barras = frame time; vermelho/rosa = frames longos.
  - **Main**: long tasks (barras > 50 ms), scripting, GC.
  - **GPU**: se estiver saturada, o gargalo é render.
  - **Timings**: FCP/LCP/DCL.
- **Rendering → Frame Rendering Stats** mostra FPS e GPU memory (quando
  disponível).

### 4.4 Snippet de rAF (média, p95, 1% low, long tasks)

Cole no console **do frame do jogo** (no iframe, selecione o contexto correto):

```js
(() => {
  const frames = [];
  const longTasks = [];
  let last = performance.now();
  let raf = 0;

  const tick = (now) => {
    frames.push(now - last);
    last = now;
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) longTasks.push(entry.duration);
    }).observe({ entryTypes: ['longtask'] });
  } catch {}

  window.__perfStop = () => {
    cancelAnimationFrame(raf);
    const sorted = [...frames].sort((a, b) => a - b);
    const sum = frames.reduce((a, b) => a + b, 0);
    const pick = (p) => sorted[Math.floor(p * (sorted.length - 1))];
    const result = {
      samples: frames.length,
      avgFps: +(1000 / (sum / frames.length)).toFixed(1),
      p50FrameMs: +pick(0.5).toFixed(2),
      p95FrameMs: +pick(0.95).toFixed(2),
      p99FrameMs: +pick(0.99).toFixed(2),
      onePercentLowFps: +(1000 / pick(0.99)).toFixed(1),
      maxFrameMs: +sorted.at(-1).toFixed(2),
      longTasks: longTasks.length,
      longTaskMaxMs: longTasks.length ? +Math.max(...longTasks).toFixed(1) : 0,
      heapMB: performance.memory
        ? +(performance.memory.usedJSHeapSize / 1048576).toFixed(1)
        : null,
    };
    console.table(result);
    return result;
  };

  console.log('Rode 60 s e execute __perfStop()');
})();
```

Rode 60 s, depois `__perfStop()`. Use o resultado na tabela. Repita 3× e
registre a mediana; a primeira amostra inclui compilação de shader.

### 4.5 Memória e GC

**Memory panel:**

1. DevTools → **Memory**.
2. Clique na **lixeira** (“Collect garbage”) antes de medir.
3. Tire um **Heap snapshot** no início e outro após 5 min.
4. Compare “Shallow size”/“Retained size” e o número de objetos/dom nodes.
5. Se o heap crescer sem parar, tire um segundo snapshot e use “Comparison”.

**Performance monitor:** ⋮ → More tools → Performance monitor. Mostra JS heap
size, DOM nodes, listeners, CPU. Deixe aberto durante a sessão.

**Console:**

```js
// Requer --enable-precise-memory-info para mais precisão
performance.memory && {
  usedMB: +(performance.memory.usedJSHeapSize / 1048576).toFixed(1),
  totalMB: +(performance.memory.totalJSHeapSize / 1048576).toFixed(1),
  limitMB: +(performance.memory.jsHeapSizeLimit / 1048576).toFixed(1),
};
```

**GC forçado:**

- DevTools Memory → ícone de lixeira; ou
- `gc()` no console (só com `--js-flags=--expose-gc`); ou
- CDP `HeapProfiler.collectGarbage` (o script da §6 faz isso).

`performance.memory` mede o heap JS, não GPU/Canvas/WebGL. Use o Task Manager do
Chrome (`Shift+Esc`) para ver a memória total do processo/renderer.

---

## 5. Lighthouse (load, não FPS)

Lighthouse mede carregamento/renderização inicial, acessibilidade e boas
práticas; **não mede a fluidez do canvas**. Use como complemento do boot.

```bash
# Desktop, 3 rodadas, relatório HTML
npx --yes lighthouse@latest http://127.0.0.1:4173/ \
  --preset=desktop \
  --only-categories=performance \
  --chrome-flags="--headless=new --no-sandbox" \
  --output=html \
  --output-path=/tmp/lighthouse-desktop.html

# Mobile (emula Moto G / 4x CPU / Slow 4G por padrão)
npx --yes lighthouse@latest http://127.0.0.1:4173/ \
  --only-categories=performance \
  --chrome-flags="--headless=new --no-sandbox" \
  --output=html \
  --output-path=/tmp/lighthouse-mobile.html
```

- Rode 3× e use a **mediana**; a primeira rodada é mais lenta.
- Lighthouse mobile já aplica CPU 4× e rede lenta; não empilhe outro throttle.
- O resultado de “Performance” é uma pontuação composta; registre **FCP, LCP,
  TBT, CLS, Speed Index** separadamente.
- Lighthouse não vê o iframe do portal; rode na URL direta e teste o iframe
  separadamente.

---

## 6. Script opcional: `scripts/perf-smoke.mjs`

O script usa Playwright + CDP para automatizar a matriz, medir rAF, long tasks,
heap e erros. Ele **não substitui** o teste manual: por padrão roda headless
(SwiftShader), que é mais lento que uma GPU real.

```bash
# terminal 1
npm run build
npm run preview -- --port 4173 --strictPort

# terminal 2 — matriz completa, iframe exato, 30 s por viewport
node scripts/perf-smoke.mjs --headed=1

# um viewport, 6x CPU, viewport direto (sem iframe)
node scripts/perf-smoke.mjs --viewports=907x510 --cpu=6 --iframe=0 --duration=20 --headed=1

# boot com rede lenta
node scripts/perf-smoke.mjs --viewports=907x510 --network=slow4g --duration=15 --headed=1
```

Opções: `--url`, `--viewports`, `--duration`, `--cpu`, `--iframe=1|0`,
`--headed=1`, `--network=slow4g|none`, `--out`, `--keep-open=1`.
O padrão é `http://127.0.0.1:4173`, 6 viewports, 30 s, CPU 4×, iframe ligado.
Saída padrão: `docs/qa/perf-results.json`.

O script:

- cria um iframe do tamanho exato (ou viewport direto com `--iframe=0`);
- aplica `Emulation.setCPUThrottlingRate` e, se pedido,
  `Network.emulateNetworkConditions` (Slow 4G);
- entra em Campaign → fase 1, adiciona 7 bolas e dispara projéteis;
- coleta avg FPS, p50/p95/p99, 1% low, long tasks, heap antes/depois de GC,
  erros de console/página e requests falhos;
- imprime uma linha por viewport e grava JSON.

**Cuidados:**

- Headless/SwiftShader dá FPS muito abaixo do real (ex.: ~20 FPS com CPU 4×
  neste host). Use `--headed=1` para o número que importa; headless serve para
  comparar builds/regressões.
- O `--max-old-space-size` **não** é aplicado pelo script; para o cenário de
  heap apertado, use o Chrome manual da §2 ou adapte o launch.
- O script não mede GPU memory nem temperatura; para Chromebook real, teste
  manual.

---

## 7. Tabela de resultados (copie para `docs/qa/perf-results.csv` ou planilha)

Uma linha por cenário/viewport. Preencha “—” quando não mediu.

| Data | Build | Browser/versão | CPU | Rede | Viewport/iframe | DPR | Cenário | Boot (ms) | FPS médio | p95 frame (ms) | 1% low | Long tasks >50 ms | Maior long task (ms) | Heap pós-GC (MB) | Δ heap 5 min (MB) | Erros/404 | Veredito | Notas |
|---|---|---|---:|---|---|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---|---|---|
| 2026-11-11 | 0.5.0 | Chrome atual | 4× | none | 907×510 iframe | 1 | stress 8 balls | | | | | | | | | | | |
| 2026-11-11 | 0.5.0 | Chrome atual | 4× | none | 1216×684 iframe | 1 | stress 8 balls | | | | | | | | | | | |
| 2026-11-11 | 0.5.0 | Chrome atual | 4× | none | 1280×720 iframe | 1 | stress 8 balls | | | | | | | | | | | |
| 2026-11-11 | 0.5.0 | Chrome atual | 4× | none | 1920×1080 iframe | 1 | stress 8 balls | | | | | | | | | | | |
| 2026-11-11 | 0.5.0 | Chrome atual | 4× | none | 800×450 iframe | 1 | stress 8 balls | | | | | | | | | | | |
| 2026-11-11 | 0.5.0 | Chrome atual | 4× | none | 390×844 iframe | 1 | stress 8 balls | | | | | | | | | | | |
| 2026-11-11 | 0.5.0 | Chrome atual | 6× | Slow 4G | 907×510 iframe | 1 | boot cold | | | | | | | | | | | |
| 2026-11-11 | 0.5.0 | Chrome atual | 1× | none | 1280×720 direto | 1 | idle/menu 60 s | | | | | | | | | | | |

**Regras de preenchimento:**

- “FPS médio” = `1000 / média dos frame intervals`, não a leitura instantânea do
  FPS meter.
- “p95 frame” = 95º percentil dos frame intervals; “1% low” = `1000 / p99`.
- “Long tasks” = quantidade de entradas `longtask` (cada uma ≥50 ms).
- “Heap pós-GC” = depois da lixeira/`gc()`, não o pico.
- “Δ heap 5 min” = heap pós-GC no fim − heap pós-GC no início.
- “Veredito” = PASS / WARN / FAIL conforme a §8.
- Anexe screenshots do Performance panel e do Memory panel; sem isso, o número
  não é auditável.

---

## 8. Critérios objetivos de aprovação

Os limites abaixo são **para este jogo** (canvas 2D/WebGL leve, 60 Hz alvo) e
são mais rigorosos que o mínimo dos portais. Eles não substituem o bom senso: um
WARN em 6× CPU não é o mesmo que um FAIL em 4×.

### 8.1 Boot

| Métrica | PASS | WARN | FAIL |
|---|---|---|---|
| Boot local até menu interativo | ≤ 3,0 s | 3,0–5,0 s | > 5,0 s |
| Boot com Slow 4G (400 ms/400 kbps) | ≤ 10 s | 10–15 s | > 15 s |
| Time to first playable (gameplay) | ≤ 5 s | 5–10 s | > 10 s |
| Erros de console/página no boot | 0 | 1–2 warnings | qualquer `pageerror`, tela preta ou crash |

Referências: CrazyGames “load quickly”, ≤20 s para arquivos externos e top
performers <10 s; Playgama <5 s ideal, nunca >10 s.

### 8.2 Fluidez (60 Hz)

| Métrica | PASS | WARN | FAIL |
|---|---|---|---|
| FPS médio, CPU 4× | ≥ 55 | 45–54,9 | < 45 |
| FPS médio, CPU 6× (low-end severo) | ≥ 45 | 35–44,9 | < 35 |
| p95 frame time, CPU 4× | ≤ 20 ms | 20–25 ms | > 25 ms |
| 1% low FPS | ≥ 30 | 20–29,9 | < 20 |
| Frame time máximo (pico isolado) | ≤ 100 ms | 100–250 ms | > 250 ms |

Se o monitor for 120/144 Hz, o FPS pode passar de 60; compare com o refresh rate
real e não exija “60” cegamente. O importante é o frame time e a estabilidade.

### 8.3 Long tasks e GC

| Métrica | PASS | WARN | FAIL |
|---|---|---|---|
| Long tasks >50 ms em 60 s | ≤ 2 | 3–5 | > 5 |
| Maior long task | ≤ 200 ms | 200–500 ms | > 500 ms |
| Long task total | ≤ 300 ms | 300–800 ms | > 800 ms |

Um long task de 200 ms no boot (compilação de shader) é aceitável; long tasks
recorrentes durante o gameplay não.

### 8.4 Memória

| Métrica | PASS | WARN | FAIL |
|---|---|---|---|
| Heap JS pós-GC em gameplay | ≤ 80 MB | 80–150 MB | > 150 MB |
| Δ heap em 5 min (pós-GC) | ≤ 10 MB | 10–30 MB | > 30 MB |
| Crescimento monotônico | não | oscila | sim, sem platô |
| Memória total do renderer (Task Manager) | ≤ 300 MB | 300–500 MB | > 500 MB |

Referência: Playgama sugere <300–500 MB em mobile; o Bricklike deve ficar muito
abaixo disso. O heap JS não inclui GPU/Canvas; por isso a coluna do Task Manager.

### 8.5 Erros e rede

| Métrica | PASS | WARN | FAIL |
|---|---|---|---|
| `pageerror` | 0 | 0 | ≥1 |
| Console errors | 0 | 1–2 não bloqueantes | ≥3 ou qualquer erro recorrente |
| 404/requests falhos | 0 | 1 asset opcional | qualquer asset essencial ou script externo |
| Requests externos não previstos | 0 | 1 (ex.: fonte) | qualquer script/ad de outro portal |
| WebGL context lost | 0 | 1 recuperado | não recupera/tela preta |

### 8.6 Critério final

**PASS de performance** se, em CPU 4× e nos seis viewports:

- boot local ≤ 3 s e Slow 4G ≤ 10 s;
- FPS médio ≥ 55, p95 ≤ 20 ms, 1% low ≥ 30;
- ≤2 long tasks e nenhuma >200 ms;
- heap pós-GC ≤80 MB e Δ ≤10 MB em 5 min;
- zero erros/404/requests externos essenciais.

**FAIL** se qualquer um: boot >15 s, tela preta/crash, FPS médio <45, p95 >25 ms,
>5 long tasks, long task >500 ms, heap >150 MB ou crescimento >30 MB, erro de
console recorrente.

**WARN** = entre PASS e FAIL; investigue antes de concluir. Em 6× CPU, aceite
resultados um degrau piores; em headless/SwiftShader, não use como veredito.

---

## 9. Interpretação: performance provavelmente não é a causa

Evidências atuais:

- Medição local de 2026-11-11: `dist/` com ~3,0 MB, chunk principal ~1,4 MB e
  20 arquivos; o ZIP de release de `0.5.0` tem ~1,48 MB. Revalide no build que
  for submetido. Ainda é muito abaixo dos limites da CrazyGames (250 MB total,
  50 MB inicial, 1500 arquivos). O baseline antigo de 490 KB/13 arquivos está
  em `docs/old/qa/performance.md`.
- Heap JS baseline ~20–30 MB; 8 bolas + partículas não cresceu de forma
  relevante no stress headless antigo.
- O jogo é canvas 2D/WebGL simples, sem assets 3D, sem streaming, sem dezenas de
  MB de texturas.
- O bridge agora é **local-only** (`playgamaBridge({ mode: 'local' })`): o
  `index.html` carrega `./playgama-bridge.js` do próprio ZIP e não faz request
  ao CDN da Playgama no boot. No mock/itch.io/Playgama local, o Network não deve
  mostrar `bridge.playgama.com`. O adapter do CrazyGames ainda carrega o SDK
  próprio do portal quando detecta `crazygames.`, como exige o Full Launch; isso
  não é um ad de terceiros.
- O timeout de 10 s do boot continua existindo como rede de segurança, mas não
  deve ser atingido no caminho normal.

Portanto:

- Se o Bricklike passar nos critérios acima, **não gaste o próximo ciclo em
  micro-otimização**. O problema da CrazyGames é mais provavelmente
  apresentação/legibilidade desktop, onboarding, originalidade e compliance.
- Se falhar apenas em 6×/headless, meça em Chromebook/notebook real antes de
  reescrever render.
- Se falhar em 4× com 907×510, aí sim há um problema de performance real — mas
  ele ainda precisa ser separado de “HUD minúsculo” e “layout esticado”.

---

## 10. Checklist final

- [ ] Build de produção (`npm run build`), não dev server.
- [ ] Perfil limpo, sem extensões, DPR 1, cache desabilitado no boot.
- [ ] 6 viewports, iframe exato (ou justificativa para viewport direto).
- [ ] CPU 4× e 6×; rede none e Slow 4G no boot.
- [ ] 60 s de gameplay baseline + 60 s stress com 8 bolas.
- [ ] 5 min de sessão longa com GC antes/depois.
- [ ] FPS médio, p95, 1% low, long tasks, heap e erros registrados.
- [ ] Lighthouse desktop e mobile (3×, mediana).
- [ ] Screenshots do Performance/Memory anexados.
- [ ] Veredito PASS/WARN/FAIL por viewport.
- [ ] Conclusão explícita: “performance não é a causa” ou “há regressão em X”.

---

## 11. Referências

- CrazyGames, requisitos técnicos (Chromebook 4 GB, Chrome/Edge, tamanhos):
  <https://docs.crazygames.com/requirements/technical/>
- CrazyGames, requisitos de gameplay (Readable Content, iframes, DPR 1):
  <https://docs.crazygames.com/requirements/gameplay/>
- CrazyGames, Basic Launch (boot <10 s, conversão):
  <https://docs.crazygames.com/resources/basic-launch-metrics/>
- Playgama, performance (boot <5 s, 60 FPS, memória <300–500 MB):
  <https://wiki.playgama.com/playgama/guides/performance-and-optimization>
- Chrome DevTools Performance:
  <https://developer.chrome.com/docs/devtools/performance/>
- Chrome DevTools Memory/GC:
  <https://developer.chrome.com/docs/devtools/memory/>
- Lighthouse:
  <https://developer.chrome.com/docs/lighthouse/overview/>
- Playwright `page.metrics()`/CDP:
  <https://playwright.dev/docs/api/class-page#page-metrics>
