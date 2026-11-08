# Playtest kit — M6

Protocolo para validar as metas de diversão e ritmo do §1.2 do plano. O baseline
automatizado (`npm run qa:runs`) **não substitui** este playtest: ele só mede
duração/nível/perks com um bot que dispara projéteis de debug.

## Objetivo

Responder com evidência:

- 4 de 5 pessoas completam a fase 1 em até 3 tentativas e aceitam jogar de novo?
- Run de 2–5 min, com 3–5 level ups por run?
- Pelo menos 3 arquétipos de perk escolhidos entre os participantes?
- Nenhum perk domina mais de 70% das ofertas em que apareceu?
- Controle, mira, clareza e sensação de poder são compreensíveis sem explicação?

## Amostra e logística

- **5 participantes** que nunca jogaram esta build (evitar o time).
- **3 runs por pessoa**, sessão de **20–30 min**.
- Device real: pelo menos 2 Android/Chrome, 1 iPhone/Safari, 1 desktop e
  1 aparelho de baixa memória, se possível.
- Gravar tela + áudio da sessão ou anotar em tempo real. Pedir consentimento.
- Não explicar controles. O único hint permitido é o texto da tela
  (“Tap / click / V to launch”, “Drag / mouse / arrows…”). Se a pessoa travar,
  registrar o tempo e só então responder “o que você tentou?”.

## Roteiro do facilitador

1. Abrir a build em portrait, com som ligado e save recém-resetado.
2. Ler: “Jogue como quiser; não tem resposta certa. Vou observar e cronometrar.”
3. Não demonstrar movimento, lançamento, laser ou pause.
4. Cronometrar do clique em **Play** até o primeiro lançamento.
5. Deixar até 3 tentativas na fase 1 por run; registrar cada morte/retry.
6. Ao fim de cada run, perguntar: “Jogaria de novo agora? De 1 a 5, por quê?”
7. Ao fim das 3 runs, fazer as perguntas de percepção.
8. Não corrigir a build no meio da sessão; anotar bugs com passos.

## Métricas por run (planilha)

Preencher uma linha por run. Template: `docs/qa/run-log-template.csv`.

| Campo | Como medir |
|---|---|
| `first_launch_s` | Play → primeiro lançamento (V/toque/clique) |
| `duration_s` | Play → Victory/Defeat |
| `result` | Victory / Defeat |
| `waves_cleared` | 0–3 |
| `level_ups` | popups de Level Up resolvidos |
| `perks_offered` | nomes dos 3 cards de cada oferta, separados por `;` |
| `perks_chosen` | nome escolhido em cada oferta |
| `deaths` | quedas de todas as bolas |
| `retries` | cliques em Retry |
| `score` / `level` | valores do Results |
| `intent_replay_1_5` | pergunta pós-run |
| `comments` | controle, mira, clareza, poder, confusão |

## Perguntas pós-run

1. O que você estava tentando fazer? O que aconteceu?
2. O controle respondeu como esperado? O que confundiu?
3. Você entendeu por que subiu de nível / o que o perk fez?
4. Sentiu que ficou mais forte entre a primeira e a última onda?
5. Jogaria de novo? Nota 1–5 e motivo.
6. O que cortaria ou mudaria primeiro?

## Agregação e comparação com §1.2

- **Diversão:** contar quantos dos 5 completaram a fase 1 em ≤3 tentativas e
  quantos deram intenção de repetir ≥4/5. Meta: 4 de 5.
- **Ritmo:** mediana e faixa de `duration_s`; contar `level_ups` por run.
  Meta: 120–300 s e 3–5 level ups.
- **Variedade:** arquétipos distintos escolhidos entre todos os participantes.
  Meta: ≥3. Para dominância, por perk: `escolhas / ofertas em que apareceu`;
  sinalizar >70%.
- **Técnico:** bugs por severidade (P0/P1/P2), device e passos. Cruzar com
  `docs/qa/device-matrix.md` e `docs/qa/performance.md`.
- **Escopo:** qualquer feature nova observada vira backlog, não correção no M6.

Se “diversão” ou “ritmo” falharem, reabrir M1/M2 (core/XP e perks), não M4
(apresentação), conforme §8.5.

## Baseline automatizado (não é playtest)

```bash
npm run build
npm run qa:runs -- --runs=10
```

Gera `docs/qa/run-log.csv`. Use para comparar builds e detectar regressão de
duração/nível, nunca para aprovar diversão.
