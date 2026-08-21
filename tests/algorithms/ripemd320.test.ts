import { describe, it, expect } from 'vitest';
import ripemd320 from '../../src/algorithms/ripemd320';

describe('RIPEMD-320 Plugin', () => {
  it('computes empty string correctly against reference', () => {
    const { digest, steps } = ripemd320.compute('');
    expect(digest).toBe('22d65d5661536cdc75c1fdf5c6de7b41b9f27325ebc61e8557177d705a0ec880151c3a32a00899b8');
    expect(digest.length).toBe(80);
    expect(steps.length).toBeGreaterThan(0);
  });

  it('computes "abc" correctly against reference', () => {
    const { digest } = ripemd320.compute('abc');
    expect(digest).toBe('de4c01b3054f8930a79d09ae738e92301e5a17085beffdc1b8d116713e74f82fa942d64cdbc4682d');
  });

  it('has correct metadata', () => {
    expect(ripemd320.info.name).toBe('RIPEMD-320');
    expect(ripemd320.info.family).toBe('RIPEMD');
    expect(ripemd320.info.digestSize).toBe(320);
  });
});
