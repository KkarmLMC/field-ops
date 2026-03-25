import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle } from '@phosphor-icons/react';
import { JOBS, FORM_TEMPLATES } from '../data/mockData.js';

export default function FormRunner() {
  const { jobId, formId } = useParams()
  const navigate = useNavigate()
  const job = JOBS.find(j => j.id === jobId)
  const template = FORM_TEMPLATES[formId]
  const [values, setValues] = useState({});
  const [submitted, setSubmitted] = useState(false);

  if (!template || !job) {
    return (
      <div className="page-content fade-in">
        <div className="empty">
          <div className="empty-icon">📝</div>
          <div className="empty-title">Form not found</div>
          <div className="empty-desc">The requested form could not be loaded.</div>
          <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => navigate('/jobs')}>
            Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  const setValue = (fieldId, val) => {
    setValues(prev => ({ ...prev, [fieldId]: val }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="page-content fade-in">
        <div className="empty" style={{ padding: '60px 24px' }}>
          <CheckCircle size={48} style={{ color: 'var(--green)' }} />
          <div className="empty-title" style={{ fontSize: 20 }}>Form Submitted</div>
          <div className="empty-desc" style={{ maxWidth: 300 }}>
            {template.label} for {job.client} has been saved locally.
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button className="btn btn-primary" onClick={() => navigate(`/jobs/${job.id}`)}>
              Back to Job
            </button>
            <button className="btn btn-secondary" onClick={() => { setSubmitted(false); setValues({}); }}>
              Fill Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content fade-in">
      {/* Header info */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)' }}>{template.nfpaRef}</span>
          <span style={{ color: 'var(--border)' }}>|</span>
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{job.client}</span>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        {template.sections.map(section => (
          <div key={section.id} className="card" style={{ marginBottom: 12 }}>
            <div className="section-header">{section.title}</div>
            <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {section.fields.map(field => (
                <FieldRenderer
                  key={field.id}
                  field={field}
                  value={values[field.id] ?? ''}
                  onChange={val => setValue(field.id, val)}
                />
              ))}
            </div>
          </div>
        ))}

        <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: 8 }}>
          Submit {template.label}
        </button>
      </form>
    </div>
  );
}

function FieldRenderer({ field, value, onChange }) {
  const labelEl = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>
        {field.label}
        {field.required && <span style={{ color: 'var(--red)', marginLeft: 2 }}>*</span>}
      </label>
      {field.nfpa && (
        <span style={{
          fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--blue)',
          background: 'var(--blue-soft)', padding: '1px 5px', borderRadius: 2,
        }}>
          {field.nfpa}
        </span>
      )}
    </div>
  );

  switch (field.type) {
    case 'text':
    case 'number':
      return (
        <div>
          {labelEl}
          <input
            type={field.type}
            value={value}
            onChange={e => onChange(e.target.value)}
            required={field.required}
            className="form-input"
          />
        </div>
      );

    case 'select':
      return (
        <div>
          {labelEl}
          <select
            value={value}
            onChange={e => onChange(e.target.value)}
            required={field.required}
            className="form-select"
          >
            <option value="">— Select —</option>
            {(field.options || []).map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      );

    case 'boolean':
      return (
        <div>
          {labelEl}
          <div
            onClick={() => onChange(value === true ? false : true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px',
              background: value === true ? 'var(--green-s)' : 'var(--bg)',
              border: `1px solid ${value === true ? 'var(--green)' : 'var(--border)'}`,
              borderRadius: 6, cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            <div style={{
              width: 20, height: 20, borderRadius: 4,
              border: `2px solid ${value === true ? 'var(--green)' : 'var(--border)'}`,
              background: value === true ? 'var(--green)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {value === true && <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>✓</span>}
            </div>
            <span style={{ fontSize: 13, color: value === true ? 'var(--green)' : 'var(--text-3)' }}>
              {value === true ? 'Yes' : value === false ? 'No' : 'Not Set'}
            </span>
          </div>
        </div>
      );

    case 'textarea':
      return (
        <div>
          {labelEl}
          <textarea
            value={value}
            onChange={e => onChange(e.target.value)}
            required={field.required}
            rows={3}
            className="form-textarea"
          />
        </div>
      );

    default:
      return null;
  }
}
