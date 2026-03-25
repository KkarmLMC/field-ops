import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Buildings, CalendarBlank, Shield, FileText, User, CheckCircle, Circle, CaretRight } from '@phosphor-icons/react';
import { JOBS, TECHNICIANS, FORM_TEMPLATES } from '../data/mockData.js';

function getTech(id) {
  return TECHNICIANS.find(t => t.id === id);
}

const ALL_FORMS = ['site-survey', 'installation', 'inspection'];

export default function JobDetail() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const job = JOBS.find(j => j.id === jobId)

  if (!job) {
    return (
      <div className="page-content fade-in">
        <div className="empty">
          <div className="empty-icon">🔍</div>
          <div className="empty-title">Job not found</div>
          <div className="empty-desc">The job "{jobId}" could not be found.</div>
          <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => navigate('/jobs')}>
            Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  const tech = getTech(job.assignedTo);

  return (
    <div className="page-content fade-in">
      {/* Job header card */}
      <div className="card" style={{ marginBottom: '0.75rem' }}>
        <div className="section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>{job.siteName}</span>
          <span className={`badge badge-${job.status}`} style={{ color: 'white', background: 'rgba(255,255,255,0.2)' }}>{job.status}</span>
        </div>
        <div style={{ padding: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: '0.75rem', color: 'var(--text-3)' }}>{job.id}</span>
            <span className={`badge badge-${job.priority === 'high' ? 'failed' : 'pending'}`}>{job.priority} priority</span>
          </div>

          {/* Progress bar */}
          <div style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-3)' }}>Progress</span>
              <span style={{ fontSize: '0.6875rem', fontFamily: 'var(--mono)', color: 'var(--text-2)' }}>{job.progress}%</span>
            </div>
            <div style={{ height: '0.3125rem', borderRadius: '0.1875rem', background: 'var(--bg)', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${job.progress}%`,
                background: job.status === 'failed' ? 'var(--red)' : job.progress === 100 ? 'var(--green)' : 'var(--orange)',
                borderRadius: '0.1875rem',
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* Job info */}
      <div className="card" style={{ marginBottom: '0.75rem' }}>
        <div className="card-header">
          <span className="card-title">Job Details</span>
        </div>
        <div style={{ padding: '0.75rem 0.875rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          <InfoRow icon={MapPin} label="Address" value={job.address} />
          <InfoRow icon={Buildings} label="Structure" value={job.structure} />
          <InfoRow icon={CalendarBlank} label="Scheduled" value={job.scheduledDate} />
          <InfoRow icon={Shield} label="NFPA Class" value={`Class ${job.nfpaClass}`} />
          <InfoRow icon={FileText} label="Type" value={job.type} />
        </div>
      </div>

      {/* Technician */}
      <div className="card" style={{ marginBottom: '0.75rem' }}>
        <div className="card-header">
          <span className="card-title">Assigned Technician</span>
        </div>
        <div style={{ padding: '0.75rem 0.875rem' }}>
          {tech ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: '2.5rem', height: '2.5rem', borderRadius: '0.375rem',
                background: 'var(--blue-soft)', color: 'var(--blue)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--mono)', fontSize: '0.8125rem', fontWeight: 600,
              }}>
                {tech.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{tech.name}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '0.75rem', color: 'var(--text-3)' }}>{tech.license} · {tech.phone}</div>
              </div>
              <span className={`badge badge-${tech.status === 'field' ? 'active' : 'completed'}`}>
                {tech.status === 'field' ? 'In Field' : 'Active'}
              </span>
            </div>
          ) : (
            <div className="project-meta">Unassigned</div>
          )}
        </div>
      </div>

      {/* Forms checklist */}
      <div className="card" style={{ marginBottom: '0.75rem' }}>
        <div className="card-header">
          <span className="card-title"><span className="card-dot" style={{ background: 'var(--red)' }} />NFPA Forms</span>
        </div>
        {ALL_FORMS.map(formId => {
          const completed = job.forms.includes(formId);
          const template = FORM_TEMPLATES[formId];
          return (
            <div
              key={formId}
              className="project-item"
              onClick={() => { if (!completed) navigate(`/jobs/${job.id}/form/${formId}`) }}
              style={{ cursor: completed ? 'default' : 'pointer', background: completed ? 'var(--green-s)' : undefined }}
            >
              {completed
                ? <CheckCircle size={18} style={{ color: 'var(--green)', flexShrink: 0 }} />
                : <Circle size={18} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
              }
              <div style={{ flex: 1 }}>
                <div className="project-name" style={{ fontSize: '0.8125rem' }}>{template?.label ?? formId}</div>
                <div className="project-meta">{template?.nfpaRef}</div>
              </div>
              {completed
                ? <span className="badge badge-complete">Done</span>
                : <CaretRight size={14} style={{ color: 'var(--red)' }} />
              }
            </div>
          );
        })}
      </div>

      {/* Notes */}
      {job.notes && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Notes</span>
          </div>
          <div style={{ padding: '0.75rem 0.875rem', fontSize: '0.8125rem', lineHeight: 1.6, color: 'var(--text-2)' }}>
            {job.notes}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div style={{ display: 'flex', gap: '0.625rem' }}>
      <Icon size={14} style={{ color: 'var(--text-3)', marginTop: '0.125rem', flexShrink: 0 }} />
      <div>
        <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-3)', marginBottom: '0.125rem' }}>{label}</div>
        <div style={{ fontSize: '0.8125rem' }}>{value}</div>
      </div>
    </div>
  );
}
