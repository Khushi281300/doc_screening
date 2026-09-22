import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  ShieldAlert, 
  Clock, 
  Users 
} from 'lucide-react';
import { getCheckpointAnalytics } from '../../api/client';

export default function CheckpointAnalytics() {
  const [metrics, setMetrics] = useState({
    total_scans_today: 142,
    verified_count: 118,
    manual_review_count: 16,
    rejected_count: 8,
    fraud_rate_percentage: 5.6,
    average_inspection_time_sec: 1.4,
    active_officers_count: 6,
    attack_vectors: [
      { name: "Passport Number / Checksum Alteration", count: 14, percentage: 38.0, color: "#DC2626" },
      { name: "Digital Photo Editing (Photoshop)", count: 11, percentage: 30.0, color: "#0F766E" },
      { name: "Screen Photo / Replay Attack", count: 6, percentage: 16.0, color: "#B66D26" },
      { name: "Wrong Person / Face Mismatch", count: 4, percentage: 11.0, color: "#0F766E" },
      { name: "Alert List Matches", count: 2, percentage: 5.0, color: "#64748B" }
    ],
    hourly_throughput: [
      { hour: "08:00", scans: 18, flagged: 1 },
      { hour: "10:00", scans: 34, flagged: 3 },
      { hour: "12:00", scans: 42, flagged: 2 },
      { hour: "14:00", scans: 29, flagged: 4 },
      { hour: "16:00", scans: 38, flagged: 1 },
      { hour: "18:00", scans: 25, flagged: 2 },
    ]
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getCheckpointAnalytics();
        if (data) setMetrics(data);
      } catch (err) {
        console.warn("Using offline analytics snapshot", err);
      }
    };
    fetchStats();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Title */}
      <div>
        <h1 style={{
          fontFamily: '"Cormorant Garamond", "Playfair Display", Georgia, cursive, serif',
          fontStyle: 'italic',
          fontSize: 28,
          color: '#0F172A',
        }}>
          Daily Checkpoint Summary
        </h1>
        <p style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>
          Today's inspection volume, detection rates, and common forgery patterns.
        </p>
      </div>

      {/* 4 Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        <div className="card" style={{ padding: 18, background: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Documents Checked Today</span>
            <div style={{ fontSize: 26, fontWeight: 800, fontFamily: '"JetBrains Mono", monospace', color: '#0F172A', marginTop: 4 }}>
              {metrics.total_scans_today}
            </div>
            <div style={{ fontSize: 11, color: '#4A8C5C', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
              <TrendingUp size={12} /> +14% vs yesterday
            </div>
          </div>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: '#FDEEF3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BarChart3 size={20} color="#0F766E" />
          </div>
        </div>

        <div className="card" style={{ padding: 18, background: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Fraud Rate</span>
            <div style={{ fontSize: 26, fontWeight: 800, fontFamily: '"JetBrains Mono", monospace', color: '#DC2626', marginTop: 4 }}>
              {metrics.fraud_rate_percentage}%
            </div>
            <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>
              {metrics.rejected_count} fraudulent IDs intercepted
            </div>
          </div>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: '#FEF1F3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldAlert size={20} color="#DC2626" />
          </div>
        </div>

        <div className="card" style={{ padding: 18, background: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Avg AI Speed</span>
            <div style={{ fontSize: 26, fontWeight: 800, fontFamily: '"JetBrains Mono", monospace', color: '#0F172A', marginTop: 4 }}>
              {metrics.average_inspection_time_sec}s
            </div>
            <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>
              Instant verification
            </div>
          </div>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: '#FFF4EE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={20} color="#B66D26" />
          </div>
        </div>

        <div className="card" style={{ padding: 18, background: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Active Checkpoints</span>
            <div style={{ fontSize: 26, fontWeight: 800, fontFamily: '"JetBrains Mono", monospace', color: '#0F172A', marginTop: 4 }}>
              {metrics.active_officers_count} Lanes
            </div>
            <div style={{ fontSize: 11, color: '#4A8C5C', marginTop: 4 }}>
              All gates online
            </div>
          </div>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: '#F0F8F3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={20} color="#4A8C5C" />
          </div>
        </div>
      </div>

      {/* Breakdown Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Threat breakdown */}
        <div className="card" style={{ padding: 20, background: '#FFFFFF' }}>
          <p className="section-label">Most Common Alteration Types</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }}>
            {metrics.attack_vectors.map((vec, idx) => (
              <div key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                  <span style={{ fontWeight: 600, color: '#334155' }}>{vec.name}</span>
                  <span style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, color: '#0F172A' }}>
                    {vec.count} cases ({vec.percentage}%)
                  </span>
                </div>
                <div className="progress">
                  <div className="progress-fill" style={{ width: `${vec.percentage}%`, background: vec.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hourly activity */}
        <div className="card" style={{ padding: 20, background: '#FFFFFF' }}>
          <p className="section-label">Today's Hourly Activity</p>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: 160, paddingTop: 20 }}>
            {metrics.hourly_throughput.map((item, idx) => {
              const maxScans = 50;
              const heightPct = Math.round((item.scans / maxScans) * 100);
              return (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, fontFamily: '"JetBrains Mono", monospace', color: '#64748B' }}>
                    {item.scans}
                  </div>
                  <div style={{
                    width: 24,
                    height: `${heightPct}%`,
                    minHeight: 12,
                    borderRadius: '8px 8px 4px 4px',
                    background: 'linear-gradient(180deg, #0F766E, #E2E8F0)',
                  }} />
                  <div style={{ fontSize: 10.5, color: '#94A3B8', fontFamily: '"JetBrains Mono", monospace' }}>
                    {item.hour}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

