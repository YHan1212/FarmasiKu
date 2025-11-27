import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import './Login.css'

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
        setError('Invalid email or password. Please check your credentials or use "Forgot password?" to reset.')
      } else {
        setError(error.message || 'Login failed. Please check your credentials.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Login to farmasiKu</h2>
        <p className="login-subtitle">Access your orders and medication history</p>

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

        <div className="login-divider">
          <span>OR</span>
        </div>

        <button 
          className="continue-guest-button"
          onClick={() => onLogin(null)}
        >
          Continue as Guest
        </button>
      </div>
    </div>
  )
}

export default Login

