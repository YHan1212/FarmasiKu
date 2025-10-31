import React, { useState } from 'react'
import './OrderSuccess.css'

function OrderSuccess({ medications, onReset }) {
  const [expandedMedications, setExpandedMedications] = useState({})

  const toggleUsage = (medicationName) => {
    setExpandedMedications({
      ...expandedMedications,
      [medicationName]: !expandedMedications[medicationName]
    })
  }

  const totalPrice = medications.reduce((sum, m) => sum + m.price, 0)

  return (
    <div className="order-success">
      <div className="success-content">
        <div className="success-icon">✅</div>
        <h2 className="success-title">Payment Successful!</h2>
        <p className="success-message">
          Your order has been confirmed. Medication will be shipped shortly.
        </p>
        <div className="success-details">
          <div className="order-info">
            <p className="order-item">
              <span className="info-label">Items Ordered:</span>
              <span className="info-value">{medications.length} medication(s)</span>
            </p>
            <p className="order-item">
              <span className="info-label">Total Amount Paid:</span>
              <span className="info-value">RM {totalPrice.toFixed(2)}</span>
            </p>
            <p className="delivery-info">
              <span className="info-label">Estimated Delivery Time:</span>
              <span className="info-value">30 minutes</span>
            </p>
          </div>
        </div>

        {/* Medication Usage Instructions */}
        <div className="medications-usage-section">
          <h3 className="usage-section-title">Usage Instructions</h3>
          {medications.map((medication, index) => (
            medication.usage && (
              <div key={index} className="medication-usage-card">
                <button
                  className="usage-toggle"
                  onClick={() => toggleUsage(medication.name)}
                >
                  <span className="usage-icon">{medication.usage.icon || '📋'}</span>
                  <span className="usage-label">
                    {medication.name}
                  </span>
                  <span className="toggle-icon">
                    {expandedMedications[medication.name] ? '▲' : '▼'}
                  </span>
                </button>
                
                {expandedMedications[medication.name] && (
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
                      <span className="instructions-label">Important Instructions:</span>
                      <p className="instructions-text">{medication.usage.instructions}</p>
                    </div>
                  </div>
                )}
              </div>
            )
          ))}
        </div>

        <button className="reset-button" onClick={onReset}>
          Back to Home
        </button>
      </div>
    </div>
  )
}

export default OrderSuccess

