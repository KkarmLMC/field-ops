import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MagnifyingGlass, Plus, Package, WarningCircle,
  Buildings, Funnel, X, CaretRight, ArrowsLeftRight,
} from '@phosphor-icons/react'
import { db } from '../lib/supabase.js'
import SectionDivider from '../components/SectionDivider.jsx'

// ─── Stock badge ──────────────────────────────────────────────────────────────
function StockBadge({ qty, minLevel, onOrder }) {
  if (qty === 0 && onOrder > 0) return (
    <span style={{ padding: '2px 8px', borderRadius: 'var(--r-full)', fontSize: 'var(--fs-xs)', fontWeight: 700, background: '#EFF6FF', color: '#1D4ED8' }}>
      0 (+{onOrder} ordered)
    </span>
  )
  if (qty === 0) return (
    <span style={{ padding: '2px 8px', borderRadius: 'var(--r-full)', fontSize: 'var(--fs-xs)', fontWeight: 700, background: '#FEF2F2', color: '#B91C1C' }}>
      Out of stock
    </span>
  )
  if (minLevel && qty <= minLevel) return (
    <span style={{ padding: '2px 8px', borderRadius: 'var(--r-full)', fontSize: 'var(--fs-xs)', fontWeight: 700, background: '#FFF7ED', color: '#C2410C' }}>
      Low: {qty}
    </span>
  )
  return (
    <span style={{ padding: '2px 8px', borderRadius: 'var(--r-full)', fontSize: 'var(--fs-xs)', fontWeight: 700, background: '#F0FDF4', color: '#15803D' }}>
      {qty} {qty === 1 ? 'unit' : 'units'}
    </span>
  )
}

// ─── Part card ────────────────────────────────────────────────────────────────
function PartCard({ part, levels, onPress }) {
  const totalQty = levels.reduce((sum, l) => sum + (l.quantity_on_hand || 0), 0)
  const totalOnOrder = levels.reduce((sum, l) => sum + (l.quantity_on_order || 0), 0)
  const minLevel = levels.length ? Math.min(...levels.filter(l => l.min_level).map(l => l.min_level)) : null
  const isLow = minLevel && totalQty <= minLevel

  return (
    <button
      onClick={onPress}
      style={{
        display: 'flex', alignItems: 'center', gap: 'var(--sp-3)',
        padding: 'var(--sp-3) var(--sp-4)',
        border: 'none', background: 'none', width: '100%', textAlign: 'left',
        borderBottom: '1px solid var(--border-l)', cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* Icon / placeholder */}
      <div style={{
        width: '2.75rem', height: '2.75rem', borderRadius: 'var(--r-lg)',
        background: isLow ? '#FFF7ED' : 'var(--surface-raised)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {isLow
          ? <WarningCircle size={22} weight="fill" style={{ color: '#C2410C' }} />
          : <Package size={22} style={{ color: 'var(--text-3)' }} />
        }
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 'var(--fs-md)', fontWeight: 600, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {part.name}
        </div>
        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-3)', marginTop: 2 }}>
          {part.sku && <span style={{ fontFamily: 'var(--mono)' }}>{part.sku} · </span>}
          {part.part_categories?.name || 'Uncategorized'}
        </div>
      </div>

      {/* Stock */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', flexShrink: 0 }}>
        <StockBadge qty={totalQty} minLevel={minLevel} onOrder={totalOnOrder} />
        <CaretRight size={14} style={{ color: 'var(--text-3)' }} />
      </div>
    </button>
  )
}

// ─── Warehouse filter pills ───────────────────────────────────────────────────
function WarehouseFilter({ warehouses, selected, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 'var(--sp-2)', overflowX: 'auto', paddingBottom: 2, scrollbarWidth: 'none' }}>
      <button
        onClick={() => onChange(null)}
        style={{
          flexShrink: 0, padding: 'var(--sp-1) var(--sp-3)', borderRadius: 'var(--r-full)',
          border: `1px solid ${selected === null ? 'var(--navy)' : 'var(--border-l)'}`,
          background: selected === null ? 'var(--navy)' : 'transparent',
          color: selected === null ? '#fff' : 'var(--text-2)',
          fontSize: 'var(--fs-xs)', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
        }}
      >
        All Warehouses
      </button>
      {warehouses.map(w => (
        <button
          key={w.id}
          onClick={() => onChange(w.id)}
          style={{
            flexShrink: 0, padding: 'var(--sp-1) var(--sp-3)', borderRadius: 'var(--r-full)',
            border: `1px solid ${selected === w.id ? 'var(--navy)' : 'var(--border-l)'}`,
            background: selected === w.id ? 'var(--navy)' : 'transparent',
            color: selected === w.id ? '#fff' : 'var(--text-2)',
            fontSize: 'var(--fs-xs)', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
          }}
        >
          {w.name.replace(' Warehouse', '')}
        </button>
      ))}
    </div>
  )
}

// ─── Main Inventory page ──────────────────────────────────────────────────────
export default function Inventory() {
  const navigate = useNavigate()
  const [parts, setParts] = useState([])
  const [levels, setLevels] = useState({}) // keyed by part_id → array of levels
  const [warehouses, setWarehouses] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedWarehouse, setSelectedWarehouse] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [stockFilter, setStockFilter] = useState('all') // all | low | out

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: partsData }, { data: warehousesData }, { data: categoriesData }, { data: levelsData }] = await Promise.all([
      db.from('parts').select('*, part_categories(name)').eq('is_active', true).order('name'),
      db.from('warehouses').select('*').eq('is_active', true).order('name'),
      db.from('part_categories').select('*').order('name'),
      db.from('inventory_levels').select('*'),
    ])

    setParts(partsData || [])
    setWarehouses(warehousesData || [])
    setCategories(categoriesData || [])

    // Group levels by part_id
    const lvlMap = {}
    for (const l of levelsData || []) {
      if (!lvlMap[l.part_id]) lvlMap[l.part_id] = []
      lvlMap[l.part_id].push(l)
    }
    setLevels(lvlMap)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // Stats
  const totalParts = parts.length
  const lowStockCount = parts.filter(p => {
    const lvls = levels[p.id] || []
    const qty = lvls.reduce((s, l) => s + l.quantity_on_hand, 0)
    const min = Math.min(...lvls.filter(l => l.min_level).map(l => l.min_level))
    return isFinite(min) && qty <= min && qty > 0
  }).length
  const outOfStockCount = parts.filter(p => {
    const lvls = levels[p.id] || []
    return lvls.reduce((s, l) => s + l.quantity_on_hand, 0) === 0
  }).length

  // Filter
  const filtered = parts.filter(p => {
    const lvls = levels[p.id] || []
    const qty = lvls.reduce((s, l) => s + l.quantity_on_hand, 0)
    const min = Math.min(...lvls.filter(l => l.min_level).map(l => l.min_level))

    if (search) {
      const q = search.toLowerCase()
      if (!p.name.toLowerCase().includes(q) && !(p.sku || '').toLowerCase().includes(q) && !(p.manufacturer || '').toLowerCase().includes(q)) return false
    }
    if (selectedCategory && p.category_id !== selectedCategory) return false
    if (selectedWarehouse) {
      if (!lvls.some(l => l.warehouse_id === selectedWarehouse)) return false
    }
    if (stockFilter === 'low') {
      if (!isFinite(min) || qty > min || qty === 0) return false
    }
    if (stockFilter === 'out' && qty !== 0) return false
    return true
  })

  return (
    <div className="page-content fade-in">
      <SectionDivider title="Inventory" label="Parts Catalog" accent="var(--navy)" />

      {/* Stats strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--sp-3)', marginBottom: 'var(--sp-4)' }}>
        {[
          { label: 'Total Parts', value: totalParts, color: 'var(--navy)' },
          { label: 'Low Stock', value: lowStockCount, color: '#C2410C' },
          { label: 'Out of Stock', value: outOfStockCount, color: '#B91C1C' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--surface-raised)', borderRadius: 'var(--r-lg)', padding: 'var(--sp-3)', textAlign: 'center' }}>
            <div style={{ fontSize: 'var(--fs-2xl)', fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-3)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 'var(--sp-3)' }}>
        <MagnifyingGlass size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search parts, SKU, manufacturer…"
          style={{ width: '100%', paddingLeft: 36, paddingRight: search ? 36 : 12 }}
        />
        {search && (
          <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-3)' }}>
            <X size={14} />
          </button>
        )}
      </div>

      {/* Warehouse filter */}
      <div style={{ marginBottom: 'var(--sp-3)' }}>
        <WarehouseFilter warehouses={warehouses} selected={selectedWarehouse} onChange={setSelectedWarehouse} />
      </div>

      {/* Stock status filter */}
      <div style={{ display: 'flex', gap: 'var(--sp-2)', marginBottom: 'var(--sp-4)' }}>
        {[['all', 'All'], ['low', 'Low Stock'], ['out', 'Out of Stock']].map(([val, lbl]) => (
          <button key={val} onClick={() => setStockFilter(val)}
            style={{
              padding: 'var(--sp-1) var(--sp-3)', borderRadius: 'var(--r-full)',
              border: `1px solid ${stockFilter === val ? 'var(--red)' : 'var(--border-l)'}`,
              background: stockFilter === val ? 'var(--red)' : 'transparent',
              color: stockFilter === val ? '#fff' : 'var(--text-2)',
              fontSize: 'var(--fs-xs)', fontWeight: 600, cursor: 'pointer',
            }}>
            {lbl}
          </button>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)', marginBottom: 'var(--sp-4)' }}>
        <button onClick={() => navigate('/inventory/add-part')}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--sp-2)', padding: 'var(--sp-3)', borderRadius: 'var(--r-lg)', border: '1px solid var(--navy)', background: 'var(--navy)', color: '#fff', fontWeight: 700, fontSize: 'var(--fs-sm)', cursor: 'pointer' }}>
          <Plus size={16} /> Add Part
        </button>
        <button onClick={() => navigate('/inventory/transfer')}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--sp-2)', padding: 'var(--sp-3)', borderRadius: 'var(--r-lg)', border: '1px solid var(--border-l)', background: 'var(--surface-raised)', color: 'var(--text-2)', fontWeight: 700, fontSize: 'var(--fs-sm)', cursor: 'pointer' }}>
          <ArrowsLeftRight size={16} /> Transfer
        </button>
      </div>

      {/* Parts list */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--sp-10)' }}><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty">
          <Package size={40} style={{ color: 'var(--text-3)', marginBottom: 'var(--sp-3)' }} />
          <div className="empty-title">{parts.length === 0 ? 'No parts yet' : 'No parts match filters'}</div>
          <div className="empty-desc">{parts.length === 0 ? 'Add your first part to get started.' : 'Try adjusting your search or filters.'}</div>
          {parts.length === 0 && (
            <button className="btn btn-primary" style={{ marginTop: 'var(--sp-4)' }} onClick={() => navigate('/inventory/add-part')}>
              Add First Part
            </button>
          )}
        </div>
      ) : (
        <div style={{ background: 'var(--surface-raised)', borderRadius: 'var(--r-xl)', overflow: 'hidden' }}>
          {filtered.map(part => (
            <PartCard
              key={part.id}
              part={part}
              levels={(levels[part.id] || []).filter(l => !selectedWarehouse || l.warehouse_id === selectedWarehouse)}
              onPress={() => navigate(`/inventory/part/${part.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
