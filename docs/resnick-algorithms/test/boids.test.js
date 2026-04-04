import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import {
  createState, step, getNeighbors,
  separation, alignment, cohesion, clampSpeed,
} from '../sim/boids.js';

describe('boids — createState', () => {
  it('creates the correct number of boids', () => {
    const s = createState({ numBoids: 50 });
    assert.equal(s.boids.length, 50);
  });

  it('places boids within bounds', () => {
    const s = createState({ numBoids: 100, width: 200, height: 150, seed: 7 });
    for (const b of s.boids) {
      assert.ok(b.x >= 0 && b.x < 200, `x out of bounds: ${b.x}`);
      assert.ok(b.y >= 0 && b.y < 150, `y out of bounds: ${b.y}`);
    }
  });
});

describe('boids — getNeighbors', () => {
  it('finds neighbors within radius', () => {
    const boid = { x: 50, y: 50, vx: 0, vy: 0 };
    const near = { x: 55, y: 50, vx: 1, vy: 0 };
    const far = { x: 200, y: 200, vx: 0, vy: 1 };
    const result = getNeighbors(boid, [boid, near, far], 20);
    assert.equal(result.length, 1);
    assert.equal(result[0], near);
  });

  it('excludes self', () => {
    const boid = { x: 50, y: 50, vx: 0, vy: 0 };
    const result = getNeighbors(boid, [boid], 100);
    assert.equal(result.length, 0);
  });
});

describe('boids — separation', () => {
  it('produces repulsive vector from close neighbors', () => {
    const boid = { x: 50, y: 50, vx: 0, vy: 0 };
    const neighbor = { x: 55, y: 50, vx: 0, vy: 0 };
    const force = separation(boid, [neighbor]);
    assert.ok(force.x < 0, 'should push away in x (neighbor is to the right)');
    assert.equal(force.y, 0);
  });

  it('returns zero for no neighbors', () => {
    const boid = { x: 50, y: 50, vx: 0, vy: 0 };
    const force = separation(boid, []);
    assert.equal(force.x, 0);
    assert.equal(force.y, 0);
  });
});

describe('boids — alignment', () => {
  it('returns zero when neighbors have identical heading', () => {
    const boid = { x: 50, y: 50, vx: 2, vy: 0 };
    const neighbor = { x: 60, y: 50, vx: 2, vy: 0 };
    const force = alignment(boid, [neighbor]);
    assert.ok(Math.abs(force.x) < 1e-10);
    assert.ok(Math.abs(force.y) < 1e-10);
  });

  it('steers toward average neighbor heading', () => {
    const boid = { x: 50, y: 50, vx: 2, vy: 0 };
    const neighbor = { x: 60, y: 50, vx: 0, vy: 2 };
    const force = alignment(boid, [neighbor]);
    assert.ok(force.x < 0, 'should reduce vx');
    assert.ok(force.y > 0, 'should increase vy');
  });

  it('returns zero for no neighbors', () => {
    const boid = { x: 50, y: 50, vx: 2, vy: 0 };
    const force = alignment(boid, []);
    assert.equal(force.x, 0);
    assert.equal(force.y, 0);
  });
});

describe('boids — cohesion', () => {
  it('steers toward center of mass', () => {
    const boid = { x: 0, y: 0, vx: 0, vy: 0 };
    const neighbors = [
      { x: 10, y: 10, vx: 0, vy: 0 },
      { x: 20, y: 10, vx: 0, vy: 0 },
    ];
    const force = cohesion(boid, neighbors);
    assert.ok(force.x > 0, 'should steer right toward center');
    assert.ok(force.y > 0, 'should steer down toward center');
  });

  it('returns zero for no neighbors', () => {
    const boid = { x: 50, y: 50, vx: 0, vy: 0 };
    const force = cohesion(boid, []);
    assert.equal(force.x, 0);
    assert.equal(force.y, 0);
  });
});

describe('boids — clampSpeed', () => {
  it('clamps velocity exceeding maxSpeed', () => {
    const { vx, vy } = clampSpeed(10, 0, 4);
    assert.equal(vx, 4);
    assert.ok(Math.abs(vy) < 1e-10);
  });

  it('preserves velocity within maxSpeed', () => {
    const { vx, vy } = clampSpeed(2, 1, 4);
    assert.equal(vx, 2);
    assert.equal(vy, 1);
  });

  it('preserves direction when clamping', () => {
    const { vx, vy } = clampSpeed(6, 8, 5);
    const mag = Math.sqrt(vx * vx + vy * vy);
    assert.ok(Math.abs(mag - 5) < 1e-10);
    assert.ok(Math.abs(vy / vx - 8 / 6) < 1e-10, 'ratio should be preserved');
  });
});

describe('boids — step invariants', () => {
  it('preserves boid count', () => {
    const s = createState({ numBoids: 30, seed: 1 });
    for (let i = 0; i < 50; i++) step(s);
    assert.equal(s.boids.length, 30);
  });

  it('clamps all speeds to maxSpeed', () => {
    const s = createState({ numBoids: 30, maxSpeed: 4, seed: 5 });
    for (let i = 0; i < 50; i++) {
      step(s);
      for (const b of s.boids) {
        const mag = Math.sqrt(b.vx ** 2 + b.vy ** 2);
        assert.ok(mag <= 4 + 1e-10, `speed ${mag} exceeds maxSpeed at tick ${s.tick}`);
      }
    }
  });

  it('wraps positions within bounds', () => {
    const s = createState({ numBoids: 30, width: 200, height: 150, seed: 9 });
    for (let i = 0; i < 100; i++) {
      step(s);
      for (const b of s.boids) {
        assert.ok(b.x >= 0 && b.x < 200, `x out of bounds: ${b.x}`);
        assert.ok(b.y >= 0 && b.y < 150, `y out of bounds: ${b.y}`);
      }
    }
  });
});

describe('boids — determinism', () => {
  it('same seed produces identical states', () => {
    const a = createState({ numBoids: 20, seed: 77 });
    const b = createState({ numBoids: 20, seed: 77 });
    for (let i = 0; i < 30; i++) { step(a); step(b); }
    for (let i = 0; i < a.boids.length; i++) {
      assert.equal(a.boids[i].x, b.boids[i].x);
      assert.equal(a.boids[i].y, b.boids[i].y);
    }
  });
});
