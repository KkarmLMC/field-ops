/**
 * MultiPageForm — index-first multi-section form renderer
 *
 * Matches the TrueContext UX pattern exactly:
 *   1. Index screen — all sections listed with completion status
 *   2. Tap a section — opens it in our full-quality single-section view
 *   3. Back arrow — returns to index with that section marked complete
 *   4. Submit — activates on the index once all required sections are done
 *
 * Visual style is identical to the rest of the app (navy headers, card
 * fields, red submit button, etc). Only the navigation changes.
 */

import { useState } from 'react'
import {
  ArrowLeft, CheckCircle, Circle, SpinnerGap,
  CaretRight, Warning,
} from '@phosphor-icons/react'
import { FormField } from './FormEngine.jsx'

// ─── Per-field label (mirrors FormEngine FieldLabel) ─────────────────────────
function FieldLabel({ field, error }) {
  return (
    <div style={{ marginBottom: 'var(--mar-s)' }}>
      <div style={{
        fontSize: 'var(--text-sm)',
        fontWeight: 600,
        color: error ? 'var(--red)' : 'var(--black)',
        lineHeight: 1.4,
      }}>
        {field.label}
        {field.required && <span style={{ color: 'var(--red)', marginLeft: 'var(--mar-xs)' }}>*</span>}
      </div>
      {field.hint && (
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-3)', lineHeight: 1.4, marginTop: 2 }}>
          {field.hint}
        </div>
      )}
      {error && (
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--red)', marginTop: 2 }}>
          {error}
        </div>
      )}
    </div>
  )
}

// ─── Validate a single section ────────────────────────────────────────────────
function validateSection(section, values) {
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

// ─── Check if a section has all required fields filled ───────────────────────
function isSectionComplete(section, values) {
  return Object.keys(validateSection(section, values)).length === 0 &&
    section.fields.some(f => f.required)
}

function isSectionStarted(section, values) {
  return section.fields.some(f => {
    const val = values[f.id]
    return val !== undefined && val !== null && val !== '' &&
      !(Array.isArray(val) && val.length === 0)
  })
}

// ─── Section detail view ──────────────────────────────────────────────────────
function SectionView({ section, values, onChange, errors, onBack }) {
  const allErrors = errors || {}

  return (
    <div>
      {/* Header with back button */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--gap-m)',
        marginBottom: 'var(--mar-l)',
      }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            width: '2.25rem',
            height: '2.25rem',
            borderRadius: 'var(--r-l)',
            border: '1px solid var(--border-l)',
            background: 'var(--surface-raised)',
            color: 'var(--black)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <ArrowLeft size={16} />
        </button>
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-3)', fontWeight: 500 }}>
          Back to sections
        </div>
      </div>

      {/* Section card */}
      <div style={{
        background: 'var(--surface-raised)',
        borderRadius: 'var(--r-m)',
        overflow: 'hidden',
        marginBottom: 'var(--mar-l)',
      }}>
        {/* Navy section header */}
        <div style={{
          background: 'var(--navy)',
          padding: 'var(--pad-l)',
        }}>
          <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: '#fff' }}>
            {section.title}
          </div>
          {section.description && (
            <div style={{ fontSize: 'var(--text-xs)', color: 'rgba(255,255,255,0.65)', marginTop: 'var(--mar-xs)' }}>
              {section.description}
            </div>
          )}
        </div>

        {/* Fields */}
        <div style={{
          padding: 'var(--pad-l)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--gap-xl)',
        }}>
          {section.fields.map(field => (
            <div key={field.id} id={`field-${field.id}`}>
              <FieldLabel field={field} error={allErrors[field.id]} />
              <FormField
                field={field}
                value={values[field.id]}
                onChange={val => onChange(field.id, val)}
                error={allErrors[field.id]}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Done button */}
      <button
        type="button"
        onClick={onBack}
        style={{
          width: '100%',
          padding: 'var(--pad-m)',
          borderRadius: 'var(--r-m)',
          border: '1px solid var(--navy)',
          background: 'var(--navy)',
          color: '#fff',
          fontFamily: 'var(--font)',
          fontSize: 'var(--text-sm)',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--gap-s)',
          cursor: 'pointer',
          marginBottom: 'var(--mar-xxl)',
        }}
      >
        <CheckCircle size={16} />
        Done — Back to Sections
      </button>
    </div>
  )
}

// ─── Main MultiPageForm ───────────────────────────────────────────────────────
export default function MultiPageForm({
  schema,
  values = {},
  onChange,
  errors = {},
  onSubmit,
  submitting = false,
  submitErr = null,
}) {
  const sections = schema.sections || []
  const [activeSection, setActiveSection] = useState(null) // null = index view
  const [sectionErrors, setSectionErrors] = useState({})

  // Are all required sections complete?
  const allComplete = sections
    .filter(s => s.fields.some(f => f.required))
    .every(s => isSectionComplete(s, values))

  const openSection = (idx) => {
    setSectionErrors({})
    setActiveSection(idx)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const closeSection = () => {
    setActiveSection(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleFieldChange = (fieldId, value) => {
    onChange(fieldId, value)
    if (sectionErrors[fieldId]) {
      setSectionErrors(e => { const n = { ...e }; delete n[fieldId]; return n })
    }
  }

  const handleSubmit = () => {
    // Validate all sections before submitting
    const allErrors = {}
    sections.forEach(s => {
      Object.assign(allErrors, validateSection(s, values))
    })
    if (Object.keys(allErrors).length) {
      // Open first incomplete section
      const firstIncomplete = sections.findIndex(s =>
        Object.keys(validateSection(s, values)).length > 0
      )
      if (firstIncomplete >= 0) openSection(firstIncomplete)
      return
    }
    onSubmit()
  }

  // ── Section detail view ───────────────────────────────────────────────────
  if (activeSection !== null) {
    const section = sections[activeSection]
    const errs = { ...errors, ...sectionErrors }
    return (
      <SectionView
        section={section}
        values={values}
        onChange={handleFieldChange}
        errors={errs}
        onBack={closeSection}
      />
    )
  }

  // ── Index view ────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 'var(--mar-l)' }}>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-3)', fontWeight: 600, marginBottom: 'var(--mar-xs)' }}>
          {sections.filter(s => isSectionComplete(s, values)).length} of {sections.length} sections complete
        </div>
        {/* Overall progress bar */}
        <div style={{ height: '0.25rem', background: 'var(--border-l)', borderRadius: 'var(--r-xxl)', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${(sections.filter(s => isSectionComplete(s, values)).length / sections.length) * 100}%`,
            background: allComplete ? 'var(--success)' : 'var(--navy)',
            borderRadius: 'var(--r-xxl)',
            transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          }} />
        </div>
      </div>

      {/* Section list */}
      <div style={{
        background: 'var(--surface-raised)',
        borderRadius: 'var(--r-m)',
        overflow: 'hidden',
        marginBottom: 'var(--mar-l)',
      }}>
        {sections.map((section, idx) => {
          const complete  = isSectionComplete(section, values)
          const started   = isSectionStarted(section, values)
          const hasRequired = section.fields.some(f => f.required)
          const isLast    = idx === sections.length - 1

          return (
            <button
              key={section.id || idx}
              type="button"
              onClick={() => openSection(idx)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--gap-m)',
                padding: 'var(--pad-l)',
                background: complete ? 'rgba(22,163,74,0.04)' : 'transparent',
                border: 'none',
                borderBottom: isLast ? 'none' : '1px solid var(--border-l)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background var(--ease-fast)',
                WebkitTapHighlightColor: 'transparent',
              }}
              onTouchStart={e => e.currentTarget.style.background = 'var(--hover)'}
              onTouchEnd={e => e.currentTarget.style.background = complete ? 'rgba(22,163,74,0.04)' : 'transparent'}
            >
              {/* Status icon */}
              <div style={{ flexShrink: 0 }}>
                {complete ? (
                  <CheckCircle size={22} weight="fill" style={{ color: 'var(--success)' }} />
                ) : started ? (
                  <Warning size={22} weight="fill" style={{ color: 'var(--amber, #D97706)' }} />
                ) : (
                  <Circle size={22} style={{ color: 'var(--border-l)' }} />
                )}
              </div>

              {/* Label */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 'var(--text-md)',
                  fontWeight: complete ? 600 : 500,
                  color: complete ? 'var(--black)' : 'var(--black)',
                  marginBottom: 2,
                }}>
                  {section.title}
                  {hasRequired && !complete && (
                    <span style={{ color: 'var(--red)', marginLeft: 'var(--mar-xs)', fontSize: 'var(--text-xs)' }}>*</span>
                  )}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-3)' }}>
                  {complete ? 'Complete' : started ? 'In progress' : `${section.fields.filter(f=>f.required).length} required fields`}
                </div>
              </div>

              <CaretRight size={16} style={{ color: 'var(--black)', flexShrink: 0 }} />
            </button>
          )
        })}
      </div>

      {/* Error / incomplete notice */}
      {submitErr && (
        <div style={{
          padding: 'var(--pad-m) var(--pad-l)',
          marginBottom: 'var(--mar-m)',
          background: 'var(--red-soft)',
          border: '1px solid var(--red)',
          borderRadius: 'var(--r-m)',
          fontSize: 'var(--text-sm)',
          color: 'var(--red)',
        }}>
          {submitErr}
        </div>
      )}
      {!allComplete && (
        <div style={{
          padding: 'var(--pad-m) var(--pad-l)',
          marginBottom: 'var(--mar-m)',
          background: 'var(--surface-raised)',
          border: '1px solid var(--border-l)',
          borderRadius: 'var(--r-m)',
          fontSize: 'var(--text-xs)',
          color: 'var(--text-3)',
          textAlign: 'center',
        }}>
          Complete all required sections to submit
        </div>
      )}

      {/* Submit */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting || !allComplete}
        style={{
          width: '100%',
          padding: 'var(--pad-m)',
          borderRadius: 'var(--r-m)',
          border: `1px solid ${!allComplete || submitting ? 'var(--border-l)' : 'var(--red)'}`,
          background: !allComplete || submitting ? 'var(--hover)' : 'var(--red)',
          color: !allComplete || submitting ? 'var(--text-3)' : '#fff',
          fontFamily: 'var(--font)',
          fontSize: 'var(--text-sm)',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--gap-s)',
          cursor: !allComplete || submitting ? 'default' : 'pointer',
          marginBottom: 'var(--mar-xxl)',
          transition: 'all var(--ease-fast)',
        }}
      >
        {submitting
          ? <><SpinnerGap size={14} style={{ animation: 'spin 1s linear infinite' }} /> Submitting…</>
          : <><CheckCircle size={14} /> Submit Form</>
        }
      </button>
    </div>
  )
}
