# Bricklike — GDD × estado atual (2026-11-12)

Comparação entre o GDD v1.8 e o build de desenvolvimento `0.6.1` na `main`.
Itens marcados **implementado** existem no código e têm cobertura de teste ou
validação de conteúdo. Itens **pendente** são decisões/escopo ainda não
implementados, não bugs.

A `0.6.1` é **local e não publicada**. itch.io e o sandbox da Playgama seguem
com a `0.5.1`; CrazyGames está pausado até 2026-11-26; GameFlare segue bloqueado.
Nenhuma tag ou GitHub Release foi criada.

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
| Perks | 22 no catálogo (10 starters + 12 unlocks), com níveis e sinergias | implementado |
| Perks reworkadas | Momentum, Bombardier, Boss Slayer e Hot Streak | implementado e testado |
| Tier 4 | Overkill (100), Shield Bash (110) e Conductor (120, requer Prism Laser) | implementado e testado |
| Mecânica do Overkill | splash de até 2 nos quatro vizinhos ortogonais; não encadeia; explosão/link/Shield Bash não propagam | implementado e testado |
| Mecânica do Shield Bash | a cada 8 acertos no paddle, 1 de dano nas duas linhas mais baixas; não dispara Overkill | implementado e testado |
| Mecânica do Conductor | laser encadeia uma vez para vizinho ainda não atingido, 50% do dano (mín. 1) | implementado e testado |
| Pool inicial | 10 starters: Multiball, Wide Paddle, Power Ball, Quick Study, Arcane Turret, Giant Ball, Safety Net, Prism Laser, Foresight e Critical Strike | implementado |
| Unlocks | 12 perks bloqueadas em 4 tiers (12–120 Sparks) | implementado |
| Economia por onda | `1 + floor(blocos destruídos / 12)` + marcos de combo 5/10/15 (+1 cada, máx. +3) | implementado e testado |
| Economia de fase | +3 por chefe, +6 por clear e +6 extra no first clear | implementado e testado |
| Teto | 250 Sparks por run | implementado e testado |
| Anti-farm | onda/combo/chefe pagam uma vez por onda por run; retry é suprimido | implementado e testado |
| HUD de Sparks | chip da run com pulso e toast `+N Sparks · motivo` | implementado e testado |
| Results | total `+X Sparks · total Y` e breakdown por waves/bosses/clear/first clear/combo | implementado e testado |
| Metaprogressão | horizontal, sem bônus permanentes de atributos | implementado |
| Workshop | card no menu com ícone, saldo, badge, `X / 22 unlocked`, `N left` e barra; diálogo com 4 tiers e 12 cards | implementado e testado |
| Ofertas filtradas | perks bloqueadas nunca aparecem; compradas entram na pool; Conductor exige Prism Laser | implementado e testado |
| Save v2 | `version: 2`, `meta: { sparks, unlocks }`, migração v1→v2; inalterado na 0.6.1 | implementado e testado |
| Encerramentos | epílogos, rank S/A/B, final de campanha e epílogo do tutorial | implementado |
| Endless | run infinita, velocidade 660→1100, linhas 4→12, chefes a cada 5 ondas | implementado |
| Save de campanha | `unlockedPhase` 0..6, `campaignComplete`, `endless`, `phases` | implementado |
| Settings | som, música e screen shake | implementado |
| Aviso de storage | “Progress may not be saved” + popup em memória/fallback | implementado |
| Desbloqueio do Endless | ao concluir a campanha; tutorial não conta | implementado |
| Menu/seleção | Campaign/Endless, 7 cards com tutorial, fundo animado, card do Workshop | implementado |
| How to Play | diálogo de 5 páginas com screenshots | implementado |
| About Us | logomarca e texto do estúdio | implementado |
| HUD legível | compacto em iframes estreitos | implementado |
| Controles touch | drag relativo 1:1; edge assist e ganho de swipe longo até 2,2× | implementado e testado |
| Side art desktop | arte lateral em viewport landscape; mobile portrait inalterado | implementado |
| CrazyGames | adapter nativo sem Playgama no host do portal | implementado |
| Laser | exige lançamento explícito na onda; reset bloqueia; HUD explica | implementado e testado |
| Ads | política 0.5.1 mantida (campanha só com próxima onda e múltiplo de 3; tutorial zero; exits com 60 s) | implementado e testado |
| Ads reais | Bridge interstitial/rewarded + fallback/mock + testes | implementado |
| Direção visual dos blocos | revisão de materiais e legibilidade | implementado |
| Inglês | UI e metadata | implementado |
| Reduced motion / budgets | partículas e trails limitados | implementado |
| Portrait | layout mobile-first | implementado |

## Pendente no GDD (backlog explícito)

| Item | GDD | Observação |
|---|---|---|
| Bônus permanentes de atributos | fora do escopo | a meta da 0.6.1 é horizontal; poder permanente continua descartado |
| Cosméticos e desafios com recompensa | backlog | planejados para depois da camada atual de meta |
| Reroll e ban de perk | backlog | não implementar sem antes medir a pool atual |
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
| Playtest humano da 0.6.1 | pendente |
| Compreensão do tutorial/skip e dos coach marks | pendente |
| Edge assist em celular real (borda, gesto do navegador) | pendente |
| Playtest humano das fases 4–6 | pendente |
| Balance dos chefes, timers e densidade | pendente |
| Playtest do Endless (ondas 5, 10, 15, 20+) | pendente |
| Economia de Sparks e tempo até o primeiro unlock | pendente; calibrar fórmula, clear/first clear e teto 250 |
| Anti-farm em retry de onda | pendente em sessão real; coberto por unidade/E2E |
| Balance de Momentum, Bombardier, Boss Slayer e Hot Streak | pendente |
| Balance de Overkill, Shield Bash e Conductor | pendente; validar a sinergia Conductor + Prism Laser |
| Migração de save v1→v2 em navegador real | pendente (parse coberto por testes); schema v2 não mudou na 0.6.1 |
| Workshop em iframe de portal | pendente (E2E cobre 320/390 e desktop) |
| Card do Workshop em desktop/portal | pendente; barra, contagem e badge cobertos em 320/390 |
| Legibilidade do zoom em telas pequenas reais | pendente |
| Performance em hardware real / 4 GB RAM | pendente; protocolo em `docs/qa/performance-testing.md` e script `scripts/perf-smoke.mjs` |
| Aviso de storage em fallback real | pendente |
| Mixagem final de áudio | pendente |
| Screenshots/capas/vídeos da 0.6.1 | os atuais são da 0.5.1; revisão/regeneração pendente |
| Fill/limites reais de ads na Playgama/CrazyGames | pendente |
| Playgama sandbox stats | amostra pequena (17/100 qualifying plays; 5:42; 1,70 ad/play); não concluir qualidade/retenção |
| CrazyGames | 0.3.0 e 0.4.0 reprovadas; 0.5.1 submetida em 2026-11-11; submissão pausada até 2026-11-26 |
| Tag e GitHub Release | nenhuma criada; decisão humana pendente |
| Submissão manual nos portais | 0.6.1 não submetida; usuário |

## Leitura rápida

O GDD v1.8 e o build **estão alinhados em conteúdo de campanha**: as 6 fases, o
tutorial, os 9 blocos, 7 elementos, 3 chefes, 22 perks e o Endless estão
implementados. A `0.6.0` fechou a lacuna de **metaprogressão horizontal** com 10
starters, 9 unlocks, Sparks, Workshop e save v2. A `0.6.1` completou o **Tier 4**
com Overkill, Shield Bash e Conductor, levou o catálogo a 12 unlocks em quatro
tiers, reformulou a **economia de Sparks** (fórmula por onda, combo, clear/first
clear, teto 250 e anti-farm), adicionou **chip/toast no HUD**, **breakdown nos
results** e promoveu o **Workshop** a card com contagem e progresso. Tudo isso
está no código e coberto por testes.

O que falta é majoritariamente **validação humana** do Tier 4, da economia e do
card do Workshop, **distribuição** (publicar a 0.6.1, retomar CrazyGames após
2026-11-26, resolver GameFlare) e **assets de loja da 0.6.1**. A moldura desktop
foi deliberadamente descartada; o risco de apresentação em iframe desktop
continua registrado, mas não será resolvido por letterbox nesta linha.
