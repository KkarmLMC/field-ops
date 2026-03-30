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
    <div style={{ marginBottom: 'var(--mar-s)' }}>
      <div style={{
        fontSize: 'var(--text-sm)', fontWeight: 600,
        color: error ? 'var(--red)' : 'var(--black)', lineHeight: 1.4,
      }}>
        {field.label}
        {field.required && <span style={{ color: 'var(--red)', marginLeft: 'var(--mar-xs)' }}>*</span>}
      </div>
      {field.hint && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-3)', lineHeight: 1.4, marginTop: 2 }}>{field.hint}</div>}
      {error && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--red)', marginTop: 2 }}>{error}</div>}
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
      <div style={{ marginBottom: 'var(--mar-l)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--mar-s)' }}>
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-3)' }}>
            Step {page + 1} of {total}
          </span>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-3)' }}>{current.title}</span>
        </div>
        <div style={{ height: '0.25rem', background: 'var(--border-l)', borderRadius: 'var(--r-full)', overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${((page + 1) / total) * 100}%`,
            background: 'var(--navy)', borderRadius: 'var(--r-full)',
            transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
          }} />
        </div>
        <div style={{ display: 'flex', gap: 'var(--gap-xs)', marginTop: 'var(--mar-s)', justifyContent: 'center' }}>
          {sections.map((_, i) => (
            <div key={i} style={{
              width: i === page ? '1.5rem' : '0.4rem', height: '0.4rem',
              borderRadius: 'var(--r-full)', flexShrink: 0,
              background: i < page ? 'var(--navy)' : i === page ? 'var(--red)' : 'var(--border-l)',
              transition: 'all 0.2s ease',
            }} />
          ))}
        </div>
      </div>

      {/* Section */}
      <div style={{ background: 'var(--surface-raised)', borderRadius: 'var(--r-xl)', overflow: 'hidden', marginBottom: 'var(--mar-l)' }}>
        <div style={{ background: 'var(--navy)', padding: 'var(--pad-l)' }}>
          <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: '#fff' }}>{current.title}</div>
          {current.description && <div style={{ fontSize: 'var(--text-xs)', color: 'rgba(255,255,255,0.65)', marginTop: 'var(--mar-xs)' }}>{current.description}</div>}
        </div>
        <div style={{ padding: 'var(--pad-l)', display: 'flex', flexDirection: 'column', gap: 'var(--gap-xl)' }}>
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
        <div style={{ padding: 'var(--pad-m) var(--pad-l)', marginBottom: 'var(--mar-m)', background: 'var(--red-soft)', border: '1px solid var(--red)', borderRadius: 'var(--r-m)', fontSize: 'var(--text-sm)', color: 'var(--red)' }}>
          {submitErr || 'Please fill in all required fields before continuing.'}
        </div>
      )}

      {/* Nav buttons */}
      <div style={{ display: 'flex', gap: 'var(--gap-m)', marginBottom: 'var(--mar-xxl)' }}>
        {!isFirst && (
          <button type="button" onClick={back} style={{
            flex: 1, padding: '0.75rem', borderRadius: 'var(--r-m)',
            border: '1px solid var(--border-l)', background: 'var(--surface-raised)',
            color: 'var(--black)', fontFamily: 'var(--font)', fontSize: 'var(--text-sm)', fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer',
          }}>
            <ArrowLeft size={16} /> Back
          </button>
        )}
        {!isLast ? (
          <button type="button" onClick={advance} style={{
            flex: isFirst ? 1 : 2, padding: '0.75rem', borderRadius: 'var(--r-m)',
            border: '1px solid var(--navy)', background: 'var(--navy)',
            color: '#fff', fontFamily: 'var(--font)', fontSize: 'var(--text-sm)', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer',
          }}>
            Next <ArrowRight size={16} />
          </button>
        ) : (
          <button type="button" onClick={submit} disabled={submitting} style={{
            flex: isFirst ? 1 : 2, padding: '0.75rem', borderRadius: 'var(--r-m)',
            border: `1px solid ${submitting ? 'var(--border-l)' : 'var(--red)'}`,
            background: submitting ? 'var(--hover)' : 'var(--red)',
            color: submitting ? 'var(--text-3)' : '#fff',
            fontFamily: 'var(--font)', fontSize: 'var(--text-sm)', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            cursor: submitting ? 'default' : 'pointer',
          }}>
            {submitting ? <><SpinnerGap size={14} style={{ animation: 'spin 1s linear infinite' }} /> Submitting…</> : <><CheckCircle size={14} /> Submit Form</>}
          </button>
        )}
      </div>
    </div>
  )
}
