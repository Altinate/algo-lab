import { add32, rightRotate32, add64, rightRotate64, uint32ToHex, uint64ToHex } from '../utils';

export const SIGMA = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
  [14, 10, 4, 8, 9, 15, 13, 6, 1, 12, 0, 2, 11, 7, 5, 3],
  [11, 8, 12, 0, 5, 2, 15, 13, 10, 14, 3, 6, 7, 1, 9, 4],
  [7, 9, 3, 1, 13, 12, 11, 14, 2, 6, 5, 10, 4, 0, 15, 8],
  [9, 0, 5, 7, 2, 4, 10, 15, 14, 1, 11, 12, 6, 8, 3, 13],
  [2, 12, 6, 10, 0, 11, 8, 3, 4, 13, 7, 5, 15, 14, 1, 9],
  [12, 5, 1, 15, 14, 13, 4, 10, 0, 7, 6, 3, 9, 2, 8, 11],
  [13, 11, 7, 14, 12, 1, 3, 9, 5, 0, 15, 4, 8, 6, 2, 10],
  [6, 15, 14, 9, 11, 3, 0, 8, 12, 2, 13, 7, 1, 4, 10, 5],
  [10, 2, 8, 4, 7, 6, 1, 5, 15, 11, 9, 14, 3, 12, 13, 0],
];

export const IV32 = [
  0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
  0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
];

export const IV64 = [
  0x6a09e667f3bcc908n, 0xbb67ae8584caa73bn, 0x3c6ef372fe94f82bn, 0xa54ff53a5f1d36f1n,
  0x510e527fade682d1n, 0x9b05688c2b3e6c1fn, 0x1f83d9abfb41bd6bn, 0x5be0cd19137e2179n,
];

export function G32(v: number[], a: number, b: number, c: number, d: number, x: number, y: number) {
  v[a] = add32(v[a], v[b], x);
  v[d] = rightRotate32(v[d] ^ v[a], 16);
  v[c] = add32(v[c], v[d]);
  v[b] = rightRotate32(v[b] ^ v[c], 12);
  v[a] = add32(v[a], v[b], y);
  v[d] = rightRotate32(v[d] ^ v[a], 8);
  v[c] = add32(v[c], v[d]);
  v[b] = rightRotate32(v[b] ^ v[c], 7);
}

export function G64(v: bigint[], a: number, b: number, c: number, d: number, x: bigint, y: bigint) {
  v[a] = add64(v[a], v[b], x);
  v[d] = rightRotate64(v[d] ^ v[a], 32);
  v[c] = add64(v[c], v[d]);
  v[b] = rightRotate64(v[b] ^ v[c], 24);
  v[a] = add64(v[a], v[b], y);
  v[d] = rightRotate64(v[d] ^ v[a], 16);
  v[c] = add64(v[c], v[d]);
  v[b] = rightRotate64(v[b] ^ v[c], 63);
}

export function formatState32(v: number[]) {
  return v.map(val => uint32ToHex(val));
}

export function formatState64(v: bigint[]) {
  return v.map(val => uint64ToHex(val));
}
