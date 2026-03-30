import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  MapPin, Buildings, CalendarBlank, Shield, FileText, User,
  Phone, Briefcase, Lightning, MagnifyingGlass, Wrench, ClipboardText,
  CheckCircle, Warning, Clock, CaretRight, Plus, CurrencyDollar,
  TrendUp, Receipt, ArrowRight,
} from '@phosphor-icons/react'
import { db } from '../lib/supabase'
import { PROJECTS, TECHNICIANS, MOCK_REPORTS, MOCK_SUBMISSIONS } from '../data/mockData.js'

// ─── Stage config ─────────────────────────────────────────────────────────────
const STAGE_CFG = {
  'awarded':        { label: 'Awarded',        color: 'var(--purple)', bg: 'var(--purple-soft)', order: 0 },
  'scheduled':      { label: 'Scheduled',      color: 'var(--purple-tint-20)', bg: 'var(--purple-soft)', order: 1 },
  'in-progress':    { label: 'In Progress',    color: 'var(--warning)', bg: 'var(--warning-soft)', order: 2 },
  'pending-review': { label: 'Pending Review', color: 'var(--blue)', bg: 'var(--blue-soft)', order: 3 },
  'complete':       { label: 'Complete',       color: 'var(--success-text)', bg: 'var(--success-soft)', order: 4 },
  'postponed':      { label: 'Postponed',      color: 'var(--orange-shade-20)', bg: 'var(--orange-soft)', order: 5 },
  'failed':         { label: 'Failed',         color: 'var(--error-alt)', bg: 'var(--error-soft)', order: 6 },
}

const STAGE_PIPELINE = ['awarded','scheduled','in-progress','pending-review','complete']

const COMPLETION_FORM_CFG = {
  'draft':           { label: 'Draft',           color: 'var(--grey-base)', bg: 'var(--surface-raised)' },
  'submitted':       { label: 'Needs Review',     color: 'var(--blue)', bg: 'var(--blue-soft)' },
  'under-review':    { label: 'Under Review',     color: 'var(--warning)', bg: 'var(--warning-soft)' },
  'customer-signoff':{ label: 'Customer Sign-off',color: 'var(--purple)', bg: 'var(--purple-soft)' },
  'complete':        { label: 'Approved',         color: 'var(--success-text)', bg: 'var(--success-soft)' },
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
        <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.03em', marginBottom: 1 }}>{label}</div>
        <div style={{ fontSize: 'var(--text-md)', color: 'var(--black)' }}>{value}</div>
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
                  background: isCurrent ? cfg.color : isDone ? 'var(--success)' : 'var(--border)',
                  border: isCurrent ? `3px solid ${cfg.bg}` : 'none',
                  boxShadow: isCurrent ? `0 0 0 2px ${cfg.color}` : 'none',
                  transition: 'all 0.2s',
                  flexShrink: 0,
                }} />
                <span style={{
                  fontSize: 'var(--text-2xs)', fontWeight: isCurrent ? 700 : 500,
                  color: isCurrent ? cfg.color : isDone ? 'var(--success-text)' : 'var(--text-3)',
                  whiteSpace: 'nowrap',
                }}>
                  {cfg.label}
                </span>
              </div>
              {i < STAGE_PIPELINE.length - 1 && (
                <div style={{
                  width: 24, height: 2, margin: '0 4px', marginBottom: 14,
                  background: isDone ? 'var(--success)' : 'var(--border)',
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
            fontSize: 'var(--text-xs)', fontWeight: 700, color: STAGE_CFG[stage]?.color || 'var(--text-3)',
            background: STAGE_CFG[stage]?.bg || 'var(--white)',
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
  const [jobCost, setJobCost]         = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const [{ data: p }, { data: r }, { data: s }] = await Promise.all([
          db.from('projects').select('*').eq('id', id).single(),
          db.from('daily_field_logs').select('*').eq('project_id', id).order('report_date', { ascending: false }).range(0, 24),
          db.from('form_submissions').select('*').eq('project_id', id).order('created_at', { ascending: false }).range(0, 24),
        ])
        setProject(p || PROJECTS.find(x => x.id === id) || null)
        setReports(r?.length ? r : (MOCK_REPORTS || []).filter(x => x.project_id === id))
        setSubmissions(s?.length ? s : (MOCK_SUBMISSIONS || []).filter(x => x.project_id === id))

        // Job cost data
        const [{ data: expenses }, { data: soData }] = await Promise.all([
          db.from('expense_reports').select('type, grand_total, status').eq('project_id', id),
          db.from('sales_orders').select('grand_total, materials_total, installation_total, status').eq('project_ref', p?.job_number || ''),
        ])
        const logs = r || []
        setJobCost({
          totalHours:    logs.reduce((s, l) => s + (parseFloat(l.hours_worked) || 0), 0),
          totalMiles:    logs.reduce((s, l) => s + (parseFloat(l.miles_driven) || 0), 0),
          totalDriveTime:logs.reduce((s, l) => s + (parseFloat(l.drive_time)   || 0), 0),
          crewDays:      logs.length,
          avgCrew:       logs.length ? Math.round(logs.reduce((s, l) => s + (l.crew_on_site?.length || 0), 0) / logs.length) : 0,
          expenseTotal:  (expenses || []).filter(e => e.type === 'expense').reduce((s, e) => s + (parseFloat(e.grand_total) || 0), 0),
          advanceTotal:  (expenses || []).filter(e => e.type === 'advance').reduce((s, e) => s + (parseFloat(e.grand_total) || 0), 0),
          expenseCount:  (expenses || []).length,
          soTotal:       (soData || []).reduce((s, so) => s + (parseFloat(so.grand_total) || 0), 0),
          materialsTotal:(soData || []).reduce((s, so) => s + (parseFloat(so.materials_total) || 0), 0),
          installTotal:  (soData || []).reduce((s, so) => s + (parseFloat(so.installation_total) || 0), 0),
        })
      } catch {
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-m)' }}>

        {/* ── Header card ──────────────────────────────────────────────────── */}
        <div className="card">
          <div style={{
            padding: '14px 14px 12px',
            background: stageCfg.bg || 'var(--white)',
            borderRadius: '0.5rem 0.5rem 0 0',
            borderBottom: `2px solid ${stageCfg.color || 'var(--border)'}22`,
          }}>
            {/* Type + stage */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <TypeIcon size={14} style={{ color: stageCfg.color }} />
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: stageCfg.color }}>
                  {project.type?.replace('-', ' ')}
                </span>
              </div>
              <div style={{
                fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                color: stageCfg.color, background: stageCfg.bg,
                border: `1px solid ${stageCfg.color}44`,
                padding: '3px 10px', borderRadius: 20,
              }}>
                {stageCfg.label || project.stage}
              </div>
            </div>
            {/* Project name */}
            <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--black)', lineHeight: 1.2, marginBottom: 4 }}>
              {project.name}
            </div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-3)' }}>
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
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-3)', fontWeight: 500 }}>Progress</span>
                <span style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--mono)', color: stageCfg.color, fontWeight: 700 }}>
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
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: cfCfg.color }}>
                Completion Form: {cfCfg.label}
              </span>
              {cfStatus === 'submitted' && (
                <button
                  className="btn btn-secondary"
                  style={{ fontSize: 'var(--text-xs)', padding: '3px 10px' }}
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
                  background: tech.status === 'field' ? 'var(--orange-soft)' : 'var(--blue-soft)',
                  color:      tech.status === 'field' ? 'var(--orange)' : 'var(--blue)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--mono)', fontSize: 'var(--text-xs)', fontWeight: 700,
                }}>
                  {tech.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 'var(--text-lg)' }}>{tech.name}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 'var(--text-xs)', color: 'var(--text-3)', marginTop: 1 }}>
                    {tech.license}
                    {tech.phone && ` · ${tech.phone}`}
                  </div>
                </div>
                <span className={`badge badge-${tech.status === 'field' ? 'active' : 'completed'}`}>
                  {tech.status === 'field' ? 'In Field' : 'Active'}
                </span>
              </div>
            ) : (
              <div style={{ color: 'var(--text-3)', fontSize: 'var(--text-md)' }}>Unassigned</div>
            )}
          </div>
        </div>

        {/* ── Field actions ─────────────────────────────────────────────────── */}
        {(project.stage === 'in-progress' || project.stage === 'scheduled') && (
          <div style={{ display: 'flex', gap: 'var(--gap-s)' }}>
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
            <div style={{ padding: '10px 14px 14px', fontSize: 'var(--text-sm)', color: 'var(--black)', lineHeight: 1.6 }}>
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
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-3)' }}>{reports.length}</span>
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

        {/* ── Job Cost Overview ─────────────────────────────────────────── */}
        {jobCost && (
          <div style={{ background: 'var(--white)', borderRadius: 'var(--r-m)', overflow: 'hidden', border: 'none', boxShadow: 'var(--shadow-xs)' }}>
            {/* Header */}
            <div style={{ background: 'var(--navy)', padding: 'var(--pad-m) var(--pad-l)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap-s)' }}>
                <CurrencyDollar size={15} style={{ color: 'rgba(255,255,255,0.7)' }} />
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: '#fff' }}>Job Cost Overview</span>
              </div>
              {project.contract_value > 0 && (
                <span style={{ fontSize: 'var(--text-xs)', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
                  Contract: ${Number(project.contract_value).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </span>
              )}
            </div>

            {/* Field stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1px', background: 'var(--border-l)' }}>
              {[
                { label: 'Hours On-Site',  value: `${jobCost.totalHours}h` },
                { label: 'Miles Driven',   value: jobCost.totalMiles.toLocaleString() },
                { label: 'Crew Days',      value: `${jobCost.crewDays}d` + (jobCost.avgCrew > 0 ? ` · ${jobCost.avgCrew} avg` : '') },
              ].map(s => (
                <div key={s.label} style={{ background: 'var(--white)', padding: 'var(--pad-m) var(--pad-l)' }}>
                  <div style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--black)' }}>{s.value}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-3)', fontWeight: 600, marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Cost breakdown */}
            <div style={{ padding: 'var(--pad-m) var(--pad-l)' }}>
              {[
                { label: 'Materials',     value: jobCost.materialsTotal,  color: 'var(--blue)' },
                { label: 'Installation',  value: jobCost.installTotal,    color: 'var(--purple)' },
                { label: 'Field Expenses',value: jobCost.expenseTotal,    color: 'var(--warning)' },
                { label: 'Advances Issued',value: jobCost.advanceTotal,   color: 'var(--grey-base)' },
              ].filter(r => r.value > 0).map((r, i, arr) => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--pad-s) 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border-l)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap-s)' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: r.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--black)' }}>{r.label}</span>
                  </div>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>
                    ${r.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>

            {/* Margin */}
            {project.contract_value > 0 && (() => {
              const totalCost = jobCost.materialsTotal + jobCost.installTotal + jobCost.expenseTotal
              const margin = project.contract_value - totalCost
              const marginPct = ((margin / project.contract_value) * 100).toFixed(1)
              const isPositive = margin >= 0
              return (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--pad-m) var(--pad-l)', background: isPositive ? 'var(--success-soft)' : 'var(--error-soft)', borderTop: '2px solid var(--border-l)' }}>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: isPositive ? 'var(--success-text)' : 'var(--error-dark)' }}>
                    {isPositive ? 'Estimated Margin' : 'Cost Overrun'}
                  </span>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 'var(--text-md)', fontWeight: 800, color: isPositive ? 'var(--success-text)' : 'var(--error-dark)' }}>
                      ${Math.abs(margin).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: isPositive ? 'var(--success-text)' : 'var(--error-alt)', fontWeight: 600 }}>
                      {isPositive ? '+' : '-'}{Math.abs(marginPct)}%
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* Quick link to expenses */}
            <button onClick={() => navigate('/expenses')}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--pad-m) var(--pad-l)', border: 'none', background: 'none', cursor: 'pointer', borderTop: '1px solid var(--border-l)' }}>
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-3)' }}>
                {jobCost.expenseCount} expense report{jobCost.expenseCount !== 1 ? 's' : ''}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--navy)' }}>
                View Expenses <CaretRight size={12} />
              </div>
            </button>
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
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-3)' }}>{submissions.length}</span>
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
                    fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                    color: sCfg.color || 'var(--text-3)',
                    background: sCfg.bg || 'var(--white)',
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
