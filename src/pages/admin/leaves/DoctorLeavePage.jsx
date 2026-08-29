import { useState, useEffect, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { 
  CalendarOff, Plus, Trash2, Calendar, Building2, Clock, 
  AlertCircle, CheckCircle2, RefreshCw, X 
} from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { getDoctorLeaves, createDoctorLeave, deleteDoctorLeave } from '../../../api/leaveApi'
import { getDoctorChambers } from '../../../api/doctorApi'
import DeleteModal from '../../../components/admin/DeleteModal'
import ListToolbar from '../../../components/admin/ListToolbar'
import TableFooter from '../../../components/admin/TableFooter'
import { TableSkeleton } from '../../../components/common/Skeletons'
import EmptyState from '../../../components/common/EmptyState'
import DoctorLeaveForm from '../../../components/admin/leaves/DoctorLeaveForm'
import { getErrorMessage } from '../../../utils/errorHelper'
import '../../../styles/admin.css'
import '../../../styles/dialog.css'

export default function DoctorLeavePage() {
  const { user } = useAuth()
  const doctor = user?.doctor || (user?.doctor_id ? { id: user.doctor_id } : null)
  const doctorId = doctor?.id || null

  const [leaves, setLeaves] = useState([])
  const [chambers, setChambers] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [totalEntries, setTotalEntries] = useState(0)

  // Modal & Actions State
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverErrors, setServerErrors] = useState({})
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // Load Doctor's Chambers
  const fetchChambers = useCallback(async () => {
    try {
      const res = await getDoctorChambers({})
      const data = res.data?.data?.data || res.data?.data || res.data || []
      setChambers(data)
    } catch (err) {
      console.error('Failed to load doctor chambers', err)
    }
  }, [])

  // Fetch Leaves History
  const fetchLeaves = useCallback(async (page = 1) => {
    try {
      setLoading(true)
      const params = {
        page,
        per_page: perPage,
      }
      if (doctorId) {
        params.doctor_id = doctorId
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
  }, [doctorId, perPage])

  useEffect(() => {
    fetchChambers()
    fetchLeaves(currentPage)
  }, [fetchChambers, fetchLeaves, currentPage])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchLeaves(currentPage)
  }

  // Handle Leave Submission
  const handleCreateLeave = async (payload) => {
    setIsSubmitting(true)
    setServerErrors({})
    try {
      const res = await createDoctorLeave(payload)
      if (res.data?.success) {
        toast.success(res.data.message || 'ছুটি সফলভাবে যুক্ত করা হয়েছে')
        setShowCreateModal(false)
        fetchLeaves(1)
      }
    } catch (err) {
      const errRes = err?.response?.data
      if (errRes?.errors) {
        setServerErrors(errRes.errors)
      }
      console.error('Failed to create leave', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Leave Deletion
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
      console.error('Failed to delete leave', err)
    } finally {
      setDeleting(false)
    }
  }

  // Determine status of leave (Upcoming, Active Today, Past)
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

  // Filter leaves based on search query
  const filteredLeaves = leaves.filter((leave) => {
    if (!search || !search.trim()) return true
    const q = search.trim().toLowerCase()
    const chamberName = (leave.chamber?.hospital?.name || leave.chamber?.hospital_name || '').toLowerCase()
    const reason = (leave.reason || '').toLowerCase()
    const sDate = (leave.start_date || '').toLowerCase()
    const eDate = (leave.end_date || '').toLowerCase()
    return chamberName.includes(q) || reason.includes(q) || sDate.includes(q) || eDate.includes(q)
  })

  // Calculate day difference
  const getDurationDays = (sDate, eDate) => {
    if (!sDate || !eDate) return 1
    const d1 = new Date(sDate)
    const d2 = new Date(eDate)
    const diffTime = Math.abs(d2 - d1)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    return diffDays
  }

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
            আমার ছুটি ব্যবস্থাপনা
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--admin-text-muted, #64748b)', fontSize: 13.5 }}>
            আপনার চেম্বার বা সর্বজনীন ছুটির তালিকা পর্যবেক্ষণ ও নতুন ছুটি নির্ধারণ করুন
          </p>
        </div>

        <button
          onClick={() => {
            setServerErrors({})
            setShowCreateModal(true)
          }}
          className="admin-btn admin-btn-primary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            borderRadius: 10,
            border: 'none',
            background: 'var(--admin-primary, #00B875)',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: 13.5,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0, 184, 117, 0.25)',
          }}
        >
          <Plus size={18} />
          <span>নতুন ছুটি যোগ করুন</span>
        </button>
      </div>

      {/* ── List Toolbar ── */}
      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="ছুটির কারণ বা চেম্বার খুঁজুন..."
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />

      {/* ── Leaves Table Card ── */}
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
            <TableSkeleton rows={5} cols={5} />
          </div>
        ) : filteredLeaves.length === 0 ? (
          <div style={{ padding: '48px 20px' }}>
            <EmptyState
              icon={<CalendarOff size={48} style={{ color: 'var(--admin-text-muted, #94a3b8)' }} />}
              title="কোনো ছুটির রেকর্ড পাওয়া যায়নি"
              message={
                search
                  ? 'অনুসন্ধানের সাথে মেলে এমন কোনো ছুটি পাওয়া যায়নি।'
                  : 'আপনার কোনো ছুটির আবেদন সংরক্ষিত নেই। প্রয়োজন অনুযায়ী নতুন ছুটি যোগ করতে পারেন।'
              }
              actionLabel="নতুন ছুটি যোগ করুন"
              onAction={() => setShowCreateModal(true)}
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
                      <td style={{ padding: '14px 18px', color: 'var(--admin-text, #334155)', maxWidth: 260 }}>
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

      {/* ── Create Leave Modal ── */}
      {showCreateModal && (
        <div
          className="admin-modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 16,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSubmitting) {
              setShowCreateModal(false)
            }
          }}
        >
          <div
            className="admin-modal-card"
            style={{
              background: 'var(--admin-card-bg, #ffffff)',
              border: '1px solid var(--admin-border, #e2e8f0)',
              borderRadius: 16,
              width: '100%',
              maxWidth: 540,
              boxShadow: 'var(--admin-shadow-lg, 0 20px 25px -5px rgba(0,0,0,0.2))',
              overflow: 'hidden',
              animation: 'fadeIn 0.2s ease',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 20px',
                borderBottom: '1px solid var(--admin-border, #e2e8f0)',
                background: 'var(--admin-bg, #f8fafc)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CalendarOff size={18} style={{ color: 'var(--admin-primary, #00B875)' }} />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--admin-text, #0f172a)' }}>
                  নতুন ছুটি নির্ধারণ
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                disabled={isSubmitting}
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: 'var(--admin-text-muted, #64748b)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 4,
                  borderRadius: 6,
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form Body */}
            <div style={{ padding: '20px' }}>
              <DoctorLeaveForm
                doctorId={doctorId}
                doctor={doctor}
                chambers={chambers}
                onSubmit={handleCreateLeave}
                onCancel={() => setShowCreateModal(false)}
                isSubmitting={isSubmitting}
                serverErrors={serverErrors}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      <DeleteModal
        show={Boolean(deleteTarget)}
        title="ছুটি মুছে ফেলতে চান?"
        message="আপনি কি নিশ্চিত যে এই ছুটিটি মুছে ফেলতে চান? এটি মুছে ফেললে নির্ধারিত তারিখে পুনরায় রোগীরা অ্যাপয়েন্টমেন্ট বুক করতে পারবেন।"
        onConfirm={handleDeleteLeave}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
        confirmText="হ্যাঁ, মুছে ফেলুন"
        cancelText="বাতিল"
      />
    </div>
  )
}
