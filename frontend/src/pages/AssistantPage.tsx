import React, { useState, useEffect, useRef } from 'react';
import { useCase } from '../context/CaseContext';
import { Send, Terminal, Cpu, CheckCircle2, ChevronRight, AlertCircle, FileText, Search } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
}

export default function AssistantPage() {
  const { activeCase } = useCase();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Initialize welcome message
  useEffect(() => {
    if (activeCase) {
      setMessages([
        {
          role: 'assistant',
          content: `KSP Conversational RAG Engine initialized for case: ${activeCase.crime_type} at ${activeCase.location}. I have indexed ${activeCase.statements.length + 1} sources (including primary dispatch and testimonies). Ask me to audit contradictions, list suspicious vehicles, or check witness timelines.`,
          sources: ['Case Database Initialization']
        }
      ]);
    } else {
      setMessages([
        {
          role: 'assistant',
          content: 'KSP Conversational Assistant active. Please select an active investigation case from the header dropdown to load context and begin statement auditing.',
          sources: ['Sys Audit']
        }
      ]);
    }
  }, [activeCase]);

  // Suggested Prompts
  const suggestedPrompts = [
    'Are there contradictions in testimonies?',
    'List all license plates and vehicles mentioned',
    'Who has the highest risk of deception?',
    'Summarize suspect alibis'
  ];

  // Auto scroll
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend: string) => {
    if (!activeCase || !textToSend.trim()) return;

    const userMsg: Message = { role: 'user', content: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      const historyPayload = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: historyPayload,
          statements: activeCase.statements,
          case_narrative: activeCase.narrative
        })
      });

      if (!response.ok) {
        throw new Error(`Chat API status: ${response.status}`);
      }

      const data = await response.json();
      
      // Delay for realistic typing latency
      await new Promise(r => setTimeout(r, 600));

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.reply,
        sources: data.sources || ['Local RAG Index']
      }]);
    } catch (err: any) {
      console.error(err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Connection failed. Standard heuristic search summary:\n- Case Narrative: ${activeCase.narrative}\n- Active Statements Indexed: ${activeCase.statements.length}`,
        sources: ['Fallback Search Log']
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '32px', height: 'calc(100vh - 180px)', width: '100%' }}>
      
      {/* Left Column: Retrieved Case References */}
      <div className="glass-panel" style={{
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        height: '100%',
        overflowY: 'auto'
      }}>
        <h3 className="heading-secondary" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          borderBottom: '1px solid rgba(0, 119, 182, 0.15)',
          paddingBottom: '8px'
        }}>
          <FileText size={18} />
          RETRIEVED CONTEXTS
        </h3>

        {activeCase ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Incident Summary */}
            <div className="interactive-card">
              <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--color-cyan)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>PRIMARY REPORT</span>
              <h4 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 'bold', marginBottom: '4px' }}>{activeCase.crime_type} - {activeCase.location}</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{activeCase.narrative.substring(0, 160)}...</p>
            </div>

            {/* Statements lists */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontWeight: 600 }}>INDEXED TESTIMONIES</span>
              {activeCase.statements.length === 0 ? (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', padding: '10px', border: '1px dashed rgba(0, 119, 182, 0.15)', borderRadius: '6px', textAlign: 'center' }}>
                  No statements recorded yet.
                </div>
              ) : (
                activeCase.statements.map(s => (
                  <div key={s.id} className="interactive-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 'bold' }}>{s.speaker_name}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Role: {s.speaker_role.toUpperCase()}</span>
                    </div>
                    <span className="status-badge" style={{
                      background: s.behavioral_risk.risk_level === 'high' ? 'rgba(217, 4, 41, 0.1)' : 'rgba(0, 119, 182, 0.1)',
                      color: s.behavioral_risk.risk_level === 'high' ? 'var(--color-crimson)' : 'var(--color-cyan)',
                      borderColor: s.behavioral_risk.risk_level === 'high' ? 'rgba(217, 4, 41, 0.2)' : 'rgba(0, 119, 182, 0.2)'
                    }}>
                      {s.behavioral_risk.stress_score}% STRESS
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', textAlign: 'center', gap: '8px' }}>
            <AlertCircle size={24} />
            <p style={{ fontSize: '0.8rem' }}>No references indexed. Select an incident.</p>
          </div>
        )}
      </div>

      {/* Right Column: Full-Page Chat Viewport */}
      <div className="glass-panel" style={{
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden'
      }}>
        {/* Chat header info bar */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid rgba(0, 119, 182, 0.15)',
          background: 'rgba(255, 255, 255, 0.5)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--color-cyan)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Terminal size={18} />
            CONVERSATIONAL CRIME INTELLIGENCE TERMINAL
          </span>
          <span style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-emerald)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Cpu size={16} />
            RAG ACTIVE
          </span>
        </div>

        {/* Messages feed */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          background: 'transparent'
        }}>
          {messages.map((m, index) => {
            const isAssistant = m.role === 'assistant';
            return (
              <div
                key={index}
                style={{
                  alignSelf: isAssistant ? 'flex-start' : 'flex-end',
                  maxWidth: '75%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{
                  background: isAssistant ? '#ffffff' : 'rgba(0, 119, 182, 0.1)',
                  border: `1px solid ${isAssistant ? 'rgba(0, 119, 182, 0.15)' : 'var(--border-cyan)'}`,
                  boxShadow: isAssistant ? 'var(--shadow-sm)' : 'none',
                  padding: '16px 20px',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  lineHeight: '1.6',
                  color: isAssistant ? 'var(--text-primary)' : 'var(--color-cyan)',
                  whiteSpace: 'pre-wrap',
                  fontFamily: isAssistant ? 'var(--font-sans)' : 'var(--font-mono)',
                  fontWeight: isAssistant ? 400 : 500
                }}>
                  {m.content}
                </div>

                {isAssistant && m.sources && m.sources.length > 0 && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.7rem',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-muted)',
                    marginLeft: '8px'
                  }}>
                    <CheckCircle2 size={12} style={{ color: 'var(--color-emerald)' }} />
                    Indexed References: {m.sources.join(', ')}
                  </div>
                )}
              </div>
            );
          })}

          {isTyping && (
            <div style={{
              alignSelf: 'flex-start',
              background: '#ffffff',
              border: '1px solid rgba(0, 119, 182, 0.15)',
              boxShadow: 'var(--shadow-sm)',
              padding: '12px 20px',
              borderRadius: '12px',
              fontSize: '0.95rem',
              color: 'var(--color-cyan)',
              fontFamily: 'var(--font-mono)',
              animation: 'blink 1.2s infinite',
              fontWeight: 600
            }}>
              QUERYING RAG DATABASES...
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Suggested Prompts Grid */}
        {activeCase && (
          <div style={{
            padding: '12px 24px',
            background: 'rgba(255, 255, 255, 0.4)',
            borderTop: '1px solid rgba(0, 119, 182, 0.15)',
            display: 'flex',
            gap: '10px',
            overflowX: 'auto',
            whiteSpace: 'nowrap'
          }}>
            {suggestedPrompts.map((p, index) => (
              <button
                key={index}
                onClick={() => handleSendMessage(p)}
                style={{
                  background: '#ffffff',
                  border: '1px solid var(--border-cyan)',
                  borderRadius: '16px',
                  padding: '8px 16px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: 'var(--color-cyan)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'var(--transition-fast)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 119, 182, 0.05)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = '#ffffff';
                }}
              >
                <ChevronRight size={14} />
                {p}
              </button>
            ))}
          </div>
        )}

        {/* Chat Input Field */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputValue);
          }}
          style={{
            padding: '16px 24px',
            background: 'rgba(255, 255, 255, 0.6)',
            borderTop: '1px solid rgba(0, 119, 182, 0.15)',
            display: 'flex',
            gap: '16px'
          }}
        >
          <input
            type="text"
            className="input-field"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={activeCase ? "Search alibis, suspect timelines, vehicles, and contradictions..." : "Select case above to start chat..."}
            style={{ fontSize: '1rem', padding: '14px 18px', borderRadius: '8px' }}
            disabled={isTyping || !activeCase}
          />
          <button
            type="submit"
            className="btn-primary"
            style={{ padding: '0 24px', borderRadius: '8px' }}
            disabled={isTyping || !activeCase || !inputValue.trim()}
          >
            <Send size={18} />
          </button>
        </form>

      </div>

    </div>
  );
}
