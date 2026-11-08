import { describe, expect, it } from 'vitest';
import { CONTENT_LEGEND } from '../src/content/blocks';
import {
  allWaveStats,
  BALL_SPEED_MAX,
  BALL_SPEED_MIN,
  DIFFICULTY_TOLERANCE,
  formatContentReport,
  levelUpsForXp,
  PADDLE_ZONE_TOP,
  PHASES,
  phaseStats,
  validateContent,
  waveStats,
} from '../src/content/phases';
import type { WaveDef as SimWaveDef } from '../src/sim/testWaves';
import { World } from '../src/sim/World';
import { SIM_TUNING_DEFAULTS } from '../src/game/config';

const EXPECTED_PHASES = [
  { id: 'phase-1', index: 1, name: 'Crystal Grove' },
  { id: 'phase-2', index: 2, name: 'Ruined Halls' },
  { id: 'phase-3', index: 3, name: 'Arcane Depths' },
] as const;

describe('M3 content structure', () => {
  it('ships exactly 3 stable phases with the required identities', () => {
    expect(PHASES).toHaveLength(3);
    expect(PHASES.map((phase) => phase.id)).toEqual(
      EXPECTED_PHASES.map((phase) => phase.id),
    );
    expect(PHASES.map((phase) => phase.index)).toEqual([1, 2, 3]);
    expect(PHASES.map((phase) => phase.name)).toEqual(
      EXPECTED_PHASES.map((phase) => phase.name),
    );
  });

  it('has exactly 3 waves per phase and 9 unique wave ids', () => {
    const waveIds = PHASES.flatMap((phase) => phase.waves.map((wave) => wave.id));
    expect(waveIds).toHaveLength(9);
    expect(new Set(waveIds).size).toBe(9);
    for (const phase of PHASES) {
      expect(phase.waves).toHaveLength(3);
    }
  });

  it('produces no validator issues', () => {
    expect(validateContent()).toEqual([]);
  });

  it('keeps the same legend and valid row shapes on every wave', () => {
    for (const phase of PHASES) {
      for (const wave of phase.waves) {
        expect(wave.legend).toEqual(CONTENT_LEGEND);
        expect(wave.rows.length).toBeGreaterThan(0);
        const width = wave.rows[0]!.length;
        expect(width).toBeGreaterThan(0);
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

  it('references only valid block types with 1/2/3 HP', () => {
    for (const phase of PHASES) {
      for (const wave of phase.waves) {
        for (const type of Object.values(wave.legend)) {
          expect(['crystal', 'stone', 'obsidian']).toContain(type);
        }
      }
    }
    expect(Object.keys(CONTENT_LEGEND).sort()).toEqual(['1', '2', '3']);
    expect(CONTENT_LEGEND['1']).toBe('crystal');
    expect(CONTENT_LEGEND['2']).toBe('stone');
    expect(CONTENT_LEGEND['3']).toBe('obsidian');
  });

  it('never places a block in the paddle zone and keeps at least one block', () => {
    for (const stats of allWaveStats()) {
      expect(stats.blocks).toBeGreaterThan(0);
      expect(stats.gridBottom).toBeLessThan(PADDLE_ZONE_TOP);
    }
  });
});

describe('M3 content pacing', () => {
  it('increases ball speed within each phase and across phase maxima', () => {
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
      expect(maxima[index]!).toBeGreaterThan(maxima[index - 1]!);
    }
  });

  it('keeps average HP and the combined difficulty monotonic with tolerance', () => {
    const ordered = allWaveStats();
    for (let index = 1; index < ordered.length; index += 1) {
      const previous = ordered[index - 1]!;
      const current = ordered[index]!;
      expect(current.avgHp + DIFFICULTY_TOLERANCE).toBeGreaterThanOrEqual(
        previous.avgHp,
      );
      expect(current.difficulty + DIFFICULTY_TOLERANCE).toBeGreaterThanOrEqual(
        previous.difficulty,
      );
    }
  });

  it('offers roughly 4-8 level ups per phase on the G4 13/20/26 curve', () => {
    for (const phase of PHASES) {
      const stats = phaseStats(phase);
      expect(stats.levelUps).toBeGreaterThanOrEqual(4);
      expect(stats.levelUps).toBeLessThanOrEqual(8);
      expect(stats.levelUps).toBe(levelUpsForXp(stats.hp));
    }
    expect(levelUpsForXp(20)).toBe(1);
    expect(levelUpsForXp(90)).toBe(4);
    expect(levelUpsForXp(140)).toBe(5);
    expect(levelUpsForXp(200)).toBe(6);
  });

  it('prints a concise report for the CLI', () => {
    const report = formatContentReport();
    expect(report).toContain('Level 1 - Crystal Grove');
    expect(report).toContain('Level 3 - Arcane Depths');
    expect(report).toContain('Totals: levels=3 waves=9');
  });
});

describe('M3 content clearability', () => {
  it('loads into the real World and can be cleared without impossible blocks', () => {
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
        for (const block of world.blocks) {
          expect(block.hp).toBeGreaterThan(0);
          expect(block.top + block.height).toBeLessThan(PADDLE_ZONE_TOP);
        }

        // Every block is reachable from below; removing the field must clear.
        world.blocks.length = 0;
        world.step();
        expect(world.outcome).toBe('cleared');
      }
    }
  });
});
