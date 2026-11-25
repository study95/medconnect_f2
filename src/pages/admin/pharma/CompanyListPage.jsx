// CompanyListPage.jsx — Pharmaceutical Companies Master Management (MedConnect Admin)
import { useState, useMemo } from 'react'
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Globe,
  Phone,
  Mail,
  ExternalLink,
  MapPin,
} from 'lucide-react'
import {
  useAdminCompanies,
  useAdminCompanyMutations,
} from '../../../features/pharma/useAdminCompanies'
import toast from 'react-hot-toast'
import ListToolbar from '../../../components/admin/ListToolbar'
import TableFooter from '../../../components/admin/TableFooter'
import DeleteModal from '../../../components/admin/DeleteModal'
import EmptyState from '../../../components/common/EmptyState'
import CompactUlid from '../../../components/common/CompactUlid'
import { safeHttpUrl } from '../../../utils/sanitizeHtml'
import { TableSkeleton } from '../../../components/common/Skeletons'
import { getErrorMessage } from '../../../utils/errorHelper'

export default function CompanyListPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(25)

  // Modals state
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    name_bn: '',
    website: '',
    email: '',
    phone: '',
    address: '',
    origin: 'Bangladesh',
    sort_order: 0,
    is_active: true,
  })

  const queryParams = useMemo(
    () => ({
      search: search.trim() || undefined,
      status: statusFilter !== 'ALL' ? statusFilter : undefined,
      page: currentPage,
      per_page: perPage,
    }),
    [search, statusFilter, currentPage, perPage]
  )

  const { items: companies, pagination, isLoading, isFetching, refetch } = useAdminCompanies(queryParams)
  const {
    createMutation,
    updateMutation,
    deleteMutation,
    toggleActiveMutation,
  } = useAdminCompanyMutations()

  const handleOpenCreate = () => {
    setEditTarget(null)
    setFormData({
      name: '',
      name_bn: '',
      website: '',
      email: '',
      phone: '',
      address: '',
      origin: 'Bangladesh',
      sort_order: 0,
      is_active: true,
    })
    setShowModal(true)
  }

  const handleOpenEdit = (company) => {
    setEditTarget(company)
    setFormData({
      name: company.name || '',
      name_bn: company.name_bn || '',
      website: company.website || '',
      email: company.email || '',
      phone: company.phone || '',
      address: company.address || '',
      origin: company.origin || 'Bangladesh',
      sort_order: company.sort_order ?? 0,
      is_active: company.is_active ?? true,
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error('Company name is required')
      return
    }

    try {
      if (editTarget) {
        await updateMutation.mutateAsync({ id: editTarget.id, data: formData })
        toast.success(`"${formData.name}" updated successfully`)
      } else {
        await createMutation.mutateAsync(formData)
        toast.success(`"${formData.name}" created successfully`)
      }
      setShowModal(false)
      refetch()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to save company.'))
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteMutation.mutateAsync(deleteTarget.id)
      toast.success('Company deleted successfully')
      setDeleteTarget(null)
      refetch()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete company.'))
    }
  }

  const handleToggle = async (item) => {
    try {
      await toggleActiveMutation.mutateAsync(item.id)
      toast.success(`"${item.name}" status updated`)
      refetch()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update company status.'))
    }
  }

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Building2 size={24} color="#00A88C" /> Pharmaceutical Companies
          </h2>
          <p className="admin-page-subtitle">
            {pagination.total} pharmaceutical manufacturer(s) & brand directories registered in system
          </p>
        </div>
        <button
          type="button"
          className="admin-btn admin-btn-primary"
          onClick={handleOpenCreate}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <Plus size={16} /> Add Company
        </button>
      </div>

      {/* Toolbar / Filters */}
      <ListToolbar
        search={search}
        onSearchChange={(v) => {
          setSearch(v)
          setCurrentPage(1)
        }}
        searchPlaceholder="Search company by name, phone, email..."
        onRefresh={refetch}
        refreshing={isLoading || isFetching}
        hasActiveFilters={statusFilter !== 'ALL'}
        onClearFilters={() => {
          setStatusFilter('ALL')
          setSearch('')
          setCurrentPage(1)
        }}
        activeFilters={[
          statusFilter !== 'ALL' && {
            key: 'status',
            label: `Status: ${statusFilter === 'true' ? 'Active' : 'Inactive'}`,
            onRemove: () => setStatusFilter('ALL'),
          },
        ].filter(Boolean)}
      >
        <div style={{ minWidth: 160, flex: '1 1 160px' }}>
          <label
            style={{
              display: 'block',
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--admin-text-muted)',
              marginBottom: 4,
              textTransform: 'uppercase',
            }}
          >
            Status
          </label>
          <select
            className="status-select"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setCurrentPage(1)
            }}
            style={{
              width: '100%',
              height: 38,
              background: 'var(--admin-card-bg)',
              border: '1px solid var(--admin-border)',
              borderRadius: 8,
              color: 'var(--admin-text)',
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="true">Active Only</option>
            <option value="false">Inactive Only</option>
          </select>
        </div>
      </ListToolbar>

      {/* Main Table Card */}
      <div className="admin-card">
        <div
          className="admin-card-header"
          style={{
            background: 'rgba(0,0,0,0.02)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h3 className="admin-card-title" style={{ color: 'var(--admin-text)', margin: 0 }}>
            Pharmaceutical Manufacturers Directory
          </h3>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--admin-primary)',
              background: 'rgba(0, 168, 140, 0.1)',
              padding: '4px 12px',
              borderRadius: 20,
            }}
          >
            {pagination.total} Companies Total
          </span>
        </div>

        {isLoading && companies.length === 0 ? (
          <TableSkeleton
            rowCount={8}
            columnWidths={['80px', '32%', '18%', '22%', '10%', '10%']}
            headers={['ID', 'Company Name', 'Origin', 'Contact Info', 'Status', 'Actions']}
          />
        ) : companies.length === 0 ? (
          <EmptyState
            searchQuery={search}
            onClearSearch={() => setSearch('')}
            icon="🏢"
            title="No companies found"
            description="Try a different search query or click Add Company to create a new pharmaceutical manufacturer."
            primaryAction={{ label: '+ Add Company', onClick: handleOpenCreate }}
          />
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 80, paddingLeft: 20, color: 'var(--admin-text-muted)' }}>ID</th>
                  <th style={{ color: 'var(--admin-text-muted)' }}>কোম্পানির নাম (Company Name)</th>
                  <th style={{ color: 'var(--admin-text-muted)' }}>উৎস / দেশ (Origin)</th>
                  <th style={{ color: 'var(--admin-text-muted)' }}>যোগাযোগ (Contact)</th>
                  <th style={{ textAlign: 'center', color: 'var(--admin-text-muted)' }}>স্ট্যাটাস</th>
                  <th style={{ textAlign: 'right', paddingRight: 20, color: 'var(--admin-text-muted)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((c) => (
                  <tr key={c.id}>
                    <td style={{ paddingLeft: 20 }}>
                      <CompactUlid value={c.id} />
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 8,
                            background: 'rgba(0, 168, 140, 0.1)',
                            color: 'var(--admin-primary, #00A88C)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: 14,
                            flexShrink: 0,
                          }}
                        >
                          {c.name.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--admin-text)', fontSize: 14 }}>
                            {c.name}
                          </div>
                          {c.name_bn && (
                            <div style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>
                              {c.name_bn}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          background: 'rgba(0,0,0,0.04)',
                          color: 'var(--admin-text)',
                          padding: '3px 8px',
                          borderRadius: 6,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <MapPin size={12} color="#64748B" /> {c.origin || 'Bangladesh'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: 12 }}>
                        {safeHttpUrl(c.website) && (
                          <a
                            href={safeHttpUrl(c.website)}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: 'var(--admin-primary, #00A88C)',
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              fontWeight: 600,
                            }}
                          >
                            <Globe size={12} /> Website <ExternalLink size={10} />
                          </a>
                        )}
                        {c.phone && (
                          <span style={{ color: 'var(--admin-text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Phone size={12} /> {c.phone}
                          </span>
                        )}
                        {c.email && (
                          <span style={{ color: 'var(--admin-text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Mail size={12} /> {c.email}
                          </span>
                        )}
                        {!c.website && !c.phone && !c.email && (
                          <span style={{ color: 'var(--admin-text-muted)', fontStyle: 'italic' }}>—</span>
                        )}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleToggle(c)}
                        title="Click to toggle status"
                        style={{
                          border: 'none',
                          background: c.is_active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                          color: c.is_active ? '#059669' : '#64748B',
                          padding: '4px 10px',
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        {c.is_active ? <Check size={12} strokeWidth={3} /> : <X size={12} />}
                        {c.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td style={{ textAlign: 'right', paddingRight: 20 }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button
                          type="button"
                          className="admin-btn admin-btn-sm admin-btn-outline"
                          onClick={() => handleOpenEdit(c)}
                          title="Edit Company"
                          style={{ padding: '6px 10px' }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          className="admin-btn admin-btn-sm admin-btn-danger"
                          onClick={() => setDeleteTarget(c)}
                          title="Delete Company"
                          style={{ padding: '6px 10px' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.total > 0 && (
          <TableFooter
            currentPage={pagination.current_page}
            totalPages={pagination.last_page}
            onPageChange={(p) => setCurrentPage(p)}
            perPage={perPage}
            onPerPageChange={(pp) => {
              setPerPage(pp)
              setCurrentPage(1)
            }}
            totalItems={pagination.total}
          />
        )}
      </div>

      {/* Add / Edit Company Modal */}
      {showModal && (
        <div
          className="db-dialog-overlay"
          onClick={() => setShowModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            className="db-dialog-content"
            style={{
              background: 'var(--admin-card-bg, #ffffff)',
              color: 'var(--admin-text, #1e293b)',
              borderRadius: 14,
              maxWidth: 540,
              width: '100%',
              overflow: 'hidden',
              boxShadow: '0 20px 40px -10px rgba(0,0,0,0.2)',
              border: '1px solid var(--admin-border, #e2e8f0)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--admin-border, #e2e8f0)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Building2 size={18} color="var(--admin-primary, #00A88C)" />
                {editTarget ? 'Edit Pharmaceutical Company' : 'Add New Pharmaceutical Company'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: 18,
                  color: '#64748B',
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="admin-form-label">Company Name (English) *</label>
                <input
                  type="text"
                  className="admin-form-input"
                  placeholder="e.g. Square Pharmaceuticals PLC"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="admin-form-label">Company Name (Bengali)</label>
                <input
                  type="text"
                  className="admin-form-input"
                  placeholder="e.g. স্কয়ার ফার্মাসিউটিক্যালস পিএলসি"
                  value={formData.name_bn}
                  onChange={(e) => setFormData({ ...formData, name_bn: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="admin-form-label">Origin / Country</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    value={formData.origin}
                    onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                  />
                </div>
                <div>
                  <label className="admin-form-label">Phone / Hotline</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    placeholder="e.g. +880 2 8833047"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="admin-form-label">Official Website</label>
                  <input
                    type="url"
                    className="admin-form-input"
                    placeholder="https://squarepharma.com.bd"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  />
                </div>
                <div>
                  <label className="admin-form-label">Contact Email</label>
                  <input
                    type="email"
                    className="admin-form-input"
                    placeholder="info@squarepharma.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="admin-form-label">Headquarters Address</label>
                <textarea
                  className="admin-form-input"
                  rows={2}
                  placeholder="e.g. Square Centre, 48 Mohakhali C/A, Dhaka-1212"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
                <span>Active (Available in medicine suggestion lists)</span>
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn-primary"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Saving...'
                    : editTarget
                    ? 'Update Company'
                    : 'Save Company'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Pharmaceutical Company"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? Existing medicines manufactured by this company will remain intact.`}
      />
    </div>
  )
}
