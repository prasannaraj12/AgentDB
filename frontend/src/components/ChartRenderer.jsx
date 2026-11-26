import { useRef, useState } from 'react';
import { Pin, Download, Check } from 'lucide-react';
import html2canvas from 'html2canvas';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts';

const CHART_COLORS = ['#7565e8', '#f0a35e', '#5b9be6', '#2a9d5c', '#e0679a', '#9a8ef0', '#47b5b0', '#c7a04a'];
const AXIS = { stroke: '#b3b1ad', tick: { fontSize: 11, fill: '#6f6f78' }, tickLine: false, axisLine: { stroke: '#e6e4e0' } };
const TOOLTIP = {
  contentStyle: { background: '#191919', border: 'none', borderRadius: 10, fontSize: 12, color: '#fff', padding: '6px 10px' },
  itemStyle: { color: '#fff' },
  labelStyle: { color: '#c9c7ff', marginBottom: 2 },
  cursor: { fill: 'rgba(117,101,232,0.06)' },
};
const fmt = (v) => (typeof v === 'number' ? v.toLocaleString(undefined, { maximumFractionDigits: 2 }) : v);

export function ChartBody({ config, height = 300 }) {
  const { chart_type: rawType, title, x_axis, y_axis, data } = config;
  const type = (rawType || '').toLowerCase().trim();
  if (!data?.length) return <p className="ag-chart-note">Chart could not render — no data rows returned.</p>;

  let chart = null;
  if (type === 'bar') {
    chart = (
      <BarChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 4 }}>
        <CartesianGrid vertical={false} stroke="#efedea" />
        <XAxis dataKey={x_axis} {...AXIS} interval="preserveStartEnd" />
        <YAxis {...AXIS} width={56} tickFormatter={fmt} />
        <Tooltip {...TOOLTIP} formatter={fmt} />
        <Bar dataKey={y_axis} radius={[8, 8, 8, 8]} maxBarSize={44} animationDuration={600}>
          {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
        </Bar>
      </BarChart>
    );
  } else if (type === 'line') {
    chart = (
      <LineChart data={data} margin={{ top: 12, right: 16, left: 0, bottom: 4 }}>
        <CartesianGrid vertical={false} stroke="#efedea" />
        <XAxis dataKey={x_axis} {...AXIS} interval="preserveStartEnd" />
        <YAxis {...AXIS} width={56} tickFormatter={fmt} />
        <Tooltip {...TOOLTIP} cursor={{ stroke: '#c8c0f7' }} formatter={fmt} />
        <Line type="monotone" dataKey={y_axis} stroke="#7565e8" strokeWidth={2.5}
          dot={{ r: 3.5, fill: '#fff', stroke: '#7565e8', strokeWidth: 2 }} activeDot={{ r: 5 }} animationDuration={700} />
      </LineChart>
    );
  } else if (type === 'pie') {
    chart = (
      <PieChart>
        <Pie data={data} dataKey={y_axis} nameKey={x_axis} cx="50%" cy="50%" innerRadius="48%" outerRadius="78%"
          paddingAngle={2} cornerRadius={6} stroke="none" animationDuration={700}>
          {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
        </Pie>
        <Tooltip {...TOOLTIP} formatter={fmt} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    );
  } else if (type === 'scatter') {
    const xIsNumeric = data.every((d) => !isNaN(Number(d[x_axis])));
    const points = data.map((d, i) => ({
      x: xIsNumeric ? Number(d[x_axis]) : i,
      y: Number(d[y_axis]),
      label: String(d[x_axis]),
    })).filter((d) => !isNaN(d.y));
    if (!points.length) return <p className="ag-chart-note">Scatter plot could not render — “{y_axis}” has no numeric values.</p>;
    chart = (
      <ScatterChart margin={{ top: 12, right: 16, left: 0, bottom: 4 }}>
        <CartesianGrid stroke="#efedea" />
        <XAxis dataKey="x" type="number" name={x_axis} {...AXIS}
          tickFormatter={xIsNumeric ? fmt : (v) => points[v]?.label ?? v} />
        <YAxis dataKey="y" type="number" name={y_axis} {...AXIS} width={56} tickFormatter={fmt} />
        <Tooltip {...TOOLTIP} content={({ payload }) => {
          if (!payload?.length) return null;
          const d = payload[0].payload;
          return (
            <div style={TOOLTIP.contentStyle}>
              <div>{x_axis}: {xIsNumeric ? fmt(d.x) : d.label}</div>
              <div>{y_axis}: {fmt(d.y)}</div>
            </div>
          );
        }} />
        <Scatter name={title || `${x_axis} vs ${y_axis}`} data={points} fill="#7565e8" />
      </ScatterChart>
    );
  }
  if (!chart) return <p className="ag-chart-note">Unsupported chart type “{rawType}”.</p>;

  return (
    <div className="ag-chart-canvas" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">{chart}</ResponsiveContainer>
    </div>
  );
}

/** Chart card with PNG download and pin-to-insights. */
export default function ChartRenderer({ config, onPinChart }) {
  const ref = useRef(null);
  const [pinned, setPinned] = useState(false);

  const downloadPng = async () => {
    if (!ref.current) return;
    const canvas = await html2canvas(ref.current, { backgroundColor: '#ffffff', scale: 2 });
    const link = document.createElement('a');
    link.download = `${config.title || 'chart'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="ag-chart" ref={ref}>
      <div className="ag-chart-head">
        <div>
          <p className="ag-chart-title">{config.title}</p>
          <p className="ag-chart-sub">{(config.chart_type || '').toLowerCase()} · {config.x_axis} × {config.y_axis} · {config.data?.length || 0} points</p>
        </div>
        <div className="ag-chart-actions" data-html2canvas-ignore>
          <button type="button" className="ag-mini-btn" onClick={downloadPng} title="Download as PNG"><Download size={12} /> PNG</button>
          {onPinChart && (
            <button type="button" className="ag-mini-btn" disabled={pinned}
              onClick={() => { onPinChart(config); setPinned(true); }} title="Pin to Insights">
              {pinned ? <Check size={12} /> : <Pin size={12} />} {pinned ? 'Pinned' : 'Pin'}
            </button>
          )}
        </div>
      </div>
      <ChartBody config={config} />
    </div>
  );
}
