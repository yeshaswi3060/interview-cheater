import { useState, useEffect } from 'react'
import Login from './components/Login'
import Signup from './components/Signup'

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
        <div className="app-container">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="logo-area">
                    <div className="logo-icon">💼</div>
                    <span className="logo-text">Interview Helper</span>
                </div>

                <nav className="nav-menu">
                    <button
                        className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                        onClick={() => setActiveTab('dashboard')}
                    >
                        <span className="icon">🏠</span>
                        Dashboard
                    </button>
                    <button
                        className={`nav-item ${activeTab === 'questions' ? 'active' : ''}`}
                        onClick={() => setActiveTab('questions')}
                    >
                        <span className="icon">❓</span>
                        Questions
                    </button>
                    <button
                        className={`nav-item ${activeTab === 'notes' ? 'active' : ''}`}
                        onClick={() => setActiveTab('notes')}
                    >
                        <span className="icon">📝</span>
                        Notes
                    </button>
                    <button
                        className="nav-item"
                        onClick={handleLogout}
                    >
                        <span className="icon">🚪</span>
                        Logout
                    </button>
                </nav>

                <div className="user-profile">
                    <div className="avatar"></div>
                    <div className="user-info">
                        <span className="name">{userEmail.split('@')[0]}</span>
                        <span className="role">Ready to Ace</span>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                <header className="top-bar">
                    <h1 className="page-title">
                        {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                    </h1>
                    <div className="actions">
                        <button className="btn-primary">Start Mock Interview</button>
                    </div>
                </header>

                <div className="content-area">
                    {activeTab === 'dashboard' && (
                        <div className="dashboard-grid">
                            <div className="card wide-card">
                                <h3>Welcome to Interview Helper</h3>
                                <p style={{ color: '#a1a1aa', marginTop: '10px' }}>
                                    Your personal assistant to ace technical interviews.
                                </p>
                            </div>

                            <div className="card stat-card">
                                <h3>Questions Practiced</h3>
                                <div className="value">12</div>
                                <div className="trend positive">Keep it up!</div>
                            </div>
                            <div className="card stat-card">
                                <h3>Mock Interviews</h3>
                                <div className="value">3</div>
                                <div className="trend positive">Improving</div>
                            </div>
                            <div className="card stat-card">
                                <h3>Success Rate</h3>
                                <div className="value">85%</div>
                                <div className="trend positive">High</div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'questions' && (
                        <div className="projects-view">
                            <div className="card">
                                <h3>React Hooks</h3>
                                <p>Explain useEffect and useMemo.</p>
                            </div>
                            <div className="card">
                                <h3>System Design</h3>
                                <p>Design a URL shortener.</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notes' && (
                        <div className="settings-view">
                            <div className="card">
                                <h3>My Notes</h3>
                                <p>Remember to speak clearly and ask clarifying questions.</p>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}

export default App
