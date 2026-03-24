import { useState } from 'react';
import { ArrowLeft, CheckCircle, Info } from 'lucide-react';
import { FORM_TEMPLATES } from '../data/mockData.js';

export default function FormRunner({ job, formId, navigate }) {
  const template = FORM_TEMPLATES[formId];
  const [values, setValues] = useState({});
  const [submitted, setSubmitted] = useState(false);

  if (!template || !job) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-dim)' }}>
        <p>Form not found.</p>
        <button onClick={() => navigate('jobs')} style={{ color: 'var(--accent)', marginTop: 12 }}>
          &larr; Back to Jobs
        </button>
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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '80px 20px', textAlign: 'center' }}>
        <CheckCircle size={48} style={{ color: 'var(--green)' }} />
        <h2 style={{ fontFamily: 'var(--head)', fontSize: 24, fontWeight: 700 }}>Form Submitted</h2>
        <p style={{ color: 'var(--text-dim)', maxWidth: 400 }}>
          {template.label} for <strong>{job.client}</strong> has been saved locally.
        </p>
        <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
          <button
            onClick={() => navigate('job-detail', { job })}
            style={{
              padding: '10px 20px',
              background: 'var(--accent)',
              color: 'var(--bg)',
              fontWeight: 600,
              borderRadius: 4,
              fontSize: 13,
            }}
          >
            Back to Job
          </button>
          <button
            onClick={() => { setSubmitted(false); setValues({}); }}
            style={{
              padding: '10px 20px',
              background: 'var(--bg-3)',
              border: '1px solid var(--border)',
              borderRadius: 4,
              fontSize: 13,
            }}
          >
            Fill Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 720 }}>
      {/* Header */}
      <div>
        <button
          onClick={() => navigate('job-detail', { job })}
          style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-dim)', fontSize: 13, marginBottom: 12 }}
        >
          <ArrowLeft size={14} /> Back to Job
        </button>
        <h1 style={{ fontFamily: 'var(--head)', fontSize: 28, fontWeight: 700 }}>{template.label}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-dim)' }}>{template.nfpaRef}</span>
          <span style={{ color: 'var(--border-bright)' }}>|</span>
          <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>{job.client}</span>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {template.sections.map(section => (
          <div key={section.id} style={{
            background: 'var(--bg-2)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            padding: 20,
          }}>
            <h3 style={{ fontFamily: 'var(--head)', fontSize: 16, fontWeight: 600, marginBottom: 18 }}>
              {section.title}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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

        <button
          type="submit"
          style={{
            padding: '14px 28px',
            background: 'var(--accent)',
            color: 'var(--bg)',
            fontFamily: 'var(--head)',
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: '0.04em',
            borderRadius: 4,
            alignSelf: 'flex-start',
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          SUBMIT FORM
        </button>
      </form>
    </div>
  );
}

function FieldRenderer({ field, value, onChange }) {
  const labelEl = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
      <label className="label" style={{ fontSize: 11 }}>
        {field.label}
        {field.required && <span style={{ color: 'var(--red)', marginLeft: 2 }}>*</span>}
      </label>
      {field.nfpa && (
        <span style={{
          fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--blue)',
          background: 'var(--blue-dim)', padding: '1px 5px', borderRadius: 2,
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
            style={{ width: '100%' }}
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
            style={{ width: '100%' }}
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
          <button
            type="button"
            onClick={() => onChange(value === true ? false : true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 14px',
              background: value === true ? 'var(--green-dim)' : 'var(--bg-3)',
              border: `1px solid ${value === true ? 'rgba(29,185,84,0.3)' : 'var(--border)'}`,
              borderRadius: 4,
              fontSize: 13,
              color: value === true ? 'var(--green)' : 'var(--text-dim)',
              transition: 'all 0.15s',
            }}
          >
            <div style={{
              width: 18, height: 18, borderRadius: 3,
              border: `2px solid ${value === true ? 'var(--green)' : 'var(--border-bright)'}`,
              background: value === true ? 'var(--green)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}>
              {value === true && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>✓</span>}
            </div>
            {value === true ? 'Yes' : value === false ? 'No' : 'Not Set'}
          </button>
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
            style={{ width: '100%', resize: 'vertical' }}
          />
        </div>
      );

    default:
      return null;
  }
}
