import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { databaseService } from '../services/databaseService'
import './Profile.css'

function Profile({ user, onLogout }) {
  const [profile, setProfile] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('profile') // 'profile' or 'orders'

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

      // Load orders
      const orderHistory = await databaseService.getOrderHistory(user.id)
      setOrders(orderHistory)
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    onLogout()
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
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div className="profile-tabs">
        <button
          className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Profile
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
              orders.map((order) => (
                <div key={order.id} className="order-card">
                  <div className="order-header">
                    <div>
                      <h3>Order #{order.id.substring(0, 8)}</h3>
                      <p className="order-date">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="order-status">
                      <span className={`status-badge status-${order.status}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                  
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
                      Total: <strong>RM {order.total_amount.toFixed(2)}</strong>
                    </div>
                    <div className="order-payment">
                      Payment: {order.payment_method}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Profile

