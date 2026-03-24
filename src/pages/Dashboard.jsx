import { Activity, CheckCircle, Clock, AlertTriangle, Users, Zap, ChevronRight } from 'lucide-react';
import { JOBS, TECHNICIANS, STATS } from '../data/mockData.js';

const STAT_CARDS = [
  { label: 'Jobs This Month', value: STATS.jobsThisMonth, icon: Zap, color: 'var(--accent)' },
  { label: 'Completed', value: STATS.jobsCompleted, icon: CheckCircle, color: 'var(--green)' },
  { label: 'Pending', value: STATS.jobsPending, icon: Clock, color: 'var(--blue)' },
  { label: 'Failed', value: STATS.jobsFailed, icon: AlertTriangle, color: 'var(--red)' },
  { label: 'Techs in Field', value: STATS.techsInField, icon: Users, color: 'var(--accent)' },
];

function getTechName(id) {
  return TECHNICIANS.find(t => t.id === id)?.name ?? '—';
}

export default function Dashboard({ navigate }) {
  const today = new Date().toISOString().slice(0, 10);
  const activeJobs = JOBS.filter(j => j.status === 'active' || (j.status === 'scheduled' && j.scheduledDate <= today));
  const recentJobs = JOBS.slice(0, 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontFamily: 'var(--head)', fontSize: 28, fontWeight: 700, letterSpacing: '0.02em' }}>
          Dashboard
        </h1>
        <p style={{ color: 'var(--text-dim)', marginTop: 4 }}>Bolt Lightning Protection — Ops Overview</p>
      </div>

      {/* Stat Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: 12,
      }}>
        {STAT_CARDS.map(({ label, value, icon: Icon, color }) => (
          <div key={label} style={{
            background: 'var(--bg-2)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            padding: '16px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="label">{label}</span>
              <Icon size={14} style={{ color }} />
            </div>
            <span style={{ fontFamily: 'var(--head)', fontSize: 32, fontWeight: 700, color }}>
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* Active Jobs */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ fontFamily: 'var(--head)', fontSize: 18, fontWeight: 600 }}>
            <Activity size={14} style={{ marginRight: 8, color: 'var(--accent)' }} />
            Active &amp; Today
          </h2>
          <button
            onClick={() => navigate('jobs')}
            style={{ fontSize: 12, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            View All <ChevronRight size={12} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {activeJobs.length === 0 && (
            <p style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>No active jobs today.</p>
          )}
          {activeJobs.map(job => (
            <button
              key={job.id}
              onClick={() => navigate('job-detail', { job })}
              style={{
                display: 'grid',
                gridTemplateColumns: '110px 1fr auto auto auto',
                alignItems: 'center',
                gap: 16,
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
              <span style={{ fontWeight: 500 }}>{job.client}</span>
              <span className={`badge badge-${job.type === 'site-survey' ? 'pending' : job.status}`}>{job.type}</span>
              <span className={`badge badge-${job.status}`}>{job.status}</span>
              <ChevronRight size={14} style={{ color: 'var(--text-dim)' }} />
            </button>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 style={{ fontFamily: 'var(--head)', fontSize: 18, fontWeight: 600, marginBottom: 12 }}>
          Recent Jobs
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {recentJobs.map(job => (
            <button
              key={job.id}
              onClick={() => navigate('job-detail', { job })}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--bg-2)',
                border: '1px solid var(--border)',
                borderRadius: 4,
                padding: '10px 16px',
                textAlign: 'left',
                width: '100%',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-bright)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-dim)' }}>{job.id}</span>
                <span style={{ fontWeight: 500 }}>{job.client}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{getTechName(job.assignedTo)}</span>
                <span className={`badge badge-${job.status}`}>{job.status}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
