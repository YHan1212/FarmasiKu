import React from 'react'
import './ConsultationRedirect.css'

function ConsultationRedirect({ onBack }) {
  return (
    <div className="consultation-redirect">
      <div className="consultation-content">
        <div className="consultation-icon">👨‍⚕️</div>
        <h2 className="consultation-title">Consultation Recommended</h2>
        <p className="consultation-message">
          Due to the severity of your symptoms, we strongly recommend an online one-on-one doctor consultation.
        </p>
        <p className="consultation-submessage">
          This ensures you receive the most appropriate treatment plan.
        </p>

        <div className="consultation-features">
          <div className="feature-item">
            <span className="feature-icon">✓</span>
            <span>Professional one-on-one doctor consultation</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">✓</span>
            <span>Quick response to your needs</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">✓</span>
            <span>Secure online consultation platform</span>
          </div>
        </div>

        <button className="consultation-button" onClick={onBack}>
          Go Back
        </button>
      </div>
    </div>
  )
}

export default ConsultationRedirect

