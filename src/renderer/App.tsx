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

    // API Key state
    const [groqApiKey, setGroqApiKey] = useState('')
    const [showApiKeyInput, setShowApiKeyInput] = useState(false)
    const [showApiTest, setShowApiTest] = useState(false)

    // Check if user is already logged in on mount
    useEffect(() => {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
        const email = localStorage.getItem('userEmail') || ''

        // Check for saved languages and API key
        const savedInputLangs = JSON.parse(localStorage.getItem('inputLanguages') || '[]')
        const savedResponseLangs = JSON.parse(localStorage.getItem('responseLanguages') || '[]')
        const savedApiKey = localStorage.getItem('groqApiKey') || ''

        if (isLoggedIn) {
            setIsAuthenticated(true)
            setUserEmail(email)

            if (savedInputLangs.length > 0 && savedResponseLangs.length > 0) {
                setInputLanguages(savedInputLangs)
                setResponseLanguages(savedResponseLangs)

                if (savedApiKey) {
                    setGroqApiKey(savedApiKey)
                } else {
                    // If languages are set but API key is missing, go to API key input
                    setShowApiKeyInput(true)
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
        localStorage.removeItem('groqApiKey')

        setIsAuthenticated(false)
        setUserEmail('')
        setInputLanguages([])
        setResponseLanguages([])
        setGroqApiKey('')
        setShowInputLangSelect(false)
        setShowResponseLangSelect(false)
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
        setShowApiKeyInput(true)
    }

    const handleBackToInputSelection = () => {
        setShowResponseLangSelect(false)
        setShowInputLangSelect(true)
    }

    const handleApiKeySubmitted = (key: string) => {
        setGroqApiKey(key)
        setShowApiKeyInput(false)
        setShowApiTest(true)
    }

    const handleApiTestFinished = () => {
        localStorage.setItem('groqApiKey', groqApiKey)
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
                <ApiTest apiKey={groqApiKey} onFinish={handleApiTestFinished} onBack={handleBackToApiKeyInput} />
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
                    <p>API Key Configured: Yes</p>
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
