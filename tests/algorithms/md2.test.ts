import { describe, it, expect } from 'vitest';
import md2 from '../../src/algorithms/md2';

describe('MD2 Plugin', () => {
  it('computes empty string correctly against RFC 1319 reference', () => {
    const { digest, steps } = md2.compute('');
    expect(digest).toBe('ddaa775327cdc04ccfc1c59baf394a18');
    expect(digest.length).toBe(32);
    expect(steps.length).toBeGreaterThan(0);
  });

  it('computes "a" correctly against RFC 1319 reference', () => {
    const { digest } = md2.compute('a');
    expect(digest).toBe('45c0ba937a07a81547c22163140664b8');
  });

  it('computes "abc" correctly against RFC 1319 reference', () => {
    const { digest } = md2.compute('abc');
    expect(digest).toBe('ab141def4c269b8ad142430c868f9d62');
  });

  it('computes "message digest" correctly against RFC 1319 reference', () => {
    const { digest } = md2.compute('message digest');
    expect(digest).toBe('d2a2691c4de1bbfa59c368d4a988ab6c');
  });

  it('has correct metadata', () => {
    expect(md2.info.name).toBe('MD2');
    expect(md2.info.family).toBe('MD');
    expect(md2.info.security).toBe('broken');
  });
});
