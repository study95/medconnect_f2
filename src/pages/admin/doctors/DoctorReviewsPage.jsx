import React, { useState, useMemo } from 'react'
import { useAuth } from '../../../context/AuthContext'
import useDoctors from '../../../hooks/useDoctors'
import { useDoctorReviews } from '../../../features/reviews/useReviews'
import { ReviewList, ReviewReplyModal, ReviewReportModal, ReviewSkeleton } from '../../../components/reviews'
import { MessageSquare, AlertCircle, Star, Clock, CheckCircle2, Award } from 'lucide-react'

/**
 * Enterprise Doctor Portal Review Management Page
 * Allows authenticated physicians to inspect live patient ratings, KPI analytics, and respond with official replies.
 */
export default function DoctorReviewsPage() {
  const { user } = useAuth()
  const { doctors, loading: loadingDoctors } = useDoctors()
  const [selectedReviewForReply, setSelectedReviewForReply] = useState(null)
  const [selectedReviewForReport, setSelectedReviewForReport] = useState(null)

  // Exact matching pattern reused from DoctorListPage.jsx and ChamberFormPage.jsx
  const myDoctor = useMemo(() => {
    if (!doctors?.length || !user) return null
    return doctors.find(
      (d) =>
        String(d.user_id) === String(user?.id) ||
        (user?.email && d.email?.toLowerCase() === user?.email?.toLowerCase()) ||
        (user?.phone && d.phone === user?.phone)
    )
  }, [doctors, user])

  const doctorId = myDoctor?.id || myDoctor?.public_id || null

  // Reusable query for KPI metrics computation (shares TanStack Query cache with ReviewList)
  const { data: reviewsData } = useDoctorReviews(doctorId, {}, { enabled: Boolean(doctorId) })

  const rawReviews = useMemo(() => {
    if (!reviewsData) return []
    return Array.isArray(reviewsData) ? reviewsData : reviewsData.data || []
  }, [reviewsData])

  const totalReviewsCount = reviewsData?.meta?.total ?? rawReviews.length
  const needsReplyCount = rawReviews.filter((r) => !r.doctor_reply && !r.doctorReply).length
  const repliedCount = rawReviews.filter((r) => Boolean(r.doctor_reply || r.doctorReply)).length
  const avgRating = myDoctor?.rating_avg ? Number(myDoctor.rating_avg).toFixed(1) : (
    rawReviews.length ? (rawReviews.reduce((acc, r) => acc + Number(r.rating || 0), 0) / rawReviews.length).toFixed(1) : '5.0'
  )

  // 1. While loading doctor profile
  if (loadingDoctors) {
    return (
      <div className="admin-page-container p-4">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4 pb-2 border-bottom border-light-subtle">
          <div>
            <h4 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
              <MessageSquare size={24} className="text-primary" />
              Patient Review Management (রোগীর রিভিউ ব্যবস্থাপনা)
            </h4>
            <p className="text-muted small mb-0">
              আপনার ডাক্তার প্রোফাইল ও রিভিউ লোড হচ্ছে...
            </p>
          </div>
        </div>
        <div className="bg-white rounded-4 shadow-sm p-4 border border-light-subtle">
          <ReviewSkeleton count={3} />
        </div>
      </div>
    )
  }

  // 2. If loading completed and no doctor profile matches
  if (!doctorId) {
    return (
      <div className="admin-page-container p-4">
        <div className="alert alert-warning d-flex align-items-center gap-2 rounded-4 shadow-sm">
          <AlertCircle size={20} />
          <div>
            <strong>ডাক্তার প্রোফাইল পাওয়া যায়নি:</strong> আপনার অ্যাকাউন্টের সাথে কোনো সক্রিয় ডাক্তার প্রোফাইল সংযুক্ত নেই।
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
            <Award size={24} className="text-primary" />
            Patient Review Management (রোগীর রিভিউ ব্যবস্থাপনা)
          </h4>
          <p className="text-muted small mb-0">
            {myDoctor.name ? `ডা. ${myDoctor.name}-এর` : 'আপনার'} প্রোফাইলে রোগীদের সামগ্রিক রেটিং, অভিজ্ঞতা ও অফিশিয়াল উত্তর দেওয়ার নিয়ন্ত্রণ কেন্দ্র।
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
          doctorId={doctorId}
          title="রোগীদের সরাসরি মূল্যায়ন ও রিভিউ"
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
        responderType="doctor"
        responderId={doctorId}
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
