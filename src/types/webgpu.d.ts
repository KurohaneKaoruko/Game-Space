declare global {
  type GPUDevice = any;
  type GPUAdapter = any;
  type GPUCanvasContext = any;
  type GPUBuffer = any;
  type GPUComputePipeline = any;
  type GPURenderPipeline = any;
  type GPUBindGroup = any;
  type GPUBindGroupLayout = any;
  type GPUTextureFormat = any;
  type GPUShaderModule = any;
  type GPUTexture = any;
  type GPUTextureView = any;
  type GPUCommandEncoder = any;
  type GPUComputePassEncoder = any;
  type GPURenderPassEncoder = any;
  type GPUShaderStageFlags = any;
  type GPUBufferUsageFlags = any;
  type GPUColor = any;
  type GPUBlendFactor = any;
  type GPUBlendOperation = any;
  type GPUIndexFormat = any;
  type GPUPrimitiveTopology = any;
  type GPUPipelineLayout = any;
  type GPUQueue = any;

  const GPUShaderStage: any;
  const GPUBufferUsage: any;

  interface Navigator {
    gpu?: any;
  }
}

export {};
