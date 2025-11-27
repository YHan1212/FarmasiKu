import React, { useState } from 'react'
import './AcceptOrderDialog.css'

function AcceptOrderDialog({ order, onAccept, onCancel }) {
  const [selectedHour, setSelectedHour] = useState(new Date().getHours())
  const [selectedMinute, setSelectedMinute] = useState(30) // 默认30分钟

  const handleAccept = () => {
    // 计算预计送达时间
    const now = new Date()
    const deliveryTime = new Date(now)
    deliveryTime.setHours(selectedHour)
    deliveryTime.setMinutes(selectedMinute)
    deliveryTime.setSeconds(0)
    deliveryTime.setMilliseconds(0)

    // 如果选择的时间早于当前时间，设置为明天
    if (deliveryTime <= now) {
      deliveryTime.setDate(deliveryTime.getDate() + 1)
    }

    onAccept({
      estimatedDeliveryTime: deliveryTime.toISOString()
    })
  }

  // 生成小时选项（0-23）
  const hours = Array.from({ length: 24 }, (_, i) => i)
  
  // 分钟选项（只能选择 15, 30, 45）
  const minutes = [15, 30, 45]

  return (
    <div className="accept-order-dialog-overlay">
      <div className="accept-order-dialog">
        <h3>Accept Order & Set Delivery Time</h3>
        
        <div className="order-info">
          <p><strong>Order ID:</strong> {order.id.substring(0, 8)}...</p>
          {order.delivery_address && (
            <div className="delivery-address">
              <p><strong>Delivery Address:</strong></p>
              <p>{order.delivery_address.address_line1}</p>
              {order.delivery_address.address_line2 && <p>{order.delivery_address.address_line2}</p>}
              {order.delivery_address.postal_code && <p>{order.delivery_address.postal_code}</p>}
              {order.delivery_address.city && <p>{order.delivery_address.city}</p>}
              {order.delivery_address.state && <p>{order.delivery_address.state}</p>}
            </div>
          )}
          {order.phone_number && (
            <p><strong>Phone Number:</strong> {order.phone_number}</p>
          )}
          <p><strong>Order Total:</strong> RM {parseFloat(order.total_amount || 0).toFixed(2)}</p>
        </div>

        <div className="time-selection">
          <label>Estimated Delivery Time</label>
          <div className="time-inputs">
            <div className="time-input-group">
              <label>Hour</label>
              <select
                value={selectedHour}
                onChange={(e) => setSelectedHour(parseInt(e.target.value))}
                className="time-select"
              >
                {hours.map(hour => (
                  <option key={hour} value={hour}>
                    {hour.toString().padStart(2, '0')}
                  </option>
                ))}
              </select>
            </div>
            <span className="time-separator">:</span>
            <div className="time-input-group">
              <label>Minute</label>
              <select
                value={selectedMinute}
                onChange={(e) => setSelectedMinute(parseInt(e.target.value))}
                className="time-select"
              >
                {minutes.map(minute => (
                  <option key={minute} value={minute}>
                    {minute.toString().padStart(2, '0')}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="estimated-time">
            Estimated: {selectedHour.toString().padStart(2, '0')}:{selectedMinute.toString().padStart(2, '0')}
          </p>
        </div>

        <div className="dialog-actions">
          <button className="cancel-btn" onClick={onCancel}>
            Cancel
          </button>
          <button className="accept-btn" onClick={handleAccept}>
            Accept Order
          </button>
        </div>
      </div>
    </div>
  )
}

export default AcceptOrderDialog

