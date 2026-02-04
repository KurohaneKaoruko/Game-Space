import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Direction, SnakeState } from '../types';
import { getAIMove, type AIMove, type AIStrategy } from './aiEngine';

export type AISpeed = 'turbo' | 'fast' | 'normal' | 'slow';

export const AI_SPEEDS: Record<AISpeed, number> = {
  turbo: 0,
  fast: 60,
  normal: 120,
  slow: 200,
};

export type SnakeAIControllerOptions = {
  state: SnakeState;
  onStep: (dirOverride?: Direction) => void;
};

export type SnakeAIControllerReturn = {
  isRunning: boolean;
  speed: AISpeed;
  strategy: AIStrategy;
  customScript: string;
  lastMove: AIMove | null;
  start: () => void;
  stop: () => void;
  setSpeed: (speed: AISpeed) => void;
  setStrategy: (strategy: AIStrategy) => void;
  setCustomScript: (script: string) => void;
};

export function useSnakeAIController(options: SnakeAIControllerOptions): SnakeAIControllerReturn {
  const { state, onStep } = options;

  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState<AISpeed>('normal');
  const [strategy, setStrategy] = useState<AIStrategy>('strong');
  const [customScript, setCustomScript] = useState('');
  const [lastMove, setLastMove] = useState<AIMove | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const stateRef = useRef(state);
  const onStepRef = useRef(onStep);
  const speedRef = useRef(speed);
  const strategyRef = useRef(strategy);
  const customScriptRef = useRef(customScript);
  const isRunningRef = useRef(false);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    onStepRef.current = onStep;
  }, [onStep]);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    strategyRef.current = strategy;
  }, [strategy]);

  useEffect(() => {
    customScriptRef.current = customScript;
  }, [customScript]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const executeOnce = useCallback(() => {
    const s = stateRef.current;
    if (s.status !== 'running') return;
    const move = getAIMove(s, strategyRef.current, customScriptRef.current);
    setLastMove(move);
    onStepRef.current(move.direction);
  }, []);

  const stop = useCallback(() => {
    setIsRunning(false);
    isRunningRef.current = false;
    clearTimer();
  }, [clearTimer]);

  // Reactive Game Loop: Triggered by state updates
  useEffect(() => {
    if (!isRunning) return;
    if (state.status !== 'running') {
        stop();
        return;
    }

    // If we just moved, wait for the next tick based on speed
    const ms = AI_SPEEDS[speed];
    
    // For Turbo (0ms), we want to run as fast as possible, but we must wait for the state to update.
    // Since this effect runs *after* state update, we are ready to go!
    // We use setTimeout 0 to yield to the browser event loop (input, render) briefly,
    // preventing the browser from freezing if updates are too fast.
    
    const timer = setTimeout(() => {
        executeOnce();
    }, ms);

    return () => clearTimeout(timer);
  }, [state, isRunning, speed, executeOnce, stop]);

  const start = useCallback(() => {
    if (stateRef.current.status !== 'running') return;
    setIsRunning(true);
    isRunningRef.current = true;
    
    // Trigger first move immediately
    executeOnce();
  }, [executeOnce]);

  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  return useMemo(
    () => ({
      isRunning,
      speed,
      strategy,
      customScript,
      lastMove,
      start,
      stop,
      setSpeed,
      setStrategy,
      setCustomScript,
    }),
    [isRunning, speed, strategy, customScript, lastMove, start, stop]
  );
}

