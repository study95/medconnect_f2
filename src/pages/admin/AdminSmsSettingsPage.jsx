import React, { useState, useEffect } from 'react'
import { getAdminSmsSettings, updateAdminSmsSettings, sendAdminTestSms, getAdminSmsLogs, getAdminSmsBalance } from '../../api/adminApi'
import {
  MessageSquare,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Shield,
  Zap,
  Radio,
  Send,
  Sliders,
  Key,
  Smartphone,
  Info,
  Check,
  History,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  FileText,
  Wallet,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Eye,
  Copy,
  X,
  Calendar,
  RotateCcw,
  Filter
} from 'lucide-react'
import ListToolbar from '../../components/admin/ListToolbar'
import '../../styles/admin-billing.css'

export default function AdminSmsSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' })
  const [testResult, setTestResult] = useState(null)
  const [activeTab, setActiveTab] = useState('gateway') // 'gateway' | 'balance' | 'credentials' | 'security' | 'test' | 'logs'

  // Settings State
  const [form, setForm] = useState({
    default_provider: 'alphasms',
    failover_enabled: false,
    failover_provider: 'mimsms',
    alphasms: { api_key: '', sender_id: '', url: 'https://api.sms.net.bd/sendsms', rate_per_sms: 0.35 },
    maestrosms: { api_key: '', sender_id: '', url: 'https://api.maestrosms.com/api/v1/sms/send', rate_per_sms: 0.35 },
    mimsms: { username: '', api_key: '', sender_name: '', url: 'https://api.mimsms.com/api/SmsSending/SMS', rate_per_sms: 0.35 },
    throttle: { cooldown_seconds: 60, max_hourly: 3, max_daily: 5 },
    templates: {
      otp: 'আপনার DoctorBooklet ভেরিফিকেশন কোড: :code। কোডটির মেয়াদ ৫ মিনিট।',
      password_reset: 'আপনার DoctorBooklet পাসওয়ার্ড রিসেট ওটিপি: :code। কোডটির মেয়াদ ৫ মিনিট।'
    }
  })

  // Balance & SMS Capacity State
  const [balanceData, setBalanceData] = useState(null)
  const [balanceLoading, setBalanceLoading] = useState(false)
  const [calculatorBudget, setCalculatorBudget] = useState(500)

  // Test form state
  const [testPhone, setTestPhone] = useState('')
  const [testProvider, setTestProvider] = useState('')
  const [testMode, setTestMode] = useState('otp') // 'otp' | 'custom' | 'ping'
  const [testCustomMessage, setTestCustomMessage] = useState('')

  // Logs state
  const [logs, setLogs] = useState([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [logsStats, setLogsStats] = useState({ total_sent: 0, total_success: 0, total_failed: 0, today_count: 0 })
  const [logsPagination, setLogsPagination] = useState({ current_page: 1, last_page: 1, total: 0 })
  const [logsSearch, setLogsSearch] = useState('')
  const [logsProvider, setLogsProvider] = useState('')
  const [logsStatus, setLogsStatus] = useState('')
  const [logsPurpose, setLogsPurpose] = useState('')
  const [datePreset, setDatePreset] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showLogsFilters, setShowLogsFilters] = useState(false)
  const [logsPage, setLogsPage] = useState(1)
  const [selectedLog, setSelectedLog] = useState(null)
  const [copied, setCopied] = useState(false)

  const fetchSettings = async () => {
    setLoading(true)
    setStatusMsg({ type: '', text: '' })
    try {
      const res = await getAdminSmsSettings()
      if (res.data?.success && res.data?.data) {
        setForm(prev => ({
          ...prev,
          ...res.data.data,
          alphasms: { ...prev.alphasms, ...(res.data.data.alphasms || {}) },
          maestrosms: { ...prev.maestrosms, ...(res.data.data.maestrosms || {}) },
          mimsms: { ...prev.mimsms, ...(res.data.data.mimsms || {}) },
          throttle: { ...prev.throttle, ...(res.data.data.throttle || {}) },
          templates: { ...prev.templates, ...(res.data.data.templates || {}) }
        }))
        setTestProvider(res.data.data.default_provider || 'alphasms')
      }
    } catch {
      setStatusMsg({ type: 'danger', text: 'সেটিংস লোড করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।' })
    } finally {
      setLoading(false)
    }
  }

  const fetchBalance = async (provider = '') => {
    setBalanceLoading(true)
    try {
      const res = await getAdminSmsBalance(provider)
      if (res.data?.success && res.data?.data) {
        setBalanceData(res.data.data)
      }
    } catch (err) {
      console.error('Balance fetch failed:', err)
    } finally {
      setBalanceLoading(false)
    }
  }

  const handleDatePresetChange = (preset) => {
    setDatePreset(preset)
    setLogsPage(1)
    if (preset === 'custom') return

    const today = new Date()
    const formatDate = (d) => {
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    if (preset === 'today') {
      const dStr = formatDate(today)
      setDateFrom(dStr)
      setDateTo(dStr)
    } else if (preset === 'yesterday') {
      const y = new Date(today)
      y.setDate(y.getDate() - 1)
      const dStr = formatDate(y)
      setDateFrom(dStr)
      setDateTo(dStr)
    } else if (preset === '7days') {
      const past = new Date(today)
      past.setDate(past.getDate() - 7)
      setDateFrom(formatDate(past))
      setDateTo(formatDate(today))
    } else if (preset === '30days') {
      const past = new Date(today)
      past.setDate(past.getDate() - 30)
      setDateFrom(formatDate(past))
      setDateTo(formatDate(today))
    } else if (preset === 'month') {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      setDateFrom(formatDate(startOfMonth))
      setDateTo(formatDate(today))
    } else if (preset === 'all') {
      setDateFrom('')
      setDateTo('')
    }
  }

  const handleClearAllFilters = () => {
    setLogsSearch('')
    setLogsProvider('')
    setLogsStatus('')
    setLogsPurpose('')
    setDatePreset('all')
    setDateFrom('')
    setDateTo('')
    setLogsPage(1)
  }

  const fetchLogs = async (page = 1) => {
    setLogsLoading(true)
    try {
      const params = {
        page,
        per_page: 15,
        ...(logsSearch && { search: logsSearch.trim() }),
        ...(logsProvider && { provider: logsProvider }),
        ...(logsStatus && { status: logsStatus }),
        ...(logsPurpose && { purpose: logsPurpose }),
        ...(dateFrom && { date_from: dateFrom }),
        ...(dateTo && { date_to: dateTo }),
      }
      const res = await getAdminSmsLogs(params)
      if (res.data?.success) {
        setLogs(res.data.data?.data || [])
        setLogsPagination({
          current_page: res.data.data?.current_page || 1,
          last_page: res.data.data?.last_page || 1,
          total: res.data.data?.total || 0
        })
        if (res.data.stats) {
          setLogsStats(res.data.stats)
        }
      }
    } catch {
      // ignore
    } finally {
      setLogsLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
    fetchBalance()
  }, [])

  useEffect(() => {
    if (activeTab === 'logs') {
      fetchLogs(logsPage)
    } else if (activeTab === 'balance') {
      fetchBalance()
    }
  }, [activeTab, logsPage, logsProvider, logsStatus, logsPurpose, dateFrom, dateTo])

  const handleSave = async (e) => {
    if (e) e.preventDefault()
    setSaving(true)
    setStatusMsg({ type: '', text: '' })
    try {
      const res = await updateAdminSmsSettings(form)
      if (res.data?.success) {
        setStatusMsg({ type: 'success', text: 'এসএমএস গেটওয়ে সেটিংস সফলভাবে সংরক্ষিত ও কার্যকর করা হয়েছে।' })
        fetchBalance()
        setTimeout(() => setStatusMsg({ type: '', text: '' }), 5000)
      } else {
        setStatusMsg({ type: 'danger', text: res.data?.message || 'সংরক্ষণ ব্যর্থ হয়েছে।' })
      }
    } catch (err) {
      setStatusMsg({ type: 'danger', text: err.response?.data?.message || 'সংরক্ষণ ব্যর্থ হয়েছে।' })
    } finally {
      setSaving(false)
    }
  }

  const handleSendTest = async (e) => {
    if (e) e.preventDefault()
    if (!testPhone || !/^01[3-9]\d{8}$/.test(testPhone.trim())) {
      setTestResult({ success: false, message: '১১ সংখ্যার সঠিক মোবাইল নম্বর লিখুন (যেমন: 017XXXXXXXX)।' })
      return
    }

    if (testMode === 'custom' && !testCustomMessage.trim()) {
      setTestResult({ success: false, message: 'অনুগ্রহ করে টেস্ট করার জন্য একটি কাস্টম বার্তা লিখুন।' })
      return
    }

    setTesting(true)
    setTestResult(null)
    try {
      const res = await sendAdminTestSms({
        mobile: testPhone.trim(),
        provider: testProvider || form.default_provider,
        mode: testMode,
        message: testMode === 'custom' ? testCustomMessage.trim() : undefined
      })
      setTestResult({
        success: res.data?.success,
        message: res.data?.message || 'টেস্ট এসএমএস সফলভাবে পাঠানো হয়েছে।',
        data: res.data?.data
      })
      // Refresh logs stats if in background or tab switched
      fetchLogs(1)
    } catch (err) {
      setTestResult({
        success: false,
        message: err.response?.data?.message || 'টেস্ট এসএমএস পাঠানো ব্যর্থ হয়েছে। ক্রেডেনশিয়াল বা ব্যালেন্স চেক করুন।'
      })
    } finally {
      setTesting(false)
    }
  }

  const providerCards = [
    {
      id: 'alphasms',
      name: 'Alpha SMS',
      operator: 'Alpha Net (sms.net.bd)',
      tag: 'জনপ্রিয় ও দ্রুতগামী',
      color: '#0284c7',
      desc: 'বাংলাদেশের অন্যতম নির্ভরযোগ্য গেটওয়ে। এসএমএস সাবমিট করার সাথে সাথেই তাৎক্ষণিক ডেলিভারি দেয়।'
    },
    {
      id: 'maestrosms',
      name: 'Maestro SMS',
      operator: 'Maestro Solutions Ltd.',
      tag: 'হাই-থ্রুপুট ও ট্রানজ্যাকশনাল',
      color: '#7c3aed',
      desc: 'আইএসপি ও কর্পোরেট ট্রানজ্যাকশনাল ওটিপি এসএমএসের জন্য উচ্চমাত্রার ডেলিভারি রেট বিশিষ্ট গেটওয়ে।'
    },
    {
      id: 'mimsms',
      name: 'MiMSMS',
      operator: 'MiMSMS BD',
      tag: 'মাস্কিং ও নন-মাস্কিং রেডি',
      color: '#059669',
      desc: 'রিয়েল-টাইম ডেলিভারি রিপোর্ট (DLR) এবং উচ্চ নির্ভরযোগ্যতা সম্পন্ন বাংলাদেশি এসএমএস গেটওয়ে।'
    },
    {
      id: 'log',
      name: 'Mock Testing (Log)',
      operator: 'Local Development',
      tag: 'জিরো কস্ট / ফ্রি',
      color: '#64748b',
      desc: 'লোকাল মেশিনে টেস্টের জন্য। কোনো এসএমএস ক্রেডিট কাটবে না, ওটিপি লারাভেল লগে প্রিন্ট হবে।'
    }
  ]

  const getProviderColor = (p) => {
    if (p === 'alphasms') return '#0284c7'
    if (p === 'maestrosms') return '#7c3aed'
    if (p === 'mimsms') return '#059669'
    return '#64748b'
  }

  return (
    <div className="admin-billing-container" style={{ padding: '24px 32px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg, #00A88C, #00C9A7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
            }}>
              <MessageSquare size={20} />
            </div>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#1e293b' }}>
              SMS & OTP Gateway Settings
            </h2>
          </div>
          <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>
            অ্যাডমিন প্যানেল থেকে যেকোনো সময় এসএমএস অপারেটর পরিবর্তন, API কী কনফিগার, টেস্ট এসএমএস ও ডেলিভারি লগ দেখুন।
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => {
              if (activeTab === 'logs') fetchLogs(logsPage)
              else fetchSettings()
            }}
            disabled={loading || logsLoading}
            className="btn btn-outline-secondary"
            style={{ borderRadius: 10, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 14 }}
          >
            <RefreshCw size={15} className={(loading || logsLoading) ? 'fa-spin' : ''} />
            রিফ্রেশ
          </button>

          {activeTab !== 'logs' && (
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="btn btn-primary"
              style={{
                background: 'linear-gradient(135deg, #00A88C, #00C9A7)',
                border: 'none', borderRadius: 10, padding: '8px 20px',
                display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 14,
                boxShadow: '0 4px 14px rgba(0, 168, 140, 0.3)'
              }}
            >
              <Save size={16} />
              {saving ? 'সংরক্ষণ হচ্ছে...' : 'সেভ করুন'}
            </button>
          )}
        </div>
      </div>

      {/* Status Alert Banner */}
      {statusMsg.text && (
        <div style={{
          padding: '12px 18px', borderRadius: 12, marginBottom: 20,
          background: statusMsg.type === 'success' ? '#ecfdf5' : '#fef2f2',
          border: `1px solid ${statusMsg.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
          color: statusMsg.type === 'success' ? '#065f46' : '#991b1b',
          display: 'flex', alignItems: 'center', gap: 10, fontSize: 14
        }}>
          {statusMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Live Balance & Capacity Summary Bar */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 16,
        padding: '16px 22px',
        marginBottom: 24,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16,
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: balanceData?.report?.is_low_balance ? 'rgba(239, 68, 68, 0.12)' : 'rgba(0, 168, 140, 0.12)',
            color: balanceData?.report?.is_low_balance ? '#ef4444' : '#00A88C',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Wallet size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>সক্রিয় প্রোভাইডার:</span>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                background: '#f1f5f9', color: '#1e293b'
              }}>
                {balanceData?.report?.provider_name || form.default_provider.toUpperCase()}
              </span>
              {balanceData?.report?.is_low_balance && (
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                  background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca',
                  display: 'flex', alignItems: 'center', gap: 4
                }}>
                  <AlertTriangle size={11} /> লো ব্যালেন্স
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 2 }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: '#1e293b' }}>
                ৳ {balanceData?.report?.balance !== null && balanceData?.report?.balance !== undefined
                  ? Number(balanceData.report.balance).toFixed(2)
                  : (balanceLoading ? '...' : '০.০০')}
              </span>
              <span style={{ fontSize: 12, color: '#64748b' }}>বর্তমান লাইভ ব্যালেন্স</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>প্রতি এসএমএস খরচ</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#334155' }}>
              ৳ {balanceData?.report?.rate_per_sms || (form[form.default_provider]?.rate_per_sms ?? 0.35)}
            </div>
          </div>

          <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: 20 }}>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>সম্ভাব্য বাকি এসএমএস</div>
            <div style={{
              fontSize: 18, fontWeight: 800,
              color: balanceData?.report?.is_low_balance ? '#dc2626' : '#059669'
            }}>
              {balanceData?.report?.remaining_sms !== null && balanceData?.report?.remaining_sms !== undefined
                ? `${Number(balanceData.report.remaining_sms).toLocaleString('en-US')} টি`
                : (balanceLoading ? '...' : 'অজানা')}
            </div>
          </div>

          <button
            onClick={() => fetchBalance(form.default_provider)}
            disabled={balanceLoading}
            className="btn btn-sm btn-outline-secondary"
            style={{
              borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', fontSize: 12, fontWeight: 600
            }}
            title="গেটওয়ে থেকে সরাসরি লাইভ ব্যালেন্স পুনরায় আনুন"
          >
            <RefreshCw size={13} className={balanceLoading ? 'fa-spin' : ''} />
            {balanceLoading ? 'চেক হচ্ছে...' : 'ব্যালেন্স রিফ্রেশ'}
          </button>
        </div>
      </div>

      {/* Modern Segmented Navigation Tabs */}
      <div style={{
        background: '#f1f5f9',
        border: '1px solid #e2e8f0',
        borderRadius: 14,
        padding: '6px',
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        overflowX: 'auto',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}>
        {[
          { id: 'gateway', label: 'গেটওয়ে নির্বাচন', icon: Radio },
          { id: 'balance', label: 'লাইভ ব্যালেন্স', icon: Wallet },
          { id: 'credentials', label: 'API ও ক্রেডেনশিয়াল', icon: Key },
          { id: 'security', label: 'টেমপ্লেট ও লিমিট', icon: Sliders },
          { id: 'test', label: 'লাইভ টেস্ট', icon: Send },
          { id: 'logs', label: 'ডেলিভারি ও অডিট লগ', icon: History }
        ].map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: '1 1 0',
                minWidth: 'fit-content',
                whiteSpace: 'nowrap',
                border: isActive ? '1px solid #cbd5e1' : '1px solid transparent',
                background: isActive ? '#ffffff' : 'transparent',
                padding: '9px 15px',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: isActive ? 700 : 600,
                color: isActive ? '#0f172a' : '#64748b',
                boxShadow: isActive ? '0 2px 8px rgba(0, 0, 0, 0.06)' : 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.65)'
                  e.currentTarget.style.color = '#1e293b'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = '#64748b'
                }
              }}
            >
              <span style={{
                width: 26,
                height: 26,
                borderRadius: 7,
                background: isActive ? 'rgba(0, 168, 140, 0.12)' : 'rgba(100, 116, 139, 0.08)',
                color: isActive ? '#00A88C' : '#64748b',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.18s ease'
              }}>
                <Icon size={14} />
              </span>
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Loading Skeleton for Settings */}
      {loading && activeTab !== 'logs' ? (
        <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>
          <RefreshCw size={32} className="fa-spin" style={{ margin: '0 auto 12px' }} />
          <p>এসএমএস সেটিংস লোড হচ্ছে...</p>
        </div>
      ) : (
        <div>
          {/* TAB 1: ACTIVE GATEWAY SELECTION */}
          {activeTab === 'gateway' && (
            <div>
              <div style={{ marginBottom: 18 }}>
                <h4 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>
                  বর্তমানে কোন গেটওয়ে ব্যবহার করতে চান?
                </h4>
                <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                  যে গেটওয়েটি সিলেক্ট করে নিচে সেভ করবেন, পুরো প্ল্যাটফর্ম থেকে ওটিপি তাৎক্ষণিকভাবে সেই অপারেটর দিয়ে যাবে।
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 28 }}>
                {providerCards.map(p => {
                  const isSelected = form.default_provider === p.id
                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        setForm(prev => {
                          const newPrimary = p.id
                          let newFailover = prev.failover_provider
                          if (newFailover === newPrimary) {
                            const candidates = ['alphasms', 'mimsms', 'maestrosms'].filter(cand => cand !== newPrimary)
                            newFailover = candidates[0] || 'mimsms'
                          }
                          return {
                            ...prev,
                            default_provider: newPrimary,
                            failover_provider: newFailover
                          }
                        })
                      }}
                      style={{
                        padding: '20px', borderRadius: 16, cursor: 'pointer',
                        border: isSelected ? `2px solid ${p.color}` : '1px solid #e2e8f0',
                        background: isSelected ? `${p.color}0a` : '#ffffff',
                        boxShadow: isSelected ? `0 8px 24px ${p.color}25` : '0 2px 8px rgba(0,0,0,0.03)',
                        transition: 'all 0.2s ease', position: 'relative'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                          background: `${p.color}18`, color: p.color
                        }}>
                          {p.tag}
                        </span>
                        <div style={{
                          width: 20, height: 20, borderRadius: '50%',
                          border: isSelected ? `6px solid ${p.color}` : '2px solid #cbd5e1',
                          background: '#fff'
                        }} />
                      </div>
                      <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', margin: '0 0 2px' }}>
                        {p.name}
                      </h3>
                      <div style={{ fontSize: 12, fontWeight: 600, color: p.color, marginBottom: 8 }}>
                        {p.operator}
                      </div>
                      <p style={{ fontSize: 12, color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                        {p.desc}
                      </p>
                    </div>
                  )
                })}
              </div>

              {/* Failover Gateway Box */}
              <div style={{
                background: '#f8fafc', borderRadius: 16, padding: '20px 24px',
                border: '1px solid #e2e8f0', maxWidth: 640
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <Zap size={18} color="#eab308" />
                  <h5 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1e293b' }}>
                    অটোমেটিক ব্যাকআপ ফেইলওভার (Auto-Failover)
                  </h5>
                </div>
                <p style={{ fontSize: 13, color: '#64748b', marginBottom: 14 }}>
                  যদি প্রাইমারি গেটওয়ে থেকে ব্যালেন্স বা সার্ভার এরর আসে, কোড স্বয়ংক্রিয়ভাবে সেকেন্ডারি গেটওয়ে দিয়ে ওটিপি পাঠাবে।
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={form.failover_enabled}
                      onChange={e => setForm(prev => ({ ...prev, failover_enabled: e.target.checked }))}
                      style={{ width: 16, height: 16, accentColor: '#00A88C' }}
                    />
                    ফেইলওভার সক্রিয় করুন
                  </label>

                  {form.failover_enabled && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, color: '#64748b' }}>ব্যাকআপ অপারেটর:</span>
                      <select
                        value={form.failover_provider}
                        onChange={e => setForm(prev => ({ ...prev, failover_provider: e.target.value }))}
                        className="form-select form-select-sm"
                        style={{ width: 170, borderRadius: 8, fontWeight: 600 }}
                      >
                        {['alphasms', 'maestrosms', 'mimsms']
                          .filter(providerId => providerId !== form.default_provider)
                          .map(providerId => (
                            <option key={providerId} value={providerId}>
                              {providerId === 'alphasms' ? 'Alpha SMS' : providerId === 'maestrosms' ? 'Maestro SMS' : 'MiMSMS'}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}

                  {form.failover_enabled && (
                    <small style={{ color: '#00A88C', fontSize: 12, display: 'block', width: '100%', marginTop: 4, fontWeight: 500 }}>
                      ✓ প্রাইমারি অপারেটর ফেইল করলে স্বয়ংক্রিয়ভাবে ভিন্ন ব্যাকআপ অপারেটরে ওটিপি পাঠানো হবে।
                    </small>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: LIVE BALANCE & SMS CAPACITY REPORT */}
          {activeTab === 'balance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Active Operator Focus Card */}
              <div style={{
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: 20,
                padding: '28px 32px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: 24,
                  flexWrap: 'wrap',
                  gap: 16
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <span style={{
                        width: 10, height: 10, borderRadius: '50%',
                        background: getProviderColor(balanceData?.report?.provider || form.default_provider)
                      }} />
                      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1e293b' }}>
                        সক্রিয় অপারেটর: {balanceData?.report?.provider_name || form.default_provider.toUpperCase()}
                      </h3>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                        background: '#e0f2fe', color: '#0369a1'
                      }}>
                        ডিফল্ট ওটিপি গেটওয়ে
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
                      রিয়েল-টাইম ব্যালেন্স এপিআই এবং আপনার নির্ধারিত প্রতি এসএমএস রেট অনুযায়ী অবশিষ্ট ক্ষমতা।
                    </p>
                  </div>

                  <button
                    onClick={() => fetchBalance(form.default_provider)}
                    disabled={balanceLoading}
                    className="btn btn-primary"
                    style={{
                      background: 'linear-gradient(135deg, #00A88C, #00C9A7)',
                      border: 'none', borderRadius: 10, padding: '8px 18px',
                      display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600
                    }}
                  >
                    <RefreshCw size={14} className={balanceLoading ? 'fa-spin' : ''} />
                    {balanceLoading ? 'চেক হচ্ছে...' : 'পুনরায় ব্যালেন্স চেক'}
                  </button>
                </div>

                {/* Metrics Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: 18,
                  marginBottom: 20
                }}>
                  {/* Current Balance */}
                  <div style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 14,
                    padding: 20
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>
                      বর্তমান অ্যাকাউন্ট ব্যালেন্স
                    </div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a' }}>
                      ৳ {balanceData?.report?.balance !== null && balanceData?.report?.balance !== undefined
                        ? Number(balanceData.report.balance).toFixed(2)
                        : (balanceLoading ? '...' : '০.০০')}
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                      অপারেটরের সার্ভার থেকে সরাসরি ফেচ করা হয়েছে
                    </div>
                  </div>

                  {/* Rate per SMS */}
                  <div style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 14,
                    padding: 20
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>
                      প্রতি এসএমএস নির্ধারিত খরচ
                    </div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: '#334155' }}>
                      ৳ {balanceData?.report?.rate_per_sms || (form[form.default_provider]?.rate_per_sms ?? 0.35)}
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                      প্যানেল ক্রেডেনশিয়াল থেকে ডায়নামিক
                    </div>
                  </div>

                  {/* Estimated Remaining SMS */}
                  <div style={{
                    background: balanceData?.report?.is_low_balance ? '#fef2f2' : '#f0fdf4',
                    border: `1px solid ${balanceData?.report?.is_low_balance ? '#fecaca' : '#bbf7d0'}`,
                    borderRadius: 14,
                    padding: 20
                  }}>
                    <div style={{
                      fontSize: 13, fontWeight: 600,
                      color: balanceData?.report?.is_low_balance ? '#991b1b' : '#166534',
                      marginBottom: 6
                    }}>
                      সম্ভাব্য বাকি এসএমএস সংখ্যা
                    </div>
                    <div style={{
                      fontSize: 26, fontWeight: 800,
                      color: balanceData?.report?.is_low_balance ? '#dc2626' : '#15803d'
                    }}>
                      {balanceData?.report?.remaining_sms !== null && balanceData?.report?.remaining_sms !== undefined
                        ? `${Number(balanceData.report.remaining_sms).toLocaleString('en-US')} টি`
                        : (balanceLoading ? '...' : 'অজানা')}
                    </div>
                    <div style={{
                      fontSize: 11,
                      color: balanceData?.report?.is_low_balance ? '#b91c1c' : '#15803d',
                      marginTop: 4
                    }}>
                      ব্যালেন্স ÷ প্রতি এসএমএস খরচ
                    </div>
                  </div>
                </div>

                {/* Low Balance Warning Alert */}
                {balanceData?.report?.is_low_balance && (
                  <div style={{
                    padding: '12px 18px', borderRadius: 12,
                    background: '#fef2f2', border: '1px solid #fecaca',
                    color: '#991b1b', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13
                  }}>
                    <AlertTriangle size={18} />
                    <span>
                      <strong>সতর্কবার্তা:</strong> সক্রিয় গেটওয়েতে ব্যালেন্স বা সম্ভাব্য এসএমএস সংখ্যা আশঙ্কাজনকভাবে কমে গেছে! তাৎক্ষণিক এসএমএস ডেলিভারি সচল রাখতে অনুগ্রহ করে রিচার্জ করুন অথবা ব্যাকআপ অপারেটরে সুইচ করুন।
                    </span>
                  </div>
                )}

                {balanceData?.report?.error && (
                  <div style={{
                    marginTop: 14, padding: '12px 18px', borderRadius: 12,
                    background: '#fffbeb', border: '1px solid #fef3c7',
                    color: '#92400e', fontSize: 13
                  }}>
                    <strong>নোট:</strong> {balanceData.report.error}
                  </div>
                )}

                {/* Delivery & Performance Note Box for Active Operator */}
                <div style={{
                  marginTop: 20,
                  padding: 20,
                  borderRadius: 14,
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: 10,
                        background: '#e0f2fe', color: '#0284c7',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <TrendingUp size={18} />
                      </div>
                      <div>
                        <h5 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1e293b' }}>
                          {balanceData?.report?.provider_name || 'সক্রিয় অপারেটর'} ডেলিভারি ও ব্যবহার নোট
                        </h5>
                        <div style={{ fontSize: 12, color: '#64748b' }}>
                          অডিট লগ ডাটাবেজ থেকে স্বয়ংক্রিয়ভাবে সংগৃহীত সফল/ব্যর্থ ডেলিভারি ও খরচের হিসাব
                        </div>
                      </div>
                    </div>

                    {balanceData?.report?.stats && (
                      <div style={{
                        padding: '4px 12px',
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        background: (balanceData.report.stats.success_rate >= 95)
                          ? '#dcfce7'
                          : (balanceData.report.stats.success_rate >= 80 ? '#e0f2fe' : '#fee2e2'),
                        color: (balanceData.report.stats.success_rate >= 95)
                          ? '#15803d'
                          : (balanceData.report.stats.success_rate >= 80 ? '#0369a1' : '#b91c1c'),
                        border: `1px solid ${
                          (balanceData.report.stats.success_rate >= 95)
                            ? '#bbf7d0'
                            : (balanceData.report.stats.success_rate >= 80 ? '#bae6fd' : '#fecaca')
                        }`
                      }}>
                        <span>ডেলিভারি সাকসেস: {balanceData.report.stats.success_rate}%</span>
                        <span style={{ fontSize: 11, opacity: 0.9 }}>
                          ({balanceData.report.stats.success_rate >= 95 ? 'চমৎকার' : (balanceData.report.stats.success_rate >= 80 ? 'ভালো' : 'মনোযোগ প্রয়োজন')})
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 4 Performance Mini Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginBottom: 16 }}>
                    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 14px' }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>মোট পাঠানো এসএমএস</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: '#1e293b' }}>
                        {balanceData?.report?.stats?.total_sent?.toLocaleString('en-US') ?? 0} টি
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                        আজকে পাঠানো: {balanceData?.report?.stats?.today_sent?.toLocaleString('en-US') ?? 0} টি
                      </div>
                    </div>

                    <div style={{ background: '#fff', border: '1px solid #bbf7d0', borderRadius: 10, padding: '12px 14px' }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#166534', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CheckCircle2 size={13} color="#16a34a" /> সফল ডেলিভারি
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: '#15803d' }}>
                        {balanceData?.report?.stats?.total_success?.toLocaleString('en-US') ?? 0} টি
                      </div>
                      <div style={{ fontSize: 11, color: '#16a34a', marginTop: 2 }}>
                        আজকে সফল: {balanceData?.report?.stats?.today_success?.toLocaleString('en-US') ?? 0} টি
                      </div>
                    </div>

                    <div style={{ background: '#fff', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 14px' }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#991b1b', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <XCircle size={13} color="#dc2626" /> ব্যর্থ এসএমএস
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: '#dc2626' }}>
                        {balanceData?.report?.stats?.total_failed?.toLocaleString('en-US') ?? 0} টি
                      </div>
                      <div style={{ fontSize: 11, color: '#dc2626', marginTop: 2 }}>
                        আজকে ব্যর্থ: {balanceData?.report?.stats?.today_failed?.toLocaleString('en-US') ?? 0} টি
                      </div>
                    </div>

                    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 14px' }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: 4 }}>মোট খরচ (আনুমানিক)</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: '#0f766e' }}>
                        ৳ {Number(balanceData?.report?.stats?.estimated_cost ?? 0).toFixed(2)}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                        {balanceData?.report?.stats?.total_success ?? 0} টি × ৳ {balanceData?.report?.rate_per_sms || 0.35}
                      </div>
                    </div>
                  </div>

                  {/* Progress Ratio Bar */}
                  {balanceData?.report?.stats && balanceData.report.stats.total_sent > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', marginBottom: 4 }}>
                        <span>সফল ডেলিভারি অনুপাত ({balanceData.report.stats.success_rate}%)</span>
                        <span>{balanceData.report.stats.total_success} সফল / {balanceData.report.stats.total_failed} ব্যর্থ</span>
                      </div>
                      <div style={{ height: 6, borderRadius: 3, background: '#fee2e2', overflow: 'hidden', display: 'flex' }}>
                        <div style={{
                          width: `${balanceData.report.stats.success_rate}%`,
                          background: 'linear-gradient(90deg, #22c55e, #16a34a)',
                          borderRadius: 3
                        }} />
                      </div>
                    </div>
                  )}

                  {/* Explanatory Callout Note */}
                  <div style={{
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: 10,
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    fontSize: 12,
                    color: '#1e40af'
                  }}>
                    <Info size={16} style={{ marginTop: 2, flexShrink: 0 }} />
                    <div style={{ lineHeight: 1.5 }}>
                      <strong>অপারেটর অডিট নোট:</strong> সিস্টেম থেকে <strong>{balanceData?.report?.provider_name || 'সক্রিয় অপারেটর'}</strong> ব্যবহার করে সর্বমোট <strong>{balanceData?.report?.stats?.total_sent ?? 0}</strong> টি এসএমএস পাঠানোর অনুরোধ সম্পন্ন হয়েছে। এতে <strong>{balanceData?.report?.stats?.total_success ?? 0}</strong> টি সফল এবং <strong>{balanceData?.report?.stats?.total_failed ?? 0}</strong> টি ব্যর্থ হয়েছে। নির্ধারিত রেট (৳ {balanceData?.report?.rate_per_sms || 0.35}) অনুযায়ী সফল এসএমএসের মোট খরচ দাঁড়িয়েছে <strong>৳ {Number(balanceData?.report?.stats?.estimated_cost ?? 0).toFixed(2)}</strong>।
                    </div>
                  </div>
                </div>
              </div>

              {/* All 3 Operators Side-by-Side Status Grid */}
              <div>
                <h4 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 700, color: '#1e293b' }}>
                  সকল অপারেটরের বর্তমান ব্যালেন্স ও রেট পর্যালোচনা
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
                  {[
                    { id: 'alphasms', name: 'Alpha SMS', color: '#0284c7', sub: 'sms.net.bd' },
                    { id: 'maestrosms', name: 'Maestro SMS', color: '#7c3aed', sub: 'Maestro Solutions' },
                    { id: 'mimsms', name: 'MiMSMS BD', color: '#059669', sub: 'mimsms.com' }
                  ].map(op => {
                    const info = balanceData?.all_providers?.[op.id]
                    const isActive = form.default_provider === op.id
                    const rate = form[op.id]?.rate_per_sms ?? 0.35

                    return (
                      <div
                        key={op.id}
                        style={{
                          background: '#fff',
                          border: isActive ? `2px solid ${op.color}` : '1px solid #e2e8f0',
                          borderRadius: 16,
                          padding: 22,
                          boxShadow: isActive ? '0 4px 16px rgba(0, 0, 0, 0.06)' : 'none',
                          position: 'relative'
                        }}
                      >
                        {isActive && (
                          <span style={{
                            position: 'absolute', top: 14, right: 14,
                            background: op.color, color: '#fff',
                            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10
                          }}>
                            সক্রিয়
                          </span>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                          <div style={{ width: 10, height: 10, borderRadius: '50%', background: op.color }} />
                          <div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>{op.name}</div>
                            <div style={{ fontSize: 11, color: '#64748b' }}>{op.sub}</div>
                          </div>
                        </div>

                        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 14, marginBottom: 14 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                            <span style={{ color: '#64748b' }}>লাইভ ব্যালেন্স:</span>
                            <span style={{ fontWeight: 700, color: '#1e293b' }}>
                              {info?.balance !== null && info?.balance !== undefined
                                ? `৳ ${Number(info.balance).toFixed(2)}`
                                : (info?.error ? 'চেক ব্যর্থ' : 'কনফিগার নেই')}
                            </span>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                            <span style={{ color: '#64748b' }}>নির্ধারিত রেট:</span>
                            <span style={{ fontWeight: 600, color: '#475569' }}>৳ {rate} / SMS</span>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                            <span style={{ color: '#64748b' }}>ডেলিভারি হিসাব:</span>
                            <span style={{ fontWeight: 600, fontSize: 12 }}>
                              {info?.stats?.total_sent ? (
                                <span>
                                  <span style={{ color: '#16a34a' }}>{info.stats.total_success} সফল</span>
                                  {' / '}
                                  <span style={{ color: info.stats.total_failed > 0 ? '#dc2626' : '#94a3b8' }}>
                                    {info.stats.total_failed} ব্যর্থ
                                  </span>
                                </span>
                              ) : (
                                <span style={{ color: '#94a3b8' }}>০ টি পাঠানো</span>
                              )}
                            </span>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                            <span style={{ color: '#64748b' }}>সম্ভাব্য বাকি এসএমএস:</span>
                            <span style={{
                              fontWeight: 800,
                              color: info?.remaining_sms ? (info.is_low_balance ? '#dc2626' : '#059669') : '#94a3b8'
                            }}>
                              {info?.remaining_sms !== null && info?.remaining_sms !== undefined
                                ? `${Number(info.remaining_sms).toLocaleString('en-US')} টি`
                                : '---'}
                            </span>
                          </div>
                        </div>

                        {!isActive && (
                          <button
                            onClick={() => {
                              setForm(prev => ({ ...prev, default_provider: op.id }))
                              setActiveTab('gateway')
                            }}
                            className="btn btn-sm btn-outline-secondary w-100"
                            style={{ borderRadius: 8, fontSize: 12, fontWeight: 600 }}
                          >
                            এই অপারেটরে সুইচ করুন
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Instant Recharge & Capacity Estimator Tool */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 18,
                padding: '24px 28px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <TrendingUp size={18} color="#00A88C" />
                  <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1e293b' }}>
                    বাজেট ও রিচার্জ এসএমএস হিসাব ক্যালকুলেটর (Quick Estimator)
                  </h4>
                </div>
                <p style={{ margin: '0 0 16px 0', fontSize: 13, color: '#64748b' }}>
                  আপনি কত টাকার রিচার্জ করতে চান তা লিখুন। আপনার সেট করা রেট অনুযায়ী কোন অপারেটরে কতটি এসএমএস পাওয়া যাবে তা সরাসরি দেখে নিন:
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>রিচার্জ বাজেট:</span>
                    <input
                      type="number"
                      min="50"
                      step="50"
                      value={calculatorBudget}
                      onChange={e => setCalculatorBudget(Math.max(0, parseInt(e.target.value) || 0))}
                      className="form-control"
                      style={{ width: 140, borderRadius: 8, fontSize: 14, fontWeight: 700 }}
                    />
                    <span style={{ fontSize: 13, color: '#64748b' }}>টাকা</span>
                  </div>

                  <div style={{ display: 'flex', gap: 6 }}>
                    {[200, 500, 1000, 2000, 5000].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setCalculatorBudget(amt)}
                        className={`btn btn-sm ${calculatorBudget === amt ? 'btn-primary' : 'btn-outline-secondary'}`}
                        style={{
                          borderRadius: 8, fontSize: 12, fontWeight: 600,
                          background: calculatorBudget === amt ? '#00A88C' : undefined,
                          borderColor: calculatorBudget === amt ? '#00A88C' : undefined
                        }}
                      >
                        ৳ {amt}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                  {[
                    { name: 'Alpha SMS', rate: form.alphasms?.rate_per_sms || 0.35, color: '#0284c7' },
                    { name: 'Maestro SMS', rate: form.maestrosms?.rate_per_sms || 0.35, color: '#7c3aed' },
                    { name: 'MiMSMS BD', rate: form.mimsms?.rate_per_sms || 0.35, color: '#059669' }
                  ].map(calc => {
                    const smsCount = calc.rate > 0 ? Math.floor(calculatorBudget / calc.rate) : 0
                    return (
                      <div
                        key={calc.name}
                        style={{
                          background: '#fff',
                          border: '1px solid #e2e8f0',
                          borderRadius: 12,
                          padding: 16
                        }}
                      >
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>{calc.name}</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: calc.color, marginTop: 4 }}>
                          {smsCount.toLocaleString('en-US')} টি
                        </div>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                          রেট: ৳ {calc.rate} / এসএমএস
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CREDENTIALS SETTINGS */}
          {activeTab === 'credentials' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
              {/* AlphaSMS */}
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, borderBottom: '1px solid #f1f5f9', paddingBottom: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#0284c7' }} />
                  <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1e293b' }}>Alpha SMS (sms.net.bd)</h4>
                </div>

                <div className="mb-3">
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 4, display: 'block' }}>API Key *</label>
                  <input
                    type="password"
                    value={form.alphasms?.api_key || ''}
                    onChange={e => setForm(prev => ({ ...prev, alphasms: { ...prev.alphasms, api_key: e.target.value } }))}
                    placeholder="Alpha SMS API Key লিখুন"
                    className="form-control"
                    style={{ borderRadius: 8, fontSize: 13 }}
                  />
                </div>

                <div className="mb-3">
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 4, display: 'block' }}>Sender ID / Masking (ঐচ্ছিক)</label>
                  <input
                    type="text"
                    value={form.alphasms?.sender_id || ''}
                    onChange={e => setForm(prev => ({ ...prev, alphasms: { ...prev.alphasms, sender_id: e.target.value } }))}
                    placeholder="যেমন: DoctorBooklet"
                    className="form-control"
                    style={{ borderRadius: 8, fontSize: 13 }}
                  />
                </div>

                <div className="mb-3">
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 4, display: 'block' }}>
                    প্রতি এসএমএস রেট (৳ / SMS Rate) *
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={form.alphasms?.rate_per_sms ?? 0.35}
                      onChange={e => setForm(prev => ({ ...prev, alphasms: { ...prev.alphasms, rate_per_sms: parseFloat(e.target.value) || 0 } }))}
                      placeholder="যেমন: 0.35"
                      className="form-control"
                      style={{ borderRadius: 8, fontSize: 13 }}
                    />
                    <span style={{ fontSize: 13, color: '#64748b', whiteSpace: 'nowrap' }}>টাকা</span>
                  </div>
                  <small style={{ color: '#64748b', fontSize: 11, display: 'block', marginTop: 4 }}>
                    AlphaSMS-এর সাথে চুক্তি অনুযায়ী রেট (যেমন: ০.৩৫ ৳)। লাইভ ব্যালেন্স থেকে বাকি এসএমএস হিসাব করতে এটি ব্যবহৃত হয়।
                  </small>
                </div>

                <div className="mb-2">
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 4, display: 'block' }}>API Endpoint URL</label>
                  <input
                    type="text"
                    value={form.alphasms?.url || 'https://api.sms.net.bd/sendsms'}
                    onChange={e => setForm(prev => ({ ...prev, alphasms: { ...prev.alphasms, url: e.target.value } }))}
                    className="form-control"
                    style={{ borderRadius: 8, fontSize: 13 }}
                  />
                </div>
              </div>

              {/* MaestroSMS */}
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, borderBottom: '1px solid #f1f5f9', paddingBottom: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#7c3aed' }} />
                  <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1e293b' }}>Maestro SMS BD</h4>
                </div>

                <div className="mb-3">
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 4, display: 'block' }}>API Key *</label>
                  <input
                    type="password"
                    value={form.maestrosms?.api_key || ''}
                    onChange={e => setForm(prev => ({ ...prev, maestrosms: { ...prev.maestrosms, api_key: e.target.value } }))}
                    placeholder="Maestro API Key লিখুন"
                    className="form-control"
                    style={{ borderRadius: 8, fontSize: 13 }}
                  />
                </div>

                <div className="mb-3">
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 4, display: 'block' }}>Sender ID / Masking</label>
                  <input
                    type="text"
                    value={form.maestrosms?.sender_id || ''}
                    onChange={e => setForm(prev => ({ ...prev, maestrosms: { ...prev.maestrosms, sender_id: e.target.value } }))}
                    placeholder="যেমন: DoctorBooklet"
                    className="form-control"
                    style={{ borderRadius: 8, fontSize: 13 }}
                  />
                </div>

                <div className="mb-3">
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 4, display: 'block' }}>
                    প্রতি এসএমএস রেট (৳ / SMS Rate) *
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={form.maestrosms?.rate_per_sms ?? 0.35}
                      onChange={e => setForm(prev => ({ ...prev, maestrosms: { ...prev.maestrosms, rate_per_sms: parseFloat(e.target.value) || 0 } }))}
                      placeholder="যেমন: 0.35"
                      className="form-control"
                      style={{ borderRadius: 8, fontSize: 13 }}
                    />
                    <span style={{ fontSize: 13, color: '#64748b', whiteSpace: 'nowrap' }}>টাকা</span>
                  </div>
                  <small style={{ color: '#64748b', fontSize: 11, display: 'block', marginTop: 4 }}>
                    MaestroSMS-এর জন্য নির্ধারিত রেট (যেমন: ০.৩৫ ৳)।
                  </small>
                </div>

                <div className="mb-2">
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 4, display: 'block' }}>API Endpoint URL</label>
                  <input
                    type="text"
                    value={form.maestrosms?.url || 'https://api.maestrosms.com/api/v1/sms/send'}
                    onChange={e => setForm(prev => ({ ...prev, maestrosms: { ...prev.maestrosms, url: e.target.value } }))}
                    className="form-control"
                    style={{ borderRadius: 8, fontSize: 13 }}
                  />
                </div>
              </div>

              {/* MiMSMS */}
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, borderBottom: '1px solid #f1f5f9', paddingBottom: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#059669' }} />
                  <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1e293b' }}>MiMSMS BD</h4>
                </div>

                <div className="mb-3">
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 4, display: 'block' }}>Username *</label>
                  <input
                    type="text"
                    value={form.mimsms?.username || ''}
                    onChange={e => setForm(prev => ({ ...prev, mimsms: { ...prev.mimsms, username: e.target.value } }))}
                    placeholder="MiMSMS অ্যাকাউন্ট ইউজারনেম"
                    className="form-control"
                    style={{ borderRadius: 8, fontSize: 13 }}
                  />
                </div>

                <div className="mb-3">
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 4, display: 'block' }}>API Key *</label>
                  <input
                    type="password"
                    value={form.mimsms?.api_key || ''}
                    onChange={e => setForm(prev => ({ ...prev, mimsms: { ...prev.mimsms, api_key: e.target.value } }))}
                    placeholder="MiMSMS API Key লিখুন"
                    className="form-control"
                    style={{ borderRadius: 8, fontSize: 13 }}
                  />
                </div>

                <div className="mb-3">
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 4, display: 'block' }}>Sender Name / Masking</label>
                  <input
                    type="text"
                    value={form.mimsms?.sender_name || ''}
                    onChange={e => setForm(prev => ({ ...prev, mimsms: { ...prev.mimsms, sender_name: e.target.value } }))}
                    placeholder="যেমন: DoctorBooklet"
                    className="form-control"
                    style={{ borderRadius: 8, fontSize: 13 }}
                  />
                </div>

                <div className="mb-2">
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 4, display: 'block' }}>
                    প্রতি এসএমএস রেট (৳ / SMS Rate) *
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={form.mimsms?.rate_per_sms ?? 0.35}
                      onChange={e => setForm(prev => ({ ...prev, mimsms: { ...prev.mimsms, rate_per_sms: parseFloat(e.target.value) || 0 } }))}
                      placeholder="যেমন: 0.35"
                      className="form-control"
                      style={{ borderRadius: 8, fontSize: 13 }}
                    />
                    <span style={{ fontSize: 13, color: '#64748b', whiteSpace: 'nowrap' }}>টাকা</span>
                  </div>
                  <small style={{ color: '#64748b', fontSize: 11, display: 'block', marginTop: 4 }}>
                    MiMSMS-এর জন্য নির্ধারিত রেট (যেমন: ০.৩৫ ৳)।
                  </small>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SECURITY & TEMPLATES */}
          {activeTab === 'security' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
              {/* Throttling */}
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, borderBottom: '1px solid #f1f5f9', paddingBottom: 10 }}>
                  <Shield size={18} color="#00A88C" />
                  <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1e293b' }}>Anti-SMS Bombing সিকিউরিটি</h4>
                </div>

                <div className="mb-3">
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 4, display: 'block' }}>
                    কুলডাউন সময় (Cooldown Seconds)
                  </label>
                  <input
                    type="number"
                    min="30"
                    max="300"
                    value={form.throttle?.cooldown_seconds || 60}
                    onChange={e => setForm(prev => ({ ...prev, throttle: { ...prev.throttle, cooldown_seconds: parseInt(e.target.value) || 60 } }))}
                    className="form-control"
                    style={{ borderRadius: 8, fontSize: 13 }}
                  />
                  <small style={{ color: '#64748b' }}>একবার ওটিপি চাওয়ার পর নতুন ওটিপি চাওয়ার জন্য অপেক্ষা করতে হবে।</small>
                </div>

                <div className="mb-3">
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 4, display: 'block' }}>
                    ঘণ্টাপ্রতি সর্বোচ্চ ওটিপি কোটা (Max Hourly Limit)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={form.throttle?.max_hourly || 3}
                    onChange={e => setForm(prev => ({ ...prev, throttle: { ...prev.throttle, max_hourly: parseInt(e.target.value) || 3 } }))}
                    className="form-control"
                    style={{ borderRadius: 8, fontSize: 13 }}
                  />
                  <small style={{ color: '#64748b' }}>একই মোবাইল নম্বরে ১ ঘণ্টায় সর্বোচ্চ কতবার ওটিপি পাঠানো যাবে।</small>
                </div>

                <div className="mb-2">
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 4, display: 'block' }}>
                    দৈনিক সর্বোচ্চ ওটিপি কোটা (Max Daily Limit)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={form.throttle?.max_daily || 5}
                    onChange={e => setForm(prev => ({ ...prev, throttle: { ...prev.throttle, max_daily: parseInt(e.target.value) || 5 } }))}
                    className="form-control"
                    style={{ borderRadius: 8, fontSize: 13 }}
                  />
                  <small style={{ color: '#64748b' }}>একই মোবাইল নম্বরে ২৪ ঘণ্টায় সর্বোচ্চ কতবার ওটিপি পাঠানো যাবে।</small>
                </div>
              </div>

              {/* Templates */}
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, borderBottom: '1px solid #f1f5f9', paddingBottom: 10 }}>
                  <MessageSquare size={18} color="#00A88C" />
                  <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1e293b' }}>এসএমএস টেমপ্লেট</h4>
                </div>

                <div className="mb-3">
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 4, display: 'block' }}>
                    রেজিস্ট্রেশন ও লগইন ওটিপি মেসেজ
                  </label>
                  <textarea
                    rows="3"
                    value={form.templates?.otp || ''}
                    onChange={e => setForm(prev => ({ ...prev, templates: { ...prev.templates, otp: e.target.value } }))}
                    className="form-control"
                    style={{ borderRadius: 8, fontSize: 13 }}
                  />
                  <small style={{ color: '#64748b' }}>ওটিপি কোডের স্থানে <code>:code</code> লিখে রাখুন।</small>
                </div>

                <div className="mb-2">
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 4, display: 'block' }}>
                    পাসওয়ার্ড রিসেট ওটিপি মেসেজ
                  </label>
                  <textarea
                    rows="3"
                    value={form.templates?.password_reset || ''}
                    onChange={e => setForm(prev => ({ ...prev, templates: { ...prev.templates, password_reset: e.target.value } }))}
                    className="form-control"
                    style={{ borderRadius: 8, fontSize: 13 }}
                  />
                  <small style={{ color: '#64748b' }}>ওটিপি কোডের স্থানে <code>:code</code> লিখে রাখুন।</small>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: LIVE DIAGNOSTIC TEST */}
          {activeTab === 'test' && (
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 28, maxWidth: 680 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <Send size={18} color="#00A88C" />
                <h4 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#1e293b' }}>
                  লাইভ টেস্ট ও ডায়াগনস্টিক
                </h4>
              </div>
              <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>
                আপনার কাঙ্ক্ষিত অপারেটরে টেস্ট এসএমএস পাঠিয়ে ওটিপি ভেরিফিকেশন ডেলিভারি ও গেটওয়ে রেসপন্স যাচাই করুন।
              </p>

              <form onSubmit={handleSendTest}>
                <div className="mb-3">
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6, display: 'block' }}>
                    পরীক্ষার জন্য অপারেটর নির্বাচন করুন:
                  </label>
                  <select
                    value={testProvider}
                    onChange={e => setTestProvider(e.target.value)}
                    className="form-select"
                    style={{ borderRadius: 8, fontSize: 13 }}
                  >
                    <option value="alphasms">Alpha SMS (sms.net.bd)</option>
                    <option value="maestrosms">Maestro SMS BD</option>
                    <option value="mimsms">MiMSMS BD</option>
                    <option value="log">Local Mock Driver (Log)</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6, display: 'block' }}>
                    মোবাইল নম্বর (যেখানে টেস্ট এসএমএস যাবে):
                  </label>
                  <input
                    type="text"
                    value={testPhone}
                    onChange={e => setTestPhone(e.target.value)}
                    placeholder="017XXXXXXXX"
                    className="form-control"
                    style={{ borderRadius: 8, fontSize: 14 }}
                  />
                </div>

                {/* Message Mode Selection */}
                <div className="mb-3">
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8, display: 'block' }}>
                    এসএমএস বার্তার ধরন নির্বাচন করুন:
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                    <div
                      onClick={() => setTestMode('otp')}
                      style={{
                        padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                        border: testMode === 'otp' ? '2px solid #00A88C' : '1px solid #e2e8f0',
                        background: testMode === 'otp' ? '#f0fdf9' : '#f8fafc',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <input
                          type="radio"
                          name="testMode"
                          checked={testMode === 'otp'}
                          onChange={() => setTestMode('otp')}
                          style={{ accentColor: '#00A88C' }}
                        />
                        <span style={{ fontSize: 13, fontWeight: 700, color: testMode === 'otp' ? '#00A88C' : '#334155' }}>
                          ওটিপি টেমপ্লেট টেস্ট
                        </span>
                      </div>
                      <small style={{ fontSize: 11, color: '#64748b', display: 'block' }}>
                        আপনার সেভ করা ওটিপি টেমপ্লেটে ডেমো কোড বসিয়ে পাঠাবে
                      </small>
                    </div>

                    <div
                      onClick={() => setTestMode('custom')}
                      style={{
                        padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                        border: testMode === 'custom' ? '2px solid #00A88C' : '1px solid #e2e8f0',
                        background: testMode === 'custom' ? '#f0fdf9' : '#f8fafc',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <input
                          type="radio"
                          name="testMode"
                          checked={testMode === 'custom'}
                          onChange={() => setTestMode('custom')}
                          style={{ accentColor: '#00A88C' }}
                        />
                        <span style={{ fontSize: 13, fontWeight: 700, color: testMode === 'custom' ? '#00A88C' : '#334155' }}>
                          কাস্টম বার্তা লিখুন
                        </span>
                      </div>
                      <small style={{ fontSize: 11, color: '#64748b', display: 'block' }}>
                        নিজের ইচ্ছেমতো কোনো বার্তা লিখে টেস্ট করুন
                      </small>
                    </div>

                    <div
                      onClick={() => setTestMode('ping')}
                      style={{
                        padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                        border: testMode === 'ping' ? '2px solid #00A88C' : '1px solid #e2e8f0',
                        background: testMode === 'ping' ? '#f0fdf9' : '#f8fafc',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <input
                          type="radio"
                          name="testMode"
                          checked={testMode === 'ping'}
                          onChange={() => setTestMode('ping')}
                          style={{ accentColor: '#00A88C' }}
                        />
                        <span style={{ fontSize: 13, fontWeight: 700, color: testMode === 'ping' ? '#00A88C' : '#334155' }}>
                          কানেক্টিভিটি পিং টেস্ট
                        </span>
                      </div>
                      <small style={{ fontSize: 11, color: '#64748b', display: 'block' }}>
                        সিস্টেম ডায়াগনস্টিক পিং বার্তা
                      </small>
                    </div>
                  </div>
                </div>

                {/* Mode specific preview / input */}
                {testMode === 'otp' && (
                  <div style={{
                    marginBottom: 16, padding: '12px 16px', background: '#f8fafc',
                    borderRadius: 10, border: '1px dashed #cbd5e1'
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>
                      পাঠানো বার্তার প্রিভিউ (লাইভ ওটিপি টেমপ্লেট):
                    </div>
                    <div style={{ fontSize: 13, color: '#0f172a', fontWeight: 600, background: '#fff', padding: '8px 12px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                      {(form.templates?.otp || 'আপনার ভেরিফিকেশন কোড: :code।').replace(/::code|:code/g, '582194')}
                    </div>
                    <small style={{ fontSize: 11, color: '#00A88C', display: 'block', marginTop: 4 }}>
                      ✓ এই বার্তাটিই ব্যবহারকারীর মোবাইলে যাবে এবং ডেলিভারি লগে হুবহু রেকর্ড হবে।
                    </small>
                  </div>
                )}

                {testMode === 'custom' && (
                  <div className="mb-3">
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6, display: 'block' }}>
                      কাস্টম বার্তার বিষয়বস্তু:
                    </label>
                    <textarea
                      rows={3}
                      value={testCustomMessage}
                      onChange={e => setTestCustomMessage(e.target.value)}
                      placeholder="এখানে আপনার মেসেজ লিখুন..."
                      className="form-control"
                      style={{ borderRadius: 8, fontSize: 13 }}
                    />
                  </div>
                )}

                {testMode === 'ping' && (
                  <div style={{
                    marginBottom: 16, padding: '10px 14px', background: '#f8fafc',
                    borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12, color: '#64748b'
                  }}>
                    সিস্টেম ডায়াগনস্টিক পিং বার্তা: <code style={{ color: '#0f172a' }}>DoctorBooklet SMS Gateway Test: আপনার টেস্ট এসএমএস সফলভাবে ডেলিভার হয়েছে। Time: ...</code>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={testing}
                  className="btn btn-primary w-100"
                  style={{
                    background: 'linear-gradient(135deg, #00A88C, #00C9A7)',
                    border: 'none', borderRadius: 10, padding: '10px 20px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    fontWeight: 600, fontSize: 14
                  }}
                >
                  <Send size={16} />
                  {testing ? 'টেস্ট এসএমএস পাঠানো হচ্ছে...' : 'টেস্ট এসএমএস পাঠান'}
                </button>
              </form>

              {/* Test Result Card */}
              {testResult && (
                <div style={{
                  marginTop: 24, padding: 16, borderRadius: 12,
                  background: testResult.success ? '#ecfdf5' : '#fef2f2',
                  border: `1px solid ${testResult.success ? '#a7f3d0' : '#fecaca'}`,
                  color: testResult.success ? '#065f46' : '#991b1b',
                  fontSize: 13
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, marginBottom: 6 }}>
                    {testResult.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    <span>{testResult.success ? 'টেস্ট সফল হয়েছে!' : 'টেস্ট ব্যর্থ হয়েছে!'}</span>
                  </div>
                  <p style={{ margin: '0 0 6px' }}>{testResult.message}</p>
                  
                  {testResult.data?.sent_message && (
                    <div style={{ marginTop: 8, background: '#fff', padding: '8px 12px', borderRadius: 8, border: '1px solid #a7f3d0', color: '#1e293b' }}>
                      <strong style={{ fontSize: 11, color: '#047857', display: 'block', marginBottom: 2 }}>প্রেরিত বার্তা (Sent Message):</strong>
                      <span style={{ fontSize: 13 }}>{testResult.data.sent_message}</span>
                    </div>
                  )}

                  {testResult.data?.message_id && (
                    <small style={{ display: 'block', marginTop: 6, color: '#047857' }}>
                      Message ID: <strong>{testResult.data.message_id}</strong>
                    </small>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: SMS DELIVERY & AUDIT LOGS */}
          {activeTab === 'logs' && (() => {
            const activeFilters = []
            if (logsSearch) {
              activeFilters.push({
                type: 'search',
                label: `খোঁজা: "${logsSearch.length > 18 ? logsSearch.slice(0, 18) + '…' : logsSearch}"`,
                onClear: () => { setLogsSearch(''); setLogsPage(1); }
              })
            }
            if (logsProvider) {
              const pName = logsProvider === 'alphasms' ? 'Alpha SMS'
                : logsProvider === 'maestrosms' ? 'Maestro SMS'
                : logsProvider === 'mimsms' ? 'MiMSMS'
                : 'Mock Log'
              activeFilters.push({
                type: 'provider',
                label: `অপারেটর: ${pName}`,
                onClear: () => { setLogsProvider(''); setLogsPage(1); }
              })
            }
            if (logsStatus) {
              activeFilters.push({
                type: 'status',
                label: `স্ট্যাটাস: ${logsStatus === 'success' ? 'সফল (Success)' : 'ব্যর্থ (Failed)'}`,
                onClear: () => { setLogsStatus(''); setLogsPage(1); }
              })
            }
            if (logsPurpose) {
              const purposeName = logsPurpose === 'otp' ? 'ওটিপি কোড'
                : logsPurpose === 'password_reset' ? 'পাসওয়ার্ড রিসেট'
                : 'টেস্ট বার্তা'
              activeFilters.push({
                type: 'purpose',
                label: `উদ্দেশ্য: ${purposeName}`,
                onClear: () => { setLogsPurpose(''); setLogsPage(1); }
              })
            }
            if (dateFrom || dateTo) {
              const dateLabel = datePreset === 'today' ? 'তারিখ: আজকে (Today)'
                : datePreset === 'yesterday' ? 'তারিখ: গতকাল (Yesterday)'
                : datePreset === '7days' ? 'তারিখ: গত ৭ দিন'
                : datePreset === '30days' ? 'তারিখ: গত ৩০ দিন'
                : datePreset === 'month' ? 'তারিখ: চলতি মাস'
                : `তারিখ: ${dateFrom || 'শুরু'} → ${dateTo || 'শেষ'}`
              activeFilters.push({
                type: 'date',
                label: dateLabel,
                onClear: () => {
                  handleDatePresetChange('all')
                }
              })
            }

            const isAllActive = activeFilters.length === 0
            const isTodayActive = datePreset === 'today'
            const isSuccessActive = logsStatus === 'success'
            const isFailedActive = logsStatus === 'failed'

            return (
              <div>
                {/* Summary Metric Cards with Click-to-Filter (Audit Log Style) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
                  <div
                    onClick={handleClearAllFilters}
                    style={{
                      background: '#fff',
                      border: isAllActive ? '2px solid #00A88C' : '1px solid #e2e8f0',
                      borderRadius: 14, padding: '16px 20px', cursor: 'pointer', transition: 'all 0.2s ease',
                      boxShadow: isAllActive ? '0 4px 12px rgba(0, 168, 140, 0.15)' : '0 1px 3px rgba(0,0,0,0.04)'
                    }}
                    title="সব ফিল্টার রিসেট করে সর্বমোট লগ দেখুন"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: 12, color: isAllActive ? '#00A88C' : '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                        সর্বমোট প্রেরিত এসএমএস
                      </div>
                      <FileText size={16} color={isAllActive ? '#00A88C' : '#64748b'} />
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#1e293b', marginTop: 4 }}>
                      {logsStats.total_sent?.toLocaleString() || 0}
                    </div>
                    <div style={{ fontSize: 11, color: isAllActive ? '#00A88C' : '#94a3b8', marginTop: 2 }}>
                      {isAllActive ? '✓ সকল লগ দৃশ্যমান' : 'ক্লিক করে সব লগ দেখুন'}
                    </div>
                  </div>

                  <div
                    onClick={() => {
                      setLogsStatus(logsStatus === 'success' ? '' : 'success')
                      setLogsPage(1)
                    }}
                    style={{
                      background: '#fff',
                      border: isSuccessActive ? '2px solid #059669' : '1px solid #a7f3d0',
                      borderRadius: 14, padding: '16px 20px', cursor: 'pointer', transition: 'all 0.2s ease',
                      boxShadow: isSuccessActive ? '0 4px 12px rgba(5, 150, 105, 0.15)' : '0 1px 3px rgba(0,0,0,0.04)'
                    }}
                    title="ক্লিক করে সফল এসএমএস ফিল্টার করুন"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: 12, color: '#047857', fontWeight: 700, textTransform: 'uppercase' }}>
                        সফল ডেলিভারি (Success)
                      </div>
                      <CheckCircle2 size={16} color="#059669" />
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#059669', marginTop: 4 }}>
                      {logsStats.total_success?.toLocaleString() || 0}
                    </div>
                    <div style={{ fontSize: 11, color: '#059669', marginTop: 2 }}>
                      {isSuccessActive ? '✓ ফিল্টার সক্রিয়' : 'ক্লিক করে ফিল্টার করুন'}
                    </div>
                  </div>

                  <div
                    onClick={() => {
                      setLogsStatus(logsStatus === 'failed' ? '' : 'failed')
                      setLogsPage(1)
                    }}
                    style={{
                      background: '#fff',
                      border: isFailedActive ? '2px solid #dc2626' : '1px solid #fecaca',
                      borderRadius: 14, padding: '16px 20px', cursor: 'pointer', transition: 'all 0.2s ease',
                      boxShadow: isFailedActive ? '0 4px 12px rgba(220, 38, 38, 0.15)' : '0 1px 3px rgba(0,0,0,0.04)'
                    }}
                    title="ক্লিক করে ব্যর্থ এসএমএস ফিল্টার করুন"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: 12, color: '#b91c1c', fontWeight: 700, textTransform: 'uppercase' }}>
                        ব্যর্থ এসএমএস (Failed)
                      </div>
                      <AlertCircle size={16} color="#dc2626" />
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#dc2626', marginTop: 4 }}>
                      {logsStats.total_failed?.toLocaleString() || 0}
                    </div>
                    <div style={{ fontSize: 11, color: '#dc2626', marginTop: 2 }}>
                      {isFailedActive ? '✓ ফিল্টার সক্রিয়' : 'ক্লিক করে ফিল্টার করুন'}
                    </div>
                  </div>

                  <div
                    onClick={() => {
                      if (isTodayActive) {
                        handleDatePresetChange('all')
                      } else {
                        handleDatePresetChange('today')
                      }
                    }}
                    style={{
                      background: '#fff',
                      border: isTodayActive ? '2px solid #0284c7' : '1px solid #e2e8f0',
                      borderRadius: 14, padding: '16px 20px', cursor: 'pointer', transition: 'all 0.2s ease',
                      boxShadow: isTodayActive ? '0 4px 12px rgba(2, 132, 199, 0.15)' : '0 1px 3px rgba(0,0,0,0.04)'
                    }}
                    title="ক্লিক করে আজকের তারিখ ফিল্টার করুন"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: 12, color: '#0284c7', fontWeight: 700, textTransform: 'uppercase' }}>
                        আজকের পাঠানো এসএমএস
                      </div>
                      <Calendar size={16} color="#0284c7" />
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#0284c7', marginTop: 4 }}>
                      {logsStats.today_count?.toLocaleString() || 0}
                    </div>
                    <div style={{ fontSize: 11, color: '#0284c7', marginTop: 2 }}>
                      {isTodayActive ? '✓ আজকের তারিখ ফিল্টার সক্রিয়' : 'ক্লিক করে ফিল্টার করুন'}
                    </div>
                  </div>
                </div>

                {/* Patient Registry-Style ListToolbar */}
                <ListToolbar
                  search={logsSearch}
                  onSearchChange={(val) => {
                    setLogsSearch(val)
                  }}
                  onSearchKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setLogsPage(1)
                      fetchLogs(1)
                    }
                  }}
                  searchPlaceholder="Search by ID, mobile number, message, IP..."
                  onRefresh={() => fetchLogs(logsPagination.current_page)}
                  refreshing={logsLoading}
                  showFilters={showLogsFilters}
                  onToggleFilters={() => setShowLogsFilters(p => !p)}
                  hasActiveFilters={activeFilters.length > 0}
                  onClearFilters={handleClearAllFilters}
                  filterCount={activeFilters.length}
                  activeFilters={activeFilters.map(f => ({
                    key: f.type,
                    label: f.label,
                    onRemove: f.onClear
                  }))}
                  actions={
                    <button
                      type="button"
                      onClick={() => { setLogsPage(1); fetchLogs(1); }}
                      className="admin-btn admin-btn-primary"
                      style={{
                        height: 38,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '0 16px',
                        fontWeight: 600,
                        fontSize: 13,
                        borderRadius: 9,
                        background: '#00A88C',
                        border: 'none',
                        color: '#ffffff',
                        boxShadow: '0 2px 6px rgba(0, 168, 140, 0.25)',
                        cursor: 'pointer'
                      }}
                    >
                      <Search size={14} />
                      <span>খুঁজুন</span>
                    </button>
                  }
                >
                  <div style={{ minWidth: 140, maxWidth: 180, flex: '1 1 150px' }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted, #64748b)', marginBottom: 4, textTransform: 'uppercase' }}>
                      অপারেটর
                    </label>
                    <select
                      value={logsProvider}
                      onChange={e => { setLogsProvider(e.target.value); setLogsPage(1); }}
                      style={{
                        width: '100%', height: 38, padding: '0 10px', borderRadius: 8,
                        border: '1px solid var(--admin-border, #e2e8f0)',
                        background: 'var(--admin-card-bg, #ffffff)', color: 'var(--admin-text, #0f172a)',
                        fontSize: 13, outline: 'none', cursor: 'pointer'
                      }}
                    >
                      <option value="">সব অপারেটর (All)</option>
                      <option value="alphasms">Alpha SMS</option>
                      <option value="maestrosms">Maestro SMS</option>
                      <option value="mimsms">MiMSMS</option>
                      <option value="log">Mock Driver (Log)</option>
                    </select>
                  </div>

                  <div style={{ minWidth: 130, maxWidth: 170, flex: '1 1 140px' }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted, #64748b)', marginBottom: 4, textTransform: 'uppercase' }}>
                      স্ট্যাটাস
                    </label>
                    <select
                      value={logsStatus}
                      onChange={e => { setLogsStatus(e.target.value); setLogsPage(1); }}
                      style={{
                        width: '100%', height: 38, padding: '0 10px', borderRadius: 8,
                        border: '1px solid var(--admin-border, #e2e8f0)',
                        background: 'var(--admin-card-bg, #ffffff)', color: 'var(--admin-text, #0f172a)',
                        fontSize: 13, outline: 'none', cursor: 'pointer'
                      }}
                    >
                      <option value="">সব স্ট্যাটাস (All)</option>
                      <option value="success">সফল (Success)</option>
                      <option value="failed">ব্যর্থ (Failed)</option>
                    </select>
                  </div>

                  <div style={{ minWidth: 140, maxWidth: 180, flex: '1 1 150px' }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted, #64748b)', marginBottom: 4, textTransform: 'uppercase' }}>
                      উদ্দেশ্য
                    </label>
                    <select
                      value={logsPurpose}
                      onChange={e => { setLogsPurpose(e.target.value); setLogsPage(1); }}
                      style={{
                        width: '100%', height: 38, padding: '0 10px', borderRadius: 8,
                        border: '1px solid var(--admin-border, #e2e8f0)',
                        background: 'var(--admin-card-bg, #ffffff)', color: 'var(--admin-text, #0f172a)',
                        fontSize: 13, outline: 'none', cursor: 'pointer'
                      }}
                    >
                      <option value="">সব উদ্দেশ্য (All)</option>
                      <option value="otp">ওটিপি কোড (OTP)</option>
                      <option value="password_reset">পাসওয়ার্ড রিসেট</option>
                      <option value="test">টেস্ট ডায়াগনস্টিক</option>
                    </select>
                  </div>

                  <div style={{ minWidth: 150, maxWidth: 190, flex: '1 1 160px' }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted, #64748b)', marginBottom: 4, textTransform: 'uppercase' }}>
                      তারিখ প্রিসেট
                    </label>
                    <select
                      value={datePreset}
                      onChange={e => handleDatePresetChange(e.target.value)}
                      style={{
                        width: '100%', height: 38, padding: '0 10px', borderRadius: 8,
                        border: '1px solid var(--admin-border, #e2e8f0)',
                        background: 'var(--admin-card-bg, #ffffff)', color: 'var(--admin-text, #0f172a)',
                        fontSize: 13, outline: 'none', cursor: 'pointer'
                      }}
                    >
                      <option value="all">📅 সব সময় (All Time)</option>
                      <option value="today">আজকে (Today)</option>
                      <option value="yesterday">গতকাল (Yesterday)</option>
                      <option value="7days">গত ৭ দিন (Last 7 Days)</option>
                      <option value="30days">গত ৩০ দিন (Last 30 Days)</option>
                      <option value="month">চলতি মাস (This Month)</option>
                      <option value="custom">কাস্টম রেঞ্জ (Custom)...</option>
                    </select>
                  </div>

                  {/* Custom Date Pickers: Only show when Custom Range is selected or dates are set */}
                  {(datePreset === 'custom' || (datePreset === 'custom' && (dateFrom || dateTo))) && (
                    <div style={{ display: 'inline-flex', alignItems: 'flex-end', gap: 6, flex: '0 0 auto' }}>
                      <div style={{ width: 135 }}>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted, #64748b)', marginBottom: 4, textTransform: 'uppercase' }}>
                          শুরুর তারিখ
                        </label>
                        <input
                          type="date"
                          value={dateFrom}
                          onChange={e => {
                            setDatePreset('custom')
                            setDateFrom(e.target.value)
                            setLogsPage(1)
                          }}
                          style={{
                            width: '100%', height: 38, padding: '0 8px', borderRadius: 8,
                            border: '1px solid var(--admin-border, #e2e8f0)',
                            background: 'var(--admin-card-bg, #ffffff)', color: 'var(--admin-text, #0f172a)',
                            fontSize: 12.5, outline: 'none'
                          }}
                        />
                      </div>
                      <span style={{ fontSize: 12, color: '#94a3b8', lineHeight: '38px', padding: '0 2px' }}>—</span>
                      <div style={{ width: 135 }}>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted, #64748b)', marginBottom: 4, textTransform: 'uppercase' }}>
                          শেষের তারিখ
                        </label>
                        <input
                          type="date"
                          value={dateTo}
                          onChange={e => {
                            setDatePreset('custom')
                            setDateTo(e.target.value)
                            setLogsPage(1)
                          }}
                          style={{
                            width: '100%', height: 38, padding: '0 8px', borderRadius: 8,
                            border: '1px solid var(--admin-border, #e2e8f0)',
                            background: 'var(--admin-card-bg, #ffffff)', color: 'var(--admin-text, #0f172a)',
                            fontSize: 12.5, outline: 'none'
                          }}
                        />
                      </div>
                    </div>
                  )}
                </ListToolbar>

              {/* Logs Table */}
              <div style={{
                background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16,
                overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
              }}>
                {logsLoading ? (
                  <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>
                    <RefreshCw size={24} className="fa-spin" style={{ margin: '0 auto 10px' }} />
                    <p style={{ margin: 0 }}>লগ ডেটা লোড হচ্ছে...</p>
                  </div>
                ) : logs.length === 0 ? (
                  <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>
                    <FileText size={32} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
                    <p style={{ margin: 0, fontWeight: 600 }}>কোনো এসএমএস লগ রেকর্ড পাওয়া যায়নি।</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0" style={{ fontSize: 13 }}>
                      <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                        <tr>
                          <th style={{ padding: '12px 18px', fontWeight: 600 }}>তারিখ ও সময়</th>
                          <th style={{ padding: '12px 18px', fontWeight: 600 }}>মোবাইল নম্বর</th>
                          <th style={{ padding: '12px 18px', fontWeight: 600 }}>অপারেটর</th>
                          <th style={{ padding: '12px 18px', fontWeight: 600 }}>উদ্দেশ্য</th>
                          <th style={{ padding: '12px 18px', fontWeight: 600 }}>বার্তা (Message)</th>
                          <th style={{ padding: '12px 18px', fontWeight: 600 }}>স্ট্যাটাস</th>
                          <th style={{ padding: '12px 18px', fontWeight: 600, textAlign: 'center' }}>বিবরণ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {logs.map(log => {
                          const isSuccess = log.status === 'success'
                          const provColor = getProviderColor(log.provider)
                          const dateStr = log.created_at ? new Date(log.created_at).toLocaleString('bn-BD', {
                            day: '2-digit', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit', hour12: true
                          }) : ''

                          return (
                            <tr key={log.id}>
                              <td style={{ padding: '12px 18px', color: '#475569', whiteSpace: 'nowrap' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <Clock size={13} color="#94a3b8" />
                                  <span>{dateStr}</span>
                                </div>
                              </td>

                              <td style={{ padding: '12px 18px', fontWeight: 700, color: '#1e293b' }}>
                                {log.mobile}
                              </td>

                              <td style={{ padding: '12px 18px' }}>
                                <span style={{
                                  fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                                  background: `${provColor}15`, color: provColor, textTransform: 'uppercase'
                                }}>
                                  {log.provider}
                                </span>
                              </td>

                              <td style={{ padding: '12px 18px', color: '#475569', textTransform: 'capitalize' }}>
                                {log.purpose === 'auth' ? 'ওটিপি ভেরিফিকেশন' : (log.purpose === 'password_reset' ? 'পাসওয়ার্ড রিসেট' : (log.purpose === 'test' ? 'টেস্ট এসএমএস' : log.purpose))}
                              </td>

                              <td style={{ padding: '12px 18px', color: '#1e293b', minWidth: 260, maxWidth: 450 }}>
                                <div style={{
                                  whiteSpace: 'normal',
                                  wordBreak: 'break-word',
                                  lineHeight: 1.5,
                                  fontSize: 13,
                                  fontWeight: 500
                                }}>
                                  {log.message}
                                </div>
                                {log.message_id && (
                                  <small style={{ color: '#64748b', fontSize: 11, display: 'block', marginTop: 4, fontFamily: 'monospace' }}>
                                    ID: {log.message_id}
                                  </small>
                                )}
                              </td>

                              <td style={{ padding: '12px 18px' }}>
                                {isSuccess ? (
                                  <span style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 4,
                                    fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 8,
                                    background: '#ecfdf5', color: '#059669'
                                  }}>
                                    <CheckCircle size={13} />
                                    Sent
                                  </span>
                                ) : (
                                  <div>
                                    <span style={{
                                      display: 'inline-flex', alignItems: 'center', gap: 4,
                                      fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 8,
                                      background: '#fef2f2', color: '#dc2626'
                                    }}>
                                      <XCircle size={13} />
                                      Failed
                                    </span>
                                    {log.error_message && (
                                      <small style={{ display: 'block', color: '#dc2626', fontSize: 11, marginTop: 2 }}>
                                        {log.error_message}
                                      </small>
                                    )}
                                  </div>
                                )}
                              </td>

                              <td style={{ padding: '12px 18px', textAlign: 'center' }}>
                                <button
                                  type="button"
                                  onClick={() => setSelectedLog(log)}
                                  className="btn btn-sm btn-outline-secondary"
                                  style={{ borderRadius: 8, padding: '4px 10px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                  title="সম্পূর্ণ বার্তা ও সার্ভার রেসপন্স দেখুন"
                                >
                                  <Eye size={13} />
                                  বিস্তারিত
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination footer */}
                {logsPagination.last_page > 1 && (
                  <div style={{
                    padding: '12px 20px', borderTop: '1px solid #e2e8f0',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <div style={{ fontSize: 13, color: '#64748b' }}>
                      মোট {logsPagination.total} টির মধ্যে পৃষ্ঠা {logsPagination.current_page} / {logsPagination.last_page}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => setLogsPage(p => Math.max(1, p - 1))}
                        disabled={logsPagination.current_page <= 1}
                        className="btn btn-sm btn-outline-secondary"
                        style={{ borderRadius: 8, display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        <ChevronLeft size={14} /> পূর্ববর্তী
                      </button>
                      <button
                        onClick={() => setLogsPage(p => Math.min(logsPagination.last_page, p + 1))}
                        disabled={logsPagination.current_page >= logsPagination.last_page}
                        className="btn btn-sm btn-outline-secondary"
                        style={{ borderRadius: 8, display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        পরবর্তী <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )})()}
        </div>
      )}

      {/* Log Details Modal */}
      {selectedLog && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: 20
        }}>
          <div style={{
            background: '#fff', borderRadius: 18, width: '100%', maxWidth: 580,
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)', overflow: 'hidden'
          }}>
            <div style={{
              padding: '18px 24px', borderBottom: '1px solid #e2e8f0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: '#f8fafc'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: selectedLog.status === 'success' ? '#ecfdf5' : '#fef2f2',
                  color: selectedLog.status === 'success' ? '#059669' : '#dc2626',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {selectedLog.status === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1e293b' }}>
                    এসএমএস ডেলিভারি বিস্তারিত
                  </h4>
                  <small style={{ color: '#64748b' }}>লগ আইডি: #{selectedLog.id}</small>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: 24, maxHeight: '75vh', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>মোবাইল নম্বর</label>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{selectedLog.mobile}</div>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>অপারেটর</label>
                  <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', color: getProviderColor(selectedLog.provider) }}>
                    {selectedLog.provider}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>তারিখ ও সময়</label>
                  <div style={{ fontSize: 13, color: '#334155' }}>
                    {selectedLog.created_at ? new Date(selectedLog.created_at).toLocaleString('bn-BD') : 'N/A'}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>ডেলিভারি স্ট্যাটাস</label>
                  <div>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                      background: selectedLog.status === 'success' ? '#ecfdf5' : '#fef2f2',
                      color: selectedLog.status === 'success' ? '#059669' : '#dc2626'
                    }}>
                      {selectedLog.status === 'success' ? 'সফল (Sent)' : 'ব্যর্থ (Failed)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Full Message Box */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', margin: 0 }}>
                    সম্পূর্ণ বার্তা (Message Body)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedLog.message || '')
                      setCopied(true)
                      setTimeout(() => setCopied(false), 2000)
                    }}
                    className="btn btn-sm btn-light"
                    style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 6 }}
                  >
                    <Copy size={12} />
                    {copied ? 'কপি হয়েছে!' : 'মেসেজ কপি'}
                  </button>
                </div>
                <div style={{
                  background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10,
                  padding: 14, fontSize: 14, lineHeight: 1.6, color: '#0f172a',
                  wordBreak: 'break-word', whiteSpace: 'pre-wrap'
                }}>
                  {selectedLog.message}
                </div>
              </div>

              {/* Message ID */}
              {selectedLog.message_id && (
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 2 }}>
                    প্রোভাইডার মেসেজ ট্র্যাকিং আইডি
                  </label>
                  <code style={{ fontSize: 12, color: '#0284c7', background: '#f0f9ff', padding: '3px 8px', borderRadius: 6 }}>
                    {selectedLog.message_id}
                  </code>
                </div>
              )}

              {/* Error Message if any */}
              {selectedLog.error_message && (
                <div style={{
                  padding: 12, borderRadius: 10, marginBottom: 14,
                  background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: 13
                }}>
                  <strong>ব্যর্থতার কারণ:</strong> {selectedLog.error_message}
                </div>
              )}

              {/* Raw Gateway Response */}
              {selectedLog.raw_response && (
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>
                    সার্ভার এপিআই র-রেসপন্স (Raw Response)
                  </label>
                  <pre style={{
                    background: '#0f172a', color: '#38bdf8', padding: 12,
                    borderRadius: 8, fontSize: 11, maxHeight: 150, overflow: 'auto', margin: 0
                  }}>
                    {typeof selectedLog.raw_response === 'string'
                      ? selectedLog.raw_response
                      : JSON.stringify(selectedLog.raw_response, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div style={{ padding: '14px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', textAlign: 'right' }}>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="btn btn-sm btn-secondary"
                style={{ borderRadius: 8, padding: '6px 16px', fontWeight: 600 }}
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
