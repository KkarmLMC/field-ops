import { useState } from 'react';
import { Search, Filter, ChevronRight } from 'lucide-react';
import { JOBS, TECHNICIANS } from '../data/mockData.js';

function getTechName(id) {
  return TECHNICIANS.find(t => t.id === id)?.name ?? '—';
}

const STATUSES = ['all', 'active', 'scheduled', 'completed', 'failed'];
const TYPES = ['all', 'installation', 'inspection', 'site-survey', 'certification', 'annual-test'];

export default function Jobs({ navigate }) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [techFilter, setTechFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = JOBS.filter(j => {
    if (statusFilter !== 'all' && j.status !== statusFilter) return false;
    if (typeFilter !== 'all' && j.type !== typeFilter) return false;
    if (techFilter !== 'all' && j.assignedTo !== techFilter) return false;
    if (search && !j.client.toLowerCase().includes(search.toLowerCase()) && !j.id.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontFamily: 'var(--head)', fontSize: 28, fontWeight: 700, letterSpacing: '0.02em' }}>Jobs</h1>
        <p style={{ color: 'var(--text-dim)', marginTop: 4 }}>{filtered.length} of {JOBS.length} jobs</p>
      </div>

      {/* Filter Bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 10,
        alignItems: 'center',
        background: 'var(--bg-2)',
        border: '1px solid var(--border)',
        borderRadius: 6,
        padding: '12px 16px',
      }}>
        <div style={{ position: 'relative', flex: '1 1 200px' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          <input
            placeholder="Search jobs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', paddingLeft: 32 }}
          />
        </div>
        <Filter size={14} style={{ color: 'var(--text-dim)' }} />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          {STATUSES.map(s => <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s}</option>)}
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          {TYPES.map(t => <option key={t} value={t}>{t === 'all' ? 'All Types' : t}</option>)}
        </select>
        <select value={techFilter} onChange={e => setTechFilter(e.target.value)}>
          <option value="all">All Techs</option>
          {TECHNICIANS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      {/* Table header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '110px 1.5fr 100px 90px 120px 90px 80px 24px',
        gap: 12,
        padding: '0 16px',
        alignItems: 'center',
      }}>
        <span className="label">Job ID</span>
        <span className="label">Client</span>
        <span className="label">Type</span>
        <span className="label">Status</span>
        <span className="label">Technician</span>
        <span className="label">Date</span>
        <span className="label">Progress</span>
        <span />
      </div>

      {/* Job rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {filtered.map(job => (
          <button
            key={job.id}
            onClick={() => navigate('job-detail', { job })}
            style={{
              display: 'grid',
              gridTemplateColumns: '110px 1.5fr 100px 90px 120px 90px 80px 24px',
              gap: 12,
              alignItems: 'center',
              background: 'var(--bg-2)',
              border: '1px solid var(--border)',
              borderRadius: 4,
              padding: '12px 16px',
              textAlign: 'left',
              width: '100%',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-bright)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-dim)' }}>{job.id}</span>
            <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.client}</span>
            <span className={`badge badge-${job.type === 'site-survey' ? 'pending' : job.status}`} style={{ fontSize: 10 }}>{job.type}</span>
            <span className={`badge badge-${job.status}`}>{job.status}</span>
            <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{getTechName(job.assignedTo)}</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-dim)' }}>{job.scheduledDate}</span>
            {/* Progress bar */}
            <div style={{
              height: 4,
              borderRadius: 2,
              background: 'var(--bg-4)',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${job.progress}%`,
                background: job.status === 'failed' ? 'var(--red)' : job.progress === 100 ? 'var(--green)' : 'var(--accent)',
                borderRadius: 2,
                transition: 'width 0.3s',
              }} />
            </div>
            <ChevronRight size={14} style={{ color: 'var(--text-dim)' }} />
          </button>
        ))}
        {filtered.length === 0 && (
          <p style={{ color: 'var(--text-dim)', fontStyle: 'italic', padding: '20px 0', textAlign: 'center' }}>
            No jobs match your filters.
          </p>
        )}
      </div>
    </div>
  );
}
