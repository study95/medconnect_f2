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
      setError(err?.response?.data?.message || err?.message || 'ডকুমেন্ট আপলোড করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।')
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
        /* Uploaded State Card */
        <div style={{
          background: '#F0FDF4',
          border: '1.5px solid #86EFAC',
          borderRadius: 14,
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          boxShadow: '0 2px 6px rgba(16, 185, 129, 0.08)',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: '#DCFCE7',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 2px 4px rgba(16, 185, 129, 0.15)'
            }}>
              <CheckCircle2 size={24} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: 14,
                fontWeight: 700,
                color: '#0F172A',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {fileName || label}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2, flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: 11,
                  background: 'rgba(5, 150, 105, 0.12)',
                  color: '#047857',
                  padding: '2px 8px',
                  borderRadius: 6,
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4
                }}>
                  <ShieldCheck size={12} />
                  সংযুক্ত হয়েছে (Uploaded)
                </span>
                {fileSizeText && (
                  <span style={{ fontSize: 11.5, color: '#64748B', fontWeight: 500 }}>
                    {fileSizeText}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <label
              htmlFor={`dropzone-${category}`}
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: '#047857',
                background: '#FFFFFF',
                border: '1px solid #BBF7D0',
                borderRadius: 8,
                padding: '6px 12px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                transition: 'all 0.15s ease'
              }}
              title="অন্য ফাইল দিন"
            >
              <ArrowUpCircle size={14} />
              <span>পরিবর্তন</span>
            </label>
            <button
              type="button"
              onClick={handleClear}
              style={{
                border: 'none',
                background: '#FEE2E2',
                color: '#DC2626',
                borderRadius: 8,
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background 0.15s ease'
              }}
              title="ডকুমেন্ট মুছে ফেলুন"
            >
              <Trash2 size={16} />
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
          style={{
            display: 'block',
            border: `2px dashed ${isDragging ? '#00B875' : '#CBD5E1'}`,
            borderRadius: 16,
            padding: '24px 20px',
            textAlign: 'center',
            background: isDragging ? 'rgba(0, 184, 117, 0.05)' : '#F8FAFC',
            cursor: uploading ? 'wait' : 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: isDragging ? '0 8px 20px rgba(0, 184, 117, 0.12)' : 'none',
            position: 'relative'
          }}
        >
          {uploading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <Loader2 size={36} color="#00B875" style={{ animation: 'spin 1s linear infinite' }} />
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A' }}>
                  নিরাপদে আপলোড হচ্ছে...
                </div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                  এনক্রিপ্টেড ক্লাউড স্টোরেজে ফাইল প্রক্রিয়াকরণ চলছে
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <div style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: isDragging ? '#DCFCE7' : 'rgba(0, 184, 117, 0.1)',
                color: '#00B875',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}>
                <UploadCloud size={26} />
              </div>

              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
                  <span style={{ color: '#00B875', textDecoration: 'underline' }}>ফাইল বেছে নিন</span>
                  <span style={{ color: '#475569' }}> অথবা এখানে টেনে এনে ছাড়ুন</span>
                </div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
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
