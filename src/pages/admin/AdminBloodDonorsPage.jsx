import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  HeartHandshake, Search, Filter, RotateCcw, Phone, MapPin, 
  Clock, ShieldAlert, CheckCircle2, AlertTriangle, Trash2, 
  Calendar, UserCheck, RefreshCw, ChevronLeft, ChevronRight,
  ExternalLink, Droplet, UserX, X
} from 'lucide-react'
import {
  getAdminBloodDonors,
  getAdminBloodDonorStats,
  revertDonorDonation,
  updateAdminDonorStatus,
  deleteAdminDonor
} from '../../api/bloodDonorApi'
import { getDivisions, getDistricts, getUpazilas } from '../../api/locationApi'
import { getMediaUrl } from '../../utils/mediaUtils'
import { useAuth } from '../../context/AuthContext'
import ListToolbar from '../../components/admin/ListToolbar'
import TableFooter from '../../components/admin/TableFooter'
import EmptyState from '../../components/common/EmptyState'
import CompactUlid from '../../components/common/CompactUlid'
import { TableSkeleton } from '../../components/common/Skeletons'
import DeleteModal from '../../components/admin/DeleteModal'
import toast from 'react-hot-toast'

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const enToBn = { '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪', '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯' }
const toBn = (str) => str !== null && str !== undefined && str !== '' ? String(str).replace(/\d/g, d => enToBn[d] || d) : ''

// Custom Searchable Dropdown Component (matching PatientListPage)
function SearchableSelect({ label, options = [], value, onChange, placeholder, disabled = false }) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOption = options.find(opt => String(opt.id) === String(value))
  const filteredOptions = options
    .filter(opt => {
      const name = opt.bangla_name || opt.name || ''
      return name.toLowerCase().includes(search.toLowerCase())
    })
    .sort((a, b) => (a.bangla_name || a.name || '').localeCompare(b.bangla_name || b.name || ''))

  return (
    <div style={{ position: 'relative', flex: '1 1 180px', opacity: disabled ? 0.6 : 1 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </label>
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
          {selectedOption ? (selectedOption.bangla_name || selectedOption.name) : placeholder}
        </span>
        <span style={{ fontSize: 10, color: 'var(--admin-text-muted)' }}>{isOpen ? '▲' : '▼'}</span>
      </div>

      {isOpen && (
        <div style={{ 
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', borderRadius: 12, marginTop: 6,
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)', overflow: 'hidden', zIndex: 1000
        }}>
          <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--admin-border)', background: 'rgba(0,0,0,0.02)' }}>
            <input 
              type="text" 
              autoFocus
              placeholder="খুঁজুন..." 
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--admin-border)', outline: 'none', fontSize: 13, background: 'var(--admin-card-bg)', color: 'var(--admin-text)' }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: 12 }}>কোনো মিল পাওয়া যায়নি</div>
            ) : (
              filteredOptions.map(opt => (
                <div 
                  key={opt.id} 
                  style={{ 
                    padding: '10px 14px', fontSize: 13, cursor: 'pointer', 
                    background: String(value) === String(opt.id) ? 'rgba(0, 184, 117, 0.1)' : 'transparent',
                    borderBottom: '1px solid var(--admin-border)',
                    color: 'var(--admin-text)'
                  }}
                  onMouseEnter={(e) => e.target.style.background = 'rgba(0,0,0,0.03)'}
                  onMouseLeave={(e) => e.target.style.background = String(value) === String(opt.id) ? 'rgba(0, 184, 117, 0.1)' : 'transparent'}
                  onClick={() => {
                    onChange(String(opt.id))
                    setIsOpen(false)
                    setSearch('')
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{opt.bangla_name || opt.name}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminBloodDonorsPage() {
  const { isAdmin } = useAuth()
  const [donors, setDonors] = useState([])
  const [stats, setStats] = useState({ total_donors: 0, ready_donors: 0, cooldown_donors: 0, paused_donors: 0 })
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [total, setTotal] = useState(0)

  // Filters State
  const [search, setSearch] = useState('')
  const [bloodGroup, setBloodGroup] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [divisionId, setDivisionId] = useState('')
  const [districtId, setDistrictId] = useState('')
  const [upazilaId, setUpazilaId] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(25)
  const [showFilters, setShowFilters] = useState(false)

  // Cascading Location Dropdowns
  const [divisions, setDivisions] = useState([])
  const [districts, setDistricts] = useState([])
  const [upazilas, setUpazilas] = useState([])

  // Modal State
  const [revertingDonor, setRevertingDonor] = useState(null)
  const [revertingLoading, setRevertingLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deletingLoading, setDeletingLoading] = useState(false)

  // Load Divisions
  useEffect(() => {
    getDivisions().then(res => setDivisions(res.data?.data || [])).catch(() => {})
  }, [])

  // Load Districts on Division change
  useEffect(() => {
    if (!divisionId) {
      setDistricts([])
      setDistrictId('')
      setUpazilas([])
      setUpazilaId('')
      return
    }
    getDistricts({ division_id: divisionId }).then(res => setDistricts(res.data?.data || [])).catch(() => {})
  }, [divisionId])

  // Load Upazilas on District change
  useEffect(() => {
    if (!districtId) {
      setUpazilas([])
      setUpazilaId('')
      return
    }
    getUpazilas({ district_id: districtId }).then(res => setUpazilas(res.data?.data || [])).catch(() => {})
  }, [districtId])

  // Fetch Stats
  const fetchStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const res = await getAdminBloodDonorStats()
      if (res.data?.success && res.data?.stats) {
        setStats(res.data.stats)
      }
    } catch {
      // Non-blocking
    } finally {
      setStatsLoading(false)
    }
  }, [])

  // Fetch Donors List
  const fetchDonors = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        page: currentPage,
        per_page: perPage,
        search: search.trim() || undefined,
        blood_group: bloodGroup || undefined,
        status: statusFilter || undefined,
        division_id: divisionId || undefined,
        district_id: districtId || undefined,
        upazila_id: upazilaId || undefined,
      }
      const res = await getAdminBloodDonors(params)
      if (res.data?.success) {
        setDonors(res.data.data || [])
        setTotal(res.data.meta?.total || (res.data.data || []).length)
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'রক্তদাতা তালিকা লোড করতে সমস্যা হয়েছে'
      toast.error(msg, { id: 'fetch-donors-error' })
    } finally {
      setLoading(false)
    }
  }, [currentPage, perPage, search, bloodGroup, statusFilter, divisionId, districtId, upazilaId])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  useEffect(() => {
    fetchDonors()
  }, [fetchDonors])

  const hasActiveFilters = Boolean(bloodGroup || statusFilter || divisionId || districtId || upazilaId)

  const clearFilters = () => {
    setBloodGroup('')
    setStatusFilter('')
    setDivisionId('')
    setDistrictId('')
    setUpazilaId('')
    setCurrentPage(1)
  }

  // Handle Revert Confirmation
  const confirmRevertDonation = async () => {
    if (!revertingDonor) return
    setRevertingLoading(true)
    try {
      const res = await revertDonorDonation(revertingDonor.id)
      if (res.data?.success) {
        toast.success(res.data.message || 'ভুল রক্তদান বাতিল এবং Cooldown রিসেট করা হয়েছে')
        setRevertingDonor(null)
        fetchDonors()
        fetchStats()
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'রক্তদান রেকর্ড বাতিল করতে ব্যর্থ হয়েছে')
    } finally {
      setRevertingLoading(false)
    }
  }

  // Handle Status Update
  const handleStatusChange = async (donorId, newStatus) => {
    try {
      const res = await updateAdminDonorStatus(donorId, { status: newStatus })
      if (res.data?.success) {
        toast.success(res.data.message || 'স্ট্যাটাস আপডেট হয়েছে')
        setDonors(prev => prev.map(d => d.id === donorId ? { ...d, status: newStatus } : d))
        fetchStats()
      }
    } catch {
      toast.error('স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে')
    }
  }

  // Handle Delete Confirmation
  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeletingLoading(true)
    try {
      const res = await deleteAdminDonor(deleteTarget.id)
      if (res.data?.success) {
        toast.success(res.data.message || 'রক্তদাতার তথ্য মুছে ফেলা হয়েছে')
        setDeleteTarget(null)
        fetchDonors()
        fetchStats()
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'মুছে ফেলতে ব্যর্থ হয়েছে')
    } finally {
      setDeletingLoading(false)
    }
  }

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      
      {/* ── 1. UNIFIED ADMIN PAGE HEADER ── */}
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title" style={{ color: 'var(--admin-text)' }}>
            <span style={{ marginRight: 12 }}>🩸</span>
            Blood Donors Registry
          </h2>
          <p className="admin-page-subtitle" style={{ color: 'var(--admin-text-muted)' }}>
            রক্তদাতাদের পূর্ণাঙ্গ তথ্য পর্যবেক্ষণ, স্ট্যাটাস কন্ট্রোল ও হেল্পলাইন Cooldown রিসেট
          </p>
        </div>
      </div>

      {/* ── 2. KPI STATS SUMMARY ROW ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: 16,
        marginBottom: 20
      }}>
        {/* Total Donors */}
        <div style={{
          background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', borderRadius: 14,
          padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14,
          boxShadow: 'var(--admin-shadow-sm)'
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'rgba(99, 102, 241, 0.1)', color: '#6366F1',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <HeartHandshake size={22} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              মোট রক্তদাতা
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--admin-text)', marginTop: 2 }}>
              {statsLoading ? '...' : toBn(stats.total_donors)}
            </div>
          </div>
        </div>

        {/* Ready to Donate */}
        <div style={{
          background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', borderRadius: 14,
          padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14,
          boxShadow: 'var(--admin-shadow-sm)'
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'rgba(16, 185, 129, 0.1)', color: '#10B981',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              রক্তদানে প্রস্তুত
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#10B981', marginTop: 2 }}>
              {statsLoading ? '...' : toBn(stats.ready_donors)}
            </div>
          </div>
        </div>

        {/* Cooldown Period */}
        <div style={{
          background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', borderRadius: 14,
          padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14,
          boxShadow: 'var(--admin-shadow-sm)'
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Clock size={22} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              বিশ্রামে (Cooldown)
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#F59E0B', marginTop: 2 }}>
              {statsLoading ? '...' : toBn(stats.cooldown_donors)}
            </div>
          </div>
        </div>

        {/* Paused / Inactive */}
        <div style={{
          background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', borderRadius: 14,
          padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14,
          boxShadow: 'var(--admin-shadow-sm)'
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <UserX size={22} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              প্রাপ্যতা বন্ধ / নিষ্ক্রিয়
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#EF4444', marginTop: 2 }}>
              {statsLoading ? '...' : toBn(stats.paused_donors)}
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. STANDARD LIST TOOLBAR (MATCHING PATIENTLISTPAGE) ── */}
      <ListToolbar
        search={search}
        onSearchChange={(val) => { setSearch(val); setCurrentPage(1); }}
        searchPlaceholder="নাম, মোবাইল নম্বর, রক্তের গ্রুপ বা এলাকা দিয়ে খুঁজুন..."
        onRefresh={() => { fetchDonors(); fetchStats(); }}
        refreshing={loading}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(p => !p)}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
        activeFilters={[
          divisionId && {
            key: 'division',
            label: `বিভাগ: ${divisions.find(d => String(d.id) === String(divisionId))?.bangla_name || divisions.find(d => String(d.id) === String(divisionId))?.name || divisionId}`,
            onRemove: () => setDivisionId('')
          },
          districtId && {
            key: 'district',
            label: `জেলা: ${districts.find(d => String(d.id) === String(districtId))?.bangla_name || districts.find(d => String(d.id) === String(districtId))?.name || districtId}`,
            onRemove: () => setDistrictId('')
          },
          upazilaId && {
            key: 'upazila',
            label: `উপজেলা: ${upazilas.find(u => String(u.id) === String(upazilaId))?.bangla_name || upazilas.find(u => String(u.id) === String(upazilaId))?.name || upazilaId}`,
            onRemove: () => setUpazilaId('')
          },
          bloodGroup && { key: 'blood_group', label: `গ্রুপ: ${bloodGroup}`, onRemove: () => setBloodGroup('') },
          statusFilter && {
            key: 'status',
            label: `স্ট্যাটাস: ${statusFilter === 'ready' ? 'প্রস্তুত' : (statusFilter === 'cooldown' ? 'বিশ্রামে' : (statusFilter === 'paused' ? 'বন্ধ' : 'ব্যান'))}`,
            onRemove: () => setStatusFilter('')
          },
        ].filter(Boolean)}
        actions={
          <a
            href="/blood-donors"
            target="_blank"
            rel="noopener noreferrer"
            className="admin-btn admin-btn-primary"
            style={{ height: 38, display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
          >
            <span>পাবলিক ডিরেক্টরি</span>
            <ExternalLink size={14} />
          </a>
        }
      >
        <SearchableSelect label="বিভাগ (Division)" placeholder="সকল বিভাগ" options={divisions} value={divisionId} onChange={setDivisionId} />
        <SearchableSelect label="জেলা (District)" placeholder="সকল জেলা" options={districts} value={districtId} onChange={setDistrictId} disabled={!divisionId} />
        <SearchableSelect label="উপজেলা (Upazila)" placeholder="সকল উপজেলা" options={upazilas} value={upazilaId} onChange={setUpazilaId} disabled={!districtId} />

        {/* Blood Group Select */}
        <div style={{ minWidth: 140, flex: '1 1 140px' }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            রক্তের গ্রুপ
          </label>
          <select
            value={bloodGroup}
            onChange={e => { setBloodGroup(e.target.value); setCurrentPage(1); }}
            style={{
              width: '100%',
              height: 42,
              padding: '0 12px',
              borderRadius: 10,
              border: '1px solid var(--admin-border)',
              background: 'var(--admin-card-bg)',
              color: bloodGroup ? 'var(--admin-text)' : 'var(--admin-text-muted)',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="">সকল গ্রুপ</option>
            {BLOOD_GROUPS.map(bg => (
              <option key={bg} value={bg}>{bg}</option>
            ))}
          </select>
        </div>

        {/* Status Select */}
        <div style={{ minWidth: 160, flex: '1 1 160px' }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            বর্তমান স্ট্যাটাস
          </label>
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            style={{
              width: '100%',
              height: 42,
              padding: '0 12px',
              borderRadius: 10,
              border: '1px solid var(--admin-border)',
              background: 'var(--admin-card-bg)',
              color: statusFilter ? 'var(--admin-text)' : 'var(--admin-text-muted)',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="">সকল স্ট্যাটাস</option>
            <option value="ready">🟢 রক্তদানে প্রস্তুত</option>
            <option value="cooldown">⏳ বিশ্রামে (Cooldown)</option>
            <option value="paused">⚪ প্রাপ্যতা বন্ধ</option>
            <option value="banned">🔴 ব্যান করা</option>
          </select>
        </div>
      </ListToolbar>

      {/* ── 4. DATA TABLE CARD (MATCHING PATIENTLISTPAGE) ── */}
      <div className="admin-card">
        <div
          className="admin-card-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            padding: '14px 20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h3 className="admin-card-title" style={{ margin: 0 }}>Blood Donor Records</h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--admin-text-muted, #64748B)',
                background: 'var(--admin-bg, #F8FAFC)',
                padding: '4px 10px',
                borderRadius: 8,
                border: '1px solid var(--admin-border, #E2E8F0)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              {loading ? (
                <span className="skeleton-box" style={{ width: 22, height: 14, borderRadius: 4 }} />
              ) : (
                <strong style={{ color: 'var(--admin-text, #0F172A)' }}>{toBn(total)}</strong>
              )}
              <span>Donors Found</span>
            </div>
          </div>
        </div>

        {!loading && total === 0 ? (
          <EmptyState
            hasFilters={hasActiveFilters}
            searchQuery={search}
            onClearFilters={clearFilters}
            onClearSearch={() => setSearch('')}
            icon="🩸"
            title="কোনো রক্তদাতার রেকর্ড পাওয়া যায়নি"
            description="অন্য কোনো ফিল্টার বা সার্চ দিয়ে চেষ্টা করুন অথবা ফিল্টার রিসেট করুন।"
          />
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '24%', color: 'var(--admin-text-muted)' }}>Donor Identity</th>
                  <th style={{ width: '12%', color: 'var(--admin-text-muted)' }}>Blood Group</th>
                  <th style={{ width: '18%', color: 'var(--admin-text-muted)' }}>Contact Info</th>
                  <th style={{ width: '18%', color: 'var(--admin-text-muted)' }}>Location Profile</th>
                  <th style={{ width: '14%', color: 'var(--admin-text-muted)' }}>Donation History</th>
                  <th style={{ width: '14%', color: 'var(--admin-text-muted)' }}>Status</th>
                  <th style={{ width: 140, textAlign: 'right', paddingRight: 20, color: 'var(--admin-text-muted)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(loading && donors.length === 0) ? (
                  Array.from({ length: 8 }).map((_, rIdx) => (
                    <tr key={`donor-skeleton-${rIdx}`}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="skeleton-box" style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0 }} />
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 0 }}>
                            <div className="skeleton-box" style={{ width: `${60 + (rIdx % 3) * 15}%`, height: 14, borderRadius: 4 }} />
                            <div className="skeleton-box" style={{ width: 85, height: 12, borderRadius: 4 }} />
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="skeleton-box" style={{ width: 50, height: 22, borderRadius: 6 }} />
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <div className="skeleton-box" style={{ width: 95, height: 14, borderRadius: 4 }} />
                          <div className="skeleton-box" style={{ width: 65, height: 11, borderRadius: 4 }} />
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <div className="skeleton-box" style={{ width: `${72 + (rIdx % 3) * 10}%`, height: 14, borderRadius: 4 }} />
                          <div className="skeleton-box" style={{ width: 55, height: 11, borderRadius: 4 }} />
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <div className="skeleton-box" style={{ width: 75, height: 14, borderRadius: 4 }} />
                          <div className="skeleton-box" style={{ width: 60, height: 11, borderRadius: 4 }} />
                        </div>
                      </td>
                      <td>
                        <div className="skeleton-box" style={{ width: 80, height: 20, borderRadius: 12 }} />
                      </td>
                      <td style={{ textAlign: 'right', paddingRight: 20 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <div className="skeleton-box" style={{ width: 28, height: 28, borderRadius: 6 }} />
                          <div className="skeleton-box" style={{ width: 28, height: 28, borderRadius: 6 }} />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : donors.map(donor => {
                  const isCooldown = Boolean(donor.days_until_available > 0 || donor.status === 'cooldown')

                  return (
                    <tr key={donor.id} style={{ transition: 'background 0.15s' }}>
                      
                      {/* Donor Identity */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 38, height: 38, borderRadius: '50%',
                            background: 'rgba(225, 29, 72, 0.1)', color: '#E11D48',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 800, fontSize: 13, overflow: 'hidden', flexShrink: 0
                          }}>
                            {donor.photo_url ? (
                              <img src={getMediaUrl(donor.photo_url)} alt={donor.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none' }} />
                            ) : (
                              donor.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--admin-text)', fontSize: 13.5, marginBottom: 2 }}>
                              {donor.name}
                            </div>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              <CompactUlid value={donor.id} />
                              <span style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>
                                {donor.gender === 'female' ? 'নারী' : (donor.gender === 'male' ? 'পুরুষ' : 'অন্যান্য')}
                                {donor.age && ` • ${toBn(donor.age)} বছর`}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Blood Group */}
                      <td>
                        <span style={{ 
                          fontSize: 11.5, 
                          fontWeight: 800, 
                          padding: '3px 9px', 
                          borderRadius: 8, 
                          background: 'rgba(239, 68, 68, 0.1)', 
                          color: '#EF4444',
                          border: '1px solid rgba(239, 68, 68, 0.2)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4
                        }}>
                          <Droplet size={12} fill="#EF4444" color="#EF4444" />
                          {donor.blood_group}
                        </span>
                      </td>

                      {/* Contact Info (Unmasked Phone for Admin) */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <a
                            href={`tel:${donor.contact_number}`}
                            style={{
                              fontSize: 13, color: '#0284C7', fontWeight: 700,
                              textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4
                            }}
                            title="কল করতে ক্লিক করুন"
                          >
                            <Phone size={12} />
                            {donor.contact_number}
                          </a>
                          {donor.alternate_contact_number && (
                            <div style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>
                              বিকল্প: {donor.alternate_contact_number}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Location Profile */}
                      <td>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--admin-text)' }}>
                          {[donor.upazila?.bangla_name || donor.upazila?.name, donor.district?.bangla_name || donor.district?.name].filter(Boolean).join(', ') || '—'}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', marginTop: 2 }}>
                          {[donor.union?.bangla_name || donor.union?.name, donor.village_or_area].filter(Boolean).join(', ') || donor.division?.bangla_name || donor.division?.name || ''}
                        </div>
                      </td>

                      {/* Donation History */}
                      <td>
                        <div style={{ fontSize: 12.5, color: 'var(--admin-text)', fontWeight: 600 }}>
                          {toBn(donor.total_donations || 0)} বার
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', marginTop: 1 }}>
                          {donor.last_donated_at ? toBn(donor.last_donated_at) : 'রেকর্ড নেই'}
                        </div>
                      </td>

                      {/* Live Status */}
                      <td>
                        {donor.status === 'banned' ? (
                          <span style={{
                            padding: '3px 8px', borderRadius: 6,
                            background: 'rgba(239, 68, 68, 0.1)', color: '#DC2626',
                            fontWeight: 700, fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4
                          }}>
                            <ShieldAlert size={12} />
                            ব্যান
                          </span>
                        ) : isCooldown ? (
                          <span style={{
                            padding: '3px 8px', borderRadius: 6,
                            background: 'rgba(245, 158, 11, 0.1)', color: '#D97706',
                            fontWeight: 700, fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4
                          }}>
                            <Clock size={12} />
                            বিশ্রামে ({toBn(donor.days_until_available)} দিন)
                          </span>
                        ) : donor.is_available ? (
                          <span style={{
                            padding: '3px 8px', borderRadius: 6,
                            background: 'rgba(16, 185, 129, 0.1)', color: '#059669',
                            fontWeight: 700, fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4
                          }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />
                            প্রস্তুত
                          </span>
                        ) : (
                          <span style={{
                            padding: '3px 8px', borderRadius: 6,
                            background: 'rgba(148, 163, 184, 0.15)', color: '#64748B',
                            fontWeight: 700, fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4
                          }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#94A3B8' }} />
                            বন্ধ
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right', paddingRight: 20 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                          
                          {/* KEY ACTION: Revert Accidental Donation (Reset Cooldown) */}
                          {(isCooldown || donor.total_donations > 0 || donor.last_donated_at) && (
                            <button
                              type="button"
                              onClick={() => setRevertingDonor(donor)}
                              title="হেল্পলাইনে রক্তদাতা ভুল রিপোর্ট করলে ক্লিক করে Cooldown রিসেট এবং সর্বশেষ রক্তদান রেকর্ড বাতিল করুন"
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                background: '#FFFBEB', border: '1px solid #FDE68A',
                                color: '#B45309', padding: '4px 8px', borderRadius: 6,
                                fontSize: 11, fontWeight: 700, cursor: 'pointer'
                              }}
                            >
                              <RotateCcw size={12} />
                              <span>রিসেট</span>
                            </button>
                          )}

                          {/* Status toggle dropdown */}
                          <select
                            value={donor.status}
                            onChange={(e) => handleStatusChange(donor.id, e.target.value)}
                            style={{
                              padding: '4px 6px', borderRadius: 6,
                              border: '1px solid var(--admin-border)', fontSize: 11,
                              fontWeight: 600, background: 'var(--admin-card-bg)', color: 'var(--admin-text)',
                              outline: 'none', cursor: 'pointer'
                            }}
                          >
                            <option value="active">সক্রিয়</option>
                            <option value="inactive">নিষ্ক্রিয়</option>
                            <option value="banned">ব্যান</option>
                          </select>

                          {/* Delete Action using standard icon */}
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(donor)}
                              className="admin-action-btn admin-action-btn-delete"
                              title="রক্তদাতার রেকর্ড মুছুন"
                            >
                              <img src="/icons/delete.png" alt="Delete" />
                            </button>
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

      {/* ── 5. STANDARDIZED TABLE FOOTER PAGINATION ── */}
      <TableFooter
        total={total}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        perPage={perPage}
        setPerPage={setPerPage}
      />

      {/* ── REVERT ACCIDENTAL DONATION MODAL ── */}
      {revertingDonor && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div style={{
            background: 'var(--admin-card-bg, #FFFFFF)', borderRadius: 18, width: '100%', maxWidth: 480,
            padding: '24px 26px', boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
            border: '1px solid var(--admin-border, #E2E8F0)', animation: 'fadeIn 0.2s ease-out'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: 'rgba(245, 158, 11, 0.15)', color: '#D97706',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <RotateCcw size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: 16.5, fontWeight: 800, color: 'var(--admin-text, #0F172A)', margin: 0 }}>
                  ভুল রক্তদান রেকর্ড বাতিল ও Cooldown রিসেট
                </h3>
                <span style={{ fontSize: 12, color: 'var(--admin-text-muted, #64748B)' }}>
                  রক্তদাতা: <strong>{revertingDonor.name}</strong> ({revertingDonor.blood_group})
                </span>
              </div>
            </div>

            <p style={{ fontSize: 13, color: 'var(--admin-text, #334155)', lineHeight: 1.6, margin: '0 0 14px' }}>
              রক্তদাতা যদি রক্ত না দিয়েও ভুলে <strong>"আমি আজ রক্ত দিয়েছি"</strong> নিশ্চিত করে থাকেন এবং হেল্পলাইনে জানান, তবে এই অ্যাকশনের মাধ্যমে:
            </p>

            <div style={{
              background: 'var(--admin-bg, #F8FAFC)', border: '1px solid var(--admin-border, #E2E8F0)', borderRadius: 12,
              padding: '12px 16px', fontSize: 12.5, color: 'var(--admin-text-muted, #475569)', lineHeight: 1.6, marginBottom: 20
            }}>
              <div>✔️ সর্বশেষ ভুল রক্তদান লগটি ডাটাবেজ থেকে মুছে যাবে।</div>
              <div>✔️ মোট রক্তদান সংখ্যা ১ কমে সঠিক অবস্থায় ফিরে যাবে।</div>
              <div>✔️ ৯০ দিনের Cooldown অবিলম্বে বাতিল হয়ে রক্তদাতা <strong>"রক্তদানে প্রস্তুত"</strong> হিসেবে সক্রিয় হবেন।</div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                type="button"
                disabled={revertingLoading}
                onClick={() => setRevertingDonor(null)}
                style={{
                  padding: '8px 16px', borderRadius: 8,
                  border: '1.5px solid var(--admin-border, #CBD5E1)', background: 'var(--admin-card-bg, #FFFFFF)',
                  color: 'var(--admin-text, #475569)', fontSize: 13, fontWeight: 700, cursor: 'pointer'
                }}
              >
                বাতিল
              </button>
              <button
                type="button"
                disabled={revertingLoading}
                onClick={confirmRevertDonation}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '8px 18px', borderRadius: 8,
                  border: 'none', background: '#D97706',
                  color: '#FFFFFF', fontSize: 13, fontWeight: 700, cursor: 'pointer'
                }}
              >
                {revertingLoading ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>রিসেট হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw size={14} />
                    <span>হ্যাঁ, ভুল রেকর্ড বাতিল ও প্রস্তুত করুন</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── STANDARD DELETE MODAL ── */}
      <DeleteModal
        show={Boolean(deleteTarget)}
        title="Remove Blood Donor Profile"
        message={`আপনি কি নিশ্চিত যে রক্তদাতা "${deleteTarget?.name}" এর প্রোফাইল মুছে ফেলতে চান?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deletingLoading}
      />

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}} />

    </div>
  )
}
