import type { Vec2 } from './types';
import { len, mul, sub } from './vec2';

export type Particle = {
  p: Vec2;
  pPrev: Vec2;
  invMass: number;
};

export type DistanceConstraint = {
  i: number;
  j: number;
  length: number;
};

export function verletIntegrate(particles: Particle[], gravity: number, damping: number, dt: number) {
  const dt2 = dt * dt;
  const d = Math.min(1, Math.max(0, damping));

  for (const particle of particles) {
    if (particle.invMass === 0) {
      particle.pPrev = { ...particle.p };
      continue;
    }

    const vx = (particle.p.x - particle.pPrev.x) * (1 - d);
    const vy = (particle.p.y - particle.pPrev.y) * (1 - d);

    const next = {
      x: particle.p.x + vx,
      y: particle.p.y + vy + gravity * dt2,
    };

    particle.pPrev = { ...particle.p };
    particle.p = next;
  }
}

export function solveDistanceConstraints(particles: Particle[], constraints: DistanceConstraint[], iterations: number) {
  for (let it = 0; it < iterations; it++) {
    for (const c of constraints) {
      const a = particles[c.i];
      const b = particles[c.j];

      const wA = a.invMass;
      const wB = b.invMass;
      const wSum = wA + wB;
      if (wSum === 0) continue;

      const delta = sub(b.p, a.p);
      const d = len(delta);
      if (d <= 1e-12) continue;

      const diff = (d - c.length) / d;
      const corr = mul(delta, diff);

      a.p = { x: a.p.x + corr.x * (wA / wSum), y: a.p.y + corr.y * (wA / wSum) };
      b.p = { x: b.p.x - corr.x * (wB / wSum), y: b.p.y - corr.y * (wB / wSum) };
    }
  }
}

export function estimateVelocity(p: Particle, dt: number): Vec2 {
  return { x: (p.p.x - p.pPrev.x) / dt, y: (p.p.y - p.pPrev.y) / dt };
}

