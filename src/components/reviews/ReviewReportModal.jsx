import React, { useState, useEffect, useRef } from 'react'
import { Modal, Button, Form } from 'react-bootstrap'
import StarRating from './StarRating'
import { useReportReview } from '../../features/reviews/useReviews'
import { formatReviewerName, getReviewErrorMessage } from '../../features/reviews/mappers'
import { REPORT_REASONS } from '../../features/reviews/constants'
import { Flag, AlertTriangle, ShieldCheck, Loader2, CheckCircle2, Info } from 'lucide-react'
import { useDialog } from '../../hooks/useDialog'
import { DIALOG_MESSAGES } from '../../utils/dialogMessages'

/**
 * Enterprise Review Dispute & Abuse Reporting Modal
 */
export default function ReviewReportModal({
  show,
  onHide,
  review = null,
  onSuccess = null,
}) {
  const { showSuccess, showError } = useDialog()
  const [reason, setReason] = useState('defamation')
  const [explanation, setExplanation] = useState('')
  const [error, setError] = useState('')

  const reportMutation = useReportReview()
  const isSubmitting = reportMutation.isPending

  const sheetRef = useRef(null)
  const isDragging = useRef(false)
  const startY = useRef(0)
  const currentDragY = useRef(0)

  useEffect(() => {
    if (!show) return
    const sheet = sheetRef.current
    if (!sheet) return

    const handleTouchStart = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return
      if (e.target.closest('button') || e.target.closest('a')) return
      const isHandle = Boolean(e.target.closest('.review-sheet-drag-zone') || e.target.closest('.modal-header'))
      if (!isHandle) return

      const touch = e.touches[0]
      startY.current = touch.clientY
      currentDragY.current = 0
      isDragging.current = false
    }

    const handleTouchMove = (e) => {
      if (e.touches.length > 1) return
      const touch = e.touches[0]
      const deltaY = touch.clientY - startY.current
      if (deltaY > 5) {
        if (e.cancelable) e.preventDefault()
        isDragging.current = true
        currentDragY.current = deltaY
        sheet.style.transition = 'none'
        sheet.style.transform = `translateY(${deltaY}px)`
      }
    }

    const handleTouchEnd = (e) => {
      if (!isDragging.current) return
      isDragging.current = false
      const endTouch = e.changedTouches ? e.changedTouches[0] : null
      const finalDeltaY = Math.max(currentDragY.current, endTouch ? endTouch.clientY - startY.current : currentDragY.current)

      if (finalDeltaY > 55) {
        sheet.style.transition = 'transform 0.25s cubic-bezier(0.32, 0.72, 0, 1)'
        sheet.style.transform = 'translateY(100%)'
        setTimeout(() => {
          if (onHide && !isSubmitting) onHide()
          if (sheet) sheet.style.transform = ''
        }, 250)
      } else {
        sheet.style.transition = 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)'
        sheet.style.transform = ''
      }
    }

    sheet.addEventListener('touchstart', handleTouchStart, { passive: true })
    sheet.addEventListener('touchmove', handleTouchMove, { passive: false })
    sheet.addEventListener('touchend', handleTouchEnd, { passive: true })
    sheet.addEventListener('touchcancel', handleTouchEnd, { passive: true })

    return () => {
      sheet.removeEventListener('touchstart', handleTouchStart)
      sheet.removeEventListener('touchmove', handleTouchMove)
      sheet.removeEventListener('touchend', handleTouchEnd)
      sheet.removeEventListener('touchcancel', handleTouchEnd)
    }
  }, [show, onHide, isSubmitting])

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
    if (isSubmitting) return
    const trimmed = explanation.trim()

    if (!reason) {
      setError('অনুগ্রহ করে রিপোর্ট করার একটি কারণ নির্বাচন করুন।')
      return
    }

    if (!trimmed) {
      setError('অনুগ্রহ করে আপত্তির বিস্তারিত বিবরণ লিখুন।')
      return
    }

    if (trimmed.length < 10) {
      setError('বিবরণ অন্তত ১০ অক্ষরের হতে হবে।')
      return
    }

    if (trimmed.length > 1000) {
      setError('বিবরণ ১,০০০ অক্ষরের বেশি হতে পারবে না।')
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

      showSuccess({
        title: DIALOG_MESSAGES.REVIEW_REPORT_SUCCESS.title,
        message: DIALOG_MESSAGES.REVIEW_REPORT_SUCCESS.message,
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
      className="review-report-modal"
    >
      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 767.98px) {
          .review-report-modal .modal-dialog {
            margin: 0 !important;
            position: fixed !important;
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            transform: none !important;
          }
          .review-report-modal .modal-content {
            border-radius: 20px 20px 0 0 !important;
            border: none !important;
            max-height: 88vh !important;
            max-height: 88dvh !important;
            display: flex !important;
            flex-direction: column !important;
            overflow: hidden !important;
            animation: reviewReportSheetSlideUp 0.28s cubic-bezier(0.16, 1, 0.3, 1) !important;
          }
          .review-report-modal .modal-body {
            overflow-y: auto !important;
            -webkit-overflow-scrolling: touch !important;
          }
          @keyframes reviewReportSheetSlideUp {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }
        }
      ` }} />
      <div ref={sheetRef} style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        {/* Top Drag Indicator Handle Bar */}
        <div
          className="review-sheet-drag-zone d-md-none"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px 0 4px 0',
            cursor: 'grab',
            background: '#FFFFFF',
            flexShrink: 0
          }}
        >
          <div style={{ width: 44, height: 4.5, borderRadius: 999, background: '#CBD5E1' }} />
        </div>

        <Modal.Header closeButton={!isSubmitting} className="border-bottom-0 pb-0 pt-4 px-4">
        <div>
          <Modal.Title className="fw-bold text-dark fs-5 d-flex align-items-center gap-2 mb-1">
            <Flag size={20} className="text-danger" />
            রিভিউ সম্পর্কে অভিযোগ
          </Modal.Title>
          <div className="text-muted small">
            যদি এই রিভিউটি মিথ্যা, বিভ্রান্তিকর, অপমানজনক অথবা নীতিমালা লঙ্ঘন করে থাকে, তাহলে আমাদের জানান।
          </div>
        </div>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body className="px-4 py-3">
          {/* Informational Banner */}
          <div className="p-3 rounded-3 bg-danger-subtle border border-danger-subtle mb-3">
            <div className="fw-semibold text-danger small d-flex align-items-center gap-2 mb-1">
              <AlertTriangle size={16} className="flex-shrink-0" />
              আপনার অভিযোগ আমাদের মডারেশন টিম যাচাই করবে।
            </div>
            <div className="text-secondary extra-small">
              নীতিমালা লঙ্ঘন করলে প্রয়োজনীয় ব্যবস্থা নেওয়া হবে এবং রিভিউটি অপসারণ বা সংশোধন করা হবে।
            </div>
          </div>
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

          {/* Reason Selector */}
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold text-dark small">
              আপত্তির কারণ <span className="text-danger">*</span>
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
                বিস্তারিত বিবরণ <span className="text-danger">*</span>
              </Form.Label>
              <span className={`extra-small ${explanation.length < 10 ? 'text-muted' : 'text-success fw-semibold'}`}>
                {explanation.length} / ১০০০ অক্ষর (সর্বনিম্ন ১০)
              </span>
            </div>
            <Form.Control
              as="textarea"
              rows={4}
              placeholder="রিভিউটিতে কেন ভুল তথ্য, অবমাননাকর বক্তব্য বা নীতিমালা লঙ্ঘন রয়েছে তা বিস্তারিত ব্যাখ্যা করুন..."
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
              <strong>গোপনীয় পর্যালোচনা:</strong> জমা দেওয়া সকল আপত্তি ডক্টর বুকলেট মডারেশন টিম দ্বারা গোপনে মূল্যায়ন করা হয়। রিভিউটিতে নীতিমালা লঙ্ঘন পাওয়া গেলে তা দ্রুত সরিয়ে ফেলা হবে।
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer className="border-top-0 pt-0 pb-4 px-4 d-flex align-items-center justify-content-end gap-2">
          <Button variant="light" onClick={onHide} disabled={isSubmitting} className="rounded-pill px-4">
            বাতিল
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
                <span>রিপোর্ট জমা হচ্ছে...</span>
              </>
            ) : (
              <>
                <AlertTriangle size={16} />
                <span>রিপোর্ট জমা দিন</span>
              </>
            )}
          </Button>
        </Modal.Footer>
      </Form>
      </div>
    </Modal>
  )
}
