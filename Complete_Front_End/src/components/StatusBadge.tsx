import { AlertCircle, CheckCircle2, Circle } from 'lucide-react'
import type { PaymentStatus, ShopStatus } from '../types'

interface StatusBadgeProps {
  status: ShopStatus | PaymentStatus
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = {
    Occupied: { className: 'pill pill-success', icon: CheckCircle2 },
    Vacant: { className: 'pill pill-warning', icon: Circle },
    Paid: { className: 'pill pill-success', icon: CheckCircle2 },
    Due: { className: 'pill pill-warning', icon: AlertCircle },
    Overdue: { className: 'pill pill-danger', icon: AlertCircle },
  }[status]

  const Icon = config.icon

  return (
    <span className={config.className}>
      <Icon aria-hidden="true" size={12} />
      {status}
    </span>
  )
}
