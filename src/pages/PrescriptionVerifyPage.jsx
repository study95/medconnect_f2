import React, { useEffect, useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { ShieldCheck, ShieldAlert, CheckCircle2, XCircle, Stethoscope, Building2, Calendar, Pill, FileCheck2 } from 'lucide-react'
import axiosInstance from '../api/axiosInstance'

/**
 * Public Digital Prescription Verification Page (`/rx/view/:id` & `/rx/verify/:id`)
 *
 * Allows patients, pharmacies, and regulatory authorities to scan the QR code
 * on a printed or PDF prescription and verify its cryptographic authenticity
 * without exposing any Protected Health Information (PHI).
 */
export default function PrescriptionVerifyPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const sig = searchParams.get('sig') || ''

  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true
    const verifyPrescription = async () => {
      setLoading(true)
      setError(null)
      try {
        const query = sig ? `?sig=${encodeURIComponent(sig)}` : ''
        const res = await axiosInstance.get(`/prescriptions/verify/${encodeURIComponent(id || '')}${query}`)
        if (isMounted) {
          setResult(res.data)
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || 'প্রেসক্রিপশনটি যাচাই করা যায়নি।')
          setResult(err.response?.data || null)
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    if (id) {
      verifyPrescription()
    } else {
      setLoading(false)
      setError('প্রেসক্রিপশন আইডি পাওয়া যায়নি।')
    }

    return () => {
      isMounted = false
    }
  }, [id, sig])

  const isValid = Boolean(result?.valid && result?.integrity_verified)

  return (
    <div style={{ minHeight: '72vh', background: '#f8fafc', padding: '48px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ maxWidth: 560, width: '100%', background: '#ffffff', borderRadius: 16, boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div
          style={{
            padding: '28px 24px',
            background: loading
              ? '#0f172a'
              : isValid
                ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                : 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
            color: '#ffffff',
            textAlign: 'center',
          }}
        >
          <div style={{ display: 'inline-flex', padding: 12, borderRadius: '50%', background: 'rgba(255,255,255,0.16)', marginBottom: 12 }}>
            {loading ? <FileCheck2 size={36} /> : isValid ? <ShieldCheck size={36} /> : <ShieldAlert size={36} />}
          </div>
          <h2 style={{ fontSize: 21, fontWeight: 700, margin: 0 }}>
            {loading
              ? 'ডিজিটাল প্রেসক্রিপশন যাচাই করা হচ্ছে...'
              : isValid
                ? 'যাচাইকৃত আসল ডিজিটাল প্রেসক্রিপশন'
                : 'প্রেসক্রিপশন যাচাই সফল হয়নি'}
          </h2>
          <p style={{ fontSize: 13, opacity: 0.9, marginTop: 6, marginBottom: 0 }}>
            {loading
              ? 'অনুগ্রহ করে অপেক্ষা করুন'
              : isValid
                ? 'Cryptographic SHA-256 HMAC Signature Verified'
                : (result?.message || error || 'এই প্রেসক্রিপশনটির ডিজিটাল স্বাক্ষর মেলেনি বা রেকর্ড পাওয়া যায়নি।')}
          </p>
        </div>

        <div style={{ padding: '24px' }}>
          {!loading && result && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f1f5f9', borderRadius: 10 }}>
                <span style={{ fontSize: 13, color: '#475569', fontWeight: 600 }}>প্রেসক্রিপশন আইডি</span>
                <span style={{ fontSize: 15, color: '#0f172a', fontWeight: 800, fontFamily: 'monospace' }}>
                  {result.public_id || id}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: 13, color: '#64748b' }}>স্ট্যাটাস</span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 13,
                    fontWeight: 700,
                    color: isValid ? '#059669' : '#dc2626',
                  }}
                >
                  {isValid ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                  {String(result.status || 'unknown').toUpperCase()} (v{result.version || 1})
                </span>
              </div>

              {result.doctor && (
                <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a', fontWeight: 700, fontSize: 15 }}>
                    <Stethoscope size={17} color="#0284c7" />
                    <span>{result.doctor.name || 'চিকিৎসক'}</span>
                  </div>
                  {result.doctor.degree && (
                    <div style={{ fontSize: 13, color: '#475569', marginTop: 4 }}>{result.doctor.degree}</div>
                  )}
                  {result.doctor.specialty && (
                    <div style={{ fontSize: 12, color: '#0284c7', fontWeight: 600, marginTop: 2 }}>{result.doctor.specialty}</div>
                  )}
                  {result.doctor.bmdc && (
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, fontWeight: 600 }}>
                      BMDC Reg: {result.doctor.bmdc}
                    </div>
                  )}
                </div>
              )}

              {result.facility?.name && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 16px' }}>
                  <Building2 size={17} color="#64748b" style={{ marginTop: 2, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{result.facility.name}</div>
                    {result.facility.address && (
                      <div style={{ fontSize: 12, color: '#64748b' }}>{result.facility.address}</div>
                    )}
                  </div>
                </div>
              )}

              {result.visited_at && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', fontSize: 13 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#64748b' }}>
                    <Calendar size={15} /> ভিজিটের তারিখ
                  </span>
                  <span style={{ fontWeight: 600, color: '#1e293b' }}>
                    {new Date(result.visited_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </div>
              )}

              {typeof result.medicine_count === 'number' && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', fontSize: 13 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#64748b' }}>
                    <Pill size={15} /> নির্ধারিত ওষুধের সংখ্যা
                  </span>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>{result.medicine_count} টি</span>
                </div>
              )}
            </div>
          )}

          <div style={{ marginTop: 20, padding: '12px', background: '#f8fafc', borderRadius: 8, fontSize: 12, color: '#64748b', textAlign: 'center' }}>
            রোগীর গোপনীয়তা (PHI) সুরক্ষার স্বার্থে এই পাবলিক ভেরিফিকেশন পেজে রোগীর নাম, রোগনির্ণয় বা ওষুধের তালিকা প্রদর্শন করা হয় না। সম্পূর্ণ প্রেসক্রিপশন দেখতে{' '}
            <Link to={`/prescriptions/view/${encodeURIComponent(id || '')}`} style={{ color: '#0284c7', fontWeight: 600 }}>
              লগইন করুন
            </Link>
            ।
          </div>
        </div>
      </div>
    </div>
  )
}
