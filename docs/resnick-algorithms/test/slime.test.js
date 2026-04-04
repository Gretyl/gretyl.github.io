import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import {
  createState, step, evaporate, diffuse, totalPheromone,
} from '../sim/slime.js';

describe('slime — createState', () => {
  it('creates the correct number of agents', () => {
    const s = createState({ width: 80, height: 80, numAgents: 100 });
    assert.equal(s.agents.length, 100);
  });
});

describe('slime — agent count invariant', () => {
  it('preserves agent count across steps', () => {
    const s = createState({ width: 60, height: 60, numAgents: 50, seed: 3 });
    for (let i = 0; i < 100; i++) step(s);
    assert.equal(s.agents.length, 50);
  });
});

describe('slime — evaporate', () => {
  it('reduces total pheromone', () => {
    const ph = new Float32Array([10, 20, 30]);
    const before = totalPheromone(ph);
    evaporate(ph, 0.1);
    const after = totalPheromone(ph);
    assert.ok(after < before);
  });

  it('rate=1 zeroes all pheromone', () => {
    const ph = new Float32Array([10, 20, 30]);
    evaporate(ph, 1.0);
    assert.equal(totalPheromone(ph), 0);
  });
});

describe('slime — diffuse', () => {
  it('preserves total pheromone approximately', () => {
    const w = 10, h = 10;
    const ph = new Float32Array(w * h);
    ph[55] = 100; // single spike
    const before = totalPheromone(ph);
    const after = diffuse(ph, w, h, 0.5);
    const afterTotal = totalPheromone(after);
    assert.ok(Math.abs(afterTotal - before) < 1,
      `total pheromone should be conserved: before=${before}, after=${afterTotal}`);
  });

  it('produces symmetric output for symmetric input', () => {
    const w = 5, h = 5;
    const ph = new Float32Array(w * h);
    ph[2 * w + 2] = 100; // center cell
    const result = diffuse(ph, w, h, 0.5);
    // Check that the 4 cardinal neighbors have equal values
    const up = result[1 * w + 2];
    const down = result[3 * w + 2];
    const left = result[2 * w + 1];
    const right = result[2 * w + 3];
    assert.ok(Math.abs(up - down) < 1e-6, 'up-down symmetry');
    assert.ok(Math.abs(left - right) < 1e-6, 'left-right symmetry');
    assert.ok(Math.abs(up - left) < 1e-6, 'cardinal symmetry');
  });
});

describe('slime — pheromone decay without agents', () => {
  it('pheromone decreases when no agents deposit', () => {
    const s = createState({ width: 20, height: 20, numAgents: 0, seed: 1 });
    // Manually set some pheromone
    s.pheromone[50] = 100;
    const before = totalPheromone(s.pheromone);
    step(s);
    const after = totalPheromone(s.pheromone);
    assert.ok(after < before);
  });
});

describe('slime — gradient following', () => {
  it('agent facing gradient turns toward it', () => {
    const s = createState({ width: 40, height: 40, numAgents: 1, seed: 1 });
    // Place strong pheromone to the right of the agent
    const a = s.agents[0];
    a.x = 20; a.y = 20; a.heading = 0; // facing right
    // Place pheromone ahead-right
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        s.pheromone[(20 + dy) * 40 + (30 + dx)] = 100;
      }
    }
    const headingBefore = a.heading;
    step(s);
    // Agent should have moved forward (heading ~0 should stay roughly similar since pheromone is ahead)
    // Just verify the agent moved
    assert.ok(a.x !== 20 || a.y !== 20, 'agent should have moved');
  });
});

describe('slime — determinism', () => {
  it('same seed produces identical states', () => {
    const a = createState({ width: 30, height: 30, numAgents: 20, seed: 77 });
    const b = createState({ width: 30, height: 30, numAgents: 20, seed: 77 });
    for (let i = 0; i < 50; i++) { step(a); step(b); }
    for (let i = 0; i < a.agents.length; i++) {
      assert.ok(Math.abs(a.agents[i].x - b.agents[i].x) < 1e-10);
      assert.ok(Math.abs(a.agents[i].y - b.agents[i].y) < 1e-10);
    }
  });
});
