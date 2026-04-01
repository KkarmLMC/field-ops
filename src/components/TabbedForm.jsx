/**
 * TabbedForm — linear multi-step form renderer
 *
 * One section per page, sequential navigation with Next/Back.
 * Progress bar + step indicator at the top.
 * Submit only appears on the final page.
 */

import { useState } from 'react'
import { ArrowLeft, ArrowRight, CheckCircle, SpinnerGap } from '@phosphor-icons/react'
import { FormField } from './FormEngine.jsx'

function FieldLabel({ field, error }) {
  return (
    <div style={{ marginBottom: 'var(--space-s)' }}>
      <div style={{
        fontSize: 'var(--text-sm)', fontWeight: 600,
        color: error ? 'var(--state-error)' : 'var(--text-primary)', lineHeight: 1.4 }}>
        {field.label}
        {field.required && <span style={{ color: 'var(--state-error)', marginLeft: 'var(--space-xs)' }}>*</span>}
      </div>
      {field.hint && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', lineHeight: 1.4, marginTop: 2 }}>{field.hint}</div>}
      {error && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--state-error)', marginTop: 2 }}>{error}</div>}
    </div>
  )
}

function validatePage(section, values) {
  const errors = {}
  for (const field of section.fields || []) {
    if (!field.required) continue
    const val = values[field.id]
    const empty =
      val === undefined || val === null || val === '' ||
      (Array.isArray(val) && val.length === 0) ||
      (field.type === 'boolean' && val !== true && val !== false) ||
      (field.type === 'signature' && !val?.sig && !val)
    if (empty) errors[field.id] = 'Required'
  }
  return errors
}

export default function TabbedForm({ schema, values = {}, onChange, errors = {}, onSubmit, submitting = false, submitErr = null }) {
  const sections = schema.sections || []
  const total = sections.length
  const [page, setPage] = useState(0)
  const [pageErrors, setPageErrors] = useState({})

  const current = sections[page]
  const isFirst = page === 0
  const isLast  = page === total - 1
  const allErrors = { ...errors, ...pageErrors }

  const handleChange = (fieldId, value) => {
    onChange(fieldId, value)
    if (pageErrors[fieldId]) setPageErrors(e => { const n = { ...e }; delete n[fieldId]; return n })
  }

  const advance = () => {
    const errs = validatePage(current, values)
    if (Object.keys(errs).length) {
      setPageErrors(errs)
      document.getElementById(`field-${Object.keys(errs)[0]}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setPageErrors({})
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setPage(p => p + 1)
  }

  const back = () => {
    setPageErrors({})
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setPage(p => p - 1)
  }

  const submit = () => {
    const errs = validatePage(current, values)
    if (Object.keys(errs).length) {
      setPageErrors(errs)
      document.getElementById(`field-${Object.keys(errs)[0]}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setPageErrors({})
    onSubmit()
  }

  return (
    <div>
      {/* Progress */}
      <div style={{ marginBottom: 'var(--space-l)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-s)' }}>
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-muted)' }}>
            Step {page + 1} of {total}
          </span>
          <span className="meta-text">{current.title}</span>
        </div>
        <div style={{ height: '0.25rem', background: 'var(--border-subtle)', borderRadius: 'var(--radius-l)', overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${((page + 1) / total) * 100}%`,
            background: 'var(--brand-primary)', borderRadius: 'var(--radius-l)',
            transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)' }} />
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-xs)', marginTop: 'var(--space-s)', justifyContent: 'center' }}>
          {sections.map((_, i) => (
            <div key={i} style={{
              width: i === page ? '1.5rem' : '0.4rem', height: '0.4rem',
              borderRadius: 'var(--radius-l)', flexShrink: 0,
              background: i < page ? 'var(--brand-primary)' : i === page ? 'var(--state-error)' : 'var(--border-subtle)',
              transition: 'all 0.2s ease' }} />
          ))}
        </div>
      </div>

      {/* Section */}
      <div className="card-section">
        <div style={{ background: 'var(--brand-primary)', padding: 'var(--space-l)' }}>
          <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: '#fff' }}>{current.title}</div>
          {current.description && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--surface-base)', marginTop: 'var(--space-xs)' }}>{current.description}</div>}
        </div>
        <div style={{ padding: 'var(--space-l)', display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
          {current.fields.map(field => (
            <div key={field.id} id={`field-${field.id}`}>
              <FieldLabel field={field} error={allErrors[field.id]} />
              <FormField field={field} value={values[field.id]} onChange={val => handleChange(field.id, val)} error={allErrors[field.id]} />
            </div>
          ))}
        </div>
      </div>

      {/* Errors */}
      {(submitErr || Object.keys(pageErrors).length > 0) && (
        <div style={{ padding: 'var(--space-m) var(--space-l)', marginBottom: 'var(--space-m)', background: 'var(--red-soft)', borderRadius: 'var(--radius-m)', fontSize: 'var(--text-sm)', color: 'var(--state-error)' }}>
          {submitErr || 'Please fill in all required fields before continuing.'}
        </div>
      )}

      {/* Nav buttons */}
      <div style={{ display: 'flex', gap: 'var(--space-m)', marginBottom: 'var(--space-2xl)' }}>
        {!isFirst && (
          <button type="button" onClick={back} style={{
            flex: 1, padding: '0.75rem', borderRadius: 'var(--radius-m)', background: 'var(--surface-base)',
            color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <ArrowLeft size="1rem" /> Back
          </button>
        )}
        {!isLast ? (
          <button type="button" onClick={advance} style={{
            flex: isFirst ? 1 : 2, padding: '0.75rem', borderRadius: 'var(--radius-m)',
            background: 'var(--brand-primary)',
            color: '#fff', fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            Next <ArrowRight size="1rem" />
          </button>
        ) : (
          <button type="button" onClick={submit} disabled={submitting} style={{
            flex: isFirst ? 1 : 2, padding: '0.75rem', borderRadius: 'var(--radius-m)',
            
            background: submitting ? 'var(--surface-hover)' : 'var(--state-error)',
            color: submitting ? 'var(--text-muted)' : '#fff',
            fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            cursor: submitting ? 'default' : 'pointer' }}>
            {submitting ? <><SpinnerGap size="0.875rem" style={{ animation: 'spin 1s linear infinite' }} /> Submitting…</> : <><CheckCircle size="0.875rem" /> Submit Form</>}
          </button>
        )}
      </div>
    </div>
  )
}
