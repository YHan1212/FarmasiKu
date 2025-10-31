import React from 'react'
import './SymptomConfirmation.css'

function SymptomConfirmation({ symptoms, symptomAssessments, onConfirm }) {
  return (
    <div className="symptom-confirmation">
      <div className="question-container">
        <h2 className="question-title">Confirm Your Symptoms</h2>
        <p className="question-subtitle">Please confirm if the following symptoms match your current condition</p>
      </div>

      <div className="symptoms-list">
        {symptoms.map((symptom, index) => {
          const assessment = symptomAssessments && symptomAssessments[symptom]
          return (
            <div key={index} className="symptom-item">
              <span className="symptom-number">{index + 1}</span>
              <div className="symptom-details">
                <span className="symptom-name">{symptom}</span>
                {assessment && (
                  <div className="symptom-assessment-info">
                    <span className="assessment-badge">
                      Intensity: {assessment.intensity}/10 | 
                      Duration: {assessment.duration} | 
                      Frequency: {assessment.frequency}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="confirmation-question">
        <p className="question-text">Is this your current state or more severe?</p>
      </div>

      <div className="action-buttons">
        <button
          className="primary-button"
          onClick={() => onConfirm(false)}
        >
          Current State
        </button>
        <button
          className="warning-button"
          onClick={() => onConfirm(true)}
        >
          More Severe
        </button>
      </div>
    </div>
  )
}

export default SymptomConfirmation

