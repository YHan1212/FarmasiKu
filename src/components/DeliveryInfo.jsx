import React, { useState, useEffect } from 'react'
import AddressManagement from './AddressManagement'
import './DeliveryInfo.css'

function DeliveryInfo({ user, onContinue, onBack }) {
  const [selectedAddress, setSelectedAddress] = useState(null)
  const [showAddressManagement, setShowAddressManagement] = useState(true)

  const handleAddressSelect = (address) => {
    setSelectedAddress(address)
  }

  const handleContinue = () => {
    if (!selectedAddress) {
      alert('Please select a delivery address')
      return
    }
    if (onContinue) {
      onContinue({
        address: selectedAddress,
        deliveryAddress: {
          label: selectedAddress.label,
          address_line1: selectedAddress.address_line1,
          address_line2: selectedAddress.address_line2,
          postal_code: selectedAddress.postal_code,
          city: selectedAddress.city,
          state: selectedAddress.state,
          country: selectedAddress.country || 'Malaysia'
        },
        phoneNumber: selectedAddress.phone_number
      })
    }
  }

  return (
    <div className="delivery-info">
      <div className="delivery-info-header">
        <h2>Delivery Address</h2>
        <p className="subtitle">Please select your delivery address and phone number</p>
      </div>

      <div className="delivery-content">
        <AddressManagement
          user={user}
          onSelect={handleAddressSelect}
          selectedAddressId={selectedAddress?.id}
        />
      </div>

      <div className="delivery-actions">
        {onBack && (
          <button className="back-btn" onClick={onBack}>
            Back
          </button>
        )}
        <button
          className="continue-btn"
          onClick={handleContinue}
          disabled={!selectedAddress}
        >
          Continue to Payment
        </button>
      </div>
    </div>
  )
}

export default DeliveryInfo

