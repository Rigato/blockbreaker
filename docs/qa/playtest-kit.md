# Playtest kit — Bricklike v0.6.1

Protocolo para validar diversão, ritmo e balance do tutorial, da campanha
(fases 1–6) e do Endless. O baseline automatizado (`npm run qa:runs`) **não
substitui** este playtest: ele só mede duração/nível/perks com um bot que
dispara projéteis de debug. **Ainda não há resultado de playtest humano da
0.6.1**; este documento é o protocolo, não um relatório.

## Objetivo

Responder com evidência:

- Novos jogadores entendem mover/lançar com o **tutorial in-game** e os coach
  marks, e o skip é claro?
- O tutorial é curto o bastante e ensina XP/perk e bloco especial sem travar?
- 4 de 5 pessoas completam a fase 1 (2 ondas) em até 3 tentativas e aceitam
  jogar de novo?
- Run de 2–5 min, com 3–5 level ups por run nas fases iniciais?
- Pelo menos 3 arquétipos de perk escolhidos entre os participantes?
- Nenhum perk domina mais de 70% das ofertas em que apareceu?
- Fases 2–6 e Endless têm timers, densidade, chefes e velocidade justos?
- O **edge assist** do toque ajuda a alcançar as bordas sem gesto acidental do
  navegador, sem deixar o centro sensível demais?
- O laser bloqueado até o lançamento é compreensível (“Launch the ball first”)?
- A política de ads (tutorial sem ads; campanha só em onda múltipla de 3;
  Endless a cada 4; exits com 60 s) parece natural, não abusiva?
- O aviso “Progress may not be saved” é notado e entendido em fallback?
- O card do **Workshop** é descoberto no menu, a contagem `X / 22` e a barra
  fazem sentido, os custos em Sparks parecem justos e a primeira compra
  acontece em 1–2 runs?
- As perks reworkadas (**Momentum**, **Bombardier**, **Boss Slayer** e **Hot
  Streak**) são compreendidas e parecem úteis?
- As três perks **Tier 4** (**Overkill**, **Shield Bash** e **Conductor**) são
  compreendidas e parecem úteis? Conductor + Prism Laser é percebido?
- O **chip/toast de Sparks** no HUD e o **breakdown nos results** são notados
  sem poluir a tela?
- A economia (fórmula por onda, combo, chefe, clear e teto de 250) recompensa
  sem parecer grind ou farm? O retry de uma onda premiada é entendido?

## Amostra e logística

- **5 participantes** que nunca jogaram esta build (evitar o time).
- **3 runs por pessoa**, sessão de **25–35 min** (o tutorial adiciona tempo).
- Device real: pelo menos 2 Android/Chrome, 1 iPhone/Safari, 1 desktop e
  1 aparelho de baixa memória, se possível.
- Gravar tela + áudio da sessão ou anotar em tempo real. Pedir consentimento.
- Não explicar controles. O único hint permitido é o texto da tela, o tutorial
  e o **How to Play**. Se a pessoa travar, registrar o tempo e só então
  responder “o que você tentou?”.

## Roteiro do facilitador

1. Abrir a build em portrait, com som ligado e save recém-resetado.
2. Ler: “Jogue como quiser; não tem resposta certa. Vou observar e cronometrar.”
3. Não demonstrar movimento, lançamento, laser, skip ou pause.
4. Deixar o tutorial acontecer; anotar se a pessoa lê os coach marks, se pula e
   quanto tempo leva até o primeiro lançamento.
5. Cronometrar do clique em **Campaign → Tutorial/Play** até o primeiro
   lançamento e até o fim do tutorial.
6. Deixar até 3 tentativas na fase 1 por run; registrar cada morte/retry.
7. Ao fim de cada run, perguntar: “Jogaria de novo agora? De 1 a 5, por quê?”
8. Ao fim das 3 runs, fazer as perguntas de percepção.
9. Registrar reação à política de ads (interstitial de onda, exit ad e revive
   rewarded) e se parecem naturais.
10. Em um aparelho com storage em memória/fallback, observar o aviso e o popup.
11. Não corrigir a build no meio da sessão; anotar bugs com passos.

## Métricas por run (planilha)

Preencher uma linha por run. Template: `docs/qa/run-log-template.csv`.

| Campo | Como medir |
|---|---|
| `first_launch_s` | Play/tutorial → primeiro lançamento (V/toque/clique) |
| `tutorial_s` | início do tutorial → conclusão ou skip |
| `tutorial_skipped` | sim/não |
| `duration_s` | Play → Victory/Defeat (excluir pausa/ads) |
| `result` | Victory / Defeat |
| `waves_cleared` | 0–2 (tutorial), 0–20 (campanha) ou onda alcançada (Endless) |
| `phase` | Tutorial, fase inicial ou Endless |
| `ads_seen` | interstitials e revive offer vistos |
| `level_ups` | popups de Level Up resolvidos |
| `perks_offered` | nomes dos 3 cards de cada oferta, separados por `;` |
| `perks_chosen` | nome escolhido em cada oferta |
| `deaths` | quedas de todas as bolas |
| `retries` | cliques em Retry |
| `score` / `level` | valores do Results |
| `intent_replay_1_5` | pergunta pós-run |
| `comments` | controle, mira, clareza, poder, confusão, edge assist |

## Perguntas pós-run

1. O que você estava tentando fazer? O que aconteceu?
2. O controle respondeu como esperado? O que confundiu? Nas bordas, o paddle
   chegou onde você queria?
3. Você entendeu por que subiu de nível / o que o perk fez?
4. O tutorial ajudou ou atrapalhou? Você chegou a considerar pular? Por quê?
5. Sentiu que ficou mais forte entre a primeira e a última onda?
6. Jogaria de novo? Nota 1–5 e motivo.
7. O que cortaria ou mudaria primeiro?

## Agregação e comparação com §1.2

- **Tutorial:** mediana de `tutorial_s`, taxa de skip, quantos completaram sem
  ajuda e quantos entenderam os cinco coach marks. Meta inicial: tutorial ≤ 90 s
  e skip compreendido; ajustar após os dados.
- **Diversão:** contar quantos dos 5 completaram a fase 1 (2 ondas) em ≤3
  tentativas e quantos deram intenção de repetir ≥4/5. Meta: 4 de 5.
- **Ritmo:** mediana e faixa de `duration_s`; contar `level_ups` por run.
  Meta: 120–300 s e 3–5 level ups.
- **Variedade:** arquétipos distintos escolhidos entre todos os participantes.
  Meta: ≥3. Para dominância, por perk: `escolhas / ofertas em que apareceu`;
  sinalizar >70%.
- **Sparks e Workshop:** registrar no comments o saldo ao fim de cada run, a
  compra feita e o tempo até o primeiro unlock; nas sessões seguintes, medir a
  descoberta do card e da contagem `X / 22`. Meta inicial: primeiro unlock em
  1–2 runs, sem bater no teto de 250.
- **Tier 4:** registrar se Overkill, Shield Bash e Conductor foram comprados,
  entendidos e percebidos em jogo; sinalizar texto confuso ou custo alto demais.
- **Técnico:** bugs por severidade (P0/P1/P2), device e passos. Cruzar com o
  device matrix/performance arquivados em `docs/old/qa/` quando aplicável.
- **Controles:** registrar se o edge assist causou overshoot, se o centro ficou
  sensível demais e se o gesto de borda do navegador ainda apareceu.
- **Ads:** registrar se interstitial/revive interrompeu o fluxo, se o mute
  funcionou e se a recompensa foi entregue. Comparar a frequência observada com
  a política (tutorial 0; campanha só fase 5/6 após onda 3; Endless a cada 4).
- **Storage:** registrar se o aviso apareceu e se o popup foi compreendido.
- **Escopo:** qualquer feature nova observada vira backlog, não correção no
  playtest.

Se “diversão” ou “ritmo” falharem, reabrir balance de XP/perks ou densidade das
ondas, não a apresentação.

## Status dos dados

- **Nenhum playtest humano da 0.6.1 foi registrado ainda.** As metas acima são
  critérios de aceite, não resultados.
- A amostra do sandbox da Playgama (0.4.0) é pequena: 17/100 qualifying plays,
  avg play time 5:42, ad shows/play 1,70, 116 launches, 31 plays, 5m45s, 3/2
  likes. Não use essa amostra como playtest nem como conclusão de retenção.
- Performance tem protocolo separado em `docs/qa/performance-testing.md` e
  script `scripts/perf-smoke.mjs`; resultados da 0.6.1 pendentes.

## Baseline automatizado (não é playtest)

```bash
npm run build
npm run qa:runs -- --runs=10
```

Gera `docs/qa/run-log.csv`. Use para comparar builds e detectar regressão de
duração/nível, nunca para aprovar diversão.
