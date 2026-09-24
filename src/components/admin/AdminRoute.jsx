// AdminRoute.jsx — Route guard for Super Admin panel
// Only allows admin and super-admin roles to access /admin/* pages
// Smartly redirects doctors to /doctor/* and hospitals to /hospital/* for 100% backward compatibility
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function AdminRoute({ children }) {
  const { isLoggedIn, isAdmin, isDoctor, isManager, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="admin-spinner" />
      </div>
    )
  }

  if (!isLoggedIn) {
    return <Navigate to="/admin-secure-access" state={{ from: location }} replace />
  }

  // Super Admin has full access
  if (isAdmin) {
    return children
  }

  // 100% Backward compatibility: If a doctor hits /admin/*, redirect to /doctor/*
  if (isDoctor) {
    if (location.pathname === '/admin/doctors' || location.pathname === '/admin/doctors/') {
      return <Navigate to="/doctor/my-profile" replace />
    }
    if (location.pathname.startsWith('/admin/doctors/edit/')) {
      const id = location.pathname.replace('/admin/doctors/edit/', '')
      return <Navigate to={`/doctor/my-profile/edit/${id}${location.search}`} replace />
    }
    const doctorPath = location.pathname.replace(/^\/admin/, '/doctor')
    return <Navigate to={`${doctorPath}${location.search}`} replace />
  }

  // 100% Backward compatibility: If a hospital manager hits /admin/*, redirect to /hospital/*
  if (isManager) {
    if (location.pathname === '/admin/hospitals' || location.pathname === '/admin/hospitals/') {
      return <Navigate to="/hospital/my-hospital" replace />
    }
    if (location.pathname.startsWith('/admin/hospitals/edit/')) {
      const id = location.pathname.replace('/admin/hospitals/edit/', '')
      return <Navigate to={`/hospital/my-hospital/edit/${id}${location.search}`} replace />
    }
    const hospitalPath = location.pathname.replace(/^\/admin/, '/hospital')
    return <Navigate to={`${hospitalPath}${location.search}`} replace />
  }

  // Unauthorized users / general patients
  return <Navigate to="/" replace />
}
