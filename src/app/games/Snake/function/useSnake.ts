import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Direction, SnakeSettings, SnakeState } from '../types';
import { createInitialState, stepSnake, togglePause, withDirection, type RNG } from './engine';

export type UseSnakeReturn = {
  state: SnakeState;
  settings: SnakeSettings;
  setSettings: (patch: Partial<SnakeSettings>) => void;
  setDirection: (dir: Direction) => void;
  step: (dirOverride?: Direction) => void;
  restart: () => void;
  togglePause: () => void;
};

export function useSnake(initial?: Partial<SnakeSettings> & { rng?: RNG }): UseSnakeReturn {
  const rngRef = useRef<RNG>(initial?.rng ?? Math.random);
  const [settings, setSettingsState] = useState<SnakeSettings>({
    width: initial?.width ?? 20,
    height: initial?.height ?? 20,
    tickMs: initial?.tickMs ?? 120,
  });

  const [state, setState] = useState<SnakeState>(() =>
    createInitialState({ width: settings.width, height: settings.height }, rngRef.current)
  );

  const setSettings = useCallback((patch: Partial<SnakeSettings>) => {
    setSettingsState((prev) => ({ ...prev, ...patch }));
  }, []);

  const restart = useCallback(() => {
    // Force immediate restart by creating state and setting it
    const newState = createInitialState({ width: settings.width, height: settings.height }, rngRef.current);
    setState(newState);
    // Also reset AI running state if needed? 
    // Actually, useSnake doesn't know about AI. The consumer handles that.
  }, [settings.width, settings.height]);

  useEffect(() => {
    setState(createInitialState({ width: settings.width, height: settings.height }, rngRef.current));
  }, [settings.width, settings.height]);

  const setDirection = useCallback((dir: Direction) => {
    setState((prev) => withDirection(prev, dir));
  }, []);

  const step = useCallback(
    (dirOverride?: Direction) => {
      setState((prev) => {
        const s = dirOverride ? withDirection(prev, dirOverride) : prev;
        return stepSnake(s, rngRef.current);
      });
    },
    []
  );

  const togglePauseAction = useCallback(() => {
    setState((prev) => togglePause(prev));
  }, []);

  return useMemo(
    () => ({
      state,
      settings,
      setSettings,
      setDirection,
      step,
      restart,
      togglePause: togglePauseAction,
    }),
    [restart, setDirection, setSettings, settings, state, step, togglePauseAction]
  );
}
