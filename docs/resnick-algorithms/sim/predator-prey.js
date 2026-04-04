/**
 * Predator-Prey Dynamics — wolves, sheep, and grass.
 *
 * Sheep eat grass, gain energy. Wolves eat sheep, gain energy.
 * Both lose energy each step, reproduce above a threshold, and die at zero.
 * Grass regrows after a fixed number of ticks.
 *
 * Emergent behavior: population oscillations.
 */

import { makeRng } from './rng.js';

/**
 * @typedef {Object} Agent
 * @property {number} x
 * @property {number} y
 * @property {number} energy
 */

/**
 * @typedef {Object} PredPreyState
 * @property {number}     width
 * @property {number}     height
 * @property {Int16Array} grass       - countdown: 0 = grown, >0 = regrowing
 * @property {Agent[]}    sheep
 * @property {Agent[]}    wolves
 * @property {number}     grassRegrowTime
 * @property {number}     sheepGainFromGrass
 * @property {number}     wolfGainFromSheep
 * @property {number}     sheepReproduce   - probability [0,1]
 * @property {number}     wolfReproduce    - probability [0,1]
 * @property {() => number} rng
 * @property {number}     tick
 */

const DX = [0, 1, 0, -1];
const DY = [-1, 0, 1, 0];

function wrap(v, max) { return ((v % max) + max) % max; }

/**
 * @param {Object} params
 * @param {number} params.width
 * @param {number} params.height
 * @param {number} params.numSheep
 * @param {number} params.numWolves
 * @param {number} [params.grassRegrowTime=30]
 * @param {number} [params.sheepGainFromGrass=4]
 * @param {number} [params.wolfGainFromSheep=20]
 * @param {number} [params.sheepReproduce=0.04]
 * @param {number} [params.wolfReproduce=0.05]
 * @param {number} [params.initialEnergy=10]
 * @param {number} [params.seed=42]
 * @returns {PredPreyState}
 */
export function createState({
  width, height, numSheep, numWolves,
  grassRegrowTime = 30,
  sheepGainFromGrass = 4,
  wolfGainFromSheep = 20,
  sheepReproduce = 0.04,
  wolfReproduce = 0.05,
  initialEnergy = 10,
  seed = 42,
}) {
  const rng = makeRng(seed);
  const grass = new Int16Array(width * height); // all 0 = fully grown

  const makeAgents = (n) => {
    const agents = [];
    for (let i = 0; i < n; i++) {
      agents.push({
        x: Math.floor(rng() * width),
        y: Math.floor(rng() * height),
        energy: Math.floor(rng() * initialEnergy * 2) + 1,
      });
    }
    return agents;
  };

  return {
    width, height, grass,
    sheep: makeAgents(numSheep),
    wolves: makeAgents(numWolves),
    grassRegrowTime, sheepGainFromGrass, wolfGainFromSheep,
    sheepReproduce, wolfReproduce, rng, tick: 0,
  };
}

/**
 * Move an agent one step in a random direction.
 */
function moveAgent(agent, width, height, rng) {
  const d = Math.floor(rng() * 4);
  agent.x = wrap(agent.x + DX[d], width);
  agent.y = wrap(agent.y + DY[d], height);
}

/**
 * Attempt reproduction. Returns offspring or null.
 * @param {Agent} agent
 * @param {number} prob
 * @param {() => number} rng
 * @returns {Agent|null}
 */
export function reproduce(agent, prob, rng) {
  if (rng() < prob) {
    agent.energy = Math.floor(agent.energy / 2);
    return { x: agent.x, y: agent.y, energy: agent.energy };
  }
  return null;
}

/**
 * Advance the simulation by one tick.
 * @param {PredPreyState} state
 * @returns {PredPreyState}
 */
export function step(state) {
  const {
    width, height, grass, sheepGainFromGrass, wolfGainFromSheep,
    sheepReproduce, wolfReproduce, grassRegrowTime, rng,
  } = state;

  // --- Sheep ---
  const newSheep = [];
  for (const s of state.sheep) {
    moveAgent(s, width, height, rng);
    s.energy--;

    // Eat grass
    const gi = s.y * width + s.x;
    if (grass[gi] === 0) {
      s.energy += sheepGainFromGrass;
      grass[gi] = grassRegrowTime;
    }

    if (s.energy <= 0) continue; // dies

    const offspring = reproduce(s, sheepReproduce, rng);
    newSheep.push(s);
    if (offspring) newSheep.push(offspring);
  }
  state.sheep = newSheep;

  // --- Wolves ---
  // Build lookup of sheep by cell for predation
  const sheepByCell = new Map();
  for (let i = 0; i < state.sheep.length; i++) {
    const key = state.sheep[i].y * width + state.sheep[i].x;
    if (!sheepByCell.has(key)) sheepByCell.set(key, []);
    sheepByCell.get(key).push(i);
  }
  const eatenSheepIndices = new Set();

  const newWolves = [];
  for (const w of state.wolves) {
    moveAgent(w, width, height, rng);
    w.energy--;

    // Try to eat a sheep
    const key = w.y * width + w.x;
    const prey = sheepByCell.get(key);
    if (prey && prey.length > 0) {
      const si = prey.pop();
      if (!eatenSheepIndices.has(si)) {
        eatenSheepIndices.add(si);
        w.energy += wolfGainFromSheep;
      }
    }

    if (w.energy <= 0) continue; // dies

    const offspring = reproduce(w, wolfReproduce, rng);
    newWolves.push(w);
    if (offspring) newWolves.push(offspring);
  }
  state.wolves = newWolves;

  // Remove eaten sheep
  if (eatenSheepIndices.size > 0) {
    state.sheep = state.sheep.filter((_, i) => !eatenSheepIndices.has(i));
  }

  // --- Grass regrowth ---
  for (let i = 0; i < grass.length; i++) {
    if (grass[i] > 0) grass[i]--;
  }

  state.tick++;
  return state;
}

/**
 * @param {PredPreyState} state
 * @returns {{sheep: number, wolves: number, grass: number}}
 */
export function populations(state) {
  let grownGrass = 0;
  for (let i = 0; i < state.grass.length; i++) {
    if (state.grass[i] === 0) grownGrass++;
  }
  return { sheep: state.sheep.length, wolves: state.wolves.length, grass: grownGrass };
}
