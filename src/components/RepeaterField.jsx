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
      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: error ? 'var(--state-error)' : 'var(--text-primary)', lineHeight: 1.4 }}>
        {field.label}
        {field.required && <span style={{ color: 'var(--state-error)', marginLeft: 4 }}>*</span>}
      </div>
      {field.hint && <div className="meta-text">{field.hint}</div>}
      {error && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--state-error)', marginTop: 2 }}>{error}</div>}
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
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-m)',
      padding: 'var(--space-m) var(--space-l)',
      borderBottom: '1px solid var(--border-default)',
      background: 'var(--surface-base)' }}>
      {/* Entry number badge */}
      <div style={{
        width: '1.75rem', height: '1.75rem', borderRadius: 'var(--radius-l)',
        background: 'var(--brand-primary)', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 'var(--text-xs)', fontWeight: 700, flexShrink: 0 }}>
        {index + 1}
      </div>

      {/* Summary text */}
      <div className="content-body">
        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {summary || `Entry ${index + 1}`}
        </div>
        <div className="meta-text">
          {hasPhoto && <span>📷 </span>}
          {subFields.filter(f => entry[f.id] !== undefined && entry[f.id] !== null && entry[f.id] !== '').length} of {subFields.length} fields filled
        </div>
      </div>

      {/* Edit + Delete */}
      <button type="button" onClick={onEdit}
        style={{ width: '2rem', height: '2rem', borderRadius: 'var(--radius-m)', background: 'var(--surface-base)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
        <PencilSimple size="0.875rem" />
      </button>
      <button type="button" onClick={onDelete}
        style={{ width: '2rem', height: '2rem', borderRadius: 'var(--radius-m)', background: 'var(--surface-base)', color: 'var(--state-error)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
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
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, zIndex: 299,
        background: 'rgba(0,0,0,0.5)',
        animation: 'anim-fade-in 0.15s ease' }} />

      {/* Sheet */}
      <div style={{
        position: 'fixed', left: 0, right: 0, bottom: 'env(safe-area-inset-bottom, 0px)', zIndex: 300,
        background: 'var(--surface-base)',
        borderRadius: 'var(--radius-l) var(--radius-l) 0 0',
        maxHeight: '90vh',
        display: 'flex', flexDirection: 'column',
        animation: 'anim-slide-up 0.22s cubic-bezier(0.32,0.72,0,1)' }}>
        {/* Sheet header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: 'var(--space-l)',
          borderBottom: '1px solid var(--border-default)',
          flexShrink: 0 }}>
          <div style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--text-primary)' }}>
            {title}
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-s)' }}>
            <button type="button" onClick={onClose} style={{
              width: '2.25rem', height: '2.25rem', borderRadius: 'var(--radius-l)', background: 'var(--surface-base)',
              color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <X size="1rem" />
            </button>
            <button type="button" onClick={handleSave} style={{
              height: '2.25rem', padding: '0 1rem', borderRadius: 'var(--radius-l)',
              background: 'var(--brand-primary)',
              color: '#fff', fontSize: 'var(--text-sm)', fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
              <CheckCircle size="0.875rem" /> Save
            </button>
          </div>
        </div>

        {/* Scrollable fields */}
        <div style={{
          flex: 1, overflowY: 'auto',
          padding: 'var(--space-l)',
          display: 'flex', flexDirection: 'column', gap: '1.25rem',
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
        <div style={{ borderRadius: 'var(--radius-l)',
          overflow: 'hidden',
          marginBottom: 'var(--space-m)' }}>
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
        <div style={{
          padding: 'var(--space-xl)',
          textAlign: 'center',
          border: '1px dashed var(--border-default)',
          borderRadius: 'var(--radius-l)',
          marginBottom: 'var(--space-m)',
          color: 'var(--text-muted)',
          fontSize: 'var(--text-sm)' }}>
          No entries yet — tap Add Entry to begin
        </div>
      )}

      {/* Add Entry button */}
      <button type="button" onClick={openAdd} style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        padding: 'var(--space-s) var(--space-l)',
        borderRadius: 'var(--radius-m)',
        
        background: 'transparent',
        color: 'var(--brand-primary)',
        fontSize: 'var(--text-sm)', fontWeight: 700,
        cursor: 'pointer',
        transition: 'all var(--ease-fast)' }}>
        <Plus size="0.9375rem" /> Add Entry
      </button>

      {/* Error message */}
      {error && (
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--state-error)', marginTop: 'var(--space-xs)' }}>
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
