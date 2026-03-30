import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MagnifyingGlass, ClipboardText, Plus, CheckCircle,
  Clock, Warning, CalendarBlank,
} from '@phosphor-icons/react'
import BranchTabs from '../components/BranchTabs'
import SectionDivider from '../components/SectionDivider'
import { PROJECTS, TECHNICIANS } from '../data/mockData.js'
import { BRANCH_COLORS } from '../config/branches.js'

// ─── Config ───────────────────────────────────────────────────────────────────
const INSPECT_TYPES = ['inspection', 'annual-test']

const STAGE_CFG = {
  'in-progress': { label: 'Active',     color: '#C2410C', bg: '#FFF7ED' },
  scheduled:     { label: 'Scheduled',  color: '#4F46E5', bg: '#EEF2FF' },
  complete:      { label: 'Complete',   color: '#15803D', bg: '#F0FDF4' },
  failed:        { label: 'Failed',     color: '#B91C1C', bg: '#FEF2F2' },
}

const TYPE_ICON = {
  inspection:    MagnifyingGlass,
  'annual-test': ClipboardText,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getTech(id) {
  return TECHNICIANS.find(t => t.id === id)?.name ?? '—'
}

function fmtDate(d) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${months[parseInt(m,10)-1]} ${parseInt(day,10)}, ${y}`
}

// ─── Inspection row ───────────────────────────────────────────────────────────
function InspectionRow({ job, navigate }) {
  const sc  = STAGE_CFG[job.stage] || STAGE_CFG.scheduled
  const Icon = TYPE_ICON[job.type] || MagnifyingGlass
  return (
    <div className="dash-job-row" onClick={() => navigate(`/installations/${job.id}`)}>
      <div className="dash-job-icon" style={{ background: sc.bg }}>
        <Icon size={16} style={{ color: sc.color }} />
      </div>
      <div className="dash-job-info">
        <div className="dash-job-name">{job.name}</div>
        <div className="dash-job-meta">
          {getTech(job.lead_tech_id)}
          <span className="dash-job-dot">·</span>
          {fmtDate(job.scheduled_date)}
          <span className="dash-job-dot">·</span>
          {job.job_number}
        </div>
      </div>
      <div className="dash-status-pill" style={{ background: sc.bg, color: sc.color }}>
        {sc.label}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Inspections() {
  const navigate = useNavigate()
  const [branch,       setBranch]       = useState('lm')
  const [stageFilter,  setStageFilter]  = useState('all')
  const [search,       setSearch]       = useState('')
  const [searchOpen,   setSearchOpen]   = useState(false)

  const bc = BRANCH_COLORS[branch] || BRANCH_COLORS.lm

  const lmCount         = PROJECTS.filter(p => p.branch === 'lm'         && INSPECT_TYPES.includes(p.type)).length
  const boltCount       = PROJECTS.filter(p => p.branch === 'bolt'        && INSPECT_TYPES.includes(p.type)).length

  const branchJobs = PROJECTS.filter(p => p.branch === branch && INSPECT_TYPES.includes(p.type))

  const stageCounts = {
    'in-progress': branchJobs.filter(p => p.stage === 'in-progress').length,
    scheduled:     branchJobs.filter(p => p.stage === 'scheduled').length,
    complete:      branchJobs.filter(p => p.stage === 'complete').length,
    failed:        branchJobs.filter(p => p.stage === 'failed').length,
  }

  const filtered = branchJobs.filter(p =>
    (stageFilter === 'all' || p.stage === stageFilter) &&
    (search === '' || p.name.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="page-content fade-in">
      <div className="page-stack">

        {/* ══ MANAGEMENT OVERVIEW ═══════════════════════════════════════════ */}
        <SectionDivider title="Inspections" label="Management Overview" accent="var(--navy)" />

        <BranchTabs
          active={branch}
          onChange={val => { setBranch(val); setStageFilter('all'); setSearch('') }}
          lmCount={lmCount}
          boltCount={boltCount}
        />

        {/* Summary stat tiles */}
        <div className="dfl-summary-strip">
          {[
            { label: 'Active',    value: stageCounts['in-progress'], icon: <Clock size={15} weight="bold" />,        alert: stageCounts['in-progress'] > 0 },
            { label: 'Scheduled', value: stageCounts.scheduled,      icon: <CalendarBlank size={15} weight="bold" /> },
            { label: 'Complete',  value: stageCounts.complete,        icon: <CheckCircle size={15} weight="bold" />   },
            { label: 'Failed',    value: stageCounts.failed,          icon: <Warning size={15} weight="bold" />,      alert: stageCounts.failed > 0 },
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
                <div className="dfl-summary-value" style={{ color: s.alert && s.value > 0 ? 'var(--warning-text)' : 'var(--black)' }}>
                  {s.value}
                </div>
                <div className="dfl-summary-label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Stage filter pills */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['all', 'in-progress', 'scheduled', 'complete', 'failed'].map(key => {
            const cfg   = key === 'all' ? { label: 'All', color: '#374151', bg: '#F3F4F6' } : STAGE_CFG[key]
            const count = key === 'all' ? branchJobs.length : (stageCounts[key] || 0)
            const active = stageFilter === key
            return (
              <button
                key={key}
                onClick={() => setStageFilter(active && key !== 'all' ? 'all' : key)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '4px 10px', borderRadius: 20, cursor: 'pointer',
                  border: active ? `1.5px solid ${cfg.color}` : '1.5px solid var(--border)',
                  background: active ? cfg.bg : 'var(--white)',
                  color: active ? cfg.color : 'var(--black)',
                  fontSize: 'var(--text-xs)', fontWeight: active ? 600 : 500,
                  transition: 'all 0.15s',
                }}
              >
                {cfg.label}
                <span style={{
                  background: active ? cfg.color : 'var(--border)',
                  color: active ? '#fff' : 'var(--black)',
                  borderRadius: 10, padding: '0 5px',
                  fontSize: 'var(--text-2xs)', fontWeight: 700, lineHeight: '16px',
                }}>{count}</span>
              </button>
            )
          })}

          {/* Search */}
          <div
            className={`list-search-wrap${searchOpen ? ' list-search-wrap--open' : ''}`}
            style={{ marginLeft: 'auto' }}
            onClick={() => { if (!searchOpen) setSearchOpen(true) }}
          >
            <span className="list-search-icon"><MagnifyingGlass size={15} /></span>
            <input
              placeholder="Search inspections…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onBlur={() => { if (!search) setSearchOpen(false) }}
              ref={el => { if (searchOpen && el) el.focus() }}
            />
            {search && (
              <button className="search-clear-btn" onClick={e => { e.stopPropagation(); setSearch(''); setSearchOpen(false) }}>✕</button>
            )}
          </div>
        </div>

        {/* Inspections list */}
        <div className="dash-card">
          <div
            className="dash-card-head"
            style={{ background: bc.bgActive, color: bc.textActive, transition: 'background 0.2s ease' }}
          >
            <span className="dash-card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <MagnifyingGlass size={14} />
              Inspections
            </span>
            <span className="dash-card-meta">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
          </div>
          <div>
            {filtered.length === 0 ? (
              <div className="dfl-empty-state">
                <MagnifyingGlass size={28} weight="thin" style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                <div>No inspections match these filters</div>
              </div>
            ) : (
              filtered.map(job => <InspectionRow key={job.id} job={job} navigate={navigate} />)
            )}
          </div>
        </div>

        {/* ══ FIELD ══════════════════════════════════════════════════════════ */}
        <SectionDivider title="Inspections" label="Field Overview" accent="var(--navy)" />

        <div style={{ display: 'flex', gap: 'var(--gap-sm)' }}>
          <button
            className="btn btn-primary"
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            onClick={() => navigate('/daily-field-log')}
          >
            <Plus size={14} weight="bold" />
            New Field Log
          </button>
          <button
            className="btn btn-secondary"
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            onClick={() => navigate('/forms/jsa')}
          >
            <Plus size={14} weight="bold" />
            New JSA
          </button>
        </div>

      </div>
    </div>
  )
}
