import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getAppointmentById } from '../api/appointmentApi'
import { getDoctorById, getDoctors, getDoctorChambers } from '../api/doctorApi'
import { useTranslation } from 'react-i18next'
import { Circle, Copy, Calendar, Clock, Building, MapPin, Phone, Info, User, X, Headset } from 'lucide-react'

const getAvatarColors = (name) => {
  const colors = [
    { bg: '#E0F2FE', text: '#0369A1' },
    { bg: '#FCE7F3', text: '#BE185D' },
    { bg: '#FEF3C7', text: '#B45309' },
    { bg: '#D1FAE5', text: '#047857' },
    { bg: '#F3E8FF', text: '#7E22CE' },
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

const getInitials = (name) => {
  if (!name) return 'U';
  const parts = name.replace('Dr.', '').replace('ডা.', '').trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0][0].toUpperCase();
}

export default function AppointmentTicketPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [appointment, setAppointment] = useState(null)
  
  const [extendedDoctor, setExtendedDoctor] = useState(null)
  const [chambers, setChambers] = useState([])
  
  const [loading, setLoading] = useState(true)
  const [refreshCount, setRefreshCount] = useState(0)
  const [error, setError] = useState('')
  const { t, i18n } = useTranslation()
  const language = i18n.language

  useEffect(() => {
    setLoading(true)
    setError('')
    getAppointmentById(id)
      .then(res => {
        const data = res.data?.data || res.data
        setAppointment(data)

        let doctorIdToFetch = data.doctor?.id || data.doctor_id

        const fetchFullDoctorContext = (dId) => {
           getDoctorById(dId).then(docRes => {
              setExtendedDoctor(docRes.data?.data || docRes.data)
           }).catch(() => {})
           
           getDoctorChambers({ doctor_id: dId }).then(chamRes => {
              const d = chamRes.data?.data || chamRes.data || []
              setChambers(Array.isArray(d) ? d : [])
           }).catch(() => {})
        }

        if (doctorIdToFetch) {
           fetchFullDoctorContext(doctorIdToFetch)
        } else if (data.doctor_name) {
           const cleanName = data.doctor_name.replace('Dr.', '').trim()
           getDoctors({ search: cleanName }).then(searchRes => {
              const results = searchRes.data?.data || searchRes.data || []
              const match = results.find(d => d.name.toLowerCase().includes(cleanName.toLowerCase())) || results[0]
              if (match?.id) {
                 fetchFullDoctorContext(match.id)
              }
           })
        }
      })
      .catch(() => setError('Failed to load appointment details. Please try again.'))
      .finally(() => setLoading(false))
  }, [id, refreshCount])

  if (loading) return <div className="page-wrapper spinner-center"><div className="spinner-border text-primary" /></div>
  
  if (error || !appointment) return (
    <div className="page-wrapper text-center my-5">
      <div className="container">
        <h4>{error || t('appointment_not_found') || 'Appointment not found.'}</h4>
        <div className="d-flex justify-content-center gap-2 mt-3">
          <button className="btn btn-primary" onClick={() => setRefreshCount(p => p + 1)}>{t('try_again') || 'Try Again'}</button>
          <button className="btn btn-outline-primary" onClick={() => navigate('/my-appointments')}>{t('back_to_list') || 'Back to List'}</button>
        </div>
      </div>
    </div>
  )

  const apptData = appointment
  const docName = apptData.doctor_name || extendedDoctor?.name || apptData.doctor?.name || 'Assigned Doctor'
  const avatarColor = getAvatarColors(docName)
  const initials = getInitials(docName)

  const apptDate = apptData.date || apptData.appointment_date
  const apptTime = apptData.time || apptData.appointment_time
  const apptNumber = apptData.tracking_id || `#MED-${apptData.id.toString().padStart(6, '0')}`

  const status = (apptData.status || 'pending').toLowerCase()
  let statusText = 'আসন্ন অ্যাপয়েন্টমেন্ট';
  let statusColor = '#10B981';
  let statusBg = '#10B981';
  
  if (status === 'cancelled') {
    statusText = 'বাতিল অ্যাপয়েন্টমেন্ট';
    statusColor = '#EF4444';
    statusBg = '#EF4444';
  } else if (status === 'completed') {
    statusText = 'সম্পন্ন অ্যাপয়েন্টমেন্ট';
    statusColor = '#3B82F6';
    statusBg = '#3B82F6';
  }

  const degreeString = extendedDoctor?.degree || apptData.doctor?.degree || 'MBBS'
  const specialtyString = extendedDoctor?.specialty?.name || apptData.doctor?.specialty?.name || extendedDoctor?.specialty_name || 'জেনারেল ফিজিশিয়ান'

  const uniqueHospitals = Array.from(new Set(chambers.filter(c => c.hospital).map(c => JSON.stringify({ name: c.hospital.name, address: c.hospital.address })))).map(s => JSON.parse(s))
  
  let currentHospitalName = extendedDoctor?.hospital?.name || apptData.hospital?.name || 'স্কয়ার হাসপাতাল, হবিগঞ্জ'
  let currentHospitalAddress = extendedDoctor?.hospital?.address || apptData.hospital?.address || 'হবিগঞ্জ, সিলেট'
  
  if (!extendedDoctor?.hospital?.name && !apptData.hospital?.name && uniqueHospitals.length > 0) {
      currentHospitalName = uniqueHospitals[0].name
      currentHospitalAddress = uniqueHospitals[0].address
  }

  const phoneNo = extendedDoctor?.phone || '01747465446'
  const patientName = apptData.user_name || apptData.user?.name || 'রনি ধর'
  const notes = apptData.notes ? apptData.notes.split('--- PAYMENT INFO ---')[0].trim() : 'N/A'

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    
  }

  return (
    <div className="page-wrapper" style={{ background: '#F3F4F6', minHeight: '100vh', paddingTop: '120px', paddingBottom: '40px', paddingLeft: '16px', paddingRight: '16px', display: 'flex', justifyContent: 'center' }}>
      
      <div style={{ background: '#FFFFFF', borderRadius: 20, width: '100%', maxWidth: 480, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', padding: 24, alignSelf: 'flex-start', marginTop: 32, fontFamily: '"Hind Siliguri", "Noto Sans Bengali", sans-serif', lineHeight: 1.4 }}>
        
        {/* Top Section: Status & Serial */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
             <Circle size={8} fill={statusBg} color={statusBg} />
             <span style={{ color: statusColor, fontWeight: 700, fontSize: 13 }}>{statusText}</span>
           </div>
           <div style={{ textAlign: 'right' }}>
             <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, marginBottom: 2, fontFamily: 'sans-serif' }}>সিরিয়াল নং</div>
             <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: '#111827', fontFamily: 'monospace' }}>{apptNumber}</span>
             </div>
           </div>
        </div>

        {/* Doctor Info */}
        <div style={{ background: '#F9FAFB', borderRadius: 16, padding: 16, display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
           {apptData.doctor?.image || extendedDoctor?.image ? (
             <img src={apptData.doctor?.image || extendedDoctor?.image} style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }} alt="Doctor" />
           ) : (
             <div style={{ width: 64, height: 64, borderRadius: '50%', background: avatarColor.bg, color: avatarColor.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700 }}>
               {initials}
             </div>
           )}
           <div>
             <h4 style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: 0, marginBottom: 4 }}>{docName}</h4>
             <div style={{ fontSize: 13, fontWeight: 700, color: '#059669', marginBottom: 4 }}>{specialtyString}</div>
             <div style={{ fontSize: 12, fontWeight: 500, color: '#4B5563' }}>{degreeString}</div>
           </div>
        </div>

        {/* Appointment Details List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 28, padding: '0 4px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Calendar size={18} color="#059669" />
                <span style={{ fontSize: 14, color: '#4B5563', fontWeight: 600 }}>তারিখ</span>
             </div>
             <span style={{ fontSize: 14, color: '#111827', fontWeight: 700 }}>
               {apptDate ? new Date(apptDate).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}
             </span>
          </div>
          
          <div style={{ height: 1, background: '#F3F4F6' }}></div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Clock size={18} color="#059669" />
                <span style={{ fontSize: 14, color: '#4B5563', fontWeight: 600 }}>সময়</span>
             </div>
             <span style={{ fontSize: 14, color: '#111827', fontWeight: 700 }}>{apptTime || 'N/A'}</span>
          </div>

          <div style={{ height: 1, background: '#F3F4F6' }}></div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Building size={18} color="#059669" />
                <span style={{ fontSize: 14, color: '#4B5563', fontWeight: 600 }}>হাসপাতাল / চেম্বার</span>
             </div>
             <div style={{ textAlign: 'right' }}>
               <div style={{ fontSize: 14, color: '#111827', fontWeight: 700, marginBottom: 4 }}>{currentHospitalName}</div>
               <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>{currentHospitalAddress}</div>
             </div>
          </div>

          <div style={{ height: 1, background: '#F3F4F6' }}></div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Phone size={18} color="#059669" />
                <span style={{ fontSize: 14, color: '#4B5563', fontWeight: 600 }}>অফিস নম্বর</span>
             </div>
             <span style={{ fontSize: 14, color: '#111827', fontWeight: 700, fontFamily: 'monospace' }}>{phoneNo}</span>
          </div>
        </div>

        {/* Important Instructions */}
        <div style={{ background: '#F0FDF4', borderRadius: 16, padding: 18, marginBottom: 24 }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Info size={18} color="#059669" />
              <span style={{ fontSize: 15, fontWeight: 800, color: '#059669' }}>গুরুত্বপূর্ণ নির্দেশনা</span>
           </div>
           <ul style={{ margin: 0, paddingLeft: 22, fontSize: 13, color: '#4B5563', display: 'flex', flexDirection: 'column', gap: 6, fontWeight: 500, lineHeight: 1.5 }}>
             <li>আপনার অ্যাপয়েন্টমেন্ট সময়ের ১৫ মিনিট আগে আসুন।</li>
             <li>পূর্বে করা মেডিকেল রিপোর্ট সাথে আনুন (যদি থাকে)।</li>
             <li>এই স্লিপ অ্যাপয়েন্টমেন্টের প্রমাণ হিসেবে ব্যবহার করুন।</li>
           </ul>
        </div>

        {/* Patient Info */}
        <div style={{ border: '1px solid #E5E7EB', borderRadius: 16, padding: 18, marginBottom: 16 }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <User size={18} color="#059669" />
              <span style={{ fontSize: 15, fontWeight: 800, color: '#059669' }}>রোগীর তথ্য</span>
           </div>
           <div style={{ display: 'flex' }}>
             <div style={{ flex: 1, borderRight: '1px solid #E5E7EB' }}>
               <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 6, fontWeight: 500 }}>রোগীর নাম</div>
               <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{patientName}</div>
             </div>
             <div style={{ flex: 1, paddingLeft: 16 }}>
               <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 6, fontWeight: 500 }}>উপসর্গ / নোট</div>
               <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{notes}</div>
             </div>
           </div>
        </div>

        {/* Appointment ID Box */}
        <div style={{ background: '#FAFAFA', border: '1px solid #E5E7EB', borderRadius: 16, padding: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
           <div>
             <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 600, marginBottom: 6, fontFamily: 'sans-serif' }}>অ্যাপয়েন্টমেন্ট আইডি</div>
             <div style={{ fontSize: 18, fontWeight: 800, color: '#111827', fontFamily: 'monospace' }}>{apptNumber}</div>
           </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexDirection: 'row' }}>
           <button onClick={() => navigate('/doctors')} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#FFFFFF', border: '1px solid #059669', color: '#059669', padding: '12px', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
              <Calendar size={18} /> পুনরায় বুক করুন
           </button>
           <button style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#FFFFFF', border: '1px solid #DC2626', color: '#DC2626', padding: '12px', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
              <X size={18} /> বাতিল করুন
           </button>
        </div>

        {/* Help Section */}
        <div style={{ background: '#F9FAFB', borderRadius: 16, padding: 18, display: 'flex', alignItems: 'center', gap: 16 }}>
           <Headset size={28} color="#059669" />
           <div>
             <div style={{ fontSize: 13, fontWeight: 600, color: '#4B5563', marginBottom: 2 }}>সাহায্য প্রয়োজন?</div>
             <div style={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>09638649314</div>
           </div>
        </div>

      </div>
    </div>
  )
}
