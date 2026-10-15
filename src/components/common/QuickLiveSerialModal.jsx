import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { trackLiveSerialByPhone } from '../../api/appointmentApi'
import {
  IconPhone,
  IconX,
  IconBroadcast,
  IconActivity,
  IconArrowRight,
  IconBuildingHospital,
  IconDeviceTv,
  IconReportMedical,
  IconHeadset
} from '@tabler/icons-react'

export default function QuickLiveSerialModal({ isOpen, onClose }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [results, setResults] = useState([])
  const [errorMsg, setErrorMsg] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      const initialPhone = user?.phone || user?.mobile || ''
      if (initialPhone) {
        setPhone(initialPhone)
        handleSearchSubmit(null, initialPhone)
      } else {
        setTimeout(() => inputRef.current?.focus(), 120)
      }
    } else {
      document.body.style.overflow = ''
      setSearched(false)
      setResults([])
      setErrorMsg('')
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleSearchSubmit = async (e, directPhone = null) => {
    if (e && e.preventDefault) e.preventDefault()
    const targetPhone = directPhone || phone
    const clean = (targetPhone || '').trim().replace(/[^\d]/g, '')
    if (clean.length < 11) {
      setErrorMsg('অনুগ্রহ করে সঠিক ১১ সংখ্যার মোবাইল নম্বর দিন (যেমন: 01XXXXXXXXX)')
      return
    }
    setLoading(true)
    setErrorMsg('')
    try {
      const res = await trackLiveSerialByPhone(clean)
      if (res.data?.success) {
        setResults(res.data.data || [])
        setSearched(true)
      } else {
        setErrorMsg(res.data?.message || 'কোনো সক্রিয় সিরিয়াল পাওয়া যায়নি')
        setSearched(true)
      }
    } catch {
      setErrorMsg('সার্ভারে সাময়িক সমস্যা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return createPortal(
    <div className="qls-modal-overlay" onClick={onClose}>
      <div className="qls-modal-content" onClick={e => e.stopPropagation()}>
        {/* Mobile Swipe handle */}
        <div className="qls-drag-indicator" />

        {/* Modal Header */}
        <div className="qls-modal-header">
          <div className="qls-header-title-box">
            <div className="qls-live-pill-badge">
              <span className="qls-pulse-dot" />
              <span>রিয়েল-টাইম মনিটর</span>
            </div>
            <h3 className="qls-title">লাইভ সিরিয়াল ট্র্যাকিং</h3>
            <p className="qls-subtitle">আপনার মোবাইল নম্বর দিয়ে বর্তমান সিরিয়াল ও চেম্বার স্ট্যাটাস জানুন</p>
          </div>
          <button className="qls-close-btn" onClick={onClose} aria-label="Close">
            <IconX size={20} />
          </button>
        </div>

        {/* Search Input Box */}
        <form onSubmit={handleSearchSubmit} className="qls-search-form">
          <div className="qls-input-wrap">
            <IconPhone size={18} className="qls-input-icon" />
            <input
              ref={inputRef}
              type="tel"
              placeholder="01XXXXXXXXX"
              value={phone}
              onChange={e => {
                setPhone(e.target.value)
                if (errorMsg) setErrorMsg('')
              }}
              maxLength={11}
              className="qls-input"
            />
            {phone && (
              <button
                type="button"
                className="qls-clear-input"
                onClick={() => {
                  setPhone('')
                  setResults([])
                  setSearched(false)
                  setErrorMsg('')
                  inputRef.current?.focus()
                }}
              >
                <IconX size={14} />
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={loading || phone.replace(/[^\d]/g, '').length < 11}
            className="qls-submit-btn"
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                <span>চেক হচ্ছে...</span>
              </>
            ) : (
              <>
                <IconBroadcast size={17} />
                <span>সিরিয়াল দেখুন</span>
              </>
            )}
          </button>
        </form>

        {errorMsg && (
          <div className="qls-error-box">
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Results Body */}
        <div className="qls-results-container">
          {loading && (
            <div className="qls-loading-state">
              <div className="spinner-border text-info" style={{ width: 34, height: 34 }} />
              <p>লাইভ চেম্বার সার্ভার থেকে তথ্য সংগ্রহ করা হচ্ছে...</p>
            </div>
          )}

          {!loading && searched && results.length === 0 && (
            <div className="qls-empty-state">
              <div className="qls-empty-icon-box">
                <IconActivity size={32} color="#0EA5E9" />
              </div>
              <h4>আজকের কোনো সক্রিয় সিরিয়াল নেই</h4>
              <p>এই নম্বরে আজকের কোনো সক্রিয় সিরিয়াল পাওয়া যায়নি। আপনি কি নতুন কোনো ডাক্তারের সিরিয়াল বুক করতে চান?</p>
              <button
                className="qls-book-cta-btn"
                onClick={() => {
                  onClose()
                  navigate('/quick-appointment')
                }}
              >
                <span>নতুন সিরিয়াল বুক করুন</span>
                <IconArrowRight size={16} />
              </button>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="qls-appointments-list">
              {results.map((item, idx) => (
                <div key={item.id || idx} className="qls-appointment-card">
                  {/* Doctor & Chamber Header */}
                  <div className="qls-card-top">
                    <div>
                      <div className="qls-doc-specialty">{item.doctor_specialty || 'বিশেষজ্ঞ'}</div>
                      <h4 className="qls-doc-name">{item.doctor_name}</h4>
                      <div className="qls-chamber-name">
                        <IconBuildingHospital size={14} />
                        <span>{item.chamber_name} {item.hospital_name ? `(${item.hospital_name})` : ''}</span>
                      </div>
                    </div>
                    {item.is_today && (
                      <div className="qls-today-badge">
                        <span className="qls-pulse-dot" />
                        <span>আজকের সেশন</span>
                      </div>
                    )}
                  </div>

                  {/* 3-Box Live Serial Counters */}
                  <div className="qls-counters-row">
                    <div className="qls-counter-box qls-box-your">
                      <span className="qls-counter-label">আপনার সিরিয়াল</span>
                      <span className="qls-counter-value">#{item.serial_number || '—'}</span>
                    </div>

                    <div className="qls-counter-box qls-box-serving">
                      <span className="qls-counter-label">বর্তমানে চলছে</span>
                      <span className="qls-counter-value">
                        {item.current_serving ? `#${item.current_serving}` : 'শুরু হয়নি'}
                      </span>
                    </div>

                    <div className="qls-counter-box qls-box-ahead">
                      <span className="qls-counter-label">অপেক্ষমাণ রোগী</span>
                      <span className="qls-counter-value">
                        {item.patients_ahead !== null && item.patients_ahead !== undefined 
                          ? `${item.patients_ahead} জন` 
                          : 'অপেক্ষমাণ'}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="qls-card-actions">
                    {item.display_token ? (
                      <button
                        className="qls-tv-btn"
                        onClick={() => {
                          onClose()
                          navigate(`/display/${item.display_token}`)
                        }}
                      >
                        <IconDeviceTv size={16} />
                        <span>চেম্বারের লাইভ ডিসপ্লে দেখুন</span>
                      </button>
                    ) : null}

                    <button
                      className="qls-ticket-btn"
                      onClick={() => {
                        onClose()
                        navigate(`/appointment-ticket/${item.id}`)
                      }}
                    >
                      <IconReportMedical size={15} />
                      <span>ফুল টিকিট</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Helpline Note */}
        <div className="qls-modal-footer">
          <IconHeadset size={15} />
          <span>প্রয়োজনে সরাসরি সহায়তা পেতে কল করুন: <strong>09613868438</strong></span>
        </div>
      </div>

      <style>{`
        .qls-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.65);
          backdrop-filter: blur(5px);
          -webkit-backdrop-filter: blur(5px);
          z-index: 999999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          animation: qlsOverlayFade 0.2s ease-out;
        }

        @keyframes qlsOverlayFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .qls-modal-content {
          background: #FFFFFF;
          border-radius: 20px;
          width: 100%;
          max-width: 480px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 20px 45px rgba(15, 23, 42, 0.28);
          animation: qlsModalSlideUp 0.28s cubic-bezier(0.16, 1, 0.3, 1);
          font-family: 'Hind Siliguri', sans-serif;
        }

        @keyframes qlsModalSlideUp {
          from { transform: translateY(20px) scale(0.97); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }

        .qls-drag-indicator {
          display: none;
        }

        .qls-modal-header {
          padding: 16px 20px 14px 20px;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          border-bottom: 1px solid #F1F5F9;
          background: #FFFFFF;
        }

        .qls-header-title-box {
          flex: 1;
        }

        .qls-live-pill-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: #E0F2FE;
          color: #0284C7;
          font-size: 11px;
          font-weight: 700;
          padding: 2.5px 8px;
          border-radius: 999px;
          margin-bottom: 6px;
          border: 1px solid #BAE6FD;
        }

        .qls-pulse-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #0284C7;
          box-shadow: 0 0 6px #0284C7;
          animation: qlsPulseDot 1.4s infinite ease-in-out;
        }

        @keyframes qlsPulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.35; transform: scale(0.75); }
        }

        .qls-title {
          font-size: 18px;
          font-weight: 800;
          color: #0F172A;
          margin: 0 0 3px 0;
          line-height: 1.3;
        }

        .qls-subtitle {
          font-size: 12px;
          color: #64748B;
          margin: 0;
          line-height: 1.4;
        }

        .qls-close-btn {
          background: #F1F5F9;
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748B;
          cursor: pointer;
          transition: all 0.18s;
          flex-shrink: 0;
          margin-left: 12px;
        }

        .qls-close-btn:hover {
          background: #E2E8F0;
          color: #0F172A;
        }

        .qls-search-form {
          padding: 12px 18px;
          background: #F8FAFC;
          border-bottom: 1px solid #F1F5F9;
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .qls-input-wrap {
          position: relative;
          flex: 1;
          display: flex;
          align-items: center;
        }

        .qls-input-icon {
          position: absolute;
          left: 11px;
          color: #0284C7;
          pointer-events: none;
        }

        .qls-input {
          width: 100%;
          height: 42px;
          padding: 0 30px 0 36px;
          border: 1.5px solid #CBD5E1;
          border-radius: 10px;
          font-size: 14.5px;
          font-weight: 700;
          color: #0F172A;
          outline: none;
          background: #FFFFFF;
          transition: border-color 0.2s, box-shadow 0.2s;
          letter-spacing: 0.04em;
        }

        .qls-input:focus {
          border-color: #0284C7;
          box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.16);
        }

        .qls-clear-input {
          position: absolute;
          right: 8px;
          background: none;
          border: none;
          color: #94A3B8;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .qls-clear-input:hover {
          color: #E11D48;
        }

        .qls-submit-btn {
          height: 42px;
          padding: 0 16px;
          background: linear-gradient(135deg, #0284C7 0%, #0369A1 100%);
          color: #FFFFFF;
          border: none;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          white-space: nowrap;
          box-shadow: 0 3px 10px rgba(2, 132, 199, 0.3);
          transition: transform 0.18s, box-shadow 0.18s;
        }

        .qls-submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          box-shadow: none;
        }

        .qls-submit-btn:not(:disabled):hover {
          transform: translateY(-1px);
          box-shadow: 0 5px 14px rgba(2, 132, 199, 0.4);
        }

        .qls-error-box {
          margin: 10px 18px 0 18px;
          padding: 8px 12px;
          background: #FEF2F2;
          border: 1px solid #FECACA;
          border-radius: 8px;
          color: #DC2626;
          font-size: 12px;
          font-weight: 600;
        }

        .qls-results-container {
          flex: 1;
          overflow-y: auto;
          padding: 14px 18px;
          min-height: 160px;
          max-height: 380px;
        }

        .qls-loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 36px 16px;
          color: #64748B;
          gap: 12px;
          text-align: center;
          font-size: 13px;
        }

        .qls-empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px 16px;
          text-align: center;
        }

        .qls-empty-icon-box {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: #E0F2FE;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 10px;
        }

        .qls-empty-state h4 {
          font-size: 15px;
          font-weight: 800;
          color: #1E293B;
          margin: 0 0 6px 0;
        }

        .qls-empty-state p {
          font-size: 12px;
          color: #64748B;
          max-width: 290px;
          margin: 0 0 14px 0;
          line-height: 1.5;
        }

        .qls-book-cta-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 16px;
          background: #00B875;
          color: #FFFFFF;
          border: none;
          border-radius: 999px;
          font-size: 12.5px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 184, 117, 0.28);
        }

        .qls-appointments-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .qls-appointment-card {
          background: #FFFFFF;
          border: 1.5px solid #E2E8F0;
          border-radius: 14px;
          padding: 13px 14px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
          transition: border-color 0.2s;
        }

        .qls-appointment-card:hover {
          border-color: #BAE6FD;
        }

        .qls-card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 11px;
        }

        .qls-doc-specialty {
          font-size: 11px;
          font-weight: 700;
          color: #0284C7;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .qls-doc-name {
          font-size: 14.5px;
          font-weight: 800;
          color: #0F172A;
          margin: 2px 0;
        }

        .qls-chamber-name {
          font-size: 12px;
          color: #64748B;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .qls-today-badge {
          background: #DCFCE7;
          color: #15803D;
          font-size: 10.5px;
          font-weight: 700;
          padding: 2.5px 8px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          gap: 4px;
          white-space: nowrap;
          border: 1px solid #BBF7D0;
        }

        .qls-counters-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-bottom: 12px;
        }

        .qls-counter-box {
          padding: 8px 4px;
          border-radius: 10px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .qls-box-your {
          background: #F0FDF4;
          border: 1px solid #BBF7D0;
        }

        .qls-box-serving {
          background: #E0F2FE;
          border: 1.5px solid #7DD3FC;
        }

        .qls-box-ahead {
          background: #FEF3C7;
          border: 1px solid #FDE68A;
        }

        .qls-counter-label {
          font-size: 10px;
          font-weight: 700;
          color: #64748B;
          margin-bottom: 2px;
          white-space: nowrap;
        }

        .qls-counter-value {
          font-size: 16px;
          font-weight: 900;
          color: #0F172A;
        }

        .qls-box-serving .qls-counter-value {
          color: #0369A1;
        }

        .qls-card-actions {
          display: flex;
          gap: 8px;
        }

        .qls-tv-btn {
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 10px;
          background: linear-gradient(135deg, #0284C7 0%, #0369A1 100%);
          color: #FFFFFF;
          border: none;
          border-radius: 9px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.15s;
        }

        .qls-tv-btn:active {
          transform: scale(0.97);
        }

        .qls-ticket-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 8px 12px;
          background: #F1F5F9;
          color: #334155;
          border: 1px solid #CBD5E1;
          border-radius: 9px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .qls-modal-footer {
          padding: 10px 16px;
          background: #F8FAFC;
          border-top: 1px solid #F1F5F9;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 11.5px;
          color: #64748B;
          text-align: center;
        }

        @media (max-width: 576px) {
          .qls-modal-overlay {
            align-items: flex-end;
            padding: 0;
          }
          .qls-modal-content {
            border-radius: 22px 22px 0 0;
            max-height: 88vh;
            animation: qlsBottomSheetSlide 0.28s cubic-bezier(0.16, 1, 0.3, 1);
          }
          @keyframes qlsBottomSheetSlide {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }
          .qls-drag-indicator {
            display: block;
            width: 38px;
            height: 4px;
            background: #CBD5E1;
            border-radius: 999px;
            margin: 8px auto 2px auto;
          }
        }
      `}</style>
    </div>,
    document.body
  )
}
