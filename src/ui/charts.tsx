/** Small SVG charts with text summaries for VoiceOver. */
import type { Skill } from '../data';
import { skillVar } from './Icon';

export interface StackBar {
  label: string;
  parts: { skill: Skill; value: number }[];
}

export function StackedBars({ bars, summary, unit = 'min' }: { bars: StackBar[]; summary: string; unit?: string }) {
  const W = 340;
  const H = 150;
  const pad = { l: 28, r: 4, t: 8, b: 20 };
  const max = Math.max(1, ...bars.map((b) => b.parts.reduce((s, p) => s + p.value, 0)));
  const bw = (W - pad.l - pad.r) / Math.max(1, bars.length);
  const y = (v: number) => pad.t + (H - pad.t - pad.b) * (1 - v / max);
  const every = Math.ceil(bars.length / 10);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label={summary}>
      <line x1={pad.l} x2={W - pad.r} y1={y(0)} y2={y(0)} stroke="var(--separator)" />
      <text x={pad.l - 4} y={y(max) + 4} textAnchor="end">{Math.round(max)}</text>
      <text x={pad.l - 4} y={y(0)} textAnchor="end">0</text>
      {bars.map((b, i) => {
        let acc = 0;
        const x = pad.l + i * bw + bw * 0.15;
        return (
          <g key={i}>
            {b.parts.map((p, j) => {
              const y0 = y(acc);
              acc += p.value;
              const y1 = y(acc);
              return <rect key={j} x={x} width={bw * 0.7} y={y1} height={Math.max(0, y0 - y1)} fill={skillVar(p.skill)} rx={1.5} />;
            })}
            {i % every === 0 && (
              <text x={x + bw * 0.35} y={H - 6} textAnchor="middle">{b.label}</text>
            )}
          </g>
        );
      })}
      <title>{`${summary} (${unit})`}</title>
    </svg>
  );
}

export interface LinePoint {
  x: number; // 0..1 position
  y: number; // value
  label?: string;
}

export function LineChart({ series, target, yMin = 4, yMax = 8, summary, markers = [] }: {
  series: { name: string; color: string; points: LinePoint[]; dashed?: boolean }[];
  target?: number;
  yMin?: number;
  yMax?: number;
  summary: string;
  markers?: { x: number; label: string }[];
}) {
  const W = 340;
  const H = 170;
  const pad = { l: 28, r: 8, t: 10, b: 22 };
  const sx = (x: number) => pad.l + x * (W - pad.l - pad.r);
  const sy = (v: number) => pad.t + (H - pad.t - pad.b) * (1 - (v - yMin) / (yMax - yMin));
  const ticks: number[] = [];
  for (let v = yMin; v <= yMax + 1e-9; v += 1) ticks.push(v);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label={summary}>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={pad.l} x2={W - pad.r} y1={sy(t)} y2={sy(t)} stroke="var(--separator)" strokeWidth={0.5} />
          <text x={pad.l - 4} y={sy(t) + 4} textAnchor="end">{t.toFixed(0)}</text>
        </g>
      ))}
      {markers.map((m) => (
        <g key={m.label}>
          <line x1={sx(m.x)} x2={sx(m.x)} y1={pad.t} y2={H - pad.b} stroke="var(--label-2)" strokeDasharray="2 3" strokeWidth={0.75} />
          <text x={sx(m.x)} y={H - 6} textAnchor="middle">{m.label}</text>
        </g>
      ))}
      {target !== undefined && (
        <g>
          <line x1={pad.l} x2={W - pad.r} y1={sy(target)} y2={sy(target)} stroke="var(--success)" strokeDasharray="5 4" strokeWidth={1.5} />
          <text x={W - pad.r} y={sy(target) - 4} textAnchor="end" style={{ fill: 'var(--success)' }}>Target {target.toFixed(1)}</text>
        </g>
      )}
      {series.map((s) => (
        <g key={s.name}>
          {s.points.length > 1 && (
            <polyline
              fill="none"
              stroke={s.color}
              strokeWidth={2}
              strokeDasharray={s.dashed ? '4 3' : undefined}
              points={s.points.map((p) => `${sx(p.x)},${sy(Math.max(yMin, Math.min(yMax, p.y)))}`).join(' ')}
            />
          )}
          {s.points.map((p, i) => (
            <circle key={i} cx={sx(p.x)} cy={sy(Math.max(yMin, Math.min(yMax, p.y)))} r={3.5} fill={s.color} />
          ))}
        </g>
      ))}
    </svg>
  );
}
