// DoctorListPage.jsx — Admin doctor management + Doctor own profile
import { useState, useEffect, useRef } from 'react'
import { Filter, ChevronDown, ChevronUp } from 'lucide-react'
import { getMediaUrl } from '../../../utils/mediaUtils'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { getDoctors, deleteDoctor, updateDoctor, getDivisions, getDistricts, getUpazilas, getUnions, getHospitals, getSpecialties } from '../../../api/adminApi'
import DeleteModal from '../../../components/admin/DeleteModal'
import { getErrorMessage } from '../../../utils/errorHelper'

const DEMO_AVATAR = 'https://img.freepik.com/free-vector/doctor-character-background_1270-84.jpg'

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
    <div className="searchable-select-container" ref={dropdownRef} style={{ position: 'relative', flex: '1 1 180px', opacity: disabled ? 0.6 : 1 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      <div
        className="status-select"
        style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer', background: 'var(--admin-card-bg)',
          height: 42, padding: '0 14px', border: '1px solid var(--admin-border)', borderRadius: 10,
          fontSize: 13, fontWeight: 500, boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', transition: 'all 0.2s',
          color: 'var(--admin-text)'
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
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)', overflow: 'hidden', zIndex: 1000
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
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '20px 14px', textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: 12 }}>No matching results</div>
            ) : (
              filteredOptions.map(opt => (
                <div
                  key={opt.id}
                  style={{
                    padding: '10px 14px', fontSize: 13, cursor: 'pointer',
                    background: value.toString() === opt.id.toString() ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                    borderBottom: '1px solid var(--admin-border)',
                    color: 'var(--admin-text)'
                  }}
                  onMouseEnter={(e) => e.target.style.background = 'rgba(0, 168, 140, 0.05)'}
                  onMouseLeave={(e) => e.target.style.background = value.toString() === opt.id.toString() ? 'rgba(99, 102, 241, 0.1)' : 'transparent'}
                  onClick={() => {
                    onChange(opt.id.toString())
                    setIsOpen(false)
                    setSearch('')
                  }}
                >
                  <div style={{ fontWeight: value.toString() === opt.id.toString() ? 700 : 500 }}>{opt.name}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function DoctorListPage() {
  const { user, isAdmin, isManager, isDoctor } = useAuth()
  const navigate = useNavigate()
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  // Filters State
  const [divisionId, setDivisionId] = useState('')
  const [districtId, setDistrictId] = useState('')
  const [upazilaId, setUpazilaId] = useState('')
  const [unionId, setUnionId] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [top10Filter, setTop10Filter] = useState('')
  const [telemedicineFilter, setTelemedicineFilter] = useState('')
  const [specialtyId, setSpecialtyId] = useState('')

  // Options State
  const [divisions, setDivisions] = useState([])
  const [districts, setDistricts] = useState([])
  const [upazilas, setUpazilas] = useState([])
  const [unions, setUnions] = useState([])
  const [specialties, setSpecialties] = useState([])

  useEffect(() => {
    fetchDoctors()
    loadInitialData()
  }, [])

  useEffect(() => {
    fetchDoctors()
  }, [divisionId, districtId, upazilaId, unionId, statusFilter, top10Filter, telemedicineFilter, specialtyId])

  const loadInitialData = async () => {
    try {
      const [divRes, specRes] = await Promise.all([
        getDivisions(),
        getSpecialties()
      ])
      setDivisions(divRes.data?.data || [])
      setSpecialties(specRes.data?.data || [])
    } catch (err) {
      console.error('Failed to load initial filter data', err)
    }
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

  const fetchDoctors = async () => {
    try {
      setLoading(true)
      const params = { per_page: 100 }
      if (search) params.search = search
      if (divisionId) params.division_id = divisionId
      if (districtId) params.district_id = districtId
      if (upazilaId) params.upazila_id = upazilaId
      if (unionId) params.union_id = unionId
      if (statusFilter !== '') params.is_active = statusFilter
      if (top10Filter !== '') params.top_10_doctor = top10Filter
      if (telemedicineFilter !== '') params.available_telemedicine = telemedicineFilter
      if (specialtyId) params.specialty_id = specialtyId

      const res = await getDoctors(params)
      setDoctors(res.data?.data?.data || res.data?.data || res.data || [])
    } catch (err) {
} finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteDoctor(deleteTarget.id)
      setDoctors(doctors.filter(d => d.id !== deleteTarget.id))
      
    } catch (err) {
} finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  const clearFilters = async () => {
    setSearch('')
    setDivisionId('')
    setDistrictId('')
    setUpazilaId('')
    setUnionId('')
    setStatusFilter('')
    setTop10Filter('')
    setTelemedicineFilter('')
    setSpecialtyId('')
    setTimeout(fetchDoctors, 0)
  }

  const handleToggleStatus = async (doctor) => {
    try {
      const newStatus = !doctor.is_active
      await updateDoctor(doctor.id, { is_active: newStatus ? 1 : 0 })
      setDoctors(doctors.map(d => d.id === doctor.id ? { ...d, is_active: newStatus } : d))
      
    } catch (err) {
}
  }

  const isDoctorOnly = !isAdmin && !isManager && isDoctor
  let allowedDoctors = doctors
  if (isDoctorOnly) {
    allowedDoctors = doctors.filter(d =>
      String(d.user_id) === String(user?.id) ||
      d.email?.toLowerCase() === user?.email?.toLowerCase()
    )
  }

  const filtered = allowedDoctors.filter(d =>
    d.name?.toLowerCase().includes(search.toLowerCase()) ||
    d.specialty?.name?.toLowerCase().includes(search.toLowerCase()) ||
    d.workplace?.toLowerCase().includes(search.toLowerCase()) ||
    d.bmdc?.toLowerCase().includes(search.toLowerCase()) ||
    d.email?.toLowerCase().includes(search.toLowerCase())
  )

  const myProfile = isDoctorOnly ? allowedDoctors[0] : null

  if (isDoctorOnly) {
    if (loading) return <div className="admin-loading" style={{ padding: 60 }}><div className="admin-spinner" /> Loading profile...</div>

    if (!myProfile) {
      return (
        <div className="admin-container">
          <div className="admin-page-header">
            <div>
              <h2 className="admin-page-title" style={{ color: 'var(--admin-text)' }}>My Profile</h2>
              <p className="admin-page-subtitle" style={{ color: 'var(--admin-text-muted)' }}>Your doctor profile is not linked yet</p>
            </div>
          </div>
          <div className="admin-card">
            <div className="admin-card-body" style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>👨‍⚕️</div>
              <h4 style={{ fontWeight: 700, marginBottom: 8, color: 'var(--admin-text)' }}>No Profile Found</h4>
              <p style={{ color: 'var(--admin-text-muted)', maxWidth: 400, margin: '0 auto 20px' }}>
                Your user account ({user?.email}) is not linked to any doctor profile yet.
                Please contact the administrator to link your profile.
              </p>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="admin-container">
        <div className="admin-page-header">
          <div>
            <h2 className="admin-page-title" style={{ color: 'var(--admin-text)' }}>My Profile</h2>
            <p className="admin-page-subtitle" style={{ color: 'var(--admin-text-muted)' }}>View and manage your doctor information</p>
          </div>
          <button
            className="admin-btn admin-btn-primary"
            onClick={() => navigate(`/admin/doctors/edit/${myProfile.id}`)}
          >
            ✏️ Edit Profile
          </button>
        </div>

        <div className="admin-card">
          <div className="admin-card-body" style={{ padding: 40 }}>
            <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <div style={{
                width: 140, height: 180, borderRadius: 20,
                background: 'linear-gradient(135deg, #00A88C, #00C9A7)',
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', boxShadow: '0 8px 30px rgba(0,168,140,0.2)', flexShrink: 0
              }}>
                {myProfile.photo ? (
                  <img src={getMediaUrl(myProfile.photo)} alt={myProfile.name} onError={(e) => { e.target.onerror = null; e.target.src = DEMO_AVATAR; }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: 64, fontWeight: 900 }}>{myProfile.name?.charAt(0)?.toUpperCase()}</span>
                )}
              </div>

              <div style={{ flex: 1, minWidth: 300 }}>
                <h3 style={{ fontWeight: 800, fontSize: 32, margin: '0 0 6px', color: 'var(--admin-text)', letterSpacing: '-0.5px' }}>
                  {myProfile.name}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '0 0 24px' }}>
                  <span style={{ background: 'rgba(0, 168, 140, 0.1)', color: '#00A88C', padding: '4px 12px', borderRadius: 20, fontWeight: 700, fontSize: 13 }}>
                    {myProfile.specialty?.name || 'General Physician'}
                  </span>
                  <span style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366F1', padding: '4px 12px', borderRadius: 20, fontWeight: 700, fontSize: 13 }}>
                    BMDC: {myProfile.bmdc || '—'}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
                  <div className="profile-info-group">
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Workplace</span>
                    <p style={{ fontWeight: 600, color: 'var(--admin-text)', margin: '4px 0 0', fontSize: 15 }}>{myProfile.workplace || '—'}</p>
                  </div>
                  <div className="profile-info-group">
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Degree</span>
                    <p style={{ fontWeight: 600, color: 'var(--admin-text)', margin: '4px 0 0', fontSize: 15 }}>{myProfile.degree || '—'}</p>
                  </div>
                  <div className="profile-info-group">
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Experience</span>
                    <p style={{ fontWeight: 600, color: 'var(--admin-text)', margin: '4px 0 0', fontSize: 15 }}>{myProfile.experience ? `${myProfile.experience} years` : '—'}</p>
                  </div>
                  <div className="profile-info-group">
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact Phone</span>
                    <p style={{ fontWeight: 600, color: 'var(--admin-text)', margin: '4px 0 0', fontSize: 15 }}>{myProfile.phone || '—'}</p>
                  </div>
                  <div className="profile-info-group">
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email Address</span>
                    <p style={{ fontWeight: 600, color: 'var(--admin-text)', margin: '4px 0 0', fontSize: 15 }}>{myProfile.email || '—'}</p>
                  </div>
                </div>

                {myProfile.bio && (
                  <div style={{ marginTop: 28, padding: '20px', background: 'rgba(0,0,0,0.02)', borderRadius: 16, borderLeft: '4px solid #00A88C' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Short Biography</span>
                    <p style={{ color: 'var(--admin-text)', margin: '8px 0 0', lineHeight: 1.6, fontSize: 14 }}>{myProfile.bio}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-container">
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title" style={{ color: 'var(--admin-text)' }}>
            <span style={{ marginRight: 12 }}>👨‍⚕️</span>
            {isDoctorOnly ? 'My Profile' : 'Doctor Management'}
          </h2>
          <p className="admin-page-subtitle" style={{ color: 'var(--admin-text-muted)' }}>Manage medical professionals and their clinical associations</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {!isDoctorOnly && (
            <button
              type="button"
              className={`admin-btn ${showFilters || (search || divisionId || districtId || upazilaId || unionId || statusFilter !== '' || top10Filter !== '' || telemedicineFilter !== '' || specialtyId) ? 'admin-btn-primary' : 'admin-btn-outline'}`}
              onClick={() => setShowFilters(p => !p)}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Filter size={14} /> Filters {(search || divisionId || districtId || upazilaId || unionId || statusFilter !== '' || top10Filter !== '' || telemedicineFilter !== '' || specialtyId) ? '●' : ''}
              {showFilters ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          )}
          {isAdmin ? (
            <Link to="/admin/doctors/create" className="admin-btn admin-btn-primary">
              + Add New Doctor
            </Link>
          ) : (isDoctorOnly && !myProfile) && (
            <Link to="/admin/doctors/create" className="admin-btn admin-btn-primary">
              ✨ Create My Profile
            </Link>
          )}
        </div>
      </div>

      {showFilters && (
        <div className="admin-card" style={{ marginBottom: 28, borderTop: '4px solid var(--admin-primary)', overflow: 'visible' }}>
          <div className="admin-card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 20, alignItems: 'flex-end' }}>

              <div style={{ flex: '1 1 200px' }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Global Search</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="status-select"
                    placeholder="Name, BMDC, specialty..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ width: '100%', height: 42, paddingLeft: 40, background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                  />
                  <span style={{ position: 'absolute', left: 14, top: 11, fontSize: 16 }}>🔍</span>
                </div>
              </div>

              <SearchableSelect
                label="Division"
                placeholder="All Divisions"
                options={divisions}
                value={divisionId}
                onChange={setDivisionId}
              />

              <SearchableSelect
                label="District"
                placeholder="All Districts"
                options={districts}
                value={districtId}
                onChange={setDistrictId}
                disabled={!divisionId}
              />

              <SearchableSelect
                label="Upazila"
                placeholder="All Upazilas"
                options={upazilas}
                value={upazilaId}
                onChange={setUpazilaId}
                disabled={!districtId}
              />

              <SearchableSelect
                label="Union"
                placeholder="All Unions"
                options={unions}
                value={unionId}
                onChange={setUnionId}
                disabled={!upazilaId}
              />

              <SearchableSelect
                label="Specialty"
                placeholder="All Specialties"
                options={specialties}
                value={specialtyId}
                onChange={setSpecialtyId}
              />

              <div style={{ minWidth: 120 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</label>
                <select className="status-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: '100%', height: 42, background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}>
                  <option value="">All Status</option>
                  <option value="1">Active</option>
                  <option value="0">Inactive</option>
                </select>
              </div>
              <div style={{ minWidth: 120 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Top 10</label>
                <select className="status-select" value={top10Filter} onChange={e => setTop10Filter(e.target.value)} style={{ width: '100%', height: 42, background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}>
                  <option value="">All</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>

              <div style={{ minWidth: 120 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Telemedicine</label>
                <select className="status-select" value={telemedicineFilter} onChange={e => setTelemedicineFilter(e.target.value)} style={{ width: '100%', height: 42, background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}>
                  <option value="">All</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button className="admin-btn admin-btn-primary" onClick={fetchDoctors} style={{ height: 42, padding: '0 20px' }}>Filter</button>
                {(search || divisionId || districtId || upazilaId || unionId || statusFilter !== '' || top10Filter !== '' || telemedicineFilter !== '' || specialtyId) && (
                  <button className="admin-btn admin-btn-outline" onClick={clearFilters} style={{ height: 42, color: '#EF4444', borderColor: 'rgba(239, 68, 68, 0.2)', background: 'rgba(239, 68, 68, 0.05)' }}>
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="admin-card">
        <div className="admin-card-header">
          <h3 className="admin-card-title">All Registered Doctors</h3>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-text-muted)', background: 'var(--admin-bg)', padding: '4px 10px', borderRadius: 20 }}>
            {filtered.length} Records Found
          </span>
        </div>

        {loading ? (
          <div className="admin-loading" style={{ padding: 60 }}><div className="admin-spinner" /> Loading doctors...</div>
        ) : filtered.length === 0 ? (
          <div className="admin-empty" style={{ padding: 60 }}>
            <div className="admin-empty-icon">👨‍⚕️</div>
            <h4>No doctors found</h4>
            <p>{search ? 'Try a different search term' : 'No doctors matching your criteria.'}</p>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 80, paddingLeft: 24, color: 'var(--admin-text-muted)' }}>Photo</th>
                  <th style={{ color: 'var(--admin-text-muted)' }}>Professional Details</th>
                  <th style={{ color: 'var(--admin-text-muted)' }}>Workplace Identity</th>
                  <th style={{ color: 'var(--admin-text-muted)' }}>Location Profile</th>
                  <th style={{ color: 'var(--admin-text-muted)' }}>Account Status</th>
                  <th style={{ color: 'var(--admin-text-muted)' }}>Contact Info</th>
                  <th style={{ textAlign: 'right', paddingRight: 24, color: 'var(--admin-text-muted)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(doctor => (
                  <tr key={doctor.id}>
                    <td style={{ paddingLeft: 24 }}>
                      <div style={{
                        width: 48, height: 48, borderRadius: 10, overflow: 'hidden',
                        background: 'rgba(0, 168, 140, 0.05)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '1px solid rgba(0, 168, 140, 0.1)'
                      }}>
                        {doctor.photo ? (
                          <img
                            src={getMediaUrl(doctor.photo)}
                            alt={doctor.name || ''}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.style.display = 'none';
                              if (e.target.nextElementSibling) e.target.nextElementSibling.style.display = 'block';
                            }}
                          />
                        ) : null}
                        <span style={{ fontSize: 18, fontWeight: 900, color: '#00A88C', display: doctor.photo ? 'none' : 'block' }}>
                          {doctor.name?.charAt(0) || 'D'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--admin-text)', fontSize: 15 }}>{doctor.name}</div>
                      <div style={{ fontSize: 11, color: '#00A88C', fontWeight: 700, marginTop: 2 }}>BMDC: {doctor.bmdc || 'N/A'}</div>
                      <div style={{ marginTop: 8, padding: '4px 8px', background: 'var(--admin-bg)', borderRadius: 6, display: 'inline-block' }}>
                        <div style={{ fontWeight: 600, color: 'var(--admin-text)', fontSize: 12 }}>{doctor.specialty?.name || 'General Physician'}</div>
                        <div style={{ fontSize: 10, color: 'var(--admin-text-muted)' }}>{doctor.degree || 'MBBS'}</div>
                      </div>
                    </td>
                    <td>
                      {doctor.workplace ? (
                        <>
                          <div style={{ fontWeight: 700, color: 'var(--admin-text)', fontSize: 13.5 }}>
                            {doctor.workplace}
                          </div>
                          {doctor.workplace_bn && (
                            <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', marginTop: 2, fontFamily: "'Hind Siliguri', sans-serif" }}>
                              {doctor.workplace_bn}
                            </div>
                          )}
                        </>
                      ) : doctor.workplace_bn ? (
                        <div style={{ fontWeight: 700, color: 'var(--admin-text)', fontSize: 13.5, fontFamily: "'Hind Siliguri', sans-serif" }}>
                          {doctor.workplace_bn}
                        </div>
                      ) : doctor.hospital?.name ? (
                        <div style={{ fontWeight: 700, color: 'var(--admin-text)', fontSize: 13.5 }}>
                          {doctor.hospital.name}
                        </div>
                      ) : (
                        <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', fontStyle: 'italic' }}>
                          —
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', maxWidth: 160, lineHeight: 1.5 }}>
                        {[
                          doctor.division?.name,
                          doctor.district?.name,
                          doctor.upazila?.name,
                          doctor.union?.name
                        ].filter(Boolean).join(', ') || '—'}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {isAdmin ? (
                            <div
                              onClick={() => handleToggleStatus(doctor)}
                              style={{
                                width: 34, height: 18, borderRadius: 10, padding: 2, cursor: 'pointer',
                                background: doctor.is_active ? '#10B981' : '#CBD5E1',
                                display: 'flex', transition: '0.2s',
                                justifyContent: doctor.is_active ? 'flex-end' : 'flex-start'
                              }}
                            >
                              <div style={{ width: 14, height: 14, borderRadius: '50%', background: 'white', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }} />
                            </div>
                          ) : (
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: doctor.is_active ? '#10B981' : '#CBD5E1' }} />
                          )}
                          <span style={{ fontSize: 11, fontWeight: 700, color: doctor.is_active ? '#10B981' : 'var(--admin-text-muted)' }}>
                            {doctor.is_active ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {(doctor.top_10_doctor === 'yes' || doctor.top_10_doctor === true) && (
                            <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: 'rgba(254, 243, 199, 0.2)', color: '#D97706', border: '1px solid rgba(217, 119, 6, 0.2)' }}>⭐ TOP 10</span>
                          )}
                          {(doctor.available_telemedicine === 'yes' || doctor.available_telemedicine === true) && (
                            <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: 'rgba(99, 102, 241, 0.1)', color: '#6366F1', border: '1px solid rgba(99, 102, 241, 0.2)' }}>📹 TELE</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text)' }}>{doctor.phone || '—'}</div>
                      <div style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>{doctor.email || '—'}</div>
                    </td>
                    <td style={{ textAlign: 'right', paddingRight: 24 }}>
                      <div className="admin-actions" style={{ justifyContent: 'flex-end' }}>
                        <button className="admin-btn admin-btn-outline admin-btn-sm" style={{ color: '#0EA5E9', borderColor: 'rgba(14, 165, 233, 0.2)', background: 'rgba(14, 165, 233, 0.05)' }} onClick={() => navigate(`/admin/doctors/view/${doctor.id}`)}>
                          👁️ View
                        </button>
                        {isAdmin && (
                          <>
                            <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={() => navigate(`/admin/doctors/edit/${doctor.id}`)}>
                              ✏️ Edit
                            </button>
                            <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => setDeleteTarget(doctor)}>
                              🗑️
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

      <style dangerouslySetInnerHTML={{
        __html: `
        .admin-container { animation: fadeIn 0.4s ease-out; }
        .profile-info-group { padding: 12px 0; border-bottom: 1px solid var(--admin-border); }
        .profile-info-group:last-child { border-bottom: none; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}} />

      <DeleteModal
        show={!!deleteTarget}
        title="Delete Doctor"
        message={`Are you sure you want to delete Dr. ${deleteTarget?.name}? All associated chamber and appointment data will be affected.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  )
}
