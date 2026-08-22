/**
 * NIST FIPS 203 ML-KEM Constants, Parameters, and Official Intermediate KAT Test Vectors
 */

export interface MlKemParams {
  name: string;
  k: number;          // Module lattice rank
  eta1: number;       // CBD parameter for s and r
  eta2: number;       // CBD parameter for e, e1, e2
  du: number;         // Compression parameter for u
  dv: number;         // Compression parameter for v
  ekBytes: number;    // Encapsulation key length (bytes)
  dkBytes: number;    // Decapsulation key length (bytes)
  cBytes: number;     // Ciphertext length (bytes)
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

// Official NIST FIPS 203 Intermediate KAT Test Vectors (C2SP/CCTV CC0-1.0 / NIST PQC)
export const NIST_FIPS203_KAT_512 = {
  d: 'e1e3206875e67d7e81353774fe9025035b9b41a4a9f6ec00b91c600442fd717d',
  z: 'c6f5785a6f2b42e843228be53eb768d64c6f9d4355ae95f083e51ed57c437310',
  m: 'a741ec2002be6f4fa76037b7f0644f833fa823e630401a39d3240c6e82a430bb',
  expectedK: '62a8c220b01793ecd183dea9762c5602211e0aab001cbc892d0a95693ab17cc1',
};

export const NIST_FIPS203_KAT_768 = {
  d: 'f688563f7c66a5da2d8bdb5a5f3e07bd8dce6f7efcec7f41298d79863459f7cd',
  z: 'd1d49a515250dbceb9f6e3fcc1c7d5306918964b21ddb22207e03e57f0600da8',
  m: '3dc27ca0a6594b0e56320457c45a0f76bb8a213ea4a76d442186a0aefadbcdb9',
  expectedK: '4b4eba37eff0315dc6009dcffb4dfbbb680f8f2ebde8715fa3d6daf70256a2d9',
};

export const NIST_FIPS203_KAT_1024 = {
  d: '2a62c39ef4fc499f2d132716f480bb7521a49558ae84ee80d9352e66daf1e3a8',
  z: '5f574ef7f013d4336801fed022178c3ed91d0b6d51325315fc1dcabf4770a2ea',
  m: 'e07d685ed308e609c9c7842026e35732f6ffc6e2fee10f0afd348f2b42a8acb4',
  expectedK: '6c4f4a231255a8cdfb7424c8dabf3a624cefaffd28964efe220ab6178fa6b324',
};

export const NIST_FIPS203_KAT_SEED_D = NIST_FIPS203_KAT_768.d;
export const NIST_FIPS203_KAT_SEED_Z = NIST_FIPS203_KAT_768.z;
export const NIST_FIPS203_KAT_SEED_M = NIST_FIPS203_KAT_768.m;
