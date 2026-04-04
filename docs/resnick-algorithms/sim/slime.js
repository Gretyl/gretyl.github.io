/**
 * Slime Mold Aggregation — chemotaxis on a 2D grid.
 *
 * Cells secrete pheromone and "sniff" ahead in three directions
 * (left, center, right), turning toward the strongest signal.
 * Pheromone diffuses and evaporates.
 *
 * Emergent behavior: scattered cells aggregate into clusters.
 */

import { makeRng } from './rng.js';

/**
 * @typedef {Object} SlimeState
 * @property {number}       width
 * @property {number}       height
 * @property {Float32Array} pheromone
 * @property {Object[]}     agents - {x, y, heading}  heading in radians
 * @property {number}       sensorAngle
 * @property {number}       sensorDist
 * @property {number}       turnAngle
 * @property {number}       depositAmount
 * @property {number}       evapRate
 * @property {number}       diffuseRate
 * @property {() => number} rng
 * @property {number}       tick
 */

function wrap(v, max) { return ((v % max) + max) % max; }

/**
 * @param {Object} params
 * @param {number} params.width
 * @param {number} params.height
 * @param {number} params.numAgents
 * @param {number} [params.sensorAngle=0.6]   - radians (~34 deg)
 * @param {number} [params.sensorDist=9]
 * @param {number} [params.turnAngle=0.6]
 * @param {number} [params.depositAmount=5]
 * @param {number} [params.evapRate=0.1]
 * @param {number} [params.diffuseRate=0.1]
 * @param {number} [params.seed=42]
 * @returns {SlimeState}
 */
export function createState({
  width, height, numAgents,
  sensorAngle = 0.6,
  sensorDist = 9,
  turnAngle = 0.6,
  depositAmount = 5,
  evapRate = 0.1,
  diffuseRate = 0.1,
  seed = 42,
}) {
  const rng = makeRng(seed);
  const pheromone = new Float32Array(width * height);
  const agents = [];
  // Start agents in a cluster near center
  const cx = width / 2, cy = height / 2;
  const spread = Math.min(width, height) * 0.3;
  for (let i = 0; i < numAgents; i++) {
    agents.push({
      x: cx + (rng() - 0.5) * spread,
      y: cy + (rng() - 0.5) * spread,
      heading: rng() * Math.PI * 2,
    });
  }
  return {
    width, height, pheromone, agents, sensorAngle, sensorDist,
    turnAngle, depositAmount, evapRate, diffuseRate, rng, tick: 0,
  };
}

/**
 * Sample pheromone at a point (nearest cell).
 */
function sample(pheromone, x, y, width, height) {
  const ix = Math.floor(wrap(x, width));
  const iy = Math.floor(wrap(y, height));
  return pheromone[iy * width + ix];
}

/**
 * Evaporate pheromone grid.
 * @param {Float32Array} pheromone
 * @param {number} rate
 */
export function evaporate(pheromone, rate) {
  for (let i = 0; i < pheromone.length; i++) {
    pheromone[i] *= (1 - rate);
  }
}

/**
 * Diffuse pheromone using a 3x3 box blur.
 * @param {Float32Array} pheromone
 * @param {number} width
 * @param {number} height
 * @param {number} rate - blend factor [0,1]
 * @returns {Float32Array} new pheromone grid
 */
export function diffuse(pheromone, width, height, rate) {
  const out = new Float32Array(pheromone.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = ((x + dx) % width + width) % width;
          const ny = ((y + dy) % height + height) % height;
          sum += pheromone[ny * width + nx];
        }
      }
      const avg = sum / 9;
      const i = y * width + x;
      out[i] = pheromone[i] * (1 - rate) + avg * rate;
    }
  }
  return out;
}

/**
 * Total pheromone on the grid.
 * @param {Float32Array} pheromone
 * @returns {number}
 */
export function totalPheromone(pheromone) {
  let sum = 0;
  for (let i = 0; i < pheromone.length; i++) sum += pheromone[i];
  return sum;
}

/**
 * Advance the simulation by one tick.
 * @param {SlimeState} state
 * @returns {SlimeState}
 */
export function step(state) {
  const {
    width, height, agents, sensorAngle, sensorDist,
    turnAngle, depositAmount, rng,
  } = state;
  let { pheromone } = state;

  for (const a of agents) {
    // Sense: left, center, right
    const sL = sample(pheromone,
      a.x + Math.cos(a.heading - sensorAngle) * sensorDist,
      a.y + Math.sin(a.heading - sensorAngle) * sensorDist,
      width, height);
    const sC = sample(pheromone,
      a.x + Math.cos(a.heading) * sensorDist,
      a.y + Math.sin(a.heading) * sensorDist,
      width, height);
    const sR = sample(pheromone,
      a.x + Math.cos(a.heading + sensorAngle) * sensorDist,
      a.y + Math.sin(a.heading + sensorAngle) * sensorDist,
      width, height);

    // Turn toward strongest signal
    if (sC >= sL && sC >= sR) {
      // go straight
    } else if (sL > sR) {
      a.heading -= turnAngle;
    } else if (sR > sL) {
      a.heading += turnAngle;
    } else {
      // equal left and right: random turn
      a.heading += (rng() < 0.5 ? -1 : 1) * turnAngle;
    }

    // Move forward
    a.x = wrap(a.x + Math.cos(a.heading), width);
    a.y = wrap(a.y + Math.sin(a.heading), height);

    // Deposit pheromone
    const ix = Math.floor(a.x);
    const iy = Math.floor(a.y);
    pheromone[iy * width + ix] += depositAmount;
  }

  // Diffuse and evaporate
  pheromone = diffuse(pheromone, width, height, state.diffuseRate);
  evaporate(pheromone, state.evapRate);
  state.pheromone = pheromone;
  state.tick++;
  return state;
}
