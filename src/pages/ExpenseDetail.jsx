import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  CheckCircle, Clock, PaperPlaneTilt, Warning,
  ArrowRight, Buildings, CurrencyDollar } from '@phosphor-icons/react'
import { db } from '../lib/supabase.js'
import { approvalStatus } from '../lib/statusColors.js'

const STATUS_FLOW = {
  draft:     { next: 'submitted', label: 'Submit',  bg: 'var(--warning)', color: '#fff' },
  submitted: { next: 'approved',  label: 'Approve', bg: 'var(--state-success-text)', color: '#fff' },
  approved:  { next: null },
  rejected:  { next: null } }

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

  if (loading) return <div className="page-content fade-in spinner-pad"><div className="spinner" /></div>
  if (!report) return <div className="page-content fade-in"><div className="empty"><div className="empty-title">Report not found</div></div></div>

  const sc = approvalStatus(report.status)
  const flow = STATUS_FLOW[report.status]
  const isAdvance = report.type === 'advance'
  const CATS = ['fuel','tolls','parking','car_rental','lodging','meals','supplies','rentals','other']

  return (
    <div className="page-content fade-in">

      {/* Header */}
      <div style={{ background: 'var(--brand-primary)', borderRadius: 'var(--radius-m)', padding: 'var(--space-xl)', marginBottom: 'var(--space-l)', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-m)' }}>
          <div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--surface-base)', fontWeight: 700, marginBottom: 4 }}>
              {report.division === 'Bolt' ? 'Bolt Lightning' : 'Lightning Master'} · {isAdvance ? 'Advance Request' : 'Expense Report'}
            </div>
            <div className="page-heading">{report.employee_name}</div>
            {project && <div style={{ fontSize: 'var(--text-sm)', color: 'var(--surface-base)', marginTop: 4 }}>{project.name}</div>}
          </div>
          <span style={{ padding: '4px 12px', borderRadius: 'var(--radius-s)', background: sc.bg, color: sc.color, fontSize: 'var(--text-xs)', fontWeight: 700, flexShrink: 0, textTransform: 'capitalize' }}>
            {report.status}
          </span>
        </div>
        <div style={{  paddingTop: 'var(--space-m)', display: 'flex', gap: 'var(--space-l)', flexWrap: 'wrap' }}>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--surface-base)' }}>
            {report.report_date ? new Date(report.report_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'}
          </div>
          {isAdvance && report.travel_days > 0 && (
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--surface-base)' }}>{report.travel_days} travel days</div>
          )}
        </div>
      </div>

      {/* Advance lines */}
      {isAdvance && advanceLines.length > 0 && (
        <div style={{ background: 'var(--surface-base)', borderRadius: 'var(--radius-m)', overflow: 'hidden', marginBottom: 'var(--space-l)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', padding: 'var(--space-s) var(--space-l)', background: 'var(--brand-primary)' }}>
            <span style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--surface-base)' }}>Description</span>
            <span style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--surface-base)' }}>Total</span>
          </div>
          {advanceLines.map(l => (
            <div key={l.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', padding: 'var(--space-m) var(--space-l)', borderBottom: '1px solid var(--border-default)' }}>
              <div>
                <div className="text-sm-semi">{l.description}</div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                  {l.days > 0 && `${l.days} days`}{l.nights > 0 && ` · ${l.nights} nights`}{l.miles > 0 && ` · ${l.miles} mi`}
                  {l.rate > 0 && ` @ $${l.rate}`}
                </div>
              </div>
              <div className="text-sm-bold">${Number(l.total).toFixed(2)}</div>
            </div>
          ))}
        </div>
      )}

      {/* Expense line items */}
      {!isAdvance && lines.length > 0 && (
        <div style={{ background: 'var(--surface-base)', borderRadius: 'var(--radius-m)', overflow: 'hidden', marginBottom: 'var(--space-l)' }}>
          <div style={{ overflowX: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(120px,1.5fr) 70px 60px 60px 60px 70px 70px 70px 70px 70px 70px', gap: 4, padding: 'var(--space-s) var(--space-l)', background: 'var(--brand-primary)', minWidth: 800 }}>
              {['Vendor','Total','Fuel','Tolls','Parking','Car Rental','Lodging','Meals','Supplies','Rentals','Other'].map(h => (
                <div key={h} style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--surface-base)', textAlign: 'right' }}>{h}</div>
              ))}
            </div>
            {lines.map(l => (
              <div key={l.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(120px,1.5fr) 70px 60px 60px 60px 70px 70px 70px 70px 70px 70px', gap: 4, padding: 'var(--space-s) var(--space-l)', borderBottom: '1px solid var(--border-default)', minWidth: 800, alignItems: 'center' }}>
                <div>
                  <div className="text-sm-semi">{l.vendor_description || '—'}</div>
                  {l.line_date && <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{new Date(l.line_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>}
                </div>
                {['total','fuel','tolls','parking','car_rental','lodging','meals','supplies','rentals','other'].map(f => (
                  <div key={f} style={{ textAlign: 'right', fontSize: 'var(--text-sm)', color: l[f] > 0 ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: l[f] > 0 ? 600 : 400 }}>
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
        <div style={{ background: 'var(--surface-base)', borderRadius: 'var(--radius-m)', overflow: 'hidden', marginBottom: 'var(--space-l)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', padding: 'var(--space-s) var(--space-l)', background: 'var(--brand-primary)' }}>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--surface-base)' }}>Mileage Log</span>
            <span style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--surface-base)' }}>Miles</span>
          </div>
          {mileage.map(m => (
            <div key={m.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', padding: 'var(--space-s) var(--space-l)', borderBottom: '1px solid var(--border-default)' }}>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>{m.entry_date ? new Date(m.entry_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}</div>
              <div className="text-sm-bold">{m.miles}</div>
            </div>
          ))}
        </div>
      )}

      {/* Totals */}
      <div style={{ background: 'var(--surface-base)', borderRadius: 'var(--radius-m)', overflow: 'hidden', marginBottom: 'var(--space-l)' }}>
        {!isAdvance && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-m) var(--space-l)', borderBottom: '1px solid var(--border-default)' }}>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>Subtotal</span>
              <span className="text-sm-bold">${Number(report.subtotal || 0).toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-m) var(--space-l)', borderBottom: '1px solid var(--border-default)' }}>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>Less Cash Advance</span>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--state-error-text)' }}>-${Number(report.less_advance || 0).toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-m) var(--space-l)', borderBottom: '1px solid var(--border-default)' }}>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>Mileage ({Number(report.mileage_miles || 0)} mi × ${report.mileage_rate || 0.725}/mi)</span>
              <span className="text-sm-bold">${Number(report.mileage_total || 0).toFixed(2)}</span>
            </div>
          </>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-l)', background: 'var(--brand-primary)' }}>
          <span style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: '#fff' }}>Total</span>
          <span style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: '#fff' }}>${Number(report.grand_total || 0).toFixed(2)}</span>
        </div>
      </div>

      {report.notes && (
        <div className="card-section">
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--space-s)' }}>Notes</div>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', lineHeight: 1.6 }}>{report.notes}</div>
        </div>
      )}

      {flow?.next && (
        <button onClick={advance} disabled={advancing}
          style={{ width: '100%', padding: 'var(--space-l)', borderRadius: 'var(--radius-m)', background: flow.bg, color: flow.color, fontWeight: 700, fontSize: 'var(--text-md)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-s)', marginBottom: 'var(--space-l)' }}>
          {advancing ? 'Processing…' : <><ArrowRight size="1.125rem" /> {flow.label}</>}
        </button>
      )}
    </div>
  )
}
