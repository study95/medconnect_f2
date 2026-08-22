// DoctorDetailPage.jsx — Premium Detailed View for Admin
import { useState, useEffect, useRef } from 'react'
import { getMediaUrl } from '../../../utils/mediaUtils'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getDoctor, getChambers } from '../../../api/adminApi'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export default function DoctorDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const printRef = useRef(null)
  const [doctor, setDoctor] = useState(null)
  const [chambers, setChambers] = useState([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [docRes, chamRes] = await Promise.all([
        getDoctor(id),
        getChambers({ doctor_id: id })
      ])

      const doc = docRes.data?.data || docRes.data
      setDoctor(doc)
      const allChambers = chamRes.data?.data || chamRes.data || []
      const filtered = allChambers.length > 0 ? allChambers : (doc?.chambers || [])
      setChambers(filtered)
    } catch (err) {
      
      navigate('/admin/doctors')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = async () => {
    if (!printRef.current) return
    setExporting(true)
    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const imgProps = pdf.getImageProperties(imgData)
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`Doctor_Profile_${doctor.name?.replace(/\s+/g, '_')}.pdf`)
      
    } catch (err) {
      
    } finally {
      setExporting(false)
    }
  }

  const getExpertise = () => {
    if (!doctor?.expertise) return []
    try {
      return Array.isArray(doctor.expertise) ? doctor.expertise : JSON.parse(doctor.expertise)
    } catch {
      return doctor.expertise ? [doctor.expertise] : []
    }
  }

  if (loading) return <div className="admin-loading"><div className="admin-spinner" /> Loading Practitioner...</div>
  if (!doctor) return <div className="admin-empty" style={{ color: 'var(--admin-text)' }}>Doctor not found</div>

  const expertiseList = getExpertise()

  return (
    <div className="admin-container" style={{ maxWidth: 1100, margin: '0 auto', animation: 'fadeIn 0.5s ease-out', paddingBottom: 60 }}>
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title" style={{ color: 'var(--admin-text)' }}>
            <span style={{ marginRight: 12 }}>👨‍⚕️</span>
            Practitioner Profile
          </h2>
          <p className="admin-page-subtitle" style={{ color: 'var(--admin-text-muted)' }}>Detailed clinical record for Dr. {doctor.name}</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button 
            disabled={exporting} 
            onClick={handleDownloadPDF} 
            className="admin-btn admin-btn-primary" 
            style={{ borderRadius: 12, background: 'var(--admin-primary)', borderColor: 'var(--admin-primary)' }}
          >
            {exporting ? '⌛ Processing...' : '📥 Download PDF'}
          </button>
          <Link to={`/admin/doctors/edit/${id}`} className="admin-btn admin-btn-outline" style={{ borderRadius: 12 }}>✏️ Edit Profile</Link>
          <Link to="/admin/doctors" className="admin-btn admin-btn-outline" style={{ borderRadius: 12 }}>← Back to List</Link>
        </div>
      </div>

      <div ref={printRef} style={{ background: exporting ? '#ffffff' : 'transparent', padding: exporting ? '40px' : '0', borderRadius: exporting ? '20px' : '0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: 28, alignItems: 'flex-start' }}>
        
        {/* Left Column: Doctor Identity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ height: 120, background: 'linear-gradient(135deg, #00A88C, #00C9A7)', position: 'relative' }}>
              {doctor.top_10_doctor && (
                <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(255,255,255,0.2)', color: 'white', padding: '4px 10px', borderRadius: 20, fontSize: 10, fontWeight: 800, backdropFilter: 'blur(4px)' }}>⭐ TOP 10</div>
              )}
            </div>
            <div style={{ marginTop: -50, padding: '0 24px 32px', textAlign: 'center', position: 'relative', zIndex: 10 }}>
              <div style={{
                width: 100, height: 100, borderRadius: 30, background: 'var(--admin-card-bg)', margin: '0 auto',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', border: '4px solid var(--admin-card-bg)', overflow: 'hidden',
                position: 'relative', zIndex: 20
              }}>
                {doctor.photo ? (
                  <img src={getMediaUrl(doctor.photo)} alt="P" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: 40, fontWeight: 900, color: 'var(--admin-primary)' }}>{doctor.name?.charAt(0)}</span>
                )}
              </div>

              <h3 style={{ marginTop: 20, fontWeight: 800, color: 'var(--admin-text)', fontSize: 22 }}>{doctor.name}</h3>
              <p style={{ fontSize: 13, color: 'var(--admin-primary)', fontWeight: 700, marginBottom: 24 }}>{doctor.specialty?.name || 'General Practitioner'}</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                <div style={{ background: 'rgba(0, 168, 140, 0.05)', padding: '12px', borderRadius: 12, border: '1px solid rgba(0, 168, 140, 0.1)' }}>
                  <div style={{ fontWeight: 800, color: 'var(--admin-primary)', fontSize: 18 }}>{doctor.experience || '0'}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase' }}>Years Exp.</div>
                </div>
                <div style={{ background: 'rgba(59, 130, 246, 0.05)', padding: '12px', borderRadius: 12, border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                  <div style={{ fontWeight: 800, color: '#3B82F6', fontSize: 18 }}>{chambers.length}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase' }}>Chambers</div>
                </div>
              </div>

              <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 16, borderTop: '1px solid var(--admin-border)' }}>
                <InfoItem label="BMDC Registration" value={doctor.bmdc} icon="🪪" />
                <InfoItem label="Primary Phone" value={doctor.phone} icon="📞" />
                <InfoItem label="Official Email" value={doctor.email} icon="✉️" />
                <InfoItem label="Gender" value={doctor.gender} icon="👤" />
                <InfoItem label="Telemedicine" value={doctor.available_telemedicine === 'yes' || doctor.available_telemedicine === true ? 'Available' : 'Not Available'} icon="📹" />
                
                <div style={{ marginTop: 8, padding: '16px', background: 'rgba(0,0,0,0.02)', borderRadius: 12, border: '1px solid var(--admin-border)' }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--admin-text-muted)', textTransform: 'uppercase' }}>📍 Clinical Location</span>
                  <p style={{ margin: '4px 0 0', fontSize: 14, fontWeight: 700, color: 'var(--admin-text)' }}>
                    {[doctor.union?.name, doctor.upazila?.name, doctor.district?.name, doctor.division?.name].filter(Boolean).join(', ') || 'Address not specified'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Signature Card */}
          {doctor.signature_photo && (
            <div className="admin-card">
              <div className="admin-card-header"><h3 className="admin-card-title" style={{ color: 'var(--admin-text)' }}>✍️ Official Signature</h3></div>
              <div className="admin-card-body" style={{ background: 'rgba(0,0,0,0.02)', borderRadius: 12, textAlign: 'center' }}>
                <img src={getMediaUrl(doctor.signature_photo)} alt="Signature" style={{ maxHeight: 80, maxWidth: '100%', objectFit: 'contain' }} />
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Clinical Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

          {/* Degree & Professional Info */}
          <div className="admin-card">
            <div className="admin-card-header"><h3 className="admin-card-title" style={{ color: 'var(--admin-text)' }}>🎓 Professional Credentials</h3></div>
            <div className="admin-card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--admin-text-muted)', textTransform: 'uppercase' }}>Academic Degree</span>
                  <p style={{ margin: '4px 0 0', fontWeight: 700, color: 'var(--admin-text)', fontSize: 16 }}>{doctor.degree || '—'}</p>
                </div>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--admin-text-muted)', textTransform: 'uppercase' }}>Workplace</span>
                  <p style={{ margin: '4px 0 0', fontWeight: 700, color: 'var(--admin-text)', fontSize: 16 }}>{doctor.workplace || '—'}</p>
                </div>
              </div>

              {expertiseList.length > 0 && (
                <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--admin-border)' }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--admin-text-muted)', textTransform: 'uppercase' }}>Clinical Expertise</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                    {expertiseList.map((exp, i) => (
                      <span key={i} style={{ background: 'rgba(0, 168, 140, 0.1)', color: 'var(--admin-primary)', padding: '6px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700, border: '1px solid rgba(0, 168, 140, 0.2)' }}>{exp}</span>
                    ))}
                  </div>
                </div>
              )}

              {doctor.bio && (
                <div style={{ marginTop: 24, padding: 20, background: 'rgba(0, 168, 140, 0.03)', borderRadius: 16, borderLeft: '4px solid var(--admin-primary)' }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--admin-text-muted)', textTransform: 'uppercase' }}>Professional Biography</span>
                  <p style={{ margin: '8px 0 0', color: 'var(--admin-text)', lineHeight: 1.7, fontSize: 15 }}>{doctor.bio}</p>
                </div>
              )}
            </div>
          </div>

          {/* Chamber Schedule */}
          <div className="admin-card">
            <div className="admin-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="admin-card-title" style={{ color: 'var(--admin-text)' }}>📅 Chamber Schedule</h3>
              <Link to="/admin/chambers/create" className="admin-btn admin-btn-outline admin-btn-sm" style={{ borderRadius: 8 }}>+ Add Chamber</Link>
            </div>
            <div className="admin-card-body" style={{ padding: 0 }}>
              {chambers.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--admin-text-muted)' }}>No clinical chambers assigned yet.</div>
              ) : (
                <div className="admin-table-wrapper">
                  <table className="admin-table" style={{ border: 'none' }}>
                    <thead>
                      <tr>
                        <th style={{ paddingLeft: 24, color: 'var(--admin-text-muted)' }}>Visiting Day</th>
                        <th style={{ color: 'var(--admin-text-muted)' }}>Hospital / Venue</th>
                        <th style={{ color: 'var(--admin-text-muted)' }}>Time Slot</th>
                        <th style={{ textAlign: 'right', paddingRight: 24, color: 'var(--admin-text-muted)' }}>Fee</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chambers.map(c => (
                        <tr key={c.id}>
                          <td style={{ paddingLeft: 24 }}>
                            <div style={{ fontWeight: 800, color: 'var(--admin-text)' }}>{c.day}</div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600, color: 'var(--admin-primary)' }}>{c.hospital?.name || 'Local Chamber'}</div>
                          </td>
                          <td>
                            <div style={{ fontSize: 13, color: 'var(--admin-text-muted)', fontWeight: 600 }}>🕒 {c.start_time} - {c.end_time || 'N/A'}</div>
                          </td>
                          <td style={{ textAlign: 'right', paddingRight: 24 }}>
                            <div style={{ fontWeight: 800, color: 'var(--admin-text)' }}>৳{c.fee || '0'}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
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
