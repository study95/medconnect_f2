import { useNavigate } from 'react-router-dom'
import { Container } from 'react-bootstrap'

export default function BreadcrumbHUD({ links = [], variant = 'dark' }) {
  const navigate = useNavigate()

  return (
    <div style={{ 
      padding: '24px 0 0', 
      position: 'relative', 
      zIndex: 100,
      background: 'transparent'
    }}>
      <Container>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          padding: '0 0 8px', // Reduced bottom space
          background: 'transparent'
        }}>
          <nav style={{ fontSize: 13, color: variant === 'light' ? 'rgba(255,255,255,0.8)' : '#64748B', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span 
              onClick={() => navigate('/')} 
              style={{ cursor: 'pointer', fontWeight: 600, transition: '0.3s' }} 
              onMouseEnter={e=>e.target.style.color = variant === 'light' ? '#fff' : '#00A88C'} 
              onMouseLeave={e=>e.target.style.color = variant === 'light' ? 'rgba(255,255,255,0.8)' : '#64748B'}
            >
              হোম
            </span>
            {links.filter((link, idx) => !(idx === 0 && (link.label === 'Home' || link.label === 'হোম'))).map((link, idx, filteredLinks) => (
              <span key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ opacity: 0.4, fontSize: 14 }}>/</span>
                <span 
                  onClick={() => (link.path || link.url) && navigate(link.path || link.url)} 
                  style={{ 
                    cursor: (link.path || link.url) ? 'pointer' : 'default', 
                    color: idx === filteredLinks.length - 1 ? (variant === 'light' ? '#fff' : '#00A88C') : (variant === 'light' ? 'rgba(255,255,255,0.8)' : '#64748B'),
                    fontWeight: idx === filteredLinks.length - 1 ? 900 : 600,
                    transition: '0.3s'
                  }}
                  onMouseEnter={e => (link.path || link.url) && (e.target.style.color = variant === 'light' ? '#fff' : '#006D5C')}
                  onMouseLeave={e => (link.path || link.url) && (e.target.style.color = idx === filteredLinks.length - 1 ? (variant === 'light' ? '#fff' : '#00A88C') : (variant === 'light' ? 'rgba(255,255,255,0.8)' : '#64748B'))}
                >
                  {link.label}
                </span>
              </span>
            ))}
          </nav>
          
          <button 
            onClick={() => navigate(-1)} 
            style={{ 
              background: variant === 'light' ? 'rgba(255,255,255,0.1)' : '#F1F5F9', 
              border: variant === 'light' ? '1px solid rgba(255,255,255,0.2)' : 'none', 
              color: variant === 'light' ? 'white' : '#00A88C', 
              fontWeight: 900, 
              fontSize: 11, 
              padding: '8px 18px', 
              borderRadius: 12, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 8,
              transition: '0.4s',
              boxShadow: variant === 'light' ? 'none' : '0 4px 12px rgba(0,0,0,0.03)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
            onMouseEnter={e => {
              e.target.style.background = '#00A88C'
              e.target.style.color = 'white'
              e.target.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={e => {
              e.target.style.background = variant === 'light' ? 'rgba(255,255,255,0.1)' : '#F1F5F9'
              e.target.style.color = variant === 'light' ? 'white' : '#00A88C'
              e.target.style.transform = 'translateY(0)'
            }}
          >
            ← ফিরে যান
          </button>
        </div>
      </Container>
    </div>
  )
}
