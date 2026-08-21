import { describe, it, expect } from 'vitest';
import whirlpool from '../../src/algorithms/whirlpool';

describe('Whirlpool Plugin', () => {
  it('computes empty string correctly against ISO/IEC 10118-3', () => {
    const { digest, steps } = whirlpool.compute('');
    expect(digest).toBe('19fa61d75522a4669b44e39c1d2e1726c530232130d407f89afee0964997f7a73e83be698b288febcf88e3e03c4f0757ea8964e59b63d93708b138cc42a66eb3');
    expect(digest.length).toBe(128);
    expect(steps.length).toBeGreaterThan(0);
  });

  it('computes "a" correctly against ISO/IEC 10118-3', () => {
    const { digest } = whirlpool.compute('a');
    expect(digest).toBe('8aca2602792aec6f11a67206531fb7d7f0dff59413145e6973c45001d0087b42d11bc645413aeff63a42391a39145a591a92200d560195e53b478584fdae231a');
  });

  it('computes "abc" correctly against ISO/IEC 10118-3', () => {
    const { digest } = whirlpool.compute('abc');
    expect(digest).toBe('4e2448a4c6f486bb16b6562c73b4020bf3043e3a731bce721ae1b303d97e6d4c7181eebdb6c57e277d0e34957114cbd6c797fc9d95d8b582d225292076d4eef5');
  });

  it('computes "message digest" correctly against ISO/IEC 10118-3', () => {
    const { digest } = whirlpool.compute('message digest');
    expect(digest).toBe('378c84a4126e2dc6e56dcc7458377aac838d00032230f53ce1f5700c0ffb4d3b8421557659ef55c106b4b52ac5a4aaa692ed920052838f3362e86dbd37a8903e');
  });

  it('has correct metadata', () => {
    expect(whirlpool.info.name).toBe('Whirlpool');
    expect(whirlpool.info.family).toBe('Cipher-Based');
    expect(whirlpool.info.security).toBe('secure');
  });
});
