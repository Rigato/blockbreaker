import type {
  GameCommands,
  HudSnapshot,
  PhaseSelectInfo,
  PlatformService,
} from '../game/contracts';
import type { BootResult } from '../boot/bridgeBoot';
import type { BlockBreakerGame } from '../game/Game';
import { gameEvents } from '../game/events';
import { en } from '../i18n/en';
import { AdOverlay } from './AdOverlay';
import { DebugPanel } from './DebugPanel';
import { Hud } from './Hud';
import { InfoDialog } from './InfoDialog';
import { LevelUpOverlay } from './LevelUpOverlay';
import { Menu } from './Menu';
import { HudOverlay } from './Overlay';
import { Orientation } from './Orientation';
import { PhaseSelect } from './PhaseSelect';
import { SettingsDialog } from './SettingsDialog';

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
    onCampaign: handleCampaign,
    onEndless: handleEndless,
    onEndlessLocked: handleEndlessLocked,
    onSettings: handleSettings,
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

  const settings = new SettingsDialog({
    root: options.root,
    controller,
    onClose: () => menu.focusPlay(),
  });

  const infoDialog = new InfoDialog({
    root: options.root,
    onClose: () => menu.focusPlay(),
  });

  const hud = new Hud({ root: options.root, controller });
  const overlay = new HudOverlay({ root: options.root, controller });
  const levelUp = new LevelUpOverlay({ root: options.root, controller });
  const orientation = new Orientation({ controller });
  const adOverlay = new AdOverlay({
    fallbackFocus: () => overlay.resultsFocusTarget(),
  });

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
    menu.update(lastSnapshot, phaseInfo);
    if (phaseSelect.isOpen) phaseSelect.refresh(phaseInfo, selectedPhaseId);
  }

  function handleCampaign(): void {
    settings.close();
    infoDialog.close();
    phaseInfo = readPhaseInfo();
    phaseSelect.open(phaseInfo, selectedPhaseId);
  }

  function handleEndless(): void {
    if (!lastSnapshot.endlessUnlocked) {
      handleEndlessLocked();
      return;
    }
    settings.close();
    infoDialog.close();
    phaseSelect.close();
    controller.startEndless();
  }

  function handleEndlessLocked(): void {
    settings.close();
    infoDialog.open({
      title: en.endlessLockedTitle,
      body: en.endlessLockedBody,
      confirmLabel: en.endlessLockedConfirm,
    });
  }

  function handleSettings(): void {
    phaseSelect.close();
    infoDialog.close();
    settings.open(lastSnapshot);
  }

  const applySnapshot = (snapshot: HudSnapshot): void => {
    const previousPhase = lastSnapshot.phase;
    lastSnapshot = snapshot;

    if (snapshot.phase === 'playing' && previousPhase !== 'playing') {
      const active = document.activeElement;
      if (active instanceof HTMLElement && active.closest('#ui-root')) active.blur();
    }

    if (snapshot.phase !== 'menu' && phaseSelect.isOpen) {
      phaseSelect.close();
    }
    if (snapshot.phase !== 'menu') {
      settings.close();
      infoDialog.close();
    }

    if (snapshot.phase === 'menu') {
      phaseInfo = readPhaseInfo();
    }

    if (debugPanel && !debugAutoCollapsed && snapshot.phase === 'playing') {
      debugPanel.collapse();
      debugAutoCollapsed = true;
    }

    menu.setHidden(snapshot.phase !== 'menu');
    menu.update(snapshot, phaseInfo);
    if (
      snapshot.phase === 'menu' &&
      (previousPhase === 'run-complete' || previousPhase === 'defeat')
    ) {
      menu.focusPlay();
    }
    if (phaseSelect.isOpen) phaseSelect.refresh(phaseInfo, selectedPhaseId);
    if (settings.isOpen) settings.update(snapshot);

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
      settings.dispose();
      infoDialog.dispose();
      hud.dispose();
      overlay.dispose();
      levelUp.dispose();
      orientation.dispose();
      adOverlay.dispose();
      debugPanel?.dispose();
      delete document.documentElement.dataset.debug;
    },
  };
}
