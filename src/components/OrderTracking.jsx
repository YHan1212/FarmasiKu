import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import './OrderTracking.css'

function OrderTracking({ orderId, user, onBack }) {
  const [order, setOrder] = useState(null)
  const [orderItems, setOrderItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [timeline, setTimeline] = useState([])

  useEffect(() => {
    if (orderId && user) {
      loadOrderDetails()
      
      // Subscribe to order updates
      const channel = supabase
        .channel(`order:${orderId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
            filter: `id=eq.${orderId}`
          },
          (payload) => {
            setOrder(payload.new)
            updateTimeline(payload.new)
          }
        )
        .subscribe()

      return () => {
        channel.unsubscribe()
      }
    }
  }, [orderId, user])

  const loadOrderDetails = async () => {
    try {
      setLoading(true)

      // Load order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .eq('user_id', user.id)
        .single()

      if (orderError) throw orderError
      setOrder(orderData)

      // Load order items
      // Note: order_items table stores medication_name and medication_price directly
      // There's no foreign key to medications table
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId)

      if (itemsError) throw itemsError
      
      // Transform items to include medication info for display
      const transformedItems = (itemsData || []).map(item => ({
        ...item,
        medication: {
          name: item.medication_name,
          price: parseFloat(item.medication_price || 0)
        }
      }))
      setOrderItems(transformedItems)

      // Build timeline
      updateTimeline(orderData)
    } catch (error) {
      console.error('Error loading order details:', error)
      const errorMessage = error.message || 'Unknown error'
      alert(`Failed to load order details: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const updateTimeline = (orderData) => {
    const events = []

    // Order created
    if (orderData.created_at) {
      events.push({
        status: 'created',
        title: 'Order Placed',
        description: 'Your order has been placed successfully',
        timestamp: orderData.created_at,
        icon: '📝'
      })
    }

    // Order accepted
    if (orderData.accepted_at) {
      events.push({
        status: 'accepted',
        title: 'Order Accepted',
        description: orderData.estimated_delivery_time 
          ? `Estimated delivery: ${formatDateTime(orderData.estimated_delivery_time)}`
          : 'Your order has been accepted',
        timestamp: orderData.accepted_at,
        icon: '✅'
      })
    }

    // Preparing
    if (orderData.preparing_at) {
      events.push({
        status: 'preparing',
        title: 'Preparing Order',
        description: 'Your order is being prepared',
        timestamp: orderData.preparing_at,
        icon: '👨‍🍳'
      })
    }

    // Out for delivery
    if (orderData.out_for_delivery_at) {
      events.push({
        status: 'out_for_delivery',
        title: 'Out for Delivery',
        description: 'Your order is on the way',
        timestamp: orderData.out_for_delivery_at,
        icon: '🚚'
      })
    }

    // Delivered
    if (orderData.delivered_at) {
      events.push({
        status: 'delivered',
        title: 'Delivered',
        description: 'Your order has been delivered',
        timestamp: orderData.delivered_at,
        icon: '📦'
      })
    }

    // Sort by timestamp
    events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    setTimeline(events)
  }

  const formatDateTime = (timestamp) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDeliveryAddress = (address) => {
    if (!address) return ''
    
    // If it's a string, try to parse it as JSON
    let addressObj = address
    if (typeof address === 'string') {
      try {
        addressObj = JSON.parse(address)
      } catch (e) {
        // If parsing fails, return the string as is
        return address
      }
    }
    
    // Build address string from object
    const parts = []
    
    if (addressObj.label) {
      parts.push(<strong key="label">{addressObj.label}</strong>)
    }
    
    if (addressObj.address_line1) {
      parts.push(<span key="line1">{addressObj.address_line1}</span>)
    }
    
    if (addressObj.address_line2) {
      parts.push(<span key="line2">{addressObj.address_line2}</span>)
    }
    
    const cityStateParts = []
    if (addressObj.postal_code) {
      cityStateParts.push(addressObj.postal_code)
    }
    if (addressObj.city) {
      cityStateParts.push(addressObj.city)
    }
    if (addressObj.state) {
      cityStateParts.push(addressObj.state)
    }
    if (cityStateParts.length > 0) {
      parts.push(<span key="citystate">{cityStateParts.join(', ')}</span>)
    }
    
    if (addressObj.country) {
      parts.push(<span key="country">{addressObj.country}</span>)
    }
    
    return (
      <div className="address-lines">
        {parts.map((part, index) => (
          <div key={index} className="address-line">
            {part}
          </div>
        ))}
      </div>
    )
  }

  const getStatusInfo = (status) => {
    if (!status) return { label: 'Pending', color: '#F59E0B', progress: 0 }
    const normalizedStatus = status.toLowerCase()
    const statusMap = {
      pending: { label: 'Pending', color: '#F59E0B', progress: 0 },
      accepted: { label: 'Accepted', color: '#3B82F6', progress: 25 },
      preparing: { label: 'Preparing', color: '#8B5CF6', progress: 50 },
      out_for_delivery: { label: 'Out for Delivery', color: '#10B981', progress: 75 },
      delivered: { label: 'Delivered', color: '#059669', progress: 100 }
    }
    return statusMap[normalizedStatus] || statusMap.pending
  }

  const handleConfirmDelivery = async () => {
    if (!order || order.delivery_status !== 'out_for_delivery') return

    try {
      const { error } = await supabase
        .from('orders')
        .update({
          delivery_status: 'delivered',
          delivered_at: new Date().toISOString()
        })
        .eq('id', order.id)
        .eq('user_id', user.id)

      if (error) throw error

      // Reload order details
      await loadOrderDetails()
      alert('Delivery confirmed! Thank you for your order.')
    } catch (error) {
      console.error('Error confirming delivery:', error)
      alert('Failed to confirm delivery. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="order-tracking">
        <div className="loading-state">
          <p>Loading order details...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="order-tracking">
        <div className="error-state">
          <p>Order not found</p>
          <button onClick={onBack}>Go Back</button>
        </div>
      </div>
    )
  }

  const statusInfo = getStatusInfo(order.delivery_status || order.status || 'pending')
  const totalPrice = orderItems.reduce((sum, item) => {
    const price = item.medication?.price || parseFloat(item.medication_price || 0) || parseFloat(item.price || 0)
    const quantity = item.quantity || 1
    return sum + (price * quantity)
  }, 0)

  return (
    <div className="order-tracking">
      <div className="order-tracking-header">
        <button className="back-button" onClick={onBack}>
          ← Back
        </button>
        <h2>Order Tracking</h2>
      </div>

      <div className="order-tracking-content">
        {/* Order Summary */}
        <div className="order-summary-card">
          <div className="order-id-section">
            <h3>Order #{order.id.slice(0, 8).toUpperCase()}</h3>
            <span className={`status-badge ${order.delivery_status || 'pending'}`}>
              {statusInfo.label}
            </span>
          </div>

          <div className="order-info-grid">
            <div className="info-item">
              <label>Order Date</label>
              <p>{formatDateTime(order.created_at)}</p>
            </div>
            {order.estimated_delivery_time && (
              <div className="info-item">
                <label>Estimated Delivery</label>
                <p>{formatDateTime(order.estimated_delivery_time)}</p>
              </div>
            )}
            {order.delivery_address && (
              <div className="info-item full-width">
                <label>Delivery Address</label>
                <div className="delivery-address-display">
                  {formatDeliveryAddress(order.delivery_address)}
                </div>
              </div>
            )}
            {order.phone_number && (
              <div className="info-item">
                <label>Phone Number</label>
                <p>{order.phone_number}</p>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="progress-section">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${statusInfo.progress}%`, backgroundColor: statusInfo.color }}
              />
            </div>
            <p className="progress-text">{statusInfo.progress}% Complete</p>
          </div>
        </div>

        {/* Timeline */}
        <div className="timeline-card">
          <h3>Order Timeline</h3>
          <div className="timeline">
            {timeline.map((event, index) => (
              <div key={index} className={`timeline-item ${index === timeline.length - 1 ? 'active' : ''}`}>
                <div className="timeline-icon">{event.icon}</div>
                <div className="timeline-content">
                  <h4>{event.title}</h4>
                  <p>{event.description}</p>
                  <span className="timeline-time">{formatDateTime(event.timestamp)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Items */}
        <div className="order-items-card">
          <h3>Order Items</h3>
          <div className="items-list">
            {orderItems.map((item) => {
              const medicationName = item.medication?.name || item.medication_name || 'Unknown Medication'
              const price = item.medication?.price || parseFloat(item.medication_price || 0) || parseFloat(item.price || 0)
              const quantity = item.quantity || 1
              const totalItemPrice = price * quantity
              
              return (
                <div key={item.id} className="order-item">
                  <div className="item-info">
                    <h4>{medicationName}</h4>
                    <p>Quantity: {quantity}</p>
                  </div>
                  <div className="item-price">
                    RM {totalItemPrice.toFixed(2)}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="order-total">
            <strong>Total: RM {totalPrice.toFixed(2)}</strong>
          </div>
        </div>

        {/* Actions */}
        {order.delivery_status === 'out_for_delivery' && (
          <div className="order-actions">
            <button className="confirm-delivery-btn" onClick={handleConfirmDelivery}>
              ✓ Confirm Delivery
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default OrderTracking

