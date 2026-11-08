import { GAME_CONFIG } from '../game/config';
import { BLOCK_TYPES, isBlockTypeId } from '../sim/blocks';
import { BLOCK_TOP, PADDLE_BOTTOM_OFFSET } from '../sim/World';
import { xpCostForLevel } from '../progression/xp';
import type { PhaseDef, WaveDef } from './types';
import { PHASE_1_WAVES, PHASE_2_WAVES, PHASE_3_WAVES } from './waves';

/** Stable phase order consumed by the game and by the content validator. */
export const PHASES: readonly PhaseDef[] = [
  {
    id: 'phase-1',
    index: 1,
    name: 'Crystal Grove',
    waves: PHASE_1_WAVES,
  },
  {
    id: 'phase-2',
    index: 2,
    name: 'Ruined Halls',
    waves: PHASE_2_WAVES,
  },
  {
    id: 'phase-3',
    index: 3,
    name: 'Arcane Depths',
    waves: PHASE_3_WAVES,
  },
];

/** Conservative validation viewport. The live game is always taller (1280+). */
export const CONTENT_EVALUATION_HEIGHT = 720;
export const CONTENT_EVALUATION_WIDTH = 720;

/** Top of the paddle box at the conservative 720-unit validation height. */
export const PADDLE_ZONE_TOP =
  CONTENT_EVALUATION_HEIGHT - PADDLE_BOTTOM_OFFSET - GAME_CONFIG.paddle.height / 2;

export const BALL_SPEED_MIN = 500;
export const BALL_SPEED_MAX = 780;
/** Slack for the monotonic difficulty check across wave boundaries. */
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
  const cellSize = columns > 0 ? CONTENT_EVALUATION_WIDTH / columns : 0;
  const gridBottom = BLOCK_TOP + rows * cellSize;

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

/** Structural and tuning checks shared by the CLI validator and unit tests. */
export function validateContent(phases: readonly PhaseDef[] = PHASES): ContentIssue[] {
  const issues: ContentIssue[] = [];
  const push = (path: string, message: string): void => {
    issues.push({ path, message });
  };

  if (phases.length !== 3) {
    push('phases', `expected exactly 3 phases, found ${phases.length}`);
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
    if (phase.waves.length !== 3) {
      push(phasePath, `expected exactly 3 waves, found ${phase.waves.length}`);
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

      const columns = wave.rows[0]?.length ?? 0;
      if (columns === 0) {
        push(wavePath, 'rows must not be empty');
        return;
      }

      wave.rows.forEach((row, rowIndex) => {
        if (row.length !== columns) {
          push(
            wavePath,
            `row ${rowIndex} has width ${row.length}, expected ${columns}`,
          );
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

      if (blockCount === 0) {
        push(wavePath, 'wave must contain at least one destructible block');
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
    if (stats.levelUps < 4 || stats.levelUps > 8) {
      push(phasePath, `expected 4-8 level ups, found ${stats.levelUps}`);
    }
  });

  // Max speed must climb phase over phase (waves may reset at a phase start).
  const phaseStatsList = phases.map((phase) => phaseStats(phase));
  phaseStatsList.forEach((stats, index) => {
    if (index === 0) return;
    const previous = phaseStatsList[index - 1];
    if (previous && stats.maxBallSpeed <= previous.maxBallSpeed) {
      push(
        stats.phase.id,
        `phase max ballSpeed ${stats.maxBallSpeed} must exceed ` +
          `previous phase max ${previous.maxBallSpeed}`,
      );
    }
  });

  // Average HP and the HP x density score must never go backwards.
  const ordered = phaseStatsList.flatMap((stats) => stats.waves);
  ordered.forEach((stats, index) => {
    if (index === 0) return;
    const previous = ordered[index - 1];
    if (!previous) return;
    const path = `${stats.phaseId}/${stats.wave.id}`;

    if (stats.avgHp + DIFFICULTY_TOLERANCE < previous.avgHp) {
      push(
        path,
        `average HP ${stats.avgHp.toFixed(2)} falls below previous ` +
          `${previous.avgHp.toFixed(2)}`,
      );
    }
    if (stats.difficulty + DIFFICULTY_TOLERANCE < previous.difficulty) {
      push(
        path,
        `difficulty ${stats.difficulty.toFixed(2)} falls below previous ` +
          `${previous.difficulty.toFixed(2)}`,
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
      `Phase ${stats.phase.index} - ${stats.phase.name} (${stats.phase.id}) | ` +
        `waves=${stats.waves.length} blocks=${stats.blocks} xp=${stats.hp} ` +
        `avgHp=${stats.avgHp.toFixed(2)} density=${stats.density.toFixed(2)} ` +
        `levelUps=${stats.levelUps}`,
    );
    for (const wave of stats.waves) {
      totalWaves += 1;
      totalBlocks += wave.blocks;
      totalXp += wave.hp;
      lines.push(
        `  ${wave.wave.id.padEnd(5)} ${wave.wave.name.padEnd(18)} ` +
          `${wave.columns}x${wave.rows} blocks=${String(wave.blocks).padStart(2)} ` +
          `xp=${String(wave.hp).padStart(3)} avgHp=${wave.avgHp.toFixed(2)} ` +
          `density=${wave.density.toFixed(2)} score=${wave.difficulty.toFixed(2)} ` +
          `speed=${wave.wave.ballSpeed}`,
      );
    }
  }

  lines.push(
    `Totals: phases=${phases.length} waves=${totalWaves} blocks=${totalBlocks} xp=${totalXp}`,
  );
  return lines.join('\n');
}
