import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import {
  createState,
  step,
  gap,
  avgSpeed,
  density,
  noCollisions,
} from '../sim/traffic.js';

describe('traffic — createState', () => {
  it('creates the correct number of cars', () => {
    const s = createState({ roadLength: 100, numCars: 10 });
    assert.equal(s.positions.length, 10);
    assert.equal(s.speeds.length, 10);
  });

  it('starts all cars at speed 0', () => {
    const s = createState({ roadLength: 100, numCars: 5 });
    assert.ok(s.speeds.every(v => v === 0));
  });

  it('spaces cars evenly', () => {
    const s = createState({ roadLength: 100, numCars: 10 });
    for (let i = 1; i < s.positions.length; i++) {
      assert.equal(s.positions[i] - s.positions[i - 1], 10);
    }
  });
});

describe('traffic — gap', () => {
  it('computes gap between adjacent cars', () => {
    const s = createState({ roadLength: 100, numCars: 4 });
    // positions: 0, 25, 50, 75
    assert.equal(gap(s, 0), 24); // 25 - 0 - 1
    assert.equal(gap(s, 1), 24);
  });

  it('wraps around the ring road', () => {
    const s = createState({ roadLength: 100, numCars: 4 });
    // gap from car 3 (pos 75) to car 0 (pos 0) = 100 - 75 - 1 = 24
    assert.equal(gap(s, 3), 24);
  });
});

describe('traffic — step invariants', () => {
  it('preserves car count', () => {
    const s = createState({ roadLength: 100, numCars: 20, seed: 1 });
    for (let i = 0; i < 50; i++) step(s);
    assert.equal(s.positions.length, 20);
    assert.equal(s.speeds.length, 20);
  });

  it('keeps speeds within [0, maxSpeed]', () => {
    const s = createState({ roadLength: 100, numCars: 20, maxSpeed: 5, seed: 7 });
    for (let i = 0; i < 100; i++) {
      step(s);
      assert.ok(s.speeds.every(v => v >= 0 && v <= 5),
        `speed out of bounds at tick ${s.tick}`);
    }
  });

  it('keeps positions within [0, roadLength)', () => {
    const s = createState({ roadLength: 50, numCars: 10, seed: 3 });
    for (let i = 0; i < 100; i++) {
      step(s);
      assert.ok(s.positions.every(p => p >= 0 && p < 50),
        `position out of bounds at tick ${s.tick}`);
    }
  });

  it('avoids collisions', () => {
    const s = createState({ roadLength: 100, numCars: 30, seed: 99 });
    for (let i = 0; i < 200; i++) {
      step(s);
      assert.ok(noCollisions(s), `collision at tick ${s.tick}`);
    }
  });
});

describe('traffic — single car on empty road', () => {
  it('accelerates to max speed', () => {
    const s = createState({
      roadLength: 100,
      numCars: 1,
      maxSpeed: 5,
      dawdleProb: 0, // no random braking
      seed: 1,
    });
    for (let i = 0; i < 10; i++) step(s);
    assert.equal(s.speeds[0], 5);
  });
});

describe('traffic — jam emergence', () => {
  it('reduces average speed at high density', () => {
    const s = createState({
      roadLength: 100,
      numCars: 50, // 50% density
      maxSpeed: 5,
      dawdleProb: 0.3,
      seed: 42,
    });
    for (let i = 0; i < 200; i++) step(s);
    const avg = avgSpeed(s);
    assert.ok(avg < 5, `expected avg speed < maxSpeed at high density, got ${avg}`);
  });
});

describe('traffic — density', () => {
  it('computes density correctly', () => {
    const s = createState({ roadLength: 100, numCars: 25 });
    assert.equal(density(s), 0.25);
  });
});

describe('traffic — determinism', () => {
  it('same seed produces identical states', () => {
    const a = createState({ roadLength: 100, numCars: 20, seed: 123 });
    const b = createState({ roadLength: 100, numCars: 20, seed: 123 });
    for (let i = 0; i < 50; i++) { step(a); step(b); }
    assert.deepEqual(a.positions, b.positions);
    assert.deepEqual(a.speeds, b.speeds);
  });
});
