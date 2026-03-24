import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Building, Calendar, Shield, FileText, User, CheckCircle, Circle, ChevronRight } from 'lucide-react';
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
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>{job.client}</span>
          <span className={`badge badge-${job.status}`} style={{ color: 'white', background: 'rgba(255,255,255,0.2)' }}>{job.status}</span>
        </div>
        <div style={{ padding: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-3)' }}>{job.id}</span>
            <span className={`badge badge-${job.priority === 'high' ? 'failed' : 'pending'}`}>{job.priority} priority</span>
          </div>

          {/* Progress bar */}
          <div style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Progress</span>
              <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text-2)' }}>{job.progress}%</span>
            </div>
            <div style={{ height: 5, borderRadius: 3, background: 'var(--bg)', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${job.progress}%`,
                background: job.status === 'failed' ? 'var(--red)' : job.progress === 100 ? 'var(--green)' : 'var(--orange)',
                borderRadius: 3,
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* Job info */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="card-header">
          <span className="card-title">Job Details</span>
        </div>
        <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <InfoRow icon={MapPin} label="Address" value={job.address} />
          <InfoRow icon={Building} label="Structure" value={job.structure} />
          <InfoRow icon={Calendar} label="Scheduled" value={job.scheduledDate} />
          <InfoRow icon={Shield} label="NFPA Class" value={`Class ${job.nfpaClass}`} />
          <InfoRow icon={FileText} label="Type" value={job.type} />
        </div>
      </div>

      {/* Technician */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="card-header">
          <span className="card-title">Assigned Technician</span>
        </div>
        <div style={{ padding: '12px 14px' }}>
          {tech ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 6,
                background: 'var(--blue-soft)', color: 'var(--blue)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600,
              }}>
                {tech.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{tech.name}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-3)' }}>{tech.license} · {tech.phone}</div>
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
      <div className="card" style={{ marginBottom: 12 }}>
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
                <div className="project-name" style={{ fontSize: 13 }}>{template?.label ?? formId}</div>
                <div className="project-meta">{template?.nfpaRef}</div>
              </div>
              {completed
                ? <span className="badge badge-complete">Done</span>
                : <ChevronRight size={14} style={{ color: 'var(--red)' }} />
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
          <div style={{ padding: '12px 14px', fontSize: 13, lineHeight: 1.6, color: 'var(--text-2)' }}>
            {job.notes}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      <Icon size={14} style={{ color: 'var(--text-3)', marginTop: 2, flexShrink: 0 }} />
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 13 }}>{value}</div>
      </div>
    </div>
  );
}
