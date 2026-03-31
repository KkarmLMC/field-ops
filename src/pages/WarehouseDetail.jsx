import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Buildings, Package, WarningCircle, ArrowsLeftRight,
  Plus, TrendUp, CurrencyDollar, Truck, CaretRight,
  PencilSimple, MapPin, Phone, Envelope, ClipboardText,
  CaretDown, MagnifyingGlass, X, Check, Receipt } from '@phosphor-icons/react'
import { Card, Button, Badge } from '../components/ui'
import { db } from '../lib/supabase.js'
import { soStatus } from '../lib/statusColors.js'
import { useAuth } from '../lib/useAuth.jsx'
import { logActivity } from '../lib/logActivity.js'
const APP_SOURCE = (import.meta.env.VITE_APP_NAME || 'lmc_platform').toLowerCase().replace(/ /g, '_')



// ─── Edit Warehouse Sheet ─────────────────────────────────────────────────────
function EditWarehouseSheet({ warehouse, onClose, onSaved }) {
  const [form, setForm] = useState({
    name:          warehouse.name          || '',
    address:       warehouse.address       || '',
    city:          warehouse.city          || '',
    state:         warehouse.state         || '',
    zip:           warehouse.zip           || '',
    contact_name:  warehouse.contact_name  || '',
    contact_phone: warehouse.contact_phone || '',
    contact_email: warehouse.contact_email || '',
    notes:         warehouse.notes         || '' })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Warehouse name is required.'); return }
    setSaving(true)
    setError('')
    const { error: err } = await db.from('warehouses')
      .update({ ...form, updated_at: new Date().toISOString() })
      .eq('id', warehouse.id)
    setSaving(false)
    if (err) { setError('Save failed. Please try again.'); return }
    await logActivity(db, user?.id, APP_SOURCE, {
      category:    'inventory',
      action:      'updated_warehouse',
      label:       `Updated warehouse: ${form.name || warehouse.name}`,
      entity_type: 'warehouse',
      entity_id:   warehouse.id })
    onSaved({ ...warehouse, ...form })
  }

  return (
    <>
      <div onClick={onClose} className="sheet-overlay" />
      <div className="sheet">
        {/* Sheet header */}
        <div className="sheet__header">
          <div className="sheet__handle" />
          <div className="sheet__header-row">
            <div className="sheet__title">Edit Warehouse</div>
            <button onClick={onClose} style={{ background: 'var(--surface-hover)', borderRadius: 'var(--radius-l)', width: '2rem', height: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <X size="0.875rem" style={{ color: 'var(--text-primary)' }} />
            </button>
          </div>
        </div>

        {/* Scrollable fields */}
        <div className="sheet__body">

          <div className="form-group">
            <label className="form-label">Warehouse Name *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Lightning Master Warehouse" style={{ width: '100%' }} />
          </div>

          <div className="section-divider">
            <div className="section-heading">Location</div>
          </div>

          <div className="form-group">
            <label className="form-label">Street Address</label>
            <input value={form.address} onChange={e => set('address', e.target.value)} placeholder="123 Main St" style={{ width: '100%' }} />
          </div>

          <div className="form-grid-3">
            <div>
              <label className="form-label">City</label>
              <input value={form.city} onChange={e => set('city', e.target.value)} placeholder="Clearwater" style={{ width: '100%' }} />
            </div>
            <div>
              <label className="form-label">State</label>
              <input value={form.state} onChange={e => set('state', e.target.value)} placeholder="FL" style={{ width: '100%' }} />
            </div>
            <div>
              <label className="form-label">ZIP</label>
              <input value={form.zip} onChange={e => set('zip', e.target.value)} placeholder="33755" style={{ width: '100%' }} />
            </div>
          </div>

          <div className="section-divider">
            <div className="section-heading">Contact</div>
          </div>

          <div className="form-group">
            <label className="form-label">Contact Name</label>
            <input value={form.contact_name} onChange={e => set('contact_name', e.target.value)} placeholder="John Smith" style={{ width: '100%' }} />
          </div>

          <div className="form-grid-2">
            <div>
              <label className="form-label">Phone</label>
              <input value={form.contact_phone} onChange={e => set('contact_phone', e.target.value)} placeholder="(555) 000-0000" style={{ width: '100%' }} />
            </div>
            <div>
              <label className="form-label">Email</label>
              <input value={form.contact_email} onChange={e => set('contact_email', e.target.value)} placeholder="john@example.com" style={{ width: '100%' }} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any relevant notes about this warehouse…" rows={3} style={{ width: '100%', resize: 'vertical' }} />
          </div>

          {error && <div className="form-error">{error}</div>}
        </div>

        {/* Footer */}
        <div className="sheet__footer">
          <button onClick={handleSave} disabled={saving || !form.name.trim()}
            style={{ width: '100%', padding: 'var(--space-m)', borderRadius: 'var(--radius-m)', background: !form.name.trim() ? 'var(--surface-hover)' : 'var(--brand-primary)', color: !form.name.trim() ? 'var(--text-muted)' : '#fff', fontWeight: 700, fontSize: 'var(--text-sm)', cursor: !form.name.trim() ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-s)' }}>
            {saving ? 'Saving…' : <><Check size="0.9375rem" /> Save Changes</>}
          </button>
        </div>
      </div>
    </>
  )
}



// ─── Part row in the stock list ───────────────────────────────────────────────
function StockRow({ level, onPress }) {
  const isLow = level.min_level && level.quantity_on_hand <= level.min_level && level.quantity_on_hand > 0
  const isOut = level.quantity_on_hand === 0
  const color = isOut ? 'var(--error-dark)' : isLow ? 'var(--orange-shade-20)' : 'var(--success-text)'
  const bg    = isOut ? 'var(--error-soft)' : isLow ? 'var(--orange-soft)' : 'var(--success-soft)'

  return (
    <button onClick={onPress} style={{
      display: 'flex', alignItems: 'center', gap: '0.75rem',
      padding: 'var(--pad-m) var(--pad-l)', background: 'none', width: '100%', textAlign: 'left',
      borderBottom: '1px solid var(--border-l)', cursor: 'pointer',
      WebkitTapHighlightColor: 'transparent' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {level.parts?.name || '—'}
        </div>
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-3)', marginTop: 2, display: 'flex', gap: 'var(--gap-s)' }}>
          {level.parts?.sku && <span style={{ fontFamily: 'var(--mono)' }}>{level.parts.sku}</span>}
          {level.quantity_on_order > 0 && <span style={{ color: 'var(--blue)', fontWeight: 600 }}>+{level.quantity_on_order} on order</span>}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap-s)', flexShrink: 0 }}>
        <span style={{ padding: '3px 10px', borderRadius: 'var(--r-s)', fontSize: 'var(--text-sm)', fontWeight: 700, background: bg, color }}>
          {level.quantity_on_hand}
        </span>
        <CaretRight size="0.8125rem" style={{ color: 'var(--black)' }} />
      </div>
    </button>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function WarehouseDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [warehouse, setWarehouse] = useState(null)
  const [levels, setLevels]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [stockFilter, setStockFilter] = useState('all')
  const [showTx, setShowTx]       = useState(false)
  const [transactions, setTransactions] = useState([])
  const [showEdit, setShowEdit]   = useState(false)
  const [warehousePOs, setWarehousePOs] = useState([])

  useEffect(() => {
    Promise.all([
      db.from('warehouses').select('*').eq('id', id).single(),
      db.from('inventory_levels')
        .select('*, parts(id, sku, name, unit_cost, category_id, part_categories(name))')
        .eq('warehouse_id', id)
        .order('quantity_on_hand', { ascending: true }),
      // Find all POs that have line items for this warehouse
      db.from('so_line_items')
        .select('so_id')
        .eq('warehouse_id', id),
    ]).then(async ([{ data: wh }, { data: lvl }, { data: poLineRefs }]) => {
      setWarehouse(wh)
      setLevels(lvl || [])
      // Fetch those POs
      const poIds = [...new Set((poLineRefs || []).map(r => r.so_id))]
      if (poIds.length > 0) {
        const { data: poData } = await db.from('sales_orders')
          .select('id, so_number, customer_name, project_name, status, grand_total, division, so_date')
          .in('id', poIds)
          .order('created_at', { ascending: false })
        setWarehousePOs(poData || [])
      }
      setLoading(false)
    })
  }, [id])

  const loadTransactions = async () => {
    if (transactions.length > 0) { setShowTx(t => !t); return }
    const { data } = await db.from('inventory_transactions')
      .select('*, parts(sku, name)')
      .eq('warehouse_id', id)
      .order('created_at', { ascending: false })
      .limit(30)
    setTransactions(data || [])
    setShowTx(true)
  }

  if (loading) return <div className="page-content fade-in" style={{ display: 'flex', justifyContent: 'center', padding: 'var(--pad-xxl)' }}><div className="spinner" /></div>
  if (!warehouse) return <div className="page-content fade-in"><div className="empty"><div className="empty-title">Warehouse not found</div></div></div>

  // Stats
  const totalSkus    = levels.filter(l => l.quantity_on_hand > 0).length
  const totalUnits   = levels.reduce((s, l) => s + l.quantity_on_hand, 0)
  const totalOnOrder = levels.reduce((s, l) => s + (l.quantity_on_order || 0), 0)
  const lowStock     = levels.filter(l => l.min_level && l.quantity_on_hand > 0 && l.quantity_on_hand <= l.min_level)
  const outOfStock   = levels.filter(l => l.quantity_on_hand === 0)
  const totalValue   = levels.reduce((s, l) => s + (l.quantity_on_hand * (l.parts?.unit_cost || 0)), 0)

  // Filter
  const filtered = levels.filter(l => {
    if (stockFilter === 'low' && !(l.min_level && l.quantity_on_hand > 0 && l.quantity_on_hand <= l.min_level)) return false
    if (stockFilter === 'out' && l.quantity_on_hand !== 0) return false
    if (stockFilter === 'in'  && l.quantity_on_hand === 0) return false
    if (search) {
      const q = search.toLowerCase()
      const name = (l.parts?.name || '').toLowerCase()
      const sku  = (l.parts?.sku  || '').toLowerCase()
      if (!name.includes(q) && !sku.includes(q)) return false
    }
    return true
  })

  const txTypeLabel = {
    adjustment: 'Adjustment', transfer_out: 'Transfer Out', transfer_in: 'Transfer In',
    job_checkout: 'Job Checkout', job_return: 'Job Return', receiving: 'Received',
    count_correction: 'Count Correction' }

  return (
    <div className="page-content fade-in">

      {/* Header */}
      <div className="wh-header">
        <div className="wh-header__top">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-m)' }}>
            <div className="wh-header__icon">
              <Buildings size="1.375rem" style={{ color: '#fff' }} />
            </div>
            <div>
              <div className="wh-header__name">{warehouse.name}</div>
              {(warehouse.city || warehouse.state) && (
                <div className="wh-header__loc">
                  <MapPin size="0.75rem" />
                  {[warehouse.city, warehouse.state].filter(Boolean).join(', ')}
                </div>
              )}
            </div>
          </div>
          <button onClick={() => setShowEdit(true)}
            style={{ width: '2.25rem', height: '2.25rem', borderRadius: 'var(--radius-l)', background: 'transparent', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <PencilSimple size="0.9375rem" />
          </button>
        </div>

        {/* Contact info */}
        {(warehouse.contact_name || warehouse.contact_phone || warehouse.contact_email || warehouse.address) && (
          <div className="wh-header__contact">
            {warehouse.address && (
              <div className="wh-header__contact-row">
                <MapPin size="0.75rem" />
                {warehouse.address}{warehouse.zip ? `, ${warehouse.zip}` : ''}
              </div>
            )}
            {warehouse.contact_name && (
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-inverse)' }}>Contact: {warehouse.contact_name}</div>
            )}
            {warehouse.contact_phone && (
              <div className="wh-header__contact-row">
                <Phone size="0.75rem" /> {warehouse.contact_phone}
              </div>
            )}
            {warehouse.contact_email && (
              <div className="wh-header__contact-row">
                <Envelope size="0.75rem" /> {warehouse.contact_email}
              </div>
            )}
            {warehouse.notes && (
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-inverse)', fontStyle: 'italic', marginTop: 2 }}>{warehouse.notes}</div>
            )}
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div className="stats-grid-2">
        <Card><div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-s)', marginBottom: 'var(--space-s)' }}><div style={{ width: '2rem', height: '2rem', borderRadius: 'var(--radius-m)', background: 'var(--state-info-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size="0.875rem" style={{ color: 'var(--brand-primary)' }} /></div><span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-muted)' }}>SKUs In Stock</span></div><div style={{ fontSize: 'var(--text-md)', fontWeight: 800, color: 'var(--text-primary)' }}>{totalSkus.toLocaleString()}</div></Card>
        <Card><div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-s)', marginBottom: 'var(--space-s)' }}><div style={{ width: '2rem', height: '2rem', borderRadius: 'var(--radius-m)', background: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><TrendUp size="0.875rem" style={{ color: 'var(--text-primary)' }} /></div><span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-muted)' }}>Total Units</span></div><div style={{ fontSize: 'var(--text-md)', fontWeight: 800, color: 'var(--text-primary)' }}>{totalUnits.toLocaleString()}</div></Card>
        <Card><div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-s)', marginBottom: 'var(--space-s)' }}><div style={{ width: '2rem', height: '2rem', borderRadius: 'var(--radius-m)', background: lowStock.length > 0 ? 'var(--state-warning-soft)' : 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><WarningCircle size="0.875rem" style={{ color: lowStock.length > 0 ? 'var(--state-warning-text)' : 'var(--text-muted)' }} /></div><span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-muted)' }}>Low Stock</span></div><div style={{ fontSize: 'var(--text-md)', fontWeight: 800, color: lowStock.length > 0 ? 'var(--state-warning-text)' : 'var(--text-primary)' }}>{lowStock.length}</div></Card>
        <Card><div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-s)', marginBottom: 'var(--space-s)' }}><div style={{ width: '2rem', height: '2rem', borderRadius: 'var(--radius-m)', background: totalOnOrder > 0 ? 'var(--state-info-soft)' : 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Truck size="0.875rem" style={{ color: totalOnOrder > 0 ? 'var(--state-info)' : 'var(--text-muted)' }} /></div><span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-muted)' }}>On Order</span></div><div style={{ fontSize: 'var(--text-md)', fontWeight: 800, color: totalOnOrder > 0 ? 'var(--state-info)' : 'var(--text-primary)' }}>{totalOnOrder.toLocaleString()}</div></Card>
      </div>

      {/* Value */}
      {totalValue > 0 && (
        <div className="value-card">
          <div className="value-card__label">
            <CurrencyDollar size="1rem" />
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Est. Inventory Value</span>
          </div>
          <span className="value-card__amount">
            ${totalValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="action-grid-2">
        <Button onClick={() => navigate(`/warehouse-hq/transfer?from=${id}`)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-s)' }}>
          <ArrowsLeftRight size="0.9375rem" /> Transfer
        </Button>
        <Button variant="primary" onClick={() => navigate('/warehouse-hq/add-part')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-s)' }}>
          <Plus size="0.9375rem" /> Add Part
        </Button>
      </div>

      {/* Stock section */}
      <div style={{ marginBottom: 'var(--space-s)' }}>
        <div className="stock-section__title">
          Stock ({levels.length} parts)
        </div>

        {/* Search + filters */}
        <div style={{ position: 'relative', marginBottom: 'var(--mar-m)' }}>
          <MagnifyingGlass size="0.9375rem" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search parts…"
            style={{ width: '100%', paddingLeft: 34, paddingRight: search ? 34 : 12 }} />
          {search && (
            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', cursor: 'pointer', color: 'var(--text-3)' }}>
              <X size="0.8125rem" />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: 'var(--gap-s)', marginBottom: 'var(--mar-m)', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {[['all', 'All'], ['in', 'In Stock'], ['low', `Low (${lowStock.length})`], ['out', `Out (${outOfStock.length})`]].map(([val, lbl]) => (
            <button key={val} onClick={() => setStockFilter(val)}
              style={{
                flexShrink: 0, padding: '0.25rem 0.75rem', borderRadius: 'var(--r-xxl)',
                border: `1px solid ${stockFilter === val ? 'var(--navy)' : 'var(--border-l)'}`,
                background: stockFilter === val ? 'var(--navy)' : 'var(--hover)',
                color: stockFilter === val ? '#fff' : 'var(--black)',
                fontSize: 'var(--text-xs)', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>{lbl}</button>
          ))}
        </div>

        {/* Stock list */}
        <Card>
          {filtered.length === 0 ? (
            <div style={{ padding: 'var(--space-xl)', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
              No parts match filters
            </div>
          ) : filtered.map(level => (
            <StockRow
              key={level.id}
              level={level}
              onPress={() => navigate(`/warehouse-hq/part/${level.parts?.id}`)}
            />
          ))}
        </Card>
      </div>

      {/* Sales Orders for this warehouse */}
      {warehousePOs.length > 0 && (() => {
        return (
          <Card>
            <div className="so-list-header">
              <div className="so-list-header__left">
                <Receipt size="1rem" style={{ color: 'var(--brand-primary)' }} />
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>Sales Orders</span>
                <span className="so-list-header__count">
                  {warehousePOs.length}
                </span>
              </div>
              <button onClick={() => navigate('/sales-orders')}
                className="so-list-header__link">
                View all
              </button>
            </div>
            {warehousePOs.map((po, idx) => {
              const sc = soStatus(po.status)
              return (
                <button key={po.id} onClick={() => navigate(`/sales-orders/${po.id}`)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 'var(--gap-m)', padding: 'var(--pad-m) var(--pad-l)', background: 'none', cursor: 'pointer', textAlign: 'left', borderBottom: idx < warehousePOs.length - 1 ? '1px solid var(--border-l)' : 'none' }}>
                  <div className={`division-badge division-badge--${po.division === 'Bolt' ? 'bolt' : 'lm'}`}>
                    {po.division === 'Bolt' ? 'BOLT' : 'LM'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {po.customer_name}
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-3)', marginTop: 1 }}>
                      {po.project_name || po.so_number}
                      {po.so_date ? ` · ${new Date(po.so_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap-s)', flexShrink: 0 }}>
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, padding: '2px 8px', borderRadius: 'var(--r-s)', background: sc.bg, color: sc.color, textTransform: 'capitalize' }}>
                      {po.status}
                    </span>
                    {po.grand_total > 0 && (
                      <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--black)' }}>
                        ${po.grand_total.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </span>
                    )}
                    <CaretRight size="0.75rem" style={{ color: 'var(--black)' }} />
                  </div>
                </button>
              )
            })}
          </div>
        )
      })()}

      {/* Transaction history (collapsed by default) */}
      <Card>
        <button onClick={loadTransactions}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 0, background: 'none', cursor: 'pointer', marginBottom: showTx ? 'var(--space-m)' : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-s)' }}>
            <ClipboardText size="1rem" style={{ color: 'var(--text-primary)' }} />
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>Transaction History</span>
          </div>
          <CaretDown size="0.875rem" style={{ color: 'var(--text-primary)', transform: showTx ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>
        {showTx && (
          <div >
            {transactions.length === 0 ? (
              <div style={{ padding: 'var(--space-xl)', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>No transactions yet</div>
            ) : transactions.map(tx => (
              <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-m)', padding: 'var(--space-m) 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <div className={`tx-icon tx-icon--${tx.quantity_delta > 0 ? 'positive' : 'negative'}`}>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: tx.quantity_delta > 0 ? 'var(--state-success-text)' : 'var(--state-error-text)' }}>
                    {tx.quantity_delta > 0 ? '+' : ''}{tx.quantity_delta}
                  </span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {tx.parts?.name || '—'}
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-3)' }}>
                    {txTypeLabel[tx.transaction_type] || tx.transaction_type} · {new Date(tx.created_at).toLocaleDateString()}
                    {tx.reason && ` · ${tx.reason}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit warehouse sheet */}
      {showEdit && (
        <EditWarehouseSheet
          warehouse={warehouse}
          onClose={() => setShowEdit(false)}
          onSaved={updated => { setWarehouse(updated); setShowEdit(false) }}
        />
      )}
    </div>
  )
}
