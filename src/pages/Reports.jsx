import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ClipboardText, CheckCircle, Clock, MagnifyingGlass,
  HardHat, FileText, Plus, Eye, Lightning, Ruler, Warning } from '@phosphor-icons/react'
import BranchTabs from '../components/BranchTabs'
import SectionDivider from '../components/SectionDivider'
import { BRANCH_COLORS } from '../config/branches.js'
// ─── Form type config ──────────────────────────────────────────────────────────
const FORM_TYPES = {
  completion:    { label: 'Completion Form', Icon: Lightning,       color: 'var(--state-warning-text)', bg: 'var(--state-warning-soft)' },
  inspection:    { label: 'Inspection',      Icon: MagnifyingGlass, color: 'var(--blue-tint-20)', bg: 'var(--state-info-soft)' },
  jsa:           { label: 'JSA',             Icon: HardHat,         color: 'var(--warning)', bg: 'var(--warning-tint-80)' },
  'site-survey': { label: 'Site Survey',     Icon: Ruler,           color: 'var(--purple-tint-20)', bg: 'var(--purple-soft)' } }

// ─── Status config ─────────────────────────────────────────────────────────────
const STATUS_CFG = {
  submitted:          { label: 'Submitted',          color: 'var(--state-info)', bg: 'var(--state-info-soft)' },
  'under-review':     { label: 'Under Review',       color: 'var(--warning)', bg: 'var(--warning-soft)' },
  'customer-signoff': { label: 'Customer Sign-off',  color: 'var(--purple)', bg: 'var(--purple-soft)' },
  complete:           { label: 'Complete',            color: 'var(--state-success-text)', bg: 'var(--state-success-soft)' } }

// ─── Mock data (swapped for Supabase when live) ────────────────────────────────
const MOCK_FIELD_REPORTS = [
  { id: 'fr-001', form_type: 'completion',   branch: 'bolt',        project_name: 'Ritz-Carlton LPS Installation',      job_number: 'BOLT-2024-001', submitted_by: 'Ray Thibodaux',  status: 'submitted',         created_at: '2026-03-22' },
  { id: 'fr-002', form_type: 'inspection',   branch: 'lm',          project_name: 'Rayonier Advanced Materials Cert',   job_number: 'LM-2024-006',   submitted_by: 'Priya Nair',     status: 'complete',          created_at: '2026-03-20' },
  { id: 'fr-003', form_type: 'completion',   branch: 'bolt',        project_name: 'Amelia Island Lighthouse Install',   job_number: 'BOLT-2024-007', submitted_by: 'Diane Okafor',   status: 'complete',          created_at: '2026-03-14' },
  { id: 'fr-004', form_type: 'jsa',          branch: 'bolt',        project_name: 'Nassau County Courthouse LPS',       job_number: 'BOLT-2024-002', submitted_by: 'Marcus Webb',    status: 'under-review',      created_at: '2026-03-18' },
  { id: 'fr-005', form_type: 'completion',   branch: 'bolt',        project_name: 'Nassau County Courthouse LPS',       job_number: 'BOLT-2024-002', submitted_by: 'Tamika Russell', status: 'customer-signoff',  created_at: '2026-03-23' },
  { id: 'fr-006', form_type: 'site-survey',  branch: 'lm',          project_name: 'Jacksonville Port Authority',        job_number: 'LM-2024-009',   submitted_by: 'Jake Herrera',   status: 'complete',          created_at: '2026-03-10' },
  { id: 'fr-007', form_type: 'inspection',   branch: 'bolt', project_name: 'Dallas Medical Center Phase 2',     job_number: 'BLTX-2024-003', submitted_by: 'Chris Navarro',  status: 'submitted',         created_at: '2026-03-21' },
  { id: 'fr-008', form_type: 'jsa',          branch: 'bolt', project_name: 'DFW Cargo Terminal LPS',            job_number: 'BLTX-2024-001', submitted_by: 'Lena Kowalski',  status: 'complete',          created_at: '2026-03-15' },
  { id: 'fr-009', form_type: 'completion',   branch: 'lm',          project_name: 'Baptist Medical Center South Wing', job_number: 'LM-2024-003',   submitted_by: 'Priya Nair',     status: 'under-review',      created_at: '2026-03-19' },
  { id: 'fr-010', form_type: 'site-survey',  branch: 'bolt',        project_name: 'Orange Park Medical Complex',       job_number: 'BOLT-2024-011', submitted_by: 'Ray Thibodaux',  status: 'submitted',         created_at: '2026-03-24' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(d) {
  if (!d) return ''
  const [y, m, day] = d.split('-')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${months[parseInt(m,10)-1]} ${parseInt(day,10)}, ${y}`
}

// ─── Type pill ────────────────────────────────────────────────────────────────
function TypePill({ typeKey, count, active, onClick }) {
  const cfg = typeKey === 'all'
    ? { label: 'All', Icon: ClipboardText, color: 'var(--grey-shade-40)', bg: 'var(--bg)' }
    : (FORM_TYPES[typeKey] || {})
  const { Icon } = cfg
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '4px 10px', borderRadius: 'var(--radius-m)', cursor: 'pointer',
        border: 'none',
        background: active ? cfg.bg : 'var(--surface-base)',
        color: active ? cfg.color : 'var(--text-primary)',
        fontSize: 'var(--text-sm)', fontWeight: active ? 600 : 500,
        transition: 'all 0.15s' }}
    >
      {Icon && <Icon size="0.75rem" weight={active ? 'bold' : 'regular'} />}
      {cfg.label}
      <span style={{
        background: active ? cfg.color : 'var(--border)',
        color: active ? '#fff' : 'var(--text-primary)',
        borderRadius: 'var(--radius-m)', padding: '0 5px', fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)', lineHeight: '16px' }}>{count}</span>
    </button>
  )
}

// ─── Report row ───────────────────────────────────────────────────────────────
function ReportRow({ r }) {
  const type   = FORM_TYPES[r.form_type]  || { label: r.form_type, Icon: FileText, color: 'var(--grey-base)', bg: 'var(--surface-base)' }
  const status = STATUS_CFG[r.status]     || { label: r.status,    color: 'var(--grey-base)', bg: 'var(--surface-base)' }
  const { Icon } = type

  return (
    <div className="reports-b711">
      {/* Type icon badge */}
      <Icon size="0.9375rem" weight="bold" style={{ color: type.color }} />

      {/* Main info */}
      <div className="content-body">
        <div className="reports-f2c9">
          {r.project_name}
        </div>
        <div className="reports-d9a5">
          <span style={{ background: type.bg, color: type.color, padding: 'var(--space-3xs) var(--space-xs)', borderRadius: 'var(--radius-xs)', fontWeight: 'var(--fw-semibold)', fontSize: 'var(--text-xs)' }}>{type.label}</span>
          <span>{r.job_number}</span>
          <span>·</span>
          <span>{r.submitted_by}</span>
          <span>·</span>
          <span>{fmtDate(r.created_at)}</span>
        </div>
      </div>

      {/* Status badge */}
      <span style={{
        fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-semibold)', padding: '3px 8px', borderRadius: 'var(--radius-s)', flexShrink: 0,
        background: status.bg, color: status.color, whiteSpace: 'nowrap' }}>
        {status.label}
      </span>

      {/* View button */}
      <button className="reports-6aa0">
        <Eye size="0.75rem" />
        View
      </button>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Reports() {
  const navigate = useNavigate()
  const [branch,       setBranch]       = useState('lm')
  const [activeType,   setActiveType]   = useState('all')
  const [activeStatus, setActiveStatus] = useState(null)

  const bc = BRANCH_COLORS[branch] || BRANCH_COLORS.lm

  const lmCount         = MOCK_FIELD_REPORTS.filter(r => r.branch === 'lm').length
  const boltCount       = MOCK_FIELD_REPORTS.filter(r => r.branch === 'bolt').length

  const branchReports = MOCK_FIELD_REPORTS.filter(r => r.branch === branch)

  const typeCounts = {
    all:           branchReports.length,
    completion:    branchReports.filter(r => r.form_type === 'completion').length,
    inspection:    branchReports.filter(r => r.form_type === 'inspection').length,
    jsa:           branchReports.filter(r => r.form_type === 'jsa').length,
    'site-survey': branchReports.filter(r => r.form_type === 'site-survey').length }

  const statusCounts = {
    submitted:          branchReports.filter(r => r.status === 'submitted').length,
    'under-review':     branchReports.filter(r => r.status === 'under-review').length,
    'customer-signoff': branchReports.filter(r => r.status === 'customer-signoff').length,
    complete:           branchReports.filter(r => r.status === 'complete').length }

  const filtered = branchReports
    .filter(r => activeType === 'all' || r.form_type === activeType)
    .filter(r => !activeStatus || r.status === activeStatus)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))

  return (
    <div className="page-content fade-in">
      <div className="page-stack">

      {/* ══ MANAGEMENT OVERVIEW ═══════════════════════════════════════════════ */}
      <SectionDivider title="Field Reports" label="Management Overview" accent="var(--brand-primary)" />

      <BranchTabs
        active={branch}
        onChange={setBranch}
        lmCount={lmCount}
        boltCount={boltCount}
      />

      {/* Summary stat tiles */}
      <div className="dfl-summary-strip">
        {[
          { label: 'Total Submitted',   value: branchReports.length,                icon: <ClipboardText size="0.9375rem" weight="bold" /> },
          { label: 'Under Review',      value: statusCounts['under-review'],         icon: <Clock size="0.9375rem" weight="bold" />,    alert: statusCounts['under-review'] > 0 },
          { label: 'Awaiting Sign-off', value: statusCounts['customer-signoff'],     icon: <Warning size="0.9375rem" weight="bold" />,  alert: statusCounts['customer-signoff'] > 0 },
          { label: 'Complete',          value: statusCounts.complete,                icon: <CheckCircle size="0.9375rem" weight="bold" /> },
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

      {/* Form type filter pills */}
      <div className="reports-ca34">
        {['all', 'completion', 'inspection', 'jsa', 'site-survey'].map(key => (
          <TypePill
            key={key}
            typeKey={key}
            count={typeCounts[key] || 0}
            active={activeType === key}
            onClick={() => setActiveType(activeType === key && key !== 'all' ? 'all' : key)}
          />
        ))}
      </div>

      {/* Status filter pills */}
      <div className="reports-86c6">
        {Object.entries(STATUS_CFG).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => setActiveStatus(activeStatus === key ? null : key)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '3px 9px', borderRadius: 'var(--radius-m)', cursor: 'pointer',
              fontSize: 'var(--text-xs)', fontWeight: activeStatus === key ? 600 : 500,
              border: 'none',
              background: activeStatus === key ? cfg.bg : 'var(--surface-base)',
              color: activeStatus === key ? cfg.color : 'var(--text-muted)',
              transition: 'all 0.15s' }}
          >
            {cfg.label}
            <span style={{
              background: activeStatus === key ? cfg.color : 'var(--border)',
              color: activeStatus === key ? '#fff' : 'var(--text-primary)',
              borderRadius: 'var(--radius-m)', padding: '0 4px', fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)', lineHeight: '15px' }}>{statusCounts[key] || 0}</span>
          </button>
        ))}
      </div>

      {/* Archive list */}
      <div className="card list-card" style={{ marginTop: 'var(--space-2xs)' }}>
        <div
          className="list-card__header"
          style={{ background: bc.bgActive, color: bc.textActive, transition: 'background 0.2s ease' }}
        >
          <span className="list-card__title">
            <ClipboardText size="0.875rem" />
            Submitted Forms
          </span>
          <span className="list-card__meta">{filtered.length} record{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {filtered.length === 0 ? (
          <div className="dfl-empty-state">
            <ClipboardText size="1.75rem" weight="thin" className="mb-s" />
            <div>No submitted forms match these filters</div>
          </div>
        ) : (
          filtered.map(r => <ReportRow key={r.id} r={r} />)
        )}
      </div>

      </div>
    </div>
  )
}
