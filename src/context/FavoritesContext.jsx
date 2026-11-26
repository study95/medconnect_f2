import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'
import { useDialog } from '../hooks/useDialog'
import toast from 'react-hot-toast'
import { IconHeart, IconStethoscope, IconBuildingHospital, IconX, IconTrash } from '@tabler/icons-react'

if (typeof window !== 'undefined' && !window.__FavoritesContext) {
  window.__FavoritesContext = createContext(null)
}
const FavoritesContext = typeof window !== 'undefined' ? window.__FavoritesContext : createContext(null)

const getItemDisplayName = (item, type) => {
  if (!item) return type === 'doctor' ? 'ডাক্তার' : 'হাসপাতাল'
  if (typeof item.name === 'string' && item.name.trim()) return item.name
  if (typeof item.name_bn === 'string' && item.name_bn.trim()) return item.name_bn
  if (typeof item.title === 'string' && item.title.trim()) return item.title
  return type === 'doctor' ? 'ডাক্তার' : 'হাসপাতাল'
}

const getItemSubInfo = (item, type) => {
  if (!item) return ''
  if (type === 'doctor') {
    if (typeof item.specialty_name === 'string' && item.specialty_name.trim()) return item.specialty_name
    if (item.specialty && typeof item.specialty === 'object') {
      const name = item.specialty.name_bn || item.specialty.name || item.specialty.title_bn || item.specialty.title
      if (typeof name === 'string' && name.trim()) return name
    }
    if (typeof item.specialty === 'string' && item.specialty.trim()) return item.specialty
    if (item.department && typeof item.department === 'object') {
      const dept = item.department.name_bn || item.department.name
      if (typeof dept === 'string' && dept.trim()) return dept
    }
    if (typeof item.department === 'string' && item.department.trim()) return item.department
    if (typeof item.designation === 'string' && item.designation.trim()) return item.designation
    return 'বিশেষজ্ঞ ডাক্তার'
  } else {
    if (typeof item.address === 'string' && item.address.trim()) return item.address
    if (typeof item.location === 'string' && item.location.trim()) return item.location
    if (typeof item.district_name === 'string' && item.district_name.trim()) return item.district_name
    return 'হাসপাতাল'
  }
}

export function FavoritesProvider({ children }) {
  const { user, isLoggedIn } = useAuth()
  const { showDialog } = useDialog()
  const navigate = useNavigate()
  const location = useLocation()

  const [favoriteDoctors, setFavoriteDoctors] = useState([])
  const [favoriteHospitals, setFavoriteHospitals] = useState([])

  // Modal state for confirming addition or removal of favorites
  const [confirmModal, setConfirmModal] = useState({ open: false, action: 'add', type: null, item: null })

  // Load favorites for logged-in user
  useEffect(() => {
    if (isLoggedIn && user?.id) {
      const savedDocs = localStorage.getItem(`favorites_doctors_${user.id}`)
      const savedHosps = localStorage.getItem(`favorites_hospitals_${user.id}`)
      
      setFavoriteDoctors(savedDocs ? JSON.parse(savedDocs) : [])
      setFavoriteHospitals(savedHosps ? JSON.parse(savedHosps) : [])

      // Check if there is a pending favorite action from before login
      processPendingFavorite(user.id)
    } else {
      setFavoriteDoctors([])
      setFavoriteHospitals([])
    }
  }, [isLoggedIn, user?.id])

  const processPendingFavorite = (userId) => {
    try {
      const pendingRaw = localStorage.getItem('pending_favorite')
      if (!pendingRaw) return
      
      const pending = JSON.parse(pendingRaw)
      if (!pending || !pending.type || !pending.data) return

      if (pending.type === 'doctor') {
        const doc = pending.data
        const key = `favorites_doctors_${userId}`
        const current = JSON.parse(localStorage.getItem(key) || '[]')
        if (!current.some(d => String(d.id) === String(doc.id))) {
          const updated = [...current, doc]
          localStorage.setItem(key, JSON.stringify(updated))
          setFavoriteDoctors(updated)
          
        }
      } else if (pending.type === 'hospital') {
        const hosp = pending.data
        const key = `favorites_hospitals_${userId}`
        const current = JSON.parse(localStorage.getItem(key) || '[]')
        if (!current.some(h => String(h.id) === String(hosp.id))) {
          const updated = [...current, hosp]
          localStorage.setItem(key, JSON.stringify(updated))
          setFavoriteHospitals(updated)
          
        }
      }
      localStorage.removeItem('pending_favorite')
    } catch (e) {
      console.error('Error processing pending favorite:', e)
      localStorage.removeItem('pending_favorite')
    }
  }

  const isDoctorFavorite = useCallback((doctorId) => {
    if (!doctorId) return false
    return favoriteDoctors.some(d => String(d.id) === String(doctorId))
  }, [favoriteDoctors])

  const isHospitalFavorite = useCallback((hospitalId) => {
    if (!hospitalId) return false
    return favoriteHospitals.some(h => String(h.id) === String(hospitalId))
  }, [favoriteHospitals])

  const closeModal = useCallback(() => {
    setConfirmModal({ open: false, action: 'add', type: null, item: null })
  }, [])

  const handleConfirmAction = useCallback(() => {
    if (!confirmModal.item || !user?.id) return
    const { action, type, item } = confirmModal
    const userId = user.id

    if (action === 'add') {
      if (type === 'doctor') {
        const key = `favorites_doctors_${userId}`
        const updated = [...favoriteDoctors.filter(d => String(d.id) !== String(item.id)), item]
        setFavoriteDoctors(updated)
        localStorage.setItem(key, JSON.stringify(updated))
        toast.success('ডাক্তারটি পছন্দের তালিকায় যুক্ত হয়েছে! ❤️', {
          style: { borderRadius: '12px', background: '#0F172A', color: '#fff', fontWeight: 700 }
        })
      } else if (type === 'hospital') {
        const key = `favorites_hospitals_${userId}`
        const updated = [...favoriteHospitals.filter(h => String(h.id) !== String(item.id)), item]
        setFavoriteHospitals(updated)
        localStorage.setItem(key, JSON.stringify(updated))
        toast.success('হাসপাতালটি পছন্দের তালিকায় যুক্ত হয়েছে! ❤️', {
          style: { borderRadius: '12px', background: '#0F172A', color: '#fff', fontWeight: 700 }
        })
      }
    } else if (action === 'remove') {
      if (type === 'doctor') {
        const key = `favorites_doctors_${userId}`
        const updated = favoriteDoctors.filter(d => String(d.id) !== String(item.id))
        setFavoriteDoctors(updated)
        localStorage.setItem(key, JSON.stringify(updated))
        toast('পছন্দের তালিকা থেকে বাদ দেওয়া হয়েছে', { icon: '🗑️' })
      } else if (type === 'hospital') {
        const key = `favorites_hospitals_${userId}`
        const updated = favoriteHospitals.filter(h => String(h.id) !== String(item.id))
        setFavoriteHospitals(updated)
        localStorage.setItem(key, JSON.stringify(updated))
        toast('পছন্দের তালিকা থেকে বাদ দেওয়া হয়েছে', { icon: '🗑️' })
      }
    }
    setConfirmModal({ open: false, action: 'add', type: null, item: null })
  }, [confirmModal, user?.id, favoriteDoctors, favoriteHospitals])

  const toggleFavoriteDoctor = useCallback(async (doctor) => {
    if (!doctor || !doctor.id) return

    if (!isLoggedIn) {
      const confirmed = await showDialog({
        type: 'info',
        title: 'লগইন প্রয়োজন',
        message: 'পছন্দের তালিকায় যুক্ত করতে অনুগ্রহ করে প্রথমে লগইন করুন।',
        confirmText: 'লগইন করুন',
        cancelText: 'বাতিল করুন',
        variant: 'primary',
        preventBackdropClose: false
      })

      if (confirmed) {
        localStorage.setItem('pending_favorite', JSON.stringify({ type: 'doctor', data: doctor }))
        navigate('/login', { state: { from: location } })
      }
      return
    }

    // Logged in -> Toggle favorite
    const exists = favoriteDoctors.some(d => String(d.id) === String(doctor.id))

    if (exists) {
      const doc = favoriteDoctors.find(d => String(d.id) === String(doctor.id)) || doctor
      setConfirmModal({ open: true, action: 'remove', type: 'doctor', item: doc })
    } else {
      setConfirmModal({ open: true, action: 'add', type: 'doctor', item: doctor })
    }
  }, [isLoggedIn, user?.id, favoriteDoctors, navigate, location, showDialog])

  const toggleFavoriteHospital = useCallback(async (hospital) => {
    if (!hospital || !hospital.id) return

    if (!isLoggedIn) {
      const confirmed = await showDialog({
        type: 'info',
        title: 'লগইন প্রয়োজন',
        message: 'পছন্দের তালিকায় যুক্ত করতে অনুগ্রহ করে প্রথমে লগইন করুন।',
        confirmText: 'লগইন করুন',
        cancelText: 'বাতিল করুন',
        variant: 'primary',
        preventBackdropClose: false
      })

      if (confirmed) {
        localStorage.setItem('pending_favorite', JSON.stringify({ type: 'hospital', data: hospital }))
        navigate('/login', { state: { from: location } })
      }
      return
    }

    // Logged in -> Toggle favorite
    const exists = favoriteHospitals.some(h => String(h.id) === String(hospital.id))

    if (exists) {
      const hosp = favoriteHospitals.find(h => String(h.id) === String(hospital.id)) || hospital
      setConfirmModal({ open: true, action: 'remove', type: 'hospital', item: hosp })
    } else {
      setConfirmModal({ open: true, action: 'add', type: 'hospital', item: hospital })
    }
  }, [isLoggedIn, user?.id, favoriteHospitals, navigate, location, showDialog])

  const removeFavoriteDoctor = useCallback((doctorId) => {
    if (!isLoggedIn || !user?.id) return
    const doc = favoriteDoctors.find(d => String(d.id) === String(doctorId))
    if (doc) {
      setConfirmModal({ open: true, action: 'remove', type: 'doctor', item: doc })
    } else {
      const updated = favoriteDoctors.filter(d => String(d.id) !== String(doctorId))
      setFavoriteDoctors(updated)
      localStorage.setItem(`favorites_doctors_${user.id}`, JSON.stringify(updated))
    }
  }, [isLoggedIn, user?.id, favoriteDoctors])

  const removeFavoriteHospital = useCallback((hospitalId) => {
    if (!isLoggedIn || !user?.id) return
    const hosp = favoriteHospitals.find(h => String(h.id) === String(hospitalId))
    if (hosp) {
      setConfirmModal({ open: true, action: 'remove', type: 'hospital', item: hosp })
    } else {
      const updated = favoriteHospitals.filter(h => String(h.id) !== String(hospitalId))
      setFavoriteHospitals(updated)
      localStorage.setItem(`favorites_hospitals_${user.id}`, JSON.stringify(updated))
    }
  }, [isLoggedIn, user?.id, favoriteHospitals])

  return (
    <FavoritesContext.Provider value={{
      favoriteDoctors,
      favoriteHospitals,
      isDoctorFavorite,
      isHospitalFavorite,
      toggleFavoriteDoctor,
      toggleFavoriteHospital,
      removeFavoriteDoctor,
      removeFavoriteHospital
    }}>
      {children}

      {/* ── BENEFIT CONFIRMATION MODAL ── */}
      {confirmModal.open && confirmModal.item && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            zIndex: 999999
          }}
          onClick={closeModal}
        >
          <div
            style={{
              background: '#FFFFFF',
              width: '100%',
              maxWidth: 420,
              borderRadius: 22,
              padding: '24px 20px 20px',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.3)',
              border: '1.5px solid #F1F5F9',
              position: 'relative'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Close cross button */}
            <button
              type="button"
              onClick={closeModal}
              style={{
                position: 'absolute',
                top: 14,
                right: 14,
                width: 32,
                height: 32,
                borderRadius: '50%',
                border: 'none',
                background: '#F1F5F9',
                color: '#64748B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <IconX size={18} />
            </button>

            {/* Top Header Badge */}
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              {confirmModal.action === 'remove' ? (
                <>
                  <div style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: '#FEF2F2',
                    color: '#DC2626',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 20px rgba(220, 38, 38, 0.15)',
                    marginBottom: 12
                  }}>
                    <IconTrash size={28} />
                  </div>
                  <h4 style={{ fontSize: 17, fontWeight: 900, color: '#0F172A', margin: '0 0 5px', whiteSpace: 'nowrap' }}>
                    {confirmModal.type === 'doctor' ? 'ডাক্তারটি বাদ দেবেন?' : 'হাসপাতালটি বাদ দেবেন?'}
                  </h4>
                  <p style={{ fontSize: 12.5, color: '#64748B', margin: 0, fontWeight: 600, whiteSpace: 'nowrap' }}>
                    পছন্দের তালিকা থেকে সরিয়ে ফেলা হবে।
                  </p>
                </>
              ) : (
                <>
                  <div style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #FFE4E6 0%, #FECDD3 100%)',
                    color: '#E11D48',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 20px rgba(225, 29, 72, 0.2)',
                    marginBottom: 12
                  }}>
                    <IconHeart size={28} fill="#E11D48" />
                  </div>
                  <h4 style={{ fontSize: 17, fontWeight: 900, color: '#0F172A', margin: '0 0 5px', whiteSpace: 'nowrap' }}>
                    {confirmModal.type === 'doctor' ? 'ডাক্তারকে ফেভারিট করবেন?' : 'হাসপাতালকে ফেভারিট করবেন?'}
                  </h4>
                  <p style={{ fontSize: 12.5, color: '#64748B', margin: 0, fontWeight: 600, whiteSpace: 'nowrap' }}>
                    প্রোফাইল থেকে দ্রুত পেতে যুক্ত করুন।
                  </p>
                </>
              )}
            </div>

            {/* Target Item Brief Card */}
            <div style={{
              background: '#F8FAFC',
              border: '1.5px solid #E2E8F0',
              borderRadius: 14,
              padding: '11px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 14
            }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: confirmModal.type === 'doctor' ? '#F0FDF4' : '#EFF6FF',
                color: confirmModal.type === 'doctor' ? '#00B875' : '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {confirmModal.type === 'doctor' ? <IconStethoscope size={20} /> : <IconBuildingHospital size={20} />}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 14.5, fontWeight: 800, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {getItemDisplayName(confirmModal.item, confirmModal.type)}
                </div>
                <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {getItemSubInfo(confirmModal.item, confirmModal.type)}
                </div>
              </div>
            </div>

            {/* Remove Notice */}
            {confirmModal.action === 'remove' && (
              <div style={{
                background: '#FFF1F2',
                borderRadius: 12,
                padding: '9px 12px',
                border: '1px solid #FECDD3',
                fontSize: 12,
                color: '#9F1239',
                fontWeight: 600,
                textAlign: 'center',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                marginBottom: 16
              }}>
                ⚠️ নিশ্চিত হলে নিচের 'বাদ দিন' বাটনে চাপুন
              </div>
            )}

            {/* Benefits List (Only for Add) */}
            {confirmModal.action === 'add' && (
              <div style={{ marginBottom: 16, background: '#FAFAFA', padding: '12px 14px', borderRadius: 14, border: '1px solid #F1F5F9' }}>
                <div style={{ fontSize: 11.5, fontWeight: 800, color: '#475569', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  💡 ফেভারিট করার বিশেষ সুবিধাসমূহ:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {confirmModal.type === 'doctor' ? (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#334155' }}>
                        <span style={{ color: '#00B875', flexShrink: 0 }}>⚡</span>
                        <span><b>দ্রুত বুকিং:</b> প্রোফাইল থেকে ১-ক্লিকেই সিরিয়াল বুকিং</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#334155' }}>
                        <span style={{ color: '#00B875', flexShrink: 0 }}>🕒</span>
                        <span><b>শিডিউল ট্র্যাকিং:</b> ডাক্তারের সময়সূচি সহজে দেখা</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#334155' }}>
                        <span style={{ color: '#00B875', flexShrink: 0 }}>📁</span>
                        <span><b>সংরক্ষিত তথ্য:</b> যেকোনো সময় প্রোফাইল থেকে দ্রুত অ্যাক্সেস</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#334155' }}>
                        <span style={{ color: '#2563EB', flexShrink: 0 }}>🚨</span>
                        <span><b>জরুরি হটলাইন:</b> সরাসরি হেল্পলাইনে যোগাযোগের সুবিধা</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#334155' }}>
                        <span style={{ color: '#2563EB', flexShrink: 0 }}>🏥</span>
                        <span><b>ডাক্তার তালিকা:</b> হাসপাতালের বিশেষজ্ঞ ডাক্তারদের তালিকা</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#334155' }}>
                        <span style={{ color: '#2563EB', flexShrink: 0 }}>📁</span>
                        <span><b>সংরক্ষিত তথ্য:</b> যেকোনো সময় প্রোফাইল থেকে দ্রুত অ্যাক্সেস</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons in ONE Clean Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button
                type="button"
                onClick={closeModal}
                style={{
                  height: 42,
                  borderRadius: 12,
                  border: '1.5px solid #E2E8F0',
                  background: '#F8FAFC',
                  color: '#64748B',
                  fontWeight: 800,
                  fontSize: 13.5,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  whiteSpace: 'nowrap'
                }}
              >
                বাতিল
              </button>
              {confirmModal.action === 'remove' ? (
                <button
                  type="button"
                  onClick={handleConfirmAction}
                  style={{
                    height: 42,
                    borderRadius: 12,
                    border: 'none',
                    background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    fontSize: 13.5,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    whiteSpace: 'nowrap',
                    boxShadow: '0 4px 14px rgba(220, 38, 38, 0.28)'
                  }}
                >
                  <IconTrash size={16} />
                  <span>হ্যাঁ, বাদ দিন</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleConfirmAction}
                  style={{
                    height: 42,
                    borderRadius: 12,
                    border: 'none',
                    background: 'linear-gradient(135deg, #E11D48 0%, #BE123C 100%)',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    fontSize: 13.5,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    whiteSpace: 'nowrap',
                    boxShadow: '0 4px 14px rgba(225, 29, 72, 0.28)'
                  }}
                >
                  <IconHeart size={16} fill="white" />
                  <span>ফেভারিট করুন</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </FavoritesContext.Provider>
  )
}

const defaultFavorites = {
  favoriteDoctors: [],
  favoriteHospitals: [],
  isDoctorFavorite: () => false,
  isHospitalFavorite: () => false,
  toggleFavoriteDoctor: () => {},
  toggleFavoriteHospital: () => {},
  removeFavoriteDoctor: () => {},
  removeFavoriteHospital: () => {},
}

export function useFavorites() {
  const context = useContext(FavoritesContext)
  if (!context) {
    return defaultFavorites
  }
  return context
}
