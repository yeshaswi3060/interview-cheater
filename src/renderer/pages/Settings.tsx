import React, { useState, useCallback, useEffect, memo } from 'react';
import '../styles/Settings.css';
import { testGroqConnection } from '../services/groqService';
import * as pdfjsLib from 'pdfjs-dist';

// Set PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface SettingsProps {
    userProfile: any;
    onBack: () => void;
    onLogout: () => void;
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
    systemPrompt: string;
    createdAt: number;
}

const PRESET_MODES = [
    { id: 'interview', name: 'Interview', icon: '💼', prompt: 'You are a professional interview coach. Provide clear, confident answers. Be concise and professional. Help with behavioral and technical interview questions.' },
    { id: 'study', name: 'Study', icon: '📚', prompt: 'You are a helpful study assistant. Explain concepts clearly with examples. Be patient and educational. Help understand difficult topics.' },
    { id: 'meeting', name: 'Meeting', icon: '🎯', prompt: 'You are a meeting assistant. Provide professional insights, summarize points, and help with presentations. Be business-focused.' },
    { id: 'coding', name: 'Coding', icon: '💻', prompt: 'You are a programming assistant. Help with code, debug issues, explain technical concepts. Be precise and provide working code examples.' },
    { id: 'creative', name: 'Creative', icon: '✨', prompt: 'You are a creative and fun assistant. Be witty, engaging, and imaginative while still being helpful.' },
];

const Icons = {
    keyboard: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="4" width="20" height="14" rx="2" /><line x1="6" y1="8" x2="6" y2="8" strokeLinecap="round" /><line x1="10" y1="8" x2="10" y2="8" strokeLinecap="round" /><line x1="14" y1="8" x2="14" y2="8" strokeLinecap="round" /><line x1="6" y1="12" x2="18" y2="12" strokeLinecap="round" /></svg>),
    document: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" /><polyline points="14,2 14,8 20,8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>),
    bot: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="2" /><path d="M12 7v4" /><circle cx="8" cy="16" r="1" /><circle cx="16" cy="16" r="1" /></svg>),
    user: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>),
    palette: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="13.5" cy="6.5" r="1.5" /><circle cx="17.5" cy="10.5" r="1.5" /><circle cx="8.5" cy="7.5" r="1.5" /><circle cx="6.5" cy="12.5" r="1.5" /><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 011.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z" /></svg>),
    check: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20,6 9,17 4,12" /></svg>),
    plus: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>),
    trash: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="3,6 5,6 21,6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>),
    upload: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17,8 12,3 7,8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>),
    power: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18.36 6.64a9 9 0 11-12.73 0" /><line x1="12" y1="2" x2="12" y2="12" /></svg>),
};

const Settings: React.FC<SettingsProps> = memo(({
    userProfile,
    onBack,
    onLogout,
    onUpdateProfile
}) => {
    const [activeSection, setActiveSection] = useState<SettingsSection>('keybindings');
    const [saveStatus, setSaveStatus] = useState<{ [key: string]: 'idle' | 'saving' | 'saved' | 'error' }>({});
    const [showQuitModal, setShowQuitModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);

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
    const [resumeText, setResumeText] = useState<string>(() => localStorage.getItem('resumeText') || '');
    const [resumeFileName, setResumeFileName] = useState<string>(() => localStorage.getItem('resumeFileName') || '');
    const [pdfLoading, setPdfLoading] = useState(false);
    const [pdfError, setPdfError] = useState<string | null>(null);

    // AI Assistant state
    const [assistants, setAssistants] = useState<AIAssistant[]>(() => {
        const saved = localStorage.getItem('aiAssistants');
        return saved ? JSON.parse(saved) : [];
    });
    const [activeAssistantId, setActiveAssistantId] = useState<string | null>(() => {
        return localStorage.getItem('activeAssistantId') || null;
    });
    const [newAssistant, setNewAssistant] = useState({ name: '', prompt: '' });
    const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
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

    // KEY BINDINGS
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

        const handleKeyUp = () => {
            if (pressedKeys.size > 0) {
                const keyArray = Array.from(pressedKeys);
                const modifiers = ['Ctrl', 'Shift', 'Alt', 'Cmd'];
                const sorted = [...keyArray.filter(k => modifiers.includes(k)), ...keyArray.filter(k => !modifiers.includes(k))];
                const newKeys = sorted.join('+');
                setKeyBindings(prev => {
                    const updated = prev.map(b => b.id === recordingKeyFor ? { ...b, keys: newKeys } : b);
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

    // PDF TEXT EXTRACTION
    const extractTextFromPDF = async (file: File): Promise<string> => {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
                .map((item: any) => item.str)
                .join(' ');
            fullText += pageText + '\n\n';
        }

        return fullText.trim();
    };

    // RESUME UPLOAD
    const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setResumeFileName(file.name);
        localStorage.setItem('resumeFileName', file.name);
        setPdfError(null);

        if (file.type === 'application/pdf') {
            setPdfLoading(true);
            try {
                const text = await extractTextFromPDF(file);
                setResumeText(text);
                localStorage.setItem('resumeText', text);
                showSaveStatus('resume', 'saved');
            } catch (err) {
                setPdfError('Could not read PDF. Please paste text manually.');
                console.error('PDF extraction error:', err);
            } finally {
                setPdfLoading(false);
            }
        } else {
            const reader = new FileReader();
            reader.onload = (event) => {
                const text = event.target?.result as string;
                setResumeText(text);
                localStorage.setItem('resumeText', text);
                showSaveStatus('resume', 'saved');
            };
            reader.readAsText(file);
        }
    }, []);

    const saveResumeText = useCallback(() => {
        localStorage.setItem('resumeText', resumeText);
        showSaveStatus('resume', 'saved');
    }, [resumeText]);

    const clearResume = useCallback(() => {
        setResumeText('');
        setResumeFileName('');
        setPdfError(null);
        localStorage.removeItem('resumeText');
        localStorage.removeItem('resumeFileName');
    }, []);

    // AI ASSISTANT
    const createAssistant = useCallback(() => {
        if (!newAssistant.name.trim()) return;

        const preset = PRESET_MODES.find(p => p.id === selectedPreset);
        const prompt = selectedPreset ? preset?.prompt || '' : newAssistant.prompt;

        const assistant: AIAssistant = {
            id: Date.now().toString(),
            name: newAssistant.name,
            mode: selectedPreset || 'custom',
            systemPrompt: prompt,
            createdAt: Date.now()
        };

        const updated = [...assistants, assistant];
        setAssistants(updated);
        localStorage.setItem('aiAssistants', JSON.stringify(updated));

        if (updated.length === 1) {
            setActiveAssistantId(assistant.id);
            localStorage.setItem('activeAssistantId', assistant.id);
        }

        setNewAssistant({ name: '', prompt: '' });
        setSelectedPreset(null);
        setShowCreateModal(false);
        showSaveStatus('assistant', 'saved');
    }, [newAssistant, selectedPreset, assistants]);

    const toggleAssistant = useCallback((id: string) => {
        if (activeAssistantId === id) {
            // Deactivate
            setActiveAssistantId(null);
            localStorage.removeItem('activeAssistantId');
        } else {
            // Activate
            setActiveAssistantId(id);
            localStorage.setItem('activeAssistantId', id);
        }
        showSaveStatus('assistant', 'saved');
    }, [activeAssistantId]);

    const deleteAssistant = useCallback((id: string) => {
        const updated = assistants.filter(a => a.id !== id);
        setAssistants(updated);
        localStorage.setItem('aiAssistants', JSON.stringify(updated));

        if (activeAssistantId === id) {
            setActiveAssistantId(null);
            localStorage.removeItem('activeAssistantId');
        }
    }, [assistants, activeAssistantId]);

    const testActiveAssistant = useCallback(async () => {
        if (!activeAssistantId) return;
        setTestingAssistant(true);
        setTestResult(null);

        try {
            const response = await testGroqConnection('', [
                { role: 'user', content: 'Say hello and briefly introduce yourself in 1-2 sentences.' }
            ]);
            setTestResult({ success: true, response });
        } catch (err: any) {
            setTestResult({ success: false, response: err.message });
        } finally {
            setTestingAssistant(false);
        }
    }, [activeAssistantId]);

    // PROFILE
    const saveProfile = useCallback(() => {
        localStorage.setItem('profileName', profile.name);
        localStorage.setItem('profileEducation', profile.education);
        localStorage.setItem('profileSkills', profile.skills);
        localStorage.setItem('profileExperience', profile.experience);
        localStorage.setItem('profileProjects', profile.projects);
        onUpdateProfile(profile);
        showSaveStatus('profile', 'saved');
    }, [profile, onUpdateProfile]);

    // APPEARANCE
    const saveAppearance = useCallback(() => {
        localStorage.setItem('theme', appearance.theme);
        localStorage.setItem('notchSize', appearance.notchSize);
        localStorage.setItem('fontSize', appearance.fontSize);
        localStorage.setItem('transparency', appearance.transparency.toString());
        document.documentElement.setAttribute('data-theme', appearance.theme);
        showSaveStatus('appearance', 'saved');
    }, [appearance]);

    // QUIT
    const handleQuitApp = useCallback(() => {
        const electronWindow = window as any;
        if (electronWindow.electron?.ipcRenderer) {
            electronWindow.electron.ipcRenderer.send('app-quit');
        } else {
            window.close();
        }
    }, []);

    const showSaveStatus = (section: string, status: 'saved' | 'error') => {
        setSaveStatus(prev => ({ ...prev, [section]: status }));
        setTimeout(() => setSaveStatus(prev => ({ ...prev, [section]: 'idle' })), 2000);
    };

    const getPresetIcon = (mode: string) => {
        const preset = PRESET_MODES.find(p => p.id === mode);
        return preset?.icon || '🤖';
    };

    const renderSectionContent = () => {
        switch (activeSection) {
            case 'keybindings':
                return (
                    <div className="settings-section-content">
                        <div className="section-header">
                            <h2>Key Bindings</h2>
                            <p>Click a shortcut and press your key combination. These are saved for reference.</p>
                        </div>
                        <div className="info-banner">
                            <span>ℹ️</span>
                            <span>System shortcuts (Ctrl+Shift+C, etc.) are set globally by the app. Custom shortcuts shown here are for reference only.</span>
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
                                        onClick={() => setRecordingKeyFor(recordingKeyFor === binding.id ? null : binding.id)}
                                    >
                                        {recordingKeyFor === binding.id ? (
                                            currentKeys.size > 0 ? Array.from(currentKeys).map((k, i) => (
                                                <span key={i}><span className="key-badge recording">{k}</span>{i < currentKeys.size - 1 && <span className="key-plus">+</span>}</span>
                                            )) : <span className="recording-text">Press keys...</span>
                                        ) : (
                                            binding.keys.split('+').map((k, i) => (
                                                <span key={i}><span className="key-badge">{k}</span>{i < binding.keys.split('+').length - 1 && <span className="key-plus">+</span>}</span>
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
                            <p>Upload your resume or paste your background. AI uses this to personalize responses.</p>
                        </div>
                        <div className="resume-upload-area">
                            <input type="file" accept=".txt,.pdf,.doc,.docx" onChange={handleFileUpload} id="resume-file" hidden />
                            <label htmlFor="resume-file" className="upload-btn">
                                {pdfLoading ? (
                                    <span className="loading-spinner"></span>
                                ) : (
                                    Icons.upload
                                )}
                                <span>{pdfLoading ? 'Reading PDF...' : resumeFileName || 'Upload Resume (PDF, TXT, DOCX)'}</span>
                            </label>
                            {pdfError && <span className="error-hint">{pdfError}</span>}
                        </div>
                        <div className="resume-content-area">
                            <h3>Your Background</h3>
                            <p className="hint">Write or paste about yourself. AI uses this to personalize responses.</p>
                            <textarea
                                value={resumeText}
                                onChange={(e) => setResumeText(e.target.value)}
                                placeholder="I am a software engineer with 3 years of experience in React and Node.js. Currently preparing for senior developer interviews at top tech companies..."
                                rows={12}
                            />
                        </div>
                        {resumeText && (
                            <div className="context-indicator success">
                                {Icons.check} Your background is being used by AI ({resumeText.length} characters)
                            </div>
                        )}
                        <div className="section-actions">
                            <button className="btn-primary" onClick={saveResumeText}>Save</button>
                            <button className="btn-secondary" onClick={clearResume}>Clear</button>
                            {saveStatus.resume === 'saved' && <span className="save-indicator">Saved</span>}
                        </div>
                    </div>
                );

            case 'assistant':
                return (
                    <div className="settings-section-content">
                        <div className="section-header">
                            <h2>AI Assistants</h2>
                            <p>Create AI personalities. Toggle to activate/deactivate.</p>
                        </div>

                        <button className="create-assistant-btn" onClick={() => setShowCreateModal(true)}>
                            {Icons.plus}
                            <span>Create New Assistant</span>
                        </button>

                        {assistants.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">🤖</div>
                                <p>No assistants yet</p>
                                <span>Click above to create your first AI assistant!</span>
                            </div>
                        ) : (
                            <div className="assistants-grid">
                                {assistants.map((assistant) => {
                                    const isActive = activeAssistantId === assistant.id;
                                    return (
                                        <div key={assistant.id} className={`assistant-card-premium ${isActive ? 'active' : 'inactive'}`}>
                                            <div className="assistant-card-header">
                                                <span className="assistant-icon">{getPresetIcon(assistant.mode)}</span>
                                                <button className="delete-btn" onClick={() => deleteAssistant(assistant.id)}>{Icons.trash}</button>
                                            </div>
                                            <div className="assistant-card-body">
                                                <h4>{assistant.name}</h4>
                                                <span className="mode-tag">{assistant.mode}</span>
                                            </div>
                                            <div className="assistant-card-footer">
                                                <button
                                                    className={`toggle-btn ${isActive ? 'active' : 'inactive'}`}
                                                    onClick={() => toggleAssistant(assistant.id)}
                                                >
                                                    {Icons.power}
                                                    <span>{isActive ? 'Active' : 'Inactive'}</span>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {activeAssistantId && (
                            <div className="active-assistant-info">
                                <div className="active-indicator">
                                    <span className="pulse-dot"></span>
                                    <span>Active: {assistants.find(a => a.id === activeAssistantId)?.name}</span>
                                </div>
                                <button className="btn-test" onClick={testActiveAssistant} disabled={testingAssistant}>
                                    {testingAssistant ? 'Testing...' : 'Test Response'}
                                </button>
                            </div>
                        )}

                        {testResult && (
                            <div className={`test-result ${testResult.success ? 'success' : 'error'}`}>
                                <div className="test-result-header">{testResult.success ? '✓ AI Response:' : '✗ Error:'}</div>
                                <div className="test-result-content">{testResult.response}</div>
                            </div>
                        )}

                        {saveStatus.assistant === 'saved' && <span className="save-indicator">Saved</span>}
                    </div>
                );

            case 'profile':
                return (
                    <div className="settings-section-content">
                        <div className="section-header">
                            <h2>Profile</h2>
                            <p>Your profile helps the AI provide relevant responses.</p>
                        </div>
                        <div className="settings-form">
                            <div className="form-group">
                                <label>Full Name</label>
                                <input type="text" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} placeholder="John Doe" />
                            </div>
                            <div className="form-group">
                                <label>Education</label>
                                <textarea value={profile.education} onChange={(e) => setProfile({ ...profile, education: e.target.value })} placeholder="Bachelor's in Computer Science..." rows={2} />
                            </div>
                            <div className="form-group">
                                <label>Skills</label>
                                <textarea value={profile.skills} onChange={(e) => setProfile({ ...profile, skills: e.target.value })} placeholder="JavaScript, React, Python..." rows={2} />
                            </div>
                            <div className="form-group">
                                <label>Experience</label>
                                <textarea value={profile.experience} onChange={(e) => setProfile({ ...profile, experience: e.target.value })} placeholder="5 years as Full Stack Developer..." rows={3} />
                            </div>
                            <div className="form-group">
                                <label>Projects</label>
                                <textarea value={profile.projects} onChange={(e) => setProfile({ ...profile, projects: e.target.value })} placeholder="Built microservices architecture..." rows={3} />
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
                            <p>Customize the look of the application.</p>
                        </div>
                        <div className="settings-form">
                            <div className="form-group">
                                <label>Theme</label>
                                <div className="theme-selector">
                                    {[{ id: 'dark', label: 'Dark' }, { id: 'light', label: 'Light' }, { id: 'system', label: 'System' }].map((theme) => (
                                        <button key={theme.id} className={`theme-option ${appearance.theme === theme.id ? 'active' : ''}`} onClick={() => setAppearance({ ...appearance, theme: theme.id })}>{theme.label}</button>
                                    ))}
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Transparency: {appearance.transparency}%</label>
                                <input type="range" min="50" max="100" value={appearance.transparency} onChange={(e) => setAppearance({ ...appearance, transparency: parseInt(e.target.value) })} />
                            </div>
                        </div>
                        <div className="section-actions">
                            <button className="btn-primary" onClick={saveAppearance}>Apply</button>
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
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                    </button>
                    <h1>Settings</h1>
                </div>
                <nav className="settings-nav">
                    {navItems.map((item) => (
                        <button key={item.id} className={`settings-nav-item ${activeSection === item.id ? 'active' : ''}`} onClick={() => setActiveSection(item.id)}>
                            <span className="nav-icon">{item.icon}</span>
                            <span className="nav-label">{item.label}</span>
                        </button>
                    ))}
                </nav>
                <div className="settings-sidebar-footer">
                    <button className="logout-btn" onClick={onLogout}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16,17 21,12 16,7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                        <span>Logout</span>
                    </button>
                    <button className="quit-btn" onClick={() => setShowQuitModal(true)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18.36 6.64a9 9 0 11-12.73 0" /><line x1="12" y1="2" x2="12" y2="12" /></svg>
                        <span>Quit App</span>
                    </button>
                    <span className="version">v1.0.0</span>
                </div>
            </div>
            <div className="settings-main">
                {renderSectionContent()}
            </div>

            {/* Create Assistant Modal */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal-content create-modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Create AI Assistant</h3>
                        <div className="form-group">
                            <label>Assistant Name</label>
                            <input type="text" value={newAssistant.name} onChange={(e) => setNewAssistant({ ...newAssistant, name: e.target.value })} placeholder="My Study Buddy" autoFocus />
                        </div>
                        <div className="form-group">
                            <label>Choose a Preset</label>
                            <div className="preset-grid">
                                {PRESET_MODES.map((preset) => (
                                    <button key={preset.id} className={`preset-card ${selectedPreset === preset.id ? 'active' : ''}`} onClick={() => setSelectedPreset(selectedPreset === preset.id ? null : preset.id)}>
                                        <span className="preset-icon">{preset.icon}</span>
                                        <span>{preset.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                        {!selectedPreset && (
                            <div className="form-group">
                                <label>Custom Instructions</label>
                                <textarea value={newAssistant.prompt} onChange={(e) => setNewAssistant({ ...newAssistant, prompt: e.target.value })} placeholder="Tell the AI how to behave..." rows={4} />
                            </div>
                        )}
                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                            <button className="btn-primary" onClick={createAssistant} disabled={!newAssistant.name.trim()}>Create</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Quit Modal */}
            {showQuitModal && (
                <div className="modal-overlay" onClick={() => setShowQuitModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-icon warning">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                        </div>
                        <h3>Quit Application?</h3>
                        <p>Are you sure you want to quit?</p>
                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={() => setShowQuitModal(false)}>Cancel</button>
                            <button className="btn-danger" onClick={handleQuitApp}>Quit App</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

export default Settings;
