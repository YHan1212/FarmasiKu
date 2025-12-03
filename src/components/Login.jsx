import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import './Login.css'

// Import version info
import versionInfoRaw from '../version.json'

const versionInfo = versionInfoRaw || {
  commitDate: 'Unknown',
  buildTime: 'Unknown'
}

function Login({ onLogin, onSwitchToRegister, onSwitchToForgotPassword }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (!supabase) {
      setError('Database not configured. Please continue as guest or configure Supabase.')
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        // Provide more helpful error messages
        if (error.message.includes('Invalid login credentials')) {
          // Check if email confirmation might be the issue
          setError('Invalid email or password. If you just registered, please check your email for a confirmation link, or disable email confirmation in Supabase settings.')
        } else if (error.message.includes('Email not confirmed') || error.message.includes('email_not_confirmed')) {
          setError('Please check your email and click the confirmation link before logging in. Or disable email confirmation in Supabase Dashboard → Authentication → Settings.')
        } else {
          setError(error.message || 'Login failed. Please check your credentials.')
        }
        console.error('Login error details:', error)
        return
      }

      if (data.user) {
        onLogin(data.user)
      }
    } catch (error) {
        if (error.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please check your email and password or use "Forgot password?" to reset.')
        } else {
          setError(error.message || 'Login failed. Please check your email and password.')
        }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-intro">
        <div className="intro-content">
          <h1 className="intro-title">🏥 Welcome to farmasiKu</h1>
          <p className="intro-description">
            Your trusted online pharmacy platform for convenient medicine ordering and delivery
          </p>
          <div className="intro-features">
            <div className="feature-item">
              <span className="feature-icon">💊</span>
              <span className="feature-text">Easy Medicine Ordering</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🚚</span>
              <span className="feature-text">Fast Delivery</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">👨‍⚕️</span>
              <span className="feature-text">Doctor Consultation</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📱</span>
              <span className="feature-text">Track Your Orders</span>
            </div>
          </div>
        </div>
      </div>
      <div className="login-card">
        <h2>Login to farmasiKu</h2>
        <p className="login-subtitle">Access your orders and medicine history</p>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              autoComplete="email"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="login-footer">
          <p>
            Don't have an account?{' '}
            <button 
              type="button" 
              className="link-button"
              onClick={onSwitchToRegister}
            >
              Sign up
            </button>
          </p>
          <p style={{ marginTop: '12px' }}>
            <button 
              type="button" 
              className="link-button"
              onClick={onSwitchToForgotPassword}
            >
              Forgot password?
            </button>
          </p>
        </div>

      </div>
      
      {/* Version info - displayed in bottom right corner */}
      <div className="version-info">
        <div className="version-text">
          Build Time: {versionInfo?.buildTime || versionInfo?.commitDate || 'Unknown'}
        </div>
        {versionInfo?.commitHash && (
          <div className="version-hash">
            {versionInfo.commitHash}
          </div>
        )}
      </div>
    </div>
  )
}

export default Login

