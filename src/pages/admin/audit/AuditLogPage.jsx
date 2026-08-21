import ListToolbar from '../../../components/admin/ListToolbar'
import { TableSkeleton } from '../../../components/common/Skeletons'
import EmptyState from '../../../components/common/EmptyState'
import CompactUlid from '../../../components/common/CompactUlid'
import TableFooter from '../../../components/admin/TableFooter'
import { useState, useEffect, useCallback, useRef } from 'react'
import { Shield, Search, Download, Trash2, RefreshCw, ChevronDown, ChevronUp, Eye, AlertTriangle, CheckCircle, XCircle, Info, Activity, LogIn, LogOut, FilePlus, FileEdit, Flame, Users, Calendar, Filter, X } from 'lucide-react'
import { getAuditLogs, getAuditStats, exportAuditLogs, clearOldAuditLogs } from '../../../api/auditApi'

// ── Helpers ──────────────────────────────────────────────────────────────────

const RISK_CONFIG = {
  low:      { label: 'Low',      color: '#22c55e', bg: 'rgba(34,197,94,0.12)',   icon: <CheckCircle size={12}/> },
  medium:   { label: 'Medium',   color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: <AlertTriangle size={12}/> },
  high:     { label: 'High',     color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   icon: <XCircle size={12}/> },
  critical: { label: 'Critical', color: '#dc2626', bg: 'rgba(220,38,38,0.18)',   icon: <Flame size={12}/> },
}

const ACTION_CONFIG = {
  create:        { label: 'Create',       color: '#22c55e', icon: <FilePlus size={13}/> },
  update:        { label: 'Update',       color: '#3b82f6', icon: <FileEdit size={13}/> },
  delete:        { label: 'Delete',       color: '#ef4444', icon: <Trash2 size={13}/> },
  login:         { label: 'Login',        color: '#8b5cf6', icon: <LogIn size={13}/> },
  logout:        { label: 'Logout',       color: '#6b7280', icon: <LogOut size={13}/> },
  login_failed:  { label: 'Login Failed', color: '#dc2626', icon: <XCircle size={13}/> },
  export:        { label: 'Export',       color: '#f59e0b', icon: <Download size={13}/> },
  status_change: { label: 'Status',       color: '#06b6d4', icon: <Activity size={13}/> },
  bulk_action:   { label: 'Bulk Action',  color: '#d946ef', icon: <Flame size={13}/> },
}

function RiskBadge({ level }) {
  const cfg = RISK_CONFIG[level] || RISK_CONFIG.low
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700,
      color: cfg.color, background: cfg.bg, letterSpacing: 0.3,
      border: `1px solid ${cfg.color}33`
    }}>
      {cfg.icon} {cfg.label}
    </span>
  )
}

function ActionBadge({ action }) {
  const cfg = ACTION_CONFIG[action] || { label: action, color: '#6b7280', icon: <Activity size={13}/> }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
      color: cfg.color, background: `${cfg.color}15`,
      border: `1px solid ${cfg.color}30`
    }}>
      {cfg.icon} {cfg.label}
    </span>
  )
}

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div style={{
      background: 'var(--admin-card-bg, #fff)',
      border: '1px solid var(--admin-border, #e2e8f0)',
      borderRadius: 16, padding: '20px 24px',
      display: 'flex', flexDirection: 'column', gap: 4,
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      transition: 'box-shadow 0.2s',
      flex: '1 1 180px', minWidth: 160
    }}
    onMouseEnter={e => e.currentTarget.style.boxShadow = `0 4px 20px ${color}25`}
    onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color
        }}>
          {icon}
        </div>
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--admin-text, #0f172a)', lineHeight: 1.2, marginTop: 8 }}>
        {value ?? '—'}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text-muted, #64748b)' }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--admin-text-muted, #94a3b8)', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

function JsonDiff({ old_values, new_values, changed_fields }) {
  if (!old_values && !new_values) return <p style={{ color: 'var(--admin-text-muted)' }}>No value changes recorded.</p>
  const fields = changed_fields?.length ? changed_fields : Object.keys({ ...old_values, ...new_values })
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
      {fields.map(key => (
        <div key={key} style={{ gridColumn: '1/-1' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{key}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 8, padding: '6px 10px', fontSize: 12, color: '#ef4444', wordBreak: 'break-all' }}>
              <span style={{ fontSize: 10, fontWeight: 700, opacity: 0.7 }}>BEFORE: </span>
              {old_values?.[key] !== undefined ? String(old_values[key]) : <em>—</em>}
            </div>
            <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 8, padding: '6px 10px', fontSize: 12, color: '#16a34a', wordBreak: 'break-all' }}>
              <span style={{ fontSize: 10, fontWeight: 700, opacity: 0.7 }}>AFTER: </span>
              {new_values?.[key] !== undefined ? String(new_values[key]) : <em>—</em>}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function formatRelative(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  const now = new Date()
  const diff = (now - d) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── Main Component ────────────────────────────────────────────────────────────

const MODULES = ['Auth', 'Doctor', 'Hospital', 'Patient', 'Appointment', 'DoctorChamber',
  'Prescription', 'User', 'DoctorSubscription', 'SubscriptionPackage', 'PromoCode', 'AuditLog']
const ACTIONS = ['create', 'update', 'delete', 'login', 'logout', 'login_failed', 'export', 'status_change', 'bulk_action']
const RISK_LEVELS = ['low', 'medium', 'high', 'critical']

export default function AuditLogPage() {
  const [logs, setLogs]         = useState([])
  const [stats, setStats]       = useState(null)
  const [pagination, setPagination] = useState({})
  const [loading, setLoading]   = useState(false)
  const [statsLoading, setStatsLoading] = useState(false)
  const [expandedId, setExpandedId] = useState(null)
  const [showFilters, setShowFilters] = useState(false)

  const [filters, setFilters] = useState({
    search: '', module: '', action: '', risk_level: '',
    ip_address: '', date_from: '', date_to: '', per_page: 10, page: 1,
  })

  const debounceRef = useRef(null)

  // ── Fetch logs ──────────────────────────────────────────────────────────
  const fetchLogs = useCallback(async (params = filters) => {
    setLoading(true)
    try {
      const cleanParams = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== ''))
      const res = await getAuditLogs(cleanParams)
      setLogs(res.data.data?.data || [])
      setPagination(res.data.data || {})
    } catch (err) {
      
    } finally {
      setLoading(false)
    }
  }, [filters])

  const fetchStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const res = await getAuditStats()
      setStats(res.data.data)
    } catch { /* silent */ } finally {
      setStatsLoading(false)
    }
  }, [])

  useEffect(() => { fetchLogs(); fetchStats() }, [])

  // ── Filter change (debounced search) ────────────────────────────────────
  const handleFilterChange = (key, value) => {
    const updated = { ...filters, [key]: value, page: 1 }
    setFilters(updated)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchLogs(updated), key === 'search' ? 500 : 0)
  }

  const clearFilters = () => {
    const reset = { search: '', module: '', action: '', risk_level: '', ip_address: '', date_from: '', date_to: '', per_page: 10, page: 1 }
    setFilters(reset)
    fetchLogs(reset)
  }

  const changePage = (p) => {
    const updated = { ...filters, page: p }
    setFilters(updated)
    fetchLogs(updated)
  }

  // ── Export ──────────────────────────────────────────────────────────────
  const handleExport = async () => {
    try {
      const cleanParams = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '' && !['page', 'per_page'].includes(v)))
      const res = await exportAuditLogs(cleanParams)
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `audit_log_${new Date().toISOString().slice(0,10)}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
      
    } catch {  }
  }

  const hasActiveFilters = filters.module || filters.action || filters.risk_level || filters.ip_address || filters.date_from || filters.date_to

  return (
    <div style={{ padding: '24px', maxWidth: '100%' }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
            boxShadow: '0 4px 14px rgba(99,102,241,0.35)'
          }}>
            <Shield size={22}/>
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--admin-text)', letterSpacing: '-0.5px' }}>
              Audit Log
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--admin-text-muted)' }}>
              Complete activity trail — every action, who did it, and when
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={() => { fetchLogs(); fetchStats() }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: '1px solid var(--admin-border)', background: 'var(--admin-card-bg)', color: 'var(--admin-text)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <RefreshCw size={14}/> Refresh
          </button>
          <button onClick={handleExport}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(99,102,241,0.3)' }}>
            <Download size={14}/> Export CSV
          </button>
        </div>
      </div>

      {/* ── Stats Cards ── */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
        <StatCard icon={<Activity size={20}/>} label="Events Today" value={stats?.totals?.today} color="#6366f1" sub={`${stats?.totals?.total ?? '—'} total all time`}/>
        <StatCard icon={<Flame size={20}/>} label="High Risk Today" value={stats?.totals?.high_risk_today} color="#ef4444" sub="High + Critical events"/>
        <StatCard icon={<LogIn size={20}/>} label="Logins Today" value={stats?.totals?.logins_today} color="#22c55e" sub={`${stats?.totals?.failed_logins_today ?? 0} failed attempts`}/>
        <StatCard icon={<Trash2 size={20}/>} label="Deletes Today" value={stats?.totals?.deletes_today} color="#f59e0b" sub={`${stats?.totals?.total_deletes ?? 0} total deletes`}/>
        <StatCard icon={<Users size={20}/>} label="Active Users" value={stats?.active_users?.length} color="#06b6d4" sub="Last 7 days"/>
      </div>

      <ListToolbar
        search={filters.search}
        onSearchChange={val => handleFilterChange('search', val)}
        searchPlaceholder="Search user, email, description, IP..."
        onRefresh={() => fetchLogs()}
        refreshing={loading}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(p => !p)}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
        activeFilters={[
          filters.module && { key: 'module', label: `Module: ${filters.module}`, onRemove: () => handleFilterChange('module', '') },
          filters.action && { key: 'action', label: `Action: ${filters.action.toUpperCase()}`, onRemove: () => handleFilterChange('action', '') },
          filters.risk_level && { key: 'risk', label: `Risk: ${filters.risk_level.toUpperCase()}`, onRemove: () => handleFilterChange('risk_level', '') },
          filters.ip_address && { key: 'ip', label: `IP: ${filters.ip_address}`, onRemove: () => handleFilterChange('ip_address', '') },
          filters.date_from && { key: 'from', label: `From: ${filters.date_from}`, onRemove: () => handleFilterChange('date_from', '') },
          filters.date_to && { key: 'to', label: `To: ${filters.date_to}`, onRemove: () => handleFilterChange('date_to', '') },
        ].filter(Boolean)}
      >
        <select value={filters.module} onChange={e => handleFilterChange('module', e.target.value)}
          style={{ height: 38, padding: '0 12px', borderRadius: 8, border: '1px solid var(--admin-border)', background: 'var(--admin-card-bg)', color: 'var(--admin-text)', fontSize: 13, cursor: 'pointer' }}>
          <option value="">All Modules</option>
          {MODULES.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={filters.action} onChange={e => handleFilterChange('action', e.target.value)}
          style={{ height: 38, padding: '0 12px', borderRadius: 8, border: '1px solid var(--admin-border)', background: 'var(--admin-card-bg)', color: 'var(--admin-text)', fontSize: 13, cursor: 'pointer' }}>
          <option value="">All Actions</option>
          {ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={filters.risk_level} onChange={e => handleFilterChange('risk_level', e.target.value)}
          style={{ height: 38, padding: '0 12px', borderRadius: 8, border: '1px solid var(--admin-border)', background: 'var(--admin-card-bg)', color: 'var(--admin-text)', fontSize: 13, cursor: 'pointer' }}>
          <option value="">All Risk Levels</option>
          {RISK_LEVELS.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
        </select>
        <input value={filters.ip_address} onChange={e => handleFilterChange('ip_address', e.target.value)}
          placeholder="IP Address..."
          style={{ height: 38, padding: '0 12px', borderRadius: 8, border: '1px solid var(--admin-border)', background: 'var(--admin-card-bg)', color: 'var(--admin-text)', fontSize: 13, width: 120 }}
        />
        <input type="date" value={filters.date_from} onChange={e => handleFilterChange('date_from', e.target.value)}
          style={{ height: 38, padding: '0 12px', borderRadius: 8, border: '1px solid var(--admin-border)', background: 'var(--admin-card-bg)', color: 'var(--admin-text)', fontSize: 13 }}
        />
        <input type="date" value={filters.date_to} onChange={e => handleFilterChange('date_to', e.target.value)}
          style={{ height: 38, padding: '0 12px', borderRadius: 8, border: '1px solid var(--admin-border)', background: 'var(--admin-card-bg)', color: 'var(--admin-text)', fontSize: 13 }}
        />
      </ListToolbar>

      {/* ── Table Toolbar: Show Entries ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 10, flexWrap: 'wrap', gap: 8
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--admin-text-muted)', fontWeight: 600 }}>
          Show
          <select
            value={filters.per_page}
            onChange={e => handleFilterChange('per_page', Number(e.target.value))}
            style={{
              padding: '5px 10px', borderRadius: 8,
              border: '1.5px solid var(--admin-border)',
              background: 'var(--admin-card-bg)', color: 'var(--admin-text)',
              fontSize: 13, fontWeight: 700, cursor: 'pointer', outline: 'none',
              minWidth: 70
            }}
          >
            {[10, 25, 50, 100, 500].map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          entries
        </div>
        {pagination.total != null && (
          <div style={{ fontSize: 13, color: 'var(--admin-text-muted)' }}>
            Showing <strong>{pagination.from ?? 0}</strong>–<strong>{pagination.to ?? 0}</strong> of <strong>{pagination.total ?? 0}</strong> entries
          </div>
        )}
      </div>

      {/* ── Table ── */}
      <div style={{
        background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)',
        borderRadius: 16, overflow: 'hidden',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
      }}>
        {/* Table Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '140px 120px 85px 85px 85px 1fr 100px 80px',
          padding: '12px 20px',
          background: 'var(--admin-table-header-bg, rgba(99,102,241,0.05))',
          borderBottom: '1px solid var(--admin-border)',
          fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)',
          textTransform: 'uppercase', letterSpacing: 0.5, gap: 8
        }}>
          <span>When</span>
          <span>ID</span>
          <span>Action</span>
          <span>Module</span>
          <span>Risk</span>
          <span>Description</span>
          <span>Who</span>
          <span>IP</span>
        </div>

        {loading ? (
          <TableSkeleton
            rowCount={8}
            columnWidths={['160px', '90px', '90px', '90px', '30%', '100px', '80px']}
            headers={['When', 'Action', 'Module', 'Risk', 'Description', 'Who', 'IP']}
          />
        ) : logs.length === 0 ? (
          <EmptyState
            hasFilters={hasActiveFilters}
            searchQuery={filters.search}
            onClearFilters={clearFilters}
            onClearSearch={() => handleFilterChange('search', '')}
            icon="🛡️"
            title="No audit entries found"
            description="Try adjusting your filters or wait for activity to be logged."
          />
        ) : (
          logs.map((log, idx) => {
            const isExpanded = expandedId === log.id
            const rowBg = isExpanded ? 'rgba(99,102,241,0.04)' : idx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.015)'
            return (
              <div key={log.id} style={{ borderBottom: '1px solid var(--admin-border)', transition: 'background 0.15s' }}>
                {/* Main row */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '140px 120px 85px 85px 85px 1fr 100px 80px',
                    padding: '12px 20px', gap: 8, alignItems: 'center',
                    background: rowBg, cursor: 'pointer', transition: 'background 0.15s'
                  }}
                  onClick={() => setExpandedId(isExpanded ? null : log.id)}
                  onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.background = 'rgba(99,102,241,0.03)' }}
                  onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.background = rowBg }}
                >
                  {/* When */}
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text)' }}>{formatRelative(log.created_at)}</div>
                    <CompactUlid value={log.public_id || log.id} />
                    <div style={{ fontSize: 10, color: 'var(--admin-text-muted)' }}>{log.created_at ? new Date(log.created_at).toLocaleString('en-GB') : ''}</div>
                  </div>
                  {/* Action */}
                  <div><ActionBadge action={log.action}/></div>
                  {/* Module */}
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-text)' }}>{log.module}</div>
                  {/* Risk */}
                  <div><RiskBadge level={log.risk_level}/></div>
                  {/* Description */}
                  <div style={{ fontSize: 12, color: 'var(--admin-text)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.description}>
                    {log.description}
                  </div>
                  {/* Who */}
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.user_name || '—'}</div>
                    <div style={{ fontSize: 10, color: 'var(--admin-text-muted)' }}>{log.user_role}</div>
                  </div>
                  {/* IP */}
                  <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', fontFamily: 'monospace' }}>
                    {log.ip_address || '—'}
                  </div>
                </div>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div style={{
                    padding: '16px 20px 20px',
                    background: 'rgba(99,102,241,0.03)',
                    borderTop: '1px dashed var(--admin-border)'
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
                      {[
                        ['User Email', log.user_email],
                        ['Model Type', log.model_type?.split('\\').pop()],
                        ['Model ID', log.model_id],
                        ['Model Label', log.model_label],
                        ['HTTP Method', log.request_method],
                        ['HTTP Status', log.http_status],
                        ['Session ID', log.session_id?.slice(0, 12) + '...'],
                      ].filter(([, v]) => v).map(([k, v]) => (
                        <div key={k}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>{k}</div>
                          <div style={{ fontSize: 12, color: 'var(--admin-text)', fontWeight: 500, wordBreak: 'break-all' }}>{v}</div>
                        </div>
                      ))}
                    </div>
                    {log.request_url && (
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>Request URL</div>
                        <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', fontFamily: 'monospace', wordBreak: 'break-all' }}>{log.request_url}</div>
                      </div>
                    )}
                    {log.tags?.length > 0 && (
                      <div style={{ marginBottom: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {log.tags.map(t => (
                          <span key={t} style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>{t}</span>
                        ))}
                      </div>
                    )}
                    {(log.old_values || log.new_values) && (
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--admin-text)', marginBottom: 8 }}>📊 Value Changes</div>
                        <JsonDiff old_values={log.old_values} new_values={log.new_values} changed_fields={log.changed_fields}/>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      
      <TableFooter
        total={pagination.total || 0}
        currentPage={pagination.current_page || 1}
        setCurrentPage={(p) => changePage(p)}
        perPage={filters.per_page || 10}
        setPerPage={(n) => handleFilterChange('per_page', n)}
        perPageOptions={[10, 25, 50, 100]}
      />
<style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
