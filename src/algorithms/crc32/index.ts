import { AlgorithmPlugin, AlgorithmInfo, ComputationStep } from '../types';
import { stringToBytes, uint32ToHex } from '../utils';

export const crc32Info: AlgorithmInfo = {
  name: 'CRC32',
  family: 'CRC',
  digestSize: 32,
  blockSize: 8,
  description: 'CRC32 (Cyclic Redundancy Check) computes a 32-bit checksum. It is designed to detect accidental changes to raw computer data.',
  useCases: ['Error detection', 'Network checksums', 'Zip files'],
  security: 'non-cryptographic',
  securityNote: 'CRC32 is not a cryptographic hash. It detects accidental data corruption but provides no security against intentional tampering.',
  year: 1975,
  designers: ['Wesley Peterson']
};

// Precompute CRC32 polynomial lookup table (0xEDB88320 / reversed polynomial)
export const CRC32_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) {
    if (c & 1) {
      c = 0xEDB88320 ^ (c >>> 1);
    } else {
      c = c >>> 1;
    }
  }
  CRC32_TABLE[i] = c >>> 0;
}

export class CRC32Plugin implements AlgorithmPlugin {
  info = crc32Info;

  compute(input: string) {
    const steps: ComputationStep[] = [];
    const bytes = stringToBytes(input);
    
    let crc = 0xFFFFFFFF;
    
    steps.push({
      id: 'init',
      title: 'Initialize CRC Register',
      phase: 'Initialization',
      description: 'Initialize the 32-bit CRC state register to 0xFFFFFFFF.',
      data: {
        prevCrc: '0x' + uint32ToHex(crc),
        newCrc: '0x' + uint32ToHex(crc),
      },
      visualizationType: 'xor-table'
    });

    for (let i = 0; i < bytes.length; i++) {
      const byte = bytes[i];
      const char = input[i] && input.charCodeAt(i) >= 32 && input.charCodeAt(i) <= 126 ? input[i] : undefined;
      const index = (crc ^ byte) & 0xFF;
      const tableVal = CRC32_TABLE[index];
      const shiftedCrc = crc >>> 8;
      const nextCrc = (shiftedCrc ^ tableVal) >>> 0;
      
      steps.push({
        id: `process-byte-${i}`,
        title: `Process Byte ${i + 1} of ${bytes.length}`,
        phase: 'Processing',
        description: `Byte: 0x${byte.toString(16).padStart(2, '0').toUpperCase()} ${char ? `('${char}')` : ''}\nTable index = (CRC[0..7] ⊕ Byte) = 0x${index.toString(16).padStart(2, '0').toUpperCase()}\nNew CRC = (CRC >> 8) ⊕ TABLE[0x${index.toString(16).padStart(2, '0').toUpperCase()}] = 0x${uint32ToHex(nextCrc)}`,
        data: {
          byteIndex: i,
          byteValue: byte,
          char,
          prevCrc: '0x' + uint32ToHex(crc),
          xorInput: `0x${byte.toString(16).padStart(2, '0').toUpperCase()} ⊕ 0x${(crc & 0xFF).toString(16).padStart(2, '0').toUpperCase()} = 0x${index.toString(16).padStart(2, '0').toUpperCase()}`,
          tableIndex: `0x${index.toString(16).padStart(2, '0').toUpperCase()} (${index})`,
          tableValue: '0x' + uint32ToHex(tableVal),
          shiftedCrc: '0x' + uint32ToHex(shiftedCrc),
          newCrc: '0x' + uint32ToHex(nextCrc),
        },
        visualizationType: 'xor-table'
      });
      
      crc = nextCrc;
    }

    const finalCrc = (crc ^ 0xFFFFFFFF) >>> 0;
    const digest = uint32ToHex(finalCrc);
    
    steps.push({
      id: 'final',
      title: 'Final Inversion',
      phase: 'Finalization',
      description: `Invert CRC state with XOR 0xFFFFFFFF:\n0x${uint32ToHex(crc)} ⊕ 0xFFFFFFFF = 0x${digest}`,
      data: {
        prevCrc: '0x' + uint32ToHex(crc),
        xorInput: '0x' + uint32ToHex(crc) + ' ⊕ 0xFFFFFFFF',
        newCrc: '0x' + digest,
        digest,
        hashValues: [
          { label: 'CRC32', hex: digest }
        ],
      },
      visualizationType: 'final-digest'
    });

    return { digest, steps };
  }
}

export default new CRC32Plugin();
