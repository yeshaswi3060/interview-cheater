import React, { useState } from 'react';

const LANGUAGES = [
    'English', 'Spanish', 'French', 'German', 'Hindi',
    'Chinese', 'Japanese', 'Russian', 'Portuguese', 'Italian'
];

interface InputLanguageSelectionProps {
    onNext: (languages: string[]) => void;
}

const InputLanguageSelection: React.FC<InputLanguageSelectionProps> = ({ onNext }) => {
    const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

    const toggleLanguage = (lang: string) => {
        if (selectedLanguages.includes(lang)) {
            setSelectedLanguages(selectedLanguages.filter(l => l !== lang));
        } else {
            setSelectedLanguages([...selectedLanguages, lang]);
        }
    };

    const handleNext = () => {
        if (selectedLanguages.length > 0) {
            onNext(selectedLanguages);
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
            <h2 style={{ marginBottom: '10px', fontWeight: '300', letterSpacing: '1px' }}>SELECT INPUT LANGUAGES</h2>
            <p style={{ marginBottom: '30px', color: '#888', fontSize: '14px' }}>Select one or more languages you will speak/type in.</p>

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
                            transition: 'all 0.2s ease',
                            fontSize: '14px'
                        }}
                    >
                        {lang}
                    </div>
                ))}
            </div>

            <button
                onClick={handleNext}
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
                NEXT
            </button>
        </div>
    );
};

export default InputLanguageSelection;
