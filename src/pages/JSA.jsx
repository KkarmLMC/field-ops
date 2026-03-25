import { useState } from 'react'
import {
  Plus, CheckCircle, X, CaretDown, Warning,
  HardHat, Buildings, CalendarBlank, User,
  ArrowLeft, ClipboardText,
} from '@phosphor-icons/react'
import { FORM_TEMPLATES, JOBS, TECHNICIANS } from '../data/mockData.js'
import BranchTabs from '../components/BranchTabs'
import { BRANCH_COLORS } from '../config/branches.js'

const TEMPLATE = FORM_TEMPLATES['jsa']

// ─── Mock saved JSAs ───────────────────────────────────────────────────────────
const MOCK_JSAS = [
  {
    id: 'jsa-001', branch: 'bolt', siteName: 'Ritz-Carlton Amelia Island',
    date: '2026-03-24', tech: 'Ray Thibodaux', status: 'signed',
    permits: ['Working over Water or at Height', 'Lifts'],
  },
  {
    id: 'jsa-002', branch: 'bolt', siteName: 'Nassau County Courthouse',
    date: '2026-03-24', tech: 'Tamika Russell', status: 'draft',
    permits: ['Working in Unguarded / Unprotected Areas'],
  },
  {
    id: 'jsa-003', branch: 'lm', siteName: 'Rayonier Advanced Materials',
    date: '2026-03-20', tech: 'Priya Nair', status: 'signed',
    permits: ['Working on Pressurized Equipment', 'Hot Work'],
  },
]

// ─── Field renderer ────────────────────────────────────────────────────────────
function FieldRenderer({ field, value, onChange }) {
  if (field.type === 'checkbox-group') {
    const selected = value || []
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {field.options.map(opt => {
          const checked = selected.includes(opt)
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(
                checked ? selected.filter(s => s !== opt) : [...selected, opt]
              )}
              style={{
                padding: '5px 10px', borderRadius: 4, fontSize: 12,
                border: `1px solid ${checked ? 'var(--accent)' : 'var(--border)'}`,
                background: checked ? 'var(--accent-glow)' : 'var(--bg-3)',
                color: checked ? 'var(--accent)' : 'var(--text-dim)',
                fontWeight: checked ? 600 : 400,
                transition: 'all 0.12s',
              }}
            >
              {opt}
            </button>
          )
        })}
      </div>
    )
  }

  if (field.type === 'activity-row') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
        {['Activity / Task', 'Potential Hazard', 'Risk Control Measure'].map((ph, i) => (
          <input
            key={i}
            type="text"
            placeholder={ph}
            value={(value || {})[i] || ''}
            onChange={e => onChange({ ...(value || {}), [i]: e.target.value })}
            style={{ width: '100%', fontSize: 12 }}
          />
        ))}
      </div>
    )
  }

  if (field.type === 'personnel-sig') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        <input
          type="text"
          placeholder="Full name"
          value={(value || {}).name || ''}
          onChange={e => onChange({ ...(value || {}), name: e.target.value })}
          style={{ width: '100%', fontSize: 12 }}
        />
        <input
          type="text"
          placeholder="Signature / initials"
          value={(value || {}).sig || ''}
          onChange={e => onChange({ ...(value || {}), sig: e.target.value })}
          style={{ width: '100%', fontSize: 12 }}
        />
      </div>
    )
  }

  if (field.type === 'date') {
    return (
      <input
        type="date"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        style={{ width: '100%' }}
      />
    )
  }

  return (
    <input
      type="text"
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      placeholder={field.label}
      style={{ width: '100%' }}
    />
  )
}

// ─── New JSA Form ──────────────────────────────────────────────────────────────
function NewJSAForm({ onSave, onCancel, branch }) {
  const [values, setValues] = useState({
    jsa_date: new Date().toISOString().slice(0, 10),
  })
  const [submitted, setSubmitted] = useState(false)
  const [openSections, setOpenSections] = useState(
    Object.fromEntries(TEMPLATE.sections.map(s => [s.id, true]))
  )

  const set = (fieldId, val) => setValues(f => ({ ...f, [fieldId]: val }))
  const toggleSection = (id) => setOpenSections(s => ({ ...s, [id]: !s[id] }))

  const handleSubmit = () => {
    onSave({
      id: `jsa-${Date.now()}`,
      branch,
      siteName: values.site_name || 'Unnamed Site',
      date: values.jsa_date || new Date().toISOString().slice(0, 10),
      tech: values.person_1?.name || '—',
      status: 'signed',
      permits: values.permit_required || [],
    })
  }

  if (submitted) {
    return (
      <div className="page-content fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px' }}>
        <CheckCircle size={48} style={{ color: 'var(--green)', marginBottom: 12 }} />
        <div style={{ fontFamily: 'var(--head)', fontSize: 20, fontWeight: 700, marginBottom: 6 }}>JSA Submitted</div>
        <div style={{ color: 'var(--text-dim)', fontSize: 13, marginBottom: 20, textAlign: 'center' }}>
          Job Safety Analysis for {values.site_name || 'this site'} has been saved.
        </div>
        <button
          onClick={onCancel}
          style={{
            padding: '10px 20px', borderRadius: 5,
            background: 'var(--accent)', color: '#000',
            fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600,
            letterSpacing: '0.06em', textTransform: 'uppercase',
          }}
        >
          Back to JSA List
        </button>
      </div>
    )
  }

  return (
    <div className="page-content fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <button onClick={onCancel} style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-dim)', fontSize: 13 }}>
          <ArrowLeft size={14} /> Back
        </button>
        <div style={{ width: 1, height: 16, background: 'var(--border)' }} />
        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          LMC-Form-000-008
        </span>
      </div>

      {TEMPLATE.sections.map(section => (
        <div key={section.id} style={{
          background: 'var(--bg-2)', border: '1px solid var(--border)',
          borderRadius: 6, marginBottom: 10, overflow: 'hidden',
        }}>
          {/* Section header */}
          <button
            type="button"
            onClick={() => toggleSection(section.id)}
            style={{
              width: '100%', padding: '10px 14px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              borderBottom: openSections[section.id] ? '1px solid var(--border)' : 'none',
              background: 'none',
            }}
          >
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {section.title}
            </span>
            <CaretDown
              size={12}
              style={{
                color: 'var(--text-dim)',
                transform: openSections[section.id] ? 'rotate(180deg)' : 'rotate(0)',
                transition: 'transform 0.15s',
              }}
            />
          </button>

          {openSections[section.id] && (
            <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {section.fields.map(field => (
                <div key={field.id}>
                  <div style={{
                    fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-dim)',
                    textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6,
                  }}>
                    {field.label}
                    {field.required && <span style={{ color: 'var(--red)', marginLeft: 3 }}>*</span>}
                  </div>
                  <FieldRenderer
                    field={field}
                    value={values[field.id]}
                    onChange={val => set(field.id, val)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Submit */}
      <button
        onClick={() => { setSubmitted(true); handleSubmit() }}
        style={{
          width: '100%', padding: '12px', borderRadius: 5, marginBottom: 16,
          background: 'var(--accent)', color: '#000',
          fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 600,
          letterSpacing: '0.06em', textTransform: 'uppercase',
          border: '1px solid var(--accent)',
        }}
      >
        <CheckCircle size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
        Sign & Submit JSA
      </button>
    </div>
  )
}

// ─── JSA Row ───────────────────────────────────────────────────────────────────
function JSARow({ jsa }) {
  const signed = jsa.status === 'signed'
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 14px', borderBottom: '1px solid var(--border)',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 4, flexShrink: 0,
        background: signed ? 'var(--green-dim)' : 'var(--bg-4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {signed
          ? <CheckCircle size={16} style={{ color: 'var(--green)' }} />
          : <ClipboardText size={16} style={{ color: 'var(--text-dim)' }} />
        }
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {jsa.siteName}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
          {jsa.permits.slice(0, 2).join(' · ')}{jsa.permits.length > 2 ? ` +${jsa.permits.length - 2}` : ''}
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <span style={{
          display: 'inline-block', padding: '2px 8px', borderRadius: 3,
          fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: '0.05em',
          background: signed ? 'var(--green-dim)' : 'var(--bg-4)',
          color: signed ? 'var(--green)' : 'var(--text-dim)',
        }}>
          {signed ? 'Signed' : 'Draft'}
        </span>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, fontFamily: 'var(--mono)' }}>
          {jsa.date} · {jsa.tech}
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function JSA() {
  const [view, setView] = useState('list')
  const [branch, setBranch] = useState('lm')
  const [jsas, setJsas] = useState(MOCK_JSAS)

  const handleSave = (newJsa) => {
    setJsas(prev => [newJsa, ...prev])
    setView('list')
  }

  if (view === 'new') {
    return <NewJSAForm onSave={handleSave} onCancel={() => setView('list')} branch={branch} />
  }

  const bc = BRANCH_COLORS[branch]
  const branchJsas = jsas.filter(j => j.branch === branch)
  const signed = branchJsas.filter(j => j.status === 'signed').length
  const draft  = branchJsas.filter(j => j.status === 'draft').length

  return (
    <div className="page-content fade-in">

      <BranchTabs active={branch} onChange={setBranch} />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
        {[
          { label: 'Total JSAs',  val: branchJsas.length, color: 'var(--text)'  },
          { label: 'Signed',      val: signed,             color: 'var(--green)' },
          { label: 'Draft',       val: draft,              color: 'var(--accent)'},
        ].map(({ label, val, color }) => (
          <div key={label} style={{
            background: 'var(--bg-2)', border: '1px solid var(--border)',
            borderRadius: 6, padding: '10px 12px',
          }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{label}</div>
            <div style={{ fontFamily: 'var(--head)', fontSize: 24, fontWeight: 700, color }}>{val}</div>
          </div>
        ))}
      </div>

      {/* List */}
      <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 6 }}>
        <div style={{
          padding: '10px 14px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: bc.bgActive, transition: 'background 0.2s',
        }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: bc.textActive, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Job Safety Analyses
          </span>
          <button
            onClick={() => setView('new')}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 10px', borderRadius: 4,
              background: 'var(--accent)', color: '#000',
              fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 600,
              letterSpacing: '0.06em', textTransform: 'uppercase',
            }}
          >
            <Plus size={11} /> New JSA
          </button>
        </div>

        {branchJsas.length === 0 ? (
          <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>
            No JSAs for this branch yet
          </div>
        ) : (
          branchJsas.map(j => <JSARow key={j.id} jsa={j} />)
        )}
      </div>

      {/* Form ref note */}
      <div style={{
        marginTop: 10, padding: '10px 14px',
        background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 6,
        fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6,
      }}>
        <span style={{ fontFamily: 'var(--mono)', color: 'var(--text-dim)' }}>LMC-Form-000-008 · </span>
        Job Safety Analysis — Hazard identification, controls & emergency procedures. Required before any field work begins.
      </div>

    </div>
  )
}
