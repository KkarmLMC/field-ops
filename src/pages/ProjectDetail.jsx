import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  MapPin, Buildings, CalendarBlank, Shield, FileText, User,
  Phone, Briefcase, Lightning, MagnifyingGlass, Wrench, ClipboardText,
  CheckCircle, Warning, Clock, CaretRight, Plus, CurrencyDollar,
  TrendUp, Receipt, ArrowRight, NotePencil, SealCheck,
  Truck, AirplaneTilt } from '@phosphor-icons/react'
import { db } from '../lib/supabase'
import { PROJECTS, TECHNICIANS, MOCK_REPORTS, MOCK_SUBMISSIONS } from '../data/mockData.js'
import { projectStage, approvalStatus } from '../lib/statusColors.js'

// ─── Stage config ─────────────────────────────────────────────────────────────
const STAGE_CFG = {
  'scheduled':      { ...projectStage('scheduled'),      order: 1 },
  'in-progress':    { ...projectStage('in-progress'),    order: 2 },
  'pending-review': { ...projectStage('pending-review'), order: 3 },
  'complete':       { ...projectStage('complete'),        order: 4 },
  'postponed':      { ...projectStage('postponed'),      order: 5 },
  'failed':         { ...projectStage('failed'),         order: 6 } }

const STAGE_PIPELINE = ['scheduled','in-progress','pending-review','complete']

const COMPLETION_FORM_CFG = {
  'draft':           { label: 'Draft',            color: 'var(--grey-base)',     bg: 'var(--surface-base)' },
  'submitted':       { label: 'Needs Review',      color: 'var(--state-info)',          bg: 'var(--state-info-soft)' },
  'under-review':    { label: 'Under Review',      color: 'var(--warning)',       bg: 'var(--warning-soft)' },
  'customer-signoff':{ label: 'Customer Sign-off', color: 'var(--purple)',        bg: 'var(--purple-soft)' },
  'complete':        { label: 'Approved',          color: 'var(--state-success-text)',  bg: 'var(--state-success-soft)' } }

const TYPE_ICON = {
  installation:  Lightning,
  inspection:    MagnifyingGlass,
  'site-survey': Wrench,
  certification: ClipboardText,
  remediation:   Wrench }

function getTech(id) {
  return TECHNICIANS.find(t => t.id === id) || null
}

// ─── Stage config ─────────────────────────────────────────────────────────────

function fmtDate(d) {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch { return d }
}

function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null
  return (
    <div className="project-detail-2e0d">
      <Icon size="0.875rem" className="project-detail-dafa" />
      <div>
        <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-muted)', letterSpacing: 'var(--tracking-tight)', marginBottom: 'var(--space-3xs)' }}>{label}</div>
        <div className="project-detail-3a68">{value}</div>
      </div>
    </div>
  )
}

// ─── Stage pipeline ───────────────────────────────────────────────────────────
function StagePipeline({ stage }) {
  const currentIdx = STAGE_PIPELINE.findIndex(s => s === stage)
  const isOffPipeline = currentIdx === -1 // postponed / failed

  return (
    <div className="project-detail-4e3f">
      <div className="project-detail-9b1c">
        {STAGE_PIPELINE.map((s, i) => {
          const cfg = STAGE_CFG[s]
          const isDone    = !isOffPipeline && i < currentIdx
          const isCurrent = !isOffPipeline && i === currentIdx
          return (
            <div key={s} className="project-detail-81dd">
              <div className="project-detail-b332">
                <div style={{
                  width:  isCurrent ? 14 : 10,
                  height: isCurrent ? 14 : 10,
                  borderRadius: 'var(--radius-round)',
                  background: isCurrent ? cfg.color : isDone ? 'var(--state-success)' : 'var(--border)',
                  border: 'none',
                  transition: 'all 0.2s',
                  flexShrink: 0 }} />
                <span style={{
                  fontSize: 'var(--text-2xs)', fontWeight: isCurrent ? 700 : 500,
                  color: isCurrent ? cfg.color : isDone ? 'var(--state-success-text)' : 'var(--text-muted)',
                  whiteSpace: 'nowrap' }}>
                  {cfg.label}
                </span>
              </div>
              {i < STAGE_PIPELINE.length - 1 && (
                <div style={{
                  width: 24, height: 2, margin: '0 4px', marginBottom: 14,
                  background: isDone ? 'var(--state-success)' : 'var(--border)',
                  borderRadius: 'var(--radius-xs)', flexShrink: 0 }} />
              )}
            </div>
          )
        })}
      </div>
      {isOffPipeline && (
        <div style={{ marginTop: 'var(--space-s)' }}>
          <span style={{
            fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)', color: STAGE_CFG[stage]?.color || 'var(--text-muted)',
            background: STAGE_CFG[stage]?.bg || 'var(--surface-base)',
            padding: 'var(--space-2xs) var(--space-m)', borderRadius: 'var(--radius-m)' }}>
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
  const [shipments, setShipments]     = useState([])
  const [loading, setLoading]         = useState(true)
  const [jobCost, setJobCost]         = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        // Try Supabase first with a 5s timeout to prevent infinite spinner
        const timeout = ms => new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))
        const [{ data: p }, { data: r }, { data: s }] = await Promise.race([
          Promise.all([
            db.from('projects').select('*').eq('id', id).maybeSingle(),
            db.from('daily_field_logs').select('*').eq('project_id', id).order('report_date', { ascending: false }).range(0, 24),
            db.from('form_submissions').select('*').eq('project_id', id).order('created_at', { ascending: false }).range(0, 24),
          ]),
          timeout(5000),
        ])
        if (cancelled) return
        const proj = p || PROJECTS.find(x => x.id === id) || null
        setProject(proj)
        setReports(r?.length ? r : (MOCK_REPORTS || []).filter(x => x.project_id === id))
        setSubmissions(s?.length ? s : (MOCK_SUBMISSIONS || []).filter(x => x.project_id === id))

        // Job cost data (non-blocking — don't let this block the page)
        try {
          const [{ data: expenses }, { data: soData }] = await Promise.race([
            Promise.all([
              db.from('expense_reports').select('type, grand_total, status').eq('project_id', id),
              db.from('sales_orders').select('id, grand_total, materials_total, installation_total, status').eq('project_ref', proj?.job_number || ''),
            ]),
            timeout(5000),
          ])
          if (cancelled) return
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
            installTotal:  (soData || []).reduce((s, so) => s + (parseFloat(so.installation_total) || 0), 0) })

          // Fetch shipments for all linked SOs
          const soIds = (soData || []).map(so => so.id).filter(Boolean)
          if (soIds.length > 0 && !cancelled) {
            const { data: sh } = await db.from('shipments')
              .select('*')
              .in('so_id', soIds)
              .order('shipped_at', { ascending: false })
            if (!cancelled) setShipments(sh || [])
          }
        } catch { /* job cost is optional — page still renders */ }
      } catch {
        if (cancelled) return
        setProject(PROJECTS.find(x => x.id === id) || null)
        setReports((MOCK_REPORTS || []).filter(x => x.project_id === id))
        setSubmissions((MOCK_SUBMISSIONS || []).filter(x => x.project_id === id))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [id])

  if (loading) return (
    <div className="page-content fade-in project-detail-961f">
      <div className="spinner" />
    </div>
  )

  if (!project) return (
    <div className="page-content fade-in">
      <div className="empty">
        <div className="empty-icon">🔍</div>
        <div className="empty-title">Project not found</div>
        <div className="empty-desc">"{id}" could not be found.</div>
        <button className="btn btn-primary" style={{ marginTop: 'var(--space-m)' }} onClick={() => navigate('/installations')}>
          Back to Installations
        </button>
      </div>
    </div>
  )

  const stageCfg = projectStage(project.stage) || {}
  const tech     = getTech(project.lead_tech_id)
  const TypeIcon = TYPE_ICON[project.type] || Wrench
  const cfStatus = project.completion_form_status
  const cfCfg    = cfStatus ? COMPLETION_FORM_CFG[cfStatus] : null

  return (
    <div className="page-content fade-in">
      <div className="modal-body">

        {/* ── Header card ──────────────────────────────────────────────────── */}
        <div className="card">
          <div style={{
            padding: '14px 14px 12px',
            background: stageCfg.bg || 'var(--surface-base)',
            borderRadius: '0.5rem 0.5rem 0 0',
            borderBottom: `2px solid ${stageCfg.color || 'var(--border)'}22` }}>
            {/* Type + stage */}
            <div className="project-detail-0ee5">
              <div className="project-detail-d7ff">
                <TypeIcon size="0.875rem" style={{ color: stageCfg.color }} />
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-semibold)', color: stageCfg.color }}>
                  {project.type?.replace('-', ' ')}
                </span>
              </div>
              <div style={{
                fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                color: stageCfg.color, background: stageCfg.bg,
                border: `1px solid ${stageCfg.color}44`,
                padding: '3px 10px', borderRadius: 'var(--radius-m)' }}>
                {stageCfg.label || project.stage}
              </div>
            </div>
            {/* Project name */}
            <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--fw-bold)', color: 'var(--text-primary)', lineHeight: 'var(--leading-tight)', marginBottom: 'var(--space-2xs)' }}>
              {project.name}
            </div>
            <div className="meta-text">
              {project.customer_account}
              {project.job_number && (
                <span className="project-detail-4dff">{project.job_number}</span>
              )}
            </div>
          </div>

          {/* Stage pipeline */}
          <StagePipeline stage={project.stage} />

          {/* Progress bar */}
          {project.progress > 0 && (
            <div style={{ padding: '0 var(--space-l) var(--space-l)' }}>
              <div className="project-detail-d4b0">
                <span className="project-detail-6fe4">Progress</span>
                <span style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', color: stageCfg.color, fontWeight: 'var(--fw-bold)' }}>
                  {project.progress}%
                </span>
              </div>
              <div className="project-detail-90f2">
                <div style={{
                  height: '100%', width: `${project.progress}%`,
                  background: stageCfg.color || 'var(--state-warning-text)', borderRadius: 'var(--radius-xs)',
                  transition: 'width 0.4s ease' }} />
              </div>
            </div>
          )}

          {/* Completion form status — if exists */}
          {cfCfg && (
            <div style={{
              margin: '0 14px 14px',
              padding: '8px 12px', borderRadius: 'var(--radius-m)',
              background: cfCfg.bg, border: `1px solid ${cfCfg.color}33`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-semibold)', color: cfCfg.color }}>
                Completion Form: {cfCfg.label}
              </span>
              {cfStatus === 'submitted' && (
                <button
                  className="btn btn-secondary"
                  className="project-detail-0620"
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
          <div className="list-card__header">
            <span className="list-card__title">Project Details</span>
          </div>
          <div className="project-detail-6045">
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
          <div className="list-card__header">
            <span className="list-card__title"><User size="0.875rem" /> Lead Technician</span>
          </div>
          <div style={{ padding: 'var(--space-m) var(--space-l) var(--space-l)' }}>
            {tech ? (
              <div className="project-detail-8b5b">
                <div style={{
                  width: 'var(--icon-size-lg)', height: 'var(--icon-size-lg)', borderRadius: '0.5rem',
                  background: tech.status === 'field' ? 'var(--state-warning-soft)' : 'var(--state-info-soft)',
                  color:      tech.status === 'field' ? 'var(--state-warning-text)' : 'var(--state-info)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)' }}>
                  {tech.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="content-body">
                  <div className="project-detail-96f6">{tech.name}</div>
                  <div className="project-detail-ecb7">
                    {tech.license}
                    {tech.phone && ` · ${tech.phone}`}
                  </div>
                </div>
                <span className={`badge badge-${tech.status === 'field' ? 'active' : 'completed'}`}>
                  {tech.status === 'field' ? 'In Field' : 'Active'}
                </span>
              </div>
            ) : (
              <div className="project-detail-38b3">Unassigned</div>
            )}
          </div>
        </div>

        {/* ── Field actions ─────────────────────────────────────────────────── */}
        {(project.stage === 'in-progress' || project.stage === 'scheduled') && (
          <div className="flex-gap-s">
            <button
              className="btn btn-primary"
              className="content-body flex-gap-s"
              onClick={() => navigate(`/daily-field-log?project=${project.id}`)}
            >
              <Plus size="1rem" weight="bold" />
              Start Daily Log
            </button>
            {project.stage === 'in-progress' && !cfStatus && (
              <button
                className="btn btn-secondary"
                className="content-body flex-gap-s"
                onClick={() => navigate(`/forms?project=${project.id}`)}
              >
                <FileText size="0.875rem" />
                Completion Form
              </button>
            )}
          </div>
        )}

        {/* ── Notes ────────────────────────────────────────────────────────── */}
        {project.notes && (
          <div className="card">
            <div className="list-card__header">
              <span className="list-card__title"><NotePencil size="0.875rem" /> Notes</span>
            </div>
            <div style={{ padding: 'var(--space-m) var(--space-l) var(--space-l)', fontSize: 'var(--text-sm)', color: 'var(--text-primary)', lineHeight: 'var(--leading-loose)' }}>
              {project.notes}
            </div>
          </div>
        )}

        {/* ── Deliveries ──────────────────────────────────────────────────── */}
        {shipments.length > 0 && (() => {
          const warehouseShipments = shipments.filter(s => s.shipment_type !== 'dropship')
          const dropShipments      = shipments.filter(s => s.shipment_type === 'dropship')
          const fmtShipDate = d => d ? new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : '—'
          return (
            <div className="card">
              <div className="list-card__header">
                <span className="list-card__title"><Truck size="0.875rem" /> Deliveries</span>
                <span className="list-card__meta">{shipments.length} shipment{shipments.length !== 1 ? 's' : ''}</span>
              </div>

              {/* Warehouse shipments */}
              {warehouseShipments.map(s => (
                <div key={s.id} className="pad-row">
                  <div className="flex-gap-s">
                    <Truck size="0.8125rem" style={{ color: s.status === 'shipped' ? 'var(--state-success-text)' : 'var(--state-info)' }} />
                    <span className="text-sm-bold">
                      {s.carrier || 'Warehouse Shipment'}
                    </span>
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)', padding: 'var(--space-3xs) var(--space-xs)', borderRadius: 'var(--radius-s)',
                      background: s.status === 'shipped' ? 'var(--state-success-soft)' : 'var(--state-info-soft)',
                      color: s.status === 'shipped' ? 'var(--state-success-text)' : 'var(--state-info)' }}>
                      {s.status === 'shipped' ? 'Shipped' : 'Pending'}
                    </span>
                  </div>
                  {s.tracking_number && (
                    <div className="text-xs-mono">
                      Tracking: {s.tracking_number}
                    </div>
                  )}
                  <div className="meta-text">
                    {s.shipped_at ? `Shipped ${fmtShipDate(s.shipped_at)}` : `Created ${fmtShipDate(s.created_at)}`}
                    {s.notes && <span> · {s.notes}</span>}
                  </div>
                </div>
              ))}

              {/* Drop ship deliveries sub-section */}
              {dropShipments.length > 0 && (
                <>
                  <div className="project-detail-d4c2">
                    <AirplaneTilt size="0.75rem" weight="fill" style={{ color: 'var(--state-warning-text)' }} />
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)', color: 'var(--state-warning-text)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)' }}>
                      Drop Ship Deliveries
                    </span>
                  </div>
                  {dropShipments.map(s => (
                    <div key={s.id} className="pad-row">
                      <div className="flex-gap-s">
                        <AirplaneTilt size="0.8125rem" style={{ color: s.status === 'shipped' ? 'var(--state-success-text)' : 'var(--state-warning)' }} />
                        <span className="text-sm-bold">
                          {s.carrier || 'PLP Direct'} — Drop Ship
                        </span>
                        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)', padding: 'var(--space-3xs) var(--space-xs)', borderRadius: 'var(--radius-s)',
                          background: s.status === 'shipped' ? 'var(--state-success-soft)' : 'var(--state-warning-soft)',
                          color: s.status === 'shipped' ? 'var(--state-success-text)' : 'var(--state-warning-text)' }}>
                          {s.status === 'shipped' ? 'Delivered' : 'Awaiting PLP'}
                        </span>
                      </div>
                      {s.tracking_number && (
                        <div className="text-xs-mono">
                          Tracking: {s.tracking_number}
                        </div>
                      )}
                      {s.supplier_reference && (
                        <div className="meta-text">
                          PLP Ref: {s.supplier_reference}
                        </div>
                      )}
                      <div className="meta-text">
                        {s.shipped_at ? `Shipped ${fmtShipDate(s.shipped_at)}` : `Created ${fmtShipDate(s.created_at)}`}
                        {s.notes && <span> · {s.notes}</span>}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )
        })()}

        {/* ── Daily Field Reports ───────────────────────────────────────────── */}
        {reports.length > 0 && (
          <div className="card">
            <div className="list-card__header">
              <span className="list-card__title">
                <ClipboardText size="0.875rem" /> Daily Field Reports
              </span>
              <span className="list-card__meta">{reports.length} reports</span>
            </div>
            {reports.map(r => (
              <div key={r.id} className="project-item">
                <div className="content-body">
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
          <div className="card-section">
            {/* Header */}
            <div className="pad-row">
              <div className="flex-gap-s">
                <CurrencyDollar size="1rem" style={{ color: 'var(--surface-base)' }} />
                <span className="text-sm-bold--inverse">Job Cost Overview</span>
              </div>
              {project.contract_value > 0 && (
                <span className="list-card__meta">
                  Contract: ${Number(project.contract_value).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </span>
              )}
            </div>

            {/* Field stats row */}
            <div className="project-detail-3c04">
              {[
                { label: 'Hours On-Site',  value: `${jobCost.totalHours}h` },
                { label: 'Miles Driven',   value: jobCost.totalMiles.toLocaleString() },
                { label: 'Crew Days',      value: `${jobCost.crewDays}d` + (jobCost.avgCrew > 0 ? ` · ${jobCost.avgCrew} avg` : '') },
              ].map(s => (
                <div key={s.label} className="project-detail-efee">
                  <div className="project-detail-03af">{s.value}</div>
                  <div className="project-detail-3b43">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Cost breakdown */}
            <div className="pad-row">
              {[
                { label: 'Materials',     value: jobCost.materialsTotal,  color: 'var(--state-info)' },
                { label: 'Installation',  value: jobCost.installTotal,    color: 'var(--purple)' },
                { label: 'Field Expenses',value: jobCost.expenseTotal,    color: 'var(--warning)' },
                { label: 'Advances Issued',value: jobCost.advanceTotal,   color: 'var(--grey-base)' },
              ].filter(r => r.value > 0).map((r, i, arr) => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-s) 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border-default)' : 'none' }}>
                  <div className="flex-gap-s">
                    <div className="status-dot" />
                    <span className="text-sm-bold">{r.label}</span>
                  </div>
                  <span className="text-sm-bold">
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-m) var(--space-l)', background: isPositive ? 'var(--state-success-soft)' : 'var(--state-error-soft)', borderTop: '2px solid var(--border-default)' }}>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-bold)', color: isPositive ? 'var(--state-success-text)' : 'var(--state-error-text)' }}>
                    {isPositive ? 'Estimated Margin' : 'Cost Overrun'}
                  </span>
                  <div className="text-right">
                    <div style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--fw-black)', color: isPositive ? 'var(--state-success-text)' : 'var(--state-error-text)' }}>
                      ${Math.abs(margin).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: isPositive ? 'var(--state-success-text)' : 'var(--error-alt)', fontWeight: 'var(--fw-semibold)' }}>
                      {isPositive ? '+' : '-'}{Math.abs(marginPct)}%
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* Quick link to expenses */}
            <button onClick={() => navigate('/expenses')}
              className="project-detail-e521">
              <span className="text-xs-semi">
                {jobCost.expenseCount} expense report{jobCost.expenseCount !== 1 ? 's' : ''}
              </span>
              <div className="project-detail-5acb">
                View Expenses <CaretRight size="0.75rem" />
              </div>
            </button>
          </div>
        )}

        {/* ── Completion forms ──────────────────────────────────────────────── */}
        {submissions.length > 0 && (
          <div className="card">
            <div className="list-card__header">
              <span className="list-card__title">
                <SealCheck size="0.875rem" /> Completion Forms
              </span>
              <span className="list-card__meta">{submissions.length} forms</span>
            </div>
            {submissions.map(s => {
              const sCfg = COMPLETION_FORM_CFG[s.status?.toLowerCase().replace(' ', '-')] || {}
              return (
                <div key={s.id} className="project-item">
                  <div className="content-body">
                    <div className="project-name">{s.form_type ? `${s.form_type.charAt(0).toUpperCase() + s.form_type.slice(1)} Completion` : 'Completion Form'}</div>
                    <div className="project-meta">
                      {s.submitted_by} · {fmtDate(s.created_at)}
                    </div>
                  </div>
                  <span style={{
                    fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                    color: sCfg.color || 'var(--text-muted)',
                    background: sCfg.bg || 'var(--surface-base)',
                    padding: '3px 8px', borderRadius: 'var(--radius-m)',
                    border: `1px solid ${sCfg.color || 'var(--border)'}33` }}>
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
