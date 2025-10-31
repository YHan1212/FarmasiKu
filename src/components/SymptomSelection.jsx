import React from 'react'
import './SymptomSelection.css'

function SymptomSelection({ 
  bodyPart, 
  symptoms, 
  selectedSymptoms, 
  symptomAssessments,
  onToggle, 
  onComplete,
  onMoreSymptoms,
  onAssess,
  isSelectingMore 
}) {
  return (
    <div className="symptom-selection">
      <div className="question-container">
        <h2 className="question-title">{bodyPart} Symptoms</h2>
        <p className="question-subtitle">Please select the symptoms you are experiencing (multiple selections allowed)</p>
      </div>

      <div className="symptoms-list">
        {symptoms.map((symptom, index) => {
          const isSelected = selectedSymptoms.includes(symptom)
          const hasAssessment = symptomAssessments && symptomAssessments[symptom]
          return (
            <div key={index} className="symptom-item-wrapper">
              <button
                className={`symptom-button ${isSelected ? 'selected' : ''}`}
                onClick={() => onToggle(symptom)}
              >
                <span className="checkbox">
                  {isSelected ? '✓' : ''}
                </span>
                <span className="symptom-text">{symptom}</span>
              </button>
              {isSelected && hasAssessment && (
                <button
                  className="assess-button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onAssess(symptom)
                  }}
                  title="View/Edit Assessment"
                >
                  📊 Assessed
                </button>
              )}
              {isSelected && !hasAssessment && (
                <button
                  className="assess-button assess-pending"
                  onClick={(e) => {
                    e.stopPropagation()
                    onAssess(symptom)
                  }}
                  title="Assess this symptom"
                >
                  ⚠️ Assess
                </button>
              )}
            </div>
          )
        })}
      </div>

      {selectedSymptoms.length > 0 && (
        <div className="selected-symptoms">
          <p className="selected-title">Selected Symptoms:</p>
          <div className="selected-tags">
            {selectedSymptoms.map((symptom, index) => {
              const hasAssessment = symptomAssessments && symptomAssessments[symptom]
              return (
                <span key={index} className={`selected-tag ${hasAssessment ? 'assessed' : 'pending'}`}>
                  {symptom} {hasAssessment ? '✓' : '⚠️'}
                </span>
              )
            })}
          </div>
          {selectedSymptoms.some(s => !symptomAssessments || !symptomAssessments[s]) && (
            <p className="assessment-note">
              ⚠️ Please assess all selected symptoms for better recommendations
            </p>
          )}
        </div>
      )}

      <div className="action-buttons">
        <button
          className="secondary-button"
          onClick={onMoreSymptoms}
        >
          Any other symptoms?
        </button>
        <button
          className="primary-button"
          onClick={onComplete}
          disabled={selectedSymptoms.length === 0}
        >
          Complete Selection
        </button>
      </div>
    </div>
  )
}

export default SymptomSelection

