import { useState, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import {
  Clock, CheckCircle, FileText, Plus, MapPin,
  X, User, Users, Truck, Pencil, Warning, ClipboardText,
  HardHat, CaretDown, ArrowRight, Signature,
  ArrowsClockwise, SealCheck, MagnifyingGlass, Buildings,
  Crosshair, SpinnerGap, BookOpen } from '@phosphor-icons/react'
import BranchTabs from '../components/BranchTabs'
import SectionDivider from '../components/SectionDivider'
import FormEngine from '../components/FormEngine.jsx'
import { PROJECTS, TECHNICIANS } from '../data/mockData.js'
import { BRANCH_COLORS } from '../config/branches.js'
import { db } from '../lib/supabase.js'
import { useAuth } from '../lib/useAuth.jsx'
import { logActivity } from '../lib/logActivity.js'
import { generateAndUploadDFLPdf } from '../lib/generateDFLPdf.js'

// ─── Config ────────────────────────────────────────────────────────────────────
const WORK_TYPES = ['Inspection', 'Installation', 'Remediation', 'Site Revisit', 'Other']

// Safety docs are digital forms linked from the form repository
const SAFETY_FORMS = [
  {
    key:   'jsa_uploaded',
    slug:  'jsa',
    label: 'JSA — Job Safety Analysis',
    desc:  'Hazard identification, controls & emergency procedures' },
  {
    key:   'manlift_checklist',
    slug:  'manlift-checklist',
    label: 'Man Lift Pre-Use Checklist',
    desc:  'Equipment inspection before operation — required per OSHA 1926.453' },
  {
    key:   'fall_protection',
    slug:  'fall-protection',
    label: 'Fall Protection Plan',
    desc:  'PPE verification, anchor points & rescue procedures' },
]

const STATUS_STYLE = {
  Draft:     { bg: 'var(--warning-tint-80)', color: 'var(--warning-text)' },
  Submitted: { bg: 'var(--state-info-soft)', color: 'var(--state-info)' },
  Reviewed:  { bg: 'var(--state-success-soft)', color: 'var(--state-success-text)' } }

// Stage labels for jobsite dropdown
const JOB_STATUS_STYLE = {
  'in-progress':    { label: 'Active',         bg: 'var(--warning-tint-80)', color: 'var(--warning-text)' },
  'scheduled':      { label: 'Scheduled',      bg: 'var(--purple-tint-60)', color: 'var(--purple-shade-20)' },
  'pending-review': { label: 'Pending Review', bg: 'var(--blue-tint-80)', color: 'var(--blue-shade-40)' },
  'postponed':      { label: 'Postponed',      bg: 'var(--state-warning-soft)', color: 'var(--state-warning-text)' },
  'complete':       { label: 'Completed',      bg: 'var(--state-success-soft)', color: 'var(--state-success-text)' },
  'failed':         { label: 'Failed',         bg: 'var(--state-error-soft)', color: 'var(--state-error-text)' },
}

// Derive unique customer names from all PROJECTS (alphabetical)
const ALL_CUSTOMERS = [...new Set(PROJECTS.map(p => p.customer))].sort()

// Helper: build H:MM option list between two quarter-hour counts (inclusive)
function buildTimeOptions(fromQ, toQ) {
  const opts = []
  for (let q = fromQ; q <= toQ; q++) {
    const h = Math.floor(q / 4)
    const m = (q % 4) * 15
    opts.push({ value: q / 4, label: `${h}:${String(m).padStart(2, '0')}` })
  }
  return opts
}

// Total Time Onsite: 1:00 – 16:00
const TIME_ONSITE_OPTIONS = buildTimeOptions(4, 64)

// Total Drive Time: 0:15 – 16:00
const DRIVE_TIME_OPTIONS = buildTimeOptions(1, 64)

// Format a stored numeric hours value for display (e.g. 6.25 → "6h 15m")
function fmtHours(val) {
  if (!val && val !== 0) return ''
  const h = Math.floor(val)
  const m = Math.round((val - h) * 60)
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

const EMPTY_P1 = {
  customer:             '',
  jobsite_id:           null,
  report_date:          new Date().toISOString().slice(0, 10),
  gps_location:         '',
  supervisor_name:      '',
  crew_on_site:         [],
  jsa_uploaded:         false,
  manlift_checklist:    false,
  fall_protection:      false,
  jsa_data:             null,
  manlift_data:         null,
  fall_protection_data: null }

const EMPTY_P2 = {
  hours_worked: '',
  work_types:   [],
  work_other:   '',
  miles_driven: '',
  drive_time:   '',
  other_tasks:  '',
  signed:       false }

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
      style={{ background: ok ? 'var(--state-success)' : 'var(--border-subtle)', color: ok ? '#fff' : 'var(--text-muted)' }}
      title={label}
    >
      {ok
        ? <CheckCircle size="0.5625rem" weight="fill" />
        : <Warning size="0.5625rem" weight="fill" />
      }
    </span>
  )
}

// ─── Shared: compute fixed dropdown position from input wrapper ref ────────────
function useDropdownPos(wrapRef) {
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 })
  const update = () => {
    if (!wrapRef.current) return
    const r = wrapRef.current.getBoundingClientRect()
    setPos({ top: r.bottom + 4, left: r.left, width: r.width })
  }
  return [pos, update]
}

// ─── Customer Typeahead ─────────────────────────────────────────────────────────
function CustomerTypeahead({ value, onChange, branch }) {
  const [open, setOpen]   = useState(false)
  const [query, setQuery] = useState(value || '')
  const ref               = useRef(null)
  const inputWrapRef      = useRef(null)
  const [pos, updatePos]  = useDropdownPos(inputWrapRef)

  // Sync query when value changes externally (e.g. auto-filled from job select)
  useEffect(() => { setQuery(value || '') }, [value])

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // All unique customers across all branches
  const allCustomers = [...new Set(PROJECTS.map(p => p.customer))].sort()

  const filtered = query.length >= 1
    ? allCustomers.filter(c => c.toLowerCase().includes(query.toLowerCase()))
    : allCustomers

  const select = (name) => {
    onChange(name)
    setQuery(name)
    setOpen(false)
  }

  const openDropdown = () => { updatePos(); setOpen(true) }

  return (
    <div className="page-content fade-in" ref={ref}>
      <div className="dfl-typeahead-input-wrap" ref={inputWrapRef}>
        <MagnifyingGlass size="0.8125rem" className="dfl-typeahead-icon" />
        <input
          className="dfl-input dfl-typeahead-input"
          placeholder="Search customers…"
          value={query}
          onChange={e => { setQuery(e.target.value); onChange(e.target.value); openDropdown() }}
          onFocus={openDropdown}
          autoComplete="off"
        />
        {query && (
          <button className="dfl-typeahead-clear" onClick={() => { setQuery(''); onChange(''); setOpen(false) }}>
            <X size="0.6875rem" />
          </button>
        )}
      </div>
      {open && filtered.length > 0 && (
        <ul className="dfl-typeahead-list" style={{ top: pos.top, left: pos.left, width: pos.width }}>
          {filtered.slice(0, 8).map(name => (
            <li
              key={name}
              className={`dfl-typeahead-item ${name === value ? 'selected' : ''}`}
              onMouseDown={() => select(name)}
            >
              <Buildings size="0.75rem" style={{ flexShrink: 0, opacity: 0.5 }} />
              {name}
              {name === value && <CheckCircle size="0.75rem" weight="fill" style={{ marginLeft: 'auto', color: 'var(--state-success-text)' }} />}
            </li>
          ))}
        </ul>
      )}
      {open && filtered.length === 0 && query.length > 0 && (
        <div className="dfl-typeahead-empty">
          No matching customers — you can type a new name
        </div>
      )}
    </div>
  )
}

// ─── Jobsite Dropdown ──────────────────────────────────────────────────────────
function JobsiteSelect({ value, branch, customer, onChange }) {
  const [open, setOpen] = useState(false)
  const ref             = useRef(null)

  const ORDER          = ['in-progress', 'scheduled', 'pending-review', 'postponed', 'complete', 'failed']
  const customerLocked = Boolean(customer && customer.trim())

  // All projects across all branches; filter by customer once one is selected
  const visibleJobs = PROJECTS
    .filter(p => !customerLocked || p.customer === customer.trim())
    .sort((a, b) => ORDER.indexOf(a.stage) - ORDER.indexOf(b.stage))

  const selected = PROJECTS.find(p => p.id === value)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Block opening if no customer chosen yet
  const handleTriggerClick = () => {
    if (!customerLocked) return
    setOpen(o => !o)
  }

  return (
    <div className="dfl-jobsite-wrap" ref={ref}>
      <button
        type="button"
        className={`dfl-jobsite-trigger ${open ? 'open' : ''} ${selected ? 'has-value' : ''} ${!customerLocked ? 'locked' : ''}`}
        onClick={handleTriggerClick}
        title={!customerLocked ? 'Select a customer first' : undefined}
      >
        {selected ? (
          <span className="dfl-jobsite-selected">
            <span
              className="dfl-jobsite-status-dot"
              style={{ background: JOB_STATUS_STYLE[selected.stage]?.color || 'var(--grey-base)' }}
            />
            <span className="dfl-jobsite-selected-name">{selected.name}</span>
            <span className="dfl-jobsite-selected-id">{selected.job_number}</span>
          </span>
        ) : customerLocked ? (
          <span className="dfl-jobsite-placeholder">
            {visibleJobs.length > 0
              ? `${visibleJobs.length} job${visibleJobs.length !== 1 ? 's' : ''} found — select one…`
              : 'No jobs on Kanban for this customer'
            }
          </span>
        ) : (
          <span className="dfl-jobsite-placeholder dfl-jobsite-placeholder--hint">
            ← Select a customer first
          </span>
        )}
        <CaretDown
          size="0.8125rem"
          className={`dfl-jobsite-caret ${open ? 'open' : ''}`}
          style={{ opacity: customerLocked ? 1 : 0.35 }}
        />
      </button>

      {open && customerLocked && (
        <div className="dfl-jobsite-dropdown">
          {visibleJobs.length === 0 ? (
            <div className="dfl-jobsite-empty">
              No jobs found for <strong>{customer}</strong> on this branch
            </div>
          ) : (
            visibleJobs.map(job => {
              const isActive = job.id === value
              return (
                <div
                  key={job.id}
                  className={`dfl-jobsite-item ${isActive ? 'selected' : ''}`}
                  onMouseDown={() => { onChange(job); setOpen(false) }}
                >
                  <MapPin size="0.8125rem" style={{ flexShrink: 0, color: 'var(--grey-base)' }} />
                  <span style={{ flex: 1 }}>{job.name}</span>
                  {isActive && <CheckCircle size="0.8125rem" weight="fill" style={{ color: 'var(--state-success-text)', flexShrink: 0 }} />}
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

// ─── Tech Typeahead (single-select) ───────────────────────────────────────────
function TechTypeahead({ value, onChange, exclude = [], placeholder = 'Search technicians…', onRemove, showRemove }) {
  const [open, setOpen]   = useState(false)
  const [query, setQuery] = useState(value || '')
  const ref               = useRef(null)
  const inputWrapRef      = useRef(null)
  const [pos, updatePos]  = useDropdownPos(inputWrapRef)

  useEffect(() => { setQuery(value || '') }, [value])

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = TECHNICIANS.filter(t =>
    !exclude.includes(t.name) &&
    t.name.toLowerCase().includes(query.toLowerCase())
  )

  const select = (tech) => { onChange(tech.name); setQuery(tech.name); setOpen(false) }
  const openDropdown = () => { updatePos(); setOpen(true) }

  const handleClear = () => {
    if (onRemove) {
      onRemove()
    } else {
      setQuery(''); onChange(''); setOpen(false)
    }
  }

  return (
    <div className="dfl-typeahead" ref={ref}>
      <div className="dfl-typeahead-input-wrap" ref={inputWrapRef}>
        <MagnifyingGlass size="0.8125rem" className="dfl-typeahead-icon" />
        <input
          className="dfl-input dfl-typeahead-input"
          placeholder={placeholder}
          value={query}
          onChange={e => { setQuery(e.target.value); onChange(e.target.value); openDropdown() }}
          onFocus={openDropdown}
          autoComplete="off"
        />
        {(query || showRemove) && (
          <button className="dfl-typeahead-clear" type="button" onClick={handleClear}>
            <X size="0.6875rem" />
          </button>
        )}
      </div>
      {open && filtered.length > 0 && (
        <ul className="dfl-typeahead-list" style={{ top: pos.top, left: pos.left, width: pos.width }}>
          {filtered.slice(0, 8).map(tech => (
            <li
              key={tech.id}
              className={`dfl-typeahead-item ${value === tech.name ? 'selected' : ''}`}
              onMouseDown={() => select(tech)}
            >
              <span className="dfl-tech-avatar-sm">{tech.name.split(' ').map(w => w[0]).join('')}</span>
              <span style={{ flex: 1 }}>{tech.name}</span>
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{tech.license}</span>
              {value === tech.name && <CheckCircle size="0.75rem" weight="fill" style={{ color: 'var(--state-success-text)', flexShrink: 0 }} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ─── Tech Multi List (stacked rows, manual + to add) ─────────────────────────
function TechMultiTypeahead({ value = [], onChange, exclude = [], placeholder = 'Search installers…' }) {
  // Internal rows: starts with one empty slot; tracks filled + any pending empty
  const [rows, setRows] = useState(value.length > 0 ? value : [''])

  const updateRow = (idx, name) => {
    const next = [...rows]
    next[idx] = name
    setRows(next)
    onChange(next.filter(Boolean))
  }

  const removeRow = (idx) => {
    const next = rows.filter((_, i) => i !== idx)
    const result = next.length > 0 ? next : ['']
    setRows(result)
    onChange(result.filter(Boolean))
  }

  const addRow = () => setRows(r => [...r, ''])

  return (
    <div className="dfl-multi-list">
      {rows.map((name, idx) => (
        <div key={idx} className="dfl-crew-row">
          <div style={{ flex: 1 }}>
            <TechTypeahead
              value={name}
              onChange={n => updateRow(idx, n)}
              exclude={[...exclude, ...rows.filter((r, i) => i !== idx && r)]}
              placeholder={idx === 0 ? placeholder : 'Search or type a name…'}
              onRemove={() => removeRow(idx)}
              showRemove={rows.length > 1 || !!name}
            />
          </div>
          {/* + on last row, invisible spacer on others — keeps all inputs the same width */}
          {idx === rows.length - 1
            ? <button type="button" className="dfl-crew-add-btn" onClick={addRow} title="Add another"><Plus size="0.875rem" /></button>
            : <div style={{ width: '1.75rem', flexShrink: 0 }} />
          }
        </div>
      ))}
    </div>
  )
}

// ─── Time Typeahead (shared) ────────────────────────────────────────────────────
// Reusable H:MM typeahead — filters provided options by prefix match.
// Typing "6" shows 6:00, 6:15, 6:30, 6:45. Typing "6:" narrows to those four.
function TimeOnsiteInput({ value, onChange, options = TIME_ONSITE_OPTIONS, placeholder = 'e.g. 6:00 or 6:30' }) {
  const [query,  setQuery]  = useState(value ? options.find(o => o.value === value)?.label ?? '' : '')
  const [open,   setOpen]   = useState(false)
  const ref          = useRef(null)
  const inputWrapRef = useRef(null)
  const [pos, updatePos] = useDropdownPos(inputWrapRef)

  useEffect(() => {
    const label = value ? (options.find(o => o.value === value)?.label ?? '') : ''
    setQuery(label)
  }, [value])

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = options.filter(o => o.label.startsWith(query.trim()))

  const select = (opt) => { onChange(opt.value); setQuery(opt.label); setOpen(false) }
  const openDropdown = () => { updatePos(); setOpen(true) }

  return (
    <div className="dfl-typeahead" ref={ref}>
      <div className="dfl-typeahead-input-wrap" ref={inputWrapRef}>
        <input
          className="dfl-input"
          style={{ paddingRight: '2rem' }}
          placeholder={placeholder}
          value={query}
          onChange={e => { setQuery(e.target.value); onChange(''); openDropdown() }}
          onFocus={openDropdown}
          autoComplete="off"
        />
        {query && (
          <button className="dfl-typeahead-clear" type="button" onClick={() => { setQuery(''); onChange(''); setOpen(false) }}>
            <X size="0.6875rem" />
          </button>
        )}
      </div>
      {open && filtered.length > 0 && (
        <ul className="dfl-typeahead-list" style={{ top: pos.top, left: pos.left, width: pos.width }}>
          {filtered.slice(0, 4).map(opt => (
            <li
              key={opt.value}
              className={`dfl-typeahead-item ${value === opt.value ? 'selected' : ''}`}
              onMouseDown={() => select(opt)}
            >
              <span style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: '0.875rem' }}>{opt.label}</span>
              {value === opt.value && <CheckCircle size="0.75rem" weight="fill" style={{ color: 'var(--state-success-text)', flexShrink: 0 }} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ─── GPS Coordinate Field ──────────────────────────────────────────────────────
function GpsCoordinateField({ value, onChange }) {
  const [status,   setStatus]   = useState('idle') // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('')
  const [accuracy, setAccuracy] = useState(null)

  const capture = () => {
    if (!navigator.geolocation) {
      setStatus('error')
      setErrorMsg('Geolocation not supported on this device')
      return
    }
    setStatus('loading')
    setErrorMsg('')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(6)
        const lng = pos.coords.longitude.toFixed(6)
        onChange(`${lat}, ${lng}`)
        setAccuracy(Math.round(pos.coords.accuracy))
        setStatus('success')
      },
      (err) => {
        setStatus('error')
        setErrorMsg(
          err.code === 1 ? 'Location access denied — enter coordinates manually' :
          err.code === 2 ? 'Position unavailable — check device GPS' :
                           'Location timed out — try again'
        )
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    )
  }

  const handleManualEdit = (v) => {
    onChange(v)
    setStatus('idle')
    setAccuracy(null)
  }

  return (
    <div className="dfl-gps-field">
      <div className="dfl-gps-input-row">
        <input
          className="dfl-input dfl-input-mono dfl-gps-coord-input"
          placeholder="e.g. 30.642380, -81.446720"
          value={value}
          onChange={e => handleManualEdit(e.target.value)}
        />
        <button
          type="button"
          className={`dfl-gps-capture-btn ${status === 'success' ? 'success' : ''}`}
          onClick={capture}
          disabled={status === 'loading'}
        >
          {status === 'loading'
            ? <SpinnerGap size="0.875rem" style={{ animation: 'spin 0.8s linear infinite' }} />
            : <Crosshair size="0.875rem" weight={status === 'success' ? 'fill' : 'bold'} />
          }
          <span>{status === 'loading' ? 'Locating…' : 'Get Location'}</span>
        </button>
      </div>

      {status === 'success' && accuracy !== null && (
        <div className="dfl-gps-feedback dfl-gps-feedback--ok">
          <CheckCircle size="0.6875rem" weight="fill" />
          GPS locked · ±{accuracy}m accuracy
        </div>
      )}
      {status === 'error' && (
        <div className="dfl-gps-feedback dfl-gps-feedback--err">
          <Warning size="0.6875rem" weight="fill" />
          {errorMsg}
        </div>
      )}
    </div>
  )
}

// ─── Entry Card ────────────────────────────────────────────────────────────────
function EntryCard({ entry, bc, onCloseOut }) {
  const [expanded, setExpanded] = useState(false)
  const ss = STATUS_STYLE[entry.status] || STATUS_STYLE.Draft
  const isDraft = entry.status === 'Draft'

  const safetyAllDone = entry.jsa_uploaded && entry.manlift_checklist && entry.fall_protection

  return (
    <div className={`dfl-card ${isDraft ? 'dfl-card--draft' : ''}`}>

      {/* Draft: Part progress bar */}
      {isDraft && (
        <div className="dfl-entry-parts">
          <span className="dfl-part-pill dfl-part-pill--done">
            <CheckCircle size="0.625rem" weight="fill" />
            Morning Check-In Complete
          </span>
          <span className="dfl-part-sep">→</span>
          <span className="dfl-part-pill dfl-part-pill--pending">
            <Clock size="0.625rem" />
            Close-Out Pending
          </span>
        </div>
      )}

      {/* Card header — always visible */}
      <div
        className="dfl-card-head"
        onClick={() => !isDraft && setExpanded(e => !e)}
        style={{ cursor: isDraft ? 'default' : 'pointer' }}
      >
        <div className="dfl-card-head-left">
          <div
            className="dfl-card-icon"
            style={{
              background: isDraft ? 'var(--warning-tint-80)' : bc.bgInactive,
              color:      isDraft ? 'var(--warning-text)' : bc.bgActive }}
          >
            {isDraft ? <Clock size="0.9375rem" weight="bold" /> : <FileText size="0.9375rem" weight="bold" />}
          </div>
          <div className="min-width-0">
            <div className="dfl-card-title">{entry.customer || entry.customer_site}</div>
            <div className="dfl-card-sub">
              {fmtDate(entry.report_date)}
              <span className="dfl-dot">·</span>
              {entry.supervisor_name || entry.submitted_by}
              {entry.jobsite_id && (
                <><span className="dfl-dot">·</span><span className="dfl-card-job-id">{entry.jobsite_id}</span></>
              )}
            </div>
          </div>
        </div>
        <div className="dfl-card-head-right">
          {!isDraft && entry.hours_worked && (
            <div className="dfl-card-hours">{fmtHours(entry.hours_worked)}</div>
          )}
          <span className="dfl-status-pill" style={{ background: ss.bg, color: ss.color }}>
            {entry.status}
          </span>
          {!isDraft && (
            <CaretDown
              size="0.875rem"
              style={{
                color: 'var(--text-primary)',
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.18s',
                flexShrink: 0 }}
            />
          )}
        </div>
      </div>

      {/* Chips row */}
      <div className="dfl-card-chips">
        {!isDraft && (entry.work_types || []).map(t => (
          <span key={t} className="dfl-work-chip">{t}</span>
        ))}
        {/* Safety indicators */}
        <div className="dfl-safety-row" style={{ marginLeft: isDraft ? 0 : 'auto' }}>
          <SafetyDot ok={entry.jsa_uploaded}     label="JSA" />
          <SafetyDot ok={entry.manlift_checklist} label="Man Lift" />
          <SafetyDot ok={entry.fall_protection}   label="Fall Protection" />
          <span className="dfl-safety-label">Safety</span>
        </div>
        {isDraft && (
          <span
            className="dfl-crew-preview"
            style={{ marginLeft: 'auto' }}
          >
            <User size="0.625rem" />
            {(entry.crew_on_site || []).length + (entry.supervisor_name ? 1 : 0)} on site
          </span>
        )}
      </div>

      {/* Draft: Close-Out CTA */}
      {isDraft && (
        <div className="dfl-closeout-row">
          <div className="dfl-closeout-hint">
            <Warning size="0.6875rem" weight="fill" style={{ color: 'var(--warning)', flexShrink: 0 }} />
            Complete end-of-day close-out to submit this log
          </div>
          <button
            className="dfl-closeout-btn"
            style={{ background: bc.bgActive }}
            onClick={() => onCloseOut(entry.id)}
          >
            Close Out Day
            <ArrowRight size="0.8125rem" />
          </button>
        </div>
      )}

      {/* Submitted: View PDF Submission */}
      {!isDraft && entry.pdf_url && (
        <div className="dfl-closeout-row">
          <div className="dfl-closeout-hint" style={{ color: 'var(--state-success-text)' }}>
            <SealCheck size="0.6875rem" weight="fill" style={{ color: 'var(--state-success-text)', flexShrink: 0 }} />
            Log finalized and stored
          </div>
          <a
            className="dfl-closeout-btn"
            style={{ background: 'var(--state-success-text)', textDecoration: 'none' }}
            href={entry.pdf_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <FileText size="0.8125rem" />
            View Submission
          </a>
        </div>
      )}

      {/* Submitted/Reviewed: Expanded detail */}
      {!isDraft && expanded && (
        <div className="dfl-card-detail">
          <div className="dfl-detail-grid">

            <div className="dfl-detail-item">
              <span className="dfl-detail-label"><User size="0.6875rem" /> Crew on Site</span>
              <span className="dfl-detail-value">
                {entry.supervisor_name
                  ? [entry.supervisor_name, ...(entry.crew_on_site || [])].join(', ')
                  : (entry.crew_on_site || []).join(', ') || '—'
                }
              </span>
            </div>

            <div className="dfl-detail-item">
              <span className="dfl-detail-label"><Crosshair size="0.6875rem" /> GPS Coordinates</span>
              <span className="dfl-detail-value dfl-gps">{entry.gps_location || '—'}</span>
            </div>

            <div className="dfl-detail-item">
              <span className="dfl-detail-label"><Truck size="0.6875rem" /> Travel</span>
              <span className="dfl-detail-value">
                {entry.miles_driven ? `${entry.miles_driven} mi` : '—'}
                {entry.drive_time ? ` · ${fmtHours(entry.drive_time)}` : ''}
              </span>
            </div>

            <div className="dfl-detail-item">
              <span className="dfl-detail-label"><HardHat size="0.6875rem" /> Safety Docs</span>
              <div className="dfl-safety-badges">
                <span className={`dfl-safety-badge ${entry.jsa_uploaded      ? 'ok' : 'missing'}`}>
                  {entry.jsa_uploaded      ? '✓' : '✗'} JSA
                </span>
                <span className={`dfl-safety-badge ${entry.manlift_checklist ? 'ok' : 'missing'}`}>
                  {entry.manlift_checklist ? '✓' : '✗'} Man Lift
                </span>
                <span className={`dfl-safety-badge ${entry.fall_protection   ? 'ok' : 'missing'}`}>
                  {entry.fall_protection   ? '✓' : '✗'} Fall Protection
                </span>
              </div>
            </div>

            {entry.other_tasks && (
              <div className="dfl-detail-item dfl-detail-full">
                <span className="dfl-detail-label"><ClipboardText size="0.6875rem" /> Notes</span>
                <span className="dfl-detail-value">{entry.other_tasks}</span>
              </div>
            )}

          </div>

          <div className="dfl-signoff-row">
            {entry.signed ? (
              <div className="dfl-signed-badge">
                <CheckCircle size="0.75rem" weight="fill" />
                Signed off — {entry.supervisor_name}
              </div>
            ) : (
              <div className="dfl-unsigned-badge">
                <Warning size="0.75rem" weight="fill" />
                Awaiting supervisor sign-off
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Inline field renderer for safety forms ────────────────────────────────────
function SafetyFieldRenderer({ field, value, onChange }) {
  switch (field.type) {
    case 'text':
    case 'number':
    case 'date':
      return (
        <div className="dfl-field">
          <label className="dfl-label">
            {field.label}
            {field.required && <span className="dfl-req">*</span>}
          </label>
          <input
            type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
            className="dfl-input"
            value={value ?? ''}
            onChange={e => onChange(e.target.value)}
          />
        </div>
      )

    case 'textarea':
      return (
        <div className="dfl-field">
          <label className="dfl-label">{field.label}</label>
          <textarea
            className="dfl-input dfl-textarea"
            value={value ?? ''}
            onChange={e => onChange(e.target.value)}
          />
        </div>
      )

    case 'pass-fail': {
      const pf = value && typeof value === 'object' ? value : { result: null, comments: '' }
      return (
        <div className="fr-pf-row">
          <span className="fr-pf-label">
            {field.label}
            {field.required && <span style={{ color: 'var(--error)', marginLeft: 2 }}>*</span>}
          </span>
          <div className="fr-pf-buttons">
            <button type="button" className={`fr-pf-btn fr-pf-pass ${pf.result === 'pass' ? 'active' : ''}`} onClick={() => onChange({ ...pf, result: pf.result === 'pass' ? null : 'pass' })}>Pass</button>
            <button type="button" className={`fr-pf-btn fr-pf-fail ${pf.result === 'fail' ? 'active' : ''}`} onClick={() => onChange({ ...pf, result: pf.result === 'fail' ? null : 'fail' })}>Fail</button>
          </div>
          <input className="fr-pf-comments" placeholder="Comments" value={pf.comments} onChange={e => onChange({ ...pf, comments: e.target.value })} />
        </div>
      )
    }

    case 'ok-notok-na': {
      const okv = value && typeof value === 'object' ? value : { result: null, explanation: '' }
      return (
        <div className="fr-ok-row">
          <span className="fr-ok-label">
            {field.label}
            {field.required && <span style={{ color: 'var(--error)', marginLeft: 2 }}>*</span>}
          </span>
          <div className="fr-ok-buttons">
            {[['ok','OK'],['notok','Not OK'],['na','N/A']].map(([k, lbl]) => (
              <button key={k} type="button" className={`fr-ok-btn fr-ok-${k} ${okv.result === k ? 'active' : ''}`} onClick={() => onChange({ ...okv, result: okv.result === k ? null : k })}>{lbl}</button>
            ))}
          </div>
          <input className="fr-ok-explanation" placeholder="Explanation" value={okv.explanation} onChange={e => onChange({ ...okv, explanation: e.target.value })} />
        </div>
      )
    }

    case 'checkbox-group': {
      const selected = Array.isArray(value) ? value : []
      const toggle = (opt) => onChange(selected.includes(opt) ? selected.filter(x => x !== opt) : [...selected, opt])
      return (
        <div className="dfl-field">
          <label className="dfl-label">
            {field.label}
            {field.required && <span className="dfl-req">*</span>}
          </label>
          <div className="fr-cg-grid">
            {(field.options || []).map(opt => (
              <label key={opt} className={`fr-cg-item ${selected.includes(opt) ? 'checked' : ''}`} onClick={() => toggle(opt)}>
                <span className="fr-cg-box">{selected.includes(opt) && <span>✓</span>}</span>
                <span className="fr-cg-text">{opt}</span>
              </label>
            ))}
          </div>
        </div>
      )
    }

    case 'activity-row': {
      const row = value && typeof value === 'object' ? value : { activity: '', hazards: '', controls: '', responsibility: '' }
      const setF = (k, v) => onChange({ ...row, [k]: v })
      return (
        <div className="fr-act-row">
          <input className="fr-act-cell" placeholder="Activity / Task" value={row.activity}      onChange={e => setF('activity',      e.target.value)} />
          <input className="fr-act-cell" placeholder="Hazards"         value={row.hazards}       onChange={e => setF('hazards',        e.target.value)} />
          <input className="fr-act-cell" placeholder="Risk Controls"   value={row.controls}      onChange={e => setF('controls',       e.target.value)} />
          <input className="fr-act-cell" placeholder="Responsibility"  value={row.responsibility} onChange={e => setF('responsibility', e.target.value)} />
        </div>
      )
    }

    case 'personnel-sig': {
      const p = value && typeof value === 'object' ? value : { name: '', function: '', signed: false }
      const setP = (k, v) => onChange({ ...p, [k]: v })
      return (
        <div className={`fr-person-row ${p.signed ? 'signed' : ''}`}>
          <div className="fr-person-fields">
            <input className="fr-person-name" placeholder="Name"             value={p.name}     onChange={e => setP('name',     e.target.value)} />
            <input className="fr-person-fn"   placeholder="Function / Role"  value={p.function} onChange={e => setP('function', e.target.value)} />
          </div>
          <button type="button" className={`fr-person-sign ${p.signed ? 'signed' : ''}`} onClick={() => setP('signed', !p.signed)}>
            {p.signed ? '✓ Signed' : 'Sign'}
          </button>
        </div>
      )
    }

    default:
      return null
  }
}

// ─── Safety Form Modal — fetches schema from Supabase, renders via FormEngine ──
function SafetyFormModal({ formKey, prefill, onComplete, onBack, bc }) {
  const slug = SAFETY_FORMS.find(f => f.key === formKey)?.slug || formKey

  const [schema,   setSchema]   = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [values,   setValues]   = useState({})

  // Pre-fill from DFL context (supervisor name, date, site)
  useEffect(() => {
    const prefilled = {}
    if (prefill?.supervisorName) prefilled.inspector_name = prefill.supervisorName
    if (prefill?.date)           { prefilled.inspection_date = prefill.date; prefilled.jsa_date = prefill.date }
    if (prefill?.customerSite)   prefilled.site_name = prefill.customerSite
    prefilled.company_name = 'Lightning Master'
    setValues(prefilled)
  }, [prefill])

  // Fetch schema from Supabase
  useEffect(() => {
    db.from('form_definitions').select('*').eq('slug', slug).eq('active', true).single()
      .then(({ data }) => {
        if (data) setSchema(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [slug])

  if (!schema && !loading) return null

  return (
    <div className="dfl-form-overlay" onClick={onBack} style={{ zIndex: 250 }}>
      <div className="dfl-form-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: '36rem' }}>

        {/* Header */}
        <div className="dfl-form-header" style={{ background: 'var(--grey-shade-40)' }}>
          <div>
            <div className="dfl-form-part-label">{schema?.ref || ''}</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>{schema?.title || ''}</div>
          </div>
          <button className="dfl-form-close" onClick={onBack}><X size="1rem" /></button>
        </div>

        {/* Body */}
        <div className="dfl-form-body" style={{ overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'var(--space-2xl)' }}>
              <div className="spinner" />
            </div>
          ) : (
            <div style={{ padding: 'var(--space-l)' }}>
              <FormEngine
                schema={schema}
                values={values}
                onChange={(id, val) => setValues(v => ({ ...v, [id]: val }))}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="dfl-form-footer">
          <button className="dfl-btn-secondary" onClick={onBack}>Back to Safety</button>
          <button
            className="dfl-btn-primary"
            style={{ background: 'var(--state-success-text)' }}
            onClick={() => onComplete(formKey, values)}
          >
            <CheckCircle size="0.875rem" weight="fill" />
            Complete Form
          </button>
        </div>

      </div>
    </div>
  )
}

// ─── Part 1 Form — Morning Check-In ────────────────────────────────────────────
function Part1Form({ onClose, onSave, bc, branch }) {
  const [form, setForm]               = useState({ ...EMPTY_P1 })
  const [step, setStep]               = useState(0)
  const [safetyOpen, setSafetyOpen]   = useState(null) // key of safety form being filled

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

const STEPS = [
    { label: 'Job Info', icon: <FileText size="0.75rem" /> },
    { label: 'Crew',     icon: <User size="0.75rem" /> },
    { label: 'Safety',   icon: <HardHat size="0.75rem" /> },
  ]

  const safetyCount = SAFETY_FORMS.filter(f => form[f.key]).length
  const selectedJob = PROJECTS.find(p => p.id === form.jobsite_id)

  const canSave =
    form.customer.trim() &&
    form.jobsite_id &&
    form.supervisor_name.trim() &&
    safetyCount === SAFETY_FORMS.length

  // When customer changes: clear jobsite if it no longer belongs to that customer
  const handleCustomerChange = (val) => {
    set('customer', val)
    const currentJob = PROJECTS.find(p => p.id === form.jobsite_id)
    if (currentJob && currentJob.customer !== val.trim()) {
      set('jobsite_id', null)
    }
  }

  // When a job is selected from the dropdown, auto-fill customer (GPS is device-captured)
  const handleJobSelect = (job) => {
    set('jobsite_id', job.id)
    if (!form.customer.trim()) set('customer', job.customer)
  }

  return (
  <>
    <div className="dfl-form-overlay" onClick={onClose}>
      <div className="dfl-form-panel" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="dfl-form-header" style={{ background: bc.bgActive }}>
          <div>
            <div className="dfl-form-part-label">Part 1 of 2 · Before Work Begins</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>Morning Check-In</div>
          </div>
          <button className="dfl-form-close" onClick={onClose}><X size="1rem" /></button>
        </div>

        {/* Step tabs */}
        <div className="dfl-form-steps">
          {STEPS.map((s, i) => (
            <button
              key={i}
              className={`dfl-form-step ${step === i ? 'active' : ''} ${i < step ? 'done' : ''}`}
              onClick={() => setStep(i)}
            >
              {i < step ? <CheckCircle size="0.6875rem" weight="fill" /> : s.icon}
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="dfl-form-body">

          {/* Step 0: Job Info */}
          {step === 0 && (
            <div className="dfl-form-section">

              {/* Customer — typeahead autocomplete */}
              <div className="dfl-field">
                <label className="dfl-label">
                  <Buildings size="0.75rem" style={{ marginRight: '0.25rem' }} />
                  Customer <span className="dfl-req">*</span>
                </label>
                <CustomerTypeahead
                  value={form.customer}
                  onChange={handleCustomerChange}
                  branch={branch}
                />
              </div>

              {/* Jobsite — dropdown from Kanban */}
              <div className="dfl-field">
                <label className="dfl-label">
                  <MapPin size="0.75rem" style={{ marginRight: '0.25rem' }} />
                  Jobsite <span className="dfl-req">*</span>
                </label>
                <JobsiteSelect
                  value={form.jobsite_id}
                  branch={branch}
                  customer={form.customer}
                  onChange={handleJobSelect}
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
                  <Crosshair size="0.75rem" style={{ marginRight: '0.25rem' }} />
                  GPS Coordinates <span className="dfl-req">*</span>
                </label>
                <GpsCoordinateField
                  value={form.gps_location}
                  onChange={val => set('gps_location', val)}
                />
              </div>

            </div>
          )}

          {/* Step 1: Crew */}
          {step === 1 && (
            <div className="dfl-form-section">
              {/* Supervisor — single typeahead */}
              <div className="dfl-field">
                <label className="dfl-label">
                  <User size="0.75rem" style={{ marginRight: '0.25rem' }} />
                  Supervisor Onsite <span className="dfl-req">*</span>
                </label>
                <div className="dfl-crew-row">
                  <div style={{ flex: 1 }}>
                    <TechTypeahead
                      value={form.supervisor_name}
                      onChange={val => {
                        set('supervisor_name', val)
                        set('crew_on_site', form.crew_on_site.filter(n => n !== val))
                      }}
                      exclude={form.crew_on_site}
                      placeholder="Search supervisors…"
                    />
                  </div>
                  {/* spacer matches the button column width in crew rows */}
                  <div style={{ width: '1.75rem', flexShrink: 0 }} />
                </div>
              </div>

              {/* Installers Onsite — multi typeahead with chips */}
              <div className="dfl-field">
                <label className="dfl-label">
                  <Users size="0.75rem" style={{ marginRight: '0.25rem' }} />
                  Installers Onsite
                </label>
                <TechMultiTypeahead
                  value={form.crew_on_site}
                  onChange={val => set('crew_on_site', val)}
                  exclude={form.supervisor_name ? [form.supervisor_name] : []}
                  placeholder="Search or type a name, press Enter to add…"
                />
              </div>
            </div>
          )}

          {/* Step 2: Safety Forms */}
          {step === 2 && (
            <div className="dfl-form-section">
              <div className="dfl-section-note">
                Complete all safety documentation below <strong>before work begins</strong>.
                Each form links to the digital template in the Forms Repository.
              </div>
              {SAFETY_FORMS.map(({ key, label, desc }) => (
                <div key={key} className={`dfl-safety-form-item ${form[key] ? 'completed' : ''}`}>
                  <div className="dfl-safety-form-icon">
                    {form[key]
                      ? <CheckCircle size="1.125rem" weight="fill" style={{ color: 'var(--state-success-text)' }} />
                      : <HardHat size="1.125rem" weight="bold" style={{ color: 'var(--grey-base)' }} />
                    }
                  </div>
                  <div className="dfl-safety-form-info">
                    <div className="dfl-safety-form-label">{label} <span className="dfl-req">*</span></div>
                    <div className="dfl-safety-form-desc">{desc}</div>
                    {form[key] && (
                      <div className="dfl-safety-form-completed-label">
                        <CheckCircle size="0.625rem" weight="fill" /> Completed
                      </div>
                    )}
                  </div>
                  <button
                    className={`dfl-safety-form-btn ${form[key] ? 'completed' : ''}`}
                    onClick={() => setSafetyOpen(key)}
                  >
                    {form[key]
                      ? <><ArrowsClockwise size="0.75rem" /> Redo</>
                      : <>Fill Out Form <ArrowRight size="0.75rem" /></>
                    }
                  </button>
                </div>
              ))}
              {safetyCount < SAFETY_FORMS.length && (
                <div className="dfl-safety-warning">
                  <Warning size="0.8125rem" weight="fill" />
                  {SAFETY_FORMS.length - safetyCount} of {SAFETY_FORMS.length} safety forms still required
                </div>
              )}
              {safetyCount === SAFETY_FORMS.length && (
                <div className="dfl-safety-all-done">
                  <CheckCircle size="0.8125rem" weight="fill" />
                  All safety documentation complete — ready to start work
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="dfl-form-footer">
          <button
            className="dfl-btn-secondary"
            onClick={() => step > 0 ? setStep(s => s - 1) : onClose()}
          >
            {step === 0 ? 'Cancel' : 'Back'}
          </button>
          {step < STEPS.length - 1 ? (
            <button
              className="dfl-btn-primary"
              style={{ background: bc.bgActive }}
              onClick={() => setStep(s => s + 1)}
              disabled={step === 0 && !form.customer.trim()}
            >
              Next <ArrowRight size="0.8125rem" />
            </button>
          ) : (
            <button
              className="dfl-btn-primary"
              style={{ background: canSave ? 'var(--state-success-text)' : 'var(--text-muted)', cursor: canSave ? 'pointer' : 'not-allowed' }}
              onClick={() => canSave && onSave(form)}
              disabled={!canSave}
            >
              <CheckCircle size="0.875rem" weight="fill" />
              Save &amp; Start Work
            </button>
          )}
        </div>

      </div>
    </div>

    {/* Safety form modal — rendered on top of Part 1 */}
    {safetyOpen && (
      <SafetyFormModal
        formKey={safetyOpen}
        prefill={{
          supervisorName: form.supervisor_name,
          date:           form.report_date,
          customerSite:   form.customer_site }}
        onComplete={(key, values) => {
          set(key, true)
          const DATA_KEY_MAP = {
            jsa_uploaded:      'jsa_data',
            manlift_checklist: 'manlift_data',
            fall_protection:   'fall_protection_data' }
          if (DATA_KEY_MAP[key]) set(DATA_KEY_MAP[key], values)
          setSafetyOpen(null)
        }}
        onBack={() => setSafetyOpen(null)}
        bc={bc}
      />
    )}
  </>
  )
}

// ─── Part 2 Form — End-of-Day Close-Out ────────────────────────────────────────
function Part2Form({ entry, onClose, onSubmit, bc }) {
  const [form, setForm] = useState({ ...EMPTY_P2 })
  const [step, setStep] = useState(0)

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const toggleWorkType = (t) => {
    set('work_types', form.work_types.includes(t)
      ? form.work_types.filter(x => x !== t)
      : [...form.work_types, t]
    )
  }

  const STEPS = [
    { label: 'Work Summary', icon: <ClipboardText size="0.75rem" /> },
    { label: 'Travel',       icon: <Truck size="0.75rem" /> },
    { label: 'Sign Off',     icon: <Signature size="0.75rem" /> },
  ]

  const canSubmit = form.hours_worked && form.work_types.length > 0 && form.signed

  return (
    <div className="dfl-form-overlay" onClick={onClose}>
      <div className="dfl-form-panel" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="dfl-form-header dfl-form-header--p2" style={{ background: bc.bgActive }}>
          <div>
            <div className="dfl-form-part-label">Part 2 of 2 · End of Day</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>Close Out Day</div>
            {entry && (
              <div style={{ fontSize: '0.6875rem', color: 'var(--surface-base)', marginTop: '0.125rem' }}>
                {entry.customer_site || entry.customer || '—'} · {fmtDate(entry.report_date)}
              </div>
            )}
          </div>
          <button className="dfl-form-close" onClick={onClose}><X size="1rem" /></button>
        </div>

        {/* Step tabs */}
        <div className="dfl-form-steps">
          {STEPS.map((s, i) => (
            <button
              key={i}
              className={`dfl-form-step ${step === i ? 'active' : ''} ${i < step ? 'done' : ''}`}
              onClick={() => setStep(i)}
            >
              {i < step ? <CheckCircle size="0.6875rem" weight="fill" /> : s.icon}
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="dfl-form-body">

          {/* Step 0: Work Summary */}
          {step === 0 && (
            <div className="dfl-form-section">
              <div className="dfl-field">
                <label className="dfl-label">Total Time Onsite <span className="dfl-req">*</span></label>
                <TimeOnsiteInput
                  value={form.hours_worked}
                  onChange={val => set('hours_worked', val)}
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
                      {form.work_types.includes(t) && <CheckCircle size="0.6875rem" weight="fill" />}
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

          {/* Step 1: Travel */}
          {step === 1 && (
            <div className="dfl-form-section">
              <div className="dfl-field">
                <label className="dfl-label"><Truck size="0.75rem" style={{ marginRight: '0.25rem' }} />Miles Driven <span className="dfl-req">*</span></label>
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
                <TimeOnsiteInput
                  value={form.drive_time}
                  onChange={val => set('drive_time', val)}
                  options={DRIVE_TIME_OPTIONS}
                  placeholder="e.g. 1:00 or 1:30"
                />
              </div>
              <div className="dfl-field">
                <label className="dfl-label">Other Tasks / Notes</label>
                <textarea
                  className="dfl-input dfl-textarea"
                  placeholder="Additional tasks completed, issues observed, follow-up needed..."
                  value={form.other_tasks}
                  onChange={e => set('other_tasks', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Step 2: Sign Off */}
          {step === 2 && (
            <div className="dfl-form-section">
              <div className="dfl-signoff-context">
                <div className="dfl-signoff-context-row">
                  <span className="dfl-detail-label"><FileText size="0.6875rem" /> Site</span>
                  <span>{entry?.customer_site || entry?.customer || '—'}</span>
                </div>
                <div className="dfl-signoff-context-row">
                  <span className="dfl-detail-label"><Clock size="0.6875rem" /> Date</span>
                  <span>{fmtDate(entry?.report_date) || '—'}</span>
                </div>
                <div className="dfl-signoff-context-row">
                  <span className="dfl-detail-label"><User size="0.6875rem" /> Supervisor</span>
                  <span>{entry?.supervisor_name || entry?.submitted_by || '—'}</span>
                </div>
              </div>
              <div className="dfl-field">
                <label className="dfl-label">
                  <Pencil size="0.75rem" style={{ marginRight: '0.25rem' }} />
                  Supervisor Signature <span className="dfl-req">*</span>
                </label>
                <SignaturePad
                  signed={form.signed}
                  onSign={() => set('signed', true)}
                  onClear={() => set('signed', false)}
                />
              </div>
              {!canSubmit && (
                <div className="dfl-safety-warning">
                  <Warning size="0.8125rem" weight="fill" />
                  {!form.hours_worked ? 'Total time onsite required · ' : ''}
                  {form.work_types.length === 0 ? 'Select at least one work type · ' : ''}
                  {!form.signed ? 'Supervisor signature required' : ''}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="dfl-form-footer">
          <button
            className="dfl-btn-secondary"
            onClick={() => step > 0 ? setStep(s => s - 1) : onClose()}
          >
            {step === 0 ? 'Cancel' : 'Back'}
          </button>
          {step < STEPS.length - 1 ? (
            <button
              className="dfl-btn-primary"
              style={{ background: bc.bgActive }}
              onClick={() => setStep(s => s + 1)}
            >
              Next <ArrowRight size="0.8125rem" />
            </button>
          ) : (
            <button
              className="dfl-btn-primary"
              style={{ background: canSubmit ? bc.bgActive : 'var(--text-muted)', cursor: canSubmit ? 'pointer' : 'not-allowed' }}
              onClick={() => canSubmit && onSubmit(form)}
              disabled={!canSubmit}
            >
              <SealCheck size="0.875rem" weight="fill" />
              Complete &amp; Submit
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
  const location = useLocation()
  // Management view when accessed via /installations/field-logs; field-only otherwise
  const isManagement = location.pathname === '/installations/field-logs'

  const { user } = useAuth()
  const [branch, setBranch]           = useState('lm')
  const [formMode, setFormMode]       = useState(null)
  const [closeoutId, setCloseoutId]   = useState(null)
  const [entries, setEntries]         = useState([])
  const [loading, setLoading]         = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore]         = useState(true)
  const [savingPdf, setSavingPdf]     = useState(false)

  const bc = BRANCH_COLORS[branch] || BRANCH_COLORS.lm

  const PAGE_SIZE = 20

  // ── Load entries from Supabase with pagination ───────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data, error } = await db
        .from('daily_field_logs')
        .select('*')
        .order('report_date', { ascending: false })
        .range(0, PAGE_SIZE - 1)
      if (!error && data) {
        setEntries(data)
        setHasMore(data.length === PAGE_SIZE)
      }
      setLoading(false)
    }
    load()
  }, [])

  const loadMore = async () => {
    setLoadingMore(true)
    const { data, error } = await db
      .from('daily_field_logs')
      .select('*')
      .order('report_date', { ascending: false })
      .range(entries.length, entries.length + PAGE_SIZE - 1)
    if (!error && data) {
      setEntries(e => [...e, ...data])
      setHasMore(data.length === PAGE_SIZE)
    }
    setLoadingMore(false)
  }

  const lmCount         = entries.filter(r => r.branch === 'lm').length
  const boltCount       = entries.filter(r => r.branch === 'bolt').length

  const reports = entries
    .filter(r => r.branch === branch)
    .sort((a, b) => b.report_date.localeCompare(a.report_date))

  const draftCount    = reports.filter(r => r.status === 'Draft').length
  const totalHours    = reports.filter(r => r.status !== 'Draft').reduce((s, r) => s + Number(r.hours_worked || 0), 0)
  const reviewedCount = reports.filter(r => r.status === 'Reviewed').length
  const unsignedCount = reports.filter(r => r.status === 'Submitted' && !r.signed).length

  // Part 1 save → inserts a Draft row into Supabase
  const handlePart1Save = async (form) => {
    const job = PROJECTS.find(p => p.id === form.jobsite_id)
    const payload = {
      branch,
      status:            'Draft',
      customer:          form.customer,
      jobsite_id:        form.jobsite_id,
      customer_site:     job ? `${form.customer} — ${job.job_number}` : form.customer,
      report_date:       form.report_date,
      gps_location:      form.gps_location,
      supervisor_name:   form.supervisor_name,
      submitted_by:      form.supervisor_name,
      crew_on_site:      form.crew_on_site,
      jsa_uploaded:         form.jsa_uploaded,
      manlift_checklist:    form.manlift_checklist,
      fall_protection:      form.fall_protection,
      jsa_data:             form.jsa_data             || null,
      manlift_data:         form.manlift_data         || null,
      fall_protection_data: form.fall_protection_data || null }
    const { data, error } = await db
      .from('daily_field_logs')
      .insert(payload)
      .select()
      .single()
    if (!error && data) {
      setEntries(e => [data, ...e])
      logActivity(db, user?.id, 'field_ops', {
        category:    'field_log',
        action:      'created',
        label:       `Started Daily Field Log`,
        entity_type: 'daily_field_log',
        entity_id:   data.id })
    }
    setFormMode(null)
  }

  // Part 2 submit → update DB, generate PDF, upload, store pdf_url
  const handlePart2Submit = async (form) => {
    setSavingPdf(true)
    const entry = entries.find(r => r.id === closeoutId)
    const updates = {
      status:       'Submitted',
      hours_worked: form.hours_worked,
      work_types:   form.work_types,
      work_other:   form.work_other,
      miles_driven: form.miles_driven,
      drive_time:   form.drive_time,
      other_tasks:  form.other_tasks,
      signed:       form.signed,
      submitted_at: new Date().toISOString(),
      finalized_at: new Date().toISOString() }

    // First update the DB record
    await db.from('daily_field_logs').update(updates).eq('id', closeoutId)

    // Generate PDF with merged data and upload
    const merged = { ...entry, ...updates }
    let pdfUrl = null
    try {
      pdfUrl = await generateAndUploadDFLPdf(merged)
      await db.from('daily_field_logs').update({ pdf_url: pdfUrl }).eq('id', closeoutId)
    } catch (e) {
      console.error('PDF generation failed', e)
    }

    // Reflect in local state
    setEntries(e => e.map(r =>
      r.id === closeoutId ? { ...r, ...updates, pdf_url: pdfUrl } : r
    ))
    await logActivity(db, user?.id, 'field_ops', {
      category:    'field_log',
      action:      'submitted',
      label:       `Submitted Daily Field Log`,
      entity_type: 'daily_field_log',
      entity_id:   closeoutId })
    setSavingPdf(false)
    setFormMode(null)
    setCloseoutId(null)
  }

  const openCloseOut = (id) => {
    setCloseoutId(id)
    setFormMode('part2')
  }

  const closeoutEntry = entries.find(r => r.id === closeoutId)

  return (
    <div className="page-content fade-in">
      <div className="page-stack">

      {/* ══ MANAGEMENT OVERVIEW — only on /installations/field-logs ══════════ */}
      {isManagement && (
        <>
          <SectionDivider title="Field Logs" label="Management Overview" accent="var(--brand-primary)" />

          <BranchTabs
            active={branch}
            onChange={setBranch}
            lmCount={lmCount}
            boltCount={boltCount}
          />

          {/* Summary strip */}
          <div className="dfl-summary-strip">
            {[
              { label: 'Total Entries',      value: reports.length,   icon: <FileText size="0.9375rem" weight="bold" /> },
              { label: 'Hours Logged',       value: `${totalHours}h`, icon: <Clock size="0.9375rem" weight="bold" /> },
              { label: 'Reviewed',           value: reviewedCount,    icon: <CheckCircle size="0.9375rem" weight="bold" /> },
              { label: 'Drafts In Progress', value: draftCount,       icon: <ArrowsClockwise size="0.9375rem" weight="bold" />, alert: draftCount > 0 },
            ].map(s => (
              <div
                key={s.label}
                className="dfl-summary-card"
                style={s.alert && s.value > 0 ? { borderColor: 'var(--warning-border)' } : {}}
              >
                <div className="dfl-summary-icon" style={{ color: s.alert && s.value > 0 ? 'var(--warning-text)' : bc.bgActive }}>
                  {s.icon}
                </div>
                <div>
                  <div className="dfl-summary-value" style={{ color: s.alert && s.value > 0 ? 'var(--warning-text)' : 'var(--text-primary)' }}>
                    {s.value}
                  </div>
                  <div className="dfl-summary-label">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Draft entries callout */}
          {draftCount > 0 && (
            <div className="dfl-draft-callout" style={{ borderLeftColor: bc.bgActive }}>
              <ArrowsClockwise size="0.875rem" weight="bold" style={{ color: bc.bgActive, flexShrink: 0 }} />
              <span>
                <strong>{draftCount} log{draftCount !== 1 ? 's' : ''} in progress</strong>
                {' '}— morning check-in saved. Complete the end-of-day close-out when work is done.
              </span>
            </div>
          )}

          {/* Entries list */}
          <div className="card list-card">
            <div
              className="list-card__header"
              style={{ background: bc.bgActive, color: bc.textActive, transition: 'background 0.2s ease' }}
            >
              <span className="list-card__title">
                <Clock size="0.875rem" />
                Field Log Entries
              </span>
              <span className="list-card__meta">{reports.length} entr{reports.length !== 1 ? 'ies' : 'y'}</span>
            </div>
            <div>
              {reports.length === 0 ? (
                <div className="dfl-empty-state">
                  <FileText size="1.75rem" weight="thin" style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                  <div>No log entries for this branch</div>
                </div>
              ) : (
                <div className="dfl-entries-list">
                  {reports.map(r => (
                    <EntryCard key={r.id} entry={r} bc={bc} onCloseOut={openCloseOut} />
                  ))}
                  {hasMore && (
                    <button onClick={loadMore} disabled={loadingMore}
                      style={{ width:'100%', padding:'var(--space-m)', textAlign:'center', color:'var(--text-muted)', fontSize:'var(--text-sm)', background:'none' }}>
                      {loadingMore ? 'Loading…' : 'Load more'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* New Daily Log button */}
      <div style={{ display: 'flex', gap: 'var(--space-s)', width: '100%', marginBottom: 'var(--space-s)', overflow: 'hidden', boxSizing: 'border-box' }}>
        <button
          className="btn btn-primary"
          className="content-body flex-gap-s"
          onClick={() => setFormMode('part1')}
        >
          <Plus size="0.875rem" weight="bold" />
          New Daily Field Log
        </button>
        {draftCount > 0 && (
          <button
            className="btn btn-secondary"
            className="content-body flex-gap-s"
            onClick={() => openCloseOut(reports.find(r => r.status === 'Draft')?.id)}
          >
            <ArrowsClockwise size="0.875rem" weight="bold" />
            Close Out Day ({draftCount})
          </button>
        )}
      </div>

      {/* Field-only: show the entries list below the action buttons */}
      {!isManagement && (
        <div className="card list-card" style={{ marginTop: 'var(--space-s)' }}>
          <div className="list-card__header" style={{ background: bc.bgActive, color: bc.textActive, transition: 'background 0.2s ease' }}>
            <span className="list-card__title">
              <Clock size="0.875rem" />
              My Log Entries
            </span>
            <span className="list-card__meta">{entries.length} entr{entries.length !== 1 ? 'ies' : 'y'}</span>
          </div>
          <div>
            {entries.length === 0 ? (
              <div className="dfl-empty-state">
                <FileText size="1.75rem" weight="thin" style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                <div>No log entries yet — start one above</div>
              </div>
            ) : (
              <div className="dfl-entries-list">
                {entries.map(r => (
                  <EntryCard key={r.id} entry={r} bc={bc} onCloseOut={openCloseOut} />
                ))}
                {hasMore && (
                  <button onClick={loadMore} disabled={loadingMore}
                    style={{ width:'100%', padding:'var(--space-m)', textAlign:'center', color:'var(--text-muted)', fontSize:'var(--text-sm)', background:'none' }}>
                    {loadingMore ? 'Loading…' : 'Load more'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Part 1 Form */}
      {formMode === 'part1' && (
        <Part1Form
          onClose={() => setFormMode(null)}
          onSave={handlePart1Save}
          bc={bc}
          branch={branch}
        />
      )}

      {/* Part 2 Form */}
      {formMode === 'part2' && (
        <Part2Form
          entry={closeoutEntry}
          onClose={() => { setFormMode(null); setCloseoutId(null) }}
          onSubmit={handlePart2Submit}
          bc={bc}
        />
      )}

      {/* PDF saving overlay */}
      {savingPdf && (
        <div className="dfl-pdf-overlay">
          <SpinnerGap size="1.75rem" weight="bold" className="dfl-spin" />
          <span>Finalizing report &amp; generating PDF…</span>
        </div>
      )}

      </div>
    </div>
  )
}
