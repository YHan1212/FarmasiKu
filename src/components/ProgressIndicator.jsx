import React from 'react'
import './ProgressIndicator.css'

function ProgressIndicator({ currentStep, totalSteps, stepName }) {
  const percentage = (currentStep / totalSteps) * 100

  return (
    <div className="progress-indicator">
      <div className="progress-header">
        <span className="step-info">Step {currentStep} of {totalSteps}</span>
        <span className="step-name">{stepName}</span>
      </div>
      <div className="progress-bar-container">
        <div className="progress-bar" style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  )
}

export default ProgressIndicator

