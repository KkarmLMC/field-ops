import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../lib/supabase'
import { MOCK_REPORTS } from '../data/mockData'

export default function Reports() {
  const navigate = useNavigate()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    db.from('daily_field_logs')
      .select('*, projects(name)')
      .order('report_date', { ascending: false })
      .then(({ data }) => {
        setReports(data && data.length > 0 ? data : MOCK_REPORTS)
        setLoading(false)
      })
      .catch(() => {
        setReports(MOCK_REPORTS)
        setLoading(false)
      })
  }, [])

  const submitted = reports.filter(r => r.status === 'Submitted').length
  const reviewed  = reports.filter(r => r.status === 'Reviewed').length

  return (
    <div className="page-content fade-in">
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Total Reports</div>
          <div className="stat-value blue">{reports.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Submitted</div>
          <div className="stat-value amber">{submitted}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Reviewed</div>
          <div className="stat-value green">{reviewed}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Drafts</div>
          <div className="stat-value" style={{ color: 'var(--text-3)' }}>{reports.filter(r => r.status === 'Draft').length}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title"><span className="card-dot" style={{ background: 'var(--blue)' }} />Daily Field Reports</span>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/reports/new')}>+ New</button>
        </div>
        {loading ? (
          <div className="loading"><div className="spinner" /></div>
        ) : reports.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">📋</div>
            <div className="empty-title">No reports yet</div>
            <div className="empty-desc">Start a Daily Field Report from a project or tap + New above.</div>
            <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={() => navigate('/reports/new')}>+ Start Report</button>
          </div>
        ) : reports.map(r => (
          <div key={r.id} className="project-item" onClick={() => navigate(`/reports/${r.id}`)}>
            <div style={{ flex: 1 }}>
              <div className="project-name">{r.projects?.name || 'Unknown Project'}</div>
              <div className="project-meta">{r.report_date} · {r.submitted_by}</div>
              {r.hours_worked && <div className="project-meta" style={{ marginTop: 'var(--sp-1)' }}>{r.hours_worked}h on site</div>}
            </div>
            <span className={`badge ${r.status === 'Submitted' ? 'badge-awarded' : r.status === 'Reviewed' ? 'badge-complete' : 'badge-hold'}`}>
              {r.status}
            </span>
          </div>
        ))}
      </div>

      <button className="fab" onClick={() => navigate('/reports/new')}>+</button>
    </div>
  )
}
