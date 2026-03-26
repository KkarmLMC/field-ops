import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Buildings, MagnifyingGlass, ArrowRight, CheckCircle, Warning,
  HardHat, Lightning, Wrench, Plus, FileText, SquaresFour,
  ClipboardText, Clock, CaretDown, BookOpen,
} from '@phosphor-icons/react'
import BranchTabs from '../components/BranchTabs'
import SectionDivider from '../components/SectionDivider'
import { PROJECTS, TECHNICIANS } from '../data/mockData.js'
import { BRANCH_COLORS } from '../config/branches.js'

// ─── Stage config ─────────────────────────────────────────────────────────────
const STAGE_CFG = {
  'awarded':        { label: 'Awarded',        short: 'Awarded',   color: '#7C3AED', bg: '#F5F3FF' },
  'scheduled':      { label: 'Scheduled',      short: 'Upcoming',  color: '#6366F1', bg: '#EEF2FF' },
  'in-progress':    { label: 'In Progress',    short: 'Active',    color: '#D97706', bg: '#FFFBEB' },
  'pending-review': { label: 'Pending Review', short: 'In Review', color: '#2563EB', bg: '#EFF6FF' },
  'complete':       { label: 'Complete',       short: 'Complete',  color: '#16A34A', bg: '#F0FDF4' },
  'postponed':      { label: 'Postponed',      short: 'Postponed', color: '#EA580C', bg: '#FFF7ED' },
  'failed':         { label: 'Failed',         short: 'Failed',    color: '#DC2626', bg: '#FEF2F2' },
}

// ─── Type icons ───────────────────────────────────────────────────────────────
const TYPE_ICON = {
  installation:   Lightning,
  inspection:     MagnifyingGlass,
  'site-survey':  Wrench,
  certification:  ClipboardText,
  remediation:    Wrench,
}

function getTech(id) {
  return TECHNICIANS.find(t => t.id === id)?.name ?? '—'
}

function fmtDate(d) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${months[+m - 1]} ${+day}`
}

// ─── Section divider ──────────────────────────────────────────────────────────
// ─── Stat pill ────────────────────────────────────────────────────────────────
function StagePill({ stageKey, count, active, onClick }) {
  const cfg = STAGE_CFG[stageKey] || {}
  return (
    <button
      onClick={onClick}
      style={{
        flexShrink: 0, minWidth: 68, padding: '8px 12px', borderRadius: 10,
        background: active ? cfg.bg : 'var(--surface)',
        border: `1px solid ${active ? cfg.color + '55' : 'var(--border)'}`,
        cursor: 'pointer', textAlign: 'center', transition: 'all 0.14s',
        boxShadow: active ? `0 0 0 2px ${cfg.color}22` : 'none',
      }}
    >
      <div style={{ fontSize: 20, fontWeight: 700, color: active ? cfg.color : 'var(--text-1)', fontFamily: 'var(--mono)', lineHeight: 1 }}>
        {count}
      </div>
      <div style={{ fontSize: 10, fontWeight: 600, color: active ? cfg.color : 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 3 }}>
        {cfg.short || cfg.label}
      </div>
    </button>
  )
}

// ─── Management project row ───────────────────────────────────────────────────
function MgmtRow({ p, navigate }) {
  const cfg = STAGE_CFG[p.stage] || {}
  const Icon = TYPE_ICON[p.type] || Wrench
  const needsReview = p.completion_form_status === 'submitted'

  return (
    <div
      className="dash-job-row"
      style={{ alignItems: 'flex-start', paddingTop: 10, paddingBottom: 10 }}
      onClick={() => navigate(`/installations/${p.id}`)}
    >
      {/* Icon */}
      <div className="dash-job-icon" style={{ marginTop: 1 }}>
        {p.stage === 'complete'
          ? <CheckCircle size={15} />
          : p.stage === 'pending-review'
            ? <Warning size={15} />
            : <Icon size={15} />
        }
      </div>

      {/* Info */}
      <div className="dash-job-info" style={{ gap: 3 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div className="dash-job-name">{p.name}</div>
          {needsReview && (
            <span style={{
              fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
              background: '#2563EB', color: '#fff', padding: '2px 5px', borderRadius: 3,
              flexShrink: 0,
            }}>
              Review
            </span>
          )}
        </div>
        <div className="dash-job-meta">
          {p.customer_account}
          <span className="dash-job-dot">·</span>
          {p.city}, {p.state}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: '0.625rem', color: 'var(--text-3)' }}>
            {p.job_number}
          </span>
          <span style={{ fontSize: 9, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {getTech(p.lead_tech_id)}
          </span>
          {p.scheduled_date && (
            <>
              <span className="dash-job-dot">·</span>
              <span style={{ fontSize: 10, color: 'var(--text-3)' }}>{fmtDate(p.scheduled_date)}</span>
            </>
          )}
        </div>
        {/* Progress bar for in-progress */}
        {p.stage === 'in-progress' && p.progress > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <div style={{ flex: 1, height: 3, borderRadius: 2, background: 'var(--border-l)', overflow: 'hidden', maxWidth: 120 }}>
              <div style={{ height: '100%', width: `${p.progress}%`, background: cfg.color, borderRadius: 2 }} />
            </div>
            <span style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text-3)' }}>{p.progress}%</span>
          </div>
        )}
      </div>

      {/* Stage pill */}
      <div className="dash-status-pill" style={{ background: cfg.bg, color: cfg.color, flexShrink: 0 }}>
        {cfg.short || cfg.label}
      </div>
    </div>
  )
}

// ─── Field active project row ──────────────────────────────────────────────────
function FieldRow({ p, navigate }) {
  const cfg = STAGE_CFG['in-progress']
  const Icon = TYPE_ICON[p.type] || Wrench

  return (
    <div style={{
      padding: '12px 14px', borderBottom: '1px solid var(--border-l)',
      display: 'flex', gap: 12, alignItems: 'center',
    }}>
      {/* Left: icon */}
      <div style={{
        width: 36, height: 36, borderRadius: 8, flexShrink: 0,
        background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={16} style={{ color: cfg.color }} />
      </div>

      {/* Middle: info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 'var(--fs-md)', color: 'var(--text-1)', marginBottom: 2 }}>
          {p.name}
        </div>
        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-3)', marginBottom: 4 }}>
          {p.structure?.split(' — ')[0] || p.type}
          {p.nfpa_class && (
            <span style={{
              marginLeft: 6, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
              background: 'var(--navy)', color: '#fff', padding: '1px 5px', borderRadius: 3,
            }}>
              NFPA {p.nfpa_class}
            </span>
          )}
        </div>
        {/* Progress */}
        {p.progress > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'var(--border-l)', overflow: 'hidden', maxWidth: 140 }}>
              <div style={{ height: '100%', width: `${p.progress}%`, background: cfg.color, borderRadius: 2 }} />
            </div>
            <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: cfg.color, fontWeight: 600 }}>{p.progress}%</span>
          </div>
        )}
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
          Lead: {getTech(p.lead_tech_id)}
        </div>
      </div>

      {/* Right: action */}
      <div style={{ display: 'flex', flexDirection: 'row', gap: 6, flexShrink: 0, alignItems: 'center' }}>
        <button
          className="btn btn-black"
          style={{ fontSize: 13, padding: '8px 14px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5 }}
          onClick={e => { e.stopPropagation(); navigate(`/daily-field-log?project=${p.id}`) }}
        >
          <ClipboardText size={14} /> DFL
        </button>
        <button
          className="btn btn-black"
          style={{ fontSize: 13, padding: '8px 14px', whiteSpace: 'nowrap' }}
          onClick={e => { e.stopPropagation(); navigate(`/installations/${p.id}`) }}
        >
          View
        </button>
      </div>
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ message }) {
  return (
    <div style={{
      padding: '28px 16px', textAlign: 'center',
      color: 'var(--text-3)', fontSize: 'var(--fs-md)',
    }}>
      {message}
    </div>
  )
}

// ─── Field pipeline mini-row ──────────────────────────────────────────────────
function FieldMiniRow({ p, navigate, stageKey }) {
  const cfg = STAGE_CFG[stageKey] || {}
  const Icon = TYPE_ICON[p.type] || Wrench

  return (
    <div
      style={{
        padding: '10px 14px', borderBottom: '1px solid var(--border-l)',
        display: 'flex', gap: 10, alignItems: 'center', cursor: 'pointer',
      }}
      onClick={() => navigate(`/installations/${p.id}`)}
    >
      <div className="dash-job-icon">
        <Icon size={15} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 'var(--fs-sm)', color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {p.name}
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>
          {getTech(p.lead_tech_id)}{p.scheduled_date ? ` · ${fmtDate(p.scheduled_date)}` : ''}
        </div>
        {stageKey === 'in-progress' && p.progress > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
            <div style={{ flex: 1, height: 3, borderRadius: 2, background: 'var(--border-l)', overflow: 'hidden', maxWidth: 80 }}>
              <div style={{ height: '100%', width: `${p.progress}%`, background: cfg.color, borderRadius: 2 }} />
            </div>
            <span style={{ fontSize: 9, fontFamily: 'var(--mono)', color: cfg.color }}>{p.progress}%</span>
          </div>
        )}
      </div>
      <ArrowRight size={12} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Installations() {
  const navigate = useNavigate()
  const [branch, setBranch]         = useState('lm')
  const [fieldBranch, setFieldBranch] = useState('lm')
  const [stageFilter, setStageFilter] = useState('all')
  const [search, setSearch]         = useState('')
  const [searchOpen, setSearchOpen] = useState(false)

  // ── Data ──────────────────────────────────────────────────────────────────
  const branchProjects = PROJECTS.filter(p => p.branch === branch && !p.archived)

  const stageCounts = ['awarded','scheduled','in-progress','pending-review','complete','postponed','failed']
    .reduce((acc, s) => ({ ...acc, [s]: branchProjects.filter(p => p.stage === s).length }), {})

  const filtered = branchProjects.filter(p => {
    if (stageFilter !== 'all' && p.stage !== stageFilter) return false
    if (search) {
      const q = search.toLowerCase()
      if (!p.name.toLowerCase().includes(q) &&
          !p.customer.toLowerCase().includes(q) &&
          !p.job_number.toLowerCase().includes(q)) return false
    }
    return true
  })

  // Field Overview — pipeline cards
  const fieldProjects = PROJECTS.filter(p => p.branch === fieldBranch && !p.archived)
  const upcomingProjects     = fieldProjects.filter(p => p.stage === 'scheduled')
  const activeProjects       = fieldProjects.filter(p => p.stage === 'in-progress')
  const pendingReviewProjects = fieldProjects.filter(p => p.stage === 'pending-review')

  const bc = BRANCH_COLORS[branch]
  const headStyle = { background: bc.bgActive, color: bc.textActive, transition: 'background 0.2s, color 0.2s' }

  const fieldBc = BRANCH_COLORS[fieldBranch]
  const fieldHeadStyle = { background: fieldBc.bgActive, color: fieldBc.textActive, transition: 'background 0.2s, color 0.2s' }

  const lmCount         = PROJECTS.filter(p => p.branch === 'lm').length
  const boltCount       = PROJECTS.filter(p => p.branch === 'bolt').length

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="page-content fade-in">
      <div className="page-stack">

        {/* ══ MANAGEMENT OVERVIEW ══════════════════════════════════════════════ */}
        <SectionDivider title="Installations" label="Management Overview" accent="var(--navy)" />

        {/* Branch selector */}
        <BranchTabs
          active={branch}
          onChange={val => { setBranch(val); setStageFilter('all'); setSearch('') }}
          lmCount={lmCount}
          boltCount={boltCount}
        />

        {/* Stage stat pills */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
          {['awarded','scheduled','in-progress','pending-review','complete'].map(s => (
            <StagePill
              key={s}
              stageKey={s}
              count={stageCounts[s] || 0}
              active={stageFilter === s}
              onClick={() => setStageFilter(stageFilter === s ? 'all' : s)}
            />
          ))}
          {/* Show postponed/failed together if any exist */}
          {(stageCounts['postponed'] > 0 || stageCounts['failed'] > 0) && (
            <StagePill
              stageKey="failed"
              count={(stageCounts['postponed'] || 0) + (stageCounts['failed'] || 0)}
              active={stageFilter === 'failed' || stageFilter === 'postponed'}
              onClick={() => setStageFilter(stageFilter === 'failed' ? 'all' : 'failed')}
            />
          )}
        </div>

        {/* Quick nav tiles */}
        <div className="dash-tiles">
          <button
            className="dash-tile"
            style={{ '--tile-color': '#000000', '--tile-bg': '#F3F4F6' }}
            onClick={() => navigate('/installations/pipeline')}
          >
            <div className="dash-tile-icon"><SquaresFour size={18} /></div>
            <div className="dash-tile-text">
              <div className="dash-tile-label">Project Pipeline</div>
              <div className="dash-tile-sub">{stageCounts['in-progress'] || 0} active</div>
            </div>
            <ArrowRight size={14} className="dash-tile-arrow" />
          </button>
          <button
            className="dash-tile"
            style={{ '--tile-color': '#000000', '--tile-bg': '#F3F4F6' }}
            onClick={() => navigate('/installations/field-logs')}
          >
            <div className="dash-tile-icon"><BookOpen size={18} /></div>
            <div className="dash-tile-text">
              <div className="dash-tile-label">Field Logs</div>
              <div className="dash-tile-sub">Daily activity</div>
            </div>
            <ArrowRight size={14} className="dash-tile-arrow" />
          </button>
          <button
            className="dash-tile"
            style={{ '--tile-color': '#000000', '--tile-bg': '#F3F4F6' }}
            onClick={() => navigate('/installations/field-reports')}
          >
            <div className="dash-tile-icon"><FileText size={18} /></div>
            <div className="dash-tile-text">
              <div className="dash-tile-label">Field Reports</div>
              <div className="dash-tile-sub">Submitted forms</div>
            </div>
            <ArrowRight size={14} className="dash-tile-arrow" />
          </button>
        </div>

        {/* All Projects list */}
        <div className="dash-card">
          <div className="dash-card-head" style={headStyle}>
            <span className="dash-card-title">
              <Buildings size={14} />
              {stageFilter !== 'all'
                ? `${STAGE_CFG[stageFilter]?.label || stageFilter} Projects`
                : 'All Projects'
              }
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="dash-card-meta">{filtered.length}</span>
              <button
                style={{
                  background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 6,
                  padding: '3px 7px', cursor: 'pointer', display: 'flex', alignItems: 'center',
                  color: 'inherit',
                }}
                onClick={() => setSearchOpen(o => !o)}
              >
                <MagnifyingGlass size={13} />
              </button>
              {stageFilter !== 'all' && (
                <button
                  style={{
                    background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 6,
                    padding: '3px 8px', cursor: 'pointer', fontSize: 11, fontWeight: 600,
                    color: 'inherit', letterSpacing: '0.02em',
                  }}
                  onClick={() => setStageFilter('all')}
                >
                  Clear ×
                </button>
              )}
            </div>
          </div>

          {/* Search bar */}
          {searchOpen && (
            <div style={{
              padding: '8px 14px', borderBottom: '1px solid var(--border-l)',
              display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface)',
            }}>
              <MagnifyingGlass size={14} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
              <input
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search projects, customers, job #…"
                style={{
                  flex: 1, border: 'none', outline: 'none', background: 'none',
                  fontFamily: 'var(--font)', fontSize: 'var(--fs-md)', color: 'var(--text-1)',
                }}
              />
              {search && (
                <button
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 2 }}
                  onClick={() => setSearch('')}
                >×</button>
              )}
            </div>
          )}

          <div>
            {filtered.length === 0 ? (
              <EmptyState message="No projects match your filters" />
            ) : filtered.map(p => (
              <MgmtRow key={p.id} p={p} navigate={navigate} />
            ))}
          </div>
        </div>

        {/* ══ FIELD ════════════════════════════════════════════════════════════ */}
        <SectionDivider title="Installations" label="Field Overview" accent="var(--navy)" />

        {/* Field branch selector */}
        <BranchTabs
          active={fieldBranch}
          onChange={setFieldBranch}
          lmCount={lmCount}
          boltCount={boltCount}
        />

        {/* Pipeline 3-card grid */}
        <div className="field-pipeline-grid">
          {/* Upcoming */}
          <div className="dash-card" style={{ margin: 0 }}>
            <div className="dash-card-head" style={{ ...fieldHeadStyle, padding: '10px 12px' }}>
              <span className="dash-card-title" style={{ fontSize: 12, gap: 5 }}>
                <Clock size={12} />
                Upcoming
              </span>
              <span className="dash-card-meta">{upcomingProjects.length}</span>
            </div>
            {upcomingProjects.length === 0 ? (
              <EmptyState message="None" />
            ) : upcomingProjects.map(p => (
              <FieldMiniRow key={p.id} p={p} navigate={navigate} stageKey="scheduled" />
            ))}
          </div>

          {/* Active */}
          <div className="dash-card" style={{ margin: 0 }}>
            <div className="dash-card-head" style={{ ...fieldHeadStyle, padding: '10px 12px' }}>
              <span className="dash-card-title" style={{ fontSize: 12, gap: 5 }}>
                <span className="live-dot" />
                Active
              </span>
              <span className="dash-card-meta">{activeProjects.length}</span>
            </div>
            {activeProjects.length === 0 ? (
              <EmptyState message="None" />
            ) : activeProjects.map(p => (
              <FieldMiniRow key={p.id} p={p} navigate={navigate} stageKey="in-progress" />
            ))}
          </div>

          {/* Pending Review */}
          <div className="dash-card" style={{ margin: 0 }}>
            <div className="dash-card-head" style={{ ...fieldHeadStyle, padding: '10px 12px' }}>
              <span className="dash-card-title" style={{ fontSize: 12, gap: 5 }}>
                <Warning size={12} />
                In Review
              </span>
              <span className="dash-card-meta">{pendingReviewProjects.length}</span>
            </div>
            {pendingReviewProjects.length === 0 ? (
              <EmptyState message="None" />
            ) : pendingReviewProjects.map(p => (
              <FieldMiniRow key={p.id} p={p} navigate={navigate} stageKey="pending-review" />
            ))}
          </div>
        </div>

        {/* Field quick actions */}
        <div className="dash-tiles">
          {[
            { Icon: ClipboardText, label: 'Daily Log',    sub: 'Log today\'s work',   path: '/daily-field-log' },
            { Icon: BookOpen,      label: 'JSA',          sub: 'Safety analysis',      path: '/forms/jsa'       },
            { Icon: FileText,      label: 'Report Form',  sub: 'Submit a report',      path: '/forms'           },
          ].map(a => (
            <button
              key={a.path}
              className="dash-tile"
              onClick={() => navigate(a.path)}
              style={{ '--tile-color': '#000000', '--tile-bg': '#F3F4F6' }}
            >
              <div className="dash-tile-icon"><a.Icon size={18} /></div>
              <div className="dash-tile-text">
                <div className="dash-tile-label">{a.label}</div>
                <div className="dash-tile-sub">{a.sub}</div>
              </div>
              <ArrowRight size={14} className="dash-tile-arrow" />
            </button>
          ))}
        </div>

      </div>
    </div>
  )
}
