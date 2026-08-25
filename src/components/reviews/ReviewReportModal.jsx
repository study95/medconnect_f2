import React, { useState, useEffect } from 'react'
import { Modal, Button, Form } from 'react-bootstrap'
import StarRating from './StarRating'
import { useReportReview } from '../../features/reviews/useReviews'
import { formatReviewerName } from '../../features/reviews/mappers'
import { REPORT_REASONS } from '../../features/reviews/constants'
import { Flag, AlertTriangle, ShieldCheck, Loader2, CheckCircle2, Info } from 'lucide-react'
import toast from 'react-hot-toast'

/**
 * Enterprise Review Dispute & Abuse Reporting Modal
 */
export default function ReviewReportModal({
  show,
  onHide,
  review = null,
  onSuccess = null,
}) {
  const [reason, setReason] = useState('defamation')
  const [explanation, setExplanation] = useState('')
  const [error, setError] = useState('')

  const reportMutation = useReportReview()
  const isSubmitting = reportMutation.isPending

  useEffect(() => {
    if (show) {
      setReason('defamation')
      setExplanation('')
      setError('')
    }
  }, [show])

  if (!review) return null

  const reviewerName = formatReviewerName(review)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmed = explanation.trim()

    if (!reason) {
      setError('Please select a reason for reporting this review.')
      return
    }

    if (!trimmed) {
      setError('Please provide a detailed explanation for your dispute claim.')
      return
    }

    if (trimmed.length < 10) {
      setError('Explanation must be at least 10 characters long.')
      return
    }

    if (trimmed.length > 1000) {
      setError('Explanation cannot exceed 1,000 characters.')
      return
    }

    try {
      const identifier = review.public_id || review.id
      await reportMutation.mutateAsync({
        reviewIdentifier: identifier,
        data: {
          reason,
          explanation: trimmed,
        },
      })

      toast.success('Dispute reported successfully. Our medical moderation team will investigate.')
      if (onSuccess) onSuccess()
      onHide()
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.explanation?.[0] ||
        'Failed to submit report. Please try again.'
      setError(msg)
      toast.error(msg)
    }
  }

  return (
    <Modal show={show} onHide={onHide} centered size="lg" backdrop="static" className="review-report-modal">
      <Modal.Header closeButton className="border-bottom-0 pb-0 pt-4 px-4">
        <Modal.Title className="fw-bold text-dark fs-5 d-flex align-items-center gap-2">
          <Flag size={20} className="text-danger" />
          Report Inappropriate Review / Dispute
        </Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body className="px-4 py-3">
          {/* Target Review Context Box */}
          <div className="p-3 rounded-4 bg-light border border-light-subtle mb-4">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <div className="d-flex align-items-center gap-2">
                <span className="fw-bold text-dark small">{reviewerName}</span>
                {review.is_anonymous && (
                  <span className="badge bg-secondary-subtle text-secondary rounded-pill extra-small d-inline-flex align-items-center gap-1">
                    <ShieldCheck size={11} />
                    Anonymous Patient
                  </span>
                )}
              </div>
              <StarRating rating={review.rating} size={15} showValue />
            </div>
            {review.title && <div className="fw-semibold text-dark small mb-1">{review.title}</div>}
            <p className="text-muted extra-small mb-0 lh-base text-truncate-2">
              &quot;{review.comment}&quot;
            </p>
          </div>

          {/* Reason Selector */}
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold text-dark small">
              Reason for Dispute <span className="text-danger">*</span>
            </Form.Label>
            <Form.Select
              value={reason}
              onChange={(e) => {
                setReason(e.target.value)
                if (error) setError('')
              }}
              className="rounded-3"
            >
              {REPORT_REASONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          {/* Detailed Explanation Textarea */}
          <Form.Group className="mb-3">
            <div className="d-flex align-items-center justify-content-between mb-1">
              <Form.Label className="fw-bold text-dark small mb-0">
                Detailed Explanation <span className="text-danger">*</span>
              </Form.Label>
              <span className={`extra-small ${explanation.length < 10 ? 'text-muted' : 'text-success fw-semibold'}`}>
                {explanation.length} / 1000 chars (min 10)
              </span>
            </div>
            <Form.Control
              as="textarea"
              rows={4}
              placeholder="Provide specific details about why this review violates clinical guidelines, contains false claims, or is defamatory..."
              value={explanation}
              maxLength={1000}
              onChange={(e) => {
                setExplanation(e.target.value)
                if (error) setError('')
              }}
              isInvalid={Boolean(error)}
              className="rounded-3 lh-base"
            />
            {error && <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>}
          </Form.Group>

          {/* Confidential Notice */}
          <div className="p-3 rounded-3 bg-light border border-light-subtle d-flex align-items-start gap-2">
            <Info size={16} className="text-secondary flex-shrink-0 mt-1" />
            <div className="text-muted extra-small lh-base">
              <strong>Confidential Investigation:</strong> All reported disputes are confidentially evaluated by DoctorBooklet
              clinical moderation administrators. If the review violates community standards, it will be hidden or removed promptly.
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer className="border-top-0 pt-0 pb-4 px-4 d-flex align-items-center justify-content-end gap-2">
          <Button variant="light" onClick={onHide} disabled={isSubmitting} className="rounded-pill px-4">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="danger"
            disabled={isSubmitting}
            className="rounded-pill px-4 d-inline-flex align-items-center gap-2 shadow-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="spinner-border spinner-border-sm" style={{ borderWidth: 2 }} />
                <span>Submitting Dispute...</span>
              </>
            ) : (
              <>
                <AlertTriangle size={16} />
                <span>Submit Dispute Report</span>
              </>
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}
