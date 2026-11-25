// ChiefComplaintListPage.jsx — Admin master directory for clinical chief complaints (MedConnect Admin)
import { useState, useMemo } from 'react'
import {
  Stethoscope,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Tag,
} from 'lucide-react'
import {
  useAdminChiefComplaints,
  useChiefComplaintCategories,
  useAdminChiefComplaintMutations,
} from '../../../features/clinical/useAdminChiefComplaints'
import toast from 'react-hot-toast'
import ListToolbar from '../../../components/admin/ListToolbar'
import TableFooter from '../../../components/admin/TableFooter'
import DeleteModal from '../../../components/admin/DeleteModal'
import EmptyState from '../../../components/common/EmptyState'
import CompactUlid from '../../../components/common/CompactUlid'
import { TableSkeleton } from '../../../components/common/Skeletons'
import { getErrorMessage } from '../../../utils/errorHelper'

export default function ChiefComplaintListPage() {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
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
    category: 'General',
    sort_order: 0,
    is_active: true,
  })

  const queryParams = useMemo(
    () => ({
      search: search.trim() || undefined,
      category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
      status: statusFilter !== 'ALL' ? statusFilter : undefined,
      page: currentPage,
      per_page: perPage,
    }),
    [search, categoryFilter, statusFilter, currentPage, perPage]
  )

  const { items: complaints, pagination, isLoading, isFetching, refetch } = useAdminChiefComplaints(queryParams)
  const { categories } = useChiefComplaintCategories()
  const {
    createMutation,
    updateMutation,
    deleteMutation,
    toggleActiveMutation,
  } = useAdminChiefComplaintMutations()

  const handleOpenCreate = () => {
    setEditTarget(null)
    setFormData({
      name: '',
      name_bn: '',
      category: 'General',
      sort_order: 0,
      is_active: true,
    })
    setShowModal(true)
  }

  const handleOpenEdit = (complaint) => {
    setEditTarget(complaint)
    setFormData({
      name: complaint.name || '',
      name_bn: complaint.name_bn || '',
      category: complaint.category || 'General',
      sort_order: complaint.sort_order ?? 0,
      is_active: complaint.is_active ?? true,
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error('Chief complaint name is required')
      return
    }

    try {
      if (editTarget) {
        await updateMutation.mutateAsync({ id: editTarget.id, data: formData })
        toast.success(`"${formData.name}" updated successfully`)
      } else {
        await createMutation.mutateAsync(formData)
        toast.success(`"${formData.name}" added successfully`)
      }
      setShowModal(false)
      refetch()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to save chief complaint.'))
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteMutation.mutateAsync(deleteTarget.id)
      toast.success('Chief complaint deleted successfully')
      setDeleteTarget(null)
      refetch()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete chief complaint.'))
    }
  }

  const handleToggle = async (item) => {
    try {
      await toggleActiveMutation.mutateAsync(item.id)
      toast.success(`"${item.name}" status updated`)
      refetch()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update status.'))
    }
  }

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Stethoscope size={24} color="#2563EB" /> Chief Complaints (C/C)
          </h2>
          <p className="admin-page-subtitle">
            {pagination.total} patient clinical symptom(s) & complaints available for dynamic prescription selection
          </p>
        </div>
        <button
          type="button"
          className="admin-btn admin-btn-primary"
          onClick={handleOpenCreate}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <Plus size={16} /> Add Chief Complaint
        </button>
      </div>

      {/* Toolbar / Filters */}
      <ListToolbar
        search={search}
        onSearchChange={(v) => {
          setSearch(v)
          setCurrentPage(1)
        }}
        searchPlaceholder="Search symptom name (e.g. Fever, Cough, Chest Pain)..."
        onRefresh={refetch}
        refreshing={isLoading || isFetching}
        hasActiveFilters={statusFilter !== 'ALL' || categoryFilter !== 'ALL'}
        onClearFilters={() => {
          setStatusFilter('ALL')
          setCategoryFilter('ALL')
          setSearch('')
          setCurrentPage(1)
        }}
        activeFilters={[
          categoryFilter !== 'ALL' && {
            key: 'category',
            label: `Category: ${categoryFilter}`,
            onRemove: () => setCategoryFilter('ALL'),
          },
          statusFilter !== 'ALL' && {
            key: 'status',
            label: `Status: ${statusFilter === 'true' ? 'Active' : 'Inactive'}`,
            onRemove: () => setStatusFilter('ALL'),
          },
        ].filter(Boolean)}
      >
        {/* Category Filter */}
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
            Category
          </label>
          <select
            className="status-select"
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value)
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
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div style={{ minWidth: 140, flex: '1 1 140px' }}>
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
            Master Symptoms & Complaints Directory
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
            {pagination.total} Symptoms Total
          </span>
        </div>

        {isLoading && complaints.length === 0 ? (
          <TableSkeleton
            rowCount={8}
            columnWidths={['80px', '35%', '25%', '15%', '15%']}
            headers={['ID', 'Complaint Name', 'Category', 'Status', 'Actions']}
          />
        ) : complaints.length === 0 ? (
          <EmptyState
            searchQuery={search}
            onClearSearch={() => setSearch('')}
            icon="🩺"
            title="No chief complaints found"
            description="Try searching with a different term or click Add Chief Complaint to create a new symptom."
            primaryAction={{ label: '+ Add Chief Complaint', onClick: handleOpenCreate }}
          />
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 80, paddingLeft: 20, color: 'var(--admin-text-muted)' }}>ID</th>
                  <th style={{ color: 'var(--admin-text-muted)' }}>উপসর্গ / অভিযোগের নাম (Complaint)</th>
                  <th style={{ color: 'var(--admin-text-muted)' }}>ক্যাটাগরি (Category)</th>
                  <th style={{ textAlign: 'center', color: 'var(--admin-text-muted)' }}>স্ট্যাটাস</th>
                  <th style={{ textAlign: 'right', paddingRight: 20, color: 'var(--admin-text-muted)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((c) => (
                  <tr key={c.id}>
                    <td style={{ paddingLeft: 20 }}>
                      <CompactUlid value={c.id} />
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--admin-text)', fontSize: 14 }}>
                        {c.name}
                      </div>
                      {c.name_bn && (
                        <div style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>
                          {c.name_bn}
                        </div>
                      )}
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          background: 'rgba(37, 99, 235, 0.08)',
                          color: '#2563EB',
                          padding: '3px 8px',
                          borderRadius: 6,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <Tag size={12} /> {c.category || 'General'}
                      </span>
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
                          title="Edit Chief Complaint"
                          style={{ padding: '6px 10px' }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          className="admin-btn admin-btn-sm admin-btn-danger"
                          onClick={() => setDeleteTarget(c)}
                          title="Delete Chief Complaint"
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

      {/* Add / Edit Modal */}
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
              maxWidth: 480,
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
                <Stethoscope size={18} color="#2563EB" />
                {editTarget ? 'Edit Chief Complaint' : 'Add New Chief Complaint'}
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
                <label className="admin-form-label">Symptom / Complaint (English) *</label>
                <input
                  type="text"
                  className="admin-form-input"
                  placeholder="e.g. High Grade Fever, Dry Cough"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="admin-form-label">Symptom / Complaint (Bengali)</label>
                <input
                  type="text"
                  className="admin-form-input"
                  placeholder="যেমন: তীব্র জ্বর, শুষ্ক কাশি"
                  value={formData.name_bn}
                  onChange={(e) => setFormData({ ...formData, name_bn: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="admin-form-label">Category</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    placeholder="e.g. Respiratory, General, ENT"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  />
                </div>
                <div>
                  <label className="admin-form-label">Sort Order</label>
                  <input
                    type="number"
                    className="admin-form-input"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value, 10) || 0 })}
                  />
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
                <span>Active (Available in prescription suggestions)</span>
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
                    ? 'Update Complaint'
                    : 'Save Complaint'}
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
        title="Delete Chief Complaint"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? Previous prescriptions containing this symptom will remain unaffected.`}
      />
    </div>
  )
}
