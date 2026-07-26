import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Video, VideoOff, Send, HelpCircle, User, AlertCircle, FileText } from 'lucide-react';
import { Statement } from '../types';

interface StatementIntakeProps {
  onAddStatement: (statement: Statement) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export default function StatementIntake({ onAddStatement, isLoading, setIsLoading }: StatementIntakeProps) {
  // Speaker Attributes
  const [speakerName, setSpeakerName] = useState('');
  const [speakerRole, setSpeakerRole] = useState<'suspect' | 'witness' | 'victim'>('witness');
  const [mediaType, setMediaType] = useState<'audio' | 'video' | 'text'>('text');
  
  // Statement capture states
  const [statementText, setStatementText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Speech Recognition & Video Refs
  const recognitionRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    // Check SpeechRecognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setStatementText(prev => prev + (prev.endsWith(' ') || prev.length === 0 ? '' : ' ') + finalTranscript);
        }
      };

      rec.onerror = (event: any) => {
        if (event.error !== 'no-speech') {
          console.error(event.error);
        }
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  // Handle webcam video capture setup
  const startCamera = async () => {
    try {
      const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(localStream);
      if (videoRef.current) {
        videoRef.current.srcObject = localStream;
      }
    } catch (err) {
      console.error("Failed to access camera", err);
      setErrorMsg("Webcam access denied. Defaulting to audio dictation.");
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
      if (!speakerName.trim()) {
        setErrorMsg("Please specify the speaker's name before recording.");
        return;
      }
      try {
        if (recognitionRef.current) {
          recognitionRef.current.start();
          setIsRecording(true);
        } else {
          setErrorMsg("Speech recognition is not supported in this browser. Please type statement.");
        }
      } catch (err) {
        console.error(err);
        setErrorMsg("Failed to start speech recording.");
      }
    }
  };

  const handleSubmitStatement = async () => {
    if (!speakerName.trim() || !statementText.trim()) return;
    setIsLoading(true);
    setErrorMsg(null);

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

      onAddStatement(newStatement);
      
      // Reset text inputs
      setStatementText('');
      setSpeakerName('');
      stopCamera();
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to analyze statement. Ensure your backend is running.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-panel" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      padding: '12px 16px',
      borderBottom: 'none',
      borderLeft: 'none',
      borderRight: 'none',
      borderRadius: '0',
      boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.05)',
      position: 'relative'
    }}>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span className="heading-secondary" style={{
          fontSize: '0.8rem',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <FileText size={14} />
          STATEMENT INTAKE (AUDIO/VIDEO/TEXT)
        </span>
      </div>

      <div style={{ display: 'flex', gap: '12px', flex: 1, minHeight: 0 }}>
        
        {/* Left Side fields: Name, Role, Format */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '180px' }}>
          <div>
            <label className="label-title" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>Speaker Name</label>
            <input
              type="text"
              className="input-field"
              value={speakerName}
              onChange={(e) => setSpeakerName(e.target.value)}
              placeholder="e.g. Witness Marcus"
              style={{ padding: '8px', fontSize: '0.85rem', borderRadius: '4px' }}
              disabled={isLoading}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            <div>
              <label className="label-title" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>Role</label>
              <select
                value={speakerRole}
                onChange={(e: any) => setSpeakerRole(e.target.value)}
                className="input-field"
                style={{ padding: '6px', fontSize: '0.8rem', borderRadius: '4px' }}
                disabled={isLoading}
              >
                <option value="witness">Witness</option>
                <option value="suspect">Suspect</option>
                <option value="victim">Victim</option>
              </select>
            </div>
            
            <div>
              <label className="label-title" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>Format</label>
              <select
                value={mediaType}
                onChange={(e: any) => setMediaType(e.target.value)}
                className="input-field"
                style={{ padding: '6px', fontSize: '0.8rem', borderRadius: '4px' }}
                disabled={isLoading}
              >
                <option value="text">Text Input</option>
                <option value="audio">Audio Mic</option>
                <option value="video">Video CAM</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleSubmitStatement}
            className="btn-primary"
            style={{ width: '100%', padding: '10px 0', fontSize: '0.8rem', marginTop: 'auto' }}
            disabled={isLoading || !speakerName.trim() || !statementText.trim()}
          >
            <Send size={14} />
            {isLoading ? 'ANALYZING...' : 'COMMIT STATEMENT'}
          </button>
        </div>

        {/* Middle: webcam feed or text area */}
        <div style={{ flex: 1, position: 'relative', height: '100%' }}>
          {mediaType === 'video' ? (
            <div style={{
              width: '100%',
              height: '100%',
              background: '#e2e8f0',
              borderRadius: '6px',
              border: '1px solid rgba(0, 119, 182, 0.15)',
              overflow: 'hidden',
              position: 'relative'
            }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              {/* Record reticle overlay */}
              <div style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255,255,255,0.85)',
                padding: '4px 10px',
                borderRadius: '10px',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                color: isRecording ? 'var(--color-crimson)' : 'var(--color-cyan)'
              }}>
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: isRecording ? 'var(--color-crimson)' : 'var(--color-cyan)',
                  animation: isRecording ? 'blink 0.5s infinite' : 'none'
                }} />
                {isRecording ? 'LIVE_FEED_RECORDING' : 'CAMERA_PREVIEW'}
              </div>
            </div>
          ) : (
            <textarea
              className="input-field"
              value={statementText}
              onChange={(e) => setStatementText(e.target.value)}
              placeholder={
                mediaType === 'audio'
                  ? "Click 'Record Speech' to dictate. Ensure your microphone is connected."
                  : "Paste statement transcript here (e.g. 'I was walking along Koramangala 80 Feet Rd around 10:40 PM. Suddenly, a loud alarm rang. I saw a tall man wearing a black leather jacket running out of the jewelry store. He got into a black SUV and fled.')"
              }
              style={{
                height: '100%',
                resize: 'none',
                fontSize: '0.9rem',
                padding: '12px',
                fontFamily: 'var(--font-sans)',
                lineHeight: '1.5'
              }}
              disabled={isLoading || (mediaType === 'audio' && !isRecording)}
            />
          )}
        </div>

        {/* Right Side: Recording buttons and text transcript indicator */}
        {mediaType !== 'text' && (
          <div style={{ display: 'flex', flexDirection: 'column', width: '130px', gap: '8px', justifyContent: 'center' }}>
            <button
              onClick={toggleRecording}
              className="btn-secondary"
              style={{
                height: '80px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                background: isRecording ? 'rgba(217, 4, 41, 0.1)' : 'rgba(255, 255, 255, 0.9)',
                borderColor: isRecording ? 'var(--color-crimson)' : 'var(--border-cyan)'
              }}
            >
              {isRecording ? (
                <>
                  <MicOff size={24} style={{ color: 'var(--color-crimson)' }} />
                  <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-display)', color: 'var(--color-crimson)', fontWeight: 700 }}>STOP REC</span>
                </>
              ) : (
                <>
                  <Mic size={24} style={{ color: 'var(--color-cyan)' }} />
                  <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-display)', color: 'var(--color-cyan)', fontWeight: 700 }}>START REC</span>
                </>
              )}
            </button>
            
            {/* Real-time transcribed preview box when recording camera */}
            {mediaType === 'video' && (
              <div style={{
                flex: 1,
                border: '1px solid rgba(0, 119, 182, 0.15)',
                background: 'rgba(255,255,255,0.85)',
                padding: '8px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                overflowY: 'auto',
                color: 'var(--text-secondary)'
              }}>
                <strong style={{ display: 'block', fontSize: '0.65rem', color: 'var(--color-cyan)', marginBottom: '4px' }}>SPEECH_PREVIEW:</strong>
                {statementText || 'Awaiting dictation stream...'}
              </div>
            )}
          </div>
        )}
      </div>

      {errorMsg && (
        <div style={{
          position: 'absolute',
          bottom: '2px',
          left: '16px',
          right: '16px',
          fontSize: '0.65rem',
          color: 'var(--color-crimson)',
          background: 'rgba(255, 51, 102, 0.1)',
          padding: '2px 8px',
          border: '1px solid rgba(255, 51, 102, 0.2)',
          borderRadius: '4px',
          zIndex: 20
        }}>
          {errorMsg}
        </div>
      )}
    </div>
  );
}
