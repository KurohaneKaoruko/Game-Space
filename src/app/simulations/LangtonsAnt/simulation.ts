export type AntColorTheme = 'dark' | 'light';

type Ant = {
  x: number;
  y: number;
  dir: 0 | 1 | 2 | 3;
  color: string;
};

export type LangtonsAntConfig = {
  cellSizePx: number;
  ants: number;
  stepsPerSecond: number;
  wrap: boolean;
  syncUpdate: boolean;
  theme: AntColorTheme;
  density: number;
};

export class LangtonsAntSim {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private offscreen: HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D;

  private width = 1;
  private height = 1;
  private cols = 1;
  private rows = 1;
  private cellSizePx = 6;

  private grid = new Uint8Array(1);
  private ants: Ant[] = [];
  private stepCount = 0;

  private bg = '#18181B';
  private fg = '#F4F4F5';
  private antColors = ['#EF4444', '#22C55E', '#3B82F6', '#EAB308', '#06B6D4', '#D946EF'];

  private running = false;
  private raf = 0;
  private lastTime = 0;
  private accSteps = 0;
  private stepsPerSecond = 600;
  private wrap = true;
  private syncUpdate = false;

  private toggleMask = new Uint8Array(1);
  private touched = new Int32Array(1);
  private nextX = new Int32Array(1);
  private nextY = new Int32Array(1);
  private nextDir = new Uint8Array(1);

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Failed to get 2D context');
    this.ctx = ctx;
    this.ctx.imageSmoothingEnabled = false;

    const off = document.createElement('canvas');
    const offCtx = off.getContext('2d', { alpha: false });
    if (!offCtx) throw new Error('Failed to get offscreen 2D context');
    this.offscreen = off;
    this.offscreenCtx = offCtx;
    this.offscreenCtx.imageSmoothingEnabled = false;
  }

  getStats() {
    return { steps: this.stepCount, ants: this.ants.length, cols: this.cols, rows: this.rows };
  }

  setConfig(next: Partial<LangtonsAntConfig>) {
    if (typeof next.stepsPerSecond === 'number') this.stepsPerSecond = Math.max(1, Math.floor(next.stepsPerSecond));
    if (typeof next.wrap === 'boolean') this.wrap = next.wrap;
    if (typeof next.syncUpdate === 'boolean') this.syncUpdate = next.syncUpdate;
    if (next.theme) this.setTheme(next.theme);
    if (typeof next.ants === 'number') this.setAntCount(next.ants);
  }

  resize(width: number, height: number, cellSizePx: number) {
    this.width = Math.max(1, Math.floor(width));
    this.height = Math.max(1, Math.floor(height));
    this.cellSizePx = Math.max(1, Math.floor(cellSizePx));

    this.cols = Math.max(1, Math.floor(this.width / this.cellSizePx));
    this.rows = Math.max(1, Math.floor(this.height / this.cellSizePx));

    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.ctx.imageSmoothingEnabled = false;

    this.offscreen.width = this.cols;
    this.offscreen.height = this.rows;
    this.offscreenCtx.imageSmoothingEnabled = false;

    this.grid = new Uint8Array(this.cols * this.rows);
    this.toggleMask = new Uint8Array(this.grid.length);
    this.stepCount = 0;
    this.resetAnts(this.ants.length || 1);
    this.redrawOffscreen();
    this.render();
  }

  setTheme(theme: AntColorTheme) {
    if (theme === 'light') {
      this.bg = '#FFFFFF';
      this.fg = '#0A0A0A';
    } else {
      this.bg = '#18181B';
      this.fg = '#F4F4F5';
    }
    this.redrawOffscreen();
    this.render();
  }

  setAntCount(count: number) {
    const next = Math.max(1, Math.min(32, Math.floor(count)));
    this.resetAnts(next);
    this.render();
  }

  randomize(density: number) {
    const d = Math.min(1, Math.max(0, density));
    for (let i = 0; i < this.grid.length; i++) {
      this.grid[i] = Math.random() < d ? 1 : 0;
    }
    this.stepCount = 0;
    this.redrawOffscreen();
    this.render();
  }

  clear() {
    this.grid.fill(0);
    this.stepCount = 0;
    this.redrawOffscreen();
    this.render();
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.accSteps = 0;
    this.loop();
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  step(generations: number) {
    const g = Math.max(1, Math.floor(generations));
    for (let i = 0; i < g; i++) this.stepOneGeneration();
    this.render();
  }

  toggleCellAt(px: number, py: number) {
    const x = Math.floor(px / this.cellSizePx);
    const y = Math.floor(py / this.cellSizePx);
    if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) return;
    const idx = y * this.cols + x;
    this.grid[idx] = this.grid[idx] ? 0 : 1;
    this.offscreenCtx.fillStyle = this.grid[idx] ? this.fg : this.bg;
    this.offscreenCtx.fillRect(x, y, 1, 1);
    this.render();
  }

  private resetAnts(count: number) {
    const cx = Math.floor(this.cols / 2);
    const cy = Math.floor(this.rows / 2);
    const ants: Ant[] = [];
    for (let i = 0; i < count; i++) {
      const dx = (i % 8) - 3;
      const dy = Math.floor(i / 8) - 1;
      const color = this.antColors[i % this.antColors.length];
      const dir = (i % 4) as 0 | 1 | 2 | 3;
      ants.push({ x: (cx + dx + this.cols) % this.cols, y: (cy + dy + this.rows) % this.rows, dir, color });
    }
    this.ants = ants;
    this.ensureScratch();
  }

  private stepOneGeneration() {
    if (this.syncUpdate) {
      this.stepOneGenerationSync();
    } else {
      this.stepOneGenerationSequential();
    }
  }

  private stepOneGenerationSequential() {
    const w = this.cols;
    const h = this.rows;

    for (let a = 0; a < this.ants.length; a++) {
      const ant = this.ants[a];
      const idx = ant.y * w + ant.x;
      const cell = this.grid[idx];

      if (cell === 0) ant.dir = (((ant.dir + 1) & 3) as 0 | 1 | 2 | 3);
      else ant.dir = (((ant.dir + 3) & 3) as 0 | 1 | 2 | 3);

      this.grid[idx] = cell ? 0 : 1;
      this.offscreenCtx.fillStyle = this.grid[idx] ? this.fg : this.bg;
      this.offscreenCtx.fillRect(ant.x, ant.y, 1, 1);

      if (ant.dir === 0) ant.y -= 1;
      else if (ant.dir === 1) ant.x += 1;
      else if (ant.dir === 2) ant.y += 1;
      else ant.x -= 1;

      if (this.wrap) {
        ant.x = (ant.x + w) % w;
        ant.y = (ant.y + h) % h;
      } else {
        if (ant.x < 0) {
          ant.x = 0;
          ant.dir = 1;
        } else if (ant.x >= w) {
          ant.x = w - 1;
          ant.dir = 3;
        }
        if (ant.y < 0) {
          ant.y = 0;
          ant.dir = 2;
        } else if (ant.y >= h) {
          ant.y = h - 1;
          ant.dir = 0;
        }
      }
    }

    this.stepCount += 1;
  }

  private stepOneGenerationSync() {
    const w = this.cols;
    const h = this.rows;
    const oldGrid = this.grid;

    const n = this.ants.length;
    this.ensureScratch();

    let touchedCount = 0;

    for (let a = 0; a < n; a++) {
      const ant = this.ants[a];
      const idx = ant.y * w + ant.x;
      const cell = oldGrid[idx];

      let dir = ant.dir;
      if (cell === 0) dir = (((dir + 1) & 3) as 0 | 1 | 2 | 3);
      else dir = (((dir + 3) & 3) as 0 | 1 | 2 | 3);

      this.nextDir[a] = dir;

      if (this.toggleMask[idx] === 0) this.touched[touchedCount++] = idx;
      this.toggleMask[idx] ^= 1;

      let nx = ant.x;
      let ny = ant.y;
      if (dir === 0) ny -= 1;
      else if (dir === 1) nx += 1;
      else if (dir === 2) ny += 1;
      else nx -= 1;

      if (this.wrap) {
        nx = (nx + w) % w;
        ny = (ny + h) % h;
      } else {
        if (nx < 0) {
          nx = 0;
          dir = 1;
        } else if (nx >= w) {
          nx = w - 1;
          dir = 3;
        }
        if (ny < 0) {
          ny = 0;
          dir = 2;
        } else if (ny >= h) {
          ny = h - 1;
          dir = 0;
        }
        this.nextDir[a] = dir;
      }

      this.nextX[a] = nx;
      this.nextY[a] = ny;
    }

    for (let i = 0; i < touchedCount; i++) {
      const idx = this.touched[i];
      if (this.toggleMask[idx] === 1) {
        oldGrid[idx] ^= 1;
        this.offscreenCtx.fillStyle = oldGrid[idx] ? this.fg : this.bg;
        const x = idx % w;
        const y = Math.floor(idx / w);
        this.offscreenCtx.fillRect(x, y, 1, 1);
      }
      this.toggleMask[idx] = 0;
    }

    for (let a = 0; a < n; a++) {
      const ant = this.ants[a];
      ant.x = this.nextX[a];
      ant.y = this.nextY[a];
      ant.dir = (this.nextDir[a] as 0 | 1 | 2 | 3);
    }

    this.stepCount += 1;
  }

  private ensureScratch() {
    const n = Math.max(1, this.ants.length);
    if (this.touched.length !== n) this.touched = new Int32Array(n);
    if (this.nextX.length !== n) this.nextX = new Int32Array(n);
    if (this.nextY.length !== n) this.nextY = new Int32Array(n);
    if (this.nextDir.length !== n) this.nextDir = new Uint8Array(n);
  }

  private redrawOffscreen() {
    this.offscreenCtx.fillStyle = this.bg;
    this.offscreenCtx.fillRect(0, 0, this.cols, this.rows);
    this.offscreenCtx.fillStyle = this.fg;
    for (let i = 0; i < this.grid.length; i++) {
      if (!this.grid[i]) continue;
      const x = i % this.cols;
      const y = Math.floor(i / this.cols);
      this.offscreenCtx.fillRect(x, y, 1, 1);
    }
  }

  private render() {
    this.ctx.fillStyle = this.bg;
    this.ctx.fillRect(0, 0, this.width, this.height);

    const dw = this.cols * this.cellSizePx;
    const dh = this.rows * this.cellSizePx;
    this.ctx.drawImage(this.offscreen, 0, 0, this.cols, this.rows, 0, 0, dw, dh);

    for (let i = 0; i < this.ants.length; i++) {
      const ant = this.ants[i];
      const x = ant.x * this.cellSizePx;
      const y = ant.y * this.cellSizePx;
      this.ctx.fillStyle = ant.color;
      this.ctx.fillRect(x, y, this.cellSizePx, this.cellSizePx);
    }
  }

  private loop = (t: number = performance.now()) => {
    if (!this.running) return;
    const dt = Math.min(0.1, Math.max(0, (t - this.lastTime) / 1000));
    this.lastTime = t;

    this.accSteps += dt * this.stepsPerSecond;
    const maxGen = 5000;
    let gen = Math.floor(this.accSteps);
    if (gen > maxGen) gen = maxGen;
    if (gen >= 1) {
      for (let i = 0; i < gen; i++) this.stepOneGeneration();
      this.accSteps -= gen;
    }

    this.render();
    this.raf = requestAnimationFrame(this.loop);
  };
}
