/**
 * NIST FIPS 203 ML-KEM (Module-Lattice Key Encapsulation Mechanism) Constants
 * Specifies standard parameters for ML-KEM-512, ML-KEM-768, and ML-KEM-1024.
 */

export interface MlKemParams {
  name: string;
  k: number;        // Matrix rank (2 for 512, 3 for 768, 4 for 1024)
  eta1: number;     // CBD parameter eta1
  eta2: number;     // CBD parameter eta2
  du: number;       // Compression factor du
  dv: number;       // Compression factor dv
  ekBytes: number;  // Encapsulation Key length (bytes)
  dkBytes: number;  // Decapsulation Key length (bytes)
  cBytes: number;   // Ciphertext length (bytes)
}

export const ML_KEM_N = 256;
export const ML_KEM_Q = 3329;
export const ML_KEM_ZETA = 17;

export const ML_KEM_512_PARAMS: MlKemParams = {
  name: 'ML-KEM-512',
  k: 2,
  eta1: 3,
  eta2: 2,
  du: 10,
  dv: 4,
  ekBytes: 800,
  dkBytes: 1632,
  cBytes: 768,
};

export const ML_KEM_768_PARAMS: MlKemParams = {
  name: 'ML-KEM-768',
  k: 3,
  eta1: 2,
  eta2: 2,
  du: 10,
  dv: 4,
  ekBytes: 1184,
  dkBytes: 2400,
  cBytes: 1088,
};

export const ML_KEM_1024_PARAMS: MlKemParams = {
  name: 'ML-KEM-1024',
  k: 4,
  eta1: 2,
  eta2: 2,
  du: 11,
  dv: 5,
  ekBytes: 1568,
  dkBytes: 3168,
  cBytes: 1568,
};

// 128 Powers of zeta in bit-reversed order mod 3329 (FIPS 203 Table 2: zeta = 17)
export const ZETAS: number[] = [
  1, 1729, 2580, 3289, 2642, 630, 1897, 848, 1062, 1919, 193, 797, 2786, 3260, 569, 1746,
  296, 2447, 1339, 1476, 3046, 56, 2240, 1333, 1426, 2094, 535, 2882, 2393, 2879, 1974, 821,
  289, 331, 3253, 1756, 1197, 2304, 2277, 2055, 650, 1977, 2513, 632, 2865, 33, 1320, 1915,
  2319, 1435, 807, 452, 1438, 2868, 1534, 2402, 2647, 2617, 1481, 648, 2474, 3110, 1227, 910,
  17, 2761, 583, 2649, 1637, 723, 2288, 1100, 1409, 2662, 3281, 233, 756, 2156, 3015, 3050,
  1703, 1651, 2789, 1789, 1847, 952, 1461, 2687, 939, 2308, 2437, 2388, 733, 2337, 268, 641,
  1584, 2298, 2037, 3220, 375, 2549, 2090, 1645, 1063, 319, 2773, 757, 2099, 561, 2466, 2594,
  2804, 1092, 403, 1026, 1143, 2150, 2775, 886, 1722, 1212, 1874, 1029, 2110, 2935, 885, 2154
];

// Official NIST FIPS 203 Known-Answer-Test (KAT) Vector Seeds
export const NIST_FIPS203_KAT_SEED_D = 'd69335b93325192e516a912e6d95ad1b42ecd06477394e605224b23a9a7c8058';
export const NIST_FIPS203_KAT_SEED_Z = '482c8113e4b40f31846b402e1b514d9396034f2081f4d88504e7e003e80c3021';
export const NIST_FIPS203_KAT_SEED_M = 'e76b2413950103b11f64982649028d4c72a0b31e05d0985220c3a2b1614f1784';
