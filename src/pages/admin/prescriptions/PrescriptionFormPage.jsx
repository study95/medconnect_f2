// PrescriptionFormPage.jsx — Modern Clinical Prescription Workspace (Interactive Markable Sections)
import { useState, useEffect, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom'
import { 
  User, Calendar, Clock, Phone, Activity, Scale, 
  FileText, MapPin, Stethoscope, Pill, AlertCircle, 
  Hash, ArrowLeft, Droplets, Check, ClipboardList, FlaskConical,
  Search, Plus, X, Copy, Trash2, ChevronDown, CheckCircle2,
  AlertTriangle, Star, Zap, BookOpen, History, ExternalLink, HelpCircle,
  Eye, Keyboard, MoreHorizontal, ShieldCheck, Maximize2, Minimize2, Sparkles, HeartPulse,
  Thermometer, BedDouble, AlertOctagon, Share2, Printer, Download, RefreshCw, PenLine, Edit2
} from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { 
  createPrescription, 
  updatePrescription, 
  getPrescription, 
  getAppointment, 
  updateAppointment,
  searchMedicines,
  getPatientClinicalTimeline,
  copyPrescriptionMedicines,
  getDoctorFavoriteMedicines,
  createDoctorFavoriteMedicine,
  updateDoctorFavoriteMedicine,
  deleteDoctorFavoriteMedicine,
  getDoctorQuickTemplates,
  createDoctorQuickTemplate,
  deleteDoctorQuickTemplate,
  getDoctorClinicalPresets,
  createDoctorClinicalPreset,
  deleteDoctorClinicalPreset,
  getDoctorCustomSections,
  createDoctorCustomSection,
  updateDoctorCustomSection,
  deleteDoctorCustomSection,
  checkPatientPhone,
  quickRegisterPatient,
  getChambers
} from '../../../api/adminApi'
import { getErrorMessage } from '../../../utils/errorHelper'
import { useDialog } from '../../../hooks/useDialog'
import { DIALOG_MESSAGES } from '../../../utils/dialogMessages'
import PrescriptionPaper from '../../../components/common/PrescriptionPaper'
import '../../../styles/prescription.css'

const STRENGTH_OPTIONS = ['500 mg', '650 mg', '250 mg', '100 mg', '50 mg', '20 mg', '10 mg', '5 mg', '30 mg/5ml', '100 ml', '—']

const DOSE_OPTIONS_BN = [
  '১টি ট্যাবলেট',
  '২টি ট্যাবলেট',
  'আধখানা ট্যাবলেট',
  '১টি ক্যাপসুল',
  '১ চামচ',
  '২ চামচ',
  '১ প্যাকেট',
  '১ ফোঁটা',
  '১ চাপ'
]
const DOSE_OPTIONS_EN = [
  '1 Tablet',
  '2 Tablets',
  '0.5 Tablet',
  '1 Capsule',
  '5 ml',
  '10 ml',
  '1 Sachet',
  '1 Spoon',
  '1 Drop',
  '1 Puff'
]
const DOSE_OPTIONS = [...DOSE_OPTIONS_BN, ...DOSE_OPTIONS_EN]

const FREQUENCY_OPTIONS = [
  '1+0+1',
  '1+1+1',
  '1+0+0',
  '0+1+0',
  '0+0+1',
  '1+1+1+1',
  '0+0+0+1',
  '1+0+1+0',
  'SOS',
  'PRN'
]

const DURATION_OPTIONS_BN = [
  '৩ দিন',
  '৫ দিন',
  '৭ দিন',
  '১০ দিন',
  '১৪ দিন',
  '২১ দিন',
  '১ মাস',
  '২ মাস',
  '৩ মাস',
  'চলবে'
]
const DURATION_OPTIONS_EN = [
  '3 Days',
  '5 Days',
  '7 Days',
  '10 Days',
  '14 Days',
  '21 Days',
  '1 Month',
  '2 Months',
  '3 Months',
  'Continue'
]
const DURATION_OPTIONS = [...DURATION_OPTIONS_BN, ...DURATION_OPTIONS_EN]

const MEAL_OPTIONS_BN = [
  'খাওয়ার পর',
  'খাওয়ার আগে',
  'খাওয়ার সাথে',
  'খালি পেটে',
  'ঘুমানোর আগে',
  'নিয়ম অনুযায়ী'
]
const MEAL_OPTIONS_EN = [
  'After Meal',
  'Before Meal',
  'With Food',
  'Empty Stomach',
  'Bedtime',
  'As Directed'
]
const MEAL_OPTIONS = [...MEAL_OPTIONS_BN, ...MEAL_OPTIONS_EN]

const matchOptionValue = (options, val) => {
  if (!val) return ''
  if (options.includes(val)) return val
  const normalized = String(val).trim().toLowerCase()
  const matched = options.find(opt => opt.toLowerCase() === normalized)
  return matched || val
}

// Quick Presets for Clinical Tab (Empty by default — strictly doctor-added)
const CC_PRESETS = []
const OE_PRESETS = []
const MH_PRESETS = []

// Categorized Investigations (Empty by default — strictly doctor-added)
const INVESTIGATION_CATEGORIES = {}

// Categorized Advice (Empty by default — strictly doctor-added)
const ADVICE_CATEGORIES = {}

// Favorites Medicine List (Empty by default — strictly doctor-added)
const FAVORITE_MEDICINES = []

// Quick Add Drug Combos (Empty by default — strictly doctor-added)
const QUICK_COMBOS = []

// Digital Prescription Design Layout Templates (QR Code, Barcode & Hard Pad Print Enabled)
const DIGITAL_PRESCRIPTION_TEMPLATES = [
  {
    id: 'digital-qr-barcode',
    name: '১. ডিজিটাল প্রিন্ট (QR কোড ও বারকোড সহ)',
    badge: 'ডিজিটাল প্রিন্ট',
    description: 'সম্পূর্ণ হেডার, কিউআর কোড (QR Code), বারকোড (Barcode) এবং ভেরিফাইড ই-প্রেসক্রিপশন সিল সহ।'
  },
  {
    id: 'pad-print-only-data',
    name: '২. ডাক্তারের হার্ড প্যাড (শুধু তথ্যগুলো প্রিন্ট হবে)',
    badge: 'প্যাড প্রিন্ট',
    description: 'ডাক্তারের নিজস্ব ছাপানো প্যাডে প্রিন্টের জন্য — হেডার ও ফুটার বাদ দিয়ে শুধু রোগীর তথ্য ও ওষুধ প্রিন্ট হবে।'
  },
  {
    id: 'smart-hospital',
    name: '৩. স্মার্ট হসপিটাল / ক্লিনিক লে-আউট',
    badge: 'হসপিটাল',
    description: 'কর্পোরেট হসপিটাল হেডার, ক্লিনিক্যাল গ্রিড এবং বারকোড সহ ডিজিটাল ডিজাইন।'
  },
  {
    id: 'classic-pad',
    name: '৪. ক্লাসিক বাংলা প্রেসক্রিপশন ডিজাইন',
    badge: 'স্ট্যান্ডার্ড',
    description: 'দ্বি-কলাম বিশিষ্ট প্রথাগত ডিজাইন সাথে মোবাইল কিউআর কোড স্ক্যানার।'
  }
]

// Quick Templates (Empty by default — strictly doctor-added)
const QUICK_TEMPLATES = []

const emptyMedicine = () => ({
  _id: Math.random().toString(36).substring(2, 9),
  medicine_name: '',
  type: '',
  strength: '',
  dose: '',
  dosage: '',
  duration: '',
  meal: '',
  instructions: ''
})

// Calculate age in years from Date of Birth
const calculateAgeFromDob = (dobStr) => {
  if (!dobStr) return null
  try {
    const dob = new Date(dobStr)
    if (isNaN(dob.getTime())) return null
    const today = new Date()
    let age = today.getFullYear() - dob.getFullYear()
    const m = today.getMonth() - dob.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--
    }
    return age >= 0 ? String(age) : '0'
  } catch (e) {
    return null
  }
}

// Calculate approximate Date of Birth from Age (in years)
const calculateDobFromAge = (ageYears, existingDobStr = null) => {
  const age = parseInt(ageYears, 10)
  if (isNaN(age) || age < 0) return ''
  const today = new Date()
  const targetYear = today.getFullYear() - age
  if (existingDobStr) {
    try {
      const d = new Date(existingDobStr)
      if (!isNaN(d.getTime())) {
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        return `${targetYear}-${month}-${day}`
      }
    } catch (e) {}
  }
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${targetYear}-${month}-${day}`
}

// Validate Bangladeshi mobile phone format (013-019 followed by 8 digits, optional +88/88)
const isValidBdMobile = (phone) => {
  if (!phone) return false
  const clean = String(phone).replace(/[\s\-\(\)]/g, '')
  return /^(?:\+?8801|8801|01)[3-9]\d{8}$/.test(clean)
}

// Normalize Bangladeshi mobile phone number to standard 11 digits (01XXXXXXXXX)
const normalizeBdMobile = (phone) => {
  if (!phone) return ''
  let clean = String(phone).replace(/[\s\-\(\)]/g, '')
  if (clean.startsWith('+88')) clean = clean.slice(3)
  else if (clean.startsWith('88')) clean = clean.slice(2)
  return clean
}

// Parse structured vitals from examination/oe string or weights
const parseVitalsFromOe = (oe, fallbackWeight = '') => {
  const result = {
    bp_systolic: '',
    bp_diastolic: '',
    pulse: '',
    temp: '',
    weight: fallbackWeight || '',
    height_ft: '',
    recorded_at: ''
  }
  if (!oe || typeof oe !== 'string') return result

  const bpMatch = oe.match(/BP:\s*(\d+)(?:\/(\d+))?/i)
  if (bpMatch) {
    result.bp_systolic = bpMatch[1] || ''
    result.bp_diastolic = bpMatch[2] || ''
  }

  const pulseMatch = oe.match(/Pulse:\s*(\d+)/i)
  if (pulseMatch) {
    result.pulse = pulseMatch[1] || ''
  }

  const tempMatch = oe.match(/Temp:\s*([0-9.]+)/i)
  if (tempMatch) {
    result.temp = tempMatch[1] || ''
  }

  const wtMatch = oe.match(/(?:Wt|Weight):\s*([0-9.]+)/i)
  if (wtMatch && !result.weight) {
    result.weight = wtMatch[1] || ''
  }

  const htMatch = oe.match(/(?:Ht|Height):\s*([0-9.]+)/i)
  if (htMatch) {
    result.height_ft = htMatch[1] || ''
  }

  return result
}

export default function PrescriptionFormPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const appointmentId = searchParams.get('appointment_id')
  const returnTo = searchParams.get('return_to') || (searchParams.get('from') === 'serial-display' ? '/admin/serial-display' : null) || '/admin/appointments'
  const navigate = useNavigate()
  const { user, fetchCurrentUser } = useAuth()
  const { showSuccess, showError, confirm } = useDialog()
  const isEdit = !!id

  // Auto-refresh doctor profile on mount to guarantee fresh credentials/slug/degrees
  useEffect(() => {
    if (fetchCurrentUser) {
      fetchCurrentUser().catch(() => {})
    }
  }, [])

  // Doctor-scoped isolation key (isolates each doctor's favorites, templates, combos)
  const doctorScopeId = user?.doctor?.id 
    ? `doc_${user.doctor.id}` 
    : (user?.doctor_id ? `doc_${user.doctor_id}` : (user?.id ? `usr_${user.id}` : null))

  // Prescription Author & Note Privacy State
  const [prescriptionDoctorId, setPrescriptionDoctorId] = useState(null)
  const [prescriptionDoctorName, setPrescriptionDoctorName] = useState('')
  const [canViewNotes, setCanViewNotes] = useState(true)

  const [activeTab, setActiveTab] = useState('prescription')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [appointmentInfo, setAppointmentInfo] = useState(null)

  // Patient Clinical Timeline & Historical EMR States
  const [clinicalTimeline, setClinicalTimeline] = useState([])
  const [timelineLoading, setTimelineLoading] = useState(false)
  const [timelineError, setTimelineError] = useState(null)
  const [copyingMedicinesId, setCopyingMedicinesId] = useState(null)
  const [historyModalRx, setHistoryModalRx] = useState(null)
  const [showHistoryModal, setShowHistoryModal] = useState(false)

  // Modals & Popover States
  const [showShortcutsModal, setShowShortcutsModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [showTemplatesDropdown, setShowTemplatesDropdown] = useState(false)
  const [showFavoritesModal, setShowFavoritesModal] = useState(false)
  const [showQuickAddDropdown, setShowQuickAddDropdown] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showVitalsModal, setShowVitalsModal] = useState(false)
  const [isZenMode, setIsZenMode] = useState(false)

  // Auto-Save & Draft State
  const [activeDraftId, setActiveDraftId] = useState(() => (isEdit && id ? id : null))
  const [isDraftStatus, setIsDraftStatus] = useState(false)
  // draftKey is stable even when doctorScopeId is null — uses 'anon' as fallback so the restore
  // effect fires once when doctorScopeId resolves to a real value (changes from null)
  const draftKey = doctorScopeId
    ? `dr_rx_draft_${doctorScopeId}_${appointmentId || (activeDraftId || id ? `rx_${activeDraftId || id}` : 'walkin')}`
    : `dr_rx_draft_anon_${appointmentId || (activeDraftId || id ? `rx_${activeDraftId || id}` : 'walkin')}`
  const [autoSaveStatus, setAutoSaveStatus] = useState('saved') // 'saved' | 'saving' | 'unsaved'
  const [lastSavedTime, setLastSavedTime] = useState(Date.now())
  const [autoSaveLabel, setAutoSaveLabel] = useState('Auto saved just now')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const autoSaveTimerRef = useRef(null)
  const draftRestoredRef = useRef(false)

  // Assign / Edit Patient Age & Gender Modal State
  const [showAssignAgeModal, setShowAssignAgeModal] = useState(false)
  const [editAgeInput, setEditAgeInput] = useState('')
  const [editSexInput, setEditSexInput] = useState('Male')
  const [editDobInput, setEditDobInput] = useState('')
  const [tableLanguage, setTableLanguage] = useState(() => {
    try {
      return localStorage.getItem('dr_table_language') || 'bn'
    } catch (e) {
      return 'bn'
    }
  })

  const handleToggleLanguage = (lang) => {
    setTableLanguage(lang)
    try {
      localStorage.setItem('dr_table_language', lang)
    } catch (e) {}
  }

  // Walk-in Patient State — only used when creating prescription directly (no appointment)
  const isWalkIn = !appointmentId && !isEdit
  const [walkInPatientInfo, setWalkInPatientInfo] = useState(null) // null = not filled yet
  const [showWalkInModal, setShowWalkInModal] = useState(false)
  // Doctor's Own Chambers for Walk-in Consultation
  const [doctorChambers, setDoctorChambers] = useState(() => {
    if (user?.doctor?.chambers && Array.isArray(user.doctor.chambers)) {
      return user.doctor.chambers
    }
    return []
  })
  const [loadingChambers, setLoadingChambers] = useState(false)

  const [walkInForm, setWalkInForm] = useState(() => {
    const initialChambers = user?.doctor?.chambers || []
    const firstChamber = initialChambers.find(c => c.is_active) || initialChambers[0] || null
    const hosp = firstChamber?.hospital || {}
    return {
      name: '',
      age: '',
      sex: 'Male',
      phone: '',
      address: '',
      registration_no: '',
      chamber_id: firstChamber?.id || firstChamber?.public_id || '',
      chamber_name: firstChamber?.chamber_name || hosp.name || '',
      chamber_address: hosp.address || firstChamber?.address || '',
      chamber_phone: hosp.phone || hosp.hotline || firstChamber?.phone || '',
      chamber_hotline: hosp.hotline || hosp.phone || '',
      chamber_website: hosp.url || hosp.website || '',
      chamber_logo: hosp.hospital_logo || hosp.photo_url || hosp.photo || '',
      hospital_id: firstChamber?.hospital_id || hosp.id || '',
      hospital_name: hosp.name || '',
      hospital_address: hosp.address || '',
      hospital_phone: hosp.phone || hosp.hotline || '',
      hospital_hotline: hosp.hotline || hosp.phone || '',
      hospital_website: hosp.url || hosp.website || '',
      hospital_logo: hosp.hospital_logo || hosp.photo_url || hosp.photo || '',
    }
  })
  const [isCheckingWalkInPhone, setIsCheckingWalkInPhone] = useState(false)
  const [walkInErrors, setWalkInErrors] = useState({})

  // Dynamic Favorites Medicines with LocalStorage Persistence (Strictly Doctor-Scoped, Empty by default)
  const [favoriteMedicines, setFavoriteMedicines] = useState(() => {
    try {
      if (doctorScopeId) {
        const scopedKey = `dr_favorite_medicines_${doctorScopeId}`
        const saved = localStorage.getItem(scopedKey)
        if (saved) {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed)) return parsed
        }
      }
    } catch (e) {}
    return []
  })
  const [showAddFavForm, setShowAddFavForm] = useState(false)
  const [editingFavIndex, setEditingFavIndex] = useState(null)
  const [favSearchQuery, setFavSearchQuery] = useState('')
  const [newFavForm, setNewFavForm] = useState({
    name: '',
    type: 'Tablet',
    strength: '',
    dose: '1 Tablet',
    frequency: '1+0+1',
    duration: '5 Days',
    meal: 'After Meal',
    instructions: ''
  })

  // Dynamic Quick Add Combos with LocalStorage Persistence (Strictly Doctor-Scoped, Empty by default)
  const [quickCombos, setQuickCombos] = useState(() => {
    try {
      if (doctorScopeId) {
        const scopedKey = `dr_quick_combos_${doctorScopeId}`
        const saved = localStorage.getItem(scopedKey)
        if (saved) {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed)) return parsed
        }
      }
    } catch (e) {}
    return []
  })

  // Dynamic Quick Add Templates with LocalStorage Persistence (Strictly Doctor-Scoped, Empty by default)
  const [quickTemplates, setQuickTemplates] = useState(() => {
    try {
      if (doctorScopeId) {
        const scopedKey = `dr_quick_templates_${doctorScopeId}`
        const saved = localStorage.getItem(scopedKey)
        if (saved) {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed)) return parsed
        }
      }
    } catch (e) {}
    return []
  })
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false)
  const [templateNameInput, setTemplateNameInput] = useState('')
  // Digital Prescription Template Selection
  const [selectedTemplate, setSelectedTemplate] = useState(() => {
    try {
      const saved = localStorage.getItem('dr_rx_template')
      if (saved && ['digital-qr-barcode', 'pad-print-only-data', 'smart-hospital', 'classic-pad'].includes(saved)) {
        return saved
      }
      return 'digital-qr-barcode'
    } catch (e) {
      return 'digital-qr-barcode'
    }
  })

  // Reference to Prescription Paper for isolated clean A4 printing
  const previewPaperRef = useRef(null)

  const handlePrintNow = () => {
    if (!previewPaperRef.current) {
      window.print()
      return
    }

    try {
      const paperElement = previewPaperRef.current
      const htmlContent = paperElement.outerHTML

      // Gather all stylesheets and inline style tags from parent window
      let stylesHtml = ''
      document.querySelectorAll('link[rel="stylesheet"], style').forEach((node) => {
        stylesHtml += node.outerHTML
      })

      // Create an invisible isolated iframe for dedicated prescription printing
      const existingIframe = document.getElementById('dr-print-frame')
      if (existingIframe) {
        try { document.body.removeChild(existingIframe) } catch (e) {}
      }

      const printIframe = document.createElement('iframe')
      printIframe.id = 'dr-print-frame'
      printIframe.style.position = 'fixed'
      printIframe.style.right = '0'
      printIframe.style.bottom = '0'
      printIframe.style.width = '0px'
      printIframe.style.height = '0px'
      printIframe.style.border = '0px'
      document.body.appendChild(printIframe)

      const doc = printIframe.contentWindow.document
      doc.open()
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Prescription Print</title>
            <meta charset="utf-8" />
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
            ${stylesHtml}
            <style>
              * {
                box-sizing: border-box !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              @page {
                size: A4 portrait;
                margin: 0 !important;
              }
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                width: 210mm !important;
                height: 297mm !important;
                max-height: 297mm !important;
                background: #ffffff !important;
                font-family: 'Inter', 'Segoe UI', sans-serif;
                overflow: hidden !important;
              }
              .rx-font-bn {
                font-family: 'Hind Siliguri', 'Noto Sans Bengali', sans-serif !important;
              }
              .rx-paper {
                margin: 0 auto !important;
                width: 210mm !important;
                max-width: 210mm !important;
                height: 297mm !important;
                min-height: 297mm !important;
                max-height: 297mm !important;
                box-shadow: none !important;
                border: none !important;
                box-sizing: border-box !important;
                display: flex !important;
                flex-direction: column !important;
                background: #ffffff !important;
                page-break-inside: avoid !important;
                page-break-after: avoid !important;
                break-inside: avoid !important;
                overflow: hidden !important;
              }
              .rx-header {
                min-height: 55mm !important;
                padding: 6mm 12mm 4mm 18mm !important;
                box-sizing: border-box !important;
                border-bottom: 3px solid #00A88C !important;
                display: flex !important;
                justify-content: space-between !important;
                align-items: flex-start !important;
              }
              .rx-patient-bar {
                padding: 3mm 12mm 3mm 18mm !important;
                box-sizing: border-box !important;
                background: #F8FAFB !important;
                border-bottom: 1.5px solid #D1D9E6 !important;
                display: flex !important;
                flex-wrap: wrap !important;
              }
              .rx-body {
                flex: 1 !important;
                display: flex !important;
                flex-direction: row !important;
                width: 100% !important;
                min-height: 0 !important;
                box-sizing: border-box !important;
              }
              .rx-body-left {
                width: 32% !important;
                min-width: 65mm !important;
                max-width: 65mm !important;
                flex-shrink: 0 !important;
                background-color: #F0F7FF !important;
                border-right: 1.5px solid #D1D9E6 !important;
                padding: 6mm 4mm 6mm 18mm !important;
                box-sizing: border-box !important;
              }
              .rx-body-right {
                width: 68% !important;
                flex: 1 !important;
                display: flex !important;
                flex-direction: column !important;
                padding: 6mm 12mm 6mm 8mm !important;
                box-sizing: border-box !important;
              }
              .rx-indicator {
                width: 3px !important;
                height: 14px !important;
                background: #00A88C !important;
                border-radius: 2px !important;
                display: inline-block !important;
              }
              .rx-instructions {
                background: #eff6ff !important;
                color: #2563eb !important;
                padding: 2px 8px !important;
                border-radius: 4px !important;
              }
              .rx-advice-section {
                background: #f8fafc !important;
                border: 1px solid #e2e8f0 !important;
                border-radius: 6px !important;
                padding: 8px 12px !important;
              }
              .rx-footer {
                padding: 4mm 12mm 15mm 18mm !important;
                border-top: 2.5px solid #00A88C !important;
                background: #F8FAFC !important;
                display: flex !important;
                justify-content: space-between !important;
                align-items: center !important;
                box-sizing: border-box !important;
              }
            </style>
          </head>
          <body>
            ${htmlContent}
          </body>
        </html>
      `)
      doc.close()

      printIframe.contentWindow.focus()
      setTimeout(() => {
        printIframe.contentWindow.print()
        setTimeout(() => {
          try {
            document.body.removeChild(printIframe)
          } catch (e) {}
        }, 1200)
      }, 350)
    } catch (err) {
      console.error('Isolated print error, falling back to window.print():', err)
      window.print()
    }
  }

  const [showBundleModal, setShowBundleModal] = useState(false)
  const [editingBundleIndex, setEditingBundleIndex] = useState(null)
  const [bundleForm, setBundleForm] = useState({
    title: '',
    meds: [
      { medicine_name: '', type: 'Tablet', strength: '', dose: '1 Tablet', frequency: '1+1+1', duration: '5 Days', meal: 'After Meal', instructions: '' }
    ]
  })

  // Doctor Clinical Presets (Cloud Database Synced per Doctor: Diagnosis, CC, OE, MH, OH, Investigation, Advice, Note)
  const [clinicalPresets, setClinicalPresets] = useState(() => {
    try {
      if (doctorScopeId) {
        const scopedKey = `dr_clinical_presets_${doctorScopeId}`
        const saved = localStorage.getItem(scopedKey)
        if (saved) {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed)) return parsed
        }
      }
    } catch (e) {}
    return []
  })

  // Grouped Presets for Fast Lookup
  const diagnosisPresets = clinicalPresets.filter(p => p.type === 'diagnosis')
  const ccPresets = clinicalPresets.filter(p => p.type === 'cc')
  const oePresets = clinicalPresets.filter(p => p.type === 'oe')
  const mhPresets = clinicalPresets.filter(p => p.type === 'mh')
  const ohPresets = clinicalPresets.filter(p => p.type === 'oh')
  const invPresets = clinicalPresets.filter(p => p.type === 'investigation')
  const advicePresets = clinicalPresets.filter(p => p.type === 'advice')
  const notePresets = clinicalPresets.filter(p => p.type === 'note')

  const handleSaveClinicalPreset = async (type, content, category = null) => {
    const text = (content || '').trim()
    if (!text) return null
    
    if (clinicalPresets.some(p => p.type === type && (p.content || '').toLowerCase() === text.toLowerCase())) {
      showError({ title: 'Already Exists', message: `"${text}" is already in your presets.` })
      return null
    }

    try {
      const res = await createDoctorClinicalPreset({ type, content: text, category })
      const created = res.data?.data || { id: `preset_${Date.now()}`, type, content: text, category }
      const updated = [created, ...clinicalPresets]
      setClinicalPresets(updated)
      if (doctorScopeId) {
        try { localStorage.setItem(`dr_clinical_presets_${doctorScopeId}`, JSON.stringify(updated)) } catch (e) {}
      }
      showSuccess({ title: 'Preset Saved', message: `"${text}" saved to your database presets!` })
      return created
    } catch (err) {
      console.warn('Failed to save preset to database, saving to local cache:', err)
      const fallback = { id: `local_${Date.now()}`, type, content: text, category }
      const updated = [fallback, ...clinicalPresets]
      setClinicalPresets(updated)
      if (doctorScopeId) {
        try { localStorage.setItem(`dr_clinical_presets_${doctorScopeId}`, JSON.stringify(updated)) } catch (e) {}
      }
      showSuccess({ title: 'Preset Saved (Local)', message: `"${text}" saved to presets.` })
      return fallback
    }
  }

  const handleDeleteClinicalPreset = async (presetId, e) => {
    if (e) e.stopPropagation()
    const target = clinicalPresets.find(p => p.id === presetId)
    if (!target) return

    try {
      if (typeof presetId === 'number' || (typeof presetId === 'string' && !presetId.startsWith('local_') && !presetId.startsWith('preset_'))) {
        await deleteDoctorClinicalPreset(presetId)
      }
    } catch (err) {
      console.warn('Could not delete preset from backend:', err)
    }

    const updated = clinicalPresets.filter(p => p.id !== presetId)
    setClinicalPresets(updated)
    if (doctorScopeId) {
      try { localStorage.setItem(`dr_clinical_presets_${doctorScopeId}`, JSON.stringify(updated)) } catch (e) {}
    }
    showSuccess({ title: 'Preset Removed', message: `"${target.content}" removed from your presets.` })
  }

  // Custom Chips State for Clinical Sections
  const [chipInput, setChipInput] = useState({ cc: '', oe: '', mh: '', oh: '' })
  const [showChipInput, setShowChipInput] = useState({ cc: false, oe: false, mh: false, oh: false })

  const addCustomChip = async (section) => {
    const val = (chipInput[section] || '').trim()
    if (!val) return
    setChipInput(prev => ({ ...prev, [section]: '' }))
    setShowChipInput(prev => ({ ...prev, [section]: false }))
    await handleSaveClinicalPreset(section, val)
  }

  const removeCustomChip = async (section, chip, presetId = null) => {
    if (presetId) {
      await handleDeleteClinicalPreset(presetId)
    } else {
      const match = clinicalPresets.find(p => p.type === section && p.content === chip)
      if (match) {
        await handleDeleteClinicalPreset(match.id)
      }
    }
  }

  // Quick Note Snippets (Dynamic, DB-backed per Doctor)
  const [newNoteSnippetInput, setNewNoteSnippetInput] = useState('')
  const [showAddNoteSnippet, setShowAddNoteSnippet] = useState(false)

  const handleAddNoteSnippet = async () => {
    const val = newNoteSnippetInput.trim()
    if (!val) return
    setNewNoteSnippetInput('')
    setShowAddNoteSnippet(false)
    await handleSaveClinicalPreset('note', val)
  }

  const handleRemoveNoteSnippet = async (snippetToRemove, presetId = null) => {
    if (presetId) {
      await handleDeleteClinicalPreset(presetId)
    } else {
      const match = clinicalPresets.find(p => p.type === 'note' && p.content === snippetToRemove)
      if (match) {
        await handleDeleteClinicalPreset(match.id)
      }
    }
  }

  // Quick Diagnostic Test Library State
  const [newInvTestInput, setNewInvTestInput] = useState('')
  const [showAddInvInput, setShowAddInvInput] = useState(false)
  const [customTestInput, setCustomTestInput] = useState('')

  const handleSaveNewInvTest = async () => {
    const val = newInvTestInput.trim()
    if (!val) return
    setNewInvTestInput('')
    await handleSaveClinicalPreset('investigation', val)
  }

  const handleAddCustomTestDirect = () => {
    const test = customTestInput.trim()
    if (!test) return
    if (!investigationList.includes(test)) {
      syncInvestigations([...investigationList, test])
    }
    setCustomTestInput('')
    setShowAddInvInput(false)
  }

  const handleAddAndSaveCustomTest = async () => {
    const test = customTestInput.trim()
    if (!test) return
    if (!investigationList.includes(test)) {
      syncInvestigations([...investigationList, test])
    }
    await handleSaveClinicalPreset('investigation', test)
    setCustomTestInput('')
    setShowAddInvInput(false)
  }

  // Medicine Table Column Visibility
  const [showStrengthCol, setShowStrengthCol] = useState(false)
  const [showDoseCol, setShowDoseCol] = useState(false)
  const [showColMenu, setShowColMenu] = useState(false)

  // Custom Sections — doctors can add entirely new sections (Database Synced per Doctor)
  const [customSections, setCustomSections] = useState(() => {
    try {
      if (doctorScopeId) {
        const saved = localStorage.getItem(`dr_custom_sections_clinical_${doctorScopeId}`)
        if (saved) {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed)) return parsed
        }
      }
    } catch (e) {}
    return []
  })
  const [showAddSectionInput, setShowAddSectionInput] = useState(false)
  const [newSectionTitle, setNewSectionTitle] = useState('')

  const addCustomSection = async () => {
    const title = newSectionTitle.trim()
    if (!title) return
    if (customSections.some(s => s.title.toLowerCase() === title.toLowerCase())) {
      showError({ title: 'Already Exists', message: `Section "${title}" already exists.` })
      return
    }
    const tempId = `custom_${Date.now()}`
    const newSec = { id: tempId, title, chips: [], text: '', chipInput: '', showChipInput: false }
    const updated = [...customSections, newSec]
    setCustomSections(updated)
    setNewSectionTitle('')
    setShowAddSectionInput(false)
    if (doctorScopeId) {
      try { localStorage.setItem(`dr_custom_sections_clinical_${doctorScopeId}`, JSON.stringify(updated)) } catch (e) {}
    }

    try {
      const res = await createDoctorCustomSection({ type: 'clinical', title, chips: [] })
      if (res.data?.data?.id) {
        setCustomSections(prev => prev.map(s => s.id === tempId ? { ...s, id: res.data.data.id } : s))
      }
      showSuccess({ title: 'Section Created', message: `"${title}" saved to your database sections!` })
    } catch (err) {
      console.warn('Failed to save custom section to backend:', err)
      showSuccess({ title: 'Section Created', message: `"${title}" created.` })
    }
  }

  const removeCustomSection = async (id) => {
    const sec = customSections.find(s => s.id === id)
    const updated = customSections.filter(s => s.id !== id)
    setCustomSections(updated)
    if (doctorScopeId) {
      try { localStorage.setItem(`dr_custom_sections_clinical_${doctorScopeId}`, JSON.stringify(updated)) } catch (e) {}
    }

    if (typeof id === 'number' || (typeof id === 'string' && !id.startsWith('custom_'))) {
      try {
        await deleteDoctorCustomSection(id)
      } catch (err) {
        console.warn('Failed to delete section from backend:', err)
      }
    }
    showSuccess({ title: 'Section Removed', message: `Section "${sec?.title || ''}" removed from database.` })
  }

  const updateCustomSection = (id, field, value) => {
    setCustomSections(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s))
  }

  const addCustomSectionChip = async (id) => {
    const sec = customSections.find(s => s.id === id)
    if (!sec) return
    const val = (sec.chipInput || '').trim()
    if (!val) return
    if (sec.chips.includes(val)) {
      showError({ title: 'Already Exists', message: `Chip "${val}" already exists in this section.` })
      return
    }
    const newChips = [...sec.chips, val]
    const updated = customSections.map(s => s.id === id ? { ...s, chips: newChips, chipInput: '', showChipInput: false } : s)
    setCustomSections(updated)
    if (doctorScopeId) {
      try { localStorage.setItem(`dr_custom_sections_clinical_${doctorScopeId}`, JSON.stringify(updated)) } catch (e) {}
    }

    if (typeof id === 'number' || (typeof id === 'string' && !id.startsWith('custom_'))) {
      try {
        await updateDoctorCustomSection(id, { chips: newChips })
      } catch (err) {
        console.warn('Failed to update section chips in backend:', err)
      }
    }
  }

  const removeCustomSectionChip = async (id, chip) => {
    const sec = customSections.find(s => s.id === id)
    if (!sec) return
    const newChips = sec.chips.filter(c => c !== chip)
    const updated = customSections.map(s => s.id === id ? { ...s, chips: newChips } : s)
    setCustomSections(updated)
    if (doctorScopeId) {
      try { localStorage.setItem(`dr_custom_sections_clinical_${doctorScopeId}`, JSON.stringify(updated)) } catch (e) {}
    }

    if (typeof id === 'number' || (typeof id === 'string' && !id.startsWith('custom_'))) {
      try {
        await updateDoctorCustomSection(id, { chips: newChips })
      } catch (err) {
        console.warn('Failed to update section chips in backend:', err)
      }
    }
  }

  const appendCustomSectionChip = (id, chip) => {
    setCustomSections(prev => prev.map(s => {
      if (s.id !== id) return s
      const current = (s.text || '').trim()
      const items = current ? current.split(/,\s*/).map(x => x.trim()).filter(Boolean) : []
      const exists = items.some(x => x.toLowerCase() === chip.toLowerCase())
      let updatedText = ''
      if (exists) {
        updatedText = items.filter(x => x.toLowerCase() !== chip.toLowerCase()).join(', ')
      } else {
        updatedText = current ? `${current}, ${chip}` : chip
      }
      return { ...s, text: updatedText }
    }))
  }

  // Custom Investigation Sections — same pattern as clinical sections (Database Synced per Doctor)
  const [customInvSections, setCustomInvSections] = useState(() => {
    try {
      if (doctorScopeId) {
        const saved = localStorage.getItem(`dr_custom_sections_inv_${doctorScopeId}`)
        if (saved) {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed)) return parsed
        }
      }
    } catch (e) {}
    return []
  })
  const [showAddInvSectionInput, setShowAddInvSectionInput] = useState(false)
  const [newInvSectionTitle, setNewInvSectionTitle] = useState('')

  const addCustomInvSection = async () => {
    const title = newInvSectionTitle.trim()
    if (!title) return
    if (customInvSections.some(s => s.title.toLowerCase() === title.toLowerCase())) {
      showError({ title: 'Already Exists', message: `Investigation section "${title}" already exists.` })
      return
    }
    const tempId = `inv_custom_${Date.now()}`
    const newSec = { id: tempId, title, chips: [], selected: [], chipInput: '', showChipInput: false }
    const updated = [...customInvSections, newSec]
    setCustomInvSections(updated)
    setNewInvSectionTitle('')
    setShowAddInvSectionInput(false)
    if (doctorScopeId) {
      try { localStorage.setItem(`dr_custom_sections_inv_${doctorScopeId}`, JSON.stringify(updated)) } catch (e) {}
    }

    try {
      const res = await createDoctorCustomSection({ type: 'investigation', title, chips: [] })
      if (res.data?.data?.id) {
        setCustomInvSections(prev => prev.map(s => s.id === tempId ? { ...s, id: res.data.data.id } : s))
      }
      showSuccess({ title: 'Section Created', message: `"${title}" saved to your database investigation sections!` })
    } catch (err) {
      console.warn('Failed to save custom inv section to backend:', err)
      showSuccess({ title: 'Section Created', message: `"${title}" created.` })
    }
  }

  const removeCustomInvSection = async (id) => {
    const sec = customInvSections.find(s => s.id === id)
    const updated = customInvSections.filter(s => s.id !== id)
    setCustomInvSections(updated)
    if (doctorScopeId) {
      try { localStorage.setItem(`dr_custom_sections_inv_${doctorScopeId}`, JSON.stringify(updated)) } catch (e) {}
    }

    if (typeof id === 'number' || (typeof id === 'string' && !id.startsWith('inv_custom_'))) {
      try {
        await deleteDoctorCustomSection(id)
      } catch (err) {
        console.warn('Failed to delete inv section from backend:', err)
      }
    }
    showSuccess({ title: 'Section Removed', message: `Section "${sec?.title || ''}" removed from database.` })
  }

  const updateCustomInvSection = (id, field, value) => {
    setCustomInvSections(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s))
  }

  const addCustomInvSectionChip = async (id) => {
    const sec = customInvSections.find(s => s.id === id)
    if (!sec) return
    const val = (sec.chipInput || '').trim()
    if (!val) return
    if (sec.chips.includes(val)) {
      showError({ title: 'Already Exists', message: `Test "${val}" already exists in this section.` })
      return
    }
    const newChips = [...sec.chips, val]
    const updated = customInvSections.map(s => s.id === id ? { ...s, chips: newChips, chipInput: '', showChipInput: false } : s)
    setCustomInvSections(updated)
    if (doctorScopeId) {
      try { localStorage.setItem(`dr_custom_sections_inv_${doctorScopeId}`, JSON.stringify(updated)) } catch (e) {}
    }

    if (typeof id === 'number' || (typeof id === 'string' && !id.startsWith('inv_custom_'))) {
      try {
        await updateDoctorCustomSection(id, { chips: newChips })
      } catch (err) {
        console.warn('Failed to update inv section chips in backend:', err)
      }
    }
  }

  const removeCustomInvSectionChip = async (id, chip) => {
    const sec = customInvSections.find(s => s.id === id)
    if (!sec) return
    const newChips = sec.chips.filter(c => c !== chip)
    const updated = customInvSections.map(s => s.id === id ? { ...s, chips: newChips } : s)
    setCustomInvSections(updated)
    if (doctorScopeId) {
      try { localStorage.setItem(`dr_custom_sections_inv_${doctorScopeId}`, JSON.stringify(updated)) } catch (e) {}
    }

    if (typeof id === 'number' || (typeof id === 'string' && !id.startsWith('inv_custom_'))) {
      try {
        await updateDoctorCustomSection(id, { chips: newChips })
      } catch (err) {
        console.warn('Failed to update inv section chips in backend:', err)
      }
    }
  }

  const toggleCustomInvChip = (id, chip) => {
    // 1. Toggle inside sec.selected
    setCustomInvSections(prev => prev.map(s => {
      if (s.id !== id) return s
      const alreadySelected = (s.selected || []).includes(chip)
      return { ...s, selected: alreadySelected ? s.selected.filter(c => c !== chip) : [...(s.selected || []), chip] }
    }))
    // 2. Also toggle in global investigationList so it appears in the active investigation grid & tab badge
    toggleInvestigationItem(chip)
  }

  // Per-category custom chips for existing investigation library categories
  const [catCustomChips, setCatCustomChips] = useState({})      // { catName: [chip1, chip2] }
  const [catChipInput, setCatChipInput] = useState({})          // { catName: 'typing...' }
  const [catShowInput, setCatShowInput] = useState({})          // { catName: true/false }

  const addCatCustomChip = (catName) => {
    const val = (catChipInput[catName] || '').trim()
    if (!val) return
    setCatCustomChips(prev => ({ ...prev, [catName]: [...(prev[catName] || []), val] }))
    setCatChipInput(prev => ({ ...prev, [catName]: '' }))
    setCatShowInput(prev => ({ ...prev, [catName]: false }))
  }

  const removeCatCustomChip = (catName, chip) => {
    setCatCustomChips(prev => ({ ...prev, [catName]: (prev[catName] || []).filter(c => c !== chip) }))
  }

  // Vitals State — starts empty, recorded when doctor enters
  const [vitals, setVitals] = useState({
    bp_systolic: '',
    bp_diastolic: '',
    pulse: '',
    temp: '',
    weight: '',
    height_ft: '',
    recorded_at: ''
  })

  const [form, setForm] = useState({
    appointment_id: appointmentId || '',
    diagnosis: '',
    advice: '',
    follow_up_date: '',
    follow_up_offset: '',
    cc: '',
    oe: '',
    oh: '',
    mh: '',
    notes: '',
    investigation: '',
    age: '',
    sex: '',
    weight: '',
    registration_no: '',
    patient_id: '',
    chamber_id: '',
    chamber_name: '',
    chamber_name_bn: '',
    chamber_address: '',
    chamber_phone: '',
    chamber_hotline: '',
    chamber_website: '',
    chamber_logo: '',
    hospital_id: '',
    hospital_name: '',
    hospital_name_bn: '',
    hospital_address: '',
    hospital_phone: '',
    hospital_hotline: '',
    hospital_email: '',
    hospital_website: '',
    hospital_logo: '',
    medicines: [emptyMedicine()]
  })

  // Chamber selection handler — dynamically switches consulting chamber and updates all footer info
  const handleSelectChamber = (selectedId) => {
    if (!selectedId) return
    const found = doctorChambers.find(c => String(c.id) === String(selectedId) || String(c.public_id) === String(selectedId))
    if (!found) return

    const hosp = found.hospital || {}
    const chName = found.chamber_name || hosp.name || `Chamber #${found.room_number || found.id}`
    const hospName = hosp.name || found.hospital_name || chName
    const hospAddr = hosp.address || found.address || found.hospital_address || ''
    const hospPhone = hosp.phone || hosp.hotline || found.phone || ''
    const hospHotline = hosp.hotline || hosp.phone || found.hotline || found.phone || ''
    const hospWeb = hosp.url || hosp.website || found.website || (hosp.slug ? `www.${hosp.slug}.com` : '')
    const hospLogo = hosp.hospital_logo || hosp.photo_url || hosp.photo || found.photo || ''

    setForm(prev => ({
      ...prev,
      chamber_id: found.id || found.public_id,
      chamber_name: chName,
      chamber_name_bn: found.chamber_name_bn || hosp.name_bn || '',
      chamber_address: hospAddr,
      chamber_phone: hospPhone,
      chamber_hotline: hospHotline,
      chamber_website: hospWeb,
      chamber_logo: hospLogo,
      hospital_id: found.hospital_id || hosp.id || prev.hospital_id,
      hospital_name: hospName,
      hospital_name_bn: hosp.name_bn || prev.hospital_name_bn || '',
      hospital_address: hospAddr,
      hospital_phone: hospPhone,
      hospital_hotline: hospHotline,
      hospital_website: hospWeb,
      hospital_logo: hospLogo,
    }))

    setWalkInForm(prev => ({
      ...prev,
      chamber_id: found.id || found.public_id,
      chamber_name: chName,
      chamber_address: hospAddr,
      chamber_phone: hospPhone,
      chamber_hotline: hospHotline,
      chamber_website: hospWeb,
      chamber_logo: hospLogo,
      hospital_id: found.hospital_id || hosp.id || prev.hospital_id,
      hospital_name: hospName,
      hospital_address: hospAddr,
      hospital_phone: hospPhone,
      hospital_hotline: hospHotline,
      hospital_website: hospWeb,
      hospital_logo: hospLogo,
    }))

    if (walkInPatientInfo) {
      setWalkInPatientInfo(prev => ({
        ...prev,
        chamber_id: found.id || found.public_id,
        chamber_name: chName,
        hospital_name: hospName,
      }))
    }

    setAppointmentInfo(prev => {
      if (!prev) return prev
      return {
        ...prev,
        chamber_id: found.id,
        chamber: {
          ...(prev.chamber || {}),
          ...found,
          hospital: hosp
        },
        hospital: hosp
      }
    })
  }

  // Parsed Investigations & Advice — starts empty, counted only when doctor adds
  const [investigationList, setInvestigationList] = useState([])

  const [adviceChecklist, setAdviceChecklist] = useState([])

  // Parsed Notes List — starts empty, counted only when doctor adds
  const [noteList, setNoteList] = useState([])
  const [newNoteInput, setNewNoteInput] = useState('')
  const [showAddCustomNote, setShowAddCustomNote] = useState(false)

  const [newAdviceInput, setNewAdviceInput] = useState('')
  const [diagnosisSearchInput, setDiagnosisSearchInput] = useState('')
  const [tableSearchFilter, setTableSearchFilter] = useState('')
  const [investigationSearchQuery, setInvestigationSearchQuery] = useState('')

  // Multi-Diagnosis Management Helpers
  const parseDiagnosisList = (diagStr) => {
    if (!diagStr || typeof diagStr !== 'string') return []
    return diagStr
      .split(/,\s*|\n+/)
      .map(s => s.trim())
      .filter(Boolean)
  }

  const diagnosisList = useMemo(() => {
    return parseDiagnosisList(form.diagnosis)
  }, [form.diagnosis])

  const handleAddDiagnosis = (val) => {
    if (!val) return
    const items = val.split(/,\s*|\n+/).map(s => s.trim()).filter(Boolean)
    if (items.length === 0) return

    setForm(prev => {
      const existing = parseDiagnosisList(prev.diagnosis)
      const combined = [...existing]
      items.forEach(item => {
        if (!combined.some(c => c.toLowerCase() === item.toLowerCase())) {
          combined.push(item)
        }
      })
      return { ...prev, diagnosis: combined.join(', ') }
    })
  }

  const handleRemoveDiagnosis = (targetDiag) => {
    setForm(prev => {
      const existing = parseDiagnosisList(prev.diagnosis)
      const filtered = existing.filter(c => c.toLowerCase() !== targetDiag.toLowerCase())
      return { ...prev, diagnosis: filtered.join(', ') }
    })
  }

  const handleToggleDiagnosisPreset = (presetContent) => {
    if (!presetContent) return
    const isSelected = diagnosisList.some(c => c.toLowerCase() === presetContent.toLowerCase())
    if (isSelected) {
      handleRemoveDiagnosis(presetContent)
    } else {
      handleAddDiagnosis(presetContent)
    }
  }

  // Medicine Autocomplete
  const [medicineSuggestions, setMedicineSuggestions] = useState([])
  const [activeMedicineIndex, setActiveMedicineIndex] = useState(null)
  const [highlightedSuggestion, setHighlightedSuggestion] = useState(-1)
  const medicineSearchTimeout = useRef(null)
  const suggestionsRef = useRef(null)
  const medicineInputRefs = useRef([])
  const formRef = useRef(null)

  // Floating coordinates for Medicine Autocomplete Dropdown (bypasses table overflow clipping)
  const [dropdownCoords, setDropdownCoords] = useState(null)

  useEffect(() => {
    if (activeMedicineIndex === null || medicineSuggestions.length === 0) {
      setDropdownCoords(null)
      return
    }

    const updateCoords = () => {
      const inputEl = medicineInputRefs.current[activeMedicineIndex]
      if (!inputEl) return
      const rect = inputEl.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const openUpward = spaceBelow < 280 && rect.top > 280

      setDropdownCoords({
        top: openUpward ? 'auto' : `${rect.bottom + 4}px`,
        bottom: openUpward ? `${window.innerHeight - rect.top + 4}px` : 'auto',
        left: `${rect.left}px`,
        width: `${Math.max(rect.width, 360)}px`
      })
    }

    updateCoords()
    window.addEventListener('scroll', updateCoords, true)
    window.addEventListener('resize', updateCoords)
    return () => {
      window.removeEventListener('scroll', updateCoords, true)
      window.removeEventListener('resize', updateCoords)
    }
  }, [activeMedicineIndex, medicineSuggestions])

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(e.target) &&
        !medicineInputRefs.current.some(el => el && el.contains(e.target))
      ) {
        setActiveMedicineIndex(null)
        setMedicineSuggestions([])
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  // Synchronize doctor-scoped favorites, combos, templates & notes when doctorScopeId changes
  useEffect(() => {
    // Purge legacy shared global keys to prevent any cross-doctor data leaks
    try {
      localStorage.removeItem('dr_favorite_medicines')
      localStorage.removeItem('dr_quick_combos')
      localStorage.removeItem('dr_note_snippets')
    } catch (e) {}

    if (!doctorScopeId) {
      setFavoriteMedicines([])
      setQuickCombos([])
      setQuickTemplates([])
      setClinicalPresets([])
      return
    }

    try {
      const favKey = `dr_favorite_medicines_${doctorScopeId}`
      const savedFav = localStorage.getItem(favKey)
      if (savedFav) {
        const parsed = JSON.parse(savedFav)
        setFavoriteMedicines(Array.isArray(parsed) ? parsed : [])
      } else {
        setFavoriteMedicines([])
      }

      const comboKey = `dr_quick_combos_${doctorScopeId}`
      const savedCombo = localStorage.getItem(comboKey)
      if (savedCombo) {
        const parsed = JSON.parse(savedCombo)
        setQuickCombos(Array.isArray(parsed) ? parsed : [])
      } else {
        setQuickCombos([])
      }

      const tplKey = `dr_quick_templates_${doctorScopeId}`
      const savedTpl = localStorage.getItem(tplKey)
      if (savedTpl) {
        const parsed = JSON.parse(savedTpl)
        setQuickTemplates(Array.isArray(parsed) ? parsed : [])
      } else {
        setQuickTemplates([])
      }

      const presetKey = `dr_clinical_presets_${doctorScopeId}`
      const savedPresets = localStorage.getItem(presetKey)
      if (savedPresets) {
        const parsed = JSON.parse(savedPresets)
        setClinicalPresets(Array.isArray(parsed) ? parsed : [])
      } else {
        setClinicalPresets([])
      }

      const customClinicalKey = `dr_custom_sections_clinical_${doctorScopeId}`
      const savedCustomClinical = localStorage.getItem(customClinicalKey)
      if (savedCustomClinical) {
        try {
          const parsed = JSON.parse(savedCustomClinical)
          if (Array.isArray(parsed)) setCustomSections(parsed)
        } catch (e) {}
      }

      const customInvKey = `dr_custom_sections_inv_${doctorScopeId}`
      const savedCustomInv = localStorage.getItem(customInvKey)
      if (savedCustomInv) {
        try {
          const parsed = JSON.parse(savedCustomInv)
          if (Array.isArray(parsed)) setCustomInvSections(parsed)
        } catch (e) {}
      }

      // Fetch latest custom sections doctor-wise from database
      getDoctorCustomSections()
        .then(res => {
          const sections = res.data?.data || []
          if (Array.isArray(sections) && sections.length > 0) {
            const clinical = sections.filter(s => s.type === 'clinical').map(s => ({
              id: s.id,
              title: s.title,
              chips: Array.isArray(s.chips) ? s.chips : [],
              text: '',
              chipInput: '',
              showChipInput: false
            }))
            const inv = sections.filter(s => s.type === 'investigation').map(s => ({
              id: s.id,
              title: s.title,
              chips: Array.isArray(s.chips) ? s.chips : [],
              selected: [],
              chipInput: '',
              showChipInput: false
            }))

            if (clinical.length > 0) {
              setCustomSections(prev => {
                return clinical.map(c => {
                  const existing = prev.find(p => p.id === c.id || (p.title && p.title.toLowerCase() === c.title.toLowerCase()))
                  return existing ? { ...c, text: existing.text || '' } : c
                })
              })
              try { localStorage.setItem(`dr_custom_sections_clinical_${doctorScopeId}`, JSON.stringify(clinical)) } catch (e) {}
            }
            if (inv.length > 0) {
              setCustomInvSections(prev => {
                return inv.map(i => {
                  const existing = prev.find(p => p.id === i.id || (p.title && p.title.toLowerCase() === i.title.toLowerCase()))
                  return existing ? { ...i, selected: existing.selected || [] } : i
                })
              })
              try { localStorage.setItem(`dr_custom_sections_inv_${doctorScopeId}`, JSON.stringify(inv)) } catch (e) {}
            }
          }
        })
        .catch(err => console.warn('Failed to fetch doctor custom sections from API:', err))
    } catch (e) {
      console.error('Error syncing doctor storage', e)
      setFavoriteMedicines([])
      setQuickCombos([])
      setQuickTemplates([])
      setClinicalPresets([])
      setCustomSections([])
      setCustomInvSections([])
    }
  }, [doctorScopeId])

  // Load Doctor's Own Chambers for Walk-in Consultation
  useEffect(() => {
    const docId = user?.doctor?.id || user?.doctor_id || user?.doctor?.public_id
    if (!docId) return

    setLoadingChambers(true)
    getChambers({ doctor_id: docId, per_page: 50 })
      .then(res => {
        const list = res.data?.data || res.data || []
        if (Array.isArray(list) && list.length > 0) {
          setDoctorChambers(list)
          const todayDay = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
          const match = list.find(c => (c.day || '').toLowerCase() === todayDay && c.is_active) 
            || list.find(c => c.is_active) 
            || list[0]
          if (match) {
            const hosp = match.hospital || {}
            const chName = match.chamber_name || hosp.name || ''
            const hospName = hosp.name || match.hospital_name || chName
            const hospAddr = hosp.address || match.address || ''
            const hospPhone = hosp.phone || hosp.hotline || match.phone || ''
            const hospHotline = hosp.hotline || hosp.phone || match.hotline || ''
            const hospWeb = hosp.url || hosp.website || match.website || (hosp.slug ? `www.${hosp.slug}.com` : '')
            const hospLogo = hosp.hospital_logo || hosp.photo_url || hosp.photo || match.photo || ''

            setWalkInForm(prev => {
              if (prev.chamber_id) return prev
              return {
                ...prev,
                chamber_id: match.id || match.public_id,
                chamber_name: chName,
                chamber_address: hospAddr,
                chamber_phone: hospPhone,
                chamber_hotline: hospHotline,
                chamber_website: hospWeb,
                chamber_logo: hospLogo,
                hospital_id: match.hospital_id || hosp.id || '',
                hospital_name: hospName,
                hospital_address: hospAddr,
                hospital_phone: hospPhone,
                hospital_hotline: hospHotline,
                hospital_website: hospWeb,
                hospital_logo: hospLogo,
              }
            })

            setForm(prev => {
              if (prev.chamber_id) return prev
              return {
                ...prev,
                chamber_id: match.id || match.public_id,
                chamber_name: chName,
                chamber_name_bn: match.chamber_name_bn || hosp.name_bn || '',
                chamber_address: hospAddr,
                chamber_phone: hospPhone,
                chamber_hotline: hospHotline,
                chamber_website: hospWeb,
                chamber_logo: hospLogo,
                hospital_id: match.hospital_id || hosp.id || prev.hospital_id,
                hospital_name: hospName,
                hospital_name_bn: hosp.name_bn || prev.hospital_name_bn || '',
                hospital_address: hospAddr,
                hospital_phone: hospPhone,
                hospital_hotline: hospHotline,
                hospital_website: hospWeb,
                hospital_logo: hospLogo,
              }
            })
          }
        }
      })
      .catch(err => {
        console.warn('Failed to fetch doctor chambers:', err)
      })
      .finally(() => setLoadingChambers(false))
  }, [user?.doctor?.id, user?.doctor_id, user?.doctor?.public_id])

  // Fetch Appointment or Existing Prescription
  useEffect(() => {
    if (isEdit && id) {
      setLoading(true)
      getPrescription(id)
        .then(res => {
          const p = res.data?.data || res.data
          if (p) {
            setPrescriptionDoctorId(p.doctor_id || p.doctor_public_id || null)
            setPrescriptionDoctorName(p.doctor_name || '')

            if (p.status === 'draft') {
              setIsDraftStatus(true)
              setActiveDraftId(p.id)
            }

            // Enforce note privacy: only the authoring doctor or admin can see confidential notes
            let viewNotesAllowed = true
            if (p.can_view_notes !== undefined) {
              viewNotesAllowed = !!p.can_view_notes
            } else {
              const currentDocId = user?.doctor?.id || user?.doctor_id
              const isAdminUser = user?.role === 'admin' || user?.registration_type === 'admin' || user?.role_id === 1
              const isOwner = !p.doctor_id || !currentDocId || (String(p.doctor_id) === String(currentDocId))
              viewNotesAllowed = isAdminUser || isOwner
            }
            setCanViewNotes(viewNotesAllowed)

            setForm({
              appointment_id: p.appointment_id || '',
              diagnosis: p.diagnosis || '',
              advice: p.advice || '',
              follow_up_date: p.follow_up_date ? p.follow_up_date.split('T')[0] : '',
              follow_up_offset: '5 Days',
              cc: p.cc || '',
              oe: p.oe || '',
              oh: p.oh || '',
              mh: p.mh || '',
              notes: viewNotesAllowed ? (p.notes || '') : '',
              investigation: p.investigation || '',
              age: p.patient_age || p.age || '',
              sex: p.patient_sex || p.sex || '',
              weight: p.patient_weight || p.weight || '',
              registration_no: p.patient_public_id || p.patient?.public_id || p.registration_no || p.patient_id || '',
              patient_id: p.patient_public_id || p.patient?.public_id || p.patient_id || p.patient?.patient_id || p.patient?.id || p.registration_no || '',
              chamber_id: p.chamber_id || p.appointment?.chamber_id || p.appointment?.chamber?.id || '',
              chamber_name: p.chamber_name || p.appointment?.chamber?.chamber_name || p.appointment?.chamber?.hospital?.name || '',
              chamber_name_bn: p.chamber_name_bn || p.appointment?.chamber?.hospital?.name_bn || '',
              chamber_address: p.chamber_address || p.appointment?.chamber?.hospital?.address || '',
              chamber_phone: p.chamber_phone || p.appointment?.chamber?.hospital?.phone || '',
              chamber_hotline: p.chamber_hotline || p.appointment?.chamber?.hospital?.hotline || '',
              chamber_website: p.chamber_website || p.appointment?.chamber?.hospital?.url || '',
              chamber_logo: p.chamber_logo || p.appointment?.chamber?.hospital?.hospital_logo || '',
              hospital_id: p.hospital_id || p.appointment?.hospital_id || p.appointment?.chamber?.hospital_id || '',
              hospital_name: p.hospital_name || p.appointment?.chamber?.hospital?.name || p.appointment?.hospital?.name || '',
              hospital_name_bn: p.hospital_name_bn || p.appointment?.chamber?.hospital?.name_bn || '',
              hospital_address: p.hospital_address || p.appointment?.chamber?.hospital?.address || '',
              hospital_phone: p.hospital_phone || p.appointment?.chamber?.hospital?.phone || '',
              hospital_hotline: p.hospital_hotline || p.appointment?.chamber?.hospital?.hotline || '',
              hospital_email: p.hospital_email || '',
              hospital_website: p.hospital_website || p.appointment?.chamber?.hospital?.url || '',
              hospital_logo: p.hospital_logo || p.appointment?.chamber?.hospital?.hospital_logo || '',
              medicines: Array.isArray(p.medicines) && p.medicines.length > 0 
                ? p.medicines.map(m => ({
                    _id: Math.random().toString(36).substring(2, 9),
                    medicine_name: m.medicine_name || '',
                    type: m.type || '',
                    strength: m.strength || '',
                    dose: m.dose || '',
                    dosage: m.dosage || '',
                    duration: m.duration || '',
                    meal: m.meal || '',
                    instructions: m.instructions || ''
                  }))
                : [emptyMedicine()]
            })

            if (p.investigation) {
              setInvestigationList(p.investigation.split(/[\n,]+/).map(s => s.trim()).filter(Boolean))
            } else {
              setInvestigationList([])
            }
            if (p.notes && viewNotesAllowed) {
              setNoteList(p.notes.split(/[\n,]+/).map(s => s.trim()).filter(Boolean))
            } else {
              setNoteList([])
            }
            if (p.advice) {
              const lines = p.advice.split('\n').map(s => s.replace(/^[•\-\*]\s*/, '').trim()).filter(Boolean)
              setAdviceChecklist(lines.map((l, i) => ({ id: `adv_${i}`, text: l, checked: true })))
            } else {
              setAdviceChecklist([])
            }
            if (p.appointment) {
              setAppointmentInfo(p.appointment)
            }

            if (Array.isArray(p.custom_sections) && p.custom_sections.length > 0) {
              setCustomSections(prev => {
                const updated = [...prev]
                p.custom_sections.forEach(savedSec => {
                  const idx = updated.findIndex(u => u.id === savedSec.id || (u.title && u.title.toLowerCase() === (savedSec.title || '').toLowerCase()))
                  if (idx !== -1) {
                    updated[idx] = { ...updated[idx], text: savedSec.text || '' }
                  } else if (savedSec.title) {
                    updated.push({
                      id: savedSec.id || `custom_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
                      title: savedSec.title,
                      chips: savedSec.chips || [],
                      text: savedSec.text || '',
                      chipInput: '',
                      showChipInput: false
                    })
                  }
                })
                return updated
              })
            }

            if (p.vitals && typeof p.vitals === 'object' && Object.keys(p.vitals).length > 0) {
              setVitals(prev => ({ ...prev, ...p.vitals }))
            } else if (p.oe || p.weight || p.patient_weight) {
              const parsed = parseVitalsFromOe(p.oe, p.patient_weight || p.weight)
              if (parsed.bp_systolic || parsed.pulse || parsed.temp || parsed.weight || parsed.height_ft) {
                setVitals(prev => ({ ...prev, ...parsed }))
              }
            }
          }
        })
        .catch(err => {
          showError({ title: 'Error', message: getErrorMessage(err, 'Failed to load prescription') })
        })
        .finally(() => setLoading(false))
    } else if (appointmentId) {
      getAppointment(appointmentId)
        .then(res => {
          const a = res.data?.data || res.data
          if (a) {
            setAppointmentInfo(a)
            const dob = a.patient_dob || a.patient?.dob || a.patient?.date_of_birth || a.user?.dob
            let resolvedAge = a.patient_age || a.patient?.patient_age || ''
            if (!resolvedAge && dob) {
              resolvedAge = calculateAgeFromDob(dob) || ''
            }
            const ch = a.chamber || {}
            const hosp = ch.hospital || a.hospital || {}
            const chName = ch.chamber_name || ch.name || hosp.name || a.chamber_name || ''
            const hospName = hosp.name || a.hospital_name || chName
            const hospAddr = hosp.address || ch.address || a.hospital_address || ''
            const hospPhone = hosp.phone || hosp.hotline || ch.phone || a.hospital_phone || ''
            const hospHotline = hosp.hotline || hosp.phone || ch.hotline || a.hospital_phone || ''
            const hospWeb = hosp.url || hosp.website || (hosp.slug ? `www.${hosp.slug}.com` : '') || ''
            const hospLogo = hosp.hospital_logo || hosp.photo_url || hosp.photo || ''

            const p = a.prescription
            if (p && p.status === 'draft') {
              setIsDraftStatus(true)
              setActiveDraftId(p.id)
              setForm(prev => ({
                ...prev,
                appointment_id: appointmentId,
                diagnosis: p.diagnosis || '',
                advice: p.advice || '',
                follow_up_date: p.follow_up_date ? p.follow_up_date.split('T')[0] : '',
                follow_up_offset: '5 Days',
                cc: p.cc || '',
                oe: p.oe || '',
                oh: p.oh || '',
                mh: p.mh || '',
                notes: p.notes || '',
                investigation: p.investigation || '',
                age: resolvedAge || p.patient_age || p.age || prev.age,
                sex: a.patient_sex || a.patient?.gender || p.patient_sex || p.sex || prev.sex,
                weight: a.patient_weight || p.patient_weight || p.weight || prev.weight,
                chamber_id: p.chamber_id || ch.id || ch.public_id || a.chamber_id || prev.chamber_id || '',
                chamber_name: p.chamber_name || chName || prev.chamber_name || '',
                chamber_name_bn: p.chamber_name_bn || ch.name_bn || hosp.name_bn || prev.chamber_name_bn || '',
                chamber_address: p.chamber_address || hospAddr || prev.chamber_address || '',
                chamber_phone: p.chamber_phone || hospPhone || prev.chamber_phone || '',
                chamber_hotline: p.chamber_hotline || hospHotline || prev.chamber_hotline || '',
                chamber_website: p.chamber_website || hospWeb || prev.chamber_website || '',
                chamber_logo: p.chamber_logo || hospLogo || prev.chamber_logo || '',
                hospital_id: p.hospital_id || hosp.id || prev.hospital_id || '',
                hospital_name: p.hospital_name || hospName || prev.hospital_name || '',
                hospital_name_bn: p.hospital_name_bn || hosp.name_bn || prev.hospital_name_bn || '',
                hospital_address: p.hospital_address || hospAddr || prev.hospital_address || '',
                hospital_phone: p.hospital_phone || hospPhone || prev.hospital_phone || '',
                hospital_hotline: p.hospital_hotline || hospHotline || prev.hospital_hotline || '',
                hospital_website: p.hospital_website || hospWeb || prev.hospital_website || '',
                hospital_logo: p.hospital_logo || hospLogo || prev.hospital_logo || '',
                patient_id: a.patient_public_id || a.patient?.public_id || a.patient?.patient_id || a.patient_id || a.user?.patient_id || a.patient?.id || a.user_id || '',
                registration_no: a.patient_public_id || a.patient?.public_id || a.patient?.patient_id || a.registration_id || a.patient_id || '',
                medicines: Array.isArray(p.medicines) && p.medicines.length > 0 
                  ? p.medicines.map(m => ({
                      _id: Math.random().toString(36).substring(2, 9),
                      medicine_name: m.medicine_name || '',
                      type: m.type || '',
                      strength: m.strength || '',
                      dose: m.dose || '',
                      dosage: m.dosage || '',
                      duration: m.duration || '',
                      meal: m.meal || '',
                      instructions: m.instructions || ''
                    }))
                  : (prev.medicines?.length ? prev.medicines : [emptyMedicine()])
              }))

              if (p.investigation) {
                setInvestigationList(p.investigation.split(/[\n,]+/).map(s => s.trim()).filter(Boolean))
              }
              if (p.notes) {
                setNoteList(p.notes.split(/[\n,]+/).map(s => s.trim()).filter(Boolean))
              }
              if (p.advice) {
                const lines = p.advice.split('\n').map(s => s.replace(/^[•\-\*]\s*/, '').trim()).filter(Boolean)
                setAdviceChecklist(lines.map((l, i) => ({ id: `adv_${i}`, text: l, checked: true })))
              }
              if (Array.isArray(p.custom_sections) && p.custom_sections.length > 0) {
                setCustomSections(prev => {
                  const updated = [...prev]
                  p.custom_sections.forEach(savedSec => {
                    const idx = updated.findIndex(u => u.id === savedSec.id || (u.title && u.title.toLowerCase() === (savedSec.title || '').toLowerCase()))
                    if (idx !== -1) {
                      updated[idx] = { ...updated[idx], text: savedSec.text || '' }
                    } else if (savedSec.title) {
                      updated.push({
                        id: savedSec.id || `custom_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
                        title: savedSec.title,
                        chips: savedSec.chips || [],
                        text: savedSec.text || '',
                        chipInput: '',
                        showChipInput: false
                      })
                    }
                  })
                  return updated
                })
              }
              if (p.vitals && typeof p.vitals === 'object' && Object.keys(p.vitals).length > 0) {
                setVitals(prev => ({ ...prev, ...p.vitals }))
              } else if (p.oe || p.weight || a.patient_weight) {
                const parsed = parseVitalsFromOe(p.oe, p.weight || a.patient_weight)
                if (parsed.bp_systolic || parsed.pulse || parsed.temp || parsed.weight || parsed.height_ft) {
                  setVitals(prev => ({ ...prev, ...parsed }))
                }
              }
            } else {
              if (a.patient_weight) {
                setVitals(prev => ({ ...prev, weight: a.patient_weight }))
              }
              setForm(prev => ({
                ...prev,
                appointment_id: appointmentId,
                age: resolvedAge || prev.age,
                sex: a.patient_sex || a.patient?.gender || prev.sex,
                weight: a.patient_weight || prev.weight,
                chamber_id: ch.id || ch.public_id || a.chamber_id || prev.chamber_id || '',
                chamber_name: chName || prev.chamber_name || '',
                chamber_name_bn: ch.name_bn || hosp.name_bn || prev.chamber_name_bn || '',
                chamber_address: hospAddr || prev.chamber_address || '',
                chamber_phone: hospPhone || prev.chamber_phone || '',
                chamber_hotline: hospHotline || prev.chamber_hotline || '',
                chamber_website: hospWeb || prev.chamber_website || '',
                chamber_logo: hospLogo || prev.chamber_logo || '',
                hospital_id: hosp.id || prev.hospital_id || '',
                hospital_name: hospName || prev.hospital_name || '',
                hospital_name_bn: hosp.name_bn || prev.hospital_name_bn || '',
                hospital_address: hospAddr || prev.hospital_address || '',
                hospital_phone: hospPhone || prev.hospital_phone || '',
                hospital_hotline: hospHotline || prev.hospital_hotline || '',
                hospital_website: hospWeb || prev.hospital_website || '',
                hospital_logo: hospLogo || prev.hospital_logo || '',
                patient_id: a.patient_public_id || a.patient?.public_id || a.patient?.patient_id || a.patient_id || a.user?.patient_id || a.patient?.id || a.user_id || '',
                registration_no: a.patient_public_id || a.patient?.public_id || a.patient?.patient_id || a.registration_id || a.patient_id || ''
              }))
            }
          }
        })
        .catch(() => {})
    }
  }, [id, isEdit, appointmentId])

  // Load Clinical Timeline for the active patient
  useEffect(() => {
    const activePatientId = walkInPatientInfo?.patient_id
      || walkInPatientInfo?.registration_no
      || appointmentInfo?.patient_public_id
      || appointmentInfo?.patient?.public_id
      || form.patient_public_id
      || form.patient_id
      || appointmentInfo?.patient?.patient_id
      || appointmentInfo?.patient_id
      || appointmentInfo?.user?.patient_id
      || appointmentInfo?.patient?.id
      || appointmentInfo?.user_id

    if (!activePatientId || activePatientId === '—') return

    let isMounted = true
    setTimelineLoading(true)
    setTimelineError(null)

    getPatientClinicalTimeline(activePatientId, { per_page: 20 })
      .then(res => {
        if (!isMounted) return
        const timelineEvents = Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : [])
        setClinicalTimeline(timelineEvents)

        // Auto-calculate upcoming visit number if creating a new prescription
        if (!isEdit) {
          const rxEvents = timelineEvents.filter(ev => ev.type === 'prescription')
          const nextVisit = String(rxEvents.length + 1).padStart(2, '0')
          setForm(prev => ({
            ...prev,
            visit_no: nextVisit
          }))
        }
      })
      .catch(err => {
        if (!isMounted) return
        console.warn('Could not load patient clinical timeline:', err)
        setTimelineError(getErrorMessage(err, 'Timeline unavailable'))
      })
      .finally(() => {
        if (isMounted) setTimelineLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [appointmentInfo, form.patient_id, form.patient_public_id, walkInPatientInfo, isEdit])

  // Load Doctor Personal Favorites & Quick Templates from Database (Cloud-Synced)
  useEffect(() => {
    let isMounted = true

    // Fetch favorite medicines
    getDoctorFavoriteMedicines()
      .then(res => {
        if (!isMounted) return
        const favs = Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : [])
        setFavoriteMedicines(favs)
        if (doctorScopeId) {
          try {
            localStorage.setItem(`dr_favorite_medicines_${doctorScopeId}`, JSON.stringify(favs))
          } catch (e) {}
        }
      })
      .catch(err => {
        console.warn('Could not load database favorite medicines, using local cache:', err)
      })

    // Fetch quick templates
    getDoctorQuickTemplates()
      .then(res => {
        if (!isMounted) return
        const tpls = Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : [])
        setQuickTemplates(tpls)
        if (doctorScopeId) {
          try {
            localStorage.setItem(`dr_quick_templates_${doctorScopeId}`, JSON.stringify(tpls))
          } catch (e) {}
        }
      })
      .catch(err => {
        console.warn('Could not load database quick templates, using local cache:', err)
      })

    // Fetch doctor clinical presets (Diagnosis, CC, OE, MH, OH, Investigation, Advice, Note)
    getDoctorClinicalPresets()
      .then(res => {
        if (!isMounted) return
        const presets = Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : [])
        setClinicalPresets(presets)
        if (doctorScopeId) {
          try {
            localStorage.setItem(`dr_clinical_presets_${doctorScopeId}`, JSON.stringify(presets))
          } catch (e) {}
        }
      })
      .catch(err => {
        console.warn('Could not load database clinical presets, using local cache:', err)
      })

    // Fetch doctor custom sections (Clinical & Investigation)
    getDoctorCustomSections()
      .then(res => {
        if (!isMounted) return
        const allSections = Array.isArray(res.data?.data) ? res.data.data : []
        const clinicalSecs = allSections.filter(s => s.type === 'clinical').map(s => ({
          ...s,
          chips: Array.isArray(s.chips) ? s.chips : [],
          text: '',
          chipInput: '',
          showChipInput: false
        }))
        const invSecs = allSections.filter(s => s.type === 'investigation').map(s => ({
          ...s,
          chips: Array.isArray(s.chips) ? s.chips : [],
          selected: [],
          chipInput: '',
          showChipInput: false
        }))

        // Merge with existing text/selection in current prescription form
        setCustomSections(prev => {
          if (clinicalSecs.length === 0 && prev.length > 0) return prev
          return clinicalSecs.map(cs => {
            const existing = prev.find(p => p.id === cs.id || p.title === cs.title)
            return existing ? { ...cs, text: existing.text || '', chips: cs.chips } : cs
          })
        })
        setCustomInvSections(prev => {
          if (invSecs.length === 0 && prev.length > 0) return prev
          return invSecs.map(is => {
            const existing = prev.find(p => p.id === is.id || p.title === is.title)
            return existing ? { ...is, selected: existing.selected || [], chips: is.chips } : is
          })
        })

        if (doctorScopeId) {
          try {
            localStorage.setItem(`dr_custom_sections_clinical_${doctorScopeId}`, JSON.stringify(clinicalSecs))
            localStorage.setItem(`dr_custom_sections_inv_${doctorScopeId}`, JSON.stringify(invSecs))
          } catch (e) {}
        }
      })
      .catch(err => {
        console.warn('Could not load database custom sections, using local cache:', err)
      })

    return () => {
      isMounted = false
    }
  }, [doctorScopeId])

  const handleCopyMedicines = async (sourcePrescriptionId) => {
    const isDoctorUser = !!user?.doctor?.id || user?.role === 'doctor' || user?.registration_type === 'doctor' || user?.role_id === 2
    if (!isDoctorUser) {
      showError({
        title: 'Action Restricted',
        message: 'Only registered medical doctors are authorized to copy medicines into an active prescription.'
      })
      return
    }

    try {
      setCopyingMedicinesId(sourcePrescriptionId)
      const res = await copyPrescriptionMedicines(sourcePrescriptionId, { destination_context: 'active_prescription_form' })
      const copiedMeds = res.data?.medicines || []

      if (!copiedMeds || copiedMeds.length === 0) {
        showError({
          title: 'No Medicines Found',
          message: 'The selected prescription does not contain any medicines to copy.'
        })
        return
      }

      const formattedMeds = copiedMeds.map(m => ({
        _id: Math.random().toString(36).substring(2, 9),
        medicine_name: m.medicine_name || '',
        type: m.type || 'Tablet',
        strength: m.strength || '',
        dose: m.dose || '1 ' + (m.type || 'Tablet'),
        dosage: m.dosage || '1+0+1',
        duration: m.duration || '5 Days',
        meal: m.meal || 'After Meal',
        instructions: m.instructions || ''
      }))

      setForm(prev => {
        const existing = prev.medicines.filter(m => m.medicine_name && m.medicine_name.trim())
        return {
          ...prev,
          medicines: [...existing, ...formattedMeds]
        }
      })

      showSuccess({
        title: 'Medicines Copied',
        message: `Successfully loaded ${copiedMeds.length} medicine(s) from Rx #${res.data?.source_id || sourcePrescriptionId}. Diagnosis, advice, and clinical notes were kept untouched.`
      })
    } catch (err) {
      showError({
        title: 'Copy Failed',
        message: getErrorMessage(err, 'Failed to copy medicines from previous prescription.')
      })
    } finally {
      setCopyingMedicinesId(null)
    }
  }

  const handleViewHistoricalRx = (rxEvent) => {
    const p = rxEvent.payload || {}
    setHistoryModalRx({
      id: rxEvent.id || p.public_id,
      public_id: rxEvent.id || p.public_id,
      patient_name: patientName,
      patient_age: patientAge,
      patient_public_id: patientId,
      visit_no: p.visit_no_display || String(rxEvent.visit_no).padStart(2, '0'),
      visited_at: rxEvent.occurred_at,
      visiting_time_display: p.visiting_time_display,
      diagnosis: p.diagnosis || rxEvent.summary,
      advice: p.advice || '',
      doctor_name: p.doctor_name || 'Consultant Doctor',
      medicines: Array.isArray(p.medicines) ? p.medicines : [],
      created_at: rxEvent.occurred_at,
      status: p.status || 'finalized'
    })
    setShowHistoryModal(true)
  }

  // Auto-Save & Draft Storage Handler
  const performSaveDraft = async (silent = false, overrideApptId = null, overrideForm = null) => {
    setAutoSaveStatus('saving')
    try {
      const activeForm = overrideForm || form
      // 1. Client-side backup
      const draftData = {
        form: activeForm,
        investigationList,
        adviceChecklist,
        noteList,
        customSections,
        customInvSections,
        walkInPatientInfo,
        walkInForm,
        appointmentInfo,
        vitals,
        activeDraftId: activeDraftId || undefined,
        savedAt: new Date().toISOString()
      }
      localStorage.setItem(draftKey, JSON.stringify(draftData))
      const now = Date.now()
      setLastSavedTime(now)
      setHasUnsavedChanges(false)

      // 2. Database Draft Sync (if appointment exists)
      // Use the public_id (string) for the appointment identifier — backend resolves it via IdentifierResolver
      const rawApptId = overrideApptId
        || appointmentInfo?.public_id || appointmentInfo?.id
        || activeForm.appointment_id
        || appointmentId
        || undefined
      const targetApptId = rawApptId  // used for label only
      if (rawApptId) {
        const cleanMeds = (activeForm.medicines || [])
          .filter(m => m.medicine_name && m.medicine_name.trim())
          .map(m => ({
            medicine_name: m.medicine_name.trim(),
            type: m.type || 'Tablet',
            strength: m.strength || '',
            dose: m.dose || '1 Tablet',
            dosage: m.dosage || m.frequency || '1+0+1',
            duration: m.duration || '5 Days',
            meal: m.meal || 'After Meal',
            instructions: m.instructions || ''
          }))

        const currentDraftId = activeDraftId || (isEdit && id ? id : null)
        const customSecPayload = (customSections || []).map(s => ({ id: s.id, title: s.title, text: s.text }))

        if (currentDraftId) {
          // UPDATE — don't need appointment_id, add chamber_id for syncing
          const updatePayload = {
            chamber_id: activeForm.chamber_id || undefined,
            status: 'draft',
            diagnosis: activeForm.diagnosis || '',
            medicines: cleanMeds,
            advice: activeForm.advice || '',
            follow_up_date: activeForm.follow_up_date || undefined,
            cc: activeForm.cc || '',
            oe: activeForm.oe || '',
            oh: activeForm.oh || '',
            mh: activeForm.mh || '',
            custom_sections: customSecPayload,
            ...(canViewNotes ? { notes: activeForm.notes } : {}),
            investigation: activeForm.investigation || '',
            vitals: vitals || undefined,
            age: activeForm.age || '',
            sex: activeForm.sex || 'Male',
            weight: activeForm.weight || '',
            registration_no: activeForm.registration_no || activeForm.patient_public_id || '',
            visited_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
          }
          await updatePrescription(currentDraftId, updatePayload)
          setIsDraftStatus(true)
        } else {
          // CREATE — use appointment_public_id for backend resolution
          const createPayload = {
            appointment_public_id: rawApptId,
            chamber_id: activeForm.chamber_id || undefined,
            status: 'draft',
            diagnosis: activeForm.diagnosis || '',
            medicines: cleanMeds,
            advice: activeForm.advice || '',
            follow_up_date: activeForm.follow_up_date || undefined,
            cc: activeForm.cc || '',
            oe: activeForm.oe || '',
            oh: activeForm.oh || '',
            mh: activeForm.mh || '',
            custom_sections: customSecPayload,
            ...(canViewNotes ? { notes: activeForm.notes } : {}),
            investigation: activeForm.investigation || '',
            vitals: vitals || undefined,
            age: activeForm.age || '',
            sex: activeForm.sex || 'Male',
            weight: activeForm.weight || '',
            registration_no: activeForm.registration_no || activeForm.patient_public_id || '',
            visited_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
          }
          const res = await createPrescription(createPayload)
          const newDraftId = res.data?.data?.id || res.data?.id
          if (newDraftId) {
            setActiveDraftId(newDraftId)
            setIsDraftStatus(true)
            window.history.replaceState(null, '', `/admin/prescriptions/edit/${newDraftId}`)
          }
        }
      }

      setAutoSaveStatus('saved')
      setAutoSaveLabel(targetApptId ? 'Draft saved to Doctor Panel' : 'Auto saved locally')
      window.dispatchEvent(new CustomEvent('rx-draft-count-updated'))
      if (!silent) {
        showSuccess({
          title: 'Draft Saved',
          message: targetApptId
            ? 'Prescription draft saved to your Doctor Panel.'
            : 'Prescription draft saved to local browser storage.'
        })
      }
    } catch (err) {
      console.error('Failed to save draft:', err)
      setAutoSaveStatus('unsaved')
      if (!silent) {
        showError({ title: 'Save Error', message: getErrorMessage(err, 'Could not save draft.') })
      }
    }
  }

  // Ref tracking latest state for clean unmount/navigation auto-save
  const latestDraftRef = useRef({})
  useEffect(() => {
    latestDraftRef.current = {
      form,
      investigationList,
      adviceChecklist,
      noteList,
      customSections,
      customInvSections,
      walkInPatientInfo,
      walkInForm,
      appointmentInfo,
      vitals,
      activeDraftId,
      // Prefer public_id (string) so backend IdentifierResolver can resolve it
      targetApptId: appointmentInfo?.public_id || form.appointment_id || appointmentId,
      hasUnsavedChanges,
      isEdit,
      id
    }
  })

  // Flush draft on unmount / page navigation / beforeunload
  useEffect(() => {
    const handleBeforeUnload = () => {
      const state = latestDraftRef.current
      if (state?.form) {
        try {
          localStorage.setItem(draftKey, JSON.stringify({
            form: state.form,
            investigationList: state.investigationList,
            adviceChecklist: state.adviceChecklist,
            noteList: state.noteList,
            customSections: state.customSections,
            customInvSections: state.customInvSections,
            walkInPatientInfo: state.walkInPatientInfo,
            walkInForm: state.walkInForm,
            appointmentInfo: state.appointmentInfo,
            vitals: state.vitals,
            activeDraftId: state.activeDraftId,
            savedAt: new Date().toISOString()
          }))
        } catch (e) {}
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      const state = latestDraftRef.current
      if (state?.hasUnsavedChanges) {
        const cleanMeds = (state.form.medicines || [])
          .filter(m => m.medicine_name && m.medicine_name.trim())
          .map(m => ({
            medicine_name: m.medicine_name.trim(),
            type: m.type || 'Tablet',
            strength: m.strength || '',
            dose: m.dose || '1 Tablet',
            dosage: m.dosage || m.frequency || '1+0+1',
            duration: m.duration || '5 Days',
            meal: m.meal || 'After Meal',
            instructions: m.instructions || ''
          }))

        const basePayload = {
          chamber_id: state.form.chamber_id || undefined,
          status: 'draft',
          diagnosis: state.form.diagnosis || '',
          medicines: cleanMeds,
          advice: state.form.advice || '',
          follow_up_date: state.form.follow_up_date || undefined,
          cc: state.form.cc || '',
          oe: state.form.oe || '',
          oh: state.form.oh || '',
          mh: state.form.mh || '',
          custom_sections: (state.customSections || []).map(s => ({ id: s.id, title: s.title, text: s.text })),
          investigation: state.form.investigation || '',
          vitals: state.vitals || undefined,
          age: state.form.age || '',
          sex: state.form.sex || 'Male',
          weight: state.form.weight || '',
          registration_no: state.form.registration_no || state.form.patient_public_id || '',
          visited_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
        }

        const draftId = state.activeDraftId || (state.isEdit && state.id ? state.id : null)
        if (draftId) {
          updatePrescription(draftId, basePayload).catch(e => console.warn('Unmount update draft error', e))
        } else if (state.targetApptId) {
          createPrescription({ ...basePayload, appointment_public_id: state.targetApptId }).catch(e => console.warn('Unmount create draft error', e))
        }
      }
    }
  }, [draftKey])

  // Restore draft on mount if available (for new prescriptions)
  // This effect re-runs when draftKey changes (i.e. when doctorScopeId becomes available after login)
  // Uses draftRestoredRef to prevent double-restore — only restores once
  useEffect(() => {
    if (isEdit && id) return
    // Only restore once — prevent overwriting if appointment data already loaded
    if (draftRestoredRef.current) return
    try {
      // Try the current (possibly scoped) draftKey first; fallback to 'anon' key if doctorScopeId just resolved
      const anonKey = `dr_rx_draft_anon_${appointmentId || (activeDraftId || id ? `rx_${activeDraftId || id}` : 'walkin')}`
      const saved = localStorage.getItem(draftKey) || (doctorScopeId ? localStorage.getItem(anonKey) : null)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed?.form) {
          const hasMeds = Array.isArray(parsed.form.medicines) && parsed.form.medicines.some(m => (m.medicine_name || '').trim().length > 0)
          const hasText = !!(parsed.form.diagnosis?.trim() || parsed.form.advice?.trim() || parsed.form.cc?.trim() || parsed.form.patient_name?.trim())
          if (hasMeds || hasText) {
            draftRestoredRef.current = true
            setForm(prev => ({ ...prev, ...parsed.form }))
            if (Array.isArray(parsed.investigationList)) setInvestigationList(parsed.investigationList)
            if (Array.isArray(parsed.adviceChecklist)) setAdviceChecklist(parsed.adviceChecklist)
            if (Array.isArray(parsed.noteList)) {
              setNoteList(parsed.noteList)
            } else if (parsed.form?.notes) {
              setNoteList(parsed.form.notes.split(/[\n,]+/).map(s => s.trim()).filter(Boolean))
            }
            if (Array.isArray(parsed.customSections)) setCustomSections(parsed.customSections)
            if (Array.isArray(parsed.customInvSections)) setCustomInvSections(parsed.customInvSections)
            if (parsed.walkInPatientInfo) setWalkInPatientInfo(parsed.walkInPatientInfo)
            if (parsed.walkInForm) setWalkInForm(parsed.walkInForm)
            if (parsed.appointmentInfo) setAppointmentInfo(parsed.appointmentInfo)
            if (parsed.vitals && typeof parsed.vitals === 'object') setVitals(parsed.vitals)
            if (parsed.activeDraftId) {
              setActiveDraftId(parsed.activeDraftId)
              setIsDraftStatus(true)
            }
            if (parsed.savedAt) setLastSavedTime(new Date(parsed.savedAt).getTime())
            // Migrate anon key to scoped key if needed
            if (doctorScopeId && !localStorage.getItem(draftKey)) {
              localStorage.setItem(draftKey, saved)
              localStorage.removeItem(anonKey)
            }
          }
        }
      }
    } catch (e) {}
  }, [draftKey, doctorScopeId])

  // Relative time ticker for Auto-save pill
  useEffect(() => {
    const timer = setInterval(() => {
      const diffSec = Math.floor((Date.now() - lastSavedTime) / 1000)
      if (diffSec < 8) {
        setAutoSaveLabel('Auto saved just now')
      } else if (diffSec < 60) {
        setAutoSaveLabel(`Auto saved ${diffSec}s ago`)
      } else if (diffSec < 3600) {
        setAutoSaveLabel(`Auto saved ${Math.floor(diffSec / 60)}m ago`)
      } else {
        setAutoSaveLabel(`Draft saved at ${new Date(lastSavedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`)
      }
    }, 4000)
    return () => clearInterval(timer)
  }, [lastSavedTime])

  // Debounced background auto-save on modifications (800ms debounce)
  const isInitialMount = useRef(true)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    setHasUnsavedChanges(true)

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    autoSaveTimerRef.current = setTimeout(() => {
      performSaveDraft(true)
    }, 800)

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    }
  }, [form, investigationList, adviceChecklist, noteList, customSections, vitals])

  // Modal Handlers for Assigning/Updating Age & Gender (Bidirectional Age & DOB Sync)
  const handleOpenAssignAgeModal = () => {
    let currentAge = form.age || (patientAge !== '—' ? patientAge : '')
    const currentSex = form.sex || (patientSex !== '—' ? patientSex : 'Male')
    const rawDob = appointmentInfo?.patient_dob 
      || appointmentInfo?.patient?.dob 
      || appointmentInfo?.patient?.date_of_birth 
      || appointmentInfo?.user?.dob 
      || walkInPatientInfo?.dob

    let initialDob = ''
    if (rawDob) {
      try {
        const d = new Date(rawDob)
        if (!isNaN(d.getTime())) {
          initialDob = d.toISOString().split('T')[0]
        }
      } catch (e) {}
    }

    // Bidirectional consistency on open:
    // If DOB is recent/invalid (e.g. today) while age is provided (e.g. 19), calculate real DOB from age
    if (currentAge && (!initialDob || calculateAgeFromDob(initialDob) !== String(currentAge))) {
      initialDob = calculateDobFromAge(currentAge, initialDob)
    } else if (!currentAge && initialDob) {
      currentAge = calculateAgeFromDob(initialDob) || ''
    }

    setEditAgeInput(currentAge)
    setEditSexInput(currentSex)
    setEditDobInput(initialDob)
    setShowAssignAgeModal(true)
  }

  const handleEditAgeChange = (val) => {
    setEditAgeInput(val)
    if (val !== '' && !isNaN(parseInt(val, 10))) {
      const calculatedDob = calculateDobFromAge(val, editDobInput)
      setEditDobInput(calculatedDob)
    }
  }

  const handleEditDobChange = (e) => {
    const val = e.target.value
    setEditDobInput(val)
    if (val) {
      const calc = calculateAgeFromDob(val)
      if (calc !== null) {
        setEditAgeInput(String(calc))
      }
    }
  }

  const handleSaveAssignAge = async (e) => {
    if (e) e.preventDefault()
    const ageVal = String(editAgeInput || '').trim()
    if (!ageVal) {
      showError({ title: 'Validation Error', message: 'Please enter patient age in years.' })
      return
    }

    setForm(prev => ({
      ...prev,
      age: ageVal,
      sex: editSexInput
    }))

    if (walkInPatientInfo) {
      setWalkInPatientInfo(prev => ({
        ...prev,
        age: ageVal,
        sex: editSexInput
      }))
    }

    if (appointmentId) {
      try {
        await updateAppointment(appointmentId, {
          patient_age: ageVal,
          patient_gender: editSexInput,
          ...(editDobInput ? { patient_dob: editDobInput } : {})
        })
        setAppointmentInfo(prev => ({
          ...prev,
          patient_age: ageVal,
          patient_sex: editSexInput,
          patient_dob: editDobInput || prev?.patient_dob
        }))
      } catch (err) {
        console.warn('Could not sync age to appointment:', err)
      }
    }

    setShowAssignAgeModal(false)
    showSuccess({ title: 'Patient Age Updated', message: `Patient age set to ${ageVal} Y (${editSexInput}).` })
    performSaveDraft(true)
  }

  // Hotkey support
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault()
        performSaveDraft(false)
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        handleSubmit()
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault()
        setShowPreviewModal(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [form, saving, draftKey])

  // Close dropdowns on outside click
  useEffect(() => {
    const closeDropdowns = (e) => {
      if (!e.target.closest('.dr-dropdown-container')) {
        setShowTemplatesDropdown(false)
        setShowQuickAddDropdown(false)
      }
    }
    window.addEventListener('click', closeDropdowns)
    return () => window.removeEventListener('click', closeDropdowns)
  }, [])

  // Calculate BMI
  const calculateBMI = (wtKg, htFt) => {
    const weightNum = parseFloat(wtKg)
    const heightFtNum = parseFloat(htFt)
    if (!weightNum || !heightFtNum || heightFtNum <= 0) return { val: '—', label: '—' }
    const heightM = heightFtNum * 0.3048
    const bmi = weightNum / (heightM * heightM)
    const formatted = bmi.toFixed(1)
    let label = 'Normal'
    if (bmi < 18.5) label = 'Underweight'
    else if (bmi >= 25 && bmi < 30) label = 'Overweight'
    else if (bmi >= 30) label = 'Obese'
    return { val: formatted, label }
  }

  const currentBMI = calculateBMI(vitals.weight, vitals.height_ft)

  // Sync Investigations & Advice to form state
  const syncInvestigations = (list) => {
    setInvestigationList(list)
    setForm(prev => ({ ...prev, investigation: list.join(', ') }))
  }

  const syncAdvice = (checklist) => {
    setAdviceChecklist(checklist)
    const activeText = checklist
      .filter(item => item.checked)
      .map(item => item.text)
      .join('\n')
    setForm(prev => ({ ...prev, advice: activeText }))
  }

  const toggleInvestigationItem = (testName) => {
    if (investigationList.includes(testName)) {
      syncInvestigations(investigationList.filter(t => t !== testName))
    } else {
      syncInvestigations([...investigationList, testName])
    }
  }

  const handleRemoveInvestigation = (index) => {
    syncInvestigations(investigationList.filter((_, i) => i !== index))
  }

  const handleToggleAdvice = (id) => {
    const updated = adviceChecklist.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    )
    syncAdvice(updated)
  }

  const handleAddAdvice = () => {
    if (!newAdviceInput.trim()) return
    const newItem = {
      id: `adv_${Date.now()}`,
      text: newAdviceInput.trim(),
      checked: true
    }
    syncAdvice([...adviceChecklist, newItem])
    setNewAdviceInput('')
  }

  const handleAppendAdviceText = (text) => {
    if (adviceChecklist.some(a => a.text === text)) {
      const updated = adviceChecklist.map(a => a.text === text ? { ...a, checked: !a.checked } : a)
      syncAdvice(updated)
    } else {
      syncAdvice([...adviceChecklist, { id: `adv_${Date.now()}_${Math.random()}`, text, checked: true }])
    }
  }

  // Sync Notes to form state (mirroring syncInvestigations)
  const syncNotes = (list) => {
    setNoteList(list)
    setForm(prev => ({ ...prev, notes: list.join(', ') }))
  }

  const toggleNoteItem = (noteText) => {
    const trimmed = (noteText || '').trim()
    if (!trimmed) return
    const isIncluded = noteList.some(n => n.toLowerCase() === trimmed.toLowerCase())
    if (isIncluded) {
      syncNotes(noteList.filter(n => n.toLowerCase() !== trimmed.toLowerCase()))
    } else {
      syncNotes([...noteList, trimmed])
    }
  }

  const handleRemoveNote = (index) => {
    syncNotes(noteList.filter((_, i) => i !== index))
  }

  const handleAddCustomNoteDirect = () => {
    const trimmed = (newNoteInput || '').trim()
    if (!trimmed) return
    if (!noteList.some(n => n.toLowerCase() === trimmed.toLowerCase())) {
      syncNotes([...noteList, trimmed])
    }
    setNewNoteInput('')
    setShowAddCustomNote(false)
  }

  const handleAddAndSaveCustomNote = async () => {
    const trimmed = (newNoteInput || '').trim()
    if (!trimmed) return
    if (!noteList.some(n => n.toLowerCase() === trimmed.toLowerCase())) {
      syncNotes([...noteList, trimmed])
    }
    await handleSaveClinicalPreset('note', trimmed)
    setNewNoteInput('')
    setShowAddCustomNote(false)
  }

  const handleNotesTextareaChange = (value) => {
    setForm(prev => ({ ...prev, notes: value }))
    const items = value.split(/[\n,]+/).map(s => s.trim()).filter(Boolean)
    setNoteList(items)
  }

  const handleAppendClinicalTag = (field, tagText) => {
    const trimmed = (tagText || '').trim()
    if (!trimmed) return
    if (field === 'notes') {
      toggleNoteItem(trimmed)
      return
    }
    setForm(prev => {
      const current = prev[field] ? prev[field].trim() : ''
      const items = current ? current.split(/,\s*/).map(s => s.trim()).filter(Boolean) : []
      const exists = items.some(item => item.toLowerCase() === trimmed.toLowerCase())
      if (exists) {
        // Toggle OFF: remove it
        const remaining = items.filter(item => item.toLowerCase() !== trimmed.toLowerCase())
        return { ...prev, [field]: remaining.join(', ') }
      } else {
        // Toggle ON: add it
        const updated = current ? `${current}, ${trimmed}` : trimmed
        return { ...prev, [field]: updated }
      }
    })
  }

  const handleFollowUpOffset = (offset) => {
    const today = new Date()
    if (offset === '3 Days') today.setDate(today.getDate() + 3)
    else if (offset === '5 Days') today.setDate(today.getDate() + 5)
    else if (offset === '7 Days') today.setDate(today.getDate() + 7)
    else if (offset === '10 Days') today.setDate(today.getDate() + 10)
    else if (offset === '14 Days') today.setDate(today.getDate() + 14)
    else if (offset === '21 Days') today.setDate(today.getDate() + 21)
    else if (offset === '1 Month') today.setMonth(today.getMonth() + 1)
    else if (offset === '2 Months') today.setMonth(today.getMonth() + 2)

    const yyyy = today.getFullYear()
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const dd = String(today.getDate()).padStart(2, '0')
    setForm(prev => ({
      ...prev,
      follow_up_offset: offset,
      follow_up_date: `${yyyy}-${mm}-${dd}`
    }))
  }

  const applyQuickTemplate = (tpl) => {
    if (!tpl) return
    setForm(prev => ({
      ...prev,
      diagnosis: tpl.diagnosis || prev.diagnosis,
      medicines: Array.isArray(tpl.medicines) && tpl.medicines.length > 0
        ? tpl.medicines.map(m => ({
            _id: Math.random().toString(36).substring(2, 9),
            medicine_name: m.medicine_name,
            type: m.type || 'Tablet',
            strength: m.strength || '',
            dose: m.dose || '1 Tablet',
            dosage: m.frequency || m.dosage || '1+0+1',
            duration: m.duration || '5 Days',
            meal: m.meal || 'After Meal',
            instructions: m.instructions || ''
          }))
        : prev.medicines
    }))
    if (tpl.investigations && Array.isArray(tpl.investigations)) syncInvestigations(tpl.investigations)
    if (tpl.advice && Array.isArray(tpl.advice)) {
      syncAdvice(tpl.advice.map((adv, i) => ({ id: `adv_${i}`, text: adv, checked: true })))
    }
    showSuccess({
      title: 'Template Applied',
      message: `Template "${tpl.name}" applied with ${tpl.medicines?.length || 0} medicine(s).`
    })
  }

  const handleSaveCurrentAsTemplate = (name) => {
    const trimmedName = (name || '').trim()
    if (!trimmedName) {
      showError({ title: 'Template Name Required', message: 'Please enter a name for this template.' })
      return
    }

    const currentMeds = form.medicines
      .filter(m => (m.medicine_name || '').trim())
      .map(m => ({
        medicine_name: m.medicine_name,
        type: m.type || 'Tablet',
        strength: m.strength || '',
        dose: m.dose || '1 Tablet',
        frequency: m.dosage || '1+0+1',
        duration: m.duration || '5 Days',
        meal: m.meal || 'After Meal',
        instructions: m.instructions || ''
      }))

    const newTemplate = {
      name: trimmedName,
      is_custom: true,
      diagnosis: form.diagnosis || '',
      medicines: currentMeds,
      investigations: [...investigationList],
      advice: adviceChecklist.filter(a => a.checked).map(a => a.text),
    }

    createDoctorQuickTemplate(newTemplate)
      .then(res => {
        const saved = res.data?.data || newTemplate
        const updated = [saved, ...quickTemplates]
        setQuickTemplates(updated)
        if (doctorScopeId) {
          try {
            localStorage.setItem(`dr_quick_templates_${doctorScopeId}`, JSON.stringify(updated))
          } catch (e) {}
        }
        showSuccess({
          title: 'Template Saved',
          message: `"${trimmedName}" saved successfully to your database templates.`
        })
      })
      .catch(err => {
        console.warn('Could not save template to database, storing locally:', err)
        const fallback = { ...newTemplate, id: `tpl_${Date.now()}` }
        const updated = [fallback, ...quickTemplates]
        setQuickTemplates(updated)
        if (doctorScopeId) {
          try {
            localStorage.setItem(`dr_quick_templates_${doctorScopeId}`, JSON.stringify(updated))
          } catch (e) {}
        }
        showSuccess({
          title: 'Template Saved (Local)',
          message: `"${trimmedName}" saved locally.`
        })
      })

    setShowSaveTemplateModal(false)
    setTemplateNameInput('')
  }

  const handleDeleteTemplate = async (templateId, e) => {
    e?.stopPropagation()
    const confirmed = await confirm({
      title: 'Delete Template',
      message: 'Are you sure you want to remove this saved template?',
      confirmText: 'Delete',
      variant: 'danger'
    })
    if (confirmed) {
      if (typeof templateId === 'number' || (typeof templateId === 'string' && !templateId.startsWith('tpl_'))) {
        deleteDoctorQuickTemplate(templateId).catch(err => {
          console.warn('Could not delete template from database:', err)
        })
      }
      const updated = quickTemplates.filter(t => (t.id || t.name) !== templateId)
      setQuickTemplates(updated)
      if (doctorScopeId) {
        try {
          localStorage.setItem(`dr_quick_templates_${doctorScopeId}`, JSON.stringify(updated))
        } catch (e) {}
      }
      showSuccess({
        title: 'Template Deleted',
        message: 'Template removed successfully.'
      })
    }
  }

  const handleSelectTemplate = (templateId, templateName) => {
    setSelectedTemplate(templateId)
    try {
      localStorage.setItem('dr_rx_template', templateId)
    } catch (e) {}
    setShowTemplatesDropdown(false)
    showSuccess({
      title: 'Design Template Selected',
      message: `Prescription layout set to "${templateName || templateId}".`
    })
  }

  const saveFavorites = (newList) => {
    setFavoriteMedicines(newList)
    if (doctorScopeId) {
      try {
        localStorage.setItem(`dr_favorite_medicines_${doctorScopeId}`, JSON.stringify(newList))
      } catch (e) {}
    }
  }

  const addFavoriteMedicine = (fav) => {
    setForm(prev => ({
      ...prev,
      medicines: [
        ...prev.medicines.filter(m => m.medicine_name.trim()),
        {
          _id: Math.random().toString(36).substring(2, 9),
          medicine_name: fav.name,
          type: fav.type,
          strength: fav.strength,
          dose: fav.dose || '1 ' + (fav.type || 'Tablet'),
          dosage: fav.frequency,
          duration: fav.duration,
          meal: fav.meal,
          instructions: fav.instructions
        }
      ]
    }))
    setShowFavoritesModal(false)
    showSuccess({ title: 'Medicine Added', message: `${fav.name} added to prescription.` })
  }

  const toggleRowFavorite = (med) => {
    const name = (med.medicine_name || '').trim()
    if (!name) {
      showError({ title: 'Medicine Name Required', message: 'Please enter a medicine name to add to favorites.' })
      return
    }

    const existingIndex = favoriteMedicines.findIndex(f => (f.name || '').toLowerCase() === name.toLowerCase())
    if (existingIndex >= 0) {
      const target = favoriteMedicines[existingIndex]
      if (target.id) {
        deleteDoctorFavoriteMedicine(target.id).catch(err => {
          console.warn('Could not delete favorite from database:', err)
        })
      }
      const updated = favoriteMedicines.filter((_, i) => i !== existingIndex)
      saveFavorites(updated)
      showSuccess({ title: 'Favorite Removed', message: `${name} removed from favorite medicines.` })
    } else {
      const newFavData = {
        name: name,
        type: med.type || 'Tablet',
        strength: med.strength || '',
        dose: med.dose || '1 ' + (med.type || 'Tablet'),
        frequency: med.dosage || '1+0+1',
        duration: med.duration || '5 Days',
        meal: med.meal || 'After Meal',
        instructions: med.instructions || ''
      }
      createDoctorFavoriteMedicine(newFavData)
        .then(res => {
          const savedItem = res.data?.data || newFavData
          const updated = [savedItem, ...favoriteMedicines]
          saveFavorites(updated)
          showSuccess({ title: 'Favorite Added', message: `${name} saved to your database favorites!` })
        })
        .catch(err => {
          console.warn('Could not save favorite to database, saving locally:', err)
          const updated = [newFavData, ...favoriteMedicines]
          saveFavorites(updated)
          showSuccess({ title: 'Favorite Added (Local)', message: `${name} saved to favorites!` })
        })
    }
  }

  const deleteFavoriteItem = (e, index) => {
    e.stopPropagation()
    const target = favoriteMedicines[index]
    if (target && target.id) {
      deleteDoctorFavoriteMedicine(target.id).catch(err => {
        console.warn('Could not delete favorite from database:', err)
      })
    }
    const updated = favoriteMedicines.filter((_, i) => i !== index)
    saveFavorites(updated)
    showSuccess({ title: 'Favorite Deleted', message: `${target.name} removed from favorites.` })
  }

  const handleStartEditFavorite = (e, fav, index) => {
    e.stopPropagation()
    setEditingFavIndex(index)
    setNewFavForm({
      id: fav.id || null,
      name: fav.name || '',
      type: fav.type || 'Tablet',
      strength: fav.strength || '',
      dose: fav.dose || '1 ' + (fav.type || 'Tablet'),
      frequency: fav.frequency || '1+0+1',
      duration: fav.duration || '5 Days',
      meal: fav.meal || 'After Meal',
      instructions: fav.instructions || ''
    })
    setShowAddFavForm(true)
  }

  const handleCancelFavForm = () => {
    setShowAddFavForm(false)
    setEditingFavIndex(null)
    setNewFavForm({
      id: null,
      name: '',
      type: 'Tablet',
      strength: '',
      dose: '1 Tablet',
      frequency: '1+0+1',
      duration: '5 Days',
      meal: 'After Meal',
      instructions: ''
    })
  }

  const handleSaveFavorite = (e) => {
    e.preventDefault()
    if (!newFavForm.name.trim()) {
      showError({ title: 'Validation Error', message: 'Please enter a medicine name.' })
      return
    }
    const savedItem = {
      name: newFavForm.name.trim(),
      type: newFavForm.type || 'Tablet',
      strength: newFavForm.strength || '',
      dose: (newFavForm.dose || '').trim() || ('1 ' + (newFavForm.type || 'Tablet')),
      frequency: newFavForm.frequency || '1+0+1',
      duration: newFavForm.duration || '5 Days',
      meal: newFavForm.meal || 'After Meal',
      instructions: newFavForm.instructions || ''
    }

    if (editingFavIndex !== null && editingFavIndex >= 0) {
      const targetFav = favoriteMedicines[editingFavIndex]
      const favId = targetFav?.id || newFavForm.id

      if (favId) {
        updateDoctorFavoriteMedicine(favId, savedItem).catch(err => {
          console.warn('Could not update favorite in database:', err)
        })
      }

      const updated = [...favoriteMedicines]
      updated[editingFavIndex] = { ...savedItem, id: favId }
      saveFavorites(updated)
      showSuccess({ title: 'Favorite Updated', message: `${savedItem.name} updated successfully.` })
    } else {
      createDoctorFavoriteMedicine(savedItem)
        .then(res => {
          const created = res.data?.data || savedItem
          const updated = [created, ...favoriteMedicines]
          saveFavorites(updated)
          showSuccess({ title: 'Favorite Added', message: `${savedItem.name} saved to your database favorites!` })
        })
        .catch(err => {
          console.warn('Could not save favorite to database, saving locally:', err)
          const updated = [savedItem, ...favoriteMedicines]
          saveFavorites(updated)
          showSuccess({ title: 'Favorite Added (Local)', message: `${savedItem.name} added to favorites.` })
        })
    }

    handleCancelFavForm()
  }

  const saveQuickCombos = (newList) => {
    setQuickCombos(newList)
    if (doctorScopeId) {
      try {
        localStorage.setItem(`dr_quick_combos_${doctorScopeId}`, JSON.stringify(newList))
      } catch (e) {}
    }
  }

  const addQuickCombo = (combo) => {
    setForm(prev => ({
      ...prev,
      medicines: [
        ...prev.medicines.filter(m => m.medicine_name.trim()),
        ...combo.meds.map(m => ({
          _id: Math.random().toString(36).substring(2, 9),
          type: m.type || 'Tablet',
          strength: m.strength || '',
          dose: m.dose || '1 Tablet',
          dosage: m.frequency || m.dosage || '1+0+1',
          duration: m.duration || '5 Days',
          meal: m.meal || 'After Meal',
          instructions: m.instructions || '',
          ...m
        }))
      ]
    }))
    setShowQuickAddDropdown(false)
    showSuccess({ title: 'Combo Added', message: `${combo.title} medicines added.` })
  }

  const deleteQuickCombo = (e, index) => {
    e.stopPropagation()
    const target = quickCombos[index]
    const updated = quickCombos.filter((_, i) => i !== index)
    saveQuickCombos(updated)
    showSuccess({ title: 'Bundle Removed', message: `"${target.title}" removed from Quick Add bundles.` })
  }

  const saveCurrentTableAsBundle = (e) => {
    e.stopPropagation()
    const activeMeds = form.medicines.filter(m => (m.medicine_name || '').trim())
    if (activeMeds.length === 0) {
      showError({ title: 'No Medicines in Table', message: 'Please add at least one medicine to the prescription table first.' })
      return
    }
    const title = prompt('Enter a name for this medicine bundle:', 'My Custom Pack')
    if (!title || !title.trim()) return

    const newBundle = {
      title: title.trim(),
      meds: activeMeds.map(m => ({
        medicine_name: m.medicine_name.trim(),
        type: m.type || 'Tablet',
        strength: m.strength || '',
        dose: m.dose || '1 Tablet',
        frequency: m.dosage || m.frequency || '1+0+1',
        duration: m.duration || '5 Days',
        meal: m.meal || 'After Meal',
        instructions: m.instructions || ''
      }))
    }
    const updated = [...quickCombos, newBundle]
    saveQuickCombos(updated)
    setShowQuickAddDropdown(false)
    showSuccess({ title: 'Bundle Saved', message: `"${newBundle.title}" saved to Quick Add bundles!` })
  }

  const handleOpenCreateBundleModal = (e) => {
    if (e) e.stopPropagation()
    setEditingBundleIndex(null)
    setBundleForm({
      title: '',
      meds: [
        { medicine_name: '', type: 'Tablet', strength: '', dose: '1 Tablet', frequency: '1+0+1', duration: '5 Days', meal: 'After Meal', instructions: '' }
      ]
    })
    setShowQuickAddDropdown(false)
    setShowBundleModal(true)
  }

  const handleOpenEditBundleModal = (e, bundle, index) => {
    if (e) e.stopPropagation()
    setEditingBundleIndex(index)
    setBundleForm({
      title: bundle.title || '',
      meds: Array.isArray(bundle.meds) && bundle.meds.length > 0 
        ? bundle.meds.map(m => ({ ...m }))
        : [{ medicine_name: '', type: 'Tablet', strength: '', dose: '1 Tablet', frequency: '1+0+1', duration: '5 Days', meal: 'After Meal', instructions: '' }]
    })
    setShowQuickAddDropdown(false)
    setShowBundleModal(true)
  }

  const handleAddMedicineToBundleForm = () => {
    setBundleForm(prev => ({
      ...prev,
      meds: [
        ...prev.meds,
        { medicine_name: '', type: 'Tablet', strength: '', dose: '1 Tablet', frequency: '1+0+1', duration: '5 Days', meal: 'After Meal', instructions: '' }
      ]
    }))
  }

  const handleRemoveMedicineFromBundleForm = (index) => {
    if (bundleForm.meds.length <= 1) return
    setBundleForm(prev => ({
      ...prev,
      meds: prev.meds.filter((_, i) => i !== index)
    }))
  }

  const handleBundleMedFieldChange = (index, field, value) => {
    setBundleForm(prev => {
      const updated = [...prev.meds]
      updated[index] = { ...updated[index], [field]: value }
      return { ...prev, meds: updated }
    })
  }

  const handleSaveBundleForm = (e) => {
    e.preventDefault()
    if (!bundleForm.title.trim()) {
      showError({ title: 'Validation Error', message: 'Please enter a title for the bundle.' })
      return
    }
    const cleanMeds = bundleForm.meds
      .filter(m => (m.medicine_name || '').trim())
      .map(m => ({
        medicine_name: m.medicine_name.trim(),
        type: m.type || 'Tablet',
        strength: m.strength || '',
        dose: m.dose || '1 Tablet',
        frequency: m.frequency || '1+0+1',
        duration: m.duration || '5 Days',
        meal: m.meal || 'After Meal',
        instructions: m.instructions || ''
      }))

    if (cleanMeds.length === 0) {
      showError({ title: 'Validation Error', message: 'Please add at least one medicine to the bundle.' })
      return
    }

    const bundleObj = {
      title: bundleForm.title.trim(),
      meds: cleanMeds
    }

    if (editingBundleIndex !== null && editingBundleIndex >= 0) {
      const updated = [...quickCombos]
      updated[editingBundleIndex] = bundleObj
      saveQuickCombos(updated)
      showSuccess({ title: 'Bundle Updated', message: `"${bundleObj.title}" updated successfully.` })
    } else {
      const updated = [...quickCombos, bundleObj]
      saveQuickCombos(updated)
      showSuccess({ title: 'Bundle Created', message: `"${bundleObj.title}" added to Quick Add bundles.` })
    }

    setShowBundleModal(false)
  }

  const handleMedicineChange = (index, field, value) => {
    const updated = [...form.medicines]
    updated[index] = { ...updated[index], [field]: value }
    setForm({ ...form, medicines: updated })
  }

  const addMedicineRow = () => {
    setForm(prev => ({
      ...prev,
      medicines: [...prev.medicines, emptyMedicine()]
    }))
    setTimeout(() => {
      medicineInputRefs.current[form.medicines.length]?.focus()
    }, 50)
  }

  const duplicateMedicineRow = (index) => {
    const source = form.medicines[index]
    const duplicate = {
      ...source,
      _id: Math.random().toString(36).substring(2, 9)
    }
    const updated = [...form.medicines]
    updated.splice(index + 1, 0, duplicate)
    setForm({ ...form, medicines: updated })
  }

  const removeMedicineRow = (index) => {
    if (form.medicines.length <= 1) {
      setForm({ ...form, medicines: [emptyMedicine()] })
      return
    }
    setForm({
      ...form,
      medicines: form.medicines.filter((_, i) => i !== index)
    })
  }

  const handleMedicineSearch = (query, index) => {
    handleMedicineChange(index, 'medicine_name', query)
    setActiveMedicineIndex(index)
    setHighlightedSuggestion(-1)

    if (medicineSearchTimeout.current) clearTimeout(medicineSearchTimeout.current)

    if (!query || query.trim().length < 2) {
      setMedicineSuggestions([])
      return
    }

    medicineSearchTimeout.current = setTimeout(async () => {
      try {
        const res = await searchMedicines({ search: query.trim(), per_page: 8 })
        const meds = res.data?.data || res.data || []
        setMedicineSuggestions(Array.isArray(meds) ? meds : [])
      } catch (err) {
        setMedicineSuggestions([])
      }
    }, 250)
  }

  const selectMedicine = (index, med) => {
    const name = med.name || med.medicine_name || ''
    const type = med.type || med.dosage_type || med.form || ''
    const strength = med.strength || ''

    const updated = [...form.medicines]
    updated[index] = {
      ...updated[index],
      medicine_name: name,
      type: type,
      strength: strength
    }
    setForm({ ...form, medicines: updated })
    setMedicineSuggestions([])
    setActiveMedicineIndex(null)
  }

  const handleSaveVitals = (e) => {
    e.preventDefault()
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const updatedVitals = { ...vitals, recorded_at: vitals.recorded_at || nowStr }
    setVitals(updatedVitals)
    setForm(prev => ({
      ...prev,
      weight: updatedVitals.weight,
      oe: `BP: ${updatedVitals.bp_systolic}/${updatedVitals.bp_diastolic} mmHg, Pulse: ${updatedVitals.pulse} bpm, Temp: ${updatedVitals.temp}°F, Wt: ${updatedVitals.weight} kg, Ht: ${updatedVitals.height_ft} ft (BMI: ${currentBMI.val})`
    }))
    setShowVitalsModal(false)
    showSuccess({ title: 'Vitals Updated', message: 'Patient vitals recorded and synced to examination notes.' })
    setTimeout(() => {
      performSaveDraft(true)
    }, 100)
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    if (!form.diagnosis.trim()) {
      showError({ title: 'Validation Error', message: 'Please provide a diagnosis or final impression.' })
      return
    }

    const cleanMeds = form.medicines
      .filter(m => m.medicine_name && m.medicine_name.trim())
      .map(m => ({
        medicine_name: m.medicine_name.trim(),
        type: m.type || 'Tablet',
        strength: m.strength || '',
        dose: m.dose || '1 Tablet',
        dosage: m.dosage || m.frequency || '1+0+1',
        duration: m.duration || '5 Days',
        meal: m.meal || 'After Meal',
        instructions: m.instructions || ''
      }))

    if (cleanMeds.length === 0) {
      showError({ title: 'Validation Error', message: 'Please prescribe at least one medicine.' })
      return
    }

    setSaving(true)
    // Base payload — no appointment_id (backend doesn't need it for updates; for creates we use appointment_public_id)
    const basePayload = {
      chamber_id: form.chamber_id || undefined,
      status: 'finalized',
      diagnosis: form.diagnosis.trim(),
      medicines: cleanMeds,
      advice: form.advice,
      follow_up_date: form.follow_up_date || undefined,
      cc: form.cc,
      oe: form.oe,
      oh: form.oh,
      mh: form.mh,
      custom_sections: (customSections || []).map(s => ({ id: s.id, title: s.title, text: s.text })),
      ...(canViewNotes ? { notes: form.notes } : {}),
      investigation: form.investigation,
      vitals: vitals || undefined,
      age: form.age,
      sex: form.sex,
      weight: form.weight,
      registration_no: form.registration_no || form.patient_public_id,
      visited_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
    }

    try {
      const targetId = activeDraftId || (isEdit && id ? id : null)
      if (targetId) {
        await updatePrescription(targetId, basePayload)
        showSuccess({
          title: 'Prescription Completed',
          message: 'Prescription finalized successfully and moved out of drafts.'
        })
        window.dispatchEvent(new CustomEvent('rx-draft-count-updated'))
        try {
          localStorage.removeItem(draftKey)
        } catch (e) {}
        navigate(`/admin/prescriptions/view/${targetId}`)
      } else {
        const rawApptId = appointmentInfo?.public_id || form.appointment_id || appointmentId
        const res = await createPrescription(rawApptId
          ? { ...basePayload, appointment_public_id: rawApptId }
          : basePayload
        )
        const newId = res.data?.data?.id || res.data?.id
        showSuccess({
          title: 'Prescription Completed',
          message: 'Prescription created and finalized successfully.'
        })
        try {
          localStorage.removeItem(draftKey)
        } catch (e) {}
        if (newId) {
          navigate(`/admin/prescriptions/view/${newId}`)
        } else {
          navigate(returnTo)
        }
      }
    } catch (err) {
      showError({
        title: 'Save Failed',
        message: getErrorMessage(err, 'Failed to save prescription.')
      })
    } finally {
      setSaving(false)
    }
  }

  const patientName = walkInPatientInfo?.name || appointmentInfo?.patient?.name || appointmentInfo?.patient_name || form.patient_name || 'Walk-in Patient'
  const patientId = walkInPatientInfo?.patient_id 
    || walkInPatientInfo?.registration_no 
    || appointmentInfo?.patient_public_id 
    || appointmentInfo?.patient?.public_id 
    || form.patient_public_id 
    || form.patient_id 
    || appointmentInfo?.patient?.patient_id 
    || appointmentInfo?.patient_id 
    || appointmentInfo?.user?.patient_id 
    || appointmentInfo?.patient?.id 
    || appointmentInfo?.registration_id 
    || form.registration_no 
  const rawDob = appointmentInfo?.patient_dob 
    || appointmentInfo?.patient?.dob 
    || appointmentInfo?.patient?.date_of_birth 
    || appointmentInfo?.user?.dob 
    || walkInPatientInfo?.dob
  const computedAgeFromDob = calculateAgeFromDob(rawDob)
  const patientAge = form.age || walkInPatientInfo?.age || appointmentInfo?.patient_age || appointmentInfo?.patient?.patient_age || computedAgeFromDob || '—'
  const patientSex = form.sex || walkInPatientInfo?.sex || appointmentInfo?.patient_sex || appointmentInfo?.patient?.gender || '—'
  const patientPhone = walkInPatientInfo?.phone || appointmentInfo?.patient?.phone || appointmentInfo?.patient_phone || '—'
  const patientAddress = walkInPatientInfo?.address || appointmentInfo?.patient?.address || '—'
  const patientDobDisplay = (() => {
    if (rawDob) {
      try {
        const d = new Date(rawDob)
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        }
      } catch (e) {}
    }
    if (patientAge && patientAge !== '—') {
      const parsed = parseInt(patientAge, 10)
      if (!isNaN(parsed) && parsed > 0) {
        return `Est. Birth Year: ${new Date().getFullYear() - parsed}`
      }
    }
    return 'DOB: Not specified'
  })()
  const visitNo = form.visit_no || appointmentInfo?.visit_no || appointmentInfo?.serial_number || appointmentInfo?.serial_no || (appointmentInfo?.appointment_number ? `#${appointmentInfo.appointment_number}` : '01')

  // Real-time Active Counters — only counted when doctor has written/added items
  const activeMedicinesCount = form.medicines.filter(m => (m.medicine_name || '').trim().length > 0).length
  const activeInvestigationsCount = investigationList.filter(t => (t || '').trim().length > 0).length
  const activeAdviceCount = adviceChecklist.filter(item => item.checked && (item.text || '').trim().length > 0).length
  const activeClinicalCount = [form.cc, form.oe, form.mh, form.oh].filter(val => (val || '').trim().length > 0).length + customSections.filter(s => (s.text || '').trim().length > 0 || (s.chips || []).length > 0).length

  const formatFollowUpDisplay = (dateStr) => {
    if (!dateStr) return 'Not scheduled'
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return dateStr
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', weekday: 'short' })
    } catch {
      return dateStr
    }
  }

  const handleConfirmWalkInPatient = async (e) => {
    e.preventDefault()

    const errors = {}
    const trimmedName = (walkInForm.name || '').trim()
    const trimmedAge = String(walkInForm.age || '').trim()
    const trimmedPhone = (walkInForm.phone || '').trim()

    // Required Field 1: Full Name
    if (!trimmedName) {
      errors.name = 'Please enter patient full name.'
    }

    // Required Field 2: Age (years)
    if (!trimmedAge) {
      errors.age = 'Please enter patient age.'
    } else {
      const numAge = parseInt(trimmedAge, 10)
      if (isNaN(numAge) || numAge < 0 || numAge > 150) {
        errors.age = 'Please enter a valid age (0–150).'
      }
    }

    // Required Field 3: Phone Number (must be verified Bangladeshi mobile number)
    if (!trimmedPhone) {
      errors.phone = 'Please enter mobile number.'
    } else if (!isValidBdMobile(trimmedPhone)) {
      errors.phone = 'Please enter a valid 11-digit Bangladeshi mobile number (e.g. 01712-345678).'
    }

    // Required Field 4: Visiting Chamber (if doctor has registered chambers)
    if (doctorChambers.length > 0 && !walkInForm.chamber_id) {
      errors.chamber_id = 'Please select a chamber where you are consulting.'
    }

    // If any validation error exists, show below field and abort without popup
    if (Object.keys(errors).length > 0) {
      setWalkInErrors(errors)
      return
    }

    setWalkInErrors({})
    const normalizedPhone = normalizeBdMobile(trimmedPhone)

    setIsCheckingWalkInPhone(true)
    try {
      const checkRes = await checkPatientPhone(normalizedPhone)
      setIsCheckingWalkInPhone(false)

      if (checkRes.data?.registered) {
        const pData = checkRes.data.data
        // Connect patient to doctor via appointment
        setIsCheckingWalkInPhone(true)
        let regData = null
        try {
          const regRes = await quickRegisterPatient({
            name: pData.name || trimmedName,
            phone: normalizedPhone,
            age: pData.age ? String(pData.age) : trimmedAge,
            sex: walkInForm.sex,
            address: pData.address || walkInForm.address,
            chamber_id: walkInForm.chamber_id || undefined,
            doctor_id: user?.doctor?.id || undefined,
          })
          regData = regRes.data?.data
        } catch (e) {
          console.warn('Quick register existing patient error:', e)
        }
        setIsCheckingWalkInPhone(false)

        const apptId = regData?.appointment_public_id || regData?.appointment_id || undefined
        const pPublicId = regData?.patient_public_id || regData?.public_id || pData.public_id

        showSuccess({
          title: 'নিবন্ধিত রোগী পাওয়া গেছে',
          message: `রোগী: ${pData.name || trimmedName} (ID: ${pPublicId})। কনসালটেশন অ্যাপয়েন্টমেন্ট তৈরি হয়েছে।`,
          autoCloseMs: 3500,
        })

        const info = {
          ...walkInForm,
          name: pData.name || trimmedName,
          phone: pData.phone || normalizedPhone,
          registration_no: pPublicId,
          patient_id: pPublicId,
          age: pData.age ? String(pData.age) : trimmedAge,
          sex: pData.gender ? (pData.gender.toLowerCase() === 'female' ? 'Female' : (pData.gender.toLowerCase() === 'other' ? 'Other' : 'Male')) : walkInForm.sex,
          address: pData.address || walkInForm.address,
          chamber_id: regData?.chamber_id || walkInForm.chamber_id,
          chamber_name: regData?.chamber_name || walkInForm.chamber_name,
          hospital_name: regData?.hospital_name || walkInForm.hospital_name,
          hospital_address: regData?.hospital_address || walkInForm.hospital_address,
          hospital_phone: regData?.hospital_phone || walkInForm.hospital_phone,
        }
        setWalkInPatientInfo(info)
        setWalkInForm(info)

        if (regData?.appointment_id || regData?.appointment_public_id) {
          setAppointmentInfo(prev => ({
            ...(prev || {}),
            id: regData.appointment_id,
            public_id: regData.appointment_public_id,
            chamber_id: regData.chamber_id || walkInForm.chamber_id,
            chamber_name: regData.chamber_name || walkInForm.chamber_name,
            hospital_name: regData.hospital_name || walkInForm.hospital_name,
          }))
        }

        const updatedForm = {
          ...form,
          appointment_id: apptId || form.appointment_id,
          patient_name: info.name,
          patient_public_id: pPublicId,
          registration_no: pPublicId,
          age: info.age || form.age,
          sex: info.sex || form.sex,
          chamber_id: info.chamber_id || form.chamber_id,
          chamber_name: info.chamber_name || form.chamber_name,
          hospital_name: info.hospital_name || form.hospital_name,
          hospital_address: info.hospital_address || form.hospital_address,
          hospital_phone: info.hospital_phone || form.hospital_phone,
        }
        setForm(updatedForm)
        setShowWalkInModal(false)

        // Immediately auto-save draft to Doctor Panel
        if (apptId) {
          setTimeout(() => {
            performSaveDraft(true, apptId, updatedForm)
          }, 300)
        }
        return
      } else {
        // Phone is NOT registered — prompt doctor for confirmation
        const shouldCreate = await confirm({
          title: 'নতুন রোগী হিসেবে ডাটাবেজে সংরক্ষণ করবেন?',
          message: `"${normalizedPhone}" মোবাইল নম্বরটি ডাটাবেজে নিবন্ধিত নেই। আপনি কি "${trimmedName}"-কে Public ID সহ ডাটাবেজে নতুন রোগী হিসেবে তৈরি করতে চান?`,
          confirmText: 'হ্যাঁ, তৈরি করুন',
          cancelText: 'না, শুধু প্রেসক্রিপশনে রাখুন',
          variant: 'primary',
        })

        if (shouldCreate) {
          setIsCheckingWalkInPhone(true)
          try {
            const regRes = await quickRegisterPatient({
              name: trimmedName,
              phone: normalizedPhone,
              age: trimmedAge,
              sex: walkInForm.sex,
              address: walkInForm.address,
              chamber_id: walkInForm.chamber_id || undefined,
              doctor_id: user?.doctor?.id || undefined,
            })
            setIsCheckingWalkInPhone(false)
            const newPatient = regRes.data?.data
            const newPublicId = newPatient?.public_id || newPatient?.patient_public_id
            const apptId = newPatient?.appointment_public_id || newPatient?.appointment_id || undefined

            showSuccess({
              title: 'রোগী ডাটাবেজে সংরক্ষিত হয়েছে',
              message: `রোগী সফলভাবে সংরক্ষিত হয়েছে! Public ID: ${newPublicId}`,
            })

            const info = {
              ...walkInForm,
              name: trimmedName,
              phone: normalizedPhone,
              age: trimmedAge,
              registration_no: newPublicId,
              patient_id: newPublicId,
              chamber_id: newPatient?.chamber_id || walkInForm.chamber_id,
              chamber_name: newPatient?.chamber_name || walkInForm.chamber_name,
              hospital_name: newPatient?.hospital_name || walkInForm.hospital_name,
              hospital_address: newPatient?.hospital_address || walkInForm.hospital_address,
              hospital_phone: newPatient?.hospital_phone || walkInForm.hospital_phone,
            }
            setWalkInPatientInfo(info)
            setWalkInForm(info)
            if (newPatient?.appointment_id || newPatient?.appointment_public_id) {
              setAppointmentInfo(prev => ({
                ...(prev || {}),
                id: newPatient.appointment_id,
                public_id: newPatient.appointment_public_id,
                chamber_id: newPatient.chamber_id || walkInForm.chamber_id,
                chamber_name: newPatient.chamber_name || walkInForm.chamber_name,
                hospital_name: newPatient.hospital_name || walkInForm.hospital_name,
              }))
            }
            const updatedForm = {
              ...form,
              appointment_id: apptId || form.appointment_id,
              patient_name: info.name,
              patient_public_id: newPublicId,
              registration_no: newPublicId,
              age: info.age || form.age,
              sex: info.sex || form.sex,
              chamber_id: info.chamber_id || form.chamber_id,
              chamber_name: info.chamber_name || form.chamber_name,
              hospital_name: info.hospital_name || form.hospital_name,
              hospital_address: info.hospital_address || form.hospital_address,
              hospital_phone: info.hospital_phone || form.hospital_phone,
            }
            setForm(updatedForm)
            setShowWalkInModal(false)

            // Immediately auto-save draft to Doctor Panel
            if (apptId) {
              setTimeout(() => {
                performSaveDraft(true, apptId, updatedForm)
              }, 300)
            }
            return
          } catch (regErr) {
            setIsCheckingWalkInPhone(false)
            showError({
              title: 'Registration Error',
              message: getErrorMessage(regErr, 'Failed to register patient in database.')
            })
            return
          }
        }
      }
    } catch (chkErr) {
      setIsCheckingWalkInPhone(false)
      console.error('Phone check error:', chkErr)
    }

    // Fallback or doctor chose "No": just save to local walk-in state
    const info = {
      ...walkInForm,
      name: trimmedName,
      phone: normalizedPhone,
      age: trimmedAge
    }
    setWalkInPatientInfo(info)
    setWalkInForm(info)
    setForm(prev => ({
      ...prev,
      patient_name: info.name,
      age: info.age || prev.age,
      sex: info.sex || prev.sex,
      registration_no: info.registration_no || prev.registration_no,
      chamber_id: info.chamber_id || prev.chamber_id,
      chamber_name: info.chamber_name || prev.chamber_name,
      hospital_name: info.hospital_name || prev.hospital_name,
      hospital_address: info.hospital_address || prev.hospital_address,
      hospital_phone: info.hospital_phone || prev.hospital_phone,
    }))
    setShowWalkInModal(false)
  }

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner" /> Loading...
      </div>
    )
  }

  return (
    <div className={`dr-workspace-root ${isZenMode ? 'dr-zen-mode' : ''}`}>
      
      {/* 1. TOP APP HEADER BAR */}
      <header className="dr-top-header">
        <div className="dr-header-left">
          <div className="dr-brand-icon">
            <PenLine size={16} color="#2563eb" strokeWidth={2.5} />
          </div>
          <h1 className="dr-header-title">{isDraftStatus ? 'Draft Prescription' : isEdit ? 'Edit Prescription' : 'Prescription'}</h1>
          {isDraftStatus && (
            <span style={{
              fontSize: 11,
              fontWeight: 800,
              background: '#fef3c7',
              color: '#d97706',
              border: '1px solid #fcd34d',
              padding: '2px 8px',
              borderRadius: 6,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Draft / খসড়া
            </span>
          )}
          <button 
            type="button" 
            className={`dr-status-pill dr-auto-save-btn ${autoSaveStatus === 'saving' ? 'is-saving' : ''} ${hasUnsavedChanges ? 'has-unsaved' : 'is-saved'}`}
            onClick={() => performSaveDraft(false)}
            title={hasUnsavedChanges ? "Click to save draft now (Ctrl+S)" : "Click to re-save draft (Ctrl+S)"}
          >
            {autoSaveStatus === 'saving' ? (
              <>
                <RefreshCw size={12} className="dr-spin" />
                <span>Saving draft...</span>
              </>
            ) : hasUnsavedChanges ? (
              <>
                <Clock size={12} color="#d97706" />
                <span>Unsaved changes • Auto-save</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={13} color="#16a34a" />
                <span>{autoSaveLabel}</span>
              </>
            )}
          </button>
        </div>

        <div className="dr-header-actions">
          {/* Back to Appointments Button */}
          <Link to={returnTo} className="dr-btn-white" style={{ textDecoration: 'none' }}>
            <ArrowLeft size={14} /> Back to Appointments
          </Link>

          {/* Keyboard Shortcuts Button */}
          <button 
            type="button" 
            className="dr-btn-white" 
            onClick={() => setShowShortcutsModal(true)}
          >
            <Keyboard size={14} /> Keyboard Shortcuts
          </button>

          {/* Preview Button */}
          <button 
            type="button" 
            className="dr-btn-white"
            onClick={() => setShowPreviewModal(true)}
          >
            <Eye size={14} /> Preview
          </button>

          {/* Templates / Print Layout Dropdown Button */}
          <div className="dr-dropdown-container">
            <button 
              type="button" 
              className="dr-btn-white" 
              onClick={(e) => { e.stopPropagation(); setShowTemplatesDropdown(!showTemplatesDropdown); }}
              title="Change Digital Prescription Design Layout (QR & Barcode / Pad Print)"
            >
              <FileText size={14} color="#2563eb" /> Templates <ChevronDown size={12} />
            </button>

            {showTemplatesDropdown && (
              <div className="dr-custom-dropdown-menu" style={{ width: 350, padding: 8 }}>
                <div className="dr-menu-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span>প্রেসক্রিপশন প্রিন্ট লে-আউট (Design)</span>
                  <span style={{ fontSize: 10, color: '#16a34a', fontWeight: 700 }}>QR & Pad Print</span>
                </div>
                {DIGITAL_PRESCRIPTION_TEMPLATES.map((tpl) => {
                  const isSelected = selectedTemplate === tpl.id
                  return (
                    <div 
                      key={tpl.id} 
                      className={`dr-menu-item ${isSelected ? 'active' : ''}`}
                      style={{
                        background: isSelected ? '#eff6ff' : 'transparent',
                        borderLeft: isSelected ? '3px solid #2563eb' : '3px solid transparent',
                        padding: '8px 10px',
                        marginBottom: 4,
                        borderRadius: 6
                      }}
                      onClick={() => handleSelectTemplate(tpl.id, tpl.name)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                        <strong style={{ color: isSelected ? '#2563eb' : '#0f172a', fontSize: 12 }}>{tpl.name}</strong>
                        {isSelected ? (
                          <span style={{ color: '#2563eb', fontSize: 11, fontWeight: 700 }}>✓ এক্টিভ</span>
                        ) : (
                          <span style={{ fontSize: 10, background: '#f1f5f9', color: '#64748b', padding: '1px 6px', borderRadius: 4 }}>{tpl.badge}</span>
                        )}
                      </div>
                      <span style={{ fontSize: 11, color: '#475569', lineHeight: 1.3, display: 'block' }}>{tpl.description}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>



          {/* Save & Print Button */}
          <button type="button" className="dr-btn-primary" onClick={handleSubmit} disabled={saving}>
            <FileText size={14} /> Save & Print
          </button>
        </div>
      </header>

      {/* 2. FULL-WIDTH PATIENT DEMOGRAPHIC STRIP */}
      <section className="dr-patient-banner">
        {/* ── WALK-IN MODE: info not yet provided ── */}
        {isWalkIn && !walkInPatientInfo ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, width: '100%' }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              background: '#f1f5f9', border: '2px dashed #cbd5e1',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <User size={20} color="#94a3b8" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 13, color: '#64748b', fontWeight: 500 }}>
                No patient selected
              </p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#94a3b8' }}>
                Add walk-in patient details to continue
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setWalkInErrors({})
                setShowWalkInModal(true)
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 20px', borderRadius: 8,
                background: '#2563eb', color: '#fff',
                border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 600,
                boxShadow: '0 1px 4px rgba(37,99,235,0.25)',
                whiteSpace: 'nowrap'
              }}
            >
              <User size={15} />
              Walk-in Patient
            </button>
          </div>
        ) : (
          /* ── APPOINTMENT or WALK-IN with info filled ── */
          <>
            <div className="dr-patient-avatar-box">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                alt="Patient"
                className="dr-patient-avatar-img"
                onError={(e) => { e.target.style.display = 'none' }}
              />
            </div>

            <div className="dr-patient-primary-info">
              <h2 className="dr-patient-name">{patientName}</h2>
              {patientId && <span className="dr-patient-id">ID: {patientId}</span>}
            </div>

            <div 
              className="dr-patient-meta-block dr-patient-meta-interactive"
              onClick={handleOpenAssignAgeModal}
              title="Click to assign or update patient age & DOB"
            >
              <span className="dr-meta-label">Age</span>
              <div className="dr-meta-item" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {patientAge && patientAge !== '—' ? (
                  <span className="dr-meta-value">
                    {patientAge} Y
                  </span>
                ) : (
                  <span className="dr-badge-assign-age">
                    <Calendar size={11} /> + Assign Age
                  </span>
                )}
                <Edit2 size={11} color="#2563eb" />
              </div>
              <div className="dr-meta-item dr-meta-sub">
                <Calendar size={12} /> {patientDobDisplay}
              </div>
            </div>

            <div className="dr-patient-meta-block">
              <span className="dr-meta-label">Sex</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
                <select
                  className="dr-meta-sex-select"
                  value={patientSex && patientSex !== '—' ? (patientSex.toLowerCase() === 'female' ? 'Female' : (patientSex.toLowerCase() === 'other' ? 'Other' : 'Male')) : 'Male'}
                  onChange={async (e) => {
                    const newSex = e.target.value;
                    setForm(prev => ({ ...prev, sex: newSex }));
                    if (walkInPatientInfo) setWalkInPatientInfo(prev => ({ ...prev, sex: newSex }));
                    if (appointmentId) {
                      try {
                        await updateAppointment(appointmentId, { patient_gender: newSex });
                        setAppointmentInfo(prev => ({ ...prev, patient_sex: newSex }));
                      } catch (err) {
                        console.warn('Failed to update gender on appointment:', err);
                      }
                    }
                    performSaveDraft(true);
                  }}
                  style={{
                    border: '1px solid #cbd5e1',
                    borderRadius: 4,
                    background: '#f8fafc',
                    fontWeight: 700,
                    fontSize: 12,
                    color: '#1e293b',
                    cursor: 'pointer',
                    padding: '2px 6px',
                    outline: 'none'
                  }}
                  title="Click to select patient sex / gender"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="dr-patient-meta-block">
              <span className="dr-meta-label">Phone</span>
              <span className="dr-meta-value">{patientPhone}</span>
            </div>

            <div className="dr-patient-meta-block">
              <span className="dr-meta-label">Address</span>
              <span className="dr-meta-value">{patientAddress}</span>
            </div>

            <div className="dr-patient-meta-block" title="Visiting Chamber for this prescription" style={{ minWidth: 160 }}>
              <span className="dr-meta-label">Consulting Chamber (চেম্বার)</span>
              {doctorChambers && doctorChambers.length > 1 ? (
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginTop: 2 }}>
                  <MapPin size={11} style={{ position: 'absolute', left: 7, color: '#2563eb', pointerEvents: 'none', zIndex: 1 }} />
                  <select
                    value={form.chamber_id || ''}
                    onChange={(e) => handleSelectChamber(e.target.value)}
                    aria-label="Select Consulting Chamber"
                    style={{
                      padding: '2px 8px 2px 22px',
                      fontSize: 11.5,
                      fontWeight: 700,
                      color: '#1e40af',
                      background: '#eff6ff',
                      border: '1.5px solid #93c5fd',
                      borderRadius: 6,
                      cursor: 'pointer',
                      maxWidth: 240,
                      outline: 'none',
                      lineHeight: 1.4
                    }}
                  >
                    {doctorChambers.map(ch => {
                      const chName = ch.chamber_name || ch.hospital?.name || `Chamber #${ch.room_number || ch.id}`
                      return (
                        <option key={ch.id || ch.public_id} value={ch.id || ch.public_id}>
                          {chName} {ch.room_number ? `(Room ${ch.room_number})` : ''}
                        </option>
                      )
                    })}
                  </select>
                </div>
              ) : (
                <span className="dr-meta-value" style={{ color: '#2563eb', fontWeight: 600 }}>
                  <MapPin size={11} style={{ display: 'inline', marginRight: 4 }} />
                  {form.chamber_name || form.hospital_name || doctorChambers[0]?.chamber_name || doctorChambers[0]?.hospital?.name || walkInPatientInfo?.chamber_name || walkInPatientInfo?.hospital_name || 'Main Chamber'}
                </span>
              )}
            </div>

            <div className="dr-patient-meta-block">
              <span className="dr-meta-label">Visit & Time</span>
              <span className="dr-meta-value" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#0d9488', fontWeight: 700 }}>
                <span>Visit #{visitNo}</span>
                <span style={{ color: '#64748b', fontWeight: 500 }}>
                  <Clock size={11} style={{ display: 'inline', marginRight: 2 }} />
                  {appointmentInfo?.appointment_time || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                </span>
              </span>
            </div>

            {clinicalTimeline.length > 0 && (
              <div className="dr-patient-meta-block" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '4px 8px' }}>
                <span className="dr-meta-label" style={{ color: '#166534' }}>Patient History</span>
                <span className="dr-meta-value" style={{ color: '#15803d', fontWeight: 700, fontSize: 11 }}>
                  🔄 Follow-up ({clinicalTimeline.length} previous Rx)
                </span>
              </div>
            )}

            <div className="dr-patient-badges-group">
              {/* Walk-in: show edit button instead of View Profile */}
              {isWalkIn && walkInPatientInfo ? (
                <button
                  type="button"
                  className="dr-view-profile-btn"
                  onClick={() => {
                    setWalkInErrors({})
                    setWalkInForm({ ...walkInPatientInfo })
                    setShowWalkInModal(true)
                  }}
                >
                  <User size={13} /> Edit Info
                </button>
              ) : (
                <button
                  type="button"
                  className="dr-view-profile-btn"
                  onClick={() => setShowProfileModal(true)}
                >
                  <User size={13} /> View Profile
                </button>
              )}
            </div>
          </>
        )}
      </section>

      {/* 3. SUB-NAVIGATION TABS */}
      <nav className="dr-nav-tabs" role="tablist">
        <button 
          type="button" 
          className={`dr-tab-btn ${activeTab === 'prescription' ? 'active' : ''}`}
          onClick={() => setActiveTab('prescription')}
        >
          <Pill size={15} /> Prescription {activeMedicinesCount > 0 && <span className="dr-tab-badge">{activeMedicinesCount}</span>}
        </button>
        <button 
          type="button" 
          className={`dr-tab-btn ${activeTab === 'clinical' ? 'active' : ''}`}
          onClick={() => setActiveTab('clinical')}
        >
          <User size={15} /> Clinical Info {activeClinicalCount > 0 && <span className="dr-tab-badge">{activeClinicalCount}</span>}
        </button>
        <button 
          type="button" 
          className={`dr-tab-btn ${activeTab === 'investigations' ? 'active' : ''}`}
          onClick={() => setActiveTab('investigations')}
        >
          <FlaskConical size={15} /> Investigation {activeInvestigationsCount > 0 && <span className="dr-tab-badge">{activeInvestigationsCount}</span>}
        </button>
        <button 
          type="button" 
          className={`dr-tab-btn ${activeTab === 'advice' ? 'active' : ''}`}
          onClick={() => setActiveTab('advice')}
        >
          <CheckCircle2 size={15} /> Advice {activeAdviceCount > 0 && <span className="dr-tab-badge">{activeAdviceCount}</span>}
        </button>
        <button 
          type="button" 
          className={`dr-tab-btn ${activeTab === 'followup' ? 'active' : ''}`}
          onClick={() => setActiveTab('followup')}
        >
          <Calendar size={15} /> Follow Up {form.follow_up_date ? <span className="dr-tab-badge">1</span> : null}
        </button>
        <button 
          type="button" 
          className={`dr-tab-btn ${activeTab === 'notes' ? 'active' : ''}`}
          onClick={() => setActiveTab('notes')}
        >
          <FileText size={15} /> Notes {noteList.length > 0 ? <span className="dr-tab-badge">{noteList.length}</span> : (form.notes?.trim() ? <span className="dr-tab-badge">1</span> : null)}
        </button>
      </nav>

      {/* 4. MAIN TWO-COLUMN WORKSPACE CANVAS */}
      <form ref={formRef} onSubmit={handleSubmit} className="dr-workspace-grid">
        
        {/* LEFT COLUMN: Tab-specific dynamic editor */}
        <main className="dr-main-column">
          
          {/* ========================================================
              TAB 1: PRESCRIPTION (Main Rx & Table)
              ======================================================== */}
          {activeTab === 'prescription' && (
            <>
              {/* 1. Diagnosis Section */}
              <div className="dr-card dr-section-card">
                <div className="dr-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 className="dr-section-title">
                    1. Diagnosis (ICD-10)
                  </h3>
                  {diagnosisPresets.length > 0 && (
                    <span style={{ fontSize: 11, color: '#64748b' }}>
                      {diagnosisPresets.length} Saved Preset{diagnosisPresets.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                <div className="dr-diagnosis-row">
                  <div className="dr-search-box">
                    <Search size={14} />
                    <input
                      type="text"
                      className="dr-input-field"
                      placeholder="Search ICD-10 or type Diagnosis..."
                      value={diagnosisSearchInput}
                      onChange={(e) => setDiagnosisSearchInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && diagnosisSearchInput.trim()) {
                          e.preventDefault()
                          handleAddDiagnosis(diagnosisSearchInput.trim())
                          setDiagnosisSearchInput('')
                        }
                      }}
                    />
                  </div>

                  <button 
                    type="button" 
                    className="dr-btn-blue-outline"
                    onClick={() => {
                      if (diagnosisSearchInput.trim()) {
                        handleAddDiagnosis(diagnosisSearchInput.trim())
                        setDiagnosisSearchInput('')
                      }
                    }}
                  >
                    <Plus size={14} /> Add Diagnosis
                  </button>

                  {diagnosisSearchInput.trim() && (
                    <button 
                      type="button" 
                      className="dr-btn-amber-outline"
                      title="Save this diagnosis permanently to your database presets"
                      onClick={() => {
                        const val = diagnosisSearchInput.trim()
                        handleSaveClinicalPreset('diagnosis', val)
                        handleAddDiagnosis(val)
                        setDiagnosisSearchInput('')
                      }}
                    >
                      <Star size={13} color="#f59e0b" fill="#f59e0b" /> + Save as Preset
                    </button>
                  )}
                </div>

                {/* Selected Diagnoses Chips */}
                {diagnosisList.length > 0 && (
                  <div className="dr-chips-wrap" style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginRight: 4 }}>
                      Selected ({diagnosisList.length}):
                    </span>
                    {diagnosisList.map((diag, idx) => (
                      <div key={idx} className="dr-diagnosis-chip" style={{ flex: '0 0 auto', background: '#eff6ff', borderColor: '#bfdbfe', color: '#1e40af' }}>
                        <span>{diag}</span>
                        <button 
                          type="button" 
                          className="dr-chip-remove" 
                          onClick={() => handleRemoveDiagnosis(diag)}
                          title={`Remove "${diag}"`}
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                    <button 
                      type="button" 
                      style={{ fontSize: 11, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', fontWeight: 600 }}
                      onClick={() => setForm(prev => ({ ...prev, diagnosis: '' }))}
                      title="Clear all diagnoses"
                    >
                      Clear All
                    </button>
                  </div>
                )}

                {/* Doctor's Saved Diagnosis Presets */}
                {diagnosisPresets.length > 0 && (
                  <div className="dr-chips-wrap" style={{ marginTop: 10, paddingTop: 8, borderTop: '1px dashed #e2e8f0' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginRight: 4, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Star size={11} color="#f59e0b" fill="#f59e0b" /> My Presets:
                    </span>
                    {diagnosisPresets.map(preset => {
                      const isSelected = diagnosisList.some(c => c.toLowerCase() === preset.content.toLowerCase())
                      return (
                        <span key={preset.id} className="dr-chip-custom" style={{ background: isSelected ? '#eff6ff' : '#ffffff', borderColor: isSelected ? '#2563eb' : '#cbd5e1' }}>
                          <button 
                            type="button" 
                            className="dr-chip-btn" 
                            style={{ color: isSelected ? '#2563eb' : '#334155', fontWeight: isSelected ? 700 : 500 }}
                            onClick={() => handleToggleDiagnosisPreset(preset.content)}
                            title={isSelected ? `Click to remove "${preset.content}"` : `Click to add "${preset.content}"`}
                          >
                            {isSelected ? '✓ ' : '+ '}{preset.content}
                          </button>
                          <button 
                            type="button" 
                            className="dr-chip-remove-btn" 
                            onClick={(e) => handleDeleteClinicalPreset(preset.id, e)}
                            title="Delete preset from database"
                          >
                            ×
                          </button>
                        </span>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* 2. Medicines Section (Marked Actions Toolbar) */}
              <div className="dr-card dr-section-card">
                <div className="dr-card-header">
                  <h3 className="dr-section-title">
                    2. Medicines {activeMedicinesCount > 0 && (
                      <span style={{ fontSize: 11, background: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: 999, fontWeight: 700, marginLeft: 6, border: '1px solid #bfdbfe' }}>
                        {activeMedicinesCount}
                      </span>
                    )}
                  </h3>
                  
                  {/* Markable Actions Toolbar in Image */}
                  <div className="dr-header-tool-btns">
                    {/* ★ Favorites Button */}
                    <button 
                      type="button" 
                      className="dr-btn-amber-outline" 
                      onClick={() => setShowFavoritesModal(true)}
                    >
                      <Star size={13} color="#f59e0b" fill={favoriteMedicines.length > 0 ? "#f59e0b" : "none"} /> Favorites {favoriteMedicines.length > 0 ? `(${favoriteMedicines.length})` : ''}
                    </button>

                    {/* + Add Medicine Button */}
                    <button type="button" className="dr-btn-blue-outline" onClick={addMedicineRow}>
                      <Plus size={13} /> Add Medicine
                    </button>

                    {/* ⚡ Quick Add Dropdown */}
                    <div className="dr-dropdown-container">
                      <button 
                        type="button" 
                        className="dr-btn-blue-outline" 
                        onClick={(e) => { e.stopPropagation(); setShowQuickAddDropdown(!showQuickAddDropdown); }}
                      >
                        <Zap size={13} color="#2563eb" /> Quick Add {quickCombos.length > 0 ? `(${quickCombos.length})` : ''} <ChevronDown size={12} />
                      </button>

                      {showQuickAddDropdown && (
                        <div className="dr-custom-dropdown-menu" style={{ width: 280, padding: 6 }}>
                          <div className="dr-menu-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>Quick Medicine Bundles</span>
                            <button 
                              type="button" 
                              className="dr-sidebar-link-btn" 
                              style={{ fontSize: 11, color: '#2563eb' }}
                              onClick={handleOpenCreateBundleModal}
                            >
                              + New Bundle
                            </button>
                          </div>

                          {quickCombos.length === 0 ? (
                            <div style={{ padding: '14px 8px', textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>
                              No bundles saved yet. Click "+ New Bundle" to add.
                            </div>
                          ) : (
                            quickCombos.map((combo, i) => (
                              <div key={i} className="dr-menu-item dr-bundle-item" onClick={() => addQuickCombo(combo)}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <strong>{combo.title}</strong>
                                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                                    {combo.meds.map(m => m.medicine_name).join(' + ')}
                                  </span>
                                </div>
                                <div className="dr-bundle-item-actions" onClick={e => e.stopPropagation()}>
                                  <button 
                                    type="button" 
                                    className="dr-fav-action-btn dr-fav-edit-btn" 
                                    onClick={(e) => handleOpenEditBundleModal(e, combo, i)}
                                    title="Edit Bundle"
                                  >
                                    <Edit2 size={12} />
                                  </button>
                                  <button 
                                    type="button" 
                                    className="dr-fav-action-btn dr-fav-delete-btn" 
                                    onClick={(e) => deleteQuickCombo(e, i)}
                                    title="Remove Bundle"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            ))
                          )}

                          <div className="dr-menu-footer-actions">
                            <button 
                              type="button" 
                              className="dr-dropdown-action-btn"
                              onClick={saveCurrentTableAsBundle}
                            >
                              <Sparkles size={13} color="#16a34a" /> Save Current Table as Bundle
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Language Switcher: বাংলা / English */}
                    <div style={{ display: 'inline-flex', alignItems: 'center', background: '#f1f5f9', borderRadius: 6, padding: '2px', border: '1px solid #cbd5e1' }}>
                      <button 
                        type="button" 
                        style={{ 
                          border: 'none',
                          borderRadius: 4,
                          padding: '4px 10px',
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer',
                          background: tableLanguage === 'bn' ? '#2563eb' : 'transparent',
                          color: tableLanguage === 'bn' ? '#ffffff' : '#475569',
                          transition: 'all 0.15s ease'
                        }}
                        onClick={() => handleToggleLanguage('bn')}
                      >
                        বাংলা
                      </button>
                      <button 
                        type="button" 
                        style={{ 
                          border: 'none',
                          borderRadius: 4,
                          padding: '4px 10px',
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer',
                          background: tableLanguage === 'en' ? '#2563eb' : 'transparent',
                          color: tableLanguage === 'en' ? '#ffffff' : '#475569',
                          transition: 'all 0.15s ease'
                        }}
                        onClick={() => handleToggleLanguage('en')}
                      >
                        English
                      </button>
                    </div>

                    {/* Full Screen Expand/Collapse Toggle */}
                    <button 
                      type="button" 
                      className="dr-btn-icon-square" 
                      title={isZenMode ? "Exit Fullscreen" : "Fullscreen Zen Mode"}
                      onClick={() => setIsZenMode(!isZenMode)}
                    >
                      {isZenMode ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                    </button>
                  </div>
                </div>

                {/* Medicine Instant Search Bar */}
                <div className="dr-med-search-bar">
                  <Search size={14} color="#94a3b8" />
                  <input
                    type="text"
                    placeholder="Search medicine (type at least 2 characters)"
                    className="dr-med-search-input"
                    value={tableSearchFilter}
                    onChange={(e) => setTableSearchFilter(e.target.value)}
                  />
                </div>

                {/* Structured Medicines Table */}
                <div className="dr-table-wrapper">
                  <table className="dr-table">
                    <thead>
                      <tr>
                        <th className="dr-td-num">#</th>
                        <th className="dr-td-med-cell">Medicine</th>
                        <th className="dr-td-freq">Frequency</th>
                        <th className="dr-td-dur">Duration</th>
                        <th className="dr-td-meal">Meal</th>
                        <th className="dr-td-notes">Instruction / Notes</th>
                        <th className="dr-td-actions">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.medicines.map((med, index) => (
                        <tr key={med._id || index}>
                          <td className="dr-td-num">{index + 1}</td>
                          
                          <td className="dr-td-med-cell">
                            <input
                              ref={el => medicineInputRefs.current[index] = el}
                              type="text"
                              className="dr-med-input-title"
                              placeholder="e.g. Paracetamol"
                              value={med.medicine_name}
                              onChange={(e) => handleMedicineSearch(e.target.value, index)}
                            />
                            {(med.type || med.strength) && (
                              <div className="dr-med-input-type">
                                {[med.type, med.strength].filter(Boolean).join(' • ')}
                              </div>
                            )}

                            {/* Autocomplete Dropdown (Rendered via portal to avoid table overflow clipping) */}
                            {activeMedicineIndex === index && medicineSuggestions.length > 0 && dropdownCoords && createPortal(
                              <div 
                                className="dr-med-autocomplete-card" 
                                ref={suggestionsRef}
                                style={{
                                  position: 'fixed',
                                  top: dropdownCoords.top,
                                  bottom: dropdownCoords.bottom,
                                  left: dropdownCoords.left,
                                  width: dropdownCoords.width,
                                  zIndex: 999999
                                }}
                              >
                                {medicineSuggestions.map((item, sIdx) => {
                                  const medName = item.name || item.medicine_name || ''
                                  const medType = item.type || item.dosage_type || item.form || ''
                                  const medStrength = item.strength || ''
                                  const medGeneric = item.generic_name || ''

                                  return (
                                    <div
                                      key={item.id || sIdx}
                                      className={`dr-med-autocomplete-item ${highlightedSuggestion === sIdx ? 'selected' : ''}`}
                                      onClick={() => selectMedicine(index, item)}
                                    >
                                      <div className="dr-med-item-top">
                                        <span className="dr-med-item-name">{medName}</span>
                                        <div className="dr-med-item-badges">
                                          {medType && (
                                            <span className="dr-med-item-type-badge">{medType}</span>
                                          )}
                                          {medStrength && (
                                            <span className="dr-med-item-strength">{medStrength}</span>
                                          )}
                                        </div>
                                      </div>
                                      {(medGeneric || item.company_name) && (
                                        <div className="dr-med-item-bottom">
                                          {medGeneric ? (
                                            <span className="dr-med-item-generic" title={medGeneric}>
                                              {medGeneric}
                                            </span>
                                          ) : <span />}
                                          {item.company_name && (
                                            <span className="dr-med-item-company" title={item.company_name}>
                                              {item.company_name}
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>,
                              document.body
                            )}
                          </td>

                          <td className="dr-td-freq">
                            <select 
                              className="dr-select-box"
                              value={matchOptionValue(FREQUENCY_OPTIONS, med.dosage)}
                              onChange={(e) => handleMedicineChange(index, 'dosage', e.target.value)}
                            >
                              <option value="">{tableLanguage === 'bn' ? '— মাত্রা —' : '— Frequency —'}</option>
                              {FREQUENCY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                          </td>

                          <td className="dr-td-dur">
                            <select 
                              className="dr-select-box"
                              value={matchOptionValue(DURATION_OPTIONS, med.duration)}
                              onChange={(e) => handleMedicineChange(index, 'duration', e.target.value)}
                            >
                              <option value="">{tableLanguage === 'bn' ? '— মেয়াদ —' : '— Duration —'}</option>
                              {tableLanguage === 'bn' ? (
                                <>
                                  {DURATION_OPTIONS_EN.includes(med.duration) && (
                                    <option value={med.duration}>{med.duration}</option>
                                  )}
                                  {DURATION_OPTIONS_BN.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </>
                              ) : (
                                <>
                                  {DURATION_OPTIONS_BN.includes(med.duration) && (
                                    <option value={med.duration}>{med.duration}</option>
                                  )}
                                  {DURATION_OPTIONS_EN.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </>
                              )}
                            </select>
                          </td>

                          <td className="dr-td-meal">
                            <select 
                              className="dr-select-box"
                              value={matchOptionValue(MEAL_OPTIONS, med.meal)}
                              onChange={(e) => handleMedicineChange(index, 'meal', e.target.value)}
                            >
                              <option value="">{tableLanguage === 'bn' ? '— খাওয়ার নিয়ম —' : '— Meal —'}</option>
                              {tableLanguage === 'bn' ? (
                                <>
                                  {MEAL_OPTIONS_EN.includes(med.meal) && (
                                    <option value={med.meal}>{med.meal}</option>
                                  )}
                                  {MEAL_OPTIONS_BN.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </>
                              ) : (
                                <>
                                  {MEAL_OPTIONS_BN.includes(med.meal) && (
                                    <option value={med.meal}>{med.meal}</option>
                                  )}
                                  {MEAL_OPTIONS_EN.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </>
                              )}
                            </select>
                          </td>

                          <td className="dr-td-notes">
                            <input
                              type="text"
                              className="dr-input-text-cell"
                              placeholder="e.g. If fever"
                              value={med.instructions || ''}
                              onChange={(e) => handleMedicineChange(index, 'instructions', e.target.value)}
                            />
                          </td>

                          <td className="dr-td-actions">
                            <div className="dr-row-actions">
                              {(() => {
                                const medName = (med.medicine_name || '').trim().toLowerCase()
                                const isFav = medName && favoriteMedicines.some(f => (f.name || '').toLowerCase() === medName)
                                return (
                                  <button 
                                    type="button" 
                                    className={`dr-action-btn-icon ${isFav ? 'dr-action-fav-active' : ''}`}
                                    onClick={() => toggleRowFavorite(med)}
                                    title={isFav ? "Remove from Favorites" : "Add to Favorites"}
                                  >
                                    <Star size={13} color={isFav ? "#f59e0b" : "#94a3b8"} fill={isFav ? "#f59e0b" : "none"} />
                                  </button>
                                )
                              })()}
                              <button 
                                type="button" 
                                className="dr-action-btn-icon" 
                                onClick={() => duplicateMedicineRow(index)}
                                title="Duplicate"
                              >
                                <Copy size={13} />
                              </button>
                              <button 
                                type="button" 
                                className="dr-action-btn-icon dr-action-delete" 
                                onClick={() => removeMedicineRow(index)}
                                title="Remove"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="dr-add-row-bar">
                    <button type="button" className="dr-add-row-btn" onClick={addMedicineRow}>
                      <Plus size={14} /> Add Another Medicine
                    </button>
                  </div>
                </div>
              </div>

              {/* 3. Investigations & 4. Advice Sub-Grid */}
              <div className="dr-sub-grid">
                
                {/* 3. Investigations */}
                <div className="dr-card dr-sub-card">
                  <div className="dr-card-header">
                    <h3 className="dr-section-title">
                      <FlaskConical size={14} color="#2563eb" /> Investigations {activeInvestigationsCount > 0 && (
                        <span style={{ fontSize: 11, background: '#eff6ff', color: '#2563eb', padding: '1px 6px', borderRadius: 999, fontWeight: 700, marginLeft: 4, border: '1px solid #bfdbfe' }}>
                          {activeInvestigationsCount}
                        </span>
                      )}
                    </h3>
                    <button 
                      type="button" 
                      className="dr-btn-blue-outline-sm"
                      onClick={() => setActiveTab('investigations')}
                    >
                      <Plus size={12} /> Manage All
                    </button>
                  </div>

                  <div className="dr-inv-list">
                    {investigationList.length === 0 ? (
                      <div style={{ padding: '12px 6px', color: '#94a3b8', fontSize: 12, textAlign: 'center' }}>
                        No investigations prescribed yet.
                      </div>
                    ) : (
                      investigationList.map((test, i) => (
                        <div key={i} className="dr-inv-item">
                          <div className="dr-inv-item-left">
                            <FlaskConical size={13} color="#2563eb" />
                            <span>{test}</span>
                          </div>
                          <button 
                            type="button" 
                            className="dr-chip-remove" 
                            onClick={() => handleRemoveInvestigation(i)}
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 4. Advice */}
                <div className="dr-card dr-sub-card">
                  <div className="dr-card-header">
                    <h3 className="dr-section-title">
                      4. Advice {activeAdviceCount > 0 && (
                        <span style={{ fontSize: 11, background: '#ecfdf5', color: '#059669', padding: '1px 6px', borderRadius: 999, fontWeight: 700, marginLeft: 4, border: '1px solid #a7f3d0' }}>
                          {activeAdviceCount}
                        </span>
                      )}
                    </h3>
                    <button type="button" className="dr-btn-blue-outline-sm" onClick={() => setActiveTab('advice')}>
                      <BookOpen size={12} /> Advice Library
                    </button>
                  </div>

                  <div className="dr-advice-checklist">
                    {adviceChecklist.length === 0 ? (
                      <div style={{ padding: '12px 6px', color: '#94a3b8', fontSize: 12, textAlign: 'center' }}>
                        No advice prescribed yet.
                      </div>
                    ) : (
                      adviceChecklist.map((item) => (
                        <label key={item.id} className="dr-advice-check-item">
                          <input 
                            type="checkbox" 
                            className="dr-checkbox"
                            checked={item.checked} 
                            onChange={() => handleToggleAdvice(item.id)}
                          />
                          <span>{item.text}</span>
                        </label>
                      ))
                    )}
                  </div>

                  <div className="dr-advice-input-box">
                    <input
                      type="text"
                      className="dr-advice-text-input"
                      placeholder="Type or select advice from library..."
                      value={newAdviceInput}
                      onChange={(e) => setNewAdviceInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddAdvice()
                        }
                      }}
                    />
                    <button type="button" className="dr-btn-blue-icon" onClick={handleAddAdvice}>
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* 5. Follow Up & 6. Notes Sub-Grid */}
              <div className="dr-sub-grid">
                
                {/* 5. Follow Up */}
                <div className="dr-card dr-sub-card">
                  <h3 className="dr-section-title">5. Follow Up</h3>
                  
                  <div className="dr-followup-controls">
                    <select className="dr-select-box" defaultValue="After">
                      <option value="After">After</option>
                      <option value="Exact Date">Exact Date</option>
                    </select>

                    <select 
                      className="dr-select-box"
                      value={form.follow_up_offset}
                      onChange={(e) => handleFollowUpOffset(e.target.value)}
                    >
                      <option value="3 Days">3 Days</option>
                      <option value="5 Days">5 Days</option>
                      <option value="7 Days">7 Days</option>
                      <option value="10 Days">10 Days</option>
                      <option value="14 Days">14 Days</option>
                      <option value="1 Month">1 Month</option>
                      <option value="2 Months">2 Months</option>
                    </select>

                    <div className="dr-date-badge-box">
                      <input
                        type="date"
                        className="dr-hidden-date-input"
                        value={form.follow_up_date}
                        onChange={(e) => setForm({ ...form, follow_up_date: e.target.value })}
                      />
                      <span className="dr-date-badge-text">
                        {formatFollowUpDisplay(form.follow_up_date)} <Calendar size={13} color="#64748b" />
                      </span>
                    </div>
                  </div>
                </div>

                {/* 6. Notes */}
                <div className="dr-card dr-sub-card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <h3 className="dr-section-title" style={{ margin: 0 }}>6. Doctor's Private Notes (Optional)</h3>
                    <span style={{ fontSize: 11, color: '#047857', background: '#ecfdf5', padding: '2px 8px', borderRadius: 4, display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 500, border: '1px solid #a7f3d0' }}>
                      <ShieldCheck size={12} color="#059669" /> Doctor Confidential
                    </span>
                  </div>

                  {!canViewNotes ? (
                    <div style={{ padding: '14px 16px', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '8px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <ShieldCheck size={20} color="#f59e0b" style={{ flexShrink: 0, marginTop: 2 }} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#334155' }}>🔒 Confidential Note Protected</div>
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2, lineHeight: 1.4 }}>
                          This clinical note was written by {prescriptionDoctorName ? `Dr. ${prescriptionDoctorName}` : 'the prescribing doctor'}. In accordance with medical privacy policies, confidential notes cannot be viewed or edited by other doctors.
                        </div>
                      </div>
                    </div>
                  ) : (
                    <textarea
                      className="dr-notes-area"
                      placeholder="Add private clinical remarks / doctor notes (confidential to you)..."
                      value={form.notes || ''}
                      onChange={(e) => handleNotesTextareaChange(e.target.value)}
                      rows={3}
                    />
                  )}
                </div>
              </div>
            </>
          )}

          {/* ========================================================
              TAB 2: CLINICAL INFO (Chief Complaints, O/E, MH, OH)
              ======================================================== */}
          {activeTab === 'clinical' && (
            <div className="dr-tab-page-container">
              <div className="dr-card">
                <div className="dr-card-header">
                  <h3 className="dr-section-title">
                    <Stethoscope size={15} color="#2563eb" /> Chief Complaints (C/C)
                  </h3>
                  <span className="dr-helper-text">Click chips to quickly append complaints</span>
                </div>

                {/* CC Chips */}
                <div className="dr-chips-wrap">
                  {ccPresets.map((preset) => {
                    const isSelected = (form.cc || '').toLowerCase().includes(preset.content.toLowerCase())
                    return (
                      <span key={preset.id} className="dr-chip-custom" style={{ borderColor: '#2563eb' }}>
                        <button
                          type="button"
                          className="dr-chip-btn"
                          style={{
                            fontWeight: isSelected ? 700 : 600,
                            color: '#1d4ed8',
                            background: isSelected ? '#eff6ff' : undefined
                          }}
                          onClick={() => handleAppendClinicalTag('cc', preset.content)}
                        >
                          {isSelected ? '✓ ' : '+ '} {preset.content}
                        </button>
                        <button type="button" className="dr-chip-remove-btn" onClick={(e) => handleDeleteClinicalPreset(preset.id, e)} title="Remove preset from database">×</button>
                      </span>
                    )
                  })}
                  {ccPresets.length === 0 && !showChipInput.cc && (
                    <span style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic', padding: '3px 0' }}>No saved complaints presets. Click "+ Add Preset" to create your own.</span>
                  )}
                  {showChipInput.cc ? (
                    <span className="dr-chip-input-wrap">
                      <input
                        autoFocus
                        className="dr-chip-input"
                        placeholder="Type & press Enter to save to database"
                        value={chipInput.cc}
                        onChange={(e) => setChipInput(prev => ({ ...prev, cc: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomChip('cc') } if (e.key === 'Escape') setShowChipInput(prev => ({ ...prev, cc: false })) }}
                      />
                      <button type="button" className="dr-chip-add-confirm" onClick={() => addCustomChip('cc')}>✓</button>
                    </span>
                  ) : (
                    <button type="button" className="dr-chip-add-btn" onClick={() => setShowChipInput(prev => ({ ...prev, cc: true }))}>+ Add Preset</button>
                  )}
                </div>

                <textarea className="dr-full-textarea" rows={3} placeholder="e.g. High grade fever for 3 days with chills, dry cough and sore throat..." value={form.cc} onChange={(e) => setForm({ ...form, cc: e.target.value })} />
              </div>

              <div className="dr-card">
                <div className="dr-card-header">
                  <h3 className="dr-section-title">
                    <HeartPulse size={15} color="#16a34a" /> On Examination (O/E) &amp; Physical Findings
                  </h3>
                  <span className="dr-helper-text">General examination &amp; systemic findings</span>
                </div>

                {/* OE Chips */}
                <div className="dr-chips-wrap">
                  {oePresets.map((preset) => {
                    const isSelected = (form.oe || '').toLowerCase().includes(preset.content.toLowerCase())
                    return (
                      <span key={preset.id} className="dr-chip-custom" style={{ borderColor: '#16a34a' }}>
                        <button
                          type="button"
                          className="dr-chip-btn"
                          style={{
                            fontWeight: isSelected ? 700 : 600,
                            color: '#15803d',
                            background: isSelected ? '#f0fdf4' : undefined
                          }}
                          onClick={() => handleAppendClinicalTag('oe', preset.content)}
                        >
                          {isSelected ? '✓ ' : '+ '} {preset.content}
                        </button>
                        <button type="button" className="dr-chip-remove-btn" onClick={(e) => handleDeleteClinicalPreset(preset.id, e)} title="Remove preset from database">×</button>
                      </span>
                    )
                  })}
                  {oePresets.length === 0 && !showChipInput.oe && (
                    <span style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic', padding: '3px 0' }}>No examination presets saved. Click "+ Add Preset" to create your own.</span>
                  )}
                  {showChipInput.oe ? (
                    <span className="dr-chip-input-wrap">
                      <input
                        autoFocus
                        className="dr-chip-input"
                        placeholder="Type & press Enter to save to database"
                        value={chipInput.oe}
                        onChange={(e) => setChipInput(prev => ({ ...prev, oe: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomChip('oe') } if (e.key === 'Escape') setShowChipInput(prev => ({ ...prev, oe: false })) }}
                      />
                      <button type="button" className="dr-chip-add-confirm" onClick={() => addCustomChip('oe')}>✓</button>
                    </span>
                  ) : (
                    <button type="button" className="dr-chip-add-btn" onClick={() => setShowChipInput(prev => ({ ...prev, oe: true }))}>+ Add Preset</button>
                  )}
                </div>

                <textarea className="dr-full-textarea" rows={3} placeholder="e.g. BP: 120/80 mmHg, Pulse: 72 bpm, Temp: 98.6°F, Chest: Bilaterally clear with vesicular breath sounds..." value={form.oe} onChange={(e) => setForm({ ...form, oe: e.target.value })} />
              </div>

              <div className="dr-sub-grid">
                <div className="dr-card">
                  <h3 className="dr-section-title">Past Medical History (MH)</h3>
                  {/* MH Chips */}
                  <div className="dr-chips-wrap">
                    {mhPresets.map((preset) => {
                      const isSelected = (form.mh || '').toLowerCase().includes(preset.content.toLowerCase())
                      return (
                        <span key={preset.id} className="dr-chip-custom" style={{ borderColor: '#6366f1' }}>
                          <button
                            type="button"
                            className="dr-chip-btn"
                            style={{
                              fontWeight: isSelected ? 700 : 600,
                              color: '#4f46e5',
                              background: isSelected ? '#eef2ff' : undefined
                            }}
                            onClick={() => handleAppendClinicalTag('mh', preset.content)}
                          >
                            {isSelected ? '✓ ' : '+ '} {preset.content}
                          </button>
                          <button type="button" className="dr-chip-remove-btn" onClick={(e) => handleDeleteClinicalPreset(preset.id, e)} title="Remove preset from database">×</button>
                        </span>
                      )
                    })}
                    {mhPresets.length === 0 && !showChipInput.mh && (
                      <span style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic', padding: '3px 0' }}>No medical history presets saved. Click "+ Add Preset" to add.</span>
                    )}
                    {showChipInput.mh ? (
                      <span className="dr-chip-input-wrap">
                        <input
                          autoFocus
                          className="dr-chip-input"
                          placeholder="Type & press Enter to save to database"
                          value={chipInput.mh}
                          onChange={(e) => setChipInput(prev => ({ ...prev, mh: e.target.value }))}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomChip('mh') } if (e.key === 'Escape') setShowChipInput(prev => ({ ...prev, mh: false })) }}
                        />
                        <button type="button" className="dr-chip-add-confirm" onClick={() => addCustomChip('mh')}>✓</button>
                      </span>
                    ) : (
                      <button type="button" className="dr-chip-add-btn" onClick={() => setShowChipInput(prev => ({ ...prev, mh: true }))}>+ Add Preset</button>
                    )}
                  </div>
                  <textarea className="dr-full-textarea" rows={2} placeholder="e.g. Known hypertensive for 5 years on medication..." value={form.mh} onChange={(e) => setForm({ ...form, mh: e.target.value })} />
                </div>

                <div className="dr-card">
                  <h3 className="dr-section-title">Other History / Family History (OH)</h3>
                  {/* OH Chips */}
                  <div className="dr-chips-wrap">
                    {ohPresets.map((preset) => {
                      const isSelected = (form.oh || '').toLowerCase().includes(preset.content.toLowerCase())
                      return (
                        <span key={preset.id} className="dr-chip-custom" style={{ borderColor: '#0ea5e9' }}>
                          <button
                            type="button"
                            className="dr-chip-btn"
                            style={{
                              fontWeight: isSelected ? 700 : 600,
                              color: '#0284c7',
                              background: isSelected ? '#f0f9ff' : undefined
                            }}
                            onClick={() => handleAppendClinicalTag('oh', preset.content)}
                          >
                            {isSelected ? '✓ ' : '+ '} {preset.content}
                          </button>
                          <button type="button" className="dr-chip-remove-btn" onClick={(e) => handleDeleteClinicalPreset(preset.id, e)} title="Remove preset from database">×</button>
                        </span>
                      )
                    })}
                    {ohPresets.length === 0 && !showChipInput.oh && (
                      <span style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic', padding: '3px 0' }}>No other history presets saved. Click "+ Add Preset" to add.</span>
                    )}
                    {showChipInput.oh ? (
                      <span className="dr-chip-input-wrap">
                        <input
                          autoFocus
                          className="dr-chip-input"
                          placeholder="Type & press Enter to save to database"
                          value={chipInput.oh}
                          onChange={(e) => setChipInput(prev => ({ ...prev, oh: e.target.value }))}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomChip('oh') } if (e.key === 'Escape') setShowChipInput(prev => ({ ...prev, oh: false })) }}
                        />
                        <button type="button" className="dr-chip-add-confirm" onClick={() => addCustomChip('oh')}>✓</button>
                      </span>
                    ) : (
                      <button type="button" className="dr-chip-add-btn" onClick={() => setShowChipInput(prev => ({ ...prev, oh: true }))}>+ Add Preset</button>
                    )}
                  </div>
                  <textarea className="dr-full-textarea" rows={3} placeholder="e.g. No family history of premature CAD, non-smoker, non-alcoholic..." value={form.oh} onChange={(e) => setForm({ ...form, oh: e.target.value })} />
                </div>
              </div>

              {/* ── Custom Sections added by doctor ── */}
              {customSections.map((sec) => (
                <div key={sec.id} className="dr-card dr-custom-section-card">
                  <div className="dr-card-header">
                    <h3 className="dr-section-title">{sec.title}</h3>
                    <button type="button" className="dr-custom-section-delete-btn" onClick={() => removeCustomSection(sec.id)}>
                      × Remove Section
                    </button>
                  </div>
                  <div className="dr-chips-wrap">
                    {sec.chips.map((chip) => {
                      const isSelected = (sec.text || '').toLowerCase().includes(chip.toLowerCase())
                      return (
                        <span key={chip} className="dr-chip-custom" style={{ borderColor: isSelected ? '#2563eb' : undefined }}>
                          <button
                            type="button"
                            className="dr-chip-btn"
                            style={{
                              fontWeight: isSelected ? 700 : 500,
                              color: isSelected ? '#1d4ed8' : '#334155',
                              background: isSelected ? '#eff6ff' : undefined
                            }}
                            onClick={() => appendCustomSectionChip(sec.id, chip)}
                          >
                            {isSelected ? '✓ ' : '+ '}{chip}
                          </button>
                          <button type="button" className="dr-chip-remove-btn" onClick={() => removeCustomSectionChip(sec.id, chip)} title="Delete chip from database">×</button>
                        </span>
                      )
                    })}
                    {sec.showChipInput ? (
                      <span className="dr-chip-input-wrap">
                        <input
                          autoFocus
                          className="dr-chip-input"
                          placeholder="Type & press Enter"
                          value={sec.chipInput || ''}
                          onChange={(e) => updateCustomSection(sec.id, 'chipInput', e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') { e.preventDefault(); addCustomSectionChip(sec.id) }
                            if (e.key === 'Escape') updateCustomSection(sec.id, 'showChipInput', false)
                          }}
                        />
                        <button type="button" className="dr-chip-add-confirm" onClick={() => addCustomSectionChip(sec.id)}>✓</button>
                      </span>
                    ) : (
                      <button type="button" className="dr-chip-add-btn" onClick={() => updateCustomSection(sec.id, 'showChipInput', true)}>+ Add Chip</button>
                    )}
                  </div>
                  <textarea
                    className="dr-full-textarea"
                    rows={3}
                    placeholder={`Enter ${sec.title} notes...`}
                    value={sec.text}
                    onChange={(e) => updateCustomSection(sec.id, 'text', e.target.value)}
                  />
                </div>
              ))}

              {/* ── Add New Section Button ── */}
              <div className="dr-add-section-bar">
                {showAddSectionInput ? (
                  <div className="dr-add-section-input-row">
                    <input
                      autoFocus
                      className="dr-add-section-input"
                      placeholder="Section title (e.g. Surgical History, Allergy, ROS...)"
                      value={newSectionTitle}
                      onChange={(e) => setNewSectionTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { e.preventDefault(); addCustomSection() }
                        if (e.key === 'Escape') { setShowAddSectionInput(false); setNewSectionTitle('') }
                      }}
                    />
                    <button type="button" className="dr-chip-add-confirm" onClick={addCustomSection}>✓ Add</button>
                    <button type="button" className="dr-add-section-cancel" onClick={() => { setShowAddSectionInput(false); setNewSectionTitle('') }}>Cancel</button>
                  </div>
                ) : (
                  <button type="button" className="dr-add-section-btn" onClick={() => setShowAddSectionInput(true)}>
                    + Add New Section
                  </button>
                )}
              </div>

            </div>
          )}

          {/* ========================================================
              TAB 3: INVESTIGATIONS
              ======================================================== */}
          {activeTab === 'investigations' && (
            <div className="dr-tab-page-container">
              <div className="dr-card">
                <div className="dr-card-header">
                  <h3 className="dr-section-title">
                    <FlaskConical size={16} color="#2563eb" /> Prescribed Investigations ({activeInvestigationsCount})
                  </h3>
                  {!showAddInvInput && (
                    <button type="button" className="dr-btn-blue-outline-sm" onClick={() => setShowAddInvInput(true)}>
                      <Plus size={13} /> Add Custom Test
                    </button>
                  )}
                </div>

                {showAddInvInput && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16, padding: '12px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #cbd5e1' }}>
                    <input
                      autoFocus
                      type="text"
                      className="dr-input-field"
                      style={{ flex: '1 1 240px', minWidth: 200 }}
                      placeholder="Enter investigation test name (e.g. CBC, Serum Creatinine, X-Ray Chest)..."
                      value={customTestInput}
                      onChange={(e) => setCustomTestInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddCustomTestDirect()
                        }
                        if (e.key === 'Escape') {
                          setShowAddInvInput(false)
                          setCustomTestInput('')
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="dr-btn-primary"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
                      onClick={handleAddCustomTestDirect}
                    >
                      <Plus size={14} /> Add to Prescription
                    </button>
                    <button
                      type="button"
                      className="dr-btn-amber-outline"
                      title="Add to prescription and save permanently to your database library"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
                      onClick={handleAddAndSaveCustomTest}
                    >
                      <Star size={13} color="#f59e0b" fill="#f59e0b" /> Add &amp; Save to Library
                    </button>
                    <button
                      type="button"
                      className="dr-btn-gray-outline"
                      onClick={() => { setShowAddInvInput(false); setCustomTestInput('') }}
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {investigationList.length > 0 ? (
                  <div className="dr-inv-active-grid">
                    {investigationList.map((test, i) => (
                      <div key={i} className="dr-inv-active-card">
                        <div className="dr-inv-active-left">
                          <FlaskConical size={15} color="#2563eb" />
                          <span className="dr-inv-active-name">{test}</span>
                        </div>
                        <button
                          type="button"
                          className="dr-chip-remove"
                          onClick={() => handleRemoveInvestigation(i)}
                          title="Remove test"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="dr-empty-box">
                    <FlaskConical size={24} color="#94a3b8" />
                    <p>No investigation tests added yet. Click on any test below to prescribe.</p>
                  </div>
                )}
              </div>

              <div className="dr-card">
                <div className="dr-card-header">
                  <h3 className="dr-section-title">
                    <BookOpen size={15} color="#2563eb" /> My Diagnostic Tests Library ({invPresets.length})
                  </h3>
                  <div className="dr-search-box" style={{ maxWidth: 260 }}>
                    <Search size={13} />
                    <input
                      type="text"
                      className="dr-input-field"
                      placeholder="Search my tests..."
                      value={investigationSearchQuery}
                      onChange={(e) => setInvestigationSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                {/* Quick Add Test to Library Bar */}
                <div style={{ display: 'flex', gap: 8, marginTop: 12, marginBottom: 16 }}>
                  <input
                    type="text"
                    className="dr-input-field"
                    placeholder="Type test name (e.g. CBC, Serum Creatinine, X-Ray Chest, USG)..."
                    value={newInvTestInput}
                    onChange={(e) => setNewInvTestInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleSaveNewInvTest()
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="dr-btn-primary"
                    style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5 }}
                    onClick={handleSaveNewInvTest}
                  >
                    <Plus size={14} /> + Save Test to Library
                  </button>
                </div>

                <div className="dr-inv-category-list">
                  {/* Doctor's Saved Diagnostic Tests from Database */}
                  {invPresets.length > 0 ? (
                    <div className="dr-chips-wrap">
                      {invPresets
                        .filter(preset => !investigationSearchQuery || preset.content.toLowerCase().includes(investigationSearchQuery.toLowerCase()))
                        .map(preset => {
                          const isSelected = investigationList.includes(preset.content)
                          return (
                            <span key={preset.id} className="dr-chip-custom" style={{ borderColor: '#2563eb' }}>
                              <button
                                type="button"
                                className={`dr-chip-test-btn ${isSelected ? 'selected' : ''}`}
                                onClick={() => toggleInvestigationItem(preset.content)}
                              >
                                {isSelected ? '✓ ' : '+ '} {preset.content}
                              </button>
                              <button
                                type="button"
                                className="dr-chip-remove-btn"
                                onClick={(e) => handleDeleteClinicalPreset(preset.id, e)}
                                title="Delete preset from database"
                              >
                                ×
                              </button>
                            </span>
                          )
                        })}
                    </div>
                  ) : (
                    <div style={{ padding: '20px 8px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                      No diagnostic tests saved yet. Type a test name above and click <strong>"+ Save Test to Library"</strong> to build your personal library.
                    </div>
                  )}

                  {Object.entries(INVESTIGATION_CATEGORIES).map(([catName, tests]) => {
                    const filteredTests = tests.filter(t => 
                      !investigationSearchQuery || t.toLowerCase().includes(investigationSearchQuery.toLowerCase())
                    )
                    const catPresets = invPresets.filter(p => p.category === catName).filter(p =>
                      !investigationSearchQuery || p.content.toLowerCase().includes(investigationSearchQuery.toLowerCase())
                    )
                    if (filteredTests.length === 0 && catPresets.length === 0) return null

                    return (
                      <div key={catName} className="dr-category-group">
                        <h4 className="dr-category-title">{catName}</h4>
                        <div className="dr-chips-wrap">
                          {filteredTests.map(test => {
                            const isSelected = investigationList.includes(test)
                            return (
                              <button
                                key={test}
                                type="button"
                                className={`dr-chip-test-btn ${isSelected ? 'selected' : ''}`}
                                onClick={() => toggleInvestigationItem(test)}
                              >
                                {isSelected ? '✓ ' : '+ '} {test}
                              </button>
                            )
                          })}

                          {/* Custom chips added by doctor for this category */}
                          {catPresets.map(preset => {
                            const isSelected = investigationList.includes(preset.content)
                            return (
                              <span key={preset.id} className="dr-chip-custom">
                                <button
                                  type="button"
                                  className={`dr-chip-test-btn ${isSelected ? 'selected' : ''}`}
                                  onClick={() => toggleInvestigationItem(preset.content)}
                                >
                                  {isSelected ? '✓ ' : '+ '} {preset.content}
                                </button>
                                <button
                                  type="button"
                                  className="dr-chip-remove-btn"
                                  onClick={(e) => handleDeleteClinicalPreset(preset.id, e)}
                                  title="Delete from database"
                                >×</button>
                              </span>
                            )
                          })}

                          {/* + Add button per category */}
                          {catShowInput[catName] ? (
                            <span className="dr-chip-input-wrap">
                              <input
                                autoFocus
                                className="dr-chip-input"
                                placeholder="Type & press Enter"
                                value={catChipInput[catName] || ''}
                                onChange={(e) => setCatChipInput(prev => ({ ...prev, [catName]: e.target.value }))}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') { e.preventDefault(); addCatCustomChip(catName) }
                                  if (e.key === 'Escape') setCatShowInput(prev => ({ ...prev, [catName]: false }))
                                }}
                              />
                              <button type="button" className="dr-chip-add-confirm" onClick={() => addCatCustomChip(catName)}>✓</button>
                            </span>
                          ) : (
                            <button type="button" className="dr-chip-add-btn" onClick={() => setCatShowInput(prev => ({ ...prev, [catName]: true }))}>+ Add</button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* ── Custom Investigation Sections added by doctor ── */}
              {customInvSections.map((sec) => (
                <div key={sec.id} className="dr-card dr-custom-section-card">
                  <div className="dr-card-header">
                    <h3 className="dr-section-title">{sec.title}</h3>
                    <button type="button" className="dr-custom-section-delete-btn" onClick={() => removeCustomInvSection(sec.id)}>
                      × Remove Section
                    </button>
                  </div>
                  <div className="dr-chips-wrap">
                    {sec.chips.map((chip) => {
                      const isSelected = (sec.selected || []).includes(chip)
                      return (
                        <span key={chip} className="dr-chip-custom">
                          <button
                            type="button"
                            className={`dr-chip-test-btn ${isSelected ? 'selected' : ''}`}
                            onClick={() => toggleCustomInvChip(sec.id, chip)}
                          >
                            {isSelected ? '✓ ' : '+ '}{chip}
                          </button>
                          <button type="button" className="dr-chip-remove-btn" onClick={() => removeCustomInvSectionChip(sec.id, chip)} title="Remove">×</button>
                        </span>
                      )
                    })}
                    {sec.showChipInput ? (
                      <span className="dr-chip-input-wrap">
                        <input
                          autoFocus
                          className="dr-chip-input"
                          placeholder="Type test name & press Enter"
                          value={sec.chipInput || ''}
                          onChange={(e) => updateCustomInvSection(sec.id, 'chipInput', e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') { e.preventDefault(); addCustomInvSectionChip(sec.id) }
                            if (e.key === 'Escape') updateCustomInvSection(sec.id, 'showChipInput', false)
                          }}
                        />
                        <button type="button" className="dr-chip-add-confirm" onClick={() => addCustomInvSectionChip(sec.id)}>✓</button>
                      </span>
                    ) : (
                      <button type="button" className="dr-chip-add-btn" onClick={() => updateCustomInvSection(sec.id, 'showChipInput', true)}>+ Add Test</button>
                    )}
                  </div>
                  {(sec.selected || []).length > 0 && (
                    <div className="dr-inv-active-grid" style={{ marginTop: 10 }}>
                      {(sec.selected || []).map((chip, i) => (
                        <div key={i} className="dr-inv-active-card">
                          <div className="dr-inv-active-left">
                            <FlaskConical size={15} color="#2563eb" />
                            <span className="dr-inv-active-name">{chip}</span>
                          </div>
                          <button type="button" className="dr-chip-remove" onClick={() => toggleCustomInvChip(sec.id, chip)} title="Remove">
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* ── Add New Investigation Section ── */}
              <div className="dr-add-section-bar">
                {showAddInvSectionInput ? (
                  <div className="dr-add-section-input-row">
                    <input
                      autoFocus
                      className="dr-add-section-input"
                      placeholder="Section title (e.g. Cardiology Tests, Imaging, Microbiology...)"
                      value={newInvSectionTitle}
                      onChange={(e) => setNewInvSectionTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { e.preventDefault(); addCustomInvSection() }
                        if (e.key === 'Escape') { setShowAddInvSectionInput(false); setNewInvSectionTitle('') }
                      }}
                    />
                    <button type="button" className="dr-chip-add-confirm" onClick={addCustomInvSection}>✓ Add</button>
                    <button type="button" className="dr-add-section-cancel" onClick={() => { setShowAddInvSectionInput(false); setNewInvSectionTitle('') }}>Cancel</button>
                  </div>
                ) : (
                  <button type="button" className="dr-add-section-btn" onClick={() => setShowAddInvSectionInput(true)}>
                    + Add New Section
                  </button>
                )}
              </div>

            </div>
          )}

          {/* ========================================================
              TAB 4: ADVICE
              ======================================================== */}
          {activeTab === 'advice' && (
            <div className="dr-tab-page-container">
              <div className="dr-card">
                <div className="dr-card-header">
                  <h3 className="dr-section-title">
                    <CheckCircle2 size={16} color="#16a34a" /> Prescribed Advice & Instructions ({activeAdviceCount})
                  </h3>
                  <span className="dr-helper-text">Items checked below will be printed on the prescription</span>
                </div>

                <div className="dr-advice-checklist-full">
                  {adviceChecklist.length === 0 ? (
                    <div style={{ padding: '24px 8px', textAlign: 'center', color: '#94a3b8' }}>
                      <CheckCircle2 size={24} color="#94a3b8" style={{ margin: '0 auto 8px', display: 'block' }} />
                      <p style={{ margin: 0, fontSize: 13 }}>No advice prescribed yet. Select from standard advice packs below or type custom advice.</p>
                    </div>
                  ) : (
                    adviceChecklist.map((item) => (
                      <div key={item.id} className="dr-advice-item-row">
                        <label className="dr-advice-check-label">
                          <input
                            type="checkbox"
                            className="dr-checkbox"
                            checked={item.checked}
                            onChange={() => handleToggleAdvice(item.id)}
                          />
                          <span className={item.checked ? 'dr-text-active' : 'dr-text-inactive'}>{item.text}</span>
                        </label>
                        <button
                          type="button"
                          className="dr-chip-remove"
                          onClick={() => syncAdvice(adviceChecklist.filter(a => a.id !== item.id))}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="dr-advice-add-bar">
                  <input
                    type="text"
                    className="dr-advice-input-full"
                    placeholder="Type custom advice and press enter or click '+'..."
                    value={newAdviceInput}
                    onChange={(e) => setNewAdviceInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddAdvice()
                      }
                    }}
                  />
                  <button type="button" className="dr-btn-primary" onClick={handleAddAdvice}>
                    <Plus size={14} /> Add Advice
                  </button>
                  {newAdviceInput.trim() && (
                    <button
                      type="button"
                      className="dr-btn-amber-outline"
                      title="Save this advice permanently to your database presets"
                      onClick={() => {
                        const val = newAdviceInput.trim()
                        handleSaveClinicalPreset('advice', val)
                        handleAddAdvice()
                      }}
                    >
                      <Star size={13} color="#f59e0b" fill="#f59e0b" /> + Save as Preset
                    </button>
                  )}
                </div>
              </div>

              {/* Doctor's Saved Advice Presets from Database */}
              <div className="dr-card" style={{ marginBottom: 16 }}>
                <div className="dr-card-header">
                  <h3 className="dr-section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Star size={15} color="#f59e0b" fill="#f59e0b" /> My Saved Advice Presets ({advicePresets.length})
                  </h3>
                  <span className="dr-helper-text">Click to add to prescription, or click × to delete from database</span>
                </div>
                {advicePresets.length > 0 ? (
                  <div className="dr-chips-wrap">
                    {advicePresets.map(preset => {
                      const isChecked = adviceChecklist.some(a => a.text === preset.content && a.checked)
                      return (
                        <span key={preset.id} className="dr-chip-custom" style={{ borderColor: '#16a34a' }}>
                          <button
                            type="button"
                            className="dr-chip-btn"
                            style={{ fontWeight: isChecked ? 700 : 500, color: isChecked ? '#15803d' : '#334155' }}
                            onClick={() => handleAppendAdviceText(preset.content)}
                          >
                            {isChecked ? '✓ ' : '+ '} {preset.content}
                          </button>
                          <button
                            type="button"
                            className="dr-chip-remove-btn"
                            onClick={(e) => handleDeleteClinicalPreset(preset.id, e)}
                            title="Delete preset from database"
                          >
                            ×
                          </button>
                        </span>
                      )
                    })}
                  </div>
                ) : (
                  <div style={{ padding: '16px 8px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                    No advice presets saved yet. Type advice above and click <strong>"+ Save as Preset"</strong> to build your personal advice list.
                  </div>
                )}
              </div>

              {Object.keys(ADVICE_CATEGORIES).length > 0 && (
                <div className="dr-card">
                  <h3 className="dr-section-title">
                    <Sparkles size={15} color="#f59e0b" /> Standard Clinical Advice Packs
                  </h3>
                  <div className="dr-advice-category-grid">
                    {Object.entries(ADVICE_CATEGORIES).map(([catTitle, items]) => (
                      <div key={catTitle} className="dr-advice-pack-card">
                        <h4 className="dr-pack-title">{catTitle}</h4>
                        <div className="dr-pack-items">
                          {items.map(text => {
                            const isChecked = adviceChecklist.some(a => a.text === text && a.checked)
                            return (
                              <button
                                key={text}
                                type="button"
                                className={`dr-pack-item-btn ${isChecked ? 'active' : ''}`}
                                onClick={() => handleAppendAdviceText(text)}
                              >
                                {isChecked ? '✓ ' : '+ '} {text}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================
              TAB 5: FOLLOW UP
              ======================================================== */}
          {activeTab === 'followup' && (
            <div className="dr-tab-page-container">
              <div className="dr-card">
                <div className="dr-card-header">
                  <h3 className="dr-section-title">
                    <Calendar size={16} color="#2563eb" /> Next Follow-up Consultation
                  </h3>
                </div>

                <div className="dr-followup-setting-grid">
                  <div>
                    <label className="dr-form-label">Review Interval Preset</label>
                    <div className="dr-chips-wrap">
                      {['3 Days', '5 Days', '7 Days', '10 Days', '14 Days', '21 Days', '1 Month', '2 Months'].map(offset => (
                        <button
                          key={offset}
                          type="button"
                          className={`dr-chip-btn ${form.follow_up_offset === offset ? 'active-pill' : ''}`}
                          onClick={() => handleFollowUpOffset(offset)}
                        >
                          {offset}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="dr-form-label">Exact Next Follow-up Date</label>
                    <div className="dr-date-input-group">
                      <input
                        type="date"
                        className="dr-input-field"
                        value={form.follow_up_date}
                        onChange={(e) => setForm({ ...form, follow_up_date: e.target.value })}
                      />
                      <div className="dr-date-highlight-card">
                        <Calendar size={18} color="#2563eb" />
                        <div>
                          <strong>{formatFollowUpDisplay(form.follow_up_date)}</strong>
                          <div style={{ fontSize: 11, color: '#64748b' }}>Scheduled Next Review Visit</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="dr-card">
                <h3 className="dr-section-title">
                  <AlertOctagon size={16} color="#dc2626" /> Emergency Warning Signs & Referral Instructions
                </h3>
                <div className="dr-chips-wrap">
                  {[
                    'Report to Emergency if high fever persists > 3 days',
                    'Report to Hospital if severe shortness of breath or chest tightness',
                    'Report to Emergency if continuous vomiting or unable to retain oral fluids',
                    'Bring all previous lab reports & medicine strips on next visit'
                  ].map(msg => {
                    const isSelected = noteList.some(n => n.toLowerCase() === msg.toLowerCase())
                    return (
                      <button
                        key={msg}
                        type="button"
                        className={`dr-chip-btn ${isSelected ? 'active-pill' : ''}`}
                        style={{
                          fontWeight: isSelected ? 700 : 500,
                          background: isSelected ? '#eff6ff' : undefined,
                          borderColor: isSelected ? '#2563eb' : undefined,
                          color: isSelected ? '#1d4ed8' : undefined
                        }}
                        onClick={() => toggleNoteItem(msg)}
                      >
                        {isSelected ? '✓ ' : '+ '} {msg}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 6: NOTES
              ======================================================== */}
          {activeTab === 'notes' && (
            <div className="dr-tab-page-container">
              <div className="dr-card">
                <div className="dr-card-header">
                  <h3 className="dr-section-title">
                    <FileText size={16} color="#2563eb" /> Doctor's Clinical & Confidential Notes {noteList.length > 0 && `(${noteList.length})`}
                  </h3>
                  {canViewNotes && !showAddCustomNote && (
                    <button
                      type="button"
                      className="dr-btn-blue-outline-sm"
                      onClick={() => setShowAddCustomNote(true)}
                    >
                      <Plus size={13} /> Add Custom Note
                    </button>
                  )}
                </div>

                {!canViewNotes ? (
                  <div style={{ padding: '24px', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '8px', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                    <ShieldCheck size={28} color="#f59e0b" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <h4 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#334155' }}>🔒 Confidential Doctor Notes (Restricted)</h4>
                      <p style={{ margin: '6px 0 0', fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
                        This clinical consultation note was recorded by {prescriptionDoctorName ? `Dr. ${prescriptionDoctorName}` : 'another prescribing doctor'}. In accordance with healthcare data protection and confidentiality policies, private doctor notes are strictly isolated and can only be accessed or modified by the authoring doctor.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Add Custom Note Input Bar (like in Investigation) */}
                    {showAddCustomNote && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16, padding: '12px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #cbd5e1' }}>
                        <input
                          autoFocus
                          type="text"
                          className="dr-input-field"
                          style={{ flex: '1 1 240px', minWidth: 200 }}
                          placeholder="Type clinical note / remark and press enter..."
                          value={newNoteInput}
                          onChange={(e) => setNewNoteInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleAddCustomNoteDirect()
                            }
                            if (e.key === 'Escape') {
                              setShowAddCustomNote(false)
                              setNewNoteInput('')
                            }
                          }}
                        />
                        <button
                          type="button"
                          className="dr-btn-primary"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
                          onClick={handleAddCustomNoteDirect}
                        >
                          <Plus size={14} /> Add Note
                        </button>
                        <button
                          type="button"
                          className="dr-btn-amber-outline"
                          title="Add note and save permanently to your snippets library"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
                          onClick={handleAddAndSaveCustomNote}
                        >
                          <Star size={13} color="#f59e0b" fill="#f59e0b" /> Add &amp; Save Snippet
                        </button>
                        <button
                          type="button"
                          className="dr-btn-gray-outline"
                          onClick={() => { setShowAddCustomNote(false); setNewNoteInput('') }}
                        >
                          Cancel
                        </button>
                      </div>
                    )}

                    {/* Active Notes Grid — EXACTLY LIKE INVESTIGATION (cards with remove X button) */}
                    {noteList.length > 0 ? (
                      <div className="dr-inv-active-grid" style={{ marginBottom: 16 }}>
                        {noteList.map((note, i) => (
                          <div key={i} className="dr-inv-active-card">
                            <div className="dr-inv-active-left">
                              <FileText size={15} color="#2563eb" />
                              <span className="dr-inv-active-name">{note}</span>
                            </div>
                            <button
                              type="button"
                              className="dr-chip-remove"
                              onClick={() => handleRemoveNote(i)}
                              title="Remove note"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="dr-empty-box" style={{ marginBottom: 16 }}>
                        <FileText size={24} color="#94a3b8" />
                        <p>No confidential notes added yet. Click on any quick snippet below or click "+ Add Custom Note".</p>
                      </div>
                    )}

                    {/* Freeform/Full textarea for editing remarks */}
                    <div style={{ marginTop: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>
                          Full Note Summary / Additional Free-form Remarks
                        </label>
                        {noteList.length > 0 && (
                          <button
                            type="button"
                            style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: 12, cursor: 'pointer', padding: 0 }}
                            onClick={() => syncNotes([])}
                          >
                            Clear All Notes
                          </button>
                        )}
                      </div>
                      <textarea
                        className="dr-full-textarea"
                        rows={3}
                        placeholder="Type any private clinical observations, response to previous treatment, differential diagnosis thoughts, or referral recommendations..."
                        value={form.notes || ''}
                        onChange={(e) => handleNotesTextareaChange(e.target.value)}
                      />
                    </div>
                  </>
                )}
              </div>

              {canViewNotes && (
                <div className="dr-card">
                  <div className="dr-card-header" style={{ marginBottom: 12 }}>
                    <h3 className="dr-section-title">
                      <Sparkles size={15} color="#2563eb" /> Quick Note Snippets ({notePresets.length})
                    </h3>
                    <button
                      type="button"
                      className="dr-btn-primary"
                      style={{ padding: '4px 10px', fontSize: 12, height: 30, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      onClick={() => setShowAddNoteSnippet(prev => !prev)}
                    >
                      <Plus size={13} /> Add Snippet
                    </button>
                  </div>

                  <div className="dr-chips-wrap">
                    {notePresets.map(preset => {
                      const isSelected = noteList.some(n => n.toLowerCase() === preset.content.trim().toLowerCase())
                      return (
                        <div key={preset.id} className="dr-chip-item-group" style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                          <button
                            type="button"
                            className={`dr-chip-btn ${isSelected ? 'active-pill' : ''}`}
                            style={{
                              fontWeight: isSelected ? 700 : 500,
                              background: isSelected ? '#eff6ff' : undefined,
                              borderColor: isSelected ? '#2563eb' : undefined,
                              color: isSelected ? '#1d4ed8' : undefined
                            }}
                            onClick={() => toggleNoteItem(preset.content)}
                            title={isSelected ? 'Click to remove from notes' : 'Click to add to notes'}
                          >
                            {isSelected ? '✓ ' : '+ '} {preset.content}
                          </button>
                          <button
                            type="button"
                            className="dr-chip-remove"
                            style={{ padding: '2px 5px', color: '#94a3b8', background: 'transparent', border: 'none', cursor: 'pointer' }}
                            title="Delete snippet permanently from database library"
                            onClick={(e) => handleDeleteClinicalPreset(preset.id, e)}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      )
                    })}

                    {!showAddNoteSnippet && (
                      <button
                        type="button"
                        className="dr-chip-btn dr-chip-add-btn"
                        style={{ border: '1px dashed #2563eb', color: '#2563eb', background: '#eff6ff', fontWeight: 600 }}
                        onClick={() => setShowAddNoteSnippet(true)}
                      >
                        <Plus size={13} /> Add Snippet
                      </button>
                    )}
                  </div>

                  {showAddNoteSnippet && (
                    <div className="dr-advice-add-bar" style={{ marginTop: 14, display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input
                        type="text"
                        className="dr-advice-input-full"
                        style={{ flex: 1, padding: '7px 12px', fontSize: 13, borderRadius: 6, border: '1px solid #cbd5e1' }}
                        placeholder="Type custom note snippet (e.g. Advised periodic blood sugar monitoring) and press Enter..."
                        value={newNoteSnippetInput}
                        autoFocus
                        onChange={(e) => setNewNoteSnippetInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleAddNoteSnippet()
                          } else if (e.key === 'Escape') {
                            setShowAddNoteSnippet(false)
                          }
                        }}
                      />
                      <button type="button" className="dr-btn-primary" style={{ padding: '6px 14px', fontSize: 13 }} onClick={handleAddNoteSnippet}>
                        <Plus size={14} /> Save
                      </button>
                      <button
                        type="button"
                        className="dr-btn-secondary"
                        style={{ padding: '6px 12px', fontSize: 13 }}
                        onClick={() => {
                          setShowAddNoteSnippet(false)
                          setNewNoteSnippetInput('')
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </main>

        {/* RIGHT COLUMN: Vitals & Clinical Context Sidebar */}
        {!isZenMode && (
          <aside className="dr-sidebar-column">
            
            {/* Vitals Card (Marked in Image - Interactive Edit) */}
            <div className="dr-card dr-vitals-card">
              <div className="dr-card-header">
                <h4 className="dr-sidebar-card-title">
                  Vitals {vitals.recorded_at ? <span className="dr-vitals-subdate">({vitals.recorded_at})</span> : null}
                </h4>
                <button 
                  type="button" 
                  className="dr-sidebar-link-btn" 
                  onClick={() => setShowVitalsModal(true)}
                >
                  Edit
                </button>
              </div>

              <div className="dr-vitals-grid" onClick={() => setShowVitalsModal(true)} style={{ cursor: 'pointer' }}>
                <div className="dr-vital-box" title="Click to edit BP">
                  <span className="dr-vital-label">BP</span>
                  <span className="dr-vital-value">
                    {vitals.bp_systolic ? `${vitals.bp_systolic}/${vitals.bp_diastolic || '—'}` : '—'}
                  </span>
                  <div className="dr-vital-unit-row">
                    <span className="dr-vital-unit">mmHg</span>
                    {vitals.bp_systolic && <span className="dr-status-dot-green"></span>}
                  </div>
                </div>

                <div className="dr-vital-box" title="Click to edit Pulse">
                  <span className="dr-vital-label">Pulse</span>
                  <span className="dr-vital-value">{vitals.pulse || '—'}</span>
                  <div className="dr-vital-unit-row">
                    <span className="dr-vital-unit">bpm</span>
                    {vitals.pulse && <span className="dr-status-dot-green"></span>}
                  </div>
                </div>

                <div className="dr-vital-box" title="Click to edit Temp">
                  <span className="dr-vital-label">Temp</span>
                  <span className="dr-vital-value">{vitals.temp || '—'}</span>
                  <div className="dr-vital-unit-row">
                    <span className="dr-vital-unit">°F</span>
                    {vitals.temp && <span className="dr-status-dot-green"></span>}
                  </div>
                </div>

                <div className="dr-vital-box" title="Click to edit Weight">
                  <span className="dr-vital-label">Weight</span>
                  <span className="dr-vital-value">{vitals.weight || '—'}</span>
                  <div className="dr-vital-unit-row">
                    <span className="dr-vital-unit">kg</span>
                    {vitals.weight && <span className="dr-status-dot-green"></span>}
                  </div>
                </div>

                <div className="dr-vital-box" title="Click to edit Height">
                  <span className="dr-vital-label">Height</span>
                  <span className="dr-vital-value">{vitals.height_ft || '—'}</span>
                  <div className="dr-vital-unit-row">
                    <span className="dr-vital-unit">ft</span>
                    {vitals.height_ft && <span className="dr-status-dot-green"></span>}
                  </div>
                </div>

                <div className="dr-vital-box" title="Calculated BMI">
                  <span className="dr-vital-label">BMI</span>
                  <span className="dr-vital-value">{currentBMI.val}</span>
                  <div className="dr-vital-unit-row">
                    <span className="dr-vital-unit">{currentBMI.label}</span>
                    {currentBMI.val !== '—' && <span className="dr-status-dot-green"></span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Templates (Doctor-Scoped & Reusable) */}
            <div className="dr-card dr-sidebar-card">
              <div className="dr-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h4 className="dr-sidebar-card-title" style={{ margin: 0 }}>Quick Templates</h4>
                  <span style={{ fontSize: 11, color: '#64748b' }}>Doctor Presets & Bundles</span>
                </div>
                <button
                  type="button"
                  className="dr-btn-primary"
                  style={{ fontSize: 11, padding: '4px 8px', height: 26, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  onClick={() => setShowSaveTemplateModal(true)}
                  title="Save current prescription as a reusable template"
                >
                  <Plus size={12} /> Save Rx
                </button>
              </div>

              <div className="dr-recent-prescriptions-list">
                {quickTemplates.length === 0 ? (
                  <div style={{ padding: '16px 8px', textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>
                    No templates saved yet. Click "+ Save Rx" to save current prescription as template.
                  </div>
                ) : (
                  quickTemplates.map((tpl, idx) => (
                    <div
                      key={tpl.id || tpl.name || idx}
                      className="dr-recent-row"
                      onClick={() => applyQuickTemplate(tpl)}
                      style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                      title={`Click to apply template "${tpl.name}"`}
                    >
                      <div className="dr-recent-left" style={{ flex: 1, minWidth: 0 }}>
                        <CheckCircle2 size={14} color={tpl.isCustom ? "#2563eb" : "#16a34a"} style={{ flexShrink: 0 }} />
                        <div style={{ minWidth: 0 }}>
                          <div className="dr-recent-date" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontWeight: 600, color: '#1e293b' }}>{tpl.name}</span>
                            {tpl.isCustom ? (
                              <span style={{ fontSize: 9, background: '#eff6ff', color: '#2563eb', padding: '1px 5px', borderRadius: 3, fontWeight: 600 }}>
                                Custom
                              </span>
                            ) : (
                              <span style={{ fontSize: 9, background: '#f0fdf4', color: '#16a34a', padding: '1px 5px', borderRadius: 3 }}>
                                Standard
                              </span>
                            )}
                          </div>
                          <div className="dr-recent-diag" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {tpl.diagnosis || (tpl.medicines?.map(m => m.medicine_name).slice(0, 2).join(', ')) || 'Template'}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        <span className="dr-recent-badge">{tpl.medicines?.length || 0} Meds</span>
                        {tpl.isCustom && (
                          <button
                            type="button"
                            className="dr-chip-remove"
                            style={{ padding: '3px 4px', color: '#94a3b8', background: 'transparent', border: 'none', cursor: 'pointer' }}
                            title="Delete template"
                            onClick={(e) => handleDeleteTemplate(tpl.id || tpl.name, e)}
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Clinical Timeline (EMR/HIS) */}
            <div className="dr-card dr-sidebar-card">
              <div className="dr-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 className="dr-sidebar-card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <History size={15} color="#2563eb" /> Patient Clinical Timeline
                </h4>
                {clinicalTimeline.length > 0 && (
                  <span style={{ fontSize: 11, fontWeight: 700, background: '#eff6ff', color: '#2563eb', padding: '2px 6px', borderRadius: 999 }}>
                    {clinicalTimeline.length}
                  </span>
                )}
              </div>

              <div className="dr-timeline-list">
                {timelineLoading ? (
                  <div style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontSize: 12 }}>
                    <RefreshCw size={14} className="admin-spinner" style={{ display: 'inline', marginRight: 6 }} />
                    Loading clinical timeline...
                  </div>
                ) : timelineError ? (
                  <div style={{ padding: '10px', fontSize: 12, color: '#b91c1c', background: '#fef2f2', borderRadius: 6 }}>
                    {timelineError}
                  </div>
                ) : clinicalTimeline.length === 0 ? (
                  <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>
                    <AlertCircle size={18} style={{ margin: '0 auto 6px', display: 'block', opacity: 0.6 }} />
                    No previous clinical records found. This is their 1st visit (Visit #01).
                  </div>
                ) : (
                  clinicalTimeline.map((ev, idx) => {
                    const isFirst = idx === 0
                    const p = ev.payload || {}
                    const occurredDate = ev.occurred_at 
                      ? new Date(ev.occurred_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                      : 'Past Date'
                    const occurredTime = p.visiting_time_display 
                      || (ev.occurred_at ? new Date(ev.occurred_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '')
                    const visitNoBadge = p.visit_no_display || (ev.visit_no ? `Visit #${String(ev.visit_no).padStart(2, '0')}` : null)
                    const medicinesCount = p.medicines_count || (Array.isArray(p.medicines) ? p.medicines.length : 0)

                    return (
                      <div key={ev.id || idx} className={isFirst ? 'dr-timeline-item-active' : 'dr-timeline-item'} style={{ marginBottom: 14 }}>
                        <div className={isFirst ? 'dr-timeline-dot-active' : 'dr-timeline-dot'}>
                          {isFirst ? '●' : '○'}
                        </div>
                        <div className="dr-timeline-content" style={{ width: '100%' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4 }}>
                            <div className="dr-timeline-date" style={{ fontWeight: 600, color: '#334155', fontSize: 12 }}>
                              {occurredDate} {occurredTime && <span style={{ color: '#64748b', fontWeight: 500 }}>• {occurredTime}</span>}
                            </div>
                            {visitNoBadge && (
                              <span style={{ fontSize: 11, fontWeight: 700, color: '#0d9488', background: '#f0fdfa', padding: '1px 6px', borderRadius: 4, border: '1px solid #ccfbf1' }}>
                                {visitNoBadge}
                              </span>
                            )}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                            <span className="dr-timeline-type" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                              {ev.type || 'Prescription'}
                            </span>
                            {p.doctor_name && (
                              <span style={{ fontSize: 11, color: '#64748b' }}>
                                by {p.doctor_name}
                              </span>
                            )}
                          </div>

                          <div className="dr-timeline-diag" style={{ marginTop: 4, fontWeight: 600, fontSize: 12, color: '#0f172a' }}>
                            {p.diagnosis || ev.summary}
                          </div>

                          {medicinesCount > 0 && (
                            <div style={{ fontSize: 11, color: '#2563eb', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Pill size={11} /> {medicinesCount} Prescribed Medicine{medicinesCount !== 1 ? 's' : ''}
                            </div>
                          )}

                          {/* Quick Actions: View Rx (immutable modal) & Copy Meds (action with audit) */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                            <button
                              type="button"
                              className="dr-btn-view-rx"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                fontSize: 11,
                                fontWeight: 600,
                                padding: '3px 8px',
                                background: '#f8fafc',
                                border: '1px solid #cbd5e1',
                                borderRadius: 4,
                                color: '#334155',
                                cursor: 'pointer'
                              }}
                              onClick={() => handleViewHistoricalRx(ev)}
                            >
                              <Eye size={12} /> View Rx
                            </button>

                            {ev.type === 'prescription' && (
                              <button
                                type="button"
                                className="dr-btn-copy-meds"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  fontSize: 11,
                                  fontWeight: 600,
                                  padding: '3px 8px',
                                  background: '#eff6ff',
                                  border: '1px solid #bfdbfe',
                                  borderRadius: 4,
                                  color: '#1d4ed8',
                                  cursor: copyingMedicinesId === ev.id ? 'wait' : 'pointer'
                                }}
                                disabled={copyingMedicinesId === ev.id}
                                onClick={() => handleCopyMedicines(ev.id || p.public_id)}
                                title="Copy medicines into current prescription without changing diagnosis or advice"
                              >
                                <Copy size={12} /> {copyingMedicinesId === ev.id ? 'Copying...' : 'Copy Meds'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

          </aside>
        )}
      </form>

      {/* 5. BOTTOM STICKY COMMAND DOCK */}
      <footer className="dr-bottom-dock">
        <div className="dr-dock-container">
          <div className="dr-dock-left">
            <button 
              type="button" 
              className="dr-dock-btn-danger" 
              onClick={() => {
                if (confirm('Are you sure you want to clear all form entries?')) {
                  setForm(prev => ({ ...prev, diagnosis: '', advice: '', medicines: [emptyMedicine()] }))
                }
              }}
            >
              <Trash2 size={14} /> Clear All
            </button>
            <button type="button" className="dr-dock-btn-white" onClick={() => performSaveDraft(false)}>
              <FileText size={14} /> Save Draft <span className="dr-kbd-hint">Ctrl + S</span>
            </button>
            <button 
              type="button" 
              className="dr-dock-btn-white"
              onClick={() => setShowPreviewModal(true)}
            >
              <Eye size={14} /> Preview <span className="dr-kbd-hint">Ctrl + P</span>
            </button>
          </div>

          <div className="dr-dock-right">
            <button 
              type="button" 
              className="dr-dock-btn-primary" 
              onClick={handleSubmit}
              disabled={saving}
            >
              <CheckCircle2 size={15} /> 
              <span>{saving ? 'Completing...' : 'Complete & Print'}</span>
              <span className="dr-kbd-hint-light">Ctrl + Enter</span>
              <ChevronDown size={14} />
            </button>

            <button type="button" className="dr-dock-btn-green">
              <ShieldCheck size={15} /> Digital Sign
            </button>
          </div>
        </div>
      </footer>

      {/* ========================================================
          MODAL 1: KEYBOARD SHORTCUTS MODAL
          ======================================================== */}
      {showShortcutsModal && (
        <div className="dr-modal-backdrop" onClick={() => setShowShortcutsModal(false)}>
          <div className="dr-modal-card" onClick={e => e.stopPropagation()}>
            <div className="dr-modal-header">
              <div className="dr-modal-title">
                <Keyboard size={18} color="#2563eb" /> Keyboard Shortcuts Guide
              </div>
              <button type="button" className="dr-chip-remove" onClick={() => setShowShortcutsModal(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="dr-modal-body">
              <div className="dr-shortcuts-grid">
                <div className="dr-shortcut-row">
                  <span>Save Prescription</span>
                  <kbd>Ctrl + S</kbd>
                </div>
                <div className="dr-shortcut-row">
                  <span>Save & Print</span>
                  <kbd>Ctrl + Enter</kbd>
                </div>
                <div className="dr-shortcut-row">
                  <span>Open Live Preview</span>
                  <kbd>Ctrl + P</kbd>
                </div>
                <div className="dr-shortcut-row">
                  <span>Add New Medicine Row</span>
                  <kbd>Alt + N</kbd>
                </div>
                <div className="dr-shortcut-row">
                  <span>Next Medicine Field</span>
                  <kbd>Tab</kbd>
                </div>
                <div className="dr-shortcut-row">
                  <span>Focus Medicine Search</span>
                  <kbd>Ctrl + F</kbd>
                </div>
              </div>
            </div>
            <div className="dr-modal-footer">
              <button type="button" className="dr-btn-primary" onClick={() => setShowShortcutsModal(false)}>
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 2: LIVE PRESCRIPTION PREVIEW MODAL
          ======================================================== */}
      {showPreviewModal && (
        <div className="dr-modal-backdrop" onClick={() => setShowPreviewModal(false)}>
          <div className="dr-modal-card dr-preview-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 920 }}>
            <div className="dr-modal-header">
              <div className="dr-modal-title">
                <Eye size={18} color="#2563eb" /> Live Digital Prescription Preview
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f8fafc', padding: '3px 8px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Template:</span>
                  <select 
                    className="dr-select-box"
                    style={{ height: 28, fontSize: 12, padding: '0 22px 0 6px', backgroundPosition: 'right 4px center' }}
                    value={selectedTemplate}
                    onChange={(e) => handleSelectTemplate(e.target.value, DIGITAL_PRESCRIPTION_TEMPLATES.find(t => t.id === e.target.value)?.name)}
                  >
                    {DIGITAL_PRESCRIPTION_TEMPLATES.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <button type="button" className="dr-btn-primary" onClick={handlePrintNow}>
                  <Printer size={14} /> Print Now
                </button>
                <button type="button" className="dr-chip-remove" onClick={() => setShowPreviewModal(false)}>
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="dr-modal-body dr-preview-body">
              <PrescriptionPaper 
                ref={previewPaperRef}
                template={selectedTemplate}
                prescription={{
                  ...form,
                  template: selectedTemplate,
                  id: id || 'preview',
                  medicines: form.medicines.filter(m => m.medicine_name.trim()),
                  patient_name: patientName,
                  patient_age: patientAge,
                  patient_sex: patientSex,
                  patient_phone: patientPhone,
                  patient_id: patientId,
                  registration_no: patientId,
                  visit_no: visitNo,
                  created_at: new Date().toISOString(),
                  doctor: user?.doctor || appointmentInfo?.doctor || {},
                  doctor_slug: user?.doctor?.slug || appointmentInfo?.doctor?.slug || '',
                  doctor_slug_bn: user?.doctor?.slug_bn || appointmentInfo?.doctor?.slug_bn || '',
                  doctor_name: user?.doctor?.name || appointmentInfo?.doctor?.name || user?.name || '',
                  doctor_name_bn: user?.doctor?.name_bn || appointmentInfo?.doctor?.name_bn || '',
                  doctor_specialty: user?.doctor?.specialty_name || user?.doctor?.specialty?.name || appointmentInfo?.doctor?.specialty?.name || user?.doctor?.specialty || '',
                  doctor_specialty_bn: user?.doctor?.specialty_bn || user?.doctor?.specialty?.name_bn || appointmentInfo?.doctor?.specialty_bn || '',
                  doctor_degree: user?.doctor?.degree || appointmentInfo?.doctor?.degree || '',
                  doctor_degree_bn: user?.doctor?.degree_bn || appointmentInfo?.doctor?.degree_bn || '',
                  doctor_degree1: user?.doctor?.degree1 || appointmentInfo?.doctor?.degree1 || '',
                  doctor_degree1_bn: user?.doctor?.degree1_bn || appointmentInfo?.doctor?.degree1_bn || '',
                  doctor_degree2: user?.doctor?.degree2 || appointmentInfo?.doctor?.degree2 || '',
                  doctor_degree2_bn: user?.doctor?.degree2_bn || appointmentInfo?.doctor?.degree2_bn || '',
                  doctor_degree3: user?.doctor?.degree3 || appointmentInfo?.doctor?.degree3 || '',
                  doctor_degree3_bn: user?.doctor?.degree3_bn || appointmentInfo?.doctor?.degree3_bn || '',
                  doctor_degree4: user?.doctor?.degree4 || appointmentInfo?.doctor?.degree4 || '',
                  doctor_degree4_bn: user?.doctor?.degree4_bn || appointmentInfo?.doctor?.degree4_bn || '',
                  doctor_workplace: user?.doctor?.workplace || appointmentInfo?.doctor?.workplace || '',
                  doctor_workplace_bn: user?.doctor?.workplace_bn || appointmentInfo?.doctor?.workplace_bn || '',
                  doctor_bmdc: user?.doctor?.bmdc || appointmentInfo?.doctor?.bmdc || '',
                  doctor_signature: user?.doctor?.signature_photo || appointmentInfo?.doctor?.signature_photo || appointmentInfo?.doctor_signature || user?.doctor?.signature || '',
                  hospital: form.hospital_name ? {
                    id: form.hospital_id,
                    name: form.hospital_name,
                    name_bn: form.hospital_name_bn,
                    address: form.hospital_address,
                    phone: form.hospital_phone,
                    hotline: form.hospital_hotline,
                    url: form.hospital_website,
                    website: form.hospital_website,
                    hospital_logo: form.hospital_logo,
                    photo_url: form.hospital_logo,
                  } : (appointmentInfo?.chamber?.hospital || appointmentInfo?.hospital || user?.doctor?.hospital || {}),
                  hospital_name: form.hospital_name || form.chamber_name || appointmentInfo?.chamber?.hospital?.name || appointmentInfo?.hospital?.name || user?.doctor?.hospital?.name || user?.doctor?.workplace || '',
                  hospital_name_bn: form.hospital_name_bn || form.chamber_name_bn || appointmentInfo?.chamber?.hospital?.name_bn || appointmentInfo?.hospital?.name_bn || '',
                  hospital_address: form.hospital_address || form.chamber_address || appointmentInfo?.chamber?.hospital?.address || appointmentInfo?.hospital?.address || user?.doctor?.hospital?.address || '',
                  hospital_phone: form.hospital_phone || form.chamber_phone || appointmentInfo?.chamber?.hospital?.phone || appointmentInfo?.hospital?.phone || user?.doctor?.hospital?.phone || '',
                  hospital_hotline: form.hospital_hotline || form.chamber_hotline || appointmentInfo?.chamber?.hospital?.hotline || appointmentInfo?.hospital?.hotline || '',
                  hospital_website: form.hospital_website || form.chamber_website || appointmentInfo?.chamber?.hospital?.url || appointmentInfo?.hospital?.url || 'www.goodhealthhospital.com',
                  hospital_logo: form.hospital_logo || form.chamber_logo || appointmentInfo?.chamber?.hospital?.hospital_logo || appointmentInfo?.chamber?.hospital?.photo_url || appointmentInfo?.hospital?.hospital_logo || user?.doctor?.hospital?.photo_url || '',
                  chamber_id: form.chamber_id,
                  chamber_name: form.chamber_name || form.hospital_name || appointmentInfo?.chamber?.hospital?.name || appointmentInfo?.hospital?.name || user?.doctor?.workplace || '',
                  chamber_name_bn: form.chamber_name_bn || form.hospital_name_bn || appointmentInfo?.chamber?.hospital?.name_bn || appointmentInfo?.hospital?.name_bn || '',
                  chamber_address: form.chamber_address || form.hospital_address || appointmentInfo?.chamber?.hospital?.address || appointmentInfo?.hospital?.address || '',
                  chamber_phone: form.chamber_phone || form.hospital_phone || appointmentInfo?.chamber?.hospital?.phone || appointmentInfo?.hospital?.phone || '',
                  chamber_hotline: form.chamber_hotline || form.hospital_hotline || appointmentInfo?.chamber?.hospital?.hotline || appointmentInfo?.hospital?.hotline || '',
                  chamber_website: form.chamber_website || form.hospital_website || appointmentInfo?.chamber?.hospital?.url || appointmentInfo?.hospital?.url || 'www.goodhealthhospital.com',
                  chamber_logo: form.chamber_logo || form.hospital_logo || appointmentInfo?.chamber?.hospital?.hospital_logo || appointmentInfo?.chamber?.hospital?.photo_url || '',
                  chamber: doctorChambers.find(c => String(c.id) === String(form.chamber_id) || String(c.public_id) === String(form.chamber_id)) || appointmentInfo?.chamber || null,
                  appointment: appointmentInfo || null
                }}
                hideAll={false}
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: SAVE CURRENT PRESCRIPTION AS QUICK TEMPLATE
          ======================================================== */}
      {showSaveTemplateModal && (
        <div className="dr-modal-backdrop" onClick={() => setShowSaveTemplateModal(false)}>
          <div className="dr-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="dr-modal-header">
              <div className="dr-modal-title">
                <Sparkles size={18} color="#2563eb" /> Save as Quick Add Template
              </div>
              <button 
                type="button" 
                className="dr-modal-close" 
                onClick={() => setShowSaveTemplateModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="dr-modal-body" style={{ padding: '20px' }}>
              <p style={{ fontSize: 13, color: '#64748b', marginTop: 0, marginBottom: 16 }}>
                Save this prescription combination (Diagnosis, Medicines, Investigations, Advice) as a custom quick template under your doctor account.
              </p>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                  Template Name *
                </label>
                <input
                  type="text"
                  className="dr-advice-input-full"
                  style={{ width: '100%', padding: '9px 12px', fontSize: 14, border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }}
                  placeholder="e.g. Typhoid Protocol, Pediatric Cold & Fever"
                  value={templateNameInput}
                  onChange={(e) => setTemplateNameInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleSaveCurrentAsTemplate(templateNameInput)
                    }
                  }}
                  autoFocus
                />
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '12px 14px', fontSize: 12, color: '#475569' }}>
                <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: 6 }}>Items to be saved in this template:</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                  <div style={{ padding: '6px 8px', background: '#ffffff', borderRadius: 4, border: '1px solid #e2e8f0' }}>
                    <span style={{ color: '#64748b' }}>Diagnosis:</span>
                    <div style={{ fontWeight: 500, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {form.diagnosis || 'None'}
                    </div>
                  </div>
                  <div style={{ padding: '6px 8px', background: '#ffffff', borderRadius: 4, border: '1px solid #e2e8f0' }}>
                    <span style={{ color: '#64748b' }}>Medicines:</span>
                    <div style={{ fontWeight: 600, color: '#2563eb' }}>
                      {form.medicines.filter(m => (m.medicine_name || '').trim()).length} medicine(s)
                    </div>
                  </div>
                  <div style={{ padding: '6px 8px', background: '#ffffff', borderRadius: 4, border: '1px solid #e2e8f0' }}>
                    <span style={{ color: '#64748b' }}>Investigations:</span>
                    <div style={{ fontWeight: 500, color: '#0f172a' }}>
                      {investigationList.length} test(s)
                    </div>
                  </div>
                  <div style={{ padding: '6px 8px', background: '#ffffff', borderRadius: 4, border: '1px solid #e2e8f0' }}>
                    <span style={{ color: '#64748b' }}>Advices:</span>
                    <div style={{ fontWeight: 500, color: '#0f172a' }}>
                      {adviceChecklist.filter(a => a.checked).length} item(s)
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="dr-modal-footer" style={{ padding: '14px 20px', display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: '1px solid #f1f5f9' }}>
              <button
                type="button"
                className="dr-btn-secondary"
                onClick={() => {
                  setShowSaveTemplateModal(false)
                  setTemplateNameInput('')
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="dr-btn-primary"
                onClick={() => handleSaveCurrentAsTemplate(templateNameInput)}
                disabled={!templateNameInput.trim()}
              >
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 3: FAVORITES MEDICINE PICKER & MANAGER
          ======================================================== */}
      {showFavoritesModal && (
        <div className="dr-modal-backdrop" onClick={() => { setShowFavoritesModal(false); handleCancelFavForm(); }}>
          <div className="dr-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="dr-modal-header">
              <div className="dr-modal-title">
                <Star size={18} color="#f59e0b" fill="#f59e0b" /> Doctor's Favorite Medicines ({favoriteMedicines.length})
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button 
                  type="button" 
                  className={showAddFavForm ? "dr-btn-white" : "dr-btn-blue-outline-sm"}
                  onClick={() => {
                    if (showAddFavForm) {
                      handleCancelFavForm()
                    } else {
                      setEditingFavIndex(null)
                      setNewFavForm({
                        name: '',
                        type: 'Tablet',
                        strength: '',
                        dose: '1 Tablet',
                        frequency: '1+0+1',
                        duration: '5 Days',
                        meal: 'After Meal',
                        instructions: ''
                      })
                      setShowAddFavForm(true)
                    }
                  }}
                >
                  {showAddFavForm ? <X size={13} /> : <Plus size={13} />}
                  {showAddFavForm ? "Cancel Form" : "+ Add Favorite"}
                </button>
                <button 
                  type="button" 
                  className="dr-chip-remove" 
                  onClick={() => { setShowFavoritesModal(false); handleCancelFavForm(); }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            
            <div className="dr-modal-body">
              {/* Add / Edit Favorite Form */}
              {showAddFavForm && (
                <form onSubmit={handleSaveFavorite} className="dr-fav-add-card">
                  <div className="dr-fav-add-title">
                    {editingFavIndex !== null ? (
                      <>
                        <Edit2 size={14} color="#2563eb" /> Edit Favorite Medicine: <strong>{[newFavForm.name, newFavForm.strength, newFavForm.type].filter(Boolean).join(', ') || 'Medicine'}</strong>
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} color="#16a34a" /> Add New Favorite Medicine: <strong>{[newFavForm.name, newFavForm.strength, newFavForm.type].filter(Boolean).join(', ') || 'Medicine'}</strong>
                      </>
                    )}
                  </div>
                  <div className="dr-fav-form-grid">
                    <div className="dr-fav-form-full">
                      <label className="dr-fav-form-label">Medicine Name *</label>
                      <input 
                        type="text"
                        className="dr-input-field"
                        placeholder="e.g. Paracetamol"
                        value={newFavForm.name}
                        onChange={e => setNewFavForm(prev => ({ ...prev, name: e.target.value }))}
                        autoFocus
                        required
                      />
                    </div>

                    <div>
                      <label className="dr-fav-form-label">Type / Form</label>
                      <select 
                        className="dr-select-box"
                        value={newFavForm.type}
                        onChange={e => {
                          const nextType = e.target.value
                          setNewFavForm(prev => ({ 
                            ...prev, 
                            type: nextType,
                            dose: (!prev.dose || prev.dose.startsWith('1 ')) ? `1 ${nextType}` : prev.dose
                          }))
                        }}
                      >
                        <option value="Tablet">Tablet</option>
                        <option value="Capsule">Capsule</option>
                        <option value="Syrup">Syrup</option>
                        <option value="Suspension">Suspension</option>
                        <option value="Injection">Injection</option>
                        <option value="Drop">Drop</option>
                        <option value="Ointment">Ointment</option>
                        <option value="Sachet">Sachet</option>
                        <option value="Inhaler">Inhaler</option>
                      </select>
                    </div>

                    <div>
                      <label className="dr-fav-form-label">Strength</label>
                      <input 
                        type="text"
                        className="dr-input-field"
                        placeholder="e.g. 500 mg"
                        value={newFavForm.strength}
                        onChange={e => setNewFavForm(prev => ({ ...prev, strength: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="dr-fav-form-label">Dose (মাত্রা / পরিমাণ)</label>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <input 
                          type="text"
                          className="dr-input-field"
                          placeholder="e.g. 1 Tablet, 5 ml, ১টি ট্যাবলেট"
                          value={newFavForm.dose}
                          onChange={e => setNewFavForm(prev => ({ ...prev, dose: e.target.value }))}
                        />
                        <select
                          className="dr-select-box"
                          style={{ width: 44, padding: '0 4px', flexShrink: 0 }}
                          value=""
                          onChange={e => {
                            if (e.target.value) {
                              setNewFavForm(prev => ({ ...prev, dose: e.target.value }))
                            }
                          }}
                          title="Select standard dose preset"
                        >
                          <option value="">▼</option>
                          {(tableLanguage === 'bn' ? DOSE_OPTIONS_BN : DOSE_OPTIONS_EN).map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="dr-fav-form-label">Frequency / Dosage</label>
                      <select 
                        className="dr-select-box"
                        value={matchOptionValue(FREQUENCY_OPTIONS, newFavForm.frequency)}
                        onChange={e => setNewFavForm(prev => ({ ...prev, frequency: e.target.value }))}
                      >
                        {FREQUENCY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="dr-fav-form-label">Duration</label>
                      <select 
                        className="dr-select-box"
                        value={matchOptionValue(DURATION_OPTIONS, newFavForm.duration)}
                        onChange={e => setNewFavForm(prev => ({ ...prev, duration: e.target.value }))}
                      >
                        {DURATION_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="dr-fav-form-label">Meal Instruction</label>
                      <select 
                        className="dr-select-box"
                        value={matchOptionValue(MEAL_OPTIONS, newFavForm.meal)}
                        onChange={e => setNewFavForm(prev => ({ ...prev, meal: e.target.value }))}
                      >
                        {MEAL_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>

                    <div className="dr-fav-form-full">
                      <label className="dr-fav-form-label">Instructions / Notes</label>
                      <input 
                        type="text"
                        className="dr-input-field"
                        placeholder="e.g. If fever or body ache"
                        value={newFavForm.instructions}
                        onChange={e => setNewFavForm(prev => ({ ...prev, instructions: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="dr-fav-form-actions">
                    <button 
                      type="button" 
                      className="dr-btn-white" 
                      onClick={handleCancelFavForm}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="dr-btn-primary">
                      {editingFavIndex !== null ? (
                        <>
                          <Check size={13} /> Update Favorite
                        </>
                      ) : (
                        <>
                          <Star size={13} color="#ffffff" fill="#ffffff" /> Save to Favorites
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* Search Favorite Medicine Bar */}
              <div className="dr-med-search-bar" style={{ margin: '4px 0 12px' }}>
                <Search size={14} color="#94a3b8" />
                <input 
                  type="text"
                  className="dr-med-search-input"
                  placeholder="Search favorite medicines by name, type, dose, notes..."
                  value={favSearchQuery}
                  onChange={e => setFavSearchQuery(e.target.value)}
                />
                {favSearchQuery && (
                  <button 
                    type="button" 
                    className="dr-chip-remove" 
                    onClick={() => setFavSearchQuery('')}
                    title="Clear search"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Filtered Favorites Grid or Empty States */}
              {(() => {
                const q = favSearchQuery.toLowerCase().trim()
                const filtered = favoriteMedicines
                  .map((fav, originalIndex) => ({ fav, originalIndex }))
                  .filter(({ fav }) => {
                    if (!q) return true
                    return (
                      (fav.name || '').toLowerCase().includes(q) ||
                      (fav.type || '').toLowerCase().includes(q) ||
                      (fav.strength || '').toLowerCase().includes(q) ||
                      (fav.frequency || '').toLowerCase().includes(q) ||
                      (fav.duration || '').toLowerCase().includes(q) ||
                      (fav.meal || '').toLowerCase().includes(q) ||
                      (fav.instructions || '').toLowerCase().includes(q)
                    )
                  })

                if (favoriteMedicines.length === 0) {
                  return (
                    <div style={{ textAlign: 'center', padding: '30px 20px', background: '#f8fafc', borderRadius: 8, border: '1px dashed #cbd5e1' }}>
                      <Star size={28} color="#94a3b8" style={{ marginBottom: 8 }} />
                      <p style={{ margin: 0, fontWeight: 600, color: '#475569', fontSize: 14 }}>No favorite medicines saved</p>
                      <p style={{ margin: '4px 0 12px', fontSize: 12, color: '#94a3b8' }}>
                        Click "+ Add Favorite" above or click the star icon in your prescription table to save favorites.
                      </p>
                      <button 
                        type="button" 
                        className="dr-btn-primary" 
                        onClick={() => {
                          setEditingFavIndex(null)
                          setShowAddFavForm(true)
                        }}
                      >
                        <Plus size={13} /> Add First Favorite
                      </button>
                    </div>
                  )
                }

                if (filtered.length === 0) {
                  return (
                    <div style={{ textAlign: 'center', padding: '24px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                      <Search size={22} color="#94a3b8" style={{ marginBottom: 6 }} />
                      <p style={{ margin: 0, fontWeight: 600, color: '#475569', fontSize: 13 }}>No favorites found matching "{favSearchQuery}"</p>
                      <button 
                        type="button" 
                        className="dr-sidebar-link-btn" 
                        style={{ marginTop: 6 }}
                        onClick={() => setFavSearchQuery('')}
                      >
                        Clear search filter
                      </button>
                    </div>
                  )
                }

                return (
                  <div className="dr-favs-picker-grid">
                    {filtered.map(({ fav, originalIndex }) => (
                      <div key={originalIndex} className="dr-fav-card" onClick={() => addFavoriteMedicine(fav)}>
                        <div className="dr-fav-title-row">
                          <strong>{[fav.name, fav.strength, fav.type].filter(Boolean).join(', ')}</strong>
                          <div className="dr-fav-card-right">
                            <span className="dr-badge-type">{fav.type}</span>
                            <button 
                              type="button" 
                              className="dr-fav-action-btn dr-fav-edit-btn" 
                              onClick={(e) => handleStartEditFavorite(e, fav, originalIndex)}
                              title="Edit favorite medicine"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button 
                              type="button" 
                              className="dr-fav-action-btn dr-fav-delete-btn" 
                              onClick={(e) => deleteFavoriteItem(e, originalIndex)}
                              title="Remove from favorites"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                        <div className="dr-fav-meta">
                          {fav.dose ? <span style={{ fontWeight: 600, color: '#1e293b' }}>{fav.dose}</span> : null}
                          {fav.dose ? ' • ' : ''}{fav.frequency} • {fav.duration}
                        </div>
                        <div className="dr-fav-note">
                          {fav.meal} {fav.instructions ? `(${fav.instructions})` : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 3.5: ASSIGN / EDIT PATIENT AGE & GENDER MODAL
          ======================================================== */}
      {showAssignAgeModal && (
        <div className="dr-modal-backdrop" onClick={() => setShowAssignAgeModal(false)}>
          <div className="dr-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="dr-modal-header">
              <div className="dr-modal-title">
                <Calendar size={18} color="#2563eb" /> Assign / Update Patient Age
              </div>
              <button type="button" className="dr-chip-remove" onClick={() => setShowAssignAgeModal(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveAssignAge}>
              <div className="dr-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
                  Assign the patient's age in years and gender. This will synchronize with the appointment record and prescription.
                </p>

                <div>
                  <label className="dr-fav-form-label" style={{ fontWeight: 600, color: '#334155', marginBottom: 4, display: 'block' }}>
                    Age (in Years) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="150"
                    className="dr-input-field"
                    placeholder="e.g. 28"
                    value={editAgeInput}
                    onChange={e => handleEditAgeChange(e.target.value)}
                    autoFocus
                    required
                    style={{ fontSize: 15, fontWeight: 600, padding: '8px 12px' }}
                  />
                  <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                    {['18', '25', '35', '45', '60'].map(val => (
                      <button
                        key={val}
                        type="button"
                        className="dr-kbd-btn"
                        style={{ padding: '2px 8px', fontSize: 11, background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 4, cursor: 'pointer' }}
                        onClick={() => handleEditAgeChange(val)}
                      >
                        {val} Y
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="dr-fav-form-label" style={{ fontWeight: 600, color: '#334155', marginBottom: 4, display: 'block' }}>
                      Gender / Sex
                    </label>
                    <select
                      className="dr-select-box"
                      value={editSexInput}
                      onChange={e => setEditSexInput(e.target.value)}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="dr-fav-form-label" style={{ fontWeight: 600, color: '#334155', marginBottom: 4, display: 'block' }}>
                      Date of Birth (Optional)
                    </label>
                    <input
                      type="date"
                      className="dr-input-field"
                      max={new Date().toISOString().split('T')[0]}
                      value={editDobInput}
                      onChange={handleEditDobChange}
                    />
                  </div>
                </div>
              </div>

              <div className="dr-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '12px 16px', borderTop: '1px solid #e2e8f0' }}>
                <button
                  type="button"
                  className="dr-btn-white"
                  onClick={() => setShowAssignAgeModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="dr-btn-primary">
                  <Check size={14} /> Save Age
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 4: PATIENT PROFILE & HISTORY DRAWER
          ======================================================== */}
      {showProfileModal && (
        <div className="dr-modal-backdrop" onClick={() => setShowProfileModal(false)}>
          <div className="dr-modal-card" onClick={e => e.stopPropagation()}>
            <div className="dr-modal-header">
              <div className="dr-modal-title">
                <User size={18} color="#2563eb" /> Patient Medical Profile
              </div>
              <button type="button" className="dr-chip-remove" onClick={() => setShowProfileModal(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="dr-modal-body">
              <div className="dr-patient-profile-full">
                <div className="dr-profile-avatar-large">
                  {patientName.charAt(0)}
                </div>
                <div>
                  <h3 style={{ margin: '0 0 4px', fontSize: 16 }}>{patientName}</h3>
                  <div style={{ fontSize: 12, color: '#64748b' }}>Patient ID: {patientId}</div>
                  <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>
                    {patientAge} Y • {patientSex} • Blood Group: O+ve
                  </div>
                </div>
              </div>

              <div className="dr-profile-details-grid">
                <div className="dr-detail-item">
                  <span className="dr-meta-label">Contact Phone</span>
                  <span className="dr-meta-value">{patientPhone}</span>
                </div>
                <div className="dr-detail-item">
                  <span className="dr-meta-label">Home Address</span>
                  <span className="dr-meta-value">{patientAddress}</span>
                </div>
                <div className="dr-detail-item">
                  <span className="dr-meta-label">Known Allergies</span>
                  <span className="dr-meta-value" style={{ color: '#dc2626' }}>Penicillin, Aspirin</span>
                </div>
                <div className="dr-detail-item">
                  <span className="dr-meta-label">Past Medical History</span>
                  <span className="dr-meta-value">Non-diabetic, non-hypertensive</span>
                </div>
              </div>
            </div>
            <div className="dr-modal-footer">
              <button 
                type="button" 
                className="dr-btn-primary" 
                onClick={() => {
                  setShowProfileModal(false)
                  if (appointmentInfo?.patient?.id) navigate(`/admin/patients/${appointmentInfo.patient.id}`)
                }}
              >
                Open Full Patient Record →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 5: VITALS EDITOR MODAL
          ======================================================== */}
      {showVitalsModal && (
        <div className="dr-modal-backdrop" onClick={() => setShowVitalsModal(false)}>
          <div className="dr-modal-card" onClick={e => e.stopPropagation()}>
            <div className="dr-modal-header">
              <div className="dr-modal-title">
                <Activity size={18} color="#2563eb" /> Edit Patient Vitals
              </div>
              <button type="button" className="dr-chip-remove" onClick={() => setShowVitalsModal(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveVitals}>
              <div className="dr-modal-body">
                <div className="dr-vitals-form-grid">
                  <div>
                    <label className="dr-form-label">BP (Systolic / Diastolic)</label>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <input
                        type="number"
                        className="dr-input-field"
                        placeholder="120"
                        value={vitals.bp_systolic}
                        onChange={e => setVitals({ ...vitals, bp_systolic: e.target.value })}
                      />
                      <span>/</span>
                      <input
                        type="number"
                        className="dr-input-field"
                        placeholder="80"
                        value={vitals.bp_diastolic}
                        onChange={e => setVitals({ ...vitals, bp_diastolic: e.target.value })}
                      />
                      <span style={{ fontSize: 12, color: '#64748b' }}>mmHg</span>
                    </div>
                  </div>

                  <div>
                    <label className="dr-form-label">Pulse Rate</label>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <input
                        type="number"
                        className="dr-input-field"
                        placeholder="72"
                        value={vitals.pulse}
                        onChange={e => setVitals({ ...vitals, pulse: e.target.value })}
                      />
                      <span style={{ fontSize: 12, color: '#64748b' }}>bpm</span>
                    </div>
                  </div>

                  <div>
                    <label className="dr-form-label">Body Temperature</label>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <input
                        type="text"
                        className="dr-input-field"
                        placeholder="98.6"
                        value={vitals.temp}
                        onChange={e => setVitals({ ...vitals, temp: e.target.value })}
                      />
                      <span style={{ fontSize: 12, color: '#64748b' }}>°F</span>
                    </div>
                  </div>

                  <div>
                    <label className="dr-form-label">Weight</label>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <input
                        type="number"
                        className="dr-input-field"
                        placeholder="68"
                        value={vitals.weight}
                        onChange={e => setVitals({ ...vitals, weight: e.target.value })}
                      />
                      <span style={{ fontSize: 12, color: '#64748b' }}>kg</span>
                    </div>
                  </div>

                  <div>
                    <label className="dr-form-label">Height</label>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <input
                        type="text"
                        className="dr-input-field"
                        placeholder="5.6"
                        value={vitals.height_ft}
                        onChange={e => setVitals({ ...vitals, height_ft: e.target.value })}
                      />
                      <span style={{ fontSize: 12, color: '#64748b' }}>ft</span>
                    </div>
                  </div>

                  <div>
                    <label className="dr-form-label">Calculated BMI</label>
                    <div className="dr-bmi-badge-display">
                      <strong>{currentBMI.val}</strong>
                      <span className="dr-status-pill">{currentBMI.label}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="dr-modal-footer">
                <button type="button" className="dr-btn-white" onClick={() => setShowVitalsModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="dr-btn-primary">
                  Save Vitals
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ========================================================
          MODAL 6: WALK-IN PATIENT INFO MODAL
          ======================================================== */}
      {showWalkInModal && (
        <div className="dr-modal-backdrop" onClick={() => setShowWalkInModal(false)}>
          <div className="dr-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="dr-modal-header">
              <div className="dr-modal-title">
                <User size={18} color="#2563eb" /> Walk-in Patient Information
              </div>
              <button type="button" className="dr-chip-remove" onClick={() => setShowWalkInModal(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleConfirmWalkInPatient} noValidate>
              <div className="dr-modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  {/* Full Name */}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="dr-form-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span>Full Name</span>
                      <span style={{ color: '#ef4444', fontWeight: 700 }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="dr-input-field"
                      style={{
                        borderColor: walkInErrors.name ? '#ef4444' : undefined,
                        boxShadow: walkInErrors.name ? '0 0 0 1px #ef4444' : undefined
                      }}
                      placeholder="e.g. Md. Arifur Rahman"
                      value={walkInForm.name}
                      onChange={e => {
                        setWalkInForm(prev => ({ ...prev, name: e.target.value }))
                        if (walkInErrors.name) setWalkInErrors(prev => ({ ...prev, name: null }))
                      }}
                      autoFocus
                    />
                    {walkInErrors.name && (
                      <div style={{ color: '#ef4444', fontSize: '11.5px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                        <AlertCircle size={12} style={{ flexShrink: 0 }} />
                        <span>{walkInErrors.name}</span>
                      </div>
                    )}
                  </div>

                  {/* Age */}
                  <div>
                    <label className="dr-form-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span>Age (years)</span>
                      <span style={{ color: '#ef4444', fontWeight: 700 }}>*</span>
                    </label>
                    <input
                      type="number"
                      className="dr-input-field"
                      style={{
                        borderColor: walkInErrors.age ? '#ef4444' : undefined,
                        boxShadow: walkInErrors.age ? '0 0 0 1px #ef4444' : undefined
                      }}
                      placeholder="e.g. 35"
                      min="0"
                      max="150"
                      value={walkInForm.age}
                      onChange={e => {
                        setWalkInForm(prev => ({ ...prev, age: e.target.value }))
                        if (walkInErrors.age) setWalkInErrors(prev => ({ ...prev, age: null }))
                      }}
                    />
                    {walkInErrors.age && (
                      <div style={{ color: '#ef4444', fontSize: '11.5px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                        <AlertCircle size={12} style={{ flexShrink: 0 }} />
                        <span>{walkInErrors.age}</span>
                      </div>
                    )}
                  </div>

                  {/* Sex */}
                  <div>
                    <label className="dr-form-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span>Sex</span>
                      <span style={{ color: '#ef4444', fontWeight: 700 }}>*</span>
                    </label>
                    <select
                      className="dr-input-field"
                      value={walkInForm.sex}
                      onChange={e => setWalkInForm(prev => ({ ...prev, sex: e.target.value }))}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="dr-form-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span>Phone Number</span>
                      <span style={{ color: '#ef4444', fontWeight: 700 }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="dr-input-field"
                      style={{
                        borderColor: walkInErrors.phone ? '#ef4444' : undefined,
                        boxShadow: walkInErrors.phone ? '0 0 0 1px #ef4444' : undefined
                      }}
                      placeholder="e.g. 01712-345678"
                      value={walkInForm.phone}
                      onChange={e => {
                        setWalkInForm(prev => ({ ...prev, phone: e.target.value }))
                        if (walkInErrors.phone) setWalkInErrors(prev => ({ ...prev, phone: null }))
                      }}
                    />
                    {walkInErrors.phone && (
                      <div style={{ color: '#ef4444', fontSize: '11.5px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                        <AlertCircle size={12} style={{ flexShrink: 0 }} />
                        <span>{walkInErrors.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Registration No */}
                  <div>
                    <label className="dr-form-label">Reg. / ID (optional)</label>
                    <input
                      type="text"
                      className="dr-input-field"
                      placeholder="e.g. PT-2405-0001"
                      value={walkInForm.registration_no}
                      onChange={e => setWalkInForm(prev => ({ ...prev, registration_no: e.target.value }))}
                    />
                  </div>

                  {/* Doctor's Chamber */}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="dr-form-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={13} color="#2563eb" />
                      <span>Doctor's Chamber</span>
                      <span style={{ color: '#ef4444', fontWeight: 700 }}>*</span>
                    </label>
                    <select
                      className="dr-input-field"
                      style={{
                        borderColor: walkInErrors.chamber_id ? '#ef4444' : undefined,
                        boxShadow: walkInErrors.chamber_id ? '0 0 0 1px #ef4444' : undefined
                      }}
                      value={walkInForm.chamber_id || ''}
                      onChange={e => {
                        const selectedId = e.target.value
                        handleSelectChamber(selectedId)
                        if (walkInErrors.chamber_id) setWalkInErrors(prev => ({ ...prev, chamber_id: null }))
                      }}
                    >
                      {doctorChambers.length === 0 ? (
                        <option value="">{loadingChambers ? 'চেম্বার লোড হচ্ছে...' : 'কোনো চেম্বার পাওয়া যায়নি (ডিফল্ট চেম্বার)'}</option>
                      ) : (
                        <>
                          <option value="">-- চেম্বার নির্বাচন করুন (Select Chamber) --</option>
                          {doctorChambers.map(c => {
                            const cid = c.id || c.public_id
                            const hosp = c.hospital?.name || c.hospital_name || c.chamber_name || 'Chamber'
                            const room = c.room_number ? ` • Room ${c.room_number}` : ''
                            const day = c.day ? ` (${c.day})` : ''
                            const time = c.formatted_time || c.start_time_formatted ? ` [${c.formatted_time || c.start_time_formatted}]` : ''
                            return (
                              <option key={cid} value={cid}>
                                {hosp}{room}{day}{time}
                              </option>
                            )
                          })}
                        </>
                      )}
                    </select>
                    {walkInErrors.chamber_id && (
                      <div style={{ color: '#ef4444', fontSize: '11.5px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                        <AlertCircle size={12} style={{ flexShrink: 0 }} />
                        <span>{walkInErrors.chamber_id}</span>
                      </div>
                    )}
                  </div>

                  {/* Address */}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="dr-form-label">Address</label>
                    <input
                      type="text"
                      className="dr-input-field"
                      placeholder="e.g. Dhanmondi, Dhaka"
                      value={walkInForm.address}
                      onChange={e => setWalkInForm(prev => ({ ...prev, address: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
              <div className="dr-modal-footer">
                <button type="button" className="dr-btn-white" onClick={() => {
                  setWalkInErrors({})
                  setShowWalkInModal(false)
                }} disabled={isCheckingWalkInPhone}>
                  Cancel
                </button>
                <button type="submit" className="dr-btn-primary" disabled={isCheckingWalkInPhone}>
                  {isCheckingWalkInPhone ? (
                    <><RefreshCw size={14} className="dr-spin" /> Checking...</>
                  ) : (
                    <><User size={14} /> Confirm Patient</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 7: QUICK MEDICINE BUNDLE BUILDER
          ======================================================== */}
      {showBundleModal && (
        <div className="dr-modal-backdrop" onClick={() => setShowBundleModal(false)}>
          <div className="dr-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 650 }}>
            <div className="dr-modal-header">
              <div className="dr-modal-title">
                <Zap size={18} color="#2563eb" /> {editingBundleIndex !== null ? 'Edit Medicine Bundle' : 'Create New Medicine Bundle'}
              </div>
              <button type="button" className="dr-chip-remove" onClick={() => setShowBundleModal(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveBundleForm}>
              <div className="dr-modal-body">
                <div>
                  <label className="dr-form-label">Bundle Title / Pack Name *</label>
                  <input
                    type="text"
                    className="dr-input-field"
                    placeholder="e.g. Typhoid Treatment Pack, Fever & Cough Combo"
                    value={bundleForm.title}
                    onChange={e => setBundleForm(prev => ({ ...prev, title: e.target.value }))}
                    autoFocus
                    required
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <label className="dr-form-label" style={{ margin: 0 }}>Medicines in this Bundle ({bundleForm.meds.length})</label>
                    <button
                      type="button"
                      className="dr-btn-blue-outline-sm"
                      onClick={handleAddMedicineToBundleForm}
                    >
                      <Plus size={12} /> Add Medicine Row
                    </button>
                  </div>

                  <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                    {bundleForm.meds.map((bMed, bIdx) => (
                      <div key={bIdx} className="dr-bundle-med-row">
                        <div>
                          <input
                            type="text"
                            className="dr-input-field"
                            placeholder="Medicine Name (e.g. Paracetamol)"
                            value={bMed.medicine_name}
                            onChange={e => handleBundleMedFieldChange(bIdx, 'medicine_name', e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <select
                            className="dr-select-box"
                            value={matchOptionValue(FREQUENCY_OPTIONS, bMed.frequency)}
                            onChange={e => handleBundleMedFieldChange(bIdx, 'frequency', e.target.value)}
                          >
                            {FREQUENCY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        </div>
                        <div>
                          <select
                            className="dr-select-box"
                            value={matchOptionValue(DURATION_OPTIONS, bMed.duration)}
                            onChange={e => handleBundleMedFieldChange(bIdx, 'duration', e.target.value)}
                          >
                            {DURATION_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        </div>
                        <div>
                          <select
                            className="dr-select-box"
                            value={matchOptionValue(MEAL_OPTIONS, bMed.meal)}
                            onChange={e => handleBundleMedFieldChange(bIdx, 'meal', e.target.value)}
                          >
                            {MEAL_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        </div>
                        <div>
                          <button
                            type="button"
                            className="dr-fav-action-btn dr-fav-delete-btn"
                            onClick={() => handleRemoveMedicineFromBundleForm(bIdx)}
                            disabled={bundleForm.meds.length <= 1}
                            title="Remove Medicine Row"
                            style={{ opacity: bundleForm.meds.length <= 1 ? 0.4 : 1 }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="dr-modal-footer">
                <button type="button" className="dr-btn-white" onClick={() => setShowBundleModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="dr-btn-primary">
                  <Zap size={14} /> {editingBundleIndex !== null ? 'Update Bundle' : 'Save Bundle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Historical Prescription Read-Only Preview Modal */}
      {showHistoryModal && historyModalRx && (
        <div className="dr-modal-backdrop" onClick={() => setShowHistoryModal(false)}>
          <div 
            className="dr-modal-card" 
            style={{ maxWidth: 750, width: '95%', maxHeight: '90vh', overflowY: 'auto' }} 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dr-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
              <div>
                <div className="dr-modal-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <History size={16} color="#2563eb" /> Prescription #{historyModalRx.public_id || historyModalRx.id} (Medical Record)
                </div>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>
                  {historyModalRx.visited_at ? `Visited on ${new Date(historyModalRx.visited_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}` : ''} 
                  {historyModalRx.visiting_time_display ? ` at ${historyModalRx.visiting_time_display}` : ''} • Visit No: {historyModalRx.visit_no}
                </p>
              </div>
              <button 
                type="button" 
                className="dr-chip-remove"
                onClick={() => setShowHistoryModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '16px 0' }}>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, marginBottom: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, fontSize: 12 }}>
                  <div><span style={{ color: '#64748b' }}>Doctor:</span> <strong>{historyModalRx.doctor_name}</strong></div>
                  <div><span style={{ color: '#64748b' }}>Diagnosis:</span> <strong>{historyModalRx.diagnosis || '—'}</strong></div>
                  <div><span style={{ color: '#64748b' }}>Visit Number:</span> <strong>{historyModalRx.visit_no}</strong></div>
                  <div><span style={{ color: '#64748b' }}>Record Status:</span> <strong style={{ textTransform: 'capitalize', color: '#0d9488' }}>{historyModalRx.status} (Locked / Immutable)</strong></div>
                </div>
              </div>

              {historyModalRx.medicines && historyModalRx.medicines.length > 0 && (
                <div>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 8 }}>Prescribed Medicines ({historyModalRx.medicines.length}):</h4>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                        <th style={{ padding: '6px 8px', border: '1px solid #e2e8f0' }}>#</th>
                        <th style={{ padding: '6px 8px', border: '1px solid #e2e8f0' }}>Medicine Name</th>
                        <th style={{ padding: '6px 8px', border: '1px solid #e2e8f0' }}>Dosage</th>
                        <th style={{ padding: '6px 8px', border: '1px solid #e2e8f0' }}>Duration</th>
                        <th style={{ padding: '6px 8px', border: '1px solid #e2e8f0' }}>Instructions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyModalRx.medicines.map((m, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '6px 8px', border: '1px solid #e2e8f0', width: 30 }}>{i + 1}</td>
                          <td style={{ padding: '6px 8px', border: '1px solid #e2e8f0', fontWeight: 600 }}>{m.medicine_name}</td>
                          <td style={{ padding: '6px 8px', border: '1px solid #e2e8f0' }}>{m.dosage || '—'}</td>
                          <td style={{ padding: '6px 8px', border: '1px solid #e2e8f0' }}>{m.duration || '—'}</td>
                          <td style={{ padding: '6px 8px', border: '1px solid #e2e8f0', color: '#64748b' }}>{m.instructions || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {historyModalRx.advice && (
                <div style={{ marginTop: 12, fontSize: 12, background: '#faf5ff', border: '1px solid #f3e8ff', borderRadius: 6, padding: 10 }}>
                  <strong style={{ color: '#7e22ce' }}>Advice:</strong>
                  <p style={{ margin: '4px 0 0', whiteSpace: 'pre-line', color: '#334155' }}>{historyModalRx.advice}</p>
                </div>
              )}
            </div>

            <div className="dr-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, borderTop: '1px solid #e2e8f0', paddingTop: 12 }}>
              <button
                type="button"
                className="dr-btn-white"
                onClick={() => setShowHistoryModal(false)}
              >
                Close
              </button>
              <button
                type="button"
                className="dr-btn-primary"
                onClick={() => {
                  handleCopyMedicines(historyModalRx.id || historyModalRx.public_id)
                  setShowHistoryModal(false)
                }}
              >
                <Copy size={13} /> Copy Medicines to Current Rx
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
