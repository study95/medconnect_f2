import React, { useState, useMemo } from 'react'
import { useAuth } from '../../../context/AuthContext'
import useDoctors from '../../../hooks/useDoctors'
import { ReviewList, ReviewReplyModal, ReviewReportModal, ReviewSkeleton } from '../../../components/reviews'
import { MessageSquare, AlertCircle } from 'lucide-react'

/**
 * Enterprise Doctor Portal Review Management Page
 * Allows authenticated physicians to inspect live patient ratings, star breakdowns, and respond with official replies.
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

  // 1. While loading doctor profile
  if (loadingDoctors) {
    return (
      <div className="admin-page-container p-4">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4 pb-2 border-bottom border-light-subtle">
          <div>
            <h4 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
              <MessageSquare size={24} className="text-primary" />
              রোগীর মতামত ও রিভিউ (Patient Reviews)
            </h4>
            <p className="text-muted small mb-0">
              আপনার ডাক্তার প্রোফাইল লোড হচ্ছে...
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
      {/* Page Header */}
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4 pb-2 border-bottom border-light-subtle">
        <div>
          <h4 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
            <MessageSquare size={24} className="text-primary" />
            রোগীর মতামত ও রিভিউ (Patient Reviews)
          </h4>
          <p className="text-muted small mb-0">
            {myDoctor.name ? `ডা. ${myDoctor.name}-এর` : 'আপনার'} প্রোফাইলে রোগীদের দেওয়া রেটিং, অভিজ্ঞতা ও ফিডব্যাক পর্যবেক্ষণ করুন এবং অফিশিয়াল প্রাতিষ্ঠানিক উত্তর দিন।
          </p>
        </div>
      </div>

      {/* Reused Live Review List Component */}
      <div className="bg-white rounded-4 shadow-sm p-4 border border-light-subtle">
        <ReviewList
          doctorId={doctorId}
          title="রোগীদের সরাসরি মূল্যায়ন"
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
        responderType="doctor"
        responderId={doctorId}
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
