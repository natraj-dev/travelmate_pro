const MAP = {
  PENDING: 'badge-warning',
  CONFIRMED: 'badge-success',
  CANCELLED: 'badge-danger',
  COMPLETED: 'badge-info',
  APPROVED: 'badge-success',
  REJECTED: 'badge-danger',
  SUCCEEDED: 'badge-success',
  FAILED: 'badge-danger',
  REFUNDED: 'badge-info',
  PARTIALLY_REFUNDED: 'badge-info',
  REQUESTED: 'badge-warning',
  PROCESSED: 'badge-success',
  OPEN: 'badge-warning',
  IN_PROGRESS: 'badge-info',
  RESOLVED: 'badge-success',
  CLOSED: 'badge-neutral',
  ACTIVE: 'badge-success',
  NEW: 'badge-info',
  CONTACTED: 'badge-warning',
  QUALIFIED: 'badge-warning',
  CONVERTED: 'badge-success',
  LOST: 'badge-danger',
}

export default function StatusBadge({ status }) {
  const cls = MAP[status] || 'badge-neutral'
  return <span className={cls}>{status?.replace(/_/g, ' ')}</span>
}
