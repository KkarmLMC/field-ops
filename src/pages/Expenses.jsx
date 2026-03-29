import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Receipt, ArrowsClockwise, CurrencyDollar,
  CaretRight, CheckCircle, Clock, PaperPlaneTilt, X,
  MagnifyingGlass, Buildings,
} from '@phosphor-icons/react'
import { db } from '../lib/supabase.js'

const STATUS = {
  draft:     { label: 'Draft',     color: '#64748B', bg: '#F1F5F9' },
  submitted: { label: 'Submitted', color: '#D97706', bg: '#FEF3C7' },
  approved:  { label: 'Approved',  color: '#15803D', bg: '#F0FDF4' },
  rejected:  { label: 'Rejected',  color: '#B91C1C', bg: '#FEF2F2' },
}

function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.draft
  return (
    <span style={{ padding: '2px 8px', borderRadius: 'var(--r-full)', fontSize: 10, fontWeight: 700, background: s.bg, color: s.color }}>
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
      width: '100%', display: 'flex', alignItems: 'center', gap: 'var(--sp-3)',
      padding: 'var(--sp-3) var(--sp-4)', border: 'none', background: 'none',
      borderBottom: '1px solid var(--border-l)', cursor: 'pointer', textAlign: 'left',
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 'var(--r-lg)', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: report.division === 'Bolt' ? '#FFF1F2' : '#EFF6FF',
        fontSize: 9, fontWeight: 800,
        color: report.division === 'Bolt' ? '#BE123C' : '#1D4ED8',
      }}>
        {report.division === 'Bolt' ? 'BOLT' : 'LM'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', flexWrap: 'wrap', marginBottom: 2 }}>
          <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--text-1)' }}>
            {report.employee_name}
          </span>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4,
            background: isAdvance ? '#F0FDF4' : '#EFF6FF', color: isAdvance ? '#15803D' : '#1D4ED8' }}>
            {isAdvance ? 'ADVANCE' : 'EXPENSE'}
          </span>
          <StatusBadge status={report.status} />
        </div>
        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {project?.name || 'No project'} · {date}
        </div>
      </div>
      <div style={{ flexShrink: 0, textAlign: 'right' }}>
        {report.grand_total > 0 && (
          <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--text-1)' }}>
            ${Number(report.grand_total).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        )}
        <CaretRight size={13} style={{ color: 'var(--text-3)', marginTop: 2 }} />
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

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--sp-5)', gap: 'var(--sp-3)' }}>
        <div>
          <div style={{ fontSize: 'var(--fs-xs)', fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>FIELD</div>
          <div style={{ fontSize: 'var(--fs-2xl)', fontWeight: 800, lineHeight: 1.1 }}>Expenses</div>
        </div>
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowNewMenu(m => !m)}
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', padding: 'var(--sp-2) var(--sp-4)', borderRadius: 'var(--r-md)', border: 'none', background: 'var(--navy)', color: '#fff', fontSize: 'var(--fs-sm)', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <Plus size={15} /> New
          </button>
          {showNewMenu && (
            <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, background: 'var(--surface)', border: '1px solid var(--border-l)', borderRadius: 'var(--r-lg)', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 100, minWidth: 200, overflow: 'hidden' }}>
              {[['LM','advance'], ['LM','expense'], ['Bolt','advance'], ['Bolt','expense']].map(([div, type]) => (
                <button key={`${div}-${type}`}
                  onClick={() => { setShowNewMenu(false); navigate(`/expenses/new?type=${type}&division=${div}`) }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', padding: 'var(--sp-3) var(--sp-4)', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid var(--border-l)' }}>
                  <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: div === 'Bolt' ? '#FFF1F2' : '#EFF6FF', color: div === 'Bolt' ? '#BE123C' : '#1D4ED8' }}>{div}</span>
                  <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, textTransform: 'capitalize' }}>{type} {type === 'advance' ? 'Request' : 'Report'}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pending alert */}
      {submitted > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', padding: 'var(--sp-3) var(--sp-4)', background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 'var(--r-xl)', marginBottom: 'var(--sp-4)' }}>
          <Clock size={18} weight="fill" style={{ color: '#D97706', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: '#92400E' }}>{submitted} report{submitted !== 1 ? 's' : ''} awaiting approval</div>
            <div style={{ fontSize: 'var(--fs-xs)', color: '#A16207' }}>${totalPending.toLocaleString('en-US', { minimumFractionDigits: 2 })} pending</div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 'var(--sp-3)', marginBottom: 'var(--sp-4)' }}>
        {Object.entries(STATUS).map(([key, s]) => (
          <button key={key} onClick={() => setStatusFilter(statusFilter === key ? 'all' : key)}
            style={{ background: statusFilter === key ? s.bg : 'var(--surface-raised)', borderRadius: 'var(--r-lg)', padding: 'var(--sp-3)', border: `1px solid ${statusFilter === key ? s.color + '40' : 'var(--border-l)'}`, cursor: 'pointer', textAlign: 'left' }}>
            <div style={{ fontSize: 'var(--fs-xl)', fontWeight: 800, color: statusFilter === key ? s.color : 'var(--text-1)' }}>
              {reports.filter(r => r.status === key).length}
            </div>
            <div style={{ fontSize: 'var(--fs-xs)', fontWeight: 600, color: 'var(--text-3)', marginTop: 2 }}>{s.label}</div>
          </button>
        ))}
      </div>

      {/* Type filter + search */}
      <div style={{ position: 'relative', marginBottom: 'var(--sp-3)' }}>
        <MagnifyingGlass size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employee or project…"
          style={{ width: '100%', paddingLeft: 30 }} />
        {search && <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-3)' }}><X size={13} /></button>}
      </div>
      <div style={{ display: 'flex', gap: 'var(--sp-2)', marginBottom: 'var(--sp-4)', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {[['all','All'],['advance','Advances'],['expense','Expenses']].map(([val,lbl]) => (
          <button key={val} onClick={() => setTypeFilter(val)}
            style={{ flexShrink: 0, padding: 'var(--sp-1) var(--sp-3)', borderRadius: 'var(--r-full)', border: `1px solid ${typeFilter === val ? 'var(--navy)' : 'var(--border-l)'}`, background: typeFilter === val ? 'var(--navy)' : 'transparent', color: typeFilter === val ? '#fff' : 'var(--text-2)', fontSize: 'var(--fs-xs)', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {lbl}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--sp-10)' }}><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty">
          <Receipt size={36} style={{ color: 'var(--text-3)', marginBottom: 'var(--sp-3)' }} />
          <div className="empty-title">No reports found</div>
          <div className="empty-desc">Create an advance request or expense report to get started.</div>
        </div>
      ) : (
        <div style={{ background: 'var(--surface-raised)', borderRadius: 'var(--r-xl)', overflow: 'hidden', border: '1px solid var(--border-l)' }}>
          {filtered.map(r => (
            <ReportCard key={r.id} report={r} project={projects[r.project_id]}
              onClick={() => navigate(`/expenses/${r.id}`)} />
          ))}
        </div>
      )}
    </div>
  )
}
