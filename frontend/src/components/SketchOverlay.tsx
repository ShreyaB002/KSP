import React, { useState, useEffect, useRef } from 'react';
import { Shield, Sparkles, RefreshCw, Cpu, Edit3 } from 'lucide-react';

interface SketchOverlayProps {
  description: string;
  sketchUrl?: string;
  onSketchGenerated: (url: string) => void;
}

export default function SketchOverlay({ description, sketchUrl, onSketchGenerated }: SketchOverlayProps) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  // Sync prompt with the current case description
  useEffect(() => {
    if (description) {
      setPrompt(description);
    }
  }, [description]);

  // Biometric canvas scan animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 360);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 360);

    let angle = 0;
    let scanLineY = 0;
    let scanDirection = 1;

    // Fixed keypoints for face mapping simulation
    const keypoints = [
      { x: width * 0.5, y: height * 0.35, label: 'FP-01 (Nose Bridge)' },
      { x: width * 0.42, y: height * 0.3, label: 'EYE-L' },
      { x: width * 0.58, y: height * 0.3, label: 'EYE-R' },
      { x: width * 0.5, y: height * 0.45, label: 'MOU-02' },
      { x: width * 0.35, y: height * 0.35, label: 'JAW-L' },
      { x: width * 0.65, y: height * 0.35, label: 'JAW-R' },
      { x: width * 0.5, y: height * 0.18, label: 'FR-00 (Forehead)' },
      { x: width * 0.5, y: height * 0.58, label: 'CH-10 (Chin)' }
    ];

    const drawScanner = () => {
      // Clear canvas
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillRect(0, 0, width, height);

      // Radial glowing background
      const glowGrad = ctx.createRadialGradient(width * 0.5, height * 0.38, 10, width * 0.5, height * 0.38, width * 0.4);
      glowGrad.addColorStop(0, 'rgba(0, 119, 182, 0.08)');
      glowGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, 0, width, height);

      // Draw futuristic grids
      ctx.strokeStyle = 'rgba(0, 119, 182, 0.05)';
      ctx.lineWidth = 1;
      
      const gridSize = 30;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw biometric circles
      ctx.strokeStyle = 'rgba(0, 119, 182, 0.15)';
      ctx.beginPath();
      ctx.arc(width * 0.5, height * 0.38, 110, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(127, 0, 255, 0.1)';
      ctx.beginPath();
      ctx.arc(width * 0.5, height * 0.38, 140, 0, Math.PI * 2);
      ctx.stroke();

      // Rotating scanner lines
      ctx.strokeStyle = 'rgba(0, 119, 182, 0.2)';
      ctx.beginPath();
      ctx.arc(width * 0.5, height * 0.38, 80, angle, angle + Math.PI * 0.5);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.arc(width * 0.5, height * 0.38, 90, -angle, -angle + Math.PI * 0.3);
      ctx.stroke();

      // Draw wireframe head silhouette
      ctx.strokeStyle = 'rgba(0, 119, 182, 0.3)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      // Face shape
      ctx.ellipse(width * 0.5, height * 0.38, 65, 85, 0, 0, Math.PI * 2);
      ctx.stroke();
      
      // Eyes
      ctx.beginPath();
      ctx.arc(width * 0.44, height * 0.33, 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(width * 0.56, height * 0.33, 8, 0, Math.PI * 2);
      ctx.stroke();
      
      // Nose
      ctx.beginPath();
      ctx.moveTo(width * 0.5, height * 0.31);
      ctx.lineTo(width * 0.5, height * 0.41);
      ctx.lineTo(width * 0.47, height * 0.41);
      ctx.stroke();
      
      // Mouth
      ctx.beginPath();
      ctx.arc(width * 0.5, height * 0.46, 15, 0, Math.PI, false);
      ctx.stroke();

      // Drawing keypoints
      keypoints.forEach((kp, i) => {
        // Draw keypoint node
        ctx.fillStyle = isGenerating ? 'var(--color-crimson)' : 'var(--color-cyan)';
        ctx.beginPath();
        ctx.arc(kp.x, kp.y, 3, 0, Math.PI * 2);
        ctx.fill();

        // Pulsing circle around node
        const pulseRadius = 3 + (Math.sin(angle * 3 + i) + 1) * 3;
        ctx.strokeStyle = isGenerating ? 'rgba(217, 4, 41, 0.4)' : 'rgba(0, 119, 182, 0.3)';
        ctx.beginPath();
        ctx.arc(kp.x, kp.y, pulseRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Connect nodes to center with biometric lines
        ctx.strokeStyle = 'rgba(0, 119, 182, 0.05)';
        ctx.beginPath();
        ctx.moveTo(kp.x, kp.y);
        ctx.lineTo(width * 0.5, height * 0.38);
        ctx.stroke();
      });

      // Text readouts
      ctx.fillStyle = 'rgba(0, 119, 182, 0.8)';
      ctx.font = '9px "JetBrains Mono"';
      ctx.fillText(`BIOMETRIC ENGINE: v4.12`, 15, 25);
      ctx.fillText(`SYS_STATUS: ${isGenerating ? 'SCANNING...' : 'MONITORING'}`, 15, 38);
      ctx.fillText(`TARGET_LOCK: TRUE`, 15, 51);

      ctx.fillStyle = 'rgba(100, 116, 139, 0.8)';
      ctx.fillText(`X: ${(width * 0.5).toFixed(0)} Y: ${(height * 0.38).toFixed(0)} Z: 1.05`, width - 110, 25);
      ctx.fillText(`FPS: 60.0`, width - 60, 38);

      // Scanning bar
      ctx.strokeStyle = isGenerating ? 'rgba(255, 51, 102, 0.5)' : 'rgba(0, 242, 254, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(10, scanLineY);
      ctx.lineTo(width - 10, scanLineY);
      ctx.stroke();
      
      // Scanning line shadow
      const scanGrad = ctx.createLinearGradient(0, scanLineY - 10 * scanDirection, 0, scanLineY);
      scanGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      scanGrad.addColorStop(1, isGenerating ? 'rgba(255, 51, 102, 0.08)' : 'rgba(0, 242, 254, 0.08)');
      ctx.fillStyle = scanGrad;
      ctx.fillRect(10, scanDirection === 1 ? scanLineY - 30 : scanLineY, width - 20, 30);

      // Update scanline position
      scanLineY += 2 * scanDirection;
      if (scanLineY >= height - 20 || scanLineY <= 20) {
        scanDirection *= -1;
      }

      angle += 0.01;
      animationRef.current = requestAnimationFrame(drawScanner);
    };

    drawScanner();

    const handleResize = () => {
      width = canvas.width = canvas.parentElement?.clientWidth || 360;
      height = canvas.height = canvas.parentElement?.clientHeight || 360;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isGenerating]);

  const handleGenerateSketch = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/generate-sketch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error(`Server returned code ${response.status}`);
      }

      const data = await response.json();
      onSketchGenerated(data.image_url);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`Failed to generate sketch: ${err.message || 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      borderTop: 'none',
      borderLeft: 'none',
      borderRight: 'none',
      borderRadius: '0',
      padding: '0',
      background: 'transparent'
    }}>
      {/* Title Header */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid rgba(0, 119, 182, 0.15)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(255, 255, 255, 0.5)'
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
          <Shield size={16} />
          FORENSIC SKETCH OVERLAY
        </span>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.65rem',
          color: 'var(--text-muted)'
        }}>
          STABILITY_AI_INTEGRATION
        </span>
      </div>

      {/* Main Display Zone */}
      <div style={{
        flex: 1,
        position: 'relative',
        background: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        minHeight: '280px'
      }}>
        {sketchUrl ? (
          <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <img
              src={sketchUrl}
              alt="Forensic Sketch"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                display: 'block'
              }}
            />
            
            {/* Holographic scanning overlay effect on top of image */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              border: '1px solid rgba(0, 119, 182, 0.1)',
              backgroundImage: 'linear-gradient(rgba(0, 119, 182, 0) 97%, rgba(0, 119, 182, 0.2) 97%, rgba(0, 119, 182, 0.2) 100%)',
              backgroundSize: '100% 30px',
              animation: 'scanline 20s linear infinite'
            }} />
            
            {/* Tech details on bottom of the sketch */}
            <div style={{
              position: 'absolute',
              bottom: '8px',
              left: '8px',
              right: '8px',
              background: 'rgba(255, 255, 255, 0.8)',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid rgba(0, 119, 182, 0.2)',
              fontSize: '0.75rem',
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-cyan)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontWeight: 'bold'
            }}>
              <span>SKETCH_RECONSTRUCTED</span>
              <span style={{ color: 'var(--text-secondary)' }}>CONFIDENCE: 92%</span>
            </div>
          </div>
        ) : (
          <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
            
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              width: '80%',
              pointerEvents: 'none',
              background: 'rgba(255, 255, 255, 0.8)',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid rgba(0, 119, 182, 0.2)',
              boxShadow: '0 4px 20px rgba(0, 119, 182, 0.1)'
            }}>
              <Cpu size={28} style={{ color: 'var(--color-cyan)', filter: 'drop-shadow(0 0 5px rgba(0, 119, 182, 0.4))', marginBottom: '8px' }} />
              <p style={{ fontSize: '0.85rem', fontFamily: 'var(--font-display)', color: 'var(--text-primary)', letterSpacing: '0.5px', fontWeight: 'bold' }}>
                BIOMETRIC MAPPING ACTIVE
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Describe a suspect in the narrative intake to generate a high-detail forensic profile sketch.
              </p>
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {isGenerating && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(255, 255, 255, 0.85)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            zIndex: 5
          }}>
            <RefreshCw className="logo-icon" size={32} style={{ animation: 'spin 2s linear infinite', color: 'var(--color-cyan)' }} />
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: '0.9rem',
              color: 'var(--color-cyan)',
              letterSpacing: '1px',
              fontWeight: 'bold',
              animation: 'pulse-slow 1.5s infinite'
            }}>
              GENERATING MONOCHROME SKETCH...
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
              Querying Stability AI diffusion model
            </span>
          </div>
        )}
      </div>

      {/* Control Panel */}
      <div style={{
        padding: '16px',
        background: 'rgba(0, 119, 182, 0.02)',
        borderTop: '1px solid rgba(0, 119, 182, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div>
          <span className="label-title" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Edit3 size={10} />
            Forensic Description Prompt
          </span>
          <textarea
            className="input-field"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Suspect appearance details (age, race, hair, clothing, build, etc.)"
            style={{
              height: '60px',
              resize: 'none',
              fontSize: '0.75rem',
              padding: '8px'
            }}
            disabled={isGenerating}
          />
        </div>

        <button
          onClick={handleGenerateSketch}
          className="btn-primary"
          style={{ width: '100%' }}
          disabled={isGenerating || !prompt.trim()}
        >
          <Sparkles size={14} />
          {sketchUrl ? 'RE-GENERATE FORENSIC SKETCH' : 'GENERATE FORENSIC SKETCH'}
        </button>

        {errorMsg && (
          <span style={{
            fontSize: '0.65rem',
            color: 'var(--color-crimson)',
            fontFamily: 'var(--font-mono)'
          }}>
            {errorMsg}
          </span>
        )}
      </div>
    </div>
  );
}
