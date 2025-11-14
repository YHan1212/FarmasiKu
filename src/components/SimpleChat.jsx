import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import './SimpleChat.css'

function SimpleChat({ user, onBack, sessionId, isDoctor, otherUserInfo }) {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)
  const channelRef = useRef(null)

  useEffect(() => {
    if (!sessionId) return

    loadMessages()

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`chat:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'consultation_messages',
          filter: `session_id=eq.${sessionId}`
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
  }, [sessionId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadMessages = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('consultation_messages')
        .select('*')
        .eq('session_id', sessionId)
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
    setMessages(prev => {
      const exists = prev.some(msg => msg.id === message.id)
      if (exists) return prev
      return [...prev, message]
    })
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
          session_id: sessionId,
          sender_id: user.id,
          sender_type: senderType,
          content: newMessage.trim(),
          message_type: 'text'
        })
        .select()
        .single()

      if (error) throw error

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
      <div className="simple-chat-container">
        <div className="loading">Loading messages...</div>
      </div>
    )
  }

  return (
    <div className="simple-chat-container">
      <div className="chat-header">
        <div className="chat-header-info">
          <h3>
            {isDoctor 
              ? `Patient: ${otherUserInfo?.name || otherUserInfo?.email || 'Patient'}`
              : `Dr. ${otherUserInfo?.name || 'Doctor'}`
            }
          </h3>
        </div>
        <button className="close-btn" onClick={onBack}>
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
            // Determine if message is from current user based on sender_id
            const isFromCurrentUser = message.sender_id === user?.id
            
            // Get sender type from message or infer from context
            const messageSenderType = message.sender_type || (isFromCurrentUser ? (isDoctor ? 'doctor' : 'patient') : (isDoctor ? 'patient' : 'doctor'))
            
            // Determine if message should be on right (own message) or left (other's message)
            // Logic:
            // - If current user is doctor: doctor's messages on right, patient's on left
            // - If current user is patient: patient's messages on right, doctor's on left
            const isOwnMessage = (isDoctor && messageSenderType === 'doctor') || (!isDoctor && messageSenderType === 'patient')
            
            console.log('[SimpleChat] Message display:', {
              messageId: message.id,
              senderId: message.sender_id,
              currentUserId: user?.id,
              senderType: messageSenderType,
              isDoctor,
              isFromCurrentUser,
              isOwnMessage,
              content: message.content.substring(0, 20)
            })
            
            return (
              <div
                key={message.id}
                className={`message ${isOwnMessage ? 'own-message' : 'other-message'}`}
              >
                <div className="message-content">
                  <span className="message-sender">
                    {isFromCurrentUser 
                      ? (messageSenderType === 'doctor' ? '👨‍⚕️ You (Doctor)' : '👤 You (Patient)')
                      : (messageSenderType === 'doctor' ? '👨‍⚕️ Doctor' : '👤 Patient')
                    }
                  </span>
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
          placeholder={isDoctor ? "Type your reply..." : "Type your message..."}
          className="chat-input"
          disabled={sending}
        />
        <button
          type="submit"
          className="send-btn"
          disabled={sending || !newMessage.trim()}
        >
          {sending ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  )
}

export default SimpleChat

