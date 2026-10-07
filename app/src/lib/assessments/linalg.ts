export type Vec = readonly number[];
export type Mat = readonly (readonly number[])[];

export function dot(a: Vec, b: Vec): number {
  let sum = 0;
  for (let i = 0; i < a.length; i += 1) sum += a[i] * b[i];
  return sum;
}

export function matVec(m: Mat, v: Vec): number[] {
  return m.map((row) => dot(row, v));
}

export function sub(a: Vec, b: Vec): number[] {
  return a.map((value, i) => value - b[i]);
}

/** Lower-triangular L with L Lᵀ = m. `m` must be symmetric positive definite. */
export function cholesky(m: Mat): number[][] {
  const n = m.length;
  const l = Array.from({ length: n }, () => new Array<number>(n).fill(0));
  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j <= i; j += 1) {
      let sum = m[i][j];
      for (let k = 0; k < j; k += 1) sum -= l[i][k] * l[j][k];
      l[i][j] = i === j ? Math.sqrt(Math.max(sum, 1e-12)) : sum / l[j][j];
    }
  }
  return l;
}

/** Solves L x = b for lower-triangular L. */
function forward(l: Mat, b: Vec): number[] {
  const x = new Array<number>(b.length).fill(0);
  for (let i = 0; i < b.length; i += 1) {
    let sum = b[i];
    for (let k = 0; k < i; k += 1) sum -= l[i][k] * x[k];
    x[i] = sum / l[i][i];
  }
  return x;
}

/** Solves Lᵀ x = b for lower-triangular L. */
export function backward(l: Mat, b: Vec): number[] {
  const n = b.length;
  const x = new Array<number>(n).fill(0);
  for (let i = n - 1; i >= 0; i -= 1) {
    let sum = b[i];
    for (let k = i + 1; k < n; k += 1) sum -= l[k][i] * x[k];
    x[i] = sum / l[i][i];
  }
  return x;
}

/** Solves m x = b through the Cholesky factor of m. */
export function solve(l: Mat, b: Vec): number[] {
  return backward(l, forward(l, b));
}

export function inverseFromCholesky(l: Mat): number[][] {
  const n = l.length;
  const columns = Array.from({ length: n }, (_, j) => solve(l, Array.from({ length: n }, (_, i) => (i === j ? 1 : 0))));
  return Array.from({ length: n }, (_, i) => columns.map((column) => column[i]));
}

function mulberry32(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Fixed standard-normal draws in antithetic pairs, so a symmetric posterior gives
 * symmetric probabilities and the same answers always give the same confidence.
 */
export function normalDraws(dims: number, pairs: number, seed: number): number[][] {
  const next = mulberry32(seed);
  const draws: number[][] = [];
  for (let p = 0; p < pairs; p += 1) {
    const z = Array.from({ length: dims }, () => {
      const u = Math.max(next(), 1e-12);
      const v = next();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    });
    draws.push(z, z.map((value) => -value));
  }
  return draws;
}
