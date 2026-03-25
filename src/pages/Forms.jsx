import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CaretRight } from '@phosphor-icons/react'
import { db } from '../lib/supabase'
import { MOCK_SUBMISSIONS } from '../data/mockData'
import { COMPLETION_TYPES } from './CompletionForms'

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
      .then(({ data }) => {
        setSubmissions(data && data.length > 0 ? data : MOCK_SUBMISSIONS)
        setLoading(false)
      })
      .catch(() => {
        setSubmissions(MOCK_SUBMISSIONS)
        setLoading(false)
      })
  }, [])

  return (
    <div className="page-content fade-in">

      {/* ── Completion Forms card ─────────────────────────────────────── */}
      <div style={{ background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:6, marginBottom:12 }}>
        <div style={{ padding:'10px 14px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--text-dim)', textTransform:'uppercase', letterSpacing:'0.08em' }}>
            Completion Forms
          </span>
          <button onClick={()=>navigate('/forms/completion')} style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--accent)', display:'flex', alignItems:'center', gap:3 }}>
            View all <CaretRight size={10} />
          </button>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:1, background:'var(--border)' }}>
          {Object.entries(COMPLETION_TYPES).map(([type, cfg]) => {
            const Icon = cfg.icon
            return (
              <button key={type} onClick={()=>navigate(`/forms/completion?type=${type}`)}
                style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px', background:'var(--bg-2)', textAlign:'left', transition:'background 0.12s' }}
                onMouseEnter={e=>e.currentTarget.style.background='var(--bg-3)'}
                onMouseLeave={e=>e.currentTarget.style.background='var(--bg-2)'}
              >
                <div style={{ width:30, height:30, borderRadius:4, background:cfg.colorDim, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Icon size={14} style={{ color:cfg.color }} />
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:600, fontSize:12, marginBottom:1 }}>{cfg.short}</div>
                  <div style={{ fontFamily:'var(--mono)', fontSize:9, color:'var(--text-muted)', textTransform:'uppercase' }}>{cfg.ref}</div>
                </div>
                <CaretRight size={11} style={{ color:'var(--text-muted)', flexShrink:0 }} />
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Stats ─────────────────────────────────────────────────────── */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Total Forms</div>
          <div className="stat-value blue">{submissions.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Needs Review</div>
          <div className="stat-value red">{submissions.filter(s=>['Submitted','Under Review'].includes(s.status)).length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">With Customer</div>
          <div className="stat-value" style={{ color:'#7C3AED' }}>{submissions.filter(s=>s.status==='Pending Customer').length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Complete</div>
          <div className="stat-value green">{submissions.filter(s=>s.status==='Complete').length}</div>
        </div>
      </div>

      {/* ── Submissions list ───────────────────────────────────────────── */}
      <div className="card">
        <div className="card-header">
          <span className="card-title"><span className="card-dot" style={{ background:'var(--red)' }} />All Submissions</span>
          <button className="btn btn-primary btn-sm" onClick={()=>navigate('/forms/completion')}>+ New</button>
        </div>
        {loading ? (
          <div className="loading"><div className="spinner" /></div>
        ) : submissions.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">📝</div>
            <div className="empty-title">No forms yet</div>
            <div className="empty-desc">Start a completion form from the card above.</div>
          </div>
        ) : submissions.map(s => (
          <div key={s.id} className="project-item" onClick={()=>navigate(`/forms/${s.id}`)}>
            <div style={{ flex:1 }}>
              <div className="project-name">{s.projects?.name || 'Unknown Project'}</div>
              <div className="project-meta">{s.submitted_by} · {new Date(s.created_at).toLocaleDateString()}</div>
            </div>
            <span className={`badge ${STATUS_BADGE[s.status]||'badge-hold'}`}>{s.status}</span>
          </div>
        ))}
      </div>

      <button className="fab" onClick={()=>navigate('/forms/completion')}>+</button>
    </div>
  )
}
