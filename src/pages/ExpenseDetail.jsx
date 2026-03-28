import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  CheckCircle, Clock, PaperPlaneTilt, Warning,
  ArrowRight, Buildings, CurrencyDollar,
} from '@phosphor-icons/react'
import { db } from '../lib/supabase.js'

const STATUS_FLOW = {
  draft:     { next: 'submitted', label: 'Submit',  bg: '#D97706', color: '#fff' },
  submitted: { next: 'approved',  label: 'Approve', bg: '#15803D', color: '#fff' },
  approved:  { next: null },
  rejected:  { next: null },
}

const STATUS_COLORS = {
  draft:     { color: '#64748B', bg: '#F1F5F9' },
  submitted: { color: '#D97706', bg: '#FEF3C7' },
  approved:  { color: '#15803D', bg: '#F0FDF4' },
  rejected:  { color: '#B91C1C', bg: '#FEF2F2' },
}

export default function ExpenseDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [report, setReport] = useState(null)
  const [project, setProject] = useState(null)
  const [lines, setLines] = useState([])
  const [mileage, setMileage] = useState([])
  const [advanceLines, setAdvanceLines] = useState([])
  const [loading, setLoading] = useState(true)
  const [advancing, setAdvancing] = useState(false)

  const load = async () => {
    const { data: r } = await db.from('expense_reports').select('*').eq('id', id).single()
    if (!r) { setLoading(false); return }
    setReport(r)
    if (r.project_id) {
      const { data: p } = await db.from('projects').select('id,name,job_number').eq('id', r.project_id).single()
      setProject(p)
    }
    if (r.type === 'expense') {
      const [{ data: li }, { data: ml }] = await Promise.all([
        db.from('expense_line_items').select('*').eq('report_id', id).order('sort_order'),
        db.from('expense_mileage_log').select('*').eq('report_id', id).order('entry_date'),
      ])
      setLines(li || [])
      setMileage(ml || [])
    } else {
      const { data: al } = await db.from('expense_advance_lines').select('*').eq('report_id', id).order('sort_order')
      setAdvanceLines(al || [])
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  const advance = async () => {
    const flow = STATUS_FLOW[report.status]
    if (!flow?.next) return
    setAdvancing(true)
    const updates = { status: flow.next, updated_at: new Date().toISOString() }
    if (flow.next === 'submitted') updates.submitted_at = new Date().toISOString()
    if (flow.next === 'approved')  updates.approved_at  = new Date().toISOString()
    await db.from('expense_reports').update(updates).eq('id', id)
    await load()
    setAdvancing(false)
  }

  if (loading) return <div className="page-content fade-in" style={{ display: 'flex', justifyContent: 'center', padding: 'var(--sp-10)' }}><div className="spinner" /></div>
  if (!report) return <div className="page-content fade-in"><div className="empty"><div className="empty-title">Report not found</div></div></div>

  const sc = STATUS_COLORS[report.status] || STATUS_COLORS.draft
  const flow = STATUS_FLOW[report.status]
  const isAdvance = report.type === 'advance'
  const CATS = ['fuel','tolls','parking','car_rental','lodging','meals','supplies','rentals','other']

  return (
    <div className="page-content fade-in">

      {/* Header */}
      <div style={{ background: 'var(--navy)', borderRadius: 'var(--r-xl)', padding: 'var(--sp-5)', marginBottom: 'var(--sp-4)', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--sp-3)' }}>
          <div>
            <div style={{ fontSize: 'var(--fs-xs)', color: 'rgba(255,255,255,0.5)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
              {report.division === 'Bolt' ? 'Bolt Lightning' : 'Lightning Master'} · {isAdvance ? 'Advance Request' : 'Expense Report'}
            </div>
            <div style={{ fontSize: 'var(--fs-xl)', fontWeight: 800 }}>{report.employee_name}</div>
            {project && <div style={{ fontSize: 'var(--fs-sm)', color: 'rgba(255,255,255,0.65)', marginTop: 4 }}>{project.name}</div>}
          </div>
          <span style={{ padding: '4px 12px', borderRadius: 'var(--r-full)', background: sc.bg, color: sc.color, fontSize: 'var(--fs-xs)', fontWeight: 700, flexShrink: 0, textTransform: 'capitalize' }}>
            {report.status}
          </span>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 'var(--sp-3)', display: 'flex', gap: 'var(--sp-4)', flexWrap: 'wrap' }}>
          <div style={{ fontSize: 'var(--fs-xs)', color: 'rgba(255,255,255,0.6)' }}>
            {report.report_date ? new Date(report.report_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'}
          </div>
          {isAdvance && report.travel_days > 0 && (
            <div style={{ fontSize: 'var(--fs-xs)', color: 'rgba(255,255,255,0.6)' }}>{report.travel_days} travel days</div>
          )}
        </div>
      </div>

      {/* Advance lines */}
      {isAdvance && advanceLines.length > 0 && (
        <div style={{ background: 'var(--surface-raised)', borderRadius: 'var(--r-xl)', overflow: 'hidden', border: '1px solid var(--border-l)', marginBottom: 'var(--sp-4)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', padding: 'var(--sp-2) var(--sp-4)', background: 'var(--navy)' }}>
            <span style={{ fontSize: 'var(--fs-xs)', fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>Description</span>
            <span style={{ fontSize: 'var(--fs-xs)', fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>Total</span>
          </div>
          {advanceLines.map(l => (
            <div key={l.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', padding: 'var(--sp-3) var(--sp-4)', borderBottom: '1px solid var(--border-l)' }}>
              <div>
                <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 600 }}>{l.description}</div>
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-3)' }}>
                  {l.days > 0 && `${l.days} days`}{l.nights > 0 && ` · ${l.nights} nights`}{l.miles > 0 && ` · ${l.miles} mi`}
                  {l.rate > 0 && ` @ $${l.rate}`}
                </div>
              </div>
              <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700 }}>${Number(l.total).toFixed(2)}</div>
            </div>
          ))}
        </div>
      )}

      {/* Expense line items */}
      {!isAdvance && lines.length > 0 && (
        <div style={{ background: 'var(--surface-raised)', borderRadius: 'var(--r-xl)', overflow: 'hidden', border: '1px solid var(--border-l)', marginBottom: 'var(--sp-4)' }}>
          <div style={{ overflowX: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(120px,1.5fr) 70px 60px 60px 60px 70px 70px 70px 70px 70px 70px', gap: 4, padding: 'var(--sp-2) var(--sp-4)', background: 'var(--navy)', minWidth: 800 }}>
              {['Vendor','Total','Fuel','Tolls','Parking','Car Rental','Lodging','Meals','Supplies','Rentals','Other'].map(h => (
                <div key={h} style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', textAlign: 'right' }}>{h}</div>
              ))}
            </div>
            {lines.map(l => (
              <div key={l.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(120px,1.5fr) 70px 60px 60px 60px 70px 70px 70px 70px 70px 70px', gap: 4, padding: 'var(--sp-2) var(--sp-4)', borderBottom: '1px solid var(--border-l)', minWidth: 800, alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 'var(--fs-xs)', fontWeight: 600 }}>{l.vendor_description || '—'}</div>
                  {l.line_date && <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{new Date(l.line_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>}
                </div>
                {['total','fuel','tolls','parking','car_rental','lodging','meals','supplies','rentals','other'].map(f => (
                  <div key={f} style={{ textAlign: 'right', fontSize: 'var(--fs-xs)', color: l[f] > 0 ? 'var(--text-1)' : 'var(--text-3)', fontWeight: l[f] > 0 ? 600 : 400 }}>
                    {l[f] > 0 ? `$${Number(l[f]).toFixed(2)}` : '—'}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mileage log */}
      {!isAdvance && mileage.length > 0 && (
        <div style={{ background: 'var(--surface-raised)', borderRadius: 'var(--r-xl)', overflow: 'hidden', border: '1px solid var(--border-l)', marginBottom: 'var(--sp-4)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', padding: 'var(--sp-2) var(--sp-4)', background: 'var(--navy)' }}>
            <span style={{ fontSize: 'var(--fs-xs)', fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>Mileage Log</span>
            <span style={{ fontSize: 'var(--fs-xs)', fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>Miles</span>
          </div>
          {mileage.map(m => (
            <div key={m.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', padding: 'var(--sp-2) var(--sp-4)', borderBottom: '1px solid var(--border-l)' }}>
              <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-2)' }}>{m.entry_date ? new Date(m.entry_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}</div>
              <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700 }}>{m.miles}</div>
            </div>
          ))}
        </div>
      )}

      {/* Totals */}
      <div style={{ background: 'var(--surface-raised)', borderRadius: 'var(--r-xl)', overflow: 'hidden', border: '1px solid var(--border-l)', marginBottom: 'var(--sp-4)' }}>
        {!isAdvance && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--sp-3) var(--sp-4)', borderBottom: '1px solid var(--border-l)' }}>
              <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-2)' }}>Subtotal</span>
              <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 700 }}>${Number(report.subtotal || 0).toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--sp-3) var(--sp-4)', borderBottom: '1px solid var(--border-l)' }}>
              <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-2)' }}>Less Cash Advance</span>
              <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: '#B91C1C' }}>-${Number(report.less_advance || 0).toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--sp-3) var(--sp-4)', borderBottom: '1px solid var(--border-l)' }}>
              <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-2)' }}>Mileage ({Number(report.mileage_miles || 0)} mi × ${report.mileage_rate || 0.725}/mi)</span>
              <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 700 }}>${Number(report.mileage_total || 0).toFixed(2)}</span>
            </div>
          </>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--sp-4)', background: 'var(--navy)' }}>
          <span style={{ fontSize: 'var(--fs-lg)', fontWeight: 800, color: '#fff' }}>Total</span>
          <span style={{ fontSize: 'var(--fs-lg)', fontWeight: 800, color: '#fff' }}>${Number(report.grand_total || 0).toFixed(2)}</span>
        </div>
      </div>

      {report.notes && (
        <div style={{ background: 'var(--surface-raised)', borderRadius: 'var(--r-xl)', padding: 'var(--sp-4)', border: '1px solid var(--border-l)', marginBottom: 'var(--sp-4)' }}>
          <div style={{ fontSize: 'var(--fs-xs)', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 'var(--sp-2)' }}>Notes</div>
          <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-2)', lineHeight: 1.6 }}>{report.notes}</div>
        </div>
      )}

      {flow?.next && (
        <button onClick={advance} disabled={advancing}
          style={{ width: '100%', padding: 'var(--sp-4)', borderRadius: 'var(--r-xl)', border: 'none', background: flow.bg, color: flow.color, fontWeight: 700, fontSize: 'var(--fs-md)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--sp-2)', marginBottom: 'var(--sp-4)' }}>
          {advancing ? 'Processing…' : <><ArrowRight size={18} /> {flow.label}</>}
        </button>
      )}
    </div>
  )
}
