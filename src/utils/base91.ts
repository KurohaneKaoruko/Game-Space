const ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#$%&()*+,-./:;<=>?@[]^_`{|}~';

const DECODE_TABLE: Int16Array = (() => {
  const table = new Int16Array(128);
  table.fill(-1);
  for (let i = 0; i < ALPHABET.length; i++) {
    table[ALPHABET.charCodeAt(i)] = i;
  }
  return table;
})();

export function base91Encode(bytes: Uint8Array): string {
  if (bytes.length === 0) return '';

  let b = 0;
  let n = 0;
  let out = '';

  for (let i = 0; i < bytes.length; i++) {
    b |= bytes[i] << n;
    n += 8;

    if (n > 13) {
      let v = b & 8191;
      if (v > 88) {
        b >>= 13;
        n -= 13;
      } else {
        v = b & 16383;
        b >>= 14;
        n -= 14;
      }
      out += ALPHABET[v % 91] + ALPHABET[(v / 91) | 0];
    }
  }

  if (n > 0) {
    out += ALPHABET[b % 91];
    if (n > 7 || b > 90) out += ALPHABET[(b / 91) | 0];
  }

  return out;
}

export function base91Decode(input: string, options?: { ignoreWhitespace?: boolean }): Uint8Array {
  const ignoreWhitespace = options?.ignoreWhitespace ?? false;

  if (input.length === 0) return new Uint8Array(0);

  const out: number[] = [];
  let b = 0;
  let n = 0;
  let v = -1;

  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);

    if (ignoreWhitespace && c <= 32) continue;
    if (c > 127) {
      throw new Error(`Base91: invalid character code ${c}`);
    }

    const d = DECODE_TABLE[c];
    if (d === -1) {
      throw new Error(`Base91: invalid character '${input[i]}'`);
    }

    if (v < 0) {
      v = d;
    } else {
      v += d * 91;
      b |= v << n;
      n += (v & 8191) > 88 ? 13 : 14;
      do {
        out.push(b & 255);
        b >>= 8;
        n -= 8;
      } while (n > 7);
      v = -1;
    }
  }

  if (v >= 0) {
    out.push((b | (v << n)) & 255);
  }

  return Uint8Array.from(out);
}

export function base91Alphabet(): string {
  return ALPHABET;
}
