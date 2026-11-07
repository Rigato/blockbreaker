# GDD Block Breaker Roguelite

**Documento de design para orientar o MVP e a expansão do jogo**  
**Versão:** 1.0  
**Data:** 7 de novembro de 2026  
**Plataforma-alvo:** Web HTML5, orientação portrait

## Resumo do projeto

Um block breaker arcade clássico, em formato portrait, com progressão roguelite. O jogador move o rebatedor, controla a trajetória das bolinhas e destrói formações de blocos. Blocos concedem XP; ao subir de nível, a partida pausa e apresenta três perks aleatórios para escolher um. As combinações mudam a run e criam alta rejogabilidade em sessões curtas, idealmente de até cinco minutos por run.

A prioridade do MVP é provar que rebater, mirar, quebrar blocos e escolher perks forma um ciclo divertido. O jogo não depende de uma campanha extensa para esse teste.

### Como ler os status

- **Confirmado:** escolha expressa pelo jogador ou consolidada como definida no Grill Me.
- **MVP:** recorte para testar o loop principal.
- **Futuro:** ideia aceita como possibilidade, sem compromisso de implementação no MVP.
- **Em aberto:** parâmetro ou regra que ainda precisa de decisão ou teste.

## 1. Visão e pilares

### High concept

Block breaker arcade clássico com elementos roguelite: destruir blocos rende XP, e cada evolução oferece uma escolha de perk que transforma a partida.

### Pilares confirmados

- Sensação e controles de um block breaker clássico.
- Evolução perceptível ao longo das ondas e das fases.
- Alta rejogabilidade por meio de combinações diferentes de perks a cada run.
- Habilidade manual no início da run e sensação crescente de poder conforme as sinergias de perks se acumulam.
- Sessões rápidas e fáceis de reiniciar; a referência inicial é uma run de até cinco minutos.

## 2. Loop principal

1. Mover o rebatedor horizontalmente para posicionar a rebatida.
2. Controlar ângulo e trajetória para conduzir as bolinhas por corredores e aberturas entre os blocos.
3. Quebrar blocos, evitar que todas as bolinhas caiam e aproveitar obstáculos e elementos da formação.
4. Receber XP por blocos destruídos e preencher a barra de nível.
5. Ao subir de nível, pausar a partida e escolher um entre três perks aleatórios.
6. Retomar a onda com a nova combinação de habilidades; limpar todos os blocos para iniciar a próxima onda.

**Derrota:** nenhuma bolinha permanece ativa em jogo.  
**Conclusão do MVP:** limpar a quantidade definida de ondas da fase. A quantidade de ondas e os valores de duração continuam em aberto.

## 3. Regras de gameplay confirmadas

### Controles e trajetória

- Orientação portrait; controle principal por toque e deslize horizontal para mover o rebatedor.
- A habilidade de mirar e posicionar o rebatedor deve influenciar a trajetória. O jogador aprende por experimentação; não haverá tutorial tradicional.
- O zoom pode se afastar dinamicamente conforme as formações aumentam, preservando a visibilidade do rebatedor e das bolinhas. Os limites de zoom precisam ser testados em telas pequenas.
- Há um perk que prende a bolinha ao rebatedor. O método de soltura — botão ou liberação temporizada — permanece em aberto.

### Bolinhas, vidas e falha

- A run tem uma vida compartilhada: perder uma bolinha não encerra a partida enquanto outra estiver ativa; perder todas encerra a run.
- Perks e elementos da fase podem criar bolinhas simultâneas. A multiplicação aumenta o poder de destruição e a carga de controle.
- Perks podem salvar uma bolinha ou prevenir/reverter uma derrota. Não há vidas separadas por bolinha.
- Alguns perks alteram propriedades físicas das bolinhas. Perks de bolinha são passivos ou automáticos; poderes ativáveis pertencem ao rebatedor.

### Ondas, XP e perks

- A próxima onda começa somente quando todos os blocos da onda atual forem destruídos.
- Cada bloco destruído concede XP. O XP necessário por nível pode crescer, mas a curva e os valores ainda não foram definidos.
- Ao preencher a barra de XP, a partida pausa automaticamente; três opções aleatórias de perk aparecem e o jogador escolhe uma.
- O catálogo usa um modelo híbrido: alguns perks podem ser escolhidos repetidamente e evoluem por níveis; outros são únicos. Limites variam por perk e ainda não foram definidos.
- O catálogo deve ser amplo ao longo do produto. No MVP, usar uma seleção curta o bastante para testar escolhas e sinergias.

### Ataques do rebatedor

- Perks podem conceder ataques automáticos, como disparos periódicos, laser e projéteis, e ataques manuais acionados pelo jogador.
- Controles de habilidade aparecem de forma contextual, somente quando um perk exigir esse comando, para manter a interface inicial limpa.
- Poderes do rebatedor e propriedades da bolinha são sistemas separados. O jogador explicitamente não quer poderes ativáveis disparados pelas bolinhas.

## 4. Blocos e desenho das fases

### Blocos

A visão de produto inclui blocos tradicionais de resistência variável e blocos especiais ou interativos. Resistência deve ser comunicada por cor, textura e/ou estado visual, sem depender exclusivamente da cor.

Ideias para o catálogo futuro:

- Blocos explosivos, regenerativos, móveis, multiplicadores e geradores de blocos.
- Blocos que interagem com outros blocos, obstáculos ou poderes das bolinhas.
- Introdução gradual dos tipos de bloco, para que uma onda ensine uma novidade sem sobrecarregar o jogador.

### Elementos de fase

- Elementos fixos e dinâmicos fazem parte da visão de level design: paredes, obstáculos, defletores, portais, mecanismos, estruturas móveis ou giratórias e elementos que abrem e fecham.
- Formações podem criar corredores e labirintos. O jogador busca um ponto de entrada que mantenha a bolinha quicando dentro da formação por mais tempo.
- A onda tradicional exige destruir todos os blocos. Alternativas de ritmo — sobrevivência por tempo, meta parcial ou ondas sobrepostas — ficam no backlog de experimentos.

## 5. Progressão e persistência

| Momento | Decisão confirmada |
|---|---|
| Dentro da run | Perks e níveis formam uma build temporária. A derrota descarta a run. |
| Entre fases | Progressão sequencial no MVP: vencer uma fase desbloqueia a próxima. |
| Ao perder | Reiniciar a fase perdida imediatamente, sem limite de tentativas; fases já desbloqueadas permanecem disponíveis. |
| Salvamento | Salvar fases desbloqueadas, recordes/estatísticas e desbloqueios permanentes. Não retomar uma run interrompida; sair do jogo perde a run ativa. |
| Metaprogressão | Desbloquear opções de conteúdo, como novos perks, tipos de bola, rebatedores e elementos. Sem melhorias permanentes de atributos iniciais. |
| Competição | Estatísticas pessoais e recordes por fase no MVP; rankings globais e conquistas entram depois. |

## 6. Direção visual e sonora

- Arte 2D em pixel art colorida, com blocos temáticos que representam materiais e estruturas, em vez de formas geométricas genéricas.
- **Tema do MVP:** fantasia acessível, com magia, cristais, ruínas e elementos naturais. A arte do protótipo pode ser provisória.
- **Mundos futuros possíveis:** fantasia, sci-fi/futurista e industrial/pós-apocalíptico. São direções para expansão, não conteúdo comprometido para o MVP.
- A direção sonora inicial é música eletrônica acelerada. Definir efeitos, mixagem e critérios de feedback sonoro antes do polish.

## 7. Escopo do MVP

O MVP deve provar o ciclo completo de uma run sem exigir a campanha inteira. O recorte abaixo combina as decisões do Grill Me com o objetivo de testar a diversão antes de investir em conteúdo. Onde não há números definidos, o parâmetro permanece em aberto.

| Incluído no MVP | Critério de escopo |
|---|---|
| Build jogável HTML5 portrait | Um jogo web funcional em desktop e dispositivos móveis; testar o controle por toque e mouse. |
| Loop de block breaker | Rebatida, colisões, destruição de blocos, queda de bolinhas, vitória e derrota. |
| Fase/run curta com ondas finitas | Quantidade fixa de ondas; a próxima só inicia após limpar todos os blocos; sem chefe. |
| Progressão de perks | XP por bloco, pausa no level up, três opções aleatórias e escolha de uma; conjunto inicial enxuto de perks. |
| Perks de tipos diferentes | Cobrir progressão de atributos/bolinha e ao menos uma opção ligada ao rebatedor; a lista final é decisão de balanceamento. |
| Feedback e interface essenciais | Estado de onda, XP/nível, perks, bolinhas ativas, pausa, vitória e derrota. |
| Fantasia provisória | Pixel art simples e colorida, suficiente para leitura de blocos e resistência. |
| Persistência entre fases | Guardar desbloqueio da próxima fase e estatísticas pessoais; sem salvar a run ativa. |
| Integração de distribuição inicial | HTML5 com Playgama Bridge como camada de integração. Publicidade pode começar em escopo mínimo, sem interromper a validação do gameplay. |

**Fora do MVP:** campanha completa, vários mundos, chefes, catálogo grande de blocos/perks, rankings globais, conquistas, anúncios obrigatórios durante a ação e monetização por pagamento.

## 8. Distribuição, tecnologia e monetização

### Distribuição

- Portais pretendidos: **itch.io, GameFlare, Playgama e CrazyGames**.
- Meta técnica: um build HTML5 e um ZIP reutilizados nos quatro portais, com integração da Playgama Bridge.
- Sequência registrada: validar o build e checklist; publicar no itch.io, GameFlare e Playgama; submeter no CrazyGames em Basic Launch e só depois preparar Full Launch. Revalidar os requisitos dos portais na data de submissão.

### Stack de desenvolvimento

- HTML5 está confirmado.
- Stack recomendada no contexto: **Phaser, TypeScript, Vite e Git**. Phaser para jogo 2D, cenas, colisões, áudio e entrada; TypeScript para tipagem; Vite para desenvolvimento e empacotamento.
- Confirmar se Phaser/TypeScript/Vite deve ser tratada como decisão final antes de iniciar a implementação.

### Monetização

- Jogo totalmente gratuito; receita somente de publicidade.
- Modelo escolhido: anúncios convencionais conforme cada portal e anúncios recompensados opcionais que concedem uma vantagem ao jogador.
- Sem compras, microtransações, cosméticos pagos ou opção paga para remover anúncios.
- Respeitar a disponibilidade e as regras de cada portal; não inserir anúncios forçados durante a ação do block breaker.

## 9. Backlog futuro

- Campanha completa com fases sequenciais, runs independentes por fase, ondas mais longas/difíceis e introdução gradual de novas mecânicas.
- Mundos temáticos de fantasia, sci-fi/futurista e industrial/pós-apocalíptico.
- Chefes, desafios especiais e encerramentos variados ao final de fases.
- Novas estruturas de onda: limite de tempo, meta parcial ou ondas que se sobrepõem.
- Catálogo amplo de blocos: regeneração, movimento, explosão, multiplicação, geração e interações.
- Mais obstáculos, portais, defletores e mecanismos móveis, giratórios ou temporizados.
- Grande catálogo de perks, mais sinergias, níveis individuais e perks únicos.
- Desbloqueios de tipos de bolinha, rebatedores e elementos de gameplay, sem aumentar atributos iniciais de forma permanente.
- Rankings globais e conquistas, condicionados aos recursos dos portais.
- Rewarded ads com vantagens específicas, após definir benefícios e limites para preservar equilíbrio.

## 10. Pendências e validação de consistência

| Tema | Pendência / observação |
|---|---|
| Escopo do MVP | A proposta inicial mencionava sobrevivência contínua; a decisão posterior definiu quantidade fixa de ondas e ausência de chefes no MVP. Este GDD segue a decisão posterior. |
| Estrutura geral | A visão final é uma campanha de fases, cada fase uma run com várias ondas. Confirmar a sequência e o encerramento de uma run após vitória. |
| Critérios de entrega | Traduzir o escopo em entregáveis e critérios de aceite; confirmar a quantidade de conteúdo antes de congelar tarefas. |
| Parâmetros | Número de fases e ondas, duração-alvo, layout, zoom mínimo/máximo, velocidade e ângulo da bola, tamanho/velocidade do rebatedor, vidas e valores de XP. |
| Perks | Lista inicial, raridade, repetição no sorteio, limites por perk, reroll, sinergias e distribuição de ataques manuais/automáticos. |
| Perk “grudar” | Como a bolinha é lançada de novo: botão contextual ou soltura automática por tempo. |
| Blocos e balanceamento | Quantidade de blocos por onda, resistência, pontuação/XP, frequência de blocos especiais e regras de geração. |
| Áudio | Definir efeitos sonoros, mixagem e feedback de gameplay. |
| Plataforma | Comportamento de mouse/teclado, tamanhos de tela, fullscreen, pausa, foco/aba inativa e armazenamento entre portais. |
| Publicidade | Formatos convencionais e recompensas por portal, recompensa específica, frequência e tratamento de falha/cancelamento do anúncio. |
| Critérios de sucesso | Definir sinais de diversão e metas para decidir se o MVP avança: completude, repetição voluntária, duração de sessão e variedade de perks escolhidos. |

### Checklist de coerência

- A vida compartilhada significa que uma bolinha pode cair sem terminar a run se outra continuar ativa; a derrota ocorre quando todas caem.
- Perks de bola são passivos/automáticos; perks de ataque pertencem ao rebatedor e podem ser automáticos ou manuais.
- O level up pausa o jogo para a escolha de um entre três perks; as ondas só avançam após todos os blocos serem destruídos.
- Metaprogressão desbloqueia conteúdo, não bônus permanentes de atributos. A run ativa não é salva.
- A monetização é somente publicidade, o jogo continua gratuito e rewarded ads são opcionais.
- Para o MVP, vale a definição posterior: ondas finitas e sem chefe.

---

Este GDD separa as decisões confirmadas do recorte do MVP, do backlog futuro e das pendências de design. Use a seção de pendências para fechar parâmetros e critérios de aceite antes de transformar o escopo em tarefas de implementação.
