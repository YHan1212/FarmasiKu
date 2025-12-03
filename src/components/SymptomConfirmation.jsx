import React from 'react'
import './SymptomConfirmation.css'

function SymptomConfirmation({ symptoms, symptomAssessments, onConfirm }) {
  return (
    <div className="symptom-confirmation">
      <div className="question-container">
        <h2 className="question-title">Review Your Symptoms</h2>
        <p className="question-subtitle">Please review if the following symptoms match your condition</p>
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
                      Severity: {assessment.intensity}/10 | 
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
        <p className="question-text">Does this match your current condition, or is it more severe?</p>
      </div>

      <div className="action-buttons">
        <button
          className="primary-button"
          onClick={() => onConfirm(false)}
        >
          Matches My Condition
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

