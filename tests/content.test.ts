import { describe, expect, it } from 'vitest';
import { CONTENT_LEGEND } from '../src/content/blocks';
import {
  allWaveStats,
  BALL_SPEED_MAX,
  BALL_SPEED_MIN,
  DIFFICULTY_TOLERANCE,
  EXPECTED_WAVE_COUNTS,
  formatContentReport,
  levelUpsForXp,
  MAX_WAVE_ROWS,
  PADDLE_ZONE_TOP,
  PHASES,
  phaseStats,
  validateContent,
  waveStats,
} from '../src/content/phases';
import type { WaveDef as SimWaveDef } from '../src/sim/testWaves';
import { World } from '../src/sim/World';
import { SIM_TUNING_DEFAULTS } from '../src/game/config';
import { PHASE_THEMES, relativeLuminance, themeForPhase } from '../src/render/themes';

const EXPECTED_PHASES = [
  { id: 'phase-1', index: 1, name: 'Crystal Grove' },
  { id: 'phase-2', index: 2, name: 'Ruined Halls' },
  { id: 'phase-3', index: 3, name: 'Arcane Depths' },
  { id: 'phase-4', index: 4, name: 'Frostbound Spire' },
  { id: 'phase-5', index: 5, name: 'Emberforge' },
  { id: 'phase-6', index: 6, name: 'Void Threshold' },
] as const;

const EXPECTED_WAVE_IDS = [
  'p1w1',
  'p1w2',
  'p1w3',
  'p2w1',
  'p2w2',
  'p2w3',
  'p3w1',
  'p3w2',
  'p3w3',
  'p4w1',
  'p4w2',
  'p4w3',
  'p5w1',
  'p5w2',
  'p5w3',
  'p5w4',
  'p6w1',
  'p6w2',
  'p6w3',
  'p6w4',
  'p6w5',
] as const;

function waveById(id: string) {
  const wave = PHASES.flatMap((phase) => phase.waves).find((candidate) => candidate.id === id);
  if (!wave) throw new Error(`missing wave ${id}`);
  return wave;
}

function pacedWaves(waveStatsList: ReturnType<typeof allWaveStats>) {
  return waveStatsList.filter((stats) => !stats.wave.boss && stats.blocks > 0);
}

describe('v0.2.0 content structure', () => {
  it('ships exactly 6 stable phases with the required identities', () => {
    expect(PHASES).toHaveLength(6);
    expect(PHASES.map((phase) => phase.id)).toEqual(EXPECTED_PHASES.map((phase) => phase.id));
    expect(PHASES.map((phase) => phase.index)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(PHASES.map((phase) => phase.name)).toEqual(
      EXPECTED_PHASES.map((phase) => phase.name),
    );
  });

  it('has 3/3/3/3/4/5 waves and 21 unique ids', () => {
    expect(PHASES.map((phase) => phase.waves.length)).toEqual([...EXPECTED_WAVE_COUNTS]);
    const waveIds = PHASES.flatMap((phase) => phase.waves.map((wave) => wave.id));
    expect(waveIds).toEqual([...EXPECTED_WAVE_IDS]);
    expect(new Set(waveIds).size).toBe(21);
  });

  it('produces no validator issues', () => {
    expect(validateContent()).toEqual([]);
  });

  it('keeps the shared legend and valid row shapes on every wave', () => {
    for (const phase of PHASES) {
      for (const wave of phase.waves) {
        expect(wave.legend).toEqual(CONTENT_LEGEND);
        expect(wave.rows.length).toBeGreaterThan(0);
        expect(wave.rows.length).toBeLessThanOrEqual(MAX_WAVE_ROWS);
        const width = wave.rows[0]!.length;
        expect(width).toBe(8);
        for (const row of wave.rows) {
          expect(row).toHaveLength(width);
          for (const char of row) {
            if (char !== '.') expect(wave.legend).toHaveProperty(char);
          }
        }
      }
    }
  });

  it('is structurally assignable to the simulation WaveDef', () => {
    const firstWave: SimWaveDef = PHASES[0]!.waves[0]!;
    expect(firstWave.id).toBe('p1w1');
  });

  it('has the full 9-character legend and uses all 9 block types', () => {
    const keys = Object.keys(CONTENT_LEGEND).sort();
    expect(keys).toEqual(['1', '2', '3', 'e', 'g', 'l', 'm', 'r', 'x']);
    expect(Object.values(CONTENT_LEGEND)).toEqual([
      'crystal',
      'stone',
      'obsidian',
      'explosive',
      'regenerative',
      'moving',
      'multiplier',
      'generator',
      'linked',
    ]);

    const used = new Set<string>();
    for (const phase of PHASES) {
      for (const wave of phase.waves) {
        for (const row of wave.rows) {
          for (const char of row) {
            if (char !== '.') used.add(CONTENT_LEGEND[char as keyof typeof CONTENT_LEGEND]);
          }
        }
      }
    }
    expect(used).toEqual(
      new Set([
        'crystal',
        'stone',
        'obsidian',
        'explosive',
        'regenerative',
        'moving',
        'multiplier',
        'generator',
        'linked',
      ]),
    );
  });

  it('uses every element kind at least once', () => {
    const kinds = new Set(
      PHASES.flatMap((phase) =>
        phase.waves.flatMap((wave) => (wave.elements ?? []).map((element) => element.kind)),
      ),
    );
    expect(kinds).toEqual(
      new Set(['wall', 'obstacle', 'deflector', 'portal', 'mover', 'rotor', 'gate']),
    );
  });

  it('ships exactly 3 bosses with the plan tuning', () => {
    const bosses = PHASES.flatMap((phase) =>
      phase.waves.filter((wave) => wave.boss).map((wave) => wave.boss!),
    );
    expect(bosses).toHaveLength(3);
    expect(bosses.map((boss) => boss.name)).toEqual([
      'Frost Sentinel',
      'Ember Warden',
      'Void Herald',
    ]);
    expect(bosses.map((boss) => boss.pattern)).toEqual(['sentinel', 'warden', 'void']);
    expect(bosses.map((boss) => boss.hp)).toEqual([60, 80, 100]);
    expect(bosses.map((boss) => boss.attackMs)).toEqual([5000, 4500, 4000]);
    expect(bosses.map((boss) => boss.moveSpeed)).toEqual([90, 120, 150]);
    expect(bosses.map((boss) => [boss.widthCells, boss.heightCells, boss.row])).toEqual([
      [3, 2, 1],
      [4, 2, 1],
      [4, 2, 0],
    ]);
  });

  it('places the required challenge rules on the required waves', () => {
    expect(waveById('p4w2').rules).toEqual([{ kind: 'timeLimit', ms: 65000 }]);
    expect(waveById('p5w2').rules).toEqual([{ kind: 'noLaser' }]);
    expect(waveById('p5w3').rules).toEqual([{ kind: 'timeLimit', ms: 60000 }]);
    expect(waveById('p6w2').rules).toEqual([{ kind: 'timeLimit', ms: 75000 }]);
    expect(waveById('p6w4').rules).toEqual([{ kind: 'noLaser' }]);

    const ruled = PHASES.flatMap((phase) =>
      phase.waves.filter((wave) => wave.rules && wave.rules.length > 0).map((wave) => wave.id),
    );
    expect(ruled).toEqual(['p4w2', 'p5w2', 'p5w3', 'p6w2', 'p6w4']);
  });

  it('never places a block or the scaled grid in the paddle zone', () => {
    for (const stats of allWaveStats()) {
      expect(stats.gridBottom).toBeLessThan(PADDLE_ZONE_TOP);
    }
  });

  it('gives every new wave a short English intro', () => {
    for (const phase of PHASES.slice(3)) {
      for (const wave of phase.waves) {
        expect(wave.intro?.trim().length ?? 0).toBeGreaterThan(0);
      }
    }
  });
});

describe('v0.2.0 content pacing', () => {
  it('increases ball speed within each phase and keeps phase peaks moving forward', () => {
    const maxima: number[] = [];
    for (const phase of PHASES) {
      let previous = BALL_SPEED_MIN;
      for (const wave of phase.waves) {
        expect(wave.ballSpeed).toBeGreaterThanOrEqual(BALL_SPEED_MIN);
        expect(wave.ballSpeed).toBeLessThanOrEqual(BALL_SPEED_MAX);
        expect(wave.ballSpeed).toBeGreaterThan(previous);
        previous = wave.ballSpeed;
      }
      maxima.push(previous);
    }
    for (let index = 1; index < maxima.length; index += 1) {
      // Phase 4 intentionally resets pace after phase 3, so the 5% slack
      // applies to the cross-phase peak comparison.
      expect(maxima[index]! + maxima[index - 1]! * DIFFICULTY_TOLERANCE).toBeGreaterThanOrEqual(
        maxima[index - 1]!,
      );
    }
  });

  it('keeps average HP and difficulty monotonic inside each phase', () => {
    for (const phase of PHASES) {
      const paced = pacedWaves(phaseStats(phase).waves);
      for (let index = 1; index < paced.length; index += 1) {
        const previous = paced[index - 1]!;
        const current = paced[index]!;
        expect(current.avgHp + previous.avgHp * DIFFICULTY_TOLERANCE).toBeGreaterThanOrEqual(
          previous.avgHp,
        );
        expect(
          current.difficulty + previous.difficulty * DIFFICULTY_TOLERANCE,
        ).toBeGreaterThanOrEqual(previous.difficulty);
      }
    }
  });

  it('keeps each phase peak at or above the previous phase peak', () => {
    const peaks = PHASES.map((phase) => {
      const paced = pacedWaves(phaseStats(phase).waves);
      return {
        avgHp: Math.max(...paced.map((stats) => stats.avgHp)),
        difficulty: Math.max(...paced.map((stats) => stats.difficulty)),
      };
    });
    for (let index = 1; index < peaks.length; index += 1) {
      const previous = peaks[index - 1]!;
      const current = peaks[index]!;
      expect(current.avgHp + previous.avgHp * DIFFICULTY_TOLERANCE).toBeGreaterThanOrEqual(
        previous.avgHp,
      );
      expect(
        current.difficulty + previous.difficulty * DIFFICULTY_TOLERANCE,
      ).toBeGreaterThanOrEqual(previous.difficulty);
    }
  });

  it('offers 4-16 level ups per phase on the G4 curve', () => {
    for (const phase of PHASES) {
      const stats = phaseStats(phase);
      expect(stats.levelUps).toBeGreaterThanOrEqual(4);
      expect(stats.levelUps).toBeLessThanOrEqual(16);
      expect(stats.levelUps).toBe(levelUpsForXp(stats.hp));
    }
    expect(levelUpsForXp(20)).toBe(1);
    expect(levelUpsForXp(90)).toBe(4);
    expect(levelUpsForXp(140)).toBe(5);
    expect(levelUpsForXp(200)).toBe(6);
  });

  it('prints a concise 6-phase, 21-wave report for the CLI', () => {
    const report = formatContentReport();
    expect(report).toContain('Level 1 - Crystal Grove');
    expect(report).toContain('Level 6 - Void Threshold');
    expect(report).toContain('Totals: levels=6 waves=21');
    expect(report.match(/^Level /gm)).toHaveLength(6);
    expect(report).toContain('p6w5');
  });
});

describe('v0.2.0 themes', () => {
  it('ships one theme per phase with the new backdrop shapes', () => {
    expect(PHASE_THEMES).toHaveLength(6);
    expect(PHASE_THEMES.map((theme) => theme.id)).toEqual(
      EXPECTED_PHASES.map((phase) => phase.id),
    );
    expect(PHASE_THEMES.map((theme) => theme.shape)).toEqual([
      'crystal',
      'ruins',
      'arcane',
      'frost',
      'forge',
      'void',
    ]);
    expect(themeForPhase('phase-6', 5).name).toBe('Void Threshold');
    expect(themeForPhase('missing', 3).shape).toBe('frost');
  });

  it('keeps accents readable against each sky gradient', () => {
    for (const theme of PHASE_THEMES) {
      expect(relativeLuminance(theme.accent)).toBeGreaterThan(
        relativeLuminance(theme.skyMid) + 0.2,
      );
      expect(relativeLuminance(theme.frameBright)).toBeGreaterThan(
        relativeLuminance(theme.frame),
      );
    }
  });

  it('gives the three new palettes distinct hues', () => {
    const newThemes = PHASE_THEMES.slice(3);
    expect(newThemes.map((theme) => theme.glow)).toEqual([0x66d9ff, 0xff7a2e, 0xa46bff]);
    expect(new Set(newThemes.map((theme) => theme.skyMid)).size).toBe(3);
  });
});

describe('v0.2.0 content clearability', () => {
  it('loads every wave into the real World with the expected blocks, elements and boss', () => {
    for (const phase of PHASES) {
      for (const wave of phase.waves) {
        const stats = waveStats(phase, wave);
        const world = new World({
          wave,
          height: 1280,
          tuning: { ...SIM_TUNING_DEFAULTS },
          seed: 1,
        });
        world.reset();

        expect(world.blocks).toHaveLength(stats.blocks);
        expect(world.elements).toHaveLength(wave.elements?.length ?? 0);
        for (const block of world.blocks) {
          expect(block.hp).toBeGreaterThan(0);
          expect(block.top + block.height).toBeLessThan(PADDLE_ZONE_TOP);
        }

        if (wave.boss) {
          expect(world.boss).not.toBeNull();
          expect(world.boss!.name).toBe(wave.boss.name);
          expect(world.boss!.maxHp).toBe(wave.boss.hp);
          expect(world.boss!.pattern).toBe(wave.boss.pattern);
        } else {
          expect(world.boss).toBeNull();
        }

        // Removing the field (and defeating the boss) must clear the wave.
        world.blocks.length = 0;
        if (world.boss) world.damageBoss(world.boss.maxHp);
        world.step();
        expect(world.outcome).toBe('cleared');
      }
    }
  });

  it('keeps boss waves clearable with zero blocks', () => {
    for (const phase of PHASES) {
      for (const wave of phase.waves) {
        if (!wave.boss) continue;
        const world = new World({
          wave,
          height: 1280,
          tuning: { ...SIM_TUNING_DEFAULTS },
          seed: 1,
        });
        world.reset();
        world.blocks.length = 0;
        world.damageBoss(world.boss!.maxHp);
        world.step();
        expect(world.outcome).toBe('cleared');
      }
    }
  });
});
