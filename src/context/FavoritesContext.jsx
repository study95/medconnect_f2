import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'react-toastify'

const FavoritesContext = createContext(null)

export function FavoritesProvider({ children }) {
  const { user, isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [favoriteDoctors, setFavoriteDoctors] = useState([])
  const [favoriteHospitals, setFavoriteHospitals] = useState([])

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
          toast.success(`${doc.name || 'ডাক্তার'} পছন্দের তালিকায় সেভ করা হয়েছে!`)
        }
      } else if (pending.type === 'hospital') {
        const hosp = pending.data
        const key = `favorites_hospitals_${userId}`
        const current = JSON.parse(localStorage.getItem(key) || '[]')
        if (!current.some(h => String(h.id) === String(hosp.id))) {
          const updated = [...current, hosp]
          localStorage.setItem(key, JSON.stringify(updated))
          setFavoriteHospitals(updated)
          toast.success(`${hosp.name || 'হাসপাতাল'} পছন্দের তালিকায় সেভ করা হয়েছে!`)
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

  const toggleFavoriteDoctor = useCallback((doctor) => {
    if (!doctor || !doctor.id) return

    if (!isLoggedIn) {
      // Not logged in -> save pending action & redirect to login
      localStorage.setItem('pending_favorite', JSON.stringify({ type: 'doctor', data: doctor }))
      toast.info('পছন্দের তালিকায় যোগ করতে অনুগ্রহ করে প্রথমে লগইন করুন')
      navigate('/login', { state: { from: location } })
      return
    }

    // Logged in -> Toggle favorite
    const userId = user.id
    const key = `favorites_doctors_${userId}`
    const exists = favoriteDoctors.some(d => String(d.id) === String(doctor.id))

    let updated
    if (exists) {
      updated = favoriteDoctors.filter(d => String(d.id) !== String(doctor.id))
      toast.info('ডাক্তার পছন্দের তালিকা থেকে সরানো হয়েছে')
    } else {
      updated = [...favoriteDoctors, doctor]
      toast.success('ডাক্তার পছন্দের তালিকায় সেভ করা হয়েছে')
    }

    setFavoriteDoctors(updated)
    localStorage.setItem(key, JSON.stringify(updated))
  }, [isLoggedIn, user?.id, favoriteDoctors, navigate, location])

  const toggleFavoriteHospital = useCallback((hospital) => {
    if (!hospital || !hospital.id) return

    if (!isLoggedIn) {
      // Not logged in -> save pending action & redirect to login
      localStorage.setItem('pending_favorite', JSON.stringify({ type: 'hospital', data: hospital }))
      toast.info('পছন্দের তালিকায় যোগ করতে অনুগ্রহ করে প্রথমে লগইন করুন')
      navigate('/login', { state: { from: location } })
      return
    }

    // Logged in -> Toggle favorite
    const userId = user.id
    const key = `favorites_hospitals_${userId}`
    const exists = favoriteHospitals.some(h => String(h.id) === String(hospital.id))

    let updated
    if (exists) {
      updated = favoriteHospitals.filter(h => String(h.id) !== String(hospital.id))
      toast.info('হাসপাতাল পছন্দের তালিকা থেকে সরানো হয়েছে')
    } else {
      updated = [...favoriteHospitals, hospital]
      toast.success('হাসপাতাল পছন্দের তালিকায় সেভ করা হয়েছে')
    }

    setFavoriteHospitals(updated)
    localStorage.setItem(key, JSON.stringify(updated))
  }, [isLoggedIn, user?.id, favoriteHospitals, navigate, location])

  const removeFavoriteDoctor = useCallback((doctorId) => {
    if (!isLoggedIn || !user?.id) return
    const updated = favoriteDoctors.filter(d => String(d.id) !== String(doctorId))
    setFavoriteDoctors(updated)
    localStorage.setItem(`favorites_doctors_${user.id}`, JSON.stringify(updated))
    toast.info('ডাক্তার পছন্দের তালিকা থেকে সরানো হয়েছে')
  }, [isLoggedIn, user?.id, favoriteDoctors])

  const removeFavoriteHospital = useCallback((hospitalId) => {
    if (!isLoggedIn || !user?.id) return
    const updated = favoriteHospitals.filter(h => String(h.id) !== String(hospitalId))
    setFavoriteHospitals(updated)
    localStorage.setItem(`favorites_hospitals_${user.id}`, JSON.stringify(updated))
    toast.info('হাসপাতাল পছন্দের তালিকা থেকে সরানো হয়েছে')
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
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const context = useContext(FavoritesContext)
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider')
  }
  return context
}
