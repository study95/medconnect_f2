// PatientProfilePage.jsx — Premium Patient Profile & Clinical History
import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getUser, getAppointments, getPrescriptions, getPrescription } from '../../../api/adminApi'
import { useAuth } from '../../../context/AuthContext'
import StatusBadge from '../../../components/admin/StatusBadge'
import { toast } from 'react-toastify'
import { getErrorMessage } from '../../../utils/errorHelper'
import PrescriptionPaper from '../../../components/common/PrescriptionPaper'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import '../../../styles/prescription.css'

export default function PatientProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isDoctorOnly } = useAuth()
  const [patient, setPatient] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('prescriptions')
  const [exportingId, setExportingId] = useState(null)
  const [exportingRx, setExportingRx] = useState(null)
  const silentPaperRef = useRef(null)

  useEffect(() => { loadData() }, [id])

  const loadData = async () => {
    setLoading(true)
    try {
      const [userRes, apptRes, pressRes] = await Promise.all([
        getUser(id),
        getAppointments({ user_id: id }),
        getPrescriptions({ patient_id: id })
      ])

      setPatient(userRes.data?.data || userRes.data)
      setAppointments(apptRes.data?.data?.data || apptRes.data?.data || [])
      setPrescriptions(pressRes.data?.data?.data || pressRes.data?.data || [])
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load patient record'))
      navigate('/admin/users')
    } finally {
      setLoading(false)
    }
  }

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
        const canvas = await html2canvas(silentPaperRef.current, { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' })
        const pdf = new jsPDF('p', 'mm', 'a4')
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 210, 297)
        pdf.save(`Prescription_${rxId}.pdf`)
        setExportingId(null); setExportingRx(null)
        toast.success('Prescription downloaded!')
      }, 500)
    } catch (err) {
      toast.error('Export failed'); setExportingId(null); setExportingRx(null)
    }
  }

  if (loading) return <div className="admin-loading"><div className="admin-spinner" /> Syncing Patient History...</div>
  if (!patient) return <div className="admin-empty" style={{ color: 'var(--admin-text)' }}>Patient record not found</div>

  return (
    <div className="admin-container" style={{ maxWidth: 1200, margin: '0 auto', animation: 'fadeIn 0.5s ease-out', paddingBottom: 60 }}>
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title" style={{ color: 'var(--admin-text)' }}>
            <span style={{ marginRight: 12 }}>👤</span>
            Patient Profile
          </h2>
          <p className="admin-page-subtitle" style={{ color: 'var(--admin-text-muted)' }}>
            Registration: <span style={{ fontWeight: 800, color: 'var(--admin-text)' }}>#{patient.registration_number || patient.id}</span>
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
                position: 'relative', zIndex: 20
              }}>
                {patient.name?.charAt(0)?.toUpperCase()}
              </div>
              <h3 style={{ marginTop: 16, fontWeight: 800, color: 'var(--admin-text)', fontSize: 20 }}>{patient.name}</h3>
              <p style={{ fontSize: 13, color: 'var(--admin-text-muted)', marginBottom: 24 }}>Official Patient Account</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                <div style={{ background: 'rgba(99, 102, 241, 0.05)', padding: '16px 12px', borderRadius: 16, border: '1px solid rgba(99, 102, 241, 0.1)' }}>
                  <div style={{ fontWeight: 800, color: '#6366F1', fontSize: 20 }}>{appointments.length}</div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#6366F1', textTransform: 'uppercase', marginTop: 2 }}>Visits</div>
                </div>
                <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '16px 12px', borderRadius: 16, border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                  <div style={{ fontWeight: 800, color: '#10B981', fontSize: 20 }}>{prescriptions.length}</div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#10B981', textTransform: 'uppercase', marginTop: 2 }}>Rx</div>
                </div>
              </div>

              <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 16, borderTop: '1px solid var(--admin-border)' }}>
                <InfoItem label="Email Address" value={patient.email} icon="✉️" />
                <InfoItem label="Primary Phone" value={patient.phone} icon="📞" />
                <InfoItem label="Joined Platform" value={patient.created_at ? new Date(patient.created_at).toLocaleDateString() : 'N/A'} icon="🗓️" />
              </div>
            </div>
          </div>

          <div className="admin-card" style={{ background: 'rgba(249, 115, 22, 0.03)', border: '1px solid rgba(249, 115, 22, 0.2)' }}>
            <div className="admin-card-header" style={{ borderBottom: '1px solid rgba(249, 115, 22, 0.1)' }}>
              <h3 className="admin-card-title" style={{ color: '#F97316' }}>🩺 Clinical Summary</h3>
            </div>
            <div className="admin-card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <VitalItem label="Blood Group" value={patient.patient?.blood_group || 'Unknown'} icon="🩸" color="#EF4444" />
                <VitalItem label="Gender" value={patient.patient?.gender || 'N/A'} icon="👤" color="#3B82F6" />
                <VitalItem label="Height" value={patient.patient?.height || '—'} icon="📏" color="#10B981" />
                <VitalItem label="Weight" value={patient.patient?.weight || '—'} icon="⚖️" color="#F59E0B" />
              </div>
              {patient.patient?.allergies && (
                <div style={{ marginTop: 20, padding: 12, background: 'rgba(249, 115, 22, 0.05)', borderRadius: 12, border: '1px dashed #F97316' }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#F97316', textTransform: 'uppercase' }}>Allergies / Risks</span>
                  <p style={{ margin: '4px 0 0', fontSize: 13, fontWeight: 700, color: 'var(--admin-text)' }}>{patient.patient.allergies}</p>
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
              onClick={() => setActiveSection('prescriptions')}
              style={{
                flex: 1, padding: '12px', borderRadius: 12, border: 'none', fontWeight: 800, fontSize: 14, cursor: 'pointer',
                background: activeSection === 'prescriptions' ? '#6366F1' : 'transparent',
                color: activeSection === 'prescriptions' ? 'white' : 'var(--admin-text-muted)',
                transition: 'all 0.2s'
              }}
            >
              📋 Medical Prescriptions
            </button>
            <button
              onClick={() => setActiveSection('appointments')}
              style={{
                flex: 1, padding: '12px', borderRadius: 12, border: 'none', fontWeight: 800, fontSize: 14, cursor: 'pointer',
                background: activeSection === 'appointments' ? '#6366F1' : 'transparent',
                color: activeSection === 'appointments' ? 'white' : 'var(--admin-text-muted)',
                transition: 'all 0.2s'
              }}
            >
              📅 Appointment History
            </button>
          </div>

          <div className="admin-card">
            <div className="admin-card-body" style={{ padding: activeSection === 'appointments' ? 0 : 24 }}>

              {activeSection === 'prescriptions' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {prescriptions.length === 0 ? (
                    <div style={{ padding: 40, textAlign: 'center', color: 'var(--admin-text-muted)' }}>No clinical prescriptions recorded.</div>
                  ) : (
                    prescriptions.map((rx, i) => (
                      <div key={rx.id} style={{
                        padding: 24, background: 'rgba(0,0,0,0.02)', borderRadius: 20, border: '1px solid var(--admin-border)',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                      }}>
                        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📄</div>
                          <div>
                            <div style={{ fontWeight: 800, color: 'var(--admin-text)', fontSize: 15 }}>{rx.diagnosis || 'General Prescription'}</div>
                            <div style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>By {rx.doctor_name} • {new Date(rx.created_at).toLocaleDateString()}</div>
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
                        <tr><td colSpan="5" style={{ textAlign: 'center', padding: 40, color: 'var(--admin-text-muted)' }}>No appointment history found.</td></tr>
                      ) : (
                        appointments.map(a => (
                          <tr key={a.id}>
                            <td style={{ paddingLeft: 24 }}>
                              <div style={{ fontWeight: 700, color: 'var(--admin-text)' }}>{new Date(a.date).toLocaleDateString()}</div>
                              <div style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>{a.time}</div>
                            </td>
                            <td>
                              <div style={{ fontWeight: 600, color: 'var(--admin-primary)' }}>{a.doctor_name}</div>
                            </td>
                            <td>
                              <div style={{ fontSize: 13, color: 'var(--admin-text)' }}>{a.hospital_name || 'Clinic'}</div>
                            </td>
                            <td><StatusBadge status={a.status} /></td>
                            <td style={{ textAlign: 'right', paddingRight: 24 }}>
                              <Link to={`/admin/appointments/view/${a.id}`} className="admin-btn admin-btn-outline admin-btn-sm" style={{ borderRadius: 8 }}>👁️</Link>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
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
  if (!value) return null
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
      <div style={{ fontWeight: 900, fontSize: 15, color: value !== 'Unknown' && value !== '—' ? 'var(--admin-text)' : 'var(--admin-text-muted)' }}>{value}</div>
    </div>
  )
}
