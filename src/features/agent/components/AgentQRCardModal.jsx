import React, { useState } from 'react'
import { 
  X, 
  QrCode, 
  Copy, 
  Check, 
  Share2, 
  ShieldCheck, 
  Sparkles, 
  ExternalLink,
  MessageCircle,
  Printer,
  Stethoscope,
  Building2,
  Phone,
  Globe,
  Award,
  IdCard
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { toast } from 'react-hot-toast'

export default function AgentQRCardModal({ isOpen, onClose, agentCode, agentName, agentPhone, agentPhoto }) {
  const [activeTab, setActiveTab] = useState('badge') // 'badge' | 'share'
  const [copiedLink, setCopiedLink] = useState(null)

  if (!isOpen) return null

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://doctorbooklet.com'
  const smartHubUrl = `${origin}/join?ref=${encodeURIComponent(agentCode || '')}`
  const doctorUrl = `${origin}/register/doctor?ref=${encodeURIComponent(agentCode || '')}`
  const hospitalUrl = `${origin}/register/hospital?ref=${encodeURIComponent(agentCode || '')}`

  const handleCopy = async (url, key) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedLink(key)
      toast.success('লিংক সফলভাবে কপি হয়েছে!')
      setTimeout(() => setCopiedLink(null), 2500)
    } catch (err) {
      toast.error('লিংক কপি করতে ব্যর্থ হয়েছে।')
    }
  }

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(agentCode)
      setCopiedLink('code')
      toast.success(`Agent Code (${agentCode}) কপি হয়েছে!`)
      setTimeout(() => setCopiedLink(null), 2500)
    } catch (err) {
      toast.error('কোড কপি করতে ব্যর্থ হয়েছে।')
    }
  }

  const handleWhatsAppShare = () => {
    const text = `আসসালামু আলাইকুম। আমি ডক্টরবুকলেট (DoctorBooklet)-এর অনুমোদিত ফিল্ড পার্টনার। আমাদের ডিজিটাল প্ল্যাটফর্মে আপনার চেম্বার বা হাসপাতাল যুক্ত করতে এই কিউআর লিংকটি ব্যবহার করুন:\n\n${smartHubUrl}\n\nফিল্ড পার্টনার কোড: ${agentCode}`
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`
    window.open(waUrl, '_blank')
  }

  const handlePrint = () => {
    // If not already on badge tab, switch to badge tab first
    if (activeTab !== 'badge') {
      setActiveTab('badge')
      setTimeout(() => window.print(), 100)
    } else {
      window.print()
    }
  }

  return (
    <div 
      className="agent-qr-modal-backdrop"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '16px',
        overflowY: 'auto'
      }}
    >
      <div 
        className="agent-qr-modal-container no-print-bg"
        style={{
          background: '#FFFFFF',
          borderRadius: 24,
          maxWidth: 480,
          width: '100%',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          border: '1px solid #E2E8F0',
          position: 'relative',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Modal Top Navigation Bar (Hidden during print) */}
        <div 
          className="no-print"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid #F1F5F9',
            background: '#FAFAFA'
          }}
        >
          {/* Tab Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#E2E8F0', padding: 3, borderRadius: 12 }}>
            <button
              type="button"
              onClick={() => setActiveTab('badge')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 9,
                fontSize: 12.5,
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
                background: activeTab === 'badge' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'badge' ? '#0F172A' : '#64748B',
                boxShadow: activeTab === 'badge' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <IdCard size={15} color={activeTab === 'badge' ? '#059669' : '#64748B'} />
              <span>আইডি কার্ড ব্যাজ</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('share')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 9,
                fontSize: 12.5,
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
                background: activeTab === 'share' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'share' ? '#0F172A' : '#64748B',
                boxShadow: activeTab === 'share' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <Share2 size={15} color={activeTab === 'share' ? '#059669' : '#64748B'} />
              <span>লিংক ও শেয়ার</span>
            </button>
          </div>

          <button
            onClick={onClose}
            type="button"
            style={{
              background: '#F1F5F9',
              border: 'none',
              borderRadius: '50%',
              width: 32,
              height: 32,
              color: '#64748B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background 0.15s ease'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {activeTab === 'badge' ? (
            <div>
              {/* ═════════════════════════════════════════════════════════
                  PRINTABLE ID BADGE (CR80 Standard Ratio: 54mm x 86mm)
                 ═════════════════════════════════════════════════════════ */}
              <div 
                className="printable-id-card-wrap"
                style={{
                  width: '320px',
                  margin: '0 auto',
                  background: '#FFFFFF',
                  borderRadius: 20,
                  overflow: 'hidden',
                  border: '1.5px solid #CBD5E1',
                  boxShadow: '0 12px 30px -8px rgba(0, 0, 0, 0.12)',
                  position: 'relative'
                }}
              >
                {/* Lanyard Hole Slot Notch Indicator */}
                <div style={{
                  background: '#064E3B',
                  paddingTop: 10,
                  display: 'flex',
                  justifyContent: 'center'
                }}>
                  <div style={{
                    width: 36,
                    height: 6,
                    borderRadius: 3,
                    background: 'rgba(255, 255, 255, 0.25)',
                    border: '1px solid rgba(255, 255, 255, 0.35)'
                  }} />
                </div>

                {/* Badge Header Bar */}
                <div style={{
                  background: 'linear-gradient(135deg, #064E3B 0%, #047857 50%, #0D9488 100%)',
                  padding: '12px 16px 16px',
                  color: '#FFFFFF',
                  textAlign: 'center',
                  position: 'relative'
                }}>
                  {/* Brand Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 4 }}>
                    <div style={{
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      background: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Stethoscope size={14} color="#059669" />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 900, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                      DOCTOR BOOKLET
                    </span>
                  </div>

                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    background: 'rgba(255, 255, 255, 0.18)',
                    backdropFilter: 'blur(8px)',
                    padding: '2px 8px',
                    borderRadius: 12,
                    fontSize: 9.5,
                    fontWeight: 800,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    color: '#A7F3D0'
                  }}>
                    <ShieldCheck size={11} color="#6EE7B7" />
                    <span>Official Field Partner</span>
                  </div>
                </div>

                {/* Badge Agent Profile Segment */}
                <div style={{
                  textAlign: 'center',
                  padding: '0 16px',
                  marginTop: -26,
                  position: 'relative',
                  zIndex: 2
                }}>
                  {/* Photo with Emerald Border */}
                  <div style={{
                    width: 62,
                    height: 62,
                    borderRadius: '50%',
                    overflow: 'hidden',
                    background: '#FFFFFF',
                    color: '#064E3B',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                    fontWeight: 900,
                    border: '3px solid #FFFFFF',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    position: 'relative'
                  }}>
                    {agentPhoto ? (
                      <img src={agentPhoto} alt={agentName || 'Agent'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span>{agentName ? agentName.charAt(0).toUpperCase() : 'A'}</span>
                    )}
                  </div>

                  <h3 style={{ margin: '6px 0 2px', fontSize: 16, fontWeight: 900, color: '#0F172A' }}>
                    {agentName || 'Field Partner'}
                  </h3>

                  <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', marginBottom: 8 }}>
                    অনুমোদিত ফিল্ড প্রতিনিধি
                  </div>

                  {/* Agent Code Chip */}
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: '#F1F5F9',
                    border: '1px solid #CBD5E1',
                    borderRadius: 8,
                    padding: '3px 10px',
                    marginBottom: 10
                  }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Agent Code:</span>
                    <span style={{ fontSize: 13, fontWeight: 900, color: '#0F172A', fontFamily: 'monospace', letterSpacing: '0.04em' }}>
                      {agentCode}
                    </span>
                  </div>
                </div>

                {/* Badge High-Resolution QR Code */}
                <div style={{ padding: '0 16px 14px', textAlign: 'center' }}>
                  <div style={{
                    background: '#FFFFFF',
                    border: '2px dashed #059669',
                    borderRadius: 16,
                    padding: '12px',
                    display: 'inline-block',
                    boxShadow: '0 2px 10px rgba(5, 150, 105, 0.08)'
                  }}>
                    <QRCodeSVG
                      value={smartHubUrl}
                      size={150}
                      level="H"
                      includeMargin={false}
                      imageSettings={{
                        src: '/doctorBookletLogo.png',
                        x: undefined,
                        y: undefined,
                        height: 28,
                        width: 28,
                        excavate: true,
                      }}
                    />
                  </div>

                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#0F172A' }}>
                      ডাক্তার ও হাসপাতাল অনবোর্ডিং
                    </div>
                    <div style={{ fontSize: 10.5, color: '#64748B', marginTop: 1 }}>
                      ক্যামেরা দিয়ে স্ক্যান করে সরাসরি যুক্ত হোন
                    </div>
                  </div>
                </div>

                {/* Badge Bottom Security Stripe & Contact */}
                <div style={{
                  background: '#F8FAFC',
                  borderTop: '1px solid #E2E8F0',
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: 9.5,
                  color: '#64748B'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Globe size={11} color="#059669" />
                    <span>doctorbooklet.com</span>
                  </div>
                  {agentPhone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'monospace', fontWeight: 600 }}>
                      <Phone size={10} color="#059669" />
                      <span>{agentPhone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons (Hidden on Print) */}
              <div className="no-print" style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 9 }}>
                {/* Print Button */}
                <button
                  type="button"
                  onClick={handlePrint}
                  style={{
                    width: '100%',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '12px 20px',
                    borderRadius: 12,
                    border: 'none',
                    background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                    color: '#FFFFFF',
                    fontSize: 14,
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.25)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Printer size={17} color="#6EE7B7" />
                  <span>প্রিন্ট আইডি কার্ড (Print ID Badge)</span>
                </button>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
                  {/* Copy Link */}
                  <button
                    type="button"
                    onClick={() => handleCopy(smartHubUrl, 'hub')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: '1.5px solid #CBD5E1',
                      background: copiedLink === 'hub' ? '#ECFDF5' : '#FFFFFF',
                      color: copiedLink === 'hub' ? '#059669' : '#334155',
                      fontSize: 12.5,
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {copiedLink === 'hub' ? <Check size={15} color="#059669" /> : <Copy size={15} />}
                    <span>{copiedLink === 'hub' ? 'কপি হয়েছে' : 'লিংক কপি'}</span>
                  </button>

                  {/* WhatsApp */}
                  <button
                    type="button"
                    onClick={handleWhatsAppShare}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: '1.5px solid #25D366',
                      background: 'rgba(37, 211, 102, 0.08)',
                      color: '#128C7E',
                      fontSize: 12.5,
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <MessageCircle size={15} color="#25D366" />
                    <span>WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* ═════════════════════════════════════════════════════════
                TAB 2: DIRECT LINKS & REFERRAL DETAILS
               ═════════════════════════════════════════════════════════ */
            <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Agent Code Card */}
              <div style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 14,
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>আপনার পার্টনার কোড</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', fontFamily: 'monospace', letterSpacing: '0.04em' }}>
                    {agentCode}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 8,
                    background: copiedLink === 'code' ? '#059669' : '#0F172A',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5
                  }}
                >
                  {copiedLink === 'code' ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedLink === 'code' ? 'কপি হয়েছে' : 'কপি'}</span>
                </button>
              </div>

              {/* Smart Hub Link */}
              <div style={{
                background: '#FFFFFF',
                border: '1.5px solid #A7F3D0',
                borderRadius: 14,
                padding: '14px 16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#065F46', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Sparkles size={14} color="#059669" />
                    <span>স্মার্ট অনবোর্ডিং হাব লিংক (কিউআর লিংক)</span>
                  </div>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: '#059669', background: '#ECFDF5', padding: '2px 8px', borderRadius: 6 }}>
                    ডাক্তার + হাসপাতাল
                  </span>
                </div>
                <div style={{
                  fontSize: 12,
                  color: '#475569',
                  fontFamily: 'monospace',
                  background: '#F8FAFC',
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: '1px solid #E2E8F0',
                  wordBreak: 'break-all',
                  marginBottom: 10
                }}>
                  {smartHubUrl}
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(smartHubUrl, 'hub')}
                  style={{
                    width: '100%',
                    padding: '9px',
                    borderRadius: 8,
                    background: copiedLink === 'hub' ? '#059669' : '#065F46',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6
                  }}
                >
                  {copiedLink === 'hub' ? <Check size={14} /> : <Copy size={14} />}
                  <span>স্মার্ট হাব লিংক কপি করুন</span>
                </button>
              </div>

              {/* Direct Doctor Registration Link */}
              <div style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: 14,
                padding: '12px 14px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Stethoscope size={14} color="#0284c7" />
                    <span>শুধুমাত্র ডাক্তার সেলফ-রেজিস্ট্রেশন লিংক</span>
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#0284c7' }}>৳৫০০ কমিশন</span>
                </div>
                <div style={{ fontSize: 11, color: '#64748B', fontFamily: 'monospace', background: '#F8FAFC', padding: '6px 8px', borderRadius: 6, wordBreak: 'break-all', marginBottom: 8 }}>
                  {doctorUrl}
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(doctorUrl, 'doctor')}
                  style={{
                    width: '100%',
                    padding: '7px',
                    borderRadius: 6,
                    background: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    color: '#334155',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 5
                  }}
                >
                  {copiedLink === 'doctor' ? <Check size={13} color="#059669" /> : <Copy size={13} />}
                  <span>ডাক্তার লিংক কপি</span>
                </button>
              </div>

              {/* Direct Hospital Registration Link */}
              <div style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: 14,
                padding: '12px 14px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Building2 size={14} color="#10B981" />
                    <span>শুধুমাত্র হাসপাতাল সেলফ-রেজিস্ট্রেশন লিংক</span>
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#10B981' }}>৳১,৫০০ কমিশন</span>
                </div>
                <div style={{ fontSize: 11, color: '#64748B', fontFamily: 'monospace', background: '#F8FAFC', padding: '6px 8px', borderRadius: 6, wordBreak: 'break-all', marginBottom: 8 }}>
                  {hospitalUrl}
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(hospitalUrl, 'hospital')}
                  style={{
                    width: '100%',
                    padding: '7px',
                    borderRadius: 6,
                    background: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    color: '#334155',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 5
                  }}
                >
                  {copiedLink === 'hospital' ? <Check size={13} color="#059669" /> : <Copy size={13} />}
                  <span>হাসপাতাল লিংক কপি</span>
                </button>
              </div>

              {/* WhatsApp Share Full */}
              <button
                type="button"
                onClick={handleWhatsAppShare}
                style={{
                  width: '100%',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '11px',
                  borderRadius: 10,
                  border: '1.5px solid #25D366',
                  background: 'rgba(37, 211, 102, 0.08)',
                  color: '#128C7E',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <MessageCircle size={17} color="#25D366" />
                <span>WhatsApp-এ ডাক্তার/হাসপাতালকে মেসেজ পাঠান</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer info (Hidden on Print) */}
        <div 
          className="no-print"
          style={{
            background: '#F8FAFC',
            borderTop: '1px solid #E2E8F0',
            padding: '10px 16px',
            fontSize: 11.5,
            color: '#64748B',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12
          }}
        >
          <span>ডাক্তার ভেরিফিকেশনে <strong>৳৫০০</strong></span>
          <span>•</span>
          <span>হাসপাতাল ভেরিফিকেশনে <strong>৳১,৫০০</strong></span>
        </div>
      </div>

      {/* ── Strict Print CSS Rules ── */}
      <style>{`
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @media print {
          /* Hide everything in the application */
          body * {
            visibility: hidden !important;
          }

          /* Only show the ID card */
          .printable-id-card-wrap,
          .printable-id-card-wrap * {
            visibility: visible !important;
          }

          .printable-id-card-wrap {
            position: fixed !important;
            left: 50% !important;
            top: 20mm !important;
            transform: translateX(-50%) !important;
            width: 72mm !important;
            max-width: 72mm !important;
            margin: 0 !important;
            padding: 0 !important;
            border: 1px solid #94A3B8 !important;
            border-radius: 14px !important;
            box-shadow: none !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            z-index: 99999999 !important;
            background: #FFFFFF !important;
          }

          /* Guarantee all UI chrome is stripped */
          .no-print,
          .agent-qr-modal-backdrop,
          .agent-qr-modal-container {
            background: transparent !important;
            box-shadow: none !important;
            border: none !important;
          }

          @page {
            size: A4 portrait;
            margin: 10mm;
          }
        }
      `}</style>
    </div>
  )
}
