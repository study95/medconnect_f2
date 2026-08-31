// PrescriptionFormPage.jsx — Modern Clinical Prescription Workspace (Interactive Markable Sections)
import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom'
import { 
  User, Calendar, Clock, Phone, Activity, Scale, 
  FileText, MapPin, Stethoscope, Pill, AlertCircle, 
  Hash, ArrowLeft, Droplets, Check, ClipboardList, FlaskConical,
  Search, Plus, X, Copy, Trash2, ChevronDown, CheckCircle2,
  AlertTriangle, Star, Zap, BookOpen, History, ExternalLink, HelpCircle,
  Eye, Keyboard, MoreHorizontal, ShieldCheck, Maximize2, Minimize2, Sparkles, HeartPulse,
  Thermometer, BedDouble, AlertOctagon, Share2, Printer, Download, RefreshCw, PenLine
} from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { createPrescription, updatePrescription, getPrescription, getAppointment, searchMedicines } from '../../../api/adminApi'
import { getErrorMessage } from '../../../utils/errorHelper'
import { useDialog } from '../../../hooks/useDialog'
import { DIALOG_MESSAGES } from '../../../utils/dialogMessages'
import PrescriptionPaper from '../../../components/common/PrescriptionPaper'
import '../../../styles/prescription.css'

const STRENGTH_OPTIONS = ['500 mg', '650 mg', '250 mg', '100 mg', '50 mg', '20 mg', '10 mg', '5 mg', '30 mg/5ml', '100 ml', '—']
const DOSE_OPTIONS = ['1 Tablet', '2 Tablets', '0.5 Tablet', '1 Capsule', '5 ml', '10 ml', '1 Sachet', '1 Spoon', '1 Drop', '1 Puff']
const FREQUENCY_OPTIONS = ['1+0+1', '1+1+1', '1+0+0', '0+1+0', '0+0+1', '1+1+1+1', '0+0+0+1', 'SOS', 'PRN']
const DURATION_OPTIONS = ['3 Days', '5 Days', '7 Days', '10 Days', '14 Days', '21 Days', '1 Month', '2 Months', 'Continue']
const MEAL_OPTIONS = ['After Meal', 'Before Meal', 'With Food', 'Empty Stomach', 'As Directed', 'Bedtime']

// Quick Presets for Clinical Tab
const CC_PRESETS = ['Fever', 'Cough', 'Cold / Runny Nose', 'Throat Pain', 'Headache', 'Chest Pain', 'Abdominal Pain', 'Vomiting', 'Loose Stool', 'Body Ache', 'Weakness', 'Shortness of Breath']
const OE_PRESETS = ['Anemia: Absent', 'Jaundice: Absent', 'Cyanosis: Absent', 'Clubbing: Absent', 'Koilonychia: Absent', 'Edema: Absent', 'Dehydration: Mild', 'Throat: Congested', 'Chest: Bilaterally Clear', 'Abdomen: Soft, Non-tender']
const MH_PRESETS = ['HTN (Hypertension)', 'Type 2 Diabetes Mellitus', 'Bronchial Asthma', 'CKD', 'Ischemic Heart Disease', 'Peptic Ulcer Disease', 'Dyslipidemia', 'Thyroid Disorder']

// Categorized Investigations
const INVESTIGATION_CATEGORIES = {
  'Hematology': ['CBC (Complete Blood Count)', 'ESR', 'Peripheral Blood Film (PBF)', 'Platelet Count', 'Blood Group & Rh Type'],
  'Biochemistry': ['Blood Glucose (FBS & 2HABF)', 'HbA1c', 'Serum Creatinine', 'Serum Urea', 'Lipid Profile', 'Serum Bilirubin', 'SGPT / ALT', 'SGOT / AST', 'Serum Electrolytes', 'Serum Uric Acid'],
  'Radiology & Imaging': ['Chest X-Ray (PA View)', 'USG Whole Abdomen', 'USG Lower Abdomen', 'X-Ray Cervical Spine', 'CT Scan Brain', 'MRI Brain'],
  'Cardiology': ['ECG (12 Lead)', 'Echocardiography', 'Exercise Tolerance Test (ETT)'],
  'Microbiology & Others': ['Urine R/E & M/E', 'Urine C/S', 'Stool R/E', 'CRP (C-Reactive Protein)', 'Serum TSH', 'Serum FT4']
}

// Categorized Advice
const ADVICE_CATEGORIES = {
  'General Care': [
    'Drink plenty of fluids (at least 2.5 - 3 liters daily)',
    'Ensure adequate rest and 7-8 hours of sleep',
    'Steam inhalation twice daily for nasal congestion',
    'Gargle with warm saline water 3 times a day',
    'Tepid sponging if body temperature exceeds 101°F'
  ],
  'Dietary Guidelines': [
    'Avoid cold drinks, ice cream, and chilled foods',
    'Avoid oily, spicy, and deep-fried foods',
    'Follow strict diabetic diet (low glycemic index, no refined sugar)',
    'Strict low-salt diet (avoid extra table salt and pickles)',
    'Eat smaller, frequent meals at regular intervals',
    'Drink clean boiled or filtered water'
  ],
  'Activity & Lifestyle': [
    '30 minutes brisk morning walking daily',
    'Avoid heavy weight lifting and strenuous physical exertion',
    'Avoid smoking, tobacco, and exposure to dust/smoke',
    'Do not lie down immediately after dinner (wait at least 1.5 hours)'
  ]
}

// Favorites Medicine List
const FAVORITE_MEDICINES = [
  { name: 'Paracetamol', type: 'Tablet', strength: '500 mg', dose: '1 Tablet', frequency: '1+0+1', duration: '5 Days', meal: 'After Meal', instructions: 'If fever' },
  { name: 'Cetirizine', type: 'Tablet', strength: '10 mg', dose: '1 Tablet', frequency: '0+0+1', duration: '5 Days', meal: 'After Meal', instructions: 'At night' },
  { name: 'Ambroxol', type: 'Syrup', strength: '30 mg/5ml', dose: '5 ml', frequency: '1+0+1', duration: '5 Days', meal: 'After Meal', instructions: 'For cough' },
  { name: 'Esomeprazole', type: 'Capsule', strength: '20 mg', dose: '1 Capsule', frequency: '1+0+1', duration: '14 Days', meal: 'Before Meal', instructions: '30 mins before meal' },
  { name: 'Domperidone', type: 'Tablet', strength: '10 mg', dose: '1 Tablet', frequency: '1+0+1', duration: '7 Days', meal: 'Before Meal', instructions: 'For nausea' },
  { name: 'Metformin', type: 'Tablet', strength: '500 mg', dose: '1 Tablet', frequency: '1+0+1', duration: '1 Month', meal: 'With Food', instructions: 'Regular' },
  { name: 'Amlodipine', type: 'Tablet', strength: '5 mg', dose: '1 Tablet', frequency: '0+0+1', duration: '1 Month', meal: 'After Meal', instructions: 'At night' },
  { name: 'Azithromycin', type: 'Tablet', strength: '500 mg', dose: '1 Tablet', frequency: '1+0+0', duration: '5 Days', meal: 'Before Meal', instructions: '1 hour before food' },
  { name: 'Ciprofloxacin', type: 'Tablet', strength: '500 mg', dose: '1 Tablet', frequency: '1+0+1', duration: '7 Days', meal: 'After Meal', instructions: 'Complete course' },
  { name: 'ORS', type: 'Sachet', strength: '—', dose: '1 Sachet', frequency: '1+1+1', duration: '3 Days', meal: 'After Meal', instructions: 'Mix in 1 glass of water' }
]

// Quick Add Drug Combos
const QUICK_COMBOS = [
  {
    title: 'Fever & Body Ache Pack',
    meds: [
      { medicine_name: 'Paracetamol', type: 'Tablet', strength: '500 mg', dose: '1 Tablet', frequency: '1+1+1', duration: '5 Days', meal: 'After Meal', instructions: 'For body ache & fever' },
      { medicine_name: 'Antacid Plus', type: 'Syrup', strength: '100 ml', dose: '10 ml', frequency: '1+0+1', duration: '5 Days', meal: 'After Meal', instructions: 'For gastric comfort' }
    ]
  },
  {
    title: 'Cold & Cough Pack',
    meds: [
      { medicine_name: 'Cetirizine', type: 'Tablet', strength: '10 mg', dose: '1 Tablet', frequency: '0+0+1', duration: '5 Days', meal: 'After Meal', instructions: 'At night' },
      { medicine_name: 'Ambroxol', type: 'Syrup', strength: '30 mg/5ml', dose: '5 ml', frequency: '1+0+1', duration: '5 Days', meal: 'After Meal', instructions: 'For productive cough' }
    ]
  },
  {
    title: 'Gastric & Nausea Pack',
    meds: [
      { medicine_name: 'Esomeprazole', type: 'Capsule', strength: '20 mg', dose: '1 Capsule', frequency: '1+0+1', duration: '14 Days', meal: 'Before Meal', instructions: '30 mins before food' },
      { medicine_name: 'Domperidone', type: 'Tablet', strength: '10 mg', dose: '1 Tablet', frequency: '1+0+1', duration: '7 Days', meal: 'Before Meal', instructions: 'Before meals' }
    ]
  }
]

const QUICK_TEMPLATES = [
  {
    name: 'Common Cold',
    diagnosis: 'J06.9 - Acute upper respiratory infection, unspecified',
    medicines: [
      { medicine_name: 'Paracetamol', type: 'Tablet', strength: '500 mg', dose: '1 Tablet', frequency: '1+0+1', duration: '5 Days', meal: 'After Meal', instructions: 'If fever' },
      { medicine_name: 'Cetirizine', type: 'Tablet', strength: '10 mg', dose: '1 Tablet', frequency: '0+0+1', duration: '5 Days', meal: 'After Meal', instructions: 'At night' },
      { medicine_name: 'Ambroxol', type: 'Syrup', strength: '30 mg/5ml', dose: '5 ml', frequency: '1+0+1', duration: '5 Days', meal: 'After Meal', instructions: 'For cough' },
      { medicine_name: 'ORS', type: 'Sachet', strength: '—', dose: '1 Sachet', frequency: '1+1+1', duration: '3 Days', meal: 'After Meal', instructions: 'Mix in 1 glass of water' }
    ],
    investigations: ['CBC (Complete Blood Count)', 'CRP (C-Reactive Protein)', 'Chest X-Ray (PA View)'],
    advice: ['Drink plenty of fluids', 'Rest and adequate sleep', 'Avoid cold drinks and oily food', 'Steam inhalation twice daily']
  },
  {
    name: 'Fever',
    diagnosis: 'R50.9 - Fever, unspecified',
    medicines: [
      { medicine_name: 'Paracetamol', type: 'Tablet', strength: '500 mg', dose: '1 Tablet', frequency: '1+1+1', duration: '5 Days', meal: 'After Meal', instructions: 'For body ache & fever' }
    ],
    investigations: ['CBC (Complete Blood Count)', 'Urine R/E'],
    advice: ['Tepid sponging if temperature > 101F', 'Drink oral rehydration solutions']
  },
  {
    name: 'Gastric',
    diagnosis: 'K29.7 - Gastritis, unspecified',
    medicines: [
      { medicine_name: 'Esomeprazole', type: 'Capsule', strength: '20 mg', dose: '1 Capsule', frequency: '1+0+1', duration: '14 Days', meal: 'Before Meal', instructions: '30 mins before breakfast & dinner' },
      { medicine_name: 'Domperidone', type: 'Tablet', strength: '10 mg', dose: '1 Tablet', frequency: '1+0+1', duration: '7 Days', meal: 'Before Meal', instructions: 'For nausea' }
    ],
    investigations: ['USG Whole Abdomen', 'Serum Creatinine'],
    advice: ['Avoid oily, spicy, and deep-fried food', 'Eat smaller frequent meals', 'Do not lie down immediately after eating']
  }
]

const emptyMedicine = () => ({
  _id: Math.random().toString(36).substring(2, 9),
  medicine_name: '',
  type: 'Tablet',
  strength: '500 mg',
  dose: '1 Tablet',
  dosage: '1+0+1',
  duration: '5 Days',
  meal: 'After Meal',
  instructions: ''
})

export default function PrescriptionFormPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const appointmentId = searchParams.get('appointment_id')
  const returnTo = searchParams.get('return_to') || (searchParams.get('from') === 'serial-display' ? '/admin/serial-display' : null) || '/admin/appointments'
  const navigate = useNavigate()
  const { user } = useAuth()
  const { showSuccess, showError } = useDialog()
  const isEdit = !!id

  const [activeTab, setActiveTab] = useState('prescription')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [appointmentInfo, setAppointmentInfo] = useState(null)

  // Modals & Popover States
  const [showShortcutsModal, setShowShortcutsModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [showTemplatesDropdown, setShowTemplatesDropdown] = useState(false)
  const [showMoreDropdown, setShowMoreDropdown] = useState(false)
  const [showFavoritesModal, setShowFavoritesModal] = useState(false)
  const [showQuickAddDropdown, setShowQuickAddDropdown] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showVitalsModal, setShowVitalsModal] = useState(false)
  const [isZenMode, setIsZenMode] = useState(false)

  // Walk-in Patient State — only used when creating prescription directly (no appointment)
  const isWalkIn = !appointmentId && !isEdit
  const [walkInPatientInfo, setWalkInPatientInfo] = useState(null) // null = not filled yet
  const [showWalkInModal, setShowWalkInModal] = useState(false)
  const [walkInForm, setWalkInForm] = useState({
    name: '', age: '', sex: 'Male', phone: '', address: '', registration_no: ''
  })

  // Custom Chips State — doctors can add their own chips per section
  const [customChips, setCustomChips] = useState({ cc: [], oe: [], mh: [], oh: [] })
  const [chipInput, setChipInput] = useState({ cc: '', oe: '', mh: '', oh: '' })
  const [showChipInput, setShowChipInput] = useState({ cc: false, oe: false, mh: false, oh: false })

  // Medicine Table Column Visibility
  const [showStrengthCol, setShowStrengthCol] = useState(false)
  const [showDoseCol, setShowDoseCol] = useState(false)
  const [showColMenu, setShowColMenu] = useState(false)

  const addCustomChip = (section) => {
    const val = chipInput[section].trim()
    if (!val) return
    setCustomChips(prev => ({ ...prev, [section]: [...prev[section], val] }))
    setChipInput(prev => ({ ...prev, [section]: '' }))
    setShowChipInput(prev => ({ ...prev, [section]: false }))
  }

  const removeCustomChip = (section, chip) => {
    setCustomChips(prev => ({ ...prev, [section]: prev[section].filter(c => c !== chip) }))
  }

  // Custom Sections — doctors can add entirely new sections
  const [customSections, setCustomSections] = useState([])
  const [showAddSectionInput, setShowAddSectionInput] = useState(false)
  const [newSectionTitle, setNewSectionTitle] = useState('')

  const addCustomSection = () => {
    const title = newSectionTitle.trim()
    if (!title) return
    const id = `custom_${Date.now()}`
    setCustomSections(prev => [...prev, { id, title, chips: [], text: '', chipInput: '', showChipInput: false }])
    setNewSectionTitle('')
    setShowAddSectionInput(false)
  }

  const removeCustomSection = (id) => {
    setCustomSections(prev => prev.filter(s => s.id !== id))
  }

  const updateCustomSection = (id, field, value) => {
    setCustomSections(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s))
  }

  const addCustomSectionChip = (id) => {
    setCustomSections(prev => prev.map(s => {
      if (s.id !== id) return s
      const val = (s.chipInput || '').trim()
      if (!val) return s
      return { ...s, chips: [...s.chips, val], chipInput: '', showChipInput: false }
    }))
  }

  const removeCustomSectionChip = (id, chip) => {
    setCustomSections(prev => prev.map(s => s.id === id ? { ...s, chips: s.chips.filter(c => c !== chip) } : s))
  }

  const appendCustomSectionChip = (id, chip) => {
    setCustomSections(prev => prev.map(s => s.id === id ? { ...s, text: s.text ? s.text + ', ' + chip : chip } : s))
  }

  // Custom Investigation Sections — same pattern as clinical sections
  const [customInvSections, setCustomInvSections] = useState([])
  const [showAddInvSectionInput, setShowAddInvSectionInput] = useState(false)
  const [newInvSectionTitle, setNewInvSectionTitle] = useState('')

  const addCustomInvSection = () => {
    const title = newInvSectionTitle.trim()
    if (!title) return
    const id = `inv_custom_${Date.now()}`
    setCustomInvSections(prev => [...prev, { id, title, chips: [], chipInput: '', showChipInput: false }])
    setNewInvSectionTitle('')
    setShowAddInvSectionInput(false)
  }

  const removeCustomInvSection = (id) => {
    setCustomInvSections(prev => prev.filter(s => s.id !== id))
  }

  const updateCustomInvSection = (id, field, value) => {
    setCustomInvSections(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s))
  }

  const addCustomInvSectionChip = (id) => {
    setCustomInvSections(prev => prev.map(s => {
      if (s.id !== id) return s
      const val = (s.chipInput || '').trim()
      if (!val) return s
      return { ...s, chips: [...s.chips, val], chipInput: '', showChipInput: false }
    }))
  }

  const removeCustomInvSectionChip = (id, chip) => {
    setCustomInvSections(prev => prev.map(s => s.id === id ? { ...s, chips: s.chips.filter(c => c !== chip) } : s))
  }

  const toggleCustomInvChip = (id, chip) => {
    setCustomInvSections(prev => prev.map(s => {
      if (s.id !== id) return s
      const alreadySelected = (s.selected || []).includes(chip)
      return { ...s, selected: alreadySelected ? s.selected.filter(c => c !== chip) : [...(s.selected || []), chip] }
    }))
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

  // Vitals State
  const [vitals, setVitals] = useState({
    bp_systolic: '120',
    bp_diastolic: '80',
    pulse: '72',
    temp: '98.6',
    weight: '68',
    height_ft: '5.6',
    recorded_at: '26 May 2025'
  })

  const [form, setForm] = useState({
    appointment_id: appointmentId || '',
    diagnosis: 'J06.9 - Acute upper respiratory infection, unspecified',
    advice: 'Drink plenty of fluids\nRest and adequate sleep\nAvoid cold drinks and oily food\nSteam inhalation twice daily',
    follow_up_date: '2025-06-02',
    follow_up_offset: '5 Days',
    cc: 'Fever for 3 days, dry cough and runny nose',
    oe: 'BP: 120/80 mmHg, Pulse: 72 bpm, Temp: 98.6°F, Chest: Bilaterally clear',
    oh: 'No known drug allergies to other NSAIDs',
    mh: 'Non-diabetic, non-hypertensive',
    notes: 'Patient advised to report immediately if breathing difficulty worsens.',
    investigation: 'CBC (Complete Blood Count), CRP (C-Reactive Protein), Chest X-Ray (PA View)',
    age: '25',
    sex: 'Male',
    weight: '68',
    registration_no: 'PT-2405-0145',
    hospital_name: '', hospital_address: '', hospital_phone: '', hospital_email: '',
    chamber_name: '',
    medicines: [
      {
        _id: 'med_1',
        medicine_name: 'Paracetamol',
        type: 'Tablet',
        strength: '500 mg',
        dose: '1 Tablet',
        dosage: '1+0+1',
        duration: '5 Days',
        meal: 'After Meal',
        instructions: 'If fever'
      },
      {
        _id: 'med_2',
        medicine_name: 'Cetirizine',
        type: 'Tablet',
        strength: '10 mg',
        dose: '1 Tablet',
        dosage: '0+0+1',
        duration: '5 Days',
        meal: 'After Meal',
        instructions: 'At night'
      },
      {
        _id: 'med_3',
        medicine_name: 'Ambroxol',
        type: 'Syrup',
        strength: '30 mg/5ml',
        dose: '5 ml',
        dosage: '1+0+1',
        duration: '5 Days',
        meal: 'After Meal',
        instructions: 'For cough'
      },
      {
        _id: 'med_4',
        medicine_name: 'ORS',
        type: 'Sachet',
        strength: '—',
        dose: '1 Sachet',
        dosage: '1+1+1',
        duration: '3 Days',
        meal: 'After Meal',
        instructions: 'Mix in 1 glass of water'
      }
    ]
  })

  // Parsed Investigations & Advice
  const [investigationList, setInvestigationList] = useState([
    'CBC (Complete Blood Count)',
    'CRP (C-Reactive Protein)',
    'Chest X-Ray (PA View)'
  ])

  const [adviceChecklist, setAdviceChecklist] = useState([
    { id: 'adv_1', text: 'Drink plenty of fluids', checked: true },
    { id: 'adv_2', text: 'Rest and adequate sleep', checked: true },
    { id: 'adv_3', text: 'Avoid cold drinks and oily food', checked: true },
    { id: 'adv_4', text: 'Steam inhalation twice daily', checked: true }
  ])

  const [newAdviceInput, setNewAdviceInput] = useState('')
  const [diagnosisSearchInput, setDiagnosisSearchInput] = useState('')
  const [tableSearchFilter, setTableSearchFilter] = useState('')
  const [investigationSearchQuery, setInvestigationSearchQuery] = useState('')

  // Medicine Autocomplete
  const [medicineSuggestions, setMedicineSuggestions] = useState([])
  const [activeMedicineIndex, setActiveMedicineIndex] = useState(null)
  const [highlightedSuggestion, setHighlightedSuggestion] = useState(-1)
  const medicineSearchTimeout = useRef(null)
  const suggestionsRef = useRef(null)
  const medicineInputRefs = useRef([])
  const formRef = useRef(null)

  // Fetch Appointment or Existing Prescription
  useEffect(() => {
    if (isEdit && id) {
      setLoading(true)
      getPrescription(id)
        .then(res => {
          const p = res.data?.data || res.data
          if (p) {
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
              notes: p.notes || '',
              investigation: p.investigation || '',
              age: p.patient_age || p.age || '25',
              sex: p.patient_sex || p.sex || 'Male',
              weight: p.patient_weight || p.weight || '68',
              registration_no: p.registration_no || 'PT-2405-0145',
              hospital_name: p.hospital_name || '',
              hospital_address: p.hospital_address || '',
              hospital_phone: p.hospital_phone || '',
              hospital_email: p.hospital_email || '',
              chamber_name: p.chamber_name || '',
              medicines: Array.isArray(p.medicines) && p.medicines.length > 0 
                ? p.medicines.map(m => ({
                    _id: Math.random().toString(36).substring(2, 9),
                    medicine_name: m.medicine_name || '',
                    type: m.type || 'Tablet',
                    strength: m.strength || '500 mg',
                    dose: m.dose || '1 Tablet',
                    dosage: m.dosage || '1+0+1',
                    duration: m.duration || '5 Days',
                    meal: m.meal || 'After Meal',
                    instructions: m.instructions || ''
                  }))
                : [emptyMedicine()]
            })

            if (p.investigation) {
              setInvestigationList(p.investigation.split(/[\n,]+/).map(s => s.trim()).filter(Boolean))
            }
            if (p.advice) {
              const lines = p.advice.split('\n').map(s => s.replace(/^[•\-\*]\s*/, '').trim()).filter(Boolean)
              setAdviceChecklist(lines.map((l, i) => ({ id: `adv_${i}`, text: l, checked: true })))
            }
            if (p.appointment) {
              setAppointmentInfo(p.appointment)
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
            setForm(prev => ({
              ...prev,
              appointment_id: appointmentId,
              age: a.patient_age || prev.age,
              sex: a.patient_sex || a.patient?.gender || prev.sex,
              weight: a.patient_weight || prev.weight,
              chamber_name: a.chamber?.chamber_name || a.chamber_name || '',
              hospital_name: a.chamber?.hospital?.name || a.hospital_name || ''
            }))
          }
        })
        .catch(() => {})
    }
  }, [id, isEdit, appointmentId])

  // Hotkey support
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault()
        handleSubmit()
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
  }, [form, saving])

  // Close dropdowns on outside click
  useEffect(() => {
    const closeDropdowns = (e) => {
      if (!e.target.closest('.dr-dropdown-container')) {
        setShowTemplatesDropdown(false)
        setShowMoreDropdown(false)
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
    if (!weightNum || !heightFtNum || heightFtNum <= 0) return { val: '24.1', label: 'Normal' }
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

  const handleAddInvestigationPrompt = () => {
    const test = prompt('Enter investigation test name:')
    if (test && test.trim()) {
      if (!investigationList.includes(test.trim())) {
        syncInvestigations([...investigationList, test.trim()])
      }
    }
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

  const handleAppendClinicalTag = (field, tagText) => {
    setForm(prev => {
      const current = prev[field] ? prev[field].trim() : ''
      if (current.includes(tagText)) return prev
      const updated = current ? `${current}, ${tagText}` : tagText
      return { ...prev, [field]: updated }
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
    setForm(prev => ({
      ...prev,
      diagnosis: tpl.diagnosis,
      medicines: tpl.medicines.map(m => ({
        _id: Math.random().toString(36).substring(2, 9),
        medicine_name: m.medicine_name,
        type: m.type || 'Tablet',
        strength: m.strength || '500 mg',
        dose: m.dose || '1 Tablet',
        dosage: m.frequency || '1+0+1',
        duration: m.duration || '5 Days',
        meal: m.meal || 'After Meal',
        instructions: m.instructions || ''
      }))
    }))
    if (tpl.investigations) syncInvestigations(tpl.investigations)
    if (tpl.advice) {
      syncAdvice(tpl.advice.map((adv, i) => ({ id: `adv_${i}`, text: adv, checked: true })))
    }
    setShowTemplatesDropdown(false)
    showSuccess({
      title: 'Template Applied',
      message: `Template "${tpl.name}" loaded successfully.`
    })
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
          dose: fav.dose,
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

  const addQuickCombo = (combo) => {
    setForm(prev => ({
      ...prev,
      medicines: [
        ...prev.medicines.filter(m => m.medicine_name.trim()),
        ...combo.meds.map(m => ({
          _id: Math.random().toString(36).substring(2, 9),
          ...m
        }))
      ]
    }))
    setShowQuickAddDropdown(false)
    showSuccess({ title: 'Combo Added', message: `${combo.title} medicines added.` })
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
    const type = med.type || med.form || 'Tablet'
    const strength = med.strength || '500 mg'

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
    setForm(prev => ({
      ...prev,
      weight: vitals.weight,
      oe: `BP: ${vitals.bp_systolic}/${vitals.bp_diastolic} mmHg, Pulse: ${vitals.pulse} bpm, Temp: ${vitals.temp}°F, Wt: ${vitals.weight} kg, Ht: ${vitals.height_ft} ft (BMI: ${currentBMI.val})`
    }))
    setShowVitalsModal(false)
    showSuccess({ title: 'Vitals Updated', message: 'Patient vitals recorded and synced to examination notes.' })
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
        dosage: m.dosage || m.frequency || '1+0+1',
        duration: m.duration || '5 Days',
        instructions: m.instructions ? `${m.meal ? m.meal + ' - ' : ''}${m.instructions}` : (m.meal || 'After Meal')
      }))

    if (cleanMeds.length === 0) {
      showError({ title: 'Validation Error', message: 'Please prescribe at least one medicine.' })
      return
    }

    setSaving(true)
    const payload = {
      appointment_id: form.appointment_id || undefined,
      diagnosis: form.diagnosis,
      medicines: cleanMeds,
      advice: form.advice,
      follow_up_date: form.follow_up_date || undefined,
      cc: form.cc,
      oe: form.oe,
      oh: form.oh,
      mh: form.mh,
      notes: form.notes,
      investigation: form.investigation,
      age: form.age,
      sex: form.sex,
      weight: form.weight
    }

    try {
      if (isEdit && id) {
        await updatePrescription(id, payload)
        showSuccess({
          title: DIALOG_MESSAGES.UPDATE_SUCCESS.title,
          message: 'Prescription updated successfully.'
        })
        navigate(returnTo)
      } else {
        const res = await createPrescription(payload)
        const newId = res.data?.data?.id || res.data?.id
        showSuccess({
          title: DIALOG_MESSAGES.SAVE_SUCCESS.title,
          message: 'Prescription created successfully.'
        })
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

  const patientName = walkInPatientInfo?.name || appointmentInfo?.patient?.name || appointmentInfo?.patient_name || (form.registration_no ? `Reg: ${form.registration_no}` : 'Patient')
  const patientId = walkInPatientInfo?.registration_no || (appointmentInfo?.patient?.id ? `PT-2405-${String(appointmentInfo.patient.id).padStart(4, '0')}` : 'PT-2405-0145')
  const patientAge = walkInPatientInfo?.age || form.age || '25'
  const patientSex = walkInPatientInfo?.sex || form.sex || 'Male'
  const patientPhone = walkInPatientInfo?.phone || appointmentInfo?.patient?.phone || appointmentInfo?.patient_phone || '—'
  const patientAddress = walkInPatientInfo?.address || appointmentInfo?.patient?.address || '—'

  const formatFollowUpDisplay = (dateStr) => {
    if (!dateStr) return '02 Jun 2025 (Mon)'
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return dateStr
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', weekday: 'short' })
    } catch {
      return dateStr
    }
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
          <h1 className="dr-header-title">{isEdit ? 'Edit Prescription' : 'Prescription'}</h1>
          <span className="dr-status-pill">
            <CheckCircle2 size={13} /> Auto saved 2 sec ago
          </span>
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

          {/* Templates Dropdown Button */}
          <div className="dr-dropdown-container">
            <button 
              type="button" 
              className="dr-btn-white" 
              onClick={(e) => { e.stopPropagation(); setShowTemplatesDropdown(!showTemplatesDropdown); }}
            >
              <FileText size={14} /> Templates <ChevronDown size={12} />
            </button>

            {showTemplatesDropdown && (
              <div className="dr-custom-dropdown-menu">
                <div className="dr-menu-header">Select Clinical Template</div>
                {QUICK_TEMPLATES.map((tpl, i) => (
                  <div key={i} className="dr-menu-item" onClick={() => applyQuickTemplate(tpl)}>
                    <strong>{tpl.name}</strong>
                    <span>{tpl.medicines.length} Medicines • {tpl.diagnosis.split('-')[0]}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* More Actions Dropdown */}
          <div className="dr-dropdown-container">
            <button 
              type="button" 
              className="dr-btn-white"
              onClick={(e) => { e.stopPropagation(); setShowMoreDropdown(!showMoreDropdown); }}
            >
              <MoreHorizontal size={14} /> More
            </button>

            {showMoreDropdown && (
              <div className="dr-custom-dropdown-menu">
                <div className="dr-menu-item" onClick={() => window.print()}>
                  <Printer size={13} /> Print Current Page
                </div>
                <div className="dr-menu-item" onClick={() => {
                  if (confirm('Reset form to initial state?')) {
                    setForm({ ...form, diagnosis: '', advice: '', cc: '', oe: '', mh: '', oh: '', medicines: [emptyMedicine()] })
                  }
                }}>
                  <RefreshCw size={13} /> Reset Form
                </div>
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
              onClick={() => setShowWalkInModal(true)}
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
              <span className="dr-patient-id">ID: {patientId}</span>
            </div>

            <div className="dr-patient-meta-block">
              <div className="dr-meta-item">
                <span>{patientAge} Y, {patientSex}</span>
              </div>
              <div className="dr-meta-item dr-meta-sub">
                <Calendar size={12} /> 12 Jan 1999
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

            <div className="dr-patient-badges-group">
              {/* Walk-in: show edit button instead of View Profile */}
              {isWalkIn && walkInPatientInfo ? (
                <button
                  type="button"
                  className="dr-view-profile-btn"
                  onClick={() => {
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
          <Pill size={15} /> Prescription
        </button>
        <button 
          type="button" 
          className={`dr-tab-btn ${activeTab === 'clinical' ? 'active' : ''}`}
          onClick={() => setActiveTab('clinical')}
        >
          <User size={15} /> Clinical Info
        </button>
        <button 
          type="button" 
          className={`dr-tab-btn ${activeTab === 'investigations' ? 'active' : ''}`}
          onClick={() => setActiveTab('investigations')}
        >
          <FlaskConical size={15} /> Investigation
        </button>
        <button 
          type="button" 
          className={`dr-tab-btn ${activeTab === 'advice' ? 'active' : ''}`}
          onClick={() => setActiveTab('advice')}
        >
          <CheckCircle2 size={15} /> Advice
        </button>
        <button 
          type="button" 
          className={`dr-tab-btn ${activeTab === 'followup' ? 'active' : ''}`}
          onClick={() => setActiveTab('followup')}
        >
          <Calendar size={15} /> Follow Up
        </button>
        <button 
          type="button" 
          className={`dr-tab-btn ${activeTab === 'notes' ? 'active' : ''}`}
          onClick={() => setActiveTab('notes')}
        >
          <FileText size={15} /> Notes
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
                <div className="dr-card-header">
                  <h3 className="dr-section-title">
                    1. Diagnosis (ICD-10)
                  </h3>
                </div>

                <div className="dr-diagnosis-row">
                  <div className="dr-search-box">
                    <Search size={14} />
                    <input
                      type="text"
                      className="dr-input-field"
                      placeholder="Search ICD-10 or Diagnosis"
                      value={diagnosisSearchInput}
                      onChange={(e) => setDiagnosisSearchInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && diagnosisSearchInput.trim()) {
                          e.preventDefault()
                          setForm(prev => ({ ...prev, diagnosis: diagnosisSearchInput.trim() }))
                          setDiagnosisSearchInput('')
                        }
                      }}
                    />
                  </div>

                  {form.diagnosis && (
                    <div className="dr-diagnosis-chip">
                      <span>{form.diagnosis}</span>
                      <button 
                        type="button" 
                        className="dr-chip-remove" 
                        onClick={() => setForm(prev => ({ ...prev, diagnosis: '' }))}
                      >
                        <X size={13} />
                      </button>
                      <ChevronDown size={13} style={{ color: '#94a3b8', marginLeft: 4 }} />
                    </div>
                  )}

                  <button 
                    type="button" 
                    className="dr-btn-blue-outline"
                    onClick={() => {
                      if (diagnosisSearchInput.trim()) {
                        setForm(prev => ({ ...prev, diagnosis: diagnosisSearchInput.trim() }))
                        setDiagnosisSearchInput('')
                      }
                    }}
                  >
                    <Plus size={14} /> Add Diagnosis
                  </button>
                </div>
              </div>

              {/* 2. Medicines Section (Marked Actions Toolbar) */}
              <div className="dr-card dr-section-card">
                <div className="dr-card-header">
                  <h3 className="dr-section-title">2. Medicines</h3>
                  
                  {/* Markable Actions Toolbar in Image */}
                  <div className="dr-header-tool-btns">
                    {/* ★ Favorites Button */}
                    <button 
                      type="button" 
                      className="dr-btn-amber-outline" 
                      onClick={() => setShowFavoritesModal(true)}
                    >
                      <Star size={13} color="#f59e0b" fill="#f59e0b" /> Favorites
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
                        <Zap size={13} color="#2563eb" /> Quick Add <ChevronDown size={12} />
                      </button>

                      {showQuickAddDropdown && (
                        <div className="dr-custom-dropdown-menu">
                          <div className="dr-menu-header">Quick Medicine Bundles</div>
                          {QUICK_COMBOS.map((combo, i) => (
                            <div key={i} className="dr-menu-item" onClick={() => addQuickCombo(combo)}>
                              <strong>{combo.title}</strong>
                              <span>{combo.meds.map(m => m.medicine_name).join(' + ')}</span>
                            </div>
                          ))}
                        </div>
                      )}
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
                        <th style={{ width: 40 }}>#</th>
                        <th style={{ minWidth: 180 }}>Medicine</th>
                        <th style={{ width: 110 }}>Frequency</th>
                        <th style={{ width: 115 }}>Duration</th>
                        <th style={{ width: 145 }}>Meal</th>
                        <th style={{ minWidth: 160 }}>Instruction / Notes</th>
                        <th style={{ width: 65, textAlign: 'center' }}>Action</th>
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
                            <div className="dr-med-input-type" style={{ display: 'none' }}>{med.type || 'Tablet'}</div>

                            {/* Autocomplete Dropdown */}
                            {activeMedicineIndex === index && medicineSuggestions.length > 0 && (
                              <div 
                                className="ecw-suggestions-card" 
                                ref={suggestionsRef} 
                                style={{ top: '100%', left: 0, zIndex: 1000 }}
                              >
                                {medicineSuggestions.map((item, sIdx) => (
                                  <div
                                    key={item.id || sIdx}
                                    className={`ecw-suggestion-item ${highlightedSuggestion === sIdx ? 'selected' : ''}`}
                                    onClick={() => selectMedicine(index, item)}
                                  >
                                    <strong>{item.name || item.medicine_name}</strong>
                                    <span className="ecw-suggestion-meta">
                                      {item.generic_name || item.type || ''} • {item.strength || ''}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>

                          <td>
                            <select 
                              className="dr-select-box"
                              value={med.dosage || '1+0+1'}
                              onChange={(e) => handleMedicineChange(index, 'dosage', e.target.value)}
                            >
                              {FREQUENCY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                          </td>

                          <td>
                            <select 
                              className="dr-select-box"
                              value={med.duration || '5 Days'}
                              onChange={(e) => handleMedicineChange(index, 'duration', e.target.value)}
                            >
                              {DURATION_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                          </td>

                          <td>
                            <select 
                              className="dr-select-box"
                              value={med.meal || 'After Meal'}
                              onChange={(e) => handleMedicineChange(index, 'meal', e.target.value)}
                            >
                              {MEAL_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                          </td>

                          <td>
                            <input
                              type="text"
                              className="dr-input-text-cell"
                              placeholder="e.g. If fever"
                              value={med.instructions || ''}
                              onChange={(e) => handleMedicineChange(index, 'instructions', e.target.value)}
                            />
                          </td>

                          <td>
                            <div className="dr-row-actions">
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
                      <FlaskConical size={14} color="#2563eb" /> Investigations
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
                    {investigationList.map((test, i) => (
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
                    ))}
                  </div>
                </div>

                {/* 4. Advice */}
                <div className="dr-card dr-sub-card">
                  <div className="dr-card-header">
                    <h3 className="dr-section-title">4. Advice</h3>
                    <button type="button" className="dr-btn-blue-outline-sm" onClick={() => setActiveTab('advice')}>
                      <BookOpen size={12} /> Advice Library
                    </button>
                  </div>

                  <div className="dr-advice-checklist">
                    {adviceChecklist.map((item) => (
                      <label key={item.id} className="dr-advice-check-item">
                        <input 
                          type="checkbox" 
                          className="dr-checkbox"
                          checked={item.checked} 
                          onChange={() => handleToggleAdvice(item.id)}
                        />
                        <span>{item.text}</span>
                      </label>
                    ))}
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
                  <h3 className="dr-section-title">6. Notes (Optional)</h3>
                  <textarea
                    className="dr-notes-area"
                    placeholder="Add any additional notes..."
                    value={form.notes || form.mh}
                    onChange={(e) => setForm({ ...form, notes: e.target.value, mh: e.target.value })}
                  />
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
                  {CC_PRESETS.map((tag) => (
                    <button key={tag} type="button" className="dr-chip-btn" onClick={() => handleAppendClinicalTag('cc', tag)}>
                      + {tag}
                    </button>
                  ))}
                  {customChips.cc.map((tag) => (
                    <span key={tag} className="dr-chip-custom">
                      <button type="button" className="dr-chip-btn" onClick={() => handleAppendClinicalTag('cc', tag)}>+ {tag}</button>
                      <button type="button" className="dr-chip-remove-btn" onClick={() => removeCustomChip('cc', tag)} title="Remove">×</button>
                    </span>
                  ))}
                  {showChipInput.cc ? (
                    <span className="dr-chip-input-wrap">
                      <input
                        autoFocus
                        className="dr-chip-input"
                        placeholder="Type & press Enter"
                        value={chipInput.cc}
                        onChange={(e) => setChipInput(prev => ({ ...prev, cc: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomChip('cc') } if (e.key === 'Escape') setShowChipInput(prev => ({ ...prev, cc: false })) }}
                      />
                      <button type="button" className="dr-chip-add-confirm" onClick={() => addCustomChip('cc')}>✓</button>
                    </span>
                  ) : (
                    <button type="button" className="dr-chip-add-btn" onClick={() => setShowChipInput(prev => ({ ...prev, cc: true }))}>+ Add</button>
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
                  {OE_PRESETS.map((tag) => (
                    <button key={tag} type="button" className="dr-chip-btn" onClick={() => handleAppendClinicalTag('oe', tag)}>
                      + {tag}
                    </button>
                  ))}
                  {customChips.oe.map((tag) => (
                    <span key={tag} className="dr-chip-custom">
                      <button type="button" className="dr-chip-btn" onClick={() => handleAppendClinicalTag('oe', tag)}>+ {tag}</button>
                      <button type="button" className="dr-chip-remove-btn" onClick={() => removeCustomChip('oe', tag)} title="Remove">×</button>
                    </span>
                  ))}
                  {showChipInput.oe ? (
                    <span className="dr-chip-input-wrap">
                      <input
                        autoFocus
                        className="dr-chip-input"
                        placeholder="Type & press Enter"
                        value={chipInput.oe}
                        onChange={(e) => setChipInput(prev => ({ ...prev, oe: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomChip('oe') } if (e.key === 'Escape') setShowChipInput(prev => ({ ...prev, oe: false })) }}
                      />
                      <button type="button" className="dr-chip-add-confirm" onClick={() => addCustomChip('oe')}>✓</button>
                    </span>
                  ) : (
                    <button type="button" className="dr-chip-add-btn" onClick={() => setShowChipInput(prev => ({ ...prev, oe: true }))}>+ Add</button>
                  )}
                </div>

                <textarea className="dr-full-textarea" rows={3} placeholder="e.g. BP: 120/80 mmHg, Pulse: 72 bpm, Temp: 98.6°F, Chest: Bilaterally clear with vesicular breath sounds..." value={form.oe} onChange={(e) => setForm({ ...form, oe: e.target.value })} />
              </div>

              <div className="dr-sub-grid">
                <div className="dr-card">
                  <h3 className="dr-section-title">Past Medical History (MH)</h3>
                  {/* MH Chips */}
                  <div className="dr-chips-wrap">
                    {MH_PRESETS.map((tag) => (
                      <button key={tag} type="button" className="dr-chip-btn" onClick={() => handleAppendClinicalTag('mh', tag)}>
                        + {tag}
                      </button>
                    ))}
                    {customChips.mh.map((tag) => (
                      <span key={tag} className="dr-chip-custom">
                        <button type="button" className="dr-chip-btn" onClick={() => handleAppendClinicalTag('mh', tag)}>+ {tag}</button>
                        <button type="button" className="dr-chip-remove-btn" onClick={() => removeCustomChip('mh', tag)} title="Remove">×</button>
                      </span>
                    ))}
                    {showChipInput.mh ? (
                      <span className="dr-chip-input-wrap">
                        <input
                          autoFocus
                          className="dr-chip-input"
                          placeholder="Type & press Enter"
                          value={chipInput.mh}
                          onChange={(e) => setChipInput(prev => ({ ...prev, mh: e.target.value }))}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomChip('mh') } if (e.key === 'Escape') setShowChipInput(prev => ({ ...prev, mh: false })) }}
                        />
                        <button type="button" className="dr-chip-add-confirm" onClick={() => addCustomChip('mh')}>✓</button>
                      </span>
                    ) : (
                      <button type="button" className="dr-chip-add-btn" onClick={() => setShowChipInput(prev => ({ ...prev, mh: true }))}>+ Add</button>
                    )}
                  </div>
                  <textarea className="dr-full-textarea" rows={2} placeholder="e.g. Known hypertensive for 5 years on medication..." value={form.mh} onChange={(e) => setForm({ ...form, mh: e.target.value })} />
                </div>

                <div className="dr-card">
                  <h3 className="dr-section-title">Other History / Family History (OH)</h3>
                  {/* OH Chips */}
                  <div className="dr-chips-wrap">
                    {customChips.oh.map((tag) => (
                      <span key={tag} className="dr-chip-custom">
                        <button type="button" className="dr-chip-btn" onClick={() => handleAppendClinicalTag('oh', tag)}>+ {tag}</button>
                        <button type="button" className="dr-chip-remove-btn" onClick={() => removeCustomChip('oh', tag)} title="Remove">×</button>
                      </span>
                    ))}
                    {showChipInput.oh ? (
                      <span className="dr-chip-input-wrap">
                        <input
                          autoFocus
                          className="dr-chip-input"
                          placeholder="Type & press Enter"
                          value={chipInput.oh}
                          onChange={(e) => setChipInput(prev => ({ ...prev, oh: e.target.value }))}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomChip('oh') } if (e.key === 'Escape') setShowChipInput(prev => ({ ...prev, oh: false })) }}
                        />
                        <button type="button" className="dr-chip-add-confirm" onClick={() => addCustomChip('oh')}>✓</button>
                      </span>
                    ) : (
                      <button type="button" className="dr-chip-add-btn" onClick={() => setShowChipInput(prev => ({ ...prev, oh: true }))}>+ Add</button>
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
                    {sec.chips.map((chip) => (
                      <span key={chip} className="dr-chip-custom">
                        <button type="button" className="dr-chip-btn" onClick={() => appendCustomSectionChip(sec.id, chip)}>+ {chip}</button>
                        <button type="button" className="dr-chip-remove-btn" onClick={() => removeCustomSectionChip(sec.id, chip)} title="Remove">×</button>
                      </span>
                    ))}
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
                    <FlaskConical size={16} color="#2563eb" /> Prescribed Investigations ({investigationList.length})
                  </h3>
                  <button type="button" className="dr-btn-blue-outline-sm" onClick={handleAddInvestigationPrompt}>
                    <Plus size={13} /> Add Custom Test
                  </button>
                </div>

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
                    <BookOpen size={15} color="#64748b" /> Common Diagnostic Tests Library
                  </h3>
                  <div className="dr-search-box" style={{ maxWidth: 260 }}>
                    <Search size={13} />
                    <input
                      type="text"
                      className="dr-input-field"
                      placeholder="Search lab tests..."
                      value={investigationSearchQuery}
                      onChange={(e) => setInvestigationSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                <div className="dr-inv-category-list">
                  {Object.entries(INVESTIGATION_CATEGORIES).map(([catName, tests]) => {
                    const filteredTests = tests.filter(t => 
                      !investigationSearchQuery || t.toLowerCase().includes(investigationSearchQuery.toLowerCase())
                    )
                    const filteredCustom = (catCustomChips[catName] || []).filter(t =>
                      !investigationSearchQuery || t.toLowerCase().includes(investigationSearchQuery.toLowerCase())
                    )
                    if (filteredTests.length === 0 && filteredCustom.length === 0) return null

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
                          {filteredCustom.map(chip => {
                            const isSelected = investigationList.includes(chip)
                            return (
                              <span key={chip} className="dr-chip-custom">
                                <button
                                  type="button"
                                  className={`dr-chip-test-btn ${isSelected ? 'selected' : ''}`}
                                  onClick={() => toggleInvestigationItem(chip)}
                                >
                                  {isSelected ? '✓ ' : '+ '} {chip}
                                </button>
                                <button
                                  type="button"
                                  className="dr-chip-remove-btn"
                                  onClick={() => removeCatCustomChip(catName, chip)}
                                  title="Remove"
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
                    <CheckCircle2 size={16} color="#16a34a" /> Prescribed Advice & Instructions
                  </h3>
                  <span className="dr-helper-text">Items checked below will be printed on the prescription</span>
                </div>

                <div className="dr-advice-checklist-full">
                  {adviceChecklist.map((item) => (
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
                  ))}
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
                </div>
              </div>

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
                  ].map(msg => (
                    <button
                      key={msg}
                      type="button"
                      className="dr-chip-btn"
                      onClick={() => handleAppendClinicalTag('notes', msg)}
                    >
                      + {msg}
                    </button>
                  ))}
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
                    <FileText size={16} color="#2563eb" /> Doctor's Clinical & Confidential Notes
                  </h3>
                  <span className="dr-helper-text">Internal consultation remarks & case summary</span>
                </div>

                <textarea
                  className="dr-full-textarea"
                  rows={6}
                  placeholder="Type any private clinical observations, response to previous treatment, differential diagnosis thoughts, or referral recommendations..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>

              <div className="dr-card">
                <h3 className="dr-section-title">
                  <Sparkles size={15} color="#2563eb" /> Quick Note Snippets
                </h3>
                <div className="dr-chips-wrap">
                  {[
                    'Patient oriented to time, place, and person.',
                    'Vitals stable throughout the consultation.',
                    'Explained warning signs and when to seek emergency care.',
                    'Advised lifestyle modifications and routine exercise.'
                  ].map(snippet => (
                    <button
                      key={snippet}
                      type="button"
                      className="dr-chip-btn"
                      onClick={() => handleAppendClinicalTag('notes', snippet)}
                    >
                      + {snippet}
                    </button>
                  ))}
                </div>
              </div>
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
                  Vitals <span className="dr-vitals-subdate">({vitals.recorded_at})</span>
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
                  <span className="dr-vital-value">{vitals.bp_systolic}/{vitals.bp_diastolic}</span>
                  <div className="dr-vital-unit-row">
                    <span className="dr-vital-unit">mmHg</span>
                    <span className="dr-status-dot-green"></span>
                  </div>
                </div>

                <div className="dr-vital-box" title="Click to edit Pulse">
                  <span className="dr-vital-label">Pulse</span>
                  <span className="dr-vital-value">{vitals.pulse}</span>
                  <div className="dr-vital-unit-row">
                    <span className="dr-vital-unit">bpm</span>
                    <span className="dr-status-dot-green"></span>
                  </div>
                </div>

                <div className="dr-vital-box" title="Click to edit Temp">
                  <span className="dr-vital-label">Temp</span>
                  <span className="dr-vital-value">{vitals.temp}</span>
                  <div className="dr-vital-unit-row">
                    <span className="dr-vital-unit">°F</span>
                    <span className="dr-status-dot-green"></span>
                  </div>
                </div>

                <div className="dr-vital-box" title="Click to edit Weight">
                  <span className="dr-vital-label">Weight</span>
                  <span className="dr-vital-value">{vitals.weight}</span>
                  <div className="dr-vital-unit-row">
                    <span className="dr-vital-unit">kg</span>
                    <span className="dr-status-dot-green"></span>
                  </div>
                </div>

                <div className="dr-vital-box" title="Click to edit Height">
                  <span className="dr-vital-label">Height</span>
                  <span className="dr-vital-value">{vitals.height_ft}</span>
                  <div className="dr-vital-unit-row">
                    <span className="dr-vital-unit">ft</span>
                    <span className="dr-status-dot-green"></span>
                  </div>
                </div>

                <div className="dr-vital-box" title="Calculated BMI">
                  <span className="dr-vital-label">BMI</span>
                  <span className="dr-vital-value">{currentBMI.val}</span>
                  <div className="dr-vital-unit-row">
                    <span className="dr-vital-unit">{currentBMI.label}</span>
                    <span className="dr-status-dot-green"></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Prescriptions */}
            <div className="dr-card dr-sidebar-card">
              <div className="dr-card-header">
                <h4 className="dr-sidebar-card-title">Recent Prescriptions</h4>
                <span className="dr-sidebar-link">View All</span>
              </div>

              <div className="dr-recent-prescriptions-list">
                <div className="dr-recent-row" onClick={() => applyQuickTemplate(QUICK_TEMPLATES[0])} style={{ cursor: 'pointer' }}>
                  <div className="dr-recent-left">
                    <CheckCircle2 size={14} color="#16a34a" />
                    <div>
                      <div className="dr-recent-date">26 May 2025</div>
                      <div className="dr-recent-diag">Fever, Cough, Cold</div>
                    </div>
                  </div>
                  <span className="dr-recent-badge">3 Medicines</span>
                </div>

                <div className="dr-recent-row" onClick={() => applyQuickTemplate(QUICK_TEMPLATES[2])} style={{ cursor: 'pointer' }}>
                  <div className="dr-recent-left">
                    <CheckCircle2 size={14} color="#16a34a" />
                    <div>
                      <div className="dr-recent-date">19 May 2025</div>
                      <div className="dr-recent-diag">Acidity</div>
                    </div>
                  </div>
                  <span className="dr-recent-badge">2 Medicines</span>
                </div>

                <div className="dr-recent-row" onClick={() => applyQuickTemplate(QUICK_TEMPLATES[1])} style={{ cursor: 'pointer' }}>
                  <div className="dr-recent-left">
                    <CheckCircle2 size={14} color="#16a34a" />
                    <div>
                      <div className="dr-recent-date">10 May 2025</div>
                      <div className="dr-recent-diag">Headache</div>
                    </div>
                  </div>
                  <span className="dr-recent-badge">1 Medicine</span>
                </div>
              </div>
            </div>

            {/* Clinical Timeline */}
            <div className="dr-card dr-sidebar-card">
              <div className="dr-card-header">
                <h4 className="dr-sidebar-card-title">Clinical Timeline</h4>
              </div>

              <div className="dr-timeline-list">
                <div className="dr-timeline-item-active">
                  <div className="dr-timeline-dot-active">●</div>
                  <div className="dr-timeline-content">
                    <div className="dr-timeline-date">26 May 2025</div>
                    <div className="dr-timeline-type">Prescription</div>
                    <div className="dr-timeline-diag">Fever, Cough, Cold</div>
                  </div>
                </div>

                <div className="dr-timeline-item">
                  <div className="dr-timeline-dot">○</div>
                  <div className="dr-timeline-content">
                    <div className="dr-timeline-date">26 May 2025</div>
                    <div className="dr-timeline-type">Investigation</div>
                    <div className="dr-timeline-diag">CBC, CRP, X-Ray</div>
                  </div>
                </div>

                <div className="dr-timeline-item">
                  <div className="dr-timeline-dot">○</div>
                  <div className="dr-timeline-content">
                    <div className="dr-timeline-date">10 May 2025</div>
                    <div className="dr-timeline-type">Prescription</div>
                    <div className="dr-timeline-diag">Headache</div>
                  </div>
                </div>

                <div className="dr-timeline-item">
                  <div className="dr-timeline-dot">○</div>
                  <div className="dr-timeline-content">
                    <div className="dr-timeline-date">10 May 2025</div>
                    <div className="dr-timeline-type">Investigation</div>
                    <div className="dr-timeline-diag">Blood Sugar (F)</div>
                  </div>
                </div>
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
            <button type="button" className="dr-dock-btn-white" onClick={handleSubmit}>
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
              <FileText size={15} /> 
              <span>{saving ? 'Saving...' : 'Save & Print'}</span>
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
          <div className="dr-modal-card dr-preview-modal-card" onClick={e => e.stopPropagation()}>
            <div className="dr-modal-header">
              <div className="dr-modal-title">
                <Eye size={18} color="#2563eb" /> Live Prescription Preview
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button type="button" className="dr-btn-primary" onClick={() => window.print()}>
                  <Printer size={14} /> Print Now
                </button>
                <button type="button" className="dr-chip-remove" onClick={() => setShowPreviewModal(false)}>
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="dr-modal-body dr-preview-body">
              <PrescriptionPaper 
                prescription={{
                  ...form,
                  id: id || 'preview',
                  medicines: form.medicines.filter(m => m.medicine_name.trim()),
                  patient_name: patientName,
                  patient_age: patientAge,
                  patient_sex: patientSex,
                  patient_phone: patientPhone,
                  registration_no: patientId,
                  created_at: new Date().toISOString()
                }}
                isPrintMode={false}
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 3: FAVORITES MEDICINE PICKER
          ======================================================== */}
      {showFavoritesModal && (
        <div className="dr-modal-backdrop" onClick={() => setShowFavoritesModal(false)}>
          <div className="dr-modal-card" onClick={e => e.stopPropagation()}>
            <div className="dr-modal-header">
              <div className="dr-modal-title">
                <Star size={18} color="#f59e0b" fill="#f59e0b" /> Doctor's Favorite Medicines
              </div>
              <button type="button" className="dr-chip-remove" onClick={() => setShowFavoritesModal(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="dr-modal-body">
              <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 12px' }}>
                Click on any favorite medicine to instantly add it to your prescription table:
              </p>
              <div className="dr-favs-picker-grid">
                {FAVORITE_MEDICINES.map((fav, i) => (
                  <div key={i} className="dr-fav-card" onClick={() => addFavoriteMedicine(fav)}>
                    <div className="dr-fav-title-row">
                      <strong>{fav.name}</strong>
                      <span className="dr-badge-type">{fav.type}</span>
                    </div>
                    <div className="dr-fav-meta">
                      {fav.strength} • {fav.frequency} • {fav.duration}
                    </div>
                    <div className="dr-fav-note">{fav.meal} ({fav.instructions})</div>
                  </div>
                ))}
              </div>
            </div>
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
            <form onSubmit={(e) => {
              e.preventDefault()
              const info = { ...walkInForm }
              setWalkInPatientInfo(info)
              // Sync age & sex to main form
              setForm(prev => ({
                ...prev,
                age: info.age || prev.age,
                sex: info.sex || prev.sex,
                registration_no: info.registration_no || prev.registration_no
              }))
              setShowWalkInModal(false)
            }}>
              <div className="dr-modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  {/* Full Name */}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="dr-form-label">Full Name</label>
                    <input
                      type="text"
                      className="dr-input-field"
                      placeholder="e.g. Md. Arifur Rahman"
                      value={walkInForm.name}
                      onChange={e => setWalkInForm(prev => ({ ...prev, name: e.target.value }))}
                      autoFocus
                    />
                  </div>

                  {/* Age */}
                  <div>
                    <label className="dr-form-label">Age (years)</label>
                    <input
                      type="number"
                      className="dr-input-field"
                      placeholder="e.g. 35"
                      min="0"
                      max="150"
                      value={walkInForm.age}
                      onChange={e => setWalkInForm(prev => ({ ...prev, age: e.target.value }))}
                    />
                  </div>

                  {/* Sex */}
                  <div>
                    <label className="dr-form-label">Sex</label>
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
                    <label className="dr-form-label">Phone Number</label>
                    <input
                      type="text"
                      className="dr-input-field"
                      placeholder="e.g. 01712-345678"
                      value={walkInForm.phone}
                      onChange={e => setWalkInForm(prev => ({ ...prev, phone: e.target.value }))}
                    />
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
                <button type="button" className="dr-btn-white" onClick={() => setShowWalkInModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="dr-btn-primary">
                  <User size={14} /> Confirm Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
