import React from 'react'
import './DangerWarning.css'

function DangerWarning({ symptoms, onConsultation, onContinue }) {
  return (
    <div className="danger-warning">
      <div className="warning-icon">⚠️</div>
      <h3 className="warning-title">Warning: Serious Symptoms Detected</h3>
      <p className="warning-message">
        You have selected symptoms that may require immediate medical attention:
      </p>
      <div className="dangerous-symptoms-list">
        {symptoms.map((symptom, index) => (
          <div key={index} className="danger-symptom-item">
            <span className="danger-icon">⚡</span>
            <span>{symptom}</span>
          </div>
        ))}
      </div>
      <p className="warning-recommendation">
        We strongly recommend consulting with a healthcare professional immediately.
      </p>
      <div className="warning-actions">
        <button className="consultation-button" onClick={onConsultation}>
          Consult Doctor Now
        </button>
        <button className="continue-button" onClick={onContinue}>
          Continue Anyway
        </button>
      </div>
    </div>
  )
}

export default DangerWarning

