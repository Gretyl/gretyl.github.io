# Resnick Algorithm Artifacts — Working Notes

## Objective

Build interactive standalone HTML/Canvas simulations for each core algorithm
from Mitchel Resnick's *Turtles, Termites, and Traffic Jams* (1994), with
pure-logic ES modules tested via Node.js built-in `node:test`.

## Key Decisions

- **Test framework**: `node:test` (zero dependencies, Node 22 built-in)
- **RNG**: Seedable mulberry32 PRNG in `sim/rng.js` for deterministic tests
- **Architecture**: strict separation — `sim/*.js` (pure logic) vs `*.html` (rendering)
- **No build step**: vanilla JS with ES modules, no npm/bundler

## Algorithms (implementation order)

1. Traffic jam formation (1D ring road)
2. Boids flocking (separation/alignment/cohesion)
3. Termite wood gathering (2D grid + agents)
4. Forest fire percolation (2D grid states)
5. Ant foraging (pheromone trails)
6. Slime mold aggregation (pheromone gradients)
7. Predator-prey dynamics (two agent types + grass)
