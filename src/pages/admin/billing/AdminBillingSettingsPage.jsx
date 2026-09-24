import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getBillingSettings, updateBillingSettings } from '../../../api/billingAdminApi'
import { useAuth } from '../../../context/AuthContext'
import {
  Settings,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Grid,
  Layers,
  Sparkles,
  Users,
  Receipt,
  CreditCard,
  Tag,
  DollarSign,
  Clock,
  Smartphone,
  Building,
  FileText,
  ShieldCheck,
} from 'lucide-react'
import '../../../styles/admin-billing.css'


export default function AdminBillingSettingsPage() {
  const { hasPermission } = useAuth()

  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('financial') // 'financial' | 'lifecycle' | 'manual' | 'invoice'

  const [form, setForm] = useState({
    default_currency: 'BDT',
    tax_rate_percent: 0,
    invoice_prefix: 'INV-',
    trial_period_days: 14,
    grace_period_days: 7,
    auto_retry_past_due: true,
    invoice_company_name: '',
    invoice_company_address: '',
    invoice_company_tax_id: '',
    offline_instructions: '',
    // Phase 4.4 Enterprise Manual Billing
    manual_payment_enabled: true,
    manual_payment_amount_tolerance: 0,
    manual_payment_expiration_days: 7,
    manual_payment_instructions: '',
    bkash_number: '',
    nagad_number: '',
    rocket_number: '',
    bank_name: '',
    bank_account_name: '',
    bank_account_number: '',
    bank_branch: '',
    bank_routing_number: '',
    support_contact: '',
  })

  const loadSettings = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await getBillingSettings()
      const d = res.data || {}
      setSettings(d)
      setForm({
        default_currency: d.default_currency || 'BDT',
        tax_rate_percent: d.tax_rate_percent || 0,
        invoice_prefix: d.invoice_prefix || 'INV-',
        trial_period_days: d.trial_period_days || 14,
        grace_period_days: d.grace_period_days || 7,
        auto_retry_past_due: d.auto_retry_past_due ?? true,
        invoice_company_name: d.invoice_company_name || '',
        invoice_company_address: d.invoice_company_address || '',
        invoice_company_tax_id: d.invoice_company_tax_id || '',
        offline_instructions: d.offline_instructions || '',
        manual_payment_enabled: d.manual_payment_enabled ?? true,
        manual_payment_amount_tolerance: d.manual_payment_amount_tolerance ?? 0,
        manual_payment_expiration_days: d.manual_payment_expiration_days ?? 7,
        manual_payment_instructions: d.manual_payment_instructions || '',
        bkash_number: d.bkash_number || '',
        nagad_number: d.nagad_number || '',
        rocket_number: d.rocket_number || '',
        bank_name: d.bank_name || '',
        bank_account_name: d.bank_account_name || '',
        bank_account_number: d.bank_account_number || '',
        bank_branch: d.bank_branch || '',
        bank_routing_number: d.bank_routing_number || '',
        support_contact: d.support_contact || '',
      })
    } catch (err) {
      setError(err?.response?.data?.message || 'বিলিং কনফিগারেশন লোড করতে ব্যর্থ হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)
      setSavedSuccess(false)
      setError(null)
      await updateBillingSettings(form)
      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 4000)

    } catch (err) {
      setError(err?.response?.data?.message || 'বিলিং কনফিগারেশন সংরক্ষণে ত্রুটি হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="ab-container">
      {/* ─── 1. PAGE HEADER ─── */}
      <div className="ab-header">
        <div>
          <h1 className="ab-title">
            বিলিং ইঞ্জিন কনফিগারেশন
            <span className="ab-title-badge">সার্বজনীন নীতিমালা</span>
          </h1>
          <p className="ab-subtitle">
            সিস্টেমের মুদ্রা, ভ্যাট/ট্যাক্স হার, ট্রায়াল ও গ্রেস পিরিয়ড, অফলাইন পেমেন্ট গেটওয়ে এবং লিগ্যাল ইনভয়েসের তথ্য কনফিগার করুন।
          </p>
        </div>

        <div className="ab-header-actions">
          <button
            type="button"
            onClick={loadSettings}
            className="ab-btn-refresh"
            title="কনফিগ রিলোড করুন"
            aria-label="Reload billing configuration"
            disabled={loading || saving}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || loading || !hasPermission('billing.plans.manage')}
            title={!hasPermission('billing.plans.manage') ? 'পর্যাপ্ত অনুমতি নেই' : undefined}
            className="ab-btn-primary"
            aria-label="Save billing configuration"
          >
            <Save size={16} /> {saving ? 'সংরক্ষণ হচ্ছে...' : 'কনফিগারেশন সংরক্ষণ করুন'}
          </button>
        </div>
      </div>

      {/* ─── 2. QUICK NAVIGATION BAR ─── */}
      <nav className="ab-quick-nav" aria-label="Billing navigation">
        <Link to="/admin/billing/dashboard" className="ab-nav-pill">
          <Grid size={14} /> অ্যানালিটিক্স ড্যাশবোর্ড
        </Link>
        <Link to="/admin/billing/plans" className="ab-nav-pill">
          <Layers size={14} /> প্ল্যান ও টিয়ার
        </Link>
        <Link to="/admin/billing/matrix" className="ab-nav-pill">
          <Sparkles size={14} /> ফিচার ম্যাট্রিক্স
        </Link>
        <Link to="/admin/billing/subscribers" className="ab-nav-pill">
          <Users size={14} /> গ্রাহক তালিকা
        </Link>
        <Link to="/admin/billing/invoices" className="ab-nav-pill">
          <Receipt size={14} /> ইনভয়েস লেজার
        </Link>
        <Link to="/admin/billing/transactions" className="ab-nav-pill">
          <CreditCard size={14} /> ম্যানুয়াল লেনদেন
        </Link>
        <Link to="/admin/billing/coupons" className="ab-nav-pill">
          <Tag size={14} /> ডিসকাউন্ট কুপন
        </Link>
        <Link to="/admin/billing/settings" className="ab-nav-pill active" aria-current="page">
          <Settings size={14} /> বিলিং কনফিগারেশন
        </Link>
      </nav>

      {/* ─── SUCCESS ALERT BANNER ─── */}
      {savedSuccess && (
        <div
          role="status"
          aria-live="polite"
          className="ab-fade-in"
          style={{
            padding: '14px 18px',
            borderRadius: '12px',
            marginBottom: '20px',
            fontSize: '13.5px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(0, 184, 117, 0.12)',
            color: '#00b875',
            border: '1px solid rgba(0, 184, 117, 0.3)',
          }}
        >
          <CheckCircle2 size={18} />
          <span>বিলিং প্যারামিটার ও পেমেন্ট গেটওয়ের তথ্য সফলভাবে সংরক্ষিত হয়েছে এবং সমগ্র সিস্টেমে কার্যকর করা হয়েছে!</span>
        </div>
      )}

      {/* ─── ERROR BANNER ─── */}
      {error && (
        <div className="ab-error-state" role="alert">
          <AlertTriangle size={20} />
          <span>{error}</span>
          <button onClick={loadSettings} className="ab-btn-secondary">পুনরায় চেষ্টা করুন</button>
        </div>
      )}

      {/* ─── 3. TAB NAVIGATION ─── */}
      <div className="ab-toolbar" style={{ marginBottom: '24px' }}>
        <div className="ab-segmented-group">
          <button
            type="button"
            onClick={() => setActiveTab('financial')}
            className={`ab-segmented-btn ${activeTab === 'financial' ? 'active' : ''}`}
          >
            <DollarSign size={14} /> আর্থিক নীতিমালা
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('lifecycle')}
            className={`ab-segmented-btn ${activeTab === 'lifecycle' ? 'active' : ''}`}
          >
            <Clock size={14} /> সাবস্ক্রিপশন নীতি
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`ab-segmented-btn ${activeTab === 'manual' ? 'active' : ''}`}
          >
            <Smartphone size={14} /> অফলাইন পেমেন্ট গেটওয়ে
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('invoice')}
            className={`ab-segmented-btn ${activeTab === 'invoice' ? 'active' : ''}`}
          >
            <FileText size={14} /> ইনভয়েস লিগ্যাল ব্র্যান্ডিং
          </button>
        </div>
      </div>

      {/* ─── 4. SETTINGS PANELS ─── */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ height: '180px', background: 'var(--ab-card)', border: '1px solid var(--ab-border)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="ab-skeleton ab-skeleton-text" style={{ width: '40%', height: '18px' }} />
            <div className="ab-skeleton ab-skeleton-text" style={{ width: '65%', height: '13px' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '4px' }}>
              <div className="ab-skeleton" style={{ height: '40px', borderRadius: '8px' }} />
              <div className="ab-skeleton" style={{ height: '40px', borderRadius: '8px' }} />
            </div>
          </div>
          <div style={{ height: '80px', background: 'var(--ab-card)', border: '1px solid var(--ab-border)', borderRadius: '16px', padding: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="ab-skeleton" style={{ width: '36px', height: '36px', borderRadius: '8px', flexShrink: 0 }} />
            <div className="ab-skeleton ab-skeleton-text" style={{ width: '55%' }} />
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="ab-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* TAB 1: FINANCIAL RULES */}
          {activeTab === 'financial' && (
            <div style={{ background: 'var(--ab-card)', border: '1px solid var(--ab-border)', borderRadius: '16px', padding: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--ab-text)' }}>
                মুদ্রা ও কর সংক্রান্ত প্যারামিটার
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--ab-text-muted)', margin: '0 0 20px 0' }}>
                প্ল্যাটফর্মের মুদ্রা প্রতীক, স্ট্যান্ডার্ড ভ্যাট হার এবং ইনভয়েস ক্রমিক নম্বরের প্রিফিক্স নির্ধারণ করুন।
              </p>

              <div className="ab-form-row">
                <div className="ab-form-group">
                  <label className="ab-form-label">মূল অপারেটিং মুদ্রা (Currency) *</label>
                  <input
                    type="text"
                    required
                    value={form.default_currency}
                    onChange={(e) => setForm({ ...form, default_currency: e.target.value.toUpperCase() })}
                    className="ab-form-input"
                  />
                  <span style={{ fontSize: '11.5px', color: 'var(--ab-text-dim)' }}>ডিফল্ট: BDT (বাংলাদেশী টাকা)</span>
                </div>

                <div className="ab-form-group">
                  <label className="ab-form-label">স্ট্যান্ডার্ড ভ্যাট / ট্যাক্স হার (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={form.tax_rate_percent}
                    onChange={(e) => setForm({ ...form, tax_rate_percent: parseFloat(e.target.value) || 0 })}
                    className="ab-form-input"
                  />
                  <span style={{ fontSize: '11.5px', color: 'var(--ab-text-dim)' }}>ইনভয়েস গণনার সময় স্বয়ংক্রিয়ভাবে যুক্ত হবে</span>
                </div>
              </div>

              <div className="ab-form-group">
                <label className="ab-form-label">ইনভয়েস নম্বরের প্রিফিক্স</label>
                <input
                  type="text"
                  value={form.invoice_prefix}
                  onChange={(e) => setForm({ ...form, invoice_prefix: e.target.value })}
                  placeholder="যেমন: INV-"
                  className="ab-form-input"
                  style={{ fontFamily: 'monospace' }}
                />
                <span style={{ fontSize: '11.5px', color: 'var(--ab-text-dim)' }}>যেমন: INV-2026-0001 আকারে ইনভয়েস নম্বর তৈরি হবে</span>
              </div>
            </div>
          )}

          {/* TAB 2: SUBSCRIPTION POLICIES */}
          {activeTab === 'lifecycle' && (
            <div style={{ background: 'var(--ab-card)', border: '1px solid var(--ab-border)', borderRadius: '16px', padding: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--ab-text)' }}>
                সাবস্ক্রিপশন মেয়াদকাল ও গ্রেস পিরিয়ড
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--ab-text-muted)', margin: '0 0 20px 0' }}>
                মূল্যায়ন ট্রায়াল সময়সীমা, গ্রেস পিরিয়ড সহনশীলতা এবং স্বয়ংক্রিয় নবায়ন রুটিন নির্ধারণ করুন।
              </p>

              <div className="ab-form-row">
                <div className="ab-form-group">
                  <label className="ab-form-label">ডিফল্ট ফ্রি ট্রায়াল সময়সীমা (দিন)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.trial_period_days}
                    onChange={(e) => setForm({ ...form, trial_period_days: parseInt(e.target.value) || 0 })}
                    className="ab-form-input"
                  />
                  <span style={{ fontSize: '11.5px', color: 'var(--ab-text-dim)' }}>নতুন রেজিস্ট্রেশনে প্রদত্ত ফ্রি ট্রায়াল দিন সংখ্যা</span>
                </div>

                <div className="ab-form-group">
                  <label className="ab-form-label">গ্রেস পিরিয়ডের সীমা (দিন)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.grace_period_days}
                    onChange={(e) => setForm({ ...form, grace_period_days: parseInt(e.target.value) || 0 })}
                    className="ab-form-input"
                  />
                  <span style={{ fontSize: '11.5px', color: 'var(--ab-text-dim)' }}>মেয়াদোত্তীর্ণ হওয়ার পর সেবা স্থগিত করার পূর্ববর্তী অতিরিক্ত দিন সংখ্যা</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                <input
                  type="checkbox"
                  id="auto_retry_past_due"
                  checked={form.auto_retry_past_due}
                  onChange={(e) => setForm({ ...form, auto_retry_past_due: e.target.checked })}
                  style={{ width: '16px', height: '16px', accentColor: '#00b875' }}
                />
                <label htmlFor="auto_retry_past_due" style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--ab-text)', cursor: 'pointer' }}>
                  বকেয়া সাবস্ক্রিপশনসমূহ কিউ শিডিউলে স্বয়ংক্রিয়ভাবে পুনঃচেষ্টা করুন
                </label>
              </div>
            </div>
          )}

          {/* TAB 3: MANUAL & OFFLINE PAYMENT GATEWAYS */}
          {activeTab === 'manual' && (
            <div style={{ background: 'var(--ab-card)', border: '1px solid var(--ab-border)', borderRadius: '16px', padding: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--ab-text)' }}>
                অফলাইন পেমেন্ট চ্যানেল ও মার্চেন্ট অ্যাকাউন্ট
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--ab-text-muted)', margin: '0 0 20px 0' }}>
                ম্যানুয়াল স্লিপ জমার জন্য মোবাইল ফিন্যান্সিয়াল সার্ভিস (বিকাশ, নগদ, রকেট) এবং কর্পোরেট ব্যাংক অ্যাকাউন্টের বিবরণ কনফিগার করুন।
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', padding: '12px', background: 'var(--ab-card-header)', borderRadius: '10px', border: '1px solid var(--ab-border)' }}>
                <input
                  type="checkbox"
                  id="manual_payment_enabled"
                  checked={form.manual_payment_enabled}
                  onChange={(e) => setForm({ ...form, manual_payment_enabled: e.target.checked })}
                  style={{ width: '16px', height: '16px', accentColor: '#00b875' }}
                />
                <label htmlFor="manual_payment_enabled" style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--ab-text)', cursor: 'pointer' }}>
                  চেকআউট ও সাবস্ক্রিপশন পোর্টালে অফলাইন ম্যানুয়াল পেমেন্ট চালু রাখুন
                </label>
              </div>

              <div className="ab-form-row">
                <div className="ab-form-group">
                  <label className="ab-form-label">পেমেন্ট টাকার সহনশীলতা মার্জিন (টাকা)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.manual_payment_amount_tolerance}
                    onChange={(e) => setForm({ ...form, manual_payment_amount_tolerance: parseFloat(e.target.value) || 0 })}
                    className="ab-form-input"
                  />
                  <span style={{ fontSize: '11.5px', color: 'var(--ab-text-dim)' }}>হিসাবকৃত ও জমাকৃত টাকার সামান্য পার্থক্যের অনুমোদন (যদি প্রযোজ্য হয়)</span>
                </div>

                <div className="ab-form-group">
                  <label className="ab-form-label">স্লিপ যাচাইয়ের মেয়াদকাল (দিন)</label>
                  <input
                    type="number"
                    min="1"
                    value={form.manual_payment_expiration_days}
                    onChange={(e) => setForm({ ...form, manual_payment_expiration_days: parseInt(e.target.value) || 7 })}
                    className="ab-form-input"
                  />
                  <span style={{ fontSize: '11.5px', color: 'var(--ab-text-dim)' }}>কতদিন পর পেন্ডিং ভেরিফিকেশন রিকোয়েস্ট মেয়াদোত্তীর্ণ হবে</span>
                </div>
              </div>

              <h3 style={{ fontSize: '13.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ab-text-muted)', margin: '20px 0 12px 0' }}>
                মোবাইল ফিন্যান্সিয়াল সার্ভিসেস (MFS)
              </h3>

              <div className="ab-form-row">
                <div className="ab-form-group">
                  <label className="ab-form-label">বিকাশ মার্চেন্ট / পার্সোনাল নম্বর (bKash)</label>
                  <input
                    type="text"
                    value={form.bkash_number}
                    onChange={(e) => setForm({ ...form, bkash_number: e.target.value })}
                    placeholder="017xxxxxxxx"
                    className="ab-form-input"
                  />
                </div>

                <div className="ab-form-group">
                  <label className="ab-form-label">নগদ মার্চেন্ট নম্বর (Nagad)</label>
                  <input
                    type="text"
                    value={form.nagad_number}
                    onChange={(e) => setForm({ ...form, nagad_number: e.target.value })}
                    placeholder="018xxxxxxxx"
                    className="ab-form-input"
                  />
                </div>
              </div>

              <div className="ab-form-group">
                <label className="ab-form-label">রকেট অ্যাকাউন্ট নম্বর (Rocket)</label>
                <input
                  type="text"
                  value={form.rocket_number}
                  onChange={(e) => setForm({ ...form, rocket_number: e.target.value })}
                  placeholder="019xxxxxxxx"
                  className="ab-form-input"
                />
              </div>

              <h3 style={{ fontSize: '13.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ab-text-muted)', margin: '20px 0 12px 0' }}>
                কর্পোরেট ব্যাংক ট্রান্সফার বিবরণ
              </h3>

              <div className="ab-form-row">
                <div className="ab-form-group">
                  <label className="ab-form-label">ব্যাংকের নাম</label>
                  <input
                    type="text"
                    value={form.bank_name}
                    onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                    placeholder="যেমন: City Bank / BRAC Bank / Dutch-Bangla Bank"
                    className="ab-form-input"
                  />
                </div>

                <div className="ab-form-group">
                  <label className="ab-form-label">অ্যাকাউন্ট হোল্ডারের নাম</label>
                  <input
                    type="text"
                    value={form.bank_account_name}
                    onChange={(e) => setForm({ ...form, bank_account_name: e.target.value })}
                    placeholder="MedConnect Technologies Ltd"
                    className="ab-form-input"
                  />
                </div>
              </div>

              <div className="ab-form-row">
                <div className="ab-form-group">
                  <label className="ab-form-label">অ্যাকাউন্ট নম্বর</label>
                  <input
                    type="text"
                    value={form.bank_account_number}
                    onChange={(e) => setForm({ ...form, bank_account_number: e.target.value })}
                    placeholder="1234567890"
                    className="ab-form-input"
                    style={{ fontFamily: 'monospace' }}
                  />
                </div>

                <div className="ab-form-group">
                  <label className="ab-form-label">শাখা ও রাউটিং কোড</label>
                  <input
                    type="text"
                    value={form.bank_branch}
                    onChange={(e) => setForm({ ...form, bank_branch: e.target.value })}
                    placeholder="গুলশান শাখা (রাউটিং: ২২৫২...)"
                    className="ab-form-input"
                  />
                </div>
              </div>

              <div className="ab-form-group">
                <label className="ab-form-label">গ্রাহকদের জন্য চেকআউট নির্দেশনা</label>
                <textarea
                  rows={3}
                  value={form.manual_payment_instructions}
                  onChange={(e) => setForm({ ...form, manual_payment_instructions: e.target.value })}
                  placeholder="অফলাইন ম্যানুয়াল ট্রান্সফার নির্বাচন করলে ডাক্তার ও হাসপাতালদের প্রদর্শিত নির্দেশনা..."
                  className="ab-form-textarea"
                />
              </div>
            </div>
          )}

          {/* TAB 4: INVOICE BRANDING */}
          {activeTab === 'invoice' && (
            <div style={{ background: 'var(--ab-card)', border: '1px solid var(--ab-border)', borderRadius: '16px', padding: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--ab-text)' }}>
                ইনভয়েসের লিগ্যাল প্রতিষ্ঠানের বিবরণ
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--ab-text-muted)', margin: '0 0 20px 0' }}>
                গ্রাহকের ট্যাক্স ইনভয়েস, রসিদ এবং পিডিএফ কপিতে মুদ্রিত প্রয়োজনীয় তথ্য।
              </p>

              <div className="ab-form-group">
                <label className="ab-form-label">কোম্পানির নিবন্ধিত নাম</label>
                <input
                  type="text"
                  value={form.invoice_company_name}
                  onChange={(e) => setForm({ ...form, invoice_company_name: e.target.value })}
                  placeholder="MedConnect Healthcare Solutions Ltd."
                  className="ab-form-input"
                />
              </div>

              <div className="ab-form-group">
                <label className="ab-form-label">প্রধান কার্যালয়ের নিবন্ধিত ঠিকানা</label>
                <textarea
                  rows={2}
                  value={form.invoice_company_address}
                  onChange={(e) => setForm({ ...form, invoice_company_address: e.target.value })}
                  placeholder="প্লট #১২, রোড #৪, বনানী, ঢাকা-১২১৩, বাংলাদেশ"
                  className="ab-form-textarea"
                />
              </div>

              <div className="ab-form-row">
                <div className="ab-form-group">
                  <label className="ab-form-label">ট্যাক্স / বিন / টিন (BIN / TIN) নম্বর</label>
                  <input
                    type="text"
                    value={form.invoice_company_tax_id}
                    onChange={(e) => setForm({ ...form, invoice_company_tax_id: e.target.value })}
                    placeholder="BIN: 002345678-0101"
                    className="ab-form-input"
                  />
                </div>

                <div className="ab-form-group">
                  <label className="ab-form-label">বিলিং সহায়তা ইমেইল / হটলাইন</label>
                  <input
                    type="text"
                    value={form.support_contact}
                    onChange={(e) => setForm({ ...form, support_contact: e.target.value })}
                    placeholder="billing@medconnect.com / +880 9612-xxxxxx"
                    className="ab-form-input"
                  />
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button
              type="submit"
              disabled={saving || !hasPermission('billing.plans.manage')}
              title={!hasPermission('billing.plans.manage') ? 'পর্যাপ্ত অনুমতি নেই' : undefined}
              className="ab-btn-primary"
              style={{ padding: '10px 24px', fontSize: '14px' }}
              aria-label="Save billing configuration"
            >
              {saving ? (
                <>
                  <RefreshCw size={15} className="animate-spin" /> পরিবর্তনসমূহ সংরক্ষণ হচ্ছে...
                </>
              ) : (
                <>
                  <Save size={16} /> কনফিগারেশন সংরক্ষণ করুন
                </>
              )}
            </button>
          </div>

        </form>
      )}
    </div>
  )
}
