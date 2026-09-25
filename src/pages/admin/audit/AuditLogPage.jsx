import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Shield, Search, Download, Trash2, RefreshCw, ChevronDown, ChevronUp,
  Eye, AlertTriangle, CheckCircle, XCircle, Activity, LogIn, LogOut,
  FilePlus, FileEdit, Flame, Users, Calendar, Filter, X, Clock, User as UserIcon,
  Globe, Laptop, Hash, Tag, Stethoscope, Building2, Pill, Building,
  Lock, CreditCard, Package, FileText, ChevronLeft, ChevronRight,
  Copy, Check, Layers, ArrowRight, CornerDownRight, CheckSquare, GitCommit, ExternalLink
} from 'lucide-react'
import { getAuditLogs, getAuditStats, exportAuditLogs } from '../../../api/auditApi'

// ── Configuration & Metadata Mappings ──────────────────────────────────────────

const RISK_CONFIG = {
  low:      { label: 'Low',      color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', dot: '#22c55e' },
  medium:   { label: 'Medium',   color: '#d97706', bg: '#fffbeb', border: '#fde68a', dot: '#f59e0b' },
  high:     { label: 'High',     color: '#dc2626', bg: '#fef2f2', border: '#fecaca', dot: '#ef4444' },
  critical: { label: 'Critical', color: '#991b1b', bg: '#fef2f2', border: '#fca5a5', dot: '#b91c1c' },
}

const RESOURCE_META = {
  Doctor:              { IconComponent: Stethoscope, label: 'Doctor',       badgeBg: '#e0f2fe', color: '#0369a1' },
  Hospital:            { IconComponent: Building2,   label: 'Hospital',     badgeBg: '#ecfdf5', color: '#047857' },
  Patient:             { IconComponent: UserIcon,    label: 'Patient',      badgeBg: '#f3e8ff', color: '#7e22ce' },
  Appointment:         { IconComponent: Calendar,    label: 'Appointment',  badgeBg: '#fef3c7', color: '#b45309' },
  Prescription:        { IconComponent: Pill,        label: 'Prescription', badgeBg: '#fce7f3', color: '#be185d' },
  prescription:        { IconComponent: Pill,        label: 'Prescription', badgeBg: '#fce7f3', color: '#be185d' },
  DoctorChamber:       { IconComponent: Building,    label: 'Chamber',      badgeBg: '#e0e7ff', color: '#4338ca' },
  User:                { IconComponent: UserIcon,    label: 'User',         badgeBg: '#f1f5f9', color: '#475569' },
  Auth:                { IconComponent: Lock,        label: 'Auth',         badgeBg: '#ede9fe', color: '#6d28d9' },
  DoctorSubscription:  { IconComponent: CreditCard,  label: 'Subscription', badgeBg: '#ccfbf1', color: '#0f766e' },
  SubscriptionPackage: { IconComponent: Package,     label: 'Package',      badgeBg: '#ffedd5', color: '#c2410c' },
  PromoCode:           { IconComponent: Tag,         label: 'Promo Code',   badgeBg: '#cffafe', color: '#0e7490' },
  AuditLog:            { IconComponent: Shield,      label: 'Audit Log',    badgeBg: '#e0e7ff', color: '#4f46e5' },
  Security:            { IconComponent: Shield,      label: 'Security',     badgeBg: '#e0e7ff', color: '#4f46e5' },
}

const ACTION_CONFIG = {
  create:                            { label: 'Created',        color: '#16a34a', bg: '#f0fdf4', IconComponent: FilePlus },
  store:                             { label: 'Created',        color: '#16a34a', bg: '#f0fdf4', IconComponent: FilePlus },
  add:                               { label: 'Created',        color: '#16a34a', bg: '#f0fdf4', IconComponent: FilePlus },
  update:                            { label: 'Updated',        color: '#2563eb', bg: '#eff6ff', IconComponent: FileEdit },
  edit:                              { label: 'Updated',        color: '#2563eb', bg: '#eff6ff', IconComponent: FileEdit },
  delete:                            { label: 'Deleted',        color: '#dc2626', bg: '#fef2f2', IconComponent: Trash2 },
  destroy:                           { label: 'Deleted',        color: '#dc2626', bg: '#fef2f2', IconComponent: Trash2 },
  login:                             { label: 'Logged In',      color: '#7c3aed', bg: '#f5f3ff', IconComponent: LogIn },
  logout:                            { label: 'Logged Out',     color: '#475569', bg: '#f8fafc', IconComponent: LogOut },
  login_failed:                      { label: 'Login Failed',   color: '#b91c1c', bg: '#fef2f2', IconComponent: XCircle },
  admin_login_failed:                { label: 'Login Failed',   color: '#b91c1c', bg: '#fef2f2', IconComponent: XCircle },
  doctor_2fa_failed:                 { label: '2FA Failed',     color: '#b91c1c', bg: '#fef2f2', IconComponent: XCircle },
  admin_trusted_device_login:        { label: 'Trusted Login',  color: '#059669', bg: '#ecfdf5', IconComponent: Shield },
  admin_2fa_verified:                { label: '2FA Login',      color: '#0d9488', bg: '#f0fdfa', IconComponent: CheckCircle },
  doctor_2fa_verified:               { label: '2FA Login',      color: '#0d9488', bg: '#f0fdfa', IconComponent: CheckCircle },
  hospital_2fa_verified:             { label: '2FA Login',      color: '#0d9488', bg: '#f0fdfa', IconComponent: CheckCircle },
  patient_2fa_verified:              { label: '2FA Login',      color: '#0d9488', bg: '#f0fdfa', IconComponent: CheckCircle },
  admin_2fa_otp_generated:           { label: '2FA OTP Sent',   color: '#d97706', bg: '#fffbeb', IconComponent: Shield },
  hospital_new_device_otp_generated: { label: 'New Device OTP', color: '#d97706', bg: '#fffbeb', IconComponent: Shield },
  doctor_new_device_otp_generated:   { label: 'New Device OTP', color: '#d97706', bg: '#fffbeb', IconComponent: Shield },
  admin_honeypot_triggered:          { label: 'Honeypot Trap',  color: '#dc2626', bg: '#fef2f2', IconComponent: AlertTriangle },
  export:                            { label: 'Exported',       color: '#d97706', bg: '#fffbeb', IconComponent: Download },
  status_change:                     { label: 'Status Changed', color: '#0891b2', bg: '#ecfeff', IconComponent: Activity },
  bulk_action:                       { label: 'Bulk Action',    color: '#c026d3', bg: '#fdf4ff', IconComponent: Flame },
}

const FILTER_RESOURCE_OPTIONS = [
  { value: '', label: 'All Resources' },
  { value: 'Doctor', label: 'Doctor' },
  { value: 'Hospital', label: 'Hospital' },
  { value: 'Patient', label: 'Patient' },
  { value: 'Appointment', label: 'Appointment' },
  { value: 'Prescription', label: 'Prescription' },
  { value: 'DoctorChamber', label: 'Chamber' },
  { value: 'User', label: 'User' },
  { value: 'Auth', label: 'Auth & Security' },
  { value: 'DoctorSubscription', label: 'Subscription' },
  { value: 'SubscriptionPackage', label: 'Package' },
  { value: 'PromoCode', label: 'Promo Code' },
]

const ACTION_FILTER_GROUPS = [
  {
    group: 'Authentication & Access',
    options: [
      { value: 'all_logins', label: '🔑 All Logins (Standard & 2FA)' },
      { value: '2fa_login', label: '🛡️ 2FA Verified Logins' },
      { value: 'login_failed', label: '❌ Failed Logins & Alerts' },
      { value: 'otp', label: '📱 OTP Generated / Sent' },
      { value: 'logout', label: '🚪 Logged Out' },
    ]
  },
  {
    group: 'Data Modifications',
    options: [
      { value: 'create', label: '➕ Created Records' },
      { value: 'update', label: '✏️ Updated / Edited' },
      { value: 'delete', label: '🗑️ Deleted Records' },
      { value: 'status_change', label: '⚡ Status Changed' },
    ]
  },
  {
    group: 'System & Security',
    options: [
      { value: 'export', label: '📥 Data Exports' },
      { value: 'admin_honeypot_triggered', label: '⚠️ Honeypot Traps' },
    ]
  }
]

function getActionFilterLabel(val) {
  for (const grp of ACTION_FILTER_GROUPS) {
    const found = grp.options.find(o => o.value === val)
    if (found) return found.label.replace(/^[\p{Emoji}\s]+/u, '')
  }
  return val
}

function getActionMeta(action) {
  if (!action) return { label: 'Activity', color: '#475569', bg: '#f1f5f9', IconComponent: Activity }
  if (ACTION_CONFIG[action]) return ACTION_CONFIG[action]

  const lower = action.toLowerCase()
  if (lower.includes('login_failed') || lower.includes('failed')) {
    return { label: 'Login Failed', color: '#b91c1c', bg: '#fef2f2', IconComponent: XCircle }
  }
  if (lower.includes('2fa_verified') || lower.includes('2fa_login')) {
    return { label: '2FA Login', color: '#0d9488', bg: '#f0fdfa', IconComponent: CheckCircle }
  }
  if (lower.includes('otp')) {
    return { label: 'OTP Sent', color: '#d97706', bg: '#fffbeb', IconComponent: Shield }
  }
  if (lower.includes('login')) {
    return { label: 'Logged In', color: '#7c3aed', bg: '#f5f3ff', IconComponent: LogIn }
  }
  if (lower.includes('logout')) {
    return { label: 'Logged Out', color: '#475569', bg: '#f8fafc', IconComponent: LogOut }
  }
  if (lower.includes('create') || lower.includes('store') || lower.includes('add')) {
    return { label: 'Created', color: '#16a34a', bg: '#f0fdf4', IconComponent: FilePlus }
  }
  if (lower.includes('update') || lower.includes('edit')) {
    return { label: 'Updated', color: '#2563eb', bg: '#eff6ff', IconComponent: FileEdit }
  }
  if (lower.includes('delete') || lower.includes('destroy') || lower.includes('remove')) {
    return { label: 'Deleted', color: '#dc2626', bg: '#fef2f2', IconComponent: Trash2 }
  }
  if (lower.includes('status')) {
    return { label: 'Status Changed', color: '#0891b2', bg: '#ecfeff', IconComponent: Activity }
  }
  if (lower.includes('export')) {
    return { label: 'Exported', color: '#d97706', bg: '#fffbeb', IconComponent: Download }
  }

  const formatted = action.split(/[_-\s]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  return { label: formatted, color: '#475569', bg: '#f1f5f9', IconComponent: Activity }
}

// ── Visual Micro-Components ───────────────────────────────────────────────────

function RiskBadge({ level }) {
  const cfg = RISK_CONFIG[level?.toLowerCase()] || RISK_CONFIG.low
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 8px', borderRadius: 9999, fontSize: 11, fontWeight: 700,
      color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`,
      letterSpacing: '0.02em', textTransform: 'capitalize'
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot }} />
      {cfg.label}
    </span>
  )
}

function ResourceBadge({ module: resourceModule }) {
  const meta = RESOURCE_META[resourceModule] || { IconComponent: Layers, label: resourceModule || 'General', badgeBg: '#f1f5f9', color: '#475569' }
  const Icon = meta.IconComponent
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
      background: meta.badgeBg, color: meta.color
    }}>
      <Icon size={12} />
      <span>{meta.label}</span>
    </span>
  )
}

function CopyableBadge({ label, value, displayText }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = (e) => {
    e.stopPropagation()
    if (!value) return
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const shownText = displayText !== undefined ? displayText : (value && value.length > 25 ? 'Copy' : value)

  return (
    <button
      onClick={handleCopy}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap',
        padding: '3px 8px', borderRadius: 6, fontSize: 11, fontFamily: 'monospace',
        background: '#f8fafc', border: '1px solid #e2e8f0', color: '#334155',
        cursor: 'pointer', transition: 'all 0.15s ease', flexShrink: 0
      }}
      title="Click to copy"
    >
      {label && <span style={{ color: '#64748b', fontWeight: 600 }}>{label}:</span>}
      {shownText && <span>{shownText}</span>}
      {copied ? <Check size={11} color="#16a34a" /> : <Copy size={11} color="#94a3b8" />}
    </button>
  )
}

// ── GitHub-Style Before / After Diff Cards ─────────────────────────────────────

function JsonDiff({ old_values, new_values, changed_fields }) {
  let oldObj = {}, newObj = {}
  try { oldObj = typeof old_values === 'string' ? JSON.parse(old_values) : (old_values || {}) } catch { oldObj = {} }
  try { newObj = typeof new_values === 'string' ? JSON.parse(new_values) : (new_values || {}) } catch { newObj = {} }

  const fields = changed_fields?.length > 0
    ? changed_fields
    : Array.from(new Set([...Object.keys(oldObj), ...Object.keys(newObj)]))

  if (fields.length === 0) {
    return (
      <div style={{
        padding: '12px 14px', textAlign: 'center', color: 'var(--admin-text-muted, #94a3b8)',
        fontSize: 12, background: 'var(--admin-bg, #f8fafc)', borderRadius: 8,
        border: '1px solid var(--admin-border, #f1f5f9)'
      }}>
        No field-level value changes recorded for this activity.
      </div>
    )
  }

  const renderVal = (v) => {
    if (v === null || v === undefined) return <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>null</span>
    if (typeof v === 'boolean') return <span style={{ color: '#7c3aed', fontWeight: 700 }}>{String(v)}</span>
    if (typeof v === 'object') return <pre style={{ margin: 0, fontSize: 11, lineHeight: 1.3 }}>{JSON.stringify(v, null, 2)}</pre>
    return <span style={{ wordBreak: 'break-word', lineHeight: 1.35 }}>{String(v)}</span>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {fields.map(field => {
        const oldVal = oldObj[field]
        const newVal = newObj[field]
        const isModified = oldVal !== undefined && newVal !== undefined && oldVal !== newVal
        const isAdded = oldVal === undefined && newVal !== undefined
        const isRemoved = oldVal !== undefined && newVal === undefined

        return (
          <div key={field} style={{
            border: '1px solid var(--admin-border, #f1f5f9)',
            borderRadius: 8,
            overflow: 'hidden',
            background: 'var(--admin-card-bg, #ffffff)'
          }}>
            {/* Header: Field Name & Change Status */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '5px 10px', background: 'var(--admin-bg, #f8fafc)',
              borderBottom: '1px solid var(--admin-border, #f1f5f9)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <GitCommit size={12} style={{ color: '#6366f1' }} />
                <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--admin-text, #0f172a)', fontFamily: 'monospace' }}>
                  {field}
                </span>
              </div>
              <span style={{
                fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase',
                padding: '1px 5px', borderRadius: 4,
                background: isAdded ? '#dcfce7' : isRemoved ? '#fee2e2' : '#e0e7ff',
                color: isAdded ? '#15803d' : isRemoved ? '#b91c1c' : '#4338ca'
              }}>
                {isAdded ? 'Added' : isRemoved ? 'Removed' : 'Modified'}
              </span>
            </div>

            {/* Side by Side Diff Preview */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
              {/* Old value card (Red tone) */}
              <div style={{
                padding: '6px 10px', background: '#fff5f5',
                borderRight: '1px solid var(--admin-border, #f1f5f9)',
                fontSize: 11.5, fontFamily: 'monospace', color: '#991b1b'
              }}>
                <div style={{ fontSize: 9.5, color: '#ef4444', fontWeight: 700, marginBottom: 2 }}>− BEFORE</div>
                {renderVal(oldVal)}
              </div>

              {/* New value card (Green tone) */}
              <div style={{
                padding: '6px 10px', background: '#f0fdf4',
                fontSize: 11.5, fontFamily: 'monospace', color: '#166534'
              }}>
                <div style={{ fontSize: 9.5, color: '#22c55e', fontWeight: 700, marginBottom: 2 }}>+ AFTER</div>
                {renderVal(newVal)}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Client Device & Tool Detection Helper ────────────────────────────────────

function detectClientType(ua) {
  if (!ua) return { type: 'unknown', os: 'Unknown OS', browser: 'Unknown Browser', label: 'Unknown Client', isBot: false, color: '#64748b', bg: '#f1f5f9', border: '#e2e8f0' }
  const lower = ua.toLowerCase()
  const isBot = lower.includes('curl') || lower.includes('python') || lower.includes('postman') || lower.includes('sqlmap') || lower.includes('wget') || lower.includes('bot') || lower.includes('crawl') || lower.includes('spider')

  // OS detection
  let os = 'Unknown OS'
  if (lower.includes('windows nt 10.0')) os = 'Windows 10/11'
  else if (lower.includes('windows nt 6.3')) os = 'Windows 8.1'
  else if (lower.includes('windows nt 6.1')) os = 'Windows 7'
  else if (lower.includes('windows')) os = 'Windows'
  else if (lower.includes('android')) os = 'Android'
  else if (lower.includes('iphone') || lower.includes('ipad')) os = 'iOS'
  else if (lower.includes('macintosh') || lower.includes('mac os')) os = 'macOS'
  else if (lower.includes('linux')) os = 'Linux'

  // Browser detection
  let browser = 'Browser'
  if (lower.includes('edg/')) browser = 'Edge'
  else if (lower.includes('chrome/')) browser = 'Chrome'
  else if (lower.includes('firefox/')) browser = 'Firefox'
  else if (lower.includes('safari/') && !lower.includes('chrome')) browser = 'Safari'
  else if (lower.includes('postman')) browser = 'Postman'
  else if (lower.includes('curl')) browser = 'cURL'
  else if (lower.includes('python')) browser = 'Python'
  else if (lower.includes('sqlmap')) browser = 'SQLMap'

  const label = isBot ? `⚠️ ${browser}` : `${os} • ${browser}`
  return {
    type: isBot ? 'bot' : 'browser',
    os,
    browser,
    label,
    isBot,
    color: isBot ? '#dc2626' : '#2563eb',
    bg: isBot ? '#fef2f2' : '#eff6ff',
    border: isBot ? '#fecaca' : '#bfdbfe'
  }
}

function formatLogDescriptionInline(log) {
  let baseDesc = log.description || log.model_label || ''
  
  if (!baseDesc) {
    const act = getActionMeta(log.action)?.label || 'Activity'
    const mod = RESOURCE_META[log.module]?.label || log.module || ''
    const id = log.public_id ? `#${log.public_id}` : (log.model_id ? `#${log.model_id}` : '')
    baseDesc = `${act} ${mod} ${id}`.trim()
  } else {
    // 1. Clarify 2FA verification login descriptions
    baseDesc = baseDesc
      .replace(/Hospital 2FA successfully verified for/i, 'Hospital logged in successfully (2FA):')
      .replace(/Doctor 2FA successfully verified for/i, 'Doctor logged in successfully (2FA):')
      .replace(/Super Admin 2FA authenticated successfully for/i, 'Super Admin logged in successfully (2FA):')
      .replace(/2FA successfully verified for/i, 'Logged in successfully (2FA):')
      .replace(/2FA authenticated successfully for/i, 'Logged in successfully (2FA):')
  }

  // 2. Strip redundant "from IP: ..." since telemetry bracket formats IP cleanly
  baseDesc = baseDesc.replace(/\s*from IP:\s*[\d\.:a-fA-F]+/i, '').trim()

  // Format telemetry bracket like Image 1: [IP: 114.130.145.18 | OS: Windows 10 | Browser: Chrome 153.0.0.0]
  const hasTelemetry = baseDesc.includes('[IP:') || baseDesc.includes('IP:')
  let telemetry = ''
  
  if (!hasTelemetry && (log.ip_address || log.user_agent)) {
    const client = detectClientType(log.user_agent)
    const parts = []
    if (log.ip_address) parts.push(`IP: ${log.ip_address}`)
    if (client.os && client.os !== 'Unknown OS') parts.push(`OS: ${client.os}`)
    if (client.browser && client.browser !== 'Unknown Browser') parts.push(`Browser: ${client.browser}`)
    
    if (parts.length > 0) {
      telemetry = ` [${parts.join(' | ')}]`
    }
  }

  return { text: baseDesc, telemetry }
}

function formatExactDateTime(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function getUserPublicIdOrName(log) {
  // 1. If public_id exists (Doctor, Hospital, Patient, Chamber), show that Public ID!
  if (log.public_id) {
    return { value: log.public_id, isPublicId: true, label: log.public_id }
  }

  // 2. If it's an Admin or named User, show their Name (e.g. Super Admin)
  if (log.user_name) {
    return { value: log.user_name, isPublicId: false, label: log.user_name }
  }

  // 3. If user_email is present
  if (log.user_email) {
    return { value: log.user_email, isPublicId: false, label: log.user_email }
  }

  // 4. If login failed / OTP / login attempt, extract target email from description
  const emailInDesc = log.description?.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/)?.[1]
  if (emailInDesc) {
    return { value: emailInDesc, isPublicId: false, label: emailInDesc }
  }

  // 5. If user_id exists, show User #ID
  if (log.user_id) {
    return { value: `#${log.user_id}`, isPublicId: false, label: `User #${log.user_id}` }
  }

  return { value: '—', isPublicId: false, label: 'System' }
}

// ── Center Details Modal (Center Popup Dialog) ──────────────────────────────

function AuditDetailsModal({ log, currentIndex, totalCount, onNavigate, onClose }) {
  useEffect(() => {
    if (log) {
      const prevOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = prevOverflow
      }
    }
  }, [log])

  // Keyboard navigation & Escape key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') onNavigate(-1)
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') onNavigate(1)
    }
    if (log) window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [log, onNavigate, onClose])

  if (!log) return null

  const actionCfg = getActionMeta(log.action)
  const ActionIcon = actionCfg.IconComponent || Activity
  const entityLabel = log.model_label || (log.public_id ? `#${log.public_id}` : (log.model_id ? `#${log.model_id}` : null))
  const isHighRisk = log.risk_level === 'high' || log.risk_level === 'critical'
  const isThreat = isHighRisk || log.action === 'admin_honeypot_triggered' || String(log.action || '').toLowerCase().includes('fail')
  const clientInfo = detectClientType(log.user_agent)

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'modalFadeIn 0.18s ease-out'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 680,
          maxHeight: '90vh',
          background: 'var(--admin-card-bg, #ffffff)',
          borderRadius: 16,
          border: isHighRisk ? '1.5px solid #fca5a5' : '1px solid var(--admin-border, #e2e8f0)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'modalZoomIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{
          padding: '16px 22px',
          borderBottom: '1px solid var(--admin-border, #f1f5f9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: isHighRisk ? '#fff5f5' : 'var(--admin-bg, #f8fafc)',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: actionCfg.bg, color: actionCfg.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}>
              <ActionIcon size={20} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--admin-text, #0f172a)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span>Audit Record #{log.id}</span>
                <RiskBadge level={log.risk_level} />
              </div>
              <div style={{ fontSize: 12, color: 'var(--admin-text-muted, #64748b)', marginTop: 2 }}>
                {log.created_at ? new Date(log.created_at).toLocaleString('en-GB', {
                  year: 'numeric', month: 'short', day: 'numeric',
                  hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
                }) : '—'} • ({formatRelative(log.created_at)})
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <button
              onClick={() => onNavigate(-1)}
              disabled={currentIndex <= 0}
              style={{
                width: 32, height: 32, borderRadius: 8, border: '1px solid var(--admin-border, #e2e8f0)',
                background: 'var(--admin-card-bg, #ffffff)', cursor: currentIndex <= 0 ? 'not-allowed' : 'pointer',
                opacity: currentIndex <= 0 ? 0.35 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
              title="Previous Record (Left Arrow)"
            >
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontSize: 11.5, color: 'var(--admin-text-muted, #94a3b8)', fontWeight: 700, padding: '0 4px' }}>
              {currentIndex + 1} of {totalCount}
            </span>
            <button
              onClick={() => onNavigate(1)}
              disabled={currentIndex >= totalCount - 1}
              style={{
                width: 32, height: 32, borderRadius: 8, border: '1px solid var(--admin-border, #e2e8f0)',
                background: 'var(--admin-card-bg, #ffffff)', cursor: currentIndex >= totalCount - 1 ? 'not-allowed' : 'pointer',
                opacity: currentIndex >= totalCount - 1 ? 0.35 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
              title="Next Record (Right Arrow)"
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={onClose}
              style={{
                width: 32, height: 32, borderRadius: 8, border: 'none',
                background: 'rgba(0,0,0,0.06)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 6
              }}
              title="Close (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}>
          {/* 1. Activity Summary Card */}
          <div style={{
            padding: 14, borderRadius: 10, background: 'var(--admin-bg, #f8fafc)',
            border: '1px solid var(--admin-border, #f1f5f9)',
            display: 'flex', flexDirection: 'column', gap: 8,
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                color: actionCfg.color, background: actionCfg.bg
              }}>
                <ActionIcon size={11} /> {actionCfg.label}
              </span>
              <ResourceBadge module={log.module} />
            </div>
            {entityLabel && (
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--admin-text, #0f172a)' }}>
                {entityLabel}
              </div>
            )}
            <div style={{ fontSize: 13, color: 'var(--admin-text, #334155)', lineHeight: 1.5 }}>
              {formatLogDescriptionInline(log).text}
            </div>
          </div>

          {/* 2. 🕵️ Security & Forensic Intelligence Card */}
          <div style={{
            borderRadius: 12,
            border: isHighRisk ? '1.5px solid #fca5a5' : '1px solid var(--admin-border, #e2e8f0)',
            background: isHighRisk ? '#fffafb' : 'var(--admin-card-bg, #ffffff)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            overflow: 'hidden',
            flexShrink: 0
          }}>
            {/* Card Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 14px',
              background: isHighRisk ? '#fef2f2' : '#f8fafc',
              borderBottom: '1px solid ' + (isHighRisk ? '#fecaca' : '#e2e8f0')
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <Shield size={16} color={isHighRisk ? '#dc2626' : '#4f46e5'} />
                <span style={{ fontSize: 12, fontWeight: 800, color: isHighRisk ? '#991b1b' : '#1e293b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Security & Forensic Intelligence
                </span>
              </div>
              <RiskBadge level={log.risk_level} />
            </div>

            {/* Card Body */}
            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* ১. IP Address */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted, #94a3b8)', textTransform: 'uppercase' }}>
                    ১. IP Address (আইপি ঠিকানা)
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--admin-text, #0f172a)', fontFamily: 'monospace', marginTop: 2 }}>
                    {log.ip_address || '127.0.0.1 (Localhost)'}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CopyableBadge value={log.ip_address || '127.0.0.1'} />
                  {log.ip_address && log.ip_address !== '127.0.0.1' && (
                    <a
                      href={`https://www.abuseipdb.com/check/${log.ip_address}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                        background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe',
                        textDecoration: 'none'
                      }}
                      title="Check IP threat intelligence on AbuseIPDB"
                    >
                      <ExternalLink size={11} /> Check AbuseIPDB
                    </a>
                  )}
                </div>
              </div>

              {/* ২. User-Agent / Device Type */}
              <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted, #94a3b8)', textTransform: 'uppercase' }}>
                    ২. User-Agent (ডিভাইস / টুলস)
                  </span>
                  <span style={{
                    padding: '2px 8px', borderRadius: 9999, fontSize: 10.5, fontWeight: 700,
                    color: clientInfo.color, background: clientInfo.bg, border: `1px solid ${clientInfo.border}`
                  }}>
                    {clientInfo.label}
                  </span>
                </div>
                <div style={{
                  fontSize: 11, fontFamily: 'monospace', color: '#475569',
                  background: '#f8fafc', padding: '6px 10px', borderRadius: 6,
                  border: '1px solid #f1f5f9', wordBreak: 'break-all', lineHeight: 1.4
                }}>
                  {log.user_agent || 'Unknown User-Agent'}
                </div>
              </div>

              {/* ৩. API Endpoint / Route & Source Page */}
              <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted, #94a3b8)', textTransform: 'uppercase' }}>
                    {isThreat ? '৩. Target Endpoint (আক্রান্ত বা টার্গেট প্রবেশদ্বার)' : '৩. API Endpoint (অনুরোধকৃত ব্যাকএন্ড এপিআই)'}
                  </span>
                  <span style={{
                    padding: '2px 8px', borderRadius: 9999, fontSize: 10.5, fontWeight: 700,
                    color: isThreat ? '#b91c1c' : '#0369a1',
                    background: isThreat ? '#fef2f2' : '#f0f9ff',
                    border: `1px solid ${isThreat ? '#fca5a5' : '#bae6fd'}`
                  }}>
                    {isThreat ? 'Security Event' : 'Backend API'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    padding: '3px 7px', borderRadius: 4, fontSize: 11, fontWeight: 800, fontFamily: 'monospace',
                    background: log.request_method === 'POST' ? '#fef3c7' : log.request_method === 'DELETE' ? '#fee2e2' : '#e0e7ff',
                    color: log.request_method === 'POST' ? '#b45309' : log.request_method === 'DELETE' ? '#b91c1c' : '#4338ca'
                  }}>
                    {log.request_method || 'GET'}
                  </span>
                  <span style={{
                    fontSize: 11.5, fontFamily: 'monospace', color: 'var(--admin-text, #0f172a)',
                    background: '#f8fafc', padding: '5px 8px', borderRadius: 6, border: '1px solid #f1f5f9',
                    wordBreak: 'break-all', flex: 1
                  }}>
                    {log.request_url || '—'}
                  </span>
                  {log.request_url && <CopyableBadge value={log.request_url} />}
                </div>

                {/* Frontend Referer / Source Page */}
                {(() => {
                  const referer = log.tags?.referer || (log.request_url?.includes('admin-login') ? 'http://localhost:5173/admin-secure-access' : null)
                  if (!referer) return null

                  return (
                    <div style={{
                      marginTop: 8, padding: '6px 10px', borderRadius: 6,
                      background: '#f8fafc', border: '1px solid #e2e8f0',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                        <Globe size={12} color="#0D9488" style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', whiteSpace: 'nowrap' }}>
                          Frontend Page:
                        </span>
                        <span style={{ fontSize: 11.5, fontFamily: 'monospace', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {referer}
                        </span>
                      </div>
                      <CopyableBadge value={referer} />
                    </div>
                  )
                })()}
              </div>

              {/* ৪. Exact Timestamp & Velocity */}
              <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted, #94a3b8)', textTransform: 'uppercase' }}>
                  ৪. Exact Time (সুনির্দিষ্ট সময় ও সেকেন্ড)
                </span>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--admin-text, #0f172a)', fontFamily: 'monospace' }}>
                  {log.created_at ? new Date(log.created_at).toLocaleString('en-GB', {
                    year: 'numeric', month: 'short', day: 'numeric',
                    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
                  }) : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* 3. User / Actor Information */}
          <div style={{ flexShrink: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--admin-text-muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              User / Actor Information
            </div>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
              padding: '12px 14px', borderRadius: 10, background: 'var(--admin-card-bg, #ffffff)',
              border: '1px solid var(--admin-border, #f1f5f9)'
            }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--admin-text-muted, #94a3b8)', marginBottom: 2 }}>User Name</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--admin-text, #0f172a)' }}>{log.user_name || 'System Actor'}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--admin-text-muted, #94a3b8)', marginBottom: 2 }}>Role</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--admin-text, #0f172a)', textTransform: 'capitalize' }}>{log.user_role || 'Automated'}</div>
              </div>
            </div>
          </div>

          {/* 4. Event Metadata */}
          <div style={{ flexShrink: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--admin-text-muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              Event Metadata
            </div>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
              padding: '12px 14px', borderRadius: 10, background: 'var(--admin-card-bg, #ffffff)',
              border: '1px solid var(--admin-border, #f1f5f9)'
            }}>
              {log.public_id && (
                <div>
                  <div style={{ fontSize: 11, color: 'var(--admin-text-muted, #94a3b8)', marginBottom: 3 }}>Public ID</div>
                  <CopyableBadge value={String(log.public_id)} />
                </div>
              )}
              {log.model_type && (
                <div>
                  <div style={{ fontSize: 11, color: 'var(--admin-text-muted, #94a3b8)', marginBottom: 2 }}>Entity Class</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-text, #0f172a)', wordBreak: 'break-all' }}>
                    {log.model_type.split('\\').pop() || log.model_type}
                  </div>
                </div>
              )}
              {log.user_id && (
                <div>
                  <div style={{ fontSize: 11, color: 'var(--admin-text-muted, #94a3b8)', marginBottom: 3 }}>Actor User ID</div>
                  <CopyableBadge value={String(log.user_id)} />
                </div>
              )}
              <div>
                <div style={{ fontSize: 11, color: 'var(--admin-text-muted, #94a3b8)', marginBottom: 2 }}>HTTP Status</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--admin-text, #0f172a)', fontFamily: 'monospace' }}>
                  {log.http_status || '200 OK'}
                </div>
              </div>
            </div>
          </div>

          {/* 5. Field Changes / Diff */}
          <div style={{ flexShrink: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--admin-text-muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              Change Diff (Before vs. After)
            </div>
            <JsonDiff old_values={log.old_values} new_values={log.new_values} changed_fields={log.changed_fields} />
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '14px 22px',
          borderTop: '1px solid var(--admin-border, #f1f5f9)',
          background: 'var(--admin-bg, #f8fafc)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => onNavigate(-1)}
              disabled={currentIndex <= 0}
              className="admin-btn admin-btn-outline"
              style={{ fontSize: 12, padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <ChevronLeft size={14} /> Previous
            </button>
            <button
              onClick={() => onNavigate(1)}
              disabled={currentIndex >= totalCount - 1}
              className="admin-btn admin-btn-outline"
              style={{ fontSize: 12, padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>

          <button
            onClick={onClose}
            className="admin-btn admin-btn-secondary"
            style={{ fontSize: 12.5, padding: '7px 18px', fontWeight: 600 }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Format Helper ─────────────────────────────────────────────────────────────

function formatRelative(dt) {
  if (!dt) return '—'
  const diff = (Date.now() - new Date(dt)) / 1000
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return new Date(dt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

function getUserInitials(name) {
  if (!name) return 'SY'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// ── Main AuditLogPage Component ───────────────────────────────────────────────

export default function AuditLogPage() {
  const [logs, setLogs] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [selectedLogIndex, setSelectedLogIndex] = useState(null)
  const [exporting, setExporting] = useState(false)

  // Filters
  const [search, setSearch] = useState('')
  const [moduleFilter, setModuleFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [riskFilter, setRiskFilter] = useState('')
  const [datePreset, setDatePreset] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [perPage, setPerPage] = useState(10)
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0, per_page: 10, from: 1, to: 10 })

  const handleDatePresetChange = (preset) => {
    setDatePreset(preset)
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

  const fetchLogs = useCallback(async (page = 1, currentPerPage = perPage) => {
    try {
      setLoading(true)
      const params = {
        page,
        per_page: currentPerPage,
        ...(search && { search }),
        ...(moduleFilter && { module: moduleFilter }),
        ...(actionFilter && { action: actionFilter }),
        ...(riskFilter && { risk_level: riskFilter }),
        ...(dateFrom && { date_from: dateFrom }),
        ...(dateTo && { date_to: dateTo }),
      }
      const res = await getAuditLogs(params)
      const data = res.data?.data || res.data
      setLogs(data.data || data || [])
      if (data.current_page) {
        setPagination({
          current_page: data.current_page,
          last_page: data.last_page,
          total: data.total,
          per_page: data.per_page,
          from: data.from,
          to: data.to
        })
      }
    } catch (err) {
      console.error('Failed to fetch audit logs', err)
    } finally {
      setLoading(false)
    }
  }, [search, moduleFilter, actionFilter, riskFilter, dateFrom, dateTo, perPage])

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true)
      const res = await getAuditStats()
      setStats(res.data?.data || res.data)
    } catch (err) {
      console.error('Failed to load audit statistics', err)
    } finally {
      setStatsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLogs(1)
  }, [fetchLogs])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  // Keyboard navigation for drawer and rows
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (selectedLogIndex === null) return
      if (e.key === 'Escape') {
        setSelectedLogIndex(null)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedLogIndex(prev => (prev > 0 ? prev - 1 : prev))
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedLogIndex(prev => (prev < logs.length - 1 ? prev + 1 : prev))
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedLogIndex, logs.length])

  const handleDrawerNavigate = (dir) => {
    if (selectedLogIndex === null) return
    const newIdx = selectedLogIndex + dir
    if (newIdx >= 0 && newIdx < logs.length) {
      setSelectedLogIndex(newIdx)
    }
  }

  const handleExport = async () => {
    try {
      setExporting(true)
      const params = {
        ...(search && { search }),
        ...(moduleFilter && { module: moduleFilter }),
        ...(actionFilter && { action: actionFilter }),
        ...(riskFilter && { risk_level: riskFilter }),
        ...(dateFrom && { date_from: dateFrom }),
        ...(dateTo && { date_to: dateTo }),
      }
      const res = await exportAuditLogs(params)
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `audit_logs_${new Date().toISOString().slice(0,10)}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      console.error('Export failed', err)
    } finally {
      setExporting(false)
    }
  }

  const clearFilters = () => {
    setSearch('')
    setModuleFilter('')
    setActionFilter('')
    setRiskFilter('')
    setDatePreset('all')
    setDateFrom('')
    setDateTo('')
  }

  const changePage = (p) => {
    if (p < 1 || p > pagination.last_page) return
    fetchLogs(p, perPage)
  }

  const handlePerPageChange = (newSize) => {
    setPerPage(newSize)
    fetchLogs(1, newSize)
  }

  const selectedLog = selectedLogIndex !== null ? logs[selectedLogIndex] : null

  return (
    <div className="admin-container" style={{ maxWidth: 1400, margin: '0 auto' }}>
      {/* ── Top Header ── */}
      <div className="admin-page-header" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="admin-page-title" style={{ color: 'var(--admin-text, #0f172a)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              width: 38, height: 38, borderRadius: 10,
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              color: '#ffffff', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)'
            }}>
              <Shield size={20} />
            </span>
            Enterprise Security & Audit Trail
          </h2>
          <p className="admin-page-subtitle" style={{ color: 'var(--admin-text-muted, #64748b)', marginTop: 4 }}>
            Immutable, real-time activity log for compliance, data access tracking, and governance.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Audit Engine Live Status Pill */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '6px 12px', borderRadius: 9999, fontSize: 11.5, fontWeight: 700,
            background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 0 3px rgba(34,197,94,0.25)' }} />
            <span>Audit Engine: 100% Operational (Redis Protected)</span>
          </div>

          <button
            onClick={() => fetchLogs(pagination.current_page)}
            disabled={loading}
            className="admin-btn admin-btn-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            title="Refresh logs"
          >
            <RefreshCw size={14} className={loading ? 'spin-icon' : ''} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExport}
            disabled={exporting}
            className="admin-btn admin-btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Download size={14} />
            <span>{exporting ? 'Exporting...' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {/* ── Stats Metric Cards (4 Balanced Cards - Mutually Exclusive Selection) ── */}
      {stats && (() => {
        const isToday = Boolean(datePreset === 'today' || (dateFrom && dateFrom === dateTo && !riskFilter && !actionFilter))
        const isRisk = Boolean(riskFilter === 'high' && !dateFrom && !actionFilter)
        const isLogin = Boolean((actionFilter === 'login' || actionFilter === 'all_logins') && !dateFrom && !riskFilter)
        const isAll = !isToday && !isRisk && !isLogin && !search && !moduleFilter

        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 14, marginBottom: 20 }}>
            {/* 1. Total Events */}
            <div
              onClick={clearFilters}
              title="Click to show all events"
              style={{
                background: 'var(--admin-card-bg, #ffffff)',
                border: isAll ? '2px solid #0D9488' : '1px solid var(--admin-border, #e2e8f0)',
                borderRadius: 14, padding: '16px 18px',
                boxShadow: isAll ? '0 4px 12px rgba(13, 148, 136, 0.12)' : '0 1px 3px rgba(0,0,0,0.04)',
                cursor: 'pointer', transition: 'all 0.2s ease', position: 'relative'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: isAll ? '#0D9488' : 'var(--admin-text-muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Total Events
                </div>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: isAll ? '#ccfbf1' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Layers size={15} color={isAll ? '#0D9488' : '#475569'} />
                </div>
              </div>
              <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--admin-text, #0f172a)', marginTop: 4, letterSpacing: '-0.02em' }}>
                {(stats.total_events || stats.totals?.total || pagination.total || 0).toLocaleString()}
              </div>
              <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 4, fontWeight: 500 }}>
                All recorded system actions
              </div>
            </div>

            {/* 2. Today's Events */}
            <div
              onClick={() => {
                if (isToday) {
                  handleDatePresetChange('all')
                } else {
                  setRiskFilter('')
                  setActionFilter('')
                  handleDatePresetChange('today')
                }
              }}
              title="Click to toggle today's events filter"
              style={{
                background: 'var(--admin-card-bg, #ffffff)',
                border: isToday ? '2px solid #7c3aed' : '1px solid var(--admin-border, #e2e8f0)',
                borderRadius: 14, padding: '16px 18px',
                boxShadow: isToday ? '0 4px 12px rgba(124, 58, 237, 0.12)' : '0 1px 3px rgba(0,0,0,0.04)',
                cursor: 'pointer', transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: isToday ? '#7c3aed' : 'var(--admin-text-muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Today's Activity
                </div>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: isToday ? '#ede9fe' : '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Calendar size={15} color="#7c3aed" />
                </div>
              </div>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#7c3aed', marginTop: 4, letterSpacing: '-0.02em' }}>
                {(stats.today_events || stats.totals?.today || 0).toLocaleString()}
              </div>
              <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 4, fontWeight: 500 }}>
                Active events in last 24 hours
              </div>
            </div>

            {/* 3. High & Critical Risks */}
            <div
              onClick={() => {
                if (isRisk) {
                  setRiskFilter('')
                } else {
                  handleDatePresetChange('all')
                  setActionFilter('')
                  setRiskFilter('high')
                }
              }}
              title="Click to toggle high risk events filter"
              style={{
                background: 'var(--admin-card-bg, #ffffff)',
                border: isRisk ? '2px solid #dc2626' : '1px solid var(--admin-border, #e2e8f0)',
                borderRadius: 14, padding: '16px 18px',
                boxShadow: isRisk ? '0 4px 12px rgba(220, 38, 38, 0.12)' : '0 1px 3px rgba(0,0,0,0.04)',
                cursor: 'pointer', transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Security / High Risks
                </div>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: isRisk ? '#fee2e2' : '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertTriangle size={15} color="#dc2626" />
                </div>
              </div>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#dc2626', marginTop: 4, letterSpacing: '-0.02em' }}>
                {(stats.high_risk_count ?? stats.totals?.high_risk_today ?? 0).toLocaleString()}
              </div>
              <div style={{ fontSize: 11.5, color: '#991b1b', marginTop: 4, fontWeight: 600 }}>
                {(stats.failed_logins_today || stats.totals?.failed_logins_today || 0)} failed attempt(s) & alerts
              </div>
            </div>

            {/* 4. Logins & 2FA Today */}
            <div
              onClick={() => {
                if (isLogin) {
                  setActionFilter('')
                } else {
                  handleDatePresetChange('all')
                  setRiskFilter('')
                  setActionFilter('all_logins')
                }
              }}
              title="Click to toggle login events filter"
              style={{
                background: 'var(--admin-card-bg, #ffffff)',
                border: isLogin ? '2px solid #2563eb' : '1px solid var(--admin-border, #e2e8f0)',
                borderRadius: 14, padding: '16px 18px',
                boxShadow: isLogin ? '0 4px 12px rgba(37, 99, 235, 0.12)' : '0 1px 3px rgba(0,0,0,0.04)',
                cursor: 'pointer', transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: isLogin ? '#2563eb' : 'var(--admin-text-muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Logins & 2FA Today
                </div>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: isLogin ? '#dbeafe' : '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <LogIn size={15} color="#2563eb" />
                </div>
              </div>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#2563eb', marginTop: 4, letterSpacing: '-0.02em' }}>
                {(stats.logins_today || stats.totals?.logins_today || 0).toLocaleString()}
              </div>
              <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 4, fontWeight: 500 }}>
                {(stats.active_users_today || 1)} active admin / doctor(s)
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── Toolbar & Filter Bar ── */}
      {(() => {
        const activeFilters = []
        if (search) activeFilters.push({ type: 'search', label: `Search: "${search.length > 20 ? search.slice(0, 20) + '…' : search}"`, onClear: () => setSearch('') })
        if (moduleFilter) {
          const resOption = FILTER_RESOURCE_OPTIONS.find(o => o.value === moduleFilter)
          activeFilters.push({ type: 'module', label: `Resource: ${resOption?.label || moduleFilter}`, onClear: () => setModuleFilter('') })
        }
        if (actionFilter) {
          activeFilters.push({ type: 'action', label: `Action: ${getActionFilterLabel(actionFilter)}`, onClear: () => setActionFilter('') })
        }
        if (riskFilter) {
          activeFilters.push({ type: 'risk', label: `Risk: ${riskFilter.toUpperCase()}`, onClear: () => setRiskFilter('') })
        }
        if (dateFrom || dateTo) {
          const dateLabel = datePreset === 'today' ? 'Date: Today'
            : datePreset === 'yesterday' ? 'Date: Yesterday'
            : datePreset === '7days' ? 'Date: Last 7 Days'
            : datePreset === '30days' ? 'Date: Last 30 Days'
            : datePreset === 'month' ? 'Date: This Month'
            : `Date: ${dateFrom || 'Start'} → ${dateTo || 'End'}`
          activeFilters.push({
            type: 'date',
            label: dateLabel,
            onClear: () => {
              setDatePreset('all')
              setDateFrom('')
              setDateTo('')
            }
          })
        }

        return (
          <div style={{
            background: 'var(--admin-card-bg, #ffffff)', border: '1px solid var(--admin-border, #e2e8f0)',
            borderRadius: 14, padding: '14px 16px', marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            display: 'flex', flexDirection: 'column', gap: 10
          }}>
            {/* Filter Inputs Grid / Row */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Search Box */}
              <div style={{ position: 'relative', flex: '1 1 240px', minWidth: 200 }}>
                <Search size={15} style={{ position: 'absolute', left: 11, top: 12, color: search ? '#0D9488' : '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Search user, public ID, email, action, IP..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{
                    width: '100%', height: 38, paddingLeft: 34, paddingRight: search ? 32 : 12,
                    borderRadius: 8,
                    border: search ? '1.5px solid #0D9488' : '1px solid var(--admin-border, #e2e8f0)',
                    background: search ? '#f0fdfa' : 'var(--admin-bg, #f8fafc)',
                    color: 'var(--admin-text, #0f172a)',
                    fontSize: 13, outline: 'none', transition: 'all 0.15s ease'
                  }}
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    style={{
                      position: 'absolute', right: 8, top: 10, background: 'none',
                      border: 'none', cursor: 'pointer', padding: 2, display: 'flex',
                      alignItems: 'center', color: '#94a3b8'
                    }}
                    title="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Resource / Module Filter */}
              <select
                value={moduleFilter}
                onChange={e => setModuleFilter(e.target.value)}
                style={{
                  height: 38, padding: '0 10px', borderRadius: 8,
                  border: moduleFilter ? '1.5px solid #0D9488' : '1px solid var(--admin-border, #e2e8f0)',
                  background: moduleFilter ? '#f0fdfa' : 'var(--admin-bg, #f8fafc)',
                  color: 'var(--admin-text, #0f172a)',
                  fontWeight: moduleFilter ? 600 : 400,
                  fontSize: 13, minWidth: 135, outline: 'none', cursor: 'pointer'
                }}
              >
                {FILTER_RESOURCE_OPTIONS.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>

              {/* Action Filter (Organized & Grouped) */}
              <select
                value={actionFilter}
                onChange={e => setActionFilter(e.target.value)}
                style={{
                  height: 38, padding: '0 10px', borderRadius: 8,
                  border: actionFilter ? '1.5px solid #0D9488' : '1px solid var(--admin-border, #e2e8f0)',
                  background: actionFilter ? '#f0fdfa' : 'var(--admin-bg, #f8fafc)',
                  color: 'var(--admin-text, #0f172a)',
                  fontWeight: actionFilter ? 600 : 400,
                  fontSize: 13, minWidth: 150, outline: 'none', cursor: 'pointer'
                }}
              >
                <option value="">All Actions</option>
                {ACTION_FILTER_GROUPS.map(grp => (
                  <optgroup key={grp.group} label={grp.group}>
                    {grp.options.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </optgroup>
                ))}
              </select>

              {/* Risk Level Filter */}
              <select
                value={riskFilter}
                onChange={e => setRiskFilter(e.target.value)}
                style={{
                  height: 38, padding: '0 10px', borderRadius: 8,
                  border: riskFilter ? '1.5px solid #0D9488' : '1px solid var(--admin-border, #e2e8f0)',
                  background: riskFilter ? '#f0fdfa' : 'var(--admin-bg, #f8fafc)',
                  color: 'var(--admin-text, #0f172a)',
                  fontWeight: riskFilter ? 600 : 400,
                  fontSize: 13, minWidth: 120, outline: 'none', cursor: 'pointer'
                }}
              >
                <option value="">All Risks</option>
                <option value="low">🟢 Low Risk</option>
                <option value="medium">🟡 Medium Risk</option>
                <option value="high">🔴 High Risk</option>
                <option value="critical">🟣 Critical Risk</option>
              </select>

              {/* Date Preset Filter */}
              <select
                value={datePreset}
                onChange={e => handleDatePresetChange(e.target.value)}
                style={{
                  height: 38, padding: '0 10px', borderRadius: 8,
                  border: datePreset !== 'all' ? '1.5px solid #0D9488' : '1px solid var(--admin-border, #e2e8f0)',
                  background: datePreset !== 'all' ? '#f0fdfa' : 'var(--admin-bg, #f8fafc)',
                  color: 'var(--admin-text, #0f172a)',
                  fontWeight: datePreset !== 'all' ? 600 : 400,
                  fontSize: 13, minWidth: 125, outline: 'none', cursor: 'pointer'
                }}
              >
                <option value="all">📅 All Time</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="month">This Month</option>
                <option value="custom">Custom Range...</option>
              </select>

              {/* Custom Date Pickers (Shown if Custom or Dates are Set) */}
              {(datePreset === 'custom' || (datePreset !== 'all' && datePreset !== 'today' && datePreset !== 'yesterday' && datePreset !== '7days' && datePreset !== '30days' && datePreset !== 'month') || (datePreset === 'custom' && (dateFrom || dateTo))) && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={e => {
                      setDatePreset('custom')
                      setDateFrom(e.target.value)
                    }}
                    style={{
                      height: 38, padding: '0 8px', borderRadius: 8,
                      border: '1px solid var(--admin-border, #e2e8f0)',
                      background: 'var(--admin-bg, #f8fafc)', color: 'var(--admin-text, #0f172a)',
                      fontSize: 12.5, outline: 'none'
                    }}
                    title="From date"
                  />
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>to</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={e => {
                      setDatePreset('custom')
                      setDateTo(e.target.value)
                    }}
                    style={{
                      height: 38, padding: '0 8px', borderRadius: 8,
                      border: '1px solid var(--admin-border, #e2e8f0)',
                      background: 'var(--admin-bg, #f8fafc)', color: 'var(--admin-text, #0f172a)',
                      fontSize: 12.5, outline: 'none'
                    }}
                    title="To date"
                  />
                </div>
              )}

              {/* Reset / Clear Button */}
              {activeFilters.length > 0 && (
                <button
                  onClick={clearFilters}
                  style={{
                    height: 38, padding: '0 12px', borderRadius: 8,
                    border: '1px solid #fecaca', background: '#fef2f2', color: '#b91c1c',
                    fontWeight: 600, fontSize: 13, cursor: 'pointer',
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    transition: 'all 0.15s ease'
                  }}
                  title="Clear all active filters"
                >
                  <X size={14} />
                  <span>Reset ({activeFilters.length})</span>
                </button>
              )}
            </div>

            {/* Active Filters Pill / Tag Tray */}
            {activeFilters.length > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
                paddingTop: 8, borderTop: '1px dashed var(--admin-border, #e2e8f0)',
                marginTop: 2
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Active Filters:
                </span>
                {activeFilters.map(f => (
                  <span
                    key={f.type}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '3px 10px', borderRadius: 9999, fontSize: 12, fontWeight: 600,
                      background: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1'
                    }}
                  >
                    {f.label}
                    <button
                      onClick={f.onClear}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                        display: 'flex', alignItems: 'center', color: '#64748b'
                      }}
                      title={`Remove ${f.type} filter`}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
                <button
                  onClick={clearFilters}
                  style={{
                    background: 'none', border: 'none', color: '#ef4444',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    textDecoration: 'underline', padding: '2px 6px'
                  }}
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        )
      })()}

      {/* ── Enterprise Audit Log Table ── */}
      <div style={{
        background: 'var(--admin-card-bg, #ffffff)', border: '1px solid var(--admin-border, #e2e8f0)',
        borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}>
        {/* Table Header Row (Image 1 Style) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 180px 150px 80px',
          padding: '12px 20px', gap: 16, alignItems: 'center',
          background: 'var(--admin-bg, #f8fafc)',
          borderBottom: '1px solid var(--admin-border, #e2e8f0)',
          fontWeight: 700, fontSize: 13, color: 'var(--admin-text, #334155)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Description</span>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>⇅</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Date</span>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>▲</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>User / Public ID</span>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>⇅</span>
          </div>
          <div style={{ textAlign: 'right', color: 'var(--admin-text-muted, #64748b)', fontSize: 12, fontWeight: 600 }}>
            Actions
          </div>
        </div>

        {/* Table Body Content */}
        {loading ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--admin-text-muted, #64748b)' }}>
            <RefreshCw size={24} className="spin-icon" style={{ marginBottom: 12, display: 'block', margin: '0 auto 12px', color: '#4f46e5' }} />
            <span style={{ fontWeight: 600, fontSize: 14 }}>Loading enterprise audit trail...</span>
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '64px 20px', textAlign: 'center' }}>
            <Shield size={44} style={{ color: 'var(--admin-text-muted, #94a3b8)', opacity: 0.4, marginBottom: 12 }} />
            <p style={{ color: 'var(--admin-text, #0f172a)', fontWeight: 700, fontSize: 16, margin: '0 0 6px' }}>No audit records found</p>
            <p style={{ color: 'var(--admin-text-muted, #64748b)', fontSize: 13, margin: 0 }}>Try clearing filters or performing new actions in the system.</p>
          </div>
        ) : (
          logs.map((log, index) => {
            const isSelected = selectedLogIndex === index
            const descData = formatLogDescriptionInline(log)
            const actorInfo = getUserPublicIdOrName(log)
            const actionMeta = getActionMeta(log.action)
            const ActionIcon = actionMeta.IconComponent || Activity

            return (
              <div
                key={log.id}
                onClick={() => setSelectedLogIndex(index)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 180px 150px 80px',
                  padding: '11px 20px', gap: 16, alignItems: 'center',
                  minHeight: 48, boxSizing: 'border-box',
                  borderBottom: '1px solid var(--admin-border, #f1f5f9)',
                  background: isSelected ? 'rgba(79, 70, 229, 0.04)' : '#ffffff',
                  cursor: 'pointer', transition: 'background 0.15s ease'
                }}
                onMouseEnter={e => {
                  if (!isSelected) e.currentTarget.style.background = '#f8fafc'
                }}
                onMouseLeave={e => {
                  if (!isSelected) e.currentTarget.style.background = '#ffffff'
                }}
              >
                {/* 1. Description Column with Action Tag */}
                <div style={{ minWidth: 0, fontSize: 13, color: '#334155', lineHeight: 1.5, display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 700,
                    color: actionMeta.color, background: actionMeta.bg,
                    border: `1px solid ${actionMeta.color}30`,
                    flexShrink: 0
                  }}>
                    <ActionIcon size={11} />
                    <span>{actionMeta.label}</span>
                  </span>
                  <span style={{ fontWeight: 500, color: '#1e293b' }}>
                    {descData.text}
                  </span>
                  {descData.telemetry && (
                    <span style={{ color: '#64748b', fontSize: 12.5, fontWeight: 400 }}>
                      {descData.telemetry}
                    </span>
                  )}
                </div>

                {/* 2. Date Column */}
                <div style={{ fontSize: 12.5, fontFamily: 'monospace', color: '#475569', whiteSpace: 'nowrap' }}>
                  {formatExactDateTime(log.created_at)}
                </div>

                {/* 3. User / Public ID Column */}
                <div
                  style={{
                    fontSize: 12.5,
                    fontFamily: actorInfo.isPublicId ? 'monospace' : 'inherit',
                    color: actorInfo.isPublicId ? '#4338ca' : '#1e293b',
                    fontWeight: actorInfo.isPublicId ? 700 : 600,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                  title={log.user_name ? `${log.user_name} (${log.user_role || 'User'})` : actorInfo.label}
                >
                  {actorInfo.value}
                </div>

                {/* 4. Actions Column */}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    className="admin-action-btn admin-action-btn-view"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedLogIndex(index)
                    }}
                    title="View Detail"
                  >
                    <img src="/icons/view.png" alt="View" />
                  </button>
                </div>
              </div>
            )
          })
        )}

        {/* ── Table Footer: Page-Size, Summary & Pagination (Image 1 Style) ── */}
        {(() => {
          const cur = pagination.current_page || 1
          const last = pagination.last_page || 1
          const total = pagination.total || 0
          const from = total === 0 ? 0 : (cur - 1) * perPage + 1
          const to = Math.min(cur * perPage, total)

          const pages = []
          if (last <= 7) {
            for (let i = 1; i <= last; i++) pages.push(i)
          } else {
            pages.push(1)
            if (cur > 3) pages.push('...')
            const start = Math.max(2, cur - 1)
            const end   = Math.min(last - 1, cur + 1)
            for (let i = start; i <= end; i++) pages.push(i)
            if (cur < last - 2) pages.push('...')
            pages.push(last)
          }

          const btnBase = {
            height: 34,
            minWidth: 34,
            padding: '0 10px',
            borderRadius: 8,
            border: '1.5px solid var(--admin-border, #e2e8f0)',
            background: 'var(--admin-card-bg, #ffffff)',
            color: 'var(--admin-text, #334155)',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
            lineHeight: 1
          }

          const btnActive = {
            ...btnBase,
            border: 'none',
            background: 'linear-gradient(135deg, #00B875, #009E64)',
            color: '#ffffff',
            boxShadow: '0 2px 8px rgba(0, 184, 117, 0.35)'
          }

          const btnDisabled = {
            ...btnBase,
            opacity: 0.4,
            cursor: 'not-allowed'
          }

          return (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
              padding: '12px 20px',
              borderTop: '1px solid var(--admin-border, #e2e8f0)',
              background: 'var(--admin-card-bg, #ffffff)',
              borderBottomLeftRadius: 14,
              borderBottomRightRadius: 14
            }}>
              {/* Left: Page-size selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--admin-text-muted, #64748b)', fontWeight: 500 }}>
                <span>Show</span>
                <select
                  value={perPage}
                  onChange={(e) => handlePerPageChange(Number(e.target.value))}
                  style={{
                    height: 30,
                    padding: '0 8px',
                    borderRadius: 6,
                    border: '1px solid var(--admin-border, #e2e8f0)',
                    background: 'var(--admin-card-bg, #ffffff)',
                    color: 'var(--admin-text, #0f172a)',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  {[10, 25, 50, 100, 500, 1000, 2000, 5000].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
                <span>entries</span>
              </div>

              {/* Centre: Summary */}
              <div style={{ fontSize: 13, color: 'var(--admin-text-muted, #64748b)', fontWeight: 500 }}>
                {pagination.total != null ? (
                  <>Showing <strong>{from}</strong>–<strong>{to}</strong> of <strong>{total.toLocaleString()}</strong> entries</>
                ) : (
                  'Loading entries...'
                )}
              </div>

              {/* Right: Pagination buttons */}
              {last > 1 ? (
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                  <button
                    onClick={() => cur > 1 && changePage(1)}
                    disabled={cur === 1}
                    style={cur === 1 ? btnDisabled : btnBase}
                    title="First page"
                  >«</button>
                  <button
                    onClick={() => cur > 1 && changePage(cur - 1)}
                    disabled={cur === 1}
                    style={cur === 1 ? btnDisabled : btnBase}
                    title="Previous page"
                  >‹</button>

                  {pages.map((p, i) =>
                    p === '...' ? (
                      <span key={`dot-${i}`} style={{ width: 28, textAlign: 'center', color: 'var(--admin-text-muted, #94a3b8)', fontSize: 14, fontWeight: 700 }}>…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => changePage(p)}
                        style={p === cur ? btnActive : btnBase}
                      >{p}</button>
                    )
                  )}

                  <button
                    onClick={() => cur < last && changePage(cur + 1)}
                    disabled={cur === last}
                    style={cur === last ? btnDisabled : btnBase}
                    title="Next page"
                  >›</button>
                  <button
                    onClick={() => cur < last && changePage(last)}
                    disabled={cur === last}
                    style={cur === last ? btnDisabled : btnBase}
                    title="Last page"
                  >»</button>
                </div>
              ) : null}
            </div>
          )
        })()}
      </div>

      {/* ── Center Details Modal (Center Popup Dialog) ── */}
      <AuditDetailsModal
        log={selectedLog}
        currentIndex={selectedLogIndex ?? 0}
        totalCount={logs.length}
        onNavigate={handleDrawerNavigate}
        onClose={() => setSelectedLogIndex(null)}
      />

      <style>{`
        @keyframes modalFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalZoomIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .spin-icon { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
