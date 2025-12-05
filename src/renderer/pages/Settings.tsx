import React, { useState, useCallback, useEffect, memo } from 'react';
import '../styles/Settings.css';
import { testGroqConnection } from '../services/groqService';

interface SettingsProps {
    apiKeys: { groq: string; gemini: string };
    userProfile: any;
    onBack: () => void;
    onUpdateApiKeys: (keys: { groq: string; gemini: string }) => void;
    onUpdateProfile: (profile: any) => void;
}

type SettingsSection = 'keybindings' | 'resume' | 'assistant' | 'profile' | 'appearance';

interface KeyBinding {
    id: string;
    name: string;
    description: string;
    keys: string;
}

interface AIAssistant {
    id: string;
    name: string;
    mode: string;
    personality: string;
    isActive: boolean;
}

// AI Mode presets
const AI_MODES = [
    { id: 'interview', name: 'Interview Helper', description: 'Professional interview responses', icon: '💼', systemPrompt: 'You are a professional interview coach. Help answer interview questions with clear, confident, and impressive responses. Be concise and professional.' },
    { id: 'study', name: 'Study Buddy', description: 'Learning and education focus', icon: '📚', systemPrompt: 'You are a helpful study assistant. Explain concepts clearly, provide examples, and help with learning. Be patient and educational.' },
    { id: 'meeting', name: 'Meeting Assistant', description: 'For meetings and presentations', icon: '🎯', systemPrompt: 'You are a meeting assistant. Help with presentations, summarize points, and provide professional insights. Be concise and business-focused.' },
    { id: 'coding', name: 'Code Helper', description: 'Programming and technical help', icon: '💻', systemPrompt: 'You are a programming assistant. Help with code, explain technical concepts, debug issues, and suggest best practices. Be precise and technical.' },
    { id: 'creative', name: 'Creative Mode', description: 'Fun and creative responses', icon: '✨', systemPrompt: 'You are a creative and fun assistant. Be witty, engaging, and imaginative. Feel free to be playful while still being helpful.' },
    { id: 'custom', name: 'Custom', description: 'Create your own AI personality', icon: '⚙️', systemPrompt: '' },
];

// Premium SVG Icons
const Icons = {
    keyboard: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="2" y="4" width="20" height="14" rx="2" />
            <line x1="6" y1="8" x2="6" y2="8" strokeLinecap="round" />
            <line x1="10" y1="8" x2="10" y2="8" strokeLinecap="round" />
            <line x1="14" y1="8" x2="14" y2="8" strokeLinecap="round" />
            <line x1="18" y1="8" x2="18" y2="8" strokeLinecap="round" />
            <line x1="6" y1="12" x2="18" y2="12" strokeLinecap="round" />
        </svg>
    ),
    document: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
            <polyline points="14,2 14,8 20,8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
    ),
    bot: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="11" width="18" height="10" rx="2" />
            <circle cx="12" cy="5" r="2" />
            <path d="M12 7v4" />
            <circle cx="8" cy="16" r="1" />
            <circle cx="16" cy="16" r="1" />
        </svg>
    ),
    user: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    ),
    palette: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="13.5" cy="6.5" r="1.5" />
            <circle cx="17.5" cy="10.5" r="1.5" />
            <circle cx="8.5" cy="7.5" r="1.5" />
            <circle cx="6.5" cy="12.5" r="1.5" />
            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 011.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z" />
        </svg>
    ),
    check: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20,6 9,17 4,12" />
        </svg>
    ),
    x: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    ),
    upload: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="17,8 12,3 7,8" />
            <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
    ),
    loader: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="2" x2="12" y2="6" />
            <line x1="12" y1="18" x2="12" y2="22" />
            <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
            <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
            <line x1="2" y1="12" x2="6" y2="12" />
            <line x1="18" y1="12" x2="22" y2="12" />
        </svg>
    ),
    sparkle: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4" />
        </svg>
    )
};

const Settings: React.FC<SettingsProps> = memo(({
    apiKeys,
    userProfile,
    onBack,
    onUpdateApiKeys,
    onUpdateProfile
}) => {
    const [activeSection, setActiveSection] = useState<SettingsSection>('keybindings');
    const [saveStatus, setSaveStatus] = useState<{ [key: string]: 'idle' | 'saving' | 'saved' | 'error' }>({});
    const [showQuitModal, setShowQuitModal] = useState(false);

    // Key bindings state
    const [keyBindings, setKeyBindings] = useState<KeyBinding[]>(() => {
        const saved = localStorage.getItem('keyBindings');
        return saved ? JSON.parse(saved) : [
            { id: 'capture', name: 'Screen Capture', description: 'Take a screenshot for OCR', keys: 'Ctrl+Shift+C' },
            { id: 'transcribe', name: 'Toggle Transcription', description: 'Start/stop live transcription', keys: 'Ctrl+Shift+T' },
            { id: 'ask', name: 'Submit Query', description: 'Send query to AI', keys: 'Enter' },
            { id: 'dismiss', name: 'Dismiss Response', description: 'Close current AI response', keys: 'Escape' },
        ];
    });
    const [recordingKeyFor, setRecordingKeyFor] = useState<string | null>(null);
    const [currentKeys, setCurrentKeys] = useState<Set<string>>(new Set());

    // Resume state
    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [resumeText, setResumeText] = useState<string>(() => localStorage.getItem('resumeText') || '');
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessingResume, setIsProcessingResume] = useState(false);

    // AI Assistant state
    const [selectedMode, setSelectedMode] = useState<string>(() => localStorage.getItem('aiMode') || 'interview');
    const [customPrompt, setCustomPrompt] = useState<string>(() => localStorage.getItem('aiCustomPrompt') || '');
    const [assistantName, setAssistantName] = useState<string>(() => localStorage.getItem('aiAssistantName') || 'AI Assistant');
    const [testingAssistant, setTestingAssistant] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; response: string } | null>(null);

    // Profile state
    const [profile, setProfile] = useState(() => ({
        name: userProfile?.name || localStorage.getItem('profileName') || '',
        education: userProfile?.education || localStorage.getItem('profileEducation') || '',
        skills: userProfile?.skills || localStorage.getItem('profileSkills') || '',
        experience: userProfile?.experience || localStorage.getItem('profileExperience') || '',
        projects: userProfile?.projects || localStorage.getItem('profileProjects') || ''
    }));

    // Appearance state
    const [appearance, setAppearance] = useState(() => ({
        theme: localStorage.getItem('theme') || 'dark',
        notchSize: localStorage.getItem('notchSize') || 'medium',
        fontSize: localStorage.getItem('fontSize') || 'medium',
        transparency: parseInt(localStorage.getItem('transparency') || '85')
    }));

    const navItems = [
        { id: 'keybindings' as SettingsSection, icon: Icons.keyboard, label: 'Key Bindings' },
        { id: 'resume' as SettingsSection, icon: Icons.document, label: 'Resume' },
        { id: 'assistant' as SettingsSection, icon: Icons.bot, label: 'AI Assistant' },
        { id: 'profile' as SettingsSection, icon: Icons.user, label: 'Profile' },
        { id: 'appearance' as SettingsSection, icon: Icons.palette, label: 'Appearance' },
    ];

    // KEY BINDINGS - Fixed multi-key recording
    useEffect(() => {
        if (!recordingKeyFor) return;

        const pressedKeys = new Set<string>();

        const handleKeyDown = (e: KeyboardEvent) => {
            e.preventDefault();
            e.stopPropagation();

            let key = '';
            if (e.key === 'Control') key = 'Ctrl';
            else if (e.key === 'Shift') key = 'Shift';
            else if (e.key === 'Alt') key = 'Alt';
            else if (e.key === 'Meta') key = 'Cmd';
            else if (e.key === ' ') key = 'Space';
            else if (e.key.length === 1) key = e.key.toUpperCase();
            else key = e.key;

            pressedKeys.add(key);
            setCurrentKeys(new Set(pressedKeys));
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            e.preventDefault();

            // When releasing, if we have keys recorded, save them
            if (pressedKeys.size > 0) {
                const keyArray = Array.from(pressedKeys);
                // Sort: modifiers first, then regular keys
                const modifiers = ['Ctrl', 'Shift', 'Alt', 'Cmd'];
                const sorted = [
                    ...keyArray.filter(k => modifiers.includes(k)),
                    ...keyArray.filter(k => !modifiers.includes(k))
                ];

                const newKeys = sorted.join('+');

                setKeyBindings(prev => {
                    const updated = prev.map(b =>
                        b.id === recordingKeyFor ? { ...b, keys: newKeys } : b
                    );
                    localStorage.setItem('keyBindings', JSON.stringify(updated));
                    return updated;
                });

                setRecordingKeyFor(null);
                setCurrentKeys(new Set());
                pressedKeys.clear();
                showSaveStatus('keybindings', 'saved');
            }
        };

        window.addEventListener('keydown', handleKeyDown, true);
        window.addEventListener('keyup', handleKeyUp, true);

        return () => {
            window.removeEventListener('keydown', handleKeyDown, true);
            window.removeEventListener('keyup', handleKeyUp, true);
        };
    }, [recordingKeyFor]);

    const startRecordingKey = useCallback((bindingId: string) => {
        setRecordingKeyFor(bindingId);
        setCurrentKeys(new Set());
    }, []);

    const cancelRecording = useCallback(() => {
        setRecordingKeyFor(null);
        setCurrentKeys(new Set());
    }, []);

    const resetKeyBindings = useCallback(() => {
        const defaults = [
            { id: 'capture', name: 'Screen Capture', description: 'Take a screenshot for OCR', keys: 'Ctrl+Shift+C' },
            { id: 'transcribe', name: 'Toggle Transcription', description: 'Start/stop live transcription', keys: 'Ctrl+Shift+T' },
            { id: 'ask', name: 'Submit Query', description: 'Send query to AI', keys: 'Enter' },
            { id: 'dismiss', name: 'Dismiss Response', description: 'Close current AI response', keys: 'Escape' },
        ];
        setKeyBindings(defaults);
        localStorage.setItem('keyBindings', JSON.stringify(defaults));
        showSaveStatus('keybindings', 'saved');
    }, []);

    // RESUME FUNCTIONALITY - Now integrates with AI
    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            processFile(files[0]);
        }
    }, []);

    const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            processFile(files[0]);
        }
    }, []);

    const processFile = useCallback((file: File) => {
        setResumeFile(file);
        setIsProcessingResume(true);

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            setResumeText(text);
            localStorage.setItem('resumeText', text);
            setIsProcessingResume(false);
            showSaveStatus('resume', 'saved');
        };
        reader.onerror = () => {
            setIsProcessingResume(false);
        };
        reader.readAsText(file);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const saveResumeText = useCallback(() => {
        localStorage.setItem('resumeText', resumeText);
        // Also update the system prompt to include resume
        const currentMode = AI_MODES.find(m => m.id === selectedMode);
        if (currentMode && resumeText) {
            const enhancedPrompt = `${currentMode.systemPrompt}\n\nUser's Resume/Background:\n${resumeText}`;
            localStorage.setItem('aiSystemPrompt', enhancedPrompt);
        }
        showSaveStatus('resume', 'saved');
    }, [resumeText, selectedMode]);

    const clearResume = useCallback(() => {
        setResumeFile(null);
        setResumeText('');
        localStorage.removeItem('resumeText');
    }, []);

    // AI ASSISTANT FUNCTIONALITY
    const saveAssistant = useCallback(() => {
        localStorage.setItem('aiMode', selectedMode);
        localStorage.setItem('aiAssistantName', assistantName);

        const modeConfig = AI_MODES.find(m => m.id === selectedMode);
        let finalPrompt = '';

        if (selectedMode === 'custom') {
            finalPrompt = customPrompt;
            localStorage.setItem('aiCustomPrompt', customPrompt);
        } else if (modeConfig) {
            finalPrompt = modeConfig.systemPrompt;
        }

        // Add resume context if available
        if (resumeText) {
            finalPrompt += `\n\nUser's Background/Resume:\n${resumeText}`;
        }

        // Add profile context if available
        if (profile.name || profile.skills || profile.experience) {
            finalPrompt += `\n\nUser Profile:\nName: ${profile.name}\nSkills: ${profile.skills}\nExperience: ${profile.experience}`;
        }

        localStorage.setItem('aiSystemPrompt', finalPrompt);
        showSaveStatus('assistant', 'saved');
    }, [selectedMode, customPrompt, assistantName, resumeText, profile]);

    const testAssistant = useCallback(async () => {
        setTestingAssistant(true);
        setTestResult(null);

        try {
            const modeConfig = AI_MODES.find(m => m.id === selectedMode);
            let systemPrompt = selectedMode === 'custom' ? customPrompt : (modeConfig?.systemPrompt || '');

            if (resumeText) {
                systemPrompt += `\n\nUser's Background:\n${resumeText.substring(0, 500)}...`;
            }

            const response = await testGroqConnection(apiKeys.groq, [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: 'Introduce yourself briefly and explain how you can help me.' }
            ]);

            setTestResult({ success: true, response });
        } catch (err: any) {
            setTestResult({ success: false, response: err.message || 'Failed to connect' });
        } finally {
            setTestingAssistant(false);
        }
    }, [selectedMode, customPrompt, resumeText, apiKeys.groq]);

    // PROFILE FUNCTIONALITY
    const saveProfile = useCallback(() => {
        const updatedProfile = { ...profile };
        localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
        localStorage.setItem('profileName', profile.name);
        localStorage.setItem('profileEducation', profile.education);
        localStorage.setItem('profileSkills', profile.skills);
        localStorage.setItem('profileExperience', profile.experience);
        localStorage.setItem('profileProjects', profile.projects);
        onUpdateProfile(updatedProfile);
        showSaveStatus('profile', 'saved');
    }, [profile, onUpdateProfile]);

    // APPEARANCE FUNCTIONALITY
    const saveAppearance = useCallback(() => {
        localStorage.setItem('theme', appearance.theme);
        localStorage.setItem('notchSize', appearance.notchSize);
        localStorage.setItem('fontSize', appearance.fontSize);
        localStorage.setItem('transparency', appearance.transparency.toString());
        document.documentElement.setAttribute('data-theme', appearance.theme);
        showSaveStatus('appearance', 'saved');
    }, [appearance]);

    const resetAppearance = useCallback(() => {
        const defaults = { theme: 'dark', notchSize: 'medium', fontSize: 'medium', transparency: 85 };
        setAppearance(defaults);
        Object.entries(defaults).forEach(([key, value]) => {
            localStorage.setItem(key, value.toString());
        });
        document.documentElement.setAttribute('data-theme', defaults.theme);
        showSaveStatus('appearance', 'saved');
    }, []);

    const showSaveStatus = (section: string, status: 'saved' | 'error') => {
        setSaveStatus(prev => ({ ...prev, [section]: status }));
        setTimeout(() => {
            setSaveStatus(prev => ({ ...prev, [section]: 'idle' }));
        }, 2000);
    };

    // QUIT APP FUNCTIONALITY
    const handleQuitApp = useCallback(() => {
        // Use Electron's window close
        const electronWindow = window as any;
        if (electronWindow.electron?.ipcRenderer) {
            electronWindow.electron.ipcRenderer.send('app-quit');
        } else {
            window.close();
        }
    }, []);

    // Render section content
    const renderSectionContent = () => {
        switch (activeSection) {
            case 'keybindings':
                return (
                    <div className="settings-section-content">
                        <div className="section-header">
                            <h2>Key Bindings</h2>
                            <p>Click on a shortcut and press your desired key combination (e.g., Ctrl+Shift+K)</p>
                        </div>
                        <div className="keybindings-list">
                            {keyBindings.map((binding) => (
                                <div key={binding.id} className="keybinding-item">
                                    <div className="keybinding-info">
                                        <span className="keybinding-name">{binding.name}</span>
                                        <span className="keybinding-description">{binding.description}</span>
                                    </div>
                                    <button
                                        className={`keybinding-keys-btn ${recordingKeyFor === binding.id ? 'recording' : ''}`}
                                        onClick={() => recordingKeyFor === binding.id ? cancelRecording() : startRecordingKey(binding.id)}
                                    >
                                        {recordingKeyFor === binding.id ? (
                                            currentKeys.size > 0 ? (
                                                Array.from(currentKeys).map((k, i) => (
                                                    <span key={i}>
                                                        <span className="key-badge recording">{k}</span>
                                                        {i < currentKeys.size - 1 && <span className="key-plus">+</span>}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="recording-text">Press keys...</span>
                                            )
                                        ) : (
                                            binding.keys.split('+').map((k, i) => (
                                                <span key={i}>
                                                    <span className="key-badge">{k}</span>
                                                    {i < binding.keys.split('+').length - 1 && <span className="key-plus">+</span>}
                                                </span>
                                            ))
                                        )}
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="section-actions">
                            <button className="btn-secondary" onClick={resetKeyBindings}>Reset to Defaults</button>
                            {saveStatus.keybindings === 'saved' && <span className="save-indicator">Saved</span>}
                        </div>
                    </div>
                );

            case 'resume':
                return (
                    <div className="settings-section-content">
                        <div className="section-header">
                            <h2>Resume & Background</h2>
                            <p>Your resume helps the AI understand your background and provide personalized responses</p>
                        </div>
                        <div
                            className={`resume-dropzone ${isDragging ? 'dragging' : ''} ${resumeFile ? 'has-file' : ''}`}
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                        >
                            {isProcessingResume ? (
                                <div className="processing">
                                    <span className="processing-icon">{Icons.loader}</span>
                                    <span>Processing file...</span>
                                </div>
                            ) : resumeFile ? (
                                <div className="resume-file-info">
                                    <span className="file-icon">{Icons.document}</span>
                                    <span className="file-name">{resumeFile.name}</span>
                                    <button className="btn-remove" onClick={clearResume}>{Icons.x}</button>
                                </div>
                            ) : (
                                <>
                                    <span className="dropzone-icon">{Icons.upload}</span>
                                    <span className="dropzone-text">Drag & drop your resume here</span>
                                    <span className="dropzone-hint">or click to browse</span>
                                    <input
                                        type="file"
                                        accept=".txt,.pdf,.docx"
                                        onChange={handleFileInput}
                                        className="file-input-hidden"
                                    />
                                </>
                            )}
                        </div>
                        <div className="resume-content-area">
                            <h3>Your Background</h3>
                            <p className="hint">Write about yourself, your experience, skills, and what you're looking for. The AI will use this to personalize responses.</p>
                            <textarea
                                value={resumeText}
                                onChange={(e) => setResumeText(e.target.value)}
                                placeholder="Example: I am a software engineer with 3 years of experience in React and Node.js. I'm currently preparing for senior developer interviews at top tech companies. I have experience in building scalable web applications and leading small teams..."
                                rows={12}
                            />
                        </div>
                        <div className="section-actions">
                            <button className="btn-primary" onClick={saveResumeText}>Save & Apply to AI</button>
                            <button className="btn-secondary" onClick={clearResume}>Clear</button>
                            {saveStatus.resume === 'saved' && <span className="save-indicator">Saved</span>}
                        </div>
                    </div>
                );

            case 'assistant':
                return (
                    <div className="settings-section-content">
                        <div className="section-header">
                            <h2>Create Your AI Assistant</h2>
                            <p>Customize how your AI behaves and responds to you</p>
                        </div>

                        <div className="form-group">
                            <label>Assistant Name</label>
                            <input
                                type="text"
                                value={assistantName}
                                onChange={(e) => setAssistantName(e.target.value)}
                                placeholder="My AI Assistant"
                            />
                        </div>

                        <div className="ai-modes-section">
                            <label>Select Mode</label>
                            <div className="ai-modes-grid">
                                {AI_MODES.map((mode) => (
                                    <button
                                        key={mode.id}
                                        className={`ai-mode-card ${selectedMode === mode.id ? 'active' : ''}`}
                                        onClick={() => setSelectedMode(mode.id)}
                                    >
                                        <span className="mode-icon">{mode.icon}</span>
                                        <span className="mode-name">{mode.name}</span>
                                        <span className="mode-description">{mode.description}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {selectedMode === 'custom' && (
                            <div className="form-group custom-prompt-area">
                                <label>Custom Instructions</label>
                                <textarea
                                    value={customPrompt}
                                    onChange={(e) => setCustomPrompt(e.target.value)}
                                    placeholder="Tell the AI how to behave. For example: 'You are a friendly tutor who explains complex topics in simple terms. Always provide examples and be encouraging.'"
                                    rows={5}
                                />
                            </div>
                        )}

                        {resumeText && (
                            <div className="context-indicator">
                                <span className="indicator-icon">{Icons.check}</span>
                                <span>Your resume/background will be included in AI context</span>
                            </div>
                        )}

                        {testResult && (
                            <div className={`test-result ${testResult.success ? 'success' : 'error'}`}>
                                <div className="test-result-header">
                                    {testResult.success ? 'AI Response:' : 'Error:'}
                                </div>
                                <div className="test-result-content">{testResult.response}</div>
                            </div>
                        )}

                        <div className="section-actions">
                            <button className="btn-primary" onClick={saveAssistant}>Save Assistant</button>
                            <button className="btn-secondary" onClick={testAssistant} disabled={testingAssistant}>
                                {testingAssistant ? 'Testing...' : 'Test Assistant'}
                            </button>
                            {saveStatus.assistant === 'saved' && <span className="save-indicator">Saved</span>}
                        </div>
                    </div>
                );

            case 'profile':
                return (
                    <div className="settings-section-content">
                        <div className="section-header">
                            <h2>Profile</h2>
                            <p>Your profile helps the AI provide more relevant responses</p>
                        </div>
                        <div className="settings-form">
                            <div className="form-group">
                                <label>Full Name</label>
                                <input
                                    type="text"
                                    value={profile.name}
                                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                    placeholder="John Doe"
                                />
                            </div>
                            <div className="form-group">
                                <label>Education</label>
                                <textarea
                                    value={profile.education}
                                    onChange={(e) => setProfile({ ...profile, education: e.target.value })}
                                    placeholder="Bachelor's in Computer Science from MIT..."
                                    rows={2}
                                />
                            </div>
                            <div className="form-group">
                                <label>Skills</label>
                                <textarea
                                    value={profile.skills}
                                    onChange={(e) => setProfile({ ...profile, skills: e.target.value })}
                                    placeholder="JavaScript, React, Node.js, Python..."
                                    rows={2}
                                />
                            </div>
                            <div className="form-group">
                                <label>Experience</label>
                                <textarea
                                    value={profile.experience}
                                    onChange={(e) => setProfile({ ...profile, experience: e.target.value })}
                                    placeholder="5 years as Full Stack Developer..."
                                    rows={3}
                                />
                            </div>
                            <div className="form-group">
                                <label>Notable Projects</label>
                                <textarea
                                    value={profile.projects}
                                    onChange={(e) => setProfile({ ...profile, projects: e.target.value })}
                                    placeholder="Led development of microservices architecture..."
                                    rows={3}
                                />
                            </div>
                        </div>
                        <div className="section-actions">
                            <button className="btn-primary" onClick={saveProfile}>Save Profile</button>
                            {saveStatus.profile === 'saved' && <span className="save-indicator">Saved</span>}
                        </div>
                    </div>
                );

            case 'appearance':
                return (
                    <div className="settings-section-content">
                        <div className="section-header">
                            <h2>Appearance</h2>
                            <p>Customize the look of the application</p>
                        </div>
                        <div className="settings-form">
                            <div className="form-group">
                                <label>Theme</label>
                                <div className="theme-selector">
                                    {[
                                        { id: 'dark', label: 'Dark', icon: '◐' },
                                        { id: 'light', label: 'Light', icon: '○' },
                                        { id: 'system', label: 'System', icon: '◑' }
                                    ].map((theme) => (
                                        <button
                                            key={theme.id}
                                            className={`theme-option ${appearance.theme === theme.id ? 'active' : ''}`}
                                            onClick={() => setAppearance({ ...appearance, theme: theme.id })}
                                        >
                                            <span className="theme-icon">{theme.icon}</span>
                                            <span>{theme.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Notch Size</label>
                                <div className="size-selector">
                                    {['small', 'medium', 'large'].map((size) => (
                                        <button
                                            key={size}
                                            className={`size-option ${appearance.notchSize === size ? 'active' : ''}`}
                                            onClick={() => setAppearance({ ...appearance, notchSize: size })}
                                        >
                                            {size.charAt(0).toUpperCase() + size.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Transparency: {appearance.transparency}%</label>
                                <input
                                    type="range"
                                    min="50"
                                    max="100"
                                    value={appearance.transparency}
                                    onChange={(e) => setAppearance({ ...appearance, transparency: parseInt(e.target.value) })}
                                />
                            </div>
                        </div>
                        <div className="section-actions">
                            <button className="btn-primary" onClick={saveAppearance}>Apply</button>
                            <button className="btn-secondary" onClick={resetAppearance}>Reset</button>
                            {saveStatus.appearance === 'saved' && <span className="save-indicator">Applied</span>}
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="settings-container">
            <div className="settings-sidebar">
                <div className="settings-sidebar-header">
                    <button className="back-button" onClick={onBack}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h1>Settings</h1>
                </div>
                <nav className="settings-nav">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            className={`settings-nav-item ${activeSection === item.id ? 'active' : ''}`}
                            onClick={() => setActiveSection(item.id)}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            <span className="nav-label">{item.label}</span>
                        </button>
                    ))}
                </nav>
                <div className="settings-sidebar-footer">
                    <button className="quit-btn" onClick={() => setShowQuitModal(true)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                            <polyline points="16,17 21,12 16,7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        <span>Quit App</span>
                    </button>
                    <span className="version">v1.0.0</span>
                </div>
            </div>
            <div className="settings-main">
                {renderSectionContent()}
            </div>

            {/* Quit Confirmation Modal */}
            {showQuitModal && (
                <div className="modal-overlay" onClick={() => setShowQuitModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-icon warning">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                                <line x1="12" y1="9" x2="12" y2="13" />
                                <line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                        </div>
                        <h3>Quit Application?</h3>
                        <p>Are you sure you want to quit? Any unsaved changes will be lost.</p>
                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={() => setShowQuitModal(false)}>
                                Cancel
                            </button>
                            <button className="btn-danger" onClick={handleQuitApp}>
                                Quit App
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

export default Settings;
