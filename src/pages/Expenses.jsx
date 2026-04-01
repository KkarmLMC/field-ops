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
    <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-s)', fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)', background: s.bg, color: s.color }}>
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
        fontSize: 'var(--text-2xs)', fontWeight: 'var(--fw-black)',
        color: report.division === 'Bolt' ? 'var(--red-shade-40)' : 'var(--state-info)' }}>
        {report.division === 'Bolt' ? 'BOLT' : 'LM'}
      </div>
      <div className="content-body">
        <div className="expenses-e606">
          <span className="text-sm-bold">
            {report.employee_name}
          </span>
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)', padding: '1px 6px', borderRadius: 'var(--radius-xs)',
            background: isAdvance ? 'var(--state-success-soft)' : 'var(--state-info-soft)', color: isAdvance ? 'var(--state-success-text)' : 'var(--state-info)' }}>
            {isAdvance ? 'ADVANCE' : 'EXPENSE'}
          </span>
          <StatusBadge status={report.status} />
        </div>
        <div className="expenses-4bfa">
          {project?.name || 'No project'} · {date}
        </div>
      </div>
      <div className="expenses-9159">
        {report.grand_total > 0 && (
          <div className="text-sm-bold">
            ${Number(report.grand_total).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        )}
        <CaretRight size="0.8125rem" className="expenses-e2c9" />
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

      <div className="expenses-7849">
        <button onClick={() => setShowNewMenu(m => !m)}
          className="btn btn-navy"
          className="flex-gap-s">
          <Plus size="0.9375rem" /> New
        </button>
        {showNewMenu && (
          <div className="expenses-9dd3">
            {[['LM','advance'], ['LM','expense'], ['Bolt','advance'], ['Bolt','expense']].map(([div, type]) => (
              <button key={`${div}-${type}`}
                onClick={() => { setShowNewMenu(false); navigate(`/expenses/new?type=${type}&division=${div}`) }}
                className="expenses-0615">
                <span style={{ fontSize: 'var(--text-2xs)', fontWeight: 'var(--fw-black)', padding: '2px 6px', borderRadius: 'var(--radius-xs)', background: div === 'Bolt' ? '#FFF1F2' : 'var(--state-info-soft)', color: div === 'Bolt' ? 'var(--red-shade-40)' : 'var(--state-info)' }}>{div}</span>
                <span className="expenses-0430">{type} {type === 'advance' ? 'Request' : 'Report'}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Pending alert */}
      {submitted > 0 && (
        <div className="expenses-f90b">
          <Clock size="1.125rem" weight="fill" className="expenses-6be6" />
          <div className="content-body">
            <div className="text-sm-bold">{submitted} report{submitted !== 1 ? 's' : ''} awaiting approval</div>
            <div className="expenses-fffa">${totalPending.toLocaleString('en-US', { minimumFractionDigits: 2 })} pending</div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="expenses-ac18">
        {Object.entries(STATUS).map(([key, s]) => (
          <button key={key} onClick={() => setStatusFilter(statusFilter === key ? 'all' : key)}
            style={{ background: statusFilter === key ? s.bg : 'var(--surface-base)', borderRadius: 'var(--radius-l)', padding: 'var(--space-m)', border: `1px solid ${statusFilter === key ? s.color + '40' : 'var(--border-subtle)'}`, cursor: 'pointer', textAlign: 'left' }}>
            <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--fw-black)', color: statusFilter === key ? s.color : 'var(--text-primary)' }}>
              {reports.filter(r => r.status === key).length}
            </div>
            <div className="expenses-de37">{s.label}</div>
          </button>
        ))}
      </div>

      {/* Type filter + search */}
      <div className="position-relative mb-m">
        <MagnifyingGlass size="0.875rem" className="search-overlay-icon" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employee or project…"
          className="expenses-0561" />
        {search && <button onClick={() => setSearch('')} className="search-overlay-clear"><X size="0.8125rem" /></button>}
      </div>
      <div className="expenses-67a5">
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
