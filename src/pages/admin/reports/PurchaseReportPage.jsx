// PurchaseReportPage.jsx — Admin Purchase Income Report
import { useState, useEffect, useRef } from 'react'
import { Filter, ChevronDown, ChevronUp } from 'lucide-react'
import { getPurchaseReport, getDoctors, getHospitals } from '../../../api/adminApi'
import { getErrorMessage } from '../../../utils/errorHelper'

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

export default function PurchaseReportPage() {
  const [data, setData] = useState([])
  const [summary, setSummary] = useState({})
  const [loading, setLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [perPage, setPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  
  const [doctors, setDoctors] = useState([])
  const [hospitals, setHospitals] = useState([])

  const [filters, setFilters] = useState({ 
    subscriber_id: '',
    subscriber_role: '',
    plan_name: '',
    date_from: '', 
    date_to: '', 
    month: '', 
    year: new Date().getFullYear().toString() 
  })

  const hasFilters = Boolean(filters.subscriber_id || filters.plan_name || filters.month || filters.date_from || filters.date_to)

  useEffect(() => { 
    loadOptions()
    fetchReport() 
  }, [])

  useEffect(() => { setCurrentPage(1) }, [data.length])

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
      const params = {}
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v })
      const res = await getPurchaseReport(params)
      // Robust data mapping for various API response patterns (paginated, nested, or direct array)
      const reportData = res.data?.data?.data || res.data?.data || res.data?.purchases || (Array.isArray(res.data) ? res.data : [])
      const reportSummary = res.data?.summary || res.data?.stats || res.data?.total || {}
      
      setData(reportData)
      setSummary(reportSummary)
    } catch (err) {
    } finally {
      setLoading(false)
    }
  }

  const handleFilter = (key, val) => setFilters(prev => ({ ...prev, [key]: val }))

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    try {
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return dateStr
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch (e) {
      return dateStr
    }
  }

  // Extract unique plan names from data for the dropdown
  const uniquePlans = [...new Set(data.map(item => item.plan_name || item.package_name).filter(Boolean))]

  return (
    <div className="admin-container">
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title" style={{ color: 'var(--admin-text)' }}>
            <span style={{ marginRight: 12 }}>📊</span>
            Purchase Income Report
          </h2>
          <p className="admin-page-subtitle" style={{ color: 'var(--admin-text-muted)' }}>Subscription purchase analytics and financial overview</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`admin-btn ${showFilters || hasFilters ? 'admin-btn-primary' : 'admin-btn-outline'}`}
            onClick={() => setShowFilters(p => !p)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Filter size={14} /> Filters {hasFilters ? '●' : ''}
            {showFilters ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          <button 
            className="admin-btn admin-btn-outline" 
            onClick={fetchReport}
            disabled={loading}
            style={{ background: 'var(--admin-card-bg)' }}
          >
            {loading ? '...' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid" style={{ marginBottom: 28 }}>
        <div className="stat-card stat-success">
          <div className="stat-content">
            <h3 style={{ color: 'var(--admin-text)' }}>৳{Number(summary.total_income || summary.total_revenue || 0).toLocaleString()}</h3>
            <p style={{ color: 'var(--admin-text-muted)' }}>Total Revenue</p>
          </div>
          <div className="stat-icon icon-success">💰</div>
        </div>
        
        <div className="stat-card stat-primary">
          <div className="stat-content">
            <h3 style={{ color: 'var(--admin-text)' }}>{summary.total_count || data.length || 0}</h3>
            <p style={{ color: 'var(--admin-text-muted)' }}>Total Purchases</p>
          </div>
          <div className="stat-icon icon-primary">🛒</div>
        </div>

        <div className="stat-card stat-info">
          <div className="stat-content">
            <h3 style={{ color: 'var(--admin-text)' }}>৳{summary.total_count > 0 ? (summary.total_income / summary.total_count).toFixed(2) : 0}</h3>
            <p style={{ color: 'var(--admin-text-muted)' }}>Avg. Purchase Value</p>
          </div>
          <div className="stat-icon icon-info">📈</div>
        </div>
      </div>

      {/* Filters Bar */}
      {showFilters && (
        <div className="admin-card" style={{ marginBottom: 28, overflow: 'visible', borderTop: '4px solid var(--admin-primary)' }}>
          <div className="admin-card-body" style={{ overflow: 'visible' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, alignItems: 'flex-end' }}>
              
              <SearchableSelect 
                label="Select Doctor" 
                options={doctors} 
                value={filters.subscriber_id} 
                onChange={val => setFilters({ ...filters, subscriber_id: val, subscriber_role: val ? 'doctor' : '' })} 
                placeholder="All Doctors" 
              />

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>Package Name</label>
                <select className="admin-form-select" value={filters.plan_name} onChange={e => handleFilter('plan_name', e.target.value)} style={{ height: 42 }}>
                  <option value="">All Packages</option>
                  {uniquePlans.map(plan => <option key={plan} value={plan}>{plan}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>Month</label>
                <select className="admin-form-select" value={filters.month} onChange={e => handleFilter('month', e.target.value)} style={{ height: 42 }}>
                  <option value="">All Months</option>
                  {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>Year</label>
                <input type="number" className="admin-form-input" value={filters.year} onChange={e => handleFilter('year', e.target.value)} style={{ height: 42 }} />
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button className="admin-btn admin-btn-primary" onClick={fetchReport} style={{ height: 42, flex: 1 }}>Filter</button>
                <button 
                  className="admin-btn admin-btn-outline" 
                  onClick={() => setFilters({ subscriber_id: '', subscriber_role: '', plan_name: '', date_from: '', date_to: '', month: '', year: new Date().getFullYear().toString() })}
                  style={{ height: 42 }}
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Show Entries Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 10, flexWrap: 'wrap', gap: 8
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--admin-text-muted)', fontWeight: 600 }}>
          Show
          <select
            value={perPage}
            onChange={e => { setPerPage(Number(e.target.value)); setCurrentPage(1) }}
            style={{
              padding: '5px 10px', borderRadius: 8,
              border: '1.5px solid var(--admin-border)',
              background: 'var(--admin-card-bg)', color: 'var(--admin-text)',
              fontSize: 13, fontWeight: 700, cursor: 'pointer', outline: 'none', minWidth: 70
            }}
          >
            {[10, 25, 50, 100, 500].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          entries
        </div>
        <div style={{ fontSize: 13, color: 'var(--admin-text-muted)' }}>
          Showing <strong>{data.length === 0 ? 0 : (currentPage - 1) * perPage + 1}</strong>–<strong>{Math.min(currentPage * perPage, data.length)}</strong> of <strong>{data.length}</strong> entries
        </div>
      </div>

      {/* Data Table */}
      <div className="admin-card">
        <div className="admin-card-header" style={{ background: 'var(--admin-bg)' }}>
          <h3 className="admin-card-title">Transaction History</h3>
        </div>
        <div className="admin-card-body" style={{ padding: 0 }}>
          {loading ? (
            <div className="admin-loading" style={{ padding: 60 }}><div className="admin-spinner" /> Syncing data...</div>
          ) : data.length === 0 ? (
            <div className="admin-empty" style={{ padding: 60 }}><h4 style={{ color: 'var(--admin-text)' }}>No purchases found for this period</h4></div>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ paddingLeft: 24, color: 'var(--admin-text-muted)' }}>Order ID</th>
                    <th style={{ color: 'var(--admin-text-muted)' }}>Date</th>
                    <th style={{ color: 'var(--admin-text-muted)' }}>Member / Entity</th>
                    <th style={{ color: 'var(--admin-text-muted)' }}>Plan Details</th>
                    <th style={{ color: 'var(--admin-text-muted)' }}>Validity Period</th>
                    <th style={{ color: 'var(--admin-text-muted)' }}>Payment Info</th>
                    <th style={{ textAlign: 'right', paddingRight: 24, color: 'var(--admin-text-muted)' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => { const paginatedData = data.slice((currentPage - 1) * perPage, currentPage * perPage); return paginatedData.map(item => (
                    <tr key={item.id}>
                      <td style={{ paddingLeft: 24, fontWeight: 700, color: 'var(--admin-text)' }}>
                        <div style={{ fontSize: 13 }}>#{item.id}</div>
                        <div style={{ fontSize: 10, color: 'var(--admin-text-muted)', fontWeight: 400 }}>{item.transaction_id || item.trx_id || item.payment_id || item.txid || 'N/A'}</div>
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--admin-text)' }}>{formatDate(item.created_at || item.date || item.payment_date || item.updated_at)}</td>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--admin-text)' }}>{item.subscriber_name || item.member_name || item.doctor_name || item.hospital_name || item.name || 'System User'}</div>
                        <div style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>
                          ID: <span style={{ color: 'var(--admin-primary)', fontWeight: 600 }}>#{item.registration_id || item.reg_id || item.doctor_id || item.hospital_id || item.subscriber_id || '—'}</span> 
                          <span style={{ margin: '0 6px', opacity: 0.3 }}>|</span> 
                          <span style={{ textTransform: 'capitalize' }}>{item.subscriber_role || item.role || item.type || 'Member'}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ 
                          fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 8, 
                          background: 'rgba(79, 70, 229, 0.08)', color: '#4F46E5', textTransform: 'uppercase',
                          width: 'fit-content', marginBottom: 4
                        }}>
                          {item.plan_name || item.package_name || item.plan || 'Subscription'}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--admin-text-muted)' }}>
                          {item.duration_days ? `${item.duration_days} Days Access` : 'Premium Service'}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-text)' }}>
                          {formatDate(item.starts_at || item.start_date || item.valid_from || item.starts_date)} 
                        </div>
                        <div style={{ fontSize: 11, color: '#EF4444', fontWeight: 600 }}>
                          to {formatDate(item.ends_at || item.end_date || item.valid_until || item.valid_to || item.ends_date)}
                        </div>
                      </td>
                      <td>
                        <div style={{ 
                          fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 6,
                          background: (item.status?.toLowerCase() === 'success' || item.status?.toLowerCase() === 'active' || !item.status) ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: (item.status?.toLowerCase() === 'success' || item.status?.toLowerCase() === 'active' || !item.status) ? '#10B981' : '#EF4444',
                          textTransform: 'uppercase', width: 'fit-content', marginBottom: 4
                        }}>
                          {item.status || 'SUCCESS'}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                          {item.payment_method || item.method || 'ONLINE'}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', paddingRight: 24, fontWeight: 900, color: 'var(--admin-primary)', fontSize: 16 }}>
                        ৳{Number(item.amount || item.price || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))})()}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Pagination */}
      {(() => {
        const totalPages = Math.ceil(data.length / perPage)
        if (data.length === 0) return null
        const pages = []
        if (totalPages <= 7) {
          for (let i = 1; i <= totalPages; i++) pages.push(i)
        } else {
          pages.push(1)
          if (currentPage > 3) pages.push('...')
          const start = Math.max(2, currentPage - 1)
          const end = Math.min(totalPages - 1, currentPage + 1)
          for (let i = start; i <= end; i++) pages.push(i)
          if (currentPage < totalPages - 2) pages.push('...')
          pages.push(totalPages)
        }
        const btnBase = {
          height: 34, minWidth: 34, padding: '0 10px', borderRadius: 8,
          border: '1.5px solid var(--admin-border)', background: 'var(--admin-card-bg)',
          color: 'var(--admin-text)', fontWeight: 700, fontSize: 13, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s'
        }
        const btnActive = { ...btnBase, border: 'none', background: 'linear-gradient(135deg, #00B875, #009E64)', color: '#fff', boxShadow: '0 2px 8px rgba(0,184,117,0.35)' }
        const btnDisabled = { ...btnBase, opacity: 0.4, cursor: 'not-allowed' }
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ fontSize: 13, color: 'var(--admin-text-muted)', fontWeight: 500 }}>
              Showing <strong>{data.length === 0 ? 0 : (currentPage - 1) * perPage + 1}</strong>–<strong>{Math.min(currentPage * perPage, data.length)}</strong> of <strong>{data.length}</strong> entries
            </div>
            {totalPages > 1 && (
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                <button onClick={() => currentPage > 1 && setCurrentPage(1)} style={currentPage === 1 ? btnDisabled : btnBase} title="First">«</button>
                <button onClick={() => currentPage > 1 && setCurrentPage(p => p - 1)} style={currentPage === 1 ? btnDisabled : btnBase} title="Previous">‹</button>
                {pages.map((p, i) => p === '...'
                  ? <span key={`d${i}`} style={{ width: 30, textAlign: 'center', color: 'var(--admin-text-muted)', fontWeight: 700 }}>…</span>
                  : <button key={p} onClick={() => setCurrentPage(p)} style={p === currentPage ? btnActive : btnBase}>{p}</button>
                )}
                <button onClick={() => currentPage < totalPages && setCurrentPage(p => p + 1)} style={currentPage === totalPages ? btnDisabled : btnBase} title="Next">›</button>
                <button onClick={() => currentPage < totalPages && setCurrentPage(totalPages)} style={currentPage === totalPages ? btnDisabled : btnBase} title="Last">»</button>
              </div>
            )}
          </div>
        )
      })()}

      <style dangerouslySetInnerHTML={{ __html: `
        .admin-container { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  )
}
