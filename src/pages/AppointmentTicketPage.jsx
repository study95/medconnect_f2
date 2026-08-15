import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Container } from 'react-bootstrap'
import { getAppointmentById, cancelAppointment } from '../api/appointmentApi'
import { getDoctorById, getDoctors, getDoctorChambers } from '../api/doctorApi'
import { getPrescription } from '../api/adminApi'
import { useTranslation } from 'react-i18next'
import { Calendar, Clock, Building, MapPin, Phone, Info, User, X, Headset, ArrowLeft, CheckCircle2, AlertCircle, FileText, Download, Loader2 } from 'lucide-react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import PrescriptionPaper from '../components/common/PrescriptionPaper'
import toast from 'react-hot-toast'
import '../styles/prescription.css'

const AVATAR_COLORS = [
  { bg: '#E0F2FE', text: '#0369A1' },
  { bg: '#FCE7F3', text: '#BE185D' },
  { bg: '#FEF3C7', text: '#B45309' },
  { bg: '#D1FAE5', text: '#047857' },
  { bg: '#F3E8FF', text: '#7E22CE' },
]

const getAvatarColors = (name = '') => {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

const getInitials = (name = '') => {
  if (!name) return 'D'
  const parts = name.replace(/ডা\.|Dr\./g, '').trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return (parts[0]?.[0] || 'D').toUpperCase()
}

export default function AppointmentTicketPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  // Helper to find cached or passed appointment
  const getInitialAppointment = () => {
    if (location.state?.appointment) return location.state.appointment
    try {
      const localList = JSON.parse(localStorage.getItem('my_appointments') || '[]')
      const found = localList.find(item => String(item.id || item._id || item.appointment_id) === String(id))
      if (found) return found
    } catch (e) {}
    return null
  }

  const [appointment, setAppointment] = useState(getInitialAppointment)
  const [extendedDoctor, setExtendedDoctor] = useState(null)
  const [chambers, setChambers] = useState([])
  const [loading, setLoading] = useState(!getInitialAppointment())
  const [refreshCount, setRefreshCount] = useState(0)
  const [error, setError] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [downloadingRx, setDownloadingRx] = useState(false)
  const [rxDataForDownload, setRxDataForDownload] = useState(null)
  const rxPaperRef = useRef(null)
  const { t, i18n } = useTranslation()
  const language = i18n.language

  useEffect(() => {
    let isMounted = true
    setError('')

    const fetchFullDoctorContext = (dId) => {
      if (!dId) return
      getDoctorById(dId).then(docRes => {
        if (isMounted) setExtendedDoctor(docRes.data?.data || docRes.data)
      }).catch(() => {})

      getDoctorChambers({ doctor_id: dId }).then(chamRes => {
        const d = chamRes.data?.data || chamRes.data || []
        if (isMounted) setChambers(Array.isArray(d) ? d : [])
      }).catch(() => {})
    }

    const loadLocalFallback = () => {
      try {
        const localList = JSON.parse(localStorage.getItem('my_appointments') || '[]')
        const found = localList.find(item => String(item.id || item._id || item.appointment_id) === String(id))
        if (found) {
          if (isMounted) {
            setAppointment(found)
            setError('')
          }
          const dId = found.doctor?.id || found.doctor_id
          if (dId) fetchFullDoctorContext(dId)
          return true
        }
      } catch (e) {}
      return false
    }

    // If initial appointment is present, fetch doctor details right away
    if (appointment) {
      const dId = appointment.doctor?.id || appointment.doctor_id
      if (dId) fetchFullDoctorContext(dId)
    }

    getAppointmentById(id)
      .then(res => {
        if (!isMounted) return
        const data = res.data?.data || res.data
        if (data) {
          setAppointment(data)
          let doctorIdToFetch = data.doctor?.id || data.doctor_id

          if (doctorIdToFetch) {
            fetchFullDoctorContext(doctorIdToFetch)
          } else if (data.doctor_name) {
            const cleanName = data.doctor_name.replace('Dr.', '').trim()
            getDoctors({ search: cleanName }).then(searchRes => {
              if (!isMounted) return
              const results = searchRes.data?.data || searchRes.data || []
              const match = results.find(d => d.name.toLowerCase().includes(cleanName.toLowerCase())) || results[0]
              if (match?.id) {
                fetchFullDoctorContext(match.id)
              }
            }).catch(() => {})
          }
        }
      })
      .catch(() => {
        if (!isMounted) return
        const hasLocal = loadLocalFallback()
        if (!hasLocal && !appointment && !location.state?.appointment) {
          setError('অ্যাপয়েন্টমেন্ট তথ্য লোড করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।')
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => { isMounted = false }
  }, [id, refreshCount])

  const handleCancelAppointment = async () => {
    setCancelling(true)
    try {
      await cancelAppointment(id)
      toast.success('অ্যাপয়েন্টমেন্ট সফলভাবে বাতিল করা হয়েছে')
      setShowCancelModal(false)
      setRefreshCount(p => p + 1)
    } catch (err) {
      toast.error('বাতিল করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।')
    } finally {
      setCancelling(false)
    }
  }

  const handleDirectDownloadPDF = async () => {
    if (downloadingRx) return
    setDownloadingRx(true)
    const toastId = toast.loading('প্রেসক্রিপশন PDF ডাউনলোড হচ্ছে...')

    try {
      const prescId = apptData.prescription_id || apptData.prescription?.id || apptData.id
      let rx = null

      try {
        const res = await getPrescription(prescId)
        rx = res.data?.data || res.data
      } catch (e) {
        // Fallback: construct full prescription data from appointment & doctor details
      }

      if (!rx) {
        rx = {
          id: prescId,
          doctor_name: docName,
          doctor_name_bn: docName,
          doctor_specialty_bn: specialtyString,
          doctor_degree_bn: degreeString,
          doctor_workplace_bn: currentHospitalName,
          patient_name: patientName,
          created_at: apptDate || new Date().toISOString(),
          registration_no: apptNumber,
          medicines: apptData.medicines || [],
          chief_complaints: apptData.notes || 'সাধারণ চিকিৎসা পরামর্শ',
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
      setDownloadingRx(false)
      setRxDataForDownload(null)
    }
  }

  if (loading && !appointment) {
    return (
      <div style={{ background: '#F0F4F8', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 80 }}>
        <div className="spinner-border text-success" role="status" />
      </div>
    )
  }

  if (error || !appointment) {
    return (
      <div style={{ background: '#F0F4F8', minHeight: '100vh', paddingTop: 40, paddingBottom: 60 }}>
        <Container style={{ maxWidth: 480 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '40px 24px', textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>⚠️</div>
            <h5 style={{ fontWeight: 800, color: '#0F172A', marginBottom: 12, fontFamily: "'Hind Siliguri', sans-serif" }}>
              {error || 'অ্যাপয়েন্টমেন্ট পাওয়া যায়নি'}
            </h5>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 20 }}>
              <button
                onClick={() => setRefreshCount(p => p + 1)}
                style={{
                  background: '#00B875', color: '#fff', border: 'none',
                  padding: '9px 20px', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer'
                }}
              >
                আবার চেষ্টা করুন
              </button>
              <button
                onClick={() => navigate('/my-appointments')}
                style={{
                  background: '#F1F5F9', color: '#334155', border: '1px solid #CBD5E1',
                  padding: '9px 20px', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer'
                }}
              >
                তালিকায় ফিরে যান
              </button>
            </div>
          </div>
        </Container>
      </div>
    )
  }

  const apptData = appointment
  const docName = apptData.doctor_name || extendedDoctor?.name || apptData.doctor?.name || 'ডা. অজানা'
  const avatarColor = getAvatarColors(docName)
  const initials = getInitials(docName)

  const BASE = import.meta.env.VITE_APP_URL || 'http://127.0.0.1:8000'
  const rawImg = apptData.doctor?.image || apptData.doctor?.photo || extendedDoctor?.image || extendedDoctor?.photo || apptData.doctor_image
  const doctorImg = rawImg ? (rawImg.startsWith('http') ? rawImg : `${BASE}/storage/${rawImg}`) : null

  const apptDate = apptData.date || apptData.appointment_date
  const apptTime = apptData.time || apptData.appointment_time
  const apptNumber = apptData.tracking_id || `#MED-${String(apptData.id || 1).padStart(6, '0')}`

  const status = (apptData.status || 'pending').toLowerCase()
  let statusText = 'আসন্ন অ্যাপয়েন্টমেন্ট'
  let statusColor = '#047857'
  let statusBg = '#ECFDF5'
  let statusDot = '#10B981'
  let isUpcoming = true

  if (status === 'cancelled') {
    statusText = 'বাতিল অ্যাপয়েন্টমেন্ট'
    statusColor = '#DC2626'
    statusBg = '#FEF2F2'
    statusDot = '#EF4444'
    isUpcoming = false
  } else if (status === 'completed') {
    statusText = 'সম্পন্ন অ্যাপয়েন্টমেন্ট'
    statusColor = '#2563EB'
    statusBg = '#EFF6FF'
    statusDot = '#3B82F6'
    isUpcoming = false
  }

  const degreeString = extendedDoctor?.degree || apptData.doctor?.degree || apptData.degree || 'MBBS'
  const specialtyString = extendedDoctor?.specialty?.name_bn || extendedDoctor?.specialty?.name || apptData.doctor?.specialty?.name_bn || apptData.doctor?.specialty?.name || apptData.specialty || 'সাধারণ চিকিৎসক'

  const uniqueHospitals = Array.from(new Set(chambers.filter(c => c.hospital).map(c => JSON.stringify({ name: c.hospital.name, address: c.hospital.address })))).map(s => JSON.parse(s))

  let currentHospitalName = extendedDoctor?.hospital?.name || apptData.hospital?.name || apptData.hospital_name || 'স্কয়ার হাসপাতাল, ঢাকা'
  let currentHospitalAddress = extendedDoctor?.hospital?.address || apptData.hospital?.address || apptData.chamber_address || 'ঢাকা'

  if (!extendedDoctor?.hospital?.name && !apptData.hospital?.name && uniqueHospitals.length > 0) {
    currentHospitalName = uniqueHospitals[0].name
    currentHospitalAddress = uniqueHospitals[0].address
  }

  const phoneNo = extendedDoctor?.phone || apptData.doctor?.phone || '09638649314'
  const bookingFor = apptData.booking_for || apptData.patient?.booking_for || 'myself'
  const forPatientName = apptData.for_patient_name || apptData.patient_name || apptData.patient?.patient_name
  const isOther = (bookingFor !== 'myself' && Boolean(forPatientName)) || (Boolean(apptData.for_patient_name))
  const patientName = isOther ? forPatientName : (apptData.patient_name || apptData.user_name || apptData.user?.name || apptData.patient?.name || 'রোগী')
  const patientAge = apptData.for_patient_age || apptData.patient_age || apptData.patient?.patient_age
  const patientRelation = apptData.for_patient_relation || apptData.patient_relation || apptData.patient?.patient_relation
  const notes = apptData.notes ? apptData.notes.split('--- PAYMENT INFO ---')[0].trim() : 'N/A'

  return (
    <div className="page-wrapper" style={{ background: '#F0F4F8', minHeight: '100vh', paddingBottom: 72 }}>
      {/* ── Keyframe Animations ── */}
      <style>{`
        @keyframes pingDot {
          0% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.8); opacity: 0; }
          100% { transform: scale(1); opacity: 0; }
        }
      `}</style>

      {/* ── Top Navigation Bar ── */}
      <Container style={{ paddingTop: 16, paddingBottom: 4, maxWidth: 520 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          background: '#fff',
          padding: '10px 16px',
          borderRadius: 14,
          border: '1px solid #E2E8F0',
          boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
          marginBottom: 16,
        }}>
          <button
            onClick={() => navigate('/my-appointments')}
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
            অ্যাপয়েন্টমেন্ট বিবরণ
          </h5>
        </div>
      </Container>

      {/* ── Main Details Card ── */}
      <Container style={{ maxWidth: 520 }}>
        <div style={{
          background: '#FFFFFF',
          borderRadius: 18,
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 18px rgba(15,23,42,0.05)',
          padding: '22px 20px',
          fontFamily: '"Hind Siliguri", sans-serif',
        }}>

          {/* Top Status & Serial Row */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: 16,
            borderBottom: '1px solid #F1F5F9',
            marginBottom: 18,
          }}>
            {/* Status with live alert indicator */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: statusBg,
              padding: '4px 12px',
              borderRadius: 999,
              border: `1px solid ${isUpcoming ? '#A7F3D0' : statusDot + '33'}`,
            }}>
              <div style={{ position: 'relative', width: 8, height: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isUpcoming && (
                  <div style={{
                    position: 'absolute',
                    width: 15,
                    height: 15,
                    borderRadius: '50%',
                    background: statusDot,
                    animation: 'pingDot 1.6s cubic-bezier(0, 0, 0.2, 1) infinite',
                  }} />
                )}
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusDot }} />
              </div>
              <span style={{ fontSize: '0.76rem', fontWeight: 700, color: statusColor }}>
                {statusText}
              </span>
            </div>

            {/* Serial / Tracking ID */}
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>সিরিয়াল নম্বর</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', fontFamily: 'monospace' }}>
                {apptNumber}
              </div>
            </div>
          </div>

          {/* Doctor Info Card */}
          <div style={{
            background: '#F8FAFC',
            borderRadius: 14,
            border: '1px solid #E2E8F0',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            marginBottom: 20,
          }}>
            {doctorImg ? (
              <img
                src={doctorImg}
                alt={docName}
                onError={e => {
                  e.target.style.display = 'none'
                  if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'
                }}
                style={{ width: 62, height: 62, borderRadius: 12, objectFit: 'cover', border: '1.5px solid #CBD5E1', display: 'block', flexShrink: 0 }}
              />
            ) : null}
            <div style={{
              width: 62, height: 62,
              borderRadius: 12,
              background: `linear-gradient(135deg, ${avatarColor.bg} 0%, ${avatarColor.bg}cc 100%)`,
              color: avatarColor.text,
              display: doctorImg ? 'none' : 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22, fontWeight: 800,
              border: '1.5px solid #CBD5E1',
              flexShrink: 0,
            }}>
              {initials}
            </div>

            <div style={{ minWidth: 0, flex: 1 }}>
              <h4 style={{ fontSize: '1.02rem', fontWeight: 800, color: '#0F172A', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {docName}
              </h4>
              <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#00966D', marginTop: 2 }}>
                {specialtyString}
              </div>
              <div style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 500, marginTop: 1 }}>
                {degreeString}
              </div>
            </div>
          </div>

          {/* Appointment Details List */}
          <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 18 }}>
            {/* Date */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid #F1F5F9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Calendar size={15} color="#00B875" />
                </div>
                <span style={{ fontSize: 13.5, color: '#64748B', fontWeight: 600 }}>তারিখ</span>
              </div>
              <span style={{ fontSize: 13.5, color: '#0F172A', fontWeight: 700 }}>
                {apptDate ? new Date(apptDate).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
              </span>
            </div>

            {/* Time */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid #F1F5F9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Clock size={15} color="#00B875" />
                </div>
                <span style={{ fontSize: 13.5, color: '#64748B', fontWeight: 600 }}>সময়</span>
              </div>
              <span style={{ fontSize: 13.5, color: '#0F172A', fontWeight: 700 }}>
                {apptTime || 'N/A'}
              </span>
            </div>

            {/* Hospital / Chamber */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '9px 0', borderBottom: '1px solid #F1F5F9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Building size={15} color="#00B875" />
                </div>
                <span style={{ fontSize: 13.5, color: '#64748B', fontWeight: 600 }}>হাসপাতাল / চেম্বার</span>
              </div>
              <div style={{ textAlign: 'right', maxWidth: 220 }}>
                <div style={{ fontSize: 13.5, color: '#0F172A', fontWeight: 700 }}>{currentHospitalName}</div>
                <div style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 1 }}>{currentHospitalAddress}</div>
              </div>
            </div>

            {/* Helpline / Office phone */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Phone size={15} color="#00B875" />
                </div>
                <span style={{ fontSize: 13.5, color: '#64748B', fontWeight: 600 }}>অফিস নম্বর</span>
              </div>
              <a href={`tel:${phoneNo}`} style={{ fontSize: 13.5, color: '#00966D', fontWeight: 700, fontFamily: 'monospace', textDecoration: 'none' }}>
                {phoneNo}
              </a>
            </div>
          </div>

          {/* Patient Info Box */}
          <div style={{
            border: '1px solid #E2E8F0',
            borderRadius: 14,
            padding: '14px 16px',
            marginBottom: 16,
            background: '#fff',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <User size={16} color="#00966D" />
                <span style={{ fontSize: 14, fontWeight: 800, color: '#00966D' }}>রোগীর তথ্য</span>
              </div>
              {isOther && (
                <span style={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: '#0284C7',
                  background: '#F0F9FF',
                  border: '1px solid #BAE6FD',
                  padding: '2px 8px',
                  borderRadius: 20
                }}>
                  অন্যের জন্য বুকিং {patientRelation ? `(${patientRelation})` : ''}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1, borderRight: '1px solid #F1F5F9', paddingRight: 8 }}>
                <div style={{ fontSize: 11.5, color: '#94A3B8', fontWeight: 600, marginBottom: 3 }}>রোগীর নাম</div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A' }}>
                  {patientName}
                  {patientAge ? <span style={{ fontSize: 12, color: '#64748B', fontWeight: 500, marginLeft: 4 }}>({patientAge} বছর)</span> : ''}
                </div>
              </div>
              <div style={{ flex: 1, paddingLeft: 8 }}>
                <div style={{ fontSize: 11.5, color: '#94A3B8', fontWeight: 600, marginBottom: 3 }}>উপসর্গ / নোট</div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A' }}>{notes}</div>
              </div>
            </div>
          </div>

          {/* Important Instructions Box */}
          <div style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: 14,
            padding: '14px 16px',
            marginBottom: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <Info size={16} color="#00966D" />
                <span style={{ fontSize: 13.5, fontWeight: 800, color: '#00966D' }}>গুরুত্বপূর্ণ নির্দেশনা ও নীতিমালা</span>
              </div>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: '#64748B', background: '#F1F5F9', padding: '2px 7px', borderRadius: 6 }}>
                জরুরি তথ্য
              </span>
            </div>
            
            <ul style={{
              margin: 0,
              paddingLeft: 18,
              fontSize: 12,
              color: '#334155',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              fontWeight: 500,
              lineHeight: 1.5
            }}>
              <li>
                <strong style={{ color: '#0F172A' }}>উপস্থিতির সময়:</strong> নির্ধারিত সময়ের কমপক্ষে <strong>১৫–২০ মিনিট পূর্বে</strong> উপস্থিত হয়ে অভ্যর্থনায় সিরিয়াল নিশ্চিত করুন।
              </li>
              <li>
                <strong style={{ color: '#0F172A' }}>সময়সূচি পরিবর্তন/বাতিল:</strong> চিকিৎসকের জরুরি অপারেশন, জরুরি রোগী দেখা বা অনিবার্য কারণে হাসপাতাল কর্তৃপক্ষ যেকোনো সময় অ্যাপয়েন্টমেন্ট বাতিল বা সময়সূচি পুনর্নির্ধারণ করার অধিকার রাখে।
              </li>
              <li>
                <strong style={{ color: '#0F172A' }}>মেডিকেল রেকর্ড:</strong> রোগীর পূর্ববর্তী প্রেসক্রিপশন, ল্যাব টেস্ট বা ডায়াগনস্টিক রিপোর্টসমূহ সাথে রাখুন।
              </li>
              <li>
                <strong style={{ color: '#0F172A' }}>সিরিয়াল নীতি:</strong> দেরিতে উপস্থিত হলে পূর্বনির্ধারিত সিরিয়াল বাতিল হতে পারে এবং চিকিৎসকের সুবিধাজনক পরবর্তী স্লটে দেখা হবে।
              </li>
              <li>
                <strong style={{ color: '#0F172A' }}>প্রমাণপত্র:</strong> এই ডিজিটাল টিকিট বা কনফার্মেশন এসএমএসটি চেম্বার/হাসপাতাল কাউন্টারে প্রদর্শন করুন।
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
            <button
              onClick={() => navigate('/doctors')}
              style={{
                flex: 1,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                background: '#F0FDF4',
                border: '1.5px solid #00B875',
                color: '#00966D',
                padding: '10px',
                borderRadius: 10,
                fontSize: 13.5,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <Calendar size={16} />
              পুনরায় বুক করুন
            </button>

            {status === 'completed' ? (
              <button
                onClick={handleDirectDownloadPDF}
                disabled={downloadingRx}
                style={{
                  flex: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  background: '#EFF6FF',
                  border: '1.5px solid #3B82F6',
                  color: '#2563EB',
                  padding: '10px',
                  borderRadius: 10,
                  fontSize: 13.5,
                  fontWeight: 700,
                  cursor: downloadingRx ? 'not-allowed' : 'pointer',
                  opacity: downloadingRx ? 0.75 : 1,
                  transition: 'all 0.2s ease',
                }}
              >
                {downloadingRx ? (
                  <>
                    <Loader2 size={16} className="spinner-border spinner-border-sm" style={{ borderWidth: 2 }} />
                    ডাউনলোড হচ্ছে...
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    প্রেসক্রিপশন
                  </>
                )}
              </button>
            ) : status !== 'cancelled' ? (
              <button
                onClick={() => setShowCancelModal(true)}
                style={{
                  flex: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  background: '#FEF2F2',
                  border: '1.5px solid #EF4444',
                  color: '#DC2626',
                  padding: '10px',
                  borderRadius: 10,
                  fontSize: 13.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <X size={16} />
                বাতিল করুন
              </button>
            ) : null}
          </div>

          {/* Help Section */}
          <div style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: 14,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Headset size={20} color="#00B875" />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>সাহায্য প্রয়োজন?</div>
                <div style={{ fontSize: 14.5, fontWeight: 800, color: '#0F172A' }}>09638649314</div>
              </div>
            </div>
            <a
              href="tel:09638649314"
              style={{
                background: '#00B875',
                color: '#fff',
                textDecoration: 'none',
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: 12.5,
                fontWeight: 700,
              }}
            >
              কল করুন
            </a>
          </div>

        </div>
      </Container>

      {/* ── Cancel Confirmation Modal ── */}
      {showCancelModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.55)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
          zIndex: 9999,
          fontFamily: '"Hind Siliguri", sans-serif',
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 18,
            maxWidth: 380,
            width: '100%',
            padding: 24,
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: '#FEF2F2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <AlertCircle size={28} />
            </div>
            <h5 style={{ fontWeight: 800, color: '#0F172A', marginBottom: 8, fontSize: 17 }}>
              অ্যাপয়েন্টমেন্ট বাতিল করবেন?
            </h5>
            <p style={{ fontSize: 13.5, color: '#64748B', marginBottom: 20, lineHeight: 1.5 }}>
              আপনি কি নিশ্চিত যে আপনি এই অ্যাপয়েন্টমেন্টটি বাতিল করতে চান? বাতিল করার পর পুনরায় বুকিং করতে হবে।
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={cancelling}
                style={{
                  flex: 1,
                  background: '#F1F5F9',
                  border: '1px solid #CBD5E1',
                  color: '#334155',
                  padding: '10px',
                  borderRadius: 10,
                  fontSize: 13.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                না, ফিরে যাই
              </button>
              <button
                onClick={handleCancelAppointment}
                disabled={cancelling}
                style={{
                  flex: 1,
                  background: '#DC2626',
                  border: 'none',
                  color: '#fff',
                  padding: '10px',
                  borderRadius: 10,
                  fontSize: 13.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {cancelling ? 'বাতিল হচ্ছে...' : 'হ্যাঁ, বাতিল করুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Offscreen Prescription Paper for Direct Canvas to PDF Rendering ── */}
      {rxDataForDownload && (
        <div style={{ position: 'fixed', left: -9999, top: -9999, opacity: 0, pointerEvents: 'none', zIndex: -100 }}>
          <PrescriptionPaper ref={rxPaperRef} prescription={rxDataForDownload} />
        </div>
      )}
    </div>
  )
}
