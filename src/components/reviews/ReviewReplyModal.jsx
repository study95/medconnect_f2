import React, { useState, useEffect } from 'react'
import { Modal, Button, Form } from 'react-bootstrap'
import StarRating from './StarRating'
import { useReplyReview } from '../../features/reviews/useReviews'
import { formatReviewerName, getReviewErrorMessage } from '../../features/reviews/mappers'
import { MessageSquare, CornerDownRight, AlertCircle, Loader2, CheckCircle2, ShieldCheck } from 'lucide-react'
import { useDialog } from '../../hooks/useDialog'
import { DIALOG_MESSAGES } from '../../utils/dialogMessages'

/**
 * Enterprise Official Reply Modal for Doctors and Hospital Authorities
 */
export default function ReviewReplyModal({
  show,
  onHide,
  review = null,
  onSuccess = null,
}) {
  const { showSuccess, showError } = useDialog()
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
    if (isSubmitting) return
    const trimmed = replyText.trim()

    if (!trimmed) {
      setError('অনুগ্রহ করে উত্তরের বিবরণ লিখুন।')
      return
    }

    if (trimmed.length < 5) {
      setError('অফিসিয়াল উত্তর অন্তত ৫ অক্ষরের হতে হবে।')
      return
    }

    if (trimmed.length > 1000) {
      setError('অফিসিয়াল উত্তর ১,০০০ অক্ষরের বেশি হতে পারবে না।')
      return
    }

    try {
      const identifier = review.public_id || review.id
      await replyMutation.mutateAsync({
        reviewIdentifier: identifier,
        data: { reply: trimmed },
      })

      showSuccess({
        title: DIALOG_MESSAGES.REVIEW_REPLY_SUCCESS.title,
        message: DIALOG_MESSAGES.REVIEW_REPLY_SUCCESS.message,
      })
      if (onSuccess) onSuccess()
      onHide()
    } catch (err) {
      const msg = getReviewErrorMessage(err)
      setError(msg)
      showError({
        title: DIALOG_MESSAGES.ERROR.title,
        message: msg,
      })
    }
  }

  return (
    <Modal
      show={show}
      onHide={isSubmitting ? undefined : onHide}
      centered
      size="lg"
      backdrop="static"
      keyboard={!isSubmitting}
      className="review-reply-modal"
    >
      <Modal.Header closeButton={!isSubmitting} className="border-bottom-0 pb-0 pt-4 px-4">
        <Modal.Title className="fw-bold text-dark fs-5 d-flex align-items-center gap-2">
          <MessageSquare size={20} className="text-primary" />
          অফিসিয়াল উত্তর প্রদান
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
                    যাচাইকৃত রোগী (বেনামী)
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
                আপনার অফিসিয়াল উত্তর <span className="text-danger">*</span>
              </Form.Label>
              <span className={`extra-small ${replyText.length < 5 ? 'text-muted' : 'text-success fw-semibold'}`}>
                {replyText.length} / ১০০০ অক্ষর (সর্বনিম্ন ৫)
              </span>
            </div>
            <Form.Control
              as="textarea"
              rows={4}
              placeholder="রোগীর মতামতের জন্য ধন্যবাদ জানিয়ে বা প্রয়োজনীয় পরামর্শ দিয়ে পেশাদারভাবে উত্তর লিখুন..."
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
              <strong>পেশাদার নির্দেশনা:</strong> আপনার দেওয়া উত্তরটি প্রোফাইলে এই রিভিউয়ের নিচে প্রকাশ্যে দেখা যাবে। কোনো সংবেদনশীল ব্যক্তিগত চিকিৎসা তথ্য বা গোপনীয় রিপোর্ট প্রকাশ করা থেকে বিরত থাকুন।
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer className="border-top-0 pt-0 pb-4 px-4 d-flex align-items-center justify-content-end gap-2">
          <Button variant="light" onClick={onHide} disabled={isSubmitting} className="rounded-pill px-4">
            বাতিল
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
                <span>প্রকাশ করা হচ্ছে...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={16} />
                <span>উত্তর প্রকাশ করুন</span>
              </>
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}
