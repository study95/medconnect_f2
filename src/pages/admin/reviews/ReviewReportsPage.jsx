import React, { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useModerationReports } from '../../../features/reviews/useReviews'
import ReviewReportsTable from '../../../components/admin/reviews/ReviewReportsTable'
import ReviewResolveReportModal from '../../../components/admin/reviews/ReviewResolveReportModal'
import { ShieldAlert, RefreshCw } from 'lucide-react'

/**
 * Enterprise Admin Review Dispute & Abuse Reports Queue Page
 */
export default function ReviewReportsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get('status') || 'pending')
  const [page, setPage] = useState(() => Math.max(1, parseInt(searchParams.get('page') || '1', 10)))
  const [selectedReport, setSelectedReport] = useState(null)

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

  const { data, isLoading, isError, error, refetch, isFetching } = useModerationReports({
    status: statusFilter || undefined,
    page,
    per_page: 15,
  })

  const reports = Array.isArray(data) ? data : data?.data || []
  const meta = data?.meta || data?.pagination || null
  const totalPages = meta?.last_page || 1

  return (
    <div className="admin-page-container p-4">
      {/* Page Title Header */}
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
            <ShieldAlert size={24} className="text-danger" />
            Review Dispute Reports Queue
          </h4>
          <p className="text-muted small mb-0">
            Investigate and resolve patient, doctor, and hospital dispute claims according to community standards.
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

      {/* Reports Table */}
      <ReviewReportsTable
        reports={reports}
        isLoading={isLoading}
        page={page}
        setPage={setPage}
        totalPages={totalPages}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        onResolve={(rep) => setSelectedReport(rep)}
      />

      {/* Resolve Report Modal */}
      <ReviewResolveReportModal
        show={Boolean(selectedReport)}
        onHide={() => setSelectedReport(null)}
        report={selectedReport}
      />
    </div>
  )
}
