import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const icons = {
  dashboard: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  projects: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M3 7h18M3 12h18M3 17h18"/>
    </svg>
  ),
  assignments: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M4 4h16v16H4z"/><path d="M8 9h8M8 13h5"/>
    </svg>
  ),
  submit: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M12 5v14M5 12l7-7 7 7"/>
    </svg>
  ),
  logout: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
    </svg>
  ),
  menu: (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M3 12h18M3 6h18M3 18h18"/>
    </svg>
  ),
  close: (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M18 6L6 18M6 6l12 12"/>
    </svg>
  ),
};

const studentLinks = [
  { to: '/', label: 'Dashboard', icon: icons.dashboard, exact: true },
  { to: '/assignments', label: 'Assignments', icon: icons.assignments },
  { to: '/projects', label: 'My Projects', icon: icons.projects },
  { to: '/submit', label: 'Submit Project', icon: icons.submit },
];

const professorLinks = [
  { to: '/', label: 'Dashboard', icon: icons.dashboard, exact: true },
  { to: '/assignments', label: 'Assignments', icon: icons.assignments },
  { to: '/projects', label: 'All Projects', icon: icons.projects },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = user?.role === 'student' ? studentLinks : professorLinks;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sidebarContent = (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      padding: '0', overflow: 'hidden'
    }}>
      {/* Logo */}
      <div style={{
        padding: '24px 20px 20px',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, var(--accent), #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 800, color: 'white', flexShrink: 0
          }}>S</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)' }}>SPRS</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>Project Review System</div>
          </div>
        </div>
      </div>

      {/* User info */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--accent-glow)',
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--accent), #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: 16, color: 'white', marginBottom: 8
        }}>
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{user?.name}</div>
        <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{user?.email}</div>
        <div style={{
          marginTop: 6, display: 'inline-block',
          padding: '2px 8px', borderRadius: 20,
          background: user?.role === 'professor' ? 'rgba(99,102,241,0.15)' : 'rgba(16,185,129,0.1)',
          color: user?.role === 'professor' ? 'var(--accent2)' : 'var(--green)',
          fontSize: 11, fontWeight: 600, textTransform: 'capitalize'
        }}>
          {user?.role}
        </div>
      </div>

      {/* Nav links */}
      <nav style={{ flex: 1, padding: '12px 12px', overflowY: 'auto' }}>
        <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, padding: '4px 8px 8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Navigation
        </div>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.exact}
            onClick={() => setMobileOpen(false)}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 8,
              marginBottom: 2, transition: 'all 0.15s',
              fontSize: 14, fontWeight: isActive ? 600 : 500,
              color: isActive ? 'white' : 'var(--text2)',
              background: isActive ? 'var(--accent)' : 'transparent',
              boxShadow: isActive ? '0 2px 12px rgba(99,102,241,0.4)' : 'none',
            })}
          >
            {link.icon}
            {link.label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div style={{ padding: '12px 12px 20px', borderTop: '1px solid var(--border)' }}>
        <button onClick={handleLogout} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          width: '100%', padding: '10px 12px', borderRadius: 8,
          background: 'transparent', color: 'var(--text3)',
          fontSize: 14, fontWeight: 500, transition: 'all 0.15s',
          cursor: 'pointer', border: 'none'
        }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--red-bg)'; e.currentTarget.style.color = 'var(--red)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text3)'; }}
        >
          {icons.logout} Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside style={{
        width: 260, background: 'var(--bg2)',
        borderRight: '1px solid var(--border)',
        position: 'fixed', top: 0, left: 0, height: '100vh',
        zIndex: 100, display: 'flex', flexDirection: 'column',
      }} className="desktop-sidebar">
        {sidebarContent}
      </aside>

      {/* Mobile topbar */}
      <div style={{
        display: 'none', position: 'fixed', top: 0, left: 0, right: 0,
        height: 60, background: 'var(--bg2)', borderBottom: '1px solid var(--border)',
        alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', zIndex: 200,
      }} className="mobile-topbar">
        <div style={{ fontWeight: 800, fontSize: 16 }}>SPRS</div>
        <button onClick={() => setMobileOpen(true)} style={{
          background: 'var(--bg3)', border: '1px solid var(--border2)',
          color: 'var(--text)', borderRadius: 8, padding: 8, display: 'flex'
        }}>{icons.menu}</button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 300,
          display: 'flex',
        }}>
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)'
          }} onClick={() => setMobileOpen(false)} />
          <div style={{
            position: 'relative', width: 280, height: '100%',
            background: 'var(--bg2)', borderRight: '1px solid var(--border)',
            display: 'flex', flexDirection: 'column', zIndex: 1,
            animation: 'slideIn 0.25s ease',
          }}>
            <div style={{ position: 'absolute', top: 12, right: 12 }}>
              <button onClick={() => setMobileOpen(false)} style={{
                background: 'var(--bg3)', border: '1px solid var(--border2)',
                color: 'var(--text2)', borderRadius: 8, padding: 6, display: 'flex'
              }}>{icons.close}</button>
            </div>
            {sidebarContent}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-sidebar { display: none !important; }
          .mobile-topbar { display: flex !important; }
        }
      `}</style>
    </>
  );
}
