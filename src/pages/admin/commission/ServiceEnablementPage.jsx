import { useState, useEffect, useRef } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Filter, ChevronDown, ChevronUp, RotateCcw, Check, X } from 'lucide-react'
import toast from 'react-hot-toast'
import CompactUlid from '../../../components/common/CompactUlid'
import ListToolbar from '../../../components/admin/ListToolbar'
import SearchableSelect from '../../../components/common/SearchableSelect'
import { useAuth } from '../../../context/AuthContext'
import { getErrorMessage } from '../../../utils/errorHelper'
import { queryKeys } from '../../../lib/queryKeys'
import {
  getServiceEnablements, updateServiceEnablement,
  getHospitalCommissions, updateHospitalCommission,
  getPatientBookingCommission, updatePatientBookingCommission,
  getDoctors, getHospitals,
  getDivisions, getDistricts, getUpazilas, getUnions
} from '../../../api/adminApi'

const TABS = [
  { key: 'doctor', label: 'Doctor Service', icon: '👨‍⚕️' },
  { key: 'hospital', label: 'Hospital Commission', icon: '🏥' },
  { key: 'patient', label: 'Patient Booking', icon: '🌐' },
]

export default function ServiceEnablementPage() {
  const { isAdmin, loading } = useAuth()
  const [activeTab, setActiveTab] = useState('doctor')

  if (!loading && !isAdmin) {
    return <Navigate to="/admin" replace />
  }

  return (
    <div className="admin-container">
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title" style={{ color: 'var(--admin-text)' }}>
            <span style={{ marginRight: 12 }}>⚙️</span>
            Commission & Service Controls
          </h2>
          <p className="admin-page-subtitle" style={{ color: 'var(--admin-text-muted)' }}>Configure doctor service access switches, commission percentage rates, and patient booking rules</p>
        </div>
      </div>

      {/* Modern Tab Bar */}
      <div style={{
        display: 'flex', gap: 6, background: 'var(--admin-sidebar-user-bg)', borderRadius: 18, padding: 6, marginBottom: 32, maxWidth: 680
      }}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: 1, padding: '14px 20px', borderRadius: 14, border: 'none', cursor: 'pointer',
              fontWeight: 800, fontSize: 14, transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              background: activeTab === tab.key ? 'var(--admin-card-bg)' : 'transparent',
              color: activeTab === tab.key ? 'var(--admin-text)' : 'var(--admin-text-muted)',
              boxShadow: activeTab === tab.key ? 'var(--admin-shadow-md)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'doctor' && <DoctorServiceTab />}
      {activeTab === 'hospital' && <HospitalCommissionTab />}
      {activeTab === 'patient' && <PatientBookingTab />}

      <style dangerouslySetInnerHTML={{ __html: `
        .admin-container { animation: fadeIn 0.4s ease-out; }
        
        .service-model-toggle {
          display: flex;
          background: var(--admin-bg);
          padding: 3px;
          border-radius: 10px;
          gap: 2px;
          width: fit-content;
        }
        .model-btn {
          padding: 6px 12px;
          border-radius: 8px;
          border: none;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s;
          color: var(--admin-text-muted);
          background: transparent;
          white-space: nowrap;
        }
        .model-btn.active {
          background: var(--admin-card-bg);
          color: var(--admin-text);
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .model-btn:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  )
}

function DoctorServiceTab() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [doctorsOptions, setDoctorsOptions] = useState([])
  const [saving, setSaving] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  
  const [statusFilter, setStatusFilter] = useState('') // '', 'package', 'commission', 'disabled'
  const [enableTarget, setEnableTarget] = useState(null)
  const [disableTarget, setDisableTarget] = useState(null)
  const [packageInfoTarget, setPackageInfoTarget] = useState(null)
  const [disableReason, setDisableReason] = useState('Payment / Subscription Overdue')
  const [customReason, setCustomReason] = useState('')
  const [editingRates, setEditingRates] = useState({})

  const [search, setSearch] = useState('')
  const [doctorFilter, setDoctorFilter] = useState('')
  
  const [divisionId, setDivisionId] = useState('')
  const [districtId, setDistrictId] = useState('')
  const [upazilaId, setUpazilaId] = useState('')
  const [unionId, setUnionId] = useState('')
  
  const [divisions, setDivisions] = useState([])
  const [districts, setDistricts] = useState([])
  const [upazilas, setUpazilas] = useState([])
  const [unions, setUnions] = useState([])

  const { data: doctorsData = [], isLoading: loading, isFetching, refetch } = useQuery({
    queryKey: queryKeys.commissions.serviceEnablements(),
    queryFn: async () => {
      const res = await getServiceEnablements({ per_page: 500 })
      const raw = res.data?.data
      return Array.isArray(raw?.data) ? raw.data : (Array.isArray(raw) ? raw : [])
    },
    staleTime: 60 * 1000,
  })

  useEffect(() => { 
    loadOptions()
    loadInitialLocations()
  }, [])

  const loadInitialLocations = async () => {
    try {
      const res = await getDivisions()
      setDivisions(res.data?.data || [])
    } catch (err) { console.error(err) }
  }

  useEffect(() => {
    if (divisionId) {
      getDistricts({ division_id: divisionId }).then(res => setDistricts(res.data?.data || []))
    } else {
      setDistricts([]); setDistrictId(''); setUpazilas([]); setUpazilaId(''); setUnions([]); setUnionId('')
    }
  }, [divisionId])

  useEffect(() => {
    if (districtId) {
      getUpazilas({ district_id: districtId }).then(res => setUpazilas(res.data?.data || []))
    } else {
      setUpazilas([]); setUpazilaId(''); setUnions([]); setUnionId('')
    }
  }, [districtId])

  useEffect(() => {
    if (upazilaId) {
      getUnions({ upazila_id: upazilaId }).then(res => setUnions(res.data?.data || []))
    } else {
      setUnions([]); setUnionId('')
    }
  }, [upazilaId])

  const loadOptions = async () => {
    try {
      const params = { per_page: 500, is_active: 1 }
      if (divisionId) params.division_id = divisionId
      if (districtId) params.district_id = districtId
      if (upazilaId) params.upazila_id = upazilaId
      if (unionId) params.union_id = unionId

      const res = await getDoctors(params)
      setDoctorsOptions(res.data?.data?.data || res.data?.data || [])
    } catch (err) { console.error(err) }
  }

  useEffect(() => { loadOptions() }, [divisionId, districtId, upazilaId, unionId])

  const handleUpdate = async (doctorId, field, value, customNotes = null) => {
    const doctor = (Array.isArray(doctorsData) ? doctorsData : []).find(d => d.id === doctorId)
    if (doctor?.has_active_access && field !== 'is_enabled') {
      return
    }

    const current = doctor?.enablement || {}
    const payload = {
      service_type: 'percentage',
      commission_percentage: current.commission_percentage || 0,
      is_enabled: current.is_enabled || false,
      notes: customNotes !== null ? customNotes : (current.notes || ''),
      ...{ [field]: value }
    }

    setSaving(doctorId)
    try {
      await updateServiceEnablement(doctorId, payload)
      toast.success(
        field === 'is_enabled'
          ? (value ? 'Doctor service enabled successfully.' : 'Doctor service disabled safely.')
          : 'Doctor service settings updated.'
      )
      queryClient.invalidateQueries({ queryKey: queryKeys.commissions.all })
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update doctor service settings.'))
    } finally {
      setSaving(null)
    }
  }

  const saveRate = (docId) => {
    const val = parseFloat(editingRates[docId])
    if (isNaN(val) || val < 0 || val > 100) {
      toast.error('Commission rate must be between 0% and 100%')
      return
    }
    handleUpdate(docId, 'commission_percentage', val)
    setEditingRates(prev => {
      const next = { ...prev }
      delete next[docId]
      return next
    })
  }

  const statusOptions = [
    { id: '', name: 'All Statuses' },
    { id: 'package', name: '📦 Package Active' },
    { id: 'commission', name: '📊 Commission Active' },
    { id: 'disabled', name: '⛔ Service Disabled' },
  ]

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('')
    setDoctorFilter('')
    setDivisionId('')
    setDistrictId('')
    setUpazilaId('')
    setUnionId('')
  }

  const doctorList = Array.isArray(doctorsData) ? doctorsData : []
  const totalCount = doctorList.length
  const packageCount = doctorList.filter(d => d.has_active_access).length
  const commActiveCount = doctorList.filter(d => !d.has_active_access && d.enablement?.is_enabled).length
  const disabledCount = doctorList.filter(d => !d.has_active_access && !d.enablement?.is_enabled).length

  const filtered = doctorList.filter(d => {
    // 1. Status Filter
    if (statusFilter === 'package' && !d.has_active_access) return false
    if (statusFilter === 'commission' && (d.has_active_access || !d.enablement?.is_enabled)) return false
    if (statusFilter === 'disabled' && (d.has_active_access || d.enablement?.is_enabled)) return false

    // 2. Doctor Filter
    if (doctorFilter && String(d.id) !== String(doctorFilter)) return false

    // 3. Location Filters
    if (divisionId && String(d.division_id) !== String(divisionId)) return false
    if (districtId && String(d.district_id) !== String(districtId)) return false
    if (upazilaId && String(d.upazila_id) !== String(upazilaId)) return false
    if (unionId && String(d.union_id) !== String(unionId)) return false

    // 4. Text Search
    if (search) {
      const q = search.trim().toLowerCase()
      const fields = [
        d.name,
        d.public_id,
        d.bmdc,
        d.phone,
        d.email,
        d.workplace,
        d.specialty,
        d.division_name,
        d.district_name,
        d.upazila_name,
        d.union_name
      ]
      const matches = fields.some(f => f && String(f).toLowerCase().includes(q))
      if (!matches) return false
    }

    return true
  })

  const activeFilters = [
    statusFilter && {
      key: 'status',
      label: `Status: ${statusOptions.find(s => s.id === statusFilter)?.name || statusFilter}`,
      onRemove: () => setStatusFilter('')
    },
    doctorFilter && {
      key: 'doctor',
      label: `Doctor: ${doctorList.find(d => String(d.id) === String(doctorFilter))?.name || doctorFilter}`,
      onRemove: () => setDoctorFilter('')
    },
    divisionId && {
      key: 'division',
      label: `Division: ${divisions.find(d => String(d.id) === String(divisionId))?.name || divisionId}`,
      onRemove: () => setDivisionId('')
    },
    districtId && {
      key: 'district',
      label: `District: ${districts.find(d => String(d.id) === String(districtId))?.name || districtId}`,
      onRemove: () => setDistrictId('')
    },
    upazilaId && {
      key: 'upazila',
      label: `Upazila: ${upazilas.find(u => String(u.id) === String(upazilaId))?.name || upazilaId}`,
      onRemove: () => setUpazilaId('')
    },
    unionId && {
      key: 'union',
      label: `Union: ${unions.find(u => String(u.id) === String(unionId))?.name || unionId}`,
      onRemove: () => setUnionId('')
    },
  ].filter(Boolean)

  return (
    <>
      {/* Quick Status Filter Pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
        {[
          { key: '', label: 'All Doctors', count: totalCount, icon: '👨‍⚕️' },
          { key: 'package', label: 'Package Active', count: packageCount, icon: '📦' },
          { key: 'commission', label: 'Comm % Active', count: commActiveCount, icon: '📊' },
          { key: 'disabled', label: 'Service Disabled', count: disabledCount, icon: '🚫' },
        ].map(pill => {
          const isSelected = statusFilter === pill.key
          return (
            <button
              key={pill.key}
              type="button"
              onClick={() => setStatusFilter(pill.key)}
              style={{
                border: isSelected ? '1px solid var(--admin-primary)' : '1px solid var(--admin-border)',
                background: isSelected ? 'rgba(0, 168, 140, 0.08)' : 'var(--admin-card-bg)',
                color: isSelected ? 'var(--admin-primary)' : 'var(--admin-text)',
                padding: '8px 16px',
                borderRadius: 12,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 13,
                fontWeight: isSelected ? 800 : 600,
                transition: 'all 0.2s',
                boxShadow: isSelected ? '0 2px 4px rgba(0, 168, 140, 0.12)' : 'none'
              }}
            >
              <span>{pill.icon}</span>
              <span>{pill.label}</span>
              <span style={{
                background: isSelected ? 'var(--admin-primary)' : 'var(--admin-border)',
                color: isSelected ? '#ffffff' : 'var(--admin-text-muted)',
                padding: '1px 8px',
                borderRadius: 10,
                fontSize: 11,
                fontWeight: 800
              }}>
                {pill.count}
              </span>
            </button>
          )
        })}
      </div>

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by ID, doctor name, specialty, location, workplace, phone..."
        onRefresh={() => refetch()}
        refreshing={isFetching}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(p => !p)}
        hasActiveFilters={Boolean(search || statusFilter || divisionId || districtId || upazilaId || unionId || doctorFilter)}
        onClearFilters={clearFilters}
        activeFilters={activeFilters}
      >
        <SearchableSelect
          label="STATUS"
          placeholder="All Statuses"
          options={statusOptions}
          value={statusFilter}
          onChange={setStatusFilter}
        />
        <SearchableSelect
          label="DIVISION"
          placeholder="All Divisions"
          options={[{ id: '', name: 'All Divisions' }, ...divisions]}
          value={divisionId}
          onChange={setDivisionId}
        />
        <SearchableSelect
          label="DISTRICT"
          placeholder="All Districts"
          options={[{ id: '', name: 'All Districts' }, ...districts]}
          value={districtId}
          onChange={setDistrictId}
          disabled={!divisionId}
        />
        <SearchableSelect
          label="UPAZILA"
          placeholder="All Upazilas"
          options={[{ id: '', name: 'All Upazilas' }, ...upazilas]}
          value={upazilaId}
          onChange={setUpazilaId}
          disabled={!districtId}
        />
        <SearchableSelect
          label="UNION"
          placeholder="All Unions"
          options={[{ id: '', name: 'All Unions' }, ...unions]}
          value={unionId}
          onChange={setUnionId}
          disabled={!upazilaId}
        />
        <SearchableSelect
          label="DOCTOR"
          placeholder="All Doctors"
          options={[{ id: '', name: 'All Doctors' }, ...doctorsOptions.map(d => ({ id: d.id, name: d.name, subtext: d.public_id || d.bmdc }))]}
          value={doctorFilter}
          onChange={setDoctorFilter}
        />
      </ListToolbar>

      <div className="admin-card">
        <div className="admin-card-header" style={{ background: 'var(--admin-bg)' }}>
          <h3 className="admin-card-title">Doctor Service Controls</h3>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-text-muted)', background: 'var(--admin-border)', padding: '4px 10px', borderRadius: 20 }}>
            {filtered.length} Doctors
          </span>
        </div>
        {loading ? (
          <div className="admin-loading" style={{ padding: 60 }}><div className="admin-spinner" /> Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="admin-empty" style={{ padding: 60 }}><h4 style={{ color: 'var(--admin-text)' }}>No doctors matching criteria</h4></div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ paddingLeft: 24, color: 'var(--admin-text-muted)' }}>Medical Professional</th>
                  <th style={{ color: 'var(--admin-text-muted)' }}>Location</th>
                  <th style={{ color: 'var(--admin-text-muted)' }}>Status</th>
                  <th style={{ color: 'var(--admin-text-muted)' }}>Commission Rate</th>
                  <th style={{ textAlign: 'right', paddingRight: 24, color: 'var(--admin-text-muted)' }}>Enable Service</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(doc => {
                  const en = doc.enablement || {}
                  const isSaving = saving === doc.id
                  const currentRate = editingRates[doc.id] !== undefined ? editingRates[doc.id] : (en.commission_percentage || '')
                  const isRateChanged = editingRates[doc.id] !== undefined && parseFloat(editingRates[doc.id]) !== (en.commission_percentage || 0)

                  return (
                    <tr key={doc.id} style={{ opacity: isSaving ? 0.6 : 1 }}>
                      <td style={{ paddingLeft: 24 }}>
                        <div style={{ fontWeight: 700, color: 'var(--admin-text)' }}>{doc.name}</div>
                        <div style={{ marginTop: 3 }}>
                          <CompactUlid 
                            value={doc.public_id || (doc.bmdc ? doc.bmdc : `DOC-${doc.id}`)} 
                            style={{ fontSize: 11, color: 'var(--admin-primary, #0284c7)', fontWeight: 700 }}
                          />
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', maxWidth: 300, lineHeight: 1.5 }}>
                          <div style={{ fontWeight: 600, color: 'var(--admin-text)', marginBottom: 2 }}>
                            {[doc.division_name, doc.district_name].filter(Boolean).join(' > ')}
                          </div>
                          <div>
                            {[doc.upazila_name, doc.union_name].filter(Boolean).join(', ') || 'Area N/A'}
                          </div>
                          {doc.workplace && (
                            <div style={{ fontSize: 10, color: 'var(--admin-text-muted)', fontStyle: 'italic', borderTop: '1px solid var(--admin-border)', marginTop: 4, paddingTop: 2 }}>
                              🏢 {doc.workplace}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {doc.has_active_access ? (
                            <>
                              <span style={{
                                fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 6,
                                background: 'rgba(16, 185, 129, 0.1)', color: '#059669',
                                border: '1px solid rgba(16, 185, 129, 0.25)', display: 'inline-flex', alignItems: 'center', gap: 4, width: 'fit-content'
                              }}>
                                📦 PACKAGE ACTIVE
                              </span>
                              {(doc.package_name || doc.package_expires_at) && (
                                <div style={{ fontSize: 10.5, color: '#059669', fontWeight: 600 }}>
                                  {doc.package_name} {doc.package_expires_at ? `• Till ${doc.package_expires_at}` : ''}
                                </div>
                              )}
                            </>
                          ) : en.is_enabled ? (
                            <span style={{
                              fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 6,
                              background: 'rgba(59, 130, 246, 0.1)', color: '#2563EB',
                              border: '1px solid rgba(59, 130, 246, 0.25)', display: 'inline-flex', alignItems: 'center', gap: 4, width: 'fit-content'
                            }}>
                              📊 COMMISSION ACTIVE
                            </span>
                          ) : (
                            <>
                              <span style={{
                                fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 6,
                                background: 'rgba(239, 68, 68, 0.1)', color: '#DC2626',
                                border: '1px solid rgba(239, 68, 68, 0.25)', display: 'inline-flex', alignItems: 'center', gap: 4, width: 'fit-content'
                              }}>
                                ⛔ SERVICE DISABLED
                              </span>
                              {en.notes && (
                                <div style={{ fontSize: 10, color: '#DC2626', background: 'rgba(239, 68, 68, 0.05)', padding: '2px 6px', borderRadius: 4, border: '1px dashed rgba(239, 68, 68, 0.3)', maxWidth: 220 }} title={en.notes}>
                                  ⚠️ {en.notes}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                      <td>
                        {doc.has_active_access ? (
                          <span style={{
                            fontSize: 11, fontWeight: 700, color: '#059669',
                            background: 'rgba(16, 185, 129, 0.08)', padding: '4px 10px', borderRadius: 6,
                            border: '1px solid rgba(16, 185, 129, 0.25)', display: 'inline-flex', alignItems: 'center', gap: 4
                          }}>
                            📦 Package Included
                          </span>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <input
                              type="number"
                              min="0" max="100" step="0.5"
                              value={currentRate}
                              onChange={e => setEditingRates(prev => ({ ...prev, [doc.id]: e.target.value }))}
                              onKeyDown={e => {
                                if (e.key === 'Enter') saveRate(doc.id)
                              }}
                              disabled={isSaving}
                              placeholder="0"
                              className="admin-form-input"
                              style={{ width: 68, padding: '5px 8px', fontWeight: 800, textAlign: 'center', fontSize: 13 }}
                            />
                            <span style={{ fontWeight: 700, color: 'var(--admin-text-muted)', fontSize: 13 }}>%</span>
                            {isRateChanged && (
                              <button
                                onClick={() => saveRate(doc.id)}
                                disabled={isSaving}
                                title="Save commission rate"
                                style={{
                                  border: 'none', background: '#10B981', color: 'white', borderRadius: 6,
                                  padding: '4px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                                  display: 'inline-flex', alignItems: 'center', gap: 2
                                }}
                              >
                                ✓ Save
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', paddingRight: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8 }}>
                          {doc.has_active_access ? (
                            <div
                              onClick={() => setPackageInfoTarget(doc)}
                              title="সক্রিয় প্যাকেজ দ্বারা সুরক্ষিত (বিস্তারিত দেখতে ক্লিক করুন)"
                              style={{
                                width: 44, height: 24, borderRadius: 12, padding: 2, cursor: 'pointer',
                                background: 'var(--admin-primary)',
                                display: 'flex', transition: '0.2s',
                                justifyContent: 'flex-end', opacity: 0.95,
                                boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.2)'
                              }}
                            >
                              <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                            </div>
                          ) : (
                            <div
                              onClick={() => {
                                if (isSaving) return
                                if (en.is_enabled) {
                                  setDisableTarget(doc)
                                  setDisableReason('Payment / Subscription Overdue')
                                  setCustomReason('')
                                } else {
                                  setEnableTarget(doc)
                                }
                              }}
                              title={en.is_enabled ? 'সার্ভিস বন্ধ করতে ক্লিক করুন' : 'সার্ভিস চালু করতে ক্লিক করুন'}
                              style={{
                                width: 44, height: 24, borderRadius: 12, padding: 2, cursor: isSaving ? 'not-allowed' : 'pointer',
                                background: en.is_enabled ? 'var(--admin-primary)' : 'var(--admin-border)',
                                display: 'flex', transition: '0.2s',
                                justifyContent: en.is_enabled ? 'flex-end' : 'flex-start'
                              }}
                            >
                              <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 1. Enterprise Safe Enable Confirmation Modal */}
      {enableTarget && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div style={{
            background: 'var(--admin-card-bg)', borderRadius: 20, width: '100%', maxWidth: 480,
            border: '1px solid var(--admin-border)', boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            overflow: 'hidden', animation: 'fadeIn 0.2s ease-out'
          }}>
            <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid var(--admin-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                  ✓
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: 'var(--admin-text)' }}>
                    ডাক্তারের সার্ভিস কি চালু করতে চান?
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--admin-text-muted)' }}>
                    {enableTarget.name} {enableTarget.public_id ? `(${enableTarget.public_id})` : (enableTarget.bmdc ? `(${enableTarget.bmdc})` : '')}
                  </p>
                </div>
              </div>
            </div>

            <div style={{ padding: 24 }}>
              <p style={{ fontSize: 13, color: 'var(--admin-text)', marginTop: 0, marginBottom: 16, lineHeight: 1.6 }}>
                আপনি কি নিশ্চিত যে এই ডাক্তারের সেবা চালু করতে চান? এটি সক্রিয় করলে নিচের সুবিধাগুলো অবিলম্বে চালু হবে:
              </p>

              <div style={{ background: 'var(--admin-bg)', padding: '14px 16px', borderRadius: 12, border: '1px solid var(--admin-border)', marginBottom: 16 }}>
                <div style={{ fontSize: 13, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--admin-text)' }}>
                  <span>🩺</span> <strong>অনলাইন বুকিং:</strong> রোগীরা ওয়েবসাইটে ডাক্তারের শিডিউলে সিরিয়াল দিতে পারবে।
                </div>
                <div style={{ fontSize: 13, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--admin-text)' }}>
                  <span>📋</span> <strong>চেম্বার ওয়াক-ইন:</strong> চেম্বার থেকে সরাসরি রোগী এন্ট্রি নেওয়া যাবে।
                </div>
                <div style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--admin-primary)', fontWeight: 700 }}>
                  <span>💰</span> <strong>কমিশন হার:</strong> {enableTarget.enablement?.commission_percentage || 0}% (প্রতি বুকিংয়ে প্রযোজ্য)
                </div>
              </div>
            </div>

            <div style={{ padding: '16px 24px', background: 'var(--admin-bg)', borderTop: '1px solid var(--admin-border)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="admin-btn admin-btn-outline"
                onClick={() => setEnableTarget(null)}
                style={{ padding: '8px 18px', borderRadius: 10 }}
              >
                বাতিল (Cancel)
              </button>
              <button
                type="button"
                className="admin-btn"
                style={{
                  background: 'linear-gradient(135deg, #10B981, #059669)', color: 'white',
                  border: 'none', padding: '8px 22px', borderRadius: 10, fontWeight: 700
                }}
                onClick={async () => {
                  await handleUpdate(enableTarget.id, 'is_enabled', true, 'Service enabled by admin')
                  setEnableTarget(null)
                }}
              >
                হ্যাঁ, সার্ভিস চালু করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Enterprise Safe Disable Confirmation Modal */}
      {disableTarget && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div style={{
            background: 'var(--admin-card-bg)', borderRadius: 20, width: '100%', maxWidth: 480,
            border: '1px solid var(--admin-border)', boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            overflow: 'hidden', animation: 'fadeIn 0.2s ease-out'
          }}>
            <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid var(--admin-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                  ⚠️
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: 'var(--admin-text)' }}>
                    সতর্কতা: ডাক্তারের সার্ভিস কি বন্ধ করতে চান?
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--admin-text-muted)' }}>
                    {disableTarget.name} {disableTarget.public_id ? `(${disableTarget.public_id})` : (disableTarget.bmdc ? `(${disableTarget.bmdc})` : '')}
                  </p>
                </div>
              </div>
            </div>

            <div style={{ padding: 24 }}>
              <p style={{ fontSize: 13, color: 'var(--admin-text)', marginTop: 0, marginBottom: 14, lineHeight: 1.5 }}>
                সার্ভিস বন্ধ করলে রোগীরা অনলাইনে আর সিরিয়াল দিতে পারবে না এবং চেম্বার ওয়াক-ইন এন্ট্রি বন্ধ থাকবে। তবে পূর্বের বিদ্যমান বুকিং অক্ষুণ্ণ থাকবে।
              </p>

              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                সার্ভিস বন্ধের কারণ নির্বাচন করুন:
              </label>
              <select
                value={disableReason}
                onChange={e => setDisableReason(e.target.value)}
                className="admin-form-select"
                style={{ width: '100%', height: 42, marginBottom: 12, borderRadius: 10 }}
              >
                <option value="Payment / Subscription Overdue">পেমেন্ট বা সাবস্ক্রিপশন বকেয়া (Payment Overdue)</option>
                <option value="Doctor on Leave / Inactive">ডাক্তার ছুটিতে বা চেম্বার সাময়িক বন্ধ (Doctor on Leave)</option>
                <option value="Violation of Platform Policy">প্ল্যাটফর্ম পলিসি লঙ্ঘন (Policy Violation)</option>
                <option value="Documents / Verification Incomplete">ডকুমেন্ট বা ভেরিফিকেশন অসম্পূর্ণ (Verification Incomplete)</option>
                <option value="Contract Renewal Pending">চুক্তি নবায়ন বাকি (Contract Renewal Pending)</option>
                <option value="Other Reason">অন্যান্য কারণ (নিচে বিস্তারিত লিখুন)</option>
              </select>

              {disableReason === 'Other Reason' && (
                <textarea
                  value={customReason}
                  onChange={e => setCustomReason(e.target.value)}
                  placeholder="নির্দিষ্ট কারণ বা এডমিন নোট লিখুন..."
                  rows={3}
                  className="admin-form-input"
                  style={{ width: '100%', padding: '10px', fontSize: 13, borderRadius: 10, resize: 'vertical' }}
                />
              )}
            </div>

            <div style={{ padding: '16px 24px', background: 'var(--admin-bg)', borderTop: '1px solid var(--admin-border)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="admin-btn admin-btn-outline"
                onClick={() => setDisableTarget(null)}
                style={{ padding: '8px 18px', borderRadius: 10 }}
              >
                বাতিল (Cancel)
              </button>
              <button
                type="button"
                className="admin-btn"
                style={{
                  background: 'linear-gradient(135deg, #EF4444, #DC2626)', color: 'white',
                  border: 'none', padding: '8px 20px', borderRadius: 10, fontWeight: 700
                }}
                onClick={async () => {
                  const finalNotes = disableReason === 'Other Reason' ? (customReason || 'Disabled by admin') : disableReason
                  await handleUpdate(disableTarget.id, 'is_enabled', false, finalNotes)
                  setDisableTarget(null)
                }}
              >
                হ্যাঁ, নিশ্চিতভাবে বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Package Protection Information Modal */}
      {packageInfoTarget && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div style={{
            background: 'var(--admin-card-bg)', borderRadius: 20, width: '100%', maxWidth: 490,
            border: '1px solid var(--admin-border)', boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            overflow: 'hidden', animation: 'fadeIn 0.2s ease-out'
          }}>
            <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid var(--admin-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(99, 102, 241, 0.1)', color: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                  🔒
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: 'var(--admin-text)' }}>
                    সক্রিয় প্যাকেজ সুরক্ষা (Active Package)
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--admin-text-muted)' }}>
                    {packageInfoTarget.name} {packageInfoTarget.public_id ? `(${packageInfoTarget.public_id})` : (packageInfoTarget.bmdc ? `(${packageInfoTarget.bmdc})` : '')}
                  </p>
                </div>
              </div>
            </div>

            <div style={{ padding: 24 }}>
              <div style={{ background: 'var(--admin-bg)', padding: '14px 16px', borderRadius: 12, border: '1px solid var(--admin-border)', marginBottom: 16 }}>
                <div style={{ fontSize: 13, marginBottom: 8, color: 'var(--admin-text)' }}>
                  📦 <strong>প্যাকেজের নাম:</strong> <span style={{ color: 'var(--admin-primary)', fontWeight: 700 }}>{packageInfoTarget.active_package_name || 'পেইড সাবস্ক্রিপশন প্ল্যান'}</span>
                </div>
                {packageInfoTarget.active_package_end_date && (
                  <div style={{ fontSize: 13, marginBottom: 8, color: 'var(--admin-text)' }}>
                    📅 <strong>মেয়াদ:</strong> <strong>{packageInfoTarget.active_package_end_date}</strong> পর্যন্ত সক্রিয়
                  </div>
                )}
                <div style={{ fontSize: 13, color: '#059669', fontWeight: 700 }}>
                  ⚡ <strong>সুবিধা:</strong> ০% প্ল্যাটফর্ম কমিশন ও সমস্ত প্রিমিয়াম ফিচার আনলকড
                </div>
              </div>

              <p style={{ fontSize: 13, color: 'var(--admin-text)', margin: '0 0 12px', lineHeight: 1.6 }}>
                <strong>কেন এই সুইচটি বন্ধ করা যাচ্ছে না?</strong><br />
                যেহেতু ডাক্তার একটি পেইড সাবস্ক্রিপশন প্যাকেজের চুক্তিতে আছেন, তাই কমিশন কন্ট্রোল থেকে সরাসরি তার সার্ভিস বন্ধ করা সুরক্ষিতভাবে লক রাখা হয়েছে।
              </p>
              <p style={{ fontSize: 12, color: 'var(--admin-text-muted)', margin: 0, lineHeight: 1.5 }}>
                আপনি যদি এই ডাক্তারের সেবা বন্ধ বা স্থগিত করতে চান, তবে অনুগ্রহ করে <strong>Subscription Management</strong> থেকে তার প্যাকেজটি বাতিল বা পজ করুন।
              </p>
            </div>

            <div style={{ padding: '16px 24px', background: 'var(--admin-bg)', borderTop: '1px solid var(--admin-border)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="admin-btn admin-btn-outline"
                onClick={() => setPackageInfoTarget(null)}
                style={{ padding: '8px 18px', borderRadius: 10 }}
              >
                ঠিক আছে, বুঝলাম
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-primary"
                onClick={() => {
                  setPackageInfoTarget(null)
                  navigate('/admin/billing/subscribers')
                }}
                style={{ padding: '8px 20px', borderRadius: 10, fontWeight: 700 }}
              >
                ⚡ সাবস্ক্রিপশন ম্যানেজ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function HospitalCommissionTab() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [hospitalsOptions, setHospitalsOptions] = useState([])
  const [saving, setSaving] = useState(null)
  const [enableTarget, setEnableTarget] = useState(null)
  const [disableTarget, setDisableTarget] = useState(null)
  const [packageInfoTarget, setPackageInfoTarget] = useState(null)
  const [disableReason, setDisableReason] = useState('Payment / Commission Overdue')
  const [customReason, setCustomReason] = useState('')
  const [editingRates, setEditingRates] = useState({})
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [hospitalFilter, setHospitalFilter] = useState('')
  const [divisionId, setDivisionId] = useState('')
  const [districtId, setDistrictId] = useState('')
  const [upazilaId, setUpazilaId] = useState('')
  const [unionId, setUnionId] = useState('')
  const [divisions, setDivisions] = useState([])
  const [districts, setDistricts] = useState([])
  const [upazilas, setUpazilas] = useState([])
  const [unions, setUnions] = useState([])

  const { data: hospitalsData = [], isLoading: loading, isFetching, refetch } = useQuery({
    queryKey: queryKeys.commissions.hospitalCommissions(),
    queryFn: async () => {
      const res = await getHospitalCommissions({ per_page: 500 })
      const raw = res.data?.data
      return Array.isArray(raw?.data) ? raw.data : (Array.isArray(raw) ? raw : [])
    },
    staleTime: 60 * 1000,
  })

  useEffect(() => { 
    loadOptions()
    loadInitialLocations()
  }, [])

  const loadInitialLocations = async () => {
    try {
      const res = await getDivisions()
      setDivisions(res.data?.data || [])
    } catch (err) { console.error(err) }
  }

  useEffect(() => {
    if (divisionId) {
      getDistricts({ division_id: divisionId }).then(res => setDistricts(res.data?.data || []))
    } else {
      setDistricts([]); setDistrictId(''); setUpazilas([]); setUpazilaId(''); setUnions([]); setUnionId('')
    }
  }, [divisionId])

  useEffect(() => {
    if (districtId) {
      getUpazilas({ district_id: districtId }).then(res => setUpazilas(res.data?.data || []))
    } else {
      setUpazilas([]); setUpazilaId(''); setUnions([]); setUnionId('')
    }
  }, [districtId])

  useEffect(() => {
    if (upazilaId) {
      getUnions({ upazila_id: upazilaId }).then(res => setUnions(res.data?.data || []))
    } else {
      setUnions([]); setUnionId('')
    }
  }, [upazilaId])

  const loadOptions = async () => {
    try {
      const params = { per_page: 500, is_active: 1 }
      if (divisionId) params.division_id = divisionId
      if (districtId) params.district_id = districtId
      if (upazilaId) params.upazila_id = upazilaId
      if (unionId) params.union_id = unionId
      const res = await getHospitals(params)
      setHospitalsOptions(res.data?.data?.data || res.data?.data || [])
    } catch (err) { console.error(err) }
  }

  useEffect(() => { loadOptions() }, [divisionId, districtId, upazilaId, unionId])

  const handleUpdate = async (hospitalId, field, value, customNotes = null) => {
    const hospital = (Array.isArray(hospitalsData) ? hospitalsData : []).find(h => h.id === hospitalId)
    const current = hospital?.commission || {}
    const payload = {
      commission_percentage: current.commission_percentage || 0,
      is_enabled: current.is_enabled || false,
      notes: customNotes !== null ? customNotes : (current.notes || ''),
      ...{ [field]: value }
    }
    setSaving(hospitalId)
    try {
      await updateHospitalCommission(hospitalId, payload)
      toast.success(
        field === 'is_enabled'
          ? (value ? 'Hospital service enabled successfully.' : 'Hospital service disabled safely.')
          : 'Hospital commission updated.'
      )
      queryClient.invalidateQueries({ queryKey: queryKeys.commissions.all })
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update hospital settings.'))
    } finally {
      setSaving(null)
    }
  }

  const saveRate = (hospitalId) => {
    const val = parseFloat(editingRates[hospitalId])
    if (isNaN(val) || val < 0 || val > 100) {
      toast.error('Commission rate must be between 0% and 100%')
      return
    }
    handleUpdate(hospitalId, 'commission_percentage', val)
    setEditingRates(prev => {
      const next = { ...prev }
      delete next[hospitalId]
      return next
    })
  }

  const statusOptions = [
    { id: '', name: 'All Statuses' },
    { id: 'package', name: '📦 Package Active' },
    { id: 'commission', name: '📊 Commission Active' },
    { id: 'disabled', name: '⛔ Service Disabled' },
  ]

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('')
    setHospitalFilter('')
    setDivisionId('')
    setDistrictId('')
    setUpazilaId('')
    setUnionId('')
  }

  const hospitalList = Array.isArray(hospitalsData) ? hospitalsData : []
  const totalCount = hospitalList.length
  const packageCount = hospitalList.filter(h => h.has_active_subscription).length
  const commActiveCount = hospitalList.filter(h => !h.has_active_subscription && h.commission?.is_enabled).length
  const disabledCount = hospitalList.filter(h => !h.has_active_subscription && !h.commission?.is_enabled).length

  const filtered = hospitalList.filter(h => {
    // 1. Status Filter
    if (statusFilter === 'package' && !h.has_active_subscription) return false
    if (statusFilter === 'commission' && (h.has_active_subscription || !h.commission?.is_enabled)) return false
    if (statusFilter === 'disabled' && (h.has_active_subscription || h.commission?.is_enabled)) return false

    // 2. Hospital Filter
    if (hospitalFilter && String(h.id) !== String(hospitalFilter)) return false

    // 3. Location Filters
    if (divisionId && String(h.division_id) !== String(divisionId)) return false
    if (districtId && String(h.district_id) !== String(districtId)) return false
    if (upazilaId && String(h.upazila_id) !== String(upazilaId)) return false
    if (unionId && String(h.union_id) !== String(unionId)) return false

    // 4. Text Search
    if (search) {
      const q = search.trim().toLowerCase()
      const fields = [
        h.name,
        h.public_id,
        h.phone,
        h.email,
        h.address,
        h.subscription_plan,
        h.division_name,
        h.district_name,
        h.upazila_name,
        h.union_name
      ]
      const matches = fields.some(f => f && String(f).toLowerCase().includes(q))
      if (!matches) return false
    }

    return true
  })

  const activeFilters = [
    statusFilter && {
      key: 'status',
      label: `Status: ${statusOptions.find(s => s.id === statusFilter)?.name || statusFilter}`,
      onRemove: () => setStatusFilter('')
    },
    hospitalFilter && {
      key: 'hospital',
      label: `Hospital: ${hospitalList.find(h => String(h.id) === String(hospitalFilter))?.name || hospitalFilter}`,
      onRemove: () => setHospitalFilter('')
    },
    divisionId && {
      key: 'division',
      label: `Division: ${divisions.find(d => String(d.id) === String(divisionId))?.name || divisionId}`,
      onRemove: () => setDivisionId('')
    },
    districtId && {
      key: 'district',
      label: `District: ${districts.find(d => String(d.id) === String(districtId))?.name || districtId}`,
      onRemove: () => setDistrictId('')
    },
    upazilaId && {
      key: 'upazila',
      label: `Upazila: ${upazilas.find(u => String(u.id) === String(upazilaId))?.name || upazilaId}`,
      onRemove: () => setUpazilaId('')
    },
    unionId && {
      key: 'union',
      label: `Union: ${unions.find(u => String(u.id) === String(unionId))?.name || unionId}`,
      onRemove: () => setUnionId('')
    },
  ].filter(Boolean)

  return (
    <>
      {/* Quick Status Filter Pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
        {[
          { key: '', label: 'All Facilities', count: totalCount, icon: '🏥' },
          { key: 'package', label: 'Package Active', count: packageCount, icon: '📦' },
          { key: 'commission', label: 'Comm % Active', count: commActiveCount, icon: '📊' },
          { key: 'disabled', label: 'Service Disabled', count: disabledCount, icon: '🚫' },
        ].map(pill => {
          const isSelected = statusFilter === pill.key
          return (
            <button
              key={pill.key}
              type="button"
              onClick={() => setStatusFilter(pill.key)}
              style={{
                border: isSelected ? '1px solid var(--admin-primary)' : '1px solid var(--admin-border)',
                background: isSelected ? 'rgba(0, 168, 140, 0.08)' : 'var(--admin-card-bg)',
                color: isSelected ? 'var(--admin-primary)' : 'var(--admin-text)',
                padding: '8px 16px',
                borderRadius: 12,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 13,
                fontWeight: isSelected ? 800 : 600,
                transition: 'all 0.2s',
                boxShadow: isSelected ? '0 2px 4px rgba(0, 168, 140, 0.12)' : 'none'
              }}
            >
              <span>{pill.icon}</span>
              <span>{pill.label}</span>
              <span style={{
                background: isSelected ? 'var(--admin-primary)' : 'var(--admin-border)',
                color: isSelected ? '#ffffff' : 'var(--admin-text-muted)',
                padding: '1px 8px',
                borderRadius: 10,
                fontSize: 11,
                fontWeight: 800
              }}>
                {pill.count}
              </span>
            </button>
          )
        })}
      </div>

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by ID, facility name, address, location, phone..."
        onRefresh={() => refetch()}
        refreshing={isFetching}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(p => !p)}
        hasActiveFilters={Boolean(search || statusFilter || divisionId || districtId || upazilaId || unionId || hospitalFilter)}
        onClearFilters={clearFilters}
        activeFilters={activeFilters}
      >
        <SearchableSelect
          label="STATUS"
          placeholder="All Statuses"
          options={statusOptions}
          value={statusFilter}
          onChange={setStatusFilter}
        />
        <SearchableSelect
          label="DIVISION"
          placeholder="All Divisions"
          options={[{ id: '', name: 'All Divisions' }, ...divisions]}
          value={divisionId}
          onChange={setDivisionId}
        />
        <SearchableSelect
          label="DISTRICT"
          placeholder="All Districts"
          options={[{ id: '', name: 'All Districts' }, ...districts]}
          value={districtId}
          onChange={setDistrictId}
          disabled={!divisionId}
        />
        <SearchableSelect
          label="UPAZILA"
          placeholder="All Upazilas"
          options={[{ id: '', name: 'All Upazilas' }, ...upazilas]}
          value={upazilaId}
          onChange={setUpazilaId}
          disabled={!districtId}
        />
        <SearchableSelect
          label="UNION"
          placeholder="All Unions"
          options={[{ id: '', name: 'All Unions' }, ...unions]}
          value={unionId}
          onChange={setUnionId}
          disabled={!upazilaId}
        />
        <SearchableSelect
          label="HOSPITAL"
          placeholder="All Facilities"
          options={[{ id: '', name: 'All Facilities' }, ...hospitalsOptions.map(h => ({ id: h.id, name: h.name, subtext: h.public_id }))]}
          value={hospitalFilter}
          onChange={setHospitalFilter}
        />
      </ListToolbar>
      <div className="admin-card">
        <div className="admin-card-header" style={{ background: 'var(--admin-bg)' }}>
          <h3 className="admin-card-title">Hospital Service Access</h3>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-text-muted)', background: 'var(--admin-border)', padding: '4px 10px', borderRadius: 20 }}>
            {filtered.length} Facilities
          </span>
        </div>
        {loading ? (
          <div className="admin-loading" style={{ padding: 60 }}><div className="admin-spinner" /> Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="admin-empty" style={{ padding: 60 }}><h4 style={{ color: 'var(--admin-text)' }}>No hospitals matching filters</h4></div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ paddingLeft: 24, color: 'var(--admin-text-muted)' }}>Facility Name</th>
                  <th style={{ color: 'var(--admin-text-muted)' }}>Location Profile</th>
                  <th style={{ color: 'var(--admin-text-muted)' }}>Access Status</th>
                  <th style={{ color: 'var(--admin-text-muted)' }}>Commission Rate</th>
                  <th style={{ textAlign: 'right', paddingRight: 24, color: 'var(--admin-text-muted)' }}>Service Switch</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(h => {
                  const comm = h.commission || {}
                  const isSaving = saving === h.id
                  const currentRate = editingRates[h.id] !== undefined ? editingRates[h.id] : (comm.commission_percentage || '')
                  const isRateChanged = editingRates[h.id] !== undefined && parseFloat(editingRates[h.id]) !== (comm.commission_percentage || 0)
                  return (
                    <tr key={h.id} style={{ opacity: isSaving ? 0.6 : 1 }}>
                      <td style={{ paddingLeft: 24 }}>
                        <div style={{ fontWeight: 700, color: 'var(--admin-text)' }}>{h.name}</div>
                        <div style={{ marginTop: 3 }}>
                          <CompactUlid 
                            value={h.public_id || (h.email ? h.email : `HOSP-${h.id}`)} 
                            style={{ fontSize: 11, color: 'var(--admin-primary, #0284c7)', fontWeight: 700 }}
                          />
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', maxWidth: 300, lineHeight: 1.5 }}>
                          <div style={{ fontWeight: 600, color: 'var(--admin-text)', marginBottom: 2 }}>
                            {[h.division_name, h.district_name].filter(Boolean).join(' > ')}
                          </div>
                          <div style={{ marginBottom: 2 }}>
                            {[h.upazila_name, h.union_name].filter(Boolean).join(', ') || 'Area N/A'}
                          </div>
                          {h.address && (
                            <div style={{ fontSize: 10, color: 'var(--admin-text-muted)', fontStyle: 'italic', borderTop: '1px solid var(--admin-border)', marginTop: 4, paddingTop: 2 }}>
                              📍 {h.address}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {h.has_active_subscription ? (
                            <>
                              <span style={{
                                fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 6,
                                background: 'rgba(16, 185, 129, 0.1)', color: '#059669',
                                border: '1px solid rgba(16, 185, 129, 0.25)', display: 'inline-flex', alignItems: 'center', gap: 4, width: 'fit-content'
                              }}>
                                📦 PACKAGE ACTIVE
                              </span>
                              {(h.subscription_plan || h.package_expires_at) && (
                                <div style={{ fontSize: 10.5, color: '#059669', fontWeight: 600 }}>
                                  {h.subscription_plan} {h.package_expires_at ? `• Till ${h.package_expires_at}` : ''}
                                </div>
                              )}
                            </>
                          ) : comm.is_enabled ? (
                            <span style={{
                              fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 6,
                              background: 'rgba(59, 130, 246, 0.1)', color: '#2563EB',
                              border: '1px solid rgba(59, 130, 246, 0.25)', display: 'inline-flex', alignItems: 'center', gap: 4, width: 'fit-content'
                            }}>
                              📊 COMMISSION ACTIVE
                            </span>
                          ) : (
                            <>
                              <span style={{
                                fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 6,
                                background: 'rgba(239, 68, 68, 0.1)', color: '#DC2626',
                                border: '1px solid rgba(239, 68, 68, 0.25)', display: 'inline-flex', alignItems: 'center', gap: 4, width: 'fit-content'
                              }}>
                                ⛔ SERVICE DISABLED
                              </span>
                              {comm.notes && !comm.notes.startsWith('Auto-enabled') && (
                                <div style={{ fontSize: 10, color: '#DC2626', background: 'rgba(239, 68, 68, 0.05)', padding: '2px 6px', borderRadius: 4, border: '1px dashed rgba(239, 68, 68, 0.3)', maxWidth: 220 }} title={comm.notes}>
                                  ⚠️ {comm.notes}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                      <td>
                        {h.has_active_subscription ? (
                          <span style={{
                            fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 8,
                            background: 'rgba(16, 185, 129, 0.08)', color: '#059669',
                            border: '1px solid rgba(16, 185, 129, 0.25)',
                            display: 'inline-flex', alignItems: 'center', gap: 4
                          }}>
                            📦 Package Included
                          </span>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <input
                              type="number"
                              min="0" max="100" step="0.5"
                              value={currentRate}
                              onChange={e => setEditingRates(prev => ({ ...prev, [h.id]: e.target.value }))}
                              onKeyDown={e => {
                                if (e.key === 'Enter') saveRate(h.id)
                              }}
                              disabled={isSaving}
                              placeholder="0"
                              className="admin-form-input"
                              style={{ width: 68, padding: '5px 8px', fontWeight: 800, textAlign: 'center', fontSize: 13 }}
                            />
                            <span style={{ fontWeight: 700, color: 'var(--admin-text-muted)', fontSize: 13 }}>%</span>
                            {isRateChanged && (
                              <button
                                onClick={() => saveRate(h.id)}
                                disabled={isSaving}
                                title="Save commission rate"
                                style={{
                                  border: 'none', background: '#10B981', color: 'white', borderRadius: 6,
                                  padding: '4px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                                  display: 'inline-flex', alignItems: 'center', gap: 2
                                }}
                              >
                                ✓ Save
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', paddingRight: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8 }}>
                          {h.has_active_subscription ? (
                            <div
                              onClick={() => setPackageInfoTarget(h)}
                              title="সক্রিয় প্যাকেজ দ্বারা সুরক্ষিত (বিস্তারিত দেখতে ক্লিক করুন)"
                              style={{
                                width: 44, height: 24, borderRadius: 12, padding: 2, cursor: 'pointer',
                                background: 'var(--admin-primary)',
                                display: 'flex', transition: '0.2s',
                                justifyContent: 'flex-end', opacity: 0.95,
                                boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.2)'
                              }}
                            >
                              <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                            </div>
                          ) : (
                            <div
                              onClick={() => {
                                if (isSaving) return
                                if (comm.is_enabled) {
                                  setDisableTarget(h)
                                  setDisableReason('Payment / Commission Overdue')
                                  setCustomReason('')
                                } else {
                                  setEnableTarget(h)
                                }
                              }}
                              title={comm.is_enabled ? 'সার্ভিস বন্ধ করতে ক্লিক করুন' : 'সার্ভিস চালু করতে ক্লিক করুন'}
                              style={{
                                width: 44, height: 24, borderRadius: 12, padding: 2, cursor: isSaving ? 'not-allowed' : 'pointer',
                                background: comm.is_enabled ? 'var(--admin-primary)' : 'var(--admin-border)',
                                display: 'flex', transition: '0.2s',
                                justifyContent: comm.is_enabled ? 'flex-end' : 'flex-start'
                              }}
                            >
                              <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 1. Hospital Safe Enable Confirmation Modal */}
      {enableTarget && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div style={{
            background: 'var(--admin-card-bg)', borderRadius: 20, width: '100%', maxWidth: 480,
            border: '1px solid var(--admin-border)', boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            overflow: 'hidden', animation: 'fadeIn 0.2s ease-out'
          }}>
            <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid var(--admin-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                  ✓
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: 'var(--admin-text)' }}>
                    হাসপাতালের সার্ভিস কি চালু করতে চান?
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--admin-text-muted)' }}>
                    {enableTarget.name} {enableTarget.public_id ? `(${enableTarget.public_id})` : ''}
                  </p>
                </div>
              </div>
            </div>

            <div style={{ padding: 24 }}>
              <p style={{ fontSize: 13, color: 'var(--admin-text)', marginTop: 0, marginBottom: 16, lineHeight: 1.6 }}>
                আপনি কি নিশ্চিত যে এই হাসপাতালের ডিজিটাল সার্ভিস চালু করতে চান? এটি চালু করলে নিচের সুবিধাসমূহ অবিলম্বে সক্রিয় হবে:
              </p>

              <div style={{ background: 'var(--admin-bg)', padding: '14px 16px', borderRadius: 12, border: '1px solid var(--admin-border)', marginBottom: 16 }}>
                <div style={{ fontSize: 13, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--admin-text)' }}>
                  <span>🏥</span> <strong>কাউন্টার বুকিং:</strong> হাসপাতাল ম্যানেজার ও রিসেপশন কাউন্টার থেকে সিরিয়াল দিতে পারবে।
                </div>
                <div style={{ fontSize: 13, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--admin-text)' }}>
                  <span>👨‍⚕️</span> <strong>ডাক্তার সিট সুবিধা:</strong> হাসপাতালে চেম্বার করা ডাক্তারদের অ্যাপয়েন্টমেন্ট সচল থাকবে।
                </div>
                <div style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--admin-primary)', fontWeight: 700 }}>
                  <span>💰</span> <strong>কমিশন হার:</strong> {enableTarget.commission?.commission_percentage || 0}% (হাসপাতাল পরিশোধ করবে)
                </div>
              </div>
            </div>

            <div style={{ padding: '16px 24px', background: 'var(--admin-bg)', borderTop: '1px solid var(--admin-border)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="admin-btn admin-btn-outline"
                onClick={() => setEnableTarget(null)}
                style={{ padding: '8px 18px', borderRadius: 10 }}
              >
                বাতিল (Cancel)
              </button>
              <button
                type="button"
                className="admin-btn"
                style={{
                  background: 'linear-gradient(135deg, #10B981, #059669)', color: 'white',
                  border: 'none', padding: '8px 22px', borderRadius: 10, fontWeight: 700
                }}
                onClick={async () => {
                  await handleUpdate(enableTarget.id, 'is_enabled', true, 'Service enabled by admin')
                  setEnableTarget(null)
                }}
              >
                হ্যাঁ, সার্ভিস চালু করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Hospital Safe Disable Confirmation Modal */}
      {disableTarget && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div style={{
            background: 'var(--admin-card-bg)', borderRadius: 20, width: '100%', maxWidth: 480,
            border: '1px solid var(--admin-border)', boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            overflow: 'hidden', animation: 'fadeIn 0.2s ease-out'
          }}>
            <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid var(--admin-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                  ⚠️
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: 'var(--admin-text)' }}>
                    সতর্কতা: হাসপাতালের সার্ভিস কি বন্ধ করতে চান?
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--admin-text-muted)' }}>
                    {disableTarget.name} {disableTarget.public_id ? `(${disableTarget.public_id})` : ''}
                  </p>
                </div>
              </div>
            </div>

            <div style={{ padding: 24 }}>
              <p style={{ fontSize: 13, color: 'var(--admin-text)', marginTop: 0, marginBottom: 14, lineHeight: 1.5 }}>
                সার্ভিস বন্ধ করলে হাসপাতালের সমস্ত কাউন্টার সিরিয়াল টিকিট ও ডিজিটাল বুকিং সেবা সাময়িকভাবে স্থগিত থাকবে।
              </p>

              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                সার্ভিস বন্ধের কারণ নির্বাচন করুন:
              </label>
              <select
                value={disableReason}
                onChange={e => setDisableReason(e.target.value)}
                className="admin-form-select"
                style={{ width: '100%', height: 42, marginBottom: 12, borderRadius: 10 }}
              >
                <option value="Payment / Commission Overdue">কমিশন বা সাবস্ক্রিপশন বকেয়া (Commission Overdue)</option>
                <option value="Temporary Facility Maintenance">হাসপাতাল রক্ষণাবেক্ষণ / সাময়িক বন্ধ (Maintenance)</option>
                <option value="Contract Renewal Pending">চুক্তি নবায়ন বাকি (Contract Renewal Pending)</option>
                <option value="Violation of Platform Policy">প্ল্যাটফর্ম পলিসি লঙ্ঘন (Policy Violation)</option>
                <option value="Other Reason">অন্যান্য কারণ (নিচে বিস্তারিত লিখুন)</option>
              </select>

              {disableReason === 'Other Reason' && (
                <textarea
                  value={customReason}
                  onChange={e => setCustomReason(e.target.value)}
                  placeholder="নির্দিষ্ট কারণ বা এডমিন নোট লিখুন..."
                  rows={3}
                  className="admin-form-input"
                  style={{ width: '100%', padding: '10px', fontSize: 13, borderRadius: 10, resize: 'vertical' }}
                />
              )}
            </div>

            <div style={{ padding: '16px 24px', background: 'var(--admin-bg)', borderTop: '1px solid var(--admin-border)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="admin-btn admin-btn-outline"
                onClick={() => setDisableTarget(null)}
                style={{ padding: '8px 18px', borderRadius: 10 }}
              >
                বাতিল (Cancel)
              </button>
              <button
                type="button"
                className="admin-btn"
                style={{
                  background: 'linear-gradient(135deg, #EF4444, #DC2626)', color: 'white',
                  border: 'none', padding: '8px 20px', borderRadius: 10, fontWeight: 700
                }}
                onClick={async () => {
                  const finalNotes = disableReason === 'Other Reason' ? (customReason || 'Disabled by admin') : disableReason
                  await handleUpdate(disableTarget.id, 'is_enabled', false, finalNotes)
                  setDisableTarget(null)
                }}
              >
                হ্যাঁ, নিশ্চিতভাবে বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Hospital Package Protection Information Modal */}
      {packageInfoTarget && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div style={{
            background: 'var(--admin-card-bg)', borderRadius: 20, width: '100%', maxWidth: 490,
            border: '1px solid var(--admin-border)', boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            overflow: 'hidden', animation: 'fadeIn 0.2s ease-out'
          }}>
            <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid var(--admin-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(99, 102, 241, 0.1)', color: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                  🔒
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: 'var(--admin-text)' }}>
                    সক্রিয় প্যাকেজ সুরক্ষা (Active Hospital Package)
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--admin-text-muted)' }}>
                    {packageInfoTarget.name} {packageInfoTarget.public_id ? `(${packageInfoTarget.public_id})` : ''}
                  </p>
                </div>
              </div>
            </div>

            <div style={{ padding: 24 }}>
              <div style={{ background: 'var(--admin-bg)', padding: '14px 16px', borderRadius: 12, border: '1px solid var(--admin-border)', marginBottom: 16 }}>
                <div style={{ fontSize: 13, marginBottom: 8, color: 'var(--admin-text)' }}>
                  📦 <strong>প্যাকেজের নাম:</strong> <span style={{ color: 'var(--admin-primary)', fontWeight: 700 }}>{packageInfoTarget.subscription_plan || 'হাসপাতাল এন্টারপ্রাইজ প্যাকেজ'}</span>
                </div>
                <div style={{ fontSize: 13, color: '#059669', fontWeight: 700 }}>
                  ⚡ <strong>সুবিধা:</strong> ০% প্ল্যাটফর্ম কমিশন ও সমস্ত কাউন্টার বুকিং আনলকড
                </div>
              </div>

              <p style={{ fontSize: 13, color: 'var(--admin-text)', margin: '0 0 12px', lineHeight: 1.6 }}>
                <strong>কেন এই সুইচটি বন্ধ করা যাচ্ছে না?</strong><br />
                যেহেতু এই হাসপাতালটি একটি পেইড এন্টারপ্রাইজ সাবস্ক্রিপশন প্ল্যানে আছে, তাই কমিশন প্যানেল থেকে এর ডিজিটাল সার্ভিস সরাসরি বন্ধ করা যাবে না।
              </p>
              <p style={{ fontSize: 12, color: 'var(--admin-text-muted)', margin: 0, lineHeight: 1.5 }}>
                আপনি যদি এই হাসপাতালের সেবা বন্ধ করতে চান, তবে অনুগ্রহ করে <strong>Subscription Management</strong> থেকে তাদের প্যাকেজটি বাতিল বা স্থগিত করুন।
              </p>
            </div>

            <div style={{ padding: '16px 24px', background: 'var(--admin-bg)', borderTop: '1px solid var(--admin-border)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="admin-btn admin-btn-outline"
                onClick={() => setPackageInfoTarget(null)}
                style={{ padding: '8px 18px', borderRadius: 10 }}
              >
                ঠিক আছে, বুঝলাম
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-primary"
                onClick={() => {
                  setPackageInfoTarget(null)
                  navigate('/admin/billing/subscribers')
                }}
                style={{ padding: '8px 20px', borderRadius: 10, fontWeight: 700 }}
              >
                ⚡ সাবস্ক্রিপশন ম্যানেজ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function PatientBookingTab() {
  const queryClient = useQueryClient()
  const [saving, setSaving] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [sampleFee, setSampleFee] = useState(500)
  const [form, setForm] = useState({
    commission_percent: 10,
    apply_to_patient_booking: true,
    apply_to_manager_booking: true,
    waive_if_doctor_subscribed: true,
  })

  const { data: settings = null, isLoading: loading } = useQuery({
    queryKey: queryKeys.commissions.patientBookingCommission(),
    queryFn: async () => {
      const res = await getPatientBookingCommission()
      return res.data?.data || {}
    },
    staleTime: 60 * 1000,
  })

  useEffect(() => {
    if (settings) {
      setForm({
        commission_percent: settings.commission_percent ?? 10,
        apply_to_patient_booking: settings.apply_to_patient_booking ?? true,
        apply_to_manager_booking: settings.apply_to_manager_booking ?? true,
        waive_if_doctor_subscribed: settings.waive_if_doctor_subscribed ?? true,
      })
    }
  }, [settings])

  const handleConfirmSave = async () => {
    setSaving(true)
    try {
      await updatePatientBookingCommission(form)
      toast.success('Booking commission rules saved successfully.')
      queryClient.invalidateQueries({ queryKey: queryKeys.commissions.all })
      setShowConfirmModal(false)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to save booking rules.'))
    } finally {
      setSaving(false)
    }
  }

  const rate = Math.max(0, Math.min(100, parseFloat(form.commission_percent) || 0))
  const prevRate = settings?.commission_percent ?? 10
  const simFee = Math.max(0, parseFloat(sampleFee) || 0)
  const simCommission = Math.round((simFee * rate) / 100)
  const simDoctorPayout = Math.max(0, simFee - simCommission)

  const quickPresets = [
    { label: '5% Promo', value: 5 },
    { label: '10% Standard', value: 10 },
    { label: '15% Recommended', value: 15 },
    { label: '20% Premium', value: 20 },
  ]

  if (loading) {
    return (
      <div className="admin-loading" style={{ padding: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div className="admin-spinner" />
        <span style={{ color: 'var(--admin-text-muted)', fontSize: 13, fontWeight: 600 }}>Loading commission settings...</span>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* ── Top Hero Header Card ── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.08) 0%, rgba(99, 102, 241, 0.08) 50%, rgba(16, 185, 129, 0.06) 100%)',
        border: '1px solid var(--admin-border)',
        borderRadius: 20,
        padding: '24px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 52,
            height: 52,
            borderRadius: 16,
            background: 'linear-gradient(135deg, var(--admin-primary), #6366F1)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            boxShadow: '0 8px 16px rgba(99, 102, 241, 0.25)'
          }}>
            🌐
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h3 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: 'var(--admin-text)' }}>
                Online & Counter Booking Commission
              </h3>
              <span style={{
                fontSize: 11,
                fontWeight: 700,
                padding: '3px 9px',
                borderRadius: 20,
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#059669',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
                Global Rules Active
              </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--admin-text-muted)' }}>
              Set platform revenue percentages and fee-waiver exemptions applied across all appointment channels
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            className="admin-btn admin-btn-outline"
            onClick={() => setForm(prev => ({ ...prev, commission_percent: 10 }))}
            style={{ height: 42, padding: '0 16px', borderRadius: 12, fontSize: 13, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}
            title="Reset commission to standard 10%"
          >
            <RotateCcw size={14} /> Reset 10%
          </button>
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            onClick={() => setShowConfirmModal(true)}
            disabled={saving}
            style={{
              height: 42,
              padding: '0 24px',
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 800,
              background: 'linear-gradient(135deg, var(--admin-primary), #059669)',
              border: 'none',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer'
            }}
          >
            {saving ? (
              <>
                <div className="admin-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <span>💾</span>
                <span>Save Rules</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── 2-Column Responsive Layout ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: 24,
        alignItems: 'start'
      }}>
        {/* ── Left Column: Controls & Configuration ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Rate Card */}
          <div className="admin-card" style={{ padding: 24, borderRadius: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Base Commission Rate
                </label>
                <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--admin-text)', marginTop: 2 }}>
                  Default Platform Revenue Percentage
                </div>
              </div>
              <span style={{
                fontSize: 18, fontWeight: 900, color: 'var(--admin-primary)',
                background: 'rgba(0, 168, 140, 0.1)', padding: '4px 12px', borderRadius: 10
              }}>
                {form.commission_percent}%
              </span>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              background: 'var(--admin-bg)',
              padding: '16px 20px',
              borderRadius: 16,
              border: '1px solid var(--admin-border)'
            }}>
              <div style={{ position: 'relative', width: 140 }}>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={form.commission_percent}
                  onChange={e => setForm({ ...form, commission_percent: parseFloat(e.target.value) || 0 })}
                  className="admin-form-input"
                  style={{
                    width: '100%',
                    height: 52,
                    fontSize: 24,
                    fontWeight: 900,
                    textAlign: 'center',
                    paddingRight: 32,
                    borderRadius: 12,
                    border: '1.5px solid var(--admin-border)',
                    color: 'var(--admin-primary)',
                    background: 'var(--admin-card-bg)'
                  }}
                />
                <span style={{
                  position: 'absolute',
                  right: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: 20,
                  fontWeight: 900,
                  color: 'var(--admin-text-muted)',
                  pointerEvents: 'none'
                }}>
                  %
                </span>
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-text-muted)', marginBottom: 6 }}>
                  Quick Preset Rates:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {quickPresets.map(preset => {
                    const isSelected = parseFloat(form.commission_percent) === preset.value
                    return (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => setForm({ ...form, commission_percent: preset.value })}
                        style={{
                          padding: '5px 10px',
                          borderRadius: 8,
                          border: isSelected ? '1px solid var(--admin-primary)' : '1px solid var(--admin-border)',
                          background: isSelected ? 'var(--admin-primary)' : 'var(--admin-card-bg)',
                          color: isSelected ? 'white' : 'var(--admin-text)',
                          fontSize: 11.5,
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                      >
                        {preset.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              marginTop: 14,
              fontSize: 12,
              color: 'var(--admin-text-muted)',
              lineHeight: 1.5
            }}>
              <span style={{ fontSize: 14 }}>💡</span>
              <span>
                This percentage is deducted from the consultation fee whenever a booking qualifies for commission. You can exempt specific channels below.
              </span>
            </div>
          </div>

          {/* Toggle Switches Card */}
          <div className="admin-card" style={{ padding: 24, borderRadius: 20 }}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Channel Rules & Exemption Policies
              </label>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--admin-text)', marginTop: 2 }}>
                Where Should Platform Commission Apply?
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                {
                  key: 'apply_to_patient_booking',
                  title: 'Charge on Online Patient Bookings',
                  desc: 'Apply platform commission when patients self-book appointments through the website or mobile patient portal.',
                  icon: '🧑‍💻',
                  color: '#10B981',
                  bg: 'rgba(16, 185, 129, 0.1)'
                },
                {
                  key: 'apply_to_manager_booking',
                  title: 'Charge on Hospital Reception Bookings',
                  desc: 'Apply platform commission when hospital managers or front desk receptionists enter walk-in counter tickets.',
                  icon: '🏥',
                  color: '#3B82F6',
                  bg: 'rgba(59, 130, 246, 0.1)'
                },
                {
                  key: 'waive_if_doctor_subscribed',
                  title: '0% Commission for Subscribed Doctors (Fee Waiver)',
                  desc: 'Doctors with an active paid monthly/yearly package pay zero commission on all their patient appointments.',
                  icon: '✨',
                  color: '#F59E0B',
                  bg: 'rgba(245, 158, 11, 0.1)'
                },
              ].map(item => {
                const isEnabled = Boolean(form[item.key])
                return (
                  <div
                    key={item.key}
                    onClick={() => setForm({ ...form, [item.key]: !form[item.key] })}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      padding: '16px 18px',
                      borderRadius: 16,
                      background: isEnabled ? 'var(--admin-card-bg)' : 'var(--admin-bg)',
                      border: isEnabled ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--admin-border)',
                      cursor: 'pointer',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: isEnabled ? '0 4px 14px rgba(0, 0, 0, 0.03)' : 'none'
                    }}
                  >
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: item.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 22,
                      flexShrink: 0
                    }}>
                      {item.icon}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--admin-text)' }}>
                          {item.title}
                        </span>
                        <span style={{
                          fontSize: 10,
                          fontWeight: 800,
                          padding: '1px 7px',
                          borderRadius: 10,
                          background: isEnabled ? 'rgba(16, 185, 129, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                          color: isEnabled ? '#059669' : 'var(--admin-text-muted)'
                        }}>
                          {isEnabled ? 'ACTIVE' : 'OFF'}
                        </span>
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--admin-text-muted)', marginTop: 3, lineHeight: 1.45 }}>
                        {item.desc}
                      </div>
                    </div>

                    {/* Modern Switch Toggle */}
                    <div style={{
                      width: 48,
                      height: 26,
                      borderRadius: 14,
                      padding: 3,
                      background: isEnabled ? 'var(--admin-primary, #0284c7)' : 'var(--admin-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: isEnabled ? 'flex-end' : 'flex-start',
                      transition: 'all 0.25s',
                      flexShrink: 0,
                      boxShadow: isEnabled ? '0 2px 8px rgba(2, 132, 199, 0.3)' : 'none'
                    }}>
                      <div style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        background: 'white',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── Right Column: Live Interactive Simulator ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Simulator Card */}
          <div className="admin-card" style={{
            padding: 24,
            borderRadius: 20,
            borderTop: '4px solid #6366F1'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'rgba(99, 102, 241, 0.1)',
                color: '#6366F1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18
              }}>
                🧮
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: 'var(--admin-text)' }}>
                  Live Revenue & Payout Preview
                </h4>
                <p style={{ margin: 0, fontSize: 11.5, color: 'var(--admin-text-muted)' }}>
                  Real-time calculation based on current settings
                </p>
              </div>
            </div>

            {/* Test Fee Inputs */}
            <div style={{
              background: 'var(--admin-bg)',
              borderRadius: 14,
              padding: '14px 16px',
              border: '1px solid var(--admin-border)',
              marginBottom: 16
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--admin-text-muted)' }}>
                  Test Consultation Fee:
                </span>
                <span style={{ fontSize: 14, fontWeight: 900, color: 'var(--admin-text)' }}>
                  ৳{simFee}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {[300, 500, 800, 1000, 1500].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setSampleFee(amt)}
                    style={{
                      flex: 1,
                      padding: '6px 0',
                      borderRadius: 8,
                      border: simFee === amt ? '1px solid #6366F1' : '1px solid var(--admin-border)',
                      background: simFee === amt ? 'rgba(99, 102, 241, 0.12)' : 'var(--admin-card-bg)',
                      color: simFee === amt ? '#6366F1' : 'var(--admin-text)',
                      fontSize: 11,
                      fontWeight: 800,
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    ৳{amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Breakdown Box */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              padding: '16px',
              borderRadius: 16,
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.02), rgba(15, 23, 42, 0.04))',
              border: '1px solid var(--admin-border)',
              marginBottom: 16
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                <span style={{ color: 'var(--admin-text-muted)' }}>Total Consultation Fee:</span>
                <span style={{ fontWeight: 700, color: 'var(--admin-text)' }}>৳{simFee.toLocaleString()}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                <span style={{ color: 'var(--admin-primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>📉</span> Platform Fee ({rate}%):
                </span>
                <span style={{ fontWeight: 800, color: 'var(--admin-primary)', fontSize: 14 }}>
                  - ৳{simCommission.toLocaleString()}
                </span>
              </div>

              <div style={{
                borderTop: '1px dashed var(--admin-border)',
                paddingTop: 10,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: 14
              }}>
                <span style={{ fontWeight: 800, color: 'var(--admin-text)' }}>Doctor's Net Earning:</span>
                <span style={{ fontWeight: 900, color: '#059669', fontSize: 17 }}>
                  ৳{simDoctorPayout.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Scenario Status List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Outcome across booking scenarios:
              </div>

              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 12px', borderRadius: 10, background: 'var(--admin-bg)', fontSize: 12
              }}>
                <span style={{ color: 'var(--admin-text)' }}>🌐 Patient Website Booking</span>
                <span style={{ fontWeight: 700, color: form.apply_to_patient_booking ? '#059669' : '#DC2626' }}>
                  {form.apply_to_patient_booking ? `✓ ৳${simCommission} deducted` : '⊘ 0% Fee'}
                </span>
              </div>

              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 12px', borderRadius: 10, background: 'var(--admin-bg)', fontSize: 12
              }}>
                <span style={{ color: 'var(--admin-text)' }}>🏥 Counter Walk-in Ticket</span>
                <span style={{ fontWeight: 700, color: form.apply_to_manager_booking ? '#059669' : '#DC2626' }}>
                  {form.apply_to_manager_booking ? `✓ ৳${simCommission} deducted` : '⊘ 0% Fee'}
                </span>
              </div>

              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 12px', borderRadius: 10, background: 'var(--admin-bg)', fontSize: 12
              }}>
                <span style={{ color: 'var(--admin-text)' }}>✨ Doctor with Active Package</span>
                <span style={{ fontWeight: 700, color: form.waive_if_doctor_subscribed ? '#6366F1' : 'var(--admin-text)' }}>
                  {form.waive_if_doctor_subscribed ? '🎉 ৳0 (100% Waived)' : `৳${simCommission} deducted`}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Notice Card */}
          <div style={{
            background: 'rgba(99, 102, 241, 0.05)',
            border: '1px dashed rgba(99, 102, 241, 0.3)',
            borderRadius: 16,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12
          }}>
            <span style={{ fontSize: 20 }}>🛡️</span>
            <div style={{ fontSize: 12, color: 'var(--admin-text)', lineHeight: 1.5 }}>
              <strong>Instant Global Synchronization:</strong> Any changes saved here apply immediately to all upcoming appointment bookings without requiring doctors to update their schedules.
            </div>
          </div>
        </div>
      </div>

      {/* ── Confirmation Summary Modal (Option 1) ── */}
      {showConfirmModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1050,
            padding: 16
          }}
          onClick={() => !saving && setShowConfirmModal(false)}
        >
          <div
            style={{
              background: 'var(--admin-card-bg, #ffffff)',
              color: 'var(--admin-text)',
              borderRadius: 24,
              maxWidth: 520,
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid var(--admin-border)',
              overflow: 'hidden'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '24px 28px 20px',
              borderBottom: '1px solid var(--admin-border)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 16
            }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.25))',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                flexShrink: 0
              }}>
                🛡️
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--admin-text)' }}>
                  Confirm Booking Rules Update
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--admin-text-muted)', lineHeight: 1.4 }}>
                  Please review the summary below before applying these global settings platform-wide.
                </p>
              </div>
              <button
                type="button"
                onClick={() => !saving && setShowConfirmModal(false)}
                disabled={saving}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 4,
                  color: 'var(--admin-text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 8
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body / Summary Cards */}
            <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Summary Rows Card */}
              <div style={{
                background: 'var(--admin-bg)',
                borderRadius: 16,
                border: '1px solid var(--admin-border)',
                overflow: 'hidden'
              }}>
                {/* Platform Commission Rate */}
                <div style={{
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid var(--admin-border)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16 }}>💰</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--admin-text)' }}>Platform Commission Rate</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {rate !== prevRate && (
                      <span style={{ fontSize: 12, color: 'var(--admin-text-muted)', textDecoration: 'line-through' }}>
                        {prevRate}%
                      </span>
                    )}
                    <span style={{
                      fontSize: 15,
                      fontWeight: 900,
                      color: '#059669',
                      background: 'rgba(16, 185, 129, 0.1)',
                      padding: '2px 10px',
                      borderRadius: 8,
                      border: '1px solid rgba(16, 185, 129, 0.3)'
                    }}>
                      {rate}%
                    </span>
                  </div>
                </div>

                {/* Patient Online Booking */}
                <div style={{
                  padding: '12px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid var(--admin-border)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16 }}>🌐</span>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--admin-text)' }}>Online Patient Bookings</span>
                  </div>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: 6,
                    background: form.apply_to_patient_booking ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: form.apply_to_patient_booking ? '#059669' : '#DC2626'
                  }}>
                    {form.apply_to_patient_booking ? '● APPLIED' : '○ EXEMPT (0%)'}
                  </span>
                </div>

                {/* Manager / Counter Booking */}
                <div style={{
                  padding: '12px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid var(--admin-border)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16 }}>🏢</span>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--admin-text)' }}>Counter / Manager Bookings</span>
                  </div>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: 6,
                    background: form.apply_to_manager_booking ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: form.apply_to_manager_booking ? '#059669' : '#DC2626'
                  }}>
                    {form.apply_to_manager_booking ? '● APPLIED' : '○ EXEMPT (0%)'}
                  </span>
                </div>

                {/* Subscribed Doctor Exemption */}
                <div style={{
                  padding: '12px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16 }}>✨</span>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--admin-text)' }}>Subscribed Doctor Protection</span>
                  </div>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: 6,
                    background: form.waive_if_doctor_subscribed ? 'rgba(99, 102, 241, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                    color: form.waive_if_doctor_subscribed ? '#6366F1' : '#D97706'
                  }}>
                    {form.waive_if_doctor_subscribed ? '● 100% WAIVED (0%)' : '○ CHARGE COMMISSION'}
                  </span>
                </div>
              </div>

              {/* Real-world Calculation Sample */}
              <div style={{
                background: 'rgba(99, 102, 241, 0.05)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                borderRadius: 14,
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 12
              }}>
                <span style={{ color: 'var(--admin-text-muted)' }}>Calculation on ৳1,000 fee:</span>
                <span style={{ fontWeight: 800, color: '#6366F1' }}>
                  Platform: ৳{Math.round((1000 * rate) / 100)} &nbsp;|&nbsp; Doctor: ৳{1000 - Math.round((1000 * rate) / 100)}
                </span>
              </div>

              {/* Instant Impact Warning Banner */}
              <div style={{
                background: 'rgba(14, 165, 233, 0.08)',
                border: '1px solid rgba(14, 165, 233, 0.25)',
                borderRadius: 14,
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: 12,
                color: 'var(--admin-text)',
                lineHeight: 1.45
              }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>⚡</span>
                <span>
                  <strong>Global Impact:</strong> Any new appointment booked via online or counter will immediately adopt these rules upon confirmation.
                </span>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div style={{
              padding: '16px 28px 24px',
              borderTop: '1px solid var(--admin-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 12,
              background: 'var(--admin-card-bg)'
            }}>
              <button
                type="button"
                className="admin-btn admin-btn-outline"
                onClick={() => setShowConfirmModal(false)}
                disabled={saving}
                style={{ height: 42, padding: '0 20px', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-primary"
                onClick={handleConfirmSave}
                disabled={saving}
                style={{
                  height: 42,
                  padding: '0 24px',
                  borderRadius: 12,
                  fontSize: 13,
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, var(--admin-primary), #059669)',
                  border: 'none',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer'
                }}
              >
                {saving ? (
                  <>
                    <div className="admin-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                    <span>Applying Rules...</span>
                  </>
                ) : (
                  <>
                    <Check size={16} strokeWidth={2.5} />
                    <span>Confirm & Apply Rules</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
