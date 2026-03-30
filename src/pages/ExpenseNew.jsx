import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Trash, ArrowRight, Warning, X } from '@phosphor-icons/react'
import { db } from '../lib/supabase.js'

function Label({ children, required }) {
  return (
    <label style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--black)', display: 'block', marginBottom: 'var(--sp-1)' }}>
      {children}{required && <span style={{ color: '#B91C1C', marginLeft: 3 }}>*</span>}
    </label>
  )
}

function Card({ title, children }) {
  return (
    <div style={{ background: 'var(--surface-raised)', borderRadius: 'var(--r-xl)', padding: 'var(--sp-4)', border: '1px solid var(--border-l)', marginBottom: 'var(--sp-4)' }}>
      {title && <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: 'var(--sp-3)' }}>{title}</div>}
      {children}
    </div>
  )
}

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
      grand_total: grandTotal, notes,
    }, lines)
  }

  const row = { marginBottom: 'var(--sp-3)' }
  const grid2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-2)' }
  const inputSm = { width: '100%', fontSize: 'var(--text-xs)' }

  return (
    <>
      <Card title="Employee & Project">
        <div style={{ ...row }}>
          <Label required>Employee Name</Label>
          <input value={employee} onChange={e => setEmployee(e.target.value)} placeholder="Full name" style={{ width: '100%' }} />
        </div>
        <div style={{ ...grid2, ...row }}>
          <div>
            <Label>Project</Label>
            <select value={projectId} onChange={e => setProjectId(e.target.value)} style={{ width: '100%' }}>
              <option value="">Select project…</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}{p.job_number ? ` (${p.job_number})` : ''}</option>)}
            </select>
          </div>
          <div>
            <Label>Date Needed</Label>
            <input type="date" value={dateNeeded} onChange={e => setDateNeeded(e.target.value)} style={{ width: '100%' }} />
          </div>
        </div>
        <div>
          <Label>Number of Travel Days</Label>
          <input type="number" min="0" value={travelDays} onChange={e => setTravelDays(e.target.value)} style={{ width: '100%' }} />
        </div>
      </Card>

      <Card title="Per Diem">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px', gap: 'var(--sp-2)', alignItems: 'end', marginBottom: 'var(--sp-2)' }}>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-3)', fontWeight: 600 }}>Description</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-3)', textAlign: 'right' }}>Persons</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-3)', textAlign: 'right' }}>Days</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-3)', textAlign: 'right' }}>Total</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px', gap: 'var(--sp-2)', alignItems: 'center' }}>
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>Meals <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>($68/day)</span></div>
          <input type="number" min="0" value={meals.persons} onChange={e => setMeals(m => ({ ...m, persons: +e.target.value }))} style={inputSm} />
          <input type="number" min="0" value={meals.days} onChange={e => setMeals(m => ({ ...m, days: +e.target.value }))} style={inputSm} />
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textAlign: 'right' }}>${mealsTotal.toFixed(2)}</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--sp-3)', borderTop: '1px solid var(--border-l)', paddingTop: 'var(--sp-2)' }}>
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--black)' }}>Per Diem Total: ${perDiemTotal.toFixed(2)}</span>
        </div>
      </Card>

      <Card title="Travel Expenses">
        {/* Hotel */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px', gap: 'var(--sp-2)', alignItems: 'center', marginBottom: 'var(--sp-2)' }}>
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>Hotel <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>($150/night)</span></div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-3)', textAlign: 'center' }}>Rooms</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-3)', textAlign: 'center' }}>Nights</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-3)', textAlign: 'right' }}>Total</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px', gap: 'var(--sp-2)', alignItems: 'center', marginBottom: 'var(--sp-3)' }}>
          <div />
          <input type="number" min="0" value={hotel.rooms} onChange={e => setHotel(h => ({ ...h, rooms: +e.target.value }))} style={inputSm} />
          <input type="number" min="0" value={hotel.nights} onChange={e => setHotel(h => ({ ...h, nights: +e.target.value }))} style={inputSm} />
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textAlign: 'right' }}>${hotelTotal.toFixed(2)}</div>
        </div>
        {/* Car rental */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px', gap: 'var(--sp-2)', alignItems: 'center', marginBottom: 'var(--sp-2)' }}>
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>Car Rental <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>($125/day)</span></div>
          <div />
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-3)', textAlign: 'center' }}>Days</div>
          <div />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px', gap: 'var(--sp-2)', alignItems: 'center', marginBottom: 'var(--sp-3)' }}>
          <div />
          <div />
          <input type="number" min="0" value={carRental.days} onChange={e => setCarRental({ days: +e.target.value })} style={inputSm} />
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textAlign: 'right' }}>${carTotal.toFixed(2)}</div>
        </div>
        {/* Fuel */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px', gap: 'var(--sp-2)', alignItems: 'center', marginBottom: 'var(--sp-2)' }}>
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>Fuel</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-3)', textAlign: 'center' }}>Miles</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-3)', textAlign: 'center' }}>Mi/Gal</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-3)', textAlign: 'center' }}>$/Gal</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px', gap: 'var(--sp-2)', alignItems: 'center', marginBottom: 'var(--sp-3)' }}>
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textAlign: 'right', gridColumn: '1' }}>${fuelTotal.toFixed(2)}</div>
          <input type="number" min="0" value={fuel.miles} onChange={e => setFuel(f => ({ ...f, miles: +e.target.value }))} style={inputSm} />
          <input type="number" min="0" value={fuel.mpg} onChange={e => setFuel(f => ({ ...f, mpg: +e.target.value }))} style={inputSm} />
          <input type="number" min="0" step="0.01" value={fuel.rate} onChange={e => setFuel(f => ({ ...f, rate: +e.target.value }))} style={inputSm} />
        </div>
        {/* Parking */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px', gap: 'var(--sp-2)', alignItems: 'center', marginBottom: 'var(--sp-2)' }}>
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>Tampa Airport Parking <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>($18/day)</span></div>
          <div /><div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-3)', textAlign: 'center' }}>Days</div><div />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px', gap: 'var(--sp-2)', alignItems: 'center', marginBottom: 'var(--sp-3)' }}>
          <div />
          <div />
          <input type="number" min="0" value={parking.days} onChange={e => setParking({ days: +e.target.value })} style={inputSm} />
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textAlign: 'right' }}>${parkingTotal.toFixed(2)}</div>
        </div>
        {/* Airline baggage */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px', gap: 'var(--sp-2)', alignItems: 'center', marginBottom: 'var(--sp-2)' }}>
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>Airline Baggage Fees <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>($80/flight)</span></div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-3)', textAlign: 'center' }}>Bags</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-3)', textAlign: 'center' }}>Flights</div>
          <div />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px', gap: 'var(--sp-2)', alignItems: 'center', marginBottom: 'var(--sp-3)' }}>
          <div />
          <input type="number" min="0" value={baggageFees.bags} onChange={e => setBaggageFees(b => ({ ...b, bags: +e.target.value }))} style={inputSm} />
          <input type="number" min="0" value={baggageFees.flights} onChange={e => setBaggageFees(b => ({ ...b, flights: +e.target.value }))} style={inputSm} />
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textAlign: 'right' }}>${baggageTotal.toFixed(2)}</div>
        </div>
        {/* Other lines */}
        {others.map((o, idx) => (
          <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px', gap: 'var(--sp-2)', alignItems: 'center', marginBottom: 'var(--sp-2)' }}>
            <input value={o.desc} onChange={e => setOthers(arr => arr.map((x, i) => i === idx ? { ...x, desc: e.target.value } : x))} placeholder="Other…" style={inputSm} />
            <div />
            <input type="number" min="0" value={o.days} onChange={e => setOthers(arr => arr.map((x, i) => i === idx ? { ...x, days: +e.target.value } : x))} style={inputSm} />
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textAlign: 'right' }}>${(o.days * o.rate).toFixed(2)}</div>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--sp-3)', borderTop: '1px solid var(--border-l)', paddingTop: 'var(--sp-2)' }}>
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--black)' }}>Travel Advance: ${travelTotal.toFixed(2)}</span>
        </div>
      </Card>

      {/* Total */}
      <div style={{ background: 'var(--navy)', borderRadius: 'var(--r-xl)', padding: 'var(--sp-4) var(--sp-5)', marginBottom: 'var(--sp-4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: '#fff' }}>Total Requested</span>
        <span style={{ fontSize: 'var(--text-base)', fontWeight: 800, color: '#fff' }}>${grandTotal.toFixed(2)}</span>
      </div>

      {/* Notes */}
      <div style={{ marginBottom: 'var(--sp-4)' }}>
        <Label>Notes</Label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Any additional notes…" style={{ width: '100%' }} />
      </div>

      {error && <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', padding: 'var(--sp-3)', background: '#FEF2F2', borderRadius: 'var(--r-l)', marginBottom: 'var(--sp-4)', color: '#B91C1C', fontSize: 'var(--text-sm)' }}><Warning size={14} />{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)', marginBottom: 'var(--sp-6)' }}>
        <button onClick={() => handleSave(false)} disabled={saving}
          style={{ padding: 'var(--sp-3)', borderRadius: 'var(--r-xl)', border: '1px solid var(--border-l)', background: 'var(--surface-raised)', color: 'var(--black)', fontWeight: 700, fontSize: 'var(--text-sm)', cursor: 'pointer' }}>
          {saving ? 'Saving…' : 'Save Draft'}
        </button>
        <button onClick={() => handleSave(true)} disabled={saving || !employee}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--sp-2)', padding: 'var(--sp-3)', borderRadius: 'var(--r-xl)', border: 'none', background: 'var(--navy)', color: '#fff', fontWeight: 700, fontSize: 'var(--text-sm)', cursor: 'pointer' }}>
          <ArrowRight size={15} /> Submit Request
        </button>
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
      grand_total: grandTotal, notes,
    }, lines.filter(l => l.vendor || l.total), mileage.filter(m => m.miles))
  }

  const catCols = { display: 'grid', gridTemplateColumns: `minmax(80px,1fr) 60px 60px 60px 60px 60px 60px 60px 60px 60px 60px 60px`, gap: 4, overflowX: 'auto' }

  return (
    <>
      <Card title="Employee & Project">
        <div style={{ marginBottom: 'var(--sp-3)' }}>
          <Label required>Employee Name</Label>
          <input value={employee} onChange={e => setEmployee(e.target.value)} placeholder="Full name" style={{ width: '100%' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-2)' }}>
          <div>
            <Label>Project</Label>
            <select value={projectId} onChange={e => setProjectId(e.target.value)} style={{ width: '100%' }}>
              <option value="">Select project…</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}{p.job_number ? ` (${p.job_number})` : ''}</option>)}
            </select>
          </div>
          <div>
            <Label>Report Date</Label>
            <input type="date" value={reportDate} onChange={e => setReportDate(e.target.value)} style={{ width: '100%' }} />
          </div>
        </div>
      </Card>

      <Card title="Expense Line Items">
        {/* Scrollable table */}
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(100px,1.5fr) 70px 70px 60px 60px 60px 70px 70px 70px 70px 70px 70px', gap: 4, minWidth: 900, marginBottom: 4 }}>
            {['Vendor / Description','Total','Fuel','Tolls','Parking','Car Rental','Lodging','Meals','Supplies','Rentals','Other','Date'].map(h => (
              <div key={h} style={{ fontSize: 'var(--blackxs)', fontWeight: 700, color: 'var(--black)', textTransform: 'uppercase', textAlign: 'right', padding: '2px 0' }}>{h}</div>
            ))}
          </div>
          {/* Rows */}
          {lines.map(line => (
            <div key={line._key} style={{ display: 'grid', gridTemplateColumns: 'minmax(100px,1.5fr) 70px 70px 60px 60px 60px 70px 70px 70px 70px 70px 70px', gap: 4, minWidth: 900, marginBottom: 4 }}>
              <input value={line.vendor} onChange={e => updateLine(line._key, 'vendor', e.target.value)} placeholder="Vendor…" style={{ fontSize: 'var(--text-xs)', width: '100%' }} />
              {['total','fuel','tolls','parking','car_rental','lodging','meals','supplies','rentals','other'].map(f => (
                <input key={f} type="number" min="0" step="0.01" value={line[f]} onChange={e => updateLine(line._key, f, e.target.value)} style={{ fontSize: 'var(--text-xs)', width: '100%', textAlign: 'right' }} />
              ))}
              <input type="date" value={line.date} onChange={e => updateLine(line._key, 'date', e.target.value)} style={{ fontSize: 'var(--text-xs)', width: '100%' }} />
            </div>
          ))}
        </div>
        <button onClick={addLine}
          style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: 'var(--sp-2)' }}>
          <Plus size={12} /> Add row
        </button>
        {/* Subtotal */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--sp-3)', borderTop: '1px solid var(--border-l)', paddingTop: 'var(--sp-2)' }}>
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--black)' }}>Subtotal: ${subtotal.toFixed(2)}</span>
        </div>
      </Card>

      <Card title="Mileage Log">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: 'var(--sp-2)', marginBottom: 'var(--sp-2)' }}>
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--black)' }}>DATE</div>
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--black)', textAlign: 'right' }}>MILES</div>
        </div>
        {mileage.map(m => (
          <div key={m._key} style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: 'var(--sp-2)', marginBottom: 'var(--sp-2)' }}>
            <input type="date" value={m.date} onChange={e => updateMile(m._key, 'date', e.target.value)} style={{ width: '100%', fontSize: 'var(--text-xs)' }} />
            <input type="number" min="0" value={m.miles} onChange={e => updateMile(m._key, 'miles', e.target.value)} style={{ width: '100%', fontSize: 'var(--text-xs)', textAlign: 'right' }} />
          </div>
        ))}
        <button onClick={addMile}
          style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: 'var(--sp-1)' }}>
          <Plus size={12} /> Add entry
        </button>
        <div style={{ borderTop: '1px solid var(--border-l)', marginTop: 'var(--sp-3)', paddingTop: 'var(--sp-2)', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-3)' }}>{totalMiles} miles × ${MILEAGE_RATE}/mi</span>
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--black)' }}>Mileage: ${mileageTotal.toFixed(2)}</span>
        </div>
      </Card>

      {/* Totals */}
      <div style={{ background: 'var(--surface-raised)', borderRadius: 'var(--r-xl)', overflow: 'hidden', border: '1px solid var(--border-l)', marginBottom: 'var(--sp-4)' }}>
        {[
          ['Subtotal', subtotal],
        ].map(([lbl, val]) => (
          <div key={lbl} style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--sp-3) var(--sp-4)', borderBottom: '1px solid var(--border-l)' }}>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--black)' }}>{lbl}</span>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>${val.toFixed(2)}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--sp-3) var(--sp-4)', borderBottom: '1px solid var(--border-l)' }}>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--black)' }}>Less Cash Advance</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-3)' }}>$</span>
            <input type="number" min="0" step="0.01" value={lessAdvance} onChange={e => setLessAdvance(e.target.value)}
              style={{ width: 80, textAlign: 'right', fontSize: 'var(--text-sm)', fontWeight: 700 }} />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--sp-3) var(--sp-4)', borderBottom: '1px solid var(--border-l)' }}>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--black)' }}>Mileage Reimbursement</span>
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>${mileageTotal.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--sp-4)', background: 'var(--navy)' }}>
          <span style={{ fontSize: 'var(--text-md)', fontWeight: 800, color: '#fff' }}>Total</span>
          <span style={{ fontSize: 'var(--text-md)', fontWeight: 800, color: '#fff' }}>${grandTotal.toFixed(2)}</span>
        </div>
      </div>

      <div style={{ marginBottom: 'var(--sp-4)' }}>
        <Label>Notes</Label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Any notes…" style={{ width: '100%' }} />
      </div>

      {error && <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', padding: 'var(--sp-3)', background: '#FEF2F2', borderRadius: 'var(--r-l)', marginBottom: 'var(--sp-4)', color: '#B91C1C', fontSize: 'var(--text-sm)' }}><Warning size={14} />{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)', marginBottom: 'var(--sp-6)' }}>
        <button onClick={() => handleSave(false)} disabled={saving}
          style={{ padding: 'var(--sp-3)', borderRadius: 'var(--r-xl)', border: '1px solid var(--border-l)', background: 'var(--surface-raised)', color: 'var(--black)', fontWeight: 700, fontSize: 'var(--text-sm)', cursor: 'pointer' }}>
          {saving ? 'Saving…' : 'Save Draft'}
        </button>
        <button onClick={() => handleSave(true)} disabled={saving || !employee}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--sp-2)', padding: 'var(--sp-3)', borderRadius: 'var(--r-xl)', border: 'none', background: 'var(--navy)', color: '#fff', fontWeight: 700, fontSize: 'var(--text-sm)', cursor: 'pointer' }}>
          <ArrowRight size={15} /> Submit Report
        </button>
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
            other: parseFloat(l.other) || null,
          }))
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
      <div style={{ marginBottom: 'var(--sp-5)' }}>
        <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--black)', marginBottom: 4 }}>
          {division === 'Bolt' ? 'BOLT LIGHTNING' : 'LIGHTNING MASTER'}
        </div>
        <div style={{ fontSize: 'var(--text-base)', fontWeight: 800 }}>New {typeLabel}</div>
      </div>

      {isAdvance
        ? <AdvanceForm division={division} projects={projects} onSave={handleSave} saving={saving} error={error} />
        : <ExpenseForm division={division} projects={projects} onSave={handleSave} saving={saving} error={error} />
      }
    </div>
  )
}
