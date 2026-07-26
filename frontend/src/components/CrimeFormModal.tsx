import React, { useState } from 'react';
import { Case } from '../types';

interface CrimeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newCase: Case) => void;
}

export default function CrimeFormModal({ isOpen, onClose, onSubmit }: CrimeFormModalProps) {
  const [crimeType, setCrimeType] = useState('Incident Report');
  const [description, setDescription] = useState('');
  const [timestamp, setTimestamp] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [status, setStatus] = useState<'active' | 'resolved'>('active');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert lat/long to numbers
    const latNum = parseFloat(latitude);
    const lngNum = parseFloat(longitude);

    if (isNaN(latNum) || isNaN(lngNum)) {
      alert('Please enter valid coordinates.');
      return;
    }

    const newCase: Case = {
      id: `case_${Date.now()}`,
      crime_type: crimeType,
      location: `Coordinates: [${latNum.toFixed(4)}, ${lngNum.toFixed(4)}]`,
      coordinates: [latNum, lngNum],
      timestamp: timestamp ? new Date(timestamp).toLocaleString() : new Date().toLocaleString(),
      suspect_description: 'None provided',
      vehicle_details: 'None provided',
      is_organized_crime: false,
      status: status,
      narrative: description,
      statements: []
    };

    onSubmit(newCase);
    onClose();
    
    // Reset fields
    setCrimeType('Incident Report');
    setDescription('');
    setTimestamp('');
    setLatitude('');
    setLongitude('');
    setStatus('active');
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div className="glass-panel" style={{
        width: '450px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <h2 className="heading-primary" style={{ borderBottom: '1px solid rgba(0, 119, 182, 0.3)', paddingBottom: '12px' }}>
          ADD NEW CRIME INCIDENT
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label className="label-title">CRIME TYPE</label>
            <input 
              type="text" 
              className="input-field" 
              value={crimeType}
              onChange={(e) => setCrimeType(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label className="label-title">DESCRIPTION / NARRATIVE</label>
            <textarea 
              className="input-field" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              required
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label className="label-title">DATE & TIME</label>
            <input 
              type="datetime-local" 
              className="input-field" 
              value={timestamp}
              onChange={(e) => setTimestamp(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
              <label className="label-title">LATITUDE</label>
              <input 
                type="number" 
                step="any"
                className="input-field" 
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="12.9716"
                required
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
              <label className="label-title">LONGITUDE</label>
              <input 
                type="number" 
                step="any"
                className="input-field" 
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="77.5946"
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label className="label-title">INITIAL STATUS</label>
            <select 
              className="input-field"
              value={status}
              onChange={(e) => setStatus(e.target.value as 'active' | 'resolved')}
            >
              <option value="active">ACTIVE (RED)</option>
              <option value="resolved">RESOLVED (GREEN)</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
            <button type="button" onClick={onClose} className="btn-secondary">
              CANCEL
            </button>
            <button type="submit" className="btn-primary">
              SAVE INCIDENT
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
