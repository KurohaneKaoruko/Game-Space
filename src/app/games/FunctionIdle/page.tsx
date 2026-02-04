'use client';

import Navigation from '../../components/Navigation';
import { useEffect, useMemo, useState } from 'react';
import { bnFormat, bnGte } from './function/bigNumber';
import { applyMultiplier, multiplierFromLevel } from './function/balance';
import { useFunctionIdle } from './function/useFunctionIdle';
import { GrowthChart } from './components/GrowthChart';
import { SettingsModal } from './components/SettingsModal';

function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}天${h}小时`;
  if (h > 0) return `${h}小时${m}分`;
  return `${m}分`;
}

function formatScalar(n: number, fixedDigits: number, expDigits: number): string {
  if (!Number.isFinite(n)) return '∞';
  const abs = Math.abs(n);
  if (abs === 0) return '0';
  if (abs >= 1e6 || abs < 1e-3) return n.toExponential(expDigits).replace('e+', 'e');
  return n.toFixed(fixedDigits);
}

export default function Page() {
  const { state, offline, dismissOffline, pointsText, baseText, rText, costs, buyBase, buyR, buyMultiplier, buyBCurve, buyRCurve, prestige, prestigeInfo, history, now, autoBuy, toggleAutoBuy, reset, exportSave, importSave } = useFunctionIdle();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const windowMs = 5 * 60 * 1000;

  useEffect(() => {
    document.documentElement.classList.add('hide-scrollbar');
    document.body.classList.add('hide-scrollbar');
    return () => {
      document.documentElement.classList.remove('hide-scrollbar');
      document.body.classList.remove('hide-scrollbar');
    };
  }, []);

  const affordableBase = state ? bnGte(state.points, costs.base) : false;
  const affordableR = state ? bnGte(state.points, costs.r) : false;
  const affordableMultiplier = state ? bnGte(state.points, costs.multiplier) : false;
  const affordableBCurve = state ? bnGte(state.points, costs.bCurve) : false;
  const affordableRCurve = state ? bnGte(state.points, costs.rCurve) : false;

  const effectiveBase = state ? applyMultiplier(state.base, state.multiplierLevel, state.phi) : null;
  const chartPoints = useMemo(() => history.map(p => ({ t: p.t, y: p.logP })), [history]);

  return (
    <main className="min-h-screen">
      <Navigation title="FUNCTION_IDLE" />
      
      <div className="pt-24 pb-6 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl">

          <div className="flex flex-col lg:flex-row lg:items-start gap-6">
            <div className="lg:flex-1 space-y-6">
              {/* Chart Section */}
              <div className="bg-white tech-border border border-zinc-200 p-6 relative">
                 {/* Decorative Corners */}
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-blue-600"></div>
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-blue-600"></div>
                
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-6">
                    <div className="text-xs text-zinc-500 font-mono uppercase">
                      当前点数 (POINTS) <span className="ml-2 font-bold text-zinc-900 text-base">{pointsText}</span>
                    </div>
                    <div className="text-xs text-zinc-500 font-mono uppercase">
                      φ 因子 (FACTOR) <span className="ml-2 font-bold text-blue-600 text-base">{state?.phi ?? 0}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettingsOpen(true)}
                    className="inline-flex items-center px-3 py-1 border border-zinc-200 text-zinc-500 hover:text-zinc-900 hover:border-zinc-400 text-[10px] font-bold tracking-widest uppercase transition-colors bg-white"
                  >
                    <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15.5A3.5 3.5 0 1012 8.5a3.5 3.5 0 000 7zm8.94-2.01l-1.66-.96a7.63 7.63 0 000-1.06l1.66-.96a.9.9 0 00.33-1.23l-1.7-2.95a.9.9 0 00-1.16-.4l-1.66.96c-.28-.23-.58-.43-.9-.6V3.3a.9.9 0 00-.9-.9H9.7a.9.9 0 00-.9.9v1.92c-.32.17-.62.37-.9.6l-1.66-.96a.9.9 0 00-1.16.4L3.38 8.2a.9.9 0 00.33 1.23l1.66.96a7.63 7.63 0 000 1.06l-1.66.96a.9.9 0 00-.33 1.23l1.7 2.95a.9.9 0 001.16.4l1.66-.96c.28.23.58.43.9.6v1.92c0 .5.4.9.9.9h3.4c.5 0 .9-.4.9-.9v-1.92c.32-.17.62-.37.9-.6l1.66.96a.9.9 0 001.16-.4l1.7-2.95a.9.9 0 00-.33-1.23z" />
                    </svg>
                    设置 (CONFIG)
                  </button>
                </div>
                <GrowthChart points={chartPoints} now={now} windowMs={windowMs} height={480} />
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-zinc-200 border border-zinc-200">
                <ScoreBox title="基础参数 (b)" value={baseText} tone="blue" sub="偏差源 (Bias Source)" />
                <ScoreBox title="速率参数 (r)" value={rText} tone="purple" sub="指数率 (Exp Rate)" />
                <ScoreBox title="倍率 (m)" value={`${formatScalar(multiplierFromLevel(state?.multiplierLevel ?? 0), 2, 3)}×`} tone="gray" sub="信号放大 (Signal Amp)" />
                <ScoreBox title="有效值 (b_eff)" value={effectiveBase ? bnFormat(effectiveBase, 4) : '...'} tone="gray" sub="计算输入 (Compute Input)" />
              </div>
            </div>

            {/* Upgrades Aside */}
            <aside className="lg:w-80 xl:w-96 space-y-6">
              <div className="bg-white tech-border border border-zinc-200 p-6">
                <h2 className="text-lg font-bold text-zinc-900 mb-6 flex items-center gap-2">
                  <span className="w-1 h-4 bg-blue-600"></span>
                  系统升级 (UPGRADES)
                </h2>

                <div className="space-y-3">
                  <UpgradeCard
                    title="提升 b"
                    affects="效果: 基础偏差"
                    formula="增加 b_eff 输出"
                    cost={bnFormat(costs.base, 4)}
                    disabled={!affordableBase}
                    onBuy={buyBase}
                  />
                  <UpgradeCard
                    title="提升 r"
                    affects="效果: 指数速率"
                    formula="增加 r 参数"
                    cost={bnFormat(costs.r, 4)}
                    disabled={!affordableR}
                    onBuy={buyR}
                  />
                  <UpgradeCard
                    title="提升 m"
                    affects="效果: 信号增益"
                    formula="倍增 b_eff 信号"
                    cost={bnFormat(costs.multiplier, 4)}
                    disabled={!affordableMultiplier}
                    onBuy={buyMultiplier}
                  />
                  <UpgradeCard
                    title="曲率 b"
                    affects="效果: b 斜率"
                    formula="b 的增长更加陡峭"
                    cost={bnFormat(costs.bCurve, 4)}
                    disabled={!affordableBCurve}
                    onBuy={buyBCurve}
                  />
                  <UpgradeCard
                    title="曲率 r"
                    affects="效果: r 斜率"
                    formula="r 的增长更加陡峭"
                    cost={bnFormat(costs.rCurve, 4)}
                    disabled={!affordableRCurve}
                    onBuy={buyRCurve}
                  />
                </div>
              </div>

              {/* Prestige Section */}
              <div className="bg-white tech-border border border-zinc-200 p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-bold text-zinc-900 text-sm uppercase tracking-wider">维度迁移 (Dimensional Shift)</div>
                    <div className="mt-1 text-[10px] text-zinc-500 font-mono">P → 0, 获取 φ</div>
                    <div className="mt-2 text-xs text-zinc-500 font-mono">
                      需求: <span className="text-zinc-900">{bnFormat(prestigeInfo.requirement, 4)}</span>
                    </div>
                    <div className="mt-1 text-xs text-zinc-500 font-mono">
                      获取: <span className="text-blue-600">+{prestigeInfo.gainPhi}</span> φ
                    </div>
                  </div>
                  <button
                    onClick={prestige}
                    disabled={!prestigeInfo.available}
                    className={`
                      px-4 py-2 text-xs font-bold tracking-widest uppercase transition-all
                      ${prestigeInfo.available 
                        ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
                        : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                      }
                    `}
                  >
                    迁移 (SHIFT)
                  </button>
                </div>
              </div>

              <div className="text-[10px] text-zinc-400 font-mono text-center">
                {'// 系统: 离线计算限制 = 30天'}
              </div>
            </aside>
          </div>
        </div>
      </div>

      {offline && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/20 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-white border border-zinc-200 p-6 tech-border">
            <div className="text-lg font-bold text-zinc-900 mb-2">离线计算完成 (OFFLINE_COMPUTATION_COMPLETE)</div>
            <div className="text-xs text-zinc-500 font-mono mb-4">持续时间: {formatDuration(offline.offlineSeconds)}</div>
            <div className="bg-zinc-50 border border-zinc-200 p-4 text-center mb-6">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">获得点数 (Points Gained)</p>
              <p className="text-2xl font-bold text-blue-600 font-mono">{bnFormat(offline.gainedPoints, 4)}</p>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={dismissOffline}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold tracking-widest uppercase"
              >
                确认 (ACKNOWLEDGE)
              </button>
            </div>
          </div>
        </div>
      )}
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        autoBuy={autoBuy}
        onToggleAutoBuy={toggleAutoBuy}
        onReset={reset}
        onExport={exportSave}
        onImport={importSave}
      />
    </main>
  );
}

function ScoreBox(props: { title: string; value: string; sub: string; tone: 'blue' | 'purple' | 'gray' }) {
  const valueClass = props.tone === 'blue' ? 'text-blue-600' : props.tone === 'purple' ? 'text-purple-600' : 'text-zinc-900';
  return (
    <div className="bg-zinc-50 p-4 text-center hover:bg-zinc-100 transition-colors">
      <p className="text-[10px] text-zinc-500 font-mono uppercase mb-1">{props.title}</p>
      <p className={`text-lg font-bold font-mono ${valueClass}`}>{props.value}</p>
      <p className="text-[10px] text-zinc-500 mt-1">{props.sub}</p>
    </div>
  );
}

function UpgradeCard(props: { title: string; affects: string; formula: string; cost: string; disabled: boolean; onBuy: () => void }) {
  return (
    <div className="bg-zinc-50 border border-zinc-200 p-3 hover:border-blue-500/30 transition-colors group">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-bold text-zinc-900 text-xs uppercase tracking-wider group-hover:text-blue-600 transition-colors">{props.title}</div>
          <div className="mt-1 text-[10px] text-zinc-500 font-mono leading-snug">{props.affects}</div>
          <div className="mt-0.5 text-[10px] text-zinc-400 font-mono leading-snug">{props.formula}</div>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-2">
          <div className="text-[10px] text-zinc-400 font-mono">
            COST <span className={props.disabled ? 'text-zinc-400' : 'text-zinc-900'}>{props.cost}</span>
          </div>
          <button
            type="button"
            onClick={props.onBuy}
            disabled={props.disabled}
            className={`
              px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase transition-colors 
              ${props.disabled 
                ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_10px_rgba(37,99,235,0.2)]'
              }
            `}
          >
            ACQUIRE
          </button>
        </div>
      </div>
    </div>
  );
}
