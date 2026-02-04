'use client';

import type { PendulumUIActions, PendulumUIState } from '../function/usePendulumSimController';

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

export default function ControlsPanel({ ui, actions }: { ui: PendulumUIState; actions: PendulumUIActions }) {
  const count = ui.params.mode === 'double' ? 2 : 3;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
            <span className="w-1 h-4 bg-blue-600"></span>
            控制面板 (CONTROL_PANEL)
          </h2>
          <p className="text-[10px] text-zinc-500 font-mono mt-1 uppercase">{'/// 支持拖拽交互 (DRAG_INTERACTION_ENABLED)'}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={actions.reset}
          className="inline-flex items-center justify-center px-4 py-2 bg-zinc-50 hover:bg-white border border-zinc-200 hover:border-blue-500/50 text-zinc-600 hover:text-blue-600 text-xs font-bold tracking-widest uppercase transition-all shadow-sm"
        >
          重置 (RESET)
        </button>
        <button
          onClick={() => actions.setPaused(!ui.paused)}
          className={`inline-flex items-center justify-center px-4 py-2 border text-xs font-bold tracking-widest uppercase transition-all shadow-sm ${
            ui.paused 
              ? 'bg-blue-600 border-blue-600 text-white hover:bg-blue-500' 
              : 'bg-zinc-50 hover:bg-white border-zinc-200 hover:border-blue-500/50 text-zinc-600 hover:text-blue-600'
          }`}
        >
          {ui.paused ? '继续 (RESUME)' : '暂停 (PAUSE)'}
        </button>
      </div>

      <div className="space-y-3">
        <div className="text-xs font-bold text-zinc-900 uppercase tracking-wider">模式选择 (MODE)</div>
        <div className="grid grid-cols-2 gap-2 bg-zinc-100 p-1 rounded-md">
          <button
            onClick={() => actions.setMode('double')}
            className={`px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase transition-all rounded-sm ${
              ui.params.mode === 'double'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            双摆 (DOUBLE)
          </button>
          <button
            onClick={() => actions.setMode('triple')}
            className={`px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase transition-all rounded-sm ${
              ui.params.mode === 'triple'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            三摆 (TRIPLE)
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="text-xs font-bold text-zinc-900 uppercase tracking-wider border-b border-zinc-100 pb-2">物理参数 (PHYSICS)</div>
        <Field label="重力 (GRAVITY)" value={ui.params.gravity} min={0} max={25} step={0.1} onChange={(n) => actions.setParam({ gravity: n })} />
        <Field label="阻尼 (DAMPING)" value={ui.params.damping} min={0} max={0.03} step={0.0005} onChange={(n) => actions.setParam({ damping: n })} />
      </div>

      <div className="space-y-4">
        <div className="text-xs font-bold text-zinc-900 uppercase tracking-wider border-b border-zinc-100 pb-2">摆臂长度 (LENGTH)</div>
        <Field label="L1 (上段)" value={ui.params.lengths[0]} min={0.2} max={3} step={0.01} onChange={(n) => actions.setLength(0, n)} />
        <Field label="L2 (中段)" value={ui.params.lengths[1]} min={0.2} max={3} step={0.01} onChange={(n) => actions.setLength(1, n)} />
        {count === 3 && <Field label="L3 (下段)" value={ui.params.lengths[2]} min={0.2} max={3} step={0.01} onChange={(n) => actions.setLength(2, n)} />}
      </div>

      <div className="space-y-4">
        <div className="text-xs font-bold text-zinc-900 uppercase tracking-wider border-b border-zinc-100 pb-2">质量 (MASS)</div>
        <Field label="M1" value={ui.params.masses[0]} min={0.2} max={5} step={0.05} onChange={(n) => actions.setMass(0, n)} />
        <Field label="M2" value={ui.params.masses[1]} min={0.2} max={5} step={0.05} onChange={(n) => actions.setMass(1, n)} />
        {count === 3 && <Field label="M3" value={ui.params.masses[2]} min={0.2} max={5} step={0.05} onChange={(n) => actions.setMass(2, n)} />}
      </div>

      <div className="space-y-4">
        <div className="text-xs font-bold text-zinc-900 uppercase tracking-wider border-b border-zinc-100 pb-2">初始角度 (ANGLE)</div>
        <Field label="θ1" value={ui.params.anglesDeg[0]} min={-180} max={180} step={1} onChange={(n) => actions.setAngleDeg(0, n)} />
        <Field label="θ2" value={ui.params.anglesDeg[1]} min={-180} max={180} step={1} onChange={(n) => actions.setAngleDeg(1, n)} />
        {count === 3 && <Field label="θ3" value={ui.params.anglesDeg[2]} min={-180} max={180} step={1} onChange={(n) => actions.setAngleDeg(2, n)} />}
      </div>

      <div className="space-y-3 pt-4 border-t border-zinc-200">
        <div className="text-xs font-bold text-zinc-900 uppercase tracking-wider">可视化 (VISUAL)</div>
        <label className="flex items-center justify-between gap-3 text-xs font-mono text-zinc-600 cursor-pointer hover:text-blue-600 transition-colors">
          <span>显示轨迹 (TRAIL)</span>
          <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${ui.showTrail ? 'bg-blue-600' : 'bg-zinc-200'}`}>
             <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${ui.showTrail ? 'translate-x-4' : 'translate-x-0'}`} />
          </div>
          <input type="checkbox" className="hidden" checked={ui.showTrail} onChange={(e) => actions.setShowTrail(e.target.checked)} />
        </label>
        <label className="flex items-center justify-between gap-3 text-xs font-mono text-zinc-600 cursor-pointer hover:text-blue-600 transition-colors">
          <span>能量图表 (ENERGY)</span>
          <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${ui.showEnergy ? 'bg-blue-600' : 'bg-zinc-200'}`}>
             <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${ui.showEnergy ? 'translate-x-4' : 'translate-x-0'}`} />
          </div>
          <input type="checkbox" className="hidden" checked={ui.showEnergy} onChange={(e) => actions.setShowEnergy(e.target.checked)} />
        </label>
        <Field label="轨迹长度 (LENGTH)" value={ui.trailLength} min={20} max={2000} step={10} onChange={(n) => actions.setTrailLength(Math.round(n))} />
      </div>
    </div>
  );
}
