'use client';

import Navigation from '../../components/Navigation';
import { useMemo, useState } from 'react';
import { bnFormat, bnGte } from './function/bigNumber';
import { applyMultiplier, multiplierFromLevel } from './function/balance';
import { useFunctionIdle } from './function/useFunctionIdle';
import { GrowthChart } from './components/GrowthChart';

function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}天${h}小时`;
  if (h > 0) return `${h}小时${m}分`;
  return `${m}分`;
}

export default function Page() {
  const { state, offline, dismissOffline, pointsText, baseText, rText, costs, buyBase, buyR, buyMultiplier, buyBCurve, buyRCurve, prestige, prestigeInfo, autoBuy, toggleAutoBuy, reset, history, now } = useFunctionIdle();
  const [windowMs, setWindowMs] = useState<number>(5 * 60 * 1000);

  const affordableBase = state ? bnGte(state.points, costs.base) : false;
  const affordableR = state ? bnGte(state.points, costs.r) : false;
  const affordableMultiplier = state ? bnGte(state.points, costs.multiplier) : false;
  const affordableBCurve = state ? bnGte(state.points, costs.bCurve) : false;
  const affordableRCurve = state ? bnGte(state.points, costs.rCurve) : false;

  const effectiveBase = state ? applyMultiplier(state.base, state.multiplierLevel, state.phi ?? 0) : null;
  const chartPoints = useMemo(() => history.map(p => ({ t: p.t, y: p.logP })), [history]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navigation />

      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between gap-4">
              <h1 className="text-3xl font-bold text-gray-900">函数 · 指数挂机</h1>
              <div className="text-sm text-gray-600">
                φ <span className="font-mono font-semibold text-gray-900">{state?.phi ?? 0}</span>
              </div>
            </div>
            <p className="mt-2 text-gray-600">
              通过微分方程推进进度：<span className="font-mono">dP/dt = r·P + b</span>
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <section className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm text-gray-500">当前积分 P</div>
                  <div className="text-3xl font-semibold text-gray-900 font-mono">{pointsText}</div>
                </div>
                <button
                  onClick={reset}
                  className="px-3 py-2 text-sm rounded-md border border-gray-200 hover:bg-gray-50 text-gray-700"
                >
                  重置
                </button>
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Stat title="常数项 b" value={baseText} sub={`等级 ${state?.bLevel ?? 0}`} />
                <Stat title="增长率 r" value={rText} sub={`等级 ${state?.rLevel ?? 0}`} />
                <Stat title="倍率 m" value={`${(multiplierFromLevel(state?.multiplierLevel ?? 0)).toFixed(2)}×`} sub={`等级 ${state?.multiplierLevel ?? 0}`} />
              </div>

              <div className="mt-6 bg-gray-50 rounded-lg border border-gray-200 p-4">
                <div className="text-sm text-gray-600">有效常数项</div>
                <div className="font-mono text-gray-900">{effectiveBase ? bnFormat(effectiveBase, 4) : '...'}</div>
              </div>

              <div className="mt-6">
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-sm font-semibold text-gray-900">曲线窗口</div>
                  <div className="flex items-center gap-2">
                    <TimeBtn active={windowMs === 60_000} onClick={() => setWindowMs(60_000)} label="1m" />
                    <TimeBtn active={windowMs === 5 * 60_000} onClick={() => setWindowMs(5 * 60_000)} label="5m" />
                    <TimeBtn active={windowMs === 30 * 60_000} onClick={() => setWindowMs(30 * 60_000)} label="30m" />
                  </div>
                </div>
                <GrowthChart points={chartPoints} now={now} windowMs={windowMs} />
              </div>
            </section>

            <aside className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900">升级（函数变换）</h2>
              <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                <div className="text-sm font-semibold text-gray-900">自动购买</div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Toggle label="b" on={autoBuy.base} onToggle={() => toggleAutoBuy('base')} />
                  <Toggle label="r" on={autoBuy.r} onToggle={() => toggleAutoBuy('r')} />
                  <Toggle label="m" on={autoBuy.multiplier} onToggle={() => toggleAutoBuy('multiplier')} />
                  <Toggle label="曲率 b" on={autoBuy.bCurve} onToggle={() => toggleAutoBuy('bCurve')} />
                  <Toggle label="曲率 r" on={autoBuy.rCurve} onToggle={() => toggleAutoBuy('rCurve')} />
                </div>
              </div>
              <div className="mt-4 space-y-3">
                <UpgradeCard
                  title="提升 b"
                  formula="b ← 10^{k} · 2.5"
                  cost={bnFormat(costs.base, 4)}
                  disabled={!affordableBase}
                  onBuy={buyBase}
                />
                <UpgradeCard
                  title="提升 r"
                  formula="r ← r + Δ"
                  cost={bnFormat(costs.r, 4)}
                  disabled={!affordableR}
                  onBuy={buyR}
                />
                <UpgradeCard
                  title="提升 m"
                  formula="b ← m · b"
                  cost={bnFormat(costs.multiplier, 4)}
                  disabled={!affordableMultiplier}
                  onBuy={buyMultiplier}
                />
                <UpgradeCard
                  title="曲率：b"
                  formula={`b 的指数斜率 ← ×(1+0.12·k)`}
                  cost={bnFormat(costs.bCurve, 4)}
                  disabled={!affordableBCurve}
                  onBuy={buyBCurve}
                />
                <UpgradeCard
                  title="曲率：r"
                  formula={`r 的增长斜率 ← ×(1+0.10·k)`}
                  cost={bnFormat(costs.rCurve, 4)}
                  disabled={!affordableRCurve}
                  onBuy={buyRCurve}
                />
              </div>

              <div className="mt-5 rounded-lg border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-gray-900">尺度变换</div>
                    <div className="mt-1 text-xs text-gray-500 font-mono">
                      P → 0，获得 φ
                    </div>
                    <div className="mt-2 text-sm text-gray-700">
                      需要 <span className="font-mono">{bnFormat(prestigeInfo.requirement, 4)}</span>
                    </div>
                    <div className="mt-1 text-sm text-gray-700">
                      收益 <span className="font-mono">+{prestigeInfo.gainPhi}</span> φ
                    </div>
                  </div>
                  <button
                    onClick={prestige}
                    disabled={!prestigeInfo.available}
                    className={`px-3 py-2 rounded-md text-sm ${
                      prestigeInfo.available ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    变换
                  </button>
                </div>
              </div>

              <div className="mt-6 text-xs text-gray-500 leading-relaxed">
                离线时将按上次保存时间自动结算（最多结算 30 天）。
              </div>
            </aside>
          </div>
        </div>
      </div>

      {offline && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="text-lg font-semibold text-gray-900">离线结算</div>
            <div className="mt-2 text-sm text-gray-600">离线时长：{formatDuration(offline.offlineSeconds)}</div>
            <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="text-sm text-gray-600">获得积分</div>
              <div className="font-mono text-gray-900">{bnFormat(offline.gainedPoints, 4)}</div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={dismissOffline}
                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
              >
                继续
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function Stat(props: { title: string; value: string; sub: string }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="text-sm text-gray-500">{props.title}</div>
      <div className="mt-1 font-mono text-lg text-gray-900">{props.value}</div>
      <div className="mt-1 text-xs text-gray-500">{props.sub}</div>
    </div>
  );
}

function UpgradeCard(props: { title: string; formula: string; cost: string; disabled: boolean; onBuy: () => void }) {
  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-gray-900">{props.title}</div>
          <div className="mt-1 text-xs text-gray-500 font-mono">{props.formula}</div>
          <div className="mt-2 text-sm text-gray-700">
            代价 <span className="font-mono">{props.cost}</span>
          </div>
        </div>
        <button
          onClick={props.onBuy}
          disabled={props.disabled}
          className={`px-3 py-2 rounded-md text-sm ${
            props.disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-900 text-white hover:bg-gray-800'
          }`}
        >
          购买
        </button>
      </div>
    </div>
  );
}

function TimeBtn(props: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={props.onClick}
      className={`px-3 py-1.5 rounded-md text-xs border ${
        props.active ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
      }`}
    >
      {props.label}
    </button>
  );
}

function Toggle(props: { label: string; on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={props.onToggle}
      className={`flex items-center justify-between rounded-md border px-3 py-2 text-sm ${
        props.on ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
      }`}
    >
      <span>{props.label}</span>
      <span className="font-mono text-xs">{props.on ? 'ON' : 'OFF'}</span>
    </button>
  );
}

