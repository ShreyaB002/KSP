import React from 'react';
import { useCase } from '../context/CaseContext';
import StatementComparer from '../components/StatementComparer';
import IntelligenceLinker from '../components/IntelligenceLinker';
import { Scale, ShieldAlert, GitBranch } from 'lucide-react';

export default function AnalysisPage() {
  const { activeCase, threatNetworks, setSelectedCaseId, onDismantleNetwork } = useCase();

  if (!activeCase) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '60vh',
        gap: '12px',
        color: 'var(--text-muted)'
      }}>
        <Scale size={40} style={{ color: 'var(--color-cyan)' }} />
        <h3 className="heading-primary">NO ACTIVE CASE SELECTED</h3>
        <p style={{ fontSize: '0.95rem' }}>Select an active incident from the navbar dropdown to view analysis logs.</p>
      </div>
    );
  }

  const linkedNetwork = activeCase.threat_network_id
    ? threatNetworks.find(n => n.id === activeCase.threat_network_id) || null
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', width: '100%' }}>
      
      <div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 800 }}>
          <Scale style={{ color: 'var(--color-cyan)' }} />
          COMPARATIVE AUDIT & LINK ANALYSIS
        </h2>
        <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Analyze narrative timeline deviations, flag behavioral deception patterns, and view suspect-vehicle connections.
        </p>
      </div>

      {/* Grid: Statement Comparer (Left) & Link Graph / Leads (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '32px', minHeight: '600px' }}>
        
        {/* Statement Comparison Workspace */}
        <div className="glass-panel" style={{
          padding: 0,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            padding: '16px 20px',
            background: 'rgba(255, 255, 255, 0.4)',
            borderBottom: '1px solid rgba(0, 119, 182, 0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <ShieldAlert size={18} style={{ color: 'var(--color-crimson)' }} />
            <span className="heading-secondary" style={{ color: 'var(--text-primary)', border: 'none', padding: 0 }}>
              CONTRADICTIONS RADAR & STRESS PROFILES
            </span>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <StatementComparer statements={activeCase.statements} />
          </div>
        </div>

        {/* Intelligence Linker Graph Workspace */}
        <div className="glass-panel" style={{
          padding: 0,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            padding: '16px 20px',
            background: 'rgba(255, 255, 255, 0.4)',
            borderBottom: '1px solid rgba(0, 119, 182, 0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <GitBranch size={18} style={{ color: 'var(--color-purple)' }} />
            <span className="heading-secondary" style={{ color: 'var(--text-primary)', border: 'none', padding: 0 }}>
              RELATIONAL NETWORK GRAPH
            </span>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <IntelligenceLinker
              network={linkedNetwork}
              cases={[activeCase]}
              activeCase={activeCase}
              onSelectCase={setSelectedCaseId}
              onDismantleNetwork={onDismantleNetwork}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
