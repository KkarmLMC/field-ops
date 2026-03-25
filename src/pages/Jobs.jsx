import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PROJECTS, TECHNICIANS } from '../data/mockData.js';

function getTechName(id) {
  return TECHNICIANS.find(t => t.id === id)?.name ?? '—';
}

const STATUSES = ['All', 'in-progress', 'scheduled', 'complete', 'failed'];
const STAGE_LABEL = { 'in-progress': 'Active', 'scheduled': 'Scheduled', 'complete': 'Complete', 'failed': 'Failed' }

export default function Jobs() {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');

  const filtered = PROJECTS.filter(j => {
    if (statusFilter !== 'All' && j.stage !== statusFilter) return false;
    if (search && !j.name.toLowerCase().includes(search.toLowerCase()) && !j.id.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const active    = PROJECTS.filter(j => j.stage === 'in-progress').length
  const scheduled = PROJECTS.filter(j => j.stage === 'scheduled').length
  const completed = PROJECTS.filter(j => j.stage === 'complete').length
  const failed    = PROJECTS.filter(j => j.stage === 'failed').length

  return (
    <div className="page-content fade-in">
      <div style={{ display:'flex', flexDirection:'column', gap:'var(--gap-md)' }}>
      {/* Stat cards */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Active</div>
          <div className="stat-value" style={{ color: 'var(--orange)' }}>{active}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Scheduled</div>
          <div className="stat-value amber">{scheduled}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Completed</div>
          <div className="stat-value green">{completed}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Failed</div>
          <div className="stat-value red">{failed}</div>
        </div>
      </div>

      {/* MagnifyingGlass */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 0.75rem', }}>
        <span style={{ color: 'var(--text-3)' }}>🔍</span>
        <input
          style={{ border: 'none', outline: 'none', background: 'none', fontFamily: 'var(--font)', fontSize: '0.875rem', color: 'var(--text-1)', width: '100%', boxShadow: 'none' }}
          placeholder="MagnifyingGlass jobs..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: '0.375rem', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {STATUSES.map(f => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            style={{
              flexShrink: 0, padding: '5px 12px', borderRadius: 20,
              border: '1px solid var(--border)', background: statusFilter === f ? 'var(--navy)' : 'var(--surface)',
              color: statusFilter === f ? 'white' : 'var(--text-2)',
              fontFamily: 'var(--font)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
            }}
          >{f === 'All' ? 'All' : (STAGE_LABEL[f] || f)}</button>
        ))}
      </div>

      {/* Job list */}
      <div className="card">
        <div className="card-header">
          <span className="card-title"><span className="card-dot" style={{ background: 'var(--orange)' }} />Jobs ({filtered.length})</span>
        </div>
        {filtered.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">⚡</div>
            <div className="empty-title">No projects match</div>
            <div className="empty-desc">Try adjusting your search or filters.</div>
          </div>
        ) : filtered.map(job => (
          <div key={job.id} className="project-item" onClick={() => navigate(`/installations/${job.id}`)}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="project-name">{job.name}</div>
              <div className="project-meta">
                {getTechName(job.lead_tech_id)} · {job.scheduled_date}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: '0.6875rem', color: 'var(--text-3)' }}>{job.job_number}</span>
                <span className={`badge badge-${job.type === 'site-survey' ? 'pending' : 'active'}`} style={{ fontSize: '0.625rem' }}>{job.type}</span>
              </div>
              {/* Progress bar */}
              {job.progress > 0 && (
                <div style={{ height: '0.1875rem', borderRadius: '0.125rem', background: 'var(--bg-4)', overflow: 'hidden', marginTop: 6 }}>
                  <div style={{
                    height: '100%',
                    width: `${job.progress}%`,
                    background: job.stage === 'failed' ? 'var(--red)' : job.progress === 100 ? 'var(--green)' : 'var(--orange)',
                    borderRadius: '0.125rem',
                  }} />
                </div>
              )}
            </div>
            <span className={`badge badge-${job.stage === 'in-progress' ? 'active' : job.stage === 'complete' ? 'completed' : job.stage}`} style={{ flexShrink: 0 }}>
              {STAGE_LABEL[job.stage] || job.stage}
            </span>
          </div>
        ))}
      </div>
      </div>{/* end flex column */}
    </div>
  );
}
