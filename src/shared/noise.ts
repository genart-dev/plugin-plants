/**
 * Simple 2D Perlin noise for wind turbulence.
 * Seeded for deterministic results.
 */

/** Permutation table seeded from a PRNG. */
function buildPerm(seed: number): Uint8Array {
  const perm = new Uint8Array(512);
  const base = new Uint8Array(256);
  for (let i = 0; i < 256; i++) base[i] = i;
  // Fisher-Yates shuffle with seeded PRNG
  let s = seed | 0;
  const next = () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    const tmp = base[i]!;
    base[i] = base[j]!;
    base[j] = tmp;
  }
  for (let i = 0; i < 512; i++) perm[i] = base[i & 255]!;
  return perm;
}

const GRAD2 = [
  [1, 1], [-1, 1], [1, -1], [-1, -1],
  [1, 0], [-1, 0], [0, 1], [0, -1],
];

function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(a: number, b: number, t: number): number {
  return a + t * (b - a);
}

function dot2(g: number[], x: number, y: number): number {
  return g[0]! * x + g[1]! * y;
}

/**
 * Create a seeded 2D noise function returning values in [-1, 1].
 */
export function createNoise2D(seed: number): (x: number, y: number) => number {
  const perm = buildPerm(seed);

  return (x: number, y: number): number => {
    const xi = Math.floor(x) & 255;
    const yi = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);

    const u = fade(xf);
    const v = fade(yf);

    const aa = perm[perm[xi]! + yi]! & 7;
    const ab = perm[perm[xi]! + yi + 1]! & 7;
    const ba = perm[perm[xi + 1]! + yi]! & 7;
    const bb = perm[perm[xi + 1]! + yi + 1]! & 7;

    const x1 = lerp(dot2(GRAD2[aa]!, xf, yf), dot2(GRAD2[ba]!, xf - 1, yf), u);
    const x2 = lerp(dot2(GRAD2[ab]!, xf, yf - 1), dot2(GRAD2[bb]!, xf - 1, yf - 1), u);

    return lerp(x1, x2, v);
  };
}
