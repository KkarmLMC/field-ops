import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Package, MagnifyingGlass, X, CaretRight, CaretDown,
  ArrowSquareOut, Plus,
} from '@phosphor-icons/react'
import { db } from '../lib/supabase.js'

// Category accent colors for visual variety
const CATEGORY_COLORS = {
  'Air Terminals (SRAT)':       { bg: '#EFF6FF', text: '#1D4ED8', dot: '#3B82F6' },
  'Candelabra Air Terminals':   { bg: '#F0FDF4', text: '#15803D', dot: '#22C55E' },
  'Lightning Rods':             { bg: '#FFF7ED', text: '#C2410C', dot: '#F97316' },
  'Dissipators & Static Control':{ bg: '#FDF4FF', text: '#7E22CE', dot: '#A855F7' },
  'Conductors':                 { bg: '#ECFDF5', text: '#065F46', dot: '#10B981' },
  'Ground Electrodes':          { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B' },
  'Bonding Hardware':           { bg: '#F0F9FF', text: '#0369A1', dot: '#0EA5E9' },
  'Mounting Hardware':          { bg: '#F5F3FF', text: '#5B21B6', dot: '#7C3AED' },
  'Surge Protection':           { bg: '#FFF1F2', text: '#BE123C', dot: '#F43F5E' },
  'MAGS Systems':               { bg: '#F0FDF4', text: '#166534', dot: '#16A34A' },
  'Raw Materials':              { bg: '#F8FAFC', text: '#334155', dot: '#64748B' },
  'Consumables & Hardware':     { bg: '#FAFAF9', text: '#44403C', dot: '#78716C' },
}

function CategorySection({ category, parts, onPartPress }) {
  const [expanded, setExpanded] = useState(true)
  const colors = CATEGORY_COLORS[category.name] || { bg: '#F8FAFC', text: '#334155', dot: '#64748B' }

  return (
    <div style={{
      background: 'var(--surface-raised)',
      borderRadius: 'var(--r-xl)',
      overflow: 'hidden',
      border: '1px solid var(--border-l)',
      marginBottom: 'var(--sp-4)',
    }}>
      {/* Category header */}
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center',
          gap: 'var(--sp-3)', padding: 'var(--sp-4)',
          border: 'none', background: 'none', cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        {/* Color dot */}
        <div style={{
          width: '2.25rem', height: '2.25rem', borderRadius: 'var(--r-md)',
          background: colors.bg, display: 'flex', alignItems: 'center',
          justifyContent: 'center', flexShrink: 0,
        }}>
          <div style={{ width: '0.5rem', height: '0.5rem', borderRadius: '50%', background: colors.dot }} />
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 'var(--fs-md)', fontWeight: 700, color: 'var(--text-1)' }}>
            {category.name}
          </div>
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-3)', marginTop: 2 }}>
            {parts.length} {parts.length === 1 ? 'part' : 'parts'}
          </div>
        </div>

        <CaretDown
          size={16}
          style={{
            color: 'var(--text-3)', flexShrink: 0,
            transform: expanded ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s ease',
          }}
        />
      </button>

      {/* Parts list */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--border-l)' }}>
          {parts.map((part, idx) => (
            <button
              key={part.id}
              onClick={() => onPartPress(part.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 'var(--sp-3)',
                padding: 'var(--sp-3) var(--sp-4)',
                border: 'none', background: 'none', width: '100%', textAlign: 'left',
                borderBottom: idx < parts.length - 1 ? '1px solid var(--border-l)' : 'none',
                cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 'var(--fs-sm)', fontWeight: 600, color: 'var(--text-1)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {part.name}
                </div>
                <div style={{ display: 'flex', gap: 'var(--sp-3)', marginTop: 2, flexWrap: 'wrap' }}>
                  {part.sku && (
                    <span style={{ fontSize: 'var(--fs-xs)', fontFamily: 'var(--mono)', color: 'var(--text-3)' }}>
                      {part.sku}
                    </span>
                  )}
                  {part.unit_cost && (
                    <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-3)' }}>
                      ${part.unit_cost}
                    </span>
                  )}
                  {part.unit_of_measure && part.unit_of_measure !== 'each' && (
                    <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-3)' }}>
                      per {part.unit_of_measure}
                    </span>
                  )}
                </div>
              </div>
              <CaretRight size={13} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function PartsCatalog() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [parts, setParts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    Promise.all([
      db.from('part_categories').select('*').order('name'),
      db.from('parts').select('id, sku, name, description, unit_cost, unit_of_measure, category_id, manufacturer').eq('is_active', true).order('name'),
    ]).then(([{ data: cats }, { data: pts }]) => {
      setCategories(cats || [])
      setParts(pts || [])
      setLoading(false)
    })
  }, [])

  // Filter parts by search
  const filteredParts = search
    ? parts.filter(p => {
        const q = search.toLowerCase()
        return (
          p.name.toLowerCase().includes(q) ||
          (p.sku || '').toLowerCase().includes(q) ||
          (p.manufacturer || '').toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q)
        )
      })
    : parts

  // Group filtered parts by category
  const grouped = categories.map(cat => ({
    category: cat,
    parts: filteredParts.filter(p => p.category_id === cat.id),
  })).filter(g => g.parts.length > 0)

  const uncategorized = filteredParts.filter(p => !p.category_id)

  return (
    <div className="page-content fade-in">

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        gap: 'var(--sp-3)', marginBottom: 'var(--sp-5)', flexWrap: 'wrap',
      }}>
        <div>
          <div style={{ fontSize: 'var(--fs-xs)', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
            INVENTORY
          </div>
          <div style={{ fontSize: 'var(--fs-2xl)', fontWeight: 800, lineHeight: 1.1 }}>Parts Catalog</div>
          <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-3)', marginTop: 4 }}>
            {parts.length} parts across {categories.length} categories
          </div>
        </div>
        <div style={{ display: 'flex', gap: 'var(--sp-2)', alignItems: 'center' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: 'var(--sp-1) var(--sp-3)', borderRadius: 'var(--r-full)',
            background: '#EFF6FF', fontSize: 'var(--fs-xs)', fontWeight: 600, color: '#1D4ED8',
          }}>
            <ArrowSquareOut size={12} />
            QuickBooks sync — coming soon
          </div>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 'var(--sp-5)' }}>
        <MagnifyingGlass size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search parts, SKU, manufacturer, description…"
          style={{ width: '100%', paddingLeft: 36, paddingRight: search ? 36 : 12 }}
        />
        {search && (
          <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-3)' }}>
            <X size={14} />
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--sp-10)' }}>
          <div className="spinner" />
        </div>
      ) : grouped.length === 0 && uncategorized.length === 0 ? (
        <div className="empty">
          <Package size={40} style={{ color: 'var(--text-3)', marginBottom: 'var(--sp-3)' }} />
          <div className="empty-title">No parts found</div>
          <div className="empty-desc">Try a different search term.</div>
        </div>
      ) : (
        <>
          {/* Search result count */}
          {search && (
            <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-3)', marginBottom: 'var(--sp-4)' }}>
              {filteredParts.length} result{filteredParts.length !== 1 ? 's' : ''} for "{search}"
            </div>
          )}

          {/* Category sections */}
          {grouped.map(({ category, parts: catParts }) => (
            <CategorySection
              key={category.id}
              category={category}
              parts={catParts}
              onPartPress={id => navigate(`/inventory/part/${id}`)}
            />
          ))}

          {/* Uncategorized */}
          {uncategorized.length > 0 && (
            <CategorySection
              category={{ id: 'uncategorized', name: 'Uncategorized' }}
              parts={uncategorized}
              onPartPress={id => navigate(`/inventory/part/${id}`)}
            />
          )}
        </>
      )}
    </div>
  )
}
