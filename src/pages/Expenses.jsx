import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Receipt, ArrowsClockwise, CurrencyDollar,
  CaretRight, CheckCircle, Clock, PaperPlaneTilt, X,
  MagnifyingGlass, Buildings } from '@phosphor-icons/react'
import { db } from '../lib/supabase.js'

const STATUS = {
  draft:     { label: 'Draft',     color: 'var(--grey-base)', bg: 'var(--grey-tint-80)' },
  submitted: { label: 'Submitted', color: 'var(--warning)', bg: 'var(--warning-soft)' },
  approved:  { label: 'Approved',  color: 'var(--state-success-text)', bg: 'var(--state-success-soft)' },
  rejected:  { label: 'Rejected',  color: 'var(--state-error-text)', bg: 'var(--state-error-soft)' } }

function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.draft
  return (
    <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-s)', fontSize: 'var(--text-xs)', fontWeight: 700, background: s.bg, color: s.color }}>
      {s.label}
    </span>
  )
}

function ReportCard({ report, project, onClick }) {
  const date = report.report_date
    ? new Date(report.report_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—'
  const isAdvance = report.type === 'advance'

  return (
    <button onClick={onClick} style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem',
      padding: 'var(--space-m) var(--space-l)', background: 'none',
      borderBottom: '1px solid var(--border-default)', cursor: 'pointer', textAlign: 'left' }}>
      <div style={{
        width: 40, height: 40, borderRadius: 'var(--radius-l)', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: report.division === 'Bolt' ? '#FFF1F2' : 'var(--state-info-soft)',
        fontSize: 'var(--text-2xs)', fontWeight: 800,
        color: report.division === 'Bolt' ? 'var(--red-shade-40)' : 'var(--state-info)' }}>
        {report.division === 'Bolt' ? 'BOLT' : 'LM'}
      </div>
      <div className="content-body">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-s)', flexWrap: 'wrap', marginBottom: 2 }}>
          <span className="text-sm-bold">
            {report.employee_name}
          </span>
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, padding: '1px 6px', borderRadius: 4,
            background: isAdvance ? 'var(--state-success-soft)' : 'var(--state-info-soft)', color: isAdvance ? 'var(--state-success-text)' : 'var(--state-info)' }}>
            {isAdvance ? 'ADVANCE' : 'EXPENSE'}
          </span>
          <StatusBadge status={report.status} />
        </div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {project?.name || 'No project'} · {date}
        </div>
      </div>
      <div style={{ flexShrink: 0, textAlign: 'right' }}>
        {report.grand_total > 0 && (
          <div className="text-sm-bold">
            ${Number(report.grand_total).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        )}
        <CaretRight size="0.8125rem" style={{ color: 'var(--text-primary)', marginTop: 2 }} />
      </div>
    </button>
  )
}

export default function Expenses() {
  const navigate = useNavigate()
  const [reports, setReports] = useState([])
  const [projects, setProjects] = useState({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showNewMenu, setShowNewMenu] = useState(false)

  useEffect(() => {
    Promise.all([
      db.from('expense_reports').select('*').order('created_at', { ascending: false }),
      db.from('projects').select('id, name, job_number'),
    ]).then(([{ data: rpts }, { data: projs }]) => {
      setReports(rpts || [])
      const pm = {}
      projs?.forEach(p => { pm[p.id] = p })
      setProjects(pm)
      setLoading(false)
    })
  }, [])

  const filtered = reports.filter(r => {
    if (typeFilter !== 'all' && r.type !== typeFilter) return false
    if (statusFilter !== 'all' && r.status !== statusFilter) return false
    if (search) {
      const q = search.toLowerCase()
      const proj = projects[r.project_id]
      return (r.employee_name || '').toLowerCase().includes(q) ||
        (proj?.name || '').toLowerCase().includes(q)
    }
    return true
  })

  const submitted = reports.filter(r => r.status === 'submitted').length
  const totalPending = reports
    .filter(r => r.status === 'submitted')
    .reduce((s, r) => s + (Number(r.grand_total) || 0), 0)

  return (
    <div className="page-content fade-in">

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-m)', position: 'relative' }}>
        <button onClick={() => setShowNewMenu(m => !m)}
          className="btn btn-navy"
          className="flex-gap-s">
          <Plus size="0.9375rem" /> New
        </button>
        {showNewMenu && (
          <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, background: 'var(--surface-base)', borderRadius: 'var(--radius-l)', zIndex: 100, minWidth: 200, overflow: 'hidden' }}>
            {[['LM','advance'], ['LM','expense'], ['Bolt','advance'], ['Bolt','expense']].map(([div, type]) => (
              <button key={`${div}-${type}`}
                onClick={() => { setShowNewMenu(false); navigate(`/expenses/new?type=${type}&division=${div}`) }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 'var(--space-m)', padding: 'var(--space-m) var(--space-l)', background: 'none', cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid var(--border-default)' }}>
                <span style={{ fontSize: 'var(--text-2xs)', fontWeight: 'var(--fw-black)', padding: '2px 6px', borderRadius: 4, background: div === 'Bolt' ? '#FFF1F2' : 'var(--state-info-soft)', color: div === 'Bolt' ? 'var(--red-shade-40)' : 'var(--state-info)' }}>{div}</span>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-semibold)', textTransform: 'capitalize' }}>{type} {type === 'advance' ? 'Request' : 'Report'}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Pending alert */}
      {submitted > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-m)', padding: 'var(--space-m) var(--space-l)', background: 'var(--warning-soft)', borderRadius: 'var(--radius-m)', marginBottom: 'var(--space-l)' }}>
          <Clock size="1.125rem" weight="fill" style={{ color: 'var(--warning)', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--warning-text)' }}>{submitted} report{submitted !== 1 ? 's' : ''} awaiting approval</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--warning-shade-20)' }}>${totalPending.toLocaleString('en-US', { minimumFractionDigits: 2 })} pending</div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 'var(--space-m)', marginBottom: 'var(--space-l)' }}>
        {Object.entries(STATUS).map(([key, s]) => (
          <button key={key} onClick={() => setStatusFilter(statusFilter === key ? 'all' : key)}
            style={{ background: statusFilter === key ? s.bg : 'var(--surface-base)', borderRadius: 'var(--radius-l)', padding: 'var(--space-m)', border: `1px solid ${statusFilter === key ? s.color + '40' : 'var(--border-subtle)'}`, cursor: 'pointer', textAlign: 'left' }}>
            <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: statusFilter === key ? s.color : 'var(--text-primary)' }}>
              {reports.filter(r => r.status === key).length}
            </div>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
          </button>
        ))}
      </div>

      {/* Type filter + search */}
      <div style={{ position: 'relative', marginBottom: 'var(--space-m)' }}>
        <MagnifyingGlass size="0.875rem" className="search-overlay-icon" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employee or project…"
          style={{ width: '100%', paddingLeft: 30 }} />
        {search && <button onClick={() => setSearch('')} className="search-overlay-clear"><X size="0.8125rem" /></button>}
      </div>
      <div style={{ display: 'flex', gap: 'var(--space-s)', marginBottom: 'var(--space-l)', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {[['all','All'],['advance','Advances'],['expense','Expenses']].map(([val,lbl]) => (
          <button key={val} onClick={() => setTypeFilter(val)}
            style={{ flexShrink: 0, padding: 'var(--space-xs) var(--space-m)', borderRadius: 'var(--radius-l)', border: `1px solid ${typeFilter === val ? 'var(--brand-primary)' : 'var(--border-subtle)'}`, background: typeFilter === val ? 'var(--brand-primary)' : 'var(--surface-hover)', color: typeFilter === val ? '#fff' : 'var(--text-primary)', fontSize: 'var(--text-xs)', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {lbl}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="spinner-pad"><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty">
          <Receipt size="2.25rem" className="empty-icon" />
          <div className="empty-title">No reports found</div>
          <div className="empty-desc">Create an advance request or expense report to get started.</div>
        </div>
      ) : (
        <div className="card-section">
          {filtered.map(r => (
            <ReportCard key={r.id} report={r} project={projects[r.project_id]}
              onClick={() => navigate(`/expenses/${r.id}`)} />
          ))}
        </div>
      )}
    </div>
  )
}
