// AdminRoute.jsx — Route guard for admin panel
// Only allows admin, doctor, and manager roles to access /admin/* pages
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function AdminRoute({ children }) {
  const { isLoggedIn, isStaff, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="admin-spinner" />
      </div>
    )
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />
  }

  if (!isStaff) {
    return <Navigate to="/" replace />
  }

  return children
}
