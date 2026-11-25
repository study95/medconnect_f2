import { DetailSkeleton } from '../../../components/common/Skeletons'
// DoctorDetailPage.jsx — Premium Detailed View for Admin
import { useState, useRef, useEffect } from 'react'
import { getMediaUrl } from '../../../utils/mediaUtils'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAdminDoctorDetail } from '../../../features/doctors/useAdminDoctors'
import { useQueryClient } from '@tanstack/react-query'
import { invalidateDoctors } from '../../../lib/cacheInvalidation'
import { verifyDoctor } from '../../../api/doctorApi'
import { useDialog } from '../../../hooks/useDialog'
import { markItemSeen } from '../../../utils/seenTracker'
import { toast } from 'react-hot-toast'
import {
  CheckCircle2, AlertCircle, FileText, Check, X, Send, Loader2, Clock, RotateCcw
} from 'lucide-react'
import CompactUlid from '../../../components/common/CompactUlid'

export default function DoctorDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const printRef = useRef(null)
  const queryClient = useQueryClient()
  const { showDialog } = useDialog()

  const [exporting, setExporting] = useState(false)
  const [reviewing, setReviewing] = useState(false)
  const [showRevisionModal, setShowRevisionModal] = useState(false)
  const [revisionNotes, setRevisionNotes] = useState('')

  const { doctor, chambers, isLoading: loading, refetch } = useAdminDoctorDetail(id)

  useEffect(() => {
    if (id) {
      markItemSeen('doctors', id)
    }
  }, [id])

  const handleApprove = async () => {
    const ok = await showDialog({
      type: 'confirm',
      title: 'ডাক্তার অনুমোদন নিশ্চিতকরণ',
      message: 'আপনি কি নিশ্চিত যে এই ডাক্তার প্রোফাইলটি অনুমোদন ও সক্রিয় করতে চান? অনুমোদিত হলে ডাক্তারের নিজস্ব ড্যাশবোর্ড সম্পূর্ণ সক্রিয় হবে।',
      confirmText: 'হ্যাঁ, অনুমোদন করুন',
      cancelText: 'বাতিল',
      variant: 'primary'
    })
    if (!ok) return

    setReviewing(true)
    try {
      const res = await verifyDoctor(id, { status: 'approved' })
      if (res.data?.success) {
        toast.success(res.data?.message || 'ডাক্তার প্রোফাইল সফলভাবে অনুমোদিত ও সক্রিয় করা হয়েছে।')
        invalidateDoctors(queryClient, { doctorId: id, includeChambers: true })
        if (refetch) await refetch()
      }
    } catch (err) {
      const msg = err?.response?.data?.message || 'অনুমোদন করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।'
      toast.error(msg)
    } finally {
      setReviewing(false)
    }
  }

  const handleConfirmRevision = async () => {
    if (!revisionNotes.trim()) return
    setReviewing(true)
    try {
      const res = await verifyDoctor(id, {
        status: 'revision_requested',
        notes: revisionNotes.trim()
      })
      if (res.data?.success) {
        toast.success(res.data?.message || 'সংশোধনের অনুরোধ সফলভাবে পাঠানো হয়েছে।')
        setShowRevisionModal(false)
        invalidateDoctors(queryClient, { doctorId: id, includeChambers: true })
        if (refetch) await refetch()
      }
    } catch (err) {
      const msg = err?.response?.data?.message || 'সংশোধন অনুরোধ পাঠাতে সমস্যা হয়েছে।'
      toast.error(msg)
    } finally {
      setReviewing(false)
    }
  }

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

  if (loading && !doctor) return (
    <div className="admin-container" style={{ maxWidth: 1000, margin: '20px auto', padding: '0 16px' }}>
      <DetailSkeleton />
    </div>
  )
  if (!doctor) return <div className="admin-empty" style={{ color: 'var(--admin-text)' }}>Doctor not found</div>

  const expertiseList = getExpertise()

  return (
    <div className="admin-container" style={{ maxWidth: 1100, margin: '0 auto', animation: 'fadeIn 0.5s ease-out', paddingBottom: 60 }}>
      <div className="admin-page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h2 className="admin-page-title" style={{ color: 'var(--admin-text)', margin: 0 }}>
              <span style={{ marginRight: 8 }}>👨‍⚕️</span>
              Dr. {doctor.name}
            </h2>
            {doctor.verification_status === 'submitted' && (
              <span style={{ fontSize: 11, background: doctor.verification_notes ? '#EFF6FF' : '#EFF6FF', color: doctor.verification_notes ? '#1D4ED8' : '#1D4ED8', padding: '3px 10px', borderRadius: 20, fontWeight: 700, border: `1px solid ${doctor.verification_notes ? '#93C5FD' : '#BFDBFE'}` }}>
                {doctor.verification_notes ? '📩 সংশোধিত আবেদন (Re-submitted)' : '📩 নতুন আবেদন (Submitted)'}
              </span>
            )}
            {doctor.verification_status === 'revision_requested' && (
              <span style={{ fontSize: 11, background: '#FEF2F2', color: '#DC2626', padding: '3px 10px', borderRadius: 20, fontWeight: 700, border: '1px solid #FECACA' }}>
                ⚠️ সংশোধন চলমান (Revision Requested)
              </span>
            )}
            {doctor.verification_status === 'approved' && (
              <span style={{ fontSize: 11, background: '#DCFCE7', color: '#166534', padding: '3px 10px', borderRadius: 20, fontWeight: 700, border: '1px solid #BBF7D0' }}>
                ✓ অনুমোদিত ও সক্রিয়
              </span>
            )}
            {doctor.verification_status === 'draft' && (
              <span style={{ fontSize: 11, background: '#FEF3C7', color: '#92400E', padding: '3px 10px', borderRadius: 20, fontWeight: 700, border: '1px solid #FDE68A' }}>
                ⏳ খসড়া (Draft)
              </span>
            )}
          </div>
          <p className="admin-page-subtitle" style={{ color: 'var(--admin-text-muted)', margin: '4px 0 0' }}>Detailed clinical record for Dr. {doctor.name}</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {doctor.verification_status !== 'approved' && (
            <button
              type="button"
              disabled={reviewing}
              onClick={handleApprove}
              className="admin-btn"
              style={{
                borderRadius: 12,
                background: '#10B981',
                color: '#FFFFFF',
                fontWeight: 700,
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                cursor: reviewing ? 'not-allowed' : 'pointer'
              }}
            >
              {reviewing ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} strokeWidth={2.8} />}
              <span>অনুমোদন করুন</span>
            </button>
          )}
          <button 
            disabled={exporting} 
            onClick={handleDownloadPDF} 
            className="admin-btn admin-btn-primary" 
            style={{ borderRadius: 12, background: 'var(--admin-primary)', borderColor: 'var(--admin-primary)' }}
          >
            {exporting ? '⌛ Processing...' : '📥 Download PDF'}
          </button>
          <Link to={`/admin/doctors/edit/${id}`} className="admin-btn admin-btn-outline" style={{ borderRadius: 12 }}>✏️ Edit Profile</Link>
          <button
            type="button"
            onClick={() => {
              if (window.history.state && window.history.state.idx > 0) {
                navigate(-1)
              } else {
                navigate('/admin/doctors')
              }
            }}
            className="admin-btn admin-btn-outline"
            style={{ borderRadius: 12, cursor: 'pointer' }}
          >
            ← Back to List
          </button>
        </div>
      </div>

      <div ref={printRef} style={{ background: exporting ? '#ffffff' : 'transparent', padding: exporting ? '40px' : '0', borderRadius: exporting ? '20px' : '0' }}>
        {/* Prominent Verification Status Callout Banner */}
        {doctor.verification_status === 'revision_requested' && (
          <div style={{
            marginBottom: 24,
            padding: '16px 20px',
            background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF2F2 100%)',
            border: '1.5px solid #F87171',
            borderRadius: 16,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 14,
            boxShadow: '0 4px 14px rgba(239, 68, 68, 0.08)'
          }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <AlertCircle size={22} color="#DC2626" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#991B1B' }}>
                  ⚠️ আবেদনকারীকে সংশোধনের অনুরোধ পাঠানো হয়েছে (Awaiting Resubmission)
                </h4>
                <span style={{ fontSize: 11, fontWeight: 700, background: '#DC2626', color: '#FFFFFF', padding: '2px 8px', borderRadius: 12 }}>
                  আবেদনকারীর উত্তরের অপেক্ষায়
                </span>
              </div>
              <p style={{ margin: '0 0 8px', fontSize: 13, color: '#7F1D1D', lineHeight: 1.5 }}>
                অ্যাডমিন এই প্রোফাইলে সংশোধনের নির্দেশনা পাঠিয়েছেন। ব্যবহারকারী তার পোর্টালে এই নির্দেশনা দেখতে পাবে এবং নথিপত্র আপডেট করে পুনরায় জমা দিলে এখানে নোটিফিকেশন দেখতে পাবেন।
              </p>
              {doctor.verification_notes && (
                <div style={{ background: '#FFFFFF', padding: '10px 14px', borderRadius: 8, border: '1px solid #FECACA', display: 'inline-block', maxWidth: '100%' }}>
                  <span style={{ fontWeight: 800, color: '#991B1B', fontSize: 12.5 }}>আপনার পাঠানো নির্দেশনা: </span>
                  <span style={{ color: '#1F2937', fontSize: 13, fontWeight: 600 }}>"{doctor.verification_notes}"</span>
                </div>
              )}
            </div>
          </div>
        )}

        {doctor.verification_status === 'submitted' && doctor.verification_notes && (
          <div style={{
            marginBottom: 24,
            padding: '16px 20px',
            background: 'linear-gradient(135deg, #EFF6FF 0%, #F0FDF4 100%)',
            border: '1.5px solid #60A5FA',
            borderRadius: 16,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 14,
            boxShadow: '0 4px 14px rgba(59, 130, 246, 0.08)'
          }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CheckCircle2 size={22} color="#2563EB" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#1E40AF' }}>
                  📩 সংশোধিত আবেদন পুনরায় জমা হয়েছে (Resubmitted for Review)
                </h4>
                <span style={{ fontSize: 11, fontWeight: 700, background: '#2563EB', color: '#FFFFFF', padding: '2px 8px', borderRadius: 12 }}>
                  পুনঃযাচাইয়ের জন্য প্রস্তুত
                </span>
              </div>
              <p style={{ margin: '0 0 8px', fontSize: 13, color: '#1E3A8A', lineHeight: 1.5 }}>
                আবেদনকারী আপনার নির্দেশনা অনুযায়ী সংশোধিত নথিপত্র সফলভাবে পুনরায় আপলোড করেছেন। দয়া করে নথিপত্রগুলো পুনরায় যাচাই করে অনুমোদন করুন অথবা প্রয়োজন হলে পুনরায় সংশোধন চান।
              </p>
              <div style={{ background: '#FFFFFF', padding: '10px 14px', borderRadius: 8, border: '1px solid #BFDBFE', display: 'inline-block', maxWidth: '100%' }}>
                <span style={{ fontWeight: 800, color: '#1E40AF', fontSize: 12.5 }}>পূর্বে চাওয়া সংশোধন: </span>
                <span style={{ color: '#1F2937', fontSize: 13, fontWeight: 600 }}>"{doctor.verification_notes}"</span>
              </div>
            </div>
          </div>
        )}

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
                <InfoItem label="Doctor ID (Public ID)" value={doctor.public_id || doctor.id} icon="🆔" />
                <InfoItem label="BMDC Registration" value={doctor.bmdc} icon="🪪" />
                <InfoItem label="Registration Date" value={doctor.created_at ? new Date(doctor.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + new Date(doctor.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null} icon="📅" />
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

          {/* Verification Documents Card */}
          <div className="admin-card">
            <div className="admin-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 className="admin-card-title" style={{ color: 'var(--admin-text)', margin: 0 }}>🪪 Verification Documents</h3>
                {doctor.verification_status === 'draft' && (
                  <span style={{ fontSize: 11, background: '#FEF3C7', color: '#92400E', padding: '2px 8px', borderRadius: 6, fontWeight: 700, border: '1px solid #FDE68A' }}>
                    ⏳ খসড়া (জমা হয়নি)
                  </span>
                )}
                {doctor.verification_status === 'submitted' && (
                  <span style={{ fontSize: 11, background: '#DCFCE7', color: '#166534', padding: '2px 8px', borderRadius: 6, fontWeight: 700, border: '1px solid #BBF7D0' }}>
                    📩 চূড়ান্ত জমা হয়েছে
                  </span>
                )}
                {doctor.verification_status === 'approved' && (
                  <span style={{ fontSize: 11, background: '#DCFCE7', color: '#166534', padding: '2px 8px', borderRadius: 6, fontWeight: 700, border: '1px solid #BBF7D0' }}>
                    ✓ অনুমোদিত
                  </span>
                )}
                {doctor.verification_status === 'revision_requested' && (
                  <span style={{ fontSize: 11, background: '#FEF2F2', color: '#DC2626', padding: '2px 8px', borderRadius: 6, fontWeight: 700, border: '1px solid #FECACA' }}>
                    ⚠️ সংশোধন চাওয়া হয়েছে
                  </span>
                )}
              </div>
              {doctor.bmdc && (
                <a
                  href={`https://bmdc.org.bd`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 11, color: '#059669', background: '#ECFDF5', padding: '3px 8px', borderRadius: 6, textDecoration: 'none', fontWeight: 700, border: '1px solid #A7F3D0' }}
                >
                  Verify BMDC ↗
                </a>
              )}
            </div>
            <div className="admin-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--admin-text-muted)', textTransform: 'uppercase' }}>BMDC Certificate</span>
                {doctor.bmdc_document ? (
                  <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#F0FDF4', borderRadius: 8, border: '1px solid #BBF7D0' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#166534' }}>✓ Document Uploaded</span>
                    <a href={getMediaUrl(doctor.bmdc_document)} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 700, color: '#059669', textDecoration: 'underline' }}>
                      View File ↗
                    </a>
                  </div>
                ) : (
                  <div style={{ marginTop: 6, padding: '8px 12px', background: '#FEF2F2', borderRadius: 8, border: '1px solid #FECACA', color: '#DC2626', fontSize: 12, fontWeight: 600 }}>
                    ⚠️ No BMDC document uploaded yet
                  </div>
                )}
              </div>

              {doctor.nid_document && (
                <div>
                  <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--admin-text-muted)', textTransform: 'uppercase' }}>NID Document</span>
                  <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>NID Card Copy</span>
                    <a href={getMediaUrl(doctor.nid_document)} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 700, color: '#0284C7', textDecoration: 'underline' }}>
                      View File ↗
                    </a>
                  </div>
                </div>
              )}

              {/* Revision Notes Alert */}
              {doctor.verification_status === 'revision_requested' && doctor.verification_notes && (
                <div style={{ padding: '12px 14px', background: '#FEF2F2', borderRadius: 10, border: '1px solid #FECACA', fontSize: 12.5, color: '#991B1B' }}>
                  <div style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <AlertCircle size={15} color="#DC2626" /> চলমান সংশোধনের নির্দেশনা:
                  </div>
                  <div style={{ background: '#FFFFFF', padding: '8px 10px', borderRadius: 6, border: '1px dashed #FCA5A5', color: '#7F1D1D', fontWeight: 600 }}>
                    "{doctor.verification_notes}"
                  </div>
                  <div style={{ marginTop: 6, fontSize: 11, color: '#B91C1C' }}>
                    ⏳ আবেদনকারীর সংশোধিত নথি জমা দেওয়ার অপেক্ষায় রয়েছে।
                  </div>
                </div>
              )}

              {doctor.verification_status === 'submitted' && doctor.verification_notes && (
                <div style={{ padding: '12px 14px', background: '#EFF6FF', borderRadius: 10, border: '1px solid #BFDBFE', fontSize: 12.5, color: '#1E40AF' }}>
                  <div style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <CheckCircle2 size={15} color="#2563EB" /> সংশোধিত আবেদন পুনরায় জমা হয়েছে
                  </div>
                  <div style={{ background: '#FFFFFF', padding: '8px 10px', borderRadius: 6, border: '1px dashed #93C5FD', color: '#1E3A8A', fontSize: 12 }}>
                    <span style={{ fontWeight: 700 }}>পূর্বে চাওয়া সংশোধন:</span> "{doctor.verification_notes}"
                  </div>
                  <div style={{ marginTop: 6, fontSize: 11, color: '#1D4ED8' }}>
                    ✓ আবেদনকারী নতুন নথি আপলোড করে পুনরায় রিভিউয়ের জন্য জমা দিয়েছেন।
                  </div>
                </div>
              )}

              {doctor.verification_status !== 'revision_requested' && doctor.verification_status !== 'submitted' && doctor.verification_notes && (
                <div style={{ padding: '10px 12px', background: '#FEF3C7', borderRadius: 8, border: '1px solid #FDE68A', fontSize: 12.5, color: '#92400E' }}>
                  <strong>রিভিউ নোট:</strong> {doctor.verification_notes}
                </div>
              )}

              {/* Admin Decision Actions */}
              <div style={{ marginTop: 8, paddingTop: 12, borderTop: '1px solid var(--admin-border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {doctor.verification_status !== 'approved' ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <button
                      type="button"
                      disabled={reviewing}
                      onClick={handleApprove}
                      style={{
                        padding: '9px 12px',
                        background: '#10B981',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: 8,
                        fontWeight: 700,
                        fontSize: 12.5,
                        cursor: reviewing ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6
                      }}
                    >
                      {reviewing ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} strokeWidth={2.6} />}
                      অনুমোদন করুন
                    </button>
                    <button
                      type="button"
                      disabled={reviewing}
                      onClick={() => {
                        setRevisionNotes(doctor.verification_notes || '')
                        setShowRevisionModal(true)
                      }}
                      style={{
                        padding: '9px 12px',
                        background: '#FEF2F2',
                        color: '#DC2626',
                        border: '1px solid #FECACA',
                        borderRadius: 8,
                        fontWeight: 700,
                        fontSize: 12.5,
                        cursor: reviewing ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6
                      }}
                    >
                      <AlertCircle size={14} />
                      সংশোধন চান
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: '#F0FDF4', borderRadius: 10, padding: '10px 12px', border: '1px solid #BBF7D0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: '#166534', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <CheckCircle2 size={16} color="#16A34A" /> ভেরিফায়েড ও সক্রিয় প্রোফাইল
                      </span>
                    </div>
                    <button
                      type="button"
                      disabled={reviewing}
                      onClick={() => {
                        setRevisionNotes(doctor.verification_notes || '')
                        setShowRevisionModal(true)
                      }}
                      style={{
                        padding: '6px 10px',
                        background: '#FFFFFF',
                        border: '1px solid #FECACA',
                        borderRadius: 6,
                        color: '#DC2626',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 5
                      }}
                    >
                      <AlertCircle size={13} />
                      প্রয়োজনে পুনরায় সংশোধন চান (Request Revision)
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
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
                        <th style={{ width: 120, paddingLeft: 24, color: 'var(--admin-text-muted)' }}>Chamber ID</th>
                        <th style={{ color: 'var(--admin-text-muted)' }}>Visiting Day</th>
                        <th style={{ color: 'var(--admin-text-muted)' }}>Hospital / Venue</th>
                        <th style={{ color: 'var(--admin-text-muted)' }}>Time Slot</th>
                        <th style={{ textAlign: 'right', paddingRight: 24, color: 'var(--admin-text-muted)' }}>Fee</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chambers.map(c => (
                        <tr key={c.id}>
                          <td style={{ paddingLeft: 24 }}>
                            <CompactUlid value={c.public_id || c.id} />
                          </td>
                          <td>
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

      {/* Revision Notes Modal */}
      {showRevisionModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 16,
            backdropFilter: 'blur(3px)'
          }}
          onClick={() => !reviewing && setShowRevisionModal(false)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 16,
              maxWidth: 480,
              width: '100%',
              padding: 24,
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={20} color="#DC2626" />
                সংশোধনের নির্দেশনা প্রদান করুন
              </h3>
              <button
                type="button"
                onClick={() => setShowRevisionModal(false)}
                disabled={reviewing}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={18} />
              </button>
            </div>
            <p style={{ margin: '0 0 14px', fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>
              ডাক্তার কেন তাদের নথি বা তথ্যাবলী সংশোধন করবেন, তার স্পষ্ট নির্দেশনা নিচে লিখুন। এটি তাদের ভেরিফিকেশন পেজে রিভিউ নোট হিসেবে প্রদর্শিত হবে।
            </p>
            {doctor.verification_notes && (
              <div style={{ marginBottom: 12, padding: '10px 12px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <div style={{ fontSize: 12, minWidth: 0 }}>
                  <span style={{ fontWeight: 700, color: '#475569' }}>পূর্বে প্রেরিত নোট: </span>
                  <span style={{ color: '#0F172A', fontStyle: 'italic' }}>"{doctor.verification_notes}"</span>
                </div>
                <button
                  type="button"
                  onClick={() => setRevisionNotes('')}
                  style={{ background: 'none', border: 'none', color: '#64748B', fontSize: 11, cursor: 'pointer', textDecoration: 'underline', flexShrink: 0 }}
                >
                  মুছে ফেলুন
                </button>
              </div>
            )}
            <textarea
              rows={4}
              value={revisionNotes}
              onChange={(e) => setRevisionNotes(e.target.value)}
              placeholder="উদাহরণ: আপনার আপলোডকৃত বিএমডিসি সনদের ছবিটি অস্পষ্ট। দয়া করে পরিষ্কার স্ক্যান কপি পুনরায় আপলোড করুন।"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 10,
                border: '1.5px solid #CBD5E1',
                fontSize: 13.5,
                color: '#0F172A',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                outline: 'none',
                resize: 'vertical'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <button
                type="button"
                onClick={() => setShowRevisionModal(false)}
                disabled={reviewing}
                className="admin-btn admin-btn-outline"
                style={{ borderRadius: 8, padding: '8px 16px', fontSize: 13 }}
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleConfirmRevision}
                disabled={reviewing || !revisionNotes.trim()}
                style={{
                  padding: '8px 18px',
                  background: '#DC2626',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: (reviewing || !revisionNotes.trim()) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                {reviewing ? <Loader2 size={15} className="animate-spin" /> : <Send size={14} />}
                অনুরোধ পাঠান
              </button>
            </div>
          </div>
        </div>
      )}

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
