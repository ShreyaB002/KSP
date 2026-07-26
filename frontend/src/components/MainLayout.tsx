import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCase } from '../context/CaseContext';
import { Shield, LayoutDashboard, Mic, MessageSquare, Scale, HelpCircle, CheckCircle, ShieldAlert } from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation();
  const { cases, selectedCaseId, setSelectedCaseId, activeCase, onToggleCaseStatus } = useCase();

  const menuItems = [
    { path: '/', label: 'Investigation Dashboard', icon: LayoutDashboard },
    { path: '/intake', label: 'Statement Capture', icon: Mic },
    { path: '/assistant', label: 'Conversational Assistant', icon: MessageSquare },
    { path: '/analysis', label: 'Comparison & Linkage', icon: Scale },
  ];

  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      
      {/* Top Navigation Banner */}
      <header className="app-header" style={{ padding: '16px 24px' }}>
        <div className="logo-container" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Shield className="logo-icon" size={28} style={{ color: 'var(--color-cyan)' }} />
          <h1 className="logo-text" style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: '1px' }}>
            KSP CONVERSATIONAL INVESTIGATION ASSISTANT
          </h1>
        </div>

        {/* Global Case Switcher Context on Top Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>ACTIVE CASE:</span>
            <select
              value={selectedCaseId || ''}
              onChange={(e) => setSelectedCaseId(e.target.value || null)}
              className="input-field"
              style={{
                width: '240px',
                padding: '6px 12px',
                fontSize: '0.85rem'
              }}
            >
              <option value="">-- SELECT INCIDENT --</option>
              {cases.map(c => (
                <option key={c.id} value={c.id}>
                  {c.crime_type.toUpperCase()} - {c.location.substring(0, 20)}
                </option>
              ))}
            </select>
          </div>
          
          <div className="system-status" style={{ display: 'flex', gap: '12px', fontSize: '0.75rem' }}>
            <div className="status-indicator" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span className="status-dot"></span>
              SYS: ONLINE
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace split */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* Navigation Sidebar */}
        <aside className="surface-sidebar" style={{
          width: '260px',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 16px',
          gap: '12px'
        }}>
          <div style={{
            fontSize: '0.7rem',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)',
            letterSpacing: '1px',
            marginBottom: '8px',
            paddingLeft: '12px'
          }}>
            NAVIGATION CONSOLE
          </div>
          
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {menuItems.map(item => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    color: isActive ? 'var(--color-cyan)' : 'var(--text-secondary)',
                    background: isActive ? 'rgba(0, 119, 182, 0.08)' : 'transparent',
                    border: `1px solid ${isActive ? 'rgba(0, 119, 182, 0.3)' : 'transparent'}`,
                    fontFamily: 'var(--font-display)',
                    fontSize: '0.95rem',
                    fontWeight: isActive ? 700 : 500,
                    textDecoration: 'none',
                    transition: 'var(--transition-fast)'
                  }}
                >
                  <Icon size={20} style={{ color: isActive ? 'var(--color-cyan)' : 'var(--text-muted)' }} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Content Workspace Frame */}
        <main style={{
          flex: 1,
          overflowY: 'auto',
          padding: '32px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {children}
        </main>
      </div>

      {/* Bottom Global HUD Context Bar */}
      {activeCase && (
        <div className="glass-panel" style={{
          borderTop: '1px solid var(--border-cyan)',
          borderBottom: 'none',
          borderLeft: 'none',
          borderRight: 'none',
          borderRadius: '0',
          padding: '16px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: '64px',
          zIndex: 90
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>CURRENT INVESTIGATION TARGET</span>
              <span style={{ fontSize: '1.05rem', fontWeight: 'bold', fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                {activeCase.crime_type.toUpperCase()} ({activeCase.location})
              </span>
            </div>
            
            <div style={{
              height: '24px',
              width: '1px',
              background: 'var(--border-cyan)'
            }} />

            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Statements: <strong style={{ color: 'var(--color-purple)' }}>{activeCase.statements.length}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <span className={`status-badge ${activeCase.status}`}>
              STATUS: {activeCase.status.toUpperCase()}
            </span>
            <button
              onClick={() => onToggleCaseStatus(activeCase.id)}
              className="btn-secondary"
              style={{
                padding: '6px 14px',
                fontSize: '0.8rem',
              }}
            >
              TOGGLE CASE RESOLVED
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
