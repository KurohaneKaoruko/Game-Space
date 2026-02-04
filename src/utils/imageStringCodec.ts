export type ImageStringCodecDecoded = {
  version: number;
  mime: string;
  bytes: Uint8Array;
};

// Versions
export const VERSION_BASE91 = 1;
export const VERSION_BASE32K = 2;

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

// Re-add Base91 logic for compatibility and choice
import { base91Decode, base91Encode, base91Alphabet } from './base91';

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

export function encodeImageBytes(input: { bytes: Uint8Array; mime: string }, version: number = VERSION_BASE32K): string {
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
  
  if (version === VERSION_BASE32K) {
    return base32kEncode(merged);
  } else {
    // Fallback to Base91 + RLE (Version 1)
    const base91Str = base91Encode(merged);
    return rleEncode(base91Str);
  }
}

export function decodeImageString(input: string): ImageStringCodecDecoded {
  // Heuristic detection: if string contains CJK (high codepoints), likely Base32k
  // Base91 uses ASCII printable range (33-126).
  // Base32k uses 0x4E00+.
  const isBase32k = input.charCodeAt(0) >= 0x4E00;

  let bytes: Uint8Array;
  
  if (isBase32k) {
    bytes = base32kDecode(input);
  } else {
    // Try Base91+RLE
    const base91Str = rleDecode(input);
    bytes = base91Decode(base91Str, { ignoreWhitespace: true });
  }
  
  if (bytes.length < 2) throw new Error('Invalid payload');

  const version = bytes[0];
  
  // We can support decoding both V1 and V2 regardless of user selection
  // But we validate known versions
  if (version !== VERSION_BASE91 && version !== VERSION_BASE32K) {
     throw new Error(`Unsupported version: ${version}`);
  }

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
