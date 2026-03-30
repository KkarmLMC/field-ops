import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Warning, Lightning, CaretRight, Clock, ArrowRight, MagnifyingGlass, Ruler, Seal, ClipboardText, HardHat, Buildings, CheckCircle } from '@phosphor-icons/react'
import BranchTabs from '../components/BranchTabs'
import { PROJECTS, TECHNICIANS, STATS } from '../data/mockData.js'
import { BRANCH_COLORS } from '../config/branches.js'

function getTechName(id) {
  return TECHNICIANS.find(t => t.id === id)?.name ?? '—'
}

const TYPE_ICON = {
  installation:  Lightning,
  inspection:    MagnifyingGlass,
  'site-survey': Ruler,
  certification: Seal,
  'annual-test': ClipboardText,
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [branch, setBranch] = useState('lm')

  const todayStr = new Date().toISOString().slice(0, 10)

  const branchJobs   = PROJECTS.filter(p => p.branch === branch)
  const todayJobs    = branchJobs.filter(p => p.scheduled_date === todayStr && (p.stage === 'in-progress' || p.stage === 'scheduled')).slice(0, 4)
  const activeJobs   = branchJobs.filter(p => p.stage === 'in-progress').slice(0, 4)
  const failedJobs   = branchJobs.filter(p => p.stage === 'failed').slice(0, 4)
  const upcomingJobs = branchJobs.filter(p => p.stage === 'scheduled' && p.scheduled_date > todayStr).slice(0, 4)

  const techsInField = PROJECTS.filter(p => p.branch === branch && p.stage === 'in-progress')
    .map(p => p.lead_tech_id)
    .filter((id, i, arr) => arr.indexOf(id) === i).length

  const bc = BRANCH_COLORS[branch]
  const headStyle = { background: bc.bgActive, color: bc.textActive, transition: 'background 0.2s, color 0.2s' }

  return (
    <div className="page-content fade-in">
      <div style={{ display:'flex', flexDirection:'column', gap:'var(--gap-m)' }}>

      {/* Branch selector */}
      <BranchTabs active={branch} onChange={setBranch} />

      {/* Quick nav tiles */}
      <div className="dash-tiles">
        {[
          { Icon: Lightning,   label: 'Installs',       sub: `${activeJobs.length} active`,     path: '/installations/installs', color: '#000000', bg: '#F3F4F6' },
          { Icon: HardHat,     label: 'Technicians',    sub: `${techsInField} in field`,         path: '/technicians',            color: '#000000', bg: '#F3F4F6' },
          { Icon: ClipboardText, label: 'Field Reports', sub: `${STATS.reportsThisMonth} this mo`, path: '/reports',              color: '#000000', bg: '#F3F4F6' },
          { Icon: Buildings,   label: 'Installations',  sub: `${branchJobs.length} total`,       path: '/installations',          color: '#000000', bg: '#F3F4F6' },
        ].map(a => (
          <button
            key={a.path}
            className="dash-tile"
            onClick={() => navigate(a.path)}
            style={{ '--tile-color': a.color, '--tile-bg': a.bg }}
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

      {/* 2-column card grid */}
      <div className="dash-grid">

        {/* Today's Schedule */}
        <div className="dash-card">
          <div className="dash-card-head" style={headStyle}>
            <span className="dash-card-title">
              <Clock size={14} />
              Today's Schedule
            </span>
            <span className="dash-card-meta">{todayStr}</span>
          </div>
          <div className="dash-card-body">
            {todayJobs.length === 0
              ? <EmptyState message="No jobs scheduled today" />
              : todayJobs.map(job => <JobRow key={job.id} job={job} navigate={navigate} />)
            }
          </div>
        </div>

        {/* Active Jobs */}
        <div className="dash-card">
          <div className="dash-card-head" style={headStyle}>
            <span className="dash-card-title">
              <span className="live-dot" />
              Active Jobs
            </span>
            <button className="dash-card-link" onClick={() => navigate('/installations/installs')}>
              View all <CaretRight size={11} />
            </button>
          </div>
          <div className="dash-card-body">
            {activeJobs.length === 0
              ? <EmptyState message="No active jobs" />
              : activeJobs.map(job => <JobRow key={job.id} job={job} navigate={navigate} />)
            }
          </div>
        </div>

        {/* Needs Attention */}
        <div className="dash-card">
          <div className="dash-card-head" style={headStyle}>
            <span className="dash-card-title">
              <Warning size={14} />
              Needs Attention
            </span>
            {failedJobs.length > 0 && (
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'inherit' }}>{failedJobs.length} failed</span>
            )}
          </div>
          <div className="dash-card-body">
            {failedJobs.length === 0
              ? <EmptyState message="All clear — no issues" />
              : failedJobs.map(job => <JobRow key={job.id} job={job} navigate={navigate} />)
            }
          </div>
        </div>

        {/* Upcoming */}
        <div className="dash-card">
          <div className="dash-card-head" style={headStyle}>
            <span className="dash-card-title">
              <Lightning size={14} />
              Upcoming
            </span>
          </div>
          <div className="dash-card-body">
            {upcomingJobs.length === 0
              ? <EmptyState message="Nothing scheduled ahead" />
              : upcomingJobs.map(job => <JobRow key={job.id} job={job} navigate={navigate} />)
            }
          </div>
        </div>

      </div>
      </div>{/* end flex column */}
    </div>
  )
}

function EmptyState({ message }) {
  return (
    <div style={{
      padding: '28px 16px', textAlign: 'center',
      color: 'var(--text-3)', fontSize: 'var(--text-md)',
    }}>
      {message}
    </div>
  )
}

function JobRow({ job, navigate }) {
  return (
    <div className="dash-job-row" onClick={() => navigate(`/installations/${job.id}`)}>
      <div className="dash-job-icon" style={{ background: '#F3F4F6' }}>
        {(() => { const I = TYPE_ICON[job.type] || Lightning; return <I size={16} /> })()}
      </div>
      <div className="dash-job-info">
        <div className="dash-job-name">{job.name}</div>
        <div className="dash-job-meta">
          {getTechName(job.lead_tech_id)}
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
      <div className="dash-status-pill" style={{ background: '#F3F4F6', color: '#000000' }}>
        {job.stage}
      </div>
    </div>
  )
}
