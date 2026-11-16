import { describe, expect, it } from 'vitest';
import { CAMPAIGN_PHASE_COUNT, PHASES } from '../src/content/phases';
import {
  MAX_PHASE_INDEX,
  WORLDS,
  isWorldFinal,
  lastPhaseIndex,
  localPhaseIndex,
  worldForPhaseIndex,
} from '../src/content/worlds';
import { applyPhaseResult, createDefaultSave, parseSave } from '../src/progression/Save';
import type { PhaseResult } from '../src/game/contracts';

function result(phaseId: string, phaseIndex: number): PhaseResult {
  return {
    phaseId,
    phaseName: phaseId,
    phaseIndex,
    phaseCount: CAMPAIGN_PHASE_COUNT,
    victory: true,
    score: 1000,
    timeMs: 1000,
    level: 5,
    perks: [],
    bestScore: null,
    bestTimeMs: null,
    nextPhaseId: null,
  };
}

describe('worlds', () => {
  it('maps three worlds of six phases each', () => {
    expect(WORLDS.map((world) => world.id)).toEqual(['w1', 'w2', 'w3']);
    expect(WORLDS.map((world) => world.phaseCount)).toEqual([6, 6, 6]);
    expect(CAMPAIGN_PHASE_COUNT).toBe(18);
    expect(MAX_PHASE_INDEX).toBe(18);
    expect(PHASES).toHaveLength(19);
  });

  it('resolves global indices to the right world and local level', () => {
    expect(worldForPhaseIndex(0).id).toBe('w1');
    expect(worldForPhaseIndex(1).id).toBe('w1');
    expect(worldForPhaseIndex(6).id).toBe('w1');
    expect(worldForPhaseIndex(7).id).toBe('w2');
    expect(worldForPhaseIndex(12).id).toBe('w2');
    expect(worldForPhaseIndex(13).id).toBe('w3');
    expect(worldForPhaseIndex(18).id).toBe('w3');
    expect(localPhaseIndex(0)).toBe(0);
    expect(localPhaseIndex(1)).toBe(1);
    expect(localPhaseIndex(7)).toBe(1);
    expect(localPhaseIndex(18)).toBe(6);
    expect(lastPhaseIndex(WORLDS[1]!)).toBe(12);
    expect(isWorldFinal(PHASES.find((phase) => phase.id === 'phase-12')!)).toBe(true);
    expect(isWorldFinal(PHASES.find((phase) => phase.id === 'phase-11')!)).toBe(false);
  });

  it('unlocks world II after phase 6 and world III after phase 12', () => {
    let save = createDefaultSave();
    save = applyPhaseResult(save, result('phase-6', 6));
    expect(save.unlockedPhase).toBe(7);
    expect(save.campaignComplete).toBe(true);

    save = applyPhaseResult(save, result('phase-12', 12));
    expect(save.unlockedPhase).toBe(13);

    save = applyPhaseResult(save, result('phase-18', 18));
    expect(save.unlockedPhase).toBe(18);
  });

  it('migrates a v2 save with phase 6 cleared into world II', () => {
    const save = parseSave(
      JSON.stringify({
        version: 2,
        unlockedPhase: 6,
        phases: {
          'phase-6': { bestScore: 9000, bestTimeMs: 1000, attempts: 1, clears: 1, bestLevel: 10 },
        },
        campaignComplete: true,
        meta: { sparks: 10, unlocks: [] },
        updatedAt: 1,
      }),
    );
    expect(save.version).toBe(3);
    expect(save.unlockedPhase).toBe(7);
    expect(save.campaignComplete).toBe(true);
  });

  it('keeps a v3 save with world III progress intact', () => {
    const save = parseSave(
      JSON.stringify({
        version: 3,
        unlockedPhase: 15,
        phases: {
          'phase-12': { clears: 1 },
          'phase-13': { clears: 1 },
          'phase-14': { clears: 1 },
        },
        campaignComplete: true,
        meta: { sparks: 100, unlocks: [] },
        updatedAt: 1,
      }),
    );
    expect(save.unlockedPhase).toBe(15);
    expect(save.version).toBe(3);
  });
});
