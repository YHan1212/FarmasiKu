import React from 'react'
import './BodyPartSelection.css'

function BodyPartSelection({ bodyParts, onSelect }) {
  return (
    <div className="body-part-selection">
      <div className="question-container">
        <h2 className="question-title">Where do you feel discomfort?</h2>
        <p className="question-subtitle">Please select the body part where you feel discomfort</p>
      </div>

      <div className="options-grid">
        {bodyParts.map((bodyPart, index) => (
          <button
            key={index}
            className="body-part-button"
            onClick={() => onSelect(bodyPart)}
          >
            <span className="button-icon">📍</span>
            <span className="button-text">{bodyPart}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default BodyPartSelection

