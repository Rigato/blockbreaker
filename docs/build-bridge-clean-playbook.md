# Build bridge × clean — playbook de implementação

Complemento prático da [spec de publicação em 6 portais](spec_tecnica_portais_web.md).
A spec define **o que** cada portal aceita; este documento registra **como** montar
as duas builds sem bifurcar o projeto e sem repetir os erros que motivaram a
separação.

## 1. Modelo mental

Um código-fonte, dois **grafos de módulos**:

| Target | Boot | SDK | Saída |
|---|---|---|---|
| `bridge` | `platformBootBridge.ts` | Playgama Bridge 2.4.4 | `dist/` |
| `clean` | `platformBootClean.ts` | nenhum | `dist-clean/` |

O target é resolvido no **build** (`resolve.alias` + `tsconfig.paths`), não em
runtime. Evite `if (host === 'crazygames.com')` para decidir qual SDK carregar:
o arquivo do SDK indesejado continua no ZIP mesmo que nunca seja executado.

## 2. Onde o SDK se esconde

Antes de declarar uma build “limpa”, procure o termo do SDK em **todos** estes
lugares:

| Lugar | Exemplo |
|---|---|
| Import direto | `import { bridge } from '@playgama/bridge'` |
| Import de tipo | `import type { PlaygamaBridge }` (não gera runtime, mas confirme) |
| `public/` | runtime JS, JSON de config, licença |
| Carregamento dinâmico | `script.src = './playgama-bridge.js'` |
| Texto do bundle | nome do arquivo, globais `bridge`/`playgamaBridge`, URL do portal |
| HTML/CSS | `<script src>`, `@import`, `url()` externo |
| Metadados | `manifest`, `package.json` (não vão no ZIP, mas documente) |

O teste decisivo é no **ZIP final**, não no `src/`:

```bash
unzip -Z1 release/blockbreaker-web-clean.zip | grep -iE 'playgama|crazy'
# deve sair vazio
unzip -p release/blockbreaker-web-clean.zip assets/index-*.js | grep -iE 'playgama|crazy'
# deve sair vazio
```

## 3. Boot por alias (não confie só em DCE)

O Vite remove bem código morto, mas um `console.log` ou efeito de topo em um
módulo importado pode mantê-lo no grafo. O alias elimina a dúvida:

```ts
// vite.config.ts
const target = process.env.BUILD_TARGET === 'clean' ? 'clean' : 'bridge';
resolve: {
  alias: {
    '@boot-target': path.resolve(
      root,
      target === 'clean'
        ? 'src/boot/platformBootClean.ts'
        : 'src/boot/platformBootBridge.ts',
    ),
  },
},
build: { outDir: target === 'clean' ? 'dist-clean' : 'dist' },
```

```ts
// src/boot/platformBoot.ts
export { bootPlatform } from '@boot-target';
export type { BootResult } from './bootTypes';
```

`tsconfig.paths` aponta `@boot-target` para a implementação `bridge` apenas para
o typecheck; o arquivo `clean` continua sendo checado por estar em `src/`.
Vitest usa o alias `bridge` por padrão; testes do clean importam
`platformBootClean`/`CleanAdapter` diretamente.

## 4. Contrato de plataforma congelado

Se `PlatformService` não pode mudar, não invente `source: 'clean'` nem
`storageKind: 'local'`. Leve a informação para o **resultado do boot**:

```ts
interface BootResult {
  platform: PlatformService;
  storagePersistent: boolean;
  storageLabel: string; // bridge | memory | localStorage
  buildTarget: 'bridge' | 'clean';
}
```

- `UIRoot` usa `storagePersistent` para decidir o aviso “Progress may not be
  saved”;
- `DebugPanel` usa `storageLabel` para mostrar a verdade;
- o adapter clean pode reportar `source: 'fallback'` e
  `storageKind: 'bridge'/'memory'` para compatibilidade, desde que a UI não
  dependa desses valores para o aviso.

## 5. Persistência do clean

Não reutilize o `FallbackAdapter` puro: ele usa memória e perde save/settings a
cada reload. O clean precisa de um `BrowserStorage` dedicado:

- `localStorage` com `try/catch` na leitura, escrita e remoção;
- se o acesso falhar (Safari privado, quota, iframe sandbox), degradar para
  memória **na sessão** e marcar `isPersistent = false`;
- manter as mesmas chaves (`bb.save`, `bb.settings`) e o mesmo schema;
- concentrar o acesso direto em **um único módulo** (ex.:
  `src/storage/BrowserStorage.ts`) e manter o resto do código usando
  `StorageService`.

Testes úteis: round-trip, storage indisponível, `setItem` que lança, e um teste
de fronteira que falha se `localStorage` aparecer fora do módulo permitido.

## 6. Ads, pausa e `game_ready` no clean

O clean não tem SDK, então:

- `isInterstitialSupported = false` e `isRewardedSupported = false`;
- `showInterstitial`/`showRewarded` retornam `skipped` **imediatamente**;
- a UI esconde revive/rewarded (o jogo precisa ter caminho sem anúncio);
- `sendMessage('game_ready')` é no-op;
- pausa vem de `visibilitychange` + `blur`/`focus`, não do SDK;
- áudio continua local; não há mute vindo do portal.

## 7. Empacotamento

Gere dois diretórios e dois ZIPs:

```text
dist/                         -> release/blockbreaker-web.zip
dist-clean/                   -> release/blockbreaker-web-clean.zip
release/manifest.json         -> target: bridge
release/manifest-clean.json   -> target: clean
```

Regras práticas:

- mantenha `dist` e `blockbreaker-web.zip` como **bridge** para não quebrar
  GitHub Pages, preview e workflows existentes;
- o clean exige `index.html` na raiz e **proíbe** runtime/config/licença da
  Playgama e strings como `sdk.crazygames.com`, `crazygames.com`,
  `1001juegos.com`;
- use allowlist de hosts e lista de termos proibidos **por target**;
- valide `zip -t`, contagem de arquivos, paths ≤ 240 e tamanho; CrazyGames
  Basic mira ≤ 20 MB e teto de 50 MB;
- o hash muda a cada rebuild (timestamps); confirme sempre no manifesto.

## 8. Testes

- **Unitários bridge**: mantenha as suítes do Bridge/Playgama; elas não valem
  como cobertura do clean.
- **Unitários clean**: storage, adapter, ads `skipped`, sem SDK.
- **E2E clean**: dois previews (4173 bridge, 4174 clean) e um projeto Playwright
  separado. Verifique:
  - nenhuma request a `playgama`/`sdk.crazygames.com`;
  - nenhuma request externa e nenhum 404;
  - settings/save persistem após reload;
  - aviso de storage **não** aparece quando o storage é persistente;
  - HUD/gameplay sobem sem erro de página;
  - painel debug mostra `clean` + `localStorage`.
- Rode a suíte bridge existente sem alterações: ela é o contrato de regressão.

## 9. CI, Pages e portais

- GitHub Pages continua publicando `dist/` (bridge). Não troque o artefato do
  Pages para o clean.
- CI/release devem subir **os dois** `dist` e **os dois** ZIPs/manifestos.
- Playgama, Y8, Lagged e itch.io recebem o **bridge**; itch usa o modo `mock`.
- CrazyGames Basic e Kongregate recebem o **clean**.
- CrazyGames Full Launch, se aprovado, é um **terceiro** target (`cg`) com o SDK
  nativo; não reintroduza o SDK no clean.

## 10. Checklist rápido

```bash
npm run typecheck
npm test
npm run validate:content
node scripts/validate-bridge-config.mjs
npm run build            # dist + dist-clean
npm run package          # dois ZIPs + manifestos
npm run test:e2e         # bridge + mobile + clean

unzip -Z1 release/blockbreaker-web-clean.zip | grep -iE 'playgama|crazy'   # vazio
unzip -p release/blockbreaker-web-clean.zip assets/index-*.js | grep -iE 'playgama|crazy' # vazio
unzip -t release/blockbreaker-web.zip
unzip -t release/blockbreaker-web-clean.zip
```

## 11. Armadilhas que custaram tempo

1. **“Só apagar o arquivo” não basta**: o loader continua no bundle e tenta
   buscar um 404 em portais sem Bridge.
2. **Fallback em memória** perde progresso; clean precisa de storage próprio.
3. **`public/` é copiado inteiro** pelo Vite; exclusão precisa ser explícita e
   validada no ZIP.
4. **DCE não é garantia**: alias de módulo + `grep` no artefato final.
5. **Teste de storage direto** pode acusar comentários/strings; concentre o
   acesso real em um módulo e ajuste a fronteira com precisão.
6. **Hash de ZIP muda** a cada rebuild; nunca reaproveite hash de manifest
   antigo.
7. **Não envie o ZIP bridge ao CrazyGames**: ele contém a Playgama, mesmo que o
   adapter nativo seja escolhido em runtime.
