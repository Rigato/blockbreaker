# Status de publicação — Bricklike

Versão publicada: **`0.1.0-mvp`** (congelada)  
Desenvolvimento atual: **`0.3.0-dev`** — modo **Endless** em desenvolvimento (não publicado)  
Atualizado em: 2026-11-09  
Responsável pela submissão: **usuário (manual)**

Este arquivo é o registro pós-G7. Preencha a tabela depois de cada upload e
guarde a URL pública e a data. O itch.io recebeu o build `0.1.0-mvp`; a v0.2.0
(campanha) e a v0.3.0 (Endless) continuam em desenvolvimento e não foram enviadas
aos portais.

## Modo Endless

- **Status:** em desenvolvimento na v0.3.0; **não publicado** em nenhum portal.
- Uma run infinita separada da campanha, com velocidade 660→1100, linhas 4→12 e
  chefes a cada 5 ondas.
- Save v1 ganha `endless: { bestWave, bestScore, runs }`; a campanha não muda.
- A publicação depende da conclusão da E5 e de revisão humana; o build
  `0.1.0-mvp` do itch.io permanece congelado.

## Portais

| Portal | Status | URL pública | Data do upload | Review / observação |
|---|---|---|---|---|
| itch.io | **publicado `0.1.0-mvp`** | — | — | build congelado; v0.2.0/v0.3.0 (Endless) não publicadas |
| GameFlare | não submetido | — | — | — |
| Playgama | não submetido | — | — | review ~24 h |
| CrazyGames Basic | não submetido | — | — | acompanhar 7 dias / 500 plays |

## Checklist rápido pós-upload

- [ ] ZIP final é o mesmo nos quatro portais (hash do `manifest.json`).
- [ ] Título **Bricklike** consistente em todos.
- [ ] Descrição, controles e tags revisados.
- [ ] Capas e vídeo aprovados por humanos.
- [ ] itch.io com Mobile Friendly ligado e modelo de doação.
- [ ] GameFlare sem SDK/ads internos.
- [ ] Playgama com `game_ready`, storage e interstitial funcionando.
- [ ] CrazyGames como **Basic Launch**, não Full Launch.
- [ ] Nenhum portal recebeu a URL com `?debug=1` ou `?resetSave=1`.

## Acompanhamento pós-launch

- Registrar plays/feedback aos 7 dias.
- CrazyGames Basic: avaliar se atingiu 500 plays antes de discutir Full Launch.
- Não iniciar Full Launch, Poki, GameDistribution ou Famobi neste MVP.
- Revalidar regras dos portais antes de cada novo upload.
