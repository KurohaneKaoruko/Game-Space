import type { EnergySample, PendulumParams, PendulumSnapshot, Vec2 } from './types';
import { add, dist, sub, v } from './vec2';

export const defaultPendulumParams: PendulumParams = {
  mode: 'double',
  integrator: 'verlet',
  gravity: 9.81,
  damping: 0.002,
  lengths: [1.0, 1.0, 1.0],
  masses: [1.0, 1.0, 1.0],
  anglesDeg: [120, -10, 30],
};

export class PendulumSimulation {
  private params: PendulumParams;
  private t = 0;
  private q: number[] = [];
  private qDot: number[] = [];

  constructor(params?: Partial<PendulumParams>) {
    this.params = { ...defaultPendulumParams, ...params };
    this.reset();
  }

  getParams(): PendulumParams {
    return this.params;
  }

  setParams(partial: Partial<PendulumParams>) {
    const next = { ...this.params, ...partial };
    const modeChanged = next.mode !== this.params.mode;
    this.params = next;
    if (modeChanged) {
      this.reset();
      return;
    }
  }

  reset(params?: Partial<PendulumParams>) {
    if (params) this.params = { ...this.params, ...params };

    this.t = 0;

    const n = this.params.mode === 'double' ? 2 : 3;
    const anglesRad = this.params.anglesDeg.slice(0, n).map((a) => (a * Math.PI) / 180);
    this.q = anglesRad;
    this.qDot = new Array(n).fill(0);
  }

  step(dt: number, substeps?: number) {
    if (dt <= 0) return;
    const s = Math.max(1, Math.floor(substeps ?? 2));
    const perDt = dt / s;

    for (let i = 0; i < s; i++) {
      const qDDot = this.computeAccelerations();
      for (let k = 0; k < this.q.length; k++) this.qDot[k] += qDDot[k] * perDt;
      for (let k = 0; k < this.q.length; k++) this.q[k] += this.qDot[k] * perDt;
      this.t += perDt;
    }
  }

  relax(iterations?: number) {
    // No-op without drag
  }

  getSnapshot(dtForEnergy = 1 / 240): PendulumSnapshot {
    const points = this.computePoints();
    const energy = this.computeEnergy();
    return {
      t: this.t,
      anchor: v(0, 0),
      points,
      anglesRad: this.q.slice(),
      params: this.params,
      energy,
    };
  }

  private computePoints(): Vec2[] {
    const count = this.params.mode === 'double' ? 2 : 3;
    const lengths = this.params.lengths.slice(0, count).map((L) => Math.max(0.05, L));

    const points: Vec2[] = [];
    let current = v(0, 0);
    for (let i = 0; i < count; i++) {
      const next = add(current, v(lengths[i] * Math.sin(this.q[i]), lengths[i] * Math.cos(this.q[i])));
      points.push(next);
      current = next;
    }
    return points;
  }

  private computeVelocities(): Vec2[] {
    const count = this.params.mode === 'double' ? 2 : 3;
    const lengths = this.params.lengths.slice(0, count).map((L) => Math.max(0.05, L));
    const vels: Vec2[] = [];

    for (let k = 0; k < count; k++) {
      let xDot = 0;
      let yDot = 0;
      for (let i = 0; i <= k; i++) {
        const L = lengths[i];
        const q = this.q[i];
        const qd = this.qDot[i];
        xDot += L * Math.cos(q) * qd;
        yDot += -L * Math.sin(q) * qd;
      }
      vels.push(v(xDot, yDot));
    }
    return vels;
  }

  private computeEnergy(): EnergySample {
    const count = this.params.mode === 'double' ? 2 : 3;
    const g = this.params.gravity;
    const masses = this.params.masses.slice(0, count).map((m) => Math.max(0.001, m));
    const refY = this.params.lengths.slice(0, count).reduce((a, b) => a + Math.max(0.05, b), 0);
    const points = this.computePoints();
    const vels = this.computeVelocities();

    let kinetic = 0;
    let potential = 0;
    for (let i = 0; i < count; i++) {
      const m = masses[i];
      const vel = vels[i];
      kinetic += 0.5 * m * (vel.x * vel.x + vel.y * vel.y);
      potential += m * g * (refY - points[i].y);
    }

    const total = kinetic + potential;
    return { t: this.t, kinetic, potential, total };
  }

  private computeAccelerations(): number[] {
    const n = this.params.mode === 'double' ? 2 : 3;
    const L = this.params.lengths.slice(0, n).map((x) => Math.max(0.05, x));
    const m = this.params.masses.slice(0, n).map((x) => Math.max(0.001, x));
    const g = this.params.gravity;
    const d = Math.max(0, this.params.damping);

    const weightFrom = (start: number) => {
      let s = 0;
      for (let i = start; i < n; i++) s += m[i];
      return s;
    };

    const M: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const w = weightFrom(Math.max(i, j));
        M[i][j] = w * L[i] * L[j] * Math.cos(this.q[i] - this.q[j]);
      }
    }

    const dM = (i: number, j: number, k: number) => {
      if (i === j) return 0;
      const w = weightFrom(Math.max(i, j));
      const base = w * L[i] * L[j];
      const s = Math.sin(this.q[i] - this.q[j]);
      if (k === i) return -base * s;
      if (k === j) return base * s;
      return 0;
    };

    const h = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      let sum = 0;
      for (let j = 0; j < n; j++) {
        for (let k = 0; k < n; k++) {
          const c = 0.5 * (dM(i, j, k) + dM(i, k, j) - dM(j, k, i));
          sum += c * this.qDot[j] * this.qDot[k];
        }
      }
      h[i] = sum;
    }

    const G = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      G[i] = weightFrom(i) * g * L[i] * Math.sin(this.q[i]);
    }

    const rhs = new Array(n).fill(0);
    for (let i = 0; i < n; i++) rhs[i] = -(h[i] + G[i] + d * this.qDot[i]);

    return solveLinearSystem(M, rhs);
  }

  getConstraintErrors(): number[] {
    const count = this.params.mode === 'double' ? 2 : 3;
    const lengths = this.params.lengths.slice(0, count).map((L) => Math.max(0.05, L));
    const points = this.computePoints();
    const errors: number[] = [];
    errors.push(dist(v(0, 0), points[0]) - lengths[0]);
    errors.push(dist(points[0], points[1]) - lengths[1]);
    if (count === 3) errors.push(dist(points[1], points[2]) - lengths[2]);
    return errors;
  }
}

function solveLinearSystem(M: number[][], b: number[]): number[] {
  const n = b.length;
  const A = M.map((row) => row.slice());
  const x = b.slice();

  for (let col = 0; col < n; col++) {
    let pivot = col;
    let best = Math.abs(A[col][col]);
    for (let r = col + 1; r < n; r++) {
      const v = Math.abs(A[r][col]);
      if (v > best) {
        best = v;
        pivot = r;
      }
    }

    if (best < 1e-12) return new Array(n).fill(0);
    if (pivot !== col) {
      const tmpRow = A[col];
      A[col] = A[pivot];
      A[pivot] = tmpRow;
      const tmpX = x[col];
      x[col] = x[pivot];
      x[pivot] = tmpX;
    }

    const inv = 1 / A[col][col];
    for (let c = col; c < n; c++) A[col][c] *= inv;
    x[col] *= inv;

    for (let r = col + 1; r < n; r++) {
      const f = A[r][col];
      if (f === 0) continue;
      for (let c = col; c < n; c++) A[r][c] -= f * A[col][c];
      x[r] -= f * x[col];
    }
  }

  const out = new Array(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    let s = x[r];
    for (let c = r + 1; c < n; c++) s -= A[r][c] * out[c];
    out[r] = s;
  }
  return out;
}
