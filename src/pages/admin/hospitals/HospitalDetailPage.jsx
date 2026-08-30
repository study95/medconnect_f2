// HospitalDetailPage.jsx — Premium Hospital Profile View for Admin
import { useState, useRef } from 'react'
import { getMediaUrl } from '../../../utils/mediaUtils'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAdminHospitalDetail } from '../../../features/hospitals/useAdminHospitals'

export default function HospitalDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const printRef = useRef(null)
  const [exporting, setExporting] = useState(false)

  const { hospital, doctors, chambers, isLoading: loading } = useAdminHospitalDetail(id)

  const handleDownloadPDF = async () => {
    if (!printRef.current) return
    setExporting(true)
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ])
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
      pdf.save(`Hospital_Profile_${hospital.name?.replace(/\s+/g, '_')}.pdf`)
      
    } catch (err) {
      
    } finally {
      setExporting(false)
    }
  }

  if (loading) return <div className="admin-loading"><div className="admin-spinner" /> Loading Hospital Profile...</div>
  if (!hospital) return <div className="admin-empty" style={{ color: 'var(--admin-text)' }}>Hospital profile not found.</div>

  return (
    <div className="admin-container" style={{ maxWidth: 1100, margin: '0 auto', animation: 'fadeIn 0.5s ease-out', paddingBottom: 60 }}>
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title" style={{ color: 'var(--admin-text)' }}>
            <span style={{ marginRight: 12 }}>🏥</span>
            Hospital Profile
          </h2>
          <p className="admin-page-subtitle" style={{ color: 'var(--admin-text-muted)' }}>{hospital.name} — Facility Overview</p>
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
          <Link to={`/admin/hospitals/edit/${id}`} className="admin-btn admin-btn-outline" style={{ borderRadius: 12 }}>✏️ Edit Info</Link>
          <Link to="/admin/hospitals" className="admin-btn admin-btn-outline" style={{ borderRadius: 12 }}>← Back to List</Link>
        </div>
      </div>

      <div ref={printRef} style={{ background: exporting ? '#ffffff' : 'transparent', padding: exporting ? '40px' : '0', borderRadius: exporting ? '20px' : '0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: 28, alignItems: 'flex-start' }}>
        
        {/* Left Column: Hospital Identity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ height: 120, background: 'linear-gradient(135deg, #10B981, #34D399)', position: 'relative' }}>
              {hospital.top_10_hospital && (
                <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(255,255,255,0.2)', color: 'white', padding: '4px 10px', borderRadius: 20, fontSize: 10, fontWeight: 800, backdropFilter: 'blur(4px)' }}>⭐ TOP 10</div>
              )}
            </div>
            <div style={{ marginTop: -50, padding: '0 24px 32px', textAlign: 'center', position: 'relative', zIndex: 10 }}>
              <div style={{
                width: 100, height: 100, borderRadius: 24, background: 'var(--admin-card-bg)', margin: '0 auto',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', border: '4px solid var(--admin-card-bg)', position: 'relative', zIndex: 20
              }}>
                {hospital.photo_url ? (
                  <img src={getMediaUrl(hospital.photo_url)} alt="H" style={{ width: '100%', height: '100%', borderRadius: 20, objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: 48 }}>🏥</span>
                )}
              </div>

              <h3 style={{ marginTop: 20, fontWeight: 800, color: 'var(--admin-text)', fontSize: 22 }}>{hospital.name}</h3>
              <p style={{ fontSize: 13, color: 'var(--admin-text-muted)', marginBottom: 24 }}>{hospital.registration_id || 'Registered Medical Facility'}</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '12px', borderRadius: 12, border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                  <div style={{ fontWeight: 800, color: '#10B981', fontSize: 18 }}>{doctors.length}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase' }}>Doctors</div>
                </div>
                <div style={{ background: 'rgba(59, 130, 246, 0.05)', padding: '12px', borderRadius: 12, border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                  <div style={{ fontWeight: 800, color: '#3B82F6', fontSize: 18 }}>{chambers.length}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase' }}>Chambers</div>
                </div>
              </div>

              <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 16, borderTop: '1px solid var(--admin-border)' }}>
                <InfoItem label="Official Email" value={hospital.email} icon="✉️" />
                <InfoItem label="Contact Hotline" value={hospital.phone} icon="📞" />
                <InfoItem label="Website URL" value={hospital.url} icon="🌐" isLink />
                <div style={{ marginTop: 8, padding: '16px', background: 'rgba(0,0,0,0.02)', borderRadius: 12, border: '1px solid var(--admin-border)' }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--admin-text-muted)', textTransform: 'uppercase' }}>📍 Physical Location</span>
                  <p style={{ margin: '4px 0 0', fontSize: 14, fontWeight: 700, color: 'var(--admin-text)' }}>
                    {[hospital.union?.name, hospital.upazila?.name, hospital.district?.name, hospital.division?.name].filter(Boolean).join(', ') || 'Address not specified'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="admin-card">
            <div className="admin-card-header"><h3 className="admin-card-title" style={{ color: 'var(--admin-text)' }}>🕒 Service Status</h3></div>
            <div className="admin-card-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', background: hospital.is_active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', borderRadius: 12 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: hospital.is_active ? '#10B981' : '#EF4444' }} />
                <span style={{ fontWeight: 800, color: hospital.is_active ? '#10B981' : '#EF4444', fontSize: 13 }}>
                  {hospital.is_active ? 'ACTIVE & OPERATIONAL' : 'INACTIVE / CLOSED'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Lists */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

          {/* Facility Details */}
          <div className="admin-card">
            <div className="admin-card-header"><h3 className="admin-card-title" style={{ color: 'var(--admin-text)' }}>📝 Facility Description</h3></div>
            <div className="admin-card-body">
              <p style={{ color: 'var(--admin-text)', lineHeight: 1.7, fontSize: 15, margin: 0 }}>
                {hospital.description || 'No description available for this facility.'}
              </p>
              {hospital.address && (
                <div style={{ marginTop: 24, padding: 16, background: 'rgba(14, 165, 233, 0.05)', borderRadius: 12, borderLeft: '4px solid #0EA5E9' }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#0EA5E9', textTransform: 'uppercase' }}>Physical Address</span>
                  <p style={{ margin: '4px 0 0', fontWeight: 600, color: 'var(--admin-text)' }}>{hospital.address}</p>
                </div>
              )}
            </div>
          </div>

          {/* Affiliated Doctors */}
          <div className="admin-card">
            <div className="admin-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="admin-card-title" style={{ color: 'var(--admin-text)' }}>👨‍⚕️ Affiliated Specialists</h3>
              <span style={{ fontSize: 12, background: 'var(--admin-bg)', padding: '2px 10px', borderRadius: 20, color: 'var(--admin-text-muted)' }}>{doctors.length} Doctors</span>
            </div>
            <div className="admin-card-body" style={{ padding: 0 }}>
              {doctors.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--admin-text-muted)' }}>No doctors currently linked to this hospital.</div>
              ) : (
                <div className="admin-table-wrapper">
                  <table className="admin-table" style={{ border: 'none' }}>
                    <thead>
                      <tr>
                        <th style={{ paddingLeft: 24, color: 'var(--admin-text-muted)' }}>Doctor Name</th>
                        <th style={{ color: 'var(--admin-text-muted)' }}>Expertise</th>
                        <th style={{ color: 'var(--admin-text-muted)' }}>Contact</th>
                        <th style={{ textAlign: 'right', paddingRight: 24, color: 'var(--admin-text-muted)' }}>Profile</th>
                      </tr>
                    </thead>
                    <tbody>
                      {doctors.map(doc => (
                        <tr key={doc.id}>
                          <td style={{ paddingLeft: 24 }}>
                            <div style={{ fontWeight: 700, color: 'var(--admin-text)' }}>{doc.name}</div>
                          </td>
                          <td>
                            <span style={{ fontSize: 12, color: 'var(--admin-primary)', fontWeight: 600 }}>{doc.specialty?.name || 'General'}</span>
                          </td>
                          <td>
                            <div style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>{doc.phone || 'N/A'}</div>
                          </td>
                          <td style={{ textAlign: 'right', paddingRight: 24 }}>
                            <Link to={`/admin/doctors/view/${doc.id}`} className="admin-btn admin-btn-outline admin-btn-sm" style={{ borderRadius: 8 }}>👁️</Link>
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

function InfoItem({ label, value, icon, isLink }) {
  if (!value) return null
  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
      <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(0,0,0,0.03)', border: '1px solid var(--admin-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16 }}>{icon}</div>
      <div style={{ minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
        {isLink ? (
          <a href={value.startsWith('http') ? value : `https://${value}`} target="_blank" rel="noreferrer" style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#3B82F6', textDecoration: 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</a>
        ) : (
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--admin-text)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</p>
        )}
      </div>
    </div>
  )
}
