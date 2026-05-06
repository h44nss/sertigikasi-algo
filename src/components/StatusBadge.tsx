import React from 'react'
import type { RegistrationStatus } from '../types'
import { Clock, CheckCircle, XCircle } from 'lucide-react'

interface StatusBadgeProps {
  status: RegistrationStatus
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  if (status === 'approved') {
    return (
      <span className="badge-approved">
        <CheckCircle className="w-3 h-3" />
        Disetujui
      </span>
    )
  }
  if (status === 'rejected') {
    return (
      <span className="badge-rejected">
        <XCircle className="w-3 h-3" />
        Ditolak
      </span>
    )
  }
  return (
    <span className="badge-pending">
      <Clock className="w-3 h-3" />
      Menunggu
    </span>
  )
}

export default StatusBadge
