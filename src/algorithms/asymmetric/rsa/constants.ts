/**
 * RSA Standard Test Vectors & Parameters (NIST CAVP / PKCS#1 v2.2)
 */

export interface RsaKeyParameters {
  keySizeBits: number;
  n: bigint;       // Modulus n = p * q
  e: bigint;       // Public Exponent (usually 65537 or 17)
  d: bigint;       // Private Exponent d = e^(-1) mod phi(n)
  p: bigint;       // Prime 1
  q: bigint;       // Prime 2
  dP: bigint;      // d mod (p - 1)
  dQ: bigint;      // d mod (q - 1)
  qInv: bigint;    // q^(-1) mod p
}

// 1. Official NIST CAVP / PKCS#1 v2.2 2048-bit Standard Test Vector Key
export const NIST_RSA_2048: RsaKeyParameters = {
  keySizeBits: 2048,
  n: BigInt(
    '0xf72929ce7d5df48264d8b1418be63ec04405452c22c7ef7860f0e46dabf74680' +
    'a2770516a47226a7337908025942b4ce69d6656c8ae98ff6b80b73e747c19a67' +
    '1099006a5e9f89f1251c77f252d7d968b4d32dec8897c71bbce82d6fc56430ca' +
    '1b8aab30a5f02662cd5f07de8b7b9df29bd99cdca9ca0f1cb963d3e9de614e75' +
    'd695c2526eeb06b0156834813410bc8f42951ada2634d740d0b50eea3e6a7c96' +
    '4827758b72b5f2e6654e482aa05977503d7a5ce5548b48d90f3135f299900da1' +
    'dbd57d5b2312b55257629f5132fd79ba078d1ccab7094cf5d285a2f693141467' +
    '2bd4974d243ce7d4dab35557e1660bd1d0bf74f61ffcdbb93ceae8148b4a109b'
  ),
  e: 65537n,
  d: BigInt(
    '0x32d20476206206ca1ef94d6d385a65f1bbaac7bfdd00f654eebde98241774d48' +
    '5adf952cc430729133acc1c055e138f32e60f6a6dc634d06426e9c6ce45cc326' +
    '490be4c17a665c833889c3821095b06eeeab73886cc7a499a7fca7871173d9f2' +
    '5cba651bd22af081a54fd27ae87c490c5f0e5e4a2321587d24038a49cebf7c55' +
    'a811a98d5e3216c89e5559f7426d70caf83a69d6e1801346e57c5c681004b066' +
    '1ce08b23342c3df69ecafc00450f1680fcbaf80c90ed2b6b9fcd94739e1fffac' +
    '7678b38dd441f2ebfe0b40d24e74d9d079bde448ee7a873e8a0f1ded2e9387cc' +
    'a3e8a0de629e6adfb1e8bcb2a7cb064a29b3312e8707fc22201d869fa988c06d'
  ),
  p: BigInt(
    '0xfbdd0cf3b2e4db760feaf477fe77d572fb09d73b9c5207d1dd69bc64dc26065b' +
    '5e3c9537449e3024536f5d45c399b2d49703e4bc61dd7973f2dba40e937075de' +
    '3cc12e0629621de2e5525d9ef08abaed2a4bfde65987060381b7d6bbbd49540b' +
    '5fe3fcf404e8e5d0b590b0ac1e98ad3d8d1acd567a994dd340fb28613e96ef17'
  ),
  q: BigInt(
    '0xfb38572942ef6b78d8001e295399951e8550ff69b345d1d64d0af12b8be064f7' +
    '18dddf4c5b5137481039baaee3b2031dbb613994eb9dee623a7368f76b39bf23' +
    '171c8de6409a1acb53cbc12148e9f2f873ecf3b6d7a758adeb49c19fa2af524b' +
    '2deedc00c667a6c017424cea102f5403553cd12847f590c3d000874d8bdbbd1d'
  ),
  dP: BigInt(
    '0x43579865f4983281bfc1cfb9e1c542c22a9338044d48b5a48c7200186bb09314' +
    '8cfedfdad63301a644d4caf8a3530e38bf64201daa81203f3b5934e55cd0be03' +
    '3cf55e0bf1b6b54cfc89e8545df68a026dc3c1d07c7198cf0939116643373f0c' +
    '87881b1357d8b9d1f32a0bc309af42eae936985e9e0b2d7ee5aa01e2f66c3ee3'
  ),
  dQ: BigInt(
    '0x196146c4ff632acb699f116d016a29bb8ca2733b5d86373ddc48b7b6bb89ef09' +
    '5bb4c6a373325050727b32960aa0e859af9d91f0aea124fd3d847d5d49b2ead1' +
    '83bb39c6c24e0f58ed5d4f64aa76203ae39353c7ec1f9700f31d5f775e3b3228' +
    '303aca753596312d84ec08d338d15f3e7af50af873d4a64c720e2b9d34fcfd2d'
  ),
  qInv: BigInt(
    '0x1db0868a802d8c605212d5ee793c0fb5c1e704db7f9df69c8833bbe731243778' +
    '6a3f464080bcef944f2b1cc45451b820c212cee951f107d5efda0aa8cd12f74b' +
    'f71a13a808cca76d336491b3e6a4a1b9b51b3c9791b36651978ff594a755aa78' +
    '9799a7e4978901648a40b30c7f370faa665c3dafe00d7b4d90d7d618060cf209'
  ),
};

// 2. Pedagogical 32-bit Toy Parameters for Step-by-Step Teaching
// p = 61, q = 53 => n = 3233, phi(n) = 3120, e = 17, d = 2753
export const PEDAGOGICAL_RSA_32: RsaKeyParameters = {
  keySizeBits: 32,
  n: 3233n,
  e: 17n,
  d: 2753n,
  p: 61n,
  q: 53n,
  dP: 53n,      // 2753 % 60 = 53
  dQ: 49n,      // 2753 % 52 = 49
  qInv: 38n,    // 53^(-1) mod 61 = 38
};
