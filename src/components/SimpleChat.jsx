import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { consultationService } from '../services/consultationService'
import MedicationRecommendationCard from './MedicationRecommendationCard'
import MedicationRecommendationForm from './MedicationRecommendationForm'
import './SimpleChat.css'

function SimpleChat({ user, onBack, sessionId, isDoctor, otherUserInfo, onMedicationAccepted, session, onConsultationComplete }) {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [recommendedMedications, setRecommendedMedications] = useState([])
  const [showRecommendForm, setShowRecommendForm] = useState(false)
  const [pharmacistUserId, setPharmacistUserId] = useState(null)
  const [pharmacistInfo, setPharmacistInfo] = useState(null) // 存储药剂师信息（名字等）
  const messagesEndRef = useRef(null)
  const channelRef = useRef(null)

  useEffect(() => {
    if (!sessionId || !supabase) return

    let isMounted = true
    let pollInterval = null
    let lastMessageTimestamp = null

    // 初始加载
    const initializeChat = async () => {
      await Promise.all([
        loadMessages(),
        loadRecommendedMedications(),
        loadPharmacistInfo()
      ])
      
      // 记录最后一条消息的时间戳
      const { data: messages } = await supabase
        .from('consultation_messages')
        .select('created_at')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      
      if (messages?.created_at) {
        lastMessageTimestamp = messages.created_at
      }
    }
    initializeChat()

    // 轮询函数（作为 Realtime 的后备方案）
    const pollForNewMessages = async () => {
      if (!isMounted) return
      
      try {
        let query = supabase
          .from('consultation_messages')
          .select('*')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: true })
        
        // 如果有最后一条消息的时间戳，只获取新消息
        if (lastMessageTimestamp) {
          query = query.gt('created_at', lastMessageTimestamp)
        }
        
        const { data: newMessages, error } = await query
        
        if (error) {
          console.error(`[SimpleChat-${isDoctor ? 'Doctor' : 'Patient'}] Poll error:`, error)
          return
        }
        
        if (newMessages && newMessages.length > 0) {
          console.log(`[SimpleChat-${isDoctor ? 'Doctor' : 'Patient'}] Poll found ${newMessages.length} new messages`)
          
          // 更新最后一条消息的时间戳
          lastMessageTimestamp = newMessages[newMessages.length - 1].created_at
          
          // 添加新消息到列表
          setMessages(prev => {
            const existingIds = new Set(prev.map(m => m.id))
            const trulyNew = newMessages.filter(m => !existingIds.has(m.id))
            
            if (trulyNew.length === 0) return prev
            
            const updated = [...prev, ...trulyNew].sort((a, b) => 
              new Date(a.created_at) - new Date(b.created_at)
            )
            return updated
          })
          
          // 检查是否有药物推荐消息
          const hasMedicationRecommendation = newMessages.some(m => m.message_type === 'medication_recommendation')
          if (hasMedicationRecommendation) {
            setTimeout(() => {
              loadRecommendedMedications()
            }, 200)
          }
        }
      } catch (error) {
        console.error(`[SimpleChat-${isDoctor ? 'Doctor' : 'Patient'}] Poll exception:`, error)
      }
    }

    // 启动轮询（每 2 秒检查一次新消息）
    pollInterval = setInterval(pollForNewMessages, 2000)

    // Subscribe to realtime updates for messages
    const channelName = `chat:${sessionId}`
    const messagesChannel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'consultation_messages',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          console.log(`[SimpleChat-${isDoctor ? 'Doctor' : 'Patient'}] 🔔 Realtime message INSERT received:`, payload)
          
          if (!isMounted) return
          
          // 立即添加消息到列表（不等待数据库查询）
          if (payload.new) {
            // 更新最后一条消息的时间戳
            lastMessageTimestamp = payload.new.created_at
            
            handleNewMessage(payload.new)
            
            // 如果是药物推荐消息，延迟加载药物列表以确保数据已创建
            if (payload.new.message_type === 'medication_recommendation') {
              console.log(`[SimpleChat-${isDoctor ? 'Doctor' : 'Patient'}] Medication recommendation message detected`)
              setTimeout(() => {
                loadRecommendedMedications()
                loadMessages()
              }, 200)
              setTimeout(() => {
                loadRecommendedMedications()
                loadMessages()
              }, 500)
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'consultation_messages',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          console.log(`[SimpleChat-${isDoctor ? 'Doctor' : 'Patient'}] Realtime message UPDATE received:`, payload)
          if (!isMounted) return
          
          if (payload.new) {
            // 更新现有消息
            setMessages(prev => prev.map(msg => 
              msg.id === payload.new.id ? payload.new : msg
            ))
          }
        }
      )
      .subscribe((status) => {
        console.log(`[SimpleChat-${isDoctor ? 'Doctor' : 'Patient'}] Messages subscription status:`, status)
        if (status === 'SUBSCRIBED') {
          console.log(`[SimpleChat-${isDoctor ? 'Doctor' : 'Patient'}] ✅ Successfully subscribed to messages for session ${sessionId}`)
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`[SimpleChat-${isDoctor ? 'Doctor' : 'Patient'}] ❌ Messages subscription error - will use polling`)
        } else if (status === 'TIMED_OUT') {
          console.warn(`[SimpleChat-${isDoctor ? 'Doctor' : 'Patient'}] ⚠️ Messages subscription timed out - will use polling`)
        } else if (status === 'CLOSED') {
          console.warn(`[SimpleChat-${isDoctor ? 'Doctor' : 'Patient'}] ⚠️ Messages subscription closed - will use polling`)
        }
      })

    // Subscribe to realtime updates for medications
    const medicationsChannelName = `medications:${sessionId}`
    const medicationsChannel = supabase
      .channel(medicationsChannelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'consultation_medications',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          console.log(`[SimpleChat-${isDoctor ? 'Doctor' : 'Patient'}] Medication INSERT detected:`, payload)
          if (!isMounted) return
          
          if (payload.new) {
            // 立即更新药物列表
            setRecommendedMedications(prev => {
              const exists = prev.some(m => m.id === payload.new.id)
              if (exists) return prev
              return [...prev, payload.new]
            })
            
            // 延迟重新加载以确保数据完整
            setTimeout(() => {
              loadRecommendedMedications()
              loadMessages()
            }, 300)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'consultation_medications',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          console.log(`[SimpleChat-${isDoctor ? 'Doctor' : 'Patient'}] Medication UPDATE detected:`, payload)
          if (!isMounted) return
          
          if (payload.new) {
            // 更新现有药物状态
            setRecommendedMedications(prev => prev.map(m => 
              m.id === payload.new.id ? payload.new : m
            ))
            
            // 如果状态改变（如 accepted/rejected），重新加载消息
            if (payload.old?.status !== payload.new?.status) {
              setTimeout(() => {
                loadMessages()
              }, 200)
            }
          }
        }
      )
      .subscribe((status) => {
        console.log(`[SimpleChat-${isDoctor ? 'Doctor' : 'Patient'}] Medications subscription status:`, status)
        if (status === 'SUBSCRIBED') {
          console.log(`[SimpleChat-${isDoctor ? 'Doctor' : 'Patient'}] ✅ Successfully subscribed to medications for session ${sessionId}`)
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`[SimpleChat-${isDoctor ? 'Doctor' : 'Patient'}] ❌ Medications subscription error`)
        }
      })

    channelRef.current = { messages: messagesChannel, medications: medicationsChannel }

    return () => {
      isMounted = false
      console.log(`[SimpleChat-${isDoctor ? 'Doctor' : 'Patient'}] Cleaning up subscriptions for session:`, sessionId)
      
      if (pollInterval) {
        clearInterval(pollInterval)
      }
      
      if (messagesChannel) {
        messagesChannel.unsubscribe()
      }
      if (medicationsChannel) {
        medicationsChannel.unsubscribe()
      }
    }
  }, [sessionId, isDoctor, user?.id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 调试：监听消息变化
  useEffect(() => {
    console.log(`[SimpleChat-${isDoctor ? 'Doctor' : 'Patient'}] Messages updated, count:`, messages.length, 'Session:', sessionId)
  }, [messages, isDoctor, sessionId])

  const loadMessages = async () => {
    try {
      setLoading(true)
      console.log(`[SimpleChat-${isDoctor ? 'Doctor' : 'Patient'}] Loading messages for session:`, sessionId)
      const { data, error } = await supabase
        .from('consultation_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error(`[SimpleChat-${isDoctor ? 'Doctor' : 'Patient'}] Error loading messages:`, error)
        throw error
      }
      
      console.log(`[SimpleChat-${isDoctor ? 'Doctor' : 'Patient'}] Loaded ${data?.length || 0} messages`)
      setMessages(data || [])
    } catch (error) {
      console.error(`[SimpleChat-${isDoctor ? 'Doctor' : 'Patient'}] Error loading messages:`, error)
    } finally {
      setLoading(false)
    }
  }

  const loadRecommendedMedications = async () => {
    try {
      console.log(`[SimpleChat-${isDoctor ? 'Doctor' : 'Patient'}] Loading recommended medications for session:`, sessionId)
      const { data, error } = await supabase
        .from('consultation_medications')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error(`[SimpleChat-${isDoctor ? 'Doctor' : 'Patient'}] Error loading medications:`, error)
        throw error
      }
      
      console.log(`[SimpleChat-${isDoctor ? 'Doctor' : 'Patient'}] Loaded ${data?.length || 0} recommended medications:`, data)
      setRecommendedMedications(data || [])
    } catch (error) {
      console.error(`[SimpleChat-${isDoctor ? 'Doctor' : 'Patient'}] Error loading recommended medications:`, error)
    }
  }

  const loadPharmacistInfo = async () => {
    // 加载药剂师信息（名字等）
    if (!session?.doctor_id) return
    
    try {
      const { data: doctorData, error } = await supabase
        .from('doctors')
        .select('id, name, user_id')
        .eq('id', session.doctor_id)
        .single()
      
      if (error) {
        console.error('[SimpleChat] Error loading pharmacist info:', error)
        return
      }
      
      if (doctorData) {
        setPharmacistInfo(doctorData)
        setPharmacistUserId(doctorData.user_id)
        console.log('[SimpleChat] Loaded pharmacist info:', doctorData)
      }
    } catch (error) {
      console.error('[SimpleChat] Error loading pharmacist info:', error)
    }
  }

  // loadPharmacistUserId 已被 loadPharmacistInfo 替代，保留用于兼容性
  const loadPharmacistUserId = async () => {
    // 这个函数已经被 loadPharmacistInfo 替代
    // 如果 session 没有 doctor_id，尝试从 sessionId 加载
    if (!session?.doctor_id && sessionId) {
      try {
        const { data: sessionData } = await supabase
          .from('consultation_sessions')
          .select('doctor_id')
          .eq('id', sessionId)
          .single()
        
        if (sessionData?.doctor_id) {
          const { data: doctorData } = await supabase
            .from('doctors')
            .select('id, name, user_id')
            .eq('id', sessionData.doctor_id)
            .single()
          
          if (doctorData) {
            setPharmacistInfo(doctorData)
            setPharmacistUserId(doctorData.user_id)
          }
        }
      } catch (error) {
        console.error('[SimpleChat] Error loading pharmacist from sessionId:', error)
      }
    }
  }

  const handleAcceptMedication = async (medication) => {
    try {
      console.log(`[SimpleChat-${isDoctor ? 'Doctor' : 'Patient'}] Accepting medication:`, medication)
      await consultationService.acceptMedication(medication.id)
      
      // 重新加载药物列表（状态会更新为 accepted）
      await loadRecommendedMedications()
      
      // 重新加载消息以更新显示
      await loadMessages()
      
      // 通知父组件，添加到购物车
      if (onMedicationAccepted) {
        onMedicationAccepted({
          medication_id: medication.medication_id,
          medication_name: medication.medication_name,
          dosage: medication.dosage,
          frequency: medication.frequency,
          price: 0 // 需要从medications表获取
        })
      }
      
      alert('Medication accepted and added to cart!')
    } catch (error) {
      console.error(`[SimpleChat-${isDoctor ? 'Doctor' : 'Patient'}] Error accepting medication:`, error)
      alert(`Failed to accept medication: ${error.message}`)
    }
  }

  const handleRejectMedication = async (medicationId, notes) => {
    try {
      console.log(`[SimpleChat-${isDoctor ? 'Doctor' : 'Patient'}] Rejecting medication:`, medicationId, notes)
      await consultationService.rejectMedication(medicationId, notes)
      // 重新加载药物列表和消息
      await loadRecommendedMedications()
      await loadMessages()
      alert('Medication rejected')
    } catch (error) {
      console.error(`[SimpleChat-${isDoctor ? 'Doctor' : 'Patient'}] Error rejecting medication:`, error)
      alert(`Failed to reject medication: ${error.message}`)
    }
  }

  const handleEndConsultation = async () => {
    console.log('[SimpleChat] handleEndConsultation called', { isDoctor, sessionId, onConsultationComplete: !!onConsultationComplete })
    
    // 如果是患者，检查是否有接受的药物
    if (!isDoctor) {
      console.log('[SimpleChat] Checking for accepted medications...')
      const { data: acceptedMedications, error } = await supabase
        .from('consultation_medications')
        .select('id, status')
        .eq('session_id', sessionId)
        .eq('status', 'accepted')

      console.log('[SimpleChat] Accepted medications query result:', { acceptedMedications, error })

      if (error) {
        console.error('[SimpleChat] Error checking accepted medications:', error)
      }

      if (acceptedMedications && acceptedMedications.length > 0) {
        console.log('[SimpleChat] Found accepted medications, calling onConsultationComplete', {
          acceptedCount: acceptedMedications.length,
          hasCallback: !!onConsultationComplete,
          callbackType: typeof onConsultationComplete
        })
        // 有接受的药物，调用完成回调（会显示确认页面）
        if (onConsultationComplete && typeof onConsultationComplete === 'function') {
          console.log('[SimpleChat] Calling onConsultationComplete callback')
          try {
            onConsultationComplete()
            return
          } catch (error) {
            console.error('[SimpleChat] Error calling onConsultationComplete:', error)
            alert('Error completing consultation: ' + error.message)
            return
          }
        } else {
          console.warn('[SimpleChat] onConsultationComplete callback is not provided or not a function!', {
            onConsultationComplete,
            type: typeof onConsultationComplete
          })
          // 即使没有回调，也尝试直接跳转（作为后备方案）
          alert('Please refresh the page and try again.')
        }
      } else {
        console.log('[SimpleChat] No accepted medications found, will show confirmation dialog')
      }
    }

    // 如果没有接受的药物，或者用户确认结束，执行结束流程
    if (!confirm('Are you sure you want to end this consultation?')) {
      return
    }

    try {
      // 获取队列ID
      const { data: session } = await supabase
        .from('consultation_sessions')
        .select('queue_id')
        .eq('id', sessionId)
        .single()

      if (session?.queue_id) {
        await consultationService.endConsultation(sessionId, session.queue_id)
      }

      alert('Consultation ended')
      if (onBack) {
        onBack()
      }
    } catch (error) {
      console.error('Error ending consultation:', error)
      alert(`Failed to end consultation: ${error.message}`)
    }
  }

  const handleNewMessage = (message) => {
    if (!message || !message.id) {
      console.warn('[SimpleChat] Invalid message received:', message)
      return
    }
    
    console.log(`[SimpleChat-${isDoctor ? 'Doctor' : 'Patient'}] New message received via realtime:`, {
      id: message.id,
      sender_id: message.sender_id,
      sender_type: message.sender_type,
      message_type: message.message_type,
      content_preview: message.content?.substring(0, 50)
    })
    
    setMessages(prev => {
      const exists = prev.some(msg => msg.id === message.id)
      if (exists) {
        console.log(`[SimpleChat-${isDoctor ? 'Doctor' : 'Patient'}] Message ${message.id} already exists, skipping`)
        return prev
      }
      console.log(`[SimpleChat-${isDoctor ? 'Doctor' : 'Patient'}] ✅ Adding new message ${message.id} to list`)
      // 按时间排序插入
      const newMessages = [...prev, message].sort((a, b) => 
        new Date(a.created_at) - new Date(b.created_at)
      )
      return newMessages
    })
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    try {
      setSending(true)
      const senderType = isDoctor ? 'doctor' : 'patient'

      console.log('[SimpleChat] Sending message:', {
        sessionId,
        senderId: user.id,
        senderType,
        content: newMessage.trim()
      })

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

      if (error) {
        console.error('[SimpleChat] Error sending message:', error)
        alert(`Failed to send message: ${error.message || 'Please check console for details.'}`)
        return
      }

      console.log(`[SimpleChat-${isDoctor ? 'Doctor' : 'Patient'}] Message sent successfully:`, data)
      
      // 立即添加消息到列表（优化用户体验，不等待实时更新）
      if (data) {
        setMessages(prev => {
          const exists = prev.some(msg => msg.id === data.id)
          if (exists) {
            console.log(`[SimpleChat-${isDoctor ? 'Doctor' : 'Patient'}] Message already in list, skipping`)
            return prev
          }
          console.log(`[SimpleChat-${isDoctor ? 'Doctor' : 'Patient'}] ✅ Immediately adding sent message to list`)
          // 按时间排序插入
          const newMessages = [...prev, data].sort((a, b) => 
            new Date(a.created_at) - new Date(b.created_at)
          )
          return newMessages
        })
      }
      
      setNewMessage('')
      
      // 触发滚动到底部
      setTimeout(() => {
        scrollToBottom()
      }, 100)
    } catch (error) {
      console.error('[SimpleChat] Exception sending message:', error)
      alert(`Failed to send message: ${error.message || 'Please try again.'}`)
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
              : `Pharmacist: ${pharmacistInfo?.name || otherUserInfo?.name || session?.doctor?.name || 'Pharmacist'}`
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
            // - If current user is pharmacist: pharmacist's messages on right, patient's on left
            // - If current user is patient: patient's messages on right, pharmacist's on left
            const isOwnMessage = (isDoctor && messageSenderType === 'doctor') || (!isDoctor && messageSenderType === 'patient')
            
            // 检查是否是药物推荐消息
            if (message.message_type === 'medication_recommendation') {
              try {
                const medicationData = JSON.parse(message.content)
                console.log('[SimpleChat] Medication recommendation message:', medicationData)
                console.log('[SimpleChat] Available medications:', recommendedMedications)
                
                // 尝试通过 medication_id 或 id 查找
                // medicationData.medication_id 是 consultation_medications 表的 id
                const medication = recommendedMedications.find(m => 
                  m.id === medicationData.medication_id || 
                  m.medication_id === medicationData.medication_id ||
                  m.id === medicationData.id
                )
                
                console.log('[SimpleChat] Found medication:', medication)
                
                if (medication) {
                  return (
                    <div
                      key={message.id}
                      className={`message ${isOwnMessage ? 'own-message' : 'other-message'}`}
                    >
                      <div className="message-content">
                        <span className="message-sender">
                          {messageSenderType === 'doctor' ? '👨‍⚕️ Pharmacist' : '👤 Patient'}
                        </span>
                        <MedicationRecommendationCard
                          medication={medication}
                          onAccept={handleAcceptMedication}
                          onReject={handleRejectMedication}
                          isDoctor={isDoctor}
                        />
                        <span className="message-time">{formatTime(message.created_at)}</span>
                      </div>
                    </div>
                  )
                } else {
                  // 如果找不到药物，显示原始消息内容
                  console.warn('[SimpleChat] Medication not found in list, showing as text')
                  return (
                    <div
                      key={message.id}
                      className={`message ${isOwnMessage ? 'own-message' : 'other-message'}`}
                    >
                      <div className="message-content">
                        <span className="message-sender">
                          {messageSenderType === 'doctor' ? '👨‍⚕️ Pharmacist' : '👤 Patient'}
                        </span>
                        <p>💊 Medication Recommendation: {medicationData.medication_name || 'Loading...'}</p>
                        <span className="message-time">{formatTime(message.created_at)}</span>
                      </div>
                    </div>
                  )
                }
              } catch (error) {
                console.error('[SimpleChat] Error parsing medication recommendation:', error)
              }
            }
            
            return (
              <div
                key={message.id}
                className={`message ${isOwnMessage ? 'own-message' : 'other-message'}`}
              >
                <div className="message-content">
                  <span className="message-sender">
                    {isFromCurrentUser 
                      ? (messageSenderType === 'doctor' ? '👨‍⚕️ You (Pharmacist)' : '👤 You (Patient)')
                      : (messageSenderType === 'doctor' ? '👨‍⚕️ Pharmacist' : '👤 Patient')
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

      <div className="chat-actions">
        {isDoctor && (
          <button
            className="recommend-medication-btn"
            onClick={() => setShowRecommendForm(true)}
          >
            💊 Recommend Medication
          </button>
        )}
        <button
          className="end-consultation-btn"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            console.log('[SimpleChat] End consultation button clicked')
            handleEndConsultation()
          }}
        >
          {!isDoctor && recommendedMedications.some(m => m.status === 'accepted')
            ? '✓ Complete Consultation & Review Medications'
            : 'End Consultation'}
        </button>
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

      {showRecommendForm && isDoctor && (
        <MedicationRecommendationForm
          sessionId={sessionId}
          pharmacistId={pharmacistUserId || user.id}
          onRecommend={async () => {
            setShowRecommendForm(false)
            // 延迟加载以确保数据已创建
            setTimeout(() => {
              loadRecommendedMedications()
              loadMessages() // 重新加载消息以显示推荐卡片
            }, 300)
          }}
          onCancel={() => setShowRecommendForm(false)}
        />
      )}
    </div>
  )
}

export default SimpleChat

