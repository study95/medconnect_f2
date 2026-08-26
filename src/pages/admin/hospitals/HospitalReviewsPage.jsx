import React, { useState, useMemo } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { getHospitals } from '../../../api/hospitalApi'
import { useHospitalReviews } from '../../../features/reviews/useReviews'
import { ReviewList, ReviewReplyModal, ReviewReportModal, ReviewSkeleton } from '../../../components/reviews'
import { Building2, AlertCircle, Star, Clock, CheckCircle2, MessageSquare } from 'lucide-react'

/**
 * Enterprise Hospital Portal Review Management Page
 * Allows authenticated hospital managers to inspect live patient ratings, KPI analytics, and respond with official replies.
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

  // Reusable query for KPI metrics computation (shares TanStack Query cache with ReviewList)
  const { data: reviewsData } = useHospitalReviews(hospitalId, {}, { enabled: Boolean(hospitalId) })

  const rawReviews = useMemo(() => {
    if (!reviewsData) return []
    return Array.isArray(reviewsData) ? reviewsData : reviewsData.data || []
  }, [reviewsData])

  const totalReviewsCount = reviewsData?.meta?.total ?? rawReviews.length
  const needsReplyCount = rawReviews.filter((r) => !r.hospital_reply && !r.hospitalReply).length
  const repliedCount = rawReviews.filter((r) => Boolean(r.hospital_reply || r.hospitalReply)).length
  const avgRating = myHospital?.rating_avg ? Number(myHospital.rating_avg).toFixed(1) : (
    rawReviews.length ? (rawReviews.reduce((acc, r) => acc + Number(r.rating || 0), 0) / rawReviews.length).toFixed(1) : '5.0'
  )

  // 3. While loading hospital directory, render skeleton instead of premature error
  if (loadingHospitals) {
    return (
      <div className="admin-page-container p-4">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4 pb-2 border-bottom border-light-subtle">
          <div>
            <h4 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
              <Building2 size={24} className="text-success" />
              Hospital Review Management (হাসপাতাল রিভিউ ব্যবস্থাপনা)
            </h4>
            <p className="text-muted small mb-0">
              আপনার হাসপাতাল প্রোফাইল ও রিভিউ লোড হচ্ছে...
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
      {/* 1. Dashboard Management Header */}
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4 pb-2 border-bottom border-light-subtle">
        <div>
          <h4 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
            <Building2 size={24} className="text-success" />
            Hospital Review Management (হাসপাতাল রিভিউ ব্যবস্থাপনা)
          </h4>
          <p className="text-muted small mb-0">
            {myHospital.name ? `${myHospital.name}-এ` : 'আপনার হাসপাতালে'} সেবা নেওয়া রোগীদের সামগ্রিক রেটিং, পরিচ্ছন্নতা, স্টাফদের আচরণ ও অফিশিয়াল উত্তর দেওয়ার নিয়ন্ত্রণ কেন্দ্র।
          </p>
        </div>
      </div>

      {/* 2. KPI Summary Cards */}
      <div className="row g-3 mb-4">
        {/* Average Rating Card */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100 border-start border-4 border-warning">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted small text-uppercase fw-semibold">গড় রেটিং (Average)</span>
                <h3 className="fw-bold text-dark mb-0 mt-1 d-flex align-items-center gap-1">
                  {avgRating}
                  <span className="text-warning fs-5">★</span>
                </h3>
              </div>
              <div className="p-3 bg-warning-subtle text-warning rounded-circle">
                <Star size={22} className="fill-warning" />
              </div>
            </div>
          </div>
        </div>

        {/* Total Reviews Card */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100 border-start border-4 border-primary">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted small text-uppercase fw-semibold">মোট রিভিউ (Total)</span>
                <h3 className="fw-bold text-dark mb-0 mt-1">
                  {totalReviewsCount}
                </h3>
              </div>
              <div className="p-3 bg-primary-subtle text-primary rounded-circle">
                <MessageSquare size={22} />
              </div>
            </div>
          </div>
        </div>

        {/* Needs Reply Card */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100 border-start border-4 border-info">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted small text-uppercase fw-semibold">উত্তর প্রয়োজন (Needs Reply)</span>
                <h3 className="fw-bold text-info mb-0 mt-1">
                  {needsReplyCount}
                </h3>
              </div>
              <div className="p-3 bg-info-subtle text-info rounded-circle">
                <Clock size={22} />
              </div>
            </div>
          </div>
        </div>

        {/* Replied Card */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100 border-start border-4 border-success">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted small text-uppercase fw-semibold">উত্তর সম্পন্ন (Replied)</span>
                <h3 className="fw-bold text-success mb-0 mt-1">
                  {repliedCount}
                </h3>
              </div>
              <div className="p-3 bg-success-subtle text-success rounded-circle">
                <CheckCircle2 size={22} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Reused Live Review List Component */}
      <div className="bg-white rounded-4 shadow-sm p-4 border border-light-subtle">
        <ReviewList
          hospitalId={hospitalId}
          title="হাসপাতালের সামগ্রিক মূল্যায়ন ও রিভিউ"
          currentUser={user}
          isLoggedIn={true}
          canWrite={false}
          showReplyFilter={true}
          onReply={(rev) => setSelectedReviewForReply(rev)}
          onReport={(rev) => setSelectedReviewForReport(rev)}
        />
      </div>

      {/* 4. Official Reply Modal */}
      <ReviewReplyModal
        show={Boolean(selectedReviewForReply)}
        onHide={() => setSelectedReviewForReply(null)}
        review={selectedReviewForReply}
        responderType="hospital"
        responderId={hospitalId}
      />

      {/* 5. Abuse Dispute / Report Modal */}
      <ReviewReportModal
        show={Boolean(selectedReviewForReport)}
        onHide={() => setSelectedReviewForReport(null)}
        review={selectedReviewForReport}
      />
    </div>
  )
}
