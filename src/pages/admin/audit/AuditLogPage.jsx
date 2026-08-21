import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Shield, Search, Download, Trash2, RefreshCw, ChevronDown, ChevronUp,
  Eye, AlertTriangle, CheckCircle, XCircle, Activity, LogIn, LogOut,
  FilePlus, FileEdit, Flame, Users, Calendar, Filter, X, Clock, User as UserIcon,
  Globe, Laptop, Hash, Tag, Stethoscope, Building2, Pill, Building,
  Lock, CreditCard, Package, FileText, ChevronLeft, ChevronRight,
  Copy, Check, Layers, ArrowRight, CornerDownRight, CheckSquare, GitCommit
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
  DoctorChamber:       { IconComponent: Building,    label: 'Chamber',      badgeBg: '#e0e7ff', color: '#4338ca' },
  User:                { IconComponent: UserIcon,    label: 'User',         badgeBg: '#f1f5f9', color: '#475569' },
  Auth:                { IconComponent: Lock,        label: 'Auth',         badgeBg: '#ede9fe', color: '#6d28d9' },
  DoctorSubscription:  { IconComponent: CreditCard,  label: 'Subscription', badgeBg: '#ccfbf1', color: '#0f766e' },
  SubscriptionPackage: { IconComponent: Package,     label: 'Package',      badgeBg: '#ffedd5', color: '#c2410c' },
  PromoCode:           { IconComponent: Tag,         label: 'Promo Code',   badgeBg: '#cffafe', color: '#0e7490' },
  AuditLog:            { IconComponent: Shield,      label: 'Audit Log',    badgeBg: '#e0e7ff', color: '#4f46e5' },
}

const ACTION_CONFIG = {
  create:        { label: 'Created',       color: '#16a34a', bg: '#f0fdf4', IconComponent: FilePlus },
  update:        { label: 'Updated',       color: '#2563eb', bg: '#eff6ff', IconComponent: FileEdit },
  delete:        { label: 'Deleted',       color: '#dc2626', bg: '#fef2f2', IconComponent: Trash2 },
  login:         { label: 'Logged In',     color: '#7c3aed', bg: '#f5f3ff', IconComponent: LogIn },
  logout:        { label: 'Logged Out',    color: '#475569', bg: '#f8fafc', IconComponent: LogOut },
  login_failed:  { label: 'Login Failed',  color: '#b91c1c', bg: '#fef2f2', IconComponent: XCircle },
  export:        { label: 'Exported',      color: '#d97706', bg: '#fffbeb', IconComponent: Download },
  status_change: { label: 'Status Change', color: '#0891b2', bg: '#ecfeff', IconComponent: Activity },
  bulk_action:   { label: 'Bulk Action',   color: '#c026d3', bg: '#fdf4ff', IconComponent: Flame },
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

function CopyableBadge({ label, value }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = (e) => {
    e.stopPropagation()
    if (!value) return
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <button
      onClick={handleCopy}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '3px 8px', borderRadius: 6, fontSize: 11, fontFamily: 'monospace',
        background: '#f8fafc', border: '1px solid #e2e8f0', color: '#334155',
        cursor: 'pointer', transition: 'all 0.15s ease'
      }}
      title="Click to copy"
    >
      {label && <span style={{ color: '#64748b', fontWeight: 600 }}>{label}:</span>}
      <span>{value}</span>
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

// ── Slide-Over Details Drawer ──────────────────────────────────────────────────

function AuditDetailsDrawer({ log, currentIndex, totalCount, onNavigate, onClose }) {
  useEffect(() => {
    if (log) {
      const prevOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = prevOverflow
      }
    }
  }, [log])

  if (!log) return null

  const actionCfg = ACTION_CONFIG[log.action] || { label: log.action, color: '#475569', bg: '#f1f5f9', IconComponent: Activity }
  const ActionIcon = actionCfg.IconComponent
  const entityLabel = log.model_label || (log.public_id ? `#${log.public_id}` : (log.model_id ? `#${log.model_id}` : null))

  return (
    <>
      {/* Backdrop overlay below header and above footer */}
      <div
        style={{
          position: 'fixed',
          top: 'var(--admin-header-height, 64px)',
          left: 0,
          right: 0,
          bottom: 'var(--admin-footer-height, 46px)',
          height: 'calc(100vh - var(--admin-header-height, 64px) - var(--admin-footer-height, 46px))',
          zIndex: 1000,
          background: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(3px)',
          animation: 'fadeIn 0.2s ease-out'
        }}
        onClick={onClose}
      />

      {/* Slide-over Drawer Container */}
      <div
        style={{
          position: 'fixed',
          top: 'var(--admin-header-height, 64px)',
          right: 0,
          bottom: 'var(--admin-footer-height, 46px)',
          height: 'calc(100vh - var(--admin-header-height, 64px) - var(--admin-footer-height, 46px))',
          width: '100%',
          maxWidth: 460,
          zIndex: 1010,
          background: 'var(--admin-card-bg, #ffffff)',
          borderLeft: '1px solid var(--admin-border, #e2e8f0)',
          boxShadow: '-8px 0 24px rgba(0,0,0,0.12)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div style={{
          padding: '14px 18px',
          borderBottom: '1px solid var(--admin-border, #f1f5f9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--admin-card-bg, #ffffff)',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9,
              background: actionCfg.bg, color: actionCfg.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0
            }}>
              <ActionIcon size={17} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--admin-text, #0f172a)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Audit Record Details
              </div>
              <div style={{ fontSize: 11, color: 'var(--admin-text-muted, #94a3b8)', marginTop: 1 }}>
                Record #{log.id} • {formatRelative(log.created_at)}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
            <button
              onClick={() => onNavigate(-1)}
              disabled={currentIndex <= 0}
              style={{
                width: 28, height: 28, borderRadius: 7, border: '1px solid var(--admin-border, #e2e8f0)',
                background: 'var(--admin-bg, #f8fafc)', cursor: currentIndex <= 0 ? 'not-allowed' : 'pointer',
                opacity: currentIndex <= 0 ? 0.35 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
              title="Previous Record (Up Arrow)"
            >
              <ChevronLeft size={15} />
            </button>
            <span style={{ fontSize: 11, color: 'var(--admin-text-muted, #94a3b8)', fontWeight: 600, padding: '0 2px' }}>
              {currentIndex + 1} of {totalCount}
            </span>
            <button
              onClick={() => onNavigate(1)}
              disabled={currentIndex >= totalCount - 1}
              style={{
                width: 28, height: 28, borderRadius: 7, border: '1px solid var(--admin-border, #e2e8f0)',
                background: 'var(--admin-bg, #f8fafc)', cursor: currentIndex >= totalCount - 1 ? 'not-allowed' : 'pointer',
                opacity: currentIndex >= totalCount - 1 ? 0.35 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
              title="Next Record (Down Arrow)"
            >
              <ChevronRight size={15} />
            </button>
            <button
              onClick={onClose}
              style={{
                width: 28, height: 28, borderRadius: 7, border: 'none',
                background: 'rgba(0,0,0,0.05)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 4
              }}
              title="Close (Esc)"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Drawer Body */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          overscrollBehavior: 'contain',
          padding: '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 18
        }}>
          {/* 1. Activity Summary Card */}
          <div style={{
            padding: 14, borderRadius: 10, background: 'var(--admin-bg, #f8fafc)',
            border: '1px solid var(--admin-border, #f1f5f9)',
            display: 'flex', flexDirection: 'column', gap: 8
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
            <div style={{ fontSize: 12.5, color: 'var(--admin-text-muted, #64748b)', lineHeight: 1.45 }}>
              {log.description}
            </div>
          </div>

          {/* 2. User / Actor Information (Privacy Compliant - No Email) */}
          <div>
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

          {/* 3. Event Metadata */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--admin-text-muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              Event Metadata
            </div>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
              padding: '12px 14px', borderRadius: 10, background: 'var(--admin-card-bg, #ffffff)',
              border: '1px solid var(--admin-border, #f1f5f9)'
            }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--admin-text-muted, #94a3b8)', marginBottom: 2 }}>Timestamp</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-text, #0f172a)' }}>
                  {log.created_at ? new Date(log.created_at).toLocaleString('en-GB') : '—'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--admin-text-muted, #94a3b8)', marginBottom: 4 }}>Risk Level</div>
                <RiskBadge level={log.risk_level} />
              </div>
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
            </div>
          </div>

          {/* 4. Network & Technical Details */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--admin-text-muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              Network & Technical Details
            </div>
            <div style={{
              display: 'flex', flexDirection: 'column', gap: 8,
              padding: '12px 14px', borderRadius: 10, background: 'var(--admin-card-bg, #ffffff)',
              border: '1px solid var(--admin-border, #f1f5f9)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--admin-text-muted, #94a3b8)' }}>IP Address</span>
                <CopyableBadge value={log.ip_address || '—'} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--admin-text-muted, #94a3b8)' }}>HTTP Method / Status</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--admin-text, #0f172a)', fontFamily: 'monospace' }}>
                  {log.request_method || 'GET'} • {log.http_status || 200}
                </span>
              </div>
              {log.request_url && (
                <div>
                  <div style={{ fontSize: 11, color: 'var(--admin-text-muted, #94a3b8)', marginBottom: 3 }}>Request URL</div>
                  <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--admin-text, #0f172a)', background: 'var(--admin-bg, #f8fafc)', padding: '6px 10px', borderRadius: 6, wordBreak: 'break-all' }}>
                    {log.request_url}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 5. Field Changes / Diff */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--admin-text-muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              Change Diff (Before vs. After)
            </div>
            <JsonDiff old_values={log.old_values} new_values={log.new_values} changed_fields={log.changed_fields} />
          </div>
        </div>
      </div>
    </>
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
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0, per_page: 20 })

  const fetchLogs = useCallback(async (page = 1) => {
    try {
      setLoading(true)
      const params = {
        page,
        per_page: pagination.per_page || 20,
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
          per_page: data.per_page
        })
      }
    } catch (err) {
      console.error('Failed to fetch audit logs', err)
    } finally {
      setLoading(false)
    }
  }, [search, moduleFilter, actionFilter, riskFilter, dateFrom, dateTo, pagination.per_page])

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
    setDateFrom('')
    setDateTo('')
  }

  const changePage = (p) => {
    if (p < 1 || p > pagination.last_page) return
    fetchLogs(p)
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

        <div style={{ display: 'flex', gap: 10 }}>
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

      {/* ── Stats Metric Cards ── */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 20 }}>
          <div style={{
            background: 'var(--admin-card-bg, #ffffff)', border: '1px solid var(--admin-border, #e2e8f0)',
            borderRadius: 12, padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted, #94a3b8)', textTransform: 'uppercase' }}>Total Events Logged</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--admin-text, #0f172a)', marginTop: 4 }}>
              {(stats.total_events || pagination.total || 0).toLocaleString()}
            </div>
          </div>

          <div style={{
            background: 'var(--admin-card-bg, #ffffff)', border: '1px solid var(--admin-border, #e2e8f0)',
            borderRadius: 12, padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', textTransform: 'uppercase' }}>High / Critical Risks</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#dc2626', marginTop: 4 }}>
              {(stats.high_risk_count || 0).toLocaleString()}
            </div>
          </div>

          <div style={{
            background: 'var(--admin-card-bg, #ffffff)', border: '1px solid var(--admin-border, #e2e8f0)',
            borderRadius: 12, padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase' }}>Active Admins Today</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#2563eb', marginTop: 4 }}>
              {(stats.active_users_today || stats.unique_users || 0).toLocaleString()}
            </div>
          </div>

          <div style={{
            background: 'var(--admin-card-bg, #ffffff)', border: '1px solid var(--admin-border, #e2e8f0)',
            borderRadius: 12, padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', textTransform: 'uppercase' }}>System Health / Audit Engine</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#16a34a', marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
              100% Operational
            </div>
          </div>
        </div>
      )}

      {/* ── Toolbar & Filter Bar ── */}
      <div style={{
        background: 'var(--admin-card-bg, #ffffff)', border: '1px solid var(--admin-border, #e2e8f0)',
        borderRadius: 14, padding: 16, marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        display: 'flex', flexDirection: 'column', gap: 12
      }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1 1 260px' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search by action, description, user, IP..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', height: 40, paddingLeft: 36, paddingRight: 12,
                borderRadius: 9, border: '1px solid var(--admin-border, #e2e8f0)',
                background: 'var(--admin-bg, #f8fafc)', color: 'var(--admin-text, #0f172a)',
                fontSize: 13, outline: 'none'
              }}
            />
          </div>

          {/* Module Filter */}
          <select
            value={moduleFilter}
            onChange={e => setModuleFilter(e.target.value)}
            style={{
              height: 40, padding: '0 12px', borderRadius: 9,
              border: '1px solid var(--admin-border, #e2e8f0)',
              background: 'var(--admin-bg, #f8fafc)', color: 'var(--admin-text, #0f172a)',
              fontSize: 13, minWidth: 140
            }}
          >
            <option value="">All Resources</option>
            {Object.keys(RESOURCE_META).map(m => (
              <option key={m} value={m}>{RESOURCE_META[m].label}</option>
            ))}
          </select>

          {/* Action Filter */}
          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            style={{
              height: 40, padding: '0 12px', borderRadius: 9,
              border: '1px solid var(--admin-border, #e2e8f0)',
              background: 'var(--admin-bg, #f8fafc)', color: 'var(--admin-text, #0f172a)',
              fontSize: 13, minWidth: 130
            }}
          >
            <option value="">All Actions</option>
            {Object.keys(ACTION_CONFIG).map(a => (
              <option key={a} value={a}>{ACTION_CONFIG[a].label}</option>
            ))}
          </select>

          {/* Risk Filter */}
          <select
            value={riskFilter}
            onChange={e => setRiskFilter(e.target.value)}
            style={{
              height: 40, padding: '0 12px', borderRadius: 9,
              border: '1px solid var(--admin-border, #e2e8f0)',
              background: 'var(--admin-bg, #f8fafc)', color: 'var(--admin-text, #0f172a)',
              fontSize: 13, minWidth: 120
            }}
          >
            <option value="">All Risks</option>
            <option value="low">Low Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="high">High Risk</option>
            <option value="critical">Critical Risk</option>
          </select>

          {(search || moduleFilter || actionFilter || riskFilter || dateFrom || dateTo) && (
            <button
              onClick={clearFilters}
              style={{
                height: 40, padding: '0 14px', borderRadius: 9,
                border: '1px solid #fee2e2', background: '#fef2f2', color: '#b91c1c',
                fontWeight: 600, fontSize: 13, cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 6
              }}
            >
              <X size={14} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Enterprise Audit Log Table ── */}
      <div style={{
        background: 'var(--admin-card-bg, #ffffff)', border: '1px solid var(--admin-border, #e2e8f0)',
        borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}>
        {/* Table Header Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '150px 140px 1fr 180px 100px 80px',
          padding: '12px 20px', gap: 12, alignItems: 'center',
          background: 'var(--admin-bg, #f8fafc)',
          borderBottom: '1px solid var(--admin-border, #e2e8f0)',
          fontWeight: 700, fontSize: 12, color: 'var(--admin-text-muted, #64748b)',
          textTransform: 'uppercase', letterSpacing: '0.05em'
        }}>
          <div>Time</div>
          <div>Resource</div>
          <div>Activity</div>
          <div>User</div>
          <div>Risk</div>
          <div style={{ textAlign: 'right' }}>Actions</div>
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
            const actionCfg = ACTION_CONFIG[log.action] || { label: log.action, color: '#475569', bg: '#f1f5f9', IconComponent: Activity }
            const ActionIcon = actionCfg.IconComponent
            const isSelected = selectedLogIndex === index
            const entityLabel = log.model_label || (log.public_id ? `#${log.public_id}` : (log.model_id ? `#${log.model_id}` : log.description || '—'))

            return (
              <div
                key={log.id}
                onClick={() => setSelectedLogIndex(index)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '150px 140px 1fr 180px 100px 80px',
                  padding: '10px 20px', gap: 12, alignItems: 'center',
                  minHeight: 64, boxSizing: 'border-box',
                  borderBottom: '1px solid var(--admin-border, #e2e8f0)',
                  background: isSelected ? 'rgba(79, 70, 229, 0.04)' : 'transparent',
                  cursor: 'pointer', transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => {
                  if (!isSelected) e.currentTarget.style.background = '#f8fafc'
                }}
                onMouseLeave={e => {
                  if (!isSelected) e.currentTarget.style.background = 'transparent'
                }}
              >
                {/* 1. Time Column */}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--admin-text, #0f172a)' }}>
                    {formatRelative(log.created_at)}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--admin-text-muted, #94a3b8)', marginTop: 2 }}>
                    {log.created_at ? new Date(log.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : ''}
                  </div>
                </div>

                {/* 2. Resource Column */}
                <div>
                  <ResourceBadge module={log.module} />
                </div>

                {/* 3. Activity Column (3-Row Enterprise Layout) */}
                <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2, justifyContent: 'center' }}>
                  {/* Row 1: Action badge */}
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '2px 7px', borderRadius: 5, fontSize: 10, fontWeight: 700,
                      color: actionCfg.color, background: actionCfg.bg, lineHeight: 1.2
                    }}>
                      <ActionIcon size={10} />
                      <span>{actionCfg.label}</span>
                    </span>
                  </div>

                  {/* Row 2: Entity label in bold */}
                  <div
                    style={{
                      fontSize: 13, fontWeight: 700, color: 'var(--admin-text, #0f172a)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      lineHeight: 1.3
                    }}
                    title={entityLabel}
                  >
                    {entityLabel}
                  </div>

                  {/* Row 3: Resource type in muted text */}
                  <div style={{
                    fontSize: 11, fontWeight: 500, color: 'var(--admin-text-muted, #64748b)',
                    lineHeight: 1.2
                  }}>
                    {RESOURCE_META[log.module]?.label || log.module || 'System'}
                  </div>
                </div>

                {/* 4. User Column */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: log.user_name ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : '#e2e8f0',
                    color: log.user_name ? '#ffffff' : '#64748b',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: 11, flexShrink: 0
                  }}>
                    {getUserInitials(log.user_name)}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--admin-text, #0f172a)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.user_name || 'System'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--admin-text-muted, #94a3b8)', textTransform: 'capitalize' }}>
                      {log.user_role || 'Automated'}
                    </div>
                  </div>
                </div>

                {/* 5. Risk Badge Column */}
                <div>
                  <RiskBadge level={log.risk_level} />
                </div>

                {/* 6. Action Button Column */}
                <div style={{ textAlign: 'right' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedLogIndex(index)
                    }}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '6px 10px', borderRadius: 8,
                      border: '1px solid var(--admin-border, #e2e8f0)',
                      background: 'var(--admin-card-bg, #ffffff)',
                      color: 'var(--admin-text, #334155)',
                      fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = '#eef2ff'
                      e.currentTarget.style.borderColor = '#c7d2fe'
                      e.currentTarget.style.color = '#4f46e5'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'var(--admin-card-bg, #ffffff)'
                      e.currentTarget.style.borderColor = 'var(--admin-border, #e2e8f0)'
                      e.currentTarget.style.color = 'var(--admin-text, #334155)'
                    }}
                  >
                    <Eye size={13} />
                    <span>View</span>
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* ── Bottom Pagination Controls ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginTop: 16, flexWrap: 'wrap', gap: 10
      }}>
        {/* Pagination summary info */}
        <div style={{ fontSize: 13, color: 'var(--admin-text-muted, #64748b)', fontWeight: 500 }}>
          {pagination.total != null
            ? <>Page <strong>{pagination.current_page ?? 1}</strong> of <strong>{pagination.last_page ?? 1}</strong> ({pagination.total} entries)</>
            : 'Loading...'}
        </div>

        {/* Page navigation buttons */}
        {pagination.last_page > 1 && (() => {
          const cur = pagination.current_page || 1
          const last = pagination.last_page || 1

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
            height: 34, minWidth: 34, padding: '0 10px',
            borderRadius: 8, border: '1.5px solid var(--admin-border, #e2e8f0)',
            background: 'var(--admin-card-bg, #ffffff)', color: 'var(--admin-text, #334155)',
            fontWeight: 700, fontSize: 13, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s ease'
          }
          const btnActive = {
            ...btnBase,
            border: 'none',
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            color: '#ffffff',
            boxShadow: '0 2px 8px rgba(79,70,229,0.3)'
          }
          const btnDisabled = { ...btnBase, opacity: 0.4, cursor: 'not-allowed' }

          return (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                onClick={() => cur > 1 && changePage(1)}
                style={cur === 1 ? btnDisabled : btnBase}
                title="First page"
              >«</button>
              <button
                onClick={() => cur > 1 && changePage(cur - 1)}
                style={cur === 1 ? btnDisabled : btnBase}
                title="Previous page"
              >‹</button>

              {pages.map((p, i) =>
                p === '...' ? (
                  <span key={`dot-${i}`} style={{ width: 28, textAlign: 'center', color: 'var(--admin-text-muted, #94a3b8)', fontSize: 14, fontWeight: 700 }}>…</span>
                ) : (
                  <button key={p} onClick={() => changePage(p)} style={p === cur ? btnActive : btnBase}>{p}</button>
                )
              )}

              <button
                onClick={() => cur < last && changePage(cur + 1)}
                style={cur === last ? btnDisabled : btnBase}
                title="Next page"
              >›</button>
              <button
                onClick={() => cur < last && changePage(last)}
                style={cur === last ? btnDisabled : btnBase}
                title="Last page"
              >»</button>
            </div>
          )
        })()}
      </div>

      {/* ── Slide-Over Details Drawer ── */}
      <AuditDetailsDrawer
        log={selectedLog}
        currentIndex={selectedLogIndex ?? 0}
        totalCount={logs.length}
        onNavigate={handleDrawerNavigate}
        onClose={() => setSelectedLogIndex(null)}
      />

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .spin-icon { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
