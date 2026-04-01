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
    <div className="mb-s">
      <div style={{
        fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-semibold)',
        color: error ? 'var(--state-error)' : 'var(--text-primary)', lineHeight: 'var(--leading-normal)' }}>
        {field.label}
        {field.required && <span className="tabbed-form-5d1f">*</span>}
      </div>
      {field.hint && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', lineHeight: 'var(--leading-normal)', marginTop: 'var(--space-3xs)' }}>{field.hint}</div>}
      {error && <div className="validation-error">{error}</div>}
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
      <div className="mb-l">
        <div className="flex-gap-s">
          <span className="tabbed-form-34db">
            Step {page + 1} of {total}
          </span>
          <span className="meta-text">{current.title}</span>
        </div>
        <div style={{ height: 'var(--space-2xs)', background: 'var(--border-subtle)', borderRadius: 'var(--radius-l)', overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${((page + 1) / total) * 100}%`,
            background: 'var(--brand-primary)', borderRadius: 'var(--radius-l)',
            transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)' }} />
        </div>
        <div className="tabbed-form-cd72">
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
        <div className="tabbed-form-ec6b">
          <div className="page-heading--inverse">{current.title}</div>
          {current.description && <div className="tabbed-form-6929">{current.description}</div>}
        </div>
        <div className="tabbed-form-41d3">
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
        <div className="tabbed-form-0483">
          {submitErr || 'Please fill in all required fields before continuing.'}
        </div>
      )}

      {/* Nav buttons */}
      <div className="tabbed-form-54a5">
        {!isFirst && (
          <button type="button" onClick={back} style={{
            flex: 1, padding: '0.75rem', borderRadius: 'var(--radius-m)', background: 'var(--surface-base)',
            color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-semibold)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-s)', cursor: 'pointer' }}>
            <ArrowLeft size="1rem" /> Back
          </button>
        )}
        {!isLast ? (
          <button type="button" onClick={advance} style={{
            flex: isFirst ? 1 : 2, padding: '0.75rem', borderRadius: 'var(--radius-m)',
            background: 'var(--brand-primary)',
            color: 'var(--color-white)', fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-bold)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-s)', cursor: 'pointer' }}>
            Next <ArrowRight size="1rem" />
          </button>
        ) : (
          <button type="button" onClick={submit} disabled={submitting} style={{
            flex: isFirst ? 1 : 2, padding: '0.75rem', borderRadius: 'var(--radius-m)',
            
            background: submitting ? 'var(--surface-hover)' : 'var(--state-error)',
            color: submitting ? 'var(--text-muted)' : '#fff',
            fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-bold)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-s)',
            cursor: submitting ? 'default' : 'pointer' }}>
            {submitting ? <><SpinnerGap size="0.875rem" className="anim-spin" /> Submitting…</> : <><CheckCircle size="0.875rem" /> Submit Form</>}
          </button>
        )}
      </div>
    </div>
  )
}
