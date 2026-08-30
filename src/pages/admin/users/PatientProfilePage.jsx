// PatientProfilePage.jsx — Premium Patient Profile & Clinical History
import { useState, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getPrescription } from '../../../api/adminApi'
import { useAdminPatientDetail } from '../../../features/patients/useAdminPatients'
import { useAuth } from '../../../context/AuthContext'
import StatusBadge from '../../../components/admin/StatusBadge'
import { calculateAge } from '../../../utils/dateUtils'
import PrescriptionPaper from '../../../components/common/PrescriptionPaper'
// html2canvas and jsPDF are dynamically imported inside handleDownloadPrescription()
// to avoid adding ~600KB to the PatientProfilePage chunk
import '../../../styles/prescription.css'

export default function PatientProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isManager, isDoctor, isAdmin } = useAuth()
  const { patient, appointments, prescriptions, isLoading: loading } = useAdminPatientDetail(id, { isManager })
  const [activeSection, setActiveSection] = useState('appointments')
  const [exportingId, setExportingId] = useState(null)
  const [exportingRx, setExportingRx] = useState(null)
  const silentPaperRef = useRef(null)

  const handleDownloadPrescription = async (rxId) => {
    if (exportingId) return
    setExportingId(rxId)
    try {
      const res = await getPrescription(rxId)
      const rxData = res.data?.data || res.data
      if (rxData.doctor_signature) {
        try {
          const imgRes = await fetch(rxData.doctor_signature)
          const blob = await imgRes.blob()
          const base64 = await new Promise((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result)
            reader.readAsDataURL(blob)
          })
          rxData.doctor_signature = base64
        } catch (e) { console.warn('Signature fetch failed', e) }
      }
      setExportingRx(rxData)
      setTimeout(async () => {
        if (!silentPaperRef.current) return
        // Dynamic imports: only load when user clicks Download
        const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
          import('html2canvas'),
          import('jspdf'),
        ])
        const canvas = await html2canvas(silentPaperRef.current, { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' })
        const pdf = new jsPDF('p', 'mm', 'a4')
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 210, 297)
        pdf.save(`Prescription_${rxId}.pdf`)
        setExportingId(null)
        setExportingRx(null)
      }, 500)
    } catch (err) {
      setExportingId(null)
      setExportingRx(null)
    }
  }

  if (loading) return <div className="admin-loading"><div className="admin-spinner" /> Loading Patient History...</div>
  
  if (!patient) {
    return (
      <div className="admin-container" style={{ maxWidth: 600, margin: '60px auto', textAlign: 'center' }}>
        <div className="admin-card" style={{ padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>👤</div>
          <h3 style={{ color: 'var(--admin-text)', marginBottom: 8 }}>Patient Record Not Found</h3>
          <p style={{ color: 'var(--admin-text-muted)', marginBottom: 24 }}>The requested patient information could not be found.</p>
          <button onClick={() => navigate('/admin/patients')} className="admin-btn admin-btn-primary">
            ← Back to Patients
          </button>
        </div>
      </div>
    )
  }

  const name = patient.name || patient.user?.name || 'Unknown Patient'
  const email = patient.email || patient.user?.email || '—'
  const phone = patient.phone || patient.mobile || patient.user?.phone || '—'
  const regNumber = patient.registration_number || patient.user?.registration_number || patient.id
  const gender = patient.gender || patient.patient?.gender || 'N/A'
  const bloodGroup = patient.blood_group || patient.patient?.blood_group || 'Unknown'
  const dob = patient.date_of_birth || patient.patient?.date_of_birth
  const calculatedAge = dob ? calculateAge(dob).display : (patient.age ? `${patient.age} Years` : '—')
  const occupation = patient.occupation || patient.patient?.occupation || '—'
  const photo = patient.profile_pic || patient.photo || patient.user?.photo || null
  const addressParts = [
    patient.union?.name || patient.patient?.union?.name,
    patient.upazila?.name || patient.patient?.upazila?.name,
    patient.district?.name || patient.patient?.district?.name,
    patient.division?.name || patient.patient?.division?.name
  ].filter(Boolean)
  const fullAddress = addressParts.length > 0 ? addressParts.join(', ') : '—'
  const joinedDate = patient.created_at || patient.user?.created_at ? new Date(patient.created_at || patient.user?.created_at).toLocaleDateString() : 'N/A'
  const height = patient.height || patient.patient?.height || '—'
  const weight = patient.weight || patient.patient?.weight || '—'
  const allergies = patient.allergies || patient.patient?.allergies || null

  return (
    <div className="admin-container" style={{ maxWidth: 1200, margin: '0 auto', animation: 'fadeIn 0.5s ease-out', paddingBottom: 60 }}>
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title" style={{ color: 'var(--admin-text)' }}>
            <span style={{ marginRight: 12 }}>👤</span>
            Patient Profile
          </h2>
          <p className="admin-page-subtitle" style={{ color: 'var(--admin-text-muted)' }}>
            Registration: <span style={{ fontWeight: 800, color: 'var(--admin-text)' }}>#{regNumber}</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => navigate(-1)} className="admin-btn admin-btn-outline" style={{ borderRadius: 12 }}>← Back</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: 32, alignItems: 'flex-start' }}>

        {/* Left: Identity Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, position: 'sticky', top: 100 }}>
          <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ height: 100, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }} />
            <div style={{ marginTop: -40, padding: '0 24px 32px', textAlign: 'center', position: 'relative', zIndex: 10 }}>
              <div style={{
                width: 80, height: 80, borderRadius: 24, background: 'var(--admin-card-bg)', margin: '0 auto',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', border: '4px solid var(--admin-card-bg)', fontSize: 32, fontWeight: 900, color: '#6366F1',
                position: 'relative', zIndex: 20, overflow: 'hidden'
              }}>
                {photo ? (
                  <img src={photo} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  name?.charAt(0)?.toUpperCase() || 'P'
                )}
              </div>
              <h3 style={{ marginTop: 16, fontWeight: 800, color: 'var(--admin-text)', fontSize: 20 }}>{name}</h3>
              <p style={{ fontSize: 13, color: 'var(--admin-text-muted)', marginBottom: 24 }}>Registered Patient</p>

              <div style={{ display: 'grid', gridTemplateColumns: !isManager ? '1fr 1fr' : '1fr', gap: 12, marginBottom: 24 }}>
                <div style={{ background: 'rgba(99, 102, 241, 0.05)', padding: '16px 12px', borderRadius: 16, border: '1px solid rgba(99, 102, 241, 0.1)' }}>
                  <div style={{ fontWeight: 800, color: '#6366F1', fontSize: 20 }}>{appointments.length}</div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#6366F1', textTransform: 'uppercase', marginTop: 2 }}>Visits</div>
                </div>
                {!isManager && (
                  <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '16px 12px', borderRadius: 16, border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                    <div style={{ fontWeight: 800, color: '#10B981', fontSize: 20 }}>{prescriptions.length}</div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#10B981', textTransform: 'uppercase', marginTop: 2 }}>Rx</div>
                  </div>
                )}
              </div>

              <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 16, borderTop: '1px solid var(--admin-border)' }}>
                <InfoItem label="Email Address" value={email} icon="✉️" />
                <InfoItem label="Primary Phone" value={phone} icon="📞" />
                <InfoItem label="Occupation" value={occupation} icon="💼" />
                <InfoItem label="Location" value={fullAddress} icon="📍" />
                <InfoItem label="Joined Platform" value={joinedDate} icon="🗓️" />
              </div>
            </div>
          </div>

          <div className="admin-card" style={{ background: 'rgba(249, 115, 22, 0.03)', border: '1px solid rgba(249, 115, 22, 0.2)' }}>
            <div className="admin-card-header" style={{ borderBottom: '1px solid rgba(249, 115, 22, 0.1)' }}>
              <h3 className="admin-card-title" style={{ color: '#F97316' }}>🩺 Clinical Summary</h3>
            </div>
            <div className="admin-card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <VitalItem label="Blood Group" value={bloodGroup} icon="🩸" color="#EF4444" />
                <VitalItem label="Gender" value={gender} icon="👤" color="#3B82F6" />
                <VitalItem label="Age / DOB" value={calculatedAge} icon="🎂" color="#8B5CF6" />
                <VitalItem label="Weight" value={weight} icon="⚖️" color="#F59E0B" />
              </div>
              {allergies && (
                <div style={{ marginTop: 20, padding: 12, background: 'rgba(249, 115, 22, 0.05)', borderRadius: 12, border: '1px dashed #F97316' }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#F97316', textTransform: 'uppercase' }}>Allergies / Risks</span>
                  <p style={{ margin: '4px 0 0', fontSize: 13, fontWeight: 700, color: 'var(--admin-text)' }}>{allergies}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: History Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Section Navigation */}
          <div style={{ display: 'flex', gap: 12, background: 'var(--admin-card-bg)', padding: 8, borderRadius: 16, border: '1px solid var(--admin-border)' }}>
            <button
              onClick={() => setActiveSection('appointments')}
              style={{
                flex: 1, padding: '12px', borderRadius: 12, border: 'none', fontWeight: 800, fontSize: 14, cursor: 'pointer',
                background: activeSection === 'appointments' ? '#6366F1' : 'transparent',
                color: activeSection === 'appointments' ? 'white' : 'var(--admin-text-muted)',
                transition: 'all 0.2s'
              }}
            >
              📅 Appointment History ({appointments.length})
            </button>
            {!isManager && (
              <button
                onClick={() => setActiveSection('prescriptions')}
                style={{
                  flex: 1, padding: '12px', borderRadius: 12, border: 'none', fontWeight: 800, fontSize: 14, cursor: 'pointer',
                  background: activeSection === 'prescriptions' ? '#6366F1' : 'transparent',
                  color: activeSection === 'prescriptions' ? 'white' : 'var(--admin-text-muted)',
                  transition: 'all 0.2s'
                }}
              >
                📋 Medical Prescriptions ({prescriptions.length})
              </button>
            )}
          </div>

          <div className="admin-card">
            <div className="admin-card-body" style={{ padding: activeSection === 'appointments' ? 0 : 24 }}>

              {activeSection === 'appointments' && (
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th style={{ paddingLeft: 24, color: 'var(--admin-text-muted)' }}>Date</th>
                        <th style={{ color: 'var(--admin-text-muted)' }}>Doctor</th>
                        <th style={{ color: 'var(--admin-text-muted)' }}>Venue</th>
                        <th style={{ color: 'var(--admin-text-muted)' }}>Status</th>
                        <th style={{ textAlign: 'right', paddingRight: 24, color: 'var(--admin-text-muted)' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointments.length === 0 ? (
                        <tr><td colSpan="5" style={{ textAlign: 'center', padding: 40, color: 'var(--admin-text-muted)' }}>No appointment history found for this patient.</td></tr>
                      ) : (
                        appointments.map(a => (
                          <tr key={a.id}>
                            <td style={{ paddingLeft: 24 }}>
                              <div style={{ fontWeight: 700, color: 'var(--admin-text)' }}>{a.date || a.appointment_date ? new Date(a.date || a.appointment_date).toLocaleDateString() : '—'}</div>
                              <div style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>{a.time || a.appointment_time}</div>
                            </td>
                            <td>
                              <div style={{ fontWeight: 600, color: 'var(--admin-primary)' }}>{a.doctor_name || a.doctor?.name || '—'}</div>
                            </td>
                            <td>
                              <div style={{ fontSize: 13, color: 'var(--admin-text)' }}>{a.hospital_name || a.hospital?.name || a.chamber?.hospital?.name || 'Clinic'}</div>
                            </td>
                            <td><StatusBadge status={a.status} /></td>
                            <td style={{ textAlign: 'right', paddingRight: 24 }}>
                              <Link to={`/admin/appointments/view/${a.id}`} className="admin-btn admin-btn-outline admin-btn-sm" style={{ borderRadius: 8 }}>👁️ View</Link>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {!isManager && activeSection === 'prescriptions' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {prescriptions.length === 0 ? (
                    <div style={{ padding: 40, textAlign: 'center', color: 'var(--admin-text-muted)' }}>No clinical prescriptions recorded.</div>
                  ) : (
                    prescriptions.map((rx) => (
                      <div key={rx.id} style={{
                        padding: 24, background: 'rgba(0,0,0,0.02)', borderRadius: 20, border: '1px solid var(--admin-border)',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                      }}>
                        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📄</div>
                          <div>
                            <div style={{ fontWeight: 800, color: 'var(--admin-text)', fontSize: 15 }}>{rx.diagnosis || 'General Prescription'}</div>
                            <div style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>By {rx.doctor_name || rx.doctor?.name || 'Doctor'} • {rx.created_at ? new Date(rx.created_at).toLocaleDateString() : '—'}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                          <Link to={`/admin/prescriptions/view/${rx.id}`} className="admin-btn admin-btn-outline admin-btn-sm" style={{ borderRadius: 8 }}>👁️ View</Link>
                          <button
                            onClick={() => handleDownloadPrescription(rx.id)}
                            disabled={exportingId === rx.id}
                            className="admin-btn admin-btn-primary admin-btn-sm"
                            style={{ borderRadius: 8, background: '#6366F1' }}
                          >
                            {exportingId === rx.id ? '⌛...' : '📥 PDF'}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

            </div>
          </div>
        </div>

      </div>

      {/* Hidden PDF Engine */}
      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', width: '210mm' }}>
        {exportingRx && <PrescriptionPaper ref={silentPaperRef} prescription={exportingRx} />}
      </div>
      <style dangerouslySetInnerHTML={{ __html: `@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }` }} />
    </div>
  )
}

function InfoItem({ label, value, icon }) {
  if (!value || value === '—') return null
  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
      <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(0,0,0,0.03)', border: '1px solid var(--admin-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16 }}>{icon}</div>
      <div style={{ minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--admin-text)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</p>
      </div>
    </div>
  )
}

function VitalItem({ label, value, icon, color }) {
  return (
    <div style={{ padding: '14px 12px', background: 'var(--admin-card-bg)', borderRadius: 14, border: '1px solid var(--admin-border)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 14 }}>{icon}</span>
        <span style={{ fontSize: 9, fontWeight: 900, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      </div>
      <div style={{ fontWeight: 900, fontSize: 15, color: value !== 'Unknown' && value !== '—' && value !== 'N/A' ? 'var(--admin-text)' : 'var(--admin-text-muted)' }}>{value}</div>
    </div>
  )
}
