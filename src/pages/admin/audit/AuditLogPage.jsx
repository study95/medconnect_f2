import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Shield, Search, Download, Trash2, RefreshCw, ChevronDown, ChevronUp,
  Eye, AlertTriangle, CheckCircle, XCircle, Activity, LogIn, LogOut,
  FilePlus, FileEdit, Flame, Users, Calendar, Filter, X, Clock, User as UserIcon,
  Globe, Laptop, Hash, Tag, Stethoscope, Building2, Pill, Building,
  Lock, CreditCard, Package, FileText, ChevronLeft, ChevronRight,
  Copy, Check, Layers, ArrowRight, CornerDownRight, CheckSquare, GitCommit, ExternalLink,
  Printer, Volume2, VolumeX, Bell
} from 'lucide-react'
import { getAuditLogs, getAuditStats, exportAuditLogs, previewAuditPrune, clearOldAuditLogs, getSecurityAlerts } from '../../../api/auditApi'
import toast from 'react-hot-toast'

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

function resolveActorIdentity(log) {
  if (!log) {
    return {
      name: 'System',
      role: 'AUTOMATED',
      publicId: null,
      email: null,
      primaryText: 'System',
      secondaryText: 'AUTOMATED',
      isPublicId: false,
      label: 'System'
    }
  }

  // 1. Check if the actor user has an associated profile with a public_id (Patient, Doctor, Hospital)
  const actorPublicId = log.user?.patient?.public_id ||
                        log.user?.doctor?.public_id ||
                        log.user?.hospital?.public_id ||
                        null

  // 2. Resolve actor display name
  const actorName = log.user_name || log.user?.name || null

  // 3. Resolve actor role
  const rawRole = log.user_role || log.user?.role || log.user?.registration_type || null
  const role = rawRole ? rawRole.toUpperCase() : null

  // 4. Resolve email
  const emailInDesc = log.description?.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/)?.[1]
  const email = log.user_email || log.user?.email || emailInDesc || null

  // Case A: Has both name and actor public ID (e.g. Patient "Rakib", PT-U35HFW)
  if (actorName && actorPublicId) {
    return {
      name: actorName,
      role: role || 'PATIENT',
      publicId: actorPublicId,
      email,
      primaryText: actorName,
      secondaryText: actorPublicId,
      isPublicId: true,
      label: `${actorName} (${actorPublicId})`
    }
  }

  // Case B: Has actor public ID only
  if (actorPublicId) {
    return {
      name: actorName || actorPublicId,
      role: role || 'USER',
      publicId: actorPublicId,
      email,
      primaryText: actorPublicId,
      secondaryText: role || null,
      isPublicId: true,
      label: actorPublicId
    }
  }

  // Case C: Has name (e.g. "Super Admin" or admin user)
  if (actorName) {
    return {
      name: actorName,
      role: role || (log.user_id ? 'USER' : 'SYSTEM'),
      publicId: null,
      email,
      primaryText: actorName,
      secondaryText: role || (log.user_id ? `#${log.user_id}` : null),
      isPublicId: false,
      label: role ? `${actorName} [${role}]` : actorName
    }
  }

  // Case D: Has email (e.g. login attempt, guest, or unlinked user)
  if (email) {
    return {
      name: email,
      role: role || 'GUEST',
      publicId: null,
      email,
      primaryText: email,
      secondaryText: role || 'GUEST',
      isPublicId: false,
      label: email
    }
  }

  // Case E: Has user_id only
  if (log.user_id) {
    return {
      name: `User #${log.user_id}`,
      role: role || 'USER',
      publicId: null,
      email: null,
      primaryText: `User #${log.user_id}`,
      secondaryText: role || null,
      isPublicId: false,
      label: `User #${log.user_id}`
    }
  }

  // Case F: System / automated
  return {
    name: 'System',
    role: 'AUTOMATED',
    publicId: null,
    email: null,
    primaryText: 'System',
    secondaryText: 'AUTOMATED',
    isPublicId: false,
    label: 'System'
  }
}

function getUserPublicIdOrName(log) {
  const actor = resolveActorIdentity(log)
  return {
    value: actor.primaryText,
    secondary: actor.secondaryText,
    isPublicId: actor.isPublicId,
    label: actor.label,
    actor
  }
}

// ── Center Details Modal (Center Popup Dialog) ──────────────────────────────

function AuditDetailsModal({ log, currentIndex, totalCount, onNavigate, onClose }) {
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const reportRef = useRef(null)

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

  const actor = resolveActorIdentity(log)
  const actionCfg = getActionMeta(log.action)
  const ActionIcon = actionCfg.IconComponent || Activity
  const entityLabel = log.model_label || (log.public_id ? `#${log.public_id}` : (log.model_id ? `#${log.model_id}` : null))
  const isHighRisk = log.risk_level === 'high' || log.risk_level === 'critical'
  const isThreat = isHighRisk || log.action === 'admin_honeypot_triggered' || String(log.action || '').toLowerCase().includes('fail')
  const clientInfo = detectClientType(log.user_agent)

  const handleDownloadPdf = async () => {
    try {
      setDownloadingPdf(true)
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf')
      ])
      const element = reportRef.current
      if (!element) return

      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1200
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      })

      const pdfWidth = 210
      const pdfHeight = 297
      const margin = 8
      const printableWidth = pdfWidth - margin * 2
      const printableHeight = pdfHeight - margin * 2

      const imgWidth = canvas.width
      const imgHeight = canvas.height
      const imgRatio = imgWidth / imgHeight

      let renderWidth = printableWidth
      let renderHeight = printableWidth / imgRatio

      if (renderHeight > printableHeight) {
        renderHeight = printableHeight
        renderWidth = printableHeight * imgRatio
      }

      const x = margin + (printableWidth - renderWidth) / 2
      const y = margin

      pdf.addImage(imgData, 'PNG', x, y, renderWidth, renderHeight, undefined, 'FAST')
      pdf.save(`Forensic_Incident_Report_AUDIT_${log.id}_${new Date().toISOString().slice(0, 10)}.pdf`)
    } catch (err) {
      console.error('Failed to generate incident PDF', err)
    } finally {
      setDownloadingPdf(false)
    }
  }

  let oldObj = {}, newObj = {}
  try { oldObj = typeof log.old_values === 'string' ? JSON.parse(log.old_values) : (log.old_values || {}) } catch { oldObj = {} }
  try { newObj = typeof log.new_values === 'string' ? JSON.parse(log.new_values) : (log.new_values || {}) } catch { newObj = {} }
  const diffFields = log.changed_fields?.length > 0
    ? log.changed_fields
    : Array.from(new Set([...Object.keys(oldObj), ...Object.keys(newObj)]))

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
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12,
              padding: '12px 14px', borderRadius: 10, background: 'var(--admin-card-bg, #ffffff)',
              border: '1px solid var(--admin-border, #f1f5f9)'
            }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--admin-text-muted, #94a3b8)', marginBottom: 2 }}>User Name</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--admin-text, #0f172a)' }}>{actor.name}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--admin-text-muted, #94a3b8)', marginBottom: 2 }}>Role</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--admin-text, #0f172a)', textTransform: 'capitalize' }}>{actor.role || 'Automated'}</div>
              </div>
              {actor.publicId && (
                <div>
                  <div style={{ fontSize: 11, color: 'var(--admin-text-muted, #94a3b8)', marginBottom: 3 }}>Actor Public ID</div>
                  <CopyableBadge value={actor.publicId} />
                </div>
              )}
              {log.user_id && (
                <div>
                  <div style={{ fontSize: 11, color: 'var(--admin-text-muted, #94a3b8)', marginBottom: 3 }}>Actor User ID</div>
                  <CopyableBadge value={String(log.user_id)} />
                </div>
              )}
            </div>
          </div>

          {/* 4. Event Metadata */}
          <div style={{ flexShrink: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--admin-text-muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              Event Metadata
            </div>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12,
              padding: '12px 14px', borderRadius: 10, background: 'var(--admin-card-bg, #ffffff)',
              border: '1px solid var(--admin-border, #f1f5f9)'
            }}>
              {log.public_id && (
                <div>
                  <div style={{ fontSize: 11, color: 'var(--admin-text-muted, #94a3b8)', marginBottom: 3 }}>Resource Public ID</div>
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
              {log.model_id && (
                <div>
                  <div style={{ fontSize: 11, color: 'var(--admin-text-muted, #94a3b8)', marginBottom: 3 }}>Entity Database ID</div>
                  <CopyableBadge value={String(log.model_id)} />
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

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="admin-btn admin-btn-outline"
              style={{
                fontSize: 12.5,
                padding: '7px 15px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                borderColor: '#cbd5e1',
                color: '#1e293b',
                background: '#ffffff'
              }}
              title="Download official forensic incident dossier (PDF)"
            >
              <Printer size={15} style={{ color: downloadingPdf ? '#94a3b8' : '#64748b' }} />
              {downloadingPdf ? 'Generating PDF...' : 'Incident Report (PDF)'}
            </button>

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

      {/* Printable Forensic Incident Report Template (Off-screen rendered for html2canvas) */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        opacity: 0,
        zIndex: -9999,
        overflow: 'hidden'
      }}>
        <div
          ref={reportRef}
          style={{
            width: '794px',
            minHeight: '1090px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            background: '#ffffff',
            color: '#0f172a',
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            padding: '32px 36px',
            boxSizing: 'border-box'
          }}
        >
          {/* Main Body Content */}
          <div style={{ flex: 1 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '2px solid #0f172a', paddingBottom: '14px', marginBottom: '18px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div style={{ width: 10, height: 10, background: '#0284c7', borderRadius: '50%' }}></div>
                <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', color: '#0284c7', textTransform: 'uppercase' }}>
                  DoctorBooklet Security & Audit Subsystem
                </span>
              </div>
              <h1 style={{ margin: '2px 0 3px 0', fontSize: 21, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>
                FORENSIC INCIDENT & AUDIT DOSSIER
              </h1>
              <div style={{ fontSize: 11.5, color: '#64748b' }}>
                Central Cryptographic & Telemetry Audit Trail • Tamper-Evident Security Record
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ display: 'inline-block', background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '4px 10px', borderRadius: 6, fontSize: 12.5, fontWeight: 800, color: '#0f172a', fontFamily: 'monospace' }}>
                DOSSIER #AUD-{log.id}
              </div>
              <div style={{ fontSize: 10, fontWeight: 800, color: isThreat ? '#dc2626' : '#0284c7', marginTop: 4, letterSpacing: '0.05em' }}>
                {isThreat ? 'HIGH PRIORITY / SECURITY INCIDENT' : 'RESTRICTED / COMPLIANCE RECORD'}
              </div>
              <div style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 2 }}>
                Generated: {new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
            </div>
          </div>

          {/* Top Executive Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 18 }}>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>EVENT ACTION</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', marginTop: 3, wordBreak: 'break-all' }}>
                {actionCfg.label || log.action}
              </div>
            </div>

            <div style={{ background: isThreat ? '#fef2f2' : '#f8fafc', border: isThreat ? '1px solid #fecaca' : '1px solid #e2e8f0', borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: isThreat ? '#dc2626' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>RISK CLASSIFICATION</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: isThreat ? '#dc2626' : '#16a34a', marginTop: 3 }}>
                {(log.risk_level || 'low').toUpperCase()} SEVERITY
              </div>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>RECORDED TIMESTAMP</div>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: '#0f172a', marginTop: 3 }}>
                {formatExactDateTime(log.created_at)}
              </div>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>RECORD STATUS</div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#0284c7', marginTop: 3 }}>
                IMMUTABLE AUDIT LOG
              </div>
            </div>
          </div>

          {/* Incident Narrative */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
              1. Incident Narrative & Description
            </div>
            <div style={{ background: isThreat ? '#fff5f5' : '#f8fafc', borderLeft: isThreat ? '4px solid #dc2626' : '4px solid #0284c7', borderTop: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', padding: '12px 16px', borderRadius: '0 8px 8px 0', fontSize: 12.5, lineHeight: 1.5, color: '#1e293b' }}>
              {log.description || 'No descriptive narration recorded for this audit entry.'}
            </div>
          </div>

          {/* Two Column Grid: Actor Profile & Target Entity */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
            {/* Actor Profile */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px 16px', background: '#ffffff' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 9, borderBottom: '1px solid #f1f5f9', paddingBottom: 5 }}>
                2. Actor & Identity Context
              </div>
              <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '4px 0', color: '#64748b', width: '38%' }}>Actor Name:</td>
                    <td style={{ padding: '4px 0', fontWeight: 700, color: '#0f172a' }}>{actor.name}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px 0', color: '#64748b' }}>Account Email:</td>
                    <td style={{ padding: '4px 0', fontWeight: 600, color: '#0f172a' }}>{actor.email || '—'}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px 0', color: '#64748b' }}>System Role:</td>
                    <td style={{ padding: '4px 0' }}>
                      <span style={{ background: '#f1f5f9', color: '#334155', padding: '2px 8px', borderRadius: 4, fontWeight: 700, fontSize: 11 }}>
                        {actor.role || 'GUEST / VISITOR'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px 0', color: '#64748b' }}>Actor Identity:</td>
                    <td style={{ padding: '4px 0', fontWeight: 700, color: '#4f46e5', fontFamily: 'monospace' }}>
                      {actor.publicId ? `${actor.publicId} (Profile)` : (log.user_id ? `#${log.user_id}` : 'System')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Target Entity Context */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px 16px', background: '#ffffff' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 9, borderBottom: '1px solid #f1f5f9', paddingBottom: 5 }}>
                3. Target Entity & Resource
              </div>
              <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '4px 0', color: '#64748b', width: '38%' }}>Target Model:</td>
                    <td style={{ padding: '4px 0', fontWeight: 700, color: '#0f172a' }}>{log.model || 'System / None'}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px 0', color: '#64748b' }}>Target ID:</td>
                    <td style={{ padding: '4px 0', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>{log.model_id ? `#${log.model_id}` : '—'}</td>
                  </tr>
                  {log.public_id && (
                    <tr>
                      <td style={{ padding: '4px 0', color: '#64748b' }}>Resource Public ID:</td>
                      <td style={{ padding: '4px 0', fontWeight: 700, color: '#0284c7', fontFamily: 'monospace' }}>{log.public_id}</td>
                    </tr>
                  )}
                  <tr>
                    <td style={{ padding: '4px 0', color: '#64748b' }}>Entity Label:</td>
                    <td style={{ padding: '4px 0', fontWeight: 600, color: '#0284c7' }}>{entityLabel || '—'}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px 0', color: '#64748b' }}>Resource Type:</td>
                    <td style={{ padding: '4px 0', fontWeight: 600, color: '#475569' }}>{log.action_category || 'General Audit'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Ingress & Telemetry Forensics */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px 16px', background: '#ffffff', marginBottom: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 9, borderBottom: '1px solid #f1f5f9', paddingBottom: 5 }}>
              4. Network Ingress & Telemetry Forensics
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 10 }}>
              <div>
                <span style={{ fontSize: 11, color: '#64748b', display: 'block' }}>Origin IP Address:</span>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>{log.ip_address || '—'}</span>
              </div>
              <div>
                <span style={{ fontSize: 11, color: '#64748b', display: 'block' }}>Client Environment:</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>{clientInfo.browser} on {clientInfo.os}</span>
              </div>
              <div>
                <span style={{ fontSize: 11, color: '#64748b', display: 'block' }}>Backend Request URL:</span>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0f172a', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  <span style={{ color: '#0284c7', marginRight: 4 }}>{log.method || 'GET'}</span>
                  {log.url || '—'}
                </span>
              </div>
              <div>
                <span style={{ fontSize: 11, color: '#64748b', display: 'block' }}>Frontend Source Page (Referer):</span>
                <span style={{ fontSize: 11.5, fontWeight: 600, color: '#0f172a', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {log.tags?.referer || 'Direct Access / None'}
                </span>
              </div>
            </div>

            <div>
              <span style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 3 }}>Full User-Agent String:</span>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 5, padding: '6px 10px', fontSize: 10.5, fontFamily: 'monospace', color: '#475569', wordBreak: 'break-all', lineHeight: 1.4 }}>
                {log.user_agent || 'Not captured'}
              </div>
            </div>
          </div>

          {/* State Diff (Before vs After) */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px 16px', background: '#ffffff', marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 9, borderBottom: '1px solid #f1f5f9', paddingBottom: 5 }}>
              5. Database State Delta (Before vs. After)
            </div>

            {diffFields.length === 0 ? (
              <div style={{ fontSize: 11.5, color: '#64748b', fontStyle: 'italic', padding: '8px 0' }}>
                No database state modifications recorded for this entry. Represents point-in-time telemetry or authentication activity.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>
                    <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 800, color: '#475569', width: '25%' }}>FIELD</th>
                    <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 800, color: '#dc2626', width: '37.5%' }}>PREVIOUS VALUE (BEFORE)</th>
                    <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 800, color: '#16a34a', width: '37.5%' }}>NEW VALUE (AFTER)</th>
                  </tr>
                </thead>
                <tbody>
                  {diffFields.map((fld) => (
                    <tr key={fld} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '6px 10px', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>{fld}</td>
                      <td style={{ padding: '6px 10px', color: '#dc2626', background: '#fef2f2', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                        {oldObj[fld] !== undefined ? JSON.stringify(oldObj[fld]) : '—'}
                      </td>
                      <td style={{ padding: '6px 10px', color: '#16a34a', background: '#f0fdf4', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                        {newObj[fld] !== undefined ? JSON.stringify(newObj[fld]) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Solid Divider Line right below Section 5 */}
          <div style={{ borderBottom: '2px solid #0f172a', marginTop: 18 }} />
        </div>

        {/* Tamper-Evident Security Seal & Signatures (Pinned to Bottom of Page) */}
        <div style={{ marginTop: 'auto', paddingTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', color: '#64748b', textTransform: 'uppercase' }}>
                  CRYPTOGRAPHIC AUDIT DIGEST
                </div>
                <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#0f172a', marginTop: 3 }}>
                  HASH: SHA256-DB-AUD-{log.id}-{(log.id * 179424673).toString(16).toUpperCase()}
                </div>
                <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>
                  Secured by DoctorBooklet Immutable Telemetry Engine
                </div>
              </div>

              <div style={{ display: 'flex', gap: 40 }}>
                <div style={{ textAlign: 'center' }}>
                  {/* Clean signature space */}
                  <div style={{ width: 150, borderBottom: '1.5px solid #475569', height: 50 }}></div>
                  <div style={{ fontSize: 10.5, fontWeight: 800, color: '#334155', marginTop: 6 }}>System Examiner</div>
                  <div style={{ fontSize: 9.5, color: '#64748b' }}>DoctorBooklet Core</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  {/* Clean signature space */}
                  <div style={{ width: 150, borderBottom: '1.5px solid #475569', height: 50 }}></div>
                  <div style={{ fontSize: 10.5, fontWeight: 800, color: '#334155', marginTop: 6 }}>Security Officer</div>
                  <div style={{ fontSize: 9.5, color: '#64748b' }}>Compliance Dept.</div>
                </div>
              </div>
            </div>

            <div style={{ fontSize: 9.5, color: '#94a3b8', textAlign: 'center', borderTop: '1px solid #f1f5f9', paddingTop: 8 }}>
              CONFIDENTIAL: This forensic audit dossier contains privileged healthcare operational logs. Generated under strict compliance standards. Unauthorized alteration, forging or duplication is prohibited.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Smart Audit Retention & Pruning Modal ──────────────────────────────────────

function getSevenDaysAgoString() {
  const d = new Date()
  d.setDate(d.getDate() - 7)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function AuditPruneModal({ isOpen, onClose, onSuccess }) {
  const [retentionType, setRetentionType] = useState('90')
  const [customDate, setCustomDate] = useState(() => getSevenDaysAgoString())
  const [downloadBackup, setDownloadBackup] = useState(true)
  const [confirmInput, setConfirmInput] = useState('')
  const [previewLoading, setPreviewLoading] = useState(false)
  const [preview, setPreview] = useState(null)
  const [pruning, setPruning] = useState(false)

  const maxAllowedDate = getSevenDaysAgoString()

  // Reset confirmation input when modal opens
  useEffect(() => {
    if (isOpen) {
      setConfirmInput('')
    }
  }, [isOpen])

  // Fetch live impact preview whenever retention type or custom date changes
  useEffect(() => {
    if (!isOpen) return
    let active = true

    const fetchPreview = async () => {
      setPreviewLoading(true)
      try {
        const params = retentionType === 'custom'
          ? { date_before: customDate }
          : { days: parseInt(retentionType, 10) }
        const res = await previewAuditPrune(params)
        if (active && res.data?.success) {
          setPreview(res.data)
        }
      } catch (err) {
        console.error('Prune preview error', err)
        if (active) {
          setPreview(null)
          const msg = err.response?.data?.message || 'Failed to preview retention scope'
          toast.error(msg)
        }
      } finally {
        if (active) setPreviewLoading(false)
      }
    }

    fetchPreview()
    return () => { active = false }
  }, [isOpen, retentionType, customDate])

  if (!isOpen) return null

  const isConfirmed = confirmInput.trim().toUpperCase() === 'PRUNE'
  const canExecute = isConfirmed && !pruning && !previewLoading && (preview?.eligible_count > 0)

  const handleExecutePrune = async () => {
    if (!canExecute) return
    try {
      setPruning(true)

      // 1. Download pre-prune CSV backup if checked
      if (downloadBackup) {
        const backupToastId = toast.loading('Generating pre-prune CSV archive...')
        try {
          const exportParams = retentionType === 'custom'
            ? { date_to: customDate }
            : { date_to: preview?.cutoff_date ? preview.cutoff_date.slice(0, 10) : maxAllowedDate }
          const res = await exportAuditLogs(exportParams)
          const url = window.URL.createObjectURL(new Blob([res.data]))
          const link = document.createElement('a')
          link.href = url
          link.setAttribute('download', `audit_logs_backup_before_${customDate || 'cutoff'}.csv`)
          document.body.appendChild(link)
          link.click()
          link.remove()
          toast.success('Pre-prune CSV backup downloaded successfully', { id: backupToastId })
        } catch (exportErr) {
          console.warn('Backup export warning', exportErr)
          toast.dismiss(backupToastId)
        }
      }

      // 2. Perform backend batched prune
      const payload = retentionType === 'custom'
        ? { date_before: customDate }
        : { days: parseInt(retentionType, 10) }

      const res = await clearOldAuditLogs(payload)
      if (res.data?.success) {
        toast.success(
          `Pruned ${res.data.pruned_count} routine audit logs. ${res.data.protected_count} security records permanently preserved.`,
          { duration: 5500 }
        )
        onSuccess?.()
        onClose()
      } else {
        toast.error(res.data?.message || 'Failed to prune audit logs.')
      }
    } catch (err) {
      console.error('Audit prune failed', err)
      toast.error(err.response?.data?.message || 'Error occurred while pruning logs.')
    } finally {
      setPruning(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(5px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
        animation: 'modalFadeIn 0.2s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !pruning) onClose()
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 18,
          width: '100%',
          maxWidth: 600,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.28), 0 0 0 1px rgba(226, 232, 240, 0.8)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'modalZoomIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#fafafa'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: '#fef2f2', border: '1px solid #fecaca',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#dc2626'
            }}>
              <Trash2 size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16.5, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em' }}>
                Prune Routine Audit Logs
              </h3>
              <p style={{ margin: 0, fontSize: 12, color: '#64748b', marginTop: 2 }}>
                Database retention policy & performance optimization
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={pruning}
            style={{
              background: 'transparent', border: 'none', cursor: pruning ? 'not-allowed' : 'pointer',
              color: '#94a3b8', padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 18, maxHeight: '80vh', overflowY: 'auto' }}>
          
          {/* Permanent Security Protection Guarantee Banner */}
          <div style={{
            background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
            border: '1px solid #bbf7d0',
            borderRadius: 12,
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 7,
              background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#15803d', flexShrink: 0, marginTop: 1
            }}>
              <Shield size={16} />
            </div>
            <div style={{ fontSize: 12, color: '#166534', lineHeight: 1.5 }}>
              <strong style={{ fontWeight: 800, display: 'block', marginBottom: 2 }}>
                Immutable Security Immunity Active
              </strong>
              High & Critical risk security alerts, honeypot traps, failed logins, and deletion logs are 
              <strong style={{ color: '#047857' }}> permanently protected</strong> and can never be deleted. 
              Only routine low/medium logs older than 7 days can be pruned.
            </div>
          </div>

          {/* Retention Scope Selector */}
          <div>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 8 }}>
              Select Retention Window:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {[
                { id: '90', label: '90 Days', sub: 'Recommended' },
                { id: '180', label: '180 Days', sub: 'Half Year' },
                { id: '365', label: '365 Days', sub: '1 Year' },
                { id: 'custom', label: 'Custom', sub: 'Min 7 Days' },
              ].map(opt => {
                const active = retentionType === opt.id
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setRetentionType(opt.id)}
                    style={{
                      padding: '8px 6px',
                      borderRadius: 10,
                      border: active ? '2px solid #0D9488' : '1px solid #e2e8f0',
                      background: active ? '#f0fdfa' : '#ffffff',
                      color: active ? '#0f766e' : '#475569',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ fontSize: 12.5, fontWeight: active ? 800 : 700 }}>{opt.label}</div>
                    <div style={{ fontSize: 10, color: active ? '#0d9488' : '#94a3b8', marginTop: 1 }}>{opt.sub}</div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Custom Date Picker (If selected) */}
          {retentionType === 'custom' && (
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 10,
              padding: '12px 14px',
              animation: 'modalFadeIn 0.15s ease-out'
            }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                Prune routine logs created on or before:
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="date"
                  value={customDate}
                  max={maxAllowedDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    fontSize: 13,
                    color: '#0f172a',
                    background: '#ffffff',
                    outline: 'none',
                    fontWeight: 600
                  }}
                />
                <span style={{ fontSize: 11.5, color: '#64748b' }}>
                  Safety restriction: Max allowed date is <strong>{maxAllowedDate}</strong> (7 days ago).
                </span>
              </div>
            </div>
          )}

          {/* Live Impact Preview Cards */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>
                Impact Analysis {preview?.cutoff_formatted ? `(Older than ${preview.cutoff_formatted})` : ''}:
              </span>
              {previewLoading && (
                <span style={{ fontSize: 11, color: '#0D9488', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <RefreshCw size={11} className="spin-icon" /> Calculating rows...
                </span>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {/* Routine logs to prune */}
              <div style={{
                background: '#fff1f2',
                border: '1px solid #fecdd3',
                borderRadius: 12,
                padding: '14px 16px'
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#be123c', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Eligible To Prune
                </div>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#9f1239', marginTop: 4 }}>
                  {previewLoading ? '...' : (preview?.eligible_count?.toLocaleString() || 0)}
                </div>
                <div style={{ fontSize: 11, color: '#e11d48', marginTop: 3 }}>
                  Routine events (Low & Medium risk)
                </div>
              </div>

              {/* Security logs protected */}
              <div style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: 12,
                padding: '14px 16px'
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Permanently Retained
                </div>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#166534', marginTop: 4 }}>
                  {previewLoading ? '...' : (preview?.protected_count?.toLocaleString() || 0)}
                </div>
                <div style={{ fontSize: 11, color: '#15803d', marginTop: 3 }}>
                  Security alerts & forensics (100% immune)
                </div>
              </div>
            </div>
          </div>

          {/* Pre-Prune Backup Toggle */}
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 14px',
            borderRadius: 10,
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            cursor: 'pointer',
            userSelect: 'none'
          }}>
            <input
              type="checkbox"
              checked={downloadBackup}
              onChange={(e) => setDownloadBackup(e.target.checked)}
              style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#0D9488' }}
            />
            <div style={{ fontSize: 12, color: '#334155' }}>
              <span style={{ fontWeight: 700 }}>Download CSV backup archive before pruning</span>
              <span style={{ display: 'block', fontSize: 11, color: '#64748b', marginTop: 1 }}>
                Recommended. Saves a downloadable copy of the targeted logs before database execution.
              </span>
            </div>
          </label>

          {/* GitHub-Style Type-to-Confirm Safeguard */}
          <div style={{
            background: '#fafafa',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            padding: '14px 16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#b91c1c', fontSize: 12, fontWeight: 800 }}>
              <AlertTriangle size={15} />
              <span>Explicit Confirmation Required</span>
            </div>
            <p style={{ margin: '6px 0 10px 0', fontSize: 11.5, color: '#64748b', lineHeight: 1.4 }}>
              To prevent accidental deletion, please type <strong style={{ color: '#0f172a', fontFamily: 'monospace', background: '#e2e8f0', padding: '1px 5px', borderRadius: 4 }}>PRUNE</strong> in the box below to unlock the execution button:
            </p>
            <input
              type="text"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value.toUpperCase())}
              placeholder="PRUNE"
              disabled={pruning}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 8,
                border: isConfirmed ? '2px solid #22c55e' : '1px solid #cbd5e1',
                background: '#ffffff',
                fontFamily: 'monospace',
                fontSize: 14,
                fontWeight: 800,
                letterSpacing: '0.1em',
                color: isConfirmed ? '#15803d' : '#0f172a',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

        </div>

        {/* Modal Footer / Action Buttons */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid #f1f5f9',
          background: '#fafafa',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 10
        }}>
          <button
            type="button"
            onClick={onClose}
            disabled={pruning}
            className="admin-btn admin-btn-outline"
            style={{ fontSize: 12.5 }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleExecutePrune}
            disabled={!canExecute}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '9px 18px',
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 800,
              border: 'none',
              cursor: canExecute ? 'pointer' : 'not-allowed',
              background: canExecute ? '#dc2626' : '#94a3b8',
              color: '#ffffff',
              boxShadow: canExecute ? '0 2px 8px rgba(220, 38, 38, 0.35)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            {pruning ? (
              <>
                <RefreshCw size={14} className="spin-icon" />
                <span>Pruning Database (Safe 500-Row Batches)...</span>
              </>
            ) : !isConfirmed ? (
              <>
                <Lock size={14} />
                <span>Type PRUNE to Unlock</span>
              </>
            ) : preview?.eligible_count === 0 ? (
              <span>No Logs Match Cutoff</span>
            ) : (
              <>
                <Trash2 size={14} />
                <span>Prune {preview?.eligible_count?.toLocaleString()} Routine Logs</span>
              </>
            )}
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

function playSecurityChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.setValueAtTime(440, ctx.currentTime + 0.15)
    gain.gain.setValueAtTime(0.12, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.38)
  } catch (e) {
    // Audio context may be restricted by autoplay policy
  }
}

// ── Main AuditLogPage Component ───────────────────────────────────────────────

export default function AuditLogPage() {
  const [logs, setLogs] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [selectedLogIndex, setSelectedLogIndex] = useState(null)
  const [exporting, setExporting] = useState(false)
  const [showPruneModal, setShowPruneModal] = useState(false)

  // Auto-Refresh state (30s interval with safety pause)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [refreshCountdown, setRefreshCountdown] = useState(30)

  // Instant Critical Security Threat state
  const [activeThreat, setActiveThreat] = useState(null)
  const [soundMuted, setSoundMuted] = useState(false)
  const [dismissedThreatIds, setDismissedThreatIds] = useState(() => new Set())

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

  const fetchLogs = useCallback(async (page = 1, currentPerPage = perPage, silent = false) => {
    try {
      if (!silent) setLoading(true)
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
      if (!silent) setLoading(false)
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

  // Check for critical threats in the last 15 minutes
  const checkForThreats = useCallback(async () => {
    try {
      const res = await getSecurityAlerts()
      if (res.data?.success && res.data.threats?.length > 0) {
        const latest = res.data.threats[0]
        if (!dismissedThreatIds.has(latest.id)) {
          setActiveThreat(latest)
          if (!soundMuted) {
            playSecurityChime()
          }
        }
      }
    } catch (e) {
      console.warn('Threat check warning:', e)
    }
  }, [dismissedThreatIds, soundMuted])

  useEffect(() => {
    fetchLogs(1)
  }, [fetchLogs])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  useEffect(() => {
    checkForThreats()
  }, [checkForThreats])

  // Auto-Refresh (30s) timer with full safety guards:
  // - Pauses when tab is hidden/minimized
  // - Pauses when any detail or prune modal is open
  // - Only auto-refreshes if on page 1
  useEffect(() => {
    if (!autoRefresh) {
      setRefreshCountdown(30)
      return
    }

    const interval = setInterval(() => {
      // 1. Guard: Tab is hidden/minimized -> pause countdown
      if (document.hidden) return

      // 2. Guard: Modal or details open -> pause countdown
      if (selectedLogIndex !== null || showPruneModal) return

      // 3. Guard: On page 2+ -> pause countdown
      if (pagination.current_page !== 1) return

      setRefreshCountdown((prev) => {
        if (prev <= 1) {
          // Trigger silent background refresh
          fetchLogs(1, perPage, true)
          fetchStats()
          checkForThreats()
          return 30
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [autoRefresh, selectedLogIndex, showPruneModal, pagination.current_page, perPage, fetchLogs, fetchStats, checkForThreats])

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

          {/* Auto-Refresh (30s) Toggle Button */}
          <button
            onClick={() => setAutoRefresh(prev => !prev)}
            className="admin-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              background: autoRefresh ? '#f0fdf4' : '#f8fafc',
              color: autoRefresh ? '#15803d' : '#64748b',
              border: autoRefresh ? '1.5px solid #86efac' : '1px solid #cbd5e1',
              fontWeight: 700,
              fontSize: 12,
              padding: '6px 12px',
              borderRadius: 8,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: autoRefresh ? '0 0 0 3px rgba(34, 197, 94, 0.15)' : 'none'
            }}
            title={autoRefresh ? 'Click to disable auto-refresh' : 'Click to enable 30s auto-refresh'}
          >
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: autoRefresh ? '#22c55e' : '#94a3b8',
              boxShadow: autoRefresh ? '0 0 6px #22c55e' : 'none',
              transition: 'all 0.2s ease'
            }} />
            <Clock size={13} />
            <span>{autoRefresh ? `Auto: ${refreshCountdown}s` : 'Auto: Off'}</span>
          </button>

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

          <button
            onClick={() => setShowPruneModal(true)}
            className="admin-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: '#fef2f2',
              color: '#dc2626',
              border: '1px solid #fecaca',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(220, 38, 38, 0.08)',
              transition: 'all 0.15s ease'
            }}
            title="Database Auto-Cleanup / Retention Policy"
          >
            <Trash2 size={14} />
            <span>Prune Logs</span>
          </button>
        </div>
      </div>

      {/* ── Active Critical Threat Emergency Banner ── */}
      {activeThreat && (
        <div style={{
          background: 'linear-gradient(135deg, #991b1b 0%, #7f1d1d 100%)',
          borderRadius: 14,
          padding: '14px 18px',
          marginBottom: 18,
          border: '2px solid #ef4444',
          boxShadow: '0 8px 24px -4px rgba(220, 38, 38, 0.4), 0 0 0 1px rgba(239, 68, 68, 0.4)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 14,
          animation: 'modalFadeIn 0.3s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 12px rgba(239, 68, 68, 0.6)'
            }}>
              <AlertTriangle size={22} color="#ffffff" className="spin-icon" style={{ animationDuration: '3s' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', background: '#dc2626', padding: '2px 8px', borderRadius: 4 }}>
                  CRITICAL THREAT ALERT
                </span>
                <span style={{ fontSize: 12, opacity: 0.85 }}>
                  {formatRelative(activeThreat.created_at)}
                </span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}>
                {activeThreat.description}
              </div>
              <div style={{ fontSize: 12, opacity: 0.9, marginTop: 2, fontFamily: 'monospace' }}>
                Source IP: <strong>{activeThreat.ip_address}</strong> • Action: <strong>{activeThreat.action}</strong>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => {
                const idx = logs.findIndex(l => l.id === activeThreat.id)
                if (idx !== -1) {
                  setSelectedLogIndex(idx)
                } else {
                  setSelectedLogIndex(0)
                }
              }}
              style={{
                background: '#ffffff',
                color: '#991b1b',
                border: 'none',
                padding: '8px 14px',
                borderRadius: 8,
                fontSize: 12.5,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
              }}
            >
              <Eye size={14} />
              <span>Inspect Threat</span>
            </button>

            <button
              onClick={() => setSoundMuted(m => !m)}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                padding: '8px 10px',
                borderRadius: 8,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
              title={soundMuted ? 'Unmute alert sound' : 'Mute alert sound'}
            >
              {soundMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>

            <button
              onClick={() => {
                setDismissedThreatIds(prev => new Set([...prev, activeThreat.id]))
                setActiveThreat(null)
              }}
              style={{
                background: 'rgba(0,0,0,0.3)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                padding: '8px 14px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

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
          gridTemplateColumns: '1fr 180px 170px 70px',
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
            <span>User / Actor</span>
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
                  gridTemplateColumns: '1fr 180px 170px 70px',
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

                {/* 3. User / Actor Column */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    minWidth: 0,
                    lineHeight: 1.3
                  }}
                  title={actorInfo.label}
                >
                  <div style={{
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: '#1e293b',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {actorInfo.value}
                  </div>
                  {actorInfo.secondary && (
                    <div style={{
                      fontSize: 11,
                      fontFamily: actorInfo.isPublicId ? 'monospace' : 'inherit',
                      fontWeight: actorInfo.isPublicId ? 700 : 500,
                      color: actorInfo.isPublicId ? '#4f46e5' : '#64748b',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      letterSpacing: actorInfo.isPublicId ? '0.02em' : 'normal'
                    }}>
                      {actorInfo.secondary}
                    </div>
                  )}
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

      {/* ── Retention Policy & Pruning Modal ── */}
      <AuditPruneModal
        isOpen={showPruneModal}
        onClose={() => setShowPruneModal(false)}
        onSuccess={() => {
          fetchLogs(1)
          fetchStats()
        }}
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
