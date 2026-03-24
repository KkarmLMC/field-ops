import { Phone, Shield, ChevronRight } from 'lucide-react';
import { TECHNICIANS, JOBS } from '../data/mockData.js';

export default function Technicians({ navigate }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ fontFamily: 'var(--head)', fontSize: 28, fontWeight: 700, letterSpacing: '0.02em' }}>Technicians</h1>
        <p style={{ color: 'var(--text-dim)', marginTop: 4 }}>{TECHNICIANS.length} registered technicians</p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 16,
      }}>
        {TECHNICIANS.map(tech => {
          const techJobs = JOBS.filter(j => j.assignedTo === tech.id);
          return (
            <div
              key={tech.id}
              style={{
                background: 'var(--bg-2)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                overflow: 'hidden',
              }}
            >
              {/* Tech Header */}
              <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 4,
                    background: tech.status === 'field' ? 'var(--accent-dim)' : 'var(--bg-4)',
                    color: tech.status === 'field' ? 'var(--accent)' : 'var(--text-dim)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 500,
                  }}>
                    {tech.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{tech.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      <Shield size={11} style={{ color: 'var(--text-dim)' }} />
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-dim)' }}>{tech.license}</span>
                    </div>
                  </div>
                  <span className={`badge badge-${tech.status === 'field' ? 'active' : 'completed'}`}>
                    {tech.status === 'field' ? 'In Field' : 'Active'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12 }}>
                  <Phone size={12} style={{ color: 'var(--text-dim)' }} />
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-dim)' }}>{tech.phone}</span>
                </div>
              </div>

              {/* Assigned Jobs */}
              <div style={{ padding: '12px 16px' }}>
                <span className="label" style={{ marginBottom: 8, display: 'block' }}>
                  Assigned Jobs ({techJobs.length})
                </span>
                {techJobs.length === 0 && (
                  <p style={{ color: 'var(--text-muted)', fontSize: 12, fontStyle: 'italic', padding: '4px 0' }}>
                    No jobs assigned
                  </p>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {techJobs.map(job => (
                    <button
                      key={job.id}
                      onClick={() => navigate('job-detail', { job })}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 10px',
                        background: 'var(--bg-3)',
                        border: '1px solid var(--border)',
                        borderRadius: 3,
                        textAlign: 'left',
                        width: '100%',
                        transition: 'border-color 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-bright)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-dim)', flexShrink: 0 }}>
                          {job.id}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {job.client}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        <span className={`badge badge-${job.status}`} style={{ fontSize: 9 }}>{job.status}</span>
                        <ChevronRight size={12} style={{ color: 'var(--text-dim)' }} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
