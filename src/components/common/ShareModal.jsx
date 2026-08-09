import { useState } from 'react'
import { Modal } from 'react-bootstrap'
import { 
  IconCopy, IconCheck, IconBrandWhatsapp, IconBrandFacebook, 
  IconBrandTelegram, IconMail, IconX, IconShare
} from '@tabler/icons-react'

export default function ShareModal({ show, onHide, shareData }) {
  const [copied, setCopied] = useState(false)

  if (!shareData) return null

  const { title = 'Doctor Booklet', text = '', url = window.location.href, image = '' } = shareData

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = url
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
      setCopied(true)
      
      setTimeout(() => setCopied(false), 3000)
    } catch (err) {
      console.error('Failed to copy link:', err)
      
    }
  }

  const encodedUrl = encodeURIComponent(url)
  const encodedText = encodeURIComponent(text ? `${title} - ${text}` : title)

  const handleMessengerShare = () => {
    const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    const messengerUrl = `fb-messenger://share/?link=${encodedUrl}`
    const webFallbackUrl = `https://www.facebook.com/dialog/send?link=${encodedUrl}&app_id=291494419107518&redirect_uri=${encodedUrl}`

    if (isMobile) {
      window.location.href = messengerUrl
      setTimeout(() => {
        window.open(webFallbackUrl, '_blank')
      }, 1000)
    } else {
      window.open(webFallbackUrl, '_blank')
    }
    if (onHide) onHide()
  }

  const handleImoShare = () => {
    const imoUrl = `imo://share?text=${encodeURIComponent(`${title}\n${text}\n${url}`)}`
    const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

    if (isMobile) {
      window.location.href = imoUrl
      setTimeout(() => {
        handleCopyLink()
        
      }, 1200)
    } else {
      handleCopyLink()
      
    }
    if (onHide) onHide()
  }

  const shareOptions = [
    {
      id: 'copy',
      name: 'কপি লিংক',
      icon: copied ? <IconCheck size={22} color="#10B981" /> : <IconCopy size={22} color="#00A88C" />,
      bg: copied ? '#ECFDF5' : '#E6F6F4',
      borderColor: copied ? '#10B981' : 'rgba(0, 168, 140, 0.2)',
      color: copied ? '#047857' : '#008a74',
      onClick: handleCopyLink
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      icon: <IconBrandWhatsapp size={22} color="#25D366" />,
      bg: '#DCFCE7',
      borderColor: 'rgba(37, 211, 102, 0.3)',
      color: '#15803D',
      href: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${title}\n${text}\n${url}`)}`
    },
    {
      id: 'messenger',
      name: 'Messenger',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M12 2C6.477 2 2 6.145 2 11.258c0 2.91 1.455 5.512 3.735 7.21V22l3.39-1.862c.91.252 1.874.388 2.875.388 5.523 0 10-4.145 10-9.258C22 6.145 17.523 2 12 2zm1.06 12.443l-2.587-2.76-5.047 2.76 5.553-5.892 2.653 2.76 4.98-2.76-5.552 5.892z" fill="#0084FF"/>
        </svg>
      ),
      bg: '#EFF6FF',
      borderColor: 'rgba(0, 132, 255, 0.25)',
      color: '#0066CC',
      onClick: handleMessengerShare
    },
    {
      id: 'imo',
      name: 'IMO',
      icon: (
        <div style={{ width: 26, height: 26, borderRadius: 8, background: '#00A3E0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: 11, fontFamily: 'sans-serif', boxShadow: '0 2px 6px rgba(0, 163, 224, 0.3)' }}>
          imo
        </div>
      ),
      bg: '#E0F2FE',
      borderColor: 'rgba(0, 163, 224, 0.3)',
      color: '#0284C7',
      onClick: handleImoShare
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: <IconBrandFacebook size={22} color="#1877F2" />,
      bg: '#EFF6FF',
      borderColor: 'rgba(24, 119, 242, 0.25)',
      color: '#1D4ED8',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
    },
    {
      id: 'telegram',
      name: 'Telegram',
      icon: <IconBrandTelegram size={22} color="#229ED9" />,
      bg: '#F0F9FF',
      borderColor: 'rgba(34, 158, 217, 0.25)',
      color: '#0369A1',
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`
    },
    {
      id: 'email',
      name: 'Email',
      icon: <IconMail size={22} color="#EA4335" />,
      bg: '#FEF2F2',
      borderColor: 'rgba(234, 67, 53, 0.25)',
      color: '#B91C1C',
      href: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${title}\n${text}\n\n${url}`)}`
    }
  ]

  return (
    <Modal show={show} onHide={onHide} centered className="share-modal" contentClassName="border-0 shadow-lg" style={{ borderRadius: 20 }}>
      <div style={{ background: 'white', borderRadius: 20, padding: '24px 24px 28px', overflow: 'hidden' }}>
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between mb-3 pb-2" style={{ borderBottom: '1px solid #F1F5F9' }}>
          <div className="d-flex align-items-center gap-2">
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#E6F6F4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconShare size={20} color="#00A88C" />
            </div>
            <h5 style={{ margin: 0, fontWeight: 900, fontSize: 18, color: '#0F172A', fontFamily: "'Hind Siliguri', sans-serif" }}>
              শেয়ার করুন
            </h5>
          </div>
          <button 
            onClick={onHide}
            style={{ border: 'none', background: '#F8FAFC', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', cursor: 'pointer', transition: '0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#F1F5F9' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#F8FAFC' }}
          >
            <IconX size={18} />
          </button>
        </div>

        {/* Shared Item Preview */}
        {(title || image) && (
          <div className="p-3 mb-4 d-flex align-items-center gap-3" style={{ background: '#F8FAFC', borderRadius: 14, border: '1px solid #F1F5F9' }}>
            {image && (
              <img 
                src={image} 
                alt={title} 
                style={{ width: 52, height: 52, borderRadius: 12, objectFit: 'cover', border: '1px solid #E2E8F0', flexShrink: 0 }} 
                onError={e => { e.target.style.display = 'none' }}
              />
            )}
            <div style={{ minWidth: 0, flex: 1 }}>
              <h6 style={{ margin: 0, fontWeight: 800, fontSize: 15, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: "'Hind Siliguri', sans-serif" }}>
                {title}
              </h6>
              {text && (
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748B', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: "'Hind Siliguri', sans-serif" }}>
                  {text}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Share Options Grid (Responsive auto-fill grid) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: '14px 10px', marginBottom: 20 }}>
          {shareOptions.map(opt => {
            const content = (
              <div 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  gap: 8,
                  textDecoration: 'none'
                }}
              >
                <div 
                  style={{ 
                    width: 52, 
                    height: 52, 
                    borderRadius: 16, 
                    background: opt.bg, 
                    border: `1.5px solid ${opt.borderColor}`,
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.03)'
                  }}
                  className="share-opt-icon"
                >
                  {opt.icon}
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: opt.color, textAlign: 'center', fontFamily: "'Hind Siliguri', sans-serif" }}>
                  {opt.name}
                </span>
              </div>
            )

            if (opt.href) {
              return (
                <a 
                  key={opt.id} 
                  href={opt.href} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  onClick={onHide}
                  style={{ textDecoration: 'none' }}
                >
                  {content}
                </a>
              )
            }

            return (
              <button 
                key={opt.id} 
                onClick={opt.onClick} 
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
              >
                {content}
              </button>
            )
          })}
        </div>

        {/* Copy Link Input Bar */}
        <div className="d-flex align-items-center gap-2 p-2" style={{ background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0' }}>
          <input 
            type="text" 
            readOnly 
            value={url} 
            style={{ 
              border: 'none', 
              background: 'transparent', 
              fontSize: 13, 
              color: '#334155', 
              fontWeight: 600, 
              flex: 1, 
              paddingLeft: 8,
              outline: 'none'
            }} 
          />
          <button 
            onClick={handleCopyLink}
            style={{ 
              background: copied ? '#10B981' : '#00A88C', 
              color: 'white', 
              border: 'none', 
              borderRadius: 8, 
              padding: '6px 16px', 
              fontSize: 13, 
              fontWeight: 800, 
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: "'Hind Siliguri', sans-serif"
            }}
          >
            {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
            <span>{copied ? 'কপি হয়েছে' : 'কপি'}</span>
          </button>
        </div>
      </div>
    </Modal>
  )
}
