import React, { useState } from 'react';

const LANGUAGES = [
    'English', 'Spanish', 'French', 'German', 'Hindi',
    'Chinese', 'Japanese', 'Russian', 'Portuguese', 'Italian'
];

interface ResponseLanguageSelectionProps {
    onFinish: (languages: string[]) => void;
    onBack: () => void;
}

const ResponseLanguageSelection: React.FC<ResponseLanguageSelectionProps> = ({ onFinish, onBack }) => {
    const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

    const toggleLanguage = (lang: string) => {
        if (selectedLanguages.includes(lang)) {
            setSelectedLanguages(selectedLanguages.filter(l => l !== lang));
        } else {
            if (selectedLanguages.length < 2) {
                setSelectedLanguages([...selectedLanguages, lang]);
            } else {
                // Optional: Replace the first selected one if user clicks a 3rd one, 
                // or just do nothing. Let's do nothing but maybe shake or show max reached?
                // For simplicity/UX, let's just not add it.
            }
        }
    };

    const handleFinish = () => {
        if (selectedLanguages.length > 0) {
            onFinish(selectedLanguages);
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
            <h2 style={{ marginBottom: '10px', fontWeight: '300', letterSpacing: '1px' }}>SELECT RESPONSE LANGUAGES</h2>
            <p style={{ marginBottom: '30px', color: '#888', fontSize: '14px' }}>Select up to 2 languages for responses.</p>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                gap: '15px',
                width: '100%',
                maxWidth: '600px',
                marginBottom: '40px'
            }}>
                {LANGUAGES.map(lang => (
                    <div
                        key={lang}
                        onClick={() => toggleLanguage(lang)}
                        style={{
                            padding: '15px',
                            border: `1px solid ${selectedLanguages.includes(lang) ? '#ffffff' : '#333333'}`,
                            borderRadius: '8px',
                            cursor: 'pointer',
                            textAlign: 'center',
                            background: selectedLanguages.includes(lang) ? '#1a1a1a' : 'transparent',
                            opacity: (!selectedLanguages.includes(lang) && selectedLanguages.length >= 2) ? 0.5 : 1,
                            transition: 'all 0.2s ease',
                            fontSize: '14px'
                        }}
                    >
                        {lang}
                    </div>
                ))}
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
                    onClick={handleFinish}
                    disabled={selectedLanguages.length === 0}
                    style={{
                        padding: '12px 40px',
                        background: selectedLanguages.length > 0 ? '#ffffff' : '#333333',
                        color: selectedLanguages.length > 0 ? '#000000' : '#888888',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: selectedLanguages.length > 0 ? 'pointer' : 'not-allowed',
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

export default ResponseLanguageSelection;
