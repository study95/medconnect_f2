// PrescriptionListPage.jsx — List all prescriptions (doctor sees own, admin sees all)
import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { getPrescriptions, deletePrescription } from '../../../api/adminApi'
import DeleteModal from '../../../components/admin/DeleteModal'
import ListToolbar from '../../../components/admin/ListToolbar'
import { TableSkeleton } from '../../../components/common/Skeletons'
import EmptyState from '../../../components/common/EmptyState'
import CompactUlid from '../../../components/common/CompactUlid'
import TableFooter from '../../../components/admin/TableFooter'
import { getErrorMessage } from '../../../utils/errorHelper'
import { FileText, PenLine, CheckCircle2, Clock, AlertCircle } from 'lucide-react'

export default function PrescriptionListPage() {
  const { user, isAdmin, isDoctor } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTabParam = searchParams.get('tab') || 'all'

  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusTab, setStatusTab] = useState(activeTabParam)
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [perPage, setPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    if (activeTabParam && ['all', 'draft', 'finalized'].includes(activeTabParam)) {
      setStatusTab(activeTabParam)
    }
  }, [activeTabParam])

  const handleTabChange = (tab) => {
    setStatusTab(tab)
    if (tab === 'all') {
      searchParams.delete('tab')
    } else {
      searchParams.set('tab', tab)
    }
    setSearchParams(searchParams)
  }

  const doctorScopeId = user?.doctor?.id 
    ? `doc_${user.doctor.id}` 
    : (user?.doctor_id ? `doc_${user.doctor_id}` : (user?.id ? `usr_${user.id}` : null))

  const fetchPrescriptions = async () => {
    try {
      setLoading(true)
      const res = await getPrescriptions({ per_page: 200 })
      const dbList = res.data?.data?.data || res.data?.data || res.data || []

      // Also merge any local browser drafts for this doctor
      const localDrafts = []
      if (doctorScopeId) {
        try {
          const prefix = `dr_rx_draft_${doctorScopeId}_`
          const keysToInspect = []
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key && key.startsWith(prefix)) {
              keysToInspect.push(key)
            }
          }

          for (const key of keysToInspect) {
            try {
              const raw = localStorage.getItem(key)
              if (!raw) continue
              const item = JSON.parse(raw)
              if (!item?.form) {
                localStorage.removeItem(key)
                continue
              }

              const activeId = item.activeDraftId
              const apptId = item.form?.appointment_id || item.appointmentInfo?.id || item.appointmentInfo?.public_id || item.appointment_id

              const keyMatches = (p) => {
                if (p.public_id && key.toUpperCase().includes(p.public_id.toUpperCase())) return true
                if (p.id && key.endsWith(`_rx_${p.id}`)) return true
                if (p.appointment_id && key.endsWith(`_${p.appointment_id}`)) return true
                if (p.appointment_public_id && key.toUpperCase().includes(p.appointment_public_id.toUpperCase())) return true
                return false
              }

              const dbMatch = dbList.find(p =>
                (activeId && (String(p.id) === String(activeId) || (p.public_id && String(p.public_id).toUpperCase() === String(activeId).toUpperCase()))) ||
                (apptId && (String(p.appointment_id) === String(apptId) || (p.appointment_public_id && String(p.appointment_public_id).toUpperCase() === String(apptId).toUpperCase()))) ||
                keyMatches(p)
              )

              if (dbMatch) {
                if (dbMatch.status === 'finalized' || dbMatch.status === 'locked') {
                  localStorage.removeItem(key)
                }
                continue
              }

              const hasMeds = Array.isArray(item.form.medicines) && item.form.medicines.some(m => (m.medicine_name || '').trim().length > 0)
              const hasContent = !!(item.form.diagnosis?.trim() || item.form.advice?.trim() || item.form.patient_name?.trim() || hasMeds)
              if (hasContent) {
                localDrafts.push({
                  id: item.activeDraftId || `local_${key}`,
                  public_id: item.form.patient_public_id || 'LOCAL-DRAFT',
                  patient_name: item.form.patient_name || item.walkInPatientInfo?.name || 'Walk-in (Local Draft)',
                  patient_phone: item.form.patient_phone || item.walkInPatientInfo?.phone || '—',
                  patient_id: item.form.patient_public_id || item.walkInPatientInfo?.patient_id || '',
                  status: 'draft',
                  is_local_draft: true,
                  prescription_date: item.savedAt ? new Date(item.savedAt).toLocaleDateString() : 'Today',
                  diagnosis: item.form.diagnosis || '',
                  medicines: item.form.medicines?.filter(m => (m.medicine_name || '').trim()) || [],
                  appointment_id: item.form.appointment_id || undefined,
                  local_key: key
                })
              } else {
                localStorage.removeItem(key)
              }
            } catch (err) {}
          }
        } catch (e) {}
      }

      setPrescriptions([...localDrafts, ...dbList])
    } catch (err) {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPrescriptions() }, [doctorScopeId])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      if (deleteTarget.is_local_draft && deleteTarget.local_key) {
        localStorage.removeItem(deleteTarget.local_key)
        setPrescriptions(prescriptions.filter(p => p.id !== deleteTarget.id))
      } else {
        await deletePrescription(deleteTarget.id)
        setPrescriptions(prescriptions.filter(p => p.id !== deleteTarget.id))
      }
    } catch (err) {
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  const draftCount = prescriptions.filter(p => p.status === 'draft').length
  const completedCount = prescriptions.filter(p => p.status !== 'draft').length

  useEffect(() => {
    if (!loading) {
      window.dispatchEvent(new CustomEvent('rx-draft-count-updated', { detail: draftCount }))
    }
  }, [draftCount, loading])

  const filtered = prescriptions.filter(p => {
    if (statusTab === 'draft' && p.status !== 'draft') return false
    if (statusTab === 'finalized' && p.status === 'draft') return false

    if (search) {
      const q = search.toLowerCase()
      const matchName = p.patient_name?.toLowerCase().includes(q)
      const matchDoc = p.doctor_name?.toLowerCase().includes(q)
      const matchDiag = p.diagnosis?.toLowerCase().includes(q)
      const matchId = String(p.id).includes(q)
      const matchPublicId = p.public_id?.toLowerCase().includes(q)
      const matchReg = p.registration_no?.toLowerCase().includes(q)
      if (!matchName && !matchDoc && !matchDiag && !matchId && !matchPublicId && !matchReg) return false
    }
    if (dateFilter && p.prescription_date) {
      if (!p.prescription_date.startsWith(dateFilter)) return false
    }
    return true
  })

  useEffect(() => { setCurrentPage(1) }, [filtered.length, statusTab])
  const paginatedData = filtered.slice((currentPage - 1) * perPage, currentPage * perPage)

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title" style={{ color: 'var(--admin-text)' }}>
            <span style={{ marginRight: 12 }}>📋</span>
            Prescriptions
          </h2>
          <p className="admin-page-subtitle" style={{ color: 'var(--admin-text-muted)' }}>
            Digital clinical prescriptions, draft records, and patient diagnosis
          </p>
        </div>
      </div>

      {/* Segmented Status Tabs (All / Drafts / Completed) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 16,
        background: 'var(--admin-card-bg)',
        padding: '6px 8px',
        borderRadius: 10,
        border: '1px solid var(--admin-border)',
        width: 'fit-content'
      }}>
        <button
          type="button"
          onClick={() => handleTabChange('all')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 14px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            transition: '0.2s',
            background: statusTab === 'all' ? 'var(--admin-primary, #00A88C)' : 'transparent',
            color: statusTab === 'all' ? '#fff' : 'var(--admin-text-muted)'
          }}
        >
          <FileText size={14} />
          <span>All Prescriptions</span>
          <span style={{
            fontSize: 11,
            fontWeight: 800,
            padding: '1px 6px',
            borderRadius: 10,
            background: statusTab === 'all' ? 'rgba(255,255,255,0.25)' : 'var(--admin-hover)',
            color: statusTab === 'all' ? '#fff' : 'var(--admin-text)'
          }}>
            {prescriptions.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('draft')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 14px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            transition: '0.2s',
            background: statusTab === 'draft' ? '#f59e0b' : 'transparent',
            color: statusTab === 'draft' ? '#fff' : 'var(--admin-text-muted)'
          }}
        >
          <Clock size={14} />
          <span>Drafts (খসড়া)</span>
          <span style={{
            fontSize: 11,
            fontWeight: 800,
            padding: '1px 7px',
            borderRadius: 10,
            background: statusTab === 'draft' ? '#fff' : '#fef3c7',
            color: statusTab === 'draft' ? '#b45309' : '#d97706',
            border: statusTab === 'draft' ? 'none' : '1px solid #fde68a'
          }}>
            {draftCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('finalized')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 14px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            transition: '0.2s',
            background: statusTab === 'finalized' ? '#10b981' : 'transparent',
            color: statusTab === 'finalized' ? '#fff' : 'var(--admin-text-muted)'
          }}
        >
          <CheckCircle2 size={14} />
          <span>Completed (সম্পন্ন)</span>
          <span style={{
            fontSize: 11,
            fontWeight: 800,
            padding: '1px 6px',
            borderRadius: 10,
            background: statusTab === 'finalized' ? 'rgba(255,255,255,0.25)' : 'var(--admin-hover)',
            color: statusTab === 'finalized' ? '#fff' : 'var(--admin-text)'
          }}>
            {completedCount}
          </span>
        </button>
      </div>

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by patient, ID, diagnosis..."
        onRefresh={fetchPrescriptions}
        refreshing={loading}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(p => !p)}
        hasActiveFilters={Boolean(dateFilter)}
        onClearFilters={() => setDateFilter('')}
        activeFilters={[
          dateFilter && { key: 'date', label: `Date: ${dateFilter}`, onRemove: () => setDateFilter('') },
        ].filter(Boolean)}
        actions={
          isDoctor && (
            <Link to="/admin/prescriptions/create" className="admin-btn admin-btn-primary" style={{ height: 38, display: 'inline-flex', alignItems: 'center' }}>
              + New Prescription
            </Link>
          )
        }
      >
        <div style={{ minWidth: 160 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>Date</label>
          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            style={{ width: '100%', height: 38, padding: '0 10px', borderRadius: 8, border: '1px solid var(--admin-border)', background: 'var(--admin-card-bg)', color: 'var(--admin-text)' }}
          />
        </div>
      </ListToolbar>

      <div className="admin-card">
        <div className="admin-card-header">
          <h3 className="admin-card-title">
            {statusTab === 'draft' ? 'Draft Prescriptions (খসড়া)' : statusTab === 'finalized' ? 'Completed Prescriptions' : 'Prescription Records'}
          </h3>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text-muted)' }}>{filtered.length} total</span>
        </div>

        {loading ? (
          <TableSkeleton rowCount={8} columnWidths={['100px', '22%', '14%', '12%', '18%', '12%', '16%']} headers={['ID', 'Patient', 'Status', 'Date', 'Diagnosis', 'Medicines', 'Actions']} />
        ) : filtered.length === 0 ? (
          <EmptyState 
            hasFilters={Boolean(search || dateFilter || statusTab !== 'all')} 
            searchQuery={search} 
            onClearFilters={() => { setDateFilter(''); setStatusTab('all') }} 
            onClearSearch={() => setSearch('')} 
            icon={statusTab === 'draft' ? '📝' : '📋'} 
            title={statusTab === 'draft' ? 'No draft prescriptions' : 'No prescriptions found'} 
            description={statusTab === 'draft' ? 'You have no incomplete draft prescriptions at this moment.' : 'No prescription records match your criteria.'} 
            primaryAction={isDoctor ? { label: '+ New Prescription', to: '/admin/prescriptions/create' } : undefined} 
          />
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Patient</th>
                  {isAdmin && <th>Doctor</th>}
                  <th>Status</th>
                  <th>Date</th>
                  <th>Diagnosis</th>
                  <th>Medicines</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map(p => (
                  <tr key={p.id}>
                    <td>
                      <CompactUlid value={p.public_id || p.id} />
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.patient_name || (p.patient ? p.patient.name : '—')}</div>
                      {p.patient_id && <div style={{ fontSize: 11, color: '#2563eb', fontWeight: 600 }}>{p.patient_id}</div>}
                      {p.patient_phone && <div style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>{p.patient_phone}</div>}
                    </td>
                    {isAdmin && (
                      <td>
                        <div style={{ fontWeight: 600 }}>{p.doctor_name || (p.doctor ? p.doctor.name : '—')}</div>
                      </td>
                    )}
                    <td>
                      {p.status === 'draft' ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          background: p.is_local_draft ? '#fef9c3' : '#fef3c7',
                          color: p.is_local_draft ? '#854d0e' : '#d97706',
                          border: p.is_local_draft ? '1px solid #fde047' : '1px solid #fcd34d'
                        }}>
                          <Clock size={11} /> {p.is_local_draft ? 'Draft (Local)' : 'Draft'}
                        </span>
                      ) : (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          background: '#dcfce7',
                          color: '#15803d',
                          border: '1px solid #86efac'
                        }}>
                          <CheckCircle2 size={11} /> Finalized
                        </span>
                      )}
                    </td>
                    <td>{p.prescription_date || (p.visited_at ? new Date(p.visited_at).toLocaleDateString() : '—')}</td>
                    <td>
                      <span style={{ maxWidth: 180, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.diagnosis || (p.status === 'draft' ? <em style={{ color: 'var(--admin-text-muted)' }}>Pending diagnosis...</em> : '—')}
                      </span>
                    </td>
                    <td>
                      <span className={`admin-badge ${p.medicines && p.medicines.length > 0 ? 'admin-badge-info' : 'admin-badge-secondary'}`}>
                        {p.medicines ? p.medicines.length : 0} items
                      </span>
                    </td>
                    <td>
                      <div className="admin-actions" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        {p.status === 'draft' ? (
                          <>
                            <button
                              className="admin-btn admin-btn-sm"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                padding: '5px 12px',
                                fontSize: 12,
                                fontWeight: 700,
                                borderRadius: 6,
                                background: '#00A88C',
                                color: '#fff',
                                border: 'none',
                                cursor: 'pointer',
                                boxShadow: '0 2px 4px rgba(0,168,140,0.2)'
                              }}
                              onClick={() => {
                                if (p.is_local_draft) {
                                  if (p.appointment_id) {
                                    navigate(`/admin/prescriptions/create?appointment_id=${p.appointment_id}`)
                                  } else {
                                    navigate('/admin/prescriptions/create')
                                  }
                                } else {
                                  navigate(`/admin/prescriptions/edit/${p.public_id || p.id}`)
                                }
                              }}
                              title="Resume writing and complete prescription"
                            >
                              <PenLine size={13} /> Complete
                            </button>
                            <button
                              className="admin-action-btn admin-action-btn-delete"
                              onClick={() => setDeleteTarget(p)}
                              title="Discard Draft"
                            >
                              <img src="/icons/delete.png" alt="Delete" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="admin-action-btn admin-action-btn-view"
                              onClick={() => navigate(`/admin/prescriptions/view/${p.public_id || p.id}`)}
                              title="View / Print"
                            >
                              <img src="/icons/view.png" alt="View" />
                            </button>
                            <button
                              className="admin-action-btn admin-action-btn-edit"
                              onClick={() => navigate(`/admin/prescriptions/edit/${p.public_id || p.id}`)}
                              title="Edit"
                            >
                              <img src="/icons/edit.png" alt="Edit" />
                            </button>
                            <button
                              className="admin-action-btn admin-action-btn-delete"
                              onClick={() => setDeleteTarget(p)}
                              title="Delete"
                            >
                              <img src="/icons/delete.png" alt="Delete" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <TableFooter
        total={filtered.length}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        perPage={perPage}
        setPerPage={setPerPage}
      />

      <DeleteModal
        show={!!deleteTarget}
        title={deleteTarget?.status === 'draft' ? "Discard Prescription Draft" : "Delete Prescription"}
        message={
          deleteTarget?.status === 'draft'
            ? `Are you sure you want to discard the incomplete draft prescription for "${deleteTarget?.patient_name || 'this patient'}"?`
            : `Are you sure you want to delete prescription for "${deleteTarget?.patient_name || ''}"?`
        }
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  )
}