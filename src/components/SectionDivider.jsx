/**
 * SectionDivider
 *
 * Renders a labelled horizontal rule used to separate page sections.
 * When `title` is provided it appears before the `label` on the same
 * line, separated by an em-dash, giving a unified page-title + section
 * header in one row.
 *
 * Usage:
 *   <SectionDivider title="Installations" label="Management Overview" accent="var(--navy)" />
 *   <SectionDivider label="Field" accent="var(--orange)" />
 */
export default function SectionDivider({ label, title, accent = 'var(--text-3)' }) {
  return (
    <div className="section-divider">
      {title && (
        <>
          <span className="section-divider-title">{title}</span>
          <span className="section-divider-sep">—</span>
        </>
      )}
      <span className="section-divider-label" style={{ color: accent }}>{label}</span>
      <div className="section-divider-line" />
    </div>
  )
}
