import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Zap, ChevronRight, Calendar, Clock, ArrowRight } from 'lucide-react';
import { JOBS, TECHNICIANS, STATS } from '../data/mockData.js';

function getTechName(id) {
  return TECHNICIANS.find(t => t.id === id)?.name ?? '—';
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function formatDate(d) {
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

const STATUS_COLOR = {
  active:    { bg: '#FFF7ED', color: '#EA580C', dot: '#EA580C' },
  scheduled: { bg: '#FFFBEB', color: '#D97706', dot: '#D97706' },
  completed: { bg: '#F0FDF4', color: '#16A34A', dot: '#16A34A' },
  failed:    { bg: '#FEF2F2', color: '#DC2626', dot: '#DC2626' },
}

const TYPE_ICON = {
  installation: '⚡',
  inspection:   '🔍',
  'site-survey':'📐',
  certification:'🏆',
  'annual-test':'📋',
}

export default function Dashboard() {
  const navigate = useNavigate()
  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)

  const todayJobs    = JOBS.filter(j => j.scheduledDate === todayStr && (j.status === 'active' || j.status === 'scheduled')).slice(0, 4)
  const activeJobs   = JOBS.filter(j => j.status === 'active').slice(0, 4)
  const failedJobs   = JOBS.filter(j => j.status === 'failed').slice(0, 4)
  const upcomingJobs = JOBS.filter(j => j.status === 'scheduled' && j.scheduledDate > todayStr).slice(0, 4)

  return (
    <div className="page-content fade-in">

      {/* Welcome banner */}
      <div className="dash-banner">
        <div className="dash-banner-left">
          <div className="dash-banner-greeting">{getGreeting()}</div>
          <div className="dash-banner-title">Bolt Lightning Protection</div>
          <div className="dash-banner-date">
            <Calendar size={12} />
            {formatDate(today)}
          </div>
        </div>
        <div className="dash-stats-row">
          {[
            { value: todayJobs.length,    label: 'Today',    color: 'white' },
            { value: STATS.jobsCompleted, label: 'Done',     color: '#4ade80' },
            { value: failedJobs.length,   label: 'Failed',   color: '#f87171' },
            { value: STATS.techsInField,  label: 'In Field', color: '#fb923c' },
          ].map((s, i) => (
            <div key={i} className="dash-stat">
              <div className="dash-stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="dash-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick nav tiles */}
      <div className="dash-tiles">
        {[
          { icon: '⚡', label: 'Installs',       sub: `${activeJobs.length} active`,       path: '/installations/installs', color: '#EA580C', bg: '#FFF7ED' },
          { icon: '👷', label: 'Technicians',   sub: `${STATS.techsInField} in field`,    path: '/technicians',            color: '#2563EB', bg: '#EFF6FF' },
          { icon: '📋', label: 'Field Reports', sub: `${STATS.reportsThisMonth} this mo`, path: '/reports',                color: '#16A34A', bg: '#F0FDF4' },
          { icon: '🏗️', label: 'Installations', sub: `${STATS.activeProjects} open`,      path: '/installations',          color: '#D97706', bg: '#FFFBEB' },
        ].map(a => (
          <button
            key={a.path}
            className="dash-tile"
            onClick={() => navigate(a.path)}
            style={{ '--tile-color': a.color, '--tile-bg': a.bg }}
          >
            <div className="dash-tile-icon">{a.icon}</div>
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
          <div className="dash-card-head">
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
          <div className="dash-card-head">
            <span className="dash-card-title">
              <span className="live-dot" />
              Active Jobs
            </span>
            <button className="dash-card-link" onClick={() => navigate('/jobs')}>
              View all <ChevronRight size={11} />
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
        <div className="dash-card" style={failedJobs.length > 0 ? { borderColor: '#FECACA' } : {}}>
          <div className="dash-card-head" style={failedJobs.length > 0 ? { background: '#FEF2F2' } : {}}>
            <span className="dash-card-title" style={failedJobs.length > 0 ? { color: '#DC2626' } : {}}>
              <AlertTriangle size={14} />
              Needs Attention
            </span>
            {failedJobs.length > 0 && (
              <span style={{ fontSize: 11, fontWeight: 700, color: '#DC2626' }}>{failedJobs.length} failed</span>
            )}
          </div>
          <div className="dash-card-body">
            {failedJobs.length === 0
              ? <EmptyState message="All clear — no issues" icon="✅" />
              : failedJobs.map(job => <JobRow key={job.id} job={job} navigate={navigate} />)
            }
          </div>
        </div>

        {/* Upcoming */}
        <div className="dash-card">
          <div className="dash-card-head">
            <span className="dash-card-title">
              <Zap size={14} style={{ color: 'var(--blue)' }} />
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
    </div>
  )
}

function EmptyState({ message, icon = '—' }) {
  return (
    <div style={{
      padding: '28px 16px', textAlign: 'center',
      color: 'var(--text-3)', fontSize: 13,
    }}>
      {message}
    </div>
  )
}

function JobRow({ job, navigate }) {
  const sc = STATUS_COLOR[job.status] || STATUS_COLOR.scheduled

  return (
    <div className="dash-job-row" onClick={() => navigate(`/jobs/${job.id}`)}>
      <div className="dash-job-icon" style={{ background: sc.bg }}>
        {TYPE_ICON[job.type] || '⚡'}
      </div>
      <div className="dash-job-info">
        <div className="dash-job-name">{job.client}</div>
        <div className="dash-job-meta">
          {getTechName(job.assignedTo)}
          {job.progress > 0 && (
            <>
              <span className="dash-job-dot">·</span>
              <div className="dash-progress-bar">
                <div
                  className="dash-progress-fill"
                  style={{
                    width: `${job.progress}%`,
                    background: job.status === 'failed' ? '#DC2626' : '#16A34A',
                  }}
                />
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
}
