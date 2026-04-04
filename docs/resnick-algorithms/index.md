---
layout: default
title: Resnick Algorithm Artifacts
---

Interactive standalone simulations of the core algorithms from Mitchel Resnick's
*Turtles, Termites, and Traffic Jams: Explorations in Massively Parallel
Microworlds* (1994).

Each simulation demonstrates how complex emergent behavior arises from simple
agent rules in decentralized systems — no central controller, no global plan.

## Simulations

| Artifact | Algorithm | Emergent Behavior |
|----------|-----------|-------------------|
| [traffic](traffic.html) | Nagel-Schreckenberg traffic model | Spontaneous jams propagate backward |
| [boids](boids.html) | Reynolds flocking (separation/alignment/cohesion) | Coordinated flock movement without a leader |
| [termites](termites.html) | Termite wood gathering | Scattered chips self-organize into piles |
| [fire](fire.html) | Forest fire percolation | Critical density threshold for fire spread |
| [ants](ants.html) | Ant foraging with pheromone trails | Efficient paths emerge from random exploration |
| [slime](slime.html) | Slime mold chemotaxis | Cells aggregate into clusters via pheromone gradients |
| [predator-prey](predator-prey.html) | Wolf-sheep-grass dynamics | Lotka-Volterra population oscillations |

## Architecture

Each simulation has a strict two-layer split:

- **`sim/*.js`** — Pure algorithm modules. No DOM, no Canvas, no `Math.random()`.
  Deterministic when given a seeded PRNG (mulberry32 via `sim/rng.js`).
  Exports `createState()`, `step()`, and domain-specific helpers.

- **`*.html`** — Self-contained interactive artifacts. Import from `sim/` via
  ES modules. Own the Canvas rendering, UI controls, and animation loop.

## Running

Open any `.html` file in a browser. Each artifact includes:
- Play/Pause/Step controls
- Parameter sliders for real-time tuning
- Live statistics display
