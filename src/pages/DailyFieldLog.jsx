import { useState, useRef } from 'react'
import {
  Clock, CheckCircle, FileText, Plus, MapPin, Camera,
  X, User, Truck, Pencil, Warning, ClipboardText,
  HardHat, CaretDown, ArrowRight, Signature,
} from '@phosphor-icons/react'
import BranchTabs from '../components/BranchTabs'
import { MOCK_REPORTS } from '../data/mockData.js'
import { BRANCH_COLORS } from '../config/branches.js'

// ─── Config ────────────────────────────────────────────────────────────────────
const WORK_TYPES = ['Inspection', 'Installation', 'Remediation', 'Site Revisit', 'Other']

const STATUS_STYLE = {
  Draft:     { bg: '#F3F4F6', color: '#374151' },
  Submitted: { bg: '#EFF6FF', color: '#1D4ED8' },
  Reviewed:  { bg: '#F0FDF4', color: '#16A34A' },
}

const EMPTY_ENTRY = {
  customer_site: '',
  report_date: new Date().toISOString().slice(0, 10),
  gps_location: '',
  crew_on_site: [],
  crew_input: '',
  hours_worked: '',
  work_types: [],
  work_other: '',
  jsa_uploaded: false,
  manlift_checklist: false,
  fall_protection: false,
  miles_driven: '',
  drive_time: '',
  other_tasks: '',
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(d) {
  if (!d) return ''
  const [y, m, day] = d.split('-')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${months[parseInt(m,10)-1]} ${parseInt(day,10)}, ${y}`
}

function SafetyDot({ ok, label }) {
  return (
    <span
      className="dfl-safety-dot"
      style={{ background: ok ? '#22C55E' : '#E5E7EB', color: ok ? '#fff' : '#9CA3AF' }}
      title={label}
    >
      {ok ? <CheckCircle size={9} weight="fill" /> : <Warning size={9} weight="fill" />}
    </span>
  )
}

// ─── Entry Card ────────────────────────────────────────────────────────────────
function EntryCard({ entry, bc }) {
  const [expanded, setExpanded] = useState(false)
  const ss = STATUS_STYLE[entry.status] || STATUS_STYLE.Draft

  return (
    <div className="dfl-card">
      {/* Card header — always visible */}
      <div className="dfl-card-head" onClick={() => setExpanded(e => !e)}>
        <div className="dfl-card-head-left">
          <div className="dfl-card-icon" style={{ background: bc.bgInactive, color: bc.bgActive }}>
            <FileText size={15} weight="bold" />
          </div>
          <div>
            <div className="dfl-card-title">{entry.customer_site}</div>
            <div className="dfl-card-sub">
              {fmtDate(entry.report_date)}
              <span className="dfl-dot">·</span>
              {entry.submitted_by}
            </div>
          </div>
        </div>
        <div className="dfl-card-head-right">
          <div className="dfl-card-hours">{entry.hours_worked}h</div>
          <span className="dfl-status-pill" style={{ background: ss.bg, color: ss.color }}>
            {entry.status}
          </span>
          <CaretDown
            size={14}
            style={{
              color: 'var(--text-3)',
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.18s',
              flexShrink: 0,
            }}
          />
        </div>
      </div>

      {/* Work type chips — always visible */}
      <div className="dfl-card-chips">
        {(entry.work_types || []).map(t => (
          <span key={t} className="dfl-work-chip">{t}</span>
        ))}
        {/* Safety indicators */}
        <div className="dfl-safety-row">
          <SafetyDot ok={entry.jsa_uploaded}     label="JSA" />
          <SafetyDot ok={entry.manlift_checklist} label="Man Lift" />
          <SafetyDot ok={entry.fall_protection}   label="Fall Protection" />
          <span className="dfl-safety-label">Safety docs</span>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="dfl-card-detail">
          <div className="dfl-detail-grid">

            {/* Crew */}
            <div className="dfl-detail-item">
              <span className="dfl-detail-label"><User size={11} /> Crew on Site</span>
              <span className="dfl-detail-value">
                {(entry.crew_on_site || []).join(', ') || '—'}
              </span>
            </div>

            {/* GPS */}
            <div className="dfl-detail-item">
              <span className="dfl-detail-label"><MapPin size={11} /> Site Location</span>
              <span className="dfl-detail-value dfl-gps">{entry.gps_location || '—'}</span>
            </div>

            {/* Travel */}
            <div className="dfl-detail-item">
              <span className="dfl-detail-label"><Truck size={11} /> Travel</span>
              <span className="dfl-detail-value">
                {entry.miles_driven ? `${entry.miles_driven} mi` : '—'}
                {entry.drive_time ? ` · ${entry.drive_time}` : ''}
              </span>
            </div>

            {/* Safety docs */}
            <div className="dfl-detail-item dfl-detail-full">
              <span className="dfl-detail-label"><HardHat size={11} /> Safety Docs</span>
              <div className="dfl-safety-badges">
                <span className={`dfl-safety-badge ${entry.jsa_uploaded ? 'ok' : 'missing'}`}>
                  {entry.jsa_uploaded ? '✓' : '✗'} JSA
                </span>
                <span className={`dfl-safety-badge ${entry.manlift_checklist ? 'ok' : 'missing'}`}>
                  {entry.manlift_checklist ? '✓' : '✗'} Man Lift
                </span>
                <span className={`dfl-safety-badge ${entry.fall_protection ? 'ok' : 'missing'}`}>
                  {entry.fall_protection ? '✓' : '✗'} Fall Protection
                </span>
              </div>
            </div>

            {/* Notes */}
            {entry.other_tasks && (
              <div className="dfl-detail-item dfl-detail-full">
                <span className="dfl-detail-label"><ClipboardText size={11} /> Notes</span>
                <span className="dfl-detail-value">{entry.other_tasks}</span>
              </div>
            )}

          </div>

          {/* Sign-off status */}
          <div className="dfl-signoff-row">
            {entry.signed ? (
              <div className="dfl-signed-badge">
                <CheckCircle size={12} weight="fill" />
                Signed off — {entry.supervisor_name}
              </div>
            ) : (
              <div className="dfl-unsigned-badge">
                <Warning size={12} weight="fill" />
                Awaiting supervisor sign-off
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── New Entry Form ─────────────────────────────────────────────────────────────
function EntryForm({ onClose, onSave, branch, bc }) {
  const [form, setForm] = useState({ ...EMPTY_ENTRY })
  const [section, setSection] = useState(0)

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const toggleWorkType = (t) => {
    set('work_types', form.work_types.includes(t)
      ? form.work_types.filter(x => x !== t)
      : [...form.work_types, t]
    )
  }

  const addCrew = () => {
    const name = form.crew_input.trim()
    if (name && !form.crew_on_site.includes(name)) {
      set('crew_on_site', [...form.crew_on_site, name])
    }
    set('crew_input', '')
  }

  const removeCrew = (name) => set('crew_on_site', form.crew_on_site.filter(n => n !== name))

  const SECTIONS = [
    { label: 'Job Info',   icon: <FileText size={13} /> },
    { label: 'Daily Info', icon: <ClipboardText size={13} /> },
    { label: 'Safety',     icon: <HardHat size={13} /> },
    { label: 'Travel',     icon: <Truck size={13} /> },
    { label: 'Sign Off',   icon: <Signature size={13} /> },
  ]

  return (
    <div className="dfl-form-overlay" onClick={onClose}>
      <div className="dfl-form-panel" onClick={e => e.stopPropagation()}>

        {/* Panel header */}
        <div className="dfl-form-header" style={{ background: bc.bgActive }}>
          <div>
            <div style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.125rem' }}>
              New Entry
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>Daily Field Log</div>
          </div>
          <button className="dfl-form-close" onClick={onClose}><X size={16} /></button>
        </div>

        {/* Step tabs */}
        <div className="dfl-form-steps">
          {SECTIONS.map((s, i) => (
            <button
              key={i}
              className={`dfl-form-step ${section === i ? 'active' : ''} ${i < section ? 'done' : ''}`}
              onClick={() => setSection(i)}
            >
              {i < section ? <CheckCircle size={11} weight="fill" /> : s.icon}
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        {/* Section content */}
        <div className="dfl-form-body">

          {/* ── Section 0: Job Info ── */}
          {section === 0 && (
            <div className="dfl-form-section">
              <div className="dfl-field">
                <label className="dfl-label">Customer & Site <span className="dfl-req">*</span></label>
                <input
                  className="dfl-input"
                  placeholder="e.g. Ritz-Carlton — Rooftop Level"
                  value={form.customer_site}
                  onChange={e => set('customer_site', e.target.value)}
                />
              </div>
              <div className="dfl-field">
                <label className="dfl-label">Date <span className="dfl-req">*</span></label>
                <input
                  className="dfl-input"
                  type="date"
                  value={form.report_date}
                  onChange={e => set('report_date', e.target.value)}
                />
              </div>
              <div className="dfl-field">
                <label className="dfl-label">
                  <MapPin size={12} style={{ marginRight: '0.25rem' }} />
                  Site Location
                  <span className="dfl-gps-auto">Auto-detected</span>
                </label>
                <input
                  className="dfl-input dfl-input-mono"
                  placeholder="30.6423, -81.4467"
                  value={form.gps_location}
                  onChange={e => set('gps_location', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* ── Section 1: Daily Info ── */}
          {section === 1 && (
            <div className="dfl-form-section">
              <div className="dfl-field">
                <label className="dfl-label">Who Was On Site? <span className="dfl-req">*</span></label>
                <div className="dfl-crew-tags">
                  {form.crew_on_site.map(n => (
                    <span key={n} className="dfl-crew-tag">
                      {n}
                      <button onClick={() => removeCrew(n)}><X size={10} /></button>
                    </span>
                  ))}
                </div>
                <div className="dfl-crew-input-row">
                  <input
                    className="dfl-input"
                    placeholder="Type name and press Add"
                    value={form.crew_input}
                    onChange={e => set('crew_input', e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCrew() } }}
                  />
                  <button className="dfl-add-btn" onClick={addCrew}>Add</button>
                </div>
              </div>

              <div className="dfl-field">
                <label className="dfl-label">Hours Worked Today <span className="dfl-req">*</span></label>
                <input
                  className="dfl-input"
                  type="number"
                  min="0"
                  max="24"
                  step="0.5"
                  placeholder="e.g. 8"
                  value={form.hours_worked}
                  onChange={e => set('hours_worked', e.target.value)}
                />
              </div>

              <div className="dfl-field">
                <label className="dfl-label">Type of Work Completed <span className="dfl-req">*</span></label>
                <div className="dfl-type-chips">
                  {WORK_TYPES.map(t => (
                    <button
                      key={t}
                      className={`dfl-type-chip ${form.work_types.includes(t) ? 'active' : ''}`}
                      onClick={() => toggleWorkType(t)}
                    >
                      {form.work_types.includes(t) && <CheckCircle size={11} weight="fill" />}
                      {t}
                    </button>
                  ))}
                </div>
                {form.work_types.includes('Other') && (
                  <input
                    className="dfl-input"
                    style={{ marginTop: '0.5rem' }}
                    placeholder="Describe other work..."
                    value={form.work_other}
                    onChange={e => set('work_other', e.target.value)}
                  />
                )}
              </div>
            </div>
          )}

          {/* ── Section 2: Safety Docs ── */}
          {section === 2 && (
            <div className="dfl-form-section">
              <p className="dfl-section-note">
                Upload photos of required safety documentation for this job site.
              </p>
              {[
                { key: 'jsa_uploaded',     label: 'JSA For Job',               note: 'Job Safety Analysis form' },
                { key: 'manlift_checklist', label: 'Man Lift Checklist',        note: 'Pre-use equipment checklist' },
                { key: 'fall_protection',  label: 'Fall Protection Checklist',  note: 'PPE and anchor point verification' },
              ].map(({ key, label, note }) => (
                <div key={key} className="dfl-photo-field">
                  <div className="dfl-photo-info">
                    <div className="dfl-photo-label">{label} <span className="dfl-req">*</span></div>
                    <div className="dfl-photo-note">{note}</div>
                  </div>
                  <label className={`dfl-photo-btn ${form[key] ? 'uploaded' : ''}`}>
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={() => set(key, true)}
                    />
                    {form[key]
                      ? <><CheckCircle size={14} weight="fill" /> Uploaded</>
                      : <><Camera size={14} /> Add Photo</>
                    }
                  </label>
                </div>
              ))}
            </div>
          )}

          {/* ── Section 3: Travel ── */}
          {section === 3 && (
            <div className="dfl-form-section">
              <div className="dfl-field">
                <label className="dfl-label"><Truck size={12} style={{ marginRight: '0.25rem' }} />Miles Driven <span className="dfl-req">*</span></label>
                <input
                  className="dfl-input"
                  type="number"
                  min="0"
                  placeholder="e.g. 42"
                  value={form.miles_driven}
                  onChange={e => set('miles_driven', e.target.value)}
                />
              </div>
              <div className="dfl-field">
                <label className="dfl-label">Total Drive Time</label>
                <input
                  className="dfl-input"
                  placeholder="e.g. 1h 15min"
                  value={form.drive_time}
                  onChange={e => set('drive_time', e.target.value)}
                />
              </div>
              <div className="dfl-field">
                <label className="dfl-label">Other Tasks / Projects</label>
                <textarea
                  className="dfl-input dfl-textarea"
                  placeholder="Note anything else completed today — additional tasks, issues observed, follow-up needed..."
                  value={form.other_tasks}
                  onChange={e => set('other_tasks', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* ── Section 4: Sign Off ── */}
          {section === 4 && (
            <div className="dfl-form-section">
              <div className="dfl-field">
                <label className="dfl-label">Timesheet Date</label>
                <input
                  className="dfl-input"
                  type="date"
                  value={form.report_date}
                  readOnly
                  style={{ background: 'var(--border-l)', color: 'var(--text-2)' }}
                />
              </div>
              <div className="dfl-field">
                <label className="dfl-label">Supervisor Name <span className="dfl-req">*</span></label>
                <input
                  className="dfl-input"
                  placeholder="Enter supervisor name"
                  value={form.supervisor_name || ''}
                  onChange={e => set('supervisor_name', e.target.value)}
                />
              </div>
              <div className="dfl-field">
                <label className="dfl-label">
                  <Pencil size={12} style={{ marginRight: '0.25rem' }} />
                  Supervisor Signature <span className="dfl-req">*</span>
                </label>
                <SignaturePad
                  signed={form.signed}
                  onSign={() => set('signed', true)}
                  onClear={() => set('signed', false)}
                />
              </div>
            </div>
          )}

        </div>

        {/* Footer navigation */}
        <div className="dfl-form-footer">
          <button
            className="dfl-btn-secondary"
            onClick={() => section > 0 ? setSection(s => s - 1) : onClose()}
          >
            {section === 0 ? 'Cancel' : 'Back'}
          </button>
          {section < SECTIONS.length - 1 ? (
            <button
              className="dfl-btn-primary"
              style={{ background: bc.bgActive }}
              onClick={() => setSection(s => s + 1)}
            >
              Next <ArrowRight size={13} />
            </button>
          ) : (
            <button
              className="dfl-btn-primary"
              style={{ background: bc.bgActive }}
              onClick={() => onSave(form)}
            >
              <CheckCircle size={14} weight="fill" /> Submit Entry
            </button>
          )}
        </div>

      </div>
    </div>
  )
}

// ─── Signature Pad ─────────────────────────────────────────────────────────────
function SignaturePad({ signed, onSign, onClear }) {
  const canvasRef = useRef(null)
  const drawing   = useRef(false)

  const getPos = (e, canvas) => {
    const r = canvas.getBoundingClientRect()
    const src = e.touches ? e.touches[0] : e
    return { x: src.clientX - r.left, y: src.clientY - r.top }
  }

  const startDraw = (e) => {
    drawing.current = true
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const { x, y } = getPos(e, canvas)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e) => {
    if (!drawing.current) return
    e.preventDefault()
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#000'
    const { x, y } = getPos(e, canvas)
    ctx.lineTo(x, y)
    ctx.stroke()
    onSign()
  }

  const stopDraw = () => { drawing.current = false }

  const clear = () => {
    const canvas = canvasRef.current
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
    onClear()
  }

  return (
    <div className="dfl-sig-wrap">
      <canvas
        ref={canvasRef}
        className="dfl-sig-canvas"
        width={480}
        height={120}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={stopDraw}
        onMouseLeave={stopDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={stopDraw}
      />
      <div className="dfl-sig-actions">
        <span className="dfl-sig-hint">Sign above with mouse or finger</span>
        {signed && (
          <button className="dfl-sig-clear" onClick={clear}>Clear</button>
        )}
      </div>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function DailyFieldLog() {
  const [branch, setBranch]   = useState('lm')
  const [showForm, setShowForm] = useState(false)
  const [entries, setEntries]  = useState(MOCK_REPORTS)

  const bc = BRANCH_COLORS[branch] || BRANCH_COLORS.lm

  const lmCount         = entries.filter(r => r.branch === 'lm').length
  const boltCount       = entries.filter(r => r.branch === 'bolt').length
  const boltDallasCount = entries.filter(r => r.branch === 'bolt-dallas').length

  const reports = entries
    .filter(r => r.branch === branch)
    .sort((a, b) => b.report_date.localeCompare(a.report_date))

  const totalHours   = reports.reduce((s, r) => s + Number(r.hours_worked || 0), 0)
  const reviewedCount = reports.filter(r => r.status === 'Reviewed').length
  const unsignedCount = reports.filter(r => !r.signed).length

  const handleSave = (form) => {
    const newEntry = {
      ...form,
      id: `r-${Date.now()}`,
      branch,
      submitted_by: form.crew_on_site[0] || 'Field Tech',
      status: form.signed ? 'Submitted' : 'Draft',
      projects: { name: form.customer_site },
    }
    setEntries(e => [newEntry, ...e])
    setShowForm(false)
  }

  return (
    <div className="page-content fade-in">

      <BranchTabs
        active={branch}
        onChange={setBranch}
        lmCount={lmCount}
        boltCount={boltCount}
        boltDallasCount={boltDallasCount}
      />

      {/* Summary strip */}
      <div className="dfl-summary-strip">
        {[
          { label: 'Total Entries', value: reports.length,      icon: <FileText size={15} weight="bold" /> },
          { label: 'Hours Logged',  value: `${totalHours}h`,    icon: <Clock size={15} weight="bold" />    },
          { label: 'Reviewed',      value: reviewedCount,        icon: <CheckCircle size={15} weight="bold" /> },
          { label: 'Awaiting Sign-Off', value: unsignedCount,   icon: <Pencil size={15} weight="bold" />,  alert: unsignedCount > 0 },
        ].map(s => (
          <div key={s.label} className="dfl-summary-card" style={s.alert && unsignedCount > 0 ? { borderColor: '#FCA5A5' } : {}}>
            <div className="dfl-summary-icon" style={{ color: s.alert && unsignedCount > 0 ? '#EF4444' : bc.bgActive }}>
              {s.icon}
            </div>
            <div>
              <div className="dfl-summary-value" style={{ color: s.alert && unsignedCount > 0 ? '#EF4444' : 'var(--text-1)' }}>
                {s.value}
              </div>
              <div className="dfl-summary-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Entries list */}
      <div className="dash-card">
        <div className="dash-card-head" style={{ background: bc.bgActive, color: bc.textActive, transition: 'background 0.2s ease' }}>
          <span className="dash-card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <Clock size={14} />
            Field Log Entries
          </span>
          <button
            className="dfl-new-entry-btn"
            onClick={() => setShowForm(true)}
          >
            <Plus size={13} weight="bold" />
            New Entry
          </button>
        </div>

        <div>
          {reports.length === 0 ? (
            <div className="dfl-empty-state">
              <FileText size={28} weight="thin" style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
              <div>No log entries for this branch</div>
              <button
                className="dfl-empty-cta"
                style={{ color: bc.bgActive }}
                onClick={() => setShowForm(true)}
              >
                Create first entry
              </button>
            </div>
          ) : (
            <div className="dfl-entries-list">
              {reports.map(r => (
                <EntryCard key={r.id} entry={r} bc={bc} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* New entry form */}
      {showForm && (
        <EntryForm
          onClose={() => setShowForm(false)}
          onSave={handleSave}
          branch={branch}
          bc={bc}
        />
      )}

    </div>
  )
}
