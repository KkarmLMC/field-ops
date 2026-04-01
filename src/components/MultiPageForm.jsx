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
        fontWeight: 600,
        color: error ? 'var(--state-error)' : 'var(--text-primary)',
        lineHeight: 1.4 }}>
        {field.label}
        {field.required && <span style={{ color: 'var(--state-error)', marginLeft: 'var(--space-xs)' }}>*</span>}
      </div>
      {field.hint && (
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', lineHeight: 1.4, marginTop: 2 }}>
          {field.hint}
        </div>
      )}
      {error && (
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--state-error)', marginTop: 2 }}>
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
        gap: 'var(--space-m)',
        marginBottom: 'var(--space-l)' }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            width: '2.25rem',
            height: '2.25rem',
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
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', fontWeight: 500 }}>
          Back to sections
        </div>
      </div>

      {/* Section card */}
      <div style={{
        background: 'var(--surface-base)',
        borderRadius: 'var(--radius-m)',
        overflow: 'hidden',
        marginBottom: 'var(--space-l)' }}>
        {/* Navy section header */}
        <div style={{
          background: 'var(--brand-primary)',
          padding: 'var(--space-l)' }}>
          <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: '#fff' }}>
            {section.title}
          </div>
          {section.description && (
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--surface-base)', marginTop: 'var(--space-xs)' }}>
              {section.description}
            </div>
          )}
        </div>

        {/* Fields */}
        <div style={{
          padding: 'var(--space-l)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-xl)' }}>
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
          padding: 'var(--space-m)',
          borderRadius: 'var(--radius-m)',
          background: 'var(--brand-primary)',
          color: '#fff',
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-sm)',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--space-s)',
          cursor: 'pointer',
          marginBottom: 'var(--space-2xl)' }}
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
      <div style={{ marginBottom: 'var(--space-l)' }}>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 'var(--space-xs)' }}>
          {sections.filter(s => isSectionComplete(s, values)).length} of {sections.length} sections complete
        </div>
        {/* Overall progress bar */}
        <div style={{ height: '0.25rem', background: 'var(--border-subtle)', borderRadius: 'var(--radius-l)', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${(sections.filter(s => isSectionComplete(s, values)).length / sections.length) * 100}%`,
            background: allComplete ? 'var(--state-success)' : 'var(--brand-primary)',
            borderRadius: 'var(--radius-l)',
            transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }} />
        </div>
      </div>

      {/* Section list */}
      <div style={{
        background: 'var(--surface-base)',
        borderRadius: 'var(--radius-m)',
        overflow: 'hidden',
        marginBottom: 'var(--space-l)' }}>
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
                borderBottom: isLast ? 'none' : '1px solid var(--border-default)',
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
                  marginBottom: 2 }}>
                  {section.title}
                  {hasRequired && !complete && (
                    <span style={{ color: 'var(--state-error)', marginLeft: 'var(--space-xs)', fontSize: 'var(--text-xs)' }}>*</span>
                  )}
                </div>
                <div className="meta-text">
                  {complete ? 'Complete' : started ? 'In progress' : `${section.fields.filter(f=>f.required).length} required fields`}
                </div>
              </div>

              <CaretRight size="1rem" style={{ color: 'var(--text-primary)', flexShrink: 0 }} />
            </button>
          )
        })}
      </div>

      {/* Error / incomplete notice */}
      {submitErr && (
        <div style={{
          padding: 'var(--space-m) var(--space-l)',
          marginBottom: 'var(--space-m)',
          background: 'var(--red-soft)',
          borderRadius: 'var(--radius-m)',
          fontSize: 'var(--text-sm)',
          color: 'var(--state-error)' }}>
          {submitErr}
        </div>
      )}
      {!allComplete && (
        <div style={{
          padding: 'var(--space-m) var(--space-l)',
          marginBottom: 'var(--space-m)',
          background: 'var(--surface-base)',
          borderRadius: 'var(--radius-m)',
          fontSize: 'var(--text-xs)',
          color: 'var(--text-muted)',
          textAlign: 'center' }}>
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
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--space-s)',
          cursor: !allComplete || submitting ? 'default' : 'pointer',
          marginBottom: 'var(--space-2xl)',
          transition: 'all var(--ease-fast)' }}
      >
        {submitting
          ? <><SpinnerGap size="0.875rem" style={{ animation: 'spin 1s linear infinite' }} /> Submitting…</>
          : <><CheckCircle size="0.875rem" /> Submit Form</>
        }
      </button>
    </div>
  )
}
