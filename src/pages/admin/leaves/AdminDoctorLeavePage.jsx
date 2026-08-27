import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'react-hot-toast'
import { 
  CalendarOff, Trash2, Calendar, Building2, Clock, 
  User, Stethoscope, Filter, X 
} from 'lucide-react'
import { getDoctorLeaves, deleteDoctorLeave } from '../../../api/leaveApi'
import { getDoctors } from '../../../api/doctorApi'
import DeleteModal from '../../../components/admin/DeleteModal'
import ListToolbar from '../../../components/admin/ListToolbar'
import TableFooter from '../../../components/admin/TableFooter'
import { TableSkeleton } from '../../../components/common/Skeletons'
import EmptyState from '../../../components/common/EmptyState'
import { getErrorMessage } from '../../../utils/errorHelper'
import '../../../styles/admin.css'
import '../../../styles/dialog.css'

export default function AdminDoctorLeavePage() {
  const [leaves, setLeaves] = useState([])
  const [doctors, setDoctors] = useState([])
  const [selectedDoctorId, setSelectedDoctorId] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [totalEntries, setTotalEntries] = useState(0)

  // Modal State
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // Fetch Doctors List for Filter Dropdown
  const fetchDoctorsList = useCallback(async () => {
    try {
      const res = await getDoctors({ per_page: 200 })
      const docList = res.data?.data?.data || res.data?.data || res.data || []
      setDoctors(docList)
    } catch (err) {
      console.error('Failed to load doctors list for filter', err)
    }
  }, [])

  // Fetch Leaves
  const fetchLeaves = useCallback(async (page = 1) => {
    try {
      setLoading(true)
      const params = {
        page,
        per_page: perPage,
      }
      if (selectedDoctorId) {
        params.doctor_id = selectedDoctorId
      }

      const res = await getDoctorLeaves(params)
      const paginatedData = res.data?.data
      if (paginatedData?.data) {
        setLeaves(paginatedData.data)
        setTotalEntries(paginatedData.total || paginatedData.data.length)
        setCurrentPage(paginatedData.current_page || 1)
      } else if (Array.isArray(paginatedData)) {
        setLeaves(paginatedData)
        setTotalEntries(paginatedData.length)
      } else {
        setLeaves([])
        setTotalEntries(0)
      }
    } catch (err) {
      console.error('Failed to fetch doctor leaves', err)
      toast.error(getErrorMessage(err, 'ছুটির তালিকা লোড করা সম্ভব হয়নি'))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [selectedDoctorId, perPage])

  useEffect(() => {
    fetchDoctorsList()
  }, [fetchDoctorsList])

  useEffect(() => {
    fetchLeaves(currentPage)
  }, [fetchLeaves, currentPage])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchLeaves(currentPage)
  }

  // Handle Delete
  const handleDeleteLeave = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await deleteDoctorLeave(deleteTarget.id)
      if (res.data?.success) {
        toast.success(res.data.message || 'ছুটি সফলভাবে মুছে ফেলা হয়েছে')
        setDeleteTarget(null)
        fetchLeaves(currentPage)
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'ছুটি মুছে ফেলা সম্ভব হয়নি'))
    } finally {
      setDeleting(false)
    }
  }

  // Determine status (Upcoming, Active, Past)
  const getLeaveStatus = (startDate, endDate) => {
    const today = new Date().toISOString().split('T')[0]
    if (endDate < today) {
      return { label: 'অতীত', bg: 'rgba(100, 116, 139, 0.1)', color: '#64748b', isPast: true }
    }
    if (startDate <= today && endDate >= today) {
      return { label: 'চলমান', bg: 'rgba(245, 158, 11, 0.15)', color: '#d97706', isActive: true }
    }
    return { label: 'আসন্ন', bg: 'rgba(0, 184, 117, 0.12)', color: '#00B875', isUpcoming: true }
  }

  // Calculate day difference
  const getDurationDays = (sDate, eDate) => {
    if (!sDate || !eDate) return 1
    const d1 = new Date(sDate)
    const d2 = new Date(eDate)
    const diffTime = Math.abs(d2 - d1)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    return diffDays
  }

  // Filter leaves based on client-side search query
  const filteredLeaves = leaves.filter((leave) => {
    if (!search || !search.trim()) return true
    const q = search.trim().toLowerCase()
    const docName = (leave.doctor?.name || '').toLowerCase()
    const docNameBn = (leave.doctor?.name_bn || '').toLowerCase()
    const docSpecialty = (leave.doctor?.specialty?.name || leave.doctor?.specialty || '').toLowerCase()
    const chamberName = (leave.chamber?.hospital?.name || leave.chamber?.hospital_name || '').toLowerCase()
    const reason = (leave.reason || '').toLowerCase()
    const sDate = (leave.start_date || '').toLowerCase()
    const eDate = (leave.end_date || '').toLowerCase()

    return (
      docName.includes(q) ||
      docNameBn.includes(q) ||
      docSpecialty.includes(q) ||
      chamberName.includes(q) ||
      reason.includes(q) ||
      sDate.includes(q) ||
      eDate.includes(q)
    )
  })

  const selectedDoctorObj = doctors.find((d) => String(d.id) === String(selectedDoctorId))
  const activeFilters = selectedDoctorId
    ? [{ key: 'doctor', label: `ডাক্তার: ${selectedDoctorObj?.name || selectedDoctorId}`, onRemove: () => setSelectedDoctorId('') }]
    : []

  return (
    <div className="admin-container" style={{ padding: '24px 28px' }}>
      {/* ── Page Header ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: 'var(--admin-text, #0f172a)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              margin: 0,
            }}
          >
            <CalendarOff size={24} style={{ color: 'var(--admin-primary, #00B875)' }} />
            ডাক্তার ছুটি ব্যবস্থাপনা
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--admin-text-muted, #64748b)', fontSize: 13.5 }}>
            সকল নিবন্ধিত ডাক্তারের ছুটির তালিকা ও তথ্যাদি পর্যবেক্ষণ করুন
          </p>
        </div>
      </div>

      {/* ── List Toolbar with Doctor Filter ── */}
      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="ডাক্তার, চেম্বার বা কারণ খুঁজুন..."
        onRefresh={handleRefresh}
        refreshing={refreshing}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters((prev) => !prev)}
        hasActiveFilters={Boolean(selectedDoctorId)}
        onClearFilters={() => setSelectedDoctorId('')}
        filterCount={selectedDoctorId ? 1 : 0}
        activeFilters={activeFilters}
      >
        {/* Advanced Filter Subpanel */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'flex-end', paddingTop: 4 }}>
          <div style={{ flex: '1 1 260px' }}>
            <label
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--admin-text-muted, #64748b)',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                marginBottom: 6,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              <User size={13} /> ডাক্তার অনুযায়ী ফিল্টার
            </label>
            <select
              value={selectedDoctorId}
              onChange={(e) => {
                setSelectedDoctorId(e.target.value)
                setCurrentPage(1)
              }}
              style={{
                width: '100%',
                height: 40,
                padding: '0 12px',
                borderRadius: 'var(--admin-radius-sm, 6px)',
                border: '1px solid var(--admin-border, #e2e8f0)',
                background: 'var(--admin-card-bg, #ffffff)',
                color: 'var(--admin-text, #0f172a)',
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              <option value="">সকল ডাক্তার</option>
              {doctors.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.name} {doc.specialty ? `(${doc.specialty})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </ListToolbar>

      {/* ── Table Card ── */}
      <div
        className="admin-card"
        style={{
          background: 'var(--admin-card-bg, #ffffff)',
          border: '1px solid var(--admin-border, #e2e8f0)',
          borderRadius: 14,
          overflow: 'hidden',
          boxShadow: 'var(--admin-shadow-sm, 0 1px 2px rgba(0,0,0,0.05))',
        }}
      >
        {loading ? (
          <div style={{ padding: 20 }}>
            <TableSkeleton rows={5} cols={6} />
          </div>
        ) : filteredLeaves.length === 0 ? (
          <div style={{ padding: '48px 20px' }}>
            <EmptyState
              icon={<CalendarOff size={48} style={{ color: 'var(--admin-text-muted, #94a3b8)' }} />}
              title="কোনো ছুটির রেকর্ড পাওয়া যায়নি"
              message={
                search || selectedDoctorId
                  ? 'ফিল্টারের সাথে মেলে এমন কোনো ছুটির রেকর্ড পাওয়া যায়নি।'
                  : 'বর্তমানে কোনো ডাক্তারের ছুটির তথ্য ডাটাবেজে নেই।'
              }
              actionLabel={selectedDoctorId ? 'ফিল্টার পরিষ্কার করুন' : undefined}
              onAction={selectedDoctorId ? () => setSelectedDoctorId('') : undefined}
            />
          </div>
        ) : (
          <div className="table-responsive" style={{ overflowX: 'auto' }}>
            <table
              className="admin-table"
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: 13.5,
                textAlign: 'left',
              }}
            >
              <thead>
                <tr
                  style={{
                    background: 'var(--admin-bg, #f8fafc)',
                    borderBottom: '1px solid var(--admin-border, #e2e8f0)',
                    color: 'var(--admin-text-muted, #64748b)',
                    fontSize: 12,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  <th style={{ padding: '14px 18px' }}>ডাক্তার</th>
                  <th style={{ padding: '14px 18px' }}>ছুটির তারিখ ও মেয়াদ</th>
                  <th style={{ padding: '14px 18px' }}>চেম্বার</th>
                  <th style={{ padding: '14px 18px' }}>অবস্থা</th>
                  <th style={{ padding: '14px 18px' }}>ছুটির কারণ</th>
                  <th style={{ padding: '14px 18px', textAlign: 'right' }}>অ্যাকশন</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeaves.map((item) => {
                  const status = getLeaveStatus(item.start_date, item.end_date)
                  const duration = getDurationDays(item.start_date, item.end_date)

                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: '1px solid var(--admin-border, #f1f5f9)',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--admin-hover, rgba(0,0,0,0.015))')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* Doctor Info */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: '50%',
                              background: 'rgba(0, 184, 117, 0.1)',
                              color: 'var(--admin-primary, #00B875)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: 14,
                              flexShrink: 0,
                            }}
                          >
                            <Stethoscope size={18} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--admin-text, #0f172a)' }}>
                              {item.doctor?.name || 'ডাক্তার'}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--admin-text-muted, #64748b)' }}>
                              {item.doctor?.specialty?.name || item.doctor?.specialty || item.doctor?.degree || 'বিশেষজ্ঞ'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Date & Duration */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--admin-text, #0f172a)' }}>
                          {item.start_date === item.end_date
                            ? item.start_date
                            : `${item.start_date} হতে ${item.end_date}`}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: 'var(--admin-text-muted, #64748b)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            marginTop: 2,
                          }}
                        >
                          <Clock size={13} /> {duration} দিন ছুটি
                        </div>
                      </td>

                      {/* Chamber */}
                      <td style={{ padding: '14px 18px' }}>
                        {item.chamber ? (
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--admin-text, #0f172a)' }}>
                              {item.chamber.hospital?.name || item.chamber.hospital_name || 'নির্দিষ্ট চেম্বার'}
                            </div>
                            {item.chamber.day && (
                              <div style={{ fontSize: 12, color: 'var(--admin-text-muted, #64748b)' }}>
                                {item.chamber.day}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '3px 9px',
                              borderRadius: 6,
                              background: 'rgba(59, 130, 246, 0.1)',
                              color: '#3b82f6',
                              fontSize: 12,
                              fontWeight: 600,
                            }}
                          >
                            সকল চেম্বার
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 18px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '4px 10px',
                            borderRadius: 20,
                            background: status.bg,
                            color: status.color,
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          {status.label}
                        </span>
                      </td>

                      {/* Reason */}
                      <td style={{ padding: '14px 18px', color: 'var(--admin-text, #334155)', maxWidth: 220 }}>
                        {item.reason ? (
                          <span title={item.reason} style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {item.reason}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--admin-text-muted, #94a3b8)', fontStyle: 'italic' }}>
                            উল্লেখ নেই
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        {status.isPast ? (
                          <button
                            type="button"
                            disabled
                            title="অতীতের ছুটির রেকর্ড মুছে ফেলা সম্ভব নয়"
                            aria-label="অতীতের ছুটির রেকর্ড মুছে ফেলা সম্ভব নয়"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 34,
                              height: 34,
                              borderRadius: 8,
                              border: '1px solid var(--admin-border, #e2e8f0)',
                              background: 'transparent',
                              color: 'var(--admin-text-muted, #94a3b8)',
                              cursor: 'not-allowed',
                              opacity: 0.4,
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(item)}
                            title="ছুটি মুছে ফেলুন"
                            aria-label="ছুটি মুছে ফেলুন"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 34,
                              height: 34,
                              borderRadius: 8,
                              border: '1px solid var(--admin-border, #e2e8f0)',
                              background: 'transparent',
                              color: 'var(--admin-danger, #ef4444)',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
                              e.currentTarget.style.borderColor = 'var(--admin-danger, #ef4444)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent'
                              e.currentTarget.style.borderColor = 'var(--admin-border, #e2e8f0)'
                            }}
                          >
                            <Trash2 size={16} />
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

        {/* ── Table Pagination Footer ── */}
        {!loading && totalEntries > 0 && (
          <TableFooter
            total={totalEntries}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            perPage={perPage}
            setPerPage={setPerPage}
          />
        )}
      </div>

      {/* ── Delete Confirmation Modal ── */}
      <DeleteModal
        show={Boolean(deleteTarget)}
        title="ডাক্তারের ছুটি মুছে ফেলতে চান?"
        message={`আপনি কি নিশ্চিত যে ${deleteTarget?.doctor?.name ? `${deleteTarget.doctor.name}-এর` : ''} এই ছুটিটি মুছে ফেলতে চান? এটি মুছে ফেললে নির্ধারিত তারিখে পুনরায় অ্যাপয়েন্টমেন্ট নেওয়া যাবে।`}
        onConfirm={handleDeleteLeave}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
        confirmText="হ্যাঁ, মুছে ফেলুন"
        cancelText="বাতিল"
      />
    </div>
  )
}
