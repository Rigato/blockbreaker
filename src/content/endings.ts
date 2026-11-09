import type { EndingSummary } from '../game/contracts';

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
    title: 'Campaign complete',
    body:
      'The Void Herald falls, and the threshold closes behind you. Six realms hold ' +
      'their breath, then bloom with light. The tower is free, and its song is yours.',
  },
};

const CAMPAIGN_ID = 'campaign-complete';

const DEFEAT_TITLE = 'The field falls silent';

function victoryRank(phaseIndex: number, score: number): 'S' | 'A' | 'B' {
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

  const isCampaignFinale = phaseIndex >= input.phaseCount;
  const epilogue = VICTORY_EPILOGUES[phaseIndex] ?? VICTORY_EPILOGUES[6]!;

  return {
    id: isCampaignFinale ? CAMPAIGN_ID : `epilogue-phase-${phaseIndex}`,
    title: epilogue.title,
    body: epilogue.body,
    rank: victoryRank(phaseIndex, score),
  };
}
