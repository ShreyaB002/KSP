import React, { useState } from 'react';
import { Case, VehicleRecord, ThreatNetwork } from '../types';
import { Filter, Eye, ShieldAlert, Car, Flame, XCircle, CheckCircle } from 'lucide-react';

interface AnalyticsSidebarProps {
  cases: Case[];
  selectedCaseId: string | null;
  onSelectCase: (caseId: string) => void;
  showHotspots: boolean;
  setShowHotspots: (show: boolean) => void;
  threatNetworks: ThreatNetwork[];
  onDismantleNetwork: (networkId: string) => void;
  vehicles: VehicleRecord[];
}

export default function AnalyticsSidebar({
  cases,
  selectedCaseId,
  onSelectCase,
  showHotspots,
  setShowHotspots,
  threatNetworks,
  onDismantleNetwork,
  vehicles
}: AnalyticsSidebarProps) {
  // Filters state
  const [crimeFilter, setCrimeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [orgFilter, setOrgFilter] = useState('ALL');

  // Filter cases
  const filteredCases = cases.filter(c => {
    if (crimeFilter !== 'ALL' && c.crime_type.toUpperCase() !== crimeFilter) return false;
    if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
    if (orgFilter === 'ORG' && !c.is_organized_crime) return false;
    if (orgFilter === 'STD' && c.is_organized_crime) return false;
    return true;
  });

  // Unique crime types for filter dropdown
  const uniqueCrimeTypes = ['ALL', ...Array.from(new Set(cases.map(c => c.crime_type.toUpperCase())))];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      borderRight: '1px solid rgba(0, 119, 182, 0.15)',
      background: '#ffffff'
    }}>
      {/* Title Header */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid rgba(0, 119, 182, 0.15)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(255, 255, 255, 0.6)'
      }}>
        <span className="heading-secondary" style={{
          fontSize: '0.9rem',
          color: 'var(--color-cyan)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          border: 'none',
          padding: 0
        }}>
          <Filter size={16} />
          INTELLIGENCE DASHBOARD
        </span>
        <button
          onClick={() => setShowHotspots(!showHotspots)}
          className="btn-secondary"
          style={{
            padding: '6px 10px',
            fontSize: '0.75rem',
            borderColor: showHotspots ? 'var(--color-crimson)' : 'var(--border-cyan)',
            color: showHotspots ? 'var(--color-crimson)' : 'var(--text-primary)',
            background: showHotspots ? 'rgba(217, 4, 41, 0.1)' : '#ffffff',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontWeight: 600
          }}
        >
          <Flame size={14} />
          {showHotspots ? 'HOTSPOTS ACTIVE' : 'SHOW HOTSPOTS'}
        </button>
      </div>

      {/* Filters Form Container */}
      <div style={{
        padding: '16px',
        background: 'rgba(0, 119, 182, 0.02)',
        borderBottom: '1px solid rgba(0, 119, 182, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label className="label-title" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>Crime Type</label>
            <select
              value={crimeFilter}
              onChange={(e) => setCrimeFilter(e.target.value)}
              className="input-field"
              style={{ padding: '8px', fontSize: '0.85rem', borderRadius: '6px' }}
            >
              {uniqueCrimeTypes.map(t => (
                <option key={t} value={t} style={{ background: '#ffffff', color: 'var(--text-primary)' }}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-title" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>Case Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field"
              style={{ padding: '8px', fontSize: '0.85rem', borderRadius: '6px' }}
            >
              <option value="ALL" style={{ background: '#ffffff', color: 'var(--text-primary)' }}>ALL STATUS</option>
              <option value="active" style={{ background: '#ffffff', color: 'var(--text-primary)' }}>ACTIVE (RED)</option>
              <option value="resolved" style={{ background: '#ffffff', color: 'var(--text-primary)' }}>RESOLVED (GRN)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label-title" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>Threat Scope</label>
          <select
            value={orgFilter}
            onChange={(e) => setOrgFilter(e.target.value)}
            className="input-field"
            style={{ padding: '8px', fontSize: '0.85rem', borderRadius: '6px' }}
          >
            <option value="ALL" style={{ background: '#ffffff', color: 'var(--text-primary)' }}>ALL SCOPES</option>
            <option value="ORG" style={{ background: '#ffffff', color: 'var(--text-primary)' }}>ORGANIZED CRIME ONLY</option>
            <option value="STD" style={{ background: '#ffffff', color: 'var(--text-primary)' }}>STANDARD CRIME ONLY</option>
          </select>
        </div>
      </div>

      {/* Main sidebar content scroll zone */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Cases List */}
        <div>
          <h4 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '0.85rem',
            color: 'var(--text-primary)',
            letterSpacing: '1px',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: 700
          }}>
            <ShieldAlert size={14} style={{ color: 'var(--color-cyan)' }} />
            INCIDENTS INDEX ({filteredCases.length})
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredCases.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '20px',
                fontSize: '0.85rem',
                color: 'var(--text-muted)',
                border: '1px dashed rgba(0, 119, 182, 0.2)',
                borderRadius: '8px'
              }}>
                No incident reports match filters.
              </div>
            ) : (
              filteredCases.map(c => {
                const isSelected = selectedCaseId === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => onSelectCase(c.id)}
                    className="interactive-card"
                    style={{
                      background: isSelected ? 'rgba(0, 119, 182, 0.05)' : '#ffffff',
                      border: `1px solid ${isSelected ? 'var(--color-cyan)' : 'var(--border-cyan)'}`,
                      boxShadow: isSelected ? '0 0 0 1px var(--color-cyan)' : 'var(--shadow-sm)',
                      padding: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '0.85rem',
                        fontWeight: 'bold',
                        color: 'var(--text-primary)'
                      }}>
                        {c.crime_type}
                      </span>
                      <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: c.status === 'active' ? 'var(--color-crimson)' : 'var(--color-emerald)',
                        boxShadow: c.status === 'active' ? '0 0 5px var(--color-crimson)' : '0 0 5px var(--color-emerald)'
                      }} />
                    </div>
                    
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.location}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{c.timestamp}</span>
                      {c.is_organized_crime && (
                        <span className="status-badge" style={{
                          background: 'rgba(157, 78, 221, 0.1)',
                          color: 'var(--color-purple)',
                          borderColor: 'rgba(157, 78, 221, 0.2)'
                        }}>
                          GANG
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Threat Networks List */}
        <div>
          <h4 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '0.85rem',
            color: 'var(--text-primary)',
            letterSpacing: '1px',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: 700
          }}>
            <ShieldAlert size={14} style={{ color: 'var(--color-purple)' }} />
            THREAT NETWORKS (ORGANIZED CRIME)
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {threatNetworks.map(net => {
              const isDismantled = net.status === 'dismantled';
              return (
                <div
                  key={net.id}
                  className="interactive-card"
                  style={{
                    background: isDismantled ? 'rgba(0, 168, 107, 0.05)' : '#ffffff',
                    border: `1px solid ${isDismantled ? 'rgba(0, 168, 107, 0.2)' : 'rgba(157, 78, 221, 0.2)'}`,
                    padding: '12px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '0.85rem',
                      fontWeight: 'bold',
                      color: isDismantled ? 'var(--color-emerald)' : 'var(--color-purple)'
                    }}>
                      {net.name.toUpperCase()}
                    </span>
                    <span className="status-badge" style={{
                      color: isDismantled ? 'var(--color-emerald)' : 'var(--color-purple)',
                      background: isDismantled ? 'rgba(0, 168, 107, 0.1)' : 'rgba(157, 78, 221, 0.1)',
                      borderColor: isDismantled ? 'rgba(0, 168, 107, 0.2)' : 'rgba(157, 78, 221, 0.2)'
                    }}>
                      {net.status.toUpperCase()}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '10px' }}>
                    <span>Linked Cases: {net.cases.length}</span>
                    <span>Suspects Tagged: {net.suspects.join(', ')}</span>
                  </div>

                  {!isDismantled && (
                    <button
                      onClick={() => onDismantleNetwork(net.id)}
                      className="btn-secondary"
                      style={{
                        width: '100%',
                        padding: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        borderColor: 'var(--color-emerald)',
                        color: 'var(--color-emerald)',
                        background: 'rgba(0, 168, 107, 0.05)'
                      }}
                    >
                      DISMANTLE THREAT NETWORK
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Aggregated Vehicles Log */}
        <div>
          <h4 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '0.85rem',
            color: 'var(--text-primary)',
            letterSpacing: '1px',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: 700
          }}>
            <Car size={14} style={{ color: 'var(--color-amber)' }} />
            AGGREGATED VEHICLE LOGS
          </h4>
          <div style={{ overflowX: 'auto', background: '#ffffff', borderRadius: '8px', border: '1px solid var(--border-cyan)' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.75rem',
              fontFamily: 'var(--font-mono)',
              textAlign: 'left'
            }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(0, 119, 182, 0.15)', color: 'var(--text-muted)', background: 'rgba(0, 119, 182, 0.02)' }}>
                  <th style={{ padding: '8px' }}>PLATE</th>
                  <th style={{ padding: '8px' }}>DESCRIPTION</th>
                  <th style={{ padding: '8px' }}>LAST SEEN</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)' }}>
                      No vehicles flagged.
                    </td>
                  </tr>
                ) : (
                  vehicles.map(v => (
                    <tr key={v.id} style={{ borderBottom: '1px solid rgba(0, 119, 182, 0.05)', color: 'var(--text-primary)' }}>
                      <td style={{ padding: '10px 8px', fontWeight: 'bold', color: 'var(--color-cyan)' }}>
                        {v.plate.toUpperCase()}
                      </td>
                      <td style={{ padding: '10px 8px', color: 'var(--text-secondary)' }}>
                        {v.color} {v.make}
                      </td>
                      <td style={{ padding: '10px 8px', color: 'var(--text-muted)' }} title={v.location}>
                        {v.last_seen}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
