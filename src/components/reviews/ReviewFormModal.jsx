import React, { useState, useEffect, useCallback } from 'react'
import { Modal, Button, Form } from 'react-bootstrap'
import StarRating from './StarRating'
import { useCreateReview, useUpdateReview } from '../../features/reviews/useReviews'
import { normalizeReviewPayload, getReviewErrorMessage } from '../../features/reviews/mappers'
import { RATING_LABELS } from '../../features/reviews/constants'
import {
  Sparkles,
  Users,
  Clock,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  Info,
} from 'lucide-react'
import { useDialog } from '../../hooks/useDialog'
import { DIALOG_MESSAGES } from '../../utils/dialogMessages'

/**
 * Enterprise Patient Review Form Modal — Fully Localized for Bengali UX
 * Handles review authoring, sub-dimension ratings, draft recovery from sessionStorage, validation, and 48-hour editing.
 */
export default function ReviewFormModal({
  show,
  onHide,
  appointment = null,
  existingReview = null,
  review = null,
  onSuccess = null,
}) {
  const validExistingReview = existingReview && (existingReview.id || existingReview.public_id) ? existingReview : null
  const validReviewProp = review && (review.id || review.public_id) ? review : null
  const activeExistingReview = validExistingReview || validReviewProp
  const isEditing = Boolean(activeExistingReview)
  const apptId = appointment?.id || appointment?.public_id || activeExistingReview?.appointment_id || 'general'
  const draftStorageKey = `review_draft_${apptId}`

  const { showSuccess, showError } = useDialog()

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

    if (activeExistingReview) {
      setRating(Number(activeExistingReview.rating) || 5)
      setCleanlinessRating(Number(activeExistingReview.cleanliness_rating) || 0)
      setStaffRating(Number(activeExistingReview.staff_rating) || 0)
      setWaitTimeRating(Number(activeExistingReview.wait_time_rating) || 0)
      setTitle(activeExistingReview.title || '')
      setComment(activeExistingReview.comment || '')
      setIsAnonymous(Boolean(activeExistingReview.is_anonymous))
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
  }, [show, activeExistingReview, draftStorageKey])

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
      errs.rating = 'অনুগ্রহ করে ১ থেকে ৫ তারকার মধ্যে একটি রেটিং নির্বাচন করুন।'
    }

    const trimmedComment = comment.trim()
    if (!trimmedComment) {
      errs.comment = 'অনুগ্রহ করে ডাক্তারের সাথে আপনার অভিজ্ঞতার বিবরণ লিখুন।'
    } else if (trimmedComment.length < 10) {
      errs.comment = 'আপনার মতামত অন্তত ১০ অক্ষরের হতে হবে।'
    } else if (trimmedComment.length > 1000) {
      errs.comment = 'আপনার মতামত ১,০০০ অক্ষরের বেশি হতে পারবে না।'
    }

    if (title && title.length > 150) {
      errs.title = 'শিরোনাম ১৫০ অক্ষরের বেশি হতে পারবে না।'
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isSubmitting) return
    if (!validateForm()) return

    try {
      if (isEditing) {
        const updatePayload = {
          rating: Number(rating),
          cleanliness_rating: cleanlinessRating > 0 ? Number(cleanlinessRating) : null,
          staff_rating: staffRating > 0 ? Number(staffRating) : null,
          wait_time_rating: waitTimeRating > 0 ? Number(waitTimeRating) : null,
          title: title.trim() || null,
          comment: comment.trim(),
          is_anonymous: Boolean(isAnonymous),
          edit_reason: editReason.trim() ? editReason.trim() : undefined,
        }

        const identifier = activeExistingReview?.public_id || activeExistingReview?.id
        await updateReviewMutation.mutateAsync({ identifier, data: updatePayload })
        showSuccess({
          title: DIALOG_MESSAGES.REVIEW_UPDATE_SUCCESS.title,
          message: DIALOG_MESSAGES.REVIEW_UPDATE_SUCCESS.message,
        })
      } else {
        const createPayload = normalizeReviewPayload({
          appointment_id: appointment?.id,
          appointment_public_id: appointment?.public_id,
          rating,
          cleanliness_rating: cleanlinessRating > 0 ? cleanlinessRating : null,
          staff_rating: staffRating > 0 ? staffRating : null,
          wait_time_rating: waitTimeRating > 0 ? waitTimeRating : null,
          title: title.trim() || null,
          comment: comment.trim(),
          is_anonymous: isAnonymous,
        })

        await createReviewMutation.mutateAsync(createPayload)
        showSuccess({
          title: DIALOG_MESSAGES.REVIEW_CREATE_SUCCESS.title,
          message: DIALOG_MESSAGES.REVIEW_CREATE_SUCCESS.message,
        })
        sessionStorage.removeItem(draftStorageKey)
      }

      if (onSuccess) onSuccess()
      onHide()
    } catch (err) {
      const serverMessage = getReviewErrorMessage(err)
      
      // Auto-populate inline field errors if backend returned 422
      if (err?.response?.status === 422 && err.response.data?.errors) {
        const backendErrors = err.response.data.errors
        const inline = {}
        if (backendErrors.comment?.[0]) inline.comment = backendErrors.comment[0]
        if (backendErrors.rating?.[0]) inline.rating = backendErrors.rating[0]
        if (backendErrors.title?.[0]) inline.title = backendErrors.title[0]
        setErrors((prev) => ({ ...prev, ...inline }))
      } else {
        showError({
          title: DIALOG_MESSAGES.ERROR.title,
          message: serverMessage,
        })
      }
    }
  }

  const doctorName =
    appointment?.doctor?.name ||
    appointment?.doctor_name ||
    activeExistingReview?.doctor?.name ||
    'ডাক্তার'

  return (
    <Modal
      show={show}
      onHide={isSubmitting ? undefined : onHide}
      centered
      size="lg"
      backdrop="static"
      keyboard={!isSubmitting}
      className="review-form-modal"
    >
      <Modal.Header closeButton={!isSubmitting} className="border-bottom-0 pb-0 pt-4 px-4">
        <div>
          <Modal.Title className="fw-bold text-dark fs-5 mb-1">
            {isEditing ? 'আপনার রিভিউ পরিবর্তন করুন' : 'ডাক্তার দেখানোর অভিজ্ঞতা শেয়ার করুন'}
          </Modal.Title>
          <div className="text-muted small">
            আপনার সৎ মতামত অন্য রোগীদের সঠিক ডাক্তার নির্বাচন করতে সাহায্য করবে।
          </div>
        </div>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body className="px-4 py-3">
          {/* Informational Card (Why your feedback matters) */}
          <div className="p-3 rounded-3 bg-info-subtle border border-info-subtle mb-3">
            <div className="fw-bold text-dark small d-flex align-items-center gap-2 mb-2">
              <Info size={16} className="text-primary flex-shrink-0" />
              আপনার মতামত কেন গুরুত্বপূর্ণ?
            </div>
            <ul className="mb-0 ps-3 extra-small text-secondary lh-lg" style={{ fontSize: '0.82rem' }}>
              <li>আপনার অভিজ্ঞতা অন্য রোগীদের সঠিক ডাক্তার নির্বাচন করতে সাহায্য করবে।</li>
              <li>শুধুমাত্র সম্পন্ন অ্যাপয়েন্টমেন্টের রোগীরাই রিভিউ দিতে পারেন।</li>
              <li>অসত্য, অপমানজনক বা বিভ্রান্তিকর তথ্য প্রদান থেকে বিরত থাকুন।</li>
            </ul>
          </div>

          {/* Target Doctor Info Subheader */}
          <div className="p-3 rounded-3 bg-light border border-light-subtle d-flex align-items-center gap-3 mb-4">
            <div
              className="rounded-circle bg-primary-subtle text-primary fw-bold d-flex align-items-center justify-content-center flex-shrink-0"
              style={{ width: '42px', height: '42px', fontSize: '1.1rem' }}
            >
              {doctorName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="fw-bold text-dark">ডাঃ {doctorName}</div>
              <div className="text-muted extra-small">
                {appointment?.chamber?.hospital?.name ||
                  appointment?.hospital_name ||
                  existingReview?.hospital?.name ||
                  'ক্লিনিক্যাল কনসালটেশন'}
              </div>
            </div>
          </div>

          {/* Primary Overall Star Rating */}
          <div className="text-center mb-4 p-3 rounded-4 bg-primary-subtle border border-primary-subtle">
            <label className="fw-bold text-dark d-block mb-1 fs-6">
              আপনার সামগ্রিক অভিজ্ঞতা কেমন ছিল? <span className="text-danger">*</span>
            </label>
            <div className="text-muted small mb-2">এই ডাক্তারের সেবা সম্পর্কে আপনার অভিজ্ঞতার ভিত্তিতে রেটিং দিন।</div>
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
            <div className="fw-bold text-primary small mt-1">
              {RATING_LABELS[rating] || 'রেটিং নির্বাচন করুন'}
            </div>
            {errors.rating && <div className="text-danger small mt-1">{errors.rating}</div>}
          </div>

          {/* Sub-Dimension Clinical Metrics (Optional) */}
          <div className="mb-4">
            <label className="fw-bold text-dark small d-block mb-2">
              বিস্তারিত মূল্যায়ন <span className="text-muted fw-normal">(ঐচ্ছিক)</span>
            </label>
            <div className="row g-3">
              {/* Cleanliness */}
              <div className="col-12 col-md-4">
                <div className="p-3 rounded-3 border border-light-subtle bg-white text-center h-100 d-flex flex-column justify-content-between">
                  <div>
                    <div className="d-flex align-items-center justify-content-center gap-1 text-primary small fw-semibold mb-1">
                      <Sparkles size={14} />
                      পরিচ্ছন্নতা ও স্বাস্থ্যবিধি
                    </div>
                    <div className="extra-small text-muted mb-2" style={{ fontSize: '0.75rem' }}>
                      চেম্বার বা হাসপাতাল কতটা পরিষ্কার ছিল?
                    </div>
                  </div>
                  <div>
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
                    <div className="extra-small text-muted mt-1" style={{ fontSize: '0.75rem' }}>
                      {cleanlinessRating > 0 ? `${cleanlinessRating} তারকা` : 'রেটিং দিন'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Staff Behavior */}
              <div className="col-12 col-md-4">
                <div className="p-3 rounded-3 border border-light-subtle bg-white text-center h-100 d-flex flex-column justify-content-between">
                  <div>
                    <div className="d-flex align-items-center justify-content-center gap-1 text-success small fw-semibold mb-1">
                      <Users size={14} />
                      স্টাফদের ব্যবহার
                    </div>
                    <div className="extra-small text-muted mb-2" style={{ fontSize: '0.75rem' }}>
                      রিসেপশন ও অন্যান্য স্টাফের আচরণ কেমন ছিল?
                    </div>
                  </div>
                  <div>
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
                    <div className="extra-small text-muted mt-1" style={{ fontSize: '0.75rem' }}>
                      {staffRating > 0 ? `${staffRating} তারকা` : 'রেটিং দিন'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Wait Time */}
              <div className="col-12 col-md-4">
                <div className="p-3 rounded-3 border border-light-subtle bg-white text-center h-100 d-flex flex-column justify-content-between">
                  <div>
                    <div className="d-flex align-items-center justify-content-center gap-1 text-info small fw-semibold mb-1">
                      <Clock size={14} />
                      অপেক্ষার সময়
                    </div>
                    <div className="extra-small text-muted mb-2" style={{ fontSize: '0.75rem' }}>
                      নির্ধারিত সময় অনুযায়ী ডাক্তার দেখাতে পেরেছেন কি?
                    </div>
                  </div>
                  <div>
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
                    <div className="extra-small text-muted mt-1" style={{ fontSize: '0.75rem' }}>
                      {waitTimeRating > 0 ? `${waitTimeRating} তারকা` : 'রেটিং দিন'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Title (Optional) */}
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold text-dark small">
              সংক্ষেপে আপনার মতামত <span className="text-muted fw-normal">(ঐচ্ছিক)</span>
            </Form.Label>
            <Form.Control
              type="text"
              placeholder="যেমন: খুব ভালো চিকিৎসা ও আন্তরিক ব্যবহার"
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
                আপনার অভিজ্ঞতা বিস্তারিত লিখুন <span className="text-danger">*</span>
              </Form.Label>
              <span className={`extra-small ${comment.length < 10 ? 'text-muted' : 'text-success fw-semibold'}`}>
                {comment.length} / ১০০০ অক্ষর (সর্বনিম্ন ১০)
              </span>
            </div>
            <Form.Control
              as="textarea"
              rows={4}
              placeholder="ডাক্তারের ব্যবহার, রোগ ব্যাখ্যা, চিকিৎসার মান, চেম্বারের পরিবেশ বা আপনার অভিজ্ঞতা সম্পর্কে লিখুন।"
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
                সম্পাদনের কারণ <span className="text-muted fw-normal">(ঐচ্ছিক)</span>
              </Form.Label>
              <Form.Control
                type="text"
                placeholder="যেমন: ফলোআপ সাক্ষাতের পর রিভিউ আপডেট করা হলো"
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
                  আমার নাম গোপন রাখুন
                </span>
              }
              checked={isAnonymous}
              onChange={(e) => {
                setIsAnonymous(e.target.checked)
                handleFieldChange('is_anonymous', e.target.checked)
              }}
            />
            <div className="text-muted extra-small mt-1 ps-4 lh-base">
              এটি নির্বাচন করলে আপনার নাম প্রকাশ করা হবে না। আপনার পরিচয়ের পরিবর্তে <strong>&apos;যাচাইকৃত রোগী&apos;</strong> লেখা থাকবে। তবে আপনার অ্যাপয়েন্টমেন্ট যাচাই করা থাকবে।
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
                <span>সংরক্ষণ করা হচ্ছে...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={16} />
                <span>{isEditing ? 'রিভিউ আপডেট করুন' : 'রিভিউ প্রকাশ করুন'}</span>
              </>
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}
