import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import './Register.css'

function Register({ onRegister, onSwitchToLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (!supabase) {
      setError('Database not configured. Please configure Supabase to register.')
      setLoading(false)
      return
    }

    setLoading(true)

    try {
      // Sign up user
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || email.split('@')[0]
          }
        }
      })

      if (signUpError) throw signUpError

      if (data.user) {
        // Always try to create user profile
        // Wait a bit for trigger to execute (if it exists)
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        // Check if profile was created by trigger
        const { data: existingProfile } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('id', data.user.id)
          .single()

        // Only try to create if it doesn't exist
        if (!existingProfile) {
          const { error: profileError } = await supabase
            .from('user_profiles')
            .insert([
              {
                id: data.user.id,
                age: null // Will be updated later
              }
            ])

          if (profileError) {
            // Check if profile already exists (from trigger or previous attempt)
            if (profileError.code === '23505') {
              // Profile already exists, that's fine
              console.log('Profile already exists (likely created by trigger)')
            } else {
              // Other error - log it but continue
              console.error('Error creating profile:', profileError)
              // Try one more time after a longer wait
              await new Promise(resolve => setTimeout(resolve, 1000))
              const { error: retryError } = await supabase
                .from('user_profiles')
                .insert([{ id: data.user.id, age: null }])
              
              if (retryError && retryError.code !== '23505') {
                console.error('Retry also failed:', retryError)
                setError(`Registration successful, but profile creation failed: ${retryError.message}. Please contact us for help.`)
              }
            }
          }
        }

        // Check if email confirmation is required
        if (data.user.email_confirmed_at === null) {
          // Email confirmation required - show message but don't block
          setError('Registration successful! Please check your email and click the link. You can still use the app.')
          // Continue anyway - user can use app but should verify email
        }

        onRegister(data.user)
      }
    } catch (error) {
      setError(error.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="register-container">
      <div className="register-card">
        <h2>Create Account</h2>
        <p className="register-subtitle">Join farmasiKu to see your orders</p>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-group">
            <label htmlFor="name">Name (Optional)</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              disabled={loading}
            />
          </div>

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
              placeholder="At least 6 characters"
              autoComplete="new-password"
              required
              minLength={6}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              autoComplete="new-password"
              required
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="register-button"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Sign Up'}
          </button>
        </form>

        <div className="register-footer">
          <p>
            Already have an account?{' '}
            <button 
              type="button" 
              className="link-button"
              onClick={onSwitchToLogin}
            >
              Login
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register

