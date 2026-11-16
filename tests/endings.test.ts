import { describe, expect, it } from 'vitest';
import { endingForResult, victoryRank } from '../src/content/endings';

function victory(overrides: Partial<Parameters<typeof endingForResult>[0]> = {}) {
  return endingForResult({
    phaseIndex: 1,
    phaseName: 'Crystal Grove',
    phaseCount: 18,
    victory: true,
    score: 0,
    timeMs: 60_000,
    ...overrides,
  });
}

describe('endingForResult', () => {
  it('returns a phase 1 epilogue with title and body', () => {
    const ending = victory({ score: 100 });

    expect(ending).not.toBeNull();
    expect(ending?.id).toBe('epilogue-phase-1');
    expect(ending?.title.length).toBeGreaterThan(0);
    expect(ending?.body).toContain('crystal');
    expect(ending?.body).not.toContain('**');
  });

  it('ends phase 6 with the world I epilogue and phase 18 with the campaign finale', () => {
    const worldOne = victory({
      phaseIndex: 6,
      phaseName: 'Void Threshold',
      score: 6000,
    });
    expect(worldOne?.id).toBe('epilogue-phase-6');
    expect(worldOne?.title).toBe('The Vale holds');
    expect(worldOne?.body.toLowerCase()).toContain('void herald');

    const finale = victory({
      phaseIndex: 18,
      phaseName: 'Sunder Core',
      score: 6000,
    });
    expect(finale?.id).toBe('campaign-complete');
    expect(finale?.title).toBe('The engine stops');
    expect(finale?.rank).toBe('S');
    expect(finale?.body.toLowerCase()).toContain('lattice');
  });

  it('uses the defeat note and rank B when the run falls', () => {
    const ending = endingForResult({
      phaseIndex: 2,
      phaseName: 'Ruined Halls',
      phaseCount: 18,
      victory: false,
      score: 99_999,
      timeMs: 1_000,
    });

    expect(ending).toEqual({
      id: 'defeat-phase-2',
      title: 'The field falls silent',
      body: expect.stringContaining('Ruined Halls'),
      rank: 'B',
    });
  });

  it('ranks S above 1.5x target, A at target and B below it', () => {
    // Phase 1 target = 1000 + 1 * 400 = 1400; S threshold = 2100.
    expect(victory({ score: 2099 })?.rank).toBe('A');
    expect(victory({ score: 2100 })?.rank).toBe('S');
    expect(victory({ score: 1400 })?.rank).toBe('A');
    expect(victory({ score: 1399 })?.rank).toBe('B');
  });

  it('scales the rank target with the phase index', () => {
    // Phase 5 target = 1000 + 5 * 400 = 3000; S threshold = 4500.
    expect(victory({ phaseIndex: 5, phaseName: 'Emberforge', score: 3000 })?.rank).toBe('A');
    expect(victory({ phaseIndex: 5, phaseName: 'Emberforge', score: 4499 })?.rank).toBe('A');
    expect(victory({ phaseIndex: 5, phaseName: 'Emberforge', score: 4500 })?.rank).toBe('S');
  });
});

describe('victoryRank', () => {
  it('ranks each phase against its own target', () => {
    // Phase 1 target 1400, S from 2100.
    expect(victoryRank(1, 0)).toBe('B');
    expect(victoryRank(1, 1399)).toBe('B');
    expect(victoryRank(1, 1400)).toBe('A');
    expect(victoryRank(1, 2099)).toBe('A');
    expect(victoryRank(1, 2100)).toBe('S');

    // Phase 3 target 2200, S from 3300.
    expect(victoryRank(3, 2199)).toBe('B');
    expect(victoryRank(3, 2200)).toBe('A');
    expect(victoryRank(3, 3299)).toBe('A');
    expect(victoryRank(3, 3300)).toBe('S');

    // Phase 6 target 3400, S from 5100.
    expect(victoryRank(6, 3399)).toBe('B');
    expect(victoryRank(6, 3400)).toBe('A');
    expect(victoryRank(6, 5099)).toBe('A');
    expect(victoryRank(6, 5100)).toBe('S');
  });
});
