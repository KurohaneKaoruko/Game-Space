import { describe, expect, it } from 'vitest';
import { randomBytes } from 'node:crypto';
import { base91Decode, base91Encode } from './base91';

function expectSameBytes(a: Uint8Array, b: Uint8Array) {
  expect(a.byteLength).toBe(b.byteLength);
  for (let i = 0; i < a.length; i++) expect(a[i]).toBe(b[i]);
}

describe('base91', () => {
  it('round-trip empty', () => {
    const encoded = base91Encode(new Uint8Array(0));
    expect(encoded).toBe('');
    const decoded = base91Decode(encoded);
    expect(decoded.byteLength).toBe(0);
  });

  it('round-trip basic edge cases', () => {
    const cases: Uint8Array[] = [
      new Uint8Array([0]),
      new Uint8Array([255]),
      new Uint8Array([0, 0, 0, 0]),
      new Uint8Array([255, 255, 255, 255]),
      new Uint8Array([0, 255, 1, 254, 2, 253]),
    ];

    for (const input of cases) {
      const encoded = base91Encode(input);
      const decoded = base91Decode(encoded);
      expectSameBytes(decoded, input);
    }
  });

  it('round-trip random bytes', () => {
    const lengths = [1, 2, 3, 10, 50, 256, 1024, 4096];
    for (const len of lengths) {
      const input = new Uint8Array(randomBytes(len));
      const encoded = base91Encode(input);
      const decoded = base91Decode(encoded);
      expectSameBytes(decoded, input);
    }
  });
});
