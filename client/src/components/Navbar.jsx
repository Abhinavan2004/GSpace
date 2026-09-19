import React, { useState } from 'react';
import { HardDrive, LogOut, Sun, Moon, Database, User, Menu, X } from 'lucide-react';

export default function Navbar({ username, onLogout, theme, toggleTheme, onOpenStorage }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(prev => !prev);
  };

  const handleMobileAction = (action) => {
    setMobileMenuOpen(false);
    action();
  };

  return (
    <header className="app-header">
      <div className="brand-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        <div className="brand-icon">
          <HardDrive size={24} />
        </div>
        <span>GSpace</span>
      </div>

      {/* Desktop Header Actions */}
      <div className="header-actions desktop-nav">
        <button 
          className="btn btn-secondary" 
          onClick={onOpenStorage} 
          title="Storage Overview" 
          style={{ gap: '0.5rem' }}
        >
          <Database size={16} color="var(--accent-primary)" />
          <span style={{ fontSize: '0.85rem' }}>Storage</span>
        </button>

        <button 
          className="btn btn-secondary btn-icon" 
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#6366f1" />}
        </button>

        <div className="user-pill">
          <User size={16} color="var(--accent-primary)" />
          <span>{username}</span>
        </div>

        <button 
          className="btn btn-danger" 
          onClick={onLogout}
          style={{ padding: '0.5rem 0.9rem' }}
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>

      {/* Mobile Hamburger Button */}
      <button 
        className="btn btn-secondary btn-icon mobile-hamburger-btn"
        onClick={toggleMobileMenu}
        aria-label="Toggle navigation menu"
      >
        {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Mobile Dropdown Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-nav-drawer glass-panel">
          <div className="mobile-user-info">
            <User size={18} color="var(--accent-primary)" />
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{username}</span>
          </div>

          <button 
            className="btn btn-secondary mobile-menu-item" 
            onClick={() => handleMobileAction(onOpenStorage)}
          >
            <Database size={18} color="var(--accent-primary)" />
            <span>Storage Overview</span>
          </button>

          <button 
            className="btn btn-secondary mobile-menu-item" 
            onClick={() => handleMobileAction(toggleTheme)}
          >
            {theme === 'dark' ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#6366f1" />}
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          <button 
            className="btn btn-danger mobile-menu-item" 
            onClick={() => handleMobileAction(onLogout)}
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      )}
    </header>
  );
}
