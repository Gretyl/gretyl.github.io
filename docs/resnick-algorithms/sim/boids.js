/**
 * Boids Flocking — Reynolds flocking model.
 *
 * Each boid follows three rules based on nearby neighbors:
 *   1. Separation: steer away from too-close neighbors
 *   2. Alignment: match heading of nearby neighbors
 *   3. Cohesion: steer toward center of mass of nearby neighbors
 *
 * Emergent behavior: coordinated flocking without a leader.
 */

import { makeRng } from './rng.js';

/**
 * @typedef {Object} Boid
 * @property {number} x
 * @property {number} y
 * @property {number} vx
 * @property {number} vy
 */

/**
 * @typedef {Object} BoidsState
 * @property {Boid[]}     boids
 * @property {number}     width
 * @property {number}     height
 * @property {number}     maxSpeed
 * @property {number}     perceptionRadius
 * @property {number}     separationRadius
 * @property {number}     separationWeight
 * @property {number}     alignmentWeight
 * @property {number}     cohesionWeight
 * @property {number}     tick
 */

/**
 * @param {Object} params
 * @param {number} params.numBoids
 * @param {number} [params.width=800]
 * @param {number} [params.height=600]
 * @param {number} [params.maxSpeed=4]
 * @param {number} [params.perceptionRadius=50]
 * @param {number} [params.separationRadius=25]
 * @param {number} [params.separationWeight=1.5]
 * @param {number} [params.alignmentWeight=1.0]
 * @param {number} [params.cohesionWeight=1.0]
 * @param {number} [params.seed=42]
 * @returns {BoidsState}
 */
export function createState({
  numBoids,
  width = 800,
  height = 600,
  maxSpeed = 4,
  perceptionRadius = 50,
  separationRadius = 25,
  separationWeight = 1.5,
  alignmentWeight = 1.0,
  cohesionWeight = 1.0,
  seed = 42,
}) {
  const rng = makeRng(seed);
  const boids = [];
  for (let i = 0; i < numBoids; i++) {
    const angle = rng() * Math.PI * 2;
    boids.push({
      x: rng() * width,
      y: rng() * height,
      vx: Math.cos(angle) * maxSpeed * 0.5,
      vy: Math.sin(angle) * maxSpeed * 0.5,
    });
  }
  return {
    boids, width, height, maxSpeed, perceptionRadius, separationRadius,
    separationWeight, alignmentWeight, cohesionWeight, tick: 0,
  };
}

/** Euclidean distance squared. */
function dist2(a, b) {
  return (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
}

/**
 * Get neighbors within radius.
 * @param {Boid} boid
 * @param {Boid[]} boids
 * @param {number} radius
 * @returns {Boid[]}
 */
export function getNeighbors(boid, boids, radius) {
  const r2 = radius * radius;
  return boids.filter(b => b !== boid && dist2(boid, b) < r2);
}

/**
 * Separation force: steer away from too-close neighbors.
 * @param {Boid} boid
 * @param {Boid[]} neighbors - neighbors within separation radius
 * @returns {{x: number, y: number}}
 */
export function separation(boid, neighbors) {
  let sx = 0, sy = 0;
  for (const n of neighbors) {
    const d2 = dist2(boid, n);
    if (d2 > 0) {
      sx += (boid.x - n.x) / d2;
      sy += (boid.y - n.y) / d2;
    }
  }
  return { x: sx, y: sy };
}

/**
 * Alignment force: match average velocity of neighbors.
 * @param {Boid} boid
 * @param {Boid[]} neighbors
 * @returns {{x: number, y: number}}
 */
export function alignment(boid, neighbors) {
  if (neighbors.length === 0) return { x: 0, y: 0 };
  let avgVx = 0, avgVy = 0;
  for (const n of neighbors) { avgVx += n.vx; avgVy += n.vy; }
  avgVx /= neighbors.length;
  avgVy /= neighbors.length;
  return { x: avgVx - boid.vx, y: avgVy - boid.vy };
}

/**
 * Cohesion force: steer toward center of mass of neighbors.
 * @param {Boid} boid
 * @param {Boid[]} neighbors
 * @returns {{x: number, y: number}}
 */
export function cohesion(boid, neighbors) {
  if (neighbors.length === 0) return { x: 0, y: 0 };
  let cx = 0, cy = 0;
  for (const n of neighbors) { cx += n.x; cy += n.y; }
  cx /= neighbors.length;
  cy /= neighbors.length;
  return { x: cx - boid.x, y: cy - boid.y };
}

/**
 * Clamp velocity magnitude to maxSpeed.
 * @param {number} vx
 * @param {number} vy
 * @param {number} maxSpeed
 * @returns {{vx: number, vy: number}}
 */
export function clampSpeed(vx, vy, maxSpeed) {
  const mag = Math.sqrt(vx * vx + vy * vy);
  if (mag > maxSpeed && mag > 0) {
    return { vx: (vx / mag) * maxSpeed, vy: (vy / mag) * maxSpeed };
  }
  return { vx, vy };
}

/**
 * Advance the simulation by one tick.
 * @param {BoidsState} state
 * @returns {BoidsState}
 */
export function step(state) {
  const {
    boids, width, height, maxSpeed, perceptionRadius, separationRadius,
    separationWeight, alignmentWeight, cohesionWeight,
  } = state;

  const newBoids = boids.map(boid => {
    const percNeighbors = getNeighbors(boid, boids, perceptionRadius);
    const sepNeighbors = getNeighbors(boid, boids, separationRadius);

    const sep = separation(boid, sepNeighbors);
    const ali = alignment(boid, percNeighbors);
    const coh = cohesion(boid, percNeighbors);

    let nvx = boid.vx + sep.x * separationWeight + ali.x * alignmentWeight + coh.x * cohesionWeight;
    let nvy = boid.vy + sep.y * separationWeight + ali.y * alignmentWeight + coh.y * cohesionWeight;

    const clamped = clampSpeed(nvx, nvy, maxSpeed);
    nvx = clamped.vx;
    nvy = clamped.vy;

    let nx = boid.x + nvx;
    let ny = boid.y + nvy;

    // Wrap around edges
    if (nx < 0) nx += width; else if (nx >= width) nx -= width;
    if (ny < 0) ny += height; else if (ny >= height) ny -= height;

    return { x: nx, y: ny, vx: nvx, vy: nvy };
  });

  state.boids = newBoids;
  state.tick++;
  return state;
}
