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
        <SectionDivider title="Technicians" label="Management Overview" accent="var(--navy)" />

        {/* Summary stat tiles */}
        <div className="dfl-summary-strip">
          {[
            { label: 'Total Techs', value: TECHNICIANS.length, icon: <Users size={15} weight="bold" /> },
            { label: 'In Field',    value: inField,             icon: <HardHat size={15} weight="bold" />, alert: inField > 0 },
            { label: 'Active',      value: active,              icon: <Users size={15} weight="bold" /> },
          ].map(s => (
            <div
              key={s.label}
              className="dfl-summary-card"
            >
              <div className="dfl-summary-icon" style={{ color: s.alert && s.value > 0 ? 'var(--orange)' : 'var(--navy)' }}>
                {s.icon}
              </div>
              <div>
                <div className="dfl-summary-value" style={{ color: s.alert && s.value > 0 ? 'var(--orange)' : 'var(--text-1)' }}>
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
              <div style={{ padding: '14px', borderBottom: techJobs.length > 0 ? '1px solid var(--border-l)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: '2.5rem', height: '2.5rem', borderRadius: '0.375rem',
                    background: tech.status === 'field' ? 'var(--orange-s)' : 'var(--blue-soft)',
                    color: tech.status === 'field' ? 'var(--orange)' : 'var(--blue)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--mono)', fontSize: 'var(--fs-xs)', fontWeight: 600,
                  }}>
                    {tech.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 'var(--fs-lg)' }}>{tech.name}</div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 'var(--fs-xs)', color: 'var(--text-3)', marginTop: '0.125rem' }}>
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
                  <div style={{ fontSize: 'var(--fs-xs)', fontWeight: 600, color: 'var(--text-2)', marginBottom: 'var(--sp-1)' }}>
                    Assigned Jobs ({techJobs.length})
                  </div>
                  {techJobs.map(job => (
                    <div
                      key={job.id}
                      className="project-item"
                      style={{ padding: '8px 0', gap: '0.5rem' }}
                      onClick={() => navigate(`/installations/${job.id}`)}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 'var(--fs-md)', fontWeight: 500 }}>{job.name}</div>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: '0.625rem', color: 'var(--text-3)' }}>{job.job_number}</div>
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
        <SectionDivider title="Technicians" label="Field Overview" accent="var(--navy)" />

        <div style={{ display: 'flex', gap: 'var(--gap-sm)' }}>
          <button
            className="btn btn-primary"
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            onClick={() => navigate('/daily-field-log')}
          >
            <BookOpen size={14} weight="bold" />
            New Field Log
          </button>
          <button
            className="btn btn-secondary"
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            onClick={() => navigate('/forms/jsa')}
          >
            <HardHat size={14} weight="bold" />
            New JSA
          </button>
        </div>

      </div>
    </div>
  )
}
