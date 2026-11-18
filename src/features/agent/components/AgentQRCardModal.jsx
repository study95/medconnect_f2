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
  MessageCircle
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { toast } from 'react-hot-toast'

export default function AgentQRCardModal({ isOpen, onClose, agentCode, agentName, agentPhone, agentPhoto }) {
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://doctorbooklet.com'
  const referralUrl = `${origin}/register/doctor?ref=${encodeURIComponent(agentCode || '')}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl)
      setCopied(true)
      toast.success('রেফারেল লিংক কপি হয়েছে!')
      setTimeout(() => setCopied(false), 2500)
    } catch (err) {
      toast.error('লিংক কপি করতে ব্যর্থ হয়েছে।')
    }
  }

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(agentCode)
      toast.success(`Agent Code (${agentCode}) কপি হয়েছে!`)
    } catch (err) {
      toast.error('কোড কপি করতে ব্যর্থ হয়েছে।')
    }
  }

  const handleWhatsAppShare = () => {
    const text = `আসসালামু আলাইকুম। আমি ডক্টরবুকলেট (DoctorBooklet)-এর অনুমোদিত ফিল্ড পার্টনার। আমাদের ডিজিটাল স্বাস্থ্যসেবা প্ল্যাটফর্মে আপনার চেম্বার যুক্ত করার জন্য এই লিংকে প্রবেশ করুন:\n\n${referralUrl}\n\nAgent Code: ${agentCode}`
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`
    window.open(waUrl, '_blank')
  }

  return (
    <div style={{
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
      padding: '20px'
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: 24,
        maxWidth: 440,
        width: '100%',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid #E2E8F0',
        animation: 'modalSlideUp 0.25s ease-out',
        position: 'relative'
      }}>
        {/* Top Gradient Header */}
        <div style={{
          background: 'linear-gradient(135deg, #065F46 0%, #047857 50%, #0D9488 100%)',
          padding: '24px 24px 20px',
          color: '#FFFFFF',
          textAlign: 'center',
          position: 'relative'
        }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '50%',
              width: 32,
              height: 32,
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background 0.15s ease'
            }}
          >
            <X size={18} />
          </button>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: 8
          }}>
            <div style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              overflow: 'hidden',
              background: '#FFFFFF',
              color: '#064E3B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              fontWeight: 900,
              border: '2.5px solid rgba(255, 255, 255, 0.9)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
              marginBottom: 10
            }}>
              {agentPhoto ? (
                <img src={agentPhoto} alt={agentName || 'Agent'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span>{agentName ? agentName.charAt(0).toUpperCase() : 'A'}</span>
              )}
            </div>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              borderRadius: 20,
              padding: '3px 12px',
              fontSize: 11,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              <ShieldCheck size={13} />
              Verified Field Identity
            </div>
          </div>

          <h3 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 900 }}>
            {agentName || 'Field Representative'}
          </h3>
          <div style={{ fontSize: 13, opacity: 0.9 }}>
            DoctorBooklet Partner Network
          </div>
        </div>

        {/* Card Body & QR Section */}
        <div style={{ padding: '24px', textAlign: 'center' }}>
          {/* Agent Code Chip */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: '#F1F5F9',
            border: '1px solid #CBD5E1',
            borderRadius: 12,
            padding: '6px 14px',
            marginBottom: 20
          }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>Code:</span>
            <span style={{ fontSize: 15, fontWeight: 900, color: '#0F172A', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
              {agentCode}
            </span>
            <button
              onClick={handleCopyCode}
              title="Copy Agent Code"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#059669',
                cursor: 'pointer',
                padding: '2px 4px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <Copy size={13} />
            </button>
          </div>

          {/* QR Code Container */}
          <div style={{
            background: '#FFFFFF',
            border: '2px dashed #10B981',
            borderRadius: 20,
            padding: '20px',
            display: 'inline-block',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
            marginBottom: 16
          }}>
            <QRCodeSVG
              value={referralUrl}
              size={180}
              level="H"
              includeMargin={true}
              imageSettings={{
                src: '/doctorBookletLogo.png',
                x: undefined,
                y: undefined,
                height: 32,
                width: 32,
                excavate: true,
              }}
            />
          </div>

          <p style={{ margin: '0 0 20px', fontSize: 12.5, color: '#64748B', lineHeight: 1.5 }}>
            ডাক্তারদের চেম্বারে সরাসরি এই কিউআর কোডটি স্ক্যান করতে বলুন অথবা নিচের বাটন দিয়ে হোয়াটসঅ্যাপে লিংক পাঠান।
          </p>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Copy Link Button */}
            <button
              onClick={handleCopy}
              style={{
                width: '100%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '12px 20px',
                borderRadius: 12,
                border: 'none',
                background: copied ? '#059669' : '#065F46',
                color: '#FFFFFF',
                fontSize: 14,
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: '0 4px 12px rgba(6, 95, 70, 0.25)'
              }}
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
              <span>{copied ? 'লিংক কপি করা হয়েছে!' : 'রেফারেল লিংক কপি করুন'}</span>
            </button>

            {/* WhatsApp Share Button */}
            <button
              onClick={handleWhatsAppShare}
              style={{
                width: '100%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '12px 20px',
                borderRadius: 12,
                border: '1.5px solid #25D366',
                background: 'rgba(37, 211, 102, 0.08)',
                color: '#128C7E',
                fontSize: 14,
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <MessageCircle size={18} color="#25D366" />
              <span>WhatsApp-এ ডাক্তারকে পাঠান</span>
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div style={{
          background: '#F8FAFC',
          borderTop: '1px solid #E2E8F0',
          padding: '12px 20px',
          fontSize: 11.5,
          color: '#94A3B8',
          textAlign: 'center'
        }}>
          Every verified registration guarantees ৳500 commission in your wallet.
        </div>
      </div>

      <style>{`
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  )
}
