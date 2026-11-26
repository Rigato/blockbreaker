# AGENTS.md — Bricklike

## Comandos

- Bateria: `npm run typecheck`, `npm test`, `npm run validate:content`,
  `node scripts/validate-bridge-config.mjs`, `npm run build`,
  `npm run test:e2e`, `npm run package`.
- Rode a bateria completa antes de mudanças em gameplay, save, conteúdo ou
  plataforma.
- `npm run build` gera **dois** targets: `dist/` (bridge) e `dist-clean/`
  (clean). `npm run package` gera `blockbreaker-web.zip` (bridge) e
  `blockbreaker-web-clean.zip` (clean) + manifestos.
- CrazyGames Basic e Kongregate recebem o ZIP **clean**; Playgama, Y8, Lagged e
  itch.io recebem o **bridge**. Nunca envie o bridge ao CrazyGames.

## Projeto

- `src/` jogo, `tests/` testes, `docs/` documentação.
- Stack: Phaser 3.90, TypeScript estrito, Vite 8, Vitest, Playwright,
  Playgama Bridge 2.4.4.
- Contexto: `docs/README.md`; consulte sob demanda. `docs/old/` é histórico.

## Regras

- Não publique, não crie tag/release nem altere o schema de save,
  `PlatformService`, catálogo de perks ou economia sem aprovação.
- Preserve: sem `if (platform)` no gameplay, sem `localStorage` direto,
  simulação em 120 Hz, ads com fallback.
- UI e metadata em inglês; respostas ao usuário em português.
- Subagentes: `opencode-go/deepseek-v4.1-flash#high`; worktrees em
  `/tmp/opencode`; sem merge/push na `main`.
