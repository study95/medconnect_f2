import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Modal, Button, Form } from 'react-bootstrap'
import StarRating from './StarRating'
import { useCreateReview, useUpdateReview } from '../../features/reviews/useReviews'
import { normalizeReviewPayload } from '../../features/reviews/mappers'
import { RATING_LABELS, SUB_DIMENSION_LABELS } from '../../features/reviews/constants'
import {
  Star,
  Sparkles,
  Users,
  Clock,
  ShieldCheck,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Info,
} from 'lucide-react'
import toast from 'react-hot-toast'

/**
 * Enterprise Patient Review Form Modal
 * Handles review creation, draft recovery from sessionStorage, validation, and 48-hour editing.
 */
export default function ReviewFormModal({
  show,
  onHide,
  appointment = null,
  existingReview = null,
  onSuccess = null,
}) {
  const isEditing = Boolean(existingReview)
  const apptId = appointment?.id || appointment?.public_id || existingReview?.appointment_id || 'general'
  const draftStorageKey = `review_draft_${apptId}`

  // Form State
  const [rating, setRating] = useState(5)
  const [cleanlinessRating, setCleanlinessRating] = useState(0)
  const [staffRating, setStaffRating] = useState(0)
  const [waitTimeRating, setWaitTimeRating] = useState(0)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [editReason, setEditReason] = useState('')
  const [errors, setErrors] = useState({})

  const createReviewMutation = useCreateReview()
  const updateReviewMutation = useUpdateReview()
  const isSubmitting = createReviewMutation.isPending || updateReviewMutation.isPending

  // Initialize or recover draft state
  useEffect(() => {
    if (!show) return

    if (existingReview) {
      setRating(Number(existingReview.rating) || 5)
      setCleanlinessRating(Number(existingReview.cleanliness_rating) || 0)
      setStaffRating(Number(existingReview.staff_rating) || 0)
      setWaitTimeRating(Number(existingReview.wait_time_rating) || 0)
      setTitle(existingReview.title || '')
      setComment(existingReview.comment || '')
      setIsAnonymous(Boolean(existingReview.is_anonymous))
      setEditReason('')
      setErrors({})
    } else {
      // Check for saved draft in sessionStorage
      try {
        const savedDraft = sessionStorage.getItem(draftStorageKey)
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft)
          setRating(Number(parsed.rating) || 5)
          setCleanlinessRating(Number(parsed.cleanliness_rating) || 0)
          setStaffRating(Number(parsed.staff_rating) || 0)
          setWaitTimeRating(Number(parsed.wait_time_rating) || 0)
          setTitle(parsed.title || '')
          setComment(parsed.comment || '')
          setIsAnonymous(Boolean(parsed.is_anonymous))
        } else {
          setRating(5)
          setCleanlinessRating(0)
          setStaffRating(0)
          setWaitTimeRating(0)
          setTitle('')
          setComment('')
          setIsAnonymous(false)
        }
      } catch (e) {
        setRating(5)
      }
      setEditReason('')
      setErrors({})
    }
  }, [show, existingReview, draftStorageKey])

  // Save draft on change if not editing
  const handleFieldChange = useCallback(
    (field, value) => {
      if (!isEditing) {
        try {
          const currentDraft = {
            rating: field === 'rating' ? value : rating,
            cleanliness_rating: field === 'cleanliness_rating' ? value : cleanlinessRating,
            staff_rating: field === 'staff_rating' ? value : staffRating,
            wait_time_rating: field === 'wait_time_rating' ? value : waitTimeRating,
            title: field === 'title' ? value : title,
            comment: field === 'comment' ? value : comment,
            is_anonymous: field === 'is_anonymous' ? value : isAnonymous,
          }
          sessionStorage.setItem(draftStorageKey, JSON.stringify(currentDraft))
        } catch (e) {}
      }

      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: null }))
      }
    },
    [isEditing, draftStorageKey, rating, cleanlinessRating, staffRating, waitTimeRating, title, comment, isAnonymous, errors]
  )

  const validateForm = () => {
    const errs = {}

    if (!rating || rating < 1 || rating > 5) {
      errs.rating = 'Please select a star rating between 1 and 5.'
    }

    const trimmedComment = comment.trim()
    if (!trimmedComment) {
      errs.comment = 'Please provide your consultation review.'
    } else if (trimmedComment.length < 10) {
      errs.comment = 'Review comment must be at least 10 characters long.'
    } else if (trimmedComment.length > 1000) {
      errs.comment = 'Review comment cannot exceed 1,000 characters.'
    }

    if (title && title.length > 150) {
      errs.title = 'Review title cannot exceed 150 characters.'
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    const payload = normalizeReviewPayload({
      appointment_id: appointment?.id,
      appointment_public_id: appointment?.public_id,
      rating,
      cleanliness_rating: cleanlinessRating > 0 ? cleanlinessRating : null,
      staff_rating: staffRating > 0 ? staffRating : null,
      wait_time_rating: waitTimeRating > 0 ? waitTimeRating : null,
      title: title.trim() || null,
      comment: comment.trim(),
      is_anonymous: isAnonymous,
      edit_reason: isEditing && editReason.trim() ? editReason.trim() : undefined,
    })

    try {
      if (isEditing) {
        const identifier = existingReview.public_id || existingReview.id
        await updateReviewMutation.mutateAsync({ identifier, data: payload })
        toast.success('Review updated successfully!')
      } else {
        await createReviewMutation.mutateAsync(payload)
        toast.success('Review submitted successfully! It is now pending moderation approval.')
        sessionStorage.removeItem(draftStorageKey)
      }

      if (onSuccess) onSuccess()
      onHide()
    } catch (err) {
      const serverMessage =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.comment?.[0] ||
        'Failed to save your review. Please try again.'
      toast.error(serverMessage)
    }
  }

  const doctorName =
    appointment?.doctor?.name ||
    appointment?.doctor_name ||
    existingReview?.doctor?.name ||
    'Doctor'

  return (
    <Modal show={show} onHide={onHide} centered size="lg" backdrop="static" className="review-form-modal">
      <Modal.Header closeButton className="border-bottom-0 pb-0 pt-4 px-4">
        <Modal.Title className="fw-bold text-dark fs-5">
          {isEditing ? 'Edit Your Consultation Review' : 'Rate & Review Your Doctor Visit'}
        </Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body className="px-4 py-3">
          {/* Target Doctor Info Subheader */}
          <div className="p-3 rounded-3 bg-light border border-light-subtle d-flex align-items-center gap-3 mb-4">
            <div
              className="rounded-circle bg-primary-subtle text-primary fw-bold d-flex align-items-center justify-content-center flex-shrink-0"
              style={{ width: '42px', height: '42px', fontSize: '1.1rem' }}
            >
              {doctorName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="fw-bold text-dark">Dr. {doctorName}</div>
              <div className="text-muted extra-small">
                {appointment?.chamber?.hospital?.name ||
                  appointment?.hospital_name ||
                  existingReview?.hospital?.name ||
                  'Clinical Consultation'}
              </div>
            </div>
          </div>

          {/* Primary Overall Star Rating */}
          <div className="text-center mb-4 p-3 rounded-4 bg-primary-subtle border border-primary-subtle">
            <label className="fw-bold text-dark d-block mb-1 fs-6">
              Overall Experience <span className="text-danger">*</span>
            </label>
            <div className="text-muted small mb-2">How satisfied were you with this consultation?</div>
            <StarRating
              rating={rating}
              size={32}
              readOnly={false}
              onChange={(val) => {
                setRating(val)
                handleFieldChange('rating', val)
              }}
              className="justify-content-center my-1"
            />
            <div className="fw-bold text-primary small mt-1">{RATING_LABELS[rating] || 'Select Rating'}</div>
            {errors.rating && <div className="text-danger small mt-1">{errors.rating}</div>}
          </div>

          {/* Sub-Dimension Clinical Metrics (Optional) */}
          <div className="mb-4">
            <label className="fw-bold text-dark small d-block mb-2">
              Detailed Experience Ratings <span className="text-muted fw-normal">(Optional)</span>
            </label>
            <div className="row g-3">
              {/* Cleanliness */}
              <div className="col-12 col-md-4">
                <div className="p-2 rounded-3 border border-light-subtle bg-white text-center h-100">
                  <div className="d-flex align-items-center justify-content-center gap-1 text-primary small fw-semibold mb-1">
                    <Sparkles size={14} />
                    Cleanliness & Hygiene
                  </div>
                  <StarRating
                    rating={cleanlinessRating}
                    size={18}
                    readOnly={false}
                    onChange={(val) => {
                      setCleanlinessRating(val)
                      handleFieldChange('cleanliness_rating', val)
                    }}
                    className="justify-content-center my-1"
                  />
                  <div className="extra-small text-muted" style={{ fontSize: '0.75rem' }}>
                    {cleanlinessRating > 0 ? `${cleanlinessRating} Stars` : 'Not Rated'}
                  </div>
                </div>
              </div>

              {/* Staff Behavior */}
              <div className="col-12 col-md-4">
                <div className="p-2 rounded-3 border border-light-subtle bg-white text-center h-100">
                  <div className="d-flex align-items-center justify-content-center gap-1 text-success small fw-semibold mb-1">
                    <Users size={14} />
                    Staff Behavior
                  </div>
                  <StarRating
                    rating={staffRating}
                    size={18}
                    readOnly={false}
                    onChange={(val) => {
                      setStaffRating(val)
                      handleFieldChange('staff_rating', val)
                    }}
                    className="justify-content-center my-1"
                  />
                  <div className="extra-small text-muted" style={{ fontSize: '0.75rem' }}>
                    {staffRating > 0 ? `${staffRating} Stars` : 'Not Rated'}
                  </div>
                </div>
              </div>

              {/* Wait Time */}
              <div className="col-12 col-md-4">
                <div className="p-2 rounded-3 border border-light-subtle bg-white text-center h-100">
                  <div className="d-flex align-items-center justify-content-center gap-1 text-info small fw-semibold mb-1">
                    <Clock size={14} />
                    Wait Time & Punctuality
                  </div>
                  <StarRating
                    rating={waitTimeRating}
                    size={18}
                    readOnly={false}
                    onChange={(val) => {
                      setWaitTimeRating(val)
                      handleFieldChange('wait_time_rating', val)
                    }}
                    className="justify-content-center my-1"
                  />
                  <div className="extra-small text-muted" style={{ fontSize: '0.75rem' }}>
                    {waitTimeRating > 0 ? `${waitTimeRating} Stars` : 'Not Rated'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Title (Optional) */}
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold text-dark small">
              Review Title <span className="text-muted fw-normal">(Optional summary)</span>
            </Form.Label>
            <Form.Control
              type="text"
              placeholder="e.g. Excellent diagnosis and caring staff"
              value={title}
              maxLength={150}
              onChange={(e) => {
                setTitle(e.target.value)
                handleFieldChange('title', e.target.value)
              }}
              isInvalid={Boolean(errors.title)}
              className="rounded-3"
            />
            {errors.title && <Form.Control.Feedback type="invalid">{errors.title}</Form.Control.Feedback>}
          </Form.Group>

          {/* Detailed Comment (Required) */}
          <Form.Group className="mb-3">
            <div className="d-flex align-items-center justify-content-between mb-1">
              <Form.Label className="fw-semibold text-dark small mb-0">
                Detailed Feedback <span className="text-danger">*</span>
              </Form.Label>
              <span className={`extra-small ${comment.length < 10 ? 'text-muted' : 'text-success fw-semibold'}`}>
                {comment.length} / 1000 chars (min 10)
              </span>
            </div>
            <Form.Control
              as="textarea"
              rows={4}
              placeholder="Describe doctor's explanation, chamber environment, treatment advice, and helpfulness..."
              value={comment}
              maxLength={1000}
              onChange={(e) => {
                setComment(e.target.value)
                handleFieldChange('comment', e.target.value)
              }}
              isInvalid={Boolean(errors.comment)}
              className="rounded-3 lh-base"
            />
            {errors.comment && <Form.Control.Feedback type="invalid">{errors.comment}</Form.Control.Feedback>}
          </Form.Group>

          {/* Edit Reason (When editing) */}
          {isEditing && (
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold text-dark small">
                Reason for Editing <span className="text-muted fw-normal">(Optional audit log note)</span>
              </Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. Updated review after follow-up visit"
                value={editReason}
                maxLength={200}
                onChange={(e) => setEditReason(e.target.value)}
                className="rounded-3"
              />
            </Form.Group>
          )}

          {/* Anonymous Patient Toggle Switch */}
          <div className="p-3 rounded-3 bg-light border border-light-subtle mt-3">
            <Form.Check
              type="switch"
              id="anonymous-review-switch"
              label={
                <span className="fw-semibold text-dark small d-flex align-items-center gap-1">
                  <ShieldCheck size={16} className="text-primary" />
                  Post Anonymously
                </span>
              }
              checked={isAnonymous}
              onChange={(e) => {
                setIsAnonymous(e.target.checked)
                handleFieldChange('is_anonymous', e.target.checked)
              }}
            />
            <div className="text-muted extra-small mt-1 ps-4">
              When checked, your name will be masked as <strong>&quot;Verified Patient&quot;</strong> on doctor
              profiles and to hospital staff. Your verified attendance remains confirmed.
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
                <span>Saving...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={16} />
                <span>{isEditing ? 'Update Review' : 'Submit Review'}</span>
              </>
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}
