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
      className="fixed inset-0 z-50 bg-black/40 px-4 py-6 overflow-y-auto flex items-start justify-center"
      onMouseDown={props.onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-xl shadow-lg border border-gray-200 p-5 max-h-[calc(100vh-3rem)] overflow-y-auto"
        onMouseDown={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="text-lg font-bold text-gray-900">设置</div>
          <button
            type="button"
            onClick={props.onClose}
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-white border border-gray-200 text-gray-600 hover:text-blue-600 hover:border-blue-300 hover:shadow transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mt-4 rounded-xl bg-gray-50 border border-gray-200 p-4">
          <div className="font-semibold text-gray-900">自动购买</div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Toggle label="b" on={props.autoBuy.base} onToggle={() => props.onToggleAutoBuy('base')} />
            <Toggle label="r" on={props.autoBuy.r} onToggle={() => props.onToggleAutoBuy('r')} />
            <Toggle label="m" on={props.autoBuy.multiplier} onToggle={() => props.onToggleAutoBuy('multiplier')} />
            <Toggle label="曲率 b" on={props.autoBuy.bCurve} onToggle={() => props.onToggleAutoBuy('bCurve')} />
            <Toggle label="曲率 r" on={props.autoBuy.rCurve} onToggle={() => props.onToggleAutoBuy('rCurve')} />
          </div>
        </div>

        <div className="mt-3 rounded-xl bg-gray-50 border border-gray-200 p-4">
          <div className="font-semibold text-gray-900">存档</div>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                props.onReset();
                props.onClose();
              }}
              className="inline-flex items-center px-3 py-2 rounded-lg bg-white shadow-sm border border-gray-200 text-gray-600 hover:text-red-600 hover:border-red-300 hover:shadow transition-all text-sm font-medium"
            >
              清空存档并重置
            </button>
          </div>

          <div className="mt-4 text-sm font-semibold text-gray-900">导出码</div>
          <textarea
            readOnly
            value={exportText}
            spellCheck={false}
            className="mt-2 w-full h-24 rounded-lg border border-gray-200 bg-white p-3 font-mono text-xs text-gray-700"
          />
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(exportText);
                } catch {}
              }}
              className="inline-flex items-center px-3 py-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium transition-colors"
            >
              复制到剪贴板
            </button>
          </div>

          <div className="mt-4 text-sm font-semibold text-gray-900">导入码</div>
          <textarea
            value={importText}
            onChange={e => {
              setImportText(e.target.value);
              setImportError(null);
            }}
            placeholder="粘贴导入码"
            spellCheck={false}
            className="mt-2 w-full h-24 rounded-lg border border-gray-200 bg-white p-3 font-mono text-xs text-gray-700"
          />
          {importError && <div className="mt-2 text-sm text-red-600">{importError}</div>}
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={() => {
                const res = props.onImport(importText);
                if (!res.ok) {
                  setImportError(res.error ?? '导入失败');
                  return;
                }
                props.onClose();
              }}
              className="inline-flex items-center px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
            >
              导入并应用
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
      className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
        props.on ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200 hover:text-blue-600 hover:border-blue-300 hover:shadow'
      }`}
    >
      <span>{props.label}</span>
      <span className="font-mono text-xs">{props.on ? 'ON' : 'OFF'}</span>
    </button>
  );
}
