import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Buildings, Package, WarningCircle, ArrowsLeftRight,
  Plus, TrendUp, CurrencyDollar, Truck, CaretRight, X, Check,
  DotsSixVertical, PencilSimple, Receipt, CaretRight as ChevRight } from '@phosphor-icons/react'
import { Button, Card, StatCard, Spinner, EmptyState, Badge } from '../components/ui'
import { db } from '../lib/supabase.js'

// ─── Shared label ─────────────────────────────────────────────────────────────
function Label({ children }) {
  return (
    <label className="form-field__label">
      {children}
    </label>
  )
}

// ─── Add Warehouse Sheet ──────────────────────────────────────────────────────
function AddWarehouseSheet({ onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', address: '', city: '', state: '', zip: '', contact_name: '', contact_phone: '', contact_email: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')
  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Warehouse name is required.'); return }
    setSaving(true)
    setError('')
    const { data, error: err } = await db.from('warehouses')
      .insert({ ...form, is_active: true })
      .select()
      .single()
    setSaving(false)
    if (err) { setError('Save failed. Please try again.'); return }
    onSaved(data)
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 299, background: 'rgba(0,0,0,0.5)', animation: 'anim-fade-in 0.15s ease' }} />
      <div style={{ position: 'fixed', left: 0, right: 0, bottom: 'env(safe-area-inset-bottom, 0px)', zIndex: 300, background: 'var(--surface-base)', borderRadius: 'var(--radius-l) var(--radius-l) 0 0', maxHeight: '92vh', display: 'flex', flexDirection: 'column', animation: 'anim-slide-up 0.22s cubic-bezier(0.32,0.72,0,1)' }}>
        {/* Header */}
        <div style={{ padding: 'var(--space-l) var(--space-xl) 0', flexShrink: 0 }}>
          <div style={{ width: '2.5rem', height: '0.25rem', background: 'var(--border-subtle)', borderRadius: 'var(--radius-l)', margin: '0 auto var(--space-m)' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-l)' }}>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>Add Warehouse</div>
            <button onClick={onClose} style={{ background: 'var(--surface-hover)', borderRadius: 'var(--radius-l)', width: '2rem', height: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <X size="0.875rem" style={{ color: 'var(--text-primary)' }} />
            </button>
          </div>
        </div>

        {/* Fields */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '0 var(--space-xl) var(--space-s)' }}>
          <div style={{ marginBottom: 'var(--space-m)' }}>
            <Label>Warehouse Name *</Label>
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Bolt Florida Warehouse" style={{ width: '100%' }} autoFocus />
          </div>

          <div style={{ margin: 'var(--space-m) 0', paddingTop: 'var(--space-m)' }}>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--space-m)' }}>Location</div>
          </div>

          <div style={{ marginBottom: 'var(--space-m)' }}>
            <Label>Street Address</Label>
            <input value={form.address} onChange={e => set('address', e.target.value)} placeholder="123 Main St" style={{ width: '100%' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 90px', gap: 'var(--space-s)', marginBottom: 'var(--space-m)' }}>
            <div><Label>City</Label><input value={form.city} onChange={e => set('city', e.target.value)} placeholder="Clearwater" style={{ width: '100%' }} /></div>
            <div><Label>State</Label><input value={form.state} onChange={e => set('state', e.target.value)} placeholder="FL" style={{ width: '100%' }} /></div>
            <div><Label>ZIP</Label><input value={form.zip} onChange={e => set('zip', e.target.value)} placeholder="33755" style={{ width: '100%' }} /></div>
          </div>

          <div style={{ margin: 'var(--space-m) 0', paddingTop: 'var(--space-m)' }}>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--space-m)' }}>Contact</div>
          </div>

          <div style={{ marginBottom: 'var(--space-m)' }}>
            <Label>Contact Name</Label>
            <input value={form.contact_name} onChange={e => set('contact_name', e.target.value)} placeholder="John Smith" style={{ width: '100%' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-s)', marginBottom: 'var(--space-m)' }}>
            <div><Label>Phone</Label><input value={form.contact_phone} onChange={e => set('contact_phone', e.target.value)} placeholder="(555) 000-0000" style={{ width: '100%' }} /></div>
            <div><Label>Email</Label><input value={form.contact_email} onChange={e => set('contact_email', e.target.value)} placeholder="john@example.com" style={{ width: '100%' }} /></div>
          </div>

          <div style={{ marginBottom: 'var(--space-m)' }}>
            <Label>Notes</Label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any relevant notes…" rows={3} style={{ width: '100%', resize: 'vertical' }} />
          </div>

          {error && <div style={{ color: 'var(--state-error-text)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-m)', padding: 'var(--space-s) var(--space-m)', background: 'var(--state-error-soft)', borderRadius: 'var(--radius-m)' }}>{error}</div>}
        </div>

        {/* Footer */}
        <div style={{ padding: 'var(--space-l) var(--space-xl)', paddingBottom: 'calc(var(--space-l) + env(safe-area-inset-bottom))', flexShrink: 0 }}>
          <Button onClick={handleSave} disabled={saving || !form.name.trim()} style={{ width: '100%' }}>
            {saving ? 'Creating…' : <><Check size="0.9375rem" /> Create Warehouse</>}
          </Button>
        </div>
      </div>
    </>
  )
}

function WarehouseCard({ warehouse, levels, onPress, onViewParts, onTransfer }) {
  const wLevels = levels.filter(l => l.warehouse_id === warehouse.id)
  const totalSkus     = wLevels.filter(l => l.quantity_on_hand > 0).length
  const totalUnits    = wLevels.reduce((s, l) => s + l.quantity_on_hand, 0)
  const totalOnOrder  = wLevels.reduce((s, l) => s + (l.quantity_on_order || 0), 0)
  const lowStockItems = wLevels.filter(l => l.min_level && l.quantity_on_hand > 0 && l.quantity_on_hand <= l.min_level).length
  const totalValue    = wLevels.reduce((s, l) => s + (l.quantity_on_hand * (l.parts?.unit_cost || 0)), 0)
  const hasAlerts     = lowStockItems > 0

  return (
    <div style={{
      background: 'var(--surface-base)', borderRadius: 'var(--radius-m)', overflow: 'hidden',
      border: hasAlerts ? '1px solid #FED7AA' : '1px solid var(--border-default)' }}>
      {/* Header — clickable, goes to warehouse detail */}
      <button onClick={onPress} style={{ background: 'var(--brand-primary)', padding: 'var(--space-l) var(--space-xl)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', cursor: 'pointer', textAlign: 'left' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-m)' }}>
          <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: 'var(--radius-l)', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Buildings size="1.25rem" style={{ color: '#fff' }} />
          </div>
          <div>
            <div style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: '#fff' }}>{warehouse.name}</div>
            {(warehouse.city || warehouse.state) && (
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--surface-base)', marginTop: 2 }}>
                {[warehouse.city, warehouse.state].filter(Boolean).join(', ')}
              </div>
            )}
          </div>
        </div>
        {hasAlerts ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--warning-soft)', borderRadius: 'var(--radius-l)', padding: '3px 10px' }}>
            <WarningCircle size="0.8125rem" weight="fill" style={{ color: 'var(--warning)' }} />
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--warning)' }}>{lowStockItems} low stock</span>
          </div>
        ) : (
          <CaretRight size="1rem" style={{ color: 'var(--surface-base)' }} />
        )}
      </button>

      {/* Stats 2x2 grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: 'var(--border-subtle)' }}>
        {[
          { label: 'SKUs In Stock', value: totalSkus.toLocaleString(), Icon: Package, color: 'var(--text-primary)' },
          { label: 'Total Units', value: totalUnits.toLocaleString(), Icon: TrendUp, color: 'var(--text-primary)' },
          { label: 'Low Stock', value: lowStockItems, Icon: WarningCircle, color: lowStockItems > 0 ? 'var(--state-warning-text)' : 'var(--text-muted)' },
          { label: 'On Order', value: totalOnOrder.toLocaleString(), Icon: Truck, color: totalOnOrder > 0 ? 'var(--state-info)' : 'var(--text-muted)' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--surface-base)', padding: 'var(--space-m) var(--space-l)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: s.color, marginBottom: 4 }}>
              <s.Icon size="0.8125rem" />
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>{s.label}</span>
            </div>
            <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Value row */}
      {totalValue > 0 && (
        <div style={{ padding: 'var(--space-m) var(--space-xl)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)' }}>
            <CurrencyDollar size="0.875rem" />
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>Est. Inventory Value</span>
          </div>
          <span style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--state-success-text)' }}>
            ${totalValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </span>
        </div>
      )}

      {/* Low stock list */}
      {lowStockItems > 0 && (
        <div style={{ padding: 'var(--space-m) var(--space-xl)', borderTop: '1px solid #FED7AA', background: 'var(--warning-soft)' }}>
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--warning-text)', marginBottom: 'var(--space-s)' }}>Low Stock</div>
          {wLevels
            .filter(l => l.min_level && l.quantity_on_hand > 0 && l.quantity_on_hand <= l.min_level)
            .slice(0, 3)
            .map(l => (
              <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--warning-text)', marginBottom: 2 }}>
                <span style={{ fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>{l.parts?.sku || '—'}</span>
                <span style={{ fontWeight: 700, flexShrink: 0 }}>{l.quantity_on_hand} / min {l.min_level}</span>
              </div>
            ))}
          {lowStockItems > 3 && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--warning-text)', marginTop: 4 }}>+{lowStockItems - 3} more</div>}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-s)', padding: 'var(--space-m) var(--space-l)' }}>
        <Button onClick={onViewParts} size="sm">
          <Package size="0.8125rem" /> View Parts
        </Button>
        <Button onClick={onTransfer} size="sm" variant="secondary">
          <ArrowsLeftRight size="0.8125rem" /> Transfer
        </Button>
      </div>
    </div>
  )
}

export default function Inventory() {
  const navigate = useNavigate()
  const [warehouses, setWarehouses] = useState([])
  const [levels, setLevels] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [pos, setPOs] = useState([])
  const dragItem = useRef(null)
  const dragOverItem = useRef(null)

  useEffect(() => {
    Promise.all([
      db.from('warehouses').select('*').eq('is_active', true).order('sort_order'),
      db.from('inventory_levels').select('*, parts(sku, unit_cost)'),
      db.from('sales_orders').select('id, so_number, customer_name, project_name, status, grand_total, division, so_date').in('status', ['draft','submitted','published']).order('created_at', { ascending: false }),
    ]).then(([{ data: wh }, { data: lvl }, { data: pos }]) => {
      setWarehouses(wh || [])
      setLevels(lvl || [])
      setPOs(pos || [])
      setLoading(false)
    })
  }, [])

  const handleDragStart = (idx) => { dragItem.current = idx }
  const handleDragEnter = (idx) => { dragOverItem.current = idx }

  const handleDragEnd = () => {
    if (dragItem.current === null || dragOverItem.current === null) return
    if (dragItem.current === dragOverItem.current) return
    const reordered = [...warehouses]
    const dragged = reordered.splice(dragItem.current, 1)[0]
    reordered.splice(dragOverItem.current, 0, dragged)
    dragItem.current = null
    dragOverItem.current = null
    setWarehouses(reordered)
  }

  const saveOrder = async () => {
    setSaving(true)
    await Promise.all(
      warehouses.map((wh, idx) =>
        db.from('warehouses').update({ sort_order: idx }).eq('id', wh.id)
      )
    )
    setSaving(false)
    setEditMode(false)
  }

  // Cross-warehouse rollup
  const totalSkus     = new Set(levels.filter(l => l.quantity_on_hand > 0).map(l => l.part_id)).size
  const totalUnits    = levels.reduce((s, l) => s + l.quantity_on_hand, 0)
  const totalOnOrder  = levels.reduce((s, l) => s + (l.quantity_on_order || 0), 0)
  const totalLowStock = (() => {
    const byPart = {}
    levels.forEach(l => {
      if (!byPart[l.part_id]) byPart[l.part_id] = { qty: 0, min: null }
      byPart[l.part_id].qty += l.quantity_on_hand
      if (l.min_level && (byPart[l.part_id].min === null || l.min_level < byPart[l.part_id].min))
        byPart[l.part_id].min = l.min_level
    })
    return Object.values(byPart).filter(p => p.min && p.qty > 0 && p.qty <= p.min).length
  })()

  return (
    <div className="page-content fade-in">

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-s)', flexWrap: 'wrap', marginBottom: 'var(--space-m)' }}>
        {editMode ? (
          <>
            <Button variant="secondary" onClick={() => setEditMode(false)}>
              <X size="0.875rem" /> Cancel
            </Button>
            <Button onClick={saveOrder} disabled={saving}>
              <Check size="0.875rem" /> {saving ? 'Saving…' : 'Save Order'}
            </Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={() => setEditMode(true)}>
              <PencilSimple size="0.875rem" /> Edit
            </Button>
            <Button variant="secondary" onClick={() => navigate('/warehouse-hq/transfer')}>
              <ArrowsLeftRight size="0.875rem" /> Transfer
            </Button>
            <Button onClick={() => setShowAdd(true)}>
              <Plus size="0.875rem" /> Add Warehouse
            </Button>
          </>
        )}
      </div>

      {/* Edit mode hint */}
      {editMode && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-s)', padding: 'var(--space-m) var(--space-l)', background: 'var(--state-info-soft)', borderRadius: 'var(--radius-l)', marginBottom: 'var(--space-l)', fontSize: 'var(--text-sm)', color: 'var(--state-info)' }}>
          <DotsSixVertical size="1rem" />
          Drag the handles to reorder warehouses, then tap Save Order.
        </div>
      )}

      {/* PO Activity Strip */}
      {!editMode && pos.length > 0 && (() => {
        const submitted = pos.filter(p => p.status === 'submitted')
        const published = pos.filter(p => p.status === 'published')
        const draft     = pos.filter(p => p.status === 'draft')
        const totalActive = submitted.length + published.length
        return (
          <Card style={{ marginBottom: 'var(--space-xl)' }}>
            {/* Strip header */}
            <button onClick={() => navigate('/sales-orders')}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-m) var(--space-l)', background: 'none', cursor: 'pointer', borderBottom: '1px solid var(--border-default)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-s)' }}>
                <Receipt size="0.9375rem" style={{ color: 'var(--brand-primary)' }} />
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>Sales Orders</span>
                {submitted.length > 0 && (
                  <Badge label={`${submitted.length} need review`} variant="warning" />
                )}
              </div>
              <CaretRight size="0.8125rem" style={{ color: 'var(--text-primary)' }} />
            </button>

            {/* Stat row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'var(--border-subtle)' }}>
              {[
                { label: 'Draft',     count: draft.length,     color: 'var(--grey-base)', bg: 'var(--surface-base)' },
                { label: 'Submitted', count: submitted.length, color: submitted.length > 0 ? 'var(--warning)' : 'var(--grey-base)', bg: submitted.length > 0 ? 'var(--warning-soft)' : 'var(--surface-base)' },
                { label: 'Published', count: published.length, color: published.length > 0 ? 'var(--state-info)' : 'var(--grey-base)', bg: published.length > 0 ? 'var(--state-info-soft)' : 'var(--surface-base)' },
              ].map(s => (
                <div key={s.label} style={{ background: s.bg, padding: 'var(--space-m) var(--space-l)' }}>
                  <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: s.color }}>{s.count}</div>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Recent active PO rows */}
            {[...submitted, ...published].slice(0, 3).map(po => (
              <button key={po.id} onClick={() => navigate(`/sales-orders/${po.id}`)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 'var(--space-m)', padding: 'var(--space-s) var(--space-l)', background: 'none', cursor: 'pointer', textAlign: 'left' }}>
                <div style={{
                  fontSize: 'var(--text-2xs)', fontWeight: 800, padding: '2px 6px', borderRadius: 4, flexShrink: 0,
                  background: po.division === 'Bolt' ? '#FFF1F2' : 'var(--state-info-soft)',
                  color: po.division === 'Bolt' ? 'var(--red-shade-40)' : 'var(--state-info)' }}>
                  {po.division === 'Bolt' ? 'BOLT' : 'LM'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{po.customer_name}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{po.project_name || po.so_number}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-s)', flexShrink: 0 }}>
                  <Badge label={po.status} variant={po.status === 'submitted' ? 'warning' : 'primary'} />
                  {po.grand_total > 0 && (
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-primary)' }}>
                      ${po.grand_total.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </Card>
        )
      })()}

      {/* Network-wide summary */}
      {!editMode && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-m)', marginBottom: 'var(--space-2xl)' }}>
          <StatCard label="Unique SKUs" value={totalSkus.toLocaleString()} />
          <StatCard label="Total Units" value={totalUnits.toLocaleString()} />
          <StatCard label="Low Stock" value={totalLowStock} emphasis={totalLowStock > 0} />
          <StatCard label="On Order" value={totalOnOrder.toLocaleString()} emphasis={totalOnOrder > 0} />
        </div>
      )}

      {/* Warehouse cards / drag list */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-2xl)' }}><Spinner /></div>
      ) : warehouses.length === 0 ? (
        <EmptyState
          icon={<Buildings size="2rem" />}
          title="No warehouses yet"
          description="Add your first warehouse to start tracking inventory."
        />
      ) : editMode ? (
        /* Edit mode: vertical drag list */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-m)' }}>
          {warehouses.map((wh, idx) => (
            <div
              key={wh.id}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragEnter={() => handleDragEnter(idx)}
              onDragEnd={handleDragEnd}
              onDragOver={e => e.preventDefault()}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                background: 'var(--surface-base)', borderRadius: 'var(--radius-m)', padding: '1rem',
                cursor: 'grab', userSelect: 'none' }}
            >
              <DotsSixVertical size="1.375rem" style={{ color: 'var(--text-primary)', flexShrink: 0 }} />
              <div style={{
                width: '2.5rem', height: '2.5rem', borderRadius: 'var(--radius-l)',
                background: 'var(--brand-primary)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', flexShrink: 0 }}>
                <Buildings size="1.125rem" style={{ color: '#fff' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 'var(--text-md)', fontWeight: 700 }}>{wh.name}</div>
                {(wh.city || wh.state) && (
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 2 }}>
                    {[wh.city, wh.state].filter(Boolean).join(', ')}
                  </div>
                )}
              </div>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-primary)', background: 'var(--surface-hover)', borderRadius: 'var(--radius-l)', padding: '2px 10px' }}>
                #{idx + 1}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Normal mode: warehouse cards grid */
        <div className="warehouse-grid">
          {warehouses.map(wh => (
            <WarehouseCard
              key={wh.id}
              warehouse={wh}
              levels={levels}
              onPress={() => navigate(`/warehouse-hq/warehouse/${wh.id}`)}
              onViewParts={() => navigate(`/warehouse-hq?warehouse=${wh.id}`)}
              onTransfer={() => navigate(`/warehouse-hq/transfer?from=${wh.id}`)}
            />
          ))}
        </div>
      )}

      {showAdd && (
        <AddWarehouseSheet
          onClose={() => setShowAdd(false)}
          onSaved={newWarehouse => {
            setWarehouses(wh => [...wh, newWarehouse])
            setShowAdd(false)
          }}
        />
      )}
    </div>
  )
}
