import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SectionDivider from '../components/SectionDivider'
import {
  MagnifyingGlass, Lightning, Ruler, Seal, ClipboardText,
  CalendarBlank, HardHat, CheckCircle, Clipboard, PauseCircle } from '@phosphor-icons/react'
import BranchTabs from '../components/BranchTabs'
import { PROJECTS, TECHNICIANS } from '../data/mockData.js'
import { BRANCH_COLORS } from '../config/branches.js'
// ─── Config ────────────────────────────────────────────────────────────────────
const TYPE_ICON = {
  installation:  Lightning,
  'site-survey': Ruler,
  certification: Seal,
  'annual-test': ClipboardText,
  inspection:    MagnifyingGlass }

const TYPE_LABEL = {
  installation:  'Install',
  'site-survey': 'Site Survey',
  certification: 'Cert',
  'annual-test': 'Annual Test',
  inspection:    'Inspection' }

const PRIORITY_DOT = {
  high:   'var(--error)',
  medium: 'var(--warning)',
  low:    'var(--grey-tint-40)' }

const KANBAN_COLS = [
  { id: 'awarded',        label: 'Awarded',                Icon: CalendarBlank, accent: 'var(--purple)', stages: ['awarded']                        },
  { id: 'scheduled',      label: 'Upcoming',               Icon: CalendarBlank, accent: 'var(--purple-tint-20)', stages: ['scheduled']                      },
  { id: 'in-progress',    label: 'Active',                 Icon: HardHat,       accent: 'var(--warning)', stages: ['in-progress']                    },
  { id: 'pending-review', label: 'Pending Review',         Icon: Clipboard,     accent: 'var(--blue-tint-40)', stages: ['pending-review']                 },
  { id: 'complete',       label: 'Completed',              Icon: CheckCircle,   accent: 'var(--success)', stages: ['complete']                       },
  { id: 'postponed',      label: 'Postponed',              Icon: PauseCircle,   accent: 'var(--orange-tint-20)', stages: ['postponed', 'failed']            },
]

// ─── Helpers ───────────────────────────────────────────────────────────────────
function getTech(id) {
  return TECHNICIANS.find(t => t.id === id)?.name ?? '—'
}

function fmtDate(d) {
  if (!d) return ''
  const [, m, day] = d.split('-')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${months[parseInt(m, 10) - 1]} ${parseInt(day, 10)}`
}

// ─── Card ──────────────────────────────────────────────────────────────────────
function KanbanCard({ job, onClick }) {
  const Icon = TYPE_ICON[job.type] || Lightning
  const isFailed = job.stage === 'failed'

  return (
    <div className="kanban-card" onClick={onClick}>
      {/* Top row: type chip + priority dot */}
      <div className="kanban-card-top">
        <span className="kanban-card-type-chip">
          <Icon size={11} weight="bold" />
          {TYPE_LABEL[job.type] || job.type}
        </span>
        <span
          className="kanban-card-priority-dot"
          style={{ background: PRIORITY_DOT[job.priority] || PRIORITY_DOT.low }}
          title={`${job.priority} priority`}
        />
      </div>

      {/* Site name */}
      <div className="kanban-card-client">{job.name}</div>

      {/* Structure short */}
      {job.structure && (
        <div className="kanban-card-structure">
          {job.structure.split(' — ')[0]}
        </div>
      )}

      {/* Meta row */}
      <div className="kanban-card-meta-row">
        <span className="kanban-card-tech">{getTech(job.lead_tech_id)}</span>
        <span className="kanban-card-sep">·</span>
        <span className="kanban-card-date">{fmtDate(job.scheduled_date)}</span>
      </div>

      {/* Progress bar — show if in progress */}
      {job.progress > 0 && job.progress < 100 && (
        <div className="kanban-card-prog-wrap">
          <div className="kanban-card-prog-track">
            <div className="kanban-card-prog-fill" style={{ width: `${job.progress}%` }} />
          </div>
          <span className="kanban-card-prog-pct">{job.progress}%</span>
        </div>
      )}

      {/* Failed badge */}
      {isFailed && (
        <div className="kanban-card-failed-badge">Failed</div>
      )}

      {/* NFPA class badge */}
      {job.nfpa_class && (
        <div className="kanban-card-nfpa">NFPA Class {job.nfpa_class}</div>
      )}
    </div>
  )
}

// ─── Column ────────────────────────────────────────────────────────────────────
function KanbanColumn({ col, jobs, bc, onCardClick }) {
  const { label, Icon, accent } = col

  return (
    <div className="kanban-col">
      {/* Column header — branch bg color, per-stage accent stripe on top */}
      <div
        className="kanban-col-head"
        style={{
          background: bc.bgActive,
          borderTopColor: accent,
          transition: 'background 0.2s ease' }}
      >
        <div className="kanban-col-head-left">
          <Icon size={15} weight="bold" style={{ color: bc.textActive, flexShrink: 0 }} />
          <span className="kanban-col-label" style={{ color: bc.textActive }}>{label}</span>
        </div>
        <span
          className="kanban-col-count"
          style={{ background: 'rgba(255,255,255,0.25)', color: bc.textActive }}
        >
          {jobs.length}
        </span>
      </div>

      {/* Cards */}
      <div className="kanban-col-body">
        {jobs.length === 0 ? (
          <div className="kanban-col-empty">No items</div>
        ) : (
          jobs.map(job => (
            <KanbanCard
              key={job.id}
              job={job}
              onClick={() => onCardClick(job.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function Installs() {
  const navigate = useNavigate()
  const [branch, setBranch] = useState('lm')

  const bc = BRANCH_COLORS[branch] || BRANCH_COLORS.lm

  const lmCount   = PROJECTS.filter(p => p.branch === 'lm').length
  const boltCount = PROJECTS.filter(p => p.branch === 'bolt').length

  const branchJobs = PROJECTS.filter(p => p.branch === branch)

  return (
    <div className="page-content fade-in">
      <div className="page-stack">

      {/* ══ MANAGEMENT OVERVIEW ══════════════════════════════════════════════ */}
      <SectionDivider title="Project Pipeline" label="Management Overview" accent="var(--navy)" />

      {/* Branch selector */}
      <BranchTabs
        active={branch}
        onChange={setBranch}
        lmCount={lmCount}
        boltCount={boltCount}
      />

      {/* Kanban board */}
      <div className="kanban-board">
        {KANBAN_COLS.map(col => {
          const colJobs = branchJobs.filter(p => col.stages.includes(p.stage))
          return (
            <KanbanColumn
              key={col.id}
              col={col}
              jobs={colJobs}
              bc={bc}
              onCardClick={id => navigate(`/installations/${id}`)}
            />
          )
        })}
      </div>

      </div>
    </div>
  )
}
