import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import './ConsultationChat.css'

function ConsultationChat({ session, user, onClose }) {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)
  const channelRef = useRef(null)

  const isDoctor = session?.doctor?.user_id === user?.id
  const isPatient = session?.patient_id === user?.id

  useEffect(() => {
    if (!session?.id) return

    loadMessages()

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`consultation:${session.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'consultation_messages',
          filter: `session_id=eq.${session.id}`
        },
        (payload) => {
          handleNewMessage(payload.new)
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      channel.unsubscribe()
    }
  }, [session?.id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadMessages = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('consultation_messages')
        .select('*')
        .eq('session_id', session.id)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error('Error loading messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleNewMessage = (message) => {
    setMessages(prev => [...prev, message])
    
    // Mark as read if it's not from current user
    if (message.sender_id !== user?.id) {
      markAsRead(message.id)
    }
  }

  const markAsRead = async (messageId) => {
    try {
      await supabase
        .from('consultation_messages')
        .update({ is_read: true })
        .eq('id', messageId)
    } catch (error) {
      console.error('Error marking message as read:', error)
    }
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    try {
      setSending(true)
      const senderType = isDoctor ? 'doctor' : 'patient'

      const { data, error } = await supabase
        .from('consultation_messages')
        .insert({
          session_id: session.id,
          sender_id: user.id,
          sender_type: senderType,
          content: newMessage.trim(),
          message_type: 'text'
        })
        .select()
        .single()

      if (error) throw error

      // Update session status to active if it's pending
      if (session.status === 'pending' || session.status === 'accepted') {
        await supabase
          .from('consultation_sessions')
          .update({ 
            status: 'active',
            started_at: session.started_at || new Date().toISOString()
          })
          .eq('id', session.id)
      }

      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date
    const minutes = Math.floor(diff / 60000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="consultation-chat-container">
        <div className="loading">Loading messages...</div>
      </div>
    )
  }

  return (
    <div className="consultation-chat-container">
      <div className="chat-header">
        <div className="chat-header-info">
          <h3>
            {isDoctor 
              ? `Patient: ${session.patient_email || 'Patient'}`
              : `Dr. ${session.doctor?.name || 'Doctor'}`
            }
          </h3>
          <p className="chat-status">
            Status: <span className={`status-${session.status}`}>{session.status}</span>
          </p>
        </div>
        <button className="close-btn" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="empty-messages">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.sender_id === user?.id
            return (
              <div
                key={message.id}
                className={`message ${isOwnMessage ? 'own-message' : 'other-message'}`}
              >
                <div className="message-content">
                  <p>{message.content}</p>
                  <span className="message-time">{formatTime(message.created_at)}</span>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-form" onSubmit={sendMessage}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className="chat-input"
          disabled={sending || session.status === 'completed'}
        />
        <button
          type="submit"
          className="send-btn"
          disabled={sending || !newMessage.trim() || session.status === 'completed'}
        >
          {sending ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  )
}

export default ConsultationChat

