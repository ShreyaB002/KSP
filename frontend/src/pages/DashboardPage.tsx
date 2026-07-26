import React, { useState } from 'react';
import { useCase } from '../context/CaseContext';
import MapViewport from '../components/MapViewport';
import { Flame, ShieldAlert, GitBranch, MapPin, CheckCircle, Plus, Trash2, Check } from 'lucide-react';
import CrimeFormModal from '../components/CrimeFormModal';

export default function DashboardPage() {
  const {
    cases,
    selectedCaseId,
    setSelectedCaseId,
    threatNetworks,
    showHotspots,
    setShowHotspots,
    onDismantleNetwork,
    onAddCase,
    onToggleCaseStatus,
    onDeleteCase
  } = useCase();

  const [crimeFilter, setCrimeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredCases = cases.filter(c => {
    if (crimeFilter !== 'ALL' && c.crime_type.toUpperCase() !== crimeFilter) return false;
    if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
    
    if (startDate || endDate) {
      const caseDate = new Date(c.timestamp);
      if (startDate && caseDate < new Date(startDate)) return false;
      if (endDate && caseDate > new Date(endDate)) return false;
    }

    return true;
  });

  const uniqueCrimeTypes = ['ALL', ...Array.from(new Set(cases.map(c => c.crime_type.toUpperCase())))];

  const handleMapClick = (lat: number, lng: number) => {
    const newCaseId = `case_${Date.now()}`;
    const newCase = {
      id: newCaseId,
      crime_type: 'Incident Report',
      location: `Coordinates: [${lat.toFixed(4)}, ${lng.toFixed(4)}]`,
      coordinates: [lat, lng] as [number, number],
      timestamp: new Date().toLocaleString(),
      suspect_description: 'None',
      vehicle_details: 'None',
      is_organized_crime: false,
      status: 'active' as const,
      narrative: `Manual intelligence pin dropped at coordinates [${lat.toFixed(4)}, ${lng.toFixed(4)}].`,
      statements: []
    };
    onAddCase(newCase);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%' }}>
      
      {/* Filters and Hotspots Control Bar */}
      <div className="glass-panel" style={{
        padding: '20px 24px',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary"
            style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={16} />
            ADD CRIME
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span className="label-title">CRIME FILTER</span>
            <select
              value={crimeFilter}
              onChange={(e) => setCrimeFilter(e.target.value)}
              className="input-field"
              style={{ width: '180px', padding: '10px 14px' }}
            >
              {uniqueCrimeTypes.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span className="label-title">CASE STATUS</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field"
              style={{ width: '180px', padding: '10px 14px' }}
            >
              <option value="ALL">ALL STATUS</option>
              <option value="active">ACTIVE (RED)</option>
              <option value="resolved">RESOLVED (GREEN)</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span className="label-title">START DATE</span>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input-field" style={{ padding: '9px 14px' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span className="label-title">END DATE</span>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="input-field" style={{ padding: '9px 14px' }} />
          </div>
        </div>

        <button
          onClick={() => setShowHotspots(!showHotspots)}
          className="btn-primary"
          style={{
            padding: '10px 20px',
            fontSize: '0.85rem',
            background: showHotspots ? 'rgba(255, 51, 102, 0.15)' : 'rgba(0, 242, 254, 0.1)',
            borderColor: showHotspots ? 'var(--color-crimson)' : 'var(--color-cyan)',
            color: showHotspots ? 'var(--color-crimson)' : 'var(--color-cyan)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Flame size={16} />
          {showHotspots ? 'HIDE HEATMAP HOTSPOTS' : 'SHOW HEATMAP HOTSPOTS'}
        </button>
      </div>

      {/* Main Grid: Map (Left) & Sidebar lists (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', flex: 1, minHeight: '500px' }}>
        
        {/* Large Crime Map Container */}
        <div className="glass-panel" style={{
          overflow: 'hidden',
          position: 'relative',
          height: '100%',
          padding: 0
        }}>
          <MapViewport
            cases={cases}
            threatNetworks={threatNetworks}
            selectedCaseId={selectedCaseId}
            onSelectCase={setSelectedCaseId}
            showHotspots={showHotspots}
            onMapClick={handleMapClick}
          />
        </div>

        {/* Sidebar Lists Container */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%', overflowY: 'auto' }}>
          
          {/* Incidents Index Card */}
          <div className="glass-panel" style={{
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            maxHeight: '340px'
          }}>
            <h3 className="heading-secondary" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              borderBottom: '1px solid rgba(0, 119, 182, 0.15)',
              paddingBottom: '8px'
            }}>
              <ShieldAlert size={16} />
              INCIDENTS INDEX ({filteredCases.length})
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
              {filteredCases.map(c => {
                const isSelected = selectedCaseId === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCaseId(c.id)}
                    className={`interactive-card ${isSelected ? 'selected' : ''}`}
                    style={{ cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                        {c.crime_type}
                      </span>
                      <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: c.status === 'active' ? 'var(--color-crimson)' : 'var(--color-emerald)',
                        boxShadow: c.status === 'active' ? 'var(--shadow-crimson)' : 'var(--shadow-emerald)'
                      }} />
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={12} style={{ color: 'var(--color-cyan)' }} />
                      {c.location}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      <span>{c.timestamp}</span>
                      {c.is_organized_crime && <span style={{ color: 'var(--color-purple)' }}>ORGANIZED</span>}
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); onToggleCaseStatus(c.id); }}
                        className="btn-secondary"
                        style={{ flex: 1, padding: '4px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                      >
                        <Check size={12} />
                        {c.status === 'active' ? 'RESOLVE' : 'REOPEN'}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onDeleteCase(c.id); }}
                        className="btn-secondary"
                        style={{ flex: 1, padding: '4px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: 'var(--color-crimson)', borderColor: 'rgba(255, 51, 102, 0.3)' }}
                      >
                        <Trash2 size={12} />
                        DELETE
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Threat Networks Syndicate Summary */}
          <div className="glass-panel" style={{
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <h3 className="heading-secondary" style={{
              color: 'var(--color-purple)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              borderBottom: '1px solid rgba(0, 119, 182, 0.15)',
              paddingBottom: '8px'
            }}>
              <GitBranch size={16} />
              ORGANIZED CRIME SYNDICATES
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {threatNetworks.map(net => {
                const isDismantled = net.status === 'dismantled';
                return (
                  <div
                    key={net.id}
                    className="interactive-card"
                    style={{
                      borderLeft: `4px solid ${isDismantled ? 'var(--color-emerald)' : 'var(--color-purple)'}`,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', fontWeight: 'bold', color: isDismantled ? 'var(--color-emerald)' : 'var(--color-purple)' }}>
                        {net.name}
                      </span>
                      <span className={`status-badge ${isDismantled ? 'resolved' : 'active'}`} style={{ 
                        color: isDismantled ? 'var(--color-emerald)' : 'var(--color-purple)',
                        borderColor: isDismantled ? 'rgba(2, 195, 154, 0.2)' : 'rgba(114, 9, 183, 0.2)',
                        background: isDismantled ? 'rgba(2, 195, 154, 0.1)' : 'rgba(114, 9, 183, 0.1)'
                      }}>
                        {net.status.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
                      <span><strong>Suspects:</strong> {net.suspects.join(', ')}</span>
                      <span><strong>Vehicles:</strong> {net.vehicles.join(', ')}</span>
                    </div>

                    {!isDismantled && (
                      <button
                        onClick={() => onDismantleNetwork(net.id)}
                        className="btn-secondary"
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px'
                        }}
                      >
                        <CheckCircle size={14} />
                        DISMANTLE SYNDICATE
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      <CrimeFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={onAddCase} 
      />
    </div>
  );
}
