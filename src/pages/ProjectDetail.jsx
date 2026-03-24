import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { db } from '../lib/supabase'
import { stageBadgeClass, stageColor, STAGES } from '../lib/stages'

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [reports, setReports] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: p }, { data: r }, { data: s }] = await Promise.all([
        db.from('projects').select('*').eq('id', id).single(),
        db.from('daily_field_reports').select('*').eq('project_id', id).order('report_date', { ascending: false }),
        db.from('form_submissions').select('*').eq('project_id', id).order('created_at', { ascending: false }),
      ])
      setProject(p)
      setReports(r || [])
      setSubmissions(s || [])
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return <div className="loading"><div className="spinner" /></div>
  if (!project) return <div className="empty"><div className="empty-title">Project not found</div></div>

  return (
    <div className="page-content fade-in">
      {/* Stage timeline */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="card-header">
          <span className="card-title">
            <span className="card-dot" style={{ background: stageColor(project.stage) }} />
            {project.stage}
          </span>
          <span className={`badge ${stageBadgeClass(project.stage)}`}>{project.stage}</span>
        </div>
        <div style={{ padding: '12px 14px', display: 'flex', gap: 4, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {STAGES.slice(0, 7).map((s, i) => {
            const stageIdx   = STAGES.findIndex(x => x.key === project.stage)
            const isDone     = i < stageIdx
            const isCurrent  = i === stageIdx
            return (
              <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                <div style={{
                  width: isCurrent ? 10 : 8, height: isCurrent ? 10 : 8,
                  borderRadius: '50%',
                  background: isDone || isCurrent ? s.color : 'var(--border)',
                  border: isCurrent ? `2px solid ${s.color}` : 'none',
                  transition: 'all 0.2s',
                }} />
                {i < 6 && <div style={{ width: 20, height: 2, background: isDone ? 'var(--green)' : 'var(--border)', borderRadius: 1 }} />}
              </div>
            )
          })}
        </div>
      </div>

      {/* Job info */}
      <div className="card">
        <div className="section-header">Job Information</div>
        <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            ['Customer', project.customer_account],
            ['Job #', project.job_number],
            ['Address', [project.address, project.city, project.state].filter(Boolean).join(', ')],
            ['Contact', project.primary_contact],
            ['Phone', project.primary_contact_phone],
            ['Representative', project.lmc_representative],
            ['Scheduled', project.scheduled_date],
          ].filter(([,v]) => v).map(([label, value]) => (
            <div key={label} style={{ display: 'flex', gap: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', minWidth: 100 }}>{label}</div>
              <div style={{ fontSize: 13, color: 'var(--text-1)', flex: 1 }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        <button className="btn btn-primary btn-full" onClick={() => navigate(`/reports/new?project=${id}`)}>
          📋 Start Daily Field Report
        </button>
        <button className="btn btn-navy btn-full" onClick={() => navigate(`/forms/new?project=${id}`)}>
          📝 Start Completion Form
        </button>
      </div>

      {/* Daily reports */}
      {reports.length > 0 && (
        <div className="card">
          <div className="card-header">
            <span className="card-title"><span className="card-dot" style={{ background: 'var(--blue)' }} />Daily Reports</span>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{reports.length}</span>
          </div>
          {reports.map(r => (
            <div key={r.id} className="project-item" onClick={() => navigate(`/reports/${r.id}`)}>
              <div style={{ flex: 1 }}>
                <div className="project-name">{r.report_date}</div>
                <div className="project-meta">{r.submitted_by} · {r.hours_worked}h</div>
              </div>
              <span className={`badge ${r.status === 'Submitted' ? 'badge-awarded' : r.status === 'Reviewed' ? 'badge-complete' : 'badge-hold'}`}>
                {r.status}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Completion forms */}
      {submissions.length > 0 && (
        <div className="card">
          <div className="card-header">
            <span className="card-title"><span className="card-dot" style={{ background: 'var(--red)' }} />Completion Forms</span>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{submissions.length}</span>
          </div>
          {submissions.map(s => (
            <div key={s.id} className="project-item" onClick={() => navigate(`/forms/${s.id}`)}>
              <div style={{ flex: 1 }}>
                <div className="project-name">Completion Form</div>
                <div className="project-meta">{s.submitted_by} · {new Date(s.created_at).toLocaleDateString()}</div>
              </div>
              <span className={`badge badge-${s.status?.toLowerCase().replace(' ', '')}`}>{s.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
