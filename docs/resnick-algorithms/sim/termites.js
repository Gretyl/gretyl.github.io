/**
 * Termite Wood Gathering — decentralized pile formation.
 *
 * Termites wander randomly on a 2D grid:
 *   - If not carrying and on a wood chip: pick it up
 *   - If carrying and adjacent to another wood chip: drop yours nearby
 *
 * Emergent behavior: scattered chips self-organize into piles.
 */

import { makeRng } from './rng.js';

// Directions: 4-connected (N, E, S, W)
const DX = [0, 1, 0, -1];
const DY = [-1, 0, 1, 0];

/**
 * @typedef {Object} TermitesState
 * @property {number}      width
 * @property {number}      height
 * @property {Uint8Array}  grid      - 0 = empty, 1 = wood
 * @property {Object[]}    termites  - {x, y, carrying}
 * @property {() => number} rng
 * @property {number}      tick
 */

/**
 * @param {Object} params
 * @param {number} params.width
 * @param {number} params.height
 * @param {number} params.numTermites
 * @param {number} params.numWood
 * @param {number} [params.seed=42]
 * @returns {TermitesState}
 */
export function createState({ width, height, numTermites, numWood, seed = 42 }) {
  const rng = makeRng(seed);
  const grid = new Uint8Array(width * height);

  // Place wood chips randomly
  let placed = 0;
  while (placed < numWood) {
    const idx = Math.floor(rng() * width * height);
    if (grid[idx] === 0) { grid[idx] = 1; placed++; }
  }

  // Place termites randomly
  const termites = [];
  for (let i = 0; i < numTermites; i++) {
    termites.push({
      x: Math.floor(rng() * width),
      y: Math.floor(rng() * height),
      carrying: false,
    });
  }

  return { width, height, grid, termites, rng, tick: 0 };
}

/** Wrap coordinate on torus. */
function wrap(v, max) { return ((v % max) + max) % max; }

/** Grid index. */
function idx(x, y, w) { return y * w + x; }

/**
 * Count total wood chips on the grid + carried by termites.
 * @param {TermitesState} state
 * @returns {number}
 */
export function totalWood(state) {
  let count = 0;
  for (let i = 0; i < state.grid.length; i++) count += state.grid[i];
  for (const t of state.termites) if (t.carrying) count++;
  return count;
}

/**
 * Count distinct wood piles using flood fill (4-connected).
 * @param {TermitesState} state
 * @returns {number}
 */
export function countPiles(state) {
  const { width, height, grid } = state;
  const visited = new Uint8Array(width * height);
  let piles = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = idx(x, y, width);
      if (grid[i] === 1 && !visited[i]) {
        piles++;
        // BFS flood fill
        const queue = [[x, y]];
        visited[i] = 1;
        while (queue.length > 0) {
          const [cx, cy] = queue.pop();
          for (let d = 0; d < 4; d++) {
            const nx = wrap(cx + DX[d], width);
            const ny = wrap(cy + DY[d], height);
            const ni = idx(nx, ny, width);
            if (grid[ni] === 1 && !visited[ni]) {
              visited[ni] = 1;
              queue.push([nx, ny]);
            }
          }
        }
      }
    }
  }
  return piles;
}

/**
 * Check if any of the 4 neighbors has wood.
 * @param {Uint8Array} grid
 * @param {number} x
 * @param {number} y
 * @param {number} width
 * @param {number} height
 * @returns {boolean}
 */
export function hasAdjacentWood(grid, x, y, width, height) {
  for (let d = 0; d < 4; d++) {
    const nx = wrap(x + DX[d], width);
    const ny = wrap(y + DY[d], height);
    if (grid[idx(nx, ny, width)] === 1) return true;
  }
  return false;
}

/**
 * Advance the simulation by one tick.
 * @param {TermitesState} state
 * @returns {TermitesState}
 */
export function step(state) {
  const { width, height, grid, termites, rng } = state;

  for (const t of termites) {
    // Move randomly
    const dir = Math.floor(rng() * 4);
    t.x = wrap(t.x + DX[dir], width);
    t.y = wrap(t.y + DY[dir], height);

    const i = idx(t.x, t.y, width);

    if (!t.carrying) {
      // Pick up wood if standing on one
      if (grid[i] === 1) {
        grid[i] = 0;
        t.carrying = true;
      }
    } else {
      // Drop wood if standing on empty and there's adjacent wood
      if (grid[i] === 0 && hasAdjacentWood(grid, t.x, t.y, width, height)) {
        grid[i] = 1;
        t.carrying = false;
      }
    }
  }

  state.tick++;
  return state;
}
