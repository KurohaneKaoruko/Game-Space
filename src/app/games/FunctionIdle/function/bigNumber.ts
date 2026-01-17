export type BigNumber = {
  m: number;
  e: number;
};

const LN10 = Math.log(10);

export const BN_ZERO: BigNumber = { m: 0, e: 0 };
export const BN_ONE: BigNumber = { m: 1, e: 0 };

export function bnIsFinite(a: BigNumber): boolean {
  return Number.isFinite(a.m) && Number.isFinite(a.e);
}

export function bnNormalize(a: BigNumber): BigNumber {
  if (!Number.isFinite(a.m) || !Number.isFinite(a.e)) return BN_ZERO;
  if (a.m === 0) return BN_ZERO;

  const absM = Math.abs(a.m);
  const shift = Math.floor(Math.log10(absM));
  let m = a.m / Math.pow(10, shift);
  let e = a.e + shift;

  if (Math.abs(m) >= 10) {
    m /= 10;
    e += 1;
  } else if (Math.abs(m) < 1) {
    m *= 10;
    e -= 1;
  }

  if (!Number.isFinite(m) || !Number.isFinite(e)) return BN_ZERO;
  return { m, e };
}

export function bnFromNumber(n: number): BigNumber {
  if (!Number.isFinite(n) || n === 0) return BN_ZERO;
  const e = Math.floor(Math.log10(Math.abs(n)));
  const m = n / Math.pow(10, e);
  return bnNormalize({ m, e });
}

export function bnToNumber(a: BigNumber): number {
  const n = a.m * Math.pow(10, a.e);
  return Number.isFinite(n) ? n : (a.m >= 0 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY);
}

export function bnLog10(a: BigNumber): number {
  if (a.m === 0) return Number.NEGATIVE_INFINITY;
  return Math.log10(Math.abs(a.m)) + a.e;
}

export function bnCmp(a: BigNumber, b: BigNumber): -1 | 0 | 1 {
  if (a.m === 0 && b.m === 0) return 0;
  if (a.m === 0) return b.m > 0 ? -1 : 1;
  if (b.m === 0) return a.m > 0 ? 1 : -1;

  if (a.e !== b.e) return a.e > b.e ? 1 : -1;
  if (a.m === b.m) return 0;
  return a.m > b.m ? 1 : -1;
}

export function bnGte(a: BigNumber, b: BigNumber): boolean {
  return bnCmp(a, b) >= 0;
}

export function bnAdd(a: BigNumber, b: BigNumber): BigNumber {
  if (a.m === 0) return b;
  if (b.m === 0) return a;

  const diff = a.e - b.e;
  if (diff >= 16) return a;
  if (diff <= -16) return b;

  if (diff === 0) return bnNormalize({ m: a.m + b.m, e: a.e });
  if (diff > 0) {
    const scaledB = b.m / Math.pow(10, diff);
    return bnNormalize({ m: a.m + scaledB, e: a.e });
  }
  const scaledA = a.m / Math.pow(10, -diff);
  return bnNormalize({ m: scaledA + b.m, e: b.e });
}

export function bnSub(a: BigNumber, b: BigNumber): BigNumber {
  if (b.m === 0) return a;
  if (a.m === 0) return bnNormalize({ m: -b.m, e: b.e });

  const diff = a.e - b.e;
  if (diff >= 16) return a;
  if (diff <= -16) return BN_ZERO;

  if (diff === 0) return bnNormalize({ m: a.m - b.m, e: a.e });
  if (diff > 0) {
    const scaledB = b.m / Math.pow(10, diff);
    return bnNormalize({ m: a.m - scaledB, e: a.e });
  }
  const scaledA = a.m / Math.pow(10, -diff);
  return bnNormalize({ m: scaledA - b.m, e: b.e });
}

export function bnMul(a: BigNumber, b: BigNumber): BigNumber {
  if (a.m === 0 || b.m === 0) return BN_ZERO;
  return bnNormalize({ m: a.m * b.m, e: a.e + b.e });
}

export function bnMulScalar(a: BigNumber, s: number): BigNumber {
  if (a.m === 0 || s === 0) return BN_ZERO;
  return bnNormalize({ m: a.m * s, e: a.e });
}

export function bnDivScalar(a: BigNumber, s: number): BigNumber {
  if (a.m === 0) return BN_ZERO;
  if (s === 0) return BN_ZERO;
  return bnNormalize({ m: a.m / s, e: a.e });
}

export function bnPow10(x: number): BigNumber {
  if (!Number.isFinite(x)) return BN_ZERO;
  const e = Math.floor(x);
  const frac = x - e;
  const m = Math.pow(10, frac);
  return bnNormalize({ m, e });
}

export function bnExp(x: number): BigNumber {
  if (!Number.isFinite(x)) return BN_ZERO;
  return bnPow10(x / LN10);
}

export function bnFormat(a: BigNumber, digits = 3): string {
  if (a.m === 0) return '0';
  const mantissa = a.m.toFixed(Math.max(0, digits - 1));
  if (a.e >= -3 && a.e <= 6) {
    const n = bnToNumber(a);
    if (Number.isFinite(n)) return n.toFixed(Math.max(0, digits - 1));
  }
  const e = a.e;
  const absE = Math.abs(e);
  if (absE < 1_000_000) {
    return `${mantissa}e${e}`;
  }
  const ee = Math.log10(absE);
  const eeText = Number.isFinite(ee) ? ee.toFixed(2) : '∞';
  return `${mantissa}ee${eeText}`;
}
