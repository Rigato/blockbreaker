import { describe, expect, it, vi } from 'vitest';
import type {
  PhaseResult,
  SaveV1,
  SettingsV1,
  StorageService,
} from '../src/game/contracts';
import { GAME_CONFIG } from '../src/game/config';
import { MemoryStorage } from '../src/platform/MemoryStorage';
import {
  MAX_PHASE,
  StorageSaveRepository,
  applyPhaseResult,
  createDefaultSave,
  createDefaultSettings,
  getPhaseStats,
  parseSave,
  parseSettings,
} from '../src/progression/Save';

function makeResult(overrides: Partial<PhaseResult> = {}): PhaseResult {
  return {
    phaseId: 'phase-1',
    phaseName: 'Phase 1',
    phaseIndex: 1,
    phaseCount: 6,
    victory: true,
    score: 1000,
    timeMs: 60_000,
    level: 5,
    perks: [],
    bestScore: null,
    bestTimeMs: null,
    nextPhaseId: 'phase-2',
    ...overrides,
  };
}

function makeSave(overrides: Partial<SaveV1> = {}): SaveV1 {
  return {
    ...createDefaultSave(123),
    ...overrides,
  };
}

class ThrowingStorage implements StorageService {
  async get(): Promise<(string | null)[]> {
    throw new Error('get failed');
  }
  async set(): Promise<void> {
    throw new Error('set failed');
  }
  async delete(): Promise<void> {
    throw new Error('delete failed');
  }
}

describe('save defaults', () => {
  it('creates a version 1 save at phase 1', () => {
    expect(createDefaultSave(42)).toEqual({
      version: 1,
      unlockedPhase: 1,
      phases: {},
      updatedAt: 42,
    });
  });

  it('creates default settings with sound on', () => {
    expect(createDefaultSettings()).toEqual({ version: 1, sound: true });
    expect(MAX_PHASE).toBe(6);
  });
});

describe('safe parse', () => {
  it('falls back to defaults for corrupt JSON and unknown roots', () => {
    expect(parseSave('not json', 7)).toEqual(createDefaultSave(7));
    expect(parseSave('"text"', 7)).toEqual(createDefaultSave(7));
    expect(parseSave('[]', 7)).toEqual(createDefaultSave(7));
    expect(parseSave('null', 7)).toEqual(createDefaultSave(7));
    expect(parseSave('', 7)).toEqual(createDefaultSave(7));
    expect(parseSave(null, 7)).toEqual(createDefaultSave(7));
    expect(parseSave(undefined, 7)).toEqual(createDefaultSave(7));
  });

  it('rejects future or unknown versions', () => {
    const raw = JSON.stringify({ version: 2, unlockedPhase: 3, phases: {} });
    expect(parseSave(raw, 9)).toEqual(createDefaultSave(9));
  });

  it('merges missing or wrong-typed fields safely', () => {
    const raw = JSON.stringify({
      version: 1,
      unlockedPhase: 99,
      phases: {
        'phase-1': { bestScore: -5, attempts: 'x', bestLevel: 2.9 },
        'phase-2': null,
        bad: 12,
      },
      updatedAt: 'yesterday',
    });

    const save = parseSave(raw, 555);

    expect(save.version).toBe(1);
    expect(save.unlockedPhase).toBe(6);
    expect(save.updatedAt).toBe(555);
    expect(save.phases['phase-1']).toEqual({
      bestTimeMs: null,
      bestScore: null,
      attempts: 0,
      clears: 0,
      bestLevel: 2,
    });
    expect(save.phases['phase-2']).toBeUndefined();
    expect(save.phases['bad']).toBeUndefined();
  });

  it('fills a version 1 root with defaults', () => {
    const save = parseSave(JSON.stringify({ version: 1 }), 3);
    expect(save).toEqual(createDefaultSave(3));
  });

  it('clamps unlockedPhase into 1..6', () => {
    expect(parseSave(JSON.stringify({ version: 1, unlockedPhase: 0 })).unlockedPhase).toBe(1);
    expect(parseSave(JSON.stringify({ version: 1, unlockedPhase: 2 })).unlockedPhase).toBe(2);
    expect(parseSave(JSON.stringify({ version: 1, unlockedPhase: 4 })).unlockedPhase).toBe(4);
    expect(parseSave(JSON.stringify({ version: 1, unlockedPhase: 7 })).unlockedPhase).toBe(6);
  });

  it('migrates a v0.1 save with unlockedPhase 3 into the 6-phase campaign', () => {
    const raw = JSON.stringify({
      version: 1,
      unlockedPhase: 3,
      phases: {
        'phase-1': { bestScore: 1200, bestTimeMs: 40_000, attempts: 2, clears: 1, bestLevel: 5 },
        'phase-2': { bestScore: 900, bestTimeMs: 55_000, attempts: 1, clears: 1, bestLevel: 4 },
        'phase-3': { bestScore: 800, bestTimeMs: null, attempts: 1, clears: 0, bestLevel: 3 },
      },
      updatedAt: 1000,
    });

    const save = parseSave(raw, 2000);
    expect(save.version).toBe(1);
    expect(save.unlockedPhase).toBe(3);

    const canOpen = (index: number): boolean => index <= save.unlockedPhase;
    expect([1, 2, 3].map(canOpen)).toEqual([true, true, true]);
    expect([4, 5, 6].map(canOpen)).toEqual([false, false, false]);

    expect(getPhaseStats(save, 'phase-3')).toEqual({
      bestTimeMs: null,
      bestScore: 800,
      attempts: 1,
      clears: 0,
      bestLevel: 3,
    });
    expect(getPhaseStats(save, 'phase-4')).toEqual({
      bestTimeMs: null,
      bestScore: null,
      attempts: 0,
      clears: 0,
      bestLevel: 0,
    });
    expect(getPhaseStats(save, 'phase-6').clears).toBe(0);
  });

  it('defaults invalid settings to sound on', () => {
    expect(parseSettings(null)).toEqual(createDefaultSettings());
    expect(parseSettings('nope')).toEqual(createDefaultSettings());
    expect(parseSettings(JSON.stringify({ version: 2, sound: false }))).toEqual(
      createDefaultSettings(),
    );
    expect(parseSettings(JSON.stringify({ version: 1, sound: 'yes' }))).toEqual(
      createDefaultSettings(),
    );
    expect(parseSettings(JSON.stringify({ version: 1, sound: false }))).toEqual({
      version: 1,
      sound: false,
    });
  });
});

describe('StorageSaveRepository', () => {
  it('round-trips save and settings through storage keys', async () => {
    const storage = new MemoryStorage();
    const repository = new StorageSaveRepository(storage);
    const save: SaveV1 = {
      version: 1,
      unlockedPhase: 2,
      phases: {
        'phase-1': {
          bestTimeMs: 42_000,
          bestScore: 1234,
          attempts: 2,
          clears: 1,
          bestLevel: 6,
        },
      },
      updatedAt: 777,
    };
    const settings: SettingsV1 = { version: 1, sound: false };

    await repository.save(save);
    await repository.saveSettings(settings);

    await expect(repository.load()).resolves.toEqual({ save, settings });
    await expect(storage.get([GAME_CONFIG.storage.saveKey])).resolves.toEqual([
      JSON.stringify(save),
    ]);
    await expect(storage.get([GAME_CONFIG.storage.settingsKey])).resolves.toEqual([
      JSON.stringify(settings),
    ]);
  });

  it('uses the configured keys and equal-length arrays', async () => {
    const storage = new MemoryStorage();
    const getSpy = vi.spyOn(storage, 'get');
    const setSpy = vi.spyOn(storage, 'set');
    const deleteSpy = vi.spyOn(storage, 'delete');
    const repository = new StorageSaveRepository(storage);
    const save = createDefaultSave(1);
    const settings = createDefaultSettings();

    await repository.load();
    await repository.save(save);
    await repository.saveSettings(settings);
    await repository.reset();

    expect(getSpy).toHaveBeenCalledWith([
      GAME_CONFIG.storage.saveKey,
      GAME_CONFIG.storage.settingsKey,
    ]);
    expect(setSpy).toHaveBeenNthCalledWith(
      1,
      [GAME_CONFIG.storage.saveKey],
      [JSON.stringify(save)],
    );
    expect(setSpy).toHaveBeenNthCalledWith(
      2,
      [GAME_CONFIG.storage.settingsKey],
      [JSON.stringify(settings)],
    );
    expect(deleteSpy).toHaveBeenCalledWith([
      GAME_CONFIG.storage.saveKey,
      GAME_CONFIG.storage.settingsKey,
    ]);
  });

  it('returns defaults on a first boot with empty storage', async () => {
    const repository = new StorageSaveRepository(new MemoryStorage(), undefined, () => 11);
    await expect(repository.load()).resolves.toEqual({
      save: createDefaultSave(11),
      settings: createDefaultSettings(),
    });
  });

  it('returns defaults when storage throws or returns invalid values', async () => {
    const throwing = new StorageSaveRepository(new ThrowingStorage(), undefined, () => 5);
    await expect(throwing.load()).resolves.toEqual({
      save: createDefaultSave(5),
      settings: createDefaultSettings(),
    });

    const storage = new MemoryStorage();
    await storage.set(
      [GAME_CONFIG.storage.saveKey, GAME_CONFIG.storage.settingsKey],
      ['{broken', 'also broken'],
    );
    const corrupt = new StorageSaveRepository(storage, undefined, () => 6);
    await expect(corrupt.load()).resolves.toEqual({
      save: createDefaultSave(6),
      settings: createDefaultSettings(),
    });
  });

  it('resets both keys and reloads defaults', async () => {
    const storage = new MemoryStorage();
    const repository = new StorageSaveRepository(storage, undefined, () => 8);
    await repository.save(makeSave({ unlockedPhase: 3 }));
    await repository.saveSettings({ version: 1, sound: false });

    await repository.reset();

    await expect(
      storage.get([GAME_CONFIG.storage.saveKey, GAME_CONFIG.storage.settingsKey]),
    ).resolves.toEqual([null, null]);
    await expect(repository.load()).resolves.toEqual({
      save: createDefaultSave(8),
      settings: createDefaultSettings(),
    });
  });
});

describe('applyPhaseResult', () => {
  it('unlocks phases sequentially up to phase 6 and clamps there', () => {
    let save = createDefaultSave();

    for (let index = 1; index <= 5; index += 1) {
      save = applyPhaseResult(
        save,
        makeResult({
          phaseId: `phase-${index}`,
          phaseIndex: index,
          nextPhaseId: `phase-${index + 1}`,
        }),
        index * 10,
      );
      expect(save.unlockedPhase).toBe(index + 1);
    }

    save = applyPhaseResult(
      save,
      makeResult({ phaseId: 'phase-6', phaseIndex: 6, nextPhaseId: null }),
      60,
    );
    expect(save.unlockedPhase).toBe(6);
    expect(save.updatedAt).toBe(60);
  });

  it('does not unlock on defeat and keeps the best time', () => {
    const save = makeSave({
      phases: {
        'phase-1': {
          bestTimeMs: 30_000,
          bestScore: 500,
          attempts: 1,
          clears: 1,
          bestLevel: 4,
        },
      },
    });

    const next = applyPhaseResult(
      save,
      makeResult({ victory: false, timeMs: 10_000, score: 900, level: 2 }),
      99,
    );

    expect(next.unlockedPhase).toBe(1);
    expect(next.phases['phase-1']).toEqual({
      bestTimeMs: 30_000,
      bestScore: 900,
      attempts: 2,
      clears: 1,
      bestLevel: 4,
    });
    expect(next.updatedAt).toBe(99);
  });

  it('keeps the fastest winning time and highest score and level', () => {
    const save = makeSave({
      phases: {
        'phase-1': {
          bestTimeMs: 50_000,
          bestScore: 100,
          attempts: 2,
          clears: 2,
          bestLevel: 5,
        },
      },
    });

    const faster = applyPhaseResult(
      save,
      makeResult({ timeMs: 40_000, score: 50, level: 4 }),
      1,
    );
    expect(faster.phases['phase-1']).toEqual({
      bestTimeMs: 40_000,
      bestScore: 100,
      attempts: 3,
      clears: 3,
      bestLevel: 5,
    });

    const slower = applyPhaseResult(
      faster,
      makeResult({ timeMs: 90_000, score: 500, level: 9 }),
      2,
    );
    expect(slower.phases['phase-1']).toEqual({
      bestTimeMs: 40_000,
      bestScore: 500,
      attempts: 4,
      clears: 4,
      bestLevel: 9,
    });
  });

  it('initializes stats for an unseen phase', () => {
    const next = applyPhaseResult(
      createDefaultSave(),
      makeResult({ phaseId: 'phase-2', phaseIndex: 2, score: 0, timeMs: 0, level: 1 }),
      1,
    );
    expect(getPhaseStats(next, 'phase-2')).toEqual({
      bestTimeMs: 0,
      bestScore: 0,
      attempts: 1,
      clears: 1,
      bestLevel: 1,
    });
  });

  it('is pure and does not mutate the input save', () => {
    const save = makeSave({
      unlockedPhase: 1,
      phases: {
        'phase-1': {
          bestTimeMs: null,
          bestScore: null,
          attempts: 0,
          clears: 0,
          bestLevel: 0,
        },
      },
    });
    const frozen = JSON.parse(JSON.stringify(save)) as SaveV1;
    Object.freeze(save);
    Object.freeze(save.phases);
    Object.freeze(save.phases['phase-1']);

    const next = applyPhaseResult(save, makeResult(), 1);

    expect(save).toEqual(frozen);
    expect(next).not.toBe(save);
    expect(next.phases).not.toBe(save.phases);
    expect(next.phases['phase-1']).not.toBe(save.phases['phase-1']);
    expect(next.version).toBe(1);
  });

  it('returns fresh default stats for unknown phases', () => {
    const save = createDefaultSave();
    const first = getPhaseStats(save, 'missing');
    first.attempts = 5;
    expect(getPhaseStats(save, 'missing').attempts).toBe(0);
  });
});
