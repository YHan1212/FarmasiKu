import React from 'react'
import './Welcome.css'

function Welcome({ onStart }) {
  return (
    <div className="welcome-container">
      <div className="welcome-content">
        <div className="welcome-header">
          <div className="welcome-logo">🏥</div>
          <h1>Welcome to farmasiKu</h1>
          <p className="welcome-subtitle">Your trusted online pharmacy</p>
        </div>

        <div className="welcome-actions-top">
          <button className="start-button" onClick={onStart}>
            Get Started
          </button>
        </div>

        <div className="welcome-features">
          <div className="feature-card">
            <div className="feature-icon">🔍</div>
            <h3>Symptom Check</h3>
            <p>Tell us your symptoms and get medicine suggestions based on your age and condition.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">💊</div>
            <h3>Medicine Suggestions</h3>
            <p>Get safe and right medicine suggestions for your needs.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">👨‍⚕️</div>
            <h3>Doctor Chat</h3>
            <p>Chat with doctors for professional medicine advice and help.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🚚</div>
            <h3>Fast Delivery</h3>
            <p>Order medications online and get them delivered to your doorstep quickly and safely.</p>
          </div>
        </div>

        <div className="welcome-info">
          <div className="info-section">
            <h3>How It Works</h3>
            <ol className="steps-list">
              <li>Enter your age and select your symptoms</li>
              <li>Complete a quick check</li>
              <li>Review suggested medicines</li>
              <li>Chat with a doctor if needed</li>
              <li>Order and get it delivered to your home</li>
            </ol>
          </div>

          <div className="info-section">
            <h3>Important Notes</h3>
            <ul className="notes-list">
              <li>⚠️ This app gives suggestions only and does not replace doctor advice</li>
              <li>📋 Always see a doctor for serious health problems</li>
              <li>💊 Follow medicine instructions carefully</li>
              <li>🔒 Your health information is kept safe and private</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Welcome

