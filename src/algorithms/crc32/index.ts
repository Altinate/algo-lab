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

// Precompute CRC32 table
const CRC32_TABLE = new Uint32Array(256);
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
      title: 'Initialize',
      phase: 'Initialization',
      description: 'Initialize the CRC state to 0xFFFFFFFF',
      data: { crc: uint32ToHex(crc) },
      visualizationType: 'generic'
    });

    for (let i = 0; i < bytes.length; i++) {
      const byte = bytes[i];
      const index = (crc ^ byte) & 0xFF;
      const tableVal = CRC32_TABLE[index];
      const nextCrc = (crc >>> 8) ^ tableVal;
      
      steps.push({
        id: `process-byte-${i}`,
        title: `Process Byte ${i}`,
        phase: 'Processing',
        description: `XOR current CRC with byte, lookup table, XOR with shifted CRC.`,
        data: {
          byte: byte.toString(16).padStart(2, '0'),
          crcBefore: uint32ToHex(crc),
          index: index.toString(16).padStart(2, '0'),
          tableValue: uint32ToHex(tableVal),
          crcAfter: uint32ToHex(nextCrc >>> 0)
        },
        visualizationType: 'xor-table'
      });
      
      crc = nextCrc >>> 0;
    }

    const finalCrc = (crc ^ 0xFFFFFFFF) >>> 0;
    const digest = uint32ToHex(finalCrc);
    
    steps.push({
      id: 'final',
      title: 'Finalize',
      phase: 'Finalization',
      description: 'XOR the final state with 0xFFFFFFFF to get the checksum.',
      data: { crc: uint32ToHex(crc), digest },
      visualizationType: 'final-digest'
    });

    return { digest, steps };
  }
}

export default new CRC32Plugin();
