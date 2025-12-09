import { useState, useEffect, Suspense, lazy } from 'react'
import Loading from './components/Loading'
import TitleBar from './components/TitleBar'
import Onboarding from './components/Onboarding'

// Lazy load pages
const Login = lazy(() => import('./pages/Login'))
const Signup = lazy(() => import('./pages/Signup'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Questions = lazy(() => import('./pages/Questions'))
const Notes = lazy(() => import('./pages/Notes'))
const InputLanguageSelection = lazy(() => import('./pages/InputLanguageSelection'))
const ResponseLanguageSelection = lazy(() => import('./pages/ResponseLanguageSelection'))
const ProfileInput = lazy(() => import('./pages/ProfileInput'))
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

    // Notch Mode state
    const [showNotch, setShowNotch] = useState(false)
    const [showSettings, setShowSettings] = useState(false)

    // Onboarding state
    const [showOnboarding, setShowOnboarding] = useState(false)

    // Check if user is already logged in on mount
    useEffect(() => {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
        const email = localStorage.getItem('userEmail') || ''

        // Check for saved languages and profile
        const savedInputLangs = JSON.parse(localStorage.getItem('inputLanguages') || '[]')
        const savedResponseLangs = JSON.parse(localStorage.getItem('responseLanguages') || '[]')
        const savedProfile = JSON.parse(localStorage.getItem('userProfile') || 'null')

        if (isLoggedIn) {
            setIsAuthenticated(true)
            setUserEmail(email)

            if (savedInputLangs.length > 0 && savedResponseLangs.length > 0) {
                setInputLanguages(savedInputLangs)
                setResponseLanguages(savedResponseLangs)

                if (savedProfile) {
                    setUserProfile(savedProfile)
                    // API keys are now hardcoded, no need to check localStorage
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

        setIsAuthenticated(false)
        setUserEmail('')
        setInputLanguages([])
        setResponseLanguages([])
        setUserProfile(null)
        setShowInputLangSelect(false)
        setShowResponseLangSelect(false)
        setShowProfileInput(false)
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

        // Check if onboarding is completed
        const onboardingDone = localStorage.getItem('onboardingComplete') === 'true'
        if (onboardingDone) {
            setShowNotch(true)
        } else {
            setShowOnboarding(true)
        }
    }

    const handleOnboardingComplete = () => {
        setShowOnboarding(false)
        // Don't set showNotch - user will see the Launch Gogly page
    }

    const handleExitNotch = () => {
        setShowNotch(false)
    }

    const handleOpenSettings = () => {
        setShowNotch(false)
        setShowSettings(true)
    }

    const handleBackFromSettings = () => {
        setShowSettings(false)
        setShowNotch(true)
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

    // Settings Page
    if (showSettings) {
        return (
            <Suspense fallback={<Loading />}>
                <Settings
                    userProfile={userProfile}
                    onBack={handleBackFromSettings}
                    onLogout={handleLogout}
                    onUpdateProfile={handleUpdateProfile}
                />
            </Suspense>
        )
    }

    // Onboarding Tutorial (first-time users)
    if (showOnboarding) {
        return <Onboarding onComplete={handleOnboardingComplete} />
    }

    // Notch Mode
    if (showNotch) {
        return (
            <Suspense fallback={<Loading />}>
                <Notch onExit={handleExitNotch} onSettings={handleOpenSettings} />
            </Suspense>
        )
    }

    // Main app (authenticated and setup complete)
    return (
        <>
            <TitleBar />
            <div className="app-container" style={{ background: '#000000', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 30px)', marginTop: '30px' }}>
                <div style={{ textAlign: 'center' }}>
                    <h1 style={{ fontSize: '32px', fontWeight: '700', letterSpacing: '4px', marginBottom: '5px' }}>GOGLY</h1>
                    <p style={{ fontSize: '11px', color: '#666', letterSpacing: '3px', marginBottom: '20px' }}>YESHASWI'S CREATION</p>
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
                        Launch Gogly
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
