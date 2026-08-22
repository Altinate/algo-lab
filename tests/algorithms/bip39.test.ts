import { describe, it, expect } from 'vitest';
import { bip39Plugin, computeBip39 } from '../../src/algorithms/tools/bip39';

describe('BIP-39 (Mnemonic & Seed Generator)', () => {
  it('should have correct algorithm metadata', () => {
    expect(bip39Plugin.info.name).toBe('BIP-39');
    expect(bip39Plugin.info.category).toBe('tools');
    expect(bip39Plugin.info.family).toBe('Wallet / Mnemonic Generation');
    expect(bip39Plugin.info.security).toBe('secure');
  });

  describe('Official Trezor / Bitcoin Reference Test Vectors', () => {
    it('computes 128-bit zero entropy vector correctly (12 words + seed with TREZOR)', () => {
      const res = computeBip39('00000000000000000000000000000000', 'TREZOR', 12);
      const mnemonicStep = res.steps.find((s) => s.id === 'bip39-mnemonic-phrase');
      expect((mnemonicStep?.data as any)?.bip39?.mnemonicPhrase).toBe(
        'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
      );
      expect(res.digest).toBe(
        'c55257c360c07c72029aebc1b53c05ed0362ada38ead3e3e9efa3708e53495531f09a6987599d18264c1e1c92f2cf141630c7a3c4ab7c81b2f001698e7463b04'
      );
    });

    it('computes 128-bit 0x7f entropy vector correctly (12 words + seed with TREZOR)', () => {
      const res = computeBip39('7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f', 'TREZOR', 12);
      const mnemonicStep = res.steps.find((s) => s.id === 'bip39-mnemonic-phrase');
      expect((mnemonicStep?.data as any)?.bip39?.mnemonicPhrase).toBe(
        'legal winner thank year wave sausage worth useful legal winner thank yellow'
      );
      expect(res.digest).toBe(
        '2e8905819b8723fe2c1d161860e5ee1830318dbf49a83bd451cfb8440c28bd6fa457fe1296106559a3c80937a1c1069be3a3a5bd381ee6260e8d9739fce1f607'
      );
    });

    it('computes 256-bit 0xff entropy vector correctly (24 words + seed with TREZOR)', () => {
      const res = computeBip39('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', 'TREZOR', 24);
      const mnemonicStep = res.steps.find((s) => s.id === 'bip39-mnemonic-phrase');
      expect((mnemonicStep?.data as any)?.bip39?.mnemonicPhrase).toBe(
        'zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo vote'
      );
      expect(res.digest).toBe(
        'dd48c104698c30cfe2b6142103248622fb7bb0ff692eebb00089b32d22484e1613912f0a5b694407be899ffd31ed3992c456cdf60f5d4564b8ba3f05a69890ad'
      );
    });
  });

  describe('Plugin Input Processing & Telemetry', () => {
    it('handles JSON string inputs with custom parameters', () => {
      const jsonInput = JSON.stringify({
        entropy: '00000000000000000000000000000000',
        passphrase: 'TREZOR',
        wordCount: 12,
      });
      const res = bip39Plugin.compute(jsonInput);
      expect(res.digest).toBe(
        'c55257c360c07c72029aebc1b53c05ed0362ada38ead3e3e9efa3708e53495531f09a6987599d18264c1e1c92f2cf141630c7a3c4ab7c81b2f001698e7463b04'
      );
    });

    it('generates rich memory telemetry steps including entropy, checksum, word mapping, and seed derivation', () => {
      const res = bip39Plugin.compute('', { wordCount: 12 });
      const entropyStep = res.steps.find((s) => s.id === 'bip39-entropy');
      const checksumStep = res.steps.find((s) => s.id === 'bip39-checksum');
      const wordMappingStep = res.steps.find((s) => s.id === 'bip39-word-mapping');
      const mnemonicStep = res.steps.find((s) => s.id === 'bip39-mnemonic-phrase');
      const completeStep = res.steps.find((s) => s.id === 'bip39-seed-complete');

      expect(entropyStep).toBeDefined();
      expect(checksumStep).toBeDefined();
      expect(wordMappingStep).toBeDefined();
      expect(mnemonicStep).toBeDefined();
      expect(completeStep).toBeDefined();
    });
  });
});
