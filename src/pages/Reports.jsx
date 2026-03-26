import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ClipboardText, CheckCircle, Clock, MagnifyingGlass,
  HardHat, FileText, Plus, Eye, Lightning, Ruler, Warning,
} from '@phosphor-icons/react'
import BranchTabs from '../components/BranchTabs'
import SectionDivider from '../components/SectionDivider'
import { BRANCH_COLORS } from '../config/branches.js'

// ─── Form type config ──────────────────────────────────────────────────────────
const FORM_TYPES = {
  completion:    { label: 'Completion Form', Icon: Lightning,       color: '#F97316', bg: '#FFF7ED' },
  inspection:    { label: 'Inspection',      Icon: MagnifyingGlass, color: '#3B82F6', bg: '#EFF6FF' },
  jsa:           { label: 'JSA',             Icon: HardHat,         color: '#EAB308', bg: '#FEFCE8' },
  'site-survey': { label: 'Site Survey',     Icon: Ruler,           color: '#8B5CF6', bg: '#F5F3FF' },
}

// ─── Status config ─────────────────────────────────────────────────────────────
const STATUS_CFG = {
  submitted:          { label: 'Submitted',          color: '#2563EB', bg: '#EFF6FF' },
  'under-review':     { label: 'Under Review',       color: '#D97706', bg: '#FFFBEB' },
  'customer-signoff': { label: 'Customer Sign-off',  color: '#7C3AED', bg: '#F5F3FF' },
  complete:           { label: 'Complete',            color: '#16A34A', bg: '#F0FDF4' },
}

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
    ? { label: 'All', Icon: ClipboardText, color: '#374151', bg: '#F3F4F6' }
    : (FORM_TYPES[typeKey] || {})
  const { Icon } = cfg
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '4px 10px', borderRadius: 20, cursor: 'pointer',
        border: active ? `1.5px solid ${cfg.color}` : '1.5px solid var(--border)',
        background: active ? cfg.bg : 'var(--surface)',
        color: active ? cfg.color : 'var(--text-2)',
        fontSize: 12, fontWeight: active ? 600 : 500,
        transition: 'all 0.15s',
      }}
    >
      {Icon && <Icon size={12} weight={active ? 'bold' : 'regular'} />}
      {cfg.label}
      <span style={{
        background: active ? cfg.color : 'var(--border)',
        color: active ? '#fff' : 'var(--text-2)',
        borderRadius: 10, padding: '0 5px', fontSize: 10, fontWeight: 700, lineHeight: '16px',
      }}>{count}</span>
    </button>
  )
}

// ─── Report row ───────────────────────────────────────────────────────────────
function ReportRow({ r }) {
  const type   = FORM_TYPES[r.form_type]  || { label: r.form_type, Icon: FileText, color: '#6B7280', bg: '#F9FAFB' }
  const status = STATUS_CFG[r.status]     || { label: r.status,    color: '#6B7280', bg: '#F9FAFB' }
  const { Icon } = type

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 16px', borderBottom: '1px solid var(--border-l)',
    }}>
      {/* Type icon badge */}
      <div style={{
        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
        background: type.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={15} weight="bold" style={{ color: type.color }} />
      </div>

      {/* Main info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {r.project_name}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ background: type.bg, color: type.color, padding: '1px 6px', borderRadius: 4, fontWeight: 600, fontSize: 10 }}>{type.label}</span>
          <span>{r.job_number}</span>
          <span>·</span>
          <span>{r.submitted_by}</span>
          <span>·</span>
          <span>{fmtDate(r.created_at)}</span>
        </div>
      </div>

      {/* Status badge */}
      <span style={{
        fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6, flexShrink: 0,
        background: status.bg, color: status.color, whiteSpace: 'nowrap',
      }}>
        {status.label}
      </span>

      {/* View button */}
      <button style={{
        display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
        padding: '5px 10px', borderRadius: 6, border: '1px solid var(--border)',
        background: 'var(--surface)', color: 'var(--text-2)', fontSize: 12, cursor: 'pointer',
      }}>
        <Eye size={12} />
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
    'site-survey': branchReports.filter(r => r.form_type === 'site-survey').length,
  }

  const statusCounts = {
    submitted:          branchReports.filter(r => r.status === 'submitted').length,
    'under-review':     branchReports.filter(r => r.status === 'under-review').length,
    'customer-signoff': branchReports.filter(r => r.status === 'customer-signoff').length,
    complete:           branchReports.filter(r => r.status === 'complete').length,
  }

  const filtered = branchReports
    .filter(r => activeType === 'all' || r.form_type === activeType)
    .filter(r => !activeStatus || r.status === activeStatus)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))

  return (
    <div className="page-content fade-in">
      <div className="page-stack">

      {/* ══ MANAGEMENT OVERVIEW ═══════════════════════════════════════════════ */}
      <SectionDivider title="Field Reports" label="Management Overview" accent="var(--navy)" />

      <BranchTabs
        active={branch}
        onChange={setBranch}
        lmCount={lmCount}
        boltCount={boltCount}
      />

      {/* Summary stat tiles */}
      <div className="dfl-summary-strip">
        {[
          { label: 'Total Submitted',   value: branchReports.length,                icon: <ClipboardText size={15} weight="bold" /> },
          { label: 'Under Review',      value: statusCounts['under-review'],         icon: <Clock size={15} weight="bold" />,    alert: statusCounts['under-review'] > 0 },
          { label: 'Awaiting Sign-off', value: statusCounts['customer-signoff'],     icon: <Warning size={15} weight="bold" />,  alert: statusCounts['customer-signoff'] > 0 },
          { label: 'Complete',          value: statusCounts.complete,                icon: <CheckCircle size={15} weight="bold" /> },
        ].map(s => (
          <div
            key={s.label}
            className="dfl-summary-card"
            style={s.alert && s.value > 0 ? { borderColor: '#FCD34D' } : {}}
          >
            <div className="dfl-summary-icon" style={{ color: s.alert && s.value > 0 ? '#B45309' : bc.bgActive }}>
              {s.icon}
            </div>
            <div>
              <div className="dfl-summary-value" style={{ color: s.alert && s.value > 0 ? '#B45309' : 'var(--text-1)' }}>
                {s.value}
              </div>
              <div className="dfl-summary-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Form type filter pills */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
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
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
        {Object.entries(STATUS_CFG).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => setActiveStatus(activeStatus === key ? null : key)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '3px 9px', borderRadius: 20, cursor: 'pointer',
              fontSize: 11, fontWeight: activeStatus === key ? 600 : 500,
              border: activeStatus === key ? `1.5px solid ${cfg.color}` : '1.5px solid var(--border)',
              background: activeStatus === key ? cfg.bg : 'var(--surface)',
              color: activeStatus === key ? cfg.color : 'var(--text-3)',
              transition: 'all 0.15s',
            }}
          >
            {cfg.label}
            <span style={{
              background: activeStatus === key ? cfg.color : 'var(--border)',
              color: activeStatus === key ? '#fff' : 'var(--text-2)',
              borderRadius: 10, padding: '0 4px', fontSize: 10, fontWeight: 700, lineHeight: '15px',
            }}>{statusCounts[key] || 0}</span>
          </button>
        ))}
      </div>

      {/* Archive list */}
      <div className="dash-card" style={{ marginTop: 4 }}>
        <div
          className="dash-card-head"
          style={{ background: bc.bgActive, color: bc.textActive, transition: 'background 0.2s ease' }}
        >
          <span className="dash-card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <ClipboardText size={14} />
            Submitted Forms
          </span>
          <span className="dash-card-meta">{filtered.length} record{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {filtered.length === 0 ? (
          <div className="dfl-empty-state">
            <ClipboardText size={28} weight="thin" style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
            <div>No submitted forms match these filters</div>
          </div>
        ) : (
          filtered.map(r => <ReportRow key={r.id} r={r} />)
        )}
      </div>

      {/* ══ FIELD ════════════════════════════════════════════════════════════ */}
      <SectionDivider title="Field Reports" label="Field Overview" accent="var(--navy)" />

      <div style={{ display: 'flex', gap: 'var(--gap-sm)' }}>
        <button
          className="btn btn-primary"
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          onClick={() => navigate('/forms')}
        >
          <Plus size={14} weight="bold" />
          New Completion Form
        </button>
        <button
          className="btn btn-secondary"
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          onClick={() => navigate('/jsa')}
        >
          <Plus size={14} weight="bold" />
          New JSA
        </button>
      </div>

      </div>
    </div>
  )
}
