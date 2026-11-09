import type { GameCommands, HudSnapshot } from '../game/contracts';
import { en } from '../i18n/en';
import { formatScore, formatTime } from './format';

export interface MenuOptions {
  root: HTMLElement;
  controller: GameCommands;
  onPlay: () => void;
  onEndless: () => void;
  onPhases: () => void;
}

export interface MenuBest {
  phaseName: string | null;
  bestScore: number | null;
  bestTimeMs: number | null;
}

/**
 * Title screen: Play, Phases, sound switch and the best result for the phase
 * the Play button will start. The menu only renders state; UIRoot decides
 * which phase to start.
 */
export class Menu {
  private readonly controller: GameCommands;
  private readonly onPlay: () => void;
  private readonly onEndless: () => void;
  private readonly onPhases: () => void;
  private readonly section: HTMLElement;
  private readonly playButton: HTMLButtonElement;
  private readonly endlessButton: HTMLButtonElement;
  private readonly endlessNote: HTMLElement;
  private readonly phasesButton: HTMLButtonElement;
  private readonly soundButton: HTMLButtonElement;
  private readonly soundValue: HTMLElement;
  private readonly bestPhase: HTMLElement;
  private readonly bestScore: HTMLElement;
  private readonly bestTime: HTMLElement;
  private soundEnabled = true;

  constructor(options: MenuOptions) {
    this.controller = options.controller;
    this.onPlay = options.onPlay;
    this.onEndless = options.onEndless;
    this.onPhases = options.onPhases;

    const section = document.createElement('section');
    this.section = section;
    section.className = 'menu';
    section.setAttribute('aria-label', en.appTitle);

    const top = document.createElement('header');
    top.className = 'menu__top';

    const kicker = document.createElement('span');
    kicker.className = 'menu__kicker';
    kicker.textContent = en.menuKicker;

    const sigil = document.createElement('span');
    sigil.className = 'menu__sigil';
    sigil.setAttribute('aria-hidden', 'true');

    top.append(kicker, sigil);

    const hero = document.createElement('div');
    hero.className = 'menu__hero';

    const title = document.createElement('h1');
    title.className = 'menu__title';
    title.textContent = en.appTitle;

    const subtitle = document.createElement('p');
    subtitle.className = 'menu__subtitle';
    subtitle.textContent = en.appSubtitle;

    hero.append(title, subtitle);

    const best = document.createElement('div');
    best.className = 'menu__best';
    best.setAttribute('aria-label', en.menuBest);

    const bestPhase = document.createElement('span');
    this.bestPhase = bestPhase;
    bestPhase.className = 'menu__best-phase';
    bestPhase.textContent = en.menuBest;

    const bestScoreItem = document.createElement('span');
    bestScoreItem.className = 'menu__best-item';

    const bestScoreLabel = document.createElement('span');
    bestScoreLabel.className = 'menu__best-label';
    bestScoreLabel.textContent = en.menuBestScore;

    const bestScore = document.createElement('strong');
    this.bestScore = bestScore;
    bestScore.className = 'menu__best-value';

    bestScoreItem.append(bestScoreLabel, bestScore);

    const bestTimeItem = document.createElement('span');
    bestTimeItem.className = 'menu__best-item';

    const bestTimeLabel = document.createElement('span');
    bestTimeLabel.className = 'menu__best-label';
    bestTimeLabel.textContent = en.menuBestTime;

    const bestTime = document.createElement('strong');
    this.bestTime = bestTime;
    bestTime.className = 'menu__best-value';

    bestTimeItem.append(bestTimeLabel, bestTime);

    best.append(bestPhase, bestScoreItem, bestTimeItem);

    const actions = document.createElement('div');
    actions.className = 'menu__actions';

    const playButton = document.createElement('button');
    this.playButton = playButton;
    playButton.type = 'button';
    playButton.id = 'play-button';
    playButton.className = 'menu__play';
    playButton.textContent = en.play;
    playButton.addEventListener('click', this.handlePlay);

    const endlessWrap = document.createElement('div');
    endlessWrap.className = 'menu__endless-wrap';

    const endlessButton = document.createElement('button');
    this.endlessButton = endlessButton;
    endlessButton.type = 'button';
    endlessButton.id = 'endless-button';
    endlessButton.className = 'menu__secondary menu__endless';
    endlessButton.textContent = en.endless;
    endlessButton.addEventListener('click', this.handleEndless);

    const endlessNote = document.createElement('span');
    this.endlessNote = endlessNote;
    endlessNote.className = 'menu__endless-note';
    endlessNote.textContent = en.endlessNote;
    endlessNote.hidden = true;

    endlessWrap.append(endlessButton, endlessNote);

    const phasesButton = document.createElement('button');
    this.phasesButton = phasesButton;
    phasesButton.type = 'button';
    phasesButton.id = 'phases-button';
    phasesButton.className = 'menu__secondary';
    phasesButton.textContent = en.menuPhases;
    phasesButton.addEventListener('click', this.handlePhases);

    const sound = document.createElement('div');
    sound.className = 'menu__sound';

    const soundLabel = document.createElement('span');
    soundLabel.className = 'menu__sound-label';
    soundLabel.textContent = en.menuSound;

    const soundButton = document.createElement('button');
    this.soundButton = soundButton;
    soundButton.type = 'button';
    soundButton.className = 'menu__sound-toggle';
    soundButton.setAttribute('role', 'switch');
    soundButton.setAttribute('aria-label', en.menuSound);

    const soundValue = document.createElement('span');
    this.soundValue = soundValue;
    soundValue.className = 'menu__sound-value';

    soundButton.append(soundValue);
    soundButton.addEventListener('click', this.handleSound);

    sound.append(soundLabel, soundButton);

    const note = document.createElement('p');
    note.id = 'menu-note';
    note.className = 'menu__note';
    note.setAttribute('role', 'status');
    note.textContent = en.playNote;

    actions.append(playButton, endlessWrap, phasesButton, sound, note);

    const footer = document.createElement('p');
    footer.className = 'menu__footer';
    footer.textContent = en.footer;

    section.append(top, hero, best, actions, footer);
    options.root.append(section);

    this.applySound(true);
  }

  update(snapshot: HudSnapshot, best: MenuBest): void {
    this.applySound(snapshot.soundEnabled);

    this.bestPhase.textContent = best.phaseName ?? en.menuBestEmpty;
    this.bestScore.textContent = formatScore(best.bestScore);
    this.bestTime.textContent = formatTime(best.bestTimeMs);

    const bestWave = snapshot.endlessBestWave ?? 0;
    if (bestWave > 0) {
      this.endlessNote.hidden = false;
      this.endlessNote.textContent = `${en.endlessBest}: ${bestWave}`;
    } else {
      this.endlessNote.hidden = true;
      this.endlessNote.textContent = en.endlessNote;
    }
  }

  setHidden(hidden: boolean): void {
    this.section.hidden = hidden;
  }

  focusPlay(): void {
    this.playButton.focus({ preventScroll: true });
  }

  dispose(): void {
    this.playButton.removeEventListener('click', this.handlePlay);
    this.endlessButton.removeEventListener('click', this.handleEndless);
    this.phasesButton.removeEventListener('click', this.handlePhases);
    this.soundButton.removeEventListener('click', this.handleSound);
    this.section.remove();
  }

  private applySound(enabled: boolean): void {
    this.soundEnabled = enabled;
    this.soundButton.setAttribute('aria-checked', String(enabled));
    this.soundButton.classList.toggle('is-on', enabled);
    this.soundValue.textContent = enabled ? en.soundOn : en.soundOff;
  }

  private readonly handlePlay = (): void => {
    this.playButton.blur();
    this.onPlay();
  };

  private readonly handleEndless = (): void => {
    this.endlessButton.blur();
    this.onEndless();
  };

  private readonly handlePhases = (): void => {
    this.phasesButton.blur();
    this.onPhases();
  };

  private readonly handleSound = (): void => {
    const next = !this.soundEnabled;
    this.applySound(next);
    this.controller.setSound(next);
    this.soundButton.blur();
  };
}
