import { describe, expect, it } from 'vitest';
import { endingForResult } from '../src/content/endings';

function victory(overrides: Partial<Parameters<typeof endingForResult>[0]> = {}) {
  return endingForResult({
    phaseIndex: 1,
    phaseName: 'Crystal Grove',
    phaseCount: 6,
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

  it('ends phase 6 with the campaign finale', () => {
    const ending = victory({
      phaseIndex: 6,
      phaseName: 'Void Threshold',
      score: 6000,
    });

    expect(ending?.id).toBe('campaign-complete');
    expect(ending?.title).toBe('Campaign complete');
    expect(ending?.rank).toBe('S');
    expect(ending?.body.toLowerCase()).toContain('void herald');
  });

  it('uses the defeat note and rank B when the run falls', () => {
    const ending = endingForResult({
      phaseIndex: 2,
      phaseName: 'Ruined Halls',
      phaseCount: 6,
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
