# AGENTS.md — Bricklike

## Comandos

- Bateria: `npm run typecheck`, `npm test`, `npm run validate:content`,
  `node scripts/validate-bridge-config.mjs`, `npm run build`,
  `npm run test:e2e`, `npm run package`.
- Rode a bateria completa antes de mudanças em gameplay, save, conteúdo ou
  plataforma.

## Projeto

- `src/` jogo, `tests/` testes, `docs/` documentação.
- Stack: Phaser 3.90, TypeScript estrito, Vite 8, Vitest, Playwright,
  Playgama Bridge 2.4.1.
- Contexto: `docs/README.md`; consulte sob demanda. `docs/old/` é histórico.

## Regras

- Não publique, não crie tag/release nem altere o schema de save,
  `PlatformService`, catálogo de perks ou economia sem aprovação.
- Preserve: sem `if (platform)` no gameplay, sem `localStorage` direto,
  simulação em 120 Hz, ads com fallback.
- UI e metadata em inglês; respostas ao usuário em português.
- Subagentes: `opencode-go/deepseek-v4.1-flash#high`; worktrees em
  `/tmp/opencode`; sem merge/push na `main`.
