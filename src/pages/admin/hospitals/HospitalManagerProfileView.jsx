// src/pages/admin/hospitals/HospitalManagerProfileView.jsx
import React, { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  UserCheck, 
  DoorOpen, 
  Bed, 
  Ambulance, 
  Edit3, 
  Download, 
  ExternalLink,
  ShieldCheck,
  Clock,
  Award,
  Users,
  CalendarCheck
} from 'lucide-react'
import { getMediaUrl } from '../../../utils/mediaUtils'
import { useAdminHospitalDetail } from '../../../features/hospitals/useAdminHospitals'
import CompactUlid from '../../../components/common/CompactUlid'

export default function HospitalManagerProfileView({ hospitalId }) {
  const navigate = useNavigate()
  const printRef = useRef(null)
  const [exporting, setExporting] = useState(false)

  const { hospital, doctors, chambers, isLoading: loading } = useAdminHospitalDetail(hospitalId)

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
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (imgProps => (imgProps.height * pdfWidth) / imgProps.width)(pdf.getImageProperties(imgData))
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`Hospital_Profile_${hospital?.name?.replace(/\s+/g, '_') || 'Facility'}.pdf`)
    } catch (err) {
      console.error('PDF export failed', err)
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="admin-loading" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <div className="admin-spinner" style={{ margin: '0 auto 16px' }} />
        <div style={{ color: 'var(--admin-text-muted)', fontSize: 14, fontWeight: 600 }}>Loading Hospital Facility Profile...</div>
      </div>
    )
  }

  if (!hospital) {
    return (
      <div className="admin-card" style={{ textAlign: 'center', padding: '60px 20px', margin: '40px auto', maxWidth: 600 }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🏥</div>
        <h3 style={{ fontWeight: 800, color: 'var(--admin-text)', marginBottom: 8 }}>Hospital Profile Not Found</h3>
        <p style={{ color: 'var(--admin-text-muted)', fontSize: 14 }}>
          No registered hospital facility is currently associated with your account.
        </p>
      </div>
    )
  }

  const totalBeds = (
    parseInt(hospital.Cabin_number || 0, 10) +
    parseInt(hospital.ICU_number || 0, 10) +
    parseInt(hospital.CCU_number || 0, 10) +
    parseInt(hospital.HDU_number || 0, 10)
  )

  const publicUrl = hospital.canonical_url || (hospital.slug ? `/hospitals/${hospital.district_slug || 'bangladesh'}/${hospital.upazila_slug || 'general'}/${hospital.seo_slug || hospital.slug}` : null)

  return (
    <div className="admin-container" style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 60, animation: 'fadeIn 0.35s ease-out' }}>
      
      {/* Top Header Bar */}
      <div className="admin-page-header" style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 className="admin-page-title" style={{ color: 'var(--admin-text)', display: 'flex', alignItems: 'center', gap: 10, margin: 0 }}>
            <span style={{ fontSize: 26 }}>🏥</span>
            My Hospital Profile
          </h2>
          <p className="admin-page-subtitle" style={{ color: 'var(--admin-text-muted)', margin: '4px 0 0' }}>
            {hospital.name} — Facility Overview & Management
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {publicUrl && (
            <a
              href={publicUrl}
              target="_blank"
              rel="noreferrer"
              className="admin-btn admin-btn-outline"
              style={{ borderRadius: 10, height: 40, display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
            >
              <ExternalLink size={15} />
              <span>Public Page</span>
            </a>
          )}
          <button
            type="button"
            disabled={exporting}
            onClick={handleDownloadPDF}
            className="admin-btn admin-btn-outline"
            style={{ borderRadius: 10, height: 40, display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
          >
            <Download size={15} />
            <span>{exporting ? 'Exporting...' : 'Download PDF'}</span>
          </button>
          <Link
            to={`/admin/hospitals/edit/${hospital.id}`}
            className="admin-btn admin-btn-primary"
            style={{ borderRadius: 10, height: 40, display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700, padding: '0 20px', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', border: 'none', boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)' }}
          >
            <Edit3 size={15} />
            <span>Edit Hospital Profile</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 16, marginBottom: 24 }}>
        <Link to="/admin/doctors" style={{ textDecoration: 'none' }}>
          <div className="admin-card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
          >
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(16, 185, 129, 0.12)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <UserCheck size={24} />
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--admin-text)', lineHeight: 1.2 }}>{doctors.length}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-text-muted)' }}>Affiliated Doctors →</div>
            </div>
          </div>
        </Link>

        <Link to="/admin/chambers" style={{ textDecoration: 'none' }}>
          <div className="admin-card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
          >
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(59, 130, 246, 0.12)', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <DoorOpen size={24} />
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--admin-text)', lineHeight: 1.2 }}>{chambers.length}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-text-muted)' }}>Active Chambers →</div>
            </div>
          </div>
        </Link>

        <Link to="/admin/appointments" style={{ textDecoration: 'none' }}>
          <div className="admin-card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
          >
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CalendarCheck size={24} />
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--admin-text)', lineHeight: 1.2 }}>Bookings</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-text-muted)' }}>Appointments Desk →</div>
            </div>
          </div>
        </Link>

        <div className="admin-card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(139, 92, 246, 0.12)', color: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Bed size={24} />
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--admin-text)', lineHeight: 1.2 }}>
              {totalBeds > 0 ? totalBeds : (hospital.Cabin_number || 'N/A')}
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-text-muted)' }}>Total Bed Capacity</div>
          </div>
        </div>
      </div>

      {/* Printable Area */}
      <div ref={printRef} style={{ background: exporting ? '#ffffff' : 'transparent', padding: exporting ? '30px' : '0', borderRadius: exporting ? 16 : 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 24, alignItems: 'flex-start' }}>
          
          {/* LEFT COLUMN: Hospital Identity & Contact Card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            
            {/* Main Identity Card */}
            <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
              {/* Cover Banner */}
              <div style={{ 
                height: 130, 
                background: hospital.banner_url || hospital.hospital_banner 
                  ? `url(${getMediaUrl(hospital.banner_url || hospital.hospital_banner)}) center/cover no-repeat` 
                  : 'linear-gradient(135deg, #059669 0%, #10B981 50%, #34D399 100%)', 
                position: 'relative' 
              }}>
                {(hospital.top_10_hospital === 'yes' || hospital.top_10_hospital === true) && (
                  <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.45)', color: '#FDE047', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4, backdropFilter: 'blur(4px)' }}>
                    <Award size={13} /> TOP 10
                  </div>
                )}
              </div>

              {/* Profile Body */}
              <div style={{ marginTop: -50, padding: '0 24px 28px', textAlign: 'center', position: 'relative' }}>
                {/* Logo / Photo */}
                <div style={{
                  width: 96,
                  height: 96,
                  borderRadius: 22,
                  background: 'var(--admin-card-bg)',
                  margin: '0 auto',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '4px solid var(--admin-card-bg)',
                  overflow: 'hidden'
                }}>
                  {hospital.photo_url || hospital.logo_url || hospital.photo || hospital.hospital_logo ? (
                    <img 
                      src={getMediaUrl(hospital.photo_url || hospital.logo_url || hospital.photo || hospital.hospital_logo)} 
                      alt={hospital.name} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  ) : (
                    <span style={{ fontSize: 44 }}>🏥</span>
                  )}
                </div>

                <h3 style={{ marginTop: 14, marginBottom: 4, fontWeight: 800, color: 'var(--admin-text)', fontSize: 20 }}>
                  {hospital.name}
                </h3>
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
                  <CompactUlid value={hospital.public_id || hospital.id} />
                  {hospital.hospital_type && (
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: 'rgba(59, 130, 246, 0.08)', color: '#3B82F6', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                      {hospital.hospital_type}
                    </span>
                  )}
                </div>

                {/* Status Indicator */}
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 16px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 700,
                  background: hospital.is_active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  color: hospital.is_active ? '#059669' : '#DC2626',
                  marginBottom: 20,
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: hospital.is_active ? '#10B981' : '#EF4444' }} />
                  {hospital.is_active ? 'Active & Operational' : 'Inactive / Under Review'}
                </div>

                {/* Contact List */}
                <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 14, borderTop: '1px solid var(--admin-border)', paddingTop: 18 }}>
                  <ContactRow icon={<Phone size={15} />} label="Hotline / Phone" value={hospital.phone || hospital.hotline} />
                  <ContactRow icon={<Mail size={15} />} label="Official Email" value={hospital.official_email || hospital.email} />
                  {hospital.license_number && (
                    <ContactRow icon={<ShieldCheck size={15} />} label="License No." value={hospital.license_number} />
                  )}
                  {hospital.url && (
                    <ContactRow icon={<Globe size={15} />} label="Website" value={hospital.url} isLink />
                  )}

                  {/* Location address */}
                  <div style={{ marginTop: 4, padding: 14, borderRadius: 12, background: 'var(--admin-bg)', border: '1px solid var(--admin-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, color: 'var(--admin-text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
                      <MapPin size={13} color="#10B981" /> Physical Address
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--admin-text)', marginBottom: 2 }}>
                      {[hospital.division?.name, hospital.district?.name, hospital.upazila?.name].filter(Boolean).join(' > ') || 'Location N/A'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>
                      {hospital.address || 'Address details not set yet.'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Capacity & Emergency Services Card */}
            <div className="admin-card">
              <div className="admin-card-header" style={{ padding: '14px 18px', borderBottom: '1px solid var(--admin-border)' }}>
                <h4 className="admin-card-title" style={{ margin: 0, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Bed size={16} color="#8B5CF6" />
                  Capacity & Facilities
                </h4>
              </div>
              <div className="admin-card-body" style={{ padding: '16px 18px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <StatBadge label="ICU Beds" value={hospital.ICU_number || '0'} />
                  <StatBadge label="CCU Beds" value={hospital.CCU_number || '0'} />
                  <StatBadge label="HDU Beds" value={hospital.HDU_number || '0'} />
                  <StatBadge label="Cabins" value={hospital.Cabin_number || '0'} />
                  <StatBadge label="Nurses" value={hospital.nurse_number || '0'} />
                  <StatBadge label="Staff" value={hospital.staff_number || '0'} />
                </div>
                {hospital.ambulance_number && (
                  <div style={{ marginTop: 12, padding: '10px 12px', background: 'rgba(239, 68, 68, 0.06)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10, border: '1px solid rgba(239, 68, 68, 0.15)' }}>
                    <Ambulance size={18} color="#EF4444" />
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 800, color: '#DC2626', textTransform: 'uppercase' }}>Ambulance Helpline</div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--admin-text)' }}>{hospital.ambulance_number}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Doctors & Chambers Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            
            {/* About / Description */}
            <div className="admin-card">
              <div className="admin-card-header" style={{ padding: '14px 20px', borderBottom: '1px solid var(--admin-border)' }}>
                <h4 className="admin-card-title" style={{ margin: 0, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>📝</span> About Facility
                </h4>
              </div>
              <div className="admin-card-body" style={{ padding: '18px 20px' }}>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: 'var(--admin-text)' }}>
                  {hospital.about || hospital.description || 'No detailed biography or summary provided yet. Click "Edit Hospital Profile" to add comprehensive details about your hospital, medical departments, diagnostic tests, and available specialist doctors.'}
                </p>
                {hospital.medical_test_list && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--admin-border)' }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--admin-text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Available Tests & Diagnostic Services</div>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--admin-text)', lineHeight: 1.6 }}>{hospital.medical_test_list}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Affiliated Doctors */}
            <div className="admin-card">
              <div className="admin-card-header" style={{ padding: '14px 20px', borderBottom: '1px solid var(--admin-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Users size={17} color="#10B981" />
                  <h4 className="admin-card-title" style={{ margin: 0, fontSize: 15 }}>
                    Affiliated Doctors
                  </h4>
                  <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 12, background: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>
                    {doctors.length}
                  </span>
                </div>
                <Link to="/admin/doctors" className="admin-btn admin-btn-outline admin-btn-sm" style={{ borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
                  Manage Doctors →
                </Link>
              </div>
              <div className="admin-card-body" style={{ padding: 0 }}>
                {doctors.length === 0 ? (
                  <div style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: 13 }}>
                    No doctors linked to your hospital yet. You can invite doctors from the Doctors page.
                  </div>
                ) : (
                  <div className="admin-table-wrapper">
                    <table className="admin-table" style={{ border: 'none' }}>
                      <thead>
                        <tr>
                          <th style={{ paddingLeft: 20, color: 'var(--admin-text-muted)' }}>Doctor Name</th>
                          <th style={{ color: 'var(--admin-text-muted)' }}>Specialty</th>
                          <th style={{ color: 'var(--admin-text-muted)' }}>Contact</th>
                          <th style={{ textAlign: 'right', paddingRight: 20, color: 'var(--admin-text-muted)' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {doctors.map(doc => (
                          <tr key={doc.id}>
                            <td style={{ paddingLeft: 20 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(0,0,0,0.03)', border: '1px solid var(--admin-border)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  {doc.photo_url || doc.photo ? (
                                    <img src={getMediaUrl(doc.photo_url || doc.photo)} alt={doc.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  ) : (
                                    <span>👨‍⚕️</span>
                                  )}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 700, color: 'var(--admin-text)', fontSize: 13 }}>{doc.name}</div>
                                  <CompactUlid value={doc.public_id || doc.id} />
                                </div>
                              </div>
                            </td>
                            <td>
                              <span style={{ fontSize: 12, fontWeight: 600, color: '#10B981' }}>
                                {doc.specialty?.name || 'General Practice'}
                              </span>
                            </td>
                            <td>
                              <span style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>{doc.phone || 'N/A'}</span>
                            </td>
                            <td style={{ textAlign: 'right', paddingRight: 20 }}>
                              <Link to={`/admin/doctors/view/${doc.id}`} className="admin-btn admin-btn-outline admin-btn-sm" style={{ borderRadius: 6, fontSize: 12, padding: '4px 10px' }}>
                                View
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Active Chambers */}
            <div className="admin-card">
              <div className="admin-card-header" style={{ padding: '14px 20px', borderBottom: '1px solid var(--admin-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <DoorOpen size={17} color="#3B82F6" />
                  <h4 className="admin-card-title" style={{ margin: 0, fontSize: 15 }}>
                    Active Chambers
                  </h4>
                  <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 12, background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }}>
                    {chambers.length}
                  </span>
                </div>
                <Link to="/admin/chambers" className="admin-btn admin-btn-outline admin-btn-sm" style={{ borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
                  Manage Chambers →
                </Link>
              </div>
              <div className="admin-card-body" style={{ padding: 0 }}>
                {chambers.length === 0 ? (
                  <div style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: 13 }}>
                    No active chambers registered for this hospital yet.
                  </div>
                ) : (
                  <div className="admin-table-wrapper">
                    <table className="admin-table" style={{ border: 'none' }}>
                      <thead>
                        <tr>
                          <th style={{ paddingLeft: 20, color: 'var(--admin-text-muted)' }}>Doctor</th>
                          <th style={{ color: 'var(--admin-text-muted)' }}>Day / Schedule</th>
                          <th style={{ color: 'var(--admin-text-muted)' }}>Fee</th>
                          <th style={{ textAlign: 'right', paddingRight: 20, color: 'var(--admin-text-muted)' }}>Room</th>
                        </tr>
                      </thead>
                      <tbody>
                        {chambers.map(ch => (
                          <tr key={ch.id}>
                            <td style={{ paddingLeft: 20 }}>
                              <div style={{ fontWeight: 700, color: 'var(--admin-text)', fontSize: 13 }}>
                                {ch.doctor?.name || `Doctor #${ch.doctor_id}`}
                              </div>
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--admin-text)' }}>
                                <Clock size={13} color="var(--admin-text-muted)" />
                                <span style={{ fontWeight: 600 }}>{ch.day || 'Weekly'}</span>
                                <span style={{ color: 'var(--admin-text-muted)' }}>({ch.start_time || 'TBD'} - {ch.end_time || 'TBD'})</span>
                              </div>
                            </td>
                            <td>
                              <span style={{ fontSize: 12, fontWeight: 700, color: '#10B981' }}>
                                ৳{ch.fee ?? ch.consultation_fee ?? '0'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right', paddingRight: 20 }}>
                              <span style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>
                                {ch.room_number || ch.room_no || 'Room N/A'}
                              </span>
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
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  )
}

function ContactRow({ icon, label, value, isLink = false }) {
  if (!value) return null
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--admin-bg)', border: '1px solid var(--admin-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--admin-text-muted)', flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase' }}>{label}</div>
        {isLink ? (
          <a href={value.startsWith('http') ? value : `https://${value}`} target="_blank" rel="noreferrer" style={{ fontSize: 12.5, fontWeight: 600, color: '#3B82F6', textDecoration: 'none', wordBreak: 'break-all' }}>
            {value}
          </a>
        ) : (
          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--admin-text)', wordBreak: 'break-word' }}>{value}</div>
        )}
      </div>
    </div>
  )
}

function StatBadge({ label, value }) {
  return (
    <div style={{ padding: '8px 12px', background: 'var(--admin-bg)', borderRadius: 10, border: '1px solid var(--admin-border)' }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--admin-text)', marginTop: 2 }}>{value}</div>
    </div>
  )
}
