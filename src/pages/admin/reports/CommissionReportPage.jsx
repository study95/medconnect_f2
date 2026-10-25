// CommissionReportPage.jsx — Admin Commission Report & Request-Wise Approval Inbox
import { useState, useEffect, useRef, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { 
  CheckCircle2, ShieldCheck, X, AlertTriangle, RotateCcw, 
  Layers, Stethoscope, Building2, Eye, Search, Filter, 
  Clock, ArrowUpRight, Check, ChevronRight, FileText, Smartphone,
  CreditCard, ExternalLink, Calendar, CheckCheck, ChevronDown, ChevronUp
} from 'lucide-react'
import toast from 'react-hot-toast'
import { 
  getCommissionReport, getDoctors, getHospitals, updateAppointment, 
  bulkUpdateCommissionStatus, getCommissionRequests, getCommissionRequestDetails,
  approveCommissionRequest, rejectCommissionRequest 
} from '../../../api/adminApi'
import { queryKeys } from '../../../lib/queryKeys'
import { getErrorMessage } from '../../../utils/errorHelper'
import CommissionMemo from './CommissionMemo'
import CompactUlid from '../../../components/common/CompactUlid'

const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return String(dateStr)
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return String(dateStr)
  }
}

const MONTHS = [
  { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
  { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
  { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
  { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' }
]

// Custom Searchable Dropdown Component (Premium Select)
function SearchableSelect({ label, options = [], value = '', onChange, placeholder, disabled = false, minWidth = 130, height = 32, fontSize = 12 }) {
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

  const isSelectedInactive = selectedOption && (selectedOption.is_active === false || selectedOption.is_active === 0 || selectedOption.is_active === '0')

  const filteredOptions = safeOptions
    .filter(opt => opt && opt.name && opt.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const aInactive = (a.is_active === false || a.is_active === 0 || a.is_active === '0') ? 1 : 0
      const bInactive = (b.is_active === false || b.is_active === 0 || b.is_active === '0') ? 1 : 0
      if (aInactive !== bInactive) return aInactive - bInactive // Active (0) first, Inactive (1) last
      return (a.name || '').localeCompare(b.name || '')
    })

  return (
    <div className="searchable-select-container" ref={dropdownRef} style={{ position: 'relative', flex: '1 1 130px', minWidth: minWidth, width: '100%', opacity: disabled ? 0.6 : 1 }}>
      <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--admin-text-muted)', display: 'block', marginBottom: 3, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{label}</label>
      <div 
        className="status-select" 
        style={{ 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
          cursor: disabled ? 'not-allowed' : 'pointer', background: disabled ? 'var(--admin-bg)' : 'var(--admin-card-bg)', 
          height: height || 32, padding: '0 8px', border: '1px solid var(--admin-border)', borderRadius: 6, 
          fontSize: fontSize || 12, fontWeight: 500, boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', transition: 'all 0.2s',
          userSelect: 'none'
        }}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span style={{ color: selectedOption ? 'var(--admin-text)' : 'var(--admin-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedOption ? `${selectedOption.name}${isSelectedInactive ? ' [Inactive]' : ''}` : placeholder}
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
                const isOptInactive = opt.is_active === false || opt.is_active === 0 || opt.is_active === '0'

                return (
                  <div 
                    key={optId} 
                    style={{ 
                      padding: '7px 12px', fontSize: 12, cursor: 'pointer', 
                      background: isSelected ? 'rgba(0, 168, 140, 0.1)' : 'transparent',
                      borderBottom: '1px solid var(--admin-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8
                    }}
                    onMouseEnter={(e) => !isSelected && (e.currentTarget.style.background = 'var(--admin-bg)')}
                    onMouseLeave={(e) => !isSelected && (e.currentTarget.style.background = 'transparent')}
                    onClick={() => {
                      onChange(optId)
                      setIsOpen(false)
                      setSearch('')
                    }}
                  >
                    <div style={{
                      fontWeight: isSelected ? 700 : 500,
                      color: isSelected ? 'var(--admin-primary, #00A88C)' : (isOptInactive ? 'var(--admin-text-muted)' : 'var(--admin-text)'),
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {opt.name}
                    </div>
                    {isOptInactive && (
                      <span style={{
                        fontSize: 9.5,
                        fontWeight: 800,
                        color: '#DC2626',
                        background: 'rgba(220, 38, 38, 0.08)',
                        border: '1px solid rgba(220, 38, 38, 0.25)',
                        padding: '1px 6px',
                        borderRadius: 4,
                        letterSpacing: '0.02em',
                        whiteSpace: 'nowrap',
                        flexShrink: 0
                      }}>
                        Inactive
                      </span>
                    )}
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

  // Enterprise Settlement, Reversal & Rejection Modal States
  const [showSettleModal, setShowSettleModal] = useState(false)
  const [settleTargetAppointments, setSettleTargetAppointments] = useState([])
  const [settleMethod, setSettleMethod] = useState('Bank Transfer')
  const [settleNote, setSettleNote] = useState('')

  const [showRevertModal, setShowRevertModal] = useState(false)
  const [revertTargetAppointments, setRevertTargetAppointments] = useState([])
  const [revertNote, setRevertNote] = useState('')

  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectTargetAppointments, setRejectTargetAppointments] = useState([])
  const [rejectNote, setRejectNote] = useState('')

  const [perPage, setPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  // View Mode: 'requests' (Batch Verification Inbox) or 'appointments' (Individual Consultation Breakdown)
  const [activeTab, setActiveTab] = useState('requests')
  const [requestFilterStatus, setRequestFilterStatus] = useState('pending') // 'pending', 'approved', 'rejected', 'all'
  const [requestSearch, setRequestSearch] = useState('')
  const [requestProviderType, setRequestProviderType] = useState('all') // 'all', 'doctor', 'hospital'

  // Modals for Request-Wise actions
  const [viewingRequest, setViewingRequest] = useState(null)
  const [viewingRequestLoading, setViewingRequestLoading] = useState(false)
  const [viewingRequestDetails, setViewingRequestDetails] = useState(null)

  const [approveRequestTarget, setApproveRequestTarget] = useState(null)
  const [approveRequestNote, setApproveRequestNote] = useState('')
  const [approvingRequest, setApprovingRequest] = useState(false)

  const [rejectRequestTarget, setRejectRequestTarget] = useState(null)
  const [rejectRequestReason, setRejectRequestReason] = useState('')
  const [rejectingRequest, setRejectingRequest] = useState(false)
  const [isManualRefreshing, setIsManualRefreshing] = useState(false)

  // Query for Payment Verification Requests (Batch View)
  const {
    data: requestsData = { data: [], stats: {} },
    isLoading: requestsLoading,
    isFetching: requestsFetching,
    refetch: refetchRequests,
  } = useQuery({
    queryKey: ['admin-commission-requests', requestFilterStatus, requestProviderType, requestSearch],
    queryFn: async () => {
      const res = await getCommissionRequests({
        status: requestFilterStatus,
        provider_type: requestProviderType,
        search: requestSearch || undefined,
      })
      return res.data || { data: [], stats: {} }
    },
    staleTime: 30 * 1000,
  })

  const requestList = Array.isArray(requestsData.data) ? requestsData.data : []
  const requestStats = requestsData.stats || {}

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
      const res = await getHospitals({ per_page: 500, admin_view: 1 })
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
  const summary = report.summary || {}
  const runningMonth = summary?.running_month || {
    month_name: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    total_commission: 0,
    total_count: 0,
    paid_commission: 0,
    paid_count: 0,
    verifying_commission: 0,
    verifying_count: 0,
    due_commission: 0,
    due_count: 0,
  }

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
  const selectedVerifyingItems = selectedItems.filter(item => (item.commission_status || '').toLowerCase() === 'verifying')
  const selectedUnpaidItems = selectedItems.filter(item => {
    const s = (item.commission_status || 'unpaid').toLowerCase()
    return s !== 'paid' && s !== 'verifying'
  })
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

  // Target items for Verification Rejection Modal
  const activeRejectIds = rejectTargetAppointments.length > 0 ? rejectTargetAppointments : selectedAppointments
  const activeRejectItems = filteredData.filter(item => activeRejectIds.includes(item.id))
  const activeRejectTotalCommission = activeRejectItems.reduce((acc, cur) => acc + Number(cur.commission_amount || 0), 0)

  useEffect(() => {
    setCurrentPage(1)
  }, [filteredData.length])

  const paginatedData = filteredData.slice((currentPage - 1) * perPage, currentPage * perPage)

  const handleRefreshAll = async () => {
    setIsManualRefreshing(true)
    try {
      await Promise.all([
        refetch(),
        refetchRequests(),
        queryClient.invalidateQueries({ queryKey: ['admin-commission-requests'] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.commissions.all }),
        queryClient.invalidateQueries({ queryKey: ['admin-doctors-commission-list'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-hospitals-commission-list'] })
      ])
      toast.success('সব কমিশন ও রিকোয়েস্ট ডাটা রিফ্রেশ করা হয়েছে!', { id: 'commission-refresh-toast', duration: 2500 })
    } catch (err) {
      toast.error(getErrorMessage(err, 'রিফ্রেশ ব্যর্থ হয়েছে'), { id: 'commission-refresh-toast' })
    } finally {
      setTimeout(() => setIsManualRefreshing(false), 500)
    }
  }

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
      const isDocInactive = selectedDoctor && (selectedDoctor.is_active === false || selectedDoctor.is_active === 0 || selectedDoctor.is_active === '0')
      chips.push({
        key: 'doctor',
        label: `Doctor: ${selectedDoctor?.name || filters.doctor_id}${isDocInactive ? ' [Inactive]' : ''}`,
        onRemove: () => setFilters(prev => ({ ...prev, doctor_id: '' }))
      })
    }
    if (filters.hospital_id) {
      const isHospInactive = selectedHospital && (selectedHospital.is_active === false || selectedHospital.is_active === 0 || selectedHospital.is_active === '0')
      chips.push({
        key: 'hospital',
        label: `Hospital: ${selectedHospital?.name || filters.hospital_id}${isHospInactive ? ' [Inactive]' : ''}`,
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

  const openRejectModal = (ids = null) => {
    const targets = ids && ids.length > 0 ? ids : selectedAppointments
    if (targets.length === 0) {
      toast.error('Please select at least one appointment to reject')
      return
    }
    setRejectTargetAppointments(targets)
    setShowRejectModal(true)
  }

  const handleBulkUpdate = async (status, meta = {}) => {
    const targets = status === 'paid' 
      ? activeSettleIds 
      : (status === 'rejected' ? activeRejectIds : activeRevertIds)
    if (targets.length === 0) return
    setBulking(true)
    try {
      const payload = {
        appointment_ids: targets,
        status: status,
        commission_status: status,
        payment_method: meta.method || 'Bank Transfer',
        reference_note: meta.note || (status === 'paid' ? 'Approved & Locked by Admin' : (status === 'rejected' ? 'TrxID verification rejected' : 'Reversed via Admin Portal'))
      }
      const res = await bulkUpdateCommissionStatus(payload)
      toast.success(res.data?.message || `Successfully updated ${targets.length} appointment(s)`)
      queryClient.invalidateQueries({ queryKey: queryKeys.commissions.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all })
      setSelectedAppointments(prev => prev.filter(id => !targets.includes(id)))
      setShowSettleModal(false)
      setShowRevertModal(false)
      setShowRejectModal(false)
      setSettleNote('')
      setRevertNote('')
      setRejectNote('')
      setSettleTargetAppointments([])
      setRevertTargetAppointments([])
      setRejectTargetAppointments([])
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update commission status'))
    } finally {
      setBulking(false)
    }
  }

  // Request-Wise Actions
  const handleOpenViewRequest = async (req) => {
    setViewingRequest(req)
    setViewingRequestLoading(true)
    setViewingRequestDetails(null)
    try {
      const res = await getCommissionRequestDetails(req.id)
      setViewingRequestDetails(res.data)
    } catch (err) {
      toast.error('পেমেন্ট রিকোয়েস্টের বিস্তারিত লোড করতে ব্যর্থ হয়েছে')
    } finally {
      setViewingRequestLoading(false)
    }
  }

  const handleConfirmApproveRequest = async () => {
    if (!approveRequestTarget) return
    setApprovingRequest(true)
    try {
      const res = await approveCommissionRequest(approveRequestTarget.id, {
        notes: approveRequestNote || 'Approved & Verified by Admin',
      })
      toast.success(res.data?.message || 'পেমেন্ট রিকোয়েস্ট সফলভাবে অনুমোদিত ও লক হয়েছে!')
      setApproveRequestTarget(null)
      setApproveRequestNote('')
      if (viewingRequest?.id === approveRequestTarget.id) {
        setViewingRequest(null)
      }
      refetchRequests()
      refetch()
      queryClient.invalidateQueries({ queryKey: queryKeys.commissions.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all })
    } catch (err) {
      toast.error(getErrorMessage(err, 'পেমেন্ট অনুমোদন ব্যর্থ হয়েছে'))
    } finally {
      setApprovingRequest(false)
    }
  }

  const handleConfirmRejectRequest = async () => {
    if (!rejectRequestTarget) return
    if (!rejectRequestReason.trim()) {
      toast.error('অনুগ্রহ করে বাতিলের কারণ লিখুন (Rejection reason is required)')
      return
    }
    setRejectingRequest(true)
    try {
      const res = await rejectCommissionRequest(rejectRequestTarget.id, {
        rejection_reason: rejectRequestReason.trim(),
      })
      toast.success(res.data?.message || 'পেমেন্ট রিকোয়েস্ট বাতিল করা হয়েছে')
      setRejectRequestTarget(null)
      setRejectRequestReason('')
      if (viewingRequest?.id === rejectRequestTarget.id) {
        setViewingRequest(null)
      }
      refetchRequests()
      refetch()
      queryClient.invalidateQueries({ queryKey: queryKeys.commissions.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all })
    } catch (err) {
      toast.error(getErrorMessage(err, 'পেমেন্ট বাতিল ব্যর্থ হয়েছে'))
    } finally {
      setRejectingRequest(false)
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
      <div className="admin-page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
        <div>
          <h2 className="admin-page-title" style={{ color: 'var(--admin-text)' }}>
            <span style={{ marginRight: 12 }}>🧾</span>
            Commission Settlement Report
          </h2>
          <p className="admin-page-subtitle" style={{ color: 'var(--admin-text-muted)' }}>
            Analyze earned appointment commissions, payout status, and execute enterprise settlements
          </p>
        </div>

        {/* Top Right Action Group: Filters & Refresh */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Top Filter Button */}
          <button
            type="button"
            onClick={() => setShowFilters(p => !p)}
            className="admin-btn admin-btn-sm"
            style={{
              height: 34,
              padding: '0 13px',
              borderRadius: 8,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
              background: showFilters || activeFilters.length > 0 ? '#00A88C' : 'var(--admin-card-bg)',
              borderColor: showFilters || activeFilters.length > 0 ? '#00A88C' : 'var(--admin-border)',
              color: showFilters || activeFilters.length > 0 ? '#ffffff' : 'var(--admin-text)',
              boxShadow: showFilters ? '0 2px 6px rgba(0, 168, 140, 0.25)' : 'none',
              transition: 'all 0.15s ease'
            }}
            title="Toggle Filter Controls"
          >
            <Filter size={14} />
            <span>Filters</span>
            {activeFilters.length > 0 && (
              <span style={{
                background: showFilters ? '#ffffff' : '#00A88C',
                color: showFilters ? '#00A88C' : '#ffffff',
                fontSize: 10.5,
                fontWeight: 900,
                padding: '1px 6px',
                borderRadius: 8
              }}>
                {activeFilters.length}
              </span>
            )}
            {showFilters ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          {/* Refresh All Button */}
          <button
            type="button"
            disabled={isManualRefreshing || isFetching || requestsFetching}
            onClick={handleRefreshAll}
            style={{
              height: 34,
              padding: '0 15px',
              borderRadius: 8,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              fontSize: 12.5,
              fontWeight: 700,
              cursor: (isManualRefreshing || isFetching || requestsFetching) ? 'not-allowed' : 'pointer',
              background: 'var(--admin-card-bg)',
              border: '1px solid var(--admin-border)',
              color: (isManualRefreshing || isFetching || requestsFetching) ? '#00A88C' : 'var(--admin-text)',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
              transition: 'all 0.15s ease',
              opacity: (isManualRefreshing || isFetching || requestsFetching) ? 0.85 : 1
            }}
            onMouseEnter={e => {
              if (!isManualRefreshing && !isFetching && !requestsFetching) {
                e.currentTarget.style.borderColor = '#00A88C'
                e.currentTarget.style.color = '#00A88C'
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 168, 140, 0.15)'
              }
            }}
            onMouseLeave={e => {
              if (!isManualRefreshing && !isFetching && !requestsFetching) {
                e.currentTarget.style.borderColor = 'var(--admin-border)'
                e.currentTarget.style.color = 'var(--admin-text)'
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)'
              }
            }}
            title="Refresh All Commissions & Payment Requests"
          >
            <RotateCcw
              size={14}
              style={{
                animation: (isManualRefreshing || isFetching || requestsFetching) ? 'spin 0.8s linear infinite' : 'none',
                color: (isManualRefreshing || isFetching || requestsFetching) ? '#00A88C' : 'inherit'
              }}
            />
            <span>{(isManualRefreshing || isFetching || requestsFetching) ? 'Refreshing...' : 'Refresh All'}</span>
          </button>
        </div>
      </div>

      {/* ── Collapsible Top Filter Panel (Opens right below header) ── */}
      {showFilters && (
        <div style={{
          background: 'var(--admin-card-bg)',
          border: '1px solid var(--admin-border)',
          borderRadius: 12,
          padding: '16px 18px',
          marginBottom: 16,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          {/* Filter Header Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Filter size={14} color="#00A88C" />
              <span style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--admin-text)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Commission Filter Criteria
              </span>
              {activeFilters.length > 0 && (
                <span style={{ fontSize: 11, color: '#00A88C', fontWeight: 700, marginLeft: 4 }}>
                  ({activeFilters.length} active)
                </span>
              )}
            </div>

            {activeFilters.length > 0 && (
              <button
                type="button"
                onClick={clearAllFilters}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#EF4444',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <X size={13} />
                <span>Clear All Filters</span>
              </button>
            )}
          </div>

          {/* Filter Controls (Clean 2-Row Layout) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
            {/* ── Row 1: Primary Entities & Transaction Attributes ── */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: 12,
              width: '100%'
            }}>
              {/* Doctor - Enlarged Width */}
              <div style={{ flex: '1.6 1 220px', minWidth: 180 }}>
                <SearchableSelect 
                  label="Doctor" 
                  options={doctors} 
                  value={filters.doctor_id} 
                  onChange={val => setFilters(prev => ({ ...prev, doctor_id: val }))} 
                  placeholder="All Doctors" 
                  minWidth={180}
                  height={34}
                />
              </div>

              {/* Hospital - Enlarged Width */}
              <div style={{ flex: '1.6 1 220px', minWidth: 180 }}>
                <SearchableSelect 
                  label="Hospital" 
                  options={hospitals} 
                  value={filters.hospital_id} 
                  onChange={val => setFilters(prev => ({ ...prev, hospital_id: val }))} 
                  placeholder="All Hospitals" 
                  minWidth={180}
                  height={34}
                />
              </div>

              {/* Payment Status */}
              <div style={{ flex: '1 1 130px', minWidth: 110 }}>
                <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 4, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Status</label>
                <select 
                  value={filters.status} 
                  onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  style={{ width: '100%', height: 34, padding: '0 8px', borderRadius: 7, border: '1px solid var(--admin-border)', background: 'var(--admin-card-bg)', color: 'var(--admin-text)', fontSize: 12 }}
                >
                  <option value="">All Statuses</option>
                  <option value="unpaid">⏳ Unpaid</option>
                  <option value="verifying">🔍 Verifying</option>
                  <option value="paid">🔒 Paid</option>
                </select>
              </div>

              {/* Booking Source */}
              <div style={{ flex: '1 1 130px', minWidth: 110 }}>
                <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 4, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Source</label>
                <select 
                  value={filters.commission_source} 
                  onChange={e => setFilters(prev => ({ ...prev, commission_source: e.target.value }))}
                  style={{ width: '100%', height: 34, padding: '0 8px', borderRadius: 7, border: '1px solid var(--admin-border)', background: 'var(--admin-card-bg)', color: 'var(--admin-text)', fontSize: 12 }}
                >
                  <option value="">All Sources</option>
                  <option value="manager">Counter Cash</option>
                  <option value="patient">Direct Online</option>
                </select>
              </div>

              {/* Payment Method */}
              <div style={{ flex: '1 1 120px', minWidth: 105 }}>
                <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 4, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Method</label>
                <select 
                  value={filters.payment_method} 
                  onChange={e => setFilters(prev => ({ ...prev, payment_method: e.target.value }))}
                  style={{ width: '100%', height: 34, padding: '0 8px', borderRadius: 7, border: '1px solid var(--admin-border)', background: 'var(--admin-card-bg)', color: 'var(--admin-text)', fontSize: 12 }}
                >
                  <option value="">All Methods</option>
                  <option value="cash">Cash</option>
                  <option value="bkash">bKash</option>
                  <option value="nagad">Nagad</option>
                  <option value="sslcommerz">Online SSL</option>
                </select>
              </div>
            </div>

            {/* ── Row 2: Date & Period Filters + Clear Actions ── */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: 12,
              width: '100%'
            }}>
              {/* Month */}
              <div style={{ flex: '1 1 140px', minWidth: 115 }}>
                <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 4, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Month</label>
                <select 
                  value={filters.month} 
                  onChange={e => setFilters(prev => ({ ...prev, month: e.target.value }))}
                  style={{ width: '100%', height: 34, padding: '0 8px', borderRadius: 7, border: '1px solid var(--admin-border)', background: 'var(--admin-card-bg)', color: 'var(--admin-text)', fontSize: 12 }}
                >
                  <option value="">All Months</option>
                  {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>

              {/* Year */}
              <div style={{ flex: '0.8 1 95px', minWidth: 80 }}>
                <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 4, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Year</label>
                <input 
                  type="number" 
                  value={filters.year} 
                  onChange={e => setFilters(prev => ({ ...prev, year: e.target.value }))}
                  style={{ width: '100%', height: 34, padding: '0 8px', borderRadius: 7, border: '1px solid var(--admin-border)', background: 'var(--admin-card-bg)', color: 'var(--admin-text)', fontSize: 12 }}
                />
              </div>

              {/* Date From */}
              <div style={{ flex: '1.2 1 150px', minWidth: 130 }}>
                <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 4, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Date From</label>
                <input 
                  type="date" 
                  value={filters.date_from} 
                  onChange={e => setFilters(prev => ({ ...prev, date_from: e.target.value }))}
                  style={{ width: '100%', height: 34, padding: '0 8px', borderRadius: 7, border: '1px solid var(--admin-border)', background: 'var(--admin-card-bg)', color: 'var(--admin-text)', fontSize: 11.5 }}
                />
              </div>

              {/* Date To */}
              <div style={{ flex: '1.2 1 150px', minWidth: 130 }}>
                <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 4, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Date To</label>
                <input 
                  type="date" 
                  value={filters.date_to} 
                  onChange={e => setFilters(prev => ({ ...prev, date_to: e.target.value }))}
                  style={{ width: '100%', height: 34, padding: '0 8px', borderRadius: 7, border: '1px solid var(--admin-border)', background: 'var(--admin-card-bg)', color: 'var(--admin-text)', fontSize: 11.5 }}
                />
              </div>

              {/* Reset Button (Inline in Row 2) */}
              {activeFilters.length > 0 && (
                <div style={{ flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    style={{
                      height: 34,
                      padding: '0 14px',
                      borderRadius: 7,
                      background: 'rgba(239, 68, 68, 0.08)',
                      color: '#EF4444',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = '#EF4444'
                      e.currentTarget.style.color = '#ffffff'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'
                      e.currentTarget.style.color = '#EF4444'
                    }}
                    title="Clear all active filters"
                  >
                    <RotateCcw size={13} />
                    <span>Reset All</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Active Filter Chips */}
          {activeFilters.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 14, paddingTop: 12, borderTop: '1px dashed var(--admin-border)' }}>
              {activeFilters.map(chip => (
                <span
                  key={chip.key}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '3px 10px',
                    borderRadius: 20,
                    background: 'rgba(0, 168, 140, 0.08)',
                    color: '#007A65',
                    border: '1px solid rgba(0, 168, 140, 0.25)',
                    fontSize: 11.5,
                    fontWeight: 700
                  }}
                >
                  <span>{chip.label}</span>
                  <X
                    size={13}
                    style={{ cursor: 'pointer' }}
                    onClick={chip.onRemove}
                  />
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Running Month Commission Report Summary Ribbon (চলতি মাসের কমিশন সামারি) ── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(0, 168, 140, 0.08) 0%, rgba(16, 185, 129, 0.03) 100%)',
        border: '1px solid rgba(0, 168, 140, 0.22)',
        borderRadius: 12,
        padding: '10px 16px',
        marginBottom: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 15 }}>📅</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#007A65', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              চলতি মাস কমিশন সামারি — {runningMonth.month_name || 'Running Month'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          {/* Running Month Total */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5 }}>
            <span style={{ color: 'var(--admin-text-muted)', fontWeight: 600 }}>মোট অর্জিত:</span>
            <strong style={{ color: '#00A88C', fontSize: 14 }}>৳{Number(runningMonth.total_commission || 0).toLocaleString()}</strong>
            <span style={{ fontSize: 11, color: 'var(--admin-text-muted)', fontWeight: 600 }}>({runningMonth.total_count || 0})</span>
          </div>

          <span style={{ color: 'rgba(0, 168, 140, 0.35)', fontWeight: 900 }}>•</span>

          {/* Running Month Paid */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5 }}>
            <span style={{ color: 'var(--admin-text-muted)', fontWeight: 600 }}>পরিশোধিত:</span>
            <strong style={{ color: '#059669', fontSize: 14 }}>৳{Number(runningMonth.paid_commission || 0).toLocaleString()}</strong>
            <span style={{ fontSize: 11, color: 'var(--admin-text-muted)', fontWeight: 600 }}>({runningMonth.paid_count || 0})</span>
          </div>

          <span style={{ color: 'rgba(0, 168, 140, 0.35)', fontWeight: 900 }}>•</span>

          {/* Running Month Verifying / Pending */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5 }}>
            <span style={{ color: 'var(--admin-text-muted)', fontWeight: 600 }}>যাচাইাধীন:</span>
            <strong style={{ color: '#D97706', fontSize: 14 }}>৳{Number(runningMonth.verifying_commission || 0).toLocaleString()}</strong>
            <span style={{ fontSize: 11, color: 'var(--admin-text-muted)', fontWeight: 600 }}>({runningMonth.verifying_count || 0})</span>
          </div>

          <span style={{ color: 'rgba(0, 168, 140, 0.35)', fontWeight: 900 }}>•</span>

          {/* Running Month Due */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5 }}>
            <span style={{ color: 'var(--admin-text-muted)', fontWeight: 600 }}>বকেয়া (Due):</span>
            <strong style={{ color: '#EF4444', fontSize: 14 }}>৳{Number(runningMonth.due_commission || 0).toLocaleString()}</strong>
            <span style={{ fontSize: 11, color: 'var(--admin-text-muted)', fontWeight: 600 }}>({runningMonth.due_count || 0})</span>
          </div>
        </div>
      </div>

      {/* ── Slim & Compact Summary Cards (স্লিম ও ছোট কার্ড) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12, marginBottom: 16 }}>
        {/* Card 1: Total Earned Commission */}
        <div style={{ 
          background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', 
          borderRadius: 12, padding: '12px 16px', boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 76
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Commission
            </span>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 6, background: 'rgba(0, 168, 140, 0.1)', color: '#00A88C' }}>
              All Time
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ fontSize: 20, fontWeight: 900, color: '#00A88C', letterSpacing: '-0.02em' }}>
              ৳{Number(summary.total_commission || 0).toLocaleString()}
            </span>
            <span style={{ fontSize: 11, color: 'var(--admin-text-muted)', fontWeight: 600 }}>
              {summary.total_count ?? filteredData.length} appts
            </span>
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--admin-text-muted)', marginTop: 2, display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--admin-border)', paddingTop: 4 }}>
            <span>চলতি মাস: <strong style={{ color: 'var(--admin-text)' }}>৳{Number(runningMonth.total_commission || 0).toLocaleString()}</strong></span>
            <span>({runningMonth.total_count || 0})</span>
          </div>
        </div>

        {/* Card 2: Paid & Locked */}
        <div 
          onClick={() => {
            setActiveTab('appointments')
            setFilters(prev => ({ ...prev, status: 'paid' }))
          }}
          style={{ 
            background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', 
            borderRadius: 12, padding: '12px 16px', boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
            cursor: 'pointer', transition: 'all 0.15s',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 76
          }}
          title="Click to view all Paid & Locked appointments"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              🔒 Paid & Locked
            </span>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 6, background: 'rgba(16, 185, 129, 0.1)', color: '#059669' }}>
              Settled
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ fontSize: 20, fontWeight: 900, color: '#10B981', letterSpacing: '-0.02em' }}>
              ৳{Number(summary.paid_commission || 0).toLocaleString()}
            </span>
            <span style={{ fontSize: 11, color: '#059669', fontWeight: 600 }}>
              {summary.paid_count ?? 0} settled
            </span>
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--admin-text-muted)', marginTop: 2, display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--admin-border)', paddingTop: 4 }}>
            <span>চলতি মাস: <strong style={{ color: '#059669' }}>৳{Number(runningMonth.paid_commission || 0).toLocaleString()}</strong></span>
            <span>({runningMonth.paid_count || 0})</span>
          </div>
        </div>

        {/* Card 3: Verification Pending (Action Required) */}
        <div 
          onClick={() => {
            setActiveTab('requests')
            setRequestFilterStatus('pending')
          }}
          style={{ 
            background: (requestStats.pending_count ?? summary.pending_requests_count ?? 0) > 0 ? 'rgba(245, 158, 11, 0.05)' : 'var(--admin-card-bg)', 
            border: activeTab === 'requests' 
              ? '1.5px solid #00A88C' 
              : ((requestStats.pending_count ?? summary.pending_requests_count ?? 0) > 0 ? '1.5px solid #F59E0B' : '1px solid var(--admin-border)'), 
            borderRadius: 12, padding: '12px 16px', 
            boxShadow: activeTab === 'requests' ? '0 2px 6px rgba(0, 168, 140, 0.15)' : '0 1px 2px rgba(0,0,0,0.03)',
            cursor: 'pointer', transition: 'all 0.15s',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 76
          }}
          title="Click to open Request-Wise Approval Inbox"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              🔍 Verification Pending
            </span>
            {(requestStats.pending_count ?? summary.pending_requests_count ?? 0) > 0 ? (
              <span style={{ fontSize: 9.5, fontWeight: 900, padding: '1px 6px', borderRadius: 6, background: '#F59E0B', color: '#fff' }}>
                Action Required
              </span>
            ) : (
              <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 6, background: 'rgba(245, 158, 11, 0.1)', color: '#D97706' }}>
                Clear
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ fontSize: 20, fontWeight: 900, color: '#D97706', letterSpacing: '-0.02em' }}>
              ৳{Number(requestStats.pending_amount ?? summary.verifying_commission ?? 0).toLocaleString()}
            </span>
            <span style={{ fontSize: 11, color: '#B45309', fontWeight: 700 }}>
              {requestStats.pending_count ?? summary.pending_requests_count ?? 0} request(s)
            </span>
          </div>
          <div style={{ fontSize: 10.5, color: '#B45309', marginTop: 2, display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--admin-border)', paddingTop: 4 }}>
            <span>চলতি মাস: <strong>৳{Number(runningMonth.verifying_commission || 0).toLocaleString()}</strong></span>
            <span style={{ textDecoration: 'underline', fontSize: 10 }}>Review Inbox →</span>
          </div>
        </div>

        {/* Card 4: Unpaid / Due */}
        <div 
          onClick={() => {
            setActiveTab('appointments')
            setFilters(prev => ({ ...prev, status: 'unpaid' }))
          }}
          style={{ 
            background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', 
            borderRadius: 12, padding: '12px 16px', boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
            cursor: 'pointer', transition: 'all 0.15s',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 76
          }}
          title="Click to view all Unpaid / Due appointments"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              ⏳ Unpaid / Due
            </span>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 6, background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }}>
              Receivable
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ fontSize: 20, fontWeight: 900, color: '#EF4444', letterSpacing: '-0.02em' }}>
              ৳{Number(summary.pending_commission || 0).toLocaleString()}
            </span>
            <span style={{ fontSize: 11, color: '#EF4444', fontWeight: 600 }}>
              {summary.pending_count ?? 0} due
            </span>
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--admin-text-muted)', marginTop: 2, display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--admin-border)', paddingTop: 4 }}>
            <span>চলতি মাস: <strong style={{ color: '#EF4444' }}>৳{Number(runningMonth.due_commission || 0).toLocaleString()}</strong></span>
            <span>({runningMonth.due_count || 0})</span>
          </div>
        </div>
      </div>

      {/* ── View Switcher Navigation & Searchbar Row ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 16,
        padding: '6px 10px',
        background: 'var(--admin-card-bg)',
        border: '1px solid var(--admin-border)',
        borderRadius: 12
      }}>
        {/* Left Side: Searchbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 auto', minWidth: 260 }}>
          {/* Expanded Searchbar with Clear (X) Button */}
          <div style={{
            position: 'relative',
            flex: '1 1 360px',
            maxWidth: 580,
            minWidth: 260
          }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-text-muted)', pointerEvents: 'none' }} />
            <input
              type="text"
              className="admin-form-input"
              placeholder={activeTab === 'requests' ? "Search TrxID, Provider, Bank, Phone..." : "Search Patient, Doctor, Appointment ID..."}
              value={activeTab === 'requests' ? requestSearch : search}
              onChange={e => {
                if (activeTab === 'requests') setRequestSearch(e.target.value)
                else setSearch(e.target.value)
              }}
              style={{
                width: '100%',
                height: 34,
                paddingLeft: 32,
                paddingRight: (activeTab === 'requests' ? requestSearch : search) ? 30 : 10,
                fontSize: 12,
                borderRadius: 8
              }}
            />
            {(activeTab === 'requests' ? requestSearch : search) && (
              <button
                type="button"
                onClick={() => {
                  if (activeTab === 'requests') setRequestSearch('')
                  else setSearch('')
                }}
                title="Clear search"
                style={{
                  position: 'absolute',
                  right: 7,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 3,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--admin-text-muted)',
                  transition: 'all 0.15s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = '#DC2626'
                  e.currentTarget.style.background = 'rgba(220, 38, 38, 0.1)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = 'var(--admin-text-muted)'
                  e.currentTarget.style.background = 'none'
                }}
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Right Side: The 2 View Switcher Buttons */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => setActiveTab('requests')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              border: activeTab === 'requests' ? '1px solid #00A88C' : '1px solid var(--admin-border)',
              background: activeTab === 'requests' ? '#00A88C' : 'transparent',
              color: activeTab === 'requests' ? '#ffffff' : 'var(--admin-text-muted)',
              transition: 'all 0.15s ease',
              boxShadow: activeTab === 'requests' ? '0 2px 6px rgba(0, 168, 140, 0.25)' : 'none'
            }}
          >
            <Layers size={14} />
            <span>Payment Requests</span>
            {(requestStats.pending_count ?? summary.pending_requests_count ?? 0) > 0 && (
              <span style={{
                background: activeTab === 'requests' ? '#ffffff' : '#F59E0B',
                color: activeTab === 'requests' ? '#00A88C' : '#ffffff',
                fontSize: 10.5,
                fontWeight: 900,
                padding: '1px 6px',
                borderRadius: 6
              }}>
                {requestStats.pending_count ?? summary.pending_requests_count}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('appointments')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              border: activeTab === 'appointments' ? '1px solid #00A88C' : '1px solid var(--admin-border)',
              background: activeTab === 'appointments' ? '#00A88C' : 'transparent',
              color: activeTab === 'appointments' ? '#ffffff' : 'var(--admin-text-muted)',
              transition: 'all 0.15s ease',
              boxShadow: activeTab === 'appointments' ? '0 2px 6px rgba(0, 168, 140, 0.25)' : 'none'
            }}
          >
            <Stethoscope size={14} />
            <span>All Appointments</span>
            <span style={{ fontSize: 10.5, opacity: activeTab === 'appointments' ? 0.9 : 0.7 }}>({filteredData.length})</span>
          </button>
        </div>
      </div>

      {/* Sub Toolbar for Payment Requests: Status Filter Tabs on Left, Provider Selection on Right */}
      {activeTab === 'requests' && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
          marginBottom: 16,
          padding: '6px 10px',
          background: 'var(--admin-card-bg)',
          border: '1px solid var(--admin-border)',
          borderRadius: 12
        }}>
          {/* Left Side: Status Filter Tabs */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px',
            background: 'var(--admin-bg)',
            border: '1px solid var(--admin-border)',
            borderRadius: 8,
            flexWrap: 'wrap'
          }}>
            {[
              { id: 'pending', label: '⏳ Pending', count: requestStats.pending_count ?? 0, activeColor: '#D97706' },
              { id: 'approved', label: '🔒 Approved', count: requestStats.approved_count ?? 0, activeColor: '#059669' },
              { id: 'rejected', label: '❌ Rejected', count: requestStats.rejected_count ?? 0, activeColor: '#DC2626' },
              { id: 'all', label: 'All Requests', count: requestStats.total_count ?? 0, activeColor: '#00A88C' },
            ].map(st => {
              const isSelected = requestFilterStatus === st.id
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setRequestFilterStatus(st.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '5px 12px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: isSelected ? 800 : 600,
                    cursor: 'pointer',
                    border: 'none',
                    background: isSelected ? st.activeColor : 'transparent',
                    color: isSelected ? '#ffffff' : 'var(--admin-text-muted)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>{st.label}</span>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 900,
                    padding: '0 6px',
                    borderRadius: 10,
                    background: isSelected ? 'rgba(255, 255, 255, 0.28)' : 'rgba(0, 0, 0, 0.07)',
                    color: isSelected ? '#ffffff' : 'var(--admin-text-muted)'
                  }}>
                    {st.count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Right Side: Providers Selection Dropdown Box */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-text-muted)', whiteSpace: 'nowrap' }}>Provider Type:</span>
            <select
              value={requestProviderType}
              onChange={e => setRequestProviderType(e.target.value)}
              className="admin-form-select"
              style={{
                height: 34,
                fontSize: 12,
                borderRadius: 7,
                minWidth: 140,
                padding: '0 10px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <option value="all">All Providers</option>
              <option value="doctor">🩺 Doctors Only</option>
              <option value="hospital">🏥 Hospitals Only</option>
            </select>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ── TAB 1: PAYMENT VERIFICATION REQUESTS (REQUEST-WISE INBOX) ── */}
      {/* ========================================================================= */}
      {activeTab === 'requests' && (
        <div className="admin-card" style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 24 }}>
          {/* Requests Table Body */}

          {/* Requests Table Body */}
          <div className="admin-card-body" style={{ padding: 0 }}>
            {requestsLoading ? (
              <div className="admin-loading" style={{ padding: 50 }}>
                <div className="admin-spinner" /> Loading payment requests...
              </div>
            ) : requestList.length === 0 ? (
              <div className="admin-empty" style={{ padding: 50, textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
                <h4 style={{ color: 'var(--admin-text)', margin: '0 0 6px', fontSize: 15 }}>No payment verification requests found</h4>
                <p style={{ color: 'var(--admin-text-muted)', fontSize: 12.5, margin: 0 }}>
                  {requestFilterStatus === 'pending' 
                    ? 'Great! There are no pending payment requests waiting for verification.' 
                    : 'No records matching the selected status or provider filter.'}
                </p>
              </div>
            ) : (
              <div className="admin-table-wrapper">
                <table className="admin-table" style={{ width: '100%', minWidth: 960 }}>
                  <thead>
                    <tr>
                      <th style={{ width: 170, whiteSpace: 'nowrap', paddingLeft: 18 }}>Request ID</th>
                      <th style={{ minWidth: 190, whiteSpace: 'nowrap' }}>Provider Details</th>
                      <th style={{ minWidth: 210, whiteSpace: 'nowrap' }}>Payment Reference</th>
                      <th style={{ width: 130, textAlign: 'center', whiteSpace: 'nowrap' }}>Included Scope</th>
                      <th style={{ width: 120, textAlign: 'right', whiteSpace: 'nowrap' }}>Commission</th>
                      <th style={{ width: 140, textAlign: 'center', whiteSpace: 'nowrap' }}>Status</th>
                      <th style={{ width: 190, textAlign: 'right', whiteSpace: 'nowrap', paddingRight: 18 }}>1-Click Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requestList.map(req => {
                      const isPending = req.status === 'pending'
                      const isApproved = req.status === 'approved'
                      const isRejected = req.status === 'rejected'
                      const isDoc = req.provider_type === 'doctor'

                      return (
                        <tr key={req.id}>
                          {/* Request Info */}
                          <td style={{ paddingLeft: 18, whiteSpace: 'nowrap' }}>
                            <div style={{ fontWeight: 800, color: 'var(--admin-text)', fontFamily: 'monospace', fontSize: 12.5, whiteSpace: 'nowrap' }}>
                              {req.request_number}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', marginTop: 2, whiteSpace: 'nowrap' }}>
                              📅 {formatDisplayDate(req.created_at)}
                            </div>
                          </td>

                          {/* Provider Details */}
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{
                                width: 30, height: 30, borderRadius: 7, flexShrink: 0,
                                background: isDoc ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                color: isDoc ? '#2563EB' : '#059669',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                              }}>
                                {isDoc ? <Stethoscope size={15} /> : <Building2 size={15} />}
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontWeight: 700, color: 'var(--admin-text)', fontSize: 12.5, whiteSpace: 'nowrap' }}>
                                  {isDoc ? (req.doctor?.name || 'Doctor') : (req.hospital?.name || 'Hospital')}
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', whiteSpace: 'nowrap' }}>
                                  {isDoc ? (req.doctor?.specialty?.name || req.doctor?.degree || 'Doctor') : (req.hospital?.division?.name || 'Hospital')}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Payment Info & TrxID */}
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                              <span style={{
                                fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 5,
                                textTransform: 'uppercase',
                                background: req.payment_method === 'bkash' ? 'rgba(226, 19, 110, 0.1)' : (req.payment_method === 'nagad' ? 'rgba(246, 146, 30, 0.1)' : 'rgba(2, 132, 199, 0.1)'),
                                color: req.payment_method === 'bkash' ? '#E2136E' : (req.payment_method === 'nagad' ? '#F6921E' : '#0284c7')
                              }}>
                                {req.payment_method}
                              </span>
                              <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 12, color: 'var(--admin-text)' }}>
                                {req.transaction_reference}
                              </span>
                            </div>
                            {req.notes && (
                              <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={req.notes}>
                                💬 {req.notes}
                              </div>
                            )}
                          </td>

                          {/* Included Scope */}
                          <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                              <span style={{
                                fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 6,
                                background: 'rgba(0, 168, 140, 0.08)', color: '#007A65', border: '1px solid rgba(0, 168, 140, 0.2)'
                              }}>
                                {req.appointment_count} Appointment(s)
                              </span>
                              <button
                                type="button"
                                onClick={() => handleOpenViewRequest(req)}
                                style={{
                                  background: 'transparent', border: 'none', color: '#00A88C',
                                  fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 3
                                }}
                              >
                                <Eye size={11} />
                                <span>View Details</span>
                              </button>
                            </div>
                          </td>

                          {/* Total Commission */}
                          <td style={{ textAlign: 'right', fontWeight: 900, color: 'var(--admin-primary, #00A88C)', fontSize: 14.5, whiteSpace: 'nowrap' }}>
                            ৳{Number(req.amount || 0).toLocaleString()}
                          </td>

                          {/* Status Badge */}
                          <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                            {isPending && (
                              <span style={{
                                fontSize: 10.5, fontWeight: 800, padding: '2px 9px', borderRadius: 6,
                                background: 'rgba(245, 158, 11, 0.12)', color: '#D97706', border: '1px solid rgba(245, 158, 11, 0.25)',
                                whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 4
                              }}>
                                <Clock size={11} /> PENDING
                              </span>
                            )}
                            {isApproved && (
                              <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                                <span style={{
                                  fontSize: 10.5, fontWeight: 800, padding: '2px 9px', borderRadius: 6,
                                  background: 'rgba(16, 185, 129, 0.12)', color: '#059669', border: '1px solid rgba(16, 185, 129, 0.25)',
                                  whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 4
                                }}>
                                  <ShieldCheck size={11} /> APPROVED & LOCKED
                                </span>
                                {req.action_at && (
                                  <span style={{ fontSize: 9.5, color: 'var(--admin-text-muted)' }}>
                                    {formatDisplayDate(req.action_at)}
                                  </span>
                                )}
                              </div>
                            )}
                            {isRejected && (
                              <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                                <span style={{
                                  fontSize: 10.5, fontWeight: 800, padding: '2px 9px', borderRadius: 6,
                                  background: 'rgba(239, 68, 68, 0.12)', color: '#DC2626', border: '1px solid rgba(239, 68, 68, 0.25)',
                                  whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 4
                                }} title={req.admin_notes}>
                                  <X size={11} /> REJECTED
                                </span>
                                {req.admin_notes && (
                                  <span style={{ fontSize: 9.5, color: '#DC2626', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={req.admin_notes}>
                                    {req.admin_notes}
                                  </span>
                                )}
                              </div>
                            )}
                          </td>

                          {/* 1-Click Action */}
                          <td style={{ textAlign: 'right', paddingRight: 18, whiteSpace: 'nowrap' }}>
                            {isPending ? (
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end', whiteSpace: 'nowrap' }}>
                                <button
                                  type="button"
                                  className="admin-btn admin-btn-sm"
                                  style={{
                                    background: '#00A88C', color: '#ffffff', border: 'none',
                                    fontSize: 11.5, fontWeight: 800, padding: '5px 10px', borderRadius: 7,
                                    display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer',
                                    whiteSpace: 'nowrap', boxShadow: '0 1px 3px rgba(0, 168, 140, 0.25)'
                                  }}
                                  onClick={() => setApproveRequestTarget(req)}
                                  title="1-Click Approve this payment request"
                                >
                                  <ShieldCheck size={13} />
                                  <span>Approve & Lock</span>
                                </button>
                                <button
                                  type="button"
                                  className="admin-btn admin-btn-sm"
                                  style={{
                                    background: 'transparent', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.3)',
                                    fontSize: 11.5, fontWeight: 700, padding: '5px 8px', borderRadius: 7,
                                    display: 'inline-flex', alignItems: 'center', gap: 3, cursor: 'pointer',
                                    whiteSpace: 'nowrap'
                                  }}
                                  onClick={() => setRejectRequestTarget(req)}
                                  title="Reject this payment request"
                                >
                                  <X size={13} />
                                  <span>Reject</span>
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                className="admin-btn admin-btn-xs admin-btn-outline"
                                onClick={() => handleOpenViewRequest(req)}
                                style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, whiteSpace: 'nowrap' }}
                              >
                                Audit Details
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ── TAB 2: ALL APPOINTMENTS BREAKDOWN (INDIVIDUAL BREAKDOWN VIEW) ── */}
      {/* ========================================================================= */}
      {activeTab === 'appointments' && (
        <>
          {/* Main Table Card */}
          <div className="admin-card">
        <div className="admin-card-header" style={{ background: 'var(--admin-bg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <h3 className="admin-card-title">Commission Breakdown</h3>
            {selectedAppointments.length > 0 && (
              <div style={{ display: 'flex', gap: 8, animation: 'fadeIn 0.2s', alignItems: 'center', flexWrap: 'wrap' }}>
                <button 
                  className="admin-btn admin-btn-sm" 
                  style={{ 
                    background: (selectedVerifyingItems.length > 0 || selectedUnpaidItems.length > 0) ? '#10B981' : 'var(--admin-bg)', 
                    color: (selectedVerifyingItems.length > 0 || selectedUnpaidItems.length > 0) ? '#ffffff' : 'var(--admin-text-muted)', 
                    border: (selectedVerifyingItems.length > 0 || selectedUnpaidItems.length > 0) ? 'none' : '1px solid var(--admin-border)',
                    opacity: (selectedVerifyingItems.length > 0 || selectedUnpaidItems.length > 0) ? 1 : 0.5,
                    cursor: (selectedVerifyingItems.length > 0 || selectedUnpaidItems.length > 0) && !bulking ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 
                  }}
                  onClick={() => openSettleModal([...selectedVerifyingItems, ...selectedUnpaidItems].map(i => i.id))}
                  disabled={bulking || (selectedVerifyingItems.length === 0 && selectedUnpaidItems.length === 0)}
                  title={(selectedVerifyingItems.length === 0 && selectedUnpaidItems.length === 0) ? 'No verifying or unpaid appointments selected' : undefined}
                >
                  <ShieldCheck size={15} />
                  Approve & Lock ({selectedVerifyingItems.length + selectedUnpaidItems.length})
                </button>

                {selectedVerifyingItems.length > 0 && (
                  <button 
                    className="admin-btn admin-btn-sm" 
                    style={{ 
                      background: '#F59E0B', 
                      color: '#ffffff', 
                      border: 'none',
                      display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 
                    }}
                    onClick={() => openRejectModal(selectedVerifyingItems.map(i => i.id))}
                    disabled={bulking}
                  >
                    <X size={15} />
                    Reject Verification ({selectedVerifyingItems.length})
                  </button>
                )}

                {selectedPaidItems.length > 0 && (
                  <button 
                    className="admin-btn admin-btn-sm" 
                    style={{ 
                      background: '#EF4444', 
                      color: '#ffffff', 
                      border: 'none',
                      display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 
                    }}
                    onClick={() => openRevertModal(selectedPaidItems.map(i => i.id))}
                    disabled={bulking}
                  >
                    <RotateCcw size={14} />
                    Mark {selectedPaidItems.length} as Unpaid
                  </button>
                )}
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-text-muted)', marginLeft: 4 }}>
                  (Selected: ৳{selectedTotalCommission.toLocaleString()})
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
                        {(() => {
                          const status = (row.commission_status || 'unpaid').toLowerCase()
                          if (status === 'paid') {
                            return (
                              <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                                <span style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 4,
                                  fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 8,
                                  background: 'rgba(16, 185, 129, 0.12)', color: '#059669', border: '1px solid rgba(16, 185, 129, 0.3)'
                                }} title={row.commission_note || 'Approved & Locked'}>
                                  <ShieldCheck size={13} /> PAID & LOCKED
                                </span>
                                {row.commission_note && (
                                  <span style={{ fontSize: 10, color: 'var(--admin-text-muted)', maxWidth: 170, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={row.commission_note}>
                                    {row.commission_note}
                                  </span>
                                )}
                              </div>
                            )
                          }
                          if (status === 'verifying') {
                            return (
                              <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                                <span style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 4,
                                  fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 8,
                                  background: 'rgba(245, 158, 11, 0.15)', color: '#B45309', border: '1px solid rgba(245, 158, 11, 0.35)'
                                }} title={row.commission_note || 'Verification Pending'}>
                                  🔍 VERIFYING
                                </span>
                                <div style={{ display: 'flex', gap: 4 }}>
                                  <button 
                                    type="button" 
                                    className="admin-btn admin-btn-xs" 
                                    style={{ background: '#10B981', color: '#fff', fontSize: 10, padding: '2px 7px', borderRadius: 5, fontWeight: 800 }}
                                    onClick={() => openSettleModal([row.id])}
                                    title="Approve & Lock this payment"
                                  >
                                    ✓ Approve
                                  </button>
                                  <button 
                                    type="button" 
                                    className="admin-btn admin-btn-xs" 
                                    style={{ background: '#EF4444', color: '#fff', fontSize: 10, padding: '2px 7px', borderRadius: 5, fontWeight: 800 }}
                                    onClick={() => openRejectModal([row.id])}
                                    title="Reject verification"
                                  >
                                    ✕ Reject
                                  </button>
                                </div>
                                {row.commission_note && (
                                  <span style={{ fontSize: 10, color: '#D97706', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }} title={row.commission_note}>
                                    {row.commission_note}
                                  </span>
                                )}
                              </div>
                            )
                          }
                          return (
                            <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                <span style={{
                                  fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 8,
                                  background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.25)'
                                }}>
                                  ⏳ UNPAID
                                </span>
                                <button 
                                  type="button" 
                                  className="admin-btn admin-btn-xs" 
                                  style={{ background: 'var(--admin-bg)', border: '1px solid var(--admin-border)', fontSize: 10, padding: '2px 7px', borderRadius: 5, fontWeight: 700 }}
                                  onClick={() => openSettleModal([row.id])}
                                  title="Direct Settlement"
                                >
                                  Settle
                                </button>
                              </div>
                              {row.commission_note && (
                                <span style={{ fontSize: 10, color: '#EF4444', maxWidth: 170, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={row.commission_note}>
                                  {row.commission_note}
                                </span>
                              )}
                            </div>
                          )
                        })()}
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
        </>
      )}

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
              {/* Provider Submitted Notes / Verification Info if any */}
              {activeSettleItems.some(i => i.commission_note) && (
                <div style={{
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  borderRadius: 12,
                  padding: '12px 16px',
                  marginBottom: 16,
                  fontSize: 12.5,
                  color: '#92400e'
                }}>
                  <div style={{ fontWeight: 800, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>🔍</span> Provider Submitted Verification Reference:
                  </div>
                  {activeSettleItems.filter(i => i.commission_note).slice(0, 3).map((item, idx) => (
                    <div key={idx} style={{ fontFamily: 'monospace', fontSize: 11.5, marginTop: 2 }}>
                      • #{item.id}: {item.commission_note}
                    </div>
                  ))}
                  {activeSettleItems.filter(i => i.commission_note).length > 3 && (
                    <div style={{ fontSize: 11, fontStyle: 'italic', marginTop: 4 }}>
                      + {activeSettleItems.filter(i => i.commission_note).length - 3} more items with submitted notes
                    </div>
                  )}
                </div>
              )}

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
                  Voucher / Approval Reference Note (Optional)
                </label>
                <input
                  type="text"
                  className="admin-form-input"
                  placeholder="e.g. Bank Trx ID / Check # / Verified Deposit Slip"
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
                    <>Processing Approval...</>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      Approve & Lock Paid
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enterprise Verification Rejection Modal */}
      {showRejectModal && (
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
                  <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--admin-text)' }}>Reject Payment Verification</h4>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--admin-text-muted)' }}>Revert submission back to Unpaid Due</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowRejectModal(false)
                  setRejectTargetAppointments([])
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
                  <span style={{ fontWeight: 700, color: 'var(--admin-text)' }}>{activeRejectIds.length} record(s)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--admin-text-muted)' }}>Total Commission Value:</span>
                  <span style={{ fontWeight: 800, color: '#EF4444' }}>৳{activeRejectTotalCommission.toLocaleString()}</span>
                </div>
              </div>

              <p style={{ fontSize: 13, color: 'var(--admin-text)', marginBottom: 16, lineHeight: 1.5 }}>
                You are rejecting the payment verification for these appointment(s). The provider will be notified and the status will revert to <strong>Due (Unpaid)</strong>.
              </p>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 6 }}>
                  Rejection Reason / Note <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className="admin-form-input"
                  placeholder="e.g. TrxID not found in account / Amount discrepancy"
                  value={rejectNote}
                  onChange={e => setRejectNote(e.target.value)}
                  style={{ width: '100%', height: 40 }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="admin-btn admin-btn-outline"
                  onClick={() => {
                    setShowRejectModal(false)
                    setRejectTargetAppointments([])
                  }}
                  disabled={bulking}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn-primary"
                  style={{ background: '#EF4444', borderColor: '#EF4444', display: 'flex', alignItems: 'center', gap: 8 }}
                  onClick={() => handleBulkUpdate('rejected', { note: rejectNote || 'TrxID verification rejected by admin' })}
                  disabled={bulking}
                >
                  {bulking ? 'Processing...' : 'Confirm Rejection'}
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

      {/* ── Request Details & Included Appointments Modal ── */}
      {viewingRequest && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div style={{
            background: 'var(--admin-card-bg)', borderRadius: 16,
            maxWidth: 860, width: '100%', maxHeight: '90vh',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid var(--admin-border)', overflow: 'hidden',
            display: 'flex', flexDirection: 'column', animation: 'scaleUp 0.2s ease-out'
          }}>
            {/* Header */}
            <div style={{
              padding: '18px 24px', borderBottom: '1px solid var(--admin-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'var(--admin-bg)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10, background: 'var(--admin-primary, #00A88C)',
                  color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Layers size={20} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--admin-text)', fontFamily: 'monospace' }}>
                      {viewingRequest.request_number}
                    </h4>
                    {viewingRequest.status === 'pending' && (
                      <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 8, background: 'rgba(245, 158, 11, 0.12)', color: '#D97706' }}>
                        ⏳ PENDING VERIFICATION
                      </span>
                    )}
                    {viewingRequest.status === 'approved' && (
                      <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 8, background: 'rgba(16, 185, 129, 0.12)', color: '#059669' }}>
                        🔒 APPROVED & LOCKED
                      </span>
                    )}
                    {viewingRequest.status === 'rejected' && (
                      <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 8, background: 'rgba(239, 68, 68, 0.12)', color: '#DC2626' }}>
                        ❌ REJECTED
                      </span>
                    )}
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--admin-text-muted)' }}>
                    Payment batch settlement submitted by {viewingRequest.provider_type === 'doctor' ? (viewingRequest.doctor?.name || 'Doctor') : (viewingRequest.hospital?.name || 'Hospital')}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setViewingRequest(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--admin-text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Request Summary Overview Bar */}
            <div style={{
              padding: '14px 24px', background: 'var(--admin-card-bg)',
              borderBottom: '1px solid var(--admin-border)',
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14
            }}>
              <div>
                <span style={{ fontSize: 11, color: 'var(--admin-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Provider</span>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--admin-text)', marginTop: 2 }}>
                  {viewingRequest.provider_type === 'doctor' ? `🩺 Dr. ${viewingRequest.doctor?.name}` : `🏥 ${viewingRequest.hospital?.name}`}
                </div>
              </div>
              <div>
                <span style={{ fontSize: 11, color: 'var(--admin-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Payment Reference</span>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--admin-text)', marginTop: 2, fontFamily: 'monospace' }}>
                  <span style={{ textTransform: 'uppercase', color: '#0284c7' }}>{viewingRequest.payment_method}:</span> {viewingRequest.transaction_reference}
                </div>
              </div>
              <div>
                <span style={{ fontSize: 11, color: 'var(--admin-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Submitted Date</span>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--admin-text)', marginTop: 2 }}>
                  {formatDisplayDate(viewingRequest.created_at)}
                </div>
              </div>
              <div>
                <span style={{ fontSize: 11, color: 'var(--admin-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Batch Total</span>
                <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--admin-primary, #00A88C)', marginTop: 2 }}>
                  ৳{Number(viewingRequest.amount || 0).toLocaleString()} <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--admin-text-muted)' }}>({viewingRequest.appointment_count} appts)</span>
                </div>
              </div>
            </div>

            {/* Provider Notes if present */}
            {viewingRequest.notes && (
              <div style={{ padding: '10px 24px', background: 'rgba(59, 130, 246, 0.05)', borderBottom: '1px solid var(--admin-border)', fontSize: 12, color: 'var(--admin-text)' }}>
                <strong>Provider Note / Deposit Reference:</strong> {viewingRequest.notes}
              </div>
            )}

            {/* Admin Audit Notes if approved or rejected */}
            {viewingRequest.admin_notes && (
              <div style={{
                padding: '10px 24px',
                background: viewingRequest.status === 'rejected' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                borderBottom: '1px solid var(--admin-border)',
                fontSize: 12,
                color: viewingRequest.status === 'rejected' ? '#dc2626' : '#059669'
              }}>
                <strong>Admin Audit Note:</strong> {viewingRequest.admin_notes} {viewingRequest.action_at ? `(${formatDisplayDate(viewingRequest.action_at)})` : ''}
              </div>
            )}

            {/* Appointments Table (Scrollable) */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
              <h5 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 800, color: 'var(--admin-text)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Included Patient Consultations ({viewingRequestDetails?.appointments?.length ?? viewingRequest.appointment_count})
              </h5>

              {viewingRequestLoading ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                  <div className="admin-spinner" style={{ margin: '0 auto 8px' }} />
                  Loading appointment details...
                </div>
              ) : (
                <table className="admin-table" style={{ fontSize: 12.5 }}>
                  <thead>
                    <tr>
                      <th>Appt ID</th>
                      <th>Patient</th>
                      <th>Date</th>
                      <th style={{ textAlign: 'right' }}>Total Fee</th>
                      <th style={{ textAlign: 'center' }}>Comm %</th>
                      <th style={{ textAlign: 'right' }}>Platform Commission</th>
                      <th style={{ textAlign: 'center' }}>Commission Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(viewingRequestDetails?.appointments || []).map(appt => (
                      <tr key={appt.id}>
                        <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>
                          #{appt.id}
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--admin-text)' }}>{appt.patient_name || 'Patient'}</div>
                          {appt.patient_phone && <div style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>{appt.patient_phone}</div>}
                        </td>
                        <td>
                          {formatDisplayDate(appt.appointment_date)}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>
                          ৳{Number(appt.amount || 0).toLocaleString()}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'var(--admin-bg)' }}>
                            {appt.commission_rate}%
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--admin-primary)' }}>
                          ৳{Number(appt.commission_amount || 0).toLocaleString()}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{
                            fontSize: 10.5, fontWeight: 800, padding: '2px 8px', borderRadius: 6,
                            background: appt.commission_status === 'paid' ? 'rgba(16, 185, 129, 0.1)' : (appt.commission_status === 'verifying' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)'),
                            color: appt.commission_status === 'paid' ? '#059669' : (appt.commission_status === 'verifying' ? '#D97706' : '#EF4444')
                          }}>
                            {appt.commission_status?.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: '16px 24px', borderTop: '1px solid var(--admin-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'var(--admin-bg)'
            }}>
              <div style={{ fontSize: 12.5, color: 'var(--admin-text-muted)' }}>
                Total Batch Commission: <strong style={{ color: 'var(--admin-primary)', fontSize: 14 }}>৳{Number(viewingRequest.amount || 0).toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  className="admin-btn admin-btn-outline"
                  onClick={() => setViewingRequest(null)}
                >
                  Close
                </button>
                {viewingRequest.status === 'pending' && (
                  <>
                    <button
                      type="button"
                      className="admin-btn"
                      style={{ background: 'transparent', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.3)', fontWeight: 700 }}
                      onClick={() => {
                        setRejectRequestTarget(viewingRequest)
                      }}
                    >
                      <X size={15} style={{ marginRight: 4 }} />
                      Reject Request
                    </button>
                    <button
                      type="button"
                      className="admin-btn admin-btn-primary"
                      style={{ background: '#10B981', borderColor: '#10B981', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                      onClick={() => {
                        setApproveRequestTarget(viewingRequest)
                      }}
                    >
                      <ShieldCheck size={16} />
                      1-Click Approve & Lock
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 1-Click Approve Request Confirmation Modal ── */}
      {approveRequestTarget && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div style={{
            background: 'var(--admin-card-bg)', borderRadius: 16,
            maxWidth: 480, width: '100%', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid var(--admin-border)', overflow: 'hidden', animation: 'scaleUp 0.2s ease-out'
          }}>
            {/* Header */}
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
                  <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--admin-text)' }}>
                    Approve Payment & Lock Batch
                  </h4>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--admin-text-muted)' }}>
                    Confirm received transfer and mark records as Paid
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setApproveRequestTarget(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--admin-text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: 24 }}>
              <div style={{
                background: 'rgba(16, 185, 129, 0.06)', borderRadius: 12, padding: 16,
                border: '1px solid rgba(16, 185, 129, 0.25)', marginBottom: 20
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                  <span style={{ color: 'var(--admin-text-muted)' }}>Request ID:</span>
                  <span style={{ fontWeight: 800, color: 'var(--admin-text)', fontFamily: 'monospace' }}>{approveRequestTarget.request_number}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                  <span style={{ color: 'var(--admin-text-muted)' }}>Provider:</span>
                  <span style={{ fontWeight: 700, color: 'var(--admin-text)' }}>
                    {approveRequestTarget.provider_type === 'doctor' ? (approveRequestTarget.doctor?.name || 'Doctor') : (approveRequestTarget.hospital?.name || 'Hospital')}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                  <span style={{ color: 'var(--admin-text-muted)' }}>Trx Reference:</span>
                  <span style={{ fontWeight: 800, color: '#0284c7', fontFamily: 'monospace' }}>
                    {approveRequestTarget.payment_method?.toUpperCase()} : {approveRequestTarget.transaction_reference}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                  <span style={{ color: 'var(--admin-text-muted)' }}>Included Consultations:</span>
                  <span style={{ fontWeight: 800, color: 'var(--admin-text)' }}>{approveRequestTarget.appointment_count} appointment(s)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, paddingTop: 6, borderTop: '1px dashed rgba(16, 185, 129, 0.3)' }}>
                  <span style={{ fontWeight: 800, color: '#059669' }}>Total Platform Commission:</span>
                  <span style={{ fontWeight: 900, color: '#059669', fontSize: 16 }}>৳{Number(approveRequestTarget.amount || 0).toLocaleString()}</span>
                </div>
              </div>

              <p style={{ fontSize: 13, color: 'var(--admin-text)', marginBottom: 16, lineHeight: 1.5 }}>
                Approving this request will mark all <strong>{approveRequestTarget.appointment_count}</strong> included appointments as <strong>PAID & LOCKED</strong> and permanently settle this batch in provider financial statements.
              </p>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 6 }}>
                  Approval Voucher Note / Bank Slip Ref (Optional)
                </label>
                <input
                  type="text"
                  className="admin-form-input"
                  placeholder="e.g. Verified via Bank / bKash statement"
                  value={approveRequestNote}
                  onChange={e => setApproveRequestNote(e.target.value)}
                  style={{ width: '100%', height: 40 }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="admin-btn admin-btn-outline"
                  onClick={() => setApproveRequestTarget(null)}
                  disabled={approvingRequest}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn-primary"
                  style={{ background: '#10B981', borderColor: '#10B981', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800 }}
                  onClick={handleConfirmApproveRequest}
                  disabled={approvingRequest}
                >
                  {approvingRequest ? (
                    <>Processing Approval...</>
                  ) : (
                    <>
                      <ShieldCheck size={16} />
                      Confirm & Approve Batch
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Reject Request Confirmation Modal ── */}
      {rejectRequestTarget && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div style={{
            background: 'var(--admin-card-bg)', borderRadius: 16,
            maxWidth: 480, width: '100%', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid var(--admin-border)', overflow: 'hidden', animation: 'scaleUp 0.2s ease-out'
          }}>
            {/* Header */}
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
                  <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--admin-text)' }}>
                    Reject Payment Request
                  </h4>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--admin-text-muted)' }}>
                    Revert request appointments back to Due (Unpaid)
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setRejectRequestTarget(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--admin-text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: 24 }}>
              <div style={{
                background: 'rgba(239, 68, 68, 0.05)', borderRadius: 12, padding: 16,
                border: '1px solid rgba(239, 68, 68, 0.2)', marginBottom: 20
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                  <span style={{ color: 'var(--admin-text-muted)' }}>Request ID:</span>
                  <span style={{ fontWeight: 800, color: 'var(--admin-text)', fontFamily: 'monospace' }}>{rejectRequestTarget.request_number}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                  <span style={{ color: 'var(--admin-text-muted)' }}>Provider:</span>
                  <span style={{ fontWeight: 700, color: 'var(--admin-text)' }}>
                    {rejectRequestTarget.provider_type === 'doctor' ? (rejectRequestTarget.doctor?.name || 'Doctor') : (rejectRequestTarget.hospital?.name || 'Hospital')}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, paddingTop: 6, borderTop: '1px dashed rgba(239, 68, 68, 0.3)' }}>
                  <span style={{ fontWeight: 800, color: '#DC2626' }}>Commission Amount:</span>
                  <span style={{ fontWeight: 900, color: '#DC2626', fontSize: 16 }}>৳{Number(rejectRequestTarget.amount || 0).toLocaleString()}</span>
                </div>
              </div>

              <p style={{ fontSize: 13, color: 'var(--admin-text)', marginBottom: 16, lineHeight: 1.5 }}>
                Rejecting this request will mark the request as REJECTED and revert all included appointments back to <strong>UNPAID / DUE</strong> so the provider can re-verify and resubmit.
              </p>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 6 }}>
                  Rejection Reason <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className="admin-form-input"
                  placeholder="e.g. Transaction ID not found in bank statement / Invalid TrxID"
                  value={rejectRequestReason}
                  onChange={e => setRejectRequestReason(e.target.value)}
                  style={{ width: '100%', height: 40 }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="admin-btn admin-btn-outline"
                  onClick={() => setRejectRequestTarget(null)}
                  disabled={rejectingRequest}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn-primary"
                  style={{ background: '#EF4444', borderColor: '#EF4444', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800 }}
                  onClick={handleConfirmRejectRequest}
                  disabled={rejectingRequest}
                >
                  {rejectingRequest ? 'Rejecting...' : 'Confirm Rejection'}
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
