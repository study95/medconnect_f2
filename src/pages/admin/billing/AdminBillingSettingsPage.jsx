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
      setError(err?.response?.data?.message || 'Failed to load billing settings. Please retry.')
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
      setError(err?.response?.data?.message || 'Error updating billing settings. Please try again.')
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
            Billing Engine Configuration
            <span className="ab-title-badge">Global Policies</span>
          </h1>
          <p className="ab-subtitle">
            Configure system currency, tax rates, trial &amp; grace periods, manual offline payment gateways, and legal invoice headers.
          </p>
        </div>

        <div className="ab-header-actions">
          <button
            type="button"
            onClick={loadSettings}
            className="ab-btn-refresh"
            title="Reload Config"
            aria-label="Reload billing configuration"
            disabled={loading || saving}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || loading || !hasPermission('billing.plans.manage')}
            title={!hasPermission('billing.plans.manage') ? 'Insufficient permissions' : undefined}
            className="ab-btn-primary"
            aria-label="Save billing configuration"
          >
            <Save size={16} /> {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>

      {/* ─── 2. QUICK NAVIGATION BAR ─── */}
      <nav className="ab-quick-nav" aria-label="Billing navigation">
        <Link to="/admin/billing/dashboard" className="ab-nav-pill">
          <Grid size={14} /> Analytics Dashboard
        </Link>
        <Link to="/admin/billing/plans" className="ab-nav-pill">
          <Layers size={14} /> Plans &amp; Tiers
        </Link>
        <Link to="/admin/billing/matrix" className="ab-nav-pill">
          <Sparkles size={14} /> Feature Matrix
        </Link>
        <Link to="/admin/billing/subscribers" className="ab-nav-pill">
          <Users size={14} /> Subscribers Roster
        </Link>
        <Link to="/admin/billing/invoices" className="ab-nav-pill">
          <Receipt size={14} /> Invoices Ledger
        </Link>
        <Link to="/admin/billing/transactions" className="ab-nav-pill">
          <CreditCard size={14} /> Manual Transactions
        </Link>
        <Link to="/admin/billing/coupons" className="ab-nav-pill">
          <Tag size={14} /> Discount Coupons
        </Link>
        <Link to="/admin/billing/settings" className="ab-nav-pill active" aria-current="page">
          <Settings size={14} /> Billing Config
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
          <span>Billing parameters and gateway credentials successfully saved and applied system-wide!</span>
        </div>
      )}

      {/* ─── ERROR BANNER ─── */}
      {error && (
        <div className="ab-error-state" role="alert">
          <AlertTriangle size={20} />
          <span>{error}</span>
          <button onClick={loadSettings} className="ab-btn-secondary">Retry</button>
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
            <DollarSign size={14} /> Financial Rules
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('lifecycle')}
            className={`ab-segmented-btn ${activeTab === 'lifecycle' ? 'active' : ''}`}
          >
            <Clock size={14} /> Subscription Policies
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`ab-segmented-btn ${activeTab === 'manual' ? 'active' : ''}`}
          >
            <Smartphone size={14} /> Offline Payment Gateways
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('invoice')}
            className={`ab-segmented-btn ${activeTab === 'invoice' ? 'active' : ''}`}
          >
            <FileText size={14} /> Invoice Legal Branding
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
                Currency & Taxation Parameters
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--ab-text-muted)', margin: '0 0 20px 0' }}>
                Define platform currency symbols, standard VAT rates, and invoice numbering sequence format.
              </p>

              <div className="ab-form-row">
                <div className="ab-form-group">
                  <label className="ab-form-label">Base Operating Currency *</label>
                  <input
                    type="text"
                    required
                    value={form.default_currency}
                    onChange={(e) => setForm({ ...form, default_currency: e.target.value.toUpperCase() })}
                    className="ab-form-input"
                  />
                  <span style={{ fontSize: '11.5px', color: 'var(--ab-text-dim)' }}>Default: BDT (Bangladeshi Taka)</span>
                </div>

                <div className="ab-form-group">
                  <label className="ab-form-label">Standard VAT / Tax Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={form.tax_rate_percent}
                    onChange={(e) => setForm({ ...form, tax_rate_percent: parseFloat(e.target.value) || 0 })}
                    className="ab-form-input"
                  />
                  <span style={{ fontSize: '11.5px', color: 'var(--ab-text-dim)' }}>Applied automatically during invoice calculation</span>
                </div>
              </div>

              <div className="ab-form-group">
                <label className="ab-form-label">Invoice Number Prefix</label>
                <input
                  type="text"
                  value={form.invoice_prefix}
                  onChange={(e) => setForm({ ...form, invoice_prefix: e.target.value })}
                  placeholder="e.g. INV-"
                  className="ab-form-input"
                  style={{ fontFamily: 'monospace' }}
                />
                <span style={{ fontSize: '11.5px', color: 'var(--ab-text-dim)' }}>Generates numbers such as INV-2026-0001</span>
              </div>
            </div>
          )}

          {/* TAB 2: SUBSCRIPTION POLICIES */}
          {activeTab === 'lifecycle' && (
            <div style={{ background: 'var(--ab-card)', border: '1px solid var(--ab-border)', borderRadius: '16px', padding: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--ab-text)' }}>
                Subscription Lifecycle & Grace Periods
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--ab-text-muted)', margin: '0 0 20px 0' }}>
                Determine evaluation durations, grace period tolerances, and automated renewal retry schedules.
              </p>

              <div className="ab-form-row">
                <div className="ab-form-group">
                  <label className="ab-form-label">Default Free Trial Duration (Days)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.trial_period_days}
                    onChange={(e) => setForm({ ...form, trial_period_days: parseInt(e.target.value) || 0 })}
                    className="ab-form-input"
                  />
                  <span style={{ fontSize: '11.5px', color: 'var(--ab-text-dim)' }}>Standard trial days granted to new registrations</span>
                </div>

                <div className="ab-form-group">
                  <label className="ab-form-label">Grace Period Threshold (Days)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.grace_period_days}
                    onChange={(e) => setForm({ ...form, grace_period_days: parseInt(e.target.value) || 0 })}
                    className="ab-form-input"
                  />
                  <span style={{ fontSize: '11.5px', color: 'var(--ab-text-dim)' }}>Days after expiry before services are suspended</span>
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
                  Automatically retry past due subscriptions on queue schedule
                </label>
              </div>
            </div>
          )}

          {/* TAB 3: MANUAL & OFFLINE PAYMENT GATEWAYS */}
          {activeTab === 'manual' && (
            <div style={{ background: 'var(--ab-card)', border: '1px solid var(--ab-border)', borderRadius: '16px', padding: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--ab-text)' }}>
                Offline Payment Channels & Merchant Credentials
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--ab-text-muted)', margin: '0 0 20px 0' }}>
                Configure mobile financial services numbers (bKash, Nagad, Rocket) and corporate bank accounts for manual slip deposits.
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
                  Enable Offline Manual Payments in Checkout & Subscription Portal
                </label>
              </div>

              <div className="ab-form-row">
                <div className="ab-form-group">
                  <label className="ab-form-label">Payment Amount Tolerance (BDT)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.manual_payment_amount_tolerance}
                    onChange={(e) => setForm({ ...form, manual_payment_amount_tolerance: parseFloat(e.target.value) || 0 })}
                    className="ab-form-input"
                  />
                  <span style={{ fontSize: '11.5px', color: 'var(--ab-text-dim)' }}>Allow minor variance between calculated & submitted amounts</span>
                </div>

                <div className="ab-form-group">
                  <label className="ab-form-label">Slip Expiration Window (Days)</label>
                  <input
                    type="number"
                    min="1"
                    value={form.manual_payment_expiration_days}
                    onChange={(e) => setForm({ ...form, manual_payment_expiration_days: parseInt(e.target.value) || 7 })}
                    className="ab-form-input"
                  />
                  <span style={{ fontSize: '11.5px', color: 'var(--ab-text-dim)' }}>Days before pending verification requests auto-expire</span>
                </div>
              </div>

              <h3 style={{ fontSize: '13.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ab-text-muted)', margin: '20px 0 12px 0' }}>
                Mobile Financial Services (MFS)
              </h3>

              <div className="ab-form-row">
                <div className="ab-form-group">
                  <label className="ab-form-label">bKash Merchant / Personal Number</label>
                  <input
                    type="text"
                    value={form.bkash_number}
                    onChange={(e) => setForm({ ...form, bkash_number: e.target.value })}
                    placeholder="017xxxxxxxx"
                    className="ab-form-input"
                  />
                </div>

                <div className="ab-form-group">
                  <label className="ab-form-label">Nagad Merchant Number</label>
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
                <label className="ab-form-label">Rocket Account Number</label>
                <input
                  type="text"
                  value={form.rocket_number}
                  onChange={(e) => setForm({ ...form, rocket_number: e.target.value })}
                  placeholder="019xxxxxxxx"
                  className="ab-form-input"
                />
              </div>

              <h3 style={{ fontSize: '13.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ab-text-muted)', margin: '20px 0 12px 0' }}>
                Corporate Bank Transfer Details
              </h3>

              <div className="ab-form-row">
                <div className="ab-form-group">
                  <label className="ab-form-label">Bank Name</label>
                  <input
                    type="text"
                    value={form.bank_name}
                    onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                    placeholder="e.g. City Bank / Brac Bank"
                    className="ab-form-input"
                  />
                </div>

                <div className="ab-form-group">
                  <label className="ab-form-label">Account Holder Name</label>
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
                  <label className="ab-form-label">Account Number</label>
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
                  <label className="ab-form-label">Branch & Routing Code</label>
                  <input
                    type="text"
                    value={form.bank_branch}
                    onChange={(e) => setForm({ ...form, bank_branch: e.target.value })}
                    placeholder="Gulshan Branch (Routing: 2252...)"
                    className="ab-form-input"
                  />
                </div>
              </div>

              <div className="ab-form-group">
                <label className="ab-form-label">Customer Checkout Instructions</label>
                <textarea
                  rows={3}
                  value={form.manual_payment_instructions}
                  onChange={(e) => setForm({ ...form, manual_payment_instructions: e.target.value })}
                  placeholder="Instructions displayed to doctors and hospitals when choosing offline manual transfer..."
                  className="ab-form-textarea"
                />
              </div>
            </div>
          )}

          {/* TAB 4: INVOICE BRANDING */}
          {activeTab === 'invoice' && (
            <div style={{ background: 'var(--ab-card)', border: '1px solid var(--ab-border)', borderRadius: '16px', padding: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--ab-text)' }}>
                Legal Invoice Entity Details
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--ab-text-muted)', margin: '0 0 20px 0' }}>
                Information printed on customer tax invoices, receipts, and PDF exports.
              </p>

              <div className="ab-form-group">
                <label className="ab-form-label">Company Legal Name</label>
                <input
                  type="text"
                  value={form.invoice_company_name}
                  onChange={(e) => setForm({ ...form, invoice_company_name: e.target.value })}
                  placeholder="MedConnect Healthcare Solutions Ltd."
                  className="ab-form-input"
                />
              </div>

              <div className="ab-form-group">
                <label className="ab-form-label">Registered Headquarters Address</label>
                <textarea
                  rows={2}
                  value={form.invoice_company_address}
                  onChange={(e) => setForm({ ...form, invoice_company_address: e.target.value })}
                  placeholder="Plot #12, Road #4, Banani, Dhaka-1213, Bangladesh"
                  className="ab-form-textarea"
                />
              </div>

              <div className="ab-form-row">
                <div className="ab-form-group">
                  <label className="ab-form-label">Tax / BIN / TIN Identification Number</label>
                  <input
                    type="text"
                    value={form.invoice_company_tax_id}
                    onChange={(e) => setForm({ ...form, invoice_company_tax_id: e.target.value })}
                    placeholder="BIN: 002345678-0101"
                    className="ab-form-input"
                  />
                </div>

                <div className="ab-form-group">
                  <label className="ab-form-label">Billing Support Email / Hotline</label>
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
              title={!hasPermission('billing.plans.manage') ? 'Insufficient permissions' : undefined}
              className="ab-btn-primary"
              style={{ padding: '10px 24px', fontSize: '14px' }}
              aria-label="Save billing configuration"
            >
              {saving ? (
                <>
                  <RefreshCw size={15} className="animate-spin" /> Saving Changes...
                </>
              ) : (
                <>
                  <Save size={16} /> Save Configuration
                </>
              )}
            </button>
          </div>

        </form>
      )}
    </div>
  )
}
