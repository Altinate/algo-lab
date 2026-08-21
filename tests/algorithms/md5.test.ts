import { describe, it, expect } from 'vitest';
import md5Plugin from '../../src/algorithms/md5';

describe('MD5 Plugin', () => {
  it('computes empty string correctly', () => {
    const { digest, steps } = md5Plugin.compute('');
    expect(digest).toBe('d41d8cd98f00b204e9800998ecf8427e');
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].id).toBeDefined();
    expect(steps[0].title).toBeDefined();
    expect(steps[0].phase).toBeDefined();
    expect(steps[0].description).toBeDefined();
  });

  it('computes "a" correctly', () => {
    const { digest } = md5Plugin.compute('a');
    expect(digest).toBe('0cc175b9c0f1b6a831c399e269772661');
  });

  it('computes "abc" correctly', () => {
    const { digest } = md5Plugin.compute('abc');
    expect(digest).toBe('900150983cd24fb0d6963f7d28e17f72');
  });

  it('computes "message digest" correctly', () => {
    const { digest } = md5Plugin.compute('message digest');
    expect(digest).toBe('f96b697d7cb7938d525a2f31aaf161d0');
  });
});
