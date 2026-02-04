import { base91Decode, base91Encode, base91Alphabet } from './base91';

export type ImageStringCodecDecoded = {
  version: number;
  mime: string;
  bytes: Uint8Array;
};

// Versions
export const VERSION_BASE91 = 1;
export const VERSION_BASE32K = 2;
export const VERSION_GZIP_BASE32K = 3;
export const VERSION_AUTO = 4;

export const CODEC_PREFIX = 'IMG#';

const MIME_BY_ID: Record<number, string> = {
  0: 'image/png',
  1: 'image/jpeg',
  2: 'image/webp',
  3: 'image/gif',
};

const ID_BY_MIME: Record<string, number> = Object.fromEntries(
  Object.entries(MIME_BY_ID).map(([id, mime]) => [mime, Number(id)])
) as Record<string, number>;

// Base32k Constants
// Start at CJK Unified Ideographs block
const B32K_OFFSET = 0x4E00; 
const B32K_SIZE = 32768; // 15 bits
const ENCODING_TAG_BASE32K = 'K';
const ENCODING_TAG_BASE63K = 'U';
const ENCODING_TAG_BASE91 = '9';

const COMPRESSION_TAG_NONE = 'N';
const COMPRESSION_TAG_GZIP = 'G';
const COMPRESSION_TAG_DEFLATE = 'D';
const COMPRESSION_TAG_DEFLATE_RAW = 'R';
const COMPRESSION_TAG_BROTLI = 'B';
const COMPRESSION_TAG_ZSTD = 'Z';

const TAG_SEPARATOR = '#';

/**
 * Encodes a Uint8Array into a Base32k string (15 bits per character).
 * Maps 15-bit chunks to CJK characters starting at U+4E00.
 */
function base32kEncode(bytes: Uint8Array): string {
  if (bytes.length === 0) return '';
  
  let out = '';
  let buffer = 0;
  let bits = 0;

  for (let i = 0; i < bytes.length; i++) {
    buffer = (buffer << 8) | bytes[i];
    bits += 8;

    while (bits >= 15) {
      bits -= 15;
      const val = (buffer >> bits) & 0x7FFF; // 15 bits mask
      out += String.fromCharCode(B32K_OFFSET + val);
    }
  }

  // Handle remaining bits (padding)
  if (bits > 0) {
    const val = (buffer << (15 - bits)) & 0x7FFF;
    out += String.fromCharCode(B32K_OFFSET + val);
  }
  return out;
}

/**
 * Decodes a Base32k string back to Uint8Array.
 */
function base32kDecode(input: string): Uint8Array {
  if (input.length === 0) return new Uint8Array(0);

  // Estimate size: 15 bits per char / 8 bits per byte = 1.875 bytes per char
  const estimatedSize = Math.ceil(input.length * 15 / 8);
  const out = new Uint8Array(estimatedSize);
  let outOffset = 0;

  let buffer = 0;
  let bits = 0;

  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i);
    const val = code - B32K_OFFSET;
    
    // Simple validation (though we assume valid input for extreme speed)
    // if (val < 0 || val >= B32K_SIZE) continue; 

    buffer = (buffer << 15) | val;
    bits += 15;

    while (bits >= 8) {
      bits -= 8;
      out[outOffset++] = (buffer >> bits) & 0xFF;
    }
  }

  return out.slice(0, outOffset);
}

const B63K_RANGE1_START = 0x0100;
const B63K_RANGE1_END = 0xD7FF;
const B63K_RANGE2_START = 0xE000;
const B63K_RANGE2_END = 0xFFFD;
const B63K_RANGE1_LEN = B63K_RANGE1_END - B63K_RANGE1_START + 1;
const B63K_RANGE2_LEN = B63K_RANGE2_END - B63K_RANGE2_START + 1;
const B63K_BASE = B63K_RANGE1_LEN + B63K_RANGE2_LEN;

function base63kValToCharCode(val: number): number {
  if (val < 0 || val >= B63K_BASE) throw new Error('Base63k: out of range');
  if (val < B63K_RANGE1_LEN) return B63K_RANGE1_START + val;
  return B63K_RANGE2_START + (val - B63K_RANGE1_LEN);
}

function base63kCharCodeToVal(code: number): number {
  if (code >= B63K_RANGE1_START && code <= B63K_RANGE1_END) return code - B63K_RANGE1_START;
  if (code >= B63K_RANGE2_START && code <= B63K_RANGE2_END) return B63K_RANGE1_LEN + (code - B63K_RANGE2_START);
  throw new Error(`Base63k: invalid character code ${code}`);
}

function base63kEncode(bytes: Uint8Array): string {
  if (bytes.length === 0) return '';

  let leadingZeros = 0;
  while (leadingZeros < bytes.length && bytes[leadingZeros] === 0) leadingZeros++;

  const digits: number[] = [0];

  for (let i = leadingZeros; i < bytes.length; i++) {
    let carry = bytes[i];
    for (let j = 0; j < digits.length; j++) {
      const value = digits[j] * 256 + carry;
      digits[j] = value % B63K_BASE;
      carry = Math.floor(value / B63K_BASE);
    }
    while (carry > 0) {
      digits.push(carry % B63K_BASE);
      carry = Math.floor(carry / B63K_BASE);
    }
  }

  let out = '';
  for (let i = 0; i < leadingZeros; i++) out += String.fromCharCode(base63kValToCharCode(0));
  for (let i = digits.length - 1; i >= 0; i--) out += String.fromCharCode(base63kValToCharCode(digits[i]));
  return out;
}

function base63kDecode(input: string): Uint8Array {
  if (input.length === 0) return new Uint8Array(0);

  let leadingZeros = 0;
  while (leadingZeros < input.length) {
    const val = base63kCharCodeToVal(input.charCodeAt(leadingZeros));
    if (val !== 0) break;
    leadingZeros++;
  }

  const bytes: number[] = [0];
  for (let i = leadingZeros; i < input.length; i++) {
    const digit = base63kCharCodeToVal(input.charCodeAt(i));
    let carry = digit;
    for (let j = 0; j < bytes.length; j++) {
      const value = bytes[j] * B63K_BASE + carry;
      bytes[j] = value & 0xFF;
      carry = value >>> 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xFF);
      carry >>>= 8;
    }
  }

  for (let i = 0; i < leadingZeros; i++) bytes.push(0);
  bytes.reverse();
  return new Uint8Array(bytes);
}

// RLE Constants for Base91
const B91_CHARS = base91Alphabet();
const RLE_QUOTE = '"';
const MIN_RLE_LEN = 4;
const MAX_RLE_CHUNK = B91_CHARS.length + MIN_RLE_LEN - 1;

function rleEncode(input: string): string {
  if (!input) return '';
  let out = '';
  let prev = input[0];
  let count = 1;

  for (let i = 1; i < input.length; i++) {
    const curr = input[i];
    if (curr === prev) {
      count++;
    } else {
      out += flushRLE(prev, count);
      prev = curr;
      count = 1;
    }
  }
  out += flushRLE(prev, count);
  return out;
}

function flushRLE(char: string, count: number): string {
  let res = '';
  while (count >= MIN_RLE_LEN) {
    const chunk = Math.min(count, MAX_RLE_CHUNK);
    const countIndex = chunk - MIN_RLE_LEN;
    res += char + RLE_QUOTE + B91_CHARS[countIndex];
    count -= chunk;
  }
  for (let k = 0; k < count; k++) res += char;
  return res;
}

function rleDecode(input: string): string {
  if (input.indexOf(RLE_QUOTE) === -1) return input;
  let out = '';
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (i + 2 < input.length && input[i + 1] === RLE_QUOTE) {
      const countChar = input[i + 2];
      const countIndex = B91_CHARS.indexOf(countChar);
      if (countIndex !== -1) {
        const repeatCount = countIndex + MIN_RLE_LEN;
        out += c.repeat(repeatCount);
        i += 2; 
        continue;
      }
    }
    out += c;
  }
  return out;
}

async function compressWithFormat(format: string, data: Uint8Array): Promise<Uint8Array> {
  type CompressionStreamFormat = ConstructorParameters<typeof CompressionStream>[0];
  const stream = new CompressionStream(format as unknown as CompressionStreamFormat);
  const writer = stream.writable.getWriter();
  writer.write(new Uint8Array(data));
  writer.close();
  return new Response(stream.readable).arrayBuffer().then(b => new Uint8Array(b));
}

async function decompressWithFormat(format: string, data: Uint8Array): Promise<Uint8Array> {
  type DecompressionStreamFormat = ConstructorParameters<typeof DecompressionStream>[0];
  const stream = new DecompressionStream(format as unknown as DecompressionStreamFormat);
  const writer = stream.writable.getWriter();
  writer.write(new Uint8Array(data));
  writer.close();
  return new Response(stream.readable).arrayBuffer().then(b => new Uint8Array(b));
}

function buildPacket(input: { bytes: Uint8Array; mime: string }, version: number): Uint8Array {
  const mimeId = ID_BY_MIME[input.mime];

  let header: Uint8Array;
  if (mimeId === undefined) {
    const mimeBytes = new TextEncoder().encode(input.mime);
    if (mimeBytes.length > 255) {
      throw new Error('MIME too long');
    }
    header = new Uint8Array(3 + mimeBytes.length);
    header[0] = version;
    header[1] = 255;
    header[2] = mimeBytes.length;
    header.set(mimeBytes, 3);
  } else {
    header = new Uint8Array(2);
    header[0] = version;
    header[1] = mimeId;
  }

  const merged = new Uint8Array(header.length + input.bytes.length);
  merged.set(header, 0);
  merged.set(input.bytes, header.length);
  return merged;
}

function parseHeader(input: string): { payload: string; tagged: boolean; encodingTag?: string; compressionTag?: string } {
  if (!input.startsWith(CODEC_PREFIX)) return { payload: input, tagged: false };

  const base = input.slice(CODEC_PREFIX.length);
  if (base.length >= 3 && base[2] === TAG_SEPARATOR) {
    return {
      payload: base.slice(3),
      tagged: true,
      encodingTag: base[0],
      compressionTag: base[1],
    };
  }
  return { payload: base, tagged: false };
}

function buildTaggedPrefix(encodingTag: string, compressionTag: string): string {
  return CODEC_PREFIX + encodingTag + compressionTag + TAG_SEPARATOR;
}

function decodePayloadToBytes(payload: string, encodingTag: string | undefined): Uint8Array {
  if (encodingTag === ENCODING_TAG_BASE32K) return base32kDecode(payload);
  if (encodingTag === ENCODING_TAG_BASE63K) return base63kDecode(payload);
  if (encodingTag === ENCODING_TAG_BASE91) return base91Decode(rleDecode(payload), { ignoreWhitespace: true });

  if (payload.length > 0 && payload.charCodeAt(0) >= 0x4E00) return base32kDecode(payload);
  return base91Decode(rleDecode(payload), { ignoreWhitespace: true });
}

function encodeBytesToPayload(bytes: Uint8Array, encodingTag: string): string {
  if (encodingTag === ENCODING_TAG_BASE32K) return base32kEncode(bytes);
  if (encodingTag === ENCODING_TAG_BASE63K) return base63kEncode(bytes);
  if (encodingTag === ENCODING_TAG_BASE91) return rleEncode(base91Encode(bytes));
  throw new Error(`Unknown encoding tag: ${encodingTag}`);
}

async function compressBest(bytes: Uint8Array): Promise<{ tag: string; format: string | null; bytes: Uint8Array }> {
  let best = { tag: COMPRESSION_TAG_NONE, format: null as string | null, bytes };

  const candidates: Array<{ tag: string; format: string }> = [];
  if (bytes.length >= 1024) {
    candidates.push(
      { tag: COMPRESSION_TAG_ZSTD, format: 'zstd' },
      { tag: COMPRESSION_TAG_BROTLI, format: 'br' }
    );
  }
  candidates.push(
    { tag: COMPRESSION_TAG_DEFLATE_RAW, format: 'deflate-raw' },
    { tag: COMPRESSION_TAG_DEFLATE, format: 'deflate' },
    { tag: COMPRESSION_TAG_GZIP, format: 'gzip' }
  );

  for (const c of candidates) {
    let compressed: Uint8Array | null = null;
    try {
      compressed = await compressWithFormat(c.format, bytes);
    } catch {
      compressed = null;
    }
    if (!compressed) continue;
    if (compressed.length < best.bytes.length) {
      best = { tag: c.tag, format: c.format, bytes: compressed };
    }
  }

  return best;
}

function tagToFormat(tag: string): string | null {
  if (tag === COMPRESSION_TAG_GZIP) return 'gzip';
  if (tag === COMPRESSION_TAG_DEFLATE) return 'deflate';
  if (tag === COMPRESSION_TAG_DEFLATE_RAW) return 'deflate-raw';
  if (tag === COMPRESSION_TAG_BROTLI) return 'br';
  if (tag === COMPRESSION_TAG_ZSTD) return 'zstd';
  return null;
}

/**
 * Synchronous encoding (only for V1/V2).
 * Throws if V3 is requested.
 */
export function encodeImageBytes(input: { bytes: Uint8Array; mime: string }, version: number = VERSION_BASE32K): string {
  if (version !== VERSION_BASE91 && version !== VERSION_BASE32K) {
    throw new Error('Use encodeImageBytesAsync for this version');
  }

  const packet = buildPacket(input, version);
  const encodingTag = version === VERSION_BASE91 ? ENCODING_TAG_BASE91 : ENCODING_TAG_BASE32K;
  const compressionTag = COMPRESSION_TAG_NONE;
  const payload = encodeBytesToPayload(packet, encodingTag);
  return buildTaggedPrefix(encodingTag, compressionTag) + payload;
}

/**
 * Async encoding (supports all versions).
 */
export async function encodeImageBytesAsync(input: { bytes: Uint8Array; mime: string }, version: number = VERSION_BASE32K): Promise<string> {
  if (version === VERSION_BASE91 || version === VERSION_BASE32K) {
    return encodeImageBytes(input, version);
  }

  const packet = buildPacket(input, version);
  const encodingTag = ENCODING_TAG_BASE63K;
  let compressionTag = COMPRESSION_TAG_NONE;
  let encodedBytes = packet;

  if (version === VERSION_GZIP_BASE32K) {
    compressionTag = COMPRESSION_TAG_GZIP;
    encodedBytes = await compressWithFormat('gzip', packet);
  } else if (version === VERSION_AUTO) {
    const best = await compressBest(packet);
    compressionTag = best.tag;
    encodedBytes = best.bytes;
  } else {
    throw new Error(`Unsupported version: ${version}`);
  }

  const payload = encodeBytesToPayload(encodedBytes, encodingTag);
  return buildTaggedPrefix(encodingTag, compressionTag) + payload;
}

/**
 * Synchronous decoding (only for V1/V2).
 * Throws if V3 is encountered.
 */
export function decodeImageString(input: string): ImageStringCodecDecoded {
  const header = parseHeader(input);
  if (header.tagged) {
    if (header.compressionTag !== COMPRESSION_TAG_NONE) {
      throw new Error('Use decodeImageStringAsync for compressed payload');
    }
    const packetBytes = decodePayloadToBytes(header.payload, header.encodingTag);
    const decoded = parsePacket(packetBytes);
    if (
      decoded.version !== VERSION_BASE91 &&
      decoded.version !== VERSION_BASE32K &&
      decoded.version !== VERSION_GZIP_BASE32K &&
      decoded.version !== VERSION_AUTO
    ) {
      throw new Error(`Unsupported version: ${decoded.version}`);
    }
    return decoded;
  }

  const cleanInput = header.payload;
  const isBase32k = cleanInput.length > 0 && cleanInput.charCodeAt(0) >= 0x4E00;

  let bytes: Uint8Array;
  if (isBase32k) {
    bytes = base32kDecode(cleanInput);
  } else {
    bytes = base91Decode(rleDecode(cleanInput), { ignoreWhitespace: true });
  }

  if (bytes.length < 2) throw new Error('Invalid payload');
  const version = bytes[0];
  if (version === VERSION_GZIP_BASE32K) throw new Error('Use decodeImageStringAsync for GZIP version');
  if (version !== VERSION_BASE91 && version !== VERSION_BASE32K) throw new Error(`Unsupported version: ${version}`);
  return parsePacket(bytes);
}

/**
 * Async decoding (supports all versions).
 */
export async function decodeImageStringAsync(input: string): Promise<ImageStringCodecDecoded> {
  const header = parseHeader(input);
  if (header.tagged) {
    let bytes = decodePayloadToBytes(header.payload, header.encodingTag);
    if (header.compressionTag && header.compressionTag !== COMPRESSION_TAG_NONE) {
      const format = tagToFormat(header.compressionTag);
      if (!format) throw new Error(`Unknown compression tag: ${header.compressionTag}`);
      bytes = await decompressWithFormat(format, bytes);
    }
    const decoded = parsePacket(bytes);
    if (
      decoded.version !== VERSION_BASE91 &&
      decoded.version !== VERSION_BASE32K &&
      decoded.version !== VERSION_GZIP_BASE32K &&
      decoded.version !== VERSION_AUTO
    ) {
      throw new Error(`Unsupported version: ${decoded.version}`);
    }
    return decoded;
  }

  const cleanInput = header.payload;
  const isBase32k = cleanInput.length > 0 && cleanInput.charCodeAt(0) >= 0x4E00;

  let bytes: Uint8Array;
  if (isBase32k) {
    bytes = base32kDecode(cleanInput);
  } else {
    bytes = base91Decode(rleDecode(cleanInput), { ignoreWhitespace: true });
  }

  if (bytes.length < 1) throw new Error('Invalid payload');
  const version = bytes[0];
  if (version === VERSION_GZIP_BASE32K) {
    const innerBytes = await decompressWithFormat('gzip', bytes.slice(1));
    const decoded = parsePacket(innerBytes);
    return decoded;
  }

  const decoded = parsePacket(bytes);
  return decoded;
}

function parsePacket(bytes: Uint8Array): ImageStringCodecDecoded {
  if (bytes.length < 2) throw new Error('Invalid payload');
  const version = bytes[0];
  const mimeTag = bytes[1];
  let offset = 2;

  let mime: string;
  if (mimeTag === 255) {
    if (bytes.length < 3) throw new Error('Invalid MIME header');
    const mimeLen = bytes[2];
    offset = 3;
    if (bytes.length < offset + mimeLen) throw new Error('Invalid MIME header');
    mime = new TextDecoder().decode(bytes.slice(offset, offset + mimeLen));
    offset += mimeLen;
  } else {
    const known = MIME_BY_ID[mimeTag];
    if (!known) throw new Error(`Unknown MIME tag: ${mimeTag}`);
    mime = known;
  }

  return { version, mime, bytes: bytes.slice(offset) };
}
