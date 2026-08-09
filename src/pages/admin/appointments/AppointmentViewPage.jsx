// AppointmentViewPage.jsx — Premium Detailed Appointment View
import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getAppointment, updateAppointment } from '../../../api/adminApi'
import { useAuth } from '../../../context/AuthContext'
import StatusBadge from '../../../components/admin/StatusBadge'

export default function AppointmentViewPage() {
  const { id } = useParams()
  const { isAdmin, isDoctor } = useAuth()
  const navigate = useNavigate()
  const [appt, setAppt] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchAppointment()
  }, [id])

  const fetchAppointment = async () => {
    try {
      setLoading(true)
      const res = await getAppointment(id)
      setAppt(res.data?.data || res.data)
    } catch (err) {
      
      navigate('/admin/appointments')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (newStatus) => {
    try {
      setUpdating(true)
      await updateAppointment(id, { status: newStatus })
      setAppt(prev => ({ ...prev, status: newStatus }))
      
    } catch (err) {
      
    } finally {
      setUpdating(false)
    }
  }

  if (loading) return <div className="admin-loading"><div className="admin-spinner" /> Loading Details...</div>
  if (!appt) return <div className="admin-empty">Appointment not found.</div>

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', animation: 'fadeIn 0.5s ease-out', paddingBottom: 40 }}>
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title" style={{ color: 'var(--admin-text)' }}>
            <span style={{ marginRight: 12 }}>📅</span>
            Appointment Detail
          </h2>
          <p className="admin-page-subtitle" style={{ color: 'var(--admin-text-muted)' }}>Registration ID: <span style={{ fontWeight: 800, color: 'var(--admin-text)' }}>#{appt.registration_id || appt.id}</span></p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link to="/admin/appointments" className="admin-btn admin-btn-outline" style={{ borderRadius: 12 }}>← List</Link>
          <Link to={`/admin/appointments/edit/${appt.id}`} className="admin-btn admin-btn-outline" style={{ borderRadius: 12 }}>✏️ Edit</Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24 }}>
        
        {/* Left Column: Core Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Status & Actions Card */}
          <div className="admin-card" style={{ borderTop: '4px solid #10B981' }}>
            <div className="admin-card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Status</span>
                <div style={{ marginTop: 8 }}><StatusBadge status={appt.status} /></div>
              </div>
              
              {(isAdmin || isDoctor) && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button 
                    disabled={updating || appt.status === 'confirmed'} 
                    onClick={() => handleStatusUpdate('confirmed')}
                    className="admin-btn admin-btn-sm" 
                    style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.2)', borderRadius: 8, fontWeight: 700 }}
                  >
                    Confirm
                  </button>
                  <button 
                    disabled={updating || appt.status === 'completed'} 
                    onClick={() => handleStatusUpdate('completed')}
                    className="admin-btn admin-btn-sm" 
                    style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderColor: 'rgba(59, 130, 246, 0.2)', borderRadius: 8, fontWeight: 700 }}
                  >
                    Complete
                  </button>
                  <button 
                    disabled={updating || appt.status === 'cancelled'} 
                    onClick={() => handleStatusUpdate('cancelled')}
                    className="admin-btn admin-btn-sm" 
                    style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)', borderRadius: 8, fontWeight: 700 }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Schedule Details */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h3 className="admin-card-title">📅 Consultation Schedule</h3>
            </div>
            <div className="admin-card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--admin-text-muted)', textTransform: 'uppercase' }}>Visit Date</label>
                  <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--admin-text)', margin: '4px 0' }}>
                    {appt.date ? new Date(appt.date).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                  </p>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--admin-text-muted)', textTransform: 'uppercase' }}>Arrival Time</label>
                  <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--admin-text)', margin: '4px 0' }}>{appt.time || '—'}</p>
                </div>
              </div>

              <div style={{ marginTop: 32, padding: '20px', background: 'var(--admin-bg)', borderRadius: 16, border: '1px solid var(--admin-border)' }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--admin-text-muted)', textTransform: 'uppercase' }}>Venue / Hospital</label>
                <h4 style={{ fontWeight: 800, color: 'var(--admin-text)', margin: '6px 0 2px' }}>{appt.hospital_name || 'General Facility'}</h4>
                <p style={{ fontSize: 13, color: 'var(--admin-text-muted)' }}>{appt.chamber_id ? 'Doctor Specialized Chamber' : 'Outpatient Department'}</p>
              </div>
            </div>
          </div>

          {/* Patient Notes */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h3 className="admin-card-title">📝 Clinical Notes & Symptoms</h3>
            </div>
            <div className="admin-card-body">
              <div style={{ minHeight: 100, padding: 20, background: 'rgba(245, 158, 11, 0.05)', borderRadius: 16, color: 'var(--admin-warning)', fontSize: 15, lineHeight: 1.6, border: '1px solid rgba(245, 158, 11, 0.1)' }}>
                {appt.notes || 'No specific clinical notes provided for this visit.'}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Entity Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Patient Profile */}
          <div className="admin-card" style={{ overflow: 'hidden' }}>
            <div style={{ height: 60, background: 'linear-gradient(135deg, var(--admin-primary), #00C9A7)' }} />
            <div className="admin-card-body" style={{ marginTop: -40, textAlign: 'center' }}>
              <Link to={`/admin/users/${appt.user_id}`} style={{ textDecoration: 'none', display: 'block' }}>
                <div style={{ width: 80, height: 80, borderRadius: 24, background: 'var(--admin-card-bg)', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 900, color: 'var(--admin-primary)', boxShadow: 'var(--admin-shadow-lg)', border: '4px solid var(--admin-card-bg)' }}>
                  {appt.user_name?.charAt(0)?.toUpperCase() || 'P'}
                </div>
                <h4 style={{ fontWeight: 800, color: 'var(--admin-text)', fontSize: 18, marginTop: 16, marginBottom: 4 }}>{appt.user_name}</h4>
              </Link>
              <p style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginBottom: 20 }}>Patient Identity Profile</p>
              
              <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '8px 0', borderBottom: '1px solid var(--admin-border)' }}>
                  <span style={{ color: 'var(--admin-text-muted)', fontWeight: 600 }}>Email</span>
                  <span style={{ fontWeight: 700, color: 'var(--admin-text)' }}>{appt.user_email || '—'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '8px 0', borderBottom: '1px solid var(--admin-border)' }}>
                  <span style={{ color: 'var(--admin-text-muted)', fontWeight: 600 }}>Registration</span>
                  <span style={{ fontWeight: 700, color: 'var(--admin-text)' }}>#{appt.user_id}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Doctor Profile */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h3 className="admin-card-title">👨‍⚕️ Attending Doctor</h3>
            </div>
            <div className="admin-card-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                <div style={{ width: 50, height: 50, borderRadius: 12, background: 'rgba(0, 168, 140, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🩺</div>
                <div>
                  <h4 style={{ fontWeight: 800, color: 'var(--admin-text)', fontSize: 15, marginBottom: 2 }}>{appt.doctor_name}</h4>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-primary)', textTransform: 'uppercase' }}>Medical Specialist</span>
                </div>
              </div>
              <Link to={`/admin/doctors/view/${appt.doctor_id}`} className="admin-btn admin-btn-outline admin-btn-sm" style={{ width: '100%', borderRadius: 10 }}>View Full Profile</Link>
            </div>
          </div>

          {/* Booking Economics */}
          {isAdmin && (
            <div className="admin-card" style={{ background: 'var(--admin-bg)' }}>
              <div className="admin-card-header">
                <h3 className="admin-card-title">💰 Economic Summary</h3>
              </div>
              <div className="admin-card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 13, color: 'var(--admin-text-muted)' }}>Total Amount</span>
                  <span style={{ fontSize: 16, fontWeight: 900, color: 'var(--admin-text)' }}>৳{appt.amount || '0'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                  <span style={{ fontSize: 13, color: 'var(--admin-text-muted)' }}>Platform Fee</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--admin-primary)' }}>৳{appt.commission_amount || '0'} ({appt.commission_rate || 0}%)</span>
                </div>
                <div style={{ padding: '12px', background: 'var(--admin-card-bg)', borderRadius: 12, border: '1px dashed var(--admin-border)', fontSize: 12, color: 'var(--admin-text-muted)' }}>
                  Booking Source: <strong>{appt.created_via?.replace('_', ' ')}</strong> via <strong>{appt.created_by_name || 'System'}</strong>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          {(isDoctor || isAdmin) && (
            <button 
              onClick={() => navigate(appt.prescription_id ? `/admin/prescriptions/view/${appt.prescription_id}` : `/admin/prescriptions/create?appointment_id=${appt.id}`)}
              className="admin-btn admin-btn-primary" 
              style={{ padding: '16px', borderRadius: 16, fontWeight: 800, fontSize: 15, background: 'var(--admin-primary)', boxShadow: 'var(--admin-shadow-lg)' }}
            >
              {appt.prescription_id ? '👁️ View Prescription' : '✍️ Write Prescription'}
            </button>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  )
}
