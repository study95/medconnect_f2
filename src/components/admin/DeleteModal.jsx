// DeleteModal.jsx — Reusable confirmation dialog for delete actions
export default function DeleteModal({ show, title, message, onConfirm, onCancel, loading }) {
  if (!show) return null

  return (
    <div className="admin-modal-overlay" onClick={onCancel}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-icon">🗑️</div>
        <h3>{title || 'Delete Confirmation'}</h3>
        <p>{message || 'Are you sure you want to delete this item? This action cannot be undone.'}</p>
        <div className="admin-modal-actions">
          <button
            className="admin-btn admin-btn-outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="admin-btn admin-btn-danger"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}
