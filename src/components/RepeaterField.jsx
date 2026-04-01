/**
 * RepeaterField — repeating entry field component
 *
 * Renders a list of saved entries with an "Add Entry" button.
 * Each entry opens a slide-up sheet with the sub-fields defined in
 * field.fields (array of field definitions).
 *
 * Value format: array of objects, one per entry
 * [{ photo: '...', description: 'Tank 1', air_terminals: 'Yes', ... }, ...]
 *
 * Props:
 *   field     — field definition with field.fields = sub-field array
 *   value     — current entries array
 *   onChange  — (newEntries) => void
 *   error     — optional error string
 */

import { useState } from 'react'
import {
  Plus, Trash, PencilSimple, X, CheckCircle, Camera } from '@phosphor-icons/react'
import { FormField } from './FormEngine.jsx'

// ─── Sub-field label ──────────────────────────────────────────────────────────
function SubLabel({ field, error }) {
  return (
    <div style={{ marginBottom: 'var(--space-xs)' }}>
      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-semibold)', color: error ? 'var(--state-error)' : 'var(--text-primary)', lineHeight: 'var(--leading-normal)' }}>
        {field.label}
        {field.required && <span className="text-error-marker">*</span>}
      </div>
      {field.hint && <div className="meta-text">{field.hint}</div>}
      {error && <div className="validation-error">{error}</div>}
    </div>
  )
}

// ─── Validate a single entry ──────────────────────────────────────────────────
function validateEntry(subFields, entry) {
  const errors = {}
  for (const f of subFields || []) {
    if (!f.required) continue
    const val = entry[f.id]
    const empty =
      val === undefined || val === null || val === '' ||
      (Array.isArray(val) && val.length === 0) ||
      (f.type === 'boolean' && val !== true && val !== false)
    if (empty) errors[f.id] = 'Required'
  }
  return errors
}

// ─── Entry summary row ────────────────────────────────────────────────────────
function EntryRow({ entry, index, subFields, onEdit, onDelete }) {
  // Build a short summary from the first text/textarea field value
  const firstText = subFields.find(f => ['text', 'textarea', 'select'].includes(f.type))
  const summary   = firstText ? entry[firstText.id] : null
  const hasPhoto  = subFields.some(f => f.type === 'photo' && entry[f.id])

  return (
    <div className="repeater-field-e406">
      {/* Entry number badge */}
      <div style={{
        width: 'var(--icon-size-sm)', height: 'var(--icon-size-sm)', borderRadius: 'var(--radius-l)',
        background: 'var(--brand-primary)', color: 'var(--color-white)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)', flexShrink: 0 }}>
        {index + 1}
      </div>

      {/* Summary text */}
      <div className="content-body">
        <div className="text-sm-truncate">
          {summary || `Entry ${index + 1}`}
        </div>
        <div className="meta-text">
          {hasPhoto && <span>📷 </span>}
          {subFields.filter(f => entry[f.id] !== undefined && entry[f.id] !== null && entry[f.id] !== '').length} of {subFields.length} fields filled
        </div>
      </div>

      {/* Edit + Delete */}
      <button type="button" onClick={onEdit}
        className="repeater-field-33d6">
        <PencilSimple size="0.875rem" />
      </button>
      <button type="button" onClick={onDelete}
        className="repeater-field-9997">
        <Trash size="0.875rem" />
      </button>
    </div>
  )
}

// ─── Entry sheet (slide-up modal) ─────────────────────────────────────────────
function EntrySheet({ subFields, entry, onSave, onClose, title }) {
  const [values, setValues] = useState({ ...entry })
  const [errors, setErrors] = useState({})

  const set = (id, val) => {
    setValues(v => ({ ...v, [id]: val }))
    if (errors[id]) setErrors(e => { const n = { ...e }; delete n[id]; return n })
  }

  const handleSave = () => {
    const errs = validateEntry(subFields, values)
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }
    onSave(values)
  }

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} className="modal-overlay" />

      {/* Sheet */}
      <div style={{
        position: 'fixed', left: 0, right: 0, bottom: 'env(safe-area-inset-bottom, 0px)', zIndex: 'var(--z-sheet)',
        background: 'var(--surface-base)',
        borderRadius: 'var(--radius-l) var(--radius-l) 0 0',
        maxHeight: '90vh',
        display: 'flex', flexDirection: 'column',
        animation: 'anim-slide-up 0.22s cubic-bezier(0.32,0.72,0,1)' }}>
        {/* Sheet header */}
        <div className="repeater-field-9fa3">
          <div className="repeater-field-fa4b">
            {title}
          </div>
          <div className="flex-gap-s">
            <button type="button" onClick={onClose} style={{
              width: 'var(--icon-size-md)', height: 'var(--icon-size-md)', borderRadius: 'var(--radius-l)', background: 'var(--surface-base)',
              color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <X size="1rem" />
            </button>
            <button type="button" onClick={handleSave} style={{
              height: 'var(--icon-size-md)', padding: '0 var(--space-l)', borderRadius: 'var(--radius-l)',
              background: 'var(--brand-primary)',
              color: 'var(--color-white)', fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-bold)',
              display: 'flex', alignItems: 'center', gap: 'var(--space-2xs)', cursor: 'pointer' }}>
              <CheckCircle size="0.875rem" /> Save
            </button>
          </div>
        </div>

        {/* Scrollable fields */}
        <div style={{
          flex: 1, overflowY: 'auto',
          padding: 'var(--space-l)',
          display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)',
          paddingBottom: 'calc(var(--space-l) + env(safe-area-inset-bottom))' }}>
          {subFields.map(f => (
            <div key={f.id}>
              <SubLabel field={f} error={errors[f.id]} />
              <FormField
                field={f}
                value={values[f.id]}
                onChange={val => set(f.id, val)}
                error={errors[f.id]}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

// ─── RepeaterField ────────────────────────────────────────────────────────────
export default function RepeaterField({ field, value, onChange, error }) {
  const entries   = Array.isArray(value) ? value : []
  const subFields = field.fields || []
  const [sheet, setSheet] = useState(null) // null | { mode: 'add' | 'edit', index: number|null }

  const openAdd  = () => setSheet({ mode: 'add', index: null })
  const openEdit = (i) => setSheet({ mode: 'edit', index: i })
  const close    = () => setSheet(null)

  const handleSave = (entryValues) => {
    if (sheet.mode === 'add') {
      onChange([...entries, entryValues])
    } else {
      const next = entries.map((e, i) => i === sheet.index ? entryValues : e)
      onChange(next)
    }
    close()
  }

  const handleDelete = (i) => {
    onChange(entries.filter((_, idx) => idx !== i))
  }

  const currentEntry = sheet?.mode === 'edit' ? entries[sheet.index] : {}
  const sheetTitle   = sheet?.mode === 'edit' ? `Edit Entry ${sheet.index + 1}` : `Add ${field.label || 'Entry'}`

  return (
    <div>
      {/* Entry list */}
      {entries.length > 0 && (
        <div className="repeater-field-fc8a">
          {entries.map((entry, i) => (
            <EntryRow
              key={i}
              entry={entry}
              index={i}
              subFields={subFields}
              onEdit={() => openEdit(i)}
              onDelete={() => handleDelete(i)}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {entries.length === 0 && (
        <div className="repeater-field-d65a">
          No entries yet — tap Add Entry to begin
        </div>
      )}

      {/* Add Entry button */}
      <button type="button" onClick={openAdd} style={{
        display: 'flex', alignItems: 'center', gap: 'var(--space-s)',
        padding: 'var(--space-s) var(--space-l)',
        borderRadius: 'var(--radius-m)',
        
        background: 'transparent',
        color: 'var(--brand-primary)',
        fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-bold)',
        cursor: 'pointer',
        transition: 'all var(--ease-fast)' }}>
        <Plus size="0.9375rem" /> Add Entry
      </button>

      {/* Error message */}
      {error && (
        <div className="repeater-field-eb63">
          {error}
        </div>
      )}

      {/* Entry sheet */}
      {sheet && (
        <EntrySheet
          subFields={subFields}
          entry={currentEntry}
          onSave={handleSave}
          onClose={close}
          title={sheetTitle}
        />
      )}
    </div>
  )
}
