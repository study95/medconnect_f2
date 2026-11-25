// DoctorCredentialListPage.jsx — Admin master directory for Doctor Degrees & Designations (MedConnect Admin)
import { useState, useMemo } from 'react'
import {
  GraduationCap,
  Award,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  ShieldCheck,
  Tag,
} from 'lucide-react'
import {
  useAdminMedicalDegrees,
  useAdminDoctorDesignations,
  useAdminCredentialMutations,
} from '../../../features/credentials/useDoctorCredentials'
import toast from 'react-hot-toast'
import ListToolbar from '../../../components/admin/ListToolbar'
import TableFooter from '../../../components/admin/TableFooter'
import DeleteModal from '../../../components/admin/DeleteModal'
import EmptyState from '../../../components/common/EmptyState'
import CompactUlid from '../../../components/common/CompactUlid'
import { TableSkeleton } from '../../../components/common/Skeletons'
import { getErrorMessage } from '../../../utils/errorHelper'

export default function DoctorCredentialListPage() {
  const [activeTab, setActiveTab] = useState('degrees') // 'degrees' | 'designations'
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(25)

  // Modals state
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  // Form state for Degree
  const [degreeForm, setDegreeForm] = useState({
    title: '',
    title_bn: '',
    full_name: '',
    institution_origin: '',
    sort_order: 0,
    is_active: true,
  })

  // Form state for Designation
  const [designationForm, setDesignationForm] = useState({
    title: '',
    title_bn: '',
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

  // Queries
  const degreesQuery = useAdminMedicalDegrees(activeTab === 'degrees' ? queryParams : {})
  const designationsQuery = useAdminDoctorDesignations(activeTab === 'designations' ? queryParams : {})

  const currentQuery = activeTab === 'degrees' ? degreesQuery : designationsQuery
  const { items, pagination, isLoading, isFetching, refetch } = currentQuery

  // Mutations
  const {
    createDegreeMutation,
    updateDegreeMutation,
    deleteDegreeMutation,
    toggleDegreeMutation,
    createDesignationMutation,
    updateDesignationMutation,
    deleteDesignationMutation,
    toggleDesignationMutation,
  } = useAdminCredentialMutations()

  const handleTabSwitch = (tab) => {
    setActiveTab(tab)
    setSearch('')
    setStatusFilter('ALL')
    setCurrentPage(1)
  }

  const handleOpenCreate = () => {
    setEditTarget(null)
    if (activeTab === 'degrees') {
      setDegreeForm({
        title: '',
        title_bn: '',
        full_name: '',
        institution_origin: '',
        sort_order: 0,
        is_active: true,
      })
    } else {
      setDesignationForm({
        title: '',
        title_bn: '',
        sort_order: 0,
        is_active: true,
      })
    }
    setShowModal(true)
  }

  const handleOpenEdit = (item) => {
    setEditTarget(item)
    if (activeTab === 'degrees') {
      setDegreeForm({
        title: item.title || '',
        title_bn: item.title_bn || '',
        full_name: item.full_name || '',
        institution_origin: item.institution_origin || '',
        sort_order: item.sort_order ?? 0,
        is_active: item.is_active ?? true,
      })
    } else {
      setDesignationForm({
        title: item.title || '',
        title_bn: item.title_bn || '',
        sort_order: item.sort_order ?? 0,
        is_active: item.is_active ?? true,
      })
    }
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (activeTab === 'degrees') {
      if (!degreeForm.title.trim()) {
        toast.error('Degree title is required (e.g. MBBS, FCPS)')
        return
      }

      try {
        if (editTarget) {
          await updateDegreeMutation.mutateAsync({ id: editTarget.id, data: degreeForm })
          toast.success('Medical degree updated successfully')
        } else {
          await createDegreeMutation.mutateAsync(degreeForm)
          toast.success('Medical degree created successfully')
        }
        setShowModal(false)
      } catch (err) {
        toast.error(getErrorMessage(err, 'Failed to save medical degree'))
      }
    } else {
      if (!designationForm.title.trim()) {
        toast.error('Designation title is required (e.g. Professor, Consultant)')
        return
      }

      try {
        if (editTarget) {
          await updateDesignationMutation.mutateAsync({ id: editTarget.id, data: designationForm })
          toast.success('Doctor designation updated successfully')
        } else {
          await createDesignationMutation.mutateAsync(designationForm)
          toast.success('Doctor designation created successfully')
        }
        setShowModal(false)
      } catch (err) {
        toast.error(getErrorMessage(err, 'Failed to save doctor designation'))
      }
    }
  }

  const handleToggleActive = async (item) => {
    try {
      if (activeTab === 'degrees') {
        await toggleDegreeMutation.mutateAsync(item.id)
        toast.success(`Degree ${item.is_active ? 'deactivated' : 'activated'}`)
      } else {
        await toggleDesignationMutation.mutateAsync(item.id)
        toast.success(`Designation ${item.is_active ? 'deactivated' : 'activated'}`)
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to toggle status'))
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    try {
      if (activeTab === 'degrees') {
        await deleteDegreeMutation.mutateAsync(deleteTarget.id)
        toast.success('Medical degree deleted')
      } else {
        await deleteDesignationMutation.mutateAsync(deleteTarget.id)
        toast.success('Doctor designation deleted')
      }
      setDeleteTarget(null)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete record'))
    }
  }

  return (
    <div className="admin-container">
      {/* ── Page Header ── */}
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {activeTab === 'degrees' ? <GraduationCap size={24} color="#00A88C" /> : <Award size={24} color="#00A88C" />}
            Doctor Credentials & Governance
          </h2>
          <p className="admin-page-subtitle">
            Manage BMDC-approved medical degrees and professional doctor designations for registration and profiles
          </p>
        </div>
        <button
          type="button"
          className="admin-btn admin-btn-primary"
          onClick={handleOpenCreate}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <Plus size={16} /> {activeTab === 'degrees' ? 'Add Degree' : 'Add Designation'}
        </button>
      </div>

      {/* ── Tab Switcher ── */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--admin-border)', paddingBottom: '0.5rem' }}>
        <button
          type="button"
          onClick={() => handleTabSwitch('degrees')}
          className={`admin-btn ${activeTab === 'degrees' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <GraduationCap size={16} />
          <span>Medical Degrees ({degreesQuery.pagination?.total || 0})</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabSwitch('designations')}
          className={`admin-btn ${activeTab === 'designations' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Award size={16} />
          <span>Doctor Designations ({designationsQuery.pagination?.total || 0})</span>
        </button>
      </div>

      {/* ── List Toolbar ── */}
      <ListToolbar
        search={search}
        onSearchChange={(v) => { setSearch(v); setCurrentPage(1) }}
        searchPlaceholder={activeTab === 'degrees' ? "Search degrees (e.g. MBBS, FCPS)..." : "Search designations (e.g. Professor)..."}
        onRefresh={refetch}
        refreshing={isLoading || isFetching}
        hasActiveFilters={statusFilter !== 'ALL'}
        onClearFilters={() => { setStatusFilter('ALL'); setCurrentPage(1) }}
        activeFilters={[
          statusFilter !== 'ALL' && {
            key: 'status',
            label: `Status: ${statusFilter === 'true' ? 'Active' : 'Inactive'}`,
            onRemove: () => setStatusFilter('ALL'),
          },
        ].filter(Boolean)}
      >
        <div style={{ minWidth: 160, flex: '1 1 160px' }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>
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
              padding: '0 10px',
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

      {/* ── Main Table Card ── */}
      <div className="admin-card">
        {isLoading ? (
          <TableSkeleton rows={8} cols={activeTab === 'degrees' ? 6 : 5} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={activeTab === 'degrees' ? GraduationCap : Award}
            title={activeTab === 'degrees' ? "No medical degrees found" : "No doctor designations found"}
            description={search ? "Try adjusting your search criteria." : "Click Add to create your first master entry."}
            actionLabel={activeTab === 'degrees' ? "Add Degree" : "Add Designation"}
            onAction={handleOpenCreate}
          />
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>ID</th>
                  <th>Title (English)</th>
                  <th>Title (Bengali)</th>
                  {activeTab === 'degrees' && <th>Full Name / Origin</th>}
                  <th style={{ width: '100px' }}>Order</th>
                  <th style={{ width: '110px' }}>Status</th>
                  <th style={{ width: '120px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <CompactUlid id={item.id} />
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 600, color: 'var(--admin-text)' }}>{item.title}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ color: 'var(--admin-text-secondary)' }}>
                        {item.title_bn || '—'}
                      </span>
                    </td>
                    {activeTab === 'degrees' && (
                      <td>
                        <div style={{ fontSize: '0.85rem' }}>
                          <span style={{ color: 'var(--admin-text)' }}>{item.full_name || '—'}</span>
                          {item.institution_origin && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
                              Origin: {item.institution_origin}
                            </div>
                          )}
                        </div>
                      </td>
                    )}
                    <td>
                      <span style={{ fontSize: '0.85rem', color: 'var(--admin-text-secondary)' }}>
                        {item.sort_order ?? 0}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleToggleActive(item)}
                        title="Click to toggle status"
                        style={{
                          border: 'none',
                          background: item.is_active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                          color: item.is_active ? '#059669' : '#64748B',
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
                        {item.is_active ? <Check size={12} strokeWidth={3} /> : <X size={12} />}
                        {item.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td style={{ textAlign: 'right', paddingRight: 20 }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button
                          type="button"
                          className="admin-btn admin-btn-sm admin-btn-outline"
                          onClick={() => handleOpenEdit(item)}
                          title="Edit"
                          style={{ padding: '6px 10px' }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          className="admin-btn admin-btn-sm admin-btn-danger"
                          onClick={() => setDeleteTarget(item)}
                          title="Delete"
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

        {/* ── Table Footer ── */}
        <TableFooter
          currentPage={pagination.currentPage}
          lastPage={pagination.lastPage}
          total={pagination.total}
          perPage={pagination.perPage}
          onPageChange={setCurrentPage}
          onPerPageChange={(v) => { setPerPage(v); setCurrentPage(1) }}
          isFetching={isFetching}
        />
      </div>

      {/* ── Add / Edit Modal ── */}
      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">
                {editTarget
                  ? (activeTab === 'degrees' ? 'Edit Medical Degree' : 'Edit Doctor Designation')
                  : (activeTab === 'degrees' ? 'Add Medical Degree' : 'Add Doctor Designation')}
              </h2>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="admin-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {activeTab === 'degrees' ? (
                  <>
                    <div className="admin-form-group">
                      <label className="admin-form-label">
                        Degree Title (English) <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        className="admin-form-input"
                        placeholder="e.g. MBBS, FCPS, MD, MRCP"
                        value={degreeForm.title}
                        onChange={(e) => setDegreeForm({ ...degreeForm, title: e.target.value })}
                        required
                        autoFocus
                      />
                    </div>

                    <div className="admin-form-group">
                      <label className="admin-form-label">Degree Title (Bengali)</label>
                      <input
                        type="text"
                        className="admin-form-input"
                        placeholder="e.g. এমবিবিএস, এফসিপিএস"
                        value={degreeForm.title_bn}
                        onChange={(e) => setDegreeForm({ ...degreeForm, title_bn: e.target.value })}
                      />
                    </div>

                    <div className="admin-form-group">
                      <label className="admin-form-label">Full Degree Name</label>
                      <input
                        type="text"
                        className="admin-form-input"
                        placeholder="e.g. Bachelor of Medicine and Bachelor of Surgery"
                        value={degreeForm.full_name}
                        onChange={(e) => setDegreeForm({ ...degreeForm, full_name: e.target.value })}
                      />
                    </div>

                    <div className="admin-form-group">
                      <label className="admin-form-label">Institution / Origin</label>
                      <input
                        type="text"
                        className="admin-form-input"
                        placeholder="e.g. BMDC, BCPS, UK, USA"
                        value={degreeForm.institution_origin}
                        onChange={(e) => setDegreeForm({ ...degreeForm, institution_origin: e.target.value })}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="admin-form-group">
                        <label className="admin-form-label">Sort Order</label>
                        <input
                          type="number"
                          className="admin-form-input"
                          value={degreeForm.sort_order}
                          onChange={(e) => setDegreeForm({ ...degreeForm, sort_order: parseInt(e.target.value, 10) || 0 })}
                        />
                      </div>

                      <div className="admin-form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <label className="admin-form-label">Status</label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginTop: '0.25rem' }}>
                          <input
                            type="checkbox"
                            checked={degreeForm.is_active}
                            onChange={(e) => setDegreeForm({ ...degreeForm, is_active: e.target.checked })}
                          />
                          <span style={{ fontSize: '0.875rem' }}>Active for doctors</span>
                        </label>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="admin-form-group">
                      <label className="admin-form-label">
                        Designation Title (English) <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        className="admin-form-input"
                        placeholder="e.g. Professor, Associate Professor, Consultant"
                        value={designationForm.title}
                        onChange={(e) => setDesignationForm({ ...designationForm, title: e.target.value })}
                        required
                        autoFocus
                      />
                    </div>

                    <div className="admin-form-group">
                      <label className="admin-form-label">Designation Title (Bengali)</label>
                      <input
                        type="text"
                        className="admin-form-input"
                        placeholder="e.g. অধ্যাপক, সহযোগী অধ্যাপক, কনসালট্যান্ট"
                        value={designationForm.title_bn}
                        onChange={(e) => setDesignationForm({ ...designationForm, title_bn: e.target.value })}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="admin-form-group">
                        <label className="admin-form-label">Sort Order</label>
                        <input
                          type="number"
                          className="admin-form-input"
                          value={designationForm.sort_order}
                          onChange={(e) => setDesignationForm({ ...designationForm, sort_order: parseInt(e.target.value, 10) || 0 })}
                        />
                      </div>

                      <div className="admin-form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <label className="admin-form-label">Status</label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginTop: '0.25rem' }}>
                          <input
                            type="checkbox"
                            checked={designationForm.is_active}
                            onChange={(e) => setDesignationForm({ ...designationForm, is_active: e.target.checked })}
                          />
                          <span style={{ fontSize: '0.875rem' }}>Active for doctors</span>
                        </label>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="admin-modal-footer">
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
                  disabled={createDegreeMutation.isPending || updateDegreeMutation.isPending || createDesignationMutation.isPending || updateDesignationMutation.isPending}
                >
                  {editTarget ? 'Update Entry' : 'Create Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deleteTarget && (
        <DeleteModal
          isOpen={true}
          title={activeTab === 'degrees' ? "Delete Medical Degree" : "Delete Doctor Designation"}
          message={`Are you sure you want to delete "${deleteTarget.title}"? Doctors currently referencing this entry may lose this credential tag.`}
          onConfirm={handleConfirmDelete}
          onClose={() => setDeleteTarget(null)}
          isDeleting={deleteDegreeMutation.isPending || deleteDesignationMutation.isPending}
        />
      )}
    </div>
  )
}
