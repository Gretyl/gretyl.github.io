import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import {
  createState, step, ignite, igniteLeftEdge, cellCounts, percolates,
  EMPTY, TREE, BURNING, BURNED,
} from '../sim/fire.js';

describe('fire — createState', () => {
  it('places approximately the right density of trees', () => {
    const s = createState({ width: 100, height: 100, density: 0.5, seed: 1 });
    const c = cellCounts(s);
    const frac = c.tree / (100 * 100);
    assert.ok(frac > 0.4 && frac < 0.6, `density ${frac} not near 0.5`);
  });
});

describe('fire — ignite', () => {
  it('ignites a tree cell', () => {
    const s = createState({ width: 10, height: 10, density: 1.0, seed: 1 });
    assert.ok(ignite(s, 0, 0));
    assert.equal(s.grid[0], BURNING);
  });

  it('cannot ignite empty cell', () => {
    const s = createState({ width: 10, height: 10, density: 0, seed: 1 });
    assert.ok(!ignite(s, 0, 0));
  });

  it('cannot ignite already burned cell', () => {
    const s = createState({ width: 10, height: 10, density: 1.0, seed: 1 });
    ignite(s, 0, 0);
    step(s); // cell becomes BURNED
    assert.ok(!ignite(s, 0, 0));
  });
});

describe('fire — cell conservation', () => {
  it('total cells remain constant', () => {
    const s = createState({ width: 30, height: 30, density: 0.6, seed: 5 });
    const total = 30 * 30;
    igniteLeftEdge(s);
    for (let i = 0; i < 100; i++) {
      step(s);
      const c = cellCounts(s);
      assert.equal(c.empty + c.tree + c.burning + c.burned, total,
        `cell count mismatch at tick ${s.tick}`);
    }
  });
});

describe('fire — state transitions', () => {
  it('empty cells never ignite', () => {
    // All empty grid with one burning cell adjacent
    const s = createState({ width: 5, height: 5, density: 0, seed: 1 });
    // Manually place one tree and ignite it
    s.grid[0] = TREE;
    ignite(s, 0, 0);
    step(s);
    // Cell (0,0) should be BURNED, all others still EMPTY
    assert.equal(s.grid[0], BURNED);
    for (let i = 1; i < s.grid.length; i++) {
      assert.equal(s.grid[i], EMPTY, `cell ${i} should remain empty`);
    }
  });

  it('burned cells never reignite', () => {
    const s = createState({ width: 5, height: 1, density: 1.0, seed: 1 });
    ignite(s, 0, 0);
    // Run until fire burns out
    for (let i = 0; i < 20; i++) step(s);
    // No burning cells should remain
    const c = cellCounts(s);
    assert.equal(c.burning, 0);
    // Burned cells should stay burned
    assert.ok(c.burned > 0);
  });

  it('fire spreads to adjacent trees', () => {
    const s = createState({ width: 3, height: 1, density: 1.0, seed: 1 });
    ignite(s, 0, 0);
    step(s);
    // Cell 0 becomes BURNED, cell 1 becomes BURNING
    assert.equal(s.grid[0], BURNED);
    assert.equal(s.grid[1], BURNING);
  });
});

describe('fire — no fire on empty grid', () => {
  it('stays inactive', () => {
    const s = createState({ width: 10, height: 10, density: 0, seed: 1 });
    step(s);
    assert.ok(!s.active);
    const c = cellCounts(s);
    assert.equal(c.burning, 0);
    assert.equal(c.burned, 0);
  });
});

describe('fire — percolation threshold', () => {
  it('low density rarely percolates', () => {
    let percolated = 0;
    for (let seed = 0; seed < 20; seed++) {
      const s = createState({ width: 50, height: 50, density: 0.3, seed });
      igniteLeftEdge(s);
      for (let i = 0; i < 200 && s.active; i++) step(s);
      if (percolates(s)) percolated++;
    }
    assert.ok(percolated < 10, `too many percolations at low density: ${percolated}/20`);
  });

  it('high density almost always percolates', () => {
    let percolated = 0;
    for (let seed = 0; seed < 20; seed++) {
      const s = createState({ width: 50, height: 50, density: 0.8, seed });
      igniteLeftEdge(s);
      for (let i = 0; i < 200 && s.active; i++) step(s);
      if (percolates(s)) percolated++;
    }
    assert.ok(percolated > 10, `too few percolations at high density: ${percolated}/20`);
  });
});
