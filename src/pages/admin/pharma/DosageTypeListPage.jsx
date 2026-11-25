// DosageTypeListPage.jsx — Pharmaceutical Dosage Forms & Packaging Master (MedConnect Admin)
import { useState, useMemo } from 'react'
import {
  Pill,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Palette,
} from 'lucide-react'
import {
  useAdminDosageTypes,
  useAdminDosageTypeMutations,
} from '../../../features/pharma/useAdminDosageTypes'
import toast from 'react-hot-toast'
import ListToolbar from '../../../components/admin/ListToolbar'
import TableFooter from '../../../components/admin/TableFooter'
import DeleteModal from '../../../components/admin/DeleteModal'
import EmptyState from '../../../components/common/EmptyState'
import CompactUlid from '../../../components/common/CompactUlid'
import { TableSkeleton } from '../../../components/common/Skeletons'
import { getErrorMessage } from '../../../utils/errorHelper'

const COLOR_PRESETS = [
  { name: 'Blue (Tablet)', bg: '#DBEAFE', text: '#1D4ED8', border: '#BFDBFE' },
  { name: 'Purple (Capsule)', bg: '#EDE9FE', text: '#6D28D9', border: '#DDD6FE' },
  { name: 'Amber (Syrup)', bg: '#FEF3C7', text: '#B45309', border: '#FDE68A' },
  { name: 'Sky (Suspension)', bg: '#E0F2FE', text: '#0369A1', border: '#BAE6FD' },
  { name: 'Red (Injection)', bg: '#FEE2E2', text: '#B91C1C', border: '#FECACA' },
  { name: 'Emerald (Eye Drops)', bg: '#D1FAE5', text: '#047857', border: '#A7F3D0' },
  { name: 'Pink (Suppository)', bg: '#FCE7F3', text: '#BE185D', border: '#FBCFE8' },
  { name: 'Orange (Cream)', bg: '#FFF7ED', text: '#EA580C', border: '#FED7AA' },
  { name: 'Violet (Inhaler)', bg: '#F5F3FF', text: '#7C3AED', border: '#DDD6FE' },
  { name: 'Slate (Standard)', bg: '#F1F5F9', text: '#475569', border: '#CBD5E1' },
]

export default function DosageTypeListPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(30)

  // Modals state
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    name_bn: '',
    short_name: '',
    color_bg: '#DBEAFE',
    color_text: '#1D4ED8',
    color_border: '#BFDBFE',
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

  const { items: dosageTypes, pagination, isLoading, isFetching, refetch } = useAdminDosageTypes(queryParams)
  const {
    createMutation,
    updateMutation,
    deleteMutation,
    toggleActiveMutation,
  } = useAdminDosageTypeMutations()

  const handleOpenCreate = () => {
    setEditTarget(null)
    setFormData({
      name: '',
      name_bn: '',
      short_name: '',
      color_bg: '#DBEAFE',
      color_text: '#1D4ED8',
      color_border: '#BFDBFE',
      sort_order: 0,
      is_active: true,
    })
    setShowModal(true)
  }

  const handleOpenEdit = (type) => {
    setEditTarget(type)
    setFormData({
      name: type.name || '',
      name_bn: type.name_bn || '',
      short_name: type.short_name || '',
      color_bg: type.color_bg || '#DBEAFE',
      color_text: type.color_text || '#1D4ED8',
      color_border: type.color_border || '#BFDBFE',
      sort_order: type.sort_order ?? 0,
      is_active: type.is_active ?? true,
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error('Dosage form name is required')
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
      toast.error(getErrorMessage(err, 'Failed to save dosage form.'))
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteMutation.mutateAsync(deleteTarget.id)
      toast.success('Dosage form deleted successfully')
      setDeleteTarget(null)
      refetch()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete dosage form.'))
    }
  }

  const handleToggle = async (item) => {
    try {
      await toggleActiveMutation.mutateAsync(item.id)
      toast.success(`"${item.name}" status updated`)
      refetch()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update dosage form status.'))
    }
  }

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Pill size={24} color="#2563EB" /> Dosage Types & Drug Forms
          </h2>
          <p className="admin-page-subtitle">
            {pagination.total} pharmaceutical format(s) & packaging styles configured for medicines
          </p>
        </div>
        <button
          type="button"
          className="admin-btn admin-btn-primary"
          onClick={handleOpenCreate}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <Plus size={16} /> Add Dosage Type
        </button>
      </div>

      {/* Toolbar / Filters */}
      <ListToolbar
        search={search}
        onSearchChange={(v) => {
          setSearch(v)
          setCurrentPage(1)
        }}
        searchPlaceholder="Search by dosage form name or short abbreviation (e.g. Tab, Syp, Drop)..."
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
            Pharmaceutical Forms & Color Badges
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
            {pagination.total} Forms Total
          </span>
        </div>

        {isLoading && dosageTypes.length === 0 ? (
          <TableSkeleton
            rowCount={8}
            columnWidths={['80px', '22%', '30%', '16%', '12%', '10%']}
            headers={['ID', 'Badge Preview', 'Form Name', 'Abbreviation', 'Status', 'Actions']}
          />
        ) : dosageTypes.length === 0 ? (
          <EmptyState
            searchQuery={search}
            onClearSearch={() => setSearch('')}
            icon="🏷️"
            title="No dosage types found"
            description="Try searching with a different keyword or click Add Dosage Type to create a new format."
            primaryAction={{ label: '+ Add Dosage Type', onClick: handleOpenCreate }}
          />
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 80, paddingLeft: 20, color: 'var(--admin-text-muted)' }}>ID</th>
                  <th style={{ color: 'var(--admin-text-muted)' }}>লাইভ ব্যাজ প্রিভিউ (Live Badge)</th>
                  <th style={{ color: 'var(--admin-text-muted)' }}>ডোজ ফরম্যাটের নাম (Form Name)</th>
                  <th style={{ color: 'var(--admin-text-muted)' }}>সংক্ষিপ্ত রূপ (Short Code)</th>
                  <th style={{ textAlign: 'center', color: 'var(--admin-text-muted)' }}>স্ট্যাটাস</th>
                  <th style={{ textAlign: 'right', paddingRight: 20, color: 'var(--admin-text-muted)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {dosageTypes.map((dt) => (
                  <tr key={dt.id}>
                    <td style={{ paddingLeft: 20 }}>
                      <CompactUlid value={dt.id} />
                    </td>
                    <td>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '4px 12px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 700,
                          backgroundColor: dt.color_bg || '#F1F5F9',
                          color: dt.color_text || '#475569',
                          border: `1px solid ${dt.color_border || '#E2E8F0'}`,
                          letterSpacing: 0.2,
                        }}
                      >
                        {dt.short_name || dt.name}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--admin-text)', fontSize: 14 }}>
                        {dt.name}
                      </div>
                      {dt.name_bn && (
                        <div style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>
                          {dt.name_bn}
                        </div>
                      )}
                    </td>
                    <td>
                      <code
                        style={{
                          fontSize: 12,
                          background: 'rgba(0,0,0,0.05)',
                          color: 'var(--admin-text)',
                          padding: '3px 8px',
                          borderRadius: 4,
                          fontWeight: 600,
                        }}
                      >
                        {dt.short_name || '—'}
                      </code>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleToggle(dt)}
                        title="Click to toggle status"
                        style={{
                          border: 'none',
                          background: dt.is_active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                          color: dt.is_active ? '#059669' : '#64748B',
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
                        {dt.is_active ? <Check size={12} strokeWidth={3} /> : <X size={12} />}
                        {dt.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td style={{ textAlign: 'right', paddingRight: 20 }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button
                          type="button"
                          className="admin-btn admin-btn-sm admin-btn-outline"
                          onClick={() => handleOpenEdit(dt)}
                          title="Edit Dosage Type"
                          style={{ padding: '6px 10px' }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          className="admin-btn admin-btn-sm admin-btn-danger"
                          onClick={() => setDeleteTarget(dt)}
                          title="Delete Dosage Type"
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

      {/* Add / Edit Dosage Type Modal */}
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
                <Pill size={18} color="#2563EB" />
                {editTarget ? 'Edit Dosage Form' : 'Add New Dosage Form'}
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
                <label className="admin-form-label">Dosage Form Name (English) *</label>
                <input
                  type="text"
                  className="admin-form-input"
                  placeholder="e.g. Eye Drops, Nasal Spray, Tablet"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="admin-form-label">Name (Bengali)</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    placeholder="e.g. আই ড্রপ"
                    value={formData.name_bn}
                    onChange={(e) => setFormData({ ...formData, name_bn: e.target.value })}
                  />
                </div>
                <div>
                  <label className="admin-form-label">Short Abbreviation</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    placeholder="e.g. Tab, Syp, Drop"
                    value={formData.short_name}
                    onChange={(e) => setFormData({ ...formData, short_name: e.target.value })}
                  />
                </div>
              </div>

              {/* Color Theme Selector & Live Preview */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label className="admin-form-label" style={{ margin: 0 }}>
                    Badge Palette & Theme
                  </label>
                  <span
                    style={{
                      padding: '3px 10px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      backgroundColor: formData.color_bg,
                      color: formData.color_text,
                      border: `1px solid ${formData.color_border}`,
                    }}
                  >
                    Preview: {formData.short_name || formData.name || 'Sample'}
                  </span>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, 1fr)',
                    gap: 8,
                    padding: 10,
                    borderRadius: 10,
                    background: 'rgba(0,0,0,0.03)',
                    border: '1px solid var(--admin-border)',
                  }}
                >
                  {COLOR_PRESETS.map((preset, i) => (
                    <button
                      key={i}
                      type="button"
                      title={preset.name}
                      onClick={() =>
                        setFormData({
                          ...formData,
                          color_bg: preset.bg,
                          color_text: preset.text,
                          color_border: preset.border,
                        })
                      }
                      style={{
                        height: 32,
                        borderRadius: 6,
                        border: formData.color_bg === preset.bg ? '2px solid #2563EB' : `1px solid ${preset.border}`,
                        backgroundColor: preset.bg,
                        color: preset.text,
                        fontWeight: 800,
                        fontSize: 11,
                        cursor: 'pointer',
                        transform: formData.color_bg === preset.bg ? 'scale(1.05)' : 'none',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      Aa
                    </button>
                  ))}
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
                <span>Active (Available in medicine format dropdowns)</span>
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
                    ? 'Update Form'
                    : 'Save Form'}
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
        title="Delete Dosage Form"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? Existing medicines using this format will remain in the database.`}
      />
    </div>
  )
}
