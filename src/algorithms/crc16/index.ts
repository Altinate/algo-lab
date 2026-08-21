import { AlgorithmPlugin, AlgorithmInfo, ComputationStep, ComputationResult } from '../types';
import { stringToBytes, uint16ToHex } from '../utils';

export const crc16Info: AlgorithmInfo = {
  name: 'CRC-16',
  family: 'CRC',
  digestSize: 16,
  blockSize: 8,
  description: 'CRC-16-IBM (ANSI) is a 16-bit cyclic redundancy check with polynomial 0x8005 (reversed: 0xA001), widely used in Modbus, USB, and serial telecommunications.',
  useCases: ['Modbus protocol', 'USB packets', 'Serial communications', 'Disk sectors'],
  security: 'non-cryptographic',
  year: 1975,
  designers: ['IBM / ANSI'],
};

// Generate standard 256-entry CRC-16 lookup ROM table (poly 0xA001)
const CRC16_TABLE = new Uint16Array(256);
for (let i = 0; i < 256; i++) {
  let crc = i;
  for (let j = 0; j < 8; j++) {
    crc = (crc & 1) ? (crc >>> 1) ^ 0xA001 : (crc >>> 1);
  }
  CRC16_TABLE[i] = crc & 0xFFFF;
}

export class CRC16Plugin implements AlgorithmPlugin {
  info = crc16Info;

  compute(input: string): ComputationResult {
    const steps: ComputationStep[] = [];
    const bytes = stringToBytes(input);
    let crc = 0x0000;

    steps.push({
      id: 'init-crc',
      title: 'Initialize 16-Bit CRC Register',
      phase: 'Preprocessing',
      description: 'Initialize the 16-bit CRC shift register to 0x0000.',
      data: {
        byteIndex: 0,
        prevCrc: '0x0000',
        tableIndex: 'INIT',
        tableValue: '0x0000',
        newCrc: '0x0000',
      },
      visualizationType: 'xor-table',
    });

    for (let i = 0; i < bytes.length; i++) {
      const byte = bytes[i];
      const prevCrc = crc;
      const xorIndex = (crc ^ byte) & 0xFF;
      const tableVal = CRC16_TABLE[xorIndex];
      const shifted = (crc >>> 8) & 0xFF;
      crc = (shifted ^ tableVal) & 0xFFFF;

      const char = byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : undefined;

      steps.push({
        id: `byte-${i}`,
        title: `Byte ${i + 1} of ${bytes.length}: ${char ? `'${char}'` : `0x${byte.toString(16).padStart(2, '0')}`}`,
        phase: 'Processing',
        description: `Transform Byte ${i + 1}:\n1. Index = (0x${uint16ToHex(prevCrc)} ⊕ 0x${byte.toString(16).padStart(2, '0')}) & 0xFF = 0x${xorIndex.toString(16).padStart(2, '0')} (${xorIndex})\n2. ROM Lookup = 0x${uint16ToHex(tableVal)}\n3. CRC = (CRC >> 8) ⊕ ROM = 0x${uint16ToHex(crc)}`,
        data: {
          byteIndex: i,
          byteValue: byte,
          char,
          prevCrc: `0x${uint16ToHex(prevCrc)}`,
          xorInput: `0x${uint16ToHex(prevCrc & 0xff)} ⊕ 0x${byte.toString(16).padStart(2, '0')} = 0x${xorIndex.toString(16).padStart(2, '0')}`,
          tableIndex: `0x${xorIndex.toString(16).padStart(2, '0')} (${xorIndex})`,
          tableValue: `0x${uint16ToHex(tableVal)}`,
          shiftedCrc: `0x${uint16ToHex(shifted)}`,
          newCrc: `0x${uint16ToHex(crc)}`,
        },
        visualizationType: 'xor-table',
      });
    }

    const finalDigest = uint16ToHex(crc);

    steps.push({
      id: 'final-digest',
      title: 'Final CRC-16 Assembly',
      phase: 'Finalization',
      description: `Output the 16-bit CRC checksum: 0x${finalDigest}.`,
      data: {
        digest: finalDigest,
        hashValues: [
          { label: 'CRC-16', hex: finalDigest },
        ],
      },
      visualizationType: 'final-digest',
    });

    return { digest: finalDigest, steps };
  }
}

export default new CRC16Plugin();
