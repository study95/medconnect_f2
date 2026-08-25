import React, { useState } from 'react'
import { useModerationReports } from '../../../features/reviews/useReviews'
import ReviewReportsTable from '../../../components/admin/reviews/ReviewReportsTable'
import ReviewResolveReportModal from '../../../components/admin/reviews/ReviewResolveReportModal'
import { ShieldAlert, RefreshCw } from 'lucide-react'

/**
 * Enterprise Admin Review Dispute & Abuse Reports Queue Page
 */
export default function ReviewReportsPage() {
  const [statusFilter, setStatusFilter] = useState('pending')
  const [page, setPage] = useState(1)
  const [selectedReport, setSelectedReport] = useState(null)

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
