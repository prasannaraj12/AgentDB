import React, { useEffect, useState } from 'react';
import { LayoutDashboard } from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';

const COLORS = ['#007aff', '#30d158', '#ff9f0a', '#ff453a', '#bf5af2', '#5ac8fa'];

function MiniChart({ config }) {
  const { chart_type, x_axis, y_axis, data, title } = config;
  if (!data?.length) return null;
  const tooltip = { backgroundColor: '#1d1d1f', border: 'none', borderRadius: '8px', fontSize: '12px', color: '#f2f2f7' };

  if (chart_type === 'bar') return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey={x_axis} tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip contentStyle={tooltip} /><Legend />
        <Bar dataKey={y_axis} radius={[4,4,0,0]}>{data.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Bar>
      </BarChart>
    </ResponsiveContainer>
  );
  if (chart_type === 'line') return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey={x_axis} tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip contentStyle={tooltip} /><Legend />
        <Line type="monotone" dataKey={y_axis} stroke="#007aff" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
  if (chart_type === 'pie') return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart><Pie data={data} dataKey={y_axis} nameKey={x_axis} cx="50%" cy="50%" outerRadius={80}>
        {data.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
      </Pie><Tooltip contentStyle={tooltip} /><Legend /></PieChart>
    </ResponsiveContainer>
  );
  return null;
}

export default function SharedDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = window.location.pathname.split('/share/')[1];
    if (!token) { setError('Invalid share link.'); return; }
    fetch(`/share/${token}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setDashboard)
      .catch(() => setError('Dashboard not found or expired.'));
  }, []);

  if (error) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontFamily:'system-ui', color:'#ff453a' }}>
      <p>{error}</p>
    </div>
  );

  if (!dashboard) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontFamily:'system-ui', color:'#6e6e73' }}>
      <p>Loading shared dashboard...</p>
    </div>
  );

  return (
    <div style={{ fontFamily:'-apple-system,BlinkMacSystemFont,sans-serif', background:'#f5f5f7', minHeight:'100vh', padding:'32px' }}>
      <div style={{ maxWidth:1000, margin:'0 auto' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:24 }}>
          <LayoutDashboard size={22} color="#007aff" />
          <h1 style={{ margin:0, fontSize:'1.4rem', fontWeight:700 }}>{dashboard.title}</h1>
          <span style={{ marginLeft:'auto', fontSize:'0.75rem', color:'#6e6e73' }}>
            Shared via AgentDB · {new Date(dashboard.created_at).toLocaleDateString()}
          </span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:16 }}>
          {dashboard.charts.map((chart, i) => (
            <div key={i} style={{ background:'#fff', borderRadius:14, padding:'16px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
              <p style={{ fontWeight:600, fontSize:'0.88rem', marginBottom:12, color:'#1d1d1f' }}>{chart.title}</p>
              <MiniChart config={chart} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
