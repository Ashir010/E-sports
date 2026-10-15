import { useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, LabelList } from 'recharts';
import { pointsTimeline } from '../../utils/scoring.js';
import { byId } from '../../utils/selectors.js';
import { percent } from '../../utils/format.js';

// Categorical order validated for the dark surface (lightness band, CVD separation, contrast).
const SERIES = ['#76A514', '#1690A4', '#8A6FE8', '#BF7414'];
const AXIS = { stroke: '#5B6470', fontSize: 11, tickLine: false, axisLine: false };
const fmtDay = (d) => new Date(`${d}T12:00:00+05:30`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' });

export default function PerformanceCharts({ db, rows, filter }) {
  const top = rows.slice(0, 4);
  const ids = top.map((r) => r.teamId);
  const timeline = useMemo(() => pointsTimeline(db, filter, ids), [db, filter, ids.join()]); // eslint-disable-line
  const bars = rows.slice(0, 8).map((r) => ({ name: byId(db.teams, r.teamId)?.tag ?? '?', full: r.name, winRate: Math.round(r.winRate * 100), played: r.played }));

  if (!rows.length) return null;
  return (
    <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
      <figure className="surface p-5">
        <figcaption className="mb-1 font-display text-base font-semibold uppercase text-mist-100">Points race — top {top.length}</figcaption>
        <p className="mb-3 text-xs text-mist-500">Cumulative points at the end of each match day.</p>
        <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1" aria-label="Legend">
          {top.map((r, i) => (
            <li key={r.teamId} className="flex items-center gap-1.5 text-xs text-mist-300">
              <span className="h-0.5 w-4 rounded-full" style={{ background: SERIES[i] }} aria-hidden /> {r.name}
            </li>
          ))}
        </ul>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timeline} margin={{ top: 8, right: 12, bottom: 0, left: -18 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="day" tickFormatter={fmtDay} {...AXIS} minTickGap={24} />
              <YAxis {...AXIS} allowDecimals={false} />
              <Tooltip content={<LineTip db={db} />} cursor={{ stroke: 'rgba(255,255,255,0.15)' }} />
              {ids.map((id, i) => (
                <Line key={id} type="monotone" dataKey={id} stroke={SERIES[i]} strokeWidth={2} dot={false} activeDot={{ r: 5, stroke: '#111418', strokeWidth: 2 }} isAnimationActive />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </figure>
      <figure className="surface p-5">
        <figcaption className="mb-1 font-display text-base font-semibold uppercase text-mist-100">Win rate — top 8</figcaption>
        <p className="mb-3 text-xs text-mist-500">Share of matches won (battle royale: 1st place finishes).</p>
        <div className="h-[17.5rem]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bars} layout="vertical" margin={{ top: 0, right: 36, bottom: 0, left: 0 }} barCategoryGap={6}>
              <XAxis type="number" hide domain={[0, 100]} />
              <YAxis type="category" dataKey="name" width={44} {...AXIS} tick={{ fill: '#A9B1BD', fontSize: 11 }} />
              <Tooltip content={<BarTip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="winRate" fill="#C6FF3D" radius={[0, 4, 4, 0]} maxBarSize={18}>
                <LabelList dataKey="winRate" position="right" formatter={(v) => `${v}%`} style={{ fill: '#A9B1BD', fontSize: 11 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </figure>
    </div>
  );
}

function LineTip({ active, payload, label, db }) {
  if (!active || !payload?.length) return null;
  const sorted = [...payload].sort((a, b) => b.value - a.value);
  return (
    <div className="rounded-lg border border-white/10 bg-ink-800 px-3 py-2 text-xs shadow-xl">
      <p className="mb-1 text-mist-400">{fmtDay(label)}</p>
      {sorted.map((p) => (
        <p key={p.dataKey} className="flex items-center gap-2 text-mist-200">
          <span className="h-2 w-2 rounded-full" style={{ background: p.stroke }} aria-hidden />
          <span className="flex-1">{byId(db.teams, p.dataKey)?.name}</span>
          <span className="font-mono tabular text-mist-100">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

function BarTip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-white/10 bg-ink-800 px-3 py-2 text-xs shadow-xl">
      <p className="font-semibold text-mist-100">{d.full}</p>
      <p className="text-mist-300">
        {percent(d.winRate / 100)} win rate · {d.played} matches
      </p>
    </div>
  );
}
