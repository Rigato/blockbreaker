import type { EndingSummary } from '../game/contracts';
import { localPhaseIndex } from './worlds';

export interface EndingInput {
  phaseIndex: number;
  phaseName: string;
  phaseCount: number;
  victory: boolean;
  score: number;
  timeMs: number;
}

interface Epilogue {
  readonly title: string;
  readonly body: string;
}

/** Short fantasy epilogues, one per campaign phase. */
const VICTORY_EPILOGUES: Readonly<Record<number, Epilogue>> = {
  1: {
    title: 'The grove awakens',
    body:
      'The crystal grove sings again, every shard burning with borrowed dawn. ' +
      'Its light follows you into the dark ahead.',
  },
  2: {
    title: 'The halls remember',
    body:
      'The ruined halls settle into silence, their broken arches holding their breath. ' +
      'Old stones remember your name now.',
  },
  3: {
    title: 'The depths fall quiet',
    body:
      'The arcane depths dim, their runes spent and their whispers stilled. ' +
      'A stair of cold light opens upward.',
  },
  4: {
    title: 'The spire thaws',
    body:
      'The frostbound spire cracks like glass, and a thousand frozen echoes fall free. ' +
      'A cold wind points the way onward.',
  },
  5: {
    title: 'The forge sleeps',
    body:
      'Emberforge cools at last, its hammer-song fading into distant thunder. ' +
      'Beyond the anvil, the void waits.',
  },
  6: {
    title: 'The Vale holds',
    body:
      'The Void Herald falls, but the threshold does not close. It stabilises, ' +
      'brightens, and pulls you through. On the other side, a dying machine answers.',
  },
  7: {
    title: 'The docks answer',
    body:
      'The flooded docks light up one lamp at a time. Somewhere above, a lattice ' +
      'of signal towers turns its dishes toward you.',
  },
  8: {
    title: 'Signal acquired',
    body:
      'The Nullframe Warden breaks apart into falling plates. The yard goes quiet, ' +
      'then routes every remaining dish to the rail line ahead.',
  },
  9: {
    title: 'The spine runs',
    body:
      'The maglev spine carries you upward in a wash of blue light. The machine ' +
      'is not trying to stop you anymore. It is trying to keep you.',
  },
  10: {
    title: 'The grid goes dark',
    body:
      'The Dreadnought derails, and half the grid goes with it. In the sudden dark, ' +
      'the hardlight weave begins to fold itself into armor.',
  },
  11: {
    title: 'Light takes shape',
    body:
      'The weave resolves into a corridor of white geometry. At its end, the core ' +
      'of the Lattice waits with the patience of a machine that has all the time left.',
  },
  12: {
    title: 'The Lattice relents',
    body:
      'The Hierophant falls silent. The core opens a vent you did not know existed, ' +
      'and the light of the Lattice pours down into a rust-red dark.',
  },
  13: {
    title: 'Slag and sodium',
    body:
      'The yard settles under a sodium lamp. The machine above is gone; the machine ' +
      'below is still warm, and still working.',
  },
  14: {
    title: 'The depot moves',
    body:
      'Rusted belts grind into motion, carrying old cargo toward a foundry that ' +
      'should have been cold a hundred years ago.',
  },
  15: {
    title: 'The foundry breathes',
    body:
      'The molds are still full. The circuits still carry current. The ash on the ' +
      'floor lifts as one, pointing toward the boilers.',
  },
  16: {
    title: 'Pressure drops',
    body:
      'The Boiler Matron sighs out its last breath. The pipes knock twice, then ' +
      'fall silent. Somewhere above, a piston tests its range.',
  },
  17: {
    title: 'The stack clears',
    body:
      'The Riveter lets go of the tower. Its last piston falls into the dark. For ' +
      'the first time, the sky above the Crown Stack is visible.',
  },
  18: {
    title: 'The engine stops',
    body:
      'The Last Engine shudders, locks, and dies. Above you, the lights of the ' +
      'Lattice go out one by one. Below, the Vale is already growing over the ruins. ' +
      'The circle is closed.',
  },
};

const CAMPAIGN_ID = 'campaign-complete';
const TUTORIAL_ID = 'tutorial-complete';

const DEFEAT_TITLE = 'The field falls silent';

const TUTORIAL_EPILOGUE: Epilogue = {
  title: 'Tutorial complete',
  body:
    'You know the rhythm: move, launch, break and build. Bosses guard the last ' +
    'waves of levels 4–6, and clearing all six levels unlocks Endless mode.',
};

/** Score rank for a phase victory; also used by the campaign map badges. */
export function victoryRank(phaseIndex: number, score: number): 'S' | 'A' | 'B' {
  const target = 1000 + phaseIndex * 400;
  if (score >= target * 1.5) return 'S';
  if (score >= target) return 'A';
  return 'B';
}

/**
 * Builds the epilogue shown on the results screen. Victories get a thematic
 * phase epilogue (the sixth closes the campaign) and a score/time rank;
 * defeats get a short "the tower reclaims the run" note.
 */
export function endingForResult(input: EndingInput): EndingSummary | null {
  const { phaseIndex, phaseName, victory, score } = input;

  if (!victory) {
    return {
      id: `defeat-phase-${phaseIndex}`,
      title: DEFEAT_TITLE,
      body:
        `The tower reclaims ${phaseName}. Its stones close over the light, ` +
        'and the dark leans in.',
      rank: 'B',
    };
  }

  if (phaseIndex === 0) {
    return {
      id: TUTORIAL_ID,
      ...TUTORIAL_EPILOGUE,
      rank: 'B',
    };
  }

  const isCampaignFinale = phaseIndex >= input.phaseCount;
  const epilogue = VICTORY_EPILOGUES[phaseIndex] ?? VICTORY_EPILOGUES[6]!;

  return {
    id: isCampaignFinale ? CAMPAIGN_ID : `epilogue-phase-${phaseIndex}`,
    title: epilogue.title,
    body: epilogue.body,
    rank: victoryRank(localPhaseIndex(phaseIndex), score),
  };
}
