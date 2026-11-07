/** Fixed-step accumulator shared by the game loop and unit tests. */
export class FixedStepClock {
  accumulatorMs = 0;

  reset(): void {
    this.accumulatorMs = 0;
  }

  /**
   * Adds one frame to the accumulator and returns how many fixed steps should
   * run. At most `maxSteps` are returned; a remaining backlog is discarded so
   * a long hitch never makes entities teleport.
   */
  advance(deltaMs: number, stepHz: number, maxSteps = 5): number {
    const stepMs = 1000 / stepHz;
    this.accumulatorMs += Math.max(0, Math.min(deltaMs, 250));

    let steps = 0;
    while (this.accumulatorMs >= stepMs && steps < maxSteps) {
      this.accumulatorMs -= stepMs;
      steps += 1;
    }

    if (steps === maxSteps && this.accumulatorMs >= stepMs) {
      this.accumulatorMs = 0;
    }

    return steps;
  }
}
