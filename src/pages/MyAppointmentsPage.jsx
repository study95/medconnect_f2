import { useState, useRef } from 'react'
import { Container } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getAppointments } from '../api/appointmentApi'
import { getPrescription } from '../api/adminApi'
import { AppointmentListSkeleton } from '../components/common/Skeletons'
import { useTranslation } from 'react-i18next'
import { MapPin, Calendar, Clock, ChevronRight, ArrowLeft, Download, Loader2, FileText, User } from 'lucide-react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import PrescriptionPaper from '../components/common/PrescriptionPaper'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import '../styles/prescription.css'

const STATUS_MAP = {
  pending:   'আসন্ন',
  confirmed: 'নিশ্চিত',
  cancelled: 'বাতিল',
  completed: 'সম্পন্ন',
}

const STATUS_STYLES = {
  pending:   { bg: '#ECFDF5', color: '#047857', dot: '#10B981', bar: '#10B981' },
  confirmed: { bg: '#EFF6FF', color: '#1D4ED8', dot: '#3B82F6', bar: '#3B82F6' },
  cancelled: { bg: '#FEF2F2', color: '#DC2626', dot: '#EF4444', bar: '#EF4444' },
  completed: { bg: '#F5F3FF', color: '#6D28D9', dot: '#8B5CF6', bar: '#8B5CF6' },
}

const AVATAR_COLORS = [
  { bg: '#E0F2FE', text: '#0369A1' },
  { bg: '#FCE7F3', text: '#BE185D' },
  { bg: '#FEF3C7', text: '#B45309' },
  { bg: '#D1FAE5', text: '#047857' },
  { bg: '#F3E8FF', text: '#7E22CE' },
]

const getAvatarColor = (name = '') => {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

const enToBn = { '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪', '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯' }
const toBnNum = (str) => str !== null && str !== undefined ? String(str).replace(/\d/g, d => enToBn[d] || d) : ''

const bnMonths = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
]

const bnDays = [
  'রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'
]

const formatDateBn = (dateStr) => {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    const dayName = bnDays[d.getDay()]
    const dayNum = toBnNum(d.getDate())
    const monthName = bnMonths[d.getMonth()]
    const yearNum = toBnNum(d.getFullYear())
    return `${dayName}, ${dayNum} ${monthName} ${yearNum}`
  } catch {
    return dateStr
  }
}

const formatTimeBn = (timeStr) => {
  if (!timeStr) return '—'
  try {
    let timeUpper = String(timeStr).toUpperCase()
    let isPM = timeUpper.includes('PM')
    let isAM = timeUpper.includes('AM')
    let cleanStr = timeStr.replace(/[a-zA-Z\s]/g, '').trim()
    let parts = cleanStr.split(':')
    let h = parseInt(parts[0], 10)
    let m = parseInt(parts[1] || '0', 10)
    
    if (isPM && h < 12) h += 12
    if (isAM && h === 12) h = 0

    let periodBn = ''
    if (h >= 4 && h < 12) periodBn = 'সকাল'
    else if (h >= 12 && h < 15) periodBn = 'দুপুর'
    else if (h >= 15 && h < 18) periodBn = 'বিকাল'
    else if (h >= 18 && h < 20) periodBn = 'সন্ধ্যা'
    else periodBn = 'রাত'
    
    let h12 = h % 12 || 12
    let timeBn = `${toBnNum(String(h12).padStart(2, '0'))}:${toBnNum(String(m).padStart(2, '0'))}`
    
    return `${periodBn} ${timeBn}`
  } catch {
    return timeStr
  }
}

function MyAppointmentsPage() {
  const navigate = useNavigate()
  const { i18n } = useTranslation()
  const language = i18n.language
  const { user, isLoggedIn } = useAuth() || {}

  const { data: appointments = [], isLoading: loading } = useQuery({
    queryKey: ['my-appointments', user?.id, user?.phone],
    refetchOnMount: 'always',
    staleTime: 0,
    queryFn: async () => {
      if (isLoggedIn) {
        try {
          const res = await getAppointments()
          let raw = res.data
          if (raw && raw.data) raw = raw.data
          if (raw && raw.data) raw = raw.data
          if (raw && raw.appointments) raw = raw.appointments
          if (raw && raw.items) raw = raw.items
          return Array.isArray(raw) ? raw : []
        } catch (e) {
          console.error('Failed to load appointments:', e)
          return []
        }
      }

      // Guest users only
      try {
        const rawLocal = JSON.parse(localStorage.getItem('my_appointments') || '[]')
        return Array.isArray(rawLocal) ? rawLocal : []
      } catch (e) {
        return []
      }
    },
  })

  const [downloadingRxId, setDownloadingRxId] = useState(null)
  const [rxDataForDownload, setRxDataForDownload] = useState(null)
  const rxPaperRef = useRef(null)

  const handleDirectDownloadPrescription = async (appt) => {
    const apptId = appt.id || appt._id || appt.appointment_id
    if (downloadingRxId) return
    setDownloadingRxId(apptId)
    const toastId = toast.loading('প্রেসক্রিপশন PDF ডাউনলোড হচ্ছে...')

    try {
      const prescId = appt.prescription_id || appt.prescription?.id || apptId
      let rx = null

      try {
        const res = await getPrescription(prescId)
        rx = res.data?.data || res.data
      } catch (e) {
        // Fallback: construct full prescription data from appointment & doctor details
      }

      const docName = appt.doctor_name || appt.doctor?.name || appt.doctor?.name_bn || 'ডা. ডক্টর'
      const specialty = appt.specialty || appt.doctor?.specialty?.name_bn || appt.doctor?.specialty?.name || appt.doctor?.specialty || 'সাধারণ চিকিৎসক'
      const degree = appt.degree || appt.doctor?.degree || appt.qualifications || 'MBBS'
      const location = appt.hospital_name || appt.hospital?.name || appt.chamber?.hospital?.name || appt.chamber_address || 'হাসপাতাল / চেম্বার'
      const patientName = appt.patient_name || appt.user_name || appt.user?.name || 'রোগী'
      const apptNumber = appt.tracking_id || `#MED-${String(apptId || 1).padStart(6, '0')}`

      if (!rx) {
        rx = {
          id: prescId,
          doctor_name: docName,
          doctor_name_bn: docName,
          doctor_specialty_bn: specialty,
          doctor_degree_bn: degree,
          doctor_workplace_bn: location,
          patient_name: patientName,
          created_at: appt.appointment_date || appt.date || new Date().toISOString(),
          registration_no: apptNumber,
          medicines: appt.medicines || [],
          chief_complaints: appt.notes || 'সাধারণ চিকিৎসা পরামর্শ',
        }
      }

      setRxDataForDownload(rx)

      // Wait for React to mount the PrescriptionPaper offscreen
      await new Promise(r => setTimeout(r, 450))

      if (!rxPaperRef.current) {
        throw new Error('Prescription paper ref not ready')
      }

      const A4_WIDTH_PX = 794
      const A4_HEIGHT_PX = 1123

      const canvas = await html2canvas(rxPaperRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        width: A4_WIDTH_PX,
        height: A4_HEIGHT_PX,
        onclone: (clonedDoc) => {
          const clonedPaper = clonedDoc.querySelector('.rx-paper')
          if (clonedPaper) {
            clonedPaper.style.width = '210mm'
            clonedPaper.style.height = '297mm'
            clonedPaper.style.margin = '0'
            clonedPaper.style.boxShadow = 'none'
            clonedPaper.style.border = 'none'
          }
        }
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      pdf.addImage(imgData, 'PNG', 0, 0, 210, 297)
      pdf.save(`Prescription_${apptNumber.replace(/[^a-zA-Z0-9_-]/g, '')}.pdf`)

      toast.success('প্রেসক্রিপশন ডাউনলোড সম্পন্ন হয়েছে!', { id: toastId })
    } catch (err) {
      console.error('PDF Direct Download Error:', err)
      toast.error('ডাউনলোড করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।', { id: toastId })
    } finally {
      setDownloadingRxId(null)
      setRxDataForDownload(null)
    }
  }

  return (
    <div className="page-wrapper" style={{ background: '#F0F4F8', minHeight: '100vh', paddingBottom: 72 }}>
      {/* ── Keyframe Animations ── */}
      <style>{`
        @keyframes pulseAlert {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        @keyframes pingDot {
          0% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.8); opacity: 0; }
          100% { transform: scale(1); opacity: 0; }
        }
      `}</style>

      {/* ── Navigation Header ── */}
      <Container style={{ paddingTop: 16, paddingBottom: 4 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          background: '#fff',
          padding: '10px 16px',
          borderRadius: 14,
          border: '1px solid #E2E8F0',
          boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
          marginBottom: 18,
        }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: '#F0FDF4', color: '#00966D',
              border: '1px solid #D1FAE5',
              padding: '7px 16px', borderRadius: 10,
              fontWeight: 700, fontSize: 13.5,
              cursor: 'pointer', flexShrink: 0,
              fontFamily: "'Hind Siliguri', sans-serif",
            }}
          >
            <ArrowLeft size={16} strokeWidth={2.5} />
            ফিরে যান
          </button>
          <h5 style={{
            margin: 0, fontWeight: 800, fontSize: 16.5, color: '#0F172A',
            fontFamily: "'Hind Siliguri', sans-serif",
          }}>
            আমার অ্যাপয়েন্টমেন্ট
          </h5>
        </div>
      </Container>

      {/* ── List ── */}
      <Container>
        {loading && <AppointmentListSkeleton count={4} />}

        {!loading && appointments.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '60px 24px',
            background: '#fff', borderRadius: 18,
            border: '1px solid #E5E7EB',
            boxShadow: '0 4px 18px rgba(0,0,0,0.05)',
          }}>
            <div style={{ fontSize: 52, marginBottom: 14 }}>📅</div>
            <h5 style={{ fontWeight: 800, color: '#0F172A', fontSize: 18, marginBottom: 8, fontFamily: "'Hind Siliguri', sans-serif" }}>
              কোনো অ্যাপয়েন্টমেন্ট পাওয়া যায়নি
            </h5>
            <p style={{ color: '#64748B', fontSize: 14, maxWidth: 380, margin: '0 auto 24px', fontFamily: "'Hind Siliguri', sans-serif" }}>
              আপনার কোনো সক্রিয় বা অতীত অ্যাপয়েন্টমেন্ট নেই। এখনই ডাক্তার খুঁজে নিন।
            </p>
            <button
              onClick={() => navigate('/doctors')}
              style={{
                background: 'linear-gradient(135deg, #00B875, #00966D)',
                color: '#fff', border: 'none',
                borderRadius: 12, padding: '12px 28px',
                fontWeight: 700, fontSize: 14.5, cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(0,184,117,0.3)',
                fontFamily: "'Hind Siliguri', sans-serif",
              }}
            >
              ডাক্তার খুঁজুন →
            </button>
          </div>
        )}

        {!loading && appointments.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {appointments.map((appt, idx) => {
              const status = appt.status || appt.appointment_status || 'pending'
              const ss = STATUS_STYLES[status] || STATUS_STYLES.pending

              const doctorName = appt.doctor_name || appt.doctor?.name || appt.doctor?.name_bn || 'ডা. অজানা'
              const specialty  = appt.specialty || appt.doctor?.specialty?.name_bn || appt.doctor?.specialty?.name || appt.doctor?.specialty || 'সাধারণ চিকিৎসক'
              const degree     = appt.degree || appt.doctor?.degree || appt.qualifications || 'MBBS'
              const location   = appt.hospital_name || appt.hospital?.name || appt.chamber?.hospital?.name || appt.chamber_address || 'চেম্বার / হাসপাতাল'

              // Doctor image — resolve storage path
              const BASE = import.meta.env.VITE_APP_URL || 'http://127.0.0.1:8000'
              const rawImg = appt.doctor?.image || appt.doctor?.photo || appt.doctor?.profile_photo || appt.doctor?.avatar || appt.doctor_image
              const doctorImg = rawImg ? (rawImg.startsWith('http') ? rawImg : `${BASE}/storage/${rawImg}`) : null

              const avatarColor = getAvatarColor(doctorName)
              const initials    = getInitials(doctorName)

              const rawDate = appt.appointment_date || appt.date || appt.created_at
              const rawTime = appt.appointment_time || appt.time || appt.schedule_time

              const dateDisplay = formatDateBn(rawDate)
              const timeDisplay = formatTimeBn(rawTime)
              const apptId = appt.id || appt._id || appt.appointment_id

              const serialNum = appt.serial_number || appt.serial_no || appt.serial || appt.id || 1
              const serialDisplay = `সিরিয়াল-${toBnNum(serialNum)}`

              return (
                <div
                  key={apptId || idx}
                  onClick={() => navigate(`/my-appointments/${apptId}`, { state: { appointment: appt } })}
                  style={{
                    background: '#fff',
                    borderRadius: 14,
                    border: '1px solid #E2E8F0',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    boxShadow: '0 2px 10px rgba(15,23,42,0.04)',
                    transition: 'all 0.2s ease',
                    padding: '16px 18px',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(15,23,42,0.08)'
                    e.currentTarget.style.borderColor = '#CBD5E1'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.boxShadow = '0 2px 10px rgba(15,23,42,0.04)'
                    e.currentTarget.style.borderColor = '#E2E8F0'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  {/* ── Doctor row ── */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 12 }}>

                    {/* Avatar / photo */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      {doctorImg ? (
                        <img
                          src={doctorImg}
                          alt={doctorName}
                          onError={e => {
                            e.target.style.display = 'none'
                            if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'
                          }}
                          style={{
                            width: 60, height: 60,
                            borderRadius: 12,
                            objectFit: 'cover',
                            border: '1.5px solid #E2E8F0',
                            display: 'block',
                          }}
                        />
                      ) : null}
                      <div style={{
                        width: 60, height: 60,
                        borderRadius: 12,
                        background: `linear-gradient(135deg, ${avatarColor.bg} 0%, ${avatarColor.bg}cc 100%)`,
                        color: avatarColor.text,
                        display: doctorImg ? 'none' : 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 22, fontWeight: 800,
                        border: '1.5px solid #E2E8F0',
                        letterSpacing: 0.5,
                        flexShrink: 0,
                        userSelect: 'none',
                      }}>
                        {initials}
                      </div>
                      {/* Status dot on avatar */}
                      <div style={{
                        position: 'absolute', bottom: -2, right: -2,
                        width: 12, height: 12,
                        borderRadius: '50%',
                        background: ss.dot,
                        border: '2px solid #fff',
                      }} />
                    </div>

                    {/* Doctor info + status badge */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 2 }}>
                        <h4 style={{
                          fontWeight: 800, color: '#0F172A',
                          fontSize: '1rem', margin: 0,
                          fontFamily: "'Hind Siliguri', sans-serif",
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {doctorName}
                        </h4>
                        {/* Status badge with Coming Alert Animation */}
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          background: (status === 'pending' || status === 'confirmed') ? '#ECFDF5' : ss.bg,
                          padding: '4px 10px',
                          borderRadius: 999,
                          border: `1px solid ${(status === 'pending' || status === 'confirmed') ? '#A7F3D0' : ss.dot + '33'}`,
                          flexShrink: 0,
                          boxShadow: (status === 'pending' || status === 'confirmed') ? '0 1px 4px rgba(16,185,129,0.15)' : 'none',
                        }}>
                          <div style={{ position: 'relative', width: 7, height: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {(status === 'pending' || status === 'confirmed') && (
                              <div style={{
                                position: 'absolute',
                                width: 14,
                                height: 14,
                                borderRadius: '50%',
                                background: '#10B981',
                                animation: 'pingDot 1.6s cubic-bezier(0, 0, 0.2, 1) infinite',
                                pointerEvents: 'none',
                              }} />
                            )}
                            <div style={{
                              width: 7,
                              height: 7,
                              borderRadius: '50%',
                              background: ss.dot,
                              boxShadow: (status === 'pending' || status === 'confirmed') ? '0 0 6px rgba(16,185,129,0.8)' : 'none',
                            }} />
                          </div>
                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: ss.color,
                            letterSpacing: 0.2,
                            fontFamily: "'Hind Siliguri', sans-serif"
                          }}>
                            {STATUS_MAP[status] || 'আসন্ন'}
                          </span>
                        </div>
                      </div>

                      {/* Specialty - clean text, no background */}
                      <div style={{
                        fontSize: '0.84rem', fontWeight: 600,
                        color: '#00966D',
                        fontFamily: "'Hind Siliguri', sans-serif",
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        marginTop: 1,
                      }}>
                        {specialty}
                      </div>

                      {/* Degree - on its own new line */}
                      <div style={{
                        fontSize: '0.76rem', color: '#64748B', fontWeight: 500,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        marginTop: 1,
                      }}>
                        {degree}
                      </div>

                      {/* Location */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                        <MapPin size={12} color="#94A3B8" style={{ flexShrink: 0 }} />
                        <span style={{
                          fontSize: '0.75rem', color: '#94A3B8',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          fontFamily: "'Hind Siliguri', sans-serif",
                        }}>
                          {location}
                        </span>
                      </div>

                      {/* Patient for badge if booked for someone else */}
                      {((appt.booking_for && appt.booking_for !== 'myself') || appt.for_patient_name) && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                          <User size={12} color="#0284C7" style={{ flexShrink: 0 }} />
                          <span style={{
                            fontSize: '0.74rem',
                            color: '#0369A1',
                            fontWeight: 700,
                            background: '#F0F9FF',
                            padding: '2px 7px',
                            borderRadius: 6,
                            border: '1px solid #BAE6FD',
                            fontFamily: "'Hind Siliguri', sans-serif",
                          }}>
                            রোগী: {appt.for_patient_name || appt.patient_name || appt.patient?.name} {appt.patient_relation || appt.for_patient_relation ? `(${appt.patient_relation || appt.for_patient_relation})` : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── Footer: Date chip + Time chip + Arrow in ONE single row ── */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    flexWrap: 'nowrap',
                    paddingTop: 10,
                    borderTop: '1px solid #F1F5F9'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'nowrap', minWidth: 0, flex: 1 }}>
                      {/* Serial chip */}
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        background: '#ECFDF5',
                        border: '1px solid #A7F3D0',
                        padding: '5px 9px',
                        borderRadius: 8,
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}>
                        <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#047857', fontFamily: "'Hind Siliguri', sans-serif" }}>
                          {serialDisplay}
                        </span>
                      </div>

                      {/* Date chip */}
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        background: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        padding: '5px 9px',
                        borderRadius: 8,
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}>
                        <Calendar size={13} color="#00B875" strokeWidth={2} style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: '0.74rem', fontWeight: 600, color: '#334155', fontFamily: "'Hind Siliguri', sans-serif" }}>
                          {dateDisplay}
                        </span>
                      </div>

                      {/* Time chip */}
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        background: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        padding: '5px 9px',
                        borderRadius: 8,
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}>
                        <Clock size={13} color="#00B875" strokeWidth={2} style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: '0.74rem', fontWeight: 600, color: '#334155', fontFamily: "'Hind Siliguri', sans-serif" }}>
                          {timeDisplay}
                        </span>
                      </div>
                    </div>

                    {/* Arrow CTA */}
                    <div style={{
                      width: 32, height: 32,
                      borderRadius: 8,
                      background: '#F0FDF4',
                      border: '1px solid #DCFCE7',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <ChevronRight size={17} color="#00966D" strokeWidth={2.5} />
                    </div>
                  </div>

                  {/* ── Prominent Dedicated Prescription Download Section for Completed Visits ── */}
                  {status === 'completed' && (
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px dashed #E2E8F0' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDirectDownloadPrescription(appt)
                        }}
                        disabled={downloadingRxId === (appt.id || appt._id || appt.appointment_id)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 7,
                          background: '#F0F7FF',
                          border: '1.5px solid #BFDBFE',
                          color: '#1D4ED8',
                          padding: '8px 14px',
                          borderRadius: 9,
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          cursor: downloadingRxId === (appt.id || appt._id || appt.appointment_id) ? 'not-allowed' : 'pointer',
                          opacity: downloadingRxId === (appt.id || appt._id || appt.appointment_id) ? 0.75 : 1,
                          transition: 'all 0.2s ease',
                          fontFamily: "'Hind Siliguri', sans-serif",
                          boxShadow: '0 1px 3px rgba(37,99,235,0.06)',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = '#DBEAFE'
                          e.currentTarget.style.borderColor = '#93C5FD'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = '#F0F7FF'
                          e.currentTarget.style.borderColor = '#BFDBFE'
                        }}
                        title="প্রেসক্রিপশন PDF ডাউনলোড করুন"
                      >
                        {downloadingRxId === (appt.id || appt._id || appt.appointment_id) ? (
                          <>
                            <Loader2 size={15} className="spinner-border spinner-border-sm" style={{ borderWidth: 2 }} />
                            <span>প্রেসক্রিপশন ডাউনলোড হচ্ছে...</span>
                          </>
                        ) : (
                          <>
                            <Download size={15} strokeWidth={2.2} />
                            <span>প্রেসক্রিপশন ডাউনলোড করুন (PDF)</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Container>

      {/* ── Offscreen Prescription Paper for Direct PDF Rendering ── */}
      {rxDataForDownload && (
        <div style={{ position: 'fixed', left: -9999, top: -9999, opacity: 0, pointerEvents: 'none', zIndex: -100 }}>
          <PrescriptionPaper ref={rxPaperRef} prescription={rxDataForDownload} />
        </div>
      )}
    </div>
  )
}

export default MyAppointmentsPage
