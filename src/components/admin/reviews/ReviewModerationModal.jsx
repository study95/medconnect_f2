import React, { useState, useEffect } from 'react'
import { Modal, Button, Form } from 'react-bootstrap'
import { useModerateReview } from '../../../features/reviews/useReviews'
import { formatReviewerName } from '../../../features/reviews/mappers'
import StarRating from '../../reviews/StarRating'
import { CheckCircle2, XCircle, Flag, EyeOff, Loader2, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

/**
 * Enterprise Admin Review Moderation Action Modal
 */
export default function ReviewModerationModal({
  show,
  onHide,
  review = null,
  initialAction = 'approve',
  onSuccess = null,
}) {
  const [action, setAction] = useState(initialAction)
  const [moderationNote, setModerationNote] = useState('')
  const [error, setError] = useState('')

  const moderateMutation = useModerateReview()
  const isSubmitting = moderateMutation.isPending

  useEffect(() => {
    if (show) {
      setAction(initialAction || 'approve')
      setModerationNote('')
      setError('')
    }
  }, [show, initialAction])

  if (!review) return null

  const reviewerName = formatReviewerName(review)
  const isReject = action === 'reject'

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (isReject && !moderationNote.trim()) {
      setError('A moderation rejection reason is required for administrative audit logs.')
      return
    }

    try {
      const identifier = review.public_id || review.id
      await moderateMutation.mutateAsync({
        identifier,
        data: {
          action,
          moderation_note: moderationNote.trim() || undefined,
        },
      })

      toast.success(`Review ${action}d successfully`)
      if (onSuccess) onSuccess()
      onHide()
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to update review moderation status.'
      setError(msg)
      toast.error(msg)
    }
  }

  const getActionColor = () => {
    switch (action) {
      case 'approve':
        return 'success'
      case 'reject':
        return 'danger'
      case 'hide':
        return 'secondary'
      case 'flag':
        return 'warning'
      default:
        return 'primary'
    }
  }

  const getActionIcon = () => {
    switch (action) {
      case 'approve':
        return <CheckCircle2 size={18} />
      case 'reject':
        return <XCircle size={18} />
      case 'hide':
        return <EyeOff size={18} />
      case 'flag':
        return <Flag size={18} />
      default:
        return <CheckCircle2 size={18} />
    }
  }

  return (
    <Modal show={show} onHide={onHide} centered size="lg" backdrop="static">
      <Modal.Header closeButton className="border-bottom-0 pb-0 pt-4 px-4">
        <Modal.Title className="fw-bold text-dark fs-5 d-flex align-items-center gap-2">
          {getActionIcon()}
          Review Moderation Decision
        </Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body className="px-4 py-3">
          {/* Review Details Card */}
          <div className="p-3 rounded-4 bg-light border border-light-subtle mb-4">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <div className="d-flex align-items-center gap-2">
                <span className="fw-bold text-dark small">{reviewerName}</span>
                {review.is_anonymous && (
                  <span className="badge bg-secondary-subtle text-secondary rounded-pill extra-small">
                    Anonymous Patient
                  </span>
                )}
              </div>
              <StarRating rating={review.rating} size={15} showValue />
            </div>

            <div className="small text-muted mb-2">
              <strong>Target:</strong> Dr. {review.doctor?.name || 'N/A'}{' '}
              {review.hospital?.name ? `(${review.hospital.name})` : ''}
            </div>

            {review.title && <div className="fw-semibold text-dark small mb-1">{review.title}</div>}
            <p className="text-secondary small mb-0 lh-base" style={{ whiteSpace: 'pre-line' }}>
              &quot;{review.comment}&quot;
            </p>
          </div>

          {/* Action Selector Buttons */}
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold text-dark small mb-2">Select Moderation Action</Form.Label>
            <div className="d-flex gap-2 flex-wrap">
              <Button
                type="button"
                variant={action === 'approve' ? 'success' : 'outline-success'}
                size="sm"
                onClick={() => {
                  setAction('approve')
                  setError('')
                }}
                className="d-inline-flex align-items-center gap-1 rounded-pill px-3"
              >
                <CheckCircle2 size={15} /> Approve
              </Button>
              <Button
                type="button"
                variant={action === 'reject' ? 'danger' : 'outline-danger'}
                size="sm"
                onClick={() => {
                  setAction('reject')
                  setError('')
                }}
                className="d-inline-flex align-items-center gap-1 rounded-pill px-3"
              >
                <XCircle size={15} /> Reject
              </Button>
              <Button
                type="button"
                variant={action === 'hide' ? 'secondary' : 'outline-secondary'}
                size="sm"
                onClick={() => {
                  setAction('hide')
                  setError('')
                }}
                className="d-inline-flex align-items-center gap-1 rounded-pill px-3"
              >
                <EyeOff size={15} /> Hide
              </Button>
              <Button
                type="button"
                variant={action === 'flag' ? 'warning' : 'outline-warning'}
                size="sm"
                onClick={() => {
                  setAction('flag')
                  setError('')
                }}
                className="d-inline-flex align-items-center gap-1 rounded-pill px-3"
              >
                <Flag size={15} /> Flag for Investigation
              </Button>
            </div>
          </Form.Group>

          {/* Moderation Audit Note */}
          <Form.Group className="mb-3">
            <div className="d-flex align-items-center justify-content-between mb-1">
              <Form.Label className="fw-bold text-dark small mb-0">
                Moderation Reason / Internal Note {isReject && <span className="text-danger">*</span>}
              </Form.Label>
              <span className="extra-small text-muted">{moderationNote.length} / 500 chars</span>
            </div>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder={
                isReject
                  ? 'Specify why this review is being rejected (e.g. offensive language, personal phone numbers disclosed)...'
                  : 'Optional note for audit logs...'
              }
              value={moderationNote}
              maxLength={500}
              onChange={(e) => {
                setModerationNote(e.target.value)
                if (error) setError('')
              }}
              isInvalid={Boolean(error)}
              className="rounded-3"
            />
            {error && <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>}
          </Form.Group>
        </Modal.Body>

        <Modal.Footer className="border-top-0 pt-0 pb-4 px-4 d-flex align-items-center justify-content-end gap-2">
          <Button variant="light" onClick={onHide} disabled={isSubmitting} className="rounded-pill px-4">
            Cancel
          </Button>
          <Button
            type="submit"
            variant={getActionColor()}
            disabled={isSubmitting}
            className="rounded-pill px-4 d-inline-flex align-items-center gap-2 shadow-sm text-capitalize"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="spinner-border spinner-border-sm" style={{ borderWidth: 2 }} />
                <span>Processing...</span>
              </>
            ) : (
              <>
                {getActionIcon()}
                <span>Confirm {action}</span>
              </>
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}
