import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { databaseService } from '../services/databaseService'
import AddressManagement from './AddressManagement'
import './Profile.css'

function Profile({ user, onLogout, onRestartFlow, onTrackOrder }) {
  const [profile, setProfile] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('profile') // 'profile', 'orders', 'addresses'
  const [editingProfile, setEditingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({
    name: '',
    age: ''
  })

  useEffect(() => {
    loadUserData()
  }, [user])

  const loadUserData = async () => {
    if (!user) return

    try {
      // Load profile
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile(profileData)
      
      // Initialize form with current data
      setProfileForm({
        name: user.user_metadata?.name || user.email.split('@')[0],
        age: profileData?.age || ''
      })

      // Load orders
      const orderHistory = await databaseService.getOrderHistory(user.id)
      // Ensure delivery_status is properly set and normalized
      const ordersWithStatus = orderHistory.map(order => ({
        ...order,
        delivery_status: (order.delivery_status || order.status || 'pending').toLowerCase()
      }))
      setOrders(ordersWithStatus)
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut()
    }
    onLogout()
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
      console.log('Confirming delivery for order:', orderId)
      
      const { data, error } = await supabase
        .from('orders')
        .update({
          delivery_status: 'delivered',
          delivered_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select()

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      console.log('Update result:', data)

      // Reload orders with a small delay to ensure database is updated
      setTimeout(async () => {
        await loadUserData()
        alert('Order confirmed as delivered!')
      }, 500)
    } catch (error) {
      console.error('Error confirming delivery:', error)
      const errorMessage = error.message || 'Unknown error'
      alert(`Failed to confirm delivery: ${errorMessage}\n\nPlease check the browser console for more details.`)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getDeliveryStatusLabel = (status) => {
    const labels = {
      'pending': 'Pending',
      'accepted': 'Accepted',
      'preparing': 'Preparing',
      'out_for_delivery': 'Out for Delivery',
      'delivered': 'Delivered'
    }
    return labels[status] || status
  }

  const getDeliveryStatusProgress = (status) => {
    const progress = {
      'pending': 0,
      'accepted': 25,
      'preparing': 50,
      'out_for_delivery': 75,
      'delivered': 100
    }
    return progress[status] || 0
  }

  const handleEditProfile = () => {
    setEditingProfile(true)
    setProfileForm({
      name: user.user_metadata?.name || user.email.split('@')[0],
      age: profile?.age || ''
    })
  }

  const handleCancelEdit = () => {
    setEditingProfile(false)
    setProfileForm({
      name: user.user_metadata?.name || user.email.split('@')[0],
      age: profile?.age || ''
    })
  }

  const handleSaveProfile = async () => {
    if (!supabase || !user) return

    try {
      // Update user metadata (name)
      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          name: profileForm.name
        }
      })

      if (metadataError) throw metadataError

      // Update profile (age)
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          age: profileForm.age ? parseInt(profileForm.age) : null
        })
        .eq('id', user.id)

      if (profileError) throw profileError

      // Reload data
      await loadUserData()
      setEditingProfile(false)
      alert('Profile updated successfully!')
    } catch (error) {
      console.error('Error updating profile:', error)
      alert(`Failed to update profile: ${error.message || 'Unknown error'}`)
    }
  }

  if (loading) {
    return (
      <div className="profile-container">
        <div className="loading">Loading...</div>
      </div>
    )
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h2>My Profile</h2>
        <div className="profile-header-actions">
          {onRestartFlow && (
            <button className="restart-flow-btn" onClick={onRestartFlow}>
              🔄 Start New Consultation
            </button>
          )}
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="profile-tabs">
        <button
          className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
        <button
          className={`tab-button ${activeTab === 'addresses' ? 'active' : ''}`}
          onClick={() => setActiveTab('addresses')}
        >
          Addresses
        </button>
        <button
          className={`tab-button ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          Orders ({orders.length})
        </button>
      </div>

      <div className="profile-content">
        {activeTab === 'profile' && (
          <div className="profile-info">
            <div className="profile-section-header">
              <h3>Personal Information</h3>
              {!editingProfile && (
                <button className="edit-profile-btn" onClick={handleEditProfile}>
                  ✏️ Edit
                </button>
              )}
            </div>

            {editingProfile ? (
              <div className="profile-edit-form">
                <div className="form-group">
                  <label>Email</label>
                  <p className="readonly-field">{user.email}</p>
                  <small className="field-note">Email cannot be changed</small>
                </div>
                <div className="form-group">
                  <label htmlFor="profile-name">Name *</label>
                  <input
                    id="profile-name"
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    placeholder="Enter your name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="profile-age">Age</label>
                  <input
                    id="profile-age"
                    type="number"
                    min="1"
                    max="120"
                    value={profileForm.age}
                    onChange={(e) => setProfileForm({ ...profileForm, age: e.target.value })}
                    placeholder="Enter your age"
                  />
                </div>
                <div className="form-actions">
                  <button className="cancel-btn" onClick={handleCancelEdit}>
                    Cancel
                  </button>
                  <button className="save-btn" onClick={handleSaveProfile}>
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="info-item">
                  <label>Email</label>
                  <p>{user.email}</p>
                </div>
                <div className="info-item">
                  <label>Name</label>
                  <p>{user.user_metadata?.name || user.email.split('@')[0]}</p>
                </div>
                {profile && (
                  <div className="info-item">
                    <label>Age</label>
                    <p>{profile.age || 'Not set'}</p>
                  </div>
                )}
                <div className="info-item">
                  <label>Member Since</label>
                  <p>{new Date(user.created_at).toLocaleDateString()}</p>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'addresses' && (
          <div className="addresses-tab">
            <AddressManagement 
              user={user} 
              onSelect={null}
              onContinue={null}
              selectedAddressId={null}
            />
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="orders-list">
            {orders.length === 0 ? (
              <div className="empty-state">
                <p>No orders yet</p>
                <p className="empty-subtitle">Your order history will appear here</p>
              </div>
            ) : (
              orders.map((order) => {
                // Ensure we get the correct delivery status
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
        )}
      </div>
    </div>
  )
}

export default Profile

