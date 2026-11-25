// DosagePresetListPage.jsx — Admin master directory for Dosage Frequencies & Timings (MedConnect Admin)
import { useState, useMemo } from 'react'
import {
  Clock,
  Calendar,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  ListFilter,
} from 'lucide-react'
import {
  useAdminDosageFrequencies,
  useAdminDosageTimings,
  useAdminDosagePresetMutations,
} from '../../../features/clinical/useDosagePresets'
import toast from 'react-hot-toast'
import ListToolbar from '../../../components/admin/ListToolbar'
import TableFooter from '../../../components/admin/TableFooter'
import DeleteModal from '../../../components/admin/DeleteModal'
import EmptyState from '../../../components/common/EmptyState'
import CompactUlid from '../../../components/common/CompactUlid'
import { TableSkeleton } from '../../../components/common/Skeletons'
import { getErrorMessage } from '../../../utils/errorHelper'

export default function DosagePresetListPage() {
  const [activeTab, setActiveTab] = useState('frequencies') // 'frequencies' | 'timings'
  const [timingTypeFilter, setTimingTypeFilter] = useState('ALL') // 'ALL' | 'meal' | 'duration'
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(25)

  // Modals state
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  // Form state for Frequency
  const [frequencyForm, setFrequencyForm] = useState({
    frequency_en: '',
    frequency_bn: '',
    times_per_day: 1,
    description: '',
    sort_order: 0,
    is_active: true,
  })

  // Form state for Timing / Duration
  const [timingForm, setTimingForm] = useState({
    timing_type: 'meal',
    code: '',
    bangla: '',
    english: '',
    sort_order: 0,
    is_active: true,
  })

  const queryParams = useMemo(
    () => ({
      search: search.trim() || undefined,
      timing_type: activeTab === 'timings' && timingTypeFilter !== 'ALL' ? timingTypeFilter : undefined,
      status: statusFilter !== 'ALL' ? statusFilter : undefined,
      page: currentPage,
      per_page: perPage,
    }),
    [search, activeTab, timingTypeFilter, statusFilter, currentPage, perPage]
  )

  // Queries
  const frequenciesQuery = useAdminDosageFrequencies(activeTab === 'frequencies' ? queryParams : {})
  const timingsQuery = useAdminDosageTimings(activeTab === 'timings' ? queryParams : {})

  const currentQuery = activeTab === 'frequencies' ? frequenciesQuery : timingsQuery
  const { items, pagination, isLoading, isFetching, refetch } = currentQuery

  // Mutations
  const {
    createFrequencyMutation,
    updateFrequencyMutation,
    deleteFrequencyMutation,
    toggleFrequencyMutation,
    createTimingMutation,
    updateTimingMutation,
    deleteTimingMutation,
    toggleTimingMutation,
  } = useAdminDosagePresetMutations()

  const handleTabSwitch = (tab) => {
    setActiveTab(tab)
    setSearch('')
    setStatusFilter('ALL')
    setTimingTypeFilter('ALL')
    setCurrentPage(1)
  }

  const handleOpenCreate = () => {
    setEditTarget(null)
    if (activeTab === 'frequencies') {
      setFrequencyForm({
        frequency_en: '',
        frequency_bn: '',
        times_per_day: 1,
        description: '',
        sort_order: 0,
        is_active: true,
      })
    } else {
      setTimingForm({
        timing_type: timingTypeFilter !== 'ALL' ? timingTypeFilter : 'meal',
        code: '',
        bangla: '',
        english: '',
        sort_order: 0,
        is_active: true,
      })
    }
    setShowModal(true)
  }

  const handleOpenEdit = (item) => {
    setEditTarget(item)
    if (activeTab === 'frequencies') {
      setFrequencyForm({
        frequency_en: item.frequency_en || '',
        frequency_bn: item.frequency_bn || '',
        times_per_day: item.times_per_day ?? 1,
        description: item.description || '',
        sort_order: item.sort_order ?? 0,
        is_active: item.is_active ?? true,
      })
    } else {
      setTimingForm({
        timing_type: item.timing_type || 'meal',
        code: item.code || '',
        bangla: item.bangla || '',
        english: item.english || '',
        sort_order: item.sort_order ?? 0,
        is_active: item.is_active ?? true,
      })
    }
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (activeTab === 'frequencies') {
      if (!frequencyForm.frequency_en.trim() || !frequencyForm.frequency_bn.trim()) {
        toast.error('Both English and Bengali frequency are required (e.g. 1+0+1 and ১+০+১)')
        return
      }

      try {
        if (editTarget) {
          await updateFrequencyMutation.mutateAsync({ id: editTarget.id, data: frequencyForm })
          toast.success('Dosage frequency updated successfully')
        } else {
          await createFrequencyMutation.mutateAsync(frequencyForm)
          toast.success('Dosage frequency created successfully')
        }
        setShowModal(false)
      } catch (err) {
        toast.error(getErrorMessage(err, 'Failed to save dosage frequency'))
      }
    } else {
      if (!timingForm.bangla.trim()) {
        toast.error('Bengali timing title is required (e.g. খাবার পরে, ৭ দিন)')
        return
      }

      try {
        if (editTarget) {
          await updateTimingMutation.mutateAsync({ id: editTarget.id, data: timingForm })
          toast.success('Dosage timing updated successfully')
        } else {
          await createTimingMutation.mutateAsync(timingForm)
          toast.success('Dosage timing created successfully')
        }
        setShowModal(false)
      } catch (err) {
        toast.error(getErrorMessage(err, 'Failed to save dosage timing'))
      }
    }
  }

  const handleToggleActive = async (item) => {
    try {
      if (activeTab === 'frequencies') {
        await toggleFrequencyMutation.mutateAsync(item.id)
        toast.success(`Frequency ${item.is_active ? 'deactivated' : 'activated'}`)
      } else {
        await toggleTimingMutation.mutateAsync(item.id)
        toast.success(`Timing ${item.is_active ? 'deactivated' : 'activated'}`)
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to toggle status'))
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    try {
      if (activeTab === 'frequencies') {
        await deleteFrequencyMutation.mutateAsync(deleteTarget.id)
        toast.success('Frequency preset deleted')
      } else {
        await deleteTimingMutation.mutateAsync(deleteTarget.id)
        toast.success('Timing preset deleted')
      }
      setDeleteTarget(null)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete record'))
    }
  }

  const timingTypeOptions = [
    { value: 'ALL', label: 'All Types (Meal & Duration)' },
    { value: 'meal', label: 'Meal Instructions (খাওয়ার নিয়ম)' },
    { value: 'duration', label: 'Course Durations (মেয়াদ)' },
  ]

  return (
    <div className="admin-container">
      {/* ── Page Header ── */}
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {activeTab === 'frequencies' ? <Clock size={24} color="#00A88C" /> : <Calendar size={24} color="#00A88C" />}
            Dosage Presets & Schedules
          </h2>
          <p className="admin-page-subtitle">
            Configure global dosage frequencies (১+০+১), meal timing instructions, and course durations for prescriptions
          </p>
        </div>
        <button
          type="button"
          className="admin-btn admin-btn-primary"
          onClick={handleOpenCreate}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <Plus size={16} /> {activeTab === 'frequencies' ? 'Add Frequency' : 'Add Timing'}
        </button>
      </div>

      {/* ── Tab Switcher ── */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--admin-border)', paddingBottom: '0.5rem' }}>
        <button
          type="button"
          onClick={() => handleTabSwitch('frequencies')}
          className={`admin-btn ${activeTab === 'frequencies' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Clock size={16} />
          <span>Frequencies (১+০+১) ({frequenciesQuery.pagination?.total || 0})</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabSwitch('timings')}
          className={`admin-btn ${activeTab === 'timings' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Calendar size={16} />
          <span>Meal & Duration Timings ({timingsQuery.pagination?.total || 0})</span>
        </button>
      </div>

      {/* ── List Toolbar ── */}
      <ListToolbar
        search={search}
        onSearchChange={(v) => { setSearch(v); setCurrentPage(1) }}
        searchPlaceholder={activeTab === 'frequencies' ? "Search frequencies (e.g. 1+0+1, ১+১+১)..." : "Search timings (e.g. খাবার পরে, ৭ দিন)..."}
        onRefresh={refetch}
        refreshing={isLoading || isFetching}
        hasActiveFilters={statusFilter !== 'ALL' || (activeTab === 'timings' && timingTypeFilter !== 'ALL')}
        onClearFilters={() => { setStatusFilter('ALL'); setTimingTypeFilter('ALL'); setCurrentPage(1) }}
        activeFilters={[
          statusFilter !== 'ALL' && {
            key: 'status',
            label: `Status: ${statusFilter === 'true' ? 'Active' : 'Inactive'}`,
            onRemove: () => setStatusFilter('ALL'),
          },
          activeTab === 'timings' && timingTypeFilter !== 'ALL' && {
            key: 'timing_type',
            label: `Type: ${timingTypeFilter === 'meal' ? 'Meal Timing' : 'Duration'}`,
            onRemove: () => setTimingTypeFilter('ALL'),
          },
        ].filter(Boolean)}
      >
        {activeTab === 'timings' && (
          <div style={{ minWidth: 160, flex: '1 1 160px' }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>
              Timing Type
            </label>
            <select
              className="status-select"
              value={timingTypeFilter}
              onChange={(e) => {
                setTimingTypeFilter(e.target.value)
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
              {timingTypeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}

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
          <TableSkeleton rows={8} cols={activeTab === 'frequencies' ? 6 : 6} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={activeTab === 'frequencies' ? Clock : Calendar}
            title={activeTab === 'frequencies' ? "No dosage frequencies found" : "No dosage timings found"}
            description={search ? "Try adjusting your search criteria." : "Click Add to create your first master preset."}
            actionLabel={activeTab === 'frequencies' ? "Add Frequency" : "Add Timing"}
            onAction={handleOpenCreate}
          />
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>ID</th>
                  {activeTab === 'frequencies' ? (
                    <>
                      <th>English Format</th>
                      <th>Bengali Format</th>
                      <th>Times/Day</th>
                      <th>Description</th>
                    </>
                  ) : (
                    <>
                      <th>Type</th>
                      <th>Bengali Title</th>
                      <th>English Title</th>
                      <th>Code</th>
                    </>
                  )}
                  <th style={{ width: '90px' }}>Order</th>
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
                    {activeTab === 'frequencies' ? (
                      <>
                        <td>
                          <span style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--admin-text)' }}>
                            {item.frequency_en}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 700, color: '#10b981' }}>
                            {item.frequency_bn}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.85rem', color: 'var(--admin-text)' }}>
                            {item.times_per_day || 1} time(s)
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.85rem', color: 'var(--admin-text-secondary)' }}>
                            {item.description || '—'}
                          </span>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>
                          <span
                            style={{
                              padding: '0.15rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              textTransform: 'uppercase',
                              background: item.timing_type === 'meal' ? 'rgba(59, 130, 246, 0.12)' : 'rgba(168, 85, 247, 0.12)',
                              color: item.timing_type === 'meal' ? '#3b82f6' : '#a855f7',
                            }}
                          >
                            {item.timing_type === 'meal' ? 'Meal Timing' : 'Duration'}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, color: 'var(--admin-text)' }}>
                            {item.bangla}
                          </span>
                        </td>
                        <td>
                          <span style={{ color: 'var(--admin-text-secondary)' }}>
                            {item.english || '—'}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--admin-text-muted)' }}>
                            {item.code || '—'}
                          </span>
                        </td>
                      </>
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
                  ? (activeTab === 'frequencies' ? 'Edit Dosage Frequency' : 'Edit Dosage Timing')
                  : (activeTab === 'frequencies' ? 'Add Dosage Frequency' : 'Add Dosage Timing')}
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
                {activeTab === 'frequencies' ? (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="admin-form-group">
                        <label className="admin-form-label">
                          English Format <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                          type="text"
                          className="admin-form-input"
                          placeholder="e.g. 1+0+1 or 1+1+1"
                          value={frequencyForm.frequency_en}
                          onChange={(e) => setFrequencyForm({ ...frequencyForm, frequency_en: e.target.value })}
                          required
                          autoFocus
                        />
                      </div>

                      <div className="admin-form-group">
                        <label className="admin-form-label">
                          Bengali Format <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                          type="text"
                          className="admin-form-input"
                          placeholder="e.g. ১+০+১ or ১+১+১"
                          value={frequencyForm.frequency_bn}
                          onChange={(e) => setFrequencyForm({ ...frequencyForm, frequency_bn: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="admin-form-group">
                      <label className="admin-form-label">Times Per Day</label>
                      <input
                        type="number"
                        min="1"
                        max="24"
                        className="admin-form-input"
                        value={frequencyForm.times_per_day}
                        onChange={(e) => setFrequencyForm({ ...frequencyForm, times_per_day: parseInt(e.target.value, 10) || 1 })}
                      />
                    </div>

                    <div className="admin-form-group">
                      <label className="admin-form-label">Description / Instructions</label>
                      <input
                        type="text"
                        className="admin-form-input"
                        placeholder="e.g. সকালে ও রাতে (Morning and Night)"
                        value={frequencyForm.description}
                        onChange={(e) => setFrequencyForm({ ...frequencyForm, description: e.target.value })}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="admin-form-group">
                        <label className="admin-form-label">Sort Order</label>
                        <input
                          type="number"
                          className="admin-form-input"
                          value={frequencyForm.sort_order}
                          onChange={(e) => setFrequencyForm({ ...frequencyForm, sort_order: parseInt(e.target.value, 10) || 0 })}
                        />
                      </div>

                      <div className="admin-form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <label className="admin-form-label">Status</label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginTop: '0.25rem' }}>
                          <input
                            type="checkbox"
                            checked={frequencyForm.is_active}
                            onChange={(e) => setFrequencyForm({ ...frequencyForm, is_active: e.target.checked })}
                          />
                          <span style={{ fontSize: '0.875rem' }}>Active in prescription</span>
                        </label>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="admin-form-group">
                      <label className="admin-form-label">Timing Type</label>
                      <select
                        className="admin-form-input"
                        value={timingForm.timing_type}
                        onChange={(e) => setTimingForm({ ...timingForm, timing_type: e.target.value })}
                      >
                        <option value="meal">Meal Timing (যেমন: খাবার আগে, খাবার পরে)</option>
                        <option value="duration">Course Duration (যেমন: ৭ দিন, ১৪ দিন, ১ মাস)</option>
                      </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="admin-form-group">
                        <label className="admin-form-label">
                          Bengali Title <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                          type="text"
                          className="admin-form-input"
                          placeholder="e.g. খাবার পরে or ৭ দিন"
                          value={timingForm.bangla}
                          onChange={(e) => setTimingForm({ ...timingForm, bangla: e.target.value })}
                          required
                          autoFocus
                        />
                      </div>

                      <div className="admin-form-group">
                        <label className="admin-form-label">English Title</label>
                        <input
                          type="text"
                          className="admin-form-input"
                          placeholder="e.g. After meal or 7 days"
                          value={timingForm.english}
                          onChange={(e) => setTimingForm({ ...timingForm, english: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="admin-form-group">
                      <label className="admin-form-label">System Code / Slug</label>
                      <input
                        type="text"
                        className="admin-form-input"
                        placeholder="e.g. after_meal, 7_days"
                        value={timingForm.code}
                        onChange={(e) => setTimingForm({ ...timingForm, code: e.target.value })}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="admin-form-group">
                        <label className="admin-form-label">Sort Order</label>
                        <input
                          type="number"
                          className="admin-form-input"
                          value={timingForm.sort_order}
                          onChange={(e) => setTimingForm({ ...timingForm, sort_order: parseInt(e.target.value, 10) || 0 })}
                        />
                      </div>

                      <div className="admin-form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <label className="admin-form-label">Status</label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginTop: '0.25rem' }}>
                          <input
                            type="checkbox"
                            checked={timingForm.is_active}
                            onChange={(e) => setTimingForm({ ...timingForm, is_active: e.target.checked })}
                          />
                          <span style={{ fontSize: '0.875rem' }}>Active in prescription</span>
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
                  disabled={createFrequencyMutation.isPending || updateFrequencyMutation.isPending || createTimingMutation.isPending || updateTimingMutation.isPending}
                >
                  {editTarget ? 'Update Preset' : 'Create Preset'}
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
          title={activeTab === 'frequencies' ? "Delete Dosage Frequency" : "Delete Dosage Timing"}
          message={`Are you sure you want to delete this preset? Existing prescriptions will retain their saved text, but this button will be removed.`}
          onConfirm={handleConfirmDelete}
          onClose={() => setDeleteTarget(null)}
          isDeleting={deleteFrequencyMutation.isPending || deleteTimingMutation.isPending}
        />
      )}
    </div>
  )
}
