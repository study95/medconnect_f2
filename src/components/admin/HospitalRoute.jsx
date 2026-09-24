// HospitalRoute.jsx — Route guard for Hospital Portal
// Only allows hospital managers (and super-admin) to access /hospital/* pages
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function HospitalRoute({ children }) {
  const { isLoggedIn, isManager, isAdmin, isDoctor, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="admin-spinner" />
      </div>
    )
  }

  if (!isLoggedIn) {
    return <Navigate to="/login/hospital" state={{ from: location }} replace />
  }

  // Hospital Manager or Super Admin is allowed into Hospital portal
  if (isManager || isAdmin) {
    return children
  }

  // If a doctor tries to access /hospital/*, redirect them to /doctor
  if (isDoctor) {
    return <Navigate to="/doctor" replace />
  }

  // General patient or unauthorized role
  return <Navigate to="/" replace />
}
