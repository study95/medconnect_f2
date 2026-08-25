import React, { useState, useEffect } from 'react'
import { Modal, Button, Form } from 'react-bootstrap'
import { useResolveReport } from '../../../features/reviews/useReviews'
import { REPORT_REASONS } from '../../../features/reviews/constants'
import { ShieldAlert, CheckCircle2, Trash2, Clock, AlertTriangle, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

/**
 * Enterprise Admin Dispute & Abuse Report Resolution Modal
 */
export default function ReviewResolveReportModal({
  show,
  onHide,
  report = null,
  onSuccess = null,
}) {
  const [action, setAction] = useState('dismiss')
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [error, setError] = useState('')

  const resolveMutation = useResolveReport()
  const isSubmitting = resolveMutation.isPending

  useEffect(() => {
    if (show) {
      setAction('dismiss')
      setResolutionNotes('')
      setError('')
    }
  }, [show])

  if (!report) return null

  const reasonLabel =
    REPORT_REASONS.find((r) => r.value === report.reason)?.label || report.reason || 'General Dispute'

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const identifier = report.public_id || report.id
      await resolveMutation.mutateAsync({
        reportIdentifier: identifier,
        data: {
          action,
          resolution_notes: resolutionNotes.trim() || undefined,
        },
      })

      toast.success('Dispute report resolved successfully.')
      if (onSuccess) onSuccess()
      onHide()
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to resolve dispute report.'
      setError(msg)
      toast.error(msg)
    }
  }

  return (
    <Modal show={show} onHide={onHide} centered size="lg" backdrop="static">
      <Modal.Header closeButton className="border-bottom-0 pb-0 pt-4 px-4">
        <Modal.Title className="fw-bold text-dark fs-5 d-flex align-items-center gap-2">
          <ShieldAlert size={20} className="text-primary" />
          Resolve Review Dispute Claim
        </Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body className="px-4 py-3">
          {/* Dispute Context Box */}
          <div className="p-3 rounded-4 bg-light border border-light-subtle mb-4">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="badge bg-danger-subtle text-danger border border-danger-subtle rounded-pill extra-small">
                Reason: {reasonLabel}
              </span>
              <span className="extra-small text-muted">
                Reported by: <strong>{report.reporter?.name || 'User'}</strong>
              </span>
            </div>

            <div className="mb-2">
              <div className="fw-bold text-dark small">Dispute Explanation:</div>
              <p className="text-secondary small mb-0 lh-base bg-white p-2 rounded-2 border border-light-subtle">
                &quot;{report.explanation}&quot;
              </p>
            </div>

            {report.review && (
              <div>
                <div className="fw-bold text-dark small">Target Review Comment:</div>
                <div className="text-muted extra-small fst-italic">
                  &quot;{report.review.comment}&quot;
                </div>
              </div>
            )}
          </div>

          {/* Resolution Action Selector */}
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold text-dark small mb-2">Select Resolution Decision</Form.Label>
            <div className="d-flex flex-column gap-2">
              <label className="d-flex align-items-center gap-2 p-2 rounded-3 border border-light-subtle bg-white cursor-pointer">
                <input
                  type="radio"
                  name="resolution_action"
                  value="dismiss"
                  checked={action === 'dismiss'}
                  onChange={(e) => setAction(e.target.value)}
                />
                <div>
                  <div className="fw-bold text-dark small d-flex align-items-center gap-1">
                    <CheckCircle2 size={15} className="text-success" /> Dismiss Claim (Keep Review Active)
                  </div>
                  <div className="text-muted extra-small">
                    Review does not violate guidelines; claim is rejected.
                  </div>
                </div>
              </label>

              <label className="d-flex align-items-center gap-2 p-2 rounded-3 border border-light-subtle bg-white cursor-pointer">
                <input
                  type="radio"
                  name="resolution_action"
                  value="resolve_removed"
                  checked={action === 'resolve_removed'}
                  onChange={(e) => setAction(e.target.value)}
                />
                <div>
                  <div className="fw-bold text-danger small d-flex align-items-center gap-1">
                    <Trash2 size={15} /> Remove Review & Resolve Dispute
                  </div>
                  <div className="text-muted extra-small">
                    Review violates guidelines and will be soft-deleted.
                  </div>
                </div>
              </label>

              <label className="d-flex align-items-center gap-2 p-2 rounded-3 border border-light-subtle bg-white cursor-pointer">
                <input
                  type="radio"
                  name="resolution_action"
                  value="under_review"
                  checked={action === 'under_review'}
                  onChange={(e) => setAction(e.target.value)}
                />
                <div>
                  <div className="fw-bold text-warning small d-flex align-items-center gap-1">
                    <Clock size={15} /> Mark Under Investigation
                  </div>
                  <div className="text-muted extra-small">
                    Keep claim open for legal or medical triage.
                  </div>
                </div>
              </label>
            </div>
          </Form.Group>

          {/* Resolution Internal Note */}
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold text-dark small">Resolution Audit Log Note</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Record notes explaining administrative decision for internal compliance..."
              value={resolutionNotes}
              maxLength={500}
              onChange={(e) => {
                setResolutionNotes(e.target.value)
                if (error) setError('')
              }}
              className="rounded-3"
            />
            {error && <div className="text-danger small mt-1">{error}</div>}
          </Form.Group>
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
                <span>Resolving...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={16} />
                <span>Confirm Resolution</span>
              </>
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}
