import React, { useState } from 'react';
import { ThreatNetwork as NetworkType, Case } from '../types';
import { GitBranch, User, Car, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';

interface ThreatNetworkProps {
  network: NetworkType | null;
  cases: Case[];
  onSelectCase: (caseId: string) => void;
  onDismantleNetwork: (networkId: string) => void;
}

export default function ThreatNetwork({
  network,
  cases,
  onSelectCase,
  onDismantleNetwork
}: ThreatNetworkProps) {
  if (!network) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: '24px',
        color: 'var(--text-muted)',
        textAlign: 'center',
        background: 'transparent'
      }}>
        <GitBranch size={28} style={{ marginBottom: '8px', opacity: 0.5 }} />
        <p style={{ fontSize: '0.75rem', fontFamily: 'var(--font-display)', letterSpacing: '0.5px' }}>
          NO ORGANIZED THREAT NETWORK DETECTED
        </p>
        <p style={{ fontSize: '0.65rem', marginTop: '4px' }}>
          Select an organized crime case to map out the intelligence syndicate network.
        </p>
      </div>
    );
  }

  const networkCases = cases.filter(c => network.cases.includes(c.id));
  const isDismantled = network.status === 'dismantled';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      padding: '20px',
      background: 'transparent',
      gap: '16px'
    }}>
      {/* Header Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <GitBranch size={18} style={{ color: isDismantled ? 'var(--color-emerald)' : 'var(--color-purple)' }} />
          <span className="heading-secondary" style={{
            fontSize: '0.9rem',
            color: isDismantled ? 'var(--color-emerald)' : 'var(--text-primary)',
            border: 'none',
            padding: 0
          }}>
            NETWORK MAP: {network.name.toUpperCase()}
          </span>
        </div>

        <span className="status-badge" style={{
          background: isDismantled ? 'rgba(0, 168, 107, 0.1)' : 'rgba(157, 78, 221, 0.1)',
          color: isDismantled ? 'var(--color-emerald)' : 'var(--color-purple)',
          borderColor: isDismantled ? 'rgba(0, 168, 107, 0.2)' : 'rgba(157, 78, 221, 0.2)'
        }}>
          {isDismantled ? 'DISMANTLED' : 'ACTIVE THREAT'}
        </span>
      </div>

      {/* Interactive Visual Network Diagram */}
      <div style={{
        flex: 1,
        border: '1px solid rgba(0, 119, 182, 0.2)',
        borderRadius: '8px',
        background: '#ffffff',
        position: 'relative',
        minHeight: '160px',
        overflow: 'hidden',
        boxShadow: 'inset 0 0 10px rgba(0, 119, 182, 0.05)'
      }}>
        {/* SVG connection lines */}
        <svg style={{ position: 'absolute', width: '100%', height: '100%', pointerEvents: 'none' }}>
          <defs>
            <linearGradient id="purple-cyan" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--color-purple)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="var(--color-cyan)" stopOpacity="0.4" />
            </linearGradient>
          </defs>
          
          {/* Central connections */}
          {/* Center coordinate: 50% 50% */}
          {/* Link: Network -> Cases */}
          {networkCases.map((_, idx) => {
            const count = networkCases.length;
            const angle = (idx / count) * Math.PI * 2;
            const x = 50 + Math.cos(angle) * 30;
            const y = 50 + Math.sin(angle) * 30;
            return (
              <line
                key={idx}
                x1="50%"
                y1="50%"
                x2={`${x}%`}
                y2={`${y}%`}
                stroke="url(#purple-cyan)"
                strokeWidth="1.5"
                strokeDasharray={isDismantled ? "none" : "3,3"}
              />
            );
          })}
        </svg>

        {/* Nodes Placement */}
        {/* Central Network Node */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: '#ffffff',
          border: `2px solid ${isDismantled ? 'var(--color-emerald)' : 'var(--color-purple)'}`,
          boxShadow: isDismantled ? '0 0 15px rgba(0, 168, 107, 0.2)' : '0 0 15px rgba(157, 78, 221, 0.2)',
          width: '54px',
          height: '54px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: isDismantled ? 'var(--color-emerald)' : 'var(--color-purple)',
          cursor: 'pointer',
          zIndex: 10
        }} title={`${network.name} center hub`}>
          <GitBranch size={22} style={{ animation: isDismantled ? 'none' : 'pulse-slow 2s infinite' }} />
        </div>

        {/* Satellite nodes for cases */}
        {networkCases.map((c, idx) => {
          const count = networkCases.length;
          const angle = (idx / count) * Math.PI * 2;
          const x = 50 + Math.cos(angle) * 30;
          const y = 50 + Math.sin(angle) * 30;
          const isCaseActive = c.status === 'active';
          
          return (
            <div
              key={c.id}
              onClick={() => onSelectCase(c.id)}
              style={{
                position: 'absolute',
                top: `${y}%`,
                left: `${x}%`,
                transform: 'translate(-50%, -50%)',
                background: isCaseActive ? 'rgba(217, 4, 41, 0.1)' : 'rgba(0, 168, 107, 0.1)',
                border: `1px solid ${isCaseActive ? 'rgba(217, 4, 41, 0.2)' : 'rgba(0, 168, 107, 0.2)'}`,
                boxShadow: 'none',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isCaseActive ? 'var(--color-crimson)' : 'var(--color-emerald)',
                cursor: 'pointer',
                zIndex: 8,
                transition: 'var(--transition-fast)'
              }}
              title={`Case: ${c.crime_type} at ${c.location}`}
            >
              <ShieldAlert size={14} />
            </div>
          );
        })}

        {/* Text indicators */}
        <div style={{
          position: 'absolute',
          bottom: '8px',
          left: '8px',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.55rem',
          color: 'var(--text-muted)'
        }}>
          *Click nodes to navigate incidents
        </div>
      </div>

      {/* Network Attributes Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div className="interactive-card" style={{ padding: '12px' }}>
          <span className="label-title" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <User size={12} /> Associated Suspects
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
            {network.suspects.map(s => (
              <span key={s} style={{
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                background: 'rgba(0, 119, 182, 0.05)',
                border: '1px solid rgba(0, 119, 182, 0.1)',
                padding: '4px 8px',
                borderRadius: '4px',
                color: 'var(--text-secondary)'
              }}>
                {s}
              </span>
            ))}
          </div>
        </div>

        <div className="interactive-card" style={{ padding: '12px' }}>
          <span className="label-title" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Car size={12} /> Tracked Vehicles
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
            {network.vehicles.map(v => (
              <span key={v} style={{
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                background: 'rgba(0, 119, 182, 0.05)',
                border: '1px solid rgba(0, 119, 182, 0.1)',
                padding: '4px 8px',
                borderRadius: '4px',
                color: 'var(--color-cyan)'
              }}>
                {v}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Network Actions */}
      {!isDismantled ? (
        <button
          onClick={() => onDismantleNetwork(network.id)}
          className="btn-primary"
          style={{
            background: 'var(--color-emerald)',
            borderColor: 'var(--color-emerald)',
            color: '#ffffff',
            padding: '12px'
          }}
        >
          <CheckCircle size={16} />
          CONFIRM NETWORK DISMANTLED
        </button>
      ) : (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '12px',
          background: 'rgba(0, 168, 107, 0.1)',
          border: '1px solid rgba(0, 168, 107, 0.2)',
          borderRadius: '8px',
          color: 'var(--color-emerald)',
          fontSize: '0.85rem',
          fontFamily: 'var(--font-display)',
          fontWeight: 'bold',
          letterSpacing: '0.5px'
        }}>
          <CheckCircle size={18} />
          THREAT NETWORK DEACTIVATED
        </div>
      )}
    </div>
  );
}
