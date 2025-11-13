import React from 'react'
import './BodyPartSelection.css'

// Body part icons mapping
const bodyPartIcons = {
  'Skin': '🦋',
  'Feet': '🦶',
  'Head': '🧠',
  'Chest': '💪',
  'Abdomen': '🫀',
  'Other': '🔍'
}

// Body part colors for gradient backgrounds
const bodyPartColors = {
  'Skin': { gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)', iconBg: '#ff9a9e' },
  'Feet': { gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', iconBg: '#a8edea' },
  'Head': { gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', iconBg: '#ffecd2' },
  'Chest': { gradient: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)', iconBg: '#ff6b6b' },
  'Abdomen': { gradient: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)', iconBg: '#a1c4fd' },
  'Other': { gradient: 'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)', iconBg: '#d299c2' }
}

function BodyPartSelection({ bodyParts, onSelect }) {
  return (
    <div className="body-part-selection">
      <div className="question-container">
        <h2 className="question-title">Where do you feel discomfort?</h2>
        <p className="question-subtitle">Please select the body part where you feel discomfort</p>
      </div>

      <div className="options-grid">
        {bodyParts.map((bodyPart, index) => {
          const icon = bodyPartIcons[bodyPart] || '📍'
          const colors = bodyPartColors[bodyPart] || { gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', iconBg: '#667eea' }
          
          return (
            <button
              key={index}
              className="body-part-button"
              onClick={() => onSelect(bodyPart)}
              style={{ '--gradient': colors.gradient, '--icon-bg': colors.iconBg }}
            >
              <div className="icon-wrapper">
                <span className="button-icon">{icon}</span>
              </div>
              <span className="button-text">{bodyPart}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default BodyPartSelection

