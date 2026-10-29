import React, { useState, useEffect } from 'react'
import { CheckCircle2, X, AlertTriangle, Banknote, Smartphone, Clock, RotateCcw, Calendar, User, Stethoscope, Building2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function AppointmentStatusModal({
  show,
  onClose,
  appointment,
  targetStatus,
  onConfirm,
  loading = false,
}) {
  const { user, isAdmin, isDoctor, isManager } = useAuth()
  const [paymentOption, setPaymentOption] = useState('cash') // 'cash' | 'digital' | 'unpaid'
  const [digitalMethod, setDigitalMethod] = useState('bKash')
  const [cancellationReason, setCancellationReason] = useState('')
  const [collectorRole, setCollectorRole] = useState('hospital') // 'hospital' | 'doctor' | 'admin'

  useEffect(() => {
    if (show && appointment) {
      if (isManager) {
        setCollectorRole('hospital')
      } else if (isDoctor) {
        setCollectorRole('doctor')
      } else if (isAdmin) {
        const isHosp = Boolean(appointment.hospital_id || appointment.hospital?.id || appointment.chamber?.hospital_id)
        setCollectorRole(isHosp ? 'hospital' : 'doctor')
      } else {
        const isHosp = Boolean(appointment.hospital_id || appointment.hospital?.id || appointment.chamber?.hospital_id)
        setCollectorRole(isHosp ? 'hospital' : 'doctor')
      }
      setPaymentOption('cash')
      setDigitalMethod('bKash')
      setCancellationReason('')
    }
  }, [show, appointment, targetStatus, isManager, isDoctor, isAdmin])

  if (!show || !appointment) return null

  const fee = Number(appointment.amount || appointment.fee || appointment.total_amount || 0)
  const patientName = appointment.patient_name || appointment.patient?.name || appointment.user?.name || appointment.user_name || 'Patient'
  const patientPhone = appointment.patient_phone || appointment.patient?.phone || appointment.user?.phone || '—'
  const doctorName = appointment.doctor?.name || appointment.doctor_name || 'Doctor'
  const hospitalName = appointment.hospital?.name || appointment.hospital_name || appointment.chamber?.name || 'Chamber'

  const isCancelling = targetStatus === 'cancelled'
  const isCompleting = targetStatus === 'completed'
  const isConfirming = targetStatus === 'confirmed'
  const isPending = targetStatus === 'pending'

  const handleSubmit = (e) => {
    e.preventDefault()

    if (isPending) {
      onConfirm({
        id: appointment.id,
        status: 'pending',
        payment_status: 'Unpaid',
      })
      return
    }

    if (isCancelling) {
      onConfirm({
        id: appointment.id,
        status: 'cancelled',
        cancellation_reason: cancellationReason || 'Cancelled by admin/doctor',
      })
      return
    }

    let payment_status = appointment.payment_status || 'Unpaid'
    let payment_method = appointment.payment_method || 'Cash'

    if (paymentOption === 'cash') {
      payment_status = 'Paid'
      payment_method = 'Cash'
    } else if (paymentOption === 'digital') {
      payment_status = 'Paid'
      payment_method = digitalMethod
    } else {
      payment_status = 'Unpaid'
      payment_method = 'Cash'
    }

    let finalCollectorRole = collectorRole
    if (isManager) {
      finalCollectorRole = 'hospital'
    } else if (isDoctor) {
      finalCollectorRole = 'doctor'
    }

    onConfirm({
      id: appointment.id,
      status: targetStatus,
      payment_status,
      payment_method,
      payment_collected_by_role: payment_status === 'Paid' ? finalCollectorRole : null,
    })
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--admin-card-bg, #FFFFFF)',
          borderRadius: 20,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          width: '100%',
          maxWidth: 480,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid var(--admin-border, #E2E8F0)',
            background: isCancelling ? '#FEF2F2' : isPending ? '#FFFBEB' : 'var(--admin-bg, #F8FAFC)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {isCancelling ? (
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={18} />
              </div>
            ) : isPending ? (
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <RotateCcw size={18} />
              </div>
            ) : (
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(0, 184, 117, 0.12)', color: '#00B875', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={18} />
              </div>
            )}
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: isCancelling ? '#DC2626' : isPending ? '#B45309' : 'var(--admin-text, #0F172A)' }}>
                {isPending
                  ? 'অপেক্ষমানে (Pending) ফেরত নেওয়া'
                  : isCancelling
                  ? 'অ্যাপয়েন্টমেন্ট বাতিল নিশ্চিতকরণ'
                  : isCompleting
                  ? 'ভিজিট সম্পন্ন ও পেমেন্ট নিশ্চিতকরণ'
                  : 'অ্যাপয়েন্টমেন্ট কনফার্ম ও পেমেন্ট রিসিভ'}
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: 11.5, color: 'var(--admin-text-muted, #64748B)' }}>
                {isPending
                  ? 'অ্যাপয়েন্টমেন্টটি আবার অপেক্ষমান তালিকায় ফিরে যাবে এবং পেমেন্ট বকেয়া হবে'
                  : isCancelling
                  ? 'বাতিল করলে কোনো ফি বা কমিশন ধার্য হবে না'
                  : 'পেমেন্ট মেথড নিশ্চিত করুন, যা স্বয়ংক্রিয়ভাবে পেমেন্ট ও কমিশন লেজারে যুক্ত হবে'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            disabled={loading}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--admin-text-muted, #64748B)',
              padding: 4,
              borderRadius: 6,
              display: 'flex',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '20px', flex: 1 }}>
          {/* Patient & Booking Summary Box */}
          <div
            style={{
              background: 'var(--admin-bg, #F8FAFC)',
              border: '1px solid var(--admin-border, #E2E8F0)',
              borderRadius: 12,
              padding: '12px 14px',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontWeight: 800, fontSize: 13.5, color: 'var(--admin-text, #0F172A)' }}>
                {patientName}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--admin-text-muted, #64748B)', marginTop: 2 }}>
                📞 {patientPhone} • 👨‍⚕️ {doctorName}
              </div>
              <div style={{ fontSize: 11, color: 'var(--admin-text-muted, #64748B)', marginTop: 1 }}>
                📍 {hospitalName} {appointment.serial_number ? `• সিরিয়াল: #${appointment.serial_number}` : ''}
              </div>
            </div>

            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--admin-text-muted, #64748B)', textTransform: 'uppercase' }}>
                কনসালটেশন ফি
              </div>
              <div style={{ fontSize: 17, fontWeight: 900, color: '#00A88C' }}>
                ৳{fee.toLocaleString()}
              </div>
            </div>
          </div>

          {/* If Pending Revert */}
          {isPending ? (
            <div style={{ background: '#FFFBEB', border: '1.5px solid #FDE68A', borderRadius: 12, padding: '14px', marginBottom: 12 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <AlertTriangle size={20} style={{ color: '#D97706', flexShrink: 0, marginTop: 2 }} />
                <div style={{ fontSize: 12.5, color: '#92400E', lineHeight: 1.5 }}>
                  <strong>সতর্কতা:</strong> আপনি এই অ্যাপয়েন্টমেন্টটিকে আবার <strong>অপেক্ষমান (Pending)</strong> অবস্থায় ফিরিয়ে নিচ্ছেন।
                  <ul style={{ margin: '6px 0 0 0', paddingLeft: 18, fontSize: 12 }}>
                    <li>পেমেন্ট স্ট্যাটাস <strong>Unpaid (বকেয়া)</strong> হিসেবে আপডেট হবে।</li>
                    <li>অ্যাপয়েন্টমেন্টটি সাময়িকভাবে <strong>কমিশন রিপোর্ট থেকে বাদ যাবে</strong>।</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : isCancelling ? (
            /* If Cancelling */
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--admin-text, #0F172A)', marginBottom: 6 }}>
                বাতিলের কারণ (ঐচ্ছিক):
              </label>
              <textarea
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="রোগী আসতে অপারগ / ডাক্তারের ছুটি / অন্য কোনো কারণ..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1.5px solid var(--admin-border, #CBD5E1)',
                  background: 'var(--admin-card-bg, #FFFFFF)',
                  color: 'var(--admin-text, #0F172A)',
                  fontSize: 12.5,
                  outline: 'none',
                }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 11, color: '#DC2626' }}>
                <AlertTriangle size={14} />
                <span>বাতিলকৃত অ্যাপয়েন্টমেন্টে কোনো পেমেন্ট বা প্ল্যাটফর্ম কমিশন যুক্ত হবে না।</span>
              </div>
            </div>
          ) : (
            /* If Confirming or Completing: Ask how payment was received */
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--admin-text, #0F172A)', marginBottom: 8 }}>
                ফি কীভাবে আদায় করা হলো?
              </label>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {/* Option 1: Cash (Recommended) */}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '11px 14px',
                    borderRadius: 12,
                    border: paymentOption === 'cash' ? '2px solid #00B875' : '1.5px solid var(--admin-border, #E2E8F0)',
                    background: paymentOption === 'cash' ? 'rgba(0, 184, 117, 0.08)' : 'var(--admin-card-bg, #FFFFFF)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <input
                    type="radio"
                    name="payment_outcome"
                    value="cash"
                    checked={paymentOption === 'cash'}
                    onChange={() => setPaymentOption('cash')}
                    style={{ accentColor: '#00B875', width: 16, height: 16 }}
                  />
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(0, 184, 117, 0.15)', color: '#00875A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Banknote size={16} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--admin-text, #0F172A)' }}>
                      💵 নগদ ক্যাশ গ্রহণ করা হয়েছে (Paid via Cash)
                    </div>
                    <div style={{ fontSize: 10.5, color: 'var(--admin-text-muted, #64748B)' }}>
                      রোগী চেম্বারে নগদ ফি পরিশোধ করেছেন। পেমেন্ট PAID হবে এবং কমিশন রিপোর্টে যুক্ত হবে।
                    </div>
                  </div>
                </label>

                {/* Option 2: Digital / Online (bKash, Nagad) */}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '11px 14px',
                    borderRadius: 12,
                    border: paymentOption === 'digital' ? '2px solid #6366F1' : '1.5px solid var(--admin-border, #E2E8F0)',
                    background: paymentOption === 'digital' ? 'rgba(99, 102, 241, 0.08)' : 'var(--admin-card-bg, #FFFFFF)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <input
                    type="radio"
                    name="payment_outcome"
                    value="digital"
                    checked={paymentOption === 'digital'}
                    onChange={() => setPaymentOption('digital')}
                    style={{ accentColor: '#6366F1', width: 16, height: 16 }}
                  />
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(99, 102, 241, 0.15)', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Smartphone size={16} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--admin-text, #0F172A)' }}>
                      📱 ডিজিটাল / অনলাইন পেমেন্ট (bKash / Nagad / Card)
                    </div>
                    <div style={{ fontSize: 10.5, color: 'var(--admin-text-muted, #64748B)' }}>
                      বিকাশ, নগদ বা কার্ডের মাধ্যমে পেমেন্ট গৃহীত হয়েছে।
                    </div>
                  </div>
                </label>

                {/* Sub-selector for digital method */}
                {paymentOption === 'digital' && (
                  <div style={{ marginLeft: 34, padding: '6px 12px', background: 'var(--admin-bg, #F8FAFC)', borderRadius: 8, border: '1px solid var(--admin-border, #E2E8F0)', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)' }}>মেথড সিলেক্ট করুন:</span>
                    <select
                      value={digitalMethod}
                      onChange={(e) => setDigitalMethod(e.target.value)}
                      style={{ fontSize: 11.5, fontWeight: 700, padding: '3px 8px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#0F172A', outline: 'none' }}
                    >
                      <option value="bKash">bKash (বিকাশ)</option>
                      <option value="Nagad">Nagad (নগদ)</option>
                      <option value="Rocket">Rocket (রকেট)</option>
                      <option value="Card">Debit / Credit Card</option>
                      <option value="Online">Online Gateway</option>
                    </select>
                  </div>
                )}

                {/* Option 3: Unpaid / Later */}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '11px 14px',
                    borderRadius: 12,
                    border: paymentOption === 'unpaid' ? '2px solid #F59E0B' : '1.5px solid var(--admin-border, #E2E8F0)',
                    background: paymentOption === 'unpaid' ? 'rgba(245, 158, 11, 0.08)' : 'var(--admin-card-bg, #FFFFFF)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <input
                    type="radio"
                    name="payment_outcome"
                    value="unpaid"
                    checked={paymentOption === 'unpaid'}
                    onChange={() => setPaymentOption('unpaid')}
                    style={{ accentColor: '#F59E0B', width: 16, height: 16 }}
                  />
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(245, 158, 11, 0.15)', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Clock size={16} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--admin-text, #0F172A)' }}>
                      ⏳ ফি পরে আদায় করা হবে (বকেয়া / Unpaid)
                    </div>
                    <div style={{ fontSize: 10.5, color: 'var(--admin-text-muted, #64748B)' }}>
                      অ্যাপয়েন্টমেন্ট কনফার্ম হবে, কিন্তু পেমেন্ট আপাতত বকেয়া থাকবে।
                    </div>
                  </div>
                </label>
              </div>

              {/* Collector Role Selector (When Paid) */}
              {paymentOption !== 'unpaid' && (
                <div style={{
                  padding: '12px 14px',
                  background: 'var(--admin-bg, #F8FAFC)',
                  borderRadius: 12,
                  border: '1.5px solid var(--admin-border, #E2E8F0)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  marginBottom: 16
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--admin-text, #0F172A)' }}>
                      ফি কে গ্রহণ করেছেন? (Fee Collected By)
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: '#059669', background: '#DCFCE7', padding: '1px 6px', borderRadius: 4 }}>
                      স্বয়ংক্রিয় হিসাব
                    </span>
                  </div>

                  {/* If Hospital manager is logged in: show locked badge for hospital */}
                  {isManager ? (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 14px',
                      background: 'rgba(0, 168, 140, 0.08)',
                      border: '1.5px solid #00A88C',
                      borderRadius: 10
                    }}>
                      <div style={{
                        width: 38,
                        height: 38,
                        borderRadius: 8,
                        background: 'rgba(0, 168, 140, 0.16)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 20,
                        flexShrink: 0
                      }}>
                        🏦
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: 11.5, fontWeight: 800, color: '#007561', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>হাসপাতাল কাউন্টার</span>
                          <span style={{ fontSize: 9.5, fontWeight: 700, color: '#047857', background: '#D1FAE5', padding: '1px 6px', borderRadius: 4 }}>
                            স্বয়ংক্রিয় লক
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: '#0F172A', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
                          {hospitalName || appointment.hospital?.name || user?.name || 'কাউন্টার ক্যাশ রিসিভ'}
                        </div>
                      </div>
                    </div>
                  ) : isDoctor ? (
                    /* If Doctor is logged in: show locked badge for doctor */
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 14px',
                      background: 'rgba(37, 99, 235, 0.08)',
                      border: '1.5px solid #2563EB',
                      borderRadius: 10
                    }}>
                      <div style={{
                        width: 38,
                        height: 38,
                        borderRadius: 8,
                        background: 'rgba(37, 99, 235, 0.16)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 20,
                        flexShrink: 0
                      }}>
                        🩺
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: 11.5, fontWeight: 800, color: '#1D4ED8', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>ডাক্তার / চেম্বার কাউন্টার</span>
                          <span style={{ fontSize: 9.5, fontWeight: 700, color: '#1E40AF', background: '#DBEAFE', padding: '1px 6px', borderRadius: 4 }}>
                            স্বয়ংক্রিয় লক
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: '#0F172A', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
                          {doctorName || user?.name || 'চেম্বার ক্যাশ রিসিভ'}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* If Super Admin is logged in: keep the 3 choice buttons for manual audit/correction */
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => setCollectorRole('hospital')}
                        style={{
                          padding: '8px 10px',
                          borderRadius: 8,
                          fontSize: 11,
                          fontWeight: 700,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 4,
                          textAlign: 'center',
                          border: collectorRole === 'hospital' ? '2px solid #00A88C' : '1px solid var(--admin-border, #CBD5E1)',
                          background: collectorRole === 'hospital' ? 'rgba(0, 168, 140, 0.12)' : 'var(--admin-card-bg, #FFFFFF)',
                          color: collectorRole === 'hospital' ? '#007561' : 'var(--admin-text, #334155)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <span style={{ fontSize: 16 }}>🏦</span>
                        <span>হাসপাতাল</span>
                        <span style={{ fontSize: 9.5, opacity: 0.8, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
                          {hospitalName || 'কাউন্টার'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCollectorRole('doctor')}
                        style={{
                          padding: '8px 10px',
                          borderRadius: 8,
                          fontSize: 11,
                          fontWeight: 700,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 4,
                          textAlign: 'center',
                          border: collectorRole === 'doctor' ? '2px solid #00A88C' : '1px solid var(--admin-border, #CBD5E1)',
                          background: collectorRole === 'doctor' ? 'rgba(0, 168, 140, 0.12)' : 'var(--admin-card-bg, #FFFFFF)',
                          color: collectorRole === 'doctor' ? '#007561' : 'var(--admin-text, #334155)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <span style={{ fontSize: 16 }}>🩺</span>
                        <span>ডাক্তার</span>
                        <span style={{ fontSize: 9.5, opacity: 0.8, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
                          {doctorName || 'চেম্বার'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCollectorRole('admin')}
                        style={{
                          padding: '8px 10px',
                          borderRadius: 8,
                          fontSize: 11,
                          fontWeight: 700,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 4,
                          textAlign: 'center',
                          border: collectorRole === 'admin' ? '2px solid #00A88C' : '1px solid var(--admin-border, #CBD5E1)',
                          background: collectorRole === 'admin' ? 'rgba(0, 168, 140, 0.12)' : 'var(--admin-card-bg, #FFFFFF)',
                          color: collectorRole === 'admin' ? '#007561' : 'var(--admin-text, #334155)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <span style={{ fontSize: 16 }}>🛡️</span>
                        <span>অ্যাডমিন</span>
                        <span style={{ fontSize: 9.5, opacity: 0.8, fontWeight: 500 }}>
                          সরাসরি
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Commission Sync Notice */}
              <div
                style={{
                  background: 'rgba(2, 132, 199, 0.06)',
                  border: '1px solid rgba(2, 132, 199, 0.2)',
                  borderRadius: 10,
                  padding: '10px 12px',
                  fontSize: 11,
                  color: '#0369A1',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span>💡</span>
                <span>
                  <strong>কমিশন রিপোর্ট সংযোগ:</strong> পেমেন্ট পেইড (Paid) মার্ক করলেই এটি স্বয়ংক্রিয়ভাবে কমিশন রিপোর্টে অন্তর্ভুক্ত হবে।
                </span>
              </div>
            </div>
          )}

          {/* Modal Action Buttons */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 10,
              marginTop: 20,
              paddingTop: 14,
              borderTop: '1px solid var(--admin-border, #E2E8F0)',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="admin-btn admin-btn-outline"
              style={{ padding: '8px 16px', fontSize: 12.5, fontWeight: 700 }}
            >
              বন্ধ করুন
            </button>

            <button
              type="submit"
              disabled={loading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 20px',
                borderRadius: 10,
                border: 'none',
                background: isCancelling
                  ? 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)'
                  : isPending
                  ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
                  : 'linear-gradient(135deg, #00A88C 0%, #059669 100%)',
                color: '#FFFFFF',
                fontSize: 13,
                fontWeight: 800,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                boxShadow: isCancelling
                  ? '0 4px 12px rgba(220, 38, 38, 0.25)'
                  : isPending
                  ? '0 4px 12px rgba(245, 158, 11, 0.25)'
                  : '0 4px 12px rgba(0, 168, 140, 0.25)',
              }}
            >
              {loading ? (
                <span>আপডেট হচ্ছে...</span>
              ) : isCancelling ? (
                <span>✕ বাতিল নিশ্চিত করুন</span>
              ) : isPending ? (
                <span>↩ অপেক্ষমানে ফেরত নিন</span>
              ) : (
                <span>✓ নিশ্চিত ও সেভ করুন</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

