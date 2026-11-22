import React, { useState, useEffect } from 'react'
import { UploadCloud, CheckCircle2, AlertCircle, Loader2, FileText, Trash2, ShieldCheck, ArrowUpCircle } from 'lucide-react'
import agentApi from '../../../api/agentApi'

export default function PresignedDropzone({
  category = 'doctor_nid',
  label = 'Upload Document',
  accept = 'image/jpeg,image/png,image/webp,application/pdf',
  onUploadSuccess,
  onRemove,
  existingKey = null,
  existingFileName = null,
  existingFileSize = null,
  required = false
}) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [uploadedKey, setUploadedKey] = useState(existingKey)
  const [fileName, setFileName] = useState(existingFileName)
  const [fileSizeText, setFileSizeText] = useState(existingFileSize)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    setUploadedKey(existingKey || null)
    setFileName(existingFileName || null)
    setFileSizeText(existingFileSize || null)
    setError(null)
  }, [existingKey, existingFileName, existingFileSize])

  const formatFileSize = (bytes) => {
    if (!bytes) return ''
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const processUpload = async (file) => {
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      setError('ফাইলের সাইজ অতিরিক্ত বড় (সর্বোচ্চ ১০ MB অনুমোদিত)।')
      return
    }

    setError(null)
    setUploading(true)

    try {
      // 1. Get presigned or local upload instructions
      const effectiveType = file.type || 'application/octet-stream'
      const urlConfig = await agentApi.getPresignedUrl({
        file_name: file.name,
        file_type: effectiveType,
        category,
      })

      const { driver, file_key, upload_url } = urlConfig.data

      // 2. Upload according to driver with transparent fallback
      if (driver === 's3' || driver === 'r2') {
        try {
          await agentApi.uploadToPresignedUrl(upload_url, file, effectiveType)
        } catch (cloudErr) {
          console.warn('Direct presigned upload failed, falling back to server upload:', cloudErr)
          const formData = new FormData()
          formData.append('file', file)
          formData.append('file_key', file_key)
          await agentApi.directUploadFile(formData)
        }
      } else {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('file_key', file_key)
        await agentApi.directUploadFile(formData)
      }

      const sizeStr = formatFileSize(file.size)
      setUploadedKey(file_key)
      setFileName(file.name)
      setFileSizeText(sizeStr)

      if (onUploadSuccess) {
        onUploadSuccess(file_key, file.name, sizeStr)
      }
    } catch (err) {
      console.error('File upload error:', err)
      const data = err?.response?.data
      let errText = ''
      if (data?.errors && typeof data.errors === 'object') {
        const first = Object.values(data.errors).flat()[0]
        if (first) errText = first
      }
      if (!errText) {
        errText = (data?.message && data.message !== 'Validation failed.')
          ? data.message
          : (err?.message || 'ডকুমেন্ট আপলোড করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।')
      }
      setError(errText)
    } finally {
      setUploading(false)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    processUpload(file)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isDragging) setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const file = e.dataTransfer?.files?.[0]
    processUpload(file)
  }

  const handleClear = () => {
    const prevKey = uploadedKey
    setUploadedKey(null)
    setFileName(null)
    setFileSizeText(null)
    setError(null)
    if (onRemove) {
      onRemove(prevKey)
    }
  }

  return (
    <div style={{ width: '100%' }}>
      <style>{`
        @media (max-width: 768px) {
          .presigned-dropzone-box {
            padding: 14px 10px !important;
            border-radius: 12px !important;
          }
          .presigned-dropzone-icon {
            width: 38px !important;
            height: 38px !important;
          }
          .presigned-dropzone-title {
            font-size: 13px !important;
          }
          .presigned-dropzone-sub {
            font-size: 11px !important;
          }
        }
      `}</style>
      {/* Hidden file input */}
      <input
        type="file"
        id={`dropzone-${category}`}
        style={{ display: 'none' }}
        accept={accept}
        onChange={handleFileChange}
        disabled={uploading}
      />

      {uploadedKey ? (
        /* Uploaded State Card - Refined Layout & Proportional Alignment */
        <div style={{
          background: '#F0FDF4',
          border: '1.5px solid #86EFAC',
          borderRadius: 16,
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: 10,
          minHeight: 100,
          boxShadow: '0 2px 6px rgba(16, 185, 129, 0.08)',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          {/* Top Row: File Icon + File Name & Size + Status Badge */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
              <div style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: '#DCFCE7',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 2px 4px rgba(16, 185, 129, 0.15)'
              }}>
                <CheckCircle2 size={20} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#0F172A',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }} title={fileName || label}>
                  {fileName || label}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2, fontSize: 11, color: '#64748B', whiteSpace: 'nowrap' }}>
                  {fileSizeText && <span style={{ fontWeight: 600, color: '#334155' }}>{fileSizeText}</span>}
                  <span style={{ color: '#059669', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                    • সুরক্ষিত
                  </span>
                </div>
              </div>
            </div>

            <span style={{
              fontSize: 10,
              background: '#DCFCE7',
              color: '#047857',
              padding: '2.5px 7px',
              borderRadius: 6,
              fontWeight: 700,
              border: '1px solid #BBF7D0',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}>
              ✓ আপলোড সম্পন্ন
            </span>
          </div>

          {/* Bottom Actions Row: Change File & Remove */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 8,
            paddingTop: 8,
            borderTop: '1px dashed #BBF7D0'
          }}>
            <label
              htmlFor={`dropzone-${category}`}
              style={{
                fontSize: 11.5,
                fontWeight: 700,
                color: '#047857',
                background: '#FFFFFF',
                border: '1px solid #BBF7D0',
                borderRadius: 8,
                padding: '4px 10px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                transition: 'all 0.15s ease'
              }}
              title="অন্য ফাইল বেছে নিন"
            >
              <ArrowUpCircle size={13} />
              <span>ফাইল পরিবর্তন</span>
            </label>
            <button
              type="button"
              onClick={handleClear}
              style={{
                border: '1px solid #FECACA',
                background: '#FFFFFF',
                color: '#DC2626',
                borderRadius: 8,
                padding: '4px 10px',
                fontSize: 11.5,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                cursor: 'pointer',
                transition: 'background 0.15s ease'
              }}
              title="ডকুমেন্ট মুছে ফেলুন"
            >
              <Trash2 size={13} />
              <span>মুছুন</span>
            </button>
          </div>
        </div>
      ) : (
        /* Empty / Idle State Dropzone */
        <label
          htmlFor={`dropzone-${category}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className="presigned-dropzone-box"
          style={{
            display: 'block',
            border: `2px dashed ${isDragging ? '#00B875' : '#CBD5E1'}`,
            borderRadius: 14,
            padding: '20px 16px',
            textAlign: 'center',
            background: isDragging ? 'rgba(0, 184, 117, 0.05)' : '#F8FAFC',
            cursor: uploading ? 'wait' : 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: isDragging ? '0 8px 20px rgba(0, 184, 117, 0.12)' : 'none',
            position: 'relative'
          }}
        >
          {uploading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Loader2 size={30} color="#00B875" style={{ animation: 'spin 1s linear infinite' }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                  নিরাপদে আপলোড হচ্ছে...
                </div>
                <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>
                  এনক্রিপ্টেড ক্লাউড স্টোরেজে ফাইল প্রক্রিয়াকরণ চলছে
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <div
                className="presigned-dropzone-icon"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: isDragging ? '#DCFCE7' : 'rgba(0, 184, 117, 0.1)',
                  color: '#00B875',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
              >
                <UploadCloud size={22} />
              </div>

              <div>
                <div className="presigned-dropzone-title" style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A' }}>
                  <span style={{ color: '#00B875', textDecoration: 'underline' }}>ফাইল নির্বাচন করতে ট্যাপ করুন</span>
                  <span className="d-none d-sm-inline" style={{ color: '#475569', textDecoration: 'none' }}> অথবা এখানে টেনে আনুন</span>
                </div>
                <div className="presigned-dropzone-sub" style={{ fontSize: 11.5, color: '#64748B', marginTop: 3 }}>
                  PDF, JPG, PNG বা WEBP • সর্বোচ্চ ১০ MB
                </div>
              </div>
            </div>
          )}
        </label>
      )}

      {error && (
        <div style={{
          marginTop: 8,
          padding: '8px 12px',
          background: '#FEF2F2',
          border: '1px solid #FECACA',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 12,
          color: '#DC2626'
        }}>
          <AlertCircle size={15} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
