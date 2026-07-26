import React, { useState, useEffect, useRef } from 'react';
import { Send, Terminal, MessageSquare, Cpu, CheckCircle2, ChevronRight } from 'lucide-react';
import { Statement } from '../types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
}

interface ConversationalAssistantProps {
  caseNarrative: string;
  statements: Statement[];
}

export default function ConversationalAssistant({ caseNarrative, statements }: ConversationalAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'KSP Conversational Investigation System initialized. I have indexed the case files and statements. Ask me to cross-reference testimonies, isolate alibi timelines, or search for getaway vehicle plates.',
      sources: ['Sys Init']
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Suggested questions based on context
  const suggestions = [
    'Are there timeline contradictions?',
    'List all getaway vehicle details',
    'Who has the highest behavioral risk?',
    'Summarize suspect alibis'
  ];

  // Auto scroll to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: Message = { role: 'user', content: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      // Map messages history to backend schema
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
          statements: statements,
          case_narrative: caseNarrative
        })
      });

      if (!response.ok) {
        throw new Error(`Chat API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Simulate slight typing latency for cyber aesthetics
      await new Promise(r => setTimeout(r, 600));

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.reply,
        sources: data.sources || ['Local RAG Engine']
      }]);
    } catch (err: any) {
      console.error(err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error connecting to KSP Chat Engine. Falling back to local index. Main Narrative: ${caseNarrative.substring(0, 100)}...`,
        sources: ['Local Error Log']
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="glass-panel" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      borderTop: 'none',
      borderLeft: 'none',
      borderRight: 'none',
      borderRadius: '0',
      padding: '0'
    }}>
      {/* Header bar */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid rgba(0, 119, 182, 0.15)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(255, 255, 255, 0.5)'
      }}>
        <span className="heading-secondary" style={{
          fontSize: '0.8rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Terminal size={14} />
          CONVERSATIONAL ASSISTANT (KSP INTEL)
        </span>
        <span style={{
          fontSize: '0.7rem',
          fontFamily: 'var(--font-mono)',
          fontWeight: 600,
          color: 'var(--color-emerald)',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <Cpu size={12} />
          RAG_INDEX: {statements.length + 1} SOURCES
        </span>
      </div>

      {/* Messages area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        background: 'transparent'
      }}>
        {messages.map((m, idx) => {
          const isAssistant = m.role === 'assistant';
          return (
            <div
              key={idx}
              style={{
                alignSelf: isAssistant ? 'flex-start' : 'flex-end',
                maxWidth: '85%',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              {/* Message Bubble */}
              <div style={{
                background: isAssistant ? '#ffffff' : 'rgba(0, 119, 182, 0.1)',
                border: `1px solid ${isAssistant ? 'rgba(0, 119, 182, 0.15)' : 'var(--border-cyan)'}`,
                boxShadow: isAssistant ? 'var(--shadow-sm)' : 'none',
                padding: '12px 16px',
                borderRadius: '10px',
                fontSize: '0.9rem',
                color: isAssistant ? 'var(--text-primary)' : 'var(--color-cyan)',
                lineHeight: '1.5',
                whiteSpace: 'pre-wrap',
                fontFamily: isAssistant ? 'var(--font-sans)' : 'var(--font-mono)',
                fontWeight: isAssistant ? 400 : 500
              }}>
                {m.content}
              </div>

              {/* RAG sources tags */}
              {isAssistant && m.sources && m.sources.length > 0 && (
                <div style={{
                  display: 'flex',
                  gap: '4px',
                  alignItems: 'center',
                  fontSize: '0.6rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-muted)',
                  marginLeft: '4px'
                }}>
                  <CheckCircle2 size={10} style={{ color: 'var(--color-emerald)' }} />
                  Sources cited: {m.sources.join(', ')}
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
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '0.85rem',
            color: 'var(--color-cyan)',
            fontFamily: 'var(--font-mono)',
            animation: 'blink 1s infinite',
            fontWeight: 600
          }}>
            SYSTEM IS COMPILING DISCREPANCIES...
          </div>
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Suggested Questions */}
      <div style={{
        padding: '8px 16px',
        background: 'rgba(255, 255, 255, 0.4)',
        borderTop: '1px solid rgba(0, 119, 182, 0.15)',
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        whiteSpace: 'nowrap'
      }}>
        {suggestions.map((s, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(s)}
            style={{
              background: '#ffffff',
              border: '1px solid var(--border-cyan)',
              borderRadius: '12px',
              padding: '6px 12px',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--color-cyan)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              transition: 'var(--transition-fast)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(0, 119, 182, 0.05)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = '#ffffff';
            }}
          >
            <ChevronRight size={12} />
            {s}
          </button>
        ))}
      </div>

      {/* Chat Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(inputValue);
        }}
        style={{
          padding: '12px 16px',
          background: 'rgba(255, 255, 255, 0.6)',
          borderTop: '1px solid rgba(0, 119, 182, 0.15)',
          display: 'flex',
          gap: '12px'
        }}
      >
        <input
          type="text"
          className="input-field"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask AI about timelines, vehicle plates, or suspect behavior..."
          style={{ fontSize: '0.9rem', padding: '10px 14px' }}
          disabled={isTyping}
        />
        <button
          type="submit"
          className="btn-primary"
          style={{ padding: '0 16px' }}
          disabled={isTyping || !inputValue.trim()}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
