import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function DashboardRedirect() {
  const { user, isLoggedIn, loading, isAdmin, isDoctor, isManager, isStaff, isPatient } = useAuth()

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  if (!isLoggedIn || !user) {
    return <Navigate to="/login" replace />
  }

  if (isAdmin || isStaff) {
    return <Navigate to="/admin/dashboard" replace />
  }

  if (isDoctor) {
    return <Navigate to="/doctor/dashboard" replace />
  }

  if (isManager) {
    return <Navigate to="/hospital/dashboard" replace />
  }

  if (isPatient) {
    return <Navigate to="/my-appointments" replace />
  }

  return <Navigate to="/" replace />
}
