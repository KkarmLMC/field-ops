import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Trash, ArrowRight, Warning, X } from '@phosphor-icons/react'
import { Card, Button } from '../components/ui'
import { db } from '../lib/supabase.js'



// ─── Advance Request Form ─────────────────────────────────────────────────────
function AdvanceForm({ division, projects, onSave, saving, error }) {
  const [employee, setEmployee] = useState('')
  const [projectId, setProjectId] = useState('')
  const [dateNeeded, setDateNeeded] = useState('')
  const [travelDays, setTravelDays] = useState(0)
  const [notes, setNotes] = useState('')

  const PER_DIEM_RATE = 68
  const HOTEL_RATE = 150
  const CAR_RATE = 125
  const PARKING_RATE = 18
  const BAGGAGE_RATE = 80

  const [meals, setMeals] = useState({ persons: 1, days: 0 })
  const [hotel, setHotel] = useState({ rooms: 1, nights: 0 })
  const [carRental, setCarRental] = useState({ days: 0 })
  const [fuel, setFuel] = useState({ miles: 0, mpg: 0, rate: 3.8 })
  const [parking, setParking] = useState({ days: 0 })
  const [baggageFees, setBaggageFees] = useState({ bags: 0, flights: 0 })
  const [others, setOthers] = useState([
    { desc: '', days: 0, rate: 1 },
    { desc: '', days: 0, rate: 1 },
    { desc: '', days: 0, rate: 1 },
    { desc: '', days: 0, rate: 1 },
  ])

  const mealsTotal   = meals.persons * meals.days * PER_DIEM_RATE
  const perDiemTotal = mealsTotal
  const hotelTotal   = hotel.rooms * hotel.nights * HOTEL_RATE
  const carTotal     = carRental.days * CAR_RATE
  const fuelTotal    = fuel.mpg > 0 ? (fuel.miles / fuel.mpg) * fuel.rate : 0
  const parkingTotal = parking.days * PARKING_RATE
  const baggageTotal = baggageFees.flights * BAGGAGE_RATE
  const otherTotal   = others.reduce((s, o) => s + (o.days * o.rate), 0)
  const travelTotal  = hotelTotal + carTotal + fuelTotal + parkingTotal + baggageTotal + otherTotal
  const grandTotal   = perDiemTotal + travelTotal

  const handleSave = (submit = false) => {
    const lines = [
      { category: 'meals',           persons: meals.persons, days: meals.days, rate: PER_DIEM_RATE, total: mealsTotal, description: 'Meals' },
      { category: 'hotel',           nights: hotel.nights,   days: null, rate: HOTEL_RATE,    total: hotelTotal,   description: 'Hotel' },
      { category: 'car_rental',      days: carRental.days,   rate: CAR_RATE,     total: carTotal,     description: 'Car Rental' },
      { category: 'fuel',            miles: fuel.miles,      mpg: fuel.mpg, rate: fuel.rate,  total: fuelTotal,    description: 'Fuel' },
      { category: 'parking',         days: parking.days,     rate: PARKING_RATE,  total: parkingTotal, description: 'Tampa Airport Parking' },
      { category: 'airline_baggage', bags: baggageFees.bags, days: baggageFees.flights, rate: BAGGAGE_RATE, total: baggageTotal, description: 'Airline Baggage Fees' },
      ...others.filter(o => o.desc || o.days > 0).map(o => ({ category: 'other', days: o.days, rate: o.rate, total: o.days * o.rate, description: o.desc || 'Other' })),
    ]
    onSave({
      type: 'advance', division, employee_name: employee, project_id: projectId || null,
      date_needed: dateNeeded || null, travel_days: travelDays,
      status: submit ? 'submitted' : 'draft',
      submitted_at: submit ? new Date().toISOString() : null,
      subtotal: travelTotal, advance_amount: 0,
      grand_total: grandTotal, notes }, lines)
  }

  const row = { marginBottom: 'var(--space-m)' }
  const grid2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-s)' }
  const inputSm = { width: '100%', fontSize: 'var(--text-xs)' }

  return (
    <>
      <Card title="Employee & Project">
        <div className="form-group">
          <label className="form-label">Employee Name <span style={{ color: 'var(--state-error-text)', marginLeft: 3 }}>*</span></label>
          <input value={employee} onChange={e => setEmployee(e.target.value)} placeholder="Full name" style={{ width: '100%' }} />
        </div>
        <div className="form-grid-2">
          <div>
            <label className="form-label">Project</label>
            <select value={projectId} onChange={e => setProjectId(e.target.value)} style={{ width: '100%' }}>
              <option value="">Select project…</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}{p.job_number ? ` (${p.job_number})` : ''}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Date Needed</label>
            <input type="date" value={dateNeeded} onChange={e => setDateNeeded(e.target.value)} style={{ width: '100%' }} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Number of Travel Days</label>
          <input type="number" min="0" value={travelDays} onChange={e => setTravelDays(e.target.value)} style={{ width: '100%' }} />
        </div>
      </Card>

      <Card title="Per Diem">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px', gap: 'var(--space-s)', alignItems: 'end', marginBottom: 'var(--space-s)' }}>
          <div className="expense-line-header">Description</div>
          <div className="expense-line-header">Persons</div>
          <div className="expense-line-header">Days</div>
          <div className="expense-line-header">Total</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px', gap: 'var(--space-s)', alignItems: 'center' }}>
          <div className="text-xs-semi">Meals <span className="meta-text">($68/day)</span></div>
          <input type="number" min="0" value={meals.persons} onChange={e => setMeals(m => ({ ...m, persons: +e.target.value }))} style={inputSm} />
          <input type="number" min="0" value={meals.days} onChange={e => setMeals(m => ({ ...m, days: +e.target.value }))} style={inputSm} />
          <div className="text-xs-right">${mealsTotal.toFixed(2)}</div>
        </div>
        <div className="expense-total-row">
          <span className="text-label">Per Diem Total: ${perDiemTotal.toFixed(2)}</span>
        </div>
      </Card>

      <Card title="Travel Expenses">
        {/* Hotel */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px', gap: 'var(--space-s)', alignItems: 'center', marginBottom: 'var(--space-s)' }}>
          <div className="text-xs-semi">Hotel <span className="meta-text">($150/night)</span></div>
          <div className="expense-line-header">Rooms</div>
          <div className="expense-line-header">Nights</div>
          <div className="expense-line-header">Total</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px', gap: 'var(--space-s)', alignItems: 'center', marginBottom: 'var(--space-m)' }}>
          <div />
          <input type="number" min="0" value={hotel.rooms} onChange={e => setHotel(h => ({ ...h, rooms: +e.target.value }))} style={inputSm} />
          <input type="number" min="0" value={hotel.nights} onChange={e => setHotel(h => ({ ...h, nights: +e.target.value }))} style={inputSm} />
          <div className="text-xs-right">${hotelTotal.toFixed(2)}</div>
        </div>
        {/* Car rental */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px', gap: 'var(--space-s)', alignItems: 'center', marginBottom: 'var(--space-s)' }}>
          <div className="text-xs-semi">Car Rental <span className="meta-text">($125/day)</span></div>
          <div />
          <div className="meta-text meta-text--center">Days</div>
          <div />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px', gap: 'var(--space-s)', alignItems: 'center', marginBottom: 'var(--space-m)' }}>
          <div />
          <div />
          <input type="number" min="0" value={carRental.days} onChange={e => setCarRental({ days: +e.target.value })} style={inputSm} />
          <div className="text-xs-right">${carTotal.toFixed(2)}</div>
        </div>
        {/* Fuel */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px', gap: 'var(--space-s)', alignItems: 'center', marginBottom: 'var(--space-s)' }}>
          <div className="text-xs-semi">Fuel</div>
          <div className="meta-text meta-text--center">Miles</div>
          <div className="meta-text meta-text--center">Mi/Gal</div>
          <div className="meta-text meta-text--center">$/Gal</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px', gap: 'var(--space-s)', alignItems: 'center', marginBottom: 'var(--space-m)' }}>
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textAlign: 'right', gridColumn: '1' }}>${fuelTotal.toFixed(2)}</div>
          <input type="number" min="0" value={fuel.miles} onChange={e => setFuel(f => ({ ...f, miles: +e.target.value }))} style={inputSm} />
          <input type="number" min="0" value={fuel.mpg} onChange={e => setFuel(f => ({ ...f, mpg: +e.target.value }))} style={inputSm} />
          <input type="number" min="0" step="0.01" value={fuel.rate} onChange={e => setFuel(f => ({ ...f, rate: +e.target.value }))} style={inputSm} />
        </div>
        {/* Parking */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px', gap: 'var(--space-s)', alignItems: 'center', marginBottom: 'var(--space-s)' }}>
          <div className="text-xs-semi">Tampa Airport Parking <span className="meta-text">($18/day)</span></div>
          <div /><div className="meta-text meta-text--center">Days</div><div />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px', gap: 'var(--space-s)', alignItems: 'center', marginBottom: 'var(--space-m)' }}>
          <div />
          <div />
          <input type="number" min="0" value={parking.days} onChange={e => setParking({ days: +e.target.value })} style={inputSm} />
          <div className="text-xs-right">${parkingTotal.toFixed(2)}</div>
        </div>
        {/* Airline baggage */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px', gap: 'var(--space-s)', alignItems: 'center', marginBottom: 'var(--space-s)' }}>
          <div className="text-xs-semi">Airline Baggage Fees <span className="meta-text">($80/flight)</span></div>
          <div className="meta-text meta-text--center">Bags</div>
          <div className="meta-text meta-text--center">Flights</div>
          <div />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px', gap: 'var(--space-s)', alignItems: 'center', marginBottom: 'var(--space-m)' }}>
          <div />
          <input type="number" min="0" value={baggageFees.bags} onChange={e => setBaggageFees(b => ({ ...b, bags: +e.target.value }))} style={inputSm} />
          <input type="number" min="0" value={baggageFees.flights} onChange={e => setBaggageFees(b => ({ ...b, flights: +e.target.value }))} style={inputSm} />
          <div className="text-xs-right">${baggageTotal.toFixed(2)}</div>
        </div>
        {/* Other lines */}
        {others.map((o, idx) => (
          <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px', gap: 'var(--space-s)', alignItems: 'center', marginBottom: 'var(--space-s)' }}>
            <input value={o.desc} onChange={e => setOthers(arr => arr.map((x, i) => i === idx ? { ...x, desc: e.target.value } : x))} placeholder="Other…" style={inputSm} />
            <div />
            <input type="number" min="0" value={o.days} onChange={e => setOthers(arr => arr.map((x, i) => i === idx ? { ...x, days: +e.target.value } : x))} style={inputSm} />
            <div className="text-xs-right">${(o.days * o.rate).toFixed(2)}</div>
          </div>
        ))}
        <div className="expense-total-row">
          <span className="text-label">Travel Advance: ${travelTotal.toFixed(2)}</span>
        </div>
      </Card>

      {/* Total */}
      <div className="expense-total-bar">
        <span className="expense-total-bar__label">Total Requested</span>
        <span className="expense-total-bar__value">${grandTotal.toFixed(2)}</span>
      </div>

      {/* Notes */}
      <div className="form-group">
        <label className="form-label">Notes</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Any additional notes…" style={{ width: '100%' }} />
      </div>

      {error && <div className="form-error flex-gap-s"><Warning size="0.875rem" />{error}</div>}

      <div className="action-grid-2">
        <Button onClick={() => handleSave(false)} disabled={saving}>
          {saving ? 'Saving…' : 'Save Draft'}
        </Button>
        <Button variant="primary" onClick={() => handleSave(true)} disabled={saving || !employee}
          className="flex-gap-s">
          <ArrowRight size="0.9375rem" /> Submit Request
        </Button>
      </div>
    </>
  )
}

// ─── Expense Report Form ──────────────────────────────────────────────────────
function ExpenseForm({ division, projects, onSave, saving, error }) {
  const MILEAGE_RATE = 0.725

  const [employee, setEmployee] = useState('')
  const [projectId, setProjectId] = useState('')
  const [reportDate, setReportDate] = useState(new Date().toISOString().slice(0,10))
  const [lessAdvance, setLessAdvance] = useState(0)
  const [notes, setNotes] = useState('')
  const [lines, setLines] = useState(
    Array.from({ length: 5 }, (_, i) => ({ _key: i, date: '', vendor: '', total: '', fuel: '', tolls: '', parking: '', car_rental: '', lodging: '', meals: '', supplies: '', rentals: '', other: '' }))
  )
  const [mileage, setMileage] = useState([{ _key: 0, date: '', miles: '' }])

  const addLine  = () => setLines(l => [...l, { _key: Date.now(), date: '', vendor: '', total: '', fuel: '', tolls: '', parking: '', car_rental: '', lodging: '', meals: '', supplies: '', rentals: '', other: '' }])
  const addMile  = () => setMileage(m => [...m, { _key: Date.now(), date: '', miles: '' }])
  const updateLine = (key, field, val) => setLines(l => l.map(x => x._key === key ? { ...x, [field]: val } : x))
  const updateMile = (key, field, val) => setMileage(m => m.map(x => x._key === key ? { ...x, [field]: val } : x))

  const subtotal = lines.reduce((s, l) => s + (parseFloat(l.total) || 0), 0)
  const totalMiles = mileage.reduce((s, m) => s + (parseFloat(m.miles) || 0), 0)
  const mileageTotal = totalMiles * MILEAGE_RATE
  const grandTotal = subtotal - (parseFloat(lessAdvance) || 0) + mileageTotal

  const CATS = ['fuel','tolls','parking','car_rental','lodging','meals','supplies','rentals','other']

  const handleSave = (submit = false) => {
    onSave({
      type: 'expense', division, employee_name: employee, project_id: projectId || null,
      report_date: reportDate,
      status: submit ? 'submitted' : 'draft',
      submitted_at: submit ? new Date().toISOString() : null,
      subtotal, less_advance: parseFloat(lessAdvance) || 0,
      mileage_miles: totalMiles, mileage_rate: MILEAGE_RATE, mileage_total: mileageTotal,
      grand_total: grandTotal, notes }, lines.filter(l => l.vendor || l.total), mileage.filter(m => m.miles))
  }

  const catCols = { display: 'grid', gridTemplateColumns: `minmax(80px,1fr) 60px 60px 60px 60px 60px 60px 60px 60px 60px 60px 60px`, gap: 4, overflowX: 'auto' }

  return (
    <>
      <Card title="Employee & Project">
        <div className="form-group">
          <label className="form-label">Employee Name <span style={{ color: 'var(--state-error-text)', marginLeft: 3 }}>*</span></label>
          <input value={employee} onChange={e => setEmployee(e.target.value)} placeholder="Full name" style={{ width: '100%' }} />
        </div>
        <div className="form-grid-2">
          <div>
            <label className="form-label">Project</label>
            <select value={projectId} onChange={e => setProjectId(e.target.value)} style={{ width: '100%' }}>
              <option value="">Select project…</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}{p.job_number ? ` (${p.job_number})` : ''}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Report Date</label>
            <input type="date" value={reportDate} onChange={e => setReportDate(e.target.value)} style={{ width: '100%' }} />
          </div>
        </div>
      </Card>

      <Card title="Expense Line Items">
        {/* Scrollable table */}
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {/* Header */}
          <div className="expense-line-table">
            {['Vendor / Description','Total','Fuel','Tolls','Parking','Car Rental','Lodging','Meals','Supplies','Rentals','Other','Date'].map(h => (
              <div key={h} className="expense-line-header">{h}</div>
            ))}
          </div>
          {/* Rows */}
          {lines.map(line => (
            <div key={line._key} className="expense-line-table">
              <input value={line.vendor} onChange={e => updateLine(line._key, 'vendor', e.target.value)} placeholder="Vendor…" style={{ fontSize: 'var(--text-xs)', width: '100%' }} />
              {['total','fuel','tolls','parking','car_rental','lodging','meals','supplies','rentals','other'].map(f => (
                <input key={f} type="number" min="0" step="0.01" value={line[f]} onChange={e => updateLine(line._key, f, e.target.value)} style={{ fontSize: 'var(--text-xs)', width: '100%', textAlign: 'right' }} />
              ))}
              <input type="date" value={line.date} onChange={e => updateLine(line._key, 'date', e.target.value)} style={{ fontSize: 'var(--text-xs)', width: '100%' }} />
            </div>
          ))}
        </div>
        <button onClick={addLine}
          style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-muted)', background: 'none', cursor: 'pointer', padding: 0, marginTop: 'var(--space-s)' }}>
          <Plus size="0.75rem" /> Add row
        </button>
        {/* Subtotal */}
        <div className="expense-total-row">
          <span className="text-label">Subtotal: ${subtotal.toFixed(2)}</span>
        </div>
      </Card>

      <Card title="Mileage Log">
        <div className="mileage-grid">
          <div className="expense-line-header">DATE</div>
          <div className="expense-line-header">MILES</div>
        </div>
        {mileage.map(m => (
          <div key={m._key} className="mileage-grid">
            <input type="date" value={m.date} onChange={e => updateMile(m._key, 'date', e.target.value)} style={{ width: '100%', fontSize: 'var(--text-xs)' }} />
            <input type="number" min="0" value={m.miles} onChange={e => updateMile(m._key, 'miles', e.target.value)} style={{ width: '100%', fontSize: 'var(--text-xs)', textAlign: 'right' }} />
          </div>
        ))}
        <button onClick={addMile}
          style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-muted)', background: 'none', cursor: 'pointer', padding: 0, marginTop: 'var(--space-2xs)' }}>
          <Plus size="0.75rem" /> Add entry
        </button>
        <div style={{ marginTop: 'var(--space-m)', paddingTop: 'var(--space-s)', display: 'flex', justifyContent: 'space-between' }}>
          <span className="meta-text">{totalMiles} miles × ${MILEAGE_RATE}/mi</span>
          <span className="text-label">Mileage: ${mileageTotal.toFixed(2)}</span>
        </div>
      </Card>

      {/* Totals */}
      <Card>
        {[
          ['Subtotal', subtotal],
        ].map(([lbl, val]) => (
          <div key={lbl} style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-m) 0', borderBottom: '1px solid var(--border-subtle)' }}>
            <span className="text-sm-bold">{lbl}</span>
            <span className="text-sm-bold">${val.toFixed(2)}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-m) 0', borderBottom: '1px solid var(--border-subtle)' }}>
          <span className="text-sm-bold">Less Cash Advance</span>
          <div className="flex-gap-s">
            <span className="meta-text">$</span>
            <input type="number" min="0" step="0.01" value={lessAdvance} onChange={e => setLessAdvance(e.target.value)}
              style={{ width: 80, textAlign: 'right', fontSize: 'var(--text-sm)', fontWeight: 700 }} />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-m) 0', borderBottom: '1px solid var(--border-subtle)' }}>
          <span className="text-sm-bold">Mileage Reimbursement</span>
          <span className="text-sm-bold">${mileageTotal.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-l) 0', background: 'var(--brand-primary)', marginLeft: -24, marginRight: -24, marginBottom: -24, paddingLeft: 24, paddingRight: 24 }}>
          <span className="page-heading--inverse">Total</span>
          <span className="page-heading--inverse">${grandTotal.toFixed(2)}</span>
        </div>
      </Card>

      <div className="form-group">
        <label className="form-label">Notes</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Any notes…" style={{ width: '100%' }} />
      </div>

      {error && <div className="form-error flex-gap-s"><Warning size="0.875rem" />{error}</div>}

      <div className="action-grid-2">
        <Button onClick={() => handleSave(false)} disabled={saving}>
          {saving ? 'Saving…' : 'Save Draft'}
        </Button>
        <Button variant="primary" onClick={() => handleSave(true)} disabled={saving || !employee}
          className="flex-gap-s">
          <ArrowRight size="0.9375rem" /> Submit Report
        </Button>
      </div>
    </>
  )
}

// ─── Main wrapper ─────────────────────────────────────────────────────────────
export default function ExpenseNew() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const type = searchParams.get('type') || 'expense'
  const division = searchParams.get('division') || 'LM'
  const [projects, setProjects] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    db.from('projects').select('id, name, job_number').order('name')
      .then(({ data }) => setProjects(data || []))
  }, [])

  const handleSave = async (reportData, lines, mileageRows) => {
    if (!reportData.employee_name?.trim()) { setError('Employee name is required.'); return }
    setSaving(true); setError('')

    const { data: report, error: err } = await db.from('expense_reports').insert(reportData).select().single()
    if (err || !report) { setError('Failed to save. Please try again.'); setSaving(false); return }

    if (type === 'advance' && lines?.length) {
      await db.from('expense_advance_lines').insert(
        lines.map((l, i) => ({ ...l, report_id: report.id, sort_order: i }))
      )
    }
    if (type === 'expense') {
      if (lines?.length) {
        await db.from('expense_line_items').insert(
          lines.map((l, i) => ({
            report_id: report.id, sort_order: i,
            line_date: l.date || null, vendor_description: l.vendor || null,
            total: parseFloat(l.total) || 0,
            fuel: parseFloat(l.fuel) || null, tolls: parseFloat(l.tolls) || null,
            parking: parseFloat(l.parking) || null, car_rental: parseFloat(l.car_rental) || null,
            lodging: parseFloat(l.lodging) || null, meals: parseFloat(l.meals) || null,
            supplies: parseFloat(l.supplies) || null, rentals: parseFloat(l.rentals) || null,
            other: parseFloat(l.other) || null }))
        )
      }
      if (mileageRows?.length) {
        await db.from('expense_mileage_log').insert(
          mileageRows.map(m => ({ report_id: report.id, entry_date: m.date || null, miles: parseFloat(m.miles) || 0 }))
        )
      }
    }

    setSaving(false)
    navigate(`/expenses/${report.id}`)
  }

  const isAdvance = type === 'advance'
  const typeLabel = isAdvance ? 'Advance Request' : 'Expense Report'

  return (
    <div className="page-content fade-in">
      <div className="mb-xl">
        <div className="section-heading">
          {division === 'Bolt' ? 'BOLT LIGHTNING' : 'LIGHTNING MASTER'}
        </div>
        <div style={{ fontSize: 'var(--text-md)', fontWeight: 800 }}>New {typeLabel}</div>
      </div>

      {isAdvance
        ? <AdvanceForm division={division} projects={projects} onSave={handleSave} saving={saving} error={error} />
        : <ExpenseForm division={division} projects={projects} onSave={handleSave} saving={saving} error={error} />
      }
    </div>
  )
}
