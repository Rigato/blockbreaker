import { describe, expect, it } from 'vitest';
import { PHASES } from '../src/content/phases';
import { summarizePhase } from '../src/content/phasePresentation';

describe('phase presentation', () => {
  it('summarizes every phase with a tagline and content highlights', () => {
    for (const phase of PHASES) {
      const summary = summarizePhase(phase);
      expect(phase.tagline).toBeTruthy();
      expect(summary.features.length).toBeGreaterThan(0);
      expect(summary.features.length).toBeLessThanOrEqual(4);
    }
  });

  it('reports bosses only for campaign phases 4-6', () => {
    const bosses = PHASES.map((phase) => summarizePhase(phase).bossName);
    expect(bosses.slice(0, 4)).toEqual([null, null, null, null]);
    expect(bosses[4]).toBe('Frost Sentinel');
    expect(bosses[5]).toBe('Ember Warden');
    expect(bosses[6]).toBe('Void Herald');
  });

  it('derives the phase-6 special-block feature from the wave data', () => {
    const summary = summarizePhase(PHASES.find((phase) => phase.id === 'phase-6')!);
    expect(summary.features.join(' | ')).toMatch(/Moving/);
    expect(summary.features.join(' | ')).toMatch(/Generators|Linked/);
  });

  it('falls back to a classic highlight for early campaign phases', () => {
    expect(summarizePhase(PHASES.find((phase) => phase.id === 'phase-1')!).features).toContain(
      'Classic',
    );
  });
});
