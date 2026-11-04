// DoctorRoute.jsx — Route guard for Doctor Portal
// Only allows doctors (and super-admin) to access /doctor/* pages
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function DoctorRoute({ children }) {
  const { isLoggedIn, isDoctor, isAdmin, isManager, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="admin-spinner" />
      </div>
    )
  }

  if (!isLoggedIn) {
    return <Navigate to="/login/doctor" state={{ from: location }} replace />
  }

  // Strictly allow only Doctors and Super Admins into the Doctor Portal
  if (isDoctor || isAdmin) {
    return children
  }

  // Redirect Hospital Managers cleanly to their own Hospital Portal
  if (isManager) {
    return <Navigate to="/hospital" replace />
  }

  // General patient or unauthorized role
  return <Navigate to="/" replace />
}
