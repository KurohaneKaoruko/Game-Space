import type { BigNumber } from './bigNumber';
import type { FunctionIdleState } from '../types';
import { BN_ONE, BN_ZERO, bnAdd, bnDivScalar, bnExp, bnMul, bnMulScalar, bnSub } from './bigNumber';
import { applyMultiplier } from './balance';

export function clampOfflineSeconds(seconds: number): number {
  if (!Number.isFinite(seconds) || seconds <= 0) return 0;
  const maxSeconds = 60 * 60 * 24 * 30;
  return Math.min(seconds, maxSeconds);
}

export function evolvePoints(points: BigNumber, base: BigNumber, r: number, seconds: number): BigNumber {
  if (seconds <= 0) return points;
  if (!Number.isFinite(r) || r <= 0) return bnAdd(points, bnMulScalar(base, seconds));

  const factor = bnExp(r * seconds);
  const factorMinusOne = factor.e >= 7 ? factor : bnSub(factor, BN_ONE);
  const term1 = bnMul(points, factor);
  const baseOverR = bnDivScalar(base, r);
  const term2 = bnMul(baseOverR, factorMinusOne);
  return bnAdd(term1, term2);
}

export function tick(state: FunctionIdleState, now: number): { next: FunctionIdleState; gained: BigNumber } {
  const dtSeconds = Math.max(0, (now - state.lastTimestamp) / 1000);
  if (dtSeconds === 0) return { next: state, gained: BN_ZERO };

  const effectiveBase = applyMultiplier(state.base, state.multiplierLevel, state.phi ?? 0);
  const nextPoints = evolvePoints(state.points, effectiveBase, state.r, dtSeconds);
  const gained = bnSub(nextPoints, state.points);

  return {
    next: { ...state, points: nextPoints, lastTimestamp: now },
    gained,
  };
}

export function simulateOffline(state: FunctionIdleState, now: number): { next: FunctionIdleState; offlineSeconds: number; gained: BigNumber } {
  const rawSeconds = (now - state.lastTimestamp) / 1000;
  const offlineSeconds = clampOfflineSeconds(rawSeconds);
  if (offlineSeconds <= 0) return { next: { ...state, lastTimestamp: now }, offlineSeconds: 0, gained: BN_ZERO };

  const effectiveBase = applyMultiplier(state.base, state.multiplierLevel, state.phi ?? 0);
  const nextPoints = evolvePoints(state.points, effectiveBase, state.r, offlineSeconds);
  const gained = bnSub(nextPoints, state.points);

  return {
    next: { ...state, points: nextPoints, lastTimestamp: now },
    offlineSeconds,
    gained,
  };
}
