import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Buildings, MagnifyingGlass, ArrowRight, CheckCircle, Warning,
  HardHat, Lightning, Wrench, Plus, FileText, SquaresFour,
  ClipboardText, Clock, CaretDown, BookOpen } from '@phosphor-icons/react'
import BranchTabs from '../components/BranchTabs'
import SectionDivider from '../components/SectionDivider'
import { PROJECTS, TECHNICIANS } from '../data/mockData.js'
import { BRANCH_COLORS } from '../config/branches.js'
import { projectStage } from '../lib/statusColors.js'

const today = () => { const d = new Date(); d.setHours(0,0,0,0); return d }

// ─── Stage config — thin wrapper over projectStage() tokens ───────────────────
// `short` label is Installations-specific (not in the shared token) so we extend here
const STAGE_CFG = {
  'scheduled':      { ...projectStage('scheduled'),      short: 'Upcoming'  },
  'in-progress':    { ...projectStage('in-progress'),    short: 'Active'    },
  'pending-review': { ...projectStage('pending-review'), short: 'In Review' },
  'complete':       { ...projectStage('complete'),        short: 'Complete'  },
  'postponed':      { ...projectStage('postponed'),      short: 'Postponed' },
  'failed':         { ...projectStage('failed'),         short: 'Failed'    },
}

// ─── Type icons ───────────────────────────────────────────────────────────────
const TYPE_ICON = {
  installation:  Lightning,
  inspection:    MagnifyingGlass,
  'site-survey': Wrench,
  certification: ClipboardText,
  remediation:   Wrench }

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
  const cfg = projectStage(stageKey) || {}
  return (
    <button
      onClick={onClick}
      style={{
        flexShrink: 0, minWidth: 68, padding: '8px 12px', borderRadius: 'var(--radius-m)',
        background: active ? cfg.bg : 'var(--surface-base)',
        border: 'none',
        cursor: 'pointer', textAlign: 'center', transition: 'all 0.14s' }}
    >
      <div style={{ fontSize: 'calc(var(--text-xxl) * 1.2)', fontWeight: 'var(--fw-bold)', color: active ? cfg.color : 'var(--text-primary)', fontFamily: 'var(--font-mono)', lineHeight: 'var(--leading-none)' }}>
        {count}
      </div>
      <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-semibold)', color: active ? cfg.color : 'var(--text-primary)', marginTop: 'var(--space-2xs)' }}>
        {cfg.short || cfg.label}
      </div>
    </button>
  )
}

// ─── Management project row ───────────────────────────────────────────────────
function MgmtRow({ p, navigate }) {
  const cfg = projectStage(p.stage) || {}
  const Icon = TYPE_ICON[p.type] || Wrench
  const needsReview = p.completion_form_status === 'submitted'

  return (
    <div
      className="page-content fade-in"
      className="installations-86dc"
      onClick={() => navigate(`/installations/${p.id}`)}
    >
      {/* Icon */}
      <div className="dash-job-icon" style={{ marginTop: 1 }}>
        {p.stage === 'complete'
          ? <CheckCircle size="0.9375rem" />
          : p.stage === 'pending-review'
            ? <Warning size="0.9375rem" />
            : <Icon size="0.9375rem" />
        }
      </div>

      {/* Info */}
      <div className="dash-job-info" style={{ gap: 'var(--space-3xs)' }}>
        <div className="installations-d7ff">
          <div className="dash-job-name">{p.name}</div>
          {needsReview && p.stage !== 'pending-review' && (
            <span style={{
              fontSize: 'var(--text-2xs)', fontWeight: 'var(--fw-bold)', letterSpacing: 'var(--tracking-wide)', textTransform: 'uppercase',
              background: 'var(--state-info)', color: 'var(--color-white)', padding: 'var(--space-3xs) var(--space-xs)', borderRadius: 'var(--radius-xs)',
              flexShrink: 0 }}>
              Review
            </span>
          )}
        </div>
        <div className="dash-job-meta">
          {p.customer_account}
          <span className="dash-job-dot">·</span>
          {p.city}, {p.state}
        </div>
        <div className="installations-8a89">
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xs)', color: 'var(--text-muted)' }}>
            {p.job_number}
          </span>
          <span className="installations-144a">
            {getTech(p.lead_tech_id)}
          </span>
          {p.scheduled_date && (
            <>
              <span className="dash-job-dot">·</span>
              <span className="meta-text">{fmtDate(p.scheduled_date)}</span>
            </>
          )}
        </div>
        {/* Progress bar for in-progress */}
        {p.stage === 'in-progress' && p.progress > 0 && (
          <div className="installations-35f5">
            <div className="installations-4bba">
              <div style={{ height: '100%', width: `${p.progress}%`, background: cfg.color, borderRadius: 2 }} />
            </div>
            <span className="text-xs-mono">{p.progress}%</span>
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
    <div className="installations-5a72">
      {/* Left: icon */}
      <Icon size="1rem" style={{ color: cfg.color }} />

      {/* Middle: info */}
      <div className="content-body">
        <div className="installations-1058">
          {p.name}
        </div>
        <div className="meta-text mb-s">
          {p.structure?.split(' — ')[0] || p.type}
          {p.nfpa_class && (
            <span style={{
              marginLeft: 'var(--space-xs)', fontSize: 'var(--text-2xs)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)',
              background: 'var(--brand-primary)', color: 'var(--color-white)', padding: 'var(--space-3xs) var(--space-xs)', borderRadius: 'var(--radius-xs)' }}>
              NFPA {p.nfpa_class}
            </span>
          )}
        </div>
        {/* Progress */}
        {p.progress > 0 && (
          <div className="installations-c222">
            <div className="installations-e0b1">
              <div style={{ height: '100%', width: `${p.progress}%`, background: cfg.color, borderRadius: 2 }} />
            </div>
            <span style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', color: cfg.color, fontWeight: 'var(--fw-semibold)' }}>{p.progress}%</span>
          </div>
        )}
        <div className="meta-text meta-text--mt">
          Lead: {getTech(p.lead_tech_id)}
        </div>
      </div>

      {/* Right: action */}
      <div className="installations-5a1f">
        <button
          className="btn btn-black"
          className="installations-c392"
          onClick={e => { e.stopPropagation(); navigate(`/daily-field-log?project=${p.id}`) }}
        >
          <ClipboardText size="0.875rem" /> DFL
        </button>
        <button
          className="btn btn-black"
          className="installations-06cd"
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
    <div className="installations-6d11">
      {message}
    </div>
  )
}

// ─── Field pipeline mini-row ──────────────────────────────────────────────────
function FieldMiniRow({ p, navigate, stageKey }) {
  const cfg = projectStage(stageKey) || {}
  const Icon = TYPE_ICON[p.type] || Wrench

  return (
    <div
      className="installations-e74b"
      onClick={() => navigate(`/installations/${p.id}`)}
    >
      <div className="dash-job-icon">
        <Icon size="0.9375rem" />
      </div>
      <div className="content-body">
        <div className="installations-8617">
          {p.name}
        </div>
        <div className="meta-text">
          {getTech(p.lead_tech_id)}{p.scheduled_date ? ` · ${fmtDate(p.scheduled_date)}` : ''}
        </div>
        {stageKey === 'in-progress' && p.progress > 0 && (
          <div className="installations-45c8">
            <div className="installations-7bed">
              <div style={{ height: '100%', width: `${p.progress}%`, background: cfg.color, borderRadius: 2 }} />
            </div>
            <span style={{ fontSize: 'var(--text-2xs)', fontFamily: 'var(--font-mono)', color: cfg.color }}>{p.progress}%</span>
          </div>
        )}
      </div>
      <ArrowRight size="0.75rem" className="row-item__caret" />
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

  const stageCounts = ['scheduled','in-progress','pending-review','complete','postponed','failed']
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
        <SectionDivider title="Installations" label="Management Overview" accent="var(--brand-primary)" />

        {/* Branch selector */}
        <BranchTabs
          active={branch}
          onChange={val => { setBranch(val); setStageFilter('all'); setSearch('') }}
          lmCount={lmCount}
          boltCount={boltCount}
        />

        {/* Stage stat pills */}
        <div className="installations-1a27">
          {['scheduled','in-progress','pending-review','complete'].map(s => (
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
        <div className="nav-card-grid">
          <button
            className="card nav-card"
            style={{ '--tile-color': 'var(--color-black)', '--tile-bg': 'var(--bg)' }}
            onClick={() => navigate('/installations/pipeline')}
          >
            <div className="nav-card__icon"><SquaresFour size="1.125rem" /></div>
            <div className="nav-card__text">
              <div className="nav-card__label">Project Pipeline</div>
              <div className="nav-card__sub">{stageCounts['in-progress'] || 0} active</div>
            </div>
            <ArrowRight size="0.875rem" className="nav-card__arrow" />
          </button>
          <button
            className="card nav-card"
            style={{ '--tile-color': 'var(--color-black)', '--tile-bg': 'var(--bg)' }}
            onClick={() => navigate('/installations/field-logs')}
          >
            <div className="nav-card__icon"><BookOpen size="1.125rem" /></div>
            <div className="nav-card__text">
              <div className="nav-card__label">Field Logs</div>
              <div className="nav-card__sub">Daily activity</div>
            </div>
            <ArrowRight size="0.875rem" className="nav-card__arrow" />
          </button>
          <button
            className="card nav-card"
            style={{ '--tile-color': 'var(--color-black)', '--tile-bg': 'var(--bg)' }}
            onClick={() => navigate('/installations/field-reports')}
          >
            <div className="nav-card__icon"><FileText size="1.125rem" /></div>
            <div className="nav-card__text">
              <div className="nav-card__label">Field Reports</div>
              <div className="nav-card__sub">Submitted forms</div>
            </div>
            <ArrowRight size="0.875rem" className="nav-card__arrow" />
          </button>
        </div>

        {/* All Projects list */}
        <div className="card list-card">
          <div className="list-card__header" style={headStyle}>
            <span className="list-card__title">
              <Buildings size="0.875rem" />
              {stageFilter !== 'all'
                ? `${STAGE_CFG[stageFilter]?.label || stageFilter} Projects`
                : 'All Projects'
              }
            </span>
            <div className="installations-2bce">
              <span className="list-card__meta">{filtered.length}</span>
              <button
                className="installations-ef52"
                onClick={() => setSearchOpen(o => !o)}
              >
                <MagnifyingGlass size="0.8125rem" />
              </button>
              {stageFilter !== 'all' && (
                <button
                  style={{
                    background: 'var(--overlay-white-soft)', borderRadius: 'var(--radius-s)',
                    padding: 'var(--space-2xs) var(--space-s)', cursor: 'pointer', fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-semibold)',
                    color: 'inherit', letterSpacing: 'var(--tracking-tight)' }}
                  onClick={() => setStageFilter('all')}
                >
                  Clear ×
                </button>
              )}
            </div>
          </div>

          {/* Search bar */}
          {searchOpen && (
            <div className="installations-5086">
              <MagnifyingGlass size="0.875rem" className="row-item__caret" />
              <input
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search projects, customers, job #…"
                className="installations-3fae"
              />
              {search && (
                <button
                  className="installations-cd46"
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
        <SectionDivider title="Installations" label="Field Overview" accent="var(--brand-primary)" />

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
          <div className="card list-card" style={{ margin: 0 }}>
            <div className="list-card__header" style={{ ...fieldHeadStyle, padding: 'var(--space-m) var(--space-l)' }}>
              <span className="list-card__title">
                <Clock size="0.75rem" />
                Upcoming
              </span>
              <span className="list-card__meta">{upcomingProjects.length}</span>
            </div>
            {upcomingProjects.length === 0 ? (
              <EmptyState message="None" />
            ) : upcomingProjects.map(p => (
              <FieldMiniRow key={p.id} p={p} navigate={navigate} stageKey="scheduled" />
            ))}
          </div>

          {/* Active */}
          <div className="card list-card" style={{ margin: 0 }}>
            <div className="list-card__header" style={{ ...fieldHeadStyle, padding: 'var(--space-m) var(--space-l)' }}>
              <span className="list-card__title">
                <span className="live-dot" />
                Active
              </span>
              <span className="list-card__meta">{activeProjects.length}</span>
            </div>
            {activeProjects.length === 0 ? (
              <EmptyState message="None" />
            ) : activeProjects.map(p => (
              <FieldMiniRow key={p.id} p={p} navigate={navigate} stageKey="in-progress" />
            ))}
          </div>

          {/* Pending Review */}
          <div className="card list-card" style={{ margin: 0 }}>
            <div className="list-card__header" style={{ ...fieldHeadStyle, padding: 'var(--space-m) var(--space-l)' }}>
              <span className="list-card__title">
                <Warning size="0.75rem" />
                In Review
              </span>
              <span className="list-card__meta">{pendingReviewProjects.length}</span>
            </div>
            {pendingReviewProjects.length === 0 ? (
              <EmptyState message="None" />
            ) : pendingReviewProjects.map(p => (
              <FieldMiniRow key={p.id} p={p} navigate={navigate} stageKey="pending-review" />
            ))}
          </div>
        </div>

        {/* Field quick actions */}
        <div className="nav-card-grid">
          {[
            { Icon: ClipboardText, label: 'Daily Log',    sub: 'Log today\'s work',   path: '/daily-field-log' },
            { Icon: BookOpen,      label: 'JSA',          sub: 'Safety analysis',      path: '/forms/jsa'       },
            { Icon: FileText,      label: 'Report Form',  sub: 'Submit a report',      path: '/forms'           },
          ].map(a => (
            <button
              key={a.path}
              className="card nav-card"
              onClick={() => navigate(a.path)}
              style={{ '--tile-color': 'var(--color-black)', '--tile-bg': 'var(--bg)' }}
            >
              <div className="nav-card__icon"><a.Icon size="1.125rem" /></div>
              <div className="nav-card__text">
                <div className="nav-card__label">{a.label}</div>
                <div className="nav-card__sub">{a.sub}</div>
              </div>
              <ArrowRight size="0.875rem" className="nav-card__arrow" />
            </button>
          ))}
        </div>

      </div>
    </div>
  )
}
