import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Buildings, Package, WarningCircle, ArrowsLeftRight,
  Plus, TrendUp, CurrencyDollar, Truck, CaretRight,
  PencilSimple, MapPin, Phone, Envelope, ClipboardText,
  CaretDown, MagnifyingGlass, X,
} from '@phosphor-icons/react'
import { db } from '../lib/supabase.js'

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, Icon, color = 'var(--text-1)', bg = 'var(--hover)' }) {
  return (
    <div style={{ background: 'var(--surface-raised)', borderRadius: 'var(--r-lg)', padding: 'var(--sp-4)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', marginBottom: 'var(--sp-2)' }}>
        <div style={{ width: '2rem', height: '2rem', borderRadius: 'var(--r-md)', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={14} style={{ color }} />
        </div>
        <span style={{ fontSize: 'var(--fs-xs)', fontWeight: 600, color: 'var(--text-3)' }}>{label}</span>
      </div>
      <div style={{ fontSize: 'var(--fs-2xl)', fontWeight: 800, color }}>{value}</div>
    </div>
  )
}

// ─── Part row in the stock list ───────────────────────────────────────────────
function StockRow({ level, onPress }) {
  const isLow = level.min_level && level.quantity_on_hand <= level.min_level && level.quantity_on_hand > 0
  const isOut = level.quantity_on_hand === 0
  const color = isOut ? '#B91C1C' : isLow ? '#C2410C' : '#15803D'
  const bg    = isOut ? '#FEF2F2' : isLow ? '#FFF7ED' : '#F0FDF4'

  return (
    <button onClick={onPress} style={{
      display: 'flex', alignItems: 'center', gap: 'var(--sp-3)',
      padding: 'var(--sp-3) var(--sp-4)',
      border: 'none', background: 'none', width: '100%', textAlign: 'left',
      borderBottom: '1px solid var(--border-l)', cursor: 'pointer',
      WebkitTapHighlightColor: 'transparent',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {level.parts?.name || '—'}
        </div>
        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-3)', marginTop: 2, display: 'flex', gap: 'var(--sp-2)' }}>
          {level.parts?.sku && <span style={{ fontFamily: 'var(--mono)' }}>{level.parts.sku}</span>}
          {level.quantity_on_order > 0 && <span style={{ color: '#1D4ED8', fontWeight: 600 }}>+{level.quantity_on_order} on order</span>}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', flexShrink: 0 }}>
        <span style={{ padding: '3px 10px', borderRadius: 'var(--r-full)', fontSize: 'var(--fs-sm)', fontWeight: 700, background: bg, color }}>
          {level.quantity_on_hand}
        </span>
        <CaretRight size={13} style={{ color: 'var(--text-3)' }} />
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
  const [stockFilter, setStockFilter] = useState('all') // all | low | out | in
  const [showTx, setShowTx]       = useState(false)
  const [transactions, setTransactions] = useState([])

  useEffect(() => {
    Promise.all([
      db.from('warehouses').select('*').eq('id', id).single(),
      db.from('inventory_levels')
        .select('*, parts(id, sku, name, unit_cost, category_id, part_categories(name))')
        .eq('warehouse_id', id)
        .order('quantity_on_hand', { ascending: true }),
    ]).then(([{ data: wh }, { data: lvl }]) => {
      setWarehouse(wh)
      setLevels(lvl || [])
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

  if (loading) return <div className="page-content fade-in" style={{ display: 'flex', justifyContent: 'center', padding: 'var(--sp-10)' }}><div className="spinner" /></div>
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
    count_correction: 'Count Correction',
  }

  return (
    <div className="page-content fade-in">

      {/* Header */}
      <div style={{ background: 'var(--navy)', borderRadius: 'var(--r-xl)', padding: 'var(--sp-5)', marginBottom: 'var(--sp-5)', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--sp-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
            <div style={{ width: '3rem', height: '3rem', borderRadius: 'var(--r-xl)', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Buildings size={22} style={{ color: '#fff' }} />
            </div>
            <div>
              <div style={{ fontSize: 'var(--fs-xl)', fontWeight: 800, lineHeight: 1.1 }}>{warehouse.name}</div>
              {(warehouse.city || warehouse.state) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'rgba(255,255,255,0.6)', marginTop: 4, fontSize: 'var(--fs-xs)' }}>
                  <MapPin size={12} />
                  {[warehouse.city, warehouse.state].filter(Boolean).join(', ')}
                </div>
              )}
            </div>
          </div>
          <button onClick={() => navigate(`/inventory/warehouse/${id}/edit`)}
            style={{ width: '2.25rem', height: '2.25rem', borderRadius: 'var(--r-lg)', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <PencilSimple size={15} />
          </button>
        </div>

        {/* Contact info */}
        {(warehouse.contact_name || warehouse.contact_phone || warehouse.contact_email || warehouse.address) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 'var(--sp-3)', marginTop: 'var(--sp-2)' }}>
            {warehouse.address && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', fontSize: 'var(--fs-xs)', color: 'rgba(255,255,255,0.65)' }}>
                <MapPin size={12} />
                {warehouse.address}{warehouse.zip ? `, ${warehouse.zip}` : ''}
              </div>
            )}
            {warehouse.contact_name && (
              <div style={{ fontSize: 'var(--fs-xs)', color: 'rgba(255,255,255,0.65)' }}>Contact: {warehouse.contact_name}</div>
            )}
            {warehouse.contact_phone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', fontSize: 'var(--fs-xs)', color: 'rgba(255,255,255,0.65)' }}>
                <Phone size={12} /> {warehouse.contact_phone}
              </div>
            )}
            {warehouse.contact_email && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', fontSize: 'var(--fs-xs)', color: 'rgba(255,255,255,0.65)' }}>
                <Envelope size={12} /> {warehouse.contact_email}
              </div>
            )}
            {warehouse.notes && (
              <div style={{ fontSize: 'var(--fs-xs)', color: 'rgba(255,255,255,0.5)', fontStyle: 'italic', marginTop: 2 }}>{warehouse.notes}</div>
            )}
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--sp-3)', marginBottom: 'var(--sp-4)' }}>
        <StatCard label="SKUs In Stock" value={totalSkus.toLocaleString()} Icon={Package} color="var(--navy)" bg="#EFF6FF" />
        <StatCard label="Total Units" value={totalUnits.toLocaleString()} Icon={TrendUp} color="var(--text-1)" bg="var(--hover)" />
        <StatCard label="Low Stock" value={lowStock.length} Icon={WarningCircle} color={lowStock.length > 0 ? '#C2410C' : 'var(--text-3)'} bg={lowStock.length > 0 ? '#FFF7ED' : 'var(--hover)'} />
        <StatCard label="On Order" value={totalOnOrder.toLocaleString()} Icon={Truck} color={totalOnOrder > 0 ? '#1D4ED8' : 'var(--text-3)'} bg={totalOnOrder > 0 ? '#EFF6FF' : 'var(--hover)'} />
      </div>

      {/* Value */}
      {totalValue > 0 && (
        <div style={{ background: 'var(--surface-raised)', borderRadius: 'var(--r-lg)', padding: 'var(--sp-4)', marginBottom: 'var(--sp-4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', color: 'var(--text-3)' }}>
            <CurrencyDollar size={16} />
            <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 600 }}>Est. Inventory Value</span>
          </div>
          <span style={{ fontSize: 'var(--fs-xl)', fontWeight: 800, color: '#15803D' }}>
            ${totalValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </span>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)', marginBottom: 'var(--sp-5)' }}>
        <button onClick={() => navigate(`/inventory/transfer?from=${id}`)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--sp-2)', padding: 'var(--sp-3)', borderRadius: 'var(--r-md)', border: '1px solid var(--border-l)', background: 'var(--surface-raised)', color: 'var(--text-2)', fontWeight: 700, fontSize: 'var(--fs-sm)', cursor: 'pointer' }}>
          <ArrowsLeftRight size={15} /> Transfer
        </button>
        <button onClick={() => navigate('/inventory/add-part')}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--sp-2)', padding: 'var(--sp-3)', borderRadius: 'var(--r-md)', border: 'none', background: 'var(--navy)', color: '#fff', fontWeight: 700, fontSize: 'var(--fs-sm)', cursor: 'pointer' }}>
          <Plus size={15} /> Add Part
        </button>
      </div>

      {/* Stock section */}
      <div style={{ marginBottom: 'var(--sp-2)' }}>
        <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--text-2)', marginBottom: 'var(--sp-3)' }}>
          Stock ({levels.length} parts)
        </div>

        {/* Search + filters */}
        <div style={{ position: 'relative', marginBottom: 'var(--sp-3)' }}>
          <MagnifyingGlass size={15} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search parts…"
            style={{ width: '100%', paddingLeft: 34, paddingRight: search ? 34 : 12 }} />
          {search && (
            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-3)' }}>
              <X size={13} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: 'var(--sp-2)', marginBottom: 'var(--sp-3)', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {[['all', 'All'], ['in', 'In Stock'], ['low', `Low (${lowStock.length})`], ['out', `Out (${outOfStock.length})`]].map(([val, lbl]) => (
            <button key={val} onClick={() => setStockFilter(val)}
              style={{
                flexShrink: 0, padding: 'var(--sp-1) var(--sp-3)', borderRadius: 'var(--r-full)',
                border: `1px solid ${stockFilter === val ? 'var(--navy)' : 'var(--border-l)'}`,
                background: stockFilter === val ? 'var(--navy)' : 'transparent',
                color: stockFilter === val ? '#fff' : 'var(--text-2)',
                fontSize: 'var(--fs-xs)', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
              }}>{lbl}</button>
          ))}
        </div>

        {/* Stock list */}
        <div style={{ background: 'var(--surface-raised)', borderRadius: 'var(--r-xl)', overflow: 'hidden', marginBottom: 'var(--sp-5)' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: 'var(--sp-8)', textAlign: 'center', color: 'var(--text-3)', fontSize: 'var(--fs-sm)' }}>
              No parts match filters
            </div>
          ) : filtered.map(level => (
            <StockRow
              key={level.id}
              level={level}
              onPress={() => navigate(`/inventory/part/${level.parts?.id}`)}
            />
          ))}
        </div>
      </div>

      {/* Transaction history (collapsed by default) */}
      <div style={{ background: 'var(--surface-raised)', borderRadius: 'var(--r-xl)', overflow: 'hidden', marginBottom: 'var(--sp-4)' }}>
        <button onClick={loadTransactions}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--sp-3) var(--sp-4)', border: 'none', background: 'none', cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
            <ClipboardText size={16} style={{ color: 'var(--text-3)' }} />
            <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--text-2)' }}>Transaction History</span>
          </div>
          <CaretDown size={14} style={{ color: 'var(--text-3)', transform: showTx ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>
        {showTx && (
          <div style={{ borderTop: '1px solid var(--border-l)' }}>
            {transactions.length === 0 ? (
              <div style={{ padding: 'var(--sp-5)', textAlign: 'center', color: 'var(--text-3)', fontSize: 'var(--fs-sm)' }}>No transactions yet</div>
            ) : transactions.map(tx => (
              <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', padding: 'var(--sp-3) var(--sp-4)', borderBottom: '1px solid var(--border-l)' }}>
                <div style={{
                  width: '2rem', height: '2rem', borderRadius: 'var(--r-full)', flexShrink: 0,
                  background: tx.quantity_delta > 0 ? '#F0FDF4' : '#FEF2F2',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: 'var(--fs-xs)', fontWeight: 800, color: tx.quantity_delta > 0 ? '#15803D' : '#B91C1C' }}>
                    {tx.quantity_delta > 0 ? '+' : ''}{tx.quantity_delta}
                  </span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {tx.parts?.name || '—'}
                  </div>
                  <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-3)' }}>
                    {txTypeLabel[tx.transaction_type] || tx.transaction_type} · {new Date(tx.created_at).toLocaleDateString()}
                    {tx.reason && ` · ${tx.reason}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
