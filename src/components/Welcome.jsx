import React from 'react'
import './Welcome.css'

function Welcome({ onStart }) {
  return (
    <div className="welcome-container">
      <div className="welcome-content">
        <div className="welcome-header">
          <div className="welcome-logo">🏥</div>
          <h1>Welcome to farmasiKu</h1>
          <p className="welcome-subtitle">Your trusted online pharmacy companion</p>
        </div>

        <div className="welcome-actions-top">
          <button className="start-button" onClick={onStart}>
            Get Started
          </button>
        </div>

        <div className="welcome-features">
          <div className="feature-card">
            <div className="feature-icon">🔍</div>
            <h3>Symptom Assessment</h3>
            <p>Describe your symptoms and get personalized medication recommendations based on your age and condition.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">💊</div>
            <h3>Medication Recommendations</h3>
            <p>Receive safe and appropriate medication suggestions tailored to your specific needs.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">👨‍⚕️</div>
            <h3>Pharmacist Consultation</h3>
            <p>Chat with licensed pharmacists for professional medication advice and guidance.</p>
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
              <li>Complete a quick assessment</li>
              <li>Review recommended medications</li>
              <li>Consult with a doctor if needed</li>
              <li>Order and get delivered to your home</li>
            </ol>
          </div>

          <div className="info-section">
            <h3>Important Notes</h3>
            <ul className="notes-list">
              <li>⚠️ This app provides recommendations only and does not replace professional medical advice</li>
              <li>📋 Always consult with a healthcare professional for serious conditions</li>
              <li>💊 Follow medication instructions carefully</li>
              <li>🔒 Your health information is kept private and secure</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Welcome

