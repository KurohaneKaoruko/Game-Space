import type { BigNumber } from './function/bigNumber';

export type FunctionIdleState = {
  version: 2;
  points: BigNumber;
  base: BigNumber;
  r: number;
  bLevel: number;
  rLevel: number;
  multiplierLevel: number;
  phi: number;
  bCurveLevel: number;
  rCurveLevel: number;
  autoBuy: {
    base: boolean;
    r: boolean;
    multiplier: boolean;
    bCurve: boolean;
    rCurve: boolean;
  };
  lastTimestamp: number;
};

export type FunctionIdleSnapshot = {
  state: FunctionIdleState;
  offlineSeconds: number;
  gainedPoints: BigNumber;
};
