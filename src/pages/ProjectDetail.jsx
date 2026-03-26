import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  MapPin, Buildings, CalendarBlank, Shield, FileText, User,
  Phone, Briefcase, Lightning, MagnifyingGlass, Wrench, ClipboardText,
  CheckCircle, Warning, Clock, CaretRight, Plus,
} from '@phosphor-icons/react'
import { db } from '../lib/supabase'
import { PROJECTS, TECHNICIANS, MOCK_REPORTS, MOCK_SUBMISSIONS } from '../data/mockData.js'

// ─── Stage config ─────────────────────────────────────────────────────────────
const STAGE_CFG = {
  'awarded':        { label: 'Awarded',        color: '#7C3AED', bg: '#F5F3FF', order: 0 },
  'scheduled':      { label: 'Scheduled',      color: '#6366F1', bg: '#EEF2FF', order: 1 },
  'in-progress':    { label: 'In Progress',    color: '#D97706', bg: '#FFFBEB', order: 2 },
  'pending-review': { label: 'Pending Review', color: '#2563EB', bg: '#EFF6FF', order: 3 },
  'complete':       { label: 'Complete',       color: '#16A34A', bg: '#F0FDF4', order: 4 },
  'postponed':      { label: 'Postponed',      color: '#EA580C', bg: '#FFF7ED', order: 5 },
  'failed':         { label: 'Failed',         color: '#DC2626', bg: '#FEF2F2', order: 6 },
}

const STAGE_PIPELINE = ['awarded','scheduled','in-progress','pending-review','complete']

const COMPLETION_FORM_CFG = {
  'draft':           { label: 'Draft',           color: '#6B7280', bg: '#F9FAFB' },
  'submitted':       { label: 'Needs Review',     color: '#2563EB', bg: '#EFF6FF' },
  'under-review':    { label: 'Under Review',     color: '#D97706', bg: '#FFFBEB' },
  'customer-signoff':{ label: 'Customer Sign-off',color: '#7C3AED', bg: '#F5F3FF' },
  'complete':        { label: 'Approved',         color: '#16A34A', bg: '#F0FDF4' },
}

const TYPE_ICON = {
  installation:  Lightning,
  inspection:    MagnifyingGlass,
  'site-survey': Wrench,
  certification: ClipboardText,
  remediation:   Wrench,
}

function getTech(id) {
  return TECHNICIANS.find(t => t.id === id) || null
}

function fmtDate(d) {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch { return d }
}

function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <Icon size={14} style={{ color: 'var(--text-3)', marginTop: 1, flexShrink: 0 }} />
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.03em', marginBottom: 1 }}>{label}</div>
        <div style={{ fontSize: 'var(--fs-md)', color: 'var(--text-1)' }}>{value}</div>
      </div>
    </div>
  )
}

// ─── Stage pipeline ───────────────────────────────────────────────────────────
function StagePipeline({ stage }) {
  const currentIdx = STAGE_PIPELINE.findIndex(s => s === stage)
  const isOffPipeline = currentIdx === -1 // postponed / failed

  return (
    <div style={{ padding: '10px 14px 14px', overflowX: 'auto', scrollbarWidth: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, minWidth: 'max-content' }}>
        {STAGE_PIPELINE.map((s, i) => {
          const cfg = STAGE_CFG[s]
          const isDone    = !isOffPipeline && i < currentIdx
          const isCurrent = !isOffPipeline && i === currentIdx
          return (
            <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                <div style={{
                  width:  isCurrent ? 14 : 10,
                  height: isCurrent ? 14 : 10,
                  borderRadius: '50%',
                  background: isCurrent ? cfg.color : isDone ? '#22C55E' : 'var(--border)',
                  border: isCurrent ? `3px solid ${cfg.bg}` : 'none',
                  boxShadow: isCurrent ? `0 0 0 2px ${cfg.color}` : 'none',
                  transition: 'all 0.2s',
                  flexShrink: 0,
                }} />
                <span style={{
                  fontSize: 9, fontWeight: isCurrent ? 700 : 500,
                  color: isCurrent ? cfg.color : isDone ? '#16A34A' : 'var(--text-3)',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  whiteSpace: 'nowrap',
                }}>
                  {cfg.label}
                </span>
              </div>
              {i < STAGE_PIPELINE.length - 1 && (
                <div style={{
                  width: 24, height: 2, margin: '0 4px', marginBottom: 14,
                  background: isDone ? '#22C55E' : 'var(--border)',
                  borderRadius: 1, flexShrink: 0,
                }} />
              )}
            </div>
          )
        })}
      </div>
      {isOffPipeline && (
        <div style={{ marginTop: 8 }}>
          <span style={{
            fontSize: 11, fontWeight: 700, color: STAGE_CFG[stage]?.color || 'var(--text-3)',
            background: STAGE_CFG[stage]?.bg || 'var(--surface)',
            padding: '3px 10px', borderRadius: 20,
          }}>
            {STAGE_CFG[stage]?.label || stage}
          </span>
        </div>
      )}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject]         = useState(null)
  const [reports, setReports]         = useState([])
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [{ data: p }, { data: r }, { data: s }] = await Promise.all([
          db.from('projects').select('*').eq('id', id).single(),
          db.from('daily_field_logs').select('*').eq('project_id', id).order('report_date', { ascending: false }).range(0, 24),
          db.from('form_submissions').select('*').eq('project_id', id).order('created_at', { ascending: false }).range(0, 24),
        ])
        // Use Supabase data if found, otherwise fall back to mock
        setProject(p || PROJECTS.find(x => x.id === id) || null)
        setReports(r?.length ? r : (MOCK_REPORTS || []).filter(x => x.project_id === id))
        setSubmissions(s?.length ? s : (MOCK_SUBMISSIONS || []).filter(x => x.project_id === id))
      } catch {
        // Supabase unavailable — use mock data
        setProject(PROJECTS.find(x => x.id === id) || null)
        setReports((MOCK_REPORTS || []).filter(x => x.project_id === id))
        setSubmissions((MOCK_SUBMISSIONS || []).filter(x => x.project_id === id))
      }
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return (
    <div className="page-content fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
      <div className="spinner" />
    </div>
  )

  if (!project) return (
    <div className="page-content fade-in">
      <div className="empty">
        <div className="empty-icon">🔍</div>
        <div className="empty-title">Project not found</div>
        <div className="empty-desc">"{id}" could not be found.</div>
        <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => navigate('/installations')}>
          Back to Installations
        </button>
      </div>
    </div>
  )

  const stageCfg = STAGE_CFG[project.stage] || {}
  const tech     = getTech(project.lead_tech_id)
  const TypeIcon = TYPE_ICON[project.type] || Wrench
  const cfStatus = project.completion_form_status
  const cfCfg    = cfStatus ? COMPLETION_FORM_CFG[cfStatus] : null

  return (
    <div className="page-content fade-in">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-md)' }}>

        {/* ── Header card ──────────────────────────────────────────────────── */}
        <div className="card">
          <div style={{
            padding: '14px 14px 12px',
            background: stageCfg.bg || 'var(--surface)',
            borderRadius: '0.5rem 0.5rem 0 0',
            borderBottom: `2px solid ${stageCfg.color || 'var(--border)'}22`,
          }}>
            {/* Type + stage */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <TypeIcon size={14} style={{ color: stageCfg.color }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: stageCfg.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {project.type?.replace('-', ' ')}
                </span>
              </div>
              <div style={{
                fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                color: stageCfg.color, background: stageCfg.bg,
                border: `1px solid ${stageCfg.color}44`,
                padding: '3px 10px', borderRadius: 20,
              }}>
                {stageCfg.label || project.stage}
              </div>
            </div>
            {/* Project name */}
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)', lineHeight: 1.2, marginBottom: 4 }}>
              {project.name}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
              {project.customer_account}
              {project.job_number && (
                <span style={{ fontFamily: 'var(--mono)', marginLeft: 8 }}>{project.job_number}</span>
              )}
            </div>
          </div>

          {/* Stage pipeline */}
          <StagePipeline stage={project.stage} />

          {/* Progress bar */}
          {project.progress > 0 && (
            <div style={{ padding: '0 14px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500 }}>Progress</span>
                <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: stageCfg.color, fontWeight: 700 }}>
                  {project.progress}%
                </span>
              </div>
              <div style={{ height: 5, borderRadius: 3, background: 'var(--border-l)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${project.progress}%`,
                  background: stageCfg.color || 'var(--orange)', borderRadius: 3,
                  transition: 'width 0.4s ease',
                }} />
              </div>
            </div>
          )}

          {/* Completion form status — if exists */}
          {cfCfg && (
            <div style={{
              margin: '0 14px 14px',
              padding: '8px 12px', borderRadius: 8,
              background: cfCfg.bg, border: `1px solid ${cfCfg.color}33`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: cfCfg.color }}>
                Completion Form: {cfCfg.label}
              </span>
              {cfStatus === 'submitted' && (
                <button
                  className="btn btn-secondary"
                  style={{ fontSize: 11, padding: '3px 10px' }}
                  onClick={() => navigate('/forms')}
                >
                  Review →
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Project details ───────────────────────────────────────────────── */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Project Details</span>
          </div>
          <div style={{ padding: '10px 14px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <InfoRow icon={MapPin}        label="Address"       value={[project.address, project.city, project.state].filter(Boolean).join(', ')} />
            <InfoRow icon={Buildings}     label="Structure"     value={project.structure} />
            <InfoRow icon={Shield}        label="NFPA Class"    value={project.nfpa_class ? `Class ${project.nfpa_class}` : null} />
            <InfoRow icon={CalendarBlank} label="Scheduled"     value={fmtDate(project.scheduled_date)} />
            <InfoRow icon={Briefcase}     label="Representative" value={project.lmc_representative} />
            <InfoRow icon={User}          label="Primary Contact" value={project.primary_contact} />
            <InfoRow icon={Phone}         label="Contact Phone"  value={project.primary_contact_phone} />
          </div>
        </div>

        {/* ── Lead technician ───────────────────────────────────────────────── */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Lead Technician</span>
          </div>
          <div style={{ padding: '10px 14px 14px' }}>
            {tech ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: '2.5rem', height: '2.5rem', borderRadius: '0.5rem',
                  background: tech.status === 'field' ? 'var(--orange-s)' : 'var(--blue-soft)',
                  color:      tech.status === 'field' ? 'var(--orange)' : 'var(--blue)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--mono)', fontSize: 'var(--fs-xs)', fontWeight: 700,
                }}>
                  {tech.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 'var(--fs-lg)' }}>{tech.name}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>
                    {tech.license}
                    {tech.phone && ` · ${tech.phone}`}
                  </div>
                </div>
                <span className={`badge badge-${tech.status === 'field' ? 'active' : 'completed'}`}>
                  {tech.status === 'field' ? 'In Field' : 'Active'}
                </span>
              </div>
            ) : (
              <div style={{ color: 'var(--text-3)', fontSize: 'var(--fs-md)' }}>Unassigned</div>
            )}
          </div>
        </div>

        {/* ── Field actions ─────────────────────────────────────────────────── */}
        {(project.stage === 'in-progress' || project.stage === 'scheduled') && (
          <div style={{ display: 'flex', gap: 'var(--gap-sm)' }}>
            <button
              className="btn btn-primary"
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              onClick={() => navigate(`/daily-field-log?project=${project.id}`)}
            >
              <Plus size={14} weight="bold" />
              Start Daily Log
            </button>
            {project.stage === 'in-progress' && !cfStatus && (
              <button
                className="btn btn-secondary"
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                onClick={() => navigate(`/forms?project=${project.id}`)}
              >
                <FileText size={14} />
                Completion Form
              </button>
            )}
          </div>
        )}

        {/* ── Notes ────────────────────────────────────────────────────────── */}
        {project.notes && (
          <div className="card">
            <div className="card-header">
              <span className="card-title">Notes</span>
            </div>
            <div style={{ padding: '10px 14px 14px', fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>
              {project.notes}
            </div>
          </div>
        )}

        {/* ── Daily Field Reports ───────────────────────────────────────────── */}
        {reports.length > 0 && (
          <div className="card">
            <div className="card-header">
              <span className="card-title">
                <span className="card-dot" style={{ background: 'var(--blue)' }} />
                Daily Field Reports
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{reports.length}</span>
            </div>
            {reports.map(r => (
              <div key={r.id} className="project-item">
                <div style={{ flex: 1 }}>
                  <div className="project-name">{fmtDate(r.report_date)}</div>
                  <div className="project-meta">
                    {r.submitted_by}
                    {r.hours_worked && ` · ${r.hours_worked}h on site`}
                  </div>
                </div>
                <span className={`badge ${r.status === 'Submitted' ? 'badge-awarded' : r.status === 'Reviewed' ? 'badge-complete' : 'badge-hold'}`}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* ── Completion forms ──────────────────────────────────────────────── */}
        {submissions.length > 0 && (
          <div className="card">
            <div className="card-header">
              <span className="card-title">
                <span className="card-dot" style={{ background: 'var(--red)' }} />
                Completion Forms
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{submissions.length}</span>
            </div>
            {submissions.map(s => {
              const sCfg = COMPLETION_FORM_CFG[s.status?.toLowerCase().replace(' ', '-')] || {}
              return (
                <div key={s.id} className="project-item">
                  <div style={{ flex: 1 }}>
                    <div className="project-name">{s.form_type ? `${s.form_type.charAt(0).toUpperCase() + s.form_type.slice(1)} Completion` : 'Completion Form'}</div>
                    <div className="project-meta">
                      {s.submitted_by} · {fmtDate(s.created_at)}
                    </div>
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                    color: sCfg.color || 'var(--text-3)',
                    background: sCfg.bg || 'var(--surface)',
                    padding: '3px 8px', borderRadius: 20,
                    border: `1px solid ${sCfg.color || 'var(--border)'}33`,
                  }}>
                    {s.status || 'Draft'}
                  </span>
                </div>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}
