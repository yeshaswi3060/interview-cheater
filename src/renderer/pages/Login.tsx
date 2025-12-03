import { useState } from 'react'
import '../styles/auth.css'

interface LoginProps {
    onLogin: () => void
    onSwitchToSignup: () => void
}

function Login({ onLogin, onSwitchToSignup }: LoginProps) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        // Hardcoded credentials
        if (email === 'testing@gmail.com' && password === 'testing') {
            localStorage.setItem('isLoggedIn', 'true')
            localStorage.setItem('userEmail', email)
            onLogin()
        } else {
            setError('Invalid email or password')
        }
    }

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">

                    <h1>Interview Helper</h1>
                    <p className="subtitle">Sign in to continue</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    {error && <div className="error-message">{error}</div>}

                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    <button type="submit" className="auth-button">
                        Sign In
                    </button>
                </form>

                <div className="auth-footer">
                    <p>Don't have an account? <button onClick={onSwitchToSignup} className="link-button">Sign Up</button></p>
                </div>
            </div>
        </div>
    )
}

export default Login
