import React, { useState, useRef, useEffect } from 'react'
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
  Download,
  Loader2,
  Stethoscope,
  Building2,
  Phone,
  Globe,
  Award,
  IdCard
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { toast } from 'react-hot-toast'
import axiosInstance from '../../../api/axiosInstance'
import { escapeHtml } from '../../../utils/sanitizeHtml'

export default function AgentQRCardModal({ isOpen, onClose, agentCode, agentName, agentPhone, agentPhoto }) {
  const [activeTab, setActiveTab] = useState('badge') // 'badge' | 'share'
  const [printSize, setPrintSize] = useState('65mm') // '54mm' (CR80) | '65mm' (Medium Pouch) | '75mm' (Large)
  const [isPrinting, setIsPrinting] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [copiedLink, setCopiedLink] = useState(null)
  const [photoBase64, setPhotoBase64] = useState('')
  const cardRef = useRef(null)
  const bodyRef = useRef(null)

  // Reset scroll to top on open or tab change
  useEffect(() => {
    if (isOpen && bodyRef.current) {
      bodyRef.current.scrollTop = 0
    }
  }, [isOpen, activeTab])

  // Pre-load base64 photo for 100% reliable zero-CORS canvas snapshot and offline printing
  useEffect(() => {
    if (!isOpen) return
    let isMounted = true

    if (agentPhoto && agentPhoto.startsWith('data:')) {
      setPhotoBase64(agentPhoto)
      return
    }

    if (agentCode) {
      axiosInstance
        .get(`/public/partner/${agentCode}`)
        .then((res) => {
          if (isMounted && res?.data?.data?.photo_base64) {
            setPhotoBase64(res.data.data.photo_base64)
          }
        })
        .catch(() => {
          if (agentPhoto) {
            fetch(agentPhoto)
              .then((r) => r.blob())
              .then((blob) => {
                const reader = new FileReader()
                reader.onloadend = () => {
                  if (isMounted && reader.result) {
                    setPhotoBase64(reader.result)
                  }
                }
                reader.readAsDataURL(blob)
              })
              .catch(() => {})
          }
        })
    }
    return () => {
      isMounted = false
    }
  }, [isOpen, agentCode, agentPhoto])

  if (!isOpen) return null

  const displayPhoto = photoBase64 || agentPhoto

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
    window.open(waUrl, '_blank', 'noopener,noreferrer')
  }

  const handlePrint = () => {
    // If not already on badge tab, switch to badge tab first
    if (activeTab !== 'badge') {
      setActiveTab('badge')
    }

    if (!cardRef.current) return
    setIsPrinting(true)

    // Calculate dimensions & proportional scale based on 320px base width
    let cardWidthMm = '65mm'
    let cardHeightMm = '103mm'
    let scale = 0.768

    if (printSize === '54mm') {
      cardWidthMm = '54mm'
      cardHeightMm = '86mm'
      scale = 0.638
    } else if (printSize === '75mm') {
      cardWidthMm = '75mm'
      cardHeightMm = '119mm'
      scale = 0.886
    }

    const cardInnerHtml = cardRef.current.innerHTML

    const printHtml = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Agent ID Badge - ${escapeHtml(agentCode || 'Official')}</title>
    <style>
      @page {
        size: A4 portrait;
        margin: 0;
      }
      * {
        box-sizing: border-box;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      html, body {
        margin: 0;
        padding: 0;
        background: #FFFFFF;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        padding-top: 15mm;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      }
      .print-box-outer {
        display: flex;
        flex-direction: column;
        align-items: center;
        page-break-inside: avoid;
        break-inside: avoid;
      }
      .card-scale-wrapper {
        width: ${cardWidthMm};
        height: ${cardHeightMm};
        overflow: hidden;
        border: 1.5px dashed #475569;
        border-radius: 12px;
        position: relative;
        background: #FFFFFF;
        box-shadow: none;
        page-break-inside: avoid;
        break-inside: avoid;
      }
      .card-scale-inner {
        width: 320px;
        transform: scale(${scale});
        transform-origin: top left;
        background: #FFFFFF;
      }
      .card-scale-inner img {
        image-rendering: -webkit-optimize-contrast;
      }
      .cut-guide-text {
        margin-top: 6mm;
        font-size: 11px;
        font-weight: 600;
        color: #64748B;
        text-align: center;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
    </style>
  </head>
  <body>
    <div class="print-box-outer">
      <div class="card-scale-wrapper">
        <div class="card-scale-inner">
          ${cardInnerHtml}
        </div>
      </div>
      <div class="cut-guide-text">
        ✂ ড্যাশড বর্ডার বরাবর কেটে প্লাস্টিক আইডি কার্ড হোল্ডারে রাখুন (${cardWidthMm})
      </div>
    </div>
    <script>
      window.onload = function() {
        setTimeout(function() {
          window.focus();
          window.print();
        }, 350);
      };
    </script>
  </body>
</html>`

    const printWin = window.open('', '_blank', 'width=780,height=900,menubar=no,toolbar=no,location=no,status=no')
    if (printWin) {
      printWin.document.open()
      printWin.document.write(printHtml)
      printWin.document.close()
      setIsPrinting(false)
    } else {
      let iframe = document.getElementById('agent-id-card-print-frame')
      if (!iframe) {
        iframe = document.createElement('iframe')
        iframe.id = 'agent-id-card-print-frame'
        iframe.style.position = 'fixed'
        iframe.style.top = '-9999px'
        iframe.style.left = '-9999px'
        iframe.style.width = '0px'
        iframe.style.height = '0px'
        iframe.style.border = 'none'
        document.body.appendChild(iframe)
      }
      const doc = iframe.contentWindow.document
      doc.open()
      doc.write(printHtml)
      doc.close()
      setTimeout(() => {
        iframe.contentWindow.focus()
        iframe.contentWindow.print()
        setIsPrinting(false)
      }, 500)
    }
  }

  const handleDownloadHD = async () => {
    if (activeTab !== 'badge') {
      setActiveTab('badge')
      await new Promise(r => setTimeout(r, 150))
    }

    if (!cardRef.current) return
    setIsDownloading(true)
    const toastId = toast.loading('১০০% এইচডি আইডি কার্ড ইমেজ ডাউনলোড হচ্ছে...')

    try {
      // Ensure base64 photo is loaded for zero-CORS snapshot
      let activePhoto = photoBase64
      if (!activePhoto && agentCode) {
        try {
          const res = await axiosInstance.get(`/public/partner/${agentCode}`)
          if (res?.data?.data?.photo_base64) {
            activePhoto = res.data.data.photo_base64
            setPhotoBase64(activePhoto)
          }
        } catch (e) {
          // ignore
        }
      }

      // Wait for all images inside the card to be fully loaded
      const cardElement = cardRef.current
      const imgElements = cardElement.querySelectorAll('img')
      await Promise.all(
        Array.from(imgElements).map((img) => {
          if (img.complete) return Promise.resolve()
          return new Promise((resolve) => {
            img.onload = resolve
            img.onerror = resolve
          })
        })
      )

      const { default: html2canvas } = await import('html2canvas')
      const rawCanvas = await html2canvas(cardElement, {
        scale: 3, // 300 DPI Ultra-HD
        useCORS: true,
        allowTaint: false,
        backgroundColor: null, // Transparent base so outer corners don't get filled with white
        logging: false,
        imageTimeout: 15000,
      })

      // Create a smooth clipped canvas to eliminate any outer corner bleeding (100% transparent rounded corners)
      const outputCanvas = document.createElement('canvas')
      outputCanvas.width = rawCanvas.width
      outputCanvas.height = rawCanvas.height
      const ctx = outputCanvas.getContext('2d')

      // Card borderRadius is 20px, with scale: 3 -> radius is 60px
      const radius = 20 * 3
      const w = outputCanvas.width
      const h = outputCanvas.height

      ctx.clearRect(0, 0, w, h)
      ctx.beginPath()
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(0, 0, w, h, radius)
      } else {
        ctx.moveTo(radius, 0)
        ctx.lineTo(w - radius, 0)
        ctx.quadraticCurveTo(w, 0, w, radius)
        ctx.lineTo(w, h - radius)
        ctx.quadraticCurveTo(w, h, w - radius, h)
        ctx.lineTo(radius, h)
        ctx.quadraticCurveTo(0, h, 0, h - radius)
        ctx.lineTo(0, radius)
        ctx.quadraticCurveTo(0, 0, radius, 0)
        ctx.closePath()
      }
      ctx.clip()
      ctx.drawImage(rawCanvas, 0, 0)

      const dataUrl = outputCanvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.download = `Agent-ID-Card-${agentCode || 'Partner'}.png`
      link.href = dataUrl
      link.click()

      toast.dismiss(toastId)
      toast.success('এইচডি আইডি কার্ড ইমেজ ডাউনলোড সম্পন্ন!')
      setIsDownloading(false)
    } catch (err) {
      console.error('Download error:', err)
      toast.dismiss(toastId)
      toast.error('ডাউনলোড করতে ব্যর্থ হয়েছে।')
      setIsDownloading(false)
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
          className="no-print agent-qr-header-bar"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            borderBottom: '1px solid #E2E8F0',
            background: '#FFFFFF',
            position: 'relative',
            zIndex: 10
          }}
        >
          {/* Tab Selector */}
          <div className="agent-qr-tabs" style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F1F5F9', padding: 4, borderRadius: 12, border: '1px solid #E2E8F0' }}>
            <button
              type="button"
              className="agent-qr-tab-btn"
              onClick={() => setActiveTab('badge')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 16px',
                borderRadius: 9,
                fontSize: 13,
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
                background: activeTab === 'badge' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'badge' ? '#0F172A' : '#64748B',
                boxShadow: activeTab === 'badge' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <IdCard size={15} color={activeTab === 'badge' ? '#059669' : '#64748B'} />
              <span>আইডি কার্ড ব্যাজ</span>
            </button>

            <button
              type="button"
              className="agent-qr-tab-btn"
              onClick={() => setActiveTab('share')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 16px',
                borderRadius: 9,
                fontSize: 13,
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
                background: activeTab === 'share' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'share' ? '#0F172A' : '#64748B',
                boxShadow: activeTab === 'share' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
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
            title="বন্ধ করুন"
            style={{
              background: '#F1F5F9',
              border: 'none',
              borderRadius: '50%',
              width: 34,
              height: 34,
              color: '#64748B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              marginLeft: 8,
              flexShrink: 0,
              transition: 'background 0.15s ease'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div ref={bodyRef} className="agent-qr-modal-body" style={{ padding: '20px', overflowY: 'auto', flex: 1, WebkitOverflowScrolling: 'touch' }}>
          {activeTab === 'badge' ? (
            <div>
              {/* ═════════════════════════════════════════════════════════
                  PRINTABLE ID BADGE (CR80 Standard Ratio: 54mm x 86mm)
                 ═════════════════════════════════════════════════════════ */}
              <div 
                ref={cardRef}
                id="printable-agent-id-card"
                className={`printable-id-card-wrap print-size-${printSize}`}
                style={{
                  width: '320px',
                  maxWidth: '100%',
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
                  background: 'linear-gradient(135deg, #064E3B 0%, #047857 100%)',
                  paddingTop: 8,
                  paddingBottom: 6,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <div style={{
                    width: 38,
                    height: 5,
                    borderRadius: 3,
                    background: 'rgba(255, 255, 255, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.6)'
                  }} />
                </div>

                {/* Badge Header Bar */}
                <div style={{
                  background: 'linear-gradient(180deg, #FFFFFF 0%, #F0FDF4 55%, #DCFCE7 100%)',
                  padding: '10px 14px 44px',
                  textAlign: 'center',
                  position: 'relative',
                  borderBottom: '1px solid #E2E8F0'
                }}>
                  {/* Brand Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 5 }}>
                    <img 
                      src="/doctorBookletLogo.png" 
                      alt="Doctor Booklet" 
                      style={{ height: 30, width: 'auto', maxWidth: '80%', objectFit: 'contain' }} 
                    />
                  </div>

                  <div style={{
                    display: 'inline-block',
                    textAlign: 'center',
                    verticalAlign: 'middle',
                    background: '#047857',
                    padding: '3px 12px',
                    borderRadius: 10,
                    boxShadow: '0 2px 4px rgba(4, 120, 87, 0.2)',
                    lineHeight: '14px',
                    whiteSpace: 'nowrap'
                  }}>
                    <span style={{
                      display: 'inline-block',
                      verticalAlign: 'middle',
                      marginRight: 4,
                      lineHeight: 1
                    }}>
                      <ShieldCheck size={11} color="#A7F3D0" />
                    </span>
                    <span style={{
                      display: 'inline-block',
                      verticalAlign: 'middle',
                      fontSize: 9,
                      fontWeight: 800,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      color: '#FFFFFF',
                      lineHeight: '14px'
                    }}>
                      Official Field Partner
                    </span>
                  </div>
                </div>

                {/* Badge Agent Profile Segment */}
                <div style={{
                  textAlign: 'center',
                  padding: '0 16px',
                  marginTop: -38,
                  position: 'relative',
                  zIndex: 2
                }}>
                  {/* Photo with Emerald Border */}
                  <div 
                    className="agent-photo-box"
                    style={{
                      width: 76,
                      height: 76,
                      borderRadius: '50%',
                      overflow: 'hidden',
                      background: '#FFFFFF',
                      color: '#064E3B',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 28,
                      fontWeight: 900,
                      border: '3.5px solid #FFFFFF',
                      boxShadow: '0 4px 14px rgba(0, 0, 0, 0.16)',
                      position: 'relative'
                    }}
                  >
                    {displayPhoto ? (
                      <img 
                        src={displayPhoto} 
                        alt={agentName || 'Agent'} 
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover', 
                          objectPosition: 'center 15%' 
                        }} 
                      />
                    ) : (
                      <span>{agentName ? agentName.charAt(0).toUpperCase() : 'A'}</span>
                    )}
                  </div>

                  <h3 style={{ margin: '6px 0 2px', fontSize: 16, fontWeight: 900, color: '#0F172A' }}>
                    {agentName || 'Field Partner'}
                  </h3>

                  <div style={{ fontSize: 10.5, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>
                    অনুমোদিত ফিল্ড প্রতিনিধি
                  </div>

                  {/* Agent Code Chip */}
                  <div style={{
                    display: 'inline-block',
                    textAlign: 'center',
                    verticalAlign: 'middle',
                    background: '#F1F5F9',
                    border: '1px solid #CBD5E1',
                    borderRadius: 7,
                    padding: '3px 12px',
                    marginBottom: 8,
                    lineHeight: '16px',
                    whiteSpace: 'nowrap'
                  }}>
                    <span style={{
                      display: 'inline-block',
                      verticalAlign: 'middle',
                      fontSize: 9.5,
                      fontWeight: 700,
                      color: '#64748B',
                      textTransform: 'uppercase',
                      marginRight: 5,
                      lineHeight: '16px'
                    }}>
                      Agent Code:
                    </span>
                    <span style={{
                      display: 'inline-block',
                      verticalAlign: 'middle',
                      fontSize: 12,
                      fontWeight: 900,
                      color: '#0F172A',
                      fontFamily: 'monospace',
                      letterSpacing: '0.04em',
                      lineHeight: '16px'
                    }}>
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
                    boxShadow: '0 2px 10px rgba(5, 150, 105, 0.08)',
                    position: 'relative'
                  }}>
                    <QRCodeSVG
                      value={smartHubUrl}
                      size={150}
                      level="H"
                      includeMargin={false}
                      imageSettings={{
                        src: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
                        height: 34,
                        width: 34,
                        excavate: true,
                      }}
                    />

                    {/* Centered Favicon Overlay (100% compatible with html2canvas and print) */}
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: 34,
                      height: 34,
                      background: '#FFFFFF',
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 2,
                      boxShadow: '0 1px 4px rgba(0, 0, 0, 0.15)'
                    }}>
                      <img 
                        src="/favicon.png" 
                        alt="DoctorBooklet" 
                        style={{
                          width: 26,
                          height: 26,
                          objectFit: 'contain',
                          display: 'block'
                        }} 
                      />
                    </div>
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
                  background: 'linear-gradient(135deg, #064E3B 0%, #047857 100%)',
                  padding: '9px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: 10,
                  color: '#FFFFFF'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Globe size={11.5} color="#6EE7B7" style={{ marginRight: 5 }} />
                    <span style={{ color: '#FFFFFF', fontWeight: 600, letterSpacing: '0.02em' }}>doctorbooklet.com</span>
                  </div>
                  {agentPhone && (
                    <div style={{ display: 'flex', alignItems: 'center', fontFamily: 'monospace', fontWeight: 700 }}>
                      <Phone size={10.5} color="#6EE7B7" style={{ marginRight: 5 }} />
                      <span style={{ color: '#FFFFFF', letterSpacing: '0.03em' }}>{agentPhone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons (Hidden on Print) */}
              <div className="no-print" style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Print Size Selector */}
                <div style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: 14,
                  padding: '10px 12px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 7,
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#334155'
                  }}>
                    <span>প্রিন্ট সাইজ নির্ধারণ:</span>
                    <span style={{ fontSize: 11, color: '#059669', fontWeight: 800 }}>
                      {printSize === '54mm' ? '৫৪ মিমি (স্ট্যান্ডার্ড CR80 / NID সাইজ)' : printSize === '65mm' ? '৬৫ মিমি (মাঝারি পাউচ)' : '৭৫ মিমি (বড় সাইজ)'}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                    {[
                      { id: '54mm', label: 'স্ট্যান্ডার্ড NID', sub: '54 × 86 mm' },
                      { id: '65mm', label: 'মাঝারি পাউচ', sub: '65 × 100 mm' },
                      { id: '75mm', label: 'লার্জ ব্যাজ', sub: '75 × 115 mm' }
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setPrintSize(opt.id)}
                        style={{
                          padding: '7px 4px',
                          borderRadius: 9,
                          border: printSize === opt.id ? '2px solid #059669' : '1px solid #CBD5E1',
                          background: printSize === opt.id ? '#ECFDF5' : '#FFFFFF',
                          color: printSize === opt.id ? '#065F46' : '#64748B',
                          cursor: 'pointer',
                          textAlign: 'center',
                          boxShadow: printSize === opt.id ? '0 1px 4px rgba(5, 150, 105, 0.15)' : 'none',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ fontSize: 11, fontWeight: printSize === opt.id ? 800 : 700 }}>
                          {opt.label}
                        </div>
                        <div style={{ fontSize: 9.5, opacity: 0.85, marginTop: 1 }}>
                          {opt.sub}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Print and Download HD Buttons */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 9 }}>
                  <button
                    type="button"
                    onClick={handlePrint}
                    disabled={isPrinting}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 7,
                      padding: '11px 14px',
                      borderRadius: 12,
                      border: 'none',
                      background: 'linear-gradient(135deg, #065F46 0%, #047857 100%)',
                      color: '#FFFFFF',
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: isPrinting ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 12px rgba(6, 95, 70, 0.25)',
                      opacity: isPrinting ? 0.7 : 1,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {isPrinting ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} color="#A7F3D0" />}
                    <span>{isPrinting ? 'প্রিন্ট হচ্ছে...' : `প্রিন্ট এইচডি (${printSize})`}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadHD}
                    disabled={isDownloading}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 7,
                      padding: '11px 14px',
                      borderRadius: 12,
                      border: '1.5px solid #CBD5E1',
                      background: '#FFFFFF',
                      color: '#0F172A',
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: isDownloading ? 'not-allowed' : 'pointer',
                      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)',
                      opacity: isDownloading ? 0.7 : 1,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {isDownloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} color="#059669" />}
                    <span>{isDownloading ? 'ডাউনলোড হচ্ছে...' : 'এইচডি ইমেজ (PNG)'}</span>
                  </button>
                </div>

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
          className="no-print agent-qr-modal-footer"
          style={{
            background: '#F8FAFC',
            borderTop: '1px solid #E2E8F0',
            padding: '11px 16px',
            fontSize: 12,
            color: '#475569',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            flexWrap: 'wrap'
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00B875', display: 'inline-block' }}></span>
            ডাক্তার ভেরিফিকেশনে <strong style={{ color: '#0F172A', fontWeight: 800 }}>৳৫০০</strong>
          </span>
          <span style={{ color: '#CBD5E1' }}>|</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#0284C7', display: 'inline-block' }}></span>
            হাসপাতাল ভেরিফিকেশনে <strong style={{ color: '#0F172A', fontWeight: 800 }}>৳১,৫০০</strong>
          </span>
        </div>
      </div>

      {/* ── Strict Print CSS Rules ── */}
      <style>{`
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @media screen and (max-width: 640px) {
          .agent-qr-modal-backdrop {
            padding: 0 !important;
            align-items: stretch !important;
            justify-content: stretch !important;
          }
          .agent-qr-modal-container {
            max-width: 100% !important;
            width: 100% !important;
            height: 100% !important;
            height: 100dvh !important;
            max-height: 100% !important;
            max-height: 100dvh !important;
            border-radius: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
          .agent-qr-header-bar {
            padding: 12px 14px !important;
            background: #FFFFFF !important;
            border-bottom: 1px solid #E2E8F0 !important;
            position: sticky !important;
            top: 0 !important;
            z-index: 10 !important;
          }
          .agent-qr-tabs {
            flex: 1 !important;
          }
          .agent-qr-tab-btn {
            flex: 1 !important;
            justify-content: center !important;
            padding: 7px 6px !important;
            font-size: 12px !important;
          }
          .agent-qr-modal-body {
            padding: 14px 12px 24px !important;
            -webkit-overflow-scrolling: touch;
          }
          .printable-id-card-wrap {
            max-width: 320px !important;
            width: 100% !important;
          }
          .agent-qr-modal-footer {
            padding: 10px 14px calc(14px + env(safe-area-inset-bottom, 0px)) !important;
            font-size: 11.5px !important;
            gap: 8px !important;
          }
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }

          /* Strip all page backgrounds & set full overflow */
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            height: auto !important;
            background: #FFFFFF !important;
          }

          /* Hide everything in the application */
          body * {
            visibility: hidden !important;
          }

          /* Only show the ID card */
          .printable-id-card-wrap,
          .printable-id-card-wrap * {
            visibility: visible !important;
          }

          /* Force all modal parents to NEVER clip or hide content */
          .agent-qr-modal-backdrop {
            position: static !important;
            display: block !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            height: auto !important;
            min-height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            background: transparent !important;
            backdrop-filter: none !important;
            inset: auto !important;
          }

          .agent-qr-modal-container {
            position: static !important;
            display: block !important;
            background: transparent !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          .agent-qr-modal-container > div {
            overflow: visible !important;
            max-height: none !important;
            height: auto !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          .printable-id-card-wrap {
            display: block !important;
            position: relative !important;
            margin: 10mm auto !important;
            border: 1.5px dashed #475569 !important;
            box-shadow: none !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            z-index: 99999999 !important;
            background: #FFFFFF !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            overflow: hidden !important;
          }

          /* ── 54mm (Exact Standard CR80 / NID Size) ── */
          .printable-id-card-wrap.print-size-54mm {
            width: 56mm !important;
            max-width: 56mm !important;
            border-radius: 9px !important;
          }
          .printable-id-card-wrap.print-size-54mm .agent-photo-box {
            width: 18mm !important;
            height: 18mm !important;
            min-width: 18mm !important;
            min-height: 18mm !important;
            margin-top: -9mm !important;
          }
          .printable-id-card-wrap.print-size-54mm svg {
            max-width: 30mm !important;
            max-height: 30mm !important;
          }

          /* ── 65mm (Standard Lanyard Pouch Size) ── */
          .printable-id-card-wrap.print-size-65mm {
            width: 68mm !important;
            max-width: 68mm !important;
            border-radius: 11px !important;
          }
          .printable-id-card-wrap.print-size-65mm .agent-photo-box {
            width: 22mm !important;
            height: 22mm !important;
            min-width: 22mm !important;
            min-height: 22mm !important;
            margin-top: -11mm !important;
          }
          .printable-id-card-wrap.print-size-65mm svg {
            max-width: 36mm !important;
            max-height: 36mm !important;
          }

          /* ── 75mm (Large Hanging Event Badge) ── */
          .printable-id-card-wrap.print-size-75mm {
            width: 78mm !important;
            max-width: 78mm !important;
            border-radius: 12px !important;
          }
          .printable-id-card-wrap.print-size-75mm .agent-photo-box {
            width: 25mm !important;
            height: 25mm !important;
            min-width: 25mm !important;
            min-height: 25mm !important;
            margin-top: -12.5mm !important;
          }
          .printable-id-card-wrap.print-size-75mm svg {
            max-width: 42mm !important;
            max-height: 42mm !important;
          }

          .printable-id-card-wrap .agent-photo-box img {
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
            object-position: center 15% !important;
            image-rendering: -webkit-optimize-contrast !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Guarantee all UI chrome is stripped */
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}
