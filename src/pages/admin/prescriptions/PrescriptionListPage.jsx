// PrescriptionListPage.jsx — List all prescriptions (doctor sees own, admin sees all)
import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../../context/AuthContext'
import { useSubscription } from '../../../context/SubscriptionContext'
import UpgradePromptModal from '../../../components/admin/UpgradePromptModal'
import { getPrescriptions, deletePrescription, getDoctors } from '../../../api/adminApi'
import { queryKeys } from '../../../lib/queryKeys'
import DeleteModal from '../../../components/admin/DeleteModal'
import ListToolbar from '../../../components/admin/ListToolbar'
import SearchableSelect from '../../../components/common/SearchableSelect'
import EmptyState from '../../../components/common/EmptyState'
import CompactUlid from '../../../components/common/CompactUlid'
import TableFooter from '../../../components/admin/TableFooter'
import { getErrorMessage } from '../../../utils/errorHelper'
import { FileText, PenLine, CheckCircle2, Clock, AlertCircle } from 'lucide-react'

export default function PrescriptionListPage() {
  const { user, isAdmin, isDoctor } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTabParam = searchParams.get('tab') || 'all'

  const [statusTab, setStatusTab] = useState(activeTabParam)
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [doctorFilter, setDoctorFilter] = useState('')
  const [sourceTypeFilter, setSourceTypeFilter] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [perPage, setPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  const { hasActiveSubscription, isExpired } = useSubscription()
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const isSubscriptionBlocked = isDoctor && (!hasActiveSubscription || isExpired)

  const handleCreatePrescriptionClick = (e, targetPath = '/admin/prescriptions/create') => {
    if (isSubscriptionBlocked) {
      if (e) e.preventDefault()
      setShowUpgradeModal(true)
    } else {
      navigate(targetPath)
    }
  }

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

  const {
    data: prescriptions = [],
    isLoading: loading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['admin', 'prescriptions', { doctorScopeId, doctorFilter, sourceTypeFilter, dateFrom, dateTo }],
    queryFn: async () => {
      const params = { per_page: 200 }
      if (doctorFilter) params.doctor_id = doctorFilter
      if (dateFrom) params.date_from = dateFrom
      if (dateTo) params.date_to = dateTo
      if (sourceTypeFilter && sourceTypeFilter !== 'all') params.source_type = sourceTypeFilter
      const res = await getPrescriptions(params)
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
                  doctor_id: user?.doctor?.id || user?.doctor_id || undefined,
                  doctor_public_id: user?.doctor?.public_id || undefined,
                  doctor_name: user?.doctor?.name || user?.name || undefined,
                  local_key: key
                })
              } else {
                localStorage.removeItem(key)
              }
            } catch (err) {}
          }
        } catch (e) {}
      }

      return [...localDrafts, ...dbList]
    },
    staleTime: 45 * 1000,
  })

  // Doctor lookup for Admin filter
  const { data: doctorsData = [] } = useQuery({
    queryKey: ['admin', 'doctors', 'lookup'],
    queryFn: async () => {
      const res = await getDoctors({ per_page: 500 })
      return res.data?.data?.data || res.data?.data || res.data || []
    },
    enabled: !!isAdmin,
    staleTime: 5 * 60 * 1000,
  })

  const doctorOptions = useMemo(() => {
    return [
      { id: '', name: 'All Doctors' },
      ...doctorsData.map(d => ({
        id: String(d.id),
        name: d.name ? `Dr. ${d.name.replace(/^dr\.?\s*/i, '')}` : `Doctor #${d.id}`
      }))
    ]
  }, [doctorsData])

  const sourceTypeOptions = [
    { id: 'all', name: 'All Sources' },
    { id: 'appointment', name: '📅 From Appointment' },
    { id: 'walkin', name: '🚶 Walk-in / Direct' },
  ]

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      if (deleteTarget.is_local_draft && deleteTarget.local_key) {
        localStorage.removeItem(deleteTarget.local_key)
        queryClient.invalidateQueries({ queryKey: queryKeys.prescriptions.all })
      } else {
        await deletePrescription(deleteTarget.id)
        queryClient.invalidateQueries({ queryKey: queryKeys.prescriptions.all })
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

  const getPrescriptionDateStr = (p) => {
    if (p.prescription_date && /^\d{4}-\d{2}-\d{2}/.test(p.prescription_date)) {
      return p.prescription_date.substring(0, 10)
    }
    if (p.visited_at) {
      try {
        const d = new Date(p.visited_at)
        if (!isNaN(d.getTime())) {
          return d.toISOString().substring(0, 10)
        }
      } catch (e) {}
    }
    return ''
  }

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

    const pDate = getPrescriptionDateStr(p)
    if (dateFrom) {
      if (pDate && pDate < dateFrom) return false
    }
    if (dateTo) {
      if (pDate && pDate > dateTo) return false
    }

    if (doctorFilter) {
      const matchDoc =
        String(p.doctor_public_id || '') === String(doctorFilter) ||
        String(p.doctor_id || '') === String(doctorFilter) ||
        String(p.doctor?.public_id || '') === String(doctorFilter) ||
        String(p.doctor?.id || '') === String(doctorFilter)
      if (!matchDoc) return false
    }

    if (sourceTypeFilter === 'appointment') {
      const hasAppt = Boolean(p.appointment_id && String(p.appointment_id) !== 'null' && String(p.appointment_id) !== 'undefined')
      if (!hasAppt) return false
    } else if (sourceTypeFilter === 'walkin') {
      const hasAppt = Boolean(p.appointment_id && String(p.appointment_id) !== 'null' && String(p.appointment_id) !== 'undefined')
      if (hasAppt) return false
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
        onRefresh={() => refetch()}
        refreshing={isFetching}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(p => !p)}
        hasActiveFilters={Boolean(dateFrom || dateTo || (isAdmin && doctorFilter) || (sourceTypeFilter && sourceTypeFilter !== 'all'))}
        onClearFilters={() => {
          setDateFrom('')
          setDateTo('')
          setDoctorFilter('')
          setSourceTypeFilter('all')
        }}
        activeFilters={[
          dateFrom && { key: 'date_from', label: `From: ${dateFrom}`, onRemove: () => setDateFrom('') },
          dateTo && { key: 'date_to', label: `To: ${dateTo}`, onRemove: () => setDateTo('') },
          isAdmin && doctorFilter && {
            key: 'doctor',
            label: `Doctor: ${doctorOptions.find(d => String(d.id) === String(doctorFilter))?.name || doctorFilter}`,
            onRemove: () => setDoctorFilter('')
          },
          sourceTypeFilter && sourceTypeFilter !== 'all' && {
            key: 'source_type',
            label: sourceTypeOptions.find(s => s.id === sourceTypeFilter)?.name || sourceTypeFilter,
            onRemove: () => setSourceTypeFilter('all')
          },
        ].filter(Boolean)}
        actions={
          isDoctor && (
            <button
              type="button"
              onClick={(e) => handleCreatePrescriptionClick(e, '/admin/prescriptions/create')}
              className="admin-btn admin-btn-primary"
              style={{ height: 38, display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}
            >
              + New Prescription
            </button>
          )
        }
      >
        <div style={{ minWidth: 140 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>From Date</label>
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            style={{ width: '100%', height: 38, padding: '0 10px', borderRadius: 8, border: '1px solid var(--admin-border)', background: 'var(--admin-card-bg)', color: 'var(--admin-text)' }}
          />
        </div>

        <div style={{ minWidth: 140 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>To Date</label>
          <input
            type="date"
            value={dateTo}
            min={dateFrom || undefined}
            onChange={e => setDateTo(e.target.value)}
            style={{ width: '100%', height: 38, padding: '0 10px', borderRadius: 8, border: '1px solid var(--admin-border)', background: 'var(--admin-card-bg)', color: 'var(--admin-text)' }}
          />
        </div>

        {isAdmin && (
          <SearchableSelect
            label="Doctor"
            placeholder="All Doctors"
            options={doctorOptions}
            value={doctorFilter}
            onChange={setDoctorFilter}
          />
        )}

        <SearchableSelect
          label="Source"
          placeholder="All Sources"
          options={sourceTypeOptions}
          value={sourceTypeFilter}
          onChange={setSourceTypeFilter}
        />
      </ListToolbar>

      <div className="admin-card">
        <div className="admin-card-header">
          <h3 className="admin-card-title">
            {statusTab === 'draft' ? 'Draft Prescriptions (খসড়া)' : statusTab === 'finalized' ? 'Completed Prescriptions' : 'Prescription Records'}
          </h3>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text-muted)' }}>
            {loading ? <span className="skeleton-box" style={{ width: 22, height: 14, borderRadius: 4, display: 'inline-block' }} /> : `${filtered.length} total`}
          </span>
        </div>

        {!loading && filtered.length === 0 ? (
          <EmptyState 
            hasFilters={Boolean(search || dateFrom || dateTo || doctorFilter || (sourceTypeFilter && sourceTypeFilter !== 'all') || statusTab !== 'all')} 
            searchQuery={search} 
            onClearFilters={() => {
              setDateFrom('')
              setDateTo('')
              setDoctorFilter('')
              setSourceTypeFilter('all')
              setStatusTab('all')
            }} 
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
                  <th style={{ width: 120 }}>ID</th>
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
                {loading ? (
                  Array.from({ length: 8 }).map((_, rIdx) => (
                    <tr key={`rx-skeleton-${rIdx}`}>
                      <td>
                        <div className="skeleton-box" style={{ width: 85, height: 22, borderRadius: 6 }} />
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <div className="skeleton-box" style={{ width: 110, height: 14, borderRadius: 4 }} />
                          <div className="skeleton-box" style={{ width: 70, height: 11, borderRadius: 4 }} />
                        </div>
                      </td>
                      {isAdmin && (
                        <td>
                          <div className="skeleton-box" style={{ width: 120, height: 14, borderRadius: 4 }} />
                        </td>
                      )}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <div className="skeleton-box" style={{ width: 75, height: 20, borderRadius: 6 }} />
                          <div className="skeleton-box" style={{ width: 85, height: 16, borderRadius: 4 }} />
                        </div>
                      </td>
                      <td>
                        <div className="skeleton-box" style={{ width: 80, height: 14, borderRadius: 4 }} />
                      </td>
                      <td>
                        <div className="skeleton-box" style={{ width: `${75 + (rIdx % 3) * 15}%`, height: 14, borderRadius: 4 }} />
                      </td>
                      <td>
                        <div className="skeleton-box" style={{ width: 55, height: 18, borderRadius: 12 }} />
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          <div className="skeleton-box" style={{ width: 28, height: 28, borderRadius: 6 }} />
                          <div className="skeleton-box" style={{ width: 28, height: 28, borderRadius: 6 }} />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : paginatedData.map(p => (
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
                      <div>
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
                      </div>
                      <div style={{ marginTop: 4 }}>
                        {p.appointment_id ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3,
                            padding: '1px 6px',
                            borderRadius: 4,
                            fontSize: 10,
                            fontWeight: 700,
                            background: '#eff6ff',
                            color: '#1d4ed8',
                            border: '1px solid #bfdbfe'
                          }}>
                            📅 Appointment
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3,
                            padding: '1px 6px',
                            borderRadius: 4,
                            fontSize: 10,
                            fontWeight: 700,
                            background: '#fef3c7',
                            color: '#92400e',
                            border: '1px solid #fde68a'
                          }}>
                            🚶 Walk-in
                          </span>
                        )}
                      </div>
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
                            {isDoctor ? (
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
                                    if (isSubscriptionBlocked) {
                                      setShowUpgradeModal(true)
                                      return
                                    }
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
                              <button
                                className="admin-action-btn admin-action-btn-view"
                                onClick={() => navigate(`/admin/prescriptions/view/${p.public_id || p.id}`)}
                                title="View Draft Preview"
                              >
                                <img src="/icons/view.png" alt="View" />
                              </button>
                            )}
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

      <UpgradePromptModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        targetEntity="doctor"
        featureName="ডিজিটাল প্রেসক্রিপশন"
      />
    </div>
  )
}