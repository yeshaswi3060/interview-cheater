import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { testGroqConnection } from '../services/groqService';
import { extractTextFromImage } from '../services/ocrService';
import { captureScreen } from '../services/mediaCapture';
import { startLiveTranscription, stopLiveTranscription } from '../services/transcriptionService';
import SnippingTool from '../components/SnippingTool';

interface ApiTestProps {
    apiKeys: { groq: string; groq2: string };
    userProfile?: any;
    onFinish: () => void;
    onBack: () => void;
}

interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
}

const ApiTest: React.FC<ApiTestProps> = ({ apiKeys, userProfile, onFinish, onBack }) => {
    const [message, setMessage] = useState('');
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);

    // Snipping Tool State
    const [isSnipping, setIsSnipping] = useState(false);
    const [screenshotSrc, setScreenshotSrc] = useState<string | null>(null);

    // Test Statuses
    const [groqStatus, setGroqStatus] = useState<'pending' | 'success' | 'failure'>('pending');
    const [groq2Status, setGroq2Status] = useState<'pending' | 'success' | 'failure'>('pending');
    const [ocrStatus, setOcrStatus] = useState<'pending' | 'success' | 'failure'>('pending');

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [chatHistory]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopLiveTranscription();
        };
    }, []);

    const addLog = (content: string, type: 'system' | 'assistant' | 'user' = 'system') => {
        setChatHistory(prev => [...prev, { role: type, content, timestamp: Date.now() }]);
    };

    const handleGroqTest = async () => {
        if (!message.trim()) return;

        const userMsg = message;
        setMessage('');
        addLog(userMsg, 'user');
        setLoading(true);

        try {
            const response = await testGroqConnection(apiKeys.groq, [{ role: 'user', content: userMsg }], userProfile);
            addLog(response, 'assistant');
            setGroqStatus('success');
        } catch (err: any) {
            addLog(`Groq Error: ${err.message}`, 'system');
            setGroqStatus('failure');
        } finally {
            setLoading(false);
        }
    };

    const handleGroq2Test = async () => {
        setLoading(true);
        addLog('Testing GROQ #2 (Audio Analysis API)...', 'system');

        try {
            const response = await testGroqConnection(apiKeys.groq2, [{ role: 'user', content: 'Say hello briefly. This is a connection test for the audio analysis API.' }]);
            addLog(`GROQ #2 Response: ${response}`, 'assistant');
            setGroq2Status('success');
        } catch (err: any) {
            addLog(`GROQ #2 Error: ${err.message}`, 'system');
            setGroq2Status('failure');
        } finally {
            setLoading(false);
        }
    };

    const handleStartSnipping = async () => {
        setLoading(true);
        try {
            // 1. Minimize the window to reveal the desktop
            await (window as any).ipcRenderer.minimizeWindow();

            // 2. Wait for animation (500ms)
            await new Promise(resolve => setTimeout(resolve, 500));

            // 3. Capture the screen (now clean)
            const imageBase64 = await captureScreen();
            setScreenshotSrc(imageBase64);

            // 4. Restore window and go full screen for selection
            await (window as any).ipcRenderer.restoreWindow();
            await (window as any).ipcRenderer.setFullscreen(true);

            setIsSnipping(true);
        } catch (err: any) {
            addLog(`Screen Capture Error: ${err.message}`, 'system');
            // Ensure we restore if something fails
            await (window as any).ipcRenderer.restoreWindow();
        } finally {
            setLoading(false);
        }
    };

    const handleCropConfirm = async (croppedImage: string) => {
        setIsSnipping(false);
        setScreenshotSrc(null);

        // Restore normal window state
        await (window as any).ipcRenderer.setFullscreen(false);

        setLoading(true);
        addLog('Extracting text from selected area...', 'system');

        try {
            const text = await extractTextFromImage(croppedImage);

            if (text && text.trim().length > 0) {
                addLog(`Extracted Text (Region):\n\n${text}`, 'assistant');
                setOcrStatus('success');
            } else {
                addLog('No text found in the selected area.', 'system');
                setOcrStatus('failure');
            }
        } catch (err: any) {
            addLog(`OCR Error: ${err.message}`, 'system');
            setOcrStatus('failure');
        } finally {
            setLoading(false);
        }
    };

    const handleCropCancel = async () => {
        setIsSnipping(false);
        setScreenshotSrc(null);
        // Restore normal window state
        await (window as any).ipcRenderer.setFullscreen(false);
    };

    const toggleLiveTranscription = () => {
        if (isTranscribing) {
            stopLiveTranscription();
            setIsTranscribing(false);
            addLog('Live transcription stopped.', 'system');
        } else {
            addLog('Starting live transcription... (Listening for system audio)', 'system');
            setIsTranscribing(true);
            startLiveTranscription(
                apiKeys.groq,
                (text) => {
                    addLog(`Transcript: ${text}`, 'assistant');
                },
                (error) => {
                    addLog(`Transcription Error: ${error}`, 'system');
                    setIsTranscribing(false);
                }
            );
        }
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            background: '#000000',
            color: '#ffffff',
            padding: '20px'
        }}>
            <style>{`
                .markdown-content p { margin-bottom: 10px; line-height: 1.5; }
                .markdown-content ul, .markdown-content ol { margin-bottom: 10px; padding-left: 20px; }
                .markdown-content li { margin-bottom: 5px; }
                .markdown-content h1, .markdown-content h2, .markdown-content h3 { margin-top: 15px; margin-bottom: 10px; font-weight: 600; color: #fff; }
                .markdown-content a { color: #4da6ff; text-decoration: none; }
                .markdown-content a:hover { text-decoration: underline; }
                .markdown-content blockquote { border-left: 3px solid #555; padding-left: 10px; color: #aaa; margin: 10px 0; }
                .code-block-wrapper { position: relative; margin-bottom: 10px; }
                .copy-button {
                    position: absolute;
                    top: 5px;
                    right: 5px;
                    background: #333;
                    color: #fff;
                    border: 1px solid #555;
                    border-radius: 4px;
                    padding: 2px 6px;
                    font-size: 10px;
                    cursor: pointer;
                    z-index: 10;
                }
                .copy-button:hover { background: #444; }
                .pulse {
                    animation: pulse-animation 2s infinite;
                }
                @keyframes pulse-animation {
                    0% { box-shadow: 0 0 0 0 rgba(255, 0, 0, 0.4); }
                    70% { box-shadow: 0 0 0 10px rgba(255, 0, 0, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(255, 0, 0, 0); }
                }
            `}</style>

            {isSnipping && screenshotSrc && (
                <SnippingTool
                    imageSrc={screenshotSrc}
                    onCrop={handleCropConfirm}
                    onCancel={handleCropCancel}
                />
            )}

            <h2 style={{ marginBottom: '10px', fontWeight: '300', letterSpacing: '1px' }}>SYSTEM CHECK</h2>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <span style={{ color: groqStatus === 'success' ? '#4caf50' : groqStatus === 'failure' ? '#f44336' : '#888' }}>GROQ: {groqStatus.toUpperCase()}</span>
                <span style={{ color: '#333' }}>|</span>
                <span style={{ color: groq2Status === 'success' ? '#4caf50' : groq2Status === 'failure' ? '#f44336' : '#888' }}>GROQ #2: {groq2Status.toUpperCase()}</span>
                <span style={{ color: '#333' }}>|</span>
                <span style={{ color: ocrStatus === 'success' ? '#4caf50' : ocrStatus === 'failure' ? '#f44336' : '#888' }}>OCR: {ocrStatus.toUpperCase()}</span>
            </div>

            <div style={{
                width: '100%',
                maxWidth: '700px',
                flex: 1,
                overflowY: 'auto',
                marginBottom: '20px',
                padding: '10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '15px',
                border: '1px solid #333',
                borderRadius: '8px',
                background: '#111'
            }}>
                {chatHistory.length === 0 && (
                    <div style={{ textAlign: 'center', color: '#666', marginTop: '20px' }}>
                        Run tests to verify connections.
                    </div>
                )}
                {chatHistory.map((msg, index) => (
                    <div key={index} style={{
                        alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        maxWidth: '90%',
                        padding: '10px 15px',
                        borderRadius: '12px',
                        background: msg.role === 'user' ? '#333' : msg.role === 'system' ? '#222' : '#1a1a1a',
                        color: msg.role === 'system' ? '#aaa' : '#fff',
                        border: '1px solid #444',
                        fontSize: msg.role === 'system' ? '13px' : '14px'
                    }}>
                        <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px', textTransform: 'uppercase' }}>
                            {msg.role}
                        </div>
                        <div className="markdown-content">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    code({ node, inline, className, children, ...props }: any) {
                                        const match = /language-(\w+)/.exec(className || '');
                                        const codeText = String(children).replace(/\n$/, '');
                                        return !inline && match ? (
                                            <div className="code-block-wrapper">
                                                <button className="copy-button" onClick={() => handleCopy(codeText)}>Copy</button>
                                                <SyntaxHighlighter
                                                    style={vscDarkPlus}
                                                    language={match[1]}
                                                    PreTag="div"
                                                    {...props}
                                                >
                                                    {codeText}
                                                </SyntaxHighlighter>
                                            </div>
                                        ) : (
                                            <code className={className} {...props} style={{ background: '#444', padding: '2px 4px', borderRadius: '4px' }}>
                                                {children}
                                            </code>
                                        );
                                    }
                                }}
                            >
                                {msg.content}
                            </ReactMarkdown>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <div style={{ width: '100%', maxWidth: '700px', display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type to test Groq..."
                    style={{
                        flex: 1,
                        padding: '12px',
                        background: '#1a1a1a',
                        border: '1px solid #333',
                        borderRadius: '4px',
                        color: '#fff',
                        outline: 'none',
                        fontSize: '14px',
                        minWidth: '200px'
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleGroqTest()}
                />
                <button onClick={handleGroqTest} disabled={loading || !message.trim()} style={buttonStyle}>TEST GROQ</button>
                <button onClick={handleGroq2Test} disabled={loading} style={buttonStyle}>TEST GROQ #2</button>
                <button onClick={handleStartSnipping} disabled={loading} style={buttonStyle}>SELECT AREA</button>
                <button
                    onClick={toggleLiveTranscription}
                    style={{
                        ...buttonStyle,
                        background: isTranscribing ? '#f44336' : '#333',
                        color: '#fff',
                        className: isTranscribing ? 'pulse' : ''
                    } as any}
                >
                    {isTranscribing ? 'STOP LISTENING' : 'START LISTENING'}
                </button>
            </div>

            <div style={{ display: 'flex', gap: '20px' }}>
                <button onClick={onBack} style={secondaryButtonStyle}>BACK</button>
                <button
                    onClick={onFinish}
                    disabled={groqStatus !== 'success' || groq2Status !== 'success' || ocrStatus !== 'success'}
                    style={{
                        ...primaryButtonStyle,
                        background: (groqStatus === 'success' && groq2Status === 'success' && ocrStatus === 'success') ? '#fff' : '#333',
                        color: (groqStatus === 'success' && groq2Status === 'success' && ocrStatus === 'success') ? '#000' : '#888',
                        cursor: (groqStatus === 'success' && groq2Status === 'success' && ocrStatus === 'success') ? 'pointer' : 'not-allowed'
                    }}
                >
                    FINISH
                </button>
            </div>
        </div>
    );
};

const buttonStyle: React.CSSProperties = {
    padding: '0 15px',
    background: '#333',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '12px',
    height: '42px',
    whiteSpace: 'nowrap'
};

const primaryButtonStyle: React.CSSProperties = {
    padding: '12px 40px',
    background: '#ffffff',
    color: '#000000',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    letterSpacing: '1px',
    transition: 'all 0.2s ease'
};

const secondaryButtonStyle: React.CSSProperties = {
    padding: '12px 40px',
    background: 'transparent',
    color: '#ffffff',
    border: '1px solid #333',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    letterSpacing: '1px',
    transition: 'all 0.2s ease'
};

export default ApiTest;
