import React from 'react';
import type { ComputationStep } from '../../algorithms/types';

interface Props {
  step: ComputationStep;
}

/** Visualizes binary/hex transformations like padding, encoding, block splitting */
export default function BinaryTransformView({ step }: Props) {
  const data = step.data;

  // Input encoding step
  if (data.bytes !== undefined || (data.binary !== undefined && data.hex !== undefined)) {
    const rawHex = String(data.hex ?? '');
    const rawBinary = String(data.binary ?? '');
    const bitLen = data.bitLength !== undefined ? Number(data.bitLength) : 0;

    return (
      <div className="space-y-2.5 rounded-[2px] bg-[#0c1017] p-3 border border-[#1f2937] font-mono">
        <DataRow label="INPUT STREAM (ASCII/UTF-8)" value={String(data.input ?? '') || '(EMPTY STREAM)'} type="text" />
        <DataRow label="HEXADECIMAL BYTES" value={rawHex || '(0 BYTES)'} type="hex" />
        <DataRow label="BINARY BITSTREAM" value={rawBinary || '(0 BITS)'} type="binary" />
        <DataRow label="STREAM BIT LENGTH" value={`${bitLen} BITS (${Math.ceil(bitLen / 8)} BYTES)`} type="text" />
      </div>
    );
  }

  // Padding step
  if (data.paddedHex !== undefined || data.paddedBinary !== undefined) {
    return (
      <div className="space-y-2.5 rounded-[2px] bg-[#0c1017] p-3 border border-[#1f2937] font-mono">
        <DataRow label="ORIGINAL BIT LENGTH (L)" value={`${data.originalBits ?? 0} BITS`} type="text" />
        {data.paddingByte != null && (
          <DataRow label="PADDING DELIMITER (1-BIT + 7-ZEROS)" value={String(data.paddingByte)} type="binary" />
        )}
        <DataRow label="ZERO FILL BYTES (K)" value={`${data.zeroPaddingBytes ?? 0} BYTES (0x00)`} type="text" />
        {data.lengthField != null && (
          <DataRow label="LENGTH FIELD (64-BIT BIG-ENDIAN)" value={`0x${data.lengthField}`} type="hex" />
        )}
        <DataRow label="PADDED BUFFER" value={String(data.paddedHex ?? '')} type="hex" />
        <DataRow
          label="TOTAL BUFFER CAPACITY"
          value={`${data.totalBits ?? 0} BITS (${data.totalBlocks ?? 1} BLOCK${Number(data.totalBlocks) > 1 ? 'S' : ''} OF 512 BITS)`}
          type="text"
        />
      </div>
    );
  }

  // Message block step (words display)
  if (data.words && Array.isArray(data.words)) {
    return (
      <div className="space-y-2 rounded-[2px] bg-[#0c1017] p-3 border border-[#1f2937] font-mono">
        <div className="flex items-center justify-between pb-1 border-b border-[#1f2937]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#38bdf8]">
            512-BIT BLOCK BUFFER: 16 32-BIT WORDS
          </span>
          <span className="text-[9px] text-[#475569] uppercase">BIG-ENDIAN PARSE</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 tabular-nums">
          {(data.words as Array<{ index: number; hex: string; binary?: string }>).map(
            (word) => (
              <div
                key={word.index}
                className="flex items-center justify-between rounded-[2px] bg-[#0e131b] px-2.5 py-1 text-xs border border-[#1f2937]"
              >
                <span className="text-[10px] text-[#64748b] font-bold">
                  W[{word.index.toString().padStart(2, '0')}]
                </span>
                <span className="text-[#38bdf8] font-bold">0x{word.hex}</span>
                {word.binary && (
                  <span className="hidden xl:inline text-[#475569] text-[9px]">
                    {word.binary}
                  </span>
                )}
              </div>
            ),
          )}
        </div>
      </div>
    );
  }

  // Bit grouping step (Base64, Base32, Base16)
  if (data.bitGrouping) {
    return <BitGroupingView data={data.bitGrouping as any} />;
  }

  // Radix division step (Base58)
  if (data.radixDivision) {
    return <RadixDivisionView data={data.radixDivision as any} />;
  }

  // Character transform step (URL, UTF-8, UTF-16, Quoted-Printable)
  if (data.characterTransform) {
    return <CharacterTransformView data={data.characterTransform as any} />;
  }

  // Punycode step (RFC 3492)
  if (data.punycode) {
    return <PunycodeTransformView data={data.punycode as any} />;
  }

  // Morse code step (ITU-R M.1677-1)
  if (data.morse) {
    return <MorseTimelineView data={data.morse as any} />;
  }

  // JWT step (RFC 7519)
  if (data.jwt) {
    return <JwtTokenView data={data.jwt as any} />;
  }

  // Fallback
  return <FallbackDataView data={data} />;
}

function BitGroupingView({
  data,
}: {
  data: {
    encodingType: string;
    operation: 'encode' | 'decode';
    chunkIndex: number;
    totalChunks: number;
    inputChunkText: string;
    inputChunkHex: string;
    rawBitstream: string;
    groupBits: number;
    groups: Array<{
      bits: string;
      index: number;
      char: string;
      isPadding?: boolean;
    }>;
    outputBuffer: string;
    alphabet: string;
    padChars?: string;
  };
}) {
  return (
    <div className="space-y-3 rounded-[2px] bg-[#0c1017] p-3 border border-[#1f2937] font-mono">
      {/* Header */}
      <div className="flex items-center justify-between pb-1.5 border-b border-[#1f2937]">
        <div className="flex items-center gap-2">
          <span className="rounded-[2px] bg-[#152238] px-1.5 py-0.5 text-[9px] font-bold text-[#38bdf8] border border-[#38bdf8]/40 uppercase">
            {data.encodingType} {data.operation.toUpperCase()}
          </span>
          <span className="text-[10px] text-[#cbd5e1] font-semibold">
            {data.totalChunks > 0 ? `CHUNK ${data.chunkIndex} OF ${data.totalChunks}` : 'EMPTY STREAM'}
          </span>
        </div>
        <span className="text-[9px] text-[#64748b] uppercase">
          {data.groupBits}-BIT BITSTREAM REGROUPING
        </span>
      </div>

      {/* Input Chunk Data */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <DataRow label="CHUNK LITERAL" value={data.inputChunkText || '(EMPTY)'} type="text" />
        <DataRow label="CHUNK HEX" value={data.inputChunkHex || '0x00'} type="hex" />
        <DataRow label="RAW BITSTREAM" value={data.rawBitstream || '(EMPTY)'} type="binary" />
      </div>

      {/* Grouping Cards */}
      {data.groups.length > 0 && (
        <div className="space-y-1">
          <span className="text-[9px] font-bold uppercase tracking-wider text-[#64748b]">
            {data.groupBits}-BIT SLICE → ALPHABET LOOKUP
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-1.5 tabular-nums">
            {data.groups.map((grp, idx) => (
              <div
                key={idx}
                className={`flex flex-col items-center justify-center p-2 rounded-[2px] border ${
                  grp.isPadding
                    ? 'bg-[#121620] border-[#374151] opacity-60'
                    : 'bg-[#0e131b] border-[#1f2937]'
                }`}
              >
                <span className="text-[9px] text-[#64748b] font-bold">
                  {grp.isPadding ? 'PAD' : `IDX ${grp.index}`}
                </span>
                <span className="text-sm font-bold text-[#e5a93b] my-0.5 phosphor-amber">
                  {grp.char === ' ' ? '␣' : grp.char}
                </span>
                <span className="text-[8.5px] text-[#34d399] font-mono">
                  {grp.bits}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cumulative Output */}
      <DataRow
        label={`CUMULATIVE ${data.operation.toUpperCase()} OUTPUT`}
        value={data.outputBuffer || '(EMPTY BUFFER)'}
        type="text"
      />
    </div>
  );
}

function RadixDivisionView({
  data,
}: {
  data: {
    encodingType: string;
    operation: 'encode' | 'decode';
    dividendStr: string;
    divisor: number;
    quotientStr: string;
    remainder: number;
    mappedChar: string;
    leadingZerosCount: number;
    leadingZerosChars: string;
    digitStack: string[];
    outputBuffer: string;
    alphabet: string;
    iteration: number;
    totalIterations: number;
  };
}) {
  return (
    <div className="space-y-3 rounded-[2px] bg-[#0c1017] p-3 border border-[#1f2937] font-mono">
      {/* Header */}
      <div className="flex items-center justify-between pb-1.5 border-b border-[#1f2937]">
        <div className="flex items-center gap-2">
          <span className="rounded-[2px] bg-[#152238] px-1.5 py-0.5 text-[9px] font-bold text-[#38bdf8] border border-[#38bdf8]/40 uppercase">
            {data.encodingType} {data.operation.toUpperCase()}
          </span>
          <span className="text-[10px] text-[#cbd5e1] font-semibold">
            {data.iteration > 0 ? `ITERATION #${data.iteration}` : 'SETUP'}
          </span>
        </div>
        <span className="text-[9px] text-[#64748b] uppercase">
          ARBITRARY-PRECISION BIGINT RADIX-58
        </span>
      </div>

      {/* Leading Zero State */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <DataRow
          label="LEADING ZERO BYTES COUNT"
          value={`${data.leadingZerosCount} BYTE(S) → '${data.leadingZerosChars || '(NONE)'}'`}
          type="text"
        />
        <DataRow
          label="CURRENT REMAINDER / MAPPED CHAR"
          value={data.mappedChar ? `REMAINDER ${data.remainder} → '${data.mappedChar}'` : '(INITIALIZING)'}
          type="hex"
        />
      </div>

      {/* Arithmetic Equation */}
      {data.dividendStr && (
        <div className="space-y-1">
          <span className="text-[9px] font-bold uppercase tracking-wider text-[#64748b]">
            BIGINT STATE TRANSITION
          </span>
          <div className="rounded-[2px] bg-[#0e131b] p-2.5 text-[11px] text-[#cbd5e1] border border-[#1f2937] break-all leading-relaxed tabular-nums">
            <span className="text-[#38bdf8]">{data.dividendStr}</span>
            <span className="text-[#94a3b8]"> {data.operation === 'encode' ? '÷ 58 =' : '× 58 +'} </span>
            <span className="text-[#34d399]">{data.quotientStr}</span>
            {data.operation === 'encode' && (
              <span className="text-[#e5a93b]"> (REM: {data.remainder} → '{data.mappedChar}')</span>
            )}
          </div>
        </div>
      )}

      {/* Digit Stack */}
      {data.digitStack.length > 0 && (
        <div className="space-y-1">
          <span className="text-[9px] font-bold uppercase tracking-wider text-[#64748b]">
            BASE58 DIGIT STACK ({data.operation === 'encode' ? 'REVERSE ASSEMBLY' : 'ACCUMULATION'})
          </span>
          <div className="flex flex-wrap gap-1 p-2 rounded-[2px] bg-[#0e131b] border border-[#1f2937] text-xs">
            {data.digitStack.map((d, idx) => (
              <span
                key={idx}
                className="px-1.5 py-0.5 rounded-[2px] bg-[#152238] text-[#38bdf8] border border-[#38bdf8]/30 font-bold"
              >
                {d}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Output Buffer */}
      <DataRow
        label={`CUMULATIVE BASE58 ${data.operation.toUpperCase()} STRING`}
        value={data.outputBuffer || '(EMPTY)'}
        type="text"
      />
    </div>
  );
}

function CharacterTransformView({
  data,
}: {
  data: {
    encodingType: 'URL' | 'UTF-8' | 'UTF-16';
    operation: 'encode' | 'decode';
    char: string;
    codePoint: string;
    codePointDecimal: number;
    unicodePlane?: string;
    template?: string;
    bitDistribution?: Array<{ label: string; bits: string }>;
    outputBytesHex: string;
    outputBytesBinary?: string;
    cumulativeOutput: string;
    isUnreserved?: boolean;
    charIndex: number;
    totalChars: number;
  };
}) {
  return (
    <div className="space-y-3 rounded-[2px] bg-[#0c1017] p-3 border border-[#1f2937] font-mono">
      {/* Header */}
      <div className="flex items-center justify-between pb-1.5 border-b border-[#1f2937]">
        <div className="flex items-center gap-2">
          <span className="rounded-[2px] bg-[#152238] px-1.5 py-0.5 text-[9px] font-bold text-[#38bdf8] border border-[#38bdf8]/40 uppercase">
            {data.encodingType} {data.operation.toUpperCase()}
          </span>
          <span className="text-[10px] text-[#cbd5e1] font-semibold">
            CHAR {data.charIndex} OF {data.totalChars}
          </span>
        </div>
        {data.unicodePlane && (
          <span className="text-[9px] text-[#64748b] uppercase">
            {data.unicodePlane}
          </span>
        )}
      </div>

      {/* Character Inspection Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div className="flex items-center gap-3 rounded-[2px] bg-[#0e131b] p-2 border border-[#1f2937]">
          <div className="flex items-center justify-center w-10 h-10 rounded-[2px] bg-[#152238] border border-[#38bdf8]/40 text-lg font-bold text-[#38bdf8]">
            {data.char === ' ' ? '␣' : data.char}
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] text-[#64748b] font-bold">CODE POINT</span>
            <span className="text-xs text-[#e5a93b] font-bold phosphor-amber">
              {data.codePoint}
            </span>
            <span className="text-[8.5px] text-[#475569]">
              DEC: {data.codePointDecimal}
            </span>
          </div>
        </div>

        <DataRow
          label="OUTPUT HEX BYTES"
          value={data.outputBytesHex || '0x00'}
          type="hex"
        />

        {data.template ? (
          <DataRow label="BIT PATTERN TEMPLATE" value={data.template} type="binary" />
        ) : (
          <DataRow
            label="STATUS"
            value={data.isUnreserved ? 'UNRESERVED (PASS-THROUGH)' : 'SPECIAL / RESERVED'}
            type="text"
          />
        )}
      </div>

      {/* Bit Distribution Rows (if present for UTF-8) */}
      {data.bitDistribution && data.bitDistribution.length > 0 && (
        <div className="space-y-1">
          <span className="text-[9px] font-bold uppercase tracking-wider text-[#64748b]">
            UTF-8 BIT ALLOCATION BREAKDOWN
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-1.5">
            {data.bitDistribution.map((bd, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-1.5 rounded-[2px] bg-[#0e131b] border border-[#1f2937]"
              >
                <span className="text-[9px] text-[#64748b] font-bold">{bd.label}</span>
                <span className="text-[10px] text-[#34d399] font-mono">{bd.bits}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cumulative Output */}
      <DataRow
        label={`CUMULATIVE ${data.encodingType} OUTPUT`}
        value={data.cumulativeOutput || '(EMPTY)'}
        type="text"
      />
    </div>
  );
}

function PunycodeTransformView({
  data,
}: {
  data: {
    encodingType: 'Punycode';
    operation: 'encode' | 'decode';
    activeChar?: string;
    activeCodePoint?: number;
    bias: number;
    delta: number;
    n: number;
    basicString: string;
    nonBasicChars: string[];
    accumulatedOutput: string;
    phaseName: string;
  };
}) {
  return (
    <div className="space-y-3 rounded-[2px] bg-[#0c1017] p-3 border border-[#1f2937] font-mono">
      {/* Header */}
      <div className="flex items-center justify-between pb-1.5 border-b border-[#1f2937]">
        <div className="flex items-center gap-2">
          <span className="rounded-[2px] bg-[#152238] px-1.5 py-0.5 text-[9px] font-bold text-[#38bdf8] border border-[#38bdf8]/40 uppercase">
            {data.encodingType} {data.operation.toUpperCase()}
          </span>
          <span className="text-[10px] text-[#cbd5e1] font-semibold">
            {data.phaseName}
          </span>
        </div>
        <span className="text-[9px] text-[#64748b] uppercase">
          RFC 3492 BOOTSTRING IDNA
        </span>
      </div>

      {/* State & Parameters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 tabular-nums">
        <div className="flex flex-col p-2 rounded-[2px] bg-[#0e131b] border border-[#1f2937]">
          <span className="text-[9px] text-[#64748b] font-bold">STATE N (CODEPOINT)</span>
          <span className="text-xs text-[#38bdf8] font-bold">
            {data.n} (0x{data.n.toString(16).toUpperCase()})
          </span>
        </div>
        <div className="flex flex-col p-2 rounded-[2px] bg-[#0e131b] border border-[#1f2937]">
          <span className="text-[9px] text-[#64748b] font-bold">DELTA (WEIGHT)</span>
          <span className="text-xs text-[#34d399] font-bold">{data.delta}</span>
        </div>
        <div className="flex flex-col p-2 rounded-[2px] bg-[#0e131b] border border-[#1f2937]">
          <span className="text-[9px] text-[#64748b] font-bold">ADAPTED BIAS</span>
          <span className="text-xs text-[#e5a93b] font-bold phosphor-amber">{data.bias}</span>
        </div>
        <div className="flex flex-col p-2 rounded-[2px] bg-[#0e131b] border border-[#1f2937]">
          <span className="text-[9px] text-[#64748b] font-bold">ACTIVE GLYPH</span>
          <span className="text-xs text-[#f8fafc] font-bold">
            {data.activeChar ? `'${data.activeChar}' (U+${data.activeCodePoint?.toString(16).toUpperCase()})` : '(BASIC SETUP)'}
          </span>
        </div>
      </div>

      {/* Basic Prefix & Non-Basic Set */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <DataRow
          label="BASIC ASCII PREFIX (LITERALS)"
          value={data.basicString || '(NONE)'}
          type="text"
        />
        <DataRow
          label="NON-ASCII CODE POINT POOL"
          value={data.nonBasicChars?.length > 0 ? data.nonBasicChars.join(' ') : '(NONE)'}
          type="hex"
        />
      </div>

      {/* Cumulative Output */}
      <DataRow
        label={`CUMULATIVE ${data.operation.toUpperCase()} OUTPUT`}
        value={data.accumulatedOutput || '(EMPTY)'}
        type="text"
      />
    </div>
  );
}

function MorseTimelineView({
  data,
}: {
  data: {
    encodingType: 'Morse';
    operation: 'encode' | 'decode';
    char: string;
    morsePattern: string;
    elements: Array<{ symbol: '.' | '-' | 'gap' | 'word-gap'; label: string; durationUnits: number }>;
    accumulatedOutput: string;
    charIndex: number;
    totalChars: number;
  };
}) {
  return (
    <div className="space-y-3 rounded-[2px] bg-[#0c1017] p-3 border border-[#1f2937] font-mono">
      {/* Header */}
      <div className="flex items-center justify-between pb-1.5 border-b border-[#1f2937]">
        <div className="flex items-center gap-2">
          <span className="rounded-[2px] bg-[#152238] px-1.5 py-0.5 text-[9px] font-bold text-[#38bdf8] border border-[#38bdf8]/40 uppercase">
            {data.encodingType} {data.operation.toUpperCase()}
          </span>
          <span className="text-[10px] text-[#cbd5e1] font-semibold">
            CHAR #{data.charIndex} OF {data.totalChars}
          </span>
        </div>
        <span className="text-[9px] text-[#64748b] uppercase">
          ITU-R M.1677-1 INTERNATIONAL MORSE
        </span>
      </div>

      {/* Character Inspection & Pattern */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="flex items-center gap-3 rounded-[2px] bg-[#0e131b] p-2 border border-[#1f2937]">
          <div className="flex items-center justify-center w-10 h-10 rounded-[2px] bg-[#152238] border border-[#38bdf8]/40 text-lg font-bold text-[#38bdf8]">
            {data.char}
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] text-[#64748b] font-bold">ACTIVE CHARACTER</span>
            <span className="text-sm text-[#e5a93b] font-bold phosphor-amber">
              {data.morsePattern}
            </span>
          </div>
        </div>

        <DataRow
          label="TIMING & MODULATION"
          value={data.elements.map((e) => `${e.label} (${e.durationUnits}u)`).join(' + ') || '(SPACE)'}
          type="text"
        />
      </div>

      {/* Visual Timeline Ribbon */}
      <div className="space-y-1">
        <span className="text-[9px] font-bold uppercase tracking-wider text-[#64748b]">
          ACOUSTIC / OPTICAL PULSE TIMELINE
        </span>
        <div className="flex items-center gap-1.5 p-3 rounded-[2px] bg-[#0e131b] border border-[#1f2937] overflow-x-auto">
          {data.elements.map((elem, idx) => (
            <div key={idx} className="flex flex-col items-center gap-1">
              <div
                className={`h-6 rounded-[1px] border flex items-center justify-center ${
                  elem.symbol === '.'
                    ? 'w-6 bg-[#e5a93b]/20 border-[#e5a93b] text-[#e5a93b]'
                    : elem.symbol === '-'
                      ? 'w-16 bg-[#38bdf8]/20 border-[#38bdf8] text-[#38bdf8]'
                      : 'w-4 bg-transparent border-dashed border-[#374151]'
                }`}
              >
                <span className="text-xs font-bold">{elem.symbol}</span>
              </div>
              <span className="text-[8px] text-[#64748b]">{elem.durationUnits}u</span>
            </div>
          ))}
        </div>
      </div>

      {/* Cumulative Output */}
      <DataRow
        label={`CUMULATIVE ${data.operation.toUpperCase()} STREAM`}
        value={data.accumulatedOutput || '(EMPTY)'}
        type="text"
      />
    </div>
  );
}

function JwtTokenView({
  data,
}: {
  data: {
    encodingType: 'JWT';
    operation: 'encode' | 'decode';
    headerJson: string;
    headerB64: string;
    payloadJson: string;
    payloadB64: string;
    signatureB64: string;
    algorithm: string;
    secretKey: string;
    signingInput: string;
    computedSignatureB64?: string;
    isSignatureValid?: boolean;
  };
}) {
  return (
    <div className="space-y-3 rounded-[2px] bg-[#0c1017] p-3 border border-[#1f2937] font-mono">
      {/* Header */}
      <div className="flex items-center justify-between pb-1.5 border-b border-[#1f2937]">
        <div className="flex items-center gap-2">
          <span className="rounded-[2px] bg-[#152238] px-1.5 py-0.5 text-[9px] font-bold text-[#38bdf8] border border-[#38bdf8]/40 uppercase">
            {data.encodingType} {data.algorithm} {data.operation.toUpperCase()}
          </span>
          {data.isSignatureValid !== undefined && (
            <span
              className={`rounded-[2px] px-1.5 py-0.5 text-[9px] font-bold border uppercase ${
                data.isSignatureValid
                  ? 'bg-[#0f291e] text-[#34d399] border-[#34d399]/40'
                  : 'bg-[#2a1318] text-[#f87171] border-[#f87171]/40'
              }`}
            >
              {data.isSignatureValid ? 'SIGNATURE VALID (MATCH)' : 'SIGNATURE MISMATCH'}
            </span>
          )}
        </div>
        <span className="text-[9px] text-[#64748b] uppercase">RFC 7519 STRUCTURED TOKEN</span>
      </div>

      {/* 3 Color-Coded Segments */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {/* Segment 1: Header */}
        <div className="space-y-1 p-2 rounded-[2px] bg-[#0e141f] border border-[#38bdf8]/30">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold uppercase tracking-wider text-[#38bdf8]">
              1. HEADER (BASE64URL)
            </span>
            <span className="text-[8px] text-[#64748b]">{data.algorithm}</span>
          </div>
          <div className="text-[10px] text-[#38bdf8] font-bold break-all bg-[#090c10] p-1.5 rounded-[2px] border border-[#1f2937]">
            {data.headerB64 || '(EMPTY)'}
          </div>
          <div className="text-[9.5px] text-[#94a3b8] break-all bg-[#090c10] p-1.5 rounded-[2px] border border-[#1f2937]">
            {data.headerJson}
          </div>
        </div>

        {/* Segment 2: Payload */}
        <div className="space-y-1 p-2 rounded-[2px] bg-[#171224] border border-[#c084fc]/30">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold uppercase tracking-wider text-[#c084fc]">
              2. PAYLOAD (CLAIMS)
            </span>
            <span className="text-[8px] text-[#64748b]">JSON</span>
          </div>
          <div className="text-[10px] text-[#c084fc] font-bold break-all bg-[#090c10] p-1.5 rounded-[2px] border border-[#1f2937]">
            {data.payloadB64 || '(EMPTY)'}
          </div>
          <div className="text-[9.5px] text-[#94a3b8] break-all bg-[#090c10] p-1.5 rounded-[2px] border border-[#1f2937]">
            {data.payloadJson}
          </div>
        </div>

        {/* Segment 3: Signature */}
        <div
          className={`space-y-1 p-2 rounded-[2px] border ${
            data.isSignatureValid
              ? 'bg-[#0c1813] border-[#34d399]/30'
              : 'bg-[#1c140d] border-[#e5a93b]/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-[9px] font-bold uppercase tracking-wider ${
                data.isSignatureValid ? 'text-[#34d399]' : 'text-[#e5a93b]'
              }`}
            >
              3. SIGNATURE (HMAC)
            </span>
            <span className="text-[8px] text-[#64748b]">MAC</span>
          </div>
          <div
            className={`text-[10px] font-bold break-all bg-[#090c10] p-1.5 rounded-[2px] border border-[#1f2937] ${
              data.isSignatureValid ? 'text-[#34d399]' : 'text-[#e5a93b]'
            }`}
          >
            {data.signatureB64 || '(NONE)'}
          </div>
          {data.computedSignatureB64 && (
            <div className="text-[8.5px] text-[#64748b]">
              RECOMPUTED: <span className="text-[#34d399]">{data.computedSignatureB64}</span>
            </div>
          )}
        </div>
      </div>

      {/* Secret Key & Signing Input */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <DataRow
          label="SIGNING INPUT (HEADER.PAYLOAD)"
          value={data.signingInput || '(NONE)'}
          type="text"
        />
        <DataRow
          label="HMAC SHARED SECRET KEY"
          value={data.secretKey ? `"${data.secretKey}"` : '(DEFAULT)'}
          type="hex"
        />
      </div>
    </div>
  );
}

function DataRow({
  label,
  value,
  type,
}: {
  label: string;
  value: string;
  type: 'hex' | 'binary' | 'text';
}) {
  const colorClass =
    type === 'hex'
      ? 'text-[#38bdf8] bg-[#0e141f] border-[#38bdf8]/30'
      : type === 'binary'
        ? 'text-[#34d399] bg-[#0c1813] border-[#34d399]/30'
        : 'text-[#f8fafc] bg-[#0e131b] border-[#1f2937]';

  return (
    <div className="space-y-0.5">
      <span className="text-[9px] font-bold uppercase tracking-wider text-[#64748b]">
        {label}
      </span>
      <div
        className={`rounded-[2px] border px-2.5 py-1 text-xs break-all leading-relaxed tabular-nums select-all ${colorClass}`}
      >
        {value}
      </div>
    </div>
  );
}

function FallbackDataView({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="space-y-1.5 rounded-[2px] bg-[#0c1017] p-3 border border-[#1f2937] font-mono">
      {Object.entries(data).map(([key, value]) => (
        <div key={key} className="space-y-0.5">
          <span className="text-[9px] font-bold uppercase tracking-wider text-[#64748b]">
            {key.replace(/([A-Z])/g, ' $1').trim()}
          </span>
          <div className="rounded-[2px] bg-[#0e131b] p-1.5 text-xs text-[#cbd5e1] break-all border border-[#1f2937] tabular-nums">
            {typeof value === 'object' && value !== null
              ? Array.isArray(value)
                ? `${value.length} items`
                : Object.entries(value).map(([k, v]) => `${k}: ${String(v)}`).join(' | ')
              : String(value)}
          </div>
        </div>
      ))}
    </div>
  );
}
