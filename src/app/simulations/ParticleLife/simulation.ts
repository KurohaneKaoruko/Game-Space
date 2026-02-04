import { COMPUTE_SHADER, INSTANCED_VERTEX_SHADER, FRAGMENT_SHADER } from './shaders';

export type SimulationConfig = {
  particleCount: number;
  colorsCount: number;
  friction: number;
  forceFactor: number;
  rMax: number;
  dt: number;
  particleSize: number;
  matrix?: number[]; // Flattened NxN
  colors?: string[]; // Hex colors
};

export class ParticleLifeSim {
  private device: GPUDevice | null = null;
  private context: GPUCanvasContext | null = null;
  
  private particleBuffer: GPUBuffer | null = null;
  private paramBuffer: GPUBuffer | null = null;
  private rulesBuffer: GPUBuffer | null = null;
  private colorsBuffer: GPUBuffer | null = null;

  private computePipeline: GPUComputePipeline | null = null;
  private renderPipeline: GPURenderPipeline | null = null;

  private computeBindGroup: GPUBindGroup | null = null;
  private renderBindGroup: GPUBindGroup | null = null;

  private config: SimulationConfig;
  private width = 0;
  private height = 0;
  private isRunning = false;
  private animationId = 0;

  constructor(config: SimulationConfig) {
    this.config = config;
  }

  async init(canvas: HTMLCanvasElement) {
    if (!navigator.gpu) {
      throw new Error("WebGPU not supported on this browser.");
    }

    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      throw new Error("No WebGPU adapter found.");
    }

    this.device = await adapter.requestDevice();
    this.context = canvas.getContext('webgpu') as GPUCanvasContext;

    this.width = canvas.width || 1;
    this.height = canvas.height || 1;

    const format = navigator.gpu.getPreferredCanvasFormat();
    this.context.configure({
      device: this.device,
      format: format,
      alphaMode: 'premultiplied',
    });

    await this.initBuffers();
    await this.initPipelines(format);
    
    this.start();
  }

  private async initBuffers() {
    if (!this.device) return;

    // 1. Particle Buffer
    const particleSize = 32; // bytes
    const totalSize = this.config.particleCount * particleSize;
    
    const initialParticles = new Float32Array(this.config.particleCount * 8);
    for (let i = 0; i < this.config.particleCount; i++) {
      const base = i * 8;
      initialParticles[base + 0] = Math.random() * this.width; // x
      initialParticles[base + 1] = Math.random() * this.height; // y
      initialParticles[base + 2] = 0; // vx
      initialParticles[base + 3] = 0; // vy
      initialParticles[base + 4] = Math.floor(Math.random() * this.config.colorsCount); // color
      // Padding
    }

    this.particleBuffer = this.device.createBuffer({
      size: totalSize,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });
    new Float32Array(this.particleBuffer.getMappedRange()).set(initialParticles);
    this.particleBuffer.unmap();

    // 2. Params Buffer
    // width, height, count, friction, dt, rMax, forceFactor, particleSize
    // 8 floats * 4 = 32 bytes.
    this.paramBuffer = this.device.createBuffer({
      size: 32, 
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.updateParams();

    // 3. Rules Buffer
    // Flattened Matrix. 16x16 = 256 floats.
    // + Count (1 float) -> aligned to 16 bytes.
    // Total 1040 bytes.
    this.rulesBuffer = this.device.createBuffer({
      size: 2048, 
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.updateRules();
    
    // 4. Colors Buffer
    // 16 * vec4<f32> = 16 * 16 bytes = 256 bytes.
    this.colorsBuffer = this.device.createBuffer({
      size: 256,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.updateColors();
  }

  updateParams() {
    if (!this.device || !this.paramBuffer) return;
    const params = new Float32Array([
      this.width,
      this.height,
      this.config.particleCount,
      this.config.friction,
      this.config.dt,
      this.config.rMax,
      this.config.forceFactor,
      this.config.particleSize
    ]);
    this.device.queue.writeBuffer(this.paramBuffer, 0, params);
  }

  updateRules() {
    if (!this.device || !this.rulesBuffer) return;
    
    const N = this.config.colorsCount;
    // Ensure matrix is provided or generated
    if (!this.config.matrix) {
      this.config.matrix = this.generateRandomMatrix(N);
    }
    
    const paddedMatrix = new Float32Array(256);
    // Important: The shader expects matrix[row * 16 + col].
    // If config.matrix is NxN, we need to map it to 16x16.
    const src = this.config.matrix;
    for(let r=0; r<N; r++) {
      for(let c=0; c<N; c++) {
        paddedMatrix[r * 16 + c] = src[r * N + c];
      }
    }
    
    this.device.queue.writeBuffer(this.rulesBuffer, 0, paddedMatrix);
    
    const counts = new Float32Array([N]);
    this.device.queue.writeBuffer(this.rulesBuffer, 1024, counts);
  }
  
  updateColors() {
    if (!this.device || !this.colorsBuffer) return;
    
    const data = new Float32Array(64); // 16 * 4
    const colors = this.config.colors || [];
    
    for (let i = 0; i < 16; i++) {
      if (i < colors.length) {
        const [r, g, b] = this.hexToRgb(colors[i]);
        data[i * 4 + 0] = r;
        data[i * 4 + 1] = g;
        data[i * 4 + 2] = b;
        data[i * 4 + 3] = 1.0;
      } else {
        // Default white
        data[i * 4 + 0] = 1.0;
        data[i * 4 + 1] = 1.0;
        data[i * 4 + 2] = 1.0;
        data[i * 4 + 3] = 1.0;
      }
    }
    
    this.device.queue.writeBuffer(this.colorsBuffer, 0, data);
  }
  
  hexToRgb(hex: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16) / 255,
      parseInt(result[2], 16) / 255,
      parseInt(result[3], 16) / 255
    ] : [1, 1, 1];
  }
  
  generateRandomMatrix(n: number) {
    const m = [];
    for(let i=0; i<n*n; i++) {
      m.push(Math.random() * 2 - 1);
    }
    return m;
  }

  private async createCheckedShaderModule(code: string, label: string) {
    if (!this.device) throw new Error('WebGPU device not initialized');
    const module = this.device.createShaderModule({ code, label });
    const info = await module.getCompilationInfo();
    const errors = info.messages.filter((m) => m.type === 'error');
    if (errors.length > 0) {
      const details = errors
        .map((m) => `${m.lineNum}:${m.linePos} ${m.message}`)
        .join('\n');
      throw new Error(`${label}\n${details}`);
    }
    return module;
  }

  private async initPipelines(format: GPUTextureFormat) {
    if (!this.device || !this.particleBuffer || !this.paramBuffer || !this.rulesBuffer || !this.colorsBuffer) return;

    // --- Compute Pipeline ---
    const computeModule = await this.createCheckedShaderModule(COMPUTE_SHADER, 'ParticleLife/compute.wgsl');

    const computeBindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
        { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
        { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
      ],
    });

    this.computePipeline = this.device.createComputePipeline({
      layout: this.device.createPipelineLayout({ bindGroupLayouts: [computeBindGroupLayout] }),
      compute: { module: computeModule, entryPoint: 'main' },
    });

    this.computeBindGroup = this.device.createBindGroup({
      layout: computeBindGroupLayout,
      entries: [
        { binding: 0, resource: { buffer: this.particleBuffer } },
        { binding: 1, resource: { buffer: this.paramBuffer } },
        { binding: 2, resource: { buffer: this.rulesBuffer } },
      ],
    });

    // --- Render Pipeline ---
    const vertexModule = await this.createCheckedShaderModule(INSTANCED_VERTEX_SHADER, 'ParticleLife/vertex.wgsl');
    const fragmentModule = await this.createCheckedShaderModule(FRAGMENT_SHADER, 'ParticleLife/fragment.wgsl');

    const renderBindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.VERTEX, buffer: { type: 'read-only-storage' } },
        { binding: 1, visibility: GPUShaderStage.VERTEX, buffer: { type: 'uniform' } },
        { binding: 2, visibility: GPUShaderStage.VERTEX, buffer: { type: 'uniform' } },
      ],
    });

    this.renderPipeline = this.device.createRenderPipeline({
      layout: this.device.createPipelineLayout({ bindGroupLayouts: [renderBindGroupLayout] }),
      vertex: {
        module: vertexModule,
        entryPoint: 'main',
      },
      fragment: {
        module: fragmentModule,
        entryPoint: 'main',
        targets: [{ format, blend: {
            color: { srcFactor: 'src-alpha', dstFactor: 'one', operation: 'add' }, // Additive blend
            alpha: { srcFactor: 'one', dstFactor: 'one', operation: 'add' }
        }}],
      },
      primitive: {
        topology: 'triangle-strip',
      },
    });

    this.renderBindGroup = this.device.createBindGroup({
      layout: renderBindGroupLayout,
      entries: [
        { binding: 0, resource: { buffer: this.particleBuffer } },
        { binding: 1, resource: { buffer: this.paramBuffer } },
        { binding: 2, resource: { buffer: this.colorsBuffer } },
      ],
    });
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.loop();
  }

  stop() {
    this.isRunning = false;
    cancelAnimationFrame(this.animationId);
  }

  private loop = () => {
    if (!this.isRunning || !this.device || !this.context || !this.computePipeline || !this.renderPipeline) return;

    const commandEncoder = this.device.createCommandEncoder();

    // 1. Compute Pass
    const computePass = commandEncoder.beginComputePass();
    computePass.setPipeline(this.computePipeline);
    computePass.setBindGroup(0, this.computeBindGroup!);
    const workgroupCount = Math.ceil(this.config.particleCount / 64);
    computePass.dispatchWorkgroups(workgroupCount);
    computePass.end();

    // 2. Render Pass
    const textureView = this.context.getCurrentTexture().createView();
    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: textureView,
          clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 }, // Black bg
          loadOp: 'clear',
          storeOp: 'store',
        },
      ],
    });

    renderPass.setPipeline(this.renderPipeline);
    renderPass.setBindGroup(0, this.renderBindGroup!);
    // Draw 4 vertices (quad) * N instances
    renderPass.draw(4, this.config.particleCount);
    renderPass.end();

    this.device.queue.submit([commandEncoder.finish()]);

    this.animationId = requestAnimationFrame(this.loop);
  };
  
  setConfig(newConfig: Partial<SimulationConfig>) {
    this.config = { ...this.config, ...newConfig };
    this.updateParams();
    if (newConfig.matrix) {
      this.updateRules();
    }
    if (newConfig.colors) {
      this.updateColors();
    }
  }
  
  resize(w: number, h: number) {
    if (w <= 0 || h <= 0) return;
    this.width = w;
    this.height = h;
    this.updateParams();
  }
  
  randomizeRules() {
    const N = this.config.colorsCount;
    this.config.matrix = this.generateRandomMatrix(N);
    this.updateRules();
    return this.config.matrix;
  }
}
