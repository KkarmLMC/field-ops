import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../lib/supabase'

const STATUS_BADGE = {
  'Draft':            'badge-hold',
  'Submitted':        'badge-awarded',
  'Under Review':     'badge-scheduled',
  'Pending Customer': 'badge-customer',
  'Customer Signed':  'badge-signed',
  'Complete':         'badge-complete',
  'Rejected':         'badge-review',
}

export default function Forms() {
  const navigate = useNavigate()
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    db.from('form_submissions')
      .select('*, projects(name)')
      .order('created_at', { ascending: false })
      .then(({ data }) => { setSubmissions(data || []); setLoading(false) })
  }, [])

  const pending = submissions.filter(s => ['Submitted', 'Under Review'].includes(s.status)).length

  return (
    <div className="page-content fade-in">
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Total Forms</div>
          <div className="stat-value blue">{submissions.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Needs Review</div>
          <div className="stat-value red">{pending}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">With Customer</div>
          <div className="stat-value" style={{ color: '#7C3AED' }}>{submissions.filter(s => s.status === 'Pending Customer').length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Complete</div>
          <div className="stat-value green">{submissions.filter(s => s.status === 'Complete').length}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title"><span className="card-dot" style={{ background: 'var(--red)' }} />Completion Forms</span>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/forms/new')}>+ New</button>
        </div>
        {loading ? (
          <div className="loading"><div className="spinner" /></div>
        ) : submissions.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">📝</div>
            <div className="empty-title">No forms yet</div>
            <div className="empty-desc">Start a completion form from a project or tap + New above.</div>
            <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={() => navigate('/forms/new')}>+ Start Form</button>
          </div>
        ) : submissions.map(s => (
          <div key={s.id} className="project-item" onClick={() => navigate(`/forms/${s.id}`)}>
            <div style={{ flex: 1 }}>
              <div className="project-name">{s.projects?.name || 'Unknown Project'}</div>
              <div className="project-meta">{s.submitted_by} · {new Date(s.created_at).toLocaleDateString()}</div>
            </div>
            <span className={`badge ${STATUS_BADGE[s.status] || 'badge-hold'}`}>{s.status}</span>
          </div>
        ))}
      </div>

      <button className="fab" onClick={() => navigate('/forms/new')}>+</button>
    </div>
  )
}
