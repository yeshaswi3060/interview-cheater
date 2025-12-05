import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import '../styles/Notch.css';
import { testGroqConnection } from '../services/groqService';
import { extractTextFromImage } from '../services/ocrService';
import { captureScreen } from '../services/mediaCapture';
import { startLiveTranscription, stopLiveTranscription } from '../services/transcriptionService';
import SnippingTool from './SnippingTool';

interface NotchProps {
    apiKeys: { groq: string; gemini: string };
    onExit: () => void;
    onSettings: () => void;
}

interface ResponseItem {
    id: number;
    content: string;
    isAnimating: boolean;
}

interface TranscriptItem {
    id: number;
    text: string;
}

// Markdown renderer component - handles code, math, and formatting
const MarkdownContent: React.FC<{ content: string }> = memo(({ content }) => (
    <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
            code({ node, inline, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || '');
                const codeString = String(children).replace(/\n$/, '');

                // Check if it's a code block (has newlines or language specified) vs inline
                const isCodeBlock = !inline && (match || codeString.includes('\n') || codeString.length > 50);

                if (isCodeBlock) {
                    return (
                        <SyntaxHighlighter
                            style={oneDark}
                            language={match ? match[1] : 'text'}
                            PreTag="div"
                            customStyle={{
                                margin: '10px 0',
                                borderRadius: '10px',
                                fontSize: '12px',
                                padding: '14px',
                                background: 'rgba(30, 30, 40, 0.9)'
                            }}
                            {...props}
                        >
                            {codeString}
                        </SyntaxHighlighter>
                    );
                }

                // Inline code
                return (
                    <code
                        style={{
                            background: 'rgba(255, 255, 255, 0.15)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontFamily: "'Fira Code', 'Consolas', 'Monaco', monospace",
                            fontSize: '0.9em'
                        }}
                        {...props}
                    >
                        {children}
                    </code>
                );
            },
            // Proper paragraph styling
            p: ({ children }) => <p style={{ margin: '8px 0', lineHeight: 1.6 }}>{children}</p>,
            // Lists
            ul: ({ children }) => <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>{children}</ul>,
            ol: ({ children }) => <ol style={{ margin: '8px 0', paddingLeft: '20px' }}>{children}</ol>,
            li: ({ children }) => <li style={{ margin: '4px 0' }}>{children}</li>,
            // Headings
            h1: ({ children }) => <h3 style={{ margin: '14px 0 8px', fontSize: '16px', fontWeight: 700, color: '#fff' }}>{children}</h3>,
            h2: ({ children }) => <h4 style={{ margin: '12px 0 6px', fontSize: '15px', fontWeight: 600, color: '#fff' }}>{children}</h4>,
            h3: ({ children }) => <h5 style={{ margin: '10px 0 5px', fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.95)' }}>{children}</h5>,
            // Blockquote
            blockquote: ({ children }) => (
                <blockquote style={{
                    borderLeft: '4px solid rgba(100, 150, 255, 0.6)',
                    margin: '10px 0',
                    paddingLeft: '14px',
                    color: 'rgba(255,255,255,0.8)',
                    fontStyle: 'italic'
                }}>{children}</blockquote>
            ),
            // Tables
            table: ({ children }) => (
                <div style={{ overflowX: 'auto', margin: '10px 0' }}>
                    <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '12px' }}>{children}</table>
                </div>
            ),
            th: ({ children }) => (
                <th style={{
                    border: '1px solid rgba(255,255,255,0.25)',
                    padding: '8px 10px',
                    background: 'rgba(255,255,255,0.12)',
                    fontWeight: 600,
                    textAlign: 'left'
                }}>{children}</th>
            ),
            td: ({ children }) => (
                <td style={{ border: '1px solid rgba(255,255,255,0.15)', padding: '8px 10px' }}>{children}</td>
            ),
            // Strong/Bold
            strong: ({ children }) => <strong style={{ fontWeight: 700, color: '#fff' }}>{children}</strong>,
            // Emphasis/Italic
            em: ({ children }) => <em style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.9)' }}>{children}</em>,
            // Horizontal rule
            hr: () => <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.2)', margin: '12px 0' }} />,
            // Links
            a: ({ href, children }) => (
                <a href={href} style={{ color: '#6ea8fe', textDecoration: 'none' }} target="_blank" rel="noopener noreferrer">
                    {children}
                </a>
            ),
        }}
    >
        {content}
    </ReactMarkdown>
));

const Notch: React.FC<NotchProps> = memo(({ apiKeys, onExit, onSettings }) => {
    const [query, setQuery] = useState('');
    const [currentResponse, setCurrentResponse] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [responses, setResponses] = useState<ResponseItem[]>([]);
    const [isHoveringResponse, setIsHoveringResponse] = useState(false);

    const [isSnipping, setIsSnipping] = useState(false);
    const [screenshotSrc, setScreenshotSrc] = useState<string | null>(null);

    const [ocrText, setOcrText] = useState<string | null>(null);
    const [showOcrActions, setShowOcrActions] = useState(false);

    const [isTranscribing, setIsTranscribing] = useState(false);
    const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
    const [hoveredTranscriptId, setHoveredTranscriptId] = useState<number | null>(null);

    const inputRef = useRef<HTMLInputElement>(null);
    const responseIdRef = useRef(0);
    const transcriptIdRef = useRef(0);

    useEffect(() => {
        (window as any).ipcRenderer.invoke('SET_NOTCH_MODE');
        inputRef.current?.focus();

        return () => {
            stopLiveTranscription();
            (window as any).ipcRenderer.invoke('EXIT_NOTCH_MODE');
        };
    }, []);

    const handleMouseEnter = useCallback(() => {
        (window as any).ipcRenderer.invoke('SET_IGNORE_MOUSE', false);
    }, []);

    const handleMouseLeave = useCallback(() => {
        (window as any).ipcRenderer.invoke('SET_IGNORE_MOUSE', true);
    }, []);

    // Move response to left - pauses when hovering
    useEffect(() => {
        if (currentResponse && !loading && !isHoveringResponse) {
            const timer = setTimeout(() => {
                const newId = ++responseIdRef.current;
                setResponses(prev => [
                    { id: newId, content: currentResponse, isAnimating: true },
                    ...prev
                ]);
                setCurrentResponse(null);

                setTimeout(() => {
                    setResponses(prev =>
                        prev.map(r => r.id === newId ? { ...r, isAnimating: false } : r)
                    );
                }, 500);
            }, 10000);

            return () => clearTimeout(timer);
        }
    }, [currentResponse, loading, isHoveringResponse]);

    const handleKeyDown = useCallback(async (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && query.trim()) {
            if (currentResponse) {
                const newId = ++responseIdRef.current;
                setResponses(prev => [
                    { id: newId, content: currentResponse, isAnimating: false },
                    ...prev
                ]);
            }

            setLoading(true);
            setCurrentResponse(null);
            const userQuery = query;
            setQuery('');

            try {
                const result = await testGroqConnection(apiKeys.groq, [{ role: 'user', content: userQuery }]);
                setCurrentResponse(result);
            } catch (err: any) {
                setCurrentResponse(`Error: ${err.message}`);
            } finally {
                setLoading(false);
            }
        } else if (e.key === 'Escape') {
            setCurrentResponse(null);
            setOcrText(null);
        }
    }, [query, currentResponse, apiKeys.groq]);

    const handleStartSnipping = useCallback(async () => {
        try {
            await (window as any).ipcRenderer.invoke('SET_IGNORE_MOUSE', false);
            await (window as any).ipcRenderer.invoke('MINIMIZE_WINDOW');
            await new Promise(resolve => setTimeout(resolve, 600));

            const imageBase64 = await captureScreen();
            setScreenshotSrc(imageBase64);

            await (window as any).ipcRenderer.invoke('RESTORE_WINDOW');
            await (window as any).ipcRenderer.invoke('SET_FULLSCREEN', true);

            setIsSnipping(true);
        } catch (err: any) {
            setCurrentResponse(`Capture Error: ${err.message}`);
            await (window as any).ipcRenderer.invoke('RESTORE_WINDOW');
            await (window as any).ipcRenderer.invoke('SET_NOTCH_MODE');
        }
    }, []);

    const handleCropConfirm = useCallback(async (croppedImage: string) => {
        setIsSnipping(false);
        setScreenshotSrc(null);

        await (window as any).ipcRenderer.invoke('SET_FULLSCREEN', false);
        await new Promise(resolve => setTimeout(resolve, 100));
        await (window as any).ipcRenderer.invoke('SET_NOTCH_MODE');

        setLoading(true);
        setOcrText('Extracting text...');

        try {
            const text = await extractTextFromImage(croppedImage);
            if (text && text.trim().length > 0) {
                setOcrText(text);
            } else {
                setOcrText('No text found in selected area.');
            }
        } catch (err: any) {
            setOcrText(`OCR Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleCropCancel = useCallback(async () => {
        setIsSnipping(false);
        setScreenshotSrc(null);
        await (window as any).ipcRenderer.invoke('SET_FULLSCREEN', false);
        await new Promise(resolve => setTimeout(resolve, 100));
        await (window as any).ipcRenderer.invoke('SET_NOTCH_MODE');
    }, []);

    const handleExplain = useCallback(async () => {
        if (!ocrText) return;
        setLoading(true);
        setCurrentResponse(null);
        setOcrText(null);

        try {
            const prompt = `Please explain this in detail:\n\n${ocrText}`;
            const result = await testGroqConnection(apiKeys.groq, [{ role: 'user', content: prompt }]);
            setCurrentResponse(result);
        } catch (err: any) {
            setCurrentResponse(`Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, [ocrText, apiKeys.groq]);

    const handleSolve = useCallback(async () => {
        if (!ocrText) return;
        setLoading(true);
        setCurrentResponse(null);
        setOcrText(null);

        try {
            const prompt = `Please solve this step by step, showing all work:\n\n${ocrText}`;
            const result = await testGroqConnection(apiKeys.groq, [{ role: 'user', content: prompt }]);
            setCurrentResponse(result);
        } catch (err: any) {
            setCurrentResponse(`Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, [ocrText, apiKeys.groq]);

    const dismissOcr = useCallback(() => setOcrText(null), []);

    const toggleTranscription = useCallback(() => {
        if (isTranscribing) {
            stopLiveTranscription();
            setIsTranscribing(false);
        } else {
            setIsTranscribing(true);
            setTimeout(() => {
                startLiveTranscription(
                    apiKeys.groq,
                    (text) => {
                        const newId = ++transcriptIdRef.current;
                        setTranscripts(prev => [...prev, { id: newId, text }]);
                    },
                    (error) => {
                        const newId = ++transcriptIdRef.current;
                        setTranscripts(prev => [...prev, { id: newId, text: `Error: ${error}` }]);
                        setIsTranscribing(false);
                    }
                );
            }, 0);
        }
    }, [isTranscribing, apiKeys.groq]);

    // Send transcript to AI with interview context
    const sendTranscriptToAI = useCallback(async (transcriptId: number, transcriptText: string) => {
        // Remove the transcript that was sent
        setTranscripts(prev => prev.filter(t => t.id !== transcriptId));

        // Move current response to left if exists
        if (currentResponse) {
            const newId = ++responseIdRef.current;
            setResponses(prev => [
                { id: newId, content: currentResponse, isAnimating: false },
                ...prev
            ]);
        }

        setLoading(true);
        setCurrentResponse(null);

        try {
            const prompt = `You are helping someone in a job interview. The interviewer just asked the following question. Provide a clear, professional, and concise answer that would impress the interviewer. Be direct and confident.

Interviewer's question: "${transcriptText}"

Provide the best answer:`;

            const result = await testGroqConnection(apiKeys.groq, [{ role: 'user', content: prompt }]);
            setCurrentResponse(result);
        } catch (err: any) {
            setCurrentResponse(`Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, [currentResponse, apiKeys.groq]);

    const clearCurrentResponse = useCallback(() => setCurrentResponse(null), []);

    const clearTranscripts = useCallback(() => {
        setTranscripts([]);
        if (isTranscribing) { stopLiveTranscription(); setIsTranscribing(false); }
    }, [isTranscribing]);

    const removeResponse = useCallback((id: number) => {
        setResponses(prev => prev.filter(r => r.id !== id));
    }, []);

    if (isSnipping && screenshotSrc) {
        return <SnippingTool imageSrc={screenshotSrc} onCrop={handleCropConfirm} onCancel={handleCropCancel} />;
    }

    return (
        <div className="overlay-container">
            {/* RIGHT - Transcript Panel */}
            {(isTranscribing || transcripts.length > 0) && (
                <div className="transcript-panel" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                    <div className="transcript-header">
                        <span className={`transcript-indicator ${isTranscribing ? 'active' : ''}`}></span>
                        <span>Live Transcript</span>
                        <button className="transcript-close" onClick={clearTranscripts}>×</button>
                    </div>
                    <div className="transcript-content">
                        {transcripts.length === 0 ? (
                            <div className="transcript-listening">Listening...</div>
                        ) : (
                            transcripts.map((t) => (
                                <div
                                    key={t.id}
                                    className="transcript-item"
                                    onMouseEnter={() => setHoveredTranscriptId(t.id)}
                                    onMouseLeave={() => setHoveredTranscriptId(null)}
                                >
                                    <div className="transcript-text">{t.text}</div>
                                    {hoveredTranscriptId === t.id && (
                                        <button
                                            className="transcript-send-btn"
                                            onClick={() => sendTranscriptToAI(t.id, t.text)}
                                            disabled={loading}
                                        >
                                            🚀 Answer
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* LEFT - Stacked Responses */}
            {responses.length > 0 && (
                <div className="responses-stack">
                    {responses.map((resp) => (
                        <div
                            key={resp.id}
                            className={`stacked-response ${resp.isAnimating ? 'sliding-in' : ''}`}
                            onMouseEnter={handleMouseEnter}
                            onMouseLeave={handleMouseLeave}
                        >
                            <button className="response-close" onClick={() => removeResponse(resp.id)}>×</button>
                            <div className="stacked-response-content markdown-body">
                                <MarkdownContent content={resp.content} />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* CENTER - Notch */}
            <div className="notch-wrapper">
                <div className="notch-bar" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                    <button className="notch-dot-btn" onClick={onSettings} title="Settings"><span></span></button>
                    <button className="notch-icon-btn" onClick={handleStartSnipping} title="Capture" disabled={loading}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <circle cx="12" cy="12" r="3"></circle>
                            <path d="M20 4h-3.5l-1.5-2h-6L8 4H4.5A1.5 1.5 0 0 0 3 5.5v12A1.5 1.5 0 0 0 4.5 19h15a1.5 1.5 0 0 0 1.5-1.5v-12A1.5 1.5 0 0 0 20 4z"></path>
                        </svg>
                    </button>
                    <input
                        ref={inputRef}
                        type="text"
                        className="notch-input"
                        placeholder="Ask anything..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={loading}
                    />
                    <button
                        className={`notch-icon-btn ${isTranscribing ? 'active' : ''}`}
                        onClick={toggleTranscription}
                        title={isTranscribing ? "Stop" : "Listen"}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                            <line x1="12" y1="19" x2="12" y2="23"></line>
                        </svg>
                    </button>
                </div>

                {/* Current Response */}
                {(currentResponse || loading) && !ocrText && (
                    <div
                        className="notch-response"
                        onMouseEnter={() => { handleMouseEnter(); setIsHoveringResponse(true); }}
                        onMouseLeave={() => { handleMouseLeave(); setIsHoveringResponse(false); }}
                    >
                        <button className="response-close" onClick={clearCurrentResponse}>×</button>
                        {loading && !currentResponse ? (
                            <div className="notch-loading">
                                <div className="notch-spinner"></div>
                                <span>Thinking...</span>
                            </div>
                        ) : (
                            <div className="notch-response-content markdown-body">
                                <MarkdownContent content={currentResponse || ''} />
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* BOTTOM - OCR Panel */}
            {ocrText && (
                <div
                    className="ocr-panel"
                    onMouseEnter={(e) => { handleMouseEnter(); setShowOcrActions(true); }}
                    onMouseLeave={(e) => { handleMouseLeave(); setShowOcrActions(false); }}
                >
                    <button className="response-close" onClick={dismissOcr}>×</button>
                    <div className="ocr-label">Extracted Text</div>
                    <div className="ocr-content">{ocrText}</div>
                    <div className={`ocr-actions ${showOcrActions ? 'visible' : ''}`}>
                        <button className="ocr-action-btn explain" onClick={handleExplain} disabled={loading}>💡 Explain</button>
                        <button className="ocr-action-btn solve" onClick={handleSolve} disabled={loading}>✨ Solve</button>
                    </div>
                </div>
            )}
        </div>
    );
});

export default Notch;
