import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Buildings, Package, WarningCircle, ArrowsLeftRight,
  Plus, TrendUp, CurrencyDollar, Truck,
} from '@phosphor-icons/react'
import { db } from '../lib/supabase.js'

function StatTile({ label, value, color = 'var(--text-1)' }) {
  return (
    <div style={{ background: 'var(--surface-raised)', borderRadius: 'var(--r-lg)', padding: 'var(--sp-3) var(--sp-4)' }}>
      <div style={{ fontSize: 'var(--fs-2xl)', fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-3)', marginTop: 4, fontWeight: 600 }}>{label}</div>
    </div>
  )
}

function WarehouseCard({ warehouse, levels, onViewParts, onTransfer }) {
  const wLevels = levels.filter(l => l.warehouse_id === warehouse.id)
  const totalSkus     = wLevels.filter(l => l.quantity_on_hand > 0).length
  const totalUnits    = wLevels.reduce((s, l) => s + l.quantity_on_hand, 0)
  const totalOnOrder  = wLevels.reduce((s, l) => s + (l.quantity_on_order || 0), 0)
  const lowStockItems = wLevels.filter(l => l.min_level && l.quantity_on_hand > 0 && l.quantity_on_hand <= l.min_level).length
  const totalValue    = wLevels.reduce((s, l) => s + (l.quantity_on_hand * (l.parts?.unit_cost || 0)), 0)
  const hasAlerts     = lowStockItems > 0

  return (
    <div style={{
      background: 'var(--surface-raised)', borderRadius: 'var(--r-xl)', overflow: 'hidden',
      border: hasAlerts ? '1px solid #FED7AA' : '1px solid var(--border-l)',
    }}>
      {/* Header */}
      <div style={{ background: 'var(--navy)', padding: 'var(--sp-4) var(--sp-5)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
          <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: 'var(--r-lg)', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Buildings size={20} style={{ color: '#fff' }} />
          </div>
          <div>
            <div style={{ fontSize: 'var(--fs-md)', fontWeight: 700, color: '#fff' }}>{warehouse.name}</div>
            {(warehouse.city || warehouse.state) && (
              <div style={{ fontSize: 'var(--fs-xs)', color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
                {[warehouse.city, warehouse.state].filter(Boolean).join(', ')}
              </div>
            )}
          </div>
        </div>
        {hasAlerts && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#FEF3C7', borderRadius: 'var(--r-full)', padding: '3px 10px' }}>
            <WarningCircle size={13} weight="fill" style={{ color: '#D97706' }} />
            <span style={{ fontSize: 'var(--fs-xs)', fontWeight: 700, color: '#D97706' }}>{lowStockItems} low stock</span>
          </div>
        )}
      </div>

      {/* Stats 2x2 grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: 'var(--border-l)' }}>
        {[
          { label: 'SKUs In Stock', value: totalSkus.toLocaleString(), Icon: Package, color: 'var(--text-1)' },
          { label: 'Total Units', value: totalUnits.toLocaleString(), Icon: TrendUp, color: 'var(--text-1)' },
          { label: 'Low Stock', value: lowStockItems, Icon: WarningCircle, color: lowStockItems > 0 ? '#C2410C' : 'var(--text-3)' },
          { label: 'On Order', value: totalOnOrder.toLocaleString(), Icon: Truck, color: totalOnOrder > 0 ? '#1D4ED8' : 'var(--text-3)' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--surface-raised)', padding: 'var(--sp-3) var(--sp-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: s.color, marginBottom: 4 }}>
              <s.Icon size={13} />
              <span style={{ fontSize: 'var(--fs-xs)', fontWeight: 600 }}>{s.label}</span>
            </div>
            <div style={{ fontSize: 'var(--fs-xl)', fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Value row */}
      {totalValue > 0 && (
        <div style={{ padding: 'var(--sp-3) var(--sp-5)', borderTop: '1px solid var(--border-l)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-3)' }}>
            <CurrencyDollar size={14} />
            <span style={{ fontSize: 'var(--fs-xs)', fontWeight: 600 }}>Est. Inventory Value</span>
          </div>
          <span style={{ fontSize: 'var(--fs-md)', fontWeight: 700, color: '#15803D' }}>
            ${totalValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </span>
        </div>
      )}

      {/* Low stock list */}
      {lowStockItems > 0 && (
        <div style={{ padding: 'var(--sp-3) var(--sp-5)', borderTop: '1px solid #FED7AA', background: '#FFFBEB' }}>
          <div style={{ fontSize: 'var(--fs-xs)', fontWeight: 700, color: '#92400E', marginBottom: 'var(--sp-2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Low Stock</div>
          {wLevels
            .filter(l => l.min_level && l.quantity_on_hand > 0 && l.quantity_on_hand <= l.min_level)
            .slice(0, 3)
            .map(l => (
              <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-xs)', color: '#92400E', marginBottom: 2 }}>
                <span style={{ fontFamily: 'var(--mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>{l.parts?.sku || '—'}</span>
                <span style={{ fontWeight: 700, flexShrink: 0 }}>{l.quantity_on_hand} / min {l.min_level}</span>
              </div>
            ))}
          {lowStockItems > 3 && <div style={{ fontSize: 'var(--fs-xs)', color: '#92400E', marginTop: 4 }}>+{lowStockItems - 3} more</div>}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-2)', padding: 'var(--sp-3) var(--sp-4)', borderTop: '1px solid var(--border-l)' }}>
        <button onClick={onViewParts}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--sp-2)', padding: 'var(--sp-2) var(--sp-3)', borderRadius: 'var(--r-md)', border: '1px solid var(--navy)', background: 'var(--navy)', color: '#fff', fontSize: 'var(--fs-xs)', fontWeight: 700, cursor: 'pointer' }}>
          <Package size={13} /> View Parts
        </button>
        <button onClick={onTransfer}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--sp-2)', padding: 'var(--sp-2) var(--sp-3)', borderRadius: 'var(--r-md)', border: '1px solid var(--border-l)', background: 'transparent', color: 'var(--text-2)', fontSize: 'var(--fs-xs)', fontWeight: 700, cursor: 'pointer' }}>
          <ArrowsLeftRight size={13} /> Transfer
        </button>
      </div>
    </div>
  )
}

export default function Inventory() {
  const navigate = useNavigate()
  const [warehouses, setWarehouses] = useState([])
  const [levels, setLevels] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      db.from('warehouses').select('*').eq('is_active', true).order('name'),
      db.from('inventory_levels').select('*, parts(sku, unit_cost)'),
    ]).then(([{ data: wh }, { data: lvl }]) => {
      setWarehouses(wh || [])
      setLevels(lvl || [])
      setLoading(false)
    })
  }, [])

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

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--sp-4)', marginBottom: 'var(--sp-5)', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 'var(--fs-xs)', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>INVENTORY</div>
          <div style={{ fontSize: 'var(--fs-2xl)', fontWeight: 800, lineHeight: 1.1 }}>Warehouse Overview</div>
        </div>
        <div style={{ display: 'flex', gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/inventory/transfer')}
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', padding: 'var(--sp-2) var(--sp-3)', borderRadius: 'var(--r-md)', border: '1px solid var(--border-l)', background: 'var(--surface-raised)', color: 'var(--text-2)', fontSize: 'var(--fs-sm)', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <ArrowsLeftRight size={14} /> Transfer
          </button>
          <button onClick={() => navigate('/inventory/stock')}
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', padding: 'var(--sp-2) var(--sp-3)', borderRadius: 'var(--r-md)', border: '1px solid var(--border-l)', background: 'var(--surface-raised)', color: 'var(--text-2)', fontSize: 'var(--fs-sm)', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <Package size={14} /> Inventory
          </button>
          <button onClick={() => navigate('/inventory/add-part')}
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', padding: 'var(--sp-2) var(--sp-3)', borderRadius: 'var(--r-md)', border: 'none', background: 'var(--navy)', color: '#fff', fontSize: 'var(--fs-sm)', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <Plus size={14} /> Add Part
          </button>
        </div>
      </div>

      {/* Network-wide summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--sp-3)', marginBottom: 'var(--sp-6)' }}>
        <StatTile label="Unique SKUs" value={totalSkus.toLocaleString()} />
        <StatTile label="Total Units" value={totalUnits.toLocaleString()} />
        <StatTile label="Low Stock" value={totalLowStock} color={totalLowStock > 0 ? '#C2410C' : 'var(--text-1)'} />
        <StatTile label="On Order" value={totalOnOrder.toLocaleString()} color={totalOnOrder > 0 ? '#1D4ED8' : 'var(--text-1)'} />
      </div>

      {/* Warehouse cards */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--sp-10)' }}><div className="spinner" /></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--sp-5)' }}>
          {warehouses.map(wh => (
            <WarehouseCard
              key={wh.id}
              warehouse={wh}
              levels={levels}
              onViewParts={() => navigate(`/inventory/stock?warehouse=${wh.id}`)}
              onTransfer={() => navigate(`/inventory/transfer?from=${wh.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
