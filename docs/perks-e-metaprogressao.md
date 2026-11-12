# Perks e metaprogressão — desenho v0.6.0

**Status:** proposta aprovada para implementação  
**Data:** 2026-11-12  
**Escopo:** revisão do catálogo de perks e primeira camada de
metaprogressão horizontal (Sparks + Workshop). Não inclui novo mundo.

## 1. Objetivos

1. Dar motivação de médio prazo sem transformar o jogo em grind.
2. Aumentar retenção entre runs sem criar poder permanente que trivialize a
   campanha.
3. Corrigir perks fracas, redundantes ou armadilhas.
4. Manter a primeira run compreensível e divertida.
5. Preservar a arquitetura atual: perks continuam vindo do catálogo fixo e o
   save continua sem run ativa.

## 2. Princípios

- **Metaprogressão horizontal:** desbloqueia conteúdo, não bônus permanentes de
  atributos.
- **Nenhuma perk é armadilha:** toda escolha deve ter um uso ou uma sinergia
  clara.
- **Pool inicial enxuto, mas não pobre:** 10 perks iniciais, com níveis
  suficientes para uma run completa.
- **Bloqueio com objetivo visível:** toda perk bloqueada aparece no Workshop com
  custo e descrição.
- **Sem ads no meta:** Sparks vêm de jogar, não de assistir anúncio.
- **Sem loot box:** desbloqueios são determinísticos.
- **Sem poder permanente:** nada de “+10% de dano para sempre”.

## 3. Catálogo atual — veredito

| Perk | Papel | Veredito | Ação |
|---|---|---|---|
| Multiball | Ofensa/board | Assinatura; +1 bola é muito forte | Manter |
| Wide Paddle | Controle | Segurança mobile; +36% no máximo | Manter |
| Power Ball | Dano | Baseline simples e confiável | Manter |
| Quick Study | Economia | Forte; pode snowballar | Manter; monitorar |
| Arcane Turret | Dano automático | Boa para mobile/atenção dividida | Manter |
| Giant Ball | Controle | +30% de raio; consistência | Manter |
| Sticky Paddle | Controle | Nicho; pode confundir com multiball | Bloquear; clarear texto |
| Safety Net | Defesa | Forte no Endless | Manter |
| Prism Laser | Dano ativo | Assinatura; exige lançamento | Manter |
| Foresight | Informação | Ótima para novos jogadores | Manter; priorizar early |
| Explosive Core | AoE | Boa em ondas densas | Bloquear (Tier 1) |
| Critical Strike | Dano RNG | OK; 24% no máximo | Manter |
| Laser Focus | Sinergia laser | Boa; depende do laser | Bloquear (Tier 3) |
| Overcharge | Sinergia laser | Boa; depende do laser | Bloquear (Tier 3) |
| Combo Master | Economia/score | Fraca/win-more | Rework → Momentum |
| Second Chance | Defesa | Muito forte; revive extra | Bloquear (Tier 1) |
| Bomb Ball | AoE | Redundante com Explosive Core | Rework → Bombardier |
| Boss Bane | Tech de chefe | Estreita demais | Rework → Boss Slayer |
| Swift Ball | Risco/recompensa | Armadilha: velocidade é ruim | Rework → Hot Streak |

**Resumo:** 10 mantidas, 4 reworks, 9 bloqueadas. Nenhuma remoção nesta versão.

## 4. Pool inicial e pool bloqueado

### 4.1 Starter — 10 perks

| Perk | Papel |
|---|---|
| Multiball | Ofensa/board |
| Wide Paddle | Controle |
| Power Ball | Dano |
| Quick Study | Economia |
| Arcane Turret | Dano automático |
| Giant Ball | Controle |
| Safety Net | Defesa |
| Prism Laser | Dano ativo |
| Foresight | Informação/onboarding |
| Critical Strike | Dano RNG |

**Níveis máximos somados:** 24. Uma campanha completa gera ~22 level-ups; o
fallback só aparece no fim de uma run excepcionalmente longa.

**Por que essas:** entregam controle, dano, defesa, economia e uma assinatura
(Multiball/Prism Laser) sem exigir que o jogador entenda sinergias complexas.
Foresight ajuda o onboarding; Safety Net dá margem para erro.

### 4.2 Bloqueadas — 9 perks atuais

| Perk | Tier | Custo | Motivo |
|---|---|---:|---|
| Second Chance | 1 | 12 | Defesa forte; primeira compra desejável |
| Explosive Core | 1 | 15 | AoE divertida; abre uma build nova |
| Sticky Paddle | 1 | 18 | Controle avançado; bom objetivo inicial |
| Momentum | 2 | 35 | Perk de skill; recompensa combo |
| Bombardier | 2 | 40 | AoE com mira; build de explosão |
| Boss Slayer | 2 | 45 | Tech de chefe; objetivo de médio prazo |
| Laser Focus | 3 | 65 | Aprofunda a build de laser |
| Overcharge | 3 | 65 | Aprofunda a build de laser |
| Hot Streak | 3 | 75 | Risco/recompensa; build de combo |

### 4.3 Novas perks planejadas — Tier 4

| Perk | Efeito | Custo |
|---|---|---:|
| Overkill | Dano excedente ao destruir um bloco espalha para adjacentes | 100 |
| Shield Bash | A cada 8 acertos no paddle, onda de choque danifica blocos próximos | 110 |
| Conductor | Laser salta para um bloco adjacente com 50% do dano | 120 |

Essas três entram depois da primeira camada de meta; o Workshop pode mostrar
“Coming soon” sem quebrar a economia.

## 5. Reworks

### 5.1 Combo Master → Momentum

**ID:** `momentum`  
**Tipo:** repeatable, max 3

Hits consecutivos em blocos aumentam dano e XP. Reseta quando a bola toca o
paddle.

| Nível | Dano por hit | Cap de dano | XP por hit | Cap de XP |
|---:|---:|---:|---:|---:|
| 1 | +1% | +5% | +2% | +10% |
| 2 | +1% | +10% | +2% | +20% |
| 3 | +1% | +15% | +2% | +30% |

**Por quê:** transforma uma perk de score passiva em uma perk de skill que
recompensa manter a bola viva e acertando.

### 5.2 Bomb Ball → Bombardier

**ID:** `bombardier`  
**Tipo:** unique

A cada 12 blocos destruídos, a **próxima batida em bloco** detona uma explosão
3×3 (2 de dano no centro, 1 na área). A carga é consumida no próximo hit.

**Por quê:** dá agência (“guardar” a carga para uma formação densa) e diferencia
de Explosive Core, que explode automaticamente a cada 8 blocos.

### 5.3 Boss Bane → Boss Slayer

**ID:** `boss_slayer`  
**Tipo:** unique

A cada 10 blocos destruídos, o **próximo acerto no chefe** causa +3 de dano. O
contador zera depois do acerto.

**Por quê:** liga o combate normal à luta contra o chefe e cria uma decisão de
timing. Deixa de ser um stat passivo e estreito.

### 5.4 Swift Ball → Hot Streak

**ID:** `hot_streak`  
**Tipo:** repeatable, max 2

Depois de 5 acertos consecutivos em blocos, a bola ganha dano bonus por 3 s.
Cada novo acerto renova o timer.

| Nível | Dano bonus | Duração |
|---:|---:|---:|
| 1 | +1 | 3 s |
| 2 | +2 | 3 s |

**Por quê:** mantém o risco/recompensa de combo, mas troca “velocidade permanente
ruim” por uma janela temporária de poder.

## 6. Economia de Sparks

### 6.1 Ganho

| Evento | Sparks |
|---|---:|
| Onda concluída | +1 |
| Chefe derrotado | +3 |
| Primeira conclusão de fase | +5 |
| Desafio concluído | +2 (futuro) |
| Teto por run | 30 |

Uma campanha completa rende ~29 Sparks; uma run curta de 5 ondas rende ~5.
Primeiro unlock desejado: 1–2 runs.

### 6.2 Custos

- Tier 1: 12–18
- Tier 2: 35–45
- Tier 3: 65–75
- Tier 4: 100–120

### 6.3 Regras

- Sparks são salvos no save, não na run.
- Não há compra de vantagem permanente.
- Não há Sparks por ad.
- O jogador pode acumular e comprar na ordem que quiser dentro do tier.
- Não há refund nesta versão.

## 7. Save v2

```text
SaveV2 {
  version: 2
  unlockedPhase: 0..6
  phases: Record<string, PhaseStats>
  endless: { bestWave, bestScore, runs }
  campaignComplete: boolean
  meta: {
    sparks: number
    unlocks: string[]   // ids de perks compradas
  }
  updatedAt: number
}
```

Migração de v1:

- `sparks = 0`
- `unlocks = []`
- starter é implícito; não precisa gravar as 10 iniciais.
- preservar `unlockedPhase`, `phases`, `endless`, `campaignComplete`.
- save corrompido/desconhecido cai em default seguro.

## 8. Workshop

- Botão/strip no menu com **Sparks** e badge quando há algo comprável.
- Diálogo com cards por tier: nome, descrição, custo, estado
  (locked/owned/affordable).
- Compra: debita Sparks, grava unlock, emite `meta:changed`, atualiza menu.
- Perks bloqueadas aparecem no Codex/Workshop com “Como desbloquear”.
- Sem preview jogável obrigatório nesta versão; descrição e ícone bastam.
- No results: “Sparks +X” e total.

## 9. Ofertas

- `RunState` recebe o conjunto de perks desbloqueadas no início da run.
- Ofertas filtram perks bloqueadas, maxed e pré-requisitos.
- Fallback `Arcane Insight` continua como válvula.
- P1 futuro: oferta por categoria (dano/controle/utilidade) e reroll.
- Não implementar ban de perk nesta versão.

## 10. Métricas

- pick rate por perk;
- win rate por perk;
- taxa de fallback;
- tempo até o primeiro unlock;
- Sparks por run;
- unlocks por jogador em 7 dias;
- D1/retorno no dashboard da Playgama;
- duração média da run.

## 11. Fora de escopo

- Novo mundo/fases.
- Cosméticos e desafios (planejados para depois).
- Reroll e ban de perk.
- Leaderboards e conquistas.
- Poder permanente.
- Alterar a curva de XP ou o combate base.

## 12. Riscos

| Risco | Mitigação |
|---|---|
| Primeira run pobre | 10 starters, 24 níveis, Foresight + Safety Net |
| Unlock fraco decepciona | reworks antes de bloquear |
| Economia lenta | primeiro unlock em 1–2 runs; teto 30 |
| Economia rápida | custos T2/T3 altos; medir |
| Perk bloqueada parece bug | Workshop visível e Codex com estado |
| Save antigo quebra | migração v1→v2 + testes |
| Meta vira grind | sem poder permanente; teto por run |
