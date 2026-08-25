import React, { useState, useEffect } from 'react'
import { Modal, Button, Form } from 'react-bootstrap'
import StarRating from './StarRating'
import { useReplyReview } from '../../features/reviews/useReviews'
import { formatReviewerName } from '../../features/reviews/mappers'
import { MessageSquare, CornerDownRight, AlertCircle, Loader2, CheckCircle2, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'

/**
 * Enterprise Official Reply Modal for Doctors and Hospital Authorities
 */
export default function ReviewReplyModal({
  show,
  onHide,
  review = null,
  onSuccess = null,
}) {
  const [replyText, setReplyText] = useState('')
  const [error, setError] = useState('')

  const replyMutation = useReplyReview()
  const isSubmitting = replyMutation.isPending

  useEffect(() => {
    if (show) {
      setReplyText('')
      setError('')
    }
  }, [show])

  if (!review) return null

  const reviewerName = formatReviewerName(review)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmed = replyText.trim()

    if (!trimmed) {
      setError('Please write your response before submitting.')
      return
    }

    if (trimmed.length < 5) {
      setError('Official reply must be at least 5 characters long.')
      return
    }

    if (trimmed.length > 1000) {
      setError('Official reply cannot exceed 1,000 characters.')
      return
    }

    try {
      const identifier = review.public_id || review.id
      await replyMutation.mutateAsync({
        reviewIdentifier: identifier,
        data: { reply: trimmed },
      })

      toast.success('Your official response has been published!')
      if (onSuccess) onSuccess()
      onHide()
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.reply?.[0] ||
        'Failed to post official reply. Please try again.'
      setError(msg)
      toast.error(msg)
    }
  }

  return (
    <Modal show={show} onHide={onHide} centered size="lg" backdrop="static" className="review-reply-modal">
      <Modal.Header closeButton className="border-bottom-0 pb-0 pt-4 px-4">
        <Modal.Title className="fw-bold text-dark fs-5 d-flex align-items-center gap-2">
          <MessageSquare size={20} className="text-primary" />
          Post Official Response
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

          {/* Reply Textarea */}
          <Form.Group className="mb-3">
            <div className="d-flex align-items-center justify-content-between mb-1">
              <Form.Label className="fw-bold text-dark small mb-0 d-flex align-items-center gap-1">
                <CornerDownRight size={15} className="text-primary" />
                Your Official Provider Response <span className="text-danger">*</span>
              </Form.Label>
              <span className={`extra-small ${replyText.length < 5 ? 'text-muted' : 'text-success fw-semibold'}`}>
                {replyText.length} / 1000 chars (min 5)
              </span>
            </div>
            <Form.Control
              as="textarea"
              rows={4}
              placeholder="Address patient feedback professionally, thank them for their visit, or offer follow-up guidance..."
              value={replyText}
              maxLength={1000}
              onChange={(e) => {
                setReplyText(e.target.value)
                if (error) setError('')
              }}
              isInvalid={Boolean(error)}
              className="rounded-3 lh-base"
            />
            {error && <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>}
          </Form.Group>

          {/* Professional Guidance Notice */}
          <div className="p-3 rounded-3 bg-primary-subtle border border-primary-subtle d-flex align-items-start gap-2">
            <AlertCircle size={16} className="text-primary flex-shrink-0 mt-1" />
            <div className="text-primary-emphasis extra-small lh-base">
              <strong>Professional Standard:</strong> Your official response will appear publicly under this
              patient review on your profile. Please ensure no sensitive patient medical diagnoses or private clinical records are disclosed.
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer className="border-top-0 pt-0 pb-4 px-4 d-flex align-items-center justify-content-end gap-2">
          <Button variant="light" onClick={onHide} disabled={isSubmitting} className="rounded-pill px-4">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            className="rounded-pill px-4 d-inline-flex align-items-center gap-2 shadow-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="spinner-border spinner-border-sm" style={{ borderWidth: 2 }} />
                <span>Posting Response...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={16} />
                <span>Publish Official Response</span>
              </>
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}
