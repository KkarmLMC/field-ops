import { useNavigate } from 'react-router-dom'
import { Users, HardHat, BookOpen } from '@phosphor-icons/react'
import { TECHNICIANS, PROJECTS } from '../data/mockData.js'
import SectionDivider from '../components/SectionDivider'

export default function Technicians() {
  const navigate = useNavigate()
  const inField  = TECHNICIANS.filter(t => t.status === 'field').length
  const active   = TECHNICIANS.filter(t => t.status !== 'field').length

  return (
    <div className="page-content fade-in">
      <div className="page-stack">

        {/* ══ MANAGEMENT OVERVIEW ═══════════════════════════════════════════ */}
        <SectionDivider title="Technicians" label="Management Overview" accent="var(--brand-primary)" />

        {/* Summary stat tiles */}
        <div className="dfl-summary-strip">
          {[
            { label: 'Total Techs', value: TECHNICIANS.length, icon: <Users size="0.9375rem" weight="bold" /> },
            { label: 'In Field',    value: inField,             icon: <HardHat size="0.9375rem" weight="bold" />, alert: inField > 0 },
            { label: 'Active',      value: active,              icon: <Users size="0.9375rem" weight="bold" /> },
          ].map(s => (
            <div
              key={s.label}
              className="dfl-summary-card"
            >
              <div className="dfl-summary-icon" style={{ color: s.alert && s.value > 0 ? 'var(--state-warning-text)' : 'var(--brand-primary)' }}>
                {s.icon}
              </div>
              <div>
                <div className="dfl-summary-value" style={{ color: s.alert && s.value > 0 ? 'var(--state-warning-text)' : 'var(--text-primary)' }}>
                  {s.value}
                </div>
                <div className="dfl-summary-label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Technician cards */}
        {TECHNICIANS.map(tech => {
          const techJobs = PROJECTS.filter(p => p.lead_tech_id === tech.id)
          return (
            <div key={tech.id} className="card">
              <div style={{ padding: 'var(--space-m)', borderBottom: techJobs.length > 0 ? '1px solid var(--border-default)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: '2.5rem', height: '2.5rem', borderRadius: '0.375rem',
                    background: tech.status === 'field' ? 'var(--state-warning-soft)' : 'var(--state-info-soft)',
                    color: tech.status === 'field' ? 'var(--state-warning-text)' : 'var(--state-info)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', fontWeight: 600 }}>
                    {tech.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 'var(--text-lg)' }}>{tech.name}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
                      {tech.license} · {tech.phone}
                    </div>
                  </div>
                  <span className={`badge badge-${tech.status === 'field' ? 'active' : 'completed'}`}>
                    {tech.status === 'field' ? 'In Field' : 'Active'}
                  </span>
                </div>
              </div>

              {/* Assigned jobs */}
              {techJobs.length > 0 && (
                <div style={{ padding: '8px 14px 10px' }}>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--space-xs)' }}>
                    Assigned Jobs ({techJobs.length})
                  </div>
                  {techJobs.map(job => (
                    <div
                      key={job.id}
                      className="project-item"
                      style={{ padding: '8px 0', gap: '0.5rem' }}
                      onClick={() => navigate(`/installations/${job.id}`)}
                    >
                      <div className="content-body">
                        <div style={{ fontSize: 'var(--text-md)', fontWeight: 500 }}>{job.name}</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--text-muted)' }}>{job.job_number}</div>
                      </div>
                      <span className={`badge badge-${job.stage === 'in-progress' ? 'active' : job.stage === 'complete' ? 'completed' : job.stage}`}>{job.stage}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}

        {/* ══ FIELD ══════════════════════════════════════════════════════════ */}
        <SectionDivider title="Technicians" label="Field Overview" accent="var(--brand-primary)" />

        <div className="flex-gap-s">
          <button
            className="btn btn-primary"
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            onClick={() => navigate('/daily-field-log')}
          >
            <BookOpen size="0.875rem" weight="bold" />
            New Field Log
          </button>
          <button
            className="btn btn-secondary"
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            onClick={() => navigate('/forms/jsa')}
          >
            <HardHat size="0.875rem" weight="bold" />
            New JSA
          </button>
        </div>

      </div>
    </div>
  )
}
