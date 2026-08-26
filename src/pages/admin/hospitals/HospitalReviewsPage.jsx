import React, { useState, useMemo } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { getHospitals } from '../../../api/hospitalApi'
import { ReviewList, ReviewReplyModal, ReviewReportModal, ReviewSkeleton } from '../../../components/reviews'
import { Building2, AlertCircle } from 'lucide-react'

/**
 * Enterprise Hospital Portal Review Management Page
 * Allows authenticated hospital managers to inspect live patient ratings, star breakdowns, and respond with official replies.
 */
export default function HospitalReviewsPage() {
  const { user } = useAuth()
  const [selectedReviewForReply, setSelectedReviewForReply] = useState(null)
  const [selectedReviewForReport, setSelectedReviewForReport] = useState(null)

  // 1. Fetch hospitals using TanStack Query (matching HospitalListPage / AppointmentListPage pattern)
  const { data: hospitalList, isLoading: loadingHospitals } = useQuery({
    queryKey: ['hospitals', { per_page: 500 }],
    queryFn: async () => {
      const res = await getHospitals({ per_page: 500 })
      const raw = res.data
      if (raw?.data && Array.isArray(raw.data)) return raw.data
      if (Array.isArray(raw)) return raw
      return []
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  })

  // 2. Resolve active hospital belonging to the authenticated manager
  const myHospital = useMemo(() => {
    if (!hospitalList?.length || !user) return null
    return hospitalList.find(
      (h) =>
        String(h.user_id) === String(user?.id) ||
        (user?.email && h.email?.toLowerCase() === user?.email?.toLowerCase()) ||
        (user?.phone && h.phone === user?.phone)
    )
  }, [hospitalList, user])

  const hospitalId = myHospital?.id || myHospital?.public_id || null

  // 3. While loading hospital directory, render skeleton instead of premature error
  if (loadingHospitals) {
    return (
      <div className="admin-page-container p-4">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4 pb-2 border-bottom border-light-subtle">
          <div>
            <h4 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
              <Building2 size={24} className="text-success" />
              হাসপাতাল রিভিউ ও রেটিং (Hospital Reviews)
            </h4>
            <p className="text-muted small mb-0">
              আপনার হাসপাতাল প্রোফাইল লোড হচ্ছে...
            </p>
          </div>
        </div>
        <div className="bg-white rounded-4 shadow-sm p-4 border border-light-subtle">
          <ReviewSkeleton count={3} />
        </div>
      </div>
    )
  }

  // 4. If loading completed AND no hospital profile matched
  if (!hospitalId) {
    return (
      <div className="admin-page-container p-4">
        <div className="alert alert-warning d-flex align-items-center gap-2 rounded-4 shadow-sm">
          <AlertCircle size={20} />
          <div>
            <strong>হাসপাতাল প্রোফাইল পাওয়া যায়নি:</strong> আপনার অ্যাকাউন্টের সাথে কোনো সক্রিয় হাসপাতাল প্রোফাইল সংযুক্ত নেই।
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-page-container p-4">
      {/* Page Header */}
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4 pb-2 border-bottom border-light-subtle">
        <div>
          <h4 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
            <Building2 size={24} className="text-success" />
            হাসপাতাল রিভিউ ও রেটিং (Hospital Reviews)
          </h4>
          <p className="text-muted small mb-0">
            {myHospital.name ? `${myHospital.name}-এ` : 'আপনার হাসপাতালে'} সেবা নেওয়া রোগীদের সামগ্রিক রেটিং, পরিচ্ছন্নতা, স্টাফদের আচরণ ও অভিজ্ঞতার মতামত দেখুন এবং প্রাতিষ্ঠানিক উত্তর দিন।
          </p>
        </div>
      </div>

      {/* Reused Live Review List Component */}
      <div className="bg-white rounded-4 shadow-sm p-4 border border-light-subtle">
        <ReviewList
          hospitalId={hospitalId}
          title="হাসপাতালের সামগ্রিক মূল্যায়ন"
          currentUser={user}
          isLoggedIn={true}
          canWrite={false}
          showReplyFilter={true}
          onReply={(rev) => setSelectedReviewForReply(rev)}
          onReport={(rev) => setSelectedReviewForReport(rev)}
        />
      </div>

      {/* Official Reply Modal */}
      <ReviewReplyModal
        show={Boolean(selectedReviewForReply)}
        onHide={() => setSelectedReviewForReply(null)}
        review={selectedReviewForReply}
        responderType="hospital"
        responderId={hospitalId}
      />

      {/* Abuse Dispute / Report Modal */}
      <ReviewReportModal
        show={Boolean(selectedReviewForReport)}
        onHide={() => setSelectedReviewForReport(null)}
        review={selectedReviewForReport}
      />
    </div>
  )
}
