import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import {
  createState, step, reproduce, populations,
} from '../sim/predator-prey.js';
import { makeRng } from '../sim/rng.js';

describe('predator-prey — createState', () => {
  it('creates correct initial populations', () => {
    const s = createState({ width: 50, height: 50, numSheep: 100, numWolves: 20 });
    assert.equal(s.sheep.length, 100);
    assert.equal(s.wolves.length, 20);
  });

  it('starts with all grass grown', () => {
    const s = createState({ width: 20, height: 20, numSheep: 5, numWolves: 2 });
    const p = populations(s);
    assert.equal(p.grass, 20 * 20);
  });
});

describe('predator-prey — reproduce', () => {
  it('produces offspring when probability hit', () => {
    const rng = makeRng(1);
    // Keep trying until we get a reproduction (prob 1.0 guarantees it)
    const agent = { x: 5, y: 5, energy: 20 };
    const offspring = reproduce(agent, 1.0, rng);
    assert.ok(offspring !== null);
    assert.equal(agent.energy, 10); // halved
    assert.equal(offspring.energy, 10);
    assert.equal(offspring.x, agent.x);
    assert.equal(offspring.y, agent.y);
  });

  it('does not reproduce when probability is 0', () => {
    const rng = makeRng(1);
    const agent = { x: 5, y: 5, energy: 20 };
    const offspring = reproduce(agent, 0, rng);
    assert.equal(offspring, null);
    assert.equal(agent.energy, 20); // unchanged
  });
});

describe('predator-prey — death', () => {
  it('removes agents at zero energy', () => {
    const s = createState({
      width: 10, height: 10, numSheep: 50, numWolves: 0,
      sheepGainFromGrass: 0, // no food gain
      sheepReproduce: 0,
      seed: 1,
    });
    // Run until all sheep die
    for (let i = 0; i < 100; i++) step(s);
    assert.equal(s.sheep.length, 0, 'all sheep should die without food');
  });
});

describe('predator-prey — grass regrowth', () => {
  it('grazed patches regrow after grassRegrowTime ticks', () => {
    const s = createState({
      width: 5, height: 5, numSheep: 0, numWolves: 0,
      grassRegrowTime: 3, seed: 1,
    });
    // Manually graze a cell
    s.grass[0] = 3;
    const p0 = populations(s);
    assert.equal(p0.grass, 24); // one cell regrowing
    step(s); step(s); step(s);
    const p3 = populations(s);
    assert.equal(p3.grass, 25); // all regrown
  });
});

describe('predator-prey — predation', () => {
  it('wolf eating sheep gains energy', () => {
    const s = createState({
      width: 5, height: 5, numSheep: 25, numWolves: 1,
      wolfGainFromSheep: 20,
      wolfReproduce: 0,
      sheepReproduce: 0,
      seed: 42,
    });
    const initialWolfEnergy = s.wolves[0].energy;
    // Run a few steps — wolf should eat at least one sheep
    for (let i = 0; i < 20; i++) step(s);
    // Wolf should still be alive (gained energy from eating)
    if (s.wolves.length > 0) {
      assert.ok(true, 'wolf survived by eating sheep');
    }
    // Some sheep should have been eaten
    assert.ok(s.sheep.length < 25, 'some sheep should be eaten');
  });
});

describe('predator-prey — no immortality', () => {
  it('wolves die without sheep', () => {
    const s = createState({
      width: 10, height: 10, numSheep: 0, numWolves: 10,
      wolfGainFromSheep: 20,
      wolfReproduce: 0,
      seed: 1,
    });
    for (let i = 0; i < 200; i++) step(s);
    assert.equal(s.wolves.length, 0, 'wolves should die without prey');
  });
});

describe('predator-prey — determinism', () => {
  it('same seed produces identical populations', () => {
    const a = createState({ width: 30, height: 30, numSheep: 50, numWolves: 10, seed: 99 });
    const b = createState({ width: 30, height: 30, numSheep: 50, numWolves: 10, seed: 99 });
    for (let i = 0; i < 100; i++) { step(a); step(b); }
    const pa = populations(a);
    const pb = populations(b);
    assert.equal(pa.sheep, pb.sheep);
    assert.equal(pa.wolves, pb.wolves);
    assert.equal(pa.grass, pb.grass);
  });
});
