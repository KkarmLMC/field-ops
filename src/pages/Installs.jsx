import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MagnifyingGlass, Lightning, Ruler, Seal, ClipboardText,
  CalendarBlank, HardHat, CheckCircle, Clipboard,
} from '@phosphor-icons/react'
import BranchTabs from '../components/BranchTabs'
import { JOBS, TECHNICIANS } from '../data/mockData.js'
import { BRANCH_COLORS } from '../config/branches.js'

// ─── Config ────────────────────────────────────────────────────────────────────
const TYPE_ICON = {
  installation:  Lightning,
  'site-survey': Ruler,
  certification: Seal,
  'annual-test': ClipboardText,
  inspection:    MagnifyingGlass,
}

const TYPE_LABEL = {
  installation:  'Install',
  'site-survey': 'Site Survey',
  certification: 'Cert',
  'annual-test': 'Annual Test',
  inspection:    'Inspection',
}

const PRIORITY_DOT = {
  high:   '#EF4444',
  medium: '#F59E0B',
  low:    '#D1D5DB',
}

const KANBAN_COLS = [
  { id: 'scheduled',     label: 'Scheduled',     Icon: CalendarBlank, statuses: ['scheduled']           },
  { id: 'active',        label: 'Active Install', Icon: HardHat,       statuses: ['active']              },
  { id: 'ul-inspection', label: 'UL Inspection',  Icon: Clipboard,     statuses: ['ul-inspection']       },
  { id: 'completed',     label: 'Completed',      Icon: CheckCircle,   statuses: ['completed', 'failed'] },
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
  const isFailed = job.status === 'failed'

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

      {/* Client name */}
      <div className="kanban-card-client">{job.client}</div>

      {/* Structure short */}
      {job.structure && (
        <div className="kanban-card-structure">
          {job.structure.split(' — ')[0]}
        </div>
      )}

      {/* Meta row */}
      <div className="kanban-card-meta-row">
        <span className="kanban-card-tech">{getTech(job.assignedTo)}</span>
        <span className="kanban-card-sep">·</span>
        <span className="kanban-card-date">{fmtDate(job.scheduledDate)}</span>
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
      {job.nfpaClass && (
        <div className="kanban-card-nfpa">NFPA Class {job.nfpaClass}</div>
      )}
    </div>
  )
}

// ─── Column ────────────────────────────────────────────────────────────────────
function KanbanColumn({ col, jobs, bc, onCardClick }) {
  const { label, Icon } = col

  return (
    <div className="kanban-col">
      {/* Column header — uses active branch color, same as dashboard card heads */}
      <div
        className="kanban-col-head"
        style={{
          background: bc.bgActive,
          borderTopColor: bc.bgAccent,
          transition: 'background 0.2s ease, border-color 0.2s ease',
        }}
      >
        <div className="kanban-col-head-left">
          <Icon size={15} weight="bold" style={{ color: bc.textActive, flexShrink: 0 }} />
          <span className="kanban-col-label" style={{ color: bc.textActive }}>{label}</span>
        </div>
        <span
          className="kanban-col-count"
          style={{ background: 'rgba(255,255,255,0.20)', color: bc.textActive }}
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
  const [branch, setBranch]         = useState('lm')
  const [search, setSearch]         = useState('')
  const [searchOpen, setSearchOpen] = useState(false)

  const bc = BRANCH_COLORS[branch] || BRANCH_COLORS.lm

  const lmCount         = JOBS.filter(j => j.branch === 'lm').length
  const boltCount       = JOBS.filter(j => j.branch === 'bolt').length
  const boltDallasCount = JOBS.filter(j => j.branch === 'bolt-dallas').length

  // All jobs for this branch, optionally filtered by search
  const branchJobs = JOBS.filter(j =>
    j.branch === branch &&
    (search === '' || j.client.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="page-content fade-in">

      {/* Branch selector */}
      <BranchTabs
        active={branch}
        onChange={setBranch}
        lmCount={lmCount}
        boltCount={boltCount}
        boltDallasCount={boltDallasCount}
      />

      {/* Search bar */}
      <div className="kanban-toolbar">
        <div
          className={`list-search-wrap${searchOpen ? ' list-search-wrap--open' : ''}`}
          onClick={() => { if (!searchOpen) setSearchOpen(true) }}
        >
          <span className="list-search-icon"><MagnifyingGlass size={15} /></span>
          <input
            placeholder="Search installations…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onBlur={() => { if (!search) setSearchOpen(false) }}
            ref={el => { if (searchOpen && el) el.focus() }}
          />
          {search && (
            <button
              className="search-clear-btn"
              onClick={e => { e.stopPropagation(); setSearch(''); setSearchOpen(false) }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Kanban board */}
      <div className="kanban-board">
        {KANBAN_COLS.map(col => {
          const colJobs = branchJobs.filter(j => col.statuses.includes(j.status))
          return (
            <KanbanColumn
              key={col.id}
              col={col}
              jobs={colJobs}
              bc={bc}
              onCardClick={id => navigate(`/installations/installs/${id}`)}
            />
          )
        })}
      </div>

    </div>
  )
}
