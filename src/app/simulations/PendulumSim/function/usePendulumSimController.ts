'use client';

import { useMemo, useRef, useState } from 'react';
import { PendulumSimulation, defaultPendulumParams } from '../engine/pendulumSimulation';
import type { PendulumMode, PendulumParams } from '../engine/types';

export type PendulumUIState = {
  params: PendulumParams;
  paused: boolean;
  showTrail: boolean;
  trailLength: number;
  showEnergy: boolean;
  showPhasePlot: boolean;
  phaseTrailLength: number;
  resetToken: number;
};

export type PendulumUIActions = {
  simRef: React.MutableRefObject<PendulumSimulation>;
  setMode: (mode: PendulumMode) => void;
  setParam: (partial: Partial<PendulumParams>) => void;
  setLength: (index: 0 | 1 | 2, value: number) => void;
  setMass: (index: 0 | 1 | 2, value: number) => void;
  setAngleDeg: (index: 0 | 1 | 2, value: number) => void;
  setPaused: (paused: boolean) => void;
  reset: () => void;
  setShowTrail: (v: boolean) => void;
  setTrailLength: (n: number) => void;
  setShowEnergy: (v: boolean) => void;
  setShowPhasePlot: (v: boolean) => void;
  setPhaseTrailLength: (n: number) => void;
};

export function usePendulumSimController(initial?: Partial<PendulumParams>): [PendulumUIState, PendulumUIActions] {
  const [params, setParamsState] = useState<PendulumParams>({ ...defaultPendulumParams, ...initial });
  const [paused, setPaused] = useState(false);
  const [showTrail, setShowTrail] = useState(true);
  const [trailLength, setTrailLength] = useState(450);
  const [showEnergy, setShowEnergy] = useState(true);
  const [showPhasePlot, setShowPhasePlot] = useState(true);
  const [phaseTrailLength, setPhaseTrailLength] = useState(2000);
  const [resetToken, setResetToken] = useState(0);

  const simRef = useRef<PendulumSimulation | null>(null);
  if (!simRef.current) simRef.current = new PendulumSimulation(params);

  const actions: PendulumUIActions = useMemo(() => {
    const sim = simRef as React.MutableRefObject<PendulumSimulation>;

    const setParam = (partial: Partial<PendulumParams>) => {
      setParamsState((prev) => {
        const next = { ...prev, ...partial };
        sim.current.setParams(partial);
        return next;
      });
    };

    const reset = () => {
      sim.current.reset(params);
      setResetToken((t) => t + 1);
    };

    const setMode = (mode: PendulumMode) => {
      setParamsState((prev) => {
        const next = { ...prev, mode };
        sim.current.reset(next);
        return next;
      });
      setResetToken((t) => t + 1);
    };

    const setLength = (index: 0 | 1 | 2, value: number) => {
      setParamsState((prev) => {
        const lengths = [...prev.lengths] as [number, number, number];
        lengths[index] = value;
        const next = { ...prev, lengths };
        sim.current.setParams({ lengths });
        return next;
      });
    };

    const setMass = (index: 0 | 1 | 2, value: number) => {
      setParamsState((prev) => {
        const masses = [...prev.masses] as [number, number, number];
        masses[index] = value;
        const next = { ...prev, masses };
        sim.current.setParams({ masses });
        return next;
      });
    };

    const setAngleDeg = (index: 0 | 1 | 2, value: number) => {
      setParamsState((prev) => {
        const anglesDeg = [...prev.anglesDeg] as [number, number, number];
        anglesDeg[index] = value;
        const next = { ...prev, anglesDeg };
        sim.current.reset(next);
        return next;
      });
      setResetToken((t) => t + 1);
    };

    return {
      simRef: sim,
      setMode,
      setParam,
      setLength,
      setMass,
      setAngleDeg,
      setPaused,
      reset,
      setShowTrail,
      setTrailLength,
      setShowEnergy,
      setShowPhasePlot,
      setPhaseTrailLength,
    };
  }, [params]);

  return [
    { params, paused, showTrail, trailLength, showEnergy, showPhasePlot, phaseTrailLength, resetToken },
    actions,
  ];
}
