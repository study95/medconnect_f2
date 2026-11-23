// ImportMedicineCsvModal.jsx — Secure bulk medicine CSV import dialog for Admin Panel
import { useState, useRef, useEffect } from 'react'
import { UploadCloud, FileText, CheckCircle, AlertCircle, X, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import { getErrorMessage } from '../../../utils/errorHelper'

export default function ImportMedicineCsvModal({
  show,
  onClose,
  onImport,
  loading = false,
}) {
  const [file, setFile] = useState(null)
  const [result, setResult] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (!show) {
      setFile(null)
      setResult(null)
      setErrorMsg(null)
      setDragActive(false)
    }
  }, [show])

  if (!show) return null

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const validateAndSetFile = (selected) => {
    setErrorMsg(null)
    setResult(null)

    if (!selected) return

    const ext = selected.name.split('.').pop()?.toLowerCase()
    if (ext !== 'csv') {
      setErrorMsg('Please select a valid .csv file.')
      return
    }

    // 10MB max limit
    if (selected.size > 10 * 1024 * 1024) {
      setErrorMsg('File size exceeds the 10 MB limit.')
      return
    }

    setFile(selected)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file || loading) return

    const formData = new FormData()
    formData.append('file', file)

    try {
      setErrorMsg(null)
      const res = await onImport(formData)
      const data = res?.data?.data || res?.data || {}
      setResult(data)
      toast.success(res?.data?.message || 'CSV imported successfully!')
    } catch (err) {
      const msg = getErrorMessage(err, 'Failed to import CSV file.')
      setErrorMsg(msg)
      toast.error(msg)
    }
  }

  const downloadSampleCsv = () => {
    const csvContent =
      'id,type,brand,mg,generic,company\n' +
      '1,Tablet,Napa,500 mg,Paracetamol,Beximco Pharmaceuticals Ltd.\n' +
      '2,Capsule,Seclo,20 mg,Omeprazole,Square Pharmaceuticals Ltd.\n' +
      '3,Tablet,Sergel,20 mg,Esomeprazole,Healthcare Pharmaceuticals Ltd.\n' +
      '4,Syrup,Alatrol,5 mg/5 ml,Cetirizine Hydrochloride,Square Pharmaceuticals Ltd.\n'

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'medicine_sample_template.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.55)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={(e) => {
        if (!loading && e.target === e.currentTarget) onClose()
      }}
    >
      <div
        style={{
          background: 'var(--admin-card-bg, #ffffff)',
          color: 'var(--admin-text, #1e293b)',
          borderRadius: 16,
          boxShadow: '0 20px 40px -10px rgba(0,0,0,0.2)',
          maxWidth: 540,
          width: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid var(--admin-border, #e2e8f0)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--admin-border, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: '#EFF6FF',
                color: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <UploadCloud size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Import Medicines (CSV)</h3>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--admin-text-muted, #64748b)' }}>
                Bulk upload and deduplicate medicines into the database
              </p>
            </div>
          </div>
          {!loading && (
            <button
              type="button"
              onClick={onClose}
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: 'var(--admin-text-muted, #64748b)',
                padding: 4,
                display: 'flex',
              }}
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Success summary display */}
          {result ? (
            <div
              style={{
                background: '#F0FDF4',
                border: '1px solid #BBF7D0',
                borderRadius: 12,
                padding: '16px 20px',
                color: '#166534',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <CheckCircle size={22} color="#16A34A" />
                <strong style={{ fontSize: 15 }}>Import Completed Successfully!</strong>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 10,
                  fontSize: 13,
                }}
              >
                <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: 8, border: '1px solid #DCFCE7' }}>
                  <div style={{ color: '#64748b', fontSize: 11, fontWeight: 600 }}>ROWS CHECKED</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>{result.total_processed ?? 0}</div>
                </div>
                <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: 8, border: '1px solid #DCFCE7' }}>
                  <div style={{ color: '#16A34A', fontSize: 11, fontWeight: 600 }}>NEWLY INSERTED</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#16A34A' }}>{result.inserted ?? 0}</div>
                </div>
                <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: 8, border: '1px solid #DCFCE7' }}>
                  <div style={{ color: '#D97706', fontSize: 11, fontWeight: 600 }}>SKIPPED (DUPLICATE)</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#D97706' }}>{result.skipped ?? 0}</div>
                </div>
                <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: 8, border: '1px solid #DCFCE7' }}>
                  <div style={{ color: '#2563EB', fontSize: 11, fontWeight: 600 }}>TOTAL IN DATABASE</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#2563EB' }}>{result.total_in_db ?? 0}</div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Dropzone */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => !loading && fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${dragActive ? '#2563EB' : 'var(--admin-border, #cbd5e1)'}`,
                  background: dragActive ? '#EFF6FF' : 'var(--admin-input-bg, #f8fafc)',
                  borderRadius: 12,
                  padding: '28px 16px',
                  textAlign: 'center',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileChange}
                  disabled={loading}
                  style={{ display: 'none' }}
                />
                <UploadCloud
                  size={36}
                  style={{ color: dragActive ? '#2563EB' : 'var(--admin-text-muted, #94a3b8)', marginBottom: 8 }}
                />
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                  {file ? file.name : 'Click or drag & drop CSV file here'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--admin-text-muted, #64748b)' }}>
                  {file
                    ? `${(file.size / 1024).toFixed(1)} KB — Ready to upload`
                    : 'Maximum file size 10 MB (supports 25,000+ medicines)'}
                </div>
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div
                  style={{
                    background: '#FEF2F2',
                    border: '1px solid #FECACA',
                    borderRadius: 8,
                    padding: '10px 14px',
                    color: '#DC2626',
                    fontSize: 13,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <AlertCircle size={18} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Supported Columns & Template Download */}
              <div
                style={{
                  background: 'var(--admin-input-bg, #f8fafc)',
                  border: '1px solid var(--admin-border, #e2e8f0)',
                  borderRadius: 10,
                  padding: '12px 16px',
                  fontSize: 12,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, color: 'var(--admin-text, #1e293b)' }}>Expected CSV Columns:</span>
                  <button
                    type="button"
                    onClick={downloadSampleCsv}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#2563EB',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: 0,
                    }}
                  >
                    <Download size={14} /> Download Sample Template
                  </button>
                </div>
                <code
                  style={{
                    display: 'block',
                    padding: '6px 8px',
                    background: 'var(--admin-card-bg, #ffffff)',
                    border: '1px solid var(--admin-border, #e2e8f0)',
                    borderRadius: 6,
                    fontSize: 11,
                    color: '#0284C7',
                    wordBreak: 'break-all',
                  }}
                >
                  id, type, brand, mg, generic, company
                </code>
                <div style={{ marginTop: 6, color: 'var(--admin-text-muted, #64748b)', fontSize: 11 }}>
                  ✓ Automatic CSV formula injection protection & XSS sanitization enabled.
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid var(--admin-border, #e2e8f0)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10,
            background: 'var(--admin-input-bg, #f8fafc)',
          }}
        >
          {result ? (
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              onClick={onClose}
              style={{ minWidth: 100, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            >
              Done
            </button>
          ) : (
            <>
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-primary"
                onClick={handleSubmit}
                disabled={!file || loading}
                style={{
                  minWidth: 130,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                    <span>Importing...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud size={16} />
                    <span>Upload & Import</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
