import React, { useState } from 'react'
import './AgeInput.css'

function AgeInput({ onContinue }) {
  const [age, setAge] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = () => {
    const ageNum = parseInt(age)
    if (!age || isNaN(ageNum) || ageNum < 0 || ageNum > 150) {
      setError('Please enter a valid age (0-150)')
      return
    }
    onContinue(ageNum)
  }

  const getAgeCategory = (age) => {
    if (age < 13) return 'child'
    if (age < 65) return 'adult'
    return 'elderly'
  }

  const ageCategory = age ? getAgeCategory(parseInt(age)) : null

  return (
    <div className="age-input">
      <div className="question-container">
        <h2 className="question-title">Enter Your Age</h2>
        <p className="question-subtitle">Your age helps us provide more accurate medication recommendations</p>
      </div>

      <div className="age-input-container">
        <div className="input-wrapper">
          <input
            type="number"
            min="0"
            max="150"
            value={age}
            onChange={(e) => {
              setAge(e.target.value)
              setError('')
            }}
            placeholder="Enter your age"
            className="age-input-field"
          />
          <span className="input-label">years old</span>
        </div>

        {error && (
          <p className="error-message">{error}</p>
        )}

        {ageCategory && (
          <div className="age-category-info">
            <span className="category-label">Age Category:</span>
            <span className={`category-badge ${ageCategory}`}>
              {ageCategory === 'child' && '👶 Child (Under 13)'}
              {ageCategory === 'adult' && '👤 Adult (13-64)'}
              {ageCategory === 'elderly' && '👴 Elderly (65+)'}
            </span>
          </div>
        )}
      </div>

      <div className="action-buttons">
        <button
          className="primary-button"
          onClick={handleSubmit}
          disabled={!age}
        >
          Continue
        </button>
      </div>

      <div className="privacy-note">
        <p>🔒 Your age information is used only for medication safety and will not be stored.</p>
      </div>
    </div>
  )
}

export default AgeInput

