import React from 'react';
import { Case, ThreatNetwork, Statement } from '../types';
import { GitBranch, User, Car, ShieldAlert, CheckCircle, MapPin, Eye } from 'lucide-react';

interface IntelligenceLinkerProps {
  network: ThreatNetwork | null;
  cases: Case[];
  activeCase: Case | null;
  onSelectCase: (caseId: string) => void;
  onDismantleNetwork: (networkId: string) => void;
}

export default function IntelligenceLinker({
  network,
  cases,
  activeCase,
  onSelectCase,
  onDismantleNetwork
}: IntelligenceLinkerProps) {
  
  // 1. Generate Actionable Leads based on case entities & statements
  const generateActionableLeads = () => {
    if (!activeCase) return [];
    
    const leads = [];
    
    // Check vehicle plate details
    if (activeCase.vehicle_details && activeCase.vehicle_details.toLowerCase() !== 'none') {
      const plateMatch = activeCase.vehicle_details.match(/([A-Z0-9\-]{5,12})/i);
      const plate = plateMatch ? plateMatch[1].toUpperCase() : '';
      if (plate) {
        leads.push({
          id: 'lead_1',
          type: 'vehicle',
          description: `Query KSP traffic cameras for plate ${plate} near ${activeCase.location} during timestamp ${activeCase.timestamp}.`,
          priority: 'high'
        });
      }
    }
    
    // Check statements contradictions or stress levels
    const highStressStatements = activeCase.statements.filter(s => s.behavioral_risk.risk_level === 'high');
    highStressStatements.forEach(s => {
      leads.push({
        id: `lead_stress_${s.id}`,
        type: 'suspect',
        description: `Schedule follow-up interrogation for ${s.speaker_name}. High behavioral stress score (${s.behavioral_risk.stress_score}%) flagged on alibi questions.`,
        priority: 'high'
      });
    });

    // Cross-checking timelines
    if (activeCase.statements.length >= 2) {
      leads.push({
        id: 'lead_timeline',
        type: 'timeline',
        description: `Verify conflicting timelines between witness testimonies using CCTV footage from the nearest junction to ${activeCase.location}.`,
        priority: 'medium'
      });
    }

    // Default lead
    if (leads.length === 0) {
      leads.push({
        id: 'lead_default',
        type: 'general',
        description: `Corroborate suspect appearance description with KSP criminal database biometric listings.`,
        priority: 'low'
      });
    }

    return leads;
  };

  const leads = generateActionableLeads();
  const isDismantled = network?.status === 'dismantled';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      padding: '20px',
      background: 'transparent',
      gap: '16px'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <GitBranch size={18} style={{ color: network ? 'var(--color-purple)' : 'var(--color-cyan)' }} />
          <span className="heading-secondary" style={{
            fontSize: '0.9rem',
            border: 'none',
            padding: 0
          }}>
            INTELLIGENCE LINK ANALYSIS
          </span>
        </div>

        {network && (
          <span style={{
            fontSize: '0.65rem',
            fontFamily: 'var(--font-mono)',
            padding: '2px 8px',
            borderRadius: '4px',
            background: isDismantled ? 'rgba(0, 255, 204, 0.1)' : 'rgba(157, 78, 221, 0.1)',
            color: isDismantled ? 'var(--color-emerald)' : 'var(--color-purple)',
            border: `1px solid ${isDismantled ? 'rgba(0, 255, 204, 0.2)' : 'rgba(157, 78, 221, 0.2)'}`
          }}>
            {isDismantled ? 'DISMANTLED_SYNDICATE' : 'ACTIVE_SYNDICATE'}
          </span>
        )}
      </div>

      {/* Relational SVG Node Link Graph */}
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
        {/* Connection lines */}
        <svg style={{ position: 'absolute', width: '100%', height: '100%', pointerEvents: 'none' }}>
          {/* Main Case to location, suspect description, statements */}
          <line x1="50%" y1="50%" x2="25%" y2="25%" stroke="rgba(0, 242, 254, 0.3)" strokeWidth="1" />
          <line x1="50%" y1="50%" x2="75%" y2="25%" stroke="rgba(0, 242, 254, 0.3)" strokeWidth="1" />
          <line x1="50%" y1="50%" x2="25%" y2="75%" stroke="rgba(0, 242, 254, 0.3)" strokeWidth="1" />
          <line x1="50%" y1="50%" x2="75%" y2="75%" stroke="rgba(0, 242, 254, 0.3)" strokeWidth="1" />
          
          {/* If there are statement links, draw them */}
          {activeCase?.statements.map((_, idx) => (
            <line
              key={idx}
              x1="50%"
              y1="50%"
              x2="50%"
              y2="15%"
              stroke="rgba(157, 78, 221, 0.3)"
              strokeWidth="1.5"
              strokeDasharray="2,4"
            />
          ))}
        </svg>

        {/* Central Core Case Node */}
        {activeCase && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: '#ffffff',
            border: '2px solid var(--color-cyan)',
            boxShadow: '0 0 15px rgba(0, 119, 182, 0.2)',
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-cyan)',
            cursor: 'pointer',
            zIndex: 10
          }} title="Current Incident Node">
            <ShieldAlert size={18} style={{ animation: 'pulse-slow 2s infinite' }} />
          </div>
        )}

        {/* Satellite Nodes */}
        {/* Node 1: Location */}
        {activeCase && (
          <div style={{
            position: 'absolute',
            top: '25%',
            left: '25%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(0, 119, 182, 0.1)',
            border: '1px solid rgba(0, 119, 182, 0.2)',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-cyan)',
            zIndex: 8
          }} title={`Location: ${activeCase.location}`}>
            <MapPin size={14} />
          </div>
        )}

        {/* Node 2: Vehicle */}
        {activeCase && activeCase.vehicle_details !== 'None' && (
          <div style={{
            position: 'absolute',
            top: '25%',
            left: '75%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(245, 208, 32, 0.1)',
            border: '1px solid rgba(245, 208, 32, 0.2)',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-amber)',
            zIndex: 8
          }} title={`Vehicle: ${activeCase.vehicle_details}`}>
            <Car size={14} />
          </div>
        )}

        {/* Node 3: Statements count */}
        {activeCase && (
          <div style={{
            position: 'absolute',
            top: '75%',
            left: '25%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(157, 78, 221, 0.1)',
            border: '1px solid rgba(157, 78, 221, 0.2)',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-purple)',
            zIndex: 8,
            fontSize: '0.75rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: 600
          }} title="Statements count">
            {activeCase.statements.length}S
          </div>
        )}

        {/* Node 4: Suspect Entity */}
        {activeCase && (
          <div style={{
            position: 'absolute',
            top: '75%',
            left: '75%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(217, 4, 41, 0.1)',
            border: '1px solid rgba(217, 4, 41, 0.2)',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-crimson)',
            zIndex: 8
          }} title="Suspect Profile">
            <User size={14} />
          </div>
        )}

        {/* Visual helper */}
        <div style={{
          position: 'absolute',
          bottom: '6px',
          left: '8px',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.55rem',
          color: 'var(--text-muted)'
        }}>
          *Relational links compiled from case statements
        </div>
      </div>

      {/* Actionable Leads List */}
      <div>
        <h4 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '0.85rem',
          color: 'var(--text-primary)',
          letterSpacing: '1px',
          marginBottom: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontWeight: 700
        }}>
          <ShieldAlert size={14} style={{ color: 'var(--color-amber)' }} />
          AI-GENERATED INVESTIGATION LEADS
        </h4>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto' }}>
          {leads.map((l, idx) => (
            <div
              key={idx}
              style={{
                background: l.priority === 'high' ? 'rgba(217, 4, 41, 0.05)' : 'rgba(245, 208, 32, 0.05)',
                borderLeft: `3px solid ${l.priority === 'high' ? 'var(--color-crimson)' : 'var(--color-amber)'}`,
                borderTop: '1px solid rgba(0, 119, 182, 0.1)',
                borderBottom: '1px solid rgba(0, 119, 182, 0.1)',
                borderRight: '1px solid rgba(0, 119, 182, 0.1)',
                padding: '10px 12px',
                borderRadius: '0 6px 6px 0',
                fontSize: '0.85rem',
                lineHeight: '1.4'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.65rem',
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  fontWeight: 600
                }}>
                  Type: {l.type}
                </span>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.65rem',
                  color: l.priority === 'high' ? 'var(--color-crimson)' : 'var(--color-amber)',
                  fontWeight: 'bold'
                }}>
                  {l.priority.toUpperCase()}_PRIORITY
                </span>
              </div>
              <div style={{ color: 'var(--text-primary)' }}>
                {l.description}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dismantle Syndicate Button */}
      {network && !isDismantled && (
        <button
          onClick={() => onDismantleNetwork(network.id)}
          className="btn-primary"
          style={{
            background: 'linear-gradient(135deg, rgba(0, 255, 204, 0.1) 0%, rgba(127, 0, 255, 0.1) 100%)',
            borderColor: 'var(--color-emerald)',
            color: '#ffffff',
            padding: '8px',
            fontSize: '0.7rem'
          }}
        >
          <CheckCircle size={12} />
          CONFIRM NETWORK DISMANTLED
        </button>
      )}
    </div>
  );
}
