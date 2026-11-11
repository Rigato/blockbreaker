# Bricklike — GDD × estado atual (2026-11-10)

Comparação entre o GDD v1.4 e o build de desenvolvimento `0.4.0` na `main`.
Itens marcados **implementado** existem no código e têm cobertura de teste ou
validação de conteúdo. Itens **pendente** são decisões/escopo ainda não
implementados, não bugs.

## Implementado

| Área | GDD | Estado |
|---|---|---|
| Campanha | 6 fases, 21 ondas (3/3/3/3/4/5) | implementado e validado |
| Blocos | 9 tipos, incluindo 6 especiais | implementado |
| Elementos | 7 tipos (wall, obstacle, deflector, portal, mover, rotor, gate) | implementado |
| Chefes | Frost Sentinel, Ember Warden, Void Herald | implementado |
| Desafios | `timeLimit` e `noLaser` | implementado |
| Zoom de layout | escala 0,68–1,0 | implementado |
| Perks | 19, com níveis e sinergias | implementado |
| Encerramentos | epílogos, rank S/A/B, final de campanha | implementado |
| Endless | run infinita, velocidade 660→1100, linhas 4→12, chefes a cada 5 ondas | implementado |
| Save | schema v1, `unlockedPhase` 1..6, `endless` | implementado |
| Settings | som, música e screen shake | implementado neste ciclo |
| Desbloqueio do Endless | ao concluir a campanha | implementado neste ciclo |
| Menu/seleção | Campaign/Endless, fundo animado, cards temáticos | implementado neste ciclo |
| How to Play | diálogo de 5 páginas com screenshots | implementado neste ciclo |
| About Us | logomarca e texto do estúdio | implementado neste ciclo |
| HUD legível | compacto em iframes estreitos | implementado neste ciclo |
| Ads | interstitials 3/4 ondas + results e rewarded revive | implementado neste ciclo |
| Ads reais | Bridge interstitial/rewarded + fallback/mock + testes | implementado neste ciclo |
| Direção visual dos blocos | revisão de materiais e legibilidade | implementado neste ciclo |
| Inglês | UI e metadata | implementado |
| Reduced motion / budgets | partículas e trails limitados | implementado |
| Portrait | layout mobile-first | implementado |

## Pendente no GDD (backlog explícito)

| Item | GDD | Observação |
|---|---|---|
| Metaprogressão permanente | backlog | desbloqueios de conteúdo, sem bônus permanentes de atributos iniciais |
| Leaderboard do Endless | backlog | ranking global continua fora |
| Rankings globais / conquistas | backlog | dependem dos recursos dos portais |
| Mundos sci-fi/industrial | backlog | novos temas e conteúdo |
| Localização | backlog | catálogo de strings por locale antes |
| Landscape jogável | backlog | hoje só portrait + guarda de rotação |
| Moldura/letterbox desktop | pendência | HUD compacto resolveu leitura; shell 9:16 ainda centralizado |
| Editor de fases / pipeline procedural | backlog | fora do Endless |
| Backend, contas e cloud save | backlog | sem servidor próprio |
| Full Launch CrazyGames | backlog | Data/User modules, entrada direta no gameplay, progresso na conta |
| Poki, GameDistribution, Famobi | backlog | avaliar depois de retenção provada |
| Novas combinações de desafio | pendência | além de `timeLimit` e `noLaser` |
| Conteúdo além das 6 fases | não planejado no GDD | campanha fechada; Endless cobre o longo prazo |

## Pendências de validação (não são features)

| Item | Estado |
|---|---|
| Playtest humano das fases 4–6 | pendente |
| Balance dos chefes, timers e densidade | pendente |
| Playtest do Endless (ondas 5, 10, 15, 20+) | pendente |
| Legibilidade do zoom em telas pequenas reais | pendente |
| Performance em hardware real / 4 GB RAM | pendente |
| Teste de save antigo no navegador | pendente (parse coberto por testes) |
| Mixagem final de áudio | pendente |
| Screenshots/capas/vídeos atualizados para o build atual | concluído em 2026-11-10 |
| Fill/limites reais de ads na Playgama/CrazyGames | pendente |
| Tag e GitHub Release | pendente de decisão |
| Submissão manual nos portais | usuário |

## Leitura rápida

O GDD **não está atrasado em conteúdo de campanha**: as 6 fases, 9 blocos, 7
elementos, 3 chefes, 19 perks e o Endless estão implementados. O que falta é
majoritariamente **meta-sistemas de retenção** (metaprogressão, conquistas,
leaderboards, desafios), **distribuição** (Full Launch, novos portais,
localização, landscape) e **validação humana** de balance/performance. O ciclo
v0.4.0 fechou a lacuna de primeira impressão, consistência visual, HUD,
How to Play/About e ads. O próximo ciclo pode atacar retenção ou a moldura
desktop.
