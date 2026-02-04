'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Navigation from '../../components/Navigation';
import { 
  decodeImageStringAsync, 
  encodeImageBytesAsync, 
  VERSION_BASE91, 
  VERSION_BASE32K, 
  VERSION_GZIP_BASE32K,
  VERSION_AUTO
} from '../../../utils/imageStringCodec';

type OutputFormat = 'image/webp' | 'image/jpeg';
type Mode = 'encode' | 'decode';
type EncodingVersion = typeof VERSION_BASE91 | typeof VERSION_BASE32K | typeof VERSION_GZIP_BASE32K | typeof VERSION_AUTO;

function bytesToSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function extFromMime(mime: string): string {
  if (mime === 'image/png') return 'png';
  if (mime === 'image/jpeg') return 'jpg';
  if (mime === 'image/webp') return 'webp';
  if (mime === 'image/gif') return 'gif';
  return 'bin';
}

async function fileToBytes(file: File): Promise<Uint8Array> {
  const buffer = await file.arrayBuffer();
  return new Uint8Array(buffer);
}

async function reencodeImage(
  file: File,
  options: { mime: OutputFormat; quality: number }
): Promise<Uint8Array> {
  const imgUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new window.Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('图片加载失败'));
      el.src = imgUrl;
    });

    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 不可用');
    ctx.drawImage(img, 0, 0);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('图片压缩失败'))),
        options.mime,
        Math.min(1, Math.max(0, options.quality / 100))
      );
    });
    return new Uint8Array(await blob.arrayBuffer());
  } finally {
    URL.revokeObjectURL(imgUrl);
  }
}

export default function ImageStringCodecPage() {
  const [mode, setMode] = useState<Mode>('encode');
  const [encodeFile, setEncodeFile] = useState<File | null>(null);
  const [encodeError, setEncodeError] = useState<string>('');
  const [encodeResult, setEncodeResult] = useState<string>('');
  const [encodeInputMime, setEncodeInputMime] = useState<string>('');
  const [encodeInputBytes, setEncodeInputBytes] = useState<number>(0);
  const [encodeOutputMime, setEncodeOutputMime] = useState<string>('');
  const [encodeOutputBytes, setEncodeOutputBytes] = useState<number>(0);
  const [encodingVersion, setEncodingVersion] = useState<EncodingVersion>(VERSION_AUTO);

  const [compressEnabled, setCompressEnabled] = useState<boolean>(true);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('image/webp');
  const [quality, setQuality] = useState<number>(80);

  const [decodeInput, setDecodeInput] = useState<string>('');
  const [decodeError, setDecodeError] = useState<string>('');
  const [decodedMime, setDecodedMime] = useState<string>('');
  const [decodedBytes, setDecodedBytes] = useState<Uint8Array | null>(null);

  const [encodePreviewUrl, setEncodePreviewUrl] = useState<string>('');
  const [decodePreviewUrl, setDecodePreviewUrl] = useState<string>('');
  
  const [previewFit, setPreviewFit] = useState<'contain' | 'cover'>('contain');
  const [imgDims, setImgDims] = useState<{w: number; h: number} | null>(null);

  useEffect(() => {
    if (!encodeFile) {
      setEncodePreviewUrl('');
      setImgDims(null);
      return;
    }
    const url = URL.createObjectURL(encodeFile);
    setEncodePreviewUrl(url);
    // Reset dims when file changes, will be set by onLoad
    setImgDims(null);
    return () => URL.revokeObjectURL(url);
  }, [encodeFile]);

  useEffect(() => {
    if (!decodedBytes || !decodedMime) {
      setDecodePreviewUrl('');
      setImgDims(null);
      return;
    }
    const url = URL.createObjectURL(new Blob([decodedBytes as unknown as BlobPart], { type: decodedMime }));
    setDecodePreviewUrl(url);
    setImgDims(null);
    return () => URL.revokeObjectURL(url);
  }, [decodedBytes, decodedMime]);

  useEffect(() => {
    if (mode === 'encode') setDecodeError('');
    if (mode === 'decode') setEncodeError('');
  }, [mode]);

  const encodedLength = useMemo(() => encodeResult.length, [encodeResult]);
  const decodeInputTrimmed = useMemo(() => decodeInput.trim(), [decodeInput]);

  const decodedSize = decodedBytes ? decodedBytes.byteLength : 0;

  const canDecode = decodeInputTrimmed.length > 0;

  async function onPickEncodeFile(file: File | null) {
    setEncodeError('');
    setEncodeResult('');
    setEncodeInputMime('');
    setEncodeInputBytes(0);
    setEncodeOutputMime('');
    setEncodeOutputBytes(0);
    setEncodeFile(file);
    if (!file) return;
    setEncodeInputMime(file.type || 'application/octet-stream');
    setEncodeInputBytes(file.size);
  }

  async function onEncode() {
    setEncodeError('');
    setEncodeResult('');
    setEncodeOutputMime('');
    setEncodeOutputBytes(0);

    if (!encodeFile) {
      setEncodeError('请先选择一张图片');
      return;
    }

    try {
      const mime = compressEnabled ? outputFormat : encodeFile.type || 'application/octet-stream';
      const bytes = compressEnabled
        ? await reencodeImage(encodeFile, { mime: outputFormat, quality })
        : await fileToBytes(encodeFile);

      const encoded = await encodeImageBytesAsync({ bytes, mime }, encodingVersion);
      setEncodeOutputMime(mime);
      setEncodeOutputBytes(bytes.byteLength);
      setEncodeResult(encoded);
    } catch (e) {
      const message = e instanceof Error ? e.message : '编码失败';
      setEncodeError(message);
    }
  }

  async function onCopyEncoded() {
    if (!encodeResult) return;
    try {
      await navigator.clipboard.writeText(encodeResult);
    } catch {
      setEncodeError('复制失败：浏览器不允许写入剪贴板');
    }
  }

  function onClearDecode() {
    setDecodeInput('');
    setDecodeError('');
    setDecodedBytes(null);
    setDecodedMime('');
  }

  async function onDecode() {
    setDecodeError('');
    setDecodedBytes(null);
    setDecodedMime('');

    if (!canDecode) {
      setDecodeError('请输入编码字符串');
      return;
    }

    try {
      const decoded = await decodeImageStringAsync(decodeInputTrimmed);
      setDecodedBytes(decoded.bytes);
      setDecodedMime(decoded.mime);
    } catch (e) {
      const message = e instanceof Error ? e.message : '解码失败';
      setDecodeError(message);
    }
  }

  function onDownloadDecoded() {
    if (!decodedBytes || !decodedMime) return;
    const blob = new Blob([decodedBytes as unknown as BlobPart], { type: decodedMime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `decoded.${extFromMime(decodedMime)}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const qualityHint = useMemo(() => {
    if (!compressEnabled) return '';
    if (outputFormat === 'image/jpeg') return 'JPEG 不支持透明通道 (NO_ALPHA)';
    return 'WebP 体积更小且支持透明 (RECOMMENDED)';
  }, [compressEnabled, outputFormat]);

  return (
    <main className="min-h-screen bg-white">
      <Navigation title="IMG_STRING_CODEC" />

      <div className="pt-20 pb-6 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-none">
          <div className="flex flex-col lg:flex-row gap-6 items-stretch h-[calc(100vh-8rem)]">
            {mode === 'encode' ? (
              <>
                <section className="bg-zinc-50 tech-border p-4 lg:w-[280px] lg:shrink-0 border border-zinc-200 shadow-sm transition-all duration-300 flex flex-col overflow-y-auto">
                  <div className="flex flex-col gap-3 mb-4 pb-3 border-b border-zinc-200">
                     <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"></div>
                        <h1 className="text-sm font-bold text-zinc-900 tracking-tight">IMAGE_PROCESSOR</h1>
                     </div>
                     <div className="flex bg-zinc-100 p-0.5 rounded-md border border-zinc-200">
                        <button onClick={() => setMode('encode')} className="flex-1 py-1 text-[10px] font-bold tracking-wider uppercase rounded-sm transition-all bg-white text-blue-600 shadow-sm">编码 (ENCODE)</button>
                        <button onClick={() => setMode('decode')} className="flex-1 py-1 text-[10px] font-bold tracking-wider uppercase rounded-sm transition-all text-zinc-500 hover:text-zinc-900">解码 (DECODE)</button>
                     </div>
                  </div>

                  <h2 className="text-xs font-bold text-zinc-900 mb-3 flex items-center gap-2">
                    <span className="w-0.5 h-2.5 bg-blue-600"></span>
                    设置 (SETTINGS)
                  </h2>

                  <div className="space-y-6">
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => onPickEncodeFile(e.target.files?.[0] ?? null)}
                        className="block w-full text-sm text-zinc-500 
                          file:mr-4 file:py-2 file:px-4 
                          file:rounded-md file:border-0
                          file:text-sm file:font-semibold
                          file:bg-blue-50 file:text-blue-700
                          hover:file:bg-blue-100 cursor-pointer"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-px bg-zinc-200 border border-zinc-200 rounded-lg overflow-hidden">
                      <div className="bg-zinc-50 p-3">
                        <div className="text-[10px] text-zinc-500 font-mono uppercase mb-1">输入格式 (MIME)</div>
                        <div className="font-mono text-xs text-zinc-900 break-all">
                          {encodeInputMime || 'NULL'}
                        </div>
                      </div>
                      <div className="bg-zinc-50 p-3">
                        <div className="text-[10px] text-zinc-500 font-mono uppercase mb-1">原始大小 (SIZE)</div>
                        <div className="font-mono text-xs text-zinc-900">
                          {bytesToSize(encodeInputBytes)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-zinc-100">
                      <label className="flex items-center gap-3 text-sm text-zinc-600 cursor-pointer group">
                        <div className={`w-4 h-4 border flex items-center justify-center transition-colors rounded ${compressEnabled ? 'border-blue-600 bg-blue-600' : 'border-zinc-300 bg-white'}`}>
                          {compressEnabled && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <input
                          type="checkbox"
                          checked={compressEnabled}
                          onChange={(e) => setCompressEnabled(e.target.checked)}
                          className="hidden"
                        />
                        <span className="font-mono text-xs uppercase tracking-wider group-hover:text-zinc-900">启用压缩 (COMPRESS)</span>
                      </label>
                      {qualityHint ? <span className="text-[10px] text-blue-600/80 font-mono">{qualityHint}</span> : null}
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-[10px] text-zinc-500 font-mono uppercase mb-2">编码算法 (ALGORITHM)</label>
                        <select
                          value={encodingVersion}
                          onChange={(e) => setEncodingVersion(Number(e.target.value) as EncodingVersion)}
                          className="w-full bg-zinc-50 border border-zinc-200 text-zinc-900 px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none rounded-md"
                        >
                          <option value={VERSION_AUTO}>Auto (Best)</option>
                          <option value={VERSION_BASE32K}>Base32k (Standard)</option>
                          <option value={VERSION_GZIP_BASE32K}>Base32k + Gzip (High Compression)</option>
                          <option value={VERSION_BASE91}>Base91 + RLE (Legacy)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] text-zinc-500 font-mono uppercase mb-2">输出格式 (FORMAT)</label>
                        <select
                          disabled={!compressEnabled}
                          value={outputFormat}
                          onChange={(e) => setOutputFormat(e.target.value as OutputFormat)}
                          className="w-full bg-zinc-50 border border-zinc-200 text-zinc-900 px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none disabled:opacity-50 rounded-md"
                        >
                          <option value="image/webp">WEBP</option>
                          <option value="image/jpeg">JPEG</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] text-zinc-500 font-mono uppercase mb-2">质量 (QUALITY): {quality}%</label>
                        <input
                          disabled={!compressEnabled}
                          type="range"
                          min={0}
                          max={100}
                          value={quality}
                          onChange={(e) => setQuality(Number(e.target.value))}
                          className="w-full h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50 accent-blue-600"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={onEncode}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white text-[10px] font-bold tracking-widest uppercase hover:bg-blue-700 transition-colors shadow-sm rounded-md"
                      >
                        执行编码 (EXECUTE)
                      </button>
                      <button
                        onClick={() => onPickEncodeFile(null)}
                        className="px-3 py-2 border border-zinc-200 text-zinc-500 text-[10px] font-bold tracking-widest uppercase hover:text-zinc-900 hover:bg-zinc-50 transition-colors rounded-md"
                      >
                        重置
                      </button>
                    </div>

                    {encodeError ? (
                      <div className="text-xs text-red-600 bg-red-50 border border-red-100 p-3 font-mono rounded-md">
                        [错误]: {encodeError}
                      </div>
                    ) : null}
                  </div>
                </section>

                <section className="flex-1 bg-zinc-50 tech-border p-6 border border-zinc-200 shadow-sm flex flex-col min-h-0 transition-all duration-300">
                  <h2 className="text-lg font-bold text-zinc-900 mb-6 flex items-center gap-2">
                    <span className="w-1 h-4 bg-blue-600"></span>
                    预览与输出 (PREVIEW_AND_OUTPUT)
                  </h2>

                  <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
                    <div className="relative flex-1 bg-zinc-100 border border-zinc-200 overflow-hidden group rounded-md">
                      {/* 网格背景 */}
                      <div className="absolute inset-0 opacity-10 pointer-events-none" 
                           style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                      </div>
                      
                      {/* 装饰角标 */}
                      <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-blue-500/50"></div>
                      <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-blue-500/50"></div>
                      <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-blue-500/50"></div>
                      <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-blue-500/50"></div>

                      {/* Controls Overlay */}
                      <div className="absolute top-2 right-2 z-20 flex gap-2">
                        <button
                          onClick={() => setPreviewFit(prev => prev === 'contain' ? 'cover' : 'contain')}
                          className="bg-white/90 backdrop-blur border border-zinc-200 p-1.5 rounded hover:bg-white text-zinc-600 hover:text-blue-600 transition-colors"
                          title={previewFit === 'contain' ? 'Switch to Cover' : 'Switch to Contain'}
                        >
                          {previewFit === 'contain' ? (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3" /></svg>
                          )}
                        </button>
                      </div>

                      {encodePreviewUrl ? (
                        <>
                          <Image 
                            src={encodePreviewUrl} 
                            alt="预览" 
                            fill
                            unoptimized
                            className={`object-${previewFit} relative z-10 transition-all duration-300`}
                            onLoad={(e) => setImgDims({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
                          />
                          {/* HUD Bar */}
                          <div className="absolute bottom-0 left-0 right-0 bg-zinc-900/80 backdrop-blur-md border-t border-zinc-700 p-2 z-20 flex items-center justify-between text-[10px] font-mono text-zinc-300">
                            <div className="flex gap-4">
                               <span>MIME: <span className="text-white">{encodeOutputMime || encodeInputMime || '-'}</span></span>
                               <span>大小 (SIZE): <span className="text-white">{encodeOutputBytes ? bytesToSize(encodeOutputBytes) : bytesToSize(encodeInputBytes)}</span></span>
                            </div>
                            <div>
                              {imgDims && <span>{imgDims.w} x {imgDims.h} PX</span>}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-400 font-mono text-xs uppercase tracking-widest">
                          等待输入信号 (Awaiting_Input_Signal)...
                        </div>
                      )}
                    </div>

                    <div className="lg:w-[320px] lg:shrink-0 flex flex-col gap-2 min-w-0">
                       <div className="flex items-center justify-between shrink-0">
                          <label className="text-[10px] text-zinc-500 font-mono uppercase">输出字符串 (OUTPUT) {encodeResult ? `(Length: ${encodedLength})` : ''}</label>
                          <button
                            onClick={onCopyEncoded}
                            disabled={!encodeResult}
                            className="text-[10px] font-bold tracking-widest uppercase text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                          >
                            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse"></span>
                            复制数据 (COPY)
                          </button>
                       </div>
                       <textarea
                          value={encodeResult}
                          readOnly
                          className="flex-1 w-full bg-zinc-50 border border-zinc-200 px-3 py-2 text-xs font-mono leading-5 text-blue-900 whitespace-pre-wrap break-all focus:outline-none focus:border-blue-500/50 resize-none custom-scrollbar rounded-md"
                          placeholder="// 生成的数据将显示在这里 (GENERATED_DATA_WILL_APPEAR_HERE)"
                        />
                    </div>
                  </div>
                </section>
              </>
            ) : (
              <>
                <section className="bg-zinc-50 tech-border p-4 lg:w-[280px] lg:shrink-0 border border-zinc-200 shadow-sm transition-all duration-300 flex flex-col overflow-y-auto">
                  <div className="flex flex-col gap-3 mb-4 pb-3 border-b border-zinc-200">
                     <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)] animate-pulse"></div>
                        <h1 className="text-sm font-bold text-zinc-900 tracking-tight">IMAGE_PROCESSOR</h1>
                     </div>
                     <div className="flex bg-zinc-100 p-0.5 rounded-md border border-zinc-200">
                        <button onClick={() => setMode('encode')} className="flex-1 py-1 text-[10px] font-bold tracking-wider uppercase rounded-sm transition-all text-zinc-500 hover:text-zinc-900">编码 (ENCODE)</button>
                        <button onClick={() => setMode('decode')} className="flex-1 py-1 text-[10px] font-bold tracking-wider uppercase rounded-sm transition-all bg-white text-blue-600 shadow-sm">解码 (DECODE)</button>
                     </div>
                  </div>

                  <h2 className="text-xs font-bold text-zinc-900 mb-3 flex items-center gap-2">
                    <span className="w-0.5 h-2.5 bg-blue-600"></span>
                    解码输入 (DECODE_INPUT)
                  </h2>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] text-zinc-500 font-mono uppercase mb-2">输入字符串 (INPUT_STRING)</label>
                      <textarea
                        value={decodeInput}
                        onChange={(e) => setDecodeInput(e.target.value)}
                        rows={12}
                        className="w-full bg-zinc-50 border border-zinc-200 px-3 py-2 text-xs font-mono leading-5 text-blue-900 whitespace-pre-wrap break-all focus:outline-none focus:border-blue-500/50 resize-none rounded-md"
                        placeholder="// 在此粘贴编码数据 (PASTE_ENCODED_DATA_HERE)"
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={onDecode}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white text-[10px] font-bold tracking-widest uppercase hover:bg-blue-700 transition-colors shadow-sm rounded-md"
                      >
                        执行解码 (EXECUTE)
                      </button>
                      <button
                        onClick={onClearDecode}
                        className="px-3 py-2 border border-zinc-200 text-zinc-500 text-[10px] font-bold tracking-widest uppercase hover:text-zinc-900 hover:bg-zinc-50 transition-colors rounded-md"
                      >
                        清空
                      </button>
                    </div>

                    {decodeError ? (
                      <div className="text-xs text-red-600 bg-red-50 border border-red-100 p-3 font-mono rounded-md">
                        [错误]: {decodeError}
                      </div>
                    ) : null}

                    <div className="grid grid-cols-2 gap-px bg-zinc-200 border border-zinc-200 rounded-lg overflow-hidden">
                      <div className="bg-zinc-50 p-3">
                        <div className="text-[10px] text-zinc-500 font-mono uppercase mb-1">MIME 类型</div>
                        <div className="font-mono text-xs text-zinc-900 break-all">{decodedMime || 'NULL'}</div>
                      </div>
                      <div className="bg-zinc-50 p-3">
                        <div className="text-[10px] text-zinc-500 font-mono uppercase mb-1">字节大小 (SIZE)</div>
                        <div className="font-mono text-xs text-zinc-900">{decodedBytes ? bytesToSize(decodedBytes.byteLength) : 'NULL'}</div>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="flex-1 bg-zinc-50 tech-border p-6 border border-zinc-200 shadow-sm flex flex-col min-h-0 transition-all duration-300">
                  <h2 className="text-lg font-bold text-zinc-900 mb-6 flex items-center gap-2">
                    <span className="w-1 h-4 bg-blue-600"></span>
                    可视化 (VISUALIZATION)
                  </h2>

                  <div className="flex-1 flex flex-col gap-4 min-h-0">
                    <div className="relative flex-1 bg-zinc-100 border border-zinc-200 overflow-hidden group rounded-md">
                      {/* 网格背景 */}
                      <div className="absolute inset-0 opacity-10 pointer-events-none" 
                           style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                      </div>
                      
                      {/* 装饰角标 */}
                      <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-blue-500/50"></div>
                      <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-blue-500/50"></div>
                      <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-blue-500/50"></div>
                      <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-blue-500/50"></div>

                      {/* Controls Overlay */}
                      <div className="absolute top-2 right-2 z-20 flex gap-2">
                        <button
                          onClick={() => setPreviewFit(prev => prev === 'contain' ? 'cover' : 'contain')}
                          className="bg-white/90 backdrop-blur border border-zinc-200 p-1.5 rounded hover:bg-white text-zinc-600 hover:text-blue-600 transition-colors"
                          title={previewFit === 'contain' ? 'Switch to Cover' : 'Switch to Contain'}
                        >
                          {previewFit === 'contain' ? (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3" /></svg>
                          )}
                        </button>
                      </div>

                      {decodePreviewUrl ? (
                        <>
                          <Image 
                            src={decodePreviewUrl} 
                            alt="解码预览" 
                            fill
                            unoptimized
                            className={`object-${previewFit} relative z-10 transition-all duration-300`}
                            onLoad={(e) => setImgDims({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
                          />
                          {/* HUD Bar */}
                          <div className="absolute bottom-0 left-0 right-0 bg-zinc-900/80 backdrop-blur-md border-t border-zinc-700 p-2 z-20 flex items-center justify-between text-[10px] font-mono text-zinc-300">
                             <div className="flex gap-4">
                               <span>MIME: <span className="text-white">{decodedMime || '-'}</span></span>
                               <span>SIZE: <span className="text-white">{decodedBytes ? bytesToSize(decodedBytes.byteLength) : '-'}</span></span>
                               {imgDims && <span>{imgDims.w} x {imgDims.h} PX</span>}
                            </div>
                            <button
                              onClick={onDownloadDecoded}
                              className="text-blue-400 hover:text-blue-300 font-bold uppercase tracking-wider flex items-center gap-1.5"
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                              DOWNLOAD
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-400 font-mono text-xs uppercase tracking-widest">
                          Awaiting_Decoded_Stream...
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
