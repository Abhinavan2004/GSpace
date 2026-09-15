import React from 'react';
import { HardDrive, LogOut, Sun, Moon, Database, User } from 'lucide-react';

export default function Navbar({ username, onLogout, theme, toggleTheme, onOpenStorage }) {
  return (
    <header className="app-header">
      <div className="brand-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        <div className="brand-icon">
          <HardDrive size={24} />
        </div>
        <span>GSpace</span>
      </div>

      <div className="header-actions">
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
    </header>
  );
}
