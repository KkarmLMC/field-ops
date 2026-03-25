import { useNavigate } from 'react-router-dom';
import { TECHNICIANS, JOBS } from '../data/mockData.js';

export default function Technicians() {
  const navigate = useNavigate()
  const inField = TECHNICIANS.filter(t => t.status === 'field').length

  return (
    <div className="page-content fade-in">
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Total Techs</div>
          <div className="stat-value blue">{TECHNICIANS.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">In Field</div>
          <div className="stat-value" style={{ color: 'var(--orange)' }}>{inField}</div>
        </div>
      </div>

      {TECHNICIANS.map(tech => {
        const techJobs = JOBS.filter(j => j.assignedTo === tech.id);
        return (
          <div key={tech.id} className="card" style={{ marginBottom: '0.75rem' }}>
            <div style={{ padding: '14px', borderBottom: techJobs.length > 0 ? '1px solid var(--border-l)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: '2.5rem', height: '2.5rem', borderRadius: '0.375rem',
                  background: tech.status === 'field' ? 'var(--orange-s)' : 'var(--blue-soft)',
                  color: tech.status === 'field' ? 'var(--orange)' : 'var(--blue)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--mono)', fontSize: 'var(--fs-xs)', fontWeight: 600,
                }}>
                  {tech.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 'var(--fs-lg)' }}>{tech.name}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 'var(--fs-xs)', color: 'var(--text-3)', marginTop: '0.125rem' }}>
                    {tech.license} · {tech.phone}
                  </div>
                </div>
                <span className={`badge badge-${tech.status === 'field' ? 'active' : 'completed'}`}>
                  {tech.status === 'field' ? 'In Field' : 'Active'}
                </span>
              </div>
            </div>

            {/* Assigned jobs */}
            {techJobs.length > 0 && (
              <div style={{ padding: '8px 14px 10px' }}>
                <div style={{ fontSize: 'var(--fs-xs)', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 'var(--sp-1)' }}>
                  Assigned Jobs ({techJobs.length})
                </div>
                {techJobs.map(job => (
                  <div
                    key={job.id}
                    className="project-item"
                    style={{ padding: '8px 0', gap: '0.5rem' }}
                    onClick={() => navigate(`/installations/installs/${job.id}`)}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 'var(--fs-md)', fontWeight: 500 }}>{job.siteName}</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: '0.625rem', color: 'var(--text-3)' }}>{job.id}</div>
                    </div>
                    <span className={`badge badge-${job.status}`}>{job.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
