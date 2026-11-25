// ClinicalAdviceListPage.jsx — Admin master directory for doctor clinical advice & patient guidance
import { useState, useMemo } from 'react'
import { Plus, Search, Edit2, Trash2, CheckCircle, XCircle, FolderPlus, MessageSquare, HeartHandshake } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  useAdminClinicalAdvices,
  useAdviceCategories,
  useAdminClinicalAdviceMutations,
} from '../../../features/clinical/useAdminClinicalAdvices'
import ListToolbar from '../../../components/admin/ListToolbar'
import TableFooter from '../../../components/admin/TableFooter'
import DeleteModal from '../../../components/admin/DeleteModal'
import EmptyState from '../../../components/common/EmptyState'
import { TableSkeleton } from '../../../components/common/Skeletons'
import { getErrorMessage } from '../../../utils/errorHelper'

export default function ClinicalAdviceListPage() {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(25)

  // Modals state
  const [showAdviceModal, setShowAdviceModal] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [showCategoryModal, setShowCategoryModal] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    category_id: '',
    advice_en: '',
    advice_bn: '',
    sort_order: 0,
    is_active: true,
  })

  // Category form state
  const [catFormData, setCatFormData] = useState({
    name: '',
    name_bn: '',
  })

  const queryParams = useMemo(() => ({
    search: search.trim() || undefined,
    category_id: categoryFilter !== 'ALL' ? categoryFilter : undefined,
    is_active: statusFilter !== 'ALL' ? statusFilter : undefined,
    page: currentPage,
    per_page: perPage,
  }), [search, categoryFilter, statusFilter, currentPage, perPage])

  const { items, pagination, isLoading, isFetching, refetch } = useAdminClinicalAdvices(queryParams)
  const { categories, refetch: refetchCategories } = useAdviceCategories()
  const {
    createClinicalAdvice,
    isCreating,
    updateClinicalAdvice,
    isUpdating,
    deleteClinicalAdvice,
    isDeleting,
    toggleActive,
    createCategory,
    deleteCategory,
  } = useAdminClinicalAdviceMutations()

  const handleOpenCreate = () => {
    setEditTarget(null)
    setFormData({
      category_id: categories[0]?.id || '',
      advice_en: '',
      advice_bn: '',
      sort_order: (pagination.total || 0) + 1,
      is_active: true,
    })
    setShowAdviceModal(true)
  }

  const handleOpenEdit = (item) => {
    setEditTarget(item)
    setFormData({
      category_id: item.category_id || '',
      advice_en: item.advice_en || '',
      advice_bn: item.advice_bn || '',
      sort_order: item.sort_order ?? 0,
      is_active: Boolean(item.is_active),
    })
    setShowAdviceModal(true)
  }

  const handleSubmitAdvice = async (e) => {
    e.preventDefault()
    if (!formData.advice_en.trim()) {
      toast.error('Advice description (English) is required')
      return
    }

    try {
      if (editTarget) {
        await updateClinicalAdvice({ id: editTarget.id, data: formData })
        toast.success('Clinical advice updated successfully')
      } else {
        await createClinicalAdvice(formData)
        toast.success('Clinical advice created successfully')
      }
      setShowAdviceModal(false)
      refetch()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to save advice.'))
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteClinicalAdvice(deleteTarget.id)
      toast.success('Advice deleted successfully')
      setDeleteTarget(null)
      refetch()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete advice.'))
    }
  }

  const handleToggle = async (item) => {
    try {
      await toggleActive(item.id)
      toast.success('Advice status toggled')
      refetch()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update status.'))
    }
  }

  const handleCreateCategory = async (e) => {
    e.preventDefault()
    if (!catFormData.name.trim()) {
      toast.error('Category name is required')
      return
    }

    try {
      await createCategory(catFormData)
      toast.success('Category created successfully')
      setCatFormData({ name: '', name_bn: '' })
      refetchCategories()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to create category.'))
    }
  }

  const handleDeleteCategory = async (catId) => {
    if (!window.confirm('Delete this category? Advices will be unassigned.')) return
    try {
      await deleteCategory(catId)
      toast.success('Category deleted')
      refetchCategories()
      refetch()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete category.'))
    }
  }

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <HeartHandshake size={24} color="#059669" /> Clinical Advice & Patient Instructions
          </h2>
          <p className="admin-page-subtitle">
            {pagination.total} bilingual advice item(s) available for dynamic prescription 1-click selection
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={() => setShowCategoryModal(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <FolderPlus size={16} /> Categories ({categories.length})
          </button>
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            onClick={handleOpenCreate}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Plus size={16} /> Add Advice
          </button>
        </div>
      </div>

      {/* Toolbar / Filters */}
      <ListToolbar
        search={search}
        onSearchChange={(v) => { setSearch(v); setCurrentPage(1); }}
        searchPlaceholder="Search advice text in English or Bengali..."
        onRefresh={refetch}
        refreshing={isLoading || isFetching}
      >
        {/* Category filter */}
        <div style={{ minWidth: 180, flex: '1 1 180px' }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>
            Category
          </label>
          <select
            className="status-select"
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
            style={{ width: '100%', height: 38, background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', borderRadius: 8, color: 'var(--admin-text)' }}
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name} {c.name_bn ? `(${c.name_bn})` : ''}</option>
            ))}
          </select>
        </div>

        {/* Status filter */}
        <div style={{ minWidth: 130, flex: '1 1 130px' }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>
            Status
          </label>
          <select
            className="status-select"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            style={{ width: '100%', height: 38, background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', borderRadius: 8, color: 'var(--admin-text)' }}
          >
            <option value="ALL">All Status</option>
            <option value="true">Active Only</option>
            <option value="false">Inactive Only</option>
          </select>
        </div>
      </ListToolbar>

      {/* Content Table */}
      <div className="admin-card" style={{ marginTop: 16 }}>
        {isLoading ? (
          <TableSkeleton rowCount={8} headers={['SL', 'Category', 'Advice (Bengali / English)', 'Status', 'Actions']} />
        ) : items.length === 0 ? (
          <EmptyState
            icon="💬"
            title="No clinical advice found"
            description="Add common disease-specific advices for doctors to use in prescriptions."
            primaryAction={{ label: '+ Add Advice', onClick: handleOpenCreate }}
          />
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 60, textAlign: 'center' }}>SL</th>
                  <th style={{ width: 180 }}>Category</th>
                  <th>Clinical Advice Text</th>
                  <th style={{ width: 100, textAlign: 'center' }}>Status</th>
                  <th style={{ width: 120, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item.id}>
                    <td style={{ textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                      {(pagination.current_page - 1) * perPage + idx + 1}
                    </td>
                    <td>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 600,
                          background: '#ECFDF5',
                          color: '#059669',
                        }}
                      >
                        {item.category?.name || 'General'}
                      </span>
                    </td>
                    <td>
                      {item.advice_bn && (
                        <div style={{ fontWeight: 600, color: 'var(--admin-text)', marginBottom: 2 }}>
                          {item.advice_bn}
                        </div>
                      )}
                      <div style={{ fontSize: 13, color: 'var(--admin-text-muted)' }}>
                        {item.advice_en}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleToggle(item)}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '4px 8px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 600,
                          color: item.is_active ? '#16A34A' : '#94A3B8',
                        }}
                      >
                        {item.is_active ? <CheckCircle size={16} /> : <XCircle size={16} />}
                        <span>{item.is_active ? 'Active' : 'Inactive'}</span>
                      </button>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button
                          type="button"
                          className="admin-btn admin-btn-secondary"
                          onClick={() => handleOpenEdit(item)}
                          style={{ padding: '5px 10px', fontSize: 12 }}
                          title="Edit"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          className="admin-btn admin-btn-danger"
                          onClick={() => setDeleteTarget(item)}
                          style={{ padding: '5px 10px', fontSize: 12 }}
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <TableFooter
          pagination={pagination}
          perPage={perPage}
          onPerPageChange={(v) => { setPerPage(v); setCurrentPage(1); }}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Create / Edit Advice Modal */}
      {showAdviceModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setShowAdviceModal(false)}
        >
          <div
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
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--admin-border, #e2e8f0)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>
                {editTarget ? 'Edit Clinical Advice' : 'Add Clinical Advice'}
              </h3>
              <button type="button" onClick={() => setShowAdviceModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18, color: '#64748B' }}>✕</button>
            </div>

            <form onSubmit={handleSubmitAdvice} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="admin-form-label">Category *</label>
                <select
                  className="admin-form-input"
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} {c.name_bn ? `(${c.name_bn})` : ''}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="admin-form-label">Advice Text (Bengali) *</label>
                <textarea
                  className="admin-form-input"
                  rows={2}
                  placeholder="e.g. প্রতিদিন পর্যাপ্ত পরিমাণ (২.৫ - ৩ লিটার) বিশুদ্ধ পানি পান করুন।"
                  value={formData.advice_bn}
                  onChange={(e) => setFormData({ ...formData, advice_bn: e.target.value })}
                />
              </div>

              <div>
                <label className="admin-form-label">Advice Text (English) *</label>
                <textarea
                  className="admin-form-input"
                  rows={2}
                  placeholder="e.g. Drink 2.5 to 3 liters of pure drinking water every day."
                  value={formData.advice_en}
                  onChange={(e) => setFormData({ ...formData, advice_en: e.target.value })}
                  required
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

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
                <span>Active (Available in prescription suggestions)</span>
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setShowAdviceModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="admin-btn admin-btn-primary" disabled={isCreating || isUpdating}>
                  {isCreating || isUpdating ? 'Saving...' : editTarget ? 'Update Advice' : 'Create Advice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Management Modal */}
      {showCategoryModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setShowCategoryModal(false)}
        >
          <div
            style={{
              background: 'var(--admin-card-bg, #ffffff)',
              color: 'var(--admin-text, #1e293b)',
              borderRadius: 14,
              maxWidth: 580,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 40px -10px rgba(0,0,0,0.2)',
              border: '1px solid var(--admin-border, #e2e8f0)',
              padding: 20,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Advice Categories</h3>
              <button type="button" onClick={() => setShowCategoryModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18 }}>✕</button>
            </div>

            {/* Existing Categories List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {categories.map((c) => (
                <div
                  key={c.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: 'var(--admin-input-bg, #f8fafc)',
                    border: '1px solid var(--admin-border, #e2e8f0)',
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600 }}>{c.name}</span>
                    {c.name_bn && <span style={{ color: '#64748B', fontSize: 12, marginLeft: 6 }}>({c.name_bn})</span>}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(c.id)}
                    style={{ border: 'none', background: 'none', color: '#EF4444', cursor: 'pointer', padding: 4 }}
                    title="Delete Category"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Category Form */}
            <form onSubmit={handleCreateCategory} style={{ borderTop: '1px solid var(--admin-border, #e2e8f0)', paddingTop: 16 }}>
              <h4 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700 }}>+ Add New Category</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <input
                  type="text"
                  className="admin-form-input"
                  placeholder="Category Name (e.g. Diabetic Care)"
                  value={catFormData.name}
                  onChange={(e) => setCatFormData({ ...catFormData, name: e.target.value })}
                  required
                />
                <input
                  type="text"
                  className="admin-form-input"
                  placeholder="Bengali Name (e.g. ডায়াবেটিস যত্ন)"
                  value={catFormData.name_bn}
                  onChange={(e) => setCatFormData({ ...catFormData, name_bn: e.target.value })}
                />
              </div>
              <button type="submit" className="admin-btn admin-btn-primary" style={{ width: '100%' }}>
                Save Category
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteModal
        show={!!deleteTarget}
        title="Delete Clinical Advice"
        message="Are you sure you want to delete this clinical advice item?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={isDeleting}
      />
    </div>
  )
}
