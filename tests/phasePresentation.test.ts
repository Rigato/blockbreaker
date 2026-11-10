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

  it('reports bosses only for phases 4-6', () => {
    const bosses = PHASES.map((phase) => summarizePhase(phase).bossName);
    expect(bosses.slice(0, 3)).toEqual([null, null, null]);
    expect(bosses[3]).toBe('Frost Sentinel');
    expect(bosses[4]).toBe('Ember Warden');
    expect(bosses[5]).toBe('Void Herald');
  });

  it('derives the phase-6 special-block feature from the wave data', () => {
    const summary = summarizePhase(PHASES[5]!);
    expect(summary.features.join(' | ')).toMatch(/Moving/);
    expect(summary.features.join(' | ')).toMatch(/Generators|Linked/);
  });

  it('falls back to a classic highlight for early phases', () => {
    expect(summarizePhase(PHASES[0]!).features).toContain('Classic');
  });
});
