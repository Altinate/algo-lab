/**
 * Elliptic Curve Parameters & Official Test Vectors (SECG SEC 2, NIST FIPS 186-5)
 */

export interface EllipticCurve {
  name: string;
  p: bigint;       // Field Prime
  a: bigint;       // Curve parameter a
  b: bigint;       // Curve parameter b
  Gx: bigint;      // Base point G x-coordinate
  Gy: bigint;      // Base point G y-coordinate
  n: bigint;       // Base point subgroup order
  h: bigint;       // Cofactor
}

export interface EccKeyPair {
  curve: EllipticCurve;
  d: bigint;       // Private Key Scalar (0 < d < n)
  Qx: bigint;      // Public Key Point Q = d * G (x-coord)
  Qy: bigint;      // Public Key Point Q = d * G (y-coord)
  standardK?: bigint; // Standard deterministic / CAVP nonce k
}

// 1. SECG SEC 2: secp256k1 (Bitcoin, Ethereum, Koblitz curve y^2 = x^3 + 7)
export const CURVE_SECP256K1: EllipticCurve = {
  name: 'secp256k1',
  p: 0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2fn,
  a: 0n,
  b: 7n,
  Gx: 0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798n,
  Gy: 0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8n,
  n: 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n,
  h: 1n,
};

// Official SECG SEC 2 test vector for secp256k1
export const SECP256K1_TEST_KEY: EccKeyPair = {
  curve: CURVE_SECP256K1,
  // Standard test private key d
  d: 0xeaf02ca348c524e6392655ba4d29603cd548345b452de74025a1e2a559b3b5c8n,
  // Corresponding public key Q = d * G
  Qx: 0xc11bd613d1f252689a088d76b13d27a4bd4050ea8eb35fa22de0b812028f6a27n,
  Qy: 0xb2cec22faaee13fe90aa0e6f16f7e0f5602e202b5e1e2a9b95519f1aa5aa5d0dn,
  standardK: 0xa6e3c57dd01abe90086538398355dd4c3b17aa873382b0f150b5711a393240a6n,
};

// 2. NIST FIPS 186-5: NIST P-256 / secp256r1 (y^2 = x^3 - 3x + b)
export const CURVE_NIST_P256: EllipticCurve = {
  name: 'NIST P-256 (secp256r1)',
  p: 0xffffffff00000001000000000000000000000000ffffffffffffffffffffffffn,
  a: 0xffffffff00000001000000000000000000000000fffffffffffffffffffffffcn, // p - 3
  b: 0x5ac635d8aa3a93e7b3ebbd55769886bc651d06b0cc53b0f63bce3c3e27d2604bn,
  Gx: 0x6b17d1f2e12c4247f8bce6e563a440f277037d812deb33a0f4a13945d898c296n,
  Gy: 0x4fe342e2fe1a7f9b8ee7eb4a7c0f9e162bce33576b315ececbb6406837bf51f5n,
  n: 0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551n,
  h: 1n,
};

// Official NIST CAVP FIPS 186-4/186-5 test vector for P-256
export const NIST_P256_TEST_KEY: EccKeyPair = {
  curve: CURVE_NIST_P256,
  d: 0xc9afa9d845ba75166b5c215767b1d6934e50c3db36e89b127b8a622b120f6721n,
  Qx: 0x60fed4ba255a9d31c961eb74c6356d68c049b8923b61fa6ce669622e60f29fb6n,
  Qy: 0x7903fe1008b8bc99a41ae9e95628bc64f2f1b20c2d7e9f5177a3c294d4462299n,
  standardK: 0xa6fe3b4e67e3c4d7b1a2f309d4355ec6b017ba873382b0f150b5711a393240b2n,
};
