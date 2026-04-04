import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import {
  createState, step, totalWood, countPiles, hasAdjacentWood,
} from '../sim/termites.js';

describe('termites — createState', () => {
  it('creates the correct number of termites', () => {
    const s = createState({ width: 50, height: 50, numTermites: 20, numWood: 100 });
    assert.equal(s.termites.length, 20);
  });

  it('places the correct amount of wood', () => {
    const s = createState({ width: 50, height: 50, numTermites: 10, numWood: 100 });
    assert.equal(totalWood(s), 100);
  });
});

describe('termites — totalWood conservation', () => {
  it('preserves total wood across many steps', () => {
    const s = createState({ width: 40, height: 40, numTermites: 30, numWood: 200, seed: 1 });
    const initial = totalWood(s);
    for (let i = 0; i < 500; i++) step(s);
    assert.equal(totalWood(s), initial);
  });
});

describe('termites — termite count invariant', () => {
  it('preserves termite count across steps', () => {
    const s = createState({ width: 30, height: 30, numTermites: 15, numWood: 50, seed: 3 });
    for (let i = 0; i < 200; i++) step(s);
    assert.equal(s.termites.length, 15);
  });
});

describe('termites — boundary wrapping', () => {
  it('wraps termites around grid edges', () => {
    const s = createState({ width: 10, height: 10, numTermites: 50, numWood: 0, seed: 5 });
    for (let i = 0; i < 100; i++) {
      step(s);
      for (const t of s.termites) {
        assert.ok(t.x >= 0 && t.x < 10, `x out of bounds: ${t.x}`);
        assert.ok(t.y >= 0 && t.y < 10, `y out of bounds: ${t.y}`);
      }
    }
  });
});

describe('termites — hasAdjacentWood', () => {
  it('detects wood in cardinal directions', () => {
    const w = 5, h = 5;
    const grid = new Uint8Array(w * h);
    grid[1 * w + 2] = 1; // wood at (2, 1)
    assert.ok(hasAdjacentWood(grid, 2, 0, w, h)); // above (2,1)
    assert.ok(hasAdjacentWood(grid, 3, 1, w, h)); // right of (2,1)
    assert.ok(!hasAdjacentWood(grid, 0, 0, w, h)); // far away
  });

  it('wraps around edges', () => {
    const w = 5, h = 5;
    const grid = new Uint8Array(w * h);
    grid[0] = 1; // wood at (0, 0)
    assert.ok(hasAdjacentWood(grid, 4, 0, w, h)); // wraps in x
    assert.ok(hasAdjacentWood(grid, 0, 4, w, h)); // wraps in y
  });
});

describe('termites — pile convergence', () => {
  it('reduces pile count over time', () => {
    const s = createState({ width: 40, height: 40, numTermites: 50, numWood: 200, seed: 42 });
    const initialPiles = countPiles(s);
    for (let i = 0; i < 5000; i++) step(s);
    const finalPiles = countPiles(s);
    assert.ok(finalPiles < initialPiles,
      `expected fewer piles: initial=${initialPiles}, final=${finalPiles}`);
  });
});

describe('termites — determinism', () => {
  it('same seed produces identical states', () => {
    const a = createState({ width: 20, height: 20, numTermites: 10, numWood: 50, seed: 99 });
    const b = createState({ width: 20, height: 20, numTermites: 10, numWood: 50, seed: 99 });
    for (let i = 0; i < 100; i++) { step(a); step(b); }
    assert.deepEqual(Array.from(a.grid), Array.from(b.grid));
  });
});
