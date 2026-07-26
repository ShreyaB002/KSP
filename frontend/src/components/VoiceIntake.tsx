import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Sparkles, AlertTriangle } from 'lucide-react';

interface VoiceIntakeProps {
  onAnalysisComplete: (data: any, rawText: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export default function VoiceIntake({ onAnalysisComplete, isLoading, setIsLoading }: VoiceIntakeProps) {
  const [narrativeText, setNarrativeText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recognitionSupported, setRecognitionSupported] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check for speech recognition support in the browser
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setRecognitionSupported(false);
      return;
    }

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
        setNarrativeText((prev) => {
          const separator = prev.endsWith(' ') || prev.length === 0 ? '' : ' ';
          return prev + separator + finalTranscript;
        });
      }
    };

    rec.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      if (event.error !== 'no-speech') {
        setErrorMsg(`Speech recognition error: ${event.error}`);
        setIsRecording(false);
      }
    };

    rec.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = rec;
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) return;

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      setErrorMsg(null);
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error(err);
        setErrorMsg('Failed to start recording. Please check microphone permissions.');
      }
    }
  };

  const handleProcessNarrative = async () => {
    if (!narrativeText.trim()) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: narrativeText }),
      });
      
      if (!response.ok) {
        throw new Error(`Server returned code ${response.status}`);
      }
      
      const structuredData = await response.json();
      onAnalysisComplete(structuredData, narrativeText);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`Analysis failed: ${err.message || 'Unknown error'}. Check that your FastAPI backend is running on port 8000.`);
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      padding: '16px',
      background: '#ffffff',
      borderTop: '1px solid rgba(0, 119, 182, 0.15)',
      boxShadow: '0 -4px 20px rgba(0, 119, 182, 0.1)',
      position: 'relative'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span className="heading-secondary" style={{
          fontSize: '0.9rem',
          color: 'var(--color-cyan)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          border: 'none',
          padding: 0
        }}>
          <Sparkles size={16} />
          FORENSIC INCIDENT NARRATIVE INTAKE
        </span>
        
        {!recognitionSupported && (
          <span style={{
            fontSize: '0.7rem',
            color: 'var(--color-amber)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontFamily: 'var(--font-mono)'
          }}>
            <AlertTriangle size={12} />
            SpeechRecognition Not Supported
          </span>
        )}
      </div>

      <div style={{ display: 'flex', gap: '12px', flex: 1, minHeight: 0 }}>
        {/* Transcription text area */}
        <div style={{ position: 'relative', flex: 1 }}>
          <textarea
            className="input-field"
            value={narrativeText}
            onChange={(e) => setNarrativeText(e.target.value)}
            placeholder="Dictate or type police narrative report. (e.g., 'At 10:45 PM near Greenwood Park, a robbery occurred. The suspect was described as a tall man wearing a black leather jacket. He escaped in a black SUV with license plate 7XYZ89. The witness heard him refer to the Syndicate gang.')"
            style={{
              height: '100%',
              resize: 'none',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.85rem',
              paddingRight: '40px',
              paddingBottom: '20px',
              lineHeight: '1.4'
            }}
            disabled={isLoading}
          />
          {narrativeText && (
            <button
              onClick={() => setNarrativeText('')}
              style={{
                position: 'absolute',
                right: '12px',
                top: '12px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)'
              }}
              title="Clear narrative"
            >
              CLEAR
            </button>
          )}
        </div>

        {/* Audio control & Process actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '150px', justifyContent: 'center' }}>
          {recognitionSupported && (
            <button
              onClick={toggleRecording}
              className="btn-secondary"
              style={{
                borderColor: isRecording ? 'var(--color-crimson)' : 'rgba(0, 119, 182, 0.3)',
                color: isRecording ? 'var(--color-crimson)' : 'var(--text-primary)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                height: '70px',
                background: isRecording ? 'rgba(217, 4, 41, 0.1)' : 'rgba(0, 119, 182, 0.05)',
                boxShadow: isRecording ? '0 0 15px rgba(217, 4, 41, 0.2)' : 'none'
              }}
              disabled={isLoading}
            >
              {isRecording ? (
                <>
                  <MicOff size={20} />
                  <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-display)', fontWeight: 'bold' }}>STOP DICTATION</span>
                </>
              ) : (
                <>
                  <Mic size={20} style={{ color: 'var(--color-cyan)' }} />
                  <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-display)', fontWeight: 'bold' }}>START VOICE</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={handleProcessNarrative}
            className="btn-primary"
            style={{ height: '70px', display: 'flex', flexDirection: 'column', gap: '6px' }}
            disabled={isLoading || !narrativeText.trim()}
          >
            <Send size={18} />
            <span style={{ fontSize: '0.75rem' }}>{isLoading ? 'ANALYZING...' : 'PROCESS'}</span>
          </button>
        </div>
      </div>

      {/* Recording Waveform Overlay */}
      {isRecording && (
        <div style={{
          position: 'absolute',
          bottom: '16px',
          left: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          background: 'rgba(255, 255, 255, 0.9)',
          padding: '6px 12px',
          borderRadius: '20px',
          border: '1px solid var(--color-crimson)',
          boxShadow: '0 0 10px rgba(217, 4, 41, 0.2)'
        }}>
          <span style={{ width: '4px', height: '12px', background: 'var(--color-crimson)', animation: 'blink 0.5s infinite ease-in-out' }} />
          <span style={{ width: '4px', height: '18px', background: 'var(--color-crimson)', animation: 'blink 0.5s infinite ease-in-out 0.1s' }} />
          <span style={{ width: '4px', height: '8px', background: 'var(--color-crimson)', animation: 'blink 0.5s infinite ease-in-out 0.2s' }} />
          <span style={{ width: '4px', height: '15px', background: 'var(--color-crimson)', animation: 'blink 0.5s infinite ease-in-out 0.15s' }} />
          <span style={{ fontSize: '0.65rem', color: 'var(--color-crimson)', fontFamily: 'var(--font-mono)', fontWeight: 'bold', marginLeft: '4px' }}>LISTENING...</span>
        </div>
      )}

      {errorMsg && (
        <div style={{
          position: 'absolute',
          bottom: '2px',
          left: '16px',
          right: '16px',
          fontSize: '0.7rem',
          color: 'var(--color-crimson)',
          background: 'rgba(255, 51, 102, 0.1)',
          padding: '2px 8px',
          border: '1px solid rgba(255, 51, 102, 0.2)',
          borderRadius: '4px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          zIndex: 10
        }}>
          {errorMsg}
        </div>
      )}
    </div>
  );
}
