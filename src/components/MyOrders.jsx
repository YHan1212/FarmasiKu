import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { databaseService } from '../services/databaseService'
import './MyOrders.css'

function MyOrders({ user, onBack, onTrackOrder }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadOrders()
  }, [user])

  const loadOrders = async () => {
    if (!user) return

    try {
      const orderHistory = await databaseService.getOrderHistory(user.id)
      const ordersWithStatus = orderHistory.map(order => ({
        ...order,
        delivery_status: (order.delivery_status || order.status || 'pending').toLowerCase()
      }))
      setOrders(ordersWithStatus)
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmDelivery = async (orderId) => {
    if (!supabase) {
      alert('Database is not configured. Please contact support.')
      return
    }

    if (!confirm('Confirm that you have received this order?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('orders')
        .update({
          delivery_status: 'delivered',
          delivered_at: new Date().toISOString()
        })
        .eq('id', orderId)

      if (error) throw error

      setLoading(true)
      await loadOrders()
      await new Promise(resolve => setTimeout(resolve, 1500))
      setLoading(false)
    } catch (error) {
      console.error('Error confirming delivery:', error)
      setLoading(false)
      alert(`Failed to confirm delivery: ${error.message}`)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getDeliveryStatusLabel = (status) => {
    const statusMap = {
      pending: 'Pending',
      accepted: 'Accepted',
      preparing: 'Preparing',
      out_for_delivery: 'Out for Delivery',
      delivered: 'Delivered'
    }
    return statusMap[status] || 'Pending'
  }

  const getDeliveryStatusProgress = (status) => {
    const progressMap = {
      pending: 0,
      accepted: 25,
      preparing: 50,
      out_for_delivery: 75,
      delivered: 100
    }
    return progressMap[status] || 0
  }

  if (loading) {
    return (
      <div className="my-orders">
        <div className="loading-state">Loading orders...</div>
      </div>
    )
  }

  return (
    <div className="my-orders">
      <div className="my-orders-header">
        <h2>📦 My Orders</h2>
        {onBack && (
          <button className="back-button" onClick={onBack}>
            ← Back
          </button>
        )}
      </div>

      <div className="orders-list">
        {orders.length === 0 ? (
          <div className="empty-state">
            <p>No orders yet</p>
            <p className="empty-subtitle">Your order history will appear here</p>
          </div>
        ) : (
          orders.map((order) => {
            const deliveryStatus = (order.delivery_status || order.status || 'pending').toLowerCase()
            const deliveryAddress = typeof order.delivery_address === 'string' 
              ? (order.delivery_address ? JSON.parse(order.delivery_address) : null)
              : order.delivery_address

            return (
              <div key={order.id} className="order-card">
                <div className="order-header">
                  <div>
                    <h3>Order #{order.id.substring(0, 8)}</h3>
                    <p className="order-date">
                      {formatDate(order.created_at)}
                    </p>
                  </div>
                  <div className="order-status">
                    <span className={`status-badge status-${deliveryStatus}`}>
                      {getDeliveryStatusLabel(deliveryStatus)}
                    </span>
                  </div>
                </div>

                {/* Delivery Status Progress */}
                <div className="delivery-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${getDeliveryStatusProgress(deliveryStatus)}%` }}
                      key={`progress-${order.id}-${deliveryStatus}`}
                    ></div>
                  </div>
                  <div className="progress-steps">
                    <span className={deliveryStatus !== 'pending' ? 'completed' : ''}>Ordered</span>
                    <span className={['accepted', 'preparing', 'out_for_delivery', 'delivered'].includes(deliveryStatus) ? 'completed' : ''}>Accepted</span>
                    <span className={['preparing', 'out_for_delivery', 'delivered'].includes(deliveryStatus) ? 'completed' : ''}>Preparing</span>
                    <span className={['out_for_delivery', 'delivered'].includes(deliveryStatus) ? 'completed' : ''}>On the Way</span>
                    <span className={deliveryStatus === 'delivered' ? 'completed' : ''}>Delivered</span>
                  </div>
                </div>

                {/* Delivery Information */}
                {(deliveryAddress || order.phone_number || order.estimated_delivery_time) && (
                  <div className="delivery-info-section">
                    {deliveryAddress && (
                      <div className="delivery-address-info">
                        <strong>📍 Delivery Address:</strong>
                        <p>{deliveryAddress.address_line1}</p>
                        {deliveryAddress.address_line2 && <p>{deliveryAddress.address_line2}</p>}
                        {deliveryAddress.postal_code && <p>{deliveryAddress.postal_code}</p>}
                        {deliveryAddress.city && deliveryAddress.state && (
                          <p>{deliveryAddress.city}, {deliveryAddress.state}</p>
                        )}
                      </div>
                    )}
                    {order.phone_number && (
                      <div className="delivery-phone-info">
                        <strong>📞 Phone:</strong> {order.phone_number}
                      </div>
                    )}
                    {order.estimated_delivery_time && (
                      <div className="estimated-delivery-info">
                        <strong>⏰ Estimated Delivery:</strong> {formatDate(order.estimated_delivery_time)}
                      </div>
                    )}
                  </div>
                )}
              
                <div className="order-items">
                  {order.order_items?.map((item, index) => (
                    <div key={index} className="order-item">
                      <span className="item-name">{item.medication_name}</span>
                      <span className="item-price">RM {item.medication_price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="order-footer">
                  <div className="order-total">
                    Total: <strong>RM {parseFloat(order.total_amount || 0).toFixed(2)}</strong>
                  </div>
                  <div className="order-payment">
                    Payment: {order.payment_method}
                  </div>
                </div>

                {/* Confirm Delivery Button */}
                <div className="order-actions">
                  {deliveryStatus === 'out_for_delivery' && (
                    <button 
                      className="confirm-delivery-btn"
                      onClick={() => handleConfirmDelivery(order.id)}
                    >
                      ✅ Confirm Delivery
                    </button>
                  )}
                  {onTrackOrder && (
                    <button 
                      className="track-order-btn"
                      onClick={() => onTrackOrder(order.id)}
                    >
                      📍 Track Order
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default MyOrders

