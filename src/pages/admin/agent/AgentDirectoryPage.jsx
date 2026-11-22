import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  Ban,
  Wallet,
  Phone,
  Mail,
  Copy,
  Check,
  RefreshCw,
  Clock,
  Sparkles,
  Award,
  Layers,
  ArrowUpRight
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import adminAgentApi from '../../../api/adminAgentApi'
import AgentCreateModal from '../../../features/adminAgent/components/AgentCreateModal'
import ListToolbar from '../../../components/admin/ListToolbar'
import TableFooter from '../../../components/admin/TableFooter'
import EmptyState from '../../../components/common/EmptyState'
import { TableSkeleton } from '../../../components/common/Skeletons'
import CompactUlid from '../../../components/common/CompactUlid'
import useTableUrlFilters from '../../../hooks/useTableUrlFilters'

export default function AgentDirectoryPage() {
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [actionInProgress, setActionInProgress] = useState(null)

  // Enterprise URL & session-synchronized filters
  const {
    filters,
    setFilter,
    resetFilters,
    search,
    setSearch,
    debouncedSearch,
    currentPage,
    setCurrentPage,
    perPage,
    setPerPage,
    hasActiveFilters,
  } = useTableUrlFilters({
    initialFilters: {
      statusFilter: '',
    },
    aliases: {
      statusFilter: ['status'],
    },
    storageKey: 'admin_agents_filters',
    defaultPerPage: 15,
  })

  const { statusFilter } = filters
  const setStatusFilter = (val) => setFilter('statusFilter', val)

  // Pagination
  const [total, setTotal] = useState(0)

  const fetchAgents = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      const params = {
        page: currentPage,
        per_page: perPage,
      }
      if (statusFilter) params.status = statusFilter
      if (debouncedSearch && debouncedSearch.trim()) params.search = debouncedSearch.trim()

      const res = await adminAgentApi.getAgents(params)
      setAgents(res.data || [])
      if (res.pagination) {
        setTotal(res.pagination.total || 0)
      } else {
        setTotal((res.data || []).length)
      }
    } catch (err) {
      console.error('Failed to load agents:', err)
      toast.error(err?.response?.data?.message || 'Failed to fetch field agents list.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [currentPage, perPage, statusFilter, debouncedSearch])

  useEffect(() => {
    fetchAgents()
  }, [fetchAgents])



  const handleToggleStatus = async (agent) => {
    const newStatus = agent.status === 'active' ? 'suspended' : 'active'
    setActionInProgress(agent.id)
    try {
      await adminAgentApi.updateAgentStatus(
        agent.id, 
        newStatus, 
        newStatus === 'suspended' ? 'Suspended by admin governance' : 'Re-activated by admin'
      )
      toast.success(
        newStatus === 'active' 
          ? `Agent ${agent.agent_code} successfully activated!` 
          : `Agent ${agent.agent_code} suspended.`
      )
      await fetchAgents(true)
    } catch (err) {
      console.error('Failed to toggle agent status:', err)
      toast.error(err?.response?.data?.message || 'Failed to update agent status.')
    } finally {
      setActionInProgress(null)
    }
  }

  const clearFilters = () => {
    resetFilters()
  }

  // Calculate live stats
  const stats = useMemo(() => {
    const totalCount = total || agents.length
    const activeCount = agents.filter(a => a.status === 'active').length
    const suspendedCount = agents.filter(a => a.status === 'suspended').length
    const withWalletsCount = agents.filter(a => Boolean(a.ledger_account_id || a.ledger_account)).length

    return { totalCount, activeCount, suspendedCount, withWalletsCount }
  }, [total, agents])

  const getInitials = (name) => {
    if (!name) return 'AG'
    const parts = name.trim().split(' ')
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }

  return (
    <div className="admin-container" style={{ animation: 'fadeIn 0.3s ease-out' }}>
      {/* ── Page Header ── */}
      <div className="admin-page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ 
              fontSize: 22, 
              width: 44, 
              height: 44, 
              borderRadius: 12, 
              background: 'linear-gradient(135deg, rgba(0, 184, 117, 0.15) 0%, rgba(2, 132, 199, 0.15) 100%)',
              border: '1px solid rgba(0, 184, 117, 0.3)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              💼
            </span>
            <div>
              <h2 className="admin-page-title" style={{ color: 'var(--admin-text)', margin: 0, fontSize: 24, fontWeight: 800 }}>
                Field Agent Directory
              </h2>
              <p className="admin-page-subtitle" style={{ color: 'var(--admin-text-muted)', margin: '4px 0 0', fontSize: 13 }}>
                Governance, liability ledger accounts, commission tiers, and territory performance
              </p>
            </div>
          </div>
        </div>

        <div className="admin-page-actions" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="admin-btn admin-btn-primary"
            style={{
              height: 42,
              padding: '0 20px',
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 13,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 14px rgba(0, 184, 117, 0.3)',
            }}
          >
            <UserPlus size={16} />
            <span>+ Add New Agent</span>
          </button>
        </div>
      </div>

      {/* ── KPI Metric Stat Cards ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16,
        marginBottom: 20,
      }}>
        {/* Total Agents */}
        <div className="admin-card" style={{ padding: '18px 20px', borderRadius: 14, margin: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Agents
            </span>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={18} />
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--admin-text)', marginTop: 8, letterSpacing: '-0.02em' }}>
            {stats.totalCount}
          </div>
          <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>Registered field workforce</span>
          </div>
        </div>

        {/* Active Agents */}
        <div className="admin-card" style={{ padding: '18px 20px', borderRadius: 14, margin: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Active Agents
            </span>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#10B981', marginTop: 8, letterSpacing: '-0.02em' }}>
            {stats.activeCount}
          </div>
          <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 4 }}>
            <span>Authorized to submit providers</span>
          </div>
        </div>

        {/* Suspended Agents */}
        <div className="admin-card" style={{ padding: '18px 20px', borderRadius: 14, margin: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Suspended
            </span>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Ban size={18} />
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: stats.suspendedCount > 0 ? '#EF4444' : 'var(--admin-text)', marginTop: 8, letterSpacing: '-0.02em' }}>
            {stats.suspendedCount}
          </div>
          <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 4 }}>
            <span>Access temporarily blocked</span>
          </div>
        </div>

        {/* Ledger Wallets */}
        <div className="admin-card" style={{ padding: '18px 20px', borderRadius: 14, margin: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Ledger Wallets
            </span>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wallet size={18} />
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#8B5CF6', marginTop: 8, letterSpacing: '-0.02em' }}>
            {stats.withWalletsCount}
          </div>
          <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 4 }}>
            <span>Auto-linked double-entry accounts</span>
          </div>
        </div>
      </div>

      {/* ── Enterprise Toolbar ── */}
      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search agent by code, name, phone, email, or NID..."
        onRefresh={() => fetchAgents(true)}
        refreshing={refreshing || loading}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(p => !p)}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
        activeFilters={[
          statusFilter && { 
            key: 'status', 
            label: `Status: ${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}`, 
            onRemove: () => setStatusFilter('') 
          },
        ].filter(Boolean)}
      >
        <div style={{ minWidth: 160 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Status Filter
          </label>
          <select
            className="status-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              width: '100%',
              height: 40,
              background: 'var(--admin-card-bg)',
              border: '1px solid var(--admin-border)',
              color: 'var(--admin-text)',
              borderRadius: 8,
              padding: '0 12px',
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            <option value="">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="suspended">Suspended Only</option>
          </select>
        </div>
      </ListToolbar>

      {/* ── Main Table Card ── */}
      <div className="admin-card" style={{ overflow: 'hidden', marginTop: 16 }}>
        <div
          className="admin-card-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid var(--admin-border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h3 className="admin-card-title" style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--admin-text)' }}>
              Registered Agents
            </h3>
            <span style={{
              fontSize: 11,
              fontWeight: 800,
              background: 'rgba(0, 184, 117, 0.1)',
              color: '#00B875',
              padding: '3px 8px',
              borderRadius: 6,
            }}>
              {total} Total
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>
              Showing Page {currentPage}
            </span>
          </div>
        </div>

        <div className="admin-card-body" style={{ padding: 0 }}>
          {loading && agents.length === 0 ? (
            <TableSkeleton
              rowCount={6}
              columnWidths={['160px', '220px', '200px', '180px', '130px', '110px', '120px']}
              headers={['Agent Code', 'Agent Identity', 'Contact Info', 'Liability Wallet', 'Commission Tier', 'Status', 'Actions']}
            />
          ) : agents.length === 0 ? (
            <EmptyState
              hasFilters={Boolean(statusFilter || search)}
              searchQuery={search}
              onClearFilters={clearFilters}
              onClearSearch={() => setSearch('')}
              icon="💼"
              title="No field agents found"
              description={search || statusFilter ? 'Try adjusting your search criteria or resetting filters.' : 'Get started by creating your first field sales agent.'}
              action={
                !search && !statusFilter && (
                  <button
                    onClick={() => setCreateModalOpen(true)}
                    className="admin-btn admin-btn-primary"
                    style={{ marginTop: 14 }}
                  >
                    <UserPlus size={16} /> + Add First Agent
                  </button>
                )
              }
            />
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ paddingLeft: 20 }}>Agent Code</th>
                    <th>Agent Identity</th>
                    <th>Contact Info</th>
                    <th>Ledger Wallet</th>
                    <th>Commission Tier</th>
                    <th style={{ textAlign: 'center' }}>Status</th>
                    <th style={{ textAlign: 'right', paddingRight: 20 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {agents.map((agent) => {
                    const isBusy = actionInProgress === agent.id
                    const isActive = agent.status === 'active'

                    return (
                      <tr key={agent.id} style={{ transition: 'background 0.15s' }}>
                        {/* Agent Code */}
                        <td style={{ paddingLeft: 20 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{
                              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                              fontSize: 13,
                              fontWeight: 800,
                              color: '#00B875',
                              background: 'rgba(0, 184, 117, 0.08)',
                              border: '1px solid rgba(0, 184, 117, 0.2)',
                              padding: '3px 8px',
                              borderRadius: 6,
                              display: 'inline-block'
                            }}>
                              {agent.public_id || agent.agent_code}
                            </span>
                          </div>
                          {agent.nid_number && (
                            <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', marginTop: 4 }}>
                              NID: {agent.nid_number}
                            </div>
                          )}
                        </td>

                        {/* Agent Identity */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{
                              width: 38,
                              height: 38,
                              borderRadius: 10,
                              background: 'linear-gradient(135deg, #00B875 0%, #0284c7 100%)',
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: 13,
                              flexShrink: 0,
                              boxShadow: '0 2px 6px rgba(0, 184, 117, 0.25)',
                            }}>
                              {getInitials(agent.user?.name)}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: 'var(--admin-text)', fontSize: 14 }}>
                                {agent.user?.name || 'Unnamed Agent'}
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', marginTop: 2 }}>
                                Added {agent.created_at ? new Date(agent.created_at).toLocaleDateString() : 'Recently'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Contact Info */}
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {agent.user?.phone ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--admin-text)' }}>
                                <Phone size={13} color="#00B875" />
                                <a href={`tel:${agent.user.phone}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                                  {agent.user.phone}
                                </a>
                              </div>
                            ) : (
                              <span style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>No phone</span>
                            )}
                            {agent.user?.email && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--admin-text-muted)' }}>
                                <Mail size={12} />
                                <span>{agent.user.email}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Ledger Wallet */}
                        <td>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--admin-bg)', border: '1px solid var(--admin-border)', padding: '5px 10px', borderRadius: 8 }}>
                            <Wallet size={14} color="#8B5CF6" />
                            <div>
                              <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11.5, fontWeight: 700, color: 'var(--admin-text)' }}>
                                {agent.ledger_account?.account_number || `ACC-AGT-${agent.id}`}
                              </div>
                              <div style={{ fontSize: 10, color: '#8B5CF6', fontWeight: 700, textTransform: 'uppercase' }}>
                                Double-Entry Liability
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Commission Tier */}
                        <td>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            fontSize: 11.5,
                            fontWeight: 700,
                            padding: '4px 10px',
                            borderRadius: 6,
                            background: 'rgba(2, 132, 199, 0.08)',
                            color: '#0284C7',
                            border: '1px solid rgba(2, 132, 199, 0.2)',
                            textTransform: 'uppercase',
                          }}>
                            <Award size={13} />
                            {agent.rule_tier_id || 'standard_tier'}
                          </span>
                        </td>

                        {/* Status */}
                        <td style={{ textAlign: 'center' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '4px 10px',
                              borderRadius: 20,
                              fontSize: 11.5,
                              fontWeight: 700,
                              background: isActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                              color: isActive ? '#059669' : '#DC2626',
                              border: isActive ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(239, 68, 68, 0.25)',
                            }}
                          >
                            <span style={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              background: isActive ? '#10B981' : '#EF4444',
                              boxShadow: isActive ? '0 0 6px #10B981' : 'none'
                            }} />
                            {isActive ? 'Active' : 'Suspended'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td style={{ textAlign: 'right', paddingRight: 20 }}>
                          <button
                            disabled={isBusy}
                            onClick={() => handleToggleStatus(agent)}
                            className="admin-btn admin-btn-sm"
                            style={{
                              height: 32,
                              padding: '0 12px',
                              fontSize: 12,
                              fontWeight: 700,
                              borderRadius: 8,
                              background: isActive ? 'transparent' : 'rgba(16, 185, 129, 0.1)',
                              color: isActive ? '#EF4444' : '#059669',
                              border: isActive ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                              cursor: isBusy ? 'not-allowed' : 'pointer',
                              transition: 'all 0.15s ease',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                            }}
                            onMouseEnter={(e) => {
                              if (!isBusy) {
                                e.currentTarget.style.background = isActive ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.2)'
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isBusy) {
                                e.currentTarget.style.background = isActive ? 'transparent' : 'rgba(16, 185, 129, 0.1)'
                              }
                            }}
                          >
                            {isBusy ? (
                              <RefreshCw size={12} className="animate-spin" />
                            ) : isActive ? (
                              <Ban size={12} />
                            ) : (
                              <CheckCircle2 size={12} />
                            )}
                            <span>{isActive ? 'Suspend' : 'Activate'}</span>
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Table Footer & Pagination ── */}
        {!loading && agents.length > 0 && (
          <TableFooter
            total={total}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            perPage={perPage}
            setPerPage={setPerPage}
          />
        )}
      </div>

      {/* ── Create Agent Modal ── */}
      <AgentCreateModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => fetchAgents(true)}
      />
    </div>
  )
}
