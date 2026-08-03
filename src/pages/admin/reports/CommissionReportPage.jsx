// CommissionReportPage.jsx — Admin Commission Report with premium filters
import { useState, useEffect, useRef } from 'react'
import { toast } from 'react-toastify'
import { getCommissionReport, getDoctors, getHospitals, updateAppointment, bulkUpdateCommissionStatus } from '../../../api/adminApi'
import { getErrorMessage } from '../../../utils/errorHelper'
import CommissionMemo from './CommissionMemo'

const MONTHS = [
  { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
  { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
  { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
  { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' }
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

export default function CommissionReportPage() {
  const [loading, setLoading] = useState(false)
  const [updating, setUpdating] = useState(null)
  const [bulking, setBulking] = useState(false)
  
  const [data, setData] = useState([])
  const [summary, setSummary] = useState({})
  
  const [doctors, setDoctors] = useState([])
  const [hospitals, setHospitals] = useState([])
  
  const [filters, setFilters] = useState({
    doctor_id: '',
    hospital_id: '',
    month: '',
    year: new Date().getFullYear(),
    status: ''
  })

  const [selectedAppointments, setSelectedAppointments] = useState([])
  const [showMemo, setShowMemo] = useState(false)

  useEffect(() => {
    loadOptions()
    fetchReport()
  }, [])

  const loadOptions = async () => {
    try {
      const [docRes, hospRes] = await Promise.all([
        getDoctors({ per_page: 500 }),
        getHospitals({ per_page: 500 })
      ])
      setDoctors(docRes.data?.data?.data || docRes.data?.data || [])
      setHospitals(hospRes.data?.data?.data || hospRes.data?.data || [])
    } catch (err) { console.error(err) }
  }

  const fetchReport = async () => {
    setLoading(true)
    try {
      const res = await getCommissionReport(filters)
      // Robust data mapping for various API response patterns
      const reportData = res.data?.data?.data || res.data?.data || res.data?.commissions || (Array.isArray(res.data) ? res.data : [])
      const reportSummary = res.data?.summary || res.data?.stats || {}
      
      setData(reportData)
      setSummary(reportSummary)
      setSelectedAppointments([])
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load report'))
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (id, status) => {
    setUpdating(id)
    try {
      await updateAppointment(id, { commission_status: status })
      toast.success('Status updated')
      fetchReport()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Update failed'))
    } finally {
      setUpdating(null)
    }
  }

  const handleBulkUpdate = async (status) => {
    if (selectedAppointments.length === 0) return
    setBulking(true)
    try {
      await bulkUpdateCommissionStatus({
        appointment_ids: selectedAppointments,
        commission_status: status
      })
      toast.success(`Bulk updated ${selectedAppointments.length} items to ${status}`)
      fetchReport()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Bulk update failed'))
    } finally {
      setBulking(false)
    }
  }

  const toggleSelect = (id) => {
    setSelectedAppointments(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedAppointments.length === data.length) {
      setSelectedAppointments([])
    } else {
      setSelectedAppointments(data.map(d => d.id))
    }
  }

  const selectedDoctor = doctors.find(d => String(d.id) === String(filters.doctor_id))
  const selectedHospital = hospitals.find(h => String(h.id) === String(filters.hospital_id))

  return (
    <div className="admin-container">
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title" style={{ color: 'var(--admin-text)' }}>
            <span style={{ marginRight: 12 }}>🧾</span>
            Commission Reports
          </h2>
          <p className="admin-page-subtitle" style={{ color: 'var(--admin-text-muted)' }}>Analyze and manage commissions for doctors and hospitals</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="admin-card" style={{ marginBottom: 28, overflow: 'visible', borderTop: '4px solid var(--admin-primary)' }}>
        <div className="admin-card-body" style={{ overflow: 'visible' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 20, alignItems: 'flex-end' }}>
            
            <SearchableSelect 
              label="Doctor" 
              options={doctors} 
              value={filters.doctor_id} 
              onChange={val => setFilters({ ...filters, doctor_id: val, hospital_id: '' })} 
              placeholder="All Doctors" 
            />

            <SearchableSelect 
              label="Hospital" 
              options={hospitals} 
              value={filters.hospital_id} 
              onChange={val => setFilters({ ...filters, hospital_id: val, doctor_id: '' })} 
              placeholder="All Hospitals" 
            />

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Month</label>
              <select className="admin-form-select" value={filters.month} onChange={e => setFilters({ ...filters, month: e.target.value })} style={{ height: 42 }}>
                <option value="">Select Month</option>
                {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Year</label>
              <input 
                type="number" 
                className="admin-form-input" 
                value={filters.year} 
                onChange={e => setFilters({ ...filters, year: e.target.value })} 
                style={{ height: 42 }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</label>
              <select className="admin-form-select" value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })} style={{ height: 42 }}>
                <option value="">All Status</option>
                <option value="unpaid">Unpaid</option>
                <option value="paid">Paid</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button className="admin-btn admin-btn-primary" onClick={fetchReport} style={{ height: 42, padding: '0 24px' }}>Filter</button>
              <button 
                className="admin-btn admin-btn-outline" 
                onClick={() => setFilters({ doctor_id: '', hospital_id: '', month: new Date().getMonth() + 1, year: new Date().getFullYear(), status: '' })}
                style={{ height: 42 }}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid" style={{ marginBottom: 28 }}>
        <div className="stat-card stat-primary">
          <div className="stat-content">
            <h3 style={{ color: 'var(--admin-text)' }}>৳{Number(summary.total_commission || 0).toLocaleString()}</h3>
            <p style={{ color: 'var(--admin-text-muted)' }}>Total Commission</p>
          </div>
          <div className="stat-icon icon-primary">💰</div>
        </div>
        <div className="stat-card stat-success">
          <div className="stat-content">
            <h3 style={{ color: 'var(--admin-text)' }}>৳{Number(summary.total_fees || 0).toLocaleString()}</h3>
            <p style={{ color: 'var(--admin-text-muted)' }}>Total Booking Fees</p>
          </div>
          <div className="stat-icon icon-success">🧾</div>
        </div>
        <div className="stat-card stat-info">
          <div className="stat-content">
            <h3 style={{ color: 'var(--admin-text)' }}>{summary.total_appointments || 0}</h3>
            <p style={{ color: 'var(--admin-text-muted)' }}>Total Appointments</p>
          </div>
          <div className="stat-icon icon-info">📅</div>
        </div>
      </div>

      {/* Main Table */}
      <div className="admin-card">
        <div className="admin-card-header" style={{ background: 'var(--admin-bg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <h3 className="admin-card-title">Commission Breakdown</h3>
            {selectedAppointments.length > 0 && (
              <div style={{ display: 'flex', gap: 8, animation: 'fadeIn 0.2s' }}>
                <button 
                  className="admin-btn admin-btn-sm" 
                  style={{ background: '#10B981', color: 'white' }}
                  onClick={() => handleBulkUpdate('paid')}
                  disabled={bulking}
                >
                  Mark {selectedAppointments.length} as Paid
                </button>
                <button 
                  className="admin-btn admin-btn-sm" 
                  style={{ background: '#EF4444', color: 'white' }}
                  onClick={() => handleBulkUpdate('unpaid')}
                  disabled={bulking}
                >
                  Mark as Unpaid
                </button>
              </div>
            )}
          </div>
          <button 
            className="admin-btn admin-btn-outline" 
            onClick={() => setShowMemo(true)}
            disabled={data.length === 0}
          >
            📋 Generate Memo
          </button>
        </div>

        <div className="admin-card-body" style={{ padding: 0 }}>
          {loading ? (
            <div className="admin-loading" style={{ padding: 60 }}><div className="admin-spinner" /> Loading report...</div>
          ) : data.length === 0 ? (
            <div className="admin-empty" style={{ padding: 60 }}><h4 style={{ color: 'var(--admin-text)' }}>No records found for selected filters</h4></div>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ paddingLeft: 24, width: 40 }}>
                      <input type="checkbox" checked={selectedAppointments.length === data.length} onChange={toggleSelectAll} />
                    </th>
                    <th style={{ color: 'var(--admin-text-muted)' }}>Date</th>
                    <th style={{ color: 'var(--admin-text-muted)' }}>Patient Details</th>
                    <th style={{ color: 'var(--admin-text-muted)' }}>Booking By</th>
                    <th style={{ color: 'var(--admin-text-muted)' }}>Fee</th>
                    <th style={{ color: 'var(--admin-text-muted)' }}>Rate</th>
                    <th style={{ color: 'var(--admin-text-muted)' }}>Commission</th>
                    <th style={{ textAlign: 'right', paddingRight: 24, color: 'var(--admin-text-muted)' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(row => (
                    <tr key={row.id}>
                      <td style={{ paddingLeft: 24 }}>
                        <input type="checkbox" checked={selectedAppointments.includes(row.id)} onChange={() => toggleSelect(row.id)} />
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--admin-text)' }}>{row.date}</td>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--admin-text)' }}>{row.patient_name}</div>
                        <div style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>Reg ID: #{row.registration_id}</div>
                      </td>
                      <td style={{ textTransform: 'capitalize' }}>
                         <span style={{ 
                            fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 6,
                            background: row.created_by_role === 'manager' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                            color: row.created_by_role === 'manager' ? '#F59E0B' : '#3B82F6'
                         }}>
                            {row.created_by_role}
                         </span>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--admin-text)' }}>৳{row.amount}</td>
                      <td style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>{row.commission_rate}%</td>
                      <td style={{ fontWeight: 800, color: 'var(--admin-primary)' }}>৳{row.commission_amount}</td>
                      <td style={{ textAlign: 'right', paddingRight: 24 }}>
                        <select 
                          className="status-select" 
                          value={row.commission_status} 
                          disabled={updating === row.id}
                          onChange={(e) => handleUpdateStatus(row.id, e.target.value)}
                          style={{ 
                            background: row.commission_status === 'paid' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: row.commission_status === 'paid' ? '#10B981' : '#EF4444',
                            border: 'none', fontWeight: 800
                          }}
                        >
                          <option value="unpaid">Unpaid</option>
                          <option value="paid">Paid</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showMemo && (
        <CommissionMemo 
          show={showMemo} 
          onClose={() => setShowMemo(false)} 
          data={data} 
          summary={summary} 
          filters={filters}
          doctor={selectedDoctor}
          hospital={selectedHospital}
        />
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .admin-container { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  )
}
