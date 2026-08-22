import React from 'react';
import type { AlgorithmInfo } from '../algorithms/types';
import { hexToBytes, stringToBytes } from '../algorithms/utils';

interface CipherInputPanelProps {
  info: AlgorithmInfo;
  input: string;
  onInputChange: (val: string) => void;
  keyHex: string;
  onKeyHexChange: (val: string) => void;
  ivHex: string;
  onIvHexChange: (val: string) => void;
  aadHex: string;
  onAadHexChange: (val: string) => void;
  tagHex: string;
  onTagHexChange: (val: string) => void;
}

export default function CipherInputPanel({
  info,
  input,
  onInputChange,
  keyHex,
  onKeyHexChange,
  ivHex,
  onIvHexChange,
  aadHex,
  onAadHexChange,
  tagHex,
  onTagHexChange,
}: CipherInputPanelProps) {
  const isEncrypt = info.direction !== 'decrypt';
  const keySize = info.keySize || 128;
  const keyByteCount = keySize / 8;

  const generateRandomHex = (byteCount: number) => {
    const arr = new Uint8Array(byteCount);
    crypto.getRandomValues(arr);
    return Array.from(arr)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  };

  const loadStandardPreset = () => {
    if (keySize === 128) {
      onKeyHexChange('2b7e151628aed2a6abf7158809cf4f3c');
    } else if (keySize === 192) {
      onKeyHexChange('8e73b0f7da0e6452c810f32b809079e562f8ead2522c6b7b');
    } else {
      onKeyHexChange('603deb1015ca71be2b73aef0857d77811f352c073b6108d72d9810a30914dff4');
    }
    if (info.requiresIV) {
      onIvHexChange('000102030405060708090a0b0c0d0e0f');
    }
    if (info.requiresAAD) {
      onAadHexChange('feedfacedeadbeefcafebeeffeedfacedeadbeefcafebeef');
    }
  };

  return (
    <div className="flex flex-col space-y-2 font-mono">
      {/* 1. Main Message Buffer (Plaintext or Ciphertext) */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 ${isEncrypt ? 'bg-[#38bdf8]' : 'bg-[#e5a93b]'}`} />
            <label
              htmlFor="cipher-input"
              className={`text-[10px] font-bold uppercase tracking-wider ${
                isEncrypt ? 'text-[#38bdf8]' : 'text-[#e5a93b]'
              }`}
            >
              {isEncrypt ? 'BUFFER IN: PLAINTEXT STREAM' : 'BUFFER IN: CIPHERTEXT (HEX)'}
            </label>
          </div>
          <div className="flex gap-2 text-[10px] text-[#64748b] tabular-nums">
            <span>{input.length} CHARS</span>
            <span>·</span>
            <span>{input.length} BYTES</span>
          </div>
        </div>

        <input
          id="cipher-input"
          type="text"
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder={
            isEncrypt
              ? 'ENTER TEXT OR HEX STREAM TO ENCRYPT...'
              : 'ENTER HEX CIPHERTEXT TO DECRYPT (e.g. 3925841d02dc09fb...)...'
          }
          className={`h-9 w-full rounded-[2px] border bg-[#0c1017] px-3 font-mono text-xs text-[#f8fafc] placeholder-[#475569] focus:outline-none transition-colors tabular-nums ${
            isEncrypt
              ? 'border-[#1f2937] focus:border-[#38bdf8]'
              : 'border-[#e5a93b]/40 focus:border-[#e5a93b]'
          }`}
        />
      </div>

      {/* 2. Key & IV / Nonce Parameter Deck */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
        {/* Cipher Key Field */}
        <div className="rounded-[2px] border border-[#1f2937] bg-[#0c1017] p-2 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold uppercase tracking-wider text-[#e5a93b] flex items-center gap-1">
              <span className="h-1 w-1 bg-[#e5a93b]" />
              CIPHER KEY ({keySize}-BIT / {keyByteCount}B HEX)
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={loadStandardPreset}
                className="rounded-[2px] bg-[#1a1c24] px-1.5 py-0.2 text-[8px] text-[#94a3b8] hover:text-white border border-[#1f2937]"
                title="Load standard NIST test vector key"
              >
                NIST PRESET
              </button>
              <button
                type="button"
                onClick={() => onKeyHexChange(generateRandomHex(keyByteCount))}
                className="rounded-[2px] bg-[#1a1c24] px-1.5 py-0.2 text-[8px] text-[#38bdf8] hover:text-white border border-[#1f2937]"
                title="Generate random key"
              >
                RANDOM
              </button>
            </div>
          </div>
          <input
            type="text"
            value={keyHex}
            onChange={(e) => onKeyHexChange(e.target.value)}
            placeholder={`ENTER ${keyByteCount * 2} HEX DIGITS...`}
            className="h-7 w-full rounded-[2px] border border-[#1f2937] bg-[#090c10] px-2 font-mono text-[11px] text-[#e5a93b] focus:border-[#e5a93b] focus:outline-none tabular-nums"
          />
        </div>

        {/* IV / Nonce Field (if required) */}
        {info.requiresIV && (
          <div className="rounded-[2px] border border-[#1f2937] bg-[#0c1017] p-2 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase tracking-wider text-[#c084fc] flex items-center gap-1">
                <span className="h-1 w-1 bg-[#c084fc]" />
                INITIALIZATION VECTOR / NONCE (16B HEX)
              </span>
              <button
                type="button"
                onClick={() => onIvHexChange(generateRandomHex(16))}
                className="rounded-[2px] bg-[#1a1c24] px-1.5 py-0.2 text-[8px] text-[#c084fc] hover:text-white border border-[#1f2937]"
              >
                RANDOM IV
              </button>
            </div>
            <input
              type="text"
              value={ivHex}
              onChange={(e) => onIvHexChange(e.target.value)}
              placeholder="ENTER 32 HEX DIGITS (16 BYTES)..."
              className="h-7 w-full rounded-[2px] border border-[#1f2937] bg-[#090c10] px-2 font-mono text-[11px] text-[#c084fc] focus:border-[#c084fc] focus:outline-none tabular-nums"
            />
          </div>
        )}

        {/* AAD Field for GCM Mode */}
        {info.requiresAAD && (
          <div className="rounded-[2px] border border-[#1f2937] bg-[#0c1017] p-2 space-y-1 col-span-full">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase tracking-wider text-[#34d399] flex items-center gap-1">
                <span className="h-1 w-1 bg-[#34d399]" />
                ADDITIONAL AUTHENTICATED DATA (AAD HEX)
              </span>
              <span className="text-[8px] text-[#64748b]">AUTHENTICATED BUT NOT ENCRYPTED</span>
            </div>
            <input
              type="text"
              value={aadHex}
              onChange={(e) => onAadHexChange(e.target.value)}
              placeholder="ENTER HEX AAD (OPTIONAL)..."
              className="h-7 w-full rounded-[2px] border border-[#1f2937] bg-[#090c10] px-2 font-mono text-[11px] text-[#34d399] focus:border-[#34d399] focus:outline-none tabular-nums"
            />
          </div>
        )}
      </div>
    </div>
  );
}
