import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import './NotificationCenter.css'

function NotificationCenter({ user, onClose }) {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    loadNotifications()

    // Subscribe to realtime updates for orders
    const ordersChannel = supabase
      .channel('notifications:orders')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          handleOrderUpdate(payload.new)
        }
      )
      .subscribe()

    // Subscribe to consultation queue updates
    const queueChannel = supabase
      .channel('notifications:queue')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'consultation_queue',
          filter: `patient_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.new.status === 'matched') {
            addNotification({
              type: 'consultation_matched',
              title: 'Pharmacist Matched',
              message: 'A pharmacist is ready to chat with you!',
              timestamp: new Date().toISOString(),
              read: false
            })
          }
        }
      )
      .subscribe()

    return () => {
      ordersChannel.unsubscribe()
      queueChannel.unsubscribe()
    }
  }, [user])

  const loadNotifications = async () => {
    if (!user) return

    try {
      setLoading(true)
      // Load from localStorage (in a real app, this would be from database)
      const stored = localStorage.getItem(`notifications_${user.id}`)
      if (stored) {
        const parsed = JSON.parse(stored)
        setNotifications(parsed)
        setUnreadCount(parsed.filter(n => !n.read).length)
      }
    } catch (error) {
      // Silent fail - notifications are not critical
    } finally {
      setLoading(false)
    }
  }

  const saveNotifications = (newNotifications) => {
    if (!user) return
    localStorage.setItem(`notifications_${user.id}`, JSON.stringify(newNotifications))
    setNotifications(newNotifications)
    setUnreadCount(newNotifications.filter(n => !n.read).length)
  }

  const handleOrderUpdate = (order) => {
    let notification = null

    switch (order.delivery_status) {
      case 'accepted':
        notification = {
          type: 'order_accepted',
          title: 'Order Accepted',
          message: `Your order #${order.id.slice(0, 8)} has been accepted. Estimated delivery: ${order.estimated_delivery_time || 'Soon'}`,
          orderId: order.id,
          timestamp: new Date().toISOString(),
          read: false
        }
        break
      case 'preparing':
        notification = {
          type: 'order_preparing',
          title: 'Order Preparing',
          message: `Your order #${order.id.slice(0, 8)} is being prepared.`,
          orderId: order.id,
          timestamp: new Date().toISOString(),
          read: false
        }
        break
      case 'out_for_delivery':
        notification = {
          type: 'order_delivering',
          title: 'Out for Delivery',
          message: `Your order #${order.id.slice(0, 8)} is on the way!`,
          orderId: order.id,
          timestamp: new Date().toISOString(),
          read: false
        }
        break
      case 'delivered':
        notification = {
          type: 'order_delivered',
          title: 'Order Delivered',
          message: `Your order #${order.id.slice(0, 8)} has been delivered. Please confirm receipt.`,
          orderId: order.id,
          timestamp: new Date().toISOString(),
          read: false
        }
        break
    }

    if (notification) {
      addNotification(notification)
      // Show browser notification if permission granted
      showBrowserNotification(notification)
    }
  }

  const addNotification = (notification) => {
    const updated = [notification, ...notifications].slice(0, 50) // Keep last 50
    saveNotifications(updated)
  }

  const showBrowserNotification = (notification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.orderId || notification.type
      })
    }
  }

  const markAsRead = (index) => {
    const updated = [...notifications]
    updated[index].read = true
    saveNotifications(updated)
  }

  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }))
    saveNotifications(updated)
  }

  const deleteNotification = (index) => {
    const updated = notifications.filter((_, i) => i !== index)
    saveNotifications(updated)
  }

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission()
    }
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'order_accepted':
      case 'order_preparing':
      case 'order_delivering':
      case 'order_delivered':
        return '📦'
      case 'consultation_matched':
        return '💬'
      default:
        return '🔔'
    }
  }

  return (
    <div className="notification-center">
      <div className="notification-header">
        <h2>Notifications</h2>
        <div className="notification-actions">
          {unreadCount > 0 && (
            <button className="mark-all-read-btn" onClick={markAllAsRead}>
              Mark all as read
            </button>
          )}
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
      </div>

      {!loading && (
        <>
          {Notification.permission === 'default' && (
            <div className="notification-permission-banner">
              <p>Enable browser notifications to stay updated</p>
              <button onClick={requestNotificationPermission}>
                Enable Notifications
              </button>
            </div>
          )}

          {notifications.length === 0 ? (
            <div className="notification-empty">
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="notification-list">
              {notifications.map((notification, index) => (
                <div
                  key={index}
                  className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                  onClick={() => !notification.read && markAsRead(index)}
                >
                  <div className="notification-icon">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="notification-content">
                    <h4>{notification.title}</h4>
                    <p>{notification.message}</p>
                    <span className="notification-time">
                      {formatTime(notification.timestamp)}
                    </span>
                  </div>
                  <button
                    className="delete-notification-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteNotification(index)
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default NotificationCenter

