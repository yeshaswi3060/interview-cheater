import { useState } from 'react'
import './Auth.css'

interface SignupProps {
    onSignup: () => void
    onSwitchToLogin: () => void
}

function Signup({ onSignup, onSwitchToLogin }: SignupProps) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (password !== confirmPassword) {
            setError('Passwords do not match')
            return
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters')
            return
        }

        // Store user and auto-login
        localStorage.setItem('isLoggedIn', 'true')
        localStorage.setItem('userEmail', email)
        onSignup()
    }

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="logo-icon-large">💼</div>
                    <h1>Interview Helper</h1>
                    <p className="subtitle">Create your account</p>
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
                            placeholder="Create a password"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm your password"
                            required
                        />
                    </div>

                    <button type="submit" className="auth-button">
                        Sign Up
                    </button>
                </form>

                <div className="auth-footer">
                    <p>Already have an account? <button onClick={onSwitchToLogin} className="link-button">Sign In</button></p>
                </div>
            </div>
        </div>
    )
}

export default Signup
