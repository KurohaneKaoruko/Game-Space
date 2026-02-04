'use client';

import { useState } from 'react';

type AutoBuy = {
  base: boolean;
  r: boolean;
  multiplier: boolean;
  bCurve: boolean;
  rCurve: boolean;
};

export function SettingsModal(props: {
  open: boolean;
  onClose: () => void;
  autoBuy: AutoBuy;
  onToggleAutoBuy: (key: keyof AutoBuy) => void;
  onReset: () => void;
  onExport: () => string;
  onImport: (raw: string) => { ok: boolean; error?: string };
}) {
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);

  const exportText = props.open ? props.onExport() : '';

  if (!props.open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-zinc-900/20 backdrop-blur-sm px-4 py-6 overflow-y-auto flex items-start justify-center"
      onMouseDown={props.onClose}
    >
      <div
        className="w-full max-w-lg bg-white tech-border border border-zinc-200 p-6 max-h-[calc(100vh-3rem)] overflow-y-auto"
        onMouseDown={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="text-lg font-bold text-zinc-900 flex items-center gap-2">
            <span className="w-1 h-4 bg-blue-600"></span>
            系统设置 (SYSTEM_SETTINGS)
          </div>
          <button
            type="button"
            onClick={props.onClose}
            className="inline-flex items-center justify-center w-8 h-8 border border-zinc-200 text-zinc-400 hover:text-zinc-900 hover:border-zinc-400 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="bg-zinc-50 border border-zinc-200 p-4 mb-4">
          <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">自动购买协议 (Auto_Acquisition_Protocols)</div>
          <div className="grid grid-cols-2 gap-3">
            <Toggle label="基础参数 (Base)" on={props.autoBuy.base} onToggle={() => props.onToggleAutoBuy('base')} />
            <Toggle label="速率参数 (Rate)" on={props.autoBuy.r} onToggle={() => props.onToggleAutoBuy('r')} />
            <Toggle label="倍率 (Multiplier)" on={props.autoBuy.multiplier} onToggle={() => props.onToggleAutoBuy('multiplier')} />
            <Toggle label="曲线 (b Curve)" on={props.autoBuy.bCurve} onToggle={() => props.onToggleAutoBuy('bCurve')} />
            <Toggle label="曲线 (r Curve)" on={props.autoBuy.rCurve} onToggle={() => props.onToggleAutoBuy('rCurve')} />
          </div>
        </div>

        <div className="bg-zinc-50 border border-zinc-200 p-4">
          <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">数据管理 (Data_Management)</div>
          <div className="flex items-center gap-2 mb-6">
            <button
              type="button"
              onClick={() => {
                props.onReset();
                props.onClose();
              }}
              className="px-4 py-2 border border-red-900/30 text-red-600 bg-red-50 hover:bg-red-100 hover:border-red-900/50 text-xs font-bold tracking-widest uppercase transition-all w-full"
            >
              !! 清除数据并重置 (PURGE_DATA) !!
            </button>
          </div>

          <div className="text-[10px] text-zinc-500 font-mono uppercase mb-2">导出存档 (Export_Sequence)</div>
          <textarea
            readOnly
            value={exportText}
            spellCheck={false}
            className="w-full h-20 bg-zinc-100 border border-zinc-200 p-3 font-mono text-[10px] text-zinc-600 focus:outline-none focus:border-blue-500/50 resize-none mb-2"
          />
          <div className="flex justify-end mb-6">
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(exportText);
                } catch {}
              }}
              className="px-3 py-1.5 border border-zinc-200 text-zinc-400 hover:text-zinc-900 hover:border-zinc-400 text-[10px] font-bold tracking-widest uppercase transition-colors"
            >
              复制到剪贴板 (COPY)
            </button>
          </div>

          <div className="text-[10px] text-zinc-500 font-mono uppercase mb-2">导入存档 (Import_Sequence)</div>
          <textarea
            value={importText}
            onChange={e => {
              setImportText(e.target.value);
              setImportError(null);
            }}
            placeholder="// 在此粘贴存档数据 (PASTE_DATA_HERE)"
            spellCheck={false}
            className="w-full h-20 bg-zinc-100 border border-zinc-200 p-3 font-mono text-[10px] text-zinc-600 focus:outline-none focus:border-blue-500/50 resize-none mb-2"
          />
          {importError && <div className="text-xs text-red-600 font-mono mb-2">[错误]: {importError}</div>}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                const res = props.onImport(importText);
                if (!res.ok) {
                  setImportError(res.error ?? 'IMPORT_FAILED');
                  return;
                }
                props.onClose();
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold tracking-widest uppercase transition-colors"
            >
              执行导入 (EXECUTE_IMPORT)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Toggle(props: { label: string; on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={props.onToggle}
      className={`flex items-center justify-between border px-3 py-2 transition-all group ${
        props.on 
          ? 'bg-blue-50 border-blue-500/50 text-blue-600' 
          : 'bg-white border-zinc-200 text-zinc-500 hover:border-zinc-400 hover:text-zinc-700'
      }`}
    >
      <span className="text-xs font-mono uppercase">{props.label}</span>
      <div className={`w-2 h-2 rounded-full ${props.on ? 'bg-blue-600 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-zinc-300'}`}></div>
    </button>
  );
}
