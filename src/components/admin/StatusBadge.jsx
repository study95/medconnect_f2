// StatusBadge.jsx — Appointment status badge with color coding
export default function StatusBadge({ status }) {
  const statusMap = {
    pending: { label: 'Pending', icon: '⏳' },
    confirmed: { label: 'Confirmed', icon: '✅' },
    completed: { label: 'Completed', icon: '✔️' },
    cancelled: { label: 'Cancelled', icon: '❌' },
  }

  const info = statusMap[status] || { label: status, icon: '❓' }

  return (
    <span className={`status-badge status-${status}`}>
      {info.icon} {info.label}
    </span>
  )
}
