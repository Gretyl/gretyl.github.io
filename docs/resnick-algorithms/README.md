# Resnick Algorithm Artifacts

Interactive standalone simulations of the core algorithms from Mitchel Resnick's
*Turtles, Termites, and Traffic Jams: Explorations in Massively Parallel
Microworlds* (1994).

Each simulation demonstrates how complex emergent behavior arises from simple
agent rules in decentralized systems — no central controller, no global plan.

## Simulations

| Artifact | Algorithm | Emergent Behavior |
|----------|-----------|-------------------|
| `traffic.html` | Nagel-Schreckenberg traffic model | Spontaneous jams propagate backward |
| `boids.html` | Reynolds flocking (separation/alignment/cohesion) | Coordinated flock movement without a leader |
| `termites.html` | Termite wood gathering | Scattered chips self-organize into piles |
| `fire.html` | Forest fire percolation | Critical density threshold for fire spread |
| `ants.html` | Ant foraging with pheromone trails | Efficient paths emerge from random exploration |
| `slime.html` | Slime mold chemotaxis | Cells aggregate into clusters via pheromone gradients |
| `predator-prey.html` | Wolf-sheep-grass dynamics | Lotka-Volterra population oscillations |

## Architecture

Each simulation has a strict two-layer split:

- **`sim/*.js`** — Pure algorithm modules. No DOM, no Canvas, no `Math.random()`.
  Deterministic when given a seeded PRNG (mulberry32 via `sim/rng.js`).
  Exports `createState()`, `step()`, and domain-specific helpers.

- **`*.html`** — Self-contained interactive artifacts. Import from `sim/` via
  ES modules. Own the Canvas rendering, UI controls, and animation loop.

## Testing

Tests use Node.js built-in `node:test` (zero dependencies). Each test file
exercises the pure algorithmic properties of its simulation module:

```
make test
```

**78 tests** across 7 simulations covering:
- Conservation laws (wood count, car count, agent count, cell totals)
- Boundary conditions (wrapping, speed clamping, state transitions)
- Emergent properties (pile convergence, jam formation, percolation threshold)
- Determinism (same seed → identical state sequences)

### Why `node:test`?

- Zero dependencies — no `node_modules`, no `package.json`
- Node 22 built-in with TAP output
- Pure ES modules shared between browser and test runner
- Matches the repo's optional-toolchain pattern (skips gracefully without Node)

## Running

Open any `.html` file in a browser. Each artifact includes:
- Play/Pause/Step controls
- Parameter sliders for real-time tuning
- Live statistics display
