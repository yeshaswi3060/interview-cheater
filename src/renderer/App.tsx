import { useState, useEffect } from 'react'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Questions from './pages/Questions'
import Notes from './pages/Notes'

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [showSignup, setShowSignup] = useState(false)
    const [activeTab, setActiveTab] = useState('dashboard')
    const [userEmail, setUserEmail] = useState('')

    // Check if user is already logged in on mount
    useEffect(() => {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
        const email = localStorage.getItem('userEmail') || ''
        if (isLoggedIn) {
            setIsAuthenticated(true)
            setUserEmail(email)
        }
    }, [])

    const handleLogin = () => {
        const email = localStorage.getItem('userEmail') || ''
        setUserEmail(email)
        setIsAuthenticated(true)
    }

    const handleSignup = () => {
        const email = localStorage.getItem('userEmail') || ''
        setUserEmail(email)
        setIsAuthenticated(true)
    }

    const handleLogout = () => {
        localStorage.removeItem('isLoggedIn')
        localStorage.removeItem('userEmail')
        setIsAuthenticated(false)
        setUserEmail('')
    }

    // Show auth pages if not authenticated
    if (!isAuthenticated) {
        if (showSignup) {
            return <Signup onSignup={handleSignup} onSwitchToLogin={() => setShowSignup(false)} />
        }
        return <Login onLogin={handleLogin} onSwitchToSignup={() => setShowSignup(true)} />
    }

    // Main app (authenticated)
    return (
        <div className="app-container" style={{ background: '#000000', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
                <h1 style={{ fontSize: '24px', fontWeight: '300', letterSpacing: '2px' }}>LOGGED IN</h1>
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

