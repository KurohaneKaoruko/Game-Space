import type { FunctionIdleState } from '../types';
import type { BigNumber } from './bigNumber';
import { BN_ZERO, bnNormalize } from './bigNumber';

const STORAGE_KEY = 'function_idle_state';
const STORAGE_VERSION = 2 as const;

type FunctionIdleStateV1 = {
  version: 1;
  points: BigNumber;
  base: BigNumber;
  r: number;
  bLevel: number;
  rLevel: number;
  multiplierLevel: number;
  phi?: number;
  bCurveLevel?: number;
  rCurveLevel?: number;
  autoBuy?: {
    base?: boolean;
    r?: boolean;
    multiplier?: boolean;
    bCurve?: boolean;
    rCurve?: boolean;
  };
  lastTimestamp: number;
};

const DEFAULT_AUTO_BUY = {
  base: false,
  r: false,
  multiplier: false,
  bCurve: false,
  rCurve: false,
};

function isValidBigNumber(value: unknown): value is { m: number; e: number } {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as { m?: unknown; e?: unknown };
  return typeof v.m === 'number' && Number.isFinite(v.m) && typeof v.e === 'number' && Number.isFinite(v.e);
}

function isValidAutoBuy(value: unknown): value is FunctionIdleState['autoBuy'] {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.base === 'boolean' &&
    typeof v.r === 'boolean' &&
    typeof v.multiplier === 'boolean' &&
    typeof v.bCurve === 'boolean' &&
    typeof v.rCurve === 'boolean'
  );
}

function isValidStateV2(value: unknown): value is FunctionIdleState {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Partial<FunctionIdleState>;
  return (
    v.version === STORAGE_VERSION &&
    isValidBigNumber(v.points) &&
    isValidBigNumber(v.base) &&
    typeof v.r === 'number' &&
    Number.isFinite(v.r) &&
    typeof v.bLevel === 'number' &&
    Number.isInteger(v.bLevel) &&
    v.bLevel >= 0 &&
    typeof v.rLevel === 'number' &&
    Number.isInteger(v.rLevel) &&
    v.rLevel >= 0 &&
    typeof v.multiplierLevel === 'number' &&
    Number.isInteger(v.multiplierLevel) &&
    v.multiplierLevel >= 0 &&
    typeof v.phi === 'number' &&
    Number.isFinite(v.phi) &&
    typeof v.bCurveLevel === 'number' &&
    Number.isInteger(v.bCurveLevel) &&
    v.bCurveLevel >= 0 &&
    typeof v.rCurveLevel === 'number' &&
    Number.isInteger(v.rCurveLevel) &&
    v.rCurveLevel >= 0 &&
    isValidAutoBuy(v.autoBuy) &&
    typeof v.lastTimestamp === 'number' &&
    Number.isFinite(v.lastTimestamp)
  );
}

export function coerceState(value: unknown, now: number): FunctionIdleState | null {
  if (isValidStateV2(value)) {
    const s = value as FunctionIdleState;
    return {
      ...s,
      points: bnNormalize(s.points),
      base: bnNormalize(s.base),
      lastTimestamp: typeof s.lastTimestamp === 'number' ? s.lastTimestamp : now,
    };
  }

  const v1 = value as Partial<FunctionIdleStateV1>;
  const isValidV1 =
    v1?.version === 1 &&
    isValidBigNumber(v1.points) &&
    isValidBigNumber(v1.base) &&
    typeof v1.r === 'number' &&
    Number.isFinite(v1.r) &&
    typeof v1.bLevel === 'number' &&
    Number.isInteger(v1.bLevel) &&
    v1.bLevel >= 0 &&
    typeof v1.rLevel === 'number' &&
    Number.isInteger(v1.rLevel) &&
    v1.rLevel >= 0 &&
    typeof v1.multiplierLevel === 'number' &&
    Number.isInteger(v1.multiplierLevel) &&
    v1.multiplierLevel >= 0 &&
    typeof v1.lastTimestamp === 'number' &&
    Number.isFinite(v1.lastTimestamp);

  if (!isValidV1) return null;

  const migrated: FunctionIdleState = {
    version: STORAGE_VERSION,
    points: bnNormalize(v1.points as BigNumber),
    base: bnNormalize(v1.base as BigNumber),
    r: v1.r as number,
    bLevel: v1.bLevel as number,
    rLevel: v1.rLevel as number,
    multiplierLevel: v1.multiplierLevel as number,
    phi: typeof v1.phi === 'number' && Number.isFinite(v1.phi) ? Math.max(0, v1.phi) : 0,
    bCurveLevel: typeof v1.bCurveLevel === 'number' && Number.isInteger(v1.bCurveLevel) ? Math.max(0, v1.bCurveLevel) : 0,
    rCurveLevel: typeof v1.rCurveLevel === 'number' && Number.isInteger(v1.rCurveLevel) ? Math.max(0, v1.rCurveLevel) : 0,
    autoBuy: {
      ...DEFAULT_AUTO_BUY,
      ...(typeof v1.autoBuy === 'object' && v1.autoBuy !== null ? v1.autoBuy : {}),
    },
    lastTimestamp: v1.lastTimestamp as number,
  };

  migrated.lastTimestamp = typeof migrated.lastTimestamp === 'number' ? migrated.lastTimestamp : now;
  return migrated;
}

export function defaultState(now: number): FunctionIdleState {
  return {
    version: STORAGE_VERSION,
    points: BN_ZERO,
    base: { m: 2.5, e: 1 },
    r: 0.01,
    bLevel: 0,
    rLevel: 0,
    multiplierLevel: 0,
    phi: 0,
    bCurveLevel: 0,
    rCurveLevel: 0,
    autoBuy: DEFAULT_AUTO_BUY,
    lastTimestamp: now,
  };
}

export function saveState(state: FunctionIdleState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save FunctionIdle state:', e);
  }
}

export function loadState(now: number): FunctionIdleState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState(now);
    const parsed: unknown = JSON.parse(raw);
    const coerced = coerceState(parsed, now);
    if (!coerced) return defaultState(now);
    if (coerced.version !== STORAGE_VERSION) return defaultState(now);
    if (!isValidStateV2(coerced)) return defaultState(now);
    const parsedVersion =
      typeof parsed === 'object' && parsed !== null ? (parsed as { version?: unknown }).version : undefined;
    if (parsedVersion !== STORAGE_VERSION) saveState(coerced);
    return coerced;
  } catch (e) {
    console.warn('Failed to load FunctionIdle state:', e);
    return defaultState(now);
  }
}

export function clearState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('Failed to clear FunctionIdle state:', e);
  }
}
