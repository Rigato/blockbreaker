# Pacote de publicação

Versão do pacote: **`0.6.1`** (local; **não publicada e não submetida**)  
Versão publicada nos portais: **`0.5.1`** (itch.io e sandbox da Playgama)  
CrazyGames: **`0.5.1` submetida** em 2026-11-11; submissão pausada até 2026-11-26  
Tag planejada: **`v0.6.1`** (não criada; depende de aprovação humana)

Este diretório reúne o material para revisão humana e submissão **manual** nos
portais. Os uploads de itch.io/Playgama e a submissão ao CrazyGames foram feitos
pelo responsável; a tag e o GitHub Release continuam manuais. A `0.6.1` não foi
enviada a nenhum portal.

## Comece por aqui

1. `docs/handoff-v0.6.1.md` — onboarding da sessão atual.
2. `docs/release/portal-metadata.md` — textos em inglês por portal.
3. `docs/release/submission-checklist.md` — campos e passos de cada portal.
4. `docs/release/status.md` — status/URLs de publicação.
5. `docs/release/crazygames-review.md` — reprovações, decisão sobre desktop e
   histórico da 0.5.1.
6. `docs/research/crazygames-feedback.md` — canais de suporte e rascunho.
7. `docs/build-release.md` — build, ZIP, CI, ads QA e runbook de tag.
8. `store/README.md` — índice dos assets de loja.

## Pacote atual (0.6.1)

- `release/blockbreaker-web.zip` — 20 arquivos, 1.517.380 bytes
  (~1.482 KiB), 3.071.123 bytes descomprimidos, maior path com 38 caracteres.
- SHA-256: `b8ded968506b34c221f0ebb5744ad0d301208838c44617689df3c1bf438bbdbd`.
- Gates: 396 testes em 32 arquivos; 37 E2E em 10 spec files; conteúdo com
  7 níveis / 22 ondas / 743 blocos / 1.809 XP.
- O hash pode mudar em um rebuild; confirme em `release/manifest.json` antes de
  qualquer upload. Nenhum portal recebeu a 0.6.1.

## Assets

- `store/covers/` — capas 1920×1080, 800×1200, 1080×1920 e 800×800.
- `store/screenshots/` — 8 capturas reais em 390×844 (menu, gameplay, laser,
  level-up, results, especiais, chefe e Endless).
- `store/video/` — previews MP4 1920×1080 e 1080×1620, 19,1 s, silenciosos.
- `public/how-to-play/` — 5 screenshots 780×468 usados no jogo.
- `public/bad-decision-games/` — logo do estúdio (WebP + PNG).

**Todos os assets de loja acima são da 0.5.1** (tutorial, fase 1 com 2 ondas,
controles touch). A revisão humana e uma eventual regeneração para a 0.6.1
continuam pendentes antes de qualquer upload.

## Limites

- A arte de capa é um draft de alta qualidade; o refino final é humano.
- A submissão em itch.io, GameFlare, Playgama e CrazyGames Basic é manual.
- A tag e o GitHub Release só devem ser criados depois de teste humano e
  aprovação explícita; nenhuma foi criada.
- Revalidar as regras de cada portal na data do upload.
- A `0.5.1` está publicada no itch.io e no sandbox da Playgama; a `0.6.1` é
  local e não foi publicada.
- CrazyGames reprovou a 0.3.0 e a 0.4.0; a 0.5.1 foi submetida em 2026-11-11 e
  a submissão está pausada até 2026-11-26. O dono decidiu não fazer
  moldura/letterbox desktop; a 0.5.1 usa side art.
- GameFlare está bloqueada por login; a 0.6.1 não foi enviada.
- A `0.1.0-mvp` é apenas histórica.

## Histórico

Revisão G7 e validação técnica do MVP foram arquivadas em
`docs/old/release/`.
