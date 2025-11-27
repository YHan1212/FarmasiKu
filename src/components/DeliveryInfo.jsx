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
      alert('请选择一个配送地址')
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
        <h2>配送信息</h2>
        <p className="subtitle">请选择配送地址和电话号码</p>
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
            返回
          </button>
        )}
        <button
          className="continue-btn"
          onClick={handleContinue}
          disabled={!selectedAddress}
        >
          继续到支付
        </button>
      </div>
    </div>
  )
}

export default DeliveryInfo

