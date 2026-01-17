'use client';

import { useMemo, useState } from 'react';

export type GrowthPoint = {
  t: number;
  y: number;
};

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function formatTimeAgo(msAgo: number): string {
  const s = Math.max(0, Math.floor(msAgo / 1000));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const mm = m % 60;
    return `${h}h${mm}m`;
  }
  if (m > 0) return `${m}m${sec}s`;
  return `${sec}s`;
}

export function GrowthChart(props: { points: GrowthPoint[]; now: number; windowMs: number; height?: number }) {
  const height = props.height ?? 220;
  const width = 820;
  const padding = { l: 52, r: 18, t: 14, b: 30 };
  const innerW = width - padding.l - padding.r;
  const innerH = height - padding.t - padding.b;

  const [hoverX, setHoverX] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const start = props.now - props.windowMs;
    const pts = props.points.filter(p => p.t >= start && p.t <= props.now);
    if (pts.length === 0) return pts;

    const maxPoints = Math.floor(innerW);
    if (pts.length <= maxPoints) return pts;
    const stride = Math.ceil(pts.length / maxPoints);
    const down: GrowthPoint[] = [];
    for (let i = 0; i < pts.length; i += stride) down.push(pts[i]);
    if (down[down.length - 1] !== pts[pts.length - 1]) down.push(pts[pts.length - 1]);
    return down;
  }, [props.points, props.now, props.windowMs, innerW]);

  const domain = useMemo(() => {
    if (filtered.length === 0) return { yMin: 0, yMax: 1 };
    let yMin = Number.POSITIVE_INFINITY;
    let yMax = Number.NEGATIVE_INFINITY;
    for (const p of filtered) {
      if (!Number.isFinite(p.y)) continue;
      yMin = Math.min(yMin, p.y);
      yMax = Math.max(yMax, p.y);
    }
    if (!Number.isFinite(yMin) || !Number.isFinite(yMax)) return { yMin: 0, yMax: 1 };
    if (yMin === yMax) return { yMin: yMin - 1, yMax: yMax + 1 };
    const pad = (yMax - yMin) * 0.12;
    return { yMin: yMin - pad, yMax: yMax + pad };
  }, [filtered]);

  const pathD = useMemo(() => {
    if (filtered.length === 0) return '';
    const start = props.now - props.windowMs;
    const xOf = (t: number) => padding.l + ((t - start) / props.windowMs) * innerW;
    const yOf = (y: number) => padding.t + (1 - (y - domain.yMin) / (domain.yMax - domain.yMin)) * innerH;

    let d = '';
    for (let i = 0; i < filtered.length; i++) {
      const p = filtered[i];
      const x = xOf(p.t);
      const y = yOf(p.y);
      d += i === 0 ? `M ${x.toFixed(2)} ${y.toFixed(2)}` : ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
    }
    return d;
  }, [filtered, props.now, props.windowMs, domain.yMin, domain.yMax, innerW, innerH, padding.l, padding.t]);

  const hover = useMemo(() => {
    if (hoverX === null) return null;
    if (filtered.length === 0) return null;
    const start = props.now - props.windowMs;
    const t = start + ((hoverX - padding.l) / innerW) * props.windowMs;
    const idx = clamp(Math.round(((t - start) / props.windowMs) * (filtered.length - 1)), 0, filtered.length - 1);
    const p = filtered[idx];
    const x = padding.l + ((p.t - start) / props.windowMs) * innerW;
    const y = padding.t + (1 - (p.y - domain.yMin) / (domain.yMax - domain.yMin)) * innerH;
    return { p, x, y };
  }, [hoverX, filtered, props.now, props.windowMs, padding.l, padding.t, innerW, innerH, domain.yMin, domain.yMax]);

  const yTicks = useMemo(() => {
    const ticks = 4;
    const list: { y: number; label: string }[] = [];
    for (let i = 0; i <= ticks; i++) {
      const v = domain.yMin + ((domain.yMax - domain.yMin) * i) / ticks;
      const py = padding.t + (1 - i / ticks) * innerH;
      list.push({ y: py, label: `log10(P)=${v.toFixed(2)}` });
    }
    return list;
  }, [domain.yMin, domain.yMax, innerH, padding.t]);

  const xTicks = useMemo(() => {
    const ticks = 4;
    const list: { x: number; label: string }[] = [];
    for (let i = 0; i <= ticks; i++) {
      const x = padding.l + (innerW * i) / ticks;
      const msAgo = props.windowMs - (props.windowMs * i) / ticks;
      list.push({ x, label: `-${formatTimeAgo(msAgo)}` });
    }
    return list;
  }, [props.windowMs, innerW, padding.l]);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-gray-900">增长曲线</div>
        <div className="text-xs text-gray-500">纵轴：log10(P)</div>
      </div>

      <div className="mt-3 w-full overflow-hidden rounded-lg border border-gray-200 bg-gradient-to-b from-white to-gray-50">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full"
          onMouseMove={e => {
            const rect = (e.currentTarget as SVGElement).getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * width;
            setHoverX(x);
          }}
          onMouseLeave={() => setHoverX(null)}
        >
          <rect x={padding.l} y={padding.t} width={innerW} height={innerH} fill="transparent" />

          {yTicks.map(t => (
            <g key={t.label}>
              <line x1={padding.l} y1={t.y} x2={padding.l + innerW} y2={t.y} stroke="#e5e7eb" strokeWidth="1" />
              <text x={padding.l - 10} y={t.y + 4} textAnchor="end" fontSize="12" fill="#6b7280" fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace">
                {t.label}
              </text>
            </g>
          ))}

          {xTicks.map(t => (
            <g key={t.label}>
              <line x1={t.x} y1={padding.t} x2={t.x} y2={padding.t + innerH} stroke="#f3f4f6" strokeWidth="1" />
              <text x={t.x} y={padding.t + innerH + 20} textAnchor="middle" fontSize="12" fill="#6b7280" fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace">
                {t.label}
              </text>
            </g>
          ))}

          {pathD ? (
            <path d={pathD} fill="none" stroke="url(#grad)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
          ) : (
            <text x={padding.l + innerW / 2} y={padding.t + innerH / 2} textAnchor="middle" fontSize="14" fill="#9ca3af">
              暂无数据
            </text>
          )}

          <defs>
            <linearGradient id="grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#a78bfa" />
            </linearGradient>
          </defs>

          {hover && (
            <g>
              <line x1={hover.x} y1={padding.t} x2={hover.x} y2={padding.t + innerH} stroke="#94a3b8" strokeDasharray="4 4" />
              <circle cx={hover.x} cy={hover.y} r="5" fill="#111827" />
              <circle cx={hover.x} cy={hover.y} r="3" fill="#60a5fa" />
              <g transform={`translate(${clamp(hover.x + 12, padding.l, padding.l + innerW - 220)}, ${clamp(hover.y - 34, padding.t, padding.t + innerH - 54)})`}>
                <rect width="220" height="54" rx="10" fill="white" stroke="#e5e7eb" />
                <text x="10" y="22" fontSize="12" fill="#111827" fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace">
                  log10(P)={hover.p.y.toFixed(3)}
                </text>
                <text x="10" y="42" fontSize="12" fill="#6b7280" fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace">
                  t={formatTimeAgo(props.now - hover.p.t)} 前
                </text>
              </g>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}

