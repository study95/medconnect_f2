import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getAdminGateways,
  toggleAdminGateway,
  setAdminGatewaySandbox,
  updateAdminGatewayMerchant,
  updateAdminGatewayCredentials,
  clearAdminGatewayCredentials,
  getBillingSettings,
  updateBillingSettings,
} from '../../../api/billingAdminApi'
import AdminBillingTabs from '../../../components/admin/AdminBillingTabs'
import {
  Shield,
  Zap,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Lock,
  Unlock,
  Smartphone,
  Globe,
  Key,
  Trash2,
  Save,
  ToggleLeft,
  ToggleRight,
  Settings,
  Building2,
} from 'lucide-react'
import '../../../styles/admin-billing.css'

// ── Gateway metadata (labels, icons, credential field definitions) ────────────
const GATEWAY_META = {
  bkash_checkout: {
    label: 'bKash',
    labelBn: 'বিকাশ',
    color: '#E2136E',
    bgColor: 'rgba(226,19,110,0.08)',
    borderColor: 'rgba(226,19,110,0.25)',
    description: 'bKash Tokenized Checkout API v1.2.0-beta — মোবাইল পেমেন্ট গেটওয়ে',
    credentialFields: [
      { key: 'app_key',    label: 'App Key',    placeholder: 'bKash App Key',    type: 'text' },
      { key: 'app_secret', label: 'App Secret', placeholder: 'bKash App Secret', type: 'password' },
      { key: 'username',   label: 'Username',   placeholder: 'bKash API Username', type: 'text' },
      { key: 'password',   label: 'Password',   placeholder: 'bKash API Password', type: 'password' },
    ],
  },
  nagad_pg: {
    label: 'Nagad',
    labelBn: 'নগদ',
    color: '#F05A28',
    bgColor: 'rgba(240,90,40,0.08)',
    borderColor: 'rgba(240,90,40,0.25)',
    description: 'Nagad Payment Gateway API — মোবাইল ফিন্যান্সিয়াল সার্ভিস',
    credentialFields: [
      { key: 'merchant_id',         label: 'Merchant ID',         placeholder: 'Nagad Merchant ID',          type: 'text' },
      { key: 'merchant_public_key', label: 'Merchant Public Key', placeholder: 'RSA Public Key (Base64)',     type: 'textarea' },
      { key: 'merchant_private_key',label: 'Merchant Private Key',placeholder: 'RSA Private Key (Base64)',   type: 'textarea' },
      { key: 'nagad_public_key',    label: 'Nagad Public Key',    placeholder: 'Nagad RSA Public Key (Base64)', type: 'textarea' },
    ],
  },
  manual_offline: {
    label: 'Manual Transfer',
    labelBn: 'ম্যানুয়াল ট্রান্সফার',
    color: '#3B82F6',
    bgColor: 'rgba(59,130,246,0.08)',
    borderColor: 'rgba(59,130,246,0.25)',
    description: 'ব্যাংক/মোবাইল ট্রান্সফার — স্লিপ আপলোড ও অ্যাডমিন অনুমোদন',
    credentialFields: [], // No API credentials needed
  },
  sslcommerz: {
    label: 'SSLCommerz',
    labelBn: 'এসএসএল কমার্জ',
    color: '#00A651',
    bgColor: 'rgba(0,166,81,0.08)',
    borderColor: 'rgba(0,166,81,0.25)',
    description: 'SSLCommerz Payment Gateway — কার্ড ও MFS পেমেন্ট',
    credentialFields: [
      { key: 'store_id',       label: 'Store ID',       placeholder: 'SSLCommerz Store ID',       type: 'text' },
      { key: 'store_password', label: 'Store Password', placeholder: 'SSLCommerz Store Password', type: 'password' },
    ],
  },
}

// ── Single Gateway Card ───────────────────────────────────────────────────────
function GatewayCard({ gateway, onRefresh }) {
  const key = gateway.gateway_key
  const meta = GATEWAY_META[key] || {
    label: gateway.display_name,
    labelBn: gateway.display_name,
    color: '#64748b',
    bgColor: 'rgba(100,116,139,0.08)',
    borderColor: 'rgba(100,116,139,0.25)',
    description: '',
    credentialFields: [],
  }

  const qc = useQueryClient()
  const [expanded, setExpanded] = useState(false)
  const [tab, setTab] = useState('merchant') // 'merchant' | 'credentials'
  const [showSuccess, setShowSuccess] = useState(null)
  const [showError, setShowError] = useState(null)
  const [showCredFields, setShowCredFields] = useState({})

  // Merchant form state
  const [merchantForm, setMerchantForm] = useState({
    merchant_number: gateway.merchant_number || '',
    merchant_account_name: gateway.merchant_account_name || '',
    checkout_instructions: gateway.checkout_instructions || '',
    display_name: gateway.display_name || meta.label,
  })

  // Credential form state
  const [credForm, setCredForm] = useState(
    Object.fromEntries(meta.credentialFields.map(f => [f.key, '']))
  )

  const flash = (type, msg) => {
    if (type === 'success') { setShowSuccess(msg); setShowError(null); setTimeout(() => setShowSuccess(null), 4000) }
    else { setShowError(msg); setShowSuccess(null); setTimeout(() => setShowError(null), 6000) }
  }

  // Toggle enable/disable
  const toggleMut = useMutation({
    mutationFn: (enabled) => toggleAdminGateway(key, enabled),
    onSuccess: () => { qc.invalidateQueries(['admin', 'billing', 'gateways']); flash('success', `${meta.label} ${gateway.is_enabled ? 'নিষ্ক্রিয়' : 'সক্রিয়'} করা হয়েছে`) },
    onError: (e) => flash('error', e?.response?.data?.message || 'পরিবর্তন সংরক্ষণ হয়নি'),
  })

  // Toggle sandbox
  const sandboxMut = useMutation({
    mutationFn: (sandbox) => setAdminGatewaySandbox(key, sandbox),
    onSuccess: () => { qc.invalidateQueries(['admin', 'billing', 'gateways']); flash('success', `${meta.label} ${gateway.is_sandbox ? 'Production' : 'Sandbox'} মোডে পরিবর্তিত হয়েছে`) },
    onError: (e) => flash('error', e?.response?.data?.message || 'মোড পরিবর্তন হয়নি'),
  })

  // Update merchant info
  const merchantMut = useMutation({
    mutationFn: (data) => updateAdminGatewayMerchant(key, data),
    onSuccess: () => { qc.invalidateQueries(['admin', 'billing', 'gateways']); flash('success', 'মার্চেন্ট তথ্য সংরক্ষিত হয়েছে') },
    onError: (e) => flash('error', e?.response?.data?.message || 'মার্চেন্ট তথ্য সংরক্ষণ হয়নি'),
  })

  // Update credentials
  const credMut = useMutation({
    mutationFn: (creds) => updateAdminGatewayCredentials(key, creds),
    onSuccess: () => {
      qc.invalidateQueries(['admin', 'billing', 'gateways'])
      setCredForm(Object.fromEntries(meta.credentialFields.map(f => [f.key, ''])))
      flash('success', 'API Credentials সুরক্ষিতভাবে সংরক্ষিত হয়েছে। Gateway এখন কনফিগার্ড।')
    },
    onError: (e) => flash('error', e?.response?.data?.message || e?.response?.data?.errors?.credentials?.[0] || 'Credentials সংরক্ষণ হয়নি'),
  })

  // Clear credentials
  const clearMut = useMutation({
    mutationFn: () => clearAdminGatewayCredentials(key),
    onSuccess: () => { qc.invalidateQueries(['admin', 'billing', 'gateways']); flash('success', 'Credentials মুছে ফেলা হয়েছে এবং Gateway নিষ্ক্রিয় করা হয়েছে') },
    onError: (e) => flash('error', e?.response?.data?.message || 'Credentials মুছতে পারা যায়নি'),
  })

  const isBusy = toggleMut.isPending || sandboxMut.isPending || merchantMut.isPending || credMut.isPending || clearMut.isPending

  return (
    <div style={{
      border: `1.5px solid ${gateway.is_enabled ? meta.borderColor : 'var(--ab-border)'}`,
      borderRadius: '16px',
      background: 'var(--ab-card)',
      overflow: 'hidden',
      transition: 'box-shadow 0.2s',
    }}>
      {/* ── Card Header ─────────────────────────────────── */}
      <div style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px', background: gateway.is_enabled ? meta.bgColor : 'transparent' }}>
        
        {/* Color dot */}
        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: meta.color, flexShrink: 0 }} />

        {/* Gateway name */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 800, fontSize: '15px', color: 'var(--ab-text)' }}>{meta.label}</span>
            <span style={{ fontSize: '12px', color: 'var(--ab-text-muted)', fontWeight: 500 }}>{meta.labelBn}</span>
            {gateway.is_enabled ? (
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#00b875', background: 'rgba(0,184,117,0.12)', padding: '2px 8px', borderRadius: '20px' }}>সক্রিয়</span>
            ) : (
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', background: 'rgba(148,163,184,0.12)', padding: '2px 8px', borderRadius: '20px' }}>নিষ্ক্রিয়</span>
            )}
            {gateway.is_sandbox && gateway.is_enabled && (
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.12)', padding: '2px 8px', borderRadius: '20px' }}>Sandbox</span>
            )}
            {!gateway.is_sandbox && gateway.is_enabled && (
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#ef4444', background: 'rgba(239,68,68,0.12)', padding: '2px 8px', borderRadius: '20px' }}>🔴 Production</span>
            )}
            {meta.credentialFields.length > 0 && (
              gateway.is_configured
                ? <span style={{ fontSize: '11px', color: '#00b875' }}>✓ কনফিগার্ড</span>
                : <span style={{ fontSize: '11px', color: '#f59e0b' }}>⚠ Credentials দেওয়া হয়নি</span>
            )}
          </div>
          <p style={{ fontSize: '12px', color: 'var(--ab-text-muted)', margin: '2px 0 0 0' }}>{meta.description}</p>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {/* Enable/Disable toggle */}
          <button
            onClick={() => toggleMut.mutate(!gateway.is_enabled)}
            disabled={isBusy}
            title={gateway.is_enabled ? 'নিষ্ক্রিয় করুন' : 'সক্রিয় করুন'}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: gateway.is_enabled ? '#00b875' : '#94a3b8', display: 'flex', alignItems: 'center', padding: '4px' }}
          >
            {gateway.is_enabled ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
          </button>

          {/* Expand / collapse */}
          <button
            onClick={() => setExpanded(v => !v)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ab-text-muted)', display: 'flex', alignItems: 'center', padding: '4px' }}
            title="কনফিগার করুন"
          >
            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      {/* ── Flash messages ─────────────────────────────── */}
      {(showSuccess || showError) && (
        <div style={{ padding: '8px 20px' }}>
          {showSuccess && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00b875', fontSize: '13px', fontWeight: 600 }}>
              <CheckCircle2 size={15} /> {showSuccess}
            </div>
          )}
          {showError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontSize: '13px', fontWeight: 600 }}>
              <AlertTriangle size={15} /> {showError}
            </div>
          )}
        </div>
      )}

      {/* ── Expandable config panel ─────────────────────── */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--ab-border)', padding: '20px' }}>
          
          {/* ── Sandbox/Production toggle ─── */}
          {meta.credentialFields.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', padding: '12px 16px', background: gateway.is_sandbox ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)', borderRadius: '10px', border: `1px solid ${gateway.is_sandbox ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
              <Shield size={16} color={gateway.is_sandbox ? '#f59e0b' : '#ef4444'} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--ab-text)' }}>
                  {gateway.is_sandbox ? '⚡ Sandbox Mode (টেস্ট)' : '🔴 Production Mode (লাইভ)'}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--ab-text-muted)' }}>
                  {gateway.is_sandbox
                    ? 'এখন টেস্ট মোডে আছে — কোনো বাস্তব টাকা কাটবে না'
                    : 'Production মোডে আছে — বাস্তব টাকা লেনদেন হবে'}
                </div>
              </div>
              <button
                onClick={() => sandboxMut.mutate(!gateway.is_sandbox)}
                disabled={isBusy}
                style={{
                  padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '12px',
                  background: gateway.is_sandbox ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                  color: gateway.is_sandbox ? '#ef4444' : '#f59e0b',
                }}
              >
                {gateway.is_sandbox ? 'Production-এ Switch করুন' : 'Sandbox-এ ফিরুন'}
              </button>
            </div>
          )}

          {/* ── Tab buttons ─── */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '18px' }}>
            <button
              onClick={() => setTab('merchant')}
              style={{
                padding: '7px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '12.5px',
                background: tab === 'merchant' ? meta.color : 'var(--ab-card-header)',
                color: tab === 'merchant' ? '#fff' : 'var(--ab-text-muted)',
              }}
            >
              <Smartphone size={13} style={{ marginRight: '5px', verticalAlign: 'middle' }} />
              মার্চেন্ট তথ্য
            </button>
            {meta.credentialFields.length > 0 && (
              <button
                onClick={() => setTab('credentials')}
                style={{
                  padding: '7px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '12.5px',
                  background: tab === 'credentials' ? meta.color : 'var(--ab-card-header)',
                  color: tab === 'credentials' ? '#fff' : 'var(--ab-text-muted)',
                }}
              >
                <Key size={13} style={{ marginRight: '5px', verticalAlign: 'middle' }} />
                API Credentials
              </button>
            )}
          </div>

          {/* ── Merchant Info Tab ─── */}
          {tab === 'merchant' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="ab-form-row">
                <div className="ab-form-group">
                  <label className="ab-form-label">Display Name</label>
                  <input className="ab-form-input" value={merchantForm.display_name} onChange={e => setMerchantForm(f => ({ ...f, display_name: e.target.value }))} />
                </div>
                <div className="ab-form-group">
                  <label className="ab-form-label">Merchant Number (যা user-কে দেখাবে)</label>
                  <input className="ab-form-input" value={merchantForm.merchant_number} onChange={e => setMerchantForm(f => ({ ...f, merchant_number: e.target.value }))} placeholder="01XXXXXXXXX" />
                </div>
              </div>
              <div className="ab-form-group">
                <label className="ab-form-label">Account Holder Name</label>
                <input className="ab-form-input" value={merchantForm.merchant_account_name} onChange={e => setMerchantForm(f => ({ ...f, merchant_account_name: e.target.value }))} placeholder="DoctorBooklet Health Technologies Ltd." />
              </div>
              <div className="ab-form-group">
                <label className="ab-form-label">Checkout Instructions (user-কে দেখানো হবে)</label>
                <textarea className="ab-form-textarea" rows={3} value={merchantForm.checkout_instructions} onChange={e => setMerchantForm(f => ({ ...f, checkout_instructions: e.target.value }))} placeholder={`এই নম্বরে পেমেন্ট পাঠান এবং Transaction ID জমা দিন`} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => merchantMut.mutate(merchantForm)}
                  disabled={isBusy}
                  className="ab-btn-primary"
                  style={{ fontSize: '13px', padding: '8px 20px' }}
                >
                  {merchantMut.isPending ? <><RefreshCw size={14} className="animate-spin" /> সংরক্ষণ হচ্ছে...</> : <><Save size={14} /> তথ্য সংরক্ষণ করুন</>}
                </button>
              </div>
            </div>
          )}

          {/* ── Credentials Tab ─── */}
          {tab === 'credentials' && meta.credentialFields.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ padding: '12px 16px', background: 'rgba(99,91,255,0.08)', borderRadius: '10px', border: '1px solid rgba(99,91,255,0.2)', fontSize: '12.5px', color: 'var(--ab-text-muted)' }}>
                <Lock size={13} style={{ marginRight: '6px', verticalAlign: 'middle', color: '#635BFF' }} />
                <strong>Write-only:</strong> Credentials একবার সংরক্ষণ করলে আর দেখা যাবে না — শুধু "কনফিগার্ড" দেখাবে। পরিবর্তন করতে নতুন করে সব field পূরণ করুন।
              </div>

              {gateway.is_configured && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', background: 'rgba(0,184,117,0.08)', borderRadius: '10px', border: '1px solid rgba(0,184,117,0.2)' }}>
                  <CheckCircle2 size={15} color="#00b875" />
                  <span style={{ fontSize: '13px', color: '#00b875', fontWeight: 600 }}>এই gateway-এর credentials সংরক্ষিত আছে এবং কনফিগার্ড।</span>
                  <button
                    onClick={() => { if (window.confirm('নিশ্চিত? Credentials মুছলে Gateway নিষ্ক্রিয় হয়ে যাবে।')) clearMut.mutate() }}
                    disabled={isBusy}
                    style={{ marginLeft: 'auto', padding: '5px 12px', borderRadius: '7px', border: 'none', cursor: 'pointer', background: 'rgba(239,68,68,0.12)', color: '#ef4444', fontWeight: 700, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}
                  >
                    <Trash2 size={12} /> মুছুন
                  </button>
                </div>
              )}

              {meta.credentialFields.map(field => (
                <div key={field.key} className="ab-form-group">
                  <label className="ab-form-label">{field.label}</label>
                  <div style={{ position: 'relative' }}>
                    {field.type === 'textarea' ? (
                      <textarea
                        className="ab-form-textarea"
                        rows={3}
                        value={credForm[field.key] || ''}
                        onChange={e => setCredForm(f => ({ ...f, [field.key]: e.target.value }))}
                        placeholder={field.placeholder}
                        style={{ fontFamily: 'monospace', fontSize: '12px' }}
                      />
                    ) : (
                      <input
                        className="ab-form-input"
                        type={field.type === 'password' && !showCredFields[field.key] ? 'password' : 'text'}
                        value={credForm[field.key] || ''}
                        onChange={e => setCredForm(f => ({ ...f, [field.key]: e.target.value }))}
                        placeholder={field.placeholder}
                        style={{ fontFamily: 'monospace', paddingRight: field.type === 'password' ? '40px' : undefined }}
                      />
                    )}
                    {field.type === 'password' && (
                      <button
                        type="button"
                        onClick={() => setShowCredFields(f => ({ ...f, [field.key]: !f[field.key] }))}
                        style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ab-text-muted)' }}
                      >
                        {showCredFields[field.key] ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    )}
                  </div>
                </div>
              ))}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                <button
                  onClick={() => {
                    const filled = Object.fromEntries(
                      Object.entries(credForm).filter(([, v]) => v && v.trim())
                    )
                    credMut.mutate(filled)
                  }}
                  disabled={isBusy}
                  className="ab-btn-primary"
                  style={{ fontSize: '13px', padding: '8px 20px', background: meta.color }}
                >
                  {credMut.isPending ? <><RefreshCw size={14} className="animate-spin" /> সংরক্ষণ হচ্ছে...</> : <><Lock size={14} /> Credentials সুরক্ষিতভাবে সংরক্ষণ করুন</>}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminGatewaySettingsPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin', 'billing', 'gateways'],
    queryFn: getAdminGateways,
    select: (res) => res?.data || [],
    staleTime: 30_000,
  })

  const { data: settingsRes, refetch: refetchSettings } = useQuery({
    queryKey: ['adminBillingSettings'],
    queryFn: getBillingSettings,
  })

  const masterOnlineMut = useMutation({
    mutationFn: (enabled) => updateBillingSettings({ online_payment_enabled: enabled }),
    onSuccess: () => {
      refetchSettings()
      refetch()
    },
  })

  const isOnlineMasterEnabled = settingsRes?.data?.online_payment_enabled !== false

  const gateways = Array.isArray(data) ? data : []
  const manualGateway = gateways.find(gw => gw.gateway_key === 'manual_offline')
  const onlineGateways = gateways.filter(gw => gw.gateway_key !== 'manual_offline')

  const manualToggleMut = useMutation({
    mutationFn: (enabled) => toggleAdminGateway('manual_offline', enabled),
    onSuccess: () => refetch(),
  })

  return (
    <div className="ab-container">
      {/* Header */}
      <div className="ab-header">
        <div>
          <h1 className="ab-title">
            পেমেন্ট গেটওয়ে কন্ট্রোল প্যানেল
            <span className="ab-title-badge">Admin Only</span>
          </h1>
          <p className="ab-subtitle">
            bKash, Nagad ও অন্যান্য গেটওয়ে সক্রিয়/নিষ্ক্রিয় করুন, API credentials সুরক্ষিতভাবে সংরক্ষণ করুন এবং Sandbox/Production মোড নিয়ন্ত্রণ করুন।
          </p>
        </div>
        <div className="ab-header-actions">
          <button onClick={() => { refetchSettings(); refetch(); }} className="ab-btn-refresh" title="রিলোড করুন">
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <AdminBillingTabs />

      {/* Security notice */}
      <div style={{ padding: '14px 18px', borderRadius: '12px', background: 'rgba(99,91,255,0.07)', border: '1px solid rgba(99,91,255,0.2)', marginBottom: '20px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <Shield size={18} color="#635BFF" style={{ flexShrink: 0, marginTop: '1px' }} />
        <div>
          <div style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--ab-text)', marginBottom: '3px' }}>API Credentials সুরক্ষিত</div>
          <div style={{ fontSize: '12.5px', color: 'var(--ab-text-muted)' }}>
            সব credentials AES-256 encryption দিয়ে database-এ সংরক্ষিত হয়। একবার সেভ করলে আর দেখা যাবে না (write-only)। প্রতিটি gateway default-এ Sandbox মোডে থাকে — production-এ switch করতে আলাদাভাবে toggle করতে হবে।
          </div>
        </div>
      </div>

      {/* ── Top Master Control Cards (2 Columns Grid) ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {/* Card 1: Master Online Payment Control */}
        <div style={{
          padding: '18px 20px',
          borderRadius: '16px',
          background: isOnlineMasterEnabled ? 'rgba(0,184,117,0.06)' : 'rgba(239,68,68,0.06)',
          border: `1px solid ${isOnlineMasterEnabled ? 'rgba(0,184,117,0.25)' : 'rgba(239,68,68,0.25)'}`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: isOnlineMasterEnabled ? 'rgba(0,184,117,0.15)' : 'rgba(239,68,68,0.15)',
              color: isOnlineMasterEnabled ? '#00B875' : '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Zap size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--ab-text)' }}>
                অনলাইন পেমেন্ট মাস্টার কন্ট্রোল
              </div>
              <div style={{ fontSize: '12px', color: 'var(--ab-text-muted)', marginTop: '2px' }}>
                bKash, Nagad ও SSLCommerz মাস্টার সুইচ
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
            <span style={{
              fontSize: '12px',
              padding: '3px 10px',
              borderRadius: '6px',
              fontWeight: 700,
              background: isOnlineMasterEnabled ? 'rgba(0,184,117,0.15)' : 'rgba(239,68,68,0.15)',
              color: isOnlineMasterEnabled ? '#00B875' : '#ef4444'
            }}>
              {isOnlineMasterEnabled ? '⚡ মাস্টার অনলাইন সক্রিয় (ON)' : '🔴 মাস্টার অনলাইন বন্ধ (OFF)'}
            </span>

            <button
              onClick={() => masterOnlineMut.mutate(!isOnlineMasterEnabled)}
              disabled={masterOnlineMut.isPending}
              style={{
                padding: '7px 16px',
                borderRadius: '10px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 800,
                fontSize: '12.5px',
                background: isOnlineMasterEnabled ? '#ef4444' : '#00B875',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
              }}
            >
              {isOnlineMasterEnabled ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
              <span>{isOnlineMasterEnabled ? 'OFF করুন' : 'ON করুন'}</span>
            </button>
          </div>
        </div>

        {/* Card 2: Manual Transfer Gateway Control */}
        {manualGateway && (
          <div style={{
            padding: '18px 20px',
            borderRadius: '16px',
            background: manualGateway.is_enabled ? 'rgba(59,130,246,0.06)' : 'rgba(100,116,139,0.06)',
            border: `1px solid ${manualGateway.is_enabled ? 'rgba(59,130,246,0.25)' : 'rgba(100,116,139,0.25)'}`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: manualGateway.is_enabled ? 'rgba(59,130,246,0.15)' : 'rgba(100,116,139,0.15)',
                color: manualGateway.is_enabled ? '#3B82F6' : '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Building2 size={22} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--ab-text)' }}>
                  ম্যানুয়াল ট্রান্সফার কন্ট্রোল (Bank & Slips)
                </div>
                <div style={{ fontSize: '12px', color: 'var(--ab-text-muted)', marginTop: '2px' }}>
                  ব্যাংক জমা, ম্যানুয়াল বিকাশ/নগদ ও স্লিপ ভেরিফিকেশন
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
              <span style={{
                fontSize: '12px',
                padding: '3px 10px',
                borderRadius: '6px',
                fontWeight: 700,
                background: manualGateway.is_enabled ? 'rgba(59,130,246,0.15)' : 'rgba(100,116,139,0.15)',
                color: manualGateway.is_enabled ? '#3B82F6' : '#64748b'
              }}>
                {manualGateway.is_enabled ? '📋 ম্যানুয়াল ডিপোজিট সক্রিয় (ON)' : '⚪ ম্যানুয়াল ডিপোজিট বন্ধ (OFF)'}
              </span>

              <button
                onClick={() => manualToggleMut.mutate(!manualGateway.is_enabled)}
                disabled={manualToggleMut.isPending}
                style={{
                  padding: '7px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 800,
                  fontSize: '12.5px',
                  background: manualGateway.is_enabled ? '#ef4444' : '#3B82F6',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                }}
              >
                {manualGateway.is_enabled ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                <span>{manualGateway.is_enabled ? 'OFF করুন' : 'ON করুন'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Online Gateway Sub-List (bKash, Nagad, SSLCommerz) ── */}
      <div style={{ marginTop: '16px' }}>
        <h3 style={{ fontWeight: 800, fontSize: '14.5px', marginBottom: '14px', color: 'var(--ab-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Zap size={16} style={{ color: '#00B875' }} />
          <span>ইনস্ট্যান্ট অনলাইন গেটওয়ে চ্যানেল কনফিগারেশন:</span>
        </h3>

        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: '72px', background: 'var(--ab-card)', border: '1px solid var(--ab-border)', borderRadius: '16px' }} className="ab-skeleton" />
            ))}
          </div>
        ) : error ? (
          <div className="ab-error-state">
            <AlertTriangle size={20} />
            <span>Gateway তথ্য লোড হয়নি: {error?.message || 'অজানা ত্রুটি'}</span>
            <button onClick={() => refetch()} className="ab-btn-secondary">পুনরায় চেষ্টা করুন</button>
          </div>
        ) : !isOnlineMasterEnabled ? (
          <div style={{
            padding: '32px 20px',
            borderRadius: '16px',
            background: 'rgba(239, 68, 68, 0.04)',
            border: '1px dashed rgba(239, 68, 68, 0.25)',
            textAlign: 'center',
            color: 'var(--ab-text-muted)'
          }}>
            <Lock size={30} style={{ opacity: 0.5, marginBottom: '8px', color: '#ef4444' }} />
            <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--ab-text)' }}>
              অনলাইন পেমেন্ট মাস্টার কন্ট্রোল বন্ধ রাখা হয়েছে
            </div>
            <div style={{ fontSize: '12.5px', marginTop: '4px', color: 'var(--ab-text-muted)' }}>
              নিচের অনলাইন গেটওয়েসমূহ (bKash, Nagad, SSLCommerz) কনফিগার বা টগল করতে উপরের "Master Online ON" বাটনে ক্লিক করুন।
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {onlineGateways.map(gw => (
              <GatewayCard key={gw.gateway_key} gateway={gw} onRefresh={refetch} />
            ))}
            {onlineGateways.length === 0 && (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--ab-text-muted)' }}>
                <Settings size={32} style={{ opacity: 0.3, marginBottom: '10px' }} />
                <p>কোনো অনলাইন গেটওয়ে তথ্য পাওয়া যায়নি।</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Webhook reference */}
      <div style={{ marginTop: '28px', padding: '18px', background: 'var(--ab-card)', border: '1px solid var(--ab-border)', borderRadius: '16px' }}>
        <h3 style={{ fontWeight: 800, fontSize: '14px', margin: '0 0 12px 0', color: 'var(--ab-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Globe size={15} /> Webhook / IPN URL (Gateway Dashboard-এ দিন)
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px', fontFamily: 'monospace' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: '#E2136E', fontWeight: 700, minWidth: '60px' }}>bKash:</span>
            <code style={{ background: 'var(--ab-card-header)', padding: '4px 10px', borderRadius: '6px', color: 'var(--ab-text)' }}>
              {window.location.origin}/api/v1/webhook/bkash
            </code>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: '#F05A28', fontWeight: 700, minWidth: '60px' }}>Nagad:</span>
            <code style={{ background: 'var(--ab-card-header)', padding: '4px 10px', borderRadius: '6px', color: 'var(--ab-text)' }}>
              {window.location.origin}/api/v1/webhook/nagad
            </code>
          </div>
        </div>
      </div>
    </div>
  )
}
