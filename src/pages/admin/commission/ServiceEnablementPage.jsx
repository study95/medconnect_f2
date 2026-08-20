import { useState, useEffect, useRef } from 'react'
import { Navigate } from 'react-router-dom'
import { Filter, ChevronDown, ChevronUp } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { getErrorMessage } from '../../../utils/errorHelper'
import {
  getServiceEnablements, updateServiceEnablement,
  getHospitalCommissions, updateHospitalCommission,
  getPatientBookingCommission, updatePatientBookingCommission,
  getDoctors, getHospitals,
  getDivisions, getDistricts, getUpazilas, getUnions
} from '../../../api/adminApi'

const TABS = [
  { key: 'doctor', label: '👨‍⚕️ Doctor Service', icon: '👨‍⚕️' },
  { key: 'hospital', label: '🏥 Hospital Commission', icon: '🏥' },
  { key: 'patient', label: '🌐 Patient Booking', icon: '🌐' },
]

// Custom Searchable Dropdown Component (Premium Select)
function SearchableSelect({ label, options, value, onChange, placeholder, disabled = false }) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const dropdownRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOption = options.find(opt => opt.id.toString() === value.toString())
  const filteredOptions = options
    .filter(opt => opt.name?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''))

  return (
    <div className="searchable-select-container" ref={dropdownRef} style={{ position: 'relative', width: '100%', opacity: disabled ? 0.6 : 1 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      <div 
        className="status-select" 
        style={{ 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
          cursor: disabled ? 'not-allowed' : 'pointer', background: disabled ? 'var(--admin-bg)' : 'var(--admin-card-bg)', 
          height: 42, padding: '0 14px', border: '1px solid var(--admin-border)', borderRadius: 10, 
          fontSize: 13, fontWeight: 500, boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', transition: 'all 0.2s'
        }}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span style={{ color: selectedOption ? 'var(--admin-text)' : 'var(--admin-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <span style={{ fontSize: 10, color: 'var(--admin-text-muted)' }}>{isOpen ? '▲' : '▼'}</span>
      </div>

      {isOpen && (
        <div style={{ 
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', borderRadius: 12, marginTop: 6,
          boxShadow: 'var(--admin-shadow-lg)', overflow: 'hidden', zIndex: 1000
        }}>
          <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--admin-border)', background: 'var(--admin-bg)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>🔍</span>
            <input 
              ref={inputRef}
              type="text" 
              autoFocus
              placeholder="Type to search..." 
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13, width: '100%', color: 'var(--admin-text)' }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div style={{ maxHeight: 250, overflowY: 'auto' }}>
            <div 
              style={{ padding: '10px 14px', fontSize: 12, cursor: 'pointer', color: 'var(--admin-primary)', fontWeight: 700, textAlign: 'center', background: 'rgba(0, 168, 140, 0.05)' }}
              onClick={() => { onChange(''); setIsOpen(false); setSearch('') }}
            >
              ✕ Clear Selection
            </div>
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '20px 14px', textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: 12 }}>No matching results</div>
            ) : (
              filteredOptions.map(opt => (
                <div 
                  key={opt.id} 
                  style={{ 
                    padding: '10px 14px', fontSize: 13, cursor: 'pointer', 
                    background: value.toString() === opt.id.toString() ? 'var(--admin-bg)' : 'transparent',
                    borderBottom: '1px solid var(--admin-border)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--admin-bg)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = value.toString() === opt.id.toString() ? 'var(--admin-bg)' : 'transparent'}
                  onClick={() => {
                    onChange(opt.id.toString())
                    setIsOpen(false)
                    setSearch('')
                  }}
                >
                  <div style={{ fontWeight: value.toString() === opt.id.toString() ? 700 : 500, color: 'var(--admin-text)' }}>{opt.name}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

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
            Commission & Services
          </h2>
          <p className="admin-page-subtitle" style={{ color: 'var(--admin-text-muted)' }}>Configure doctor service levels, hospital commissions, and global booking fees</p>
        </div>
      </div>

      {/* Modern Tab Bar */}
      <div style={{
        display: 'flex', gap: 6, background: 'var(--admin-sidebar-user-bg)', borderRadius: 18, padding: 6, marginBottom: 32, maxWidth: 600
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
            {tab.label.split(' ')[1]}
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
  const [doctorsData, setDoctorsData] = useState([])
  const [doctorsOptions, setDoctorsOptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  
  const [search, setSearch] = useState('')
  const [doctorFilter, setDoctorFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [serviceTypeFilter, setServiceTypeFilter] = useState('')
  
  const [divisionId, setDivisionId] = useState('')
  const [districtId, setDistrictId] = useState('')
  const [upazilaId, setUpazilaId] = useState('')
  const [unionId, setUnionId] = useState('')
  
  const [divisions, setDivisions] = useState([])
  const [districts, setDistricts] = useState([])
  const [upazilas, setUpazilas] = useState([])
  const [unions, setUnions] = useState([])

  useEffect(() => { 
    fetchData()
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
      const params = { per_page: 500 }
      if (divisionId) params.division_id = divisionId
      if (districtId) params.district_id = districtId
      if (upazilaId) params.upazila_id = upazilaId
      if (unionId) params.union_id = unionId

      const res = await getDoctors(params)
      setDoctorsOptions(res.data?.data?.data || res.data?.data || [])
    } catch (err) { console.error(err) }
  }

  useEffect(() => { loadOptions() }, [divisionId, districtId, upazilaId, unionId])

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await getServiceEnablements({ per_page: 500 })
      const raw = res.data?.data
      const list = Array.isArray(raw?.data) ? raw.data : (Array.isArray(raw) ? raw : [])
      setDoctorsData(list)
    } catch (err) {
      setDoctorsData([])
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (doctorId, field, value) => {
    const doctor = (Array.isArray(doctorsData) ? doctorsData : []).find(d => d.id === doctorId)
    if (doctor?.has_active_access && field !== 'is_enabled') {
      return
    }

    const current = doctor?.enablement || {}
    const payload = {
      service_type: current.service_type || null,
      commission_percentage: current.commission_percentage || 0,
      is_enabled: current.is_enabled || false,
      notes: current.notes || '',
      ...{ [field]: value }
    }

    if (field === 'service_type' && value === 'package') payload.commission_percentage = null

    setSaving(doctorId)
    try {
      await updateServiceEnablement(doctorId, payload)
      fetchData()
    } catch (err) {
    } finally {
      setSaving(null)
    }
  }

  const clearFilters = () => {
    setSearch('')
    setDoctorFilter('')
    setStatusFilter('')
    setServiceTypeFilter('')
    setDivisionId('')
    setDistrictId('')
    setUpazilaId('')
    setUnionId('')
  }

  const doctorList = Array.isArray(doctorsData) ? doctorsData : []
  const filtered = doctorList.filter(d => {
    const matchText = !search || d.name?.toLowerCase().includes(search.toLowerCase()) || d.bmdc?.toLowerCase().includes(search.toLowerCase())
    const matchDoctor = !doctorFilter || String(d.id) === String(doctorFilter)
    const matchStatus = !statusFilter || (statusFilter === 'active' ? d.is_active : !d.is_active)
    const matchType = !serviceTypeFilter || d.enablement?.service_type === serviceTypeFilter
    const matchDivision = !divisionId || String(d.division_id) === String(divisionId)
    const matchDistrict = !districtId || String(d.district_id) === String(districtId)
    const matchUpazila = !upazilaId || String(d.upazila_id) === String(upazilaId)
    const matchUnion = !unionId || String(d.union_id) === String(unionId)
    return matchText && matchDoctor && matchStatus && matchType && matchDivision && matchDistrict && matchUpazila && matchUnion
  })

  const hasFilters = search || doctorFilter || statusFilter || serviceTypeFilter || divisionId || districtId || upazilaId || unionId

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button
          type="button"
          className={`admin-btn ${showFilters || hasFilters ? 'admin-btn-primary' : 'admin-btn-outline'}`}
          onClick={() => setShowFilters(p => !p)}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Filter size={14} /> Filters {hasFilters ? '●' : ''}
          {showFilters ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      {showFilters && (
        <div className="admin-card" style={{ marginBottom: 28, borderTop: '4px solid var(--admin-primary)', overflow: 'visible' }}>
          <div className="admin-card-body" style={{ overflow: 'visible' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, alignItems: 'flex-end' }}>
              <div style={{ flex: '1 1 240px' }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Quick Search</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text" 
                    className="admin-form-input" 
                    placeholder="Name or BMDC..." 
                    value={search} 
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ width: '100%', height: 42, paddingLeft: 40 }}
                  />
                  <span style={{ position: 'absolute', left: 14, top: 11, fontSize: 16 }}>🔍</span>
                </div>
              </div>
              <SearchableSelect label="Division" options={divisions} value={divisionId} onChange={setDivisionId} placeholder="All Divisions" />
              <SearchableSelect label="District" options={districts} value={districtId} onChange={setDistrictId} placeholder="All Districts" disabled={!divisionId} />
              <SearchableSelect label="Upazila" options={upazilas} value={upazilaId} onChange={setUpazilaId} placeholder="All Upazilas" disabled={!districtId} />
              <SearchableSelect label="Union" options={unions} value={unionId} onChange={setUnionId} placeholder="All Unions" disabled={!upazilaId} />
              <SearchableSelect label="Doctor Name" options={doctorsOptions} value={doctorFilter} onChange={setDoctorFilter} placeholder="Search Doctor" />
              <div style={{ flex: '1 1 140px' }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</label>
                <select className="admin-form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: '100%', height: 42 }}>
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div style={{ flex: '1 1 140px' }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Service Type</label>
                <select className="admin-form-select" value={serviceTypeFilter} onChange={e => setServiceTypeFilter(e.target.value)} style={{ width: '100%', height: 42 }}>
                  <option value="">All Types</option>
                  <option value="package">📦 Package</option>
                  <option value="percentage">📊 Percentage</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="admin-btn admin-btn-primary" onClick={fetchData} style={{ height: 42, padding: '0 24px' }}>Refresh</button>
                {hasFilters && (
                  <button className="admin-btn admin-btn-outline" onClick={clearFilters} style={{ height: 42, color: 'var(--admin-danger)', borderColor: 'rgba(239, 68, 68, 0.2)', background: 'rgba(239, 68, 68, 0.05)' }}>
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
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
                  <th style={{ color: 'var(--admin-text-muted)' }}>Service Model</th>
                  <th style={{ color: 'var(--admin-text-muted)' }}>Commission Rate</th>
                  <th style={{ textAlign: 'right', paddingRight: 24, color: 'var(--admin-text-muted)' }}>Enable Service</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(doc => {
                  const en = doc.enablement || {}
                  const isSaving = saving === doc.id
                  return (
                    <tr key={doc.id} style={{ opacity: isSaving ? 0.6 : 1 }}>
                      <td style={{ paddingLeft: 24 }}>
                        <div style={{ fontWeight: 700, color: 'var(--admin-text)' }}>{doc.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--admin-primary)', fontWeight: 700 }}>BMDC: {doc.bmdc || 'N/A'}</div>
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
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          <span style={{
                            fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 6,
                            background: doc.is_active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: doc.is_active ? '#10B981' : '#EF4444', textTransform: 'uppercase'
                          }}>
                            {doc.is_active ? 'Active' : 'Inactive'}
                          </span>
                          {doc.has_active_access && (
                            <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 6, background: 'rgba(16, 185, 129, 0.05)', color: '#059669', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                              📦 PACKAGE ACTIVE
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="service-model-toggle">
                          <button 
                            className={`model-btn ${en.service_type === 'package' ? 'active' : ''}`}
                            onClick={() => handleUpdate(doc.id, 'service_type', 'package')}
                            disabled={isSaving || doc.has_active_access}
                          >
                            📦 Package
                          </button>
                          <button 
                            className={`model-btn ${en.service_type === 'percentage' ? 'active' : ''}`}
                            onClick={() => handleUpdate(doc.id, 'service_type', 'percentage')}
                            disabled={isSaving || doc.has_active_access}
                          >
                            📊 Comm %
                          </button>
                        </div>
                      </td>
                      <td>
                        {en.service_type === 'percentage' ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input
                              type="number"
                              min="0" max="100" step="0.5"
                              value={en.commission_percentage || ''}
                              onChange={e => handleUpdate(doc.id, 'commission_percentage', parseFloat(e.target.value) || 0)}
                              disabled={isSaving}
                              className="admin-form-input"
                              style={{ width: 70, padding: '6px 10px', fontWeight: 800, textAlign: 'center' }}
                            />
                            <span style={{ fontWeight: 700, color: 'var(--admin-text-muted)' }}>%</span>
                          </div>
                        ) : <span style={{ color: 'var(--admin-border)' }}>—</span>}
                      </td>
                      <td style={{ textAlign: 'right', paddingRight: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <div
                            onClick={() => !isSaving && handleUpdate(doc.id, 'is_enabled', !en.is_enabled)}
                            style={{
                              width: 44, height: 24, borderRadius: 12, padding: 2, cursor: isSaving ? 'not-allowed' : 'pointer',
                              background: en.is_enabled ? 'var(--admin-primary)' : 'var(--admin-border)',
                              display: 'flex', transition: '0.2s',
                              justifyContent: en.is_enabled ? 'flex-end' : 'flex-start'
                            }}
                          >
                            <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                          </div>
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
    </>
  )
}

function HospitalCommissionTab() {
  const [hospitalsData, setHospitalsData] = useState([])
  const [hospitalsOptions, setHospitalsOptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(null)
  const [search, setSearch] = useState('')
  const [hospitalFilter, setHospitalFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [divisionId, setDivisionId] = useState('')
  const [districtId, setDistrictId] = useState('')
  const [upazilaId, setUpazilaId] = useState('')
  const [unionId, setUnionId] = useState('')
  const [divisions, setDivisions] = useState([])
  const [districts, setDistricts] = useState([])
  const [upazilas, setUpazilas] = useState([])
  const [unions, setUnions] = useState([])

  useEffect(() => { 
    fetchData() 
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
      const params = { per_page: 500 }
      if (divisionId) params.division_id = divisionId
      if (districtId) params.district_id = districtId
      if (upazilaId) params.upazila_id = upazilaId
      if (unionId) params.union_id = unionId
      const res = await getHospitals(params)
      setHospitalsOptions(res.data?.data?.data || res.data?.data || [])
    } catch (err) { console.error(err) }
  }

  useEffect(() => { loadOptions() }, [divisionId, districtId, upazilaId, unionId])

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await getHospitalCommissions({ per_page: 500 })
      const raw = res.data?.data
      const list = Array.isArray(raw?.data) ? raw.data : (Array.isArray(raw) ? raw : [])
      setHospitalsData(list)
    } catch (err) {
setHospitalsData([])
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (hospitalId, field, value) => {
    const hospital = (Array.isArray(hospitalsData) ? hospitalsData : []).find(h => h.id === hospitalId)
    const current = hospital?.commission || {}
    const payload = {
      commission_percentage: current.commission_percentage || 0,
      is_enabled: current.is_enabled || false,
      notes: current.notes || '',
      ...{ [field]: value }
    }
    setSaving(hospitalId)
    try {
      await updateHospitalCommission(hospitalId, payload)
      
      fetchData()
    } catch (err) {
} finally {
      setSaving(null)
    }
  }

  const clearFilters = () => {
    setSearch('')
    setHospitalFilter('')
    setStatusFilter('')
    setDivisionId('')
    setDistrictId('')
    setUpazilaId('')
    setUnionId('')
  }

  const hospitalList = Array.isArray(hospitalsData) ? hospitalsData : []
  const filtered = hospitalList.filter(h => {
    const matchText = !search || h.name?.toLowerCase().includes(search.toLowerCase())
    const matchHospital = !hospitalFilter || String(h.id) === String(hospitalFilter)
    const matchStatus = !statusFilter || (statusFilter === 'active' ? h.is_active : !h.is_active)
    const matchDivision = !divisionId || String(h.division_id) === String(divisionId)
    const matchDistrict = !districtId || String(h.district_id) === String(districtId)
    const matchUpazila = !upazilaId || String(h.upazila_id) === String(upazilaId)
    const matchUnion = !unionId || String(h.union_id) === String(unionId)
    return matchText && matchHospital && matchStatus && matchDivision && matchDistrict && matchUpazila && matchUnion
  })

  const hasFilters = search || hospitalFilter || statusFilter || divisionId || districtId || upazilaId || unionId

  return (
    <>
      <div className="admin-card" style={{ marginBottom: 28, borderTop: '4px solid var(--admin-primary)', overflow: 'visible' }}>
        <div className="admin-card-body" style={{ overflow: 'visible' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 20, alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 240px' }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Hospital Search</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  className="admin-form-input" 
                  placeholder="Facility name..." 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ width: '100%', height: 42, paddingLeft: 40 }}
                />
                <span style={{ position: 'absolute', left: 14, top: 11, fontSize: 16 }}>🏥</span>
              </div>
            </div>
            <SearchableSelect label="Division" options={divisions} value={divisionId} onChange={setDivisionId} placeholder="All Divisions" />
            <SearchableSelect label="District" options={districts} value={districtId} onChange={setDistrictId} placeholder="All Districts" disabled={!divisionId} />
            <SearchableSelect label="Upazila" options={upazilas} value={upazilaId} onChange={setUpazilaId} placeholder="All Upazilas" disabled={!districtId} />
            <SearchableSelect label="Union" options={unions} value={unionId} onChange={setUnionId} placeholder="All Unions" disabled={!upazilaId} />
            <SearchableSelect label="Select Hospital" options={hospitalsOptions} value={hospitalFilter} onChange={setHospitalFilter} placeholder="All Facilities" />
            <div style={{ flex: '1 1 140px' }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</label>
              <select className="admin-form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: '100%', height: 42 }}>
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="admin-btn admin-btn-primary" onClick={fetchData} style={{ height: 42, padding: '0 24px' }}>Refresh</button>
              {hasFilters && (
                <button className="admin-btn admin-btn-outline" onClick={clearFilters} style={{ height: 42, color: 'var(--admin-danger)', borderColor: 'rgba(239, 68, 68, 0.2)', background: 'rgba(239, 68, 68, 0.05)' }}>
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
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
                  return (
                    <tr key={h.id} style={{ opacity: isSaving ? 0.6 : 1 }}>
                      <td style={{ paddingLeft: 24 }}>
                        <div style={{ fontWeight: 700, color: 'var(--admin-text)' }}>{h.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>{h.email || '—'}</div>
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
                        <span style={{
                          fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 6,
                          background: h.is_active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: h.is_active ? '#10B981' : '#EF4444', textTransform: 'uppercase'
                        }}>
                          {h.is_active ? 'Profile Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input
                            type="number"
                            min="0" max="100" step="0.5"
                            value={comm.commission_percentage || ''}
                            onChange={e => handleUpdate(h.id, 'commission_percentage', parseFloat(e.target.value) || 0)}
                            disabled={isSaving}
                            className="admin-form-input"
                            style={{ width: 70, padding: '6px 10px', fontWeight: 800, textAlign: 'center' }}
                          />
                          <span style={{ fontWeight: 700, color: 'var(--admin-text-muted)' }}>%</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', paddingRight: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <div
                            onClick={() => !isSaving && handleUpdate(h.id, 'is_enabled', !comm.is_enabled)}
                            style={{
                              width: 44, height: 24, borderRadius: 12, padding: 2, cursor: isSaving ? 'wait' : 'pointer',
                              background: comm.is_enabled ? 'var(--admin-primary)' : 'var(--admin-border)',
                              display: 'flex', transition: '0.2s',
                              justifyContent: comm.is_enabled ? 'flex-end' : 'flex-start'
                            }}
                          >
                            <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                          </div>
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
    </>
  )
}

function PatientBookingTab() {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    commission_percent: 10,
    apply_to_patient_booking: true,
    apply_to_manager_booking: true,
    waive_if_doctor_subscribed: true,
  })

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await getPatientBookingCommission()
      const data = res.data?.data || {}
      setSettings(data)
      setForm({
        commission_percent: data.commission_percent ?? 10,
        apply_to_patient_booking: data.apply_to_patient_booking ?? true,
        apply_to_manager_booking: data.apply_to_manager_booking ?? true,
        waive_if_doctor_subscribed: data.waive_if_doctor_subscribed ?? true,
      })
    } catch (err) {
} finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await updatePatientBookingCommission(form)
      
      fetchData()
    } catch (err) {
} finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="admin-loading" style={{ padding: 60 }}><div className="admin-spinner" /> Loading...</div>

  return (
    <div className="admin-card" style={{ maxWidth: 700, margin: '0 auto', borderRadius: 24, overflow: 'hidden' }}>
      <div className="admin-card-header" style={{ background: 'linear-gradient(135deg, var(--admin-primary), #6366F1)', color: 'white', padding: '32px' }}>
        <h3 className="admin-card-title" style={{ color: 'white', fontSize: 20 }}>Global Patient Booking Rules</h3>
        <p style={{ margin: '8px 0 0', opacity: 0.8, fontSize: 13 }}>Define how commissions are calculated for direct website bookings</p>
      </div>
      <div className="admin-card-body" style={{ padding: 40 }}>
        <div style={{ background: 'var(--admin-bg)', borderRadius: 20, padding: 32, marginBottom: 32, border: '1px solid var(--admin-border)' }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--admin-text-muted)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Base Commission Percentage
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ position: 'relative' }}>
              <input
                type="number"
                min="0" max="100" step="0.5"
                value={form.commission_percent}
                onChange={e => setForm({ ...form, commission_percent: parseFloat(e.target.value) || 0 })}
                className="admin-form-input"
                style={{
                  width: 120, padding: '16px 20px', fontSize: 24, fontWeight: 900, color: 'var(--admin-primary)', textAlign: 'center'
                }}
              />
              <span style={{ position: 'absolute', right: -30, top: 18, fontSize: 24, fontWeight: 900, color: 'var(--admin-primary)' }}>%</span>
            </div>
            <div style={{ marginLeft: 40, fontSize: 14, color: 'var(--admin-text-muted)', lineHeight: 1.5 }}>
              This percentage will be deducted from the doctor's chamber fee for each booking made through the patient portal.
            </div>
          </div>
        </div>
        <div style={{ display: 'grid', gap: 16 }}>
          {[
            { key: 'apply_to_patient_booking', title: 'Apply to Patient Bookings', desc: 'Charge commission for direct patient-to-doctor bookings', icon: '🧑' },
            { key: 'apply_to_manager_booking', title: 'Apply to Manager Bookings', desc: 'Include bookings created by hospital management panels', icon: '🏥' },
            { key: 'waive_if_doctor_subscribed', title: 'Waive for Subscribed Doctors', desc: 'Skip commission if doctor has an active monthly/yearly package', icon: '✨' },
          ].map(item => (
            <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '20px 24px', background: 'var(--admin-bg)', borderRadius: 18, transition: '0.2s', border: '1px solid transparent' }} 
                 onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--admin-border)'}>
              <div style={{ fontSize: 24 }}>{item.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--admin-text)' }}>{item.title}</div>
                <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 2 }}>{item.desc}</div>
              </div>
              <div
                onClick={() => setForm({ ...form, [item.key]: !form[item.key] })}
                style={{
                  width: 48, height: 26, borderRadius: 14, padding: 3, cursor: 'pointer',
                  background: form[item.key] ? 'var(--admin-primary)' : 'var(--admin-border)',
                  display: 'flex', transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  justifyContent: form[item.key] ? 'flex-end' : 'flex-start'
                }}
              >
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
              </div>
            </div>
          ))}
        </div>
        <button
          className="admin-btn admin-btn-primary"
          onClick={handleSave}
          disabled={saving}
          style={{ width: '100%', marginTop: 40, padding: '18px 0', fontSize: 16, borderRadius: 16, fontWeight: 800 }}
        >
          {saving ? 'Saving Changes...' : '🚀 Save Global Configuration'}
        </button>
      </div>
    </div>
  )
}
