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
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-medium text-gray-700">{label}</div>
        <input
          className="w-24 px-2 py-1 rounded-md border border-gray-200 bg-white text-sm text-gray-900"
          type="number"
          value={Number.isFinite(value) ? value : 0}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      </div>
      <input
        className="w-full"
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
    <div className="p-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">控制面板</h2>
          <p className="text-sm text-gray-600">拖拽摆锤可实时调整位置</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={actions.reset}
          className="inline-flex items-center justify-center px-3 py-2 rounded-lg bg-white shadow-sm border border-gray-200 text-gray-700 hover:border-blue-300 hover:text-blue-600 transition-all text-sm font-medium"
        >
          重置
        </button>
        <button
          onClick={() => actions.setPaused(!ui.paused)}
          className="inline-flex items-center justify-center px-3 py-2 rounded-lg bg-white shadow-sm border border-gray-200 text-gray-700 hover:border-blue-300 hover:text-blue-600 transition-all text-sm font-medium"
        >
          {ui.paused ? '继续' : '暂停'}
        </button>
      </div>

      <div className="space-y-2">
        <div className="text-sm font-semibold text-gray-900">模式</div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => actions.setMode('double')}
            className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
              ui.params.mode === 'double'
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-white border-gray-200 text-gray-700 hover:border-blue-200 hover:text-blue-600'
            }`}
          >
            双摆
          </button>
          <button
            onClick={() => actions.setMode('triple')}
            className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
              ui.params.mode === 'triple'
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-white border-gray-200 text-gray-700 hover:border-blue-200 hover:text-blue-600'
            }`}
          >
            三摆
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-sm font-semibold text-gray-900">物理参数</div>
        <Field label="重力 g" value={ui.params.gravity} min={0} max={25} step={0.1} onChange={(n) => actions.setParam({ gravity: n })} />
        <Field label="阻尼 damping" value={ui.params.damping} min={0} max={0.03} step={0.0005} onChange={(n) => actions.setParam({ damping: n })} />
      </div>

      <div className="space-y-3">
        <div className="text-sm font-semibold text-gray-900">摆长</div>
        <Field label="L1" value={ui.params.lengths[0]} min={0.2} max={3} step={0.01} onChange={(n) => actions.setLength(0, n)} />
        <Field label="L2" value={ui.params.lengths[1]} min={0.2} max={3} step={0.01} onChange={(n) => actions.setLength(1, n)} />
        {count === 3 && <Field label="L3" value={ui.params.lengths[2]} min={0.2} max={3} step={0.01} onChange={(n) => actions.setLength(2, n)} />}
      </div>

      <div className="space-y-3">
        <div className="text-sm font-semibold text-gray-900">质量</div>
        <Field label="m1" value={ui.params.masses[0]} min={0.2} max={5} step={0.05} onChange={(n) => actions.setMass(0, n)} />
        <Field label="m2" value={ui.params.masses[1]} min={0.2} max={5} step={0.05} onChange={(n) => actions.setMass(1, n)} />
        {count === 3 && <Field label="m3" value={ui.params.masses[2]} min={0.2} max={5} step={0.05} onChange={(n) => actions.setMass(2, n)} />}
      </div>

      <div className="space-y-3">
        <div className="text-sm font-semibold text-gray-900">初始角度（度）</div>
        <Field label="θ1" value={ui.params.anglesDeg[0]} min={-180} max={180} step={1} onChange={(n) => actions.setAngleDeg(0, n)} />
        <Field label="θ2" value={ui.params.anglesDeg[1]} min={-180} max={180} step={1} onChange={(n) => actions.setAngleDeg(1, n)} />
        {count === 3 && <Field label="θ3" value={ui.params.anglesDeg[2]} min={-180} max={180} step={1} onChange={(n) => actions.setAngleDeg(2, n)} />}
      </div>

      <div className="space-y-2">
        <div className="text-sm font-semibold text-gray-900">显示</div>
        <label className="flex items-center justify-between gap-3 text-sm text-gray-700">
          <span>轨迹</span>
          <input type="checkbox" checked={ui.showTrail} onChange={(e) => actions.setShowTrail(e.target.checked)} />
        </label>
        <label className="flex items-center justify-between gap-3 text-sm text-gray-700">
          <span>能量曲线</span>
          <input type="checkbox" checked={ui.showEnergy} onChange={(e) => actions.setShowEnergy(e.target.checked)} />
        </label>
        <Field label="轨迹长度" value={ui.trailLength} min={20} max={2000} step={10} onChange={(n) => actions.setTrailLength(Math.round(n))} />
      </div>
    </div>
  );
}
