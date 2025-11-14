import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import './ConsultationChat.css'

function ConsultationChat({ session, user, onClose }) {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [isDoctor, setIsDoctor] = useState(false)
  const messagesEndRef = useRef(null)
  const channelRef = useRef(null)

  // Check if user is a doctor
  useEffect(() => {
    const checkDoctorStatus = async () => {
      if (!user?.id || !session?.doctor_id) {
        setIsDoctor(false)
        console.log('[ConsultationChat] Not a doctor: missing user or doctor_id', { userId: user?.id, doctorId: session?.doctor_id })
        return
      }

      try {
        // Check if user is the doctor for this session
        const { data: doctorData, error } = await supabase
          .from('doctors')
          .select('id, user_id')
          .eq('id', session.doctor_id)
          .single()

        if (error) {
          console.error('[ConsultationChat] Error fetching doctor:', error)
          setIsDoctor(false)
          return
        }

        if (doctorData) {
          const isUserDoctor = doctorData.user_id === user.id
          setIsDoctor(isUserDoctor)
          console.log('[ConsultationChat] Doctor status checked:', { 
            isDoctor: isUserDoctor, 
            doctorUserId: doctorData.user_id, 
            currentUserId: user.id,
            doctorId: doctorData.id 
          })
        } else {
          setIsDoctor(false)
          console.log('[ConsultationChat] Doctor not found for session')
        }
      } catch (error) {
        console.error('[ConsultationChat] Error checking doctor status:', error)
        setIsDoctor(false)
      }
    }

    checkDoctorStatus()
  }, [user?.id, session?.doctor_id])

  const isPatient = session?.patient_id === user?.id
  
  // Debug logging
  useEffect(() => {
    console.log('[ConsultationChat] User status:', {
      userId: user?.id,
      isPatient,
      isDoctor,
      patientId: session?.patient_id,
      doctorId: session?.doctor_id
    })
  }, [user?.id, isPatient, isDoctor, session?.patient_id, session?.doctor_id])

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
      
      console.log('[ConsultationChat] Loaded messages:', {
        messageCount: data?.length || 0,
        currentUserId: user?.id,
        messages: data?.map(msg => ({
          id: msg.id,
          sender_id: msg.sender_id,
          sender_type: msg.sender_type,
          content: msg.content.substring(0, 20) + '...',
          isOwn: msg.sender_id === user?.id
        }))
      })
      
      setMessages(data || [])
    } catch (error) {
      console.error('[ConsultationChat] Error loading messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleNewMessage = (message) => {
    console.log('[ConsultationChat] New message received:', {
      messageId: message.id,
      senderId: message.sender_id,
      senderType: message.sender_type,
      currentUserId: user?.id,
      isOwn: message.sender_id === user?.id,
      content: message.content.substring(0, 30) + '...'
    })
    
    setMessages(prev => {
      // Check if message already exists (avoid duplicates)
      const exists = prev.some(msg => msg.id === message.id)
      if (exists) {
        console.log('[ConsultationChat] Message already exists, skipping')
        return prev
      }
      return [...prev, message]
    })
    
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

    // Check permissions
    if (!isPatient && !isDoctor) {
      alert('You do not have permission to send messages in this consultation.')
      console.error('[ConsultationChat] Permission denied:', { isPatient, isDoctor, userId: user?.id })
      return
    }

    try {
      setSending(true)
      const senderType = isDoctor ? 'doctor' : 'patient'
      
      console.log('[ConsultationChat] Sending message:', {
        userId: user.id,
        senderType,
        isDoctor,
        isPatient,
        sessionId: session.id,
        content: newMessage.trim()
      })

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

      if (error) {
        console.error('[ConsultationChat] Error sending message:', error)
        throw error
      }
      
      console.log('[ConsultationChat] Message sent successfully:', data)

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
      alert(`Failed to send message: ${error.message || 'Unknown error'}. Please check the console for details.`)
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
            // CRITICAL: Check if message is from current user
            const isOwnMessage = message.sender_id === user?.id
            
            // Determine sender type for display
            let messageSenderType = message.sender_type
            if (!messageSenderType) {
              // Fallback: if sender_id matches patient_id, it's a patient
              // if sender_id matches doctor's user_id, it's a doctor
              if (message.sender_id === session?.patient_id) {
                messageSenderType = 'patient'
              } else {
                // Check if sender is the doctor
                messageSenderType = 'doctor'
              }
            }
            
            // Debug log for message display (only log first few to avoid spam)
            if (messages.indexOf(message) < 3) {
              console.log('[ConsultationChat] Rendering message:', {
                messageId: message.id,
                senderId: message.sender_id,
                currentUserId: user?.id,
                patientId: session?.patient_id,
                senderType: message.sender_type,
                isOwnMessage,
                isDoctor,
                isPatient,
                messageContent: message.content.substring(0, 20)
              })
            }
            
            return (
              <div
                key={message.id}
                className={`message ${isOwnMessage ? 'own-message' : 'other-message'}`}
              >
                <div className="message-content">
                  <span className="message-sender">
                    {isOwnMessage 
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
          disabled={sending || session.status === 'completed' || (!isPatient && !isDoctor)}
        />
        <button
          type="submit"
          className="send-btn"
          disabled={sending || !newMessage.trim() || session.status === 'completed' || (!isPatient && !isDoctor)}
        >
          {sending ? 'Sending...' : 'Send'}
        </button>
      </form>
      {!isPatient && !isDoctor && (
        <div className="chat-warning">
          <p>⚠️ You don't have permission to send messages in this consultation.</p>
        </div>
      )}
    </div>
  )
}

export default ConsultationChat

