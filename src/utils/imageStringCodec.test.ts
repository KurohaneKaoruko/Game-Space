import { describe, expect, it } from 'vitest';
import { randomBytes } from 'node:crypto';
import {
  CODEC_PREFIX,
  VERSION_AUTO,
  VERSION_BASE32K,
  VERSION_BASE91,
  VERSION_GZIP_BASE32K,
  decodeImageString,
  decodeImageStringAsync,
  encodeImageBytes,
  encodeImageBytesAsync,
} from './imageStringCodec';

function expectSameBytes(a: Uint8Array, b: Uint8Array) {
  expect(a.byteLength).toBe(b.byteLength);
  for (let i = 0; i < a.length; i++) expect(a[i]).toBe(b[i]);
}

describe('imageStringCodec', () => {
  it('encoded strings start with IMG#', () => {
    const payload = new Uint8Array([1, 2, 3]);
    const encoded = encodeImageBytes({ bytes: payload, mime: 'image/png' });
    expect(encoded.startsWith(CODEC_PREFIX)).toBe(true);
  });

  it('round-trip known mime (Base91, sync)', () => {
    const payload = new Uint8Array(randomBytes(512));
    const encoded = encodeImageBytes({ bytes: payload, mime: 'image/png' }, VERSION_BASE91);
    const decoded = decodeImageString(encoded);
    expect(decoded.version).toBe(VERSION_BASE91);
    expect(decoded.mime).toBe('image/png');
    expectSameBytes(decoded.bytes, payload);
  });

  it('round-trip custom mime (Base32k, sync)', () => {
    const payload = new Uint8Array([1, 2, 3, 4, 5]);
    const encoded = encodeImageBytes({ bytes: payload, mime: 'image/x-test' }, VERSION_BASE32K);
    const decoded = decodeImageString(encoded);
    expect(decoded.version).toBe(VERSION_BASE32K);
    expect(decoded.mime).toBe('image/x-test');
    expectSameBytes(decoded.bytes, payload);
  });

  it('round-trip Auto (Best, async)', async () => {
    const payload = new Uint8Array(randomBytes(2048));
    const encoded = await encodeImageBytesAsync({ bytes: payload, mime: 'image/png' }, VERSION_AUTO);
    const decoded = await decodeImageStringAsync(encoded);
    expect(decoded.version).toBe(VERSION_AUTO);
    expect(decoded.mime).toBe('image/png');
    expectSameBytes(decoded.bytes, payload);
  });

  it('Auto output is not longer than Base32k for random bytes', async () => {
    const payload = new Uint8Array(randomBytes(20000));
    const encodedV2 = encodeImageBytes({ bytes: payload, mime: 'application/octet-stream' }, VERSION_BASE32K);
    const encodedAuto = await encodeImageBytesAsync({ bytes: payload, mime: 'application/octet-stream' }, VERSION_AUTO);
    expect(encodedAuto.length).toBeLessThan(encodedV2.length);
  });

  it('round-trip Gzip (Version 3, async)', async () => {
    if (typeof CompressionStream === 'undefined') return;
    const payload = new Uint8Array(randomBytes(4096));
    const encoded = await encodeImageBytesAsync({ bytes: payload, mime: 'image/png' }, VERSION_GZIP_BASE32K);
    const decoded = await decodeImageStringAsync(encoded);
    expect(decoded.version).toBe(VERSION_GZIP_BASE32K);
    expect(decoded.mime).toBe('image/png');
    expectSameBytes(decoded.bytes, payload);
  });
});

