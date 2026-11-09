import type {
  PhaseResult,
  PhaseStats,
  SaveRepository,
  SaveSnapshot,
  SaveV1,
  SettingsV1,
  StorageService,
} from '../game/contracts';
import { GAME_CONFIG } from '../game/config';

/** Highest phase in the campaign; `unlockedPhase` is clamped to 1..MAX_PHASE. */
export const MAX_PHASE = 6;

const SAVE_VERSION = 1 as const;

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function nonNegativeInteger(value: unknown, fallback: number): number {
  if (!isFiniteNumber(value) || value < 0) return fallback;
  return Math.floor(value);
}

function nullableNonNegativeNumber(value: unknown): number | null {
  if (!isFiniteNumber(value) || value < 0) return null;
  return value;
}

function parseJson(raw: string | null | undefined): unknown {
  if (typeof raw !== 'string' || raw.length === 0) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

function defaultPhaseStats(): PhaseStats {
  return {
    bestTimeMs: null,
    bestScore: null,
    attempts: 0,
    clears: 0,
    bestLevel: 0,
  };
}

/** Parses one `PhaseStats` entry, falling back per field. */
function sanitizePhaseStats(value: unknown): PhaseStats {
  const record = isRecord(value) ? value : {};
  return {
    bestTimeMs: nullableNonNegativeNumber(record.bestTimeMs),
    bestScore: nullableNonNegativeNumber(record.bestScore),
    attempts: nonNegativeInteger(record.attempts, 0),
    clears: nonNegativeInteger(record.clears, 0),
    bestLevel: nonNegativeInteger(record.bestLevel, 0),
  };
}

function sanitizePhases(value: unknown): Record<string, PhaseStats> {
  if (!isRecord(value)) return {};
  const phases: Record<string, PhaseStats> = {};
  for (const [phaseId, stats] of Object.entries(value)) {
    if (phaseId.length === 0 || !isRecord(stats)) continue;
    phases[phaseId] = sanitizePhaseStats(stats);
  }
  return phases;
}

export function createDefaultSave(now: number = Date.now()): SaveV1 {
  return {
    version: SAVE_VERSION,
    unlockedPhase: 1,
    phases: {},
    updatedAt: now,
  };
}

export function createDefaultSettings(): SettingsV1 {
  return {
    version: SAVE_VERSION,
    sound: true,
  };
}

export function createDefaultSnapshot(now: number = Date.now()): SaveSnapshot {
  return {
    save: createDefaultSave(now),
    settings: createDefaultSettings(),
  };
}

/**
 * Safe parse of `bb.save`. Never throws: invalid JSON, unknown/future versions
 * or malformed roots yield defaults; individual fields are merged safely.
 */
export function parseSave(
  raw: string | null | undefined,
  now: number = Date.now(),
): SaveV1 {
  const parsed = parseJson(raw);
  if (!isRecord(parsed) || parsed.version !== SAVE_VERSION) {
    return createDefaultSave(now);
  }

  const unlockedPhase = isFiniteNumber(parsed.unlockedPhase)
    ? Math.min(MAX_PHASE, Math.max(1, Math.floor(parsed.unlockedPhase)))
    : 1;

  return {
    version: SAVE_VERSION,
    unlockedPhase,
    phases: sanitizePhases(parsed.phases),
    updatedAt: isFiniteNumber(parsed.updatedAt) && parsed.updatedAt >= 0
      ? parsed.updatedAt
      : now,
  };
}

/** Safe parse of `bb.settings`; anything invalid falls back to sound on. */
export function parseSettings(raw: string | null | undefined): SettingsV1 {
  const parsed = parseJson(raw);
  if (!isRecord(parsed) || parsed.version !== SAVE_VERSION) {
    return createDefaultSettings();
  }
  return {
    version: SAVE_VERSION,
    sound: typeof parsed.sound === 'boolean' ? parsed.sound : true,
  };
}

/** Persists save/settings through the platform `StorageService` only. */
export class StorageSaveRepository implements SaveRepository {
  private readonly saveKey: string;
  private readonly settingsKey: string;

  constructor(
    private readonly storage: StorageService,
    keys: { saveKey: string; settingsKey: string } = GAME_CONFIG.storage,
    private readonly now: () => number = Date.now,
  ) {
    this.saveKey = keys.saveKey;
    this.settingsKey = keys.settingsKey;
  }

  async load(): Promise<SaveSnapshot> {
    let values: (string | null)[] = [];
    try {
      values = await this.storage.get([this.saveKey, this.settingsKey]);
    } catch {
      return createDefaultSnapshot(this.now());
    }

    if (!Array.isArray(values)) {
      return createDefaultSnapshot(this.now());
    }

    return {
      save: parseSave(values[0], this.now()),
      settings: parseSettings(values[1]),
    };
  }

  async save(save: SaveV1): Promise<void> {
    await this.storage.set([this.saveKey], [JSON.stringify(save)]);
  }

  async saveSettings(settings: SettingsV1): Promise<void> {
    await this.storage.set([this.settingsKey], [JSON.stringify(settings)]);
  }

  async reset(): Promise<void> {
    await this.storage.delete([this.saveKey, this.settingsKey]);
  }
}

/** Phase stats for `phaseId`, with zeroed defaults and no shared references. */
export function getPhaseStats(save: SaveV1, phaseId: string): PhaseStats {
  const stats = save.phases[phaseId];
  if (stats === undefined) return defaultPhaseStats();
  return {
    bestTimeMs: stats.bestTimeMs,
    bestScore: stats.bestScore,
    attempts: stats.attempts,
    clears: stats.clears,
    bestLevel: stats.bestLevel,
  };
}

/**
 * Pure, immutable update of the save after a finished phase. The active run is
 * never persisted; only stats and the sequential unlock are recorded.
 */
export function applyPhaseResult(
  save: SaveV1,
  result: PhaseResult,
  now: number = Date.now(),
): SaveV1 {
  const previous = getPhaseStats(save, result.phaseId);
  const score = isFiniteNumber(result.score) && result.score >= 0 ? result.score : 0;
  const timeMs =
    isFiniteNumber(result.timeMs) && result.timeMs >= 0 ? result.timeMs : 0;
  const level = nonNegativeInteger(result.level, previous.bestLevel);

  const bestScore =
    previous.bestScore === null ? score : Math.max(previous.bestScore, score);
  const bestTimeMs = result.victory
    ? previous.bestTimeMs === null
      ? timeMs
      : Math.min(previous.bestTimeMs, timeMs)
    : previous.bestTimeMs;

  const nextStats: PhaseStats = {
    bestTimeMs,
    bestScore,
    attempts: previous.attempts + 1,
    clears: previous.clears + (result.victory ? 1 : 0),
    bestLevel: Math.max(previous.bestLevel, level),
  };

  const unlockedPhase = result.victory
    ? Math.max(
        save.unlockedPhase,
        Math.min(MAX_PHASE, nonNegativeInteger(result.phaseIndex, 0) + 1),
      )
    : save.unlockedPhase;

  return {
    version: SAVE_VERSION,
    unlockedPhase,
    phases: {
      ...save.phases,
      [result.phaseId]: nextStats,
    },
    updatedAt: now,
  };
}
