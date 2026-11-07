import type {
  GameCommands,
  HudSnapshot,
  PhaseSelectInfo,
  PlatformService,
} from '../game/contracts';
import type { BootResult } from '../boot/bridgeBoot';
import type { BlockBreakerGame } from '../game/Game';
import { gameEvents } from '../game/events';
import { DebugPanel } from './DebugPanel';
import { Hud } from './Hud';
import { LevelUpOverlay } from './LevelUpOverlay';
import type { MenuBest } from './Menu';
import { Menu } from './Menu';
import { HudOverlay } from './Overlay';
import { PhaseSelect } from './PhaseSelect';

export interface UIRootOptions {
  root: HTMLElement;
  platform: PlatformService;
  game: BlockBreakerGame;
  controller: GameCommands;
  boot: BootResult;
  debug: boolean;
}

export interface UIRootHandle {
  /** Resolves after the menu has been painted and is interactive. */
  ready(): Promise<void>;
  setGameReady(label: string): void;
  dispose(): void;
}

function nextPaint(): Promise<void> {
  return new Promise<void>((resolve) => {
    let settled = false;
    const finish = (): void => {
      if (settled) return;
      settled = true;
      resolve();
    };

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(finish);
    });
    window.setTimeout(finish, 250);
  });
}

export function mountUI(options: UIRootOptions): UIRootHandle {
  const controller = options.controller;
  let phaseInfo: readonly PhaseSelectInfo[] = readPhaseInfo();
  let selectedPhaseId: string | null = null;
  let lastSnapshot: HudSnapshot = controller.getHudState();

  const menu = new Menu({
    root: options.root,
    controller,
    onPlay: handlePlay,
    onPhases: handlePhases,
  });

  const phaseSelect = new PhaseSelect({
    root: options.root,
    onStart: (phaseId) => {
      selectedPhaseId = phaseId;
      phaseSelect.close();
      controller.startPhase(phaseId);
    },
    onBack: () => {
      phaseSelect.close();
      menu.focusPlay();
    },
  });

  const hud = new Hud({ root: options.root, controller });
  const overlay = new HudOverlay({ root: options.root, controller });
  const levelUp = new LevelUpOverlay({ root: options.root, controller });

  const debugPanel = options.debug
    ? new DebugPanel({
        root: options.root,
        platform: options.platform,
        game: options.game,
        controller: options.controller,
        boot: options.boot,
        onSaveReset: refreshPhaseInfo,
      })
    : null;

  if (debugPanel) {
    document.documentElement.dataset.debug = '1';
  }

  let debugAutoCollapsed = false;

  function readPhaseInfo(): readonly PhaseSelectInfo[] {
    try {
      return [...controller.getPhaseSelectInfo()];
    } catch (error) {
      console.warn('[ui] could not read phase select info', error);
      return [];
    }
  }

  function refreshPhaseInfo(): void {
    phaseInfo = readPhaseInfo();
    const best = bestFor(lastSnapshot);
    menu.update(lastSnapshot, best);
    if (phaseSelect.isOpen) phaseSelect.refresh(phaseInfo, selectedPhaseId);
  }

  function mostAdvancedUnlocked(): PhaseSelectInfo | null {
    let best: PhaseSelectInfo | null = null;
    for (const phase of phaseInfo) {
      if (!phase.unlocked) continue;
      if (!best || phase.index >= best.index) best = phase;
    }
    return best;
  }

  function playablePhase(): PhaseSelectInfo | null {
    if (selectedPhaseId !== null) {
      const selected = phaseInfo.find((phase) => phase.id === selectedPhaseId);
      if (selected?.unlocked) return selected;
    }
    return mostAdvancedUnlocked();
  }

  function bestFor(snapshot: HudSnapshot): MenuBest {
    const selected =
      selectedPhaseId !== null
        ? phaseInfo.find((phase) => phase.id === selectedPhaseId) ?? null
        : null;
    const target =
      selected ??
      phaseInfo.find((phase) => phase.id === snapshot.phaseId) ??
      mostAdvancedUnlocked();

    return {
      phaseName:
        target?.name ??
        (snapshot.bestScore !== null || snapshot.bestTimeMs !== null ? snapshot.phaseName : null),
      bestScore: target?.bestScore ?? (target ? null : snapshot.bestScore),
      bestTimeMs: target?.bestTimeMs ?? (target ? null : snapshot.bestTimeMs),
    };
  }

  function handlePlay(): void {
    phaseSelect.close();
    phaseInfo = readPhaseInfo();
    const target = playablePhase();
    if (target) {
      selectedPhaseId = target.id;
      controller.startPhase(target.id);
      return;
    }

    // Stub or no phase data yet: keep the M2 entry point working.
    controller.startRun();
  }

  function handlePhases(): void {
    phaseInfo = readPhaseInfo();
    phaseSelect.open(phaseInfo, selectedPhaseId);
  }

  const applySnapshot = (snapshot: HudSnapshot): void => {
    const previousPhase = lastSnapshot.phase;
    lastSnapshot = snapshot;

    if (snapshot.phase !== 'menu' && phaseSelect.isOpen) {
      phaseSelect.close();
    }

    if (snapshot.phase === 'menu') {
      phaseInfo = readPhaseInfo();
    }

    if (debugPanel && !debugAutoCollapsed && snapshot.phase === 'playing') {
      debugPanel.collapse();
      debugAutoCollapsed = true;
    }

    menu.setHidden(snapshot.phase !== 'menu');
    menu.update(snapshot, bestFor(snapshot));
    if (
      snapshot.phase === 'menu' &&
      (previousPhase === 'run-complete' || previousPhase === 'defeat')
    ) {
      menu.focusPlay();
    }
    if (phaseSelect.isOpen) phaseSelect.refresh(phaseInfo, selectedPhaseId);

    hud.update(snapshot);
    hud.setVisible(
      snapshot.phase !== 'menu' &&
        snapshot.phase !== 'run-complete' &&
        snapshot.phase !== 'defeat',
    );
    overlay.update(snapshot);
    levelUp.update(snapshot);
  };

  const unsubscribeHud = gameEvents.on('hud:changed', applySnapshot);
  const unsubscribeReset = gameEvents.on('save:reset', refreshPhaseInfo);
  applySnapshot(lastSnapshot);

  return {
    ready: nextPaint,
    setGameReady(label: string): void {
      debugPanel?.setGameReady(label);
    },
    dispose(): void {
      unsubscribeHud();
      unsubscribeReset();
      menu.dispose();
      phaseSelect.dispose();
      hud.dispose();
      overlay.dispose();
      levelUp.dispose();
      debugPanel?.dispose();
      delete document.documentElement.dataset.debug;
    },
  };
}
