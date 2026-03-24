export const STAGES = [
  { key: 'Awarded',          color: '#0047BA', dot: '#0047BA' },
  { key: 'Scheduled',        color: '#F59E0B', dot: '#F59E0B' },
  { key: 'In Progress',      color: '#F97316', dot: '#F97316' },
  { key: 'Pending Review',   color: '#F5333F', dot: '#F5333F' },
  { key: 'Pending Customer', color: '#7C3AED', dot: '#7C3AED' },
  { key: 'Customer Signed',  color: '#10B981', dot: '#10B981' },
  { key: 'Complete',         color: '#047857', dot: '#047857' },
  { key: 'On Hold',          color: '#9CA3AF', dot: '#9CA3AF' },
  { key: 'Cancelled',        color: '#D1D5DB', dot: '#D1D5DB' },
]

export const stageBadgeClass = (stage) => ({
  'Awarded':          'badge-awarded',
  'Scheduled':        'badge-scheduled',
  'In Progress':      'badge-inprogress',
  'Pending Review':   'badge-review',
  'Pending Customer': 'badge-customer',
  'Customer Signed':  'badge-signed',
  'Complete':         'badge-complete',
  'On Hold':          'badge-hold',
  'Cancelled':        'badge-cancelled',
}[stage] || 'badge-hold')

export const stageColor = (stage) =>
  STAGES.find(s => s.key === stage)?.color || '#9CA3AF'
