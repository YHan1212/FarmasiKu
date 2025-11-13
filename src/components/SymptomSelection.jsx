import React, { useState, useEffect } from 'react'
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
  const [expandedSymptom, setExpandedSymptom] = useState(null)
  const [assessmentData, setAssessmentData] = useState({})

  // Initialize assessment data from existing assessments
  useEffect(() => {
    if (symptomAssessments) {
      const initialized = {}
      Object.keys(symptomAssessments).forEach(symptom => {
        const assessment = symptomAssessments[symptom]
        const durationMatch = assessment.duration?.match(/(\d+)\s+(\w+)/)
        initialized[symptom] = {
          intensity: assessment.intensity || 5,
          duration: durationMatch ? durationMatch[2] : 'hours',
          durationValue: durationMatch ? parseInt(durationMatch[1]) : 1,
          frequency: assessment.frequency || 'occasional'
        }
      })
      setAssessmentData(prev => ({ ...prev, ...initialized }))
    }
  }, [symptomAssessments])

  const handleToggleSymptom = (symptom) => {
    const isCurrentlySelected = selectedSymptoms.includes(symptom)
    
    if (isCurrentlySelected) {
      // If already selected, toggle expand/collapse instead of deselecting
      if (expandedSymptom === symptom) {
        setExpandedSymptom(null)
      } else {
        setExpandedSymptom(symptom)
        // Initialize assessment data if not exists
        if (!assessmentData[symptom]) {
          setAssessmentData({
            ...assessmentData,
            [symptom]: {
              intensity: 5,
              duration: 'hours',
              durationValue: 1,
              frequency: 'occasional'
            }
          })
        }
      }
    } else {
      // If not selected, select it and expand
      onToggle(symptom)
      setExpandedSymptom(symptom)
      // Initialize assessment data
      if (!assessmentData[symptom]) {
        setAssessmentData({
          ...assessmentData,
          [symptom]: {
            intensity: 5,
            duration: 'hours',
            durationValue: 1,
            frequency: 'occasional'
          }
        })
      }
    }
  }

  const handleDeselectSymptom = (symptom, e) => {
    e.stopPropagation()
    onToggle(symptom)
    if (expandedSymptom === symptom) {
      setExpandedSymptom(null)
    }
  }

  const handleAssessmentChange = (symptom, field, value) => {
    setAssessmentData({
      ...assessmentData,
      [symptom]: {
        ...assessmentData[symptom],
        [field]: value
      }
    })
  }

  const handleSaveAssessment = (symptom) => {
    const data = assessmentData[symptom]
    if (data) {
      const assessment = {
        symptom,
        intensity: data.intensity,
        duration: `${data.durationValue} ${data.duration}`,
        frequency: data.frequency
      }
      onAssess(symptom, assessment)
      setExpandedSymptom(null)
    }
  }

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
          const isExpanded = expandedSymptom === symptom
          // Get current data from state or use defaults
          const currentData = assessmentData[symptom] || {
            intensity: 5,
            duration: 'hours',
            durationValue: 1,
            frequency: 'occasional'
          }

          return (
            <div key={index} className="symptom-item-container">
              <div className="symptom-item-wrapper">
                <button
                  className={`symptom-button ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleToggleSymptom(symptom)}
                >
                  <span 
                    className="checkbox"
                    onClick={(e) => {
                      if (isSelected) {
                        handleDeselectSymptom(symptom, e)
                      }
                    }}
                  >
                    {isSelected ? '✓' : ''}
                  </span>
                  <span className="symptom-text">{symptom}</span>
                  {isSelected && (
                    <span className="expand-icon">
                      {isExpanded ? '▲' : '▼'}
                    </span>
                  )}
                </button>
                {isSelected && hasAssessment && !isExpanded && (
                  <span className="assessed-badge">
                    ✓ Assessed
                  </span>
                )}
              </div>
              
              {/* Inline Assessment Panel */}
              {isSelected && isExpanded && (
                <div className="inline-assessment-panel">
                  <div className="assessment-header">
                    <h3>Assess: {symptom}</h3>
                  </div>
                  
                  <div className="assessment-content">
                    {/* Intensity */}
                    <div className="assessment-field">
                      <label>Severity (1-10): <strong>{currentData.intensity}</strong></label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={currentData.intensity}
                        onChange={(e) => handleAssessmentChange(symptom, 'intensity', parseInt(e.target.value))}
                        className="intensity-slider"
                      />
                      <div className="intensity-labels">
                        <span>Mild</span>
                        <span>Moderate</span>
                        <span>Severe</span>
                      </div>
                    </div>

                    {/* Duration */}
                    <div className="assessment-field">
                      <label>How long?</label>
                      <div className="duration-input-group">
                        <input
                          type="number"
                          min="1"
                          value={currentData.durationValue}
                          onChange={(e) => handleAssessmentChange(symptom, 'durationValue', parseInt(e.target.value) || 1)}
                          className="duration-number-input"
                        />
                        <select
                          value={currentData.duration}
                          onChange={(e) => handleAssessmentChange(symptom, 'duration', e.target.value)}
                          className="duration-unit-select"
                        >
                          <option value="hours">Hours</option>
                          <option value="days">Days</option>
                          <option value="weeks">Weeks</option>
                        </select>
                      </div>
                    </div>

                    {/* Frequency */}
                    <div className="assessment-field">
                      <label>Frequency</label>
                      <div className="frequency-buttons">
                        <button
                          className={`frequency-btn ${currentData.frequency === 'occasional' ? 'active' : ''}`}
                          onClick={() => handleAssessmentChange(symptom, 'frequency', 'occasional')}
                        >
                          Occasional
                        </button>
                        <button
                          className={`frequency-btn ${currentData.frequency === 'frequent' ? 'active' : ''}`}
                          onClick={() => handleAssessmentChange(symptom, 'frequency', 'frequent')}
                        >
                          Frequent
                        </button>
                        <button
                          className={`frequency-btn ${currentData.frequency === 'continuous' ? 'active' : ''}`}
                          onClick={() => handleAssessmentChange(symptom, 'frequency', 'continuous')}
                        >
                          Continuous
                        </button>
                      </div>
                    </div>

                    <button
                      className="save-assessment-btn"
                      onClick={() => handleSaveAssessment(symptom)}
                    >
                      ✓ Save Assessment
                    </button>
                  </div>
                </div>
              )}

              {/* Show existing assessment summary if not expanded */}
              {isSelected && hasAssessment && !isExpanded && (
                <div className="assessment-summary">
                  <span>Severity: {symptomAssessments[symptom].intensity}/10</span>
                  <span>•</span>
                  <span>Duration: {symptomAssessments[symptom].duration}</span>
                  <span>•</span>
                  <span>{symptomAssessments[symptom].frequency}</span>
                  <button
                    className="edit-assessment-btn"
                    onClick={() => setExpandedSymptom(symptom)}
                  >
                    Edit
                  </button>
                </div>
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

