import { useState, useEffect, useRef, useCallback } from 'react'
import { Calendar, AlertTriangle, CheckCircle2, Clock, Building2, User, FileText, Loader2, Info } from 'lucide-react'
import { checkLeaveImpact } from '../../../api/leaveApi'

export default function DoctorLeaveForm({
  initialData = {},
  doctorId = null,
  doctor = null,
  doctors = [],
  chambers = [],
  onSubmit,
  onCancel,
  isSubmitting = false,
  serverErrors = {},
}) {
  const todayStr = new Date().toISOString().split('T')[0]

  const [formData, setFormData] = useState({
    doctor_id: initialData.doctor_id || doctorId || (doctor ? doctor.id : '') || '',
    chamber_id: initialData.chamber_id || '',
    start_date: initialData.start_date || todayStr,
    end_date: initialData.end_date || todayStr,
    reason: initialData.reason || '',
  })

  const [clientErrors, setClientErrors] = useState({})
  const [impactLoading, setImpactLoading] = useState(false)
  const [impactData, setImpactData] = useState(null)
  const [impactError, setImpactError] = useState(null)
  const debounceTimerRef = useRef(null)
  const latestRequestIdRef = useRef(0)

  // Sync if doctorId or doctor changes externally
  useEffect(() => {
    if (doctorId && formData.doctor_id !== doctorId) {
      setFormData((prev) => ({ ...prev, doctor_id: doctorId }))
    } else if (doctor?.id && formData.doctor_id !== doctor.id) {
      setFormData((prev) => ({ ...prev, doctor_id: doctor.id }))
    }
  }, [doctorId, doctor])

  // Run impact check when doctor, chamber, or dates change with stale response protection
  const runImpactCheck = useCallback(async (docId, chId, sDate, eDate) => {
    const currentRequestId = ++latestRequestIdRef.current

    if (!docId || !sDate || !eDate || sDate > eDate) {
      setImpactData(null)
      setImpactLoading(false)
      return
    }

    setImpactLoading(true)
    setImpactError(null)

    try {
      const params = {
        doctor_id: docId,
        start_date: sDate,
        end_date: eDate,
      }
      if (chId) {
        params.chamber_id = chId
      }

      const res = await checkLeaveImpact(params)

      // Guard: Ignore if a newer request was dispatched in the meantime
      if (currentRequestId !== latestRequestIdRef.current) {
        return
      }

      if (res.data?.success) {
        setImpactData(res.data)
      } else {
        setImpactData(null)
      }
    } catch (err) {
      // Guard: Ignore errors from outdated requests
      if (currentRequestId !== latestRequestIdRef.current) {
        return
      }

      // Impact check is non-blocking — log error quietly without halting form
      setImpactError(err?.response?.data?.message || 'ইমপ্যাক্ট তথ্য লোড করা যায়নি')
      setImpactData(null)
    } finally {
      // Only clear loading state if this is still the active request
      if (currentRequestId === latestRequestIdRef.current) {
        setImpactLoading(false)
      }
    }
  }, [])

  // Debounced trigger for impact check
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      runImpactCheck(
        formData.doctor_id,
        formData.chamber_id,
        formData.start_date,
        formData.end_date
      )
    }, 350)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [formData.doctor_id, formData.chamber_id, formData.start_date, formData.end_date, runImpactCheck])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => {
      const next = { ...prev, [name]: value }
      // If start_date is set after end_date, adjust end_date
      if (name === 'start_date' && next.end_date < value) {
        next.end_date = value
      }
      return next
    })

    if (clientErrors[name]) {
      setClientErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const errors = {}
    if (!formData.doctor_id) {
      errors.doctor_id = 'ডাক্তার নির্বাচন আবশ্যক'
    }
    if (!formData.start_date) {
      errors.start_date = 'শুরুর তারিখ আবশ্যক'
    }
    if (!formData.end_date) {
      errors.end_date = 'শেষের তারিখ আবশ্যক'
    } else if (formData.end_date < formData.start_date) {
      errors.end_date = 'শেষের তারিখ শুরুর তারিখের সমান বা পরবর্তী হতে হবে'
    }
    return errors
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errors = validateForm()
    if (Object.keys(errors).length > 0) {
      setClientErrors(errors)
      return
    }

    if (onSubmit) {
      const payload = {
        doctor_id: Number(formData.doctor_id),
        chamber_id: formData.chamber_id ? Number(formData.chamber_id) : null,
        start_date: formData.start_date,
        end_date: formData.end_date,
        reason: formData.reason?.trim() || null,
      }
      onSubmit(payload, impactData)
    }
  }

  const currentErrors = { ...clientErrors, ...serverErrors }

  return (
    <form onSubmit={handleSubmit} className="admin-leave-form" noValidate>
      {/* Doctor Selection (Admin multi-doctor mode) */}
      {doctors && doctors.length > 0 && !doctorId && !doctor && (
        <div className="admin-form-group" style={{ marginBottom: 16 }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--admin-text, #1e293b)',
              marginBottom: 6,
              textTransform: 'uppercase',
            }}
          >
            <User size={15} /> ডাক্তার নির্বাচন করুন <span style={{ color: 'var(--admin-danger, #ef4444)' }}>*</span>
          </label>
          <select
            name="doctor_id"
            value={formData.doctor_id}
            onChange={handleChange}
            className={`admin-form-control ${currentErrors.doctor_id ? 'is-invalid' : ''}`}
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: 'var(--admin-radius-sm, 6px)',
              border: `1px solid ${currentErrors.doctor_id ? 'var(--admin-danger, #ef4444)' : 'var(--admin-border, #e2e8f0)'}`,
              background: 'var(--admin-card-bg, #ffffff)',
              color: 'var(--admin-text, #0f172a)',
              fontSize: 13.5,
            }}
          >
            <option value="">-- ডাক্তার নির্বাচন করুন --</option>
            {doctors.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.name} {doc.specialty ? `(${doc.specialty})` : ''}
              </option>
            ))}
          </select>
          {currentErrors.doctor_id && (
            <div style={{ color: 'var(--admin-danger, #ef4444)', fontSize: 12, marginTop: 4 }}>
              {Array.isArray(currentErrors.doctor_id) ? currentErrors.doctor_id[0] : currentErrors.doctor_id}
            </div>
          )}
        </div>
      )}

      {/* Chamber Selection */}
      <div className="admin-form-group" style={{ marginBottom: 16 }}>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--admin-text, #1e293b)',
            marginBottom: 6,
            textTransform: 'uppercase',
          }}
        >
          <Building2 size={15} /> চেম্বার নির্বাচন
        </label>
        <select
          name="chamber_id"
          value={formData.chamber_id}
          onChange={handleChange}
          className="admin-form-control"
          style={{
            width: '100%',
            padding: '9px 12px',
            borderRadius: 'var(--admin-radius-sm, 6px)',
            border: '1px solid var(--admin-border, #e2e8f0)',
            background: 'var(--admin-card-bg, #ffffff)',
            color: 'var(--admin-text, #0f172a)',
            fontSize: 13.5,
          }}
        >
          <option value="">সকল চেম্বার (পুরো দিন ছুটি)</option>
          {chambers.map((ch) => (
            <option key={ch.id} value={ch.id}>
              {ch.hospital_name || ch.hospital?.name || 'চেম্বার'} {ch.day ? `(${ch.day})` : ''}
            </option>
          ))}
        </select>
        <small style={{ color: 'var(--admin-text-muted, #64748b)', fontSize: 11.5, marginTop: 4, display: 'block' }}>
          নির্দিষ্ট চেম্বার নির্বাচন না করলে ডাক্তারের সকল চেম্বারে ছুটি কার্যকর হবে।
        </small>
      </div>

      {/* Date Range: Start Date & End Date */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
        <div className="admin-form-group">
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--admin-text, #1e293b)',
              marginBottom: 6,
              textTransform: 'uppercase',
            }}
          >
            <Calendar size={15} /> শুরুর তারিখ <span style={{ color: 'var(--admin-danger, #ef4444)' }}>*</span>
          </label>
          <input
            type="date"
            name="start_date"
            value={formData.start_date}
            min={todayStr}
            onChange={handleChange}
            className={`admin-form-control ${currentErrors.start_date ? 'is-invalid' : ''}`}
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: 'var(--admin-radius-sm, 6px)',
              border: `1px solid ${currentErrors.start_date ? 'var(--admin-danger, #ef4444)' : 'var(--admin-border, #e2e8f0)'}`,
              background: 'var(--admin-card-bg, #ffffff)',
              color: 'var(--admin-text, #0f172a)',
              fontSize: 13.5,
            }}
          />
          {currentErrors.start_date && (
            <div style={{ color: 'var(--admin-danger, #ef4444)', fontSize: 12, marginTop: 4 }}>
              {Array.isArray(currentErrors.start_date) ? currentErrors.start_date[0] : currentErrors.start_date}
            </div>
          )}
        </div>

        <div className="admin-form-group">
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--admin-text, #1e293b)',
              marginBottom: 6,
              textTransform: 'uppercase',
            }}
          >
            <Calendar size={15} /> শেষের তারিখ <span style={{ color: 'var(--admin-danger, #ef4444)' }}>*</span>
          </label>
          <input
            type="date"
            name="end_date"
            value={formData.end_date}
            min={formData.start_date || todayStr}
            onChange={handleChange}
            className={`admin-form-control ${currentErrors.end_date ? 'is-invalid' : ''}`}
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: 'var(--admin-radius-sm, 6px)',
              border: `1px solid ${currentErrors.end_date ? 'var(--admin-danger, #ef4444)' : 'var(--admin-border, #e2e8f0)'}`,
              background: 'var(--admin-card-bg, #ffffff)',
              color: 'var(--admin-text, #0f172a)',
              fontSize: 13.5,
            }}
          />
          {currentErrors.end_date && (
            <div style={{ color: 'var(--admin-danger, #ef4444)', fontSize: 12, marginTop: 4 }}>
              {Array.isArray(currentErrors.end_date) ? currentErrors.end_date[0] : currentErrors.end_date}
            </div>
          )}
        </div>
      </div>

      {/* Reason Field */}
      <div className="admin-form-group" style={{ marginBottom: 16 }}>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--admin-text, #1e293b)',
            marginBottom: 6,
            textTransform: 'uppercase',
          }}
        >
          <FileText size={15} /> ছুটির কারণ (ঐচ্ছিক)
        </label>
        <textarea
          name="reason"
          value={formData.reason}
          onChange={handleChange}
          rows={2}
          placeholder="ছুটির কারণ উল্লেখ করুন (যেমন: ব্যক্তিগত কারণ, জরুরি কাজ, অসুস্থতা ইত্যাদি)..."
          maxLength={255}
          style={{
            width: '100%',
            padding: '9px 12px',
            borderRadius: 'var(--admin-radius-sm, 6px)',
            border: '1px solid var(--admin-border, #e2e8f0)',
            background: 'var(--admin-card-bg, #ffffff)',
            color: 'var(--admin-text, #0f172a)',
            fontSize: 13.5,
            resize: 'vertical',
          }}
        />
        {currentErrors.reason && (
          <div style={{ color: 'var(--admin-danger, #ef4444)', fontSize: 12, marginTop: 4 }}>
            {Array.isArray(currentErrors.reason) ? currentErrors.reason[0] : currentErrors.reason}
          </div>
        )}
      </div>

      {/* Real-Time Read-Only Impact Check Section */}
      <div style={{ marginBottom: 20 }}>
        {impactLoading && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 14px',
              borderRadius: 'var(--admin-radius-sm, 6px)',
              background: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              color: 'var(--admin-info, #3b82f6)',
              fontSize: 12.5,
            }}
          >
            <Loader2 size={16} className="spinner-border spinner-border-sm" style={{ animation: 'spin 1s linear infinite' }} />
            <span>অ্যাপয়েন্টমেন্ট ইমপ্যাক্ট তথ্য যাচাই করা হচ্ছে...</span>
          </div>
        )}

        {!impactLoading && impactData && impactData.has_conflicts && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 'var(--admin-radius-sm, 6px)',
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              color: 'var(--admin-warning, #f59e0b)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--admin-warning, #d97706)' }}>
                  সতর্কতা: {impactData.conflicting_count} টি অ্যাপয়েন্টমেন্ট বুকিং পাওয়া গেছে
                </div>
                <p style={{ margin: '4px 0 8px', fontSize: 12.5, color: 'var(--admin-text, #334155)', lineHeight: 1.4 }}>
                  এই ছুটির সময়কালের মধ্যে <strong>{impactData.conflicting_count}</strong> জন রোগীর অ্যাপয়েন্টমেন্ট নির্ধারিত রয়েছে। ছুটি যুক্ত করলে নতুন বুকিং বন্ধ হবে কিন্তু পূর্বে বুক করা অ্যাপয়েন্টমেন্ট বাতিল হবে না।
                </p>

                {impactData.conflicting_appointments?.length > 0 && (
                  <div
                    style={{
                      maxHeight: 140,
                      overflowY: 'auto',
                      background: 'var(--admin-card-bg, #ffffff)',
                      borderRadius: 4,
                      border: '1px solid var(--admin-border, #e2e8f0)',
                      padding: '6px 10px',
                      fontSize: 12,
                    }}
                  >
                    {impactData.conflicting_appointments.map((apt) => (
                      <div
                        key={apt.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '3px 0',
                          borderBottom: '1px dashed var(--admin-border, #f1f5f9)',
                          color: 'var(--admin-text, #0f172a)',
                        }}
                      >
                        <span>
                          <strong>{apt.appointment_date}</strong> ({apt.appointment_time || 'সময় নির্ধারিত নয়'})
                        </span>
                        <span style={{ color: 'var(--admin-text-muted, #64748b)' }}>
                          {apt.patient_name || 'রোগী'}
                        </span>
                      </div>
                    ))}
                    {impactData.has_more && (
                      <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--admin-text-muted, #64748b)', paddingTop: 4 }}>
                        + আরও {impactData.conflicting_count - impactData.sample_size} টি অ্যাপয়েন্টমেন্ট রয়েছে
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {!impactLoading && impactData && !impactData.has_conflicts && formData.start_date && formData.end_date && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 14px',
              borderRadius: 'var(--admin-radius-sm, 6px)',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              color: 'var(--admin-success, #10b981)',
              fontSize: 12.5,
            }}
          >
            <CheckCircle2 size={16} />
            <span>এই সময়কালের মধ্যে কোনো অ্যাপয়েন্টমেন্ট সংঘাত নেই। নিশ্চিন্তে ছুটি যুক্ত করতে পারেন।</span>
          </div>
        )}

        {impactError && (
          <div style={{ color: 'var(--admin-text-muted, #64748b)', fontSize: 11.5, marginTop: 4 }}>
            <Info size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            {impactError}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            style={{
              padding: '9px 18px',
              borderRadius: 'var(--admin-radius-sm, 6px)',
              border: '1px solid var(--admin-border, #cbd5e1)',
              background: 'transparent',
              color: 'var(--admin-text, #475569)',
              fontSize: 13.5,
              fontWeight: 600,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
            }}
          >
            বাতিল
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '9px 20px',
            borderRadius: 'var(--admin-radius-sm, 6px)',
            border: 'none',
            background: 'var(--admin-primary, #00B875)',
            color: '#ffffff',
            fontSize: 13.5,
            fontWeight: 600,
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            opacity: isSubmitting ? 0.7 : 1,
          }}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="spinner-border spinner-border-sm" style={{ animation: 'spin 1s linear infinite' }} />
              <span>সংরক্ষণ হচ্ছে...</span>
            </>
          ) : (
            <span>ছুটি নিশ্চিত করুন</span>
          )}
        </button>
      </div>
    </form>
  )
}
