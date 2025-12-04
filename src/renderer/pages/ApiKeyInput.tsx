import React, { useState } from 'react';

interface ApiKeyInputProps {
    onNext: (keys: { groq: string; gemini: string }) => void;
}

const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ onNext }) => {
    const [groqKey, setGroqKey] = useState('');
    const [geminiKey, setGeminiKey] = useState('');

    const handleNext = () => {
        if (groqKey.trim() && geminiKey.trim()) {
            onNext({
                groq: groqKey.trim(),
                gemini: geminiKey.trim()
            });
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
            padding: '20px',
            overflowY: 'auto'
        }}>
            <h2 style={{ marginBottom: '10px', fontWeight: '300', letterSpacing: '1px' }}>API CONFIGURATION</h2>
            <p style={{ marginBottom: '30px', color: '#888', fontSize: '14px' }}>Enter your API Keys to enable AI features.</p>

            <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '30px' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: '#aaa' }}>GROQ API KEY</label>
                    <input
                        type="password"
                        value={groqKey}
                        onChange={(e) => setGroqKey(e.target.value)}
                        placeholder="gsk_..."
                        style={{
                            width: '100%',
                            padding: '12px',
                            background: '#1a1a1a',
                            border: '1px solid #333',
                            borderRadius: '4px',
                            color: '#fff',
                            outline: 'none',
                            fontSize: '14px'
                        }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: '#aaa' }}>GEMINI API KEY (VISION)</label>
                    <input
                        type="password"
                        value={geminiKey}
                        onChange={(e) => setGeminiKey(e.target.value)}
                        placeholder="AIza..."
                        style={{
                            width: '100%',
                            padding: '12px',
                            background: '#1a1a1a',
                            border: '1px solid #333',
                            borderRadius: '4px',
                            color: '#fff',
                            outline: 'none',
                            fontSize: '14px'
                        }}
                    />
                </div>
            </div>

            <button
                onClick={handleNext}
                disabled={!groqKey.trim() || !geminiKey.trim()}
                style={{
                    padding: '12px 40px',
                    background: (groqKey.trim() && geminiKey.trim()) ? '#ffffff' : '#333333',
                    color: (groqKey.trim() && geminiKey.trim()) ? '#000000' : '#888888',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: (groqKey.trim() && geminiKey.trim()) ? 'pointer' : 'not-allowed',
                    fontSize: '14px',
                    fontWeight: '500',
                    letterSpacing: '1px',
                    transition: 'all 0.2s ease'
                }}
            >
                NEXT
            </button>
        </div>
    );
};

export default ApiKeyInput;
