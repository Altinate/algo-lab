import { AlgorithmPlugin, AlgorithmInfo, ComputationStep, ComputationResult } from '../types';
import { stringToBytes, uint64ToHex, rotl64, add64 } from '../utils';

export const xxh64Info: AlgorithmInfo = {
  name: 'XXH64',
  family: 'XXHash',
  digestSize: 64,
  blockSize: 256,
  description: 'XXH64 is the 64-bit BigInt non-cryptographic hash from the XXHash family, engineered for extremely high performance on 64-bit architectures.',
  useCases: ['Large dataset hashing', 'Database checksums', 'Distributed systems'],
  security: 'non-cryptographic',
  year: 2012,
  designers: ['Yann Collet'],
};

const P1 = 0x9e3779b185ebca87n;
const P2 = 0xc2b2ae3d27d4eb4fn;
const P3 = 0x165667b19e3779f9n;
const P4 = 0x85ebca77c2b2ae63n;
const P5 = 0x27d4eb2f165667c5n;
const MASK64 = 0xffffffffffffffffn;

function mul64(a: bigint, b: bigint): bigint {
  return (a * b) & MASK64;
}

export class XXH64Plugin implements AlgorithmPlugin {
  info = xxh64Info;

  compute(input: string, options?: { seed?: bigint }): ComputationResult {
    const steps: ComputationStep[] = [];
    const bytes = stringToBytes(input);
    const len = BigInt(bytes.length);
    const seed = (options?.seed ?? 0n) & MASK64;
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

    let h64 = 0n;

    if (bytes.length >= 32) {
      let v1 = add64(seed, P1, P2);
      let v2 = add64(seed, P2);
      let v3 = seed;
      let v4 = (seed - P1) & MASK64;

      const numStripes = Math.floor(bytes.length / 32);

      steps.push({
        id: 'init-accumulators',
        title: 'Initialize 4 64-Bit Accumulators',
        phase: 'Preprocessing',
        description: 'Initialize 64-bit accumulators v1..v4 with prime seed offsets.',
        data: {
          variables: [
            { label: 'v1', hex: uint64ToHex(v1) },
            { label: 'v2', hex: uint64ToHex(v2) },
            { label: 'v3', hex: uint64ToHex(v3) },
            { label: 'v4', hex: uint64ToHex(v4) },
          ],
        },
        visualizationType: 'round-computation',
      });

      for (let s = 0; s < numStripes; s++) {
        const offset = s * 32;
        const w1 = view.getBigUint64(offset, true);
        const w2 = view.getBigUint64(offset + 8, true);
        const w3 = view.getBigUint64(offset + 16, true);
        const w4 = view.getBigUint64(offset + 24, true);

        v1 = mul64(rotl64(add64(v1, mul64(w1, P2)), 31), P1);
        v2 = mul64(rotl64(add64(v2, mul64(w2, P2)), 31), P1);
        v3 = mul64(rotl64(add64(v3, mul64(w3, P2)), 31), P1);
        v4 = mul64(rotl64(add64(v4, mul64(w4, P2)), 31), P1);

        steps.push({
          id: `stripe-${s}`,
          title: `Stripe ${s + 1} of ${numStripes} (32 Bytes)`,
          phase: 'Processing',
          description: 'Mix 32-byte stripe into 64-bit accumulators.',
          data: {
            roundIndex: s,
            variables: [
              { label: 'v1', hex: uint64ToHex(v1) },
              { label: 'v2', hex: uint64ToHex(v2) },
              { label: 'v3', hex: uint64ToHex(v3) },
              { label: 'v4', hex: uint64ToHex(v4) },
            ],
          },
          visualizationType: 'round-computation',
        });
      }

      function mergeRound(acc: bigint, val: bigint): bigint {
        return (mul64(acc ^ mul64(rotl64(mul64(val, P2), 31), P1), P1) + P4) & MASK64;
      }

      h64 = add64(rotl64(v1, 1), rotl64(v2, 7), rotl64(v3, 12), rotl64(v4, 18));
      h64 = mergeRound(h64, v1);
      h64 = mergeRound(h64, v2);
      h64 = mergeRound(h64, v3);
      h64 = mergeRound(h64, v4);
    } else {
      h64 = add64(seed, P5);
    }

    h64 = add64(h64, len);

    // Remaining 8-byte chunks
    let offset = Math.floor(bytes.length / 32) * 32;
    while (offset + 8 <= bytes.length) {
      const w = view.getBigUint64(offset, true);
      const k1 = mul64(rotl64(mul64(w, P2), 31), P1);
      h64 = (mul64(rotl64(h64 ^ k1, 27), P1) + P4) & MASK64;
      offset += 8;
    }

    // Remaining 4-byte chunk
    if (offset + 4 <= bytes.length) {
      const w = BigInt(view.getUint32(offset, true));
      h64 = (mul64(rotl64(h64 ^ mul64(w, P1), 23), P2) + P3) & MASK64;
      offset += 4;
    }

    // Remaining single bytes
    while (offset < bytes.length) {
      const b = BigInt(bytes[offset]);
      h64 = mul64(rotl64(h64 ^ mul64(b, P5), 11), P1);
      offset += 1;
    }

    // Avalanche finalizer
    h64 = mul64(h64 ^ (h64 >> 33n), P2);
    h64 = mul64(h64 ^ (h64 >> 29n), P3);
    h64 = (h64 ^ (h64 >> 32n)) & MASK64;

    const finalDigest = uint64ToHex(h64);

    steps.push({
      id: 'final-digest',
      title: '64-Bit Avalanche Finalization',
      phase: 'Finalization',
      description: 'Apply 64-bit barrel shifts and prime multipliers for full avalanche dispersion.',
      data: {
        digest: finalDigest,
        hashValues: [{ label: 'XXH64', hex: finalDigest }],
      },
      visualizationType: 'final-digest',
    });

    return { digest: finalDigest, steps };
  }
}

export default new XXH64Plugin();
