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
      <div style={{ marginBottom:12 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
          <span style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--text-dim)', textTransform:'uppercase', letterSpacing:'0.08em' }}>
            Completion Forms
          </span>
          <button onClick={()=>navigate('/forms/completion')} style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--accent)', display:'flex', alignItems:'center', gap:3 }}>
            View all <CaretRight size={10} />
          </button>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          {Object.entries(COMPLETION_TYPES).map(([type, cfg]) => {
            const Icon = cfg.icon
            return (
              <button key={type} onClick={()=>navigate(`/forms/completion?type=${type}`)}
                style={{
                  display:'flex', alignItems:'center', gap:10, padding:'12px 14px',
                  background:'#EEF3FF', border:'1.5px solid #D0DBFF',
                  borderRadius:14, textAlign:'left',
                  transition:'transform 0.12s, box-shadow 0.12s',
                  boxShadow:'0 1px 4px rgba(30,60,180,0.06)',
                }}
                onMouseEnter={e=>{ e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 4px 12px rgba(30,60,180,0.12)' }}
                onMouseLeave={e=>{ e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='0 1px 4px rgba(30,60,180,0.06)' }}
              >
                <div style={{ width:30, height:30, borderRadius:8, background:'#fff', border:'1.5px solid #D0DBFF', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Icon size={14} style={{ color:'#1E3CB4' }} />
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:12, color:'#0D1F6B', marginBottom:1 }}>{cfg.short}</div>
                  <div style={{ fontFamily:'var(--mono)', fontSize:9, color:'#8AAAE0', textTransform:'uppercase' }}>{cfg.ref}</div>
                </div>
                <CaretRight size={11} style={{ color:'#7A9EE0', flexShrink:0 }} />
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
