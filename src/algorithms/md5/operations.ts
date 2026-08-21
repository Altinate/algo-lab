import { leftRotate32 } from '../utils';

export function F(b: number, c: number, d: number): number {
  return (b & c) | ((~b) & d);
}

export function G(b: number, c: number, d: number): number {
  return (b & d) | (c & (~d));
}

export function H(b: number, c: number, d: number): number {
  return b ^ c ^ d;
}

export function I(b: number, c: number, d: number): number {
  return c ^ (b | (~d));
}

export { leftRotate32 };
