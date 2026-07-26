import React, { useState, useEffect, useRef } from 'react';
import { useCase } from '../context/CaseContext';
import { Mic, MicOff, Video, VideoOff, Save, ShieldAlert, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import { Statement } from '../types';

export default function IntakePage() {
  const { activeCase, onAddStatement } = useCase();

  // Speaker Form
  const [speakerName, setSpeakerName] = useState('');
  const [speakerRole, setSpeakerRole] = useState<'suspect' | 'witness' | 'victim'>('witness');
  const [mediaType, setMediaType] = useState<'audio' | 'video' | 'text'>('text');
  
  // Statement text and recording state
  const [statementText, setStatementText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Speech & Webcam Refs
  const recognitionRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setStatementText(prev => prev + (prev.endsWith(' ') || prev.length === 0 ? '' : ' ') + finalTranscript);
        }
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  // Camera permissions
  const startCamera = async () => {
    try {
      const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(localStream);
      if (videoRef.current) {
        videoRef.current.srcObject = localStream;
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to open camera. Defaulting to audio dictation.");
      setMediaType('audio');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    if (mediaType === 'video') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [mediaType]);

  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      setErrorMsg(null);
      setSuccessMsg(null);
      if (!speakerName.trim()) {
        setErrorMsg("Please specify the speaker's name before recording.");
        return;
      }
      try {
        if (recognitionRef.current) {
          recognitionRef.current.start();
          setIsRecording(true);
        } else {
          setErrorMsg("Browser does not support Speech Recognition. Please type statement.");
        }
      } catch (err) {
        console.error(err);
        setErrorMsg("Failed to start speech recording.");
      }
    }
  };

  const handleSubmitStatement = async () => {
    if (!activeCase) {
      setErrorMsg("No active case selected. Select an incident in the navbar drop-down.");
      return;
    }
    if (!speakerName.trim() || !statementText.trim()) return;
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const response = await fetch('/api/statement/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          speaker_name: speakerName,
          speaker_role: speakerRole,
          media_type: mediaType,
          text: statementText
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned code ${response.status}`);
      }

      const parsedData = await response.json();
      
      const newStatement: Statement = {
        id: `stmt_${Date.now()}`,
        speaker_name: parsedData.speaker_name,
        speaker_role: parsedData.speaker_role as any,
        media_type: parsedData.media_type as any,
        transcript: parsedData.transcript,
        behavioral_risk: parsedData.behavioral_risk,
        extracted_entities: parsedData.extracted_entities,
        timestamp: new Date().toLocaleString()
      };

      onAddStatement(activeCase.id, newStatement);
      setSuccessMsg(`Statement successfully compiled and added to case: ${activeCase.crime_type}`);
      
      // Reset
      setStatementText('');
      setSpeakerName('');
      stopCamera();
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to submit statement. Make sure the backend dev server is running.");
    } finally {
      setIsLoading(false);
    }
  };

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
        <ShieldAlert size={40} style={{ color: 'var(--color-cyan)' }} />
        <h3 className="heading-primary">NO ACTIVE CASE SELECTED</h3>
        <p style={{ fontSize: '0.95rem' }}>Select an active incident from the navbar dropdown to begin recording statements.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      
      <div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 800 }}>
          <FileText style={{ color: 'var(--color-cyan)' }} />
          STATEMENT CAPTURE FEED
        </h2>
        <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Record witness testimonies, suspect interrogations, or victim statements using real-time audio/video processing.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '32px' }}>
        
        {/* Left Side: Metadata Card */}
        <div className="glass-panel" style={{
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          height: 'fit-content'
        }}>
          <h3 className="heading-secondary" style={{ borderBottom: '1px solid rgba(0, 119, 182, 0.15)', paddingBottom: '8px' }}>
            METADATA & TYPE
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label className="label-title">Speaker Full Name</label>
            <input
              type="text"
              className="input-field"
              value={speakerName}
              onChange={(e) => setSpeakerName(e.target.value)}
              placeholder="e.g. Witness Marcus Vance"
              style={{ padding: '10px 14px', fontSize: '0.9rem', borderRadius: '6px' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label className="label-title">Speaker Role</label>
            <select
              value={speakerRole}
              onChange={(e: any) => setSpeakerRole(e.target.value)}
              className="input-field"
              style={{ padding: '10px 14px', fontSize: '0.9rem', borderRadius: '6px' }}
            >
              <option value="witness">Witness Testimony</option>
              <option value="suspect">Suspect Interrogation</option>
              <option value="victim">Victim Statement</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label className="label-title">Capture Format</label>
            <select
              value={mediaType}
              onChange={(e: any) => setMediaType(e.target.value)}
              className="input-field"
              style={{ padding: '10px 14px', fontSize: '0.9rem', borderRadius: '6px' }}
            >
              <option value="text">Manual Transcript Entry</option>
              <option value="audio">Microphone Audio dictation</option>
              <option value="video">Webcam Video Capture</option>
            </select>
          </div>

          <button
            onClick={handleSubmitStatement}
            className="btn-primary"
            style={{ width: '100%', padding: '12px 0', fontSize: '0.9rem', marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            disabled={isLoading || !speakerName.trim() || !statementText.trim()}
          >
            <Save size={16} />
            {isLoading ? 'ANALYZING STATEMENT...' : 'SUBMIT AND ANALYZE'}
          </button>
        </div>

        {/* Right Side: Capture Media Workspace */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Main capture panel */}
          <div className="glass-panel" style={{
            padding: '24px',
            minHeight: '340px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            position: 'relative'
          }}>
            <h3 className="heading-secondary" style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {mediaType === 'video' ? <Video size={18} /> : mediaType === 'audio' ? <Mic size={18} /> : <FileText size={18} />}
              {mediaType === 'video' ? 'LIVE WEBCAM RECORDING STREAM' : mediaType === 'audio' ? 'MICROPHONE DICTATION INTERFACE' : 'TEXT TRANSCRIPT FIELD'}
            </h3>

            {mediaType === 'video' ? (
              <div style={{
                flex: 1,
                background: '#e2e8f0',
                borderRadius: '8px',
                border: '1px solid rgba(0, 119, 182, 0.15)',
                overflow: 'hidden',
                position: 'relative',
                aspectRatio: '16/9'
              }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(255,255,255,0.85)',
                  padding: '4px 12px',
                  borderRadius: '16px',
                  fontSize: '0.8rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600,
                  color: isRecording ? 'var(--color-crimson)' : 'var(--color-cyan)',
                  border: '1px solid rgba(0, 119, 182, 0.15)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}>
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: isRecording ? 'var(--color-crimson)' : 'var(--color-cyan)',
                    animation: isRecording ? 'blink 0.5s infinite' : 'none'
                  }} />
                  {isRecording ? 'RECORDING_FEED' : 'CAMERA_ACTIVE'}
                </div>
              </div>
            ) : mediaType === 'audio' ? (
              <div style={{
                flex: 1,
                background: 'rgba(255, 255, 255, 0.5)',
                border: '2px dashed rgba(0, 119, 182, 0.2)',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px',
                padding: '40px'
              }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: isRecording ? 'rgba(217, 4, 41, 0.1)' : 'rgba(0, 119, 182, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: isRecording ? 'pulse-slow 1.5s infinite' : 'none',
                  boxShadow: isRecording ? '0 0 15px rgba(217, 4, 41, 0.2)' : 'none'
                }}>
                  {isRecording ? <MicOff size={32} style={{ color: 'var(--color-crimson)' }} /> : <Mic size={32} style={{ color: 'var(--color-cyan)' }} />}
                </div>
                <div style={{ textAlign: 'center' }}>
                  <h4 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', fontSize: '1.05rem', fontWeight: 700 }}>
                    {isRecording ? 'TRANSCRIBING AUDIO STREAM' : 'MICROPHONE READY'}
                  </h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {isRecording ? 'Speak clearly. Dictation text will stream into the workspace below.' : 'Click "Start Recording" to capture statement dictation.'}
                  </p>
                </div>
              </div>
            ) : null}

            {/* Recording Controls */}
            {mediaType !== 'text' && (
              <button
                onClick={toggleRecording}
                className="btn-secondary"
                style={{
                  padding: '12px',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  borderColor: isRecording ? 'var(--color-crimson)' : 'var(--color-cyan)',
                  color: isRecording ? 'var(--color-crimson)' : 'var(--color-cyan)',
                  background: isRecording ? 'rgba(255, 51, 102, 0.05)' : 'rgba(0, 242, 254, 0.05)'
                }}
              >
                {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
                {isRecording ? 'STOP AUDIO RECORDING' : 'START AUDIO RECORDING'}
              </button>
            )}

            {/* Live Text Area for transcript */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label className="label-title">Statement Text / Live Transcript</label>
              <textarea
                className="input-field"
                value={statementText}
                onChange={(e) => setStatementText(e.target.value)}
                placeholder="Transcribed words or pasted testimonies will compile here..."
                style={{
                  height: '180px',
                  padding: '14px',
                  fontSize: '0.9rem',
                  lineHeight: '1.5',
                  resize: 'none'
                }}
                disabled={isRecording && mediaType === 'audio'}
              />
            </div>

          </div>

          {/* Feedback banners */}
          {successMsg && (
            <div style={{
              background: 'rgba(2, 195, 154, 0.1)',
              border: '1px solid rgba(2, 195, 154, 0.3)',
              borderRadius: '8px',
              padding: '12px 16px',
              color: '#019474',
              fontSize: '0.95rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <CheckCircle2 size={20} />
              {successMsg}
            </div>
          )}

          {errorMsg && (
            <div style={{
              background: 'rgba(217, 4, 41, 0.1)',
              border: '1px solid rgba(217, 4, 41, 0.3)',
              borderRadius: '8px',
              padding: '12px 16px',
              color: 'var(--color-crimson)',
              fontSize: '0.95rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={16} />
              {errorMsg}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
