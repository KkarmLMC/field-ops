import { Package, ArrowSquareOut, FloppyDisk } from '@phosphor-icons/react'

export default function PartsCatalog() {
  return (
    <div className="page-content fade-in">
      <div style={{ marginBottom: 'var(--sp-5)' }}>
        <div style={{ fontSize: 'var(--fs-xs)', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
          INVENTORY
        </div>
        <div style={{ fontSize: 'var(--fs-2xl)', fontWeight: 800, lineHeight: 1.1 }}>Parts Catalog</div>
      </div>

      <div style={{
        background: 'var(--surface-raised)', borderRadius: 'var(--r-xl)',
        padding: 'var(--sp-8)', textAlign: 'center',
        border: '2px dashed var(--border-l)',
      }}>
        <div style={{
          width: '4rem', height: '4rem', borderRadius: 'var(--r-xl)',
          background: 'var(--hover)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', margin: '0 auto var(--sp-4)',
        }}>
          <Package size={28} style={{ color: 'var(--text-3)' }} />
        </div>
        <div style={{ fontSize: 'var(--fs-lg)', fontWeight: 700, marginBottom: 'var(--sp-2)' }}>
          Parts Catalog
        </div>
        <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-3)', maxWidth: '28rem', margin: '0 auto var(--sp-6)', lineHeight: 1.6 }}>
          The Parts Catalog will be your master database of all Lightning Master and Bolt parts —
          independent of warehouse stock levels. This will sync with QuickBooks or your ERP
          to keep part numbers, descriptions, costs, and specs in one source of truth.
        </div>
        <div style={{ display: 'flex', gap: 'var(--sp-3)', justifyContent: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', padding: 'var(--sp-2) var(--sp-4)', borderRadius: 'var(--r-md)', background: 'var(--hover)', fontSize: 'var(--fs-xs)', fontWeight: 600, color: 'var(--text-3)' }}>
            <ArrowSquareOut size={14} /> QuickBooks Sync
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', padding: 'var(--sp-2) var(--sp-4)', borderRadius: 'var(--r-md)', background: 'var(--hover)', fontSize: 'var(--fs-xs)', fontWeight: 600, color: 'var(--text-3)' }}>
            <FloppyDisk size={14} /> Master Part Database
          </div>
        </div>
        <div style={{ marginTop: 'var(--sp-5)', fontSize: 'var(--fs-xs)', color: 'var(--text-3)', fontStyle: 'italic' }}>
          Coming soon
        </div>
      </div>
    </div>
  )
}
