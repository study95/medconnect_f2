// CommissionReportPage.jsx — Admin Commission Report with unified ListToolbar, instant auto-filters & active filter chips
import { useState, useEffect, useRef, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, ShieldCheck, X, AlertTriangle, RotateCcw } from 'lucide-react'
import toast from 'react-hot-toast'
import { getCommissionReport, getDoctors, getHospitals, updateAppointment, bulkUpdateCommissionStatus } from '../../../api/adminApi'
import { queryKeys } from '../../../lib/queryKeys'
import { getErrorMessage } from '../../../utils/errorHelper'
import ListToolbar from '../../../components/admin/ListToolbar'
import CommissionMemo from './CommissionMemo'
import CompactUlid from '../../../components/common/CompactUlid'

const MONTHS = [
  { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
  { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
  { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
  { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' }
]

// Custom Searchable Dropdown Component (Premium Select)
function SearchableSelect({ label, options = [], value = '', onChange, placeholder, disabled = false, minWidth = 240 }) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const dropdownRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const safeOptions = Array.isArray(options) ? options : []
  const selectedOption = safeOptions.find(opt => 
    opt && (String(opt.id) === String(value) || (opt.public_id && String(opt.public_id) === String(value)))
  )

  const filteredOptions = safeOptions
    .filter(opt => opt && opt.name && opt.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''))

  return (
    <div className="searchable-select-container" ref={dropdownRef} style={{ position: 'relative', flex: '2 1 240px', minWidth: minWidth, width: '100%', opacity: disabled ? 0.6 : 1 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>{label}</label>
      <div 
        className="status-select" 
        style={{ 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
          cursor: disabled ? 'not-allowed' : 'pointer', background: disabled ? 'var(--admin-bg)' : 'var(--admin-card-bg)', 
          height: 38, padding: '0 12px', border: '1px solid var(--admin-border)', borderRadius: 8, 
          fontSize: 13, fontWeight: 500, boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', transition: 'all 0.2s',
          userSelect: 'none'
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
          background: 'var(--admin-card-bg, #ffffff)', border: '1px solid var(--admin-border, #e2e8f0)', borderRadius: 10, marginTop: 4,
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', overflow: 'hidden', zIndex: 9999
        }}>
          <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--admin-border)', background: 'var(--admin-bg)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>🔍</span>
            <input 
              ref={inputRef}
              type="text" 
              autoFocus
              placeholder="Type to search..." 
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 12, width: '100%', color: 'var(--admin-text)' }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            <div 
              style={{ padding: '8px 12px', fontSize: 12, cursor: 'pointer', color: 'var(--admin-primary, #00A88C)', fontWeight: 700, textAlign: 'center', background: 'rgba(0, 168, 140, 0.05)' }}
              onClick={() => { onChange(''); setIsOpen(false); setSearch('') }}
            >
              ✕ Clear Selection ({placeholder})
            </div>
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '16px 12px', textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: 12 }}>No matching results</div>
            ) : (
              filteredOptions.map(opt => {
                const optId = String(opt.id || opt.public_id || '')
                const isSelected = selectedOption && (String(selectedOption.id) === optId || (selectedOption.public_id && String(selectedOption.public_id) === optId))
                return (
                  <div 
                    key={optId} 
                    style={{ 
                      padding: '8px 12px', fontSize: 12, cursor: 'pointer', 
                      background: isSelected ? 'rgba(0, 168, 140, 0.1)' : 'transparent',
                      borderBottom: '1px solid var(--admin-border)'
                    }}
                    onMouseEnter={(e) => !isSelected && (e.currentTarget.style.background = 'var(--admin-bg)')}
                    onMouseLeave={(e) => !isSelected && (e.currentTarget.style.background = 'transparent')}
                    onClick={() => {
                      onChange(optId)
                      setIsOpen(false)
                      setSearch('')
                    }}
                  >
                    <div style={{ fontWeight: isSelected ? 700 : 500, color: isSelected ? 'var(--admin-primary, #00A88C)' : 'var(--admin-text)' }}>
                      {opt.name}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function CommissionReportPage() {
  const queryClient = useQueryClient()
  const [updating, setUpdating] = useState(null)
  const [bulking, setBulking] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [search, setSearch] = useState('')
  
  // Instant Auto-Filters
  const [filters, setFilters] = useState({
    doctor_id: '',
    hospital_id: '',
    date_from: '',
    date_to: '',
    month: '',
    year: new Date().getFullYear(),
    status: '',
    commission_source: '',
    payment_method: ''
  })

  const [selectedAppointments, setSelectedAppointments] = useState([])
  const [showMemo, setShowMemo] = useState(false)
  const [memoScope, setMemoScope] = useState('all') // 'all' or 'selected'

  // Enterprise Settlement & Reversal Modal States
  const [showSettleModal, setShowSettleModal] = useState(false)
  const [settleTargetAppointments, setSettleTargetAppointments] = useState([])
  const [settleMethod, setSettleMethod] = useState('Bank Transfer')
  const [settleNote, setSettleNote] = useState('')

  const [showRevertModal, setShowRevertModal] = useState(false)
  const [revertTargetAppointments, setRevertTargetAppointments] = useState([])
  const [revertNote, setRevertNote] = useState('')

  const [perPage, setPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  // Memoized query params for instant auto-refetching
  const queryParams = useMemo(() => {
    const params = {}
    if (filters.doctor_id) params.doctor_id = filters.doctor_id
    if (filters.hospital_id) params.hospital_id = filters.hospital_id
    if (filters.date_from) params.date_from = filters.date_from
    if (filters.date_to) params.date_to = filters.date_to
    if (filters.month) params.month = filters.month
    if (filters.year) params.year = filters.year
    if (filters.status) params.commission_status = filters.status
    if (filters.commission_source) params.commission_source = filters.commission_source
    if (filters.payment_method) params.payment_method = filters.payment_method
    return params
  }, [filters])

  const { data: doctors = [] } = useQuery({
    queryKey: ['admin-doctors-commission-list'],
    queryFn: async () => {
      const res = await getDoctors({ per_page: 500, admin_view: 1 })
      const raw = res.data?.data || res.data
      return Array.isArray(raw) ? raw : (raw?.data || [])
    },
    staleTime: 5 * 60 * 1000,
  })

  const { data: hospitals = [] } = useQuery({
    queryKey: ['admin-hospitals-commission-list'],
    queryFn: async () => {
      const res = await getHospitals({ per_page: 500 })
      const raw = res.data?.data || res.data
      return Array.isArray(raw) ? raw : (raw?.data || [])
    },
    staleTime: 5 * 60 * 1000,
  })

  const {
    data: report = { data: [], summary: {} },
    isLoading: loading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: queryKeys.commissions.commissionReport(queryParams),
    queryFn: async () => {
      const res = await getCommissionReport(queryParams)
      const reportData = res.data?.data?.data || res.data?.data || res.data?.commissions || (Array.isArray(res.data) ? res.data : [])
      const reportSummary = res.data?.summary || res.data?.stats || {}
      return { data: reportData, summary: reportSummary }
    },
    staleTime: 60 * 1000,
  })

  const data = report.data
  const summary = report.summary

  const selectedDoctor = (Array.isArray(doctors) ? doctors : []).find(d => 
    d && (String(d.id) === String(filters.doctor_id) || (d.public_id && String(d.public_id) === String(filters.doctor_id)))
  )
  const selectedHospital = (Array.isArray(hospitals) ? hospitals : []).find(h => 
    h && (String(h.id) === String(filters.hospital_id) || (h.public_id && String(h.public_id) === String(filters.hospital_id)))
  )

  // Instant Client-side Search Filter (Patient name, doctor name, Public ID, Reg ID, Mobile)
  const filteredData = useMemo(() => {
    if (!search.trim()) return data
    const q = search.toLowerCase()
    return data.filter(row => 
      (row.patient_name && row.patient_name.toLowerCase().includes(q)) ||
      (row.doctor_name && row.doctor_name.toLowerCase().includes(q)) ||
      (row.public_id && row.public_id.toLowerCase().includes(q)) ||
      (row.registration_id && String(row.registration_id).includes(q)) ||
      (row.booking_phone && String(row.booking_phone).includes(q)) ||
      (row.patient_phone && String(row.patient_phone).includes(q))
    )
  }, [data, search])

  // Calculate selected total amounts
  const selectedItems = filteredData.filter(item => selectedAppointments.includes(item.id))
  const selectedUnpaidItems = selectedItems.filter(item => (item.commission_status || 'unpaid').toLowerCase() !== 'paid')
  const selectedPaidItems = selectedItems.filter(item => (item.commission_status || '').toLowerCase() === 'paid')
  const selectedTotalCommission = selectedItems.reduce((acc, cur) => acc + Number(cur.commission_amount || 0), 0)
  const selectedTdsEstimate = Math.round(selectedTotalCommission * 0.10 * 100) / 100
  const selectedNetPayable = Math.max(0, Math.round((selectedTotalCommission - selectedTdsEstimate) * 100) / 100)

  // Target items for Settlement Modal (single appointment or bulk selection)
  const activeSettleIds = settleTargetAppointments.length > 0 ? settleTargetAppointments : selectedAppointments
  const activeSettleItems = filteredData.filter(item => activeSettleIds.includes(item.id))
  const activeSettleTotalCommission = activeSettleItems.reduce((acc, cur) => acc + Number(cur.commission_amount || 0), 0)
  const activeSettleTdsEstimate = Math.round(activeSettleTotalCommission * 0.10 * 100) / 100
  const activeSettleNetPayable = Math.max(0, Math.round((activeSettleTotalCommission - activeSettleTdsEstimate) * 100) / 100)

  // Target items for Reversal Modal (single appointment or bulk selection)
  const activeRevertIds = revertTargetAppointments.length > 0 ? revertTargetAppointments : selectedAppointments
  const activeRevertItems = filteredData.filter(item => activeRevertIds.includes(item.id))
  const activeRevertTotalCommission = activeRevertItems.reduce((acc, cur) => acc + Number(cur.commission_amount || 0), 0)

  useEffect(() => {
    setCurrentPage(1)
  }, [filteredData.length])

  const paginatedData = filteredData.slice((currentPage - 1) * perPage, currentPage * perPage)

  const clearAllFilters = () => {
    setFilters({
      doctor_id: '',
      hospital_id: '',
      date_from: '',
      date_to: '',
      month: '',
      year: new Date().getFullYear(),
      status: '',
      commission_source: '',
      payment_method: ''
    })
    setSelectedAppointments([])
  }

  // Active Filter Chips List for ListToolbar
  const activeFilters = useMemo(() => {
    const chips = []
    if (filters.doctor_id) {
      chips.push({
        key: 'doctor',
        label: `Doctor: ${selectedDoctor?.name || filters.doctor_id}`,
        onRemove: () => setFilters(prev => ({ ...prev, doctor_id: '' }))
      })
    }
    if (filters.hospital_id) {
      chips.push({
        key: 'hospital',
        label: `Hospital: ${selectedHospital?.name || filters.hospital_id}`,
        onRemove: () => setFilters(prev => ({ ...prev, hospital_id: '' }))
      })
    }
    if (filters.status) {
      chips.push({
        key: 'status',
        label: `Status: ${filters.status.toUpperCase()}`,
        onRemove: () => setFilters(prev => ({ ...prev, status: '' }))
      })
    }
    if (filters.commission_source) {
      chips.push({
        key: 'source',
        label: `Source: ${filters.commission_source === 'manager' ? 'Counter Cash' : 'Patient Online'}`,
        onRemove: () => setFilters(prev => ({ ...prev, commission_source: '' }))
      })
    }
    if (filters.payment_method) {
      chips.push({
        key: 'payment_method',
        label: `Method: ${filters.payment_method.toUpperCase()}`,
        onRemove: () => setFilters(prev => ({ ...prev, payment_method: '' }))
      })
    }
    if (filters.date_from) {
      chips.push({
        key: 'date_from',
        label: `From: ${filters.date_from}`,
        onRemove: () => setFilters(prev => ({ ...prev, date_from: '' }))
      })
    }
    if (filters.date_to) {
      chips.push({
        key: 'date_to',
        label: `To: ${filters.date_to}`,
        onRemove: () => setFilters(prev => ({ ...prev, date_to: '' }))
      })
    }
    if (filters.month) {
      const monthObj = MONTHS.find(m => String(m.value) === String(filters.month))
      chips.push({
        key: 'month',
        label: `Month: ${monthObj?.label || filters.month}`,
        onRemove: () => setFilters(prev => ({ ...prev, month: '' }))
      })
    }
    return chips
  }, [filters, selectedDoctor, selectedHospital])

  const handleUpdateStatus = async (id, status) => {
    setUpdating(id)
    try {
      await updateAppointment(id, { commission_status: status })
      toast.success(`Commission status updated to ${status}`)
      queryClient.invalidateQueries({ queryKey: queryKeys.commissions.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all })
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update commission status'))
    } finally {
      setUpdating(null)
    }
  }

  const openSettleModal = (ids = null) => {
    const targets = ids && ids.length > 0 ? ids : selectedAppointments
    if (targets.length === 0) {
      toast.error('Please select at least one appointment to settle')
      return
    }
    setSettleTargetAppointments(targets)
    setShowSettleModal(true)
  }

  const openRevertModal = (ids = null) => {
    const targets = ids && ids.length > 0 ? ids : selectedAppointments
    if (targets.length === 0) {
      toast.error('Please select at least one appointment to revert')
      return
    }
    setRevertTargetAppointments(targets)
    setShowRevertModal(true)
  }

  const handleBulkUpdate = async (status, meta = {}) => {
    const targets = status === 'paid' ? activeSettleIds : activeRevertIds
    if (targets.length === 0) return
    setBulking(true)
    try {
      const payload = {
        appointment_ids: targets,
        status: status,
        commission_status: status,
        payment_method: meta.method || 'Bank Transfer',
        reference_note: meta.note || (status === 'paid' ? 'Settled via Admin Portal' : 'Reversed via Admin Portal')
      }
      const res = await bulkUpdateCommissionStatus(payload)
      toast.success(res.data?.message || `Successfully updated ${targets.length} appointment(s)`)
      queryClient.invalidateQueries({ queryKey: queryKeys.commissions.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all })
      setSelectedAppointments(prev => prev.filter(id => !targets.includes(id)))
      setShowSettleModal(false)
      setShowRevertModal(false)
      setSettleNote('')
      setRevertNote('')
      setSettleTargetAppointments([])
      setRevertTargetAppointments([])
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update commission status'))
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
    if (selectedAppointments.length === filteredData.length) {
      setSelectedAppointments([])
    } else {
      setSelectedAppointments(filteredData.map(d => d.id))
    }
  }

  // Data to pass to memo based on scope
  const memoActiveData = memoScope === 'selected' ? selectedItems : filteredData
  const memoActiveSummary = memoScope === 'selected' ? {
    total_commission: selectedTotalCommission,
    total_billed: selectedItems.reduce((acc, cur) => acc + Number(cur.amount || 0), 0),
    total_fees: selectedItems.reduce((acc, cur) => acc + Number(cur.amount || 0), 0),
    total_count: selectedItems.length,
    total_appointments: selectedItems.length
  } : summary

  return (
    <div className="admin-container">
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title" style={{ color: 'var(--admin-text)' }}>
            <span style={{ marginRight: 12 }}>🧾</span>
            Commission Settlement Report
          </h2>
          <p className="admin-page-subtitle" style={{ color: 'var(--admin-text-muted)' }}>
            Analyze earned appointment commissions, payout status, and execute enterprise settlements
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
        <div style={{ background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', borderRadius: 16, padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase' }}>Total Commission</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#00A88C', marginTop: 4 }}>৳{Number(summary.total_commission || 0).toLocaleString()}</div>
        </div>
        <div style={{ background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', borderRadius: 16, padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase' }}>Total Booking Fees</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#10B981', marginTop: 4 }}>৳{Number(summary.total_billed || summary.total_fees || 0).toLocaleString()}</div>
        </div>
        <div style={{ background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', borderRadius: 16, padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase' }}>Total Appointments</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#3B82F6', marginTop: 4 }}>{summary.total_count ?? (summary.total_appointments ?? filteredData.length)}</div>
        </div>
      </div>

      {/* Unified ListToolbar — Patient Payments Pattern with Instant Reactive Filters */}
      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by patient, doctor, appointment ID..."
        onRefresh={() => refetch()}
        refreshing={isFetching}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(p => !p)}
        hasActiveFilters={activeFilters.length > 0}
        onClearFilters={clearAllFilters}
        filterCount={activeFilters.length}
        activeFilters={activeFilters}
      >
        <div style={{ flex: '2 1 240px', minWidth: 240 }}>
          <SearchableSelect 
            label="Doctor" 
            options={doctors} 
            value={filters.doctor_id} 
            onChange={val => setFilters(prev => ({ ...prev, doctor_id: val }))} 
            placeholder="All Doctors" 
            minWidth={240}
          />
        </div>
        <div style={{ flex: '2 1 240px', minWidth: 240 }}>
          <SearchableSelect 
            label="Hospital" 
            options={hospitals} 
            value={filters.hospital_id} 
            onChange={val => setFilters(prev => ({ ...prev, hospital_id: val }))} 
            placeholder="All Hospitals" 
            minWidth={240}
          />
        </div>
        <div style={{ minWidth: 130 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>Payment Status</label>
          <select 
            value={filters.status} 
            onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}
            style={{ width: '100%', height: 38, padding: '0 10px', borderRadius: 8, border: '1px solid var(--admin-border)', background: 'var(--admin-card-bg)', color: 'var(--admin-text)', fontSize: 13 }}
          >
            <option value="">All Statuses</option>
            <option value="unpaid">UNPAID / PENDING</option>
            <option value="paid">PAID</option>
          </select>
        </div>
        <div style={{ minWidth: 140 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>Booking Source</label>
          <select 
            value={filters.commission_source} 
            onChange={e => setFilters(prev => ({ ...prev, commission_source: e.target.value }))}
            style={{ width: '100%', height: 38, padding: '0 10px', borderRadius: 8, border: '1px solid var(--admin-border)', background: 'var(--admin-card-bg)', color: 'var(--admin-text)', fontSize: 13 }}
          >
            <option value="">All Sources</option>
            <option value="manager">Hospital Counter (Cash)</option>
            <option value="patient">Direct Patient (Online)</option>
          </select>
        </div>
        <div style={{ minWidth: 140 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>Payment Method</label>
          <select 
            value={filters.payment_method} 
            onChange={e => setFilters(prev => ({ ...prev, payment_method: e.target.value }))}
            style={{ width: '100%', height: 38, padding: '0 10px', borderRadius: 8, border: '1px solid var(--admin-border)', background: 'var(--admin-card-bg)', color: 'var(--admin-text)', fontSize: 13 }}
          >
            <option value="">All Methods</option>
            <option value="cash">Cash (Counter)</option>
            <option value="bkash">bKash</option>
            <option value="nagad">Nagad</option>
            <option value="sslcommerz">Online / Card (SSL)</option>
          </select>
        </div>
        <div style={{ minWidth: 120 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>Month</label>
          <select 
            value={filters.month} 
            onChange={e => setFilters(prev => ({ ...prev, month: e.target.value }))}
            style={{ width: '100%', height: 38, padding: '0 10px', borderRadius: 8, border: '1px solid var(--admin-border)', background: 'var(--admin-card-bg)', color: 'var(--admin-text)', fontSize: 13 }}
          >
            <option value="">All Months</option>
            {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
        <div style={{ minWidth: 90 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>Year</label>
          <input 
            type="number" 
            value={filters.year} 
            onChange={e => setFilters(prev => ({ ...prev, year: e.target.value }))}
            style={{ width: '100%', height: 38, padding: '0 10px', borderRadius: 8, border: '1px solid var(--admin-border)', background: 'var(--admin-card-bg)', color: 'var(--admin-text)', fontSize: 13 }}
          />
        </div>
        <div style={{ minWidth: 130 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>Date From</label>
          <input 
            type="date" 
            value={filters.date_from} 
            onChange={e => setFilters(prev => ({ ...prev, date_from: e.target.value }))}
            style={{ width: '100%', height: 38, padding: '0 10px', borderRadius: 8, border: '1px solid var(--admin-border)', background: 'var(--admin-card-bg)', color: 'var(--admin-text)', fontSize: 13 }}
          />
        </div>
        <div style={{ minWidth: 130 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>Date To</label>
          <input 
            type="date" 
            value={filters.date_to} 
            onChange={e => setFilters(prev => ({ ...prev, date_to: e.target.value }))}
            style={{ width: '100%', height: 38, padding: '0 10px', borderRadius: 8, border: '1px solid var(--admin-border)', background: 'var(--admin-card-bg)', color: 'var(--admin-text)', fontSize: 13 }}
          />
        </div>
      </ListToolbar>

      {/* Main Table Card */}
      <div className="admin-card">
        <div className="admin-card-header" style={{ background: 'var(--admin-bg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <h3 className="admin-card-title">Commission Breakdown</h3>
            {selectedAppointments.length > 0 && (
              <div style={{ display: 'flex', gap: 8, animation: 'fadeIn 0.2s', alignItems: 'center' }}>
                <button 
                  className="admin-btn admin-btn-sm" 
                  style={{ 
                    background: selectedUnpaidItems.length > 0 ? '#10B981' : 'var(--admin-bg)', 
                    color: selectedUnpaidItems.length > 0 ? '#ffffff' : 'var(--admin-text-muted)', 
                    border: selectedUnpaidItems.length > 0 ? 'none' : '1px solid var(--admin-border)',
                    opacity: selectedUnpaidItems.length > 0 ? 1 : 0.5,
                    cursor: selectedUnpaidItems.length > 0 && !bulking ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 
                  }}
                  onClick={() => selectedUnpaidItems.length > 0 && openSettleModal(selectedUnpaidItems.map(i => i.id))}
                  disabled={bulking || selectedUnpaidItems.length === 0}
                  title={selectedUnpaidItems.length === 0 ? 'No unpaid appointments selected' : undefined}
                >
                  <ShieldCheck size={15} />
                  Mark {selectedUnpaidItems.length > 0 ? selectedUnpaidItems.length : ''} as Paid
                </button>
                <button 
                  className="admin-btn admin-btn-sm" 
                  style={{ 
                    background: selectedPaidItems.length > 0 ? '#EF4444' : 'var(--admin-bg)', 
                    color: selectedPaidItems.length > 0 ? '#ffffff' : 'var(--admin-text-muted)', 
                    border: selectedPaidItems.length > 0 ? 'none' : '1px solid var(--admin-border)',
                    opacity: selectedPaidItems.length > 0 ? 1 : 0.5,
                    cursor: selectedPaidItems.length > 0 && !bulking ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 
                  }}
                  onClick={() => selectedPaidItems.length > 0 && openRevertModal(selectedPaidItems.map(i => i.id))}
                  disabled={bulking || selectedPaidItems.length === 0}
                  title={selectedPaidItems.length === 0 ? 'No paid appointments selected' : undefined}
                >
                  <RotateCcw size={14} />
                  Mark {selectedPaidItems.length > 0 ? selectedPaidItems.length : ''} as Unpaid
                </button>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-text-muted)', marginLeft: 4 }}>
                  (Total Selected: ৳{selectedTotalCommission.toLocaleString()})
                </span>
              </div>
            )}
          </div>
          
          {/* Smart Filter-Wise / Selected-Wise Memo Actions */}
          <div style={{ display: 'flex', gap: 8 }}>
            {selectedAppointments.length > 0 && (
              <button 
                className="admin-btn admin-btn-sm" 
                style={{ background: '#00A88C', color: '#ffffff', fontWeight: 700 }}
                onClick={() => {
                  setMemoScope('selected')
                  setShowMemo(true)
                }}
              >
                📋 Memo for Selected ({selectedAppointments.length})
              </button>
            )}
            <button 
              className="admin-btn admin-btn-outline" 
              onClick={() => {
                setMemoScope('all')
                setShowMemo(true)
              }}
              disabled={filteredData.length === 0}
            >
              📋 Generate Memo ({filteredData.length})
            </button>
          </div>
        </div>

        <div className="admin-card-body" style={{ padding: 0 }}>
          {loading ? (
            <div className="admin-loading" style={{ padding: 60 }}><div className="admin-spinner" /> Loading report...</div>
          ) : filteredData.length === 0 ? (
            <div className="admin-empty" style={{ padding: 60 }}><h4 style={{ color: 'var(--admin-text)' }}>No records found for selected filters</h4></div>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ paddingLeft: 24, width: 40 }}>
                      <input type="checkbox" checked={selectedAppointments.length > 0 && selectedAppointments.length === filteredData.length} onChange={toggleSelectAll} />
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
                  {paginatedData.map(row => (
                    <tr key={row.id}>
                      <td style={{ paddingLeft: 24 }}>
                        <input type="checkbox" checked={selectedAppointments.includes(row.id)} onChange={() => toggleSelect(row.id)} />
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--admin-text)' }}>{row.date}</td>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--admin-text)' }}>{row.patient_name || 'Patient'}</div>
                        <div style={{ marginTop: 2 }}>
                          <CompactUlid 
                            value={row.public_id || row.registration_id} 
                            style={{ fontSize: 11, color: 'var(--admin-text-muted)', fontFamily: 'monospace' }} 
                          />
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                          <span style={{ 
                             fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 6, textTransform: 'capitalize',
                             background: row.created_by_role === 'manager' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                             color: row.created_by_role === 'manager' ? '#F59E0B' : '#3B82F6'
                          }}>
                             {row.created_by_role === 'manager' ? 'hospital' : (row.created_by_role || 'patient')}
                          </span>
                          {(row.booking_phone || row.patient_phone) && (
                            <span style={{ fontSize: 11, color: 'var(--admin-text-muted)', fontFamily: 'monospace', fontWeight: 600 }}>
                              {row.booking_phone || row.patient_phone}
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--admin-text)' }}>৳{row.amount}</td>
                      <td style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>{row.commission_rate}%</td>
                      <td style={{ fontWeight: 800, color: 'var(--admin-primary)' }}>৳{row.commission_amount}</td>
                      <td style={{ textAlign: 'right', paddingRight: 24 }}>
                        <select 
                          className="status-select" 
                          value={row.commission_status} 
                          disabled={updating === row.id || bulking}
                          title={row.commission_status === 'paid' && row.commission_note ? `Settlement Note: ${row.commission_note}` : undefined}
                          onChange={(e) => {
                            const nextVal = e.target.value
                            if (nextVal === 'paid') {
                              openSettleModal([row.id])
                            } else {
                              openRevertModal([row.id])
                            }
                          }}
                          style={{ 
                            background: row.commission_status === 'paid' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: row.commission_status === 'paid' ? '#10B981' : '#EF4444',
                            border: 'none', fontWeight: 800, cursor: 'pointer'
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

      {/* Bottom Pagination */}
      {(() => {
        const totalPages = Math.ceil(filteredData.length / perPage)
        if (filteredData.length === 0) return null
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
              Showing <strong>{filteredData.length === 0 ? 0 : (currentPage - 1) * perPage + 1}</strong>–<strong>{Math.min(currentPage * perPage, filteredData.length)}</strong> of <strong>{filteredData.length}</strong> entries
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

      {/* Enterprise Settlement Confirmation Modal */}
      {showSettleModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div style={{
            background: 'var(--admin-card-bg)', borderRadius: 16,
            maxWidth: 500, width: '100%', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid var(--admin-border)', overflow: 'hidden', animation: 'scaleUp 0.2s ease-out'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '18px 24px', borderBottom: '1px solid var(--admin-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'rgba(16, 185, 129, 0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, background: '#10B981',
                  color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--admin-text)' }}>Disburse & Settle Commission</h4>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--admin-text-muted)' }}>Double-entry ledger settlement workflow</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowSettleModal(false)
                  setSettleTargetAppointments([])
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--admin-text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: 24 }}>
              {/* Financial Summary Card */}
              <div style={{
                background: 'var(--admin-bg)', borderRadius: 12, padding: 16,
                border: '1px solid var(--admin-border)', marginBottom: 20
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                  <span style={{ color: 'var(--admin-text-muted)' }}>Target Records:</span>
                  <span style={{ fontWeight: 700, color: 'var(--admin-text)' }}>{activeSettleIds.length} record(s)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                  <span style={{ color: 'var(--admin-text-muted)' }}>Gross Commission Due:</span>
                  <span style={{ fontWeight: 700, color: 'var(--admin-text)' }}>৳{activeSettleTotalCommission.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                  <span style={{ color: '#F59E0B' }}>NBR 10% TDS Withholding:</span>
                  <span style={{ fontWeight: 700, color: '#F59E0B' }}>- ৳{activeSettleTdsEstimate.toLocaleString()}</span>
                </div>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', paddingTop: 8,
                  borderTop: '1px dashed var(--admin-border)', fontSize: 15, fontWeight: 800
                }}>
                  <span style={{ color: '#10B981' }}>Net Settlement Disbursed:</span>
                  <span style={{ color: '#10B981' }}>৳{activeSettleNetPayable.toLocaleString()}</span>
                </div>
              </div>

              {/* Form Fields */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 6 }}>
                  Payment Method
                </label>
                <select
                  value={settleMethod}
                  onChange={e => setSettleMethod(e.target.value)}
                  className="admin-form-select"
                  style={{ width: '100%', height: 40 }}
                >
                  <option value="Bank Transfer">Bank Transfer (BEFTN / NPSB)</option>
                  <option value="bKash Commercial">bKash Commercial Payout</option>
                  <option value="Nagad">Nagad Disbursement</option>
                  <option value="Cash">Cash Handover</option>
                  <option value="Cheque">Bank Cheque</option>
                  <option value="Ledger Offset">Wallet Balance Offset</option>
                </select>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 6 }}>
                  Voucher / Reference Note (Optional)
                </label>
                <input
                  type="text"
                  className="admin-form-input"
                  placeholder="e.g. Bank Trx ID / Check # / Voucher ID"
                  value={settleNote}
                  onChange={e => setSettleNote(e.target.value)}
                  style={{ width: '100%', height: 40 }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="admin-btn admin-btn-outline"
                  onClick={() => {
                    setShowSettleModal(false)
                    setSettleTargetAppointments([])
                  }}
                  disabled={bulking}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn-primary"
                  style={{ background: '#10B981', borderColor: '#10B981', display: 'flex', alignItems: 'center', gap: 8 }}
                  onClick={() => handleBulkUpdate('paid', { method: settleMethod, note: settleNote })}
                  disabled={bulking}
                >
                  {bulking ? (
                    <>Processing Settlement...</>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      Confirm & Mark Paid
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enterprise Reversal Confirmation Modal */}
      {showRevertModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div style={{
            background: 'var(--admin-card-bg)', borderRadius: 16,
            maxWidth: 480, width: '100%', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid var(--admin-border)', overflow: 'hidden', animation: 'scaleUp 0.2s ease-out'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '18px 24px', borderBottom: '1px solid var(--admin-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'rgba(239, 68, 68, 0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, background: '#EF4444',
                  color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--admin-text)' }}>Confirm Commission Reversal</h4>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--admin-text-muted)' }}>Revert settled status back to unpaid</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowRevertModal(false)
                  setRevertTargetAppointments([])
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--admin-text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: 24 }}>
              <div style={{
                background: 'rgba(239, 68, 68, 0.05)', borderRadius: 12, padding: 16,
                border: '1px solid rgba(239, 68, 68, 0.2)', marginBottom: 20
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                  <span style={{ color: 'var(--admin-text-muted)' }}>Target Records:</span>
                  <span style={{ fontWeight: 700, color: 'var(--admin-text)' }}>{activeRevertIds.length} record(s)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--admin-text-muted)' }}>Total Commission Reverting:</span>
                  <span style={{ fontWeight: 800, color: '#EF4444' }}>৳{activeRevertTotalCommission.toLocaleString()}</span>
                </div>
              </div>

              <p style={{ fontSize: 13, color: 'var(--admin-text)', marginBottom: 16, lineHeight: 1.5 }}>
                Are you sure you want to revert these record(s) back to <strong>Unpaid / Pending</strong>? This will restore the receivable balance in doctor and hospital financial statements.
              </p>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 6 }}>
                  Reversal Reason / Reference (Optional)
                </label>
                <input
                  type="text"
                  className="admin-form-input"
                  placeholder="e.g. Accidental mark / Cheque returned"
                  value={revertNote}
                  onChange={e => setRevertNote(e.target.value)}
                  style={{ width: '100%', height: 40 }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="admin-btn admin-btn-outline"
                  onClick={() => {
                    setShowRevertModal(false)
                    setRevertTargetAppointments([])
                  }}
                  disabled={bulking}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn-primary"
                  style={{ background: '#EF4444', borderColor: '#EF4444', display: 'flex', alignItems: 'center', gap: 8 }}
                  onClick={() => handleBulkUpdate('unpaid', { note: revertNote })}
                  disabled={bulking}
                >
                  {bulking ? (
                    <>Reversing...</>
                  ) : (
                    <>
                      <RotateCcw size={16} />
                      Confirm & Mark Unpaid
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showMemo && (
        <CommissionMemo 
          show={showMemo} 
          onClose={() => setShowMemo(false)} 
          data={memoActiveData} 
          summary={memoActiveSummary} 
          filters={queryParams}
          doctor={selectedDoctor}
          hospital={selectedHospital}
        />
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .admin-container { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleUp { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `}} />
    </div>
  )
}
