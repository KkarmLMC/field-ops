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
  CaretRight, Warning } from '@phosphor-icons/react'
import { FormField } from './FormEngine.jsx'

// ─── Per-field label (mirrors FormEngine FieldLabel) ─────────────────────────
function FieldLabel({ field, error }) {
  return (
    <div className="mb-s">
      <div style={{
        fontSize: 'var(--text-sm)',
        fontWeight: 'var(--fw-semibold)',
        color: error ? 'var(--state-error)' : 'var(--text-primary)',
        lineHeight: 'var(--leading-normal)' }}>
        {field.label}
        {field.required && <span className="multi-page-form-5d1f">*</span>}
      </div>
      {field.hint && (
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', lineHeight: 'var(--leading-normal)', marginTop: 'var(--space-3xs)' }}>
          {field.hint}
        </div>
      )}
      {error && (
        <div className="validation-error">
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
      <div className="multi-page-form-e36b">
        <button
          type="button"
          onClick={onBack}
          style={{
            width: 'var(--icon-size-md)',
            height: 'var(--icon-size-md)',
            borderRadius: 'var(--radius-l)',
            background: 'var(--surface-base)',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0 }}
        >
          <ArrowLeft size="1rem" />
        </button>
        <div className="multi-page-form-f48a">
          Back to sections
        </div>
      </div>

      {/* Section card */}
      <div className="multi-page-form-0d43">
        {/* Navy section header */}
        <div className="multi-page-form-edfe">
          <div className="page-heading--inverse">
            {section.title}
          </div>
          {section.description && (
            <div className="multi-page-form-6929">
              {section.description}
            </div>
          )}
        </div>

        {/* Fields */}
        <div className="multi-page-form-e8f3">
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
        className="multi-page-form-3110"
      >
        <CheckCircle size="1rem" />
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
  submitErr = null }) {
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
      <div className="mb-l">
        <div className="multi-page-form-7393">
          {sections.filter(s => isSectionComplete(s, values)).length} of {sections.length} sections complete
        </div>
        {/* Overall progress bar */}
        <div style={{ height: 'var(--space-2xs)', background: 'var(--border-subtle)', borderRadius: 'var(--radius-l)', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${(sections.filter(s => isSectionComplete(s, values)).length / sections.length) * 100}%`,
            background: allComplete ? 'var(--state-success)' : 'var(--brand-primary)',
            borderRadius: 'var(--radius-l)',
            transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }} />
        </div>
      </div>

      {/* Section list */}
      <div className="multi-page-form-0d43">
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
                gap: 'var(--space-m)',
                padding: 'var(--space-l)',
                background: complete ? 'rgba(22,163,74,0.04)' : 'transparent',
                borderBottom: isLast ? 'none' : 'var(--border-width-1) solid var(--border-default)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background var(--ease-fast)',
                WebkitTapHighlightColor: 'transparent' }}
              onTouchStart={e => e.currentTarget.style.background = 'var(--surface-hover)'}
              onTouchEnd={e => e.currentTarget.style.background = complete ? 'rgba(22,163,74,0.04)' : 'transparent'}
            >
              {/* Status icon */}
              <div className="shrink-0">
                {complete ? (
                  <CheckCircle size="1.375rem" weight="fill" style={{ color: 'var(--state-success)' }} />
                ) : started ? (
                  <Warning size="1.375rem" weight="fill" style={{ color: 'var(--amber, #D97706)' }} />
                ) : (
                  <Circle size="1.375rem" style={{ color: 'var(--border-subtle)' }} />
                )}
              </div>

              {/* Label */}
              <div className="content-body">
                <div style={{
                  fontSize: 'var(--text-md)',
                  fontWeight: complete ? 600 : 500,
                  color: complete ? 'var(--text-primary)' : 'var(--text-primary)',
                  marginBottom: 'var(--space-3xs)' }}>
                  {section.title}
                  {hasRequired && !complete && (
                    <span className="multi-page-form-1b78">*</span>
                  )}
                </div>
                <div className="meta-text">
                  {complete ? 'Complete' : started ? 'In progress' : `${section.fields.filter(f=>f.required).length} required fields`}
                </div>
              </div>

              <CaretRight size="1rem" className="row-item__caret" />
            </button>
          )
        })}
      </div>

      {/* Error / incomplete notice */}
      {submitErr && (
        <div className="multi-page-form-bbaf">
          {submitErr}
        </div>
      )}
      {!allComplete && (
        <div className="multi-page-form-92cb">
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
          padding: 'var(--space-m)',
          borderRadius: 'var(--radius-m)',
          
          background: !allComplete || submitting ? 'var(--surface-hover)' : 'var(--state-error)',
          color: !allComplete || submitting ? 'var(--text-muted)' : '#fff',
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-sm)',
          fontWeight: 'var(--fw-bold)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--space-s)',
          cursor: !allComplete || submitting ? 'default' : 'pointer',
          marginBottom: 'var(--space-2xl)',
          transition: 'all var(--ease-fast)' }}
      >
        {submitting
          ? <><SpinnerGap size="0.875rem" className="anim-spin" /> Submitting…</>
          : <><CheckCircle size="0.875rem" /> Submit Form</>
        }
      </button>
    </div>
  )
}
