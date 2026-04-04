/**
 * Forest Fire Spread — percolation on a 2D grid.
 *
 * Cells are: EMPTY (0), TREE (1), BURNING (2), BURNED (3).
 * Fire spreads from burning cells to adjacent trees.
 * Demonstrates percolation threshold.
 */

import { makeRng } from './rng.js';

export const EMPTY = 0;
export const TREE = 1;
export const BURNING = 2;
export const BURNED = 3;

/**
 * @typedef {Object} FireState
 * @property {number}     width
 * @property {number}     height
 * @property {Uint8Array} grid
 * @property {number}     tick
 * @property {boolean}    active - true if any cells are still burning
 */

/**
 * Create a forest with random tree placement.
 * @param {Object} params
 * @param {number} params.width
 * @param {number} params.height
 * @param {number} params.density - fraction of cells that are trees [0,1]
 * @param {number} [params.seed=42]
 * @returns {FireState}
 */
export function createState({ width, height, density, seed = 42 }) {
  const rng = makeRng(seed);
  const grid = new Uint8Array(width * height);
  for (let i = 0; i < grid.length; i++) {
    grid[i] = rng() < density ? TREE : EMPTY;
  }
  return { width, height, grid, tick: 0, active: false };
}

/**
 * Ignite a single cell. Only trees can be ignited.
 * @param {FireState} state
 * @param {number} x
 * @param {number} y
 * @returns {boolean} true if ignition succeeded
 */
export function ignite(state, x, y) {
  const i = y * state.width + x;
  if (state.grid[i] === TREE) {
    state.grid[i] = BURNING;
    state.active = true;
    return true;
  }
  return false;
}

/**
 * Ignite the entire left edge (for percolation testing).
 * @param {FireState} state
 */
export function igniteLeftEdge(state) {
  for (let y = 0; y < state.height; y++) {
    ignite(state, 0, y);
  }
}

/**
 * Count cells by type.
 * @param {FireState} state
 * @returns {{empty: number, tree: number, burning: number, burned: number}}
 */
export function cellCounts(state) {
  let empty = 0, tree = 0, burning = 0, burned = 0;
  for (let i = 0; i < state.grid.length; i++) {
    switch (state.grid[i]) {
      case EMPTY: empty++; break;
      case TREE: tree++; break;
      case BURNING: burning++; break;
      case BURNED: burned++; break;
    }
  }
  return { empty, tree, burning, burned };
}

/**
 * Check if fire has reached the right edge (percolation).
 * @param {FireState} state
 * @returns {boolean}
 */
export function percolates(state) {
  const { width, height, grid } = state;
  for (let y = 0; y < height; y++) {
    const cell = grid[y * width + (width - 1)];
    if (cell === BURNING || cell === BURNED) return true;
  }
  return false;
}

/**
 * Advance simulation by one tick.
 * @param {FireState} state
 * @returns {FireState}
 */
export function step(state) {
  const { width, height, grid } = state;
  const newGrid = new Uint8Array(grid);

  let anyBurning = false;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      if (grid[i] === BURNING) {
        // This cell becomes burned
        newGrid[i] = BURNED;
        // Spread to 4 neighbors (no wrapping — finite forest)
        for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
          const nx = x + dx, ny = y + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const ni = ny * width + nx;
            if (grid[ni] === TREE) {
              newGrid[ni] = BURNING;
              anyBurning = true;
            }
          }
        }
      } else if (newGrid[i] === BURNING) {
        anyBurning = true;
      }
    }
  }

  state.grid = newGrid;
  state.active = anyBurning;
  state.tick++;
  return state;
}
