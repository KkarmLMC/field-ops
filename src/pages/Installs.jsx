import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import BranchTabs from '../components/BranchTabs'
import { JOBS, TECHNICIANS } from '../data/mockData.js'

const INSTALL_TYPES = ['installation', 'site-survey', 'certification', 'annual-test']

const STATUS_COLOR = {
  active:    { bg: '#F3F4F6', color: '#000000' },
  scheduled: { bg: '#F3F4F6', color: '#000000' },
  completed: { bg: '#F3F4F6', color: '#000000' },
  failed:    { bg: '#F3F4F6', color: '#000000' },
}

const TYPE_ICON = {
  installation:  '⚡',
  'site-survey': '📐',
  certification: '🏆',
  'annual-test': '📋',
}

const STATUS_FILTERS = ['all', 'active', 'scheduled', 'completed', 'failed']

function getTech(id) {
  return TECHNICIANS.find(t => t.id === id)?.name ?? '—'
}

export default function Installs() {
  const navigate = useNavigate()
  const [branch, setBranch]     = useState('bolt')
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch]     = useState('')
  const [searchOpen, setSearchOpen] = useState(false)

  const lmCount          = JOBS.filter(j => j.branch === 'lm'         && INSTALL_TYPES.includes(j.type)).length
  const boltCount        = JOBS.filter(j => j.branch === 'bolt'        && INSTALL_TYPES.includes(j.type)).length
  const boltDallasCount  = JOBS.filter(j => j.branch === 'bolt-dallas' && INSTALL_TYPES.includes(j.type)).length

  const jobs = JOBS.filter(j =>
    j.branch === branch &&
    INSTALL_TYPES.includes(j.type) &&
    (statusFilter === 'all' || j.status === statusFilter) &&
    (search === '' || j.client.toLowerCase().includes(search.toLowerCase()))
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
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <div
          className={`list-search-wrap${searchOpen ? ' list-search-wrap--open' : ''}`}
          onClick={() => { if (!searchOpen) setSearchOpen(true) }}
        >
          <span className="list-search-icon"><Search size={15} /></span>
          <input
            placeholder="Search installs…"
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
          <span className="dash-card-title">Installs</span>
          <span className="dash-card-meta">{jobs.length} results</span>
        </div>
        <div>
          {jobs.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
              No installs match your filter
            </div>
          ) : (
            jobs.map(job => {
              const sc = STATUS_COLOR[job.status] || STATUS_COLOR.scheduled
              return (
                <div
                  key={job.id}
                  className="dash-job-row"
                  onClick={() => navigate(`/installations/installs/${job.id}`)}
                >
                  <div className="dash-job-icon" style={{ background: sc.bg, fontSize: 16 }}>
                    {TYPE_ICON[job.type] || '⚡'}
                  </div>
                  <div className="dash-job-info">
                    <div className="dash-job-name">{job.client}</div>
                    <div className="dash-job-meta">
                      {getTech(job.assignedTo)}
                      {job.progress > 0 && (
                        <>
                          <span className="dash-job-dot">·</span>
                          <div className="dash-progress-bar">
                            <div className="dash-progress-fill" style={{ width: `${job.progress}%`, background: '#000000' }} />
                          </div>
                          <span className="dash-progress-pct">{job.progress}%</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="dash-status-pill" style={{ background: sc.bg, color: sc.color }}>
                    {job.status}
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
