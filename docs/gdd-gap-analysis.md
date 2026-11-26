# Bricklike — GDD × estado atual (2026-11-24)

Comparação entre o GDD v1.14 e o build de desenvolvimento `0.7.2` na `main`.
Itens marcados **implementado** existem no código e têm cobertura de teste ou
validação de conteúdo. Itens **pendente** são decisões/escopo ainda não
implementados, não bugs.

A `0.6.1` foi publicada no itch.io em 2026-11-12; não há tag nem GitHub
Release. O jogo foi **aceito e publicado no catálogo da Playgama**; a
atualização da build para a `0.7.1` entrou em auto-certificação em 2026-11-26 e
reprovou o SDK desatualizado. A **v0.7.2** (2026-11-26) atualiza o Playgama
Bridge para **2.4.4** e corrige o ímã do último bloco do tutorial; está
implementada localmente, sem publicação.

## Implementado

| Área | GDD | Estado |
|---|---|---|
| Tutorial | fase 0 `tutorial`, 2 ondas, 12 blocos, 15 XP, 1 level up | implementado e validado |
| Gate do tutorial | save novo `unlockedPhase = 0`; concluir/pular libera o level 1 | implementado e testado |
| Save antigo | `unlockedPhase >= 1` continua sem repetir o tutorial | implementado e testado no parse |
| Coach marks | 2 modais pausados com Continue: mover/lançar e blocos especiais | implementado |
| Assistências do tutorial | paddle 2×; ímã do último bloco com anel/tether | implementado e testado |
| Ímã do último bloco | taxa de giro adaptativa perto do alvo impede órbita estável | implementado e testado |
| Playgama Bridge | SDK 2.4.4, runtime vendorizado e config validada | implementado e validado |
| Feedback de dano | bola branco → amarelo → laranja → vermelho → roxo; glow/rastro na cor | implementado |
| Giant Ball | +40% de raio por nível, máx. 2 (+80%) | implementado |
| Pierce | hit da bola com excesso ≥ 1 atravessa; igual/menor quica | implementado e testado |
| Feedback de pierce | evento, SFX, anel/partículas na cor do dano | implementado |
| Campanha | 6 fases, 20 ondas (2/3/3/3/4/5) no Mundo I | implementado e validado |
| Mundos II/III | Neon Lattice 6 fases/22 ondas; Rustwake 6 fases/27 ondas | implementado e validado |
| Totais | 2.781 blocos / 9.392 XP; 19 fases / 71 ondas com tutorial | validado |
| Save v3 | `unlockedPhase` 0..18; migração v1/v2→v3 | implementado e testado |
| Blocos novos | alloy, bastion, entangled, relay, phased, plated, fused, splitting | implementado e testado |
| Elementos novos | press, belt, rail | implementado e testado |
| Regras novas | noMultiball, gust | implementado e testado |
| Chefes novos | Nullframe Warden, Maglev Dreadnought, Lattice Hierophant, Boiler Matron, The Riveter, The Last Engine | implementado e testado |
| Mapas multi-mundo | um mapa por mundo, pílulas I/II/III | implementado e E2E |
| Debug de ondas | todas as fases/mundos em `?debug=1` + seletor de onda | implementado e E2E |
| Clear de mundo | +30 Sparks no primeiro clear da fase final | implementado |
| Blocos | 9 tipos, incluindo 6 especiais | implementado |
| Elementos | 7 tipos (wall, obstacle, deflector, portal, mover, rotor, gate) | implementado |
| Chefes | Frost Sentinel, Ember Warden, Void Herald | implementado |
| Desafios | `timeLimit`, `noLaser`, `noMultiball` e `gust` | implementado |
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
| Save v3 | `version: 3`, `unlockedPhase` 0..18, migração v1/v2→v3 | implementado e testado |
| Encerramentos | epílogos, rank S/A/B, final de campanha e epílogo do tutorial | implementado |
| Endless | run infinita, velocidade 660→1100, linhas 4→12, chefes a cada 5 ondas | implementado |
| Save de campanha | `unlockedPhase` 0..6, `campaignComplete`, `endless`, `phases` | implementado |
| Settings | som, música e screen shake | implementado |
| Aviso de storage | “Progress may not be saved” + popup em memória/fallback | implementado |
| Desbloqueio do Endless | ao concluir a campanha; tutorial não conta | implementado |
| Menu/seleção | Campaign/Endless, mapas por mundo com 19 fases, fundo animado, card do Workshop | implementado |
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
| Mundo IV | backlog | próximo tema; Mundos II/III já implementados |
| Localização | backlog | catálogo de strings por locale antes |
| Landscape jogável | backlog | hoje só portrait + guarda de rotação |
| Moldura/letterbox desktop | decisão | **não fazer nesta linha**; shell portrait centralizado é intencional. Risco residual em iframe desktop. |
| Editor de fases / pipeline procedural | backlog | fora do Endless |
| Backend, contas e cloud save | backlog | sem servidor próprio |
| Full Launch CrazyGames | backlog | Data/User modules, entrada direta no gameplay, progresso na conta |
| Poki, GameDistribution, Famobi | backlog | avaliar depois de retenção provada |
| Novas combinações de desafio | parcial | noMultiball e gust implementados; avaliar novas regras |
| Conteúdo além dos 3 mundos | backlog | campanha atual fechada em 18 fases; Mundos II/III implementados |

## Pendências de validação (não são features)

| Item | Estado |
|---|---|
| Playtest humano da 0.6.1 | básico concluído em 2026-11-12; aprofundar Tier 4, economia e Workshop |
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
| Screenshots/capas/vídeos da 0.6.1 | regenerados; revisão humana pendente antes de reutilizar |
| Fill/limites reais de ads na Playgama/CrazyGames | pendente |
| Playgama sandbox stats | amostra pequena (17/100 qualifying plays; 5:42; 1,70 ad/play); não concluir qualidade/retenção |
| CrazyGames | 0.3.0 e 0.4.0 reprovadas; 0.5.1 submetida em 2026-11-11; submissão pausada até 2026-11-26 |
| Tag e GitHub Release | nenhuma criada; decisão humana pendente |
| Submissão manual nos portais | 0.6.1 publicada no itch.io; jogo aceito na Playgama; CrazyGames e GameFlare pendentes |

## Leitura rápida

O GDD v1.14 e o build local **estão alinhados**: 19 fases (tutorial + 3 mundos),
71 ondas, 17 blocos, 10 elementos, 9 chefes, 22 perks, Endless, save v3 e
metaprogressão horizontal. A `0.7.2` é um patch sobre a `0.7.1`: atualiza o
Playgama Bridge para 2.4.4 (exigido pela auto-certificação) e corrige o ímã do
último bloco do tutorial. Tudo está coberto por **431 testes unitários** + 43
E2E.

O que falta é majoritariamente **validação humana** das 69 ondas de campanha,
dos 6 chefes novos, do balance de Spark e do feel de belt/rail/gust, além de
**distribuição** (itch.io na 0.6.1; Playgama aceito com a 0.7.1 em
auto-certificação; a 0.7.2 precisa de upload manual) e **revisão de assets de
loja**. A moldura desktop foi deliberadamente descartada; o risco de
apresentação em iframe desktop continua registrado, mas não será resolvido por
letterbox nesta linha.
