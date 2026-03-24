import { ArrowLeft, MapPin, Building, Calendar, Shield, User, FileText, ChevronRight, CheckCircle, Circle } from 'lucide-react';
import { TECHNICIANS, FORM_TEMPLATES } from '../data/mockData.js';

function getTech(id) {
  return TECHNICIANS.find(t => t.id === id);
}

const ALL_FORMS = ['site-survey', 'installation', 'inspection'];

export default function JobDetail({ job, navigate }) {
  if (!job) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-dim)' }}>
        <p>No job selected.</p>
        <button onClick={() => navigate('jobs')} style={{ color: 'var(--accent)', marginTop: 12 }}>
          &larr; Back to Jobs
        </button>
      </div>
    );
  }

  const tech = getTech(job.assignedTo);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Back + Header */}
      <div>
        <button
          onClick={() => navigate('jobs')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-dim)', fontSize: 13, marginBottom: 12 }}
        >
          <ArrowLeft size={14} /> Back to Jobs
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <h1 style={{ fontFamily: 'var(--head)', fontSize: 28, fontWeight: 700 }}>{job.client}</h1>
          <span className={`badge badge-${job.status}`}>{job.status}</span>
          <span className={`badge badge-${job.priority === 'high' ? 'failed' : 'pending'}`}>{job.priority} priority</span>
        </div>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-dim)', marginTop: 4, display: 'block' }}>
          {job.id}
        </span>
      </div>

      {/* Info Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 16,
      }}>
        {/* Job Info Card */}
        <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 6, padding: 20 }}>
          <h3 style={{ fontFamily: 'var(--head)', fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--text-dim)' }}>
            JOB DETAILS
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <InfoRow icon={MapPin} label="Address" value={job.address} />
            <InfoRow icon={Building} label="Structure" value={job.structure} />
            <InfoRow icon={Calendar} label="Scheduled" value={job.scheduledDate} />
            <InfoRow icon={Shield} label="NFPA Class" value={`Class ${job.nfpaClass}`} />
            <InfoRow icon={FileText} label="Type" value={job.type} />
          </div>
        </div>

        {/* Technician Card */}
        <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 6, padding: 20 }}>
          <h3 style={{ fontFamily: 'var(--head)', fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--text-dim)' }}>
            ASSIGNED TECHNICIAN
          </h3>
          {tech ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 4,
                  background: 'var(--accent-dim)', color: 'var(--accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 500,
                }}>
                  {tech.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div style={{ fontWeight: 500 }}>{tech.name}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-dim)' }}>{tech.license}</div>
                </div>
              </div>
              <InfoRow icon={User} label="Status" value={tech.status} />
              <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-dim)' }}>{tech.phone}</div>
            </div>
          ) : (
            <p style={{ color: 'var(--text-dim)' }}>Unassigned</p>
          )}
        </div>
      </div>

      {/* Progress */}
      <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 6, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h3 style={{ fontFamily: 'var(--head)', fontSize: 14, fontWeight: 600, color: 'var(--text-dim)' }}>PROGRESS</h3>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 14, color: 'var(--accent)' }}>{job.progress}%</span>
        </div>
        <div style={{ height: 6, borderRadius: 3, background: 'var(--bg-4)', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${job.progress}%`,
            background: job.status === 'failed' ? 'var(--red)' : job.progress === 100 ? 'var(--green)' : 'var(--accent)',
            borderRadius: 3,
            transition: 'width 0.3s',
          }} />
        </div>
      </div>

      {/* Forms */}
      <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 6, padding: 20 }}>
        <h3 style={{ fontFamily: 'var(--head)', fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--text-dim)' }}>
          FORMS
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {ALL_FORMS.map(formId => {
            const completed = job.forms.includes(formId);
            const template = FORM_TEMPLATES[formId];
            return (
              <button
                key={formId}
                onClick={() => {
                  if (!completed) navigate('form-runner', { job, form: formId });
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  background: completed ? 'var(--green-dim)' : 'var(--bg-3)',
                  border: `1px solid ${completed ? 'rgba(29,185,84,0.2)' : 'var(--border)'}`,
                  borderRadius: 4,
                  width: '100%',
                  textAlign: 'left',
                  cursor: completed ? 'default' : 'pointer',
                  transition: 'border-color 0.15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {completed
                    ? <CheckCircle size={16} style={{ color: 'var(--green)' }} />
                    : <Circle size={16} style={{ color: 'var(--text-dim)' }} />
                  }
                  <span style={{ fontWeight: 500 }}>{template?.label ?? formId}</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-dim)' }}>
                    {template?.nfpaRef}
                  </span>
                </div>
                {completed
                  ? <span className="badge badge-completed">Done</span>
                  : <ChevronRight size={14} style={{ color: 'var(--accent)' }} />
                }
              </button>
            );
          })}
        </div>
      </div>

      {/* Notes */}
      {job.notes && (
        <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 6, padding: 20 }}>
          <h3 style={{ fontFamily: 'var(--head)', fontSize: 14, fontWeight: 600, marginBottom: 10, color: 'var(--text-dim)' }}>
            NOTES
          </h3>
          <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text)' }}>{job.notes}</p>
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
      <Icon size={14} style={{ color: 'var(--text-dim)', marginTop: 2, flexShrink: 0 }} />
      <div>
        <div className="label" style={{ marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 13 }}>{value}</div>
      </div>
    </div>
  );
}
