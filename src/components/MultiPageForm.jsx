/**
 * MultiPageForm — multi-page/tabbed form renderer
 *
 * Renders one section per page, matching the TrueContext tab-based UX.
 * Users move through pages with Next/Back buttons. Submit only appears
 * on the final page. A progress bar and step indicator show position.
 *
 * Props:
 *   schema      {object}   — form_definitions row
 *   values      {object}   — current field values keyed by field id
 *   onChange    {function} — (fieldId, value) => void
 *   errors      {object}   — validation errors keyed by field id
 *   onSubmit    {function} — called when final page Submit is tapped
 *   submitting  {boolean}  — disables submit button while in-flight
 *   submitErr   {string}   — error message to show above submit
 */

import { useState } from 'react'
import { ArrowLeft, ArrowRight, CheckCircle, SpinnerGap } from '@phosphor-icons/react'
import { FormField } from './FormEngine.jsx'

// Re-export FieldLabel logic inline to avoid circular dep
function FieldLabel({ field, error }) {
  return (
    <div style={{ marginBottom: 'var(--sp-2)' }}>
      <div style={{
        fontSize: 'var(--fs-sm)',
        fontWeight: 600,
        color: error ? 'var(--red)' : 'var(--text-1)',
        marginBottom: field.hint ? '0.125rem' : 0,
        lineHeight: 1.4,
      }}>
        {field.label}
        {field.required && <span style={{ color: 'var(--red)', marginLeft: 'var(--sp-1)' }}>*</span>}
      </div>
      {field.hint && (
        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-3)', lineHeight: 1.4 }}>
          {field.hint}
        </div>
      )}
      {error && (
        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--red)', marginTop: '0.125rem' }}>
          {error}
        </div>
      )}
    </div>
  )
}

// Validate only the fields on the current section/page
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

export default function MultiPageForm({
  schema,
  values = {},
  onChange,
  errors = {},
  onSubmit,
  submitting = false,
  submitErr = null,
}) {
  const sections   = schema.sections || []
  const total      = sections.length
  const [page, setPage] = useState(0)
  const [pageErrors, setPageErrors] = useState({})

  const current     = sections[page]
  const isFirst     = page === 0
  const isLast      = page === total - 1
  const progressPct = ((page + 1) / total) * 100

  // All errors = parent errors + current page errors
  const allErrors = { ...errors, ...pageErrors }

  const handleNext = () => {
    const errs = validatePage(current, values)
    if (Object.keys(errs).length) {
      setPageErrors(errs)
      // Scroll to first error
      const firstId = Object.keys(errs)[0]
      document.getElementById(`field-${firstId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setPageErrors({})
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setPage(p => p + 1)
  }

  const handleBack = () => {
    setPageErrors({})
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setPage(p => p - 1)
  }

  const handleSubmit = () => {
    const errs = validatePage(current, values)
    if (Object.keys(errs).length) {
      setPageErrors(errs)
      const firstId = Object.keys(errs)[0]
      document.getElementById(`field-${firstId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setPageErrors({})
    onSubmit()
  }

  const handleChange = (fieldId, value) => {
    onChange(fieldId, value)
    // Clear page-level error on change
    if (pageErrors[fieldId]) {
      setPageErrors(e => { const n = { ...e }; delete n[fieldId]; return n })
    }
  }

  return (
    <div>
      {/* ── Progress bar ─────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 'var(--sp-4)' }}>
        {/* Step label */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--sp-2)',
        }}>
          <span style={{ fontSize: 'var(--fs-xs)', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Step {page + 1} of {total}
          </span>
          <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-3)' }}>
            {current.title}
          </span>
        </div>
        {/* Track */}
        <div style={{
          height: '0.25rem',
          background: 'var(--border-l)',
          borderRadius: 'var(--r-full)',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${progressPct}%`,
            background: 'var(--navy)',
            borderRadius: 'var(--r-full)',
            transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }} />
        </div>

        {/* Section dots */}
        <div style={{ display: 'flex', gap: 'var(--sp-1)', marginTop: 'var(--sp-2)', justifyContent: 'center' }}>
          {sections.map((s, i) => (
            <div
              key={i}
              style={{
                width: i === page ? '1.5rem' : '0.4rem',
                height: '0.4rem',
                borderRadius: 'var(--r-full)',
                background: i < page ? 'var(--navy)' : i === page ? 'var(--red)' : 'var(--border-l)',
                transition: 'all 0.2s ease',
                flexShrink: 0,
              }}
            />
          ))}
        </div>
      </div>

      {/* ── Section header ────────────────────────────────────────────────── */}
      <div style={{
        background: 'var(--navy)',
        borderRadius: 'var(--r-xl) var(--r-xl) 0 0',
        padding: 'var(--sp-4)',
        marginBottom: 0,
      }}>
        <div style={{ fontSize: 'var(--fs-lg)', fontWeight: 700, color: '#fff' }}>
          {current.title}
        </div>
        {current.description && (
          <div style={{ fontSize: 'var(--fs-xs)', color: 'rgba(255,255,255,0.65)', marginTop: 'var(--sp-1)' }}>
            {current.description}
          </div>
        )}
      </div>

      {/* ── Fields ────────────────────────────────────────────────────────── */}
      <div style={{
        background: 'var(--surface-raised)',
        borderRadius: '0 0 var(--r-xl) var(--r-xl)',
        padding: 'var(--sp-4)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--sp-5)',
        marginBottom: 'var(--sp-4)',
      }}>
        {current.fields.map(field => (
          <div key={field.id} id={`field-${field.id}`}>
            <FieldLabel field={field} error={allErrors[field.id]} />
            <FormField
              field={field}
              value={values[field.id]}
              onChange={val => handleChange(field.id, val)}
              error={allErrors[field.id]}
            />
          </div>
        ))}
      </div>

      {/* ── Error banner ──────────────────────────────────────────────────── */}
      {(submitErr || Object.keys(pageErrors).length > 0) && (
        <div style={{
          padding: 'var(--sp-3) var(--sp-4)',
          marginBottom: 'var(--sp-3)',
          background: 'var(--red-soft)',
          border: '1px solid var(--red)',
          borderRadius: 'var(--r-md)',
          fontSize: 'var(--fs-sm)',
          color: 'var(--red)',
        }}>
          {submitErr || 'Please fill in all required fields before continuing.'}
        </div>
      )}

      {/* ── Navigation buttons ────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        gap: 'var(--sp-3)',
        marginBottom: 'var(--sp-8)',
      }}>
        {/* Back */}
        {!isFirst && (
          <button
            type="button"
            onClick={handleBack}
            style={{
              flex: 1,
              padding: 'var(--sp-3)',
              borderRadius: 'var(--r-md)',
              border: '1px solid var(--border-l)',
              background: 'var(--surface-raised)',
              color: 'var(--text-2)',
              fontFamily: 'var(--font)',
              fontSize: 'var(--fs-sm)',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--sp-2)',
              cursor: 'pointer',
              transition: 'all var(--ease-fast)',
            }}
          >
            <ArrowLeft size={16} />
            Back
          </button>
        )}

        {/* Next or Submit */}
        {!isLast ? (
          <button
            type="button"
            onClick={handleNext}
            style={{
              flex: isFirst ? 1 : 2,
              padding: 'var(--sp-3)',
              borderRadius: 'var(--r-md)',
              border: '1px solid var(--navy)',
              background: 'var(--navy)',
              color: '#fff',
              fontFamily: 'var(--font)',
              fontSize: 'var(--fs-sm)',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--sp-2)',
              cursor: 'pointer',
              transition: 'all var(--ease-fast)',
            }}
          >
            Next
            <ArrowRight size={16} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              flex: isFirst ? 1 : 2,
              padding: 'var(--sp-3)',
              borderRadius: 'var(--r-md)',
              border: `1px solid ${submitting ? 'var(--border-l)' : 'var(--red)'}`,
              background: submitting ? 'var(--hover)' : 'var(--red)',
              color: submitting ? 'var(--text-3)' : '#fff',
              fontFamily: 'var(--font)',
              fontSize: 'var(--fs-sm)',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--sp-2)',
              cursor: submitting ? 'default' : 'pointer',
              transition: 'all var(--ease-fast)',
            }}
          >
            {submitting
              ? <><SpinnerGap size={14} style={{ animation: 'spin 1s linear infinite' }} /> Submitting…</>
              : <><CheckCircle size={14} /> Submit Form</>
            }
          </button>
        )}
      </div>
    </div>
  )
}
