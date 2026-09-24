import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  getAdminPlans,
  createAdminPlan,
  updateAdminPlan,
  deleteAdminPlan,
  getFeatureMatrix,
  updateFeatureMatrix,
} from '../../../api/billingAdminApi'
import {
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Shield,
  RefreshCw,
  Search,
  Building2,
  Stethoscope,
  Grid,
  Table as TableIcon,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Layers,
  Users,
  CreditCard,
  Receipt,
  FileText,
  Tag,
  Settings,
  HelpCircle,
} from 'lucide-react'
import '../../../styles/admin-billing-plans.css'

// ─── STANDARD SYSTEM FEATURES CATALOG ───
export const STANDARD_FEATURES = {
  doctor: [
    {
      key: 'eprescription',
      nameBn: 'ডিজিটাল প্রেসক্রিপশন তৈরি',
      nameEn: 'Digital Prescriptions',
      unit: 'টি প্রেসক্রিপশন / মাস',
      defaultReset: 'monthly',
      desc: 'প্রতি মাসে ডাক্তার সর্বোচ্চ কতগুলো ডিজিটাল প্রেসক্রিপশন তৈরি করতে পারবেন',
      defaultLimit: 200,
    },
    {
      key: 'max_chambers',
      nameBn: 'চেম্বার সংখ্যা (ক্যাপাসিটি)',
      nameEn: 'Practice Chambers',
      unit: 'টি চেম্বার',
      defaultReset: 'never',
      desc: 'ডাক্তারের প্রোফাইলে সর্বোচ্চ কতটি প্র্যাকটিস চেম্বার বা লোকেশন যুক্ত করা যাবে',
      defaultLimit: 2,
    },
    {
      key: 'live_queue',
      nameBn: 'দৈনিক অ্যাপয়েন্টমেন্ট ও লাইভ কিউ',
      nameEn: 'Live Calling Queue',
      unit: 'রোগী / দিন',
      defaultReset: 'never',
      desc: 'চেম্বারের লাইভ সিরিয়াল কলিং, টিভি ডিসপ্লে ও অ্যাপয়েন্টমেন্ট শিডিউলিং',
      defaultLimit: -1,
    },
    {
      key: 'telemedicine',
      nameBn: 'টেলিমেডিসিন ভিডিও কনসালটেশন',
      nameEn: 'Telemedicine Consultations',
      unit: 'সেশন / মাস',
      defaultReset: 'monthly',
      desc: 'অনলাইন ভিডিও কনসালটেশনের মাধ্যমে রোগী দেখার মাসিক কোটা',
      defaultLimit: 50,
    },
    {
      key: 'sms_reminders',
      nameBn: 'রোগীদের এসএমএস নোটিফিকেশন',
      nameEn: 'Patient SMS Reminders',
      unit: 'টি এসএমএস / মাস',
      defaultReset: 'monthly',
      desc: 'সিরিয়াল বুকিং ও রিমাইন্ডারের স্বয়ংক্রিয় এসএমএস নোটিফিকেশন কোটা',
      defaultLimit: 150,
    },
    {
      key: 'advanced_analytics',
      nameBn: 'উন্নত অ্যানালিটিক্স ও আয়ের রিপোর্ট',
      nameEn: 'Analytics & Financial Reports',
      unit: '',
      defaultReset: 'never',
      desc: 'প্রেসক্রিপশন প্রবণতা, রোগী সংখ্যা ও প্র্যাকটিস আয়ের গ্রাফ ও রিপোর্ট',
      defaultLimit: -1,
    },
    {
      key: 'priority_support',
      nameBn: 'ডেডিকেটেড প্রায়োরিটি কাস্টমার সাপোর্ট',
      nameEn: 'Dedicated Priority Support',
      unit: '',
      defaultReset: 'never',
      desc: 'সরাসরি হেল্পলাইন ও সার্বক্ষণিক প্রায়োরিটি কাস্টমার কেয়ার সহায়তা',
      defaultLimit: -1,
    },
  ],
  hospital: [
    {
      key: 'doctor_seats',
      nameBn: 'অধিভুক্ত ডাক্তার সংখ্যা (ডাক্তার সিট)',
      nameEn: 'Affiliated Doctor Seats',
      unit: 'জন ডাক্তার',
      defaultReset: 'never',
      desc: 'হাসপাতালে সর্বোচ্চ কতজন রেজিস্টার্ড ডাক্তার সংযুক্ত থাকতে পারবেন',
      defaultLimit: 10,
    },
    {
      key: 'max_chambers',
      nameBn: 'ওপিডি চেম্বার / কনসাল্টেশন রুম',
      nameEn: 'OPD Chambers',
      unit: 'টি চেম্বার',
      defaultReset: 'never',
      desc: 'হাসপাতালের আউটডোরে মোট কতটি চেম্বার বা ওপিডি রুম সক্রিয় থাকবে',
      defaultLimit: 10,
    },
    {
      key: 'live_queue_tv',
      nameBn: 'ওয়েটিং লাউঞ্জ টিভি ডিসপ্লে স্ক্রিন',
      nameEn: 'Waiting Lounge TV Displays',
      unit: 'টি স্ক্রিন',
      defaultReset: 'never',
      desc: 'হাসপাতালের ওয়েটিং লাউঞ্জের বড় পর্দায় ডিজিটাল টোকেন ও সিরিয়াল প্রদর্শন',
      defaultLimit: 2,
    },
    {
      key: 'hospital_analytics',
      nameBn: 'হসপিটাল অ্যাডভান্সড অ্যানালিটিক্স',
      nameEn: 'Hospital Analytics',
      unit: '',
      defaultReset: 'never',
      desc: 'হাসপাতালের সামগ্রিক রোগী ফুটফল ও টিকিট রেভিনিউ রিপোর্ট',
      defaultLimit: -1,
    },
    {
      key: 'custom_branding',
      nameBn: 'কাস্টম ব্র্যান্ডিং ও ব্যানার',
      nameEn: 'Custom Hospital Branding',
      unit: '',
      defaultReset: 'never',
      desc: 'প্রেসক্রিপশন ও অ্যাপয়েন্টমেন্ট স্লিপে নিজস্ব হাসপাতালের লোগো ও ব্র্যান্ডিং',
      defaultLimit: -1,
    },
    {
      key: 'priority_support',
      nameBn: 'ডেডিকেটেড অ্যাকাউন্ট ম্যানেজার',
      nameEn: 'Dedicated Priority Support',
      unit: '',
      defaultReset: 'never',
      desc: 'ডেডিকেটেড কি-অ্যাকাউন্ট ম্যানেজার ও ২৪/৭ কারিগরি সহায়তা',
      defaultLimit: -1,
    },
  ],
}

export const getFeatureMeta = (entity, key) => {
  const list = STANDARD_FEATURES[entity] || STANDARD_FEATURES.doctor
  const aliases = {
    prescriptions_limit: 'eprescription',
    prescriptions: 'eprescription',
    chambers_limit: 'max_chambers',
    chambers: 'max_chambers',
    telemedicine_enabled: 'telemedicine',
    telemedicine_calls: 'telemedicine',
    patient_sms: 'sms_reminders',
    sms_notifications: 'sms_reminders',
    analytics: 'advanced_analytics',
  }
  const resolvedKey = aliases[key] || key
  return list.find(s => s.key === resolvedKey || s.key === key)
}

export default function AdminPlansPage() {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // View & Filtering
  const [viewMode, setViewMode] = useState('catalog') // 'catalog' | 'matrix'
  const [entityFilter, setEntityFilter] = useState('all') // 'all' | 'doctor' | 'hospital'
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'active' | 'inactive'
  const [searchQuery, setSearchQuery] = useState('')

  // Feature Matrix State
  const [matrixData, setMatrixData] = useState(null)
  const [matrixLoading, setMatrixLoading] = useState(false)

  // Modal State
  const [showModal, setShowModal] = useState(false)
  const [editingPlan, setEditingPlan] = useState(null)
  const [modalTab, setModalTab] = useState('basics') // 'basics' | 'pricing' | 'features'
  const [saving, setSaving] = useState(false)

  // Form State
  const [form, setForm] = useState({
    name: '',
    slug: '',
    target_entity: 'doctor',
    tier: 'starter',
    price_monthly: 0,
    price_annual: 0,
    annual_discount_percentage: 20,
    currency: 'BDT',
    trial_period_days: 0,
    grace_period_days: 3,
    is_active: true,
    sort_order: 0,
    description: '',
    features: [],
  })

  // Load plans catalog
  const loadPlans = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await getAdminPlans()
      // API returns { success: true, data: { data: [...] } } or { data: [...] }
      const plansList = res.data?.data || res.data || []
      setPlans(Array.isArray(plansList) ? plansList : [])
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'সাবস্ক্রিপশন প্ল্যানসমূহ লোড করা সম্ভব হয়নি')
    } finally {
      setLoading(false)
    }
  }

  // Load feature matrix
  const loadMatrix = async () => {
    try {
      setMatrixLoading(true)
      const res = await getFeatureMatrix()
      setMatrixData(res.data || null)
    } catch (err) {
      console.error('Failed to load feature matrix', err)
    } finally {
      setMatrixLoading(false)
    }
  }

  useEffect(() => {
    loadPlans()
  }, [])

  useEffect(() => {
    if (viewMode === 'matrix' && !matrixData) {
      loadMatrix()
    }
  }, [viewMode])

  // Computed summary metrics
  const summaryMetrics = useMemo(() => {
    const total = plans.length
    const active = plans.filter(p => p.is_active).length
    const doctorPlans = plans.filter(p => (p.target_entity || '').toLowerCase() === 'doctor').length
    const hospitalPlans = plans.filter(p => (p.target_entity || '').toLowerCase() === 'hospital').length
    const totalSubscribers = plans.reduce((acc, p) => acc + (p.subscriptions_count || 0), 0)

    return { total, active, doctorPlans, hospitalPlans, totalSubscribers }
  }, [plans])

  // Filtered plans
  const filteredPlans = useMemo(() => {
    return plans.filter(plan => {
      const entity = (plan.target_entity || '').toLowerCase()
      if (entityFilter !== 'all' && entity !== entityFilter) return false

      if (statusFilter === 'active' && !plan.is_active) return false
      if (statusFilter === 'inactive' && plan.is_active) return false

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchName = (plan.name || '').toLowerCase().includes(q)
        const matchSlug = (plan.slug || '').toLowerCase().includes(q)
        const matchDesc = (plan.description || '').toLowerCase().includes(q)
        const matchTier = (plan.tier || '').toLowerCase().includes(q)
        if (!matchName && !matchSlug && !matchDesc && !matchTier) return false
      }

      return true
    })
  }, [plans, entityFilter, statusFilter, searchQuery])

  // Open Create Modal
  const openCreate = () => {
    setEditingPlan(null)
    setModalTab('basics')
    const entity = entityFilter === 'hospital' ? 'hospital' : 'doctor'
    const standardList = STANDARD_FEATURES[entity] || STANDARD_FEATURES.doctor
    setForm({
      name: '',
      slug: '',
      target_entity: entity,
      tier: 'starter',
      price_monthly: 1000,
      price_annual: 9600,
      annual_discount_percentage: 20,
      currency: 'BDT',
      trial_period_days: 14,
      grace_period_days: 3,
      is_active: true,
      sort_order: (plans.length + 1) * 10,
      description: '',
      features: standardList.map(sf => ({
        feature_key: sf.key,
        feature_name: sf.nameEn,
        is_enabled: sf.defaultLimit !== 0,
        quota_limit: sf.defaultLimit,
        reset_period: sf.defaultReset,
      })),
    })
    setShowModal(true)
  }

  // Open Edit Modal
  const openEdit = (plan) => {
    setEditingPlan(plan)
    setModalTab('basics')
    
    const monthlyPrice = Number(plan.price_monthly ?? plan.price ?? 0)
    const annualPrice = Number(plan.price_annual ?? (monthlyPrice * 12 * 0.8))
    const discount = Number(plan.annual_discount_percentage ?? 20)

    setForm({
      name: plan.name || '',
      slug: plan.slug || '',
      target_entity: (plan.target_entity || 'doctor').toLowerCase(),
      tier: (plan.tier || 'starter').toLowerCase(),
      price_monthly: monthlyPrice,
      price_annual: annualPrice,
      annual_discount_percentage: discount,
      currency: plan.currency || 'BDT',
      trial_period_days: Number(plan.trial_period_days ?? 0),
      grace_period_days: Number(plan.grace_period_days ?? 3),
      is_active: Boolean(plan.is_active),
      sort_order: Number(plan.sort_order ?? 0),
      description: plan.description || '',
      features: Array.isArray(plan.features) ? plan.features.map(f => {
        const isUnlimited = Boolean(f.is_unlimited) || f.quota_limit === -1 || f.quota_limit === '-1'
        const limitNum = Number(f.quota_limit ?? -1)
        // If quota is 0, in business terms it is not enabled in this tier
        const isEnabled = Boolean(f.is_enabled) && (isUnlimited || limitNum > 0)
        return {
          feature_key: f.feature_key,
          feature_name: f.feature_name || f.feature_key,
          is_enabled: isEnabled,
          quota_limit: limitNum,
          reset_period: f.reset_period || 'monthly',
        }
      }) : [],
    })
    setShowModal(true)
  }

  // Handle monthly price change and auto-calc annual price
  const handleMonthlyPriceChange = (val) => {
    const monthly = parseFloat(val) || 0
    const discount = parseFloat(form.annual_discount_percentage) || 20
    const calculatedAnnual = Math.round(monthly * 12 * (1 - discount / 100))
    setForm(prev => ({
      ...prev,
      price_monthly: monthly,
      price_annual: calculatedAnnual,
    }))
  }

  // Add Feature Row in Modal
  const addFeatureRow = () => {
    setForm(prev => ({
      ...prev,
      features: [
        ...prev.features,
        {
          feature_key: `custom_feature_${prev.features.length + 1}`,
          feature_name: 'নতুন কাস্টম সুবিধা',
          is_enabled: true,
          quota_limit: -1,
          reset_period: 'monthly',
        },
      ],
    }))
  }

  // Add Standard Feature
  const addStandardFeature = (key) => {
    const entity = (form.target_entity || 'doctor').toLowerCase()
    const list = STANDARD_FEATURES[entity] || STANDARD_FEATURES.doctor
    const standard = list.find(s => s.key === key)
    if (!standard) return

    const existingIndex = form.features.findIndex(f => f.feature_key === standard.key)
    if (existingIndex !== -1) {
      updateFeatureRow(existingIndex, 'is_enabled', true)
      return
    }

    setForm(prev => ({
      ...prev,
      features: [
        ...prev.features,
        {
          feature_key: standard.key,
          feature_name: standard.nameEn,
          is_enabled: true,
          quota_limit: standard.defaultLimit,
          reset_period: standard.defaultReset,
        },
      ],
    }))
  }

  // Add All Standard Features
  const addAllStandardFeatures = () => {
    const entity = (form.target_entity || 'doctor').toLowerCase()
    const list = STANDARD_FEATURES[entity] || STANDARD_FEATURES.doctor
    setForm(prev => {
      const existingKeys = prev.features.map(f => f.feature_key)
      const missing = list.filter(s => !existingKeys.includes(s.key))
      const newFeatures = missing.map(s => ({
        feature_key: s.key,
        feature_name: s.nameEn,
        is_enabled: s.defaultLimit !== 0,
        quota_limit: s.defaultLimit,
        reset_period: s.defaultReset,
      }))
      return {
        ...prev,
        features: [...prev.features, ...newFeatures],
      }
    })
  }

  // Toggle Feature Unlimited
  const handleToggleUnlimited = (idx, checked) => {
    const entity = (form.target_entity || 'doctor').toLowerCase()
    const feat = form.features[idx]
    const meta = getFeatureMeta(entity, feat.feature_key)
    if (checked) {
      updateFeatureRow(idx, 'quota_limit', -1)
    } else {
      const defaultVal = meta?.defaultLimit > 0 ? meta.defaultLimit : 100
      updateFeatureRow(idx, 'quota_limit', defaultVal)
    }
  }

  // Toggle Feature Enabled/Disabled
  const handleToggleEnabled = (idx) => {
    const entity = (form.target_entity || 'doctor').toLowerCase()
    const feat = form.features[idx]
    const meta = getFeatureMeta(entity, feat.feature_key)
    const newEnabled = !feat.is_enabled
    setForm(prev => {
      const updated = [...prev.features]
      if (newEnabled) {
        const quota = (feat.quota_limit === 0 || feat.quota_limit === '0')
          ? (meta?.defaultLimit && meta.defaultLimit !== 0 ? meta.defaultLimit : -1)
          : feat.quota_limit
        updated[idx] = { ...updated[idx], is_enabled: true, quota_limit: quota }
      } else {
        updated[idx] = { ...updated[idx], is_enabled: false }
      }
      return { ...prev, features: updated }
    })
  }

  // Remove Feature Row
  const removeFeatureRow = (index) => {
    setForm(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }))
  }

  // Update Feature Row
  const updateFeatureRow = (index, field, value) => {
    setForm(prev => {
      const updated = [...prev.features]
      updated[index] = { ...updated[index], [field]: value }
      return { ...prev, features: updated }
    })
  }

  // Handle Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug ? form.slug.trim() : undefined,
        target_entity: form.target_entity.toLowerCase(),
        tier: form.tier.toLowerCase(),
        price_monthly: parseFloat(form.price_monthly) || 0,
        price_annual: parseFloat(form.price_annual) || 0,
        annual_discount_percentage: parseFloat(form.annual_discount_percentage) || 0,
        trial_period_days: parseInt(form.trial_period_days) || 0,
        grace_period_days: parseInt(form.grace_period_days) || 3,
        currency: 'BDT',
        is_active: Boolean(form.is_active),
        sort_order: parseInt(form.sort_order) || 0,
        description: form.description ? form.description.trim() : '',
        features: form.features.map(f => {
          const isEnabled = Boolean(f.is_enabled)
          const isUnlimited = f.quota_limit === -1 || f.quota_limit === '-1'
          const quota = isEnabled ? (isUnlimited ? -1 : (parseInt(f.quota_limit) || 0)) : 0
          return {
            feature_key: f.feature_key.trim(),
            feature_name: f.feature_name.trim(),
            is_enabled: isEnabled,
            quota_limit: quota,
            reset_period: f.reset_period || 'monthly',
          }
        }),
      }

      if (editingPlan) {
        await updateAdminPlan(editingPlan.id, payload)
      } else {
        await createAdminPlan(payload)
      }

      setShowModal(false)
      loadPlans()
      if (viewMode === 'matrix') loadMatrix()
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'প্ল্যান সংরক্ষণে সমস্যা হয়েছে')
    } finally {
      setSaving(false)
    }
  }

  // Quick Toggle Plan Status
  const handleToggleStatus = async (plan) => {
    try {
      await updateAdminPlan(plan.id, {
        is_active: !plan.is_active,
      })
      loadPlans()
    } catch (err) {
      alert(err.response?.data?.message || 'প্ল্যানের স্ট্যাটাস পরিবর্তনে সমস্যা হয়েছে')
    }
  }

  // Delete Plan
  const handleDelete = async (plan) => {
    if (!window.confirm(`আপনি কি নিশ্চিত যে "${plan.name}" প্ল্যানটি মুছে ফেলতে চান?\n\nসক্রিয় গ্রাহক থাকা প্ল্যান মুছে ফেলা যায় না, প্রয়োজনে নিষ্ক্রিয় করতে পারেন।`)) {
      return
    }
    try {
      await deleteAdminPlan(plan.id)
      loadPlans()
      if (viewMode === 'matrix') loadMatrix()
    } catch (err) {
      alert(err.response?.data?.message || 'প্ল্যান মুছে ফেলতে সমস্যা হয়েছে')
    }
  }

  return (
    <div className="abp-container">
      {/* ─── 1. PAGE HEADER ─── */}
      <div className="abp-header">
        <div>
          <h1 className="abp-title">
            সাবস্ক্রিপশন প্ল্যান ও টিয়ার
            <span className="abp-title-badge">প্রাইসিং ইঞ্জিন</span>
          </h1>
          <p className="abp-subtitle">
            ডাক্তার প্র্যাকটিস ও হাসপাতাল সাবস্ক্রিপশন টিয়ার, বিলিং সাইকেল, কোটা এবং ফিচারসমূহ কনফিগার করুন।
          </p>
        </div>

        <div className="abp-header-actions">
          <button
            onClick={() => { loadPlans(); if (viewMode === 'matrix') loadMatrix(); }}
            className="abp-btn-refresh"
            title="রিফ্রেশ করুন"
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={openCreate}
            className="abp-btn-primary"
          >
            <Plus size={16} /> নতুন প্ল্যান তৈরি করুন
          </button>
        </div>
      </div>

      {/* ─── 2. QUICK NAVIGATION BAR ─── */}
      <nav className="abp-quick-nav">
        <Link to="/admin/billing/dashboard" className="abp-nav-pill">
          <Grid size={14} /> অ্যানালিটিক্স ড্যাশবোর্ড
        </Link>
        <Link to="/admin/billing/plans" className="abp-nav-pill active">
          <Layers size={14} /> প্ল্যান ও টিয়ার
        </Link>
        <Link to="/admin/billing/subscribers" className="abp-nav-pill">
          <Users size={14} /> গ্রাহক তালিকা
        </Link>
        <Link to="/admin/billing/invoices" className="abp-nav-pill">
          <Receipt size={14} /> ইনভয়েস লেজার
        </Link>
        <Link to="/admin/billing/transactions" className="abp-nav-pill">
          <CreditCard size={14} /> ম্যানুয়াল লেনদেন
        </Link>
        <Link to="/admin/billing/coupons" className="abp-nav-pill">
          <Tag size={14} /> ডিসকাউন্ট কুপন
        </Link>
        <Link to="/admin/billing/settings" className="abp-nav-pill">
          <Settings size={14} /> বিলিং সেটিংস
        </Link>
      </nav>

      {/* ─── 3. KPI METRICS DECK ─── */}
      <div className="abp-kpi-deck">
        <div className="abp-kpi-card">
          <div className="abp-kpi-label">
            <span>মোট ক্যাটালগ প্ল্যান</span>
            <Layers size={15} color="#64748b" />
          </div>
          <div className="abp-kpi-value">{summaryMetrics.total}</div>
          <div className="abp-kpi-footnote">
            <span style={{ color: '#00b875', fontWeight: 700 }}>{summaryMetrics.active}টি সক্রিয়</span>
            <span>• {summaryMetrics.total - summaryMetrics.active}টি নিষ্ক্রিয়</span>
          </div>
        </div>

        <div className="abp-kpi-card">
          <div className="abp-kpi-label">
            <span>ডাক্তার প্র্যাকটিস টিয়ার</span>
            <Stethoscope size={15} color="#3b82f6" />
          </div>
          <div className="abp-kpi-value">{summaryMetrics.doctorPlans}</div>
          <div className="abp-kpi-footnote">
            স্বতন্ত্র ও গ্রুপ মেডিকেল প্র্যাকটিস প্ল্যান
          </div>
        </div>

        <div className="abp-kpi-card">
          <div className="abp-kpi-label">
            <span>হাসপাতাল প্রাতিষ্ঠানিক টিয়ার</span>
            <Building2 size={15} color="#8b5cf6" />
          </div>
          <div className="abp-kpi-value">{summaryMetrics.hospitalPlans}</div>
          <div className="abp-kpi-footnote">
            প্রাতিষ্ঠানিক হাসপাতাল ও ক্লিনিক সাবস্ক্রিপশন
          </div>
        </div>

        <div className="abp-kpi-card">
          <div className="abp-kpi-label">
            <span>মোট সক্রিয় গ্রাহক</span>
            <Users size={15} color="#00b875" />
          </div>
          <div className="abp-kpi-value">{summaryMetrics.totalSubscribers}</div>
          <div className="abp-kpi-footnote">
            সকল সক্রিয় টিয়ারে নিবন্ধিত প্র্যাকটিস
          </div>
        </div>
      </div>

      {/* ─── 4. TOOLBAR (FILTER / SEARCH / VIEW SWITCHER) ─── */}
      <div className="abp-toolbar">
        <div className="abp-toolbar-left">
          {/* Target Entity Segmented Control */}
          <div className="abp-segmented-group">
            <button
              onClick={() => setEntityFilter('all')}
              className={`abp-segmented-btn ${entityFilter === 'all' ? 'active' : ''}`}
            >
              সকল ধরন
              <span className="abp-counter-chip">{summaryMetrics.total}</span>
            </button>
            <button
              onClick={() => setEntityFilter('doctor')}
              className={`abp-segmented-btn ${entityFilter === 'doctor' ? 'active' : ''}`}
            >
              <Stethoscope size={13} />
              ডাক্তার প্র্যাকটিস
              <span className="abp-counter-chip">{summaryMetrics.doctorPlans}</span>
            </button>
            <button
              onClick={() => setEntityFilter('hospital')}
              className={`abp-segmented-btn ${entityFilter === 'hospital' ? 'active' : ''}`}
            >
              <Building2 size={13} />
              হাসপাতাল প্রতিষ্ঠান
              <span className="abp-counter-chip">{summaryMetrics.hospitalPlans}</span>
            </button>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="abp-select-filter"
          >
            <option value="all">সকল অবস্থা</option>
            <option value="active">শুধু সক্রিয়</option>
            <option value="inactive">শুধু নিষ্ক্রিয়</option>
          </select>
        </div>

        <div className="abp-toolbar-right">
          {/* Search Box */}
          <div className="abp-search-box">
            <Search size={14} />
            <input
              type="text"
              placeholder="প্ল্যানের নাম বা স্লাগ খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="abp-search-input"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="abp-segmented-group">
            <button
              onClick={() => setViewMode('catalog')}
              className={`abp-segmented-btn ${viewMode === 'catalog' ? 'active' : ''}`}
              title="ক্যাটালগ কার্ড ভিউ"
            >
              <Grid size={14} /> ক্যাটালগ
            </button>
            <button
              onClick={() => setViewMode('matrix')}
              className={`abp-segmented-btn ${viewMode === 'matrix' ? 'active' : ''}`}
              title="ফিচার ম্যাট্রিক্স ভিউ"
            >
              <TableIcon size={14} /> ফিচার ম্যাট্রিক্স
            </button>
          </div>
        </div>
      </div>

      {/* ─── 5. MAIN CONTENT AREA ─── */}
      {loading ? (
        <div className="abp-plans-grid">
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: '380px', borderRadius: '16px', background: 'var(--abp-card-bg)', border: '1px solid var(--abp-border)' }} />
          ))}
        </div>
      ) : error ? (
        <div style={{ padding: '32px', textAlign: 'center', background: 'var(--abp-card-bg)', borderRadius: '16px', border: '1px solid #ef4444' }}>
          <AlertCircle size={36} color="#ef4444" style={{ margin: '0 auto 12px auto' }} />
          <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 700 }}>প্ল্যান লোড করা ব্যর্থ হয়েছে</h3>
          <p style={{ color: 'var(--abp-text-muted)', fontSize: '13px', margin: '0 0 16px 0' }}>{error}</p>
          <button onClick={loadPlans} className="abp-btn-primary" style={{ margin: '0 auto' }}>
            <RefreshCw size={14} /> পুনরায় চেষ্টা করুন
          </button>
        </div>
      ) : viewMode === 'catalog' ? (
        /* CATALOG CARDS VIEW */
        filteredPlans.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', background: 'var(--abp-card-bg)', borderRadius: '16px', border: '1px solid var(--abp-border)' }}>
            <Shield size={44} color="#94a3b8" style={{ margin: '0 auto 12px auto' }} />
            <h3 style={{ margin: '0 0 6px 0', fontSize: '17px', fontWeight: 700 }}>কোনো সাবস্ক্রিপশন প্ল্যান পাওয়া যায়নি</h3>
            <p style={{ color: 'var(--abp-text-muted)', fontSize: '13.5px', maxWidth: '400px', margin: '0 auto 18px auto' }}>
              আপনার ফিল্টার বা সার্চ অনুসন্ধানের সাথে কোনো প্ল্যান মেলেনি। নতুন প্ল্যান তৈরি করুন অথবা ফিল্টার পরিবর্তন করুন।
            </p>
            <button onClick={openCreate} className="abp-btn-primary" style={{ margin: '0 auto' }}>
              <Plus size={15} /> নতুন প্ল্যান তৈরি করুন
            </button>
          </div>
        ) : (
          <div className="abp-plans-grid abp-fade-in">
            {filteredPlans.map(plan => {
              const tierClass = `tier-${(plan.tier || 'starter').toLowerCase()}`
              const isDoctor = (plan.target_entity || '').toLowerCase() === 'doctor'
              const monthly = Number(plan.price_monthly ?? plan.price ?? 0)
              const annual = Number(plan.price_annual ?? (monthly * 12 * 0.8))
              const discount = Number(plan.annual_discount_percentage ?? 20)
              const features = Array.isArray(plan.features) ? plan.features : []

              return (
                <div key={plan.id} className={`abp-card ${tierClass}`}>
                  <div className="abp-card-top-bar" />

                  <div className="abp-card-body">
                    {/* Meta pills */}
                    <div className="abp-card-meta">
                      <span className={`abp-entity-pill ${isDoctor ? 'abp-entity-doctor' : 'abp-entity-hospital'}`}>
                        {isDoctor ? <Stethoscope size={12} /> : <Building2 size={12} />}
                        {isDoctor ? 'ডাক্তার প্র্যাকটিস' : 'হাসপাতাল'} • {plan.tier}
                      </span>
                      <button
                        onClick={() => handleToggleStatus(plan)}
                        className={`abp-status-pill ${plan.is_active ? 'abp-status-active' : 'abp-status-inactive'}`}
                        style={{ cursor: 'pointer', border: 'none' }}
                        title="স্ট্যাটাস পরিবর্তন করতে ক্লিক করুন"
                      >
                        {plan.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                      </button>
                    </div>

                    {/* Title & Slug */}
                    <h3 className="abp-card-title">
                      <span>{plan.name}</span>
                      <span className="abp-card-slug">{plan.slug}</span>
                    </h3>

                    {/* Description */}
                    <p className="abp-card-desc">
                      {plan.description || 'স্মার্ট স্বাস্থ্যসেবা ও অটোমেটেড ক্লিনিক্যাল প্র্যাকটিস ম্যানেজমেন্টের জন্য প্রস্তুত এন্টারপ্রাইজ টিয়ার।'}
                    </p>

                    {/* Pricing Box */}
                    <div className="abp-pricing-box">
                      <div className="abp-price-row">
                        <div>
                          <span className="abp-price-main">৳{monthly.toLocaleString()}</span>
                          <span className="abp-price-cycle">/ মাস</span>
                        </div>
                        {plan.trial_period_days > 0 && (
                          <span className="abp-discount-tag" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#2563eb' }}>
                            {plan.trial_period_days} দিন ফ্রি ট্রায়াল
                          </span>
                        )}
                      </div>

                      <div className="abp-price-annual-row">
                        <span>বাৎসরিক বিলিং: <strong>৳{annual.toLocaleString()} / বছর</strong></span>
                        {discount > 0 && (
                          <span className="abp-discount-tag">{discount}% ছাড়</span>
                        )}
                      </div>
                    </div>

                    {/* Highlight Metrics */}
                    <div className="abp-plan-metrics">
                      <div className="abp-plan-metric-pill">
                        <strong>{plan.subscriptions_count ?? 0}</strong>
                        গ্রাহক
                      </div>
                      <div className="abp-plan-metric-pill">
                        <strong>{plan.features_count ?? features.length}</strong>
                        ফিচার
                      </div>
                    </div>

                    {/* Features Preview List */}
                    <div className="abp-features-header">
                      <span>ফিচার সুবিধা</span>
                      <span>কোটা</span>
                    </div>

                    <ul className="abp-features-list">
                      {features.length === 0 ? (
                        <li className="abp-feature-item" style={{ color: 'var(--abp-text-dim)', fontStyle: 'italic' }}>
                          সাধারণ প্ল্যাটফর্ম অ্যাক্সেস
                        </li>
                      ) : (
                        features.slice(0, 4).map((feat, idx) => (
                          <li key={idx} className="abp-feature-item">
                            <span className="abp-feature-name">
                              <CheckCircle2 size={13} color="#00b875" />
                              {feat.feature_name || feat.feature_key}
                            </span>
                            <span className="abp-feature-quota">
                              {feat.quota_limit === -1 ? 'আনলিমিটেড' : feat.quota_limit}
                            </span>
                          </li>
                        ))
                      )}
                      {features.length > 4 && (
                        <li className="abp-feature-item" style={{ color: 'var(--abp-text-dim)', fontSize: '11px', paddingTop: '2px' }}>
                          + আরও {features.length - 4}টি ফিচার...
                        </li>
                      )}
                    </ul>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="abp-card-footer">
                    <button
                      onClick={() => openEdit(plan)}
                      className="abp-btn-edit"
                    >
                      <Edit2 size={13} /> টিয়ার সম্পাদনা
                    </button>
                    <button
                      onClick={() => handleDelete(plan)}
                      className="abp-btn-delete"
                      title="প্ল্যান মুছুন"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )
      ) : (
        /* FEATURE MATRIX VIEW */
        <div className="abp-matrix-card abp-fade-in">
          <div className="abp-matrix-header">
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>ফিচার সুবিধা তুলনা ম্যাট্রিক্স</h3>
              <p style={{ margin: '3px 0 0 0', fontSize: '12.5px', color: 'var(--abp-text-muted)' }}>
                সকল কনফিগার করা সাবস্ক্রিপশন প্ল্যানের ফিচার সীমা, কোটা ও কার্যকারিতা তুলনা করুন।
              </p>
            </div>
            <button
              onClick={loadMatrix}
              className="abp-btn-refresh"
              title="ম্যাট্রিক্স রিফ্রেশ করুন"
              disabled={matrixLoading}
            >
              <RefreshCw size={14} className={matrixLoading ? 'animate-spin' : ''} />
            </button>
          </div>

          <div className="abp-table-responsive">
            {matrixLoading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--abp-text-muted)' }}>
                ফিচার ম্যাট্রিক্স লোড হচ্ছে...
              </div>
            ) : !matrixData || !matrixData.matrix || matrixData.matrix.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--abp-text-muted)' }}>
                কোনো ফিচার ম্যাট্রিক্স ডেটা পাওয়া যায়নি।
              </div>
            ) : (
              <table className="abp-matrix-table">
                <thead>
                  <tr>
                    <th className="abp-matrix-feature-col">ফিচার সুবিধা</th>
                    {matrixData.plans.map(p => (
                      <th key={p.id} style={{ textAlign: 'center' }}>
                        <div>{p.name}</div>
                        <div style={{ fontSize: '10px', textTransform: 'none', color: 'var(--abp-text-dim)', fontWeight: 500 }}>
                          ৳{Number(p.price).toLocaleString()} • {p.target_entity === 'doctor' ? 'ডাক্তার' : 'হাসপাতাল'}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matrixData.matrix.map((row, rIdx) => (
                    <tr key={rIdx}>
                      <td className="abp-matrix-feature-col">
                        <div>{row.feature_name}</div>
                        <div className="abp-matrix-feature-key">{row.feature_key}</div>
                      </td>
                      {matrixData.plans.map(p => {
                        const val = row.plans[p.id]
                        if (!val || !val.is_enabled) {
                          return (
                            <td key={p.id} style={{ textAlign: 'center' }}>
                              <span className="abp-quota-badge abp-quota-disabled">
                                <X size={12} /> অন্তর্ভুক্ত নয়
                              </span>
                            </td>
                          )
                        }
                        if (val.is_unlimited || val.quota_limit === -1) {
                          return (
                            <td key={p.id} style={{ textAlign: 'center' }}>
                              <span className="abp-quota-badge abp-quota-unlimited">
                                <Check size={12} /> আনলিমিটেড
                              </span>
                            </td>
                          )
                        }
                        return (
                          <td key={p.id} style={{ textAlign: 'center' }}>
                            <span className="abp-quota-badge abp-quota-numeric">
                              {val.quota_limit} / {val.reset_period || 'মাস'}
                            </span>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ─── 6. CREATE / EDIT PLAN MODAL ─── */}
      {showModal && (
        <div className="abp-modal-backdrop">
          <div className="abp-modal-content">
            {/* Modal Header */}
            <div className="abp-modal-header">
              <h2 className="abp-modal-title">
                {editingPlan ? `টিয়ার সম্পাদনা: ${editingPlan.name}` : 'নতুন সাবস্ক্রিপশন প্ল্যান কনফিগার করুন'}
              </h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="abp-modal-close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="abp-modal-tabs">
              <button
                type="button"
                onClick={() => setModalTab('basics')}
                className={`abp-modal-tab ${modalTab === 'basics' ? 'active' : ''}`}
              >
                ১. প্ল্যান তথ্য
              </button>
              <button
                type="button"
                onClick={() => setModalTab('pricing')}
                className={`abp-modal-tab ${modalTab === 'pricing' ? 'active' : ''}`}
              >
                ২. মূল্য ও শর্তাবলী
              </button>
              <button
                type="button"
                onClick={() => setModalTab('features')}
                className={`abp-modal-tab ${modalTab === 'features' ? 'active' : ''}`}
              >
                ৩. ফিচার সুবিধা ({form.features.length})
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className="abp-modal-body">
                {/* TAB 1: BASICS */}
                {modalTab === 'basics' && (
                  <div className="abp-fade-in">
                    <div className="abp-form-group">
                      <label className="abp-form-label">প্ল্যানের নাম *</label>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        placeholder="যেমন: প্রফেশনাল প্র্যাকটিস স্যুট"
                        className="abp-form-input"
                      />
                    </div>

                    <div className="abp-form-row">
                      <div className="abp-form-group">
                        <label className="abp-form-label">ব্যবহারকারী / প্রতিষ্ঠান ধরন *</label>
                        <select
                          value={form.target_entity}
                          onChange={e => setForm({ ...form, target_entity: e.target.value })}
                          className="abp-form-select"
                        >
                          <option value="doctor">ডাক্তার প্র্যাকটিস</option>
                          <option value="hospital">হাসপাতাল প্রতিষ্ঠান</option>
                        </select>
                      </div>

                      <div className="abp-form-group">
                        <label className="abp-form-label">টিয়ার লেভেল *</label>
                        <select
                          value={form.tier}
                          onChange={e => setForm({ ...form, tier: e.target.value })}
                          className="abp-form-select"
                        >
                          <option value="free">ফ্রি টিয়ার</option>
                          <option value="starter">স্টার্টার</option>
                          <option value="professional">প্রফেশনাল</option>
                          <option value="enterprise">এন্টারপ্রাইজ</option>
                        </select>
                      </div>
                    </div>

                    <div className="abp-form-row">
                      <div className="abp-form-group">
                        <label className="abp-form-label">ইউআরএল স্লাগ (সিস্টেম কোড)</label>
                        <input
                          type="text"
                          value={form.slug}
                          onChange={e => setForm({ ...form, slug: e.target.value })}
                          placeholder="স্বয়ংক্রিয় তৈরির জন্য খালি রাখুন"
                          className="abp-form-input"
                        />
                      </div>

                      <div className="abp-form-group">
                        <label className="abp-form-label">ক্রম (প্রদর্শন অগ্রাধিকার)</label>
                        <input
                          type="number"
                          value={form.sort_order}
                          onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                          className="abp-form-input"
                        />
                      </div>
                    </div>

                    <div className="abp-form-group">
                      <label className="abp-form-label">সার্বজনীন বিবরণ</label>
                      <textarea
                        rows={3}
                        value={form.description}
                        onChange={e => setForm({ ...form, description: e.target.value })}
                        placeholder="চেকআউট ও প্রাইসিং টেবিলে প্রদর্শনের জন্য সংক্ষিপ্ত বিবরণ..."
                        className="abp-form-textarea"
                      />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '12px' }}>
                      <input
                        type="checkbox"
                        id="plan_is_active"
                        checked={form.is_active}
                        onChange={e => setForm({ ...form, is_active: e.target.checked })}
                        style={{ width: '16px', height: '16px', accentColor: '#00b875' }}
                      />
                      <label htmlFor="plan_is_active" style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--abp-text)', cursor: 'pointer' }}>
                        সক্রিয় প্ল্যান (সাবস্ক্রিপশন ও আপগ্রেডের জন্য উন্মুক্ত)
                      </label>
                    </div>
                  </div>
                )}

                {/* TAB 2: PRICING & TERMS */}
                {modalTab === 'pricing' && (
                  <div className="abp-fade-in">
                    <div className="abp-form-row">
                      <div className="abp-form-group">
                        <label className="abp-form-label">মাসিক মূল্য (টাকা) *</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={form.price_monthly}
                          onChange={e => handleMonthlyPriceChange(e.target.value)}
                          className="abp-form-input"
                        />
                      </div>

                      <div className="abp-form-group">
                        <label className="abp-form-label">বাৎসরিক ছাড় (%)</label>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          max="100"
                          value={form.annual_discount_percentage}
                          onChange={e => {
                            const disc = parseFloat(e.target.value) || 0
                            const monthly = parseFloat(form.price_monthly) || 0
                            setForm({
                              ...form,
                              annual_discount_percentage: disc,
                              price_annual: Math.round(monthly * 12 * (1 - disc / 100)),
                            })
                          }}
                          className="abp-form-input"
                        />
                      </div>
                    </div>

                    <div className="abp-form-group">
                      <label className="abp-form-label">বাৎসরিক মূল্য (টাকা)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={form.price_annual}
                        onChange={e => setForm({ ...form, price_annual: parseFloat(e.target.value) || 0 })}
                        className="abp-form-input"
                      />
                      <div style={{ fontSize: '11.5px', color: 'var(--abp-text-dim)', marginTop: '4px' }}>
                        ছাড়ের ভিত্তিতে স্বয়ংক্রিয়ভাবে গণনা করা হয়, বা নিজের মতো বাৎসরিক মূল্য লিখুন।
                      </div>
                    </div>

                    <div className="abp-form-row">
                      <div className="abp-form-group">
                        <label className="abp-form-label">ফ্রি ট্রায়াল মেয়াদ (দিন)</label>
                        <input
                          type="number"
                          min="0"
                          value={form.trial_period_days}
                          onChange={e => setForm({ ...form, trial_period_days: parseInt(e.target.value) || 0 })}
                          placeholder="সরাসরি বিলিংয়ের জন্য ০ লিখুন"
                          className="abp-form-input"
                        />
                      </div>

                      <div className="abp-form-group">
                        <label className="abp-form-label">গ্রেস পিরিয়ড (দিন)</label>
                        <input
                          type="number"
                          min="0"
                          value={form.grace_period_days}
                          onChange={e => setForm({ ...form, grace_period_days: parseInt(e.target.value) || 3 })}
                          className="abp-form-input"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: FEATURES & ENTITLEMENTS */}
                {modalTab === 'features' && (
                  <div className="abp-fade-in">
                    {/* Guidance Banner */}
                    <div className="abp-feature-guide-box">
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <Sparkles size={18} color="#00b875" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div style={{ fontSize: '12.5px', color: 'var(--abp-text)', lineHeight: 1.5 }}>
                          <strong>সহজ নির্দেশিকা:</strong> এই টিয়ারের গ্রাহক (ডাক্তার বা হাসপাতাল) যেসব সুবিধা পাবেন তা নিচে নির্ধারণ করুন।
                          সীমাহীন ব্যবহারের জন্য <strong>"সীমাহীন (আনলিমিটেড)"</strong> বক্সে টিক দিন।
                          কোনো সুবিধা এই নির্দিষ্ট টিয়ারে বন্ধ রাখতে ডানপাশের সুইচে <strong>"নিষ্ক্রিয়"</strong> করে দিন।
                        </div>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--abp-text)' }}>
                          অন্তর্ভুক্ত ফিচারের তালিকা ({form.features.length})
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {/* Dropdown to add a standard feature */}
                        <select
                          onChange={e => {
                            if (e.target.value === '__custom__') {
                              addFeatureRow()
                            } else if (e.target.value) {
                              addStandardFeature(e.target.value)
                            }
                            e.target.value = ''
                          }}
                          defaultValue=""
                          className="abp-form-select"
                          style={{ fontSize: '12px', padding: '5px 10px', height: '32px', width: 'auto' }}
                        >
                          <option value="" disabled>+ ফিচার যোগ করুন...</option>
                          {(STANDARD_FEATURES[(form.target_entity || 'doctor').toLowerCase()] || STANDARD_FEATURES.doctor).map(sf => (
                            <option key={sf.key} value={sf.key}>
                              {sf.nameBn}
                            </option>
                          ))}
                          <option value="__custom__">➕ কাস্টম নতুন ফিচার...</option>
                        </select>

                        <button
                          type="button"
                          onClick={addAllStandardFeatures}
                          className="abp-btn-edit"
                          style={{ fontSize: '12px', padding: '5px 12px', height: '32px', whiteSpace: 'nowrap' }}
                          title="এই প্ল্যাটফর্মের সকল প্রস্তাবিত ফিচার যুক্ত করুন"
                        >
                          <Layers size={13} /> সকল ফিচার লোড করুন
                        </button>
                      </div>
                    </div>

                    {/* Feature Cards List */}
                    {form.features.length === 0 ? (
                      <div style={{ padding: '30px', textAlign: 'center', background: 'var(--abp-card-header)', borderRadius: '14px', border: '1px dashed var(--abp-border)' }}>
                        <Sparkles size={28} color="#94a3b8" style={{ margin: '0 auto 10px auto' }} />
                        <h5 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: 700 }}>এখনও কোনো ফিচার যুক্ত করা হয়নি</h5>
                        <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: 'var(--abp-text-muted)' }}>
                          নিচের বাটনে ক্লিক করে স্বয়ংক্রিয়ভাবে প্ল্যাটফর্মের সকল প্রস্তাবিত ফিচার যুক্ত করে নিতে পারেন।
                        </p>
                        <button
                          type="button"
                          onClick={addAllStandardFeatures}
                          className="abp-btn-primary"
                          style={{ margin: '0 auto', fontSize: '13px', padding: '8px 18px' }}
                        >
                          <Sparkles size={14} /> সকল প্রস্তাবিত ফিচার যোগ করুন
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {form.features.map((feat, idx) => {
                          const entity = (form.target_entity || 'doctor').toLowerCase()
                          const meta = getFeatureMeta(entity, feat.feature_key)
                          const isUnlimited = feat.quota_limit === -1 || feat.quota_limit === '-1'
                          const isEnabled = Boolean(feat.is_enabled)

                          return (
                            <div
                              key={idx}
                              className={`abp-feature-card ${!isEnabled ? 'is-disabled' : ''}`}
                            >
                              {/* Header */}
                              <div className="abp-feature-card-header">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <div
                                    style={{
                                      width: '32px',
                                      height: '32px',
                                      borderRadius: '8px',
                                      background: isEnabled ? 'rgba(0, 184, 117, 0.12)' : 'rgba(148, 163, 184, 0.15)',
                                      color: isEnabled ? '#00b875' : '#94a3b8',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      flexShrink: 0,
                                    }}
                                  >
                                    {meta?.key === 'eprescription' && <FileText size={16} />}
                                    {meta?.key === 'max_chambers' && <Building2 size={16} />}
                                    {meta?.key === 'live_queue' && <Users size={16} />}
                                    {meta?.key === 'telemedicine' && <Stethoscope size={16} />}
                                    {meta?.key === 'sms_reminders' && <CreditCard size={16} />}
                                    {meta?.key === 'advanced_analytics' && <Layers size={16} />}
                                    {meta?.key === 'priority_support' && <Shield size={16} />}
                                    {(!meta || !['eprescription', 'max_chambers', 'live_queue', 'telemedicine', 'sms_reminders', 'advanced_analytics', 'priority_support'].includes(meta?.key)) && <Sparkles size={16} />}
                                  </div>

                                  <div>
                                    {!meta ? (
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                          <input
                                            type="text"
                                            value={feat.feature_name}
                                            onChange={e => updateFeatureRow(idx, 'feature_name', e.target.value)}
                                            placeholder="কাস্টম ফিচারের নাম (যেমন: ফ্রি ডোমেইন বা ট্রেনিং)"
                                            className="abp-form-input"
                                            style={{ fontSize: '13px', padding: '4px 8px', fontWeight: 700, width: '260px' }}
                                          />
                                          <input
                                            type="text"
                                            value={feat.feature_key}
                                            onChange={e => updateFeatureRow(idx, 'feature_key', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                                            placeholder="কোড কী (যেমন: custom_domain)"
                                            className="abp-form-input abp-feature-badge-key"
                                            style={{ fontSize: '11px', padding: '4px 8px', width: '130px' }}
                                          />
                                        </div>
                                        <span style={{ fontSize: '11px', color: 'var(--abp-text-dim)' }}>
                                          অতিরিক্ত বা স্পেশাল মার্কেটিং সুবিধার নাম এখানে লিখুন।
                                        </span>
                                      </div>
                                    ) : (
                                      <>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                          <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--abp-text)' }}>
                                            {meta.nameBn}
                                          </span>
                                          <span className="abp-feature-badge-key">
                                            {feat.feature_key}
                                          </span>
                                        </div>
                                        {meta.desc && (
                                          <p style={{ margin: '2px 0 0 0', fontSize: '11.5px', color: 'var(--abp-text-muted)' }}>
                                            {meta.desc}
                                          </p>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </div>

                                {/* Right controls: Enable Switch & Delete */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleEnabled(idx)}
                                    className={`abp-feature-toggle-btn ${isEnabled ? 'active' : 'inactive'}`}
                                  >
                                    {isEnabled ? (
                                      <>
                                        <Check size={13} />
                                        <span>অন্তর্ভুক্ত (সক্রিয়)</span>
                                      </>
                                    ) : (
                                      <>
                                        <X size={13} />
                                        <span>বাদ দেওয়া হয়েছে (নিষ্ক্রিয়)</span>
                                      </>
                                    )}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => removeFeatureRow(idx)}
                                    className="abp-btn-delete"
                                    style={{ padding: '6px' }}
                                    title="এই ফিচারটি তালিকা থেকে মুছে ফেলুন"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>

                              {/* Body: Configuration when enabled */}
                              {isEnabled ? (
                                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px', alignItems: 'flex-start', marginTop: '12px' }}>
                                  {/* Quota Setting */}
                                  <div>
                                    <label className="abp-form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <span>ব্যবহারের কোটা সীমা</span>
                                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontWeight: 600, color: '#00b875', fontSize: '12px' }}>
                                        <input
                                          type="checkbox"
                                          checked={isUnlimited}
                                          onChange={e => handleToggleUnlimited(idx, e.target.checked)}
                                          style={{ accentColor: '#00b875', width: '14px', height: '14px' }}
                                        />
                                        <span>সীমাহীন (আনলিমিটেড)</span>
                                      </label>
                                    </label>

                                    {isUnlimited ? (
                                      <div className="abp-unlimited-pill" style={{ width: '100%', justifyContent: 'center' }}>
                                        <Sparkles size={14} />
                                        <span>∞ আনলিমিটেড ব্যবহার (কোনো সীমা নেই)</span>
                                      </div>
                                    ) : (
                                      <div style={{ position: 'relative' }}>
                                        <input
                                          type="number"
                                          min="1"
                                          value={feat.quota_limit > 0 ? feat.quota_limit : ''}
                                          onChange={e => updateFeatureRow(idx, 'quota_limit', Math.max(1, parseInt(e.target.value) || 0))}
                                          placeholder="কোটা সংখ্যা লিখুন (যেমন: ১০০)"
                                          className="abp-form-input"
                                          style={{ paddingRight: meta?.unit ? '120px' : '12px', fontWeight: 700 }}
                                        />
                                        {meta?.unit && (
                                          <span
                                            style={{
                                              position: 'absolute',
                                              right: '10px',
                                              top: '50%',
                                              transform: 'translateY(-50%)',
                                              fontSize: '11.5px',
                                              fontWeight: 600,
                                              color: 'var(--abp-text-muted)',
                                              pointerEvents: 'none',
                                            }}
                                          >
                                            {meta.unit}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  {/* Reset Period */}
                                  <div>
                                    <label className="abp-form-label">নবায়ন চক্র (রিসেট পিরিয়ড)</label>
                                    <select
                                      value={feat.reset_period || 'monthly'}
                                      onChange={e => updateFeatureRow(idx, 'reset_period', e.target.value)}
                                      className="abp-form-select"
                                      style={{ fontSize: '12.5px' }}
                                    >
                                      <option value="monthly">প্রতি মাসে নবায়ন (মাসিক কোটা)</option>
                                      <option value="never">স্থায়ী / ফিক্সড সীমা (যেমন: চেম্বার)</option>
                                      <option value="daily">প্রতিদিন নবায়ন (দৈনিক কোটা)</option>
                                      <option value="yearly">প্রতি বছর নবায়ন (বার্ষিক কোটা)</option>
                                    </select>
                                  </div>
                                </div>
                              ) : (
                                <div style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px', paddingTop: '8px' }}>
                                  <AlertCircle size={14} />
                                  <span>এই টিয়ারে এই সুবিধাটি বন্ধ থাকবে (ডাক্তার বা হাসপাতালের জন্য লক থাকবে)।</span>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="abp-modal-footer">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="abp-btn-cancel"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="abp-btn-primary"
                >
                  {saving ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> সংরক্ষণ হচ্ছে...
                    </>
                  ) : (
                    <>
                      <Check size={15} /> প্ল্যান কনফিগারেশন সংরক্ষণ করুন
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
