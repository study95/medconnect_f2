import React, { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useModerationReviews } from '../../../features/reviews/useReviews'
import ReviewModerationTable from '../../../components/admin/reviews/ReviewModerationTable'
import ReviewModerationModal from '../../../components/admin/reviews/ReviewModerationModal'
import { ShieldCheck, RefreshCw } from 'lucide-react'

/**
 * Enterprise Admin Review Moderation Console Page
 */
export default function ReviewModerationPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get('status') || 'pending')
  const [page, setPage] = useState(() => Math.max(1, parseInt(searchParams.get('page') || '1', 10)))

  const isSyncingFromUrlRef = useRef(false)
  const prevParamsRef = useRef(searchParams.toString())

  useEffect(() => {
    const currentStr = searchParams.toString()
    if (prevParamsRef.current === currentStr) return
    prevParamsRef.current = currentStr
    isSyncingFromUrlRef.current = true

    const st = searchParams.get('status') || 'pending'
    const p = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    setStatusFilter(st)
    setPage(p)
  }, [searchParams])

  useEffect(() => {
    if (isSyncingFromUrlRef.current) {
      isSyncingFromUrlRef.current = false
      return
    }
    const next = new URLSearchParams()
    if (statusFilter && statusFilter !== 'pending') next.set('status', statusFilter)
    if (page > 1) next.set('page', String(page))

    const currentStr = searchParams.toString()
    const nextStr = next.toString()
    if (currentStr !== nextStr) {
      prevParamsRef.current = nextStr
      setSearchParams(next, { replace: true })
    }
  }, [statusFilter, page, searchParams, setSearchParams])

  const [selectedReview, setSelectedReview] = useState(null)
  const [modalAction, setModalAction] = useState('approve')

  const { data, isLoading, isError, error, refetch, isFetching } = useModerationReviews({
    status: statusFilter || undefined,
    page,
    per_page: 15,
  })

  const reviews = Array.isArray(data) ? data : data?.data || []
  const meta = data?.meta || data?.pagination || null
  const totalPages = meta?.last_page || 1

  const handleOpenModeration = (review, action) => {
    setSelectedReview(review)
    setModalAction(action)
  }

  return (
    <div className="admin-page-container p-4">
      {/* Page Title Header */}
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
            <ShieldCheck size={24} className="text-primary" />
            Review Moderation Console
          </h4>
          <p className="text-muted small mb-0">
            Triage, approve, reject, and monitor patient reviews across doctor and hospital profiles.
          </p>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="btn btn-outline-secondary btn-sm rounded-pill d-inline-flex align-items-center gap-1 px-3"
        >
          <RefreshCw size={14} className={isFetching ? 'spin-animation' : ''} />
          Refresh
        </button>
      </div>

      {/* Moderation Table */}
      <ReviewModerationTable
        reviews={reviews}
        isLoading={isLoading}
        page={page}
        setPage={setPage}
        totalPages={totalPages}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        onModerate={handleOpenModeration}
      />

      {/* Moderation Action Modal */}
      <ReviewModerationModal
        show={Boolean(selectedReview)}
        onHide={() => setSelectedReview(null)}
        review={selectedReview}
        initialAction={modalAction}
      />
    </div>
  )
}
