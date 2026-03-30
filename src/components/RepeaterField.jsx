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
  Plus, Trash, PencilSimple, X, CheckCircle, Camera,
} from '@phosphor-icons/react'
import { FormField } from './FormEngine.jsx'

// ─── Sub-field label ──────────────────────────────────────────────────────────
function SubLabel({ field, error }) {
  return (
    <div style={{ marginBottom: 'var(--mar-xs)' }}>
      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: error ? 'var(--red)' : 'var(--black)', lineHeight: 1.4 }}>
        {field.label}
        {field.required && <span style={{ color: 'var(--red)', marginLeft: 4 }}>*</span>}
      </div>
      {field.hint && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-3)', marginTop: 2 }}>{field.hint}</div>}
      {error && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--red)', marginTop: 2 }}>{error}</div>}
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
      gap: 'var(--gap-m)',
      padding: 'var(--pad-m) var(--pad-l)',
      borderBottom: '1px solid var(--border-l)',
      background: 'var(--white)',
    }}>
      {/* Entry number badge */}
      <div style={{
        width: '1.75rem', height: '1.75rem', borderRadius: 'var(--r-xxl)',
        background: 'var(--navy)', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 'var(--text-xs)', fontWeight: 700, flexShrink: 0,
      }}>
        {index + 1}
      </div>

      {/* Summary text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--black)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {summary || `Entry ${index + 1}`}
        </div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-3)', marginTop: 2 }}>
          {hasPhoto && <span>📷 </span>}
          {subFields.filter(f => entry[f.id] !== undefined && entry[f.id] !== null && entry[f.id] !== '').length} of {subFields.length} fields filled
        </div>
      </div>

      {/* Edit + Delete */}
      <button type="button" onClick={onEdit}
        style={{ width: '2rem', height: '2rem', borderRadius: 'var(--r-m)', border: '1px solid var(--border-l)', background: 'var(--surface-raised)', color: 'var(--black)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
        <PencilSimple size={14} />
      </button>
      <button type="button" onClick={onDelete}
        style={{ width: '2rem', height: '2rem', borderRadius: 'var(--r-m)', border: '1px solid var(--border-l)', background: 'var(--surface-raised)', color: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
        <Trash size={14} />
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
        animation: 'anim-fade-in 0.15s ease',
      }} />

      {/* Sheet */}
      <div style={{
        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 300,
        background: 'var(--white)',
        borderRadius: 'var(--r-xl) var(--r-xl) 0 0',
        maxHeight: '90vh',
        display: 'flex', flexDirection: 'column',
        animation: 'anim-slide-up 0.22s cubic-bezier(0.32,0.72,0,1)',
        boxShadow: '0 -4px 32px rgba(0,0,0,0.15)',
      }}>
        {/* Sheet header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: 'var(--pad-l)',
          borderBottom: '1px solid var(--border-l)',
          flexShrink: 0,
        }}>
          <div style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--black)' }}>
            {title}
          </div>
          <div style={{ display: 'flex', gap: 'var(--gap-s)' }}>
            <button type="button" onClick={onClose} style={{
              width: '2.25rem', height: '2.25rem', borderRadius: 'var(--r-l)',
              border: '1px solid var(--border-l)', background: 'var(--surface-raised)',
              color: 'var(--black)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}>
              <X size={16} />
            </button>
            <button type="button" onClick={handleSave} style={{
              height: '2.25rem', padding: '0 1rem', borderRadius: 'var(--r-l)',
              border: '1px solid var(--navy)', background: 'var(--navy)',
              color: '#fff', fontSize: 'var(--text-sm)', fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer',
            }}>
              <CheckCircle size={14} /> Save
            </button>
          </div>
        </div>

        {/* Scrollable fields */}
        <div style={{
          flex: 1, overflowY: 'auto',
          padding: 'var(--pad-l)',
          display: 'flex', flexDirection: 'column', gap: '1.25rem',
          paddingBottom: 'calc(var(--pad-l) + env(safe-area-inset-bottom))',
        }}>
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
        <div style={{
          border: '1px solid var(--border-l)',
          borderRadius: 'var(--r-l)',
          overflow: 'hidden',
          marginBottom: 'var(--mar-m)',
        }}>
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
          padding: 'var(--pad-xl)',
          textAlign: 'center',
          border: '1px dashed var(--border-l)',
          borderRadius: 'var(--r-l)',
          marginBottom: 'var(--mar-m)',
          color: 'var(--text-3)',
          fontSize: 'var(--text-sm)',
        }}>
          No entries yet — tap Add Entry to begin
        </div>
      )}

      {/* Add Entry button */}
      <button type="button" onClick={openAdd} style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        padding: 'var(--pad-s) var(--pad-l)',
        borderRadius: 'var(--r-m)',
        border: '1px solid var(--navy)',
        background: 'transparent',
        color: 'var(--navy)',
        fontSize: 'var(--text-sm)', fontWeight: 700,
        cursor: 'pointer',
        transition: 'all var(--ease-fast)',
      }}>
        <Plus size={15} /> Add Entry
      </button>

      {/* Error message */}
      {error && (
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--red)', marginTop: 'var(--mar-xs)' }}>
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
