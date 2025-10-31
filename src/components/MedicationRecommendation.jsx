import React, { useState } from 'react'
import './MedicationRecommendation.css'

function MedicationRecommendation({ symptoms, medications, userAge, onOrder }) {
  const [selectedMedications, setSelectedMedications] = useState([])

  const toggleMedication = (medication) => {
    if (medication.restricted) return // Don't allow selection of restricted medications
    
    if (selectedMedications.some(m => m.name === medication.name)) {
      setSelectedMedications(selectedMedications.filter(m => m.name !== medication.name))
    } else {
      setSelectedMedications([...selectedMedications, medication])
    }
  }

  const handleProceedToPayment = () => {
    if (selectedMedications.length > 0) {
      onOrder(selectedMedications)
    }
  }

  const getAgeCategoryLabel = (category) => {
    if (category === 'child') return '👶 Child'
    if (category === 'elderly') return '👴 Elderly'
    return '👤 Adult'
  }

  const isSelected = (medication) => {
    return selectedMedications.some(m => m.name === medication.name)
  }

  const totalPrice = selectedMedications.reduce((sum, med) => sum + med.price, 0)

  return (
    <div className="medication-recommendation">
      <div className="question-container">
        <h2 className="question-title">Medication Recommendation</h2>
        <p className="question-subtitle">
          Based on your symptoms{userAge && ` and age (${userAge} years)`}, we recommend the following medications
        </p>
      </div>

      <div className="medications-list">
        {medications.map((medication, index) => {
          const selected = isSelected(medication)
          return (
            <div 
              key={index} 
              className={`medication-card ${medication.restricted ? 'restricted' : ''} ${selected ? 'selected' : ''}`}
              onClick={() => !medication.restricted && toggleMedication(medication)}
            >
              {!medication.restricted && (
                <div className="selection-checkbox">
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggleMedication(medication)}
                    onClick={(e) => e.stopPropagation()}
                    className="medication-checkbox"
                  />
                  <span className="checkmark">{selected ? '✓' : ''}</span>
                </div>
              )}
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
              </div>
              {medication.restricted && (
                <button
                  className="restricted-button"
                  disabled={true}
                >
                  Consult Doctor First
                </button>
              )}
            </div>
          )
        })}
      </div>

      {selectedMedications.length > 0 && (
        <div className="selection-summary">
          <div className="summary-info">
            <span className="selected-count">{selectedMedications.length} medication(s) selected</span>
            <span className="total-price">Total: RM {totalPrice.toFixed(2)}</span>
          </div>
          <button
            className="proceed-button"
            onClick={handleProceedToPayment}
          >
            Proceed to Payment
          </button>
        </div>
      )}

      {medications.length === 0 && (
        <div className="no-medications">
          <p>Sorry, no medications available</p>
        </div>
      )}
    </div>
  )
}

export default MedicationRecommendation

