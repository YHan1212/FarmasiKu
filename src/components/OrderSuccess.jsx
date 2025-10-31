import React from 'react'
import './OrderSuccess.css'

function OrderSuccess({ onReset }) {
  return (
    <div className="order-success">
      <div className="success-content">
        <div className="success-icon">✅</div>
        <h2 className="success-title">Order Successful!</h2>
        <p className="success-message">
          Medication shipped, estimated delivery in 30 minutes
        </p>
        <div className="success-details">
          <p className="delivery-info">
            <span className="info-label">Estimated Delivery Time:</span>
            <span className="info-value">30 minutes</span>
          </p>
        </div>
        <button className="reset-button" onClick={onReset}>
          Back to Home
        </button>
      </div>
    </div>
  )
}

export default OrderSuccess

