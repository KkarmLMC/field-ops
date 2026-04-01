import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MagnifyingGlass, X, ArrowsLeftRight, Package,
  Buildings, WarningCircle, ArrowRight, Clock } from '@phosphor-icons/react'
import { db } from '../lib/supabase.js'

// ─── Stock chip ───────────────────────────────────────────────────────────────
function StockBadge({ qty, min }) {
  if (qty === 0)             return <span style={badge('var(--state-error-soft)','var(--state-error-text)')}>Out</span>
  if (min && qty <= min)     return <span style={badge('var(--state-warning-soft)','var(--state-warning-text)')}>Low</span>
  return                            <span style={badge('var(--state-success-soft)','var(--state-success-text)')}>In Stock</span>
}
function badge(bg, color) {
  return { padding: '2px 8px', borderRadius: 'var(--radius-s)', fontSize: 'var(--text-xs)', fontWeight: 700, background: bg, color, whiteSpace: 'nowrap' }
}

// ─── Warehouse tab ────────────────────────────────────────────────────────────
function WarehouseTab({ warehouse, active, onClick, levels }) {
  const total   = levels.reduce((s, l) => s + (l.quantity_on_hand || 0), 0)
  const outCount = levels.filter(l => l.quantity_on_hand === 0).length
  const lowCount = levels.filter(l => l.min_level && l.quantity_on_hand > 0 && l.quantity_on_hand <= l.min_level).length

  return (
    <button onClick={onClick} style={{
      flexShrink: 0,
      padding: 'var(--space-m) var(--space-l)',
      borderRadius: 'var(--radius-m)',
      border: `1px solid ${active ? 'var(--brand-primary)' : 'var(--border-subtle)'}`,
      background: active ? 'var(--brand-primary)' : 'var(--surface-base)',
      cursor: 'pointer', textAlign: 'left',
      minWidth: 140 }}>
      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: active ? '#fff' : 'var(--text-primary)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {warehouse.name.replace(' Warehouse', '')}
      </div>
      <div style={{ fontSize: 'var(--text-xs)', color: active ? 'rgba(255,255,255,0.6)' : 'var(--text-muted)' }}>
        {warehouse.city}, {warehouse.state}
      </div>
      <div className="stock-view-84b5">
        {outCount > 0 && <span style={{ fontSize: 'var(--text-2xs)', fontWeight: 700, color: active ? 'var(--error-tint-40)' : 'var(--state-error-text)' }}>{outCount} out</span>}
        {lowCount > 0 && <span style={{ fontSize: 'var(--text-2xs)', fontWeight: 700, color: active ? 'var(--warning-border)' : 'var(--state-warning-text)' }}>{lowCount} low</span>}
        {outCount === 0 && lowCount === 0 && <span style={{ fontSize: 'var(--text-2xs)', fontWeight: 700, color: active ? 'rgba(255,255,255,0.5)' : 'var(--text-muted)' }}>All OK</span>}
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


      {/* Warehouse selector — horizontal scroll */}
      <div className="stock-view-311c">
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
      <div className="grid-2col mb-l">
        <button onClick={() => navigate(`/warehouse-hq/transfer?from=${activeWH}`)}
          className="stock-view-7262">
          <ArrowsLeftRight size="1rem" />
          <div>
            <div style={{ fontWeight: 700 }}>Transfer Request</div>
            <div style={{ fontSize: 'var(--text-sm)', opacity: 0.7, fontWeight: 400 }}>Move stock to your location</div>
          </div>
        </button>

        <button onClick={() => navigate(`/stock/request${activeWH ? `?warehouse=${activeWH}` : ''}`)}
          className="stock-view-ecba">
          <Package size="1rem" />
          <div>
            <div style={{ fontWeight: 700 }}>Part Request</div>
            <div className="stock-view-9141">Submit for approval</div>
          </div>
        </button>
      </div>

      {/* Search + filter */}
      <div className="position-relative mb-m">
        <MagnifyingGlass size="0.9375rem" className="search-overlay-icon" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search part name or SKU…"
          style={{ width: '100%', paddingLeft: 34, paddingRight: search ? 34 : 12 }}
        />
        {search && (
          <button onClick={() => setSearch('')}
            className="stock-view-ece0">
            <X size="0.875rem" />
          </button>
        )}
      </div>

      <div className="stock-view-67a5">
        {[['all','All Parts'], ['low','Low Stock'], ['out','Out of Stock']].map(([val, lbl]) => (
          <button key={val} onClick={() => setFilter(val)}
            style={{ flexShrink: 0, padding: 'var(--space-xs) var(--space-m)', borderRadius: 'var(--radius-l)', border: `1px solid ${filter === val ? 'var(--brand-primary)' : 'var(--border-subtle)'}`, background: filter === val ? 'var(--brand-primary)' : 'var(--surface-hover)', color: filter === val ? '#fff' : 'var(--text-primary)', fontSize: 'var(--text-xs)', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {lbl}
          </button>
        ))}
        <span className="stock-view-01d8">
          {filtered.length} parts
        </span>
      </div>

      {/* Parts list */}
      {loading ? (
        <div className="spinner-pad"><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty">
          <Package size="2.25rem" className="empty-icon" />
          <div className="empty-title">{search ? 'No parts found' : 'No stock data'}</div>
          <div className="empty-desc">{search ? 'Try a different name or SKU.' : 'No inventory recorded for this warehouse.'}</div>
        </div>
      ) : (
        <div className="card-section">
          {/* Column headers */}
          <div className="stock-view-171c">
            {['Part', 'Stock', ''].map((h, i) => (
              <div key={i} style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--surface-base)', textAlign: i > 0 ? 'right' : 'left' }}>{h}</div>
            ))}
          </div>

          {filtered.map((l, idx) => {
            const isOut = l.quantity_on_hand === 0
            const isLow = l.min_level && l.quantity_on_hand > 0 && l.quantity_on_hand <= l.min_level
            return (
              <div key={l.id} style={{
                display: 'grid', gridTemplateColumns: '1fr 70px 60px', gap: '0.5rem',
                padding: 'var(--space-m) var(--space-l)',
                borderBottom: idx < filtered.length - 1 ? '1px solid var(--border-default)' : 'none',
                alignItems: 'center',
                background: isOut ? '#FFF5F5' : isLow ? 'var(--warning-soft)' : 'transparent' }}>
                <div className="min-width-0">
                  <div className="text-sm-truncate">
                    {l.parts?.name}
                  </div>
                  {l.parts?.sku && (
                    <div className="text-xs-mono">{l.parts.sku}</div>
                  )}
                </div>
                <div style={{ textAlign: 'right', fontSize: 'var(--text-sm)', fontWeight: 800, color: isOut ? 'var(--state-error-text)' : isLow ? 'var(--state-warning-text)' : 'var(--text-primary)' }}>
                  {l.quantity_on_hand.toLocaleString()}
                </div>
                <div className="stock-view-1451">
                  <StockBadge qty={l.quantity_on_hand} min={l.min_level} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Transfer CTA at bottom when viewing a warehouse with issues */}
      {(filtered.some(l => l.quantity_on_hand === 0 || (l.min_level && l.quantity_on_hand <= l.min_level))) && (
        <div className="stock-view-86b2">
          <div>
            <div className="text-sm-bold">Need parts restocked?</div>
            <div className="meta-text">Submit a transfer request to move stock from another warehouse.</div>
          </div>
          <button onClick={() => navigate(`/warehouse-hq/transfer?from=${activeWH}`)}
            className="stock-view-8134">
            Request <ArrowRight size="0.8125rem" />
          </button>
        </div>
      )}
    </div>
  )
}
