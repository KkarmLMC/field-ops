import { useNavigate } from 'react-router-dom'
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

export default function Dashboard() {
  const navigate = useNavigate()
  const today = new Date().toISOString().slice(0, 10);
  const activeJobs = JOBS.filter(j => j.status === 'active' || (j.status === 'scheduled' && j.scheduledDate <= today));
  const recentJobs = JOBS.slice(0, 5);

  return (
    <div className="page-content fade-in">
      {/* Stat Cards */}
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
        {STAT_CARDS.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="stat-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div className="stat-label">{label}</div>
              <Icon size={14} style={{ color }} />
            </div>
            <div className="stat-value" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Active Jobs */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">
            <Activity size={14} style={{ color: 'var(--accent)' }} />
            Active & Today
          </span>
          <button className="btn btn-sm btn-secondary" onClick={() => navigate('/jobs')}>
            View All <ChevronRight size={12} />
          </button>
        </div>
        {activeJobs.length === 0 ? (
          <div className="empty">
            <div className="empty-desc">No active jobs today.</div>
          </div>
        ) : activeJobs.map(job => (
          <div key={job.id} className="project-item" onClick={() => navigate(`/jobs/${job.id}`)}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="project-name">{job.client}</div>
              <div className="project-meta" style={{ fontFamily: 'var(--mono)' }}>{job.id}</div>
            </div>
            <span className={`badge badge-${job.type === 'site-survey' ? 'pending' : job.status}`} style={{ marginRight: 4 }}>{job.type}</span>
            <span className={`badge badge-${job.status}`}>{job.status}</span>
          </div>
        ))}
      </div>

      {/* Recent Jobs */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Recent Jobs</span>
        </div>
        {recentJobs.map(job => (
          <div key={job.id} className="project-item" onClick={() => navigate(`/jobs/${job.id}`)}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="project-name">{job.client}</div>
              <div className="project-meta">{getTechName(job.assignedTo)} · {job.scheduledDate}</div>
            </div>
            <span className={`badge badge-${job.status}`}>{job.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
