import React, { useState } from 'react';
import { X, LayoutDashboard, Share2, Check, Link } from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';

const COLORS = ['#6b4cff', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

function MiniChart({ config }) {
  const { chart_type, x_axis, y_axis, data } = config;
  if (!data?.length) return null;

  if (chart_type === 'bar') return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis dataKey={x_axis} stroke="#9ea4b0" tick={{ fontSize: 10 }} />
        <YAxis stroke="#9ea4b0" tick={{ fontSize: 10 }} />
        <Tooltip contentStyle={{ backgroundColor: '#1a1d24', border: 'none', borderRadius: '8px', fontSize: '11px' }} />
        <Bar dataKey={y_axis} radius={[3, 3, 0, 0]}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  if (chart_type === 'line') return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis dataKey={x_axis} stroke="#9ea4b0" tick={{ fontSize: 10 }} />
        <YAxis stroke="#9ea4b0" tick={{ fontSize: 10 }} />
        <Tooltip contentStyle={{ backgroundColor: '#1a1d24', border: 'none', borderRadius: '8px', fontSize: '11px' }} />
        <Line type="monotone" dataKey={y_axis} stroke="#6b4cff" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );

  if (chart_type === 'pie') return (
    <ResponsiveContainer width="100%" height={180}>
      <PieChart>
        <Pie data={data} dataKey={y_axis} nameKey={x_axis} cx="50%" cy="50%" outerRadius={70}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip contentStyle={{ backgroundColor: '#1a1d24', border: 'none', borderRadius: '8px', fontSize: '11px' }} />
        <Legend wrapperStyle={{ fontSize: '10px' }} />
      </PieChart>
    </ResponsiveContainer>
  );

  return null;
}

export default function Dashboard({ pinned, onUnpin, onClose }) {
  const [shareUrl, setShareUrl] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const res = await fetch('/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ charts: pinned, title: 'AgentDB Dashboard' })
    });
    const data = await res.json();
    const url = `${window.location.origin}/share/${data.token}`;
    setShareUrl(url);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="dashboard-overlay">
      <div className="dashboard-panel">
        <div className="dashboard-header">
          <LayoutDashboard size={18} color="#6b4cff" />
          <span>Dashboard</span>
          {pinned.length > 0 && (
            <button className="mac-btn" style={{ marginLeft: 8 }} onClick={handleShare}>
              <Share2 size={12} /> Share
            </button>
          )}
          {shareUrl && (
            <div className="share-url-row">
              <span className="share-url-text">{shareUrl}</span>
              <button className="insight-action-btn" onClick={handleCopy}>
                {copied ? <Check size={11} /> : <Link size={11} />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          )}
          <button className="dashboard-close" onClick={onClose}><X size={16} /></button>
        </div>
        {pinned.length === 0 ? (
          <div className="dashboard-empty">
            <p>No charts pinned yet.</p>
            <p style={{ fontSize: '0.82rem', color: '#9ea4b0', marginTop: '0.5rem' }}>
              Click the 📌 pin button on any chart to add it here.
            </p>
          </div>
        ) : (
          <div className="dashboard-grid">
            {pinned.map((item, i) => (
              <div key={i} className="dashboard-card">
                <div className="dashboard-card-header">
                  <span>{item.title}</span>
                  <button onClick={() => onUnpin(i)} title="Remove"><X size={12} /></button>
                </div>
                <MiniChart config={item} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
