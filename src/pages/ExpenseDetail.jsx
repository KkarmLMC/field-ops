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
      <div className="expense-detail-154a">
        <div className="expense-detail-c353">
          <div>
            <div className="expense-detail-6354">
              {report.division === 'Bolt' ? 'Bolt Lightning' : 'Lightning Master'} · {isAdvance ? 'Advance Request' : 'Expense Report'}
            </div>
            <div className="page-heading">{report.employee_name}</div>
            {project && <div className="meta-text--inverse">{project.name}</div>}
          </div>
          <span style={{ padding: 'var(--space-2xs) var(--space-m)', borderRadius: 'var(--radius-s)', background: sc.bg, color: sc.color, fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)', flexShrink: 0, textTransform: 'capitalize' }}>
            {report.status}
          </span>
        </div>
        <div className="expense-detail-42e8">
          <div className="expense-detail-e09a">
            {report.report_date ? new Date(report.report_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'}
          </div>
          {isAdvance && report.travel_days > 0 && (
            <div className="expense-detail-e09a">{report.travel_days} travel days</div>
          )}
        </div>
      </div>

      {/* Advance lines */}
      {isAdvance && advanceLines.length > 0 && (
        <div className="card-section">
          <div className="expense-detail-802f">
            <span className="expense-detail-2a24">Description</span>
            <span className="expense-detail-2a24">Total</span>
          </div>
          {advanceLines.map(l => (
            <div key={l.id} className="expense-detail-9827">
              <div>
                <div className="text-sm-semi">{l.description}</div>
                <div className="meta-text">
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
        <div className="card-section">
          <div style={{ overflowX: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(120px,1.5fr) 70px 60px 60px 60px 70px 70px 70px 70px 70px 70px', gap: 'var(--space-2xs)', padding: 'var(--space-s) var(--space-l)', background: 'var(--brand-primary)', minWidth: 800 }}>
              {['Vendor','Total','Fuel','Tolls','Parking','Car Rental','Lodging','Meals','Supplies','Rentals','Other'].map(h => (
                <div key={h} className="expense-detail-abfb">{h}</div>
              ))}
            </div>
            {lines.map(l => (
              <div key={l.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(120px,1.5fr) 70px 60px 60px 60px 70px 70px 70px 70px 70px 70px', gap: 'var(--space-2xs)', padding: 'var(--space-s) var(--space-l)', borderBottom: 'var(--border-width-1) solid var(--border-default)', minWidth: 800, alignItems: 'center' }}>
                <div>
                  <div className="text-sm-semi">{l.vendor_description || '—'}</div>
                  {l.line_date && <div className="meta-text">{new Date(l.line_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>}
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
        <div className="card-section">
          <div className="expense-detail-802f">
            <span className="expense-detail-0e67">Mileage Log</span>
            <span className="expense-detail-2a24">Miles</span>
          </div>
          {mileage.map(m => (
            <div key={m.id} className="expense-detail-c1e9">
              <div className="text-sm-bold">{m.entry_date ? new Date(m.entry_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}</div>
              <div className="text-sm-bold">{m.miles}</div>
            </div>
          ))}
        </div>
      )}

      {/* Totals */}
      <div className="card-section">
        {!isAdvance && (
          <>
            <div className="expense-detail-0d18">
              <span className="text-sm-bold">Subtotal</span>
              <span className="text-sm-bold">${Number(report.subtotal || 0).toFixed(2)}</span>
            </div>
            <div className="expense-detail-0d18">
              <span className="text-sm-bold">Less Cash Advance</span>
              <span className="expense-detail-ad30">-${Number(report.less_advance || 0).toFixed(2)}</span>
            </div>
            <div className="expense-detail-0d18">
              <span className="text-sm-bold">Mileage ({Number(report.mileage_miles || 0)} mi × ${report.mileage_rate || 0.725}/mi)</span>
              <span className="text-sm-bold">${Number(report.mileage_total || 0).toFixed(2)}</span>
            </div>
          </>
        )}
        <div className="expense-detail-dc96">
          <span className="expense-detail-7b45">Total</span>
          <span className="expense-detail-7b45">${Number(report.grand_total || 0).toFixed(2)}</span>
        </div>
      </div>

      {report.notes && (
        <div className="card-section">
          <div className="expense-detail-c350">Notes</div>
          <div className="text-sm">{report.notes}</div>
        </div>
      )}

      {flow?.next && (
        <button onClick={advance} disabled={advancing}
          style={{ width: '100%', padding: 'var(--space-l)', borderRadius: 'var(--radius-m)', background: flow.bg, color: flow.color, fontWeight: 'var(--fw-bold)', fontSize: 'var(--text-md)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-s)', marginBottom: 'var(--space-l)' }}>
          {advancing ? 'Processing…' : <><ArrowRight size="1.125rem" /> {flow.label}</>}
        </button>
      )}
    </div>
  )
}
