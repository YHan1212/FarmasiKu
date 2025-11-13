import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import './ForgotPassword.css'

function ForgotPassword({ onBack, onSwitchToLogin }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}?type=recovery`
      })

      if (error) throw error

      setSuccess(true)
    } catch (error) {
      setError(error.message || 'Failed to send reset email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="forgot-password-container">
        <div className="forgot-password-card">
          <div className="success-icon">✓</div>
          <h2>Check Your Email</h2>
          <p className="success-message">
            We've sent a password reset link to <strong>{email}</strong>
          </p>
          <p className="success-subtitle">
            Please check your inbox and click the link to reset your password.
          </p>
          <button 
            className="back-to-login-button"
            onClick={onSwitchToLogin}
          >
            Back to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-card">
        <h2>Reset Password</h2>
        <p className="forgot-password-subtitle">
          Enter your email address and we'll send you a link to reset your password
        </p>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="forgot-password-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              required
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="reset-button"
            disabled={loading || !email}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="forgot-password-footer">
          <button 
            type="button" 
            className="link-button"
            onClick={onSwitchToLogin}
          >
            ← Back to Login
          </button>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword

