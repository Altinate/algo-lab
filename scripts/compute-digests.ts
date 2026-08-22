import keccak224 from '../src/algorithms/keccak-224';
import keccak384 from '../src/algorithms/keccak-384';
import keccak512 from '../src/algorithms/keccak-512';
import sha3_224 from '../src/algorithms/sha3-224';
import sha3_256 from '../src/algorithms/sha3-256';
import sha512_224 from '../src/algorithms/sha512-224';
import sha512_256 from '../src/algorithms/sha512-256';

const tests: Array<[string, { compute: (s: string) => { digest: string } }, string]> = [
  ['Keccak-224', keccak224, ''],
  ['Keccak-224', keccak224, 'abc'],
  ['SHA3-224',   sha3_224,  ''],
  ['SHA3-224',   sha3_224,  'abc'],
  ['Keccak-384', keccak384, ''],
  ['Keccak-384', keccak384, 'abc'],
  ['Keccak-512', keccak512, ''],
  ['Keccak-512', keccak512, 'abc'],
  ['SHA3-256',   sha3_256,  ''],
  ['SHA3-256',   sha3_256,  'abc'],
  ['SHA-512/224', sha512_224, ''],
  ['SHA-512/224', sha512_224, 'abc'],
  ['SHA-512/256', sha512_256, ''],
  ['SHA-512/256', sha512_256, 'abc'],
];

for (const [name, alg, input] of tests) {
  const { digest } = alg.compute(input);
  console.log(`${name}(${JSON.stringify(input)}) = ${digest}`);
}
