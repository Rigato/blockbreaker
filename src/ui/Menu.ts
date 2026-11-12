import type { GameCommands, HudSnapshot, PhaseSelectInfo } from '../game/contracts';
import { en } from '../i18n/en';
import '../styles/menu-footer.css';

const APP_VERSION = '0.6.0';

export interface MenuOptions {
  root: HTMLElement;
  controller: GameCommands;
  onCampaign: () => void;
  onEndless: () => void;
  onEndlessLocked: () => void;
  onSettings: () => void;
  onHowToPlay: () => void;
  onAbout: () => void;
  onWorkshop: () => void;
  storageWarning: boolean;
  onStorageInfo: () => void;
}

const INFINITY_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" ' +
  'stroke-linecap="round" aria-hidden="true" focusable="false">' +
  '<path d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 0 0 0-8c-2 0-4 1.33-6 4Z"/>' +
  '</svg>';

const LOCK_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" ' +
  'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
  '<rect width="16" height="10" x="4" y="10" rx="2"/>' +
  '<path d="M8 10V7a4 4 0 0 1 8 0v3"/>' +
  '</svg>';

const HELP_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" ' +
  'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
  '<circle cx="12" cy="12" r="9"/>' +
  '<path d="M9.1 9.2a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/>' +
  '<path d="M12 16.8h.01"/>' +
  '</svg>';

const ABOUT_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" ' +
  'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
  '<circle cx="12" cy="12" r="9"/>' +
  '<path d="M12 10.8V16.4"/>' +
  '<path d="M12 7.6h.01"/>' +
  '</svg>';

/**
 * Title screen: brand, two mode cards (Campaign primary, Endless secondary)
 * and a footer with How to play / Settings / About us entry points. The menu
 * only renders state; UIRoot decides what each card starts.
 */
export class Menu {
  private readonly controller: GameCommands;
  private readonly onCampaign: () => void;
  private readonly onEndless: () => void;
  private readonly onEndlessLocked: () => void;
  private readonly onSettings: () => void;
  private readonly onHowToPlay: () => void;
  private readonly onAbout: () => void;
  private readonly onWorkshop: () => void;
  private readonly onStorageInfo: () => void;

  private readonly section: HTMLElement;
  private readonly campaignButton: HTMLButtonElement;
  private readonly campaignStatus: HTMLElement;
  private readonly campaignCta: HTMLElement;
  private readonly nodesRow: HTMLElement;
  private readonly endlessButton: HTMLButtonElement;
  private readonly endlessBadge: HTMLElement;
  private readonly endlessStat: HTMLElement;
  private readonly endlessLockNote: HTMLElement;
  private readonly howToPlayButton: HTMLButtonElement;
  private readonly settingsButton: HTMLButtonElement;
  private readonly aboutButton: HTMLButtonElement;
  private readonly workshopButton: HTMLButtonElement;
  private readonly workshopSparks: HTMLElement;
  private readonly workshopReady: HTMLElement;
  private readonly storageButton: HTMLButtonElement;

  private nodes: HTMLElement[] = [];
  private nodesSignature = '__unset__';
  private endlessUnlocked = false;
  private lastCampaignComplete = false;

  constructor(options: MenuOptions) {
    this.controller = options.controller;
    this.onCampaign = options.onCampaign;
    this.onEndless = options.onEndless;
    this.onEndlessLocked = options.onEndlessLocked;
    this.onSettings = options.onSettings;
    this.onHowToPlay = options.onHowToPlay;
    this.onAbout = options.onAbout;
    this.onWorkshop = options.onWorkshop;
    this.onStorageInfo = options.onStorageInfo;

    const section = document.createElement('section');
    this.section = section;
    section.className = 'menu';
    section.setAttribute('aria-label', en.appTitle);

    // --- Brand -------------------------------------------------------------
    const brand = document.createElement('header');
    brand.className = 'menu__brand';

    const title = document.createElement('h1');
    title.className = 'menu__title';
    title.textContent = en.appTitle;

    const subtitleRow = document.createElement('div');
    subtitleRow.className = 'menu__subtitle-row';

    const ruleLeft = document.createElement('span');
    ruleLeft.className = 'menu__rule';
    ruleLeft.setAttribute('aria-hidden', 'true');

    const subtitle = document.createElement('p');
    subtitle.className = 'menu__subtitle';
    subtitle.textContent = en.appSubtitle;

    const ruleRight = document.createElement('span');
    ruleRight.className = 'menu__rule';
    ruleRight.setAttribute('aria-hidden', 'true');

    subtitleRow.append(ruleLeft, subtitle, ruleRight);
    brand.append(title, subtitleRow);

    // --- Mode cards --------------------------------------------------------
    const modes = document.createElement('div');
    modes.className = 'menu__modes';

    // Campaign card (primary).
    const campaign = document.createElement('button');
    this.campaignButton = campaign;
    campaign.type = 'button';
    campaign.id = 'campaign-button';
    campaign.className = 'menu__card menu__card--campaign';

    const campaignBody = document.createElement('span');
    campaignBody.className = 'menu__card-body';

    const gem = document.createElement('span');
    gem.className = 'menu__card-gem';
    gem.setAttribute('aria-hidden', 'true');
    const gemCore = document.createElement('span');
    gemCore.className = 'menu__card-gem-core';
    gem.append(gemCore);

    const campaignText = document.createElement('span');
    campaignText.className = 'menu__card-text';

    const campaignKicker = document.createElement('span');
    campaignKicker.className = 'menu__card-kicker';
    campaignKicker.textContent = en.menuCampaignKicker;

    const campaignTitle = document.createElement('span');
    campaignTitle.className = 'menu__card-title';
    campaignTitle.textContent = en.menuCampaign;

    const campaignSub = document.createElement('span');
    campaignSub.className = 'menu__card-sub';
    campaignSub.textContent = en.menuCampaignSub;

    campaignText.append(campaignKicker, campaignTitle, campaignSub);
    campaignBody.append(gem, campaignText);

    const nodesRow = document.createElement('span');
    this.nodesRow = nodesRow;
    nodesRow.className = 'menu__nodes';
    nodesRow.setAttribute('role', 'img');

    const campaignFoot = document.createElement('span');
    campaignFoot.className = 'menu__card-foot';

    const campaignStatus = document.createElement('span');
    this.campaignStatus = campaignStatus;
    campaignStatus.className = 'menu__card-status';

    const campaignCta = document.createElement('span');
    this.campaignCta = campaignCta;
    campaignCta.className = 'menu__card-cta';
    campaignCta.setAttribute('aria-hidden', 'true');

    campaignFoot.append(campaignStatus, campaignCta);
    campaign.append(campaignBody, nodesRow, campaignFoot);
    campaign.addEventListener('click', this.handleCampaign);

    // Endless card (secondary).
    const endless = document.createElement('button');
    this.endlessButton = endless;
    endless.type = 'button';
    endless.id = 'endless-button';
    endless.className = 'menu__card menu__card--endless';

    const endlessBody = document.createElement('span');
    endlessBody.className = 'menu__card-body';

    const infinity = document.createElement('span');
    infinity.className = 'menu__card-icon';
    infinity.setAttribute('aria-hidden', 'true');
    infinity.innerHTML = INFINITY_SVG;

    const endlessText = document.createElement('span');
    endlessText.className = 'menu__card-text';

    const endlessKicker = document.createElement('span');
    endlessKicker.className = 'menu__card-kicker';
    endlessKicker.textContent = en.menuEndlessKicker;

    const endlessTitle = document.createElement('span');
    endlessTitle.className = 'menu__card-title';
    endlessTitle.textContent = en.endless;

    const endlessSub = document.createElement('span');
    endlessSub.className = 'menu__card-sub';
    endlessSub.textContent = en.menuEndlessSub;

    endlessText.append(endlessKicker, endlessTitle, endlessSub);

    const endlessBadge = document.createElement('span');
    this.endlessBadge = endlessBadge;
    endlessBadge.className = 'menu__card-badge';
    endlessBadge.setAttribute('aria-hidden', 'true');
    endlessBadge.innerHTML = LOCK_SVG;

    endlessBody.append(infinity, endlessText, endlessBadge);

    const endlessStat = document.createElement('span');
    this.endlessStat = endlessStat;
    endlessStat.className = 'menu__card-stat';

    const endlessLockNote = document.createElement('span');
    this.endlessLockNote = endlessLockNote;
    endlessLockNote.className = 'menu__card-locknote';
    endlessLockNote.textContent = en.menuEndlessLocked;

    endless.append(endlessBody, endlessStat, endlessLockNote);
    endless.addEventListener('click', this.handleEndless);

    modes.append(campaign, endless);

    // --- Workshop strip ----------------------------------------------------
    const workshopButton = document.createElement('button');
    this.workshopButton = workshopButton;
    workshopButton.type = 'button';
    workshopButton.id = 'workshop-button';
    workshopButton.className = 'menu__workshop';
    workshopButton.addEventListener('click', this.handleWorkshop);

    const workshopMain = document.createElement('span');
    workshopMain.className = 'menu__workshop-main';

    const workshopMark = document.createElement('span');
    workshopMark.className = 'menu__workshop-mark';
    workshopMark.setAttribute('aria-hidden', 'true');

    const workshopTitle = document.createElement('span');
    workshopTitle.className = 'menu__workshop-title';
    workshopTitle.textContent = en.menuWorkshop;

    workshopMain.append(workshopMark, workshopTitle);

    const workshopMeta = document.createElement('span');
    workshopMeta.className = 'menu__workshop-meta';

    const workshopSparks = document.createElement('span');
    this.workshopSparks = workshopSparks;
    workshopSparks.className = 'menu__workshop-sparks';
    workshopSparks.textContent = en.menuWorkshopSparks.replace('{{sparks}}', '0');

    const workshopReady = document.createElement('span');
    this.workshopReady = workshopReady;
    workshopReady.className = 'menu__workshop-ready';
    workshopReady.textContent = en.menuWorkshopReady;
    workshopReady.hidden = true;

    workshopMeta.append(workshopSparks, workshopReady);
    workshopButton.append(workshopMain, workshopMeta);

    // Discreet storage notice. Only mounted when the platform reports memory
    // storage, so normal players never see it.
    const storageButton = document.createElement('button');
    this.storageButton = storageButton;
    storageButton.type = 'button';
    storageButton.id = 'storage-warning-button';
    storageButton.className = 'menu__storage-warning';
    storageButton.hidden = !options.storageWarning;
    storageButton.setAttribute('aria-label', en.menuStorageWarning);
    storageButton.addEventListener('click', this.handleStorageInfo);

    const storageMark = document.createElement('span');
    storageMark.className = 'menu__storage-mark';
    storageMark.setAttribute('aria-hidden', 'true');
    storageMark.textContent = '!';

    const storageLabel = document.createElement('span');
    storageLabel.textContent = en.menuStorageWarning;

    storageButton.append(storageMark, storageLabel);

    // --- Footer ------------------------------------------------------------
    const footer = document.createElement('footer');
    footer.className = 'menu__footer';

    const footerNav = document.createElement('nav');
    footerNav.className = 'menu__footer-nav';
    footerNav.setAttribute('aria-label', en.menuFooterNav);

    // How to play.
    const howToPlayButton = document.createElement('button');
    this.howToPlayButton = howToPlayButton;
    howToPlayButton.type = 'button';
    howToPlayButton.id = 'how-to-play-button';
    howToPlayButton.className = 'menu__footer-btn menu__footer-btn--howto';
    howToPlayButton.setAttribute('aria-label', en.menuHowToPlay);
    howToPlayButton.addEventListener('click', this.handleHowToPlay);

    const helpIcon = document.createElement('span');
    helpIcon.className = 'menu__footer-icon';
    helpIcon.setAttribute('aria-hidden', 'true');
    helpIcon.innerHTML = HELP_SVG;

    const howToLabel = document.createElement('span');
    howToLabel.className = 'menu__footer-label';
    howToLabel.textContent = en.menuHowToPlay;

    howToPlayButton.append(helpIcon, howToLabel);

    // Settings (keeps its stable id so tests and muscle memory hold).
    const settingsButton = document.createElement('button');
    this.settingsButton = settingsButton;
    settingsButton.type = 'button';
    settingsButton.id = 'settings-button';
    settingsButton.className = 'menu__footer-btn menu__settings';
    settingsButton.setAttribute('aria-label', `${en.menuSettings}. ${en.menuSettingsHint}`);
    settingsButton.addEventListener('click', this.handleSettings);

    const gear = document.createElement('span');
    gear.className = 'menu__settings-icon';
    gear.setAttribute('aria-hidden', 'true');

    const settingsLabel = document.createElement('span');
    settingsLabel.className = 'menu__footer-label';
    settingsLabel.textContent = en.menuSettings;

    settingsButton.append(gear, settingsLabel);

    // About us.
    const aboutButton = document.createElement('button');
    this.aboutButton = aboutButton;
    aboutButton.type = 'button';
    aboutButton.id = 'about-button';
    aboutButton.className = 'menu__footer-btn menu__footer-btn--about';
    aboutButton.setAttribute('aria-label', en.menuAbout);
    aboutButton.addEventListener('click', this.handleAbout);

    const aboutIcon = document.createElement('span');
    aboutIcon.className = 'menu__footer-icon';
    aboutIcon.setAttribute('aria-hidden', 'true');
    aboutIcon.innerHTML = ABOUT_SVG;

    const aboutLabel = document.createElement('span');
    aboutLabel.className = 'menu__footer-label';
    aboutLabel.textContent = en.menuAbout;

    aboutButton.append(aboutIcon, aboutLabel);

    footerNav.append(howToPlayButton, settingsButton, aboutButton);

    const version = document.createElement('span');
    version.className = 'menu__version';
    version.textContent = en.menuVersion.replace('{{version}}', APP_VERSION);

    footer.append(footerNav, version);

    section.append(brand, modes, workshopButton, storageButton, footer);
    options.root.append(section);
  }

  update(snapshot: HudSnapshot, phases: readonly PhaseSelectInfo[]): void {
    this.lastCampaignComplete = snapshot.campaignComplete;
    this.updateNodes(phases);
    this.updateCampaign(snapshot, phases);
    this.updateEndless(snapshot);
    this.updateWorkshop(snapshot);
  }

  setHidden(hidden: boolean): void {
    this.section.hidden = hidden;
  }

  focusPlay(): void {
    this.campaignButton.focus({ preventScroll: true });
  }

  focusWorkshop(): void {
    this.workshopButton.focus({ preventScroll: true });
  }

  dispose(): void {
    this.campaignButton.removeEventListener('click', this.handleCampaign);
    this.endlessButton.removeEventListener('click', this.handleEndless);
    this.howToPlayButton.removeEventListener('click', this.handleHowToPlay);
    this.settingsButton.removeEventListener('click', this.handleSettings);
    this.aboutButton.removeEventListener('click', this.handleAbout);
    this.workshopButton.removeEventListener('click', this.handleWorkshop);
    this.storageButton.removeEventListener('click', this.handleStorageInfo);
    this.section.remove();
  }

  // -- Rendering ------------------------------------------------------------

  private updateNodes(phases: readonly PhaseSelectInfo[]): void {
    const signature = phases.map((phase) => phase.id).join('|');
    if (signature !== this.nodesSignature) {
      this.nodesSignature = signature;
      this.nodes = [];
      const fragment = document.createDocumentFragment();
      for (let index = 0; index < phases.length; index += 1) {
        const node = document.createElement('span');
        node.className = 'menu__node';
        node.setAttribute('aria-hidden', 'true');
        this.nodes.push(node);
        fragment.append(node);
      }
      this.nodesRow.replaceChildren(fragment);
    }

    const hasPhases = phases.length > 0;
    this.nodesRow.hidden = !hasPhases;
    if (!hasPhases) return;

    const complete = this.lastCampaignComplete;
    const cleared = phases.filter((phase) => phase.clears > 0).length;
    const current = complete
      ? null
      : phases.find((phase) => phase.unlocked && phase.clears === 0) ?? null;

    this.nodesRow.setAttribute(
      'aria-label',
      en.menuCampaignProgress
        .replace('{{cleared}}', String(cleared))
        .replace('{{total}}', String(phases.length)),
    );

    for (let index = 0; index < phases.length; index += 1) {
      const phase = phases[index];
      const node = this.nodes[index];
      if (!phase || !node) continue;
      node.classList.toggle('is-cleared', complete || phase.clears > 0);
      node.classList.toggle('is-current', phase.id === current?.id);
    }
  }

  private updateCampaign(snapshot: HudSnapshot, phases: readonly PhaseSelectInfo[]): void {
    const complete = snapshot.campaignComplete;
    const cleared = phases.filter((phase) => phase.clears > 0).length;
    const current = complete
      ? null
      : phases.find((phase) => phase.unlocked && phase.clears === 0) ?? null;

    if (complete) {
      this.campaignStatus.textContent = en.menuCampaignAll;
    } else if (current) {
      this.campaignStatus.textContent = current.tutorial
        ? en.menuCurrentTutorial
        : en.menuCurrentLevel
            .replace('{{index}}', String(current.index))
            .replace('{{name}}', current.name);
    } else if (phases.length > 0) {
      const last = phases[phases.length - 1];
      this.campaignStatus.textContent = last
        ? en.menuCurrentLevel
            .replace('{{index}}', String(last.index))
            .replace('{{name}}', last.name)
        : en.menuCampaignSub;
    } else {
      this.campaignStatus.textContent = en.menuCampaignSub;
    }

    this.campaignCta.textContent = complete
      ? en.menuCampaignComplete
      : cleared > 0
        ? en.menuCampaignContinue
        : en.menuCampaignStart;

    this.campaignButton.classList.toggle('is-complete', complete);
    this.campaignButton.dataset.progress = complete ? 'complete' : cleared > 0 ? 'started' : 'fresh';
  }

  private updateWorkshop(snapshot: HudSnapshot): void {
    const sparks = snapshot.sparks ?? 0;
    this.workshopSparks.textContent = en.menuWorkshopSparks.replace(
      '{{sparks}}',
      String(sparks),
    );
    const ready = snapshot.workshopReady === true;
    this.workshopReady.hidden = !ready;
    this.workshopButton.classList.toggle('is-ready', ready);
  }

  private updateEndless(snapshot: HudSnapshot): void {
    this.endlessUnlocked = snapshot.endlessUnlocked;
    const locked = !snapshot.endlessUnlocked;

    this.endlessButton.classList.toggle('is-locked', locked);
    this.endlessButton.setAttribute('aria-disabled', String(locked));

    this.endlessBadge.hidden = !locked;
    this.endlessLockNote.hidden = !locked;
    this.endlessStat.hidden = locked;

    if (locked) return;

    let runs = 0;
    try {
      runs = this.controller.getEndlessStats().runs;
    } catch {
      // Stats unavailable; the card still shows the persisted best wave.
    }

    const bestWave = snapshot.endlessBestWave ?? 0;
    this.endlessStat.textContent = `${en.menuEndlessBest.replace(
      '{{wave}}',
      String(bestWave),
    )} · ${en.menuEndlessRuns.replace('{{runs}}', String(runs))}`;
  }

  // -- Handlers -------------------------------------------------------------

  private readonly handleCampaign = (): void => {
    this.campaignButton.blur();
    this.onCampaign();
  };

  private readonly handleEndless = (): void => {
    this.endlessButton.blur();
    if (this.endlessUnlocked) this.onEndless();
    else this.onEndlessLocked();
  };

  private readonly handleSettings = (): void => {
    this.settingsButton.blur();
    this.onSettings();
  };

  private readonly handleHowToPlay = (): void => {
    this.howToPlayButton.blur();
    this.onHowToPlay();
  };

  private readonly handleAbout = (): void => {
    this.aboutButton.blur();
    this.onAbout();
  };

  private readonly handleWorkshop = (): void => {
    this.workshopButton.blur();
    this.onWorkshop();
  };

  private readonly handleStorageInfo = (): void => {
    this.storageButton.blur();
    this.onStorageInfo();
  };
}
