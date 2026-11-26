# Pacote de publicação

Versão publicada: **`0.6.1`** no **itch.io**; jogo **aceito e publicado na Playgama**  
Build local: **`0.8.0`** (bridge × clean; pronta para upload manual)
Build anterior: **`0.7.2`** (Bridge 2.4.4 + correção do ímã do tutorial)
CrazyGames: **`0.5.1` submetida** em 2026-11-11; submissão pausada até 2026-11-26; a `0.8.0` clean é a candidata
Tag planejada: **`v0.8.0`** (não criada; depende de aprovação humana)

Este diretório reúne o material para revisão humana e submissão **manual** nos
portais. Os uploads de itch.io/Playgama e a submissão ao CrazyGames foram feitos
pelo responsável; a tag e o GitHub Release continuam manuais. A `0.6.1` foi
publicada no itch.io em 2026-11-12; o jogo foi aceito e publicado na Playgama.

## Comece por aqui

1. `docs/handoff-v0.7.2.md` — onboarding da sessão atual.
2. `docs/release/portal-metadata.md` — textos em inglês por portal.
3. `docs/release/submission-checklist.md` — campos e passos de cada portal.
4. `docs/release/status.md` — status/URLs de publicação.
5. `docs/release/crazygames-review.md` — reprovações, decisão sobre desktop e
   histórico da 0.5.1.
6. `docs/research/crazygames-feedback.md` — canais de suporte e rascunho.
7. `docs/build-release.md` — build, ZIPs, CI, ads QA e runbook de tag.
8. `docs/build-bridge-clean-playbook.md` — decisões e armadilhas da separação.
9. `store/README.md` — índice dos assets de loja.

## Pacote local atual (0.8.0)

| Item | Bridge | Clean |
|---|---|---|
| ZIP | `release/blockbreaker-web.zip` | `release/blockbreaker-web-clean.zip` |
| Arquivos | 20 | 17 |
| Tamanho | 1.545.986 bytes (~1.510 KiB) | 1.431.534 bytes (~1.398 KiB) |
| SHA-256 | `ee17abbaf000a9872dd157ddbd51c6e2abc1f960d0ece9199608fbbcfe781b2f` | `918759c7809178aa511907cc6a611b6e666843dd583a723ee3893cac62450287` |
| Raiz | `index.html` + config | `index.html` |
| Destino | Playgama, Y8, Lagged, itch.io | CrazyGames Basic, Kongregate |

- Gates: 440 testes em 37 arquivos; 46 E2E (bridge + mobile + clean); conteúdo
  com 19 níveis / 71 ondas / 2.781 blocos / 9.392 XP.
- O clean não contém runtime/config da Playgama nem o SDK nativo do CrazyGames;
  usa browser storage, sem ads.
- O hash pode mudar em um rebuild; confirme nos manifestos antes de qualquer
  upload.

## Pacote anterior (0.7.2)

- `release/blockbreaker-web.zip` — 20 arquivos, 1.545.956 bytes,
  3.193.338 bytes descomprimidos, maior path com 38 caracteres.
- SHA-256: `aa5d2af25e690b42d681f8c5938572550626ef8adc7897734970925ba23791d3`.
- Gates: 431 testes em 35 arquivos; 43 E2E em 12 spec files; conteúdo com
  19 níveis / 71 ondas / 2.781 blocos / 9.392 XP.
- Bridge 2.4.4 vendorizado; a auto-certificação da Playgama deve inicializar
  essa versão.
- O hash pode mudar em um rebuild; confirme em `release/manifest.json` antes de
  qualquer upload.

## Pacote publicado (0.6.1)

- `release/blockbreaker-web.zip` — 20 arquivos, 1.514.492 bytes
  (~1.482 KiB), 3.068.148 bytes descomprimidos, maior path com 38 caracteres.
- SHA-256: `3f3c409845aaa090ccada04435c47298db0e994ec76821b7f59e741009ee49f8`.
- Gates: 396 testes em 32 arquivos; 37 E2E em 10 spec files; conteúdo com
  7 níveis / 22 ondas / 743 blocos / 1.809 XP.
- Publicado no itch.io e no sandbox da Playgama em 2026-11-12.

## Assets

- `store/covers/` — capas 1920×1080, 800×1200, 1080×1920 e 800×800.
- `store/screenshots/` — 8 capturas reais em 390×844 (menu, gameplay, laser,
  level-up, results, especiais, chefe e Endless).
- `store/video/` — previews MP4 1920×1080 e 1080×1620, 19,1 s, silenciosos.
- `public/how-to-play/` — 5 screenshots 780×468 usados no jogo.
- `public/bad-decision-games/` — logo do estúdio (WebP + PNG).

**Todos os assets de loja acima foram regenerados a partir da 0.6.1** (capas,
9 screenshots, 2 vídeos e 5 painéis How to Play). Revisão humana pendente antes
de reutilizar em portal.

## Limites

- A arte de capa é um draft de alta qualidade; o refino final é humano.
- A submissão em itch.io, GameFlare, Playgama, Y8, Lagged, Kongregate e
  CrazyGames Basic é manual.
- A tag e o GitHub Release só devem ser criados depois de teste humano e
  aprovação explícita; nenhuma foi criada.
- Revalidar as regras de cada portal na data do upload.
- A `0.6.1` está publicada no itch.io; o jogo foi aceito e publicado na
  Playgama. A `0.8.0` é a build local atual e depende de upload manual; o ZIP
  do CrazyGames é o **clean**.
- CrazyGames reprovou a 0.3.0 e a 0.4.0; a 0.5.1 foi submetida em 2026-11-11 e
  a submissão está pausada até 2026-11-26. O dono decidiu não fazer
  moldura/letterbox desktop; a 0.5.1 usa side art.
- GameFlare está bloqueada por login; a 0.6.1 não foi enviada.
- A `0.1.0-mvp` é apenas histórica.

## Histórico

Revisão G7 e validação técnica do MVP foram arquivadas em
`docs/old/release/`.
