import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import {
  createState, step, evaporatePheromone, totalPheromone,
} from '../sim/ants.js';

describe('ants — createState', () => {
  it('creates the correct number of ants', () => {
    const s = createState({ width: 80, height: 80, numAnts: 50 });
    assert.equal(s.ants.length, 50);
  });

  it('starts ants at the nest', () => {
    const s = createState({ width: 80, height: 80, numAnts: 10 });
    for (const a of s.ants) {
      assert.equal(a.x, s.nestX);
      assert.equal(a.y, s.nestY);
    }
  });

  it('ants start without food', () => {
    const s = createState({ width: 80, height: 80, numAnts: 10 });
    assert.ok(s.ants.every(a => !a.hasFood));
  });
});

describe('ants — ant count invariant', () => {
  it('preserves ant count across steps', () => {
    const s = createState({ width: 60, height: 60, numAnts: 30, seed: 7 });
    for (let i = 0; i < 100; i++) step(s);
    assert.equal(s.ants.length, 30);
  });
});

describe('ants — pheromone evaporation', () => {
  it('reduces total pheromone', () => {
    const ph = new Float32Array([10, 20, 30, 40]);
    const before = ph.reduce((a, b) => a + b, 0);
    evaporatePheromone(ph, 0.1);
    const after = ph.reduce((a, b) => a + b, 0);
    assert.ok(after < before, `pheromone should decrease: ${after} >= ${before}`);
  });

  it('clears near-zero pheromone', () => {
    const ph = new Float32Array([0.0005]);
    evaporatePheromone(ph, 0.5);
    assert.equal(ph[0], 0);
  });
});

describe('ants — food conservation', () => {
  it('food picked up + remaining = initial', () => {
    const s = createState({ width: 60, height: 60, numAnts: 50, seed: 42 });
    const initial = s.foodRemaining;
    for (let i = 0; i < 500; i++) step(s);
    const carrying = s.ants.filter(a => a.hasFood).length;
    assert.equal(s.foodRemaining + s.foodDelivered + carrying, initial);
  });
});

describe('ants — trail formation', () => {
  it('builds pheromone near food-nest axis after many steps', () => {
    const s = createState({ width: 80, height: 80, numAnts: 80, seed: 42 });
    for (let i = 0; i < 1000; i++) step(s);
    // Sample pheromone near the midpoint between nest and food
    const midX = Math.floor((s.nestX + s.foodX) / 2);
    const midY = Math.floor((s.nestY + s.foodY) / 2);
    // Average pheromone in a 5x5 area around the midpoint
    let nearSum = 0, nearCount = 0;
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        nearSum += s.pheromone[(midY + dy) * s.width + (midX + dx)];
        nearCount++;
      }
    }
    // Average pheromone in a far corner
    let farSum = 0, farCount = 0;
    for (let dy = 0; dy < 5; dy++) {
      for (let dx = 0; dx < 5; dx++) {
        farSum += s.pheromone[dy * s.width + dx];
        farCount++;
      }
    }
    const nearAvg = nearSum / nearCount;
    const farAvg = farSum / farCount;
    assert.ok(nearAvg > farAvg,
      `pheromone near path (${nearAvg.toFixed(2)}) should exceed far corner (${farAvg.toFixed(2)})`);
  });
});

describe('ants — determinism', () => {
  it('same seed produces identical states', () => {
    const a = createState({ width: 60, height: 60, numAnts: 20, seed: 55 });
    const b = createState({ width: 60, height: 60, numAnts: 20, seed: 55 });
    for (let i = 0; i < 100; i++) { step(a); step(b); }
    assert.equal(a.foodDelivered, b.foodDelivered);
    assert.equal(a.foodRemaining, b.foodRemaining);
  });
});
