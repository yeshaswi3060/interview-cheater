import React, { useState } from 'react';

interface ApiKeyInputProps {
    onNext: (apiKey: string) => void;
}

const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ onNext }) => {
    const [apiKey, setApiKey] = useState('');

    const handleNext = () => {
        if (apiKey.trim()) {
            onNext(apiKey.trim());
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
            <h2 style={{ marginBottom: '10px', fontWeight: '300', letterSpacing: '1px' }}>GROQ API KEY</h2>
            <p style={{ marginBottom: '30px', color: '#888', fontSize: '14px' }}>Enter your Groq API Key to enable AI features.</p>

            <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="gsk_..."
                style={{
                    width: '100%',
                    maxWidth: '400px',
                    padding: '12px',
                    background: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '4px',
                    color: '#fff',
                    marginBottom: '30px',
                    outline: 'none',
                    fontSize: '14px'
                }}
            />

            <button
                onClick={handleNext}
                disabled={!apiKey.trim()}
                style={{
                    padding: '12px 40px',
                    background: apiKey.trim() ? '#ffffff' : '#333333',
                    color: apiKey.trim() ? '#000000' : '#888888',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: apiKey.trim() ? 'pointer' : 'not-allowed',
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
