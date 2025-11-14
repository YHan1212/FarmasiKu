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

// Body part colors for gradient backgrounds - clean white with subtle blue
const bodyPartColors = {
  'Skin': { gradient: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)', iconBg: '#3B82F6' },
  'Feet': { gradient: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)', iconBg: '#3B82F6' },
  'Head': { gradient: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)', iconBg: '#3B82F6' },
  'Chest': { gradient: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)', iconBg: '#3B82F6' },
  'Abdomen': { gradient: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)', iconBg: '#3B82F6' },
  'Other': { gradient: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)', iconBg: '#3B82F6' }
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
          const colors = bodyPartColors[bodyPart] || { gradient: 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)', iconBg: '#3B82F6' }
          
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

