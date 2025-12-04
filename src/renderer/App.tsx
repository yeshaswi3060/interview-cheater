import { useState, useEffect, Suspense, lazy } from 'react'
import Loading from './components/Loading'

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
    const [apiKeys, setApiKeys] = useState({ groq: '', gemini: '' })
    const [showApiKeyInput, setShowApiKeyInput] = useState(false)
    const [showApiTest, setShowApiTest] = useState(false)

    // Check if user is already logged in on mount
    useEffect(() => {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
        const email = localStorage.getItem('userEmail') || ''

        // Check for saved languages, profile, and API keys
        const savedInputLangs = JSON.parse(localStorage.getItem('inputLanguages') || '[]')
        const savedResponseLangs = JSON.parse(localStorage.getItem('responseLanguages') || '[]')
        const savedProfile = JSON.parse(localStorage.getItem('userProfile') || 'null')
        const savedGroqKey = localStorage.getItem('groqApiKey') || ''
        const savedGeminiKey = localStorage.getItem('geminiApiKey') || ''

        if (isLoggedIn) {
            setIsAuthenticated(true)
            setUserEmail(email)

            if (savedInputLangs.length > 0 && savedResponseLangs.length > 0) {
                setInputLanguages(savedInputLangs)
                setResponseLanguages(savedResponseLangs)

                if (savedProfile) {
                    setUserProfile(savedProfile)

                    if (savedGroqKey && savedGeminiKey) {
                        setApiKeys({ groq: savedGroqKey, gemini: savedGeminiKey })
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
        localStorage.removeItem('geminiApiKey')

        setIsAuthenticated(false)
        setUserEmail('')
        setInputLanguages([])
        setResponseLanguages([])
        setUserProfile(null)
        setApiKeys({ groq: '', gemini: '' })
        setShowInputLangSelect(false)
        setShowResponseLangSelect(false)
        setShowProfileInput(false)
        setShowApiKeyInput(false)
        setShowApiTest(false)
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

    const handleApiKeySubmitted = (keys: { groq: string; gemini: string }) => {
        setApiKeys(keys)
        setShowApiKeyInput(false)
        setShowApiTest(true)
    }

    const handleApiTestFinished = () => {
        localStorage.setItem('groqApiKey', apiKeys.groq)
        localStorage.setItem('geminiApiKey', apiKeys.gemini)
        setShowApiTest(false)
        // Flow complete, show dashboard
    }

    const handleBackToApiKeyInput = () => {
        setShowApiTest(false)
        setShowApiKeyInput(true)
    }

    // Show auth pages if not authenticated
    if (!isAuthenticated) {
        if (showSignup) {
            return (
                <Suspense fallback={<Loading />}>
                    <Signup onSignup={handleSignup} onSwitchToLogin={() => setShowSignup(false)} />
                </Suspense>
            )
        }
        return (
            <Suspense fallback={<Loading />}>
                <Login onLogin={handleLogin} onSwitchToSignup={() => setShowSignup(true)} />
            </Suspense>
        )
    }

    // Language Selection Flow
    if (showInputLangSelect) {
        return (
            <Suspense fallback={<Loading />}>
                <InputLanguageSelection onNext={handleInputLanguagesSelected} />
            </Suspense>
        )
    }

    if (showResponseLangSelect) {
        return (
            <Suspense fallback={<Loading />}>
                <ResponseLanguageSelection onFinish={handleResponseLanguagesSelected} onBack={handleBackToInputSelection} />
            </Suspense>
        )
    }

    // Profile Input Flow
    if (showProfileInput) {
        return (
            <Suspense fallback={<Loading />}>
                <ProfileInput onNext={handleProfileSubmitted} />
            </Suspense>
        )
    }

    // API Key Flow
    if (showApiKeyInput) {
        return (
            <Suspense fallback={<Loading />}>
                <ApiKeyInput onNext={handleApiKeySubmitted} />
            </Suspense>
        )
    }

    if (showApiTest) {
        return (
            <Suspense fallback={<Loading />}>
                <ApiTest apiKeys={apiKeys} userProfile={userProfile} onFinish={handleApiTestFinished} onBack={handleBackToApiKeyInput} />
            </Suspense>
        )
    }

    // Main app (authenticated and setup complete)
    return (
        <div className="app-container" style={{ background: '#000000', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
                <h1 style={{ fontSize: '24px', fontWeight: '300', letterSpacing: '2px' }}>LOGGED IN</h1>
                <div style={{ marginTop: '20px', fontSize: '14px', color: '#888' }}>
                    <p>Input Languages: {inputLanguages.join(', ')}</p>
                    <p>Response Languages: {responseLanguages.join(', ')}</p>
                    <p>API Keys Configured: Yes</p>
                </div>
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
    )
}

export default App
