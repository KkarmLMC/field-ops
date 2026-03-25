import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MagnifyingGlass, ClipboardText } from '@phosphor-icons/react'
import BranchTabs from '../components/BranchTabs'
import { PROJECTS, TECHNICIANS } from '../data/mockData.js'

const INSPECT_TYPES = ['inspection', 'annual-test']

const STATUS_COLOR = {
  'in-progress': { bg: '#FFF7ED', color: '#C2410C' },
  scheduled:     { bg: '#F3F4F6', color: '#000000' },
  complete:      { bg: '#F0FDF4', color: '#15803D' },
  failed:        { bg: '#FEF2F2', color: '#B91C1C' },
}

const TYPE_ICON = {
  inspection:   MagnifyingGlass,
  'annual-test': ClipboardText,
}

const STATUS_FILTERS = ['all', 'in-progress', 'scheduled', 'complete', 'failed']
const STAGE_LABEL = { 'in-progress': 'Active', 'scheduled': 'Scheduled', 'complete': 'Complete', 'failed': 'Failed' }

function getTech(id) {
  return TECHNICIANS.find(t => t.id === id)?.name ?? '—'
}

export default function Inspections() {
  const navigate = useNavigate()
  const [branch, setBranch]           = useState('lm')
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch]           = useState('')
  const [searchOpen, setSearchOpen]   = useState(false)

  const lmCount         = PROJECTS.filter(p => p.branch === 'lm'         && INSPECT_TYPES.includes(p.type)).length
  const boltCount       = PROJECTS.filter(p => p.branch === 'bolt'        && INSPECT_TYPES.includes(p.type)).length
  const boltDallasCount = PROJECTS.filter(p => p.branch === 'bolt-dallas' && INSPECT_TYPES.includes(p.type)).length

  const jobs = PROJECTS.filter(p =>
    p.branch === branch &&
    INSPECT_TYPES.includes(p.type) &&
    (statusFilter === 'all' || p.stage === statusFilter) &&
    (search === '' || p.name.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="page-content fade-in">

      <BranchTabs
        active={branch}
        onChange={setBranch}
        lmCount={lmCount}
        boltCount={boltCount}
        boltDallasCount={boltDallasCount}
      />

      {/* Filters + expandable search */}
      <div className="list-toolbar">
        <div className="list-filters">
          {STATUS_FILTERS.map(s => (
            <button
              key={s}
              className={`filter-chip ${statusFilter === s ? 'filter-chip-active' : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {s === 'all' ? 'All' : (STAGE_LABEL[s] || s)}
            </button>
          ))}
        </div>
        <div
          className={`list-search-wrap${searchOpen ? ' list-search-wrap--open' : ''}`}
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

      {/* List */}
      <div className="dash-card">
        <div className="dash-card-head">
          <span className="dash-card-title">Inspections</span>
          <span className="dash-card-meta">{jobs.length} results</span>
        </div>
        <div>
          {jobs.length === 0 ? (
            <div className="empty">
              No inspections match your filter
            </div>
          ) : (
            jobs.map(job => {
              const sc = STATUS_COLOR[job.stage] || STATUS_COLOR.scheduled
              return (
                <div
                  key={job.id}
                  className="dash-job-row"
                  onClick={() => navigate(`/installations/${job.id}`)}
                >
                  <div className="dash-job-icon" style={{ background: sc.bg }}>
                    {(() => { const I = TYPE_ICON[job.type] || MagnifyingGlass; return <I size={16} /> })()}
                  </div>
                  <div className="dash-job-info">
                    <div className="dash-job-name">{job.name}</div>
                    <div className="dash-job-meta">
                      {getTech(job.lead_tech_id)}
                      <span className="dash-job-dot">·</span>
                      {job.scheduled_date}
                    </div>
                  </div>
                  <div className="dash-status-pill" style={{ background: sc.bg, color: sc.color }}>
                    {STAGE_LABEL[job.stage] || job.stage}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
