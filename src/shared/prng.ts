/**
 * Seeded PRNG using mulberry32 algorithm.
 * Produces deterministic pseudo-random numbers from a 32-bit seed.
 */
export function createPRNG(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Return a random float in [min, max) using the provided PRNG. */
export function randomRange(rng: () => number, min: number, max: number): number {
  return min + rng() * (max - min);
}

/** Return a random integer in [min, max] (inclusive) using the provided PRNG. */
export function randomInt(rng: () => number, min: number, max: number): number {
  return Math.floor(min + rng() * (max - min + 1));
}

/** Gaussian random via Box-Muller transform. */
export function randomGaussian(rng: () => number, mean = 0, stddev = 1): number {
  const u1 = rng() || 1e-10;
  const u2 = rng();
  return mean + stddev * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}
