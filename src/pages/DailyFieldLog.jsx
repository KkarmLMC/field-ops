import { useState, useRef } from 'react'
import {
  Clock, CheckCircle, FileText, Plus, MapPin,
  X, User, Truck, Pencil, Warning, ClipboardText,
  HardHat, CaretDown, ArrowRight, Signature,
  ArrowsClockwise, SealCheck, CaretLeft,
} from '@phosphor-icons/react'
import BranchTabs from '../components/BranchTabs'
import { MOCK_REPORTS, FORM_TEMPLATES } from '../data/mockData.js'
import { BRANCH_COLORS } from '../config/branches.js'

// ─── Config ────────────────────────────────────────────────────────────────────
const WORK_TYPES = ['Inspection', 'Installation', 'Remediation', 'Site Revisit', 'Other']

// Safety docs are digital forms linked from the form repository
const SAFETY_FORMS = [
  {
    key:    'jsa_uploaded',
    label:  'JSA — Job Safety Analysis',
    desc:   'Hazard identification, controls & emergency procedures',
    formId: 'site-survey',
  },
  {
    key:    'manlift_checklist',
    label:  'Man Lift Pre-Use Checklist',
    desc:   'Equipment inspection before operation — required per OSHA 1926.453',
    formId: 'inspection',
  },
  {
    key:    'fall_protection',
    label:  'Fall Protection Plan',
    desc:   'PPE verification, anchor points & rescue procedures',
    formId: 'inspection',
  },
]

const STATUS_STYLE = {
  Draft:     { bg: '#FEF9C3', color: '#92400E' },
  Submitted: { bg: '#EFF6FF', color: '#1D4ED8' },
  Reviewed:  { bg: '#F0FDF4', color: '#16A34A' },
}

const EMPTY_P1 = {
  customer_site:     '',
  report_date:       new Date().toISOString().slice(0, 10),
  gps_location:      '',
  supervisor_name:   '',
  crew_on_site:      [],
  crew_input:        '',
  jsa_uploaded:      false,
  manlift_checklist: false,
  fall_protection:   false,
}

const EMPTY_P2 = {
  hours_worked: '',
  work_types:   [],
  work_other:   '',
  miles_driven: '',
  drive_time:   '',
  other_tasks:  '',
  signed:       false,
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(d) {
  if (!d) return ''
  const [y, m, day] = d.split('-')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${months[parseInt(m,10)-1]} ${parseInt(day,10)}, ${y}`
}

function SafetyDot({ ok, label }) {
  return (
    <span
      className="dfl-safety-dot"
      style={{ background: ok ? '#22C55E' : '#E5E7EB', color: ok ? '#fff' : '#9CA3AF' }}
      title={label}
    >
      {ok
        ? <CheckCircle size={9} weight="fill" />
        : <Warning size={9} weight="fill" />
      }
    </span>
  )
}

// ─── Entry Card ────────────────────────────────────────────────────────────────
function EntryCard({ entry, bc, onCloseOut }) {
  const [expanded, setExpanded] = useState(false)
  const ss = STATUS_STYLE[entry.status] || STATUS_STYLE.Draft
  const isDraft = entry.status === 'Draft'

  const safetyAllDone = entry.jsa_uploaded && entry.manlift_checklist && entry.fall_protection

  return (
    <div className={`dfl-card ${isDraft ? 'dfl-card--draft' : ''}`}>

      {/* Draft: Part progress bar */}
      {isDraft && (
        <div className="dfl-entry-parts">
          <span className="dfl-part-pill dfl-part-pill--done">
            <CheckCircle size={10} weight="fill" />
            Morning Check-In Complete
          </span>
          <span className="dfl-part-sep">→</span>
          <span className="dfl-part-pill dfl-part-pill--pending">
            <Clock size={10} />
            Close-Out Pending
          </span>
        </div>
      )}

      {/* Card header — always visible */}
      <div
        className="dfl-card-head"
        onClick={() => !isDraft && setExpanded(e => !e)}
        style={{ cursor: isDraft ? 'default' : 'pointer' }}
      >
        <div className="dfl-card-head-left">
          <div
            className="dfl-card-icon"
            style={{
              background: isDraft ? '#FEF9C3' : bc.bgInactive,
              color:      isDraft ? '#92400E' : bc.bgActive,
            }}
          >
            {isDraft ? <Clock size={15} weight="bold" /> : <FileText size={15} weight="bold" />}
          </div>
          <div>
            <div className="dfl-card-title">{entry.customer_site}</div>
            <div className="dfl-card-sub">
              {fmtDate(entry.report_date)}
              <span className="dfl-dot">·</span>
              {entry.supervisor_name || entry.submitted_by}
            </div>
          </div>
        </div>
        <div className="dfl-card-head-right">
          {!isDraft && entry.hours_worked && (
            <div className="dfl-card-hours">{entry.hours_worked}h</div>
          )}
          <span className="dfl-status-pill" style={{ background: ss.bg, color: ss.color }}>
            {entry.status}
          </span>
          {!isDraft && (
            <CaretDown
              size={14}
              style={{
                color: 'var(--text-3)',
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.18s',
                flexShrink: 0,
              }}
            />
          )}
        </div>
      </div>

      {/* Chips row */}
      <div className="dfl-card-chips">
        {!isDraft && (entry.work_types || []).map(t => (
          <span key={t} className="dfl-work-chip">{t}</span>
        ))}
        {/* Safety indicators */}
        <div className="dfl-safety-row" style={{ marginLeft: isDraft ? 0 : 'auto' }}>
          <SafetyDot ok={entry.jsa_uploaded}     label="JSA" />
          <SafetyDot ok={entry.manlift_checklist} label="Man Lift" />
          <SafetyDot ok={entry.fall_protection}   label="Fall Protection" />
          <span className="dfl-safety-label">Safety</span>
        </div>
        {isDraft && (
          <span
            className="dfl-crew-preview"
            style={{ marginLeft: 'auto' }}
          >
            <User size={10} />
            {(entry.crew_on_site || []).length + (entry.supervisor_name ? 1 : 0)} on site
          </span>
        )}
      </div>

      {/* Draft: Close-Out CTA */}
      {isDraft && (
        <div className="dfl-closeout-row">
          <div className="dfl-closeout-hint">
            <Warning size={11} weight="fill" style={{ color: '#F59E0B', flexShrink: 0 }} />
            Complete end-of-day close-out to submit this log
          </div>
          <button
            className="dfl-closeout-btn"
            style={{ background: bc.bgActive }}
            onClick={() => onCloseOut(entry.id)}
          >
            Close Out Day
            <ArrowRight size={13} />
          </button>
        </div>
      )}

      {/* Submitted/Reviewed: Expanded detail */}
      {!isDraft && expanded && (
        <div className="dfl-card-detail">
          <div className="dfl-detail-grid">

            <div className="dfl-detail-item">
              <span className="dfl-detail-label"><User size={11} /> Crew on Site</span>
              <span className="dfl-detail-value">
                {entry.supervisor_name
                  ? [entry.supervisor_name, ...(entry.crew_on_site || [])].join(', ')
                  : (entry.crew_on_site || []).join(', ') || '—'
                }
              </span>
            </div>

            <div className="dfl-detail-item">
              <span className="dfl-detail-label"><MapPin size={11} /> Site Location</span>
              <span className="dfl-detail-value dfl-gps">{entry.gps_location || '—'}</span>
            </div>

            <div className="dfl-detail-item">
              <span className="dfl-detail-label"><Truck size={11} /> Travel</span>
              <span className="dfl-detail-value">
                {entry.miles_driven ? `${entry.miles_driven} mi` : '—'}
                {entry.drive_time ? ` · ${entry.drive_time}` : ''}
              </span>
            </div>

            <div className="dfl-detail-item">
              <span className="dfl-detail-label"><HardHat size={11} /> Safety Docs</span>
              <div className="dfl-safety-badges">
                <span className={`dfl-safety-badge ${entry.jsa_uploaded      ? 'ok' : 'missing'}`}>
                  {entry.jsa_uploaded      ? '✓' : '✗'} JSA
                </span>
                <span className={`dfl-safety-badge ${entry.manlift_checklist ? 'ok' : 'missing'}`}>
                  {entry.manlift_checklist ? '✓' : '✗'} Man Lift
                </span>
                <span className={`dfl-safety-badge ${entry.fall_protection   ? 'ok' : 'missing'}`}>
                  {entry.fall_protection   ? '✓' : '✗'} Fall Protection
                </span>
              </div>
            </div>

            {entry.other_tasks && (
              <div className="dfl-detail-item dfl-detail-full">
                <span className="dfl-detail-label"><ClipboardText size={11} /> Notes</span>
                <span className="dfl-detail-value">{entry.other_tasks}</span>
              </div>
            )}

          </div>

          <div className="dfl-signoff-row">
            {entry.signed ? (
              <div className="dfl-signed-badge">
                <CheckCircle size={12} weight="fill" />
                Signed off — {entry.supervisor_name}
              </div>
            ) : (
              <div className="dfl-unsigned-badge">
                <Warning size={12} weight="fill" />
                Awaiting supervisor sign-off
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Inline field renderer for safety forms ────────────────────────────────────
function SafetyFieldRenderer({ field, value, onChange }) {
  switch (field.type) {
    case 'text':
    case 'number':
    case 'date':
      return (
        <div className="dfl-field">
          <label className="dfl-label">
            {field.label}
            {field.required && <span className="dfl-req">*</span>}
          </label>
          <input
            type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
            className="dfl-input"
            value={value ?? ''}
            onChange={e => onChange(e.target.value)}
          />
        </div>
      )

    case 'textarea':
      return (
        <div className="dfl-field">
          <label className="dfl-label">{field.label}</label>
          <textarea
            className="dfl-input dfl-textarea"
            value={value ?? ''}
            onChange={e => onChange(e.target.value)}
          />
        </div>
      )

    case 'pass-fail': {
      const pf = value && typeof value === 'object' ? value : { result: null, comments: '' }
      return (
        <div className="fr-pf-row">
          <span className="fr-pf-label">
            {field.label}
            {field.required && <span style={{ color: '#EF4444', marginLeft: 2 }}>*</span>}
          </span>
          <div className="fr-pf-buttons">
            <button type="button" className={`fr-pf-btn fr-pf-pass ${pf.result === 'pass' ? 'active' : ''}`} onClick={() => onChange({ ...pf, result: pf.result === 'pass' ? null : 'pass' })}>Pass</button>
            <button type="button" className={`fr-pf-btn fr-pf-fail ${pf.result === 'fail' ? 'active' : ''}`} onClick={() => onChange({ ...pf, result: pf.result === 'fail' ? null : 'fail' })}>Fail</button>
          </div>
          <input className="fr-pf-comments" placeholder="Comments" value={pf.comments} onChange={e => onChange({ ...pf, comments: e.target.value })} />
        </div>
      )
    }

    case 'ok-notok-na': {
      const okv = value && typeof value === 'object' ? value : { result: null, explanation: '' }
      return (
        <div className="fr-ok-row">
          <span className="fr-ok-label">
            {field.label}
            {field.required && <span style={{ color: '#EF4444', marginLeft: 2 }}>*</span>}
          </span>
          <div className="fr-ok-buttons">
            {[['ok','OK'],['notok','Not OK'],['na','N/A']].map(([k, lbl]) => (
              <button key={k} type="button" className={`fr-ok-btn fr-ok-${k} ${okv.result === k ? 'active' : ''}`} onClick={() => onChange({ ...okv, result: okv.result === k ? null : k })}>{lbl}</button>
            ))}
          </div>
          <input className="fr-ok-explanation" placeholder="Explanation" value={okv.explanation} onChange={e => onChange({ ...okv, explanation: e.target.value })} />
        </div>
      )
    }

    case 'checkbox-group': {
      const selected = Array.isArray(value) ? value : []
      const toggle = (opt) => onChange(selected.includes(opt) ? selected.filter(x => x !== opt) : [...selected, opt])
      return (
        <div className="dfl-field">
          <label className="dfl-label">
            {field.label}
            {field.required && <span className="dfl-req">*</span>}
          </label>
          <div className="fr-cg-grid">
            {(field.options || []).map(opt => (
              <label key={opt} className={`fr-cg-item ${selected.includes(opt) ? 'checked' : ''}`} onClick={() => toggle(opt)}>
                <span className="fr-cg-box">{selected.includes(opt) && <span>✓</span>}</span>
                <span className="fr-cg-text">{opt}</span>
              </label>
            ))}
          </div>
        </div>
      )
    }

    case 'activity-row': {
      const row = value && typeof value === 'object' ? value : { activity: '', hazards: '', controls: '', responsibility: '' }
      const setF = (k, v) => onChange({ ...row, [k]: v })
      return (
        <div className="fr-act-row">
          <input className="fr-act-cell" placeholder="Activity / Task" value={row.activity}      onChange={e => setF('activity',      e.target.value)} />
          <input className="fr-act-cell" placeholder="Hazards"         value={row.hazards}       onChange={e => setF('hazards',        e.target.value)} />
          <input className="fr-act-cell" placeholder="Risk Controls"   value={row.controls}      onChange={e => setF('controls',       e.target.value)} />
          <input className="fr-act-cell" placeholder="Responsibility"  value={row.responsibility} onChange={e => setF('responsibility', e.target.value)} />
        </div>
      )
    }

    case 'personnel-sig': {
      const p = value && typeof value === 'object' ? value : { name: '', function: '', signed: false }
      const setP = (k, v) => onChange({ ...p, [k]: v })
      return (
        <div className={`fr-person-row ${p.signed ? 'signed' : ''}`}>
          <div className="fr-person-fields">
            <input className="fr-person-name" placeholder="Name"             value={p.name}     onChange={e => setP('name',     e.target.value)} />
            <input className="fr-person-fn"   placeholder="Function / Role"  value={p.function} onChange={e => setP('function', e.target.value)} />
          </div>
          <button type="button" className={`fr-person-sign ${p.signed ? 'signed' : ''}`} onClick={() => setP('signed', !p.signed)}>
            {p.signed ? '✓ Signed' : 'Sign'}
          </button>
        </div>
      )
    }

    default:
      return null
  }
}

// ─── Safety Form Modal — renders a form template inline ────────────────────────
function SafetyFormModal({ formKey, prefill, onComplete, onBack, bc }) {
  const FORM_KEY_MAP = {
    jsa_uploaded:      'jsa',
    manlift_checklist: 'manlift-checklist',
    fall_protection:   'fall-protection',
  }
  const template = FORM_TEMPLATES[FORM_KEY_MAP[formKey]]
  const [values, setValues]       = useState({})
  const [sectionIdx, setSectionIdx] = useState(0)

  if (!template) return null

  const setValue = (fieldId, val) => setValues(v => ({ ...v, [fieldId]: val }))

  const sections = template.sections
  const currentSection = sections[sectionIdx]
  const isLast = sectionIdx === sections.length - 1

  // Pre-fill inspector name / date / company from prefill context
  const getDisplayValue = (fieldId) => {
    if (values[fieldId] !== undefined) return values[fieldId]
    if (fieldId === 'inspector_name' && prefill?.supervisorName) return prefill.supervisorName
    if ((fieldId === 'inspection_date' || fieldId === 'jsa_date') && prefill?.date) return prefill.date
    if (fieldId === 'company_name') return 'Lightning Master'
    if (fieldId === 'site_name' && prefill?.customerSite) return prefill.customerSite
    return ''
  }

  return (
    <div className="dfl-form-overlay" onClick={onBack} style={{ zIndex: 250 }}>
      <div className="dfl-form-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: '36rem' }}>

        {/* Header */}
        <div className="dfl-form-header" style={{ background: '#1F2937' }}>
          <div>
            <div className="dfl-form-part-label">{template.nfpaRef}</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>{template.label}</div>
          </div>
          <button className="dfl-form-close" onClick={onBack}><X size={16} /></button>
        </div>

        {/* Section tabs — compact */}
        <div className="dfl-form-steps" style={{ fontSize: '0.625rem' }}>
          {sections.map((s, i) => (
            <button
              key={i}
              className={`dfl-form-step ${sectionIdx === i ? 'active' : ''} ${i < sectionIdx ? 'done' : ''}`}
              onClick={() => setSectionIdx(i)}
              style={{ fontSize: '0.625rem', padding: '0.5rem 0.625rem' }}
            >
              {i < sectionIdx ? <CheckCircle size={10} weight="fill" /> : null}
              <span>{s.title.split(' — ')[0].split(' — ')[0].substring(0, 14)}</span>
            </button>
          ))}
        </div>

        {/* Section body */}
        <div className="dfl-form-body">
          <div className="dfl-form-section">
            {currentSection.title.includes('—') || currentSection.title.includes('Check') ? (
              <p className="dfl-section-note">{currentSection.title}</p>
            ) : null}
            {currentSection.fields.map(field => (
              <SafetyFieldRenderer
                key={field.id}
                field={field}
                value={values[field.id] !== undefined ? values[field.id] : getDisplayValue(field.id)}
                onChange={val => setValue(field.id, val)}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="dfl-form-footer">
          <button
            className="dfl-btn-secondary"
            onClick={() => sectionIdx > 0 ? setSectionIdx(s => s - 1) : onBack()}
          >
            {sectionIdx === 0 ? 'Back to Safety' : 'Back'}
          </button>
          {!isLast ? (
            <button
              className="dfl-btn-primary"
              style={{ background: '#1F2937' }}
              onClick={() => setSectionIdx(s => s + 1)}
            >
              Next <ArrowRight size={13} />
            </button>
          ) : (
            <button
              className="dfl-btn-primary"
              style={{ background: '#16A34A' }}
              onClick={() => onComplete(formKey, values)}
            >
              <CheckCircle size={14} weight="fill" />
              Complete Form
            </button>
          )}
        </div>

      </div>
    </div>
  )
}

// ─── Part 1 Form — Morning Check-In ────────────────────────────────────────────
function Part1Form({ onClose, onSave, bc }) {
  const [form, setForm]               = useState({ ...EMPTY_P1 })
  const [step, setStep]               = useState(0)
  const [safetyOpen, setSafetyOpen]   = useState(null) // key of safety form being filled

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const addCrew = () => {
    const name = form.crew_input.trim()
    if (name && !form.crew_on_site.includes(name)) {
      set('crew_on_site', [...form.crew_on_site, name])
    }
    set('crew_input', '')
  }
  const removeCrew = (name) => set('crew_on_site', form.crew_on_site.filter(n => n !== name))

  const STEPS = [
    { label: 'Job Info', icon: <FileText size={12} /> },
    { label: 'Crew',     icon: <User size={12} /> },
    { label: 'Safety',   icon: <HardHat size={12} /> },
  ]

  const safetyCount = SAFETY_FORMS.filter(f => form[f.key]).length

  const canSave =
    form.customer_site.trim() &&
    form.supervisor_name.trim() &&
    safetyCount === SAFETY_FORMS.length

  return (
  <>
    <div className="dfl-form-overlay" onClick={onClose}>
      <div className="dfl-form-panel" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="dfl-form-header" style={{ background: bc.bgActive }}>
          <div>
            <div className="dfl-form-part-label">Part 1 of 2 · Before Work Begins</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>Morning Check-In</div>
          </div>
          <button className="dfl-form-close" onClick={onClose}><X size={16} /></button>
        </div>

        {/* Step tabs */}
        <div className="dfl-form-steps">
          {STEPS.map((s, i) => (
            <button
              key={i}
              className={`dfl-form-step ${step === i ? 'active' : ''} ${i < step ? 'done' : ''}`}
              onClick={() => setStep(i)}
            >
              {i < step ? <CheckCircle size={11} weight="fill" /> : s.icon}
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="dfl-form-body">

          {/* Step 0: Job Info */}
          {step === 0 && (
            <div className="dfl-form-section">
              <div className="dfl-field">
                <label className="dfl-label">Customer &amp; Site <span className="dfl-req">*</span></label>
                <input
                  className="dfl-input"
                  placeholder="e.g. Ritz-Carlton — Rooftop Level"
                  value={form.customer_site}
                  onChange={e => set('customer_site', e.target.value)}
                />
              </div>
              <div className="dfl-field">
                <label className="dfl-label">Date <span className="dfl-req">*</span></label>
                <input
                  className="dfl-input"
                  type="date"
                  value={form.report_date}
                  onChange={e => set('report_date', e.target.value)}
                />
              </div>
              <div className="dfl-field">
                <label className="dfl-label">
                  <MapPin size={12} style={{ marginRight: '0.25rem' }} />
                  Site GPS Location
                  <span className="dfl-gps-auto">Auto-detected</span>
                </label>
                <input
                  className="dfl-input dfl-input-mono"
                  placeholder="30.6423, -81.4467"
                  value={form.gps_location}
                  onChange={e => set('gps_location', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Step 1: Crew */}
          {step === 1 && (
            <div className="dfl-form-section">
              <div className="dfl-field">
                <label className="dfl-label">Supervisor / Lead Tech <span className="dfl-req">*</span></label>
                <input
                  className="dfl-input"
                  placeholder="Supervisor name"
                  value={form.supervisor_name}
                  onChange={e => set('supervisor_name', e.target.value)}
                />
              </div>
              <div className="dfl-field">
                <label className="dfl-label">Installers on Site</label>
                <div className="dfl-crew-tags">
                  {form.crew_on_site.map(n => (
                    <span key={n} className="dfl-crew-tag">
                      {n}
                      <button onClick={() => removeCrew(n)}><X size={10} /></button>
                    </span>
                  ))}
                </div>
                <div className="dfl-crew-input-row">
                  <input
                    className="dfl-input"
                    placeholder="Type name and press Add"
                    value={form.crew_input}
                    onChange={e => set('crew_input', e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCrew() } }}
                  />
                  <button className="dfl-add-btn" onClick={addCrew}>Add</button>
                </div>
                {form.crew_on_site.length > 0 && (
                  <div className="dfl-crew-count">
                    {form.crew_on_site.length} installer{form.crew_on_site.length !== 1 ? 's' : ''} added
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Safety Forms */}
          {step === 2 && (
            <div className="dfl-form-section">
              <div className="dfl-section-note">
                Complete all safety documentation below <strong>before work begins</strong>.
                Each form links to the digital template in the Forms Repository.
              </div>
              {SAFETY_FORMS.map(({ key, label, desc }) => (
                <div key={key} className={`dfl-safety-form-item ${form[key] ? 'completed' : ''}`}>
                  <div className="dfl-safety-form-icon">
                    {form[key]
                      ? <CheckCircle size={18} weight="fill" style={{ color: '#16A34A' }} />
                      : <HardHat size={18} weight="bold" style={{ color: '#6B7280' }} />
                    }
                  </div>
                  <div className="dfl-safety-form-info">
                    <div className="dfl-safety-form-label">{label} <span className="dfl-req">*</span></div>
                    <div className="dfl-safety-form-desc">{desc}</div>
                    {form[key] && (
                      <div className="dfl-safety-form-completed-label">
                        <CheckCircle size={10} weight="fill" /> Completed
                      </div>
                    )}
                  </div>
                  <button
                    className={`dfl-safety-form-btn ${form[key] ? 'completed' : ''}`}
                    onClick={() => setSafetyOpen(key)}
                  >
                    {form[key]
                      ? <><ArrowsClockwise size={12} /> Redo</>
                      : <>Fill Out Form <ArrowRight size={12} /></>
                    }
                  </button>
                </div>
              ))}
              {safetyCount < SAFETY_FORMS.length && (
                <div className="dfl-safety-warning">
                  <Warning size={13} weight="fill" />
                  {SAFETY_FORMS.length - safetyCount} of {SAFETY_FORMS.length} safety forms still required
                </div>
              )}
              {safetyCount === SAFETY_FORMS.length && (
                <div className="dfl-safety-all-done">
                  <CheckCircle size={13} weight="fill" />
                  All safety documentation complete — ready to start work
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="dfl-form-footer">
          <button
            className="dfl-btn-secondary"
            onClick={() => step > 0 ? setStep(s => s - 1) : onClose()}
          >
            {step === 0 ? 'Cancel' : 'Back'}
          </button>
          {step < STEPS.length - 1 ? (
            <button
              className="dfl-btn-primary"
              style={{ background: bc.bgActive }}
              onClick={() => setStep(s => s + 1)}
              disabled={step === 0 && !form.customer_site.trim()}
            >
              Next <ArrowRight size={13} />
            </button>
          ) : (
            <button
              className="dfl-btn-primary"
              style={{ background: canSave ? '#16A34A' : '#9CA3AF', cursor: canSave ? 'pointer' : 'not-allowed' }}
              onClick={() => canSave && onSave(form)}
              disabled={!canSave}
            >
              <CheckCircle size={14} weight="fill" />
              Save &amp; Start Work
            </button>
          )}
        </div>

      </div>
    </div>

    {/* Safety form modal — rendered on top of Part 1 */}
    {safetyOpen && (
      <SafetyFormModal
        formKey={safetyOpen}
        prefill={{
          supervisorName: form.supervisor_name,
          date:           form.report_date,
          customerSite:   form.customer_site,
        }}
        onComplete={(key) => {
          set(key, true)
          setSafetyOpen(null)
        }}
        onBack={() => setSafetyOpen(null)}
        bc={bc}
      />
    )}
  </>
  )
}

// ─── Part 2 Form — End-of-Day Close-Out ────────────────────────────────────────
function Part2Form({ entry, onClose, onSubmit, bc }) {
  const [form, setForm] = useState({ ...EMPTY_P2 })
  const [step, setStep] = useState(0)

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const toggleWorkType = (t) => {
    set('work_types', form.work_types.includes(t)
      ? form.work_types.filter(x => x !== t)
      : [...form.work_types, t]
    )
  }

  const STEPS = [
    { label: 'Work Summary', icon: <ClipboardText size={12} /> },
    { label: 'Travel',       icon: <Truck size={12} /> },
    { label: 'Sign Off',     icon: <Signature size={12} /> },
  ]

  const canSubmit = form.hours_worked && form.work_types.length > 0 && form.signed

  return (
    <div className="dfl-form-overlay" onClick={onClose}>
      <div className="dfl-form-panel" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="dfl-form-header dfl-form-header--p2" style={{ background: bc.bgActive }}>
          <div>
            <div className="dfl-form-part-label">Part 2 of 2 · End of Day</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>Close Out Day</div>
            {entry && (
              <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.65)', marginTop: '0.125rem' }}>
                {entry.customer_site} · {fmtDate(entry.report_date)}
              </div>
            )}
          </div>
          <button className="dfl-form-close" onClick={onClose}><X size={16} /></button>
        </div>

        {/* Step tabs */}
        <div className="dfl-form-steps">
          {STEPS.map((s, i) => (
            <button
              key={i}
              className={`dfl-form-step ${step === i ? 'active' : ''} ${i < step ? 'done' : ''}`}
              onClick={() => setStep(i)}
            >
              {i < step ? <CheckCircle size={11} weight="fill" /> : s.icon}
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="dfl-form-body">

          {/* Step 0: Work Summary */}
          {step === 0 && (
            <div className="dfl-form-section">
              <div className="dfl-field">
                <label className="dfl-label">Hours Worked Today <span className="dfl-req">*</span></label>
                <input
                  className="dfl-input"
                  type="number"
                  min="0"
                  max="24"
                  step="0.5"
                  placeholder="e.g. 8"
                  value={form.hours_worked}
                  onChange={e => set('hours_worked', e.target.value)}
                />
              </div>
              <div className="dfl-field">
                <label className="dfl-label">Type of Work Completed <span className="dfl-req">*</span></label>
                <div className="dfl-type-chips">
                  {WORK_TYPES.map(t => (
                    <button
                      key={t}
                      className={`dfl-type-chip ${form.work_types.includes(t) ? 'active' : ''}`}
                      onClick={() => toggleWorkType(t)}
                    >
                      {form.work_types.includes(t) && <CheckCircle size={11} weight="fill" />}
                      {t}
                    </button>
                  ))}
                </div>
                {form.work_types.includes('Other') && (
                  <input
                    className="dfl-input"
                    style={{ marginTop: '0.5rem' }}
                    placeholder="Describe other work..."
                    value={form.work_other}
                    onChange={e => set('work_other', e.target.value)}
                  />
                )}
              </div>
            </div>
          )}

          {/* Step 1: Travel */}
          {step === 1 && (
            <div className="dfl-form-section">
              <div className="dfl-field">
                <label className="dfl-label"><Truck size={12} style={{ marginRight: '0.25rem' }} />Miles Driven <span className="dfl-req">*</span></label>
                <input
                  className="dfl-input"
                  type="number"
                  min="0"
                  placeholder="e.g. 42"
                  value={form.miles_driven}
                  onChange={e => set('miles_driven', e.target.value)}
                />
              </div>
              <div className="dfl-field">
                <label className="dfl-label">Total Drive Time</label>
                <input
                  className="dfl-input"
                  placeholder="e.g. 1h 15min"
                  value={form.drive_time}
                  onChange={e => set('drive_time', e.target.value)}
                />
              </div>
              <div className="dfl-field">
                <label className="dfl-label">Other Tasks / Notes</label>
                <textarea
                  className="dfl-input dfl-textarea"
                  placeholder="Additional tasks completed, issues observed, follow-up needed..."
                  value={form.other_tasks}
                  onChange={e => set('other_tasks', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Step 2: Sign Off */}
          {step === 2 && (
            <div className="dfl-form-section">
              <div className="dfl-signoff-context">
                <div className="dfl-signoff-context-row">
                  <span className="dfl-detail-label"><FileText size={11} /> Site</span>
                  <span>{entry?.customer_site || '—'}</span>
                </div>
                <div className="dfl-signoff-context-row">
                  <span className="dfl-detail-label"><Clock size={11} /> Date</span>
                  <span>{fmtDate(entry?.report_date) || '—'}</span>
                </div>
                <div className="dfl-signoff-context-row">
                  <span className="dfl-detail-label"><User size={11} /> Supervisor</span>
                  <span>{entry?.supervisor_name || '—'}</span>
                </div>
              </div>
              <div className="dfl-field">
                <label className="dfl-label">
                  <Pencil size={12} style={{ marginRight: '0.25rem' }} />
                  Supervisor Signature <span className="dfl-req">*</span>
                </label>
                <SignaturePad
                  signed={form.signed}
                  onSign={() => set('signed', true)}
                  onClear={() => set('signed', false)}
                />
              </div>
              {!canSubmit && (
                <div className="dfl-safety-warning">
                  <Warning size={13} weight="fill" />
                  {!form.hours_worked ? 'Hours worked required · ' : ''}
                  {form.work_types.length === 0 ? 'Select at least one work type · ' : ''}
                  {!form.signed ? 'Supervisor signature required' : ''}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="dfl-form-footer">
          <button
            className="dfl-btn-secondary"
            onClick={() => step > 0 ? setStep(s => s - 1) : onClose()}
          >
            {step === 0 ? 'Cancel' : 'Back'}
          </button>
          {step < STEPS.length - 1 ? (
            <button
              className="dfl-btn-primary"
              style={{ background: bc.bgActive }}
              onClick={() => setStep(s => s + 1)}
            >
              Next <ArrowRight size={13} />
            </button>
          ) : (
            <button
              className="dfl-btn-primary"
              style={{ background: canSubmit ? bc.bgActive : '#9CA3AF', cursor: canSubmit ? 'pointer' : 'not-allowed' }}
              onClick={() => canSubmit && onSubmit(form)}
              disabled={!canSubmit}
            >
              <SealCheck size={14} weight="fill" />
              Complete &amp; Submit
            </button>
          )}
        </div>

      </div>
    </div>
  )
}

// ─── Signature Pad ─────────────────────────────────────────────────────────────
function SignaturePad({ signed, onSign, onClear }) {
  const canvasRef = useRef(null)
  const drawing   = useRef(false)

  const getPos = (e, canvas) => {
    const r = canvas.getBoundingClientRect()
    const src = e.touches ? e.touches[0] : e
    return { x: src.clientX - r.left, y: src.clientY - r.top }
  }

  const startDraw = (e) => {
    drawing.current = true
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const { x, y } = getPos(e, canvas)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e) => {
    if (!drawing.current) return
    e.preventDefault()
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#000'
    const { x, y } = getPos(e, canvas)
    ctx.lineTo(x, y)
    ctx.stroke()
    onSign()
  }

  const stopDraw = () => { drawing.current = false }

  const clear = () => {
    const canvas = canvasRef.current
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
    onClear()
  }

  return (
    <div className="dfl-sig-wrap">
      <canvas
        ref={canvasRef}
        className="dfl-sig-canvas"
        width={480}
        height={120}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={stopDraw}
        onMouseLeave={stopDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={stopDraw}
      />
      <div className="dfl-sig-actions">
        <span className="dfl-sig-hint">Sign above with mouse or finger</span>
        {signed && (
          <button className="dfl-sig-clear" onClick={clear}>Clear</button>
        )}
      </div>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function DailyFieldLog() {
  const [branch, setBranch]           = useState('lm')
  const [formMode, setFormMode]       = useState(null) // null | 'part1' | 'part2'
  const [closeoutId, setCloseoutId]   = useState(null)
  const [entries, setEntries]         = useState(MOCK_REPORTS)

  const bc = BRANCH_COLORS[branch] || BRANCH_COLORS.lm

  const lmCount         = entries.filter(r => r.branch === 'lm').length
  const boltCount       = entries.filter(r => r.branch === 'bolt').length
  const boltDallasCount = entries.filter(r => r.branch === 'bolt-dallas').length

  const reports = entries
    .filter(r => r.branch === branch)
    .sort((a, b) => b.report_date.localeCompare(a.report_date))

  const draftCount    = reports.filter(r => r.status === 'Draft').length
  const totalHours    = reports.filter(r => r.status !== 'Draft').reduce((s, r) => s + Number(r.hours_worked || 0), 0)
  const reviewedCount = reports.filter(r => r.status === 'Reviewed').length
  const unsignedCount = reports.filter(r => r.status === 'Submitted' && !r.signed).length

  // Part 1 save → creates a Draft entry
  const handlePart1Save = (form) => {
    const newEntry = {
      id:                `r-${Date.now()}`,
      branch,
      status:            'Draft',
      customer_site:     form.customer_site,
      report_date:       form.report_date,
      gps_location:      form.gps_location,
      supervisor_name:   form.supervisor_name,
      crew_on_site:      form.crew_on_site,
      jsa_uploaded:      form.jsa_uploaded,
      manlift_checklist: form.manlift_checklist,
      fall_protection:   form.fall_protection,
      submitted_by:      form.supervisor_name,
      // Part 2 fields — empty until close-out
      hours_worked:      '',
      work_types:        [],
      miles_driven:      '',
      drive_time:        '',
      other_tasks:       '',
      signed:            false,
    }
    setEntries(e => [newEntry, ...e])
    setFormMode(null)
  }

  // Part 2 submit → updates Draft → Submitted
  const handlePart2Submit = (form) => {
    setEntries(e => e.map(r =>
      r.id === closeoutId
        ? {
            ...r,
            status:       'Submitted',
            hours_worked: form.hours_worked,
            work_types:   form.work_types,
            work_other:   form.work_other,
            miles_driven: form.miles_driven,
            drive_time:   form.drive_time,
            other_tasks:  form.other_tasks,
            signed:       form.signed,
          }
        : r
    ))
    setFormMode(null)
    setCloseoutId(null)
  }

  const openCloseOut = (id) => {
    setCloseoutId(id)
    setFormMode('part2')
  }

  const closeoutEntry = entries.find(r => r.id === closeoutId)

  return (
    <div className="page-content fade-in">

      <BranchTabs
        active={branch}
        onChange={setBranch}
        lmCount={lmCount}
        boltCount={boltCount}
        boltDallasCount={boltDallasCount}
      />

      {/* Summary strip */}
      <div className="dfl-summary-strip">
        {[
          { label: 'Total Entries',     value: reports.length,         icon: <FileText size={15} weight="bold" /> },
          { label: 'Hours Logged',      value: `${totalHours}h`,       icon: <Clock size={15} weight="bold" />    },
          { label: 'Reviewed',          value: reviewedCount,           icon: <CheckCircle size={15} weight="bold" /> },
          { label: 'Drafts In Progress', value: draftCount,             icon: <ArrowsClockwise size={15} weight="bold" />, alert: draftCount > 0 },
        ].map(s => (
          <div
            key={s.label}
            className="dfl-summary-card"
            style={s.alert && s.value > 0 ? { borderColor: '#FCD34D' } : {}}
          >
            <div
              className="dfl-summary-icon"
              style={{ color: s.alert && s.value > 0 ? '#B45309' : bc.bgActive }}
            >
              {s.icon}
            </div>
            <div>
              <div
                className="dfl-summary-value"
                style={{ color: s.alert && s.value > 0 ? '#B45309' : 'var(--text-1)' }}
              >
                {s.value}
              </div>
              <div className="dfl-summary-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Draft entries callout */}
      {draftCount > 0 && (
        <div className="dfl-draft-callout" style={{ borderLeftColor: bc.bgActive }}>
          <ArrowsClockwise size={14} weight="bold" style={{ color: bc.bgActive, flexShrink: 0 }} />
          <span>
            <strong>{draftCount} log{draftCount !== 1 ? 's' : ''} in progress</strong>
            {' '}— morning check-in saved. Complete the end-of-day close-out when work is done.
          </span>
        </div>
      )}

      {/* Entries list */}
      <div className="dash-card">
        <div
          className="dash-card-head"
          style={{ background: bc.bgActive, color: bc.textActive, transition: 'background 0.2s ease' }}
        >
          <span className="dash-card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <Clock size={14} />
            Field Log Entries
          </span>
          <button className="dfl-new-entry-btn" onClick={() => setFormMode('part1')}>
            <Plus size={13} weight="bold" />
            New Entry
          </button>
        </div>

        <div>
          {reports.length === 0 ? (
            <div className="dfl-empty-state">
              <FileText size={28} weight="thin" style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
              <div>No log entries for this branch</div>
              <button
                className="dfl-empty-cta"
                style={{ color: bc.bgActive }}
                onClick={() => setFormMode('part1')}
              >
                Create first entry
              </button>
            </div>
          ) : (
            <div className="dfl-entries-list">
              {reports.map(r => (
                <EntryCard
                  key={r.id}
                  entry={r}
                  bc={bc}
                  onCloseOut={openCloseOut}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Part 1 Form */}
      {formMode === 'part1' && (
        <Part1Form
          onClose={() => setFormMode(null)}
          onSave={handlePart1Save}
          bc={bc}
        />
      )}

      {/* Part 2 Form */}
      {formMode === 'part2' && (
        <Part2Form
          entry={closeoutEntry}
          onClose={() => { setFormMode(null); setCloseoutId(null) }}
          onSubmit={handlePart2Submit}
          bc={bc}
        />
      )}

    </div>
  )
}
