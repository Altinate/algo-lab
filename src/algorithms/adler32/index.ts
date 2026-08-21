import { AlgorithmPlugin, AlgorithmInfo, ComputationStep, ComputationResult } from '../types';
import { stringToBytes, uint32ToHex } from '../utils';

export const adler32Info: AlgorithmInfo = {
  name: 'Adler-32',
  family: 'Checksum',
  digestSize: 32,
  blockSize: 8,
  description: 'Adler-32 is a fast checksum algorithm invented by Mark Adler in 1995, used widely in zlib and PNG compression. It trades error-detection capability for computation speed compared to CRC32.',
  useCases: ['zlib compression', 'PNG image chunk validation', 'Data stream integrity'],
  security: 'non-cryptographic',
  year: 1995,
  designers: ['Mark Adler'],
};

const MOD_ADLER = 65521;

export class Adler32Plugin implements AlgorithmPlugin {
  info = adler32Info;

  compute(input: string): ComputationResult {
    const steps: ComputationStep[] = [];
    const bytes = stringToBytes(input);

    let a = 1;
    let b = 0;

    steps.push({
      id: 'init-state',
      title: 'Initialize 16-Bit Checksum Accumulators',
      phase: 'Preprocessing',
      description: 'Initialize primary accumulator A = 1 and secondary accumulator B = 0 with modulo 65521.',
      data: {
        byteIndex: 0,
        prevCrc: '0x00000001',
        tableIndex: 'MOD 65521',
        tableValue: 'A=1, B=0',
        newCrc: '0x00000001',
      },
      visualizationType: 'xor-table',
    });

    for (let i = 0; i < bytes.length; i++) {
      const byte = bytes[i];
      const prevA = a;
      const prevB = b;

      a = (a + byte) % MOD_ADLER;
      b = (b + a) % MOD_ADLER;

      const currentCrc = ((b << 16) | a) >>> 0;
      const char = byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : undefined;

      steps.push({
        id: `byte-${i}`,
        title: `Byte ${i + 1} of ${bytes.length}: ${char ? `'${char}'` : `0x${byte.toString(16).padStart(2, '0')}`}`,
        phase: 'Processing',
        description: `Byte ${i + 1} Accumulation:\nA = (${prevA} + ${byte}) mod 65521 = ${a}\nB = (${prevB} + ${a}) mod 65521 = ${b}\nDigest = (B << 16) | A = 0x${uint32ToHex(currentCrc)}`,
        data: {
          byteIndex: i,
          byteValue: byte,
          char,
          prevCrc: `0x${uint32ToHex(((prevB << 16) | prevA) >>> 0)}`,
          xorInput: `A = (${prevA} + 0x${byte.toString(16).padStart(2, '0')}) mod 65521`,
          tableIndex: `0x${a.toString(16).padStart(4, '0')} (${a})`,
          tableValue: `B = (${prevB} + ${a}) mod 65521 = ${b}`,
          shiftedCrc: `0x${uint32ToHex((b << 16) >>> 0)}`,
          newCrc: `0x${uint32ToHex(currentCrc)}`,
        },
        visualizationType: 'xor-table',
      });
    }

    const finalDigestNum = ((b << 16) | a) >>> 0;
    const finalDigest = uint32ToHex(finalDigestNum);

    steps.push({
      id: 'final-digest',
      title: 'Final Checksum Assembly',
      phase: 'Finalization',
      description: `Combine high 16-bit word B (0x${b.toString(16).padStart(4, '0')}) and low 16-bit word A (0x${a.toString(16).padStart(4, '0')}) to produce the 32-bit Adler-32 checksum.`,
      data: {
        digest: finalDigest,
        hashValues: [
          { label: 'B (High 16b)', hex: b.toString(16).padStart(4, '0') },
          { label: 'A (Low 16b)', hex: a.toString(16).padStart(4, '0') },
        ],
      },
      visualizationType: 'final-digest',
    });

    return { digest: finalDigest, steps };
  }
}

export default new Adler32Plugin();
