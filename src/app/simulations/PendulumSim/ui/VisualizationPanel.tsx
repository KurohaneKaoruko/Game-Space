'use client';

import type { PendulumUIActions, PendulumUIState } from '../function/usePendulumSimController';
import { useState } from 'react';

function Field({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10px] font-mono font-medium text-zinc-500 uppercase">{label}</div>
        <input
          className="w-16 px-1.5 py-0.5 rounded-sm border border-zinc-200 bg-zinc-50 text-xs font-mono text-zinc-900 text-right focus:outline-none focus:border-blue-500"
          type="number"
          value={Number.isFinite(value) ? value : 0}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      </div>
      <input
        className="w-full h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        type="range"
        value={Number.isFinite(value) ? value : 0}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 text-xs font-mono text-zinc-600 cursor-pointer hover:text-blue-600 transition-colors">
      <span>{label}</span>
      <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${checked ? 'bg-blue-600' : 'bg-zinc-200'}`}>
        <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
      </div>
      <input type="checkbox" className="hidden" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

export default function VisualizationPanel({ ui, actions }: { ui: PendulumUIState; actions: PendulumUIActions }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="p-6 space-y-4">
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className="w-full flex items-center justify-between gap-3"
      >
        <div className="text-left">
          <div className="text-xs font-bold text-zinc-900 uppercase tracking-wider">可视化设置 (VISUAL)</div>
          <div className="text-[10px] text-zinc-500 font-mono mt-1 uppercase">{'/// 轨迹与图表 (TRAIL_AND_PLOTS)'}</div>
        </div>
        <svg
          className={`w-5 h-5 text-zinc-400 transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </button>

      {!collapsed && (
        <div className="space-y-4">
          <Toggle label="显示轨迹 (TRAIL)" checked={ui.showTrail} onChange={actions.setShowTrail} />
          <Toggle label="能量图表 (ENERGY)" checked={ui.showEnergy} onChange={actions.setShowEnergy} />
          <Toggle label="角度相图 (PHASE)" checked={ui.showPhasePlot} onChange={actions.setShowPhasePlot} />
          <Field label="轨迹长度 (TRAIL_LEN)" value={ui.trailLength} min={20} max={2000} step={10} onChange={(n) => actions.setTrailLength(Math.round(n))} />
          <Field
            label="相图轨迹 (PHASE_LEN)"
            value={ui.phaseTrailLength}
            min={200}
            max={20000}
            step={50}
            onChange={(n) => actions.setPhaseTrailLength(Math.round(n))}
          />
        </div>
      )}
    </div>
  );
}

