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
  const height = props.height ?? 420;
  const width = 1200;
  const padding = { l: 16, r: 12, t: 14, b: 14 };
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

  const areaD = useMemo(() => {
    if (filtered.length === 0) return '';
    const start = props.now - props.windowMs;
    const xOf = (t: number) => padding.l + ((t - start) / props.windowMs) * innerW;
    const yOf = (y: number) => padding.t + (1 - (y - domain.yMin) / (domain.yMax - domain.yMin)) * innerH;
    const yBottom = padding.t + innerH;

    let d = '';
    for (let i = 0; i < filtered.length; i++) {
      const p = filtered[i];
      const x = xOf(p.t);
      const y = yOf(p.y);
      d += i === 0 ? `M ${x.toFixed(2)} ${y.toFixed(2)}` : ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
    }
    const firstX = xOf(filtered[0].t);
    const lastX = xOf(filtered[filtered.length - 1].t);
    d += ` L ${lastX.toFixed(2)} ${yBottom.toFixed(2)} L ${firstX.toFixed(2)} ${yBottom.toFixed(2)} Z`;
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
    const list: { y: number }[] = [];
    for (let i = 0; i <= ticks; i++) {
      const py = padding.t + (1 - i / ticks) * innerH;
      list.push({ y: py });
    }
    return list;
  }, [innerH, padding.t]);

  const xTicks = useMemo(() => {
    const ticks = 4;
    const list: { x: number }[] = [];
    for (let i = 0; i <= ticks; i++) {
      const x = padding.l + (innerW * i) / ticks;
      list.push({ x });
    }
    return list;
  }, [innerW, padding.l]);

  return (
    <div className="relative w-full overflow-hidden">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-3 z-10">
        <div className="max-w-[92%] text-center font-mono leading-snug drop-shadow-sm opacity-50">
          <div className="text-lg text-zinc-900/20 sm:text-xl md:text-2xl">
            <span>P(t+dt) = P(t)·e</span>
            <sup className="ml-0.5 text-[0.72em] align-super">(rate·dt + b)</sup>
          </div>
          <div className="mt-1 text-xs text-blue-600/30 sm:text-sm">
            rate = min(Rcap, r / (1 + max(0, log10(P)-S)/C))
          </div>
        </div>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full relative z-20"
        onMouseMove={e => {
          const rect = (e.currentTarget as SVGElement).getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * width;
          setHoverX(x);
        }}
        onMouseLeave={() => setHoverX(null)}
      >
        <rect x={padding.l} y={padding.t} width={innerW} height={innerH} fill="transparent" />

        {yTicks.map((t, idx) => (
          <g key={idx}>
            <line x1={padding.l} y1={t.y} x2={padding.l + innerW} y2={t.y} stroke="#e4e4e7" strokeWidth="1" />
          </g>
        ))}

        {xTicks.map((t, idx) => (
          <g key={idx}>
            <line x1={t.x} y1={padding.t} x2={t.x} y2={padding.t + innerH} stroke="#e4e4e7" strokeWidth="1" />
          </g>
        ))}

        {pathD ? (
          <g>
            {areaD && <path d={areaD} fill="url(#areaGrad)" opacity="0.22" />}
            <path d={pathD} fill="none" stroke="url(#grad)" strokeWidth="6" opacity="0.12" filter="url(#glow)" strokeLinejoin="round" strokeLinecap="round" />
            <path d={pathD} fill="none" stroke="url(#grad)" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
          </g>
        ) : (
          <text x={padding.l + innerW / 2} y={padding.t + innerH / 2} textAnchor="middle" fontSize="14" fill="#71717a">
            AWAITING_DATA...
          </text>
        )}

        <defs>
          <linearGradient id="grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.15" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#2563eb" floodOpacity="0.35" />
            <feDropShadow dx="0" dy="2" stdDeviation="6" floodColor="#3b82f6" floodOpacity="0.22" />
          </filter>
        </defs>

        {hover && (
          <g>
            <line x1={hover.x} y1={padding.t} x2={hover.x} y2={padding.t + innerH} stroke="#a1a1aa" strokeDasharray="4 4" />
            <circle cx={hover.x} cy={hover.y} r="5" fill="#ffffff" />
            <circle cx={hover.x} cy={hover.y} r="3" fill="#2563eb" />
            <g transform={`translate(${clamp(hover.x + 12, padding.l, padding.l + innerW - 220)}, ${clamp(hover.y - 34, padding.t, padding.t + innerH - 54)})`}>
              <rect width="220" height="54" rx="4" fill="#ffffff" stroke="#e4e4e7" strokeWidth="1" />
              <text x="10" y="22" fontSize="12" fill="#18181b" fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace">
                log10(P)={hover.p.y.toFixed(3)}
              </text>
              <text x="10" y="42" fontSize="12" fill="#71717a" fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace">
                t={formatTimeAgo(props.now - hover.p.t)} AGO
              </text>
            </g>
          </g>
        )}
      </svg>
    </div>
  );
}

