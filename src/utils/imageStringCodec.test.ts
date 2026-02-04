import { describe, expect, it } from 'vitest';
import { randomBytes } from 'node:crypto';
import { decodeImageString, encodeImageBytes } from './imageStringCodec';
import { base91Decode, base91Encode } from './base91';

function expectSameBytes(a: Uint8Array, b: Uint8Array) {
  expect(a.byteLength).toBe(b.byteLength);
  for (let i = 0; i < a.length; i++) expect(a[i]).toBe(b[i]);
}

describe('imageStringCodec', () => {
  it('round-trip known mime', () => {
    const payload = new Uint8Array(randomBytes(512));
    const encoded = encodeImageBytes({ bytes: payload, mime: 'image/png' });
    const decoded = decodeImageString(encoded);
    expect(decoded.version).toBe(1);
    expect(decoded.mime).toBe('image/png');
    expectSameBytes(decoded.bytes, payload);
  });

  it('round-trip custom mime', () => {
    const payload = new Uint8Array([1, 2, 3, 4, 5]);
    const encoded = encodeImageBytes({ bytes: payload, mime: 'image/x-test' });
    const decoded = decodeImageString(encoded);
    expect(decoded.mime).toBe('image/x-test');
    expectSameBytes(decoded.bytes, payload);
  });

  it('throws on unsupported version', () => {
    const payload = new Uint8Array([9, 9, 9]);
    const encoded = encodeImageBytes({ bytes: payload, mime: 'image/png' });
    const raw = base91Decode(encoded);
    raw[0] = 2;
    const mutated = base91Encode(raw);
    expect(() => decodeImageString(mutated)).toThrow(/Unsupported version/);
  });
});
