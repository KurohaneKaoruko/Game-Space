import { base91Decode, base91Encode } from './base91';

export type ImageStringCodecDecoded = {
  version: number;
  mime: string;
  bytes: Uint8Array;
};

const VERSION = 1;

const MIME_BY_ID: Record<number, string> = {
  0: 'image/png',
  1: 'image/jpeg',
  2: 'image/webp',
  3: 'image/gif',
};

const ID_BY_MIME: Record<string, number> = Object.fromEntries(
  Object.entries(MIME_BY_ID).map(([id, mime]) => [mime, Number(id)])
) as Record<string, number>;

export function encodeImageBytes(input: { bytes: Uint8Array; mime: string }): string {
  const mimeId = ID_BY_MIME[input.mime];

  let header: Uint8Array;
  if (mimeId === undefined) {
    const mimeBytes = new TextEncoder().encode(input.mime);
    if (mimeBytes.length > 255) {
      throw new Error('MIME too long');
    }
    header = new Uint8Array(3 + mimeBytes.length);
    header[0] = VERSION;
    header[1] = 255;
    header[2] = mimeBytes.length;
    header.set(mimeBytes, 3);
  } else {
    header = new Uint8Array(2);
    header[0] = VERSION;
    header[1] = mimeId;
  }

  const merged = new Uint8Array(header.length + input.bytes.length);
  merged.set(header, 0);
  merged.set(input.bytes, header.length);
  return base91Encode(merged);
}

export function decodeImageString(input: string): ImageStringCodecDecoded {
  const bytes = base91Decode(input, { ignoreWhitespace: true });
  if (bytes.length < 2) throw new Error('Invalid payload');

  const version = bytes[0];
  if (version !== VERSION) throw new Error(`Unsupported version: ${version}`);

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
