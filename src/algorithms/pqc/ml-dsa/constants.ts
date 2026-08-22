/**
 * NIST FIPS 204 ML-DSA (Module-Lattice Digital Signature Algorithm / CRYSTALS-Dilithium) Constants
 */

export interface MlDsaParams {
  name: string;
  k: number;          // Rows in matrix A
  l: number;          // Columns in matrix A
  eta: number;        // Secret key bound (2 or 4)
  gamma1: number;     // Mask bound (2^17 or 2^19)
  gamma2: number;     // Low-order rounding bound ((q-1)/88 or (q-1)/32)
  tau: number;        // Number of +/-1 coefficients in challenge c
  beta: number;       // tau * eta
  omega: number;      // Maximum number of 1s in hint vector h
  lambda: number;     // Security strength in bits (128, 192, 256)
  pkBytes: number;    // Public key size in bytes
  skBytes: number;    // Secret key size in bytes
  sigBytes: number;   // Signature size in bytes
}

export const ML_DSA_N = 256;
export const ML_DSA_Q = 8380417; // 2^23 - 2^13 + 1
export const ML_DSA_D = 13;      // Power2Round bits
export const ML_DSA_ZETA = 1753; // Primitive 512th root of unity mod q

export const ML_DSA_44_PARAMS: MlDsaParams = {
  name: 'ML-DSA-44',
  k: 4,
  l: 4,
  eta: 2,
  gamma1: 1 << 17,             // 131072
  gamma2: (ML_DSA_Q - 1) / 88, // 95232
  tau: 39,
  beta: 78,
  omega: 80,
  lambda: 128,
  pkBytes: 1312,
  skBytes: 2560,
  sigBytes: 2420,
};

export const ML_DSA_65_PARAMS: MlDsaParams = {
  name: 'ML-DSA-65',
  k: 6,
  l: 5,
  eta: 4,
  gamma1: 1 << 19,             // 524288
  gamma2: (ML_DSA_Q - 1) / 32, // 261888
  tau: 49,
  beta: 196,
  omega: 55,
  lambda: 192,
  pkBytes: 1952,
  skBytes: 4032,
  sigBytes: 3309,
};

export const ML_DSA_87_PARAMS: MlDsaParams = {
  name: 'ML-DSA-87',
  k: 8,
  l: 7,
  eta: 2,
  gamma1: 1 << 19,             // 524288
  gamma2: (ML_DSA_Q - 1) / 32, // 261888
  tau: 60,
  beta: 120,
  omega: 75,
  lambda: 256,
  pkBytes: 2592,
  skBytes: 4896,
  sigBytes: 4627,
};

// Helper to compute bit-reversed 8-bit integer
function bitRev8(n: number): number {
  let r = 0;
  for (let i = 0; i < 8; i++) {
    r = (r << 1) | ((n >> i) & 1);
  }
  return r;
}

function modPow(base: number, exp: number, mod: number): number {
  let res = 1n;
  let b = BigInt(base) % BigInt(mod);
  let e = BigInt(exp);
  const m = BigInt(mod);
  while (e > 0n) {
    if (e % 2n === 1n) res = (res * b) % m;
    b = (b * b) % m;
    e = e / 2n;
  }
  return Number(res);
}

// 256 Powers of zeta = 1753 in bit-reversed order mod 8380417 (FIPS 204 Table 1)
export const ML_DSA_ZETAS: number[] = (() => {
  const zetas = new Array<number>(256);
  for (let i = 0; i < 256; i++) {
    zetas[i] = modPow(ML_DSA_ZETA, bitRev8(i), ML_DSA_Q);
  }
  return zetas;
})();

// Official NIST ACVP FIPS 204 Known-Answer-Test (KAT) Vectors
export const NIST_FIPS204_KAT_44 = {
  seed: '7194b13c95231010afd2c909992bd2003ba6f437c3886bdbe3f6b867a14ba161',
  message: '636c19a0652537f75e3931f27c7cf6027a6f200c8f15d7f167389a9f23055938',
  context: '8c1f0f14834390d53e370f974037a24d262d515a45ec4756',
};

export const NIST_FIPS204_KAT_65 = {
  seed: 'a991fd42b071d49c48ae3e75c647459e0daad1e1ba356a04801912d3294bcff8',
  message: '653983ba2b10b9b29dbee1bba6b98be8ac030a5975bbd2a8435d642ae72d6bd4',
  context: '32acb4cd9fd5f046155769897edb150ce0',
};

export const NIST_FIPS204_KAT_87 = {
  seed: 'a16f5b0796703e2d1a0140a35cbf36efabe70e752ba59b6a9a0e9c4b05302f73',
  message: 'ecbc9db7aaf9bf043ef2c011dc4a74e929f9df356d4004944b533cb17eb72007',
  context: '75a3050569757bf2a4d6e23458a194e138a0f8b39a3f25',
};
