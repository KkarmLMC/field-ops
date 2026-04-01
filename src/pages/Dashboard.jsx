import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Warning, Lightning, CaretRight, Clock, ArrowRight, MagnifyingGlass, Ruler, Seal, ClipboardText, Users, HardHat, CheckCircle } from '@phosphor-icons/react'
import BranchTabs from '../components/BranchTabs'
import { PROJECTS, TECHNICIANS, STATS } from '../data/mockData.js'
import { BRANCH_COLORS } from '../config/branches.js'
import { projectStage } from '../lib/statusColors.js'

function getTechName(id) {
  return TECHNICIANS.find(t => t.id === id)?.name ?? '—'
}

const TYPE_ICON = {
  installation:  Lightning,
  inspection:    MagnifyingGlass,
  'site-survey': Ruler,
  certification: Seal,
  'annual-test': ClipboardText }

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
      <div className="modal-body">

      {/* Branch selector */}
      <BranchTabs active={branch} onChange={setBranch} />

      {/* Quick nav tiles */}
      <div className="nav-card-grid">
        {[
          { Icon: Lightning,     label: 'Installs',       sub: `${activeJobs.length} active`,       path: '/installations/installs' },
          { Icon: Users,       label: 'Technicians',    sub: `${techsInField} in field`,          path: '/technicians' },
          { Icon: ClipboardText, label: 'Field Reports',  sub: `${STATS.reportsThisMonth} this mo`, path: '/reports' },
          { Icon: HardHat,     label: 'Installations',  sub: `${branchJobs.length} total`,        path: '/installations' },
        ].map(a => (
          <button
            key={a.path}
            className="card nav-card"
            onClick={() => navigate(a.path)}
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

      {/* 2-column card grid */}
      <div className="dash-grid">

        {/* Today's Schedule */}
        <div className="card list-card">
          <div className="list-card__header" style={headStyle}>
            <span className="list-card__title">
              <Clock size="1rem" />
              Today's Schedule
            </span>
            <span className="list-card__meta">{todayStr}</span>
          </div>
          <div className="list-card__body">
            {todayJobs.length === 0
              ? <EmptyState message="No jobs scheduled today" />
              : todayJobs.map(job => <JobRow key={job.id} job={job} navigate={navigate} />)
            }
          </div>
        </div>

        {/* Active Jobs */}
        <div className="card list-card">
          <div className="list-card__header" style={headStyle}>
            <span className="list-card__title">
              <Lightning size="1rem" />
              Active Jobs
            </span>
            <button className="list-card__action" onClick={() => navigate('/installations/installs')}>
              View all <CaretRight size="0.6875rem" />
            </button>
          </div>
          <div className="list-card__body">
            {activeJobs.length === 0
              ? <EmptyState message="No active jobs" />
              : activeJobs.map(job => <JobRow key={job.id} job={job} navigate={navigate} />)
            }
          </div>
        </div>

        {/* Needs Attention */}
        <div className="card list-card">
          <div className="list-card__header" style={headStyle}>
            <span className="list-card__title">
              <Warning size="1rem" />
              Needs Attention
            </span>
            {failedJobs.length > 0 && (
              <span className="dashboard-639e">{failedJobs.length} failed</span>
            )}
          </div>
          <div className="list-card__body">
            {failedJobs.length === 0
              ? <EmptyState message="All clear — no issues" />
              : failedJobs.map(job => <JobRow key={job.id} job={job} navigate={navigate} />)
            }
          </div>
        </div>

        {/* Upcoming */}
        <div className="card list-card">
          <div className="list-card__header" style={headStyle}>
            <span className="list-card__title">
              <Lightning size="1rem" />
              Upcoming
            </span>
          </div>
          <div className="list-card__body">
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
    <div className="dashboard-6d11">
      {message}
    </div>
  )
}

function JobRow({ job, navigate }) {
  const stage = projectStage(job.stage)
  return (
    <div className="dash-job-row" onClick={() => navigate(`/installations/${job.id}`)}>
      <div className="dash-job-icon">
        {(() => { const I = TYPE_ICON[job.type] || Lightning; return <I size="1rem" /> })()}
      </div>
      <div className="dash-job-info">
        <div className="dash-job-name">{job.name}</div>
        <div className="dash-job-meta">
          {getTechName(job.lead_tech_id)}
          {job.progress > 0 && (
            <>
              <span className="dash-job-dot">·</span>
              <div className="dash-progress-bar">
                <div className="dash-progress-fill" style={{ width: `${job.progress}%`, background: 'var(--brand-primary)' }} />
              </div>
              <span className="dash-progress-pct">{job.progress}%</span>
            </>
          )}
        </div>
      </div>
      <div className="dash-status-pill" style={{ background: stage.bg, color: stage.color }}>
        {stage.label}
      </div>
    </div>
  )
}
