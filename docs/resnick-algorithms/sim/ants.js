/**
 * Ant Foraging — pheromone trail formation.
 *
 * Ants leave the nest, wander, find food, then return to the nest
 * laying pheromone. Other ants follow pheromone gradients.
 * Pheromone evaporates over time.
 *
 * Emergent behavior: efficient foraging paths.
 */

import { makeRng } from './rng.js';

const DX = [0, 1, 0, -1];
const DY = [-1, 0, 1, 0];

/**
 * @typedef {Object} AntsState
 * @property {number}       width
 * @property {number}       height
 * @property {Float32Array} pheromone    - pheromone level per cell
 * @property {number}       nestX
 * @property {number}       nestY
 * @property {number}       foodX
 * @property {number}       foodY
 * @property {number}       foodRadius
 * @property {number}       foodRemaining
 * @property {number}       foodDelivered
 * @property {Object[]}     ants         - {x, y, hasFood, dir}
 * @property {number}       evaporationRate
 * @property {() => number} rng
 * @property {number}       tick
 */

function wrap(v, max) { return ((v % max) + max) % max; }

/**
 * @param {Object} params
 * @param {number} params.width
 * @param {number} params.height
 * @param {number} params.numAnts
 * @param {number} [params.evaporationRate=0.02]
 * @param {number} [params.seed=42]
 * @returns {AntsState}
 */
export function createState({
  width, height, numAnts,
  evaporationRate = 0.02,
  seed = 42,
}) {
  const rng = makeRng(seed);
  const pheromone = new Float32Array(width * height);

  const nestX = Math.floor(width * 0.25);
  const nestY = Math.floor(height * 0.5);
  const foodX = Math.floor(width * 0.75);
  const foodY = Math.floor(height * 0.5);
  const foodRadius = Math.floor(Math.min(width, height) * 0.08);

  // Count initial food cells
  let foodRemaining = 0;
  for (let dy = -foodRadius; dy <= foodRadius; dy++) {
    for (let dx = -foodRadius; dx <= foodRadius; dx++) {
      if (dx * dx + dy * dy <= foodRadius * foodRadius) foodRemaining++;
    }
  }

  const ants = [];
  for (let i = 0; i < numAnts; i++) {
    ants.push({ x: nestX, y: nestY, hasFood: false, dir: Math.floor(rng() * 4) });
  }

  return {
    width, height, pheromone, nestX, nestY, foodX, foodY, foodRadius,
    foodRemaining, foodDelivered: 0, ants, evaporationRate, rng, tick: 0,
  };
}

/**
 * Is (x,y) within the food zone?
 */
function isFood(state, x, y) {
  const dx = x - state.foodX, dy = y - state.foodY;
  return dx * dx + dy * dy <= state.foodRadius * state.foodRadius;
}

/**
 * Is (x,y) at the nest?
 */
function isNest(state, x, y) {
  return Math.abs(x - state.nestX) <= 2 && Math.abs(y - state.nestY) <= 2;
}

/**
 * Evaporate pheromone across the grid.
 * @param {Float32Array} pheromone
 * @param {number} rate
 */
export function evaporatePheromone(pheromone, rate) {
  for (let i = 0; i < pheromone.length; i++) {
    pheromone[i] *= (1 - rate);
    if (pheromone[i] < 0.001) pheromone[i] = 0;
  }
}

/**
 * Total pheromone on the grid.
 * @param {AntsState} state
 * @returns {number}
 */
export function totalPheromone(state) {
  let sum = 0;
  for (let i = 0; i < state.pheromone.length; i++) sum += state.pheromone[i];
  return sum;
}

/**
 * Advance the simulation by one tick.
 * @param {AntsState} state
 * @returns {AntsState}
 */
export function step(state) {
  const { width, height, pheromone, ants, rng } = state;

  for (const ant of ants) {
    if (ant.hasFood) {
      // Lay pheromone
      pheromone[ant.y * width + ant.x] += 2;
      // Head toward nest (biased random walk)
      const dx = state.nestX - ant.x;
      const dy = state.nestY - ant.y;
      if (Math.abs(dx) + Math.abs(dy) > 0 && rng() < 0.7) {
        if (Math.abs(dx) >= Math.abs(dy)) {
          ant.dir = dx > 0 ? 1 : 3;
        } else {
          ant.dir = dy > 0 ? 2 : 0;
        }
      } else {
        ant.dir = (ant.dir + (rng() < 0.5 ? 1 : 3)) % 4;
      }
    } else {
      // Follow pheromone or wander
      let bestDir = -1, bestPh = 0;
      for (let d = 0; d < 4; d++) {
        const nx = wrap(ant.x + DX[d], width);
        const ny = wrap(ant.y + DY[d], height);
        const ph = pheromone[ny * width + nx];
        if (ph > bestPh) { bestPh = ph; bestDir = d; }
      }
      if (bestDir >= 0 && rng() < 0.6) {
        ant.dir = bestDir;
      } else {
        // Random turn
        if (rng() < 0.3) ant.dir = (ant.dir + (rng() < 0.5 ? 1 : 3)) % 4;
      }
    }

    // Move
    ant.x = wrap(ant.x + DX[ant.dir], width);
    ant.y = wrap(ant.y + DY[ant.dir], height);

    // Pick up food
    if (!ant.hasFood && isFood(state, ant.x, ant.y) && state.foodRemaining > 0) {
      ant.hasFood = true;
      state.foodRemaining--;
    }

    // Deliver food
    if (ant.hasFood && isNest(state, ant.x, ant.y)) {
      ant.hasFood = false;
      state.foodDelivered++;
    }
  }

  evaporatePheromone(pheromone, state.evaporationRate);
  state.tick++;
  return state;
}
