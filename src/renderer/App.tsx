import { useState, useEffect, Suspense, lazy } from 'react'
import Loading from './components/Loading'
import TitleBar from './components/TitleBar'

// Lazy load pages
const Login = lazy(() => import('./pages/Login'))
const Signup = lazy(() => import('./pages/Signup'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Questions = lazy(() => import('./pages/Questions'))
const Notes = lazy(() => import('./pages/Notes'))
const InputLanguageSelection = lazy(() => import('./pages/InputLanguageSelection'))
const ResponseLanguageSelection = lazy(() => import('./pages/ResponseLanguageSelection'))
const ProfileInput = lazy(() => import('./pages/ProfileInput'))
const ApiKeyInput = lazy(() => import('./pages/ApiKeyInput'))
const ApiTest = lazy(() => import('./pages/ApiTest'))
const Notch = lazy(() => import('./components/Notch'))
const Settings = lazy(() => import('./pages/Settings'))

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [showSignup, setShowSignup] = useState(false)
    const [activeTab, setActiveTab] = useState('dashboard')
    const [userEmail, setUserEmail] = useState('')

    // Language selection state
    const [inputLanguages, setInputLanguages] = useState<string[]>([])
    const [responseLanguages, setResponseLanguages] = useState<string[]>([])
    const [showInputLangSelect, setShowInputLangSelect] = useState(false)
    const [showResponseLangSelect, setShowResponseLangSelect] = useState(false)

    // Profile state
    const [userProfile, setUserProfile] = useState<any>(null)
    const [showProfileInput, setShowProfileInput] = useState(false)

    // API Key state
    const [apiKeys, setApiKeys] = useState({ groq: '', groq2: '' })
    const [showApiKeyInput, setShowApiKeyInput] = useState(false)
    const [showApiTest, setShowApiTest] = useState(false)

    // Notch Mode state
    const [showNotch, setShowNotch] = useState(false)
    const [showSettings, setShowSettings] = useState(false)

    // Check if user is already logged in on mount
    useEffect(() => {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
        const email = localStorage.getItem('userEmail') || ''

        // Check for saved languages, profile, and API keys
        const savedInputLangs = JSON.parse(localStorage.getItem('inputLanguages') || '[]')
        const savedResponseLangs = JSON.parse(localStorage.getItem('responseLanguages') || '[]')
        const savedProfile = JSON.parse(localStorage.getItem('userProfile') || 'null')
        const savedGroqKey = localStorage.getItem('groqApiKey') || ''
        const savedGroq2Key = localStorage.getItem('groq2ApiKey') || ''

        if (isLoggedIn) {
            setIsAuthenticated(true)
            setUserEmail(email)

            if (savedInputLangs.length > 0 && savedResponseLangs.length > 0) {
                setInputLanguages(savedInputLangs)
                setResponseLanguages(savedResponseLangs)

                if (savedProfile) {
                    setUserProfile(savedProfile)

                    if (savedGroqKey && savedGroq2Key) {
                        setApiKeys({ groq: savedGroqKey, groq2: savedGroq2Key })
                    } else {
                        // If profile is set but API keys are missing, go to API key input
                        setShowApiKeyInput(true)
                    }
                } else {
                    // If languages are set but profile is missing, go to profile input
                    setShowProfileInput(true)
                }
            } else {
                // If logged in but languages not set, start flow
                setShowInputLangSelect(true)
            }
        }
    }, [])

    const handleLogin = () => {
        const email = localStorage.getItem('userEmail') || ''
        setUserEmail(email)
        setIsAuthenticated(true)
        // Start language selection flow
        setShowInputLangSelect(true)
    }

    const handleSignup = () => {
        const email = localStorage.getItem('userEmail') || ''
        setUserEmail(email)
        setIsAuthenticated(true)
        // Start language selection flow
        setShowInputLangSelect(true)
    }

    const handleLogout = () => {
        localStorage.removeItem('isLoggedIn')
        localStorage.removeItem('userEmail')
        localStorage.removeItem('inputLanguages')
        localStorage.removeItem('responseLanguages')
        localStorage.removeItem('userProfile')
        localStorage.removeItem('groqApiKey')
        localStorage.removeItem('groq2ApiKey')

        setIsAuthenticated(false)
        setUserEmail('')
        setInputLanguages([])
        setResponseLanguages([])
        setUserProfile(null)
        setApiKeys({ groq: '', groq2: '' })
        setShowInputLangSelect(false)
        setShowResponseLangSelect(false)
        setShowProfileInput(false)
        setShowApiKeyInput(false)
        setShowApiTest(false)
        setShowNotch(false)
    }

    const handleInputLanguagesSelected = (langs: string[]) => {
        setInputLanguages(langs)
        localStorage.setItem('inputLanguages', JSON.stringify(langs))
        setShowInputLangSelect(false)
        setShowResponseLangSelect(true)
    }

    const handleResponseLanguagesSelected = (langs: string[]) => {
        setResponseLanguages(langs)
        localStorage.setItem('responseLanguages', JSON.stringify(langs))
        setShowResponseLangSelect(false)
        setShowProfileInput(true)
    }

    const handleBackToInputSelection = () => {
        setShowResponseLangSelect(false)
        setShowInputLangSelect(true)
    }

    const handleProfileSubmitted = (profile: any) => {
        setUserProfile(profile)
        localStorage.setItem('userProfile', JSON.stringify(profile))
        setShowProfileInput(false)
        setShowApiKeyInput(true)
    }

    const handleBackToProfileInput = () => {
        setShowApiKeyInput(false)
        setShowProfileInput(true)
    }

    const handleApiKeySubmitted = (keys: { groq: string; groq2: string }) => {
        setApiKeys(keys)
        setShowApiKeyInput(false)
        setShowApiTest(true)
    }

    const handleApiTestFinished = () => {
        localStorage.setItem('groqApiKey', apiKeys.groq)
        localStorage.setItem('groq2ApiKey', apiKeys.groq2)
        setShowApiTest(false)
        // Flow complete, show Notch UI
        setShowNotch(true)
    }

    const handleBackToApiKeyInput = () => {
        setShowApiTest(false)
        setShowApiKeyInput(true)
    }

    const handleExitNotch = () => {
        setShowNotch(false)
        // Optionally go back to dashboard or some other state
    }

    const handleOpenSettings = () => {
        setShowNotch(false)
        setShowSettings(true)
    }

    const handleBackFromSettings = () => {
        setShowSettings(false)
        setShowNotch(true)
    }

    const handleUpdateApiKeys = (keys: { groq: string; groq2: string }) => {
        setApiKeys(keys)
    }

    const handleUpdateProfile = (profile: any) => {
        setUserProfile(profile)
    }

    // Show auth pages if not authenticated
    if (!isAuthenticated) {
        if (showSignup) {
            return (
                <>
                    <TitleBar />
                    <div style={{ marginTop: '30px' }}>
                        <Suspense fallback={<Loading />}>
                            <Signup onSignup={handleSignup} onSwitchToLogin={() => setShowSignup(false)} />
                        </Suspense>
                    </div>
                </>
            )
        }
        return (
            <>
                <TitleBar />
                <div style={{ marginTop: '30px' }}>
                    <Suspense fallback={<Loading />}>
                        <Login onLogin={handleLogin} onSwitchToSignup={() => setShowSignup(true)} />
                    </Suspense>
                </div>
            </>
        )
    }

    // Language Selection Flow
    if (showInputLangSelect) {
        return (
            <>
                <TitleBar />
                <div style={{ marginTop: '30px' }}>
                    <Suspense fallback={<Loading />}>
                        <InputLanguageSelection onNext={handleInputLanguagesSelected} />
                    </Suspense>
                </div>
            </>
        )
    }

    if (showResponseLangSelect) {
        return (
            <>
                <TitleBar />
                <div style={{ marginTop: '30px' }}>
                    <Suspense fallback={<Loading />}>
                        <ResponseLanguageSelection onFinish={handleResponseLanguagesSelected} onBack={handleBackToInputSelection} />
                    </Suspense>
                </div>
            </>
        )
    }

    // Profile Input Flow
    if (showProfileInput) {
        return (
            <>
                <TitleBar />
                <div style={{ marginTop: '30px' }}>
                    <Suspense fallback={<Loading />}>
                        <ProfileInput onNext={handleProfileSubmitted} />
                    </Suspense>
                </div>
            </>
        )
    }

    // API Key Flow
    if (showApiKeyInput) {
        return (
            <>
                <TitleBar />
                <div style={{ marginTop: '30px' }}>
                    <Suspense fallback={<Loading />}>
                        <ApiKeyInput onNext={handleApiKeySubmitted} />
                    </Suspense>
                </div>
            </>
        )
    }

    if (showApiTest) {
        return (
            <>
                <TitleBar />
                <div style={{ marginTop: '30px' }}>
                    <Suspense fallback={<Loading />}>
                        <ApiTest apiKeys={apiKeys} userProfile={userProfile} onFinish={handleApiTestFinished} onBack={handleBackToApiKeyInput} />
                    </Suspense>
                </div>
            </>
        )
    }

    // Settings Page
    if (showSettings) {
        return (
            <Suspense fallback={<Loading />}>
                <Settings
                    apiKeys={apiKeys}
                    userProfile={userProfile}
                    onBack={handleBackFromSettings}
                    onLogout={handleLogout}
                    onUpdateApiKeys={handleUpdateApiKeys}
                    onUpdateProfile={handleUpdateProfile}
                />
            </Suspense>
        )
    }

    // Notch Mode
    if (showNotch) {
        return (
            <Suspense fallback={<Loading />}>
                <Notch apiKeys={apiKeys} onExit={handleExitNotch} onSettings={handleOpenSettings} />
            </Suspense>
        )
    }

    // Main app (authenticated and setup complete)
    return (
        <>
            <TitleBar />
            <div className="app-container" style={{ background: '#000000', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 30px)', marginTop: '30px' }}>
                <div style={{ textAlign: 'center' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: '300', letterSpacing: '2px' }}>LOGGED IN</h1>
                    <div style={{ marginTop: '20px', fontSize: '14px', color: '#888' }}>
                        <p>Input Languages: {inputLanguages.join(', ')}</p>
                        <p>Response Languages: {responseLanguages.join(', ')}</p>
                        <p>API Keys Configured: Yes</p>
                    </div>
                    <button
                        onClick={() => setShowNotch(true)}
                        style={{
                            marginTop: '20px',
                            background: '#fff',
                            border: 'none',
                            color: '#000',
                            padding: '10px 20px',
                            cursor: 'pointer',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            marginRight: '10px'
                        }}
                    >
                        Launch Notch
                    </button>
                    <button
                        onClick={handleLogout}
                        style={{
                            marginTop: '20px',
                            background: 'transparent',
                            border: '1px solid #333',
                            color: '#fff',
                            padding: '10px 20px',
                            cursor: 'pointer',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            fontSize: '12px'
                        }}
                    >
                        Logout
                    </button>
                </div>
            </div>
        </>
    )
}

export default App
