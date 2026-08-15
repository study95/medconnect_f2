import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  IconHome,
  IconStethoscope,
  IconBuildingHospital,
  IconLayoutGrid,
  IconUser
} from '@tabler/icons-react';
import { useAuth } from '../../context/AuthContext';

export default function FloatingBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn } = useAuth();

  // Hide floating bottom nav on doctor detail pages (/doctors/:id)
  if (location.pathname.startsWith('/doctors/') && location.pathname !== '/doctors') {
    return null;
  }

  // Sequence: Home -> Doctor -> Hospital -> Service -> Login
  const navItems = [
    { id: 'home', icon: <IconHome size={22} stroke={1.8} />, path: '/', label: 'হোম' },
    { id: 'doctor', icon: <IconStethoscope size={22} stroke={1.8} />, path: '/doctors', label: 'ডাক্তার' },
    { id: 'hospital', icon: <IconBuildingHospital size={22} stroke={1.8} />, path: '/hospitals', label: 'হাসপাতাল' },
    { id: 'service', icon: <IconLayoutGrid size={22} stroke={1.8} />, path: '/services', label: 'সেবা' },
    { 
      id: 'account', 
      icon: <IconUser size={22} stroke={1.8} />, 
      path: isLoggedIn ? '/profile' : '/login', 
      label: isLoggedIn ? 'প্রোফাইল' : 'লগইন' 
    },
  ];

  const activeColor = '#00B875'; // Brand Green
  const mutedColor = '#64748B';

  const isActive = (item) => {
    if (item.path === '/' && location.pathname !== '/') return false;
    if (item.path !== '/' && location.pathname.startsWith(item.path)) return true;
    return location.pathname === item.path;
  };

  const handleNavClick = (item) => {
    navigate(item.path);
  };

  return (
    <>
      <style>{`
        .nav-pill { 
          position: relative; 
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); 
          padding: 6px 12px;
          border-radius: 12px;
          display: flex; 
          flex-direction: column; 
          align-items: center; 
          justify-content: center; 
          gap: 2px; 
          z-index: 2; 
          cursor: pointer;
        }
        .nav-pill.active {
          background-color: #E8F8F2 !important; /* Dream Light Green */
          color: ${activeColor} !important;
        }
        .nav-pill .icon-container { 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          transition: all 0.25s ease;
        }
        .nav-pill.active .icon-container { 
          color: ${activeColor} !important; 
          transform: translateY(-1px);
        }
      `}</style>

      {/* Bottom Nav Bar */}
      <div
        className="d-md-none"
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: 'rgba(255, 255, 255, 0.98)', backdropFilter: 'blur(25px)', WebkitBackdropFilter: 'blur(25px)',
          padding: '6px 8px', paddingBottom: 'max(6px, env(safe-area-inset-bottom))',
          minHeight: '62px',
          display: 'flex', justifyContent: 'space-around', alignItems: 'center',
          boxShadow: '0 -8px 30px rgba(0, 0, 0, 0.08)', borderTop: '1px solid rgba(0, 0, 0, 0.06)', zIndex: 1049,
          willChange: 'transform',
        }}
      >
        {navItems.map((item) => {
          const active = isActive(item);
          return (
            <div
              key={item.id}
              onClick={() => handleNavClick(item)}
              className={`nav-pill ${active ? 'active' : ''}`}
              style={{
                color: active ? activeColor : mutedColor,
              }}
            >
              <div className="icon-container">{item.icon}</div>
              {item.label && (
                <span style={{ 
                  fontSize: 11, 
                  fontWeight: active ? 800 : 600, 
                  fontFamily: "'Hind Siliguri', sans-serif", 
                  color: active ? activeColor : mutedColor,
                  lineHeight: 1
                }}>
                  {item.label}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
