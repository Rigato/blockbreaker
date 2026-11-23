import { describe, expect, it } from 'vitest';
import { CONTENT_LEGEND } from '../src/content/blocks';
import {
  allWaveStats,
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
import { WORLDS, localPhaseIndex, worldForPhaseIndex } from '../src/content/worlds';
import type { WaveDef as SimWaveDef } from '../src/sim/testWaves';
import { World } from '../src/sim/World';
import { GAME_CONFIG, SIM_TUNING_DEFAULTS } from '../src/game/config';
import { PHASE_THEMES, relativeLuminance, themeForPhase } from '../src/render/themes';

const EXPECTED_PHASE_NAMES = [
  'Tutorial',
  'Crystal Grove',
  'Ruined Halls',
  'Arcane Depths',
  'Frostbound Spire',
  'Emberforge',
  'Void Threshold',
  'Splashdown Docks',
  'Signal Yard',
  'Maglev Spine',
  'Relay Grid',
  'Hardlight Weave',
  'The Lattice Core',
  'Slag Yard',
  'Rustline Depot',
  'Ash Foundry',
  'Boilerworks',
  'Crown Stack',
  'Sunder Core',
] as const;

function waveById(id: string) {
  const wave = PHASES.flatMap((phase) => phase.waves).find((candidate) => candidate.id === id);
  if (!wave) throw new Error(`missing wave ${id}`);
  return wave;
}

function pacedWaves(waveStatsList: ReturnType<typeof allWaveStats>) {
  return waveStatsList.filter((stats) => !stats.wave.boss && stats.blocks > 0);
}

describe('multi-world content structure', () => {
  it('ships the tutorial plus three worlds of six stable phases', () => {
    expect(PHASES).toHaveLength(19);
    expect(PHASES.map((phase) => phase.index)).toEqual(
      Array.from({ length: 19 }, (_, index) => index),
    );
    expect(PHASES.map((phase) => phase.name)).toEqual([...EXPECTED_PHASE_NAMES]);
    expect(WORLDS.map((world) => world.phaseCount)).toEqual([6, 6, 6]);
    for (const phase of PHASES) {
      expect(phase.worldId).toBe(worldForPhaseIndex(phase.index).id);
      expect(phase.localIndex).toBe(localPhaseIndex(phase.index));
    }
  });

  it('has the expected waves and unique ids', () => {
    expect(PHASES.map((phase) => phase.waves.length)).toEqual([...EXPECTED_WAVE_COUNTS]);
    const waveIds = PHASES.flatMap((phase) => phase.waves.map((wave) => wave.id));
    expect(waveIds).toHaveLength(71);
    expect(new Set(waveIds).size).toBe(71);
    expect(waveIds).toContain('p7w1');
    expect(waveIds).toContain('p12w5');
    expect(waveIds).toContain('p18w5');
  });

  it('keeps the tutorial short: four 1 HP blocks, first perk at three kills', () => {
    const tutorial = PHASES.find((phase) => phase.tutorial);
    expect(tutorial).toBeDefined();
    const stats = phaseStats(tutorial!);
    expect(stats.waves.map((wave) => wave.blocks)).toEqual([4, 8]);
    expect(stats.blocks).toBe(12);
    expect(stats.hp).toBe(15);
    expect(stats.levelUps).toBe(1);

    // The first wave must be the simplest possible field: 1 HP only, four
    // rows lower so the first rally reaches the blocks quickly.
    const firstWave = tutorial!.waves[0]!;
    expect(firstWave.rows).toHaveLength(5);
    expect(firstWave.rows.slice(0, 4)).toEqual([
      '........',
      '........',
      '........',
      '........',
    ]);
    expect(firstWave.rows[4]).toBe('..1111..');

    // 3 of 4 kills (75%) fill the tutorial bar.
    expect(GAME_CONFIG.progression.tutorialFirstLevelXp).toBe(3);
    expect(
      GAME_CONFIG.progression.tutorialFirstLevelXp / stats.waves[0]!.blocks,
    ).toBeCloseTo(0.75);

    // Wave 2 introduces 2 HP blocks and an explosive block.
    expect(tutorial!.waves[1]!.rows.join('')).toContain('e');
    expect(tutorial!.waves[1]!.rows.join('')).toContain('2');
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
    expect(firstWave.id).toBe('tutw1');
  });

  it('has the full 17-character legend and uses every block type', () => {
    const keys = Object.keys(CONTENT_LEGEND).sort();
    expect(keys).toEqual([
      '1',
      '2',
      '3',
      'a',
      'b',
      'e',
      'f',
      'g',
      'l',
      'm',
      'n',
      'p',
      'r',
      's',
      't',
      'x',
      'y',
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
    expect(used.size).toBe(17);
    expect(used).toContain('alloy');
    expect(used).toContain('plated');
    expect(used).toContain('fused');
  });

  it('uses every element kind at least once', () => {
    const kinds = new Set(
      PHASES.flatMap((phase) =>
        phase.waves.flatMap((wave) => (wave.elements ?? []).map((element) => element.kind)),
      ),
    );
    expect(kinds).toEqual(
      new Set([
        'wall',
        'obstacle',
        'deflector',
        'portal',
        'mover',
        'rotor',
        'gate',
        'press',
        'belt',
        'rail',
      ]),
    );
  });

  it('ships nine bosses with distinct verbs and tuning', () => {
    const bosses = PHASES.flatMap((phase) =>
      phase.waves.filter((wave) => wave.boss).map((wave) => wave.boss!),
    );
    expect(bosses).toHaveLength(9);
    expect(bosses.map((boss) => boss.name)).toEqual([
      'Frost Sentinel',
      'Ember Warden',
      'Void Herald',
      'Nullframe Warden',
      'Maglev Dreadnought',
      'Lattice Hierophant',
      'Boiler Matron',
      'The Riveter',
      'The Last Engine',
    ]);
    expect(bosses.map((boss) => boss.pattern)).toEqual([
      'sentinel',
      'warden',
      'void',
      'spread',
      'charger',
      'aimed',
      'matron',
      'riveter',
      'engine',
    ]);
    expect(bosses.map((boss) => boss.hp)).toEqual([
      60, 80, 100, 150, 190, 240, 140, 175, 210,
    ]);
  });

  it('places challenge rules across the worlds', () => {
    expect(waveById('p4w2').rules).toEqual([{ kind: 'timeLimit', ms: 65000 }]);
    expect(waveById('p5w2').rules).toEqual([{ kind: 'noLaser' }]);
    expect(waveById('p6w2').rules).toEqual([{ kind: 'timeLimit', ms: 75000 }]);
    expect(waveById('p12w3').rules).toContainEqual({ kind: 'noLaser' });
    expect(waveById('p15w3').rules).toContainEqual(
      expect.objectContaining({ kind: 'gust' }),
    );
    expect(waveById('p16w4').rules).toEqual([{ kind: 'noMultiball' }]);

    const kinds = new Set(
      PHASES.flatMap((phase) =>
        phase.waves.flatMap((wave) => (wave.rules ?? []).map((rule) => rule.kind)),
      ),
    );
    expect(kinds).toEqual(new Set(['timeLimit', 'noLaser', 'noMultiball', 'gust']));
  });

  it('never places a block or the scaled grid in the paddle zone', () => {
    for (const stats of allWaveStats()) {
      expect(stats.gridBottom).toBeLessThan(PADDLE_ZONE_TOP);
    }
  });

  it('gives every new wave a short English intro', () => {
    for (const phase of PHASES.filter((candidate) => candidate.index >= 4)) {
      for (const wave of phase.waves) {
        expect(wave.intro?.trim().length ?? 0).toBeGreaterThan(0);
      }
    }
  });
});

describe('multi-world content pacing', () => {
  it('increases ball speed within each phase and respects each world cap', () => {
    for (const phase of PHASES) {
      const world = worldForPhaseIndex(phase.index);
      let previous = BALL_SPEED_MIN;
      for (const wave of phase.waves) {
        expect(wave.ballSpeed).toBeGreaterThanOrEqual(BALL_SPEED_MIN);
        expect(wave.ballSpeed).toBeLessThanOrEqual(world.speedMax);
        expect(wave.ballSpeed).toBeGreaterThan(previous);
        previous = wave.ballSpeed;
      }
    }
  });

  it('allows a world to open slower than the previous world ended', () => {
    const w1Final = PHASES.find((phase) => phase.index === 6)!;
    const w2Opening = PHASES.find((phase) => phase.index === 7)!;
    const w2Final = PHASES.find((phase) => phase.index === 12)!;
    const w3Opening = PHASES.find((phase) => phase.index === 13)!;
    expect(w2Opening.waves[0]!.ballSpeed).toBeLessThan(
      w1Final.waves.at(-1)!.ballSpeed,
    );
    expect(w3Opening.waves[0]!.ballSpeed).toBeLessThan(
      w2Final.waves.at(-1)!.ballSpeed,
    );
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

  it('keeps each phase peak at or above the previous phase peak inside its world', () => {
    for (const world of WORLDS) {
      const peaks = PHASES.filter(
        (phase) => phase.worldId === world.id && !phase.tutorial,
      ).map((phase) => {
        const paced = pacedWaves(phaseStats(phase).waves);
        return {
          avgHp: Math.max(...paced.map((stats) => stats.avgHp)),
          difficulty: Math.max(...paced.map((stats) => stats.difficulty)),
        };
      });
      for (let index = 1; index < peaks.length; index += 1) {
        const previous = peaks[index - 1]!;
        const current = peaks[index]!;
        expect(
          current.avgHp + previous.avgHp * DIFFICULTY_TOLERANCE,
        ).toBeGreaterThanOrEqual(previous.avgHp);
        expect(
          current.difficulty + previous.difficulty * DIFFICULTY_TOLERANCE,
        ).toBeGreaterThanOrEqual(previous.difficulty);
      }
    }
  });

  it('offers 2-16 level ups per campaign phase and one in the tutorial', () => {
    for (const phase of PHASES) {
      const stats = phaseStats(phase);
      expect(stats.levelUps).toBeGreaterThanOrEqual(phase.tutorial ? 1 : 2);
      expect(stats.levelUps).toBeLessThanOrEqual(16);
      expect(stats.levelUps).toBe(
        levelUpsForXp(
          stats.hp,
          phase.tutorial
            ? GAME_CONFIG.progression.tutorialFirstLevelXp
            : undefined,
        ),
      );
    }
    expect(levelUpsForXp(20)).toBe(1);
    expect(levelUpsForXp(90)).toBe(4);
    expect(levelUpsForXp(140)).toBe(5);
    expect(levelUpsForXp(200)).toBe(6);
  });

  it('prints a concise three-world report for the CLI', () => {
    const report = formatContentReport();
    expect(report).toContain('Tutorial - Tutorial (tutorial)');
    expect(report).toContain('Level 1 - Crystal Grove');
    expect(report).toContain('Level 7 - Splashdown Docks');
    expect(report).toContain('Level 13 - Slag Yard');
    expect(report).toContain('Level 18 - Sunder Core');
    expect(report).toContain('Totals: levels=19 waves=71');
    expect(report.match(/^Level /gm)).toHaveLength(18);
    expect(report).toContain('p18w5');
  });
});

describe('multi-world themes', () => {
  it('ships one theme per campaign phase', () => {
    expect(PHASE_THEMES).toHaveLength(18);
    expect(PHASE_THEMES.map((theme) => theme.id)).toEqual(
      Array.from({ length: 18 }, (_, index) => `phase-${index + 1}`),
    );
    expect(themeForPhase('phase-6', 5).name).toBe('Void Threshold');
    expect(themeForPhase('phase-18', 17).name).toBe('Sunder Core');
    expect(themeForPhase('missing', 3).shape).toBe('frost');
    expect(themeForPhase('missing', 99).id).toBe('phase-18');
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

  it('gives the new worlds distinct palettes', () => {
    const world2 = PHASE_THEMES.filter(
      (theme) => Number(theme.id.split('-')[1]) >= 7 && Number(theme.id.split('-')[1]) <= 12,
    );
    const world3 = PHASE_THEMES.filter((theme) => Number(theme.id.split('-')[1]) >= 13);
    expect(world2).toHaveLength(6);
    expect(world3).toHaveLength(6);
    expect(new Set(world2.map((theme) => theme.glow)).size).toBeGreaterThan(2);
    expect(new Set(world3.map((theme) => theme.glow)).size).toBeGreaterThan(1);
  });
});

describe('multi-world content clearability', () => {
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
