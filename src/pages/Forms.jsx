import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CaretRight, CaretDown,
  Ruler, ClipboardText, Buildings, Factory, Drop, Camera, MapPin } from '@phosphor-icons/react'
import { db } from '../lib/supabase.js'
import BranchTabs from '../components/BranchTabs'
import SectionDivider from '../components/SectionDivider'
import { BRANCH_COLORS } from '../config/branches.js'

// ─── Category card — fully DB-driven ─────────────────────────────────────────
function CategoryCard({ category, forms, children, branch, onStart, expandedSlug, onToggle }) {
  const bc = BRANCH_COLORS[branch]
  if (!forms.length) return null
  return (
    <div className="page-content fade-in" style={{ display:'flex', flexDirection:'column' }}>
      <div className="list-card__header" style={{ background: bc.bgActive }}>
        <span className="list-card__title"><ClipboardText size="0.875rem" /> 
          {category.label}
        </span>
      </div>
      <div style={{ flex:1 }}>
        {forms.map(form => {
          const hasChildren = (children[form.slug] || []).length > 0
          const isExpanded  = expandedSlug === form.slug
          return (
            <div key={form.slug}>
              <button
                onClick={() => hasChildren ? onToggle(isExpanded ? null : form.slug) : onStart(form.slug)}
                style={{ width:'100%', textAlign:'left', background:'none', cursor:'pointer',
                  display:'flex', alignItems:'center', gap:'0.75rem',
                  padding: '0.75rem var(--space-l)', borderBottom:'1px solid var(--border-default)',
                  transition:'background var(--ease-fast)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <div style={{ width:8, height:8, borderRadius:'50%', background: form.color || bc.bgActive, flexShrink:0 }} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div className="project-name">{form.title}</div>
                  {form.description && <div className="project-meta">{form.description}</div>}
                </div>
                {hasChildren
                  ? <CaretDown size="0.75rem" style={{ color:'var(--text-primary)', flexShrink:0, transition:'transform 0.15s', transform: isExpanded ? 'rotate(180deg)' : 'none' }} />
                  : <CaretRight size="0.75rem" style={{ color:'var(--text-primary)', flexShrink:0 }} />
                }
              </button>
              {hasChildren && isExpanded && (
                <div style={{ background:'var(--surface-base)' }}>
                  {(children[form.slug] || []).map(sub => (
                    <button
                      key={sub.slug}
                      onClick={() => onStart(sub.slug)}
                      style={{ width:'100%', textAlign:'left', background:'none', cursor:'pointer',
                        display:'flex', alignItems:'center', gap:'0.5rem',
                        padding: '0.625rem var(--space-l) 0.625rem 2.75rem',
                        borderBottom:'1px solid var(--border-default)',
                        transition:'background var(--ease-fast)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <div style={{ width:4, height:4, borderRadius:'50%', background:'var(--text-muted)', flexShrink:0 }} />
                      <div style={{ flex:1, minWidth:0 }}>
                        <span style={{ fontSize:'var(--text-sm)', fontWeight:500, color:'var(--text-primary)' }}>{sub.title}</span>
                        {sub.description && <div className="project-meta" style={{ marginTop:1 }}>{sub.description}</div>}
                      </div>
                      <CaretRight size="0.625rem" style={{ color:'var(--text-4)', flexShrink:0 }} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main Report Forms page — fully DB-driven ─────────────────────────────────
export default function Forms() {
  const navigate = useNavigate()
  const [branch,       setBranch]       = useState('lm')
  const [expandedSlug, setExpandedSlug] = useState(null)
  const [categories,   setCategories]   = useState([])
  const [allForms,     setAllForms]     = useState([])
  const [loading,      setLoading]      = useState(true)

  useEffect(() => {
    Promise.all([
      db.from('form_categories')
        .select('*')
        .eq('active', true)
        .order('sort_order', { ascending: true }),
      db.from('form_definitions')
        .select('slug, title, short, description, category, branch, color, color_dim, sort_order, parent_slug')
        .eq('active', true)
        .order('sort_order', { ascending: true }),
    ]).then(([catRes, formRes]) => {
      if (catRes.data) setCategories(catRes.data)
      if (formRes.data) setAllForms(formRes.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const handleStart = (slug) => navigate(`/forms/${slug}`)

  // Filter to current branch (null = all branches)
  const branchForms = allForms.filter(f => !f.branch || f.branch === branch)

  // Top-level forms only (no parent)
  const topLevel = branchForms.filter(f => !f.parent_slug)

  // Children keyed by parent slug
  const childMap = {}
  branchForms.filter(f => f.parent_slug).forEach(f => {
    if (!childMap[f.parent_slug]) childMap[f.parent_slug] = []
    childMap[f.parent_slug].push(f)
  })

  // Forms grouped by category slug
  const formsByCategory = {}
  topLevel.forEach(f => {
    if (!formsByCategory[f.category]) formsByCategory[f.category] = []
    formsByCategory[f.category].push(f)
  })

  // Filter categories that have forms for this branch
  const visibleCategories = categories.filter(cat =>
    (!cat.branch || cat.branch === branch) &&
    (formsByCategory[cat.slug]?.length > 0)
  )

  return (
    <div className="page-content fade-in">
      <div className="page-stack">
        <SectionDivider title="Report Forms" label="Field Overview" accent="var(--brand-primary)" />
        <BranchTabs active={branch} onChange={setBranch} />

        {loading ? (
          <div className="loading"><div className="spinner" /></div>
        ) : visibleCategories.length === 0 ? (
          <div className="empty">
            <ClipboardText size="2rem" style={{ color: 'var(--text-muted)' }} />
            <div className="empty-title">No forms available</div>
            <div className="empty-desc">No report forms are configured for this branch yet.</div>
          </div>
        ) : (
          <div className="form-catalog-grid">
            {visibleCategories.map(cat => (
              <CategoryCard
                key={cat.slug}
                category={cat}
                forms={formsByCategory[cat.slug] || []}
                children={childMap}
                branch={branch}
                onStart={handleStart}
                expandedSlug={expandedSlug}
                onToggle={setExpandedSlug}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
