// SpecialtyListPage.jsx — Premium Specialty Management & Approval Suite (Admin)
import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Check, X, Clock, CheckCircle2, User, Phone, AlertCircle } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { useAdminSpecialties, useAdminSpecialtyMutations } from '../../../hooks/admin/useAdminSpecialties'
import DeleteModal from '../../../components/admin/DeleteModal'
import ListToolbar from '../../../components/admin/ListToolbar'
import useTableUrlFilters from '../../../hooks/useTableUrlFilters'
import { TableSkeleton } from '../../../components/common/Skeletons'
import EmptyState from '../../../components/common/EmptyState'
import CompactUlid from '../../../components/common/CompactUlid'
import TableFooter from '../../../components/admin/TableFooter'
import { getErrorMessage } from '../../../utils/errorHelper'

export default function SpecialtyListPage() {
  const { isAdmin } = useAuth()
  const navigate = useNavigate()
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [statusTab, setStatusTab] = useState('approved') // 'approved', 'pending', 'all'
  const [rejectTarget, setRejectTarget] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [reassignSpecialtyId, setReassignSpecialtyId] = useState('')
  const [approvingId, setApprovingId] = useState(null)

  const {
    search,
    setSearch,
    currentPage,
    setCurrentPage,
    perPage,
    setPerPage,
    resetFilters
  } = useTableUrlFilters({
    storageKey: 'admin_specialties_filters'
  })

  // Enterprise TanStack Query Hooks with status: 'all' to load both active & pending requests
  const { specialties: items, isLoading: loading, isFetching: refreshing, refetch: fetchData } = useAdminSpecialties({ status: 'all' })
  const {
    deleteSpecialty,
    isDeleting: deleting,
    approveSpecialty,
    rejectSpecialty,
    isRejecting
  } = useAdminSpecialtyMutations()

  const approvedCount = useMemo(() => items.filter(i => (i.status || 'approved') === 'approved').length, [items])
  const pendingCount  = useMemo(() => items.filter(i => i.status === 'pending').length, [items])
  const allCount      = items.length

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      const res = await deleteSpecialty(deleteTarget.id)
      toast.success(res?.data?.message || 'Specialty deleted successfully')
    } catch (err) {
      console.error('Failed to delete specialty', err)
      toast.error(getErrorMessage(err, 'Failed to delete specialty.'))
    } finally {
      setDeleteTarget(null)
    }
  }

  const handleApprove = async (item) => {
    setApprovingId(item.id)
    try {
      const res = await approveSpecialty(item.id)
      toast.success(res?.data?.message || `"${item.name}" স্পেশালটি সফলভাবে অনুমোদন করা হয়েছে!`)
    } catch (err) {
      console.error('Failed to approve specialty', err)
      toast.error(getErrorMessage(err, 'স্পেশালটি অনুমোদন করতে ব্যর্থ হয়েছে।'))
    } finally {
      setApprovingId(null)
    }
  }

  const handleOpenReject = (item) => {
    setRejectTarget(item)
    setRejectReason('')
    setReassignSpecialtyId('')
  }

  const handleConfirmReject = async () => {
    if (!rejectTarget) return
    try {
      const payload = {}
      if (rejectReason.trim()) payload.rejection_reason = rejectReason.trim()
      if (reassignSpecialtyId) payload.reassign_to_specialty_id = Number(reassignSpecialtyId)

      const res = await rejectSpecialty({ id: rejectTarget.id, data: payload })
      toast.success(res?.data?.message || `"${rejectTarget.name}" রিকোয়েস্ট বাতিল করা হয়েছে।`)
      setRejectTarget(null)
    } catch (err) {
      console.error('Failed to reject specialty', err)
      toast.error(getErrorMessage(err, 'রিকোয়েস্ট বাতিল করতে ব্যর্থ হয়েছে।'))
    }
  }

  const filtered = useMemo(() => {
    return items.filter(i => {
      // Tab filter
      const itemStatus = i.status || 'approved'
      if (statusTab === 'approved' && itemStatus !== 'approved') return false
      if (statusTab === 'pending' && itemStatus !== 'pending') return false

      // Search filter
      const q = search.toLowerCase()
      const matchesSearch = !q ||
        i.name?.toLowerCase().includes(q) ||
        i.slug?.toLowerCase().includes(q) ||
        i.requested_by?.name?.toLowerCase().includes(q) ||
        i.requested_by?.phone?.includes(q)

      return matchesSearch
    })
  }, [items, statusTab, search])

  const paginatedData = filtered.slice((currentPage - 1) * perPage, currentPage * perPage)

  useEffect(() => {
    setCurrentPage(1)
  }, [filtered.length, statusTab])

  return (
    <div className="admin-container">
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">🩺 Specialties & Doctor Requests</h2>
          <p className="admin-page-subtitle">
            {approvedCount} active medical domains • {pendingCount} pending doctor request(s)
          </p>
        </div>
      </div>

      {/* ── Status Tabs (Active vs Pending Requests) ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <button
          type="button"
          className={`admin-btn ${statusTab === 'approved' ? 'admin-btn-primary' : 'admin-btn-outline'}`}
          onClick={() => setStatusTab('approved')}
          style={{ height: 38, display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
        >
          <CheckCircle2 size={16} />
          সক্রিয় স্পেশালটি ({approvedCount})
        </button>

        <button
          type="button"
          className={`admin-btn ${statusTab === 'pending' ? 'admin-btn-primary' : 'admin-btn-outline'}`}
          onClick={() => setStatusTab('pending')}
          style={{
            height: 38,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontWeight: 700,
            ...(statusTab !== 'pending' && pendingCount > 0 ? { borderColor: '#EAB308', color: '#B45309', background: '#FEFCE8' } : {})
          }}
        >
          <Clock size={16} />
          অনুমোদনের অপেক্ষা ({pendingCount})
          {pendingCount > 0 && (
            <span
              style={{
                marginLeft: 4,
                background: statusTab === 'pending' ? '#FFFFFF' : '#DC2626',
                color: statusTab === 'pending' ? '#00B875' : '#FFFFFF',
                fontSize: 11,
                padding: '2px 7px',
                borderRadius: 10,
                fontWeight: 800
              }}
            >
              {pendingCount}
            </span>
          )}
        </button>

        <button
          type="button"
          className={`admin-btn ${statusTab === 'all' ? 'admin-btn-primary' : 'admin-btn-outline'}`}
          onClick={() => setStatusTab('all')}
          style={{ height: 38, display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}
        >
          সকল তালিকা ({allCount})
        </button>
      </div>

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={statusTab === 'pending' ? 'Search by specialty or requesting doctor...' : 'Search specialty by name, slug...'}
        onRefresh={fetchData}
        refreshing={refreshing || loading}
        actions={
          isAdmin && (
            <Link to="/admin/specialties/create" className="admin-btn admin-btn-primary" style={{ height: 38, display: 'inline-flex', alignItems: 'center' }}>
              + Add Specialty
            </Link>
          )
        }
      />

      <div className="admin-card">
        <div className="admin-card-header" style={{ background: 'rgba(0,0,0,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="admin-card-title" style={{ color: 'var(--admin-text)' }}>
            {statusTab === 'pending' ? 'ডাক্তারদের নতুন স্পেশালটি রিকোয়েস্ট তালিকা' : statusTab === 'all' ? 'সকল স্পেশালটি ক্যাটালগ' : 'সক্রিয় পেশাদার স্পেশালটিসমূহ'}
          </h3>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: statusTab === 'pending' ? '#B45309' : 'var(--admin-primary)',
              background: statusTab === 'pending' ? '#FEF3C7' : 'rgba(0, 168, 140, 0.1)',
              padding: '4px 12px',
              borderRadius: 20
            }}
          >
            {filtered.length} {statusTab === 'pending' ? 'টি রিকোয়েস্ট অপেক্ষমান' : 'Specialties Filtered'}
          </span>
        </div>

        {(loading && items.length === 0) ? (
          <TableSkeleton rowCount={6} columnWidths={['100px', '35%', '30%', '25%']} headers={['ID', 'Specialty Name', 'Source / Requester', 'Actions']} />
        ) : filtered.length === 0 ? (
          <EmptyState
            searchQuery={search}
            onClearSearch={() => setSearch('')}
            icon={statusTab === 'pending' ? '🕒' : '🩺'}
            title={statusTab === 'pending' ? 'অনুমোদনের জন্য কোনো রিকোয়েস্ট নেই' : 'No specialties found'}
            description={statusTab === 'pending' ? 'কোনো ডাক্তার নতুন স্পেশালটি রিকোয়েস্ট দিলে তা এখানে প্রদর্শিত হবে।' : 'Try a different search term or add a new medical specialty.'}
            primaryAction={isAdmin && statusTab !== 'pending' ? { label: '+ Add Specialty', to: '/admin/specialties/create' } : undefined}
          />
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 90, paddingLeft: 24, color: 'var(--admin-text-muted)' }}>ID</th>
                  <th style={{ color: 'var(--admin-text-muted)' }}>স্পেশালটির নাম (Specialty Name)</th>
                  <th style={{ color: 'var(--admin-text-muted)' }}>ইউআরএল স্লাগ (Slug)</th>
                  <th style={{ color: 'var(--admin-text-muted)' }}>উৎস / রিকোয়েস্টকারী</th>
                  <th style={{ color: 'var(--admin-text-muted)' }}>স্ট্যাটাস</th>
                  <th style={{ textAlign: 'right', paddingRight: 24, color: 'var(--admin-text-muted)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map(item => {
                  const isPending = item.status === 'pending'
                  const isRejected = item.status === 'rejected'
                  return (
                    <tr key={item.id} style={isPending ? { background: 'rgba(254, 243, 199, 0.25)' } : {}}>
                      <td style={{ paddingLeft: 24 }}>
                        <CompactUlid value={item.public_id || item.id} />
                      </td>
                      <td>
                        <div style={{ fontWeight: 800, color: 'var(--admin-text)', fontSize: 15.5 }}>
                          {item.name}
                        </div>
                        {item.rejection_reason && (
                          <div style={{ fontSize: 12, color: '#DC2626', marginTop: 3 }}>
                            বাতিলের কারণ: {item.rejection_reason}
                          </div>
                        )}
                      </td>
                      <td>
                        <code style={{ fontSize: 12, color: 'var(--admin-text-muted)', background: 'rgba(0,0,0,0.05)', padding: '2px 8px', borderRadius: 4 }}>
                          /{item.slug || 'no-slug'}
                        </code>
                      </td>
                      <td>
                        {item.requested_by ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 5 }}>
                              <User size={13} color="#059669" /> {item.requested_by.name}
                            </div>
                            <div style={{ fontSize: 12, color: '#64748B' }}>
                              {item.requested_by.phone || item.requested_by.email}
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: 12.5, color: '#64748B' }}>
                            সিস্টেম / অ্যাডমিন
                          </span>
                        )}
                      </td>
                      <td>
                        {isPending ? (
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#B45309', background: '#FEF3C7', padding: '3px 10px', borderRadius: 12, border: '1px solid #FDE68A', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={13} /> পেন্ডিং (Pending)
                          </span>
                        ) : isRejected ? (
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#DC2626', background: '#FEE2E2', padding: '3px 10px', borderRadius: 12, border: '1px solid #FCA5A5', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <X size={13} /> বাতিল (Rejected)
                          </span>
                        ) : (
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#047857', background: '#ECFDF5', padding: '3px 10px', borderRadius: 12, border: '1px solid #A7F3D0', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Check size={13} strokeWidth={3} /> সক্রিয় (Active)
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', paddingRight: 24 }}>
                        <div className="admin-actions" style={{ justifyContent: 'flex-end', display: 'flex', alignItems: 'center', gap: 6 }}>
                          {/* Approval Actions for Pending items */}
                          {isPending && (
                            <>
                              <button
                                type="button"
                                className="admin-btn admin-btn-sm"
                                style={{
                                  background: '#00B875',
                                  color: '#FFFFFF',
                                  border: 'none',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  padding: '5px 12px',
                                  fontSize: 12.5,
                                  fontWeight: 700,
                                  borderRadius: 6
                                }}
                                onClick={() => handleApprove(item)}
                                disabled={approvingId === item.id}
                                title="Approve Specialty"
                              >
                                <Check size={14} strokeWidth={3} />
                                {approvingId === item.id ? 'Approving...' : 'Approve'}
                              </button>

                              <button
                                type="button"
                                className="admin-btn admin-btn-sm"
                                style={{
                                  background: '#FEE2E2',
                                  color: '#DC2626',
                                  border: '1px solid #FCA5A5',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  padding: '5px 10px',
                                  fontSize: 12.5,
                                  fontWeight: 600,
                                  borderRadius: 6
                                }}
                                onClick={() => handleOpenReject(item)}
                                title="Reject Request"
                              >
                                <X size={14} />
                                Reject
                              </button>
                            </>
                          )}

                          <button 
                            className="admin-action-btn admin-action-btn-edit" 
                            onClick={() => navigate(`/admin/specialties/edit/${item.id}`)}
                            title="Edit Specialty"
                          >
                            <img src="/icons/edit.png" alt="Edit" />
                          </button>
                          <button 
                            className="admin-action-btn admin-action-btn-delete" 
                            onClick={() => setDeleteTarget(item)}
                            title="Delete Specialty"
                          >
                            <img src="/icons/delete.png" alt="Delete" />
                          </button>
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

      <TableFooter
        total={filtered.length}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        perPage={perPage}
        setPerPage={setPerPage}
      />

      <DeleteModal 
        show={!!deleteTarget} 
        title="Delete Specialty" 
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This might affect doctor listings.`} 
        onConfirm={handleDelete} 
        onCancel={() => setDeleteTarget(null)} 
        loading={deleting} 
      />

      {/* ── Reject Specialty Request Modal ── */}
      {rejectTarget && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: 16,
            width: '100%',
            maxWidth: 480,
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h4 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0F172A' }}>
                স্পেশালটি রিকোয়েস্ট বাতিল করুন
              </h4>
              <button
                type="button"
                onClick={() => setRejectTarget(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: 20 }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <p style={{ fontSize: 13.5, color: '#475569', marginBottom: 16 }}>
                আপনি <strong>"{rejectTarget.name}"</strong> স্পেশালটির রিকোয়েস্ট বাতিল করতে যাচ্ছেন।
                {rejectTarget.requested_by && (
                  <span style={{ display: 'block', marginTop: 4, color: '#059669', fontWeight: 600 }}>
                    রিকোয়েস্টকারী ডাক্তার: {rejectTarget.requested_by.name}
                  </span>
                )}
              </p>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6, display: 'block' }}>
                  বাতিলের কারণ (ঐচ্ছিক):
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="যেমন: এই স্পেশালটিটি ইতিমধ্যে বিদ্যমান বা মেডিকেল স্বীকৃতির সাথে মেলে না..."
                  rows={3}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6, display: 'block' }}>
                  ডাক্তারকে অন্য স্পেশালটিতে স্থানান্তর করুন (ঐচ্ছিক):
                </label>
                <select
                  value={reassignSpecialtyId}
                  onChange={(e) => setReassignSpecialtyId(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, background: '#FFFFFF' }}
                >
                  <option value="">কোনো স্থানান্তর নয় (পূর্বের অবস্থাতেই থাকবে)</option>
                  {items.filter(i => (i.status || 'approved') === 'approved' && i.id !== rejectTarget.id).map(spec => (
                    <option key={spec.id} value={spec.id}>{spec.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ padding: '14px 24px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="admin-btn admin-btn-outline"
                onClick={() => setRejectTarget(null)}
                disabled={isRejecting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn"
                style={{ background: '#DC2626', color: '#FFFFFF', border: 'none', fontWeight: 700 }}
                onClick={handleConfirmReject}
                disabled={isRejecting}
              >
                {isRejecting ? 'Rejecting...' : 'Reject Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .admin-container { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  )
}
