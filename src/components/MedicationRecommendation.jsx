import React, { useState } from 'react'
import './MedicationRecommendation.css'

function MedicationRecommendation({ symptoms, medications, userAge, onOrder }) {
  const [selectedMedication, setSelectedMedication] = useState(null)
  const [expandedMedications, setExpandedMedications] = useState({})

  const handleOrder = (medication) => {
    setSelectedMedication(medication)
    onOrder(medication)
  }

  const toggleExpanded = (index) => {
    setExpandedMedications({
      ...expandedMedications,
      [index]: !expandedMedications[index]
    })
  }

  const getAgeCategoryLabel = (category) => {
    if (category === 'child') return '👶 Child'
    if (category === 'elderly') return '👴 Elderly'
    return '👤 Adult'
  }

  return (
    <div className="medication-recommendation">
      <div className="question-container">
        <h2 className="question-title">Medication Recommendation</h2>
        <p className="question-subtitle">
          Based on your symptoms{userAge && ` and age (${userAge} years)`}, we recommend the following medications
        </p>
      </div>

      <div className="medications-list">
        {medications.map((medication, index) => (
          <div key={index} className={`medication-card ${medication.restricted ? 'restricted' : ''}`}>
            <div className="medication-info">
              <div className="medication-header">
                <h3 className="medication-name">
                  {medication.name}
                  {medication.isChildAlternative && (
                    <span className="alternative-badge">Child-Safe Alternative</span>
                  )}
                </h3>
                {medication.ageCategory && (
                  <span className="age-badge">{getAgeCategoryLabel(medication.ageCategory)}</span>
                )}
              </div>
              <p className="medication-price">RM {medication.price.toFixed(2)}</p>
              {medication.ageWarning && (
                <div className="age-warning">
                  <span className="warning-icon">⚠️</span>
                  <span className="warning-text">{medication.ageWarning}</span>
                </div>
              )}
              {medication.isChildAlternative && medication.originalMed && (
                <div className="alternative-info">
                  <span className="info-icon">ℹ️</span>
                  <span className="info-text">
                    Replaces {medication.originalMed} (not suitable for children)
                  </span>
                </div>
              )}
              
              {/* Usage Instructions */}
              {medication.usage && (
                <div className="usage-section">
                  <button
                    className="usage-toggle"
                    onClick={() => toggleExpanded(index)}
                  >
                    <span className="usage-icon">{medication.usage.icon || '📋'}</span>
                    <span className="usage-label">
                      {expandedMedications[index] ? 'Hide' : 'Show'} Usage Instructions
                    </span>
                    <span className="toggle-icon">
                      {expandedMedications[index] ? '▲' : '▼'}
                    </span>
                  </button>
                  
                  {expandedMedications[index] && (
                    <div className="usage-details">
                      <div className="usage-item">
                        <span className="usage-key">Method:</span>
                        <span className="usage-value">{medication.usage.methodLabel}</span>
                      </div>
                      <div className="usage-item">
                        <span className="usage-key">Dosage:</span>
                        <span className="usage-value">{medication.usage.dosage}</span>
                      </div>
                      <div className="usage-item">
                        <span className="usage-key">Frequency:</span>
                        <span className="usage-value">{medication.usage.frequency}</span>
                      </div>
                      {medication.usage.maxDosage && (
                        <div className="usage-item">
                          <span className="usage-key">Max Dosage:</span>
                          <span className="usage-value">{medication.usage.maxDosage}</span>
                        </div>
                      )}
                      <div className="usage-item">
                        <span className="usage-key">Duration:</span>
                        <span className="usage-value">{medication.usage.duration}</span>
                      </div>
                      <div className="usage-instructions">
                        <span className="instructions-label">Instructions:</span>
                        <p className="instructions-text">{medication.usage.instructions}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <button
              className={`order-button ${medication.restricted ? 'restricted-button' : ''}`}
              onClick={() => handleOrder(medication)}
              disabled={medication.restricted}
            >
              {medication.restricted ? 'Consult Doctor First' : 'Order Now'}
            </button>
          </div>
        ))}
      </div>

      {medications.length === 0 && (
        <div className="no-medications">
          <p>Sorry, no medications available</p>
        </div>
      )}
    </div>
  )
}

export default MedicationRecommendation

