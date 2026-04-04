/**
 * Traffic Jam Formation — Nagel-Schreckenberg model on a 1D ring road.
 *
 * Cars follow simple local rules on a circular road:
 *   1. Accelerate (up to maxSpeed)
 *   2. Brake if too close to the car ahead
 *   3. Random dawdling (slow down with probability p)
 *   4. Move forward by current speed
 *
 * Emergent behavior: spontaneous traffic jams that propagate backward.
 */

import { makeRng } from './rng.js';

/**
 * @typedef {Object} TrafficState
 * @property {number}   roadLength
 * @property {number}   maxSpeed
 * @property {number}   dawdleProb
 * @property {number[]} positions - sorted car positions on [0, roadLength)
 * @property {number[]} speeds   - speed of each car (same index as positions)
 * @property {() => number} rng
 * @property {number}   tick
 */

/**
 * Create initial traffic state with evenly-spaced cars.
 *
 * @param {Object} params
 * @param {number} params.roadLength - number of cells
 * @param {number} params.numCars    - number of cars
 * @param {number} [params.maxSpeed=5]    - maximum speed
 * @param {number} [params.dawdleProb=0.3] - probability of random braking
 * @param {number} [params.seed=42]
 * @returns {TrafficState}
 */
export function createState({
  roadLength,
  numCars,
  maxSpeed = 5,
  dawdleProb = 0.3,
  seed = 42,
}) {
  const rng = makeRng(seed);
  const spacing = Math.floor(roadLength / numCars);
  const positions = [];
  const speeds = [];
  for (let i = 0; i < numCars; i++) {
    positions.push((i * spacing) % roadLength);
    speeds.push(0);
  }
  return { roadLength, maxSpeed, dawdleProb, positions, speeds, rng, tick: 0 };
}

/**
 * Gap from car i to the car ahead of it on the ring road.
 * @param {TrafficState} state
 * @param {number} i - car index
 * @returns {number}
 */
export function gap(state, i) {
  const { positions, roadLength } = state;
  const n = positions.length;
  const next = (i + 1) % n;
  const d = positions[next] - positions[i];
  return d > 0 ? d - 1 : d + roadLength - 1;
}

/**
 * Advance the simulation by one tick (mutates state in place).
 * @param {TrafficState} state
 * @returns {TrafficState}
 */
export function step(state) {
  const { maxSpeed, dawdleProb, roadLength, positions, speeds, rng } = state;
  const n = positions.length;

  for (let i = 0; i < n; i++) {
    // 1. Accelerate
    if (speeds[i] < maxSpeed) speeds[i]++;
    // 2. Brake: don't exceed gap to car ahead
    const g = gap(state, i);
    if (speeds[i] > g) speeds[i] = g;
    // 3. Random dawdling
    if (speeds[i] > 0 && rng() < dawdleProb) speeds[i]--;
  }

  // 4. Move
  for (let i = 0; i < n; i++) {
    positions[i] = (positions[i] + speeds[i]) % roadLength;
  }

  state.tick++;
  return state;
}

/**
 * Average speed of all cars.
 * @param {TrafficState} state
 * @returns {number}
 */
export function avgSpeed(state) {
  if (state.speeds.length === 0) return 0;
  const sum = state.speeds.reduce((a, b) => a + b, 0);
  return sum / state.speeds.length;
}

/**
 * Density: cars per cell.
 * @param {TrafficState} state
 * @returns {number}
 */
export function density(state) {
  return state.positions.length / state.roadLength;
}

/**
 * Check that no two cars occupy the same cell.
 * @param {TrafficState} state
 * @returns {boolean}
 */
export function noCollisions(state) {
  const seen = new Set(state.positions);
  return seen.size === state.positions.length;
}
