import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Receipt, ArrowsClockwise, CurrencyDollar,
  CaretRight, CheckCircle, Clock, PaperPlaneTilt, X,
  MagnifyingGlass, Buildings } from '@phosphor-icons/react'
import { db } from '../lib/supabase.js'
import PageHeader from '../components/ui/PageHeader'

const STATUS = {
  draft:     { label: 'Draft',     color: 'var(--grey-base)', bg: 'var(--grey-tint-80)' },
  submitted: { label: 'Submitted', color: 'var(--warning)', bg: 'var(--warning-soft)' },
  approved:  { label: 'Approved',  color: 'var(--success-text)', bg: 'var(--success-soft)' },
  rejected:  { label: 'Rejected',  color: 'var(--error-dark)', bg: 'var(--error-soft)' } }

function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.draft
  return (
    <span style={{ padding: '2px 8px', borderRadius: 'var(--r-s)', fontSize: 'var(--text-xs)', fontWeight: 700, background: s.bg, color: s.color }}>
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
      padding: 'var(--pad-m) var(--pad-l)', background: 'none',
      borderBottom: '1px solid var(--border-l)', cursor: 'pointer', textAlign: 'left' }}>
      <div style={{
        width: 40, height: 40, borderRadius: 'var(--r-l)', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: report.division === 'Bolt' ? '#FFF1F2' : 'var(--blue-soft)',
        fontSize: 'var(--text-2xs)', fontWeight: 800,
        color: report.division === 'Bolt' ? 'var(--red-shade-40)' : 'var(--blue)' }}>
        {report.division === 'Bolt' ? 'BOLT' : 'LM'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap-s)', flexWrap: 'wrap', marginBottom: 2 }}>
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--black)' }}>
            {report.employee_name}
          </span>
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, padding: '1px 6px', borderRadius: 4,
            background: isAdvance ? 'var(--success-soft)' : 'var(--blue-soft)', color: isAdvance ? 'var(--success-text)' : 'var(--blue)' }}>
            {isAdvance ? 'ADVANCE' : 'EXPENSE'}
          </span>
          <StatusBadge status={report.status} />
        </div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {project?.name || 'No project'} · {date}
        </div>
      </div>
      <div style={{ flexShrink: 0, textAlign: 'right' }}>
        {report.grand_total > 0 && (
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--black)' }}>
            ${Number(report.grand_total).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        )}
        <CaretRight size={13} style={{ color: 'var(--black)', marginTop: 2 }} />
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

      <PageHeader eyebrow="FIELD" title="Expenses" action={
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowNewMenu(m => !m)}
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap-s)', padding: 'var(--pad-s) var(--pad-l)', borderRadius: 'var(--r-m)', background: 'var(--navy)', color: 'var(--white)', fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-bold)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <Plus size={15} /> New
          </button>
          {showNewMenu && (
            <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, background: 'var(--white)', borderRadius: 'var(--r-l)', zIndex: 100, minWidth: 200, overflow: 'hidden' }}>
              {[['LM','advance'], ['LM','expense'], ['Bolt','advance'], ['Bolt','expense']].map(([div, type]) => (
                <button key={`${div}-${type}`}
                  onClick={() => { setShowNewMenu(false); navigate(`/expenses/new?type=${type}&division=${div}`) }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 'var(--gap-m)', padding: 'var(--pad-m) var(--pad-l)', background: 'none', cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid var(--border-l)' }}>
                  <span style={{ fontSize: 'var(--text-2xs)', fontWeight: 'var(--fw-black)', padding: '2px 6px', borderRadius: 4, background: div === 'Bolt' ? '#FFF1F2' : 'var(--blue-soft)', color: div === 'Bolt' ? 'var(--red-shade-40)' : 'var(--blue)' }}>{div}</span>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-semibold)', textTransform: 'capitalize' }}>{type} {type === 'advance' ? 'Request' : 'Report'}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      } />

      {/* Pending alert */}
      {submitted > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap-m)', padding: 'var(--pad-m) var(--pad-l)', background: 'var(--warning-soft)', borderRadius: 'var(--r-m)', marginBottom: 'var(--mar-l)' }}>
          <Clock size={18} weight="fill" style={{ color: 'var(--warning)', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--warning-text)' }}>{submitted} report{submitted !== 1 ? 's' : ''} awaiting approval</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--warning-shade-20)' }}>${totalPending.toLocaleString('en-US', { minimumFractionDigits: 2 })} pending</div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 'var(--gap-m)', marginBottom: 'var(--mar-l)' }}>
        {Object.entries(STATUS).map(([key, s]) => (
          <button key={key} onClick={() => setStatusFilter(statusFilter === key ? 'all' : key)}
            style={{ background: statusFilter === key ? s.bg : 'var(--white)', borderRadius: 'var(--r-l)', padding: 'var(--pad-m)', border: `1px solid ${statusFilter === key ? s.color + '40' : 'var(--border-l)'}`, cursor: 'pointer', textAlign: 'left' }}>
            <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: statusFilter === key ? s.color : 'var(--black)' }}>
              {reports.filter(r => r.status === key).length}
            </div>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-3)', marginTop: 2 }}>{s.label}</div>
          </button>
        ))}
      </div>

      {/* Type filter + search */}
      <div style={{ position: 'relative', marginBottom: 'var(--mar-m)' }}>
        <MagnifyingGlass size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employee or project…"
          style={{ width: '100%', paddingLeft: 30 }} />
        {search && <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', cursor: 'pointer', color: 'var(--text-3)' }}><X size={13} /></button>}
      </div>
      <div style={{ display: 'flex', gap: 'var(--gap-s)', marginBottom: 'var(--mar-l)', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {[['all','All'],['advance','Advances'],['expense','Expenses']].map(([val,lbl]) => (
          <button key={val} onClick={() => setTypeFilter(val)}
            style={{ flexShrink: 0, padding: 'var(--pad-xs) var(--pad-m)', borderRadius: 'var(--r-xxl)', border: `1px solid ${typeFilter === val ? 'var(--navy)' : 'var(--border-l)'}`, background: typeFilter === val ? 'var(--navy)' : 'var(--hover)', color: typeFilter === val ? '#fff' : 'var(--black)', fontSize: 'var(--text-xs)', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {lbl}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--pad-xxl)' }}><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty">
          <Receipt size={36} style={{ color: 'var(--text-3)', marginBottom: 'var(--mar-m)' }} />
          <div className="empty-title">No reports found</div>
          <div className="empty-desc">Create an advance request or expense report to get started.</div>
        </div>
      ) : (
        <div style={{ background: 'var(--white)', borderRadius: 'var(--r-m)', overflow: 'hidden' }}>
          {filtered.map(r => (
            <ReportCard key={r.id} report={r} project={projects[r.project_id]}
              onClick={() => navigate(`/expenses/${r.id}`)} />
          ))}
        </div>
      )}
    </div>
  )
}
