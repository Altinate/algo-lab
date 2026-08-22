/**
 * RSA Cryptosystem Execution Engine (NIST SP 800-56B, PKCS#1 v2.2)
 * Supports 2048-bit CRT-accelerated and Pedagogical Step-by-Step execution.
 */

import {
  RsaKeyParameters,
  NIST_RSA_2048,
  PEDAGOGICAL_RSA_32,
} from './constants';
import {
  modPow,
  modPowCrt,
  pkcs1v15PadEncrypt,
  pkcs1v15UnpadEncrypt,
  pkcs1v15PadSign,
  bigIntToBytes,
  bytesToBigInt,
} from './rsa-math';
import { bytesToHex, hexToBytes, hexToString } from '../../utils';
import { sha256Plugin } from '../../sha256';
import type { ComputationStep, ComputationResult } from '../../types';

export type RsaOperation = 'encrypt' | 'decrypt' | 'sign' | 'verify';

export interface RsaOptions {
  keyParams?: RsaKeyParameters;
  signatureHex?: string;
  useCrt?: boolean;
}

export function executeRsa(
  input: string,
  keyParams: RsaKeyParameters,
  operation: RsaOperation,
  options?: RsaOptions,
): ComputationResult {
  const steps: ComputationStep[] = [];
  const keySizeBytes = Math.ceil(keyParams.keySizeBits / 8);
  const isPedagogical = keyParams.keySizeBits <= 64;

  // Step 1: Key Parameter Telemetry
  steps.push({
    id: 'rsa-key-parameters',
    title: `RSA-${keyParams.keySizeBits} Key Parameters & Modulus`,
    phase: 'Key Setup',
    description: `Modulus $N = p \\cdot q$ (${keyParams.keySizeBits} bits). Public Exponent $e = ${keyParams.e}$, Private Exponent $d$.`,
    data: {
      keySizeBits: keyParams.keySizeBits,
      nHex: keyParams.n.toString(16),
      eHex: keyParams.e.toString(16),
      dHex: keyParams.d.toString(16),
      pHex: keyParams.p.toString(16),
      qHex: keyParams.q.toString(16),
      dPHex: keyParams.dP.toString(16),
      dQHex: keyParams.dQ.toString(16),
      qInvHex: keyParams.qInv.toString(16),
    },
    visualizationType: 'asymmetric-modexp',
  });

  if (operation === 'encrypt') {
    // ENCRYPT: c = m^e mod n
    let dataBytes: Uint8Array;
    if (isPedagogical) {
      // Pedagogical: numerical integer input
      const numVal = parseInt(input.trim(), 10) || 65;
      dataBytes = new Uint8Array([numVal & 0xff]);
    } else {
      dataBytes = new TextEncoder().encode(input || 'Hello, CryptoScope RSA!');
    }

    let paddedBytes: Uint8Array;
    if (isPedagogical) {
      paddedBytes = dataBytes;
    } else {
      paddedBytes = pkcs1v15PadEncrypt(dataBytes, keySizeBytes);
    }

    const mBigInt = bytesToBigInt(paddedBytes);

    steps.push({
      id: 'rsa-enc-padding',
      title: isPedagogical ? 'Plaintext Integer Encoding' : 'PKCS#1 v1.5 Padding & Byte Formatting',
      phase: 'Message Encoding',
      description: isPedagogical
        ? `Plaintext mapped to numerical representative $m = ${mBigInt} \\in \\mathbb{Z}_N^*$.`
        : `Applied PKCS#1 v1.5 Type-2 encryption padding ($00 \\parallel 02 \\parallel PS \\parallel 00 \\parallel M$). Formatted $m = ${mBigInt.toString(16).slice(0, 32)}...$`,
      data: {
        rawInput: input,
        mHex: mBigInt.toString(16),
        paddedHex: bytesToHex(paddedBytes),
      },
      visualizationType: 'asymmetric-modexp',
    });

    // ModExp: c = m^e mod n
    const { result: cBigInt, bitSteps } = modPow(mBigInt, keyParams.e, keyParams.n);

    steps.push({
      id: 'rsa-enc-modpow',
      title: `Public Key Modular Exponentiation (c = m^e mod N)`,
      phase: 'Modular Exponentiation',
      description: `Computed $c \\equiv m^{${keyParams.e}} \\pmod{N}$ using Square-and-Multiply bit accumulator ladder.`,
      data: {
        baseHex: mBigInt.toString(16),
        expHex: keyParams.e.toString(16),
        modHex: keyParams.n.toString(16),
        resHex: cBigInt.toString(16),
        bitSteps,
      },
      visualizationType: 'asymmetric-modexp',
    });

    const cipherBytes = bigIntToBytes(cBigInt, keySizeBytes);
    const cipherHex = bytesToHex(cipherBytes);

    return { digest: cipherHex, steps };
  } else if (operation === 'decrypt') {
    // DECRYPT: m = c^d mod n (using CRT if available)
    let cBigInt: bigint;
    const cleanHex = input.replace(/\s+/g, '');
    if (/^[0-9a-fA-F]+$/.test(cleanHex) && cleanHex.length > 0) {
      cBigInt = BigInt('0x' + cleanHex);
    } else if (isPedagogical) {
      cBigInt = BigInt(parseInt(input.trim(), 10) || 2790);
    } else {
      cBigInt = NIST_RSA_2048.n / 2n; // fallback dummy
    }

    let mBigInt: bigint;

    if (!isPedagogical && options?.useCrt !== false) {
      // CRT-Accelerated Decryption
      const crt = modPowCrt(
        cBigInt,
        keyParams.p,
        keyParams.q,
        keyParams.dP,
        keyParams.dQ,
        keyParams.qInv,
      );
      mBigInt = crt.result;

      steps.push({
        id: 'rsa-dec-crt-p',
        title: 'CRT Reduction 1: m₁ = c^dP mod p',
        phase: 'CRT Reduction p',
        description: `Evaluated intermediate half-modulus exponentiation $m_1 = c^{dP} \\bmod p = ${crt.m1.toString(16).slice(0, 24)}...$`,
        data: {
          pHex: keyParams.p.toString(16),
          dPHex: keyParams.dP.toString(16),
          m1Hex: crt.m1.toString(16),
        },
        visualizationType: 'asymmetric-modexp',
      });

      steps.push({
        id: 'rsa-dec-crt-q',
        title: 'CRT Reduction 2: m₂ = c^dQ mod q',
        phase: 'CRT Reduction q',
        description: `Evaluated intermediate half-modulus exponentiation $m_2 = c^{dQ} \\bmod q = ${crt.m2.toString(16).slice(0, 24)}...$`,
        data: {
          qHex: keyParams.q.toString(16),
          dQHex: keyParams.dQ.toString(16),
          m2Hex: crt.m2.toString(16),
        },
        visualizationType: 'asymmetric-modexp',
      });

      steps.push({
        id: 'rsa-dec-crt-recombine',
        title: "Garner's CRT Recombination: m = m₂ + h · q",
        phase: 'CRT Recombination',
        description: `Recombined halves via Garner's formula: $h = qInv \\cdot (m_1 - m_2) \\bmod p$, $m = m_2 + h \\cdot q$. Full $m = ${mBigInt.toString(16).slice(0, 32)}...$`,
        data: {
          qInvHex: keyParams.qInv.toString(16),
          hHex: crt.h.toString(16),
          mHex: mBigInt.toString(16),
        },
        visualizationType: 'asymmetric-modexp',
      });
    } else {
      // Standard Square-and-Multiply
      const { result, bitSteps } = modPow(cBigInt, keyParams.d, keyParams.n);
      mBigInt = result;

      steps.push({
        id: 'rsa-dec-modpow',
        title: 'Private Key Modular Exponentiation (m = c^d mod N)',
        phase: 'Modular Exponentiation',
        description: `Computed $m \\equiv c^d \\pmod{N}$ using full private exponent $d$.`,
        data: {
          baseHex: cBigInt.toString(16),
          expHex: keyParams.d.toString(16),
          modHex: keyParams.n.toString(16),
          resHex: mBigInt.toString(16),
          bitSteps,
        },
        visualizationType: 'asymmetric-modexp',
      });
    }

    const paddedBytes = bigIntToBytes(mBigInt, keySizeBytes);
    let recoveredBytes = paddedBytes;
    if (!isPedagogical) {
      recoveredBytes = pkcs1v15UnpadEncrypt(paddedBytes);
    }

    const recoveredHex = bytesToHex(recoveredBytes);

    steps.push({
      id: 'rsa-dec-unpad',
      title: isPedagogical ? 'Plaintext Numerical Representative' : 'PKCS#1 v1.5 Unpadding & Plaintext Recovery',
      phase: 'Plaintext Output',
      description: isPedagogical
        ? `Recovered plaintext numerical integer: $m = ${mBigInt}$.`
        : `Stripped PKCS#1 v1.5 type-2 padding, recovering original message stream.`,
      data: {
        mHex: mBigInt.toString(16),
        recoveredHex,
      },
      visualizationType: 'asymmetric-modexp',
    });

    return { digest: recoveredHex, steps };
  } else if (operation === 'sign') {
    // SIGN: s = (EMSA-PKCS1-v1_5(H(m)))^d mod n
    const msg = input || 'CryptoScope Document Signature';
    const hashResult = sha256Plugin.compute(msg);
    const hashBytes = hexToBytes(hashResult.digest);

    steps.push({
      id: 'rsa-sign-hash',
      title: 'Message SHA-256 Digest Computation',
      phase: 'Hash Preprocessing',
      description: `Hashed input message with SHA-256: $H(M) = ${hashResult.digest}$.`,
      data: {
        message: msg,
        hashHex: hashResult.digest,
      },
      visualizationType: 'round-computation',
    });

    let emBytes: Uint8Array;
    if (isPedagogical) {
      const val = (hashBytes[0] << 8) | hashBytes[1];
      const truncated = BigInt(val) % keyParams.n;
      emBytes = bigIntToBytes(truncated, keySizeBytes);
    } else {
      emBytes = pkcs1v15PadSign(hashBytes, keySizeBytes);
    }

    const emBigInt = bytesToBigInt(emBytes);

    steps.push({
      id: 'rsa-sign-emsa-pad',
      title: isPedagogical ? 'Numerical Digest Truncation' : 'EMSA-PKCS1-v1_5 DigestInfo Encoding',
      phase: 'Signature Encoding',
      description: isPedagogical
        ? `Truncated hash to fit ${keyParams.keySizeBits}-bit modulus representative: $em = ${emBigInt}$.`
        : `Formatted DigestInfo with SHA-256 ASN.1 OID prefix ($3031...0420$) and padded to ${keyParams.keySizeBits} bits.`,
      data: {
        emHex: emBigInt.toString(16),
        paddedHex: bytesToHex(emBytes),
      },
      visualizationType: 'asymmetric-modexp',
    });

    // Sign with private key d
    let sBigInt: bigint;
    let m1Hex: string | undefined;
    let m2Hex: string | undefined;

    if (!isPedagogical && options?.useCrt !== false) {
      const crt = modPowCrt(
        emBigInt,
        keyParams.p,
        keyParams.q,
        keyParams.dP,
        keyParams.dQ,
        keyParams.qInv,
      );
      sBigInt = crt.result;
      m1Hex = crt.m1.toString(16);
      m2Hex = crt.m2.toString(16);
    } else {
      const { result } = modPow(emBigInt, keyParams.d, keyParams.n);
      sBigInt = result;
    }

    steps.push({
      id: 'rsa-sign-crt',
      title: isPedagogical
        ? 'Private Key Signature Exponentiation: s = em^d mod N'
        : 'CRT Private Key Signature Generation: s = em^d mod N',
      phase: 'Signature Exponentiation',
      description: isPedagogical
        ? `Calculated signature representative: $s = em^d \\bmod N = ${sBigInt}$.`
        : `Signed encoded digest using CRT exponentiation halves: $s = ${sBigInt.toString(16).slice(0, 32)}...$`,
      data: {
        sHex: sBigInt.toString(16),
        m1Hex,
        m2Hex,
      },
      visualizationType: 'asymmetric-modexp',
    });

    const sigBytes = bigIntToBytes(sBigInt, keySizeBytes);
    const sigHex = bytesToHex(sigBytes);

    return { digest: sigHex, steps };
  } else {
    // VERIFY: em' = s^e mod n, compare with EMSA(H(m))
    const msg = input || 'CryptoScope Document Signature';
    const hashResult = sha256Plugin.compute(msg);
    const hashBytes = hexToBytes(hashResult.digest);

    let sigBigInt: bigint;
    const cleanSigHex = (options?.signatureHex || '').replace(/\s+/g, '');
    if (/^[0-9a-fA-F]+$/.test(cleanSigHex) && cleanSigHex.length > 0) {
      sigBigInt = BigInt('0x' + cleanSigHex);
    } else {
      // Self-sign to verify standard vector
      const em = isPedagogical
        ? (() => {
            const val = (hashBytes[0] << 8) | hashBytes[1];
            const truncated = BigInt(val) % keyParams.n;
            return bigIntToBytes(truncated, keySizeBytes);
          })()
        : pkcs1v15PadSign(hashBytes, keySizeBytes);
      const s = isPedagogical
        ? modPow(bytesToBigInt(em), keyParams.d, keyParams.n)
        : modPowCrt(bytesToBigInt(em), keyParams.p, keyParams.q, keyParams.dP, keyParams.dQ, keyParams.qInv);
      sigBigInt = s.result;
    }

    // Public Key Exponentiation: em = s^e mod n
    const { result: emRecoveredBigInt, bitSteps } = modPow(sigBigInt, keyParams.e, keyParams.n);

    // Expected EM
    const expectedEmBytes = isPedagogical
      ? (() => {
          const val = (hashBytes[0] << 8) | hashBytes[1];
          const truncated = BigInt(val) % keyParams.n;
          return bigIntToBytes(truncated, keySizeBytes);
        })()
      : pkcs1v15PadSign(hashBytes, keySizeBytes);
    const expectedEmBigInt = bytesToBigInt(expectedEmBytes);

    const isValid = emRecoveredBigInt === expectedEmBigInt;

    steps.push({
      id: 'rsa-verify-modpow',
      title: 'Public Key Verification Exponentiation (em = s^e mod N)',
      phase: 'Signature Verification',
      description: `Recovered encoded message $em = s^e \\bmod N$. Compared with expected SHA-256 EMSA digest.${
        isValid ? ' MATCH: SIGNATURE VALID.' : ' MISMATCH: SIGNATURE INVALID.'
      }`,
      data: {
        sigHex: sigBigInt.toString(16),
        eHex: keyParams.e.toString(16),
        recoveredEmHex: emRecoveredBigInt.toString(16),
        expectedEmHex: expectedEmBigInt.toString(16),
        isValid,
        bitSteps,
      },
      visualizationType: 'asymmetric-modexp',
    });

    return { digest: isValid ? 'VALID (AUTHENTIC)' : 'INVALID (FORGED)', tagValid: isValid, steps };
  }
}
