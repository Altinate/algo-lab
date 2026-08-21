import { AlgorithmPlugin, AlgorithmInfo, ComputationStep, ComputationResult } from '../types';
import { stringToBytes, uint32ToHex, rotl32, add32 } from '../utils';

export const xxh32Info: AlgorithmInfo = {
  name: 'XXH32',
  family: 'XXHash',
  digestSize: 32,
  blockSize: 128,
  description: 'XXH32 is an extremely fast non-cryptographic hash algorithm developed by Yann Collet, providing near RAM-speed throughput and excellent dispersion quality.',
  useCases: ['In-memory hash tables', 'Database indexing', 'Fast checksums', 'Bloom filters'],
  security: 'non-cryptographic',
  year: 2012,
  designers: ['Yann Collet'],
};

const P1 = 0x9e3779b1;
const P2 = 0x85ebca77;
const P3 = 0xc2b2ae3d;
const P4 = 0x27d4eb2f;
const P5 = 0x165667b1;

function mul32(a: number, b: number): number {
  return Math.imul(a >>> 0, b >>> 0) >>> 0;
}

export class XXH32Plugin implements AlgorithmPlugin {
  info = xxh32Info;

  compute(input: string, options?: { seed?: number }): ComputationResult {
    const steps: ComputationStep[] = [];
    const bytes = stringToBytes(input);
    const len = bytes.length;
    const seed = (options?.seed ?? 0) >>> 0;
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

    let h32 = 0;

    if (len >= 16) {
      let v1 = add32(seed, P1, P2);
      let v2 = add32(seed, P2);
      let v3 = seed;
      let v4 = (seed - P1) >>> 0;

      const numStripes = Math.floor(len / 16);

      steps.push({
        id: 'init-accumulators',
        title: 'Initialize 4 Parallel Accumulators',
        phase: 'Preprocessing',
        description: 'Initialize accumulators v1..v4 with prime seed offsets.',
        data: {
          variables: [
            { label: 'v1', hex: uint32ToHex(v1) },
            { label: 'v2', hex: uint32ToHex(v2) },
            { label: 'v3', hex: uint32ToHex(v3) },
            { label: 'v4', hex: uint32ToHex(v4) },
          ],
        },
        visualizationType: 'round-computation',
      });

      for (let s = 0; s < numStripes; s++) {
        const offset = s * 16;
        const w1 = view.getUint32(offset, true);
        const w2 = view.getUint32(offset + 4, true);
        const w3 = view.getUint32(offset + 8, true);
        const w4 = view.getUint32(offset + 12, true);

        v1 = mul32(rotl32(add32(v1, mul32(w1, P2)), 13), P1);
        v2 = mul32(rotl32(add32(v2, mul32(w2, P2)), 13), P1);
        v3 = mul32(rotl32(add32(v3, mul32(w3, P2)), 13), P1);
        v4 = mul32(rotl32(add32(v4, mul32(w4, P2)), 13), P1);

        steps.push({
          id: `stripe-${s}`,
          title: `Stripe ${s + 1} of ${numStripes} (16 Bytes)`,
          phase: 'Processing',
          description: `Mix 16-byte stripe into accumulators: v_i = rotl(v_i + w_i * P2, 13) * P1`,
          data: {
            roundIndex: s,
            variables: [
              { label: 'v1', hex: uint32ToHex(v1) },
              { label: 'v2', hex: uint32ToHex(v2) },
              { label: 'v3', hex: uint32ToHex(v3) },
              { label: 'v4', hex: uint32ToHex(v4) },
            ],
          },
          visualizationType: 'round-computation',
        });
      }

      h32 = add32(rotl32(v1, 1), rotl32(v2, 7), rotl32(v3, 12), rotl32(v4, 18));
    } else {
      h32 = add32(seed, P5);
    }

    h32 = add32(h32, len);

    // Remaining 4-byte chunks
    let offset = Math.floor(len / 16) * 16;
    while (offset + 4 <= len) {
      const w = view.getUint32(offset, true);
      h32 = mul32(rotl32(add32(h32, mul32(w, P3)), 17), P4);
      offset += 4;
    }

    // Remaining single bytes
    while (offset < len) {
      const b = bytes[offset];
      h32 = mul32(rotl32(add32(h32, mul32(b, P5)), 11), P1);
      offset += 1;
    }

    // Avalanche finalizer
    h32 = mul32(h32 ^ (h32 >>> 15), P2);
    h32 = mul32(h32 ^ (h32 >>> 13), P3);
    h32 = (h32 ^ (h32 >>> 16)) >>> 0;

    const finalDigest = uint32ToHex(h32);

    steps.push({
      id: 'final-digest',
      title: 'Avalanche Finalization',
      phase: 'Finalization',
      description: 'Apply bit shifts and prime multiplications for complete bit avalanche dispersion.',
      data: {
        digest: finalDigest,
        hashValues: [{ label: 'XXH32', hex: finalDigest }],
      },
      visualizationType: 'final-digest',
    });

    return { digest: finalDigest, steps };
  }
}

export default new XXH32Plugin();
