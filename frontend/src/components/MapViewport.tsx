import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet.heat';
import { Case, ThreatNetwork } from '../types';

interface MapViewportProps {
  cases: Case[];
  threatNetworks: ThreatNetwork[];
  selectedCaseId: string | null;
  onSelectCase: (caseId: string) => void;
  showHotspots: boolean;
  onMapClick?: (lat: number, lng: number) => void;
}

export default function MapViewport({
  cases,
  threatNetworks,
  selectedCaseId,
  onSelectCase,
  showHotspots,
  onMapClick
}: MapViewportProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const hotspotsLayerRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Create Map (Centered on Bangalore/KSP area coordinates as context for KSP datathon)
    const map = L.map(mapContainerRef.current, {
      center: [12.9716, 77.5946],
      zoom: 12,
      zoomControl: false // Custom placement later or default
    });
    mapRef.current = map;

    // Add Custom Zoom Control to top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // High-tech dark tile layer using OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Layers
    markersLayerRef.current = L.layerGroup().addTo(map);
    hotspotsLayerRef.current = L.layerGroup().addTo(map);

    // Map Click Listener
    if (onMapClick) {
      map.on('click', (e: L.LeafletMouseEvent) => {
        // Prevent clicking inside other elements
        onMapClick(e.latlng.lat, e.latlng.lng);
      });
    }

    return () => {
      map.remove();
    };
  }, []);

  // Update Markers and Hotspots
  useEffect(() => {
    const map = mapRef.current;
    const markersLayer = markersLayerRef.current;
    const hotspotsLayer = hotspotsLayerRef.current;
    if (!map || !markersLayer || !hotspotsLayer) return;

    // Clear existing
    markersLayer.clearLayers();
    hotspotsLayer.clearLayers();

    // Map Crime Types to SVG paths for custom icons
    const getCrimeIconSvg = (crimeType: string, isRed: boolean) => {
      const color = isRed ? 'var(--color-crimson)' : 'var(--color-emerald)';
      const strokeGlow = isRed ? 'var(--shadow-crimson)' : 'var(--shadow-emerald)';
      const type = crimeType.toLowerCase();
      
      let iconPath = '';
      if (type.includes('robbery') || type.includes('theft')) {
        // Hand/Steal Bag Icon
        iconPath = `<path d="M19 11h-6v6h6v-6zm-2 2h-2v2h2v-2zM5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2H7v14h10v-2h2v4H5z" />`;
      } else if (type.includes('assault') || type.includes('vandalism')) {
        // Punch Fist / Danger Icon
        iconPath = `<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />`;
      } else if (type.includes('homicide') || type.includes('organized')) {
        // Skull/Death Icon
        iconPath = `<path d="M12 2a9 9 0 0 0-9 9c0 2.28 1 4.72 2.53 6.64L5 18a1 1 0 0 0 .5.87l3 1.73a1 1 0 0 0 1-.03l1.83-1.22 1.34.9a1 1 0 0 0 1.11 0l1.34-.9 1.83 1.22a1 1 0 0 0 1 .03l3-1.73a1 1 0 0 0 .5-.87l-.53-.36C18 15.72 19 13.28 19 11a9 9 0 0 0-9-9zm-3 8a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm6 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" />`;
      } else {
        // Shield/General Crime Icon
        iconPath = `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />`;
      }

      return `
        <div class="custom-pin">
          <div class="pin-pulse ${isRed ? 'red' : 'green'}"></div>
          <div class="pin-dot ${isRed ? 'red' : 'green'}" style="display: flex; align-items: center; justify-content: center;">
            <svg viewBox="0 0 24 24" width="12" height="12" style="fill: #ffffff; filter: drop-shadow(0 0 2px ${strokeGlow});">
              ${iconPath}
            </svg>
          </div>
        </div>
      `;
    };

    const heatPoints: [number, number, number][] = [];

    // Filter and display cases based on requirements
    cases.forEach((c) => {
      let shouldDisplay = false;
      let isRed = c.status === 'active';

      if (c.status === 'active') {
        shouldDisplay = true;
      } else {
        // Case is resolved
        if (!c.is_organized_crime) {
          // Rule 1: Non-organized crime resolved cases turn green and disappear from ACTIVE view map
          // Since this dashboard shows active investigation, we won't render it.
          shouldDisplay = false;
        } else {
          // Rule 2: Organized crime cases stay locked (GREEN) until the threat network is dismantled
          // Find the threat network
          const network = threatNetworks.find(n => n.id === c.threat_network_id);
          if (network) {
            if (network.status !== 'dismantled') {
              // Threat network is still active, so keep pin locked on the map (GREEN)
              shouldDisplay = true;
              isRed = false; // Green resolved pin
            } else {
              // Threat network is dismantled, pin can finally disappear
              shouldDisplay = false;
            }
          } else {
            // No network found, stay locked by default for safety
            shouldDisplay = true;
            isRed = false;
          }
        }
      }

      if (shouldDisplay) {
        const customIcon = L.divIcon({
          html: getCrimeIconSvg(c.crime_type, isRed),
          className: 'custom-div-icon',
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        });

        const marker = L.marker(c.coordinates, { icon: customIcon });

        // Bind Popup
        const popupContent = `
          <div style="font-family: var(--font-sans); min-width: 200px; padding: 8px;">
            <div style="font-family: var(--font-display); font-size: 0.9rem; color: var(--text-primary); margin-bottom: 6px; font-weight: bold;">
              ${c.crime_type.toUpperCase()}
            </div>
            <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 8px;">
              ${c.location}
            </div>
            <div style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-muted); margin-bottom: 12px;">
              ${c.timestamp}
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="
                font-size: 0.65rem;
                padding: 4px 8px;
                border-radius: 6px;
                font-family: var(--font-mono);
                background: ${c.is_organized_crime ? 'rgba(157, 78, 221, 0.1)' : 'rgba(0, 119, 182, 0.05)'};
                color: ${c.is_organized_crime ? 'var(--color-purple)' : 'var(--text-secondary)'};
                border: 1px solid ${c.is_organized_crime ? 'rgba(157, 78, 221, 0.2)' : 'rgba(0, 119, 182, 0.1)'};
                font-weight: 600;
              ">
                ${c.is_organized_crime ? 'ORGANIZED' : 'STANDARD'}
              </span>
              <span style="
                font-size: 0.75rem;
                color: ${isRed ? 'var(--color-crimson)' : 'var(--color-emerald)'};
                font-weight: bold;
              ">
                ${c.status.toUpperCase()}
              </span>
            </div>
          </div>
        `;
        
        marker.bindPopup(popupContent, {
          closeButton: false,
          offset: L.point(0, -5)
        });

        // Click Event
        marker.on('click', () => {
          onSelectCase(c.id);
        });

        marker.addTo(markersLayer);

        // Open popup automatically if selected
        if (selectedCaseId === c.id) {
          marker.openPopup();
          // Pan map to marker smoothly
          map.panTo(c.coordinates);
        }
      }

      // Add to Hotspots Heatmap layer if enabled (include all cases for heatmap)
      if (showHotspots) {
        let intensity = 0.5;
        const type = c.crime_type.toLowerCase();
        if (type.includes('homicide') || type.includes('murder')) intensity = 1.0;
        else if (type.includes('robbery') || type.includes('assault')) intensity = 0.8;
        else if (type.includes('theft') || type.includes('burglary')) intensity = 0.6;
        
        heatPoints.push([c.coordinates[0], c.coordinates[1], intensity]);
      }
    });

    if (showHotspots && heatPoints.length > 0) {
      const heatLayer = (L as any).heatLayer(heatPoints, {
        radius: 35,
        blur: 25,
        maxZoom: 15,
        gradient: { 0.4: '#00f2fe', 0.6: '#f5d020', 0.8: '#ff9900', 1.0: '#ff3366' }
      });
      heatLayer.addTo(hotspotsLayer);
    }

  }, [cases, threatNetworks, selectedCaseId, showHotspots]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Map Element */}
      <div
        ref={mapContainerRef}
        style={{ width: '100%', height: '100%' }}
      />
      
      {/* Grid crosshair hud layout overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        border: '1px solid rgba(0, 119, 182, 0.2)',
        zIndex: 500
      }}>
        {/* Reticles */}
        <div style={{ position: 'absolute', top: '20px', left: '20px', width: '20px', height: '20px', borderTop: '2px solid var(--color-cyan)', borderLeft: '2px solid var(--color-cyan)' }} />
        <div style={{ position: 'absolute', top: '20px', right: '20px', width: '20px', height: '20px', borderTop: '2px solid var(--color-cyan)', borderRight: '2px solid var(--color-cyan)' }} />
        <div style={{ position: 'absolute', bottom: '20px', left: '20px', width: '20px', height: '20px', borderBottom: '2px solid var(--color-cyan)', borderLeft: '2px solid var(--color-cyan)' }} />
        <div style={{ position: 'absolute', bottom: '20px', right: '20px', width: '20px', height: '20px', borderBottom: '2px solid var(--color-cyan)', borderRight: '2px solid var(--color-cyan)' }} />
        
        {/* Radar swept simulation on top left */}
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '50px',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.75rem',
          color: 'var(--color-cyan)',
          opacity: 0.8,
          fontWeight: 600
        }}>
          GRID FEED LOCK // BENGALURU SPATIAL INTEL
        </div>
      </div>
    </div>
  );
}
