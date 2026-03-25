import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjects } from '../hooks/useProjects'
import { stageBadgeClass, stageColor } from '../lib/stages'

const FILTERS = ['All', 'In Progress', 'Awarded', 'Scheduled', 'Pending Review', 'Complete']

export default function Projects() {
  const navigate = useNavigate()
  const { projects, loading } = useProjects()
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')

  const filtered = projects.filter(p => {
    const mf = filter === 'All' || p.stage === filter
    const ms = !search || [p.name, p.customer_account, p.address, p.job_number]
      .some(v => v?.toLowerCase().includes(search.toLowerCase()))
    return mf && ms
  })

  const active    = projects.filter(p => p.stage === 'In Progress').length
  const awarded   = projects.filter(p => p.stage === 'Awarded').length
  const review    = projects.filter(p => p.stage === 'Pending Review').length
  const complete  = projects.filter(p => p.stage === 'Complete').length

  return (
    <div className="page-content fade-in">
      <div style={{ display:'flex', flexDirection:'column', gap:'var(--gap-md)' }}>
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">In Progress</div>
          <div className="stat-value orange">{active}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Awarded</div>
          <div className="stat-value blue">{awarded}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Needs Review</div>
          <div className="stat-value red">{review}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Complete</div>
          <div className="stat-value green">{complete}</div>
        </div>
      </div>

      {/* MagnifyingGlass */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 0.75rem' }}>
        <span style={{ color: 'var(--text-3)' }}>🔍</span>
        <input
          style={{ border: 'none', outline: 'none', background: 'none', fontFamily: 'var(--font)', fontSize: '0.875rem', color: 'var(--text-1)', width: '100%' }}
          placeholder="MagnifyingGlass projects..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: '0.375rem', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              flexShrink: 0, padding: '5px 12px', borderRadius: 20,
              border: '1px solid var(--border)', background: filter === f ? 'var(--navy)' : 'var(--surface)',
              color: filter === f ? 'white' : 'var(--text-2)',
              fontFamily: 'var(--font)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
            }}
          >{f}</button>
        ))}
      </div>

      <div className="card">
        {loading ? (
          <div className="loading"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">🏗️</div>
            <div className="empty-title">No projects yet</div>
            <div className="empty-desc">Projects will appear here once created in Mission Control or added manually.</div>
          </div>
        ) : filtered.map(p => (
          <div key={p.id} className="project-item" onClick={() => navigate(`/projects/${p.id}`)}>
            <div className="project-stage-dot" style={{ background: stageColor(p.stage) }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="project-name">{p.name}</div>
              <div className="project-meta">
                {p.customer_account && <span>{p.customer_account} · </span>}
                {p.address || p.city || '—'}
              </div>
              {p.job_number && (
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-3)', fontFamily: 'var(--mono)', marginTop: '0.125rem' }}>
                  {p.job_number}
                </div>
              )}
            </div>
            <span className={`badge ${stageBadgeClass(p.stage)}`} style={{ flexShrink: 0 }}>
              {p.stage}
            </span>
          </div>
        ))}
      </div>
      </div>{/* end flex column */}
    </div>
  )
}
