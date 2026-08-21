import { leftRotate32 } from '../utils';

export function Ch(x: number, y: number, z: number): number {
  return (x & y) ^ ((~x) & z);
}

export function Parity(x: number, y: number, z: number): number {
  return x ^ y ^ z;
}

export function Maj(x: number, y: number, z: number): number {
  return (x & y) ^ (x & z) ^ (y & z);
}

export { leftRotate32 };
