import type { BigNumber } from './bigNumber';
import { bnPow10, bnMulScalar, bnNormalize } from './bigNumber';

export function phiMultiplier(phi: number): number {
  return 1 + Math.max(0, phi) * 0.07;
}

export function baseFromLevel(level: number, bCurveLevel = 0, phi = 0): BigNumber {
  const curve = 1 + Math.max(0, bCurveLevel) * 0.12;
  const scaled = bnPow10(1 + level * 0.35 * curve);
  const base = bnNormalize({ m: scaled.m * 2.5, e: scaled.e });
  return bnMulScalar(base, phiMultiplier(phi));
}

export function rFromLevel(level: number, rCurveLevel = 0): number {
  const curve = 1 + Math.max(0, rCurveLevel) * 0.1;
  return 0.01 + level * 0.0035 * curve;
}

export function multiplierFromLevel(level: number): number {
  return Math.pow(1.25, level);
}

export function costBase(level: number): BigNumber {
  return bnPow10(2 + level * 0.75);
}

export function costR(level: number): BigNumber {
  return bnPow10(3 + level * 0.95);
}

export function costMultiplier(level: number): BigNumber {
  return bnPow10(4 + level * 1.2);
}

export function costBCurve(level: number): BigNumber {
  return bnPow10(6 + level * 1.6);
}

export function costRCurve(level: number): BigNumber {
  return bnPow10(6.3 + level * 1.7);
}

export function applyMultiplier(base: BigNumber, multiplierLevel: number, phi = 0): BigNumber {
  return bnMulScalar(base, multiplierFromLevel(multiplierLevel) * phiMultiplier(phi));
}
