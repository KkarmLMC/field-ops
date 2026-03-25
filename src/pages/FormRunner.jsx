import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle } from '@phosphor-icons/react';
import { PROJECTS, FORM_TEMPLATES } from '../data/mockData.js';

export default function FormRunner() {
  const { jobId, formId } = useParams()
  const navigate = useNavigate()
  const job = PROJECTS.find(p => p.id === jobId)
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
          <div className="empty-title" style={{ fontSize: "var(--fs-xl)" }}>Form Submitted</div>
          <div className="empty-desc" style={{ maxWidth: 300 }}>
            {template.label} for {job.name} has been saved locally.
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
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{job.name}</span>
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

    case 'date':
      return (
        <div>
          {labelEl}
          <input
            type="date"
            value={value}
            onChange={e => onChange(e.target.value)}
            required={field.required}
            className="form-input"
          />
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
              {value === true && <span style={{ color: '#fff', fontSize: 'var(--fs-xs)', fontWeight: 700 }}>✓</span>}
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

    // ── Pass / Fail / Comments ─────────────────────────────────────────────
    case 'pass-fail': {
      const pf = value && typeof value === 'object' ? value : { result: null, comments: '' }
      const setResult = (r) => onChange({ ...pf, result: pf.result === r ? null : r })
      const setComments = (c) => onChange({ ...pf, comments: c })
      return (
        <div className="fr-pf-row">
          <span className="fr-pf-label">
            {field.label}
            {field.required && <span style={{ color: 'var(--red)', marginLeft: 2 }}>*</span>}
          </span>
          <div className="fr-pf-buttons">
            <button
              type="button"
              className={`fr-pf-btn fr-pf-pass ${pf.result === 'pass' ? 'active' : ''}`}
              onClick={() => setResult('pass')}
            >
              Pass
            </button>
            <button
              type="button"
              className={`fr-pf-btn fr-pf-fail ${pf.result === 'fail' ? 'active' : ''}`}
              onClick={() => setResult('fail')}
            >
              Fail
            </button>
          </div>
          <input
            className="fr-pf-comments"
            placeholder="Comments"
            value={pf.comments}
            onChange={e => setComments(e.target.value)}
          />
        </div>
      )
    }

    // ── OK / Not OK / N/A / Explanation ───────────────────────────────────
    case 'ok-notok-na': {
      const okv = value && typeof value === 'object' ? value : { result: null, explanation: '' }
      const setResult = (r) => onChange({ ...okv, result: okv.result === r ? null : r })
      const setExpl = (e) => onChange({ ...okv, explanation: e })
      return (
        <div className="fr-ok-row">
          <span className="fr-ok-label">
            {field.label}
            {field.required && <span style={{ color: 'var(--red)', marginLeft: 2 }}>*</span>}
          </span>
          <div className="fr-ok-buttons">
            {[['ok','OK'],['notok','Not OK'],['na','N/A']].map(([k, lbl]) => (
              <button
                key={k}
                type="button"
                className={`fr-ok-btn fr-ok-${k} ${okv.result === k ? 'active' : ''}`}
                onClick={() => setResult(k)}
              >
                {lbl}
              </button>
            ))}
          </div>
          <input
            className="fr-ok-explanation"
            placeholder="Explanation"
            value={okv.explanation}
            onChange={e => setExpl(e.target.value)}
          />
        </div>
      )
    }

    // ── Checkbox group ─────────────────────────────────────────────────────
    case 'checkbox-group': {
      const selected = Array.isArray(value) ? value : []
      const toggle = (opt) => onChange(
        selected.includes(opt) ? selected.filter(x => x !== opt) : [...selected, opt]
      )
      return (
        <div>
          {labelEl}
          <div className="fr-cg-grid">
            {(field.options || []).map(opt => (
              <label key={opt} className={`fr-cg-item ${selected.includes(opt) ? 'checked' : ''}`}>
                <input
                  type="checkbox"
                  checked={selected.includes(opt)}
                  onChange={() => toggle(opt)}
                  style={{ display: 'none' }}
                />
                <span className="fr-cg-box">
                  {selected.includes(opt) && <span>✓</span>}
                </span>
                <span className="fr-cg-text">{opt}</span>
              </label>
            ))}
          </div>
        </div>
      )
    }

    // ── Activity / Hazards / Risk Controls / Responsibility row ───────────
    case 'activity-row': {
      const row = value && typeof value === 'object' ? value : { activity: '', hazards: '', controls: '', responsibility: '' }
      const setField = (k, v) => onChange({ ...row, [k]: v })
      const hasAny = row.activity || row.hazards || row.controls || row.responsibility
      return (
        <div className="fr-act-row">
          <input className="fr-act-cell" placeholder="Activity / Task" value={row.activity}     onChange={e => setField('activity',      e.target.value)} />
          <input className="fr-act-cell" placeholder="Hazards"         value={row.hazards}      onChange={e => setField('hazards',        e.target.value)} />
          <input className="fr-act-cell" placeholder="Risk Controls"   value={row.controls}     onChange={e => setField('controls',       e.target.value)} />
          <input className="fr-act-cell" placeholder="Responsibility"  value={row.responsibility} onChange={e => setField('responsibility', e.target.value)} />
        </div>
      )
    }

    // ── Personnel + Signature ──────────────────────────────────────────────
    case 'personnel-sig': {
      const p = value && typeof value === 'object' ? value : { name: '', function: '', signed: false }
      const setP = (k, v) => onChange({ ...p, [k]: v })
      if (!p.name && !p.function && !p.signed) {
        return (
          <div className="fr-person-empty">
            <input
              className="fr-person-name"
              placeholder="Name"
              value={p.name}
              onChange={e => setP('name', e.target.value)}
            />
            <input
              className="fr-person-fn"
              placeholder="Function / Role"
              value={p.function}
              onChange={e => setP('function', e.target.value)}
            />
          </div>
        )
      }
      return (
        <div className={`fr-person-row ${p.signed ? 'signed' : ''}`}>
          <div className="fr-person-fields">
            <input
              className="fr-person-name"
              placeholder="Name"
              value={p.name}
              onChange={e => setP('name', e.target.value)}
            />
            <input
              className="fr-person-fn"
              placeholder="Function / Role"
              value={p.function}
              onChange={e => setP('function', e.target.value)}
            />
          </div>
          <button
            type="button"
            className={`fr-person-sign ${p.signed ? 'signed' : ''}`}
            onClick={() => setP('signed', !p.signed)}
          >
            {p.signed ? '✓ Signed' : 'Sign'}
          </button>
        </div>
      )
    }

    default:
      return null;
  }
}
