/**
 * Seedable pseudo-random number generator (mulberry32).
 *
 * Returns a function () => number in [0, 1) that produces a
 * deterministic sequence for a given integer seed.
 *
 * @param {number} seed - 32-bit integer seed
 * @returns {() => number}
 */
export function makeRng(seed) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
  };
}
