// TableFooter.jsx — Unified enterprise table footer: page-size | summary | pagination
import React from 'react'

const BTN_BASE = {
  height: 34,
  minWidth: 34,
  padding: '0 10px',
  borderRadius: 8,
  border: '1.5px solid var(--admin-border)',
  background: 'var(--admin-card-bg)',
  color: 'var(--admin-text)',
  fontWeight: 700,
  fontSize: 13,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.15s',
  lineHeight: 1,
}
const BTN_ACTIVE = {
  ...BTN_BASE,
  border: 'none',
  background: 'linear-gradient(135deg, #00B875, #009E64)',
  color: '#fff',
  boxShadow: '0 2px 8px rgba(0,184,117,0.35)',
}
const BTN_DISABLED = { ...BTN_BASE, opacity: 0.4, cursor: 'not-allowed' }

const PER_PAGE_OPTIONS = [10, 25, 50, 100, 500, 1000, 2000, 5000]

/**
 * TableFooter — drop-in replacement for per-page/summary/pagination spread across admin pages.
 *
 * Props:
 *  total         {number}   — total filtered/visible entries
 *  currentPage   {number}
 *  setCurrentPage {fn}
 *  perPage       {number}
 *  setPerPage    {fn}       — optional; omit to hide page-size selector
 *  perPageOptions {number[]} — optional, defaults to [10, 25, 50, 100, 500, 1000, 2000, 5000]
 */
export default function TableFooter({
  total = 0,
  currentPage = 1,
  setCurrentPage,
  perPage = 10,
  setPerPage,
  perPageOptions = PER_PAGE_OPTIONS,
}) {
  if (total === 0) return null

  const totalPages = Math.ceil(total / perPage)
  const from = (currentPage - 1) * perPage + 1
  const to = Math.min(currentPage * perPage, total)

  // Build page number array with ellipsis
  const pages = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (currentPage > 3) pages.push('...')
    const start = Math.max(2, currentPage - 1)
    const end = Math.min(totalPages - 1, currentPage + 1)
    for (let i = start; i <= end; i++) pages.push(i)
    if (currentPage < totalPages - 2) pages.push('...')
    pages.push(totalPages)
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 10,
        marginTop: 0,
        padding: '12px 20px',
        borderTop: '1px solid var(--admin-border, #e2e8f0)',
        background: 'var(--admin-card-bg, #ffffff)',
        borderBottomLeftRadius: 'var(--admin-radius, 12px)',
        borderBottomRightRadius: 'var(--admin-radius, 12px)',
      }}
    >
      {/* Left: Page-size selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--admin-text-muted)', fontWeight: 500 }}>
        <span>Show</span>
        {setPerPage ? (
          <select
            value={perPage}
            onChange={(e) => {
              setPerPage(Number(e.target.value))
              setCurrentPage && setCurrentPage(1)
            }}
            style={{
              height: 30,
              padding: '0 6px',
              borderRadius: 6,
              border: '1px solid var(--admin-border, #e2e8f0)',
              background: 'var(--admin-card-bg, #ffffff)',
              color: 'var(--admin-text, #0f172a)',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {perPageOptions.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        ) : (
          <strong>{perPage}</strong>
        )}
        <span>entries</span>
      </div>

      {/* Centre: Summary */}
      <div style={{ fontSize: 13, color: 'var(--admin-text-muted)', fontWeight: 500 }}>
        Showing <strong>{from}</strong>–<strong>{to}</strong> of <strong>{total}</strong> entries
      </div>

      {/* Right: Pagination */}
      {totalPages > 1 ? (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            onClick={() => currentPage > 1 && setCurrentPage(1)}
            style={currentPage === 1 ? BTN_DISABLED : BTN_BASE}
            title="First"
          >«</button>
          <button
            onClick={() => currentPage > 1 && setCurrentPage((p) => p - 1)}
            style={currentPage === 1 ? BTN_DISABLED : BTN_BASE}
            title="Previous"
          >‹</button>
          {pages.map((p, i) =>
            p === '...' ? (
              <span key={`d${i}`} style={{ width: 30, textAlign: 'center', color: 'var(--admin-text-muted)', fontWeight: 700 }}>…</span>
            ) : (
              <button key={p} onClick={() => setCurrentPage(p)} style={p === currentPage ? BTN_ACTIVE : BTN_BASE}>{p}</button>
            )
          )}
          <button
            onClick={() => currentPage < totalPages && setCurrentPage((p) => p + 1)}
            style={currentPage === totalPages ? BTN_DISABLED : BTN_BASE}
            title="Next"
          >›</button>
          <button
            onClick={() => currentPage < totalPages && setCurrentPage(totalPages)}
            style={currentPage === totalPages ? BTN_DISABLED : BTN_BASE}
            title="Last"
          >»</button>
        </div>
      ) : (
        /* Still show placeholder so layout doesn't collapse */
        <div />
      )}
    </div>
  )
}
