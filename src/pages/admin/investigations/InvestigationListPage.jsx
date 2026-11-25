// InvestigationListPage.jsx — Admin master directory for diagnostic tests & pathology
import { useState, useMemo } from 'react'
import { Plus, Search, Edit2, Trash2, CheckCircle, XCircle, FolderPlus, FlaskConical, Filter } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  useAdminInvestigations,
  useInvestigationCategories,
  useAdminInvestigationMutations,
} from '../../../features/clinical/useAdminInvestigations'
import ListToolbar from '../../../components/admin/ListToolbar'
import TableFooter from '../../../components/admin/TableFooter'
import DeleteModal from '../../../components/admin/DeleteModal'
import EmptyState from '../../../components/common/EmptyState'
import { TableSkeleton } from '../../../components/common/Skeletons'
import { getErrorMessage } from '../../../utils/errorHelper'

export default function InvestigationListPage() {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(25)

  // Modals state
  const [showTestModal, setShowTestModal] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [showCategoryModal, setShowCategoryModal] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    category_id: '',
    name: '',
    name_bn: '',
    specimen: '',
    instructions: '',
    sort_order: 0,
    is_active: true,
  })

  // Category form state
  const [catFormData, setCatFormData] = useState({
    name: '',
    name_bn: '',
    description: '',
  })

  const queryParams = useMemo(() => ({
    search: search.trim() || undefined,
    category_id: categoryFilter !== 'ALL' ? categoryFilter : undefined,
    is_active: statusFilter !== 'ALL' ? statusFilter : undefined,
    page: currentPage,
    per_page: perPage,
  }), [search, categoryFilter, statusFilter, currentPage, perPage])

  const { items, pagination, isLoading, isFetching, refetch } = useAdminInvestigations(queryParams)
  const { categories, refetch: refetchCategories } = useInvestigationCategories()
  const {
    createInvestigation,
    isCreating,
    updateInvestigation,
    isUpdating,
    deleteInvestigation,
    isDeleting,
    toggleActive,
    createCategory,
    deleteCategory,
  } = useAdminInvestigationMutations()

  const handleOpenCreate = () => {
    setEditTarget(null)
    setFormData({
      category_id: categories[0]?.id || '',
      name: '',
      name_bn: '',
      specimen: '',
      instructions: '',
      sort_order: (pagination.total || 0) + 1,
      is_active: true,
    })
    setShowTestModal(true)
  }

  const handleOpenEdit = (item) => {
    setEditTarget(item)
    setFormData({
      category_id: item.category_id || '',
      name: item.name || '',
      name_bn: item.name_bn || '',
      specimen: item.specimen || '',
      instructions: item.instructions || '',
      sort_order: item.sort_order ?? 0,
      is_active: Boolean(item.is_active),
    })
    setShowTestModal(true)
  }

  const handleSubmitTest = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error('Investigation name is required')
      return
    }

    try {
      if (editTarget) {
        await updateInvestigation({ id: editTarget.id, data: formData })
        toast.success('Investigation updated successfully')
      } else {
        await createInvestigation(formData)
        toast.success('Investigation created successfully')
      }
      setShowTestModal(false)
      refetch()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to save investigation.'))
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteInvestigation(deleteTarget.id)
      toast.success('Investigation deleted successfully')
      setDeleteTarget(null)
      refetch()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete investigation.'))
    }
  }

  const handleToggle = async (item) => {
    try {
      await toggleActive(item.id)
      toast.success(`"${item.name}" status updated`)
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
      setCatFormData({ name: '', name_bn: '', description: '' })
      refetchCategories()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to create category.'))
    }
  }

  const handleDeleteCategory = async (catId) => {
    if (!window.confirm('Delete this category? Associated tests will be unassigned.')) return
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
            <FlaskConical size={24} color="#2563EB" /> Diagnostic Investigations
          </h2>
          <p className="admin-page-subtitle">
            {pagination.total} clinical test(s) available for dynamic prescription lookup
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
            <Plus size={16} /> Add Investigation
          </button>
        </div>
      </div>

      {/* Toolbar / Filters */}
      <ListToolbar
        search={search}
        onSearchChange={(v) => { setSearch(v); setCurrentPage(1); }}
        searchPlaceholder="Search test name, code, specimen..."
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
          <TableSkeleton rowCount={8} headers={['SL', 'Test Name', 'Category', 'Specimen', 'Instructions', 'Status', 'Actions']} />
        ) : items.length === 0 ? (
          <EmptyState
            icon="🧪"
            title="No investigations found"
            description="Try adjusting your search terms or add a new diagnostic test."
            primaryAction={{ label: '+ Add Investigation', onClick: handleOpenCreate }}
          />
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 60, textAlign: 'center' }}>SL</th>
                  <th>Test Name</th>
                  <th>Category</th>
                  <th>Specimen</th>
                  <th>Instructions</th>
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
                      <div style={{ fontWeight: 600, color: 'var(--admin-text)' }}>{item.name}</div>
                      {item.name_bn && (
                        <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 2 }}>{item.name_bn}</div>
                      )}
                    </td>
                    <td>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 600,
                          background: '#EFF6FF',
                          color: '#2563EB',
                        }}
                      >
                        {item.category?.name || 'Uncategorized'}
                      </span>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--admin-text)' }}>
                      {item.specimen || '—'}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--admin-text-muted)', maxWidth: 220 }}>
                      {item.instructions || '—'}
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

      {/* Create / Edit Investigation Modal */}
      {showTestModal && (
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
          onClick={() => setShowTestModal(false)}
        >
          <div
            style={{
              background: 'var(--admin-card-bg, #ffffff)',
              color: 'var(--admin-text, #1e293b)',
              borderRadius: 14,
              maxWidth: 520,
              width: '100%',
              overflow: 'hidden',
              boxShadow: '0 20px 40px -10px rgba(0,0,0,0.2)',
              border: '1px solid var(--admin-border, #e2e8f0)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--admin-border, #e2e8f0)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>
                {editTarget ? 'Edit Investigation' : 'Add New Investigation'}
              </h3>
              <button type="button" onClick={() => setShowTestModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18, color: '#64748B' }}>✕</button>
            </div>

            <form onSubmit={handleSubmitTest} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
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
                <label className="admin-form-label">Investigation Name (English) *</label>
                <input
                  type="text"
                  className="admin-form-input"
                  placeholder="e.g. Complete Blood Count (CBC) with ESR"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="admin-form-label">Investigation Name (Bengali)</label>
                <input
                  type="text"
                  className="admin-form-input"
                  placeholder="e.g. সম্পূর্ণ রক্ত পরীক্ষা (সিবিসি)"
                  value={formData.name_bn}
                  onChange={(e) => setFormData({ ...formData, name_bn: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="admin-form-label">Specimen / Sample</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    placeholder="e.g. Whole Blood, Urine, X-Ray"
                    value={formData.specimen}
                    onChange={(e) => setFormData({ ...formData, specimen: e.target.value })}
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

              <div>
                <label className="admin-form-label">Patient Instructions / Preparation</label>
                <textarea
                  className="admin-form-input"
                  rows={2}
                  placeholder="e.g. 8-10 hours overnight fasting required"
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
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
                <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setShowTestModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="admin-btn admin-btn-primary" disabled={isCreating || isUpdating}>
                  {isCreating || isUpdating ? 'Saving...' : editTarget ? 'Update Test' : 'Create Test'}
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
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Investigation Categories</h3>
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
                  placeholder="Category Name (e.g. Microbiology)"
                  value={catFormData.name}
                  onChange={(e) => setCatFormData({ ...catFormData, name: e.target.value })}
                  required
                />
                <input
                  type="text"
                  className="admin-form-input"
                  placeholder="Bengali Name (e.g. অণুজীববিজ্ঞান)"
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
        title="Delete Investigation"
        message={`Are you sure you want to delete "${deleteTarget?.name}"?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={isDeleting}
      />
    </div>
  )
}
