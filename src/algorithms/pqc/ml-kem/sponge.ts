import { RC, RHO } from '../../keccak/engine';

export class KeccakSponge {
  state: bigint[][];
  rateBytes: number;
  domainSep: number;
  bytePos: number;
  squeezedPos: number;
  isAbsorbed: boolean;
  rateBits: number;

  constructor(rateBits: number, domainSep: number) {
    this.rateBits = rateBits;
    this.rateBytes = rateBits / 8;
    this.domainSep = domainSep;
    this.state = Array.from({ length: 5 }, () => Array(5).fill(0n));
    this.bytePos = 0;
    this.squeezedPos = 0;
    this.isAbsorbed = false;
  }

  absorb(input: Uint8Array): void {
    for (let i = 0; i < input.length; i++) {
      const laneX = Math.floor((this.bytePos % this.rateBytes) / 8) % 5;
      const laneY = Math.floor(Math.floor((this.bytePos % this.rateBytes) / 8) / 5);
      const byteInLane = this.bytePos % 8;

      this.state[laneX][laneY] ^= BigInt(input[i]) << BigInt(byteInLane * 8);
      this.bytePos++;

      if (this.bytePos === this.rateBytes) {
        this.permute();
        this.bytePos = 0;
      }
    }
  }

  finalize(): void {
    if (this.isAbsorbed) return;

    // Apply domain separation + pad10*1
    const laneX = Math.floor(this.bytePos / 8) % 5;
    const laneY = Math.floor(Math.floor(this.bytePos / 8) / 5);
    const byteInLane = this.bytePos % 8;

    this.state[laneX][laneY] ^= BigInt(this.domainSep) << BigInt(byteInLane * 8);

    // Final bit of padding at end of rate
    const lastX = Math.floor((this.rateBytes - 1) / 8) % 5;
    const lastY = Math.floor(Math.floor((this.rateBytes - 1) / 8) / 5);
    const lastByteInLane = (this.rateBytes - 1) % 8;

    this.state[lastX][lastY] ^= 0x80n << BigInt(lastByteInLane * 8);

    this.permute();
    this.isAbsorbed = true;
    this.squeezedPos = 0;
  }

  squeeze(outLen: number): Uint8Array {
    this.finalize();
    const out = new Uint8Array(outLen);

    for (let i = 0; i < outLen; i++) {
      if (this.squeezedPos === this.rateBytes) {
        this.permute();
        this.squeezedPos = 0;
      }

      const laneX = Math.floor(this.squeezedPos / 8) % 5;
      const laneY = Math.floor(Math.floor(this.squeezedPos / 8) / 5);
      const byteInLane = this.squeezedPos % 8;

      out[i] = Number((this.state[laneX][laneY] >> BigInt(byteInLane * 8)) & 0xffn);
      this.squeezedPos++;
    }

    return out;
  }

  private permute(): void {
    const s = this.state;

    for (let round = 0; round < 24; round++) {
      // 1. Theta
      const C: bigint[] = [0n, 0n, 0n, 0n, 0n];
      for (let x = 0; x < 5; x++) {
        C[x] = s[x][0] ^ s[x][1] ^ s[x][2] ^ s[x][3] ^ s[x][4];
      }

      const D: bigint[] = [0n, 0n, 0n, 0n, 0n];
      for (let x = 0; x < 5; x++) {
        const cLeft = C[(x + 4) % 5];
        const cRight = C[(x + 1) % 5];
        const rot = ((cRight << 1n) | (cRight >> 63n)) & 0xffffffffffffffffn;
        D[x] = cLeft ^ rot;
      }

      for (let x = 0; x < 5; x++) {
        for (let y = 0; y < 5; y++) {
          s[x][y] ^= D[x];
        }
      }

      // 2. Rho & Pi
      const B: bigint[][] = Array.from({ length: 5 }, () => Array(5).fill(0n));
      for (let x = 0; x < 5; x++) {
        for (let y = 0; y < 5; y++) {
          const shift = BigInt(RHO[x][y]);
          const rot = shift === 0n ? s[x][y] : ((s[x][y] << shift) | (s[x][y] >> (64n - shift))) & 0xffffffffffffffffn;
          B[y][(2 * x + 3 * y) % 5] = rot;
        }
      }

      // 3. Chi
      for (let x = 0; x < 5; x++) {
        for (let y = 0; y < 5; y++) {
          s[x][y] = (B[x][y] ^ ((~B[(x + 1) % 5][y]) & B[(x + 2) % 5][y])) & 0xffffffffffffffffn;
        }
      }

      // 4. Iota
      s[0][0] = (s[0][0] ^ RC[round]) & 0xffffffffffffffffn;
    }
  }
}

/** SHA3-512: G(x) */
export function sha3_512(input: Uint8Array): Uint8Array {
  const sponge = new KeccakSponge(576, 0x06);
  sponge.absorb(input);
  return sponge.squeeze(64);
}

/** SHA3-256: H(x) */
export function sha3_256(input: Uint8Array): Uint8Array {
  const sponge = new KeccakSponge(1088, 0x06);
  sponge.absorb(input);
  return sponge.squeeze(32);
}

/** SHAKE256: J(x, outLen) */
export function shake256(input: Uint8Array, outLen: number): Uint8Array {
  const sponge = new KeccakSponge(1088, 0x1f);
  sponge.absorb(input);
  return sponge.squeeze(outLen);
}

/** SHAKE128: XOF Stream */
export function shake128Xof(seed: Uint8Array, i: number, j: number): KeccakSponge {
  const sponge = new KeccakSponge(1344, 0x1f);
  sponge.absorb(seed);
  sponge.absorb(new Uint8Array([i, j]));
  sponge.finalize();
  return sponge;
}
