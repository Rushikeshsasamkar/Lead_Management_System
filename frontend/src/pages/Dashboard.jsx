import { useState, useEffect } from 'react'
import api from '../services/api'

const STATUS_CONFIG = {
  new:       { color: '#3b82f6', bg: '#eff6ff', icon: '🆕', label: 'New' },
  contacted: { color: '#f59e0b', bg: '#fffbeb', icon: '📞', label: 'Contacted' },
  qualified: { color: '#8b5cf6', bg: '#f5f3ff', icon: '✅', label: 'Qualified' },
  won:       { color: '#10b981', bg: '#ecfdf5', icon: '🏆', label: 'Won' },
  lost:      { color: '#ef4444', bg: '#fef2f2', icon: '❌', label: 'Lost' },
}

const SOURCE_CONFIG = {
  website:  { color: '#0ea5e9', icon: '🌐' },
  referral: { color: '#10b981', icon: '🤝' },
  cold:     { color: '#6366f1', icon: '📧' },
  social:   { color: '#f43f5e', icon: '📱' },
  other:    { color: '#94a3b8', icon: '📁' },
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dateFilter, setDateFilter] = useState({ createdFrom: '', createdTo: '' })

  useEffect(() => {
    fetchStats()
  }, [dateFilter])

  async function fetchStats() {
    setLoading(true)
    try {
      const params = {}
      if (dateFilter.createdFrom) params.createdFrom = dateFilter.createdFrom
      if (dateFilter.createdTo) params.createdTo = dateFilter.createdTo
      const res = await api.get('/leads/stats/summary', { params })
      setStats(res.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load stats')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '36px', marginBottom: '12px' }}>📊</div>
        <div style={{ color: '#888', fontSize: '15px' }}>Loading dashboard...</div>
      </div>
    </div>
  )

  if (error) return <div className="page"><div className="alert alert-error">{error}</div></div>
  if (!stats) return null

  const wonCount = stats.byStatus.won || 0
  const winRate = stats.totalLeads > 0 ? ((wonCount / stats.totalLeads) * 100).toFixed(1) : 0
  const activeLeads = (stats.byStatus.new || 0) + (stats.byStatus.contacted || 0) + (stats.byStatus.qualified || 0)

  return (
    <div className="page" style={{ background: '#f4f5f9', minHeight: '100vh' }}>

      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#16213e', marginBottom: '3px' }}>Dashboard</h1>
          <p style={{ color: '#888', fontSize: '13.5px' }}>Track your lead pipeline performance</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', padding: '8px 14px', borderRadius: '8px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', border: '1px solid #eaecf0' }}>
          <span style={{ fontSize: '13px', color: '#888' }}>📅</span>
          <input
            type="date"
            aria-label="From date"
            value={dateFilter.createdFrom}
            onChange={e => setDateFilter(prev => ({ ...prev, createdFrom: e.target.value }))}
            onClick={e => e.target.showPicker?.()}
            style={{ border: 'none', outline: 'none', fontSize: '13px', color: '#444', cursor: 'pointer', background: 'transparent' }}
          />
          <span style={{ color: '#ccc' }}>—</span>
          <input
            type="date"
            aria-label="To date"
            value={dateFilter.createdTo}
            onChange={e => setDateFilter(prev => ({ ...prev, createdTo: e.target.value }))}
            onClick={e => e.target.showPicker?.()}
            style={{ border: 'none', outline: 'none', fontSize: '13px', color: '#444', cursor: 'pointer', background: 'transparent' }}
          />
          {(dateFilter.createdFrom || dateFilter.createdTo) && (
            <button
              onClick={() => setDateFilter({ createdFrom: '', createdTo: '' })}
              style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#e8405a', fontSize: '16px', lineHeight: 1, padding: '0 2px' }}
            >×</button>
          )}
        </div>
      </div>

      {/* top summary row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <SummaryCard
          icon="📋"
          label="Total Leads"
          value={stats.totalLeads}
          color="#e8405a"
          bg="#fff0f3"
          sub="all time"
        />
        <SummaryCard
          icon="🔥"
          label="Active Pipeline"
          value={activeLeads}
          color="#f59e0b"
          bg="#fffbeb"
          sub="new + contacted + qualified"
        />
        <SummaryCard
          icon="🏆"
          label="Won Deals"
          value={wonCount}
          color="#10b981"
          bg="#ecfdf5"
          sub={`${winRate}% win rate`}
        />
        <SummaryCard
          icon="📉"
          label="Lost Leads"
          value={stats.byStatus.lost || 0}
          color="#ef4444"
          bg="#fef2f2"
          sub="closed lost"
        />
      </div>

      {/* status + source row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>

        {/* status breakdown */}
        <div style={{ background: '#fff', borderRadius: '10px', padding: '22px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#16213e', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📊</span> Lead Status
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {Object.entries(stats.byStatus).map(([status, count]) => {
              const pct = stats.totalLeads > 0 ? (count / stats.totalLeads * 100).toFixed(1) : 0
              const cfg = STATUS_CONFIG[status] || { color: '#999', bg: '#f5f5f5', icon: '•', label: status }
              return (
                <div key={status}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                      <span style={{
                        background: cfg.bg, color: cfg.color,
                        padding: '2px 8px', borderRadius: '12px',
                        fontSize: '12px', fontWeight: '600'
                      }}>
                        {cfg.icon} {cfg.label}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#555', fontWeight: '600' }}>
                      {count} <span style={{ color: '#aaa', fontWeight: '400' }}>({pct}%)</span>
                    </div>
                  </div>
                  <div style={{ height: '7px', background: '#f1f2f5', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${pct}%`,
                      background: cfg.color,
                      borderRadius: '4px',
                      transition: 'width 0.6s ease'
                    }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* source breakdown */}
        <div style={{ background: '#fff', borderRadius: '10px', padding: '22px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#16213e', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🎯</span> Lead Sources
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {Object.entries(stats.bySource)
              .sort((a, b) => b[1] - a[1])
              .map(([source, count]) => {
                const pct = stats.totalLeads > 0 ? (count / stats.totalLeads * 100).toFixed(1) : 0
                const cfg = SOURCE_CONFIG[source] || { color: '#94a3b8', icon: '📁' }
                return (
                  <div key={source} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '8px',
                      background: cfg.color + '18',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '16px', flexShrink: 0
                    }}>
                      {cfg.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#333', textTransform: 'capitalize' }}>{source}</span>
                        <span style={{ fontSize: '13px', color: '#666' }}>{count} <span style={{ color: '#aaa' }}>({pct}%)</span></span>
                      </div>
                      <div style={{ height: '5px', background: '#f1f2f5', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${pct}%`,
                          background: cfg.color,
                          borderRadius: '3px',
                          transition: 'width 0.6s ease'
                        }} />
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      </div>

      {/* donut-style status summary row */}
      <div style={{ background: '#fff', borderRadius: '10px', padding: '22px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
        <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#16213e', marginBottom: '18px' }}>
          📌 Quick Overview
        </h2>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {Object.entries(stats.byStatus).map(([status, count]) => {
            const cfg = STATUS_CONFIG[status] || { color: '#999', bg: '#f5f5f5', icon: '•', label: status }
            return (
              <div key={status} style={{
                flex: '1 1 120px',
                background: cfg.bg,
                borderRadius: '10px',
                padding: '16px',
                textAlign: 'center',
                border: `1px solid ${cfg.color}22`
              }}>
                <div style={{ fontSize: '22px', marginBottom: '6px' }}>{cfg.icon}</div>
                <div style={{ fontSize: '26px', fontWeight: '800', color: cfg.color, lineHeight: 1 }}>{count}</div>
                <div style={{ fontSize: '12px', color: cfg.color + 'bb', marginTop: '4px', fontWeight: '600', textTransform: 'capitalize' }}>{cfg.label}</div>
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}

function SummaryCard({ icon, label, value, color, bg, sub }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: '10px',
      padding: '20px',
      boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
      borderTop: `4px solid ${color}`,
      display: 'flex',
      flexDirection: 'column',
      gap: '4px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '13px', color: '#888', fontWeight: '500' }}>{label}</span>
        <span style={{
          background: bg, color: color,
          width: '34px', height: '34px',
          borderRadius: '8px', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          fontSize: '16px'
        }}>{icon}</span>
      </div>
      <div style={{ fontSize: '32px', fontWeight: '800', color: color, lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: '12px', color: '#aaa' }}>{sub}</div>
    </div>
  )
}
