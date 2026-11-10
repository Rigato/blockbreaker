# Plano — v0.4.0: blocos, menu, seleção de fases e configurações

**Data:** 2026-11-10  
**Base:** `main` @ `7a1abcd` (handoff v0.3.0)  
**Escopo:** melhorar a primeira impressão e a apresentação visual sem alterar a
simulação, o conteúdo da campanha ou o balance.

## 1. Motivação

O jogo foi enviado para Playgama (sandbox com milestones) e CrazyGames. A
CrazyGames reprovou o build como “abaixo dos padrões de qualidade do portal”, sem
detalhar os pontos. A auditoria dos requisitos públicos e do estado atual aponta
para problemas de **primeira impressão, consistência visual, legibilidade em
desktop e onboarding** — não para um bug isolado.

Este ciclo ataca primeiro o que o jogador vê antes de jogar:

1. Os blocos em jogo parecem “cards” escuros e repetitivos; a arte de capa usa
   blocos lisos, luminosos e arredondados, criando inconsistência de estilo.
2. O menu ainda tem textos de MVP (`XP · Perks · Levels`, rodapé de controles) e
   usa a onda 1 da fase 1 como fundo estático.
3. A seleção de fases é uma lista pequena e sem identidade; as seis fases não se
   diferenciam visualmente.
4. Não há controles de áudio/música/screen shake em um único lugar.
5. O modo Endless está disponível desde o início, sem relação com a campanha.

## 2. Direção visual

### 2.1 Blocos

**Objetivo:** blocos com leitura imediata, materiais distintos e acabamento
coerente com a UI (gradientes suaves, brilho, sombra, rim light), sem perder a
identidade pixel/arcade.

- Reduzir ruído interno: menos linhas, menos padrões repetidos.
- Corpo com volume: topo claro, base escura, bisel de 2–3 px, sombra projetada.
- Cada material com uma assinatura simples e forte:
  - **Crystal:** gema facetada, núcleo luminoso.
  - **Stone:** alvenaria com juntas legíveis e desgaste sutil.
  - **Obsidian:** vidro escuro com runa central nítida.
  - **Especiais:** silhueta e ícone inconfundíveis (bomba, coração/regeneração,
    setas, 2×, engrenagem, corrente).
- HP legível por pips e cracks, sem depender só de cor.
- Paleta mais saturada e luminosa que a atual, integrada aos acentos de fase.
- Validar em 390×844 (mobile) e 907×510 (iframe desktop CrazyGames), em
  grayscale e com reduced motion.

### 2.2 Fundo do menu

- Remover a onda 1 da fase 1 atrás do menu.
- Adicionar camada Phaser dedicada ao menu: 4–6 bolinhas luminosas quicando,
  trilhas curtas, brilho suave e um campo de partículas discreto.
- A camada não deve competir com o texto: alpha baixo e overlay do menu mais
  transparente apenas no centro.
- Respeitar `prefers-reduced-motion` (sem trilhas / velocidade reduzida).
- Sem custo de simulação: as bolinhas são apenas apresentação.

### 2.3 Menu inicial

Estrutura nova, de cima para baixo:

1. **Marca:** `BRICKLIKE` + `ROGUELITE` com glow discreto.
2. **Dois modos:**
   - **Campaign** (card grande): progresso `3 / 6`, nome da fase atual, nós de
     progresso e CTA “Continue”/“Start campaign”. Abre a seleção de fases.
   - **Endless** (card secundário): recorde de onda. **Bloqueado** até concluir
     a campanha; visual desabilitado, com cadeado. Ao clicar, abre um diálogo
     explicando o requisito.
3. **Rodapé:** botão **Settings** e versão do app (`v0.3.0` → futuro bump).
4. Remover `XP · Perks · Levels` do topo e `Portrait · Touch · Mouse · Keyboard`
   do rodapé.

### 2.4 Seleção de fases

- Tela cheia dentro do shell, com header “Campaign”, progresso e botão voltar.
- Cards grandes com:
  - ícone SVG próprio do tema (cristal, ruínas, arcano, gelo, forja, vazio);
  - accent de cor da fase;
  - nome, tagline, número da fase e dificuldade (1–6 pips);
  - features reais extraídas do conteúdo (ex.: `Moving blocks`, `Portals`,
    `Boss: Frost Sentinel`);
  - melhor score/tempo, tentativas e clears;
  - estado bloqueado com cadeado e CTA “Play”.
- Layout vertical com scroll interno, sem cortar em 320×568.
- Fases 4–6 recebem badge de chefe e acabamento mais intenso.

### 2.5 Configurações

Diálogo acessível a partir do menu e do pause:

- **Sound** (SFX) — liga/desliga.
- **Music** — liga/desliga independente do SFX.
- **Screen shake** — liga/desliga.

Persistência em `bb.settings`, compatível com saves antigos (campos ausentes =
`true`). O pause passa a oferecer os três controles para consistência.

## 3. Mudanças técnicas

### 3.1 Contratos

- `SettingsV1`: adicionar `music: boolean` e `screenShake: boolean`.
- `SaveV1`: adicionar `campaignComplete: boolean`; migrar saves antigos
  inferindo `phases['phase-6'].clears > 0`.
- `HudSnapshot`: adicionar `musicEnabled`, `screenShakeEnabled`,
  `endlessUnlocked` e `campaignComplete`.
- `PhaseSelectInfo`: adicionar `tagline`, `themeId`, `accent`, `features`,
  `bossName` e `waves`.
- `GameCommands`: adicionar `setMusic(enabled)` e `setScreenShake(enabled)`.

### 3.2 Fluxo

- `finishPhase(true)` na fase 6 grava `campaignComplete = true`.
- `Endless` só inicia com `campaignComplete`; o comando de UI é bloqueado e o
  menu mostra o diálogo.
- `Menu` recebe `phaseInfo` para calcular progresso e fase atual.
- `UIRoot` orquestra menu, seleção, settings e diálogos.
- `GameScene` ganha `setMenuMode(bool)` e `setScreenShakeEnabled(bool)`.
- `AudioService` ganha `setMusicEnabled(bool)` separado de `setEnabled(bool)`.

### 3.3 Compatibilidade

- Saves v1 antigos continuam válidos; nenhum campo novo lança.
- `campaignComplete` ausente é inferido; saves sem fase 6 ficam `false`.
- Settings antigos com apenas `sound` recebem `music`/`screenShake = true`.
- Nenhum `localStorage` direto; tudo via `StorageService`.

## 4. Critérios de aceite

- [ ] Menu sem os dois textos antigos; fundo animado com bolinhas; sem onda 1.
- [ ] Campaign abre a nova seleção; Endless bloqueado com diálogo até fechar a
      campanha.
- [ ] Settings com Sound, Music e Screen shake persistindo entre reloads.
- [ ] Screen shake desligado não move a câmera; música desligada para o loop
      sem afetar SFX.
- [ ] Blocos novos legíveis em 390×844 e 907×510; sem regressão de performance.
- [ ] `npm run typecheck`, `npm test`, `npm run validate:content`,
      `node scripts/validate-bridge-config.mjs`, `npm run build` verdes.
- [ ] E2E atualizado para o novo fluxo (campaign → seleção → fase; endless
      bloqueado/desbloqueado; settings).

## 5. Fora de escopo

- Metaprogressão permanente, leaderboards e conquistas.
- Rewarded ads.
- Novo conteúdo de fases ou mudanças de balance.
- Localização.

## 6. Execução do P0 (2026-11-10)

| Item | Estado |
|---|---|
| Blocos redesenhados | concluído |
| Menu Campaign/Endless + fundo animado | concluído |
| Seleção de fases temática | concluído |
| Endless bloqueado + diálogo | concluído |
| Settings (som/música/shake) | concluído |
| HUD legível em 907×510, 800×450, 1216×684, 1280×720 e 1920×1080 | concluído (HUD compacto ≤440 px) |
| Onboarding via **How to Play** (5 páginas com screenshots) | concluído |
| **About Us** com logomarca Bad Decision Games | concluído |
| Metadata atualizada (6 fases, chefes, Endless) | concluído |
| Screenshots de loja (8) + capas + vídeos | concluído |
| Testes unitários/E2E | 263 unitários, 21 E2E |
| Moldura/letterbox desktop dedicada | ainda recomendada para o próximo ciclo |

O **How to Play** usa screenshots reais do build (`public/how-to-play/`) e páginas
de 390×844. O **About Us** usa a logomarca transparente em
`public/bad-decision-games/` (WebP + fallback PNG) e o texto em inglês do estúdio.

