import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MagnifyingGlass, X, ArrowsLeftRight, Package,
  Buildings, WarningCircle, ArrowRight, Clock,
} from '@phosphor-icons/react'
import { db } from '../lib/supabase.js'

// ─── Stock chip ───────────────────────────────────────────────────────────────
function StockBadge({ qty, min }) {
  if (qty === 0)             return <span style={badge('#FEF2F2','#B91C1C')}>Out</span>
  if (min && qty <= min)     return <span style={badge('#FFF7ED','#C2410C')}>Low</span>
  return                            <span style={badge('#F0FDF4','#15803D')}>In Stock</span>
}
function badge(bg, color) {
  return { padding: '2px 8px', borderRadius: 'var(--r-full)', fontSize: 'var(--text-xs)', fontWeight: 700, background: bg, color, whiteSpace: 'nowrap' }
}

// ─── Warehouse tab ────────────────────────────────────────────────────────────
function WarehouseTab({ warehouse, active, onClick, levels }) {
  const total   = levels.reduce((s, l) => s + (l.quantity_on_hand || 0), 0)
  const outCount = levels.filter(l => l.quantity_on_hand === 0).length
  const lowCount = levels.filter(l => l.min_level && l.quantity_on_hand > 0 && l.quantity_on_hand <= l.min_level).length

  return (
    <button onClick={onClick} style={{
      flexShrink: 0,
      padding: 'var(--sp-3) var(--sp-4)',
      borderRadius: 'var(--r-xl)',
      border: `1px solid ${active ? 'var(--navy)' : 'var(--border-l)'}`,
      background: active ? 'var(--navy)' : 'var(--surface-raised)',
      cursor: 'pointer', textAlign: 'left',
      minWidth: 140,
    }}>
      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: active ? '#fff' : 'var(--black)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {warehouse.name.replace(' Warehouse', '')}
      </div>
      <div style={{ fontSize: 'var(--text-xs)', color: active ? 'rgba(255,255,255,0.6)' : 'var(--text-3)' }}>
        {warehouse.city}, {warehouse.state}
      </div>
      <div style={{ display: 'flex', gap: 'var(--sp-2)', marginTop: 4 }}>
        {outCount > 0 && <span style={{ fontSize: 'var(--text-2xs)', fontWeight: 700, color: active ? '#FCA5A5' : '#B91C1C' }}>{outCount} out</span>}
        {lowCount > 0 && <span style={{ fontSize: 'var(--text-2xs)', fontWeight: 700, color: active ? '#FCD34D' : '#C2410C' }}>{lowCount} low</span>}
        {outCount === 0 && lowCount === 0 && <span style={{ fontSize: 'var(--text-2xs)', fontWeight: 700, color: active ? 'rgba(255,255,255,0.5)' : 'var(--text-3)' }}>All OK</span>}
      </div>
    </button>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function StockView() {
  const navigate = useNavigate()
  const [warehouses, setWarehouses]   = useState([])
  const [activeWH, setActiveWH]       = useState(null)
  const [levels, setLevels]           = useState({}) // warehouseId → levels[]
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [filter, setFilter]           = useState('all') // all | low | out

  // Load all warehouses + inventory
  useEffect(() => {
    Promise.all([
      db.from('warehouses').select('*').eq('is_active', true).order('sort_order'),
      db.from('inventory_levels').select('*, parts(id, sku, name, unit_cost, part_categories(name))'),
    ]).then(([{ data: whs }, { data: lvls }]) => {
      setWarehouses(whs || [])
      if (whs?.length) setActiveWH(whs[0].id)

      // Group levels by warehouse
      const grouped = {}
      lvls?.forEach(l => {
        if (!grouped[l.warehouse_id]) grouped[l.warehouse_id] = []
        grouped[l.warehouse_id].push(l)
      })
      setLevels(grouped)
      setLoading(false)
    })
  }, [])

  const whLevels = levels[activeWH] || []

  // Filter + search
  const filtered = whLevels.filter(l => {
    if (filter === 'out' && l.quantity_on_hand !== 0) return false
    if (filter === 'low' && !(l.min_level && l.quantity_on_hand > 0 && l.quantity_on_hand <= l.min_level)) return false
    if (search) {
      const q = search.toLowerCase()
      return (l.parts?.name || '').toLowerCase().includes(q) ||
             (l.parts?.sku  || '').toLowerCase().includes(q)
    }
    return true
  })

  const activeWarehouse = warehouses.find(w => w.id === activeWH)

  return (
    <div className="page-content fade-in">

      {/* Header */}
      <div style={{ marginBottom: 'var(--sp-5)' }}>
        <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--black)', marginBottom: 4 }}>FIELD</div>
        <div style={{ fontSize: 'var(--text-base)', fontWeight: 800, lineHeight: 1.1 }}>Stock Lookup</div>
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-3)', marginTop: 4 }}>Check parts availability across all warehouses</div>
      </div>

      {/* Warehouse selector — horizontal scroll */}
      <div style={{ display: 'flex', gap: 'var(--sp-2)', overflowX: 'auto', scrollbarWidth: 'none', marginBottom: 'var(--sp-4)', paddingBottom: 2 }}>
        {warehouses.map(w => (
          <WarehouseTab
            key={w.id}
            warehouse={w}
            active={activeWH === w.id}
            onClick={() => setActiveWH(w.id)}
            levels={levels[w.id] || []}
          />
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)', marginBottom: 'var(--sp-4)' }}>
        <button onClick={() => navigate(`/warehouse-hq/transfer?from=${activeWH}`)}
          style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', padding: 'var(--sp-3) var(--sp-4)', borderRadius: 'var(--r-xl)', border: 'none', background: 'var(--navy)', color: '#fff', fontWeight: 700, fontSize: 'var(--text-sm)', cursor: 'pointer', textAlign: 'left' }}>
          <ArrowsLeftRight size={16} />
          <div>
            <div style={{ fontWeight: 700 }}>Transfer Request</div>
            <div style={{ fontSize: 'var(--text-xs)', opacity: 0.7, fontWeight: 400 }}>Move stock to your location</div>
          </div>
        </button>

        <button onClick={() => navigate(`/stock/request${activeWH ? `?warehouse=${activeWH}` : ''}`)}
          style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', padding: 'var(--sp-3) var(--sp-4)', borderRadius: 'var(--r-xl)', border: '1px solid var(--border-l)', background: 'var(--surface-raised)', color: 'var(--black)', fontWeight: 700, fontSize: 'var(--text-sm)', cursor: 'pointer', textAlign: 'left' }}>
          <Package size={16} />
          <div>
            <div style={{ fontWeight: 700 }}>Part Request</div>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 400, color: 'var(--text-3)' }}>Submit for approval</div>
          </div>
        </button>
      </div>

      {/* Search + filter */}
      <div style={{ position: 'relative', marginBottom: 'var(--sp-3)' }}>
        <MagnifyingGlass size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search part name or SKU…"
          style={{ width: '100%', paddingLeft: 34, paddingRight: search ? 34 : 12 }}
        />
        {search && (
          <button onClick={() => setSearch('')}
            style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 0, display: 'flex' }}>
            <X size={14} />
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 'var(--sp-2)', marginBottom: 'var(--sp-4)', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {[['all','All Parts'], ['low','Low Stock'], ['out','Out of Stock']].map(([val, lbl]) => (
          <button key={val} onClick={() => setFilter(val)}
            style={{ flexShrink: 0, padding: 'var(--sp-1) var(--sp-3)', borderRadius: 'var(--r-full)', border: `1px solid ${filter === val ? 'var(--navy)' : 'var(--border-l)'}`, background: filter === val ? 'var(--navy)' : 'transparent', color: filter === val ? '#fff' : 'var(--black)', fontSize: 'var(--text-xs)', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {lbl}
          </button>
        ))}
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-3)', alignSelf: 'center', marginLeft: 'auto', whiteSpace: 'nowrap' }}>
          {filtered.length} parts
        </span>
      </div>

      {/* Parts list */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--sp-10)' }}><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty">
          <Package size={36} style={{ color: 'var(--text-3)', marginBottom: 'var(--sp-3)' }} />
          <div className="empty-title">{search ? 'No parts found' : 'No stock data'}</div>
          <div className="empty-desc">{search ? 'Try a different name or SKU.' : 'No inventory recorded for this warehouse.'}</div>
        </div>
      ) : (
        <div style={{ background: 'var(--surface-raised)', borderRadius: 'var(--r-xl)', overflow: 'hidden' }}>
          {/* Column headers */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 60px', gap: 'var(--sp-2)', padding: 'var(--sp-2) var(--sp-4)', background: 'var(--navy)' }}>
            {['Part', 'Stock', ''].map((h, i) => (
              <div key={i} style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'rgba(255,255,255,0.6)', textAlign: i > 0 ? 'right' : 'left' }}>{h}</div>
            ))}
          </div>

          {filtered.map((l, idx) => {
            const isOut = l.quantity_on_hand === 0
            const isLow = l.min_level && l.quantity_on_hand > 0 && l.quantity_on_hand <= l.min_level
            return (
              <div key={l.id} style={{
                display: 'grid', gridTemplateColumns: '1fr 70px 60px', gap: 'var(--sp-2)',
                padding: 'var(--sp-3) var(--sp-4)',
                borderBottom: idx < filtered.length - 1 ? '1px solid var(--border-l)' : 'none',
                alignItems: 'center',
                background: isOut ? '#FFF5F5' : isLow ? '#FFFBEB' : 'transparent',
              }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {l.parts?.name}
                  </div>
                  {l.parts?.sku && (
                    <div style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--mono)', color: 'var(--text-3)' }}>{l.parts.sku}</div>
                  )}
                </div>
                <div style={{ textAlign: 'right', fontSize: 'var(--text-sm)', fontWeight: 800, color: isOut ? '#B91C1C' : isLow ? '#C2410C' : 'var(--black)' }}>
                  {l.quantity_on_hand.toLocaleString()}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <StockBadge qty={l.quantity_on_hand} min={l.min_level} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Transfer CTA at bottom when viewing a warehouse with issues */}
      {(filtered.some(l => l.quantity_on_hand === 0 || (l.min_level && l.quantity_on_hand <= l.min_level))) && (
        <div style={{ marginTop: 'var(--sp-4)', background: 'var(--surface-raised)', borderRadius: 'var(--r-xl)', padding: 'var(--sp-4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--sp-3)' }}>
          <div>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>Need parts restocked?</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-3)', marginTop: 2 }}>Submit a transfer request to move stock from another warehouse.</div>
          </div>
          <button onClick={() => navigate(`/warehouse-hq/transfer?from=${activeWH}`)}
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', padding: 'var(--sp-2) var(--sp-3)', borderRadius: 'var(--r-l)', border: 'none', background: 'var(--navy)', color: '#fff', fontWeight: 700, fontSize: 'var(--text-xs)', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}>
            Request <ArrowRight size={13} />
          </button>
        </div>
      )}
    </div>
  )
}
