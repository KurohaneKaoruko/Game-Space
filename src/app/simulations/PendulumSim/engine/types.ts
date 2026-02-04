export type Vec2 = { x: number; y: number };

export type PendulumMode = 'double' | 'triple';

export type Integrator = 'verlet';

export type PendulumParams = {
  mode: PendulumMode;
  integrator: Integrator;
  gravity: number;
  damping: number;
  lengths: [number, number, number];
  masses: [number, number, number];
  anglesDeg: [number, number, number];
};

export type EnergySample = {
  t: number;
  kinetic: number;
  potential: number;
  total: number;
};

export type PendulumSnapshot = {
  t: number;
  anchor: Vec2;
  points: Vec2[];
  params: PendulumParams;
  energy: EnergySample;
};

