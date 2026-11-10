import { GAME_CONFIG } from '../game/config';
import { BLOCK_TYPES, isBlockTypeId } from '../sim/blocks';
import { BLOCK_TOP, PADDLE_BOTTOM_OFFSET } from '../sim/World';
import { computeFieldScale } from '../sim/layout';
import { xpCostForLevel } from '../progression/xp';
import type { BossDef, LevelElement, PhaseDef, WaveDef } from './types';
import {
  PHASE_1_WAVES,
  PHASE_2_WAVES,
  PHASE_3_WAVES,
  PHASE_4_WAVES,
  PHASE_5_WAVES,
  PHASE_6_WAVES,
} from './waves';

/** Stable phase order consumed by the game and by the content validator. */
export const PHASES: readonly PhaseDef[] = [
  {
    id: 'phase-1',
    index: 1,
    name: 'Crystal Grove',
    tagline: 'Where the first shards fall.',
    waves: PHASE_1_WAVES,
  },
  {
    id: 'phase-2',
    index: 2,
    name: 'Ruined Halls',
    tagline: 'Stone and ruin remember.',
    waves: PHASE_2_WAVES,
  },
  {
    id: 'phase-3',
    index: 3,
    name: 'Arcane Depths',
    tagline: 'Magic runs deep.',
    waves: PHASE_3_WAVES,
  },
  {
    id: 'phase-4',
    index: 4,
    name: 'Frostbound Spire',
    tagline: 'Cold steel, colder sentries.',
    waves: PHASE_4_WAVES,
  },
  {
    id: 'phase-5',
    index: 5,
    name: 'Emberforge',
    tagline: 'Forge your build in fire.',
    waves: PHASE_5_WAVES,
  },
  {
    id: 'phase-6',
    index: 6,
    name: 'Void Threshold',
    tagline: 'Nothing returns unchanged.',
    waves: PHASE_6_WAVES,
  },
];

/** Waves per phase in campaign order. */
export const EXPECTED_WAVE_COUNTS = [3, 3, 3, 3, 4, 5] as const;

/** Conservative validation viewport. Matches the real minimum world height. */
export const CONTENT_EVALUATION_HEIGHT = 1280;
export const CONTENT_EVALUATION_WIDTH = 720;

/** Top of the paddle box at the 1280-unit validation height. */
export const PADDLE_ZONE_TOP =
  CONTENT_EVALUATION_HEIGHT - PADDLE_BOTTOM_OFFSET - GAME_CONFIG.paddle.height / 2;

/** Hard row cap for a single wave (keeps the field readable when scaled). */
export const MAX_WAVE_ROWS = 12;

export const BALL_SPEED_MIN = 500;
export const BALL_SPEED_MAX = 780;
/** Relative slack (5%) for the monotonic difficulty and speed checks. */
export const DIFFICULTY_TOLERANCE = 0.05;

export interface WaveStats {
  readonly wave: WaveDef;
  readonly phaseId: string;
  readonly phaseIndex: number;
  readonly rows: number;
  readonly columns: number;
  readonly cells: number;
  readonly blocks: number;
  /** Total destructible HP, which equals the wave XP budget. */
  readonly hp: number;
  readonly density: number;
  readonly avgHp: number;
  /** Combined HP x density difficulty score. */
  readonly difficulty: number;
  readonly gridBottom: number;
}

export interface PhaseStats {
  readonly phase: PhaseDef;
  readonly waves: readonly WaveStats[];
  readonly blocks: number;
  readonly hp: number;
  readonly density: number;
  readonly avgHp: number;
  readonly difficulty: number;
  readonly levelUps: number;
  readonly maxBallSpeed: number;
}

export interface ContentIssue {
  readonly path: string;
  readonly message: string;
}

/** How many level ups a wave/phase XP pool can produce. */
export function levelUpsForXp(xp: number): number {
  let remaining = Math.max(0, xp);
  let level = 1;
  let levelUps = 0;
  while (remaining >= xpCostForLevel(level)) {
    remaining -= xpCostForLevel(level);
    level += 1;
    levelUps += 1;
  }
  return levelUps;
}

/** Rows an element or boss extends beyond the block grid, if any. */
function extraRowsFor(wave: WaveDef): number {
  const rows = wave.rows.length;
  let maxRow = rows;
  for (const element of wave.elements ?? []) {
    const bottom = element.row + (element.heightCells ?? 1);
    if (Number.isFinite(bottom) && bottom > maxRow) maxRow = bottom;
  }
  if (wave.boss) {
    const bottom = wave.boss.row + wave.boss.heightCells;
    if (Number.isFinite(bottom) && bottom > maxRow) maxRow = bottom;
  }
  return Math.max(0, maxRow - rows);
}

export function waveStats(phase: PhaseDef, wave: WaveDef): WaveStats {
  const columns = wave.rows[0]?.length ?? 0;
  const rows = wave.rows.length;
  const cells = rows * columns;
  let blocks = 0;
  let hp = 0;

  for (const row of wave.rows) {
    for (const char of row) {
      const type = wave.legend[char];
      if (type && isBlockTypeId(type)) {
        blocks += 1;
        hp += BLOCK_TYPES[type].hp;
      }
    }
  }

  const density = cells > 0 ? blocks / cells : 0;
  const avgHp = blocks > 0 ? hp / blocks : 0;
  const extraRows = extraRowsFor(wave);
  const scale = computeFieldScale(rows, columns, extraRows);
  const cellSize = columns > 0 ? (CONTENT_EVALUATION_WIDTH / columns) * scale : 0;
  const gridBottom = BLOCK_TOP + (rows + extraRows) * cellSize;

  return {
    wave,
    phaseId: phase.id,
    phaseIndex: phase.index,
    rows,
    columns,
    cells,
    blocks,
    hp,
    density,
    avgHp,
    difficulty: avgHp * density,
    gridBottom,
  };
}

export function phaseStats(phase: PhaseDef): PhaseStats {
  const waves = phase.waves.map((wave) => waveStats(phase, wave));
  const blocks = waves.reduce((sum, wave) => sum + wave.blocks, 0);
  const hp = waves.reduce((sum, wave) => sum + wave.hp, 0);
  const cells = waves.reduce((sum, wave) => sum + wave.cells, 0);
  const density = cells > 0 ? blocks / cells : 0;
  const avgHp = blocks > 0 ? hp / blocks : 0;
  const maxBallSpeed = phase.waves.reduce(
    (max, wave) => Math.max(max, wave.ballSpeed),
    Number.NEGATIVE_INFINITY,
  );

  return {
    phase,
    waves,
    blocks,
    hp,
    density,
    avgHp,
    difficulty: avgHp * density,
    levelUps: levelUpsForXp(hp),
    maxBallSpeed,
  };
}

export function allWaveStats(phases: readonly PhaseDef[] = PHASES): readonly WaveStats[] {
  return phases.flatMap((phase) => phaseStats(phase).waves);
}

/** Waves whose block density drives the pace (boss waves are boss-driven). */
function pacedWaves(stats: PhaseStats): readonly WaveStats[] {
  return stats.waves.filter((wave) => !wave.wave.boss && wave.blocks > 0);
}

function phasePeaks(stats: PhaseStats): { avgHp: number; difficulty: number } {
  const waves = pacedWaves(stats);
  if (waves.length === 0) return { avgHp: 0, difficulty: 0 };
  return {
    avgHp: Math.max(...waves.map((wave) => wave.avgHp)),
    difficulty: Math.max(...waves.map((wave) => wave.difficulty)),
  };
}

/** True when `value` did not fall more than the relative tolerance below `previous`. */
function didNotRegress(value: number, previous: number): boolean {
  return value + previous * DIFFICULTY_TOLERANCE >= previous;
}

/** Element rectangle in cell units, with the documented 1-cell defaults. */
function elementRect(element: LevelElement): {
  col: number;
  row: number;
  width: number;
  height: number;
} {
  return {
    col: element.col,
    row: element.row,
    width: element.widthCells ?? 1,
    height: element.heightCells ?? 1,
  };
}

function cellsOverlap(
  a: { col: number; row: number; width: number; height: number },
  b: { col: number; row: number; width: number; height: number },
): boolean {
  return (
    a.col < b.col + b.width &&
    a.col + a.width > b.col &&
    a.row < b.row + b.height &&
    a.row + a.height > b.row
  );
}

/** Structural and tuning checks shared by the CLI validator and unit tests. */
export function validateContent(phases: readonly PhaseDef[] = PHASES): ContentIssue[] {
  const issues: ContentIssue[] = [];
  const push = (path: string, message: string): void => {
    issues.push({ path, message });
  };

  if (phases.length !== EXPECTED_WAVE_COUNTS.length) {
    push(
      'phases',
      `expected exactly ${EXPECTED_WAVE_COUNTS.length} phases, found ${phases.length}`,
    );
  }

  const phaseIds = new Set<string>();
  const waveIds = new Set<string>();

  phases.forEach((phase, phaseIndex) => {
    const phasePath = `${phase.id || `phase[${phaseIndex}]`}`;

    if (phase.index !== phaseIndex + 1) {
      push(phasePath, `index must be ${phaseIndex + 1}, found ${phase.index}`);
    }
    if (phaseIds.has(phase.id)) {
      push(phasePath, `duplicate phase id "${phase.id}"`);
    } else {
      phaseIds.add(phase.id);
    }
    if (!phase.name.trim()) {
      push(phasePath, 'phase name must not be empty');
    }
    const expectedWaves = EXPECTED_WAVE_COUNTS[phaseIndex];
    if (expectedWaves !== undefined && phase.waves.length !== expectedWaves) {
      push(phasePath, `expected exactly ${expectedWaves} waves, found ${phase.waves.length}`);
    }

    phase.waves.forEach((wave, waveIndex) => {
      const wavePath = `${phasePath}/${wave.id || `wave[${waveIndex}]`}`;

      if (!wave.id.trim()) {
        push(wavePath, 'wave id must not be empty');
      }
      if (waveIds.has(wave.id)) {
        push(wavePath, `duplicate wave id "${wave.id}"`);
      } else {
        waveIds.add(wave.id);
      }
      if (!wave.name.trim()) {
        push(wavePath, 'wave name must not be empty');
      }

      if (wave.rows.length === 0) {
        push(wavePath, 'wave must have at least one row');
        return;
      }
      if (wave.rows.length > MAX_WAVE_ROWS) {
        push(wavePath, `wave has ${wave.rows.length} rows, at most ${MAX_WAVE_ROWS} allowed`);
      }

      const columns = wave.rows[0]?.length ?? 0;
      if (columns === 0) {
        push(wavePath, 'rows must not be empty');
        return;
      }

      wave.rows.forEach((row, rowIndex) => {
        if (row.length !== columns) {
          push(wavePath, `row ${rowIndex} has width ${row.length}, expected ${columns}`);
        }
      });

      for (const [char, type] of Object.entries(wave.legend)) {
        if (char.length !== 1) {
          push(wavePath, `legend key "${char}" must be a single character`);
        }
        if (!isBlockTypeId(type)) {
          push(wavePath, `legend "${char}" maps to invalid block type "${String(type)}"`);
        }
      }

      const hasBlockAt = (row: number, col: number): boolean => {
        const char = wave.rows[row]?.[col];
        if (char === undefined || char === '.') return false;
        return wave.legend[char] !== undefined;
      };

      let blockCount = 0;
      wave.rows.forEach((row, rowIndex) => {
        for (const char of row) {
          if (char === '.') continue;
          if (!(char in wave.legend)) {
            push(wavePath, `row ${rowIndex} uses "${char}" which is missing from legend`);
            continue;
          }
          const type = wave.legend[char];
          if (type && isBlockTypeId(type)) blockCount += 1;
        }
      });

      if (blockCount === 0 && !wave.boss) {
        push(wavePath, 'wave must contain at least one destructible block');
      }

      const elements = wave.elements ?? [];
      const elementIds = new Set<string>();
      const portalCounts = new Map<string, number>();
      const elementRects: {
        id: string;
        rect: { col: number; row: number; width: number; height: number };
      }[] = [];

      elements.forEach((element, elementIndex) => {
        const elementPath = `${wavePath}/element[${elementIndex}]`;
        const id = element.id;
        if (!id || !id.trim()) {
          push(elementPath, 'element id must not be empty');
        } else if (elementIds.has(id)) {
          push(elementPath, `duplicate element id "${id}"`);
        } else {
          elementIds.add(id);
        }

        const rect = elementRect(element);
        if (!Number.isInteger(rect.col) || rect.col < 0) {
          push(elementPath, `col must be a non-negative integer, found ${rect.col}`);
        }
        if (!Number.isInteger(rect.row) || rect.row < 0) {
          push(elementPath, `row must be a non-negative integer, found ${rect.row}`);
        }
        if (!Number.isInteger(rect.width) || rect.width < 1) {
          push(elementPath, `widthCells must be >= 1, found ${rect.width}`);
        }
        if (!Number.isInteger(rect.height) || rect.height < 1) {
          push(elementPath, `heightCells must be >= 1, found ${rect.height}`);
        }
        if (rect.col + rect.width > columns) {
          push(
            elementPath,
            `col ${rect.col} + widthCells ${rect.width} exceeds ${columns} columns`,
          );
        }
        if (rect.row + rect.height > wave.rows.length) {
          push(
            elementPath,
            `row ${rect.row} + heightCells ${rect.height} exceeds ${wave.rows.length} rows`,
          );
        }

        for (let row = rect.row; row < rect.row + rect.height; row += 1) {
          for (let col = rect.col; col < rect.col + rect.width; col += 1) {
            if (hasBlockAt(row, col)) {
              push(elementPath, `overlaps block at row ${row}, col ${col}`);
            }
          }
        }
        for (const other of elementRects) {
          if (cellsOverlap(rect, other.rect)) {
            push(elementPath, `overlaps element "${other.id}"`);
          }
        }
        elementRects.push({ id, rect });

        if (element.kind === 'portal') {
          if (!element.pairId || !element.pairId.trim()) {
            push(elementPath, 'portal must define a non-empty pairId');
          } else {
            portalCounts.set(element.pairId, (portalCounts.get(element.pairId) ?? 0) + 1);
          }
        } else if (element.kind === 'deflector') {
          if (!Number.isFinite(element.angleDeg)) {
            push(elementPath, 'deflector angleDeg must be finite');
          }
        } else if (element.kind === 'mover') {
          if (!Number.isFinite(element.periodMs) || element.periodMs <= 0) {
            push(elementPath, `mover periodMs must be > 0, found ${element.periodMs}`);
          }
          if (!Number.isFinite(element.rangeCells) || element.rangeCells < 0) {
            push(elementPath, 'mover rangeCells must be a finite non-negative number');
          }
          if (element.phaseMs !== undefined && !Number.isFinite(element.phaseMs)) {
            push(elementPath, 'mover phaseMs must be finite when present');
          }
        } else if (element.kind === 'rotor') {
          if (!Number.isFinite(element.periodMs) || element.periodMs <= 0) {
            push(elementPath, `rotor periodMs must be > 0, found ${element.periodMs}`);
          }
          if (!Number.isFinite(element.lengthCells) || element.lengthCells < 1) {
            push(elementPath, 'rotor lengthCells must be >= 1');
          }
          if (element.phaseMs !== undefined && !Number.isFinite(element.phaseMs)) {
            push(elementPath, 'rotor phaseMs must be finite when present');
          }
        } else if (element.kind === 'gate') {
          if (!Number.isFinite(element.closedMs) || element.closedMs <= 0) {
            push(elementPath, `gate closedMs must be > 0, found ${element.closedMs}`);
          }
          if (!Number.isFinite(element.openMs) || element.openMs <= 0) {
            push(elementPath, `gate openMs must be > 0, found ${element.openMs}`);
          }
          if (element.phaseMs !== undefined && !Number.isFinite(element.phaseMs)) {
            push(elementPath, 'gate phaseMs must be finite when present');
          }
        }
      });

      for (const [pairId, count] of portalCounts) {
        if (count !== 2) {
          push(wavePath, `portal pair "${pairId}" has ${count} portals, expected exactly 2`);
        }
      }

      if (wave.boss) {
        const boss = wave.boss as BossDef;
        const bossPath = `${wavePath}/boss`;
        if (!boss.id.trim()) push(bossPath, 'boss id must not be empty');
        if (!boss.name.trim()) push(bossPath, 'boss name must not be empty');
        if (!Number.isFinite(boss.hp) || boss.hp <= 0) {
          push(bossPath, `boss hp must be > 0, found ${boss.hp}`);
        }
        if (!Number.isInteger(boss.widthCells) || boss.widthCells < 1) {
          push(bossPath, `boss widthCells must be >= 1, found ${boss.widthCells}`);
        }
        if (!Number.isInteger(boss.heightCells) || boss.heightCells < 1) {
          push(bossPath, `boss heightCells must be >= 1, found ${boss.heightCells}`);
        }
        if (!Number.isInteger(boss.row) || boss.row < 0) {
          push(bossPath, `boss row must be a non-negative integer, found ${boss.row}`);
        }
        if (boss.widthCells > columns) {
          push(bossPath, `boss widthCells ${boss.widthCells} exceeds ${columns} columns`);
        }
        if (boss.row + boss.heightCells > wave.rows.length) {
          push(
            bossPath,
            `boss row ${boss.row} + heightCells ${boss.heightCells} exceeds ` +
              `${wave.rows.length} rows`,
          );
        }
        if (!Number.isFinite(boss.attackMs) || boss.attackMs <= 0) {
          push(bossPath, 'boss attackMs must be finite and > 0');
        }
        if (!Number.isFinite(boss.moveSpeed)) {
          push(bossPath, 'boss moveSpeed must be finite');
        }

        // The boss is horizontally centred, so its cell span is symmetric even
        // when `widthCells` is odd. Any touched cell counts as occupied.
        const bossStartCol = Math.floor((columns - boss.widthCells) / 2);
        const bossEndCol = Math.ceil((columns + boss.widthCells) / 2) - 1;
        let blockOverlap = false;
        let elementOverlap = false;
        for (let row = boss.row; row < boss.row + boss.heightCells; row += 1) {
          for (let col = bossStartCol; col <= bossEndCol; col += 1) {
            if (hasBlockAt(row, col)) blockOverlap = true;
            for (const element of elementRects) {
              if (cellsOverlap(element.rect, { col, row, width: 1, height: 1 })) {
                elementOverlap = true;
              }
            }
          }
        }
        if (blockOverlap) push(bossPath, 'boss overlaps a block cell');
        if (elementOverlap) push(bossPath, 'boss overlaps an element');
      }

      for (const rule of wave.rules ?? []) {
        if (rule.kind === 'timeLimit') {
          if (!Number.isFinite(rule.ms) || rule.ms <= 0) {
            push(wavePath, `timeLimit ms must be > 0, found ${rule.ms}`);
          }
        } else if (rule.kind === 'noLaser') {
          if (Object.keys(rule as unknown as Record<string, unknown>).length !== 1) {
            push(wavePath, 'noLaser rule must not carry a payload');
          }
        } else {
          push(wavePath, `unknown wave rule "${String((rule as { kind?: unknown }).kind)}"`);
        }
      }

      const stats = waveStats(phase, wave);
      if (stats.gridBottom > PADDLE_ZONE_TOP) {
        push(
          wavePath,
          `grid bottom ${stats.gridBottom.toFixed(1)} enters paddle zone ` +
            `(top ${PADDLE_ZONE_TOP.toFixed(1)})`,
        );
      }
    });

    // Per-phase pacing and speed checks.
    let previousSpeed = Number.NEGATIVE_INFINITY;
    phase.waves.forEach((wave) => {
      const wavePath = `${phasePath}/${wave.id || 'wave'}`;
      if (!Number.isFinite(wave.ballSpeed)) {
        push(wavePath, 'ballSpeed must be a finite number');
      } else if (wave.ballSpeed < BALL_SPEED_MIN || wave.ballSpeed > BALL_SPEED_MAX) {
        push(
          wavePath,
          `ballSpeed ${wave.ballSpeed} outside ${BALL_SPEED_MIN}-${BALL_SPEED_MAX}`,
        );
      }
      if (wave.ballSpeed <= previousSpeed) {
        push(wavePath, `ballSpeed ${wave.ballSpeed} must increase within the phase`);
      }
      previousSpeed = wave.ballSpeed;
    });

    const stats = phaseStats(phase);
    if (stats.levelUps < 4 || stats.levelUps > 16) {
      push(phasePath, `expected 4-16 level ups, found ${stats.levelUps}`);
    }

    // Block-density pace only compares boss-less waves, so a final boss wave
    // may be sparse without looking like a difficulty regression.
    const paced = pacedWaves(stats);
    paced.forEach((wave, index) => {
      if (index === 0) return;
      const previous = paced[index - 1]!;
      const path = `${phasePath}/${wave.wave.id}`;
      if (!didNotRegress(wave.avgHp, previous.avgHp)) {
        push(
          path,
          `average HP ${wave.avgHp.toFixed(2)} falls below previous ` +
            `${previous.avgHp.toFixed(2)} by more than ${DIFFICULTY_TOLERANCE * 100}%`,
        );
      }
      if (!didNotRegress(wave.difficulty, previous.difficulty)) {
        push(
          path,
          `difficulty ${wave.difficulty.toFixed(2)} falls below previous ` +
            `${previous.difficulty.toFixed(2)} by more than ${DIFFICULTY_TOLERANCE * 100}%`,
        );
      }
    });
  });

  const phaseStatsList = phases.map((phase) => phaseStats(phase));

  // Each phase peak must not regress against the previous phase peak. This
  // allows a lighter introductory wave while keeping the campaign escalating.
  phaseStatsList.forEach((stats, index) => {
    if (index === 0) return;
    const previous = phaseStatsList[index - 1];
    if (!previous) return;
    const currentPeak = phasePeaks(stats);
    const previousPeak = phasePeaks(previous);
    if (!didNotRegress(currentPeak.avgHp, previousPeak.avgHp)) {
      push(
        stats.phase.id,
        `phase peak average HP ${currentPeak.avgHp.toFixed(2)} regresses from ` +
          `previous peak ${previousPeak.avgHp.toFixed(2)}`,
      );
    }
    if (!didNotRegress(currentPeak.difficulty, previousPeak.difficulty)) {
      push(
        stats.phase.id,
        `phase peak difficulty ${currentPeak.difficulty.toFixed(2)} regresses from ` +
          `previous peak ${previousPeak.difficulty.toFixed(2)}`,
      );
    }
    if (!didNotRegress(stats.maxBallSpeed, previous.maxBallSpeed)) {
      push(
        stats.phase.id,
        `phase max ballSpeed ${stats.maxBallSpeed} regresses from ` +
          `previous phase max ${previous.maxBallSpeed}`,
      );
    }
  });

  return issues;
}

/** Short human-readable report used by `scripts/validate-content.ts`. */
export function formatContentReport(phases: readonly PhaseDef[] = PHASES): string {
  const lines: string[] = [];
  let totalWaves = 0;
  let totalBlocks = 0;
  let totalXp = 0;

  for (const stats of phases.map((phase) => phaseStats(phase))) {
    lines.push(
      `Level ${stats.phase.index} - ${stats.phase.name} (${stats.phase.id}) | ` +
        `waves=${stats.waves.length} blocks=${stats.blocks} xp=${stats.hp} ` +
        `avgHp=${stats.avgHp.toFixed(2)} density=${stats.density.toFixed(2)} ` +
        `levelUps=${stats.levelUps}`,
    );
    for (const wave of stats.waves) {
      totalWaves += 1;
      totalBlocks += wave.blocks;
      totalXp += wave.hp;
      const tags: string[] = [];
      if (wave.wave.boss) tags.push(`boss=${wave.wave.boss.name}`);
      for (const rule of wave.wave.rules ?? []) {
        tags.push(rule.kind === 'timeLimit' ? `limit=${rule.ms / 1000}s` : rule.kind);
      }
      const suffix = tags.length > 0 ? ` [${tags.join(' ')}]` : '';
      lines.push(
        `  ${wave.wave.id.padEnd(5)} ${wave.wave.name.padEnd(20)} ` +
          `${wave.columns}x${String(wave.rows).padStart(2)} ` +
          `blocks=${String(wave.blocks).padStart(2)} ` +
          `xp=${String(wave.hp).padStart(3)} avgHp=${wave.avgHp.toFixed(2)} ` +
          `density=${wave.density.toFixed(2)} score=${wave.difficulty.toFixed(2)} ` +
          `speed=${wave.wave.ballSpeed}${suffix}`,
      );
    }
  }

  lines.push(
    `Totals: levels=${phases.length} waves=${totalWaves} blocks=${totalBlocks} xp=${totalXp}`,
  );
  return lines.join('\n');
}
