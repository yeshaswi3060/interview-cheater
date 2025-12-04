import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { testGroqConnection } from '../services/groqService';

interface ApiTestProps {
    apiKey: string;
    onFinish: () => void;
    onBack: () => void;
}

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

const ApiTest: React.FC<ApiTestProps> = ({ apiKey, onFinish, onBack }) => {
    const [message, setMessage] = useState('');
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [testPassed, setTestPassed] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [chatHistory]);

    useEffect(() => {
        const savedHistory = localStorage.getItem('chatHistory');
        const lastMessageTime = localStorage.getItem('lastMessageTime');

        if (savedHistory && lastMessageTime) {
            const timeSinceLastMessage = Date.now() - parseInt(lastMessageTime);
            const twelveHoursInMs = 12 * 60 * 60 * 1000;

            if (timeSinceLastMessage > twelveHoursInMs) {
                // Expired, clear history
                localStorage.removeItem('chatHistory');
                localStorage.removeItem('lastMessageTime');
                setChatHistory([]);
            } else {
                // Valid, load history
                setChatHistory(JSON.parse(savedHistory));
                setTestPassed(true); // Assume passed if we have history
            }
        }
    }, []);

    const handleTest = async () => {
        if (!message.trim()) return;

        const newUserMessage: ChatMessage = {
            role: 'user',
            content: message,
            timestamp: Date.now()
        };

        const updatedHistory = [...chatHistory, newUserMessage];
        setChatHistory(updatedHistory);
        setMessage('');
        setLoading(true);
        setError('');

        try {
            // Prepare messages for API (exclude timestamp)
            const apiMessages = updatedHistory.map(({ role, content }) => ({ role, content }));

            const result = await testGroqConnection(apiKey, apiMessages);

            const newAiMessage: ChatMessage = {
                role: 'assistant',
                content: result,
                timestamp: Date.now()
            };

            const finalHistory = [...updatedHistory, newAiMessage];
            setChatHistory(finalHistory);
            setTestPassed(true);

            // Save to localStorage
            localStorage.setItem('chatHistory', JSON.stringify(finalHistory));
            localStorage.setItem('lastMessageTime', Date.now().toString());

        } catch (err: any) {
            setError(err.message);
            setTestPassed(false);
        } finally {
            setLoading(false);
        }
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
            `}</style>
            <h2 style={{ marginBottom: '10px', fontWeight: '300', letterSpacing: '1px' }}>TEST API CONNECTION</h2>
            <p style={{ marginBottom: '20px', color: '#888', fontSize: '14px' }}>
                Conversation history is preserved for 12 hours.
            </p>

            <div style={{
                width: '100%',
                maxWidth: '600px',
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
                        No messages yet. Start a conversation!
                    </div>
                )}
                {chatHistory.map((msg, index) => (
                    <div key={index} style={{
                        alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        maxWidth: '80%',
                        padding: '10px 15px',
                        borderRadius: '12px',
                        background: msg.role === 'user' ? '#333' : '#222',
                        color: '#fff',
                        border: '1px solid #444'
                    }}>
                        <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>
                            {msg.role === 'user' ? 'You' : 'AI'}
                        </div>
                        <div className="markdown-content">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    code({ node, inline, className, children, ...props }: any) {
                                        const match = /language-(\w+)/.exec(className || '');
                                        return !inline && match ? (
                                            <SyntaxHighlighter
                                                style={vscDarkPlus}
                                                language={match[1]}
                                                PreTag="div"
                                                {...props}
                                            >
                                                {String(children).replace(/\n$/, '')}
                                            </SyntaxHighlighter>
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

            {error && (
                <div style={{ color: '#ff4444', marginBottom: '10px', fontSize: '14px' }}>
                    Error: {error}
                </div>
            )}

            <div style={{ width: '100%', maxWidth: '600px', display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type a message..."
                    style={{
                        flex: 1,
                        padding: '12px',
                        background: '#1a1a1a',
                        border: '1px solid #333',
                        borderRadius: '4px',
                        color: '#fff',
                        outline: 'none',
                        fontSize: '14px'
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleTest()}
                />
                <button
                    onClick={handleTest}
                    disabled={loading || !message.trim()}
                    style={{
                        padding: '0 20px',
                        background: loading ? '#333' : '#ffffff',
                        color: loading ? '#888' : '#000000',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: loading || !message.trim() ? 'not-allowed' : 'pointer',
                        fontWeight: '500'
                    }}
                >
                    {loading ? 'SENDING...' : 'SEND'}
                </button>
            </div>

            <div style={{ display: 'flex', gap: '20px' }}>
                <button
                    onClick={onBack}
                    style={{
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
                    }}
                >
                    BACK
                </button>
                <button
                    onClick={onFinish}
                    disabled={!testPassed}
                    style={{
                        padding: '12px 40px',
                        background: testPassed ? '#ffffff' : '#333333',
                        color: testPassed ? '#000000' : '#888888',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: testPassed ? 'pointer' : 'not-allowed',
                        fontSize: '14px',
                        fontWeight: '500',
                        letterSpacing: '1px',
                        transition: 'all 0.2s ease'
                    }}
                >
                    FINISH
                </button>
            </div>
        </div>
    );
};

export default ApiTest;
