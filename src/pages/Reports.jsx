import { useState } from 'react';
import { Award, X } from 'lucide-react';
import { JOBS, TECHNICIANS } from '../data/mockData.js';

function getTech(id) {
  return TECHNICIANS.find(t => t.id === id);
}

export default function Reports({ navigate }) {
  const completedJobs = JOBS.filter(j => j.status === 'completed' || j.status === 'failed');
  const [certPreview, setCertPreview] = useState(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ fontFamily: 'var(--head)', fontSize: 28, fontWeight: 700, letterSpacing: '0.02em' }}>Reports</h1>
        <p style={{ color: 'var(--text-dim)', marginTop: 4 }}>{completedJobs.length} completed / closed jobs</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {completedJobs.map(job => {
          const tech = getTech(job.assignedTo);
          return (
            <div
              key={job.id}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'var(--bg-2)', border: '1px solid var(--border)',
                borderRadius: 4, padding: '14px 16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-dim)', flexShrink: 0 }}>{job.id}</span>
                <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.client}</span>
                <span className={`badge badge-${job.status}`}>{job.status}</span>
              </div>
              <button
                onClick={() => setCertPreview(job)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px',
                  background: job.status === 'completed' ? 'var(--accent-glow)' : 'var(--bg-3)',
                  border: '1px solid ' + (job.status === 'completed' ? 'var(--accent-dim)' : 'var(--border)'),
                  borderRadius: 4, fontSize: 12, fontWeight: 500,
                  color: job.status === 'completed' ? 'var(--accent)' : 'var(--text-dim)',
                  flexShrink: 0,
                }}
              >
                <Award size={13} />
                {job.status === 'completed' ? 'View Certificate' : 'View Report'}
              </button>
            </div>
          );
        })}
        {completedJobs.length === 0 && (
          <p style={{ color: 'var(--text-dim)', fontStyle: 'italic', textAlign: 'center', padding: 40 }}>
            No completed or closed jobs yet.
          </p>
        )}
      </div>

      {certPreview && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, padding: 20 }}
          onClick={() => setCertPreview(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: 'var(--bg-2)', border: '1px solid var(--border-bright)', borderRadius: 8, padding: 32, maxWidth: 520, width: '100%', position: 'relative' }}
          >
            <button onClick={() => setCertPreview(null)} style={{ position: 'absolute', top: 12, right: 12, color: 'var(--text-dim)' }}>
              <X size={18} />
            </button>
            <CertificatePreview job={certPreview} />
          </div>
        </div>
      )}
    </div>
  );
}

function CertificatePreview({ job }) {
  const tech = getTech(job.assignedTo);
  const passed = job.status === 'completed';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ textAlign: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
        <div style={{ fontFamily: 'var(--head)', fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', letterSpacing: '0.2em', marginBottom: 4 }}>
          BOLT LIGHTNING PROTECTION
        </div>
        <h2 style={{ fontFamily: 'var(--head)', fontSize: 22, fontWeight: 700 }}>
          {passed ? 'Certificate of Compliance' : 'Inspection Report'}
        </h2>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-dim)' }}>
          {passed ? 'Certificate #BOLT-' + job.id.replace('JOB-', '') : 'Report #RPT-' + job.id.replace('JOB-', '')}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13 }}>
        <CertRow label="Job ID" value={job.id} />
        <CertRow label="Client" value={job.client} />
        <CertRow label="Address" value={job.address} />
        <CertRow label="Structure" value={job.structure} />
        <CertRow label="NFPA Class" value={'Class ' + job.nfpaClass} />
        <CertRow label="Date" value={job.scheduledDate} />
        {tech && (
          <>
            <CertRow label="Technician" value={tech.name} />
            <CertRow label="License" value={tech.license} />
          </>
        )}
      </div>
      <div style={{
        textAlign: 'center', padding: '16px 20px',
        background: passed ? 'var(--green-dim)' : 'var(--red-dim)',
        border: '1px solid ' + (passed ? 'rgba(29,185,84,0.2)' : 'rgba(224,48,48,0.2)'),
        borderRadius: 6,
      }}>
        <div style={{ fontFamily: 'var(--head)', fontSize: 20, fontWeight: 700, color: passed ? 'var(--green)' : 'var(--red)' }}>
          {passed ? 'PASSED' : 'FAILED'}
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>NFPA 780 / LPI-175</div>
      </div>
      {job.notes && (
        <div style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.5 }}>
          <strong>Notes:</strong> {job.notes}
        </div>
      )}
    </div>
  );
}

function CertRow({ label, value }) {
  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <span className="label" style={{ width: 90, flexShrink: 0, paddingTop: 2 }}>{label}</span>
      <span>{value}</span>
    </div>
  );
}
