import type { BigNumber } from './bigNumber';
import type { FunctionIdleState } from '../types';
import { BN_ONE, BN_ZERO, bnAdd, bnExp, bnLog10, bnMul, bnSub } from './bigNumber';
import { applyMultiplier } from './balance';

const BASE_LOG10_RATE = 0.12;
const BASE_LOG10_CAP = 40;
const LOGP_SOFTCAP_START = 90;
const LOGP_SOFTCAP_SCALE = 60;
const RATE_CAP = 1.2;

export function clampOfflineSeconds(seconds: number): number {
  if (!Number.isFinite(seconds) || seconds <= 0) return 0;
  const maxSeconds = 60 * 60 * 24 * 30;
  return Math.min(seconds, maxSeconds);
}

export function evolvePoints(points: BigNumber, base: BigNumber, r: number, seconds: number): BigNumber {
  if (seconds <= 0) return points;

  const rSafe = Number.isFinite(r) ? Math.max(0, r) : 0;
  const baseLog10Raw = Math.max(0, bnLog10(base));
  const baseLog10 = baseLog10Raw / (1 + baseLog10Raw / BASE_LOG10_CAP);

  const logP = Math.max(0, bnLog10(points));
  const slow = 1 + Math.max(0, logP - LOGP_SOFTCAP_START) / LOGP_SOFTCAP_SCALE;
  const rate = Math.min(RATE_CAP, rSafe / slow);
  const b = (baseLog10 * BASE_LOG10_RATE * seconds) / slow;
  if (!Number.isFinite(rate) || rate <= 0) return points;
  if (!Number.isFinite(b) || b < 0) return points;

  const q0 = bnAdd(points, BN_ONE);
  const factor = bnExp(rate * seconds + b);
  const q1 = bnMul(q0, factor);
  const p1 = bnSub(q1, BN_ONE);
  return p1.m < 0 ? BN_ZERO : p1;
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
