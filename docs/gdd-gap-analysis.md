# Bricklike — GDD × estado atual (2026-11-11)

Comparação entre o GDD v1.6 e o build de desenvolvimento `0.5.1` na `main`.
Itens marcados **implementado** existem no código e têm cobertura de teste ou
validação de conteúdo. Itens **pendente** são decisões/escopo ainda não
implementados, não bugs.

## Implementado

| Área | GDD | Estado |
|---|---|---|
| Tutorial | fase 0 `tutorial`, 2 ondas, 16 blocos, 32 XP, 2 level ups | implementado e validado |
| Gate do tutorial | save novo `unlockedPhase = 0`; concluir/pular libera o level 1 | implementado e testado |
| Save antigo | `unlockedPhase >= 1` continua sem repetir o tutorial | implementado e testado no parse |
| Coach marks | 5 modais pausados com Got it: mover/lançar, XP/perk, blocos especiais, chefes e Endless | implementado |
| Campanha | 6 fases, 20 ondas (2/3/3/3/4/5) | implementado e validado |
| Totais | 743 blocos / 1.809 XP com tutorial; 727 / 1.777 na campanha pura | validado |
| Blocos | 9 tipos, incluindo 6 especiais | implementado |
| Elementos | 7 tipos (wall, obstacle, deflector, portal, mover, rotor, gate) | implementado |
| Chefes | Frost Sentinel, Ember Warden, Void Herald | implementado |
| Desafios | `timeLimit` e `noLaser` | implementado |
| Zoom de layout | escala 0,68–1,0 | implementado |
| Perks | 19, com níveis e sinergias | implementado |
| Encerramentos | epílogos, rank S/A/B, final de campanha e epílogo do tutorial | implementado |
| Endless | run infinita, velocidade 660→1100, linhas 4→12, chefes a cada 5 ondas | implementado |
| Save | schema v1, `unlockedPhase` 0..6, `campaignComplete`, `endless` | implementado |
| Settings | som, música e screen shake | implementado |
| Aviso de storage | “Progress may not be saved” + popup em memória/fallback | implementado |
| Desbloqueio do Endless | ao concluir a campanha; tutorial não conta | implementado |
| Menu/seleção | Campaign/Endless, 7 cards com tutorial, fundo animado | implementado |
| How to Play | diálogo de 5 páginas com screenshots | implementado |
| About Us | logomarca e texto do estúdio | implementado |
| HUD legível | compacto em iframes estreitos | implementado |
| Controles touch | drag relativo 1:1; edge assist e ganho de swipe longo até 2,2× | implementado e testado |
| Side art desktop | arte lateral em viewport landscape; mobile portrait inalterado | implementado neste ciclo |
| CrazyGames | adapter nativo sem Playgama no host do portal | implementado neste ciclo |
| Laser | exige lançamento explícito na onda; reset bloqueia; HUD explica | implementado e testado |
| Ads | política 0.5.1 (campanha só com próxima onda e múltiplo de 3; tutorial zero; exits com 60 s) | implementado e testado |
| Ads reais | Bridge interstitial/rewarded + fallback/mock + testes | implementado |
| Direção visual dos blocos | revisão de materiais e legibilidade | implementado |
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
| Moldura/letterbox desktop | decisão | **não fazer nesta linha**; shell portrait centralizado é intencional. Risco residual em iframe desktop. |
| Editor de fases / pipeline procedural | backlog | fora do Endless |
| Backend, contas e cloud save | backlog | sem servidor próprio |
| Full Launch CrazyGames | backlog | Data/User modules, entrada direta no gameplay, progresso na conta |
| Poki, GameDistribution, Famobi | backlog | avaliar depois de retenção provada |
| Novas combinações de desafio | pendência | além de `timeLimit` e `noLaser` |
| Conteúdo além das 6 fases | não planejado no GDD | campanha fechada; Endless cobre o longo prazo |

## Pendências de validação (não são features)

| Item | Estado |
|---|---|
| Playtest humano da 0.5.1 | pendente |
| Compreensão do tutorial/skip e dos coach marks | pendente |
| Edge assist em celular real (borda, gesto do navegador) | pendente |
| Playtest humano das fases 4–6 | pendente |
| Balance dos chefes, timers e densidade | pendente |
| Playtest do Endless (ondas 5, 10, 15, 20+) | pendente |
| Legibilidade do zoom em telas pequenas reais | pendente |
| Performance em hardware real / 4 GB RAM | pendente; protocolo em `docs/qa/performance-testing.md` e script `scripts/perf-smoke.mjs` |
| Teste de save antigo no navegador | pendente (parse coberto por testes) |
| Aviso de storage em fallback real | pendente |
| Mixagem final de áudio | pendente |
| Screenshots/capas/vídeos da 0.5.1 | gerados na sessão paralela; revisão humana pendente |
| Fill/limites reais de ads na Playgama/CrazyGames | pendente |
| Playgama sandbox stats | amostra pequena (17/100 qualifying plays; 5:42; 1,70 ad/play); não concluir qualidade/retenção |
| CrazyGames | 0.3.0 e 0.4.0 reprovadas; 0.5.1 aguarda teste humano e assets novos |
| Tag e GitHub Release | pendente de decisão |
| Submissão manual nos portais | usuário |

## Leitura rápida

O GDD **não está atrasado em conteúdo de campanha**: as 6 fases, o tutorial, os
9 blocos, 7 elementos, 3 chefes, 19 perks e o Endless estão implementados. O que
falta é majoritariamente **validação humana** do novo tutorial/controles/ads,
**meta-sistemas de retenção** (metaprogressão, conquistas, leaderboards),
**distribuição** (Full Launch, novos portais, localização, landscape) e
**assets de loja da 0.5.1**. A moldura desktop foi deliberadamente descartada;
o risco de apresentação em iframe desktop continua registrado, mas não será
resolvido por letterbox nesta linha.
