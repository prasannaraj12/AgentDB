import React, { useRef } from 'react';
import { Pin, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import DataTable from './DataTable';

const COLORS = ['#007aff', '#30d158', '#ff9f0a', '#ff453a', '#bf5af2', '#5ac8fa'];
const tooltipStyle = {
  backgroundColor: '#1d1d1f', border: 'none', borderRadius: '8px',
  fontSize: '12px', color: '#f2f2f7'
};

export default function ChartRenderer({ config, sqlQuery, onPinChart }) {
  const { chart_type, title, x_axis, y_axis, data } = config;
  const chartRef = useRef(null);

  if (!data?.length) return (
    <div className="rich-content" style={{ padding: '16px', color: '#6e6e73', fontSize: '0.85rem' }}>
      Chart could not render — no data rows returned. Try rephrasing your query.
    </div>
  );

  const handleDownloadPNG = async () => {
    if (!chartRef.current) return;
    const canvas = await html2canvas(chartRef.current, { backgroundColor: '#ffffff', scale: 2 });
    const link = document.createElement('a');
    link.download = `${title || 'chart'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  let ChartComponent;

  if (chart_type === 'bar') ChartComponent = (
    <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="#e5e5ea" />
      <XAxis dataKey={x_axis} stroke="#aeaeb2" tick={{ fontSize: 11 }} />
      <YAxis stroke="#aeaeb2" tick={{ fontSize: 11 }} />
      <Tooltip contentStyle={tooltipStyle} />
      <Legend />
      <Bar dataKey={y_axis} radius={[4, 4, 0, 0]}>
        {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
      </Bar>
    </BarChart>
  );
  else if (chart_type === 'line') ChartComponent = (
    <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="#e5e5ea" />
      <XAxis dataKey={x_axis} stroke="#aeaeb2" tick={{ fontSize: 11 }} />
      <YAxis stroke="#aeaeb2" tick={{ fontSize: 11 }} />
      <Tooltip contentStyle={tooltipStyle} />
      <Legend />
      <Line type="monotone" dataKey={y_axis} stroke="#007aff" strokeWidth={3} dot={{ r: 5 }} />
    </LineChart>
  );
  else if (chart_type === 'pie') ChartComponent = (
    <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
      <Pie data={data} dataKey={y_axis} nameKey={x_axis} cx="50%" cy="50%" outerRadius={120} label>
        {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
      </Pie>
      <Tooltip contentStyle={tooltipStyle} />
      <Legend />
    </PieChart>
  );
  else if (chart_type === 'scatter') {
    const scatterData = data.map(d => ({ x: Number(d[x_axis]), y: Number(d[y_axis]) }));
    ChartComponent = (
      <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e5ea" />
        <XAxis dataKey="x" type="number" name={x_axis} stroke="#aeaeb2" tick={{ fontSize: 11 }}
          label={{ value: x_axis, position: 'insideBottomRight', offset: 0, dy: 20, fontSize: 11, fill: '#aeaeb2' }} />
        <YAxis dataKey="y" type="number" name={y_axis} stroke="#aeaeb2" tick={{ fontSize: 11 }}
          label={{ value: y_axis, angle: -90, position: 'insideLeft', dx: -5, fontSize: 11, fill: '#aeaeb2' }} />
        <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={tooltipStyle}
          formatter={(value, name) => [value.toLocaleString(), name]} />
        <Legend verticalAlign="top" />
        <Scatter name={title || `${x_axis} vs ${y_axis}`} data={scatterData} fill="#007aff" />
      </ScatterChart>
    );
  }

  return (
    <div className="rich-content" ref={chartRef}>
      <div className="chart-title-row">
        <h3>{title}</h3>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button className="pin-btn" onClick={handleDownloadPNG} title="Download as PNG">
            <Download size={14} /> PNG
          </button>
          {onPinChart && (
            <button className="pin-btn" onClick={() => onPinChart(config)} title="Pin to dashboard">
              <Pin size={14} /> Pin
            </button>
          )}
        </div>
      </div>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          {ChartComponent}
        </ResponsiveContainer>
      </div>
      <DataTable data={data} sqlQuery={sqlQuery} />
    </div>
  );
}
