import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { consultationService } from '../services/consultationService'
import './ConsultationWaiting.css'

function ConsultationWaiting({ user, onMatched, onCancel, symptoms, symptomAssessments, selectedBodyPart, userAge }) {
  const [queue, setQueue] = useState(null)
  const [loading, setLoading] = useState(true)
  const [position, setPosition] = useState(null)
  const [estimatedWait, setEstimatedWait] = useState(null)
  const [onlinePharmacists, setOnlinePharmacists] = useState(0)

  // 初始化：检查现有队列或创建新队列
  useEffect(() => {
    if (!user) return

    console.log('[ConsultationWaiting] Component mounted, user:', user.id)
    initializeQueue()
  }, [user])

  // 初始化队列逻辑
  const initializeQueue = async () => {
    try {
      setLoading(true)

      // 步骤 1: 检查是否有已匹配且有活跃会话的队列（可以进入聊天）
      const { data: activeQueue } = await supabase
        .from('consultation_queue')
        .select('*')
        .eq('patient_id', user.id)
        .in('status', ['matched', 'in_consultation'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (activeQueue) {
        // 检查是否有对应的活跃会话
        const { data: session } = await supabase
          .from('consultation_sessions')
          .select('id, status')
          .eq('queue_id', activeQueue.id)
          .eq('status', 'active')
          .maybeSingle()

        if (session && session.status === 'active') {
          // 有活跃会话，直接进入聊天
          console.log('[ConsultationWaiting] Found active session, entering chat')
          if (onMatched) {
            onMatched(activeQueue)
          }
          return
        } else {
          // 队列已匹配但没有活跃会话，取消它（可能是旧数据）
          console.log('[ConsultationWaiting] Active queue without active session, cancelling')
          await supabase
            .from('consultation_queue')
            .update({ status: 'cancelled' })
            .eq('id', activeQueue.id)
        }
      }

      // 步骤 2: 检查是否有等待中的队列
      const { data: waitingQueue } = await supabase
        .from('consultation_queue')
        .select('*')
        .eq('patient_id', user.id)
        .eq('status', 'waiting')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (waitingQueue) {
        // 使用现有等待队列
        console.log('[ConsultationWaiting] Found waiting queue:', waitingQueue.id)
        setQueue(waitingQueue)
        setLoading(false)
        loadOnlinePharmacistsCount()
        return
      }

      // 步骤 3: 创建新队列
      console.log('[ConsultationWaiting] No existing queue, creating new queue')
      await createQueue()
    } catch (error) {
      console.error('[ConsultationWaiting] Error initializing queue:', error)
      alert(`Failed to initialize queue: ${error.message}`)
      setLoading(false)
    }
  }

  // 创建新队列
  const createQueue = async () => {
    try {
      const notes = JSON.stringify({
        symptomAssessments: symptomAssessments || {},
        selectedBodyPart: selectedBodyPart || null,
        userAge: userAge || null
      })
      
      const data = await consultationService.createQueue(
        user.id,
        symptoms || [],
        notes
      )

      console.log('[ConsultationWaiting] Queue created:', data.id, 'status:', data.status)
      setQueue(data)
      loadOnlinePharmacistsCount()
    } catch (error) {
      console.error('Error creating queue:', error)
      alert(`Failed to join queue: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // 订阅队列状态变化和会话创建
  useEffect(() => {
    if (!queue?.id) return

    console.log('[ConsultationWaiting] Setting up subscriptions for queue:', queue.id)

    // 订阅队列状态变化
    const queueChannel = supabase
      .channel(`queue:${queue.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'consultation_queue',
          filter: `id=eq.${queue.id}`
        },
        async (payload) => {
          const updatedQueue = payload.new
          console.log('[ConsultationWaiting] Queue updated:', updatedQueue.status)
          setQueue(updatedQueue)
          
          // 只有当队列状态变为 'matched' 或 'in_consultation' 时，检查是否有活跃会话
          if (updatedQueue.status === 'matched' || updatedQueue.status === 'in_consultation') {
            await checkAndEnterChat(updatedQueue)
          }
        }
      )
      .subscribe()

    // 订阅会话创建（当药剂师接受时）
    const sessionChannel = supabase
      .channel(`sessions:queue:${queue.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'consultation_sessions',
          filter: `queue_id=eq.${queue.id}`
        },
        async (payload) => {
          const newSession = payload.new
          console.log('[ConsultationWaiting] New session created:', newSession.id)
          
          // 检查队列状态
          const { data: currentQueue } = await supabase
            .from('consultation_queue')
            .select('*')
            .eq('id', queue.id)
            .single()
          
          if (currentQueue && (currentQueue.status === 'matched' || currentQueue.status === 'in_consultation')) {
            await checkAndEnterChat(currentQueue)
          }
        }
      )
      .subscribe()

    // 加载队列信息
    loadQueueInfo()

    // 定期更新队列信息
    const interval = setInterval(() => {
      loadQueueInfo()
      loadOnlinePharmacistsCount()
    }, 5000)

    return () => {
      queueChannel.unsubscribe()
      sessionChannel.unsubscribe()
      clearInterval(interval)
    }
  }, [queue?.id])

  // 检查并进入聊天（只有确认有活跃会话时才进入）
  const checkAndEnterChat = async (queueToCheck) => {
    try {
      // 检查是否有对应的活跃会话
      const { data: session } = await supabase
        .from('consultation_sessions')
        .select('id, status')
        .eq('queue_id', queueToCheck.id)
        .eq('status', 'active')
        .maybeSingle()

      if (session && session.status === 'active') {
        // 确认有活跃会话，说明药剂师已接受，可以进入聊天
        console.log('[ConsultationWaiting] Active session confirmed, entering chat')
        if (onMatched) {
          onMatched(queueToCheck)
        }
      } else {
        console.log('[ConsultationWaiting] Queue matched but no active session yet, continuing to wait')
        // 继续等待，会话可能还在创建中
      }
    } catch (error) {
      console.error('[ConsultationWaiting] Error checking session:', error)
    }
  }

  // 加载在线药剂师数量
  const loadOnlinePharmacistsCount = async () => {
    try {
      const { count, error: countError } = await supabase
        .from('pharmacist_availability')
        .select('*', { count: 'exact', head: true })
        .eq('is_online', true)
        .eq('is_busy', false)

      if (!countError && count !== null) {
        setOnlinePharmacists(count)
        return
      }

      // 备用查询
      const { data: pharmacists, error: altError } = await supabase
        .from('pharmacist_availability')
        .select('id')
        .eq('is_online', true)
        .eq('is_busy', false)
      
      if (!altError && pharmacists) {
        setOnlinePharmacists(pharmacists.length)
      } else {
        setOnlinePharmacists(0)
      }
    } catch (error) {
      console.error('Error loading online pharmacists count:', error)
      setOnlinePharmacists(0)
    }
  }

  // 加载队列信息（位置、等待时间）
  const loadQueueInfo = async () => {
    if (!queue?.id) return

    try {
      // 只计算 'waiting' 状态的队列位置
      const { data: waitingQueues, error } = await supabase
        .from('consultation_queue')
        .select('id, created_at')
        .eq('status', 'waiting')
        .order('created_at', { ascending: true })

      if (error) throw error

      const currentIndex = waitingQueues.findIndex(q => q.id === queue.id)
      if (currentIndex !== -1) {
        setPosition(currentIndex + 1)
        // 计算预计等待时间（假设每个咨询平均5分钟）
        const estimatedMinutes = (currentIndex + 1) * 5
        setEstimatedWait(estimatedMinutes)
      } else {
        // 如果不在等待队列中，说明可能已被匹配
        setPosition(null)
        setEstimatedWait(null)
      }
    } catch (error) {
      console.error('Error loading queue info:', error)
    }
  }

  // 取消队列
  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel? You will lose your position in the queue.')) {
      return
    }

    try {
      if (queue?.id) {
        await supabase
          .from('consultation_queue')
          .update({ status: 'cancelled' })
          .eq('id', queue.id)
      }

      if (onCancel) {
        onCancel()
      }
    } catch (error) {
      console.error('Error cancelling queue:', error)
      alert('Failed to cancel queue')
    }
  }

  if (loading) {
    return (
      <div className="consultation-waiting">
        <div className="loading-spinner">Loading...</div>
      </div>
    )
  }

  return (
    <div className="consultation-waiting">
      <div className="waiting-container">
        <div className="waiting-header">
          <div className="waiting-icon">⏳</div>
          <h2>Waiting for Pharmacist</h2>
          <p className="waiting-subtitle">A pharmacist will review your request and accept your consultation</p>
        </div>

        <div className="waiting-info">
          <div className="info-card">
            <div className="info-label">Your Position</div>
            <div className="info-value">
              {position !== null ? `#${position}` : 'Calculating...'}
            </div>
          </div>

          <div className="info-card">
            <div className="info-label">Estimated Wait</div>
            <div className="info-value">
              {estimatedWait !== null ? `${estimatedWait} min` : 'Calculating...'}
            </div>
          </div>

          <div className="info-card">
            <div className="info-label">Online Pharmacists</div>
            <div className="info-value">{onlinePharmacists}</div>
          </div>
        </div>

        <div className="waiting-animation">
          <div className="pulse-circle"></div>
          <div className="pulse-circle"></div>
          <div className="pulse-circle"></div>
        </div>

        <div className="waiting-message">
          <p>Please wait while a pharmacist reviews your consultation request...</p>
          <p className="waiting-tip">You will be notified when a pharmacist accepts your request.</p>
        </div>

        <button className="cancel-button" onClick={handleCancel}>
          Cancel
        </button>
      </div>
    </div>
  )
}

export default ConsultationWaiting
