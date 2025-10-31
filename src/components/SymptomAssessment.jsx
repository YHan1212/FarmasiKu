import React, { useState } from 'react'
import './SymptomAssessment.css'

function SymptomAssessment({ symptom, onComplete, onBack }) {
  const [intensity, setIntensity] = useState(5)
  const [duration, setDuration] = useState('hours')
  const [durationValue, setDurationValue] = useState(1)
  const [frequency, setFrequency] = useState('occasional')

  const handleSubmit = () => {
    const assessment = {
      symptom,
      intensity,
      duration: `${durationValue} ${duration}`,
      frequency
    }
    onComplete(assessment)
  }

  return (
    <div className="symptom-assessment">
      <div className="question-container">
        <h2 className="question-title">Assess Your Symptom</h2>
        <p className="question-subtitle">Please provide details about: <strong>{symptom}</strong></p>
      </div>

      <div className="assessment-form">
        <div className="assessment-item">
          <label className="assessment-label">Intensity (1-10)</label>
          <div className="intensity-selector">
            <input
              type="range"
              min="1"
              max="10"
              value={intensity}
              onChange={(e) => setIntensity(parseInt(e.target.value))}
              className="intensity-slider"
            />
            <div className="intensity-value">{intensity}</div>
          </div>
          <div className="intensity-labels">
            <span>Mild</span>
            <span>Moderate</span>
            <span>Severe</span>
          </div>
        </div>

        <div className="assessment-item">
          <label className="assessment-label">Duration</label>
          <div className="duration-input">
            <input
              type="number"
              min="1"
              value={durationValue}
              onChange={(e) => setDurationValue(parseInt(e.target.value) || 1)}
              className="duration-number"
            />
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="duration-unit"
            >
              <option value="hours">Hours</option>
              <option value="days">Days</option>
              <option value="weeks">Weeks</option>
            </select>
          </div>
        </div>

        <div className="assessment-item">
          <label className="assessment-label">Frequency</label>
          <div className="frequency-options">
            <button
              className={`frequency-button ${frequency === 'occasional' ? 'active' : ''}`}
              onClick={() => setFrequency('occasional')}
            >
              Occasional
            </button>
            <button
              className={`frequency-button ${frequency === 'frequent' ? 'active' : ''}`}
              onClick={() => setFrequency('frequent')}
            >
              Frequent
            </button>
            <button
              className={`frequency-button ${frequency === 'continuous' ? 'active' : ''}`}
              onClick={() => setFrequency('continuous')}
            >
              Continuous
            </button>
          </div>
        </div>
      </div>

      <div className="action-buttons">
        <button className="secondary-button" onClick={onBack}>
          Back
        </button>
        <button className="primary-button" onClick={handleSubmit}>
          Continue
        </button>
      </div>
    </div>
  )
}

export default SymptomAssessment

