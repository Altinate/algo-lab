import { describe, it, expect } from 'vitest';
import { parseJwk, computeJwkThumbprint } from '../../src/algorithms/tools/format-parsing/jwk';
import { jwkPlugin } from '../../src/algorithms/tools/format-parsing/jwk-plugin';
import { PRESETS } from '../../src/algorithms/tools/format-parsing/presets';

describe('RFC 7517 / RFC 7638 JWK Formatter & Parser', () => {
  it('correctly parses RFC 7517 Appendix A.1 RSA JWK', () => {
    const details = parseJwk(PRESETS[4].content);
    expect(details.keyType).toBe('RSA');
    expect(details.keyBitLength).toBe(2048);
    expect(details.isPrivate).toBe(true);
    expect(details.thumbprintBase64Url).toBeTruthy();
  });

  it('correctly parses RFC 7517 Appendix A.2 EC JWK', () => {
    const details = parseJwk(PRESETS[5].content);
    expect(details.keyType).toBe('EC');
    expect(details.jwk.crv).toBe('P-256');
    expect(details.isPrivate).toBe(true);
    expect(details.thumbprintBase64Url).toBeTruthy();
  });

  it('computes exact RFC 7638 deterministic thumbprint for official RFC 7638 Section 3.1 test vector', () => {
    // Official RFC 7638 Section 3.1 test key:
    const rfcKey = {
      kty: 'RSA',
      n: '0vx7agoebGcQSuuPiLJXZptN9nndrQmbXEps2aiAFbWhM78LhWx4cbbfAAtVT86zwu1RK7aPFFxuhDR1L6tSoc_BJECPebWKRXjBZCiFV4n3oknjhMstn64tZ_2W-5JsGY4Hc5n9yBXArwl93lqt7_RN5w6Cf0h4QyQ5v-65YGjQR0_FDW2QvzqY368QQMicAtaSqzs8KJZgnYb9c7d0zgdAZHzu6qMQvRL5hajrn1n91CbOpbISD08qNLyrdkt-bFTWhAI4vMQFh6WeZu0fM4lFd2NcRwr3XPksINHaQ-G_xBniIqbw0Ls1jF44-csFCur-kEgU8awapJzKnqDKgw',
      e: 'AQAB',
      alg: 'RS256',
      kid: '2011-04-29',
    };
    const { thumbprintB64Url, canonicalJson } = computeJwkThumbprint(rfcKey);
    // Official expected canonical JSON: {"e":"AQAB","kty":"RSA","n":"0vx7agoebGcQSuuPiLJXZptN9nndrQmbXEps2aiAFbWhM78LhWx4cbbfAAtVT86zwu1RK7aPFFxuhDR1L6tSoc_BJECPebWKRXjBZCiFV4n3oknjhMstn64tZ_2W-5JsGY4Hc5n9yBXArwl93lqt7_RN5w6Cf0h4QyQ5v-65YGjQR0_FDW2QvzqY368QQMicAtaSqzs8KJZgnYb9c7d0zgdAZHzu6qMQvRL5hajrn1n91CbOpbISD08qNLyrdkt-bFTWhAI4vMQFh6WeZu0fM4lFd2NcRwr3XPksINHaQ-G_xBniIqbw0Ls1jF44-csFCur-kEgU8awapJzKnqDKgw"}
    // Official expected SHA-256 Thumbprint: NzbLsXh8uDCcd-6MNwXF4W_7noWXFZAfHkx9GvpFe0E
    expect(canonicalJson).toBe('{"e":"AQAB","kty":"RSA","n":"0vx7agoebGcQSuuPiLJXZptN9nndrQmbXEps2aiAFbWhM78LhWx4cbbfAAtVT86zwu1RK7aPFFxuhDR1L6tSoc_BJECPebWKRXjBZCiFV4n3oknjhMstn64tZ_2W-5JsGY4Hc5n9yBXArwl93lqt7_RN5w6Cf0h4QyQ5v-65YGjQR0_FDW2QvzqY368QQMicAtaSqzs8KJZgnYb9c7d0zgdAZHzu6qMQvRL5hajrn1n91CbOpbISD08qNLyrdkt-bFTWhAI4vMQFh6WeZu0fM4lFd2NcRwr3XPksINHaQ-G_xBniIqbw0Ls1jF44-csFCur-kEgU8awapJzKnqDKgw"}');
    expect(thumbprintB64Url).toBe('NzbLsXh8uDCcd-6MNwXF4W_7noWXFZAfHkxZsRGC9Xs');
  });

  it('runs jwkPlugin computation and generates steps', () => {
    const res = jwkPlugin.compute(PRESETS[4].content);
    expect(res.steps.length).toBe(3);
    expect(res.digest).toBeTruthy();
  });
});
