import React, { useState } from 'react'
import './Payment.css'

function Payment({ medications, totalPrice, onPay, onBack }) {
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [cardNumber, setCardNumber] = useState('')
  const [cardName, setCardName] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [cvv, setCvv] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setIsProcessing(true)
    
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false)
      onPay({
        medications,
        paymentMethod,
        transactionId: `TXN-${Date.now()}`
      })
    }, 2000) // Simulate 2 second payment processing
  }

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    const matches = v.match(/\d{4,16}/g)
    const match = matches && matches[0] || ''
    const parts = []
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    if (parts.length) {
      return parts.join(' ')
    } else {
      return v
    }
  }

  const formatExpiry = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4)
    }
    return v
  }

  return (
    <div className="payment">
      <div className="question-container">
        <h2 className="question-title">Payment</h2>
        <p className="question-subtitle">Complete your order payment</p>
      </div>

      <div className="order-summary">
        <h3 className="summary-title">Order Summary</h3>
        {medications.map((medication, index) => (
          <div key={index} className="summary-item">
            <span className="item-name">{medication.name}</span>
            <span className="item-price">RM {medication.price.toFixed(2)}</span>
          </div>
        ))}
        <div className="summary-total">
          <span className="total-label">Total ({medications.length} item{medications.length > 1 ? 's' : ''}):</span>
          <span className="total-price">RM {totalPrice.toFixed(2)}</span>
        </div>
      </div>

      <div className="payment-form-container">
        <form className="payment-form" onSubmit={handleSubmit}>
          <div className="payment-methods">
            <h3 className="form-title">Payment Method</h3>
            <div className="method-options">
              <button
                type="button"
                className={`method-button ${paymentMethod === 'card' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('card')}
              >
                💳 Credit/Debit Card
              </button>
              <button
                type="button"
                className={`method-button ${paymentMethod === 'ewallet' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('ewallet')}
              >
                📱 E-Wallet
              </button>
            </div>
          </div>

          {paymentMethod === 'card' && (
            <div className="card-form">
              <div className="form-group">
                <label>Card Number</label>
                <input
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  maxLength="19"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  required
                />
              </div>

              <div className="form-group">
                <label>Cardholder Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Expiry Date</label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    maxLength="5"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(formatExpiry(e.target.value))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>CVV</label>
                  <input
                    type="text"
                    placeholder="123"
                    maxLength="3"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/[^0-9]/g, ''))}
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {paymentMethod === 'ewallet' && (
            <div className="ewallet-form">
              <div className="form-group">
                <label>Select E-Wallet</label>
                <select className="ewallet-select" required>
                  <option value="">Select...</option>
                  <option value="grab">GrabPay</option>
                  <option value="touchngo">Touch 'n Go eWallet</option>
                  <option value="boost">Boost</option>
                  <option value="shopee">ShopeePay</option>
                </select>
              </div>
              <div className="ewallet-info">
                <p>💡 You will be redirected to your e-wallet app to complete the payment</p>
              </div>
            </div>
          )}

          <div className="payment-actions">
            <button
              type="button"
              className="back-button"
              onClick={onBack}
              disabled={isProcessing}
            >
              Back
            </button>
            <button
              type="submit"
              className="pay-button"
              disabled={isProcessing || (paymentMethod === 'card' && (!cardNumber || !cardName || !expiryDate || !cvv))}
            >
              {isProcessing ? (
                <>
                  <span className="spinner"></span>
                  Processing...
                </>
              ) : (
                `Pay RM ${totalPrice.toFixed(2)}`
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="security-note">
        <p>🔒 Secure payment. Your payment information is encrypted.</p>
      </div>
    </div>
  )
}

export default Payment

