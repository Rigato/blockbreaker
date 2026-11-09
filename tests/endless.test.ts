import { describe, expect, it } from 'vitest';
import { CONTENT_LEGEND } from '../src/content/blocks';
import {
  ENDLESS_BASE_SPEED,
  ENDLESS_MAX_ROWS,
  ENDLESS_MAX_SPEED,
  ENDLESS_PHASE,
  ENDLESS_SPEED_STEP,
  endlessBallSpeed,
  endlessBoss,
  endlessEnding,
  endlessWave,
} from '../src/content/endless';
import type { WaveDef } from '../src/content/types';
import { SIM_TUNING_DEFAULTS } from '../src/game/config';
import { World } from '../src/sim/World';

const ALL_BLOCK_TYPES = [
  'crystal',
  'stone',
  'obsidian',
  'explosive',
  'regenerative',
  'moving',
  'multiplier',
  'generator',
  'linked',
] as const;

const ALL_ELEMENT_KINDS = [
  'wall',
  'obstacle',
  'deflector',
  'portal',
  'mover',
  'rotor',
  'gate',
] as const;

function blockChars(wave: WaveDef): Set<string> {
  const chars = new Set<string>();
  for (const row of wave.rows) {
    for (const char of row) {
      if (char !== '.') chars.add(wave.legend[char]!);
    }
  }
  return chars;
}

describe('endless mode phase', () => {
  it('exposes a single infinite phase with the expected identity', () => {
    expect(ENDLESS_PHASE).toEqual({ id: 'endless', index: 0, name: 'Endless', waves: [] });
    expect(ENDLESS_BASE_SPEED).toBe(660);
    expect(ENDLESS_SPEED_STEP).toBe(14);
    expect(ENDLESS_MAX_SPEED).toBe(1100);
    expect(ENDLESS_MAX_ROWS).toBe(12);
  });
});

describe('endless ball speed', () => {
  it('ramps from the base speed and saturates at the cap', () => {
    expect(endlessBallSpeed(1)).toBe(660);
    expect(endlessBallSpeed(10)).toBeGreaterThan(780);
    expect(endlessBallSpeed(32)).toBe(1100);
    expect(endlessBallSpeed(100)).toBe(1100);
  });

  it('clamps invalid waves to wave 1', () => {
    expect(endlessBallSpeed(0)).toBe(660);
    expect(endlessBallSpeed(-5)).toBe(660);
    expect(endlessBallSpeed(Number.NaN)).toBe(660);
    expect(endlessBallSpeed(2.9)).toBe(674);
  });
});

describe('endless rows', () => {
  it('grows from 4 to the 12-row cap', () => {
    expect(endlessWave(1, 1).rows).toHaveLength(4);
    expect(endlessWave(5, 1).rows).toHaveLength(6);
    expect(endlessWave(15, 1).rows).toHaveLength(11);
    expect(endlessWave(20, 1).rows).toHaveLength(12);
    expect(endlessWave(50, 1).rows).toHaveLength(12);
  });
});

describe('endless bosses', () => {
  it('spawns only on multiples of five', () => {
    for (const wave of [1, 2, 3, 4, 6, 7, 9, 11, 14, 16]) {
      expect(endlessBoss(wave)).toBeNull();
      expect(endlessWave(wave, 1).boss).toBeUndefined();
    }
  });

  it('cycles sentinel, warden and void every five waves', () => {
    expect(endlessBoss(5)!.name).toBe('Frost Sentinel');
    expect(endlessBoss(5)!.pattern).toBe('sentinel');
    expect(endlessBoss(10)!.name).toBe('Ember Warden');
    expect(endlessBoss(10)!.pattern).toBe('warden');
    expect(endlessBoss(15)!.name).toBe('Void Herald');
    expect(endlessBoss(15)!.pattern).toBe('void');
    expect(endlessBoss(20)!.pattern).toBe('sentinel');
    expect(endlessBoss(25)!.pattern).toBe('warden');
    expect(endlessBoss(30)!.pattern).toBe('void');
  });

  it('scales hp, attack interval and movement, with the right footprint', () => {
    const waves = [5, 10, 15, 20];
    const bosses = waves.map((wave) => endlessBoss(wave)!);
    for (let index = 1; index < bosses.length; index += 1) {
      expect(bosses[index]!.hp).toBeGreaterThan(bosses[index - 1]!.hp);
    }
    expect(bosses.map((boss) => boss.hp)).toEqual([70, 100, 130, 160]);
    expect(bosses.map((boss) => boss.attackMs)).toEqual([4700, 4400, 4100, 3800]);
    expect(bosses.map((boss) => boss.moveSpeed)).toEqual([105, 120, 135, 150]);
    expect(bosses.map((boss) => [boss.widthCells, boss.heightCells, boss.row])).toEqual([
      [3, 2, 0],
      [4, 2, 0],
      [3, 2, 0],
      [3, 2, 0],
    ]);
    expect(endlessWave(5, 1).name).toBe('Frost Sentinel');
    expect(endlessWave(5, 1).intro).toContain('Boss wave');
  });
});

describe('endless block variety', () => {
  it('uses all nine block types within the first fifteen waves', () => {
    const used = new Set<string>();
    for (const seed of [1, 2, 3, 7, 42]) {
      for (let wave = 1; wave <= 15; wave += 1) {
        for (const type of blockChars(endlessWave(wave, seed))) used.add(type);
      }
    }
    expect([...used].sort()).toEqual([...ALL_BLOCK_TYPES].sort());
  });

  it('uses all seven element kinds by wave 14', () => {
    const used = new Set<string>();
    for (let wave = 2; wave <= 14; wave += 1) {
      for (const element of endlessWave(wave, 1).elements ?? []) used.add(element.kind);
    }
    expect([...used].sort()).toEqual([...ALL_ELEMENT_KINDS].sort());
  });
});

describe('endless layout validation', () => {
  it('keeps rows, ids, reserved rows and portal pairs coherent', () => {
    for (const seed of [1, 2, 7]) {
      for (let wave = 1; wave <= 30; wave += 1) {
        const def = endlessWave(wave, seed);
        expect(def.id).toBe(`endless-w${wave}`);
        expect(def.legend).toEqual(CONTENT_LEGEND);
        expect(def.rules).toEqual([]);

        const width = def.rows[0]!.length;
        expect(width).toBe(8);
        for (const row of def.rows) {
          expect(row).toHaveLength(8);
          for (const char of row) {
            if (char !== '.') expect(def.legend).toHaveProperty(char);
          }
        }

        const elements = def.elements ?? [];
        const ids = elements.map((element) => element.id);
        expect(new Set(ids).size).toBe(ids.length);

        if (elements.length > 0) {
          // The element row is the reserved last row and holds no blocks.
          const lastRow = def.rows[def.rows.length - 1]!;
          expect([...lastRow].every((char) => char === '.')).toBe(true);
          for (const element of elements) {
            expect(element.row).toBe(def.rows.length - 1);
            expect(def.rows[element.row]![element.col]).toBe('.');
          }
        }

        // Portal pairs: every pairId appears exactly twice.
        const portalGroups = new Map<string, number>();
        for (const element of elements) {
          if (element.kind !== 'portal') continue;
          portalGroups.set(element.pairId, (portalGroups.get(element.pairId) ?? 0) + 1);
        }
        for (const count of portalGroups.values()) expect(count).toBe(2);
      }
    }
  });
});

describe('endless determinism', () => {
  it('regenerates identical waves for the same seed', () => {
    const first = endlessWave(20, 1234);
    const second = endlessWave(20, 1234);
    expect(second.rows).toEqual(first.rows);
    expect(second.ballSpeed).toBe(first.ballSpeed);
    expect(second.elements).toEqual(first.elements);
  });

  it('can vary the grid with a different seed', () => {
    const a = endlessWave(20, 1);
    const b = endlessWave(20, 999);
    expect(a.rows).not.toEqual(b.rows);
    expect(a.ballSpeed).toBe(b.ballSpeed);
  });
});

describe('endless clearability', () => {
  it('clears representative waves once blocks and boss are gone', () => {
    for (const wave of [1, 10, 20, 30]) {
      const def = endlessWave(wave, 1);
      const world = new World({
        wave: def,
        height: 1280,
        tuning: { ...SIM_TUNING_DEFAULTS },
        seed: 1,
      });
      world.reset();

      expect(world.blocks.length).toBeGreaterThan(0);
      if (def.boss) {
        expect(world.boss).not.toBeNull();
        expect(world.boss!.maxHp).toBe(def.boss.hp);
        expect(world.boss!.pattern).toBe(def.boss.pattern);
      } else {
        expect(world.boss).toBeNull();
      }

      world.blocks.length = 0;
      if (world.boss) world.damageBoss(world.boss.maxHp);
      world.step();
      expect(world.outcome).toBe('cleared');
    }
  });
});

describe('endless ending', () => {
  it('ranks by wave reached and cites wave and score', () => {
    expect(endlessEnding(30, 1000).rank).toBe('S');
    expect(endlessEnding(29, 1000).rank).toBe('A');
    expect(endlessEnding(15, 1000).rank).toBe('A');
    expect(endlessEnding(14, 1000).rank).toBe('B');

    const ending = endlessEnding(21, 4321);
    expect(ending.id).toBe('endless-defeat');
    expect(ending.title).toBe('The endless dark');
    expect(ending.body).toContain('21');
    expect(ending.body).toContain('4321');
  });
});
