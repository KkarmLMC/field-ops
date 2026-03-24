import { useNavigate } from 'react-router-dom'
import { CheckCircle, AlertTriangle, Users, Zap, ChevronRight, Calendar, Clock } from 'lucide-react';
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
  active:    { bg: 'var(--orange-s)', color: 'var(--orange)', dot: 'var(--orange)' },
  scheduled: { bg: 'var(--amber-s)',  color: '#B45309',      dot: '#B45309' },
  completed: { bg: 'var(--green-s)',  color: '#047857',      dot: 'var(--green)' },
  failed:    { bg: 'var(--red-soft)', color: 'var(--red)',   dot: 'var(--red)' },
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

  const todayJobs   = JOBS.filter(j => j.scheduledDate === todayStr && (j.status === 'active' || j.status === 'scheduled'))
  const activeJobs  = JOBS.filter(j => j.status === 'active')
  const failedJobs  = JOBS.filter(j => j.status === 'failed')
  const upcomingJobs = JOBS.filter(j => j.status === 'scheduled' && j.scheduledDate > todayStr).slice(0, 3)

  return (
    <div className="page-content fade-in">

      {/* Welcome banner */}
      <div style={{
        background: 'var(--navy)',
        borderRadius: 12,
        padding: '18px 18px 20px',
        marginBottom: 16,
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Lightning bolt watermark */}
        <div style={{
          position: 'absolute', right: -8, top: -8, fontSize: 80,
          opacity: 0.07, transform: 'rotate(10deg)', lineHeight: 1,
        }}>⚡</div>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', opacity: 0.55, textTransform: 'uppercase', marginBottom: 4 }}>
          {getGreeting()}
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>
          Bolt Lightning Protection
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: 0.6, fontSize: 12 }}>
          <Calendar size={12} />
          {formatDate(today)}
        </div>

        {/* Today quick stat */}
        <div style={{
          display: 'flex', gap: 12, marginTop: 16,
          background: 'rgba(255,255,255,0.07)',
          borderRadius: 8, padding: '10px 14px',
        }}>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1 }}>{todayJobs.length}</div>
            <div style={{ fontSize: 10, opacity: 0.55, marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Today</div>
          </div>
          <div style={{ width: 1, background: 'rgba(255,255,255,0.12)' }} />
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1, color: '#4ade80' }}>{STATS.jobsCompleted}</div>
            <div style={{ fontSize: 10, opacity: 0.55, marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Done</div>
          </div>
          <div style={{ width: 1, background: 'rgba(255,255,255,0.12)' }} />
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1, color: '#f87171' }}>{failedJobs.length}</div>
            <div style={{ fontSize: 10, opacity: 0.55, marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Failed</div>
          </div>
          <div style={{ width: 1, background: 'rgba(255,255,255,0.12)' }} />
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1, color: '#fb923c' }}>{STATS.techsInField}</div>
            <div style={{ fontSize: 10, opacity: 0.55, marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>In Field</div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
        {[
          { icon: '⚡', label: 'View Jobs',      path: '/jobs',         bg: 'var(--orange-s)', color: 'var(--orange)' },
          { icon: '👷', label: 'Technicians',    path: '/technicians',  bg: 'var(--blue-soft)', color: 'var(--blue)' },
          { icon: '📋', label: 'Field Reports',  path: '/reports',      bg: 'var(--green-s)',  color: 'var(--green)' },
          { icon: '🏗️', label: 'Projects',       path: '/projects',     bg: 'var(--amber-s)',  color: '#B45309' },
        ].map(a => (
          <button
            key={a.path}
            onClick={() => navigate(a.path)}
            style={{
              background: a.bg, border: `1px solid ${a.color}22`,
              borderRadius: 10, padding: '12px 14px',
              display: 'flex', alignItems: 'center', gap: 10,
              cursor: 'pointer', transition: 'opacity 0.12s',
              textAlign: 'left',
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity='0.82'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity='1'; }}
            onTouchStart={e => e.currentTarget.style.transform='scale(0.97)'}
            onTouchEnd={e => e.currentTarget.style.transform='scale(1)'}
          >
            <span style={{ fontSize: 22 }}>{a.icon}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: a.color }}>{a.label}</span>
          </button>
        ))}
      </div>

      {/* Today's schedule */}
      {todayJobs.length > 0 && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div className="card-header">
            <span className="card-title">
              <Clock size={13} style={{ color: 'var(--orange)' }} />
              Today's Schedule
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>{todayStr}</span>
          </div>
          {todayJobs.map(job => <JobRow key={job.id} job={job} navigate={navigate} />)}
        </div>
      )}

      {/* Active jobs */}
      {activeJobs.length > 0 && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div className="card-header">
            <span className="card-title">
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--orange)', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
              Active Jobs
            </span>
            <button
              style={{ fontSize: 12, color: 'var(--red)', display: 'flex', alignItems: 'center', gap: 3, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
              onClick={() => navigate('/jobs')}
            >
              All <ChevronRight size={12} />
            </button>
          </div>
          {activeJobs.map(job => <JobRow key={job.id} job={job} navigate={navigate} />)}
        </div>
      )}

      {/* Failed — needs attention */}
      {failedJobs.length > 0 && (
        <div className="card" style={{ marginBottom: 12, borderColor: 'var(--red-soft)' }}>
          <div className="card-header" style={{ background: 'var(--red-soft)' }}>
            <span className="card-title" style={{ color: 'var(--red)' }}>
              <AlertTriangle size={13} style={{ color: 'var(--red)' }} />
              Needs Attention
            </span>
            <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--red)', fontWeight: 700 }}>{failedJobs.length} failed</span>
          </div>
          {failedJobs.map(job => <JobRow key={job.id} job={job} navigate={navigate} />)}
        </div>
      )}

      {/* Upcoming */}
      {upcomingJobs.length > 0 && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div className="card-header">
            <span className="card-title">
              <Zap size={13} style={{ color: 'var(--blue)' }} />
              Upcoming
            </span>
          </div>
          {upcomingJobs.map(job => <JobRow key={job.id} job={job} navigate={navigate} />)}
        </div>
      )}
    </div>
  );
}

function JobRow({ job, navigate }) {
  const sc = STATUS_COLOR[job.status] || STATUS_COLOR.scheduled

  return (
    <div
      className="project-item"
      onClick={() => navigate(`/jobs/${job.id}`)}
      style={{ gap: 10, alignItems: 'center' }}
    >
      {/* Type icon */}
      <div style={{
        width: 36, height: 36, borderRadius: 8, flexShrink: 0,
        background: sc.bg, display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: 16,
      }}>
        {TYPE_ICON[job.type] || '⚡'}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="project-name" style={{ fontSize: 13 }}>{job.client}</div>
        <div className="project-meta" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>{getTechName(job.assignedTo)}</span>
          {job.progress > 0 && (
            <>
              <span>·</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 32, height: 3, borderRadius: 2, background: 'var(--border)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${job.progress}%`, background: job.status === 'failed' ? 'var(--red)' : 'var(--green)', borderRadius: 2 }} />
                </div>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10 }}>{job.progress}%</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Status pill */}
      <div style={{
        flexShrink: 0, padding: '3px 8px', borderRadius: 20,
        background: sc.bg, border: `1px solid ${sc.color}33`,
        fontSize: 10, fontWeight: 700, color: sc.color,
        textTransform: 'uppercase', letterSpacing: '0.04em',
      }}>
        {job.status}
      </div>
    </div>
  )
}
